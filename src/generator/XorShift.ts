import { RandomGenerator } from './RandomGenerator';

class XorShift128Plus implements RandomGenerator {
  constructor(readonly s01: number, readonly s00: number, readonly s11: number, readonly s10: number) {}
  min(): number {
    return -0x80000000;
  }
  max(): number {
    return 0x7fffffff;
  }
  next(): [number, RandomGenerator] {
    const a0 = this.s00 ^ (this.s00 << 23);
    const a1 = this.s01 ^ ((this.s01 << 23) | (this.s00 >>> 9));
    const b0 = a0 ^ this.s10 ^ ((a0 >>> 17) | (a1 << 15)) ^ ((this.s10 >>> 26) | (this.s11 << 6));
    const b1 = a1 ^ this.s11 ^ (a1 >>> 17) ^ (this.s11 >>> 26);
    return [(b0 + this.s10) | 0, new XorShift128Plus(this.s11, this.s10, b1, b0)];
  }
}

export const xorshift128plus = function(seed: number): RandomGenerator {
  return new XorShift128Plus(-1, ~seed, 0, seed | 0);
};
