import { describe, bench } from 'vitest';
import { mersenne, mersenneFromState } from './mersenne';

describe('mersenne detailed', () => {
  describe('next()', () => {
    const rng = mersenne(0);
    bench('single next', () => {
      rng.next();
    });
  });

  describe('1000x next()', () => {
    const rng = mersenne(0);
    bench('1000x next', () => {
      for (let i = 0; i !== 1000; ++i) {
        rng.next();
      }
    });
  });

  describe('10000x next()', () => {
    const rng = mersenne(0);
    bench('10000x next', () => {
      for (let i = 0; i !== 10000; ++i) {
        rng.next();
      }
    });
  });

  describe('jump()', () => {
    const rng = mersenne(0);
    bench('jump', () => {
      rng.jump();
    });
  });

  describe('init(seed)', () => {
    let seed = 0;
    bench(
      'init',
      () => {
        mersenne(seed);
      },
      {
        setup: () => {
          seed = (seed + 1) | 0;
        },
      },
    );
  });

  describe('clone()', () => {
    const rng = mersenne(0);
    bench('clone', () => {
      rng.clone();
    });
  });

  describe('getState()', () => {
    const rng = mersenne(0);
    bench('getState', () => {
      rng.getState();
    });
  });

  describe('fromState(state)', () => {
    const state = mersenne(0).getState();
    bench('fromState', () => {
      mersenneFromState(state);
    });
  });

  // Exercise the twist path (state advances to/across the 624-block boundary)
  describe('init + 700 next (twist runs)', () => {
    let seed = 0;
    bench(
      'init+700 next',
      () => {
        const rng = mersenne(seed);
        for (let i = 0; i !== 700; ++i) rng.next();
      },
      {
        setup: () => {
          seed = (seed + 1) | 0;
        },
      },
    );
  });
});
