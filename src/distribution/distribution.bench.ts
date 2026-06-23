import { describe, bench } from 'vitest';
import { current } from '../__bench__/Imports.js';

const { uniformInt, uniformBigInt, uniformFloat32, uniformFloat64 } = current;
const rng = current.xorshift128plus(0);

describe('distribution', () => {
  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 2**4 -1]`;
    bench(`uniformInt @@ ${smallRangeLabel}`, () => {
      uniformInt(rng, 0, 15);
    });
    bench(`uniformBigInt @@ ${smallRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 15n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 2**21 -1]`;
    bench(`uniformInt @@ ${mediumRangeLabel}`, () => {
      uniformInt(rng, 0, 2097151);
    });
    bench(`uniformBigInt @@ ${mediumRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 2097151n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 2**32 -1]`;
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
    bench(`uniformFloat32 @@ {{float}} [0, 1)`, () => {
      uniformFloat32(rng);
    });
    bench(`uniformFloat64 @@ {{float}} [0, 1)`, () => {
      uniformFloat64(rng);
    });

    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 48]`;
    bench(`uniformInt @@ ${smallRangeLabel}`, () => {
      uniformInt(rng, 0, 48);
    });
    bench(`uniformBigInt @@ ${smallRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 48n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 1_000_000_000]`;
    bench(`uniformInt @@ ${mediumRangeLabel}`, () => {
      uniformInt(rng, 0, 1_000_000_000);
    });
    bench(`uniformBigInt @@ ${mediumRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1_000_000_000n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 4_000_000_000]`;
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
