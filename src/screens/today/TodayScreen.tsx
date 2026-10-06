import { Play } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { submitReadiness, toggleQuest } from '@/app/commands/day';
import { useToday } from '@/app/stores/clock';
import { useSheet } from '@/app/useSheet';
import { AskSystem } from '@/components/app/AskSystem';
import { BodyLogSheet } from '@/components/app/BodyLogSheet';
import { ConditionChip } from '@/components/app/ConditionChip';
import { Countdown } from '@/components/app/Countdown';
import { StatusCheck } from '@/components/app/StatusCheck';
import { QuestRow } from '@/components/system/QuestRow';
import { SystemWindow } from '@/components/system/SystemWindow';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CtaDock } from '@/components/ui/CtaDock';
import { QuestMeter, XpBar } from '@/components/ui/Meter';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { systemLine } from '@/data/systemLines';
import { groupQuests } from '@/engine/quests';
import { currentStreak } from '@/engine/streak';
import { useDay, useDays, useMeta, usePlayer, useProfile, useXpSummary } from '@/db/hooks';
import { repo } from '@/db/repos';
import { isDeloadWeek, programWeek, weekday } from '@/lib/dates';
import { cn } from '@/lib/cn';

const WEEKDAY = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** Reveal the Daily Quest window once per day, on the first open. */
function useAnnounce(today: string) {
  const seen = useMeta<string>('announced');
  const reveal = seen !== undefined && seen !== today;
  useEffect(() => {
    if (!reveal) return;
    // Mark it seen once the scan has played, so the reveal never cuts off mid-sweep.
    const t = window.setTimeout(() => void repo.meta.set('announced', today), 1200);
    return () => window.clearTimeout(t);
  }, [reveal, today]);
  return reveal;
}

