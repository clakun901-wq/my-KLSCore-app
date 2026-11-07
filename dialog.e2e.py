"""E2E dialog konfirmasi (ask), penutup latar (inert) dan toast di Chromium nyata (v9.28: js/ui.js terpasang di legacy).
Jalankan: python3 tests/e2e/dialog.e2e.py
Alur (tab Hitung): hapus produk membuka dialog (pesan, fokus di Batal, latar inert), Tab/Shift+Tab mengurung fokus, Escape/klik latar/Batal
menutup dan mengembalikan fokus ke tombol pemicu, Ya menghapus produk; toast tampil lalu hilang sendiri dan toast beruntun mereset timer.
Menangkap pageerror dan error konsol (mis. sisa global yang sudah pindah ke modul)."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8131
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
def mkrow(i, **kw):
    r = dict(id=f'p{i}', n=f'Produk {i}', m=20000, d=0, p=0, t=1000, q=1, s=20, live=True, ha=0, hd=0, c=False, cx=0, sd='', mb=0, mh=[], ack=False, sup='', sku='', lnk='', o=None)
    r.update(kw); return r
rows = [mkrow(1, n='Rak Buku', m=42320), mkrow(2, n='Kaos Polos'), mkrow(3, n='Topi Rajut', m=15000)]
SEED = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=[], ts=1)))
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(SEED)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'signals' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('kalsara-product-card', timeout=20000); pg.wait_for_timeout(500)
        pg.click('#t1'); pg.wait_for_timeout(500)
        count = lambda: pg.locator('#list .pc').count()
        active = lambda: pg.evaluate("document.activeElement && document.activeElement.id")
        inert = lambda: pg.evaluate("['main','nav','header'].map(t=>document.querySelector(t).inert).concat([document.getElementById('fab').inert])")
        toast_cls = lambda: pg.evaluate("document.getElementById('tt').className")
        opendlg = lambda: (pg.locator('#list .pc .x').first.click(), pg.wait_for_timeout(150))
        check(count() == 3, 'tiga produk di tab Hitung')

        # 1. Dialog terbuka: pesan, fokus di Batal, latar inert
        opendlg()
        check(pg.is_visible('#dlg') and 'Hapus' in pg.inner_text('#dlgm') and pg.inner_text('#dy') == 'Ya, hapus', 'dialog tampil dengan pesan dan label tombol konfirmasi')
        check(active() == 'dn', 'fokus awal di tombol Batal')
        check(inert() == [True, True, True, True], 'main, nav, header, dan FAB dibuat inert saat dialog terbuka')

        # 2. Tab/Shift+Tab mengurung fokus di dua tombol
        pg.keyboard.press('Tab'); check(active() == 'dy', 'Tab memindahkan fokus ke Ya, hapus')
        pg.keyboard.press('Tab'); check(active() == 'dn', 'Tab di tombol terakhir kembali ke Batal (fokus terkurung)')
        pg.keyboard.press('Shift+Tab'); check(active() == 'dy', 'Shift+Tab mundur ke Ya, hapus')

        # 3. Escape menutup, fokus kembali ke tombol pemicu, inert dilepas
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
        check(pg.is_hidden('#dlg') and inert() == [False, False, False, False], 'Escape menutup dialog dan melepas inert')
        check(pg.evaluate("document.activeElement.classList.contains('x')"), 'fokus dikembalikan ke tombol Hapus produk yang memicu')
        check(count() == 3, 'Escape tidak menghapus produk')

        # 4. Klik latar menutup; klik di dalam dialog tidak menutup
        opendlg(); pg.locator('#dlgm').click(); check(pg.is_visible('#dlg'), 'klik di dalam kotak dialog tidak menutupnya')
        pg.locator('#dlg').click(position={'x': 3, 'y': 3}); pg.wait_for_timeout(100); check(pg.is_hidden('#dlg') and count() == 3, 'klik latar menutup dialog tanpa menghapus')

        # 5. Batal menutup tanpa menghapus
        opendlg(); pg.click('#dn'); pg.wait_for_timeout(100); check(pg.is_hidden('#dlg') and count() == 3, 'Batal menutup tanpa menghapus')

        # 6. Ya menghapus produk (callback jalan setelah dialog tertutup)
        opendlg(); pg.click('#dy'); pg.wait_for_timeout(300)
        check(pg.is_hidden('#dlg') and count() == 2 and inert() == [False, False, False, False], 'Ya, hapus menutup dialog, menghapus produk, melepas inert')

        # 7. Toast: tampil, hilang sendiri, dan beruntun mereset timer (Duplikat produk memicu toast)
        pg.locator('#list .pc .dp').first.click(); pg.wait_for_function("document.getElementById('tt').textContent.includes('Produk diduplikat')", timeout=3000)
        check(toast_cls() == 'toast on', 'toast tampil setelah Duplikat produk'); pg.wait_for_timeout(900)
        pg.locator('#list .pc .dp').first.click(); t0 = time.time(); pg.wait_for_timeout(900)
        check(toast_cls() == 'toast on', 'toast kedua mereset timer (masih tampil 1,8 dtk setelah yang pertama)')
        pg.wait_for_function("document.getElementById('tt').className==='toast'", timeout=5000); el = time.time() - t0
        check(toast_cls() == 'toast' and 1.2 <= el <= 2.4, 'toast hilang sendiri ±1,6 dtk setelah yang terakhir (terukur %.2f dtk)' % el)
        check(count() == 4, 'dua kali duplikat: 2 -> 4 produk')
        check(not errs, 'tidak boleh ada pageerror/error konsol: ' + '; '.join(errs))
        b.close()
    print(f'E2E Dialog/toast: {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
