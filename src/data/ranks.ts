import type { Rank } from '@/engine/types';

/** Rank tints: rank badge and gate header only. */
export const RANK_COLOR: Record<Rank, string> = {
  E: 'var(--color-ink-2)',
  D: 'var(--color-ok)',
  C: 'var(--color-agi)',
  B: 'var(--color-sys)',
  A: 'var(--color-rare)',
  S: 'var(--color-wlt)',
};
