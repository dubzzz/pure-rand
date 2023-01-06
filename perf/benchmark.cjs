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
const libReference = require('../lib/pure-rand');
const libTest = require('../lib/wasm/wasm');

const SEED = Date.now();
const PROF_GEN = process.argv[2] || 'xoroshiro128plus';
const profGenBuilder = libReference[PROF_GEN];
const profGenBuilderNew = libTest[PROF_GEN];
console.info(`Generator: ${PROF_GEN}`);
console.info(`Seed     : ${SEED}\n`);

const numInts = 100_000;
const numIterations = 1_000;

function noDistribution(from, to, g) {
  const out = g.unsafeNext();
  return from + (out % (to - from + 1));
}

function fillBench(bench) {
  let g = profGenBuilder(SEED);

  function setup(t) {
    if (t.name.startWith('reference')) g = profGenBuilder(SEED);
    else if (t.name.startWith('test')) g = profGenBuilderNew(SEED);
    else throw new Error(`Unknown task ${t.name}`);
  }
  bench.setup(setup, 'warmup');
  bench.setup(setup, 'run');

  bench.add('reference (no-distrib)', () => {
    for (let i = 0; i !== numInts; ++i) {
      noDistribution(0, i, g);
    }
  });
  bench.add('test (no-distrib)', () => {
    for (let i = 0; i !== numInts; ++i) {
      noDistribution(0, i, g);
    }
  });
  bench.add('reference', () => {
    for (let i = 0; i !== numInts; ++i) {
      libReference.unsafeUniformIntDistribution(0, i, g);
    }
  });
  bench.add('test', () => {
    for (let i = 0; i !== numInts; ++i) {
      libTest.unsafeUniformIntDistribution(0, i, g);
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
