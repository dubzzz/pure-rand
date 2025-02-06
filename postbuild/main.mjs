import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { replaceInFileSync } from 'replace-in-file';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Append *.js file extension on all local imports

const options = {
  files: ['lib/**/*.js', 'lib/**/*.d.ts'],
  from: [/from '\.(.*)(?<!\.js)'/g, /from "\.(.*)(?<!\.js)"/g],
  to: ["from '.$1.js'", 'from ".$1.js"'],
};

const results = replaceInFileSync(options);
for (const { file, hasChanged } of results) {
  if (hasChanged) {
    // eslint-disable-next-line
    console.info(`Extensions added to: ${file}`);
  }
}

// Fill metas related to the package

// eslint-disable-next-line
const commitHash = getCommitHash();

// eslint-disable-next-line
fs.readFile(path.join(__dirname, '../package.json'), (err, data) => {
  if (err) {
    // eslint-disable-next-line
    console.error(err.message);
    return;
  }

  const packageVersion = JSON.parse(data.toString()).version;

  const commonJsReplacement = replaceInFileSync({
    files: 'lib/pure-rand-default.js',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: ['commonjs', packageVersion, commitHash],
  });
  if (commonJsReplacement.length === 1 && commonJsReplacement[0].hasChanged) {
    // eslint-disable-next-line
    console.info(`Package details added onto commonjs version`);
  }

  const moduleReplacement = replaceInFileSync({
    files: 'lib/esm/pure-rand-default.js',
    from: [/__PACKAGE_TYPE__/g, /__PACKAGE_VERSION__/g, /__COMMIT_HASH__/g],
    to: ['module', packageVersion, commitHash],
  });
  if (moduleReplacement.length === 1 && moduleReplacement[0].hasChanged) {
    // eslint-disable-next-line
    console.info(`Package details added onto module version`);
  }
});

// Helpers
function getCommitHash() {
  const gitHubCommitHash = process.env.GITHUB_SHA && process.env.GITHUB_SHA.split('\n')[0];
  if (gitHubCommitHash) {
    // eslint-disable-next-line
    console.info(`Using env variable GITHUB_SHA for the commit hash, got: ${gitHubCommitHash}`);
    return gitHubCommitHash;
  }
  if (process.env.EXPECT_GITHUB_SHA) {
    if (!gitHubCommitHash) {
      // eslint-disable-next-line
      console.error('No GITHUB_SHA specified');
      process.exit(1);
    }
  }
  const out = execSync('git rev-parse HEAD');
  return out.toString().split('\n')[0];
}
