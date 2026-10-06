import type { Condition, Readiness } from './types';

/** Sleep below this (hours) means fatigued. */
export const FATIGUE_SLEEP_H = 6;

/**
 * Morning status check (PLAN.md §5): pain is INJURED; short sleep, low energy (≤2) or heavy
 * soreness (≥4) is FATIGUED; otherwise OPTIMAL.
 */
export function conditionOf(r: Readiness): Condition {
  if (r.pain) return 'INJURED';
  if (r.sleep < FATIGUE_SLEEP_H || r.energy <= 2 || r.soreness >= 4) return 'FATIGUED';
  return 'OPTIMAL';
}
