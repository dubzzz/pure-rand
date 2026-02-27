import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import pkg from './package.json' with { type: 'json' };
import { execSync } from 'child_process';
import { globSync } from 'fs';

const inputDir = 'src';
const outputDir = 'lib';

function getCommitHash() {
  const gitHubCommitHash = process.env.GITHUB_SHA && process.env.GITHUB_SHA.split('\n')[0];
  if (gitHubCommitHash) {
    console.info(`Using env variable GITHUB_SHA for the commit hash, got: ${gitHubCommitHash}`);
    return gitHubCommitHash;
  }
  if (process.env.EXPECT_GITHUB_SHA) {
    if (!gitHubCommitHash) {
      console.error('No GITHUB_SHA specified');
      process.exit(1);
    }
  }
  const out = execSync('git rev-parse HEAD');
  return out.toString().split('\n')[0];
}

function buildConfigFor(pkg, dirname) {
  const inputs = Object.values(pkg.exports)
    .map((exportValue) => (typeof exportValue === 'string' ? exportValue : exportValue.import))
    .filter((filePath) => filePath.endsWith('.js'))
    .map((filePath) => filePath.replace(`./${outputDir}/esm/`, `./${inputDir}/`))
    .flatMap((pattern) => globSync(pattern.replace(/\.js$/, '.ts')))
    .map((filePath) => filePath.replace(/\.ts$/, '.js'));

  /** @type {RolldownOptions} */
  const sharedOptions = {
    input: inputs,
    output: {
      cleanDir: true,
      entryFileNames: (chunkInfo) => {
        const cwdAndInputDirLength = dirname.length + inputDir.length + 2;
        const relativeFilePathWithTsExtension = chunkInfo.facadeModuleId.substring(cwdAndInputDirLength);
        return `${relativeFilePathWithTsExtension.replace(/\.ts$/, '.js')}`;
      },
    },
    external: /^[^./]/, // as recommended by https://rolldown.rs/reference/InputOptions.external#avoid-node-modules-for-npm-packages
    treeshake: {
      moduleSideEffects: false,
    },
    plugins: [],
  };
  return defineConfig([
    {
      ...sharedOptions,
      output: {
        ...sharedOptions.output,
        format: 'cjs',
        dir: outputDir,
      },
      plugins: [...sharedOptions.plugins],
    },
    {
      ...sharedOptions,
      output: {
        ...sharedOptions.output,
        format: 'esm',
        dir: outputDir + '/esm',
      },
      plugins: [...sharedOptions.plugins, dts()],
    },
  ]);
}

export default buildConfigFor(pkg, import.meta.dirname);
