"""E2E Tahap 5 (v9.41): tab, impor CSV, sinkron supplier, ekspor, dan impor harga aktual di Chromium."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..')); PORT=8151
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=0
def check(c,m):
 global ok
 if not c: raise AssertionError(m)
 ok+=1
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
  row=dict(id='p0',n='Produk Lama',m=20000,d=0,p=0,t=8000,q=1,s=12,sd='',live=True,ha=0,hd=0,c=False,cx=0,mb=0,mh=[],ack=False,sup='Supplier A',sku='SKU-001',lnk='')
  seed="localStorage.setItem('kalsara_v3',%s)"%json.dumps(json.dumps(dict(A={},rows=[row],pr=[],sl=[],ts=1)))
  ctx=b.new_context(viewport={'width':412,'height':900},service_workers='block',accept_downloads=True);ctx.add_init_script(seed)
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://127.0.0.1:{PORT}/index.html');pg.wait_for_selector('#sy',state='attached',timeout=20000);pg.wait_for_timeout(1000)
  saved=lambda:pg.evaluate("async()=>{await KStore.flush();return JSON.parse(KStore.getItem('kalsara_v3'))}")
  pg.click('#t1');pg.wait_for_selector('#list .pc',timeout=10000);pg.wait_for_timeout(300)
  check(pg.locator('#list .pc').count()==1,'tab Produk tampil dengan satu produk awal')
  # Import one product from CSV; original product must remain.
  f=os.path.join(ROOT,'tests','.tmp-tahap5-impor.csv')
  open(f,'w',encoding='utf8').write('Nama,Modal,Management Partner,Packing,Target untung,Isi paket,Stok,Supplier,SKU,Link supplier,Gratis Ongkir XTRA\nProduk Baru,30000,1000,500,7000,1,25,Supplier B,SKU-002,,2\n')
  try:
   pg.set_input_files('#xf',f);pg.wait_for_timeout(300)
   check('Impor 1 produk' in pg.locator('#dlg').inner_text(),'dialog impor menyebut tepat 1 produk')
   pg.click('#dy');pg.wait_for_timeout(900)
  finally: os.remove(f)
  d=saved();check(len(d['rows'])==2 and any(x['sku']=='SKU-002' for x in d['rows']),'impor menambahkan produk tanpa menghapus produk lama')
  # Supplier CSV matches by SKU and updates modal/stock.
  f=os.path.join(ROOT,'tests','.tmp-tahap5-supplier.csv');open(f,'w',encoding='utf8').write('SKU,Modal,Stok\nSKU-001,25000,18\n')
  try:
   pg.set_input_files('#syf',f);pg.wait_for_timeout(300)
   check('modal berubah di 1 produk' in pg.locator('#dlg').inner_text() and 'stok berubah di 1 produk' in pg.locator('#dlg').inner_text(),'dialog sinkron supplier menyebut satu perubahan modal dan stok')
   pg.click('#dy');pg.wait_for_timeout(900)
  finally: os.remove(f)
  d=saved();old=next(x for x in d['rows'] if x['sku']=='SKU-001')
  check(old['m']==25000 and old['s']==18 and len(old['mh'])==1,'sinkron supplier mengubah modal/stok dan mencatat riwayat modal')
  # Actual Shopee price import.
  f=os.path.join(ROOT,'tests','.tmp-tahap5-harga.csv');open(f,'w',encoding='utf8').write('SKU,Nama,Harga awal,Harga diskon\nSKU-001,Produk Lama,50000,45000\n')
  try:
   pg.set_input_files('#hrf',f);pg.wait_for_timeout(300)
   check('Isi harga aktual Shopee di 1 produk' in pg.locator('#dlg').inner_text(),'dialog impor harga aktual menyebut tepat satu produk')
   pg.click('#dy');pg.wait_for_timeout(900)
  finally: os.remove(f)
  d=saved();old=next(x for x in d['rows'] if x['sku']=='SKU-001')
  check(old['ha']==50000 and old['hd']==45000,'harga awal dan harga diskon aktual masuk ke produk yang cocok')
  # Export report still downloads as CSV.
  # Tombol unduh ada di tab Hitung (#v1), di dalam bagian lipat 'Impor dan ekspor CSV' yang awalnya tertutup.
  pg.evaluate("document.getElementById('xr').closest('details').open=true")
  with pg.expect_download(timeout=10000) as dl: pg.click('#xr')
  content=open(dl.value.path(),encoding='utf-8-sig').read()
  check('Produk' in content and 'Produk Lama' in content,'unduh hasil menghasilkan CSV berisi produk')
  # tab wrapping and reset remain operational.
  pg.click('#t0');check(pg.locator('#v0').is_visible(),'tab Etalase dapat dibuka')
  pg.click('#t1');check(pg.locator('#v1').is_visible(),'tab Produk dapat dibuka kembali')
  check(not errs,'tidak ada pageerror: '+str(errs))
  ctx.close();b.close()
 print(f'E2E Tahap 5 (tab impor/sinkron): {ok} assertions passed di Chromium')
finally:srv.terminate()
