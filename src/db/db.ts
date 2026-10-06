import Dexie, { type Table } from 'dexie';
import type {
  BodyEntry,
  DayRecord,
  ExerciseProgress,
  Goal,
  HabitConfig,
  LadderProgress,
  Player,
  Profile,
  Session,
  XpEvent,
} from '@/engine/types';

export const SCHEMA_VERSION = 1;

export type ProfileRow = Profile & { id: 'me' };
export type PlayerRow = Player & { id: 'me' };
export interface MetaRow {
  key: string;
  value: unknown;
}

export class PlayerDB extends Dexie {
  profile!: Table<ProfileRow, string>;
  player!: Table<PlayerRow, string>;
  ladders!: Table<LadderProgress, string>;
  exercises!: Table<ExerciseProgress, string>;
  habits!: Table<HabitConfig, string>;
  days!: Table<DayRecord, string>;
  sessions!: Table<Session, string>;
  goals!: Table<Goal, string>;
  body!: Table<BodyEntry, string>;
  xp!: Table<XpEvent, string>;
  meta!: Table<MetaRow, string>;

  constructor(name: string) {
    super(name);
    this.version(SCHEMA_VERSION).stores({
      profile: 'id',
      player: 'id',
      ladders: 'key',
      exercises: 'exerciseId',
      habits: 'id',
      days: 'date',
      sessions: 'id, date',
      goals: 'id, done',
      body: 'date',
      xp: 'id, date, stat, source, ref',
      meta: 'key',
    });
  }
}

const DEMO_FLAG = 'player-system:demo';

/** Demo mode lives for the browser session once `?demo=1` is opened. Never on by default. */
export function isDemo(): boolean {
  if (typeof window === 'undefined') return false;
  const url = new URLSearchParams(window.location.search).get('demo');
  try {
    if (url === '1') window.sessionStorage.setItem(DEMO_FLAG, '1');
    if (url === '0') window.sessionStorage.removeItem(DEMO_FLAG);
    return window.sessionStorage.getItem(DEMO_FLAG) === '1';
  } catch {
    return url === '1';
  }
}

export function leaveDemo(): void {
  try {
    window.sessionStorage.removeItem(DEMO_FLAG);
  } catch {
    // Storage blocked: the URL flag alone controlled demo mode.
  }
}

export const DEMO = isDemo();
export const db = new PlayerDB(DEMO ? 'player-system-demo' : 'player-system');
