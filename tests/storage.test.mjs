import assert from 'node:assert/strict';
import { initStorage, KStore, backupToFile, restoreFromFile } from '../js/storage.js';

const files = new Map();
let failNextWrite = false;
const root = {
  async getFileHandle(name) {
    return {
      async getFile() {
        const content = files.get(name) || '';
        return { size: new TextEncoder().encode(content).length, async text() { return content; } };
      },
      async createWritable() {
        let content = files.get(name) || '';
        let cursor = 0;
        return {
          async seek(n) { cursor = n; },
          async write(data) {
            if (failNextWrite) { failNextWrite = false; throw new Error('simulated quota failure'); }
            const chunk = typeof data === 'string' ? data : new TextDecoder().decode(data);
            content = content.slice(0,cursor) + chunk + content.slice(cursor + chunk.length);
            cursor += chunk.length;
          },
          async close() { files.set(name,content); },
          async abort() {}
        };
      }
    };
  }
};
Object.defineProperty(globalThis,'navigator',{ configurable:true, value:{ storage:{ async getDirectory(){return root;}, async persist(){return true;} } } });
let savedFile='';
globalThis.window = { dispatchEvent(){}, async showSaveFilePicker(){ return { async createWritable(){ return { async write(data){savedFile=String(data)}, async close(){}, async abort(){} }; } }; } };

const oldWarn=console.warn, oldError=console.error;
console.warn=()=>{}; console.error=()=>{};
await initStorage();
KStore.setItem('alpha','1');
await KStore.flush();
assert.equal(KStore.getItem('alpha'),'1');
failNextWrite = true;
KStore.setItem('alpha','2');
await assert.rejects(KStore.flush(),/alpha.*simulated quota failure/);
assert.equal(KStore.getItem('alpha'),'1','failed optimistic write rolls back to last durable value');
await KStore.importSnapshot('{"alpha":"1","beta":"restored","count":7}');
assert.equal(KStore.getItem('alpha'),'1');
assert.equal(KStore.getItem('beta'),'restored');
assert.equal(KStore.getItem('count'),'7');
const backup = await KStore.exportSnapshot();
assert.equal(JSON.parse(backup).alpha,'1','backup exports durable data');
KStore.setItem('gamma','temporary'); await KStore.flush();
await KStore.importSnapshot(backup);
assert.equal(KStore.getItem('gamma'),null,'restore removes keys absent from backup');
assert.equal(KStore.getItem('alpha'),'1','restore returns to saved snapshot');
await KStore.flush();
await backupToFile();
assert.ok(savedFile.includes('alpha') && savedFile.includes('beta'),'File System Access backup writes snapshot JSON');
KStore.setItem('temp-file-restore','1'); await KStore.flush();
await restoreFromFile({async text(){return savedFile}});
assert.equal(KStore.getItem('temp-file-restore'),null,'file restore replaces the full snapshot');
const journal = files.get('kalsara-delta.log');
assert.match(journal,/"snapshot"/);
console.warn=oldWarn; console.error=oldError;
await KStore.erpPut('opex',[{id:'opx-1',date:'2026-11-02',amount:12500,category:'Utilitas'}]);
let erpRows=await KStore.erpAll('opex');
assert.equal(erpRows.length,1,'ERP CRUD reads a collection through the storage domain API');
assert.equal(erpRows[0].amount,12500,'ERP domain API preserves typed payload values');
await KStore.erpPut('opex',[{id:'opx-2',date:'2026-11-02',amount:7000,category:'Sewa'}]);
erpRows=await KStore.erpAll('opex');
assert.equal(erpRows.length,2,'ERP upsert keeps existing records');
await KStore.erpDelete('opex','opx-1');
erpRows=await KStore.erpAll('opex');
assert.equal(erpRows.length,1,'ERP delete removes only the selected record');
assert.equal(erpRows[0].id,'opx-2');
await KStore.erpClear('opex');
assert.equal((await KStore.erpAll('opex')).length,0,'ERP clear removes all records in a collection');
console.log('Storage tests: 19 runtime assertions passed');
const fsp = await import('node:fs/promises');
const storageSource = await fsp.readFile(new URL('../js/storage.js',import.meta.url),'utf8');
const engineSource = await fsp.readFile(new URL('../js/sqlite-engine.js',import.meta.url),'utf8');
// Tahap 3: skema dan SQL domain ERP berpindah ke sqlite-engine.js (dieksekusi pada SQLite sungguhan oleh tests/sqlite-engine.test.mjs).
for (const table of ['erp_marketplaces_raw','erp_order_items','erp_opex','erp_settings']) assert.ok(engineSource.includes('CREATE TABLE IF NOT EXISTS '+table),table+' domain table is declared');
assert.match(engineSource,/erpReplace\(db, entity, parseErpMap\(entity, op\.v\)\)/,'ERP key writes are routed to the domain tables in the same transaction');
assert.match(engineSource,/case 'erp-put'/,'ERP upsert operates on domain rows');
assert.match(storageSource,/async erpAll\(entity\)/,'ERP reads go through the domain API');
assert.match(engineSource,/SELECT id,payload FROM ' \+ ERP_TABLES\[entity\]/,'SQLite domain table is queried');
assert.match(storageSource,/async erpPut\(entity, list\)/,'ERP writes go through the domain API');
console.log('Storage SQLite schema audit: 9 assertions passed');
