// @ts-check
// This file is a sample snippet to run benchmark accross versions
// Run it:
// $:  tsc --target es6
// $:  tsc --target es6 --outDir "lib-new/"
// $:  node perf/benchmark.js
const { genFor } = require('./helpers');
const { testGenerateWithSameDistribution, testGenerateWithSkipDistributionSingle } = require('./tasks');
const Benchmark = require('benchmark');
const prandRef = require('../lib/pure-rand');
const prandTest = require('../lib-new/pure-rand');

const WARMUP_SAMPLES = 100;
const MIN_SAMPLES = 1000;
const benchConf = { initCount: WARMUP_SAMPLES, minSamples: MIN_SAMPLES };

const NUM_TESTS = 100;
const PROF_GEN = process.env.PROF_GEN || 'congruential32';
console.log(`Generator....: ${PROF_GEN}\n`);

const buildBenchmarks = (type, lib) => {
    return [
        new Benchmark(
            `skip@${type}`,
            () => {
                const g = genFor(lib, PROF_GEN);
                testGenerateWithSkipDistributionSingle(prandRef, g);
            }, benchConf),
        new Benchmark(
            `same@${type}`,
            () => {
                const g = genFor(lib, PROF_GEN);
                testGenerateWithSameDistribution(prandRef, g, NUM_TESTS);
            }, benchConf)
    ];
};

Benchmark.invoke(
    [
        ...buildBenchmarks('Reference', prandRef),
        ...buildBenchmarks('Test', prandTest)
    ], {
        name: 'run',
        queued: true,
        onCycle: (event) => console.log(String(event.target)),
    }
);
