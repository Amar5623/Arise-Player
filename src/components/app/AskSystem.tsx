import { useState } from 'react';
import { aiContext, aiPasscode } from '@/app/commands/ai';
import { setAiQuests } from '@/app/commands/day';
import { toast } from '@/app/stores/toasts';
import { ScanLoader } from '@/components/system/ScanLoader';
import { Button } from '@/components/ui/Button';
import { askQuests } from '@/lib/ai';

/** Generates 2-4 bonus quests aimed at weak stats and recent misses. */
export function AskSystem({ date }: { date: string }) {
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    setBusy(true);
    const context = await aiContext(date);
    const res = await askQuests(context, await aiPasscode());
    setBusy(false);
    if (!res.ok) {
      toast({ tone: 'warn', label: 'AI unavailable', message: res.error, detail: res.fix });
      return;
    }
    await setAiQuests(date, res.data.message, res.data.quests);
    toast({
      tone: 'sys',
      label: 'System bonus',
      message: `${res.data.quests.length} bonus quests issued.`,
    });
  };

  if (busy) return <ScanLoader className="py-3" />;
  return (
    <Button block onClick={() => void ask()}>
      Ask the System
    </Button>
  );
}
