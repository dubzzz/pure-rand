import { describe, it, expect } from 'vitest';
import * as assert from 'assert';
import * as fc from 'fast-check';

import { uniformBigInt } from '../../../src/distribution/uniformBigInt';
import { uniformInt } from '../../../src/distribution/uniformInt';
import { mersenne } from '../../../src/generator/MersenneTwister';

const bigIntArbitrary = fc
  .tuple(fc.boolean(), fc.nat(0xffffffff), fc.nat(0xffffffff), fc.nat(0xffffffff), fc.nat(0xffffffff))
  .map(([sign, a3, a2, a1, a0]) => {
    return (
      (sign ? BigInt(-1) : BigInt(1)) *
      ((BigInt(a3) << BigInt(96)) + (BigInt(a2) << BigInt(64)) + (BigInt(a1) << BigInt(32)) + BigInt(a0))
    );
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
            assert.strictEqual(Number(vBigInt), vInt); // same values
            assert.strictEqual(rngBigInt.next()[0], rngInt.next()[0]); // same state within generators
          },
        ),
      ));
  }
});
