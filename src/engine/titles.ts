import type { LadderKey, Stat } from './types';

export interface TitleState {
  level: number;
  gatesCleared: number;
  bestStreak: number;
  perfectDays: number;
  /** Skill unlocks earned by progression (not the starting step). */
  unlocks: number;
  ladderSteps: Record<LadderKey, number>;
  stats: Record<Stat, number>;
  goalsCleared: number;
}

const RULES: Record<string, (s: TitleState) => boolean> = {
  awakened: () => true,
  'gate-breaker': (s) => s.gatesCleared >= 1,
  flawless: (s) => s.perfectDays >= 1,
  'iron-will': (s) => s.bestStreak >= 7,
  unbreakable: (s) => s.bestStreak >= 30,
  'dungeon-regular': (s) => s.gatesCleared >= 25,
  ascender: (s) => s.unlocks >= 1,
  grounded: (s) => s.ladderSteps.push >= 4,
  'bar-conqueror': (s) => s.ladderSteps.pull >= 5,
  scholar: (s) => s.stats.INT >= 25,
  treasurer: (s) => s.stats.WLT >= 25,
  magnetic: (s) => s.stats.CHA >= 25,
  'quest-finisher': (s) => s.goalsCleared >= 1,
  'rising-hunter': (s) => s.level >= 10,
};

/** Every title the state satisfies, in catalogue order. */
export function earnedTitles(state: TitleState): string[] {
  return Object.keys(RULES).filter((id) => RULES[id]?.(state));
}

/** Titles earned now that were not owned before. Titles are never taken away. */
export function newTitles(state: TitleState, owned: readonly string[]): string[] {
  return earnedTitles(state).filter((id) => !owned.includes(id));
}
