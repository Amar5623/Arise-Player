/** Domain types. Pure data, no behaviour. See PLAN.md §4. */

export type Stat = 'STR' | 'AGI' | 'VIT' | 'INT' | 'CHA' | 'WLT';
export const STAT_KEYS: readonly Stat[] = ['STR', 'AGI', 'VIT', 'INT', 'CHA', 'WLT'];

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type Condition = 'OPTIMAL' | 'FATIGUED' | 'INJURED';
