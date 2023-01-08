import { RandomGenerator } from '../generator/RandomGenerator';
import { unsafeUniformIntDistributionInternalBigInt } from './internals/UnsafeUniformIntDistributionInternal';

/**
 * Uniformly generate random integer values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
export function unsafeUniformIntDistribution(from: number, to: number, rng: RandomGenerator): number {
  const rangeSize = to - from;
  return unsafeUniformIntDistributionInternalBigInt(rangeSize + 1, rng);
}
