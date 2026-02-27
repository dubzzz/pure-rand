import type { RandomGenerator } from '../types/RandomGenerator';

// Inspired from java.util.Random implementation
// http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/util/Random.java#Random.next%28int%29
// Updated with values from: https://en.wikipedia.org/wiki/Linear_congruential_generator
const MULTIPLIER: number = 0x000343fd;
const INCREMENT: number = 0x00269ec3;
const MASK: number = 0xffffffff;
const MASK_2: number = (1 << 31) - 1;

class LinearCongruential32 implements RandomGenerator {
  constructor(private seed: number) {}
  clone(): LinearCongruential32 {
    return new LinearCongruential32(this.seed);
  }
  next(): number {
    const s1 = computeNextSeed(this.seed);
    const v1 = computeValueFromNextSeed(s1);
    const s2 = computeNextSeed(s1);
    const v2 = computeValueFromNextSeed(s2);
    this.seed = computeNextSeed(s2);
    const v3 = computeValueFromNextSeed(this.seed);
    // value between: -0x80000000 and 0x7fffffff
    // in theory it should have been: v1 & 3 instead of v1 alone
    // but as binary operations truncate between -0x80000000 and 0x7fffffff in JavaScript
    // we can get rid of this operation
    const vnext = v3 + ((v2 + (v1 << 15)) << 15);
    return vnext | 0;
  }
  getState(): readonly number[] {
    return [this.seed];
  }
}

function computeNextSeed(seed: number) {
  return (seed * MULTIPLIER + INCREMENT) & MASK;
}
function computeValueFromNextSeed(nextseed: number) {
  return (nextseed & MASK_2) >> 16;
}

function fromState(state: readonly number[]): RandomGenerator {
  const valid = state.length === 1;
  if (!valid) {
    throw new Error('The state must have been produced by a congruential32 RandomGenerator');
  }
  return new LinearCongruential32(state[0]);
}

export const congruential32 = Object.assign(
  function (seed: number): RandomGenerator {
    return new LinearCongruential32(seed);
  },
  { fromState },
);
