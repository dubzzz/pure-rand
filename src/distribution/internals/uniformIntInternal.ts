import type { RandomGenerator } from '../../types/RandomGenerator';

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * With rangeSize <= 0x100000000
 * @internal
 */
export function uniformIntInternal(rng: RandomGenerator, rangeSize: number): number {
  // Range provided by the RandomGenerator is large enough,
  // given rangeSize <= 0x100000000 and RandomGenerator is uniform on 0x100000000 values
  let value = rng.next() + 0x80000000;
  if (value < rangeSize) {
    return value;
  }
  if (value + rangeSize < 0x100000000) {
    return value % rangeSize;
  }
  const MaxAcceptedRandom = 0x100000000 - (0x100000000 % rangeSize);
  while (value >= MaxAcceptedRandom) {
    value = rng.next() + 0x80000000;
  }
  return value % rangeSize;
}
