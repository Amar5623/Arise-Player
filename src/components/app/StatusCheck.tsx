import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Stepper } from '@/components/ui/Stepper';
import type { Readiness } from '@/engine/types';

const SCALE = [1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }));

export interface StatusCheckProps {
  initial?: Readiness;
  onSubmit: (r: Readiness) => void;
  submitLabel?: string;
  busy?: boolean;
}

/** Morning status check: sleep, energy, soreness, pain. Every control is touch-safe in a scrolling list. */
export function StatusCheck({
  initial,
  onSubmit,
  submitLabel = 'Log status',
  busy,
}: StatusCheckProps) {
  const [sleep, setSleep] = useState(initial?.sleep ?? 7);
  const [energy, setEnergy] = useState<number | null>(initial?.energy ?? null);
  const [soreness, setSoreness] = useState<number | null>(initial?.soreness ?? null);
  const [pain, setPain] = useState<boolean | null>(initial?.pain ?? null);
  const ready = energy !== null && soreness !== null && pain !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-15 text-ink">Sleep</span>
          <span className="text-13 text-ink-2">Last night</span>
        </div>
        <Stepper
          size="sm"
          label="Sleep"
          unit="hours"
          value={sleep}
          onChange={setSleep}
          min={0}
          max={12}
          step={0.5}
          format={(v) => v.toFixed(1)}
          className="shrink-0"
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="flex w-full justify-between pb-1.5 text-15 text-ink">
          Energy <span className="text-13 text-ink-2">1 flat, 5 sharp</span>
        </legend>
        <Segmented label="Energy" mono value={energy} onChange={setEnergy} options={SCALE} />
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="flex w-full justify-between pb-1.5 text-15 text-ink">
          Soreness <span className="text-13 text-ink-2">1 none, 5 heavy</span>
        </legend>
        <Segmented label="Soreness" mono value={soreness} onChange={setSoreness} options={SCALE} />
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-1.5 text-15 text-ink">Sharp or joint pain?</legend>
        <Segmented
          label="Sharp or joint pain"
          value={pain === null ? null : pain ? 'yes' : 'no'}
          onChange={(v) => setPain(v === 'yes')}
          options={[
            { value: 'no', label: 'No' },
            { value: 'yes', label: 'Yes' },
          ]}
        />
      </fieldset>
      <Button
        variant="primary"
        block
        disabled={!ready}
        loading={busy}
        onClick={() => ready && onSubmit({ sleep, energy, soreness, pain })}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
