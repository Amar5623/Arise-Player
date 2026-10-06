import { CaretLeft } from '@phosphor-icons/react';
import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { completeOnboarding } from '@/app/commands/onboarding';
import { useToday } from '@/app/stores/clock';
import { AppMark } from '@/components/system/AppMark';
import { SystemWindow } from '@/components/system/SystemWindow';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { CtaDock } from '@/components/ui/CtaDock';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Pips } from '@/components/ui/Pips';
import { Segmented } from '@/components/ui/Segmented';
import { XpChip } from '@/components/ui/XpChip';
import { HABITS, habitXp, tierValue, type HabitDef } from '@/data/habits';
import { LADDER_KEYS, LADDERS } from '@/data/ladders';
import { AREA_LABEL, dailyLoad, LEAN_LIMIT } from '@/engine/quests';
import type { LadderKey } from '@/engine/types';
import { isHHMM, isISODate, weekday } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useOnboarding, type ProfileDraft } from './store';

const TOTAL = 4;

function Progress({ step }: { step: number }) {
  return (
    <div
      className="flex flex-col gap-2"
      role="progressbar"
      aria-label="Setup progress"
      aria-valuemin={1}
      aria-valuemax={TOTAL}
      aria-valuenow={step}
      aria-valuetext={`Step ${step} of ${TOTAL}`}
    >
      <p className="hud-11 text-ink-3" aria-hidden>
        Step <span className="num text-ink">{step}</span> of {TOTAL}
      </p>
      <div className="flex h-1 gap-1" aria-hidden>
        {Array.from({ length: TOTAL }, (_, i) => (
          <span
            key={i}
            className={cn('h-full flex-1 rounded-mark', i < step ? 'bg-sys' : 'bg-s3')}
          />
        ))}
      </div>
    </div>
  );
}

export function OnboardingScreen() {
  const step = Math.min(TOTAL, Math.max(1, Number(useParams().step) || 1));
  const navigate = useNavigate();
  const go = (n: number) => navigate(`/onboarding/${n}`);

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center gap-2 px-2 pt-[calc(12px+var(--safe-top))]">
        {step > 1 ? (
          <IconButton label="Back" onClick={() => go(step - 1)}>
            <CaretLeft />
          </IconButton>
        ) : (
          <span className="size-11" />
        )}
        <div className="flex-1 pr-4">
          <Progress step={step} />
        </div>
      </div>
      <main
        key={step}
        className="page-enter flex flex-1 flex-col"
        style={{ '--enter-x': '24px' } as CSSProperties}
      >
        {step === 1 && <Awaken onAccept={() => go(2)} />}
        {step === 2 && <ProfileStep onNext={() => go(3)} />}
        {step === 3 && <LadderStep onNext={() => go(4)} />}
        {step === 4 && <QuestStep />}
      </main>
    </div>
  );
}

/* (a) The System notice. */
function Awaken({ onAccept }: { onAccept: () => void }) {
  const [declined, setDeclined] = useState(false);
  return (
    <div className="flex flex-1 flex-col justify-end gap-8 px-4 pt-10 pb-[calc(24px+var(--safe-bottom))]">
      <h1 className="sr-only">Become a Player</h1>
      <AppMark size={56} />
      <SystemWindow label="Notification" reveal>
        <p className="text-22 font-medium text-ink">
          You have met the conditions to become a Player.
        </p>
        <p className="pt-3 text-15 text-ink-2">
          The System will issue daily quests, set every training session and track six stats.
          Unfinished days carry penalties.
        </p>
        <p className="pt-5 hud-17 text-sys">Accept?</p>
      </SystemWindow>
      <div className="flex flex-col gap-2">
        <Button variant="primary" size="lg" block onClick={onAccept}>
          Accept
        </Button>
        <Button variant="ghost" block onClick={() => setDeclined(true)}>
          Not yet
        </Button>
        {declined && (
          <p role="status" className="text-center text-13 text-ink-3">
            The System will wait.
          </p>
        )}
      </div>
    </div>
  );
}

/* (b) Profile. */
function validateProfile(p: ProfileDraft) {
  const num = (s: string) => Number(s.replace(',', '.'));
  return {
    name: p.name.trim() ? undefined : 'The System needs a name.',
    weightKg:
      Number.isFinite(num(p.weightKg)) && num(p.weightKg) >= 30 && num(p.weightKg) <= 250
        ? undefined
        : 'Kilograms, between 30 and 250.',
    heightCm:
      Number.isFinite(num(p.heightCm)) && num(p.heightCm) >= 120 && num(p.heightCm) <= 230
        ? undefined
        : 'Centimetres, between 120 and 230.',
    wake: isHHMM(p.wake) ? undefined : 'Use 24-hour time, like 06:30.',
    programStart:
      isISODate(p.programStart) && weekday(p.programStart) === 0 ? undefined : 'Pick a Monday.',
    saveWeekly:
      Number.isFinite(num(p.saveWeekly)) && num(p.saveWeekly) >= 0
        ? undefined
        : 'Enter an amount, or 0.',
  };
}

