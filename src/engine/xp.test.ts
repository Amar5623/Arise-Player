import { describe, expect, it } from 'vitest';
import { estimateGateXp, gateXp, totalXp, XP } from './xp';
import type { Session, Stat } from './types';

const stats: Record<string, Stat> = { 'push-2': 'STR', plank: 'AGI', dips: 'STR' };
const session: Pick<Session, 'id' | 'entries' | 'warmup'> = {
  id: 's1',
  warmup: [true, true, true, false, true, true],
  entries: [
    {
      key: 'a',
      exerciseId: 'push-2',
      name: 'Incline push-up',
      unit: 'reps',
      side: false,
      target: 8,
      sets: [8, 8, 8, 7],
      pain: false,
    },
    {
      key: 'b',
      exerciseId: 'plank',
      name: 'Plank',
      unit: 'sec',
      side: false,
      target: 30,
      sets: [30, null, 30],
      pain: false,
    },
    {
      key: 'c',
      exerciseId: 'dips',
      name: 'Dips',
      unit: 'reps',
      side: false,
      target: 8,
      sets: [null, null, null],
      pain: false,
    },
  ],
};

describe('rewards', () => {
  it('pays 4 per logged set to the exercise stat, 2 per warm-up item to AGI, 25 to STR for the clear', () => {
    const drafts = gateXp(session, (id) => stats[id] ?? 'STR');
    const by = (stat: Stat) =>
      drafts.filter((d) => d.stat === stat).reduce((n, d) => n + d.amount, 0);
    expect(by('STR')).toBe(4 * 4 + XP.clearBonus);
    expect(by('AGI')).toBe(2 * 4 + 5 * 2);
    expect(totalXp(drafts)).toBe(16 + 25 + 8 + 10);
    expect(drafts.every((d) => d.ref === 's1')).toBe(true);
  });

  it('adds 60 per skill unlock', () => {
    const drafts = gateXp(session, (id) => stats[id] ?? 'STR', [
      { ladder: 'push', step: 3, name: 'Knee push-up' },
    ]);
    expect(drafts.find((d) => d.source === 'unlock')).toEqual({
      stat: 'STR',
      amount: 60,
      source: 'unlock',
      ref: 's1:push-3',
    });
  });

  it('estimates gate XP for the quest chip', () => {
    expect(estimateGateXp(18)).toBe(18 * 4 + 12 + 25);
  });
});
