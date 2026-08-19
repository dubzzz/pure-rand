#!/usr/bin/env bash
# Runs one full round of the cross-language benchmark: 4 languages x 4 generators.
# Usage: ./run-all.sh [round-label]
# Rust/JS/Java: 100000 seeds x 1000 numbers, 7 timed reps (best-of reported).
# Python: 2000 seeds x 1000 numbers, 7 timed reps (it is ~100x slower; ns/number
# is workload-independent, checked separately).
set -eu
cd "$(dirname "$0")"
label="${1:-round}"
RUST=./rust/target/release/xorshift128plus-bench
export JAVA_TOOL_OPTIONS=

for g in xorshift128plus xoroshiro128plus congruential32 mersenne; do
  echo "=== [$label] $g ==="
  $RUST "$g" 100000 1000 7
  node js/bench.cjs "$g" 100000 1000 7
  (cd java && java Bench "$g" 100000 1000 7)
  python3 python/bench.py "$g" 2000 1000 7
done
