/**
 * The 6-day plan (brief §6, docx day tables, tracker Plan sheet). Ranges run from the docx
 * starting dose to the tracker's Lists level-up target; see PLAN.md §6.2 for the reviewed
 * exceptions. Days are 0 = Monday … 6 = Sunday.
 */
import type { LadderKey } from '@/engine/types';

export type PlanRef = { ladder: LadderKey } | { exercise: string };

export interface PlanItem {
  ref: PlanRef;
  sets: number;
  /** Seconds after each set (between moves in a circuit). */
  rest: number;
  /** Progressing range. Ladder items take the range of their current step. */
  range?: readonly [number, number];
  /** Fixed dose for items that never progress. */
  fixed?: number;
  /** Circuit cap on a ladder item: the best variation, up to this many. */
  cap?: number;
  /** False for circuit, mobility and fixed-range items. */
  progresses: boolean;
  /** Sets in short-on-time mode, when it differs (Saturday shadowboxing). */
  quickSets?: number;
  /** The docx dose, kept verbatim for the plan cross-check and the detail screen. */
  doc: string;
}

export interface PlanDay {
  day: number;
  name: string;
  focus: string;
  goal: string;
  items: readonly PlanItem[];
  /** 1-based item numbers kept in short-on-time mode. */
  quick: readonly number[];
  /** Circuit days: rounds, and rest after each round. */
  rounds?: number;
  quickRounds?: number;
  restAfterRound?: number;
}

export interface WarmupItem {
  exerciseId: string;
  dose: string;
  fixes: string;
}

/** Corrective warm-up, every training day (8 min). */
export const WARMUP: readonly WarmupItem[] = [
  { exerciseId: 'cat-cow', dose: '10 reps', fixes: 'Spine mobility, reduces lower-back stiffness' },
  {
    exerciseId: 'hip-flexor-stretch',
    dose: '45 s / side',
    fixes: 'Lengthens tight hip flexors (anterior pelvic tilt)',
  },
  {
    exerciseId: 'glute-bridge',
    dose: '2 × 12, 2 s squeeze',
    fixes: 'Wakes up glutes (pelvic tilt, knock knees)',
  },
  {
    exerciseId: 'short-foot',
    dose: '5 × 10 s / foot',
    fixes: 'Builds the arch, stops the foot collapsing (knock knees)',
  },
  {
    exerciseId: 'hip-switches',
    dose: '8 / side',
    fixes: 'Hip internal and external rotation balance (duck feet)',
  },
  {
    exerciseId: 'dead-bug',
    dose: '2 × 8 / side',
    fixes: 'Anti-extension core control (pelvic tilt)',
  },
];

export const WARMUP_MINUTES = 8;

const L = (ladder: LadderKey) => ({ ladder });
const X = (exercise: string) => ({ exercise });

