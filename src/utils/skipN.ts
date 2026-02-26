import type { RandomGenerator } from '../types/RandomGenerator';

export function skipN(rng: RandomGenerator, num: number): void {
  for (let idx = 0; idx != num; ++idx) {
    rng.unsafeNext();
  }
}
