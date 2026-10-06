export type SystemTone = 'sys' | 'warn' | 'bad' | 'rare' | 'ok';

/** Header glyph. Rare events (unlocks, level-ups) gain; everything else is a notice. */
export const TONE_GLYPH: Record<SystemTone, string> = {
  sys: '!',
  warn: '!',
  bad: '!',
  ok: '!',
  rare: '+',
};
