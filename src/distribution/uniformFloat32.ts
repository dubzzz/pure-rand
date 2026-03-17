import type { RandomGenerator } from '../types/RandomGenerator';

const scale = 5.960464477539063e-8; // = 1 / divisor (with divisor = 1 << 24)
const mask = 16777215; // = divisor - 1

/**
 * Uniformly generate random 32-bit floating point values between 0 (included) and 1 (excluded)
 *
 * @remarks Generated values are multiples of 2**-24, providing 24 bits of randomness.
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
export function uniformFloat32(rng: RandomGenerator): number {
  const value = rng.next() & mask;
  return value * scale;
}
