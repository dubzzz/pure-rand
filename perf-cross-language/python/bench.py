# Python side of the cross-language comparison of pure-rand's generators.
#
# Usage: python3 bench.py <generator> [verify | <seeds> <per_seed> <reps>]
# with <generator> one of: xorshift128plus, xoroshiro128plus, congruential32, mersenne.
#
# Pure Python (CPython, no numpy/cffi): same workload as ../js/bench.cjs,
# ../rust/src/main.rs and ../java/Bench.java — for each seed, build a generator
# and produce `per_seed` numbers, folding every value into a uint32 checksum
# all languages must agree on. Python ints are arbitrary-precision, so 32/64-bit
# wraparound is emulated by masking; state is kept as unsigned and outputs are
# converted to signed int32 to match the other languages.

import sys
import time

MASK32 = 0xFFFFFFFF
MASK64 = 0xFFFFFFFFFFFFFFFF


def to_int32(x):
    return x - 0x100000000 if x & 0x80000000 else x


class XorShift128Plus:
    # Port of src/generator/xorshift128plus.ts (a=23, b=18, c=5).
    # JS: new XorShift128Plus(-1, ~seed, seed | 0, 0) -> s0 = 0xffffffff:~seed, s1 = seed:0.
    __slots__ = ("s0", "s1")

    def __init__(self, seed):
        seed &= MASK32
        self.s0 = 0xFFFFFFFF00000000 | (seed ^ MASK32)
        self.s1 = seed << 32

    def next(self):
        s0 = self.s0
        s1 = self.s1
        a = (s0 ^ (s0 << 23)) & MASK64
        out = (s0 + s1) & MASK32
        self.s0 = s1
        self.s1 = a ^ s1 ^ (a >> 18) ^ (s1 >> 5)
        return out


class XoroShiro128Plus:
    # Port of src/generator/xoroshiro128plus.ts (a=24, b=16, c=37).
    __slots__ = ("s0", "s1")

    def __init__(self, seed):
        seed &= MASK32
        self.s0 = 0xFFFFFFFF00000000 | (seed ^ MASK32)
        self.s1 = seed << 32

    def next(self):
        s0 = self.s0
        s1 = self.s1
        out = (s0 + s1) & MASK32
        a = s0 ^ s1
        self.s0 = (((s0 << 24) | (s0 >> 40)) ^ a ^ (a << 16)) & MASK64
        self.s1 = ((a << 37) | (a >> 27)) & MASK64
        return out


class LinearCongruential32:
    # Port of src/generator/congruential32.ts: three LCG steps per next(),
    # 15 usable bits from each, recombined into one 32-bit output.
    __slots__ = ("seed",)

    MULTIPLIER = 0x000343FD
    INCREMENT = 0x00269EC3
    MASK_2 = 0x7FFFFFFF  # JS -2147483649 after ToInt32
    MULTIPLIER_2 = 0xA9FC6809  # a^2 mod 2^32
    INCREMENT_2 = 0x1E278E7A  # c*(1 + a) mod 2^32
    MULTIPLIER_3 = 0x45C82BE5  # a^3 mod 2^32
    INCREMENT_3 = 0xD2F65B55  # c*(1 + a + a^2) mod 2^32

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


class MersenneTwister:
    # Port of src/generator/mersenne.ts: MT19937 with pure-rand's incremental
    # twist — each next() tempers the current word then twists one word forward.
    __slots__ = ("states", "index")

    N = 624
    M = 397
    A = 0x9908B0DF
    F = 1812433253
    B = 0x9D2C5680
    C = 0xEFC60000
    MASK_LOWER = 0x7FFFFFFF
    MASK_UPPER = 0x80000000

    def __init__(self, seed):
        states = [0] * 624
        states[0] = seed & MASK32
        for idx in range(1, 624):
            xored = states[idx - 1] ^ (states[idx - 1] >> 30)
            states[idx] = (1812433253 * xored + idx) & MASK32
        self.states = states
        for idx in range(624):
            self._twisted_next(idx)
        self.index = 0

    def _twisted_next(self, idx):
        states = self.states
        next_idx = 0 if idx == 623 else idx + 1
        y = (states[idx] & 0x80000000) | (states[next_idx] & 0x7FFFFFFF)
        twisted_idx = idx + 397 if idx < 227 else idx - 227
        states[idx] = states[twisted_idx] ^ (y >> 1) ^ (0x9908B0DF if y & 1 else 0)
        return next_idx

    def next(self):
        y = self.states[self.index]
        y ^= y >> 11
        y ^= (y << 7) & 0x9D2C5680
        y ^= (y << 15) & 0xEFC60000
        y &= MASK32
        y ^= y >> 18
        self.index = self._twisted_next(self.index)
        return y


GENERATORS = {
    "xorshift128plus": XorShift128Plus,
    "xoroshiro128plus": XoroShiro128Plus,
    "congruential32": LinearCongruential32,
    "mersenne": MersenneTwister,
}


def seed_at(i):
    # Same seed derivation as the other benches: Math.imul(i, 2654435761) | 0,
    # kept as uint32 (the generators only look at the low 32 bits anyway).
    return (i * 2654435761) & MASK32


def run(make_generator, num_seeds, per_seed):
    checksum = 0
    per_seed_range = range(per_seed)
    for i in range(num_seeds):
        rng = make_generator(seed_at(i))
        nxt = rng.next
        for _ in per_seed_range:
            checksum += nxt()
    return checksum & MASK32


def main():
    name = sys.argv[1] if len(sys.argv) > 1 else "xorshift128plus"
    make_generator = GENERATORS.get(name)
    if make_generator is None:
        print(
            f"Unknown generator '{name}': expected {', '.join(GENERATORS)}",
            file=sys.stderr,
        )
        sys.exit(1)

    if len(sys.argv) > 2 and sys.argv[2] == "verify":
        for seed in [0, 42, -1, 123456789, -987654321]:
            rng = make_generator(seed)
            values = ",".join(str(to_int32(rng.next())) for _ in range(10))
            print(f"seed={seed} -> {values}")
        return

    num_seeds = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
    per_seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
    reps = int(sys.argv[4]) if len(sys.argv) > 4 else 7

    checksum = run(make_generator, num_seeds, per_seed)  # warmup + correctness output
    print(f"python {name} | seeds={num_seeds} per_seed={per_seed} checksum={checksum}")

    timings_ms = []
    for _ in range(reps):
        start = time.perf_counter()
        run(make_generator, num_seeds, per_seed)
        timings_ms.append((time.perf_counter() - start) * 1e3)
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
