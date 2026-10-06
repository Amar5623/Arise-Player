import { motion, useReducedMotion } from 'motion/react';
import { CaretLeft, CaretRight, FirstAidKit, PlayCircle, SunDim, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { clearDraft, draftKey, emptyDraft, type GateDraft } from '@/app/commands/draft';
import { clearGate } from '@/app/commands/gate';
import { useToday } from '@/app/stores/clock';
import { toast } from '@/app/stores/toasts';
import { useSheet } from '@/app/useSheet';
import { RestRing } from '@/components/charts/RestRing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { IconButton } from '@/components/ui/IconButton';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { Stepper } from '@/components/ui/Stepper';
import { youtubeUrl } from '@/data/exercises';
import { anyExercise } from '@/data/ladders';
import { WARMUP } from '@/data/plan';
import type { PrescribedItem, Prescription } from '@/engine/prescription';
import { useDay, useGateDraft, usePrescription } from '@/db/hooks';
import { repo } from '@/db/repos';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { useWakeLock } from '@/lib/wakeLock';
import { EASE_OUT } from '@/lib/motion';
import { doseText } from './dose';

const RPE = [6, 7, 8, 9, 10].map((v) => ({ value: v, label: String(v) }));

export function FocusScreen() {
  const today = useToday();
  const p = usePrescription(today);
  const rec = useDay(today);
  const stored = useGateDraft(today);
  if (p === undefined || rec === undefined || stored === undefined)
    return <div className="min-h-dvh" aria-busy />;
  if (!p || p.rest || rec?.quests.find((q) => q.kind === 'gate')?.done)
    return <Navigate to="/train" replace />;
  return <Focus p={p} draft={stored ?? emptyDraft(today)} />;
}

type Update = (fn: (d: GateDraft) => Partial<GateDraft>) => void;

function Focus({ p, draft: stored }: { p: Prescription; draft: GateDraft }) {
  const navigate = useNavigate();
  // Local state is the truth while training, so a fast second tap sees the first; it persists as it changes.
  const [draft, setDraft] = useState(stored);
  const [cleared, setCleared] = useState(false);
  useEffect(() => {
    if (!cleared) void repo.meta.set(draftKey(p.date), draft);
  }, [draft, p.date, cleared]);
  const update: Update = (fn) => setDraft((cur) => ({ ...cur, ...fn(cur) }));
  const awake = useWakeLock();
  const editSheet = useSheet<{ key: string; set: number }>('set');
  const clearSheet = useSheet('clear');
  const [clearing, setClearing] = useState(false);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const total = p.items.length;
  const index = Math.min(draft.index, total);
  const item = index > 0 ? p.items[index - 1] : undefined;

  const go = (n: number) => {
    setDir(n > index ? 1 : -1);
    update(() => ({ index: Math.max(0, Math.min(total, n)) }));
  };

  const startRest = (seconds: number) => {
    if (seconds <= 0) return;
    update(() => ({ restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }));
  };

  const logSet = (it: PrescribedItem, set: number, value: number | null) => {
    update((d) => {
      const cur = d.logged[it.key] ?? { sets: [], pain: false };
      const sets = Array.from({ length: it.sets }, (_, i) =>
        i === set ? value : (cur.sets[i] ?? null),
      );
      return { logged: { ...d.logged, [it.key]: { ...cur, sets } } };
    });
  };

  const tapSet = (it: PrescribedItem, set: number) => {
    const cur = draft.logged[it.key]?.sets[set] ?? null;
    if (cur === null) {
      logSet(it, set, it.target);
      haptic('tick');
      play('tick');
      const last = set === it.sets - 1;
      startRest(last ? (p.restAfterRound ?? it.rest) : it.rest);
    } else {
      editSheet.show({ key: it.key, set });
    }
  };

  const missing = p.items.filter(
    (it) => !(draft.logged[it.key]?.sets ?? []).some((v) => v !== null),
  );

  const finish = async () => {
    setClearing(true);
    setCleared(true);
    const res = await clearGate(p, draft.logged, draft.warmup);
    await clearDraft(p.date);
    navigate(`/gate/cleared/${res.session.id}`, { replace: true });
  };

  const editing = editSheet.data ? p.items.find((it) => it.key === editSheet.data?.key) : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-1 px-2 pt-[calc(8px+var(--safe-top))]">
        <IconButton label="Leave Focus Mode" onClick={() => navigate('/train')}>
          <X />
        </IconButton>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate hud-13 text-ink">{p.name}</p>
          <p className="text-11 text-ink-3">
            {awake ? 'Screen stays on' : 'Progress saves as you go'}
          </p>
        </div>
        {awake && <SunDim aria-hidden className="mr-1 size-5 text-ink-3" />}
        <p className="mr-3 num text-15 text-ink-2" aria-label={`Exercise ${index} of ${total}`}>
          <span className="text-ink">{index}</span>/{total}
        </p>
      </header>
      <div className="flex h-1 gap-0.5 px-4 pt-2 pb-1" aria-hidden>
        {Array.from({ length: total + 1 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-mark',
              i < index ? 'bg-sys' : i === index ? 'bg-ink-2' : 'bg-s3',
            )}
          />
        ))}
      </div>

      <motion.main
        key={index}
        className="flex flex-1 touch-pan-y flex-col px-4 pt-4"
        initial={reduce ? false : { opacity: 0.4, x: 32 * dir }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80 && index < total) go(index + 1);
          if (info.offset.x > 80 && index > 0) go(index - 1);
        }}
      >
        {item ? (
          <ExercisePanel
            it={item}
            circuit={p.rounds !== undefined}
            draft={draft}
            onTapSet={(s) => tapSet(item, s)}
            onLongSet={(s) => editSheet.show({ key: item.key, set: s })}
            onRpe={(rpe) =>
              update((d) => ({
                logged: {
                  ...d.logged,
                  [item.key]: { ...(d.logged[item.key] ?? { sets: [], pain: false }), rpe },
                },
              }))
            }
            onPain={() => {
              const on = !(draft.logged[item.key]?.pain ?? false);
              update((d) => ({
                logged: {
                  ...d.logged,
                  [item.key]: { ...(d.logged[item.key] ?? { sets: [], pain: false }), pain: on },
                },
              }));
              if (on) {
                haptic('warn');
                toast({
                  tone: 'bad',
                  label: 'Pain flagged',
                  message: `Stop ${item.name} if it is sharp.`,
                  detail: 'It steps back after the Gate. If it persists, see a physio.',
                });
              }
            }}
            onSkipRest={() => update(() => ({ restEndsAt: null }))}
            onAddRest={() =>
              update((d) => ({
                restEndsAt: (d.restEndsAt ?? Date.now()) + 30_000,
                restTotal: d.restTotal + 30,
              }))
            }
            onRestDone={() => {
              haptic('timer');
              play('chime', true);
              update(() => ({ restEndsAt: null }));
            }}
          />
        ) : (
          <WarmupPanel draft={draft} update={update} />
        )}
      </motion.main>

      <footer className="sticky bottom-0 z-(--z-sticky) flex items-center gap-2 border-t border-line bg-base px-4 pt-3 pb-[calc(12px+var(--safe-bottom))]">
        <IconButton label="Previous" bordered disabled={index === 0} onClick={() => go(index - 1)}>
          <CaretLeft />
        </IconButton>
        {index < total ? (
          <Button
            variant="primary"
            size="lg"
            block
            trailing={<CaretRight />}
            onClick={() => go(index + 1)}
          >
            {index === 0 ? 'Begin' : 'Next exercise'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            block
            loading={clearing}
            onClick={() => (missing.length ? clearSheet.show() : void finish())}
          >
            Clear Gate
          </Button>
        )}
      </footer>

      <Sheet
        open={editSheet.open && !!editing}
        onOpenChange={editSheet.onOpenChange}
        title={editing ? `${editing.name}, set ${(editSheet.data?.set ?? 0) + 1}` : 'Set'}
        description={editing ? `Target ${editing.target} ${doseText(editing)}` : undefined}
        footer={
          editing && editSheet.data ? (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (editSheet.data) logSet(editing, editSheet.data.set, null);
                  editSheet.hide();
                }}
              >
                Clear set
              </Button>
              <Button variant="primary" size="lg" block onClick={editSheet.hide}>
                Done
              </Button>
            </div>
          ) : null
        }
      >
        {editing && editSheet.data && (
          <SetEditor
            it={editing}
            value={draft.logged[editing.key]?.sets[editSheet.data.set] ?? editing.target}
            onChange={(v) => editSheet.data && logSet(editing, editSheet.data.set, v)}
          />
        )}
      </Sheet>

      <Sheet
        open={clearSheet.open}
        onOpenChange={clearSheet.onOpenChange}
        title="Clear the Gate?"
        description={`${missing.length} ${missing.length === 1 ? 'exercise has' : 'exercises have'} no sets logged. Skipped exercises keep their targets.`}
        footer={
          <div className="flex gap-2">
            <Button onClick={clearSheet.hide}>Keep going</Button>
            <Button
              variant="primary"
              size="lg"
              block
              loading={clearing}
              onClick={() => void finish()}
            >
              Clear Gate
            </Button>
          </div>
        }
      >
        <ul className="flex flex-col gap-1 text-15 text-ink-2">
          {missing.map((m) => (
            <li key={m.key}>{m.name}</li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}

function SetEditor({
  it,
  value,
  onChange,
}: {
  it: PrescribedItem;
  value: number;
  onChange: (v: number) => void;
}) {
  const step = it.unit === 'sec' ? 5 : 1;
  return (
    <div className="py-4">
      <Stepper
        label={`${it.name} set`}
        value={value}
        onChange={onChange}
        min={0}
        max={it.unit === 'sec' ? 600 : 100}
        step={step}
        unit={doseText(it)}
      />
    </div>
  );
}

function WarmupPanel({ draft, update }: { draft: GateDraft; update: Update }) {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-col gap-1">
        <p className="hud-13 text-ink-2">Before the Gate</p>
        <h1 className="hud-28 text-ink">Corrective warm-up</h1>
        <p className="text-15 text-ink-2">8 minutes. Same six moves, every training day.</p>
      </div>
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-s1">
        {WARMUP.map((w, i) => {
          const ex = anyExercise(w.exerciseId);
          return (
            <div key={w.exerciseId} className="flex min-h-16 items-center gap-1 pr-4">
              <Checkbox
                checked={draft.warmup[i] ?? false}
                label={`${ex.name}, ${w.dose}`}
                onChange={(v) =>
                  update((d) => ({ warmup: d.warmup.map((x, j) => (j === i ? v : x)) }))
                }
              />
              <span className="flex min-w-0 flex-1 flex-col py-2">
                <span className="text-17 text-ink">{ex.name}</span>
                <span className="text-13 text-ink-2">{ex.cue}</span>
              </span>
              <span className="max-w-24 shrink-0 text-right text-13 text-ink">{w.dose}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PanelProps {
  it: PrescribedItem;
  circuit: boolean;
  draft: GateDraft;
  onTapSet: (set: number) => void;
  onLongSet: (set: number) => void;
  onRpe: (rpe: number) => void;
  onPain: () => void;
  onSkipRest: () => void;
  onAddRest: () => void;
  onRestDone: () => void;
}

function ExercisePanel({
  it,
  circuit,
  draft,
  onTapSet,
  onLongSet,
  onRpe,
  onPain,
  onSkipRest,
  onAddRest,
  onRestDone,
}: PanelProps) {
  const logged = draft.logged[it.key];
  const sets = Array.from({ length: it.sets }, (_, i) => logged?.sets[i] ?? null);
  const resting = draft.restEndsAt !== null;
  const def = anyExercise(it.exerciseId);
  const press = useRef<number | null>(null);
  const longFired = useRef(false);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <p className="hud-13 text-ink-3">
            <span className="num text-ink-2">{String(it.order).padStart(2, '0')}</span>
            {it.variation ? ` · ${def.trackerName.replace(' (any variation)', '')} ladder` : ''}
          </p>
          {logged?.pain && (
            <Badge tone="bad" icon={<FirstAidKit weight="fill" />}>
              Pain flagged
            </Badge>
          )}
        </div>
        <h1 className="hud-28 text-ink">{it.name}</h1>
        <p className="text-15 text-ink-2">{it.cue}</p>
        <a
          href={youtubeUrl(def.name)}
          target="_blank"
          rel="noreferrer"
          className="-ml-1 inline-flex min-h-11 tap items-center gap-1.5 self-start px-1 text-15 text-sys underline-offset-4 hover:underline"
        >
          <PlayCircle className="size-5" aria-hidden />
          Form tutorial
          <span className="sr-only">(opens YouTube)</span>
        </a>
      </div>

      {resting && draft.restEndsAt ? (
        <div className="flex flex-col items-center gap-3">
          <RestRing
            total={draft.restTotal}
            endsAt={draft.restEndsAt}
            onDone={onRestDone}
            size={232}
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onAddRest}>
              +30 s
            </Button>
            <Button onClick={onSkipRest}>Skip rest</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-4 border-y border-line py-4">
          <div className="flex items-end gap-2">
            <span className="num text-64 font-medium tracking-tight text-ink">{it.target}</span>
            <span className="pb-2 text-15 text-ink-2">{doseText(it)}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5 pb-1.5 text-13 text-ink-2">
            <span>
              <span className="num text-17 text-ink">{it.sets}</span>{' '}
              {circuit ? 'rounds' : it.sets === 1 ? 'set' : 'sets'}
            </span>
            {it.range && (
              <span>
                Range{' '}
                <span className="num text-ink">
                  {it.range[0]}-{it.range[1]}
                </span>
              </span>
            )}
            <span>
              Rest <span className="num text-ink">{it.rest}</span> s
            </span>
          </div>
        </div>
      )}

      <div
        className={cn('grid gap-2', it.sets <= 3 ? 'grid-cols-3' : 'grid-cols-4')}
        role="group"
        aria-label="Sets"
      >
        {sets.map((v, i) => {
          const done = v !== null;
          const hit = done && v >= it.target;
          return (
            <button
              key={i}
              type="button"
              aria-label={
                done
                  ? `Set ${i + 1}: ${v} ${doseText(it)}. Tap to edit.`
                  : `Set ${i + 1}: log ${it.target}`
              }
              onPointerDown={() => {
                longFired.current = false;
                press.current = window.setTimeout(() => {
                  longFired.current = true;
                  haptic('tick');
                  onLongSet(i);
                }, 500);
              }}
              onPointerUp={() => press.current && window.clearTimeout(press.current)}
              onPointerCancel={() => press.current && window.clearTimeout(press.current)}
              onPointerLeave={() => press.current && window.clearTimeout(press.current)}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                if (longFired.current) return;
                onTapSet(i);
              }}
              className={cn(
                'flex min-h-18 tap flex-col items-center justify-center gap-0.5 rounded-ctl border transition-[background-color,border-color,transform] duration-(--dur-1) active:scale-[0.97]',
                !done && 'border-ctl bg-s1 hover:bg-s2',
                done && hit && 'border-sys bg-sys-dim',
                done && !hit && 'border-ink-3 bg-s2',
              )}
            >
              <span className="hud-11 text-ink-3">Set {i + 1}</span>
              <span className={cn('num text-28', done ? 'text-ink' : 'text-ink-3')}>
                {v ?? it.target}
              </span>
            </button>
          );
        })}
      </div>
      <p className="-mt-2 text-13 text-ink-3">
        Tap a set to log the target. Tap again or hold to change it.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="flex w-full justify-between pb-1.5 text-15 text-ink">
          RPE <span className="text-13 text-ink-2">10 = nothing left</span>
        </legend>
        <Segmented label="RPE" mono value={logged?.rpe ?? null} onChange={onRpe} options={RPE} />
      </fieldset>

      <Button
        variant="danger"
        icon={<FirstAidKit />}
        aria-pressed={logged?.pain ?? false}
        onClick={onPain}
        className="self-start"
      >
        {logged?.pain ? 'Pain flagged, tap to undo' : 'Pain'}
      </Button>
    </div>
  );
}
