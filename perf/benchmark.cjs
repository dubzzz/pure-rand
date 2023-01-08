// @ts-check
// This file is a sample snippet to run benchmark across versions
// Run it:
// $:  yarn build:bench:old
// $:  yarn build:bench:new
// $:  yarn bench
//
// Or against another generator:
// $:  yarn bench mersenne

const { Bench } = require('tinybench');
const libReference = require('../lib-reference/pure-rand-default');
const libTest = require('../lib-test/pure-rand-default');

const SEED = Date.now() | 0;
const PROF_GEN = process.argv[2] || 'xoroshiro128plus';
console.info(`Generator: ${PROF_GEN}`);
console.info(`Seed     : ${SEED}\n`);

const numInts = 100_000;
const numIterations = 1_000;

function noDistribution(from, to, g) {
  const out = g.unsafeNext();
  return from + (out % (to - from + 1));
}

function fillBench(bench) {
  bench.add('reference (no distrib)', () => {
    const g = libReference[PROF_GEN](SEED);
    for (let i = 0; i !== numInts; ++i) {
      noDistribution(0, i, g);
    }
  });
  bench.add('reference (uniform small)', () => {
    const g = libReference[PROF_GEN](SEED);
    for (let i = 0; i !== numInts; ++i) {
      libReference.unsafeUniformIntDistribution(0, i, g);
    }
  });
  bench.add('reference (uniform large)', () => {
    const g = libReference[PROF_GEN](SEED);
    for (let i = 0; i !== numInts; ++i) {
      libReference.unsafeUniformIntDistribution(-0x1_0000_0000, i, g);
    }
  });
  bench.add('test (no distrib)', () => {
    const g = libTest[PROF_GEN](SEED);
    for (let i = 0; i !== numInts; ++i) {
      noDistribution(0, i, g);
    }
  });
  bench.add('test (uniform small)', () => {
    const g = libTest[PROF_GEN](SEED);
    for (let i = 0; i !== numInts; ++i) {
      libTest.unsafeUniformIntDistribution(0, i, g);
    }
  });
  bench.add('test (uniform large)', () => {
    const g = libTest[PROF_GEN](SEED);
    for (let i = 0; i !== numInts; ++i) {
      libTest.unsafeUniformIntDistribution(-0x1_0000_0000, i, g);
    }
  });
}

async function runner() {
  const bench = new Bench({ warmupIterations: Math.ceil(numIterations / 20), iterations: numIterations });
  fillBench(bench);
  await bench.warmup();
  await bench.run();

  console.table(
    bench.tasks.map(({ name, result }) => ({
      'Task Name': name,
      Mean: result?.mean,
      P75: result?.p75,
      P99: result?.p99,
      RME: result?.rme,
    }))
  );
}
runner();
