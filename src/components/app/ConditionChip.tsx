import { FirstAidKit, Lightning, Moon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Condition, Readiness } from '@/engine/types';

const LOOK = {
  OPTIMAL: { tone: 'ok', icon: <Lightning weight="fill" />, label: 'Optimal' },
  FATIGUED: { tone: 'warn', icon: <Moon weight="fill" />, label: 'Fatigued' },
  INJURED: { tone: 'bad', icon: <FirstAidKit weight="fill" />, label: 'Injured' },
} as const;

export function ConditionBadge({ condition }: { condition: Condition }) {
  const look = LOOK[condition];
  return (
    <Badge tone={look.tone} icon={look.icon}>
      {look.label}
    </Badge>
  );
}

/** The morning check, collapsed: condition plus the numbers behind it. */
export function ConditionChip({
  condition,
  readiness,
  onEdit,
}: {
  condition: Condition;
  readiness: Readiness;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <ConditionBadge condition={condition} />
      <p className="min-w-0 flex-1 truncate text-13 text-ink-2">
        Slept <span className="num text-ink">{readiness.sleep}</span> h, energy{' '}
        <span className="num text-ink">{readiness.energy}</span>, soreness{' '}
        <span className="num text-ink">{readiness.soreness}</span>
        {readiness.pain ? ', pain' : ''}
      </p>
      <Button variant="ghost" onClick={onEdit} className="-mr-2">
        Edit
      </Button>
    </div>
  );
}
