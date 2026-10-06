import type { Stat } from '@/engine/types';
import { STAT_COLOR } from '@/data/stats';
import { cn } from '@/lib/cn';

export function StatMark({
  stat,
  className,
  label = true,
}: {
  stat: Stat;
  className?: string;
  label?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        aria-hidden
        className="block size-1.5 rounded-mark"
        style={{ background: STAT_COLOR[stat] }}
      />
      {label && <span className="hud-11 text-ink-2">{stat}</span>}
    </span>
  );
}