export function TodayScreen() {
  const today = useToday();
  const navigate = useNavigate();
  const profile = useProfile();
  const rec = useDay(today);
  const days = useDays();
  const summary = useXpSummary();
  const player = usePlayer();
  const reveal = useAnnounce(today);
  const statusSheet = useSheet('status');
  const bodySheet = useSheet('body');
  const [busy, setBusy] = useState(false);

  if (!profile || rec === undefined || !summary) return <TodaySkeleton />;

  const week = programWeek(profile.programStart, today);
  const deload = isDeloadWeek(week);
  const quests = rec?.quests ?? [];
  const groups = groupQuests(quests);
  const required = quests.filter((q) => !q.optional);
  const done = required.filter((q) => q.done).length;
  const gate = quests.find((q) => q.kind === 'gate');
  const streak = days ? currentStreak(today, days, profile.joinedAt) : 0;
  const line =
    rec?.aiMessage ??
    systemLine(today, {
      condition: rec?.condition,
      penalty: quests.some((q) => q.kind === 'penalty' && !q.done),
      deload,
    });

  return (
    <div className="flex flex-col gap-5 px-4 pt-[calc(16px+var(--safe-top))] pb-[calc(var(--cta-h)+40px)]">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="hud-13 text-ink-2">{WEEKDAY[weekday(today)]}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-22 font-semibold text-ink">
              {new Date(`${today}T12:00:00`).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
              })}
            </h1>
            <Badge>Week {week}</Badge>
            {deload && <Badge tone="warn">Deload</Badge>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="hud-11 text-ink-3">Reset in</p>
          <Countdown className="num text-17 text-ink" />
        </div>
      </header>

      <p className="text-15 text-ink-2">
        <span className="mr-2 hud-11 text-sys">System</span>
        {line}
      </p>

      {rec?.readiness && rec.condition ? (
        <ConditionChip
          condition={rec.condition}
          readiness={rec.readiness}
          onEdit={() => statusSheet.show()}
        />
      ) : (
        <section
          aria-labelledby="check-title"
          className="rounded-card border border-line bg-s1 px-4 pt-3 pb-4"
        >
          <div className="flex items-baseline justify-between pb-4">
            <h2 id="check-title" className="hud-13 text-ink">
              Morning status check
            </h2>
            <span className="text-13 text-ink-3">Sets today’s condition</span>
          </div>
          <StatusCheck
            busy={busy}
            onSubmit={async (r) => {
              setBusy(true);
              await submitReadiness(today, r);
              setBusy(false);
            }}
          />
        </section>
      )}

      <SystemWindow
        label="Daily quest"
        reveal={reveal}
        padded={false}
        aside={
          <span className="num text-13 text-ink-2">
            [
            <span
              className={cn(
                done === required.length && required.length > 0 ? 'text-ok' : 'text-ink',
              )}
            >
              {done}
            </span>
            /{required.length}]
          </span>
        }
      >
        <div className="px-4 pb-2">
          <QuestMeter done={done} total={required.length} />
        </div>
        {groups.map((g) => (
          <div key={g.area} role="group" aria-label={g.label} className="pt-2">
            <p
              className={cn(
                'px-4 pt-1 hud-11',
                g.area === 'penalty' ? 'text-bad' : g.area === 'bonus' ? 'text-sys' : 'text-ink-3',
              )}
            >
              {g.label}
            </p>
            {g.quests.map((q) => (
              <QuestRow
                key={q.id}
                title={q.title}
                detail={q.detail}
                xp={q.xp}
                stat={q.stat}
                done={q.done}
                optional={q.optional}
                tone={q.kind === 'penalty' ? 'bad' : 'sys'}
                onOpen={
                  q.kind === 'gate'
                    ? () => navigate('/train')
                    : q.kind === 'weigh' && !q.done
                      ? () => bodySheet.show()
                      : undefined
                }
                opens={
                  q.kind === 'gate' ? 'the Gate' : q.kind === 'weigh' ? 'the body log' : undefined
                }
                onToggle={(v) => void toggleQuest(today, q.id, v)}
              />
            ))}
          </div>
        ))}
      </SystemWindow>

      <section
        aria-label="Level and streak"
        className="grid grid-cols-[1fr_auto_auto] items-end gap-x-5 border-y border-line py-3"
      >
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="hud-11 text-ink-2">Lv</span>
            <span className="num text-22 font-medium text-ink">{summary.level}</span>
            <span className="ml-auto num text-13 text-ink-3">
              {summary.into}/{summary.next}
            </span>
          </div>
          <XpBar into={summary.into} next={summary.next} />
        </div>
        <div className="flex flex-col items-end">
          <span className="hud-11 text-ink-2">Streak</span>
          <span className="num text-22 font-medium text-ink">{streak}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="hud-11 text-ink-2">Best</span>
          <span className="num text-22 font-medium text-ink-2">
            {Math.max(player?.bestStreak ?? 0, streak)}
          </span>
        </div>
      </section>

      {profile.aiEnabled && <AskSystem date={today} />}

      {gate && !gate.done && (
        <CtaDock>
          <Button
            variant="primary"
            size="lg"
            block
            icon={<Play weight="fill" />}
            onClick={() => navigate('/train')}
          >
            Start Gate
          </Button>
        </CtaDock>
      )}

      <Sheet
        open={statusSheet.open}
        onOpenChange={statusSheet.onOpenChange}
        title="Morning status check"
        description="Changing it re-prescribes today’s Gate."
      >
        <StatusCheck
          initial={rec?.readiness}
          submitLabel="Update status"
          busy={busy}
          onSubmit={async (r) => {
            setBusy(true);
            await submitReadiness(today, r);
            setBusy(false);
            statusSheet.hide();
          }}
        />
      </Sheet>
      <BodyLogSheet
        open={bodySheet.open}
        onOpenChange={bodySheet.onOpenChange}
        onDone={bodySheet.hide}
      />
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-5 px-4 pt-[calc(16px+var(--safe-top))]">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
