import { CalendarBlank, Gear, Lock, Plus, Scroll } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router';
import { equipTitle } from '@/app/commands/settings';
import { useToday } from '@/app/stores/clock';
import { toast } from '@/app/stores/toasts';
import { useSheet } from '@/app/useSheet';
import { BodyLogSheet } from '@/components/app/BodyLogSheet';
import { Heatmap } from '@/components/charts/Heatmap';
import { LineChart } from '@/components/charts/LineChart';
import { Radar } from '@/components/charts/Radar';
import { RankBadge } from '@/components/system/RankBadge';
import { StatMark } from '@/components/system/StatMark';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { XpBar } from '@/components/ui/Meter';
import { Pips } from '@/components/ui/Pips';
import { SectionHead } from '@/components/ui/SectionHead';
import { Skeleton } from '@/components/ui/Skeleton';
import { LADDER_KEYS, LADDERS } from '@/data/ladders';
import { RANK_COLOR } from '@/data/ranks';
import { STATS } from '@/data/stats';
import { TITLES, titleName } from '@/data/titles';
import { adherence7, heatmap } from '@/engine/adherence';
import { statValues } from '@/engine/levels';
import { currentStreak } from '@/engine/streak';
import type { Stat } from '@/engine/types';
import {
  useBody,
  useDays,
  useLadders,
  useMeta,
  usePlayer,
  useProfile,
  useXpSummary,
} from '@/db/hooks';
import { repo } from '@/db/repos';
import { dayMonth, diffDays } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { StatSheet } from './StatSheet';

const MONTHLY_CHECKS = [
  'Side posture photo, same clothes and light.',
  'Wall test: heels, hips, upper back and head on the wall. A gap bigger than a hand at the lower back means pelvic tilt.',
  'Squat from the front: knees stay over the 2nd-3rd toe?',
  'Standing: feet point 10-15 degrees out, not 30+?',
];

