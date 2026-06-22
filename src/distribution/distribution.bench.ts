import { describe, bench } from 'vitest';
import { current, type PureRand } from '../__bench__/Imports.js';
import type { RandomGenerator } from '../types/RandomGenerator';

// Benchmark the current build only: the comparison against `main` is handled by
// vitest's `--compare` mode, which diffs this run against the `benchmark.json`
// computed on `main` (see the `bench:*` scripts). Each case is fed a single seeded
// generator so the inputs stay identical across runs.
function benchDistribution(name: string, run: (api: PureRand, rng: RandomGenerator) => void): void {
  const rng = current.xorshift128plus(0);
  bench(name, () => {
    run(current, rng);
  });
}

describe('distribution', () => {
  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 2**4 -1]`;
    benchDistribution(`uniformInt @@ ${smallRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 15);
    });
    benchDistribution(`uniformBigInt @@ ${smallRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 15n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 2**21 -1]`;
    benchDistribution(`uniformInt @@ ${mediumRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 2097151);
    });
    benchDistribution(`uniformBigInt @@ ${mediumRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 2097151n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 2**32 -1]`;
    benchDistribution(`uniformInt @@ ${largeRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 4294967295);
    });
    benchDistribution(`uniformBigInt @@ ${largeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 4294967295n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 2**40 -1]`;
    benchDistribution(`uniformInt @@ ${veryLargeRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 1099511627775);
    });
    benchDistribution(`uniformBigInt @@ ${veryLargeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 1099511627775n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 2**80 -1]`;
    benchDistribution(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 1208925819614629174706175n);
    });
  });

  describe('various ranges', () => {
    // no specific range
    benchDistribution(`uniformFloat32 @@ {{float}} [0, 1)`, (api, rng) => {
      api.uniformFloat32(rng);
    });
    benchDistribution(`uniformFloat64 @@ {{float}} [0, 1)`, (api, rng) => {
      api.uniformFloat64(rng);
    });

    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 48]`;
    benchDistribution(`uniformInt @@ ${smallRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 48);
    });
    benchDistribution(`uniformBigInt @@ ${smallRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 48n);
    });

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 1_000_000_000]`;
    benchDistribution(`uniformInt @@ ${mediumRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 1_000_000_000);
    });
    benchDistribution(`uniformBigInt @@ ${mediumRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 1_000_000_000n);
    });

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 4_000_000_000]`;
    benchDistribution(`uniformInt @@ ${largeRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 4_000_000_000);
    });
    benchDistribution(`uniformBigInt @@ ${largeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 4_000_000_000n);
    });

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 8_000_000_000]`;
    benchDistribution(`uniformInt @@ ${veryLargeRangeLabel}`, (api, rng) => {
      api.uniformInt(rng, 0, 8_000_000_000);
    });
    benchDistribution(`uniformBigInt @@ ${veryLargeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 8_000_000_000n);
    });

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 100_000_000_000_000_000]`;
    benchDistribution(`uniformBigInt @@ ${veryVeryLargeRangeLabel}`, (api, rng) => {
      api.uniformBigInt(rng, 0n, 100_000_000_000_000_000n);
    });
  });
});
