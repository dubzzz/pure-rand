import * as fc from 'fast-check';
import { mocked } from 'ts-jest/utils';

import { uniformIntDistribution } from '../../../src/distribution/UniformIntDistribution';
import { RandomGenerator } from '../../../src/generator/RandomGenerator';

import * as UnsafeUniformIntDistributionInternalMock from '../../../src/distribution/internals/UnsafeUniformIntDistributionInternal';
import * as UnsafeUniformArrayIntDistributionInternalMock from '../../../src/distribution/internals/UnsafeUniformArrayIntDistributionInternal';
jest.mock('../../../src/distribution/internals/UnsafeUniformIntDistributionInternal');
jest.mock('../../../src/distribution/internals/UnsafeUniformArrayIntDistributionInternal');

function buildUniqueRng(clonedRng?: RandomGenerator) {
  if (clonedRng !== undefined) {
    return {
      clone() {
        return clonedRng;
      },
    } as RandomGenerator;
  }
  return {} as RandomGenerator;
}
function clean() {
  jest.resetAllMocks();
  jest.clearAllMocks();
}

beforeEach(clean);
describe('uniformIntDistribution', () => {
  describe('Small ranges (<= 2**32)', () => {
    it('Should call unsafeUniformIntDistributionInternal with correct size of range and source rng', () =>
      fc.assert(
        fc
          .property(settingsArbitrary, (settings) => {
            // Arrange
            const { from, to, rng, clonedRng, unsafeUniformIntDistributionInternal } = mockInternals(settings);

            // Act
            uniformIntDistribution(from, to)(rng);

            // Assert
            expect(unsafeUniformIntDistributionInternal).toHaveBeenCalledTimes(1);
            expect(unsafeUniformIntDistributionInternal).toHaveBeenCalledWith(to - from + 1, clonedRng);
          })
          .beforeEach(clean)
      ));

    it('Should offset by "from" the value produced by unsafeUniformIntDistributionInternal', () =>
      fc.assert(
        fc
          .property(settingsArbitrary, (settings) => {
            // Arrange
            const { from, to, rng, outputs } = mockInternals(settings);

            // Act
            const [v, _nrng] = uniformIntDistribution(from, to)(rng);

            // Assert
            expect(v).toBe(outputs[0] + from);
          })
          .beforeEach(clean)
      ));
  });

  describe('Large ranges (> 2**32)', () => {
    it('Should call unsafeUniformIntDistributionInternal with correct size of range and source rng', () =>
      fc.assert(
        fc
          .property(settingsLargeArbitrary, (settings) => {
            // Arrange
            const { from, to, rng, clonedRng, unsafeUniformArrayIntDistributionInternal } =
              mockLargeInternals(settings);

            // Act
            uniformIntDistribution(from, to)(rng);

            // Assert
            expect(unsafeUniformArrayIntDistributionInternal).toHaveBeenCalledTimes(1);
            expect(unsafeUniformArrayIntDistributionInternal).toHaveBeenCalledWith(
              expect.any(Array),
              expect.any(Array),
              clonedRng
            );
            const params = unsafeUniformArrayIntDistributionInternal.mock.calls[0];
            const rangeSize = params[1];
            expect(rangeSize[0] * 2 ** 32 + rangeSize[1]).toBe(to - from + 1);
          })
          .beforeEach(clean)
      ));

    it('Should offset by "from" the value produced by unsafeUniformIntDistributionInternal', () =>
      fc.assert(
        fc
          .property(settingsLargeArbitrary, (settings) => {
            // Arrange
            const { from, to, rng, outputs } = mockLargeInternals(settings);

            // Act
            const [v, _nrng] = uniformIntDistribution(from, to)(rng);

            // Assert
            expect(v).toBe(outputs[0][0] * 2 ** 32 + outputs[0][1] + from);
          })
          .beforeEach(clean)
      ));
  });

  it('Should return the rng passed to unsafeUniformIntDistributionInternal', () =>
    fc.assert(
      fc
        .property(settingsArbitrary, (settings) => {
          // Arrange
          const { from, to, rng, clonedRng, outputs } = mockInternals(settings);

          // Act
          const [_v1, nrng] = uniformIntDistribution(from, to)(rng);

          // Assert
          expect(nrng).toBe(clonedRng);
        })
        .beforeEach(clean)
    ));

  it('Should be equivalent to call the 2-parameter and 3-parameter', () =>
    fc.assert(
      fc
        .property(settingsArbitrary, (settings) => {
          // Arrange
          const { from, to, rng } = mockInternals(settings);

          // Act
          const [v1, _nrng1] = uniformIntDistribution(from, to)(rng);
          const [v2, _nrng2] = uniformIntDistribution(from, to, rng);

          // Assert
          expect(v1).toBe(v2);
        })
        .beforeEach(clean)
    ));
});

// Helpers

const settingsArbitrary = fc
  .record(
    {
      from: fc.maxSafeInteger(),
      gap: fc.integer({ min: 0, max: 0xffffffff }),
      rangeRandom: fc.nat().noShrink(),
      ctx: fc.context(),
    },
    { withDeletedKeys: false }
  )
  .filter(({ from, gap }) => Number.isSafeInteger(from + gap));

type SettingsType = typeof settingsArbitrary extends fc.Arbitrary<infer U> ? U : never;

function mockInternals(settings: SettingsType) {
  const { unsafeUniformIntDistributionInternal } = mocked(UnsafeUniformIntDistributionInternalMock);

  const { from, gap, rangeRandom, ctx } = settings;
  const to = from + gap;
  const clonedRng = buildUniqueRng();
  const rng = buildUniqueRng(clonedRng);
  const outputs: number[] = [];
  unsafeUniformIntDistributionInternal.mockImplementation((rangeSize) => {
    const out = rangeRandom % rangeSize;
    ctx.log(`unsafeUniformIntDistributionInternal(${rangeSize}) -> ${out}`);
    outputs.push(out);
    return out;
  });

  return { from, to, rng, clonedRng, outputs, unsafeUniformIntDistributionInternal };
}

const settingsLargeArbitrary = fc
  .record(
    {
      from: fc.maxSafeInteger(),
      gap: fc.integer({ min: 0x100000000, max: Number.MAX_SAFE_INTEGER }),
      rangeRandom: fc.nat().noShrink(),
      ctx: fc.context(),
    },
    { withDeletedKeys: false }
  )
  .filter(({ from, gap }) => Number.isSafeInteger(from + gap));

type SettingsLargeType = typeof settingsLargeArbitrary extends fc.Arbitrary<infer U> ? U : never;

function mockLargeInternals(settings: SettingsLargeType) {
  const { unsafeUniformArrayIntDistributionInternal } = mocked(UnsafeUniformArrayIntDistributionInternalMock);

  const { from, gap, rangeRandom, ctx } = settings;
  const to = from + gap;
  const clonedRng = buildUniqueRng();
  const rng = buildUniqueRng(clonedRng);
  const outputs: number[][] = [];
  unsafeUniformArrayIntDistributionInternal.mockImplementation((rangeSize) => {
    const out = rangeSize.map((r) => rangeRandom % (r || 1));
    ctx.log(`unsafeUniformArrayIntDistributionInternal(${JSON.stringify(rangeSize)}) -> ${JSON.stringify(out)}`);
    outputs.push(out);
    return out;
  });

  return { from, to, rng, clonedRng, outputs, unsafeUniformArrayIntDistributionInternal };
}
