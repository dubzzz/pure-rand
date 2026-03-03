import type { RandomGenerator } from '../../types/RandomGenerator';

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * With rangeSize <= 0x100000000
 * @internal
 */
export function uniformIntInternal(rng: RandomGenerator, rangeSize: number): number {
  // Fast path: full 32-bit range needs no rejection or modulo
  if (rangeSize === 0x100000000) {
    return rng.next() + 0x80000000;
  }
  // Fast path: power-of-2 ranges have no bias (2^32 is evenly divisible), use bitwise AND
  const mask = (rangeSize - 1) | 0;
  if ((rangeSize & mask) === 0) {
    return rng.next() & mask;
  }
  // General case: rejection sampling to guarantee uniformity
  const MaxAllowed = ~~(0x100000000 / rangeSize) * rangeSize;
  let deltaV = rng.next() + 0x80000000;
  while (deltaV >= MaxAllowed) {
    deltaV = rng.next() + 0x80000000;
  }
  return deltaV % rangeSize;
}
