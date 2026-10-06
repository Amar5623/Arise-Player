import { useToday } from '@/app/stores/clock';
import { LineChart } from '@/components/charts/LineChart';
import { StatMark } from '@/components/system/StatMark';
import { Sheet } from '@/components/ui/Sheet';
import { HABITS } from '@/data/habits';
import { STATS } from '@/data/stats';
import { statValue } from '@/engine/levels';
import type { Stat } from '@/engine/types';
import { useXpEvents } from '@/db/hooks';
import { addDays, dateRange, dayMonth } from '@/lib/dates';

const SOURCE_LABEL = {
  quest: 'Daily quests',
  gate: 'Gates',
  bonus: 'Bonuses',
  unlock: 'Skill unlocks',
  goal: 'Main quests',
} as const;

/** What feeds a stat, where its XP came from, and its value over the last 30 days. */
export function StatSheet({
  stat,
  open,
  onOpenChange,
}: {
  stat: Stat | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const today = useToday();
  const events = useXpEvents();
  const meta = STATS.find((s) => s.key === stat);
  if (!stat || !meta)
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="Stat">
        {null}
      </Sheet>
    );

  const mine = (events ?? []).filter((e) => e.stat === stat);
  const start = addDays(today, -29);
  const points: { label: string; value: number }[] = [];
  let running = mine.filter((e) => e.date < start).reduce((n, e) => n + e.amount, 0);
  for (const d of dateRange(start, today)) {
    running += mine.filter((e) => e.date === d).reduce((n, e) => n + e.amount, 0);
    points.push({ label: dayMonth(d), value: statValue(running) });
  }
  const bySource = new Map<string, number>();
  for (const e of mine) bySource.set(e.source, (bySource.get(e.source) ?? 0) + e.amount);
  const habits = HABITS.filter((h) => h.stat === stat).map((h) => h.label);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={meta.name} description={meta.feeds}>
      <div className="flex flex-col gap-5">
        <div className="flex items-end justify-between">
          <StatMark stat={stat} />
          <span className="num text-40 text-ink">
            {statValue(mine.reduce((n, e) => n + e.amount, 0))}
          </span>
        </div>
        <div>
          <p className="pb-2 hud-11 text-ink-2">Last 30 days</p>
          <LineChart
            points={points}
            unit={stat}
            title={`${meta.name}, last 30 days`}
            height={140}
          />
        </div>
        <div>
          <p className="pb-2 hud-11 text-ink-2">Where the XP came from</p>
          <ul className="divide-y divide-line">
            {[...bySource].map(([src, n]) => (
              <li key={src} className="flex justify-between py-2 text-15">
                <span className="text-ink-2">
                  {SOURCE_LABEL[src as keyof typeof SOURCE_LABEL] ?? src}
                </span>
                <span className="num text-ink">{n} XP</span>
              </li>
            ))}
            {bySource.size === 0 && <li className="py-2 text-15 text-ink-3">No XP yet.</li>}
          </ul>
        </div>
        {habits.length > 0 && (
          <p className="text-13 text-ink-2">
            Daily quests that feed it: <span className="text-ink">{habits.join(', ')}</span>.
          </p>
        )}
      </div>
    </Sheet>
  );
}
