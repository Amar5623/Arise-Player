import { Robot } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { aiContext, aiPasscode } from '@/app/commands/ai';
import { useToday } from '@/app/stores/clock';
import { toast } from '@/app/stores/toasts';
import { ScreenHeader } from '@/components/app/ScreenHeader';
import { ScanLoader } from '@/components/system/ScanLoader';
import { SystemWindow } from '@/components/system/SystemWindow';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMeta, useProfile } from '@/db/hooks';
import { repo } from '@/db/repos';
import { askReport } from '@/lib/ai';
import { shortLabel, startOfWeek } from '@/lib/dates';
import { parseReport } from '@/lib/report';

interface StoredReport {
  week: string;
  at: string;
  text: string;
}

export function ReportScreen() {
  const today = useToday();
  const navigate = useNavigate();
  const profile = useProfile();
  const week = startOfWeek(today);
  const stored = useMeta<StoredReport>('report');
  const [busy, setBusy] = useState(false);
  const report = stored && stored.week === week ? stored : null;

  const generate = async () => {
    setBusy(true);
    const res = await askReport(await aiContext(today), await aiPasscode());
    setBusy(false);
    if (!res.ok) {
      toast({ tone: 'warn', label: 'AI unavailable', message: res.error, detail: res.fix });
      return;
    }
    await repo.meta.set('report', { week, at: new Date().toISOString(), text: res.data.report });
  };

  return (
    <>
      <ScreenHeader
        title="Weekly System Report"
        back="/status"
        sub={`Week of ${shortLabel(week)}`}
      />
      <div className="flex flex-col gap-5 px-4 pt-2 pb-10">
        {!profile?.aiEnabled ? (
          <EmptyState
            icon={<Robot weight="thin" />}
            title="AI is off"
            body="The weekly report is written by the System from your last seven days. Turn AI on and set the passcode in Settings."
            action={<Button onClick={() => navigate('/settings/ai')}>Open AI settings</Button>}
          />
        ) : busy ? (
          <ScanLoader />
        ) : report ? (
          <>
            {parseReport(report.text).map((s, i) => (
              <SystemWindow
                key={s.heading}
                label={s.heading}
                tone={
                  s.heading === 'WEAK POINTS' ? 'warn' : s.heading === 'STRENGTHS' ? 'ok' : 'sys'
                }
                reveal={i === 0}
                as="h2"
              >
                <ul className="flex flex-col gap-2">
                  {s.lines.map((l) => (
                    <li key={l} className="text-15 text-ink">
                      {l}
                    </li>
                  ))}
                </ul>
              </SystemWindow>
            ))}
            <Button onClick={() => void generate()}>Regenerate</Button>
          </>
        ) : (
          <EmptyState
            icon={<Robot weight="thin" />}
            title="No report this week yet"
            body="The System reads your last seven days: quests, Gates, missed habits and goals."
            action={
              <Button variant="primary" onClick={() => void generate()}>
                Generate report
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}
