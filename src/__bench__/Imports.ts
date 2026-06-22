// Helper exposing the freshly built pure-rand package so that benchmarks run
// against the build (`lib/`), NOT the sources. Build it first with `pnpm build`.
//
// Benchmarks no longer install a second copy of pure-rand to compare the change
// being worked on against `main`: that comparison is now handled by vitest's
// `--compare` mode, which diffs the current run against the `benchmark.json`
// produced on `main` (see the `bench:*` scripts in package.json).
//
// Types are always taken from the sources so that typechecking keeps working even
// when the build is not available locally.

import type { congruential32 } from '../generator/congruential32';
import type { mersenne } from '../generator/mersenne';
import type { xoroshiro128plus } from '../generator/xoroshiro128plus';
import type { xorshift128plus } from '../generator/xorshift128plus';
import type { uniformInt } from '../distribution/uniformInt';
import type { uniformBigInt } from '../distribution/uniformBigInt';
import type { uniformFloat32 } from '../distribution/uniformFloat32';
import type { uniformFloat64 } from '../distribution/uniformFloat64';

// oxlint-disable typescript/ban-ts-comment
// Current build, coming from the freshly built `lib/` directory (not the sources).
// @ts-ignore - Only available once the package has been built (`pnpm build`)
import { congruential32 as congruential32Current } from '../../lib/esm/generator/congruential32.js';
// @ts-ignore - Only available once the package has been built (`pnpm build`)
import { mersenne as mersenneCurrent } from '../../lib/esm/generator/mersenne.js';
// @ts-ignore - Only available once the package has been built (`pnpm build`)
import { xoroshiro128plus as xoroshiro128plusCurrent } from '../../lib/esm/generator/xoroshiro128plus.js';
// @ts-ignore - Only available once the package has been built (`pnpm build`)
import { xorshift128plus as xorshift128plusCurrent } from '../../lib/esm/generator/xorshift128plus.js';
// @ts-ignore - Only available once the package has been built (`pnpm build`)
import { uniformInt as uniformIntCurrent } from '../../lib/esm/distribution/uniformInt.js';
// @ts-ignore - Only available once the package has been built (`pnpm build`)
import { uniformBigInt as uniformBigIntCurrent } from '../../lib/esm/distribution/uniformBigInt.js';
// @ts-ignore - Only available once the package has been built (`pnpm build`)
import { uniformFloat32 as uniformFloat32Current } from '../../lib/esm/distribution/uniformFloat32.js';
// @ts-ignore - Only available once the package has been built (`pnpm build`)
import { uniformFloat64 as uniformFloat64Current } from '../../lib/esm/distribution/uniformFloat64.js';
// oxlint-enable typescript/ban-ts-comment

export type PureRand = {
  congruential32: typeof congruential32;
  mersenne: typeof mersenne;
  xoroshiro128plus: typeof xoroshiro128plus;
  xorshift128plus: typeof xorshift128plus;
  uniformInt: typeof uniformInt;
  uniformBigInt: typeof uniformBigInt;
  uniformFloat32: typeof uniformFloat32;
  uniformFloat64: typeof uniformFloat64;
};

export const current: PureRand = {
  congruential32: congruential32Current,
  mersenne: mersenneCurrent,
  xoroshiro128plus: xoroshiro128plusCurrent,
  xorshift128plus: xorshift128plusCurrent,
  uniformInt: uniformIntCurrent,
  uniformBigInt: uniformBigIntCurrent,
  uniformFloat32: uniformFloat32Current,
  uniformFloat64: uniformFloat64Current,
};
