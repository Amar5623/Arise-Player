import { create } from 'zustand';
import { HABITS } from '@/data/habits';
import type { LadderKey } from '@/engine/types';

export interface ProfileDraft {
  name: string;
  weightKg: string;
  heightCm: string;
  wake: string;
  programStart: string;
  currency: string;
  saveWeekly: string;
}

interface OnboardingState {
  profile: ProfileDraft;
  steps: Record<LadderKey, number>;
  habits: string[];
  setProfile: (p: Partial<ProfileDraft>) => void;
  setStep: (k: LadderKey, step: number) => void;
  toggleHabit: (id: string) => void;
}

/** Draft answers, kept while moving between onboarding steps. */
export const useOnboarding = create<OnboardingState>((set) => ({
  profile: {
    name: '',
    weightKg: '',
    heightCm: '',
    wake: '06:30',
    programStart: '2026-10-05',
    currency: '₹',
    saveWeekly: '2500',
  },
  steps: { push: 2, squat: 2, pull: 1 },
  habits: HABITS.filter((h) => h.defaultOn).map((h) => h.id),
  setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
  setStep: (k, step) => set((s) => ({ steps: { ...s.steps, [k]: step } })),
  toggleHabit: (id) =>
    set((s) => ({
      habits: s.habits.includes(id) ? s.habits.filter((h) => h !== id) : [...s.habits, id],
    })),
}));
