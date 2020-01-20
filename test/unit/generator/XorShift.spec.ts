import * as assert from 'assert';
import * as fc from 'fast-check';

import { xorshift128plus } from '../../../src/generator/XorShift';
import * as p from './RandomGenerator.properties';

describe('xorshift128plus', () => {
  it('Should produce the right sequence for seed=42', () => {
    let g = xorshift128plus(42);
    let data = [];
    for (let idx = 0; idx !== 100; ++idx) {
      const [v, nextG] = g.next();
      data.push(v);
      g = nextG;
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
    assert.deepEqual(
      data,
      [
        4294967253,
        1166015114,
        1692303336,
        3482095935,
        4288634584,
        1325520545,
        1367235622,
        1759582253,
        2328126844,
        649610899,
        3328014937,
        278910909,
        2928761053,
        1702820659,
        3325106640,
        2884641937,
        2678880596,
        999204680,
        3611521009,
        2947011440,
        3416747393,
        1634581895,
        1067867852,
        88558932,
        2888797634,
        2105694663,
        1296024496,
        2583386047,
        2401573111,
        2171058030,
        657541993,
        915947238,
        696903927,
        2687397535,
        161811119,
        793638981,
        3330697646,
        532898537,
        3343714389,
        1441469376,
        1718504920,
        1003802668,
        3343696598,
        1851708816,
        2581827611,
        1621906647,
        3349035115,
        264489114,
        3672600296,
        2277593912,
        1157240243,
        3243862613,
        1246478095,
        3690736557,
        1366822450,
        1444073535,
        841971999,
        1179174583,
        3726899152,
        817046495,
        509174047,
        1199791094,
        2405463672,
        827001813,
        1820926848,
        400677546,
        1599444384,
        3885120670,
        2210955775,
        2746964964,
        211002306,
        1381674843,
        2689051285,
        1702045018,
        882144076,
        553855887,
        2369937669,
        3656191263,
        1560721536,
        3818918581,
        86283002,
        3023862018,
        1296400131,
        625483410,
        2364517346,
        3034167893,
        1805836022,
        2782947729,
        1110539129,
        3221939945,
        2436039688,
        1150739462,
        3430900671,
        439413983,
        4238985145,
        3053101980,
        1358457066,
        1504768706,
        2433376141,
        4069088729
      ].map(v => v | 0)
    );
  });
  it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(xorshift128plus)));
  it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(xorshift128plus)));
  it('Should generate values between -2**31 and 2**31 -1', () => fc.assert(p.valuesInRange(xorshift128plus)));
});
