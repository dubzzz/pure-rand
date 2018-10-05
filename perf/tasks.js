// @ts-check

// Build a new distribution for each run
exports.testGenerateWithNewDistribution = (lib, g, NUM_TESTS) => {
    for (let idx = 0 ; idx !== NUM_TESTS ; ++idx) {
        const dist = lib.uniformIntDistribution(0, 0xffffffff);
        g = dist(g)[1];
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
