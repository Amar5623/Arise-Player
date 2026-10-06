/**
 * Daily quest library (brief §6 Habit library, PLAN.md §6.5 for XP). Tiered habits start at T1
 * and move with adherence; XP is base + 2 per tier above T1.
 */
import type { Area, ISODate, Stat } from '@/engine/types';
import { hhmmMinusHours, isFirstSundayOfMonth, weekday } from '@/lib/dates';
import { money, roundTo } from '@/lib/format';

export type Schedule = 'daily' | 'sunday' | 'monday' | 'first-sunday';

export interface HabitContext {
  weightKg: number;
  wake: string;
  currency: string;
  saveWeekly: number;
}

export interface HabitDef {
  id: string;
  area: Exclude<Area, 'training' | 'penalty' | 'bonus'>;
  stat: Stat;
  xp: number;
  schedule: Schedule;
  defaultOn: boolean;
  /** Tier values; absent for untiered habits. */
  tiers?: readonly number[];
  title: (tierValue: number | undefined, ctx: HabitContext) => string;
  detail: (tierValue: number | undefined, ctx: HabitContext) => string;
}

const k = (n: number) => `${n / 1000}k`;

export const HABITS: readonly HabitDef[] = [
  /* Face & looks (CHA) */
  {
    id: 'am-skin',
    area: 'face',
    stat: 'CHA',
    xp: 8,
    schedule: 'daily',
    defaultOn: true,
    title: () => 'AM skincare',
    detail: () => 'Cleanse, moisturise, SPF 30+',
  },
  {
    id: 'pm-skin',
    area: 'face',
    stat: 'CHA',
    xp: 8,
    schedule: 'daily',
    defaultOn: true,
    title: () => 'PM skincare',
    detail: () => 'Cleanse and moisturise before bed',
  },
  {
    id: 'chin-tucks',
    area: 'face',
    stat: 'CHA',
    xp: 8,
    schedule: 'daily',
    defaultOn: false,
    tiers: [10, 12, 15, 20],
    title: (t) => `Chin tucks 2 × ${t}`,
    detail: () => 'Posture drill: draw the chin straight back, hold 2 s',
  },
  {
    id: 'grooming',
    area: 'face',
    stat: 'CHA',
    xp: 10,
    schedule: 'sunday',
    defaultOn: true,
    title: () => 'Grooming check',
    detail: () => 'Hair, nails, beard or shave, eyebrows',
  },
  {
    id: 'photos',
    area: 'face',
    stat: 'CHA',
    xp: 15,
    schedule: 'first-sunday',
    defaultOn: true,
    title: () => 'Progress photos',
    detail: () => 'Front, side, back. Same light, same clothes.',
  },

  /* Diet & recovery (VIT) */
  {
    id: 'protein',
    area: 'diet',
    stat: 'VIT',
    xp: 12,
    schedule: 'daily',
    defaultOn: true,
    tiers: [1.2, 1.4, 1.6, 1.8],
    title: (t, c) => `Protein ${roundTo(c.weightKg * (t ?? 1.2), 5)} g`,
    detail: () => 'Eggs, dal, paneer, curd, chicken, soya',
  },
  {
    id: 'water',
    area: 'diet',
    stat: 'VIT',
    xp: 8,
    schedule: 'daily',
    defaultOn: true,
    tiers: [2, 2.5, 3, 3.5],
    title: (t) => `Water ${t} L`,
    detail: () => 'Spread through the day',
  },
  {
    id: 'fruit-veg',
    area: 'diet',
    stat: 'VIT',
    xp: 8,
    schedule: 'daily',
    defaultOn: false,
    tiers: [3, 4, 5],
    title: (t) => `${t} servings of fruit and veg`,
    detail: () => 'A serving is a fist-sized portion',
  },
  {
    id: 'no-junk',
    area: 'diet',
    stat: 'VIT',
    xp: 10,
    schedule: 'daily',
    defaultOn: false,
    title: () => 'No junk or sugary drinks',
    detail: () => 'Packaged snacks, fried food, soft drinks, sweets',
  },
  {
    id: 'sleep',
    area: 'diet',
    stat: 'VIT',
    xp: 12,
    schedule: 'daily',
    defaultOn: true,
    title: (_t, c) => `Lights out by ${hhmmMinusHours(c.wake, 8)}`,
    detail: (_t, c) => `7.5 h of sleep before a ${c.wake} alarm`,
  },

  /* Body (AGI) */
  {
    id: 'steps',
    area: 'body',
    stat: 'AGI',
    xp: 12,
    schedule: 'daily',
    defaultOn: true,
    tiers: [6000, 7000, 8000, 9000, 10000],
    title: (t) => `${k(t ?? 6000)} steps`,
    detail: () => 'Walks count; check your phone or watch',
  },
  {
    id: 'desk-breaks',
    area: 'body',
    stat: 'AGI',
    xp: 8,
    schedule: 'daily',
    defaultOn: true,
    title: () => 'Desk breaks',
    detail: () => 'Every 45-60 min: 10 glute squeezes and a hip flexor stretch',
  },

  /* Mind (INT) */
  {
    id: 'read',
    area: 'mind',
    stat: 'INT',
    xp: 12,
    schedule: 'daily',
    defaultOn: true,
    tiers: [10, 15, 20, 25, 30],
    title: (t) => `Read ${t} pages`,
    detail: () => 'A book, not a feed',
  },
  {
    id: 'deep-work',
    area: 'mind',
    stat: 'INT',
    xp: 15,
    schedule: 'daily',
    defaultOn: true,
    tiers: [25, 45, 60, 90],
    title: (t) => `Deep work ${t} min`,
    detail: () => 'One block, phone in another room',
  },
  {
    id: 'social',
    area: 'mind',
    stat: 'INT',
    xp: 10,
    schedule: 'daily',
    defaultOn: true,
    tiers: [90, 75, 60, 45, 30],
    title: (t) => `Social media under ${t} min`,
    detail: () => 'Check screen time before bed',
  },
  {
    id: 'journal',
    area: 'mind',
    stat: 'INT',
    xp: 6,
    schedule: 'daily',
    defaultOn: false,
    title: () => 'Journal 3 lines',
    detail: () => 'What happened, what you learned, what is next',
  },
  {
    id: 'meditate',
    area: 'mind',
    stat: 'INT',
    xp: 8,
    schedule: 'daily',
    defaultOn: false,
    tiers: [5, 10, 15],
    title: (t) => `Meditate ${t} min`,
    detail: () => 'Sit, breathe, count to ten and repeat',
  },

  /* Wealth (WLT) */
  {
    id: 'expenses',
    area: 'wealth',
    stat: 'WLT',
    xp: 8,
    schedule: 'daily',
    defaultOn: true,
    title: () => 'Log every expense',
    detail: () => 'Every rupee, the same day',
  },
  {
    id: 'no-impulse',
    area: 'wealth',
    stat: 'WLT',
    xp: 8,
    schedule: 'daily',
    defaultOn: false,
    title: () => 'No impulse buys',
    detail: () => '48-hour rule on anything unplanned',
  },
  {
    id: 'save',
    area: 'wealth',
    stat: 'WLT',
    xp: 20,
    schedule: 'monday',
    defaultOn: true,
    title: (_t, c) => `Pay yourself first: ${money(c.saveWeekly, c.currency)}`,
    detail: () => 'Move it to savings before you spend',
  },
  {
    id: 'income-skill',
    area: 'wealth',
    stat: 'WLT',
    xp: 15,
    schedule: 'daily',
    defaultOn: false,
    tiers: [30, 45, 60],
    title: (t) => `Income-skill block ${t} min`,
    detail: () => 'Practise the skill that raises your income',
  },
];

export function habitDef(id: string): HabitDef | undefined {
  return HABITS.find((h) => h.id === id);
}

export function isScheduled(def: Pick<HabitDef, 'schedule'>, date: ISODate): boolean {
  switch (def.schedule) {
    case 'daily':
      return true;
    case 'sunday':
      return weekday(date) === 6;
    case 'monday':
      return weekday(date) === 0;
    case 'first-sunday':
      return isFirstSundayOfMonth(date);
  }
}

export function tierValue(def: HabitDef, tier: number): number | undefined {
  if (!def.tiers) return undefined;
  return def.tiers[Math.min(def.tiers.length, Math.max(1, tier)) - 1];
}

export function habitXp(def: HabitDef, tier: number): number {
  return def.xp + (def.tiers ? 2 * (Math.max(1, tier) - 1) : 0);
}
