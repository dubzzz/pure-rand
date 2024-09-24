import { RandomGenerator } from '../types/RandomGenerator';
import { unsafeSkipN } from './UnsafeSkipN';

export function skipN(rng: RandomGenerator, num: number): RandomGenerator {
  const nextRng = rng.clone();
  unsafeSkipN(nextRng, num);
  return nextRng;
}
