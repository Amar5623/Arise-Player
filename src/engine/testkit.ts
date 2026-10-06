/** Shared fixtures for engine tests. */
import type { DayRecord, ExerciseProgress, LadderKey, LadderProgress, Quest } from './types';

export const ladders = (
  push = { step: 2, target: 8 },
  squat = { step: 2, target: 12 },
  pull = { step: 2, target: 6 },
): Record<LadderKey, LadderProgress> => ({
  push: { key: 'push', fails: 0, ...push },
  squat: { key: 'squat', fails: 0, ...squat },
  pull: { key: 'pull', fails: 0, ...pull },
});

export const noExercises: Record<string, ExerciseProgress | undefined> = {};

export function quest(id: string, done: boolean, extra: Partial<Quest> = {}): Quest {
  return {
    id,
    area: 'mind',
    stat: 'INT',
    xp: 10,
    title: id,
    detail: '',
    done,
    kind: 'habit',
    ...extra,
  };
}

/** A record with `done` of `total` required quests done. */
export function day(
  date: string,
  done: number,
  total: number,
  extra: Partial<DayRecord> = {},
): DayRecord {
  return {
    date,
    quests: Array.from({ length: total }, (_, i) => quest(`q${i}`, i < done)),
    bonusAwarded: false,
    closed: false,
    ...extra,
  };
}

export const recordMap = (...days: DayRecord[]) => new Map(days.map((d) => [d.date, d]));
