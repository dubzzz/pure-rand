// @ts-check

let seed = 0;
// Build a generator for
exports.genFor = (lib, genName, askedSeed) => {
  seed = (seed + 1) | 0;
  return lib[genName](askedSeed || seed);
};

// Build a wrapper around a generator to count calls to next
exports.countCallsToNext = (gen) => {
  const data = { count: 0 };
  class Wrapper {
    constructor(g) {
      this.g = g;
    }
    min() {
      return this.g.min();
    }
    max() {
      return this.g.max();
    }
    next() {
      data.count += 1;
      const [v, ng] = this.g.next();
      return [v, new Wrapper(ng)];
    }
  }
  return [new Wrapper(gen), data];
};
