/*CALC*/
var {gcOf,goT,capG,gfac,goRate,adRate,rate}=createTariff({getA:function(){return A}});
/*5.39: voucher otomatis. Voucher manual (panel) dan voucher berjalan di kartu Promosi bersaing; yang potongannya terbesar (harga pembeli paling rendah) dipakai.*/
var VNO=0;
var {vbest,volt,fees,tmod,fwdL,fwd,impas,calcSync}=createPricing({getA:function(){return A},getVNO:function(){return VNO},pr:pr,Money:globalThis.KalsaraMoney,
 tariff:{adRate:adRate,goRate:goRate,capG:capG,rate:rate},
 hooks:{vcBest:function(){return typeof vcBest==='function'?vcBest:undefined},vcThr:function(){return typeof vcThr==='function'?vcThr:undefined},vcBad:function(){return typeof vcBad==='function'?vcBad:undefined}}});
var CalcCache=createCalcCache({getA:function(){return A},getPRM:function(){return PRM},getRows:function(){return rows},getVNO:function(){return VNO},
 getWorker:function(){return globalThis.KalsaraWorker},calcSync:calcSync,onReady:function(){upd(false)}});
var calc=CalcCache.calc;
/*END*/
