import { RandomGenerator } from './RandomGenerator';

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

  next(): [number, MersenneTwister] {
    let y = this.states[this.index];
    y ^= this.states[this.index] >>> MersenneTwister.U;
    y ^= (y << MersenneTwister.S) & MersenneTwister.B;
    y ^= (y << MersenneTwister.T) & MersenneTwister.C;
    y ^= y >>> MersenneTwister.L;
    return [y >>> 0, new MersenneTwister(this.states, this.index + 1)];
  }

  jump(): MersenneTwister {
    // equivalent to 2^128 calls to next()
    // Implementation is derived from the one in numpy
    // https://github.com/numpy/numpy/blob/c53b2eb729bae1f248a2654dfcfa4a3dd3e2902b/numpy/random/src/mt19937/mt19937-jump.c

    // Derived from https://github.com/numpy/numpy/blob/22239d120f59826e8a2c758f4bee9893e835f511/numpy/random/src/mt19937/mt19937-poly.h
    // prettier-ignore
    const jump = [
      0xd44eef88, 0xee0a4a03, 0xa694b151, 0xd69d4dae, 0xa085e39c, 0x3b9028d3, 0x2921790b, 0x4e0cb79d, 0x2fc089b8, 0x7b451782, 0x9969261a, 0xfd689c20, 0xf764644b, 0xd60875dd, 0x294906fc, 0x65cb0f30,
      0x8c1a738d, 0x6e0d9af5, 0x4c2ed662, 0x80f531ff, 0xf0c28bf7, 0x6abe153, 0x99daa4cb, 0x8753d4d1, 0xc168a83a, 0x4166b819, 0xc41a8ab4, 0xf57b359b, 0x1cef8b28, 0xab0404dc, 0xb584f3ce, 0x49ff94e2,
      0x5e86f725, 0xd9b6eb6e, 0x57f4e691, 0x39f197c2, 0x88da9f61, 0x3b401090, 0x84ac6295, 0xecd7979a, 0xbd3369c1, 0x22dfda51, 0xffcfcca6, 0x6cc8c76e, 0x3e26759b, 0xa988c27c, 0xdf98f954, 0x58b73c4f,
      0xa1a9fd3a, 0xfd5b469c, 0x74262639, 0xde9678da, 0x80a1632f, 0x7ebf7caa, 0xaa4ca55d, 0xa3466cf9, 0x1fbf6622, 0x85fd6d03, 0x3c37bbae, 0x52496c1c, 0x2368c8e3, 0xa240f5f1, 0xbcac7da4, 0x57fe813,
      0x3e3f3d53, 0x9473428a, 0x24fb7f42, 0xaa23be3c, 0xf9668796, 0x90acda72, 0x2e1b6031, 0xf5528ce1, 0x637701d1, 0x3140cd8d, 0x98ef9d6f, 0xfa7cb36c, 0x7b3eb58c, 0x58a2181d, 0x188a3c1a, 0x606c0d4d,
      0x79614278, 0x79352fec, 0xfb7f3605, 0x2b7daaec, 0x3caef42, 0x411ff3e4, 0x13e19a22, 0x9c646ef0, 0x639cd8b7, 0xea5b4043, 0x480fd410, 0x18cc242b, 0x382a9e78, 0x547ebbb0, 0xc4f50666, 0xec98c549,
      0xe3806992, 0x2a0a487e, 0xa67ff521, 0x8e9d1595, 0x47861693, 0x1209905b, 0x9b58a988, 0x426f1860, 0x1ed29910, 0x6fc3351b, 0x8b314cc3, 0x7acbf670, 0x93afbfb6, 0x4d06819, 0x49848d01, 0x48af57ab,
      0x9b966f8d, 0xc8bc9812, 0xfc5e8074, 0x391d7595, 0x899b417c, 0xd7744def, 0x1a2d663e, 0x59d2ffc2, 0x5c68f00d, 0x1801df3b, 0x38bf3667, 0x4cc2317c, 0x1de6d3d8, 0x486046c0, 0xb1930bc7, 0xb114f078,
      0x2540ccae, 0xdce2fb, 0xbbb9bcbd, 0xfc4d529c, 0xc0a7f78c, 0xa141d8d9, 0x37d3d0b8, 0xc07428a3, 0xca97f9a2, 0x9fcdb30a, 0x8d3ca10, 0x26538704, 0x7ad96674, 0xc92a24ef, 0x5319d4f8, 0x99ccac42,
      0xc00114e3, 0xbb7e154e, 0x8ba369b8, 0xfd0874f8, 0xb18932be, 0x4826a91b, 0x6739e335, 0x7bfe26bf, 0xe6525b2, 0x3f69f4c5, 0xb682d452, 0x3c428ac1, 0x24ffcf82, 0x3bc3378a, 0x177c23f0, 0x4a66d4d5,
      0xa055a874, 0x68276616, 0x31fc1346, 0x79c39967, 0xa7054900, 0xc49639c6, 0x4383d4c9, 0xe148b4b, 0x7686a159, 0x9879c33, 0xf099db8b, 0x143e4d3, 0x182d00bb, 0xce11f188, 0xbc6fac37, 0xadbd80fc,
      0x362c8975, 0x4980541, 0x6e2d49bc, 0xe641d7a8, 0x3e7b2683, 0x68565bd1, 0xca57e87e, 0x6d511248, 0x703ac738, 0xd4278f8, 0x30d562f5, 0xcd4120d, 0x23955513, 0x4057f151, 0xce4aa255, 0x15ecc50c,
      0x22e4072f, 0x88fc2179, 0x97356444, 0xac7a5b75, 0x3359c12d, 0xd3cbb5fd, 0xda3076a1, 0x62b8dd62, 0x230a46bc, 0xf84028da, 0x2a8c2740, 0x3a51c6c4, 0x7c15b205, 0x1c4b6ac3, 0x393ac56e, 0x626ece52,
      0x77142ad9, 0x34bd4cbb, 0xb00ce72, 0x2e60619e, 0xfea46333, 0xa91e3f6f, 0xb4505343, 0x3ee452a2, 0x5bd5c497, 0x44e71208, 0xf6511326, 0x96d5d682, 0xde75c388, 0x923001a7, 0xd181e89c, 0xa900f7eb,
      0xd05cb771, 0xad2178e4, 0x6e21114e, 0x6391af61, 0x341a338, 0x749ac0ac, 0x1d58624c, 0xdf7b828a, 0x7af5246, 0xbcedcd3d, 0xd0f96f1a, 0xb1345217, 0xafd3507, 0x5d0832f6, 0xa4d812c5, 0x9fd50c44,
      0xfb03eee0, 0xf5a66317, 0xf72286ea, 0xed12fe37, 0x553a7479, 0x904d40eb, 0x5c03e8fa, 0x279fa7c2, 0x3955af4d, 0x4f05f3f, 0xdfde143f, 0x4cb80244, 0x678a7f4f, 0x428ee343, 0xc7013028, 0x7e57464e,
      0xce4c29be, 0xa0eec759, 0xc1b9c34d, 0xe014d1ce, 0x343cf26c, 0xfb0d9e04, 0x3d02fe59, 0xf4b0c9db, 0xb880fc9b, 0x9819765b, 0x886bfa82, 0x65486d74, 0xb89996c2, 0xc15f7337, 0x86a979b7, 0x4f143a5c,
      0x9be5420c, 0xfd6397c1, 0xc0585a53, 0x87ac5d45, 0x341612ce, 0x7798fa46, 0xb0b9ca9, 0xf59981bb, 0xb0686cd0, 0x7238e485, 0x348ca7f6, 0xf67fc47b, 0xe5eb4c13, 0x8cd2dd7e, 0xf016f52d, 0xcc23a29f,
      0xdea96ef8, 0x2fcc9146, 0xcb0dc0f7, 0x8b4a72ae, 0xd5ca8c61, 0xf3ffb60a, 0xf5898bc4, 0x7995ed02, 0xccd04694, 0x8949c7b3, 0xb68ecc3f, 0xaa6f5672, 0x72609e4e, 0xd4735b10, 0xe0c88840, 0xface0f0c,
      0xc5a81882, 0x4d03c843, 0x783bed86, 0x3f2242e9, 0x5dbb5af5, 0x16c018e8, 0x76ab112b, 0xd6b9adfb, 0x1f2405ea, 0xec384628, 0xffc820d5, 0xd3a71c00, 0x615d4fa3, 0xb60fdcfc, 0x7c2567f6, 0xb548a01e,
      0x2746ae60, 0x3a3b5c1f, 0x79d2436e, 0xf8911ee6, 0x69526a50, 0x7ea84c24, 0x89da01c2, 0x2a70795d, 0x8d411078, 0x478cce42, 0x9de46ce2, 0x800a720c, 0xaf53bfe3, 0xfa96a108, 0xbd014d87, 0x6f40bbe8,
      0x3e4c2607, 0x20fc8546, 0x9b38742, 0x12d947fc, 0xf76a123c, 0x63238a46, 0x6bc74032, 0xf0a350cd, 0x46a136c0, 0x2d41d99d, 0x2aa1a7ca, 0x847c57db, 0x1f894402, 0x6ea8789b, 0x9fcfaf5f, 0x574c8517,
      0x847a0264, 0xf21c6cd2, 0xe43fd64a, 0x72eff295, 0x4c842321, 0x8be6277b, 0xf8b5ebe6, 0x4a92b94a, 0x84466600, 0x383942aa, 0xa87f639c, 0xccd25d3a, 0x323f5d5b, 0x82868b9, 0x770c0c8, 0xd4a1cd03,
      0xee06158b, 0x56a43854, 0x8cdeda1a, 0x840bf2a4, 0xbdea8c2c, 0xed0e3a3f, 0xc4a400d2, 0x29bb00db, 0x6ddde240, 0x486171ab, 0x99e2ff03, 0x7994020, 0xf5e3e08, 0x52065a80, 0xc61cdd93, 0x2e8b3d65,
      0xff8153e2, 0x1862206a, 0xa60e658a, 0x90e117c5, 0x7477e851, 0xd900ca9c, 0xbb118f55, 0x5ac58c3b, 0xf4e81cd9, 0xe0622ca7, 0x2d469a0, 0xc38d165, 0x5ac5e7cf, 0x4a2c9122, 0x454463bb, 0x8f88133f,
      0xba533c2e, 0x563114d2, 0x6d1f5886, 0xee4b7922, 0xf52b07c2, 0xd3ae99b1, 0x381fddd7, 0xc36e3e41, 0xe9bfe790, 0xeb06d1d, 0x3955afff, 0x6a08337c, 0x48052d74, 0x7c2777a0, 0xb184b17f, 0x4da7466f,
      0xe252c953, 0x3d4a6336, 0xa770c593, 0x314a616b, 0xb4ad6e78, 0x39ba1131, 0xa6935bc5, 0x4bcf247d, 0xe3597b14, 0x19ae3b25, 0x5f3ec6c9, 0x366ce188, 0x50b8a80d, 0x40c2c7ee, 0xe214a847, 0x7bfe68c4,
      0x2933bb98, 0x4e12111, 0x25cbac63, 0x99757136, 0x56428675, 0xca03bafa, 0x4120956b, 0x5d0c07b4, 0xf4f77678, 0x3655dd22, 0x9352db1c, 0xe38ec922, 0x35e21839, 0x899051f6, 0xc75c758d, 0xb4efa187,
      0x90d8b8d3, 0x76b0992a, 0x684e548b, 0x26e1875b, 0x125c46d3, 0x6c200277, 0x87270451, 0x3deeed59, 0x39a28712, 0xe6bb5c55, 0x7e85abfe, 0xda2a71db, 0xb11a9df1, 0xa03cbe14, 0x110d09d, 0x39801a4,
      0xe70449e0, 0x8e61be7e, 0x9f3fc8c6, 0x28d33d6a, 0x91152ff4, 0xfc4821d7, 0x50ed6137, 0xf2d7f7c5, 0x1b4dc5f, 0xbdcddc75, 0xb9e609e7, 0x5dcd97db, 0xa4d105f3, 0xd3d1d152, 0xdfb8a726, 0xf92d6a7a,
      0xc202e583, 0x2b077c95, 0x1eabcf0d, 0x9c535829, 0x9f20cbe4, 0x7eea9322, 0x5dea0db9, 0xb3dcbf1e, 0x98355a9c, 0x35955a02, 0xdbeaad6c, 0xb6eaf04c, 0x52824667, 0x1aae75fc, 0x1f91a99f, 0x8e13afcc,
      0x26464aa1, 0x813b45b2, 0x8763d725, 0x503b25fb, 0xecaa130f, 0xd2160609, 0xad848b80, 0x539828fa, 0xcd03da7d, 0x9eca77a6, 0xd6e81db8, 0x9f0dbfaf, 0x1608459b, 0xe5630c69, 0xbad10d72, 0xd39e2347,
      0x5b2b909e, 0xd2e364eb, 0x396a2ce6, 0x4129c69f, 0x87ecc757, 0x7172504b, 0xd324bbe6, 0x6fb7b95f, 0x83434bcb, 0x360434a4, 0x7227a2bb, 0x15d2d84b, 0xc29c6bf7, 0x9a3fe6fb, 0x6cef8976, 0xea2d040d,
      0xc719c842, 0x64e69229, 0x5a1e70a, 0x2e02f6d6, 0x84820a27, 0x541e2170, 0xcc06a5d3, 0x3ddc624a, 0x6f86324a, 0x8899a3c3, 0xb8b2f5b3, 0x7c2aadf0, 0x23b66469, 0xe3510bb1, 0x40978ef9, 0xf4943f97,
      0xd2b3b912, 0xefc2e050, 0x42661991, 0x2f15cfcd, 0x860267aa, 0xd22eee84, 0xbdbe1f53, 0x26510a3d, 0x4066a4c9, 0x2979cf80, 0xae1d4008, 0xfd553033, 0xca6c9e5b, 0x235a2295, 0xc542fad7, 0x33f76930,
      0x4566a627, 0x568283fc, 0x36675b9c, 0x75458566, 0xc2547948, 0x315275ce, 0x3084c4f3, 0x56ebd372, 0x8a0eaca7, 0x18334370, 0x2463853, 0x5a41fb, 0x50f713f0, 0x6d53b85e, 0x7a7e7ad4, 0x6f4b679c,
      0x53b82ddd, 0x142494e6, 0xf60b9d53, 0x2d36e1c2, 0x34cf2703, 0x7d8ef8a7, 0x7fb9ba9b, 0xe0d7de1e, 0x2943b268, 0x63df760c, 0x6e17435, 0xabe72ae2, 0x2e8442e3, 0xdd0d05c5, 0xb4f9f5e7, 0x96fe70d7,
      0xddbf609, 0x85e3b39b, 0xb80275ee, 0xb81c4237, 0x357f0d55, 0xa6f7961e, 0x2165983a, 0x5d5efeb3, 0xcf7cca8e, 0xfa77c514, 0xcc837b01, 0x7bc17aff, 0x827cb922, 0xbc650307, 0xd4425599, 0x2e9eaf20,
      0x97190dea, 0xe7396d2f, 0x83a292f8, 0xab2425a1, 0x3b6a1a4e, 0x569029fb, 0xd5cf5a25, 0xddd095a2, 0x51bb7fcf, 0x3489f041, 0x34f836c9, 0x4e3f882b, 0xdbb3c823, 0x46f21d5a, 0x8d38f69c, 0x1,
    ];

    let rngRunner = this.nextForJump();
    for (let i = 19935; i > 0; --i) {
      if (jump[i >>> 5] & (1 << (i & 0x1f))) {
        rngRunner = rngRunner.addState(this);
      }
      rngRunner = rngRunner.nextForJump();
    }
    return rngRunner;
  }

  private addState(other: MersenneTwister): MersenneTwister {
    const idx = this.index;
    const otherIdx = other.index;
    const states = this.states.slice(0);

    const endLoop1 = otherIdx >= idx ? MersenneTwister.N - otherIdx : MersenneTwister.N - idx;
    for (let i = 0; i !== endLoop1; ++i) {
      states[i + idx] ^= other.states[i + otherIdx];
    }

    const endLoop2 = otherIdx >= idx ? MersenneTwister.N - idx : MersenneTwister.N - otherIdx;
    const offsetStates = otherIdx >= idx ? 0 : MersenneTwister.N;
    const offsetOtherStates = otherIdx >= idx ? MersenneTwister.N : 0;
    for (let i = endLoop1; i !== endLoop2; ++i) {
      states[i + idx - offsetStates] ^= other.states[i + otherIdx - offsetOtherStates];
    }

    for (let i = endLoop2; i !== MersenneTwister.N; ++i) {
      states[i + idx - MersenneTwister.N] ^= other.states[i + otherIdx - MersenneTwister.N];
    }

    return new MersenneTwister(states, idx);
  }

  private nextForJump(): MersenneTwister {
    const states = this.states.slice(0);
    const idx = this.index;

    if (idx < MersenneTwister.N - MersenneTwister.M) {
      const y = (states[idx] & MersenneTwister.MASK_UPPER) | (states[idx + 1] & MersenneTwister.MASK_LOWER);
      states[idx] = states[idx + MersenneTwister.M] ^ (y >>> 1) ^ (-(y & 1) & MersenneTwister.A);
    } else if (idx < MersenneTwister.N - 1) {
      const y = (states[idx] & MersenneTwister.MASK_UPPER) | (states[idx + 1] & MersenneTwister.MASK_LOWER);
      states[idx] = states[idx + MersenneTwister.M - MersenneTwister.N] ^ (y >>> 1) ^ (-(y & 1) & MersenneTwister.A);
    } else {
      const y = (states[idx] & MersenneTwister.MASK_UPPER) | (states[0] & MersenneTwister.MASK_LOWER);
      states[idx] = states[MersenneTwister.M - 1] ^ (y >>> 1) ^ (-(y & 1) & MersenneTwister.A);
    }

    return new MersenneTwister(states, idx < MersenneTwister.N - 1 ? idx + 1 : 0);
  }
}

export default function(seed: number): RandomGenerator {
  return MersenneTwister.from(seed);
}
