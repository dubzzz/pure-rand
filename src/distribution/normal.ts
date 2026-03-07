import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformFloat64 } from './uniformFloat64';

const twoPi = 2 * Math.PI;

/**
 * Generate a random value following a normal (Gaussian) distribution
 * with the given mean and standard deviation.
 *
 * @example
 * // Simulating human heights in cm (mean=170, stddev=10)
 * normal(rng, 170, 10)
 *
 * @example
 * // Simulating measurement noise around a sensor reading
 * const reading = 25.0;
 * const noisy = reading + normal(rng, 0, 0.5);
 *
 * @example
 * // Generating standardized test scores (mean=100, stddev=15)
 * normal(rng, 100, 15)
 *
 * @remarks
 * Uses the Box-Muller transform. Each call consumes two values from the generator.
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param mean - Mean of the distribution
 * @param stddev - Standard deviation of the distribution
 *
 * @public
 */
export function normal(rng: RandomGenerator, mean: number, stddev: number): number {
  const u1 = 1 - uniformFloat64(rng);
  const u2 = uniformFloat64(rng);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(twoPi * u2);
  return mean + stddev * z;
}
