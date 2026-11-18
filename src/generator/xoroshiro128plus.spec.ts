import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { xoroshiro128plus, xoroshiro128plusByArray, xoroshiro128plusFromState } from './xoroshiro128plus';
import * as p from './RandomGenerator.properties';

describe('xoroshiro128plus', () => {
  it('Should produce the right sequence for seed=42', () => {
    const g = xoroshiro128plus(42);
    let data = [];
    for (let idx = 0; idx !== 100; ++idx) {
      const v = g.next();
      data.push(v);
    }
    expect(data).toEqual(
      [
        848759690, 3937095118, 679381268, 2086136720, 1069417914, 3112183536, 3085311579, 2012841997, 251437861,
        3123384724, 3736014159, 3889734216, 940642261, 1298121229, 771039082, 4175451526, 2992432417, 2962665993,
        1178451948, 159190433, 841463361, 3528069797, 4273358370, 3362477890, 251054464, 2459206788, 4128795488,
        2334749251, 1783994297, 1444306595, 370847506, 3077019928, 1644064663, 137465172, 2540496867, 1523673794,
        3455076880, 869890264, 3339614859, 2803529861, 2364369122, 204649018, 3645061599, 1177005711, 771769226,
        3047555697, 979327409, 704031041, 3065092641, 920854571, 3678197548, 1034138097, 3911532147, 2565895859,
        1881090685, 4235101006, 2079767403, 2414567016, 2249936720, 11773547, 3513314833, 856203968, 4190016914,
        1399614284, 2377820411, 1229948791, 2280012823, 194613071, 2342178235, 3566747766, 2123942111, 2205446024,
        289540243, 2811385999, 3639040886, 451681018, 3318859253, 4139402942, 4013134213, 955882312, 1317141902,
        3283836021, 3636973917, 411578869, 458741869, 2561409317, 1055356387, 143982886, 1633152426, 2028983192,
        4116419629, 1271161159, 3192202245, 1815596214, 3792875021, 32336885, 2300458740, 661098841, 3634143756,
        1502219484,
      ].map((v) => v | 0),
    );
  });
  it('Should produce the right sequence after jump for seed=42', () => {
    const g = xoroshiro128plus(42);
    g.jump();
    let data = [];
    for (let idx = 0; idx !== 100; ++idx) {
      const v = g.next();
      data.push(v);
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
    expect(data).toEqual(
      [
        1745207772, 660124873, 3315019311, 294164011, 222700138, 636028129, 813252918, 3130129129, 700884093,
        2080394899, 877205804, 1986772347, 4153535725, 1013125471, 1193028961, 776145940, 2786374164, 2425934124,
        522619387, 1960231713, 3984924084, 1363803268, 3841624681, 2795893168, 2109373131, 2686276737, 3234382941,
        2262754873, 2874936213, 1478831717, 4065730483, 3392835195, 3824672951, 3362937680, 1246444946, 3222741898,
        1084197424, 197540511, 3769261709, 2471896481, 2640199046, 3981903920, 3595606249, 2054076328, 1250943313,
        4038662395, 541115289, 2055897630, 1000443674, 3072438844, 2824680420, 3691524613, 1065767358, 2994744326,
        2652125169, 1624987679, 3847373868, 1525589129, 3212689082, 3291284094, 2578261909, 3173926606, 559897332,
        3927647879, 2869703131, 341543210, 659389486, 2422812953, 2128444521, 3356764884, 4058079105, 284847590,
        2769887474, 2806435107, 2026383995, 735091054, 4134250939, 1045851455, 2601920870, 2500458343, 1119620323,
        3465429846, 1417986249, 38504963, 4015613671, 753466762, 269731636, 1965277410, 1179231702, 3231634236,
        1868180488, 3300073987, 815346967, 3326336952, 1825490287, 2536796179, 3181593412, 1628603697, 4253899947,
        2747058995,
      ].map((v) => v | 0),
    );
  });
  it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(xoroshiro128plus)));
  it('Should return the same sequence when built from state', () =>
    fc.assert(p.clonedFromStateSameSequences(xoroshiro128plus, xoroshiro128plusFromState)));
  it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(xoroshiro128plus)));
  it('Should generate values between -2**31 and 2**31 -1', () => fc.assert(p.valuesInRange(xoroshiro128plus)));
  it('Should not depend on ordering between jump and next', () => fc.assert(p.noOrderNextJump(xoroshiro128plus)));
  it('Should impact itself with next', () => fc.assert(p.changeSelfWithNext(xoroshiro128plus)));
  it('Should impact itself with jump', () => fc.assert(p.changeSelfWithJump(xoroshiro128plus)));
  it('Should not impact clones when impacting itself on next', () =>
    fc.assert(p.noChangeOnClonedWithNext(xoroshiro128plus)));
  it('Should not impact clones when impacting itself on jump', () =>
    fc.assert(p.noChangeOnClonedWithJump(xoroshiro128plus)));
});

describe('xoroshiro128plusByArray', () => {
  it('Should produce the same sequence as single-seed xoroshiro128plus', () => {
    const g1 = xoroshiro128plusByArray([42]);
    const g2 = xoroshiro128plus(42);
    const seq1 = Array.from({ length: 10 }, () => g1.next());
    const seq2 = Array.from({ length: 10 }, () => g2.next());
    expect(seq1).toEqual(seq2);
  });

  it('Should return the same sequence given the same seed array', () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { minLength: 1, maxLength: 20 }), fc.nat(100), fc.nat(20), (seeds, offset, num) => {
        const g1 = xoroshiro128plusByArray(seeds);
        const g2 = xoroshiro128plusByArray(seeds);
        for (let i = 0; i < offset; i++) { g1.next(); g2.next(); }
        const seq1 = Array.from({ length: num }, () => g1.next());
        const seq2 = Array.from({ length: num }, () => g2.next());
        expect(seq1).toEqual(seq2);
      }),
    );
  });

  it('Should generate values between -2**31 and 2**31 -1', () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { minLength: 1, maxLength: 20 }), fc.nat(100), (seeds, offset) => {
        const g = xoroshiro128plusByArray(seeds);
        for (let i = 0; i < offset; i++) g.next();
        const value = g.next();
        expect(value).toBeGreaterThanOrEqual(-0x80000000);
        expect(value).toBeLessThanOrEqual(0x7fffffff);
      }),
    );
  });

  it('Should not impact clones when impacting itself on next', () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { minLength: 1, maxLength: 20 }), fc.nat(50), (seeds, offset) => {
        const g = xoroshiro128plusByArray(seeds);
        for (let i = 0; i < offset; i++) g.next();
        const clone = g.clone();
        const stateBefore = JSON.stringify(g);
        g.next();
        expect(JSON.stringify(clone)).toBe(stateBefore);
      }),
    );
  });
});
