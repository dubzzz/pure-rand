// @ts-check

// Build a generator for
exports.genFor = (lib, genName) => {
  const seed = 42;
  return lib[genName](seed);
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
