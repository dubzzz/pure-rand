import type { Seed64 } from '../../types/Seed64';

/** @internal */
export function assertSeed64(seed: Seed64): void {
  if (
    !Array.isArray(seed) ||
    seed.length !== 2 ||
    !Number.isInteger(seed[0]) ||
    seed[0] < 0 ||
    seed[0] > 0xffffffff ||
    !Number.isInteger(seed[1]) ||
    seed[1] < 0 ||
    seed[1] > 0xffffffff
  ) {
    throw new RangeError('Seed64 must contain two unsigned 32-bit integers in high/low order');
  }
}
