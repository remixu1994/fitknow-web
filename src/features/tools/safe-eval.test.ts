import { describe, expect, it } from 'vitest';

import { safeEval } from './safe-eval';

describe('safeEval', () => {
  it('evaluates known 1RM formulas with the provided weight and reps', () => {
    expect(safeEval('0.025*w*r+w', 100, 5)).toBe(112.5);
    expect(safeEval('(r*0.0333)*w+w', 100, 5)).toBeCloseTo(116.65, 2);
  });

  it('returns 0 for unknown or non-finite formulas', () => {
    expect(safeEval('unknown()', 100, 5)).toBe(0);
    expect(safeEval('w/(1-0.02*r)', 100, 50)).toBe(0);
  });
});
