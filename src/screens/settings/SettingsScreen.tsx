import {
  Barbell,
  DownloadSimple,
  FileCsv,
  Robot,
  ListChecks,
  Minus,
  Plus,
  SpeakerHigh,
  UploadSimple,
  User,
  Vibrate,
  Warning,
  Database,
  DeviceMobile,
  SignOut,
} from '@phosphor-icons/react';
import { useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  download,
  exportBackup,
  exportTrainingCsv,
  importBackup,
  resetAll,
} from '@/app/commands/backup';
import { saveProfile, setHabit, setLadderStep, setTier } from '@/app/commands/settings';
import { useToday } from '@/app/stores/clock';
import { toast } from '@/app/stores/toasts';
import { useSheet } from '@/app/useSheet';
import { ScreenHeader } from '@/components/app/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { SectionHead } from '@/components/ui/SectionHead';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { Switch } from '@/components/ui/Switch';
import { HABITS, tierValue } from '@/data/habits';
import { LADDER_KEYS, LADDERS } from '@/data/ladders';
import { AREA_LABEL } from '@/engine/quests';
import type { Profile } from '@/engine/types';
import { DEMO, leaveDemo } from '@/db/db';
import { useHabits, useLadders, useMeta, useProfile } from '@/db/hooks';
import { repo } from '@/db/repos';
import { isHHMM, isISODate, weekday } from '@/lib/dates';
import { isIOS, promptInstall, useInstall } from '@/lib/install';
import { cn } from '@/lib/cn';
import { ctxOf } from '@/app/commands/day';

const SECTIONS = ['profile', 'habits', 'ladders', 'ai', 'data'] as const;
type Section = (typeof SECTIONS)[number];
const TITLE: Record<Section, string> = {
  profile: 'Profile',
  habits: 'Daily quest library',
  ladders: 'Ladders',
  ai: 'AI',
  data: 'Data',
};

export function SettingsScreen() {
  const { section } = useParams();
  const profile = useProfile();
  if (profile === undefined) return <ScreenHeader title="Settings" back="/status" />;
  if (!profile) return <Navigate to="/onboarding/1" replace />;
  if (!section) return <SettingsRoot profile={profile} />;
  if (!SECTIONS.includes(section as Section)) return <Navigate to="/settings" replace />;
  const s = section as Section;
  return (
    <>
      <ScreenHeader title={TITLE[s]} back="/settings" />
      <div className="flex flex-col gap-5 px-4 pt-2 pb-10">
        {s === 'profile' && <ProfileSection profile={profile} />}
        {s === 'habits' && <HabitsSection profile={profile} />}
        {s === 'ladders' && <LaddersSection />}
        {s === 'ai' && <AiSection profile={profile} />}
        {s === 'data' && <DataSection />}
      </div>
    </>
  );
}

