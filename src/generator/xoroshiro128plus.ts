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
    // Instead of replaying 128 calls to next() (see rawJumpState below), we
    // split the state into 16 bytes and accumulate, for each byte, the
    // precomputed contribution of its 256 possible values. This trades the
    // 128 next() calls for 16 table lookups + XORs while keeping the exact
    // same output stream.
    const table = jumpTable !== undefined ? jumpTable : (jumpTable = buildJumpTable());
    const words = [this.s01, this.s00, this.s11, this.s10];
    let r01 = 0;
    let r00 = 0;
    let r11 = 0;
    let r10 = 0;
    for (let i = 0; i !== 16; ++i) {
      const byte = (words[i >> 2] >>> ((i & 3) << 3)) & 0xff;
      const offset = ((i << 8) + byte) << 2;
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

// Lazily-built lookup table shared across all instances.
// Layout: 16 bytes * 256 possible values * 4 state words, flattened into an
// Int32Array indexed by ((byteIndex << 8) + byteValue) << 2.
let jumpTable: Int32Array | undefined = undefined;

// Reference implementation of the jump: replay 128 calls to next() while
// accumulating the visited states selected by the jump polynomial. Only used
// to build the lookup table, never on the hot path.
function rawJumpState(s01: number, s00: number, s11: number, s10: number): readonly number[] {
  const g = new XoroShiro128Plus(s01, s00, s11, s10);
  let ns01 = 0;
  let ns00 = 0;
  let ns11 = 0;
  let ns10 = 0;
  const jump = [0xd8f554a5, 0xdf900294, 0x4b3201fc, 0x170865df];
  for (let i = 0; i !== 4; ++i) {
    for (let mask = 1; mask; mask <<= 1) {
      // Because: (1 << 31) << 1 === 0
      if (jump[i] & mask) {
        const st = g.getState();
        ns01 ^= st[0];
        ns00 ^= st[1];
        ns11 ^= st[2];
        ns10 ^= st[3];
      }
      g.next();
    }
  }
  return [ns01, ns00, ns11, ns10];
}

function buildJumpTable(): Int32Array {
  // Compute the jump applied to each of the 128 unit states (a single bit set
  // in the 128-bit state). By linearity, the jump of any state is the XOR of
  // the jumps of its set bits.
  const basis: (readonly number[])[] = [];
  for (let word = 0; word !== 4; ++word) {
    for (let bit = 0; bit !== 32; ++bit) {
      const unit = [0, 0, 0, 0];
      unit[word] = (1 << bit) | 0;
      basis.push(rawJumpState(unit[0], unit[1], unit[2], unit[3]));
    }
  }
  // Fold those 128 contributions into a per-byte table: for each of the 16
  // bytes of the state and each of its 256 possible values, XOR together the
  // contributions of the bits set in that value.
  const table = new Int32Array(16 * 256 * 4);
  for (let byteIndex = 0; byteIndex !== 16; ++byteIndex) {
    const bitBase = (byteIndex >> 2) * 32 + ((byteIndex & 3) << 3);
    for (let value = 0; value !== 256; ++value) {
      let r01 = 0;
      let r00 = 0;
      let r11 = 0;
      let r10 = 0;
      for (let b = 0; b !== 8; ++b) {
        if (value & (1 << b)) {
          const contribution = basis[bitBase + b];
          r01 ^= contribution[0];
          r00 ^= contribution[1];
          r11 ^= contribution[2];
          r10 ^= contribution[3];
        }
      }
      const offset = ((byteIndex << 8) + value) << 2;
      table[offset] = r01;
      table[offset + 1] = r00;
      table[offset + 2] = r11;
      table[offset + 3] = r10;
    }
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
