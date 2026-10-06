import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { EASE_OUT } from '@/lib/motion';

export interface CountUpProps {
  value: number;
  from?: number;
  /** When false the final value renders without animating. */
  play?: boolean;
  duration?: number;
  format?: (n: number) => string;
}

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
    const controls = animate(from, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = format(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, from, play, reduce, duration, format]);

  return <span ref={ref}>{format(value)}</span>;
}
