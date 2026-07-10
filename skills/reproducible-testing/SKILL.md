---
name: reproducible-testing
description: >-
  Use pure-rand for deterministic tests, simulations and property-based testing.
  Covers seeding from a fixed or logged seed, replaying failures, persisting a
  generator with getState/fromState, and producing independent parallel streams
  with jump() instead of guessing at unrelated seeds. Use when randomness must be
  reproducible across runs, machines or workers, or when integrating with
  fast-check.
license: MIT
compatibility: '>=8.0.0 <9.0.0'
metadata:
  type: library
  library: pure-rand
  library_version: 8.4.2
---

# Reproducible randomness with pure-rand

`pure-rand` is deterministic by construction: `(seed) -> generator -> stream`.
Same seed, same stream, forever, on every platform. This skill is about
exploiting that for tests, simulations, and reproducible pipelines.

## Seed from something you can recover

The golden rule: **never depend on a seed you can't reproduce.** Log it, or fix
it.

```ts
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import { uniformInt } from 'pure-rand/distribution/uniformInt';

// Deterministic test: hard-code the seed.
const rng = xoroshiro128plus(42);
expect(uniformInt(rng, 1, 6)).toBe(2); // stable across runs & machines

// Randomized test that stays reproducible on failure: pick, then LOG the seed.
const seed = Number(process.env.SEED) || (Date.now() ^ (Math.random() * 0x100000000)) | 0;
console.log(`seed=${seed}`); // rerun with SEED=<value> to replay a failure
const runRng = xoroshiro128plus(seed);
```

`Date.now() ^ (Math.random() * 0x100000000)` is a fine one-off seed _as long as
you print it_. A seed you didn't record is a bug you can't reproduce.

## Replay by persisting state

To resume a stream mid-flight (checkpointing a long simulation, snapshotting in a
test), serialize with `getState()` and restore with `<generator>FromState()`:

```ts
import { xoroshiro128plus, xoroshiro128plusFromState } from 'pure-rand/generator/xoroshiro128plus';
import { skipN } from 'pure-rand/utils/skipN';

const rng = xoroshiro128plus(42);
skipN(rng, 1_000); // advance through part of the run
const state = rng.getState(); // readonly number[], JSON-serializable

// later / elsewhere:
const resumed = xoroshiro128plusFromState(state); // continues exactly where it stopped
```

State is a plain `number[]`, so it survives `JSON.stringify`, a database column,
or a fixture file. Restoring state from a _different_ generator throws — keep the
generator name alongside the state if you persist several kinds.

## Independent parallel streams — use jump(), not new seeds

For N workers/simulations that must be **statistically independent**, do NOT
spin up N generators with arbitrary different seeds — nearby seeds can produce
correlated streams. Instead seed once and `jump()`. A jump advances the
generator by an astronomically large, fixed stride (e.g. 2^64 for the 128-bit
generators), carving the single sequence into non-overlapping sub-streams.

```ts
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import { purify } from 'pure-rand/utils/purify';

// Pure jump: returns a fresh, far-away generator without mutating the input.
const pureJump = purify((rng) => rng.jump());
const fork = (rng) => pureJump(rng)[1];

const base = xoroshiro128plus(42);
const worker0 = base; // stream 0
const worker1 = fork(worker0); // stream 1, 2^64 draws away
const worker2 = fork(worker1); // stream 2, another 2^64 away
```

All four generators (`congruential32`, `mersenne`, `xorshift128plus`,
`xoroshiro128plus`) implement `JumpableRandomGenerator`, so `jump()` is always
available. Note `jump()` mutates in place; wrap it with `purify` (as above) when
you want a new generator returned instead.

## Pure style for test frameworks

In assertions and reducers, prefer the pure form so a generator value can be
reused without surprise mutation:

```ts
import { purify } from 'pure-rand/utils/purify';
import { uniformInt } from 'pure-rand/distribution/uniformInt';

const draw = purify(uniformInt);
const rng0 = xoroshiro128plus(42);
const [x, rng1] = draw(rng0, 0, 100);
const [y, rng2] = draw(rng1, 0, 100);
// rng0 still yields x — safe to snapshot and re-run
```

## Relationship to fast-check

`pure-rand` is the PRNG that powers [fast-check](https://fast-check.dev/)'s
property-based testing. If you already use fast-check you usually don't call
`pure-rand` directly — fast-check seeds it for you and prints the seed on
failure so you can replay. Reach for `pure-rand` directly when you need
reproducible randomness _outside_ a property (fixtures, load generators,
simulations, shuffles).

## Failure modes

- **Unlogged random seed.** A failure you can't reproduce. Always print the seed
  (or read it from `SEED`).
- **Different seeds for "independent" streams.** Can correlate. Use one seed +
  `jump()` per stream.
- **Forgetting distributions mutate.** In a loop, one generator advances with
  each draw — that's usually what you want; use `purify` when it isn't. See the
  `core` skill.
- **Persisting state without the generator name.** `*FromState` throws on a
  mismatched generator. Store both.
