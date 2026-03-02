import type { RandomGenerator } from '../../types/RandomGenerator';
import type { ArrayInt64 } from './ArrayInt64';
import { uniformIntInternal } from './uniformIntInternal';

/**
 * Uniformly generate ArrayInt64 in range [0 ; rangeSize[
 *
 * @remarks
 * In the worst case scenario it may discard half of the randomly generated value.
 * Worst case being: most significant number is 1 and remaining part evaluates to 0.
 *
 * @internal
 */
export function uniformArrayIntInternal(
  rng: RandomGenerator,
  out: ArrayInt64['data'],
  rangeSize: ArrayInt64['data'],
): ArrayInt64['data'] {
  const maxIndex0 = rangeSize[0] + 1;
  out[0] = uniformIntInternal(rng, maxIndex0);
  out[1] = uniformIntInternal(rng, 0x100000000);
  // We iterate until we find a valid value for arrayInt
  // While: !(out[0] < rangeSize[0] || (out[0] === rangeSize[0] && out[1] < rangeSize[1]))
  while (out[0] >= rangeSize[0] && (out[0] !== rangeSize[0] || out[1] >= rangeSize[1])) {
    out[0] = uniformIntInternal(rng, maxIndex0);
    out[1] = uniformIntInternal(rng, 0x100000000);
  }
  return out;
}
