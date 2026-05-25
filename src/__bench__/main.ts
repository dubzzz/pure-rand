import type { RandomGenerator } from '../types/RandomGenerator';

// Pulled on-demand by `pnpm bench:main`, never declared as a dependency.
// `bench/prepare-main.mjs` unpacks the latest build of the `main` branch into
// node_modules/pure-rand-main right before the benchmark runs.
const SPECIFIER = 'pure-rand-main';

declare const process: { env: Record<string, string | undefined> };

export const compareWithMain: boolean = process.env['BENCH_AGAINST_MAIN'] === 'true';

type GeneratorFactory = (seed: number) => RandomGenerator;

export interface MainGenerators {
  congruential32: GeneratorFactory;
  mersenne: GeneratorFactory;
  xoroshiro128plus: GeneratorFactory;
  xorshift128plus: GeneratorFactory;
}

export interface MainDistributions {
  uniformInt: (rng: RandomGenerator, from: number, to: number) => number;
  uniformBigInt: (rng: RandomGenerator, from: bigint, to: bigint) => bigint;
  uniformFloat32: (rng: RandomGenerator) => number;
  uniformFloat64: (rng: RandomGenerator) => number;
}

// Specifier is built dynamically on purpose: it keeps `pure-rand-main` out of
// static resolution (typecheck/build) since it only exists during the run.
async function importMain(subpath: string): Promise<Record<string, unknown>> {
  return import(/* @vite-ignore */ `${SPECIFIER}/${subpath}`);
}

export async function loadMainGenerators(): Promise<MainGenerators | null> {
  if (!compareWithMain) {
    return null;
  }
  const [congruential32, mersenne, xoroshiro128plus, xorshift128plus] = await Promise.all([
    importMain('generator/congruential32'),
    importMain('generator/mersenne'),
    importMain('generator/xoroshiro128plus'),
    importMain('generator/xorshift128plus'),
  ]);
  return {
    congruential32: congruential32['congruential32'] as GeneratorFactory,
    mersenne: mersenne['mersenne'] as GeneratorFactory,
    xoroshiro128plus: xoroshiro128plus['xoroshiro128plus'] as GeneratorFactory,
    xorshift128plus: xorshift128plus['xorshift128plus'] as GeneratorFactory,
  };
}

export async function loadMainDistributions(): Promise<MainDistributions | null> {
  if (!compareWithMain) {
    return null;
  }
  const [uniformInt, uniformBigInt, uniformFloat32, uniformFloat64] = await Promise.all([
    importMain('distribution/uniformInt'),
    importMain('distribution/uniformBigInt'),
    importMain('distribution/uniformFloat32'),
    importMain('distribution/uniformFloat64'),
  ]);
  return {
    uniformInt: uniformInt['uniformInt'] as MainDistributions['uniformInt'],
    uniformBigInt: uniformBigInt['uniformBigInt'] as MainDistributions['uniformBigInt'],
    uniformFloat32: uniformFloat32['uniformFloat32'] as MainDistributions['uniformFloat32'],
    uniformFloat64: uniformFloat64['uniformFloat64'] as MainDistributions['uniformFloat64'],
  };
}
