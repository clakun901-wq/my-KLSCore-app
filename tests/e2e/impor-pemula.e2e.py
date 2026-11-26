"""E2E v9.58: impor massal untuk pengguna baru: file Excel (.xlsx) langsung, tempel dari spreadsheet, baris contoh dilewati, nomor baris bermasalah."""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..')); PORT=8154
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
  check(not pg.locator('#sm').is_hidden(),'kartu sambutan tampil')
  with pg.expect_file_chooser() as fc: pg.click('#smi')
  check(fc.value is not None,'tombol utama membuka pemilih file')
  # tempel kosong: pesan jelas, tidak ada dialog
  pg.click('#smtb');check(not pg.locator('#smtw').is_hidden(),'panel tempel terbuka')
  pg.click('#smtg');pg.wait_for_timeout(200)
  check('Tidak ada isi' in pg.locator('#smst').inner_text(),'tempel kosong ditolak dengan pesan')
  # 0. Template Excel: unduh, lalu impor lagi = tidak ada produk (hanya baris contoh), tanpa galat
  with pg.expect_download() as dl: pg.click('#smxl')
  check(dl.value.suggested_filename=='template-produk-wulfeg.xlsx','tombol template Excel mengunduh .xlsx')
  tpl=os.path.join(ROOT,'tests','.tmp-template.xlsx');dl.value.save_as(tpl)
  check(open(tpl,'rb').read(2)==b'PK','file unduhan berupa zip/xlsx')
  pg.set_input_files('#xp',tpl);pg.wait_for_timeout(1200)
  t=pg.locator('#dlgm').inner_text()
  check(t.startswith('Tidak ada baris valid.'),'template kosong tidak mengimpor baris contoh: '+t[:120])
  pg.click('#dn') if pg.locator('#dn').count() else pg.keyboard.press('Escape')
  pg.wait_for_timeout(300);os.remove(tpl)
  # 1. File Excel langsung (judul file di atas header, baris contoh, entitas XML, SKU angka)
  pg.set_input_files('#xp',os.path.join(FX,'template-impor-pemula.xlsx'));pg.wait_for_timeout(1500)
  t=pg.locator('#dlgm').inner_text()
  check(t.startswith('Impor 3 produk baru?') and 'Tas & Dompet <Mini>' in t,'xlsx: 3 produk (contoh dan baris tanpa modal tidak ikut): '+t[:160])
  check('1 baris contoh dari template dilewati' in t and '(baris 5' in t,'xlsx: contoh dan nomor baris bermasalah disebut: '+t)
  pg.click('#dy');pg.wait_for_timeout(2500)
  rs=[r for r in saved()['rows'] if r.get('n')];by={r.get('sku'):r for r in rs}
  check(len(rs)==3 and set(by)=={'KAOS-01','TAS-01','8991234'},'xlsx: tiga produk tersimpan: '+str(sorted(by)))
  check(by['KAOS-01']['m']==35000 and by['KAOS-01']['p']==500 and by['KAOS-01']['t']==5000 and by['KAOS-01']['s']==20,'xlsx: angka tersimpan benar')
  check(by['TAS-01']['n']=='Tas & Dompet <Mini>','xlsx: nama dengan & < > utuh')
  check(pg.locator('#sm').is_hidden(),'kartu hilang setelah impor')
  # 3. Tempel dari spreadsheet (tab-separated, angka gaya Indonesia) di aplikasi kosong
  pg.click('#rst');pg.wait_for_timeout(300);pg.click('#dy');pg.wait_for_timeout(1500)
  pg.click('#t1');pg.wait_for_timeout(500)
  check(not pg.locator('#sm').is_hidden(),'kartu muncul lagi di aplikasi kosong')
  if pg.locator('#smtw').is_hidden(): pg.click('#smtb')
  pg.fill('#smt',"Nama produk\tModal / HPP per pcs\tBiaya packing\tTarget untung\tSKU\nKaos Polos\t35.000\t500\t5.000\tKAOS-01\nGelas Kopi\t8.000\t300\t1.500\tGLS-01\nTanpa Modal\t\t300\t1.000\tX1")
  pg.click('#smtg');pg.wait_for_timeout(800)
  t=pg.locator('#dlgm').inner_text()
  check(t.startswith('Impor 2 produk baru?') and '(baris 4' in t,'tempel: 2 produk, baris 4 dilaporkan: '+t)
  pg.click('#dy');pg.wait_for_timeout(2500)
  rs=[r for r in saved()['rows'] if r.get('n')]
  check([(r['n'],r['m'],r['sku']) for r in rs]==[('Kaos Polos',35000,'KAOS-01'),('Gelas Kopi',8000,'GLS-01')],'tempel: produk tersimpan benar')
  check(pg.locator('#smt').input_value()=='' ,'kotak tempel dikosongkan setelah berhasil')
  # 4. Excel lama (.xls) dan file rusak: pesan jelas, tanpa galat
  pg.click('#rst');pg.wait_for_timeout(300);pg.click('#dy');pg.wait_for_timeout(1500);pg.click('#t1');pg.wait_for_timeout(400)
  tmp=os.path.join(ROOT,'tests','.tmp-pemula.xlsx');open(tmp,'wb').write(b'ini bukan file excel')
  pg.set_input_files('#xp',tmp);pg.wait_for_timeout(800)
  check('tidak terbaca' in pg.locator('#smst').inner_text(),'.xlsx rusak: pesan jelas: '+pg.locator('#smst').inner_text())
  os.remove(tmp)
  tmp=os.path.join(ROOT,'tests','.tmp-pemula.xls');open(tmp,'wb').write(b'x')
  pg.set_input_files('#xp',tmp);pg.wait_for_timeout(400)
  check('.xls lama tidak didukung' in pg.locator('#smst').inner_text(),'.xls ditolak dengan petunjuk')
  os.remove(tmp)
  check(not errs,'tidak ada galat halaman: '+str(errs))
  b.close()
 print(f'E2E impor pemula (v9.58): {ok} pernyataan lulus')
finally:
 srv.terminate()
