# pure-rand's generators across languages

Compares the **JS implementations shipped by pure-rand** (`lib/generator/*.js`, built
from `src/generator/*.ts`) with native ports of all four generators in **Rust**,
**Java**, **C#** and **pure Python**, and runs the JS bench on three runtimes
(**Node/V8**, **Deno/V8**, **Bun/JavaScriptCore**):

- `xorshift128plus` — XorShift128+ (a=23, b=18, c=5)
- `xoroshiro128plus` — XoroShiro128+ (a=24, b=16, c=37)
- `congruential32` — three LCG steps per output, 15 bits kept from each
- `mersenne` — MT19937 with pure-rand's incremental twist (one word per `next`)

The ports take inspiration from the wasm-bindgen rewrites on the `to-rust` branch
(`src/xoro_shiro_128_plus.rs`), but drop all wasm/JS interop: each is a plain native
program, so the numbers below measure pure computation on each side (no FFI, no wasm
boundary). Where the JS 128-bit generators split each 64-bit state word into two int32
halves, the Rust/Java/C# ports use a single 64-bit word — same algorithms, same
seeding, same 32-bit signed outputs. The Python port is plain interpreter code (no
libraries), masking every step back to 32/64 bits.

Layout: `rust/` (cargo binary), `java/Bench.java`, `csharp/` (net10.0 project,
struct generators behind a static-abstract generic constraint so the JIT
monomorphizes the hot loop, like Rust's), `python/bench.py`, `js/bench.cjs`.

## Workload

For each of N seeds (spread over the int32 range via `Math.imul(i, 2654435761)` /
`i.wrapping_mul(2654435761)` equivalents): build a generator from the seed and produce
the **first 1000 numbers** of its sequence (generator construction included — for
mersenne that means the 624-word init + twist is part of each sequence's cost, in every
language). Every produced number is folded into a uint32 checksum which all sides must
agree on — so the benchmark doubles as an exhaustive equivalence check. `verify` mode
additionally prints the first 10 values for seeds 0, 42, -1, 123456789, -987654321;
all seven language/runtime combinations print identical output for all four generators.

## Running it

```bash
pnpm build                                     # once, at the repo root (builds lib/)

cd perf-rust-vs-js
( cd rust && cargo build --release )
( cd csharp && dotnet publish -c Release -o out )
( cd java && javac Bench.java )

# <generator> = xorshift128plus | xoroshiro128plus | congruential32 | mersenne
./rust/target/release/xorshift128plus-bench <generator> 100000 1000 7   # <seeds> <per seed> <reps>
node js/bench.cjs <generator> 100000 1000 7
bun js/bench.cjs <generator> 100000 1000 7
deno run --allow-read js/bench.cjs <generator> 100000 1000 7
java -cp java Bench <generator> 100000 1000 7
./csharp/out/bench <generator> 100000 1000 7
python3 python/bench.py <generator> 2000 1000 7
# or: ... <generator> verify   to dump sequences instead of timing
```

## Methodology

Linux, Intel Xeon @ 2.80GHz (4 vCPU). rustc 1.94.1 (`opt-level=3`, LTO), Node.js
v22.22.2, Bun 1.3.11 (JavaScriptCore), Deno 2.9.5 (V8), OpenJDK 21.0.10, .NET 10
(SDK 10.0.111), CPython 3.11.15.

Each (language, generator) cell was measured with **3 independent process
invocations** (5–8 for the noisy cells, see below), each doing warmup runs followed by
7–9 timed repetitions of the full workload; the table reports the best repetition
across all invocations. 100 000 seeds × 1000 numbers per repetition (100M numbers) for
the compiled/JIT languages; 2 000 seeds for CPython (checksums cross-checked against
the other languages at that size too). Best-of-invocation agreed within ~1–3% across
processes for every cell except the two flagged below; medians sat within ~1–2% of
best. Checksums matched across all languages and runtimes in every configuration.

## Results — ns per number (lower is better)

Native / JIT languages:

| Generator        | Rust | Java | C#   | JS (Node) | Python |
| ---------------- | ---- | ---- | ---- | --------- | ------ |
| xorshift128plus  | 1.21 | 1.24 | 1.34 | 3.35      | 316    |
| xoroshiro128plus | 1.47 | 1.39 | 1.26 | 3.50      | 415    |
| congruential32   | 1.93 | 1.44 | 2.19 | 2.47      | 606    |
| mersenne         | 4.79 | 4.88 | 6.44 | 11.84     | 994    |

JS runtimes, same `bench.cjs`, reported separately:

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

Per 1000-number sequence that is ~1.2–1.9 µs in Rust/Java/C# and ~2.5–3.5 µs in JS for
the light generators (mersenne: 4.8–6.4 µs native, 10–16 µs JS), and 0.3–1.0 ms in
pure Python.

## Takeaways

- **Rust, Java and C# are effectively in the same league** (within ~10–50% of each
  other), all roughly 1.5–2.5× faster than V8 on the 64-bit generators. Java matches
  Rust on xorshift and **beats it on congruential32** (1.44 vs 1.93 — HotSpot
  schedules the three independent multiplies better), and C# **beats Rust on
  xoroshiro** (1.26 vs 1.47) — but see below: that gap is an ISA-targeting artifact,
  not a language property.
- **Why C# beats default-built Rust on xoroshiro:** `cargo build --release` targets
  the generic x86-64 baseline ISA, so LLVM emits the destructive two-operand `rol`
  for the rotates, and the extra register copies it forces land on the loop-carried
  dependency chain (this loop is latency-bound at ~3–4 cycles/number, not
  throughput-bound: the C# loop runs 12 instructions/number vs Rust's ~9 and still
  wins). Rebuilding the identical Rust source with `RUSTFLAGS="-C target-cpu=native"`
  swaps them for BMI2 `rorx` (three-operand, non-destructive, flag-free), shortening
  the chain: **1.47 → 1.11 ns/number, faster than C#'s 1.25**. RyuJIT's own Tier1
  loop also uses plain `rol` — its win over baseline Rust was scheduling luck on the
  same latency-bound recurrence, and vanishes once Rust is allowed to target the
  actual CPU.
- **The JS penalty is the int32-pair emulation, not "JS is slow".** On
  congruential32 — genuinely 32-bit math, `Math.imul` maps to one multiply — every JS
  runtime lands within 1.2–1.4× of Rust. On the 64-bit generators, where JS carries
  four int32 halves per state, the gap widens to ~2.2–2.7×.
- **JS runtimes differ by generator.** Bun (JavaScriptCore) is ~25% faster than the
  V8 runtimes on xorshift and ~10% on xoroshiro, but ~40% *slower* on mersenne
  (per-seed array allocation + tighter array access seem to suit V8 better). Deno
  tracks Node closely — same engine — with a slight edge on congruential32 and its
  bimodal mersenne behavior. No runtime dominates.
- **mersenne is the heaviest everywhere** and the only generator where sequence setup
  (624-word init + twist per seed) is a visible share of the 1000-number cost.
- **Pure Python is ~250–350× slower than Rust** (~0.3–1 ms per 1000-number sequence).
  Interpreter dispatch dominates: arbitrary-precision ints plus explicit masking per
  step leave nothing for the CPU to pipeline. Fine for correctness cross-checks, not
  for throughput.

Note on WinterJS: not included — its release binaries were unreachable from this
environment and it executes service-worker HTTP handlers rather than scripts, so a
CLI-style compute benchmark would not measure it comparably anyway.
