import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// Aturan 4: komponen kartu tanpa innerHTML, Shadow DOM, Signals
const card = read('components/product-card.js');
ok(!/innerHTML|insertAdjacentHTML|outerHTML|document\.write/.test(card.replace(/\/\*[\s\S]*?\*\//g, '')), 'product-card.js tidak boleh memakai innerHTML');
ok(/attachShadow\(\{mode: 'open'\}\)/.test(card), 'kartu harus memakai Shadow DOM');
ok(/customElements\.define\('kalsara-product-card'/.test(card), 'custom element harus terdaftar');
ok(/from '\.\.\/js\/signals\.js'/.test(card) && /effect\(/.test(card), 'kartu harus reaktif lewat Signals');
import {readLegacySource} from './helpers/legacy-source.mjs';
const legacy = readLegacySource();
const shopModule = read('js/etalase-view.js');
const shopSrc = shopModule.slice(shopModule.indexOf('function shopChips'), shopModule.indexOf('return {errModel:'));
ok(shopSrc.length > 500 && !/KDOM\.setHTML|innerHTML/.test(shopSrc), 'shop() tidak boleh merakit HTML string');
ok(!/data-sin|data-lk|class=\\"si\\"/.test(shopSrc), 'shop() tidak boleh lagi membuat markup kartu lama');

// Aturan 5 & 6: pipa Chain of Responsibility di Worker, tanpa float uang
const pipe = read('workers/pricing-pipeline.js');
ok(/class Handler/.test(pipe) && /setNext\(/.test(pipe) && /function link\(/.test(pipe), 'pipa harus memakai pola Chain of Responsibility');
for (const h of ['VoucherHandler', 'PlatformFeeHandler', 'DeductionHandler', 'SettlementHandler', 'ProfitHandler', 'RateResolverHandler', 'BreakEvenEstimateHandler', 'VoucherFixedPointHandler', 'ListingGrossUpHandler', 'PriceSearchHandler', 'TightenHandler']) ok(new RegExp('class ' + h + ' extends Handler').test(pipe), 'handler hilang: ' + h);
ok(!/parseFloat|toFixed\(/.test(pipe), 'pipa tidak boleh memakai parseFloat/toFixed untuk uang');
ok(/const SEN = 100/.test(pipe), 'pipa menghitung dalam sen (x100)');
ok(/export \{ calculateProduct, calculateBatch/.test(read('workers/calculator-engine.js')), 'calculator-engine harus memakai pipa');
ok(/'calculate-batch'/.test(read('workers/compute.worker.js')), 'Worker harus punya operasi calculate-batch');
ok(/pricing-pipeline\.js/.test(read('sw.js')) && /product-card\.js/.test(read('sw.js')), 'Service Worker harus meng-cache pipa dan kartu');

// Regresi: setiap tag yang dipakai template dinamis harus lolos sanitizer (<s> harga coret pernah hilang diam-diam)
const allowed = new Set(read('js/dom.js').match(/ALLOWED_TAGS = new Set\(\('([^']+)'/)[1].split(/\s+/));
for (const t of ['s', 'b', 'em', 'button', 'label', 'input', 'svg', 'path', 'rect', 'details', 'summary']) ok(allowed.has(t), 'sanitizer harus mengizinkan <' + t + '>');
// Tahap 4: hidrasi malas + batas produk 1.000 + jalur cepat satu produk
ok(/var ROW_MAX=1000/.test(legacy), 'batas produk harus 1.000');
ok(!/rows\.length>=100|slice\(0,100\)|100-rows\.length/.test(legacy), 'tidak boleh ada sisa batas 100 produk');
ok(/function hyd\(r\)/.test(legacy) && /IntersectionObserver/.test(legacy) && /function cardBody\(r,e\)/.test(legacy), 'kartu Hitung harus dibangun malas (hyd + IntersectionObserver)');
ok(/function updRow\(r\)/.test(legacy) && /createUpdater/.test(legacy) && /r\._ag/.test(read('js/kartu-update.js')), 'upd memakai jalur cepat satu produk (updRow + cache agregat) melalui modul');
const cb = legacy.slice(legacy.indexOf('function cardBody(r,e){'), legacy.indexOf('/*v9.8: hidrasi malas.'));
ok(!/upd\(true\)/.test(cb) && /upd\(true,r\)/.test(cb), 'edit di kartu harus memakai upd(true,r)');
ok(/pc\.lz\{height:895px/.test(read('css/app.css')), 'cangkang kartu harus punya tinggi mendekati kartu asli');
console.log(`Architecture audit: ${n} assertions passed`);
