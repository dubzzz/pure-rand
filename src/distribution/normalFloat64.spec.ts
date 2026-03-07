import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalFloat64 } from './normalFloat64';
import { mersenne } from '../generator/mersenne';

describe('normalFloat64', () => {
  it('Should always generate finite values', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), (seed) => {
        const rng = mersenne(seed);
        const v = normalFloat64(rng, 0, 1);
        expect(Number.isFinite(v)).toBe(true);
      }),
    ));

  it('Should always return mean when stddev is 0', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), fc.double({ noNaN: true, noDefaultInfinity: true }), (seed, mean) => {
        const rng = mersenne(seed);
        const v = normalFloat64(rng, mean, 0);
        // Use === so that -0 and +0 are considered equal
        expect(v === mean).toBe(true);
      }),
    ));

  it('Should generate values with approximate mean and stddev over many samples', () => {
    const rng = mersenne(42);
    const n = 10000;
    let sum = 0;
    let sumSq = 0;
    const mean = 5;
    const stddev = 2;
    for (let i = 0; i < n; i++) {
      const v = normalFloat64(rng, mean, stddev);
      sum += v;
      sumSq += v * v;
    }
    const sampleMean = sum / n;
    const sampleVariance = sumSq / n - sampleMean * sampleMean;
    // Allow 5% relative error for mean and variance
    expect(sampleMean).toBeCloseTo(mean, 0);
    expect(Math.sqrt(sampleVariance)).toBeCloseTo(stddev, 0);
  });
});
