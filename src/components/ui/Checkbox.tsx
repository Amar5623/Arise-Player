import { motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { DUR, EASE_OUT } from '@/lib/motion';

export interface CheckboxProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  tone?: 'sys' | 'bad';
  className?: string;
}

/** 22px angular box inside a 44px hit target. The check draws itself. */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  tone = 'sys',
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn('group grid size-11 shrink-0 tap place-items-center rounded-ctl', className)}
    >
      <CheckMark checked={checked} tone={tone} disabled={disabled} interactive />
    </button>
  );
}

/** The box itself. Also used as a decorative status mark on rows that open a screen. */
export function CheckMark({
  checked,
  tone = 'sys',
  disabled,
  interactive = false,
}: {
  checked: boolean;
  tone?: 'sys' | 'bad';
  disabled?: boolean;
  interactive?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative grid size-5.5 place-items-center rounded-mark border transition-[background-color,border-color,transform] duration-(--dur-1) ease-out',
        interactive && !disabled && 'group-active:scale-90',
        !checked && !disabled && 'border-ctl bg-s1',
        !checked && !disabled && interactive && 'group-hover:border-ink-2 group-active:bg-s3',
        checked && tone === 'sys' && 'border-sys bg-sys',
        checked && tone === 'bad' && 'border-bad bg-bad',
        disabled && !checked && 'border-ink-4/50 bg-transparent',
        disabled && checked && 'opacity-50',
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3.5">
        <motion.path
          d="M3 8.5 6.5 12 13 4.5"
          fill="none"
          stroke="var(--color-sys-ink)"
          strokeWidth={2.25}
          strokeLinecap="square"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: DUR[2], ease: EASE_OUT }}
        />
      </svg>
    </span>
  );
}
