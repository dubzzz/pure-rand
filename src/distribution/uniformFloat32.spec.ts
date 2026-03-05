import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { uniformFloat32 } from './uniformFloat32';
import { mersenne } from '../generator/mersenne';

describe('uniformFloat32', () => {
  it('Should always generate values in [0, 1)', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), (seed) => {
        const rng = mersenne(seed);
        const v = uniformFloat32(rng);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }),
    ));

  it('Should always generate values representable as 32-bit floats', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), (seed) => {
        const rng = mersenne(seed);
        const v = uniformFloat32(rng);
        const buf = new Float32Array(1);
        buf[0] = v;
        expect(buf[0]).toBe(v);
      }),
    ));
});
