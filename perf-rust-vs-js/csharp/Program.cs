// C# side of the cross-language comparison of pure-rand's generators.
//
// Usage: bench <generator> [verify | <seeds> <perSeed> <reps>]
// with <generator> one of: xorshift128plus, xoroshiro128plus, congruential32, mersenne.
//
// Same workload as ../rust/src/main.rs and ../js/bench.cjs: for each seed,
// build a generator and produce `perSeed` numbers, folding every value into a
// uint32 checksum all sides must agree on. Generators are structs behind a
// generic constraint so the JIT monomorphizes the hot loop (no interface
// dispatch), matching the Rust setup; mersenne allocates its 624-word state
// per seed, like the JS and Java versions.

using System.Diagnostics;
using System.Numerics;

interface IGen<TSelf> where TSelf : IGen<TSelf>
{
    static abstract TSelf Create(int seed);
    int Next();
}

// Port of src/generator/xorshift128plus.ts (XorShift128+ with a=23, b=18, c=5).
struct XorShift128Plus : IGen<XorShift128Plus>
{
    private ulong s0;
    private ulong s1;

    // JS: new XorShift128Plus(-1, ~seed, seed | 0, 0)
    public static XorShift128Plus Create(int seed)
    {
        uint s = (uint)seed;
        return new XorShift128Plus { s0 = 0xffffffff00000000UL | ~s, s1 = (ulong)s << 32 };
    }

    public int Next()
    {
        ulong a = s0 ^ (s0 << 23);
        ulong t = s1;
        int output = (int)(uint)(s0 + t); // low 32 bits of s0+s1, like pure-rand
        s0 = t;
        s1 = a ^ t ^ (a >> 18) ^ (t >> 5);
        return output;
    }
}

// Port of src/generator/xoroshiro128plus.ts (XoroShiro128+ with a=24, b=16, c=37).
struct XoroShiro128Plus : IGen<XoroShiro128Plus>
{
    private ulong s0;
    private ulong s1;

    // JS: new XoroShiro128Plus(-1, ~seed, seed | 0, 0)
    public static XoroShiro128Plus Create(int seed)
    {
        uint s = (uint)seed;
        return new XoroShiro128Plus { s0 = 0xffffffff00000000UL | ~s, s1 = (ulong)s << 32 };
    }

    public int Next()
    {
        int output = (int)(uint)(s0 + s1);
        ulong a = s0 ^ s1;
        s0 = BitOperations.RotateLeft(s0, 24) ^ a ^ (a << 16);
        s1 = BitOperations.RotateLeft(a, 37);
        return output;
    }
}

// Port of src/generator/congruential32.ts: three LCG steps per Next,
// 15 usable bits taken from each, recombined into one 32-bit output.
struct LinearCongruential32 : IGen<LinearCongruential32>
{
    private const int Multiplier = 0x000343fd;
    private const int Increment = 0x00269ec3;
    // JS MASK_2 = -2147483649 goes through ToInt32 and becomes 0x7fffffff.
    private const int Mask2 = 0x7fffffff;
    private const int Multiplier2 = unchecked((int)0xa9fc6809); // = a^2 mod 2^32
    private const int Increment2 = 0x1e278e7a; // = c*(1 + a) mod 2^32
    private const int Multiplier3 = 0x45c82be5; // = a^3 mod 2^32
    private const int Increment3 = unchecked((int)0xd2f65b55); // = c*(1 + a + a^2) mod 2^32

    private int seed;

    public static LinearCongruential32 Create(int seed) => new LinearCongruential32 { seed = seed };

    public int Next()
    {
        int s0 = seed;
        int s1 = s0 * Multiplier + Increment;
        int s2 = s0 * Multiplier2 + Increment2;
        int s3 = s0 * Multiplier3 + Increment3;
        seed = s3;
        int v1 = (s1 & Mask2) >> 16;
        int v2 = (s2 & Mask2) >> 16;
        int v3 = (s3 & Mask2) >> 16;
        return v3 | (v2 << 15) | (v1 << 30);
    }
}

// Port of src/generator/mersenne.ts (MT19937 with pure-rand's incremental
// twist: each Next tempers the current word then twists one word forward).
struct MersenneTwister : IGen<MersenneTwister>
{
    private const int N = 624;
    private const int M = 397;
    private const uint A = 0x9908b0df;
    private const uint F = 1812433253;
    private const uint B = 0x9d2c5680;
    private const uint C = 0xefc60000;
    private const uint MaskLower = 0x7fffffff;
    private const uint MaskUpper = 0x80000000;

