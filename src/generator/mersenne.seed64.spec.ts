import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import type { Seed64 } from '../types/Seed64';
import { seed64FromHex } from '../seed/seed64FromHex';
import { generateN } from '../utils/generateN';
import { mersenne, mersenneFromState } from './mersenne';
import * as p from './Seed64.properties';

describe('mersenne with Seed64', () => {
  it.each([
    ['0000000000000000', [647325673, 1560931061, 839849605, 532981786, 710067128, 2299476654, 369570609, 2869776129]],
    ['0000000000000001', [577090037, 2444712010, 3639700191, 3445702192, 3280387012, 271041745, 1095513148, 506456969]],
    ['0000000100000000', [485306839, 1508871100, 1794561286, 4014597330, 71624475, 98019085, 2627323657, 3762791315]],
    [
      '0123456789abcdef',
      [3851240871, 1496727489, 1688815724, 1191980605, 3705741621, 2192682533, 832185011, 3194071721],
    ],
    ['ffffffffffffffff', [93740670, 1068495656, 1452108352, 2657516307, 910393425, 1958779474, 2641946051, 408097150]],
  ])('Should match the reference C stream for seed=%s', (hex, expected) => {
    // mt19937ar.c: init_by_array({ low, high }, 2), followed by genrand_int32().
    const rng = mersenne(seed64FromHex(hex));
    expect(generateN(rng, expected.length)).toEqual(expected.map((value) => value | 0));
  });

  it('Should match the reference across twist boundaries', () => {
    const values = generateN(mersenne(seed64FromHex('0123456789abcdef')), 1250);
    expect([623, 624, 625, 1247, 1248, 1249].map((index) => values[index])).toEqual(
      [2156762027, 2610737334, 2153897788, 3327008938, 73084301, 1211322482].map((value) => value | 0),
    );
  });

  it('Should use the high seed word', () => {
    expect(mersenne([1, 0]).getState()).not.toEqual(mersenne([0, 0]).getState());
  });

  it('Should use distinct initialization rules for numeric and Seed64 seeds', () => {
    expect(mersenne([0, 42]).getState()).not.toEqual(mersenne(42).getState());
  });

  it('Should reject invalid Seed64 words', () => {
    expect(() => mersenne([-1, 0])).toThrow(RangeError);
    expect(() => mersenne([0, 2 ** 32])).toThrow(RangeError);
    expect(() => mersenne([0, 0.5])).toThrow(RangeError);
    expect(() => mersenne([0] as unknown as Seed64)).toThrow(RangeError);
  });

  it('Should return the same sequence given the same seed', () => fc.assert(p.sameSeed64SameSequences(mersenne)));
  it('Should support cloning and state restoration', () =>
    fc.assert(p.cloneAndRestoreSeed64(mersenne, mersenneFromState)));
  it('Should not depend on ordering between jump and next', () =>
    fc.assert(p.seed64NoOrderNextJump(mersenne), { numRuns: 10 }));
  it('Should not mutate or retain the seed tuple', () => fc.assert(p.doesNotRetainSeed64(mersenne)));
});
