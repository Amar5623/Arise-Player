import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useToday } from '@/app/stores/clock';
import { ScreenHeader } from '@/components/app/ScreenHeader';
import { IconButton } from '@/components/ui/IconButton';
import { dayRatio } from '@/engine/quests';
import { useDays, useProfile } from '@/db/hooks';
import { DAY_SHORT, toISO } from '@/lib/dates';
import { cn } from '@/lib/cn';

const fill = (r: number) =>
  r >= 1 ? 'bg-heat-4' : r >= 0.8 ? 'bg-heat-3' : r >= 0.5 ? 'bg-heat-2' : r > 0 ? 'bg-heat-1' : '';

/** Calendar of past days. Each day opens its record. */
export function HistoryScreen() {
  const today = useToday();
  const days = useDays();
  const profile = useProfile();
  const [month, setMonth] = useState(() => {
    const d = new Date(`${today}T12:00:00`);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const first = new Date(month.y, month.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(month.y, month.m + 1, 0).getDate();
  const cells = Array.from({ length: lead + count }, (_, i) =>
    i < lead ? null : toISO(new Date(month.y, month.m, i - lead + 1)),
  );
  const joined = profile?.joinedAt ?? today;
  const canPrev = toISO(first) > joined.slice(0, 8) + '01';
  const canNext = toISO(new Date(month.y, month.m + 1, 1)) <= today;
  const shift = (n: number) =>
    setMonth((m) => ({
      y: m.m + n < 0 ? m.y - 1 : m.m + n > 11 ? m.y + 1 : m.y,
      m: (m.m + n + 12) % 12,
    }));

  return (
    <>
      <ScreenHeader title="History" back="/status" />
      <div className="flex flex-col gap-4 px-4 pt-2 pb-10">
        <div className="flex items-center justify-between">
          <IconButton label="Previous month" disabled={!canPrev} onClick={() => shift(-1)}>
            <CaretLeft />
          </IconButton>
          <h2 className="hud-17 text-ink" aria-live="polite">
            {first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h2>
          <IconButton label="Next month" disabled={!canNext} onClick={() => shift(1)}>
            <CaretRight />
          </IconButton>
        </div>
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Days">
          {DAY_SHORT.map((d) => (
            <span key={d} role="columnheader" className="pb-1 text-center hud-11 text-ink-3">
              {d}
            </span>
          ))}
          {cells.map((date, i) => {
            if (!date) return <span key={`e${i}`} />;
            const rec = days?.get(date);
            const inRange = date >= joined && date <= today;
            const raw = rec
              ? rec.closed
                ? (rec.ratio ?? 0)
                : dayRatio(rec.quests)
              : inRange && date < today
                ? 0
                : null;
            // Today is in progress: show it only once something is done.
            const ratio = date === today && raw === 0 ? null : raw;
            const label = `${date}, ${ratio === null ? 'no record' : `${Math.round(ratio * 100)}%`}`;
            const n = Number(date.slice(8));
            const body = (
              <>
                <span
                  className={cn(
                    'num text-15',
                    ratio !== null && ratio >= 0.5 ? 'text-ink' : 'text-ink-2',
                  )}
                >
                  {n}
                </span>
                {ratio !== null && (
                  <span className={cn('num text-11', ratio > 0 ? 'text-ink' : 'text-ink-2')}>
                    {Math.round(ratio * 100)}
                  </span>
                )}
              </>
            );
            const cls = cn(
              'flex aspect-square flex-col items-center justify-center rounded-ctl border',
              ratio === null
                ? 'border-transparent text-ink-3'
                : ratio === 0
                  ? 'border-ink-4'
                  : cn('border-transparent', fill(ratio)),
              date === today && 'outline-1 outline-offset-1 outline-ink',
            );
            return inRange ? (
              <Link
                key={date}
                to={`/status/history/${date}`}
                aria-label={label}
                className={cn(cls, 'tap transition-transform duration-(--dur-1) active:scale-95')}
              >
                {body}
              </Link>
            ) : (
              <span key={date} aria-label={label} className={cls}>
                {body}
              </span>
            );
          })}
        </div>
        <p className="text-13 text-ink-3">
          Numbers under each day are the percent of required quests done. Outlined days were missed.
        </p>
      </div>
    </>
  );
}
