import { addDays } from '@/lib/dates';
import { STREAK_AT } from './closeout';
import { dayRatio } from './quests';
import type { DayRecord, ISODate } from './types';

const ratioOf = (r: DayRecord | undefined) =>
  r ? (r.closed ? (r.ratio ?? 0) : dayRatio(r.quests)) : 0;

/** Consecutive days at 80%+ ending yesterday, plus today if today is already at 80%+. */
export function currentStreak(
  today: ISODate,
  records: ReadonlyMap<ISODate, DayRecord>,
  joinedAt: ISODate,
): number {
  let n = 0;
  for (let d = addDays(today, -1); d >= joinedAt; d = addDays(d, -1)) {
    if (ratioOf(records.get(d)) >= STREAK_AT) n += 1;
    else break;
  }
  const t = records.get(today);
  if (t && t.quests.length && dayRatio(t.quests) >= STREAK_AT) n += 1;
  return n;
}

/** Longest run of 80%+ days anywhere in the record (today included if it qualifies). */
export function bestStreak(
  records: ReadonlyMap<ISODate, DayRecord>,
  today: ISODate,
  joinedAt: ISODate,
): number {
  let best = 0;
  let run = 0;
  for (let d = joinedAt; d <= today; d = addDays(d, 1)) {
    const r = records.get(d);
    const ok =
      d === today
        ? !!r && r.quests.length > 0 && dayRatio(r.quests) >= STREAK_AT
        : ratioOf(r) >= STREAK_AT;
    if (ok) {
      run += 1;
      best = Math.max(best, run);
    } else if (d !== today) {
      run = 0;
    }
  }
  return best;
}
