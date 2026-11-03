import fs from 'node:fs';
import assert from 'node:assert/strict';
const originalNames=JSON.parse(fs.readFileSync(new URL('./legacy-functions.json',import.meta.url),'utf8'));
import {readLegacySource} from './helpers/legacy-source.mjs';
const app=readLegacySource();
const worker=fs.readFileSync(new URL('../workers/compute.worker.js',import.meta.url),'utf8');
const theme=fs.readFileSync(new URL('../js/theme.js',import.meta.url),'utf8');
const combined=app+'\n'+theme+'\n'+worker;
for(const name of originalNames) assert.match(combined,new RegExp('function\\s+'+name+'\\s*\\('),'original function '+name+' remains in app or Worker');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const tabs=[...html.matchAll(/<button[^>]+id="(t[0-9])"/g)].map(m=>m[1]);
assert.deepEqual(tabs,['t0','t1','t3','t4','t5','t6','t2']);

// Core price path must use exact gross-up and checked integer sums for money boundaries.
assert.match(app,/KalsaraMoney\.grossUpDiscount\(L,R\.dv\)/);
assert.match(app,/safeMoneySum\(\[P,-f\.sh,-f\.pm,-f\.tax,-f\.ads,-f\.rt,-A\.og\]\)/);
assert.doesNotMatch(app,/L2>L\+1e-9/);
assert.match(app,/function calcSync\(r\)/,'synchronous compatibility calculation remains as the safe first-paint fallback');
assert.match(app,/function rkey\(r\)/,'hasil kalkulator berkunci isi (versi global + field produk)');
assert.match(app,/gver\(\)!==gv/,'balasan Worker yang usang (setelan berubah) dibuang');
assert.match(app,/compute\('calculate-batch',\{settings:A,promos:PRM/,'produk usang dihitung sekaligus di Worker (satu kiriman)');
assert.doesNotMatch(app,/products:rows\.map\(strip\)/,'tidak boleh lagi mengirim seluruh daftar produk per produk (O(n^2))');
assert.match(app,/function calc\(r\)[\s\S]*CC\.get\(k\)/,'tampilan memakai hasil cache; produk yang meleset dihitung sinkron');
assert.match(app,/if\(light\)rows\.forEach\(function\(r\)\{if\(r\.hy\)updRow\(r\)\}\)/,'selama Worker bekerja upd hanya menggambar kartu terbangun');
assert.match(app,/KStore\.erpAll\(s\)/,'ERP reads through the domain storage API');
assert.match(app,/KStore\.erpPut\(s,list\)/,'ERP writes through the domain storage API');
console.log(`Compatibility audit: ${originalNames.length} original function names + 7 tabs preserved; Worker cache and ERP API wiring verified`);
const migration = fs.readFileSync(new URL('../js/migration.js',import.meta.url),'utf8');
const main = fs.readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
assert.match(main,/mergeLegacyRows\(current, rows, name\)/,'legacy ERP migration merges rather than replaces collections');
assert.match(main,/__kalsara_erp_idb_migration_report_v1/,'legacy ERP migration stores an audit report');
assert.match(main,/__kalsara_erp_idb_migration_conflicts_v1/,'legacy ERP ID collisions are retained for review');
assert.match(migration,/destination: map\[id\], source: row/,'migration conflict records preserve both destination and source values');
console.log('Migration wiring audit: destination-preserving merge, report, and conflict log verified');

assert.match(main,/compareLegacyKey\(KStore\.getItem\(key\), sourceValue, key\)/,'localStorage migration compares source and destination values');
assert.match(main,/__kalsara_localstorage_migration_report_v1/,'localStorage migration stores a report');
assert.match(main,/__kalsara_localstorage_migration_conflicts_v1/,'localStorage conflicts are retained for review');
console.log('Legacy localStorage migration audit: report and conflict retention verified');
