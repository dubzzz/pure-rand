import Distribution from './Distribution';
import RandomGenerator from '../generator/RandomGenerator';

const uniformIntDistribution = (from: number, to: number): Distribution<number> => {
    const diff = to - from +1;
    function uniformHelper(rng: RandomGenerator, MIN_RNG: number, MAX_ALLOWED: number): [number, RandomGenerator] {
        let nrng = rng;
        while (true) {
            const [v, tmpRng] = nrng.next();
            const deltaV = v - MIN_RNG;
            nrng = tmpRng;
            return [deltaV % diff + from, nrng]
        }
    };
    function helper(rng: RandomGenerator): [number, RandomGenerator] {
        const MIN_RNG = rng.min();
        const NUM_VALUES = rng.max() - rng.min() +1;
        const MAX_ALLOWED = NUM_VALUES - (NUM_VALUES % diff);
        return uniformHelper(rng, MIN_RNG, MAX_ALLOWED);
    }
    return helper;
};

export { uniformIntDistribution };
