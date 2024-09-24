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
