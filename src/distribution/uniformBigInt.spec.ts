import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { uniformBigInt } from './uniformBigInt';
import { uniformInt } from './uniformInt';
import { mersenne } from '../generator/MersenneTwister';

const bigIntArbitrary = fc
  .tuple(fc.boolean(), fc.nat(0xffffffff), fc.nat(0xffffffff), fc.nat(0xffffffff), fc.nat(0xffffffff))
  .map(([sign, a3, a2, a1, a0]) => {
    return (sign ? -1n : 1n) * ((BigInt(a3) << 96n) + (BigInt(a2) << 64n) + (BigInt(a1) << 32n) + BigInt(a0));
  });

describe('uniformBigInt', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }
  if (typeof BigInt !== 'undefined') {
    it('Should always generate values within the range', () =>
      fc.assert(
        fc.property(fc.noShrink(fc.integer()), bigIntArbitrary, bigIntArbitrary, (seed, a, b) => {
          const minV = a < b ? a : b;
          const maxV = a < b ? b : a;
          const v = uniformBigInt(mersenne(seed), minV, maxV);
          return v >= minV && v <= maxV;
        }),
      ));
    it('Should be equivalent to uniformInt integers within generator range', () =>
      fc.assert(
        fc.property(
          fc.noShrink(fc.integer()),
          fc.integer({ min: -0x80000000, max: 0x7fffffff }),
          fc.integer({ min: -0x80000000, max: 0x7fffffff }),
          (seed, a, b) => {
            const minV = a < b ? a : b;
            const maxV = a < b ? b : a;
            const rngInt = mersenne(seed);
            const vInt = uniformInt(rngInt, minV, maxV);
            const rngBigInt = mersenne(seed);
            const vBigInt = uniformBigInt(rngBigInt, BigInt(minV), BigInt(maxV));
            expect(Number(vBigInt)).toBe(vInt); // same values
            expect(rngBigInt.getState()).toEqual(rngInt.getState()); // same state within generators
            expect(rngBigInt.next()).toBe(rngInt.next()); // same next value (this check is optional given we already checked for equal states, it just plays the role of a confirmation)
          },
        ),
      ));
  }
});
