import { WarningCircle } from '@phosphor-icons/react';
import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  unit?: string;
  helper?: string;
  error?: string;
  mono?: boolean;
}

/** Label above, input, helper or error below. Never a placeholder as the label. */
export function Field({
  label,
  unit,
  helper,
  error,
  mono = false,
  className,
  id,
  disabled,
  ...rest
}: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const note = error ?? helper;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        className={cn('text-13 font-medium', disabled ? 'text-ink-3' : 'text-ink-2')}
      >
        {label}
      </label>
      <div
        className={cn(
          'flex min-h-12 items-center gap-2 rounded-ctl border bg-s2 px-3 transition-colors duration-(--dur-1)',
          'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sys',
          error ? 'border-bad' : 'border-ctl hover:border-ink-2',
          disabled && 'border-line-2 bg-s1 hover:border-line-2',
        )}
      >
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className={cn(
            'min-h-11 min-w-0 flex-1 bg-transparent text-15 text-ink outline-none focus-visible:outline-none disabled:text-ink-3',
            mono && 'num',
          )}
          {...rest}
        />
        {unit && <span className="shrink-0 num text-13 text-ink-3">{unit}</span>}
      </div>
      {note && (
        <p
          id={noteId}
          className={cn('flex items-start gap-1.5 text-13', error ? 'text-bad' : 'text-ink-3')}
        >
          {error && (
            <WarningCircle weight="regular" className="mt-px size-4 shrink-0" aria-hidden />
          )}
          {note}
        </p>
      )}
    </div>
  );
}
