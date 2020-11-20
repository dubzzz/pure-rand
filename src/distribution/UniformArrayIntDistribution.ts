import Distribution from './Distribution';
import RandomGenerator from '../generator/RandomGenerator';
import { addArrayIntToNew, addOneToPositiveArrayInt, ArrayInt, substractArrayIntToNew } from './internals/ArrayInt';
import { uniformArrayIntDistributionInternal } from './internals/UniformArrayIntDistributionInternal';

/** @internal */
function uniformArrayIntInternal(from: ArrayInt, to: ArrayInt, rng: RandomGenerator): [ArrayInt, RandomGenerator] {
  const rangeSize = addOneToPositiveArrayInt(substractArrayIntToNew(to, from));
  const emptyArrayIntData = rangeSize.data.slice(0);
  const g = uniformArrayIntDistributionInternal(emptyArrayIntData, rangeSize.data, rng);
  return [addArrayIntToNew({ sign: 1, data: g[0] }, from), g[1]];
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