function ProfileStep({ onNext }: { onNext: () => void }) {
  const { profile, setProfile } = useOnboarding();
  const [touched, setTouched] = useState(false);
  const errors = validateProfile(profile);
  const valid = Object.values(errors).every((e) => !e);
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);

  return (
    <>
      <div className="flex flex-col gap-5 px-4 pt-6 pb-[calc(var(--cta-h)+48px)]">
        <div className="flex flex-col gap-1">
          <h1 className="hud-22 text-ink">Player profile</h1>
          <p className="text-15 text-ink-2">
            Used for protein targets, bedtime and the training calendar.
          </p>
        </div>
        <Field
          label="Name"
          autoComplete="given-name"
          value={profile.name}
          onChange={(e) => setProfile({ name: e.target.value })}
          error={show('name')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Weight"
            unit="kg"
            mono
            inputMode="decimal"
            value={profile.weightKg}
            onChange={(e) => setProfile({ weightKg: e.target.value })}
            error={show('weightKg')}
          />
          <Field
            label="Height"
            unit="cm"
            mono
            inputMode="decimal"
            value={profile.heightCm}
            onChange={(e) => setProfile({ heightCm: e.target.value })}
            error={show('heightCm')}
          />
        </div>
        <Field
          label="Wake time"
          type="time"
          mono
          value={profile.wake}
          onChange={(e) => setProfile({ wake: e.target.value })}
          error={show('wake')}
          helper="Bedtime quests count back 8 hours from this."
        />
        <Field
          label="Program start"
          type="date"
          mono
          value={profile.programStart}
          onChange={(e) => setProfile({ programStart: e.target.value })}
          error={show('programStart')}
          helper="A Monday. Deload weeks count from here."
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-13 font-medium text-ink-2">Currency</legend>
          <Segmented
            label="Currency"
            value={profile.currency}
            onChange={(v) => setProfile({ currency: v })}
            options={['₹', '$', '€', '£'].map((c) => ({ value: c, label: c }))}
          />
        </fieldset>
        <Field
          label="Pay yourself first, weekly"
          unit={profile.currency}
          mono
          inputMode="numeric"
          value={profile.saveWeekly}
          onChange={(e) => setProfile({ saveWeekly: e.target.value })}
          error={show('saveWeekly')}
          helper="Monday's savings quest moves this amount."
        />
      </div>
      <CtaDock overTabs={false}>
        <Button
          variant="primary"
          size="lg"
          block
          aria-disabled={!valid || undefined}
          onClick={() => {
            setTouched(true);
            if (valid) onNext();
          }}
        >
          Next
        </Button>
      </CtaDock>
    </>
  );
}

/* (c) Starting point on each ladder. */
function LadderStep({ onNext }: { onNext: () => void }) {
  const { steps, setStep } = useOnboarding();
  return (
    <>
      <div className="flex flex-col gap-6 px-4 pt-6 pb-[calc(var(--cta-h)+48px)]">
        <div className="flex flex-col gap-1">
          <h1 className="hud-22 text-ink">Starting point</h1>
          <p className="text-15 text-ink-2">
            Pick the hardest step you can do cleanly for most of its range. The System moves you up
            from there.
          </p>
        </div>
        {LADDER_KEYS.map((k) => (
          <LadderPicker key={k} ladder={k} value={steps[k]} onChange={(s) => setStep(k, s)} />
        ))}
      </div>
      <CtaDock overTabs={false}>
        <Button variant="primary" size="lg" block onClick={onNext}>
          Next
        </Button>
      </CtaDock>
    </>
  );
}

