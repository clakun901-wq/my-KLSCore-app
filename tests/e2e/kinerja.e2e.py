"""E2E Tahap 9 (v9.48) di Chromium nyata: pembagian halaman Etalase dengan 1.000 produk live, data tetap utuh,
penanda data-berubah, dan Hitung tidak dihitung ulang tanpa perubahan. Jalankan: python3 tests/e2e/kinerja.e2e.py"""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8131
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
N = 1000
def mk(i): return dict(id=f'p{i}', n=f'Produk {i:04d}', m=20000 + (i % 50) * 997, d=0, p=0, t=1000, q=1, s=20 + i % 30, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=20000 + (i % 50) * 997, mh=[], ack=False, sup='', sku='', lnk='', o=None)
rows = [mk(i) for i in range(N)]
seed = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=[], ts=1)))
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
CARDS = "document.querySelectorAll('#shl kalsara-product-card').length"
NAMES = "[...document.querySelectorAll('#shl kalsara-product-card')].map(c=>c.shadowRoot.querySelector('.snb').textContent.trim())"
def boot(b, qs=''):
    ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(seed)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{PORT}/index.html{qs}'); pg.wait_for_function("document.getElementById('s1').textContent==='1000'", timeout=120000); pg.wait_for_timeout(800)
    return ctx, pg, errs
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx, pg, errs = boot(b, '?perf=1')
        # 1) 1.000 produk live: hanya 50 kartu di DOM, tetapi seluruh data utuh dan terhitung.
        check(pg.evaluate(CARDS) == 50, 'halaman 1 harus 50 kartu, bukan 1.000')
        check(pg.evaluate("KPerf.report().produk") == N and pg.evaluate("document.getElementById('tp1').textContent") == '1000', 'data 1.000 produk utuh')
        check(pg.evaluate("document.getElementById('shn').textContent").startswith('1000 produk live'), 'penghitung Etalase tetap menyebut seluruh 1.000 produk live')
        check('dari 1.000' in pg.locator('#shpg .pgi').inner_text() and 'dari 20' in pg.locator('#shpg .pgm').inner_text(), 'penanda: 20 halaman, 1.000 produk')
        check(pg.locator('#shpt').is_visible() and pg.locator('#shpg').is_visible(), 'penanda atas dan bawah tampil')
        check(pg.locator('#shpg button').nth(0).is_disabled(), '"Sebelumnya" nonaktif di halaman 1')
        n1 = pg.evaluate(NAMES)
        # 2) Berikutnya, loncat ke halaman tertentu, halaman terakhir.
        pg.locator('#shpg button').nth(1).click(); pg.wait_for_timeout(250)
        n2 = pg.evaluate(NAMES); check(len(n2) == 50 and not set(n1) & set(n2), 'halaman 2: 50 produk lain, tidak tumpang tindih')
        inp = pg.locator('#shpg input'); inp.fill('20'); inp.dispatch_event('change'); pg.wait_for_timeout(250)
        check(pg.evaluate(CARDS) == 50 and pg.locator('#shpg button').nth(1).is_disabled(), 'loncat ke halaman 20: 50 kartu, "Berikutnya" nonaktif')
        inp.fill('999'); inp.dispatch_event('change'); pg.wait_for_timeout(250)
        check(inp.input_value() == '20', 'loncat melewati batas dijepit ke halaman terakhir')
        # 3) Semua 1.000 produk muncul tepat sekali bila seluruh halaman dibaca (data tidak hilang/terpotong/dobel).
        seen = []
        for pgn in range(1, 21):
            inp.fill(str(pgn)); inp.dispatch_event('change'); pg.wait_for_timeout(120); seen += pg.evaluate(NAMES)
        check(len(seen) == N and len(set(seen)) == N, f'1.000 produk tampil tepat sekali lintas halaman (dapat {len(seen)}, unik {len(set(seen))})')
        check(sorted(seen) == [f'Produk {i:04d}' for i in range(N)], 'nama-nama produk lengkap, tidak ada yang berubah')
        # 4) Stok di halaman 2 tetap menunjuk produk yang BENAR (nomor produk global, bukan nomor di halaman).
        inp.fill('2'); inp.dispatch_event('change'); pg.wait_for_timeout(250)
        card = pg.locator('#shl kalsara-product-card').nth(3); nama = card.locator('.snb').inner_text().strip()
        card.locator('.lkb').click(); pg.wait_for_timeout(250)
        card = pg.locator('#shl kalsara-product-card').nth(3); sebelum = int(card.locator('input[inputmode=numeric]').input_value().replace('.', ''))
        card.locator('.stp button').nth(1).click(); pg.wait_for_timeout(300)
        idx = int(nama.split()[-1]); stok = pg.evaluate("(i)=>JSON.parse(KStore.getItem('kalsara_v3')).rows[i].s", idx)
        pg.wait_for_timeout(800); stok = pg.evaluate("(i)=>JSON.parse(KStore.getItem('kalsara_v3')).rows[i].s", idx)
        check(stok == sebelum + 1, f'tombol + di halaman 2 menaikkan stok {nama}: {sebelum} -> {stok}')
        # 5) Penanda data-berubah: pindah tab tanpa perubahan = shop() dilewati, elemen kartu dipakai ulang.
        pg.locator('#t0').click(); pg.wait_for_timeout(200)  # tutup gembok lewat etAll saat meninggalkan tab
        pg.locator('#t1').click(); pg.wait_for_timeout(300); pg.locator('#t0').click(); pg.wait_for_timeout(300)
        pg.evaluate("window.__c0=document.querySelector('#shl kalsara-product-card');KPerf.reset();window.__st=KEtalaseHalaman.stats()")
        for _ in range(3):
            pg.locator('#t1').click(); pg.wait_for_timeout(150); pg.locator('#t0').click(); pg.wait_for_timeout(150)
        st = pg.evaluate("KEtalaseHalaman.stats()")
        check(st['rendered'] == pg.evaluate('window.__st')['rendered'] and st['skipped'] >= pg.evaluate('window.__st')['skipped'] + 3, f'3x bolak-balik tanpa perubahan: shop() dilewati, tidak dirender ulang: {st}')
        check(pg.evaluate("window.__c0===document.querySelector('#shl kalsara-product-card')"), 'elemen kartu sama (tidak dibuat ulang)')
        fn = pg.evaluate("KPerf.report().fungsi")
        check('upd' not in fn, f'membuka Hitung tanpa perubahan TIDAK menjalankan upd() (1.000 produk dihitung ulang): {list(fn)}')
        pg.locator('#shpg input').fill('1'); pg.locator('#shpg input').dispatch_event('change'); pg.wait_for_timeout(250)  # kembali ke halaman 1 (produk yang diedit di bawah ada di halaman 1)
        # 6) Data berubah di Hitung -> Etalase ikut berubah (penanda tidak membuat tampilan basi).
        pg.locator('#t1').click(); pg.wait_for_timeout(500)
        harga0 = pg.evaluate("document.querySelector('#shl kalsara-product-card').shadowRoot.textContent")
        pg.evaluate("""()=>{const i=document.querySelector('#list .pc:not(.lz) input[data-f="m"]');i.value='95.000';i.dispatchEvent(new Event('input',{bubbles:true}))}"""); pg.wait_for_timeout(900)
        pg.locator('#t0').click(); pg.wait_for_timeout(500)
        harga1 = pg.evaluate("document.querySelector('#shl kalsara-product-card').shadowRoot.textContent")
        check(harga1 != harga0, 'isi kartu pertama di Etalase berubah setelah modal diubah di Hitung (penanda tidak membuat tampilan basi)')
        # 7) Gembok terbuka lalu pindah tab: saat kembali, gembok tertutup lagi.
        pg.locator('#shl kalsara-product-card').nth(0).locator('.lkb').click(); pg.wait_for_timeout(250)
        check(pg.locator('#shl kalsara-product-card').nth(0).locator('.lkb.on').count() == 1, 'gembok terbuka')
        pg.locator('#t1').click(); pg.wait_for_timeout(300); pg.locator('#t0').click(); pg.wait_for_timeout(400)
        check(pg.locator('#shl kalsara-product-card').nth(0).locator('.lkb.on').count() == 0, 'gembok tertutup lagi setelah pindah tab')
        check(not errs, f'tidak boleh ada error JS: {errs}')
        ctx.close()
        # 8) ?hal=25 mengubah ukuran halaman; tanpa ?perf=1 tidak ada KPerf dan tidak ada panel.
        ctx, pg, errs = boot(b, '?hal=25')
        check(pg.evaluate(CARDS) == 25 and 'dari 40' in pg.locator('#shpg .pgm').inner_text(), '?hal=25: 25 kartu, 40 halaman')
        check(pg.evaluate("typeof KPerf")=='undefined' and pg.locator('button:has-text("Kinerja")').count() == 0, 'tanpa ?perf=1: tidak ada KPerf dan tidak ada tombol Kinerja')
        check(not errs, f'tidak boleh ada error JS: {errs}')
        ctx.close()
        # 9) Satu halaman saja (<= 50 produk live): penanda halaman tersembunyi, perilaku seperti sebelumnya.
        small = [mk(i) for i in range(30)]
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block')
        ctx.add_init_script("try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=small, pr=[], sl=[], ts=1))))
        pg = ctx.new_page(); pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=30000); pg.wait_for_timeout(500)
        check(pg.evaluate(CARDS) == 30 and pg.locator('#shpg').is_hidden() and pg.locator('#shpt').is_hidden(), '30 produk: semua tampil, tanpa penanda halaman')
        ctx.close(); b.close()
    print(f'E2E Tahap 9 (kinerja/Etalase berhalaman): {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
