import { describe, expect, it } from 'vitest';
import { parseReport } from './report';

describe('weekly report parsing', () => {
  it('splits the four sections and strips bullets', () => {
    const r = parseReport(
      'STATUS\nLevel 12, D-rank.\n\n## STRENGTHS:\n- Training 6/6\n* Reading held\nWEAK POINTS\n- Water 3/7\nNEXT WEEK\n- Water before 11:00',
    );
    expect(r.map((s) => s.heading)).toEqual(['STATUS', 'STRENGTHS', 'WEAK POINTS', 'NEXT WEEK']);
    expect(r[1]?.lines).toEqual(['Training 6/6', 'Reading held']);
  });

  it('files text before any heading under STATUS', () => {
    expect(parseReport('Good week.')).toEqual([{ heading: 'STATUS', lines: ['Good week.'] }]);
  });
});
