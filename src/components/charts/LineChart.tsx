import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useWidth } from '@/lib/useWidth';

export interface LinePoint {
  /** Short x label, e.g. "5 Oct". */
  label: string;
  value: number;
}

export interface LineChartProps {
  points: readonly LinePoint[];
  unit: string;
  title: string;
  height?: number;
  /** Decimal places for values. */
  digits?: number;
  className?: string;
}

function niceTicks(min: number, max: number, count = 3): number[] {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/** One series over time: 2px sys line, 10% wash, end label, crosshair + tooltip. */
export function LineChart({
  points,
  unit,
  title,
  height = 160,
  digits = 0,
  className,
}: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const fmt = (v: number) => v.toFixed(digits);

  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const lo = ticks[0] ?? 0;
  const hi = ticks[ticks.length - 1] ?? 1;
  const left = 36;
  const right = 64;
  const top = 10;
  const bottom = 22;
  const w = Math.max(width, 160);
  const x = (i: number) => left + (i * (w - left - right)) / (points.length - 1);
  const y = (v: number) => top + (1 - (v - lo) / (hi - lo || 1)) * (height - top - bottom);
  const d = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ');
  const lastI = points.length - 1;
  const last = points[lastI];
  const active = hover !== null ? points[hover] : undefined;

  const onMove = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    const i = Math.round(((px - left) / (w - left - right)) * (points.length - 1));
    setHover(Math.min(lastI, Math.max(0, i)));
  };

  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      <svg
        width={w}
        height={height}
        role="img"
        aria-label={`${title}: from ${fmt(points[0]?.value ?? 0)} to ${fmt(last?.value ?? 0)} ${unit}`}
        className="touch-pan-y"
        onPointerMove={(e) =>
          e.pointerType === 'mouse' && onMove(e.clientX, e.currentTarget.getBoundingClientRect())
        }
        onPointerDown={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={w - right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" />
            <text
              x={left - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="central"
              fill="var(--color-ink-3)"
              fontFamily="var(--font-mono)"
              fontSize={11}
            >
              {fmt(t)}
            </text>
          </g>
        ))}
        <text
          x={left}
          y={height - 4}
          fill="var(--color-ink-3)"
          fontFamily="var(--font-mono)"
          fontSize={11}
        >
          {points[0]?.label}
        </text>
        <text
          x={w - right}
          y={height - 4}
          textAnchor="end"
          fill="var(--color-ink-3)"
          fontFamily="var(--font-mono)"
          fontSize={11}
        >
          {last?.label}
        </text>
        <path
          d={d}
          fill="none"
          stroke="var(--color-sys)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {last && (
          <>
            <circle
              cx={x(lastI)}
              cy={y(last.value)}
              r={4}
              fill="var(--color-sys)"
              stroke="var(--color-s1)"
              strokeWidth={2}
            />
            <text
              x={x(lastI) + 8}
              y={y(last.value)}
              dominantBaseline="central"
              fill="var(--color-ink)"
              fontFamily="var(--font-mono)"
              fontSize={11}
            >
              {fmt(last.value)} {unit}
            </text>
          </>
        )}
        {hover !== null && active && (
          <g pointerEvents="none">
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={top}
              y2={height - bottom}
              stroke="var(--color-line-3)"
            />
            <circle
              cx={x(hover)}
              cy={y(active.value)}
              r={5}
              fill="var(--color-sys)"
              stroke="var(--color-s1)"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>
      {hover !== null && active && (
        <div
          className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col rounded-mark border border-line-2 bg-s3 px-2 py-1"
          style={{ left: Math.min(w - 48, Math.max(48, x(hover))) }}
        >
          <span className="num text-11 text-ink-2">{active.label}</span>
          <span className="num text-13 text-ink">
            {fmt(active.value)} {unit}
          </span>
        </div>
      )}
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <tbody>
            {points.map((p) => (
              <tr key={p.label}>
                <th scope="row">{p.label}</th>
                <td>
                  {fmt(p.value)} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
