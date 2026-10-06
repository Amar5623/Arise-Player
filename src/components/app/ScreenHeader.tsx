import { CaretLeft } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

export interface ScreenHeaderProps {
  title: string;
  /** Where back goes when there is no history (deep link). */
  back?: string;
  actions?: ReactNode;
  /** Small line under the title. */
  sub?: ReactNode;
  className?: string;
}

/** Header for stack screens: back, title, actions. Sticky, on the base ground. */
export function ScreenHeader({ title, back, actions, sub, className }: ScreenHeaderProps) {
  const navigate = useNavigate();
  return (
    <header
      className={cn(
        'sticky top-0 z-(--z-sticky) flex min-h-14 items-center gap-1 border-b border-line bg-base px-2 pt-(--safe-top)',
        className,
      )}
    >
      {back !== undefined && (
        <IconButton
          label="Back"
          onClick={() =>
            window.history.state && window.history.state.idx > 0
              ? navigate(-1)
              : navigate(back, { replace: true })
          }
        >
          <CaretLeft />
        </IconButton>
      )}
      <div className={cn('flex min-w-0 flex-1 flex-col', back === undefined && 'pl-2')}>
        <h1 className="truncate text-17 font-semibold text-ink">{title}</h1>
        {sub && <p className="truncate text-13 text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
    </header>
  );
}
