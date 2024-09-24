import type { ArrayInt } from './ArrayInt';

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
