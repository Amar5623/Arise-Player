import {
  ArrowClockwise,
  Barbell,
  BellSimple,
  CaretLeft,
  DotsThreeVertical,
  Drop,
  FirstAidKit,
  Gear,
  Lightning,
  Moon,
  Play,
  Plus,
  Scales,
  Target,
  Warning,
} from '@phosphor-icons/react';
import { useState, type ReactNode } from 'react';
import { TabBar } from '@/app/TabBar';
import { toast } from '@/app/stores/toasts';
import { Heatmap, type HeatCell } from '@/components/charts/Heatmap';
import { LineChart } from '@/components/charts/LineChart';
import { Radar } from '@/components/charts/Radar';
import { RestRing } from '@/components/charts/RestRing';
import { Sparkline } from '@/components/charts/Sparkline';
import { AppMark } from '@/components/system/AppMark';
import { LevelUpTakeover, type LevelUpData } from '@/components/system/LevelUpTakeover';
import { QuestRow } from '@/components/system/QuestRow';
import { RankBadge } from '@/components/system/RankBadge';
import { ScanLoader } from '@/components/system/ScanLoader';
import { StatMark } from '@/components/system/StatMark';
import { SystemWindow } from '@/components/system/SystemWindow';
import { ToastFrame } from '@/components/system/ToastHost';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CtaDock } from '@/components/ui/CtaDock';
import { Checkbox } from '@/components/ui/Checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { QuestMeter, XpBar } from '@/components/ui/Meter';
import { Pips } from '@/components/ui/Pips';
import { SectionHead } from '@/components/ui/SectionHead';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Stepper } from '@/components/ui/Stepper';
import { Switch } from '@/components/ui/Switch';
import { XpChip } from '@/components/ui/XpChip';
import { STAT_KEYS, type Rank } from '@/engine/types';
import { haptic } from '@/lib/haptics';
import { play, type SoundName } from '@/lib/sound';

