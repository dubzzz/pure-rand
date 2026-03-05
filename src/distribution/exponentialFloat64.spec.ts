import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { exponentialFloat64 } from './exponentialFloat64';
import { mersenne } from '../generator/mersenne';

describe('exponentialFloat64', () => {
  it('Should always generate non-negative values', () =>
    fc.assert(
      fc.property(
        fc.noShrink(fc.integer()),
        fc.double({ min: Number.EPSILON, noNaN: true, noDefaultInfinity: true }),
        (seed, rate) => {
          const rng = mersenne(seed);
          const v = exponentialFloat64(rng, rate);
          expect(v).toBeGreaterThanOrEqual(0);
        },
      ),
    ));

  it('Should always generate finite values for positive rates', () =>
    fc.assert(
      fc.property(
        fc.noShrink(fc.integer()),
        fc.double({ min: Number.EPSILON, max: 1e10, noNaN: true }),
        (seed, rate) => {
          const rng = mersenne(seed);
          const v = exponentialFloat64(rng, rate);
          expect(Number.isFinite(v)).toBe(true);
        },
      ),
    ));

  it('Should generate values with approximate mean 1/rate over many samples', () => {
    const rng = mersenne(42);
    const n = 10000;
    const rate = 2;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += exponentialFloat64(rng, rate);
    }
    const sampleMean = sum / n;
    expect(sampleMean).toBeCloseTo(1 / rate, 1);
  });
});
