#!/bin/bash
set -e
cd /tmp/bench-harness
ROUNDS=6
mkdir -p /tmp/results
for ((r=1; r<=ROUNDS; r++)); do
  for variant in ref pr; do
    cp /tmp/xorshift_${variant}.ts src/generator/xorshift128plus.ts
    pnpm build >/dev/null 2>&1
    pnpm exec vitest bench src/generator/generator.bench.ts \
        --outputJson /tmp/results/raw_${variant}_${r}.json --run >/dev/null 2>&1
    node /tmp/extract.js /tmp/results/raw_${variant}_${r}.json > /tmp/results/${variant}_${r}.json
    echo "done round $r variant $variant"
  done
done
echo "ALL DONE"
