import type { RandomGenerator } from '../types/RandomGenerator';

const factor = 1 << 27;
const scale = 2 ** -53;
const mask1 = (1 << 26) - 1;
const mask2 = (1 << 27) - 1;

/**
 * Uniformly generate random 64-bit floating point values between 0 (included) and 1 (excluded)
 *
 * @remarks Generated values are multiples of 2**-53, providing 53 bits of randomness.
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
export function uniformFloat64(rng: RandomGenerator): number {
  const value1 = rng.next() & mask1;
  const value2 = rng.next() & mask2;
  return (value1 * factor + value2) * scale;
}
