const fs = require('fs');
const ROUNDS = 6;
function load(variant){
  const arr=[];
  for(let r=1;r<=ROUNDS;r++){
    const p=`/tmp/results/${variant}_${r}.json`;
    if(fs.existsSync(p)) arr.push(JSON.parse(fs.readFileSync(p,'utf8')));
  }
  return arr;
}
const ref=load('ref'), pr=load('pr');
const keys=Object.keys(ref[0]);
function med(a){a=[...a].sort((x,y)=>x-y);const n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;}
function mean(a){return a.reduce((s,x)=>s+x,0)/a.length;}
const rows=[];
for(const k of keys){
  const rhz=ref.map(o=>o[k].hz), phz=pr.map(o=>o[k].hz);
  const rMed=med(rhz), pMed=med(phz);
  const delta=(pMed-rMed)/rMed*100;
  rows.push({k, rMed, pMed, delta, rhz, phz});
}
// print
console.log("n rounds: ref="+ref.length+" pr="+pr.length);
console.log("\n=== Median hz across rounds (ref vs pr) ===");
for(const row of rows){
  console.log(row.k);
  console.log("  ref median hz: "+row.rMed.toLocaleString(undefined,{maximumFractionDigits:0})+"  | pr median hz: "+row.pMed.toLocaleString(undefined,{maximumFractionDigits:0})+"  | Δ "+(row.delta>=0?'+':'')+row.delta.toFixed(1)+"%");
  console.log("  ref runs: "+row.rhz.map(x=>Math.round(x)).join(", "));
  console.log("  pr  runs: "+row.phz.map(x=>Math.round(x)).join(", "));
}
fs.writeFileSync('/tmp/results/summary.json', JSON.stringify(rows,null,2));
