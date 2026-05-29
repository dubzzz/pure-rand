import { describe, bench } from 'vitest';
import { current, main, type PureRand } from '../__bench__/Imports.js';

const numInts = 5_000;

// Run each version several times so that ordering/warmup noise gets averaged out
// when comparing current against main.
const numReplicas = 3;

type GeneratorName = 'congruential32' | 'mersenne' | 'xoroshiro128plus' | 'xorshift128plus';
const generatorNames: GeneratorName[] = ['congruential32', 'mersenne', 'xoroshiro128plus', 'xorshift128plus'];

// Always compare the current build against main: each comparison gets its own
// describe block holding `numReplicas` interleaved benches per version, named
// `current-${i}` and `main-${i}`.
function compare(name: string, make: (api: PureRand) => () => void): void {
  describe(name, () => {
    for (let i = 0; i !== numReplicas; ++i) {
      bench(`current-${i}`, make(current));
      bench(`main-${i}`, make(main));
    }
  });
}

describe('generator', () => {
  describe(`init and ${numInts} next`, () => {
    for (const name of generatorNames) {
      compare(name, (api) => {
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
      compare(name, (api) => {
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
      compare('init', (api) => {
        let seed = 0;
        return () => {
          api[name]((seed = (seed + 1) | 0));
        };
      });
      compare('next', (api) => {
        const rng = api[name](0);
        return () => {
          rng.next();
        };
      });
      compare('jump', (api) => {
        const rng = api[name](0);
        return () => {
          rng.jump();
        };
      });
    });
  }
});
