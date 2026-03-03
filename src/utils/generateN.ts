import type { RandomGenerator } from '../types/RandomGenerator';

export function generateN(rng: RandomGenerator, num: number): number[] {
  const out = new Array<number>(num);
  for (let idx = 0; idx !== num; ++idx) {
    out[idx] = rng.next();
  }
  return out;
}
