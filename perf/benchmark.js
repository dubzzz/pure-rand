// @ts-check
// This file is a sample snippet to run benchmark accross versions
// Run it:
// $:  npm run build:bench:old
// $:  npm run build:bench:new
// $:  node perf/benchmark.js
//
// Or against another generator:
// $:  PROF_GEN="mersenne" node perf/benchmark.js

const { genFor } = require('./helpers');
const {
  testGenerateWithSameDistribution,
  testGenerateWithSkipDistributionSingle,
  testGenerateWithSkipDistribution
} = require('./tasks');
const Benchmark = require('benchmark');
const prandRef = require('../lib/pure-rand');
const prandTest = require('../lib-new/pure-rand');

const WARMUP_SAMPLES = 50;
const MIN_SAMPLES = 250;
const benchConf = { initCount: WARMUP_SAMPLES, minSamples: MIN_SAMPLES };

const NUM_TESTS = 100;
const PROF_GEN = process.env.PROF_GEN || 'congruential32';
console.log(`Generator....: ${PROF_GEN}\n`);

const buildBenchmarks = (type, lib) => {
  return [
    new Benchmark(
      `distribution/no@${type}`,
      () => {
        const g = genFor(lib, PROF_GEN);
        testGenerateWithSkipDistribution(lib, g, NUM_TESTS);
      },
      benchConf
    ),
    new Benchmark(
      `distribution/re-use@${type}`,
      () => {
        const g = genFor(lib, PROF_GEN);
        testGenerateWithSameDistribution(lib, g, NUM_TESTS);
      },
      benchConf
    ),
    new Benchmark(
      `generator/new@${type}`,
      () => {
        const g = genFor(lib, PROF_GEN);
        testGenerateWithSkipDistributionSingle(lib, g);
      },
      benchConf
    )
  ];
};

Benchmark.invoke(
  [
    ...buildBenchmarks('Reference', prandRef),
    ...buildBenchmarks('Test', prandTest),
    ...buildBenchmarks('Reference', prandRef),
    ...buildBenchmarks('Test', prandTest)
  ],
  {
    name: 'run',
    queued: true,
    onCycle: event => console.log(String(event.target))
  }
);
