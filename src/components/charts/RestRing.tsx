import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

export interface RestRingProps {
  /** Seconds in the rest period. */
  total: number;
  /** Wall-clock end time (ms since epoch, Date.now() basis). Null shows the ring paused at `remaining`. */
  endsAt: number | null;
  /** Shown while paused (endsAt null). */
  remaining?: number;
  /** Fires once when the countdown reaches zero. */
  onDone?: () => void;
  size?: number;
  /** Small ring for an inline slot: smaller digits and label. */
  compact?: boolean;
  className?: string;
}

const fmt = (s: number) => {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

/**
 * Big countdown ring. Ticks itself from wall-clock time and writes the arc and digits straight to
 * the DOM, so the screen around it never re-renders per frame. Stops at zero.
 */
export function RestRing({
  total,
  endsAt,
  remaining = total,
  onDone,
  size = 248,
  compact = false,
  className,
}: RestRingProps) {
  const stroke = 6;
  const r = (size - stroke) / 2 - 6;
  const circ = 2 * Math.PI * r;
  const arc = useRef<SVGCircleElement>(null);
  const digits = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let raf = 0;
    let lastWhole = -1;
    const paint = (left: number) => {
      const frac = total > 0 ? Math.min(1, Math.max(0, left / total)) : 0;
      const done = left <= 0;
      arc.current?.setAttribute('stroke-dashoffset', String(circ * (1 - frac)));
      arc.current?.setAttribute('stroke', done ? 'var(--color-ok)' : 'var(--color-sys)');
      const whole = Math.ceil(Math.max(0, left));
      if (whole !== lastWhole) {
        lastWhole = whole;
        if (digits.current) digits.current.textContent = fmt(left);
        if (label.current) {
          label.current.textContent = done ? 'Go' : 'Rest';
          label.current.dataset.done = String(done);
        }
        root.current?.setAttribute(
          'aria-label',
          done ? 'Rest complete' : `Rest, ${fmt(left)} left`,
        );
      }
      return done;
    };
    if (endsAt === null) {
      paint(remaining);
      return;
    }
    const tick = () => {
      if (paint((endsAt - Date.now()) / 1000)) {
        doneRef.current?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [endsAt, remaining, total, circ]);

  return (
    <div
      ref={root}
      role="timer"
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2;
          const r1 = r + stroke / 2 + 4;
          const r2 = r1 + (i % 5 === 0 ? 5 : 2);
          return (
            <line
              key={i}
              x1={size / 2 + Math.cos(a) * r1}
              y1={size / 2 + Math.sin(a) * r1}
              x2={size / 2 + Math.cos(a) * r2}
              y2={size / 2 + Math.sin(a) * r2}
              stroke="var(--color-line-2)"
              strokeWidth={1}
            />
          );
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-s3)"
          strokeWidth={stroke}
        />
        <circle
          ref={arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-sys)"
          strokeWidth={stroke}
          strokeDasharray={circ}
        />
      </svg>
      <div className="relative flex flex-col items-center gap-1" aria-hidden>
        <span ref={label} className={cn(compact ? 'hud-11' : 'hud-13', 'text-ink-2 data-[done=true]:text-ok')}>
          Rest
        </span>
        <span ref={digits} className={cn('num font-medium tracking-tight text-ink', compact ? 'text-22' : 'text-64')}>
          {fmt(remaining)}
        </span>
      </div>
    </div>
  );
}
