/**
 * Skill ladders. Each step is its own exercise with its own range; level up when every
 * prescribed set reaches the top of the range (brief §6, docx "Progression ladders").
 */
import type { LadderKey, Stat, Unit } from '@/engine/types';
import { exercise, type ExerciseDef } from './exercises';

export interface LadderStep {
  /** Exercise id for this step, e.g. 'push-2'. */
  id: string;
  name: string;
  range: readonly [number, number];
  unit: Unit;
  perSide: boolean;
  howTo: string;
}

export interface LadderDef {
  key: LadderKey;
  name: string;
  /** Exact tracker exercise name; the step name goes in "Variation used". */
  trackerName: string;
  stat: Stat;
  cue: string;
  /** Shared form guide for the movement family. */
  howTo: readonly string[];
  steps: readonly LadderStep[];
}

const PUSH_HOW = [
  'Hands just outside shoulder width, elbows about 45 degrees from the body (not flared to 90).',
  'Squeeze glutes and abs so the body is one straight line. No sagging hips (this also trains your pelvic tilt fix).',
  'Lower the chest to just above the floor.',
  'Push the floor away and spread the shoulder blades at the top.',
];
const SQUAT_HOW = [
  'Feet shoulder width, toes turned out only about 10-15 degrees (do not force straight, do not let them duck out).',
  'Press big toe, little toe and heel evenly into the floor with the arch lifted.',
  'Push knees out so they track over the 2nd-3rd toes. This directly fights knock knees.',
  'Chest up, ribs down, do not let the lower back over-arch at the bottom.',
];
const PULL_HOW = [
  'Start every rep by pulling shoulder blades down and back (not shrugging up).',
  'Lead with the chest towards the bar, chin over the bar at the top.',
  'Lower slowly for 3 seconds to a full hang.',
  'No swinging or kipping. Use the ladder step you can do clean.',
];

