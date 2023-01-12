// @ts-check
// This file is a sample snippet to run benchmark across versions
// Run it:
// $:  yarn build:bench:old
// $:  yarn build:bench:new
// $:  yarn bench
//
// Or against another generator:
// $:  yarn bench mersenne
//
// Or only benchmark generators against each others on new:
// $:  yarn bench self
//
// Or only benchmarks on new against default generator:
// $:  yarn bench alone

const { Bench } = require('tinybench');

const PROF_GEN = process.argv[2] || 'xoroshiro128plus';
const NUM_RUNS = process.argv[3] || '';
const NUM_INTS = process.argv[4] || '';

const numIterations = Number.isNaN(+NUM_RUNS) ? 1_000 : +NUM_RUNS;
const numInts = Number.isNaN(+NUM_INTS) ? 100 : +NUM_INTS;

console.info(`Generator      : ${PROF_GEN}`);
console.info(`Iterations     : ${numIterations}`);
console.info(`Numbers per run: ${numInts}`);

function builtInNoDistribution(from, to) {
  const out = Math.random();
  return from + ~~(out * (to - from + 1)); // ~~ is Math.floor
}

function noDistribution(from, to, g) {
  const out = g.unsafeNext() >>> 0;
  return from + (out % (to - from + 1));
}

function fillBench(bench) {
  let seed = Date.now() | 0;
  const nextSeed = () => {
    seed = (seed + 1) | 0;
    return seed;
  };
  const compareMode = PROF_GEN === 'self';
  const configurations = compareMode
    ? [
        { libName: 'test', generator: 'congruential32' },
        { libName: 'test', generator: 'mersenne' },
        { libName: 'test', generator: 'xorshift128plus' },
        { libName: 'test', generator: 'xoroshiro128plus' },
      ]
    : PROF_GEN === 'alone'
    ? [{ libName: 'test', generator: 'xoroshiro128plus' }]
    : [
        { libName: 'reference', generator: PROF_GEN },
        { libName: 'test', generator: PROF_GEN },
      ];

  const safeBench = (details, fn) => {
    const name = JSON.stringify(details);
    fn();
    bench.add(name, fn);
    console.info(`✔️ ${name}`);
  };

  safeBench({ range: 'S' }, () => {
    for (let i = 0; i !== numInts; ++i) {
      builtInNoDistribution(0, i);
    }
  });
  safeBench({ range: 'M' }, () => {
    for (let i = 0; i !== numInts; ++i) {
      builtInNoDistribution(i, 0x7fff_ffff);
    }
  });
  safeBench({ range: 'L' }, () => {
    for (let i = 0; i !== numInts; ++i) {
      builtInNoDistribution(-0x8000_0000, i);
    }
  });
  for (const { libName, generator } of configurations) {
    const libReference = require('../lib-' + libName + '/pure-rand-default');
    safeBench({ libName, generator, range: 'S' }, () => {
      const g = libReference[generator](nextSeed());
      for (let i = 0; i !== numInts; ++i) {
        noDistribution(0, i, g);
      }
    });
    safeBench({ libName, generator, range: 'M' }, () => {
      const g = libReference[generator](nextSeed());
      for (let i = 0; i !== numInts; ++i) {
        noDistribution(i, 0x7fff_ffff, g);
      }
    });
    safeBench({ libName, generator, range: 'L' }, () => {
      const g = libReference[generator](nextSeed());
      for (let i = 0; i !== numInts; ++i) {
        noDistribution(-0x8000_0000, i, g);
      }
    });
    if (!compareMode) {
      safeBench({ libName, generator, algorithm: 'uniform', range: 'S' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformIntDistribution(0, i, g);
        }
      });
      safeBench({ libName, generator, algorithm: 'uniform', range: 'M' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformIntDistribution(i, 0x7fff_ffff, g);
        }
      });
      safeBench({ libName, generator, algorithm: 'uniform', range: 'L' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformIntDistribution(-0x8000_0000, i, g);
        }
      });
      safeBench({ libName, generator, algorithm: 'uniform', range: 'XL' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformIntDistribution(-0x1_0000_0000, i, g);
        }
      });
      safeBench({ libName, generator, algorithm: 'array uniform', range: 'S' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformArrayIntDistribution({ sign: 1, data: [0] }, { sign: 1, data: [i] }, g);
        }
      });
      safeBench({ libName, generator, algorithm: 'array uniform', range: 'M' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformArrayIntDistribution({ sign: 1, data: [i] }, { sign: 1, data: [0x7fff_ffff] }, g);
        }
      });
      safeBench({ libName, generator, algorithm: 'array uniform', range: 'L' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformArrayIntDistribution({ sign: -1, data: [0x8000_0000] }, { sign: 1, data: [i] }, g);
        }
      });
      safeBench({ libName, generator, algorithm: 'array uniform', range: 'XL' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformArrayIntDistribution({ sign: -1, data: [1, 0] }, { sign: 1, data: [0, i] }, g);
        }
      });
      safeBench({ libName, generator, algorithm: 'bigint uniform', range: 'S' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformBigIntDistribution(BigInt(0), BigInt(i), g);
        }
      });
      safeBench({ libName, generator, algorithm: 'bigint uniform', range: 'M' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformBigIntDistribution(BigInt(i), BigInt(0x7fff_ffff), g);
        }
      });
      safeBench({ libName, generator, algorithm: 'bigint uniform', range: 'L' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformBigIntDistribution(BigInt(-0x8000_0000), BigInt(i), g);
        }
      });
      safeBench({ libName, generator, algorithm: 'bigint uniform', range: 'XL' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          libReference.unsafeUniformBigIntDistribution(BigInt(-0x1_0000_0000), BigInt(i), g);
        }
      });
      safeBench({ libName, generator, algorithm: 'jump' }, () => {
        const g = libReference[generator](nextSeed());
        for (let i = 0; i !== numInts; ++i) {
          g.unsafeJump();
        }
      });
    }
  }
  console.info('');
}

async function runner() {
  const bench = new Bench({ warmupIterations: Math.ceil(numIterations / 20), iterations: numIterations });
  fillBench(bench);
  await bench.warmup();
  await bench.run();

  console.table(
    bench.tasks.map(({ name, result }) => {
      const { libName, generator, algorithm, range } = JSON.parse(name);
      return {
        Library: libName ?? '—',
        RNG: generator ?? '—',
        Algorithm: algorithm ?? '—',
        Range: range ?? '—',
        Mean: result?.mean,
        P75: result?.p75,
        P99: result?.p99,
        RME: result?.rme,
      };
    })
  );
}
runner();
