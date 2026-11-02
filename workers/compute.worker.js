import { calculateProduct } from './calculator-engine.js';
/* Heavy-work boundary. Money is represented in minor units (Rupiah x 100). */
const toMinor = v => {
  const raw = String(v ?? '0').trim();
  if (!/^-?\d+$/.test(raw)) throw new Error('Nilai uang harus berupa integer satuan minor: ' + raw);
  return BigInt(raw);
};
const mulBps = (amount, basisPoints) => {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) throw new Error('Basis point harus integer non-negatif');
  const product = amount * BigInt(basisPoints);
  return product >= 0n ? (product + 5000n) / 10000n : (product - 5000n) / 10000n;
};

function parseCSV(text) {
  text=String(text ?? '').replace(/^\uFEFF/,'');
  const first=text.split(/\r?\n/,1)[0]||'';
  const sep=(first.split(';').length>first.split(',').length)?';':',';
  const rows=[]; let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++;}else quoted=false;}else cell+=ch;}
    else if(ch==='"') quoted=true;
    else if(ch===sep){row.push(cell);cell='';}
    else if(ch==='\n'||ch==='\r'){
      if(ch==='\r'&&text[i+1]==='\n')i++;
      row.push(cell);cell='';if(row.length>1||row[0]!=='')rows.push(row);row=[];
    } else cell+=ch;
  }
  if(quoted) throw new Error('Tanda kutip CSV tidak ditutup');
  if(cell!==''||row.length){row.push(cell);rows.push(row);}
  return rows;
}

function chain(context, handlers) {
  let index = -1;
  const dispatch = i => {
    if (i <= index) throw new Error('Pipeline next() dipanggil lebih dari sekali');
    index = i;
    const handler = handlers[i];
    if (!handler) return context;
    return handler(context, () => dispatch(i + 1));
  };
  return dispatch(0);
}

