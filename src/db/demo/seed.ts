/**
 * `?demo=1`: three weeks of realistic, clearly-labelled sample history in a separate database
 * (player-system-demo). Built by running the real engine day by day, so every number on every
 * screen is one the app itself could produce. Deterministic: the same seed gives the same story.
 */
import { HABITS } from '@/data/habits';
import { anyExercise, LADDER_KEYS } from '@/data/ladders';
import { WARMUP } from '@/data/plan';
import { gateQuestOf, ctxOf } from '@/app/commands/day';
import { syncPlayer, toEvents, uid } from '@/app/commands/xp';
import { closeOut } from '@/engine/closeout';
import { emptyStats } from '@/engine/levels';
import { prescribe } from '@/engine/prescription';
import { applyProgression } from '@/engine/progression';
import { conditionOf } from '@/engine/readiness';
import { buildDayQuests, dayRatio } from '@/engine/quests';
import { evaluateTiers } from '@/engine/tiers';
import { gateXp, totalXp, XP } from '@/engine/xp';
import type {
  BodyEntry,
  DayRecord,
  Goal,
  HabitConfig,
  ISODate,
  LadderKey,
  LadderProgress,
  Profile,
  Readiness,
  Session,
  XpEvent,
} from '@/engine/types';
import { addDays, dateRange, startOfWeek, weekday } from '@/lib/dates';
import { db, SCHEMA_VERSION } from '../db';
import { ALL_TABLES, repo } from '../repos';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAYS = 21;

