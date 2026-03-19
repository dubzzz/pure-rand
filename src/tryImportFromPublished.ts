// @ts-ignore
import { readFileSync } from 'node:fs';
// @ts-ignore
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);

export async function tryImportFromPublished(subpath: string): Promise<any> {
  try {
    const publishedFile = _require.resolve(`pure-rand-published/${subpath}`);
    const currentFile = publishedFile.replace(/\/node_modules\/.*$/, `/lib/esm/${subpath}.js`);
    try {
      if (readFileSync(publishedFile, 'utf-8') === readFileSync(currentFile, 'utf-8')) return undefined;
    } catch {}
    const mod = await import(`pure-rand-published/${subpath}`);
    return mod[subpath.split('/').pop()!];
  } catch {
    return undefined;
  }
}
