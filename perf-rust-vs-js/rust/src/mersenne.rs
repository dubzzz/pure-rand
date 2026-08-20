//! Native Rust port of pure-rand's MersenneTwister (MT19937).
//!
//! Emits the exact sequence of src/generator/mersenne.ts, but restructured
//! for speed: where the JS version twists one word forward on every `next`
//! (`twistedNext`), this port refills lazily — when the read index wraps, it
//! twists the whole 624-word block in three tight, branch-free loops and
//! tempers every word into an output buffer, both of which auto-vectorize.
//! `next` is then a plain buffer read. The outputs are identical either way
//! (each output is the tempered value of the word before further twisting);
//! the run checksums prove it.

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
    tempered: [u32; N],
    index: usize,
}

#[inline]
fn twist_word(current: u32, next: u32, far: u32) -> u32 {
    let y = (current & MASK_UPPER) | (next & MASK_LOWER);
    far ^ (y >> 1) ^ ((y & 1).wrapping_neg() & A)
}

fn twist_block(mt: &mut [u32; N]) {
    for idx in 0..N - M {
        mt[idx] = twist_word(mt[idx], mt[idx + 1], mt[idx + M]);
    }
    for idx in N - M..N - 1 {
        mt[idx] = twist_word(mt[idx], mt[idx + 1], mt[idx + M - N]);
    }
    mt[N - 1] = twist_word(mt[N - 1], mt[0], mt[M - 1]);
}

fn temper_block(mt: &[u32; N], out: &mut [u32; N]) {
    for idx in 0..N {
        let mut y = mt[idx];
        y ^= y >> U;
        y ^= (y << S) & B;
        y ^= (y << T) & C;
        y ^= y >> L;
        out[idx] = y;
    }
}

impl Generator for MersenneTwister {
    fn new(seed: i32) -> Self {
        let mut states = [0u32; N];
        let mut prev = seed as u32;
        states[0] = prev;
        for (idx, slot) in states.iter_mut().enumerate().skip(1) {
            let xored = prev ^ (prev >> 30);
            prev = F.wrapping_mul(xored).wrapping_add(idx as u32);
            *slot = prev;
        }
        twist_block(&mut states);
        let mut tempered = [0u32; N];
        temper_block(&states, &mut tempered);
        MersenneTwister { states, tempered, index: 0 }
    }

    #[inline]
    fn next(&mut self) -> i32 {
        if self.index == N {
            twist_block(&mut self.states);
            temper_block(&self.states, &mut self.tempered);
            self.index = 0;
        }
        let out = self.tempered[self.index];
        self.index += 1;
        out as i32
    }
}
