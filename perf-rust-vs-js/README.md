# pure-rand's generators across languages

Compares the **JS implementations shipped by pure-rand** (`lib/generator/*.js`, built
from `src/generator/*.ts`) with native ports of all four generators in **Rust**,
**Java**, **C#** and **pure Python**, and runs the JS bench on three runtimes
(**Node/V8**, **Deno/V8**, **Bun/JavaScriptCore**):

- `xorshift128plus` — XorShift128+ (a=23, b=18, c=5)
- `xoroshiro128plus` — XoroShiro128+ (a=24, b=16, c=37)
- `congruential32` — three LCG steps per output, 15 bits kept from each
- `mersenne` — MT19937

The ports take inspiration from the wasm-bindgen rewrites on the `to-rust` branch
(`src/xoro_shiro_128_plus.rs`), but drop all wasm/JS interop: each is a plain native
program, so the numbers below measure pure computation on each side (no FFI, no wasm
boundary). Where the JS 128-bit generators split each 64-bit state word into two int32
halves, the Rust/Java/C# ports use a single 64-bit word — same algorithms, same
seeding, same 32-bit signed outputs. The Python port is plain interpreter code (no
libraries), masking every step back to 32/64 bits.

The Rust/Java/C# ports are **fully optimized** (see "Optimizations" below); the JS
implementation is the untouched pure-rand library, serving as the reference. Layout:
`rust/` (cargo binary), `java/Bench.java`, `csharp/` (net10.0 project, struct
generators behind a static-abstract generic constraint so the JIT monomorphizes the
hot loop, like Rust's), `python/bench.py`, `js/bench.cjs`.

## Workload

For each of N seeds (spread over the int32 range via `Math.imul(i, 2654435761)` /
`i.wrapping_mul(2654435761)` equivalents): build a generator from the seed and produce
the **first 1000 numbers** of its sequence (generator construction included — for
mersenne that means the 624-word init + twist is part of each sequence's cost, in every
language). Every produced number is folded into a uint32 checksum which all sides must
agree on — so the benchmark doubles as an exhaustive equivalence check. `verify` mode
additionally prints the first 10 values for seeds 0, 42, -1, 123456789, -987654321;
all language/runtime combinations print identical output for all four generators.

## Running it

```bash
pnpm build                                     # once, at the repo root (builds lib/)

cd perf-rust-vs-js
( cd rust && cargo build --release )           # targets the host CPU (.cargo/config.toml)
( cd csharp && dotnet publish -c Release -o out )
( cd java && javac --add-modules jdk.incubator.vector Bench.java )

# <generator> = xorshift128plus | xoroshiro128plus | congruential32 | mersenne
./rust/target/release/xorshift128plus-bench <generator> 100000 1000 7   # <seeds> <per seed> <reps>
node js/bench.cjs <generator> 100000 1000 7
bun js/bench.cjs <generator> 100000 1000 7
deno run --allow-read js/bench.cjs <generator> 100000 1000 7
java --add-modules jdk.incubator.vector -XX:+UseParallelGC -cp java Bench <generator> 100000 1000 7
./csharp/out/bench <generator> 100000 1000 7
python3 python/bench.py <generator> 2000 1000 7
# or: ... <generator> verify   to dump sequences instead of timing
```

## Methodology

Linux, Intel Xeon @ 2.80GHz (4 vCPU). rustc 1.94.1 (`opt-level=3`, LTO,
`target-cpu=native`), Node.js v22.22.2, Bun 1.3.11 (JavaScriptCore), Deno 2.9.5 (V8),
OpenJDK 21.0.10, .NET 10 (SDK 10.0.111), CPython 3.11.15.

Each (language, generator) cell was measured with **3 independent process
invocations** (5–8 for the noisy cells, see below), each doing warmup runs followed by
7–9 timed repetitions of the full workload; tables report the best repetition across
all invocations. 100 000 seeds × 1000 numbers per repetition (100M numbers) for the
compiled/JIT languages; 2 000 seeds for CPython (checksums cross-checked against the
other languages at that size too). Best-of-invocation agreed within ~1–3% across
processes for every cell except the flagged ones; medians sat within ~1–2% of best.
Checksums matched across all languages and runtimes in every configuration, before
and after optimization.

## Results — ns per number (lower is better)

Optimized native/JIT ports vs the pure-rand JS reference on Node:

| Generator        | Rust (opt) | Java (opt) | C# (opt) | JS (Node) | Python |
| ---------------- | ---------- | ---------- | -------- | --------- | ------ |
| xorshift128plus  | 1.14       | 1.13       | 1.18     | 3.35      | 316    |
| xoroshiro128plus | 1.09       | 1.24       | 1.12     | 3.50      | 415    |
| congruential32   | 1.03       | 1.38       | 1.98     | 2.47      | 606    |
| mersenne         | 2.07       | 2.41       | 3.21     | 11.84     | 994    |

The straight ports before the optimization pass (Rust built for the portable x86-64
baseline, mersenne twisting one word per `next` like the JS version):

| Generator        | Rust | Java | C#   |
| ---------------- | ---- | ---- | ---- |
| xorshift128plus  | 1.21 | 1.24 | 1.34 |
| xoroshiro128plus | 1.47 | 1.39 | 1.26 |
| congruential32   | 1.93 | 1.44 | 2.19 |
| mersenne         | 4.79 | 4.88 | 6.44 |

JS runtimes, same `bench.cjs` (pure-rand as-is), reported separately:

| Generator        | Node 22 (V8) | Deno 2.9 (V8) | Bun 1.3 (JSC) |
| ---------------- | ------------ | ------------- | ------------- |
| xorshift128plus  | 3.35         | 3.35          | 2.62          |
| xoroshiro128plus | 3.50         | 3.24          | 3.12          |
| congruential32   | 2.47         | 2.31          | 2.62          |
| mersenne         | 11.84        | 10.4–13.2 ⚠   | 16.3          |

⚠ Deno's mersenne is bimodal across processes: over 8 invocations, each process
settled at either ~10.4–10.6 or ~13.1–13.4 ns/number (V8 optimization-decision
nondeterminism; Node landed consistently at ~11.8–12.3). Bun's mersenne was re-run
over 8 invocations too and is stable at 16.3–17.0.

## Optimizations

Every optimization preserves the emitted sequences bit-for-bit (verified by the
sequence dumps and the run checksums).

- **Rust — build for the host CPU** (`.cargo/config.toml`, `-C target-cpu=native`):
  the single biggest Rust lever. The portable x86-64 baseline forces the legacy
  destructive `rol` whose extra register copies sit on the latency-bound rotate
  chains; native builds use BMI2 `rorx` (xoroshiro 1.47 → 1.11). On congruential32
  LLVM additionally unrolls and algebraically composes two LCG steps per chain link
  (1.93 → 1.03, beating the single-step `imul` latency bound).
- **mersenne — lazy block refill** (all three languages): instead of twisting one
  word per `next` like the JS implementation, twist the whole 624-word block in
  three tight loops when the read index wraps, and temper every word into an output
  buffer; `next` becomes a plain buffer read. Both loops are data-parallel: Rust
  auto-vectorizes them (AVX2), Java uses the incubator Vector API (C2's
  auto-vectorizer didn't manage: scalar 3.7 vs vectorized 2.5), C# uses explicit
  `Vector<uint>` SIMD loops (RyuJIT does not auto-vectorize loops).
- **mersenne — register-carried seeding** (all three): the seed-init recurrence read
  `states[idx-1]` back from the array each step, putting a store→load round trip on
  an already-serial `imul` chain; carrying the previous word in a local dropped C#
  from 4.1 → 3.1 ns/number (smaller effect in Rust/Java, whose compilers already
  kept it in a register).
- **congruential32 — shorter encodings**: `(s & 0x7fffffff) >> 16` rewritten as the
  equivalent `(s << 1) >>> 17`. The C# loop was decode-bound, not ALU-bound (a
  97-byte body of immediate-heavy instructions on a front-end that fetches ~16
  bytes/cycle); shift immediates are 1 byte where the masks were 4 (C# 2.19 → 1.98).
- **Java — `-XX:+UseParallelGC`**: mersenne allocates its state per seed; Parallel GC
  handles the churn slightly better than G1 here. Rejected after measurement: huge
  young generations (`-Xmn2g` tripled steady-state cost — page-mapping churn), .NET
  Server GC and gen0 sizing (neutral to worse).

## Takeaways

- **After optimization, the three native/JIT languages converge**: everything lands
  in 1.0–1.4 ns/number for the light generators, with Rust ahead on congruential32
  (LLVM's LCG-composition trick) and C# trailing only there (decode-bound loop) and
  on mersenne (RyuJIT needed hand-written SIMD and still pays more per-seed
  allocation cost than ParallelGC-tuned Java).
- **The biggest wins were algorithmic + build-level, not micro-tweaks**: lazy block
  refill more than halved mersenne everywhere (Rust 4.79 → 2.07, Java 4.88 → 2.41,
  C# 6.44 → 3.21), and `target-cpu=native` was worth 6–47% on Rust depending on the
  generator. Optimized Rust is now ~2.9–5.7× faster than the JS reference on Node.
- **The JS penalty is the int32-pair emulation, not "JS is slow".** On
  congruential32 — genuinely 32-bit math, `Math.imul` maps to one multiply — every JS
  runtime lands within 1.2–2.4× of the optimized natives. On the 64-bit generators,
  where JS carries four int32 halves per state, the gap widens to ~2.3–3.2×.
- **JS runtimes differ by generator.** Bun (JavaScriptCore) is ~25% faster than the
  V8 runtimes on xorshift and ~10% on xoroshiro, but ~40% *slower* on mersenne. Deno
  tracks Node closely — same engine — with a slight edge on congruential32 and its
  bimodal mersenne behavior. No runtime dominates.
- **mersenne has a hard floor**: its seed-initialization recurrence (624 serially
  dependent multiplies) costs ~0.9 µs per seed in every language, ~0.9 ns/number of
  the 1000-number-sequence budget before the first number is drawn.
- **Pure Python is ~300–600× slower than optimized Rust** (~0.3–1 ms per 1000-number
  sequence). Interpreter dispatch dominates; fine for correctness cross-checks, not
  for throughput.

Note on WinterJS: not included — its release binaries were unreachable from this
environment and it executes service-worker HTTP handlers rather than scripts, so a
CLI-style compute benchmark would not measure it comparably anyway.
