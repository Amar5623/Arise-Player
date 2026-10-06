import { anyExercise, ladderExercise } from '@/data/ladders';
import { trackerUnit } from '@/data/exercises';
import { dayShort } from '@/lib/dates';
import type { LadderKey, Session } from './types';

/** Columns of the tracker's Log sheet that a person types into (formula columns excluded). */
export const CSV_HEADER = [
  'Date',
  'Day',
  'Exercise',
  'Variation used',
  'Unit',
  'Set 1',
  'Set 2',
  'Set 3',
  'Set 4',
  'Set 5',
  'RPE',
  'Notes',
] as const;

function cell(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Training log as CSV in the tracker's Log columns, so rows paste straight into the sheet.
 * Exercise is the tracker's dropdown name; ladder steps go in "Variation used"; per-side values
 * are one side. Shadowboxing is logged in rounds, as the tracker expects.
 */
export function sessionsToCsv(sessions: readonly Session[]): string {
  const rows: string[] = [CSV_HEADER.join(',')];
  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const s of sorted) {
    for (const e of s.entries) {
      const logged = e.sets.filter((v): v is number => v !== null);
      if (!logged.length) continue;
      const m = /^(push|squat|pull)-(\d)$/.exec(e.exerciseId);
      const def = m ? ladderExercise(m[1] as LadderKey, Number(m[2])) : anyExercise(e.exerciseId);
      const variation = m ? def.name : '';
      const rounds = def.rounds ?? false;
      const sets = rounds ? [logged.length] : e.sets.slice(0, 5).map((v) => (v === null ? '' : v));
      const notes = [
        e.pain ? 'Pain' : '',
        s.mode === 'recover'
          ? 'Recovery mode'
          : s.mode === 'injured'
            ? 'Injured: mobility only'
            : '',
        s.deload ? 'Deload' : '',
        s.quick ? 'Short session' : '',
      ]
        .filter(Boolean)
        .join('; ');
      rows.push(
        [
          s.date,
          dayShort(s.date),
          def.trackerName,
          variation,
          trackerUnit(def),
          ...Array.from({ length: 5 }, (_, i) => sets[i] ?? ''),
          e.rpe,
          notes,
        ]
          .map(cell)
          .join(','),
      );
    }
  }
  return `${rows.join('\n')}\n`;
}
