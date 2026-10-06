import { describe, expect, it } from 'vitest';
import { adherence7, heatmap, missedTitles } from './adherence';
import { day, quest, recordMap } from './testkit';

describe('adherence and record', () => {
  it('averages the last 7 finished days from joining', () => {
    const r = recordMap(
      day('2026-10-08', 10, 10, { closed: true, ratio: 1 }),
      day('2026-10-09', 5, 10, { closed: true, ratio: 0.5 }),
    );
    expect(adherence7('2026-10-10', r, '2026-10-08')).toBe(0.75);
    expect(adherence7('2026-10-10', r, '2026-10-10')).toBeNull();
  });

  it('lays out 12 Monday-first weeks ending this week', () => {
    const cells = heatmap(
      '2026-10-07',
      recordMap(day('2026-10-06', 9, 10, { closed: true, ratio: 0.9 })),
      '2026-10-05',
    );
    expect(cells).toHaveLength(84);
    expect(cells[0]?.date).toBe('2026-07-20');
    expect(cells[83]?.date).toBe('2026-10-11');
    const byDate = new Map(cells.map((c) => [c.date, c]));
    expect(byDate.get('2026-10-04')?.ratio).toBeNull();
    expect(byDate.get('2026-10-05')?.ratio).toBe(0);
    expect(byDate.get('2026-10-06')).toMatchObject({ ratio: 0.9, done: 9, total: 10 });
    expect(byDate.get('2026-10-07')).toMatchObject({ ratio: null, today: true });
    expect(byDate.get('2026-10-08')?.ratio).toBeNull();
  });

  it('lists missed quests from the last week, most frequent first', () => {
    const r = recordMap(
      {
        ...day('2026-10-08', 0, 0),
        quests: [
          quest('habit:read', false, { habitId: 'read' }),
          quest('habit:water', false, { habitId: 'water' }),
        ],
      },
      {
        ...day('2026-10-09', 0, 0),
        quests: [
          quest('habit:read', false, { habitId: 'read' }),
          quest('ai:x', false, { kind: 'ai' }),
        ],
      },
    );
    expect(missedTitles('2026-10-10', r)).toEqual([
      { title: 'read', count: 2 },
      { title: 'water', count: 1 },
    ]);
  });
});
