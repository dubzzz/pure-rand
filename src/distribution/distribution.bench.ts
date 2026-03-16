import { describe, bench } from 'vitest';
import { xorshift128plus } from '../generator/xorshift128plus';
import { uniformInt } from './uniformInt';
import { uniformBigInt } from './uniformBigInt';
import { uniformFloat32 } from './uniformFloat32';
import { uniformFloat64 } from './uniformFloat64';
import type { RandomGenerator } from '../types/RandomGenerator';

type UniformIntFn = (rng: RandomGenerator, from: number, to: number) => number;
type UniformBigIntFn = (rng: RandomGenerator, from: bigint, to: bigint) => bigint;
type UniformFloatFn = (rng: RandomGenerator) => number;

// Dynamically load published versions (installed as pure-rand-published in CI).
// We build module specifiers via a helper so TypeScript does not attempt static resolution.
const publishedPkg = 'pure-rand-published';
async function tryImport(subpath: string): Promise<Record<string, unknown> | undefined> {
  try {
    return await import(`${publishedPkg}/${subpath}`);
  } catch {
    return undefined;
  }
}

let publishedRngFactory: ((seed: number) => RandomGenerator) | undefined;
let publishedUniformInt: UniformIntFn | undefined;
let publishedUniformBigInt: UniformBigIntFn | undefined;
let publishedUniformFloat32: UniformFloatFn | undefined;
let publishedUniformFloat64: UniformFloatFn | undefined;

const rngMod = await tryImport('generator/xorshift128plus');
if (rngMod !== undefined) {
  publishedRngFactory = rngMod['xorshift128plus'] as typeof publishedRngFactory;
  publishedUniformInt = ((await tryImport('distribution/uniformInt'))?.['uniformInt'] ??
    undefined) as typeof publishedUniformInt;
  publishedUniformBigInt = ((await tryImport('distribution/uniformBigInt'))?.['uniformBigInt'] ?? undefined) as
    | typeof publishedUniformBigInt
    | undefined;
  publishedUniformFloat32 = ((await tryImport('distribution/uniformFloat32'))?.['uniformFloat32'] ?? undefined) as
    | typeof publishedUniformFloat32
    | undefined;
  publishedUniformFloat64 = ((await tryImport('distribution/uniformFloat64'))?.['uniformFloat64'] ?? undefined) as
    | typeof publishedUniformFloat64
    | undefined;
}

const publishedRng = publishedRngFactory?.(0);

