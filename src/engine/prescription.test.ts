import { describe, expect, it } from 'vitest';
import { minusOneSet, prescribe, RPE_CAP_NOTE, type PrescribeInput } from './prescription';
import { ladders, noExercises } from './testkit';

const START = '2026-10-05';
const MON = '2026-10-05';
const base = (over: Partial<PrescribeInput> = {}): PrescribeInput => ({
  date: MON,
  programStart: START,
  condition: 'OPTIMAL',
  quick: false,
  ladders: ladders(),
  exercises: noExercises,
  ...over,
});

describe('prescription', () => {
  it('builds Monday push + core in order', () => {
    const p = prescribe(base());
    expect(p.name).toBe('Push + Core');
    expect(p.items.map((i) => i.exerciseId)).toEqual([
      'push-2',
      'pike-push-up',
      'dips',
      'scapular-push-up',
      'plank',
      'hollow-hold',
    ]);
    expect(p.items.map((i) => i.sets)).toEqual([4, 3, 3, 2, 3, 3]);
    expect(p.items[0]?.order).toBe(1);
    expect(p.mode).toBe('normal');
    expect(p.estMinutes).toBeGreaterThanOrEqual(30);
  });

  it('clamps the stored target into the current range', () => {
    const hi = prescribe(
      base({
        ladders: ladders({ step: 2, target: 40 }),
        exercises: { plank: { exerciseId: 'plank', target: 90, fails: 0 } },
      }),
    );
    expect(hi.items[0]?.target).toBe(15);
    expect(hi.items.find((i) => i.exerciseId === 'plank')?.target).toBe(60);
    const lo = prescribe(base({ ladders: ladders({ step: 1, target: 2 }) }));
    expect(lo.items[0]?.target).toBe(8);
    expect(lo.items[0]?.name).toBe('Wall push-up');
  });

  it('defaults an unlogged exercise to the bottom of its range', () => {
    const p = prescribe(base());
    expect(p.items.find((i) => i.exerciseId === 'pike-push-up')?.target).toBe(6);
    expect(p.items.find((i) => i.exerciseId === 'scapular-push-up')).toMatchObject({
      target: 10,
      progresses: false,
    });
  });

  it('drops one set in deload weeks, never below 2', () => {
    const p = prescribe(base({ date: '2026-11-09' }));
    expect(p.week).toBe(6);
    expect(p.deload).toBe(true);
    expect(p.items.map((i) => i.sets)).toEqual([3, 2, 2, 2, 2, 2]);
    expect(minusOneSet(1)).toBe(1);
  });

  it('runs fatigued days in recovery mode with an RPE cap', () => {
    const p = prescribe(base({ condition: 'FATIGUED' }));
    expect(p.mode).toBe('recover');
    expect(p.items[0]?.sets).toBe(3);
    expect(p.notes).toContain(RPE_CAP_NOTE);
  });

  it('stacks deload and recovery, still at a minimum of 2', () => {
    const p = prescribe(base({ date: '2026-11-09', condition: 'FATIGUED' }));
    expect(p.items.map((i) => i.sets)).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it('replaces the day with warm-up and mobility when injured', () => {
    const p = prescribe(base({ condition: 'INJURED' }));
    expect(p.mode).toBe('injured');
    expect(p.items.map((i) => i.exerciseId)).toEqual([
      'hip-flexor-stretch',
      'hamstring-stretch',
      'thoracic-extension',
      'adductor-rock-back',
    ]);
    expect(p.items.every((i) => !i.progresses)).toBe(true);
    expect(p.rest).toBe(false);
  });

  it('keeps only the quick subset when short on time', () => {
    const mon = prescribe(base({ quick: true }));
    expect(mon.items.map((i) => i.exerciseId)).toEqual(['push-2', 'pike-push-up', 'hollow-hold']);
    expect(mon.items.map((i) => i.order)).toEqual([1, 2, 3]);
    const wed = prescribe(base({ date: '2026-10-07', quick: true }));
    expect(wed.items.map((i) => i.exerciseId)).toEqual(['pull-2', 'inverted-row', 'knee-raise']);
    const thu = prescribe(base({ date: '2026-10-08', quick: true }));
    expect(thu.items.map((i) => i.exerciseId)).toEqual([
      'sl-glute-bridge',
      'sl-rdl',
      'deep-squat-hold',
    ]);
    const sat = prescribe(base({ date: '2026-10-10', quick: true }));
    expect(sat.items.map((i) => [i.exerciseId, i.sets])).toEqual([
      ['shadowboxing', 2],
      ['sprawl', 3],
      ['bear-crawl', 3],
    ]);
  });

  it('drops Wednesday’s separate dead hang while the pull ladder is on Dead hang', () => {
    const onHang = prescribe(
      base({ date: '2026-10-07', ladders: ladders(undefined, undefined, { step: 1, target: 25 }) }),
    );
    expect(onHang.items.map((i) => i.exerciseId)).toEqual([
      'pull-1',
      'inverted-row',
      'prone-ytw',
      'knee-raise',
      'side-plank',
    ]);
    expect(onHang.items[0]?.unit).toBe('sec');
    const past = prescribe(base({ date: '2026-10-07' }));
    expect(past.items.map((i) => i.exerciseId)).toContain('dead-hang');
  });

  it('caps Friday circuit ladder items and never progresses them', () => {
    const p = prescribe(
      base({
        date: '2026-10-09',
        ladders: ladders({ step: 4, target: 13 }, { step: 2, target: 15 }, { step: 2, target: 9 }),
      }),
    );
    expect(p.rounds).toBe(3);
    expect(p.restAfterRound).toBe(90);
    expect(p.items.slice(0, 4).map((i) => [i.exerciseId, i.target, i.sets])).toEqual([
      ['push-4', 10, 3],
      ['squat-2', 15, 3],
      ['pull-2', 8, 3],
      ['hollow-hold', 20, 3],
    ]);
    expect(p.items.every((i) => !i.progresses)).toBe(true);
    const quick = prescribe(base({ date: '2026-10-09', quick: true }));
    expect(quick.rounds).toBe(2);
    expect(quick.items[0]?.sets).toBe(2);
    expect(quick.items[4]?.sets).toBe(1);
  });

  it('leaves the circuit alone in deload weeks', () => {
    const p = prescribe(base({ date: '2026-11-13' }));
    expect(p.deload).toBe(true);
    expect(p.items[0]?.sets).toBe(3);
  });

  it('marks Sunday as a rest day', () => {
    const p = prescribe(base({ date: '2026-10-11' }));
    expect(p.rest).toBe(true);
    expect(p.items).toEqual([]);
  });
});
