import { describe, expect, it, vi } from 'vitest';
import { purify } from '../../../src/utils/purify';
import type { RandomGenerator } from '../../../src/types/RandomGenerator';

describe('purify', () => {
  it('should not alter the original instance', () => {
    // Arrange
    const notImplemented = vi.fn();
    const clonedRng: RandomGenerator = {
      clone: notImplemented,
      getState: notImplemented,
      next: notImplemented,
      jump: notImplemented,
    };
    const rng: RandomGenerator = {
      clone: () => clonedRng,
      getState: notImplemented,
      next: notImplemented,
      jump: notImplemented,
    };
    const action = vi.fn<(rng: RandomGenerator, label: string, num: number) => string>(
      (_, label, num) => `${label}::${num}`,
    );

    // Act
    const pureAction = purify(action) satisfies (
      rng: RandomGenerator,
      label: string,
      num: number,
    ) => [string, RandomGenerator];
    const [out, outRng] = pureAction(rng, 'label', 10);

    // Assert
    expect(notImplemented).not.toHaveBeenCalled();
    expect(outRng).not.toBe(rng);
    expect(outRng).toBe(clonedRng);
    expect(out).toBe('label::10');
  });
});
