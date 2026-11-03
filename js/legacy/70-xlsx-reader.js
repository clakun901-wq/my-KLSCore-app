/*5.62: impor harga dan stok dari xlsx/CSV, dicocokkan lewat SKU*/
function hxN(s){return String(s==null?'':s).replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\u00a0/g,' ').trim()}
function hxK(s){return hxN(s).replace(/\s+/g,'').toLowerCase()}
function hxP(v){var s=hxN(v).replace(/^rp\.?\s*/i,'').replace(/\s/g,'');if(/^\d+(\.\d+)?$/.test(s)&&!/^\d{1,3}\.\d{3}$/.test(s))return globalThis.KalsaraMoney.parseIDR(s);return num(s)}
function hxU16(b,o){return b[o]|b[o+1]<<8}
function hxU32(b,o){return(b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0}
function hxZip(buf){var b=new Uint8Array(buf),e=-1,i;for(i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(hxU32(b,i)==0x06054b50){e=i;break}
 if(e<0)throw 0;var n=hxU16(b,e+10),p=hxU32(b,e+16),F={};
 for(i=0;i<n;i++){if(hxU32(b,p)!=0x02014b50)throw 0;var nl=hxU16(b,p+28),el=hxU16(b,p+30),cl=hxU16(b,p+32);F[new TextDecoder().decode(b.subarray(p+46,p+46+nl))]={me:hxU16(b,p+10),cs:hxU32(b,p+20),lo:hxU32(b,p+42)};p+=46+nl+el+cl}
 return{b:b,F:F}}
function hxGet(z,nm){var f=z.F[nm];if(!f)return Promise.resolve(null);var b=z.b,o=f.lo+30+hxU16(b,f.lo+26)+hxU16(b,f.lo+28),d=b.subarray(o,o+f.cs);
 if(f.me==0)return Promise.resolve(new TextDecoder().decode(d));
 if(f.me!=8)return Promise.reject(0);
 return new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(x){return new TextDecoder().decode(x)})}
function hxXlsx(buf){var z=hxZip(buf),X=function(t){return new DOMParser().parseFromString(t,'application/xml')};
 return Promise.all([hxGet(z,'xl/sharedStrings.xml'),hxGet(z,'xl/workbook.xml'),hxGet(z,'xl/_rels/workbook.xml.rels')]).then(function(a){
  var ss=[],i,j,pth=null;
  if(a[0]){var si=X(a[0]).getElementsByTagName('si');for(i=0;i<si.length;i++){var t=si[i].getElementsByTagName('t'),q='';for(j=0;j<t.length;j++)q+=t[j].textContent;ss.push(q)}}
  try{var sh=X(a[1]).getElementsByTagName('sheet')[0],rid=sh.getAttribute('r:id'),rl=X(a[2]).getElementsByTagName('Relationship');for(i=0;i<rl.length;i++)if(rl[i].getAttribute('Id')==rid){pth=rl[i].getAttribute('Target');break}}catch(e){}
  if(pth){pth=pth.replace(/^\//,'');if(pth.indexOf('xl/')!=0)pth='xl/'+pth}
  if(!pth||!z.F[pth])pth=Object.keys(z.F).filter(function(n){return/^xl\/worksheets\/sheet\d+\.xml$/.test(n)}).sort()[0];
  if(!pth)throw 0;
  return hxGet(z,pth).then(function(tx){var out=[],rw=X(tx).getElementsByTagName('row');
   for(i=0;i<rw.length;i++){var cs=rw[i].getElementsByTagName('c'),r=[];
    for(j=0;j<cs.length;j++){var c=cs[j],m=/^([A-Z]+)/.exec(c.getAttribute('r')||''),ix=j,ty=c.getAttribute('t'),v=c.getElementsByTagName('v')[0],val='';
     if(m){ix=0;for(var k=0;k<m[1].length;k++)ix=ix*26+m[1].charCodeAt(k)-64;ix--}
     if(ty=='inlineStr'){var tt=c.getElementsByTagName('t');for(var w=0;w<tt.length;w++)val+=tt[w].textContent}
     else if(v){val=v.textContent;if(ty=='s')val=ss[+val]||''}
     r[ix]=val}
    for(j=0;j<r.length;j++)if(r[j]===undefined)r[j]='';out.push(r)}
   return out})})}
function hxFind(d){for(var i=0;i<Math.min(d.length,15);i++){var c={sku:-1,par:-1,ha:-1,hd:-1,s:-1};
 if(d[i].some(function(x){return/^(et_title_|ps_)/.test(hxN(x).toLowerCase())}))continue;
 d[i].forEach(function(x,j){x=hxN(x).toLowerCase();
  if(/(parent|induk)/.test(x)&&/sku/.test(x)){if(c.par<0)c.par=j}
  else if(/sku/.test(x)){if(c.sku<0)c.sku=j}
  else if(/harga diskon|harga promo|discount|promo price/.test(x)){if(c.hd<0)c.hd=j}
  else if(/harga awal|harga normal|harga asli|original/.test(x)){if(c.ha<0)c.ha=j}
  else if(/^(stok|stock)( .*)?$/.test(x)){if(c.s<0)c.s=j}});
 if((c.sku>=0||c.par>=0)&&(c.ha>=0||c.hd>=0||c.s>=0))return{c:c,h:i}}return null}
function hxRun(d){var f=hxFind(d);if(!f){toast('Kolom SKU dan Harga Awal / Harga diskon / Stok tidak ditemukan di file');return}
 var c=f.c,old=rows.map(strip),by={},noSku=0;
 old.forEach(function(r){var k=hxK(r.sku);if(!k){noSku++;return}if(!by[k])by[k]=r});
 var up={},miss=[],dup=0,tot=0;
 d.slice(f.h+1).forEach(function(x){var k1=c.sku>=0?hxK(x[c.sku]):'',k2=c.par>=0?hxK(x[c.par]):'';if(!k1&&!k2)return;tot++;
  var r=(k1&&by[k1])||(k2&&by[k2]);
  if(!r){miss.push(hxN(k1?x[c.sku]:x[c.par]));return}
  var ha=c.ha>=0?hxP(x[c.ha]):0,hd=c.hd>=0?hxP(x[c.hd]):0,sr=c.s>=0?hxN(x[c.s]):'',st=sr===''?null:hxP(sr);if(!(ha>0||hd>0||st!=null))return;
  if(up[r.id]){dup++;return}
  up[r.id]={r:r,ha:ha,hd:hd,s:st}});
 var L=Object.keys(up).map(function(k){return up[k]});
 if(!L.length){toast(noSku==old.length?'SKU di produk masih kosong. Isi SKU produk dulu, sama dengan SKU Ref. No. di file':'Tidak ada SKU yang cocok dengan produk di aplikasi');return}
 var np=L.filter(function(u){return u.ha>0||u.hd>0}).length,ns=L.filter(function(u){return u.s!=null}).length;
 ask('Cocok '+L.length+' produk dari '+tot+' SKU di file ('+(np?'harga di '+np+' produk':'')+(np&&ns?', ':'')+(ns?'stok Shopee di '+ns+' produk':'')+').'+(miss.length?' '+miss.length+' SKU tidak ada di aplikasi dan dilewati ('+miss.slice(0,4).join(', ')+(miss.length>4?', ...':'')+').':'')+(dup?' '+dup+' baris SKU ganda dilewati (dipakai baris pertama).':'')+(noSku?' '+noSku+' produk di aplikasi belum punya SKU.':'')+' Lanjutkan impor? Modal tidak berubah.','Ya, impor',function(){
  L.forEach(function(u){if(u.ha>0)u.r.ha=u.ha;if(u.hd>0)u.r.hd=u.hd;if(u.s!=null){u.r.s=u.s;u.r.sd=today()}});
  rows=[];KDOM.setHTML($('list'), '');old.forEach(function(r){add(r)});upd(true);srt();toast('Data tayang terisi di '+L.length+' produk')})}
function hxFile(f){var nm=(f.name||'').toLowerCase(),fr=new FileReader();fr.onerror=function(){toast('File tidak bisa dibaca')};
 if(/\.xlsx$/.test(nm)){
  if(!window.DecompressionStream){toast('Browser belum bisa membaca Excel. Simpan sebagai CSV lalu pilih lagi');return}
  fr.onload=function(){try{hxXlsx(fr.result).then(hxRun,function(){toast('File Excel tidak terbaca. Pakai file .xlsx dari Shopee atau simpan sebagai CSV')})}catch(e){toast('File Excel tidak terbaca. Pakai file .xlsx dari Shopee atau simpan sebagai CSV')}};
  fr.readAsArrayBuffer(f)}
 else if(/\.xls$/.test(nm)){toast('Format .xls lama tidak didukung. Simpan ulang sebagai .xlsx atau CSV')}
 else{fr.onload=function(){var t=String(fr.result),d=parseCsv(t);if(parseCsv.bad||/^\s*</.test(t)||d.length<2){toast('Isi file tidak terbaca. Pastikan formatnya CSV');return}hxRun(d)};fr.readAsText(f)}}
$('hxb').onclick=function(){$('hxf').click()};
$('hxf').onchange=function(){var f=this.files[0];this.value='';if(f)hxFile(f)};
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-hx]'))$('hxf').click()});
try{$('hru').value=KStore.getItem('kalsara_hr_url')||''}catch(e){}
