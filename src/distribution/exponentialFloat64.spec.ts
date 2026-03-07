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
        (seed, lambda) => {
          const rng = mersenne(seed);
          const v = exponentialFloat64(rng, lambda);
          expect(v).toBeGreaterThanOrEqual(0);
        },
      ),
    ));

  it('Should always generate finite values for positive lambdas', () =>
    fc.assert(
      fc.property(
        fc.noShrink(fc.integer()),
        fc.double({ min: Number.EPSILON, max: 1e10, noNaN: true }),
        (seed, lambda) => {
          const rng = mersenne(seed);
          const v = exponentialFloat64(rng, lambda);
          expect(Number.isFinite(v)).toBe(true);
        },
      ),
    ));

  it('Should generate values with approximate mean 1/lambda over many samples', () => {
    const rng = mersenne(42);
    const n = 10000;
    const lambda = 2;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += exponentialFloat64(rng, lambda);
    }
    const sampleMean = sum / n;
    expect(sampleMean).toBeCloseTo(1 / lambda, 1);
  });
});
