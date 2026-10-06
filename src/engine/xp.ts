import type { Unlock } from './progression';
import type { Session, Stat, XpDraft } from './types';

export const XP = {
  perSet: 4,
  perWarmup: 2,
  clearBonus: 25,
  unlock: 60,
  dailyBonus: 30,
  goal: 200,
} as const;

/**
 * Gate XP (brief §7 Rewards): 4 per logged set to that exercise's stat, +2 per warm-up item to
 * AGI, +25 clear bonus to STR, +60 per skill unlock to the ladder's stat.
 */
export function gateXp(
  session: Pick<Session, 'id' | 'entries' | 'warmup'>,
  statOf: (exerciseId: string) => Stat,
  unlocks: readonly Unlock[] = [],
): XpDraft[] {
  const byStat = new Map<Stat, number>();
  for (const e of session.entries) {
    const logged = e.sets.filter((v) => v !== null).length;
    if (!logged) continue;
    const stat = statOf(e.exerciseId);
    byStat.set(stat, (byStat.get(stat) ?? 0) + logged * XP.perSet);
  }
  const warm = session.warmup.filter(Boolean).length * XP.perWarmup;
  if (warm) byStat.set('AGI', (byStat.get('AGI') ?? 0) + warm);

  const drafts: XpDraft[] = [...byStat].map(([stat, amount]) => ({
    stat,
    amount,
    source: 'gate',
    ref: session.id,
  }));
  drafts.push({ stat: 'STR', amount: XP.clearBonus, source: 'gate', ref: session.id });
  for (const u of unlocks)
    drafts.push({
      stat: 'STR',
      amount: XP.unlock,
      source: 'unlock',
      ref: `${session.id}:${u.ladder}-${u.step}`,
    });
  return drafts;
}

export const totalXp = (drafts: readonly Pick<XpDraft, 'amount'>[]) =>
  drafts.reduce((n, d) => n + d.amount, 0);

/** Rough Gate XP before the session, for the quest row's chip. */
export function estimateGateXp(totalSets: number): number {
  return totalSets * XP.perSet + 6 * XP.perWarmup + XP.clearBonus;
}
