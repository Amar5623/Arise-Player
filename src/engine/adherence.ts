import { addDays, dateRange, shortLabel, startOfWeek } from '@/lib/dates';
import { dayRatio } from './quests';
import type { DayRecord, ISODate } from './types';

const ratioOf = (r: DayRecord | undefined) =>
  r ? (r.closed ? (r.ratio ?? 0) : dayRatio(r.quests)) : 0;

/** Mean completion over the last 7 finished days (yesterday back), ignoring days before joining. */
export function adherence7(
  today: ISODate,
  records: ReadonlyMap<ISODate, DayRecord>,
  joinedAt: ISODate,
): number | null {
  const days = dateRange(addDays(today, -7), addDays(today, -1)).filter((d) => d >= joinedAt);
  if (!days.length) return null;
  return days.reduce((sum, d) => sum + ratioOf(records.get(d)), 0) / days.length;
}

export interface HeatDay {
  date: ISODate;
  label: string;
  ratio: number | null;
  done?: number;
  total?: number;
  today: boolean;
}

/** 12 weeks, Monday-first columns, ending with the current week. Future and pre-join days are null. */
export function heatmap(
  today: ISODate,
  records: ReadonlyMap<ISODate, DayRecord>,
  joinedAt: ISODate,
  weeks = 12,
): HeatDay[] {
  const start = addDays(startOfWeek(today), -(weeks - 1) * 7);
  return dateRange(start, addDays(start, weeks * 7 - 1)).map((date) => {
    const base = { date, label: shortLabel(date), today: date === today };
    if (date > today || date < joinedAt) return { ...base, ratio: null };
    const r = records.get(date);
    const required = r?.quests.filter((q) => !q.optional) ?? [];
    // Today is still in progress: it only shows once something is done, never as missed.
    const ratio = ratioOf(r);
    return {
      ...base,
      ratio: date === today && ratio === 0 ? null : ratio,
      done: required.filter((q) => q.done).length,
      total: required.length,
    };
  });
}

/** Titles of non-optional quests missed in the last 7 days, most frequent first (AI context). */
export function missedTitles(
  today: ISODate,
  records: ReadonlyMap<ISODate, DayRecord>,
): { title: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of dateRange(addDays(today, -7), addDays(today, -1))) {
    for (const q of records.get(d)?.quests ?? []) {
      if (q.optional || q.done || q.kind === 'ai') continue;
      const key = q.habitId ?? q.title;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts].map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count);
}
