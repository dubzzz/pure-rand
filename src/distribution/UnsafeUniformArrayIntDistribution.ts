import { RandomGenerator } from '../types/RandomGenerator';
import {
  addArrayIntToNew,
  addOneToPositiveArrayInt,
  ArrayInt,
  substractArrayIntToNew,
  trimArrayIntInplace,
} from './internals/ArrayInt';
import { unsafeUniformArrayIntDistributionInternal } from './internals/UnsafeUniformArrayIntDistributionInternal';

/**
 * Uniformly generate random ArrayInt values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
export function unsafeUniformArrayIntDistribution(from: ArrayInt, to: ArrayInt, rng: RandomGenerator): ArrayInt {
  const rangeSize = trimArrayIntInplace(addOneToPositiveArrayInt(substractArrayIntToNew(to, from)));
  const emptyArrayIntData = rangeSize.data.slice(0);
  const g = unsafeUniformArrayIntDistributionInternal(emptyArrayIntData, rangeSize.data, rng);
  return trimArrayIntInplace(addArrayIntToNew({ sign: 1, data: g }, from));
}
