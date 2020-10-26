import RandomGenerator from '../../generator/RandomGenerator';

/**
 * Uniformly generate number in range [0 ; rangeSize[
 * @internal
 */
export function uniformIntDistributionInternal(rangeSize: number, rng: RandomGenerator): [number, RandomGenerator] {
  const MinRng = rng.min();
  const NumValues = rng.max() - rng.min() + 1;

  // Range provided by the RandomGenerator is large enough
  if (rangeSize <= NumValues) {
    let nrng = rng;
    const MaxAllowed = NumValues - (NumValues % rangeSize);
    while (true) {
      const out = nrng.next();
      const deltaV = out[0] - MinRng;
      nrng = out[1];
      if (deltaV < MaxAllowed) {
        return [deltaV % rangeSize, nrng]; // Warning: we expect NumValues <= 2**32, so diff too
      }
    }
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

  let nrng = rng;
  while (true) {
    // Aggregate mutiple calls to next() into a single random value
    let value = 0;
    for (let num = 0; num !== NumIterations; ++num) {
      const out = nrng.next();
      value = NumValues * value + (out[0] - MinRng); // Warning: we overflow may when diff > max_safe (eg: =max_safe-min_safe+1)
      nrng = out[1];
    }
    if (value < MaxAcceptedRandom) {
      const inDiff = value - rangeSize * Math.floor((1 * value) / rangeSize);
      return [inDiff, nrng];
    }
  }
}