import { describe, expect, it } from 'vitest';
import {
  addDays,
  dateRange,
  dayShort,
  diffDays,
  hhmmMinusHours,
  isDeloadWeek,
  isFirstSundayOfMonth,
  isHHMM,
  isISODate,
  msToMidnight,
  programWeek,
  shortLabel,
  startOfWeek,
  toISO,
  weekday,
} from './dates';

describe('dates', () => {
  it('formats local dates without UTC drift', () => {
    expect(toISO(new Date(2026, 9, 6, 0, 5))).toBe('2026-10-06');
    expect(toISO(new Date(2026, 9, 6, 23, 59))).toBe('2026-10-06');
  });

  it('adds days across month, year and DST boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-10-05', -5)).toBe('2026-09-30');
  });

  it('counts whole days, DST included', () => {
    expect(diffDays('2026-03-07', '2026-03-09')).toBe(2);
    expect(diffDays('2026-10-31', '2026-11-02')).toBe(2);
    expect(diffDays('2026-10-06', '2026-10-05')).toBe(-1);
  });

  it('numbers weekdays Monday-first', () => {
    expect(weekday('2026-10-05')).toBe(0);
    expect(weekday('2026-10-06')).toBe(1);
    expect(weekday('2026-10-11')).toBe(6);
    expect(dayShort('2026-10-11')).toBe('Sun');
    expect(shortLabel('2026-10-06')).toBe('Tue 6 Oct');
    expect(startOfWeek('2026-10-11')).toBe('2026-10-05');
  });

  it('computes program weeks from the start Monday', () => {
    expect(programWeek('2026-10-05', '2026-10-05')).toBe(1);
    expect(programWeek('2026-10-05', '2026-10-11')).toBe(1);
    expect(programWeek('2026-10-05', '2026-10-12')).toBe(2);
    expect(programWeek('2026-10-05', '2026-11-09')).toBe(6);
    expect(programWeek('2026-10-05', '2026-10-01')).toBe(1);
  });

  it('deloads every 6th week', () => {
    expect([5, 6, 7, 12, 18].map(isDeloadWeek)).toEqual([false, true, false, true, true]);
  });

  it('finds the first Sunday of the month', () => {
    expect(isFirstSundayOfMonth('2026-11-01')).toBe(true);
    expect(isFirstSundayOfMonth('2026-11-08')).toBe(false);
    expect(isFirstSundayOfMonth('2026-10-04')).toBe(true);
    expect(isFirstSundayOfMonth('2026-10-05')).toBe(false);
  });

  it('measures time to local midnight', () => {
    expect(msToMidnight(new Date(2026, 9, 6, 23, 0, 0))).toBe(3_600_000);
  });

  it('subtracts hours from a clock time', () => {
    expect(hhmmMinusHours('06:30', 8)).toBe('22:30');
    expect(hhmmMinusHours('09:00', 8)).toBe('01:00');
  });

  it('validates inputs', () => {
    expect(isISODate('2026-02-29')).toBe(false);
    expect(isISODate('2028-02-29')).toBe(true);
    expect(isHHMM('06:30')).toBe(true);
    expect(isHHMM('25:10')).toBe(false);
    expect(dateRange('2026-10-05', '2026-10-07')).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
    ]);
    expect(dateRange('2026-10-07', '2026-10-05')).toEqual([]);
  });
});
