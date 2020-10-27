// @ts-check

/** Call next multiple times on the passed generator */
exports.testNext = (g, NUM_TESTS) => {
  for (let idx = 0; idx !== NUM_TESTS; ++idx) {
    g = g.next()[1];
  }
  return g;
};

/** Call jump multiple times on the passed generator */
exports.testJump = (g, NUM_TESTS) => {
  for (let idx = 0; idx !== NUM_TESTS; ++idx) {
    g = g.jump();
  }
  return g;
};

/** Avoid the construction of an intermediate distribution */
exports.testDistribution = (distribution, g, NUM_TESTS, settings = { min: 0, max: 0xffffffff }) => {
  for (let idx = 0; idx !== NUM_TESTS; ++idx) {
    g = distribution(settings.min, settings.max, g)[1];
  }
  return g;
};
