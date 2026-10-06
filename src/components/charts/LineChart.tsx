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
  /** Formats the end label and tooltip (e.g. money). Defaults to the number plus unit. */
  format?: (v: number) => string;
  className?: string;
}

/** Axis ticks stay short: 42.5k, 3L (Indian lakh) for large values. */
function compact(v: number, digits: number): string {
  const a = Math.abs(v);
  const trim = (n: number) => String(Number(n.toFixed(1)));
  if (a >= 100000) return `${trim(v / 100000)}L`;
  if (a >= 10000) return `${trim(v / 1000)}k`;
  return v.toFixed(digits);
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
  format,
  className,
}: LineChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const fmt = (v: number) => v.toFixed(digits);
  const full = format ?? ((v: number) => `${fmt(v)} ${unit}`);

  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const lo = ticks[0] ?? 0;
  const hi = ticks[ticks.length - 1] ?? 1;
  const lastI = points.length - 1;
  const last = points[lastI];
  const tickText = ticks.map((t) => compact(t, digits));
  const left = Math.max(30, Math.max(...tickText.map((t) => t.length)) * 6.8 + 10);
  const endText = last ? full(last.value) : '';
  const right = Math.max(48, endText.length * 6.8 + 14);
  const top = 10;
  const bottom = 22;
  const w = Math.max(width, 160);
  const x = (i: number) => left + (i * (w - left - right)) / (points.length - 1);
  const y = (v: number) => top + (1 - (v - lo) / (hi - lo || 1)) * (height - top - bottom);
  const d = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ');
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
        aria-label={`${title}: from ${full(points[0]?.value ?? 0)} to ${endText}`}
        className="touch-pan-y"
        onPointerMove={(e) =>
          e.pointerType === 'mouse' && onMove(e.clientX, e.currentTarget.getBoundingClientRect())
        }
        onPointerDown={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
      >
        {ticks.map((t, i) => (
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
              {tickText[i]}
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
              {endText}
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
          <span className="num text-13 text-ink">{full(active.value)}</span>
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
