import { CheckCircle, Plus, Target } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router';
import { useToday } from '@/app/stores/clock';
import { useSheet } from '@/app/useSheet';
import { GoalSheet } from '@/components/app/GoalSheet';
import { StatMark } from '@/components/system/StatMark';
import { Button } from '@/components/ui/Button';
import { CtaDock } from '@/components/ui/CtaDock';
import { EmptyState } from '@/components/ui/EmptyState';
import { XpBar } from '@/components/ui/Meter';
import { SectionHead } from '@/components/ui/SectionHead';
import { Skeleton } from '@/components/ui/Skeleton';
import { daysLeft, goalProgress } from '@/engine/goals';
import type { Goal } from '@/engine/types';
import { useGoals, useProfile } from '@/db/hooks';
import { dayMonth } from '@/lib/dates';
import { goalParts } from '@/lib/goalFormat';
import { cn } from '@/lib/cn';

function Amount({ g, v, big = false }: { g: Goal; v: number; big?: boolean }) {
  const p = goalParts(g, v);
  return (
    <span className="whitespace-nowrap">
      <span className={cn('num', big ? 'text-40 text-ink' : 'text-15 text-ink')}>{p.value}</span>
      {p.unit && <span className={cn('ml-1 text-ink-2', big ? 'text-17' : 'text-13')}>{p.unit}</span>}
    </span>
  );
}

const leftText = (left: number | null) => (left === null ? 'No deadline' : left < 0 ? `${-left} days over` : `${left} days left`);

/** The goal that needs attention first: nearest deadline, else closest to done. */
function focusGoal(open: Goal[], today: string): Goal | undefined {
  const dated = open.filter((g) => g.deadline).sort((a, b) => (daysLeft(a, today) ?? 0) - (daysLeft(b, today) ?? 0));
  return dated[0] ?? [...open].sort((a, b) => goalProgress(b) - goalProgress(a))[0];
}

function Hero({ g, today }: { g: Goal; today: string }) {
  const left = daysLeft(g, today);
  const pct = Math.round(goalProgress(g) * 100);
  return (
    <Link to={`/quests/${g.id}`} className="tap -mx-4 flex flex-col gap-3 px-4 py-4 transition-colors duration-(--dur-1) hover:bg-s1 active:bg-s2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-17 font-medium text-ink">{g.title}</span>
        <StatMark stat={g.stat} />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <Amount g={g} v={g.current} big />
        <span className="text-13 text-ink-2">
          of <Amount g={g} v={g.target} />
        </span>
      </div>
      <XpBar into={pct} next={100} label={`${g.title} progress`} />
      <div className="flex justify-between text-13 text-ink-2">
        <span>
          <span className="num text-ink">{pct}</span>%
        </span>
        <span className={cn(left !== null && left < 0 && 'text-warn')}>{leftText(left)}</span>
      </div>
    </Link>
  );
}

function Row({ g, today }: { g: Goal; today: string }) {
  const left = daysLeft(g, today);
  const pct = goalProgress(g);
  return (
    <li>
      <Link to={`/quests/${g.id}`} className="tap flex min-h-16 flex-col justify-center gap-2 px-4 py-3 transition-colors duration-(--dur-1) hover:bg-s2 active:bg-s3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <StatMark stat={g.stat} label={false} />
            <span className="truncate text-15 text-ink">{g.title}</span>
          </span>
          <span className={cn('shrink-0 text-13 text-ink-2', left !== null && left < 0 && 'text-warn')}>{leftText(left)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-0.5 min-w-12 flex-1 overflow-hidden bg-s3">
            <span className="block h-full origin-left bg-sys" style={{ transform: `scaleX(${pct})` }} />
          </span>
          <span className="shrink-0 text-13 text-ink-2">
            <Amount g={g} v={g.current} /> / <Amount g={g} v={g.target} />
          </span>
        </div>
      </Link>
    </li>
  );
}

export function QuestsScreen() {
  const today = useToday();
  const navigate = useNavigate();
  const goals = useGoals();
  const profile = useProfile();
  const sheet = useSheet('new-goal');
  if (!goals || !profile) {
    return (
      <div aria-busy className="flex flex-col gap-4 px-4 pt-[calc(16px+var(--safe-top))]">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }
  const open = goals.filter((g) => !g.done);
  const cleared = goals.filter((g) => g.done).sort((a, b) => ((a.doneAt ?? '') < (b.doneAt ?? '') ? 1 : -1));
  const hero = focusGoal(open, today);
  const rest = open.filter((g) => g !== hero);

  return (
    <div className="flex flex-col gap-2 px-4 pt-[calc(16px+var(--safe-top))] pb-[calc(var(--cta-h)+40px)]">
      <h1 className="hud-28 text-ink">Main quests</h1>

      {!hero ? (
        <EmptyState
          className="mt-3"
          icon={<Target weight="thin" />}
          title="No main quests yet"
          body="Long-term goals live here: an emergency fund, your first strict pull-up, a waist target. Clearing one pays 200 XP."
          action={
            <Button variant="primary" icon={<Plus />} onClick={() => sheet.show()}>
              New main quest
            </Button>
          }
        />
      ) : (
        <>
          <Hero g={hero} today={today} />
          {rest.length > 0 && (
            <section aria-labelledby="open">
              <SectionHead id="open" className="pt-2">
                Also open
              </SectionHead>
              <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-s1">
                {rest.map((g) => (
                  <Row key={g.id} g={g} today={today} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {cleared.length > 0 && (
        <section aria-labelledby="cleared">
          <SectionHead id="cleared">Cleared</SectionHead>
          <ul className="divide-y divide-line">
            {cleared.map((g) => (
              <li key={g.id}>
                <Link to={`/quests/${g.id}`} className="tap flex min-h-14 items-center gap-3 hover:bg-s1">
                  <CheckCircle weight="fill" className="size-5 shrink-0 text-ok" aria-hidden />
                  <span className="min-w-0 flex-1 text-15 text-ink">{g.title}</span>
                  <span className="text-13 text-ink-2">{g.doneAt ? dayMonth(g.doneAt) : ''}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hero && (
        <CtaDock>
          <Button size="lg" block icon={<Plus />} onClick={() => sheet.show()}>
            New main quest
          </Button>
        </CtaDock>
      )}

      {sheet.open && (
        <GoalSheet open onOpenChange={sheet.onOpenChange} currency={profile.currency} onDone={(g) => navigate(`/quests/${g.id}`, { replace: true })} />
      )}
    </div>
  );
}
