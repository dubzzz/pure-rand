import { xoroShiro128Plus } from './pkg/pure_rand_rs.js';
import { xoroshiro128plus as xoroshiro128plusEsm } from '../../lib/esm/pure-rand.js';

console.log('wasm');
const rng = xoroShiro128Plus(0);
console.log(rng.unsafeNext());
console.log(rng.unsafeNext());
console.log(rng.unsafeNext());
console.log(rng.unsafeJump());
console.log(rng.unsafeNext());
console.log(rng.unsafeNext());
console.log(rng.unsafeNext());
console.log(rng.min());

console.log('esm');
const rngEsm = xoroshiro128plusEsm(0);
console.log(rngEsm.unsafeNext());
console.log(rngEsm.unsafeNext());
console.log(rngEsm.unsafeNext());
console.log(rngEsm.unsafeJump());
console.log(rngEsm.unsafeNext());
console.log(rngEsm.unsafeNext());
console.log(rngEsm.unsafeNext());
console.log(rngEsm.min());
