import { describe, bench } from 'vitest';
import type { RandomGenerator } from '../types/RandomGenerator';
import { xorshift128plus } from '../generator/xorshift128plus';
import { xoroshiro128plus } from '../generator/xoroshiro128plus';
import { mersenne } from '../generator/mersenne';
import { congruential32 } from '../generator/congruential32';
import { uniformFloat64 } from './uniformFloat64';

// Inline equivalent of current implementation for comparison
const factor = 134217728; // = 1 << 27
const scale = 1.1102230246251565e-16; // = 2 ** -53
const mask1 = 67108863; // = (1 << 26) - 1
const mask2 = 134217727; // = (1 << 27) - 1
function uniformFloat64Inline(rng: RandomGenerator): number {
  const value1 = rng.next() & mask1;
  const value2 = rng.next() & mask2;
  return (value1 * factor + value2) * scale;
}

describe('uniformFloat64 - reference', () => {
  bench('Math.random() (reference)', () => {
    Math.random();
  });
});

describe('uniformFloat64 - generators', () => {
  const rngXorshift = xorshift128plus(42);
  const rngXoroshiro = xoroshiro128plus(42);
  const rngMersenne = mersenne(42);
  const rngCongruential = congruential32(42);

  bench('uniformFloat64 - xorshift128plus', () => {
    uniformFloat64(rngXorshift);
  });
  bench('uniformFloat64 - xoroshiro128plus', () => {
    uniformFloat64(rngXoroshiro);
  });
  bench('uniformFloat64 - mersenne', () => {
    uniformFloat64(rngMersenne);
  });
  bench('uniformFloat64 - congruential32', () => {
    uniformFloat64(rngCongruential);
  });
});

describe('uniformFloat64 - inline equivalent (sanity)', () => {
  const rng = xorshift128plus(42);
  bench('uniformFloat64 inline - xorshift128plus', () => {
    uniformFloat64Inline(rng);
  });
});

describe('uniformFloat64 - batches', () => {
  const rng = xorshift128plus(42);

  bench('uniformFloat64 x100', () => {
    for (let i = 0; i < 100; i++) uniformFloat64(rng);
  });
  bench('uniformFloat64 x1000', () => {
    for (let i = 0; i < 1000; i++) uniformFloat64(rng);
  });
  bench('uniformFloat64 x10000', () => {
    for (let i = 0; i < 10000; i++) uniformFloat64(rng);
  });

  bench('Math.random x100', () => {
    for (let i = 0; i < 100; i++) Math.random();
  });
  bench('Math.random x1000', () => {
    for (let i = 0; i < 1000; i++) Math.random();
  });
  bench('Math.random x10000', () => {
    for (let i = 0; i < 10000; i++) Math.random();
  });
});
