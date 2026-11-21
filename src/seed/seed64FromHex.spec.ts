import { describe, it, expect, expectTypeOf } from 'vitest';
import * as fc from 'fast-check';

import type { Seed64 } from '../types/Seed64';
import { seed64FromHex } from './seed64FromHex';

describe('seed64FromHex', () => {
  it.each([
    ['0000000000000000', [0, 0]],
    ['0000000000000001', [0, 1]],
    ['0000000100000000', [1, 0]],
    ['0123456789abcdef', [0x01234567, 0x89abcdef]],
    ['0123456789ABCDEF', [0x01234567, 0x89abcdef]],
    ['0020000000000001', [0x00200000, 1]],
    ['8000000080000000', [0x80000000, 0x80000000]],
    ['ffffffffffffffff', [0xffffffff, 0xffffffff]],
  ])('Should parse %s into unsigned words in high/low order', (hex, expected) => {
    expect(seed64FromHex(hex)).toEqual(expected);
  });

  it('Should preserve all 64 bits', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: (1n << 64n) - 1n }), (value) => {
        const [high, low] = seed64FromHex(value.toString(16).padStart(16, '0'));
        expect((BigInt(high) << 32n) | BigInt(low)).toBe(value);
      }),
    );
  });

  it.each([
    '',
    '0',
    '0123456789abcde',
    '0123456789abcdef0',
    '0x0123456789abcdef',
    '0X0123456789ABCDEF',
    '+123456789abcdef',
    '-123456789abcdef',
    '01234567_89abcde',
    '0123456789abcdeg',
    ' 0123456789abcdef',
    '0123456789abcdef ',
    '0123456789abcdef\n',
    '0123456789abcdef\r\n',
    '０１２３４５６７８９ａｂｃｄｅｆ',
  ])('Should reject invalid seed %j', (hex) => {
    expect(() => seed64FromHex(hex)).toThrow(TypeError);
  });

  it.each([undefined, null, 1234567890123456, 1234567890123456n, ['0123456789abcdef']])(
    'Should reject non-string input %s',
    (input) => {
      // @ts-expect-error - Invalid runtime input
      expect(() => seed64FromHex(input)).toThrow(TypeError);
    },
  );

  it('Should return a readonly Seed64', () => {
    expectTypeOf(seed64FromHex('0000000000000000')).toEqualTypeOf<Seed64>();
    expectTypeOf<Seed64>().toEqualTypeOf<readonly [high: number, low: number]>();
  });
});
