import * as assert from 'assert';
import * as fc from 'fast-check';

import { uniformIntDistribution } from '../../src/distribution/UniformDistribution';
import mersenne from '../../src/generator/MersenneTwister';
import RandomGenerator from '../../src/generator/RandomGenerator';

class NatGenerator implements RandomGenerator {
    readonly current: number;
    constructor(current: number) {
        this.current = current % 0x80000000;
    }

    next(): [number, RandomGenerator] {
        return [this.current, new NatGenerator(this.current +1)];
    }
    min(): number {
        return 0;
    }
    max(): number {
        return 0x7fffffff;
    }
}

class ModNatGenerator implements RandomGenerator {
    constructor(readonly current: RandomGenerator, readonly mod: number) {
    }

    next(): [number, RandomGenerator] {
        const [v, nrng] = this.current.next();
        return [Math.abs(v % this.mod), new ModNatGenerator(nrng, this.mod)];
    }
    min(): number {
        return 0;
    }
    max(): number {
        return this.mod -1;
    }
}

const MAX_RANGE: number = 1000;

describe('uniformIntDistribution', () => {
    it('Should always generate values within the range', () => fc.assert(
        fc.property(fc.nat(), fc.integer(), fc.integer(0, MAX_RANGE),
            (offset, from, length) => {
                const [v, nrng] = uniformIntDistribution(from, from + length)(new NatGenerator(offset));
                return v >= from && v <= from + length;
            }
        )
    ));
    it('Should be able to generate all values within the range', () => fc.assert(
        fc.property(fc.nat(), fc.integer(), fc.integer(0, MAX_RANGE), fc.nat(),
            (offset, from, length, targetOffset) => {
                const target = from + (targetOffset) % (length +1);
                let rng: RandomGenerator = new NatGenerator(offset);
                for (let numTries = 0 ; numTries < 2*length +1 ; ++numTries) {
                    const [v, nrng] = uniformIntDistribution(from, from + length)(rng);
                    rng = nrng;
                    if (v === target) {
                        return true;
                    }
                }
                return false;//twice the length should always be enough (+1 to avoid length = 0)
            }
        )
    ));
    it('Should be evenly distributed over the range', () => fc.assert(
        fc.property(fc.nat(), fc.integer(), fc.integer(0, MAX_RANGE), fc.integer(1, 100),
            (offset, from, length, num) => {
                let buckets = [...Array(length+1)].map(() => 0);
                let rng: RandomGenerator = new NatGenerator(offset);
                for (let numTries = 0 ; numTries < num * (length +1) ; ++numTries) {
                    const [v, nrng] = uniformIntDistribution(from, from + length)(rng);
                    rng = nrng;
                    buckets[v -from] += 1;
                }
                return buckets.every(n => n === num);
            }
        )
    ));
    it('Should be able to generate values larger than the RandomGenerator', () => fc.assert(
        fc.property(fc.integer(), fc.integer(2, 0x7fffffff), (seed, mod) => {
            let rng: RandomGenerator = new ModNatGenerator(mersenne(seed), mod);
            for (let numTries = 0 ; numTries < 100 ; ++numTries) {
                const [v, nrng] = uniformIntDistribution(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)(rng);
                rng = nrng;
                if (v > rng.max()) {
                    return true;
                }
            }
            return false;
        })
    ));
    it('Should be able to generate values outside bitwise operations', () => fc.assert(
        fc.property(fc.integer(), fc.integer(2, 0x7fffffff), (seed, mod) => {
            let rng: RandomGenerator = new ModNatGenerator(mersenne(seed), mod);
            for (let numTries = 0 ; numTries < 100 ; ++numTries) {
                const [v, nrng] = uniformIntDistribution(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)(rng);
                rng = nrng;
                if (v > 0xffffffff) {
                    return true;
                }
            }
            return false;
        })
    ));
    it('Should be equivalent to call the 2-parameter and 3-parameter', () => fc.assert(
        fc.property(fc.nat(), fc.integer(), fc.integer(0, MAX_RANGE),
            (offset, from, length) => {
                const [v1, nrng1] = uniformIntDistribution(from, from + length)(new NatGenerator(offset));
                const [v2, nrng2] = uniformIntDistribution(from, from + length, new NatGenerator(offset));
                return v1 === v2;
            }
        )
    ));
});