/* XLSX and Shopee report parsing run in the worker to keep file handling off the UI thread. */
function parseIDR(input) {
  let s=String(input??'').trim().replace(/^rp\.?\s*/i,'').replace(/[\s\u00a0]/g,'');
  if(!s)return 0;
  let sign=1n;if(s[0]==='-'||s[0]==='+'){if(s[0]==='-')sign=-1n;s=s.slice(1)}
  if(!s||!/^[\d.,]+$/.test(s))throw new TypeError('Nominal Rupiah tidak valid: '+input);
  const dots=(s.match(/\./g)||[]).length,commas=(s.match(/,/g)||[]).length;let whole=s,fraction='';
  if(dots&&commas){const dec=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.';const grp=dec===','?/\./g:/,/g;const at=s.lastIndexOf(dec);whole=s.slice(0,at).replace(grp,'');fraction=s.slice(at+1)}
  else if(commas){if(/^\d{1,3}(,\d{3})+$/.test(s))whole=s.replace(/,/g,'');else{const at=s.lastIndexOf(',');whole=s.slice(0,at).replace(/,/g,'');fraction=s.slice(at+1)}}
  else if(dots){if(/^\d{1,3}(\.\d{3})+$/.test(s))whole=s.replace(/\./g,'');else{const at=s.lastIndexOf('.');whole=s.slice(0,at).replace(/\./g,'');fraction=s.slice(at+1)}}
  if(!/^\d+$/.test(whole||'')||(fraction&&!/^\d+$/.test(fraction)))throw new TypeError('Nominal Rupiah tidak valid: '+input);
  let n=BigInt(whole||'0');if(fraction&&Number(fraction[0])>=5)n++;n*=sign;
  if(n>BigInt(Number.MAX_SAFE_INTEGER)||n<BigInt(-Number.MAX_SAFE_INTEGER))throw new RangeError('Nominal Rupiah melebihi batas integer aman');return Number(n);
}
function reportDate(v){v=String(v||'');if(/^\d{5}(\.\d+)?$/.test(v))return new Date(Math.round((+v-25569)*864e5)).toISOString().slice(0,10);let m=v.match(/(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];m=v.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);return m?m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2):''}
function colIndex(h,names){for(const n of names){const i=h.indexOf(n);if(i>=0)return i}return -1}
function colIndexes(h,prefixes){const out=[];h.forEach((x,i)=>{for(const p of prefixes)if(x.indexOf(p)===0){out.push(i);return}});return out}
function sumColumns(row,cols){return cols.reduce((s,i)=>s+BigInt(parseIDR(row[i])),0n)}
function safeRupiah(value){const n=BigInt(value),max=BigInt(Number.MAX_SAFE_INTEGER);if(n>max||n< -max)throw new RangeError('Total Rupiah melebihi batas integer aman');return Number(n)}
const REPORT_FEES={fa:['biaya administrasi'],fr:['biaya proses pesanan'],fx:['biaya spesial gratis ongkir','biaya gratis ongkir','biaya layanan'],fp:['biaya kampanye','biaya komisi ams','biaya isi saldo otomatis','fbs fee'],fk:['premi'],ft:['pph 22'],fv:['voucher disponsor oleh penjual','cashback koin disponsori penjual','voucher co-fund','cashback koin co-fund','diskon produk dari shopee','jumlah pengembalian dana ke pembeli'],fs:['ongkir dibayar pembeli','ongkos kirim yang dibayarkan','potongan ongkos kirim','gratis ongkir dari shopee','ongkos kirim pengembalian','return to seller fee','pengembalian biaya kirim']};
const REPORT_SUM_KEYS=['gross_revenue','tp','fv','fs','fa','fr','fx','fp','fk','ft','platform_fee'];
function parseShopeeReport(R){let hi=-1;const lower=r=>r.map(x=>String(x==null?'':x).trim().toLowerCase());for(let i=0;i<Math.min(R.length,12);i++){const l=lower(R[i]);if(l.includes('no. pesanan')&&l.includes('harga produk')){hi=i;break}}
 if(hi<0)throw new Error('Bukan laporan Penghasilan Shopee: kolom No. Pesanan dan Harga Produk tidak ditemukan');
 const h=lower(R[hi]),ci=colIndex(h,['no. pesanan']),cp=colIndex(h,['id produk']),cn=colIndex(h,['nama produk']),cg=colIndex(h,['harga produk']),cv=colIndex(h,['lihat berdasarkan']),ct=colIndex(h,['total penghasilan']),cd=colIndex(h,['tanggal dana dilepaskan','waktu pesanan dibuat']),C={},D=R.slice(hi+1),ws={};
 for(const k in REPORT_FEES)C[k]=colIndexes(h,REPORT_FEES[k]);
 if(cv>=0)D.forEach(r=>{if(String(r[cv]).toLowerCase()==='sku')ws[String(r[ci]).trim()]=1});
 const out=[],seen={};D.forEach(r=>{const id=String(r[ci]==null?'':r[ci]).trim();if(id.length<8)return;const lv=cv>=0?String(r[cv]).toLowerCase():'sku';if(lv==='order'&&ws[id])return;let pid=cp>=0?String(r[cp]||'').trim():'';if(pid==='-')pid='';const key=id+'|'+pid;let nm=cn>=0?String(r[cn]||''):'';if(nm==='-')nm='';const o={id:'shopee|'+key,platform:'shopee',order_id:id,sku:pid,name:nm,qty:1,gross_revenue:parseIDR(r[cg]),tp:ct>=0?parseIDR(r[ct]):0,date:reportDate(r[cd])},f={};for(const g in C)f[g]=sumColumns(r,C[g]);o.fv=safeRupiah(f.fv);o.fs=safeRupiah(f.fs);o.fa=-safeRupiah(f.fa);o.fr=-safeRupiah(f.fr);o.fx=-safeRupiah(f.fx);o.fp=-safeRupiah(f.fp);o.fk=-safeRupiah(f.fk);o.ft=-safeRupiah(f.ft);o.platform_fee=safeRupiah(BigInt(o.fa)+BigInt(o.fr)+BigInt(o.fx)+BigInt(o.fp)+BigInt(o.fk));
 if(seen[key]){REPORT_SUM_KEYS.forEach(k=>{seen[key][k]=safeRupiah(BigInt(seen[key][k])+BigInt(o[k]))});return}seen[key]=o;out.push(o)});
 if(!out.length)throw new Error('Tidak ada baris pesanan di file');const minBySku={},orders={};let tp=0n;out.forEach(o=>{if(o.sku&&o.gross_revenue>0&&(!minBySku[o.sku]||o.gross_revenue<minBySku[o.sku]))minBySku[o.sku]=o.gross_revenue});out.forEach(o=>{tp+=BigInt(o.tp);orders[o.order_id]=1;if(!o.sku||!minBySku[o.sku])return;const gross=BigInt(o.gross_revenue),base=BigInt(minBySku[o.sku]),n=(gross*2n+base)/(2n*base),diff=gross-n*base,absDiff=diff<0n?-diff:diff;if(n>=2n&&absDiff*100n<4n*base){if(n>BigInt(Number.MAX_SAFE_INTEGER))throw new RangeError('Jumlah produk melebihi batas integer aman');o.qty=Number(n)}});return{rows:out,tp:safeRupiah(tp),qe:out.filter(o=>o.qty>1).length,orders:Object.keys(orders).length};}
