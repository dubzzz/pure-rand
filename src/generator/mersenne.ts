import type { JumpableRandomGenerator } from '../types/JumpableRandomGenerator';

const N = 624;
const M = 397;
const A = 0x9908b0df;
const F = 1812433253;
const U = 11;
const S = 7;
const B = 0x9d2c5680;
const T = 15;
const C = 0xefc60000;
const L = 18;
const MASK_LOWER = 2147483647; // = 2 ** R - 1 (with R = 31)
const MASK_UPPER = 2147483648; // = 2 ** R

// Derived from https://github.com/numpy/numpy/blob/57fbc869cb10a65da0793ed3aebe00e7f595c0b1/numpy/random/src/mt19937/mt19937-jump.h#L26
// Compressed as 6 bits per printable ASCII character, encoding the bitfield directly.
// Each char stores 6 consecutive bits of the jump polynomial coefficients.
// Uses an escape-free 64-char alphabet: chars 48–91 (values 0–43) and 93–112 (values 44–63).
const JUMP_COEFS =
  'SUShcA]WaE[^KN2RUSp8XVU?HKBFRm11E]KpWOh5B^XEWG;BE;1:pVK[aB_Z9Qe23_XToiL>^Uoeb4g[X;`k9H5QD=dN<5Ha3cW>9cl1nkpI2gK0pcnAAINOV:>Mfl`V9ee<iZ]hC3?Fn7FEl07QH`3PLn_@?_j]QMlhP<^pLHnFomfdh5F@7U_@4kiZ?WZS0l@GHfinM36:5_9;>Hnnadp>l:KOSlScIINc1VFg>LXhP>GUAQTD>Cj>XMGlUgmLmc?`FbFUl@?5N7j70@;1p68bi@I<HFH7R2_J:G^[Gg962ITWID9GWK8EmD2G5=DdHdL^dA^P2o7A=[<cIoM;IHDQoJMRfRXDWcVmeoGEIPjkaE08Xedj3@0d:IBcD4:Nl^?mEN9k_;Ta0cmZX7fjWE8da<bl7k05FZj>AkUDi?M1B?_??FAXKTig<bBOXZg7kXYGK>R<;NHl3S9YiM7STJ6a:MIEaS@7298X8W>PNK=@;mLX<j]TXLL<W@X[X54H^jo8M;;o?llQcbkhAMY=Tg9c;ZKg0QUB2FHYWgoglDpU9YldLe95T>mK6GM1YL]mje:J>KYS=jJ^Y>QmF>?R5`[5QfYC=66;A32Ad>OHl`of_0h>cK:h;KFPhcGUdPR`Z=TX3H9e03cKZ2IiEPKBp>LSGWe0jFeV8C<Y:<>T[O6mC]cmbZ>GpAYP4dmg_k1IgoZJ^QfDf2X<HE[LJNWobCh[P^Cp_:IRcWPY?97UfPBmZNNHY6LOBM8P>=i?Yf:`g`Sc9Kj5GDYBF4eWfMgeh_ddPmmNWM7G1]UMepYfOOD5_f@gpA22G?ADYp5:FVG[cWp96;>3ld`d1Ac30>30;1@4F8h2iY?DJ4[LOL;ZLLKp2^kp>[KMDUdR279N`lF=3WL@De620cMTeA]U9laafg2jD9JhJ8CZBHS>F_Ul;<mbfbfHS<15OSfSaPdSSKBRBFY^bQ=EhUXGNh=?e56aKA@2BfkY0_[`DCXaL=CGMT=BW_6S1j@2ATBVl>3`pdRA>2U:4GPQ6p>5kX2HIdV3S@Oo6KB<[SKB?FC`AAkj9bhcBFlAj];4I]UJ^d36Uc@[;hQACVGY<V^SDJBUU^Lb]`b@JeOO8hn2T0DJMb:8Hg7>E^opQ[1Kbnco??QQ^S?1j0pMGOjkc]bGY6mQ_CJ?9cFmf8<fH4UUkBINX;o8@VOA5bi_URV49B[A?ONHiHAC1J5;;i0SXYmG_0W=fJeHi_K4SGf=1HZLLbn;D<Q3AOecPdeXaa82]kp0Eo8kRVGC73WMCF9ae:0ifS?80?C188dSo7H9<ebZ^MhS4Pc_1HlA:1PU_5>_i`h[RQV@PoYBRI`^aB^Bi@Ul03fXGYaI16L76H28XaR>IROMfNVUeU[:mhiLiPCQZ:4b<30YBZCYoXf[?;kd8hKI2QH2MkoWBn4oGCZWabVU2b;P<AMI25nmW`Nn^[2?c6p851X@mAn^YZacWRF1h<Gb:T^1NXH5Vfkb5P9S9>:bNh:Ti1Y=5p78K>LQ8iW@5S?I83Ll5Xl;k5@I3p[e:4RkE_pS30:WP9hC]j8bSI>QRE@4mP:7mDh8h2aQm[2I8bBU]BQ?B4`dmL9Q^S;_f1Oc5[>3JER2ad7B=p^gPOWO<DGj;Njcb1PpWPPE`Q3bX0OB0nZfk]g`M[J4Y6^1ai2MlF[GjW8Q_e3_`=<I1N2Q7^2<2k[jP7V3V821FbI^Aa93cC_Z]G=WJ;_Ii?B97`jIF@]Dm<fK1kf8SNTWp`=XFMZH<<JYLZ_YQMPhYOV45K`:^lSI8_XmO0^GY=VUgf`C`F6TOdpAmVUH:p=WiiT@Ka2KFif<3]KXQ>W:M?S`4S5e@J_a[AGA7@3^DoGSCOa]?E8HT75_e9]:n]n1fhIgl8de6cD9]fU8]o[Pc0Che_S0o9lGJHc^j5XpemKHd34Fij9K>0U5WKa>7Fg2_KL=WC6:ld?f5C_b1T1:4:_S5gmXmGNIk08AgO?Di7T7eWO>E^NI9?pc7B7P`i[4TEP[EU;GmmFToSnh9:][N^<SApKP`lPmG56A:I3T6EG8Hk=XoUEaKT5U@OQ?^7[N_MFN1`NU4KO`3::Lfa8IL9[1Z1H1;V3SC]N3^S@4U[F2niT5eYM7[4Ph`Nb0`8WTH0achdfQS8^EG;XhD4Ic4jLTP@lE79Mo>AYRJA1U5_Bmihop:bHVYd03d3J0Vd9FkEV_M75Zge8lVC9>jJDlaAJ[6g7DK2D_DL]AX:6c5i31XH;RQB]N<ZSM=J;6L[aUW_fOIFd1Y^6`egfeIf4ARi72nTXC0WND`IDHVCZRDE0fODARCEETQI5TPUQE=kEH5cS?LP[bjaF5ABRYDp2p]@=^GT?`9;id4Ln:]SF9l1T<0E@gX9BG[^h0oY7l[Qnj@mb8aPF0k6@Q?Ij7cLlXQ<mLHg^a:DCi@9JY5>iEVLTeiL]c1EB0mLi<=WbO@F<;8h<e:@f:LA:dFIEenQi7iNHgSRTpW?8N4:Z1K;XEDRO;OIDi<UeVmo?ckhL>?VE98[B]K<BVklG8LjSX;gc>kg?DUK00Aji<WY6QD6dEoHBZ8jN`ge<G8Cja11RUW2QmW^IXV:n?;J0GXXHgGNQ>:Da=gLPcO?VOTEYLk_dNk5PM>kKB5HVkJ4U7mXbTQNL9<@]1an]Uh@VQHe7>kW=db0anjF7;N0F=GkpQaRFdiKMGTno8dF@Oi4GGCn7n2aU9k93Tc>=lSERkE`J939F01I1;a<jkl`=`Vo=7RVAI6goQI5KmF:C44cN<<8K=Z<2TP<1^5?<eB>_LA=fcmpE2Y2:9mli0]<YKcHD97jEa<C5pk_1>X:??aH6BXF2iG1Q[eF0Q=>W=J?7C]l1T?<;R44pW?1iY_G8Zn^ZKogOg0fCFYp6?=D8?<a6HU5SXi1;=:23LnV`FSj;OJgV<_?GlIDPISfHh1LbGE:V3Y3K3H<QJgcY?=;meZRioiQT`nGXDLFXXiSONE6Dp`0jNZbhB:BPGOTH;ViHUTe6LiQn_[;eO^5Hmlh<R:F<Ko]:I:EGpkhWZ2X@SYO`emH;G8S<>pEKbcYa:pU;=JW7jh?S?EYc86c7o8df]^IRb^lpjWY<RgO;5lUI;7mVfC?[@ZbXDjF04B8R^ch@>O<nQDpUdBLdg_g>n2lMBUmpD>Zf@NN_Z11TMajoXYiE`I=lAa:ZF4e]>aL@;ZP[aENU5dL[BV6]Z?Dj76:kh3iE6pG6kFd8lP=[GS1;WSfeYQW1:U4]OF32GhnMC<AkO^872ceBcacKAA?8k78c>T3VgdUB2n4J_CPRU;8eSdI^LU^_cBYA5`3:Y0N5j_?200000';

