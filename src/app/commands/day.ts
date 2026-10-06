/** Opening the day, the morning check, quest checks and AI bonus quests. */
import { toast } from '@/app/stores/toasts';
import { habitDef, tierValue, type HabitContext } from '@/data/habits';
import { closeOut } from '@/engine/closeout';
import { conditionOf } from '@/engine/readiness';
import { prescribe, type Prescription } from '@/engine/prescription';
import { buildDayQuests, dayRatio, refreshHabitQuests, sortQuests } from '@/engine/quests';
import { currentStreak } from '@/engine/streak';
import { evaluateTiers } from '@/engine/tiers';
import { XP, estimateGateXp } from '@/engine/xp';
import type {
  Condition,
  DayRecord,
  ISODate,
  Profile,
  Quest,
  Readiness,
  Stat,
} from '@/engine/types';
import { db } from '@/db/db';
import { ALL_TABLES, repo } from '@/db/repos';
import { addDays } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { celebrate, toEvents } from './xp';

export const ctxOf = (p: Profile): HabitContext => ({
  weightKg: p.weightKg,
  wake: p.wake,
  currency: p.currency,
  saveWeekly: p.saveWeekly,
});

/** Today's Gate from stored progress. */
export async function prescriptionFor(
  date: ISODate,
  condition: Condition = 'OPTIMAL',
  quick = false,
): Promise<Prescription | null> {
  const profile = await repo.profile.get();
  if (!profile) return null;
  const [ladders, exercises] = await Promise.all([repo.ladders.all(), repo.exercises.all()]);
  return prescribe({
    date,
    programStart: profile.programStart,
    condition,
    quick,
    ladders,
    exercises,
  });
}

export function gateQuestOf(p: Prescription): { title: string; detail: string; xp: number } | null {
  if (p.rest) return null;
  const sets = p.items.reduce((n, it) => n + it.sets, 0);
  return {
    title: p.name,
    detail: `Gate, ${p.items.length} exercises, about ${p.estMinutes} min`,
    xp: estimateGateXp(sets),
  };
}

function withGate(quests: Quest[], gate: ReturnType<typeof gateQuestOf>): Quest[] {
  return quests.map((q) => (q.kind === 'gate' && gate && !q.done ? { ...q, ...gate } : q));
}

let opening: Promise<void> | null = null;

/**
 * Runs on app open and at midnight: closes past days, evaluates habit tiers once a day, and
 * creates today's quest list (with a penalty when yesterday closed under 50%).
 */
export function openDay(today: ISODate): Promise<void> {
  opening ??= runOpenDay(today).finally(() => {
    opening = null;
  });
  return opening;
}

async function runOpenDay(today: ISODate): Promise<void> {
  const profile = await repo.profile.get();
  if (!profile) return;
  const before = await repo.xp.summary();
  const notices: (() => void)[] = [];

  await db.transaction('rw', ALL_TABLES, async () => {
    const days = await repo.days.map();
    const lastClosed = (await repo.meta.get<ISODate>('lastClosed')) ?? null;
    const co = closeOut(today, profile.joinedAt, days, lastClosed);
    if (co.closed.length) {
      await repo.days.putAll(co.closed);
      for (const c of co.closed) days.set(c.date, c);
      await repo.meta.set('lastClosed', addDays(today, -1));
    }

    if ((await repo.meta.get<ISODate>('lastTierEval')) !== today) {
      const { habits, changes } = evaluateTiers(
        today,
        await repo.habits.all(),
        days,
        profile.joinedAt,
      );
      if (changes.length) await repo.habits.putAll(habits);
      await repo.meta.set('lastTierEval', today);
      for (const ch of changes) {
        const def = habitDef(ch.id);
        if (!def) continue;
        const title = def.title(tierValue(def, ch.to), ctxOf(profile));
        notices.push(() =>
          ch.to > ch.from
            ? toast({
                tone: 'sys',
                label: 'Quest difficulty up',
                message: title,
                detail: `${Math.round(ch.rate * 100)}% last week. Tier ${ch.to}.`,
              })
            : toast({
                tone: 'warn',
                label: 'Quest eased',
                message: title,
                detail: `${Math.round(ch.rate * 100)}% last week. Back to tier ${ch.to}.`,
              }),
        );
      }
    }

    if (!days.has(today)) {
      const p = await prescriptionFor(today);
      const quests = buildDayQuests({
        date: today,
        programStart: profile.programStart,
        weighEvery: profile.weighEvery,
        habits: await repo.habits.all(),
        ctx: ctxOf(profile),
        gate: p ? gateQuestOf(p) : null,
        penalty: co.penalty,
      });
      await repo.days.put({ date: today, quests, bonusAwarded: false, closed: false });
      const pct = co.yesterdayRatio === null ? null : Math.round(co.yesterdayRatio * 100);
      if (co.penalty) {
        notices.push(() => {
          haptic('warn');
          play('warn');
          toast({
            tone: 'bad',
            label: 'Penalty issued',
            message: `Yesterday closed at ${pct}%.`,
            detail: 'Penalty quest added: 20-min brisk walk.',
          });
        });
      } else if (co.streakContinues) {
        const streak = currentStreak(today, days, profile.joinedAt);
        notices.push(() =>
          toast({
            tone: 'ok',
            label: 'Streak continues',
            message: `${streak} ${streak === 1 ? 'day' : 'days'} at 80% or more.`,
          }),
        );
      }
    }
  });

  await celebrate(before, today, true);
  notices.forEach((n) => n());
}

