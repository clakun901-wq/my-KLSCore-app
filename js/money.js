/* Exact integer-Rupiah helpers. No binary floating-point arithmetic is used for parsing or accumulation. */
const MAX = BigInt(Number.MAX_SAFE_INTEGER);
function parseIDR(input) {
  let s = String(input ?? '').trim().replace(/^rp\.?\s*/i, '').replace(/[\s\u00a0]/g, '');
  if (!s) return 0;
  let sign = 1n;
  if (s[0] === '-' || s[0] === '+') { if (s[0] === '-') sign = -1n; s = s.slice(1); }
  if (!s || !/^[\d.,]+$/.test(s)) throw new TypeError('Nominal Rupiah tidak valid: ' + input);
  const dots = (s.match(/\./g) || []).length;
  const commas = (s.match(/,/g) || []).length;
  let whole = s, fraction = '';
  if (dots && commas) {
    const decimal = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    const grouping = decimal === ',' ? /\./g : /,/g;
    const at = s.lastIndexOf(decimal);
    whole = s.slice(0, at).replace(grouping, '');
    fraction = s.slice(at + 1);
  } else if (commas) {
    if (/^\d{1,3}(,\d{3})+$/.test(s)) whole = s.replace(/,/g, '');
    else { const at=s.lastIndexOf(','); whole=s.slice(0,at).replace(/,/g,''); fraction=s.slice(at+1); }
  } else if (dots) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) whole=s.replace(/\./g,'');
    else { const at=s.lastIndexOf('.'); whole=s.slice(0,at).replace(/\./g,''); fraction=s.slice(at+1); }
  }
  if (!/^\d+$/.test(whole || '') || (fraction && !/^\d+$/.test(fraction))) throw new TypeError('Nominal Rupiah tidak valid: ' + input);
  let value = BigInt(whole || '0');
  if (fraction) {
    const first = Number(fraction[0]);
    const tailNonZero = /[1-9]/.test(fraction.slice(1));
    // Rupiah is rounded half away from zero, consistently for both signs.
    if (first >= 5) value += 1n;
  }
  value *= sign;
  if (value > MAX || value < -MAX) throw new RangeError('Nominal Rupiah melebihi batas integer aman JavaScript');
  return Number(value);
}
function asBigIntRupiah(value) {
  if (typeof value === 'bigint') return value;
  if (!Number.isSafeInteger(value)) throw new RangeError('Nominal Rupiah harus berupa integer aman');
  return BigInt(value);
}
function toSafeNumber(value) {
  const n = typeof value === 'bigint' ? value : BigInt(value);
  if (n > MAX || n < -MAX) throw new RangeError('Total Rupiah melebihi batas integer aman');
  return Number(n);
}
function sumRupiah(values) { return values.reduce((sum, value) => sum + asBigIntRupiah(value), 0n); }
function multiplyRupiah(amount, quantity) {
  if (!Number.isSafeInteger(quantity)) throw new RangeError('Kuantitas harus berupa integer aman');
  return asBigIntRupiah(amount) * BigInt(quantity);
}

function percentUnits(rate) {
  let s=String(rate ?? '0').trim().replace(',', '.');
  const m=s.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if(!m) throw new TypeError('Persentase tidak valid: '+rate);
  const sign=m[1]==='-'?-1n:1n, frac=m[3]||'';
  let units=BigInt(m[2])*10000n+BigInt((frac.slice(0,4)+'0000').slice(0,4)||'0');
  if(frac.length>4&&Number(frac[4])>=5) units++;
  return units*sign;
}
function percentOfRupiah(amount, rate) {
  const a=asBigIntRupiah(amount), units=percentUnits(rate), product=a*units, divisor=1000000n;
  const rounded=product>=0n?(product+divisor/2n)/divisor:(product-divisor/2n)/divisor;
  return toSafeNumber(rounded);
}
function grossUpDiscount(discountedAmount, discountPercent) {
  const amount = asBigIntRupiah(discountedAmount);
  const rate = percentUnits(discountPercent);
  const base = 1000000n - rate;
  if (amount < 0n) throw new RangeError('Harga setelah diskon tidak boleh negatif');
  if (rate < 0n || base <= 0n) throw new RangeError('Diskon harus >= 0% dan < 100%');
  const numerator = amount * 1000000n;
  const gross = numerator / base + (numerator % base === 0n ? 0n : 1n);
  return toSafeNumber(gross);
}

function discountedPrice(price, discountPercent) {
  const p=asBigIntRupiah(price), units=percentUnits(discountPercent);
  const numerator=p*(1000000n-units);
  let result=numerator/1000000n;
  if(numerator<0n && numerator%1000000n!==0n) result--;
  if(result<0n) result=0n;
  return toSafeNumber(result);
}
function safeMoneySum(values) { return toSafeNumber(sumRupiah(values)); }

// Exact rational starting-price estimate for the legacy capped-fee search.
// Rates are percentage points with 4 decimal places; caps and fixed costs are integer Rupiah.
function estimateGrossPrice(fixedCost, baseRate, cappedFees) {
  const cost = asBigIntRupiah(fixedCost);
  const base = Array.isArray(baseRate) ? baseRate.reduce((sum, rate) => sum + percentUnits(rate), 0n) : percentUnits(baseRate);
  if (!Array.isArray(cappedFees) || cappedFees.length > 20) throw new TypeError('Daftar tarif berbatas tidak valid');
  let bestNum = null, bestDen = null;
  const count = 1 << cappedFees.length;
  for (let mask = 0; mask < count; mask++) {
    let numerator = cost, rate = base;
    for (let i = 0; i < cappedFees.length; i++) {
      const item = cappedFees[i];
      if (!item || !Number.isSafeInteger(item.cap) || item.cap < 0) throw new TypeError('Batas tarif harus berupa Rupiah integer');
      if ((mask >> i) & 1) numerator += BigInt(item.cap);
      else rate += percentUnits(item.rate);
    }
    const denominator = 1000000n - rate;
    if (denominator <= 0n) continue;
    const scaledNumerator = numerator * 1000000n;
    // Compare exact fractions; do not convert to Number until the final seed.
    if (bestNum === null || scaledNumerator * bestDen < bestNum * denominator) {
      bestNum = scaledNumerator; bestDen = denominator;
    }
  }
  if (bestNum === null) return null;
  let result = bestNum / bestDen;
  if (bestNum % bestDen > 0n) result++;
  return toSafeNumber(result);
}

globalThis.KalsaraMoney = Object.freeze({ parseIDR, asBigIntRupiah, toSafeNumber, sumRupiah, multiplyRupiah, percentUnits, percentOfRupiah, discountedPrice, grossUpDiscount, safeMoneySum, estimateGrossPrice });
export { parseIDR, asBigIntRupiah, toSafeNumber, sumRupiah, multiplyRupiah, percentUnits, percentOfRupiah, discountedPrice, grossUpDiscount, safeMoneySum, estimateGrossPrice };
