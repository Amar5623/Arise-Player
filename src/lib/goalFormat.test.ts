import { describe, expect, it } from 'vitest';
import { goalValue } from './goalFormat';

describe('goal values', () => {
  it('formats money with Indian grouping and units with singulars', () => {
    expect(goalValue({ unit: '₹' }, 300000)).toBe('₹3,00,000');
    expect(goalValue({ unit: 'reps' }, 1)).toBe('1 rep');
    expect(goalValue({ unit: 'reps' }, 0)).toBe('0 reps');
    expect(goalValue({ unit: 'cm' }, 84.5)).toBe('84.5 cm');
    expect(goalValue({ unit: '%' }, 40)).toBe('40 %');
  });
});
