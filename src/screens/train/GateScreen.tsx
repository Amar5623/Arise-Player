import { CaretRight, CheckCircle, Play } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router';
import { patchDraft } from '@/app/commands/draft';
import { setQuick, toggleQuest } from '@/app/commands/day';
import { useToday } from '@/app/stores/clock';
import { RankBadge } from '@/components/system/RankBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { CtaDock } from '@/components/ui/CtaDock';
import { Pips } from '@/components/ui/Pips';
import { SectionHead } from '@/components/ui/SectionHead';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { anyExercise, LADDERS } from '@/data/ladders';
import { PLAN, REST_DAY, WARMUP } from '@/data/plan';
import { RANK_COLOR } from '@/data/ranks';
import { prescribe, type PrescribedItem, type Prescription } from '@/engine/prescription';
import {
  useDay,
  useExerciseProgress,
  useGateDraft,
  useLadders,
  usePrescription,
  useProfile,
  useSessions,
  useXpSummary,
} from '@/db/hooks';
import { addDays, DAY_SHORT, startOfWeek, weekday } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { doseText } from './dose';

const SHORT_FOCUS = ['Push', 'Squat', 'Pull', 'Hinge', 'Circuit', 'Combat'] as const;

function WeekStrip({ today, done }: { today: string; done: Set<string> }) {
  const monday = startOfWeek(today);
  return (
    <ol aria-label="This week" className="grid grid-cols-6 gap-1">
      {PLAN.map((d, i) => {
        const date = addDays(monday, i);
        const isToday = date === today;
        const cleared = done.has(date);
        return (
          <li
            key={d.day}
            aria-current={isToday ? 'date' : undefined}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-ctl border',
              isToday ? 'border-sys bg-sys-dim' : 'border-line bg-s1',
            )}
          >
            <span className={cn('hud-11', isToday ? 'text-sys' : 'text-ink-3')}>
              {DAY_SHORT[i]}
            </span>
            <span className={cn('text-11', isToday ? 'text-ink' : 'text-ink-2')}>
              {SHORT_FOCUS[i]}
            </span>
            {cleared ? (
              <CheckCircle weight="fill" aria-label="cleared" className="size-3.5 text-ok" />
            ) : (
              <span className="h-3.5" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ExerciseCard({ it }: { it: PrescribedItem }) {
  const ladder = it.ladder ? LADDERS[it.ladder] : null;
  const next = ladder && it.step !== undefined ? ladder.steps[it.step] : undefined;
  return (
    <Link
      to={`/train/exercise/${it.exerciseId}`}
      className="group flex tap gap-3 border-t border-line px-4 py-3 transition-colors duration-(--dur-1) first:border-t-0 hover:bg-s2 active:bg-s3"
    >
      <span className="w-5 shrink-0 pt-0.5 num text-15 text-ink-3">
        {String(it.order).padStart(2, '0')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-15 font-medium text-ink">{it.name}</span>
          <span className="shrink-0 num text-17 text-ink">
            {it.sets}
            <span className="mx-1 font-sans text-13 text-ink-3">×</span>
            {it.target}
            <span className="ml-1 font-sans text-13 text-ink-2">{doseText(it)}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-13 text-ink-2">
          {it.range ? (
            <span>
              Range{' '}
              <span className="num text-ink">
                {it.range[0]}-{it.range[1]}
              </span>
            </span>
          ) : (
            <span>Fixed dose</span>
          )}
          <span>
            Rest{' '}
            {it.rest > 0 ? (
              <>
                <span className="num text-ink">{it.rest}</span> s
              </>
            ) : (
              'none'
            )}
          </span>
          {ladder && it.step !== undefined && (
            <Pips total={ladder.steps.length} current={it.step} label={`${ladder.name} ladder`} />
          )}
        </div>
        {ladder && it.progresses && (
          <p className="text-13 text-ink-3">
            {next ? (
              <>
                Next unlock: <span className="text-ink-2">{next.name}</span> at {it.range?.[1]} on
                every set
              </>
            ) : (
              'Top of the ladder. Slow the tempo.'
            )}
          </p>
        )}
      </div>
      <CaretRight aria-hidden className="mt-1 size-4 shrink-0 text-ink-3" />
    </Link>
  );
}

function GateHeader({ p, rank }: { p: Prescription; rank: ReturnType<typeof useXpSummary> }) {
  const r = rank?.rank ?? 'E';
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="hud-13" style={{ color: RANK_COLOR[r] }}>
          {r}-rank Gate
        </p>
        <h1 className="hud-28 text-ink">{p.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {p.condition === 'FATIGUED' && <Badge tone="warn">Recovery</Badge>}
          {p.condition === 'INJURED' && <Badge tone="bad">Injured</Badge>}
          {p.deload && <Badge>Deload</Badge>}
          <span className="text-13 text-ink-2">
            About <span className="num text-ink">{p.estMinutes}</span> min, {p.items.length}{' '}
            exercises
          </span>
        </div>
      </div>
      <RankBadge rank={r} size="md" className="mt-1" />
    </header>
  );
}

export function GateScreen() {
  const today = useToday();
  const navigate = useNavigate();
  const p = usePrescription(today);
  const rec = useDay(today);
  const draft = useGateDraft(today);
  const sessions = useSessions();
  const summary = useXpSummary();

  if (!p || rec === undefined) return <GateSkeleton />;
  if (p.rest) return <RestDay today={today} />;

  const gate = rec?.quests.find((q) => q.kind === 'gate');
  const cleared = gate?.done ?? false;
  const todays = sessions?.filter((s) => s.date === today) ?? [];
  const weekDone = new Set(
    (sessions ?? []).filter((s) => s.date >= startOfWeek(today)).map((s) => s.date),
  );
  const warm = draft?.warmup ?? WARMUP.map(() => false);
  const started =
    !!draft && (draft.index > 0 || Object.keys(draft.logged).length > 0 || warm.some(Boolean));

  return (
    <div className="flex flex-col gap-5 px-4 pt-[calc(16px+var(--safe-top))] pb-[calc(var(--cta-h)+40px)]">
      <WeekStrip today={today} done={weekDone} />
      <GateHeader p={p} rank={summary} />

      {!cleared && p.mode !== 'injured' && (
        <Segmented
          label="Session length"
          value={p.quick ? 'quick' : 'full'}
          onChange={(v) => void setQuick(today, v === 'quick')}
          options={[
            { value: 'full', label: 'Full session' },
            { value: 'quick', label: 'Short on time (30 min)' },
          ]}
        />
      )}

      {p.notes.length > 0 && (
        <ul className="flex flex-col gap-1 text-13 text-ink-2">
          {p.notes.map((n) => (
            <li key={n} className="flex gap-2">
              <span aria-hidden className="mt-2 h-px w-2 shrink-0 bg-ink-3" />
              {n}
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="warm">
        <SectionHead
          id="warm"
          className="pt-0"
          action={
            <span className="num text-13 text-ink-2">
              {warm.filter(Boolean).length}/{WARMUP.length}
            </span>
          }
        >
          Corrective warm-up, 8 min
        </SectionHead>
        <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-s1">
          {WARMUP.map((w, i) => {
            const ex = anyExercise(w.exerciseId);
            return (
              <div key={w.exerciseId} className="flex min-h-14 items-center gap-1 pr-4">
                <Checkbox
                  checked={warm[i] ?? false}
                  label={`${ex.name}, ${w.dose}`}
                  disabled={cleared}
                  onChange={(v) =>
                    void patchDraft(today, (d) => ({
                      warmup: d.warmup.map((x, j) => (j === i ? v : x)),
                    }))
                  }
                />
                <span className="flex min-w-0 flex-1 flex-col py-2">
                  <span className="text-15 text-ink">{ex.name}</span>
                  <span className="text-13 text-ink-2">{w.fixes}</span>
                </span>
                <span className="max-w-24 shrink-0 text-right text-13 text-ink-2">{w.dose}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="ex">
        <SectionHead id="ex" className="pt-0">
          {p.rounds ? `Circuit, ${p.rounds} rounds` : 'Exercises'}
        </SectionHead>
        <div className="overflow-hidden rounded-card border border-line bg-s1">
          {p.items.map((it) => (
            <ExerciseCard key={it.key} it={it} />
          ))}
        </div>
      </section>

      <CtaDock>
        {cleared ? (
          <Button
            size="lg"
            block
            icon={<CheckCircle weight="fill" className="text-ok" />}
            disabled={!todays.length}
            onClick={() => {
              const last = todays[todays.length - 1];
              if (last) navigate(`/gate/cleared/${last.id}`);
            }}
          >
            Gate cleared. View summary
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            block
            icon={<Play weight="fill" />}
            onClick={() => navigate('/gate/focus')}
          >
            {started ? 'Resume Gate' : 'Start Gate'}
          </Button>
        )}
      </CtaDock>
    </div>
  );
}

function RestDay({ today }: { today: string }) {
  const rec = useDay(today);
  const profile = useProfile();
  const ladders = useLadders();
  const exercises = useExerciseProgress();
  const walk = rec?.quests.find((q) => q.kind === 'walk');
  const monday = addDays(today, 7 - weekday(today));
  const next =
    profile && ladders && exercises
      ? prescribe({
          date: monday,
          programStart: profile.programStart,
          condition: 'OPTIMAL',
          quick: false,
          ladders,
          exercises,
        })
      : null;

  return (
    <div className="flex flex-col gap-5 px-4 pt-[calc(16px+var(--safe-top))] pb-10">
      <header className="flex flex-col gap-2">
        <p className="hud-13 text-ink-2">Sunday</p>
        <h1 className="hud-28 text-ink">Rest + walk</h1>
        <p className="text-15 text-ink-2">No Gate today. Walk, sleep 7-8 hours, prepare Monday.</p>
      </header>
      {walk && (
        <div className="flex min-h-16 items-center gap-1 rounded-card border border-line bg-s1 pr-4">
          <Checkbox
            checked={walk.done}
            label={walk.title}
            onChange={(v) => void toggleQuest(today, walk.id, v)}
          />
          <span className="flex flex-1 flex-col py-2">
            <span className="text-15 text-ink">{REST_DAY.walk}</span>
            <span className="text-13 text-ink-2">{REST_DAY.walkDetail}</span>
          </span>
          <span className="num text-13 text-ink-2">+{walk.xp} AGI</span>
        </div>
      )}
      <section aria-labelledby="opt">
        <SectionHead id="opt" className="pt-0">
          Optional mobility
        </SectionHead>
        <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-s1">
          {REST_DAY.optional.map((id) => {
            const ex = anyExercise(id);
            return (
              <Link
                key={id}
                to={`/train/exercise/${id}`}
                className="flex min-h-14 tap items-center justify-between px-4 hover:bg-s2 active:bg-s3"
              >
                <span className="flex flex-col py-2">
                  <span className="text-15 text-ink">{ex.name}</span>
                  <span className="text-13 text-ink-2">{ex.cue}</span>
                </span>
                <CaretRight aria-hidden className="size-4 text-ink-3" />
              </Link>
            );
          })}
        </div>
      </section>
      {next && !next.rest && (
        <section aria-labelledby="next">
          <SectionHead id="next" className="pt-0">
            Next Gate, Monday
          </SectionHead>
          <div className="rounded-card border border-line bg-s1 p-4">
            <p className="hud-17 text-ink">{next.name}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {next.items.map((it) => (
                <li key={it.key} className="flex justify-between text-13">
                  <span className="text-ink-2">{it.name}</span>
                  <span className="num text-ink">
                    {it.sets} × {it.target} {doseText(it)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

function GateSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-5 px-4 pt-[calc(16px+var(--safe-top))]">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
