/** What the System is told (brief §8): no keys, no free-text personal notes. */
import { LADDERS } from '@/data/ladders';
import { adherence7, missedTitles } from '@/engine/adherence';
import { daysLeft } from '@/engine/goals';
import { statValues, summarizeXp } from '@/engine/levels';
import { STAT_KEYS, type ISODate } from '@/engine/types';
import { repo } from '@/db/repos';
import { isDeloadWeek, programWeek } from '@/lib/dates';
import { prescriptionFor } from './day';

export async function aiContext(today: ISODate) {
  const [profile, days, ladders, goals, sessions, events] = await Promise.all([
    repo.profile.get(),
    repo.days.map(),
    repo.ladders.all(),
    repo.goals.all(),
    repo.sessions.all(),
    repo.xp.all(),
  ]);
  if (!profile) return null;
  const rec = days.get(today);
  const week = programWeek(profile.programStart, today);
  const p = await prescriptionFor(today, rec?.condition ?? 'OPTIMAL', rec?.quick ?? false);
  const stats = statValues(summarizeXp(events).statXp);
  const adh = adherence7(today, days, profile.joinedAt);
  return {
    profile: {
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      wake: profile.wake,
      currency: profile.currency,
    },
    week,
    deload: isDeloadWeek(week),
    condition: rec?.condition ?? 'UNKNOWN',
    stats: Object.fromEntries(STAT_KEYS.map((s) => [s, stats[s]])),
    gate:
      p && !p.rest
        ? {
            name: p.name,
            mode: p.mode,
            items: p.items.map(
              (it) => `${it.name} ${it.sets}x${it.target}${it.unit === 'sec' ? 's' : ''}`,
            ),
          }
        : 'rest day',
    ladders: Object.fromEntries(
      Object.values(ladders).map((l) => [
        l.key,
        LADDERS[l.key].steps[l.step - 1]?.name ?? `step ${l.step}`,
      ]),
    ),
    todayQuests: (rec?.quests ?? []).map((q) => ({ title: q.title, stat: q.stat, done: q.done })),
    last7Completion: adh === null ? null : Math.round(adh * 100),
    missedLast7: missedTitles(today, days).slice(0, 8),
    openGoals: goals
      .filter((g) => !g.done)
      .map((g) => ({
        title: g.title,
        stat: g.stat,
        current: g.current,
        target: g.target,
        unit: g.unit,
        daysLeft: daysLeft(g, today),
      })),
    recentSessions: sessions.slice(-4).map((s) => ({
      date: s.date,
      name: s.name,
      mode: s.mode,
      best: s.entries.map(
        (e) => `${e.name} ${Math.max(0, ...e.sets.filter((v): v is number => v !== null))}`,
      ),
    })),
  };
}

export async function aiPasscode(): Promise<string> {
  return (await repo.meta.get<string>('aiPasscode')) ?? '';
}
