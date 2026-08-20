// Java side of the cross-language comparison of pure-rand's generators.
//
// Usage: java Bench <generator> [verify | <seeds> <perSeed> <reps>]
// with <generator> one of: xorshift128plus, xoroshiro128plus, congruential32, mersenne.
//
// Same workload as ../rust/src/main.rs and ../js/bench.cjs: for each seed,
// build a generator and produce `perSeed` numbers, folding every value into a
// uint32 checksum all sides must agree on. The 128-bit generators use one
// `long` per 64-bit state word (the JS versions split them into int32 halves);
// mersenne allocates its 624-word state per seed, like the JS version.

import jdk.incubator.vector.IntVector;
import jdk.incubator.vector.VectorOperators;
import jdk.incubator.vector.VectorSpecies;

public final class Bench {
  interface Generator {
    int next();
  }

  // Port of src/generator/xorshift128plus.ts (XorShift128+ with a=23, b=18, c=5).
  static final class XorShift128Plus implements Generator {
    private long s0;
    private long s1;

    XorShift128Plus(int seed) {
      // JS: new XorShift128Plus(-1, ~seed, seed | 0, 0)
      this.s0 = 0xffffffff00000000L | (~seed & 0xffffffffL);
      this.s1 = (seed & 0xffffffffL) << 32;
    }

    public int next() {
      final long a = s0 ^ (s0 << 23);
      final long s1 = this.s1;
      final int out = (int) (s0 + s1); // low 32 bits of s0+s1, like pure-rand
      this.s0 = s1;
      this.s1 = a ^ s1 ^ (a >>> 18) ^ (s1 >>> 5);
      return out;
    }
  }

  // Port of src/generator/xoroshiro128plus.ts (XoroShiro128+ with a=24, b=16, c=37).
  static final class XoroShiro128Plus implements Generator {
    private long s0;
    private long s1;

    XoroShiro128Plus(int seed) {
      // JS: new XoroShiro128Plus(-1, ~seed, seed | 0, 0)
      this.s0 = 0xffffffff00000000L | (~seed & 0xffffffffL);
      this.s1 = (seed & 0xffffffffL) << 32;
    }

    public int next() {
      final int out = (int) (s0 + s1);
      final long a = s0 ^ s1;
      this.s0 = Long.rotateLeft(s0, 24) ^ a ^ (a << 16);
      this.s1 = Long.rotateLeft(a, 37);
      return out;
    }
  }

  // Port of src/generator/congruential32.ts: three LCG steps per next,
  // 15 usable bits taken from each, recombined into one 32-bit output.
  static final class LinearCongruential32 implements Generator {
    private static final int MULTIPLIER = 0x000343fd;
    private static final int INCREMENT = 0x00269ec3;
    // JS MASK_2 = -2147483649 goes through ToInt32 and becomes 0x7fffffff.
    private static final int MASK_2 = 0x7fffffff;
    private static final int MULTIPLIER_2 = 0xa9fc6809; // = a^2 mod 2^32
    private static final int INCREMENT_2 = 0x1e278e7a; // = c*(1 + a) mod 2^32
    private static final int MULTIPLIER_3 = 0x45c82be5; // = a^3 mod 2^32
    private static final int INCREMENT_3 = 0xd2f65b55; // = c*(1 + a + a^2) mod 2^32

    private int seed;

    LinearCongruential32(int seed) {
      this.seed = seed;
    }

    public int next() {
      final int s0 = this.seed;
      final int s1 = s0 * MULTIPLIER + INCREMENT;
      final int s2 = s0 * MULTIPLIER_2 + INCREMENT_2;
      final int s3 = s0 * MULTIPLIER_3 + INCREMENT_3;
      this.seed = s3;
      // (s & 0x7fffffff) >> 16 == (s << 1) >>> 17: drop the sign bit, keep
      // bits 16..30 — shorter encodings than 4-byte mask immediates.
      final int v1 = (s1 << 1) >>> 17;
      final int v2 = (s2 << 1) >>> 17;
      final int v3 = (s3 << 1) >>> 17;
      return v3 | (v2 << 15) | (v1 << 30);
    }
  }

  // Port of src/generator/mersenne.ts (MT19937). Emits the exact same
  // sequence, but refills lazily — when the read index wraps, it twists the
  // whole 624-word block in three tight loops and tempers every word into an
  // output buffer (both vectorizable) — instead of one twist per next() like
  // the JS version. next() is then a plain buffer read; the tempered outputs
  // are identical either way.
  static final class MersenneTwister implements Generator {
    private static final int N = 624;
    private static final int M = 397;
    private static final int A = 0x9908b0df;
    private static final int F = 1812433253;
    private static final int B = 0x9d2c5680;
    private static final int C = 0xefc60000;
    private static final int MASK_LOWER = 0x7fffffff;
    private static final int MASK_UPPER = 0x80000000;

    private final int[] states;
    private final int[] tempered;
    private int index;

    MersenneTwister(int seed) {
      final int[] states = new int[N];
      int prev = seed;
      states[0] = prev;
      for (int idx = 1; idx < N; ++idx) {
        final int xored = prev ^ (prev >>> 30);
        prev = F * xored + idx;
        states[idx] = prev;
      }
      twistBlock(states);
      this.states = states;
      this.tempered = new int[N];
      temperBlock(states, this.tempered);
      this.index = 0;
    }

    private static final VectorSpecies<Integer> SP = IntVector.SPECIES_PREFERRED;

    private static int twistWord(int current, int next, int far) {
      final int y = (current & MASK_UPPER) | (next & MASK_LOWER);
      return far ^ (y >>> 1) ^ (-(y & 1) & A);
    }

