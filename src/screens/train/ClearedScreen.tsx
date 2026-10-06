import {
  ArrowDown,
  ArrowUp,
  FirstAidKit,
  LockOpen,
  Medal,
  Minus,
  Warning,
  type Icon,
} from '@phosphor-icons/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Navigate, useNavigate, useParams } from 'react-router';
import { StatMark } from '@/components/system/StatMark';
import { SystemWindow } from '@/components/system/SystemWindow';
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/CountUp';
import { SectionHead } from '@/components/ui/SectionHead';
import { statValue } from '@/engine/levels';
import { STAT_KEYS, type LogKind, type Stat } from '@/engine/types';
import { db } from '@/db/db';
import { useSession, useXpSummary } from '@/db/hooks';
import { shortLabel } from '@/lib/dates';
import { cn } from '@/lib/cn';

const LOG_LOOK: Record<LogKind, { icon: Icon; tone: string; label: string }> = {
  up: { icon: ArrowUp, tone: 'text-sys', label: 'Target up' },
  unlock: { icon: LockOpen, tone: 'text-rare', label: 'Skill unlocked' },
  mastered: { icon: Medal, tone: 'text-ok', label: 'Mastered' },
  hold: { icon: Minus, tone: 'text-ink-3', label: 'Held' },
  miss: { icon: Warning, tone: 'text-warn', label: 'Missed' },
  eased: { icon: ArrowDown, tone: 'text-warn', label: 'Eased' },
  pain: { icon: FirstAidKit, tone: 'text-bad', label: 'Pain' },
  skip: { icon: Minus, tone: 'text-ink-3', label: 'Skipped' },
};

export function ClearedScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = useSession(sessionId);
  const summary = useXpSummary();
  const events = useLiveQuery(
    () =>
      sessionId
        ? db.xp.filter((e) => e.ref === sessionId || e.ref.startsWith(`${sessionId}:`)).toArray()
        : [],
    [sessionId],
  );

  if (session === null) return <Navigate to="/train" replace />;
  if (!session || !events || !summary) return <div className="min-h-dvh" aria-busy />;

  const byStat = new Map<Stat, number>();
  for (const e of events) if (e.stat) byStat.set(e.stat, (byStat.get(e.stat) ?? 0) + e.amount);
  const sets = session.entries.reduce((n, e) => n + e.sets.filter((v) => v !== null).length, 0);

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-4 pt-[calc(20px+var(--safe-top))] pb-[calc(96px+var(--safe-bottom))]">
      <h1 className="sr-only">Gate cleared: {session.name}</h1>
      <SystemWindow tone="ok" label="Gate cleared" reveal>
        <p className="hud-22 text-ink">{session.name}</p>
        <p className="text-13 text-ink-2">
          {shortLabel(session.date)}. {sets} sets logged
          {session.mode === 'recover'
            ? ', recovery mode'
            : session.mode === 'injured'
              ? ', mobility only'
              : ''}
          {session.deload ? ', deload week' : ''}.
        </p>
      </SystemWindow>

      <section
        aria-label="Experience gained"
        className="flex items-end justify-between gap-4 border-b border-line pb-5"
      >
        <div className="flex flex-col">
          <span className="hud-13 text-ink-2">XP gained</span>
          <span className="num text-64 font-medium tracking-tight text-ink">
            +<CountUp value={session.xp} duration={0.7} />
          </span>
        </div>
        <div className="flex flex-col items-end pb-2">
          <span className="hud-11 text-ink-2">Level</span>
          <span className="num text-28 text-ink">{summary.level}</span>
          <span className="num text-13 text-ink-3">
            {summary.into}/{summary.next}
          </span>
        </div>
      </section>

      <section aria-labelledby="gains">
        <SectionHead id="gains" className="pt-0">
          Stat gains
        </SectionHead>
        <ul className="flex flex-col divide-y divide-line">
          {STAT_KEYS.filter((s) => byStat.has(s)).map((s) => (
            <li key={s} className="flex items-center gap-3 py-2.5">
              <StatMark stat={s} className="w-14" />
              <span className="num text-17 text-ink">+{byStat.get(s)}</span>
              <span className="text-13 text-ink-3">XP</span>
              <span className="ml-auto text-13 text-ink-2">
                {s} now <span className="num text-15 text-ink">{statValue(summary.statXp[s])}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="log">
        <SectionHead id="log" className="pt-0">
          System log
        </SectionHead>
        {session.log.length === 0 ? (
          <p className="text-15 text-ink-2">Nothing in this Gate changes your targets.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line">
            {session.log.map((l, i) => {
              const look = LOG_LOOK[l.kind];
              const Glyph = look.icon;
              return (
                <li key={`${l.exerciseId}-${i}`} className="flex gap-3 py-3">
                  <Glyph aria-hidden className={cn('mt-0.5 size-5 shrink-0', look.tone)} />
                  <div className="flex min-w-0 flex-col">
                    <p className="text-15 text-ink">
                      {l.name} <span className={cn('ml-1 hud-11', look.tone)}>{look.label}</span>
                    </p>
                    <p className="text-13 text-ink-2">{l.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-(--frame-w) bg-[linear-gradient(to_bottom,transparent,var(--color-base)_24px)] px-4 pt-6 pb-[calc(12px+var(--safe-bottom))]">
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => navigate('/today', { replace: true })}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
