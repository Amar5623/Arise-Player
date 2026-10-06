import { MotionConfig } from 'motion/react';
import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { openDay } from '@/app/commands/day';
import { startClock, useToday } from '@/app/stores/clock';
import { useEvents } from '@/app/stores/events';
import { LevelUpTakeover } from '@/components/system/LevelUpTakeover';
import { ToastHost } from '@/components/system/ToastHost';
import { DEMO } from '@/db/db';
import { useProfile } from '@/db/hooks';
import { setHapticsEnabled } from '@/lib/haptics';
import { setSoundEnabled } from '@/lib/sound';

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
    if (hasProfile) void openDay(today);
  }, [hasProfile, today]);
  return null;
}

function LevelUpHost() {
  const data = useEvents((s) => s.levelUp);
  const done = useEvents((s) => s.doneLevelUp);
  return <LevelUpTakeover data={data} onDone={done} />;
}

/** Shown at the top of every screen while the demo database is open. */
function DemoMarker() {
  if (!DEMO) return null;
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 border-b border-warn/30 bg-warn-dim px-4 pt-(--safe-top) text-13">
      <p className="text-warn">
        <span className="mr-2 hud-11">Demo data</span>
        <span className="text-ink-2">Sample history, not yours.</span>
      </p>
      <a href="/today?demo=0" className="flex min-h-8 tap items-center px-1 text-warn underline">
        Exit
      </a>
    </div>
  );
}

/** App-wide chrome: one reduced-motion policy, base texture, toasts, level-ups, day boot. */
export function Root() {
  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden className="base-grid" />
      <Boot />
      <DemoMarker />
      <Outlet />
      <ScrollRestoration getKey={(loc) => loc.pathname} />
      <ToastHost />
      <LevelUpHost />
    </MotionConfig>
  );
}
