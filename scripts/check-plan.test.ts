/**
 * Cross-checks src/data against the owner's source documents (brief §0, §6):
 *   docs/Calisthenics_Plan_Daily_Reference.docx  (cues, form guide, ladders)
 *   docs/Calisthenics_Tracker.xlsx               (Plan sheet, Lists level-up targets)
 * Reviewed differences are listed in EXCEPTIONS and PLAN.md §6.2. Run: npm run check:plan
 */
import { existsSync } from 'node:fs';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { beforeAll, describe, expect, it } from 'vitest';
import { anyExercise, LADDERS } from '@/data/ladders';
import { PLAN, WARMUP, type PlanItem } from '@/data/plan';
import { trackerUnit } from '@/data/exercises';

const DOCX = 'docs/Calisthenics_Plan_Daily_Reference.docx';
const XLSX_PATH = 'docs/Calisthenics_Tracker.xlsx';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Reviewed, intentional differences (PLAN.md §6.2). */
const EXCEPTIONS = {
  /** Ladder ranges come from the ladder steps, not the day table. */
  ladderRanges: true,
  /** No Lists target, but the brief gives them a range, so they progress. */
  progressWithoutListsTarget: ['Sprawl', 'Bear crawl'],
  /** Friday's circuit is rounds, not sets; its rests are "0-15 sec" between moves. */
  circuitDay: 'Friday',
  /** Wording changed on purpose: the docx says "3 x 15", the app levels up on every prescribed set. */
  howToEdited: ['push-5'],
};

type Row = (string | number)[];
let planRows: Row[] = [];
let lists = new Map<string, { unit: string; target: number | null }>();
let docText = '';

const nameOf = (it: PlanItem) =>
  'ladder' in it.ref
    ? LADDERS[it.ref.ladder].trackerName
    : anyExercise(it.ref.exercise).trackerName;
const restSeconds = (s: string) => {
  if (s.trim() === '-') return 0;
  const m = /(\d+)(?:-(\d+))?\s*(sec|min)/.exec(s);
  if (!m) return NaN;
  const n = Number(m[2] ?? m[1]);
  return m[3] === 'min' ? n * 60 : n;
};
const leadingSets = (dose: string) => Number(/^(\d+)\s*(?:rounds\s*)?x/.exec(dose)?.[1] ?? 1);
const bottomOf = (dose: string) => Number(/x\s*(\d+)/.exec(dose)?.[1] ?? NaN);

const hasDocs = existsSync(DOCX) && existsSync(XLSX_PATH);

function must<T>(v: T | undefined, what: string): T {
  if (v === undefined) throw new Error(`Missing ${what}`);
  return v;
}

describe.skipIf(!hasDocs)('plan data matches the source documents', () => {
  beforeAll(async () => {
    const wb = XLSX.readFile(XLSX_PATH);
    const sheet = (n: string) =>
      XLSX.utils.sheet_to_json<Row>(must(wb.Sheets[n], n), {
        header: 1,
        blankrows: false,
        defval: '',
      });
    planRows = sheet('Plan').filter(
      (r) => typeof r[0] === 'string' && (DAYS.includes(r[0]) || r[0] === 'Every day'),
    );
    lists = new Map(
      sheet('Lists')
        .slice(1)
        .filter((r) => r[0])
        .map((r) => [
          String(r[0]),
          { unit: String(r[1]), target: r[2] === '' ? null : Number(r[2]) },
        ]),
    );
    docText = (await mammoth.extractRawText({ path: DOCX })).value;
  });

  it('has the warm-up in the tracker order, with the docx "what it fixes" text', () => {
    const rows = planRows.filter((r) => r[0] === 'Every day');
    expect(rows.map((r) => r[3])).toEqual(WARMUP.map((w) => anyExercise(w.exerciseId).trackerName));
    for (const w of WARMUP) expect(docText).toContain(w.fixes);
  });

  for (const [i, dayName] of DAYS.entries()) {
    it(`matches ${dayName}: names, order, sets, rests, doses, cues`, () => {
      const rows = planRows.filter((r) => r[0] === dayName);
      const day = must(PLAN[i], dayName);
      expect(rows.map((r) => r[3])).toEqual(day.items.map(nameOf));
      for (const [n, it] of day.items.entries()) {
        const row = must(rows[n], `${dayName} row ${n + 1}`);
        const dose = String(row[4]);
        const rest = String(row[5]);
        expect(it.doc, `${nameOf(it)} dose`).toBe(dose);
        const cue =
          'ladder' in it.ref ? LADDERS[it.ref.ladder].cue : anyExercise(it.ref.exercise).cue;
        expect(docText, `${nameOf(it)} cue`).toContain(cue);
        if (dayName === EXCEPTIONS.circuitDay) continue;
        expect(it.rest, `${nameOf(it)} rest`).toBe(restSeconds(rest));
        expect(it.sets, `${nameOf(it)} sets`).toBe(leadingSets(dose));
        if (it.range && !('ladder' in it.ref))
          expect(it.range[0], `${nameOf(it)} range bottom`).toBe(bottomOf(dose));
      }
    });
  }

  it('tops every progressing range at the tracker Lists level-up target', () => {
    for (const day of PLAN) {
      for (const it of day.items) {
        if ('ladder' in it.ref) continue;
        const def = anyExercise(it.ref.exercise);
        const entry = lists.get(def.trackerName);
        if (!entry) continue;
        expect(entry.unit, `${def.trackerName} unit`).toBe(trackerUnit(def));
        if (!it.progresses) continue;
        if (entry.target === null) {
          expect(
            EXCEPTIONS.progressWithoutListsTarget,
            `${def.trackerName} has no Lists target`,
          ).toContain(def.trackerName);
        } else {
          expect(it.range?.[1], `${def.trackerName} range top`).toBe(entry.target);
        }
      }
    }
  });

  it('matches the ladder level-up targets in the docx and tracker', () => {
    expect(
      LADDERS.push.steps
        .slice(1)
        .every((s) => s.range[1] === lists.get(LADDERS.push.trackerName)?.target),
    ).toBe(true);
    expect(
      LADDERS.squat.steps
        .slice(0, 2)
        .every((s) => s.range[1] === lists.get(LADDERS.squat.trackerName)?.target),
    ).toBe(true);
    const pull = LADDERS.pull.steps.map((st) => st.range[1]);
    expect(pull[0]).toBe(40);
    expect(docText).toContain('hang 40 sec, scapular 3 x 10, negatives 3 x 5, assisted 3 x 8');
    expect(pull.slice(1, 4)).toEqual([10, 5, 8]);
    expect(docText).toContain('3 x 10 per side for split squats');
    expect(LADDERS.squat.steps[3]?.range[1]).toBe(10);
  });

  it('takes every form-guide step and ladder description from the docx', () => {
    for (const day of PLAN) {
      for (const it of day.items) {
        if ('ladder' in it.ref) continue;
        for (const step of anyExercise(it.ref.exercise).howTo)
          expect(docText, it.ref.exercise).toContain(step);
      }
    }
    for (const w of WARMUP)
      for (const step of anyExercise(w.exerciseId).howTo) expect(docText).toContain(step);
    for (const l of Object.values(LADDERS)) {
      for (const step of l.howTo) expect(docText).toContain(step);
      for (const s of l.steps) {
        if (EXCEPTIONS.howToEdited.includes(s.id)) continue;
        expect(docText, s.id).toContain(s.howTo);
      }
    }
  });
});
