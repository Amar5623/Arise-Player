import { useReducedMotion } from '@/lib/useReducedMotion';
import { useEffect, useRef } from 'react';

export interface CountUpProps {
  value: number;
  from?: number;
  /** When false the final value renders without animating. */
  play?: boolean;
  /** Seconds. */
  duration?: number;
  format?: (n: number) => string;
}

const easeOut = (t: number) => 1 - (1 - t) ** 4;

/** Writes digits straight to the DOM so a count-up never re-renders React per frame. */
export function CountUp({
  value,
  from = 0,
  play = true,
  duration = 0.6,
  format = String,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!play || reduce || from === value) {
      el.textContent = format(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      el.textContent = format(Math.round(from + (value - from) * easeOut(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, from, play, reduce, duration, format]);

  return <span ref={ref}>{format(value)}</span>;
}
