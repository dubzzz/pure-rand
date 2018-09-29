import { RandomGenerator } from './RandomGenerator'

// Inspired from java.util.Random implementation
// http://grepcode.com/file/repository.grepcode.com/java/root/jdk/openjdk/6-b14/java/util/Random.java#Random.next%28int%29
// Updated with values from: https://en.wikipedia.org/wiki/Linear_congruential_generator
const MULTIPLIER: number = 0x000343fd;
const INCREMENT: number = 0x00269ec3;
const MASK: number = 0xffffffff;
const MASK_2: number = (1 << 31) -1;

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
        const nextseed = (this.seed * MULTIPLIER + INCREMENT) & MASK;
        return [(nextseed & MASK_2) >> 16, new LinearCongruential(nextseed)]
    }
}

class LinearCongruential32 implements RandomGenerator {
    static readonly offset: number = 2**15;
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
        const c0 = new LinearCongruential(this.seed);
        const [v1, c1] = c0.next();
        const [v2, c2] = c1.next();
        const [v3, c3] = c2.next();
        return [v3 + LinearCongruential32.offset * (v2 + LinearCongruential32.offset * (v1 % 4)), new LinearCongruential32(c3.seed)];
    }
}

export const congruential = function(seed: number): RandomGenerator {
    return new LinearCongruential(seed);
};
export const congruential32 = function(seed: number): RandomGenerator {
    return new LinearCongruential32(seed);
};
