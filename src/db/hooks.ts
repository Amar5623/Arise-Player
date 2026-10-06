/** Live reads for screens. Each re-renders when its tables change. */
import { useLiveQuery } from 'dexie-react-hooks';
import type { GateDraft } from '@/app/commands/draft';
import { summarizeXp } from '@/engine/levels';
import { prescribe } from '@/engine/prescription';
import type { ISODate } from '@/engine/types';
import { db } from './db';
import { repo } from './repos';

/** `undefined` while loading, `null` when there is no profile yet. */
export const useProfile = () => useLiveQuery(async () => (await repo.profile.get()) ?? null, []);
export const usePlayer = () => useLiveQuery(async () => (await repo.player.get()) ?? null, []);
export const useXpSummary = () => useLiveQuery(async () => summarizeXp(await db.xp.toArray()), []);
export const useXpEvents = () => useLiveQuery(() => db.xp.toArray(), []);
export const useDay = (date: ISODate) =>
  useLiveQuery(async () => (await db.days.get(date)) ?? null, [date]);
export const useDays = () => useLiveQuery(() => repo.days.map(), []);
export const useLadders = () => useLiveQuery(() => repo.ladders.all(), []);
export const useExerciseProgress = () => useLiveQuery(() => repo.exercises.all(), []);
export const useHabits = () => useLiveQuery(() => repo.habits.all(), []);
export const useSessions = () => useLiveQuery(() => repo.sessions.all(), []);
export const useSession = (id: string | undefined) =>
  useLiveQuery(async () => (id ? ((await repo.sessions.get(id)) ?? null) : null), [id]);
export const useGoals = () => useLiveQuery(() => repo.goals.all(), []);
export const useBody = () => useLiveQuery(() => repo.body.all(), []);
export const useMeta = <T>(key: string) =>
  useLiveQuery(async () => (await repo.meta.get<T>(key)) ?? null, [key]);

export const useGateDraft = (date: ISODate) =>
  useLiveQuery(async () => (await repo.meta.get<GateDraft | null>(`gate:${date}`)) ?? null, [date]);

/** Today's Gate, re-prescribed live from stored progress, condition and session length. */
export function usePrescription(date: ISODate) {
  return useLiveQuery(async () => {
    const [profile, rec, ladders, exercises] = await Promise.all([
      repo.profile.get(),
      db.days.get(date),
      repo.ladders.all(),
      repo.exercises.all(),
    ]);
    if (!profile) return null;
    return prescribe({
      date,
      programStart: profile.programStart,
      condition: rec?.condition ?? 'OPTIMAL',
      quick: rec?.quick ?? false,
      ladders,
      exercises,
    });
  }, [date]);
}
