import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { openDay } from '@/app/commands/day';
import { startClock, useToday } from '@/app/stores/clock';
import { useEvents } from '@/app/stores/events';
import { useToasts } from '@/app/stores/toasts';
import { DEMO } from '@/db/db';
import { useProfile } from '@/db/hooks';
import { setHapticsEnabled } from '@/lib/haptics';
import { setSoundEnabled } from '@/lib/sound';
import { UpdatePrompt } from './UpdatePrompt';

// Animated overlays load the first time they have something to show, never on launch.
const ToastHost = lazy(() => import('@/components/system/ToastHost').then((mod) => ({ default: mod.ToastHost })));
const LevelUpTakeover = lazy(() =>
  import('@/components/system/LevelUpTakeover').then((mod) => ({ default: mod.LevelUpTakeover })),
);

/** Opens the day on launch and at every midnight rollover. */
function Boot() {
  const today = useToday();
  const profile = useProfile();
  const hasProfile = !!profile;

  useEffect(() => startClock(), []);
  useEffect(() => {
    if (!profile) return;
    setSoundEnabled(profile.sound);
    setHapticsEnabled(profile.haptics);
  }, [profile]);
  useEffect(() => {
    if (!hasProfile) return;
    void openDay(today);
    // All history lives on this device: ask the browser not to evict it.
    void navigator.storage?.persist?.();
  }, [hasProfile, today]);
  return null;
}

/** Mounts a lazy overlay once it is first needed, then keeps it for exit animations. */
function useLatch(on: boolean): boolean {
  const [latched, setLatched] = useState(on);
  if (on && !latched) setLatched(true);
  return latched;
}

function Overlays() {
  const hasToast = useToasts((s) => s.queue.length > 0);
  const levelUp = useEvents((s) => s.levelUp);
  const done = useEvents((s) => s.doneLevelUp);
  const toasts = useLatch(hasToast);
  const takeover = useLatch(levelUp !== null);
  return (
    <Suspense fallback={null}>
      {toasts && <ToastHost />}
      {takeover && <LevelUpTakeover data={levelUp} onDone={done} />}
    </Suspense>
  );
}

/** Always mounted, so screen readers hear every System notice even before the toast UI loads. */
function ToastAnnouncer() {
  const head = useToasts((s) => s.queue[0]);
  const urgent = head?.tone === 'bad' || head?.tone === 'warn';
  const text = head ? `${head.label}. ${head.message}${head.detail ? ` ${head.detail}` : ''}` : '';
  return (
    <>
      <p className="sr-only" aria-live="polite">
        {urgent ? '' : text}
      </p>
      <p className="sr-only" aria-live="assertive">
        {urgent ? text : ''}
      </p>
    </>
  );
}

/** Shown at the top of every screen while the demo database is open. */
function DemoMarker() {
  if (!DEMO) return null;
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-warn/30 bg-warn-dim pt-(--safe-top) pl-4 text-13">
      <p className="text-warn">
        <span className="mr-2 hud-11">Demo data</span>
        <span className="text-ink-2">Sample history, not yours.</span>
      </p>
      <a href="/today?demo=0" className="flex min-h-11 tap items-center px-4 text-warn underline">
        Exit
      </a>
    </div>
  );
}

/** App-wide chrome: base texture, day boot, toasts, level-ups, update prompt. */
export function Root() {
  return (
    <>
      <div aria-hidden className="base-grid" />
      <Boot />
      <DemoMarker />
      <Outlet />
      <ScrollRestoration getKey={(loc) => loc.pathname} />
      <ToastAnnouncer />
      <Overlays />
      <UpdatePrompt />
    </>
  );
}
