# CHANGELOG 8.X

## 8.3.0

### Features

- [cca8ab6](https://github.com/dubzzz/pure-rand/commit/cca8ab6) ⚡️ No compute at import time (pre-computed) (#959)
- [faf00dc](https://github.com/dubzzz/pure-rand/commit/faf00dc) ⚡️ Faster congruential32 with imul (#958)
- [9e85ec7](https://github.com/dubzzz/pure-rand/commit/9e85ec7) ✨ Implement jump for `mersenne` (#947)

### Fixes

- [5c0d815](https://github.com/dubzzz/pure-rand/commit/5c0d815) ✅ More benchmarks on generators (#961)
- [3c578fd](https://github.com/dubzzz/pure-rand/commit/3c578fd) ✅ Default Vitest setup to interrupt fast-check (#957)
- [7d0393a](https://github.com/dubzzz/pure-rand/commit/7d0393a) ✅ Rework benchmark on generators (#956)

## 8.2.0

### Features

- [d9aa940](https://github.com/dubzzz/pure-rand/commit/d9aa940) ⚡ Faster init for `mersenne` (#952)
- [48b0393](https://github.com/dubzzz/pure-rand/commit/48b0393) ⚡️ Faster twist in `mersenne` (#951)
- [95ff082](https://github.com/dubzzz/pure-rand/commit/95ff082) ⚡️ Less memory allocations for `mersenne` (#948)

### Fixes

- [40b4894](https://github.com/dubzzz/pure-rand/commit/40b4894) ✅ Compare `native` generator against others (#953)

## 8.1.0

### Features

- [99b7b16](https://github.com/dubzzz/pure-rand/commit/99b7b16) ✨ Add `uniformFloat64` distribution (#907)
- [ea5bca4](https://github.com/dubzzz/pure-rand/commit/ea5bca4) ✨ Add `uniformFloat32` distribution (#906)

### Fixes

- [eccea24](https://github.com/dubzzz/pure-rand/commit/eccea24) 🔨 Add utility script to list commits for changelog (#949)
- [118db91](https://github.com/dubzzz/pure-rand/commit/118db91) 👷 Reconfigure review agent (#939)
- [5bc32e2](https://github.com/dubzzz/pure-rand/commit/5bc32e2) 👷 Delete claude-review.yml (#938)
- [eb7a2e3](https://github.com/dubzzz/pure-rand/commit/eb7a2e3) 👷 Add review prompt to Claude review action (#937)
- [ba9a380](https://github.com/dubzzz/pure-rand/commit/ba9a380) 👷 Refactor claude-review conditions and parameters (#936)
- [be8917e](https://github.com/dubzzz/pure-rand/commit/be8917e) 👷 Fix plugins configuration in claude-review.yml (#935)
- [c751e31](https://github.com/dubzzz/pure-rand/commit/c751e31) 👷 Configure review agent (#934)
- [0c85094](https://github.com/dubzzz/pure-rand/commit/0c85094) 👷 Reduce permissions and drop prompt (#933)
- [1301a0f](https://github.com/dubzzz/pure-rand/commit/1301a0f) 👷 Add back hardcoded prompt (#932)
- [7a138a3](https://github.com/dubzzz/pure-rand/commit/7a138a3) 👷 Drop hardcoded prompt (#931)
- [afae304](https://github.com/dubzzz/pure-rand/commit/afae304) 👷 Unlock permissions for reviews from Claude (#930)
- [1758d7d](https://github.com/dubzzz/pure-rand/commit/1758d7d) 👷 Add Claude Review workflow for PR comments (#929)
- [b07989f](https://github.com/dubzzz/pure-rand/commit/b07989f) 🔧 Change Claude flow to append (not replace) system prompt (#921)
- [3f48c14](https://github.com/dubzzz/pure-rand/commit/3f48c14) ✅ Check for missing imports in test-bundle (#920)
- [d623bb1](https://github.com/dubzzz/pure-rand/commit/d623bb1) 🔧 Refactor Claude workflow configuration format (#919)
- [9b8e092](https://github.com/dubzzz/pure-rand/commit/9b8e092) 🔧 Change the model for Claude action (#916)
- [d37ebe3](https://github.com/dubzzz/pure-rand/commit/d37ebe3) 🔧 Refine the GH Action triggering Claude (#915)
- [73ca19b](https://github.com/dubzzz/pure-rand/commit/73ca19b) ✅ Run distributions against native (#914)
- [043ac19](https://github.com/dubzzz/pure-rand/commit/043ac19) 👷 Restrict Claude workflow to dubzzz actor only (#913)
- [3c49194](https://github.com/dubzzz/pure-rand/commit/3c49194) 👷 Switch to OAuth for GH Action on Claude (#908)

## 8.0.0

### Migration from 7.x to 8.0

**No more main entry point** — Replace barrel imports with subpath imports:

```diff
-import { uniformIntDistribution, xoroshiro128plus } from 'pure-rand';
+import { uniformInt } from 'pure-rand/distribution/uniformInt';
+import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
```

**`rng` is now the first argument** — All functions now take the generator as the first parameter:

```diff
-uniformIntDistribution(1, 6, rng);
+uniformInt(rng, 1, 6);
```

**Functions mutate `rng` in-place by default** — The old "pure" functions (returning `[value, nextRng]` tuples) have been removed. Functions now directly return the generated value and mutate the generator. To get the old pure behavior, wrap with `purify`:

```diff
-const [value, nextRng] = uniformIntDistribution(1, 6, rng);
+import { purify } from 'pure-rand/utils/purify';
+const pureUniformInt = purify(uniformInt);
+const [value, nextRng] = pureUniformInt(rng, 1, 6);
```

**Renamed distributions** — Pure distribution names have been shortened:

| 7.x                                                                 | 8.0                     |
| ------------------------------------------------------------------- | ----------------------- |
| `unsafeUniformIntDistribution`                                      | `uniformInt`            |
| `unsafeUniformBigIntDistribution`                                   | `uniformBigInt`         |
| `uniformIntDistribution`                                            | `purify(uniformInt)`    |
| `uniformBigIntDistribution`                                         | `purify(uniformBigInt)` |
| `uniformArrayIntDistribution` / `unsafeUniformArrayIntDistribution` | _(removed)_             |

**`fromState` moved to dedicated exports** — Restoring a generator from its state now uses a separate function:

```diff
-import prand from 'pure-rand';
-const rng = prand.xoroshiro128plus.fromState(state);
+import { xoroshiro128plusFromState } from 'pure-rand/generator/xoroshiro128plus';
+const rng = xoroshiro128plusFromState(state);
```

**Dedicated `JumpableRandomGenerator` type** — Generators supporting `jump()` now implement a separate `JumpableRandomGenerator` interface (extends `RandomGenerator`). If you need generators with `jump()` method, update the type:

```diff
-import type { RandomGenerator } from 'pure-rand/types/RandomGenerator';
+import type { JumpableRandomGenerator } from 'pure-rand/types/JumpableRandomGenerator';
```

### Breaking Changes

- [1838e5e](https://github.com/dubzzz/pure-rand/commit/1838e5e) 💥 Drop `uniformArrayInt` (#868)
- [09b403a](https://github.com/dubzzz/pure-rand/commit/09b403a) 💥 Introduce dedicated Jumpable type (#864)
- [6b5dd37](https://github.com/dubzzz/pure-rand/commit/6b5dd37) 💥 Move `fromState` in dedicated export (#848)
- [67cb28c](https://github.com/dubzzz/pure-rand/commit/67cb28c) 💥 Make unsafe the default (#846)
- [a51c7df](https://github.com/dubzzz/pure-rand/commit/a51c7df) 💥 Drop pure versions, rename others (#833)
- [423e6d6](https://github.com/dubzzz/pure-rand/commit/423e6d6) 💥 Drop main entry point (#832)
- [a766210](https://github.com/dubzzz/pure-rand/commit/a766210) 💥 Move `rng` as first argument (#831)

### Features

- [5c3c618](https://github.com/dubzzz/pure-rand/commit/5c3c618) ⚡️ Drop useless array access in `mersenne` (#894)
- [34406f8](https://github.com/dubzzz/pure-rand/commit/34406f8) ✨ Add `jump` to `congruential32` (#882)
- [b0262ca](https://github.com/dubzzz/pure-rand/commit/b0262ca) ⚡️ Faster `uniformInt` on large ranges (#869)
- [bd76869](https://github.com/dubzzz/pure-rand/commit/bd76869) ✨ Add `purify` utils
- [c651a0d](https://github.com/dubzzz/pure-rand/commit/c651a0d) ⚡ Slightly faster UniformArrayIntDistribution (#763)
- [7a07f86](https://github.com/dubzzz/pure-rand/commit/7a07f86) ⚡ Slightly faster UniformBigIntDistribution (#764)
- [bd0d721](https://github.com/dubzzz/pure-rand/commit/bd0d721) ⚡ Slightly faster UniformIntDistribution

### Fixes

- [abe1b84](https://github.com/dubzzz/pure-rand/commit/abe1b84) 📝 Replace Twitter share badge with Bluesky in README (#900)
- [950e5ca](https://github.com/dubzzz/pure-rand/commit/950e5ca) 👷 Rework formatting of bundle report (#903)
- [484a59e](https://github.com/dubzzz/pure-rand/commit/484a59e) 🔨 Add Claude settings with pnpm hooks and post-edit automation (#896)
- [dbe3a36](https://github.com/dubzzz/pure-rand/commit/dbe3a36) 👷 Add OTP authentication to npm package publishing (#897)
- [59e7eea](https://github.com/dubzzz/pure-rand/commit/59e7eea) 👷 Add main branch bundle comparison to size reports (#890)
- [b2c6036](https://github.com/dubzzz/pure-rand/commit/b2c6036) 📝 Extract comparison section from README into separate document (#880)
- [10da9d1](https://github.com/dubzzz/pure-rand/commit/10da9d1) 🔧 Pinning Claude action to 1.0.51 (#888)
- [e90191a](https://github.com/dubzzz/pure-rand/commit/e90191a) 🔧 Restrict Claude Code to dubzzz (#887)
- [bc2ba70](https://github.com/dubzzz/pure-rand/commit/bc2ba70) 🔧 Add Claude Code GitHub Actions workflow (#886)
- [2249bc7](https://github.com/dubzzz/pure-rand/commit/2249bc7) 📝 Fix GitHub Actions badge in README (#881)
- [33052bc](https://github.com/dubzzz/pure-rand/commit/33052bc) 🚚 Rename generator files to match generator function names (#876)
- [b44c246](https://github.com/dubzzz/pure-rand/commit/b44c246) 🔥 Drop useless `.npmignore` (#878)
- [6781423](https://github.com/dubzzz/pure-rand/commit/6781423) 🔥 Drop unwantingly committed file (#877)
- [7467833](https://github.com/dubzzz/pure-rand/commit/7467833) 👷 Add diff column to package size comment tables (#875)
- [f3a95ea](https://github.com/dubzzz/pure-rand/commit/f3a95ea) 👷 Merge per-file size tables into single combined table in PR comment (#874)
- [797bfbd](https://github.com/dubzzz/pure-rand/commit/797bfbd) 👷 Add package size reporting on PRs with 🗜️ emoji (#873)
- [958aba8](https://github.com/dubzzz/pure-rand/commit/958aba8) ✅ Publish coverage (#872)
- [969beaf](https://github.com/dubzzz/pure-rand/commit/969beaf) ✅ Only check on last LTS and latest (#871)
- [38c3eb8](https://github.com/dubzzz/pure-rand/commit/38c3eb8) ✅ Add checks of bundle integrity against Node 12.17 (#870)
- [e53608f](https://github.com/dubzzz/pure-rand/commit/e53608f) 👷 Send bench results on PR (#860)
- [00ebe83](https://github.com/dubzzz/pure-rand/commit/00ebe83) ✅ Rework bench on distributions (#859)
- [762eb02](https://github.com/dubzzz/pure-rand/commit/762eb02) 🔧 Explicitely list all exports (#856)
- [7d19082](https://github.com/dubzzz/pure-rand/commit/7d19082) 👷 End CI jobs with a terminal job (#855)
- [f5770fb](https://github.com/dubzzz/pure-rand/commit/f5770fb) ✅ Benchmark checks in CI (#853)
- [0787104](https://github.com/dubzzz/pure-rand/commit/0787104) ✅ Collocate tests with sources (#852)
- [aedace9](https://github.com/dubzzz/pure-rand/commit/aedace9) ♻️ Consider full bigint support (#851)
- [5cfb9c8](https://github.com/dubzzz/pure-rand/commit/5cfb9c8) 🔧 Switch to "isolatedDeclarations" (#850)
- [c0cdfaa](https://github.com/dubzzz/pure-rand/commit/c0cdfaa) ✅ Replace `assert` by `expect` (#849)
- [2cfdaad](https://github.com/dubzzz/pure-rand/commit/2cfdaad) 🔧 Modern config for TypeScript (#847)
- [eb9a7e8](https://github.com/dubzzz/pure-rand/commit/eb9a7e8) 👷 Setup publint in CI (#844)
- [0b4affc](https://github.com/dubzzz/pure-rand/commit/0b4affc) 👷 Add package preview in CI (#843)
- [c1dd44f](https://github.com/dubzzz/pure-rand/commit/c1dd44f) 🔧 Simpler exports in package.json (#840)
- [366172b](https://github.com/dubzzz/pure-rand/commit/366172b) 👷 Check no dedupe in CI (#842)
- [c11afd9](https://github.com/dubzzz/pure-rand/commit/c11afd9) 🔧 Drop useless deps (#841)
- [56d4098](https://github.com/dubzzz/pure-rand/commit/56d4098) 👷 Drop legacy build scripts (#836)
- [9a9ed2e](https://github.com/dubzzz/pure-rand/commit/9a9ed2e) 👷 Adopt longer term build script (#834)
- [3745f0f](https://github.com/dubzzz/pure-rand/commit/3745f0f) ✅ Cover more versions of node (#829)
- [5f95bf1](https://github.com/dubzzz/pure-rand/commit/5f95bf1) 📝 Drop Snyk badge (#830)
- [fc6e12e](https://github.com/dubzzz/pure-rand/commit/fc6e12e) 👷 Strictly lock deps in GH Actions (#828)
- [8eccd3b](https://github.com/dubzzz/pure-rand/commit/8eccd3b) 👷 Run tests against self (no build) (#827)
- [f87f382](https://github.com/dubzzz/pure-rand/commit/f87f382) 👷 Move to rolldown (#824)
- [be1bac5](https://github.com/dubzzz/pure-rand/commit/be1bac5) ♻️ Rewrite without `static` (#825)
- [f2fde1c](https://github.com/dubzzz/pure-rand/commit/f2fde1c) 👷 Move to oxfmt (#823)
- [3ff5ccb](https://github.com/dubzzz/pure-rand/commit/3ff5ccb) 👷 Move to pnpm (#821)
- [3785897](https://github.com/dubzzz/pure-rand/commit/3785897) ✅ Move to Vitest (#820)
- [43afceb](https://github.com/dubzzz/pure-rand/commit/43afceb) ✅ Add legacy checks for jump (#762)
- [2571c6d](https://github.com/dubzzz/pure-rand/commit/2571c6d) ✅ Add legacy checks for array distributions (#761)
- [cccf4c4](https://github.com/dubzzz/pure-rand/commit/cccf4c4) ✅ Add legacy checks for other generators (#760)
