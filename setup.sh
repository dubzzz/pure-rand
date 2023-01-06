curl https://sh.rustup.rs -sSf | sh -s -- -y
source "$HOME/.cargo/env"
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# cargo install cargo-generate
# node --experimental-wasm-modules plop.mjs
# wasm-pack build --target nodejs     --> require
# wasm-pack build --target bundler    --> import