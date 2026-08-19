//! Native Rust port of pure-rand's LinearCongruential32.
//!
//! Port of src/generator/congruential32.ts: three LCG steps per `next`
//! (computed from the same base state, like the JS version, so the three
//! multiplications have no data dependency), 15 usable bits taken from each,
//! recombined into one 32-bit output.

use crate::Generator;

const MULTIPLIER: i32 = 0x000343fd;
const INCREMENT: i32 = 0x00269ec3;
// JS MASK_2 = -2147483649 goes through ToInt32 and becomes 0x7fffffff.
const MASK_2: i32 = 0x7fff_ffff;

const MULTIPLIER_2: i32 = 0xa9fc6809u32 as i32; // = a^2 mod 2^32
const INCREMENT_2: i32 = 0x1e278e7a; // = c*(1 + a) mod 2^32
const MULTIPLIER_3: i32 = 0x45c82be5; // = a^3 mod 2^32
const INCREMENT_3: i32 = 0xd2f65b55u32 as i32; // = c*(1 + a + a^2) mod 2^32

pub struct LinearCongruential32 {
    seed: i32,
}

impl Generator for LinearCongruential32 {
    fn new(seed: i32) -> Self {
        LinearCongruential32 { seed }
    }

    #[inline]
    fn next(&mut self) -> i32 {
        let s0 = self.seed;
        let s1 = s0.wrapping_mul(MULTIPLIER).wrapping_add(INCREMENT);
        let s2 = s0.wrapping_mul(MULTIPLIER_2).wrapping_add(INCREMENT_2);
        let s3 = s0.wrapping_mul(MULTIPLIER_3).wrapping_add(INCREMENT_3);
        self.seed = s3;
        let v1 = (s1 & MASK_2) >> 16;
        let v2 = (s2 & MASK_2) >> 16;
        let v3 = (s3 & MASK_2) >> 16;
        v3 | (v2 << 15) | (v1 << 30)
    }
}
