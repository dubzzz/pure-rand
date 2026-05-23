import { describe, bench } from 'vitest';
import { xorshift128plus, xorshift128plusFromState } from './xorshift128plus';

describe('xorshift128plus', () => {
  // Single next() call
  {
    const rng = xorshift128plus(0);
    bench('next', () => {
      rng.next();
    });
  }

  // 1000x next loop
  {
    const rng = xorshift128plus(0);
    bench('1000x next', () => {
      for (let i = 0; i !== 1000; ++i) {
        rng.next();
      }
    });
  }

  // 10000x next loop
  {
    const rng = xorshift128plus(0);
    bench('10000x next', () => {
      for (let i = 0; i !== 10000; ++i) {
        rng.next();
      }
    });
  }

  // jump()
  {
    const rng = xorshift128plus(0);
    bench('jump', () => {
      rng.jump();
    });
  }

  // init(seed) fresh instance
  {
    let seed = 0;
    bench(
      'init',
      () => {
        xorshift128plus(seed);
      },
      {
        setup: () => {
          seed = (seed + 1) | 0;
        },
      },
    );
  }

  // clone()
  {
    const rng = xorshift128plus(0);
    bench('clone', () => {
      rng.clone();
    });
  }

  // getState()
  {
    const rng = xorshift128plus(0);
    bench('getState', () => {
      rng.getState();
    });
  }

  // fromState(state)
  {
    const state = xorshift128plus(0).getState();
    bench('fromState', () => {
      xorshift128plusFromState(state);
    });
  }

  // init + 5000 next (compare to generator.bench.ts)
  {
    let seed = 0;
    bench('init + 5000 next', () => {
      const rng = xorshift128plus(seed++);
      for (let i = 0; i !== 5000; ++i) {
        rng.next();
      }
    });
  }
});
