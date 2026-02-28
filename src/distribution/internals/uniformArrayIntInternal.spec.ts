import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import { uniformArrayIntInternal } from './uniformArrayIntInternal';
import type { ArrayInt } from './ArrayInt';
import type { RandomGenerator } from '../../types/RandomGenerator';

import * as uniformIntInternalMock from './uniformIntInternal';
vi.mock('./uniformIntInternal');

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
describe('uniformArrayIntInternal', () => {
  it.each`
    rangeSize             | resultingArrayInt     | description
    ${[10, 20, 30]}       | ${[1, 1, 1]}          | ${'all generated values are smaller'}
    ${[10, 20, 30]}       | ${[8, 520, 1000]}     | ${'some generated values are greater but resulting array is smaller'}
    ${[10, 20, 30]}       | ${[10, 20, 29]}       | ${'resulting array is rangeSize minus one'}
    ${[1]}                | ${[0]}                | ${'smallest possible rangeSize'}
    ${[0, 0, 1, 0, 1, 0]} | ${[0, 0, 1, 0, 0, 1]} | ${'rangeSize starting by and including zeros'}
  `('Should only call the rangeSize.length times when $description', ({ rangeSize, resultingArrayInt }) => {
    // Arrange
    const { uniformIntInternal } = vi.mocked(uniformIntInternalMock);
    const initialRng = buildUniqueRng();
    for (let idx = 0; idx !== resultingArrayInt.length; ++idx) {
      // In terms of calls, the expectedRangeSize is:
      //    [ rangeSize[0] + 1 , 0x1_00000000 , ... ]
      // In other words, we can generate (with the same probability) any number in:
      //    [ between 0 (inc) and rangeSize[0] (inc) , between 0 (inc) and 0xffffffff (inc) , ... ]
      // Values outside greater or equal to rangeSize will be rejected. We will retry until we get a valid value.
      const expectedRangeSize = idx === 0 ? rangeSize[0] + 1 : 0x100000000;
      const generatedItem = resultingArrayInt[idx];
      uniformIntInternal.mockImplementationOnce((rng, askedRangeSize) => {
        expect(askedRangeSize).toBe(expectedRangeSize);
        expect(rng).toBe(initialRng);
        return generatedItem;
      });
    }

    // Act
    const g = uniformArrayIntInternal(initialRng, arrayIntBuffer(rangeSize.length).data, rangeSize);

    // Assert
    expect(g).toEqual(resultingArrayInt);
    expect(uniformIntInternal).toHaveBeenCalledTimes(resultingArrayInt.length);
  });

  it.each`
    rangeSize       | rejections                                       | resultingArrayInt | description
    ${[10, 20, 30]} | ${[10, 20, 30]}                                  | ${[1, 1, 1]}      | ${'first generated value is the rangeSize itself'}
    ${[10, 20, 30]} | ${[10, 50, 0]}                                   | ${[1, 1, 1]}      | ${'first generated value is greater than the rangeSize due to middle item'}
    ${[10, 20, 30]} | ${[10, 20, 50]}                                  | ${[1, 1, 1]}      | ${'first generated value is greater than the rangeSize due to last item'}
    ${[10, 20, 30]} | ${[10, 100, 1000, 10, 100, 1000, 10, 100, 1000]} | ${[1, 1, 1]}      | ${'multiple rejections in a row'}
  `('Should retry until we get a valid value when $description', ({ rangeSize, rejections, resultingArrayInt }) => {
    // Arrange
    const { uniformIntInternal } = vi.mocked(uniformIntInternalMock);
    const initialRng = buildUniqueRng();
    for (let idx = 0; idx !== rejections.length; ++idx) {
      // Rq: We check on `idx % rangeSize.length === 0` as our surrent implementation does not quit earlier.
      //     It will generate a full value before rejecting it.
      const expectedRangeSize = idx % rangeSize.length === 0 ? rangeSize[0] + 1 : 0x100000000;
      const generatedItem = rejections[idx];
      uniformIntInternal.mockImplementationOnce((rng, askedRangeSize) => {
        expect(askedRangeSize).toBe(expectedRangeSize);
        expect(rng).toBe(initialRng);
        return generatedItem;
      });
    }
    for (let idx = 0; idx !== resultingArrayInt.length; ++idx) {
      const expectedRangeSize = idx === 0 ? rangeSize[0] + 1 : 0x100000000;
      const generatedItem = resultingArrayInt[idx];
      uniformIntInternal.mockImplementationOnce((rng, askedRangeSize) => {
        expect(askedRangeSize).toBe(expectedRangeSize);
        expect(rng).toBe(initialRng);
        return generatedItem;
      });
    }

    // Act
    const g = uniformArrayIntInternal(initialRng, arrayIntBuffer(rangeSize.length).data, rangeSize);

    // Assert
    expect(g).toEqual(resultingArrayInt);
    expect(uniformIntInternal).toHaveBeenCalledTimes(rejections.length + resultingArrayInt.length);
  });

  it('Should call uniformIntInternal until it produces a valid ArrayInt', () =>
    // Identical to the test above "Should retry until we get a valid value when $description" but with property based testing
    fc.assert(
      fc
        .property(
          fc
            .bigInt({ min: 1n })
            .chain((rangeSize) =>
              fc.record({
                rangeSize: fc.constant(rangeSize),
                rejectedValues: fc.array(fc.bigInt({ min: rangeSize })),
                validValue: fc.bigInt({ min: 0n, max: rangeSize - 1n }),
              }),
            )
            .map(({ rangeSize, rejectedValues, validValue }) => {
              let rangeSizeArrayIntData = fromBigUintToArrayIntData(rangeSize);
              let validValueArrayIntData = fromBigUintToArrayIntData(validValue);
              let rejectedValuesArrayIntData = rejectedValues.map(fromBigUintToArrayIntData);
              const maxDataLength = [
                rangeSizeArrayIntData,
                validValueArrayIntData,
                ...rejectedValuesArrayIntData,
              ].reduce((acc, data) => Math.max(acc, data.length), 0);
              rangeSizeArrayIntData = padDataOfArrayInt(rangeSizeArrayIntData, maxDataLength);
              validValueArrayIntData = padDataOfArrayInt(validValueArrayIntData, maxDataLength);
              rejectedValuesArrayIntData = rejectedValuesArrayIntData.map((v) => padDataOfArrayInt(v, maxDataLength));
              return {
                rangeSize: rangeSizeArrayIntData,
                rejectedValues: rejectedValuesArrayIntData,
                validValue: validValueArrayIntData,
              };
            }),
          fc.context(),
          ({ rangeSize, rejectedValues, validValue }, ctx) => {
            // Arrange
            const initialRng = buildUniqueRng();
            for (const rejected of rejectedValues) {
              // Our mock for uniformIntInternal starts by producing invalid values
              // (too large for the requested range).
              // All those values should be rejected by uniformArrayIntInternal.
              // Internally uniformArrayIntInternal do not optimize calls (for the moment)
              // it always queries for all the data then checks if the data is ok or not given rangeSize.
              // In other words, if rangeSize = [1,1,1], the algorithm will query for at least three entries
              // even if it can stop earlier [1,2,1,...] (when receiving the 2, we know it will not fit our needs).
              mockResponse(rejected, initialRng, ctx);
            }
            mockResponse(validValue, initialRng, ctx);
            mockRejectNextCalls(ctx);

            // Act
            const g = uniformArrayIntInternal(initialRng, arrayIntBuffer(rangeSize.length).data, rangeSize);

            // Assert
            expect(g).toEqual(validValue);
          },
        )
        .beforeEach(clean),
    ));
});

