import type { RandomGenerator } from '../types/RandomGenerator';

const N = 624;
const M = 397;
const R = 31;
const A = 0x9908b0df;
const F = 1812433253;
const U = 11;
const S = 7;
const B = 0x9d2c5680;
const T = 15;
const C = 0xefc60000;
const L = 18;
const MASK_LOWER = 2 ** R - 1;
const MASK_UPPER = 2 ** R;

class MersenneTwister implements RandomGenerator {
  constructor(
    private states: number[], // states: between -0x80000000 and 0x7fffffff
    private index: number,
  ) {}
  clone(): MersenneTwister {
    return new MersenneTwister(this.states, this.index);
  }
  next(): number {
    let y = this.states[this.index];
    y ^= y >>> U;
    y ^= (y << S) & B;
    y ^= (y << T) & C;
    y ^= y >>> L;
    if (++this.index >= N) {
      this.states = twist(this.states);
      this.index = 0;
    }
    return y;
  }
  getState(): readonly number[] {
    return [this.index, ...this.states];
  }
}

function twist(prev: number[]): number[] {
  const mt = prev.slice();
  for (let idx = 0; idx !== N - M; ++idx) {
    const y = (mt[idx] & MASK_UPPER) + (mt[idx + 1] & MASK_LOWER);
    mt[idx] = mt[idx + M] ^ (y >>> 1) ^ (-(y & 1) & A);
  }
  for (let idx = N - M; idx !== N - 1; ++idx) {
    const y = (mt[idx] & MASK_UPPER) + (mt[idx + 1] & MASK_LOWER);
    mt[idx] = mt[idx + M - N] ^ (y >>> 1) ^ (-(y & 1) & A);
  }
  const y = (mt[N - 1] & MASK_UPPER) + (mt[0] & MASK_LOWER);
  mt[N - 1] = mt[M - 1] ^ (y >>> 1) ^ (-(y & 1) & A);
  return mt;
}

export function mersenneFromState(state: readonly number[]): RandomGenerator {
  const valid = state.length === N + 1 && state[0] >= 0 && state[0] < N;
  if (!valid) {
    throw new Error('The state must have been produced by a mersenne RandomGenerator');
  }
  return new MersenneTwister(state.slice(1), state[0]);
}

export function mersenne(seed: number): RandomGenerator {
  const out = Array(N);
  out[0] = seed;
  for (let idx = 1; idx !== N; ++idx) {
    const xored = out[idx - 1] ^ (out[idx - 1] >>> 30);
    out[idx] = (Math.imul(F, xored) + idx) | 0;
  }
  return new MersenneTwister(twist(out), 0);
}

/**
 * Seed the Mersenne Twister generator using an array of 32-bit integers.
 *
 * This implements the canonical `init_by_array` algorithm from the original MT reference
 * implementation by M. Matsumoto and T. Nishimura (mt19937ar.c, 2002).
 *
 * Motivation: A single 32-bit seed can only produce 2^32 distinct initial states, which is
 * far less than the 2^19937 period of the MT. `initByArray` distributes a variable-length
 * seed array across the full 624-word state through two diffusion passes, giving access to
 * a much larger portion of the state space. This matches the behavior of NumPy's legacy
 * `MT19937.seed(array)` API and is the standard approach used in C, Python, and R
 * reference implementations of Mersenne Twister.
 *
 * @param seeds - An array of 32-bit integer seeds (treated as signed 32-bit values).
 *   An empty array is equivalent to `mersenne(19650218)` after diffusion.
 */
export function mersenneByArray(seeds: readonly number[]): RandomGenerator {
  // Step 1: initialise state with a fixed seed (matches the C reference implementation)
  const out = Array(N);
  out[0] = 19650218;
  for (let idx = 1; idx !== N; ++idx) {
    const xored = out[idx - 1] ^ (out[idx - 1] >>> 30);
    out[idx] = (Math.imul(F, xored) + idx) | 0;
  }

  const keyLength = seeds.length;
  if (keyLength === 0) {
    return new MersenneTwister(twist(out), 0);
  }

  let i = 1;
  let j = 0;

  // Step 2: first pass — mix the key array into the state
  for (let k = Math.max(N, keyLength); k !== 0; --k) {
    const xored = out[i - 1] ^ (out[i - 1] >>> 30);
    out[i] = ((out[i] ^ Math.imul(xored, 1664525)) + (seeds[j] | 0) + j) | 0;
    if (++i >= N) {
      out[0] = out[N - 1];
      i = 1;
    }
    if (++j >= keyLength) {
      j = 0;
    }
  }

  // Step 3: second pass — diffuse the state
  for (let k = N - 1; k !== 0; --k) {
    const xored = out[i - 1] ^ (out[i - 1] >>> 30);
    out[i] = ((out[i] ^ Math.imul(xored, 1566083941)) - i) | 0;
    if (++i >= N) {
      out[0] = out[N - 1];
      i = 1;
    }
  }

  // Step 4: guarantee a non-zero state (MSB = 1)
  out[0] = 0x80000000 | 0;

  return new MersenneTwister(twist(out), 0);
}
