import fc from 'fast-check';

fc.configureGlobal({ interruptAfterTimeLimit: 4000 }); // default test timeout being 5s
