use wasm_bindgen::prelude::*;

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
    fn unsafeNext(mut this: &RandomGenerator) -> i32;
    #[wasm_bindgen(structural, method)]
    fn unsafeJump(mut this: &RandomGenerator);
}