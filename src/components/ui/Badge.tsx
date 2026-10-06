import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tone = 'sys' | 'ok' | 'warn' | 'bad' | 'rare' | 'neutral';

const TONE: Record<Tone, string> = {
  sys: 'bg-sys-dim text-sys',
  ok: 'bg-ok-dim text-ok',
  warn: 'bg-warn-dim text-warn',
  bad: 'bg-bad-dim text-bad',
  rare: 'bg-rare-dim text-rare',
  neutral: 'bg-s3 text-ink-2',
};

export interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Status badge: always a word, optionally an icon. Colour is never the only signal. */
export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center gap-1 rounded-mark px-2 py-0.5 hud-11 [&_svg]:size-3.5',
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
