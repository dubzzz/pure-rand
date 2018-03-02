import { RandomGenerator, generate_n, skip_n } from './generator/RandomGenerator';
import congruential from './generator/LinearCongruential';
import mersenne from './generator/MersenneTwister';

export {
    RandomGenerator, generate_n, skip_n,
    congruential, mersenne
};
