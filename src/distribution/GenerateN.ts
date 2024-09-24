import type { RandomGenerator } from '../types/RandomGenerator';
import { unsafeGenerateN } from './UnsafeGenerateN';

export function generateN(rng: RandomGenerator, num: number): [number[], RandomGenerator] {
  const nextRng = rng.clone();
  const out = unsafeGenerateN(nextRng, num);
  return [out, nextRng];
}
