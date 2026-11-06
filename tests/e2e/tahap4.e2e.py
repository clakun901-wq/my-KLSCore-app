"""E2E Tahap 4 (v9.40): bagian yang dipindah dari 80-cadangan-tema ke js/penyimpanan-cadangan.js dan js/pengaturan.js, diuji di Chromium nyata.
Jalankan: python3 tests/e2e/tahap4.e2e.py
Mencakup yang TIDAK tertangkap tes unit karena hanya hidup di peramban: status penyimpanan dan umur cadangan, cadangan terunduh lalu status berubah,
tab ber-pembungkus (panah/End dan tampilan Cek tarif), catatan perubahan tarif (tambah, tersimpan, hapus), kolom pengaturan (data-k) tersimpan,
reset ke bawaan, dan onboarding toko baru. Menangkap pageerror dan error konsol."""
import json, os, subprocess, time, datetime
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8150
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000, d=0, p=0, t=8000, q=1, s=50, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=0, mh=[], ack=False, sup='', sku='', lnk='')
    r.update(kw); return r
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=[mkrow(0), mkrow(1), mkrow(2)], pr=[], sl=[], ts=1)))
        def open_page(seed):
            ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block', accept_downloads=True)
            if seed: ctx.add_init_script(SEED)
            pg = ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
            pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'signals' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
            pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card' if seed else '#sy', state='visible' if seed else 'attached', timeout=20000); pg.wait_for_timeout(1200)
            return ctx, pg, errs
        # data utama ada di KStore (SQLite/OPFS), bukan localStorage: tunggu penulisan selesai (flush) lalu baca
        saved = lambda pg: json.loads(pg.evaluate("async()=>{await KStore.flush();return KStore.getItem('kalsara_v3')}"))
        sel = lambda pg, i: pg.evaluate("(i)=>document.getElementById(i).getAttribute('aria-selected')", i)

        # ---------- toko berisi (seed) ----------
        ctx, pg, errs = open_page(True)
        # 1. status penyimpanan + umur cadangan saat muat (syLocal / bkRemind dari modul penyimpanan-cadangan)
        sy = pg.inner_text('#sy')
        check('Tersimpan di perangkat ini' in sy and 'Belum pernah dicadangkan' in sy, 'status awal jujur: tersimpan di perangkat + belum pernah dicadangkan: %r' % sy)
        check(pg.evaluate("document.getElementById('bkr').hidden") is False, 'pengingat cadangan tampil (data ada, belum pernah dicadangkan)')
        # 2. cadangan terunduh, lalu status berubah jadi "hari ini" dan pengingat hilang
        with pg.expect_download(timeout=8000) as d: pg.evaluate("document.getElementById('bk').click()")
        bk = json.loads(open(d.value.path(), encoding='utf8').read())
        check(len(bk['rows']) == 3 and d.value.suggested_filename == 'cadangan-kalsara-%s.txt' % datetime.date.today().isoformat(), 'cadangan terunduh: 3 produk, nama berkas bertanggal')
        pg.wait_for_timeout(300)
        check('Cadangan terakhir: hari ini' in pg.inner_text('#sy') and pg.evaluate("document.getElementById('bkr').hidden") is True, 'sesudah cadangan: status "hari ini" dan pengingat disembunyikan')
        # 4. tab ber-pembungkus: klik Tarif -> panel Cek tarif tampil, tab terpilih; panah dan End berpindah tab
        pg.click('#t5'); pg.wait_for_timeout(200)
        check(pg.evaluate("document.getElementById('v5').hidden") is False and sel(pg, 't5') == 'true', 'tab Tarif (v5) tampil dan terpilih lewat pembungkus tab')
        pg.focus('#t0'); pg.click('#t0'); pg.focus('#t0'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(200)
        check(sel(pg, 't1') == 'true' and sel(pg, 't0') == 'false', 'ArrowRight dari tab 0 membuka tab 1')
        pg.keyboard.press('End'); pg.wait_for_timeout(200)
        check(sel(pg, 't2') == 'true', 'End membuka tab terakhir (t2)')
        pg.keyboard.press('Home'); pg.wait_for_timeout(200)
        check(sel(pg, 't0') == 'true', 'Home kembali ke tab pertama')
        check(pg.evaluate("document.getElementById('t0').tabIndex") == 0 and pg.evaluate("document.getElementById('t1').tabIndex") == -1, 'hanya tab terpilih yang bisa difokus (roving tabindex)')
        # 5. catatan perubahan tarif: tambah -> tampil + tersimpan; hapus -> hilang
        pg.click('#t5'); pg.wait_for_timeout(200)
        pg.evaluate("document.querySelectorAll('details').forEach(function(d){d.open=true})")
        pg.fill('#tlt', 'Tarif admin naik 1 persen'); pg.fill('#tld', '2026-10-01'); pg.click('#tla'); pg.wait_for_timeout(600)
        check('Tarif admin naik 1 persen' in pg.inner_text('#tll') and '1 Okt 2026' in pg.inner_text('#tll'), 'catatan tarif tampil dengan tanggal terformat: %r' % pg.inner_text('#tll')[:120])
        check(saved(pg)['A'].get('tlog') == [{'d': '2026-10-01', 't': 'Tarif admin naik 1 persen'}], 'catatan tarif ikut tersimpan di data utama')
        pg.click('#tll [data-tld="0"]'); pg.wait_for_timeout(600)
        check('Tarif admin naik 1 persen' not in pg.inner_text('#tll') and saved(pg)['A'].get('tlog') == [], 'catatan tarif terhapus dari tampilan dan dari data tersimpan')
        pg.fill('#tlt', ''); 
        pg.click('#tla'); pg.wait_for_timeout(200)
        check(saved(pg)['A'].get('tlog') == [], 'catatan kosong ditolak (tidak ada entri baru)')
        # 6. kolom pengaturan (data-k) tersimpan; 7. reset ke bawaan lewat dialog
        pg.click('#t0'); pg.wait_for_timeout(200); pg.evaluate("document.querySelectorAll('details').forEach(function(d){d.open=true})")
        pg.evaluate("()=>{var e=document.getElementById('fl');e.value='1500';e.dispatchEvent(new Event('input',{bubbles:true}))}"); pg.wait_for_timeout(900)
        check(saved(pg)['A']['fl'] == 1500, 'kolom pengaturan "Nominal biaya proses" tersimpan: fl=1500')
        pg.evaluate("document.getElementById('def').click()"); pg.wait_for_timeout(300)
        check('Kembalikan semua pengaturan' in pg.evaluate("document.getElementById('dlgm').textContent"), 'reset bawaan meminta konfirmasi dulu')
        pg.click('#dy'); pg.wait_for_timeout(900)
        check(saved(pg)['A']['fl'] == 1250 and len(saved(pg)['rows']) == 3, 'reset mengembalikan fl=1250 tanpa menghapus 3 produk')
        # 8. muat ulang: data bertahan, status tetap jujur, tidak ada error JS
        pg.reload(); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(800)
        check(len(saved(pg)['rows']) == 3 and 'Tersimpan di perangkat ini' in pg.inner_text('#sy'), 'setelah muat ulang: 3 produk masih ada dan status tampil')
        check(not errs, 'tidak boleh ada error JS (toko berisi): %s' % errs)
        ctx.close()

        # ---------- toko baru (tanpa seed): onboarding ----------
        ctx, pg, errs = open_page(False)
        check(pg.evaluate("document.getElementById('ob').hidden") is False, 'toko baru: panel onboarding tampil')
        pg.click('#t1'); pg.wait_for_timeout(300)  # panel onboarding berada di tab Produk (sama seperti v9.39)
        pg.select_option('#obt', 'ml'); pg.click('#obs'); pg.wait_for_timeout(900)
        check(pg.evaluate("document.getElementById('ob').hidden") is True and saved(pg)['A']['tp'] == 'ml' and saved(pg)['A']['pb'] == 1.8, 'onboarding menyimpan tipe toko (tp=ml, pb=1.8) dan menutup panel')
        pg.reload(); pg.wait_for_selector('#sy', state='attached', timeout=20000); pg.wait_for_timeout(1500); pg.click('#t1'); pg.wait_for_timeout(300)
        check(pg.evaluate("document.getElementById('ob').hidden") is True, 'onboarding tidak muncul lagi setelah muat ulang (kalsara_ob tersimpan)')
        pg.click('#thm'); pg.wait_for_timeout(200)
        check(pg.evaluate("document.documentElement.getAttribute('data-theme')") in ('light', 'dark'), 'tombol tema masih berfungsi (createTheme dipasang modul pengaturan)')
        check(not errs, 'tidak boleh ada error JS (toko baru): %s' % errs)
        ctx.close(); b.close()
    print(f'E2E Tahap 4 (penyimpanan-cadangan + pengaturan): {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
