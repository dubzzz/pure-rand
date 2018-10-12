var prand = require('../../lib/pure-rand');

// mersenne

var seed = 42;
var gMersenne = prand.mersenne(seed);
for (var idx = 0; idx !== 1000; ++idx) gMersenne = gMersenne.next()[1]; // 1k loops to force a twist call

// congruential

var gc = prand.congruential(seed);
gc = gc.next()[1];
gc = gc.next()[1];

// congruential32

var gc32 = prand.congruential32(seed);
gc32 = gc32.next()[1];
gc32 = gc32.next()[1];

// uniform distribution

gc = prand.uniformIntDistribution(0, 9)(gc)[1];
gc = prand.uniformIntDistribution(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)(gc)[1];

prand.uniformIntDistribution(0, 9, gc);
