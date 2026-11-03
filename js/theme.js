/* Preferensi tampilan yang tidak bergantung pada state bisnis aplikasi. */
export function createTheme({ $, KStore, KDOM, toast, document }) {
  const TH = ['auto', 'light', 'dark'];
  const THN = { auto: 'Otomatis', light: 'Terang', dark: 'Gelap' };
  const THI = {
    auto: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>'
  };
  function thm(v, save) {
    const h = document.documentElement;
    if (v === 'auto') h.removeAttribute('data-theme'); else h.setAttribute('data-theme', v);
    const b = $('thm');
    KDOM.setHTML(b, THI[v]);
    b.setAttribute('aria-label', 'Tema: ' + THN[v] + '. Ketuk untuk ganti');
    if (save) { try { KStore.setItem('kalsara_theme', v); } catch (_) {} }
  }
  $('thm').onclick = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'auto';
    const next = TH[(TH.indexOf(current) + 1) % 3];
    thm(next, true); toast('Tema: ' + THN[next]);
  };
  let initialTheme = 'auto';
  try { initialTheme = KStore.getItem('kalsara_theme') || 'auto'; } catch (_) {}
  thm(TH.includes(initialTheme) ? initialTheme : 'auto', false);

  function setMode(mode, save) {
    document.body.classList.toggle('fast', mode === 'fast');
    document.querySelectorAll('#mseg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === mode));
    if (save) { try { KStore.setItem('kalsara_mode', mode); } catch (_) {} }
  }
  $('mseg').onclick = function (event) {
    const button = event.target.closest('button');
    if (!button) return;
    setMode(button.dataset.m, true);
    toast(button.dataset.m === 'fast' ? 'Mode Cepat: isian penting saja' : 'Mode Lengkap: semua isian');
  };
  let initialMode = 'fast';
  try { initialMode = KStore.getItem('kalsara_mode') || 'fast'; } catch (_) {}
  setMode(initialMode === 'full' ? 'full' : 'fast', false);
  return { setTheme: thm, setMode };
}
