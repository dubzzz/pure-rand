import { describe, bench } from 'vitest';
import { xorshift128plus } from '../generator/XorShift';
import type { RandomGenerator } from '../../src/types/RandomGenerator';
import { uniformInt } from './uniformInt';
import { uniformArrayInt } from './uniformArrayInt';
import { uniformBigInt } from './uniformBigInt';

describe('distribution', () => {
  const rng = xorshift128plus(0);

  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `small range [0, 2**4 -1]`;
    bench(`dummyFastInt @@ ${smallRangeLabel}`, () => {
      dummyFastInt(rng, 0, 15);
    });
    bench(`uniformInt @@ ${smallRangeLabel}`, () => {
      uniformInt(rng, 0, 15);
    });
    bench(`uniformArrayInt @@ ${smallRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0] }, { sign: 1, data: [15] });
    });
    bench(`uniformBigInt @@ ${smallRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 15n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `medium range [0, 2**21 -1]`;
    bench(`dummyFastInt @@ ${mediumRangeLabel}`, () => {
      dummyFastInt(rng, 0, 2097151);
    });
    bench(`uniformInt @@ ${mediumRangeLabel}`, () => {
      uniformInt(rng, 0, 2097151);
    });
    bench(`uniformArrayInt @@ ${mediumRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0] }, { sign: 1, data: [2097151] });
    });
    bench(`uniformBigInt @@ ${mediumRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 2097151n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `large range [0, 2**32 -1]`;
    bench(`dummyFastInt @@ ${largeRangeLabel}`, () => {
      dummyFastInt(rng, 0, 4294967295);
    });
    bench(`uniformInt @@ ${largeRangeLabel}`, () => {
      uniformInt(rng, 0, 4294967295);
    });
    bench(`uniformArrayInt @@ ${largeRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0] }, { sign: 1, data: [4294967295] });
    });
    bench(`uniformBigInt @@ ${largeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 4294967295n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `large range [0, 2**40 -1]`;
    bench(`uniformInt @@ ${veryLargeRangeLabel}`, () => {
      uniformInt(rng, 0, 1099511627775);
    });
    bench(`uniformArrayInt @@ ${veryLargeRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0, 0] }, { sign: 1, data: [255, 4294967295] });
    });
    bench(`uniformBigInt @@ ${veryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1099511627775n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `large range [0, 2**80 -1]`;
    bench(`uniformArrayInt @@ ${veryVeryLargeRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0, 0, 0] }, { sign: 1, data: [65535, 4294967295, 4294967295] });
    });
    bench(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1208925819614629174706175n);
    });
  });

  describe('various ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `small range [0, 48]`;
    bench(`dummyFastInt @@ ${smallRangeLabel}`, () => {
      dummyFastInt(rng, 0, 48);
    });
    bench(`uniformInt @@ ${smallRangeLabel}`, () => {
      uniformInt(rng, 0, 48);
    });
    bench(`uniformArrayInt @@ ${smallRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0] }, { sign: 1, data: [48] });
    });
    bench(`uniformBigInt @@ ${smallRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 48n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `medium range [0, 1_000_000_000]`;
    bench(`dummyFastInt @@ ${mediumRangeLabel}`, () => {
      dummyFastInt(rng, 0, 1_000_000_000);
    });
    bench(`uniformInt @@ ${mediumRangeLabel}`, () => {
      uniformInt(rng, 0, 1_000_000_000);
    });
    bench(`uniformArrayInt @@ ${mediumRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0] }, { sign: 1, data: [1_000_000_000] });
    });
    bench(`uniformBigInt @@ ${mediumRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1_000_000_000n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `large range [0, 4_000_000_000]`;
    bench(`dummyFastInt @@ ${largeRangeLabel}`, () => {
      dummyFastInt(rng, 0, 4_000_000_000);
    });
    bench(`uniformInt @@ ${largeRangeLabel}`, () => {
      uniformInt(rng, 0, 4_000_000_000);
    });
    bench(`uniformArrayInt @@ ${largeRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0] }, { sign: 1, data: [4_000_000_000] });
    });
    bench(`uniformBigInt @@ ${largeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 4_000_000_000n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `large range [0, 8_000_000_000]`;
    bench(`uniformInt @@ ${veryLargeRangeLabel}`, () => {
      uniformInt(rng, 0, 8_000_000_000);
    });
    bench(`uniformArrayInt @@ ${veryLargeRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0, 0] }, { sign: 1, data: [1, 3_705_032_704] });
    });
    bench(`uniformBigInt @@ ${veryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 8_000_000_000n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `large range [0, 100_000_000_000_000_000]`;
    bench(`uniformArrayInt @@ ${veryVeryLargeRangeLabel}`, () => {
      uniformArrayInt(rng, { sign: 1, data: [0, 0] }, { sign: 1, data: [23_283_064, 1_569_325_056] });
    });
    bench(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 100_000_000_000_000_000n);
    });
  });
});

function dummyFastInt(rng: RandomGenerator, from: number, to: number) {
  const out = rng.next() >>> 0;
  return from + (out % (to - from + 1));
}
