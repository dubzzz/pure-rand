import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { poissonInt } from './poissonInt';
import { mersenne } from '../generator/mersenne';

describe('poissonInt', () => {
  it('Should always generate non-negative integer values', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), fc.double({ min: 0, max: 100, noNaN: true }), (seed, lambda) => {
        const rng = mersenne(seed);
        const v = poissonInt(rng, lambda);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(v)).toBe(true);
      }),
    ));

  it('Should always return 0 when lambda is 0', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), (seed) => {
        const rng = mersenne(seed);
        const v = poissonInt(rng, 0);
        expect(v).toBe(0);
      }),
    ));

  it('Should generate values with approximate mean lambda over many samples', () => {
    const rng = mersenne(42);
    const n = 10000;
    const lambda = 7;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += poissonInt(rng, lambda);
    }
    const sampleMean = sum / n;
    expect(sampleMean).toBeCloseTo(lambda, 0);
  });

  it('Should work correctly for large lambda values', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), (seed) => {
        const rng = mersenne(seed);
        const v = poissonInt(rng, 1000);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(v)).toBe(true);
      }),
    ));
});
