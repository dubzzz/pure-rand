import { Distribution } from './Distribution';
import { RandomGenerator } from '../generator/RandomGenerator';
import {
  addArrayIntToNew,
  addOneToPositiveArrayInt,
  ArrayInt,
  substractArrayIntToNew,
  trimArrayIntInplace,
} from './internals/ArrayInt';
import { unsafeUniformArrayIntDistributionInternal } from './internals/UnsafeUniformArrayIntDistributionInternal';

/** @internal */
function uniformArrayIntInternal(from: ArrayInt, to: ArrayInt, rng: RandomGenerator): [ArrayInt, RandomGenerator] {
  const rangeSize = trimArrayIntInplace(addOneToPositiveArrayInt(substractArrayIntToNew(to, from)));
  const emptyArrayIntData = rangeSize.data.slice(0);
  const nextRng = rng.clone();
  const g = unsafeUniformArrayIntDistributionInternal(emptyArrayIntData, rangeSize.data, nextRng);
  return [trimArrayIntInplace(addArrayIntToNew({ sign: 1, data: g }, from)), nextRng];
}

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
    return uniformArrayIntInternal(from, to, rng);
  }
  return function (rng: RandomGenerator) {
    return uniformArrayIntInternal(from, to, rng);
  };
}

export { uniformArrayIntDistribution };
