import { RandomGenerator } from '../generator/RandomGenerator';

type Distribution<T> = (rng: RandomGenerator) => [T, RandomGenerator];
export default Distribution;
export { Distribution };
