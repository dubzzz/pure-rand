// @ts-check
'use strict';

const assert = require('assert');
const { congruential32 } = require('pure-rand/generator/congruential32');
const { mersenne } = require('pure-rand/generator/mersenne');
const { xorshift128plus } = require('pure-rand/generator/xorshift128plus');
const { xoroshiro128plus } = require('pure-rand/generator/xoroshiro128plus');
const { uniformInt } = require('pure-rand/distribution/uniformInt');
const { uniformBigInt } = require('pure-rand/distribution/uniformBigInt');
const { uniformFloat32 } = require('pure-rand/distribution/uniformFloat32');
const { uniformFloat64 } = require('pure-rand/distribution/uniformFloat64');
const { generateN } = require('pure-rand/utils/generateN');
const { skipN } = require('pure-rand/utils/skipN');
const { purify } = require('pure-rand/utils/purify');

// Test generators

testGenerator(congruential32);
testGenerator(mersenne);
testGenerator(xorshift128plus);
testGenerator(xoroshiro128plus);

// Test distributions

const rng = xorshift128plus(42);
{
  const value1 = uniformInt(rng, -100, 100);
  assert.ok(typeof value1 === 'number' && value1 >= -100 && value1 <= 100);
  const value2 = uniformInt(rng, 0, 8_000_000_000); // larger than 2**32 range
  assert.ok(typeof value2 === 'number' && value2 >= 0 && value2 <= 8_000_000_000);
}
{
  const value = uniformBigInt(rng, 0n, 100n);
  assert.ok(typeof value === 'bigint' && value >= 0n && value <= 100n);
}
{
  const value = uniformFloat32(rng);
  assert.ok(typeof value === 'number' && value >= 0 && value <= 1);
}
{
  const value = uniformFloat64(rng);
  assert.ok(typeof value === 'number' && value >= 0 && value <= 1);
}

// Test utils
{
  const rngClone = rng.clone();
  const extractedValuesRng = generateN(rng, 3);
  const extractedValuesRngClone = [rngClone.next(), rngClone.next(), rngClone.next()];
  assert.deepStrictEqual(extractedValuesRng, extractedValuesRngClone);
  assert.deepStrictEqual(rng.getState(), rngClone.getState());
  assert.strictEqual(rng.next(), rngClone.next());
}
{
  const rngClone = rng.clone();
  skipN(rng, 3);
  rngClone.next();
  rngClone.next();
  rngClone.next();
  assert.deepStrictEqual(rng.getState(), rngClone.getState());
  assert.strictEqual(rng.next(), rngClone.next());
}
{
  const originalState = rng.getState();
  const pureNextAndJump = purify(
    /** @param {import('pure-rand/types/JumpableRandomGenerator').JumpableRandomGenerator} rng */
    (rng) => {
      rng.next();
      rng.jump();
    },
  );
  pureNextAndJump(rng);
  assert.deepStrictEqual(rng.getState(), originalState);
}

// Helper functions

/** @param {(seed: number) => (import('pure-rand/types/RandomGenerator').RandomGenerator | import('pure-rand/types/JumpableRandomGenerator').JumpableRandomGenerator)} rngBuilder */
function testGenerator(rngBuilder) {
  try {
    const rng = rngBuilder(0);
    const rngClone = rng.clone();
    // Offset the original generator
    let value = rng.next();
    assert.ok(typeof value === 'number' && value >= -0x80000000 && value <= 0x7fffffff);
    if ('jump' in rng) {
      rng.jump();
    }
    value = rng.next();
    assert.ok(typeof value === 'number' && value >= -0x80000000 && value <= 0x7fffffff);
    // And compare states and values of clone and reference
    assert.notDeepStrictEqual(rng.getState(), rngClone.getState());
    assert.notStrictEqual(rng.next(), rngClone.next());
    // Offset its clone
    rngClone.next();
    rngClone.next();
    if ('jump' in rngClone) {
      // @ts-expect-error - Not relevant, TypeScript does not succeed to get that jump exists on the clone
      rngClone.jump();
    }
    // And compare states and values of clone and reference
    assert.deepStrictEqual(rng.getState(), rngClone.getState());
    assert.strictEqual(rng.next(), rngClone.next());
  } catch (err) {
    throw new Error(`Failure in generator ${rngBuilder.name}`, { cause: err });
  }
}
