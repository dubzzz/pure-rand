import { bench, describe } from 'vitest';
import { xorshift128plus } from '../generator/xorshift128plus';
import { uniformInt, uniformIntNew, uniformIntNewNew } from './uniformInt';

describe('distribution', () => {
  const rng = xorshift128plus(0);

  for (const range of [
    2,
    8,
    2 ** 4 - 1,
    16,
    2 ** 5 - 1,
    42,
    48,
    257,
    2 ** 21 - 1,
    2 ** 31 - 1,
    2 ** 31,
    2 ** 31 + 500,
    2 ** 32 - 2,
    2 ** 32 - 1,
  ]) {
    bench(`uniformInt @@ ${range}`, () => {
      uniformInt(rng, 0, range);
    });
    bench(`uniformIntNew @@ ${range}`, () => {
      uniformIntNew(rng, 0, range);
    });
    bench(`uniformIntNewNew @@ ${range}`, () => {
      uniformIntNewNew(rng, 0, range);
    });
  }
});
