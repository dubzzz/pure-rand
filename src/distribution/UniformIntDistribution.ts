import Distribution from './Distribution';
import RandomGenerator from '../generator/RandomGenerator';

function uniformIntInternal(from: number, diff: number, rng: RandomGenerator): [number, RandomGenerator] {
  const MinRng = rng.min();
  const NumValues = rng.max() - rng.min() + 1;

  // Range provided by the RandomGenerator is large enough
  if (diff <= NumValues) {
    let nrng = rng;
    const MaxAllowed = NumValues - (NumValues % diff);
    while (true) {
      const out = nrng.next();
      const deltaV = out[0] - MinRng;
      nrng = out[1];
      if (deltaV < MaxAllowed) {
        return [(deltaV % diff) + from, nrng];
      }
    }
  }

  // Compute number of iterations required to have enough random
  // to build uniform entries in the asked range
  let FinalNumValues = 1;
  let NumIterations = 0;
  while (FinalNumValues < diff) {
    FinalNumValues *= NumValues;
    ++NumIterations;
  }
  const MaxAcceptedRandom = diff * Math.floor((1 * FinalNumValues) / diff);

  let nrng = rng;
  while (true) {
    // Aggregate mutiple calls to next() into a single random value
    let value = 0;
    for (let num = 0; num !== NumIterations; ++num) {
      const out = nrng.next();
      value = NumValues * value + (out[0] - MinRng);
      nrng = out[1];
    }
    if (value < MaxAcceptedRandom) {
      const inDiff = value - diff * Math.floor((1 * value) / diff);
      return [inDiff + from, nrng];
    }
  }
}

function uniformIntDistribution(from: number, to: number): Distribution<number>;
function uniformIntDistribution(from: number, to: number, rng: RandomGenerator): [number, RandomGenerator];
function uniformIntDistribution(from: number, to: number, rng?: RandomGenerator) {
  const diff = to - from + 1;
  if (rng != null) {
    return uniformIntInternal(from, diff, rng);
  }
  return function (rng: RandomGenerator) {
    return uniformIntInternal(from, diff, rng);
  };
}

export { uniformIntDistribution };
