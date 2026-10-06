import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { SheetProps } from './SheetDrawer';

export type { SheetProps };

// The drawer library loads the first time any sheet opens, never on launch.
const SheetDrawer = lazy(() => import('./SheetDrawer'));

/**
 * Bottom sheet with a drag handle. The only overlay pattern besides System notices.
 * Returns focus to whatever opened it when it closes.
 */
export function Sheet(props: SheetProps) {
  const [mounted, setMounted] = useState(props.open);
  if (props.open && !mounted) setMounted(true);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (props.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      return;
    }
    const el = opener.current;
    opener.current = null;
    if (!el) return;
    const t = window.setTimeout(() => {
      if (el.isConnected && (document.activeElement === document.body || document.activeElement === null)) el.focus({ preventScroll: true });
    }, 320);
    return () => window.clearTimeout(t);
  }, [props.open]);

  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <SheetDrawer {...props} />
    </Suspense>
  );
}
