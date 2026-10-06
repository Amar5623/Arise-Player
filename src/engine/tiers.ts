import { HABITS } from '@/data/habits';
import { addDays, diffDays } from '@/lib/dates';
import type { DayRecord, HabitConfig, ISODate } from './types';

export const TIER_WINDOW = 7;
export const MIN_APPEARANCES = 4;
export const TIER_UP = 0.85;
export const TIER_DOWN = 0.4;

export interface TierChange {
  id: string;
  from: number;
  to: number;
  rate: number;
}

/**
 * Daily habit-tier evaluation (brief §7). For each enabled tiered habit whose `since` is at least
 * 7 days ago, look at the 7 days before today. A day without a record, or with the quest undone,
 * counts as appeared-but-not-done. Needs 4+ appearances. ≥85% raises a tier; <40% lowers one.
 */
export function evaluateTiers(
  today: ISODate,
  habits: readonly HabitConfig[],
  records: ReadonlyMap<ISODate, DayRecord>,
  joinedAt: ISODate,
): { habits: HabitConfig[]; changes: TierChange[] } {
  const changes: TierChange[] = [];
  const next = habits.map((cfg) => {
    const def = HABITS.find((h) => h.id === cfg.id);
    if (!def?.tiers || !cfg.enabled) return cfg;
    if (diffDays(cfg.since, today) < TIER_WINDOW) return cfg;

    let appeared = 0;
    let done = 0;
    for (let i = TIER_WINDOW; i >= 1; i--) {
      const date = addDays(today, -i);
      if (date < joinedAt) continue;
      const rec = records.get(date);
      const quest = rec?.quests.find((q) => q.habitId === cfg.id);
      if (rec && !quest) continue; // the habit was not on that day's list
      appeared += 1;
      if (quest?.done) done += 1;
    }
    if (appeared < MIN_APPEARANCES) return cfg;

    const rate = done / appeared;
    const max = def.tiers.length;
    let tier = cfg.tier;
    if (rate >= TIER_UP && tier < max) tier += 1;
    else if (rate < TIER_DOWN && tier > 1) tier -= 1;
    if (tier === cfg.tier) return cfg;
    changes.push({ id: cfg.id, from: cfg.tier, to: tier, rate });
    return { ...cfg, tier, since: today };
  });
  return { habits: next, changes };
}
