import { afterGesture } from './gesture';

/** Haptic patterns. Silently no-ops where the Vibration API is missing (iOS Safari). */
export const HAPTIC = {
  tick: 10,
  clear: [12, 40, 18],
  warn: [40, 60, 40],
  level: [20, 50, 20, 50, 60],
  timer: [30, 60, 30],
} as const satisfies Record<string, number | readonly number[]>;

export type HapticName = keyof typeof HAPTIC;

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function haptic(name: HapticName): void {
  if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  const pattern = HAPTIC[name];
  afterGesture(() => navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]));
}
