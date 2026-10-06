import { motion, useReducedMotion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { DUR, EASE_OUT } from '@/lib/motion';
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
   * Opt-in, so the System only speaks when something actually happened.
   */
  reveal?: boolean;
  /** Body padding; set false when rows run edge to edge. */
  padded?: boolean;
  as?: 'h2' | 'h3';
  className?: string;
}

const TICKS = ['tl', 'tr', 'bl', 'br'] as const;
const REVEAL_S = 0.3;

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
  const reduce = useReducedMotion();
  const play = reveal && !reduce;
  const labelId = useId();

  return (
    <section data-tone={tone} aria-labelledby={labelId} className={cn('sys-window', className)}>
      {TICKS.map((c, i) => (
        <motion.span
          key={c}
          data-c={c}
          className="sys-tick"
          initial={play ? { opacity: 0, scale: 0.4 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DUR[1], delay: i * 0.02, ease: EASE_OUT }}
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
      {play && (
        <>
          <motion.span
            aria-hidden
            className="sys-cover"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: REVEAL_S, delay: 0.1, ease: EASE_OUT }}
          />
          <motion.span
            aria-hidden
            className="sys-scan"
            initial={{ top: '0%', opacity: 1 }}
            animate={{ top: '100%', opacity: 0 }}
            transition={{ duration: REVEAL_S + 0.04, delay: 0.1, ease: EASE_OUT }}
          />
        </>
      )}
    </section>
  );
}
