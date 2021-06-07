import { RandomGenerator } from '../generator/RandomGenerator';

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
  const diff = to - from + BigInt(1);
  const MinRng = BigInt(rng.min());
  const NumValues = BigInt(rng.max() - rng.min() + 1);

  // Number of iterations required to have enough random
  // to build uniform entries in the asked range
  let FinalNumValues = NumValues;
  let NumIterations = BigInt(1);
  while (FinalNumValues < diff) {
    FinalNumValues *= NumValues;
    ++NumIterations;
  }

  const MaxAcceptedRandom = FinalNumValues - (FinalNumValues % diff);
  while (true) {
    // Aggregate mutiple calls to next() into a single random value
    let value = BigInt(0);
    for (let num = BigInt(0); num !== NumIterations; ++num) {
      const out = rng.unsafeNext();
      value = NumValues * value + (BigInt(out) - MinRng);
    }
    if (value < MaxAcceptedRandom) {
      const inDiff = value % diff;
      return inDiff + from;
    }
  }
}
