/** XP bookkeeping shared by every command: write events, rebuild the player cache, celebrate. */
import { toast } from '@/app/stores/toasts';
import { useEvents } from '@/app/stores/events';
import { TITLES } from '@/data/titles';
import { summarizeXp, statValues, type XpSummary } from '@/engine/levels';
import { dayRatio } from '@/engine/quests';
import { bestStreak } from '@/engine/streak';
import { newTitles } from '@/engine/titles';
import { STAT_KEYS, type ISODate, type XpDraft, type XpEvent } from '@/engine/types';
import { repo } from '@/db/repos';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function toEvents(date: ISODate, drafts: readonly XpDraft[]): XpEvent[] {
  const at = Date.now();
  return drafts.map((d, i) => ({ ...d, id: uid(), date, at: at + i }));
}

/** Rebuilds the cached Player row from the ledger and records; returns titles earned just now. */
export async function syncPlayer(
  today: ISODate,
): Promise<{ summary: XpSummary; earned: string[] }> {
  const [profile, events, days, sessions, ladders, goals, prev] = await Promise.all([
    repo.profile.get(),
    repo.xp.all(),
    repo.days.map(),
    repo.sessions.count(),
    repo.ladders.all(),
    repo.goals.all(),
    repo.player.get(),
  ]);
  const summary = summarizeXp(events);
  const joined = profile?.joinedAt ?? today;
  const best = bestStreak(days, today, joined);
  const perfectDays = [...days.values()].filter(
    (d) => d.quests.length > 0 && dayRatio(d.quests) === 1,
  ).length;
  const owned = prev?.titles ?? [];
  const earned = newTitles(
    {
      level: summary.level,
      gatesCleared: sessions,
      bestStreak: best,
      perfectDays,
      unlocks: events.filter((e) => e.source === 'unlock' && e.amount > 0).length,
      ladderSteps: { push: ladders.push.step, squat: ladders.squat.step, pull: ladders.pull.step },
      stats: statValues(summary.statXp),
      goalsCleared: goals.filter((g) => g.done).length,
    },
    owned,
  );
  await repo.player.put({
    xp: summary.xp,
    level: summary.level,
    statXp: summary.statXp,
    bestStreak: Math.max(best, prev?.bestStreak ?? 0),
    titles: [...owned, ...earned],
    equippedTitle: prev?.equippedTitle ?? 'awakened',
    gatesCleared: sessions,
  });
  return { summary, earned };
}

/** After any XP change: refresh the cache, then announce level-ups and new titles. */
export async function celebrate(
  before: XpSummary,
  today: ISODate,
  quiet = false,
): Promise<XpSummary> {
  const { summary, earned } = await syncPlayer(today);
  if (summary.level > before.level) {
    const a = statValues(before.statXp);
    const b = statValues(summary.statXp);
    useEvents.getState().pushLevelUp({
      from: before.level,
      to: summary.level,
      rankFrom: before.rank,
      rankTo: summary.rank,
      deltas: STAT_KEYS.map((s) => ({ stat: s, amount: b[s] - a[s] })).filter((d) => d.amount > 0),
    });
    haptic('level');
    play('level');
  }
  if (!quiet) {
    for (const id of earned) {
      if (id === 'awakened') continue;
      const t = TITLES.find((x) => x.id === id);
      if (t) toast({ tone: 'rare', label: 'Title acquired', message: t.name, detail: t.condition });
    }
  }
  return summary;
}
