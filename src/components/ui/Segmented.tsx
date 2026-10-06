import { motion } from 'motion/react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SPRING_UI } from '@/lib/motion';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is not plain text. */
  aria?: string;
}

export interface SegmentedProps<T extends string | number> {
  options: readonly SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  mono?: boolean;
  disabled?: boolean;
  className?: string;
}

/** A radiogroup with a sliding selection block. Arrow keys move the selection. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  mono = false,
  disabled = false,
  className,
}: SegmentedProps<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = options.length - 1;
    let next: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    const opt = options[next];
    if (!opt) return;
    onChange(opt.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn(
        'flex min-h-12 gap-px rounded-ctl border border-line-2 bg-s2 p-px',
        disabled && 'opacity-50',
        className,
      )}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.aria}
            tabIndex={active || (selectedIndex === -1 && i === 0) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'relative min-h-11 flex-1 tap rounded-inner px-2 py-1 text-15 transition-colors duration-(--dur-1)',
              mono && 'num',
              active
                ? 'font-semibold text-ink'
                : 'text-ink-2 enabled:hover:text-ink enabled:active:bg-s3',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={SPRING_UI}
                className="absolute inset-0 rounded-inner border border-line-3 bg-s4"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
