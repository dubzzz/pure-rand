import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformFloat64 } from './uniformFloat64';

/**
 * Generate a random non-negative integer following a Poisson distribution with the given lambda.
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
