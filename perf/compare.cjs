// @ts-check
const { Bench } = require('tinybench');
const prand = require('../lib/pure-rand');
const Chance = require('chance');
const { faker } = require('@faker-js/faker');
const { Random, MersenneTwister19937 } = require('random-js');
var seedrandom = require('seedrandom');

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
  bench.add('pure-rand (xorshift128plus) (not uniform)', () => {
    const g = prand.xorshift128plus(seed);
    const rand = (min, max) => {
      const out = g.unsafeNext() >>> 0;
      return min + (out % (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('pure-rand (xoroshiro128plus) (not uniform)', () => {
    const g = prand.xoroshiro128plus(seed);
    const rand = (min, max) => {
      const out = g.unsafeNext() >>> 0;
      return min + (out % (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('pure-rand (mersenne) (not uniform)', () => {
    const g = prand.mersenne(seed);
    const rand = (min, max) => {
      const out = g.unsafeNext() >>> 0;
      return min + (out % (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('pure-rand (congruential32) (not uniform)', () => {
    const g = prand.congruential32(seed);
    const rand = (min, max) => {
      const out = g.unsafeNext() >>> 0;
      return min + (out % (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('pure-rand (xorshift128plus)', () => {
    const g = prand.xorshift128plus(seed);
    const rand = (min, max) => {
      return prand.unsafeUniformIntDistribution(min, max, g);
    };
    fisherYates(data, rand);
  });
  bench.add('pure-rand (xoroshiro128plus)', () => {
    const g = prand.xoroshiro128plus(seed);
    const rand = (min, max) => {
      return prand.unsafeUniformIntDistribution(min, max, g);
    };
    fisherYates(data, rand);
  });
  bench.add('pure-rand (mersenne)', () => {
    const g = prand.mersenne(seed);
    const rand = (min, max) => {
      return prand.unsafeUniformIntDistribution(min, max, g);
    };
    fisherYates(data, rand);
  });
  bench.add('pure-rand (congruential32)', () => {
    const g = prand.congruential32(seed);
    const rand = (min, max) => {
      return prand.unsafeUniformIntDistribution(min, max, g);
    };
    fisherYates(data, rand);
  });
  bench.add('chance', () => {
    const chance = new Chance(seed);
    const rand = (min, max) => {
      return chance.integer({ min, max });
    };
    fisherYates(data, rand);
  });
  bench.add('faker', () => {
    faker.seed(seed);
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
  bench.add('seedrandom (alea)', () => {
    const random = seedrandom.alea(String(seed));
    const rand = (min, max) => {
      return min + Math.floor(random() * (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('seedrandom (xor128)', () => {
    const random = seedrandom.xor128(String(seed));
    const rand = (min, max) => {
      return min + Math.floor(random() * (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('seedrandom (tychei)', () => {
    const random = seedrandom.tychei(String(seed));
    const rand = (min, max) => {
      return min + Math.floor(random() * (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('seedrandom (xorwow)', () => {
    const random = seedrandom.xorwow(String(seed));
    const rand = (min, max) => {
      return min + Math.floor(random() * (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('seedrandom (xor4096)', () => {
    const random = seedrandom.xor4096(String(seed));
    const rand = (min, max) => {
      return min + Math.floor(random() * (max - min + 1));
    };
    fisherYates(data, rand);
  });
  bench.add('seedrandom (xorshift7)', () => {
    const random = seedrandom.xorshift7(String(seed));
    const rand = (min, max) => {
      return min + Math.floor(random() * (max - min + 1));
    };
    fisherYates(data, rand);
  });

  // Run the benchmark
  await bench.warmup();
  await bench.run();

  // Log the results
  console.table(
    bench.tasks.map(({ name, result }) => {
      return { Library: name, Mean: result?.mean };
    })
  );
}
run();
