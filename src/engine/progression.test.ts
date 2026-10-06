import { describe, expect, it } from 'vitest';
import { prescribe, type PrescribedItem } from './prescription';
import { applyProgression, PHYSIO_NOTE, type LoggedItem } from './progression';
import { ladders, noExercises } from './testkit';
import type { ExerciseProgress, LadderKey, LadderProgress, SessionMode } from './types';

const MON = '2026-10-05';
type Ladders = Record<LadderKey, LadderProgress>;

function item(
  id: string,
  lads: Ladders = ladders(),
  ex: Record<string, ExerciseProgress | undefined> = noExercises,
  date = MON,
): PrescribedItem {
  const p = prescribe({
    date,
    programStart: MON,
    condition: 'OPTIMAL',
    quick: false,
    ladders: lads,
    exercises: ex,
  });
  const found = p.items.find((i) => i.exerciseId === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
}

const run = (
  logged: LoggedItem[],
  lads: Ladders = ladders(),
  ex: Record<string, ExerciseProgress | undefined> = noExercises,
  mode: SessionMode = 'normal',
) => applyProgression(mode, logged, lads, ex);

const all = (it: PrescribedItem, v: number) => Array.from({ length: it.sets }, () => v);

describe('double progression', () => {
  it('adds one rep when every set reaches the target', () => {
    const it0 = item('pike-push-up');
    const r = run([{ item: it0, sets: all(it0, 6), rpe: 8, pain: false }]);
    expect(r.exercises['pike-push-up']).toEqual({
      exerciseId: 'pike-push-up',
      target: 7,
      fails: 0,
    });
    expect(r.log[0]?.kind).toBe('up');
  });

  it('adds five seconds on holds', () => {
    const it0 = item('plank');
    const r = run([{ item: it0, sets: all(it0, 32), rpe: 8, pain: false }]);
    expect(r.exercises.plank?.target).toBe(35);
  });

  it('caps the target at the top of the range', () => {
    const ex = { plank: { exerciseId: 'plank', target: 58, fails: 0 } };
    const it0 = item('plank', ladders(), ex);
    const r = run([{ item: it0, sets: all(it0, 60), pain: false }], ladders(), ex);
    expect(r.exercises.plank?.target).toBe(60);
  });

  it('unlocks the next ladder step at the top of the range', () => {
    const lads = ladders({ step: 2, target: 15 });
    const it0 = item('push-2', lads);
    const r = run([{ item: it0, sets: all(it0, 15), rpe: 9, pain: false }], lads);
    expect(r.ladders.push).toEqual({ key: 'push', step: 3, target: 6, fails: 0 });
    expect(r.unlocks).toEqual([{ ladder: 'push', step: 3, name: 'Knee push-up' }]);
    expect(r.log[0]).toMatchObject({ kind: 'unlock' });
  });

  it('labels a cross-unit unlock and step-back in the new step’s unit', () => {
    const hang = ladders(undefined, undefined, { step: 1, target: 40 });
    const it0 = item('pull-1', hang, noExercises, '2026-10-07');
    const up = run([{ item: it0, sets: all(it0, 40), pain: false }], hang);
    expect(up.ladders.pull).toMatchObject({ step: 2, target: 6 });
    expect(up.log[0]?.text).toBe('Skill unlocked: Scapular pull-up. Target 6 reps.');
    const scap = ladders(undefined, undefined, { step: 2, target: 8 });
    const it1 = item('pull-2', scap, noExercises, '2026-10-07');
    const back = run([{ item: it1, sets: all(it1, 8), pain: true }], scap);
    expect(back.ladders.pull).toMatchObject({ step: 1, target: 20 });
    expect(back.log[0]?.text).toContain('target 20 s.');
  });

  it('calls the last ladder step mastered instead of unlocking', () => {
    const lads = ladders({ step: 5, target: 15 });
    const it0 = item('push-5', lads);
    const r = run([{ item: it0, sets: all(it0, 15), pain: false }], lads);
    expect(r.ladders.push.step).toBe(5);
    expect(r.unlocks).toEqual([]);
    expect(r.log[0]?.kind).toBe('mastered');
  });

  it('calls a non-ladder exercise at the top mastered', () => {
    const ex = { dips: { exerciseId: 'dips', target: 12, fails: 0 } };
    const it0 = item('dips', ladders(), ex);
    const r = run([{ item: it0, sets: all(it0, 12), pain: false }], ladders(), ex);
    expect(r.exercises.dips?.target).toBe(12);
    expect(r.log[0]?.text).toMatch(/slow the tempo/i);
  });

  it('holds at RPE 10', () => {
    const it0 = item('pike-push-up');
    const r = run([{ item: it0, sets: all(it0, 6), rpe: 10, pain: false }]);
    expect(r.exercises['pike-push-up']?.target).toBe(6);
    expect(r.log[0]?.kind).toBe('hold');
  });

  it('never raises targets in recovery mode', () => {
    const it0 = item('pike-push-up');
    const r = run(
      [{ item: it0, sets: all(it0, 10), rpe: 6, pain: false }],
      ladders(),
      noExercises,
      'recover',
    );
    expect(r.exercises['pike-push-up']?.target).toBe(6);
  });

  it('counts a fail for missing sets, and eases by two increments on the second', () => {
    const ex = { dips: { exerciseId: 'dips', target: 11, fails: 0 } };
    const it0 = item('dips', ladders(), ex);
    const first = run([{ item: it0, sets: [11, 11, null], pain: false }], ladders(), ex);
    expect(first.exercises.dips).toEqual({ exerciseId: 'dips', target: 11, fails: 1 });
    expect(first.log[0]?.kind).toBe('miss');
    const second = run(
      [{ item: it0, sets: [11, 10, null], pain: false }],
      ladders(),
      first.exercises,
    );
    expect(second.exercises.dips).toEqual({ exerciseId: 'dips', target: 9, fails: 0 });
    expect(second.log[0]?.kind).toBe('eased');
  });

  it('counts a fail for any set more than 2 reps under target', () => {
    const ex = { dips: { exerciseId: 'dips', target: 11, fails: 0 } };
    const it0 = item('dips', ladders(), ex);
    const r = run([{ item: it0, sets: [11, 11, 8], pain: false }], ladders(), ex);
    expect(r.exercises.dips?.fails).toBe(1);
  });

  it('holds without a fail when a set is short by 2 or less', () => {
    const ex = { dips: { exerciseId: 'dips', target: 11, fails: 1 } };
    const it0 = item('dips', ladders(), ex);
    const r = run([{ item: it0, sets: [11, 11, 9], pain: false }], ladders(), ex);
    expect(r.exercises.dips).toEqual({ exerciseId: 'dips', target: 11, fails: 1 });
    expect(r.log[0]?.kind).toBe('hold');
  });

  it('uses a 10 s margin on holds', () => {
    const ex = { plank: { exerciseId: 'plank', target: 45, fails: 0 } };
    const it0 = item('plank', ladders(), ex);
    expect(
      run([{ item: it0, sets: [45, 45, 36], pain: false }], ladders(), ex).exercises.plank?.fails,
    ).toBe(0);
    expect(
      run([{ item: it0, sets: [45, 45, 34], pain: false }], ladders(), ex).exercises.plank?.fails,
    ).toBe(1);
  });

  it('never eases below the bottom of the range', () => {
    const ex = { dips: { exerciseId: 'dips', target: 9, fails: 1 } };
    const it0 = item('dips', ladders(), ex);
    const r = run([{ item: it0, sets: [5, null, null], pain: false }], ladders(), ex);
    expect(r.exercises.dips?.target).toBe(8);
  });

  it('steps the ladder back one on pain, with a physio note', () => {
    const lads = ladders({ step: 3, target: 12 });
    const it0 = item('push-3', lads);
    const r = run([{ item: it0, sets: [12, 12, 12, 12], pain: true }], lads);
    expect(r.ladders.push).toEqual({ key: 'push', step: 2, target: 6, fails: 0 });
    expect(r.log[0]?.kind).toBe('pain');
    expect(r.log[0]?.text).toContain(PHYSIO_NOTE);
  });

  it('resets to the range bottom on pain at the first step or off-ladder', () => {
    const lads = ladders({ step: 1, target: 12 });
    const it0 = item('push-1', lads);
    expect(run([{ item: it0, sets: [12], pain: true }], lads).ladders.push).toMatchObject({
      step: 1,
      target: 8,
    });
    const ex = { dips: { exerciseId: 'dips', target: 11, fails: 1 } };
    const it1 = item('dips', ladders(), ex);
    expect(
      run([{ item: it1, sets: [11, 11, 11], pain: true }], ladders(), ex).exercises.dips,
    ).toEqual({ exerciseId: 'dips', target: 8, fails: 0 });
  });

  it('leaves skipped exercises alone', () => {
    const lads = ladders({ step: 2, target: 10 });
    const it0 = item('push-2', lads);
    const r = run([{ item: it0, sets: [null, null, null, null], pain: false }], lads);
    expect(r.ladders.push).toEqual(lads.push);
    expect(r.log[0]?.kind).toBe('skip');
  });

  it('never progresses fixed, circuit or mobility items', () => {
    const it0 = item('scapular-push-up');
    const r = run([{ item: it0, sets: [10, 10], pain: false }]);
    expect(r.exercises).toEqual({});
    expect(r.log).toEqual([]);
    const fri = item('push-2', ladders({ step: 2, target: 10 }), noExercises, '2026-10-09');
    const c = run([{ item: fri, sets: [10, 10, 10], pain: false }]);
    expect(c.ladders.push.target).toBe(8);
  });
});
