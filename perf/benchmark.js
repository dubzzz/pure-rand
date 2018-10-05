// @ts-check
// This file is a sample snippet to run benchmark accross versions
// Run it:
// $:  tsc --target es6
// $:  tsc --target es6 --outDir "lib-new/"
// $:  node perf/benchmark.js
const { genFor } = require('./helpers');
const { testGenerateWithSameDistribution, testGenerateWithSkipDistribution } = require('./tasks');
const Benchmark = require('benchmark');
const prandRef = require('../lib/pure-rand');
const prandTest = require('../lib-new/pure-rand');

const WARMUP_SAMPLES = 10000;
const MIN_SAMPLES = 10000;
const NUM_TESTS = 1000;
const PROF_GEN = process.env.PROF_GEN || 'congruential32';
console.log(`Generator....: ${PROF_GEN}\n`);

(new Benchmark.Suite())
    .add('Reference', () => {
        const g = genFor(prandRef, PROF_GEN);
        testGenerateWithSkipDistribution(prandRef, g, NUM_TESTS);
    })
    .add('Test', () => {
        const g = genFor(prandTest, PROF_GEN);
        testGenerateWithSkipDistribution(prandTest, g, NUM_TESTS);
    })
    .on('cycle', (event) => console.log(String(event.target)))
    .on('complete', function() { console.log(`With skip distribution: ${this.filter('fastest').map('name')}\n`); })
    .run({ initCount: WARMUP_SAMPLES, minSamples: MIN_SAMPLES });

(new Benchmark.Suite())
    .add('Reference', () => {
        const g = genFor(prandRef, PROF_GEN);
        testGenerateWithSameDistribution(prandRef, g, NUM_TESTS);
    })
    .add('Test', () => {
        const g = genFor(prandTest, PROF_GEN);
        testGenerateWithSameDistribution(prandTest, g, NUM_TESTS);
    })
    .on('cycle', (event) => console.log(String(event.target)))
    .on('complete', function() { console.log(`With same distribution: ${this.filter('fastest').map('name')}\n`); })
    .run({ initCount: WARMUP_SAMPLES, minSamples: MIN_SAMPLES });