export const PLAN: readonly PlanDay[] = [
  {
    day: 0,
    name: 'Push + Core',
    focus: 'Push + Core',
    goal: 'Chest, shoulders, triceps and anti-extension core.',
    quick: [1, 2, 6],
    items: [
      { ref: L('push'), sets: 4, rest: 90, progresses: true, doc: '4 x 6-12' },
      {
        ref: X('pike-push-up'),
        sets: 3,
        rest: 90,
        range: [6, 10],
        progresses: true,
        doc: '3 x 6-10',
      },
      { ref: X('dips'), sets: 3, rest: 60, range: [8, 12], progresses: true, doc: '3 x 8-12' },
      {
        ref: X('scapular-push-up'),
        sets: 2,
        rest: 45,
        fixed: 10,
        progresses: false,
        doc: '2 x 10',
      },
      { ref: X('plank'), sets: 3, rest: 45, range: [30, 60], progresses: true, doc: '3 x 30 sec' },
      {
        ref: X('hollow-hold'),
        sets: 3,
        rest: 45,
        range: [15, 30],
        progresses: true,
        doc: '3 x 15 sec',
      },
    ],
  },
  {
    day: 1,
    name: 'Legs: Squat + Glute Med',
    focus: 'Legs (squat pattern) + Glute med',
    goal: 'Squat strength, knee tracking and side-hip strength.',
    quick: [1, 2, 6],
    items: [
      { ref: L('squat'), sets: 4, rest: 90, progresses: true, doc: '4 x 10-15' },
      {
        ref: X('reverse-lunge'),
        sets: 3,
        rest: 60,
        range: [8, 12],
        progresses: true,
        doc: '3 x 8 / side',
      },
      {
        ref: X('side-lying-leg-raise'),
        sets: 3,
        rest: 45,
        range: [15, 20],
        progresses: true,
        doc: '3 x 15 / side',
      },
      {
        ref: X('lateral-walk'),
        sets: 3,
        rest: 45,
        fixed: 12,
        progresses: false,
        doc: '3 x 12 steps / side',
      },
      { ref: X('calf-raise'), sets: 3, rest: 45, range: [15, 20], progresses: true, doc: '3 x 15' },
      {
        ref: X('bird-dog'),
        sets: 3,
        rest: 45,
        range: [8, 12],
        progresses: true,
        doc: '3 x 8 / side',
      },
    ],
  },
  {
    day: 2,
    name: 'Pull + Core',
    focus: 'Pull + Core',
    goal: 'Back, biceps, grip and posture muscles.',
    quick: [1, 2, 5],
    items: [
      { ref: L('pull'), sets: 4, rest: 90, progresses: true, doc: '4 x 5-10' },
      {
        ref: X('inverted-row'),
        sets: 3,
        rest: 75,
        range: [8, 12],
        progresses: true,
        doc: '3 x 8-12',
      },
      {
        ref: X('dead-hang'),
        sets: 3,
        rest: 60,
        range: [20, 40],
        progresses: true,
        doc: '3 x 20-40 sec',
      },
      { ref: X('prone-ytw'), sets: 2, rest: 45, fixed: 10, progresses: false, doc: '2 x 10' },
      { ref: X('knee-raise'), sets: 3, rest: 45, range: [8, 12], progresses: true, doc: '3 x 8' },
      {
        ref: X('side-plank'),
        sets: 3,
        rest: 45,
        range: [20, 40],
        progresses: true,
        doc: '3 x 20 sec / side',
      },
    ],
  },
  {
    day: 3,
    name: 'Legs: Hinge + Mobility',
    focus: 'Legs (hinge, lateral hip) + Mobility',
    goal: 'Glutes, hamstrings, adductors and deep-squat mobility.',
    quick: [1, 2, 5],
    items: [
      {
        ref: X('sl-glute-bridge'),
        sets: 4,
        rest: 60,
        range: [8, 15],
        progresses: true,
        doc: '4 x 8-12 / side',
      },
      {
        ref: X('sl-rdl'),
        sets: 3,
        rest: 60,
        range: [8, 12],
        progresses: true,
        doc: '3 x 8 / side',
      },
      {
        ref: X('cossack-squat'),
        sets: 3,
        rest: 60,
        range: [6, 10],
        progresses: true,
        doc: '3 x 6 / side',
      },
      {
        ref: X('copenhagen-plank'),
        sets: 3,
        rest: 45,
        range: [15, 30],
        progresses: true,
        doc: '3 x 15 sec / side',
      },
      {
        ref: X('deep-squat-hold'),
        sets: 3,
        rest: 30,
        range: [45, 60],
        progresses: true,
        doc: '3 x 45 sec',
      },
      {
        ref: X('adductor-rock-back'),
        sets: 2,
        rest: 0,
        fixed: 10,
        progresses: false,
        doc: '2 x 10 / side',
      },
    ],
  },
  {
    day: 4,
    name: 'Full-Body Skill Circuit',
    focus: 'Full-body skill circuit',
    goal: 'Practise your best push, squat, pull and core. 3 rounds, minimal rest.',
    quick: [1, 2, 3, 4, 5, 6],
    rounds: 3,
    quickRounds: 2,
    restAfterRound: 90,
    items: [
      {
        ref: L('push'),
        sets: 3,
        rest: 15,
        cap: 10,
        progresses: false,
        doc: '8-10 (best variation)',
      },
      {
        ref: L('squat'),
        sets: 3,
        rest: 15,
        cap: 15,
        progresses: false,
        doc: '15 (best variation)',
      },
      { ref: L('pull'), sets: 3, rest: 15, cap: 8, progresses: false, doc: '8 (or inverted row)' },
      { ref: X('hollow-hold'), sets: 3, rest: 0, fixed: 20, progresses: false, doc: '20 sec' },
      {
        ref: X('hip-flexor-stretch'),
        sets: 1,
        rest: 0,
        fixed: 45,
        progresses: false,
        doc: '45 sec / side',
      },
      {
        ref: X('hamstring-stretch'),
        sets: 1,
        rest: 0,
        fixed: 45,
        progresses: false,
        doc: '30-45 sec / side',
      },
    ],
  },
  {
    day: 5,
    name: 'Combat Conditioning + Posture',
    focus: 'Combat conditioning + Posture flow',
    goal: 'Footwork, sprawls, trunk and a posture reset.',
    quick: [1, 2, 3],
    items: [
      {
        ref: X('shadowboxing'),
        sets: 3,
        rest: 60,
        fixed: 180,
        progresses: false,
        quickSets: 2,
        doc: '3 rounds x 3 min',
      },
      { ref: X('sprawl'), sets: 3, rest: 60, range: [8, 12], progresses: true, doc: '3 x 8' },
      {
        ref: X('bear-crawl'),
        sets: 3,
        rest: 45,
        range: [20, 40],
        progresses: true,
        doc: '3 x 20 sec',
      },
      {
        ref: X('thoracic-extension'),
        sets: 1,
        rest: 0,
        fixed: 8,
        progresses: false,
        doc: '8 slow reps',
      },
      {
        ref: X('hip-flexor-stretch'),
        sets: 1,
        rest: 0,
        fixed: 45,
        progresses: false,
        doc: '45 sec / side',
      },
    ],
  },
];

/** Sunday: rest. A walk quest, optional mobility. */
export const REST_DAY = {
  day: 6,
  name: 'Rest + walk',
  walk: 'Walk 30-40 min',
  walkDetail: '8-10k steps, easy pace.',
  optional: ['cat-cow', 'hip-flexor-stretch'],
} as const;

/** INJURED: warm-up plus this gentle flow, whatever the day. Nothing progresses. */
export const RECOVERY_FLOW: readonly PlanItem[] = [
  {
    ref: X('hip-flexor-stretch'),
    sets: 2,
    rest: 30,
    fixed: 45,
    progresses: false,
    doc: '2 x 45 sec / side',
  },
  {
    ref: X('hamstring-stretch'),
    sets: 2,
    rest: 30,
    fixed: 45,
    progresses: false,
    doc: '2 x 45 sec / side',
  },
  {
    ref: X('thoracic-extension'),
    sets: 1,
    rest: 0,
    fixed: 8,
    progresses: false,
    doc: '8 slow reps',
  },
  {
    ref: X('adductor-rock-back'),
    sets: 2,
    rest: 30,
    fixed: 10,
    progresses: false,
    doc: '2 x 10 / side',
  },
];

export function planDay(day: number): PlanDay | null {
  return PLAN.find((p) => p.day === day) ?? null;
}
