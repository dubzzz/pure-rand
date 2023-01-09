import { RandomGenerator } from '../../generator/RandomGenerator';

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * With rangeSize <= 0x100000000
 * @internal
 */
export function unsafeUniformIntDistributionInternal(rangeSize: number, rng: RandomGenerator): number {
  // Range provided by the RandomGenerator is large enough,
  // given rangeSize <= 0x100000000 and RandomGenerator is uniform on 0x100000000 values
  if (rangeSize === 1) {
    return 0;
  }
  const MaxAllowed = rangeSize !== 1 ? ~~(0x100000000 / rangeSize) * rangeSize : 0x100000000;
  let deltaV = rng.unsafeNext() + 0x80000000;
  while (deltaV >= MaxAllowed) {
    deltaV = rng.unsafeNext() + 0x80000000;
  }
  return deltaV % rangeSize;
}
