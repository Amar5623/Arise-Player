import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useWidth } from '@/lib/useWidth';

export interface HeatCell {
  date: string;
  /** Short label for the tooltip, e.g. "Mon 5 Oct". */
  label: string;
  /** done / total; 0 is a missed day; null is no record (future, or before joining). */
  ratio: number | null;
  done?: number;
  total?: number;
  today?: boolean;
}

/** Ordinal one-hue ramp, validated; tops out below full sys so the record stays quiet. */
const LEVELS = [
  { min: 0.01, fill: 'var(--color-heat-1)', name: '1 to 49%' },
  { min: 0.5, fill: 'var(--color-heat-2)', name: '50 to 79%' },
  { min: 0.8, fill: 'var(--color-heat-3)', name: '80 to 99%' },
  { min: 1, fill: 'var(--color-heat-4)', name: '100%' },
] as const;

function fillFor(ratio: number): string | null {
  let found: string | null = null;
  for (const l of LEVELS) if (ratio >= l.min) found = l.fill;
  return found;
}

const ROWS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

/** 12 weeks x 7 days, Monday first, one column per week. Tap a day to pin its numbers. */
export function Heatmap({ cells, className }: { cells: readonly HeatCell[]; className?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const weeks = Math.ceil(cells.length / 7);
  const labelW = 30;
  const gap = 3;
  const size = Math.max(10, Math.min(22, Math.floor((width - labelW - gap * (weeks - 1)) / weeks)));
  const h = size * 7 + gap * 6;
  const w = labelW + weeks * size + (weeks - 1) * gap;
  const cell = active !== null ? cells[active] : undefined;
  const recorded = cells.filter((c) => c.ratio !== null);
  const strong = recorded.filter((c) => (c.ratio ?? 0) >= 0.8).length;
  const pos = (i: number) => ({
    x: labelW + Math.floor(i / 7) * (size + gap),
    y: (i % 7) * (size + gap),
  });

  useEffect(() => {
    if (active === null) return;
    const clear = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('[data-heat]')) setActive(null);
    };
    window.addEventListener('pointerdown', clear);
    return () => window.removeEventListener('pointerdown', clear);
  }, [active]);

  return (
    <div ref={ref} className={cn('flex w-full flex-col gap-3', className)}>
      <div className="relative" data-heat>
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`Quest record, last ${weeks} weeks: ${strong} of ${recorded.length} recorded days at 80% or more`}
        >
          {ROWS.map((d, i) => (
            <text
              key={i}
              x={0}
              y={i * (size + gap) + size / 2}
              dominantBaseline="central"
              fill="var(--color-ink-3)"
              fontFamily="var(--font-sans)"
              fontSize={11}
            >
              {d}
            </text>
          ))}
          {cells.map((c, i) => {
            const { x, y } = pos(i);
            const fill = c.ratio === null ? null : fillFor(c.ratio);
            const missed = c.ratio === 0;
            return (
              <g
                key={c.date}
                onPointerDown={() => setActive(i === active ? null : i)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
              >
                <rect
                  x={x + 0.5}
                  y={y + 0.5}
                  width={size - 1}
                  height={size - 1}
                  rx={2}
                  fill={fill ?? 'transparent'}
                  stroke={
                    missed ? 'var(--color-ink-4)' : c.ratio === null ? 'var(--color-line)' : 'none'
                  }
                  strokeWidth={1}
                />
                {missed && (
                  <path
                    d={`M${x + size * 0.32} ${y + size * 0.32}L${x + size * 0.68} ${y + size * 0.68}M${x + size * 0.68} ${y + size * 0.32}L${x + size * 0.32} ${y + size * 0.68}`}
                    stroke="var(--color-ink-4)"
                    strokeWidth={1}
                  />
                )}
                {(c.today || i === active) && (
                  <rect
                    x={x - 1.5}
                    y={y - 1.5}
                    width={size + 3}
                    height={size + 3}
                    rx={3}
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth={1}
                  />
                )}
              </g>
            );
          })}
        </svg>
        {cell && active !== null && (
          <div
            className="pointer-events-none absolute z-(--z-sticky) -translate-x-1/2 -translate-y-full rounded-mark border border-line-2 bg-s3 px-2 py-1 whitespace-nowrap"
            style={{
              left: Math.min(w - 60, Math.max(60, pos(active).x + size / 2)),
              top: pos(active).y - 6,
            }}
          >
            <span className="num text-11 text-ink">
              {cell.label}
              <span className="text-ink-2">
                {cell.ratio === null
                  ? '  no record'
                  : `  ${cell.done ?? 0}/${cell.total ?? 0}  ${Math.round(cell.ratio * 100)}%`}
              </span>
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-11 text-ink-2" aria-hidden>
        <span className="flex items-center gap-1.5">
          <svg width={12} height={12} viewBox="0 0 12 12">
            <rect
              x={0.5}
              y={0.5}
              width={11}
              height={11}
              rx={2}
              fill="none"
              stroke="var(--color-ink-4)"
            />
            <path d="M4 4l4 4M8 4l-4 4" stroke="var(--color-ink-4)" />
          </svg>
          Missed
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {LEVELS.map((l) => (
            <span key={l.name} className="size-3 rounded-mark" style={{ background: l.fill }} />
          ))}
          More
        </span>
      </div>
      <div className="sr-only">
        <table>
          <caption>Quest record by day</caption>
          <tbody>
            {cells
              .filter((c) => c.ratio !== null)
              .map((c) => (
                <tr key={c.date}>
                  <th scope="row">{c.label}</th>
                  <td>{c.ratio === 0 ? 'Missed' : `${Math.round((c.ratio ?? 0) * 100)}%`}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
