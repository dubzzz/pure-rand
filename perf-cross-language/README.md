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

RESULTS_PLACEHOLDER
