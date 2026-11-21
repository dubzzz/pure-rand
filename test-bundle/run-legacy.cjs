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
const { seed64FromHex } = require('pure-rand/seed/seed64FromHex');

// Test seed parsing and its public type
/** @type {import('pure-rand/types/Seed64').Seed64} */
const seed64 = seed64FromHex('0123456789abcdef');
assert.deepStrictEqual(seed64, [0x01234567, 0x89abcdef]);
assert.deepStrictEqual(seed64FromHex('FFFFFFFFFFFFFFFF'), [0xffffffff, 0xffffffff]);
assert.throws(() => seed64FromHex('0123456789abcdef\n'), TypeError);

// Test generators

testGenerator(congruential32);
testGenerator((seed) => congruential32([0x01234567, seed >>> 0]));
assert.deepStrictEqual(
  generateN(congruential32(seed64FromHex('0123456789abcdef')), 4),
  [772293834, 2870907281, 4119457438, 1366513749].map((value) => value | 0),
);
testGenerator(mersenne);
testGenerator((seed) => mersenne([0x01234567, seed >>> 0]));
assert.deepStrictEqual(
  generateN(mersenne(seed64FromHex('0123456789abcdef')), 4),
  [3851240871, 1496727489, 1688815724, 1191980605].map((value) => value | 0),
);
testGenerator(xorshift128plus);
testGenerator((seed) => xorshift128plus([0x01234567, seed >>> 0]));
assert.deepStrictEqual(
  xorshift128plus(seed64FromHex('0000000000000000')).getState(),
  [0xe220a839, 0x7b1dcdaf, 0x6e789e6a, 0xa1b965f4].map((value) => value | 0),
);
testGenerator(xoroshiro128plus);
testGenerator((seed) => xoroshiro128plus([0x01234567, seed >>> 0]));
assert.deepStrictEqual(
  xoroshiro128plus(seed64FromHex('0000000000000000')).getState(),
  [0xe220a839, 0x7b1dcdaf, 0x6e789e6a, 0xa1b965f4].map((value) => value | 0),
);

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
  assert.ok(typeof value === 'number' && value >= 0 && value < 1);
}
{
  const value = uniformFloat64(rng);
  assert.ok(typeof value === 'number' && value >= 0 && value < 1);
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
