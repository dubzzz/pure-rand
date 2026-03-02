// @ts-check
'use strict';

var assert = require('assert');
var LinearCongruential = require('../lib/generator/LinearCongruential');
var MersenneTwister = require('../lib/generator/MersenneTwister');
var XorShift = require('../lib/generator/XorShift');
var XoroShiro = require('../lib/generator/XoroShiro');
var uniformIntModule = require('../lib/distribution/uniformInt');
var uniformBigIntModule = require('../lib/distribution/uniformBigInt');

function testGenerator(rng) {
  var value = rng.next();
  assert.strictEqual(typeof value, 'number');
  assert.ok(
    value >= -0x80000000 && value <= 0x7fffffff,
    'next() should return a value in range [-0x80000000, 0x7fffffff], got: ' + value,
  );
}

function testJumpableGenerator(rng) {
  testGenerator(rng);
  rng.jump();
  var valueAfterJump = rng.next();
  assert.strictEqual(typeof valueAfterJump, 'number');
  assert.ok(
    valueAfterJump >= -0x80000000 && valueAfterJump <= 0x7fffffff,
    'next() after jump() should return a value in range [-0x80000000, 0x7fffffff], got: ' + valueAfterJump,
  );
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
var rng = XoroShiro.xoroshiro128plus(42);
var intValue = uniformIntModule.uniformInt(rng, -100, 100);
assert.strictEqual(typeof intValue, 'number');
assert.ok(intValue >= -100 && intValue <= 100, 'uniformInt should return a value in [-100, 100], got: ' + intValue);

// Test uniformBigInt distribution
var bigIntValue = uniformBigIntModule.uniformBigInt(rng, BigInt(0), BigInt(100));
assert.strictEqual(typeof bigIntValue, 'bigint');
assert.ok(
  bigIntValue >= BigInt(0) && bigIntValue <= BigInt(100),
  'uniformBigInt should return a value in [0n, 100n], got: ' + bigIntValue,
);
