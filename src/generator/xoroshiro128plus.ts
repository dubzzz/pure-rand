import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import type { Seed64 } from '../types/Seed64';
import { splitmix64 } from '../seed/internals/splitmix64';

const jumps = [0xd8f554a5, 0xdf900294, 0x4b3201fc, 0x170865df];

// XoroShiro128+ with a=24, b=16, c=37,
// - https://en.wikipedia.org/wiki/Xoroshiro128%2B
// - http://prng.di.unimi.it/xoroshiro128plus.c
class XoroShiro128Plus implements JumpableRandomGenerator {
  declare private s01: number;
  declare private s00: number;
  declare private s11: number;
  declare private s10: number;
  constructor(s01: number, s00: number, s11: number, s10: number) {
    this.s01 = s01;
    this.s00 = s00;
    this.s11 = s11;
    this.s10 = s10;
  }
  clone(): XoroShiro128Plus {
    return new XoroShiro128Plus(this.s01, this.s00, this.s11, this.s10);
  }
  next(): number {
    const out = (this.s00 + this.s10) | 0;
    // a = s0[n] ^ s1[n]
    const a0 = this.s10 ^ this.s00;
    const a1 = this.s11 ^ this.s01;
    const s00 = this.s00;
    const s01 = this.s01;
    // s0[n+1] = rotl(s0[n], 24) ^ a ^ (a << 16)
    this.s00 = (s00 << 24) ^ (s01 >>> 8) ^ a0 ^ (a0 << 16);
    this.s01 = (s01 << 24) ^ (s00 >>> 8) ^ a1 ^ ((a1 << 16) | (a0 >>> 16));
    // s1[n+1] = rotl(a, 37)
    this.s10 = (a1 << 5) ^ (a0 >>> 27);
    this.s11 = (a0 << 5) ^ (a1 >>> 27);
    return out;
  }
  jump(): void {
    // equivalent to 2^64 calls to next()
    // can be used to generate 2^64 non-overlapping subsequences
    let ns01 = 0;
    let ns00 = 0;
    let ns11 = 0;
    let ns10 = 0;
    let s01 = this.s01;
    let s00 = this.s00;
    let s11 = this.s11;
    let s10 = this.s10;
    for (let i = 0; i !== 4; ++i) {
      const ji = jumps[i];
      for (let mask = 1; mask; mask <<= 1) {
        // Because: (1 << 31) << 1 === 0
        if (ji & mask) {
          ns01 ^= s01;
          ns00 ^= s00;
          ns11 ^= s11;
          ns10 ^= s10;
        }
        // inlined next()
        const a0 = s10 ^ s00;
        const a1 = s11 ^ s01;
        const s00_ = s00;
        const s01_ = s01;
        s00 = (s00_ << 24) ^ (s01_ >>> 8) ^ a0 ^ (a0 << 16);
        s01 = (s01_ << 24) ^ (s00_ >>> 8) ^ a1 ^ ((a1 << 16) | (a0 >>> 16));
        s10 = (a1 << 5) ^ (a0 >>> 27);
        s11 = (a0 << 5) ^ (a1 >>> 27);
      }
    }
    this.s01 = ns01;
    this.s00 = ns00;
    this.s11 = ns11;
    this.s10 = ns10;
  }
  getState(): readonly number[] {
    return [this.s01, this.s00, this.s11, this.s10];
  }
}

export function xoroshiro128plusFromState(state: readonly number[]): JumpableRandomGenerator {
  const valid = state.length === 4;
  if (!valid) {
    throw new Error('The state must have been produced by a xoroshiro128plus RandomGenerator');
  }
  return new XoroShiro128Plus(state[0], state[1], state[2], state[3]);
}

/**
 * Create a generator from a numeric seed or a Seed64 in unsigned high/low order.
 * Numeric seeds retain their original sequences. Seed64 initializes the two 64-bit
 * state words from consecutive SplitMix64 outputs, including when the high word is zero.
 *
 * @public
 */
export function xoroshiro128plus(seed: number | Seed64): JumpableRandomGenerator {
  if (typeof seed === 'number') {
    return new XoroShiro128Plus(-1, ~seed, seed | 0, 0);
  }
  const next = splitmix64(seed);
  const [s01, s00] = next();
  const [s11, s10] = next();
  return new XoroShiro128Plus(s01 | 0, s00 | 0, s11 | 0, s10 | 0);
}
