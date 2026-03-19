import { describe, bench } from 'vitest';
import { xoroshiro128plus } from './xoroshiro128plus';
import { congruential32 } from './congruential32';
import { mersenne } from './mersenne';
import { xorshift128plus } from './xorshift128plus';
import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import type { RandomGenerator } from '../types/RandomGenerator';
import { tryImportFromPublished } from '../tryImportFromPublished';

type Factory = (seed: number) => RandomGenerator;
type Algorithm = { name: string; factory: Factory };

const numInts = 5_000;
const algorithms = [
  { name: 'native', factory: native },
  { name: 'congruential32', factory: congruential32 },
  { name: 'mersenne', factory: mersenne },
  { name: 'xoroshiro128plus', factory: xoroshiro128plus },
  { name: 'xorshift128plus', factory: xorshift128plus },
  { name: 'congruential32 (published)', factory: await tryImportFromPublished('generator/congruential32') },
  { name: 'mersenne (published)', factory: await tryImportFromPublished('generator/mersenne') },
  { name: 'xoroshiro128plus (published)', factory: await tryImportFromPublished('generator/xoroshiro128plus') },
  { name: 'xorshift128plus (published)', factory: await tryImportFromPublished('generator/xorshift128plus') },
].filter((algorithm): algorithm is Algorithm => algorithm.factory !== undefined);

describe('generator', () => {
  describe(`init and ${numInts} next`, () => {
    for (const algorithm of algorithms) {
      let seed = 0;
      bench(algorithm.name, () => {
        const rng = algorithm.factory(seed++);
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });
  describe(`${numInts} next`, () => {
    for (const algorithm of algorithms) {
      const rng = algorithm.factory(0);
      bench(algorithm.name, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });
  for (const algorithm of algorithms) {
    if (algorithm.name === 'native') {
      continue;
    }
    describe(algorithm.name, () => {
      const rng = algorithm.factory(0);
      let seed = 0;
      bench(
        'init',
        () => {
          algorithm.factory(seed);
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
