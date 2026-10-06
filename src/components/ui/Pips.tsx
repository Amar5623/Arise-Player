import { cn } from '@/lib/cn';

export interface PipsProps {
  /** Total ladder steps. */
  total: number;
  /** 1-based current step. */
  current: number;
  label: string;
  className?: string;
}

/** Ladder progress: cleared steps, the current step, locked steps. */
export function Pips({ total, current, label, className }: PipsProps) {
  return (
    <span
      role="img"
      aria-label={`${label}: step ${current} of ${total}`}
      className={cn('inline-flex items-center gap-1', className)}
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        return (
          <span
            key={step}
            className={cn(
              'block h-2 rounded-mark',
              step < current && 'w-2 bg-ink-2',
              step === current && 'w-4 bg-sys',
              step > current && 'w-2 border border-ink-4',
            )}
          />
        );
      })}
    </span>
  );
}
