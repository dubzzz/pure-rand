import { describe, bench } from 'vitest';
import { xorshift128plus } from '../generator/xorshift128plus';
import { xoroshiro128plus } from '../generator/xoroshiro128plus';
import { mersenne } from '../generator/mersenne';
import { congruential32 } from '../generator/congruential32';
import { uniformFloat32 } from './uniformFloat32';

// Inline constants matching uniformFloat32.ts
const scale = 5.960464477539063e-8; // = 1 / divisor (with divisor = 1 << 24)
const mask = 16777215; // = (1 << 24) - 1

function nativeFloat() {
  return Math.random();
}

describe('uniformFloat32 single call', () => {
  const rngXorshift = xorshift128plus(0);
  const rngXoroshiro = xoroshiro128plus(0);
  const rngMersenne = mersenne(0);
  const rngCongruential = congruential32(0);

  bench('native Math.random()', () => {
    nativeFloat();
  });

  bench('uniformFloat32 @ xorshift128plus', () => {
    uniformFloat32(rngXorshift);
  });

  bench('uniformFloat32 @ xoroshiro128plus', () => {
    uniformFloat32(rngXoroshiro);
  });

  bench('uniformFloat32 @ mersenne', () => {
    uniformFloat32(rngMersenne);
  });

  bench('uniformFloat32 @ congruential32', () => {
    uniformFloat32(rngCongruential);
  });

  // Inline reference: shows dispatch overhead of the function call itself.
  bench('inline math @ xorshift128plus', () => {
    (rngXorshift.next() & mask) * scale;
  });
});

describe('uniformFloat32 batches (xorshift128plus)', () => {
  const rng = xorshift128plus(0);

  bench('native batch x100', () => {
    let acc = 0;
    for (let i = 0; i < 100; ++i) acc += nativeFloat();
    void acc;
  });

  bench('uniformFloat32 batch x100', () => {
    let acc = 0;
    for (let i = 0; i < 100; ++i) acc += uniformFloat32(rng);
    void acc;
  });

  bench('uniformFloat32 batch x1000', () => {
    let acc = 0;
    for (let i = 0; i < 1000; ++i) acc += uniformFloat32(rng);
    void acc;
  });

  bench('uniformFloat32 batch x10000', () => {
    let acc = 0;
    for (let i = 0; i < 10000; ++i) acc += uniformFloat32(rng);
    void acc;
  });

  bench('inline math batch x1000', () => {
    let acc = 0;
    for (let i = 0; i < 1000; ++i) acc += (rng.next() & mask) * scale;
    void acc;
  });
});

describe('uniformFloat32 batches (mersenne)', () => {
  const rng = mersenne(0);

  bench('uniformFloat32 batch x1000 @ mersenne', () => {
    let acc = 0;
    for (let i = 0; i < 1000; ++i) acc += uniformFloat32(rng);
    void acc;
  });
});

describe('uniformFloat32 batches (congruential32)', () => {
  const rng = congruential32(0);

  bench('uniformFloat32 batch x1000 @ congruential32', () => {
    let acc = 0;
    for (let i = 0; i < 1000; ++i) acc += uniformFloat32(rng);
    void acc;
  });
});
