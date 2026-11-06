"""E2E Tahap 0 (v9.36) di Chromium nyata: pengaman data saat memulihkan cadangan besar.
Jalankan: python3 tests/e2e/tahap0.e2e.py
Alur: (1) pulihkan cadangan 1.200 produk lewat teks tempel: dialog konfirmasi menyebut 1.000 yang dimuat dan memperingatkan 200 yang tidak dimuat;
(2) setelah konfirmasi muncul pesan sukses yang jujur (1.000 produk, 200 tidak dimuat); (3) setelah muat ulang, 1.000 produk benar-benar tersimpan (bukan data lama);
(4) penjaga penutupan halaman: saat ada penulisan yang masih antre, peristiwa beforeunload meminta konfirmasi; setelah selesai tersimpan, tidak lagi. Menangkap pageerror dan error konsol.
Catatan: tes 'tutup cepat' sungguhan (menutup tab di tengah penyimpanan) tidak bisa dibuat deterministik; itu bagian uji manual pemilik."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8137
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000, d=0, p=0, t=8000, q=1, s=50, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=0, mh=[], ack=False, sup='', sku='', lnk='', o=None)
    r.update(kw); return r
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=[mkrow(0, n='Lama A'), mkrow(1, n='Lama B')], pr=[], sl=[], ts=1)))
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(SEED)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'signals' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(800)
        pg.click('#t1'); pg.wait_for_selector('#list .pc', state='visible', timeout=10000); pg.wait_for_timeout(500)
        dlg = lambda: pg.evaluate("()=>document.getElementById('dlg').textContent")
        stored = lambda: json.loads(pg.evaluate("()=>KStore.getItem('kalsara_v3')"))

        big = json.dumps(dict(A={}, rows=[mkrow(i, n=f'Migrasi {i}') for i in range(1200)], pr=[], sl=[], ts=5))
        pg.evaluate("document.getElementById('bp').click()"); pg.wait_for_timeout(200)
        pg.evaluate("([t])=>{var e=document.getElementById('bpt');e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}))}", [big])
        pg.evaluate("document.getElementById('bpg').click()"); pg.wait_for_timeout(800)
        d = dlg()
        check('Pulihkan 1.000 produk' in d, 'konfirmasi menyebut 1.000 produk yang dimuat: %r' % d[:260])
        check('Pulihkan 1.200' not in d and 'PERINGATAN' in d and '200 produk' in d, 'konfirmasi memperingatkan 200 produk tidak dimuat: %r' % d[:500])
        pg.locator('button', has_text='Ya, pulihkan').first.click()
        pg.wait_for_function("()=>/Data dipulihkan: 1\\.000 produk/.test(document.body.innerText)", timeout=30000)
        txt = pg.evaluate("()=>document.body.innerText")
        check('200 produk' in txt and 'tidak dimuat' in txt, 'pesan sukses jujur: 200 produk tidak dimuat')
        check(not pg.evaluate("()=>KStore.hasPending()"), 'saat pesan sukses muncul, tidak ada penulisan yang masih antre')
        pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=30000); pg.wait_for_timeout(1000)
        s = stored()
        check(len(s['rows']) == 1000 and s['rows'][0]['n'] == 'Migrasi 0', 'setelah muat ulang: 1.000 produk hasil pulih (bukan data lama): %d' % len(s['rows']))

        # penjaga penutupan halaman
        r = pg.evaluate("""async()=>{KStore.setItem('kunci-uji',JSON.stringify({x:'y'.repeat(200000)}));
          const e1=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e1);
          await KStore.flush();
          const e2=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e2);
          KStore.removeItem('kunci-uji');await KStore.flush();
          return [e1.defaultPrevented,e2.defaultPrevented]}""")
        check(r[0] is True, 'ada penulisan antre: beforeunload meminta konfirmasi')
        check(r[1] is False, 'sudah tersimpan: beforeunload tidak mengganggu')
        check(not errs, 'tidak boleh ada error JS: %s' % errs)
        ctx.close(); b.close()
    print(f'E2E Tahap 0 (cadangan besar dan penjaga tutup): {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
