import { CaretRight } from '@phosphor-icons/react';
import type { Stat } from '@/engine/types';
import { Checkbox, CheckMark } from '@/components/ui/Checkbox';
import { XpChip } from '@/components/ui/XpChip';
import { cn } from '@/lib/cn';

export interface QuestRowProps {
  title: string;
  detail?: string;
  xp: number;
  stat: Stat | null;
  done: boolean;
  optional?: boolean;
  tone?: 'sys' | 'bad';
  /** Quests cleared elsewhere (Gate, weigh-in) open their screen instead of toggling. */
  onOpen?: () => void;
  /** Where onOpen goes, for the accessible name, e.g. "the Gate". */
  opens?: string;
  onToggle?: (done: boolean) => void;
  disabled?: boolean;
}

function Body({
  title,
  detail,
  optional,
  done,
  tone,
  disabled,
}: Pick<QuestRowProps, 'title' | 'detail' | 'optional' | 'done' | 'tone' | 'disabled'>) {
  return (
    <span className="flex min-w-0 flex-1 flex-col py-2 text-left">
      <span>
        <span
          data-done={done}
          className={cn(
            'quest-title text-15',
            done || disabled ? 'text-ink-3' : 'text-ink',
            tone === 'bad' && !done && 'font-medium',
          )}
        >
          {title}
        </span>
      </span>
      {(detail || optional) && (
        <span className="flex items-start gap-2 text-13 text-ink-2">
          {detail && <span className="line-clamp-2">{detail}</span>}
          {optional && <span className="shrink-0 pt-px hud-11 text-ink-3">Optional</span>}
        </span>
      )}
    </span>
  );
}

export function QuestRow(props: QuestRowProps) {
  const { title, xp, stat, done, tone = 'sys', onOpen, opens, onToggle, disabled } = props;
  const chip = <XpChip xp={xp} stat={stat} done={done} className={cn(disabled && 'opacity-50')} />;

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        aria-label={`${title}, ${done ? 'done' : 'not done'}${opens ? `, opens ${opens}` : ''}`}
        className="flex min-h-14 w-full tap items-center gap-1 pr-3 transition-colors duration-(--dur-1) enabled:hover:bg-s2 enabled:active:bg-s3"
      >
        <span className="grid size-11 shrink-0 place-items-center">
          <CheckMark checked={done} tone={tone} disabled={disabled} />
        </span>
        <Body {...props} tone={tone} />
        {chip}
        <CaretRight aria-hidden className="ml-1 size-4 shrink-0 text-ink-3" />
      </button>
    );
  }

  return (
    <div
      className={cn('flex min-h-14 items-center gap-1 pr-3', !disabled && 'cursor-pointer tap')}
      onClick={disabled ? undefined : () => onToggle?.(!done)}
    >
      <span onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={done}
          label={title}
          tone={tone}
          disabled={disabled}
          onChange={onToggle}
        />
      </span>
      <Body {...props} tone={tone} />
      {chip}
    </div>
  );
}
