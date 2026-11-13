"""E2E v9.54: impor CSV ramah pengguna di Chromium nyata.
Kasus pemilik: file hasil unduhan aplikasi (38 kolom) diimpor. Dulu: 'modal Rp 1' dan 'tarif tidak terbaca', dan bila disetujui produk akan ganda."""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..')); PORT=8152
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=0
def check(c,m):
 global ok
 if not c: raise AssertionError(m)
 ok+=1
HEAD='Produk;Isi paket;Stok Shopee;Tanggal cek stok;Sumber barang;SKU;Link sumber barang;Modal / HPP per pcs;Biaya Management Partner;Biaya packing;Total modal;Target untung;Harga listing awal;Harga diskon coret;Voucher toko;Harga setelah voucher;Tarif administrasi (%);Tarif Gratis Ongkir XTRA (%);Tarif Promo XTRA (%);Tarif Video XTRA (%);Tarif Live XTRA (%);Biaya administrasi;Biaya Gratis Ongkir XTRA;Biaya Promo XTRA;Biaya Video XTRA;Biaya Live XTRA;Biaya pembayaran;Biaya layanan pesanan;Total Biaya Shopee;Premi;PPh 22;Biaya iklan;Cadangan retur;Ongkir ditanggung;Saldo masuk;Untung bersih;Margin (%);Harga impas (diskon coret)'
def baris(nama,sku,modal): return f'{nama};1;35;2026-10-31;;{sku};https://x.com/{sku};{modal};2200;720;{modal+2920};6000;77900;58425;2000;56425;6,5;1,75;4,5;0;0;3668;987;2539;0;0;0;0;7194;282;282;0;0;0;48667;6347;11,2;51066'
def prod(i,nama,sku,m): return dict(id=f'p{i}',n=nama,m=m,d=2200,p=720,t=6000,q=1,s=35,sd='',live=True,ha=0,hd=0,c=False,cx=0,mb=0,mh=[],ack=False,sup='',sku=sku,lnk='')
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
  seed="localStorage.setItem('kalsara_v3',%s)"%json.dumps(json.dumps(dict(A={},rows=[prod(0,'Cangkir Pemanas','OMHZ5WSV',39400),prod(1,'Kain Lap Microfiber','7ROR2FBL',2500)],pr=[],sl=[],ts=1)))
  ctx=b.new_context(viewport={'width':412,'height':900},service_workers='block');ctx.add_init_script(seed)
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://127.0.0.1:{PORT}/index.html');pg.wait_for_selector('#sy',state='attached',timeout=20000);pg.wait_for_timeout(1000)
  saved=lambda:pg.evaluate("async()=>{await KStore.flush();return JSON.parse(KStore.getItem('kalsara_v3'))}")
  pg.click('#t1');pg.wait_for_selector('#list .pc',timeout=10000);pg.wait_for_timeout(300)
  check(pg.locator('#list .pc').count()==2,'dua produk awal')
  tmp=os.path.join(ROOT,'tests','.tmp-impor-csv.csv')
  def impor(teks):
   open(tmp,'w',encoding='utf-8-sig').write(teks)
   pg.set_input_files('#xf',tmp);pg.wait_for_timeout(400)
   return pg.locator('#dlgm').inner_text()
  try:
   # 1. File hasil unduhan yang SEMUA produknya sudah ada: tidak boleh ada yang masuk, pesan jelas
   t=impor(HEAD+'\n'+baris('Cangkir Pemanas','OMHZ5WSV',39400)+'\n'+baris('Kain Lap Microfiber','7ROR2FBL',2500)+'\n')
   check('Semua 2 produk di file sudah ada' in t,'semua produk sudah ada dijelaskan: '+t)
   check('Rp 1;' not in t and 'tidak terbaca' not in t and 'periksa format angka' not in t,'pesan membingungkan lama hilang')
   check(pg.locator('#dy').inner_text()=='Mengerti','tombol dialog "Mengerti" (bukan impor)')
   pg.click('#dy');pg.wait_for_timeout(300)
   check(len(saved()['rows'])==2,'tidak ada produk ganda')
   # 2. Dua produk baru + satu yang sudah ada: modal terbaca benar, dialog menjelaskan
   t=impor(HEAD+'\n'+baris('Cangkir Pemanas','OMHZ5WSV',39400)+'\n'+baris('Barang Baru Satu','NEW0001',15000)+'\n'+baris('Barang Baru Dua','NEW0002',27500)+'\n')
   check(t.startswith('Impor 2 produk baru?'),'dialog menyebut 2 produk baru: '+t)
   check('modal Rp 15.000' in t,'modal terbaca dari kolom modal (bukan Isi paket): '+t)
   check('1 produk sudah ada' in t and 'hasil unduhan aplikasi' in t,'catatan SKU sudah ada dan file hasil: '+t)
   check('bermodal di bawah Rp100' not in t,'tidak ada peringatan modal Rp 1 palsu')
   pg.click('#dy');pg.wait_for_timeout(900)
   d=saved();rs={r['sku']:r for r in d['rows']}
   check(len(d['rows'])==4,'tepat 4 produk (2 lama + 2 baru)')
   check(rs['NEW0001']['m']==15000 and rs['NEW0002']['m']==27500,'modal tersimpan benar')
   check(rs['NEW0001']['d']==2200 and rs['NEW0001']['p']==720 and rs['NEW0001']['t']==6000,'Management Partner, packing, target tersimpan')
   check(rs['NEW0001']['s']==35 and rs['NEW0001']['q']==1,'stok dan isi paket tersimpan')
   check(rs['OMHZ5WSV']['m']==39400,'produk lama tidak berubah')
   # 3. Templat resmi masih bekerja
   t=impor('Nama produk;Modal / HPP per pcs;Biaya Management Partner;Biaya packing;Target untung;Isi paket (opsional);Stok Shopee (opsional);Sumber barang (opsional);SKU (opsional);Link sumber barang (opsional);Tarif Gratis Ongkir XTRA % (opsional)\nContoh produk A;25000;1000;500;5000;1;20;Toko ABC;KAOS-01;https://c.com;2\n')
   check(t.startswith('Impor 1 produk baru?') and 'Tarif Gratis Ongkir XTRA per produk diisi di 1 produk' in t,'templat resmi dibaca penuh: '+t)
   pg.click('#dn');pg.wait_for_timeout(300)
   check(len(saved()['rows'])==4,'Batal tidak mengimpor')
   # 4. Kolom wajib hilang: pesan jelas, tidak ada yang masuk
   t=impor('Nama produk;SKU;Stok\nA;S1;5\n')
   check('Kolom wajib tidak ditemukan' in t and 'Unduh template impor' in t,'kolom modal hilang dijelaskan: '+t)
   pg.click('#dy');pg.wait_for_timeout(300)
   check(len(saved()['rows'])==4,'tidak ada yang masuk')
   # 5. Dialog panjang tetap muat di layar HP (bisa digulir) dan baris baru tampil
   box=pg.evaluate("()=>{const e=document.querySelector('#dlg .dbx').getBoundingClientRect();return [e.top,e.bottom,innerHeight]}")
   check(box[0]>=0,'dialog tidak keluar layar')
  finally:
   if os.path.exists(tmp): os.remove(tmp)
  check(not errs,'tidak ada galat JS: '+str(errs[:2]))
  b.close()
 print(f'E2E impor CSV (v9.54): {ok} assertions passed di Chromium')
finally: srv.kill()
