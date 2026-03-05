import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformFloat64 } from './uniformFloat64';

/**
 * Generate a random value following an exponential distribution with the given rate (lambda).
 *
 * @remarks
 * Uses the inverse CDF method. Values are in [0, +Infinity).
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param rate - Rate parameter (lambda) of the distribution (must be > 0, default: 1)
 *
 * @public
 */
export function exponentialFloat64(rng: RandomGenerator, rate: number = 1): number {
  // Inverse CDF: -ln(U) / rate where U is uniform in (0, 1]
  // We use 1 - uniformFloat64(rng) to shift from [0, 1) to (0, 1] and avoid log(0)
  const u = 1 - uniformFloat64(rng);
  return -Math.log(u) / rate;
}
