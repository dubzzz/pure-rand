import type { Seed64 } from '../../types/Seed64';
import { assertSeed64 } from './assertSeed64';

/**
 * SplitMix64, used only to initialize generator state from a 64-bit seed.
 * https://prng.di.unimi.it/splitmix64.c
 *
 * Uses two 32-bit words so initialization does not require BigInt arithmetic.
 * Each call returns the next unsigned high/low pair. The caller's seed is not mutated.
 * @internal
 */
export function splitmix64(seed: Seed64): () => Seed64 {
  assertSeed64(seed);
  let high = seed[0];
  let low = seed[1];
  return () => {
    const nextLow = low + 0x7f4a7c15;
    high = (high + 0x9e3779b9 + (nextLow > 0xffffffff ? 1 : 0)) >>> 0;
    low = nextLow >>> 0;

    let mixedHigh = high;
    let mixedLow = low;
    mixedLow = (mixedLow ^ (mixedLow >>> 30) ^ (mixedHigh << 2)) >>> 0;
    mixedHigh ^= mixedHigh >>> 30;
    [mixedHigh, mixedLow] = multiply64(mixedHigh, mixedLow, 0xbf58476d, 0x1ce4e5b9);
    mixedLow = (mixedLow ^ (mixedLow >>> 27) ^ (mixedHigh << 5)) >>> 0;
    mixedHigh ^= mixedHigh >>> 27;
    [mixedHigh, mixedLow] = multiply64(mixedHigh, mixedLow, 0x94d049bb, 0x133111eb);
    return [(mixedHigh ^ (mixedHigh >>> 31)) >>> 0, (mixedLow ^ (mixedLow >>> 31) ^ (mixedHigh << 1)) >>> 0];
  };
}

function multiply64(high: number, low: number, factorHigh: number, factorLow: number): Seed64 {
  // Exact upper half of low * factorLow, computed from 16-bit parts.
  const low0 = low & 0xffff;
  const low1 = low >>> 16;
  const factor0 = factorLow & 0xffff;
  const factor1 = factorLow >>> 16;
  const middle = low1 * factor0 + ((low0 * factor0) >>> 16);
  const middle2 = low0 * factor1 + (middle & 0xffff);
  const carry = low1 * factor1 + (middle >>> 16) + (middle2 >>> 16);
  return [(carry + Math.imul(high, factorLow) + Math.imul(low, factorHigh)) >>> 0, Math.imul(low, factorLow) >>> 0];
}
