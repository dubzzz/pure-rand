import type { Seed64 } from '../types/Seed64';

/**
 * Parse exactly 16 hexadecimal digits into a 64-bit seed without losing precision.
 * Both lowercase and uppercase digits are accepted, without a `0x` prefix or whitespace.
 *
 * @param hex - The hexadecimal representation of the seed
 * @returns The unsigned high and low 32-bit words, in that order
 * @throws TypeError if the input is not exactly 16 hexadecimal digits
 *
 * @public
 */
export function seed64FromHex(hex: string): Seed64 {
  if (typeof hex !== 'string' || hex.length !== 16 || !/^[\da-f]{16}$/i.test(hex)) {
    throw new TypeError('seed64FromHex expects exactly 16 hexadecimal digits');
  }
  return [Number.parseInt(hex.slice(0, 8), 16), Number.parseInt(hex.slice(8), 16)];
}
