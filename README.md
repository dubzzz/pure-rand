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

`pure-rand` produces pure random number generators. In other words, a given instance of a `RandomGenerator` can produce only one value and the next generator (in a reproducible way).

It makes it possible to use random generator is pure functions without modifying directly the incoming generator.

## Usage

```javascript
import prand from 'pure-rand'

const seed = 42;

// Instanciates a Mersenne Twister
// Random number generator given the seed = 42 (defined above)
const gen1 = prand.mersenne(seed);
```
