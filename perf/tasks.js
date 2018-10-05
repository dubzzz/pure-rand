// @ts-check

// Avoid the construction of an intermediate distribution
exports.testGenerateWithSkipDistribution = (lib, g, NUM_TESTS) => {
    for (let idx = 0 ; idx !== NUM_TESTS ; ++idx) {
        g = lib.uniformIntDistribution(0, 0xffffffff, g)[1];
    }
    return g;
};

// Build the distribution once
// then generate multiple values using it
exports.testGenerateWithSameDistribution = (lib, g, NUM_TESTS) => {
    const dist = lib.uniformIntDistribution(0, 0xffffffff);
    for (let idx = 0 ; idx !== NUM_TESTS ; ++idx) {
        g = dist(g)[1];
    }
    return g;
};
