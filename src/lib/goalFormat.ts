import type { Goal } from '@/engine/types';
import { groupIN, money } from './format';

const CURRENCIES = ['₹', '$', '€', '£'];

export const isMoney = (g: Pick<Goal, 'unit'>) => CURRENCIES.includes(g.unit);

/** Number and unit kept apart, so the number sets in mono and the unit in the sans. */
export function goalParts(g: Pick<Goal, 'unit'>, v: number): { value: string; unit: string } {
  if (isMoney(g)) return { value: money(v, g.unit), unit: '' };
  const unit = v === 1 && /[^s]s$/.test(g.unit) ? g.unit.slice(0, -1) : g.unit;
  return { value: groupIN(v, true), unit };
}

/** "₹42,500", "84.5 cm", "1 rep". */
export function goalValue(g: Pick<Goal, 'unit'>, v: number): string {
  const p = goalParts(g, v);
  return p.unit ? `${p.value} ${p.unit}` : p.value;
}