class MersenneTwister implements JumpableRandomGenerator {
  constructor(
    private states: number[], // states: between -0x80000000 and 0x7fffffff
    private index: number,
  ) {}
  clone(): MersenneTwister {
    return new MersenneTwister(this.states.slice(), this.index);
  }
  next(): number {
    let y = this.states[this.index];
    y ^= y >>> U;
    y ^= (y << S) & B;
    y ^= (y << T) & C;
    y ^= y >>> L;
    this.index = twistedNext(this.states, this.index);
    return y;
  }
  getState(): readonly number[] {
    return [this.index, ...this.states];
  }
  jump(): void {
    // equivalent to 2^128 calls to next()
    // Implementation is derived from the one in numpy
    // https://github.com/numpy/numpy/blob/c53b2eb729bae1f248a2654dfcfa4a3dd3e2902b/numpy/random/src/mt19937/mt19937-jump.c
    const originalStates = this.states.slice();
    const originalIndex = this.index;
    this.index = twistedNext(this.states, this.index); // states and index of this
    // https://github.com/numpy/numpy/blob/57fbc869cb10a65da0793ed3aebe00e7f595c0b1/numpy/random/src/mt19937/mt19937-jump.c#L71-L72
    // We burn: 19935 and 19934 as they result into get_coef(pf, i) == 0
    // So we start the loop with "19933 - 1"
    for (let i = 19932; i > 0; --i) {
      const c = JUMP_COEFS.charCodeAt((i / 6) | 0);
      if (((c < 93 ? c - 48 : c - 49) & (1 << (i % 6))) !== 0) {
        addState(this.states, this.index, originalStates, originalIndex);
      }
      this.index = twistedNext(this.states, this.index); // states and index of "copy"
    }
    // https://github.com/numpy/numpy/blob/57fbc869cb10a65da0793ed3aebe00e7f595c0b1/numpy/random/src/mt19937/mt19937-jump.c#L85-L88
    // We fall in the case: get_coef(pf, 0) != 0
    addState(this.states, this.index, originalStates, originalIndex);
  }
}

