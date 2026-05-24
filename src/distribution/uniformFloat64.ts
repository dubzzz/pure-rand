import type { RandomGenerator } from '../types/RandomGenerator';

const scale26 = 1.4901161193847656e-8; // = 2 ** -26
const scale53 = 1.1102230246251565e-16; // = 2 ** -53
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
  // Mathematically equivalent to (and bit-identical to) `(value1 * 2**27 + value2) * 2**-53`,
  // but distributing the final multiplication into both terms is consistently ~7% faster on V8.
  // The reformulation avoids the intermediate `value1 * 2**27` which produces a number close
  // to 2**53 (forcing int->double promotion before the second multiply); instead both terms
  // are computed as `smallInt * smallFloat` and then summed.
  const value1 = rng.next() & mask1;
  const value2 = rng.next() & mask2;
  return value1 * scale26 + value2 * scale53;
}
