const process = require('process');
const { __commitHash } = require('pure-rand');

const expectedCommitHash = process.env.GITHUB_SHA;
if (!expectedCommitHash) {
  console.error('No GITHUB_SHA specified');
  process.exit(1);
}
if (expectedCommitHash !== __commitHash) {
  console.error('Expected: ' + expectedCommitHash + ', got: ' + __commitHash);
  process.exit(2);
}
console.log('✔️ Referencing the correct version of pure-rand');
console.log('✔️ Commit hash matches expected one: ' + expectedCommitHash);
