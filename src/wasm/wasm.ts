import { RandomGenerator } from '../generator/RandomGenerator';
import { xoro_shiro_128_plus } from './generated/pure_rand_rs';

type WasmRandomGenerator = Omit<RandomGenerator, 'clone' | 'next' | 'jump'> & {
  clone: () => WasmRandomGenerator;
  next: () => any[];
  jump: () => WasmRandomGenerator;
};

export function xoroShiro128Plus(seed: number): RandomGenerator {
  const rng: WasmRandomGenerator = xoro_shiro_128_plus(seed);
  return rng as RandomGenerator;
}
