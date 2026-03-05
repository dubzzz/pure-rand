import { describe, bench } from 'vitest';
import { xorshift128plus } from '../generator/xorshift128plus';
import type { RandomGenerator } from '../../src/types/RandomGenerator';
import { uniformInt } from './uniformInt';
import { uniformBigInt } from './uniformBigInt';
import { uniformFloat32 } from './uniformFloat32';
import { uniformFloat64 } from './uniformFloat64';

describe('distribution', () => {
  const rng = xorshift128plus(0);

  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 2**4 -1]`;
    bench(`dummyFastInt @@ ${smallRangeLabel}`, () => {
      dummyFastInt(rng, 0, 15);
    });
    bench(`uniformInt @@ ${smallRangeLabel}`, () => {
      uniformInt(rng, 0, 15);
    });
    bench(`uniformBigInt @@ ${smallRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 15n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 2**21 -1]`;
    bench(`dummyFastInt @@ ${mediumRangeLabel}`, () => {
      dummyFastInt(rng, 0, 2097151);
    });
    bench(`uniformInt @@ ${mediumRangeLabel}`, () => {
      uniformInt(rng, 0, 2097151);
    });
    bench(`uniformBigInt @@ ${mediumRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 2097151n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 2**32 -1]`;
    bench(`dummyFastInt @@ ${largeRangeLabel}`, () => {
      dummyFastInt(rng, 0, 4294967295);
    });
    bench(`uniformInt @@ ${largeRangeLabel}`, () => {
      uniformInt(rng, 0, 4294967295);
    });
    bench(`uniformBigInt @@ ${largeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 4294967295n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 2**40 -1]`;
    bench(`uniformInt @@ ${veryLargeRangeLabel}`, () => {
      uniformInt(rng, 0, 1099511627775);
    });
    bench(`uniformBigInt @@ ${veryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1099511627775n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 2**80 -1]`;
    bench(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1208925819614629174706175n);
    });
  });

  describe('various ranges', () => {
    // no specific range
    bench(`native Math.random()`, () => {
      nativeMathRandom();
    });
    bench(`uniformFloat32`, () => {
      uniformFloat32(rng);
    });
    bench(`uniformFloat64`, () => {
      uniformFloat64(rng);
    });

    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 48]`;
    bench(`dummyFastInt @@ ${smallRangeLabel}`, () => {
      dummyFastInt(rng, 0, 48);
    });
    bench(`uniformInt @@ ${smallRangeLabel}`, () => {
      uniformInt(rng, 0, 48);
    });
    bench(`uniformBigInt @@ ${smallRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 48n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 1_000_000_000]`;
    bench(`dummyFastInt @@ ${mediumRangeLabel}`, () => {
      dummyFastInt(rng, 0, 1_000_000_000);
    });
    bench(`uniformInt @@ ${mediumRangeLabel}`, () => {
      uniformInt(rng, 0, 1_000_000_000);
    });
    bench(`uniformBigInt @@ ${mediumRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1_000_000_000n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 4_000_000_000]`;
    bench(`dummyFastInt @@ ${largeRangeLabel}`, () => {
      dummyFastInt(rng, 0, 4_000_000_000);
    });
    bench(`uniformInt @@ ${largeRangeLabel}`, () => {
      uniformInt(rng, 0, 4_000_000_000);
    });
    bench(`uniformBigInt @@ ${largeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 4_000_000_000n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 8_000_000_000]`;
    bench(`uniformInt @@ ${veryLargeRangeLabel}`, () => {
      uniformInt(rng, 0, 8_000_000_000);
    });
    bench(`uniformBigInt @@ ${veryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 8_000_000_000n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 100_000_000_000_000_000]`;
    bench(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 100_000_000_000_000_000n);
    });
  });
});

function nativeMathRandom() {
  return Math.random();
}

function dummyFastInt(rng: RandomGenerator, from: number, to: number) {
  const out = rng.next() >>> 0;
  return from + (out % (to - from + 1));
}
