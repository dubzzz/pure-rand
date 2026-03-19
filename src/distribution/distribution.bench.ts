import { describe, bench } from 'vitest';
import { xorshift128plus } from '../generator/xorshift128plus';
import { uniformInt } from './uniformInt';
import { uniformBigInt } from './uniformBigInt';
import { uniformFloat32 } from './uniformFloat32';
import { uniformFloat64 } from './uniformFloat64';
import { tryImportFromPublished } from '../tryImportFromPublished';

type IntDistrib = { name: string; fn: typeof uniformInt };
type BigIntDistrib = { name: string; fn: typeof uniformBigInt };
type FloatDistrib = { name: string; fn: typeof uniformFloat32 };

const intDistribs = [
  { name: 'uniformInt', fn: uniformInt },
  { name: 'uniformInt (published)', fn: await tryImportFromPublished('distribution/uniformInt') },
].filter((e): e is IntDistrib => e.fn != null);

const bigIntDistribs = [
  { name: 'uniformBigInt', fn: uniformBigInt },
  { name: 'uniformBigInt (published)', fn: await tryImportFromPublished('distribution/uniformBigInt') },
].filter((e): e is BigIntDistrib => e.fn != null);

const floatDistribs = [
  { name: 'uniformFloat32', fn: uniformFloat32 },
  { name: 'uniformFloat64', fn: uniformFloat64 },
  { name: 'uniformFloat32 (published)', fn: await tryImportFromPublished('distribution/uniformFloat32') },
  { name: 'uniformFloat64 (published)', fn: await tryImportFromPublished('distribution/uniformFloat64') },
].filter((e): e is FloatDistrib => e.fn != null);

describe('distribution', () => {
  const rng = xorshift128plus(0);

  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 2**4 -1]`;
    bench(`native @@ ${smallRangeLabel}`, () => {
      nativeInt(0, 15);
    });
    for (const d of intDistribs) {
      bench(`${d.name} @@ ${smallRangeLabel}`, () => {
        d.fn(rng, 0, 15);
      });
    }
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${smallRangeLabel}`, () => {
        d.fn(rng, 0n, 15n);
      });
    }

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 2**21 -1]`;
    bench(`native @@ ${mediumRangeLabel}`, () => {
      nativeInt(0, 2097151);
    });
    for (const d of intDistribs) {
      bench(`${d.name} @@ ${mediumRangeLabel}`, () => {
        d.fn(rng, 0, 2097151);
      });
    }
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${mediumRangeLabel}`, () => {
        d.fn(rng, 0n, 2097151n);
      });
    }

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 2**32 -1]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 4294967295);
    });
    for (const d of intDistribs) {
      bench(`${d.name} @@ ${largeRangeLabel}`, () => {
        d.fn(rng, 0, 4294967295);
      });
    }
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${largeRangeLabel}`, () => {
        d.fn(rng, 0n, 4294967295n);
      });
    }

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 2**40 -1]`;
    bench(`native @@ ${veryLargeRangeLabel}`, () => {
      nativeInt(0, 1099511627775);
    });
    for (const d of intDistribs) {
      bench(`${d.name} @@ ${veryLargeRangeLabel}`, () => {
        d.fn(rng, 0, 1099511627775);
      });
    }
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${veryLargeRangeLabel}`, () => {
        d.fn(rng, 0n, 1099511627775n);
      });
    }

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 2**80 -1]`;
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${veryVeryLargeRangeLabel}`, () => {
        d.fn(rng, 0n, 1208925819614629174706175n);
      });
    }
  });

  describe('various ranges', () => {
    // no specific range
    bench(`native @@ {{float}} [0, 1)`, () => {
      nativeFloat();
    });
    for (const d of floatDistribs) {
      bench(`${d.name} @@ {{float}} [0, 1)`, () => {
        d.fn(rng);
      });
    }

    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 48]`;
    bench(`native @@ ${smallRangeLabel}`, () => {
      nativeInt(0, 48);
    });
    for (const d of intDistribs) {
      bench(`${d.name} @@ ${smallRangeLabel}`, () => {
        d.fn(rng, 0, 48);
      });
    }
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${smallRangeLabel}`, () => {
        d.fn(rng, 0n, 48n);
      });
    }

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 1_000_000_000]`;
    bench(`native @@ ${mediumRangeLabel}`, () => {
      nativeInt(0, 1_000_000_000);
    });
    for (const d of intDistribs) {
      bench(`${d.name} @@ ${mediumRangeLabel}`, () => {
        d.fn(rng, 0, 1_000_000_000);
      });
    }
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${mediumRangeLabel}`, () => {
        d.fn(rng, 0n, 1_000_000_000n);
      });
    }

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 4_000_000_000]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 4_000_000_000);
    });
    for (const d of intDistribs) {
      bench(`${d.name} @@ ${largeRangeLabel}`, () => {
        d.fn(rng, 0, 4_000_000_000);
      });
    }
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${largeRangeLabel}`, () => {
        d.fn(rng, 0n, 4_000_000_000n);
      });
    }

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 8_000_000_000]`;
    bench(`native @@ ${veryLargeRangeLabel}`, () => {
      nativeInt(0, 8_000_000_000);
    });
    for (const d of intDistribs) {
      bench(`${d.name} @@ ${veryLargeRangeLabel}`, () => {
        d.fn(rng, 0, 8_000_000_000);
      });
    }
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${veryLargeRangeLabel}`, () => {
        d.fn(rng, 0n, 8_000_000_000n);
      });
    }

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 100_000_000_000_000_000]`;
    for (const d of bigIntDistribs) {
      bench(`${d.name} @@ ${veryVeryLargeRangeLabel}`, () => {
        d.fn(rng, 0n, 100_000_000_000_000_000n);
      });
    }
  });
});

function nativeFloat() {
  return Math.random();
}

function nativeInt(from: number, to: number) {
  return from + Math.floor(Math.random() * (to - from + 1));
}
