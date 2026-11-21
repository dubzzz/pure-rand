/**
 * A 64-bit seed represented by two unsigned 32-bit integers.
 * The most significant word comes first, followed by the least significant word.
 *
 * @public
 */
export type Seed64 = readonly [high: number, low: number];
