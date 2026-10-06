/** Domain types. Pure data, no behaviour. See PLAN.md §4. */

export type Stat = 'STR' | 'AGI' | 'VIT' | 'INT' | 'CHA' | 'WLT';
export const STAT_KEYS: readonly Stat[] = ['STR', 'AGI', 'VIT', 'INT', 'CHA', 'WLT'];

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type Condition = 'OPTIMAL' | 'FATIGUED' | 'INJURED';

/** Local calendar date, 'YYYY-MM-DD'. Never a UTC timestamp. */
export type ISODate = string;

export type LadderKey = 'push' | 'squat' | 'pull';
export type Unit = 'reps' | 'sec';
export type SessionMode = 'normal' | 'recover' | 'injured';
export type Area = 'training' | 'penalty' | 'body' | 'diet' | 'face' | 'mind' | 'wealth' | 'bonus';
export type QuestKind = 'gate' | 'habit' | 'penalty' | 'ai' | 'weigh' | 'walk';

export interface Profile {
  name: string;
  weightKg: number;
  heightCm: number;
  /** 'HH:MM', 24-hour. */
  wake: string;
  programStart: ISODate;
  currency: string;
  saveWeekly: number;
  sound: boolean;
  haptics: boolean;
  aiEnabled: boolean;
  /** First day the app was used; close-out never looks earlier. */
  joinedAt: ISODate;
  /** Weigh-in cadence in weeks. */
  weighEvery: 4 | 8;
}

/** Cached view of the XP ledger plus counters. Rebuilt, never edited by hand. */
export interface Player {
  xp: number;
  level: number;
  statXp: Record<Stat, number>;
  bestStreak: number;
  titles: string[];
  equippedTitle: string | null;
  gatesCleared: number;
}

export interface LadderProgress {
  key: LadderKey;
  /** 1-based step on the ladder. */
  step: number;
  target: number;
  fails: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  target: number;
  fails: number;
}

export interface HabitConfig {
  id: string;
  enabled: boolean;
  tier: number;
  /** Enabled or tier last changed on this date. */
  since: ISODate;
}

export interface Readiness {
  sleep: number;
  energy: number;
  soreness: number;
  pain: boolean;
}

export interface Quest {
  id: string;
  area: Area;
  stat: Stat;
  xp: number;
  title: string;
  detail: string;
  done: boolean;
  optional?: boolean;
  kind: QuestKind;
  habitId?: string;
  tier?: number;
  doneAt?: string;
}

export interface DayRecord {
  date: ISODate;
  quests: Quest[];
  readiness?: Readiness;
  condition?: Condition;
  quick?: boolean;
  bonusAwarded: boolean;
  /** done / non-optional, set at close-out. */
  ratio?: number;
  closed: boolean;
  missed?: boolean;
  aiMessage?: string;
}

export type LogKind = 'up' | 'hold' | 'eased' | 'unlock' | 'mastered' | 'pain' | 'skip' | 'miss';

export interface SystemLogLine {
  kind: LogKind;
  exerciseId: string;
  name: string;
  text: string;
}

export interface SessionEntry {
  /** Unique within the session, e.g. 'mon-1'. */
  key: string;
  exerciseId: string;
  name: string;
  unit: Unit;
  side: boolean;
  target: number;
  sets: (number | null)[];
  rpe?: number;
  pain: boolean;
}

export interface Session {
  id: string;
  date: ISODate;
  planDay: number;
  name: string;
  mode: SessionMode;
  quick: boolean;
  deload: boolean;
  warmupDone: boolean;
  /** One flag per warm-up item. */
  warmup: boolean[];
  entries: SessionEntry[];
  xp: number;
  log: SystemLogLine[];
}

export interface GoalUpdate {
  date: ISODate;
  value: number;
}

export interface Goal {
  id: string;
  title: string;
  stat: Stat;
  unit: string;
  start: number;
  target: number;
  current: number;
  deadline?: ISODate;
  updates: GoalUpdate[];
  done: boolean;
  doneAt?: ISODate;
}

export interface BodyEntry {
  date: ISODate;
  weightKg?: number;
  waistCm?: number;
  hipsCm?: number;
  note?: string;
}

export type XpSource = 'quest' | 'gate' | 'bonus' | 'unlock' | 'goal';

/** One XP change. The ledger is the source of truth for XP, level and stats. */
export interface XpEvent {
  id: string;
  date: ISODate;
  /** ms timestamp, for ordering within a day. */
  at: number;
  /** null for XP that raises level but no stat (daily bonus). */
  stat: Stat | null;
  amount: number;
  source: XpSource;
  /** What earned it: quest id, session id, goal id. */
  ref: string;
}

export type XpDraft = Omit<XpEvent, 'id' | 'at' | 'date'>;
