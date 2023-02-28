// @ts-check
const { Bench } = require('tinybench');
const prand = require('../lib/pure-rand');
const Chance = require('chance');
const { faker } = require('@faker-js/faker');
const { Random, MersenneTwister19937 } = require('random-js');

// Algorithms under tests
function fisherYates(data, rand) {
  // for i from n−1 downto 1 do
  //j ← random integer such that 0 ≤ j ≤ i
  //exchange a[j] and a[i]
  for (let i = data.length - 1; i >= 1; --i) {
    const j = rand(0, i); // such that 0 ≤ j ≤ i
    const tmp = data[j];
    data[j] = data[i];
    data[i] = tmp;
  }
}

async function run() {
  // Global Setup
  const numIterations = 1_000;
  const seed = Date.now() | 0;
  const bench = new Bench({ warmupIterations: Math.ceil(numIterations / 20), iterations: numIterations });
  const data = [...Array(1_000_000)].map((_, i) => i);

  // Add algorithms (shuffling 1M items)
  bench.add('[native]', () => {
    const rand = (min, max) => {
      return min + Math.floor(Math.random() * (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('pure-rand', () => {
    const g = prand.xorshift128plus(seed);
    const rand = (min, max) => {
      return prand.unsafeUniformIntDistribution(min, max, g);
    };
    fisherYates(data, rand);
  });
  bench.add('chance', () => {
    const chance = new Chance();
    const rand = (min, max) => {
      return chance.integer({ min, max });
    };
    fisherYates(data, rand);
  });
  bench.add('faker', () => {
    const rand = (min, max) => {
      return faker.datatype.number({ min, max });
    };
    fisherYates(data, rand);
  });
  bench.add('random-js', () => {
    const random = new Random(MersenneTwister19937.seed(seed));
    const rand = (min, max) => {
      return random.integer(min, max);
    };
    fisherYates(data, rand);
  });

  // Run the benchmark
  await bench.warmup();
  await bench.run();

  // Log the results
  console.table(
    bench.tasks.map(({ name, result }) => {
      return {
        Library: name,
        Mean: result?.mean,
        P75: result?.p75,
        P99: result?.p99,
        RME: result?.rme,
      };
    })
  );
}
run();
