import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';

// XorShift128+ with a=23, b=18, c=5
// - http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
// - http://vigna.di.unimi.it/xorshift/xorshift128plus.c
// - https://docs.rs/crate/xorshift/0.1.3/source/src/xorshift128.rs
//
// NOTE: Math.random() of V8 uses XorShift128+ with a=23, b=17, c=26,
//       See https://github.com/v8/v8/blob/4b9b23521e6fd42373ebbcb20ebe03bf445494f9/src/base/utils/random-number-generator.h#L119-L128
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
    const b0 = a0 ^ this.s10 ^ ((a0 >>> 18) | (a1 << 14)) ^ ((this.s10 >>> 5) | (this.s11 << 27));
    const b1 = a1 ^ this.s11 ^ (a1 >>> 18) ^ (this.s11 >>> 5);
    const out = (this.s00 + this.s10) | 0;
    this.s01 = this.s11;
    this.s00 = this.s10;
    this.s11 = b1;
    this.s10 = b0;
    return out;
  }
  jump() {
    // equivalent to 2^64 calls to next()
    // can be used to generate 2^64 non-overlapping subsequences
    let ns01 = 0;
    let ns00 = 0;
    let ns11 = 0;
    let ns10 = 0;
    const jump = [0x635d2dff, 0x8a5cd789, 0x5c472f96, 0x121fd215];
    for (let i = 0; i !== 4; ++i) {
      for (let mask = 1; mask; mask <<= 1) {
        // Because: (1 << 31) << 1 === 0
        if (jump[i] & mask) {
          ns01 ^= this.s01;
          ns00 ^= this.s00;
          ns11 ^= this.s11;
          ns10 ^= this.s10;
        }
        this.next();
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
  return xorshift128plusByArray([seed]);
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
 * Seed an XorShift128+ generator using an array of 32-bit integers.
 *
 * Motivation and implementation strategy are identical to `xoroshiro128plusByArray`
 * (see that function's JSDoc). Both generators share a 128-bit state represented
 * as four 32-bit words, so the same SplitMix32 expansion applies.
 *
 * @param seeds - An array of 32-bit integer seeds (treated as signed 32-bit values).
 */
export function xorshift128plusByArray(seeds: readonly number[]): JumpableRandomGenerator {
  let acc = 0;
  for (let i = 0; i < seeds.length; i++) {
    acc = splitMix32((acc + (seeds[i] | 0)) | 0).next;
  }

  const r0 = splitMix32(acc);
  const r1 = splitMix32(r0.next);
  const r2 = splitMix32(r1.next);
  const r3 = splitMix32(r2.next);

  return new XorShift128Plus(r0.value, r1.value, r2.value, r3.value);
}
