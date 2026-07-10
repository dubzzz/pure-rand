---
name: core
description: >-
  Generate reproducible pseudorandom numbers with pure-rand. Covers seeding the
  four generators (congruential32, mersenne, xorshift128plus, xoroshiro128plus),
  drawing unbiased uniform integers, bigints and floats, and the in-place vs
  pure calling conventions. Use whenever writing or reviewing code that imports
  from `pure-rand/*`, needs deterministic randomness, or must pick a generator.
license: MIT
compatibility: '>=8.0.0 <9.0.0'
metadata:
  type: library
  library: pure-rand
  library_version: 8.4.2
---

# pure-rand — core usage

`pure-rand` is a fast, dependency-free PRNG toolkit for JavaScript/TypeScript.
Every generator is **seeded and fully deterministic**: the same seed always
replays the same sequence, on every platform. That determinism is the whole
point — reach for `pure-rand` (not `Math.random`) when you need reproducibility.

The package has **no default export and no barrel entry point**. Import each
function from its own subpath:

```ts
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import { uniformInt } from 'pure-rand/distribution/uniformInt';
```

## Mental model: generators vs distributions

- A **generator** turns a seed into a stream of raw 32-bit integers via
  `next()`. `next()` returns a **signed** value in `[-0x80000000, 0x7fffffff]`.
- A **distribution** consumes a generator and shapes its output into the range
  and type you actually want (an int in `[1, 6]`, a float in `[0, 1)`, …). Use a
  distribution rather than doing your own modulo — see "Failure modes" below.

## Generators

All four are created with `(seed: number) => JumpableRandomGenerator`:

```ts
import { congruential32 } from 'pure-rand/generator/congruential32';
import { mersenne } from 'pure-rand/generator/mersenne';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';

const rng = xoroshiro128plus(42); // seed can be any 32-bit-ish number
```

Which one to pick:

| Generator          | Period  | Notes                                                    |
| ------------------ | ------- | -------------------------------------------------------- |
| `xoroshiro128plus` | 2^128   | **Default choice.** Fastest, great statistical quality.  |
| `xorshift128plus`  | 2^128   | Similar profile to xoroshiro; slightly slower.           |
| `mersenne`         | 2^19937 | Mersenne Twister; huge period, familiar/portable output. |
| `congruential32`   | 2^32    | Tiny/simple LCG. Short period — avoid for large draws.   |

When unsure, use `xoroshiro128plus`. All four implement `JumpableRandomGenerator`
(see the `reproducible-testing` skill for `jump()` and parallel streams).

## Distributions

Each distribution takes the generator as its first argument:

```ts
import { uniformInt } from 'pure-rand/distribution/uniformInt';
import { uniformBigInt } from 'pure-rand/distribution/uniformBigInt';
import { uniformFloat32 } from 'pure-rand/distribution/uniformFloat32';
import { uniformFloat64 } from 'pure-rand/distribution/uniformFloat64';

const rng = xoroshiro128plus(42);

uniformInt(rng, 1, 6); // integer in {1..6}, both ends inclusive
uniformBigInt(rng, 0n, 2n ** 64n); // unbiased bigint in [from, to]
uniformFloat32(rng); // float in [0, 1) with 32-bit precision
uniformFloat64(rng); // float in [0, 1) with 53-bit precision
```

`uniformInt`/`uniformBigInt` are **unbiased**: every value in `[from, to]` is
equally likely (inclusive on both ends). Do not hand-roll `next() % n` — that
biases the low values.

## In-place vs pure — the one thing to get right

Generators are **stateful**. `next()` and every distribution **advance the
generator in place** by mutating it. Two calls therefore return _different_
values, exactly as you'd want from a stream:

```ts
const rng = xoroshiro128plus(42);
uniformInt(rng, 1, 6); // 2  — rng has now advanced
uniformInt(rng, 1, 6); // 4  — different value, same rng
```

If you need a _pure_ call — same input generator in, same value out, plus the
next generator returned rather than mutated — wrap the operation with `purify`:

```ts
import { purify } from 'pure-rand/utils/purify';

const rollDie = purify(uniformInt);

const rng1 = xoroshiro128plus(42);
const [a, rng2] = rollDie(rng1, 1, 6); // rng1 is untouched
const [b, rng3] = rollDie(rng2, 1, 6);
const [aAgain] = rollDie(rng1, 1, 6); // === a, because rng1 never changed
```

`purify(action)` returns `(rng, ...args) => [result, nextRng]`. Internally it
`clone()`s the generator before running, so the input is never observed to
change. Prefer the pure style in reducers, React state, or anywhere a generator
value might be reused.

## Snapshot & restore state

`clone()` gives an independent copy; `getState()` / `*FromState()` serialize:

```ts
import { xoroshiro128plusFromState } from 'pure-rand/generator/xoroshiro128plus';

const rng = xoroshiro128plus(42);
const saved = rng.getState(); // readonly number[] — JSON-safe
const rng2 = xoroshiro128plusFromState(saved); // resumes the exact stream
```

Every generator module exports a matching `<name>FromState(state)` constructor.
Passing a state produced by a _different_ generator throws.

## Bulk helpers

```ts
import { generateN } from 'pure-rand/utils/generateN';
import { skipN } from 'pure-rand/utils/skipN';

generateN(rng, 5); // number[] of 5 raw next() values (advances rng)
skipN(rng, 1000); // advance rng by 1000 draws, discarding output
```

## Failure modes

- **Reusing a generator expecting the same value.** Distributions mutate. If you
  call `uniformInt(rng, 1, 6)` twice you get two draws, not a repeat. Use
  `purify` when you need referential transparency.
- **`next()` can be negative.** It is a _signed_ 32-bit int. For a `[0, 1)`
  float, use `uniformFloat32`/`uniformFloat64`; if you must go raw, convert to
  unsigned first: `(rng.next() >>> 0) / 0x100000000`.
- **Hand-rolled ranges are biased.** `next() % n` over-weights small remainders.
  Always go through `uniformInt`/`uniformBigInt` for a uniform range.
- **`congruential32` for heavy use.** Its 2^32 period repeats quickly; choose
  `xoroshiro128plus` for anything drawing many values.
- **Seeding with `Math.random()` alone** loses reproducibility. Seed from a
  fixed number (tests) or persist the seed you used.
