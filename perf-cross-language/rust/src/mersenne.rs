//! Native Rust port of pure-rand's MersenneTwister (MT19937).
//!
//! Port of src/generator/mersenne.ts, including its incremental twist:
//! instead of regenerating the whole 624-word block ahead of time, each
//! `next` tempers the current word then twists a single word forward
//! (`twistedNext` in the JS source). Seeding matches too: standard MT19937
//! initialization followed by one full twist, starting at index 0.

use crate::Generator;

const N: usize = 624;
const M: usize = 397;
const A: u32 = 0x9908_b0df;
const F: u32 = 1_812_433_253;
const U: u32 = 11;
const S: u32 = 7;
const B: u32 = 0x9d2c_5680;
const T: u32 = 15;
const C: u32 = 0xefc6_0000;
const L: u32 = 18;
const MASK_LOWER: u32 = 0x7fff_ffff;
const MASK_UPPER: u32 = 0x8000_0000;

pub struct MersenneTwister {
    states: [u32; N],
    index: usize,
}

#[inline]
fn twisted_next(mt: &mut [u32; N], idx: usize) -> usize {
    let next_idx = if idx == N - 1 { 0 } else { idx + 1 };
    let y = (mt[idx] & MASK_UPPER) | (mt[next_idx] & MASK_LOWER);
    let twisted_idx = if idx < N - M { idx + M } else { idx + M - N };
    mt[idx] = mt[twisted_idx] ^ (y >> 1) ^ ((y & 1).wrapping_neg() & A);
    next_idx
}

impl Generator for MersenneTwister {
    fn new(seed: i32) -> Self {
        let mut states = [0u32; N];
        states[0] = seed as u32;
        for idx in 1..N {
            let xored = states[idx - 1] ^ (states[idx - 1] >> 30);
            states[idx] = F.wrapping_mul(xored).wrapping_add(idx as u32);
        }
        for idx in 0..N {
            twisted_next(&mut states, idx);
        }
        MersenneTwister { states, index: 0 }
    }

    #[inline]
    fn next(&mut self) -> i32 {
        let mut y = self.states[self.index];
        y ^= y >> U;
        y ^= (y << S) & B;
        y ^= (y << T) & C;
        y ^= y >> L;
        self.index = twisted_next(&mut self.states, self.index);
        y as i32
    }
}