    private uint[] states;
    private int index;

    public static MersenneTwister Create(int seed)
    {
        var states = new uint[N];
        states[0] = (uint)seed;
        for (int idx = 1; idx != N; ++idx)
        {
            uint xored = states[idx - 1] ^ (states[idx - 1] >> 30);
            states[idx] = F * xored + (uint)idx;
        }
        for (int idx = 0; idx != N; ++idx)
        {
            TwistedNext(states, idx);
        }
        return new MersenneTwister { states = states, index = 0 };
    }

    private static int TwistedNext(uint[] mt, int idx)
    {
        int nextIdx = idx == N - 1 ? 0 : idx + 1;
        uint y = (mt[idx] & MaskUpper) | (mt[nextIdx] & MaskLower);
        int twistedIdx = idx < N - M ? idx + M : idx + M - N;
        mt[idx] = mt[twistedIdx] ^ (y >> 1) ^ ((uint)-(int)(y & 1) & A);
        return nextIdx;
    }

    public int Next()
    {
        uint y = states[index];
        y ^= y >> 11;
        y ^= (y << 7) & B;
        y ^= (y << 15) & C;
        y ^= y >> 18;
        index = TwistedNext(states, index);
        return (int)y;
    }
}

static class Program
{
    // Same seed derivation as the other benches: Knuth multiplicative hash of the index.
    private static int SeedAt(int i) => unchecked(i * (int)2654435761);

    private static uint Run<G>(int numSeeds, int perSeed) where G : struct, IGen<G>
    {
        uint checksum = 0;
        for (int i = 0; i < numSeeds; ++i)
        {
            G rng = G.Create(SeedAt(i));
            for (int j = 0; j < perSeed; ++j)
            {
                checksum += (uint)rng.Next();
            }
        }
        return checksum;
    }

    private static void Verify<G>() where G : struct, IGen<G>
    {
        foreach (int seed in new[] { 0, 42, -1, 123456789, -987654321 })
        {
            G rng = G.Create(seed);
            var values = new string[10];
            for (int i = 0; i != 10; ++i) values[i] = rng.Next().ToString();
            Console.WriteLine($"seed={seed} -> {string.Join(",", values)}");
        }
    }

    private static void Bench<G>(string name, string[] args) where G : struct, IGen<G>
    {
        if (args.Length > 1 && args[1] == "verify")
        {
            Verify<G>();
            return;
        }

        int numSeeds = args.Length > 1 ? int.Parse(args[1]) : 100000;
        int perSeed = args.Length > 2 ? int.Parse(args[2]) : 1000;
        int reps = args.Length > 3 ? int.Parse(args[3]) : 7;

        // Warmup so the JIT reaches steady state before we measure.
        uint sink = 0;
        for (int i = 0; i != 3; ++i) sink ^= Run<G>(numSeeds, perSeed);
        uint checksum = Run<G>(numSeeds, perSeed);
        Console.WriteLine($"csharp {name} | seeds={numSeeds} per_seed={perSeed} checksum={checksum}");

        var timingsMs = new double[reps];
        for (int r = 0; r != reps; ++r)
        {
            long start = Stopwatch.GetTimestamp();
            sink ^= Run<G>(numSeeds, perSeed);
            timingsMs[r] = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
        }
        if (sink == 123456) Console.WriteLine(); // keep `sink` alive
        Array.Sort(timingsMs);
        double best = timingsMs[0];
        double median = timingsMs[reps / 2];
        double total = (double)numSeeds * perSeed;
        Console.WriteLine(
            $"best: {best:F2} ms | median: {median:F2} ms | {best * 1e6 / total:F3} ns/number | "
                + $"{total / (best / 1e3):F0} numbers/sec | {best * 1e3 / numSeeds:F3} µs per {perSeed}-number sequence");
    }

    public static void Main(string[] args)
    {
        string name = args.Length > 0 ? args[0] : "xorshift128plus";
        switch (name)
        {
            case "xorshift128plus": Bench<XorShift128Plus>(name, args); break;
            case "xoroshiro128plus": Bench<XoroShiro128Plus>(name, args); break;
            case "congruential32": Bench<LinearCongruential32>(name, args); break;
            case "mersenne": Bench<MersenneTwister>(name, args); break;
            default:
                Console.Error.WriteLine($"Unknown generator '{name}'");
                Environment.Exit(1);
                break;
        }
    }
}
