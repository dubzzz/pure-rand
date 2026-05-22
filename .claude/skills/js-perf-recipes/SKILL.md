---
name: js-perf-recipes
description: Catalog of JavaScript / TypeScript micro-optimization recipes. Use when squeezing perf out of a hot loop, a number-crunching routine, an RNG / hashing / parser / serializer, or any code where allocations or `BigInt` ops show up in a profile. Each recipe gives a before/after and the engine-level reason it works.
---

# JavaScript performance recipes

These recipes assume V8-class engines (Node, Chrome, Edge, Deno; JSC has similar behaviors). Most are micro-optimizations: only apply them where a profiler points, and always benchmark before/after on the target engine.

---

## 1. Stay on the int32 fast path

V8 keeps small integers as tagged `Smi` (31-bit signed on 32-bit platforms, 32-bit on 64-bit). Bitwise ops always produce int32; arithmetic ops can spill to doubles. When you know a value fits in int32, structure the code so the engine can see it.

### 1.1 Use `Math.imul` for 32-bit multiply

`a * b` for ints that may overflow forces double-precision multiply + truncate. `Math.imul` is the explicit 32-bit signed multiply intrinsic and maps to a single CPU `imul`.

```js
// Before
return (a * MULTIPLIER + INCREMENT) & MASK;
// After
return (Math.imul(a, MULTIPLIER) + INCREMENT) & MASK;
```

### 1.2 Use `|` instead of `+` for disjoint bit fields

When two operands share no bits, `|` is equivalent to `+` but stays on the int32 path. `+` can force the JIT to add overflow handling.

```js
// Before
const y = (a & UPPER_MASK) + (b & LOWER_MASK);
// After
const y = (a & UPPER_MASK) | (b & LOWER_MASK);
```

### 1.3 Use `~~x` for int32 truncation

`~~x` is `(x | 0)` in disguise but works on values that may be doubles. Cheaper than `Math.floor` or `% then -` chains.

```js
// Before
const k = total - (total % step);
// After
const k = ~~(total / step) * step;
```

### 1.4 Prefer `+ POSITIVE` over `- NEGATIVE`

Inlining the positive constant avoids a double-subtraction shape and keeps the result a Smi.

```js
// Before
const MIN = -0x80000000;
let v = raw - MIN;
// After
let v = raw + 0x80000000;
```

### 1.5 Align API ranges with the engine's natural representation

Bitwise ops produce **signed** int32. If your function returns `uint32`, every call pays a conversion (`>>> 0`, or `((x + 0x80000000) | 0) + 0x80000000`). Re-spec the API to return `[-2^31, 2^31-1]` and the conversion disappears.

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

The single biggest source of perf loss in idiomatic JS is allocations inside loops — they thrash GC and break inline caches.

### 2.1 Split an immutable API from a mutable core (`unsafeFoo`)

Public API stays immutable for the contract; a private `unsafeFoo()` mutates `this` and returns just the value. The immutable form becomes `clone-then-unsafe`. Hot internal loops use the unsafe form.

```js
// Before — every step allocates a new instance + a 2-tuple
next(): [number, Self] {
  return [(this.s0 + this.s1) | 0,
          new Self(this.s2, this.s3, b1, b0)];
}
// After
private unsafeNext(): number {
  // mutates this.sX in place
  return out;
}
next(): [number, Self] {
  const copy = new Self(this.s0, this.s1, this.s2, this.s3);
  return [copy.unsafeNext(), copy];
}
```

### 2.2 Mutate buffers in place; copy only at the boundary

Replace bulk-rebuild steps (`prev.slice()` + populate) with in-place updates that advance one slot at a time. Reserve copies for `clone()`-style boundaries where they're semantically required.

```js
// Before
if (++this.index >= N) {
  this.state = rebuild(this.state); // alloc N entries
  this.index = 0;
}
function rebuild(prev) {
  const out = prev.slice();         // alloc
  for (let i = 0; i !== N; ++i) { /* ... */ }
  return out;
}
// After
this.index = stepInPlace(this.state, this.index); // no alloc
function stepInPlace(buf, idx) {
  if (idx < THRESHOLD) { /* update buf[idx] */ return idx + 1; }
  /* wrap */                                       return 0;
}
```

### 2.3 Reuse the final mutable runner as the result

When a loop ends with a runner whose fields you control and no one else holds a reference to, overwrite its fields with the answer rather than allocating a fresh instance.

```js
// Before
return new Foo(a, b, c, d);
// After
runner.x = a; runner.y = b;
runner.z = c; runner.w = d;
return runner;
```

### 2.4 Clone once at the boundary, not per iteration

Push expensive copies (`.clone()`, `structuredClone`, `{...obj}`) up to the outermost API; let internal helpers mutate freely. Also: return scalars, not tuples, from hot helpers.

```js
// Before — clone + tuple in inner helper
const copy = input.clone();
const g = inner(size, copy);
out[i] = g[0]; copy = g[1];
// After — caller clones once; helper mutates and returns a scalar
out[i] = unsafeInner(size, input);
```

### 2.5 Expose `unsafe` variants as public API

For callers in a hot loop, forcing a defensive copy per call is the dominant cost. Offer an opt-in API that skips the copy.

```js
// Safe API becomes a thin shim
function compute(input) {
  const copy = input.clone();
  return [unsafeCompute(copy), copy];
}
// Hot callers use unsafeCompute directly
```

### 2.6 Reuse a local instead of re-reading an array slot

The JIT may not be able to prove an array slot is unchanged between reads. If you already have the value in a local, use the local.

