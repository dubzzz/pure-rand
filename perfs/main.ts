import * as assert from 'assert';
import * as fc from 'fast-check';

import mersenne from '../src/generator/MersenneTwister';
import { uniformIntDistribution } from '../src/distribution/UniformDistribution';
import { congruential, congruential32 } from '../src/generator/LinearCongruential';

for (let num = 0 ; num !== 10 ; ++num) {
    const start = Date.now();
    const dist = uniformIntDistribution(0, 0xffffffff);
    let g = congruential32(num);
    for (let idx = 0 ; idx !== 10000000 ; ++idx) {
        g = dist(g)[1];
    }
    const end = Date.now();
    console.log(`time: ${end - start}`);
}
