import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformFloat64 } from './uniformFloat64';

/**
 * Generate a random non-negative integer following a Poisson distribution with the given lambda.
 *
 * @example
 * // Simulating the number of customer arrivals per hour (average 4 per hour)
 * poissonInt(rng, 4)
 *
 * @example
 * // Simulating the number of typos per page (average 2 per page)
 * poissonInt(rng, 2)
 *
 * @example
 * // Simulating the number of server requests per second (average 50 per second)
 * poissonInt(rng, 50)
 *
 * @remarks
 * Uses Knuth's algorithm in log-space to avoid numerical underflow for large lambda values.
 * Time complexity is O(lambda) on average.
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param lambda - Mean of the distribution (must be >= 0)
 *
 * @public
 */
export function poissonInt(rng: RandomGenerator, lambda: number): number {
  let k = 0;
  let logP = 0;
  do {
    k++;
    logP += Math.log(1 - uniformFloat64(rng));
  } while (logP > -lambda);
  return k - 1;
}
