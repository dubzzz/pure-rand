import * as assert from 'assert';
import * as fc from 'fast-check';

import { uniformBigIntDistribution } from '../../../src/distribution/UniformBigIntDistribution';
import { uniformIntDistribution } from '../../../src/distribution/UniformIntDistribution';
import mersenne from '../../../src/generator/MersenneTwister';

const MERSENNE_MIN = mersenne(0).min();
const MERSENNE_MAX = mersenne(0).max();

const bigIntArbitrary = fc
  .tuple(fc.boolean(), fc.nat(0xffffffff), fc.nat(0xffffffff), fc.nat(0xffffffff), fc.nat(0xffffffff))
  .map(([sign, a3, a2, a1, a0]) => {
    return (
      (sign ? BigInt(-1) : BigInt(1)) *
      ((BigInt(a3) << BigInt(96)) + (BigInt(a2) << BigInt(64)) + (BigInt(a1) << BigInt(32)) + BigInt(a0))
    );
  });

describe('uniformBigIntDistribution', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }
  if (typeof BigInt !== 'undefined') {
    it('Should always generate values within the range', () =>
      fc.assert(
        fc.property(fc.integer().noShrink(), bigIntArbitrary, bigIntArbitrary, (seed, a, b) => {
          const minV = a < b ? a : b;
          const maxV = a < b ? b : a;
          const [v, nrng] = uniformBigIntDistribution(minV, maxV)(mersenne(seed));
          return v >= minV && v <= maxV;
        })
      ));
    it('Should be equivalent to uniformIntDistribution integers within generator range', () =>
      fc.assert(
        fc.property(
          fc.integer().noShrink(),
          fc.integer({ min: MERSENNE_MIN, max: MERSENNE_MAX }),
          fc.integer({ min: MERSENNE_MIN, max: MERSENNE_MAX }),
          (seed, a, b) => {
            const minV = a < b ? a : b;
            const maxV = a < b ? b : a;
            const [vInt, nrngInt] = uniformIntDistribution(minV, maxV)(mersenne(seed));
            const [vBigInt, nrngBigInt] = uniformBigIntDistribution(BigInt(minV), BigInt(maxV))(mersenne(seed));
            assert.strictEqual(Number(vBigInt), vInt); // same values
            assert.strictEqual(nrngBigInt.next()[0], nrngInt.next()[0]); // same generator
          }
        )
      ));
  }
});
