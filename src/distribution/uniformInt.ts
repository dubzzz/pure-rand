import type { RandomGenerator } from '../types/RandomGenerator';
import { uniformIntInternal } from './internals/uniformIntInternal';
import type { ArrayInt64 } from './internals/ArrayInt64';
import { fromNumberToArrayInt64, substractArrayInt64 } from './internals/ArrayInt64';
import { uniformArrayIntInternal } from './internals/uniformArrayIntInternal';

const safeNumberMaxSafeInteger = Number.MAX_SAFE_INTEGER;

const sharedA: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedB: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedC: ArrayInt64 = { sign: 1, data: [0, 0] };
const sharedRangeData: ArrayInt64['data'] = [0, 0];
const sharedData: ArrayInt64['data'] = [0, 0];

function uniformLargeIntInternal(rng: RandomGenerator, from: number, to: number, rangeSize: number): number {
  // Build the range data: [high, low] of (rangeSize + 1).
  let rangeData: ArrayInt64['data'];
  if (rangeSize <= safeNumberMaxSafeInteger) {
    // Fast path: rangeSize fits as a safe number — compute high/low directly.
    // rangeSize > 0xffffffff here (else we'd be in the small/medium branch), so high >= 1.
    const high = ~~(rangeSize / 0x100000000);
    const low = (rangeSize >>> 0) + 1;
    if (low > 0xffffffff) {
      // low wraps: low was 0xffffffff, now becomes 0x100000000 → store 0 and carry to high.
      sharedRangeData[0] = high + 1;
      sharedRangeData[1] = 0;
    } else {
      sharedRangeData[0] = high;
      sharedRangeData[1] = low;
    }
    rangeData = sharedRangeData;
  } else {
    // Slow path: rangeSize might be inaccurate; compute via ArrayInt64 subtraction.
    const rangeSizeArrayIntValue = substractArrayInt64(
      sharedC,
      fromNumberToArrayInt64(sharedA, to),
      fromNumberToArrayInt64(sharedB, from),
    );
    // Add 1.
    if (rangeSizeArrayIntValue.data[1] === 0xffffffff) {
      rangeSizeArrayIntValue.data[0] += 1;
      rangeSizeArrayIntValue.data[1] = 0;
    } else {
      rangeSizeArrayIntValue.data[1] += 1;
    }
    rangeData = rangeSizeArrayIntValue.data;
  }

  uniformArrayIntInternal(rng, sharedData, rangeData);
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
