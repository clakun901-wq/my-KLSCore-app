"""E2E Tahap 7a: alur panel/tampilan promosi (juga kompatibel dengan ZIP v9.42)."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.environ.get('KALSARA_E2E_ROOT') or os.path.join(os.path.dirname(__file__),'..','..'))
PORT=int(os.environ.get('KALSARA_E2E_PORT','8159'))
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
ok=0
def check(c,m):
 global ok
 if not c: raise AssertionError(m)
 ok+=1
def rows_seed():
 return [dict(id=f'p{i}',n=f'Produk {i:02d}',m=20000+i*100,d=0,p=0,t=5000,q=1,s=10+i,sd='',live=True,ha=0,hd=0,c=False,cx=0,mb=0,mh=[],ack=False,sup='',sku=f'SKU-{i:02d}',lnk='') for i in range(10)]
def open_app(p, sabotage=False):
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
 ctx=b.new_context(viewport={'width':412,'height':900},service_workers='block')
 seed="localStorage.setItem('kalsara_v3',%s)"%json.dumps(json.dumps(dict(A={},rows=rows_seed(),pr=[],sl=[],ts=1)))
 ctx.add_init_script(seed)
 if sabotage:
  ctx.add_init_script("""(()=>{const old=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(type,fn,opt){if(this&&this.id==='prt'&&type==='click')return;return old.call(this,type,fn,opt)}})()""")
 pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
 pg.goto(f'http://127.0.0.1:{PORT}/index.html');pg.wait_for_selector('#sy',state='attached',timeout=20000);pg.wait_for_timeout(800)
 pg.click('#t3');pg.wait_for_selector('#v3',state='visible',timeout=10000)
 return b,ctx,pg,errs
try:
 with sync_playwright() as p:
  # Alur utama yang harus identik pada v9.42 dan v9.43.
  b,ctx,pg,errs=open_app(p)
  pg.locator('#prt [data-pt="pt"]').click();pg.wait_for_timeout(100)
  check('Tambah Promo Toko' in pg.locator('#pra').inner_text(),'memilih jenis Promo Toko memperbarui tombol Tambah')
  pg.click('#pra');pg.wait_for_selector('#prl .pe',timeout=10000)
  check(pg.locator('#prl .pe').count()==1,'tombol Tambah membuat satu kartu promosi')
  name=pg.locator('#prl .pe input[data-pf="n"]');name.fill('Promo Panel Tahap 7a');pg.wait_for_timeout(200)
  check(name.input_value()=='Promo Panel Tahap 7a','nama promosi dapat diubah')
  sel=pg.locator('#prl .pe select[data-itadd]');check(sel.count()==1 and sel.locator('option').count()>=8,'daftar produk panjang tersedia untuk pencarian khusus')
  sel.click();pg.wait_for_selector('#pkb',timeout=5000)
  pg.fill('#pki','SKU-07');pg.wait_for_timeout(150)
  check(pg.locator('#pkl .pkr').count()==1 and 'Produk 07' in pg.locator('#pkl .pkr').inner_text(),'pencarian SKU menyaring daftar ke produk yang cocok')
  pg.locator('#pkl .pkr').click();pg.wait_for_timeout(300)
  check(pg.locator('#prl .pe .pii[data-ix]').count()==1 and 'Produk 07' in pg.locator('#prl .pe .pii[data-ix]').inner_text(),'produk hasil pencarian berhasil ditambahkan ke promo')
  discount=pg.locator('#prl .pe .pii[data-ix] input[data-it="d"]');price=pg.locator('#prl .pe .pii[data-ix] input[data-it="h"]')
  discount.fill('10');pg.wait_for_timeout(200)
  check(price.input_value().replace('.','').replace(',','').isdigit() and int(price.input_value().replace('.','').replace(',',''))>0,'mengisi diskon otomatis mengisi harga promo yang setara')
  async_saved="async()=>{await KStore.flush();return JSON.parse(KStore.getItem('kalsara_v3'))}"
  # Penyimpanan data memakai jeda 350 ms (debounce). Tunggu sampai data benar-benar tertulis, jangan menebak waktu.
  def saved_until(pred,limit=8000):
   t0=time.time()
   while True:
    d=pg.evaluate(async_saved)
    try:
     if pred(d) or (time.time()-t0)*1000>limit: return d
    except (IndexError,KeyError): 
     if (time.time()-t0)*1000>limit: return d
    pg.wait_for_timeout(200)
  d=saved_until(lambda d:len(d.get('pr',[]))==1 and len(d['pr'][0].get('it',[]))==1 and d['pr'][0]['it'][0].get('d')==10)
  check(len(d.get('pr',[]))==1 and d['pr'][0]['n']=='Promo Panel Tahap 7a' and d['pr'][0]['it'][0]['p']=='p7' and d['pr'][0]['it'][0]['d']==10,'perubahan nama, produk, dan diskon tersimpan')
  pg.locator('#prl .pe [data-del]').click();pg.wait_for_timeout(150);pg.click('#dy');pg.wait_for_timeout(350)
  check(pg.locator('#prl .pe').count()==0,'hapus promosi menghilangkan kartu setelah konfirmasi')
  d=saved_until(lambda d:len(d.get('pr',[]))==0);check(len(d.get('pr',[]))==0,'penghapusan promosi ikut tersimpan')
  check(not errs,'tidak ada pageerror selama alur promosi: '+str(errs))
  ctx.close();b.close()
  # Sabotase nyata pada salinan sesi browser: mematikan listener pemilih jenis harus terdeteksi.
  b,ctx,pg,errs=open_app(p,sabotage=True)
  pg.locator('#prt [data-pt="pt"]').click();pg.wait_for_timeout(100)
  detected=pg.locator('#pra').inner_text().strip()=='Pilih jenis promo di atas'
  check(detected,'SABOTASE E2E: tes mendeteksi pemilih jenis yang sengaja dinonaktifkan')
  ctx.close();b.close()
 print(f'E2E Tahap 7a: {ok} assertions passed di Chromium nyata (alur utama + sabotase).')
finally:
 srv.terminate();srv.wait(timeout=5)
