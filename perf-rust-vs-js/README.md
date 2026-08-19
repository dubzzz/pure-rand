# Rust vs JS: XorShift128+ (pure-rand)

Compares a **native Rust** port of pure-rand's `xorshift128plus` generator against the
**JS implementation shipped by pure-rand** (`lib/generator/xorshift128plus.js`, built from
`src/generator/xorshift128plus.ts`).

The Rust port takes inspiration from the wasm-bindgen rewrites on the `to-rust` branch
(`src/xoro_shiro_128_plus.rs`), but drops all wasm/JS interop: it is a plain Rust binary,
so the numbers below measure pure computation on each side (no FFI, no wasm boundary).
Where the JS version splits each 64-bit state word into two int32 halves, the Rust port
uses a single `u64` per word — same algorithm (a=23, b=18, c=5), same seeding
(`s0 = -1:~seed`, `s1 = seed:0`), same 32-bit signed output.

## Workload

For each of N seeds (spread over the int32 range via `Math.imul(i, 2654435761)` /
`i.wrapping_mul(2654435761)`): build a generator from the seed and produce the **first
1000 numbers** of its sequence. Every produced number is folded into a uint32 checksum,
which both sides must agree on — so the benchmark doubles as an exhaustive equivalence
check. `verify` mode additionally prints the first 10 values for a handful of seeds
(0, 42, -1, 123456789, -987654321); Rust and JS output are identical.

## Running it

```bash
pnpm build                                     # once, at the repo root (builds lib/)
cd perf-rust-vs-js/rust && cargo build --release
./target/release/xorshift128plus-bench 100000 1000 7   # <seeds> <numbers per seed> <reps>
node ../js/bench.cjs 100000 1000 7
```

## Results

Linux, Intel Xeon @ 2.80GHz, rustc 1.94.1 (`opt-level=3`, LTO), Node.js v22.22.2.
Best of 7 repetitions (medians within ~1–2% of best); JS timed after JIT warmup.
Checksums matched between Rust and JS in every configuration.

| Seeds     | Numbers   | Rust    | JS       | ns/number (Rust) | ns/number (JS) | Speedup |
| --------- | --------- | ------- | -------- | ---------------- | -------------- | ------- |
| 10 000    | 10 M      | 13.7 ms | 34.2 ms  | 1.374            | 3.416          | 2.49×   |
| 100 000   | 100 M     | 138 ms  | 335 ms   | 1.378            | 3.353          | 2.43×   |
| 1 000 000 | 1 000 M   | 1375 ms | 3420 ms  | 1.375            | 3.420          | 2.49×   |

- Rust: ~1.38 ns/number → **~727 M numbers/sec**, i.e. ~1.38 µs per 1000-number sequence.
- JS: ~3.4 ns/number → **~293 M numbers/sec**, i.e. ~3.4 µs per 1000-number sequence.
- **Native Rust is ~2.4–2.5× faster** than the JS implementation, consistently across scales.

The gap is mostly the state representation: Rust works on two `u64` words with native
64-bit shifts/xors, while JS has to emulate them with four int32 halves (V8 small
integers), roughly doubling the bit-twiddling per step. Given that, ~2.5× is a strong
showing for the JS side — V8 keeps everything in registers as unboxed int32s; there is
no allocation in either loop.
