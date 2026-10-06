import type { Goal } from '@/engine/types';
import { groupIN, money } from './format';

const CURRENCIES = ['₹', '$', '€', '£'];

/** "₹42,500" for money goals, "84.5 cm" otherwise. */
export function goalValue(g: Pick<Goal, 'unit'>, v: number): string {
  if (CURRENCIES.includes(g.unit)) return money(v, g.unit);
  return `${groupIN(v, true)}${g.unit ? ` ${g.unit}` : ''}`;
}