export const LADDERS: Record<LadderKey, LadderDef> = {
  push: {
    key: 'push',
    name: 'Push-up',
    trackerName: 'Push-up (any variation)',
    stat: 'STR',
    cue: 'Elbows 45 degrees, glutes and abs tight.',
    howTo: PUSH_HOW,
    steps: [
      {
        id: 'push-1',
        name: 'Wall push-up',
        range: [8, 15],
        unit: 'reps',
        perSide: false,
        howTo:
          "Arm's length from a wall, hands at chest height. Bend elbows to bring chest to the wall, body in one line.",
      },
      {
        id: 'push-2',
        name: 'Incline push-up',
        range: [6, 15],
        unit: 'reps',
        perSide: false,
        howTo:
          'Hands on a sturdy table or bench. Lower the surface over time (lower = harder). Body straight, glutes tight.',
      },
      {
        id: 'push-3',
        name: 'Knee push-up',
        range: [6, 15],
        unit: 'reps',
        perSide: false,
        howTo: 'Knees on the floor, straight line from knees to head. No sagging or piking hips.',
      },
      {
        id: 'push-4',
        name: 'Full push-up',
        range: [6, 15],
        unit: 'reps',
        perSide: false,
        howTo:
          'Toes down, elbows about 45 degrees, glutes and abs tight, chest just above the floor.',
      },
      {
        id: 'push-5',
        name: 'Decline / diamond push-up',
        range: [6, 15],
        unit: 'reps',
        perSide: false,
        howTo:
          'Feet raised on a step, or hands close under the chest. Only after full push-ups are clean at the top of the range.',
      },
    ],
  },
  squat: {
    key: 'squat',
    name: 'Squat',
    trackerName: 'Squat (any variation)',
    stat: 'STR',
    cue: 'Knees over 2nd-3rd toe, arch lifted.',
    howTo: SQUAT_HOW,
    steps: [
      {
        id: 'squat-1',
        name: 'Box squat',
        range: [10, 15],
        unit: 'reps',
        perSide: false,
        howTo: 'Sit back to a chair, touch lightly, stand without rocking. Knees over toes.',
      },
      {
        id: 'squat-2',
        name: 'Bodyweight squat',
        range: [10, 15],
        unit: 'reps',
        perSide: false,
        howTo: 'Feet shoulder-width, sit between the heels to full depth, knees track over the toes.',
      },
      {
        id: 'squat-3',
        name: 'Tempo squat (3-1-1)',
        range: [8, 15],
        unit: 'reps',
        perSide: false,
        howTo: '3 seconds down, 1 second pause at the bottom, then up.',
      },
      {
        id: 'squat-4',
        name: 'Split squat',
        range: [8, 10],
        unit: 'reps',
        perSide: true,
        howTo: 'Staggered stance, drop the back knee straight down, front knee over toes.',
      },
      {
        id: 'squat-5',
        name: 'Bulgarian split squat',
        range: [8, 10],
        unit: 'reps',
        perSide: true,
        howTo: 'Rear foot on a bench, front foot far enough forward for good knee tracking.',
      },
      {
        id: 'squat-6',
        name: 'Assisted pistol / shrimp squat',
        range: [3, 8],
        unit: 'reps',
        perSide: true,
        howTo: 'Single-leg to full depth. Hold a pole or door frame first, try a box pistol.',
      },
    ],
  },
  pull: {
    key: 'pull',
    name: 'Pull',
    trackerName: 'Pull progression (any variation)',
    stat: 'STR',
    cue: 'Shoulder blades down first, chest to the bar.',
    howTo: PULL_HOW,
    steps: [
      {
        id: 'pull-1',
        name: 'Dead hang',
        range: [20, 40],
        unit: 'sec',
        perSide: false,
        howTo: 'Overhand grip, shoulders slightly active, ribs down.',
      },
      {
        id: 'pull-2',
        name: 'Scapular pull-up',
        range: [6, 10],
        unit: 'reps',
        perSide: false,
        howTo:
          'From a hang, pull the shoulder blades down with straight arms. Hold 2-3 sec at the top.',
      },
      {
        id: 'pull-3',
        name: 'Negative pull-up',
        range: [2, 5],
        unit: 'reps',
        perSide: false,
        howTo: 'Jump or step to chin over the bar, then lower in 3-5 seconds to a full hang.',
      },
      {
        id: 'pull-4',
        name: 'Band-assisted pull-up',
        range: [4, 8],
        unit: 'reps',
        perSide: false,
        howTo:
          'Loop a band over the bar and under your knee or foot. Full range, chin over the bar.',
      },
      {
        id: 'pull-5',
        name: 'Full pull-up',
        range: [3, 10],
        unit: 'reps',
        perSide: false,
        howTo: 'Blades down first, chest to the bar, controlled lowering.',
      },
    ],
  },
};

export const LADDER_KEYS: readonly LadderKey[] = ['push', 'squat', 'pull'];

export function ladderStep(key: LadderKey, step: number): LadderStep {
  const steps = LADDERS[key].steps;
  const s = steps[Math.min(steps.length, Math.max(1, step)) - 1];
  if (!s) throw new Error(`No step ${step} on ${key}`);
  return s;
}

/** The ladder step as an exercise definition, for sessions and the tracker export. */
export function ladderExercise(
  key: LadderKey,
  step: number,
): ExerciseDef & { ladder: LadderKey; step: number; variation: string } {
  const l = LADDERS[key];
  const s = ladderStep(key, step);
  return {
    id: s.id,
    name: s.name,
    trackerName: l.trackerName,
    unit: s.unit,
    perSide: s.perSide,
    stat: l.stat,
    cue: l.cue,
    howTo: [s.howTo, ...l.howTo],
    ladder: key,
    step,
    variation: s.name,
  };
}

/** Resolves any exercise id, including ladder step ids like 'push-3'. */
export function anyExercise(id: string): ExerciseDef {
  const m = /^(push|squat|pull)-(\d)$/.exec(id);
  if (m) return ladderExercise(m[1] as LadderKey, Number(m[2]));
  return exercise(id);
}
