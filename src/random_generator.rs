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