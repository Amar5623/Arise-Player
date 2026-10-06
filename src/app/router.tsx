import { createBrowserRouter, redirect, type LoaderFunctionArgs } from 'react-router';
import { repo } from '@/db/repos';
import { Root } from './Root';
import { TabsLayout } from './TabsLayout';

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

const screen =
  <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) =>
  async () => {
    const mod = await load();
    return { Component: mod[name] as React.ComponentType };
  };

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
        {
          path: 'onboarding/:step',
          lazy: screen(() => import('@/screens/onboarding/OnboardingScreen'), 'OnboardingScreen'),
        },
        {
          element: <TabsLayout />,
          children: [
            {
              path: 'today',
              lazy: screen(() => import('@/screens/today/TodayScreen'), 'TodayScreen'),
            },
            {
              path: 'train',
              lazy: screen(() => import('@/screens/train/GateScreen'), 'GateScreen'),
            },
            {
              path: 'train/exercise/:id',
              lazy: screen(() => import('@/screens/train/ExerciseScreen'), 'ExerciseScreen'),
            },
          ],
        },
        {
          path: 'gate/focus',
          lazy: screen(() => import('@/screens/train/FocusScreen'), 'FocusScreen'),
        },
        {
          path: 'gate/cleared/:sessionId',
          lazy: screen(() => import('@/screens/train/ClearedScreen'), 'ClearedScreen'),
        },
        { path: 'kit', lazy: screen(() => import('@/screens/kit/KitScreen'), 'KitScreen') },
        { path: '*', loader: () => redirect('/today') },
      ],
    },
  ]);
