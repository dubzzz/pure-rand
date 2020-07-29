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
          fc.integer(MERSENNE_MIN, MERSENNE_MAX),
          fc.integer(MERSENNE_MIN, MERSENNE_MAX),
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
    it.each`
      from                       | to                         | topic
      ${0}                       | ${2 ** 3 - 1}              | ${"range of size divisor of mersenne's one"}
      ${0}                       | ${2 ** 3 - 2}              | ${"range of size divisor of mersenne's one minus one"}
      ${0}                       | ${2 ** 3}                  | ${"range of size divisor of mersenne's one plus one"}
      ${48}                      | ${69}                      | ${'random range'}
      ${MERSENNE_MIN}            | ${MERSENNE_MAX}            | ${"mersenne's range"}
      ${MERSENNE_MIN}            | ${MERSENNE_MAX - 1}        | ${"mersenne's range minus one"}
      ${MERSENNE_MIN}            | ${MERSENNE_MAX + 1}        | ${"mersenne's range plus one"}
      ${0}                       | ${2 ** 40 - 1}             | ${"range of size multiple of mersenne's one"}
      ${0}                       | ${2 ** 40 - 2}             | ${"range of size multiple of mersenne's one minus one"}
      ${0}                       | ${2 ** 40}                 | ${"range of size multiple of mersenne's one plus one"}
      ${Number.MIN_SAFE_INTEGER} | ${Number.MAX_SAFE_INTEGER} | ${'full integer range'}
    `('Should not change its output in range ($from, $to) except for major bumps', ({ from, to }) => {
      // Remark:
      // ========================
      // This test is purely there to ensure that we do not introduce any regression
      // during a commit without noticing it.
      // The values we expect in the output are just a snapshot taken at a certain time
      // in the past. They might be wrong values with bugs.

      let rng = mersenne(0);
      const distribution = uniformBigIntDistribution(BigInt(from), BigInt(to));

      const values: bigint[] = [];
      for (let idx = 0; idx !== 10; ++idx) {
        const [v, nrng] = distribution(rng);
        values.push(v);
        rng = nrng;
      }
      expect(values).toMatchSnapshot();
    });
  }
});
