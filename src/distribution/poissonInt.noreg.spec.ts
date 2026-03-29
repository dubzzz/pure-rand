import { describe, it, expect } from 'vitest';
import { poissonInt } from './poissonInt';
import { mersenne } from '../generator/mersenne';
import type { RandomGenerator } from '../types/RandomGenerator';

describe('poissonInt [non regression]', () => {
  it('Should not change its output except for major bumps', () => {
    // Remark:
    // ========================
    // This test is purely there to ensure that we do not introduce any regression
    // during a commit without noticing it.
    // The values we expect in the output are just a snapshot taken at a certain time
    // in the past. They might be wrong values with bugs.

    const rng: RandomGenerator = mersenne(0);
    const values: number[] = [];
    for (let idx = 0; idx !== 10; ++idx) {
      const v = poissonInt(rng, 5);
      values.push(v);
    }
    expect(values).toMatchSnapshot();
  });
});
