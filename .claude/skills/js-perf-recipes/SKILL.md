---
name: js-perf-recipes
description: Catalog of JavaScript / TypeScript micro-optimization recipes distilled from the pure-rand project's history of ⚡️ PRs. Use when squeezing perf out of a hot loop, a number-crunching routine, an RNG / hashing / parser / serializer, or any code where allocations or `BigInt` ops show up in a profile. Each recipe gives a before/after, the engine-level reason it works, and the PR that introduced it.
---

# JavaScript performance recipes (from pure-rand's ⚡️ PRs)

These recipes assume V8-class engines (Node, Chrome, Edge, Deno, Bun's JSC has similar behaviors). Most are micro-optimizations: only apply them where a profiler points, and always benchmark before/after on the target engine.

Each recipe links the PR that demonstrated it. PR IDs are `dubzzz/pure-rand#N`.

---

## 1. Stay on the int32 fast path

V8 keeps small integers as tagged `Smi` (31-bit signed on 32-bit platforms, 32-bit on 64-bit). Bitwise ops always produce int32; arithmetic ops can spill to doubles. When you know a value fits in int32, structure the code so the engine can see it.

### 1.1 Use `Math.imul` for 32-bit multiply — #958

`a * b` for ints that may overflow forces double-precision multiply + truncate. `Math.imul` is the explicit 32-bit signed multiply intrinsic and maps to a single CPU `imul`.

```js
// Before
return (seed * MULTIPLIER + INCREMENT) & MASK;
// After
return (Math.imul(seed, MULTIPLIER) + INCREMENT) & MASK;
```

### 1.2 Use `|` instead of `+` for disjoint bit fields — #951

When two operands share no bits, `|` is equivalent to `+` but stays on the int32 path. `+` can force the JIT to add overflow handling.

```js
// Before
const y = (mt[i] & UPPER) + (mt[i + 1] & LOWER);
// After  (1.46× faster: 12.7k → 18.6k hz on 5000 next() calls)
const y = (mt[i] & UPPER) | (mt[i + 1] & LOWER);
```

### 1.3 Use `~~x` for int32 truncation — #516

`~~x` is `(x | 0)` in disguise but works on values that may be doubles. Cheaper than `Math.floor` or `% then -` chains.

```js
// Before
const MaxAllowed = NumValues - (NumValues % rangeSize);
// After
const MaxAllowed = rangeSize > 2
  ? ~~(0x100000000 / rangeSize) * rangeSize
  : 0x100000000;
```

### 1.4 Prefer `+ 0x80000000` over `- (-0x80000000)` — #516

Inlining the positive constant avoids a double-subtraction shape and keeps the result a Smi.

```js
// Before
const MinRng = -0x80000000;
let v = rng.unsafeNext() - MinRng;
// After
let v = rng.unsafeNext() + 0x80000000;
```

### 1.5 Align API ranges with the engine's natural representation — #510, #512

Bitwise ops produce **signed** int32. If your generator returns `uint32`, every call pays a conversion (`>>> 0`, or the `((x + 0x80000000) | 0) + 0x80000000` dance). Re-spec the API to return `[-2^31, 2^31-1]` and the conversion disappears.

```js
// Before — coerces to uint32 on every call
static readonly min = 0;
static readonly max = 0xffffffff;
return y >>> 0;
// After — returns native int32 directly
static readonly min = -0x80000000;
static readonly max =  0x7fffffff;
return y;
```

---

## 2. Eliminate hot-path allocations

The single biggest source of perf loss in idiomatic JS is allocations inside loops — they thrash GC and break inline caches. Most of pure-rand's ⚡️ PRs are variations on this theme.

### 2.1 Split an immutable API from a mutable core (`unsafeNext`) — #231, #232

Public API stays immutable for the contract; private `unsafeNext()` mutates `this` and returns just the value. The immutable form becomes `clone-then-unsafe`. Hot internal loops use the unsafe form.

```js
// Before — every step allocates a new RNG + a 2-tuple
next(): [number, XorShift128Plus] {
  return [(this.s00 + this.s10) | 0,
          new XorShift128Plus(this.s11, this.s10, b1, b0)];
}
// After
private unsafeNext(): number {
  // mutates this.s00/s01/s10/s11 in place
  return out;
}
next(): [number, XorShift128Plus] {
  const next = new XorShift128Plus(this.s01, this.s00, this.s11, this.s10);
  return [next.unsafeNext(), next];
}
```

### 2.2 Mutate buffers in place; copy only at the boundary — #948

Old MT `twist()` did `prev.slice()` every 624 calls (a 624-int alloc + a per-element write). Inline the twist into `next()` and step one slot at a time. `clone()` remains the only allocator.

```js
// Before
if (++this.index >= N) {
  this.states = twist(this.states); // alloc 624 ints
  this.index = 0;
}
function twist(prev) {
  const mt = prev.slice();          // alloc
  for (let i = 0; i !== N - M; ++i) { /* ... */ }
  return mt;
}
// After
this.index = twistedNext(this.states, this.index); // mutates in place
function twistedNext(mt, idx) {
  if (idx < N - M)      { /* update mt[idx] */ return idx + 1; }
  else if (idx < N - 1) { /* update mt[idx] */ return idx + 1; }
  else                  { /* wrap */         return 0; }
}
```

### 2.3 Reuse the final mutable runner as the result — #239

When a loop ends with a runner whose fields you control and no one else holds a reference to, overwrite its fields with the answer rather than allocating a fresh instance.

```js
// Before
return new XoroShiro128Plus(ns01, ns00, ns11, ns10);
// After
rngRunner.s01 = ns01; rngRunner.s00 = ns00;
rngRunner.s11 = ns11; rngRunner.s10 = ns10;
return rngRunner;
```

### 2.4 Clone once at the boundary, not per iteration — #247, #248, #251

Push `rng.clone()` (or any expensive copy) up to the outermost API; let internal helpers mutate freely. Also: return scalars, not tuples, from hot helpers.

```js
// Before — clone + tuple in inner helper
const nrng = rng.clone();
const g = uniformIntDistributionInternal(size, nrng);
out[index] = g[0]; nrng = g[1];
// After — caller clones once; helper mutates and returns a scalar
out[index] = unsafeUniformIntDistributionInternal(size, rng);
```

### 2.5 Expose `unsafe` variants as public API — #249, #250, #252

For users who draw many samples in a row (e.g. property-based testing), forcing a defensive `clone()` per call is the dominant cost. Offer an opt-in API that skips the clone.

```js
// Safe API becomes a thin shim
function uniformIntDistribution(from, to, rng) {
  const next = rng.clone();
  return [unsafeUniformIntDistribution(from, to, next), next];
}
// Hot callers use the unsafe form directly and amortize cloning
```

### 2.6 Reuse a local instead of re-reading an array slot — #894

The JIT may not be able to prove an array slot is unchanged between reads. If you already have the value in a local, use the local.

```js
// Before
let y = this.states[this.index];
y ^= this.states[this.index] >>> U;   // redundant load
// After
let y = this.states[this.index];
y ^= y >>> U;
```

---

## 3. Add a cheap branch to skip expensive work

A comparison is much cheaper than `%`, a `while`-loop setup, a `BigInt` op, or a function call. Pay one extra branch up front to skip the heavy path in the common case.

### 3.1 Fast-path before rejection sampling / modulo — #858, #757

```js
// Before — always pays %, always pays loop setup
const MaxAllowed = ~~(0x100000000 / rangeSize) * rangeSize;
let v = rng.next() + 0x80000000;
while (v >= MaxAllowed) v = rng.next() + 0x80000000;
return v % rangeSize;
// After — two cheap branches skip both
let v = rng.next() + 0x80000000;
if (v < rangeSize) return v;                          // no %
if (v + rangeSize < 0x100000000) return v % rangeSize; // unbiased on first try
const MaxAllowed = 0x100000000 - (0x100000000 % rangeSize);
while (v >= MaxAllowed) v = rng.next() + 0x80000000;
return v % rangeSize;
```

### 3.2 Prefer explicit-condition loops over `while (true) { ... if (cond) return }` — #507, #757

A single exit and a top-of-loop condition are easier for the JIT to inline / unroll than an infinite loop with an internal `return`.

```js
// Before
while (true) {
  let v = compute(...);
  if (v < MaxAccepted) return finish(v);
}
// After
let v = compute(...);
while (v >= MaxAccepted) v = compute(...);
return finish(v);
```

---

## 4. Do work at build time, not at import time

Constant expressions evaluated at module load still cost ns each and bloat init. Matters most on cold starts (CLIs, serverless).

### 4.1 Inline literals, leave derivation in a comment — #959

```js
// Before
const scale     = 1 / (1 << 24);
const mask      = (1 << 24) - 1;
const MASK_LOWER = 2 ** 31 - 1;
// After
const scale     = 5.960464477539063e-8; // = 1 / (1 << 24)
const mask      = 16777215;             // = (1 << 24) - 1
const MASK_LOWER = 2147483647;          // = 2 ** 31 - 1
```

### 4.2 Cache `BigInt(...)` constants at module scope — #757

`BigInt` construction allocates. Build common constants once.

```js
// Before — re-builds each call
const NumValues = BigInt(0x100000000);
// After — module-scope
const NumValues = BigInt(0x100000000);
const One       = BigInt(1);
const ThirtyTwo = BigInt(32);
// (and reuse them everywhere)
```

### 4.3 Cache globals as module locals — #857

`const SBigInt = BigInt` saves a realm-global lookup per call and is shadow-resistant.

```js
const SBigInt = BigInt;
const SNumber = Number;
// ... use SBigInt(x), SNumber(x) in hot code
```

---

## 5. Keep BigInt away from the hot path

`BigInt` ops are 1–2 orders of magnitude slower than `number`. Push work into `number` space as long as it fits.

### 5.1 Do offsets in `number` space, promote at the end — #757

```js
// Before — one BigInt subtraction per draw
value = NumValues * value + (BigInt(out) - MinRng);
// After — offset in number, single BigInt() per draw, no extra sub
value = (value << ThirtyTwo) + BigInt(out + 0x80000000);
```

### 5.2 Use `<<` instead of `*` for BigInt powers of two — #757

```js
// Before
value = NumValues * value + ...;
// After
value = (value << ThirtyTwo) + ...;
```

### 5.3 Use `number` for loop counters even in BigInt code — #517

```js
// Before — bigint ++ / !== are heap-managed
for (let num = SBigInt(0); num !== NumIterations; ++num) { ... }
// After — Smi ops in registers
for (let num = 0;          num !== NumIterations; ++num) { ... }
```

### 5.4 Unroll the first iteration to skip `x * 0n` — #757

```js
// Before — first iteration is value=0, NumValues*0 wasted
let value = SBigInt(0);
for (let n = 0; n !== K; ++n) {
  value = NumValues * value + step();
}
// After
let value = step();                  // unrolled
for (let n = 1; n < K; ++n) {
  value = (value << ThirtyTwo) + step();
}
```

### 5.5 Delegate cold path to BigInt — #857

When a hand-rolled `number`-array implementation gets gnarly for a rarely-hit branch, modern BigInt is often fast enough and a lot less code.

```js
export function uniformInt(rng, from, to) {
  const rangeSize = to - from;
  if (rangeSize <= 0xffffffff) {
    return uniformIntInternal(rng, rangeSize + 1) + from; // hot path
  }
  return SNumber(uniformBigInt(rng, SBigInt(from), SBigInt(to))); // cold
}
```

---

## 6. Prefer fixed-shape objects to variable-length ones — #869

When the length is statically known, replace `{ data: number[] }` with `{ data: [number, number] }`. V8 keeps a stable hidden class, property access is monomorphic, and inner loops unroll.

```js
// Before — generic, length-driven loop
for (let i = 0; i !== rangeLength; ++i) {
  const size = i === 0 ? rangeSize[0] + 1 : 0x100000000;
  out[i] = uniformIntInternal(rng, size);
}
// After — fixed-shape, no loop
out[0] = uniformIntInternal(rng, rangeSize[0] + 1);
out[1] = uniformIntInternal(rng, 0x100000000);
```

---

## 7. Pack large constant tables compactly — #970

A `number[]` literal of N entries is N source-level numbers for the parser and stays as a typed object at runtime. A 6-bit-per-char ASCII string literal parses faster, is ~50% the source size, and supports O(1) bit lookups with `charCodeAt`.

```js
// Before — 624 numbers in source
const JUMP_COEFS = [1927166307, 3044056772, /* ... */];
if (JUMP_COEFS[i >>> 5] & (1 << (i & 0x1f))) { ... }
// After — packed 6 bits per char, offset 48 to stay in printable ASCII
const JUMP_COEFS = 'SUSgbA\\W`E[]KN2...';
if ((JUMP_COEFS.charCodeAt((i / 6) | 0) - 48) & (1 << (i % 6))) { ... }
```

---

## Quick checklist when profiling a hot path

1. **Allocations in the loop?** → mutate in place, hoist `clone()`, return scalars not tuples, reuse the final runner.
2. **`+`/`*` on int-shaped numbers?** → try `|`, `^`, `Math.imul`, `~~`.
3. **`BigInt` in the inner loop?** → stay in `number`, cache constants, shift instead of multiply, unroll iter 0.
4. **`%` or `while(true)` rejection?** → add fast-path branches; rewrite as explicit-condition loop.
5. **Constants computed at import?** → inline literals, comment the derivation.
6. **Variable-length container with a known fixed length?** → use a fixed-shape object.
7. **Big constant table?** → consider 6-bit packed string.
8. **Globals like `BigInt`, `Number` looked up in hot code?** → alias at module scope.
9. **Defensive `clone()` on every call?** → expose an `unsafe` variant for hot callers.

---

## Index of source PRs

| PR | Title | Recipe(s) |
|----|-------|-----------|
| #231 | Faster `jump` for xorshift by avoiding intermediate instances | 2.1 |
| #232 | Faster jump for `xoroshiro` by avoiding intermediate instances | 2.1 |
| #239 | Avoid creating an unneeded instance in `xoroshiro::jump` | 2.3 |
| #247 | Prefer unsafe for internal on uniform int distributions | 2.4 |
| #248 | Prefer unsafe for internal on uniform array-int distributions | 2.4 |
| #249 | Add unsafe version of `uniformIntDistribution` | 2.5 |
| #250 | Add unsafe version of `uniformBigIntDistribution` | 2.5 |
| #251 | Re-implement safe skipN/generateN with unsafe ones | 2.4 |
| #252 | Add unsafe version of `uniformArrayIntDistribution` | 2.5 |
| #507 | Drop infinite loop for explicit loop | 3.2 |
| #510 | Faster Mersenne-Twister | 1.5 |
| #512 | Faster Congruencial 32bits | 1.5 |
| #516 | Faster uniform distribution on small ranges | 1.3, 1.4 |
| #517 | Faster uniform distribution on bigint | 5.3 |
| #757 | Faster uniform distributions on bigint | 3.1, 3.2, 4.2, 5.1, 5.2, 5.4 |
| #857 | Faster large `uniformInt` via bigint | 4.3, 5.5 |
| #858 | Faster small `uniformInt` | 3.1 |
| #869 | Faster `uniformInt` on large ranges | 6 |
| #894 | Drop useless array access in `mersenne` | 2.6 |
| #948 | Less memory allocations for `mersenne` | 2.2 |
| #951 | Faster twist in `mersenne` | 1.2 |
| #958 | Faster congruential32 with imul | 1.1 |
| #959 | No compute at import time (pre-computed) | 4.1 |
| #970 | Compress Mersenne jump coefficients | 7 |
