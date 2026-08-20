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
using System.Runtime.CompilerServices;

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

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
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

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
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
// Computes two outputs per state advance using composed LCG constants
// (A_n = a^n mod 2^32, C_n = c*(1+a+..+a^(n-1))): all six intermediate steps
// are independent multiplies off one base state, and the serial chain moves
// by a^6 in a single multiply-add. Outputs are identical to the one-step
// form; the second output of each pair is buffered.
struct LinearCongruential32 : IGen<LinearCongruential32>
{
    private const int A1 = 0x000343fd;
    private const int C1 = 0x00269ec3;
    private const int A2 = unchecked((int)0xa9fc6809);
    private const int C2 = 0x1e278e7a;
    private const int A3 = 0x45c82be5;
    private const int C3 = unchecked((int)0xd2f65b55);
    private const int A4 = unchecked((int)0xddff5051);
    private const int C4 = 0x098520c4;
    private const int A5 = 0x284a930d;
    private const int C5 = unchecked((int)0xa2974c77);
    private const int A6 = 0x0f56bad9;
    private const int C6 = 0x2e15555e;

    private int seed;
    private int buffered;
    private bool hasBuffered;

    public static LinearCongruential32 Create(int seed) => new LinearCongruential32 { seed = seed };

    // (s & 0x7fffffff) >> 16 == (s << 1) >>> 17: drop the sign bit, keep
    // bits 16..30 — short shift immediates instead of 4-byte masks (this
    // loop is decode-bound, not ALU-bound).
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static int Output(int s1, int s2, int s3)
    {
        int v1 = (int)((uint)(s1 << 1) >> 17);
        int v2 = (int)((uint)(s2 << 1) >> 17);
        int v3 = (int)((uint)(s3 << 1) >> 17);
        return v3 | (v2 << 15) | (v1 << 30);
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public int Next()
    {
        if (hasBuffered)
        {
            hasBuffered = false;
            return buffered;
        }
        int s0 = seed;
        int t1 = s0 * A1 + C1;
        int t2 = s0 * A2 + C2;
        int t3 = s0 * A3 + C3;
        int t4 = s0 * A4 + C4;
        int t5 = s0 * A5 + C5;
        int t6 = s0 * A6 + C6;
        seed = t6;
        buffered = Output(t4, t5, t6);
        hasBuffered = true;
        return Output(t1, t2, t3);
    }
}

// Port of src/generator/mersenne.ts (MT19937). Emits the exact same sequence,
// but refills lazily — when the read index wraps, it twists the whole
// 624-word block and tempers every word into an output buffer, both in
// explicit Vector<uint> SIMD loops — instead of one twist per Next like the
// JS version. Next is then a plain buffer read; the tempered outputs are
// identical either way.
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
    private uint[] tempered;
    private int index;

    public static MersenneTwister Create(int seed)
    {
        var states = new uint[N];
        uint prev = (uint)seed;
        states[0] = prev;
        for (int idx = 1; idx < N; ++idx)
        {
            uint xored = prev ^ (prev >> 30);
            prev = F * xored + (uint)idx;
            states[idx] = prev;
        }
        TwistBlock(states);
        var tempered = new uint[N];
        TemperBlock(states, tempered);
        return new MersenneTwister { states = states, tempered = tempered, index = 0 };
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static uint TwistWord(uint current, uint next, uint far)
    {
        uint y = (current & MaskUpper) | (next & MaskLower);
        return far ^ (y >> 1) ^ ((uint)-(int)(y & 1) & A);
    }

    // Vectorized twist of mt[from..to) with the "far" word at idx+farOff.
    // Safe to vectorize: within a vector step the loads (idx+1, idx+farOff)
    // happen before the store to idx, and across steps the store range never
    // overtakes a load range (farOff is +M ahead, or M-N = -227 behind, both
    // beyond the vector length).
    private static void TwistRange(uint[] mt, int from, int to, int farOff)
    {
        var vA = new Vector<uint>(A);
        var vUpper = new Vector<uint>(MaskUpper);
        var vLower = new Vector<uint>(MaskLower);
        var vOne = new Vector<uint>(1u);
        int w = Vector<uint>.Count;
        int idx = from;
        for (; idx <= to - w; idx += w)
        {
            var cur = new Vector<uint>(mt, idx);
            var nxt = new Vector<uint>(mt, idx + 1);
            var far = new Vector<uint>(mt, idx + farOff);
            var y = (cur & vUpper) | (nxt & vLower);
            var odd = Vector.Equals(y & vOne, vOne) & vA;
            ((far ^ (y >>> 1)) ^ odd).CopyTo(mt, idx);
        }
        for (; idx < to; ++idx)
        {
            mt[idx] = TwistWord(mt[idx], mt[idx + 1], mt[idx + farOff]);
        }
    }

    private static void TwistBlock(uint[] mt)
    {
        TwistRange(mt, 0, N - M, M);
        TwistRange(mt, N - M, N - 1, M - N);
        mt[N - 1] = TwistWord(mt[N - 1], mt[0], mt[M - 1]);
    }

    private static void TemperBlock(uint[] mt, uint[] outBuf)
    {
        var vB = new Vector<uint>(B);
        var vC = new Vector<uint>(C);
        int w = Vector<uint>.Count;
        int idx = 0;
        for (; idx <= N - w; idx += w)
        {
            var y = new Vector<uint>(mt, idx);
            y ^= y >>> 11;
            y ^= (y << 7) & vB;
            y ^= (y << 15) & vC;
            y ^= y >>> 18;
            y.CopyTo(outBuf, idx);
        }
        for (; idx < N; ++idx)
        {
            uint y = mt[idx];
            y ^= y >> 11;
            y ^= (y << 7) & B;
            y ^= (y << 15) & C;
            y ^= y >> 18;
            outBuf[idx] = y;
        }
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    public int Next()
    {
        if (index == N)
        {
            TwistBlock(states);
            TemperBlock(states, tempered);
            index = 0;
        }
        return (int)tempered[index++];
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
