import { MotionConfig } from 'motion/react';
import { Outlet } from 'react-router';
import { ToastHost } from '@/components/system/ToastHost';

/** App-wide chrome: one reduced-motion policy, the base grid texture and the System toast host. */
export function Root() {
  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden className="base-grid" />
      <Outlet />
      <ToastHost />
    </MotionConfig>
  );
}