function addState(mt: number[], idx: number, originalMt: number[], originalIdx: number): void {
  let i = 0;
  if (originalIdx >= idx) {
    for (; i < N - originalIdx; i++) mt[i + idx] ^= originalMt[i + originalIdx];
    for (; i < N - idx; i++) mt[i + idx] ^= originalMt[i + originalIdx - N];
    for (; i < N; i++) mt[i + idx - N] ^= originalMt[i + originalIdx - N];
  } else {
    for (; i < N - idx; i++) mt[i + idx] ^= originalMt[i + originalIdx];
    for (; i < N - originalIdx; i++) mt[i + idx - N] ^= originalMt[i + originalIdx];
    for (; i < N; i++) mt[i + idx - N] ^= originalMt[i + originalIdx - N];
  }
}

function twistedNext(mt: number[], idx: number) {
  if (idx < N - M) {
    const y = (mt[idx] & MASK_UPPER) | (mt[idx + 1] & MASK_LOWER);
    mt[idx] = mt[idx + M] ^ (y >>> 1) ^ (-(y & 1) & A);
    return idx + 1;
  } else if (idx < N - 1) {
    const y = (mt[idx] & MASK_UPPER) | (mt[idx + 1] & MASK_LOWER);
    mt[idx] = mt[idx + M - N] ^ (y >>> 1) ^ (-(y & 1) & A);
    return idx + 1;
  } else {
    const y = (mt[idx] & MASK_UPPER) | (mt[0] & MASK_LOWER);
    mt[idx] = mt[M - 1] ^ (y >>> 1) ^ (-(y & 1) & A);
    return 0;
  }
}

function twist(mt: number[]) {
  for (let idx = 0; idx !== N; ++idx) {
    twistedNext(mt, idx);
  }
}

export function mersenneFromState(state: readonly number[]): JumpableRandomGenerator {
  const valid = state.length === N + 1 && state[0] >= 0 && state[0] < N;
  if (!valid) {
    throw new Error('The state must have been produced by a mersenne RandomGenerator');
  }
  return new MersenneTwister(state.slice(1), state[0]);
}

export function mersenne(seed: number): JumpableRandomGenerator {
  const out: number[] = [seed | 0];
  for (let idx = 1; idx !== N; ++idx) {
    const xored = out[idx - 1] ^ (out[idx - 1] >>> 30);
    out.push((Math.imul(F, xored) + idx) | 0);
  }
  twist(out);
  return new MersenneTwister(out, 0);
}
