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
  if (rangeSize >= 0x100000000) {
    return rng.next() + 0x80000000;
  }
  const MaxAllowed = rangeSize > 2 ? ~~(0x100000000 / rangeSize) * rangeSize : 0x100000000;
  let deltaV = rng.next() + 0x80000000;
  while (deltaV >= MaxAllowed) {
    deltaV = rng.next() + 0x80000000;
  }
  return deltaV % rangeSize;
}
