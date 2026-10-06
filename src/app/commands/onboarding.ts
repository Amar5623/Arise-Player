/** The Awakening: writes the first profile, ladders, habits and player. */
import { HABITS } from '@/data/habits';
import { LADDER_KEYS, ladderStep } from '@/data/ladders';
import type { ISODate, LadderKey, Profile } from '@/engine/types';
import { emptyStats } from '@/engine/levels';
import { db, SCHEMA_VERSION } from '@/db/db';
import { ALL_TABLES, repo } from '@/db/repos';
import { setHapticsEnabled } from '@/lib/haptics';
import { setSoundEnabled } from '@/lib/sound';
import { openDay } from './day';

export interface OnboardingInput {
  profile: Omit<Profile, 'joinedAt' | 'sound' | 'haptics' | 'aiEnabled' | 'weighEvery'>;
  steps: Record<LadderKey, number>;
  habits: readonly string[];
}

export async function completeOnboarding(input: OnboardingInput, today: ISODate): Promise<void> {
  const profile: Profile = {
    ...input.profile,
    joinedAt: today,
    sound: false,
    haptics: true,
    aiEnabled: false,
    weighEvery: 4,
  };
  await db.transaction('rw', ALL_TABLES, async () => {
    await repo.profile.put(profile);
    await repo.ladders.putAll(
      LADDER_KEYS.map((key) => ({
        key,
        step: input.steps[key],
        target: ladderStep(key, input.steps[key]).range[0],
        fails: 0,
      })),
    );
    await repo.habits.putAll(
      HABITS.map((h) => ({
        id: h.id,
        enabled: input.habits.includes(h.id),
        tier: 1,
        since: today,
      })),
    );
    await repo.player.put({
      xp: 0,
      level: 1,
      statXp: emptyStats(),
      bestStreak: 0,
      titles: ['awakened'],
      equippedTitle: 'awakened',
      gatesCleared: 0,
    });
    await repo.meta.set('schemaVersion', SCHEMA_VERSION);
    await repo.meta.set('lastTierEval', today);
  });
  setSoundEnabled(profile.sound);
  setHapticsEnabled(profile.haptics);
  await openDay(today);
}
