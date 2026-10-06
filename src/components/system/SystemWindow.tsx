import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { TONE_GLYPH, type SystemTone } from './tone';

export type { SystemTone };

export interface SystemWindowProps {
  tone?: SystemTone;
  /** Header label, e.g. NOTIFICATION, DAILY QUEST. */
  label: string;
  /** Right side of the header row, e.g. [3/12]. */
  aside?: ReactNode;
  children?: ReactNode;
  /**
   * Announce: corner ticks draw, the body uncovers top to bottom behind a scan line.
   * Opt-in, so the System only speaks when something actually happened. CSS-driven, so it
   * runs on first paint and honours reduced motion without JavaScript.
   */
  reveal?: boolean;
  /** Body padding; set false when rows run edge to edge. */
  padded?: boolean;
  as?: 'h2' | 'h3';
  className?: string;
}

const TICKS = ['tl', 'tr', 'bl', 'br'] as const;

/** The System speaking. Hairline tinted frame, corner ticks, inner glow, scan reveal. */
export function SystemWindow({
  tone = 'sys',
  label,
  aside,
  children,
  reveal = false,
  padded = true,
  as: Heading = 'h2',
  className,
}: SystemWindowProps) {
  const labelId = useId();
  return (
    <section data-tone={tone} aria-labelledby={labelId} className={cn('sys-window', className)}>
      {TICKS.map((c, i) => (
        <span
          key={c}
          data-c={c}
          data-play={reveal || undefined}
          className="sys-tick"
          style={{ animationDelay: `${i * 20}ms` } as CSSProperties}
        />
      ))}
      <header className="flex min-h-11 items-center justify-between gap-3 px-4 pt-2">
        <Heading id={labelId} className="flex items-center gap-2 hud-13 text-(--tone)">
          <span aria-hidden className="tracking-normal">
            [&nbsp;{TONE_GLYPH[tone]}&nbsp;]
          </span>
          <span>{label}</span>
        </Heading>
        {aside && <div className="flex items-center gap-2">{aside}</div>}
      </header>
      {children && <div className={cn(padded ? 'px-4 pt-1 pb-4' : 'pb-2')}>{children}</div>}
      {reveal && (
        <>
          <span aria-hidden className="sys-cover" />
          <span aria-hidden data-play className="sys-scan" />
        </>
      )}
    </section>
  );
}
