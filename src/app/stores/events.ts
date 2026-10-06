import { create } from 'zustand';
import type { LevelUpData } from '@/components/system/LevelUpTakeover';

interface EventsState {
  levelUp: LevelUpData | null;
  /** Level-ups waiting behind the one on screen. */
  pending: LevelUpData[];
  pushLevelUp: (d: LevelUpData) => void;
  doneLevelUp: () => void;
}

export const useEvents = create<EventsState>((set) => ({
  levelUp: null,
  pending: [],
  pushLevelUp: (d) => set((s) => (s.levelUp ? { pending: [...s.pending, d] } : { levelUp: d })),
  doneLevelUp: () => set((s) => ({ levelUp: s.pending[0] ?? null, pending: s.pending.slice(1) })),
}));
