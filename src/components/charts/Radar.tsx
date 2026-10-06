import { STAT_KEYS, type Stat } from '@/engine/types';
import { STAT_COLOR, STATS } from '@/data/stats';
import { cn } from '@/lib/cn';
import { useWidth } from '@/lib/useWidth';

export interface RadarProps {
  values: Record<Stat, number>;
  /** Outer ring value. Defaults to the next multiple of 10 above the max. */
  max?: number;
  /** Largest web diameter box; the chart shrinks to fit its container. */
  maxSize?: number;
  className?: string;
}

const RINGS = [0.25, 0.5, 0.75, 1];

/** Six stats on one web. Single series: sys stroke, 12% wash, stat-tinted vertices. */
export function Radar({ values, max, maxSize = 240, className }: RadarProps) {
  const [ref, width] = useWidth<HTMLElement>();
  const top =
    max ?? Math.max(20, Math.ceil(Math.max(...STAT_KEYS.map((k) => values[k])) / 10) * 10);
  const padY = 26;
  const padX = 58;
  const size = Math.max(140, Math.min(maxSize, width - padX * 2));
  const c = size / 2;
  const r = c - padY;
  const vbW = size + padX * 2;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / STAT_KEYS.length;
  const pt = (i: number, f: number) =>
    [padX + c + Math.cos(angle(i)) * r * f, c + Math.sin(angle(i)) * r * f] as const;
  const shape = STAT_KEYS.map((k, i) => pt(i, Math.min(1, values[k] / top)).join(',')).join(' ');
  const summary = STAT_KEYS.map((k) => `${k} ${values[k]}`).join(', ');

  return (
    <figure ref={ref} className={cn('relative m-0 flex w-full justify-center', className)}>
      <svg
        viewBox={`0 0 ${vbW} ${size}`}
        width={vbW}
        height={size}
        role="img"
        aria-label={`Stat radar: ${summary}`}
      >
        {RINGS.map((f) => (
          <polygon
            key={f}
            points={STAT_KEYS.map((_, i) => pt(i, f).join(',')).join(' ')}
            fill="none"
            stroke="var(--color-line-2)"
            strokeWidth={1}
          />
        ))}
        {STAT_KEYS.map((k, i) => {
          const [x, y] = pt(i, 1);
          return (
            <line
              key={k}
              x1={padX + c}
              y1={c}
              x2={x}
              y2={y}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={shape}
          fill="var(--color-sys)"
          fillOpacity={0.12}
          stroke="var(--color-sys)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {STAT_KEYS.map((k, i) => {
          const [x, y] = pt(i, Math.min(1, values[k] / top));
          return (
            <circle
              key={k}
              cx={x}
              cy={y}
              r={4}
              fill={STAT_COLOR[k]}
              stroke="var(--color-s1)"
              strokeWidth={2}
            />
          );
        })}
        {STAT_KEYS.map((k, i) => {
          const [x, y] = pt(i, 1.14);
          const anchor = Math.abs(x - padX - c) < 4 ? 'middle' : x > padX + c ? 'start' : 'end';
          return (
            <text key={k} x={x} y={y} textAnchor={anchor} dominantBaseline="central">
              <tspan
                fill="var(--color-ink-2)"
                fontFamily="var(--font-display)"
                fontWeight={600}
                fontSize={11}
                letterSpacing="0.12em"
              >
                {k}
              </tspan>
              <tspan dx={5} fill="var(--color-ink)" fontFamily="var(--font-mono)" fontSize={11}>
                {values[k]}
              </tspan>
            </text>
          );
        })}
      </svg>
      <div className="sr-only">
        <table>
          <caption>Stats</caption>
          <tbody>
            {STATS.map((s) => (
              <tr key={s.key}>
                <th scope="row">{s.name}</th>
                <td>{values[s.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
