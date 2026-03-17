import { describe, bench } from 'vitest';
import { xoroshiro128plus } from './xoroshiro128plus';
import { congruential32 } from './congruential32';
import { mersenne } from './mersenne';
import { xorshift128plus } from './xorshift128plus';
import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import type { RandomGenerator } from '../types/RandomGenerator';

const numInts = 5_000;
const algorithms = [native, congruential32, mersenne, xoroshiro128plus, xorshift128plus];
const algorithmsWithJump = algorithms.filter(
  (algorithm): algorithm is (seed: number) => JumpableRandomGenerator => 'jump' in algorithm(0),
);

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
  for (const algorithm of algorithmsWithJump) {
    describe(algorithm.name, () => {
      const rng = algorithm(0);
      bench('next', () => {
        rng.next();
      });
      bench('jump', () => {
        rng.jump();
      });
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
