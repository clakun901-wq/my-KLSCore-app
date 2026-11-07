"""E2E Tahap 6 (v9.42): bagian 20 (kartu produk, filter/urut, hidrasi malas, navigasi Etalase->Setelan/Promo) yang kini di js/hitung-etalase.js, di Chromium nyata."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..')); PORT=8152
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=0
def check(c,m):
 global ok
 if not c: raise AssertionError(m)
 ok+=1
def mkrow(i):
 return dict(id=f'p{i}',n=f'Produk {i:02d}',m=20000+i*100,d=0,p=0,t=5000,q=1,s=10+i,sd='',live=True,ha=0,hd=0,c=False,cx=0,mb=0,mh=[],ack=False,sup='',sku=f'SKU-{i:02d}',lnk='')
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
  rows=[mkrow(i) for i in range(45)]  # di atas HY_ALL=40: hidrasi malas aktif
  seed="localStorage.setItem('kalsara_v3',%s)"%json.dumps(json.dumps(dict(A={},rows=rows,pr=[],sl=[],ts=1)))
  ctx=b.new_context(viewport={'width':412,'height':900},service_workers='block');ctx.add_init_script(seed)
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)+' | '+str(getattr(e,'stack',''))))
  pg.goto(f'http://127.0.0.1:{PORT}/index.html');pg.wait_for_selector('#sy',state='attached',timeout=20000);pg.wait_for_timeout(1000)
  saved=lambda:pg.evaluate("async()=>{await KStore.flush();return JSON.parse(KStore.getItem('kalsara_v3'))}")
  pg.click('#t1');pg.wait_for_selector('#list .pc',timeout=10000);pg.wait_for_timeout(400)
  check(pg.locator('#list .pc').count()==45,'tab Produk menampilkan 45 kartu')
  # Hidrasi malas: kartu jauh di bawah belum berisi formulir.
  check(pg.locator('#list .pc.lz').count()>0,'sebagian kartu masih berupa cangkang ringan (hidrasi malas aktif di atas 40 produk)')
  check(pg.locator('#list .pc').first.locator('input.nm').count()==1,'kartu pertama sudah berisi formulir')
  # Buka produk ke-45 dari Etalase (kls-open -> goProd): kartu itu harus terhidrasi dan tab Produk terbuka.
  pg.click('#t0');pg.wait_for_selector('kalsara-product-card',timeout=10000)
  pg.evaluate("document.getElementById('shl').dispatchEvent(new CustomEvent('kls-open',{detail:{index:44}}))");pg.wait_for_timeout(900)
  check(pg.locator('#v1').is_visible(),'goProd membuka tab Produk')
  check(pg.locator('#list .pc').nth(44).locator('input.nm').input_value()=='Produk 44','kartu ke-45 terhidrasi dan berisi nama produknya')
  check(pg.locator('#list .pc.mk').count()==1,'kartu tujuan ditandai (mk)')
  # Tambah produk dan isi nama: tersimpan.
  pg.click('#add');pg.wait_for_timeout(300)
  check(pg.locator('#list .pc').count()==46,'tombol tambah menambah satu kartu')
  last=pg.locator('#list .pc').last;last.locator('input.nm').fill('Produk Baru Tahap6');pg.wait_for_timeout(500)
  d=saved();check(len(d['rows'])==46 and d['rows'][-1]['n']=='Produk Baru Tahap6','nama produk baru tersimpan')
  # Duplikat kartu pertama.
  first=pg.locator('#list .pc').first;first.locator('.dp').click();pg.wait_for_timeout(500)
  d=saved();check(len(d['rows'])==47 and d['rows'][1]['n']=='Produk 00 (salinan)','duplikat menaruh salinan tepat di bawah aslinya')
  # Ciutkan semua / buka semua.
  pg.click('#col');pg.wait_for_timeout(200)
  check(pg.locator('#col').inner_text().strip()=='Buka semua','tombol berubah menjadi Buka semua setelah ciutkan semua')
  pg.click('#col');pg.wait_for_timeout(200)
  check(pg.locator('#col').inner_text().strip()=='Ciutkan semua','tombol kembali menjadi Ciutkan semua')
  # Cari: hanya produk yang cocok yang terlihat.
  pg.fill('#q','SKU-07');pg.wait_for_timeout(300)
  vis=pg.evaluate("[...document.querySelectorAll('#list .pc')].filter(e=>!e.hidden).length")
  check(vis==1,'pencarian SKU-07 menyisakan tepat 1 kartu, dapat: %s'%vis)
  pg.fill('#q','');pg.wait_for_timeout(200)
  vis=pg.evaluate("[...document.querySelectorAll('#list .pc')].filter(e=>!e.hidden).length")
  check(vis==47,'mengosongkan pencarian menampilkan semua 47 kartu, dapat: %s'%vis)
  # Urut menurut nama: urutan di layar berubah dan nama 'Produk 00' di depan.
  pg.select_option('#so','nm');pg.wait_for_timeout(400)
  nm=pg.evaluate("document.querySelector('#list .pc input.nm') ? [...document.querySelectorAll('#list .pc')].slice(0,2).map(e=>(e.querySelector('input.nm')||{}).value) : []")
  check(nm and nm[0]=='Produk 00','urut menurut nama menaruh Produk 00 di paling atas: %s'%nm)
  pg.select_option('#so','0');pg.wait_for_timeout(200)
  # Hapus produk (dialog konfirmasi).
  n0=pg.locator('#list .pc').count()
  pg.locator('#list .pc').first.locator('.x').click();pg.wait_for_timeout(300)
  pg.click('#dy');pg.wait_for_timeout(500)
  check(pg.locator('#list .pc').count()==n0-1,'hapus produk mengurangi satu kartu setelah konfirmasi')
  d=saved();check(len(d['rows'])==46,'penghapusan tersimpan')
  # Navigasi dari Etalase: kls-go "set" -> tab Setelan; kls-go "vc" menulis PSEL (milik bagian 50) lalu membuka tab Promo.
  pg.click('#t0');pg.wait_for_timeout(300)
  pg.evaluate("document.getElementById('shl').dispatchEvent(new CustomEvent('kls-go',{detail:{target:'set'}}))");pg.wait_for_timeout(300)
  check(pg.locator('#v2').is_visible(),'kls-go set membuka tab Setelan')
  pg.click('#t0');pg.wait_for_timeout(300)
  pg.evaluate("document.getElementById('shl').dispatchEvent(new CustomEvent('kls-go',{detail:{target:'pt'}}))");pg.wait_for_timeout(400)
  check(pg.locator('#v3').is_visible(),'kls-go pt membuka tab Promo')
  pg.click('#pra');pg.wait_for_timeout(500)
  d=saved();check(len(d['pr'])==1 and d['pr'][0]['t']=='pt','promo baru bertipe pt: PSEL ditulis lewat penerus modul dan terbaca oleh bagian promosi')
  # BUG LAMA v9.41 (di luar Tahap 6, tidak diubah): #add di tab-impor-sinkron.js memanggil .focus() pada input kartu baru; di atas 40 produk kartu itu belum terhidrasi (belum punya input) sehingga error SEKALI. Hanya error persis itu yang diizinkan.
  known=[e for e in errs if "reading 'focus'" in e and 'tab-impor-sinkron.js' in e]
  check(len(known)==1,'error lama #add (focus) muncul tepat sekali: %d'%len(known))
  check(len(errs)==len(known),'tidak ada pageerror selain error lama #add: '+str(errs))
  ctx.close();b.close()
 print(f'E2E Tahap 6 (hitung + etalase): {ok} assertions passed di Chromium')
finally:
 srv.terminate()
