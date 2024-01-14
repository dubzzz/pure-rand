import { RandomGenerator } from './RandomGenerator';

class MersenneTwister implements RandomGenerator {
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
    for (let idx = 0; idx !== MersenneTwister.N - MersenneTwister.M; ++idx) {
      const y = (mt[idx] & MersenneTwister.MASK_UPPER) + (mt[idx + 1] & MersenneTwister.MASK_LOWER);
      mt[idx] = mt[idx + MersenneTwister.M] ^ (y >>> 1) ^ (-(y & 1) & MersenneTwister.A);
    }
    for (let idx = MersenneTwister.N - MersenneTwister.M; idx !== MersenneTwister.N - 1; ++idx) {
      const y = (mt[idx] & MersenneTwister.MASK_UPPER) + (mt[idx + 1] & MersenneTwister.MASK_LOWER);
      mt[idx] = mt[idx + MersenneTwister.M - MersenneTwister.N] ^ (y >>> 1) ^ (-(y & 1) & MersenneTwister.A);
    }
    const y = (mt[MersenneTwister.N - 1] & MersenneTwister.MASK_UPPER) + (mt[0] & MersenneTwister.MASK_LOWER);
    mt[MersenneTwister.N - 1] = mt[MersenneTwister.M - 1] ^ (y >>> 1) ^ (-(y & 1) & MersenneTwister.A);
    return mt;
  }

  private static seeded(seed: number): number[] {
    const out = Array(MersenneTwister.N);
    out[0] = seed;
    for (let idx = 1; idx !== MersenneTwister.N; ++idx) {
      const xored = out[idx - 1] ^ (out[idx - 1] >>> 30);
      out[idx] = (Math.imul(MersenneTwister.F, xored) + idx) | 0;
    }
    return out;
  }

  private constructor(
    private states: number[],
    private index: number,
  ) {
    // states: between -0x80000000 and 0x7fffffff
  }

  static from(seed: number): MersenneTwister {
    return new MersenneTwister(MersenneTwister.twist(MersenneTwister.seeded(seed)), 0);
  }

  clone(): MersenneTwister {
    return new MersenneTwister(this.states, this.index);
  }

  next(): [number, MersenneTwister] {
    const nextRng = new MersenneTwister(this.states, this.index);
    const out = nextRng.unsafeNext();
    return [out, nextRng];
  }

  unsafeNext(): number {
    let y = this.states[this.index];
    y ^= this.states[this.index] >>> MersenneTwister.U;
    y ^= (y << MersenneTwister.S) & MersenneTwister.B;
    y ^= (y << MersenneTwister.T) & MersenneTwister.C;
    y ^= y >>> MersenneTwister.L;
    if (++this.index >= MersenneTwister.N) {
      this.states = MersenneTwister.twist(this.states);
      this.index = 0;
    }
    return y;
  }
}

export default function (seed: number): RandomGenerator {
  return MersenneTwister.from(seed);
}
