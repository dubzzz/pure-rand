import * as fc from 'fast-check';

import { unsafeUniformIntDistributionInternal } from '../../../../src/distribution/internals/UnsafeUniformIntDistributionInternal';
import { RandomGenerator } from '../../../../src/generator/RandomGenerator';

class NatGenerator implements RandomGenerator {
  constructor(private current: number) {
    this.current = current | 0;
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
    this.current = (this.current + 1) | 0;
    return previousCurrent;
  }
}

const MAX_RANGE: number = 1000;

describe('unsafeUniformIntDistributionInternal', () => {
  it('Should always generate values within the range [0 ; rangeSize[', () =>
    fc.assert(
      fc.property(fc.nat(), fc.integer({ min: 1, max: MAX_RANGE }), (offset, rangeSize) => {
        const v = unsafeUniformIntDistributionInternal(rangeSize, new NatGenerator(offset));
        return v >= 0 && v < rangeSize;
      })
    ));
  it('Should be able to generate all values of the range [0 ; rangeSize[', () =>
    fc.assert(
      fc.property(fc.nat(), fc.integer({ min: 1, max: MAX_RANGE }), fc.nat(), (offset, rangeSize, targetOffset) => {
        const target = targetOffset % rangeSize;
        const rng: RandomGenerator = new NatGenerator(offset);
        for (let numTries = 0; numTries < 2 * rangeSize; ++numTries) {
          const v = unsafeUniformIntDistributionInternal(rangeSize, rng);
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
          const rng: RandomGenerator = new NatGenerator(offset);
          for (let numTries = 0; numTries < num * rangeSize; ++numTries) {
            const v = unsafeUniformIntDistributionInternal(rangeSize, rng);
            buckets[v] += 1;
          }
          return buckets.every((n) => n === num);
        }
      )
    ));
});
