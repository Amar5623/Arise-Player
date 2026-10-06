import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { tabOf, useTabs } from '@/app/stores/tabs';
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
      <div
        key={location.pathname}
        className="page-enter"
        style={
          {
            '--enter-x': `${motionFor.x}px`,
            '--page-dur': motionFor.x === 0 ? '120ms' : '220ms',
          } as CSSProperties
        }
      >
        <Frozen>{outlet}</Frozen>
      </div>
      <TabBar />
    </div>
  );
}
