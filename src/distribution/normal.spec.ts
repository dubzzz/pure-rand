import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normal } from './normal';
import { mersenne } from '../generator/mersenne';

describe('normal', () => {
  it('Should always generate finite values', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), (seed) => {
        const rng = mersenne(seed);
        const v = normal(rng, 0, 1);
        expect(Number.isFinite(v)).toBe(true);
      }),
    ));

  it('Should always return mean when stddev is 0', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), fc.double({ noNaN: true, noDefaultInfinity: true }), (seed, mean) => {
        const rng = mersenne(seed);
        const v = normal(rng, mean, 0);
        // Use === so that -0 and +0 are considered equal
        expect(v === mean).toBe(true);
      }),
    ));
});
