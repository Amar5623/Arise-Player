import { describe, expect, it } from 'vitest';
import { addDays } from '@/lib/dates';
import { evaluateTiers } from './tiers';
import { quest, recordMap } from './testkit';
import type { DayRecord, HabitConfig } from './types';

const TODAY = '2026-10-20';
const read = (tier = 1, since = '2026-10-05'): HabitConfig => ({
  id: 'read',
  enabled: true,
  tier,
  since,
});
const dayWith = (offset: number, done: boolean | 'absent'): DayRecord => ({
  date: addDays(TODAY, -offset),
  quests:
    done === 'absent' ? [quest('other', true)] : [quest('habit:read', done, { habitId: 'read' })],
  bonusAwarded: false,
  closed: true,
});
const week = (pattern: (boolean | 'absent' | null)[]) =>
  recordMap(...pattern.flatMap((p, i) => (p === null ? [] : [dayWith(7 - i, p)])));

describe('habit tiers', () => {
  it('waits until the habit has been at this tier for 7 days', () => {
    const r = evaluateTiers(
      TODAY,
      [read(1, '2026-10-15')],
      week([true, true, true, true, true, true, true]),
      '2026-10-01',
    );
    expect(r.changes).toEqual([]);
  });

  it('raises a tier at 85% or better and resets since', () => {
    const r = evaluateTiers(
      TODAY,
      [read(1)],
      week([true, true, true, true, true, true, false]),
      '2026-10-01',
    );
    expect(r.changes).toEqual([{ id: 'read', from: 1, to: 2, rate: 6 / 7 }]);
    expect(r.habits[0]).toMatchObject({ tier: 2, since: TODAY });
  });

  it('holds between 40% and 85%', () => {
    expect(
      evaluateTiers(
        TODAY,
        [read(2)],
        week([true, true, true, true, true, false, false]),
        '2026-10-01',
      ).changes,
    ).toEqual([]);
  });

  it('lowers a tier under 40%, never below T1', () => {
    expect(
      evaluateTiers(
        TODAY,
        [read(3)],
        week([true, true, false, false, false, false, false]),
        '2026-10-01',
      ).habits[0]?.tier,
    ).toBe(2);
    expect(
      evaluateTiers(
        TODAY,
        [read(1)],
        week([false, false, false, false, false, false, false]),
        '2026-10-01',
      ).changes,
    ).toEqual([]);
  });

  it('counts unopened days as appeared but not done', () => {
    const r = evaluateTiers(
      TODAY,
      [read(2)],
      week([true, true, null, null, null, null, null]),
      '2026-10-01',
    );
    expect(r.habits[0]?.tier).toBe(1);
  });

  it('skips days when the habit was not on the list, and needs 4 appearances', () => {
    const r = evaluateTiers(
      TODAY,
      [read(1)],
      week([true, true, true, 'absent', 'absent', 'absent', 'absent']),
      '2026-10-01',
    );
    expect(r.changes).toEqual([]);
  });

  it('ignores days before joining', () => {
    const r = evaluateTiers(
      TODAY,
      [read(1)],
      week([null, null, null, null, true, true, true]),
      '2026-10-17',
    );
    expect(r.changes).toEqual([]);
  });

  it('stops at the top tier and ignores untiered or disabled habits', () => {
    const all = week([true, true, true, true, true, true, true]);
    expect(evaluateTiers(TODAY, [read(5)], all, '2026-10-01').changes).toEqual([]);
    expect(
      evaluateTiers(TODAY, [{ ...read(1), enabled: false }], all, '2026-10-01').changes,
    ).toEqual([]);
    expect(
      evaluateTiers(
        TODAY,
        [{ id: 'journal', enabled: true, tier: 1, since: '2026-10-01' }],
        all,
        '2026-10-01',
      ).changes,
    ).toEqual([]);
  });
});
