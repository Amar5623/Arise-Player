import { useState } from 'react';
import { logBody } from '@/app/commands/records';
import { useToday } from '@/app/stores/clock';
import { toast } from '@/app/stores/toasts';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { useBody } from '@/db/hooks';

const parse = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return s.trim() === '' || !Number.isFinite(n) ? undefined : n;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

/** Weigh-in: weight, waist, hips. Any one field is enough. */
export function BodyLogSheet({ open, onOpenChange, onDone }: Props) {
  const today = useToday();
  const body = useBody();
  const last = body?.[body.length - 1];
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [saving, setSaving] = useState(false);

  const w = parse(weight);
  const wa = parse(waist);
  const h = parse(hips);
  const bad = (v: number | undefined, lo: number, hi: number) =>
    v !== undefined && (v < lo || v > hi);
  const errors = {
    weight: bad(w, 30, 250) ? 'Enter kilograms between 30 and 250.' : undefined,
    waist: bad(wa, 40, 200) ? 'Enter centimetres between 40 and 200.' : undefined,
    hips: bad(h, 40, 200) ? 'Enter centimetres between 40 and 200.' : undefined,
  };
  const valid = (w ?? wa ?? h) !== undefined && !errors.weight && !errors.waist && !errors.hips;

  const save = async () => {
    setSaving(true);
    await logBody({ date: today, weightKg: w, waistCm: wa, hipsCm: h }, today);
    setSaving(false);
    setWeight('');
    setWaist('');
    setHips('');
    toast({ tone: 'sys', label: 'Body log', message: 'Measurements recorded.' });
    onDone();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Log body"
      description="Morning, before food. Waist at navel height, hips at the widest point."
      footer={
        <Button
          variant="primary"
          size="lg"
          block
          disabled={!valid}
          loading={saving}
          onClick={() => void save()}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Weight"
          unit="kg"
          mono
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={last?.weightKg ? `Last ${last.weightKg}` : undefined}
          error={errors.weight}
        />
        <Field
          label="Waist"
          unit="cm"
          mono
          inputMode="decimal"
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
          placeholder={last?.waistCm ? `Last ${last.waistCm}` : undefined}
          error={errors.waist}
        />
        <Field
          label="Hips"
          unit="cm"
          mono
          inputMode="decimal"
          value={hips}
          onChange={(e) => setHips(e.target.value)}
          placeholder={last?.hipsCm ? `Last ${last.hipsCm}` : undefined}
          error={errors.hips}
        />
      </div>
    </Sheet>
  );
}
