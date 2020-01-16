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
  private rotl0(n1: number, n0: number, k: number) {
    if (k < 32) return (n0 << k) | (n1 >>> (32 - k));
    return (n1 << (k - 32)) | (n0 >>> (64 - k));
  }
  private rotl1(n1: number, n0: number, k: number) {
    if (k < 32) return (n1 << k) | (n0 >>> (32 - k));
    return (n0 << (k - 32)) | (n1 >>> (64 - k));
  }
  next(): [number, RandomGenerator] {
    const a0 = this.s10 ^ this.s00;
    const a1 = this.s11 ^ this.s01;
    const ns00 = this.rotl0(this.s01, this.s00, 24) ^ a0 ^ (a0 << 16);
    const ns01 = this.rotl1(this.s01, this.s00, 24) ^ a1 ^ ((a1 << 16) | (a0 >>> 16));
    const ns10 = this.rotl0(a1, a0, 37);
    const ns11 = this.rotl1(a1, a0, 37);
    return [(this.s00 + this.s10) | 0, new XoroShiro128Plus(ns01, ns00, ns11, ns10)];
  }
}

export const xoroshiro128plus = function(seed: number): RandomGenerator {
  return new XoroShiro128Plus(-1, ~seed, seed | 0, 0);
};
