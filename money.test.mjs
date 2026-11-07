import assert from 'node:assert/strict';
import { parseIDR, sumRupiah, multiplyRupiah, toSafeNumber, percentUnits, percentOfRupiah, discountedPrice, grossUpDiscount, safeMoneySum, estimateGrossPrice } from '../js/money.js';
assert.equal(parseIDR('Rp 1.234.567'),1234567);
assert.equal(parseIDR('1.234,56'),1235);
assert.equal(parseIDR('1,234.56'),1235);
assert.equal(parseIDR('12,4'),12);
assert.equal(parseIDR('12,5'),13);
assert.equal(parseIDR('-12,5'),-13);
assert.equal(parseIDR('-12,49'),-12);
assert.equal(parseIDR('-12,50'),-13);
assert.equal(parseIDR('-0,5'),-1);
assert.equal(parseIDR('-12,51'),-13);
assert.equal(sumRupiah([9007199254740000n,1000n]),9007199254741000n);
assert.equal(multiplyRupiah(12500,3),37500n);
assert.equal(percentUnits('6,5'),65000n);
assert.equal(percentOfRupiah(10000,'6.5'),650);
assert.equal(percentOfRupiah(-10000,'6.5'),-650);
assert.equal(percentOfRupiah(10000,'6.55555'),656);
assert.equal(discountedPrice(1000,'12.5'),875);
assert.equal(discountedPrice(1000,'12.34'),876);
assert.equal(discountedPrice(100,120),0);
assert.equal(safeMoneySum([100,-25,5]),80);
assert.equal(estimateGrossPrice(10000,5,[{rate:10,cap:500}]),11053);
assert.equal(estimateGrossPrice(10000,[5,'0.1','0.2'],[]),Math.ceil(10000/(1-.053)));
assert.equal(estimateGrossPrice(10000,[5,'0.1','0.2'],[]),10560);
assert.equal(estimateGrossPrice(10000,20,[{rate:80,cap:500}]),13125);
assert.equal(estimateGrossPrice(10000,100,[]),null);
assert.equal(estimateGrossPrice(25000,'6.5',[{rate:'8.5',cap:2000},{rate:'2.75',cap:1000}]),Math.ceil(Math.min((27000)/(1-.065-.0275),(26000)/(1-.065-.085),(28000)/(1-.065-.085-.0275))));
assert.throws(()=>estimateGrossPrice(10000,5,[{rate:10,cap:-1}]),/Batas tarif/);

assert.equal(grossUpDiscount(70000,30),100000);
assert.equal(grossUpDiscount(137,80),685); // Exact division; legacy floating-point Math.ceil could overestimate to 686.
assert.equal(grossUpDiscount(875,12.5),1000);
assert.equal(grossUpDiscount(1,99.9999),1000000);
assert.equal(grossUpDiscount(0,99.99),0);
assert.throws(()=>grossUpDiscount(100,100),/Diskon harus/);
assert.throws(()=>grossUpDiscount(100,-1),/Diskon harus/);
assert.throws(()=>grossUpDiscount(-1,10),/tidak boleh negatif/);
// Rational gross-up must be exact across rates and amounts, including values near a rounding boundary.
for (const amount of [1,2,7,99,100,101,999,1000,12345,999999,9007199254740000]) {
  for (const rate of ['0','0.01','1','6.5','12.34','30','50','75','99.9','99.9999']) {
    if (amount > 1000000000000 && rate !== '0') continue;
    const units=percentUnits(rate), den=1000000n-units, num=BigInt(amount)*1000000n;
    const expected=num/den+(num%den===0n?0n:1n);
    assert.equal(grossUpDiscount(amount,rate),Number(expected));
  }
}

assert.throws(()=>parseIDR('12abc'),/tidak valid/);
assert.throws(()=>toSafeNumber(9007199254740992n),/batas integer aman/);
assert.throws(()=>percentUnits('abc'),/Persentase tidak valid/);
console.log('Money tests: exact gross-up and regression assertions passed');
