import { Distribution } from '../types/Distribution';
import { RandomGenerator } from '../types/RandomGenerator';
import { ArrayInt } from './internals/ArrayInt';
import { unsafeUniformArrayIntDistribution } from './UnsafeUniformArrayIntDistribution';

/**
 * Uniformly generate random ArrayInt values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 *
 * @public
 */
function uniformArrayIntDistribution(from: ArrayInt, to: ArrayInt): Distribution<ArrayInt>;
/**
 * Uniformly generate random ArrayInt values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
function uniformArrayIntDistribution(from: ArrayInt, to: ArrayInt, rng: RandomGenerator): [ArrayInt, RandomGenerator];
function uniformArrayIntDistribution(from: ArrayInt, to: ArrayInt, rng?: RandomGenerator) {
  if (rng != null) {
    const nextRng = rng.clone();
    return [unsafeUniformArrayIntDistribution(from, to, nextRng), nextRng];
  }
  return function (rng: RandomGenerator) {
    const nextRng = rng.clone();
    return [unsafeUniformArrayIntDistribution(from, to, nextRng), nextRng];
  };
}

export { uniformArrayIntDistribution };
