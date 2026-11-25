/* Günün Cephe Terimi — her gün herkese aynı 3 soru: tanımdan terimi, terimden İngilizcesini bul.
   Sorular Cephe ve BIM Terimleri Sözlüğü'nden (games/terimler-veri.js). Seri ve istatistik: assets/seri.js */
(function(){
function rng(seed){ let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
const karistir = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = r() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const kisa = s => s.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
/* günün soruları: aynı kategoriden çeldiricilerle */
function sorular(N) {
  const T = window.CEPHE_TERIM || [], r = rng((N + 7) * 2654435761), sec = karistir(T, rng(20260101)).slice(0);
  const out = [], kul = new Set();
  for (let k = 0; out.length < 3 && k < 50; k++) {
    const x = sec[((N * 3 + k) * 97) % sec.length]; if (kul.has(x[0])) continue; kul.add(x[0]);
    const tip = (N + out.length) % 2 ? 'en' : 'tanim';
    let havuz = T.filter(y => y[0] !== x[0] && y[1] === x[1]); if (havuz.length < 3) havuz = T.filter(y => y[0] !== x[0]);
    const cel = karistir(havuz, r).filter(y => tip === 'en' ? kisa(y[3]).toLowerCase() !== kisa(x[3]).toLowerCase() : kisa(y[2]) !== kisa(x[2])).slice(0, 3);
    const sik = karistir([x, ...cel], r);
    out.push({ x, tip, sik, dogru: sik.indexOf(x) });
  }
  return out;
}
registerGame({
  id:'cepheterim', title:'Günün Cephe Terimi', category:'Günlük', tags:'cephe terim sözlük günlük bilgi yarışma ingilizce mimarlık mühendislik',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M15 9v12"/></svg>',
  render(root, api){
    const N = gun(), S = sorular(N);
    if (!S.length) { root.append(E('div', { class: 'g-msg' }, 'Terim verisi yüklenemedi.')); return; }
    const st = Object.assign({ gun: N, cev: [] }, (api.loadState && api.loadState()) || {}); if (st.gun !== N) { st.gun = N; st.cev = []; }
    const hud = makeHUD(root, [{ id: 'gun', label: 'Gün', value: '#' + (N + 1) }, { id: 'puan', label: 'Doğru', value: '0/3' }, { id: 'seri', label: 'Seri', value: window.Seri ? '🔥 ' + Seri.ozet('cepheterim').seri : '—' }]);
    const alan = E('div', { style: { width: 'min(520px,100%)', margin: '0 auto' } }), ist = E('div'); root.append(alan, ist);
    const dogruSay = () => st.cev.filter((c, i) => c === S[i].dogru).length;
    function istCiz() { ist.innerHTML = ''; if (window.Seri) ist.append(Seri.panel('cepheterim', { baslik: 'Günün Cephe Terimi · istatistik', etiketler: ['0 doğru', '1 doğru', '2 doğru', '3 doğru'], dagBaslik: 'Günlük sonuç', xEtiket: null, api })); hud.set('seri', window.Seri ? '🔥 ' + Seri.ozet('cepheterim').seri : '—'); }
    function ciz() {
      alan.innerHTML = ''; hud.set('puan', dogruSay() + '/' + S.length);
      S.forEach((q, i) => {
        if (i > st.cev.length) return;
        const cevap = st.cev[i], bitti = cevap != null, kutu = E('div', { style: { border: '1px solid var(--line)', borderRadius: '14px', padding: '14px', margin: '0 0 12px', background: 'var(--bg2)' } });
        kutu.append(E('div', { style: { fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-soft,var(--muted))' } }, (i + 1) + '/' + S.length + ' · ' + ((window.CEPHE_KAT || {})[q.x[1]] || '')));
        kutu.append(E('div', { style: { fontWeight: '700', fontSize: '17px', margin: '6px 0 10px', lineHeight: '1.45' } }, q.tip === 'tanim' ? '“' + q.x[4] + '” — bu hangi terim?' : '“' + q.x[2] + '” teriminin İngilizcesi hangisi?'));
        q.sik.forEach((y, j) => {
          const ok = j === q.dogru, sec = cevap === j;
          const b = E('button', { class: 'g-btn ghost', style: { display: 'block', width: '100%', textAlign: 'left', margin: '6px 0', padding: '11px 14px', fontWeight: '600', background: bitti ? (ok ? 'var(--good,#2f9e6f)' : sec ? '#c0504d' : '') : '', color: bitti && (ok || sec) ? '#fff' : '' } }, q.tip === 'tanim' ? y[2] : y[3]);
          if (!bitti) b.onclick = () => sec_(i, j); kutu.append(b);
        });
        if (bitti) {
          const x = q.x, ek = E('div', { style: { marginTop: '8px', fontSize: '14px', lineHeight: '1.55' } });
          ek.append(E('b', {}, x[2] + ' · ' + x[3]), E('div', {}, x[4]));
          const lk = E('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' } });
          lk.append(E('a', { href: '/egitimler/sozluk/#' + x[0], class: 'g-btn ghost', style: { textDecoration: 'none', padding: '6px 10px', fontSize: '13px' } }, '📚 Sözlükte aç'));
          (x[5] || []).forEach(([a, u]) => lk.append(E('a', { href: u, class: 'g-btn ghost', style: { textDecoration: 'none', padding: '6px 10px', fontSize: '13px' } }, '📖 ' + a)));
          (x[6] || []).forEach(([a, u]) => lk.append(E('a', { href: u, class: 'g-btn ghost', style: { textDecoration: 'none', padding: '6px 10px', fontSize: '13px' } }, '🧮 ' + a)));
          ek.append(lk); kutu.append(ek);
        }
        alan.append(kutu);
      });
      if (st.cev.length >= S.length) {
        const d = dogruSay(), msg = E('div', { class: 'g-msg' }, d === 3 ? 'Üçü de doğru! 🎉 Yarın yeni terimler.' : d + '/3 doğru · yarın yeni terimler.');
        const pay = E('button', { class: 'g-btn', style: { display: 'block', margin: '8px auto 0' } }, 'Sonucu kopyala');
        pay.onclick = () => { const s = 'Günün Cephe Terimi #' + (N + 1) + ' ' + d + '/3' + (window.Seri ? ' · 🔥' + Seri.ozet('cepheterim').seri : '') + '\n' + S.map((q, i) => st.cev[i] === q.dogru ? '🟩' : '🟥').join('') + '\nerdevelop.com/oyunlar/#o/cepheterim'; navigator.clipboard && navigator.clipboard.writeText(s).then(() => api.toast && api.toast('Kopyalandı')); };
        alan.append(msg, pay);
      }
    }
    function sec_(i, j) {
      if (st.cev[i] != null) return; st.cev[i] = j; const ok = j === S[i].dogru;
      if (api.sound) api.sound(ok ? 'win' : 'lose');
      if (st.cev.length >= S.length) { const d = dogruSay(); if (window.Seri) Seri.kaydet('cepheterim', N, { ok: d >= 2, b: d }); if (d) api.submitScore(d * 100); istCiz(); }
      if (api.saveState) api.saveState(st); ciz();
    }
    ciz();
    if (st.cev.length >= S.length) { if (window.Seri) Seri.kaydet('cepheterim', N, { ok: dogruSay() >= 2, b: dogruSay() }); istCiz(); }
    else { const b = E('button', { class: 'g-btn ghost', style: { display: 'block', margin: '12px auto 0' } }, '📊 İstatistik ve seri'); b.onclick = () => { b.remove(); istCiz(); }; ist.append(b); }
  }
});
})();
