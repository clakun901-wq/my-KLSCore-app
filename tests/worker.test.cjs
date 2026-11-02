const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { deflateRawSync } = require('node:zlib');
const source = fs.readFileSync(path.join(__dirname, '../workers/compute.worker.js'), 'utf8').replace(/^import .*;\s*/,'');
let handler;
const self = { onmessage: null, postMessage: value => { handler = value; } };
let calculateProduct;
vm.runInNewContext(source, { self, get calculateProduct(){ return calculateProduct; }, BigInt, Number, String, Error, TextDecoder, Uint8Array, DataView, ArrayBuffer, DecompressionStream, Response, Promise, URL });
async function run(type, payload) {
  handler = undefined;
  await self.onmessage({ data: { id: 1, type, payload } });
  return handler;
}
function zipStored(files, compress=false) {
  const locals=[], centrals=[]; let offset=0;
  for (const [name, body] of Object.entries(files)) {
    const n=Buffer.from(name), raw=Buffer.from(body), d=compress?deflateRawSync(raw):raw, method=compress?8:0, l=Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50,0); l.writeUInt16LE(20,4); l.writeUInt16LE(0,6); l.writeUInt16LE(method,8);
    l.writeUInt32LE(0,14); l.writeUInt32LE(d.length,18); l.writeUInt32LE(raw.length,22); l.writeUInt16LE(n.length,26);
    locals.push(l,n,d);
    const c=Buffer.alloc(46); c.writeUInt32LE(0x02014b50,0); c.writeUInt16LE(20,4); c.writeUInt16LE(20,6); c.writeUInt16LE(0,8); c.writeUInt16LE(method,10);
    c.writeUInt32LE(0,16); c.writeUInt32LE(d.length,20); c.writeUInt32LE(raw.length,24); c.writeUInt16LE(n.length,28); c.writeUInt32LE(offset,42);
    centrals.push(c,n); offset += l.length+n.length+d.length;
  }
  const centralSize=centrals.reduce((s,b)=>s+b.length,0), end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(Object.keys(files).length,8); end.writeUInt16LE(Object.keys(files).length,10); end.writeUInt32LE(centralSize,12); end.writeUInt32LE(offset,16);
  return Uint8Array.from(Buffer.concat([...locals,...centrals,end])).buffer;
}
(async()=>{
 calculateProduct = (await import('../workers/calculator-engine.js')).calculateProduct;
 let r = await run('calculate-product',{settings:{},promos:[],product:{id:'worker-test',m:50000,q:1,d:0,p:0,t:10000}}); assert.equal(r.ok,true); assert.equal(r.result.u,10048); assert.equal(r.result.forwardAtIdeal.u,10048);
 r = await run('money-pipeline', { grossCents: '100000', costCents: '25000', stages: [{name:'fee',basisPoints:1250}] });
 assert.equal(r.ok, true); assert.equal(r.result.feesCents, '12500'); assert.equal(r.result.netCents, '62500');
 r = await run('money-pipeline', { grossCents: '-10000', costCents: '0', stages: [{name:'fee',basisPoints:5000}] });
 assert.equal(r.result.feesCents, '-5000'); assert.equal(r.result.netCents, '-5000');
 r = await run('money-pipeline', { grossCents: '12.5', costCents: '0', stages: [] }); assert.equal(r.ok, false);
 r = await run('money-pipeline', { grossCents: '100', costCents: '0', stages: [{name:'bad',basisPoints:1.5}] }); assert.equal(r.ok, false);
 r = await run('filter', { query: 'kopi', items: [{searchText:'Kopi Arabika'}, {searchText:'Teh'}] }); assert.equal(r.result.length, 1);
 r = await run('sort', { key: 'name', items: [{name:'Z'}, {name:'A'}] }); assert.equal(r.result[0].name, 'A');
 r = await run('parse-csv', {text:'\uFEFFA;B;C\r\n1;"dua;baris";3\r\n4;"kutip ""ganda""";6'});
 assert.equal(r.ok,true); assert.deepEqual(JSON.parse(JSON.stringify(r.result)),[['A','B','C'],['1','dua;baris','3'],['4','kutip "ganda"','6']]);
 r = await run('parse-csv',{text:'A,B\n1,"broken'}); assert.equal(r.ok,false); assert.match(r.error,/tidak ditutup/);
 r = await run('parse-shopee-report',{rows:[['No. Pesanan','ID Produk','Nama Produk','Harga Produk','Total Penghasilan','Tanggal Dana Dilepaskan','Biaya Administrasi'],['ORD00000001','SKU1','Produk A','100.000','80.000','2026-10-01','5.000'],['ORD00000002','SKU1','Produk A','50.000','40.000','2026-10-02','2.500']]});
 assert.equal(r.ok,true); assert.equal(r.result.rows[0].gross_revenue,100000); assert.equal(r.result.rows[0].fa,-5000); assert.equal(r.result.tp,120000); assert.equal(r.result.rows[0].qty,2);
 r = await run('parse-shopee-orders',{rows:[['No. Pesanan','Nomor Referensi SKU','Nama Produk','Nama Variasi','Jumlah','Returned quantity','Harga setelah diskon','Status Pesanan'],['ORD00000001','SKU1','Produk A','Merah','3','1','30.000','Selesai']]});
 assert.equal(r.ok,true); assert.equal(r.result.rows[0].qty,2);
 r = await run('aggregate-erp',{month:'2026-10',raw:[{id:'r1',order_id:'ORD00000001',sku:'SKU1',name:'Produk A',date:'2026-10-01',gross_revenue:10000,tp:9000,qty:2,fa:-500,platform_fee:-500}],opex:[{date:'2026-10-03',amount:1000}],items:{},snapshot:{},products:[{m:3000,sku:'SKU1',n:'Produk A'}]});
 assert.equal(r.ok,true); assert.equal(r.result.om,10000); assert.equal(r.result.hpp,6000); assert.equal(r.result.ox,1000); assert.equal(r.result.n,1); assert.equal(r.result.nr,1);
 r = await run('aggregate-erp',{month:'2026-10',raw:[{id:'r1',date:'2026-10-01',gross_revenue:10000,qty:2}],opex:[],items:{},snapshot:{r1:{hs:5000}},products:[]});
 assert.equal(r.result.hpp,5000); assert.equal(r.result.nl,1);
 const xlsx=zipStored({'xl/sharedStrings.xml':'<sst><si><t>No. Pesanan</t></si><si><t>Harga Produk</t></si></sst>','xl/worksheets/sheet1.xml':'<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>ORD00000001</t></is></c><c r="B2"><v>125000</v></c></row></sheetData></worksheet>'});
 r = await run('parse-xlsx',{buffer:xlsx}); assert.equal(r.ok,true); assert.deepEqual(JSON.parse(JSON.stringify(r.result)),[['No. Pesanan','Harga Produk'],['ORD00000001','125000']]);
 console.log('Worker tests: 33 assertions passed (including calculator route and deflated XLSX)');
})().catch(e=>{console.error(e);process.exitCode=1});
