"""E2E tab Hitung dengan 1.000 produk (hidrasi malas). Jalankan: python3 tests/e2e/hitung.e2e.py"""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); PORT = 8124
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
N = 1000
rows = [dict(id=f'p{i}', n=f'Produk {i:04d}', m=20000 + (i % 50) * 997, d=0, p=0, t=1000, q=1, s=20 + i % 30, live=(i % 4 == 0), ha=0, hd=0,
             c=False, cx=0, sd='', mb=20000 + (i % 50) * 997, mh=[], ack=False, sup='', sku='', lnk='', o=None) for i in range(N)]
seed = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows, pr=[], sl=[], ts=1)))
ok = 0
def check(c, m):
    global ok
    if not c: raise AssertionError(m)
    ok += 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx.add_init_script(seed)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        t0 = time.time(); pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_selector('#list .pc', state='attached', timeout=60000)
        pg.wait_for_function("document.querySelectorAll('#list .pc').length>=1000", timeout=60000); boot = round((time.time() - t0) * 1000)
        print('boot sampai 1.000 kartu ada di DOM:', boot, 'ms')
        pg.wait_for_function("document.getElementById('s1').textContent==='1000'", timeout=60000); full_boot = round((time.time() - t0) * 1000)
        print('boot sampai ringkasan 1.000 produk lengkap (Worker batch):', full_boot, 'ms')
        total = pg.evaluate("document.querySelectorAll('#list .pc').length"); hyd = pg.evaluate("document.querySelectorAll('#list .pc:not(.lz)').length")
        print('kartu', total, 'terbangun', hyd)
        check(total == N, f'harus {N} kartu, dapat {total}'); check(hyd < 200, f'hanya sebagian kartu boleh terbangun, dapat {hyd}')
        check(pg.evaluate("document.getElementById('tp1').textContent") == str(N), 'ringkasan Total produk = 1000')
        check(pg.evaluate("document.getElementById('tp2').textContent") == str(N // 4), 'ringkasan Sudah live = 250')
        # tab Hitung + ketik di produk pertama
        pg.locator('nav button').nth(1).click(); pg.wait_for_timeout(800)
        ms = pg.evaluate("""()=>{const i=document.querySelector('#list .pc:not(.lz) input[data-f="m"]');i.value='25.000';const t=performance.now();i.dispatchEvent(new Event('input',{bubbles:true}));return Math.round(performance.now()-t)}""")
        print('satu ketikan (upd penuh, 1.000 produk):', ms, 'ms')
        check(ms < 250, f'satu ketikan terlalu lambat: {ms} ms')
        s3 = pg.evaluate("document.getElementById('s3').textContent"); check(s3 and s3 != '-', 'ringkasan untung terisi setelah edit satu produk')
        # scroll ke bawah -> kartu terakhir harus terbangun otomatis
        for _ in range(40):  # gulir bertahap sampai kartu terakhir terlihat (kartu dibangun sambil menggulir)
            pg.evaluate("document.querySelector('#list').lastElementChild.scrollIntoView()"); pg.wait_for_timeout(150)
            if pg.evaluate("document.querySelector('#list').lastElementChild.getBoundingClientRect().top<900"): break
        pg.wait_for_timeout(600)
        last = pg.evaluate("(()=>{const c=document.querySelector('#list .pc:last-child');return {lz:c.classList.contains('lz'),inputs:c.querySelectorAll('input[data-f]').length,name:c.querySelector('.nm')?.value}})()")
        print('kartu terakhir setelah scroll:', last)
        check(not last['lz'] and last['inputs'] >= 4 and last['name'] == 'Produk 0999', 'kartu terakhir terbangun dengan data benar saat di-scroll')
        nh = pg.evaluate("document.querySelectorAll('#list .pc:not(.lz)').length"); print('terbangun setelah menggulir sampai bawah:', nh); check(nh < 600, 'hidrasi tetap terbatas setelah scroll')
        check(not errs, f'tidak boleh ada error JS: {errs}')
        # edit di kartu hasil hidrasi malas tersimpan ke data
        pg.evaluate("""()=>{const i=document.querySelector('#list .pc:last-child input[data-f="t"]');i.value='7.000';i.dispatchEvent(new Event('input',{bubbles:true}))}"""); pg.wait_for_timeout(900)
        fast = pg.evaluate("['s1','s2','s3','s4','s5','tp1','tp2','tp3'].map(i=>document.getElementById(i).textContent)")
        ctx.close()
        # Pembanding: data identik (produk 0 modal 25.000; produk terakhir target 7.000) dihitung PENUH saat boot harus memberi agregat sama
        rows2 = json.loads(json.dumps(rows)); rows2[0]['m'] = 25000; rows2[-1]['t'] = 7000
        seed2 = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={}, rows=rows2, pr=[], sl=[], ts=1)))
        ctx2 = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx2.add_init_script(seed2)
        pg2 = ctx2.new_page(); pg2.goto(f'http://127.0.0.1:{PORT}/index.html'); pg2.wait_for_function("document.querySelectorAll('#list .pc').length>=1000", timeout=60000); pg2.wait_for_timeout(1500)
        full = pg2.evaluate("['s1','s2','s3','s4','s5','tp1','tp2','tp3'].map(i=>document.getElementById(i).textContent)")
        print('agregat jalur cepat:', fast); print('agregat hitung penuh:', full)
        check(fast == full, 'agregat jalur cepat harus sama dengan hitung penuh')
        ctx2.close()
        # Ubah setelan GLOBAL (iklan 2%) dengan 1.000 produk: utas utama tidak boleh macet, hasil akhir harus sama dengan boot memakai setelan itu
        ctx3 = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx3.add_init_script(seed)
        pg3 = ctx3.new_page(); pg3.goto(f'http://127.0.0.1:{PORT}/index.html'); pg3.wait_for_function("document.getElementById('s1').textContent==='1000'", timeout=60000); pg3.wait_for_timeout(500)
        before = pg3.evaluate("document.getElementById('s3').textContent")
        blocked = pg3.evaluate("""()=>{const i=document.getElementById('ads');i.value='2';const t=performance.now();i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));return Math.round(performance.now()-t)}""")
        print('utas utama terblokir saat ubah setelan global (1.000 produk):', blocked, 'ms')
        check(blocked < 400, f'ubah setelan global tidak boleh memblokir utas utama lama: {blocked} ms')
        pg3.wait_for_function("document.getElementById('s3').textContent!==%s" % json.dumps(before), timeout=30000); pg3.wait_for_timeout(1500)
        after = pg3.evaluate("['s1','s2','s3','s4','s5'].map(i=>document.getElementById(i).textContent)")
        ctx3.close()
        seed4 = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={'ads': 2}, rows=rows, pr=[], sl=[], ts=1)))
        ctx4 = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx4.add_init_script(seed4)
        pg4 = ctx4.new_page(); pg4.goto(f'http://127.0.0.1:{PORT}/index.html'); pg4.wait_for_function("document.getElementById('s1').textContent==='1000'", timeout=60000); pg4.wait_for_timeout(1500)
        ref = pg4.evaluate("['s1','s2','s3','s4','s5'].map(i=>document.getElementById(i).textContent)")
        print('setelan diubah lewat Worker batch:', after); print('boot dengan setelan itu     :', ref)
        check(after == ref, 'hasil setelah ubah setelan global harus sama dengan boot memakai setelan itu')
        ctx4.close()
        # Ketikan beruntun cepat (1,2,3,4,5): balasan Worker usang harus dibuang, hasil akhir = nilai terakhir
        ctx5 = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx5.add_init_script(seed)
        pg5 = ctx5.new_page(); pg5.goto(f'http://127.0.0.1:{PORT}/index.html'); pg5.wait_for_function("document.getElementById('s1').textContent==='1000'", timeout=60000); pg5.wait_for_timeout(500)
        for v in ['1', '2', '3', '4', '5']:
            pg5.evaluate("(v)=>{const i=document.getElementById('ads');i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}", v); pg5.wait_for_timeout(40)
        pg5.wait_for_timeout(4000)
        rapid = pg5.evaluate("['s1','s2','s3','s4','s5'].map(i=>document.getElementById(i).textContent)")
        seed6 = "try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}" % json.dumps(json.dumps(dict(A={'ads': 5}, rows=rows, pr=[], sl=[], ts=1)))
        ctx6 = b.new_context(viewport={'width': 412, 'height': 900}, service_workers='block'); ctx6.add_init_script(seed6)
        pg6 = ctx6.new_page(); pg6.goto(f'http://127.0.0.1:{PORT}/index.html'); pg6.wait_for_function("document.getElementById('s1').textContent==='1000'", timeout=60000); pg6.wait_for_timeout(1500)
        ref5 = pg6.evaluate("['s1','s2','s3','s4','s5'].map(i=>document.getElementById(i).textContent)")
        print('ketikan beruntun:', rapid, '| referensi iklan 5%:', ref5)
        check(rapid == ref5, 'ketikan beruntun cepat harus berakhir pada hasil nilai terakhir (tanpa hasil usang)')
        b.close()
    print(f'E2E Hitung 1.000 produk: {ok} assertions passed di Chromium nyata')
finally:
    srv.terminate()
