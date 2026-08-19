// JS side of the Rust-vs-JS XorShift128+ comparison.
// Uses the real built pure-rand generator (run `pnpm build` at the repo root first).
// Same workload as ../rust/src/main.rs: for each seed, generate `perSeed`
// numbers and fold them into a uint32 checksum so both sides can be compared
// for correctness, not just speed.

const { xorshift128plus } = require('../../lib/generator/xorshift128plus.js');

// Same seed derivation as the Rust bench: Knuth multiplicative hash of the index.
function seedAt(i) {
  return Math.imul(i, 2654435761) | 0;
}

function run(numSeeds, perSeed) {
  let checksum = 0;
  for (let i = 0; i < numSeeds; ++i) {
    const rng = xorshift128plus(seedAt(i));
    for (let j = 0; j < perSeed; ++j) {
      checksum = (checksum + rng.next()) | 0;
    }
  }
  return checksum >>> 0;
}

function main() {
  if (process.argv[2] === 'verify') {
    for (const seed of [0, 42, -1, 123456789, -987654321]) {
      const rng = xorshift128plus(seed);
      const values = [];
      for (let i = 0; i !== 10; ++i) values.push(rng.next());
      console.log(`seed=${seed} -> ${values.join(',')}`);
    }
    return;
  }

  const numSeeds = Number(process.argv[2] || 100000);
  const perSeed = Number(process.argv[3] || 1000);
  const reps = Number(process.argv[4] || 7);

  // Warmup so the JIT reaches steady state before we measure.
  let sink = 0;
  for (let i = 0; i !== 3; ++i) sink ^= run(numSeeds, perSeed);
  const checksum = run(numSeeds, perSeed);
  console.log(`js xorshift128plus | seeds=${numSeeds} per_seed=${perSeed} checksum=${checksum}`);

  const timingsMs = [];
  for (let r = 0; r !== reps; ++r) {
    const start = process.hrtime.bigint();
    sink ^= run(numSeeds, perSeed);
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
