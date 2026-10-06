import type { ComponentType } from 'react';
import {
  createBrowserRouter,
  redirect,
  type LoaderFunctionArgs,
  type RouteObject,
} from 'react-router';
import { repo } from '@/db/repos';
import { Root } from './Root';
import { TabsLayout } from './TabsLayout';
// The two possible first screens ship in the main chunk: no extra request before first paint.
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { TodayScreen } from '@/screens/today/TodayScreen';

/** First run goes to the Awakening; a Player never sees it again. */
async function gate({ request }: LoaderFunctionArgs) {
  const path = new URL(request.url).pathname;
  if (path.startsWith('/kit')) return null;
  const profile = await repo.profile.get();
  const onboarding = path.startsWith('/onboarding');
  if (!profile && !onboarding) throw redirect('/onboarding/1');
  if (profile && onboarding) throw redirect('/today');
  return null;
}

/** A lazily loaded screen: each one is its own chunk. */
function page<T extends Record<string, unknown>>(
  path: string,
  load: () => Promise<T>,
  name: keyof T,
): RouteObject {
  return {
    path,
    lazy: async () => ({ Component: (await load())[name] as ComponentType }),
  };
}

const tabs: RouteObject[] = [
  { path: 'today', Component: TodayScreen },
  page('train', () => import('@/screens/train/GateScreen'), 'GateScreen'),
  page('train/exercise/:id', () => import('@/screens/train/ExerciseScreen'), 'ExerciseScreen'),
  page('status', () => import('@/screens/status/StatusScreen'), 'StatusScreen'),
  page('status/history', () => import('@/screens/status/HistoryScreen'), 'HistoryScreen'),
  page('status/history/:date', () => import('@/screens/status/DayScreen'), 'DayScreen'),
  page('status/report', () => import('@/screens/status/ReportScreen'), 'ReportScreen'),
  page('quests', () => import('@/screens/quests/QuestsScreen'), 'QuestsScreen'),
  page('quests/:goalId', () => import('@/screens/quests/GoalScreen'), 'GoalScreen'),
  page('settings', () => import('@/screens/settings/SettingsScreen'), 'SettingsScreen'),
  page('settings/:section', () => import('@/screens/settings/SettingsScreen'), 'SettingsScreen'),
];

/** Created on demand: the router starts its first navigation (and the gate loader) immediately. */
export const createRouter = () =>
  createBrowserRouter([
    {
      element: <Root />,
      loader: gate,
      hydrateFallbackElement: <div className="min-h-dvh bg-base" />,
      shouldRevalidate: ({ currentUrl, nextUrl }) => currentUrl.pathname !== nextUrl.pathname,
      children: [
        { index: true, loader: () => redirect('/today') },
        { path: 'onboarding/:step', Component: OnboardingScreen },
        { element: <TabsLayout />, children: tabs },
        page('gate/focus', () => import('@/screens/train/FocusScreen'), 'FocusScreen'),
        page(
          'gate/cleared/:sessionId',
          () => import('@/screens/train/ClearedScreen'),
          'ClearedScreen',
        ),
        page('kit', () => import('@/screens/kit/KitScreen'), 'KitScreen'),
        { path: '*', loader: () => redirect('/today') },
      ],
    },
  ]);
