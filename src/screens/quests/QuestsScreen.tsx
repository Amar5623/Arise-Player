import { CheckCircle, Plus, Target } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router';
import { useToday } from '@/app/stores/clock';
import { useSheet } from '@/app/useSheet';
import { GoalSheet } from '@/components/app/GoalSheet';
import { StatMark } from '@/components/system/StatMark';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { XpBar } from '@/components/ui/Meter';
import { SectionHead } from '@/components/ui/SectionHead';
import { Skeleton } from '@/components/ui/Skeleton';
import { daysLeft, goalProgress } from '@/engine/goals';
import type { Goal } from '@/engine/types';
import { useGoals, useProfile } from '@/db/hooks';
import { dayMonth } from '@/lib/dates';
import { goalValue } from '@/lib/goalFormat';
import { cn } from '@/lib/cn';

function GoalCard({ g, today }: { g: Goal; today: string }) {
  const left = daysLeft(g, today);
  const pct = Math.round(goalProgress(g) * 100);
  return (
    <Link
      to={`/quests/${g.id}`}
      className="flex tap flex-col gap-3 rounded-card border border-line bg-s1 p-4 transition-colors duration-(--dur-1) hover:bg-s2 active:bg-s3"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-17 font-medium text-ink">{g.title}</span>
        <StatMark stat={g.stat} className="pt-1.5" />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="num text-22 text-ink">{goalValue(g, g.current)}</span>
        <span className="num text-13 text-ink-2">of {goalValue(g, g.target)}</span>
      </div>
      <XpBar into={pct} next={100} label={`${g.title} progress`} />
      <div className="flex justify-between text-13 text-ink-2">
        <span>
          <span className="num text-ink">{pct}</span>%
        </span>
        <span className={cn(left !== null && left < 0 && 'text-warn')}>
          {left === null ? 'No deadline' : left < 0 ? `${-left} days over` : `${left} days left`}
        </span>
      </div>
    </Link>
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
  const cleared = goals
    .filter((g) => g.done)
    .sort((a, b) => ((a.doneAt ?? '') < (b.doneAt ?? '') ? 1 : -1));

  return (
    <div className="flex flex-col gap-4 px-4 pt-[calc(16px+var(--safe-top))] pb-10">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="hud-13 text-ink-2">Long-term goals</p>
          <h1 className="hud-28 text-ink">Main quests</h1>
        </div>
        {open.length > 0 && (
          <Button icon={<Plus />} onClick={() => sheet.show()}>
            New
          </Button>
        )}
      </header>

      {open.length === 0 ? (
        <EmptyState
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
        <div className="flex flex-col gap-3">
          {open.map((g) => (
            <GoalCard key={g.id} g={g} today={today} />
          ))}
        </div>
      )}

      {cleared.length > 0 && (
        <section aria-labelledby="cleared">
          <SectionHead id="cleared">Cleared</SectionHead>
          <ul className="divide-y divide-line">
            {cleared.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/quests/${g.id}`}
                  className="flex min-h-14 tap items-center gap-3 hover:bg-s1"
                >
                  <CheckCircle weight="fill" className="size-5 shrink-0 text-ok" aria-hidden />
                  <span className="min-w-0 flex-1 text-15 text-ink">{g.title}</span>
                  <span className="text-13 text-ink-2">{g.doneAt ? dayMonth(g.doneAt) : ''}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sheet.open && (
        <GoalSheet
          open
          onOpenChange={sheet.onOpenChange}
          currency={profile.currency}
          onDone={(g) => navigate(`/quests/${g.id}`, { replace: true })}
        />
      )}
    </div>
  );
}
