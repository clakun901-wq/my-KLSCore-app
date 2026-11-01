// Modul Akurasi Finansial (Integer Math)
export const toCents = (val) => Math.round(Number(val) * 100);
export const fromCents = (val) => Number(val) / 100;

export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;
export const mul = (a, pct) => Math.round(a * pct / 100); // pct 10 = 10%

export const formatRp = (cents) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(fromCents(cents));
};
