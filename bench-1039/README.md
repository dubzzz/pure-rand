# Benchmark of PR #1039 using the #1061 harness

Reproduces the measurements posted on https://github.com/dubzzz/pure-rand/pull/1039.

## What this measures

The speedup of PR #1039 ("Speed up xorshift128plus jump") measured with the new
benchmark commands introduced in PR #1061 (vitest `--compare` / `bench:*` scripts).

Only one source file differs between the two variants, so it is the only thing toggled:
`src/generator/xorshift128plus.ts`.

- `xorshift128plus.ref.ts` — the `main` version (blob `e1462a5`)
- `xorshift128plus.pr.ts` — the PR #1039 version (blob `2593aae`)

## How it was run

Inside a checkout of PR #1061's branch (`claude/modest-dirac-g0jkq7`):

```
./runbench.sh   # 6 interleaved rounds: ref -> pr -> ref -> pr -> ...
```

Each step copies the chosen variant over `src/generator/xorshift128plus.ts`,
runs `pnpm build`, then `vitest bench src/generator/generator.bench.ts --outputJson`.
Interleaving ref/pr round by round cancels warm-up / thermal drift.

`extract.js` pulls `{hz, median}` per benchmark from each raw vitest JSON.
`analyze.js` aggregates the 6 ref vs 6 pr runs (median across rounds + per-run hz).

## Environment

Node v22.22.2, vitest 4.1.6, Intel Xeon @ 2.80GHz x4.

## Headline result

| Benchmark (xorshift128plus) | ref | PR | Δ |
|---|--:|--:|--:|
| `jump` | 870,186 | 1,062,561 | +22.1% (robust) |
| `next` (single) | 9,160,958 | 9,018,863 | -1.6% (noise) |
| `5000× next` | 13,364 | 12,404 | -7.2% (regression) |
| `init + 5000× next` | 14,524 | 12,824 | -11.7% (regression) |

See `results/REPORT.txt` for the full per-run breakdown.
