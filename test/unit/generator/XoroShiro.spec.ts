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
    // uint64_t next() {
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
        4294967253, 3587504873, 4286635183, 3511956468, 673719186, 1055838436, 982607204, 1805613139, 3223288787,
        1244866785, 2728956151, 371855737, 3026236645, 761656985, 3623017146, 1674769232, 1260144694, 1416578544,
        2676463084, 2327532132, 471399469, 3030140883, 3568270373, 1826979091, 469148973, 3655950307, 3683414099,
        145605805, 1297033582, 3082414981, 1426789818, 3231579470, 3488546250, 1264086088, 2948764953, 372475665,
        3412248164, 1493309586, 3927896870, 3919452640, 2709861855, 2298347239, 572622743, 2011037876, 3360650359,
        1693810876, 1171187038, 3872489959, 3989285417, 2747878152, 773928046, 4189989944, 1112534369, 4090243208,
        3154249958, 1333914584, 3040415146, 4032858677, 453868310, 825945095, 4289451331, 91466297, 1431128327,
        3208131715, 1831493458, 1461061492, 236677200, 651954392, 3509171451, 2033752905, 2253549766, 1751887713,
        4106536982, 3543831362, 2833653165, 2379144789, 2545941655, 3165371118, 300732224, 2117517824, 2796938915,
        2864151717, 1141572753, 4186463190, 1556859054, 1314617775, 4077757361, 2161308990, 3777135249, 1363575427,
        198627145, 3707137083, 4244826523, 3176117579, 881773079, 2488531002, 1345130922, 1379428837, 1687164873,
        325336063,
      ].map((v) => v | 0)
    );
  });
  it('Should produce the right sequence after jump for seed=42', () => {
    let g = xoroshiro128plus(42).jump!();
    let data = [];
    for (let idx = 0; idx !== 100; ++idx) {
      const [v, nextG] = g.next();
      data.push(v);
      g = nextG;
    }
    // should be equivalent to the following C code (+previous):
    // void jump() {
    //   static const uint64_t JUMP[] = { 0xdf900294d8f554a5, 0x170865df4b3201fc };
    //   uint64_t s0 = 0;
    //   uint64_t s1 = 0;
    //   for(int i = 0; i < sizeof JUMP / sizeof *JUMP; i++) {
    //     for(int b = 0; b < 64; b++) {
    //       if (JUMP[i] & UINT64_C(1) << b) {
    //         s0 ^= s[0];
    //         s1 ^= s[1];
    //       }
    //       next();
    //     }
    //   }
    //   s[0] = s0;
    //   s[1] = s1;
    // }
    assert.deepEqual(
      data,
      [
        1900530380, 2341274553, 4162717490, 2793985206, 3278912033, 1720265279, 1825471876, 3286742441, 1587050712,
        3950106747, 540536355, 991034460, 2981829782, 4159175603, 2930607761, 2509744087, 137421383, 4073225526,
        1650357769, 3278907225, 1023629082, 1415062380, 1032291476, 630729539, 1062523753, 2745179945, 1492748476,
        2700841735, 540597325, 3257104696, 2538947884, 3763735773, 3752663556, 75786448, 959579757, 794851477,
        2028874214, 802763541, 501515614, 3011491499, 3209732194, 2106362488, 573325014, 692069843, 2018337928,
        1079162215, 4086381254, 4010906511, 2073612605, 1843940750, 2647345033, 3519462589, 834294388, 1754260385,
        3973457473, 4129446855, 2052775225, 2106507442, 4178200040, 1507482091, 831962939, 4036397176, 3450323052,
        810857617, 1009339640, 544755776, 2015019841, 1590786875, 2300047967, 1153713139, 3461511701, 2255374235,
        3041282447, 3874500660, 2365439220, 3476174909, 2804287165, 3529576764, 2482037719, 3758708190, 2041488362,
        3953105597, 2604691846, 4241700961, 3231746381, 2481435019, 2100261339, 1442114730, 756514823, 316144959,
        3160143158, 2910044562, 4048037725, 1229183044, 2685549593, 173816268, 3565373219, 4220080560, 3252249431,
        2240144151,
      ].map((v) => v | 0)
    );
  });
  it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(xoroshiro128plus)));
  it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(xoroshiro128plus)));
  it('Should generate values between -2**31 and 2**31 -1', () => fc.assert(p.valuesInRange(xoroshiro128plus)));
  it('Should not depend on ordering between jump and next', () => fc.assert(p.noOrderNextJump(xoroshiro128plus)));
  it('Should impact itself with unsafeNext', () => fc.assert(p.changeSelfWithUnsafeNext(xoroshiro128plus)));
  it('Should impact itself with unsafeJump', () => fc.assert(p.changeSelfWithUnsafeJump(xoroshiro128plus)));
  it('Should not impact itself with next', () => fc.assert(p.noChangeSelfWithNext(xoroshiro128plus)));
  it('Should not impact itself with jump', () => fc.assert(p.noChangeSelfWithJump(xoroshiro128plus)));
  it('Should not impact clones when impacting itself on unsafeNext', () =>
    fc.assert(p.noChangeOnClonedWithUnsafeNext(xoroshiro128plus)));
  it('Should not impact clones when impacting itself on unsafeJump', () =>
    fc.assert(p.noChangeOnClonedWithUnsafeJump(xoroshiro128plus)));
});
