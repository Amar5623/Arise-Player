import { motion } from 'motion/react';
import type { Rank } from '@/engine/types';
import { RANK_COLOR } from '@/data/ranks';
import { cn } from '@/lib/cn';
import { EASE_OUT } from '@/lib/motion';

const SIZE = { sm: 32, md: 48, lg: 88 } as const;

const OUTER = '12,1.5 36,1.5 46.5,12 46.5,36 36,46.5 12,46.5 1.5,36 1.5,12';
const INNER = '13.8,6 34.2,6 42,13.8 42,34.2 34.2,42 13.8,42 6,34.2 6,13.8';
const WEDGES = [
  '1.5,12 12,1.5 12,6.5',
  '36,1.5 46.5,12 41.5,12',
  '46.5,36 36,46.5 36,41.5',
  '12,46.5 1.5,36 6.5,36',
];

export interface RankBadgeProps {
  rank: Rank;
  size?: keyof typeof SIZE;
  /** Draw the frame stroke by stroke, then the letter (rank-up moment). */
  draw?: boolean;
  /** Delay before drawing, seconds. */
  delay?: number;
  className?: string;
}

/**
 * Rank mark: a cut-corner octagon that gains structure with rank.
 * E dim frame · D full frame · C/B double frame · A/S corner wedges · S tinted core.
 */
export function RankBadge({
  rank,
  size = 'md',
  draw = false,
  delay = 0,
  className,
}: RankBadgeProps) {
  const tint = RANK_COLOR[rank];
  const px = SIZE[size];
  const double = rank === 'C' || rank === 'B' || rank === 'A' || rank === 'S';
  const wedges = rank === 'A' || rank === 'S';
  const stroke = (d: number) =>
    draw
      ? {
          initial: { pathLength: 0 },
          animate: { pathLength: 1 },
          transition: { duration: 0.5, delay: delay + d, ease: EASE_OUT },
        }
      : {};
  const appear = (d: number) =>
    draw
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2, delay: delay + d },
        }
      : {};

  return (
    <svg
      role="img"
      aria-label={`Rank ${rank}`}
      viewBox="0 0 48 48"
      width={px}
      height={px}
      className={cn('shrink-0', className)}
    >
      {rank === 'S' && (
        <motion.polygon points={INNER} fill={tint} fillOpacity={0.12} {...appear(0.5)} />
      )}
      <motion.polygon
        points={OUTER}
        fill="none"
        stroke={tint}
        strokeWidth={1.5}
        strokeOpacity={rank === 'E' ? 0.55 : 1}
        {...stroke(0)}
      />
      {double && (
        <motion.polygon
          points={INNER}
          fill="none"
          stroke={tint}
          strokeWidth={1}
          strokeOpacity={0.6}
          {...stroke(0.15)}
        />
      )}
      {wedges &&
        WEDGES.map((p) => <motion.polygon key={p} points={p} fill={tint} {...appear(0.45)} />)}
      <motion.text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fill={tint}
        fontFamily="var(--font-display)"
        fontWeight={700}
        fontSize={22}
        {...appear(0.35)}
      >
        {rank}
      </motion.text>
    </svg>
  );
}
