import type { PrescribedItem } from '@/engine/prescription';

/** Unit words for a dose: "reps", "s / side", "steps / side". */
export const doseText = (it: Pick<PrescribedItem, 'unit' | 'perSide' | 'steps'>) =>
  `${it.unit === 'sec' ? 's' : it.steps ? 'steps' : 'reps'}${it.perSide ? ' / side' : ''}`;