/** Morning status check: stores readiness and condition, and re-prescribes the Gate. */
export async function submitReadiness(date: ISODate, r: Readiness): Promise<Condition> {
  const condition = conditionOf(r);
  const rec = await repo.days.get(date);
  if (!rec) return condition;
  const p = await prescriptionFor(date, condition, rec.quick ?? false);
  await repo.days.put({
    ...rec,
    readiness: r,
    condition,
    quests: withGate(rec.quests, p ? gateQuestOf(p) : null),
  });
  if (condition === 'INJURED') {
    toast({
      tone: 'bad',
      label: 'Condition: injured',
      message: 'Warm-up and mobility only today.',
      detail: 'The Gate still clears. If pain persists, see a physio.',
    });
  } else if (condition === 'FATIGUED') {
    toast({
      tone: 'warn',
      label: 'Recovery mode',
      message: 'One fewer set on every exercise.',
      detail: 'Keep every set at RPE 7 or below.',
    });
  }
  return condition;
}

export async function setQuick(date: ISODate, quick: boolean): Promise<void> {
  const rec = await repo.days.get(date);
  if (!rec) return;
  const p = await prescriptionFor(date, rec.condition ?? 'OPTIMAL', quick);
  await repo.days.put({ ...rec, quick, quests: withGate(rec.quests, p ? gateQuestOf(p) : null) });
}

const questRef = (date: ISODate, id: string) => `quest:${date}:${id}`;

/** Checks or unchecks a quest. XP follows exactly; the 100% bonus is paid once a day. */
export async function toggleQuest(date: ISODate, id: string, done: boolean): Promise<void> {
  const before = await repo.xp.summary();
  let completed = false;
  await db.transaction('rw', ALL_TABLES, async () => {
    const rec = await repo.days.get(date);
    const q = rec?.quests.find((x) => x.id === id);
    if (!rec || !q || q.kind === 'gate' || q.done === done) return;
    const quests = rec.quests.map((x) =>
      x.id === id ? { ...x, done, doneAt: done ? new Date().toISOString() : undefined } : x,
    );
    const ref = questRef(date, id);
    if (done)
      await repo.xp.add(toEvents(date, [{ stat: q.stat, amount: q.xp, source: 'quest', ref }]));
    else await repo.xp.deleteByRef(ref);
    let bonusAwarded = rec.bonusAwarded;
    if (!bonusAwarded && quests.every((x) => x.optional || x.done)) {
      await repo.xp.add(
        toEvents(date, [
          { stat: null, amount: XP.dailyBonus, source: 'bonus', ref: `bonus:${date}` },
        ]),
      );
      bonusAwarded = true;
      completed = true;
    }
    await repo.days.put({ ...rec, quests, bonusAwarded });
  });
  if (done) {
    haptic('tick');
    play('tick');
  }
  if (completed) {
    haptic('clear');
    play('clear');
    toast({
      tone: 'ok',
      label: 'Daily quest complete',
      message: 'Every quest cleared.',
      detail: `+${XP.dailyBonus} XP bonus.`,
    });
  }
  await celebrate(before, date);
}

/** Re-derives today's habit quests after library or profile changes, keeping what's done. */
export async function refreshToday(date: ISODate): Promise<void> {
  const profile = await repo.profile.get();
  const rec = await repo.days.get(date);
  if (!profile || !rec) return;
  const p = await prescriptionFor(date, rec.condition ?? 'OPTIMAL', rec.quick ?? false);
  const fresh = buildDayQuests({
    date,
    programStart: profile.programStart,
    weighEvery: profile.weighEvery,
    habits: await repo.habits.all(),
    ctx: ctxOf(profile),
    gate: p ? gateQuestOf(p) : null,
    penalty: rec.quests.some((q) => q.kind === 'penalty'),
  });
  const merged = refreshHabitQuests(rec.quests, fresh);
  // Removing a done habit must take its XP back.
  for (const q of rec.quests) {
    if (q.kind === 'habit' && q.done && !merged.some((m) => m.id === q.id))
      await repo.xp.deleteByRef(questRef(date, q.id));
  }
  await repo.days.put({ ...rec, quests: withGate(merged, p ? gateQuestOf(p) : null) });
}

export interface AiQuestInput {
  title: string;
  detail: string;
  stat: Stat;
  xp: number;
}

/** Adds AI bonus quests, replacing any undone ones. Done AI quests stay. */
export async function setAiQuests(
  date: ISODate,
  message: string,
  items: readonly AiQuestInput[],
): Promise<void> {
  const rec = await repo.days.get(date);
  if (!rec) return;
  const kept = rec.quests.filter((q) => q.kind !== 'ai' || q.done);
  const fresh: Quest[] = items.map((it, i) => ({
    id: `ai:${Date.now().toString(36)}-${i}`,
    area: 'bonus',
    stat: it.stat,
    xp: it.xp,
    title: it.title,
    detail: it.detail,
    done: false,
    optional: true,
    kind: 'ai',
  }));
  await repo.days.put({ ...rec, aiMessage: message, quests: sortQuests([...kept, ...fresh]) });
}

export { dayRatio };
export type { DayRecord };
