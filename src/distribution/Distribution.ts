import { RandomGenerator } from '../generator/RandomGenerator';

/**
 * Generate random value based on a given RandomGenerator.
 * Return the generated value and an offsetted version of the RandomGenerator (never alters the source rng).
 * @public
 */
export type Distribution<T> = (rng: RandomGenerator) => [T, RandomGenerator];

/**
 * Generate random value based on a given RandomGenerator.
 * Return the generated value. WARNING: The original random number generator (rng) will be altered.
 * @public
 */
export type UnsafeDistribution<T> = (rng: RandomGenerator) => T;
