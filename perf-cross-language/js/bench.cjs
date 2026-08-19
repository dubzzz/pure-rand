// JS side of the Rust-vs-JS comparison of pure-rand's generators.
// Uses the real built pure-rand generators (run `pnpm build` at the repo root first).
//
// Usage: node bench.cjs <generator> [verify | <seeds> <perSeed> <reps>]
// with <generator> one of: xorshift128plus, xoroshiro128plus, congruential32, mersenne.
//
// Same workload as ../rust/src/main.rs: for each seed, build a generator and
// produce `perSeed` numbers, folding every value into a uint32 checksum so
// both sides can be compared for correctness, not just speed.

const generators = {
  xorshift128plus: require('../../lib/generator/xorshift128plus.js').xorshift128plus,
  xoroshiro128plus: require('../../lib/generator/xoroshiro128plus.js').xoroshiro128plus,
  congruential32: require('../../lib/generator/congruential32.js').congruential32,
  mersenne: require('../../lib/generator/mersenne.js').mersenne,
};

// Same seed derivation as the Rust bench: Knuth multiplicative hash of the index.
function seedAt(i) {
  return Math.imul(i, 2654435761) | 0;
}

function run(makeGenerator, numSeeds, perSeed) {
  let checksum = 0;
  for (let i = 0; i < numSeeds; ++i) {
    const rng = makeGenerator(seedAt(i));
    for (let j = 0; j < perSeed; ++j) {
      checksum = (checksum + rng.next()) | 0;
    }
  }
  return checksum >>> 0;
}

function main() {
  const name = process.argv[2] || 'xorshift128plus';
  const makeGenerator = generators[name];
  if (makeGenerator === undefined) {
    console.error(`Unknown generator '${name}': expected ${Object.keys(generators).join(', ')}`);
    process.exit(1);
  }

  if (process.argv[3] === 'verify') {
    for (const seed of [0, 42, -1, 123456789, -987654321]) {
      const rng = makeGenerator(seed);
      const values = [];
      for (let i = 0; i !== 10; ++i) values.push(rng.next());
      console.log(`seed=${seed} -> ${values.join(',')}`);
    }
    return;
  }

  const numSeeds = Number(process.argv[3] || 100000);
  const perSeed = Number(process.argv[4] || 1000);
  const reps = Number(process.argv[5] || 7);

  // Warmup so the JIT reaches steady state before we measure.
  let sink = 0;
  for (let i = 0; i !== 3; ++i) sink ^= run(makeGenerator, numSeeds, perSeed);
  const checksum = run(makeGenerator, numSeeds, perSeed);
  console.log(`js ${name} | seeds=${numSeeds} per_seed=${perSeed} checksum=${checksum}`);

  const timingsMs = [];
  for (let r = 0; r !== reps; ++r) {
    const start = process.hrtime.bigint();
    sink ^= run(makeGenerator, numSeeds, perSeed);
    timingsMs.push(Number(process.hrtime.bigint() - start) / 1e6);
  }
  if (sink === 0.5) console.log(''); // keep `sink` alive
  timingsMs.sort((a, b) => a - b);
  const best = timingsMs[0];
  const median = timingsMs[timingsMs.length >> 1];
  const total = numSeeds * perSeed;
  console.log(
    `best: ${best.toFixed(2)} ms | median: ${median.toFixed(2)} ms | ` +
      `${((best * 1e6) / total).toFixed(3)} ns/number | ${(total / (best / 1e3)).toFixed(0)} numbers/sec | ` +
      `${((best * 1e3) / numSeeds).toFixed(3)} µs per ${perSeed}-number sequence`,
  );
}

main();
