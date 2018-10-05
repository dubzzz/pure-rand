// @ts-check
// This file is a sample snippet to run a profiler on
// Run it:
// $:  tsc --target es6
// $:  node --prof --no-logfile-per-isolate perf/profiler.js
// $:  node --prof-process v8.log > v8.out
const prand = require('../lib/pure-rand');

const NUM_TESTS = 10000000;

// Build a new distribution for each run
const testGenerateWithNewDistribution = (lib, g) => {
    for (let idx = 0 ; idx !== NUM_TESTS ; ++idx) {
        const dist = lib.uniformIntDistribution(0, 0xffffffff);
        g = dist(g)[1];
    }
    return g;
};

// Build the distribution once
// then generate multiple values using it
const testGenerateWithSameDistribution = (lib, g) => {
    const dist = lib.uniformIntDistribution(0, 0xffffffff);
    for (let idx = 0 ; idx !== NUM_TESTS ; ++idx) {
        g = dist(g)[1];
    }
    return g;
};

// Build a generator for
const genFor = (lib, genName) => {
    return prand[genName](0, 0xffffffff);
};

const PROF_TYPE = process.env.PROF_TYPE || 'new';
const PROF_GEN = process.env.PROF_GEN || 'congruential32';

console.log(`Profiler type: ${PROF_TYPE}`);
console.log(`Generator....: ${PROF_GEN}`);

const g = genFor(prand, PROF_GEN);
switch (PROF_TYPE) {
    case 'same': testGenerateWithSameDistribution(prand, g); break;
    case 'new':  testGenerateWithNewDistribution(prand, g);  break;
}