    // Vectorized twist of mt[from..to) with the "far" word at idx+farOff.
    // Safe to vectorize: within a vector step the loads (idx+1, idx+farOff)
    // happen before the store to idx, and across steps the store range never
    // overtakes a load range (farOff is +M ahead, or M-N = -227 behind, both
    // beyond the vector length).
    private static void twistRange(int[] mt, int from, int to, int farOff) {
      int idx = from;
      for (int upper = from + SP.loopBound(to - from); idx < upper; idx += SP.length()) {
        final IntVector cur = IntVector.fromArray(SP, mt, idx);
        final IntVector nxt = IntVector.fromArray(SP, mt, idx + 1);
        final IntVector far = IntVector.fromArray(SP, mt, idx + farOff);
        final IntVector y = cur.and(MASK_UPPER).or(nxt.and(MASK_LOWER));
        far.lanewise(VectorOperators.XOR, y.lanewise(VectorOperators.LSHR, 1))
            .lanewise(VectorOperators.XOR, y.and(1).lanewise(VectorOperators.NEG).and(A))
            .intoArray(mt, idx);
      }
      for (; idx < to; ++idx) {
        mt[idx] = twistWord(mt[idx], mt[idx + 1], mt[idx + farOff]);
      }
    }

    private static void twistBlock(int[] mt) {
      twistRange(mt, 0, N - M, M);
      twistRange(mt, N - M, N - 1, M - N);
      mt[N - 1] = twistWord(mt[N - 1], mt[0], mt[M - 1]);
    }

    private static void temperBlock(int[] mt, int[] out) {
      int idx = 0;
      for (int upper = SP.loopBound(N); idx < upper; idx += SP.length()) {
        IntVector y = IntVector.fromArray(SP, mt, idx);
        y = y.lanewise(VectorOperators.XOR, y.lanewise(VectorOperators.LSHR, 11));
        y = y.lanewise(VectorOperators.XOR, y.lanewise(VectorOperators.LSHL, 7).and(B));
        y = y.lanewise(VectorOperators.XOR, y.lanewise(VectorOperators.LSHL, 15).and(C));
        y = y.lanewise(VectorOperators.XOR, y.lanewise(VectorOperators.LSHR, 18));
        y.intoArray(out, idx);
      }
      for (; idx < N; ++idx) {
        int y = mt[idx];
        y ^= y >>> 11;
        y ^= (y << 7) & B;
        y ^= (y << 15) & C;
        y ^= y >>> 18;
        out[idx] = y;
      }
    }

    public int next() {
      if (index == N) {
        twistBlock(states);
        temperBlock(states, tempered);
        index = 0;
      }
      return tempered[index++];
    }
  }

  interface Factory {
    Generator create(int seed);
  }

  // Same seed derivation as the other benches: Knuth multiplicative hash of the index.
  private static int seedAt(int i) {
    return i * (int) 2654435761L;
  }

  private static int run(Factory factory, int numSeeds, int perSeed) {
    int checksum = 0;
    for (int i = 0; i < numSeeds; ++i) {
      final Generator rng = factory.create(seedAt(i));
      for (int j = 0; j < perSeed; ++j) {
        checksum += rng.next();
      }
    }
    return checksum;
  }

  public static void main(String[] args) {
    final String name = args.length > 0 ? args[0] : "xorshift128plus";
    final Factory factory =
        switch (name) {
          case "xorshift128plus" -> XorShift128Plus::new;
          case "xoroshiro128plus" -> XoroShiro128Plus::new;
          case "congruential32" -> LinearCongruential32::new;
          case "mersenne" -> MersenneTwister::new;
          default -> {
            System.err.println("Unknown generator '" + name + "'");
            System.exit(1);
            yield null;
          }
        };

    if (args.length > 1 && args[1].equals("verify")) {
      for (final int seed : new int[] {0, 42, -1, 123456789, -987654321}) {
        final Generator rng = factory.create(seed);
        final StringBuilder values = new StringBuilder();
        for (int i = 0; i != 10; ++i) {
          if (i != 0) values.append(',');
          values.append(rng.next());
        }
        System.out.println("seed=" + seed + " -> " + values);
      }
      return;
    }

    final int numSeeds = args.length > 1 ? Integer.parseInt(args[1]) : 100000;
    final int perSeed = args.length > 2 ? Integer.parseInt(args[2]) : 1000;
    final int reps = args.length > 3 ? Integer.parseInt(args[3]) : 7;

    // Warmup so the JIT reaches steady state before we measure.
    int sink = 0;
    for (int i = 0; i != 3; ++i) sink ^= run(factory, numSeeds, perSeed);
    final int checksum = run(factory, numSeeds, perSeed);
    System.out.println(
        "java "
            + name
            + " | seeds="
            + numSeeds
            + " per_seed="
            + perSeed
            + " checksum="
            + Integer.toUnsignedString(checksum));

    final double[] timingsMs = new double[reps];
    for (int r = 0; r != reps; ++r) {
      final long start = System.nanoTime();
      sink ^= run(factory, numSeeds, perSeed);
      timingsMs[r] = (System.nanoTime() - start) / 1e6;
    }
    if (sink == 123456) System.out.println(); // keep `sink` alive
    java.util.Arrays.sort(timingsMs);
    final double best = timingsMs[0];
    final double median = timingsMs[reps / 2];
    final double total = (double) numSeeds * perSeed;
    System.out.printf(
        "best: %.2f ms | median: %.2f ms | %.3f ns/number | %.0f numbers/sec | %.3f µs per %d-number sequence%n",
        best, median, best * 1e6 / total, total / (best / 1e3), best * 1e3 / numSeeds, perSeed);
  }
}
