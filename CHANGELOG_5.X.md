# CHANGELOG 5.X

## 5.0.5

### Fixes

- [97fae65](https://github.com/dubzzz/pure-rand/commit/97fae65) 💸 Move GitHub sponsors link first for npm display (#468)

## 5.0.4

### Fixes

- [a922a54](https://github.com/dubzzz/pure-rand/commit/a922a54) 👷 Add extra runs in benchmarks (#463)
- [aa21bc8](https://github.com/dubzzz/pure-rand/commit/aa21bc8) 👷 Rework benchmark part (#461)
- [f2937e8](https://github.com/dubzzz/pure-rand/commit/f2937e8) 💸 Add link to GitHub sponsors in funding (#462)

## 5.0.3

### Fixes

- [bccd91a](https://github.com/dubzzz/pure-rand/commit/bccd91a) 🐛 Avoid BigInt crash when importing pure-rand (#432)

## 5.0.2

### Fixes

- [e3c3052](https://github.com/dubzzz/pure-rand/commit/e3c3052) 🐛 More resiliency to poisoning on globals (#431)

## 5.0.1

### Fixes

- [e4cafac](https://github.com/dubzzz/pure-rand/commit/e4cafac) 🐛 Add "types" to "exports" (#363)

## 5.0.0

### Breaking Changes

- [4d43670](https://github.com/dubzzz/pure-rand/commit/4d43670) 💥 Remove old API of `RandomGenerator` (#245)

### Features

- [64c9033](https://github.com/dubzzz/pure-rand/commit/64c9033) 🏷️ Remove never used type (#253)
- [79dcea6](https://github.com/dubzzz/pure-rand/commit/79dcea6) ⚡️ Re-implement safe skipN/generateN with unsafe ones (#251)
- [1137604](https://github.com/dubzzz/pure-rand/commit/1137604) ⚡️ Add unsafe version of `uniformArrayIntDistribution` (#252)
- [1d23433](https://github.com/dubzzz/pure-rand/commit/1d23433) ⚡️ Add unsafe version of `uniformBigIntDistribution` (#250)
- [eb6fdea](https://github.com/dubzzz/pure-rand/commit/eb6fdea) ⚡️ Add unsafe version of `uniformIntDistribution` (#249)
- [0c66c2a](https://github.com/dubzzz/pure-rand/commit/0c66c2a) ⚡️ Prefer unsafe for internal on uniform array-int distributions (#248)
- [d4b6353](https://github.com/dubzzz/pure-rand/commit/d4b6353) ⚡️ Prefer unsafe for internal on uniform int distributions (#247)
- [ac1afe1](https://github.com/dubzzz/pure-rand/commit/ac1afe1) 🏷️ Introduce typings for `UnsafeDistribution` (#246)
- [5b29db5](https://github.com/dubzzz/pure-rand/commit/5b29db5) ✨ Migrate congruential to new API (#244)
- [b5da3e9](https://github.com/dubzzz/pure-rand/commit/b5da3e9) ✨ Migrate mersenne to new API (#243)
- [08cb943](https://github.com/dubzzz/pure-rand/commit/08cb943) ✨ Migrate xorshift to new API (#242)
- [1c8b02f](https://github.com/dubzzz/pure-rand/commit/1c8b02f) ✨ Migrate xoroshiro to new API (#241)
- [153895c](https://github.com/dubzzz/pure-rand/commit/153895c) ⚡️ Avoid creating an unneeded instance in `xoroshiro::jump` (#239)
- [fa94947](https://github.com/dubzzz/pure-rand/commit/fa94947) ⚡️ Avoid creating an unneeded instance in `xoroshiro::jump` (#239)
- [bbad88f](https://github.com/dubzzz/pure-rand/commit/bbad88f) 🏷️ Add temporary typings of `RandomGeneratorWithUnsafe` (#238)
- [dbc8582](https://github.com/dubzzz/pure-rand/commit/dbc8582) 🚧 Temporarily add a forked interface for `RandomGenerator` (#235)

### Fixes

- [1eb1467](https://github.com/dubzzz/pure-rand/commit/1eb1467) ✅ Add test helpers for new generators (#240)
