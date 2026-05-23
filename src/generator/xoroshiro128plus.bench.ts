import { describe, bench } from 'vitest';
import { xoroshiro128plus, xoroshiro128plusFromState } from './xoroshiro128plus';

describe('xoroshiro128plus', () => {
  describe('next', () => {
    const rng = xoroshiro128plus(0);
    bench('single next()', () => {
      rng.next();
    });
  });

  describe('next loops', () => {
    const rng1k = xoroshiro128plus(0);
    bench('1000x next()', () => {
      for (let i = 0; i !== 1000; ++i) {
        rng1k.next();
      }
    });

    const rng10k = xoroshiro128plus(0);
    bench('10000x next()', () => {
      for (let i = 0; i !== 10000; ++i) {
        rng10k.next();
      }
    });
  });

  describe('jump', () => {
    const rng = xoroshiro128plus(0);
    bench('single jump()', () => {
      rng.jump();
    });
  });

  describe('init', () => {
    let seed = 0;
    bench(
      'xoroshiro128plus(seed) fresh instance',
      () => {
        xoroshiro128plus(seed);
      },
      {
        setup: () => {
          seed = (seed + 1) | 0;
        },
      },
    );
  });

  describe('clone', () => {
    const rng = xoroshiro128plus(42);
    bench('rng.clone()', () => {
      rng.clone();
    });
  });

  describe('getState', () => {
    const rng = xoroshiro128plus(42);
    bench('rng.getState()', () => {
      rng.getState();
    });
  });

  describe('fromState', () => {
    const rng = xoroshiro128plus(42);
    const state = rng.getState();
    bench('xoroshiro128plusFromState(state)', () => {
      xoroshiro128plusFromState(state);
    });
  });
});
