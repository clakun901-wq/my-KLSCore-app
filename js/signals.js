/* Signals Core via CDN, with a tiny offline fallback so app boot is not blocked. */
let core;
try { core = await import('https://cdn.jsdelivr.net/npm/@preact/signals-core@1.8.0/+esm'); }
catch (error) {
  console.warn('Signals CDN belum tersedia; memakai fallback reaktif lokal sementara.', error);
  const signal = value => {
    const subscribers=new Set();
    return {get value(){return value;},set value(v){if(Object.is(v,value))return;value=v;subscribers.forEach(fn=>fn());},subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);}};
  };
  const computed = fn => ({get value(){return fn();}});
  const effect = fn => {fn();};
  core={signal,computed,effect};
}
export const appRevision=core.signal(0);
export const activeView=core.signal(0);
export const appReady=core.computed(()=>appRevision.value>=0);
export function touchState(){appRevision.value++;}
export const {signal,computed,effect}=core;
