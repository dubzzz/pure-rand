import { describe, bench } from 'vitest';
import { xorshift128plus } from '../generator/xorshift128plus';
import { uniformInt } from './uniformInt';
import { uniformIntInternal } from './internals/uniformIntInternal';

function nativeInt(from: number, to: number) {
  return from + Math.floor(Math.random() * (to - from + 1));
}

const rng = xorshift128plus(0);

describe('uniformInt', () => {
  // --- Degenerate ---
  bench('uniformIntInternal(rng, 1) - degenerate (always 0)', () => {
    uniformIntInternal(rng, 1);
  });

  // --- Range size 2 ---
  bench('uniformInt [0,1] (range size 2)', () => {
    uniformInt(rng, 0, 1);
  });

  // --- Range size 3 (worst-case rejection ~25%) ---
  bench('uniformInt [0,2] (range size 3, worst-case rejection)', () => {
    uniformInt(rng, 0, 2);
  });

  // --- Small range power of two ---
  bench('native [0,255] (range size 256, pow2)', () => {
    nativeInt(0, 255);
  });
  bench('uniformInt [0,255] (range size 256, pow2)', () => {
    uniformInt(rng, 0, 255);
  });

  // --- Small range non-pow2 ---
  bench('native [0,48] (range size 49)', () => {
    nativeInt(0, 48);
  });
  bench('uniformInt [0,48] (range size 49)', () => {
    uniformInt(rng, 0, 48);
  });

  // --- Small range power of two minus 1 (worst case for div) ---
  bench('uniformInt [0,254] (range size 255, pow2-1)', () => {
    uniformInt(rng, 0, 254);
  });

  // --- Medium range (2^16) ---
  bench('native [0, 2**16-1]', () => {
    nativeInt(0, 65535);
  });
  bench('uniformInt [0, 2**16-1] (range size 65536, pow2)', () => {
    uniformInt(rng, 0, 65535);
  });

  // --- Medium range 2^21 ---
  bench('native [0, 2**21-1]', () => {
    nativeInt(0, 2097151);
  });
  bench('uniformInt [0, 2**21-1] (range size 2**21, pow2)', () => {
    uniformInt(rng, 0, 2097151);
  });

  // --- Medium range 1e9 ---
  bench('native [0, 1e9]', () => {
    nativeInt(0, 1_000_000_000);
  });
  bench('uniformInt [0, 1e9]', () => {
    uniformInt(rng, 0, 1_000_000_000);
  });

  // --- Range size = 2^31 ---
  bench('uniformInt [0, 2**31-1] (size 2**31, pow2)', () => {
    uniformInt(rng, 0, 0x7fffffff);
  });

  // --- Range size = 2^32 ---
  bench('native [0, 2**32-1]', () => {
    nativeInt(0, 0xffffffff);
  });
  bench('uniformInt [0, 2**32-1] (size 2**32, pow2)', () => {
    uniformInt(rng, 0, 0xffffffff);
  });

  // --- Range = 2^32 - 1 (worst case for MaxAllowed computation in uint32 fits) ---
  bench('uniformInt [0, 2**32-2] (size 2**32-1)', () => {
    uniformInt(rng, 0, 0xfffffffe);
  });

  // --- Range = 4e9 (close to 2^32) ---
  bench('native [0, 4e9]', () => {
    nativeInt(0, 4_000_000_000);
  });
  bench('uniformInt [0, 4e9]', () => {
    uniformInt(rng, 0, 4_000_000_000);
  });

  // --- XL Range triggers ArrayInt64 path: 2**33 ---
  bench('uniformInt [0, 2**33-1] (XL, ArrayInt64 path)', () => {
    uniformInt(rng, 0, 0x1ffffffff);
  });

  // --- XL Range 2**40 ---
  bench('uniformInt [0, 2**40-1] (XL, ArrayInt64 path)', () => {
    uniformInt(rng, 0, 0xffffffffff);
  });

  // --- XL Range 8e9 ---
  bench('native [0, 8e9]', () => {
    nativeInt(0, 8_000_000_000);
  });
  bench('uniformInt [0, 8e9] (XL, ArrayInt64 path)', () => {
    uniformInt(rng, 0, 8_000_000_000);
  });

  // --- 2**53 - 1 = MAX_SAFE_INTEGER ---
  bench('uniformInt [0, MAX_SAFE_INTEGER] (XL, ArrayInt64 path)', () => {
    uniformInt(rng, 0, Number.MAX_SAFE_INTEGER);
  });

  // --- Full safe-integer range (uses substractArrayInt64 path) ---
  bench('uniformInt [MIN_SAFE, MAX_SAFE] (XXL, substractArrayInt64 path)', () => {
    uniformInt(rng, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  });

  // --- Non-zero from: small negative-spanning range ---
  bench('uniformInt [-100, 100]', () => {
    uniformInt(rng, -100, 100);
  });

  // --- Full int32 range ---
  bench('uniformInt [-2**31, 2**31-1] (full int32, pow2)', () => {
    uniformInt(rng, -0x80000000, 0x7fffffff);
  });

  // --- int32 range plus 1 (triggers ArrayInt64 path) ---
  bench('uniformInt [-2**31, 2**31] (int32+1, ArrayInt64 path)', () => {
    uniformInt(rng, -0x80000000, 0x80000000);
  });

  // --- Negative range spanning zero, medium ---
  bench('uniformInt [-1e6, 1e6]', () => {
    uniformInt(rng, -1_000_000, 1_000_000);
  });
});
