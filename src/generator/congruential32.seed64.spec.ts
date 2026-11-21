import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import type { Seed64 } from '../types/Seed64';
import { seed64FromHex } from '../seed/seed64FromHex';
import { congruential32, congruential32FromState } from './congruential32';
import * as p from './Seed64.properties';
import { generateN } from '../utils/generateN';

describe('congruential32 with Seed64', () => {
  it.each([
    [
      '0000000000000000',
      [109269475, 2791705491, 3120036182, 2957506238, 3796824275, 3657874736, 3778856133, 995472702],
    ],
    [
      '0000000000000001',
      [1307820911, 4116774992, 1058592395, 2927883302, 1018530340, 3137650105, 1329830458, 3261990718],
    ],
    [
      '0000000100000000',
      [3970725941, 1485466875, 715192332, 1645356757, 2595287958, 3769380989, 3579173551, 1214885758],
    ],
    [
      '0123456789abcdef',
      [772293834, 2870907281, 4119457438, 1366513749, 3394610203, 1718144599, 3561051322, 2781634130],
    ],
    [
      'ffffffffffffffff',
      [3742493664, 2955418534, 1406194735, 213722728, 3602680877, 670697594, 4283404666, 3114205201],
    ],
  ])('Should match the reference stream for seed=%s', (hex, expected) => {
    // Generated with the original splitmix64.c and a separate C implementation
    // performing three sequential LCG steps for each output.
    const rng = congruential32(seed64FromHex(hex));
    expect(generateN(rng, expected.length)).toEqual(expected.map((value) => value | 0));
  });

  it('Should initialize from the low word of the first SplitMix64 output', () => {
    expect(congruential32([0, 0]).getState()).toEqual([0x7b1dcdaf]);
  });

  it('Should use the high seed word', () => {
    const low = congruential32(seed64FromHex('0000000000000000'));
    const high = congruential32(seed64FromHex('0000000100000000'));
    expect(low.getState()).not.toEqual(high.getState());
  });

  it('Should use distinct initialization rules for numeric and Seed64 seeds', () => {
    expect(congruential32([0, 42]).getState()).not.toEqual(congruential32(42).getState());
  });

  it('Should reject invalid Seed64 words', () => {
    expect(() => congruential32([-1, 0])).toThrow(RangeError);
    expect(() => congruential32([0, 2 ** 32])).toThrow(RangeError);
    expect(() => congruential32([0, 0.5])).toThrow(RangeError);
    expect(() => congruential32([0] as unknown as Seed64)).toThrow(RangeError);
  });

  it('Should return the same sequence given the same seed', () => fc.assert(p.sameSeed64SameSequences(congruential32)));
  it('Should support cloning and state restoration', () =>
    fc.assert(p.cloneAndRestoreSeed64(congruential32, congruential32FromState)));
  it('Should not depend on ordering between jump and next', () => fc.assert(p.seed64NoOrderNextJump(congruential32)));
  it('Should not mutate or retain the seed tuple', () => fc.assert(p.doesNotRetainSeed64(congruential32)));
});
