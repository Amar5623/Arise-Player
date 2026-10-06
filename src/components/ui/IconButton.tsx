import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'sys' | 'bad';
  bordered?: boolean;
}

export function IconButton({
  label,
  children,
  tone = 'default',
  bordered = false,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-11 shrink-0 tap items-center justify-center rounded-ctl transition-[background-color,color,transform] duration-(--dur-1) ease-out [&_svg]:size-6',
        'active:scale-[0.96] disabled:text-ink-4 disabled:active:scale-100',
        tone === 'default' && 'text-ink-2 hover:bg-s2 hover:text-ink active:bg-s3',
        tone === 'sys' && 'text-sys hover:bg-sys-dim active:bg-sys/20',
        tone === 'bad' && 'text-bad hover:bg-bad-dim active:bg-bad/20',
        bordered && 'border border-line-2 bg-s1',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
