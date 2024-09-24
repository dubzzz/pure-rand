import * as fc from 'fast-check';

import {
  addArrayIntToNew,
  addOneToPositiveArrayInt,
  ArrayInt,
  substractArrayIntToNew,
  trimArrayIntInplace,
} from '../../../../src/distribution/internals/ArrayInt';

describe('ArrayInt', () => {
  describe('addArrayIntToNew', () => {
    // Skip next tests if BigInt is not supported
    if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

    it('Should properly compute a plus b', () =>
      fc.assert(
        fc.property(arrayIntArb(), arrayIntArb(), (a, b) => {
          const r = addArrayIntToNew(a, b);
          expect(arrayIntToBigInt(r)).toEqual(arrayIntToBigInt(a) + arrayIntToBigInt(b));
        }),
      ));
  });

  describe('addOneToPositiveArrayInt', () => {
    // Skip next tests if BigInt is not supported
    if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

    it('Should properly compute a plus 1', () =>
      fc.assert(
        fc.property(arrayIntArb(), (a) => {
          fc.pre(a.sign === 1);
          const r = { sign: a.sign, data: a.data.slice(0) };
          addOneToPositiveArrayInt(r);
          expect(arrayIntToBigInt(r)).toEqual(arrayIntToBigInt(a) + BigInt(1));
        }),
      ));
  });

  describe('substractArrayIntToNew', () => {
    // Skip next tests if BigInt is not supported
    if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

    it('Should properly compute a minus b', () =>
      fc.assert(
        fc.property(arrayIntArb(), arrayIntArb(), (a, b) => {
          const r = substractArrayIntToNew(a, b);
          expect(arrayIntToBigInt(r)).toEqual(arrayIntToBigInt(a) - arrayIntToBigInt(b));
        }),
      ));
  });

  describe('trimArrayIntInplace', () => {
    it.each`
      zero
      ${{ sign: 1, data: [] }}
      ${{ sign: 1, data: [0] }}
      ${{ sign: 1, data: [0, 0, 0, 0, 0] }}
      ${{ sign: -1, data: [] }}
      ${{ sign: -1, data: [0] }}
      ${{ sign: -1, data: [0, 0, 0, 0, 0] }}
    `('Should build a unique representation for zero (including $zero}', ({ zero }) =>
      expect(trimArrayIntInplace(zero)).toEqual({ sign: 1, data: [0] }),
    );

    // Skip next tests if BigInt is not supported
    if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

    it('Should trim leading zeros but preserve the value', () =>
      fc.assert(
        fc.property(arrayIntArb(), (a) => {
          const originalValue = arrayIntToBigInt(a);
          const r = trimArrayIntInplace(a);
          expect(r).toBe(a);
          expect(r.data).not.toHaveLength(0);
          if (r.data.length !== 1) {
            expect(r.data[0]).not.toBe(0);
          }
          expect(arrayIntToBigInt(r)).toEqual(originalValue);
        }),
      ));
  });
});

// Helpers

const arrayIntArb = () =>
  fc.record({
    sign: fc.constantFrom(1 as const, -1 as const),
    data: fc.array(fc.integer({ min: 0, max: 0xffffffff })),
  });

function arrayIntToBigInt(arrayInt: ArrayInt): bigint {
  let current = BigInt(0);
  for (let index = 0; index < arrayInt.data.length; ++index) {
    current <<= BigInt(32);
    current += BigInt(arrayInt.data[index]);
  }
  return current * BigInt(arrayInt.sign);
}
