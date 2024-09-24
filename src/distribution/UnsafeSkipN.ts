import { RandomGenerator } from '../types/RandomGenerator';

export function unsafeSkipN(rng: RandomGenerator, num: number): void {
  for (let idx = 0; idx != num; ++idx) {
    rng.unsafeNext();
  }
}
