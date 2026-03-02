import type { RandomGenerator } from './RandomGenerator';

export interface JumpableRandomGenerator extends RandomGenerator {
  /** Produce a fully independent clone of the current instance */
  clone(): JumpableRandomGenerator;
  /**
   * Jump current generator
   *
   * Move the generator forward by an extremely large number of steps in its sequence.
   * This is typically a number so large that it would be infeasible to reach by repeated `next()` calls.
   */
  jump(): void;
}