function SettingsRoot({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const today = useToday();
  const install = useInstall();
  const toggle = (patch: Partial<Profile>) => void saveProfile({ ...profile, ...patch }, today);

  return (
    <>
      <ScreenHeader title="Settings" back="/status" />
      <div className="flex flex-col gap-2 px-4 pt-2 pb-10">
        <ListGroup>
          <ListRow
            leading={<User />}
            title="Profile"
            detail={`${profile.name}, ${profile.weightKg} kg, wake ${profile.wake}`}
            onClick={() => navigate('/settings/profile')}
          />
          <ListRow
            leading={<ListChecks />}
            title="Daily quest library"
            detail="Turn quests on or off, adjust tiers"
            onClick={() => navigate('/settings/habits')}
          />
          <ListRow
            leading={<Barbell />}
            title="Ladders"
            detail="Set your step by hand"
            onClick={() => navigate('/settings/ladders')}
          />
        </ListGroup>

        <SectionHead>Feedback</SectionHead>
        <ListGroup>
          <ListRow
            leading={<SpeakerHigh />}
            title="Sound"
            detail="Ticks, chimes and notices"
            trailing={
              <Switch
                label="Sound"
                hideLabel
                checked={profile.sound}
                onChange={(v) => toggle({ sound: v })}
              />
            }
          />
          <ListRow
            leading={<Vibrate />}
            title="Haptics"
            detail="Android only; iPhones ignore it"
            trailing={
              <Switch
                label="Haptics"
                hideLabel
                checked={profile.haptics}
                onChange={(v) => toggle({ haptics: v })}
              />
            }
          />
        </ListGroup>

        <SectionHead>System</SectionHead>
        <ListGroup>
          <ListRow
            leading={<Robot />}
            title="AI"
            detail={
              profile.aiEnabled
                ? 'On. Bonus quests and weekly report.'
                : 'Off. Everything else works without it.'
            }
            onClick={() => navigate('/settings/ai')}
          />
          <ListRow
            leading={<Database />}
            title="Data"
            detail="Backup, import, tracker CSV, reset"
            onClick={() => navigate('/settings/data')}
          />
          {install.installed ? (
            <ListRow leading={<DeviceMobile />} title="Installed" detail="Running as an app" />
          ) : install.event ? (
            <ListRow
              leading={<DeviceMobile />}
              title="Install app"
              detail="Adds Player System to your home screen"
              onClick={async () => {
                if (await promptInstall())
                  toast({
                    tone: 'ok',
                    label: 'Installed',
                    message: 'Open it from your home screen.',
                  });
              }}
            />
          ) : (
            <ListRow
              leading={<DeviceMobile />}
              title="Install app"
              detail={
                isIOS()
                  ? 'Safari: Share, then Add to Home Screen'
                  : 'Chrome menu (⋮), then Install app'
              }
            />
          )}
          {DEMO && (
            <ListRow
              leading={<SignOut />}
              title="Leave demo"
              detail="Back to your own data"
              onClick={() => {
                leaveDemo();
                window.location.href = '/today?demo=0';
              }}
            />
          )}
        </ListGroup>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col">
      <SectionHead className="pt-2">{title}</SectionHead>
      {children}
    </section>
  );
}

function ProfileSection({ profile }: { profile: Profile }) {
  const today = useToday();
  const [p, setP] = useState({
    name: profile.name,
    weightKg: String(profile.weightKg),
    heightCm: String(profile.heightCm),
    wake: profile.wake,
    programStart: profile.programStart,
    currency: profile.currency,
    saveWeekly: String(profile.saveWeekly),
    weighEvery: profile.weighEvery,
  });
  const [saving, setSaving] = useState(false);
  const num = (s: string) => Number(s.replace(',', '.'));
  const errors = {
    name: p.name.trim() ? undefined : 'A name.',
    weightKg: num(p.weightKg) >= 30 && num(p.weightKg) <= 250 ? undefined : 'Kilograms, 30 to 250.',
    heightCm:
      num(p.heightCm) >= 120 && num(p.heightCm) <= 230 ? undefined : 'Centimetres, 120 to 230.',
    wake: isHHMM(p.wake) ? undefined : 'Like 06:30.',
    programStart:
      isISODate(p.programStart) && weekday(p.programStart) === 0 ? undefined : 'Pick a Monday.',
    saveWeekly: num(p.saveWeekly) >= 0 ? undefined : 'An amount, or 0.',
  };
  const valid = Object.values(errors).every((e) => !e);
  const set = (patch: Partial<typeof p>) => setP((x) => ({ ...x, ...patch }));

  return (
    <>
      <Field
        label="Name"
        value={p.name}
        onChange={(e) => set({ name: e.target.value })}
        error={errors.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Weight"
          unit="kg"
          mono
          inputMode="decimal"
          value={p.weightKg}
          onChange={(e) => set({ weightKg: e.target.value })}
          error={errors.weightKg}
        />
        <Field
          label="Height"
          unit="cm"
          mono
          inputMode="decimal"
          value={p.heightCm}
          onChange={(e) => set({ heightCm: e.target.value })}
          error={errors.heightCm}
        />
      </div>
      <Field
        label="Wake time"
        type="time"
        mono
        value={p.wake}
        onChange={(e) => set({ wake: e.target.value })}
        error={errors.wake}
      />
      <Field
        label="Program start"
        type="date"
        mono
        value={p.programStart}
        onChange={(e) => set({ programStart: e.target.value })}
        error={errors.programStart}
        helper="Changing it moves program weeks and deloads."
      />
      <fieldset>
        <legend className="pb-2 text-13 font-medium text-ink-2">Currency</legend>
        <Segmented
          label="Currency"
          value={p.currency}
          onChange={(v) => set({ currency: v })}
          options={['₹', '$', '€', '£'].map((c) => ({ value: c, label: c }))}
        />
      </fieldset>
      <Field
        label="Pay yourself first, weekly"
        unit={p.currency}
        mono
        inputMode="numeric"
        value={p.saveWeekly}
        onChange={(e) => set({ saveWeekly: e.target.value })}
        error={errors.saveWeekly}
      />
      <fieldset>
        <legend className="pb-2 text-13 font-medium text-ink-2">Weigh-in</legend>
        <Segmented
          label="Weigh-in cadence"
          value={p.weighEvery}
          onChange={(v) => set({ weighEvery: v })}
          options={[
            { value: 4, label: 'Monthly' },
            { value: 8, label: 'Every 2 months' },
          ]}
        />
        <p className="pt-2 text-13 text-ink-3">
          A weigh-in quest appears on that Monday. Log body any time from Status.
        </p>
      </fieldset>
      <Button
        variant="primary"
        size="lg"
        block
        disabled={!valid}
        loading={saving}
        onClick={async () => {
          setSaving(true);
          await saveProfile(
            {
              ...profile,
              name: p.name.trim(),
              weightKg: num(p.weightKg),
              heightCm: num(p.heightCm),
              wake: p.wake,
              programStart: p.programStart,
              currency: p.currency,
              saveWeekly: num(p.saveWeekly),
              weighEvery: p.weighEvery,
            },
            today,
          );
          setSaving(false);
          toast({ tone: 'sys', label: 'Profile', message: 'Saved. Today’s quests were updated.' });
        }}
      >
        Save profile
      </Button>
    </>
  );
}

function HabitsSection({ profile }: { profile: Profile }) {
  const today = useToday();
  const habits = useHabits();
  const ctx = ctxOf(profile);
  const areas = ['face', 'diet', 'body', 'mind', 'wealth'] as const;
  return (
    <>
      <p className="text-13 text-ink-2">
        Tiers move on their own after a week: 85% raises one, under 40% lowers one. Changing a tier
        here restarts that week.
      </p>
      {areas.map((area) => (
        <Group key={area} title={AREA_LABEL[area]}>
          <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-s1">
            {HABITS.filter((h) => h.area === area).map((h) => {
              const cfg = habits?.find((c) => c.id === h.id);
              const on = cfg?.enabled ?? false;
              const tier = cfg?.tier ?? 1;
              const t = tierValue(h, tier);
              return (
                <div key={h.id} className="flex min-h-16 flex-col gap-2 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('text-15', on ? 'text-ink' : 'text-ink-2')}>
                        {h.title(t, ctx)}
                      </span>
                      <span className="text-13 text-ink-3">{h.detail(t, ctx)}</span>
                    </span>
                    <Switch
                      label={h.label}
                      hideLabel
                      checked={on}
                      onChange={(v) => void setHabit(h.id, v, today)}
                    />
                  </div>
                  {h.tiers && on && (
                    <div className="flex items-center gap-2">
                      <IconButton
                        label={`Lower ${h.label} tier`}
                        bordered
                        disabled={tier <= 1}
                        onClick={() => void setTier(h.id, tier - 1, today)}
                      >
                        <Minus />
                      </IconButton>
                      <ol
                        className="flex flex-1 gap-1"
                        aria-label={`${h.label} tier ${tier} of ${h.tiers.length}`}
                      >
                        {h.tiers.map((_, i) => (
                          <li
                            key={i}
                            className={cn(
                              'flex h-7 flex-1 items-center justify-center rounded-mark hud-11',
                              i + 1 === tier
                                ? 'bg-sys-dim text-sys'
                                : i + 1 < tier
                                  ? 'bg-s3 text-ink-2'
                                  : 'border border-line text-ink-3',
                            )}
                          >
                            T{i + 1}
                          </li>
                        ))}
                      </ol>
                      <IconButton
                        label={`Raise ${h.label} tier`}
                        bordered
                        disabled={tier >= h.tiers.length}
                        onClick={() => void setTier(h.id, tier + 1, today)}
                      >
                        <Plus />
                      </IconButton>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Group>
      ))}
    </>
  );
}

function LaddersSection() {
  const today = useToday();
  const ladders = useLadders();
  return (
    <>
      <p className="text-13 text-ink-2">
        Progression moves you automatically. Set a step by hand only if it no longer fits. The
        target restarts at the bottom of that step.
      </p>
      {LADDER_KEYS.map((k) => {
        const l = LADDERS[k];
        const cur = ladders?.[k].step ?? 1;
        return (
          <Group key={k} title={`${l.name} ladder`}>
            <div
              role="radiogroup"
              aria-label={`${l.name} ladder step`}
              className="flex flex-col gap-1.5"
            >
              {l.steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={cur === i + 1}
                  onClick={() => {
                    if (cur === i + 1) return;
                    void setLadderStep(k, i + 1, today);
                    toast({
                      tone: 'sys',
                      label: 'Ladder set',
                      message: `${l.name}: ${s.name}.`,
                      detail: `Target ${s.range[0]} ${s.unit === 'sec' ? 's' : 'reps'}.`,
                    });
                  }}
                  className={cn(
                    'flex min-h-12 tap items-center justify-between gap-3 rounded-ctl border px-3 text-left',
                    cur === i + 1
                      ? 'border-sys bg-sys-dim'
                      : 'border-line-2 bg-s1 hover:border-line-3 active:bg-s2',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn('num text-15', cur === i + 1 ? 'text-sys' : 'text-ink-3')}>
                      {i + 1}
                    </span>
                    <span className="text-15 text-ink">{s.name}</span>
                  </span>
                  <span className="num text-13 text-ink-2">
                    {s.range[0]}-{s.range[1]}
                    {s.unit === 'sec' ? ' s' : ''}
                  </span>
                </button>
              ))}
            </div>
          </Group>
        );
      })}
    </>
  );
}

function AiSection({ profile }: { profile: Profile }) {
  const today = useToday();
  const stored = useMeta<string>('aiPasscode');
  const [code, setCode] = useState<string | null>(null);
  const value = code ?? stored ?? '';
  return (
    <>
      <div className="flex items-center justify-between rounded-card border border-line bg-s1 px-4 py-3">
        <span className="flex flex-col">
          <span className="text-15 text-ink">Use AI</span>
          <span className="text-13 text-ink-2">Bonus quests and the weekly report</span>
        </span>
        <Switch
          label="Use AI"
          hideLabel
          checked={profile.aiEnabled}
          onChange={(v) => void saveProfile({ ...profile, aiEnabled: v }, today)}
        />
      </div>
      <Field
        label="Passcode"
        type="password"
        autoComplete="off"
        value={value}
        onChange={(e) => setCode(e.target.value)}
        helper="Must match APP_PASSCODE on Vercel. The API key stays on the server."
      />
      <Button
        disabled={code === null}
        onClick={async () => {
          await repo.meta.set('aiPasscode', value.trim());
          setCode(null);
          toast({ tone: 'sys', label: 'AI', message: 'Passcode saved on this device.' });
        }}
      >
        Save passcode
      </Button>
      <p className="text-13 text-ink-3">
        The System sees your profile basics, week, condition, today’s Gate and quests, the last 7
        days, open goals and recent sessions. Never notes or keys.
      </p>
    </>
  );
}

function DataSection() {
  const resetSheet = useSheet('reset');
  const importSheet = useSheet<string>('import');
  const fileRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <>
      <ListGroup>
        <ListRow
          leading={<DownloadSimple />}
          title="Export backup"
          detail="Everything, as one JSON file"
          onClick={async () => {
            download(`player-system-${stamp}.json`, await exportBackup(), 'application/json');
            await repo.meta.set('lastBackup', stamp);
          }}
        />
        <ListRow
          leading={<UploadSimple />}
          title="Import backup"
          detail="Replaces everything on this device"
          onClick={() => fileRef.current?.click()}
        />
        <ListRow
          leading={<FileCsv />}
          title="Export training log"
          detail="CSV in the tracker’s Log columns"
          onClick={async () =>
            download(`training-log-${stamp}.csv`, await exportTrainingCsv(), 'text/csv')
          }
        />
      </ListGroup>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Backup file"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) importSheet.show(await f.text());
        }}
      />
      <SectionHead>Danger</SectionHead>
      <ListGroup>
        <ListRow
          leading={<Warning className="text-bad" />}
          title={<span className="text-bad">Reset all data</span>}
          detail="Deletes every record on this device"
          onClick={() => resetSheet.show()}
        />
      </ListGroup>
      <p className="text-13 text-ink-3">
        Data lives only on this phone. Export a backup before changing phones or clearing the
        browser.
      </p>

      <Sheet
        open={importSheet.open}
        onOpenChange={importSheet.onOpenChange}
        title="Import this backup?"
        description="Everything on this device is replaced by the file. Export a backup first if unsure."
        footer={
          <div className="flex gap-2">
            <Button onClick={importSheet.hide}>Cancel</Button>
            <Button
              variant="primary"
              size="lg"
              block
              loading={busy}
              onClick={async () => {
                if (!importSheet.data) return;
                setBusy(true);
                const res = await importBackup(importSheet.data);
                setBusy(false);
                if (!res.ok) {
                  toast({
                    tone: 'warn',
                    label: 'Import failed',
                    message: res.error,
                    detail: 'Nothing was changed.',
                  });
                  importSheet.hide();
                  return;
                }
                toast({
                  tone: 'ok',
                  label: 'Backup restored',
                  message: `${res.days} days and ${res.sessions} Gates.`,
                });
                window.location.href = '/today';
              }}
            >
              Replace data
            </Button>
          </div>
        }
      >
        <p className="text-15 text-ink-2">The file is checked before anything is written.</p>
      </Sheet>

      <Sheet
        open={resetSheet.open}
        onOpenChange={resetSheet.onOpenChange}
        title="Reset all data?"
        description="Every quest, Gate, stat and title on this device is deleted. This cannot be undone."
        footer={
          <Button
            variant="danger"
            size="lg"
            block
            disabled={typed !== 'RESET'}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await resetAll();
              window.location.href = '/onboarding/1';
            }}
          >
            Delete everything
          </Button>
        }
      >
        <Field
          label="Type RESET to confirm"
          autoCapitalize="characters"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      </Sheet>
    </>
  );
}
