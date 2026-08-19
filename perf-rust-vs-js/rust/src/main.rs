//! Native Rust port of pure-rand's XorShift128+ (a=23, b=18, c=5).
//!
//! Port of src/generator/xorshift128plus.ts: the JS version splits each 64-bit
//! state word into two int32 halves (s01:s00 and s11:s10); here a single u64
//! per word gives the same sequence. Like pure-rand, `next` returns only the
//! low 32 bits of s0+s1, as a signed 32-bit integer.

use std::env;
use std::hint::black_box;
use std::time::Instant;

pub struct XorShift128Plus {
    s0: u64,
    s1: u64,
}

impl XorShift128Plus {
    // JS: new XorShift128Plus(-1, ~seed, seed | 0, 0)
    pub fn new(seed: i32) -> Self {
        let seed = seed as u32;
        XorShift128Plus {
            s0: 0xffff_ffff_0000_0000 | (!seed as u64),
            s1: (seed as u64) << 32,
        }
    }

    #[inline]
    pub fn next(&mut self) -> i32 {
        let a = self.s0 ^ (self.s0 << 23);
        let s1 = self.s1;
        let out = (self.s0 as u32).wrapping_add(s1 as u32) as i32;
        self.s0 = s1;
        self.s1 = a ^ s1 ^ (a >> 18) ^ (s1 >> 5);
        out
    }
}

// Same seed derivation as the JS bench: spread the loop index over the whole
// int32 range with a Knuth multiplicative hash (Math.imul(i, 2654435761) | 0).
fn seed_at(i: u32) -> i32 {
    i.wrapping_mul(2654435761) as i32
}

fn run(num_seeds: u32, per_seed: u32) -> u32 {
    let mut checksum: u32 = 0;
    for i in 0..num_seeds {
        let mut rng = XorShift128Plus::new(seed_at(i));
        for _ in 0..per_seed {
            checksum = checksum.wrapping_add(rng.next() as u32);
        }
    }
    checksum
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.get(1).map(String::as_str) == Some("verify") {
        for seed in [0i32, 42, -1, 123456789, -987654321] {
            let mut rng = XorShift128Plus::new(seed);
            let values: Vec<String> = (0..10).map(|_| rng.next().to_string()).collect();
            println!("seed={} -> {}", seed, values.join(","));
        }
        return;
    }

    let num_seeds: u32 = args.get(1).and_then(|v| v.parse().ok()).unwrap_or(100_000);
    let per_seed: u32 = args.get(2).and_then(|v| v.parse().ok()).unwrap_or(1_000);
    let reps: u32 = args.get(3).and_then(|v| v.parse().ok()).unwrap_or(7);

    let checksum = run(num_seeds, per_seed); // warmup + correctness output
    println!(
        "rust xorshift128plus | seeds={} per_seed={} checksum={}",
        num_seeds, per_seed, checksum
    );

    let mut timings_ms: Vec<f64> = Vec::new();
    for _ in 0..reps {
        let start = Instant::now();
        black_box(run(black_box(num_seeds), black_box(per_seed)));
        timings_ms.push(start.elapsed().as_secs_f64() * 1e3);
    }
    timings_ms.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let best = timings_ms[0];
    let median = timings_ms[timings_ms.len() / 2];
    let total = (num_seeds as f64) * (per_seed as f64);
    println!(
        "best: {:.2} ms | median: {:.2} ms | {:.3} ns/number | {:.0} numbers/sec | {:.3} µs per {}-number sequence",
        best,
        median,
        best * 1e6 / total,
        total / (best / 1e3),
        best * 1e3 / (num_seeds as f64),
        per_seed
    );
}
