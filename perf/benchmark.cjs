// @ts-check
// This file is a sample snippet to run benchmark across versions
// Run it:
// $:  yarn build:bench:old
// $:  yarn build:bench:new
// $:  node perf/benchmark.cjs
//
// Or against another generator:
// $:  PROF_GEN="mersenne" node perf/benchmark.cjs

const Benchmark = require('benchmark');
const chalk = require('chalk');
const { exec, execFile } = require('child_process');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { countCallsToNext, genFor } = require('./helpers.cjs');
const { testDistribution } = require('./tasks.cjs');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: yarn bench -c [commit_hash(:alias(:target))] -c [commit_hash(:alias(:target))]')
  .option('commit', {
    alias: 'c',
    type: 'string',
    description: 'Hash of the commit to use in the benchmark',
  })
  .option('generator', {
    alias: 'g',
    type: 'string',
    description: 'Name of the generator (default: xoroshiro128plus)',
  })
  .option('target', {
    alias: 't',
    type: 'string',
    description: 'Default compilation target (default: es6)',
  })
  .demandOption(['commit']).argv;

const execAsync = (command, options) => {
  return new Promise((resolve) => exec(command, options, (err, stdout, stderr) => resolve({ err, stdout, stderr })));
};
const execFileAsync = (command, args, options) => {
  return new Promise((resolve) =>
    execFile(command, args, options, (err, stdout, stderr) => resolve({ err, stdout, stderr }))
  );
};
const prettyName = ({ hash, alias }) => {
  const isHash = /[0-9a-f]{40}/.test(hash);
  const smallHash = isHash ? hash.substring(0, 8) : hash;
  if (alias === undefined) return smallHash;
  else return `${alias}(${smallHash})`;
};
const libName = ({ hash, target }) => {
  return `lib-${hash}-${target}`;
};

async function run() {
  // Check that there is no local changes
  const { err: gitDiffErr } = await execAsync('git diff-index --quiet HEAD --');
  if (gitDiffErr.code) {
    console.error(`${chalk.red('ERROR')} Please commit or stash your local changes!`);
    return;
  }

  // Extract current branch
  const { err: gitBranchErr, stdout } = await execAsync('git branch');
  if (gitBranchErr.code) {
    console.error(`${chalk.red('ERROR')} Failed to get the name of the current branch!`);
    return;
  }
  const rawCurrentBranch = stdout.split('\n').find((line) => line.startsWith('* '));
  if (!rawCurrentBranch) {
    console.error(`${chalk.red('ERROR')} Failed to get the name of the current branch, outside of a branch!`);
    return;
  }
  const currentBranch = rawCurrentBranch.substring(2);

  const commits = (Array.isArray(argv.commit) ? argv.commit : [argv.commit]).map((commit) => {
    const [hash, alias, target] = commit.split(':', 3);
    return { hash, alias, target: target || argv.target || 'es6' };
  });
  try {
    // Build one bundle per commit
    for (const commit of commits) {
      console.info(`${chalk.cyan('INFO')} Building bundle for ${prettyName(commit)}`);
      const { err: gitCheckoutErr } = await execFileAsync('git', ['checkout', commit.hash]);
      if (gitCheckoutErr.code) {
        console.error(`${chalk.red('ERROR')} Failed to checkout ${prettyName(commit)}`);
        return;
      }
      const { err: buildErr } = await execFileAsync(
        path.join(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc'),
        ['--target', commit.target, '--outDir', path.join(__dirname, '..', libName(commit))]
      );
      if (buildErr.code) {
        console.error(`${chalk.red('ERROR')} Failed to build ${prettyName(commit)}`);
        return;
      }
    }
  } finally {
    // Go back to the original branch
    await execFileAsync('git', ['checkout', currentBranch]);
  }

  const PRERUN_SAMPLES = 50;
  const WARMUP_SAMPLES = 1000;
  const MIN_SAMPLES = 1000;
  const NUM_TESTS = 1000;
  const benchConf = { initCount: WARMUP_SAMPLES, minSamples: MIN_SAMPLES };

  const PROF_GEN = argv.generator || 'xoroshiro128plus';
  console.info(`${chalk.cyan('INFO')} Generator: ${PROF_GEN}\n`);

  // Declare configuration matrix
  const configurations = commits.map((commit) => [prettyName(commit), require(`../${libName(commit)}/pure-rand`)]);

  // Declare performance tests
  const performanceTests = [
    {
      name: (type) => `uniformIntDistribution[0;96]...............................@${type}`,
      run: (lib, customGen = genFor) => {
        // Range size is prime
        const g = customGen(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: 0, max: 0xffff };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
    },
    {
      name: (type) => `uniformIntDistribution[0;0xffff]...........................@${type}`,
      run: (lib, customGen = genFor) => {
        // Range size is a small power of 2
        const g = customGen(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: 0, max: 0xffff };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
    },
    {
      name: (type) => `uniformIntDistribution[0;0xffffffff].......................@${type}`,
      run: (lib, customGen = genFor) => {
        // For range of size <=2**32 (ie to-from+1 <= 2**32)
        // uniformIntDistribution uses another execution path
        const g = customGen(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: 0, max: 0xffffffff };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
    },
    {
      name: (type) => `uniformIntDistribution[0;0xffffffff+1].....................@${type}`,
      run: (lib, customGen = genFor) => {
        // Range size is just above threshold used by uniformIntDistribution
        // to switch to another algorithm
        const g = customGen(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: 0, max: 0xffffffff + 1 };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
    },
    {
      name: (type) => `uniformIntDistribution[MIN_SAFE_INTEGER;MAX_SAFE_INTEGER]..@${type}`,
      run: (lib, customGen = genFor) => {
        // Range size is the maximal one
        const g = customGen(lib, PROF_GEN);
        const distribution = lib.uniformIntDistribution;
        const settings = { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER };
        testDistribution(distribution, g, NUM_TESTS, settings);
      },
    },
  ];

  // Declare the benchmarks
  const benchmarks = configurations.flatMap(([type, lib]) =>
    performanceTests.map((test) => new Benchmark(test.name(type), () => test.run(lib), benchConf))
  );

  // Simple checks concerning number of calls to the underlying generators
  console.info(`${chalk.cyan('INFO')} Measuring number of calls to next...\n`);
  for (const test of performanceTests) {
    for (const [type, lib] of configurations) {
      const [g, counter] = countCallsToNext(genFor(lib, PROF_GEN));
      test.run(lib, () => g);
      console.log(`${test.name(type)} called generator on next ${counter.count} times`);
    }
  }
  console.log(``);

  // Run all the code of all the benchmarks at least once before running them for measurements.
  // It ensures that non-optimized path will not be wrongly optimized. In the past we had reports like:
  //   test1 @reference - 400 ops/s
  //   test2 @reference - 200 ops/s
  //   test1 @reference - 200 ops/s
  //   test2 @reference - 200 ops/s
  // Because running test2 de-optimized the code that was optimized for test1 during first runs.
  console.info(`${chalk.cyan('INFO')} Warm-up phase...\n`);
  Benchmark.invoke(
    benchmarks.map((b) => b.clone({ initCount: 1, minSamples: PRERUN_SAMPLES })),
    {
      name: 'run',
      queued: true,
      onCycle: (event) => console.log(String(event.target)),
    }
  );

  // Run benchmarks
  console.info(`\n${chalk.cyan('INFO')} Benchmark phase...\n`);
  Benchmark.invoke(benchmarks, {
    name: 'run',
    queued: true,
    onCycle: (event) => console.log(String(event.target)),
  });
}

run();
