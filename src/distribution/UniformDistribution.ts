import Distribution from './Distribution';
import RandomGenerator from '../generator/RandomGenerator';

function uniformIntInternal(from: number, diff: number, rng: RandomGenerator): [number, RandomGenerator] {
  let nrng = rng;
  const MIN_RNG = rng.min();
  const NUM_VALUES = rng.max() - rng.min() + 1;

  // Range provided by the RandomGenerator is large enough

  if (diff <= NUM_VALUES) {
    const MAX_ALLOWED = NUM_VALUES - (NUM_VALUES % diff);
    while (true) {
      const out = nrng.next();
      const deltaV = out[0] - MIN_RNG;
      nrng = out[1];
      if (deltaV < MAX_ALLOWED) {
        return [(deltaV % diff) + from, nrng];
      }
    }
  }

  // Range provided by the RandomGenerator is too small

  let maxRandomValue = 1;
  let numIterationsRequired = 0;
  while (maxRandomValue < diff) {
    maxRandomValue *= NUM_VALUES;
    ++numIterationsRequired;
  }
  const maxAllowedRandom = diff * Math.floor((1 * maxRandomValue) / diff);

  while (true) {
    let value = 0;
    for (let num = 0; num !== numIterationsRequired; ++num) {
      const out = nrng.next();
      value = NUM_VALUES * value + (out[0] - MIN_RNG);
      nrng = out[1];
    }
    if (value < maxAllowedRandom) {
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
  return function(rng: RandomGenerator) {
    return uniformIntInternal(from, diff, rng);
  };
}

export { uniformIntDistribution };
