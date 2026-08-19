//! Native Rust port of pure-rand's XoroShiro128+ (a=24, b=16, c=37).
//!
//! Port of src/generator/xoroshiro128plus.ts, with each pair of int32 halves
//! (s01:s00, s11:s10) collapsed into one u64 word. Same shape as the
//! wasm-bindgen rewrite on the `to-rust` branch (src/xoro_shiro_128_plus.rs),
//! minus the wasm interop. `next` returns the low 32 bits of s0+s1 as a
//! signed 32-bit integer, like pure-rand.

use crate::Generator;

pub struct XoroShiro128Plus {
    s0: u64,
    s1: u64,
}

impl Generator for XoroShiro128Plus {
    // JS: new XoroShiro128Plus(-1, ~seed, seed | 0, 0)
    fn new(seed: i32) -> Self {
        let seed = seed as u32;
        XoroShiro128Plus {
            s0: 0xffff_ffff_0000_0000 | (!seed as u64),
            s1: (seed as u64) << 32,
        }
    }

    #[inline]
    fn next(&mut self) -> i32 {
        let out = (self.s0 as u32).wrapping_add(self.s1 as u32) as i32;
        let a = self.s0 ^ self.s1;
        self.s0 = self.s0.rotate_left(24) ^ a ^ (a << 16);
        self.s1 = a.rotate_left(37);
        out
    }
}
