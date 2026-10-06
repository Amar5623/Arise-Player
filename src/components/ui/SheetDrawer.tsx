import type { ReactNode } from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/cn';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Sticky footer, e.g. the confirm button. */
  footer?: ReactNode;
  className?: string;
}

/** Vaul drawer body; loaded on first open by Sheet. */
export default function SheetDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} autoFocus>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-(--z-sheet) bg-base/60 backdrop-blur-bar" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-(--z-sheet) mx-auto flex max-h-[92dvh] max-w-(--frame-w) flex-col',
            'rounded-t-ctl border-t border-line-2 bg-s2 outline-none',
            className,
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-mark bg-ink-4" />
          <div className="flex flex-col gap-1 px-4 pt-4 pb-4">
            <Drawer.Title className="hud-17 text-ink">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="text-13 text-ink-2">{description}</Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          {footer && (
            <div className="border-t border-line px-4 pt-3 pb-[calc(12px+var(--safe-bottom))]">
              {footer}
            </div>
          )}
          {!footer && <div className="pb-(--safe-bottom)" />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
