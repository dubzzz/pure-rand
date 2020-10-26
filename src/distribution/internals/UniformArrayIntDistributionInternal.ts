import RandomGenerator from '../../generator/RandomGenerator';
import { ArrayInt } from './ArrayInt';
import { uniformIntDistributionInternal } from './UniformIntDistributionInternal';

/**
 * Uniformly generate ArrayInt in range [0 ; rangeSize[
 *
 * @remarks
 * In the worst case scenario it may discard half of the randomly generated value.
 * Worst case being: most significant number is 1 and remaining part evaluates to 0.
 *
 * @internal
 */
export function uniformArrayIntDistributionInternal(
  rangeSize: ArrayInt['data'],
  rng: RandomGenerator
): [ArrayInt['data'], RandomGenerator] {
  const rangeLength = rangeSize.length;

  // Initialize our arrayInt only once
  // It might be re-used multiple times until we reach a valid value
  const arrayInt = [];
  for (let index = 0; index !== rangeLength; ++index) {
    arrayInt.push(0);
  }
  let nrng = rng;

  // We iterate until we find a valid value for arrayInt
  while (true) {
    // We compute a new value for arrayInt
    for (let index = 0; index !== rangeLength; ++index) {
      const indexRangeSize = index === 0 ? rangeSize[0] + 1 : 0x100000000;
      const g = uniformIntDistributionInternal(indexRangeSize, nrng);
      arrayInt[index] = g[0];
      nrng = g[1];
    }

    // If in the correct range we can return it
    for (let index = 0; index !== rangeLength; ++index) {
      const current = arrayInt[index];
      const currentInRange = rangeSize[index];
      if (current < currentInRange) {
        return [arrayInt, nrng]; // arrayInt < rangeSize
      } else if (current > currentInRange) {
        break; // arrayInt > rangeSize
      }
    }
    // Otherwise we need to try another one
  }
}
