# pure-rand
#### Pure random number generator written in TypeScript

[![Build Status](https://travis-ci.org/dubzzz/pure-rand.svg?branch=master)](https://travis-ci.org/dubzzz/pure-rand)
[![npm version](https://badge.fury.io/js/pure-rand.svg)](https://badge.fury.io/js/pure-rand)
[![dependencies Status](https://david-dm.org/dubzzz/pure-rand/status.svg)](https://david-dm.org/dubzzz/pure-rand)
[![devDependencies Status](https://david-dm.org/dubzzz/pure-rand/dev-status.svg)](https://david-dm.org/dubzzz/pure-rand?type=dev)

[![Coverage Status](https://coveralls.io/repos/github/dubzzz/pure-rand/badge.svg)](https://coveralls.io/github/dubzzz/pure-rand)
[![Test Coverage](https://api.codeclimate.com/v1/badges/7cb8cb395740446a3108/test_coverage)](https://codeclimate.com/github/dubzzz/pure-rand/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/7cb8cb395740446a3108/maintainability)](https://codeclimate.com/github/dubzzz/pure-rand/maintainability)

## Getting started

Install the module with: `npm install pure-rand`

Unlike classical random number generators, `pure-rand` comes with a set of *pure* and *seeded* generators (implementing the interface [RandomGenerator](https://github.com/dubzzz/pure-rand/blob/master/src/generator/RandomGenerator.ts)).
Each time a call to `.next()` method is done, the generator provides both the generated value and the next generator.

As a consequence, a given generator will always produce the same value. It can be called as many times as required without impacting its state. This ability makes it easier to replay code section relying on random without having to re-seed a new generator and replay the whole path to be in the same state.

## Usage

```javascript
import prand from 'pure-rand'

const seed = 42;

// Instanciates a Mersenne Twister
// random number generator with the seed=42
const gen1 = prand.mersenne(seed);

// Build a random value `n` and the next generator `gen2`
// the random value `n` is within the range:
// gen1.min() (included) to gen1.max() (included)
const [n, gen2] = gen1.next();
// Calling again next on gen1 will provide the very same output:
// `n: number` and `gen2: RandomGenerator`

// In order to generate values within range,
// distributions are provided by the pure-rand

// Like `.next()` method,
// distributions take an incoming generator and extract a couple:
// (n: number, nextGenerator: RandomGenerator)

// The distribution built by the call to prand.uniformIntDistribution(0, 9)
// generates uniformly integers within 0 (included) and 9 (included)
const [nRange, gen3] = prand.uniformIntDistribution(0, 9)(gen1);
// Calling again the same Distribution with the same RandomGenerator
// will provide the same output
```

Module import can also be done using one of the following syntaxes:

```javascript
import * as prand from 'pure-rand';
import { mersenne } from 'pure-rand';
const prand = require('pure-rand');
const { mersenne } = require('pure-rand');
```

## Documentation

### Random number generators

All the [RandomGenerator](https://github.com/dubzzz/pure-rand/blob/master/src/generator/) provided by `pure-rand` derive from the interface [RandomGenerator](https://github.com/dubzzz/pure-rand/blob/master/src/generator/RandomGenerator.ts) and are pure and seeded as described above.

The following generators are available:
- `prand.mersenne(seed: number)`: Mersenne Twister generator whose values are within the range 0 to 0xffffffff
- `prand.congruential(seed: number)`: Linear Congruential generator whose values are within the range 0 to 0x7fff

### Distributions

All the [Distribution](https://github.com/dubzzz/pure-rand/tree/master/src/distribution) take a `RandomGenerator` as input and produce a couple `(n: number, nextGenerator: RandomGenerator)`.

For the moment only one `Distribution` is available:
- `prand.uniformIntDistribution(from: number, to: number): Distribution<number>`
