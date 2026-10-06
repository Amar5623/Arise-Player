import { LADDERS } from '@/data/ladders';
import type { PrescribedItem } from './prescription';
import type {
  ExerciseProgress,
  LadderKey,
  LadderProgress,
  SessionMode,
  SystemLogLine,
  Unit,
} from './types';

/** One prescribed item with what was actually done. */
export interface LoggedItem {
  item: PrescribedItem;
  sets: readonly (number | null)[];
  rpe?: number;
  pain: boolean;
}

export interface Unlock {
  ladder: LadderKey;
  step: number;
  name: string;
}

export interface ProgressionResult {
  ladders: Record<LadderKey, LadderProgress>;
  exercises: Record<string, ExerciseProgress>;
  log: SystemLogLine[];
  unlocks: Unlock[];
}

/** One step of progression: +1 rep, or +5 s on holds. */
export const increment = (unit: Unit) => (unit === 'sec' ? 5 : 1);
/** A set this far under target counts as a miss. */
export const missMargin = (unit: Unit) => (unit === 'sec' ? 10 : 2);
export const FAILS_TO_EASE = 2;
export const PHYSIO_NOTE = 'If it persists, see a physio.';

type UnitShape = Pick<PrescribedItem, 'unit' | 'perSide'> & { steps?: boolean };

const unitWord = (it: UnitShape, n: number) => {
  const base = it.unit === 'sec' ? 's' : it.steps ? 'steps' : 'reps';
  return `${n} ${base}${it.perSide ? ' / side' : ''}`;
};

export interface SetVerdict {
  logged: boolean;
  missing: boolean;
  allHit: boolean;
  badSet: boolean;
}

export function judgeSets(item: PrescribedItem, sets: readonly (number | null)[]): SetVerdict {
  const prescribed = Array.from({ length: item.sets }, (_, i) => sets[i] ?? null);
  const done = prescribed.filter((v): v is number => v !== null);
  const missing = done.length < item.sets;
  return {
    logged: done.length > 0,
    missing,
    allHit: !missing && done.every((v) => v >= item.target),
    badSet: done.some((v) => v < item.target - missMargin(item.unit)),
  };
}

/**
 * Double progression after a session (brief §7). Pure: returns new progress records, the
 * System log, and any skill unlocks. Skipped exercises and non-progressing items don't change.
 */
export function applyProgression(
  mode: SessionMode,
  logged: readonly LoggedItem[],
  ladders: Readonly<Record<LadderKey, LadderProgress>>,
  exercises: Readonly<Record<string, ExerciseProgress | undefined>>,
): ProgressionResult {
  const nextLadders = { ...ladders } as Record<LadderKey, LadderProgress>;
  const nextEx: Record<string, ExerciseProgress> = {};
  const log: SystemLogLine[] = [];
  const unlocks: Unlock[] = [];

  for (const { item, sets, rpe, pain } of logged) {
    const line = (kind: SystemLogLine['kind'], text: string) =>
      log.push({ kind, exerciseId: item.exerciseId, name: item.name, text });
    const verdict = judgeSets(item, sets);

    if (!verdict.logged) {
      if (item.progresses) line('skip', 'Skipped. No change.');
      continue;
    }

    if (!item.progresses || !item.range) {
      if (pain) line('pain', `Pain flagged. ${PHYSIO_NOTE}`);
      continue;
    }

    const [lo, hi] = item.range;
    const inc = increment(item.unit);
    const current = item.ladder
      ? nextLadders[item.ladder]
      : (exercises[item.exerciseId] ?? { exerciseId: item.exerciseId, target: lo, fails: 0 });
    const target = Math.min(hi, Math.max(lo, current.target));

    const save = (patch: { target: number; fails: number; step?: number }) => {
      if (item.ladder) {
        nextLadders[item.ladder] = { ...nextLadders[item.ladder], ...patch };
      } else {
        nextEx[item.exerciseId] = {
          exerciseId: item.exerciseId,
          target: patch.target,
          fails: patch.fails,
        };
      }
    };

    if (pain) {
      if (item.ladder && (item.step ?? 1) > 1) {
        const back = (item.step ?? 1) - 1;
        const step = LADDERS[item.ladder].steps[back - 1];
        const bottom = step?.range[0] ?? lo;
        save({ step: back, target: bottom, fails: 0 });
        line(
          'pain',
          `Pain flagged. Stepped back to ${step?.name ?? 'the previous step'}, target ${unitWord(step ?? item, bottom)}. ${PHYSIO_NOTE}`,
        );
      } else {
        save({ target: lo, fails: 0 });
        line('pain', `Pain flagged. Target reset to ${unitWord(item, lo)}. ${PHYSIO_NOTE}`);
      }
      continue;
    }

    const rpeOk = rpe === undefined || rpe < 10;
    if (verdict.allHit && rpeOk && mode === 'normal') {
      if (target >= hi) {
        const steps = item.ladder ? LADDERS[item.ladder].steps : undefined;
        const nextStep = item.ladder && item.step !== undefined ? steps?.[item.step] : undefined;
        if (item.ladder && item.step !== undefined && nextStep) {
          save({ step: item.step + 1, target: nextStep.range[0], fails: 0 });
          unlocks.push({ ladder: item.ladder, step: item.step + 1, name: nextStep.name });
          line(
            'unlock',
            `Skill unlocked: ${nextStep.name}. Target ${unitWord(nextStep, nextStep.range[0])}.`,
          );
        } else {
          save({ target, fails: 0 });
          line('mastered', 'Mastered at the top of the range. Slow the tempo.');
        }
      } else {
        const to = Math.min(hi, target + inc);
        save({ target: to, fails: 0 });
        line('up', `Target up to ${unitWord(item, to)}.`);
      }
      continue;
    }

    if (verdict.missing || verdict.badSet) {
      const fails = current.fails + 1;
      if (fails >= FAILS_TO_EASE) {
        const to = Math.max(lo, target - 2 * inc);
        save({ target: to, fails: 0 });
        line('eased', `Missed twice. Eased to ${unitWord(item, to)}.`);
      } else {
        save({ target, fails });
        line(
          'miss',
          `Missed the target (${fails} of ${FAILS_TO_EASE}). Holding at ${unitWord(item, target)}.`,
        );
      }
      continue;
    }

    save({ target, fails: current.fails });
    const why =
      mode !== 'normal'
        ? ' Recovery mode never raises targets.'
        : !rpeOk
          ? ' RPE 10 means no headroom yet.'
          : '';
    line('hold', `Held at ${unitWord(item, target)}.${why}`);
  }

  return { ladders: nextLadders, exercises: nextEx, log, unlocks };
}
