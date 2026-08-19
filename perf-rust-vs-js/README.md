# Rust vs JS: pure-rand's generators

Compares **native Rust** ports of all four pure-rand generators against the
**JS implementations shipped by pure-rand** (`lib/generator/*.js`, built from
`src/generator/*.ts`):

- `xorshift128plus` — XorShift128+ (a=23, b=18, c=5)
- `xoroshiro128plus` — XoroShiro128+ (a=24, b=16, c=37)
- `congruential32` — three LCG steps per output, 15 bits kept from each
- `mersenne` — MT19937 with pure-rand's incremental twist (one word per `next`)

The Rust ports take inspiration from the wasm-bindgen rewrites on the `to-rust`
branch (`src/xoro_shiro_128_plus.rs`), but drop all wasm/JS interop: they build
into a plain Rust binary, so the numbers below measure pure computation on each
side (no FFI, no wasm boundary). Where the JS 128-bit generators split each
64-bit state word into two int32 halves, the Rust ports use a single `u64` per
word — same algorithms, same seeding, same 32-bit signed outputs.

## Workload

For each of N seeds (spread over the int32 range via `Math.imul(i, 2654435761)` /
`i.wrapping_mul(2654435761)`): build a generator from the seed and produce the **first
1000 numbers** of its sequence (generator construction included — for mersenne that
means the 624-word init + twist is part of each sequence's cost, on both sides).
Every produced number is folded into a uint32 checksum which both sides must agree
on — so the benchmark doubles as an exhaustive equivalence check. `verify` mode
additionally prints the first 10 values for seeds 0, 42, -1, 123456789, -987654321;
Rust and JS output are identical for all four generators.

## Running it

```bash
pnpm build                                     # once, at the repo root (builds lib/)
cd perf-rust-vs-js/rust && cargo build --release
./target/release/xorshift128plus-bench <generator> 100000 1000 7   # <generator> <seeds> <numbers per seed> <reps>
node ../js/bench.cjs <generator> 100000 1000 7
# or: ... <generator> verify   to dump sequences instead of timing
```

## Results

Linux, Intel Xeon @ 2.80GHz, rustc 1.94.1 (`opt-level=3`, LTO), Node.js v22.22.2.
100 000 seeds × 1000 numbers (100M numbers per repetition), best of 5–7 repetitions,
medians within ~1–2% of best; JS timed after JIT warmup. Checksums matched between
Rust and JS in every configuration, and ratios were stable when re-run at 10 000 and
(for xorshift) 1 000 000 seeds.

| Generator        | Rust ns/number | JS ns/number | Rust M numbers/s | JS M numbers/s | µs per 1000-number sequence (Rust / JS) | Speedup |
| ---------------- | -------------- | ------------ | ---------------- | -------------- | --------------------------------------- | ------- |
| xorshift128plus  | 1.38           | 3.35         | 726              | 298            | 1.38 / 3.35                             | 2.43×   |
| xoroshiro128plus | 1.47           | 3.54         | 679              | 282            | 1.47 / 3.54                             | 2.41×   |
| congruential32   | 1.93           | 2.46         | 518              | 406            | 1.93 / 2.46                             | 1.27×   |
| mersenne         | 4.81           | 12.33        | 208              | 81             | 4.81 / 12.33                            | 2.56×   |

Takeaways:

- **The 64-bit generators (xorshift/xoroshiro) are ~2.4× faster in Rust.** The gap
  is mostly the state representation: Rust works on two `u64` words with native
  64-bit shifts/xors (and a hardware rotate for xoroshiro), while JS emulates them
  with four int32 halves, roughly doubling the bit-twiddling per step.
- **congruential32 is the closest race (only 1.27×).** Its math is genuinely 32-bit,
  so V8 compiles it to nearly the same instructions as rustc — `Math.imul` maps
  straight to a 32-bit multiply. This is about as close to native as JS number
  crunching gets.
- **mersenne shows the largest gap (~2.6×).** Both sides run the same incremental
  twist, but Rust keeps the 624-word state in a flat, bounds-check-free `[u32; 624]`
  on the stack and pays nothing for the per-seed initialization loop, while JS pays
  array-access overhead in `next` and allocates/`push`es the state array on every
  seed. It is also the only generator where sequence setup is a visible share of the
  1000-number cost: ~4.8 µs/sequence vs ~1.4–1.9 µs for the others in Rust.
- In no case is JS more than ~2.6× behind: for allocation-free 32-bit integer code,
  V8 stays within striking distance of native, and the JS `congruential32` at
  ~2.5 ns/number even beats the *Rust* mersenne per number.
