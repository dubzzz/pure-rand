import * as fc from 'fast-check';
import { mocked } from 'ts-jest/utils';

import { uniformArrayIntDistribution } from '../../../src/distribution/UniformArrayIntDistribution';
import RandomGenerator from '../../../src/generator/RandomGenerator';

import * as UniformArrayIntDistributionInternalMock from '../../../src/distribution/internals/UniformArrayIntDistributionInternal';
import { ArrayInt } from '../../../src/distribution/internals/ArrayInt';
jest.mock('../../../src/distribution/internals/UniformArrayIntDistributionInternal');

function buildUniqueRng() {
  return {} as RandomGenerator;
}
function clean() {
  jest.resetAllMocks();
  jest.clearAllMocks();
}

beforeEach(clean);
describe('uniformArrayIntDistribution', () => {
  // Skip next tests if BigInt is not supported
  if (typeof BigInt === 'undefined') return it('no test', () => expect(true).toBe(true));

  it('Should call uniformIntDistributionInternal with correct size of range and source rng', () =>
    fc.assert(
      fc
        .property(arrayIntArb(), arrayIntArb(), (a, b) => {
          // Arrange
          const { uniformArrayIntDistributionInternal } = mocked(UniformArrayIntDistributionInternalMock);
          uniformArrayIntDistributionInternal.mockImplementation((out, _rangeSize, rng) => [out, rng]);
          const [from, to] = arrayIntToBigInt(a) < arrayIntToBigInt(b) ? [a, b] : [b, a];
          const rng = buildUniqueRng();
          const expectedRangeSize = arrayIntToBigInt(to) - arrayIntToBigInt(from) + BigInt(1);

          // Act
          uniformArrayIntDistribution(from, to, rng);

          // Assert
          expect(uniformArrayIntDistributionInternal).toHaveBeenCalledTimes(1);
          expect(uniformArrayIntDistributionInternal).toHaveBeenCalledWith(expect.any(Array), expect.any(Array), rng);
          const params = uniformArrayIntDistributionInternal.mock.calls[0];
          const rangeSize = params[1];
          expect(arrayIntToBigInt({ sign: 1, data: rangeSize })).toBe(expectedRangeSize);
        })
        .beforeEach(clean)
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

//const { uniformArrayIntDistributionInternal } = mocked(UniformArrayIntDistributionInternalMock)