function parseShopeeOrders(R){let hi=-1;const lower=r=>r.map(x=>String(x==null?'':x).trim().toLowerCase());for(let i=0;i<Math.min(R.length,12);i++){const l=lower(R[i]);if(l.includes('no. pesanan')&&l.includes('nomor referensi sku')){hi=i;break}}if(hi<0)throw new Error('Bukan laporan Order completed Shopee');
 const h=lower(R[hi]),ci=colIndex(h,['no. pesanan']),cs=colIndex(h,['nomor referensi sku']),cn=colIndex(h,['nama produk']),cv=colIndex(h,['nama variasi']),cq=colIndex(h,['jumlah']),cr=colIndex(h,['returned quantity']),cp=colIndex(h,['harga setelah diskon']),cst=colIndex(h,['status pesanan']),out=[],seen={},orders={};
 R.slice(hi+1).forEach(r=>{const id=String(r[ci]==null?'':r[ci]).trim();if(id.length<8)return;const st=cst>=0?String(r[cst]).toLowerCase():'';if(/batal|cancel/.test(st))return;const sku=String(r[cs]||'').trim(),nm=String(r[cn]||'').trim(),q0=parseIDR(r[cq])||1,rq=cr>=0?parseIDR(r[cr]):0,k='oi|'+id+'|'+sku+'|'+nm.slice(0,40)+'|'+(cv>=0?String(r[cv]||''):'');if(seen[k]){seen[k].q0+=q0;seen[k].rq+=rq;seen[k].qty=Math.max(seen[k].q0-seen[k].rq,0);return}const o={id:k,order_id:id,sku,name:nm,q0,rq,qty:Math.max(q0-rq,0),price:cp>=0?parseIDR(r[cp]):0};seen[k]=o;out.push(o);orders[id]=1});if(!out.length)throw new Error('Tidak ada baris pesanan di file');return{rows:out,orders:Object.keys(orders).length};}
