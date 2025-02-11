var prand = require('../../lib/pure-rand');

// mersenne

var seed = 42;
var gMersenne = prand.mersenne(seed);
for (var idx = 0; idx !== 1000; ++idx) gMersenne = gMersenne.next()[1]; // 1k loops to force a twist call

// congruential32

var gc = prand.congruential32(seed);
gc = gc.next()[1];
gc = gc.next()[1];

// xorshift128plus

var gXor = prand.xorshift128plus(seed);
gXor = gXor.next()[1];
gXor = gXor.next()[1];

// xoroshiro128plus

var gXoro = prand.xoroshiro128plus(seed);
gXoro = gXoro.next()[1];
gXoro = gXoro.next()[1];

// uniform distribution

gc = prand.uniformIntDistribution(0, 9)(gc)[1];
gc = prand.uniformIntDistribution(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)(gc)[1];

prand.uniformIntDistribution(0, 9, gc);
