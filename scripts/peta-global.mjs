#!/usr/bin/env node
/* Peta ketergantungan global js/legacy/ (Tahap 1, v9.37).
 *
 * ALAT PENGEMBANG. Tidak dimuat aplikasi, tidak ada di daftar cache sw.js, tidak dikirim ke pengguna.
 * Tidak mengubah kode aplikasi: hanya MEMBACA js/legacy/*.js, js/legacy-app.js, js/*.js, components/*.js, index.html
 * dan MENULIS satu berkas laporan (laporan/PETA-GLOBAL.md).
 *
 * Cara kerja: bagian-bagian legacy dijalankan loader sebagai SATU modul gabungan (urutan parts.json). Skrip ini
 * menggabungkan bagian-bagian itu dengan cara yang sama, membacanya dengan pembaca kode (parser acorn, salinan
 * utuh di scripts/vendor/, tanpa npm install), lalu menelusuri cakupan variabel (scope) sungguhan:
 *   - nama tingkat atas modul gabungan = "nama global" (di mata bagian-bagian lain),
 *   - tiap pemakaian dicatat sebagai baca / tulis, lengkap dengan berkas dan nomor barisnya,
 *   - variabel lokal dan parameter yang kebetulan senama TIDAK dihitung (bukan pemakaian global).
 * Pemeriksa GAGAL KERAS (melempar galat, exit non-nol) bila ada yang tidak beres; tidak pernah diam-diam.
 *
 * Pemakaian: node scripts/peta-global.mjs            -> menulis laporan/PETA-GLOBAL.md
 *            node scripts/peta-global.mjs --check    -> exit 1 bila laporan di repo tidak sama dengan hasil baru
 *            node scripts/peta-global.mjs --root DIR --out BERKAS   (untuk uji sabotase pada salinan sementara)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from './vendor/acorn.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(HERE, '..');
export const CORE_NAMES = ['A', 'rows', 'SALES', 'PRM', 'TS'];

const ES_BUILTINS = new Set(('Object Function Array Number Math JSON String Boolean Date RegExp Error TypeError RangeError SyntaxError EvalError ' +
  'ReferenceError URIError AggregateError Map Set WeakMap WeakSet WeakRef Promise Symbol Proxy Reflect BigInt ArrayBuffer SharedArrayBuffer DataView ' +
  'Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array BigInt64Array BigUint64Array ' +
  'Intl Atomics parseInt parseFloat isNaN isFinite NaN Infinity undefined encodeURIComponent decodeURIComponent encodeURI decodeURI escape unescape globalThis eval').split(/\s+/));
const BROWSER_GLOBALS = new Set(('window document navigator location history localStorage sessionStorage console setTimeout clearTimeout setInterval clearInterval ' +
  'requestAnimationFrame cancelAnimationFrame requestIdleCallback cancelIdleCallback fetch alert confirm prompt URL URLSearchParams Blob File FileReader FormData ' +
  'Event CustomEvent MouseEvent KeyboardEvent HTMLElement HTMLInputElement HTMLTemplateElement Element Node NodeList DocumentFragment SVGElement IntersectionObserver ' +
  'MutationObserver ResizeObserver DOMParser XMLSerializer TextEncoder TextDecoder performance queueMicrotask structuredClone indexedDB caches crypto atob btoa ' +
  'matchMedia getComputedStyle Image Audio Worker screen innerWidth innerHeight scrollTo scrollBy XMLHttpRequest AbortController Notification BroadcastChannel ' +
  'addEventListener removeEventListener dispatchEvent print self top parent postMessage Headers Request Response CSS Option').split(/\s+/));

const rel = (root, p) => path.relative(root, p).split(path.sep).join('/');
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/* ---------- cakupan variabel ---------- */
class Binding {
  constructor(name, scope, kind) { this.name = name; this.scope = scope; this.kind = kind; this.decls = []; this.reads = []; this.writes = []; }
}
class Scope {
  constructor(parent, isFunction, isModule = false) { this.parent = parent; this.isFunction = isFunction; this.isModule = isModule; this.map = new Map(); }
  lookup(name) { for (let s = this; s; s = s.parent) { const b = s.map.get(name); if (b) return b; } return null; }
  functionScope() { let s = this; while (!s.isFunction) s = s.parent; return s; }
}

function patternNames(p, out = []) {
  if (!p) return out;
  switch (p.type) {
    case 'Identifier': out.push(p); break;
    case 'ObjectPattern': for (const pr of p.properties) patternNames(pr.type === 'RestElement' ? pr.argument : pr.value, out); break;
    case 'ArrayPattern': for (const e of p.elements) patternNames(e, out); break;
    case 'AssignmentPattern': patternNames(p.left, out); break;
    case 'RestElement': patternNames(p.argument, out); break;
    case 'MemberExpression': break;
    default: throw new Error('Pola tidak dikenal: ' + p.type);
  }
  return out;
}

