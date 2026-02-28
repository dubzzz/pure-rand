import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import { uniformInt } from './uniformInt';
import type { RandomGenerator } from '../types/RandomGenerator';

import * as uniformIntInternalMock from './internals/uniformIntInternal';
import * as uniformArrayIntInternalMock from './internals/uniformArrayIntInternal';
vi.mock('./internals/uniformIntInternal');
vi.mock('./internals/uniformArrayIntInternal');

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
  vi.resetAllMocks();
  vi.clearAllMocks();
}

beforeEach(clean);
describe('uniformInt', () => {
  describe('Small ranges (<= 2**32)', () => {
    it('Should call uniformIntInternal with correct size of range and source rng', () =>
      fc.assert(
        fc
          .property(settingsArbitrary, (settings) => {
            // Arrange
            const { from, to, rng, uniformIntInternal } = mockInternals(settings);

            // Act
            uniformInt(rng, from, to);

            // Assert
            expect(uniformIntInternal).toHaveBeenCalledTimes(1);
            expect(uniformIntInternal).toHaveBeenCalledWith(rng, to - from + 1);
          })
          .beforeEach(clean),
      ));

    it('Should offset by "from" the value produced by uniformIntInternal', () =>
      fc.assert(
        fc
          .property(settingsArbitrary, (settings) => {
            // Arrange
            const { from, to, rng, outputs } = mockInternals(settings);

            // Act
            const v = uniformInt(rng, from, to);

            // Assert
            expect(v).toBe(outputs[0] + from);
          })
          .beforeEach(clean),
      ));
  });

  describe('Large ranges (> 2**32)', () => {
    it('Should call uniformIntInternal with correct size of range and source rng', () =>
      fc.assert(
        fc
          .property(settingsLargeArbitrary, (settings) => {
            // Arrange
            const { from, to, rng, uniformArrayIntInternal } = mockLargeInternals(settings);

            // Act
            uniformInt(rng, from, to);

            // Assert
            expect(uniformArrayIntInternal).toHaveBeenCalledTimes(1);
            expect(uniformArrayIntInternal).toHaveBeenCalledWith(rng, expect.any(Array), expect.any(Array));
            const params = uniformArrayIntInternal.mock.calls[0];
            const rangeSize = params[2];
            expect(rangeSize[0] * 2 ** 32 + rangeSize[1]).toBe(to - from + 1);
          })
          .beforeEach(clean),
      ));

    it('Should offset by "from" the value produced by uniformIntInternal', () =>
      fc.assert(
        fc
          .property(settingsLargeArbitrary, (settings) => {
            // Arrange
            const { from, to, rng, outputs } = mockLargeInternals(settings);

            // Act
            const v = uniformInt(rng, from, to);

            // Assert
            expect(v).toBe(outputs[0][0] * 2 ** 32 + outputs[0][1] + from);
          })
          .beforeEach(clean),
      ));
  });
});

// Helpers

const settingsArbitrary = fc
  .record({
    from: fc.maxSafeInteger(),
    gap: fc.integer({ min: 0, max: 0xffffffff }),
    rangeRandom: fc.noShrink(fc.nat()),
    ctx: fc.context(),
  })
  .filter(({ from, gap }) => Number.isSafeInteger(from + gap));

type SettingsType = typeof settingsArbitrary extends fc.Arbitrary<infer U> ? U : never;

function mockInternals(settings: SettingsType) {
  const { uniformIntInternal } = vi.mocked(uniformIntInternalMock);

  const { from, gap, rangeRandom, ctx } = settings;
  const to = from + gap;
  const clonedRng = buildUniqueRng();
  const rng = buildUniqueRng(clonedRng);
  const outputs: number[] = [];
  uniformIntInternal.mockImplementation((_rng, rangeSize) => {
    const out = rangeRandom % rangeSize;
    ctx.log(`uniformIntInternal(${rangeSize}) -> ${out}`);
    outputs.push(out);
    return out;
  });

  return { from, to, rng, clonedRng, outputs, uniformIntInternal };
}

const settingsLargeArbitrary = fc
  .record({
    from: fc.maxSafeInteger(),
    gap: fc.integer({ min: 0x100000000, max: Number.MAX_SAFE_INTEGER }),
    rangeRandom: fc.noShrink(fc.nat()),
    ctx: fc.context(),
  })
  .filter(({ from, gap }) => Number.isSafeInteger(from + gap));

type SettingsLargeType = typeof settingsLargeArbitrary extends fc.Arbitrary<infer U> ? U : never;

function mockLargeInternals(settings: SettingsLargeType) {
  const { uniformArrayIntInternal } = vi.mocked(uniformArrayIntInternalMock);

  const { from, gap, rangeRandom, ctx } = settings;
  const to = from + gap;
  const rng = buildUniqueRng();
  const outputs: number[][] = [];
  uniformArrayIntInternal.mockImplementation((_rng, rangeSize) => {
    const out = rangeSize.map((r) => rangeRandom % (r || 1));
    ctx.log(`uniformArrayIntInternal(${JSON.stringify(rangeSize)}) -> ${JSON.stringify(out)}`);
    outputs.push(out);
    return out;
  });

  return { from, to, rng, outputs, uniformArrayIntInternal };
}
