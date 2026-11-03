/* Parser murni untuk teks cadangan. Tidak menyentuh storage maupun state aplikasi. */
export function parseBackupText(text) {
  const raw = String(text).replace(/^\ufeff/, '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0) return { ok: false, message: 'Cadangan tidak valid: tidak ada data.' };
  const body = end > start ? raw.slice(start, end + 1) : raw.slice(start);
  let data;
  try { data = JSON.parse(body); }
  catch (_) {
    const message = end > start && /\}\s*$/.test(raw)
      ? 'Cadangan tidak valid atau rusak.'
      : 'Teks cadangan tampak terpotong (' + raw.length.toLocaleString('id-ID') + ' karakter). Salin ulang dari awal sampai akhir, atau pakai file cadangan.';
    return { ok: false, message };
  }
  if (!data || !data.A || !Array.isArray(data.rows))
    return { ok: false, message: 'Cadangan tidak valid: bukan data Kalsara.' };
  return { ok: true, data };
}
