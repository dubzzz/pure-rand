import { describe, bench } from 'vitest';
import { current, main, type PureRand } from '../__bench__/Imports.js';
import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import type { RandomGenerator } from '../types/RandomGenerator';

const numInts = 5_000;

type GeneratorName = 'congruential32' | 'mersenne' | 'xoroshiro128plus' | 'xorshift128plus';
const generatorNames: GeneratorName[] = ['congruential32', 'mersenne', 'xoroshiro128plus', 'xorshift128plus'];

type Version = { label: string; api: PureRand };
const versions: Version[] = [
  { label: 'current', api: current },
  { label: 'main', api: main },
];

describe('generator', () => {
  describe(`init and ${numInts} next`, () => {
    bench('native', () => {
      const rng = native();
      for (let i = 0; i !== numInts; ++i) {
        rng.next();
      }
    });
    for (const name of generatorNames) {
      for (const { label, api } of versions) {
        let seed = 0;
        bench(`${name} (${label})`, () => {
          const rng = api[name](seed++);
          for (let i = 0; i !== numInts; ++i) {
            rng.next();
          }
        });
      }
    }
  });

  describe(`${numInts} next`, () => {
    bench('native', () => {
      const rng = native();
      for (let i = 0; i !== numInts; ++i) {
        rng.next();
      }
    });
    for (const name of generatorNames) {
      for (const { label, api } of versions) {
        const rng = api[name](0);
        bench(`${name} (${label})`, () => {
          for (let i = 0; i !== numInts; ++i) {
            rng.next();
          }
        });
      }
    }
  });

  for (const name of generatorNames) {
    describe(name, () => {
      for (const { label, api } of versions) {
        const rng = api[name](0);
        let seed = 0;
        bench(
          `init (${label})`,
          () => {
            api[name](seed);
          },
          {
            setup: () => {
              seed = (seed + 1) | 0;
            },
          },
        );
        bench(`next (${label})`, () => {
          rng.next();
        });
        if (isJumpableRandomGenerator(rng)) {
          bench(`jump (${label})`, () => {
            rng.jump();
          });
        }
      }
    });
  }
});

function native(): RandomGenerator {
  return {
    clone: () => native(),
    getState: () => [],
    next: () => Math.random(),
  };
}

function isJumpableRandomGenerator(rng: RandomGenerator): rng is JumpableRandomGenerator {
  return 'jump' in rng;
}
