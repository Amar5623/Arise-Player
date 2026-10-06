import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Busy but not disabled: keeps its colour, ignores clicks, shows the scan bar. */
  loading?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-sys text-sys-ink font-semibold enabled:hover:bg-sys-hi enabled:active:bg-sys-lo disabled:bg-s2 disabled:text-ink-3 disabled:border disabled:border-line-2',
  secondary:
    'bg-s2 text-ink border border-line-2 enabled:hover:border-line-3 enabled:hover:bg-s3 enabled:active:bg-s4 disabled:bg-s1 disabled:text-ink-3 disabled:border-line',
  ghost:
    'text-ink-2 enabled:hover:text-ink enabled:hover:bg-s2 enabled:active:bg-s3 disabled:text-ink-3 disabled:opacity-60',
  danger:
    'text-bad border border-bad/50 enabled:hover:bg-bad-dim enabled:active:bg-bad/20 disabled:text-ink-3 disabled:border-line',
};

const SIZE: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 py-2 text-15 gap-2',
  lg: 'min-h-13 px-5 py-2.5 text-17 gap-2.5',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  trailing,
  block = false,
  className,
  children,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  const handle = (e: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handle}
      className={cn(
        'relative inline-flex shrink-0 tap items-center justify-center rounded-ctl text-center font-medium',
        'transition-[background-color,border-color,color,transform] duration-(--dur-1) ease-out',
        'enabled:active:scale-[0.98]',
        VARIANT[variant],
        SIZE[size],
        block && 'w-full',
        loading && 'pointer-events-none',
        className,
      )}
      {...rest}
    >
      {icon && <span className="-ml-0.5 flex shrink-0 [&_svg]:size-5">{icon}</span>}
      <span>{children}</span>
      {trailing && <span className="-mr-0.5 flex shrink-0 [&_svg]:size-5">{trailing}</span>}
      {loading && (
        <span
          aria-hidden
          className="scan-track absolute inset-x-1.5 bottom-1 rounded-mark bg-transparent"
        />
      )}
    </button>
  );
}