```js
// Before
let y = arr[i];
y ^= arr[i] >>> U;   // redundant load
// After
let y = arr[i];
y ^= y >>> U;
```

---

## 3. Add a cheap branch to skip expensive work

A comparison is much cheaper than `%`, a `while`-loop setup, a `BigInt` op, or a function call. Pay one extra branch up front to skip the heavy path in the common case.

### 3.1 Fast-path before rejection sampling / modulo

```js
// Before — always pays %, always pays loop setup
const Limit = ~~(0x100000000 / range) * range;
let v = sample();
while (v >= Limit) v = sample();
return v % range;
// After — two cheap branches skip both
let v = sample();
if (v < range) return v;                     // no %
if (v + range < 0x100000000) return v % range; // unbiased on first try
const Limit = 0x100000000 - (0x100000000 % range);
while (v >= Limit) v = sample();
return v % range;
```

### 3.2 Prefer explicit-condition loops over `while (true) { ... if (cond) return }`

A single exit and a top-of-loop condition are easier for the JIT to inline / unroll than an infinite loop with an internal `return`.

```js
// Before
while (true) {
  let v = compute(...);
  if (v < Accepted) return finish(v);
}
// After
let v = compute(...);
while (v >= Accepted) v = compute(...);
return finish(v);
```

---

## 4. Do work at build time, not at import time

Constant expressions evaluated at module load still cost ns each and bloat init. Matters most on cold starts (CLIs, serverless).

### 4.1 Inline literals, leave derivation in a comment

```js
// Before
const scale     = 1 / (1 << 24);
const mask      = (1 << 24) - 1;
const HALF      = 2 ** 31;
// After
const scale     = 5.960464477539063e-8; // = 1 / (1 << 24)
const mask      = 16777215;             // = (1 << 24) - 1
const HALF      = 2147483648;           // = 2 ** 31
```

### 4.2 Cache `BigInt(...)` constants at module scope

`BigInt` construction allocates. Build common constants once.

```js
// Before — re-builds each call
function step() {
  const N = BigInt(0x100000000);
  // ...
}
// After — module-scope
const N         = BigInt(0x100000000);
const ONE       = BigInt(1);
const SHIFT32   = BigInt(32);
// reuse them everywhere
```

### 4.3 Cache globals as module locals

`const SBigInt = BigInt` saves a realm-global lookup per call and is shadow-resistant.

```js
const SBigInt = BigInt;
const SNumber = Number;
// use SBigInt(x), SNumber(x) in hot code
```

---

## 5. Keep BigInt away from the hot path

`BigInt` ops are 1–2 orders of magnitude slower than `number`. Push work into `number` space as long as it fits.

### 5.1 Do offsets in `number` space, promote at the end

```js
// Before — one BigInt subtraction per draw
v = N * v + (BigInt(raw) - MIN_BIG);
// After — offset in number, single BigInt() per draw, no extra sub
v = (v << SHIFT32) + BigInt(raw + 0x80000000);
```

### 5.2 Use `<<` instead of `*` for BigInt powers of two

```js
// Before
v = N * v + step();
// After
v = (v << SHIFT32) + step();
```

### 5.3 Use `number` for loop counters even in BigInt code

```js
// Before — bigint ++ / !== are heap-managed
for (let i = SBigInt(0); i !== K; ++i) { ... }
// After — Smi ops in registers
for (let i = 0;          i !== K; ++i) { ... }
```

### 5.4 Unroll the first iteration to skip `x * 0n`

```js
// Before — first iteration is value=0, N*0 wasted
let v = SBigInt(0);
for (let i = 0; i !== K; ++i) {
  v = N * v + step();
}
// After
let v = step();                  // unrolled
for (let i = 1; i < K; ++i) {
  v = (v << SHIFT32) + step();
}
```

### 5.5 Delegate cold path to BigInt

When a hand-rolled `number`-array implementation gets gnarly for a rarely-hit branch, modern BigInt is often fast enough and a lot less code.

```js
export function f(from, to) {
  const range = to - from;
  if (range <= 0xffffffff) {
    return fastNumberPath(range) + from;            // hot
  }
  return SNumber(slowBigIntPath(SBigInt(from), SBigInt(to))); // cold
}
```

---

## 6. Prefer fixed-shape objects to variable-length ones

When the length is statically known, replace `{ data: number[] }` with `{ data: [number, number] }`. V8 keeps a stable hidden class, property access is monomorphic, and inner loops unroll.

```js
// Before — generic, length-driven loop
for (let i = 0; i !== length; ++i) {
  const size = i === 0 ? head + 1 : 0x100000000;
  out[i] = inner(rng, size);
}
// After — fixed-shape, no loop
out[0] = inner(rng, head + 1);
out[1] = inner(rng, 0x100000000);
```

---

## 7. Pack large constant tables compactly

A `number[]` literal of N entries is N source-level numbers for the parser and stays as a typed object at runtime. A 6-bit-per-char ASCII string literal parses faster, is ~50% the source size, and supports O(1) bit lookups with `charCodeAt`.

```js
// Before — many numbers in source
const TABLE = [1927166307, 3044056772, /* ... */];
if (TABLE[i >>> 5] & (1 << (i & 0x1f))) { ... }
// After — packed 6 bits per char, offset 48 to stay in printable ASCII
const TABLE = 'SUSgbA\\W`E[]KN2...';
if ((TABLE.charCodeAt((i / 6) | 0) - 48) & (1 << (i % 6))) { ... }
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
