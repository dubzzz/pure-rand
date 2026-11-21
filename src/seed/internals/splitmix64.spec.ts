import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import type { Seed64 } from '../../types/Seed64';
import { seed64FromHex } from '../seed64FromHex';
import { splitmix64 } from './splitmix64';

describe('splitmix64', () => {
  it('Should match the reference stream for seed=0', () => {
    const next = splitmix64([0, 0]);
    // Sebastiano Vigna's reference C implementation, returning high/low words.
    expect(Array.from({ length: 4 }, () => next())).toEqual(
      ['e220a8397b1dcdaf', '6e789e6aa1b965f4', '06c45d188009454f', 'f88bb8a8724c81ec'].map(seed64FromHex),
    );
  });

  it('Should match the 64-bit reference arithmetic for every seed', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: (1n << 64n) - 1n }), fc.integer({ min: 1, max: 20 }), (seed, count) => {
        const next = splitmix64(seed64FromHex(seed.toString(16).padStart(16, '0')));
        const mask = (1n << 64n) - 1n;
        let state = seed;
        for (let idx = 0; idx !== count; ++idx) {
          state = (state + 0x9e3779b97f4a7c15n) & mask;
          let value = state;
          value = ((value ^ (value >> 30n)) * 0xbf58476d1ce4e5b9n) & mask;
          value = ((value ^ (value >> 27n)) * 0x94d049bb133111ebn) & mask;
          value ^= value >> 31n;
          const [high, low] = next();
          expect((BigInt(high) << 32n) | BigInt(low)).toBe(value);
        }
      }),
    );
  });

  it('Should wrap a carry across both words', () => {
    const next = splitmix64([0xffffffff, 0xffffffff]);
    expect(next()).toEqual(seed64FromHex('e4d971771b652c20'));
  });

  it('Should own its state independently of the caller and other streams', () => {
    const seed: [number, number] = [0x01234567, 0x89abcdef];
    const next = splitmix64(seed);
    const reference = splitmix64(seed);
    seed[0] = 0;
    seed[1] = 0;
    for (let idx = 0; idx !== 10; ++idx) {
      expect(next()).toEqual(reference());
    }
  });

  it.each([
    [],
    [0],
    [0, 0, 0],
    [-1, 0],
    [0, -1],
    [2 ** 32, 0],
    [0, 2 ** 32],
    [0.5, 0],
    [0, 0.5],
    [Number.NaN, 0],
    [0, Number.NaN],
    [Number.POSITIVE_INFINITY, 0],
    [0, Number.NEGATIVE_INFINITY],
  ])('Should reject invalid seed words: %j', (...seed) => {
    expect(() => splitmix64(seed as unknown as Seed64)).toThrow(RangeError);
  });
});
