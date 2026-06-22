import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';

// XorShift128+ with a=23, b=18, c=5
// - http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
// - http://vigna.di.unimi.it/xorshift/xorshift128plus.c
// - https://docs.rs/crate/xorshift/0.1.3/source/src/xorshift128.rs
//
// NOTE: Math.random() of V8 uses XorShift128+ with a=23, b=17, c=26,
//       See https://github.com/v8/v8/blob/4b9b23521e6fd42373ebbcb20ebe03bf445494f9/src/base/utils/random-number-generator.h#L119-L128

const jumps = [0x635d2dff, 0x8a5cd789, 0x5c472f96, 0x121fd215];

class XorShift128Plus implements JumpableRandomGenerator {
  constructor(
    private s01: number,
    private s00: number,
    private s11: number,
    private s10: number,
  ) {}
  clone(): XorShift128Plus {
    return new XorShift128Plus(this.s01, this.s00, this.s11, this.s10);
  }
  next(): number {
    const a0 = this.s00 ^ (this.s00 << 23);
    const a1 = this.s01 ^ ((this.s01 << 23) | (this.s00 >>> 9));
    const s10 = this.s10;
    const s11 = this.s11;
    const out = (this.s00 + s10) | 0;
    this.s01 = s11;
    this.s00 = s10;
    this.s11 = a1 ^ s11 ^ (a1 >>> 18) ^ (s11 >>> 5);
    this.s10 = a0 ^ s10 ^ ((a0 >>> 18) | (a1 << 14)) ^ ((s10 >>> 5) | (s11 << 27));
    return out;
  }
  jump() {
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
      // Read polynomial coefficient via a small switch instead of an array load
      // (the four constants are hoisted to module scope to avoid a per-call allocation).
      const poly = i === 0 ? JUMP_POLY_0 : i === 1 ? JUMP_POLY_1 : i === 2 ? JUMP_POLY_2 : JUMP_POLY_3;
      for (let mask = 1; mask; mask <<= 1) {
        // Because: (1 << 31) << 1 === 0
        if (poly & mask) {
          ns01 ^= s01;
          ns00 ^= s00;
          ns11 ^= s11;
          ns10 ^= s10;
        }
        // inlined next()
        const a0 = s00 ^ (s00 << 23);
        const a1 = s01 ^ ((s01 << 23) | (s00 >>> 9));
        const b0 = a0 ^ s10 ^ ((a0 >>> 18) | (a1 << 14)) ^ ((s10 >>> 5) | (s11 << 27));
        const b1 = a1 ^ s11 ^ (a1 >>> 18) ^ (s11 >>> 5);
        s01 = s11;
        s00 = s10;
        s11 = b1;
        s10 = b0;
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

export function xorshift128plusFromState(state: readonly number[]): JumpableRandomGenerator {
  const valid = state.length === 4;
  if (!valid) {
    throw new Error('The state must have been produced by a xorshift128plus RandomGenerator');
  }
  return new XorShift128Plus(state[0], state[1], state[2], state[3]);
}

export function xorshift128plus(seed: number): JumpableRandomGenerator {
  return new XorShift128Plus(-1, ~seed, seed | 0, 0);
}
