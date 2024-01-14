import { RandomGenerator } from '../../generator/RandomGenerator';
import { ArrayInt } from './ArrayInt';
import { unsafeUniformIntDistributionInternal } from './UnsafeUniformIntDistributionInternal';

/**
 * Uniformly generate ArrayInt in range [0 ; rangeSize[
 *
 * @remarks
 * In the worst case scenario it may discard half of the randomly generated value.
 * Worst case being: most significant number is 1 and remaining part evaluates to 0.
 *
 * @internal
 */
export function unsafeUniformArrayIntDistributionInternal(
  out: ArrayInt['data'],
  rangeSize: ArrayInt['data'],
  rng: RandomGenerator,
): ArrayInt['data'] {
  const rangeLength = rangeSize.length;

  // We iterate until we find a valid value for arrayInt
  while (true) {
    // We compute a new value for arrayInt
    for (let index = 0; index !== rangeLength; ++index) {
      const indexRangeSize = index === 0 ? rangeSize[0] + 1 : 0x100000000;
      const g = unsafeUniformIntDistributionInternal(indexRangeSize, rng);
      out[index] = g;
    }

    // If in the correct range we can return it
    for (let index = 0; index !== rangeLength; ++index) {
      const current = out[index];
      const currentInRange = rangeSize[index];
      if (current < currentInRange) {
        return out; // arrayInt < rangeSize
      } else if (current > currentInRange) {
        break; // arrayInt > rangeSize
      }
    }
    // Otherwise we need to try another one
  }
}
