# CHANGELOG 4.X

## 4.2.1

### Fixes

- [153895c](https://github.com/dubzzz/pure-rand/commit/153895c) ⚡️ Avoid creating an unneeded instance in `xoroshiro::jump` (#239)

## 4.2.0

### Features

- [44a96be](https://github.com/dubzzz/pure-rand/commit/44a96be) ⚡️ Faster jump for `xoroshiro` by avoiding intermediate instances (#232)
- [e277205](https://github.com/dubzzz/pure-rand/commit/e277205) ⚡️ Faster `jump` for xorshift by avoiding intermediate instances (#231)

### Fixes

- [c95a0a2](https://github.com/dubzzz/pure-rand/commit/c95a0a2) 👷 Rename script `format:fix` into `format` (#234)
- [124e6b5](https://github.com/dubzzz/pure-rand/commit/124e6b5) ⬆️ Bump prettier from 2.2.1 to 2.3.0 (#218)
- [a760fb6](https://github.com/dubzzz/pure-rand/commit/a760fb6) 👷 Drop node 10 from build chain and move to node 16 (#233)

## 4.1.2

### Fixes

- [123313f](https://github.com/dubzzz/pure-rand/commit/123313f) 🚚 Rename master into main (#175)
- [d108d64](https://github.com/dubzzz/pure-rand/commit/d108d64) 💰 Add funding details (#174)
- [944c593](https://github.com/dubzzz/pure-rand/commit/944c593) 👷 Move CI to gh actions (#171)

## 4.1.1

### Fixes

- [b26320a](https://github.com/dubzzz/pure-rand/commit/b26320a) 🐛 Prevent infinite loops when array int for from and to start by zeros (#143)

## 4.1.0

### Features

- [b71a557](https://github.com/dubzzz/pure-rand/commit/b71a557) ✨ Add uniform distribution for ranges outside of integers (#141)

### Fixes

- [8db6236](https://github.com/dubzzz/pure-rand/commit/8db6236) 🔖 Back to 4.1.0 as publications for both 4.1.0 and 4.1.1 fail
- [cefbf62](https://github.com/dubzzz/pure-rand/commit/cefbf62) 👷 Update travis key
- [7a65041](https://github.com/dubzzz/pure-rand/commit/7a65041) 🚑 Add missing uniformArrayIntDistribution in 4.1.x

## 4.0.0

- [df3d188](https://github.com/dubzzz/pure-rand/commit/df3d188) 🐛 uniformIntDistribution not uniform for gaps outside of 32 bits integers (#117)
- [0322eb5](https://github.com/dubzzz/pure-rand/commit/0322eb5) 🔧 Clean warnings related to ts-jest (#130)
- [4fed949](https://github.com/dubzzz/pure-rand/commit/4fed949) 🔨 Faster and more precise benchmarks (#129)
- [eceb8fd](https://github.com/dubzzz/pure-rand/commit/eceb8fd) 🔨 Benchmark `--allow-local-changes` failed to un-stash (#126)
- [8f358da](https://github.com/dubzzz/pure-rand/commit/8f358da) 🔨 Reports for benchmarks expose a confidence range option (#125)
- [dd39020](https://github.com/dubzzz/pure-rand/commit/dd39020) 🔨 Rework benchmarks test suite of `pure-rand` (#123)
- [c55f987](https://github.com/dubzzz/pure-rand/commit/c55f987) ♻️ Extract internal logic of uniformIntDistribution into shared internals (#116)
- [670e2ab](https://github.com/dubzzz/pure-rand/commit/670e2ab) 📝 Add JSDoc on public code in /distribution (#115)
- [cde43b5](https://github.com/dubzzz/pure-rand/commit/cde43b5) Revert "👷 Update dependabot configuration on versioning-strategy"
- [56b1546](https://github.com/dubzzz/pure-rand/commit/56b1546) 👷 Update dependabot configuration on versioning-strategy
