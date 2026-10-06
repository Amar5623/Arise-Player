/**
 * The only module that knows about Dexie tables. Screens and commands go through these
 * functions, so a cloud-sync backend can replace them later without touching the UI.
 */
import { LADDER_KEYS } from '@/data/ladders';
import { summarizeXp } from '@/engine/levels';
import type {
  BodyEntry,
  DayRecord,
  ExerciseProgress,
  Goal,
  HabitConfig,
  ISODate,
  LadderKey,
  LadderProgress,
  Player,
  Profile,
  Session,
  XpEvent,
} from '@/engine/types';
import { db } from './db';

export const repo = {
  profile: {
    get: async (): Promise<Profile | undefined> => {
      const row = await db.profile.get('me');
      if (!row) return undefined;
      const { id: _id, ...profile } = row;
      return profile;
    },
    put: (p: Profile) => db.profile.put({ ...p, id: 'me' }),
  },
  player: {
    get: async (): Promise<Player | undefined> => {
      const row = await db.player.get('me');
      if (!row) return undefined;
      const { id: _id, ...player } = row;
      return player;
    },
    put: (p: Player) => db.player.put({ ...p, id: 'me' }),
  },
  ladders: {
    all: async (): Promise<Record<LadderKey, LadderProgress>> => {
      const rows = await db.ladders.toArray();
      const by = new Map(rows.map((r) => [r.key, r]));
      return Object.fromEntries(
        LADDER_KEYS.map((k) => [k, by.get(k) ?? { key: k, step: 1, target: 0, fails: 0 }]),
      ) as Record<LadderKey, LadderProgress>;
    },
    putAll: (rows: readonly LadderProgress[]) => db.ladders.bulkPut([...rows]),
  },
  exercises: {
    all: async (): Promise<Record<string, ExerciseProgress>> =>
      Object.fromEntries((await db.exercises.toArray()).map((e) => [e.exerciseId, e])),
    putAll: (rows: readonly ExerciseProgress[]) => db.exercises.bulkPut([...rows]),
  },
  habits: {
    all: () => db.habits.toArray(),
    putAll: (rows: readonly HabitConfig[]) => db.habits.bulkPut([...rows]),
  },
  days: {
    get: (date: ISODate) => db.days.get(date),
    put: (d: DayRecord) => db.days.put(d),
    putAll: (rows: readonly DayRecord[]) => db.days.bulkPut([...rows]),
    all: () => db.days.toArray(),
    map: async () => new Map((await db.days.toArray()).map((d) => [d.date, d])),
  },
  sessions: {
    get: (id: string) => db.sessions.get(id),
    byDate: (date: ISODate) => db.sessions.where('date').equals(date).toArray(),
    all: () => db.sessions.orderBy('date').toArray(),
    count: () => db.sessions.count(),
    put: (s: Session) => db.sessions.put(s),
  },
  goals: {
    all: () => db.goals.toArray(),
    get: (id: string) => db.goals.get(id),
    put: (g: Goal) => db.goals.put(g),
    delete: (id: string) => db.goals.delete(id),
  },
  body: {
    all: () => db.body.orderBy('date').toArray(),
    get: (date: ISODate) => db.body.get(date),
    put: (b: BodyEntry) => db.body.put(b),
  },
  xp: {
    all: () => db.xp.toArray(),
    add: (rows: readonly XpEvent[]) => db.xp.bulkAdd([...rows]),
    byRef: (ref: string) => db.xp.where('ref').equals(ref).toArray(),
    deleteByRef: (ref: string) => db.xp.where('ref').equals(ref).delete(),
    summary: async () => summarizeXp(await db.xp.toArray()),
  },
  meta: {
    get: async <T>(key: string): Promise<T | undefined> =>
      (await db.meta.get(key))?.value as T | undefined,
    set: (key: string, value: unknown) => db.meta.put({ key, value }),
  },
};

/** Every table, for backup, reset and transactions. */
export const ALL_TABLES = [
  db.profile,
  db.player,
  db.ladders,
  db.exercises,
  db.habits,
  db.days,
  db.sessions,
  db.goals,
  db.body,
  db.xp,
  db.meta,
];
