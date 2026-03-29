import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { xorshift128plus, xorshift128plusByArray, xorshift128plusFromState } from './xorshift128plus';
import * as p from './RandomGenerator.properties';

describe('xorshift128plus', () => {
  it('Should produce the right sequence for seed=42', () => {
    const g = xorshift128plus(42);
    let data = [];
    for (let idx = 0; idx !== 100; ++idx) {
      const v = g.next();
      data.push(v);
    }
    expect(data).toEqual(
      [
        848759690, 4078390679, 4242460690, 1071249996, 4096366767, 1649542920, 125903239, 1401853409, 1854569215,
        534067610, 772087061, 1377230893, 814465990, 1536544839, 310993110, 1177039722, 1840289283, 2052856877,
        3532488935, 1686695732, 2831106576, 444903165, 2588506589, 2243970668, 734686743, 267476898, 2217959033,
        1118393738, 394083844, 2978598316, 3802944753, 162553279, 290902677, 3958234757, 4006444278, 4192132544,
        1376003655, 3443300296, 945303904, 1529048692, 1887403992, 3544356318, 2323458085, 1767431205, 3267400560,
        1038421581, 3690509094, 2234936508, 3065138686, 3950734096, 3571502810, 812191158, 3654124202, 2581849612,
        3823292143, 2886088626, 1090736113, 1641373768, 3233042253, 4039825944, 1550171115, 1871623894, 1370329874,
        416635416, 4197644129, 4076375887, 28621606, 3517309218, 1950274444, 993958118, 4191013205, 512856045,
        2751131342, 493873229, 1680416171, 3011082470, 2451992318, 1658214577, 2765683759, 1605197446, 4190319741,
        2198529851, 615891112, 881066691, 3607296119, 1505130568, 932866146, 1714319653, 2931041383, 756961027,
        2224847663, 3811116250, 1375391564, 2584379001, 2828356314, 3155303845, 42421612, 177968472, 2773153765,
        2399607783,
      ].map((v) => v | 0),
    );
  });
  it('Should produce the right sequence after jump for seed=42', () => {
    const g = xorshift128plus(42);
    g.jump();
    let data = [];
    for (let idx = 0; idx !== 100; ++idx) {
      const v = g.next();
      data.push(v);
    }
    // should be equivalent to the following C++ code (+previous):
    // void jump() {
    //   static const uint64_t JUMP[] = { 0x8a5cd789635d2dff, 0x121fd2155c472f96 };
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
    // int main() {
    //   jump();
    //   for (int i = 0 ; i != 100 ; ++i) { std::cout << next() << ","; }
    // }
    expect(data).toEqual(
      [
        1498003135, 360515799, 2333625138, 4176152393, 3069730475, 3100194675, 1298283584, 2274726529, 2822316403,
        258111182, 42065219, 196882753, 4027389506, 150448134, 3612861279, 2151003826, 2000540497, 2902034403,
        2319357644, 3827772507, 2662258206, 3737906310, 3067228474, 430181085, 3080613218, 2333014051, 3003369930,
        4204902945, 962861481, 1643843685, 3457159730, 1979523862, 1504528313, 821382385, 999394332, 4164237518,
        1338783085, 115591951, 1332242585, 2998320644, 4000130589, 772852449, 2871849122, 395245214, 442223609,
        2515400021, 4247426103, 2528603035, 606067719, 3746113078, 3928710383, 2499736275, 1923259133, 3443928873,
        1113696995, 4135326282, 1696265168, 848196174, 4053137794, 3571586410, 1175361389, 3304990276, 4107680972,
        4278911461, 2911894048, 3497423393, 2907964008, 1397065873, 1732131399, 322209901, 1425361692, 17944119,
        2309302906, 2291767444, 2256481737, 106539787, 824688491, 3954981804, 113928097, 3260278769, 2224820965,
        72796444, 1591378573, 2445281279, 1807336236, 1677989064, 2273748579, 3729952111, 1882920495, 3256239052,
        353981850, 3165328650, 4250659504, 3852511272, 2106317186, 1370083300, 1186543070, 3924647919, 4155182878,
        3898429841,
      ].map((v) => v | 0),
    );
  });
  it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(xorshift128plus)));
  it('Should return the same sequence when built from state', () =>
    fc.assert(p.clonedFromStateSameSequences(xorshift128plus, xorshift128plusFromState)));
  it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(xorshift128plus)));
  it('Should generate values between -2**31 and 2**31 -1', () => fc.assert(p.valuesInRange(xorshift128plus)));
  it('Should not depend on ordering between jump and next', () => fc.assert(p.noOrderNextJump(xorshift128plus)));
  it('Should impact itself with next', () => fc.assert(p.changeSelfWithNext(xorshift128plus)));
  it('Should impact itself with jump', () => fc.assert(p.changeSelfWithJump(xorshift128plus)));
  it('Should not impact clones when impacting itself on next', () =>
    fc.assert(p.noChangeOnClonedWithNext(xorshift128plus)));
  it('Should not impact clones when impacting itself on jump', () =>
    fc.assert(p.noChangeOnClonedWithJump(xorshift128plus)));
});

describe('xorshift128plusByArray', () => {
  it('Should produce the same sequence as single-seed xorshift128plus', () => {
    const g1 = xorshift128plusByArray([42]);
    const g2 = xorshift128plus(42);
    const seq1 = Array.from({ length: 10 }, () => g1.next());
    const seq2 = Array.from({ length: 10 }, () => g2.next());
    expect(seq1).toEqual(seq2);
  });

  it('Should return the same sequence given the same seed array', () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { minLength: 1, maxLength: 20 }), fc.nat(100), fc.nat(20), (seeds, offset, num) => {
        const g1 = xorshift128plusByArray(seeds);
        const g2 = xorshift128plusByArray(seeds);
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
        const g = xorshift128plusByArray(seeds);
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
        const g = xorshift128plusByArray(seeds);
        for (let i = 0; i < offset; i++) g.next();
        const clone = g.clone();
        const stateBefore = JSON.stringify(g);
        g.next();
        expect(JSON.stringify(clone)).toBe(stateBefore);
      }),
    );
  });
});
