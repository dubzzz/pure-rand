import { RandomGenerator } from '../types/RandomGenerator';

// We are capturing the reference to BigInt so that it cannot be altered
// by any external code after that point.
const SBigInt: typeof BigInt = typeof BigInt !== 'undefined' ? BigInt : undefined!;

/**
 * Uniformly generate random bigint values between `from` (included) and `to` (included)
 *
 * @param from - Lower bound of the range (included)
 * @param to - Upper bound of the range (included)
 * @param rng - Instance of RandomGenerator to extract random values from
 *
 * @public
 */
export function unsafeUniformBigIntDistribution(from: bigint, to: bigint, rng: RandomGenerator): bigint {
  const diff = to - from + SBigInt(1);
  const MinRng = SBigInt(-0x80000000);
  const NumValues = SBigInt(0x100000000);

  // Number of iterations required to have enough random
  // to build uniform entries in the asked range
  let FinalNumValues = NumValues;
  let NumIterations = 1; // NumValues being large enough no need for bigint on NumIterations
  while (FinalNumValues < diff) {
    FinalNumValues *= NumValues;
    ++NumIterations;
  }

  const MaxAcceptedRandom = FinalNumValues - (FinalNumValues % diff);
  while (true) {
    // Aggregate mutiple calls to next() into a single random value
    let value = SBigInt(0);
    for (let num = 0; num !== NumIterations; ++num) {
      const out = rng.unsafeNext();
      value = NumValues * value + (SBigInt(out) - MinRng);
    }
    if (value < MaxAcceptedRandom) {
      const inDiff = value % diff;
      return inDiff + from;
    }
  }
}
