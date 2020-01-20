import { RandomGenerator } from './RandomGenerator';

// XorShift128+ with a=23, b=18, c=5
// - http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
// - http://vigna.di.unimi.it/xorshift/xorshift128plus.c
// - https://docs.rs/crate/xorshift/0.1.3/source/src/xorshift128.rs
//
// NOTE: Math.random() of V8 uses XorShift128+ with a=23, b=17, c=26,
//       See https://github.com/v8/v8/blob/4b9b23521e6fd42373ebbcb20ebe03bf445494f9/src/base/utils/random-number-generator.h#L119-L128
class XorShift128Plus implements RandomGenerator {
  constructor(readonly s01: number, readonly s00: number, readonly s11: number, readonly s10: number) {}
  min(): number {
    return -0x80000000;
  }
  max(): number {
    return 0x7fffffff;
  }
  next(): [number, XorShift128Plus] {
    const a0 = this.s00 ^ (this.s00 << 23);
    const a1 = this.s01 ^ ((this.s01 << 23) | (this.s00 >>> 9));
    const b0 = a0 ^ this.s10 ^ ((a0 >>> 18) | (a1 << 14)) ^ ((this.s10 >>> 5) | (this.s11 << 27));
    const b1 = a1 ^ this.s11 ^ (a1 >>> 18) ^ (this.s11 >>> 5);
    return [(this.s00 + this.s10) | 0, new XorShift128Plus(this.s11, this.s10, b1, b0)];
  }
}

export const xorshift128plus = function(seed: number): RandomGenerator {
  return new XorShift128Plus(-1, ~seed, seed | 0, 0);
};
