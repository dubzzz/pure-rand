import { describe, bench } from 'vitest';
import { congruential32, congruential32FromState } from './congruential32';

describe('congruential32', () => {
  describe('next', () => {
    const rng = congruential32(0);
    bench('next', () => {
      rng.next();
    });
  });

  describe('1000x next', () => {
    const rng = congruential32(0);
    bench('1000x next', () => {
      for (let i = 0; i !== 1000; ++i) {
        rng.next();
      }
    });
  });

  describe('10000x next', () => {
    const rng = congruential32(0);
    bench('10000x next', () => {
      for (let i = 0; i !== 10000; ++i) {
        rng.next();
      }
    });
  });

  describe('jump', () => {
    const rng = congruential32(0);
    bench('jump', () => {
      rng.jump();
    });
  });

  describe('init', () => {
    let seed = 0;
    bench(
      'init',
      () => {
        congruential32(seed);
      },
      {
        setup: () => {
          seed = (seed + 1) | 0;
        },
      },
    );
  });

  describe('clone', () => {
    const rng = congruential32(0);
    bench('clone', () => {
      rng.clone();
    });
  });

  describe('getState', () => {
    const rng = congruential32(0);
    bench('getState', () => {
      rng.getState();
    });
  });

  describe('fromState', () => {
    const state: readonly number[] = [12345];
    bench('fromState', () => {
      congruential32FromState(state);
    });
  });
});
