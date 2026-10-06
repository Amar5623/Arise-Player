import { motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { tabOf, useTabs } from '@/app/stores/tabs';
import { EASE_OUT } from '@/lib/motion';
import { TabBar } from './TabBar';

/** Keeps the element a page mounted with, so its route never swaps under it mid-transition. */
function Frozen({ children }: { children: ReactNode }) {
  const [el] = useState(children);
  return el;
}

const depthOf = (path: string) => path.split('/').filter(Boolean).length;

/**
 * Tab shell. Pages inside a tab slide in from the side they come from (push from the right,
 * pop from the left); switching tabs cross-fades. Only the entering page moves.
 */
export function TabsLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const remember = useTabs((s) => s.remember);
  const [motionFor, setMotionFor] = useState<{ key: string; x: number }>({
    key: location.pathname,
    x: 0,
  });

  if (motionFor.key !== location.pathname) {
    const from = motionFor.key;
    const sameTab = tabOf(from) === tabOf(location.pathname);
    const x = !sameTab ? 0 : depthOf(location.pathname) >= depthOf(from) ? 24 : -24;
    setMotionFor({ key: location.pathname, x });
  }

  useEffect(() => {
    remember(location.pathname);
  }, [location.pathname, remember]);

  return (
    <div className="min-h-dvh pb-[calc(var(--tabbar-h)+var(--safe-bottom))]">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0.4, x: motionFor.x }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: motionFor.x === 0 ? 0.12 : 0.22, ease: EASE_OUT }}
      >
        <Frozen>{outlet}</Frozen>
      </motion.div>
      <TabBar />
    </div>
  );
}
