# CHANGELOG 3.X

## 3.1.0

### Features

- [21990ee](https://github.com/dubzzz/pure-rand/commit/21990ee) ⚡ Faster computation of uniformBigInt (#64)
- [a7cc22e](https://github.com/dubzzz/pure-rand/commit/a7cc22e) ⚡ Improve performances of uniform distributions on wide ranges (#53)

### Fixes

- [22da324](https://github.com/dubzzz/pure-rand/commit/22da324) 💡 Add some comments concerning possible overflows (#57)
- [d1cda0a](https://github.com/dubzzz/pure-rand/commit/d1cda0a) 🔥 Remove useless configuration files
- [a52bbb1](https://github.com/dubzzz/pure-rand/commit/a52bbb1) ✅ Add snapshots for distributions to avoid regressions (#52)

## 3.0.0

### Breaking Changes

- [4a14bce](https://github.com/dubzzz/pure-rand/commit/4a14bce) (💥)✨ Support ES Modules and CommonJS (#35)
- [1563d5e](https://github.com/dubzzz/pure-rand/commit/1563d5e) 💥 Remove support for TypeScript <3.2 (#33)

### Features

- [5301ffc](https://github.com/dubzzz/pure-rand/commit/5301ffc) ✨ Add metadata on the generated sources and .js on esm imports (#34)
- [c92e942](https://github.com/dubzzz/pure-rand/commit/c92e942) ⚡️ Replace product32bits by Math.imul in mersenne
- [ab8b82d](https://github.com/dubzzz/pure-rand/commit/ab8b82d) ⚡️ Replace toUint32 in mersenne by >>>0

### Fixes

- [a33fc65](https://github.com/dubzzz/pure-rand/commit/a33fc65) 🔨 Add some types of profilers into profiler.cjs (#37)
- [8f5b252](https://github.com/dubzzz/pure-rand/commit/8f5b252) 🎨 Move scripts for benchmark to cjs (#36)
- [f5ca954](https://github.com/dubzzz/pure-rand/commit/f5ca954) 🔧 Migrate to yarn (#30)
- [cc739b4](https://github.com/dubzzz/pure-rand/commit/cc739b4) 🔧 Bump prettier (#29)
- [3955c2d](https://github.com/dubzzz/pure-rand/commit/3955c2d) 🔧 Update .travis.yml
- [75311b1](https://github.com/dubzzz/pure-rand/commit/75311b1) 🔧 Update .travis.yml
- [074d0bf](https://github.com/dubzzz/pure-rand/commit/074d0bf) 🔧 Do not run travis outside of master and PRs for master
- [96790fd](https://github.com/dubzzz/pure-rand/commit/96790fd) 🔧 Create dependabot.yml
