import { describe, bench } from 'vitest';
import { current } from '../__bench__/Imports.js';

const numInts = 5_000;

type GeneratorName = 'congruential32' | 'mersenne' | 'xoroshiro128plus' | 'xorshift128plus';
const generatorNames: GeneratorName[] = ['congruential32', 'mersenne', 'xoroshiro128plus', 'xorshift128plus'];

describe('generator', () => {
  describe(`init and ${numInts} next`, () => {
    for (const name of generatorNames) {
      const generator = current[name];
      let seed = 0;
      bench(name, () => {
        const rng = generator(seed++);
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });

  describe(`${numInts} next`, () => {
    for (const name of generatorNames) {
      const rng = current[name](0);
      bench(name, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });

  for (const name of generatorNames) {
    describe(name, () => {
      const generator = current[name];
      let seed = 0;
      bench('init', () => {
        generator((seed = (seed + 1) | 0));
      });

      const rng = generator(0);
      bench('next', () => {
        rng.next();
      });
      bench('jump', () => {
        rng.jump();
      });
    });
  }
});
