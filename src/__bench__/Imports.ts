// Helper exposing two flavours of pure-rand so that benchmarks can compare the
// performance of the change being worked on against the latest `main`:
// - `current`: the freshly built package, taken from the `lib/` directory (the
//   build, NOT the sources). Build it first with `pnpm build`.
// - `main`: the version of pure-rand currently on `main`, installed under the
//   `pure-rand-main` alias (run `pnpm bench:setup` locally to install it).
//
// Types are always taken from the sources so that typechecking keeps working
// even when neither the build nor the `main` version are available locally.

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

// Version currently on `main`, installed under the `pure-rand-main` alias.
// @ts-ignore - Only available once `pnpm bench:setup` has been run
import { congruential32 as congruential32Main } from 'pure-rand-main/generator/congruential32';
// @ts-ignore - Only available once `pnpm bench:setup` has been run
import { mersenne as mersenneMain } from 'pure-rand-main/generator/mersenne';
// @ts-ignore - Only available once `pnpm bench:setup` has been run
import { xoroshiro128plus as xoroshiro128plusMain } from 'pure-rand-main/generator/xoroshiro128plus';
// @ts-ignore - Only available once `pnpm bench:setup` has been run
import { xorshift128plus as xorshift128plusMain } from 'pure-rand-main/generator/xorshift128plus';
// @ts-ignore - Only available once `pnpm bench:setup` has been run
import { uniformInt as uniformIntMain } from 'pure-rand-main/distribution/uniformInt';
// @ts-ignore - Only available once `pnpm bench:setup` has been run
import { uniformBigInt as uniformBigIntMain } from 'pure-rand-main/distribution/uniformBigInt';
// @ts-ignore - Only available once `pnpm bench:setup` has been run
import { uniformFloat32 as uniformFloat32Main } from 'pure-rand-main/distribution/uniformFloat32';
// @ts-ignore - Only available once `pnpm bench:setup` has been run
import { uniformFloat64 as uniformFloat64Main } from 'pure-rand-main/distribution/uniformFloat64';
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

export const main: PureRand = {
  congruential32: congruential32Main,
  mersenne: mersenneMain,
  xoroshiro128plus: xoroshiro128plusMain,
  xorshift128plus: xorshift128plusMain,
  uniformInt: uniformIntMain,
  uniformBigInt: uniformBigIntMain,
  uniformFloat32: uniformFloat32Main,
  uniformFloat64: uniformFloat64Main,
};
