import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformFloat64 } from './uniformFloat64';

/**
 * Generate a random value following an exponential distribution with the given lambda.
 *
 * @remarks
 * Uses the inverse CDF method. Values are in [0, +Infinity).
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param lambda - Rate parameter of the distribution (must be &gt; 0)
 *
 * @public
 */
export function exponentialFloat64(rng: RandomGenerator, lambda: number): number {
  const u = 1 - uniformFloat64(rng);
  return -Math.log(u) / lambda;
}
