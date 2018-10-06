import * as assert from 'assert';
import * as fc from 'fast-check';

import { congruential, congruential32 } from '../../../src/generator/LinearCongruential';
import { uniformIntDistribution } from '../../../src/distribution/UniformDistribution';
import * as p from './RandomGenerator.properties';

describe('congruential', () => {
    it('Should produce the right sequence for seed=42', () => {
        let g = congruential(42);
        let data = [];
        for (let idx = 0 ; idx !== 10 ; ++idx) {
            const [v, nextG] = g.next();
            data.push(v);
            g = nextG;
        }

        // Same values as Visual C++ rand() for srand(42)
        assert.deepEqual(data, [
            175, 400, 17869,
            30056, 16083, 12879,
            8016, 7644, 15809,
            1769]);
    });
    it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(congruential)));
    it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(congruential)));
    it('Should generate values between 0 and 2**15 -1', () => fc.assert(p.valuesInRange(congruential)));
});

describe('congruential32', () => {
    it('Should return the same sequence given same seeds', () => fc.assert(p.sameSeedSameSequences(congruential32)));
    it('Should return the same sequence if called twice', () => fc.assert(p.sameSequencesIfCallTwice(congruential32)));
    it('Should generate values between 0 and 2**32 -1', () => fc.assert(p.valuesInRange(congruential32)));
    it('Should be equivalent to a uniform distribution of congruential over 32 bits', () => fc.assert(
        fc.property(fc.integer(), fc.integer(1, 100), (seed, num) => {
            let rng = congruential(seed);
            let rng32 = congruential32(seed);
            const dist = uniformIntDistribution(0, 0xffffffff);
            for (let idx = 0 ; idx !== num ; ++idx) {
                const [v1, nrng] = dist(rng);
                const [v2, nrng32] = dist(rng32);
                if (v1 !== v2) {
                    return false;
                }
                rng = nrng;
                rng32 = nrng32;
            }
            return true;
        })
    ));
});
