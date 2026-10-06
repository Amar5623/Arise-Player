import { describe, expect, it } from 'vitest';
import { cleanReport, extractJson, sanitizeQuests } from './schema';

describe('AI output sanitizing', () => {
  it('clamps XP, trims titles to 6 words, fixes stats and drops duplicates of today', () => {
    const r = sanitizeQuests(
      {
        message: '**Weak point: water.** — drink up',
        quests: [
          {
            title: 'Drink 500 ml water before every single meal today',
            detail: 'Three glasses',
            stat: 'vit',
            xp: 99,
          },
          { title: 'Read 15 pages', detail: 'dup', stat: 'INT', xp: 10 },
          { title: 'Ten-minute hip mobility flow', detail: 'Cat-cow, 90/90', stat: 'XYZ', xp: 1 },
        ],
      },
      ['Read 15 pages'],
    );
    expect(r.message).toBe('Weak point: water. - drink up');
    expect(r.quests).toEqual([
      { title: 'Drink 500 ml water before every', detail: 'Three glasses', stat: 'VIT', xp: 30 },
      { title: 'Ten-minute hip mobility flow', detail: 'Cat-cow, 90/90', stat: 'INT', xp: 5 },
    ]);
  });

  it('finds JSON inside a fenced or chatty reply', () => {
    expect(extractJson('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(() => extractJson('no json here')).toThrow();
  });

  it('strips code fences from reports', () => {
    expect(cleanReport('```\nSTATUS\n- ok\n```')).toBe('STATUS\n- ok');
  });
});