function LadderPicker({
  ladder,
  value,
  onChange,
}: {
  ladder: LadderKey;
  value: number;
  onChange: (step: number) => void;
}) {
  const l = LADDERS[ladder];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = l.steps.length;
    let next: number;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = value === last ? 1 : value + 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = value === 1 ? last : value - 1;
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    onChange(next);
    refs.current[next - 1]?.focus();
  };
  return (
    <section aria-labelledby={`l-${ladder}`} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 id={`l-${ladder}`} className="hud-13 text-ink-2">
          {l.name} ladder
        </h2>
        <Pips total={l.steps.length} current={value} label={`${l.name} ladder`} />
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`l-${ladder}`}
        onKeyDown={onKey}
        className="divide-y divide-line overflow-hidden rounded-card border border-line-2 bg-s1"
      >
        {l.steps.map((s, i) => {
          const n = i + 1;
          const on = n === value;
          const unit = s.unit === 'sec' ? 's' : 'reps';
          return (
            <button
              key={s.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(n)}
              className={cn(
                'relative flex min-h-12 w-full tap items-start gap-3 px-3 py-3 text-left transition-colors duration-(--dur-1) outline-offset-[-2px]',
                on ? 'bg-sys-dim' : 'hover:bg-s2 active:bg-s3',
              )}
            >
              {on && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-sys" />}
              <span className={cn('w-5 shrink-0 num text-15', on ? 'text-sys' : 'text-ink-3')}>
                {n}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn('text-15 text-ink', on && 'font-medium')}>{s.name}</span>
                  <span className="shrink-0 num text-13 text-ink-2">
                    {s.range[0]}-{s.range[1]} {unit}
                    {s.perSide ? '/side' : ''}
                  </span>
                </span>
                {on && <span className="text-13 text-ink-2">{s.howTo}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* (d) Daily quests. */
const SCHEDULE_NOTE: Partial<Record<HabitDef['schedule'], string>> = {
  sunday: 'Sundays',
  monday: 'Mondays',
  'first-sunday': 'First Sunday of the month',
};

function QuestStep() {
  const today = useToday();
  const navigate = useNavigate();
  const { profile, steps, habits, toggleHabit } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const load = dailyLoad(habits);
  const over = load > LEAN_LIMIT;
  const ctx = {
    weightKg: Number(profile.weightKg) || 75,
    wake: profile.wake,
    currency: profile.currency,
    saveWeekly: Number(profile.saveWeekly) || 0,
  };
  const areas = ['face', 'diet', 'body', 'mind', 'wealth'] as const;

  const finish = async () => {
    setSaving(true);
    await completeOnboarding(
      {
        profile: {
          name: profile.name.trim(),
          weightKg: Number(profile.weightKg.replace(',', '.')),
          heightCm: Number(profile.heightCm.replace(',', '.')),
          wake: profile.wake,
          programStart: profile.programStart,
          currency: profile.currency,
          saveWeekly: Number(profile.saveWeekly) || 0,
        },
        steps,
        habits,
      },
      today,
    );
    navigate('/today', { replace: true });
  };

  return (
    <>
      <div className="flex flex-col gap-4 px-4 pt-6 pb-[calc(var(--cta-h)+48px)]">
        <div className="flex flex-col gap-1">
          <h1 className="hud-22 text-ink">Daily quests</h1>
          <p className="text-15 text-ink-2">
            Defaults are picked. Tiered quests get harder on their own when you keep them up.
          </p>
        </div>
        <div className="sticky top-0 z-(--z-sticky) -mx-4 flex items-center justify-between border-b border-line bg-base/92 px-4 py-2 backdrop-blur-bar">
          <span className="text-13 text-ink-2">Quests on a typical day, Gate included</span>
          <span className={cn('num text-17', over ? 'text-warn' : 'text-ink')}>
            {load}
            <span className="text-ink-3">/{LEAN_LIMIT}</span>
          </span>
        </div>
        {over && (
          <SystemWindow tone="warn" label="Warning" as="h2">
            <p className="text-15 font-medium text-ink">Start lean. Difficulty rises on its own.</p>
            <p className="text-13 text-ink-2">
              More than {LEAN_LIMIT} daily quests makes the first weeks harder to finish.
            </p>
          </SystemWindow>
        )}
        {areas.map((area) => (
          <section key={area} aria-labelledby={`a-${area}`} className="flex flex-col">
            <h2 id={`a-${area}`} className="pt-2 pb-1 hud-13 text-ink-2">
              {AREA_LABEL[area]}
            </h2>
            <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-s1">
              {HABITS.filter((h) => h.area === area).map((h) => {
                const t = tierValue(h, 1);
                const on = habits.includes(h.id);
                const note = SCHEDULE_NOTE[h.schedule];
                return (
                  <div
                    key={h.id}
                    className="flex min-h-14 cursor-pointer tap items-center gap-1 pr-3"
                    onClick={() => toggleHabit(h.id)}
                  >
                    <span onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={on}
                        label={h.title(t, ctx)}
                        onChange={() => toggleHabit(h.id)}
                      />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col py-2">
                      <span className="text-15 text-ink">{h.title(t, ctx)}</span>
                      <span className="text-13 text-ink-2">
                        {note ?? h.detail(t, ctx)}
                        {h.tiers ? (
                          <span className="text-ink-3"> · {h.tiers.length} tiers</span>
                        ) : null}
                      </span>
                    </span>
                    <XpChip xp={habitXp(h, 1)} stat={h.stat} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <CtaDock overTabs={false}>
        <Button
          variant="primary"
          size="lg"
          block
          loading={saving}
          disabled={habits.length === 0}
          onClick={() => void finish()}
        >
          Become a Player
        </Button>
      </CtaDock>
    </>
  );
}
