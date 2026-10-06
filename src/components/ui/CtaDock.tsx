import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CtaDockProps {
  children: ReactNode;
  /** Sits above the tab bar (default) or at the screen bottom on screens without tabs. */
  overTabs?: boolean;
  /** Kit only: render in flow instead of fixed. */
  preview?: boolean;
  className?: string;
}

/**
 * The thumb-zone action: a sticky primary action 8px above the tab bar. A short base-coloured
 * fade above it keeps scrolled content from colliding with the button.
 */
export function CtaDock({ children, overTabs = true, preview = false, className }: CtaDockProps) {
  return (
    <div
      data-cta-dock={preview ? undefined : ''}
      className={cn(
        'z-(--z-sticky) px-4 pt-6 pb-2',
        'bg-[linear-gradient(to_bottom,transparent,var(--color-base)_24px)]',
        preview
          ? 'relative'
          : cn(
              'fixed inset-x-0 mx-auto max-w-(--frame-w)',
              overTabs
                ? 'bottom-[calc(var(--tabbar-h)+var(--safe-bottom))]'
                : 'bottom-0 pb-[calc(8px+var(--safe-bottom))]',
            ),
        className,
      )}
    >
      {children}
    </div>
  );
}
