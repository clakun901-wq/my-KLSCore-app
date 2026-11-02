const $=id=>document.getElementById(id);
const results=$('results'),status=$('status'),frame=$('app');
function line(name,ok,detail=''){const li=document.createElement('li');li.className=ok?'ok':'bad';li.textContent=(ok?'LULUS — ':'GAGAL — ')+name+(detail?' ('+detail+')':'');results.append(li);return ok}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){results.replaceChildren();status.textContent='Menunggu aplikasi selesai dimuat…';let pass=0,fail=0;
 const w=frame.contentWindow,d=frame.contentDocument;
 try{
  for(let i=0;i<300&&!(w.KStore&&w.KalsaraMoney&&w.KalsaraWorker);i++)await wait(100);
  if(!w.KStore||!w.KalsaraMoney||!w.KalsaraWorker)throw new Error('Aplikasi belum menginisialisasi KStore/Worker/Money. Periksa Console browser dan dukungan OPFS.');
  const add=(n,ok,detail)=>{if(line(n,ok,detail))pass++;else fail++};
  add('Inisialisasi aplikasi',true,'KStore, Money, Worker tersedia');
  const tabs=[['t0','v0'],['t1','v1'],['t3','v3'],['t4','v4'],['t5','v5'],['t6','v6'],['t2','v2']];
  for(const [tab,view] of tabs){const b=d.getElementById(tab),v=d.getElementById(view);if(!b||!v){add('Navigasi '+tab,false,'elemen tidak ditemukan');continue}b.click();await wait(120);add('Navigasi '+tab+' → '+view,!v.hidden);}
  const money=w.KalsaraMoney.grossUpDiscount(137,80);add('Perhitungan BigInt exact',money===685,'Rp137 pada diskon 80% → Rp685');
  const csv=await w.KalsaraWorker.compute('parse-csv',{text:'A;B\n1;"dua;baris"'});add('Web Worker CSV',csv.length===2&&csv[1][1]==='dua;baris');
  add('OPFS tersedia',!!w.navigator.storage?.getDirectory,'wajib HTTPS atau localhost');
  add('File System Access API tersedia',typeof w.showSaveFilePicker==='function','cek backup manual secara terpisah');
  add('Service Worker tersedia',!!w.navigator.serviceWorker,'perlu HTTPS atau localhost');
  $('status').textContent=`Selesai: ${pass} lulus, ${fail} gagal. Ini smoke test, bukan pengganti regresi semua alur bisnis.`;
  $('status').className=fail?'bad':'ok';
  const nav=d.getElementById('t0');nav?.click();
 }catch(e){line('Startup aplikasi',false,e.message);status.textContent='Tes terhenti: '+e.message;status.className='bad'}
}
frame.addEventListener('load',()=>run(),{once:true});$('run').addEventListener('click',run);
