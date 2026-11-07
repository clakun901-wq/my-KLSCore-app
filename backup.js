/* Orkestrasi cadangan Kalsara. State aplikasi tetap dimiliki legacy melalui getter/callback dinamis. */
/* flush  : fungsi async yang menunggu data benar-benar tersimpan di penyimpanan tetap (opsional; bawaan: langsung selesai).
 * limits : batas jumlah yang SANGGUP dimuat aplikasi, mis. { rows: 1000, promos: 300, sales: 5000 } (opsional).
 *          Dipakai agar pesan konfirmasi jujur tentang jumlah yang benar-benar dimuat. */
export function createBackup({ parseBackupText, snapshotState, ERP, getSales, applyState, persist, ask, toast, onFailure, onRestored, flush = () => Promise.resolve(), limits = {} }) {
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
    const fileProducts = data.rows.length;
    const filePromos = Array.isArray(data.pr) ? data.pr.length : 0;
    const fileSales = Array.isArray(data.sl) ? data.sl.length : null;
    // Jumlah yang BENAR-BENAR akan dimuat (aplikasi memotong yang melebihi batas).
    const productCount = Math.min(fileProducts, limits.rows ?? Infinity);
    const promoCount = Math.min(filePromos, limits.promos ?? Infinity);
    const salesCount = fileSales === null ? null : Math.min(fileSales, limits.sales ?? Infinity);
    const cut = [];
    if (productCount < fileProducts) cut.push((fileProducts - productCount).toLocaleString('id-ID') + ' produk');
    if (promoCount < filePromos) cut.push((filePromos - promoCount).toLocaleString('id-ID') + ' promo');
    if (salesCount !== null && salesCount < fileSales) cut.push((fileSales - salesCount).toLocaleString('id-ID') + ' catatan penjualan terlama');
    const cutWarning = cut.length
      ? ' PERINGATAN: file berisi ' + fileProducts.toLocaleString('id-ID') + ' produk, tetapi aplikasi hanya dapat memuat ' + productCount.toLocaleString('id-ID') + ' produk. Yang TIDAK akan dimuat dan hilang dari data aplikasi: ' + cut.join(', ') + '. File cadangan Anda sendiri tidak berubah.'
      : '';
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
      'Pulihkan ' + productCount.toLocaleString('id-ID') + ' produk dan ' + promoCount.toLocaleString('id-ID') + ' promo' +
      (salesCount === null ? ', penjualan saat ini dipertahankan' : ', ' + salesCount.toLocaleString('id-ID') + ' catatan penjualan') +
      erpSummary + '? Data saat ini akan diganti.' + cutWarning,
      'Ya, pulihkan',
      function () {
        const finish = function () {
          if (data.sl === undefined) data.sl = getSales().slice();
          applyState(data);
          persist();
          // Jangan umumkan sukses sebelum data benar-benar tersimpan di penyimpanan tetap.
          toast('Menyimpan... jangan tutup aplikasi dulu.');
          Promise.resolve().then(flush).then(
            function () {
              onRestored(productCount, !!erpCheck);
              toast('Data dipulihkan: ' + productCount.toLocaleString('id-ID') + ' produk' + (erpCheck ? ' dan data ERP' : '') + (cut.length ? ' (' + cut.join(', ') + ' tidak dimuat)' : ''));
            },
            function (error) {
              onFailure('Data tampil di layar tetapi BELUM tersimpan permanen: ' + ((error && error.message) || 'tidak diketahui') + '. Jangan tutup aplikasi; coba pulihkan lagi atau buat cadangan.');
            }
          );
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
