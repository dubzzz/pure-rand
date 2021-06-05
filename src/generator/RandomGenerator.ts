export default interface RandomGenerator {
  next(): [number, RandomGenerator];
  jump?(): RandomGenerator;
  min(): number; //inclusive
  max(): number; //inclusive
}
export { RandomGenerator };

export interface RandomGeneratorWithUnsafe extends RandomGenerator {
  clone(): RandomGeneratorWithUnsafe;
  unsafeNext(): number;
  unsafeJump?(): void;
}

export function generateN(rng: RandomGenerator, num: number): [number[], RandomGenerator] {
  let cur: RandomGenerator = rng;
  const out: number[] = [];
  for (let idx = 0; idx != num; ++idx) {
    const nextOut = cur.next();
    out.push(nextOut[0]);
    cur = nextOut[1];
  }
  return [out, cur];
}

export function skipN(rng: RandomGenerator, num: number): RandomGenerator {
  return generateN(rng, num)[1];
}