describe('distribution', () => {
  const rng = xorshift128plus(0);

  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 2**4 -1]`;
    bench(`native @@ ${smallRangeLabel}`, () => {
      nativeInt(0, 15);
    });
    bench(`uniformInt @@ ${smallRangeLabel}`, () => {
      uniformInt(rng, 0, 15);
    });
    if (publishedRng && publishedUniformInt) {
      const fn = publishedUniformInt;
      const r = publishedRng;
      bench(`uniformInt (published) @@ ${smallRangeLabel}`, () => {
        fn(r, 0, 15);
      });
    }
    bench(`uniformBigInt @@ ${smallRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 15n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${smallRangeLabel}`, () => {
        fn(r, 0n, 15n);
      });
    }

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 2**21 -1]`;
    bench(`native @@ ${mediumRangeLabel}`, () => {
      nativeInt(0, 2097151);
    });
    bench(`uniformInt @@ ${mediumRangeLabel}`, () => {
      uniformInt(rng, 0, 2097151);
    });
    if (publishedRng && publishedUniformInt) {
      const fn = publishedUniformInt;
      const r = publishedRng;
      bench(`uniformInt (published) @@ ${mediumRangeLabel}`, () => {
        fn(r, 0, 2097151);
      });
    }
    bench(`uniformBigInt @@ ${mediumRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 2097151n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${mediumRangeLabel}`, () => {
        fn(r, 0n, 2097151n);
      });
    }

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 2**32 -1]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 4294967295);
    });
    bench(`uniformInt @@ ${largeRangeLabel}`, () => {
      uniformInt(rng, 0, 4294967295);
    });
    if (publishedRng && publishedUniformInt) {
      const fn = publishedUniformInt;
      const r = publishedRng;
      bench(`uniformInt (published) @@ ${largeRangeLabel}`, () => {
        fn(r, 0, 4294967295);
      });
    }
    bench(`uniformBigInt @@ ${largeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 4294967295n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${largeRangeLabel}`, () => {
        fn(r, 0n, 4294967295n);
      });
    }

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 2**40 -1]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 1099511627775);
    });
    bench(`uniformInt @@ ${veryLargeRangeLabel}`, () => {
      uniformInt(rng, 0, 1099511627775);
    });
    if (publishedRng && publishedUniformInt) {
      const fn = publishedUniformInt;
      const r = publishedRng;
      bench(`uniformInt (published) @@ ${veryLargeRangeLabel}`, () => {
        fn(r, 0, 1099511627775);
      });
    }
    bench(`uniformBigInt @@ ${veryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1099511627775n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${veryLargeRangeLabel}`, () => {
        fn(r, 0n, 1099511627775n);
      });
    }

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 2**80 -1]`;
    bench(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1208925819614629174706175n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${veryVeryLargeRangeLabel}`, () => {
        fn(r, 0n, 1208925819614629174706175n);
      });
    }
  });

  describe('various ranges', () => {
    // no specific range
    bench(`native @@ {{float}} [0, 1)`, () => {
      nativeFloat();
    });
    bench(`uniformFloat32 @@ {{float}} [0, 1)`, () => {
      uniformFloat32(rng);
    });
    if (publishedRng && publishedUniformFloat32) {
      const fn = publishedUniformFloat32;
      const r = publishedRng;
      bench(`uniformFloat32 (published) @@ {{float}} [0, 1)`, () => {
        fn(r);
      });
    }
    bench(`uniformFloat64 @@ {{float}} [0, 1)`, () => {
      uniformFloat64(rng);
    });
    if (publishedRng && publishedUniformFloat64) {
      const fn = publishedUniformFloat64;
      const r = publishedRng;
      bench(`uniformFloat64 (published) @@ {{float}} [0, 1)`, () => {
        fn(r);
      });
    }

    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 48]`;
    bench(`native @@ ${smallRangeLabel}`, () => {
      nativeInt(0, 48);
    });
    bench(`uniformInt @@ ${smallRangeLabel}`, () => {
      uniformInt(rng, 0, 48);
    });
    if (publishedRng && publishedUniformInt) {
      const fn = publishedUniformInt;
      const r = publishedRng;
      bench(`uniformInt (published) @@ ${smallRangeLabel}`, () => {
        fn(r, 0, 48);
      });
    }
    bench(`uniformBigInt @@ ${smallRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 48n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${smallRangeLabel}`, () => {
        fn(r, 0n, 48n);
      });
    }

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 1_000_000_000]`;
    bench(`native @@ ${mediumRangeLabel}`, () => {
      nativeInt(0, 1_000_000_000);
    });
    bench(`uniformInt @@ ${mediumRangeLabel}`, () => {
      uniformInt(rng, 0, 1_000_000_000);
    });
    if (publishedRng && publishedUniformInt) {
      const fn = publishedUniformInt;
      const r = publishedRng;
      bench(`uniformInt (published) @@ ${mediumRangeLabel}`, () => {
        fn(r, 0, 1_000_000_000);
      });
    }
    bench(`uniformBigInt @@ ${mediumRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 1_000_000_000n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${mediumRangeLabel}`, () => {
        fn(r, 0n, 1_000_000_000n);
      });
    }

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 4_000_000_000]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 4_000_000_000);
    });
    bench(`uniformInt @@ ${largeRangeLabel}`, () => {
      uniformInt(rng, 0, 4_000_000_000);
    });
    if (publishedRng && publishedUniformInt) {
      const fn = publishedUniformInt;
      const r = publishedRng;
      bench(`uniformInt (published) @@ ${largeRangeLabel}`, () => {
        fn(r, 0, 4_000_000_000);
      });
    }
    bench(`uniformBigInt @@ ${largeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 4_000_000_000n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${largeRangeLabel}`, () => {
        fn(r, 0n, 4_000_000_000n);
      });
    }

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 8_000_000_000]`;
    bench(`native @@ ${veryLargeRangeLabel}`, () => {
      nativeInt(0, 8_000_000_000);
    });
    bench(`uniformInt @@ ${veryLargeRangeLabel}`, () => {
      uniformInt(rng, 0, 8_000_000_000);
    });
    if (publishedRng && publishedUniformInt) {
      const fn = publishedUniformInt;
      const r = publishedRng;
      bench(`uniformInt (published) @@ ${veryLargeRangeLabel}`, () => {
        fn(r, 0, 8_000_000_000);
      });
    }
    bench(`uniformBigInt @@ ${veryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 8_000_000_000n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${veryLargeRangeLabel}`, () => {
        fn(r, 0n, 8_000_000_000n);
      });
    }

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 100_000_000_000_000_000]`;
    bench(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, () => {
      uniformBigInt(rng, 0n, 100_000_000_000_000_000n);
    });
    if (publishedRng && publishedUniformBigInt) {
      const fn = publishedUniformBigInt;
      const r = publishedRng;
      bench(`uniformBigInt (published) @@ ${veryVeryLargeRangeLabel}`, () => {
        fn(r, 0n, 100_000_000_000_000_000n);
      });
    }
  });
});

function nativeFloat() {
  return Math.random();
}

function nativeInt(from: number, to: number) {
  return from + Math.floor(Math.random() * (to - from + 1));
}
