// @ts-check
'use strict';

const assert = require('assert');
const LinearCongruential = require('../lib/generator/LinearCongruential');
const MersenneTwister = require('../lib/generator/MersenneTwister');
const XorShift = require('../lib/generator/XorShift');
const XoroShiro = require('../lib/generator/XoroShiro');
const uniformIntModule = require('../lib/distribution/uniformInt');
const uniformBigIntModule = require('../lib/distribution/uniformBigInt');

function testGenerator(rng) {
  const value = rng.next();
  assert.strictEqual(typeof value, 'number');
  assert.ok(value >= -0x80000000 && value <= 0x7fffffff);
}

function testJumpableGenerator(rng) {
  testGenerator(rng);
  rng.jump();
  const valueAfterJump = rng.next();
  assert.strictEqual(typeof valueAfterJump, 'number');
  assert.ok(valueAfterJump >= -0x80000000 && valueAfterJump <= 0x7fffffff);
}

// Test congruential32
testGenerator(LinearCongruential.congruential32(0));

// Test mersenne
testGenerator(MersenneTwister.mersenne(0));

// Test xorshift128plus (jumpable)
testJumpableGenerator(XorShift.xorshift128plus(0));

// Test xoroshiro128plus (jumpable)
testJumpableGenerator(XoroShiro.xoroshiro128plus(0));

// Test uniformInt distribution
const rng = XoroShiro.xoroshiro128plus(42);
const intValue = uniformIntModule.uniformInt(rng, -100, 100);
assert.strictEqual(typeof intValue, 'number');
assert.ok(intValue >= -100 && intValue <= 100);

// Test uniformBigInt distribution
const bigIntValue = uniformBigIntModule.uniformBigInt(rng, BigInt(0), BigInt(100));
assert.strictEqual(typeof bigIntValue, 'bigint');
assert.ok(bigIntValue >= BigInt(0) && bigIntValue <= BigInt(100));
