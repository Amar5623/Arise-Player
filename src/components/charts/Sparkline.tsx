import { cn } from '@/lib/cn';

export interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  label: string;
  /** Line colour; defaults to the de-emphasis ink with the last point in sys. */
  color?: string;
  className?: string;
}

/** A tiny trend. No axes, no hover: the number beside it carries the value. */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  label,
  color = 'var(--color-ink-3)',
  className,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <span
        className={cn('block', className)}
        style={{ width, height }}
        aria-label={`${label}: not enough data`}
        role="img"
      />
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (values.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values[values.length - 1] ?? 0;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`${label}: ${values[0]} to ${last}`}
      className={cn('shrink-0', className)}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(values.length - 1)}
        cy={y(last)}
        r={3}
        fill="var(--color-sys)"
        stroke="var(--color-s1)"
        strokeWidth={2}
      />
    </svg>
  );
}
