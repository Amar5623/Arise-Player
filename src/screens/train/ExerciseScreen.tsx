import { ChartLine, PlayCircle } from '@phosphor-icons/react';
import { useParams } from 'react-router';
import { ScreenHeader } from '@/components/app/ScreenHeader';
import { LineChart } from '@/components/charts/LineChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHead } from '@/components/ui/SectionHead';
import { youtubeUrl } from '@/data/exercises';
import { anyExercise, LADDERS } from '@/data/ladders';
import type { LadderKey } from '@/engine/types';
import { useLadders, useSessions } from '@/db/hooks';
import { dayMonth, shortLabel } from '@/lib/dates';
import { cn } from '@/lib/cn';

export function ExerciseScreen() {
  const { id = '' } = useParams();
  const sessions = useSessions();
  const ladders = useLadders();
  let def;
  try {
    def = anyExercise(id);
  } catch {
    return (
      <>
        <ScreenHeader title="Exercise" back="/train" />
        <EmptyState
          className="m-4"
          icon={<ChartLine weight="thin" />}
          title="Exercise not found"
          body="It may have been renamed. Go back to today’s Gate."
        />
      </>
    );
  }
  const ladderKey = (/^(push|squat|pull)-\d$/.exec(id)?.[1] ?? null) as LadderKey | null;
  const ladder = ladderKey ? LADDERS[ladderKey] : null;
  const current = ladderKey && ladders ? ladders[ladderKey].step : null;
  const unit = def.unit === 'sec' ? 's' : def.steps ? 'steps' : 'reps';

  const history = (sessions ?? [])
    .map((s) => {
      const e = s.entries.find((x) => x.exerciseId === id);
      const done = e?.sets.filter((v): v is number => v !== null) ?? [];
      return e && done.length
        ? { date: s.date, sets: e.sets, best: Math.max(...done), rpe: e.rpe, pain: e.pain }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <>
      <ScreenHeader
        title={def.name}
        back="/train"
        sub={ladder ? `${ladder.name} ladder` : undefined}
      />
      <div className="flex flex-col gap-6 px-4 pt-2 pb-10">
        <div className="flex flex-col gap-3">
          <p className="text-17 text-ink">{def.cue}</p>
          <a
            href={youtubeUrl(def.name)}
            target="_blank"
            rel="noreferrer"
            className="-ml-1 inline-flex min-h-11 tap items-center gap-1.5 self-start px-1 text-15 text-sys hover:underline"
          >
            <PlayCircle className="size-5" aria-hidden />
            Form tutorial
            <span className="sr-only">(opens YouTube)</span>
          </a>
        </div>

        <section aria-labelledby="how">
          <SectionHead id="how" className="pt-0">
            How to do it
          </SectionHead>
          <ol className="flex flex-col gap-3">
            {def.howTo.map((step, i) => (
              <li key={step} className="flex gap-3 text-15 text-ink-2">
                <span className="w-4 shrink-0 num text-ink-3">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {ladder && (
          <section aria-labelledby="ladder">
            <SectionHead id="ladder" className="pt-0">
              {ladder.name} ladder
            </SectionHead>
            <ol className="overflow-hidden rounded-card border border-line bg-s1">
              {ladder.steps.map((s, i) => {
                const n = i + 1;
                const state =
                  current === null
                    ? 'locked'
                    : n < current
                      ? 'done'
                      : n === current
                        ? 'current'
                        : 'locked';
                return (
                  <li
                    key={s.id}
                    aria-current={state === 'current' ? 'step' : undefined}
                    className={cn(
                      'flex gap-3 border-t border-line px-4 py-3 first:border-t-0',
                      state === 'current' && 'bg-sys-dim',
                    )}
                  >
                    <span
                      className={cn(
                        'w-4 shrink-0 num text-15',
                        state === 'current'
                          ? 'text-sys'
                          : state === 'done'
                            ? 'text-ink-2'
                            : 'text-ink-3',
                      )}
                    >
                      {n}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn('text-15', state === 'locked' ? 'text-ink-2' : 'text-ink')}
                        >
                          {s.name}
                        </span>
                        <span className={cn('shrink-0 hud-11', state === 'current' ? 'text-sys' : 'text-ink-3')}>
                          {state === 'current'
                            ? 'Current'
                            : state === 'done'
                              ? 'Cleared'
                              : `${s.range[0]}-${s.range[1]} ${s.unit === 'sec' ? 's' : 'reps'}`}
                        </span>
                      </div>
                      <p className="text-13 text-ink-2">{s.howTo}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section aria-labelledby="hist">
          <SectionHead id="hist" className="pt-0">
            Best set per session
          </SectionHead>
          {history.length >= 2 ? (
            <div className="rounded-card border border-line bg-s1 p-4">
              <LineChart
                points={history.map((h) => ({ label: dayMonth(h.date), value: h.best }))}
                unit={unit}
                title={`${def.name}, best set`}
              />
            </div>
          ) : (
            <EmptyState
              icon={<ChartLine weight="thin" />}
              title="Not enough sessions yet"
              body="The chart appears after two Gates with this exercise. Log every set to see the climb."
            />
          )}
        </section>

        {history.length > 0 && (
          <section aria-labelledby="last">
            <SectionHead id="last" className="pt-0">
              Last {Math.min(10, history.length)} sessions
            </SectionHead>
            <ul className="divide-y divide-line">
              {history
                .slice(-10)
                .reverse()
                .map((h) => (
                  <li key={h.date} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-15 text-ink-2">{shortLabel(h.date)}</span>
                    <span className="num text-15 text-ink">
                      {h.sets.map((v) => (v === null ? '-' : v)).join('  ')}
                      {h.rpe ? <span className="text-ink-3">{`  @${h.rpe}`}</span> : null}
                      {h.pain ? <span className="text-bad"> pain</span> : null}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
