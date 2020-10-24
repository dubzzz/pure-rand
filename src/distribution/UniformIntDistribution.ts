import Distribution from './Distribution';
import RandomGenerator from '../generator/RandomGenerator';
import { uniformIntDistributionInternal } from './internals/UniformIntDistributionInternal';

function uniformIntInternal(from: number, rangeSize: number, rng: RandomGenerator): [number, RandomGenerator] {
  const g = uniformIntDistributionInternal(rangeSize, rng);
  g[0] += from;
  return g;
}

function uniformIntDistribution(from: number, to: number): Distribution<number>;
function uniformIntDistribution(from: number, to: number, rng: RandomGenerator): [number, RandomGenerator];
function uniformIntDistribution(from: number, to: number, rng?: RandomGenerator) {
  const rangeSize = to - from + 1;
  if (rng != null) {
    return uniformIntInternal(from, rangeSize, rng);
  }
  return function (rng: RandomGenerator) {
    return uniformIntInternal(from, rangeSize, rng);
  };
}

export { uniformIntDistribution };
