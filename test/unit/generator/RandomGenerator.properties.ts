import * as assert from 'assert';
import * as fc from 'fast-check';

import { RandomGenerator, skipN, generateN, unsafeSkipN } from '../../../src/generator/RandomGenerator';

const MAX_SIZE: number = 2048;

export function sameSeedSameSequences(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
    const seq1 = generateN(skipN(rng_for(seed), offset), num)[0];
    const seq2 = generateN(skipN(rng_for(seed), offset), num)[0];
    assert.deepEqual(seq1, seq2);
  });
}

export function sameSequencesIfCallTwice(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
    const rng = skipN(rng_for(seed), offset);
    const seq1 = generateN(rng, num)[0];
    const seq2 = generateN(rng, num)[0];
    assert.deepEqual(seq1, seq2);
  });
}

export function valuesInRange(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    const rng = rng_for(seed);
    const value = skipN(rng, offset).next()[0];
    assert.ok(value >= -0x80000000);
    assert.ok(value <= 0x7fffffff);
  });
}

export function noOrderNextJump(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    const rng = rng_for(seed);
    // rngNextFirst = rng.next.next..(offset times)..next.jump
    const rngNextFirst = skipN(rng, offset).jump!();
    // rngJumpFirst = rng.jump.next.next..(offset times)..next
    const rngJumpFirst = skipN(rng.jump!(), offset);
    expect(rngNextFirst.next()[0]).toBe(rngJumpFirst.next()[0]);
  });
}

export function changeSelfWithUnsafeNext(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const [expectedValue, expectedNextRng] = skipN(rng_for(seed), offset).next();
    const rng = rng_for(seed);
    unsafeSkipN(rng, offset);
    const rngReprBefore = JSON.stringify(rng);
    const expectedRngReprAfter = JSON.stringify(expectedNextRng);

    // Act
    const value = rng.unsafeNext();
    const rngReprAfter = JSON.stringify(rng);

    // Assert
    expect(value).toBe(expectedValue);
    expect(rngReprAfter).not.toBe(rngReprBefore);
    expect(rngReprAfter).toBe(expectedRngReprAfter);
  });
}

export function changeSelfWithUnsafeJump(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const expectedJumpRng = skipN(rng_for(seed), offset).jump!();
    const rng = rng_for(seed);
    unsafeSkipN(rng, offset);
    const rngReprBefore = JSON.stringify(rng);
    const expectedRngReprAfter = JSON.stringify(expectedJumpRng);

    // Act
    rng.unsafeJump!();
    const rngReprAfter = JSON.stringify(rng);

    // Assert
    expect(rngReprAfter).not.toBe(rngReprBefore);
    expect(rngReprAfter).toBe(expectedRngReprAfter);
  });
}

export function noChangeSelfWithNext(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const rng = rng_for(seed);
    unsafeSkipN(rng, offset);
    const rngReprBefore = JSON.stringify(rng);

    // Act
    rng.next();
    const rngReprAfter = JSON.stringify(rng);

    // Assert
    expect(rngReprAfter).toBe(rngReprBefore);
  });
}

export function noChangeSelfWithJump(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const rng = rng_for(seed);
    unsafeSkipN(rng, offset);
    const rngReprBefore = JSON.stringify(rng);

    // Act
    rng.jump!();
    const rngReprAfter = JSON.stringify(rng);

    // Assert
    expect(rngReprAfter).toBe(rngReprBefore);
  });
}

export function noChangeOnClonedWithUnsafeNext(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const rng = rng_for(seed);
    unsafeSkipN(rng, offset);
    const rngCloned = rng.clone();
    const rngReprBefore = JSON.stringify(rng);
    const rngClonedReprBefore = JSON.stringify(rngCloned);

    // Act
    rng.unsafeNext();
    const rngReprAfter = JSON.stringify(rng);
    const rngClonedReprAfter = JSON.stringify(rngCloned);

    // Assert
    expect(rngClonedReprBefore).toBe(rngReprBefore);
    expect(rngClonedReprAfter).toBe(rngReprBefore);
    expect(rngClonedReprAfter).not.toBe(rngReprAfter);
  });
}

export function noChangeOnClonedWithUnsafeJump(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    // Arrange
    const rng = rng_for(seed);
    unsafeSkipN(rng, offset);
    const rngCloned = rng.clone();
    const rngReprBefore = JSON.stringify(rng);
    const rngClonedReprBefore = JSON.stringify(rngCloned);

    // Act
    rng.unsafeJump!();
    const rngReprAfter = JSON.stringify(rng);
    const rngClonedReprAfter = JSON.stringify(rngCloned);

    // Assert
    expect(rngClonedReprBefore).toBe(rngReprBefore);
    expect(rngClonedReprAfter).toBe(rngReprBefore);
    expect(rngClonedReprAfter).not.toBe(rngReprAfter);
  });
}

export function clonedFromStateSameSequences(
  rng_for: ((seed: number) => RandomGenerator) & { fromState: (state: readonly number[]) => RandomGenerator },
) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
    const source = skipN(rng_for(seed), offset);
    assert.notEqual(source.getState, undefined);
    const state = source.getState!();
    const clonedFromState = rng_for.fromState(state);
    const seq1 = generateN(source, num)[0];
    const seq2 = generateN(clonedFromState, num)[0];
    assert.deepEqual(seq1, seq2);
  });
}
