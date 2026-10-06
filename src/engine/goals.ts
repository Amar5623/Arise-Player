import { diffDays } from '@/lib/dates';
import type { Goal, ISODate } from './types';

/** Progress 0..1. Works for goals that go down (waist 88 → 80) as well as up. */
export function goalProgress(g: Pick<Goal, 'start' | 'target' | 'current'>): number {
  const span = g.target - g.start;
  if (span === 0) return g.current === g.target ? 1 : 0;
  return Math.min(1, Math.max(0, (g.current - g.start) / span));
}

export function goalReached(g: Pick<Goal, 'start' | 'target' | 'current'>): boolean {
  return g.target >= g.start ? g.current >= g.target : g.current <= g.target;
}

/** Days until the deadline; negative once past; null without one. */
export function daysLeft(g: Pick<Goal, 'deadline'>, today: ISODate): number | null {
  return g.deadline ? diffDays(today, g.deadline) : null;
}

/** Records a new value. Clears the goal (once) when the target is reached. */
export function updateGoal(
  g: Goal,
  value: number,
  today: ISODate,
): { goal: Goal; cleared: boolean } {
  const goal: Goal = { ...g, current: value, updates: [...g.updates, { date: today, value }] };
  if (!g.done && goalReached(goal))
    return { goal: { ...goal, done: true, doneAt: today }, cleared: true };
  return { goal, cleared: false };
}
