var prand = require('../../lib/pure-rand');

// mersenne

var seed = 42;
var gMersenne = prand.mersenne(seed);
for (var idx = 0; idx !== 1000; ++idx) gMersenne = gMersenne.next()[1]; // 1k loops to force a twist call
// gMersenne = gMersenne.jump(); // not implemented

// congruential32

var gc = prand.congruential32(seed);
gc = gc.next()[1];
gc = gc.next()[1];
gc = gc.jump();

// xorshift128plus

var gXor = prand.xorshift128plus(seed);
gXor = gXor.next()[1];
gXor = gXor.next()[1];
gXor = gXor.jump();

// xoroshiro128plus

var gXoro = prand.xoroshiro128plus(seed);
gXoro = gXoro.next()[1];
gXoro = gXoro.next()[1];
gXoro = gXoro.jump();

// uniform distribution

gc = prand.uniformIntDistribution(0, 9)(gc)[1];
gc = prand.uniformIntDistribution(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)(gc)[1];

// uniform distribution via array int

var from = { sign: -1, data: [5, 21] };
var to = { sign: 1, data: [999, 999] };
gc = prand.uniformArrayIntDistribution(from, to)(gc)[1];
