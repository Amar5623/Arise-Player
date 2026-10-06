import * as RadixSwitch from '@radix-ui/react-switch';
import { useId } from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hide the visible label (still announced). */
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled,
  className,
}: SwitchProps) {
  const id = useId();
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      {!hideLabel && (
        <label htmlFor={id} className="text-15 text-ink">
          {label}
        </label>
      )}
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={hideLabel ? label : undefined}
        className={cn(
          'group relative inline-flex h-11 w-13 shrink-0 tap items-center',
          'disabled:opacity-40',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute inset-x-0 top-1/2 h-6.5 -translate-y-1/2 rounded-ctl border transition-colors duration-(--dur-1)',
            checked
              ? 'border-sys bg-sys group-enabled:group-hover:bg-sys-hi'
              : 'border-ctl bg-s2 group-enabled:group-hover:border-ink-2',
          )}
        />
        <RadixSwitch.Thumb
          className={cn(
            'relative block size-5 rounded-inner transition-transform duration-(--dur-2) ease-out group-enabled:group-active:scale-90',
            'translate-x-[3px] data-[state=checked]:translate-x-[29px]',
            checked ? 'bg-sys-ink' : 'bg-ink-2',
          )}
        />
      </RadixSwitch.Root>
    </span>
  );
}
