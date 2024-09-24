import type { RandomGenerator } from '../types/RandomGenerator';

export function unsafeGenerateN(rng: RandomGenerator, num: number): number[] {
  const out: number[] = [];
  for (let idx = 0; idx != num; ++idx) {
    out.push(rng.unsafeNext());
  }
  return out;
}
