/**
 * An ArrayInt represents an integer larger than what can be represented in classical JavaScript.
 * The values stored in data must be in the range [0, 0xffffffff].
 *
 * @example
 * ```js
 * { data: [ 42 ] } // = 42
 * { sign: -1, data: [ 42 ] } // = -42
 * { sign: -1, data: [ 5, 42 ] } // = -1 * (5 * 2**32 + 42)
 * { sign: -1, data: [ 1, 5, 42 ] } // = -1 * (1 * 2**64 + 5 * 2**32 + 42)
 * ```
 */
export type ArrayInt = {
  /**
   * Sign of the represented number
   * @defaultValue 1
   */
  sign?: -1 | 1;
  /**
   * Value of the number, must only contain numbers in the range [0, 0xffffffff]
   */
  data: number[];
};

/** @internal */
export function toNumber(arrayInt: ArrayInt): number {
  let current = arrayInt.data[0];
  const arrayIntLength = arrayInt.data.length;
  for (let index = 1; index < arrayIntLength; ++index) {
    current *= 0x100000000;
    current += arrayInt.data[index];
  }
  return current * (arrayInt.sign || 1);
}

// Helpers specific to 64 bits versions

/** @internal */
export type ArrayInt64 = ArrayInt & { data: [number, number] };

/**
 * We only accept safe integers here
 * @internal
 */
export function fromNumberToArrayInt64(out: ArrayInt64, n: number): ArrayInt64 {
  if (n < 0) {
    const posN = -n;
    out.sign = -1;
    out.data[0] = ~~(posN / 0x100000000);
    out.data[1] = posN >>> 0;
  } else {
    out.sign = 1;
    out.data[0] = ~~(n / 0x100000000);
    out.data[1] = n >>> 0;
  }
  return out;
}

/**
 * Substract two ArrayInt of 64 bits on 64 bits.
 * With arrayIntA - arrayIntB >= 0
 * @internal
 */
export function substractArrayInt64(out: ArrayInt64, arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  const lowA = arrayIntA.data[1];
  const highA = arrayIntA.data[0];
  const signA = arrayIntA.sign || 1;
  const lowB = arrayIntB.data[1];
  const highB = arrayIntB.data[0];
  const signB = arrayIntB.sign || 1;

  // Requirement: arrayIntA - arrayIntB >= 0
  out.sign = 1;

  if (signA === 1 && signB === -1) {
    // Operation is a simple sum of arrayIntA + abs(arrayIntB)
    const low = lowA + lowB;
    const high = highA + highB + (low > 0xffffffff ? 1 : 0);
    out.data[0] = high >>> 0;
    out.data[1] = low >>> 0;
    return out;
  }
  // signA === -1 with signB === 1 is impossible given: arrayIntA - arrayIntB >= 0

  // Operation is a substraction
  let lowFirst = lowA;
  let highFirst = highA;
  let lowSecond = lowB;
  let highSecond = highB;
  if (signA === -1) {
    lowFirst = lowB;
    highFirst = highB;
    lowSecond = lowA;
    highSecond = highA;
  }
  let reminderLow = 0;
  let low = lowFirst - lowSecond;
  if (low < 0) {
    reminderLow = 1;
    low = low >>> 0;
  }
  let high = highFirst - highSecond - reminderLow;
  if (high < 0) {
    high = high >>> 0;
  }
  out.data[0] = high;
  out.data[1] = low;
  return out;
}
