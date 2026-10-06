import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}

/** Says what goes here, then offers one action. */
export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-card border border-dashed border-line-2 px-4 py-5',
        className,
      )}
    >
      <span className="text-ink-3 [&_svg]:size-7">{icon}</span>
      <div className="flex flex-col gap-1">
        <p className="text-15 font-medium text-ink">{title}</p>
        <p className="max-w-[34ch] text-13 text-ink-2">{body}</p>
      </div>
      {action}
    </div>
  );
}
