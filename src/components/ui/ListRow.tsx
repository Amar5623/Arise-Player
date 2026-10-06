import { CaretRight } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ListRowProps {
  title: ReactNode;
  detail?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Renders as a button with a chevron when set. */
  onClick?: () => void;
  chevron?: boolean;
  disabled?: boolean;
  className?: string;
}

/** A row inside a list group. Hairline separators come from the group, not the row. */
export function ListRow({
  title,
  detail,
  leading,
  trailing,
  onClick,
  chevron,
  disabled,
  className,
}: ListRowProps) {
  const body = (
    <>
      {leading && <span className="flex shrink-0 text-ink-2 [&_svg]:size-5">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate text-15', disabled ? 'text-ink-3' : 'text-ink')}>
          {title}
        </span>
        {detail && <span className="truncate text-13 text-ink-2">{detail}</span>}
      </span>
      {trailing && <span className="flex shrink-0 items-center text-ink-2">{trailing}</span>}
      {(chevron ?? !!onClick) && <CaretRight aria-hidden className="size-4 shrink-0 text-ink-3" />}
    </>
  );
  const base = 'flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left';
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          base,
          'tap transition-colors duration-(--dur-1) enabled:hover:bg-s2 enabled:active:bg-s3',
          className,
        )}
      >
        {body}
      </button>
    );
  }
  return <div className={cn(base, className)}>{body}</div>;
}

export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'divide-y divide-line overflow-hidden rounded-card border border-line bg-s1',
        className,
      )}
    >
      {children}
    </div>
  );
}
