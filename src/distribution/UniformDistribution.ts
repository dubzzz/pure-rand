import Distribution from './Distribution';
import RandomGenerator from '../generator/RandomGenerator';

const uniformIntDistribution = (from: number, to: number): Distribution<number> => {
    const diff = to - from +1;
    function helper(rng: RandomGenerator): [number, RandomGenerator] {
        let nrng = rng;
        const MIN_RNG = rng.min();
        const NUM_VALUES = rng.max() - rng.min() +1;

        // Range provided by the RandomGenerator is large enough
        
        if (diff <= NUM_VALUES) {
            const MAX_ALLOWED = NUM_VALUES - (NUM_VALUES % diff);
            while (true) {
                const [v, tmpRng] = nrng.next();
                const deltaV = v - MIN_RNG;
                nrng = tmpRng;
                if (deltaV < MAX_ALLOWED) {
                    return [deltaV % diff + from, nrng];
                }
            }
        }
        
        // Range provided by the RandomGenerator is too small

        let maxRandomValue = 1;
        let numIterationsRequired = 0;
        while (maxRandomValue < diff) {
            maxRandomValue *= NUM_VALUES;
            ++numIterationsRequired;
        }
        const maxAllowedRandom = diff * Math.floor(1. * maxRandomValue / diff);
        
        while (true) {
            let value = 0;
            for (let num = 0 ; num !== numIterationsRequired ; ++num) {
                const [v, tmpRng] = nrng.next();
                value = NUM_VALUES * value + (v - MIN_RNG);
                nrng = tmpRng;
            }
            if (value < maxAllowedRandom) {
                const inDiff = value - diff * Math.floor(1. * value / diff);
                return [inDiff + from, nrng];
            }
        }
    }
    return helper;
};

export { uniformIntDistribution };
