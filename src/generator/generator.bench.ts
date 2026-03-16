import { describe, bench } from 'vitest';
import { xoroshiro128plus } from './xoroshiro128plus';
import { congruential32 } from './congruential32';
import { mersenne } from './mersenne';
import { xorshift128plus } from './xorshift128plus';
import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import type { RandomGenerator } from '../types/RandomGenerator';

const numInts = 5_000;

type GeneratorFactory = (seed: number) => RandomGenerator;
type JumpableGeneratorFactory = (seed: number) => JumpableRandomGenerator;

interface AlgorithmEntry {
  name: string;
  factory: GeneratorFactory;
}
interface JumpableAlgorithmEntry {
  name: string;
  factory: JumpableGeneratorFactory;
}

const currentAlgorithms: AlgorithmEntry[] = [
  { name: 'congruential32', factory: congruential32 },
  { name: 'mersenne', factory: mersenne },
  { name: 'xoroshiro128plus', factory: xoroshiro128plus },
  { name: 'xorshift128plus', factory: xorshift128plus },
];
const currentAlgorithmsWithJump: JumpableAlgorithmEntry[] = currentAlgorithms.filter(
  (entry): entry is JumpableAlgorithmEntry => 'jump' in entry.factory(0),
);

// Dynamically load the last published version (installed as pure-rand-published in CI)
const publishedAlgorithms: AlgorithmEntry[] = [];
const publishedAlgorithmsWithJump: JumpableAlgorithmEntry[] = [];
const generatorNames = ['congruential32', 'mersenne', 'xoroshiro128plus', 'xorshift128plus'] as const;
for (const name of generatorNames) {
  try {
    const mod = await import(`pure-rand-published/generator/${name}`);
    const factory = mod[name] as GeneratorFactory;
    if (typeof factory === 'function') {
      publishedAlgorithms.push({ name, factory });
      if ('jump' in factory(0)) {
        publishedAlgorithmsWithJump.push({ name, factory: factory as JumpableGeneratorFactory });
      }
    }
  } catch {
    // Published version not available or does not export this generator — skip
  }
}

describe('generator', () => {
  describe(`init and ${numInts} next`, () => {
    for (const { name, factory } of currentAlgorithms) {
      let seed = 0;
      bench(name, () => {
        const rng = factory(seed++);
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
    for (const { name, factory } of publishedAlgorithms) {
      let seed = 0;
      bench(`${name} (published)`, () => {
        const rng = factory(seed++);
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });
  describe(`${numInts} next`, () => {
    for (const { name, factory } of currentAlgorithms) {
      const rng = factory(0);
      bench(name, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
    for (const { name, factory } of publishedAlgorithms) {
      const rng = factory(0);
      bench(`${name} (published)`, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.next();
        }
      });
    }
  });
  describe(`${numInts} jump`, () => {
    for (const { name, factory } of currentAlgorithmsWithJump) {
      const rng = factory(0);
      bench(name, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.jump();
        }
      });
    }
    for (const { name, factory } of publishedAlgorithmsWithJump) {
      const rng = factory(0);
      bench(`${name} (published)`, () => {
        for (let i = 0; i !== numInts; ++i) {
          rng.jump();
        }
      });
    }
  });
});
