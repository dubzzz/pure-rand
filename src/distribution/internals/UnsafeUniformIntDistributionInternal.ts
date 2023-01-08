import { RandomGenerator } from '../../generator/RandomGenerator';

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * @internal
 */
export function unsafeUniformIntDistributionInternalNoBigInt(rangeSize: number, rng: RandomGenerator): number {
  const MinRng = rng.min();
  const NumValues = rng.max() - rng.min() + 1;

  // Range provided by the RandomGenerator is large enough
  if (rangeSize <= NumValues) {
    const MaxAllowed = NumValues - (NumValues % rangeSize);
    let deltaV = rng.unsafeNext() - MinRng;
    while (deltaV >= MaxAllowed) {
      deltaV = rng.unsafeNext() - MinRng;
    }
    return deltaV % rangeSize; // Warning: we expect NumValues <= 2**32, so diff too
  }

  // Compute number of iterations required to have enough random
  // to build uniform entries in the asked range
  let FinalNumValues = NumValues * NumValues;
  let NumIterations = 2; // At least 2 (at this point in the code)
  while (FinalNumValues < rangeSize) {
    FinalNumValues *= NumValues;
    ++NumIterations;
  }
  const MaxAcceptedRandom = rangeSize * Math.floor((1 * FinalNumValues) / rangeSize);

  let largeDeltaV = unsafeComputeValue(rng, NumIterations, NumValues, MinRng);
  while (largeDeltaV >= MaxAcceptedRandom) {
    largeDeltaV = unsafeComputeValue(rng, NumIterations, NumValues, MinRng);
  }
  const inDiff = largeDeltaV - rangeSize * Math.floor((1 * largeDeltaV) / rangeSize);
  return inDiff;
}

/**
 * Aggregate multiple calls to next() into a single random value
 */
function unsafeComputeValue(rng: RandomGenerator, NumIterations: number, NumValues: number, MinRng: number): number {
  let value = 0;
  for (let num = 0; num !== NumIterations; ++num) {
    const out = rng.unsafeNext();
    value = NumValues * value + (out - MinRng); // Warning: we overflow may when diff > max_safe (eg: =max_safe-min_safe+1)
  }
  return value;
}

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * @internal
 */
export function unsafeUniformIntDistributionInternalBigInt(rangeSize: number, rng: RandomGenerator): number {
  const MinRng = rng.min();
  const NumValues = rng.max() - rng.min() + 1;

  // Range provided by the RandomGenerator is large enough
  if (rangeSize <= NumValues) {
    const MaxAllowed = NumValues - (NumValues % rangeSize);
    let deltaV = rng.unsafeNext() - MinRng;
    while (deltaV >= MaxAllowed) {
      deltaV = rng.unsafeNext() - MinRng;
    }
    return deltaV % rangeSize; // Warning: we expect NumValues <= 2**32, so diff too
  }

  // Compute number of iterations required to have enough random
  // to build uniform entries in the asked range
  const bigRangeSize = BigInt(rangeSize);
  const BigMinRng = BigInt(MinRng);
  const BigNumValues = BigInt(NumValues);
  let FinalNumValues = BigNumValues * BigNumValues;
  let NumIterations = 2; // At least 2 (at this point in the code)
  while (FinalNumValues < bigRangeSize) {
    FinalNumValues *= BigNumValues;
    ++NumIterations;
  }
  const MaxAcceptedRandom = bigRangeSize * BigInt(FinalNumValues / bigRangeSize);

  let largeDeltaV = unsafeComputeBigValue(rng, NumIterations, BigNumValues, BigMinRng);
  while (largeDeltaV >= MaxAcceptedRandom) {
    largeDeltaV = unsafeComputeBigValue(rng, NumIterations, BigNumValues, BigMinRng);
  }
  const inDiff = largeDeltaV - bigRangeSize * BigInt(largeDeltaV / bigRangeSize);
  return Number(inDiff);
}

/**
 * Aggregate multiple calls to next() into a single random value
 */
function unsafeComputeBigValue(rng: RandomGenerator, NumIterations: number, NumValues: bigint, MinRng: bigint): bigint {
  let value = BigInt(0);
  for (let num = 0; num !== NumIterations; ++num) {
    const out = BigInt(rng.unsafeNext());
    value = NumValues * value + (out - MinRng);
  }
  return value;
}

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * @internal
 */
export const unsafeUniformIntDistributionInternal =
  typeof BigInt !== 'undefined'
    ? unsafeUniformIntDistributionInternalBigInt
    : unsafeUniformIntDistributionInternalNoBigInt;
