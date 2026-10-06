import { describe, expect, it } from 'vitest';
import { conditionOf } from './readiness';

const r = (sleep: number, energy: number, soreness: number, pain = false) => ({
  sleep,
  energy,
  soreness,
  pain,
});

describe('morning status check', () => {
  it('pain means injured, whatever else', () => {
    expect(conditionOf(r(8, 5, 1, true))).toBe('INJURED');
  });
  it('short sleep, low energy or heavy soreness means fatigued', () => {
    expect(conditionOf(r(5.5, 4, 2))).toBe('FATIGUED');
    expect(conditionOf(r(7.5, 2, 2))).toBe('FATIGUED');
    expect(conditionOf(r(7.5, 4, 4))).toBe('FATIGUED');
  });
  it('otherwise optimal', () => {
    expect(conditionOf(r(6, 3, 3))).toBe('OPTIMAL');
  });
});