/* ---------- pembacaan sumber ---------- */
export function readSources(root) {
  const dir = path.join(root, 'js', 'legacy');
  const manifestPath = path.join(dir, 'parts.json');
  if (!fs.existsSync(manifestPath)) throw new Error('parts.json tidak ditemukan di ' + dir);
  const names = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).parts;
  if (!Array.isArray(names) || names.length === 0) throw new Error('parts.json tidak berisi daftar bagian');
  const onDisk = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  if (JSON.stringify(onDisk) !== JSON.stringify([...names].sort())) throw new Error('Isi folder js/legacy/ tidak sama dengan parts.json');
  const parts = []; let text = '';
  for (const name of names) {
    const src = fs.readFileSync(path.join(dir, name), 'utf8');
    if (!src.endsWith('\n')) throw new Error(name + ' tidak diakhiri baris baru (penggabungan tidak aman)');
    parts.push({ name, start: text.length, end: text.length + src.length, bytes: Buffer.byteLength(src, 'utf8'), lines: src.split('\n').length - 1 });
    text += src;
  }
  return { parts, text };
}

/* Daftar nama yang disuntikkan loader dari modul ES (js/legacy-app.js, larik `modules`). */
export function readLoaderImports(root) {
  const src = fs.readFileSync(path.join(root, 'js', 'legacy-app.js'), 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
  const imports = new Map(); let found = false;
  (function walk(n) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === 'modules' && n.init && n.init.type === 'ArrayExpression') {
      found = true;
      for (const el of n.init.elements) {
        if (el.type !== 'ArrayExpression' || el.elements.length !== 2 || el.elements.some(x => x.type !== 'Literal' || typeof x.value !== 'string')) throw new Error('Bentuk larik modules di legacy-app.js tidak dikenal');
        for (const nm of el.elements[1].value.split(',').map(s => s.trim()).filter(Boolean)) imports.set(nm, el.elements[0].value);
      }
    }
    for (const k of Object.keys(n)) if (k !== 'loc') walk(n[k]);
  })(ast);
  if (!found) throw new Error('Larik `modules` tidak ditemukan di js/legacy-app.js');
  return imports;
}

