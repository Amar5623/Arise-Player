import { create } from 'zustand';

export const TAB_ROOTS = ['/today', '/train', '/status', '/quests'] as const;
export type TabRoot = (typeof TAB_ROOTS)[number];

/** Settings is a stack inside Status. */
export function tabOf(pathname: string): TabRoot | null {
  if (pathname.startsWith('/settings')) return '/status';
  return TAB_ROOTS.find((t) => pathname === t || pathname.startsWith(`${t}/`)) ?? null;
}

interface TabsState {
  last: Partial<Record<TabRoot, string>>;
  remember: (pathname: string) => void;
}

/** Each tab remembers where you were in its stack. */
export const useTabs = create<TabsState>((set) => ({
  last: {},
  remember: (pathname) => {
    const tab = tabOf(pathname);
    if (tab) set((s) => ({ last: { ...s.last, [tab]: pathname } }));
  },
}));
