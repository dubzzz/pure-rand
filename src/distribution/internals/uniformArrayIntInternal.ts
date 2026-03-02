import type { RandomGenerator } from '../../types/RandomGenerator';
import { uniformIntInternal } from './uniformIntInternal';

/**
 * An ArrayInt represents an integer larger than what can be represented in classical JavaScript.
 * The values stored in data must be in the range [0, 0xffffffff].
 *
 * @example
 * ```js
 * { sign:  1, data: [ 42 ] } // = 42
 * { sign: -1, data: [ 42 ] } // = -42
 * { sign: -1, data: [ 5, 42 ] } // = -1 * (5 * 2**32 + 42)
 * { sign: -1, data: [ 1, 5, 42 ] } // = -1 * (1 * 2**64 + 5 * 2**32 + 42)
 * ```
 */
export type ArrayInt = {
  /**
   * Sign of the represented number
   */
  sign: -1 | 1;
  /**
   * Value of the number, must only contain numbers in the range [0, 0xffffffff]
   */
  data: number[];
};

/**
 * Uniformly generate ArrayInt in range [0 ; rangeSize[
 *
 * @remarks
 * In the worst case scenario it may discard half of the randomly generated value.
 * Worst case being: most significant number is 1 and remaining part evaluates to 0.
 *
 * @internal
 */
export function uniformArrayIntInternal(
  rng: RandomGenerator,
  out: ArrayInt['data'],
  rangeSize: ArrayInt['data'],
): ArrayInt['data'] {
  const rangeLength = rangeSize.length;

  // We iterate until we find a valid value for arrayInt
  while (true) {
    // We compute a new value for arrayInt
    for (let index = 0; index !== rangeLength; ++index) {
      const indexRangeSize = index === 0 ? rangeSize[0] + 1 : 0x100000000;
      const g = uniformIntInternal(rng, indexRangeSize);
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
