import { anyExercise, ladderExercise, LADDERS } from '@/data/ladders';
import { planDay, RECOVERY_FLOW, WARMUP, WARMUP_MINUTES, type PlanItem } from '@/data/plan';
import { isDeloadWeek, programWeek, weekday } from '@/lib/dates';
import type {
  Condition,
  ExerciseProgress,
  ISODate,
  LadderKey,
  LadderProgress,
  SessionMode,
  Stat,
  Unit,
} from './types';

export interface PrescribedItem {
  key: string;
  /** 1-based position in today's order. */
  order: number;
  exerciseId: string;
  name: string;
  trackerName: string;
  /** Ladder step name for ladder items. */
  variation?: string;
  ladder?: LadderKey;
  step?: number;
  unit: Unit;
  perSide: boolean;
  steps: boolean;
  stat: Stat;
  sets: number;
  target: number;
  /** Progressing range; absent for fixed items. */
  range?: readonly [number, number];
  rest: number;
  progresses: boolean;
  cue: string;
  doc: string;
}

export interface Prescription {
  date: ISODate;
  /** 0 = Monday … 5 = Saturday; 6 = rest day. */
  planDay: number;
  name: string;
  goal: string;
  week: number;
  deload: boolean;
  mode: SessionMode;
  condition: Condition;
  quick: boolean;
  rest: boolean;
  /** Circuit days: rounds, and rest after each round. */
  rounds?: number;
  restAfterRound?: number;
  items: PrescribedItem[];
  notes: string[];
  estMinutes: number;
}

export interface PrescribeInput {
  date: ISODate;
  programStart: ISODate;
  condition: Condition;
  quick: boolean;
  ladders: Record<LadderKey, LadderProgress>;
  exercises: Readonly<Record<string, ExerciseProgress | undefined>>;
}

export const RPE_CAP_NOTE = 'Recovery mode: keep every set at RPE 7 or below.';

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** −1 set, but never below 2 (a 1- or 2-set item keeps its sets). */
export const minusOneSet = (sets: number) => (sets <= 2 ? sets : sets - 1);

/** Rough time for a session, rounded to 5 minutes. */
function estimate(items: readonly PrescribedItem[]): number {
  let seconds = WARMUP_MINUTES * 60;
  for (const it of items) {
    const sides = it.perSide ? 2 : 1;
    const work = it.unit === 'sec' ? it.target * sides : it.target * 3 * sides;
    seconds += it.sets * (work + it.rest);
  }
  return Math.max(10, Math.round(seconds / 300) * 5);
}

function resolve(
  item: PlanItem,
  order: number,
  day: number,
  input: PrescribeInput,
): PrescribedItem {
  if ('ladder' in item.ref) {
    const key = item.ref.ladder;
    const lp = input.ladders[key];
    const ex = ladderExercise(key, lp.step);
    const [lo, hi] = LADDERS[key].steps[lp.step - 1]?.range ?? [lp.target, lp.target];
    const stored = clamp(lp.target, lo, hi);
    return {
      key: `d${day}-${order}`,
      order,
      exerciseId: ex.id,
      name: ex.name,
      trackerName: ex.trackerName,
      variation: ex.variation,
      ladder: key,
      step: lp.step,
      unit: ex.unit,
      perSide: ex.perSide,
      steps: false,
      stat: ex.stat,
      sets: item.sets,
      target: item.cap !== undefined ? Math.min(stored, item.cap) : stored,
      range: item.progresses ? [lo, hi] : undefined,
      rest: item.rest,
      progresses: item.progresses,
      cue: ex.cue,
      doc: item.doc,
    };
  }
  const ex = anyExercise(item.ref.exercise);
  const range = item.range;
  const stored = input.exercises[ex.id]?.target;
  const target = range ? clamp(stored ?? range[0], range[0], range[1]) : (item.fixed ?? 0);
  return {
    key: `d${day}-${order}`,
    order,
    exerciseId: ex.id,
    name: ex.name,
    trackerName: ex.trackerName,
    unit: ex.unit,
    perSide: ex.perSide,
    steps: ex.steps ?? false,
    stat: ex.stat,
    sets: item.sets,
    target,
    range: item.progresses ? range : undefined,
    rest: item.rest,
    progresses: item.progresses && !!range,
    cue: ex.cue,
    doc: item.doc,
  };
}

/** Today's Gate (brief §7 Prescription). */
export function prescribe(input: PrescribeInput): Prescription {
  const day = weekday(input.date);
  const week = programWeek(input.programStart, input.date);
  const deload = isDeloadWeek(week);
  const plan = planDay(day);
  const mode: SessionMode =
    input.condition === 'INJURED'
      ? 'injured'
      : input.condition === 'FATIGUED'
        ? 'recover'
        : 'normal';
  const base = {
    date: input.date,
    planDay: day,
    week,
    deload,
    mode,
    condition: input.condition,
    quick: input.quick,
  };

  if (!plan) {
    return {
      ...base,
      name: 'Rest + walk',
      goal: 'Walk 30-40 min. Sleep 7-8 hours. Prep your Monday.',
      rest: true,
      items: [],
      notes: [],
      estMinutes: 0,
    };
  }

  if (mode === 'injured') {
    const items = RECOVERY_FLOW.map((it, i) => resolve(it, i + 1, day, input));
    return {
      ...base,
      name: 'Recovery flow',
      goal: 'Warm-up and gentle mobility only. Stop anything that hurts.',
      rest: false,
      items,
      notes: [
        'Condition: injured. Warm-up and mobility only; the Gate still clears.',
        'If pain persists, see a physio.',
      ],
      estMinutes: estimate(items),
    };
  }

  const circuit = plan.rounds !== undefined;
  const rounds = circuit
    ? input.quick
      ? (plan.quickRounds ?? plan.rounds)
      : plan.rounds
    : undefined;
  const chosen = plan.items
    .map((it, i) => ({ it, n: i + 1 }))
    .filter(({ n }) => !input.quick || plan.quick.includes(n));

  // While the pull ladder is still on Dead hang, Wednesday's separate dead-hang block repeats it.
  const pullOnHang = input.ladders.pull.step === 1;
  const deduped = chosen.filter(
    ({ it }) =>
      !(day === 2 && pullOnHang && 'exercise' in it.ref && it.ref.exercise === 'dead-hang'),
  );

  const items = deduped.map(({ it }, i) => {
    const p = resolve(it, i + 1, day, input);
    let sets = p.sets;
    if (circuit && rounds !== undefined && p.sets > 1) sets = rounds;
    if (input.quick && it.quickSets !== undefined) sets = it.quickSets;
    if (!circuit) {
      if (deload) sets = minusOneSet(sets);
      if (mode === 'recover') sets = minusOneSet(sets);
    }
    return { ...p, sets };
  });

  const notes: string[] = [];
  if (deload) notes.push(`Deload week ${week}: one fewer set on each exercise.`);
  if (mode === 'recover') notes.push(RPE_CAP_NOTE);
  if (circuit) notes.push('Logged only. Circuit sets never change your targets.');
  if (input.quick) notes.push('Short on time: warm-up plus the core of today’s Gate.');

  return {
    ...base,
    name: plan.name,
    goal: plan.goal,
    rest: false,
    rounds,
    restAfterRound: plan.restAfterRound,
    items,
    notes,
    estMinutes: estimate(items),
  };
}

export const WARMUP_ITEMS = WARMUP;
