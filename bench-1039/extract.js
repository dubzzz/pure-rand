const fs = require('fs');
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = {};
for (const f of j.files) for (const g of f.groups) {
  for (const b of g.benchmarks) {
    const key = g.fullName.replace(/.*\.bench\.ts > /, '') + ' > ' + b.name;
    out[key] = { hz: b.hz, median: b.median };
  }
}
process.stdout.write(JSON.stringify(out));
