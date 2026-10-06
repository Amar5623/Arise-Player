/** The System's one line for the day. Deterministic: same day, same line. */
import type { Condition, ISODate } from '@/engine/types';
import { weekday } from '@/lib/dates';

const BY_DAY = [
  'Push day. The first set decides the rest.',
  'Legs today. Knees over the second toe, every rep.',
  'Pull day. Shoulder blades down before anything moves.',
  'Hinge and open the hips. Slow beats deep.',
  'Circuit day. Practise, do not grind.',
  'Conditioning. Stay light on your feet.',
  'Rest day. Walk, sleep, prepare Monday.',
] as const;

export function systemLine(
  date: ISODate,
  opts: { condition?: Condition; penalty?: boolean; deload?: boolean },
): string {
  if (opts.penalty) return 'A penalty stands. Clear it before noon.';
  if (opts.condition === 'INJURED') return 'Mobility only. Pain is information, not a challenge.';
  if (opts.condition === 'FATIGUED') return 'Recovery mode. Leave reps in the tank.';
  if (opts.deload) return 'Deload week. Lighter now, stronger after.';
  return BY_DAY[weekday(date)] ?? BY_DAY[0];
}
