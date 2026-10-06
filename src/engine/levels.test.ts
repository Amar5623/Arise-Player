import { describe, expect, it } from 'vitest';
import { levelFromXp, rankFor, statValue, summarizeXp, xpForLevel, xpToNext } from './levels';

describe('levels', () => {
  it('needs 60 + 40·L XP to leave level L', () => {
    expect(xpToNext(1)).toBe(100);
    expect(xpToNext(2)).toBe(140);
    expect(xpToNext(9)).toBe(420);
  });

  it('derives level from total XP', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, next: 100 });
    expect(levelFromXp(99)).toEqual({ level: 1, into: 99, next: 100 });
    expect(levelFromXp(100)).toEqual({ level: 2, into: 0, next: 140 });
    expect(levelFromXp(245)).toEqual({ level: 3, into: 5, next: 180 });
    expect(levelFromXp(xpForLevel(10)).level).toBe(10);
    expect(xpForLevel(10)).toBe(2340);
  });

  it('maps levels to ranks at the brief boundaries', () => {
    const at = (l: number) => rankFor(l);
    expect([1, 9, 10, 19, 20, 34, 35, 49, 50, 69, 70, 99].map(at)).toEqual([
      'E',
      'E',
      'D',
      'D',
      'C',
      'C',
      'B',
      'B',
      'A',
      'A',
      'S',
      'S',
    ]);
  });

  it('shows stats as 10 + floor(statXp / 40)', () => {
    expect([0, 39, 40, 600].map(statValue)).toEqual([10, 10, 11, 25]);
  });

  it('folds the ledger, so undo events cancel exactly', () => {
    const s = summarizeXp([
      { stat: 'INT', amount: 12 },
      { stat: 'STR', amount: 100 },
      { stat: null, amount: 30 },
      { stat: 'INT', amount: -12 },
    ]);
    expect(s.xp).toBe(130);
    expect(s.statXp.INT).toBe(0);
    expect(s.statXp.STR).toBe(100);
    expect(s.level).toBe(2);
    expect(s.rank).toBe('E');
  });
});