export function StatusScreen() {
  const today = useToday();
  const navigate = useNavigate();
  const profile = useProfile();
  const summary = useXpSummary();
  const player = usePlayer();
  const days = useDays();
  const ladders = useLadders();
  const body = useBody();
  const lastCheck = useMeta<string>('monthlyCheck');
  const statSheet = useSheet<Stat>('stat');
  const bodySheet = useSheet('body');

  if (!profile || !summary || !days || !ladders || !body) return <StatusSkeleton />;

  const values = statValues(summary.statXp);
  const streak = currentStreak(today, days, profile.joinedAt);
  const adh = adherence7(today, days, profile.joinedAt);
  const cells = heatmap(today, days, profile.joinedAt);
  const owned = player?.titles ?? ['awakened'];
  const equipped = player?.equippedTitle ?? 'awakened';
  const rank = summary.rank;

  const first = body[0];
  const last = body[body.length - 1];
  const whr = last?.waistCm && last.hipsCm ? last.waistCm / last.hipsCm : null;
  const delta = (a?: number, b?: number) =>
    a !== undefined && b !== undefined && first !== last ? a - b : null;
  const dW = delta(last?.weightKg, first?.weightKg);
  const dWaist = delta(last?.waistCm, first?.waistCm);
  const weights = body
    .filter((b) => b.weightKg !== undefined)
    .map((b) => ({ label: dayMonth(b.date), value: b.weightKg ?? 0 }));
  const checkDue =
    lastCheck === null || lastCheck === undefined || diffDays(lastCheck, today) >= 28;

  return (
    <div className="flex flex-col gap-6 px-4 pt-[calc(12px+var(--safe-top))] pb-10">
      <div className="-mr-2 flex items-center justify-between">
        <p className="hud-13 text-ink-2">Status</p>
        <IconButton label="Settings" onClick={() => navigate('/settings')}>
          <Gear />
        </IconButton>
      </div>

      <section
        aria-label="Level"
        className="-mt-4 grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-4"
      >
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-17 font-semibold text-ink">{profile.name}</p>
          <p className="hud-13 text-rare">{titleName(equipped) ?? 'No title'}</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="pb-2 hud-17 text-ink-2">Lv</span>
            <span className="num text-64 leading-none font-semibold tracking-tight text-ink">
              {summary.level}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 pb-1">
          <RankBadge rank={rank} size="lg" />
          <span className="hud-11" style={{ color: RANK_COLOR[rank] }}>
            Rank {rank}
          </span>
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <XpBar into={summary.into} next={summary.next} />
          <div className="flex justify-between text-13 text-ink-2">
            <span>
              <span className="num text-ink">{summary.into}</span> /{' '}
              <span className="num">{summary.next}</span> XP
            </span>
            <span>
              <span className="num">{summary.next - summary.into}</span> to level{' '}
              {summary.level + 1}
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="stats">
        <SectionHead id="stats" className="pt-0">
          Stats
        </SectionHead>
        <div className="rounded-card border border-line bg-s1 pt-2">
          <Radar values={values} maxSize={220} />
          <ul className="grid grid-cols-3 border-t border-line">
            {STATS.map((s, i) => (
              <li
                key={s.key}
                className={cn(
                  i % 3 !== 0 && 'border-l border-line',
                  i >= 3 && 'border-t border-line',
                )}
              >
                <button
                  type="button"
                  onClick={() => statSheet.show(s.key)}
                  aria-label={`${s.name} ${values[s.key]}. Show what feeds it.`}
                  className="flex min-h-16 w-full tap flex-col items-start justify-center gap-0.5 px-3 py-2 transition-colors duration-(--dur-1) hover:bg-s2 active:bg-s3"
                >
                  <StatMark stat={s.key} />
                  <span className="num text-22 text-ink">{values[s.key]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Record" className="grid grid-cols-4 border-y border-line py-3">
        {[
          { label: 'Streak', value: String(streak) },
          { label: 'Best', value: String(Math.max(player?.bestStreak ?? 0, streak)) },
          { label: 'Gates', value: String(player?.gatesCleared ?? 0) },
          { label: '7-day', value: adh === null ? '-' : `${Math.round(adh * 100)}%` },
        ].map((r, i) => (
          <div
            key={r.label}
            className={cn('flex flex-col gap-0.5', i > 0 && 'border-l border-line pl-3')}
          >
            <span className="hud-11 text-ink-2">{r.label}</span>
            <span className="num text-22 text-ink">{r.value}</span>
          </div>
        ))}
      </section>

      <section aria-labelledby="record">
        <SectionHead
          id="record"
          className="pt-0"
          action={
            <Link
              to="/status/history"
              className="-mr-1 inline-flex min-h-11 tap items-center gap-1 px-1 text-13 text-ink-2 hover:text-ink"
            >
              <CalendarBlank className="size-4" aria-hidden />
              History
            </Link>
          }
        >
          Quest record
        </SectionHead>
        <div className="rounded-card border border-line bg-s1 p-4">
          <Heatmap cells={cells} />
        </div>
      </section>

      <section aria-labelledby="ladders">
        <SectionHead id="ladders" className="pt-0">
          Skill ladders
        </SectionHead>
        <ListGroup>
          {LADDER_KEYS.map((k) => {
            const l = LADDERS[k];
            const lp = ladders[k];
            const step = l.steps[lp.step - 1];
            return (
              <ListRow
                key={k}
                title={step?.name ?? l.name}
                detail={`${l.name} ladder, step ${lp.step} of ${l.steps.length}`}
                trailing={
                  <Pips total={l.steps.length} current={lp.step} label={`${l.name} ladder`} />
                }
                onClick={() => step && navigate(`/train/exercise/${step.id}`)}
              />
            );
          })}
        </ListGroup>
      </section>

      <section aria-labelledby="body">
        <SectionHead
          id="body"
          className="pt-0"
          action={
            <Button
              variant="ghost"
              icon={<Plus />}
              onClick={() => bodySheet.show()}
              className="-mr-2"
            >
              Log
            </Button>
          }
        >
          Body
        </SectionHead>
        <div className="flex flex-col gap-4 rounded-card border border-line bg-s1 p-4">
          {last ? (
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-13 text-ink-2">Weight</dt>
                <dd className="num text-22 text-ink">
                  {last.weightKg ?? '-'}
                  <span className="ml-1 font-sans text-13 text-ink-2">kg</span>
                </dd>
                {dW !== null && (
                  <dd className={cn('num text-13', dW <= 0 ? 'text-ok' : 'text-ink-2')}>
                    {dW > 0 ? '+' : ''}
                    {dW.toFixed(1)}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-13 text-ink-2">Waist</dt>
                <dd className="num text-22 text-ink">
                  {last.waistCm ?? '-'}
                  <span className="ml-1 font-sans text-13 text-ink-2">cm</span>
                </dd>
                {dWaist !== null && (
                  <dd className={cn('num text-13', dWaist <= 0 ? 'text-ok' : 'text-ink-2')}>
                    {dWaist > 0 ? '+' : ''}
                    {dWaist.toFixed(1)}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-13 text-ink-2">Waist : hip</dt>
                <dd className="num text-22 text-ink">{whr ? whr.toFixed(2) : '-'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-15 text-ink-2">
              No measurements yet. Weigh in on a Monday morning, before food.
            </p>
          )}
          {weights.length >= 2 && (
            <LineChart points={weights} unit="kg" title="Weight" digits={1} height={140} />
          )}
          <p className="text-13 text-ink-3">Change since the first entry. Green means down.</p>
        </div>
        {checkDue && (
          <div className="mt-3 flex flex-col gap-3 rounded-card border border-line-2 bg-s1 p-4">
            <div className="flex items-baseline justify-between">
              <p className="hud-13 text-ink">Monthly check</p>
              <span className="text-13 text-ink-2">Due</span>
            </div>
            <ul className="flex flex-col gap-2">
              {MONTHLY_CHECKS.map((c) => (
                <li key={c} className="flex gap-2 text-13 text-ink-2">
                  <span aria-hidden className="mt-2 h-px w-2 shrink-0 bg-ink-3" />
                  {c}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => {
                void repo.meta.set('monthlyCheck', today);
                toast({
                  tone: 'sys',
                  label: 'Monthly check',
                  message: 'Recorded. Next one in four weeks.',
                });
              }}
            >
              Mark done
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby="titles">
        <SectionHead
          id="titles"
          className="pt-0"
          action={
            <span className="num text-13 text-ink-2">
              {owned.length}/{TITLES.length}
            </span>
          }
        >
          Titles
        </SectionHead>
        <ul className="grid grid-cols-2 gap-2">
          {TITLES.map((t) => {
            const has = owned.includes(t.id);
            const on = equipped === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={!has}
                  aria-pressed={has ? on : undefined}
                  onClick={() => {
                    void equipTitle(t.id);
                    toast({ tone: 'rare', label: 'Title equipped', message: t.name });
                  }}
                  className={cn(
                    'flex min-h-20 w-full tap flex-col items-start gap-1 rounded-ctl border px-3 py-2.5 text-left transition-colors duration-(--dur-1)',
                    on && 'border-rare bg-rare-dim',
                    has && !on && 'border-line-2 bg-s1 hover:border-line-3 active:bg-s2',
                    !has && 'border-line bg-transparent',
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-15',
                      has ? 'text-ink' : 'text-ink-3',
                    )}
                  >
                    {!has && <Lock className="size-3.5" aria-label="Locked" />}
                    {t.name}
                  </span>
                  <span
                    className={cn(
                      'text-13',
                      on ? 'hud-11 text-rare' : has ? 'text-ink-2' : 'text-ink-3',
                    )}
                  >
                    {on ? 'Equipped' : t.condition}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <ListGroup>
        <ListRow
          leading={<Scroll />}
          title="Weekly System Report"
          detail={
            profile.aiEnabled
              ? 'Status, strengths, weak points, next week'
              : 'Needs AI, off in Settings'
          }
          onClick={() => navigate('/status/report')}
        />
        <ListRow
          leading={<CalendarBlank />}
          title="History"
          detail="Every day since you joined"
          onClick={() => navigate('/status/history')}
        />
      </ListGroup>

      <StatSheet
        stat={statSheet.data ?? null}
        open={statSheet.open}
        onOpenChange={statSheet.onOpenChange}
      />
      <BodyLogSheet
        open={bodySheet.open}
        onOpenChange={bodySheet.onOpenChange}
        onDone={bodySheet.hide}
      />
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-5 px-4 pt-[calc(16px+var(--safe-top))]">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-20 w-48" />
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
