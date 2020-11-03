// @ts-check
// This file is a sample snippet to run a profiler on
// Run it:
// $:  tsc --target es6
// $:  PROF_TYPE=next PROF_GEN=xoroshiro128plus node --prof --no-logfile-per-isolate --trace-deopt --trace-opt-verbose perf/profiler.cjs
// $:  node --prof-process v8.log > v8.out
const { genFor } = require('./helpers.cjs');
const { testNext, testJump, testDistribution } = require('./tasks.cjs');
const prand = require('../lib/pure-rand');

const NUM_TESTS = 10000000;
const PROF_TYPE = process.env.PROF_TYPE || 'distrib';
const PROF_GEN = process.env.PROF_GEN || 'xoroshiro128plus';
console.log(`Profiler type: ${PROF_TYPE}`);
console.log(`Generator....: ${PROF_GEN}`);

const g = genFor(prand, PROF_GEN);
switch (PROF_TYPE) {
  case 'next':
    testNext(g, NUM_TESTS);
    break;
  case 'jump':
    testJump(g, NUM_TESTS);
    break;
  case 'distrib':
    testDistribution(prand.uniformIntDistribution, g, NUM_TESTS);
    break;
  case 'distrib-large':
    testDistribution(prand.uniformIntDistribution, g, NUM_TESTS, {
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
    });
    break;
}