function aggregateERP(payload){
 const month=payload.month||'',RAW=payload.raw||[],OPX=payload.opex||[],ITM=payload.items||{},SNAP=payload.snapshot||{},P=payload.products||[];
 const keys=['om','fv','fs','fa','fx','fp','fr','fk','ft','fee','tp','hpp','ox'],B={};keys.forEach(k=>B[k]=0n);
 const T={miss:{},n:0,nr:0,nl:0};
 const asBig=v=>{if(v==null||v==='')return 0n;if(typeof v==='bigint')return v;if(!Number.isSafeInteger(v))throw new RangeError('Nominal ERP harus berupa integer Rupiah aman');return BigInt(v)};
 const matches=(x)=>{const list=ITM[x.order_id];if(!list||!list.length)return null;const nm=String(x.name||'').toLowerCase().trim();let c=list.filter(it=>{const n=String(it.name||'').toLowerCase().trim();return nm&&n&&(n===nm||n.slice(0,30)===nm.slice(0,30))});if(!c.length&&list.length===1)c=list;if(c.length>1){const target=asBig(x.gross_revenue);const exact=c.filter(it=>{const total=asBig(it.price)*asBig(it.q0);const diff=total-target;return (diff<0n?-diff:diff)<2n});if(exact.length)c=exact}return c.length===1?c[0]:null};
 const findCost=x=>{const sku=String(x.sku||''),rsku=String(x.rsku||'').toLowerCase(),name=String(x.name||'').toLowerCase().trim();
  if(rsku)for(const p of P)if(asBig(p.m)>0n&&String(p.sku||'').toLowerCase()===rsku)return asBig(p.m);
  if(sku)for(const p of P)if(asBig(p.m)>0n&&(String(p.sku||'').toLowerCase()===sku.toLowerCase()||String(p.lnk||'').includes(sku)))return asBig(p.m);
  if(name.length>=8)for(const p of P){const pn=String(p.n||'').toLowerCase().trim();if(asBig(p.m)>0n&&pn.length>=8&&(pn===name||name.startsWith(pn)||pn.startsWith(name)))return asBig(p.m)}
  return null;
 };
 for(const x of RAW){if(month&&String(x.date||'').slice(0,7)!==month)continue;B.om+=asBig(x.gross_revenue);for(const k of ['fv','fs','fa','fx','fp','fr','fk','ft','tp'])B[k]+=asBig(x[k]);B.fee+=asBig(x.platform_fee);
  const sn=SNAP[x.id];if(sn&&Number.isSafeInteger(sn.hs)){B.hpp+=asBig(sn.hs);T.n++;T.nl++;continue}
  const it=matches(x),q=it?it.qty:x.qty,h=findCost(it?{sku:x.sku,rsku:it.sku,name:x.name}:x);if(!it)T.nr++;
  if(h==null)T.miss[((it&&it.sku?it.sku+' ':'')+(x.name||x.sku||'(kosong)')).slice(0,44)]=1;else B.hpp+=h*asBig(q);
  T.n++;
 }
 for(const x of OPX)if(!month||String(x.date||'').slice(0,7)===month)B.ox+=asBig(x.amount);
 for(const k of keys)T[k]=safeRupiah(B[k]);B.lk=B.om+B.fv+B.fs-B.fee-B.ft-B.hpp;B.nb=B.lk-B.ox;T.lk=safeRupiah(B.lk);T.nb=safeRupiah(B.nb);return T;
}
function ent(s){return String(s).replace(/&#x([0-9a-f]+);/gi,(_,x)=>String.fromCodePoint(parseInt(x,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d)).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&')}
function zip(buffer){const u=new Uint8Array(buffer),dv=new DataView(buffer);let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error('File bukan .xlsx yang valid');const n=dv.getUint16(e+10,true);let o=dv.getUint32(e+16,true);const F={};for(let i=0;i<n;i++){const m=dv.getUint16(o+10,true),cs=dv.getUint32(o+20,true),nl=dv.getUint16(o+28,true),el=dv.getUint16(o+30,true),cl=dv.getUint16(o+32,true),lo=dv.getUint32(o+42,true),name=new TextDecoder().decode(u.subarray(o+46,o+46+nl)),st=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true);F[name]={m,d:u.subarray(st,st+cs)};o+=46+nl+el+cl}return F}
async function inf(f){if(f.m===0)return f.d;if(typeof DecompressionStream==='undefined')throw new Error('Browser belum mendukung baca .xlsx. Simpan sebagai CSV');const ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();await w.write(f.d);await w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer())}
function cx(s){let n=0;for(let i=0;i<s.length;i++)n=n*26+s.charCodeAt(i)-64;return n-1}
function sheetRows(xml,shared){const rows=[];(xml.match(/<row\b[\s\S]*?<\/row>/g)||[]).forEach(rw=>{const row=[];const re=/<c\b([^>]*?)(\/>|>([\s\S]*?)<\/c>)/g;let m;while((m=re.exec(rw))){const ref=m[1].match(/\br="([A-Z]+)\d+"/),typ=m[1].match(/\bt="(\w+)"/),body=m[3]||'';if(!ref)continue;let val='';if(typ&&typ[1]==='s'){const v=body.match(/<v>([\s\S]*?)<\/v>/);val=v?shared[+v[1]]:''}else if(typ&&typ[1]==='inlineStr'){val=(body.match(/<t\b[^>]*>[\s\S]*?<\/t>/g)||[]).map(t=>ent(t.replace(/<[^>]+>/g,''))).join('')}else{const v=body.match(/<v>([\s\S]*?)<\/v>/);val=v?ent(v[1]):''}row[cx(ref[1])]=val}for(let i=0;i<row.length;i++)if(row[i]===undefined)row[i]='';rows.push(row)});return rows}
async function parseXlsx(buffer){const F=zip(buffer);const read=async name=>F[name]?new TextDecoder().decode(await inf(F[name])):'';const ss=await read('xl/sharedStrings.xml');const shared=(ss.match(/<si\b[\s\S]*?<\/si>/g)||[]).map(si=>ent(si.replace(/<rPh\b[\s\S]*?<\/rPh>/g,'').match(/<t\b[^>]*>[\s\S]*?<\/t>/g)?.map(t=>t.replace(/<[^>]+>/g,'' )).join('')||''));const names=Object.keys(F).filter(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n));for(const name of names){const R=sheetRows(await read(name),shared);if(R.slice(0,12).some(r=>{const l=r.map(x=>String(x).trim().toLowerCase());return l.includes('no. pesanan')&&(l.includes('harga produk')||l.includes('nomor referensi sku'))}))return R}throw new Error('Sheet laporan Shopee tidak ditemukan di file')}