/* Nama yang dipasang modul/skrip klasik ke window/globalThis (mis. KStore, KDOM). */
function readWindowProvided(root) {
  const out = new Map();
  const files = [];
  for (const d of ['js', 'workers', 'components']) {
    const dir = path.join(root, d); if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.js')) files.push(path.join(dir, f));
  }
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/(?:globalThis|window|self)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) if (!out.has(m[1])) out.set(m[1], rel(root, f));
    for (const m of s.matchAll(/Object\.defineProperty\(\s*(?:globalThis|window|self)\s*,\s*['"]([\w$]+)['"]/g)) if (!out.has(m[1])) out.set(m[1], rel(root, f));
  }
  return out;
}

/* Teks yang dibuat sebagai HTML (onclick="nama(...)") dan memanggil nama global tanpa terlihat sebagai pemanggilan biasa. */
const HANDLER_RE = /\bon[a-z]+\s*=\s*\\?["']?([^"'<>]*)/gi;
function handlerCalls(text) {
  const out = new Set();
  for (const m of text.matchAll(HANDLER_RE)) for (const c of m[1].matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) out.add(c[1]);
  return out;
}
function scanHtmlUse(root, globalNames) {
  const use = new Map(); const add = (name, file) => { if (!globalNames.has(name)) return; if (!use.has(name)) use.set(name, new Set()); use.get(name).add(file); };
  const targets = [];
  const idx = path.join(root, 'index.html'); if (fs.existsSync(idx)) targets.push(['index.html', fs.readFileSync(idx, 'utf8'), 'html']);
  for (const d of ['js', 'components']) {
    const dir = path.join(root, d); if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) if (f.endsWith('.js')) targets.push([d + '/' + f, fs.readFileSync(path.join(dir, f), 'utf8'), 'js']);
  }
  return { use, targets, add };
}

/* ---------- analisis utama ---------- */
export function analyze({ root = DEFAULT_ROOT } = {}) {
  const { parts, text } = readSources(root);
  const imports = readLoaderImports(root);
  const windowProvided = readWindowProvided(root);
  const ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module', locations: false });

  const partOf = off => { for (let i = 0; i < parts.length; i++) if (off >= parts[i].start && off < parts[i].end) return i; throw new Error('Posisi di luar bagian mana pun: ' + off); };
  const lineOf = off => { const p = parts[partOf(off)]; let n = 1; for (let i = p.start; i < off; i++) if (text.charCodeAt(i) === 10) n++; return n; };
  const loc = (node) => { const i = partOf(node.start); return { part: i, line: lineOf(node.start) }; };

  const moduleScope = new Scope(null, true, true);
  const unresolved = new Map(); // nama -> [{kind,part,line}]
  const nested = new Map(); // fungsi bersarang: nama -> [{part,line}]
  const windowRefs = []; const dynamicRefs = []; const strings = []; const stateAccess = [];

  const declare = (id, scope, kind, extra = {}) => {
    const fs_ = (kind === 'var' || kind === 'param') ? scope.functionScope() : scope;
    let b = fs_.map.get(id.name);
    if (!b) { b = new Binding(id.name, fs_, kind); fs_.map.set(id.name, b); }
    if (fs_.isModule) b.decls.push({ ...loc(id), kind, hasInit: !!extra.hasInit, initIsFn: !!extra.initIsFn, fnDecl: kind === 'function' });
    return b;
  };
  const isFnNode = n => n && (n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression');

  const hoistVars = (node, scope) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(n => hoistVars(n, scope));
    switch (node.type) {
      case 'VariableDeclaration':
        if (node.kind === 'var') for (const d of node.declarations) for (const id of patternNames(d.id)) declare(id, scope, 'var', { hasInit: !!d.init, initIsFn: isFnNode(d.init) });
        for (const d of node.declarations) hoistVars(d.init, scope); // var di dalam ekspresi fungsi tidak ikut (dihentikan di bawah)
        return;
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': case 'ClassDeclaration': case 'ClassExpression': return;
      default: for (const k of Object.keys(node)) if (k !== 'type' && k !== 'start' && k !== 'end') hoistVars(node[k], scope);
    }
  };
  const declareLexical = (stmts, scope) => {
    for (const s of stmts) {
      if (s.type === 'VariableDeclaration' && s.kind !== 'var') for (const d of s.declarations) for (const id of patternNames(d.id)) declare(id, scope, s.kind, { hasInit: !!d.init, initIsFn: isFnNode(d.init) });
      else if (s.type === 'FunctionDeclaration') { declare(s.id, scope, 'function'); if (!scope.isModule) { if (!nested.has(s.id.name)) nested.set(s.id.name, []); nested.get(s.id.name).push(loc(s.id)); } }
      else if (s.type === 'ClassDeclaration') declare(s.id, scope, 'class');
    }
  };

  const recordRef = (id, scope, kind, ctx, extra = {}) => {
    const b = scope.lookup(id.name);
    const L = loc(id);
    const rec = { ...L, fn: ctx.fn, atLoad: ctx.atLoad, bridge: ctx.bridge, ...extra };
    if (b) { if (b.scope.isModule) { if (kind === 'read') b.reads.push(rec); else b.writes.push({ ...rec, op: extra.op || '=' }); } return; }
    if (!unresolved.has(id.name)) unresolved.set(id.name, []);
    unresolved.get(id.name).push({ kind, ...L, typeofOnly: !!extra.typeofOnly });
  };

  const walkPattern = (p, scope, ctx, mode, op) => { // mode: 'declare' (bukan penulisan) | 'assign'
    if (!p) return;
    switch (p.type) {
      case 'Identifier': if (mode === 'assign') recordRef(p, scope, 'write', ctx, { op: op || '=' }); break;
      case 'ObjectPattern': for (const pr of p.properties) { if (pr.type === 'RestElement') walkPattern(pr.argument, scope, ctx, mode, op); else { if (pr.computed) visit(pr.key, scope, ctx); walkPattern(pr.value, scope, ctx, mode, op); } } break;
      case 'ArrayPattern': for (const e of p.elements) walkPattern(e, scope, ctx, mode, op); break;
      case 'AssignmentPattern': walkPattern(p.left, scope, ctx, mode, op); visit(p.right, scope, ctx); break;
      case 'RestElement': walkPattern(p.argument, scope, ctx, mode, op); break;
      case 'MemberExpression': visit(p, scope, ctx); break;
      default: throw new Error('Pola tidak dikenal: ' + p.type);
    }
  };

  const visitFunction = (node, scope, ctx, hint) => {
    const fscope = new Scope(scope, true);
    if (node.type === 'FunctionExpression' && node.id) declare(node.id, fscope, 'param');
    fscope.map.set('arguments', new Binding('arguments', fscope, 'param'));
    for (const p of node.params) for (const id of patternNames(p)) declare(id, fscope, 'param');
    const label = (node.id && node.id.name) || hint || '(anonim di ' + ctx.fn.replace(/^\(anonim di (.*)\)$/, '$1') + ')';
    const c = { fn: label, atLoad: false, bridge: ctx.bridge };
    for (const p of node.params) walkPattern(p, fscope, c, 'declare');
    if (node.body.type === 'BlockStatement') {
      hoistVars(node.body.body, fscope); declareLexical(node.body.body, fscope);
      for (const s of node.body.body) visit(s, fscope, c);
    } else visit(node.body, fscope, c);
  };

  const keyName = k => (k.type === 'Identifier' ? k.name : k.type === 'Literal' ? String(k.value) : null);

  function visit(node, scope, ctx, hint) {
    if (!node) return;
    switch (node.type) {
      case 'Identifier': recordRef(node, scope, 'read', ctx); return;
      case 'Literal': if (typeof node.value === 'string') strings.push({ value: node.value, ...loc(node) }); return;
      case 'TemplateLiteral': for (const q of node.quasis) strings.push({ value: q.value.cooked || '', ...loc(q) }); for (const e of node.expressions) visit(e, scope, ctx); return;
      case 'ImportDeclaration': case 'ExportNamedDeclaration': case 'ExportDefaultDeclaration': case 'ExportAllDeclaration': case 'ImportExpression':
        throw new Error('Bagian legacy tidak boleh memakai import/export (ditemukan di bagian ' + parts[partOf(node.start)].name + ')');
      case 'FunctionDeclaration': visitFunction(node, scope, ctx, node.id && node.id.name); return;
      case 'FunctionExpression': case 'ArrowFunctionExpression': visitFunction(node, scope, ctx, hint); return;
      case 'ClassDeclaration': case 'ClassExpression': {
        const cs = new Scope(scope, false); if (node.type === 'ClassExpression' && node.id) declare(node.id, cs, 'let');
        visit(node.superClass, cs, ctx);
        for (const m of node.body.body) {
          if (m.computed) visit(m.key, cs, ctx);
          if (m.value) { if (isFnNode(m.value)) visitFunction(m.value, cs, ctx, keyName(m.key)); else visit(m.value, cs, ctx); }
          if (m.type === 'StaticBlock') { const c2 = { ...ctx, fn: 'static', atLoad: false }; const bs = new Scope(cs, true); hoistVars(m.body, bs); declareLexical(m.body, bs); for (const s of m.body) visit(s, bs, c2); }
        }
        return;
      }
      case 'BlockStatement': { const bs = new Scope(scope, false); declareLexical(node.body, bs); for (const s of node.body) visit(s, bs, ctx); return; }
      case 'ForStatement': {
        const bs = new Scope(scope, false);
        if (node.init && node.init.type === 'VariableDeclaration' && node.init.kind !== 'var') declareLexical([node.init], bs);
        visit(node.init, bs, ctx); visit(node.test, bs, ctx); visit(node.update, bs, ctx); visit(node.body, bs, ctx); return;
      }
      case 'ForInStatement': case 'ForOfStatement': {
        const bs = new Scope(scope, false);
        if (node.left.type === 'VariableDeclaration') { if (node.left.kind !== 'var') declareLexical([node.left], bs); for (const d of node.left.declarations) walkPattern(d.id, bs, ctx, 'declare'); }
        else walkPattern(node.left, bs, ctx, 'assign', 'for-in/of');
        visit(node.right, bs, ctx); visit(node.body, bs, ctx); return;
      }
      case 'SwitchStatement': { visit(node.discriminant, scope, ctx); const bs = new Scope(scope, false); declareLexical(node.cases.flatMap(c => c.consequent), bs); for (const c of node.cases) { visit(c.test, bs, ctx); for (const s of c.consequent) visit(s, bs, ctx); } return; }
      case 'TryStatement': visit(node.block, scope, ctx); if (node.handler) visit(node.handler, scope, ctx); visit(node.finalizer, scope, ctx); return;
      case 'CatchClause': { const cs = new Scope(scope, false); if (node.param) { for (const id of patternNames(node.param)) declare(id, cs, 'let'); walkPattern(node.param, cs, ctx, 'declare'); } visit(node.body, cs, ctx); return; }
      case 'VariableDeclaration':
        for (const d of node.declarations) {
          walkPattern(d.id, scope, ctx, 'declare');
          if (d.init) visit(d.init, scope, ctx, d.id.type === 'Identifier' ? d.id.name : undefined);
        }
        return;
      case 'AssignmentExpression': {
        const hintL = node.left.type === 'Identifier' ? node.left.name : (node.left.type === 'MemberExpression' && !node.left.computed ? node.left.property.name : undefined);
        if (node.left.type === 'Identifier') recordRef(node.left, scope, 'write', ctx, { op: node.operator });
        else if (node.left.type === 'MemberExpression') visitMember(node.left, scope, ctx, true);
        else walkPattern(node.left, scope, ctx, 'assign', node.operator);
        visit(node.right, scope, ctx, hintL); return;
      }
      case 'UpdateExpression':
        if (node.argument.type === 'Identifier') recordRef(node.argument, scope, 'write', ctx, { op: node.operator });
        else visit(node.argument, scope, ctx);
        return;
      case 'UnaryExpression':
        if (node.operator === 'typeof' && node.argument.type === 'Identifier') { recordRef(node.argument, scope, 'read', ctx, { typeofOnly: true }); return; }
        visit(node.argument, scope, ctx); return;
      case 'MemberExpression': visitMember(node, scope, ctx, false); return;
      case 'CallExpression': {
        if (node.callee.type === 'Identifier' && (node.callee.name === 'eval' || node.callee.name === 'Function') && !scope.lookup(node.callee.name)) dynamicRefs.push({ what: node.callee.name + '(...)', ...loc(node) });
        const c2 = node.callee.type === 'Identifier' && node.callee.name === 'createState' ? { ...ctx, bridge: true } : ctx;
        visit(node.callee, scope, ctx); for (const a of node.arguments) visit(a, scope, c2); return;
      }
      case 'NewExpression': {
        if (node.callee.type === 'Identifier' && node.callee.name === 'Function' && !scope.lookup('Function')) dynamicRefs.push({ what: 'new Function(...)', ...loc(node) });
        visit(node.callee, scope, ctx); for (const a of node.arguments) visit(a, scope, ctx); return;
      }
      case 'Property':
        if (node.computed) visit(node.key, scope, ctx);
        if (isFnNode(node.value)) visitFunction(node.value, scope, ctx, keyName(node.key)); else visit(node.value, scope, ctx, keyName(node.key));
        return;
      case 'LabeledStatement': visit(node.body, scope, ctx); return;
      case 'BreakStatement': case 'ContinueStatement': return;
      case 'MetaProperty': return;
      default:
        for (const k of Object.keys(node)) {
          if (k === 'type' || k === 'start' || k === 'end') continue;
          const v = node[k];
          if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && visit(x, scope, ctx)); else if (v && typeof v.type === 'string') visit(v, scope, ctx);
        }
    }
  }
  function visitMember(node, scope, ctx, isWrite) {
    const o = node.object;
    if (o.type === 'Identifier' && (o.name === 'window' || o.name === 'globalThis' || o.name === 'self') && !scope.lookup(o.name)) {
      const nm = !node.computed && node.property.type === 'Identifier' ? node.property.name : (node.property.type === 'Literal' ? String(node.property.value) : null);
      if (nm) windowRefs.push({ name: nm, kind: isWrite ? 'tulis' : 'baca', ...loc(node) }); else dynamicRefs.push({ what: o.name + '[...]', ...loc(node) });
    }
    if (o.type === 'Identifier' && o.name === 'State' && !node.computed && node.property.type === 'Identifier' && CORE_NAMES.includes(node.property.name)) stateAccess.push({ key: node.property.name, kind: isWrite ? 'tulis' : 'baca', ...loc(node) });
    visit(o, scope, ctx); if (node.computed) visit(node.property, scope, ctx);
  }

  // Program
  hoistVars(ast.body, moduleScope); declareLexical(ast.body, moduleScope);
  const topCtx = { fn: '(tingkat atas)', atLoad: true, bridge: false };
  for (const s of ast.body) visit(s, moduleScope, topCtx);

  /* ---- kumpulkan hasil ---- */
  const partName = i => parts[i].name;
  const globals = [];
  for (const b of [...moduleScope.map.values()].sort((x, y) => byName(x.name, y.name))) {
    if (b.name === 'arguments' && b.decls.length === 0) continue;
    if (b.decls.length === 0) throw new Error('Nama tingkat atas tanpa deklarasi: ' + b.name);
    const kind = b.decls.every(d => d.fnDecl) ? 'fungsi' : b.decls.some(d => d.kind === 'class') ? 'kelas' : b.decls.every(d => d.kind === 'const') ? 'konstanta' : 'variabel';
    const definedIn = [...new Set(b.decls.map(d => d.part))].sort((x, y) => x - y);
    const tally = list => { const m = {}; for (const r of list) m[r.part] = (m[r.part] || 0) + 1; return m; };
    const reads = b.reads, writes = b.writes;
    const userParts = new Set([...reads, ...writes].map(r => r.part));
    const crossUsers = [...userParts].filter(p => !definedIn.includes(p)).sort((x, y) => x - y);
    const initWrites = b.decls.filter(d => d.hasInit).length;
    const earlyLoad = reads.concat(writes).filter(r => r.atLoad).filter(r => { const d = b.decls[0]; return b.decls.every(x => x.kind !== 'function' && (x.part > r.part || (x.part === r.part && x.line > r.line))); });
    globals.push({
      name: b.name, kind, valueIsFunction: b.decls.some(d => d.initIsFn), declKinds: [...new Set(b.decls.map(d => d.kind))],
      decls: b.decls, definedIn, readCount: reads.length, writeCount: writes.length, initCount: initWrites,
      readsByPart: tally(reads), writesByPart: tally(writes), reads, writes,
      crossUsers, crossReaders: [...new Set(reads.map(r => r.part))].filter(p => !definedIn.includes(p)).sort((x, y) => x - y),
      crossWriters: [...new Set(writes.map(r => r.part))].filter(p => !definedIn.includes(p)).sort((x, y) => x - y),
      cross: crossUsers.length > 0, duplicate: b.decls.length > 1, earlyLoad
    });
  }

  // pemakaian lewat teks HTML
  const globalNames = new Set(globals.map(g => g.name));
  const html = scanHtmlUse(root, globalNames);
  for (const s of strings) for (const c of handlerCalls(s.value)) html.add(c, 'js/legacy/' + partName(s.part));
  for (const [file, src, kind] of html.targets) {
    if (kind === 'html') { for (const c of handlerCalls(src)) html.add(c, file); continue; }
    let a; try { a = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' }); } catch (e) { throw new Error('Berkas ' + file + ' tidak bisa dibaca pemeriksa: ' + e.message); }
    (function w(n) { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(w); if (n.type === 'Literal' && typeof n.value === 'string') for (const c of handlerCalls(n.value)) html.add(c, file); else if (n.type === 'TemplateElement') for (const c of handlerCalls(n.value.cooked || '')) html.add(c, file); for (const k of Object.keys(n)) if (k !== 'type') w(n[k]); })(a);
  }
  const htmlUse = [...html.use.entries()].map(([name, files]) => ({ name, files: [...files].sort() })).sort((x, y) => byName(x.name, y.name));
  const htmlUseSet = new Set(htmlUse.map(h => h.name));

  // nama dari luar (tak dideklarasikan di legacy)
  const externals = [];
  for (const [name, refs] of [...unresolved.entries()].sort((x, y) => byName(x[0], y[0]))) {
    const cat = imports.has(name) ? 'impor' : ES_BUILTINS.has(name) ? 'bawaan JS' : BROWSER_GLOBALS.has(name) ? 'peramban' : windowProvided.has(name) ? 'skrip lain' : 'TIDAK DIKENAL';
    externals.push({ name, category: cat, from: imports.get(name) || windowProvided.get(name) || null, reads: refs.filter(r => r.kind === 'read').length, writes: refs.filter(r => r.kind === 'write').length, refs });
  }

  // matriks bagian -> bagian
  const matrix = {};
  for (const g of globals) for (const u of g.crossUsers) for (const d of g.definedIn) { const k = u + '>' + d; matrix[k] = (matrix[k] || 0) + 1; }

  // ringkasan per bagian
  const perPart = parts.map((p, i) => {
    const defined = globals.filter(g => g.definedIn.includes(i));
    const outward = defined.filter(g => g.crossUsers.length > 0);
    const importedNames = globals.filter(g => g.crossUsers.includes(i));
    return { name: p.name, bytes: p.bytes, lines: p.lines, defined: defined.length, definedFunctions: defined.filter(g => g.kind === 'fungsi').length, definedVariables: defined.filter(g => g.kind !== 'fungsi').length, usedByOthers: outward.length, usesFromOthers: importedNames.length };
  });

  // inti
  const core = CORE_NAMES.map(n => {
    const g = globals.find(x => x.name === n); if (!g) throw new Error('Nama inti tidak ditemukan sebagai global: ' + n);
    const sa = stateAccess.filter(s => s.key === n);
    const real = g.writes.filter(w => !w.bridge);
    return { name: n, definedIn: g.definedIn, decls: g.decls, initCount: g.initCount, reassignTotal: g.writes.length, reassignBridge: g.writes.filter(w => w.bridge).length, reassignDirect: real.length, direct: real, bridge: g.writes.filter(w => w.bridge), readCount: g.readCount, readsByPart: g.readsByPart, writesByPart: g.writesByPart, stateReads: sa.filter(s => s.kind === 'baca').length, stateWrites: sa.filter(s => s.kind === 'tulis').length, stateByPart: sa.reduce((m, s) => (m[s.part] = (m[s.part] || 0) + 1, m), {}) };
  });

  const topFunctions = globals.filter(g => g.kind === 'fungsi').map(g => g.name);
  const total = globals.length;
  const cross = globals.filter(g => g.cross);
  const summary = {
    total, functions: topFunctions.length, variables: total - topFunctions.length,
    cross: cross.length, crossFunctions: cross.filter(g => g.kind === 'fungsi').length, crossVariables: cross.filter(g => g.kind !== 'fungsi').length,
    local: total - cross.length, duplicates: globals.filter(g => g.duplicate).length, htmlOnlyPlus: htmlUse.length,
    totalBytes: parts.reduce((s, p) => s + p.bytes, 0), coreReassign: core.reduce((s, c) => s + c.reassignTotal, 0), coreReassignDirect: core.reduce((s, c) => s + c.reassignDirect, 0)
  };
  return { parts: parts.map(p => ({ name: p.name, bytes: p.bytes, lines: p.lines })), globals, core, summary, perPart, matrix, externals, htmlUse, windowRefs, dynamicRefs, imports: [...imports.entries()].map(([name, file]) => ({ name, file })), nestedFunctions: [...nested.entries()].map(([name, at]) => ({ name, count: at.length })), topFunctions, htmlUseSet: [...htmlUseSet] };
}

/* ---------- penulisan laporan ---------- */
const nf = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const pct = (a, b) => (b ? (Math.round((a / b) * 1000) / 10).toString().replace('.', ',') + '%' : '-');
const short = n => n.replace(/\.js$/, '');
export function render(d) {
  const P = i => d.parts[i].name; const S = d.summary; const L = [];
  const where = r => P(r.part) + ':' + r.line;
  const counts = (m) => Object.keys(m).map(Number).sort((a, b) => a - b).map(i => short(P(i)) + '×' + m[i]).join(', ') || '-';
  L.push('# Peta ketergantungan global js/legacy/ (dihasilkan otomatis)');
  L.push('');
  L.push('Dihasilkan oleh `node scripts/peta-global.mjs`. Jangan diedit tangan: jalankan ulang skrip itu. Tes `tests/peta-global.test.mjs` gagal bila berkas ini tidak sama dengan hasil terbaru.');
  L.push('');
  L.push('## 1. Ringkasan (bahasa awam)');
  L.push('');
  L.push('Aplikasi ini masih memuat 12 potongan kode di `js/legacy/` yang digabung menjadi SATU program besar saat dijalankan. Karena digabung, sebuah potongan bisa memakai "nama" (fungsi atau variabel) milik potongan lain tanpa izin tertulis. Nama seperti itu disebut **global**. Makin banyak global yang dipakai lintas potongan, makin sulit potongan-potongan itu dipisah menjadi modul mandiri.');
  L.push('');
  L.push('- Jumlah seluruh nama global: **' + S.total + '** (' + S.functions + ' fungsi, ' + S.variables + ' variabel/konstanta).');
  L.push('- Nama yang melintasi berkas (didefinisikan di satu potongan, dipakai di potongan lain): **' + S.cross + '** (' + S.crossFunctions + ' fungsi, ' + S.crossVariables + ' variabel). **Inilah angka yang harus turun ke 0** agar `legacy/` bisa dihapus.');
  L.push('- Nama yang hanya dipakai di berkasnya sendiri: ' + S.local + ' (ini mudah dipindah).');
  L.push('- Lima variabel inti (`A`, `rows`, `SALES`, `PRM`, `TS`) diberi nilai baru langsung sebanyak **' + S.coreReassignDirect + '** kali di luar jembatan `state.js` (ditambah ' + (S.coreReassign - S.coreReassignDirect) + ' penugasan di dalam jembatan itu sendiri). Detailnya di bagian 2.');
  L.push('- Nama yang dipanggil lewat teks HTML (mis. `onclick="..."`) dan karena itu tidak kelihatan sebagai pemanggilan biasa: **' + S.htmlOnlyPlus + '** (bagian 5). Ini PERLU perhatian khusus saat fungsi dipindah ke modul.');
  L.push('- Nama yang didefinisikan lebih dari sekali: ' + S.duplicates + '.');
  const unk = d.externals.filter(e => e.category === 'TIDAK DIKENAL');
  L.push('- Nama yang tidak ditemukan di mana pun (kemungkinan salah ketik): ' + unk.length + (unk.length ? ' → ' + unk.map(e => '`' + e.name + '`').join(', ') : '') + '.');
  L.push('');
  L.push('### Per berkas');
  L.push('');
  L.push('| Berkas | Ukuran (byte) | Nama yang didefinisikan | …fungsi | …variabel | Dipakai berkas lain | Memakai nama berkas lain |');
  L.push('|---|---:|---:|---:|---:|---:|---:|');
  for (const p of d.perPart) L.push('| ' + p.name + ' | ' + nf(p.bytes) + ' | ' + p.defined + ' | ' + p.definedFunctions + ' | ' + p.definedVariables + ' | ' + p.usedByOthers + ' | ' + p.usesFromOthers + ' |');
  L.push('| **Jumlah** | **' + nf(S.totalBytes) + '** | **' + S.total + '** | **' + S.functions + '** | **' + S.variables + '** | **' + S.cross + '** (nama unik) | |');
  L.push('');
  L.push('Cara membaca: "Dipakai berkas lain" = berapa nama buatan berkas ini yang dipakai berkas lain. "Memakai nama berkas lain" = berapa nama milik berkas lain yang dipakai di berkas ini. Berkas dengan angka keduanya kecil paling mudah dipindah lebih dulu.');
  L.push('');
  L.push('### Siapa memakai milik siapa (jumlah nama)');
  L.push('');
  L.push('| Pemakai ↓ / Pemilik → | ' + d.parts.map(p => p.name.slice(0, 2)).join(' | ') + ' |');
  L.push('|---|' + d.parts.map(() => '---:').join('|') + '|');
  d.parts.forEach((p, u) => L.push('| ' + p.name + ' | ' + d.parts.map((_, o) => d.matrix[u + '>' + o] || '').join(' | ') + ' |'));
  L.push('');
  L.push('Kolom diberi awalan angka berkas pemilik (00 = 00-core.js, dst.). Satu nama yang didefinisikan di beberapa berkas dihitung di tiap pemilik.');
  L.push('');
  L.push('## 2. Lima nama inti: A, rows, SALES, PRM, TS (jembatan js/state.js)');
  L.push('');
  L.push('Penugasan ulang = baris kode yang memberi nilai BARU (`A=...`, `rows=...`, termasuk `+=`, `++`) setelah deklarasi awal. "Lewat jembatan" = penugasan di dalam fungsi pemasang `createState({...})` (kode di `00-core.js` yang meneruskan `State.A = ...` ke variabel asli); "langsung" = semua penugasan lain.');
  L.push('');
  L.push('| Nama | Didefinisikan di | Penugasan awal | Penugasan ulang langsung | Penugasan lewat jembatan | Dibaca (kali) | Akses `State.nama` baca / tulis |');
  L.push('|---|---|---:|---:|---:|---:|---|');
  for (const c of d.core) L.push('| `' + c.name + '` | ' + c.definedIn.map(P).join(', ') + ' | ' + c.initCount + ' | ' + c.reassignDirect + ' | ' + c.reassignBridge + ' | ' + c.readCount + ' | ' + c.stateReads + ' / ' + c.stateWrites + ' |');
  L.push('');
  for (const c of d.core) {
    L.push('**`' + c.name + '`** - dibaca di: ' + counts(c.readsByPart) + '. Akses lewat `State.' + c.name + '` di: ' + counts(c.stateByPart) + '.');
    L.push('');
    if (c.direct.length) { L.push('Penugasan ulang langsung (' + c.direct.length + '):'); L.push(''); for (const w of c.direct) L.push('- ' + where(w) + ' di dalam `' + w.fn + '` (' + w.op + ')'); }
    else L.push('Tidak ada penugasan ulang langsung.');
    if (c.bridge.length) { L.push(''); L.push('Lewat jembatan: ' + c.bridge.map(where).join(', ') + '.'); }
    L.push('');
  }
  L.push('## 3. Nama yang melintasi berkas (' + S.cross + ')');
  L.push('');
  L.push('| Nama | Jenis | Didefinisikan di | Dibaca di | Ditulis ulang di | Juga dari HTML? |');
  L.push('|---|---|---|---|---|---|');
  for (const g of d.globals.filter(x => x.cross)) {
    const rd = {}; for (const r of g.reads) if (!g.definedIn.includes(r.part)) rd[r.part] = (rd[r.part] || 0) + 1;
    const wr = {}; for (const r of g.writes) if (!g.definedIn.includes(r.part)) wr[r.part] = (wr[r.part] || 0) + 1;
    L.push('| `' + g.name + '` | ' + g.kind + (g.duplicate ? ' (dobel)' : '') + ' | ' + g.definedIn.map(P).join(', ') + ' | ' + counts(rd) + ' | ' + counts(wr) + ' | ' + (d.htmlUseSet.includes(g.name) ? 'ya' : '') + ' |');
  }
  L.push('');
  L.push('Hanya pemakaian DI LUAR berkas pendefinisi yang tercantum di kolom "Dibaca di" / "Ditulis ulang di".');
  L.push('');
  L.push('## 4. Semua nama global (' + S.total + ')');
  L.push('');
  L.push('| Nama | Jenis | Didefinisikan di (baris) | Dibaca | Ditulis ulang | Lintas berkas |');
  L.push('|---|---|---|---:|---:|---|');
  for (const g of d.globals) L.push('| `' + g.name + '` | ' + g.kind + (g.valueIsFunction ? ' (nilai fungsi)' : '') + ' | ' + g.decls.map(x => P(x.part) + ':' + x.line).join(', ') + ' | ' + g.readCount + ' | ' + g.writeCount + ' | ' + (g.cross ? 'ya' : '') + ' |');
  L.push('');
  L.push('## 5. Nama yang dipanggil lewat teks HTML (onclick="..." dan sejenisnya)');
  L.push('');
  L.push('Pembaca kode biasa tidak melihat pemanggilan ini karena tertulis di dalam teks. Bila fungsi-fungsi ini dipindah ke modul tanpa dipasang ke `window`, tombolnya mati. Pemeriksa mencari pola `on...="nama(...)"` di string js/legacy, js/*.js, components/*.js, dan index.html.');
  L.push('');
  if (d.htmlUse.length) { L.push('| Nama | Dipanggil dari teks di |'); L.push('|---|---|'); for (const h of d.htmlUse) L.push('| `' + h.name + '` | ' + h.files.join(', ') + ' |'); } else L.push('Tidak ada.');
  L.push('');
  L.push('## 6. Perhatian tambahan');
  L.push('');
  const dups = d.globals.filter(g => g.duplicate);
  L.push('**Nama didefinisikan lebih dari sekali** (' + dups.length + '): ' + (dups.length ? dups.map(g => '`' + g.name + '` (' + g.decls.map(x => P(x.part) + ':' + x.line).join(', ') + ')').join('; ') : 'tidak ada') + '.');
  L.push('');
  const early = d.globals.filter(g => g.earlyLoad.length);
  L.push('**Dipakai saat aplikasi dimuat sebelum didefinisikan** (' + early.length + '): ' + (early.length ? early.map(g => '`' + g.name + '`').join(', ') : 'tidak ada') + '. (Untuk `var`, nilainya `undefined` saat itu; ini jebakan urutan bila berkas diatur ulang.)');
  L.push('');
  L.push('**Akses dinamis** (`window[...]`, `eval`, `new Function`): ' + (d.dynamicRefs.length ? d.dynamicRefs.map(r => r.what + ' di ' + where(r)).join('; ') : 'tidak ada') + '.');
  L.push('');
  const wm = new Map(); for (const r of d.windowRefs) { const k = r.name + ' (' + r.kind + ')'; if (!wm.has(k)) wm.set(k, []); wm.get(k).push(where(r)); }
  L.push('**Nama yang dibaca/ditulis lewat `window.` atau `globalThis.`** di legacy: ' + (wm.size ? [...wm.entries()].sort((a, b) => byName(a[0], b[0])).map(([k, v]) => '`' + k.split(' ')[0] + '` ' + k.slice(k.indexOf(' ') + 1) + ' di ' + v.join(', ')).join('; ') : 'tidak ada') + '.');
  L.push('');
  L.push('**Fungsi bersarang** (dideklarasikan di dalam fungsi lain, bukan global): ' + (d.nestedFunctions.length ? d.nestedFunctions.map(x => '`' + x.name + '`').join(', ') : 'tidak ada') + '.');
  L.push('');
  L.push('### Nama dari luar legacy (tidak dideklarasikan di js/legacy/)');
  L.push('');
  L.push('| Nama | Asal | Dibaca | Ditulis |');
  L.push('|---|---|---:|---:|');
  for (const e of d.externals) L.push('| `' + e.name + '` | ' + e.category + (e.from ? ' (' + e.from + ')' : '') + ' | ' + e.reads + ' | ' + e.writes + ' |');
  L.push('');
  L.push('## 7. Batas pemeriksa (yang TIDAK terlihat)');
  L.push('');
  L.push('- Nama yang dirangkai menjadi teks lalu dijalankan (`eval`, `new Function`, `window[nama]`) dicatat di bagian 6 bila ada, tetapi isinya tidak bisa ditelusuri.');
  L.push('- Panggilan lewat teks HTML hanya dikenali dengan pola `on...="nama("`. Cara lain (mis. `data-aksi` yang diterjemahkan kode lain) tidak terlihat.');
  L.push('- Pemakaian oleh `workers/` dan `components/` tidak dihitung sebagai pemakai global legacy (Worker tidak bisa melihat variabel halaman).');
  L.push('- Pemeriksa membaca kode, tidak menjalankannya. Perilaku aplikasi tetap dijaga `npm test` dan E2E.');
  L.push('');
  return L.join('\n');
}

/* ---------- baris perintah ---------- */
function cli(argv) {
  const get = f => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const root = get('--root') ? path.resolve(get('--root')) : DEFAULT_ROOT;
  const out = get('--out') ? path.resolve(get('--out')) : path.join(root, 'laporan', 'PETA-GLOBAL.md');
  const data = analyze({ root }); const md = render(data);
  if (argv.includes('--check')) {
    const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
    if (cur !== md) { console.error('Laporan ' + rel(root, out) + ' sudah usang atau tidak ada. Jalankan: node scripts/peta-global.mjs'); process.exit(1); }
    console.log('Laporan ' + rel(root, out) + ' sudah mutakhir.');
  } else { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, md); console.log('Laporan ditulis: ' + rel(root, out)); }
  const S = data.summary;
  console.log('Global: ' + S.total + ' | lintas berkas: ' + S.cross + ' | penugasan ulang inti (langsung): ' + S.coreReassignDirect);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli(process.argv.slice(2));
