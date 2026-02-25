import type { Distribution } from '../types/Distribution';
import type { RandomGenerator } from '../types/RandomGenerator';
import { unsafeUniformIntDistribution } from './UnsafeUniformIntDistribution';

/**
 * Uniformly generate random integer values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 *
 * @public
 */
function uniformIntDistribution(from: number, to: number): Distribution<number>;
/**
 * Uniformly generate random integer values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
function uniformIntDistribution(from: number, to: number, rng: RandomGenerator): [number, RandomGenerator];
function uniformIntDistribution(from: number, to: number, rng?: RandomGenerator) {
  if (rng !== undefined) {
    const nextRng = rng.clone();
    return [unsafeUniformIntDistribution(nextRng, from, to), nextRng];
  }
  return function (rng: RandomGenerator) {
    const nextRng = rng.clone();
    return [unsafeUniformIntDistribution(nextRng, from, to), nextRng];
  };
}

export { uniformIntDistribution };
