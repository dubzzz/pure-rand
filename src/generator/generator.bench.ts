import { describe, bench } from 'vitest';
import { xoroshiro128plus } from './XoroShiro';
import { congruential32 } from './LinearCongruential';
import { mersenne } from './MersenneTwister';
import { xorshift128plus } from './XorShift';

const numInts = 5_000;
const algorithms = [congruential32, mersenne, xoroshiro128plus, xorshift128plus];
const algorithmsWithJump = algorithms.filter((algorithm) => algorithm(0).jump !== undefined);

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
  describe(`${numInts} jump`, () => {
    for (const algorithm of algorithmsWithJump) {
      const rng = algorithm(0);
      bench(algorithm.name, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.jump!();
        }
      });
    }
  });
});
