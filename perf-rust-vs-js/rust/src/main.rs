//! Rust side of the Rust-vs-JS comparison of pure-rand's generators.
//!
//! Usage: xorshift128plus-bench <generator> [verify | <seeds> <per_seed> <reps>]
//! with <generator> one of: xorshift128plus, xoroshiro128plus, congruential32, mersenne.
//!
//! The workload mirrors ../js/bench.cjs exactly: for each seed, build a
//! generator and produce `per_seed` numbers, folding every value into a uint32
//! checksum both sides must agree on.

mod congruential32;
mod mersenne;
mod xoroshiro128plus;
mod xorshift128plus;

use std::env;
use std::hint::black_box;
use std::time::Instant;

pub trait Generator {
    fn new(seed: i32) -> Self;
    fn next(&mut self) -> i32;
}

// Same seed derivation as the JS bench: spread the loop index over the whole
// int32 range with a Knuth multiplicative hash (Math.imul(i, 2654435761) | 0).
fn seed_at(i: u32) -> i32 {
    i.wrapping_mul(2654435761) as i32
}

fn run<G: Generator>(num_seeds: u32, per_seed: u32) -> u32 {
    let mut checksum: u32 = 0;
    for i in 0..num_seeds {
        let mut rng = G::new(seed_at(i));
        for _ in 0..per_seed {
            checksum = checksum.wrapping_add(rng.next() as u32);
        }
    }
    checksum
}

fn verify<G: Generator>() {
    for seed in [0i32, 42, -1, 123456789, -987654321] {
        let mut rng = G::new(seed);
        let values: Vec<String> = (0..10).map(|_| rng.next().to_string()).collect();
        println!("seed={} -> {}", seed, values.join(","));
    }
}

fn bench<G: Generator>(name: &str, num_seeds: u32, per_seed: u32, reps: u32) {
    let checksum = run::<G>(num_seeds, per_seed); // warmup + correctness output
    println!(
        "rust {} | seeds={} per_seed={} checksum={}",
        name, num_seeds, per_seed, checksum
    );

    let mut timings_ms: Vec<f64> = Vec::new();
    for _ in 0..reps {
        let start = Instant::now();
        black_box(run::<G>(black_box(num_seeds), black_box(per_seed)));
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

fn dispatch<G: Generator>(name: &str, args: &[String]) {
    if args.first().map(String::as_str) == Some("verify") {
        verify::<G>();
        return;
    }
    let num_seeds: u32 = args.first().and_then(|v| v.parse().ok()).unwrap_or(100_000);
    let per_seed: u32 = args.get(1).and_then(|v| v.parse().ok()).unwrap_or(1_000);
    let reps: u32 = args.get(2).and_then(|v| v.parse().ok()).unwrap_or(7);
    bench::<G>(name, num_seeds, per_seed, reps);
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let generator = args.get(1).map(String::as_str).unwrap_or("xorshift128plus");
    let rest = &args[2.min(args.len())..];
    match generator {
        "xorshift128plus" => dispatch::<xorshift128plus::XorShift128Plus>(generator, rest),
        "xoroshiro128plus" => dispatch::<xoroshiro128plus::XoroShiro128Plus>(generator, rest),
        "congruential32" => dispatch::<congruential32::LinearCongruential32>(generator, rest),
        "mersenne" => dispatch::<mersenne::MersenneTwister>(generator, rest),
        other => {
            eprintln!(
                "Unknown generator '{}': expected xorshift128plus, xoroshiro128plus, congruential32 or mersenne",
                other
            );
            std::process::exit(1);
        }
    }
}
