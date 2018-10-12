// @ts-check

// Build a generator for
exports.genFor = (lib, genName) => {
  const seed = 42;
  return lib[genName](seed);
};
