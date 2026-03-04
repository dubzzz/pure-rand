# Comparison

## Summary

The chart has been split into three sections:

- section 1: native `Math.random()`
- section 2: without uniform distribution of values
- section 3: with uniform distribution of values (not supported by all libraries)

<img src="https://raw.githubusercontent.com/dubzzz/pure-rand/main/assets/comparison.svg" alt="Comparison against other libraries" />

## Process

In order to compare the performance of the libraries, we asked them to shuffle an array containing 1,000,000 items (see [code](https://github.com/dubzzz/pure-rand/blob/556ec331c68091c5d56e9da1266112e8ea222b2e/perf/compare.cjs)).

We then split the measurements into two sections:

- one for non-uniform distributions — _known to be slower as it implies re-asking for other values to the PRNG until the produced value fall into the acceptable range of values_
- one for uniform distributions

The recommended setup for pure-rand is to rely on our Xoroshiro128+. It provides a long enough sequence of random values, has built-in support for jump, is really efficient while providing a very good quality of randomness.

## Performance

**Non-Uniform**

| Library                  | Algorithm         | Mean time (ms) | Compared to pure-rand |
| ------------------------ | ----------------- | -------------- | --------------------- |
| native \(node 16.19.1\)  | Xorshift128+      | 33.3           | 1.4x slower           |
| **pure-rand _@6.0.0_**   | **Xoroshiro128+** | **24.5**       | **reference**         |
| pure-rand _@6.0.0_       | Xorshift128+      | 25.0           | similar               |
| pure-rand _@6.0.0_       | Mersenne Twister  | 30.8           | 1.3x slower           |
| pure-rand _@6.0.0_       | Congruential‍     | 22.6           | 1.1x faster           |
| seedrandom _@3.0.5_      | Alea              | 28.1           | 1.1x slower           |
| seedrandom _@3.0.5_      | Xorshift128       | 28.8           | 1.2x slower           |
| seedrandom _@3.0.5_      | Tyche-i           | 28.6           | 1.2x slower           |
| seedrandom _@3.0.5_      | Xorwow            | 32.0           | 1.3x slower           |
| seedrandom _@3.0.5_      | Xor4096           | 32.2           | 1.3x slower           |
| seedrandom _@3.0.5_      | Xorshift7         | 33.5           | 1.4x slower           |
| @faker-js/faker _@7.6.0_ | Mersenne Twister  | 109.1          | 4.5x slower           |
| chance _@1.1.10_         | Mersenne Twister  | 142.9          | 5.8x slower           |

**Uniform**

| Library                | Algorithm         | Mean time (ms) | Compared to pure-rand |
| ---------------------- | ----------------- | -------------- | --------------------- |
| **pure-rand _@6.0.0_** | **Xoroshiro128+** | **53.5**       | **reference**         |
| pure-rand _@6.0.0_     | Xorshift128+      | 52.2           | similar               |
| pure-rand _@6.0.0_     | Mersenne Twister  | 61.6           | 1.2x slower           |
| pure-rand _@6.0.0_     | Congruential‍     | 57.6           | 1.1x slower           |
| random-js @2.1.0       | Mersenne Twister  | 119.6          | 2.2x slower           |

> System details:
>
> - OS: Linux 5.15 Ubuntu 22.04.2 LTS 22.04.2 LTS (Jammy Jellyfish)
> - CPU: (2) x64 Intel(R) Xeon(R) Platinum 8272CL CPU @ 2.60GHz
> - Memory: 5.88 GB / 6.78 GB
> - Container: Yes
> - Node: 16.19.1 - /opt/hostedtoolcache/node/16.19.1/x64/bin/node
>
> _Executed on default runners provided by GitHub Actions_