self.onmessage = async ({data}) => {
  const {id, type, payload={}} = data || {};
  try {
    let result;
    if (type === 'calculate-product') {
      result = calculateProduct(payload);
    } else if (type === 'money-pipeline') {
      const handlers = (payload.stages || []).map(stage => (ctx, next) => {
        const fee = mulBps(ctx.gross, stage.basisPoints);
        ctx.fees += fee;
        ctx.stages.push({name:stage.name, amount:fee.toString()});
        return next();
      });
      const ctx = {gross:toMinor(payload.grossCents), cost:toMinor(payload.costCents), fees:0n, stages:[]};
      chain(ctx, handlers);
      result={grossCents:ctx.gross.toString(),costCents:ctx.cost.toString(),feesCents:ctx.fees.toString(),netCents:(ctx.gross-ctx.cost-ctx.fees).toString(),stages:ctx.stages};
    } else if(type==='parse-csv') {
      result=parseCSV(payload.text);
    } else if(type==='parse-xlsx') {
      result=await parseXlsx(payload.buffer);
    } else if(type==='parse-shopee-report') {
      result=parseShopeeReport(payload.rows);
    } else if(type==='parse-shopee-orders') {
      result=parseShopeeOrders(payload.rows);
    } else if(type==='aggregate-erp') {
      result=aggregateERP(payload);
    } else if(type==='filter') {
      const q=String(payload.query||'').toLocaleLowerCase().trim();
      result=(payload.items||[]).filter(x=>String(x.searchText||'').toLocaleLowerCase().includes(q));
    } else if(type==='sort') {
      result=[...(payload.items||[])].sort((a,b)=>String(a[payload.key]??'').localeCompare(String(b[payload.key]??''),'id'));
    } else throw new Error('Operasi worker tidak dikenal: '+type);
    self.postMessage({id,ok:true,result});
  } catch(e) { self.postMessage({id,ok:false,error:e.message}); }
};
