use wasm_bindgen::prelude::*;

use js_sys::Array;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
pub struct XoroShiro128Plus {
    s0: u64,
    s1: u64,
}

fn rotl(x: u64, k: u64) -> u64 {
	(x << k) | (x >> (64 - k))
}

#[wasm_bindgen]
impl XoroShiro128Plus {
    pub fn min(&self) -> i32 {
        -0x8000_0000
    }

    pub fn max(&self) -> i32 {
        0x7fff_ffff
    }

    pub fn clone(&self) -> XoroShiro128Plus {
        XoroShiro128Plus {
            s0: self.s0,
            s1: self.s1,
        }
    }

    pub fn next(&self) -> Array {
        let data = Array::new(); // more precisely: (i32, XoroShiro128Plus)
        let mut next_rng: XoroShiro128Plus = self.clone();
        let out: i32 = next_rng.unsafeNext();
        data.push(&JsValue::from_f64(out.into()));
        data.push(next_rng.memory());
        data
    }

    pub fn jump(&self) -> XoroShiro128Plus {
        let mut next_rng = self.clone();
        next_rng.unsafeJump();
        next_rng
    }

    #[allow(non_snake_case)]
    pub fn unsafeNext(&mut self) -> i32 {
        let result = (self.s0 + self.s1) & 0x0000_0000_ffff_ffff;
        let temp_s1 = self.s0 ^ self.s1;
        self.s0 = rotl(self.s0, 24) ^ temp_s1 ^ (temp_s1 << 16);
        self.s1 = rotl(temp_s1, 37);
        result as i32
    }

    #[allow(non_snake_case)]
    pub fn unsafeJump(&mut self) {
        let j0: u64 = 0xdf90_0294_d8f5_54a5;
        let j1: u64 = 0x1708_65df_4b32_01fc;
        let mut s0: u64 = 0;
        let mut s1: u64 = 0;
        for b in 0..64 {
            if j0 & (1 << b) != 0 {
                s0 ^= self.s0;
                s1 ^= self.s1;
            }
            self.unsafeNext();
        }
        for b in 0..64 {
            if j1 & (1 << b) != 0 {
                s0 ^= self.s0;
                s1 ^= self.s1;
            }
            self.unsafeNext();
        }
        self.s0 = s0;
        self.s1 = s1;
    }
}

#[wasm_bindgen]
pub fn xoro_shiro_128_plus(seed: f64) -> XoroShiro128Plus {
    let safe_seed = seed as u32;
    let s0: u64 = 0xffff_ffff_0000_0000 + (!safe_seed as u64);
    let s1: u64 = (safe_seed as u64) << 32;
    XoroShiro128Plus { s0, s1 }
}
