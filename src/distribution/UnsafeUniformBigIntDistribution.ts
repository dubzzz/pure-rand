import type { RandomGenerator } from '../types/RandomGenerator';

// We are capturing the reference to BigInt so that it cannot be altered
// by any external code after that point.
const SBigInt: typeof BigInt = typeof BigInt !== 'undefined' ? BigInt : undefined!;
const One: bigint = typeof BigInt !== 'undefined' ? BigInt(1) : undefined!;
const ThirtyTwo: bigint = typeof BigInt !== 'undefined' ? BigInt(32) : undefined!;
const NumValues: bigint = typeof BigInt !== 'undefined' ? BigInt(0x100000000) : undefined!;

/**
 * Uniformly generate random bigint values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
export function option9(from: bigint, to: bigint, rng: RandomGenerator): bigint {
  const diff = to - from + One;

  // Number of iterations required to have enough random
  // to build uniform entries in the asked range
  let FinalNumValues = NumValues;
  let NumIterations = 1; // NumValues being large enough no need for bigint on NumIterations
  while (FinalNumValues < diff) {
    FinalNumValues <<= ThirtyTwo; // equivalent to: *=NumValues
    ++NumIterations;
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
  let value = SBigInt(rng.unsafeNext() + 0x80000000);
  for (let num = 1; num < NumIterations; ++num) {
    const out = rng.unsafeNext();
    value = (value << ThirtyTwo) + SBigInt(out + 0x80000000); // <<ThirtyTwo is equivalent to *NumValues
  }
  return value;
}
