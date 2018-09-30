import { RandomGenerator } from './RandomGenerator'

// Inspired from java.util.Random implementation
// http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/util/Random.java#Random.next%28int%29
// Updated with values from: https://en.wikipedia.org/wiki/Linear_congruential_generator
const MULTIPLIER: number = 0x000343fd;
const INCREMENT: number = 0x00269ec3;
const MASK: number = 0xffffffff;
const MASK_2: number = (1 << 31) -1;

const computeNextSeed = function(seed: number) {
    return (seed * MULTIPLIER + INCREMENT) & MASK;
}
const computeValueFromNextSeed = function(nextseed: number) {
    return (nextseed & MASK_2) >> 16;
}

class LinearCongruential implements RandomGenerator {
    // Should produce exactly the same values
    // as the following C++ code compiled with Visual Studio:
    //  * constructor = srand(seed);
    //  * next        = rand();
    static readonly min: number = 0;
    static readonly max: number = 2**15 -1;

    constructor(readonly seed: number) {}
    
    min(): number {
        return LinearCongruential.min;
    }
    
    max(): number {
        return LinearCongruential.max;
    }

    next(): [number, LinearCongruential] {
        const nextseed = computeNextSeed(this.seed);
        return [computeValueFromNextSeed(nextseed), new LinearCongruential(nextseed)]
    }
}

class LinearCongruential32 implements RandomGenerator {
    static readonly min: number = 0;
    static readonly max: number = 0xffffffff;

    constructor(readonly seed: number) {}
    
    min(): number {
        return LinearCongruential32.min;
    }
    
    max(): number {
        return LinearCongruential32.max;
    }

    next(): [number, RandomGenerator] {
        const s1 = computeNextSeed(this.seed);
        const v1 = computeValueFromNextSeed(s1);
        const s2 = computeNextSeed(s1);
        const v2 = computeValueFromNextSeed(s2);
        const s3 = computeNextSeed(s2);
        const v3 = computeValueFromNextSeed(s3);
        
        // value between: -0x80000000 and 0x7fffffff
        const vnext = v3 + ((v2 + ((v1 & 3) << 15)) << 15);
        return [((vnext + 0x80000000) | 0) + 0x80000000, new LinearCongruential32(s3)];
    }
}

export const congruential = function(seed: number): RandomGenerator {
    return new LinearCongruential(seed);
};
export const congruential32 = function(seed: number): RandomGenerator {
    return new LinearCongruential32(seed);
};
