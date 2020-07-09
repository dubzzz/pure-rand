import { RandomGenerator, generateN, skipN } from './generator/RandomGenerator';
import { congruential, congruential32 } from './generator/LinearCongruential';
import mersenne from './generator/MersenneTwister';
import { xorshift128plus } from './generator/XorShift';
import { xoroshiro128plus } from './generator/XoroShiro';

import Distribution from './distribution/Distribution';
import { uniformBigIntDistribution } from './distribution/UniformBigIntDistribution';
import { uniformIntDistribution } from './distribution/UniformIntDistribution';

// Explicit cast into string to avoid to have __type: "__PACKAGE_TYPE__"
const __type = '__PACKAGE_TYPE__' as string;
const __version = '__PACKAGE_VERSION__' as string;

export {
  __type,
  __version,
  RandomGenerator,
  generateN,
  skipN,
  congruential,
  congruential32,
  mersenne,
  xorshift128plus,
  xoroshiro128plus,
  Distribution,
  uniformBigIntDistribution,
  uniformIntDistribution,
};
