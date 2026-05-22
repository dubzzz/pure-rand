import type { RandomGenerator } from '../../types/RandomGenerator';

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * With rangeSize <= 0x100000000
 * @internal
 */
export function uniformIntInternal(rng: RandomGenerator, rangeSize: number): number {
  // Range provided by the RandomGenerator is large enough,
  // given rangeSize <= 0x100000000 and RandomGenerator is uniform on 0x100000000 values.
  // Fast paths:
  //  - rangeSize <= 2: MaxAllowed = 2^32, never rejects.
  //  - rangeSize === 2^32: MaxAllowed = 2^32, never rejects, and `deltaV % 2^32 === deltaV` so skip the modulo.
  //  - rangeSize is a power of two (and <= 2^31): MaxAllowed = 2^32, never rejects,
  //    and `deltaV % rangeSize === deltaV & (rangeSize-1)` (cheaper than modulo).
  if (rangeSize >= 0x100000000) {
    return rng.next() + 0x80000000;
  }
  // (rangeSize & (rangeSize - 1)) === 0 is true iff rangeSize is 0 or a power of two.
  // We never receive rangeSize === 0; and rangeSize >= 1 here.
  // For pow2 rangeSize in [1, 2^31], `& (rangeSize-1)` discards bits 31+, so the
  // `+ 0x80000000` translation step is masked away and unnecessary.
  if ((rangeSize & (rangeSize - 1)) === 0) {
    return rng.next() & (rangeSize - 1);
  }
  const MaxAllowed = ~~(0x100000000 / rangeSize) * rangeSize;
  let deltaV = rng.next() + 0x80000000;
  while (deltaV >= MaxAllowed) {
    deltaV = rng.next() + 0x80000000;
  }
  return deltaV % rangeSize;
}
