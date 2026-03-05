import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';

// Inspired from java.util.Random implementation
// http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/util/Random.java#Random.next%28int%29
// Updated with values from: https://en.wikipedia.org/wiki/Linear_congruential_generator
const MULTIPLIER: number = 0x000343fd;
const INCREMENT: number = 0x00269ec3;
const MASK: number = 0xffffffff;
const MASK_2: number = (1 << 31) - 1;

// Jump constants: equivalent to 2^16 calls to next() (= 3 * 2^16 LCG steps).
// Precomputed using the LCG jump-ahead algorithm from:
// F. Brown, "Random Number Generation with Arbitrary Strides", Trans. Am. Nucl. Soc. (Nov. 1994)
// Also described at: https://www.pcg-random.org/posts/bounded-rands.html
//
// For an LCG s_{n+1} = (a * s_n + c) mod m, jumping by k steps yields:
//   s_{n+k} = (A * s_n + C) mod m
// where A = a^k mod m and C = c * (a^{k-1} + ... + 1) mod m.
// With a=0x000343fd, c=0x00269ec3, m=2^32, and k=3*2^16=196608:
const JUMP_MULTIPLIER: number = 0x76dc0001;
const JUMP_INCREMENT: number = 0x369b0000;

class LinearCongruential32 implements JumpableRandomGenerator {
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
  jump(): void {
    // equivalent to 2^16 calls to next()
    // can be used to generate 2^16 non-overlapping subsequences for the full 2^32 period
    // Math.imul is required because seed * JUMP_MULTIPLIER can exceed 2^53
    this.seed = (Math.imul(this.seed, JUMP_MULTIPLIER) + JUMP_INCREMENT) & MASK;
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

export function congruential32FromState(state: readonly number[]): JumpableRandomGenerator {
  const valid = state.length === 1;
  if (!valid) {
    throw new Error('The state must have been produced by a congruential32 RandomGenerator');
  }
  return new LinearCongruential32(state[0]);
}

export function congruential32(seed: number): JumpableRandomGenerator {
  return new LinearCongruential32(seed);
}

/**
 * Advance a SplitMix32 counter and return the hashed output.
 * See xoroshiro128plus.ts for full rationale.
 */
function splitMix32(state: number): { next: number; value: number } {
  const next = (state + 0x9e3779b9) | 0;
  let z = next;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) | 0;
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) | 0;
  return { next, value: z ^ (z >>> 16) };
}

/**
 * Seed a LinearCongruential32 generator using an array of 32-bit integers.
 *
 * Motivation: the single-integer constructor `congruential32(seed)` can only
 * produce 2^32 distinct sequences. Seeding from an array allows callers to
 * supply richer entropy even though the LCG itself has only 32 bits of state.
 *
 * Because the state is a single 32-bit word, the entire seed array must be
 * compressed into one value. We use SplitMix32 accumulation — fold each
 * element into a running counter and then extract one final hashed word — which
 * gives good avalanche properties: every bit of every seed element influences
 * the final seed.
 *
 * Note: No matter how many elements the array contains, the observable output
 * space is still bounded by 2^32 (the LCG period). Arrays are useful here
 * primarily for API uniformity and to avoid forcing callers to pre-hash their
 * entropy manually.
 *
 * @param seeds - An array of 32-bit integer seeds (treated as signed 32-bit values).
 */
export function congruential32ByArray(seeds: readonly number[]): JumpableRandomGenerator {
  let acc = 0;
  for (let i = 0; i < seeds.length; i++) {
    acc = splitMix32((acc + (seeds[i] | 0)) | 0).next;
  }
  return new LinearCongruential32(splitMix32(acc).value);
}
