import {
  habitDef,
  habitXp,
  HABITS,
  isScheduled,
  tierValue,
  type HabitContext,
} from '@/data/habits';
import { REST_DAY } from '@/data/plan';
import { diffDays, weekday } from '@/lib/dates';
import type { Area, HabitConfig, ISODate, Quest } from './types';

export const AREA_ORDER: readonly Area[] = [
  'training',
  'penalty',
  'body',
  'diet',
  'face',
  'mind',
  'wealth',
  'bonus',
];

export const AREA_LABEL: Record<Area, string> = {
  training: 'Training',
  penalty: 'Penalty',
  body: 'Body',
  diet: 'Diet & recovery',
  face: 'Face & looks',
  mind: 'Mind',
  wealth: 'Wealth',
  bonus: 'System bonus',
};

export const PENALTY_QUEST: Omit<Quest, 'done'> = {
  id: 'penalty',
  area: 'penalty',
  stat: 'AGI',
  xp: 10,
  title: '20-min brisk walk',
  detail: 'Yesterday closed under 50%.',
  kind: 'penalty',
};

/** Weigh-in falls on the Monday of every 4th (or 8th) program week, starting week 1. */
export function isWeighDay(date: ISODate, programStart: ISODate, every: number): boolean {
  if (weekday(date) !== 0) return false;
  const d = diffDays(programStart, date);
  if (d < 0) return false;
  return Math.floor(d / 7) % every === 0;
}

export interface BuildDayInput {
  date: ISODate;
  programStart: ISODate;
  weighEvery: number;
  habits: readonly HabitConfig[];
  ctx: HabitContext;
  /** Gate quest title and XP estimate; null on rest days. */
  gate: { title: string; detail: string; xp: number } | null;
  penalty: boolean;
}

/** Today's quest list, in display order. AI quests are added later as the bonus group. */
export function buildDayQuests(input: BuildDayInput): Quest[] {
  const quests: Quest[] = [];
  if (input.gate) {
    quests.push({
      id: 'gate',
      area: 'training',
      stat: 'STR',
      xp: input.gate.xp,
      title: input.gate.title,
      detail: input.gate.detail,
      done: false,
      kind: 'gate',
    });
  } else {
    quests.push({
      id: 'walk',
      area: 'body',
      stat: 'AGI',
      xp: 15,
      title: REST_DAY.walk,
      detail: REST_DAY.walkDetail,
      done: false,
      kind: 'walk',
    });
  }
  if (input.penalty) quests.push({ ...PENALTY_QUEST, done: false });
  if (isWeighDay(input.date, input.programStart, input.weighEvery)) {
    quests.push({
      id: 'weigh',
      area: 'body',
      stat: 'VIT',
      xp: 10,
      title: 'Weigh-in',
      detail: 'Morning, before food. Weight, waist, hips.',
      done: false,
      kind: 'weigh',
    });
  }
  for (const def of HABITS) {
    const cfg = input.habits.find((h) => h.id === def.id);
    if (!cfg?.enabled || !isScheduled(def, input.date)) continue;
    const t = tierValue(def, cfg.tier);
    quests.push({
      id: `habit:${def.id}`,
      area: def.area,
      stat: def.stat,
      xp: habitXp(def, cfg.tier),
      title: def.title(t, input.ctx),
      detail: def.detail(t, input.ctx),
      done: false,
      kind: 'habit',
      habitId: def.id,
      tier: def.tiers ? cfg.tier : undefined,
    });
  }
  return sortQuests(quests);
}

export function sortQuests(quests: readonly Quest[]): Quest[] {
  return [...quests].sort((a, b) => AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area));
}

/**
 * Re-derives habit quests after the library changes, keeping done flags for quests that remain.
 * Gate, penalty, weigh, walk and AI quests are untouched.
 */
export function refreshHabitQuests(existing: readonly Quest[], fresh: readonly Quest[]): Quest[] {
  const keep = existing.filter((q) => q.kind !== 'habit');
  const habits = fresh
    .filter((q) => q.kind === 'habit')
    .map((q) => {
      const prev = existing.find((e) => e.id === q.id);
      return prev ? { ...q, done: prev.done, doneAt: prev.doneAt } : q;
    });
  return sortQuests([...keep, ...habits]);
}

/** Groups in display order, skipping empty ones. */
export function groupQuests(
  quests: readonly Quest[],
): { area: Area; label: string; quests: Quest[] }[] {
  return AREA_ORDER.map((area) => ({
    area,
    label: AREA_LABEL[area],
    quests: quests.filter((q) => q.area === area),
  })).filter((g) => g.quests.length > 0);
}

/** Ratio for streaks and close-out: done / non-optional. A day with nothing required is complete. */
export function dayRatio(quests: readonly Quest[]): number {
  const required = quests.filter((q) => !q.optional);
  if (!required.length) return 1;
  return required.filter((q) => q.done).length / required.length;
}

/** Daily quests a habit selection adds on a typical day: the gate plus daily habits. */
export function dailyLoad(selected: readonly string[]): number {
  return 1 + selected.filter((id) => habitDef(id)?.schedule === 'daily').length;
}

export const LEAN_LIMIT = 12;
