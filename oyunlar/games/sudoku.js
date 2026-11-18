/* Günlük Sudoku — her gün herkese aynı bulmaca (kolay, orta, zor). Tek çözümlü olarak üretilir. */
(function(){
function rng(seed){ let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
function karistir(a, r){ for (let i = a.length - 1; i > 0; i--) { const j = r() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function adaylar(g, i){ const r = i / 9 | 0, c = i % 9, br = r - r % 3, bc = c - c % 3, u = new Set();
  for (let k = 0; k < 9; k++) { u.add(g[r * 9 + k]); u.add(g[k * 9 + c]); u.add(g[(br + (k / 3 | 0)) * 9 + bc + k % 3]); }
  const o = []; for (let v = 1; v <= 9; v++) if (!u.has(v)) o.push(v); return o; }
function say(g, lim){ /* çözüm sayısı (lim'e kadar) */
  let best = -1, bc = null; for (let i = 0; i < 81; i++) if (!g[i]) { const c = adaylar(g, i); if (!c.length) return 0; if (best < 0 || c.length < bc.length) { best = i; bc = c; if (c.length === 1) break; } }
  if (best < 0) return 1; let n = 0; for (const v of bc) { g[best] = v; n += say(g, lim - n); if (n >= lim) break; } g[best] = 0; return n; }
function doldur(g, r){ for (let i = 0; i < 81; i++) if (!g[i]) { for (const v of karistir(adaylar(g, i), r)) { g[i] = v; if (doldur(g, r)) return true; } g[i] = 0; return false; } return true; }
function uret(seed, ipucu){
  const r = rng(seed), cozum = Array(81).fill(0); doldur(cozum, r);
  const g = cozum.slice(); let kalan = 81;
  for (const i of karistir([...Array(81).keys()], r)) { if (kalan <= ipucu) break; const v = g[i]; g[i] = 0; if (say(g.slice(), 2) !== 1) g[i] = v; else kalan--; }
  return { g, cozum };
}
const ZOR = [['Kolay', 40, 1], ['Orta', 32, 1.6], ['Zor', 26, 2.4]];
registerGame({
  id:'sudoku', title:'Günlük Sudoku', category:'Günlük', tags:'sudoku sayı bulmaca günlük mantık 9x9',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  render(root, api){
    const N = gun(); let z = 1, P, g, sec = -1, hata = 0, bas, bitti, tm;
    const hud = makeHUD(root, [{ id: 'zor', label: 'Zorluk', value: 'Orta' }, { id: 'hata', label: 'Hata', value: 0 }, { id: 'sure', label: 'Süre', value: '0' }]);
    const zbar = E('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', margin: '4px 0 10px' } }); root.append(zbar);
    ZOR.forEach((d, i) => { const b = E('button', { class: 'g-btn ghost' }, d[0]); b.onclick = () => { z = i; kur(); }; zbar.append(b); });
    const tahta = E('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', width: 'min(400px,100%)', margin: '0 auto', border: '2px solid var(--ink)', borderRadius: '6px', overflow: 'hidden', userSelect: 'none' } });
    const pad = E('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px', width: 'min(400px,100%)', margin: '10px auto 0' } });
    const msg = E('div', { class: 'g-msg' });
    const ist = E('div');
    root.append(tahta, pad, msg, ist);
    function istCiz() { ist.innerHTML = ''; if (window.Seri) ist.append(Seri.panel('sudoku', { baslik: 'Günlük Sudoku · istatistik', etiketler: ['Kolay', 'Orta', 'Zor'], dagBaslik: 'Günün en zor çözdüğü', xEtiket: null, api })); }
    if (window.Seri) { const o = Seri.ozet('sudoku'); if (o.bugun) istCiz(); else { const b = E('button', { class: 'g-btn ghost', style: { display: 'block', margin: '12px auto 0' } }, '📊 İstatistik ve seri' + (o.seri ? ' · 🔥 ' + o.seri : '')); b.onclick = () => istCiz(); ist.append(b); } }
    for (let v = 1; v <= 9; v++) { const b = E('button', { class: 'g-btn ghost', style: { fontSize: '20px', fontWeight: '800', padding: '10px 0' } }, String(v)); b.onclick = () => gir(v); pad.append(b); }
    const sil = E('button', { class: 'g-btn ghost', style: { fontSize: '18px' } }, '⌫'); sil.onclick = () => gir(0); pad.append(sil);
    function kur() {
      [...zbar.children].forEach((c, i) => { const on = i === z; c.style.background = on ? 'var(--accent)' : ''; c.style.color = on ? '#fff' : ''; });
      msg.textContent = 'Bulmaca hazırlanıyor…';
      setTimeout(() => { P = uret((N + 1) * 31 + z * 7, ZOR[z][1]);
        const k = (api.loadState && api.loadState()) || {}; const kay = k['s' + N + '_' + z];
        g = kay && kay.g ? kay.g : P.g.slice(); hata = kay ? kay.h || 0 : 0; bitti = !!(kay && kay.b); sec = -1; bas = Date.now() - (kay ? kay.t || 0 : 0);
        hud.set('zor', ZOR[z][0]); hud.set('hata', hata); clearInterval(tm); tm = setInterval(() => { if (!bitti) hud.set('sure', ((Date.now() - bas) / 1000) | 0); }, 1000);
        msg.textContent = bitti ? 'Bu zorluğu bugün bitirdin. Yarın yeni bulmaca!' : 'Bir kareye dokun, sonra sayıyı seç. Klavye de çalışır.'; ciz();
        if (bitti && window.Seri) { Seri.kaydet('sudoku', N, { ok: true, b: z, max: true }); istCiz(); } }, 20);
    }
    function sakla() { if (!api.saveState) return; const k = api.loadState() || {}; for (const key in k) if (!key.startsWith('s' + N + '_')) delete k[key]; k['s' + N + '_' + z] = { g, h: hata, t: Date.now() - bas, b: bitti }; api.saveState(k); }
    function ciz() {
      tahta.innerHTML = ''; const sv = sec >= 0 ? g[sec] : 0, sr = sec / 9 | 0, sc = sec % 9;
      for (let i = 0; i < 81; i++) { const r = i / 9 | 0, c = i % 9, sabit = P.g[i] !== 0, v = g[i], yanlis = v && !sabit && v !== P.cozum[i];
        const ayni = sec >= 0 && (r === sr || c === sc || ((r / 3 | 0) === (sr / 3 | 0) && (c / 3 | 0) === (sc / 3 | 0)));
        const d = E('button', { style: { aspectRatio: '1', border: 'none', borderRight: c % 3 === 2 && c < 8 ? '2px solid var(--ink)' : '1px solid var(--line)', borderBottom: r % 3 === 2 && r < 8 ? '2px solid var(--ink)' : '1px solid var(--line)',
          background: i === sec ? 'var(--accent-soft)' : v && v === sv ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : ayni ? 'var(--bg2)' : 'transparent', color: yanlis ? 'var(--bad,#d33)' : sabit ? 'var(--ink)' : 'var(--accent)', fontWeight: sabit ? '800' : '600', fontSize: 'clamp(16px,5vw,22px)', padding: '0', cursor: 'pointer' } }, v ? String(v) : '');
        d.onclick = () => { sec = i; ciz(); }; tahta.append(d); }
    }
    function gir(v) {
      if (bitti || sec < 0 || P.g[sec]) return;
      g[sec] = v; if (v && v !== P.cozum[sec]) { hata++; hud.set('hata', hata); if (api.sound) api.sound('lose'); } else if (api.sound) api.sound('tap');
      if (g.every((x, i) => x === P.cozum[i])) { bitti = true; const sn = ((Date.now() - bas) / 1000) | 0, skor = Math.round(Math.max(100, 2000 - sn * 2 - hata * 100) * ZOR[z][2]);
        msg.textContent = 'Tamamlandı! 🎉 ' + Math.floor(sn / 60) + ' dk ' + sn % 60 + ' sn · ' + hata + ' hata · ' + skor + ' puan'; if (api.sound) api.sound('win'); api.submitScore(skor);
        if (window.Seri) { Seri.kaydet('sudoku', N, { ok: true, b: z, max: true }); istCiz(); } }
      sakla(); ciz();
    }
    const kl = e => { if (e.key >= '1' && e.key <= '9') gir(+e.key); else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') gir(0);
      else if (sec >= 0 && e.key.startsWith('Arrow')) { e.preventDefault(); const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key]; sec = (sec + d + 81) % 81; ciz(); } };
    addEventListener('keydown', kl); if (api.onCleanup) api.onCleanup(() => { removeEventListener('keydown', kl); clearInterval(tm); });
    kur();
  }
});
})();
