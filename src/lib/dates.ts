/**
 * Local-calendar date helpers. Dates are 'YYYY-MM-DD' in the device's time zone (the owner is in
 * Asia/Kolkata). Arithmetic goes through calendar components, never through toISOString or
 * fixed 24-hour offsets, so it is correct across DST changes in any zone.
 */
import type { ISODate } from '@/engine/types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISO(now);
}

function parts(iso: ISODate): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Bad date: ${iso}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function isISODate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/** Local midnight of the date. */
export function fromISO(iso: ISODate): Date {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const [y, m, d] = parts(iso);
  return toISO(new Date(y, m - 1, d + n));
}

/** Whole calendar days from a to b (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  const [ya, ma, da] = parts(a);
  const [yb, mb, db] = parts(b);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000);
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(iso: ISODate): number {
  const [y, m, d] = parts(iso);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function dayShort(iso: ISODate): string {
  return DAY_SHORT[weekday(iso)] ?? '';
}

/** "Tue 6 Oct" */
export function shortLabel(iso: ISODate): string {
  const [, m, d] = parts(iso);
  return `${dayShort(iso)} ${d} ${MONTH_SHORT[m - 1] ?? ''}`;
}

/** "6 Oct" */
export function dayMonth(iso: ISODate): string {
  const [, m, d] = parts(iso);
  return `${d} ${MONTH_SHORT[m - 1] ?? ''}`;
}

/** Monday of the week containing the date. */
export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, -weekday(iso));
}

/** Inclusive list of dates from a to b. Empty when b < a. */
export function dateRange(a: ISODate, b: ISODate): ISODate[] {
  const n = diffDays(a, b);
  return Array.from({ length: Math.max(0, n + 1) }, (_, i) => addDays(a, i));
}

/** 1-based program week; days before the start count as week 1. */
export function programWeek(programStart: ISODate, date: ISODate): number {
  return Math.max(1, Math.floor(diffDays(programStart, date) / 7) + 1);
}

/** Every 6th program week is a deload week. */
export function isDeloadWeek(week: number): boolean {
  return week > 0 && week % 6 === 0;
}

export function isFirstSundayOfMonth(iso: ISODate): boolean {
  const [, , d] = parts(iso);
  return weekday(iso) === 6 && d <= 7;
}

/** Milliseconds until the next local midnight. */
export function msToMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** 'HH:MM' minus whole hours, wrapping past midnight. */
export function hhmmMinusHours(hhmm: string, hours: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Bad time: ${hhmm}`);
  const total = (((Number(m[1]) * 60 + Number(m[2]) - hours * 60) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function isHHMM(value: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}
