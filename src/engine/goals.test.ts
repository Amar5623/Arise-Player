import { describe, expect, it } from 'vitest';
import { daysLeft, goalProgress, goalReached, updateGoal } from './goals';
import type { Goal } from './types';

const fund: Goal = {
  id: 'g',
  title: 'Emergency fund',
  stat: 'WLT',
  unit: '₹',
  start: 0,
  target: 300000,
  current: 75000,
  updates: [],
  done: false,
  deadline: '2027-10-06',
};
const waist: Goal = {
  id: 'w',
  title: 'Waist to 80 cm',
  stat: 'VIT',
  unit: 'cm',
  start: 88,
  target: 80,
  current: 84,
  updates: [],
  done: false,
};

describe('main quests', () => {
  it('measures progress up and down', () => {
    expect(goalProgress(fund)).toBe(0.25);
    expect(goalProgress(waist)).toBe(0.5);
    expect(goalProgress({ ...waist, current: 90 })).toBe(0);
  });

  it('clears once when the target is reached', () => {
    const a = updateGoal(waist, 80, '2026-12-01');
    expect(a.cleared).toBe(true);
    expect(a.goal).toMatchObject({ done: true, doneAt: '2026-12-01', current: 80 });
    expect(a.goal.updates).toEqual([{ date: '2026-12-01', value: 80 }]);
    expect(updateGoal(a.goal, 79, '2026-12-08').cleared).toBe(false);
    expect(goalReached({ ...fund, current: 300000 })).toBe(true);
  });

  it('counts days left', () => {
    expect(daysLeft(fund, '2026-10-06')).toBe(365);
    expect(daysLeft(waist, '2026-10-06')).toBeNull();
  });
});
