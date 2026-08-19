//! Native Rust port of pure-rand's XorShift128+ (a=23, b=18, c=5).
//!
//! Port of src/generator/xorshift128plus.ts: the JS version splits each 64-bit
//! state word into two int32 halves (s01:s00 and s11:s10); here a single u64
//! per word gives the same sequence. Like pure-rand, `next` returns only the
//! low 32 bits of s0+s1, as a signed 32-bit integer.

use crate::Generator;

pub struct XorShift128Plus {
    s0: u64,
    s1: u64,
}

impl Generator for XorShift128Plus {
    // JS: new XorShift128Plus(-1, ~seed, seed | 0, 0)
    fn new(seed: i32) -> Self {
        let seed = seed as u32;
        XorShift128Plus {
            s0: 0xffff_ffff_0000_0000 | (!seed as u64),
            s1: (seed as u64) << 32,
        }
    }

    #[inline]
    fn next(&mut self) -> i32 {
        let a = self.s0 ^ (self.s0 << 23);
        let s1 = self.s1;
        let out = (self.s0 as u32).wrapping_add(s1 as u32) as i32;
        self.s0 = s1;
        self.s1 = a ^ s1 ^ (a >> 18) ^ (s1 >> 5);
        out
    }
}
