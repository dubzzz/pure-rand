import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformIntInternal } from './internals/uniformIntInternal';
import type { ArrayInt64 } from './internals/ArrayInt64';
import { fromNumberToArrayInt64, substractArrayInt64 } from './internals/ArrayInt64';
import { uniformArrayIntInternal } from './internals/uniformArrayIntInternal';

const safeNumberMaxSafeInteger = Number.MAX_SAFE_INTEGER;

const sharedA: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedB: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedC: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedData = [0, 0];

function uniformLargeIntInternal(rng: RandomGenerator, from: number, to: number, rangeSize: number): number {
  const rangeSizeArrayIntValue =
    rangeSize <= safeNumberMaxSafeInteger
      ? fromNumberToArrayInt64(sharedC, rangeSize) // no possible overflow given rangeSize is in a safe range
      : substractArrayInt64(sharedC, fromNumberToArrayInt64(sharedA, to), fromNumberToArrayInt64(sharedB, from)); // rangeSize might be incorrect, we compute a safer range

  // Adding 1 to the range
  if (rangeSizeArrayIntValue.data[1] === 0xffffffff) {
    // rangeSizeArrayIntValue.length === 2 by construct
    // rangeSize >= 0x00000001_00000000 and rangeSize <= 0x003fffff_fffffffe
    // with Number.MAX_SAFE_INTEGER - Number.MIN_SAFE_INTEGER = 0x003fffff_fffffffe
    rangeSizeArrayIntValue.data[0] += 1;
    rangeSizeArrayIntValue.data[1] = 0;
  } else {
    rangeSizeArrayIntValue.data[1] += 1;
  }

  uniformArrayIntInternal(rng, sharedData, rangeSizeArrayIntValue.data);
  return sharedData[0] * 0x100000000 + sharedData[1] + from;
}

/**
 * Uniformly generate random integer values between `from` (included) and `to` (included)
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 *
 * @public
 */
export function uniformInt(rng: RandomGenerator, from: number, to: number): number {
  const rangeSize = to - from;
  if (rangeSize <= 0xffffffff) {
    // Calling unsafeUniformIntDistributionInternal can be considered safe
    // up-to 2**32 values. Above this range it may miss values.
    const g = uniformIntInternal(rng, rangeSize + 1);
    return g + from;
  }
  return uniformLargeIntInternal(rng, from, to, rangeSize);
}
