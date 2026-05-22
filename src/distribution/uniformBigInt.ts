import type { RandomGenerator } from '../types/RandomGenerator';

// We are capturing the reference to BigInt so that it cannot be altered
// by any external code after that point.
const SBigInt = BigInt;
const NumValues: bigint = 0x100000000n;

// Scratch buffer used by the 2-iteration fast path to build uint64 BigInts
// in a single shot via DataView.getBigUint64. This is materially faster
// than computing `(BigInt(hi) << 32n) + BigInt(lo)` in JS because it
// skips the intermediate BigInt that the shift would allocate.
const u64Buffer = new ArrayBuffer(8);
const u64View = new DataView(u64Buffer);

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
  // to build uniform entries in the asked range
  let FinalNumValues = NumValues;
  let NumIterations = 1; // NumValues being large enough no need for bigint on NumIterations
  while (FinalNumValues < diff) {
    FinalNumValues <<= 32n; // equivalent to: *=NumValues
    ++NumIterations;
  }

  // Dispatch on NumIterations to dedicated helpers. Splitting the body
  // keeps each helper's BigInt arithmetic monomorphic from V8's view,
  // which matters because uniformBigInt is called with a wide variety of
  // BigInt magnitudes by different callers.
  if (NumIterations === 2) {
    return uniformBigInt2Iter(rng, from, diff, FinalNumValues);
  }
  return uniformBigIntGeneric(rng, from, diff, NumIterations, FinalNumValues);
}

/**
 * Specialized 2-iteration path used for diff in (2^32, 2^64].
 *
 * Builds the 64-bit sample in one shot via DataView.getBigUint64 — which
 * avoids the intermediate BigInts that
 * `(BigInt(hi) << 32n) + BigInt(lo)` would allocate (one for the shift,
 * one for each `BigInt(uint32)` constructor).
 *
 * Produces bit-for-bit identical outputs to the generic 2-iteration path:
 * same rng.next() consumption, same packed uint64 value, same selection
 * & rejection logic.
 */
function uniformBigInt2Iter(rng: RandomGenerator, from: bigint, diff: bigint, FinalNumValues: bigint): bigint {
  u64View.setUint32(0, rng.next() + 0x80000000);
  u64View.setUint32(4, rng.next() + 0x80000000);
  let value = u64View.getBigUint64(0);
  if (value < diff) {
    return value + from;
  }
  if (value + diff < FinalNumValues) {
    return (value % diff) + from;
  }
  const MaxAcceptedRandom = FinalNumValues - (FinalNumValues % diff);
  while (value >= MaxAcceptedRandom) {
    u64View.setUint32(0, rng.next() + 0x80000000);
    u64View.setUint32(4, rng.next() + 0x80000000);
    value = u64View.getBigUint64(0);
  }
  return (value % diff) + from;
}

/**
 * Generic path used for NumIterations === 1 (diff in [1n, 2^32]) and
 * for NumIterations >= 3 (diff > 2^64).
 *
 * Kept as a separate function so the all-BigInt code path is not mixed
 * with the DataView-based 2-iteration path in V8's optimized output.
 */
function uniformBigIntGeneric(
  rng: RandomGenerator,
  from: bigint,
  diff: bigint,
  NumIterations: number,
  FinalNumValues: bigint,
): bigint {
  let value = SBigInt(rng.next() + 0x80000000);
  for (let num = 1; num < NumIterations; ++num) {
    value = (value << 32n) + SBigInt(rng.next() + 0x80000000); // <<32n is equivalent to *NumValues
  }
  if (value < diff) {
    return value + from;
  }
  if (value + diff < FinalNumValues) {
    return (value % diff) + from;
  }
  const MaxAcceptedRandom = FinalNumValues - (FinalNumValues % diff);
  while (value >= MaxAcceptedRandom) {
    value = SBigInt(rng.next() + 0x80000000);
    for (let num = 1; num < NumIterations; ++num) {
      value = (value << 32n) + SBigInt(rng.next() + 0x80000000);
    }
  }
  return (value % diff) + from;
}
