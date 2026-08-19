# Pure-Python side of the cross-language comparison of pure-rand's generators.
# No third-party libraries: plain interpreter arithmetic with explicit 32/64-bit
# masking (Python ints are arbitrary-precision, so every step masks back down).
#
# Usage: python3 bench.py <generator> [verify | <seeds> <per_seed> <reps>]
# with <generator> one of: xorshift128plus, xoroshiro128plus, congruential32, mersenne.
#
# Same workload as ../rust/src/main.rs and ../js/bench.cjs: for each seed,
# build a generator and produce `per_seed` numbers, folding every value into a
# uint32 checksum all sides must agree on. State is kept as unsigned ints;
# outputs are converted to signed int32 for `verify` (checksums are unaffected:
# signed and unsigned representations are congruent mod 2^32).

import sys
import time

MASK32 = 0xFFFFFFFF
MASK64 = 0xFFFFFFFFFFFFFFFF


def to_signed32(value):
    return value - 0x100000000 if value >= 0x80000000 else value


# Port of src/generator/xorshift128plus.ts (XorShift128+ with a=23, b=18, c=5).
class XorShift128Plus:
    __slots__ = ("s0", "s1")

    def __init__(self, seed):
        # JS: new XorShift128Plus(-1, ~seed, seed | 0, 0)
        seed &= MASK32
        self.s0 = 0xFFFFFFFF00000000 | (seed ^ MASK32)
        self.s1 = seed << 32

    def next(self):
        s0 = self.s0
        s1 = self.s1
        a = (s0 ^ (s0 << 23)) & MASK64
        out = (s0 + s1) & MASK32  # low 32 bits of s0+s1, like pure-rand
        self.s0 = s1
        self.s1 = a ^ s1 ^ (a >> 18) ^ (s1 >> 5)
        return out


# Port of src/generator/xoroshiro128plus.ts (XoroShiro128+ with a=24, b=16, c=37).
class XoroShiro128Plus:
    __slots__ = ("s0", "s1")

    def __init__(self, seed):
        # JS: new XoroShiro128Plus(-1, ~seed, seed | 0, 0)
        seed &= MASK32
        self.s0 = 0xFFFFFFFF00000000 | (seed ^ MASK32)
        self.s1 = seed << 32

    def next(self):
        s0 = self.s0
        s1 = self.s1
        out = (s0 + s1) & MASK32
        a = s0 ^ s1
        self.s0 = (((s0 << 24) | (s0 >> 40)) ^ a ^ (a << 16)) & MASK64  # rotl(s0, 24)
        self.s1 = ((a << 37) | (a >> 27)) & MASK64  # rotl(a, 37)
        return out


# Port of src/generator/congruential32.ts: three LCG steps per next,
# 15 usable bits taken from each, recombined into one 32-bit output.
class LinearCongruential32:
    __slots__ = ("seed",)

    MULTIPLIER = 0x000343FD
    INCREMENT = 0x00269EC3
    # JS MASK_2 = -2147483649 goes through ToInt32 and becomes 0x7fffffff.
    MASK_2 = 0x7FFFFFFF
    MULTIPLIER_2 = 0xA9FC6809  # = a^2 mod 2^32
    INCREMENT_2 = 0x1E278E7A  # = c*(1 + a) mod 2^32
    MULTIPLIER_3 = 0x45C82BE5  # = a^3 mod 2^32
    INCREMENT_3 = 0xD2F65B55  # = c*(1 + a + a^2) mod 2^32

    def __init__(self, seed):
        self.seed = seed & MASK32

    def next(self):
        s0 = self.seed
        s1 = (s0 * 0x000343FD + 0x00269EC3) & MASK32
        s2 = (s0 * 0xA9FC6809 + 0x1E278E7A) & MASK32
        s3 = (s0 * 0x45C82BE5 + 0xD2F65B55) & MASK32
        self.seed = s3
        v1 = (s1 & 0x7FFFFFFF) >> 16
        v2 = (s2 & 0x7FFFFFFF) >> 16
        v3 = (s3 & 0x7FFFFFFF) >> 16
        return (v3 | (v2 << 15) | (v1 << 30)) & MASK32


# Port of src/generator/mersenne.ts (MT19937 with pure-rand's incremental
# twist: each next tempers the current word then twists one word forward).
class MersenneTwister:
    __slots__ = ("states", "index")

    N = 624
    M = 397
    A = 0x9908B0DF
    F = 1812433253

    def __init__(self, seed):
        n = self.N
        states = [0] * n
        states[0] = seed & MASK32
        for idx in range(1, n):
            xored = states[idx - 1] ^ (states[idx - 1] >> 30)
            states[idx] = (1812433253 * xored + idx) & MASK32
        self.states = states
        self.index = 0
        for idx in range(n):
            self._twisted_next(idx)

    def _twisted_next(self, idx):
        mt = self.states
        next_idx = 0 if idx == 623 else idx + 1
        y = (mt[idx] & 0x80000000) | (mt[next_idx] & 0x7FFFFFFF)
        twisted_idx = idx + 397 if idx < 227 else idx - 227
        mt[idx] = mt[twisted_idx] ^ (y >> 1) ^ (0x9908B0DF if y & 1 else 0)
        return next_idx

    def next(self):
        idx = self.index
        y = self.states[idx]
        y ^= y >> 11
        y ^= (y << 7) & 0x9D2C5680
        y ^= (y << 15) & 0xEFC60000
        y ^= y >> 18
        self.index = self._twisted_next(idx)
        return y & MASK32


GENERATORS = {
    "xorshift128plus": XorShift128Plus,
    "xoroshiro128plus": XoroShiro128Plus,
    "congruential32": LinearCongruential32,
    "mersenne": MersenneTwister,
}


def seed_at(i):
    # Same seed derivation as the other benches: Knuth multiplicative hash of the index.
    return (i * 2654435761) & MASK32


def run(make_generator, num_seeds, per_seed):
    checksum = 0
    for i in range(num_seeds):
        rng = make_generator(seed_at(i))
        rng_next = rng.next
        for _ in range(per_seed):
            checksum += rng_next()
    return checksum & MASK32


def main():
    name = sys.argv[1] if len(sys.argv) > 1 else "xorshift128plus"
    make_generator = GENERATORS.get(name)
    if make_generator is None:
        print(f"Unknown generator '{name}': expected {', '.join(GENERATORS)}", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) > 2 and sys.argv[2] == "verify":
        for seed in (0, 42, -1, 123456789, -987654321):
            rng = make_generator(seed)
            values = ",".join(str(to_signed32(rng.next())) for _ in range(10))
            print(f"seed={seed} -> {values}")
        return

    num_seeds = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
    per_seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
    reps = int(sys.argv[4]) if len(sys.argv) > 4 else 7

    checksum = run(make_generator, num_seeds, per_seed)  # warmup + correctness output
    print(f"python {name} | seeds={num_seeds} per_seed={per_seed} checksum={checksum}")

    timings_ms = []
    for _ in range(reps):
        start = time.perf_counter_ns()
        run(make_generator, num_seeds, per_seed)
        timings_ms.append((time.perf_counter_ns() - start) / 1e6)
    timings_ms.sort()
    best = timings_ms[0]
    median = timings_ms[len(timings_ms) // 2]
    total = num_seeds * per_seed
    print(
        f"best: {best:.2f} ms | median: {median:.2f} ms | "
        f"{best * 1e6 / total:.3f} ns/number | {total / (best / 1e3):.0f} numbers/sec | "
        f"{best * 1e3 / num_seeds:.3f} µs per {per_seed}-number sequence"
    )


if __name__ == "__main__":
    main()
