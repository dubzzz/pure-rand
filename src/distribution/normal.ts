import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformFloat64 } from './uniformFloat64';

const safeMathSqrt = Math.sqrt;
const safeMathLog = Math.log;
const safeMathCos = Math.cos;
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
 * // Simulating daily temperatures in °C for a city (mean=20, stddev=5)
 * normal(rng, 20, 5)
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param mean - Mean of the distribution
 * @param stddev - Standard deviation of the distribution
 *
 * @public
 */
export function normal(rng: RandomGenerator, mean: number, stddev: number): number {
  // Box-Muller transform: each call consumes two values from the generator
  const u1 = 1 - uniformFloat64(rng);
  const u2 = uniformFloat64(rng);
  const z = safeMathSqrt(-2 * safeMathLog(u1)) * safeMathCos(twoPi * u2);
  return mean + stddev * z;
}
