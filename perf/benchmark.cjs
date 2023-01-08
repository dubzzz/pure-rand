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
const libReference = require('../lib/pure-rand-default');
const libTest = require('../lib/wasm/wasm');

const SEED = Date.now() | 0;
console.info(`Seed     : ${SEED}\n`);

const numInts = 100_000;
const numIterations = 1_000;

function noDistribution(from, to, g) {
  const out = g.unsafeNext();
  return from + (out % (to - from + 1));
}

function fillBench(bench) {
  bench.add('reference (no-distrib)', () => {
    const g = libReference.xoroshiro128plus(SEED);
    for (let i = 0; i !== numInts; ++i) {
      noDistribution(0, i, g);
    }
  });
  bench.add('test (no-distrib)', () => {
    const g = libTest.xoroShiro128Plus(SEED);
    for (let i = 0; i !== numInts; ++i) {
      noDistribution(0, i, g);
    }
  });
  bench.add('reference', () => {
    const g = libReference.xoroshiro128plus(SEED);
    for (let i = 0; i !== numInts; ++i) {
      libReference.unsafeUniformIntDistribution(0, i, g);
    }
  });
  bench.add('test', () => {
    const g = libTest.xoroShiro128Plus(SEED);
    for (let i = 0; i !== numInts; ++i) {
      libReference.unsafeUniformIntDistribution(0, i, g);
    }
  });
  bench.add('reference (large)', () => {
    const g = libReference.xoroshiro128plus(SEED);
    for (let i = 0; i !== numInts; ++i) {
      libReference.unsafeUniformIntDistribution(0, 0xffff_ffff + i, g);
    }
  });
  bench.add('test (large)', () => {
    const g = libTest.xoroShiro128Plus(SEED);
    for (let i = 0; i !== numInts; ++i) {
      libReference.unsafeUniformIntDistribution(0, 0xffff_ffff + i, g);
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
