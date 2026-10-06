import type { Rank, Stat, XpEvent } from './types';
import { STAT_KEYS } from './types';

/** XP needed to go from level L to L+1. */
export const xpToNext = (level: number) => 60 + 40 * level;

export interface LevelInfo {
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level needs in total. */
  next: number;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level += 1;
  }
  return { level, into: rest, next: xpToNext(level) };
}

/** Total XP at which a level starts. */
export function xpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNext(l);
  return total;
}

export function rankFor(level: number): Rank {
  if (level >= 70) return 'S';
  if (level >= 50) return 'A';
  if (level >= 35) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

/** Displayed stat value. */
export const statValue = (statXp: number) => 10 + Math.floor(Math.max(0, statXp) / 40);

export function emptyStats(): Record<Stat, number> {
  return Object.fromEntries(STAT_KEYS.map((s) => [s, 0])) as Record<Stat, number>;
}

export interface XpSummary extends LevelInfo {
  xp: number;
  statXp: Record<Stat, number>;
  rank: Rank;
}

/** Folds the ledger into totals. The single place XP is counted. */
export function summarizeXp(events: readonly Pick<XpEvent, 'stat' | 'amount'>[]): XpSummary {
  const statXp = emptyStats();
  let xp = 0;
  for (const e of events) {
    xp += e.amount;
    if (e.stat) statXp[e.stat] += e.amount;
  }
  xp = Math.max(0, xp);
  for (const s of STAT_KEYS) statXp[s] = Math.max(0, statXp[s]);
  const info = levelFromXp(xp);
  return { xp, statXp, ...info, rank: rankFor(info.level) };
}

export function statValues(statXp: Record<Stat, number>): Record<Stat, number> {
  return Object.fromEntries(STAT_KEYS.map((s) => [s, statValue(statXp[s])])) as Record<
    Stat,
    number
  >;
}
