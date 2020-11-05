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
const { Table } = require('console-table-printer');
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
    default: 'xoroshiro128plus',
    description: 'Name of the generator',
  })
  .option('target', {
    alias: 't',
    type: 'string',
    default: 'es6',
    description: 'Default compilation target',
  })
  .option('count', {
    type: 'number',
    default: 1,
    description: 'Number of measurements per commit',
  })
  .option('samples', {
    alias: 's',
    type: 'number',
    default: 500,
    description: 'Number of samples',
  })
  .option('allow-local-changes', {
    type: 'boolean',
    default: false,
    description: 'Do not check for local changes, your local changes will be automatically stashed and un-stashed',
  })
  .option('print-confidence', {
    type: 'boolean',
    default: false,
    description: 'Print 95% confidence range in reports instead of +X%',
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    default: false,
    description: 'Enable verbose mode',
  })
  .demandOption(['commit']).argv;

const verboseLog = (...args) => {
  if (argv.verbose) {
    console.log(`${chalk.greenBright('DEBUG')}`, ...args);
  }
};
const cleanErr = (err) => {
  if (!err) return err;
  const { stack, ...others } = err;
  return others;
};
const execAsync = (command, options) => {
  const prettyCmd = `exec(${JSON.stringify(command)}, ${JSON.stringify(options)}})`;
  return new Promise((resolve) => {
    verboseLog(`Call to ${prettyCmd}`);
    exec(command, options, (err, stdout, stderr) => {
      verboseLog(`Answer from ${prettyCmd}`);
      verboseLog(`err:`, cleanErr(err));
      verboseLog(`stdout:`, stdout.toString());
      verboseLog(`stderr:`, stderr.toString());
      resolve({ err, stdout, stderr });
    });
  });
};
const execFileAsync = (command, args, options) => {
  const prettyCmd = `execFile(${JSON.stringify(command)}, ${JSON.stringify(args)}, ${JSON.stringify(options)}})`;
  return new Promise((resolve) => {
    verboseLog(`Call to ${prettyCmd}`);
    execFile(command, args, options, (err, stdout, stderr) => {
      verboseLog(`Answer from ${prettyCmd}`);
      verboseLog(`err:`, cleanErr(err));
      verboseLog(`stdout:`, stdout.toString());
      verboseLog(`stderr:`, stderr.toString());
      resolve({ err, stdout, stderr });
    });
  });
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
const formatRatio = (ratio) => {
  return `${ratio >= 0 ? '+' : ''}${ratio.toFixed(2)} %`;
};

async function run() {
  let stashedMessage = null;
  if (!argv['allow-local-changes']) {
    // Check that there is no local changes
    const { err: gitDiffErr } = await execAsync('git diff-index --quiet HEAD --');
    if (gitDiffErr && gitDiffErr.code) {
      console.error(`${chalk.red('ERROR')} Please commit or stash your local changes!`);
      return;
    }
  } else {
    // Stash local changes
    const localStashMessage = `bench-${Math.random().toString(16).substr(2)}`;
    console.info(`${chalk.cyan('INFO ')} Stashing local changes if any under stash name ${localStashMessage}`);
    const { stdout: stashCountBefore } = await execAsync('git stash list | wc -l');
    const { err: gitStashErr } = await execAsync(`git stash push -m "${localStashMessage}"`);
    if (gitStashErr && gitStashErr.code) {
      console.info(`${chalk.yellow('WARN ')} Something went wrong when trying to stash your changes`);
    }
    const { stdout: stashCountAfter } = await execAsync('git stash list | wc -l');
    if (stashCountBefore != null && stashCountAfter != null && String(stashCountAfter) !== String(stashCountBefore)) {
      stashedMessage = localStashMessage;
      console.info(`${chalk.cyan('INFO ')} Your local changes have been stashed`);
    } else {
      console.info(`${chalk.cyan('INFO ')} No local changes to stash`);
    }
  }

  // Extract current branch
  const { err: gitBranchErr, stdout } = await execAsync('git branch');
  if (gitBranchErr && gitBranchErr.code) {
    console.error(`${chalk.red('ERROR')} Failed to get the name of the current branch!`);
    return;
  }
  const rawCurrentBranch = stdout.split('\n').find((line) => line.startsWith('* '));
  if (!rawCurrentBranch) {
    console.error(`${chalk.red('ERROR')} Failed to get the name of the current branch, outside of a branch!`);
    return;
  }
  const detactedHeadRegex = /\* \(HEAD detached at ([a-f0-9]+)\)/;
  const detactedHead = detactedHeadRegex.exec(rawCurrentBranch);
  const currentBranch = detactedHead !== null ? detactedHead[1] : rawCurrentBranch.substring(2);

  const commits = (Array.isArray(argv.commit) ? argv.commit : [argv.commit]).map((commit) => {
    const [hash, alias, target] = commit.split(':', 3);
    return { hash, alias, target: target || argv.target };
  });
  try {
    // Build one bundle per commit
    for (const commit of commits) {
      console.info(`${chalk.cyan('INFO ')} Building bundle for ${prettyName(commit)}`);
      const { err: gitCheckoutErr } = await execFileAsync('git', ['checkout', commit.hash]);
      if (gitCheckoutErr && gitCheckoutErr.code) {
        console.error(`${chalk.red('ERROR')} Failed to checkout ${prettyName(commit)}`);
        return;
      }
      const { err: buildErr } = await execFileAsync('node', [
        path.join(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc'),
        '--target',
        commit.target,
        '--outDir',
        path.join(__dirname, '..', libName(commit)),
        ...(argv.verbose ? ['--diagnostics', '--extendedDiagnostics', '--listEmittedFiles'] : []),
      ]);
      if (buildErr && buildErr.code) {
        console.error(`${chalk.red('ERROR')} Failed to build ${prettyName(commit)}`);
        return;
      }
    }
  } finally {
    // Go back to the original branch
    await execFileAsync('git', ['checkout', currentBranch]);

    if (stashedMessage !== null) {
      // Applying stash
      console.info(`${chalk.cyan('INFO ')} Un-Stashing local changes stored under stash ${stashedMessage}`);
      const { err: gitStashErr } = await execAsync(`git stash apply stash^{/${stashedMessage}}`); // pop does not handle messages
      if (gitStashErr && gitStashErr.code) {
        console.info(`${chalk.yellow('WARN ')} Something went wrong when trying to un-stash your changes`);
      }
    }
  }

  const NUM_TESTS = 50;
  const MIN_SAMPLES = argv.samples;
  const PROF_GEN = argv.generator;

  console.info(`${chalk.cyan('INFO ')} Generated values per run: ${NUM_TESTS}`);
  console.info(`${chalk.cyan('INFO ')} Requested number of samples: ${MIN_SAMPLES}`);
  console.info(`${chalk.cyan('INFO ')} Generator: ${PROF_GEN}\n`);

  // Declare configuration matrix
  const configurations = [...Array(argv.count)].flatMap((_, index) =>
    commits.map((commit) => {
      const name = prettyName(commit);
      const libPath = `../${libName(commit)}/pure-rand`;
      verboseLog(`name: ${name}, require: ${libPath}`);
      return [name + (index === 0 ? '' : `(${index + 1})`), require(libPath)];
    })
  );

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
  const benchConf = { minSamples: MIN_SAMPLES };
  let benchmarks = performanceTests.flatMap((test) =>
    configurations.map(([type, lib]) => new Benchmark(test.name(type), () => test.run(lib), benchConf))
  );
  const benchmarkStatsFor = (configurationIndex, testIndex) => {
    return benchmarks[configurationIndex + testIndex * configurations.length].stats;
  };

  // Simple checks concerning number of calls to the underlying generators
  // Run all the code of all the benchmarks at least once before running them for measurements.
  // It ensures that non-optimized path will not be wrongly optimized. In the past we had reports like:
  //   test1 @reference - 400 ops/s
  //   test2 @reference - 200 ops/s
  //   test1 @reference - 200 ops/s
  //   test2 @reference - 200 ops/s
  // Because running test2 de-optimized the code that was optimized for test1 during first runs.
  console.info(`${chalk.cyan('INFO ')} Measuring number of calls to next...\n`);
  for (const test of performanceTests) {
    for (const [type, lib] of configurations) {
      const [g, counter] = countCallsToNext(genFor(lib, PROF_GEN, 42)); // seed: 42, we always want the same seed
      test.run(lib, () => g);
      console.log(`${test.name(type)} called generator on next ${counter.count} times`);
    }
  }
  console.log(``);

  // Run benchmarks
  console.info(`\n${chalk.cyan('INFO ')} Benchmark phase...\n`);
  benchmarks = Benchmark.invoke(benchmarks, {
    name: 'run',
    queued: true,
    onCycle: (event) => console.log(String(event.target)),
  });

  // Print comparison tables
  console.info(`\n${chalk.cyan('INFO ')} Reports\n`);
  for (let testIndex = 0; testIndex !== performanceTests.length; ++testIndex) {
    const testName = performanceTests[testIndex].name('').replace(/\.+@$/, '');
    console.log(`Stats for ${testName}`);
    // Create and fill the reporting table
    const table = new Table({
      columns: [
        { name: 'Name', alignment: 'left' },
        ...configurations.map(([configName]) => ({
          name: configName,
          alignment: argv['print-confidence'] ? 'center' : 'right',
        })),
      ],
    });
    // Find the best and worst configurations
    const [idxWorst, idxBest] = configurations.reduce(
      ([idxWorst, idxBest], _, currentConfigIndex) => {
        const worst = benchmarkStatsFor(idxWorst, testIndex).mean;
        const best = benchmarkStatsFor(idxBest, testIndex).mean;
        const current = benchmarkStatsFor(currentConfigIndex, testIndex).mean;
        return [current > worst ? currentConfigIndex : idxWorst, current < best ? currentConfigIndex : idxBest];
      },
      [0, 0]
    );
    // Add rows
    for (let currentConfigIndex = 0; currentConfigIndex !== configurations.length; ++currentConfigIndex) {
      const currentBenchStats = benchmarkStatsFor(currentConfigIndex, testIndex);
      // [mean - 2 * sigma, mean + 2 * sigma] is 95 %
      const currentBenchWorst = Math.max(Number.MIN_VALUE, currentBenchStats.mean - 2 * currentBenchStats.deviation);
      const currentBenchMean = currentBenchStats.mean;
      const currentBenchBest = currentBenchStats.mean + 2 * currentBenchStats.deviation;
      table.addRow(
        {
          Name: configurations[currentConfigIndex][0],
          ...Object.fromEntries(
            configurations.map((config, configIndex) => {
              if (configIndex === currentConfigIndex) {
                return [config[0], '—'];
              }
              const otherBenchStats = benchmarkStatsFor(configIndex, testIndex);
              const otherBenchWorst = Math.max(Number.MIN_VALUE, otherBenchStats.mean - 2 * otherBenchStats.deviation);
              const otherBenchMean = otherBenchStats.mean;
              const otherBenchBest = otherBenchStats.mean + 2 * otherBenchStats.deviation;
              const ratioWorst = (100.0 * otherBenchWorst) / currentBenchBest - 100.0;
              const ratio = (100.0 * otherBenchMean) / currentBenchMean - 100.0;
              const ratioBest = (100.0 * otherBenchBest) / currentBenchWorst - 100.0;
              if (argv['print-confidence']) {
                return [config[0], `${formatRatio(ratioWorst)} — ${formatRatio(ratioBest)}`]; // ~95% interval
              } else {
                return [config[0], formatRatio(ratio)];
              }
            })
          ),
        },
        currentConfigIndex === idxBest
          ? { color: 'green' }
          : currentConfigIndex === idxWorst
          ? { color: 'red' }
          : undefined
      );
    }
    // Print the table
    table.printTable();
    console.log(``);
  }
}

run();
