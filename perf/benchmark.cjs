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
const { countCallsToNext } = require('./helpers.cjs');

const PRERUN_SAMPLES = 50;
const WARMUP_SAMPLES = 1000;
const MIN_SAMPLES = 1000;
const benchConf = { initCount: WARMUP_SAMPLES, minSamples: MIN_SAMPLES };

const NUM_TESTS = 1000;
const PROF_GEN = process.env.PROF_GEN || 'xoroshiro128plus';
console.log(`Generator: ${PROF_GEN}\n`);

// Declare configuration matrix
const configurations = [
  ['Reference', prandRef],
  ['Test', prandTest],
];

// Declare performance tests
const performanceTests = [
  {
    name: (type) => `uniformIntDistribution[0;96]...............................@${type}`,
    run: (lib, customGen = genFor) => {
      // Range size is prime
      const g = customGen(lib, PROF_GEN);
      const distribution = lib.uniformIntDistribution;
      const settings = { min: 0, max: 0xffff };
      testDistribution(distribution, g, NUM_TESTS, settings);
    },
  },
  {
    name: (type) => `uniformIntDistribution[0;0xffff]...........................@${type}`,
    run: (lib, customGen = genFor) => {
      // Range size is a small power of 2
      const g = customGen(lib, PROF_GEN);
      const distribution = lib.uniformIntDistribution;
      const settings = { min: 0, max: 0xffff };
      testDistribution(distribution, g, NUM_TESTS, settings);
    },
  },
  {
    name: (type) => `uniformIntDistribution[0;0xffffffff].......................@${type}`,
    run: (lib, customGen = genFor) => {
      // For range of size <=2**32 (ie to-from+1 <= 2**32)
      // uniformIntDistribution uses another execution path
      const g = customGen(lib, PROF_GEN);
      const distribution = lib.uniformIntDistribution;
      const settings = { min: 0, max: 0xffffffff };
      testDistribution(distribution, g, NUM_TESTS, settings);
    },
  },
  {
    name: (type) => `uniformIntDistribution[0;0xffffffff+1].....................@${type}`,
    run: (lib, customGen = genFor) => {
      // Range size is just above threshold used by uniformIntDistribution
      // to switch to another algorithm
      const g = customGen(lib, PROF_GEN);
      const distribution = lib.uniformIntDistribution;
      const settings = { min: 0, max: 0xffffffff + 1 };
      testDistribution(distribution, g, NUM_TESTS, settings);
    },
  },
  {
    name: (type) => `uniformIntDistribution[MIN_SAFE_INTEGER;MAX_SAFE_INTEGER]..@${type}`,
    run: (lib, customGen = genFor) => {
      // Range size is the maximal one
      const g = customGen(lib, PROF_GEN);
      const distribution = lib.uniformIntDistribution;
      const settings = { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER };
      testDistribution(distribution, g, NUM_TESTS, settings);
    },
  },
];

// Declare the benchmarks
const benchmarks = configurations.flatMap(([type, lib]) =>
  performanceTests.map((test) => new Benchmark(test.name(type), () => test.run(lib), benchConf))
);

// Simple checks concerning number of calls to the underlying generators
console.log(`Measuring number of calls to next...\n`);
for (const test of performanceTests) {
  for (const [type, lib] of configurations) {
    const [g, counter] = countCallsToNext(genFor(lib, PROF_GEN));
    test.run(lib, () => g);
    console.log(`${test.name(type)} called generator on next ${counter.count} times`);
  }
}
console.log(``);

// Run all the code of all the benchmarks at least once before running them for measurements.
// It ensures that non-optimized path will not be wrongly optimized. In the past we had reports like:
//   test1 @reference - 400 ops/s
//   test2 @reference - 200 ops/s
//   test1 @reference - 200 ops/s
//   test2 @reference - 200 ops/s
// Because running test2 de-optimized the code that was optimized for test1 during first runs.
console.log(`Warm-up phase...\n`);
Benchmark.invoke(
  benchmarks.map((b) => b.clone({ initCount: 1, minSamples: PRERUN_SAMPLES })),
  {
    name: 'run',
    queued: true,
    onCycle: (event) => console.log(String(event.target)),
  }
);

// Run benchmarks
console.log(`\nBenchmark phase...\n`);
Benchmark.invoke(benchmarks, {
  name: 'run',
  queued: true,
  onCycle: (event) => console.log(String(event.target)),
});
