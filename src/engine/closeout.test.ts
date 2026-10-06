import { describe, expect, it } from 'vitest';
import { closeOut } from './closeout';
import { day, recordMap } from './testkit';

describe('daily close-out', () => {
  it('does nothing on the first day', () => {
    const r = closeOut('2026-10-06', '2026-10-06', new Map(), null);
    expect(r).toEqual({ closed: [], penalty: false, streakContinues: false, yesterdayRatio: null });
  });

  it('issues a penalty when yesterday closed under 50%', () => {
    const r = closeOut('2026-10-07', '2026-10-06', recordMap(day('2026-10-06', 4, 10)), null);
    expect(r.closed).toHaveLength(1);
    expect(r.closed[0]).toMatchObject({
      date: '2026-10-06',
      ratio: 0.4,
      closed: true,
      missed: false,
    });
    expect(r.penalty).toBe(true);
  });

  it('no penalty from 50%, streak from 80%', () => {
    expect(
      closeOut('2026-10-07', '2026-10-06', recordMap(day('2026-10-06', 5, 10)), null),
    ).toMatchObject({ penalty: false, streakContinues: false });
    expect(
      closeOut('2026-10-07', '2026-10-06', recordMap(day('2026-10-06', 8, 10)), null),
    ).toMatchObject({ penalty: false, streakContinues: true });
  });

  it('treats a day with no record as missed', () => {
    const r = closeOut('2026-10-08', '2026-10-06', recordMap(day('2026-10-06', 10, 10)), null);
    expect(r.closed.map((c) => [c.date, c.ratio, c.missed])).toEqual([
      ['2026-10-06', 1, false],
      ['2026-10-07', 0, true],
    ]);
    expect(r.penalty).toBe(true);
  });

  it('closes every day since the last close and skips closed ones', () => {
    const recs = recordMap(
      day('2026-10-06', 9, 10, { closed: true, ratio: 0.9 }),
      day('2026-10-08', 9, 10),
    );
    const r = closeOut('2026-10-10', '2026-10-06', recs, '2026-10-06');
    expect(r.closed.map((c) => c.date)).toEqual(['2026-10-07', '2026-10-08', '2026-10-09']);
    expect(r.yesterdayRatio).toBe(0);
  });
});
