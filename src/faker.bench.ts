// Benchmark comparing the default Mersenne-based randomizer shipped by faker
// against pure-rand generators wired in through a small `generatePureRandRandomizer`
// adapter — the very integration unlocked by the closed feature request
// faker-js/faker#2195 ("Customize the PRNG used by faker"),
// see https://github.com/faker-js/faker/issues/2195 and the resulting guide
// at https://fakerjs.dev/guide/randomizer.
import { describe, bench } from 'vitest';
import {
  Faker,
  en,
  generateMersenne32Randomizer,
  generateMersenne53Randomizer,
  type Randomizer,
} from '@faker-js/faker';
import { congruential32 } from './generator/congruential32';
import { mersenne } from './generator/mersenne';
import { xoroshiro128plus } from './generator/xoroshiro128plus';
import { xorshift128plus } from './generator/xorshift128plus';
import type { RandomGenerator } from './types/RandomGenerator';

function generatePureRandRandomizer(factory: (seed: number) => RandomGenerator, initialSeed: number): Randomizer {
  const self: { generator: RandomGenerator } & Randomizer = {
    generator: factory(initialSeed),
    next: () => (self.generator.next() >>> 0) / 0x1_0000_0000,
    seed: (value) => {
      self.generator = factory(typeof value === 'number' ? value : (value[0] ?? 0));
    },
  };
  return self;
}

type Variant = { name: string; build: (seed: number) => Randomizer };

const variants: Variant[] = [
  { name: 'faker @@ mersenne32 (default <v9)', build: (seed) => generateMersenne32Randomizer(seed) },
  { name: 'faker @@ mersenne53 (default >=v9)', build: (seed) => generateMersenne53Randomizer(seed) },
  { name: 'pure-rand @@ xoroshiro128plus', build: (seed) => generatePureRandRandomizer(xoroshiro128plus, seed) },
  { name: 'pure-rand @@ xorshift128plus', build: (seed) => generatePureRandRandomizer(xorshift128plus, seed) },
  { name: 'pure-rand @@ mersenne', build: (seed) => generatePureRandRandomizer(mersenne, seed) },
  { name: 'pure-rand @@ congruential32', build: (seed) => generatePureRandRandomizer(congruential32, seed) },
];

const numCalls = 5_000;

describe('faker', () => {
  describe(`randomizer.next() x ${numCalls}`, () => {
    for (const { name, build } of variants) {
      const randomizer = build(0);
      bench(name, () => {
        for (let i = 0; i !== numCalls; ++i) {
          randomizer.next();
        }
      });
    }
  });

  describe('faker.person.fullName()', () => {
    for (const { name, build } of variants) {
      const faker = new Faker({ locale: en, randomizer: build(0) });
      bench(name, () => {
        faker.person.fullName();
      });
    }
  });

  describe('faker.internet.email()', () => {
    for (const { name, build } of variants) {
      const faker = new Faker({ locale: en, randomizer: build(0) });
      bench(name, () => {
        faker.internet.email();
      });
    }
  });

  describe('faker.helpers.shuffle (1_000 items)', () => {
    const data = Array.from({ length: 1_000 }, (_, i) => i);
    for (const { name, build } of variants) {
      const faker = new Faker({ locale: en, randomizer: build(0) });
      bench(name, () => {
        faker.helpers.shuffle(data);
      });
    }
  });
});
