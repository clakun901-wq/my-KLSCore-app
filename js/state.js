
import { signal, computed } from 'https://esm.sh/@preact/signals-core@1.5.1';

export const products = signal([]);
export const settings = signal({
  tp: 'ns', fb: 'no', fl: 1250, pb: 0, pbc: 50000, ad: 6.5, ac: 'F', gc: 'D', sz: 'b', gf: 100
});

export const totalProfit = computed(() => {
  let sum = 0;
  for (const p of products.value) {
    if (p.calculatedProfit) sum += p.calculatedProfit;
  }
  return sum; // integer math (in cents / multiplied by 100)
});