export async function seedDemo(today: ISODate): Promise<void> {
  if (await repo.profile.get()) return;
  const r = rng(20261005);
  const joined = addDays(today, -DAYS);
  const profile: Profile = {
    name: 'Demo player',
    weightKg: 78.4,
    heightCm: 176,
    wake: '06:30',
    programStart: startOfWeek(joined),
    currency: '₹',
    saveWeekly: 2500,
    sound: false,
    haptics: true,
    aiEnabled: false,
    joinedAt: joined,
    weighEvery: 4,
  };

  let ladders: Record<LadderKey, LadderProgress> = {
    push: { key: 'push', step: 2, target: 8, fails: 0 },
    squat: { key: 'squat', step: 2, target: 11, fails: 0 },
    pull: { key: 'pull', step: 1, target: 25, fails: 0 },
  };
  let exercises: Record<string, { exerciseId: string; target: number; fails: number }> = {};
  let habits: HabitConfig[] = HABITS.map((h) => ({
    id: h.id,
    enabled: h.defaultOn,
    tier: 1,
    since: joined,
  }));
  const records = new Map<ISODate, DayRecord>();
  const sessions: Session[] = [];
  const xp: XpEvent[] = [];
  const body: BodyEntry[] = [];

  // A believable arc: a strong first week, a wobble in week two (one missed day), a recovery.
  const dayPlan = dateRange(joined, addDays(today, -1));
  const skipDay = addDays(joined, 9);
  const weakDay = addDays(joined, 10);

  for (const [i, date] of dayPlan.entries()) {
    if (date === skipDay) continue; // the app was never opened: a missed day

    const co = closeOut(date, joined, records, i === 0 ? null : addDays(date, -1));
    for (const c of co.closed) records.set(c.date, c);
    const tiers = evaluateTiers(date, habits, records, joined);
    habits = tiers.habits;

    const readiness: Readiness = {
      sleep: Math.round((6 + r() * 2.2) * 2) / 2,
      energy: 2 + Math.floor(r() * 4),
      soreness: 1 + Math.floor(r() * 3),
      pain: false,
    };
    const condition = conditionOf(readiness);
    const p = prescribe({
      date,
      programStart: profile.programStart,
      condition,
      quick: false,
      ladders,
      exercises,
    });
    const quests = buildDayQuests({
      date,
      programStart: profile.programStart,
      weighEvery: profile.weighEvery,
      habits,
      ctx: ctxOf(profile),
      gate: gateQuestOf(p),
      penalty: co.penalty,
    });

    const weak = date === weakDay;
    const pDone = weak ? 0.3 : i < 7 ? 0.9 : 0.82;
    let bonus = false;
    const done = quests.map((q) => {
      if (q.kind === 'gate') return q;
      const hit = r() < (q.kind === 'penalty' ? 0.95 : pDone);
      if (hit)
        xp.push(
          ...toEvents(date, [
            { stat: q.stat, amount: q.xp, source: 'quest', ref: `quest:${date}:${q.id}` },
          ]),
        );
      return { ...q, done: hit };
    });

    // Train on most gate days; skip the weak day.
    const gate = done.find((q) => q.kind === 'gate');
    if (gate && !weak && r() < 0.92) {
      const logged = p.items.map((item) => {
        const sets = Array.from({ length: item.sets }, () => {
          const roll = r();
          const delta =
            roll < 0.55
              ? 0
              : roll < 0.8
                ? item.unit === 'sec'
                  ? 5
                  : 1
                : item.unit === 'sec'
                  ? -5
                  : -1;
          return Math.max(1, item.target + delta);
        });
        return { item, sets, rpe: 7 + Math.floor(r() * 3), pain: false };
      });
      const prog = applyProgression(p.mode, logged, ladders, exercises);
      ladders = prog.ladders;
      exercises = { ...exercises, ...prog.exercises };
      const session: Session = {
        id: uid(),
        date,
        planDay: p.planDay,
        name: p.name,
        mode: p.mode,
        quick: false,
        deload: p.deload,
        warmupDone: true,
        warmup: WARMUP.map(() => true),
        entries: logged.map(({ item, sets, rpe, pain }) => ({
          key: item.key,
          exerciseId: item.exerciseId,
          name: item.name,
          unit: item.unit,
          side: item.perSide,
          target: item.target,
          sets,
          rpe,
          pain,
        })),
        xp: 0,
        log: prog.log,
      };
      const drafts = gateXp(session, (id) => anyExercise(id).stat, prog.unlocks);
      session.xp = totalXp(drafts);
      sessions.push(session);
      xp.push(...toEvents(date, drafts));
      const gi = done.findIndex((q) => q.kind === 'gate');
      done[gi] = { ...gate, done: true, xp: session.xp };
    }

    if (done.every((q) => q.optional || q.done)) {
      bonus = true;
      xp.push(
        ...toEvents(date, [
          { stat: null, amount: XP.dailyBonus, source: 'bonus', ref: `bonus:${date}` },
        ]),
      );
    }
    if (weekday(date) === 0 || i === 0) {
      const w = i / DAYS;
      body.push({
        date,
        weightKg: Math.round((78.4 - w * 1.3 + (r() - 0.5) * 0.3) * 10) / 10,
        waistCm: Math.round((86 - w * 1.5) * 10) / 10,
        hipsCm: 98,
      });
    }
    records.set(date, {
      date,
      quests: done,
      readiness,
      condition,
      bonusAwarded: bonus,
      closed: false,
    });
  }

  // Close everything up to yesterday, as openDay would.
  const final = closeOut(today, joined, records, null);
  for (const c of final.closed) records.set(c.date, c);
  for (const [, rec] of records)
    if (!rec.closed) records.set(rec.date, { ...rec, closed: true, ratio: dayRatio(rec.quests) });

  const fundStart = addDays(joined, 1);
  const goals: Goal[] = [
    {
      id: uid(),
      title: 'Emergency fund',
      stat: 'WLT',
      unit: '₹',
      start: 0,
      target: 300000,
      current: 42500,
      deadline: addDays(today, 330),
      updates: [
        { date: fundStart, value: 25000 },
        { date: addDays(fundStart, 7), value: 32500 },
        { date: addDays(fundStart, 14), value: 42500 },
      ],
      done: false,
    },
    {
      id: uid(),
      title: 'First strict pull-up',
      stat: 'STR',
      unit: 'reps',
      start: 0,
      target: 1,
      current: 0,
      deadline: addDays(today, 110),
      updates: [{ date: joined, value: 0 }],
      done: false,
      source: 'ladder.pull',
    },
    {
      id: uid(),
      title: 'Waist to 80 cm',
      stat: 'VIT',
      unit: 'cm',
      start: 86,
      target: 80,
      current: 84.5,
      deadline: addDays(today, 160),
      updates: [
        { date: joined, value: 86 },
        { date: addDays(joined, 14), value: 85 },
        { date: addDays(joined, 20), value: 84.5 },
      ],
      done: false,
      source: 'body.waist',
    },
    {
      id: uid(),
      title: 'Read 12 books',
      stat: 'INT',
      unit: 'books',
      start: 0,
      target: 12,
      current: 2,
      deadline: addDays(today, 340),
      updates: [{ date: addDays(joined, 12), value: 2 }],
      done: false,
    },
    {
      id: uid(),
      title: 'Ship the portfolio site',
      stat: 'INT',
      unit: '%',
      start: 0,
      target: 100,
      current: 100,
      updates: [
        { date: joined, value: 40 },
        { date: addDays(joined, 11), value: 100 },
      ],
      done: true,
      doneAt: addDays(joined, 11),
    },
  ];
  xp.push(
    ...toEvents(addDays(joined, 11), [
      { stat: 'INT', amount: XP.goal, source: 'goal', ref: `goal:${goals[4]?.id ?? ''}` },
    ]),
  );

  await db.transaction('rw', ALL_TABLES, async () => {
    await repo.profile.put({
      ...profile,
      weightKg: body[body.length - 1]?.weightKg ?? profile.weightKg,
    });
    await repo.ladders.putAll(LADDER_KEYS.map((k) => ladders[k]));
    await repo.exercises.putAll(Object.values(exercises));
    await repo.habits.putAll(habits);
    await repo.days.putAll([...records.values()]);
    for (const s of sessions) await repo.sessions.put(s);
    for (const g of goals) await repo.goals.put(g);
    for (const b of body) await repo.body.put(b);
    await repo.xp.add(xp);
    await repo.player.put({
      xp: 0,
      level: 1,
      statXp: emptyStats(),
      bestStreak: 0,
      titles: ['awakened'],
      equippedTitle: 'awakened',
      gatesCleared: 0,
    });
    await repo.meta.set('schemaVersion', SCHEMA_VERSION);
    await repo.meta.set('lastClosed', addDays(today, -1));
    await repo.meta.set('lastTierEval', addDays(today, -1));
    await repo.meta.set('demo', true);
  });
  await syncPlayer(today);
}
