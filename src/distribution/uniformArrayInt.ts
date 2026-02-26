import type { RandomGenerator } from '../types/RandomGenerator';
import type { ArrayInt } from './internals/ArrayInt';
import {
  addArrayIntToNew,
  addOneToPositiveArrayInt,
  substractArrayIntToNew,
  trimArrayIntInplace,
} from './internals/ArrayInt';
import { uniformArrayIntInternal } from './internals/uniformArrayIntInternal';

/**
 * Uniformly generate random ArrayInt values between `from` (included) and `to` (included)
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 *
 * @public
 */
export function uniformArrayInt(rng: RandomGenerator, from: ArrayInt, to: ArrayInt): ArrayInt {
  const rangeSize = trimArrayIntInplace(addOneToPositiveArrayInt(substractArrayIntToNew(to, from)));
  const emptyArrayIntData = rangeSize.data.slice(0);
  const g = uniformArrayIntInternal(rng, emptyArrayIntData, rangeSize.data);
  return trimArrayIntInplace(addArrayIntToNew({ sign: 1, data: g }, from));
}
