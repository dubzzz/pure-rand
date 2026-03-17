import type { RandomGenerator } from '../types/RandomGenerator';

const factor = 134217728; // = 1 << 27
const scale = 1.1102230246251565e-16; // = 2 ** -53
const mask1 = 67108863; // = (1 << 26) - 1
const mask2 = 134217727; // = (1 << 27) - 1

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
