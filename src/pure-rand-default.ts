import type { RandomGenerator } from './types/RandomGenerator';
import { congruential32 } from './generator/LinearCongruential';
import { mersenne } from './generator/MersenneTwister';
import { xorshift128plus } from './generator/XorShift';
import { xoroshiro128plus } from './generator/XoroShiro';

import type { Distribution } from './types/Distribution';
import { uniformArrayIntDistribution } from './distribution/UniformArrayIntDistribution';
import { uniformBigIntDistribution } from './distribution/UniformBigIntDistribution';
import { uniformIntDistribution } from './distribution/UniformIntDistribution';
import { unsafeUniformArrayIntDistribution } from './distribution/UnsafeUniformArrayIntDistribution';
import { unsafeUniformBigIntDistribution } from './distribution/UnsafeUniformBigIntDistribution';
import { unsafeUniformIntDistribution } from './distribution/UnsafeUniformIntDistribution';
import { skipN } from './distribution/SkipN';
import { generateN } from './distribution/GenerateN';
import { unsafeGenerateN } from './distribution/UnsafeGenerateN';
import { unsafeSkipN } from './distribution/UnsafeSkipN';

// Explicit cast into string to avoid to have __type: process.env.__PACKAGE_TYPE__
const __type = process.env.__PACKAGE_TYPE__ as string;
const __version = process.env.__PACKAGE_VERSION__ as string;
const __commitHash = process.env.__COMMIT_HASH__ as string;

export {
  __type,
  __version,
  __commitHash,
  RandomGenerator,
  generateN,
  skipN,
  unsafeGenerateN,
  unsafeSkipN,
  congruential32,
  mersenne,
  xorshift128plus,
  xoroshiro128plus,
  Distribution,
  uniformArrayIntDistribution,
  uniformBigIntDistribution,
  uniformIntDistribution,
  unsafeUniformArrayIntDistribution,
  unsafeUniformBigIntDistribution,
  unsafeUniformIntDistribution,
};
