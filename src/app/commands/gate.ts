/** Clearing a Gate: progression, XP, the session record and the System log. */
import { anyExercise } from '@/data/ladders';
import { WARMUP } from '@/data/plan';
import type { XpSummary } from '@/engine/levels';
import type { Prescription } from '@/engine/prescription';
import { applyProgression, type Unlock } from '@/engine/progression';
import { gateXp, totalXp, XP } from '@/engine/xp';
import type { Session, SessionEntry, XpDraft } from '@/engine/types';
import { db } from '@/db/db';
import { ALL_TABLES, repo } from '@/db/repos';
import { toast } from '@/app/stores/toasts';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { syncGoals } from './records';
import { celebrate, toEvents, uid } from './xp';

export interface LoggedSet {
  sets: (number | null)[];
  rpe?: number;
  pain: boolean;
}

export interface GateResult {
  session: Session;
  drafts: XpDraft[];
  unlocks: Unlock[];
  before: XpSummary;
  after: XpSummary;
}

export async function clearGate(
  p: Prescription,
  logged: Readonly<Record<string, LoggedSet>>,
  warmup: readonly boolean[],
): Promise<GateResult> {
  const before = await repo.xp.summary();
  const [ladders, exercises] = await Promise.all([repo.ladders.all(), repo.exercises.all()]);
  const items = p.items.map((item) => ({
    item,
    ...(logged[item.key] ?? { sets: [], pain: false }),
  }));
  const result = applyProgression(p.mode, items, ladders, exercises);

  const entries: SessionEntry[] = items.map(({ item, sets, rpe, pain }) => ({
    key: item.key,
    exerciseId: item.exerciseId,
    name: item.name,
    unit: item.unit,
    side: item.perSide,
    target: item.target,
    sets: Array.from({ length: item.sets }, (_, i) => sets[i] ?? null),
    rpe,
    pain,
  }));
  const warm = WARMUP.map((_, i) => warmup[i] ?? false);
  const session: Session = {
    id: uid(),
    date: p.date,
    planDay: p.planDay,
    name: p.name,
    mode: p.mode,
    quick: p.quick,
    deload: p.deload,
    warmupDone: warm.every(Boolean),
    warmup: warm,
    entries,
    xp: 0,
    log: result.log,
  };
  const drafts = gateXp(session, (id) => anyExercise(id).stat, result.unlocks);
  session.xp = totalXp(drafts);

  let completed = false;
  await db.transaction('rw', ALL_TABLES, async () => {
    await repo.sessions.put(session);
    await repo.ladders.putAll(Object.values(result.ladders));
    await repo.exercises.putAll(Object.values(result.exercises));
    await repo.xp.add(toEvents(p.date, drafts));
    const rec = await repo.days.get(p.date);
    if (rec) {
      const quests = rec.quests.map((q) =>
        q.kind === 'gate'
          ? { ...q, done: true, xp: session.xp, doneAt: new Date().toISOString() }
          : q,
      );
      let bonusAwarded = rec.bonusAwarded;
      if (!bonusAwarded && quests.every((q) => q.optional || q.done)) {
        await repo.xp.add(
          toEvents(p.date, [
            { stat: null, amount: XP.dailyBonus, source: 'bonus', ref: `bonus:${p.date}` },
          ]),
        );
        bonusAwarded = true;
        completed = true;
      }
      await repo.days.put({ ...rec, quests, bonusAwarded });
    }
  });

  haptic('clear');
  play('clear');
  if (completed)
    toast({
      tone: 'ok',
      label: 'Daily quest complete',
      message: 'Every quest cleared.',
      detail: `+${XP.dailyBonus} XP bonus.`,
    });
  const after = await celebrate(before, p.date);
  // After the gate's own celebration, so a cleared goal raises its own level-up.
  const pulls = Math.max(
    0,
    ...entries.filter((e) => e.exerciseId === 'pull-5').flatMap((e) => e.sets.map((s) => s ?? 0)),
  );
  if (pulls > 0) await syncGoals('ladder.pull', pulls, p.date);
  return { session, drafts, unlocks: result.unlocks, before, after };
}
