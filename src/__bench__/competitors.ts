import type { RandomGenerator } from '../types/RandomGenerator';

// Source implementations, used by the default `pnpm bench` for a fast loop.
import { congruential32 } from '../generator/congruential32';
import { mersenne } from '../generator/mersenne';
import { xoroshiro128plus } from '../generator/xoroshiro128plus';
import { xorshift128plus } from '../generator/xorshift128plus';
import { uniformInt } from '../distribution/uniformInt';
import { uniformBigInt } from '../distribution/uniformBigInt';
import { uniformFloat32 } from '../distribution/uniformFloat32';
import { uniformFloat64 } from '../distribution/uniformFloat64';

// When comparing, both sides are loaded from production bundles unpacked by
// `bench/prepare-bundles.mjs`. Neither package is a dependency in package.json:
// they exist only for the duration of a `pnpm bench:main` run.
const CURRENT_PACKAGE = 'pure-rand-current';
const MAIN_PACKAGE = 'pure-rand-main';

declare const process: { env: Record<string, string | undefined> };

export const compareWithMain: boolean = process.env['BENCH_AGAINST_MAIN'] === 'true';

type GeneratorFactory = (seed: number) => RandomGenerator;

export interface Generators {
  congruential32: GeneratorFactory;
  mersenne: GeneratorFactory;
  xoroshiro128plus: GeneratorFactory;
  xorshift128plus: GeneratorFactory;
}

export interface Distributions {
  uniformInt: (rng: RandomGenerator, from: number, to: number) => number;
  uniformBigInt: (rng: RandomGenerator, from: bigint, to: bigint) => bigint;
  uniformFloat32: (rng: RandomGenerator) => number;
  uniformFloat64: (rng: RandomGenerator) => number;
}

const sourceGenerators: Generators = { congruential32, mersenne, xoroshiro128plus, xorshift128plus };
const sourceDistributions: Distributions = { uniformInt, uniformBigInt, uniformFloat32, uniformFloat64 };

// Specifier is built dynamically on purpose: it keeps the bundle packages out
// of static resolution (typecheck/build) since they only exist during the run.
async function importFrom(pkg: string, subpath: string): Promise<Record<string, unknown>> {
  return import(/* @vite-ignore */ `${pkg}/${subpath}`);
}

async function loadGeneratorsFrom(pkg: string): Promise<Generators> {
  const [congruential, mersenneMod, xoroshiro, xorshift] = await Promise.all([
    importFrom(pkg, 'generator/congruential32'),
    importFrom(pkg, 'generator/mersenne'),
    importFrom(pkg, 'generator/xoroshiro128plus'),
    importFrom(pkg, 'generator/xorshift128plus'),
  ]);
  return {
    congruential32: congruential['congruential32'] as GeneratorFactory,
    mersenne: mersenneMod['mersenne'] as GeneratorFactory,
    xoroshiro128plus: xoroshiro['xoroshiro128plus'] as GeneratorFactory,
    xorshift128plus: xorshift['xorshift128plus'] as GeneratorFactory,
  };
}

async function loadDistributionsFrom(pkg: string): Promise<Distributions> {
  const [int, bigInt, float32, float64] = await Promise.all([
    importFrom(pkg, 'distribution/uniformInt'),
    importFrom(pkg, 'distribution/uniformBigInt'),
    importFrom(pkg, 'distribution/uniformFloat32'),
    importFrom(pkg, 'distribution/uniformFloat64'),
  ]);
  return {
    uniformInt: int['uniformInt'] as Distributions['uniformInt'],
    uniformBigInt: bigInt['uniformBigInt'] as Distributions['uniformBigInt'],
    uniformFloat32: float32['uniformFloat32'] as Distributions['uniformFloat32'],
    uniformFloat64: float64['uniformFloat64'] as Distributions['uniformFloat64'],
  };
}

export async function loadGenerators(): Promise<{ current: Generators; main: Generators | null }> {
  if (!compareWithMain) {
    return { current: sourceGenerators, main: null };
  }
  const [current, main] = await Promise.all([loadGeneratorsFrom(CURRENT_PACKAGE), loadGeneratorsFrom(MAIN_PACKAGE)]);
  return { current, main };
}

export async function loadDistributions(): Promise<{ current: Distributions; main: Distributions | null }> {
  if (!compareWithMain) {
    return { current: sourceDistributions, main: null };
  }
  const [current, main] = await Promise.all([
    loadDistributionsFrom(CURRENT_PACKAGE),
    loadDistributionsFrom(MAIN_PACKAGE),
  ]);
  return { current, main };
}
