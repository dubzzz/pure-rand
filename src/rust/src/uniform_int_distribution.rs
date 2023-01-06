use wasm_bindgen::prelude::*;
use js_sys::Array;

#[wasm_bindgen]
extern "C" {
    pub type RandomGenerator;
    #[wasm_bindgen(structural, method)]
    fn min(this: &RandomGenerator) -> i32;
    #[wasm_bindgen(structural, method)]
    fn max(this: &RandomGenerator) -> i32;
    #[wasm_bindgen(structural, method)]
    fn clone(this: &RandomGenerator) -> RandomGenerator;
    #[wasm_bindgen(structural, method)]
    fn next(this: &RandomGenerator) -> Array;
    #[wasm_bindgen(structural, method)]
    fn jump(this: &RandomGenerator) -> RandomGenerator;
    #[wasm_bindgen(structural, method)]
    fn unsafeNext(mut this: &RandomGenerator) -> i32;
    #[wasm_bindgen(structural, method)]
    fn unsafeJump(mut this: &RandomGenerator);
}

#[wasm_bindgen]
#[allow(unused_mut)]
pub fn unsafe_uniform_int_distribution(from: i64, to: i64, mut rng: RandomGenerator) -> i64 {
	let range_size = to - from +1;
    let min_value = rng.min() as i64;
    let num_values = (rng.max() - rng.min() +1) as i64;

    // Range provided by the RandomGenerator is large enough
    if range_size <= num_values {
        let max_allowed = num_values - (num_values % range_size);
        loop {
            let out = rng.unsafeNext() as i64;
            let delta = out - min_value;
            if delta < max_allowed {
                return delta % range_size;
            }
        }
    }
    // Compute number of iterations required to have enough random
    // to build uniform entries in the asked range
    let mut final_num_values = num_values * num_values;
    let mut num_iterations = 2; // At least 2 (at this point in the code)
    while final_num_values < range_size {
        final_num_values *= num_values;
        num_iterations += 1;
    }
    let truncated_final_num_values = final_num_values / range_size; // perform a floor
    let max_accepted_random = range_size * truncated_final_num_values;
    loop {
        // Aggregate mutiple calls to next() into a single random value
        let mut value = 0;
        for _num in 0..num_iterations {
            let out = rng.unsafeNext() as i64;
            value = num_values * value + (out - min_value); // Warning: we overflow may when diff > max_safe (eg: =max_safe-min_safe+1)
        }
        if value < max_accepted_random {
            let truncated_value = value / range_size; // perform a floor
            let in_diff = value - range_size * truncated_value;
            return in_diff;
        }
    }
}
