import { z } from 'zod';

export const STATS = ['STR', 'AGI', 'VIT', 'INT', 'CHA', 'WLT'] as const;

export const RequestSchema = z.object({
  type: z.enum(['quests', 'report']),
  context: z.record(z.string(), z.unknown()),
});

/** What the model is asked for. Lenient here; sanitize() enforces the limits. */
export const QuestsReply = z.object({
  message: z.string(),
  quests: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        stat: z.string(),
        xp: z.number(),
      }),
    )
    .min(1),
});

export interface CleanQuest {
  title: string;
  detail: string;
  stat: (typeof STATS)[number];
  xp: number;
}

const noControl = (s: string) =>
  Array.from(s, (c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? ' ' : c)).join('');

const clean = (s: string, max: number) =>
  noControl(s)
    .replace(/[*_`#>]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();

/** Clamp and sanitize on the server: titles ≤ 6 words, XP 5-30, valid stat, no duplicates of today. */
export function sanitizeQuests(
  reply: z.infer<typeof QuestsReply>,
  existing: readonly string[],
): { message: string; quests: CleanQuest[] } {
  const seen = new Set(existing.map((t) => t.toLowerCase()));
  const quests: CleanQuest[] = [];
  for (const q of reply.quests) {
    const title = clean(q.title, 80).split(' ').slice(0, 6).join(' ');
    const stat = (STATS as readonly string[]).includes(q.stat.toUpperCase())
      ? (q.stat.toUpperCase() as CleanQuest['stat'])
      : 'INT';
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    quests.push({
      title,
      detail: clean(q.detail, 140),
      stat,
      xp: Math.round(Math.min(30, Math.max(5, Number.isFinite(q.xp) ? q.xp : 10))),
    });
    if (quests.length === 4) break;
  }
  return { message: clean(reply.message, 140) || 'Bonus quests issued.', quests };
}

/** Finds the JSON object in a reply that may carry a stray sentence or code fence. */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object');
  return JSON.parse(text.slice(start, end + 1));
}

export function cleanReport(text: string): string {
  return text
    .replace(/```[a-z]*\n?/g, '')
    .replace(/[–—]/g, '-')
    .trim()
    .slice(0, 3000);
}
