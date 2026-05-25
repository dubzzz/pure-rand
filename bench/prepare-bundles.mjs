// Prepares the production bundles compared by `pnpm bench:main` and unpacks
// them into node_modules as `pure-rand-current` and `pure-rand-main`.
//
// Neither is listed in package.json: they exist only for the duration of the
// run. Both sides are real packed bundles so the comparison is apples-to-apples.
//
// Sources (all optional):
//   PURE_RAND_CURRENT_TARBALL  local bundle for the working tree
//                              (defaults to building + packing it here)
//   PURE_RAND_MAIN_TARBALL     local bundle or http(s) URL for `main`
//                              (defaults to / falls back to pkg.pr.new)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FALLBACK_MAIN_URL = 'https://pkg.pr.new/dubzzz/pure-rand@main';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nodeModules = join(root, 'node_modules');

const isUrl = (value) => /^https?:\/\//i.test(value);

function unpack(buffer, name) {
  const target = join(nodeModules, name);
  const scratch = mkdtempSync(join(tmpdir(), `${name}-`));
  const tarball = join(scratch, 'package.tgz');
  writeFileSync(tarball, buffer);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  execFileSync('tar', ['-xzf', tarball, '-C', target, '--strip-components=1'], { stdio: 'inherit' });
  rmSync(scratch, { recursive: true, force: true });
  console.log(`Unpacked ${name} into ${target}`);
}

async function download(url) {
  console.log(`Fetching ${url}`);
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function currentTarball() {
  const provided = process.env.PURE_RAND_CURRENT_TARBALL;
  if (provided !== undefined && existsSync(resolve(provided))) {
    console.log(`Using current bundle ${resolve(provided)}`);
    return readFileSync(resolve(provided));
  }
  console.log('Building and packing the working tree into a production bundle');
  const scratch = mkdtempSync(join(tmpdir(), 'pure-rand-current-pack-'));
  const out = join(scratch, 'current.tgz');
  execFileSync('pnpm', ['build'], { cwd: root, stdio: 'inherit' });
  execFileSync('pnpm', ['pack', '--out', out], { cwd: root, stdio: 'inherit' });
  const buffer = readFileSync(out);
  rmSync(scratch, { recursive: true, force: true });
  return buffer;
}

async function mainTarball() {
  const provided = process.env.PURE_RAND_MAIN_TARBALL;
  if (provided !== undefined && !isUrl(provided)) {
    const localPath = resolve(provided);
    if (existsSync(localPath)) {
      console.log(`Using main bundle ${localPath}`);
      return readFileSync(localPath);
    }
    console.warn(`Main bundle ${localPath} not found, falling back to ${FALLBACK_MAIN_URL}`);
    return download(FALLBACK_MAIN_URL);
  }
  return download(provided ?? FALLBACK_MAIN_URL);
}

unpack(currentTarball(), 'pure-rand-current');
unpack(await mainTarball(), 'pure-rand-main');
