import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';

// XorShift128+ with a=23, b=18, c=5
// - http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
// - http://vigna.di.unimi.it/xorshift/xorshift128plus.c
// - https://docs.rs/crate/xorshift/0.1.3/source/src/xorshift128.rs
//
// NOTE: Math.random() of V8 uses XorShift128+ with a=23, b=17, c=26,
//       See https://github.com/v8/v8/blob/4b9b23521e6fd42373ebbcb20ebe03bf445494f9/src/base/utils/random-number-generator.h#L119-L128

// The state transition of XorShift128+ is purely linear over GF(2): the next state is built
// exclusively from XORs, shifts and ORs of non-overlapping bits, so no carry ever feeds back
// into the state. As a consequence `jump`, which is a fixed sequence of state transitions XORed
// together, is itself a fixed linear map `s -> M . s` over the 128-bit state.
//
// Rather than replaying the 128 `next` calls making up that map on every `jump`, we precompute
// its action through a four-Russians lookup table. The 128-bit state is split into 16 bytes and,
// for each byte position and each of its 256 possible values, the table stores the contribution
// of that byte to the post-jump state. A `jump` then boils down to 16 byte lookups XORed together
// instead of 128 `next` calls, while producing the exact same value stream as before.
//
// The table holds 16 (positions) * 256 (values) * 4 (32-bit words) entries, ie. 64 KB. It is
// built lazily on the first `jump` so that consumers that never jump pay nothing for it.

// JUMP polynomial coefficients, low to high 32-bit words.
// Equivalent to 2^64 calls to next() and used to generate 2^64 non-overlapping subsequences.
const JUMP = [0x635d2dff, 0x8a5cd789, 0x5c472f96, 0x121fd215];

let JUMP_TABLE: Int32Array | undefined = undefined;

// Replays the original jump (a fixed linear map) on an explicit state and returns the resulting
// state as [s01, s00, s11, s10]. Only used to derive the lookup table, never on the hot path.
function jumpReference(s01: number, s00: number, s11: number, s10: number): [number, number, number, number] {
  let ns01 = 0;
  let ns00 = 0;
  let ns11 = 0;
  let ns10 = 0;
  for (let i = 0; i !== 4; ++i) {
    for (let mask = 1; mask; mask <<= 1) {
      // Because: (1 << 31) << 1 === 0
      if (JUMP[i] & mask) {
        ns01 ^= s01;
        ns00 ^= s00;
        ns11 ^= s11;
        ns10 ^= s10;
      }
      // One next()-step on the local state (output value is irrelevant here).
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
  return [ns01, ns00, ns11, ns10];
}

// Builds the four-Russians lookup table mapping each of the 16 state-bytes to its contribution to
// the post-jump state. By linearity of the jump, the contribution of a byte is the XOR of the jump
// images of its individual set bits, so we only need the jump image of each of the 128 basis bits.
function buildJumpTable(): Int32Array {
  // words[0] = s01, words[1] = s00, words[2] = s11, words[3] = s10
  const basis: [number, number, number, number][] = [];
  for (let i = 0; i !== 128; ++i) {
    const word = i >> 5;
    const bit = (1 << (i & 31)) | 0;
    basis[i] = jumpReference(word === 0 ? bit : 0, word === 1 ? bit : 0, word === 2 ? bit : 0, word === 3 ? bit : 0);
  }
  const table = new Int32Array(16 * 256 * 4);
  for (let p = 0; p !== 16; ++p) {
    const bitBase = (p >> 2) * 32 + (p & 3) * 8; // first basis bit of byte p
    for (let v = 0; v !== 256; ++v) {
      let r0 = 0;
      let r1 = 0;
      let r2 = 0;
      let r3 = 0;
      for (let k = 0; k !== 8; ++k) {
        if ((v >> k) & 1) {
          const contribution = basis[bitBase + k];
          r0 ^= contribution[0];
          r1 ^= contribution[1];
          r2 ^= contribution[2];
          r3 ^= contribution[3];
        }
      }
      const idx = (p * 256 + v) * 4;
      table[idx] = r0;
      table[idx + 1] = r1;
      table[idx + 2] = r2;
      table[idx + 3] = r3;
    }
  }
  return table;
}

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
    const table = JUMP_TABLE !== undefined ? JUMP_TABLE : (JUMP_TABLE = buildJumpTable());
    const w0 = this.s01;
    const w1 = this.s00;
    const w2 = this.s11;
    const w3 = this.s10;
    let i: number;
    // 16 byte lookups (one per state-byte) XORed together, in place of 128 next() calls.
    i = (0 * 256 + (w0 & 0xff)) * 4;
    let r0 = table[i];
    let r1 = table[i + 1];
    let r2 = table[i + 2];
    let r3 = table[i + 3];
    i = (1 * 256 + ((w0 >>> 8) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (2 * 256 + ((w0 >>> 16) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (3 * 256 + ((w0 >>> 24) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (4 * 256 + (w1 & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (5 * 256 + ((w1 >>> 8) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (6 * 256 + ((w1 >>> 16) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (7 * 256 + ((w1 >>> 24) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (8 * 256 + (w2 & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (9 * 256 + ((w2 >>> 8) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (10 * 256 + ((w2 >>> 16) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (11 * 256 + ((w2 >>> 24) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (12 * 256 + (w3 & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (13 * 256 + ((w3 >>> 8) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (14 * 256 + ((w3 >>> 16) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    i = (15 * 256 + ((w3 >>> 24) & 0xff)) * 4;
    r0 ^= table[i];
    r1 ^= table[i + 1];
    r2 ^= table[i + 2];
    r3 ^= table[i + 3];
    this.s01 = r0;
    this.s00 = r1;
    this.s11 = r2;
    this.s10 = r3;
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
