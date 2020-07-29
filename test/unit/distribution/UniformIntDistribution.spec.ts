import * as fc from 'fast-check';

import { uniformIntDistribution } from '../../../src/distribution/UniformIntDistribution';
import mersenne from '../../../src/generator/MersenneTwister';
import RandomGenerator from '../../../src/generator/RandomGenerator';

const MERSENNE_MIN = mersenne(0).min();
const MERSENNE_MAX = mersenne(0).max();

class NatGenerator implements RandomGenerator {
  readonly current: number;
  constructor(current: number) {
    this.current = current % 0x80000000;
  }

  next(): [number, RandomGenerator] {
    return [this.current, new NatGenerator(this.current + 1)];
  }
  min(): number {
    return 0;
  }
  max(): number {
    return 0x7fffffff;
  }
}

class ModNatGenerator implements RandomGenerator {
  constructor(readonly current: RandomGenerator, readonly mod: number) {}

  next(): [number, RandomGenerator] {
    const [v, nrng] = this.current.next();
    return [Math.abs(v % this.mod), new ModNatGenerator(nrng, this.mod)];
  }
  min(): number {
    return 0;
  }
  max(): number {
    return this.mod - 1;
  }
}

const MAX_RANGE: number = 1000;

describe('uniformIntDistribution', () => {
  it('Should always generate values within the range', () =>
    fc.assert(
      fc.property(fc.nat(), fc.integer(), fc.integer(0, MAX_RANGE), (offset, from, gap) => {
        const [v, nrng] = uniformIntDistribution(from, from + gap)(new NatGenerator(offset));
        return v >= from && v <= from + gap;
      })
    ));
  it('Should be able to generate all values within the range', () =>
    fc.assert(
      fc.property(fc.nat(), fc.integer(), fc.integer(0, MAX_RANGE), fc.nat(), (offset, from, gap, targetOffset) => {
        const target = from + (targetOffset % (gap + 1));
        let rng: RandomGenerator = new NatGenerator(offset);
        for (let numTries = 0; numTries < 2 * gap + 1; ++numTries) {
          const [v, nrng] = uniformIntDistribution(from, from + gap)(rng);
          rng = nrng;
          if (v === target) {
            return true;
          }
        }
        return false; //twice the length should always be enough (+1 to avoid length = 0)
      })
    ));
  it('Should be evenly distributed over the range', () =>
    fc.assert(
      fc.property(fc.nat(), fc.integer(), fc.integer(0, MAX_RANGE), fc.integer(1, 100), (offset, from, gap, num) => {
        let buckets = [...Array(gap + 1)].map(() => 0);
        let rng: RandomGenerator = new NatGenerator(offset);
        for (let numTries = 0; numTries < num * (gap + 1); ++numTries) {
          const [v, nrng] = uniformIntDistribution(from, from + gap)(rng);
          rng = nrng;
          buckets[v - from] += 1;
        }
        return buckets.every((n) => n === num);
      })
    ));
  it('Should be able to generate values larger than the RandomGenerator', () =>
    fc.assert(
      fc.property(fc.integer(), fc.integer(2, 0x7fffffff), (seed, mod) => {
        let rng: RandomGenerator = new ModNatGenerator(mersenne(seed), mod);
        for (let numTries = 0; numTries < 100; ++numTries) {
          const [v, nrng] = uniformIntDistribution(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)(rng);
          rng = nrng;
          if (v > rng.max()) {
            return true;
          }
        }
        return false;
      })
    ));
  it('Should be able to generate values outside bitwise operations', () =>
    fc.assert(
      fc.property(fc.integer(), fc.integer(2, 0x7fffffff), (seed, mod) => {
        let rng: RandomGenerator = new ModNatGenerator(mersenne(seed), mod);
        for (let numTries = 0; numTries < 100; ++numTries) {
          const [v, nrng] = uniformIntDistribution(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)(rng);
          rng = nrng;
          if (v > 0xffffffff) {
            return true;
          }
        }
        return false;
      })
    ));
  it('Should be equivalent to call the 2-parameter and 3-parameter', () =>
    fc.assert(
      fc.property(fc.nat(), fc.integer(), fc.integer(0, MAX_RANGE), (offset, from, gap) => {
        const [v1, nrng1] = uniformIntDistribution(from, from + gap)(new NatGenerator(offset));
        const [v2, nrng2] = uniformIntDistribution(from, from + gap, new NatGenerator(offset));
        return v1 === v2;
      })
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
    const distribution = uniformIntDistribution(from, to);

    const values: number[] = [];
    for (let idx = 0; idx !== 10; ++idx) {
      const [v, nrng] = distribution(rng);
      values.push(v);
      rng = nrng;
    }
    expect(values).toMatchSnapshot();
  });
});
