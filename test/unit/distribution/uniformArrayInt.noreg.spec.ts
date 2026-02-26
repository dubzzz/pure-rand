import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import { ArrayInt } from '../../../src/distribution/internals/ArrayInt';
import { uniformArrayInt } from '../../../src/distribution/uniformArrayInt';
import { mersenne } from '../../../src/generator/MersenneTwister';
import { RandomGenerator } from '../../../src/types/RandomGenerator';

describe('uniformArrayInt [non regression]', () => {
  it.each`
    from                                            | to                                                                     | topic
    ${{ sign: -1, data: [1] }}                      | ${{ sign: 1, data: [1] }}                                              | ${'3 states [-1, 0, 1]'}
    ${{ sign: -1, data: [2] }}                      | ${{ sign: 1, data: [1] }}                                              | ${'4 states [-2, -1, 0, 1]'}
    ${{ sign: -1, data: [0x80000000] }}             | ${{ sign: 1, data: [0x7fffffff] }}                                     | ${'32-bit signed'}
    ${{ sign: 1, data: [0x00000000] }}              | ${{ sign: 1, data: [0xffffffff] }}                                     | ${'32-bit unsigned'}
    ${{ sign: -1, data: [0x80000000, 0x00000000] }} | ${{ sign: 1, data: [0x7fffffff, 0xffffffff] }}                         | ${'64-bit signed'}
    ${{ sign: 1, data: [0x00000000, 0x00000000] }}  | ${{ sign: 1, data: [0xffffffff, 0xffffffff] }}                         | ${'64-bit unsigned'}
    ${{ sign: -1, data: [0x80000000, 0, 0, 0] }}    | ${{ sign: 1, data: [0x7fffffff, 0xffffffff, 0xffffffff, 0xffffffff] }} | ${'128-bit signed'}
    ${{ sign: 1, data: [0x12345678, 0x90abcdef] }}  | ${{ sign: 1, data: [0xfedcba09, 0x87654321] }}                         | ${'fuzzy'}
    ${{ sign: 1, data: [0, 0] }}                    | ${{ sign: 1, data: [0, 5] }}                                           | ${'trailing zeros'}
  `('Should not change its output in asked range except for major bumps ($topic)', ({ from, to }) => {
    // Remark:
    // ========================
    // This test is purely there to ensure that we do not introduce any regression
    // during a commit without noticing it.
    // The values we expect in the output are just a snapshot taken at a certain time
    // in the past. They might be wrong values with bugs.

    const rng: RandomGenerator = mersenne(0);
    const values: ArrayInt[] = [];
    for (let idx = 0; idx !== 10; ++idx) {
      const v = uniformArrayInt(rng, from, to);
      values.push(v);
    }
    expect(values).toMatchSnapshot();
  });

  // Skip next tests if BigInt is not supported
  if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

  it('Should always generate values within the range [from ; to]', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), arrayIntArb(), arrayIntArb(), (seed, a, b) => {
        const [from, to] = arrayIntToBigInt(a) < arrayIntToBigInt(b) ? [a, b] : [b, a];
        const v = uniformArrayInt(mersenne(seed), from, to);
        const vBigInt = arrayIntToBigInt(v);
        return vBigInt >= arrayIntToBigInt(from) && vBigInt <= arrayIntToBigInt(to);
      }),
    ));

  it('Should always trim the zeros from the resulting value', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), arrayIntArb(), arrayIntArb(), (seed, a, b) => {
        const [from, to] = arrayIntToBigInt(a) < arrayIntToBigInt(b) ? [a, b] : [b, a];
        const v = uniformArrayInt(mersenne(seed), from, to);
        expect(v.data).not.toHaveLength(0);
        if (v.data.length !== 1) {
          expect(v.data[0]).not.toBe(0); // do not start by zero when data has multiple values
        } else if (v.data[0] === 0) {
          expect(v.sign).toBe(1); // zero has sign=1
        }
      }),
    ));

  it('Should always produce valid ArrayInt', () =>
    fc.assert(
      fc.property(fc.noShrink(fc.integer()), arrayIntArb(), arrayIntArb(), (seed, a, b) => {
        const [from, to] = arrayIntToBigInt(a) < arrayIntToBigInt(b) ? [a, b] : [b, a];
        const v = uniformArrayInt(mersenne(seed), from, to);
        expect([-1, 1]).toContainEqual(v.sign); // sign is either 1 or -1
        expect(v.data).not.toHaveLength(0); // data is never empty
        for (const d of v.data) {
          // data in [0 ; 0xffffffff]
          expect(d).toBeGreaterThanOrEqual(0);
          expect(d).toBeLessThanOrEqual(0xffffffff);
        }
      }),
    ));
});

// Helpers

const arrayIntArb = () =>
  fc.record({
    sign: fc.constantFrom(1 as const, -1 as const),
    data: fc.array(fc.integer({ min: 0, max: 0xffffffff })),
  });

function arrayIntToBigInt(arrayInt: ArrayInt): bigint {
  let current = BigInt(0);
  for (let index = 0; index < arrayInt.data.length; ++index) {
    current <<= BigInt(32);
    current += BigInt(arrayInt.data[index]);
  }
  return current * BigInt(arrayInt.sign);
}
