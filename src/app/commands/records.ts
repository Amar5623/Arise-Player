/** Body log and main quests. */
import { toast } from '@/app/stores/toasts';
import { goalReached, updateGoal } from '@/engine/goals';
import { XP } from '@/engine/xp';
import type { BodyEntry, Goal, GoalSource, ISODate } from '@/engine/types';
import { repo } from '@/db/repos';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { toggleQuest } from './day';
import { celebrate, toEvents, uid } from './xp';

export async function logBody(entry: BodyEntry, today: ISODate): Promise<void> {
  const prev = await repo.body.get(entry.date);
  await repo.body.put({ ...prev, ...entry });
  if (entry.weightKg) {
    const profile = await repo.profile.get();
    if (profile && entry.date === today)
      await repo.profile.put({ ...profile, weightKg: entry.weightKg });
  }
  const rec = await repo.days.get(entry.date);
  if (rec?.quests.some((q) => q.kind === 'weigh' && !q.done))
    await toggleQuest(entry.date, 'weigh', true);
  if (entry.waistCm && entry.date === today) await syncGoals('body.waist', entry.waistCm, today);
}

/**
 * Moves every open goal that tracks this source. Waist follows the latest measurement; pull-ups
 * only ever move up, so one bad session never undoes a record.
 */
export async function syncGoals(source: GoalSource, value: number, today: ISODate): Promise<void> {
  const goals = await repo.goals.all();
  for (const g of goals) {
    if (g.done || g.source !== source || g.current === value) continue;
    if (source === 'ladder.pull' && value < g.current) continue;
    await updateGoalValue(g.id, value, today);
  }
}

export async function saveGoal(
  draft: Omit<Goal, 'id' | 'updates' | 'done' | 'current'> & { id?: string; current?: number },
  today: ISODate,
): Promise<Goal> {
  const existing = draft.id ? await repo.goals.get(draft.id) : undefined;
  const goal: Goal = existing
    ? { ...existing, ...draft, id: existing.id, current: draft.current ?? existing.current }
    : {
        ...draft,
        id: uid(),
        current: draft.current ?? draft.start,
        updates: [{ date: today, value: draft.current ?? draft.start }],
        done: false,
      };
  await repo.goals.put(goal);
  return goal;
}

export async function updateGoalValue(
  id: string,
  value: number,
  today: ISODate,
): Promise<Goal | undefined> {
  const g = await repo.goals.get(id);
  if (!g) return undefined;
  const before = await repo.xp.summary();
  const { goal, cleared } = updateGoal(g, value, today);
  await repo.goals.put(goal);
  if (cleared) {
    await repo.xp.add(
      toEvents(today, [
        { stat: goal.stat, amount: XP.goal, source: 'goal', ref: `goal:${goal.id}` },
      ]),
    );
    haptic('clear');
    play('clear');
    toast({
      tone: 'rare',
      label: 'Main quest cleared',
      message: goal.title,
      detail: `+${XP.goal} ${goal.stat} XP.`,
    });
    await celebrate(before, today);
  }
  return goal;
}

export async function deleteGoal(id: string): Promise<void> {
  await repo.goals.delete(id);
}

export { goalReached };
