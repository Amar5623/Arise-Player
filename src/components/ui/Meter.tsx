import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { SPRING_SOFT } from '@/lib/motion';

export interface QuestMeterProps {
  done: number;
  total: number;
  tone?: 'sys' | 'ok';
  className?: string;
}

/** One segment per quest, 2px gaps. Reads as a count, not a percentage. */
export function QuestMeter({ done, total, tone = 'sys', className }: QuestMeterProps) {
  const complete = total > 0 && done >= total;
  return (
    <div
      role="meter"
      aria-label="Quests done"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} of ${total} done`}
      className={cn('flex h-1.5 gap-0.5', className)}
    >
      {Array.from({ length: Math.max(total, 1) }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-full flex-1 rounded-mark transition-colors duration-(--dur-2)',
            i < done ? (complete || tone === 'ok' ? 'bg-ok' : 'bg-sys') : 'bg-s3',
          )}
        />
      ))}
    </div>
  );
}

export interface XpBarProps {
  into: number;
  next: number;
  tone?: 'sys' | 'rare';
  className?: string;
  label?: string;
}

/** Continuous level progress. Fill springs to the new width. */
export function XpBar({
  into,
  next,
  tone = 'sys',
  className,
  label = 'Experience to next level',
}: XpBarProps) {
  const reduce = useReducedMotion();
  const pct = next > 0 ? Math.min(1, Math.max(0, into / next)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={next}
      aria-valuenow={into}
      className={cn('h-1 overflow-hidden rounded-mark bg-s3', className)}
    >
      <motion.div
        className={cn('h-full origin-left', tone === 'sys' ? 'bg-sys' : 'bg-rare')}
        initial={false}
        animate={{ scaleX: pct }}
        transition={reduce ? { duration: 0 } : SPRING_SOFT}
      />
    </div>
  );
}
