import { AnimatePresence, useReducedMotion, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Rank, Stat } from '@/engine/types';
import { Button } from '@/components/ui/Button';
import { EASE_OUT, SPRING_SOFT } from '@/lib/motion';
import { RankBadge } from './RankBadge';
import { StatMark } from './StatMark';

export interface LevelUpData {
  from: number;
  to: number;
  rankFrom: Rank;
  rankTo: Rank;
  /** Displayed stat values before and after. */
  deltas: { stat: Stat; from: number; to: number }[];
}

const TOTAL_MS = 2500;
const MORPH_MS = 450;
const CORNERS = [
  { c: 'top-[calc(16px+var(--safe-top))] left-4 border-t-2 border-l-2', o: 'top left' },
  { c: 'top-[calc(16px+var(--safe-top))] right-4 border-t-2 border-r-2', o: 'top right' },
  { c: 'bottom-[calc(16px+var(--safe-bottom))] left-4 border-b-2 border-l-2', o: 'bottom left' },
  { c: 'bottom-[calc(16px+var(--safe-bottom))] right-4 border-b-2 border-r-2', o: 'bottom right' },
] as const;

/**
 * Full-screen level-up: the System's loudest moment. Brackets draw in from the screen corners,
 * one scan sweeps down, the level rolls old to new, the rank badge redraws if the rank changed.
 * Closes itself after 2.5 s; tap, Continue or Esc skips.
 */
export function LevelUpTakeover({
  data,
  onDone,
}: {
  data: LevelUpData | null;
  onDone: () => void;
}) {
  return (
    <AnimatePresence>
      {data && <Takeover key={`${data.from}-${data.to}`} data={data} onDone={onDone} />}
    </AnimatePresence>
  );
}

function Takeover({ data, onDone }: { data: LevelUpData; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? data.to : data.from);
  const rankUp = data.rankFrom !== data.rankTo;
  const continueRef = useRef<HTMLButtonElement>(null);
  // Keyboard users get as long as they need: any key except Escape stops the auto-close.
  const [held, setHeld] = useState(false);
  // Timers must not restart when the parent re-renders with a new callback.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    continueRef.current?.focus({ preventScroll: true });
    // Everything behind the takeover is out of reach while it is up.
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    const morph = window.setTimeout(() => setShown(data.to), reduce ? 0 : MORPH_MS);
    return () => {
      window.clearTimeout(morph);
      root?.removeAttribute('inert');
      opener?.focus({ preventScroll: true });
    };
  }, [data.to, reduce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') doneRef.current();
      else setHeld(true);
    };
    window.addEventListener('keydown', onKey);
    const done = held ? 0 : window.setTimeout(() => doneRef.current(), TOTAL_MS);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(done);
    };
  }, [held]);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
      className="fixed inset-0 z-(--z-takeover) mx-auto flex max-w-(--frame-w) flex-col bg-base"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      onClick={() => doneRef.current()}
    >
      {CORNERS.map(({ c, o }, i) => (
        <motion.span
          key={o}
          aria-hidden
          className={`absolute size-10 border-rare ${c}`}
          style={{ transformOrigin: o }}
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.03, ease: EASE_OUT }}
        />
      ))}
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-x-4 h-px bg-rare shadow-[0_0_8px_1px_color-mix(in_oklab,var(--color-rare)_55%,transparent)]"
          initial={{ top: '0%', opacity: 1 }}
          animate={{ top: '100%', opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT }}
        />
      )}

      <div className="flex flex-1 flex-col justify-end gap-8 px-8 pt-24 pb-[calc(32px+var(--safe-bottom))]">
        <p id="levelup-title" className="hud-17 text-rare">
          <span aria-hidden>[&nbsp;+&nbsp;]&nbsp;&nbsp;</span>Level up
          <span className="sr-only">, level {data.to}</span>
        </p>

        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="hud-13 text-ink-2">Level</span>
            <span className="relative inline-flex h-16 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={shown}
                  aria-hidden
                  className="num text-64 font-semibold tracking-tight text-ink"
                  initial={reduce ? false : { y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
                  transition={SPRING_SOFT}
                >
                  {shown}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="pt-2 hud-11 text-ink-2">
              {rankUp ? (
                <>
                  Rank <span className="text-ink-3">{data.rankFrom}</span> to{' '}
                  <span className="text-ink">{data.rankTo}</span>
                </>
              ) : (
                <>Rank {data.rankTo}</>
              )}
            </span>
          </div>
          <RankBadge rank={data.rankTo} size="lg" draw={rankUp && !reduce} delay={0.5} />
        </div>

        {data.deltas.length > 0 && (
          <ul aria-label="Stat gains" className="flex flex-col gap-2.5 border-t border-line pt-5">
            {data.deltas.map((d, i) => (
              <motion.li
                key={d.stat}
                className="flex items-center justify-between"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.04, duration: 0.25, ease: EASE_OUT }}
              >
                <StatMark stat={d.stat} />
                <span className="num text-17">
                  <span className="text-ink-3">{d.from}</span>
                  <span aria-hidden className="mx-2 font-sans text-ink-3">
                    →
                  </span>
                  <span className="sr-only"> to </span>
                  <span className="text-ink">{d.to}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3">
          <span aria-hidden className="block h-0.5 overflow-hidden bg-s3">
            {!held && (
              <motion.span
                className="block h-full origin-left bg-rare"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: TOTAL_MS / 1000, ease: 'linear' }}
              />
            )}
          </span>
          <Button
            ref={continueRef}
            block
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              doneRef.current();
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}
