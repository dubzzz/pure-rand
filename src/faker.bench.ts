// Benchmark comparing the default Mersenne-based randomizer shipped by faker
// against pure-rand generators wired in through a small `generatePureRandRandomizer`
// adapter — the very integration unlocked by the closed feature request
// faker-js/faker#2195 ("Customize the PRNG used by faker"),
// see https://github.com/faker-js/faker/issues/2195 and the resulting guide
// at https://fakerjs.dev/guide/randomizer.
import { describe, bench } from 'vitest';
import {
  Faker,
  base,
  en,
  generateMersenne32Randomizer,
  generateMersenne53Randomizer,
  type LocaleDefinition,
  type Randomizer,
} from '@faker-js/faker';
import { uniformFloat64 } from './distribution/uniformFloat64';
import { congruential32 } from './generator/congruential32';
import { mersenne } from './generator/mersenne';
import { xoroshiro128plus } from './generator/xoroshiro128plus';
import { xorshift128plus } from './generator/xorshift128plus';
import type { RandomGenerator } from './types/RandomGenerator';

function generatePureRandRandomizer(
  factory: (seed: number) => RandomGenerator,
  initialSeed: number,
  toFloat: (rng: RandomGenerator) => number,
): Randomizer {
  const self: { generator: RandomGenerator } & Randomizer = {
    generator: factory(initialSeed),
    next: () => toFloat(self.generator),
    seed: (value) => {
      self.generator = factory(typeof value === 'number' ? value : (value[0] ?? 0));
    },
  };
  return self;
}

// Non-uniform transform: 32-bit precision packed into a 53-bit float. Matches
// faker's own `nextF32` path used by `generateMersenne32Randomizer`.
function nonUniformFloat32(rng: RandomGenerator): number {
  return (rng.next() >>> 0) / 0x1_0000_0000;
}

type Variant = { name: string; build: (seed: number) => Randomizer };

const pureRandFactories: { name: string; factory: (seed: number) => RandomGenerator }[] = [
  { name: 'xoroshiro128plus', factory: xoroshiro128plus },
  { name: 'xorshift128plus', factory: xorshift128plus },
  { name: 'mersenne', factory: mersenne },
  { name: 'congruential32', factory: congruential32 },
];

const variants: Variant[] = [
  { name: 'faker @@ mersenne32 (default <v9) [non-uniform]', build: (seed) => generateMersenne32Randomizer(seed) },
  { name: 'faker @@ mersenne53 (default >=v9) [uniform]', build: (seed) => generateMersenne53Randomizer(seed) },
  ...pureRandFactories.flatMap(({ name, factory }): Variant[] => [
    {
      name: `pure-rand @@ ${name} [non-uniform]`,
      build: (seed) => generatePureRandRandomizer(factory, seed, nonUniformFloat32),
    },
    {
      name: `pure-rand @@ ${name} [uniform]`,
      build: (seed) => generatePureRandRandomizer(factory, seed, uniformFloat64),
    },
  ]),
];

// `[en, base]` is the minimum set needed for richer modules such as
// `person.bio()` which falls back to `internet.emoji` from `base`.
const locale: LocaleDefinition[] = [en, base];
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
      const faker = new Faker({ locale, randomizer: build(0) });
      bench(name, () => {
        faker.person.fullName();
      });
    }
  });

  describe('faker.internet.email()', () => {
    for (const { name, build } of variants) {
      const faker = new Faker({ locale, randomizer: build(0) });
      bench(name, () => {
        faker.internet.email();
      });
    }
  });

  describe('faker.helpers.shuffle (1_000 items)', () => {
    const data: number[] = [];
    for (let i = 0; i !== 1_000; ++i) {
      data.push(i);
    }
    for (const { name, build } of variants) {
      const faker = new Faker({ locale, randomizer: build(0) });
      bench(name, () => {
        faker.helpers.shuffle(data);
      });
    }
  });

  describe('faker.string.uuid()', () => {
    for (const { name, build } of variants) {
      const faker = new Faker({ locale, randomizer: build(0) });
      bench(name, () => {
        faker.string.uuid();
      });
    }
  });

  describe('faker.lorem.paragraphs(10)', () => {
    for (const { name, build } of variants) {
      const faker = new Faker({ locale, randomizer: build(0) });
      bench(name, () => {
        faker.lorem.paragraphs(10);
      });
    }
  });

  // Full user-like record — exercises many faker modules at once and emulates a
  // realistic seeding workload (e.g. populating a database with fixtures).
  describe('faker @@ full user record', () => {
    for (const { name, build } of variants) {
      const faker = new Faker({ locale, randomizer: build(0) });
      bench(name, () => {
        ({
          id: faker.string.uuid(),
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          jobTitle: faker.person.jobTitle(),
          bio: faker.person.bio(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          country: faker.location.country(),
          company: faker.company.name(),
          iban: faker.finance.iban(),
          creditCard: faker.finance.creditCardNumber(),
        });
      });
    }
  });
});
