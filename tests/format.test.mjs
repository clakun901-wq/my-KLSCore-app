import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rp,pf,num,fmt,PCT,today} from '../js/format.js';
/* Differential: kode asli v9.19 (sebelum dipindah, dibekukan di fixtures) harus identik hasilnya dengan modul baru. */
const orig=new Function(fs.readFileSync(new URL('./fixtures/core.pre_v9_20.js.txt',import.meta.url),'utf8'))();
const inputs=['','abc','0','1','12','123','1.234','1.234.567','1,234','1,234,567','12,5','12.5','1.234,56','1,234.56','Rp 12.500,75','rp. 1.000','12.500,49','12.500,50','12.500,9','  7 ','-5','1e5','999999999999999','0,5','.5','5.','1.2.3','1,2,3','٣','10.00','10.000','100.000.000','65,5','6.5','0.075'];
let n=0;
for(const s of inputs)for(const pct of [false,true,undefined]){
  const a=orig.pf(s,pct),b=pf(s,pct);assert.ok(Object.is(a,b),`pf(${JSON.stringify(s)},${pct}): ${a} vs ${b}`);n++}
for(const s of inputs){assert.equal(num(s),orig.num(s),`num(${JSON.stringify(s)})`);n++}
assert.equal(rp(1234567.4),'Rp 1.234.567');assert.equal(rp(0),'Rp 0');n+=2;
assert.equal(fmt(6.5),'6,5');assert.equal(fmt('1.25'),'1,25');n+=2;
assert.equal(PCT.length,14);assert.ok(PCT.includes('pj')&&PCT.includes('gad'));n+=2;
assert.match(today(),/^\d{4}-\d{2}-\d{2}$/);n++;
const d=new Date();assert.equal(today(),d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));n++;
console.log(`Format module: ${n} assertions passed (differential vs kode v9.19 sebelum dipindah).`);
