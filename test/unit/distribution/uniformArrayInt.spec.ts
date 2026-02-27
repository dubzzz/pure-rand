import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import { uniformArrayInt } from '../../../src/distribution/uniformArrayInt';
import type { RandomGenerator } from '../../../src/types/RandomGenerator';

import * as uniformArrayIntInternalMock from '../../../src/distribution/internals/uniformArrayIntInternal';
import type { ArrayInt } from '../../../src/distribution/internals/ArrayInt';
vi.mock('../../../src/distribution/internals/uniformArrayIntInternal');

function buildUniqueRng(clonedRng?: RandomGenerator): RandomGenerator {
  return {
    clone() {
      if (clonedRng !== undefined) {
        return clonedRng;
      }
      return buildUniqueRng();
    },
  } as RandomGenerator;
}
function clean() {
  vi.resetAllMocks();
  vi.clearAllMocks();
}

beforeEach(clean);
describe('uniformArrayInt', () => {
  // Skip next tests if BigInt is not supported
  if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

  it('Should call uniformArrayIntInternal with correct range and source rng', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { uniformArrayIntInternal, from, to } = mockInternals(a, b);
          const expectedRangeSize = arrayIntToBigInt(to) - arrayIntToBigInt(from) + 1n;
          const clonedRng = buildUniqueRng();

          // Act
          uniformArrayInt(buildUniqueRng(clonedRng), from, to);

          // Assert
          const { rangeSize, rng } = extractParams(uniformArrayIntInternal);
          expect(arrayIntToBigInt({ sign: 1, data: rangeSize })).toBe(expectedRangeSize);
          expect(rng).toBe(rng); // no clone expected
          expect(rng).not.toBe(clonedRng); // no clone expected
        })
        .beforeEach(clean),
    ));

  it('Should call uniformArrayIntInternal with non-empty range', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { uniformArrayIntInternal, from, to } = mockInternals(a, b);

          // Act
          uniformArrayInt(buildUniqueRng(), from, to);

          // Assert
          const { rangeSize } = extractParams(uniformArrayIntInternal);
          expect(rangeSize.length).toBeGreaterThanOrEqual(1);
        })
        .beforeEach(clean),
    ));

  it('Should call uniformArrayIntInternal with trimmed range (no trailing zeros)', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { uniformArrayIntInternal, from, to } = mockInternals(a, b);

          // Act
          uniformArrayInt(buildUniqueRng(), from, to);

          // Assert
          const { rangeSize } = extractParams(uniformArrayIntInternal);
          expect(rangeSize[0]).not.toBe(0); // rangeSize >= 1
        })
        .beforeEach(clean),
    ));

  it('Should call uniformArrayIntInternal with out having same length as range', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { uniformArrayIntInternal, from, to } = mockInternals(a, b);

          // Act
          uniformArrayInt(buildUniqueRng(), from, to);

          // Assert
          const { out, rangeSize } = extractParams(uniformArrayIntInternal);
          expect(out).toHaveLength(rangeSize.length);
        })
        .beforeEach(clean),
    ));
});

// Helpers

const arrayIntArb = () =>
  fc.record({
    sign: fc.constantFrom(1 as const, -1 as const),
    data: fc.array(fc.integer({ min: 0, max: 0xffffffff })),
  });

function arrayIntToBigInt(arrayInt: ArrayInt): bigint {
  let current = 0n;
  for (let index = 0; index < arrayInt.data.length; ++index) {
    current <<= 32n;
    current += BigInt(arrayInt.data[index]);
  }
  return current * BigInt(arrayInt.sign);
}

function mockInternals(a: ArrayInt, b: ArrayInt) {
  const { uniformArrayIntInternal } = vi.mocked(uniformArrayIntInternalMock);
  uniformArrayIntInternal.mockImplementation((_rng, out, _rangeSize) => out);
  const [from, to] = arrayIntToBigInt(a) < arrayIntToBigInt(b) ? [a, b] : [b, a];
  return { uniformArrayIntInternal, from, to };
}

function extractParams(uniformArrayIntInternal: ReturnType<typeof mockInternals>['uniformArrayIntInternal']) {
  expect(uniformArrayIntInternal).toHaveBeenCalledTimes(1);
  expect(uniformArrayIntInternal).toHaveBeenCalledWith(expect.anything(), expect.any(Array), expect.any(Array));
  const params = uniformArrayIntInternal.mock.calls[0];
  const [rng, out, rangeSize] = params;
  return { out, rangeSize, rng };
}
