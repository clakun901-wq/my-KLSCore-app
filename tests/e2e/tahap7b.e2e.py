"""E2E Tahap 7b: migrasi format Promo Toko lama lewat pemulihan cadangan."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
PORT=8167
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
ok=0
def check(c,m):
 global ok
 if not c: raise AssertionError(m)
 ok+=1
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
  row=dict(id='p0',n='Produk Migrasi',m=20000,d=0,p=0,t=5000,q=1,s=10,sd='',live=True,ha=0,hd=0,c=False,cx=0,mb=0,mh=[],ack=False,sup='',sku='SKU-0',lnk='')
  seed=json.dumps(json.dumps(dict(A={},rows=[row],pr=[],sl=[],ts=1)))
  ctx=b.new_context(viewport={'width':412,'height':900},service_workers='block',accept_downloads=True)
  ctx.add_init_script("try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}"%seed)
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://127.0.0.1:{PORT}/index.html');pg.wait_for_selector('kalsara-product-card',timeout=20000);pg.wait_for_timeout(800)
  pg.click('#t1');pg.wait_for_selector('#list .pc',state='visible',timeout=10000);pg.wait_for_timeout(500)
  # Cadangan valid dengan satu promo toko lama (format sebelum perubahan struktur item).
  backup=dict(A={},rows=[row],pr=[dict(t='pt',n='Promo Format Lama',p='p0',a=15)],sl=[],ts=1)
  text=json.dumps(backup,ensure_ascii=False)
  # Panel cadangan ada di dalam <details> yang tertutup, jadi dipakai klik/isi lewat DOM seperti tes cadangan lain.
  pg.evaluate("document.getElementById('bp').click()");pg.wait_for_timeout(200)
  pg.evaluate("([t])=>{var e=document.getElementById('bpt');e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}))}",[text])
  pg.evaluate("document.getElementById('bpg').click()");pg.wait_for_timeout(800)
  dialog=pg.evaluate("()=>document.getElementById('dlg').textContent")
  check('Pulihkan 1 produk' in dialog,'dialog konfirmasi cadangan harus mengenali satu produk: '+dialog[:150])
  pg.locator('button',has_text='Ya, pulihkan').first.click()
  pg.wait_for_function("()=>/Data dipulihkan/.test(document.body.innerText)",timeout=30000)
  data=pg.evaluate("async()=>{await KStore.flush();return JSON.parse(KStore.getItem('kalsara_v3'))}")
  promo=data.get('pr',[{}])[0]
  check(promo.get('t')=='pt' and promo.get('it')==[dict(p='p0',h=15,d=0,l=0)],'migPt mengubah promo toko format lama menjadi daftar item baru')
  check(promo.get('a')==0 and promo.get('p')=='','field lama dikosongkan setelah migrasi agar tidak diterapkan dua kali')
  check(not errs,'tidak ada pageerror saat memulihkan promo lama: '+str(errs))
  ctx.close();b.close()
 print(f'E2E Tahap 7b: {ok} assertions passed (migrasi Promo Toko format lama).')
finally:
 srv.terminate();srv.wait()
