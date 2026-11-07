import json, os, subprocess, sys, time, statistics
from playwright.sync_api import sync_playwright
root, port, CPU = os.path.abspath(sys.argv[1]), int(sys.argv[2]), float(sys.argv[3])
N=1000
rows=[dict(id=f'p{i}',n=f'Produk {i:04d}',m=20000+(i%50)*997,d=0,p=0,t=1000,q=1,s=2+i%30,live=True,ha=0,hd=0,c=False,cx=0,sd='',mb=20000+(i%50)*997,mh=[],ack=False,sup='',sku='',lnk='',o=None) for i in range(N)]
def P(t,**k):
    d=dict(id='x'+t+str(len(k)),t=t,n='Promo '+t,s='2026-01-01',e='',p='',a=10,b=0,k='',it=[],mp=[],gf=[]); d.update(k); return d
prm=[P('af',p='p1'),P('vc',jt='produk',p='p2',a=5000,m=50000),P('vc'),P('pt',it=[dict(p=f'p{i}',d=10,h=0,l=0) for i in range(30)]),P('kh',mp=['p3'],it=[dict(p='p4',d=5,h=0,l=0)]),P('pd',p='p5',b=10,x=2)]
for i,x in enumerate(prm): x['id']=f'pr{i}'
seed="try{if(!localStorage.getItem('kalsara_v3'))localStorage.setItem('kalsara_v3',%s)}catch(e){}"%json.dumps(json.dumps(dict(A={},rows=rows,pr=prm,sl=[],ts=1)))
srv=subprocess.Popen(['python3','-m','http.server',str(port),'--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
# ukur satu aksi: waktu sinkron + sampai gambar
JS="""async (f)=>{const fn=new Function('return ('+f+')')();const a=performance.now();fn();const js=performance.now()-a;
await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(r,0))));return [js,performance.now()-a]}"""
def typ(sel,val):
    return "()=>{const e=document.querySelector(%s);e.value=%s;e.dispatchEvent(new Event('input',{bubbles:true}))}"%(json.dumps(sel),json.dumps(val))
def chg(sel,val):
    return "()=>{const e=document.querySelector(%s);e.value=%s;e.dispatchEvent(new Event('change',{bubbles:true}))}"%(json.dumps(sel),json.dumps(val))
def clk(sel):
    return "()=>document.querySelector(%s).click()"%json.dumps(sel)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':412,'height':900},service_workers='block'); ctx.add_init_script(seed)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    if CPU>1: ctx.new_cdp_session(pg).send('Emulation.setCPUThrottlingRate',{'rate':CPU})
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_function("document.getElementById('s1').textContent==='1000'",timeout=180000); pg.wait_for_timeout(1500)
    res={}
    def m(name,f,reps=3,pre=None):
        out=[]
        for _ in range(reps):
            if pre: pre()
            js,pt=pg.evaluate(JS,f); out.append((js,pt)); pg.wait_for_timeout(300)
        res[name]=dict(js=round(statistics.median(x[0] for x in out)),gambar=round(statistics.median(x[1] for x in out)),maks=round(max(x[1] for x in out)))
    # Etalase
    pg.evaluate("document.getElementById('t0').click()"); pg.wait_for_timeout(500)
    print(pg.evaluate("[...document.querySelectorAll('#v0 input,#v0 select,#shpg button')].slice(0,12).map(e=>e.tagName+'#'+e.id+'.'+e.className)"),file=sys.stderr)
    m('Etalase: halaman berikut',clk('#shpg button:nth-of-type(2)'))
    # Hitung
    pg.evaluate("document.getElementById('t1').click()"); pg.wait_for_timeout(2500)
    m('Hitung: cari "Produk 05"',typ('#q','Produk 05'))
    m('Hitung: hapus pencarian',typ('#q',''))
    m('Hitung: filter live',chg('#ff','live')); m('Hitung: filter semua',chg('#ff','all'))
    m('Hitung: urut margin',chg('#so','mg')); m('Hitung: urut asli',chg('#so','0'))
    m('Hitung: ketik harga modal kartu 1',typ('#list .pc input','25000'))
    # Promosi
    pg.evaluate("document.getElementById('t3').click()"); pg.wait_for_timeout(2500)
    m('Promosi: ketik nama promo',typ('#prl .pe input.nm','abc'))
    m('Promosi: ketik nilai (a)',typ('#prl .pe input[data-pf=a]','12'))
    m('Promosi: ganti jenis diskon (u) -> render ulang semua',chg('#prl select[data-pf=u]','pct'),reps=2)
    m('Promosi: pilih produk di daftar (p)',chg('#prl select[data-pf=p]','p7'))
    m('Promosi: tambah produk ke Promo Toko',chg('#prl select[data-itadd]','p100'),reps=1)
    res['opsiDOM']=pg.evaluate("document.querySelectorAll('#prl option').length")
    lt=pg.evaluate("1"); res['galat']=errs
    print(json.dumps(res,ensure_ascii=False,indent=1)); b.close()
finally: srv.terminate()
