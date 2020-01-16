import * as assert from 'assert';
import * as fc from 'fast-check';

import { xoroshiro128plus } from '../../../src/generator/XoroShiro';
import * as p from './RandomGenerator.properties';

describe('xoroshiro128plus', () => {
  it('Should produce the right sequence for seed=42', () => {
    let g = xoroshiro128plus(42);
    let data = [];
    for (let idx = 0; idx !== 100; ++idx) {
      const [v, nextG] = g.next();
      data.push(v);
      g = nextG;
    }
    // should be equivalent to the following C code:
    // uint64_t s[] = { (uint64_t) (~42), ((uint64_t) 42) << 32 };
    // uint64_t rotl(const uint64_t x, int k) {
    //   return (x << k) | (x >> (64 - k));
    // }
    // uint64_t xoroshiro128plus() {
    //   const uint64_t s0 = s[0];
    //   uint64_t s1 = s[1];
    //   const uint64_t result = s0 + s1;
    //   s1 ^= s0;
    //   s[0] = rotl(s0, 24) ^ s1 ^ (s1 << 16); // a, b
    //   s[1] = rotl(s1, 37); // c
    //   return result & 0xffffffff;
    // }
    assert.deepEqual(
      data,
      [
        4294967253,
        3587504873,
        4286635183,
        3511956468,
        673719186,
        1055838436,
        982607204,
        1805613139,
        3223288787,
        1244866785,
        2728956151,
        371855737,
        3026236645,
        761656985,
        3623017146,
        1674769232,
        1260144694,
        1416578544,
        2676463084,
        2327532132,
        471399469,
        3030140883,
        3568270373,
        1826979091,
        469148973,
        3655950307,
        3683414099,
        145605805,
        1297033582,
        3082414981,
        1426789818,
        3231579470,
        3488546250,
        1264086088,
        2948764953,
        372475665,
        3412248164,
        1493309586,
        3927896870,
        3919452640,
        2709861855,
        2298347239,
        572622743,
        2011037876,
        3360650359,
        1693810876,
        1171187038,
        3872489959,
        3989285417,
        2747878152,
        773928046,
        4189989944,
        1112534369,
        4090243208,
        3154249958,
        1333914584,
        3040415146,
        4032858677,
        453868310,
        825945095,
        4289451331,
        91466297,
        1431128327,
        3208131715,
        1831493458,
        1461061492,
        236677200,
        651954392,
        3509171451,
        2033752905,
        2253549766,
        1751887713,
        4106536982,
        3543831362,
        2833653165,
        2379144789,
        2545941655,
        3165371118,
        300732224,
        2117517824,
        2796938915,
        2864151717,
        1141572753,
        4186463190,
        1556859054,
        1314617775,
        4077757361,
        2161308990,
        3777135249,
        1363575427,
        198627145,
        3707137083,
        4244826523,
        3176117579,
        881773079,
        2488531002,
        1345130922,
        1379428837,
        1687164873,
        325336063
      ].map(v => v | 0)
    );
  });
  it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(xoroshiro128plus)));
  it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(xoroshiro128plus)));
  it('Should generate values between -2**31 and 2**31 -1', () => fc.assert(p.valuesInRange(xoroshiro128plus)));
});
