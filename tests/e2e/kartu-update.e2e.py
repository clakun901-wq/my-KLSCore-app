"""E2E pemasangan updRow (v9.33 tahap 6f). Memastikan tombol live, ringkasan, peringatan stok, hasil/rincian dan data supplier benar-benar dirender dari kartu."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..')); PORT=8135
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
row=dict(id='u1',n='Produk Uji updRow',m=20000,d=500,p=300,t=8000,q=1,s=3,live=True,ha=0,hd=0,c=False,cx=80000,sd='',mb=20000,mh=[dict(d='2026-10-01',a=18000,b=20000)],ack=False,sup='Supplier Uji',sku='SKU-UJI',lnk='https://example.com/produk',o=None)
seed="try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}"%json.dumps(json.dumps(dict(A={},rows=[row],pr=[],sl=[],ts=1)))
ok=0
def check(c,m):
 global ok
 if not c: raise AssertionError(m)
 ok+=1
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
  ctx=b.new_context(viewport={'width':412,'height':900},service_workers='block');ctx.add_init_script(seed)
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://127.0.0.1:{PORT}/index.html');pg.wait_for_selector('kalsara-product-card',timeout=20000);pg.wait_for_timeout(700)
  pg.click('#t1');pg.wait_for_selector('#list .pc',state='visible',timeout=10000);card=pg.locator('#list .pc').first
  card.scroll_into_view_if_needed();pg.wait_for_timeout(700)
  check(card.locator('.nm').input_value()=='Produk Uji updRow', 'kartu produk dibangun dan dihidrasi (nama ada di kolom isian)')
  live=card.locator('.lvb');before=live.text_content();check('Live di toko' in before,'updRow mengisi label tombol live awal')
  live.click();pg.wait_for_timeout(500);after=live.text_content();check('Tandai sudah listing' in after and 'Live di toko' not in after,'klik live memicu updRow dan memperbarui label tombol')
  check('Untung bersih' in card.locator('.cs').text_content(),'updRow mengisi ringkasan hasil')
  check('Stok hampir habis' in card.locator('.sk').text_content(),'updRow mengisi peringatan stok kritis')
  res=card.locator('.res').text_content();check('Ke mana harga jual pergi' in res and 'Lihat rincian biaya' in res,'updRow mengisi hasil, bar ringkasan, dan rincian biaya')
  card.locator('details').last.locator('summary').click();pg.wait_for_timeout(250)
  check('Buka link supplier' in card.locator('.lkx').text_content(),'updRow mengisi tautan supplier')
  check('Riwayat modal' in card.locator('.mhl').text_content(),'updRow mengisi riwayat perubahan modal')
  check(not errs,'tidak ada error JavaScript: '+str(errs))
  ctx.close();b.close()
 print(f'E2E updRow: {ok} assertions passed di Chromium nyata')
finally:srv.terminate()
