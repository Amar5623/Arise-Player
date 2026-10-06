/** Main quest templates (brief §4.5). Values are starting suggestions the owner edits. */
import type { GoalSource, Stat } from '@/engine/types';

export interface GoalTemplate {
  id: string;
  title: string;
  stat: Stat;
  unit: string;
  start: number;
  target: number;
  /** Suggested length in days. */
  days: number;
  money?: boolean;
  source?: GoalSource;
}

export const GOAL_TEMPLATES: readonly GoalTemplate[] = [
  {
    id: 'emergency-fund',
    title: 'Emergency fund',
    stat: 'WLT',
    unit: '₹',
    start: 0,
    target: 300000,
    days: 365,
    money: true,
  },
  {
    id: 'first-pull-up',
    title: 'First strict pull-up',
    stat: 'STR',
    unit: 'reps',
    start: 0,
    target: 1,
    days: 120,
    source: 'ladder.pull',
  },
  {
    id: 'waist-80',
    title: 'Waist to 80 cm',
    stat: 'VIT',
    unit: 'cm',
    start: 88,
    target: 80,
    days: 180,
    source: 'body.waist',
  },
  {
    id: 'read-12',
    title: 'Read 12 books',
    stat: 'INT',
    unit: 'books',
    start: 0,
    target: 12,
    days: 365,
  },
  {
    id: 'skincare-60',
    title: '60-day skincare streak',
    stat: 'CHA',
    unit: 'days',
    start: 0,
    target: 60,
    days: 60,
  },
  {
    id: 'side-project',
    title: 'Ship a side project',
    stat: 'INT',
    unit: '%',
    start: 0,
    target: 100,
    days: 90,
  },
];
