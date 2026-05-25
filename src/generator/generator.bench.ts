import { describe, bench } from 'vitest';
import { xoroshiro128plus } from './xoroshiro128plus';
import { congruential32 } from './congruential32';
import { mersenne } from './mersenne';
import { xorshift128plus } from './xorshift128plus';
import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import type { RandomGenerator } from '../types/RandomGenerator';
import { loadMainGenerators, type MainGenerators } from '../__bench__/main';

const numInts = 5_000;

type GeneratorFactory = (seed: number) => RandomGenerator;
type Competitor = { name: string; factory: GeneratorFactory };

const main = await loadMainGenerators();

const baseAlgorithms: GeneratorFactory[] = [congruential32, mersenne, xoroshiro128plus, xorshift128plus];

// `native` first as a baseline, then each algorithm immediately followed by its
// `main` counterpart (when comparing) so the two compete within the same group.
const competitors: Competitor[] = [{ name: native.name, factory: native }];
for (const algorithm of baseAlgorithms) {
  competitors.push({ name: algorithm.name, factory: algorithm });
  if (main !== null) {
    competitors.push({ name: `${algorithm.name} (main)`, factory: main[algorithm.name as keyof MainGenerators] });
  }
}

describe('generator', () => {
  describe(`init and ${numInts} next`, () => {
    for (const { name, factory } of competitors) {
      let seed = 0;
      bench(name, () => {
        const rng = factory(seed++);
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });
  describe(`${numInts} next`, () => {
    for (const { name, factory } of competitors) {
      const rng = factory(0);
      bench(name, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });
  for (const algorithm of baseAlgorithms) {
    describe(algorithm.name, () => {
      registerSingleOps('', algorithm);
      if (main !== null) {
        registerSingleOps(' (main)', main[algorithm.name as keyof MainGenerators]);
      }
    });
  }
});

function registerSingleOps(suffix: string, factory: GeneratorFactory) {
  const rng = factory(0);
  let seed = 0;
  bench(
    `init${suffix}`,
    () => {
      factory(seed);
    },
    {
      setup: () => {
        seed = (seed + 1) | 0;
      },
    },
  );
  bench(`next${suffix}`, () => {
    rng.next();
  });
  if (isJumpableRandomGenerator(rng)) {
    bench(`jump${suffix}`, () => {
      rng.jump();
    });
  }
}

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
