import { describe, bench } from 'vitest';
import { current, type PureRand } from '../__bench__/Imports.js';

const numInts = 5_000;

type GeneratorName = 'congruential32' | 'mersenne' | 'xoroshiro128plus' | 'xorshift128plus';
const generatorNames: GeneratorName[] = ['congruential32', 'mersenne', 'xoroshiro128plus', 'xorshift128plus'];

// Benchmark the current build only: the comparison against `main` is handled by
// vitest's `--compare` mode, which diffs this run against the `benchmark.json`
// computed on `main` (see the `bench:*` scripts). `make` returns the function to
// benchmark so each case can set up its own per-run state (seed, generator, ...).
function benchGenerator(name: string, make: (api: PureRand) => () => void): void {
  bench(name, make(current));
}

describe('generator', () => {
  describe(`init and ${numInts} next`, () => {
    for (const name of generatorNames) {
      benchGenerator(name, (api) => {
        let seed = 0;
        return () => {
          const rng = api[name](seed++);
          for (let i = 0; i !== numInts; ++i) {
            rng.next();
          }
        };
      });
    }
  });

  describe(`${numInts} next`, () => {
    for (const name of generatorNames) {
      benchGenerator(name, (api) => {
        const rng = api[name](0);
        return () => {
          for (let i = 0; i !== numInts; ++i) {
            rng.next();
          }
        };
      });
    }
  });

  for (const name of generatorNames) {
    describe(name, () => {
      benchGenerator('init', (api) => {
        let seed = 0;
        return () => {
          api[name]((seed = (seed + 1) | 0));
        };
      });
      benchGenerator('next', (api) => {
        const rng = api[name](0);
        return () => {
          rng.next();
        };
      });
      benchGenerator('jump', (api) => {
        const rng = api[name](0);
        return () => {
          rng.jump();
        };
      });
    });
  }
});
