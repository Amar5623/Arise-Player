/** Profile, habit library, tiers, ladders and title changes. */
import { ladderStep } from '@/data/ladders';
import type { HabitConfig, ISODate, LadderKey, Profile } from '@/engine/types';
import { repo } from '@/db/repos';
import { setHapticsEnabled } from '@/lib/haptics';
import { setSoundEnabled } from '@/lib/sound';
import { refreshToday } from './day';

export async function saveProfile(p: Profile, today: ISODate): Promise<void> {
  await repo.profile.put(p);
  setSoundEnabled(p.sound);
  setHapticsEnabled(p.haptics);
  await refreshToday(today);
}

export async function setHabit(id: string, enabled: boolean, today: ISODate): Promise<void> {
  const all = await repo.habits.all();
  const cur = all.find((h) => h.id === id);
  const next: HabitConfig = cur
    ? { ...cur, enabled, since: enabled && !cur.enabled ? today : cur.since }
    : { id, enabled, tier: 1, since: today };
  await repo.habits.putAll([next]);
  await refreshToday(today);
}

export async function setTier(id: string, tier: number, today: ISODate): Promise<void> {
  const all = await repo.habits.all();
  const cur = all.find((h) => h.id === id);
  if (!cur || cur.tier === tier) return;
  await repo.habits.putAll([{ ...cur, tier, since: today }]);
  await refreshToday(today);
}

/** Manual ladder override: moves to a step and starts at the bottom of its range. */
export async function setLadderStep(key: LadderKey, step: number, today: ISODate): Promise<void> {
  const s = ladderStep(key, step);
  await repo.ladders.putAll([{ key, step, target: s.range[0], fails: 0 }]);
  await refreshToday(today);
}

export async function equipTitle(id: string | null): Promise<void> {
  const p = await repo.player.get();
  if (!p) return;
  await repo.player.put({ ...p, equippedTitle: id });
}
