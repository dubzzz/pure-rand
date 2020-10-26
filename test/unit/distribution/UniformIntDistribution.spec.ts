import * as fc from 'fast-check';
import { mocked } from 'ts-jest/utils';

import { uniformIntDistribution } from '../../../src/distribution/UniformIntDistribution';
import RandomGenerator from '../../../src/generator/RandomGenerator';

import * as UniformIntDistributionInternalMock from '../../../src/distribution/internals/UniformIntDistributionInternal';
jest.mock('../../../src/distribution/internals/UniformIntDistributionInternal');

function buildUniqueRng() {
  return {} as RandomGenerator;
}
function clean() {
  jest.resetAllMocks();
  jest.clearAllMocks();
}

beforeEach(clean);
describe('uniformIntDistribution', () => {
  it('Should call uniformIntDistributionInternal with correct size of range and source rng', () =>
    fc.assert(
      fc
        .property(settingsArbitrary, (settings) => {
          // Arrange
          const { from, to, rng, uniformIntDistributionInternal } = mockInternals(settings);

          // Act
          uniformIntDistribution(from, to)(rng);

          // Assert
          expect(uniformIntDistributionInternal).toHaveBeenCalledTimes(1);
          expect(uniformIntDistributionInternal).toHaveBeenCalledWith(to - from + 1, rng);
        })
        .beforeEach(clean)
    ));

  it('Should offset by "from" the value produced by uniformIntDistributionInternal', () =>
    fc.assert(
      fc
        .property(settingsArbitrary, (settings) => {
          // Arrange
          const { from, to, rng, outputs } = mockInternals(settings);

          // Act
          const [v, _nrng] = uniformIntDistribution(from, to)(rng);

          // Assert
          expect(v).toBe(outputs[0][0] + from);
        })
        .beforeEach(clean)
    ));

  it('Should return the rng produced by uniformIntDistributionInternal', () =>
    fc.assert(
      fc
        .property(settingsArbitrary, (settings) => {
          // Arrange
          const { from, to, rng, outputs } = mockInternals(settings);

          // Act
          const [_v1, nrng] = uniformIntDistribution(from, to)(rng);

          // Assert
          expect(nrng).toBe(outputs[0][1]);
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

const settingsArbitrary = fc.record(
  {
    from: fc.integer(),
    gap: fc.integer({ min: 0, max: 0xffffffff }),
    rangeRandom: fc.integer({ min: 0, max: 0xffffffff }),
    ctx: fc.context(),
  },
  { withDeletedKeys: false }
);

type SettingsType = typeof settingsArbitrary extends fc.Arbitrary<infer U> ? U : never;

function mockInternals(settings: SettingsType) {
  const { uniformIntDistributionInternal } = mocked(UniformIntDistributionInternalMock);

  const { from, gap, rangeRandom, ctx } = settings;
  const to = from + gap;
  const rng = buildUniqueRng();
  const outputs: [number, RandomGenerator][] = [];
  uniformIntDistributionInternal.mockImplementation((rangeSize) => {
    const out = [rangeRandom % rangeSize, buildUniqueRng()] as [number, RandomGenerator];
    ctx.log(`uniformIntDistributionInternal(${rangeSize}) -> [${out[0]}, <rng>]`);
    outputs.push([...out]); // we clone it, nothing forbid caller to mutate it
    return out;
  });

  return { from, to, rng, outputs, uniformIntDistributionInternal };
}
