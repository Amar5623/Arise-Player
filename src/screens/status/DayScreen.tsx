import { CalendarX, CheckCircle, Circle } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router';
import { ScreenHeader } from '@/components/app/ScreenHeader';
import { ConditionBadge } from '@/components/app/ConditionChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHead } from '@/components/ui/SectionHead';
import { dayRatio, groupQuests } from '@/engine/quests';
import { useBody, useDay, useSessions } from '@/db/hooks';
import { shortLabel } from '@/lib/dates';
import { cn } from '@/lib/cn';

/** One past day: its quests, readiness, Gate and measurements. */
export function DayScreen() {
  const { date = '' } = useParams();
  const rec = useDay(date);
  const sessions = useSessions();
  const body = useBody();
  const session = sessions?.find((s) => s.date === date);
  const entry = body?.find((b) => b.date === date);
  if (rec === undefined) return <ScreenHeader title={shortLabel(date)} back="/status/history" />;
  const ratio = rec ? (rec.closed ? (rec.ratio ?? 0) : dayRatio(rec.quests)) : 0;

  return (
    <>
      <ScreenHeader
        title={shortLabel(date)}
        back="/status/history"
        sub={rec ? `${Math.round(ratio * 100)}% of required quests` : 'Missed'}
      />
      <div className="flex flex-col gap-5 px-4 pt-2 pb-10">
        {!rec || rec.quests.length === 0 ? (
          <EmptyState
            icon={<CalendarX weight="thin" />}
            title="No record for this day"
            body="The app was not opened, so the day closed at 0% and counted as missed."
          />
        ) : (
          <>
            {rec.condition && rec.readiness && (
              <div className="flex items-center gap-3">
                <ConditionBadge condition={rec.condition} />
                <span className="text-13 text-ink-2">
                  Slept <span className="num text-ink">{rec.readiness.sleep}</span> h, energy{' '}
                  <span className="num text-ink">{rec.readiness.energy}</span>, soreness{' '}
                  <span className="num text-ink">{rec.readiness.soreness}</span>
                </span>
              </div>
            )}
            {groupQuests(rec.quests).map((g) => (
              <section key={g.area} aria-label={g.label}>
                <SectionHead className="pt-0">{g.label}</SectionHead>
                <ul className="divide-y divide-line">
                  {g.quests.map((q) => (
                    <li key={q.id} className="flex items-center gap-3 py-2.5">
                      {q.done ? (
                        <CheckCircle
                          weight="fill"
                          className="size-5 shrink-0 text-sys"
                          aria-label="Done"
                        />
                      ) : (
                        <Circle className="size-5 shrink-0 text-ink-4" aria-label="Not done" />
                      )}
                      <span
                        className={cn('min-w-0 flex-1 text-15', q.done ? 'text-ink' : 'text-ink-2')}
                      >
                        {q.title}
                      </span>
                      <span className="num text-13 text-ink-3">
                        {q.done ? '+' : ''}
                        {q.xp} {q.stat}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
        {session && (
          <Link
            to={`/gate/cleared/${session.id}`}
            className="flex min-h-14 tap items-center justify-between rounded-card border border-line bg-s1 px-4 hover:bg-s2"
          >
            <span className="flex flex-col py-2">
              <span className="text-15 text-ink">{session.name}</span>
              <span className="text-13 text-ink-2">
                Gate cleared, +{session.xp} XP. Open the System log.
              </span>
            </span>
          </Link>
        )}
        {entry && (
          <p className="text-13 text-ink-2">
            Measured:{' '}
            {entry.weightKg ? <span className="num text-ink">{entry.weightKg} kg</span> : null}
            {entry.waistCm ? (
              <>
                , waist <span className="num text-ink">{entry.waistCm} cm</span>
              </>
            ) : null}
          </p>
        )}
      </div>
    </>
  );
}
