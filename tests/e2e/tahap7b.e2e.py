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
  ctx.add_init_script("localStorage.setItem('kalsara_v3',%s)"%seed)
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://127.0.0.1:{PORT}/index.html');pg.wait_for_selector('#sy',state='attached',timeout=20000);pg.wait_for_timeout(1000)
  # Cadangan valid dengan satu promo toko lama (format sebelum perubahan struktur item).
  backup=dict(A={},rows=[row],pr=[dict(t='pt',n='Promo Format Lama',p='p0',a=15)],sl=[],ts=1)
  text=json.dumps(backup,ensure_ascii=False)
  pg.click('#t2');pg.wait_for_timeout(300)
  pg.click('#bp');pg.wait_for_timeout(200)
  pg.fill('#bpt',text);pg.click('#bpg');pg.wait_for_timeout(300)
  dialog=pg.locator('#dlg').inner_text()
  check('Pulihkan 1 produk' in dialog,'dialog konfirmasi cadangan harus mengenali satu produk: '+dialog[:150])
  pg.get_by_role('button',name='Ya, pulihkan').first.click();pg.wait_for_timeout(1000)
  data=pg.evaluate("async()=>{await KStore.flush();return JSON.parse(KStore.getItem('kalsara_v3'))}")
  promo=data.get('pr',[{}])[0]
  check(promo.get('t')=='pt' and promo.get('it')==[dict(p='p0',h=15,d=0,l=0)],'migPt mengubah promo toko format lama menjadi daftar item baru')
  check(promo.get('a')==0 and promo.get('p')=='','field lama dikosongkan setelah migrasi agar tidak diterapkan dua kali')
  check(not errs,'tidak ada pageerror saat memulihkan promo lama: '+str(errs))
  ctx.close();b.close()
 print(f'E2E Tahap 7b: {ok} assertions passed (migrasi Promo Toko format lama).')
finally:
 srv.terminate();srv.wait()
