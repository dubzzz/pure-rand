import { describe, bench } from 'vitest';
import { xorshift128plus } from '../generator/xorshift128plus';
import { uniformBigInt } from './uniformBigInt';

describe('uniformBigInt', () => {
  const rng = xorshift128plus(0);

  // -- Tiny / degenerate
  bench('degenerate {{0n, 0n}}', () => {
    uniformBigInt(rng, 0n, 0n);
  });
  bench('smallest non-degenerate {{0n, 1n}}', () => {
    uniformBigInt(rng, 0n, 1n);
  });

  // -- Fits in 1 uint32 (single rng.next() call required), small range
  bench('range pow2-1: {{0n, 15n}}', () => {
    uniformBigInt(rng, 0n, 15n);
  });
  bench('range 17 (pow2+1, high rejection): {{0n, 16n}}', () => {
    uniformBigInt(rng, 0n, 16n);
  });
  bench('range 16 (pow2 exact): {{0n, 15n}} again', () => {
    uniformBigInt(rng, 0n, 15n);
  });
  bench('worst case rejection ({{0n, 65534n}} -> range=65535)', () => {
    uniformBigInt(rng, 0n, 65534n);
  });
  bench('range pow2 exact 2^16: {{0n, 65535n}}', () => {
    uniformBigInt(rng, 0n, 65535n);
  });
  bench('range 2^16+1: {{0n, 65536n}}', () => {
    uniformBigInt(rng, 0n, 65536n);
  });

  // -- Range size = 2^32 (exactly fills 1 iteration)
  bench('range exactly 2^32: {{0n, 4294967295n}}', () => {
    uniformBigInt(rng, 0n, 4294967295n);
  });

  // -- Range size = 2^32 + 1 (boundary, triggers 2 iterations)
  bench('range 2^32 + 1: {{0n, 4294967296n}}', () => {
    uniformBigInt(rng, 0n, 4294967296n);
  });

  // -- Range size = 2^33 (triggers 2 iterations)
  bench('range 2^33: {{0n, 8589934591n}}', () => {
    uniformBigInt(rng, 0n, 8589934591n);
  });

  // -- Range size = 2^40 (triggers 2 iterations)
  bench('range 2^40: {{0n, 2^40 - 1}}', () => {
    uniformBigInt(rng, 0n, 1099511627775n);
  });

  // -- Range size = 2^64 (2 iterations)
  bench('range 2^64: {{0n, 2^64 - 1}}', () => {
    uniformBigInt(rng, 0n, 0xffffffffffffffffn);
  });

  // -- Range size = 2^64 + 1 (3 iterations)
  bench('range 2^64+1: {{0n, 2^64}}', () => {
    uniformBigInt(rng, 0n, 0x10000000000000000n);
  });

  // -- Range size = 2^65 (3 iterations)
  bench('range 2^65: {{0n, 2^65 - 1}}', () => {
    uniformBigInt(rng, 0n, 0x1ffffffffffffffffn);
  });

  // -- Range size = 2^96 (3 iterations)
  bench('range 2^96: {{0n, 2^96 - 1}}', () => {
    uniformBigInt(rng, 0n, 0xffffffffffffffffffffffffn);
  });

  // -- Range size = 2^128 (4 iterations)
  bench('range 2^128: {{0n, 2^128 - 1}}', () => {
    uniformBigInt(rng, 0n, 0xffffffffffffffffffffffffffffffffn);
  });

  // -- Power-of-2 ranges (no rejection)
  bench('range pow2 exact 2^32: {{0n, 2^32 - 1}}', () => {
    uniformBigInt(rng, 0n, 0xffffffffn);
  });
  bench('range pow2 exact 2^64: {{0n, 2^64 - 1}}', () => {
    uniformBigInt(rng, 0n, 0xffffffffffffffffn);
  });
  bench('range pow2 exact 2^96: {{0n, 2^96 - 1}}', () => {
    uniformBigInt(rng, 0n, 0xffffffffffffffffffffffffn);
  });

  // -- Power-of-2 minus 1 (worst case rejection on 2-iter)
  bench('range 2^40 - 1: {{0n, 2^40 - 2}}', () => {
    uniformBigInt(rng, 0n, 1099511627774n);
  });

  // -- Power-of-2 plus 1 (high rejection)
  bench('range 2^40 + 1 (2-iter, high rej): {{0n, 2^40}}', () => {
    uniformBigInt(rng, 0n, 1099511627776n);
  });

  // -- Negative `from` to non-negative `to`
  bench('negative from: {{-100n, 100n}}', () => {
    uniformBigInt(rng, -100n, 100n);
  });
  bench('mersenne range: {{-2^31, 2^31-1}}', () => {
    uniformBigInt(rng, -2147483648n, 2147483647n);
  });
  bench('full safe int range: {{MIN_SAFE_INTEGER, MAX_SAFE_INTEGER}}', () => {
    uniformBigInt(rng, -9007199254740991n, 9007199254740991n);
  });
});
