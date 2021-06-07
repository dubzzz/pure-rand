import * as fc from 'fast-check';

import { uniformIntDistributionInternal } from '../../../../src/distribution/internals/UniformIntDistributionInternal';
import mersenne from '../../../../src/generator/MersenneTwister';
import { RandomGenerator } from '../../../../src/generator/RandomGenerator';

class NatGenerator implements RandomGenerator {
  constructor(private current: number) {
    this.current = current % 0x80000000;
  }
  clone(): RandomGenerator {
    return new NatGenerator(this.current);
  }
  next(): [number, RandomGenerator] {
    const nextRng = this.clone();
    return [nextRng.unsafeNext(), nextRng];
  }
  unsafeNext(): number {
    const previousCurrent = this.current;
    this.current = (this.current + 1) % 0x80000000;
    return previousCurrent;
  }
  min(): number {
    return 0;
  }
  max(): number {
    return 0x7fffffff;
  }
}

class ModNatGenerator implements RandomGenerator {
  constructor(private current: RandomGenerator, private mod: number) {}
  clone(): RandomGenerator {
    return new ModNatGenerator(this.current, this.mod);
  }
  next(): [number, RandomGenerator] {
    const nextRng = this.clone();
    return [nextRng.unsafeNext(), nextRng];
  }
  unsafeNext(): number {
    const [v, nrng] = this.current.next();
    this.current = nrng;
    return Math.abs(v % this.mod);
  }
  min(): number {
    return 0;
  }
  max(): number {
    return this.mod - 1;
  }
}

const MAX_RANGE: number = 1000;

describe('uniformIntDistributionInternal', () => {
  it('Should always generate values within the range [0 ; rangeSize[', () =>
    fc.assert(
      fc.property(fc.nat(), fc.integer({ min: 1, max: MAX_RANGE }), (offset, rangeSize) => {
        const [v, nrng] = uniformIntDistributionInternal(rangeSize, new NatGenerator(offset));
        return v >= 0 && v < rangeSize;
      })
    ));
  it('Should be able to generate all values of the range [0 ; rangeSize[', () =>
    fc.assert(
      fc.property(fc.nat(), fc.integer({ min: 1, max: MAX_RANGE }), fc.nat(), (offset, rangeSize, targetOffset) => {
        const target = targetOffset % rangeSize;
        let rng: RandomGenerator = new NatGenerator(offset);
        for (let numTries = 0; numTries < 2 * rangeSize; ++numTries) {
          const [v, nrng] = uniformIntDistributionInternal(rangeSize, rng);
          rng = nrng;
          if (v === target) {
            return true;
          }
        }
        return false; //twice the length should always be enough (+1 to avoid length = 0)
      })
    ));
  it('Should be evenly distributed over the range [0 ; rangeSize[', () =>
    // NOTE:
    // >  Actually this property is true for any rangeSize >= 1 such that
    // >  there exists an N >= 1
    // >    where RNG_RANGE_SIZE ** N >= rangeSize and RNG_RANGE_SIZE ** N <= Number.MAX_SAFE_INTEGER
    // >    with RNG_RANGE_SIZE = rng.max() - rng.min() + 1
    fc.assert(
      fc.property(
        fc.nat(),
        fc.integer({ min: 1, max: MAX_RANGE }),
        fc.integer({ min: 1, max: 100 }),
        (offset, rangeSize, num) => {
          let buckets = [...Array(rangeSize)].map(() => 0);
          let rng: RandomGenerator = new NatGenerator(offset);
          for (let numTries = 0; numTries < num * rangeSize; ++numTries) {
            const [v, nrng] = uniformIntDistributionInternal(rangeSize, rng);
            rng = nrng;
            buckets[v] += 1;
          }
          return buckets.every((n) => n === num);
        }
      )
    ));
  it('Should be able to generate values larger than the RandomGenerator', () =>
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 2, max: 0x7fffffff }), (seed, mod) => {
        let rng: RandomGenerator = new ModNatGenerator(mersenne(seed), mod);
        expect(rng.max() - rng.min() + 1).toBeLessThan(Number.MAX_SAFE_INTEGER);

        for (let numTries = 0; numTries < 100; ++numTries) {
          const [v, nrng] = uniformIntDistributionInternal(Number.MAX_SAFE_INTEGER, rng);
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
      fc.property(fc.integer(), fc.integer({ min: 2, max: 0x7fffffff }), (seed, mod) => {
        let rng: RandomGenerator = new ModNatGenerator(mersenne(seed), mod);
        for (let numTries = 0; numTries < 100; ++numTries) {
          const [v, nrng] = uniformIntDistributionInternal(Number.MAX_SAFE_INTEGER, rng);
          rng = nrng;
          if (v > 0xffffffff) {
            return true;
          }
        }
        return false;
      })
    ));
});
