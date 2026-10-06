import { Minus, Plus } from '@phosphor-icons/react';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent,
} from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label: string;
  size?: 'md' | 'lg';
  format?: (value: number) => string;
  className?: string;
}

const HOLD_MS = 380;

/**
 * − value + for logging mid-set. A tap commits on release, never on touch-down, so a scroll that
 * starts on a button cannot change the value. Holding starts an accelerating auto-repeat.
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  label,
  size = 'lg',
  format = String,
  className,
}: StepperProps) {
  const latest = useRef(value);
  const timer = useRef<number | null>(null);
  const repeated = useRef(false);
  const cancelled = useRef(false);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    latest.current = value;
    const t = window.setTimeout(
      () => setAnnounce(`${format(value)}${unit ? ` ${unit}` : ''}`),
      500,
    );
    return () => window.clearTimeout(t);
  }, [value, unit, format]);

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const bump = (dir: 1 | -1) => {
    const next = Math.min(
      max,
      Math.max(min, Math.round((latest.current + dir * step) * 100) / 100),
    );
    if (next === latest.current) return;
    latest.current = next;
    onChange(next);
    haptic('tick');
  };

  const dirOf = (el: HTMLElement): 1 | -1 => (el.dataset.dir === 'up' ? 1 : -1);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const dir = dirOf(e.currentTarget);
    repeated.current = false;
    cancelled.current = false;
    clear();
    let delay = HOLD_MS;
    const loop = () => {
      repeated.current = true;
      bump(dir);
      delay = Math.max(60, delay * 0.8);
      timer.current = window.setTimeout(loop, delay);
    };
    timer.current = window.setTimeout(loop, HOLD_MS);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    clear();
    if (!repeated.current && !cancelled.current) bump(dirOf(e.currentTarget));
  };
  const onPointerCancel = () => {
    cancelled.current = true;
    clear();
  };
  // Keyboard activation arrives as a click with detail 0; pointer taps are handled on release.
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) bump(dirOf(e.currentTarget));
  };
  const handlers = {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture: clear,
    onBlur: clear,
    onClick,
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  };

  const lg = size === 'lg';
  const btn = cn(
    'tap grid shrink-0 place-items-center rounded-ctl border border-line-2 bg-s2 text-ink transition-[background-color,transform] duration-(--dur-1)',
    'enabled:hover:bg-s3 enabled:active:scale-[0.96] enabled:active:bg-s4 disabled:text-ink-4',
    lg ? 'size-14 [&_svg]:size-6' : 'size-12 [&_svg]:size-5',
  );

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex items-center justify-between gap-3', className)}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        data-dir="down"
        disabled={value <= min}
        className={btn}
        {...handlers}
      >
        <Minus weight="regular" />
      </button>
      <div className="flex min-w-0 flex-col items-center">
        <span className={cn('num font-medium tracking-tight text-ink', lg ? 'text-64' : 'text-40')}>
          {format(value)}
        </span>
        {unit && <span className="text-13 text-ink-2">{unit}</span>}
      </div>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        data-dir="up"
        disabled={value >= max}
        className={btn}
        {...handlers}
      >
        <Plus weight="regular" />
      </button>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
