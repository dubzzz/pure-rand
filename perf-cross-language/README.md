# Cross-language benchmark of pure-rand's generators

Compares the **JS implementations shipped by pure-rand** (`lib/generator/*.js`,
built from `src/generator/*.ts`) against **pure native ports** of all four
generators in three other languages:

- **Rust** — plain `cargo` binary, `opt-level=3` + LTO, no wasm/FFI boundary
- **Java** — single `Bench.java`, plain `javac`/HotSpot, timed after JIT warmup
- **Python** — pure CPython (`bench.py`), no numpy/cffi, wraparound emulated by masking

for the four generators pure-rand supports:

- `xorshift128plus` — XorShift128+ (a=23, b=18, c=5)
- `xoroshiro128plus` — XoroShiro128+ (a=24, b=16, c=37)
- `congruential32` — three LCG steps per output, 15 bits kept from each
- `mersenne` — MT19937 with pure-rand's incremental twist (one word per `next`)

The Rust ports take inspiration from the wasm-bindgen rewrites on the `to-rust`
branch (`src/xoro_shiro_128_plus.rs`), but drop all wasm/JS interop: they build
into a plain Rust binary, so the numbers below measure pure computation on each
side (no FFI, no wasm boundary). Where the JS 128-bit generators split each
64-bit state word into two int32 halves, the Rust/Java ports use a single
`u64`/`long` per word and Python a masked big-int — same algorithms, same
seeding, same 32-bit signed outputs.

## Workload

For each of N seeds (spread over the int32 range via `Math.imul(i, 2654435761)`):
build a generator from the seed and produce the **first 1000 numbers** of its
sequence (generator construction included — for mersenne that means the 624-word
init + twist is part of each sequence's cost, in every language). Every produced
number is folded into a uint32 checksum all languages must agree on — so the
benchmark doubles as an exhaustive equivalence check. `verify` mode additionally
prints the first 10 values for seeds 0, 42, -1, 123456789, -987654321.

**Correctness:** for all four generators, the `verify` sequences are identical in
all four languages, and the uint32 checksums over 1000 seeds × 1000 numbers
(4M numbers per generator) match exactly: JS = Rust = Java = Python.

## Running it

```bash
pnpm build                                     # once, at the repo root (builds lib/)
cd perf-cross-language
(cd rust && cargo build --release)
(cd java && javac Bench.java)
./run-all.sh                                   # one full round: 4 languages x 4 generators

# or individually: <generator> is xorshift128plus | xoroshiro128plus | congruential32 | mersenne
./rust/target/release/xorshift128plus-bench <generator> 100000 1000 7   # <generator> <seeds> <numbers per seed> <reps>
node js/bench.cjs <generator> 100000 1000 7
(cd java && java Bench <generator> 100000 1000 7)
python3 python/bench.py <generator> 2000 1000 7
# or: ... <generator> verify   to dump sequences instead of timing
```

## Results

Linux, Intel Xeon @ 2.10GHz. rustc 1.94.1 (`opt-level=3`, LTO), Node.js v22.22.2,
OpenJDK 21.0.10 (HotSpot), CPython 3.11.15.

Method: 5 full rounds, each round a fresh process per language per generator.
Rust/JS/Java: 100 000 seeds × 1000 numbers (100M numbers) per repetition, best of
7 repetitions after warmup; Python: 2000 seeds × 1000 numbers (2M numbers) per
repetition, best of 7. Best-of-run agreed across the 5 rounds within ~1–5% for
every cell (medians within ~1–2% of best), and per-number costs were re-checked at
other workload sizes (Java at 10 000 and 1 000 000 seeds, Python at 5000 seeds)
with matching results. The table reports the best across rounds. Checksums matched
across all four languages in every configuration.

**ns per number** (= µs per 1000-number sequence, construction included):

| Generator        | Rust  | Java  | JS (pure-rand) | Python |
| ---------------- | ----- | ----- | -------------- | ------ |
| xorshift128plus  | 1.18  | 1.12  | 2.69           | 236    |
| xoroshiro128plus | 1.32  | 1.20  | 3.01           | 318    |
| congruential32   | 1.67  | 1.36  | 2.04           | 460    |
| mersenne         | 3.95  | 3.92  | 9.21           | 823    |

**Millions of numbers per second**:

| Generator        | Rust | Java | JS (pure-rand) | Python |
| ---------------- | ---- | ---- | -------------- | ------ |
| xorshift128plus  | 850  | 894  | 372            | 4.24   |
| xoroshiro128plus | 755  | 831  | 332            | 3.14   |
| congruential32   | 600  | 736  | 490            | 2.17   |
| mersenne         | 253  | 255  | 109            | 1.22   |

**Relative to the JS implementation** (higher = faster than JS):

| Generator        | Rust  | Java  | JS   | Python |
| ---------------- | ----- | ----- | ---- | ------ |
| xorshift128plus  | 2.29× | 2.40× | 1×   | 1/88×  |
| xoroshiro128plus | 2.27× | 2.50× | 1×   | 1/106× |
| congruential32   | 1.22× | 1.50× | 1×   | 1/225× |
| mersenne         | 2.33× | 2.35× | 1×   | 1/89×  |

Takeaways:

- **Rust and Java are effectively tied**, and both run the 64-bit generators
  (xorshift/xoroshiro) and mersenne ~2.3–2.5× faster than the JS shipped by
  pure-rand. For xorshift/xoroshiro the gap is mostly state representation: native
  code works on two 64-bit words with hardware shifts/rotates, while JS emulates
  them with four int32 halves, roughly doubling the bit-twiddling per step.
  HotSpot's C2 even edges out rustc slightly on these tight int loops.
- **congruential32 is the closest race (Rust only 1.22× ahead).** Its math is
  genuinely 32-bit, so V8 compiles it to nearly the same instructions as
  rustc/HotSpot — `Math.imul` maps straight to a 32-bit multiply. This is about as
  close to native as JS number crunching gets, and the JS congruential32 at
  ~2 ns/number even beats the *Rust* mersenne per number.
- **mersenne shows the largest native-vs-JS gap (~2.3×) and the highest absolute
  cost.** All languages run the same incremental twist, but native code keeps the
  624-word state in a flat, bounds-check-free array and pays little for the
  per-seed initialization, while JS pays array-access overhead in `next` and
  allocates the state array on every seed. It is the only generator where sequence
  setup is a visible share of the 1000-number cost (~4 µs/sequence native vs
  ~1.1–1.7 µs for the others).
- **Pure Python is in a different universe: ~90–225× slower than the JS version**
  (2–4 orders of magnitude off native). CPython interprets bytecode and boxes every
  integer, and the masking (`& 0xFFFFFFFF...`) needed to emulate fixed-width
  wraparound adds big-int operations on every step. congruential32 — the *fastest*
  generator everywhere else — is Python's second worst, because its three
  multiplies + masks per output are pure interpreter overhead.
- In no case is pure-rand's JS more than ~2.5× behind native: for allocation-free
  32-bit integer code, V8 stays within striking distance of Rust and the JVM.
