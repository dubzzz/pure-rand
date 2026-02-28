import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import pkg from './package.json' with { type: 'json' };
import { globSync } from 'fs';

const inputDir = 'src';
const outputDir = 'lib';

function buildConfigFor(pkg, dirname) {
  const inputs = Object.values(pkg.exports)
    .map((exportValue) => (typeof exportValue === 'string' ? exportValue : exportValue.import))
    .filter((filePath) => filePath.endsWith('.js'))
    .map((filePath) => filePath.replace(`./${outputDir}/esm/`, `./${inputDir}/`))
    .flatMap((pattern) => globSync(pattern.replace(/\.js$/, '.ts')))
    .map((filePath) => filePath.replace(/\.ts$/, '.js'))
    .filter((filePath) => !filePath.endsWith('.spec.js'))
    .filter((filePath) => !filePath.endsWith('.properties.js'))
    .filter((filePath) => !filePath.endsWith('.bench.js'));

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
