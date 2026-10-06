import { describe, expect, it } from 'vitest';
import { CSV_HEADER, sessionsToCsv } from './csv';
import type { Session } from './types';

const session: Session = {
  id: 's1',
  date: '2026-10-05',
  planDay: 0,
  name: 'Push + Core',
  mode: 'recover',
  quick: false,
  deload: false,
  warmupDone: true,
  warmup: [true, true, true, true, true, true],
  xp: 100,
  log: [],
  entries: [
    {
      key: 'a',
      exerciseId: 'push-2',
      name: 'Incline push-up',
      unit: 'reps',
      side: false,
      target: 8,
      sets: [8, 8, 7, null],
      rpe: 8,
      pain: false,
    },
    {
      key: 'b',
      exerciseId: 'side-plank',
      name: 'Side plank',
      unit: 'sec',
      side: true,
      target: 20,
      sets: [20, 20, 25],
      pain: true,
    },
    {
      key: 'c',
      exerciseId: 'dips',
      name: 'Bench / chair dips',
      unit: 'reps',
      side: false,
      target: 8,
      sets: [null, null, null],
      pain: false,
    },
  ],
};
const sat: Session = {
  ...session,
  id: 's2',
  date: '2026-10-10',
  mode: 'normal',
  entries: [
    {
      key: 'x',
      exerciseId: 'shadowboxing',
      name: 'Shadowboxing',
      unit: 'sec',
      side: false,
      target: 180,
      sets: [180, 180, null],
      pain: false,
    },
  ],
};

describe('tracker CSV', () => {
  it('uses the tracker Log columns and dropdown names', () => {
    const lines = sessionsToCsv([sat, session]).trim().split('\n');
    expect(lines[0]).toBe(CSV_HEADER.join(','));
    expect(lines[1]).toBe(
      '2026-10-05,Mon,Push-up (any variation),Incline push-up,reps,8,8,7,,,8,Recovery mode',
    );
    expect(lines[2]).toBe('2026-10-05,Mon,Side plank,,sec / side,20,20,25,,,,Pain; Recovery mode');
    expect(lines[3]).toBe('2026-10-10,Sat,Shadowboxing (3 min rounds),,rounds,2,,,,,,');
    expect(lines).toHaveLength(4);
  });

  it('labels the lateral walk in steps per side', () => {
    const plank = session.entries[1];
    if (!plank) throw new Error('fixture');
    const s = { ...session, entries: [{ ...plank, exerciseId: 'lateral-walk' }] };
    expect(sessionsToCsv([s]).split('\n')[1]).toContain(
      'Lateral walk (band or bodyweight),,steps / side',
    );
  });
});
