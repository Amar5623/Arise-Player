import { create } from 'zustand';
import type { ISODate } from '@/engine/types';
import { msToMidnight, todayISO } from '@/lib/dates';

interface ClockState {
  today: ISODate;
  sync: () => void;
}

/** Today's local date. Rolls over at midnight while the app is open, and on return from background. */
export const useClock = create<ClockState>((set, get) => ({
  today: todayISO(),
  sync: () => {
    const now = todayISO();
    if (now !== get().today) set({ today: now });
  },
}));

let started = false;

export function startClock(): () => void {
  if (started) return () => undefined;
  started = true;
  let timer = 0;
  const arm = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      useClock.getState().sync();
      arm();
    }, msToMidnight() + 500);
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      useClock.getState().sync();
      arm();
    }
  };
  arm();
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    started = false;
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

export const useToday = () => useClock((s) => s.today);
