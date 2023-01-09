import { RandomGenerator } from '../../generator/RandomGenerator';

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * With rangeSize <= 0x100000000
 * @internal
 */
export function unsafeUniformIntDistributionInternal(rangeSize: number, rng: RandomGenerator): number {
  const MinRng = -0x80000000;
  const NumValues = 0x100000000;

  // Range provided by the RandomGenerator is large enough,
  // given rangeSize <= 0x100000000 and RandomGenerator is uniform on 0x100000000 values
  const MaxAllowed = NumValues - (NumValues % rangeSize);
  let deltaV = rng.unsafeNext() - MinRng;
  while (deltaV >= MaxAllowed) {
    deltaV = rng.unsafeNext() - MinRng;
  }
  return deltaV % rangeSize; // Warning: we expect NumValues <= 2**32, so diff too
}
