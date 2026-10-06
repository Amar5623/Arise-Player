import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SectionHeadProps {
  children: ReactNode;
  action?: ReactNode;
  as?: 'h2' | 'h3';
  id?: string;
  className?: string;
}

/** The uppercase display face is the heading itself. No label above it. */
export function SectionHead({ children, action, as: Tag = 'h2', id, className }: SectionHeadProps) {
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-4 pt-6 pb-2', className)}>
      <Tag id={id} className="hud-13 text-ink-2">
        {children}
      </Tag>
      {action}
    </div>
  );
}
