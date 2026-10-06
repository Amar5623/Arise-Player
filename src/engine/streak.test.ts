import { describe, expect, it } from 'vitest';
import { bestStreak, currentStreak } from './streak';
import { day, recordMap } from './testkit';

const recs = (todayDone: number) =>
  recordMap(
    day('2026-10-06', 5, 10, { closed: true, ratio: 0.5 }),
    day('2026-10-07', 8, 10, { closed: true, ratio: 0.8 }),
    day('2026-10-08', 9, 10, { closed: true, ratio: 0.9 }),
    day('2026-10-09', 10, 10, { closed: true, ratio: 1 }),
    day('2026-10-10', todayDone, 10),
  );

describe('streak', () => {
  it('counts 80%+ days back from yesterday, plus today once it qualifies', () => {
    expect(currentStreak('2026-10-10', recs(3), '2026-10-06')).toBe(3);
    expect(currentStreak('2026-10-10', recs(8), '2026-10-06')).toBe(4);
  });

  it('breaks on a missing day', () => {
    const r = recordMap(day('2026-10-07', 9, 10, { closed: true, ratio: 0.9 }));
    expect(currentStreak('2026-10-09', r, '2026-10-06')).toBe(0);
  });

  it('finds the best run', () => {
    expect(bestStreak(recs(9), '2026-10-10', '2026-10-06')).toBe(4);
    expect(bestStreak(recs(1), '2026-10-10', '2026-10-06')).toBe(3);
  });
});
