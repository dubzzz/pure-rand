import { describe, bench } from 'vitest';
import { xoroshiro128plus } from './xoroshiro128plus';
import { congruential32 } from './congruential32';
import { mersenne } from './mersenne';
import { xorshift128plus } from './xorshift128plus';
import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import type { RandomGenerator } from '../types/RandomGenerator';

const numInts = 5_000;
const algorithms = [native, congruential32, mersenne, xoroshiro128plus, xorshift128plus];

describe('generator', () => {
  describe(`init and ${numInts} next`, () => {
    for (const algorithm of algorithms) {
      let seed = 0;
      bench(algorithm.name, () => {
        const rng = algorithm(seed++);
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });
  describe(`${numInts} next`, () => {
    for (const algorithm of algorithms) {
      const rng = algorithm(0);
      bench(algorithm.name, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });
  for (const algorithm of algorithms) {
    if (algorithm === native) {
      continue;
    }
    describe(algorithm.name, () => {
      const rng = algorithm(0);
      let seed = 0;
      bench(
        'init',
        () => {
          algorithm(seed);
        },
        {
          setup: () => {
            seed = (seed + 1) | 0;
          },
        },
      );
      bench('next', () => {
        rng.next();
      });
      if (isJumpableRandomGenerator(rng)) {
        bench('jump', () => {
          rng.jump();
        });
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
