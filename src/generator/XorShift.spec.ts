import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { xorshift128plus, xorshift128plusFromState } from './XorShift';
import * as p from './RandomGenerator.properties';

describe('xorshift128plus', () => {
  it('Should produce the right sequence for seed=42', () => {
    const g = xorshift128plus(42);
    let data = [];
    for (let idx = 0; idx !== 100; ++idx) {
      const v = g.next();
      data.push(v);
    }
    // should be equivalent to the following C code:
    // uint64_t s[] = { (uint64_t) (~42), ((uint64_t) 42) << 32 };
    // uint64_t next() {
    // 	 uint64_t s1 = s[0];
    //   const uint64_t s0 = s[1];
    //   const uint64_t result = s0 + s1;
    //   s[0] = s0;
    //   s1 ^= s1 << 23; // a
    //   s[1] = s1 ^ s0 ^ (s1 >> 18) ^ (s0 >> 5); // b, c
    //   return result & 0xffffffff;
    // }
    // int main() {
    //   for (int i = 0 ; i != 100 ; ++i) { std::cout << next() << ","; }
    // }
    expect(data).toEqual(
      [
        4294967253, 1166015114, 1692303336, 3482095935, 4288634584, 1325520545, 1367235622, 1759582253, 2328126844,
        649610899, 3328014937, 278910909, 2928761053, 1702820659, 3325106640, 2884641937, 2678880596, 999204680,
        3611521009, 2947011440, 3416747393, 1634581895, 1067867852, 88558932, 2888797634, 2105694663, 1296024496,
        2583386047, 2401573111, 2171058030, 657541993, 915947238, 696903927, 2687397535, 161811119, 793638981,
        3330697646, 532898537, 3343714389, 1441469376, 1718504920, 1003802668, 3343696598, 1851708816, 2581827611,
        1621906647, 3349035115, 264489114, 3672600296, 2277593912, 1157240243, 3243862613, 1246478095, 3690736557,
        1366822450, 1444073535, 841971999, 1179174583, 3726899152, 817046495, 509174047, 1199791094, 2405463672,
        827001813, 1820926848, 400677546, 1599444384, 3885120670, 2210955775, 2746964964, 211002306, 1381674843,
        2689051285, 1702045018, 882144076, 553855887, 2369937669, 3656191263, 1560721536, 3818918581, 86283002,
        3023862018, 1296400131, 625483410, 2364517346, 3034167893, 1805836022, 2782947729, 1110539129, 3221939945,
        2436039688, 1150739462, 3430900671, 439413983, 4238985145, 3053101980, 1358457066, 1504768706, 2433376141,
        4069088729,
      ].map((v) => v | 0),
    );
  });
  it('Should produce the right sequence after jump for seed=42', () => {
    const g = xorshift128plus(42);
    g.jump!();
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
        2971276074, 3466165198, 456875496, 2879848137, 4162428146, 2513269982, 2277233661, 2163024882, 3082356668,
        1459960119, 3225207140, 418458707, 465389025, 33345291, 9975393, 1398264340, 2941704490, 4219353700, 1050887263,
        3537623901, 1011298813, 2886999094, 2095512742, 719748796, 2031575611, 246165700, 306697934, 932458853,
        3811330946, 2780216938, 3008525324, 1217535119, 3060075487, 3829564179, 1862997734, 3188200581, 3652713690,
        1950714292, 2865049298, 1937705104, 1297917374, 1333060788, 4089226157, 205959794, 2227024661, 3714058862,
        3728103989, 3728972300, 659396325, 3185943613, 1039549819, 2822001969, 406983436, 2343603502, 299506842,
        383551218, 698423599, 3611096673, 3762219019, 2293131106, 373955997, 2445208504, 3057049169, 1255899189,
        4215756297, 957357335, 3456668141, 1989928862, 3510600746, 3806106322, 2542824253, 3920739152, 2851853721,
        4208037803, 1276020689, 3735104409, 3925674077, 3708482212, 4262192769, 2607567703, 531897672, 3317376658,
        1903132291, 353686572, 509303103, 3991810724, 1786729004, 1709580489, 550755974, 1081340778, 1040041085,
        2723398036, 3276389190, 506083384, 2810025290, 3110824839, 3094567277, 2333614204, 3869414189, 678984428,
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
