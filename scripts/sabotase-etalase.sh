#!/usr/bin/env bash
# Uji sabotase modul Etalase: di SALINAN paket, fungsi shop() dibuat memakai rows=[].
# Harapan: tes unit etalase DAN E2E shelf/penjualan GAGAL. Bila ada yang LULUS, tesnya lemah.
# Pakai: bash scripts/sabotase-etalase.sh   (perlu node, python3 + playwright + Chromium)
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; cp -r "$ROOT/." "$TMP/"; cd "$TMP"
sed -i 's/function shop(){var rows=getRows(),/function shop(){var rows=[],/' js/etalase-view.js
grep -q 'function shop(){var rows=\[\],' js/etalase-view.js || { echo "Sabotase gagal dipasang (teks berubah?)"; exit 2; }
bad=0
node tests/etalase-view.test.mjs >/dev/null 2>&1 && { echo "LEMAH: etalase-view.test.mjs lulus padahal disabotase"; bad=1; } || echo "OK: etalase-view.test.mjs gagal (benar)"
for t in shelf penjualan; do
  python3 tests/e2e/$t.e2e.py >/dev/null 2>&1 && { echo "LEMAH: $t.e2e.py lulus padahal disabotase"; bad=1; } || echo "OK: $t.e2e.py gagal (benar)"
done
rm -rf "$TMP"; [ $bad = 0 ] && echo "HASIL: sabotase tertangkap semua." || echo "HASIL: ADA TES LEMAH."; exit $bad
