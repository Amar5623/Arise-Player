import type { Stat } from '@/engine/types';
import { STAT_COLOR } from '@/data/stats';
import { cn } from '@/lib/cn';
import { CountUp } from './CountUp';

export interface XpChipProps {
  xp: number;
  stat: Stat | null;
  done?: boolean;
  className?: string;
}

/** "+12 XP" with a stat-tinted 2px underline. Counts up when the quest is done. */
export function XpChip({ xp, stat, done = false, className }: XpChipProps) {
  return (
    <span
      className={cn(
        'relative inline-flex h-6 shrink-0 items-baseline gap-1 rounded-mark bg-s2 px-1.5 pt-[5px] num text-11 leading-none',
        done ? 'text-ink' : 'text-ink-2',
        className,
      )}
    >
      <span>
        +<CountUp value={xp} from={done ? 0 : xp} play={done} />
      </span>
      <span className="text-ink-3">{stat ?? 'XP'}</span>
      <span
        aria-hidden
        className="absolute inset-x-1.5 bottom-0.5 h-0.5"
        style={{ background: stat ? STAT_COLOR[stat] : 'var(--color-sys)' }}
      />
    </span>
  );
}
