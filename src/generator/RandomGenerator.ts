export interface RandomGenerator {
  /** Produce a fully independent clone of the current instance */
  clone(): RandomGenerator;
  /**
   * Generate next random value along with the next generator (does not impact current instance).
   * Values uniform in range -0x8000_0000 (included) to 0x7fff_ffff (included)
   */
  next(): [number, RandomGenerator];
  /** Compute the jumped generator (does not impact current instance) */
  jump?(): RandomGenerator;
  /**
   * Generate next value BUT alters current generator.
   * Values uniform in range -0x8000_0000 (included) to 0x7fff_ffff (included)
   */
  unsafeNext(): number;
  /** Jump current generator */
  unsafeJump?(): void;
  /** Access to the internal state of a RandomGenerator in a read-only fashion */
  getState?(): readonly number[];
}

export function unsafeGenerateN(rng: RandomGenerator, num: number): number[] {
  const out: number[] = [];
  for (let idx = 0; idx != num; ++idx) {
    out.push(rng.unsafeNext());
  }
  return out;
}

export function generateN(rng: RandomGenerator, num: number): [number[], RandomGenerator] {
  const nextRng = rng.clone();
  const out = unsafeGenerateN(nextRng, num);
  return [out, nextRng];
}

export function unsafeSkipN(rng: RandomGenerator, num: number): void {
  for (let idx = 0; idx != num; ++idx) {
    rng.unsafeNext();
  }
}

export function skipN(rng: RandomGenerator, num: number): RandomGenerator {
  const nextRng = rng.clone();
  unsafeSkipN(nextRng, num);
  return nextRng;
}
