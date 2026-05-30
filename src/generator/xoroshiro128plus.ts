import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';

// XoroShiro128+ with a=24, b=16, c=37,
// - https://en.wikipedia.org/wiki/Xoroshiro128%2B
// - http://prng.di.unimi.it/xoroshiro128plus.c
class XoroShiro128Plus implements JumpableRandomGenerator {
  constructor(
    private s01: number,
    private s00: number,
    private s11: number,
    private s10: number,
  ) {}
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
    //
    // The jump is a linear operation over GF(2) on the 128-bit state, so it is
    // equivalent to multiplying the state by a fixed 128x128 binary matrix.
    // Rather than replaying 128 calls to next(), we split the state into 32
    // nibbles and XOR the precomputed contribution of each nibble (32 lookups +
    // XORs). The table is decoded once, lazily, from JUMP_TABLE_BASE64.
    const table = jumpTable !== undefined ? jumpTable : (jumpTable = decodeJumpTable());
    const words = [this.s01, this.s00, this.s11, this.s10];
    let r01 = 0;
    let r00 = 0;
    let r11 = 0;
    let r10 = 0;
    for (let i = 0; i !== 32; ++i) {
      const nibble = (words[i >> 3] >>> ((i & 7) << 2)) & 0xf;
      const offset = ((i << 4) + nibble) << 2;
      r01 ^= table[offset];
      r00 ^= table[offset + 1];
      r11 ^= table[offset + 2];
      r10 ^= table[offset + 3];
    }
    this.s01 = r01;
    this.s00 = r00;
    this.s11 = r11;
    this.s10 = r10;
  }
  getState(): readonly number[] {
    return [this.s01, this.s00, this.s11, this.s10];
  }
}

// Precomputed jump lookup table, stored as a base64-encoded little-endian
// Int32Array of 32 state nibbles * 16 possible values * 4 state words. It
// encodes the same linear transformation as replaying 128 calls to next(),
// see the "jump matches the reference algorithm" test in the spec file for how
// this constant is derived and verified.
const JUMP_TABLE_BASE64 =
  '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';
let jumpTable: Int32Array | undefined = undefined;

// Minimal base64 decoder (avoids atob/Buffer so it runs on Node >=12 and in
// browsers) turning JUMP_TABLE_BASE64 into the little-endian Int32Array table.
function decodeJumpTable(): Int32Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Int8Array(128);
  for (let i = 0; i !== alphabet.length; ++i) {
    lookup[alphabet.charCodeAt(i)] = i;
  }
  const source = JUMP_TABLE_BASE64;
  let sourceLength = source.length;
  while (sourceLength > 0 && source.charCodeAt(sourceLength - 1) === 0x3d /* = */) {
    --sourceLength;
  }
  const bytes = new Uint8Array((sourceLength * 3) >> 2);
  let outPos = 0;
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i !== sourceLength; ++i) {
    buffer = (buffer << 6) | lookup[source.charCodeAt(i)];
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[outPos++] = (buffer >>> bits) & 0xff;
    }
  }
  const table = new Int32Array(bytes.length >> 2);
  for (let i = 0; i !== table.length; ++i) {
    const o = i << 2;
    table[i] = bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24) | 0;
  }
  return table;
}

export function xoroshiro128plusFromState(state: readonly number[]): JumpableRandomGenerator {
  const valid = state.length === 4;
  if (!valid) {
    throw new Error('The state must have been produced by a xoroshiro128plus RandomGenerator');
  }
  return new XoroShiro128Plus(state[0], state[1], state[2], state[3]);
}

export function xoroshiro128plus(seed: number): JumpableRandomGenerator {
  return new XoroShiro128Plus(-1, ~seed, seed | 0, 0);
}
