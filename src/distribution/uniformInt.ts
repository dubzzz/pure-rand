import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformIntInternal } from './internals/uniformIntInternal';
import { uniformBigInt } from './uniformBigInt';

const SBigInt = BigInt;
const SNumber = Number;

/**
 * Uniformly generate random integer values between `from` (included) and `to` (included)
 *
 * Both `from` and `to` must be integers within the safe range: [-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 *
 * @public
 */
export function uniformInt(rng: RandomGenerator, from: number, to: number): number {
  const rangeSize = to - from;
  if (rangeSize <= 0xffffffff) {
    // Calling uniformIntInternal can be considered safe up-to 2**32 values. Above this range it may miss values.
    const g = uniformIntInternal(rng, rangeSize + 1);
    return g + from;
  }
  const g = uniformBigInt(rng, SBigInt(from), SBigInt(to));
  return SNumber(g);
}
