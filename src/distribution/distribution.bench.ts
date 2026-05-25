import { describe, bench } from 'vitest';
import { xorshift128plus } from '../generator/xorshift128plus';
import { loadDistributions } from '../__bench__/competitors';

// `rng` only feeds randomness to both competitors identically, so the source
// generator is fine here; only the distributions under test are compared.
const { current, main } = await loadDistributions();
const uniformInt = current.uniformInt;
const uniformBigInt = current.uniformBigInt;
const uniformFloat32 = current.uniformFloat32;
const uniformFloat64 = current.uniformFloat64;
const mainUniformInt = main?.uniformInt;
const mainUniformBigInt = main?.uniformBigInt;
const mainUniformFloat32 = main?.uniformFloat32;
const mainUniformFloat64 = main?.uniformFloat64;

describe('distribution', () => {
  const rng = xorshift128plus(0);

  // Registers the current implementation and, when comparing, its `main`
  // counterpart right after it so the two compete within the same group.
  const compete = (label: string, current: () => void, withMain: () => void) => {
    bench(label, current);
    if (main !== null) {
      bench(label.replace(' @@ ', ' (main) @@ '), withMain);
    }
  };

  describe('pow2 ranges', () => {
    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 2**4 -1]`;
    bench(`native @@ ${smallRangeLabel}`, () => {
      nativeInt(0, 15);
    });
    compete(
      `uniformInt @@ ${smallRangeLabel}`,
      () => {
        uniformInt(rng, 0, 15);
      },
      () => {
        mainUniformInt!(rng, 0, 15);
      },
    );
    compete(
      `uniformBigInt @@ ${smallRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 15n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 15n);
      },
    );

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 2**21 -1]`;
    bench(`native @@ ${mediumRangeLabel}`, () => {
      nativeInt(0, 2097151);
    });
    compete(
      `uniformInt @@ ${mediumRangeLabel}`,
      () => {
        uniformInt(rng, 0, 2097151);
      },
      () => {
        mainUniformInt!(rng, 0, 2097151);
      },
    );
    compete(
      `uniformBigInt @@ ${mediumRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 2097151n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 2097151n);
      },
    );

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 2**32 -1]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 4294967295);
    });
    compete(
      `uniformInt @@ ${largeRangeLabel}`,
      () => {
        uniformInt(rng, 0, 4294967295);
      },
      () => {
        mainUniformInt!(rng, 0, 4294967295);
      },
    );
    compete(
      `uniformBigInt @@ ${largeRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 4294967295n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 4294967295n);
      },
    );

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 2**40 -1]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 1099511627775);
    });
    compete(
      `uniformInt @@ ${veryLargeRangeLabel}`,
      () => {
        uniformInt(rng, 0, 1099511627775);
      },
      () => {
        mainUniformInt!(rng, 0, 1099511627775);
      },
    );
    compete(
      `uniformBigInt @@ ${veryLargeRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 1099511627775n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 1099511627775n);
      },
    );

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 2**80 -1]`;
    compete(
      `uniformBigInt @@ ${veryVeryLargeRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 1208925819614629174706175n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 1208925819614629174706175n);
      },
    );
  });

  describe('various ranges', () => {
    // no specific range
    bench(`native @@ {{float}} [0, 1)`, () => {
      nativeFloat();
    });
    compete(
      `uniformFloat32 @@ {{float}} [0, 1)`,
      () => {
        uniformFloat32(rng);
      },
      () => {
        mainUniformFloat32!(rng);
      },
    );
    compete(
      `uniformFloat64 @@ {{float}} [0, 1)`,
      () => {
        uniformFloat64(rng);
      },
      () => {
        mainUniformFloat64!(rng);
      },
    );

    // range < 2 ** 8
    const smallRangeLabel = `{{S range}} [0, 48]`;
    bench(`native @@ ${smallRangeLabel}`, () => {
      nativeInt(0, 48);
    });
    compete(
      `uniformInt @@ ${smallRangeLabel}`,
      () => {
        uniformInt(rng, 0, 48);
      },
      () => {
        mainUniformInt!(rng, 0, 48);
      },
    );
    compete(
      `uniformBigInt @@ ${smallRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 48n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 48n);
      },
    );

    // 2 ** 8 <= range < 2 ** 31
    const mediumRangeLabel = `{{M range}} [0, 1_000_000_000]`;
    bench(`native @@ ${mediumRangeLabel}`, () => {
      nativeInt(0, 1_000_000_000);
    });
    compete(
      `uniformInt @@ ${mediumRangeLabel}`,
      () => {
        uniformInt(rng, 0, 1_000_000_000);
      },
      () => {
        mainUniformInt!(rng, 0, 1_000_000_000);
      },
    );
    compete(
      `uniformBigInt @@ ${mediumRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 1_000_000_000n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 1_000_000_000n);
      },
    );

    // 2 ** 31 <= range < 2 ** 32
    const largeRangeLabel = `{{L range}} [0, 4_000_000_000]`;
    bench(`native @@ ${largeRangeLabel}`, () => {
      nativeInt(0, 4_000_000_000);
    });
    compete(
      `uniformInt @@ ${largeRangeLabel}`,
      () => {
        uniformInt(rng, 0, 4_000_000_000);
      },
      () => {
        mainUniformInt!(rng, 0, 4_000_000_000);
      },
    );
    compete(
      `uniformBigInt @@ ${largeRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 4_000_000_000n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 4_000_000_000n);
      },
    );

    // 2 ** 32 <= range < Number.MAX_SAFE_INTEGER
    const veryLargeRangeLabel = `{{XL range}} [0, 8_000_000_000]`;
    bench(`native @@ ${veryLargeRangeLabel}`, () => {
      nativeInt(0, 8_000_000_000);
    });
    compete(
      `uniformInt @@ ${veryLargeRangeLabel}`,
      () => {
        uniformInt(rng, 0, 8_000_000_000);
      },
      () => {
        mainUniformInt!(rng, 0, 8_000_000_000);
      },
    );
    compete(
      `uniformBigInt @@ ${veryLargeRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 8_000_000_000n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 8_000_000_000n);
      },
    );

    // Number.MAX_SAFE_INTEGER << range
    // WARNING: "number" type cannot fit for such ranges
    const veryVeryLargeRangeLabel = `{{XXL range}} [0, 100_000_000_000_000_000]`;
    compete(
      `uniformBigInt @@ ${veryVeryLargeRangeLabel}`,
      () => {
        uniformBigInt(rng, 0n, 100_000_000_000_000_000n);
      },
      () => {
        mainUniformBigInt!(rng, 0n, 100_000_000_000_000_000n);
      },
    );
  });
});

function nativeFloat() {
  return Math.random();
}

function nativeInt(from: number, to: number) {
  return from + Math.floor(Math.random() * (to - from + 1));
}
