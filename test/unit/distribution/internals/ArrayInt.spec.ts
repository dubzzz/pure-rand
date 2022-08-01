import * as fc from 'fast-check';

import {
  addArrayIntToNew,
  addOneToPositiveArrayInt,
  ArrayInt,
  ArrayInt64,
  fromNumberToArrayInt64,
  substractArrayInt64,
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
        })
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
        })
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
        })
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
      expect(trimArrayIntInplace(zero)).toEqual({ sign: 1, data: [0] })
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
        })
      ));
  });

  describe('fromNumberToArrayInt64', () => {
    it('Should be able to convert any 32 bits positive integer to an ArrayInt64', () =>
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 0xffffffff }), (value) => {
          const arrayInt = fromNumberToArrayInt64(arrayInt64Buffer(), value);
          expect(arrayInt).toEqual({ sign: 1, data: [0, value] });
        })
      ));

    it('Should be able to convert any 32 bits negative integer to an ArrayInt64', () =>
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 0xffffffff }), (value) => {
          const arrayInt = fromNumberToArrayInt64(arrayInt64Buffer(), -value);
          expect(arrayInt).toEqual({ sign: -1, data: [0, value] });
        })
      ));

    it('Should be able to convert any safe integer to an ArrayInt64', () =>
      fc.assert(
        fc.property(fc.maxSafeInteger(), (value) => {
          const arrayInt = fromNumberToArrayInt64(arrayInt64Buffer(), value);

          expect(arrayInt.sign).toBe(value < 0 ? -1 : 1);
          expect(arrayInt.data).toHaveLength(2);

          const arrayIntHexaRepr =
            arrayInt.data[0].toString(16).padStart(8, '0') + arrayInt.data[1].toString(16).padStart(8, '0');
          const valueHexaRepr = Math.abs(value).toString(16).padStart(16, '0');
          expect(arrayIntHexaRepr).toBe(valueHexaRepr);
        })
      ));

    it('Should be able to read back itself using toNumber', () =>
      fc.assert(
        fc.property(fc.maxSafeInteger(), (value) => {
          const arrayInt = fromNumberToArrayInt64(arrayInt64Buffer(), value);
          expect(toNumber(arrayInt)).toBe(value);
        })
      ));
  });

  describe('substractArrayInt64', () => {
    // Skip next tests if BigInt is not supported
    if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

    const fromBigIntToArrayInt64 = (n: bigint): ArrayInt64 => {
      const posN = n < BigInt(0) ? -n : n;
      return {
        sign: n < BigInt(0) ? -1 : 1,
        data: [Number(posN >> BigInt(32)), Number(posN % (BigInt(1) << BigInt(32)))],
      };
    };

    it('Should be able to substract two non-overflowing ArrayInt64', () =>
      fc.assert(
        fc.property(fc.bigIntN(64), fc.bigIntN(64), (a, b) => {
          const min = a < b ? a : b;
          const max = a < b ? b : a;
          const result = max - min;
          fc.pre(result < BigInt(1) << BigInt(64));

          const minArrayInt = fromBigIntToArrayInt64(min);
          const maxArrayInt = fromBigIntToArrayInt64(max);
          const resultArrayInt = fromBigIntToArrayInt64(result);
          expect(substractArrayInt64(arrayInt64Buffer(), maxArrayInt, minArrayInt)).toEqual(resultArrayInt);
        })
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

function arrayInt64Buffer(): ArrayInt64 {
  return { sign: 1, data: [0, 0] };
}

function toNumber(arrayInt: ArrayInt): number {
  let current = arrayInt.data[0];
  const arrayIntLength = arrayInt.data.length;
  for (let index = 1; index < arrayIntLength; ++index) {
    current *= 0x100000000;
    current += arrayInt.data[index];
  }
  return current * (arrayInt.sign || 1);
}
