import { expect } from 'vitest';
import * as fc from 'fast-check';

import type { RandomGenerator } from '../types/RandomGenerator';
import { skipN } from '../utils/skipN';
import { generateN } from '../utils/generateN';
import { purify } from '../utils/purify';

const pureSkipNInternal = purify(skipN);
const pureSkipN = (rng: RandomGenerator, num: number) => pureSkipNInternal(rng, num)[1];
const pureGenerateN = purify(generateN);

const MAX_SIZE: number = 2048;

export function sameSeedSameSequences(rng_for: (seed: number) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
    const seq1 = pureGenerateN(pureSkipN(rng_for(seed), offset), num)[0];
    const seq2 = pureGenerateN(pureSkipN(rng_for(seed), offset), num)[0];
    expect(seq1).toEqual(seq2);
  });
}

export function sameSequencesIfCallTwice(rng_for: (seed: number) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
    const rng = pureSkipN(rng_for(seed), offset);
    const seq1 = pureGenerateN(rng, num)[0];
    const seq2 = pureGenerateN(rng, num)[0];
    expect(seq1).toEqual(seq2);
  });
}

export function valuesInRange(rng_for: (seed: number) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    const rng = rng_for(seed);
    skipN(rng, offset);
    const value = rng.next();
    expect(value).toBeGreaterThanOrEqual(-0x80000000);
    expect(value).toBeLessThanOrEqual(0x7fffffff);
  });
}

export function noOrderNextJump(rng_for: (seed: number) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    const rngNextFirst = rng_for(seed);
    const rngJumpFirst = rng_for(seed);
    // rngNextFirst = rng.next.next..(offset times)..next.jump
    skipN(rngNextFirst, offset);
    rngNextFirst.jump!();
    // rngJumpFirst = rng.jump.next.next..(offset times)..next
    rngJumpFirst.jump!();
    skipN(rngJumpFirst, offset);
    // check same state and consequently same next value
    expect(rngNextFirst.getState()).toEqual(rngJumpFirst.getState());
    expect(rngNextFirst.next()).toBe(rngJumpFirst.next());
  });
}

export function changeSelfWithNext(rng_for: (seed: number) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const expectedRng = rng_for(seed);
    skipN(expectedRng, offset);
    const expectedValue = expectedRng.next();
    const rng = rng_for(seed);
    skipN(rng, offset);
    const rngStateBefore = rng.getState();
    const expectedRngStateAfter = expectedRng.getState();

    // Act
    const value = rng.next();
    const rngStateAfter = rng.getState();

    // Assert
    expect(value).toBe(expectedValue);
    expect(rngStateAfter).not.toEqual(rngStateBefore);
    expect(rngStateAfter).toEqual(expectedRngStateAfter);
  });
}

export function changeSelfWithJump(rng_for: (seed: number) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const expectedRng = rng_for(seed);
    skipN(expectedRng, offset);
    expectedRng.jump!();
    const rng = rng_for(seed);
    skipN(rng, offset);
    const rngStateBefore = rng.getState();
    const expectedRngStateAfter = expectedRng.getState();

    // Act
    rng.jump!();
    const rngStateAfter = rng.getState();

    // Assert
    expect(rngStateAfter).not.toEqual(rngStateBefore);
    expect(rngStateAfter).toEqual(expectedRngStateAfter);
  });
}

export function noChangeOnClonedWithNext(rng_for: (seed: number) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const rng = rng_for(seed);
    skipN(rng, offset);
    const rngCloned = rng.clone();
    const rngReprBefore = JSON.stringify(rng);
    const rngClonedReprBefore = JSON.stringify(rngCloned);

    // Act
    rng.next();
    const rngReprAfter = JSON.stringify(rng);
    const rngClonedReprAfter = JSON.stringify(rngCloned);

    // Assert
    expect(rngClonedReprBefore).toBe(rngReprBefore);
    expect(rngClonedReprAfter).toBe(rngReprBefore);
    expect(rngClonedReprAfter).not.toBe(rngReprAfter);
  });
}

export function noChangeOnClonedWithJump(rng_for: (seed: number) => RandomGenerator): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const rng = rng_for(seed);
    skipN(rng, offset);
    const rngCloned = rng.clone();
    const rngReprBefore = JSON.stringify(rng);
    const rngClonedReprBefore = JSON.stringify(rngCloned);

    // Act
    rng.jump!();
    const rngReprAfter = JSON.stringify(rng);
    const rngClonedReprAfter = JSON.stringify(rngCloned);

    // Assert
    expect(rngClonedReprBefore).toBe(rngReprBefore);
    expect(rngClonedReprAfter).toBe(rngReprBefore);
    expect(rngClonedReprAfter).not.toBe(rngReprAfter);
  });
}

export function clonedFromStateSameSequences(
  rng_for: (seed: number) => RandomGenerator,
  rng_fromState: (state: readonly number[]) => RandomGenerator,
): fc.IProperty<unknown> {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
    const source = pureSkipN(rng_for(seed), offset);
    expect(source.getState).not.toBe(undefined);
    const state = source.getState!();
    const clonedFromState = rng_fromState(state);
    const seq1 = pureGenerateN(source, num)[0];
    const seq2 = pureGenerateN(clonedFromState, num)[0];
    expect(seq1).toEqual(seq2);
  });
}
