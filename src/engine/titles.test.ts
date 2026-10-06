import { describe, expect, it } from 'vitest';
import { earnedTitles, newTitles, type TitleState } from './titles';

const base: TitleState = {
  level: 1,
  gatesCleared: 0,
  bestStreak: 0,
  perfectDays: 0,
  unlocks: 0,
  ladderSteps: { push: 2, squat: 2, pull: 1 },
  stats: { STR: 10, AGI: 10, VIT: 10, INT: 10, CHA: 10, WLT: 10 },
  goalsCleared: 0,
};

describe('titles', () => {
  it('everyone starts Awakened', () => {
    expect(earnedTitles(base)).toEqual(['awakened']);
  });

  it('unlocks each title at its condition', () => {
    const s: TitleState = {
      ...base,
      level: 10,
      gatesCleared: 25,
      bestStreak: 30,
      perfectDays: 1,
      unlocks: 1,
      ladderSteps: { push: 4, squat: 3, pull: 5 },
      stats: { ...base.stats, INT: 25, WLT: 25, CHA: 25 },
      goalsCleared: 1,
    };
    expect(earnedTitles(s)).toHaveLength(14);
  });

  it('reports only new titles', () => {
    expect(newTitles({ ...base, gatesCleared: 1 }, ['awakened'])).toEqual(['gate-breaker']);
  });

  it('does not grant Ascender for a starting step', () => {
    expect(earnedTitles({ ...base, ladderSteps: { push: 4, squat: 4, pull: 3 } })).toEqual([
      'awakened',
      'grounded',
    ]);
  });
});
