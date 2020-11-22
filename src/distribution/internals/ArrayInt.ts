/**
 * An ArrayInt represents an integer larger than what can be represented in classical JavaScript.
 * The values stored in data must be in the range [0, 0xffffffff].
 *
 * @example
 * ```js
 * { sign:  1, data: [ 42 ] } // = 42
 * { sign: -1, data: [ 42 ] } // = -42
 * { sign: -1, data: [ 5, 42 ] } // = -1 * (5 * 2**32 + 42)
 * { sign: -1, data: [ 1, 5, 42 ] } // = -1 * (1 * 2**64 + 5 * 2**32 + 42)
 * ```
 */
export type ArrayInt = {
  /**
   * Sign of the represented number
   */
  sign: -1 | 1;
  /**
   * Value of the number, must only contain numbers in the range [0, 0xffffffff]
   */
  data: number[];
};

/**
 * Add two ArrayInt
 * @internal
 */
export function addArrayIntToNew(arrayIntA: ArrayInt, arrayIntB: ArrayInt): ArrayInt {
  if (arrayIntA.sign !== arrayIntB.sign) {
    return substractArrayIntToNew(arrayIntA, { sign: -arrayIntB.sign as -1 | 1, data: arrayIntB.data });
  }
  const data: number[] = [];
  let reminder = 0;
  const dataA = arrayIntA.data;
  const dataB = arrayIntB.data;
  for (let indexA = dataA.length - 1, indexB = dataB.length - 1; indexA >= 0 || indexB >= 0; --indexA, --indexB) {
    const vA = indexA >= 0 ? dataA[indexA] : 0;
    const vB = indexB >= 0 ? dataB[indexB] : 0;
    const current = vA + vB + reminder;
    data.push(current >>> 0);
    reminder = ~~(current / 0x100000000);
  }
  if (reminder !== 0) {
    data.push(reminder);
  }
  return { sign: arrayIntA.sign, data: data.reverse() };
}

/**
 * Add one to a given positive ArrayInt
 * @internal
 */
export function addOneToPositiveArrayInt(arrayInt: ArrayInt): ArrayInt {
  arrayInt.sign = 1; // handling case { sign: -1, data: [0,...,0] }
  const data = arrayInt.data;
  for (let index = data.length - 1; index >= 0; --index) {
    if (data[index] === 0xffffffff) {
      data[index] = 0;
    } else {
      data[index] += 1;
      return arrayInt;
    }
  }
  data.unshift(1);
  return arrayInt;
}

/** @internal */
function isStrictlySmaller(dataA: number[], dataB: number[]): boolean {
  const maxLength = Math.max(dataA.length, dataB.length);
  for (let index = 0; index < maxLength; ++index) {
    const indexA = index + dataA.length - maxLength;
    const indexB = index + dataB.length - maxLength;
    const vA = indexA >= 0 ? dataA[indexA] : 0;
    const vB = indexB >= 0 ? dataB[indexB] : 0;
    if (vA < vB) return true;
    if (vA > vB) return false;
  }
  return false;
}

/**
 * Substract two ArrayInt
 * @internal
 */
export function substractArrayIntToNew(arrayIntA: ArrayInt, arrayIntB: ArrayInt): ArrayInt {
  if (arrayIntA.sign !== arrayIntB.sign) {
    return addArrayIntToNew(arrayIntA, { sign: -arrayIntB.sign as -1 | 1, data: arrayIntB.data });
  }
  const dataA = arrayIntA.data;
  const dataB = arrayIntB.data;
  if (isStrictlySmaller(dataA, dataB)) {
    const out = substractArrayIntToNew(arrayIntB, arrayIntA);
    out.sign = -out.sign as -1 | 1;
    return out;
  }
  const data: number[] = [];
  let reminder = 0;
  for (let indexA = dataA.length - 1, indexB = dataB.length - 1; indexA >= 0 || indexB >= 0; --indexA, --indexB) {
    const vA = indexA >= 0 ? dataA[indexA] : 0;
    const vB = indexB >= 0 ? dataB[indexB] : 0;
    const current = vA - vB - reminder;
    data.push(current >>> 0);
    reminder = current < 0 ? 1 : 0;
  }
  return { sign: arrayIntA.sign, data: data.reverse() };
}

/**
 * Trim uneeded zeros in ArrayInt
 * and uniform notation for zero: {sign: 1, data: [0]}
 */
export function trimArrayIntInplace(arrayInt: ArrayInt) {
  const data = arrayInt.data;
  let firstNonZero = 0;
  for (; firstNonZero !== data.length && data[firstNonZero] === 0; ++firstNonZero) {}
  if (firstNonZero === data.length) {
    // only zeros
    arrayInt.sign = 1;
    arrayInt.data = [0];
    return arrayInt;
  }
  data.splice(0, firstNonZero);
  return arrayInt;
}

// Helpers specific to 64 bits versions

/** @internal */
export type ArrayInt64 = Required<ArrayInt> & { data: [number, number] };

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
  const signA = arrayIntA.sign;
  const lowB = arrayIntB.data[1];
  const highB = arrayIntB.data[0];
  const signB = arrayIntB.sign;

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
  out.data[0] = highFirst - highSecond - reminderLow;
  out.data[1] = low;
  return out;
}
