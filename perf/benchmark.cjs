// @ts-check
// This file is a sample snippet to run benchmark across versions
// Run it:
// $:  yarn build:bench:old
// $:  yarn build:bench:new
// $:  node perf/benchmark.cjs
//
// Or against another generator:
// $:  PROF_GEN="mersenne" node perf/benchmark.cjs

const { genFor } = require('./helpers.cjs');
const { testDistribution } = require('./tasks.cjs');
const Benchmark = require('benchmark');
const prandRef = require('../lib/pure-rand');
const prandTest = require('../lib-new/pure-rand');

const PRERUN_SAMPLES = 100;
const WARMUP_SAMPLES = 1000;
const MIN_SAMPLES = 1000;
const benchConf = { initCount: WARMUP_SAMPLES, minSamples: MIN_SAMPLES };

const NUM_TESTS = 1000;
const PROF_GEN = process.env.PROF_GEN || 'xoroshiro128plus';
console.log(`Generator: ${PROF_GEN}\n`);

// Declare builder of benchmarks
const buildBenchmarks = (type, lib) => {
  return [
    new Benchmark(
      `uniformIntDistribution[0;96]...............................@${type}`,
      () => {
        // Range size is prime
        const g = genFor(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: 0, max: 0xffff };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
      benchConf
    ),
    new Benchmark(
      `uniformIntDistribution[0;0xffff]...........................@${type}`,
      () => {
        // Range size is a small power of 2
        const g = genFor(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: 0, max: 0xffff };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
      benchConf
    ),
    new Benchmark(
      `uniformIntDistribution[0;0xffffffff].......................@${type}`,
      () => {
        // For range of size <=2**32 (ie to-from+1 <= 2**32)
        // uniformIntDistribution uses another execution path
        const g = genFor(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: 0, max: 0xffffffff };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
      benchConf
    ),
    new Benchmark(
      `uniformIntDistribution[0;0xffffffff+1].....................@${type}`,
      () => {
        // Range size is just above threshold used by uniformIntDistribution
        // to switch to another algorithm
        const g = genFor(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: 0, max: 0xffffffff + 1 };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
      benchConf
    ),
    new Benchmark(
      `uniformIntDistribution[MIN_SAFE_INTEGER;MAX_SAFE_INTEGER]..@${type}`,
      () => {
        // Range size is the maximal one
        const g = genFor(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
      benchConf
    ),
  ];
};

// Declare benchmarks
const benchmarks = [...buildBenchmarks('Reference', prandRef), ...buildBenchmarks('Test', prandTest)];

// Run all the code of all the benchmarks at least once before running them for measurements.
// It ensures that non-optimized path will not be wrongly optimized. In the past we had reports like:
//   test1 @reference - 400 ops/s
//   test2 @reference - 200 ops/s
//   test1 @reference - 200 ops/s
//   test2 @reference - 200 ops/s
// Because running test2 de-optimized the code that was optimized for test1 during first runs.
for (const b of benchmarks) {
  for (let idx = 0; idx !== PRERUN_SAMPLES; ++idx) {
    if (typeof b.fn === 'function') {
      b.fn();
    } else {
      eval(b.fn);
    }
  }
}

// Run benchmarks
Benchmark.invoke(benchmarks, {
  name: 'run',
  queued: true,
  onCycle: (event) => console.log(String(event.target)),
});
