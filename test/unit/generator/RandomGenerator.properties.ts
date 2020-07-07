import * as assert from 'assert';
import * as fc from 'fast-check';

import { RandomGenerator, skipN, generateN } from '../../../src/generator/RandomGenerator';

const MAX_SIZE: number = 2048;

function sameSeedSameSequences(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
    const seq1 = generateN(skipN(rng_for(seed), offset), num)[0];
    const seq2 = generateN(skipN(rng_for(seed), offset), num)[0];
    assert.deepEqual(seq1, seq2);
  });
}

function sameSequencesIfCallTwice(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), fc.nat(MAX_SIZE), (seed, offset, num) => {
    const rng = skipN(rng_for(seed), offset);
    const seq1 = generateN(rng, num)[0];
    const seq2 = generateN(rng, num)[0];
    assert.deepEqual(seq1, seq2);
  });
}

function valuesInRange(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    const rng = rng_for(seed);
    const value = skipN(rng, offset).next()[0];
    assert.ok(value >= rng.min());
    assert.ok(value <= rng.max());
  });
}

function noOrderNextJump(rng_for: (seed: number) => RandomGenerator) {
  return fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, offset) => {
    const rng = rng_for(seed);
    // rngNextFirst = rng.next.next..(offset times)..next.jump
    const rngNextFirst = skipN(rng, offset).jump!();
    // rngJumpFirst = rng.jump.next.next..(offset times)..next
    const rngJumpFirst = skipN(rng.jump!(), offset);
    expect(rngNextFirst.next()[0]).toBe(rngJumpFirst.next()[0]);
  });
}

export { sameSeedSameSequences, sameSequencesIfCallTwice, valuesInRange, noOrderNextJump };
