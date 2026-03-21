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
// Compressed as base-92 encoding: 5 printable ASCII characters per uint32 coefficient (little-endian).
// Alphabet: ASCII 33–126 excluding 39 (') and 92 (\), giving 92 symbols (92^5 > 2^32).
// To regenerate from the numpy uint32 array `coefs` (624 entries):
//   alphabet = Array.from({length:94},(_,i)=>i+33).filter(c=>c!==39&&c!==92);
//   coefs.map(v => Array.from({length:5},()=>{ const r=v%92; v=Math.floor(v/92); return String.fromCharCode(alphabet[r]); }).join("")).join("")
const JUMP_COEFS =
  'rjtu<ZS5OLisQtA&_`DI;Fx*+Sml{![GC@XrDf[BmlW#3[`UiNS88UWPh)^#b10_0ut<`X~}](Kcqa?#aqx".)v0?OY7_.B>cL_^^SOG!MI7$5u~<)W%_L=F+>b.MizgFZFMZ~5YM|cT5P0&Z@^f&L7/<c)-02/TUmxURvE7b2;FXDCn.hGC6pob6tK%b8B@*K,}IjIZcdqqKCCNCQO3CF@d}t[A,v!!Ed:=?R.,b{="[$-=F8n>6wT,4[g23F)VlWfNd{PdD"k&w(e{2GQpTGvF.;+(Gx^l2Xa}9e*6qN(R{{#+=k&:r?.@1#QxnOu&8oi<T"e7@5AHXDL5?%[EA&wO)_"+w!*3#|*&M"9>fPU,Er(,a1a-O7Jg1_@:[CMO%~5.c%}C,"D]n~]S&N~e01:<M(79MD,&XtB)X5QEFfkBgA37?TH:!<SHai_IElWVl(mqY}P7ML?T>z8uGV,2P+nx=z@(8sS870WkU<P/bN5U0EV|(&LH`k6bM;%lG30U#:I/saI[MhX^R:~3IH-yt&TtviqZ/`2AR,hJnJC)`bZau}9PnomqFqN5F,h`D}K)|A:YrT[w/u*>gQ,p)5?dM#SN(z<q!Xsa`)-nvnVx2FlNIS{<3UVHCF%^?O#E%"A:!V2zZW|*o?FBnzQA+.K9T9J[;Jc)/@@9Kr<8~S`Z2U?v/`.)6Bq9(_48;@H+7hGx8xv>?5M+(h@5S/3Nq,`9Q,G6wDTH5=G7kZ%MjEaPRAW7_7tZ&9[r>Vo2;3PoTbs{BTj/LL8JNY[Ja5DGP,TX8^<Q7T$VKxU3w|$e<M2e{4mkUC)1m7tL|=Qs^0.fj534M.Dwj8Q.v*Kg%S+k]U&xB>Epp/VL3?Q"HO:G[I0Qe2EUPDaO$9k:9vg@8V!D]0/EO!-BH`!]<JBj3B8#G90wJoN7.8;XJ="I`N*3Ue7rUppTkNItBS:$~$K!Z,.{E|I2<zMyO3I)0ZFgwQ8;2>5*%cM)+[@E:3=$,/5B5r+?Q&"l2[2%s&~Fd:0*{IRJ^.*ODW55zT(@RxDh6EKYj56;^7<`j#%2Xs76(~G?{Fvx^;}fU<jur]%D1.1"3PDLT-;"D(=QykA,bw.B_ZCNOkd^4E#DkJXi3{J]WgmwMGw;+BkdK<Xt>s%4OAfZ#aw}FQAZug.3je2M~wM,6)N0q<F<ye%zp?n2$LE8HB%T<J0>T[Cg)8/49>0SDWw=]!oYGe)*ils"HxkJ@?Xe(J7X9("%-I[L5$q-E(Lp8]vD$K:LalM3T:GEKBIUe5iLd8H5f$>@SF8v*N^B[/?|_OLv~eIMeaa&=*!zxI(O73!F*ybH})a]RTs~JNKdD7#pR3B5rZ]YHLIz6Ear<w3FoX!Sn}OX[&q0gKW&^$@L0d%MS(3=I2@C}<d^SY"(aKv9|vFYE{Ua%P,M]7>sRsw?:4"@A6A&4Ps4Y/O7(=2-e4shOAwvf)aO2eCbQT[8myVBCBAF-APv0(0c,tK=MTcZARxcz2k~Ip%Th_LR%TJ[Y.|n>Z;%>#$q"j5ZclwGVTTnZ?FH.iBn+W+!m)Y/6ze@T+Z4s$K8_5oNd+aXI`E.n,_TV28ph8u,h0jiOBA@z@j%|N@4Cpw8u/&|!eAU/%2GgZWH=+fFPWy1]=a>NF)N7E5osf>@4?Lj2H(l`G8*qu#A9oyXm;e~U|!"0Paqjf0H6hlZEW9a:Q)~B^4",nCQ6Z*N[BaGVRtWR19^+9&,I;lMW+^y+x#x(Pot^~W46J:2ndunDI@[o"5!XY8w_k@=e2ZAUr8`{T~*sVAFXos7(3%[@m}lBLj^clKUx#uLt8kG.=AF51R#9J;LUt,XXkMj9U,_X.Y:?n]*$#WWD$xE+N}V;AGX2rW|Kt$2Xs*0]t>DS];sur9p3mlA%!^SNi|ChJ?(S.0I,9nTbR<xJasq(Sj(lO$H?<"24X?R2[&v-Vccm;OM2zpRvfQ`KP;dI>C.S$P4)L&Hg/BT9!OEo:.~kM/cWs9$d?B^Wm%b?4,p4~()E/3Kv-/g<4BgSQ1XN?*#J$^@8Xq4Qkte[)s=U8S7vhKBu4"<A^J7fY$[:{E`?VwZ>nKgF_3!_MW<[l.`J1sD%Q7VYV?dSA`J}-1xIyV2>OXB"]U^_L{*+h>*Ur-Ce$}S#Q4~n?/;tX:z^yy7bQY~1H&~<0K2<gX?Apj8P(Ol5`@.z%?S;$D[DQZ8di1/8d*wV0_6nR/Z$qU*#$O&^!GiT&G-u[@$pT:,2K8p>>~-7"[_[m7z=#Q?]_vaTA#d6*BBWUM+PQ4E5`@AHWO_cE"/nH.WC`kHt^*}*9o@_P}_a:!{z0&R??[:PBtjuRmRoW7*"666hWFE)6Q6DHZV}t@6MzT"M:"gD!y3N2&;eCF%]<f]KMY|67%0OKj$:b]upVY0iW"r/mRfcWHN;@Cj?{!AwZ0Y0(cylY[~Kf7_GwF1RVou$0-vpG,x3ZB}&aBB&I[Y/P"*c.$-pE9Hqho<<kwa>":][NC<7uXeq;)0}w/hP7*jW"kub"/g%9=?ZV[|QOjcTM?HvP8|;(qAFGV:]<Gn&Z^<`;?!u.R5$xIT7TQliCL(yF9&!<8J|"n?!?9u;-A1`QUgu*i(<]YMAt"*SK/rR#%cjgq#T>^7*%Kl1LKO5EDM#.Q5rt}3#S<T%^X#uLD<E*f*A#UzQ!nLO(s}/;0ccfGI`D-o$8]Nw@l~O+U-498)N^9"BF%U^4_Q]CAw5Jw;@g9313C35<c?x10J=5g9d_0@K.X2;<Sh_:9HDL`;,T$ZY|:X;9pccE&AwxC$pK8]&9?KcFiHOXSmo[@>:BvDA<TZ&HB#T!E?9XiCb7Ea3adnA)+w`<CWo;@<Z!!5Y]eW>@;,R$Byb|Z0zb)M=;z@xI#6|bXn`FaLR"K=/Q{ns<}wZJM2f[PWrDY{5qWx0?!XK!L+1{aY0{xFQR,Fq%$D_a"rFM,LyGT@5;F17%TcQ:$/dGmA*;3G%nl~_YsAV=3"bR@CH5@8X,Fjb={u0h+a!4!LjBk67g2.=-v^w-My7D7&f:pyHpvXvD9e?DVE_7g^3zK}B%@D28EV3@9tp[&(!q}a?TE`z=94tMHYT||"@=yFKJ^(s@FI%q/J3,.=dH{hG?+41EQSk&=u$f-Y@d`y%IHa-@b44H*!!!!!';

function decodeCoefWord(i: number): number {
  let val = 0;
  let base = 1;
  for (let j = 0; j < 5; j++) {
    const c = JUMP_COEFS.charCodeAt(i * 5 + j);
    val += (c < 39 ? c - 33 : c < 92 ? c - 34 : c - 35) * base;
    base *= 92;
  }
  return val;
}

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
    // So we start the loop with "19933 - 1" ie word 622 bit 28
    // Outer loop iterates words, inner loop iterates bits to decode each word only once
    for (let w = 622; w >= 0; --w) {
      const coef = decodeCoefWord(w);
      const topBit = w === 622 ? 28 : 31;
      const bottomBit = w === 0 ? 1 : 0;
      for (let b = topBit; b >= bottomBit; --b) {
        if ((coef >>> b) & 1) {
          addState(this.states, this.index, originalStates, originalIndex);
        }
        this.index = twistedNext(this.states, this.index); // states and index of "copy"
      }
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
