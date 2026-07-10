# Skill spec — pure-rand

Captured during the domain-discovery phase of `intent scaffold`. This is the
brief the SKILL.md files are generated against; regenerate the skills whenever
this spec or a referenced source in `domain_map.yaml` changes materially.

## Domain

`pure-rand` is a fast, zero-dependency pseudorandom number toolkit for
JavaScript/TypeScript. It is the PRNG behind `fast-check`. Its defining property
is **purity/determinism**: `(seed) -> generator -> stream`, replayable on any
platform. Agents reach for it over `Math.random` precisely when reproducibility
matters.

## Audience & task shapes

- Writing code that draws random values and must be reproducible (tests,
  simulations, procedural generation, shuffles, load generators).
- Reviewing code that imports from `pure-rand/*`.
- Deciding which generator/distribution to use.
- Running many independent random streams (workers, Monte-Carlo shards).

## Implicit knowledge that must be made explicit

These are the things a model without in-context docs gets wrong — the reason the
skills exist rather than relying on training data:

1. **No barrel/default export.** Everything is a per-file subpath import
   (`pure-rand/generator/xoroshiro128plus`). Models routinely hallucinate
   `import prand from 'pure-rand'`.
2. **Distributions mutate the generator in place.** `uniformInt(rng, …)` twice
   gives two draws, not a repeat. `purify` provides the pure `[value, nextRng]`
   form.
3. **`next()` is signed 32-bit** (`[-0x80000000, 0x7fffffff]`) — not `[0, 1)`
   and not unsigned. Use the float distributions, or `>>> 0` before dividing.
4. **Ranges must go through the uniform distributions**; `next() % n` is biased.
5. **Independent streams come from `jump()`, not from different seeds.** All four
   generators are `JumpableRandomGenerator`.
6. **State is a plain `number[]`** via `getState()` / `<generator>FromState()`;
   restoring across generator types throws.

## Known drift risk

The README's "Pure usage" example references an older API surface
(`uniformIntDistribution` from `pure-rand/distribution/UniformIntDistribution`),
whereas the shipped export is `uniformInt` from `pure-rand/distribution/uniformInt`.
The skills are authored against **source**, not just the README, so agents get the
current names. This is exactly the docs-vs-code drift `intent stale` is meant to
surface at release time.

## Skills produced

- `core` — everyday usage: generators, distributions, purity, state, bulk helpers.
- `reproducible-testing` — determinism in anger: seeds, replay, parallel streams,
  fast-check relationship.
