// Downloads/unpacks the latest build of the `main` branch into
// node_modules/pure-rand-main so the comparison benchmark can import it.
//
// This package is intentionally NOT listed in package.json: it is pulled only
// for the duration of a `pnpm bench:main` run.
//
// Source resolution (set via PURE_RAND_MAIN_TARBALL):
//   - a local tarball path (used in CI, pointing at the cached `main` bundle)
//   - an http(s) URL
//   - unset, or a local path that does not exist -> falls back to pkg.pr.new
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FALLBACK_URL = 'https://pkg.pr.new/dubzzz/pure-rand@main';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'node_modules', 'pure-rand-main');

const isUrl = (value) => /^https?:\/\//i.test(value);

async function download(url) {
  console.log(`Fetching pure-rand@main from ${url}`);
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function readTarball() {
  const requested = process.env.PURE_RAND_MAIN_TARBALL;
  if (requested !== undefined && !isUrl(requested)) {
    const localPath = resolve(requested);
    if (existsSync(localPath)) {
      console.log(`Using local pure-rand@main tarball ${localPath}`);
      return readFileSync(localPath);
    }
    console.warn(`Local tarball ${localPath} not found, falling back to ${FALLBACK_URL}`);
    return download(FALLBACK_URL);
  }
  return download(requested ?? FALLBACK_URL);
}

const buffer = await readTarball();

const scratch = mkdtempSync(join(tmpdir(), 'pure-rand-main-'));
const tarball = join(scratch, 'package.tgz');
writeFileSync(tarball, buffer);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
execFileSync('tar', ['-xzf', tarball, '-C', target, '--strip-components=1'], { stdio: 'inherit' });
rmSync(scratch, { recursive: true, force: true });

console.log(`Unpacked pure-rand@main into ${target}`);
