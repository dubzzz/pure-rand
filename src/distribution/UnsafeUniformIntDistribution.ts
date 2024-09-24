import { RandomGenerator } from '../types/RandomGenerator';
import { unsafeUniformIntDistributionInternal } from './internals/UnsafeUniformIntDistributionInternal';
import { ArrayInt64, fromNumberToArrayInt64, substractArrayInt64 } from './internals/ArrayInt';
import { unsafeUniformArrayIntDistributionInternal } from './internals/UnsafeUniformArrayIntDistributionInternal';

const safeNumberMaxSafeInteger = Number.MAX_SAFE_INTEGER;

const sharedA: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedB: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedC: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedData = [0, 0];

function uniformLargeIntInternal(from: number, to: number, rangeSize: number, rng: RandomGenerator): number {
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

  unsafeUniformArrayIntDistributionInternal(sharedData, rangeSizeArrayIntValue.data, rng);
  return sharedData[0] * 0x100000000 + sharedData[1] + from;
}

/**
 * Uniformly generate random integer values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
export function unsafeUniformIntDistribution(from: number, to: number, rng: RandomGenerator): number {
  const rangeSize = to - from;
  if (rangeSize <= 0xffffffff) {
    // Calling unsafeUniformIntDistributionInternal can be considered safe
    // up-to 2**32 values. Above this range it may miss values.
    const g = unsafeUniformIntDistributionInternal(rangeSize + 1, rng);
    return g + from;
  }
  return uniformLargeIntInternal(from, to, rangeSize, rng);
}
