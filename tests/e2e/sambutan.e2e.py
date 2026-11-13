"""E2E v9.55: kartu sambutan aplikasi kosong + tambah produk dari file Shopee Mass Update (xlsx asli pemilik) di Chromium nyata."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..')); PORT=8153
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=0
def check(c,m):
 global ok
 if not c: raise AssertionError(m)
 ok+=1
FX=os.path.join(ROOT,'tests','fixtures')
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
  ctx=b.new_context(viewport={'width':412,'height':900},service_workers='block',accept_downloads=True)
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://127.0.0.1:{PORT}/index.html');pg.wait_for_selector('#sy',state='attached',timeout=20000);pg.wait_for_timeout(1000)
  saved=lambda:pg.evaluate("async()=>{await KStore.flush();return JSON.parse(KStore.getItem('kalsara_v3'))}")
  pg.click('#t1');pg.wait_for_timeout(500)
  check(not pg.locator('#sm').is_hidden(),'kartu sambutan tampil di aplikasi kosong')
  check('Masukkan produk Anda' in pg.locator('#sm').inner_text(),'judul kartu')
  with pg.expect_download() as dl: pg.click('#smx')
  check(dl.value.suggested_filename=='template-produk-wulfeg.csv','tombol 1 mengunduh template')
  with pg.expect_file_chooser() as fc: pg.click('#smi')
  check(fc.value is not None,'tombol 3 membuka pemilih file CSV')
  pg.click('#smo');pg.wait_for_timeout(300)
  check(pg.evaluate("document.activeElement&&document.activeElement.classList.contains('nm')"),'isi satu produk memfokuskan kolom nama')
  pg.keyboard.type('Kaos Polos');pg.wait_for_timeout(400)
  check(pg.locator('#sm').is_hidden(),'kartu hilang saat mengetik nama')
  pg.fill('#list .nm','');pg.wait_for_timeout(400)
  check(not pg.locator('#sm').is_hidden(),'kartu muncul lagi bila nama dikosongkan')
  # Impor Shopee: Informasi Penjualan asli
  with pg.expect_file_chooser() as fc: pg.click('#smp')
  fc.value.set_files(os.path.join(FX,'shopee-informasi-penjualan.xlsx'));pg.wait_for_timeout(1500)
  t=pg.locator('#dlgm').inner_text()
  check(t.startswith('Impor 91 produk dari Shopee?'),'dialog 91 produk (62 listing, variasi dipecah): '+t[:120])
  check('Modal belum ada' in t and 'tanpa SKU' not in t.split('Catatan')[0],'catatan modal kosong')
  check('6 produk belum punya SKU' in t,'catatan 6 tanpa SKU: '+t)
  pg.click('#dy');pg.wait_for_timeout(2500)
  d=saved();rs=[r for r in d['rows'] if r.get('n')]
  check(len(rs)==91,'91 produk tersimpan, kosong tidak dihitung: %d'%len(rs))
  check(all(r['m']==0 for r in rs),'modal 0 semua (tidak ada di file Shopee)')
  pintu=[r for r in rs if r.get('sku')=='SKU0001'][0]
  check(pintu['ha']==45000 and pintu['s']==10 and pintu['n'].endswith(' - Hitam'),'harga, stok, nama+variasi terisi: '+json.dumps(pintu)[:200])
  check(all(len(r['n'])<=120 for r in rs),'nama maksimal 120 huruf')
  check(pg.locator('#sm').is_hidden(),'kartu hilang setelah impor')
  # Impor ulang: tidak boleh dobel
  pg.click('#t1') if False else None
  pg.set_input_files('#spf',os.path.join(FX,'shopee-informasi-penjualan.xlsx'));pg.wait_for_timeout(1500)
  t=pg.locator('#dlgm').inner_text()
  check('Semua 91 produk di file sudah ada' in t,'impor ulang: semua sudah ada: '+t[:150])
  pg.click('#dy');pg.wait_for_timeout(300)
  check(len([r for r in saved()['rows'] if r.get('n')])==91,'tidak ada produk ganda')
  # File Informasi Dasar: nama produk tanpa variasi, tidak boleh error
  pg.set_input_files('#spf',os.path.join(FX,'shopee-informasi-dasar.xlsx'));pg.wait_for_timeout(1500)
  t=pg.locator('#dlgm').inner_text()
  check(t.startswith('Impor ') and 'dari Shopee?' in t,'Informasi Dasar terbaca: '+t[:120])
  pg.click('#dx') if pg.locator('#dx').count() else None
  check(not errs,'tidak ada galat halaman: '+str(errs))
  # Pengguna lama dengan produk terisi tidak melihat kartu
  pg.reload();pg.wait_for_selector('#sy',state='attached',timeout=20000);pg.wait_for_timeout(1200);pg.click('#t1');pg.wait_for_timeout(500)
  check(pg.locator('#sm').is_hidden(),'kartu tidak tampil bila produk sudah ada')
  b.close()
 print(f'E2E sambutan: {ok} pernyataan lulus')
finally:
 srv.terminate()
