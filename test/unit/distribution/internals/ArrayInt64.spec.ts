import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { fromNumberToArrayInt64, substractArrayInt64 } from '../../../../src/distribution/internals/ArrayInt64';
import type { ArrayInt64 } from '../../../../src/distribution/internals/ArrayInt64';

describe('ArrayInt64', () => {
  describe('fromNumberToArrayInt64', () => {
    it('Should be able to convert any 32 bits positive integer to an ArrayInt64', () =>
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 0xffffffff }), (value) => {
          const arrayInt = fromNumberToArrayInt64(arrayInt64Buffer(), value);
          expect(arrayInt).toEqual({ sign: 1, data: [0, value] });
        }),
      ));

    it('Should be able to convert any 32 bits negative integer to an ArrayInt64', () =>
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 0xffffffff }), (value) => {
          const arrayInt = fromNumberToArrayInt64(arrayInt64Buffer(), -value);
          expect(arrayInt).toEqual({ sign: -1, data: [0, value] });
        }),
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
        }),
      ));

    it('Should be able to read back itself using toNumber', () =>
      fc.assert(
        fc.property(fc.maxSafeInteger(), (value) => {
          const arrayInt = fromNumberToArrayInt64(arrayInt64Buffer(), value);
          expect(toNumber(arrayInt)).toBe(value);
        }),
      ));
  });

  describe('substractArrayInt64', () => {
    // Skip next tests if BigInt is not supported
    if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

    const fromBigIntToArrayInt64 = (n: bigint): ArrayInt64 => {
      const posN = n < 0n ? -n : n;
      return {
        sign: n < 0n ? -1 : 1,
        data: [Number(posN >> 32n), Number(posN % (1n << 32n))],
      };
    };

    it('Should be able to substract two non-overflowing ArrayInt64', () =>
      fc.assert(
        fc.property(bigInt64(), bigInt64(), (a, b) => {
          const min = a < b ? a : b;
          const max = a < b ? b : a;
          const result = max - min;
          fc.pre(result < 1n << 64n);

          const minArrayInt = fromBigIntToArrayInt64(min);
          const maxArrayInt = fromBigIntToArrayInt64(max);
          const resultArrayInt = fromBigIntToArrayInt64(result);
          expect(substractArrayInt64(arrayInt64Buffer(), maxArrayInt, minArrayInt)).toEqual(resultArrayInt);
        }),
      ));
  });
});

// Helpers

function arrayInt64Buffer(): ArrayInt64 {
  return { sign: 1, data: [0, 0] };
}

function toNumber(arrayInt: ArrayInt64): number {
  let current = arrayInt.data[0];
  const arrayIntLength = arrayInt.data.length;
  for (let index = 1; index < arrayIntLength; ++index) {
    current *= 0x100000000;
    current += arrayInt.data[index];
  }
  return current * (arrayInt.sign || 1);
}

function bigInt64() {
  // @ts-ignore
  return fc.bigInt({ min: -(1n << 63n), max: (1n << 63n) - 1n });
}
