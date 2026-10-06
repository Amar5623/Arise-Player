import { PencilSimple, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { deleteGoal, updateGoalValue } from '@/app/commands/records';
import { useToday } from '@/app/stores/clock';
import { toast } from '@/app/stores/toasts';
import { useSheet } from '@/app/useSheet';
import { GoalSheet } from '@/components/app/GoalSheet';
import { ScreenHeader } from '@/components/app/ScreenHeader';
import { LineChart } from '@/components/charts/LineChart';
import { StatMark } from '@/components/system/StatMark';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { XpBar } from '@/components/ui/Meter';
import { SectionHead } from '@/components/ui/SectionHead';
import { Sheet } from '@/components/ui/Sheet';
import { daysLeft, goalProgress } from '@/engine/goals';
import { useGoals, useProfile } from '@/db/hooks';
import { dayMonth, shortLabel } from '@/lib/dates';
import { goalValue } from '@/lib/goalFormat';

export function GoalScreen() {
  const { goalId } = useParams();
  const today = useToday();
  const navigate = useNavigate();
  const goals = useGoals();
  const profile = useProfile();
  const editSheet = useSheet('edit-goal');
  const deleteSheet = useSheet('delete-goal');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  if (!goals || !profile) return <ScreenHeader title="Main quest" back="/quests" />;
  const g = goals.find((x) => x.id === goalId);
  if (!g) return <Navigate to="/quests" replace />;

  const left = daysLeft(g, today);
  const pct = Math.round(goalProgress(g) * 100);
  const n = Number(value.replace(/,/g, ''));
  const valid = value.trim() !== '' && Number.isFinite(n);

  return (
    <>
      <ScreenHeader
        title={g.title}
        back="/quests"
        actions={
          <>
            <IconButton label="Edit" onClick={() => editSheet.show()}>
              <PencilSimple />
            </IconButton>
            <IconButton label="Delete" onClick={() => deleteSheet.show()}>
              <Trash />
            </IconButton>
          </>
        }
      />
      <div className="flex flex-col gap-6 px-4 pt-2 pb-10">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <StatMark stat={g.stat} />
            {g.done ? (
              <Badge tone="ok">Cleared {g.doneAt ? dayMonth(g.doneAt) : ''}</Badge>
            ) : (
              <span className="text-13 text-ink-2">
                {left === null
                  ? 'No deadline'
                  : left < 0
                    ? `${-left} days over`
                    : `${left} days left`}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="num text-40 text-ink">{goalValue(g, g.current)}</span>
            <span className="num text-15 text-ink-2">/ {goalValue(g, g.target)}</span>
          </div>
          <XpBar into={pct} next={100} label="Progress" tone={g.done ? 'rare' : 'sys'} />
          <p className="text-13 text-ink-2">
            <span className="num text-ink">{pct}</span>% from a start of{' '}
            <span className="num">{goalValue(g, g.start)}</span>. Clearing it pays 200 {g.stat} XP.
          </p>
        </section>

        {!g.done && (
          <section aria-labelledby="update" className="flex flex-col gap-3">
            <SectionHead id="update" className="pt-0">
              Update value
            </SectionHead>
            <div className="flex items-end gap-2">
              <Field
                label="Current value"
                mono
                inputMode="decimal"
                unit={g.unit}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={String(g.current)}
                className="flex-1"
              />
              <Button
                variant="primary"
                disabled={!valid}
                loading={saving}
                className="mb-0.5 min-h-12"
                onClick={async () => {
                  setSaving(true);
                  await updateGoalValue(g.id, n, today);
                  setSaving(false);
                  setValue('');
                }}
              >
                Save
              </Button>
            </div>
          </section>
        )}

        {g.updates.length >= 2 && (
          <div className="rounded-card border border-line bg-s1 p-4">
            <LineChart
              points={g.updates.map((u) => ({ label: dayMonth(u.date), value: u.value }))}
              unit={g.unit}
              title={`${g.title} history`}
              format={(v) => goalValue(g, v)}
            />
          </div>
        )}

        <section aria-labelledby="hist">
          <SectionHead id="hist" className="pt-0">
            History
          </SectionHead>
          <ul className="divide-y divide-line">
            {[...g.updates].reverse().map((u, i) => (
              <li key={`${u.date}-${i}`} className="flex justify-between py-2.5 text-15">
                <span className="text-ink-2">{shortLabel(u.date)}</span>
                <span className="num text-ink">{goalValue(g, u.value)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {editSheet.open && (
        <GoalSheet
          open
          goal={g}
          currency={profile.currency}
          onOpenChange={editSheet.onOpenChange}
          onDone={() => editSheet.hide()}
        />
      )}
      <Sheet
        open={deleteSheet.open}
        onOpenChange={deleteSheet.onOpenChange}
        title="Delete this main quest?"
        description="Its history goes with it. XP already earned stays."
        footer={
          <div className="flex gap-2">
            <Button onClick={deleteSheet.hide}>Keep it</Button>
            <Button
              variant="danger"
              size="lg"
              block
              onClick={async () => {
                await deleteGoal(g.id);
                toast({ tone: 'sys', label: 'Main quest removed', message: g.title });
                navigate('/quests', { replace: true });
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-15 text-ink">{g.title}</p>
      </Sheet>
    </>
  );
}
