import { describe, expect, it } from 'vitest';
import { HABITS } from '@/data/habits';
import {
  buildDayQuests,
  dailyLoad,
  dayRatio,
  groupQuests,
  isWeighDay,
  LEAN_LIMIT,
  refreshHabitQuests,
  type BuildDayInput,
} from './quests';
import { quest } from './testkit';
import type { HabitConfig } from './types';

const defaults: HabitConfig[] = HABITS.map((h) => ({
  id: h.id,
  enabled: h.defaultOn,
  tier: 1,
  since: '2026-10-05',
}));
const ctx = { weightKg: 78, wake: '06:30', currency: '₹', saveWeekly: 2500 };
const input = (over: Partial<BuildDayInput> = {}): BuildDayInput => ({
  date: '2026-10-06',
  programStart: '2026-10-05',
  weighEvery: 4,
  habits: defaults,
  ctx,
  gate: { title: 'Gate: Legs', detail: '6 exercises, about 40 min', xp: 120 },
  penalty: false,
  ...over,
});
const ids = (qs: { id: string }[]) => qs.map((q) => q.id);

describe('daily quests', () => {
  it('starts with the gate and lists the default daily habits', () => {
    const qs = buildDayQuests(input());
    expect(qs[0]).toMatchObject({ id: 'gate', kind: 'gate', area: 'training', xp: 120 });
    expect(ids(qs)).toContain('habit:protein');
    expect(ids(qs)).not.toContain('habit:save');
    expect(ids(qs)).not.toContain('habit:grooming');
  });

  it('adds Monday savings and the Sunday walk, grooming and first-Sunday photos', () => {
    expect(ids(buildDayQuests(input({ date: '2026-10-12' })))).toContain('habit:save');
    const sun = buildDayQuests(input({ date: '2026-11-01', gate: null }));
    expect(ids(sun)).toEqual(expect.arrayContaining(['walk', 'habit:grooming', 'habit:photos']));
    expect(ids(sun)).not.toContain('gate');
    expect(ids(buildDayQuests(input({ date: '2026-11-08', gate: null })))).not.toContain(
      'habit:photos',
    );
  });

  it('schedules the weigh-in every 4 or 8 weeks, on Mondays, from week 1', () => {
    expect(isWeighDay('2026-10-05', '2026-10-05', 4)).toBe(true);
    expect(isWeighDay('2026-10-12', '2026-10-05', 4)).toBe(false);
    expect(isWeighDay('2026-11-02', '2026-10-05', 4)).toBe(true);
    expect(isWeighDay('2026-11-02', '2026-10-05', 8)).toBe(false);
    expect(isWeighDay('2026-11-30', '2026-10-05', 8)).toBe(true);
    expect(isWeighDay('2026-11-03', '2026-10-05', 4)).toBe(false);
    expect(ids(buildDayQuests(input({ date: '2026-10-05' })))).toContain('weigh');
  });

  it('puts the penalty right after training', () => {
    const qs = buildDayQuests(input({ penalty: true }));
    expect(qs[1]).toMatchObject({ id: 'penalty', kind: 'penalty', title: '20-min brisk walk' });
  });

  it('writes tiered titles from the profile', () => {
    const t3 = defaults.map((h) => (h.id === 'protein' ? { ...h, tier: 3 } : h));
    const qs = buildDayQuests(input({ habits: t3 }));
    expect(qs.find((q) => q.id === 'habit:protein')).toMatchObject({
      title: 'Protein 125 g',
      tier: 3,
      xp: 16,
    });
    expect(buildDayQuests(input()).find((q) => q.id === 'habit:protein')?.title).toBe(
      'Protein 95 g',
    );
    expect(buildDayQuests(input()).find((q) => q.id === 'habit:sleep')?.title).toBe(
      'Lights out by 22:30',
    );
    expect(
      buildDayQuests(input({ date: '2026-10-12' })).find((q) => q.id === 'habit:save')?.title,
    ).toBe('Pay yourself first: ₹2,500');
  });

  it('keeps the default selection at the lean limit', () => {
    const on = HABITS.filter((h) => h.defaultOn).map((h) => h.id);
    expect(dailyLoad(on)).toBe(12);
    expect(dailyLoad(on)).toBeLessThanOrEqual(LEAN_LIMIT);
  });

  it('scores done over non-optional quests', () => {
    expect(
      dayRatio([quest('a', true), quest('b', false), quest('c', false, { optional: true })]),
    ).toBe(0.5);
    expect(dayRatio([])).toBe(1);
  });

  it('groups in brief order and keeps done flags when the library changes', () => {
    const qs = buildDayQuests(input({ penalty: true }));
    expect(groupQuests(qs).map((g) => g.area)).toEqual([
      'training',
      'penalty',
      'body',
      'diet',
      'face',
      'mind',
      'wealth',
    ]);
    const done = qs.map((q) => (q.id === 'habit:read' ? { ...q, done: true } : q));
    const fewer = buildDayQuests(
      input({
        penalty: true,
        habits: defaults.map((h) => (h.id === 'water' ? { ...h, enabled: false } : h)),
      }),
    );
    const merged = refreshHabitQuests(done, fewer);
    expect(merged.find((q) => q.id === 'habit:read')?.done).toBe(true);
    expect(ids(merged)).not.toContain('habit:water');
    expect(ids(merged)).toContain('penalty');
  });
});
