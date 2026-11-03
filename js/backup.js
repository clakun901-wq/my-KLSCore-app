/* Orkestrasi cadangan Kalsara. State aplikasi tetap dimiliki legacy melalui getter/callback dinamis. */
export function createBackup({ parseBackupText, snapshotState, ERP, getSales, applyState, persist, ask, toast, onFailure, onRestored }) {
  function full(light) {
    let snapshot;
    try {
      snapshot = snapshotState();
      if (light) delete snapshot.sl;
    } catch (error) {
      return Promise.resolve({ t: null, err: error?.message || 'gagal membaca data' });
    }
    if (light) return Promise.resolve({ t: JSON.stringify(snapshot), erp: false });
    return ERP.dump().then(
      data => {
        try {
          snapshot.erp = data;
          snapshot.bv = 2;
          return { t: JSON.stringify(snapshot), erp: true, n: data.n };
        } catch {
          return { t: null, erp: false };
        }
      },
      error => {
        let t = null;
        try { t = JSON.stringify(snapshot); } catch {}
        return { t, erp: false, err: error?.message || 'gagal dibaca' };
      }
    );
  }

  function restoreText(text) {
    const parsed = parseBackupText(text);
    if (!parsed.ok) { onFailure(parsed.message); return; }
    const data = parsed.data;
    const productCount = data.rows.length;
    const promoCount = Array.isArray(data.pr) ? data.pr.length : 0;
    const salesCount = Array.isArray(data.sl) ? data.sl.length : null;
    let erpCheck = null;
    if (data.erp !== undefined && data.erp !== null) {
      erpCheck = ERP.check(data.erp);
      if (!erpCheck.ok) {
        onFailure('Cadangan tidak bisa dipulihkan: ' + erpCheck.msg + '. Data Anda tidak diubah.');
        return;
      }
    }
    const erpSummary = erpCheck
      ? ', beserta data ERP (' + (erpCheck.n.marketplaces_raw || 0) + ' baris laporan, ' + (erpCheck.n.order_items || 0) + ' detail pesanan, ' + (erpCheck.n.opex || 0) + ' OpEx)'
      : '. Data ERP saat ini tidak diubah';
    ask(
      'Pulihkan ' + productCount + ' produk dan ' + promoCount + ' promo' +
      (salesCount === null ? ', penjualan saat ini dipertahankan' : ', ' + salesCount.toLocaleString('id-ID') + ' catatan penjualan') +
      erpSummary + '? Data saat ini akan diganti.',
      'Ya, pulihkan',
      function () {
        const finish = function () {
          if (data.sl === undefined) data.sl = getSales().slice();
          applyState(data);
          persist();
          onRestored(productCount, !!erpCheck);
          toast('Data dipulihkan: ' + productCount + ' produk' + (erpCheck ? ' dan data ERP' : ''));
        };
        if (!erpCheck) { finish(); return; }
        toast('Memulihkan data ERP...');
        ERP.restore(data.erp).then(finish, error => {
          onFailure('Pemulihan ERP gagal: ' + ((error && error.message) || 'tidak diketahui') + '. Data produk dan promo belum diubah.');
        });
      }
    );
  }

  return { full, restoreText };
}
