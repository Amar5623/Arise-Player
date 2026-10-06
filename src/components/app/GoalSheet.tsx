import { useState } from 'react';
import { saveGoal } from '@/app/commands/records';
import { useToday } from '@/app/stores/clock';
import { toast } from '@/app/stores/toasts';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { GOAL_TEMPLATES } from '@/data/templates';
import { STATS } from '@/data/stats';
import { STAT_KEYS, type Goal, type Stat } from '@/engine/types';
import { addDays, isISODate } from '@/lib/dates';
import { cn } from '@/lib/cn';

interface Draft {
  title: string;
  stat: Stat;
  unit: string;
  start: string;
  target: string;
  deadline: string;
}

const fromGoal = (g: Goal): Draft => ({
  title: g.title,
  stat: g.stat,
  unit: g.unit,
  start: String(g.start),
  target: String(g.target),
  deadline: g.deadline ?? '',
});
const blank: Draft = { title: '', stat: 'WLT', unit: '', start: '0', target: '', deadline: '' };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (goal: Goal) => void;
  goal?: Goal;
  currency: string;
}

/** New main quest (with templates) or edit an existing one. */
export function GoalSheet({ open, onOpenChange, onDone, goal, currency }: Props) {
  const today = useToday();
  const [d, setD] = useState<Draft>(goal ? fromGoal(goal) : blank);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const num = (s: string) => Number(s.replace(/,/g, ''));
  const errors = {
    title: d.title.trim() ? undefined : 'Name the quest.',
    target:
      d.target.trim() !== '' && Number.isFinite(num(d.target)) && num(d.target) !== num(d.start)
        ? undefined
        : 'A target different from the start.',
    start: Number.isFinite(num(d.start)) ? undefined : 'A number.',
    deadline:
      !d.deadline || (isISODate(d.deadline) && d.deadline > today)
        ? undefined
        : 'A date after today, or leave it empty.',
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);

  const save = async () => {
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    const g = await saveGoal(
      {
        id: goal?.id,
        title: d.title.trim(),
        stat: d.stat,
        unit: d.unit.trim(),
        start: num(d.start),
        target: num(d.target),
        deadline: d.deadline || undefined,
        current: goal?.current,
      },
      today,
    );
    setSaving(false);
    toast({
      tone: 'sys',
      label: goal ? 'Main quest updated' : 'Main quest accepted',
      message: g.title,
    });
    onDone(g);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={goal ? 'Edit main quest' : 'New main quest'}
      description={goal ? undefined : 'Start from a template or write your own.'}
      footer={
        <Button variant="primary" size="lg" block loading={saving} onClick={() => void save()}>
          {goal ? 'Save' : 'Accept quest'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {!goal && (
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
            role="list"
            aria-label="Templates"
          >
            {GOAL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="listitem"
                onClick={() =>
                  set({
                    title: t.title,
                    stat: t.stat,
                    unit: t.money ? currency : t.unit,
                    start: String(t.start),
                    target: String(t.target),
                    deadline: addDays(today, t.days),
                  })
                }
                className="shrink-0 tap rounded-ctl border border-line-2 bg-s1 px-3 py-2 text-left text-13 text-ink hover:border-line-3 active:bg-s3"
              >
                {t.title}
              </button>
            ))}
          </div>
        )}
        <Field
          label="Quest"
          value={d.title}
          onChange={(e) => set({ title: e.target.value })}
          error={show('title')}
        />
        <fieldset>
          <legend className="pb-2 text-13 font-medium text-ink-2">Stat it feeds</legend>
          <div role="radiogroup" aria-label="Stat" className="grid grid-cols-3 gap-1.5">
            {STAT_KEYS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={d.stat === s}
                onClick={() => set({ stat: s })}
                className={cn(
                  'flex min-h-11 tap items-center justify-center gap-2 rounded-ctl border text-13',
                  d.stat === s
                    ? 'border-sys bg-sys-dim text-ink'
                    : 'border-line-2 bg-s1 text-ink-2 hover:border-line-3',
                )}
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-mark"
                  style={{ background: STATS.find((x) => x.key === s)?.color }}
                />
                {s}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-3 gap-3">
          <Field
            label="Start"
            mono
            inputMode="decimal"
            value={d.start}
            onChange={(e) => set({ start: e.target.value })}
            error={show('start')}
          />
          <Field
            label="Target"
            mono
            inputMode="decimal"
            value={d.target}
            onChange={(e) => set({ target: e.target.value })}
            error={show('target')}
          />
          <Field
            label="Unit"
            value={d.unit}
            onChange={(e) => set({ unit: e.target.value })}
            placeholder="kg, ₹"
          />
        </div>
        <Field
          label="Deadline"
          type="date"
          mono
          value={d.deadline}
          onChange={(e) => set({ deadline: e.target.value })}
          error={show('deadline')}
          helper="Optional."
        />
      </div>
    </Sheet>
  );
}
