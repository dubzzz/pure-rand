import fc from 'fast-check';

import { uniformIntDistribution } from '../../../src/distribution/UniformIntDistribution';
import mersenne from '../../../src/generator/MersenneTwister';
import { RandomGenerator } from '../../../src/generator/RandomGenerator';

describe('uniformIntDistribution [non regression]', () => {
  it.each`
    from                       | to                         | topic
    ${0}                       | ${2 ** 3 - 1}              | ${"range of size divisor of mersenne's one"}
    ${0}                       | ${2 ** 3 - 2}              | ${"range of size divisor of mersenne's one minus one"}
    ${0}                       | ${2 ** 3}                  | ${"range of size divisor of mersenne's one plus one"}
    ${48}                      | ${69}                      | ${'random range'}
    ${-0x80000000}             | ${0x7fffffff}              | ${"mersenne's range"}
    ${-0x80000000}             | ${0x7fffffff - 1}          | ${"mersenne's range minus one"}
    ${-0x80000000}             | ${0x7fffffff + 1}          | ${"mersenne's range plus one"}
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

    let rng: RandomGenerator = mersenne(0);
    const distribution = uniformIntDistribution(from, to);

    const values: number[] = [];
    for (let idx = 0; idx !== 10; ++idx) {
      const [v, nrng] = distribution(rng);
      values.push(v);
      rng = nrng;
    }
    expect(values).toMatchSnapshot();
  });

  it('Should always generate values within the range [from ; to]', () =>
    fc.assert(
      fc.property(fc.integer().noShrink(), fc.maxSafeInteger(), fc.maxSafeInteger(), (seed, a, b) => {
        const [from, to] = a < b ? [a, b] : [b, a];
        const [v, _nrng] = uniformIntDistribution(from, to)(mersenne(seed));
        return v >= from && v <= to;
      })
    ));
});
