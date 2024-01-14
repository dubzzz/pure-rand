import * as fc from 'fast-check';
import { mocked } from '../../__test-helpers__/mocked';

import { uniformArrayIntDistribution } from '../../../src/distribution/UniformArrayIntDistribution';
import { RandomGenerator } from '../../../src/generator/RandomGenerator';

import * as UnsafeUniformArrayIntDistributionInternalMock from '../../../src/distribution/internals/UnsafeUniformArrayIntDistributionInternal';
import { ArrayInt } from '../../../src/distribution/internals/ArrayInt';
jest.mock('../../../src/distribution/internals/UnsafeUniformArrayIntDistributionInternal');

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
  jest.resetAllMocks();
  jest.clearAllMocks();
}

beforeEach(clean);
describe('uniformArrayIntDistribution', () => {
  // Skip next tests if BigInt is not supported
  if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

  it('Should call unsafeUniformArrayIntDistributionInternal with correct range and source rng', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { unsafeUniformArrayIntDistributionInternal, from, to } = mockInternals(a, b);
          const expectedRangeSize = arrayIntToBigInt(to) - arrayIntToBigInt(from) + BigInt(1);
          const expectedRng = buildUniqueRng();

          // Act
          uniformArrayIntDistribution(from, to, buildUniqueRng(expectedRng));

          // Assert
          const { rangeSize, rng } = extractParams(unsafeUniformArrayIntDistributionInternal);
          expect(arrayIntToBigInt({ sign: 1, data: rangeSize })).toBe(expectedRangeSize);
          expect(rng).toBe(expectedRng);
        })
        .beforeEach(clean),
    ));

  it('Should call unsafeUniformArrayIntDistributionInternal with non-empty range', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { unsafeUniformArrayIntDistributionInternal, from, to } = mockInternals(a, b);

          // Act
          uniformArrayIntDistribution(from, to, buildUniqueRng());

          // Assert
          const { rangeSize } = extractParams(unsafeUniformArrayIntDistributionInternal);
          expect(rangeSize.length).toBeGreaterThanOrEqual(1);
        })
        .beforeEach(clean),
    ));

  it('Should call unsafeUniformArrayIntDistributionInternal with trimmed range (no trailing zeros)', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { unsafeUniformArrayIntDistributionInternal, from, to } = mockInternals(a, b);

          // Act
          uniformArrayIntDistribution(from, to, buildUniqueRng());

          // Assert
          const { rangeSize } = extractParams(unsafeUniformArrayIntDistributionInternal);
          expect(rangeSize[0]).not.toBe(0); // rangeSize >= 1
        })
        .beforeEach(clean),
    ));

  it('Should call unsafeUniformArrayIntDistributionInternal with out having same length as range', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { unsafeUniformArrayIntDistributionInternal, from, to } = mockInternals(a, b);

          // Act
          uniformArrayIntDistribution(from, to, buildUniqueRng());

          // Assert
          const { out, rangeSize } = extractParams(unsafeUniformArrayIntDistributionInternal);
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
  let current = BigInt(0);
  for (let index = 0; index < arrayInt.data.length; ++index) {
    current <<= BigInt(32);
    current += BigInt(arrayInt.data[index]);
  }
  return current * BigInt(arrayInt.sign);
}

function mockInternals(a: ArrayInt, b: ArrayInt) {
  const { unsafeUniformArrayIntDistributionInternal } = mocked(UnsafeUniformArrayIntDistributionInternalMock);
  unsafeUniformArrayIntDistributionInternal.mockImplementation((out, _rangeSize, _rng) => out);
  const [from, to] = arrayIntToBigInt(a) < arrayIntToBigInt(b) ? [a, b] : [b, a];
  return { unsafeUniformArrayIntDistributionInternal, from, to };
}

function extractParams(
  unsafeUniformArrayIntDistributionInternal: ReturnType<
    typeof mockInternals
  >['unsafeUniformArrayIntDistributionInternal'],
) {
  expect(unsafeUniformArrayIntDistributionInternal).toHaveBeenCalledTimes(1);
  expect(unsafeUniformArrayIntDistributionInternal).toHaveBeenCalledWith(
    expect.any(Array),
    expect.any(Array),
    expect.anything(),
  );
  const params = unsafeUniformArrayIntDistributionInternal.mock.calls[0];
  const [out, rangeSize, rng] = params;
  return { out, rangeSize, rng };
}
