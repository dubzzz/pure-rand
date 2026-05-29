import { describe, bench } from 'vitest';
import { current, main, type PureRand } from '../__bench__/Imports.js';
import type { RandomGenerator } from '../types/RandomGenerator';

type Version = { label: string; api: PureRand; rng: RandomGenerator };
const versions: Version[] = [
  { label: 'current', api: current, rng: current.xorshift128plus(0) },
  { label: 'main', api: main, rng: main.xorshift128plus(0) },
];

function benchVersions(name: string, run: (version: Version) => void): void {
  for (const version of versions) {
    bench(`${name} (${version.label})`, () => {
      run(version);
    });
  }
}

describe('distribution', () => {
  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 2**4 -1]`;
    bench(`native @@ ${smallRangeLabel}`, () => {
      nativeInt(0, 15);
    });
    benchVersions(`uniformInt @@ ${smallRangeLabel}`, ({ api, rng }) => {
      api.uniformInt(rng, 0, 15);
    });
    benchVersions(`uniformBigInt @@ ${smallRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 15n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 2**21 -1]`;
    bench(`native @@ ${mediumRangeLabel}`, () => {
      nativeInt(0, 2097151);
    });
    benchVersions(`uniformInt @@ ${mediumRangeLabel}`, ({ api, rng }) => {
      api.uniformInt(rng, 0, 2097151);
    });
    benchVersions(`uniformBigInt @@ ${mediumRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 2097151n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 2**32 -1]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 4294967295);
    });
    benchVersions(`uniformInt @@ ${largeRangeLabel}`, ({ api, rng }) => {
      api.uniformInt(rng, 0, 4294967295);
    });
    benchVersions(`uniformBigInt @@ ${largeRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 4294967295n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 2**40 -1]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 1099511627775);
    });
    benchVersions(`uniformInt @@ ${veryLargeRangeLabel}`, ({ api, rng }) => {
      api.uniformInt(rng, 0, 1099511627775);
    });
    benchVersions(`uniformBigInt @@ ${veryLargeRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 1099511627775n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 2**80 -1]`;
    benchVersions(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 1208925819614629174706175n);
    });
  });

  describe('various ranges', () => {
    // no specific range
    bench(`native @@ {{float}} [0, 1)`, () => {
      nativeFloat();
    });
    benchVersions(`uniformFloat32 @@ {{float}} [0, 1)`, ({ api, rng }) => {
      api.uniformFloat32(rng);
    });
    benchVersions(`uniformFloat64 @@ {{float}} [0, 1)`, ({ api, rng }) => {
      api.uniformFloat64(rng);
    });

    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 48]`;
    bench(`native @@ ${smallRangeLabel}`, () => {
      nativeInt(0, 48);
    });
    benchVersions(`uniformInt @@ ${smallRangeLabel}`, ({ api, rng }) => {
      api.uniformInt(rng, 0, 48);
    });
    benchVersions(`uniformBigInt @@ ${smallRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 48n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 1_000_000_000]`;
    bench(`native @@ ${mediumRangeLabel}`, () => {
      nativeInt(0, 1_000_000_000);
    });
    benchVersions(`uniformInt @@ ${mediumRangeLabel}`, ({ api, rng }) => {
      api.uniformInt(rng, 0, 1_000_000_000);
    });
    benchVersions(`uniformBigInt @@ ${mediumRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 1_000_000_000n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 4_000_000_000]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 4_000_000_000);
    });
    benchVersions(`uniformInt @@ ${largeRangeLabel}`, ({ api, rng }) => {
      api.uniformInt(rng, 0, 4_000_000_000);
    });
    benchVersions(`uniformBigInt @@ ${largeRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 4_000_000_000n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 8_000_000_000]`;
    bench(`native @@ ${veryLargeRangeLabel}`, () => {
      nativeInt(0, 8_000_000_000);
    });
    benchVersions(`uniformInt @@ ${veryLargeRangeLabel}`, ({ api, rng }) => {
      api.uniformInt(rng, 0, 8_000_000_000);
    });
    benchVersions(`uniformBigInt @@ ${veryLargeRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 8_000_000_000n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 100_000_000_000_000_000]`;
    benchVersions(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, ({ api, rng }) => {
      api.uniformBigInt(rng, 0n, 100_000_000_000_000_000n);
    });
  });
});

function nativeFloat() {
  return Math.random();
}

function nativeInt(from: number, to: number) {
  return from + Math.floor(Math.random() * (to - from + 1));
}
