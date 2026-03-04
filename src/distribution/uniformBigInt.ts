import type { RandomGenerator } from '../types/RandomGenerator';

// We are capturing the reference to BigInt so that it cannot be altered
// by any external code after that point.
const SBigInt = BigInt;
const NumValues: bigint = 0x100000000n;

/**
 * Uniformly generate random bigint values between `from` (included) and `to` (included)
 *
 * @param rng - Instance of RandomGenerator to extract random values from
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 *
 * @public
 */
export function uniformBigInt(rng: RandomGenerator, from: bigint, to: bigint): bigint {
  const diff = to - from + 1n;

  // Number of iterations required to have enough random
  // to build uniform entries in the asked range: smallest N with (2**32)**N >= diff
  // Computed directly from hex digit count: N = ceil(hexDigits(diff-1) / 8)
  const NumIterations = ((diff - 1n).toString(16).length + 7) >>> 3;
  const FinalNumValues = 1n << SBigInt(NumIterations * 32);

  // Fast path: power-of-2 ranges have no bias, use bitwise AND
  if ((diff & (diff - 1n)) === 0n) {
    return (generateNext(NumIterations, rng) & (diff - 1n)) + from;
  }

  let value = generateNext(NumIterations, rng);
  if (value < diff) {
    return value + from;
  }
  if (value + diff < FinalNumValues) {
    return (value % diff) + from;
  }
  const MaxAcceptedRandom = FinalNumValues - (FinalNumValues % diff);
  while (value >= MaxAcceptedRandom) {
    value = generateNext(NumIterations, rng);
  }
  return (value % diff) + from;
}

function generateNext(NumIterations: number, rng: RandomGenerator): bigint {
  // Aggregate mutiple calls to next() into a single random value
  let value = SBigInt(rng.next() + 0x80000000);
  for (let num = 1; num < NumIterations; ++num) {
    const out = rng.next();
    value = (value << 32n) + SBigInt(out + 0x80000000); // <<32n is equivalent to *NumValues
  }
  return value;
}