// Helpers

function arrayIntBuffer(size: number): ArrayInt {
  return { sign: 1, data: Array(size).fill(0) };
}

function fromBigUintToArrayIntData(n: bigint): ArrayInt['data'] {
  const data: number[] = [];
  const repr = n.toString(16);
  for (let sectionEnd = repr.length; sectionEnd > 0; sectionEnd -= 8) {
    data.push(parseInt(repr.substring(sectionEnd - 8, sectionEnd), 16));
  }
  return data.reverse();
}

function padDataOfArrayInt(arrayIntData: ArrayInt['data'], length: number): ArrayInt['data'] {
  return [...Array(length - arrayIntData.length).fill(0), ...arrayIntData];
}

function mockResponse(arrayIntData: ArrayInt['data'], clonedRng: RandomGenerator, ctx: fc.ContextValue) {
  const { uniformIntInternal } = vi.mocked(uniformIntInternalMock);
  for (const item of arrayIntData) {
    uniformIntInternal.mockImplementationOnce((rng, rangeSize) => {
      expect(rng).toBe(clonedRng);
      ctx.log(`uniformIntInternal(${rangeSize}) -> ${item}`);
      return item;
    });
  }
}

function mockRejectNextCalls(ctx: fc.ContextValue) {
  const { uniformIntInternal } = vi.mocked(uniformIntInternalMock);
  uniformIntInternal.mockImplementationOnce((_rng, rangeSize) => {
    ctx.log(`uniformIntInternal(${rangeSize}) -> [<rng>, ...]`);
    throw new Error('No more calls expected');
  });
}
