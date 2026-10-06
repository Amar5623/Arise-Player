import type { Stat } from '@/engine/types';

export interface StatMeta {
  key: Stat;
  name: string;
  /** What feeds it, in plain words. */
  feeds: string;
  /** CSS custom property holding the stat mark colour. */
  color: string;
}

export const STATS: readonly StatMeta[] = [
  {
    key: 'STR',
    name: 'Strength',
    feeds: 'Push, squat, pull and hinge work',
    color: 'var(--color-str)',
  },
  {
    key: 'AGI',
    name: 'Agility',
    feeds: 'Core, mobility, posture, combat, steps, warm-up',
    color: 'var(--color-agi)',
  },
  {
    key: 'VIT',
    name: 'Vitality',
    feeds: 'Protein, water, food quality, sleep, weigh-ins',
    color: 'var(--color-vit)',
  },
  {
    key: 'INT',
    name: 'Intellect',
    feeds: 'Reading, deep work, journaling, focus',
    color: 'var(--color-int)',
  },
  {
    key: 'CHA',
    name: 'Charisma',
    feeds: 'Skincare, grooming, posture checks',
    color: 'var(--color-cha)',
  },
  {
    key: 'WLT',
    name: 'Wealth',
    feeds: 'Saving, spending discipline, income skills',
    color: 'var(--color-wlt)',
  },
] as const;

export const STAT_COLOR: Record<Stat, string> = Object.fromEntries(
  STATS.map((s) => [s.key, s.color]),
) as Record<Stat, string>;
