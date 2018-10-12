import { RandomGenerator } from './RandomGenerator';

function toUint32(num: number): number {
  return (num | 0) >= 0 ? num | 0 : (num | 0) + 4294967296;
}
function product32bits(a: number, b: number) {
  const alo = a & 0xffff;
  const ahi = (a >>> 16) & 0xffff;
  const blo = b & 0xffff;
  const bhi = (b >>> 16) & 0xffff;
  return alo * blo + ((alo * bhi + ahi * blo) << 16);
}

class MersenneTwister implements RandomGenerator {
  static readonly min: number = 0;
  static readonly max: number = 0xffffffff;

  static readonly N = 624;
  static readonly M = 397;
  static readonly R = 31;
  static readonly A = 0x9908b0df;
  static readonly F = 1812433253;
  static readonly U = 11;
  static readonly S = 7;
  static readonly B = 0x9d2c5680;
  static readonly T = 15;
  static readonly C = 0xefc60000;
  static readonly L = 18;
  static readonly MASK_LOWER = 2 ** MersenneTwister.R - 1;
  static readonly MASK_UPPER = 2 ** MersenneTwister.R;

  private static twist(prev: number[]): number[] {
    const mt = prev.slice();
    for (let idx = 0; idx !== MersenneTwister.N; ++idx) {
      const x =
        (mt[idx] & MersenneTwister.MASK_UPPER) + (mt[(idx + 1) % MersenneTwister.N] & MersenneTwister.MASK_LOWER);
      let xA = x >>> 1;
      if (x & 1) {
        xA ^= MersenneTwister.A;
      }
      mt[idx] = mt[(idx + MersenneTwister.M) % MersenneTwister.N] ^ xA;
    }
    return mt;
  }

  private static seeded(seed: number): number[] {
    const out = Array(MersenneTwister.N);
    out[0] = seed;
    for (let idx = 1; idx !== MersenneTwister.N; ++idx) {
      const xored = out[idx - 1] ^ (out[idx - 1] >>> 30);
      out[idx] = (product32bits(MersenneTwister.F, xored) + idx) | 0;
    }
    return out;
  }

  readonly index: number;
  readonly states: number[]; // between -0x80000000 and 0x7fffffff

  private constructor(states: number[], index: number) {
    if (index >= MersenneTwister.N) {
      this.states = MersenneTwister.twist(states);
      this.index = 0;
    } else {
      this.states = states;
      this.index = index;
    }
  }

  static from(seed: number): MersenneTwister {
    return new MersenneTwister(MersenneTwister.seeded(seed), MersenneTwister.N);
  }

  min(): number {
    return MersenneTwister.min;
  }

  max(): number {
    return MersenneTwister.max;
  }

  next(): [number, RandomGenerator] {
    let y = this.states[this.index];
    y ^= this.states[this.index] >>> MersenneTwister.U;
    y ^= (y << MersenneTwister.S) & MersenneTwister.B;
    y ^= (y << MersenneTwister.T) & MersenneTwister.C;
    y ^= y >>> MersenneTwister.L;
    return [toUint32(y), new MersenneTwister(this.states, this.index + 1)];
  }
}

export default function(seed: number): RandomGenerator {
  return MersenneTwister.from(seed);
}
