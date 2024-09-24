import type { Distribution } from '../types/Distribution';
import type { RandomGenerator } from '../types/RandomGenerator';
import { unsafeUniformBigIntDistribution } from './UnsafeUniformBigIntDistribution';

/**
 * Uniformly generate random bigint values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 *
 * @public
 */
function uniformBigIntDistribution(from: bigint, to: bigint): Distribution<bigint>;
/**
 * Uniformly generate random bigint values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
function uniformBigIntDistribution(from: bigint, to: bigint, rng: RandomGenerator): [bigint, RandomGenerator];
function uniformBigIntDistribution(from: bigint, to: bigint, rng?: RandomGenerator) {
  if (rng != null) {
    const nextRng = rng.clone();
    return [unsafeUniformBigIntDistribution(from, to, nextRng), nextRng];
  }
  return function (rng: RandomGenerator) {
    const nextRng = rng.clone();
    return [unsafeUniformBigIntDistribution(from, to, nextRng), nextRng];
  };
}

export { uniformBigIntDistribution };
