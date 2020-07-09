// @ts-check
// This file is a sample snippet to run a profiler on
// Run it:
// $:  tsc --target es6
// $:  PROF_TYPE=next PROF_GEN=xoroshiro128plus node --prof --no-logfile-per-isolate --trace-deopt --trace-opt-verbose perf/profiler.cjs
// $:  node --prof-process v8.log > v8.out
const { genFor } = require('./helpers.cjs');
const {
  testNext,
  testJump,
  testGenerateWithSameDistribution,
  testGenerateWithSkipDistribution,
} = require('./tasks.cjs');
const prand = require('../lib/pure-rand');

const NUM_TESTS = 10000000;
const PROF_TYPE = process.env.PROF_TYPE || 'skip';
const PROF_GEN = process.env.PROF_GEN || 'congruential32';
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
  case 'same':
    testGenerateWithSameDistribution(prand, g, NUM_TESTS);
    break;
  case 'skip':
    testGenerateWithSkipDistribution(prand, g, NUM_TESTS);
    break;
}
