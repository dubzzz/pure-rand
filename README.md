<h1>
  <img src="https://raw.githubusercontent.com/dubzzz/pure-rand/main/assets/logo.svg" alt="pure-rand logo" />
</h1>

Fast Pseudorandom number generators (aka PRNG) with purity in mind!

[![Build Status](https://github.com/dubzzz/pure-rand/workflows/Build%20Status/badge.svg?branch=main)](https://github.com/dubzzz/pure-rand/actions)
[![NPM Version](https://badge.fury.io/js/pure-rand.svg)](https://badge.fury.io/js/pure-rand)
[![Monthly Downloads](https://img.shields.io/npm/dm/pure-rand)](https://www.npmjs.com/package/pure-rand)

[![Codecov](https://codecov.io/gh/dubzzz/pure-rand/branch/main/graph/badge.svg)](https://codecov.io/gh/dubzzz/pure-rand)
[![Package Quality](https://packagequality.com/shield/pure-rand.svg)](https://packagequality.com/#?package=pure-rand)
[![Snyk Package Quality](https://snyk.io/advisor/npm-package/pure-rand/badge.svg)](https://snyk.io/advisor/npm-package/pure-rand)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/dubzzz/pure-rand/labels/good%20first%20issue)
[![License](https://img.shields.io/npm/l/pure-rand.svg)](https://github.com/dubzzz/pure-rand/blob/main/LICENSE)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/dubzzz/pure-rand.svg?style=social)](https://twitter.com/intent/tweet?text=Check%20out%20pure-rand%20by%20%40ndubien%20https%3A%2F%2Fgithub.com%2Fdubzzz%2Fpure-rand%20%F0%9F%91%8D)

## Getting started

### In node

Install the module with: `npm install pure-rand`

Unlike classical random number generators, `pure-rand` comes with a set of _pure_ and _seeded_ generators (implementing the interface [RandomGenerator](https://github.com/dubzzz/pure-rand/blob/main/src/generator/RandomGenerator.ts)).
Each time a call to `.next()` method is done, the generator provides both the generated value and the next generator.

As a consequence, a given generator will always produce the same value. It can be called as many times as required without impacting its state. This ability makes it easier to replay code section relying on random without having to re-seed a new generator and replay the whole path to be in the same state.

### In a web-page

In order to use `pure-rand` from a web-page, you have to reference the web-aware script as follow:

```html
<script type="module">
  import * as prand from 'https://unpkg.com/pure-rand/lib/esm/pure-rand.js';
  // prand is now available
</script>
```

You can also reference a precise version by setting the version you want in the url:

```html
<script type="module">
  import * as prand from 'https://unpkg.com/pure-rand@1.2.0/lib/esm/pure-rand.js';
  // prand is now available
</script>
```

## Usage

```javascript
import prand from 'pure-rand';

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

// Whenever you want to use the distribution only once you can directly call
// prand.uniformIntDistribution(from, to, rng) which is totally equivalent to prand.uniformIntDistribution(from, to)(rng)
// In terms of performances, the 3 parameters version is faster
const [nNoDistributionInstance, gen4] = prand.uniformIntDistribution(0, 9, gen3);

// Some generators come with built-in jump
// jump provides the ability to skip a very large number of intermediate values
// Calling jump is recommended whenever you want to build non-overlapping subsequences
const gen4 = prand.xoroshiro128plus(seed);
const offsetGen4 = gen4.jump();
// In the case of:
// - xoroshiro128plus - jump is equivalent to 2^64 calls to next
// - xorshift128plus  - jump is equivalent to 2^64 calls to next
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

All the [RandomGenerator](https://github.com/dubzzz/pure-rand/blob/main/src/generator/) provided by `pure-rand` derive from the interface [RandomGenerator](https://github.com/dubzzz/pure-rand/blob/main/src/generator/RandomGenerator.ts) and are pure and seeded as described above.

The following generators are available:

- `prand.xorshift128plus(seed: number)`: xorshift128+ generator whose values are within the range -0x80000000 to 0x7fffffff
- `prand.xoroshiro128plus(seed: number)`: xoroshiro128+ generator whose values are within the range -0x80000000 to 0x7fffffff
- `prand.mersenne(seed: number)`: Mersenne Twister generator whose values are within the range 0 to 0xffffffff
- `prand.congruential(seed: number)`: Linear Congruential generator whose values are within the range 0 to 0x7fff
- `prand.congruential32(seed: number)`: Linear Congruential generator whose values are within the range 0 to 0xffffffff

Some helpers are also provided in order to ease the use of `RandomGenerator` instances:

- `prand.generateN(rng: RandomGenerator, num: number): [number[], RandomGenerator]`: generates `num` random values using `rng` and return the next `RandomGenerator`
- `prand.skipN(rng: RandomGenerator, num: number): RandomGenerator`: skips `num` random values and return the next `RandomGenerator`

### Distributions

All the [Distribution](https://github.com/dubzzz/pure-rand/tree/main/src/distribution) take a `RandomGenerator` as input and produce a couple `(n: number, nextGenerator: RandomGenerator)`. A `Distribution` is defined as `type Distribution<T> = (rng: RandomGenerator) => [T, RandomGenerator];`.

For the moment, available `Distribution` are:

- `prand.uniformIntDistribution(from: number, to: number): Distribution<number>`
- `prand.uniformBigIntDistribution(from: bigint, to: bigint): Distribution<bigint>`\*
- `prand.uniformArrayIntDistribution(from: ArrayInt, to: ArrayInt): Distribution<ArrayInt>`\*\*

\*Requires your JavaScript interpreter to support bigint

\*\*ArrayInt is an object having the structure `{sign, data}` with sign being either 1 or -1 and data an array of numbers between 0 (included) and 0xffffffff (included)

## Comparison

### Summary

The chart has been split into three sections:

- section 1: native `Math.random()`
- section 2: without uniform distribution of values
- section 3: with uniform distribution of values (not supported by all libraries)

<img src="https://raw.githubusercontent.com/dubzzz/pure-rand/main/perf/comparison.svg" alt="Comparison against other libraries" />

### Key points

Here are some key points to have in mind when comparing libraries dealing with random number generators.

**Random vs Random**

In computer science most random number generators<sup>(1)</sup> are [pseudorandom number generators](https://en.wikipedia.org/wiki/Pseudorandom_number_generator) (abbreviated: PRNG). In other words, they are fully deterministic and given the original seed one can rebuild the whole sequence.

Each PRNG algorithm had to deal with tradeoffs in terms of randomness quality, speed, length of the sequence... In other words, it's important to compare relative speed of libraries with that in mind. Indeed, a Mersenne Twister PRNG will not have the same strenghts and weaknesses as a Xoroshiro PRNG, so depending on what you need exactly you might prefer one PRNG over another even if it will be slower.

4 PRNGs come with pure-rand:

- `congruential32` — \[[more](https://en.wikipedia.org/wiki/Linear_congruential_generator)\]
- `mersenne` — \[[more](https://en.wikipedia.org/wiki/Mersenne_Twister)\]
- `xorshift128plus` — \[[more](https://en.wikipedia.org/wiki/Xorshift)\]
- `xoroshiro128plus` — \[[more](https://en.wikipedia.org/wiki/Xorshift)\]

But no cyprographic PRNG so far.

**Uniform or not**

Once you are able to generate random values, next step is to scale them into the range you want. Indeed, you probably don't want a floating point value between 0 (included) and 1 (excluded) but rather an integer value between 1 and 6 if you emulate a dice or any other range based on your needs.

At this point, simple way would be to do `min + floor(random() * (max - min + 1))` but actually it will not generate the values with equal probabilities even if you use the best PRNG in the world to back `random()`. In order to have equal probabilities you need to rely on uniform distributions<sup>(2)</sup> which comes built-in in some PNRG libraries.

### Process

In order to compare the performance of the libraries, we aked them to shuffle an array containing 1,000,000 items (see [code](https://github.com/dubzzz/pure-rand/blob/556ec331c68091c5d56e9da1266112e8ea222b2e/perf/compare.cjs)).

We then split the measurements into two sections:

- one for non-uniform distributions — _known to be slower as it implies re-asking for other values to the PRNG until the produced value fall into the acceptable range of values_
- one for uniform distributions

The recommended setup for pure-rand is to rely on our Xoroshiro128+. It provides a long enough sequence of random values, has built-in support for jump, is really efficient while providing a very good quality of randomness.

### Performance

**Non-Uniform**

| Library                  | Algorithm         | Mean time (ms) | Compared to pure-rand |
| ------------------------ | ----------------- | -------------- | --------------------- |
| native \(node 16.19.1\)  | Xorshift128+      | 33.3           | 1.4x slower           |
| **pure-rand _@6.0.0_**   | **Xoroshiro128+** | **24.5**       | **reference**         |
| pure-rand _@6.0.0_       | Xorshift128+      | 25.0           | similar               |
| pure-rand _@6.0.0_       | Mersenne Twister  | 30.8           | 1.3x slower           |
| pure-rand _@6.0.0_       | Congruential‍     | 22.6           | 1.1x faster           |
| seedrandom _@3.0.5_      | Alea              | 28.1           | 1.1x slower           |
| seedrandom _@3.0.5_      | Xorshift128       | 28.8           | 1.2x slower           |
| seedrandom _@3.0.5_      | Tyche-i           | 28.6           | 1.2x slower           |
| seedrandom _@3.0.5_      | Xorwow            | 32.0           | 1.3x slower           |
| seedrandom _@3.0.5_      | Xor4096           | 32.2           | 1.3x slower           |
| seedrandom _@3.0.5_      | Xorshift7         | 33.5           | 1.4x slower           |
| @faker-js/faker _@7.6.0_ | Mersenne Twister  | 109.1          | 4.5x slower           |
| chance _@1.1.10_         | Mersenne Twister  | 142.9          | 5.8x slower           |

**Uniform**

| Library                | Algorithm         | Mean time (ms) | Compared to pure-rand |
| ---------------------- | ----------------- | -------------- | --------------------- |
| **pure-rand _@6.0.0_** | **Xoroshiro128+** | **53.5**       | **reference**         |
| pure-rand _@6.0.0_     | Xorshift128+      | 52.2           | similar               |
| pure-rand _@6.0.0_     | Mersenne Twister  | 61.6           | 1.2x slower           |
| pure-rand _@6.0.0_     | Congruential‍     | 57.6           | 1.1x slower           |
| random-js @2.1.0       | Mersenne Twister  | 119.6          | 2.2x slower           |

> System details:
>
> - OS: Linux 5.15 Ubuntu 22.04.2 LTS 22.04.2 LTS (Jammy Jellyfish)
> - CPU: (2) x64 Intel(R) Xeon(R) Platinum 8272CL CPU @ 2.60GHz
> - Memory: 5.88 GB / 6.78 GB
> - Container: Yes
> - Node: 16.19.1 - /opt/hostedtoolcache/node/16.19.1/x64/bin/node
>
> _Executed on default runners provided by GitHub Actions_

---

(1) — Not all as there are also [hardware-based random number generator](https://en.wikipedia.org/wiki/Hardware_random_number_generator).

(2) — While most users don't really think of it, uniform distribution is key! Without it entries might be biased towards some values and make some others less probable. The naive `rand() % numValues` is a good example of biased version as if `rand()` is uniform in `0, 1, 2` and `numValues` is `2`, the probabilities are: `P(0) = 67%`, `P(1) = 33%` causing `1` to be less probable than `0`
