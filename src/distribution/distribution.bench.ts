import { describe, bench } from 'vitest';
import { current, main, type PureRand } from '../__bench__/Imports.js';
import type { RandomGenerator } from '../types/RandomGenerator';

// Run each version several times so that ordering/warmup noise gets averaged out
// when comparing current against main.
const numReplicas = 3;

// Always compare the current build against main: each comparison gets its own
// describe block holding `numReplicas` interleaved benches per version, named
// `current-${i}` and `main-${i}`. Both versions are fed the same seeded generator
// so the inputs are identical.
function compare(name: string, run: (api: PureRand, rng: RandomGenerator) => void): void {
  describe(name, () => {
    for (let i = 0; i !== numReplicas; ++i) {
      const rngCurrent = current.xorshift128plus(0);
      const rngMain = main.xorshift128plus(0);
      bench(`current-${i}`, () => {
        run(current, rngCurrent);
      });
      bench(`main-${i}`, () => {
        run(main, rngMain);
      });
    }
  });
}

describe('distribution', () => {
  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 2**4 -1]`;
    compare(`uniformInt @@ ${smallRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 15);
    });
    compare(`uniformBigInt @@ ${smallRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 15n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 2**21 -1]`;
    compare(`uniformInt @@ ${mediumRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 2097151);
    });
    compare(`uniformBigInt @@ ${mediumRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 2097151n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 2**32 -1]`;
    compare(`uniformInt @@ ${largeRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 4294967295);
    });
    compare(`uniformBigInt @@ ${largeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 4294967295n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 2**40 -1]`;
    compare(`uniformInt @@ ${veryLargeRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 1099511627775);
    });
    compare(`uniformBigInt @@ ${veryLargeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 1099511627775n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 2**80 -1]`;
    compare(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 1208925819614629174706175n);
    });
  });

  describe('various ranges', () => {
    // no specific range
    compare(`uniformFloat32 @@ {{float}} [0, 1)`, (api, rng) => {
      api.uniformFloat32(rng);
    });
    compare(`uniformFloat64 @@ {{float}} [0, 1)`, (api, rng) => {
      api.uniformFloat64(rng);
    });

    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 48]`;
    compare(`uniformInt @@ ${smallRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 48);
    });
    compare(`uniformBigInt @@ ${smallRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 48n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 1_000_000_000]`;
    compare(`uniformInt @@ ${mediumRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 1_000_000_000);
    });
    compare(`uniformBigInt @@ ${mediumRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 1_000_000_000n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 4_000_000_000]`;
    compare(`uniformInt @@ ${largeRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 4_000_000_000);
    });
    compare(`uniformBigInt @@ ${largeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 4_000_000_000n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 8_000_000_000]`;
    compare(`uniformInt @@ ${veryLargeRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 8_000_000_000);
    });
    compare(`uniformBigInt @@ ${veryLargeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 8_000_000_000n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 100_000_000_000_000_000]`;
    compare(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 100_000_000_000_000_000n);
    });
  });
});
