// @ts-check
// This file is a sample snippet to run benchmark across versions and generators
// Run it:
// $:  npm run build:bench:old
// $:  npm run build:bench:new
// $:  node perf/benchmark-prng.js

const Benchmark = require('benchmark');
const { genFor } = require('./helpers');

const WARMUP_SAMPLES = 100;
const MIN_SAMPLES = 500;
const benchConf = { initCount: WARMUP_SAMPLES, minSamples: MIN_SAMPLES };

const buildPrngNextBenchmark = (lib, generatorName) => {
  const rootRng = genFor(lib, generatorName);
  return new Benchmark(
    `${generatorName}::next`,
    () => {
      let rng = rootRng;
      for (let idx = 0; idx !== 100000; ++idx) {
        const [_, nextRng] = rng.next();
        rng = nextRng;
      }
    },
    benchConf
  );
};

const buildPrngJumpBenchmark = (lib, generatorName) => {
  const rootRng = genFor(lib, generatorName);
  return rootRng.jump
    ? new Benchmark(
        `${generatorName}::jump`,
        () => {
          let rng = rootRng;
          for (let idx = 0; idx !== 100; ++idx) {
            rng = rng.jump();
          }
        },
        benchConf
      )
    : null;
};

const availablePRNGs = ['congruential', 'congruential32', 'mersenne', 'xorshift128plus', 'xoroshiro128plus'];
const PRNGs = [...availablePRNGs];

const prandLibs = [
  // require('../lib-new/pure-rand'),
  require('../lib/pure-rand')
];

Benchmark.invoke(
  [
    ...prandLibs.flatMap(prand => [
      ...PRNGs.map(name => buildPrngNextBenchmark(prand, name)),
      ...PRNGs.map(name => buildPrngJumpBenchmark(prand, name)).filter(Boolean)
    ])
  ],
  {
    name: 'run',
    queued: true,
    onCycle: event => console.log(String(event.target))
  }
);
