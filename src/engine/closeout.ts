import { addDays, dateRange } from '@/lib/dates';
import { dayRatio } from './quests';
import type { DayRecord, ISODate } from './types';

export const PENALTY_BELOW = 0.5;
export const STREAK_AT = 0.8;

export interface CloseOutResult {
  /** Records to write: every past day since the last close, closed with its ratio. */
  closed: DayRecord[];
  /** Yesterday closed under 50%: today gets the penalty quest. */
  penalty: boolean;
  /** Yesterday closed at 80% or more. */
  streakContinues: boolean;
  /** Ratio yesterday closed at, if yesterday is inside the record. */
  yesterdayRatio: number | null;
}

const blank = (date: ISODate): DayRecord => ({
  date,
  quests: [],
  bonusAwarded: false,
  closed: false,
});

/**
 * Daily close-out (brief §7), run on app open. Closes every unevaluated past day since joining.
 * A day with no record is missed (ratio 0).
 */
export function closeOut(
  today: ISODate,
  joinedAt: ISODate,
  records: ReadonlyMap<ISODate, DayRecord>,
  lastClosed: ISODate | null,
): CloseOutResult {
  const yesterday = addDays(today, -1);
  const from = lastClosed ? addDays(lastClosed, 1) : joinedAt;
  const closed: DayRecord[] = [];

  for (const date of dateRange(from < joinedAt ? joinedAt : from, yesterday)) {
    const rec = records.get(date);
    if (rec?.closed) continue;
    const missing = !rec || rec.quests.length === 0;
    const ratio = missing ? 0 : dayRatio(rec.quests);
    closed.push({ ...(rec ?? blank(date)), ratio, closed: true, missed: missing });
  }

  const y = closed.find((r) => r.date === yesterday) ?? records.get(yesterday);
  const inRecord = yesterday >= joinedAt;
  const yesterdayRatio = inRecord ? (y?.ratio ?? (y ? dayRatio(y.quests) : 0)) : null;
  return {
    closed,
    penalty: yesterdayRatio !== null && yesterdayRatio < PENALTY_BELOW,
    streakContinues: yesterdayRatio !== null && yesterdayRatio >= STREAK_AT,
    yesterdayRatio,
  };
}
