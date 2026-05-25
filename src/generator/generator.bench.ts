import { describe, bench } from 'vitest';
import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import type { RandomGenerator } from '../types/RandomGenerator';
import { loadGenerators, type Generators } from '../__bench__/competitors';

const numInts = 5_000;

type GeneratorFactory = (seed: number) => RandomGenerator;
type Competitor = { name: string; factory: GeneratorFactory };

const { current, main } = await loadGenerators();

const algorithmNames = [
  'congruential32',
  'mersenne',
  'xoroshiro128plus',
  'xorshift128plus',
] as const satisfies (keyof Generators)[];

// `native` first as a baseline, then each algorithm immediately followed by its
// `main` counterpart (when comparing) so the two compete within the same group.
const competitors: Competitor[] = [{ name: 'native', factory: native }];
for (const name of algorithmNames) {
  competitors.push({ name, factory: current[name] });
  if (main !== null) {
    competitors.push({ name: `${name} (main)`, factory: main[name] });
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
  for (const name of algorithmNames) {
    describe(name, () => {
      registerSingleOps('', current[name]);
      if (main !== null) {
        registerSingleOps(' (main)', main[name]);
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
