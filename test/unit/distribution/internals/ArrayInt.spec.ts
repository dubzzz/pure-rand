import * as fc from 'fast-check';

import {
  ArrayInt,
  ArrayInt64,
  fromNumberToArrayInt64,
  substractArrayInt64,
} from '../../../../src/distribution/internals/ArrayInt';

describe('ArrayInt', () => {
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
    if (typeof BigInt === 'undefined') {
      it('no test', () => {
        expect(true).toBe(true);
      });
      return;
    }
    if (typeof BigInt !== 'undefined') {
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
    }
  });
});

// Helpers

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
