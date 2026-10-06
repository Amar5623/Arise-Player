/**
 * The Gate in progress. Lives in IndexedDB so a reload or a phone call mid-set loses nothing.
 */
import { WARMUP } from '@/data/plan';
import type { ISODate } from '@/engine/types';
import { repo } from '@/db/repos';
import type { LoggedSet } from './gate';

export interface GateDraft {
  date: ISODate;
  warmup: boolean[];
  logged: Record<string, LoggedSet>;
  /** 0 = warm-up, 1..n = exercises in order. */
  index: number;
  restEndsAt: number | null;
  restTotal: number;
}

export const draftKey = (date: ISODate) => `gate:${date}`;

export const emptyDraft = (date: ISODate): GateDraft => ({
  date,
  warmup: WARMUP.map(() => false),
  logged: {},
  index: 0,
  restEndsAt: null,
  restTotal: 0,
});

export async function getDraft(date: ISODate): Promise<GateDraft> {
  return (await repo.meta.get<GateDraft>(draftKey(date))) ?? emptyDraft(date);
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Read-modify-write, serialised: a set tap and the rest timer it starts are two patches fired
 * together, and the second must see the first.
 */
export function patchDraft(
  date: ISODate,
  patch: Partial<GateDraft> | ((d: GateDraft) => Partial<GateDraft>),
): Promise<GateDraft> {
  const run = queue.then(async () => {
    const cur = await getDraft(date);
    const next = { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) };
    await repo.meta.set(draftKey(date), next);
    return next;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function clearDraft(date: ISODate): Promise<void> {
  await repo.meta.set(draftKey(date), null);
}
