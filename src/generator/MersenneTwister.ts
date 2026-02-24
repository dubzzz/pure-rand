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
  next(): [number, MersenneTwister] {
    const nextRng = new MersenneTwister(this.states, this.index);
    const out = nextRng.unsafeNext();
    return [out, nextRng];
  }
  unsafeNext(): number {
    let y = this.states[this.index];
    y ^= this.states[this.index] >>> U;
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

function fromState(state: readonly number[]): RandomGenerator {
  const valid = state.length === N + 1 && state[0] >= 0 && state[0] < N;
  if (!valid) {
    throw new Error('The state must have been produced by a mersenne RandomGenerator');
  }
  return new MersenneTwister(state.slice(1), state[0]);
}

export const mersenne = Object.assign(
  function (seed: number): RandomGenerator {
    const out = Array(N);
    out[0] = seed;
    for (let idx = 1; idx !== N; ++idx) {
      const xored = out[idx - 1] ^ (out[idx - 1] >>> 30);
      out[idx] = (Math.imul(F, xored) + idx) | 0;
    }
    return new MersenneTwister(twist(out), 0);
  },
  { fromState },
);
