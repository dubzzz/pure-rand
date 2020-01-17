import { RandomGenerator } from './RandomGenerator';

// XoroShiro128+ with a=24, b=16, c=37,
// - https://en.wikipedia.org/wiki/Xoroshiro128%2B
// - http://prng.di.unimi.it/xoroshiro128plus.c
class XoroShiro128Plus implements RandomGenerator {
  constructor(readonly s01: number, readonly s00: number, readonly s11: number, readonly s10: number) {}
  min(): number {
    return -0x80000000;
  }
  max(): number {
    return 0x7fffffff;
  }
  next(): [number, RandomGenerator] {
    // a = s0[n] ^ s1[n]
    const a0 = this.s10 ^ this.s00;
    const a1 = this.s11 ^ this.s01;
    // s0[n+1] = rotl(s0[n], 24) ^ a ^ (a << 16)
    const ns00 = (this.s00 << 24) ^ (this.s01 >>> 8) ^ a0 ^ (a0 << 16);
    const ns01 = (this.s01 << 24) ^ (this.s00 >>> 8) ^ a1 ^ ((a1 << 16) | (a0 >>> 16));
    // s1[n+1] = rotl(a, 37)
    const ns10 = (a1 << 5) ^ (a0 >>> 27);
    const ns11 = (a0 << 5) ^ (a1 >>> 27);
    return [(this.s00 + this.s10) | 0, new XoroShiro128Plus(ns01, ns00, ns11, ns10)];
  }
}

export const xoroshiro128plus = function(seed: number): RandomGenerator {
  return new XoroShiro128Plus(-1, ~seed, seed | 0, 0);
};
