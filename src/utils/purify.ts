import type { RandomGenerator } from '../types/RandomGenerator';

/**
 * Transform an operation on a RandomGenerator into a pure version of it
 * @param action - The transform operation to make pure
 */
export function purify<TArgs extends unknown[], TReturn, TRandomGenerator extends RandomGenerator>(
  action: (rng: TRandomGenerator, ...args: TArgs) => TReturn,
): (rng: TRandomGenerator, ...args: TArgs) => [TReturn, TRandomGenerator] {
  return (rng, ...args) => {
    const clonedRng = rng.clone();
    const out = action(clonedRng, ...args);
    return [out, clonedRng];
  };
}