/* Sample values for the component reference only. Never shown in the app. */
const SAMPLE_STATS = { STR: 18, AGI: 15, VIT: 21, INT: 24, CHA: 13, WLT: 16 } as const;
const SAMPLE_WEIGHT = [
  { label: '7 Sep', value: 78.6 },
  { label: '14 Sep', value: 78.1 },
  { label: '21 Sep', value: 78.3 },
  { label: '28 Sep', value: 77.6 },
  { label: '5 Oct', value: 77.2 },
];
const SAMPLE_HEAT: HeatCell[] = Array.from({ length: 84 }, (_, i) => {
  const d = new Date(2026, 6, 13 + i);
  const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const date = `2026-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (i < 9 || i > 79) return { date, label, ratio: null };
  const seq = [
    0.83, 0.92, 0.58, 1, 0.75, 0.33, 0, 0.92, 0.67, 0.83, 0.5, 0.92, 0, 1, 0.75, 0.83, 0.42,
  ];
  const ratio = seq[i % seq.length] ?? 0;
  return { date, label, ratio, done: Math.round(ratio * 12), total: 12, today: i === 79 };
});

const RANKS: readonly Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];
const SOUNDS: readonly SoundName[] = ['tick', 'clear', 'level', 'warn', 'chime'];

function Block({ title, children, note }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHead>{title}</SectionHead>
      {note && <p className="-mt-2 text-13 text-ink-3">{note}</p>}
      {children}
    </section>
  );
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {children}
      <span className="num text-11 text-ink-3">{label}</span>
    </div>
  );
}

function Swatch({ name, value, text }: { name: string; value: string; text?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="size-8 shrink-0 rounded-mark border border-line-2"
        style={{ background: value }}
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate num text-13 text-ink">{name}</span>
        {text !== undefined && (
          <span className="text-11 text-ink-3">{text ? 'Text' : 'Marks only'}</span>
        )}
      </span>
    </div>
  );
}

export function KitScreen() {
  const [rpe, setRpe] = useState<number | null>(8);
  const [mode, setMode] = useState<'full' | 'quick'>('full');
  const [reps, setReps] = useState(11);
  const [on, setOn] = useState(true);
  const [sleep, setSleep] = useState(7);
  const [floor, setFloor] = useState(0);
  const [checked, setChecked] = useState(false);
  const [quests, setQuests] = useState({ skin: true, protein: false, read: false, penalty: true });
  const [sheet, setSheet] = useState(false);
  const [levelUp, setLevelUp] = useState<LevelUpData | null>(null);
  const [still] = useState(() => new URLSearchParams(location.search).has('still'));
  const [restEnds, setRestEnds] = useState<number | null>(() =>
    still ? null : Date.now() + 90_000,
  );

  const done = Object.values(quests).filter(Boolean).length + 1;

  return (
    <div className="pb-[calc(var(--tabbar-h)+var(--safe-bottom)+var(--cta-h)+48px)]">
      <header className="flex items-center gap-3 px-4 pt-[calc(20px+var(--safe-top))] pb-2">
        <AppMark size={36} />
        <div className="flex flex-col">
          <h1 className="hud-22 text-ink">Component kit</h1>
          <p className="text-13 text-ink-2">Every primitive, every state. Unlinked.</p>
        </div>
      </header>

      <main className="flex flex-col gap-2 px-4">
        <Block title="Colour">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Swatch name="base" value="var(--color-base)" />
            <Swatch name="s1" value="var(--color-s1)" />
            <Swatch name="s2" value="var(--color-s2)" />
            <Swatch name="s3" value="var(--color-s3)" />
            <Swatch name="ink" value="var(--color-ink)" text />
            <Swatch name="ink-2" value="var(--color-ink-2)" text />
            <Swatch name="ink-3" value="var(--color-ink-3)" text />
            <Swatch name="ink-4" value="var(--color-ink-4)" text={false} />
            <Swatch name="sys" value="var(--color-sys)" />
            <Swatch name="ok" value="var(--color-ok)" />
            <Swatch name="warn" value="var(--color-warn)" />
            <Swatch name="bad" value="var(--color-bad)" />
            <Swatch name="rare" value="var(--color-rare)" />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {STAT_KEYS.map((s) => (
              <StatMark key={s} stat={s} />
            ))}
          </div>
        </Block>

        <Block title="Type">
          <div className="flex flex-col gap-3">
            <p className="num text-64 leading-none font-medium tracking-tight">
              17<span className="text-ink-3">/64</span>
            </p>
            <p className="num text-40 font-medium tracking-tight">
              4<span className="mx-2 font-sans text-28 text-ink-3">×</span>11
            </p>
            <p className="hud-28">E-rank gate</p>
            <p className="hud-22">Push + Core</p>
            <p className="text-17 font-semibold">Pike push-up</p>
            <p className="text-15">Hips high, elbows track back not out.</p>
            <p className="text-13 text-ink-2">3 sets of 6-10 reps, 90 s rest</p>
            <p className="hud-11 text-ink-2">Display micro-label, 11</p>
          </div>
        </Block>

        <Block title="Buttons" note="Hover, pressed and focus are forced in screenshots.">
          <div className="grid grid-cols-2 gap-3">
            <State label="primary">
              <Button variant="primary" icon={<Play weight="fill" />}>
                Start Gate
              </Button>
            </State>
            <State label="primary · hover">
              <Button variant="primary" data-kit-state="hover">
                Start Gate
              </Button>
            </State>
            <State label="primary · pressed">
              <Button variant="primary" data-kit-state="active">
                Start Gate
              </Button>
            </State>
            <State label="primary · focus">
              <Button variant="primary" data-kit-state="focus-visible">
                Start Gate
              </Button>
            </State>
            <State label="primary · loading">
              <Button variant="primary" loading>
                Asking
              </Button>
            </State>
            <State label="primary · disabled">
              <Button variant="primary" disabled>
                Start Gate
              </Button>
            </State>
            <State label="secondary">
              <Button icon={<Scales />}>Log body</Button>
            </State>
            <State label="secondary · hover">
              <Button data-kit-state="hover">Log body</Button>
            </State>
            <State label="ghost">
              <Button variant="ghost">Skip</Button>
            </State>
            <State label="ghost · disabled">
              <Button variant="ghost" disabled>
                Skip
              </Button>
            </State>
            <State label="danger">
              <Button variant="danger" icon={<FirstAidKit />}>
                Pain
              </Button>
            </State>
            <State label="danger · disabled">
              <Button variant="danger" disabled>
                Pain
              </Button>
            </State>
          </div>
          <Button variant="primary" size="lg" block icon={<Play weight="fill" />}>
            Start Gate
          </Button>
          <div className="flex items-end gap-2">
            <State label="icon">
              <IconButton label="Settings">
                <Gear />
              </IconButton>
            </State>
            <State label="hover">
              <IconButton label="Back" data-kit-state="hover">
                <CaretLeft />
              </IconButton>
            </State>
            <State label="bordered">
              <IconButton label="More" bordered>
                <DotsThreeVertical />
              </IconButton>
            </State>
            <State label="sys">
              <IconButton label="Add" tone="sys">
                <Plus />
              </IconButton>
            </State>
            <State label="disabled">
              <IconButton label="Refresh" disabled>
                <ArrowClockwise />
              </IconButton>
            </State>
          </div>
        </Block>

        <Block title="Checks and quests">
          <div className="flex items-end gap-4">
            <State label="off">
              <Checkbox checked={checked} onChange={setChecked} label="Sample" />
            </State>
            <State label="on">
              <Checkbox checked onChange={() => undefined} label="Sample on" />
            </State>
            <State label="focus">
              <span data-kit-state="focus-visible">
                <Checkbox checked={false} label="Sample focus" />
              </span>
            </State>
            <State label="penalty">
              <Checkbox checked tone="bad" label="Penalty on" />
            </State>
            <State label="disabled">
              <Checkbox checked={false} disabled label="Disabled" />
            </State>
          </div>
          <SystemWindow
            label="Daily quest"
            aside={<span className="num text-13 text-ink-2">[{done}/5]</span>}
            padded={false}
          >
            <div className="px-4 pb-3">
              <QuestMeter done={done} total={5} />
            </div>
            <p className="px-4 pt-2 hud-11 text-ink-3">Training</p>
            <QuestRow
              title="Gate: Push + Core"
              detail="6 exercises, about 45 min"
              xp={121}
              stat="STR"
              done
              onOpen={() => undefined}
            />
            <p className="px-4 pt-3 hud-11 text-bad">Penalty</p>
            <QuestRow
              title="20-min brisk walk"
              detail="Yesterday closed under 50%."
              xp={10}
              stat="AGI"
              tone="bad"
              done={quests.penalty}
              onToggle={(v) => setQuests((q) => ({ ...q, penalty: v }))}
            />
            <p className="px-4 pt-3 hud-11 text-ink-3">Face & looks</p>
            <QuestRow
              title="AM skincare"
              detail="Cleanse, moisturise, SPF 30+"
              xp={8}
              stat="CHA"
              done={quests.skin}
              onToggle={(v) => setQuests((q) => ({ ...q, skin: v }))}
            />
            <p className="px-4 pt-3 hud-11 text-ink-3">Diet & recovery</p>
            <QuestRow
              title="Protein 110 g"
              detail="Eggs, dal, paneer, curd, chicken, soya"
              xp={14}
              stat="VIT"
              done={quests.protein}
              onToggle={(v) => setQuests((q) => ({ ...q, protein: v }))}
            />
            <p className="px-4 pt-3 hud-11 text-ink-3">Mind</p>
            <QuestRow
              title="Read 15 pages"
              xp={14}
              stat="INT"
              optional
              done={quests.read}
              onToggle={(v) => setQuests((q) => ({ ...q, read: v }))}
            />
            <QuestRow title="Journal 3 lines" xp={6} stat="INT" done={false} disabled />
          </SystemWindow>
        </Block>

        <Block title="Badges and chips">
          <div className="flex flex-wrap gap-2">
            <Badge tone="ok" icon={<Lightning weight="fill" />}>
              Optimal
            </Badge>
            <Badge tone="warn" icon={<Moon weight="fill" />}>
              Fatigued
            </Badge>
            <Badge tone="bad" icon={<FirstAidKit weight="fill" />}>
              Injured
            </Badge>
            <Badge>Deload</Badge>
            <Badge tone="warn">Recovery</Badge>
            <Badge tone="rare">Skill unlocked</Badge>
            <Badge>Week 1</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {STAT_KEYS.map((s, i) => (
              <XpChip key={s} xp={[24, 12, 8, 15, 8, 20][i] ?? 0} stat={s} />
            ))}
            <XpChip xp={30} stat={null} done />
          </div>
        </Block>

        <Block title="Controls">
          <State label="segmented · RPE">
            <Segmented
              label="RPE"
              mono
              className="w-full"
              value={rpe}
              onChange={setRpe}
              options={[6, 7, 8, 9, 10].map((v) => ({ value: v, label: String(v) }))}
            />
          </State>
          <State label="segmented · mode">
            <Segmented
              label="Session length"
              className="w-full"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'full', label: 'Full session' },
                { value: 'quick', label: 'Short, 30 min' },
              ]}
            />
          </State>
          <State label="segmented · disabled">
            <Segmented
              label="Disabled"
              className="w-full"
              value="a"
              disabled
              onChange={() => undefined}
              options={[
                { value: 'a', label: 'Monthly' },
                { value: 'b', label: 'Every 2 months' },
              ]}
            />
          </State>
          <State label="segmented · focus">
            <span data-kit-state="focus-visible" className="block w-full">
              <Segmented
                label="Energy"
                mono
                className="w-full"
                value={3}
                onChange={() => undefined}
                options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))}
              />
            </span>
          </State>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <Switch label="Sound" checked={on} onChange={setOn} />
            <Switch label="Haptics" checked={!on} onChange={(v) => setOn(!v)} />
            <span data-kit-state="focus-visible">
              <Switch label="Focus" checked={false} onChange={() => undefined} />
            </span>
            <Switch label="AI" checked={false} disabled onChange={() => undefined} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2 rounded-card border border-line bg-s1 px-3 py-4">
              <span className="text-13 font-medium text-ink-2">Sleep · md</span>
              <Stepper
                size="md"
                label="Sleep"
                value={sleep}
                onChange={setSleep}
                min={3}
                max={12}
                step={0.5}
                unit="hours"
              />
            </div>
            <div className="flex flex-col gap-2 rounded-card border border-line bg-s1 px-3 py-4">
              <span className="text-13 font-medium text-ink-2">At minimum</span>
              <Stepper
                size="md"
                label="Extra sets"
                value={floor}
                onChange={setFloor}
                min={0}
                max={5}
                unit="sets"
              />
            </div>
          </div>
          <div className="rounded-card border border-line bg-s1 px-4 py-5">
            <Stepper
              label="Reps, set 2"
              value={reps}
              onChange={setReps}
              min={0}
              max={60}
              unit="reps"
            />
          </div>
        </Block>

        <Block title="Fields">
          <Field label="Body weight" unit="kg" mono inputMode="decimal" defaultValue="77.2" />
          <Field
            label="Name"
            placeholder="What the System calls you"
            helper="Shown on your status window."
          />
          <div data-kit-state="focus-within">
            <Field label="Waist · focus" unit="cm" mono inputMode="decimal" defaultValue="84" />
          </div>
          <Field
            label="Wake time"
            mono
            defaultValue="25:10"
            error="Use 24-hour time, like 06:30."
          />
          <Field label="Currency" defaultValue="₹" disabled helper="Set during setup." />
        </Block>

        <Block title="Progress">
          <div className="flex flex-col gap-4 rounded-card border border-line bg-s1 p-4">
            <State label="quest meter · 0/12">
              <QuestMeter done={0} total={12} className="w-full" />
            </State>
            <State label="quest meter · 7/12">
              <QuestMeter done={7} total={12} className="w-full" />
            </State>
            <State label="quest meter · 12/12">
              <QuestMeter done={12} total={12} className="w-full" />
            </State>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="hud-11 text-ink-2">Level 7</span>
                <span className="num text-13 text-ink-2">
                  <span className="text-ink">214</span> / 340 XP
                </span>
              </div>
              <XpBar into={214} next={340} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-15">Push ladder</span>
              <Pips total={5} current={2} label="Push ladder" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-15">Squat ladder</span>
              <Pips total={6} current={1} label="Squat ladder" />
            </div>
          </div>
        </Block>

        <Block
          title="Shell"
          note="Tab bar with Today active, and the sticky action dock that sits above it."
        >
          <div className="overflow-hidden rounded-card border border-line">
            <CtaDock preview>
              <Button variant="primary" size="lg" block icon={<Play weight="fill" />}>
                Start Gate
              </Button>
            </CtaDock>
            <TabBar preview="/today" />
          </div>
        </Block>

        <Block title="Lists">
          <ListGroup>
            <ListRow
              leading={<Barbell />}
              title="Exercise history"
              detail="Last 10 sessions"
              onClick={() => undefined}
            />
            <ListRow
              leading={<Drop />}
              title="Water"
              detail="T2 · 2.5 L"
              trailing={<Switch label="Water" hideLabel checked onChange={() => undefined} />}
              chevron={false}
            />
            <span data-kit-state="active" className="contents">
              <ListRow
                leading={<BellSimple />}
                title="Sound · pressed"
                trailing={<span className="text-13">Off</span>}
                onClick={() => undefined}
              />
            </span>
            <ListRow
              leading={<Warning />}
              title="Reset all data"
              detail="Asks you to type RESET"
              disabled
              onClick={() => undefined}
            />
          </ListGroup>
        </Block>

        <Block title="Empty and loading">
          <EmptyState
            icon={<Target weight="thin" />}
            title="No main quests yet"
            body="Long-term goals live here: an emergency fund, your first strict pull-up, a waist target."
            action={
              <Button icon={<Plus />} variant="secondary">
                New main quest
              </Button>
            }
          />
          <div className="flex flex-col gap-2 rounded-card border border-line bg-s1 p-4" aria-busy>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-1 w-full" />
          </div>
          <ScanLoader />
        </Block>

        <Block title="System windows">
          <SystemWindow label="Notification" reveal>
            <p className="text-17 font-medium">Daily quest has arrived.</p>
            <p className="text-13 text-ink-2">
              Complete every quest before midnight. Unfinished quests count against you.
            </p>
          </SystemWindow>
          <SystemWindow tone="warn" label="Recovery mode">
            <p className="text-15 font-medium">Condition: fatigued.</p>
            <p className="text-13 text-ink-2">
              One fewer set on every exercise. Keep RPE at 7 or below.
            </p>
          </SystemWindow>
          <SystemWindow tone="bad" label="Penalty issued">
            <p className="text-15 font-medium">Yesterday closed at 42%.</p>
            <p className="text-13 text-ink-2">Penalty quest added: 20-min brisk walk.</p>
          </SystemWindow>
          <SystemWindow tone="rare" label="Skill unlocked">
            <p className="text-15 font-medium">Incline push-up.</p>
            <p className="text-13 text-ink-2">Target reset to 6 reps. +60 XP.</p>
          </SystemWindow>
          <SystemWindow tone="ok" label="Daily quest complete">
            <p className="text-15 font-medium">All quests cleared. +30 XP.</p>
          </SystemWindow>
        </Block>

        <Block title="Toasts">
          <ToastFrame
            toast={{
              id: 'a',
              tone: 'sys',
              label: 'Notification',
              message: 'Quest difficulty up.',
              detail: 'Read: 15 pages a day.',
            }}
            onDismiss={() => undefined}
          />
          <ToastFrame
            toast={{
              id: 'b',
              tone: 'warn',
              label: 'AI locked',
              message: 'Set the passcode in Settings.',
              action: { label: 'Open', run: () => undefined },
            }}
            onDismiss={() => undefined}
          />
          <ToastFrame
            toast={{
              id: 'c',
              tone: 'sys',
              label: 'Update',
              message: 'New version available.',
              action: { label: 'Reload', run: () => undefined },
              persist: true,
            }}
            onDismiss={() => undefined}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() =>
                toast({ tone: 'sys', label: 'Notification', message: 'Daily quest has arrived.' })
              }
            >
              Toast
            </Button>
            <Button
              onClick={() => {
                haptic('warn');
                play('warn');
                toast({
                  tone: 'bad',
                  label: 'Penalty issued',
                  message: 'Yesterday closed at 42%.',
                  detail: 'Penalty quest added.',
                });
              }}
            >
              Penalty toast
            </Button>
          </div>
        </Block>

        <Block title="Ranks and mark">
          <div className="flex items-center justify-between">
            {RANKS.map((r) => (
              <RankBadge key={r} rank={r} size="md" />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <RankBadge rank="C" size="lg" />
            <AppMark size={88} />
          </div>
        </Block>

        <Block title="Charts" note="Sample values.">
          <div className="flex justify-center rounded-card border border-line bg-s1 py-2">
            <Radar values={SAMPLE_STATS} />
          </div>
          <div className="rounded-card border border-line bg-s1 p-4">
            <p className="pb-3 text-15">Weight</p>
            <LineChart points={SAMPLE_WEIGHT} unit="kg" title="Weight" digits={1} />
          </div>
          <div className="flex items-center justify-between rounded-card border border-line bg-s1 p-4">
            <div className="flex flex-col">
              <span className="text-13 text-ink-2">INT, 30 days</span>
              <span className="num text-28 font-medium">24</span>
            </div>
            <Sparkline
              values={[10, 11, 11, 13, 14, 14, 16, 18, 19, 21, 22, 24]}
              label="INT trend"
            />
          </div>
          <div className="rounded-card border border-line bg-s1 p-4">
            <Heatmap cells={SAMPLE_HEAT} />
          </div>
          <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-s1 py-6">
            <RestRing total={90} endsAt={restEnds} remaining={47} />
            <Button variant="ghost" onClick={() => setRestEnds(Date.now() + 90_000)}>
              Restart
            </Button>
          </div>
        </Block>

        <Block title="Overlays and feedback">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setSheet(true)}>Open sheet</Button>
            <Button
              onClick={() => {
                haptic('level');
                play('level');
                setLevelUp({
                  from: 9,
                  to: 10,
                  rankFrom: 'E',
                  rankTo: 'D',
                  deltas: [
                    { stat: 'STR', amount: 2 },
                    { stat: 'AGI', amount: 1 },
                    { stat: 'VIT', amount: 1 },
                    { stat: 'INT', amount: 2 },
                  ],
                });
              }}
            >
              Level up
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SOUNDS.map((s) => (
              <Button key={s} variant="ghost" onClick={() => play(s, true)}>
                <span className="num">{s}</span>
              </Button>
            ))}
          </div>
        </Block>
      </main>

      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        title="Log body"
        description="Morning, before food. Waist at navel height."
        footer={
          <Button variant="primary" block size="lg" onClick={() => setSheet(false)}>
            Save
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Weight" unit="kg" mono inputMode="decimal" />
          <Field label="Waist" unit="cm" mono inputMode="decimal" />
          <Field label="Hips" unit="cm" mono inputMode="decimal" />
        </div>
      </Sheet>
      <LevelUpTakeover data={levelUp} onDone={() => setLevelUp(null)} />
      <CtaDock>
        <Button variant="primary" size="lg" block icon={<Play weight="fill" />}>
          Start Gate
        </Button>
      </CtaDock>
      <TabBar />
    </div>
  );
}
