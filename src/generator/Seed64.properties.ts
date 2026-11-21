import { expect } from 'vitest';
import * as fc from 'fast-check';

import type { Seed64 } from '../types/Seed64';
import type { RandomGenerator } from '../types/RandomGenerator';
import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';
import { generateN } from '../utils/generateN';
import { skipN } from '../utils/skipN';

const seed64 = fc.tuple(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 0, max: 0xffffffff }));

export function sameSeed64SameSequences(create: (seed: Seed64) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(seed64, fc.nat(256), (seed, offset) => {
    const first = create(seed);
    const second = create([seed[0], seed[1]]);
    skipN(first, offset);
    skipN(second, offset);
    expect(generateN(first, 20)).toEqual(generateN(second, 20));
  });
}

export function cloneAndRestoreSeed64(
  create: (seed: Seed64) => RandomGenerator,
  restore: (state: readonly number[]) => RandomGenerator,
): fc.IProperty<unknown> {
  return fc.property(seed64, fc.nat(256), (seed, offset) => {
    const original = create(seed);
    skipN(original, offset);
    const clone = original.clone();
    const restored = restore(original.getState());
    const originalState = original.getState();
    const expected = generateN(original, 20);
    expect(clone.getState()).toEqual(originalState);
    expect(restored.getState()).toEqual(originalState);
    expect(generateN(clone, 20)).toEqual(expected);
    expect(generateN(restored, 20)).toEqual(expected);
    for (const value of expected) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(-0x80000000);
      expect(value).toBeLessThanOrEqual(0x7fffffff);
    }
  });
}

export function seed64NoOrderNextJump(create: (seed: Seed64) => JumpableRandomGenerator): fc.IProperty<unknown> {
  return fc.property(seed64, fc.nat(32), (seed, offset) => {
    const first = create(seed);
    const second = create(seed);
    skipN(first, offset);
    first.jump();
    second.jump();
    skipN(second, offset);
    expect(first.getState()).toEqual(second.getState());
    expect(first.next()).toBe(second.next());
  });
}

export function doesNotRetainSeed64(create: (seed: Seed64) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(seed64, (seed) => {
    const before = [seed[0], seed[1]];
    const original = create(seed);
    const reference = create([seed[0], seed[1]]);
    expect(seed).toEqual(before);
    seed[0] ^= 0x7fffffff;
    seed[1] ^= 0x7fffffff;
    expect(generateN(original, 20)).toEqual(generateN(reference, 20));
  });
}
