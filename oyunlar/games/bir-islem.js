/* Bir İşlem — 6 sayıyla dört işlem kullanarak hedef sayıya ulaş. Her gün herkese aynı bulmaca. */
(function(){
function rng(seed){ let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
function uret(seed){
  const r = rng(seed * 7919 + 13);
  for (let deneme = 0; deneme < 500; deneme++) {
    const say = [1 + (r() * 9 | 0), 1 + (r() * 9 | 0), 1 + (r() * 9 | 0), 1 + (r() * 9 | 0), 1 + (r() * 9 | 0), (1 + (r() * 9 | 0)) * 10];
    /* sayıların rastgele bir kısmını rastgele işlemlerle birleştirerek ulaşılabilir hedef üret */
    let havuz = say.slice(); const adim = [];
    while (havuz.length > 1) {
      const i = r() * havuz.length | 0; let a = havuz.splice(i, 1)[0]; const j = r() * havuz.length | 0; let b = havuz.splice(j, 1)[0];
      if (a < b) [a, b] = [b, a];
      const ops = ['+', '×', '−']; if (b > 1 && a % b === 0) ops.push('÷');
      const op = ops[r() * ops.length | 0]; const v = op === '+' ? a + b : op === '×' ? a * b : op === '−' ? a - b : a / b;
      if (v <= 0) { havuz.push(a, b); continue; }
      adim.push(a + ' ' + op + ' ' + b + ' = ' + v); havuz.push(v);
      if (v >= 101 && v <= 999 && adim.length >= 3 && r() < .45) return { say, hedef: v, cozum: adim };
    }
    const v = havuz[0]; if (v >= 101 && v <= 999) return { say, hedef: v, cozum: adim };
  }
  return { say: [2, 3, 4, 5, 6, 50], hedef: 333, cozum: ['50 × 6 = 300', '5 × 4 = 20', '300 + 20 = 320', '320 + 3 = 323', '323 + 2 = 325'] };
}
registerGame({
  id:'birislem', title:'Bir İşlem', category:'Günlük', tags:'sayı işlem hedef bulmaca günlük matematik bir kelime bir işlem',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 7h6M8 4v6M14 7h6M5 17l5-5M10 17l-5-5M14 15h6M14 19h6"/></svg>',
  render(root, api){
    const N = gun(), P = uret(N + 1);
    let kartlar, sec = null, op = null, gecmis = [], bitti = false, bas = Date.now(), en = null;
    const hud = makeHUD(root, [{ id: 'hedef', label: 'Hedef', value: P.hedef }, { id: 'en', label: 'En yakın', value: '—' }, { id: 'sure', label: 'Süre', value: '0' }]);
    const tm = setInterval(() => { if (!bitti) hud.set('sure', ((Date.now() - bas) / 1000) | 0); }, 1000); if (api.onCleanup) api.onCleanup(() => clearInterval(tm));
    const alan = E('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', width: 'min(360px,100%)', margin: '6px auto' } });
    const ops = E('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', margin: '10px 0' } });
    const log = E('div', { style: { textAlign: 'center', minHeight: '1.4em', fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' } });
    const msg = E('div', { class: 'g-msg' });
    const alt = E('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' } });
    root.append(alan, ops, log, msg, alt);
    function yeni() { kartlar = P.say.map((v, i) => ({ v, id: i, ok: true })); sec = null; op = null; gecmis = []; ciz(); }
    function ciz() {
      alan.innerHTML = '';
      kartlar.forEach((k, i) => { if (!k.ok) return; const b = E('button', { class: 'g-btn' + (sec === i ? '' : ' ghost'), style: { fontSize: '22px', fontWeight: '800', padding: '14px 0' } }, String(k.v)); b.onclick = () => tik(i); alan.append(b); });
      ops.innerHTML = ''; ['+', '−', '×', '÷'].forEach(o => { const b = E('button', { class: 'g-btn' + (op === o ? '' : ' ghost'), style: { fontSize: '22px', width: '56px' } }, o); b.onclick = () => { if (sec != null && !bitti) { op = o; ciz(); } }; ops.append(b); });
      log.textContent = gecmis.map(g => g.t).join('   ·   ');
    }
    function yakin() { const v = kartlar.filter(k => k.ok).map(k => k.v).reduce((a, x) => Math.abs(x - P.hedef) < Math.abs(a - P.hedef) ? x : a, Infinity); if (en == null || Math.abs(v - P.hedef) < Math.abs(en - P.hedef)) en = v; hud.set('en', en); return v; }
    function tik(i) {
      if (bitti) return;
      if (sec == null || op == null) { sec = sec === i ? null : i; op = null; ciz(); return; }
      if (i === sec) return;
      const a = kartlar[sec].v, b = kartlar[i].v; let v;
      if (op === '+') v = a + b; else if (op === '×') v = a * b; else if (op === '−') v = a - b; else v = a / b;
      if (op === '−' && v <= 0) { msg.textContent = 'Sonuç pozitif olmalı.'; return; }
      if (op === '÷' && (!Number.isInteger(v))) { msg.textContent = 'Bölme tam sayı vermeli.'; return; }
      gecmis.push({ t: a + ' ' + op + ' ' + b + ' = ' + v, onceki: kartlar.map(k => ({ ...k })) });
      kartlar[sec].ok = false; kartlar[i] = { v, id: 100 + gecmis.length, ok: true }; sec = i; op = null; msg.textContent = '';
      if (api.sound) api.sound('tap'); yakin();
      if (v === P.hedef) bitir(true); ciz();
    }
    function bitir(tam) {
      bitti = true; const sn = ((Date.now() - bas) / 1000) | 0, fark = Math.abs((en ?? 0) - P.hedef);
      const skor = tam ? Math.max(200, 1000 - sn * 3) : fark <= 9 ? Math.max(50, 500 - fark * 50) : 0;
      msg.textContent = tam ? 'Tam isabet! 🎯 ' + sn + ' sn · ' + skor + ' puan' : 'En yakın: ' + en + ' (fark ' + fark + ') · ' + skor + ' puan';
      if (api.sound) api.sound(tam ? 'win' : 'tap'); if (skor) api.submitScore(skor);
      if (window.Seri) { Seri.kaydet('birislem', N, { ok: tam, b: tam ? (sn < 60 ? 0 : sn < 180 ? 1 : sn < 600 ? 2 : 3) : 'x', min: true }); istCiz(); }
      const c = E('div', { style: { marginTop: '8px', textAlign: 'center', fontSize: '14px', color: 'var(--muted)' } }, 'Örnek çözüm: ' + P.cozum.join(' · ')); msg.after(c);
    }
    const geri = E('button', { class: 'g-btn ghost' }, '↶ Geri al'); geri.onclick = () => { if (bitti || !gecmis.length) return; kartlar = gecmis.pop().onceki; sec = null; op = null; ciz(); };
    const sif = E('button', { class: 'g-btn ghost' }, '↺ Baştan'); sif.onclick = () => { if (!bitti) yeni(); };
    const pes = E('button', { class: 'g-btn ghost' }, 'Bitir / çözümü gör'); pes.onclick = () => { if (!bitti) { yakin(); bitir(false); } };
    alt.append(geri, sif, pes);
    const ist = E('div'); root.append(ist);
    function istCiz() { ist.innerHTML = ''; if (window.Seri) ist.append(Seri.panel('birislem', { baslik: 'Bir İşlem · istatistik', etiketler: ['< 1 dk', '1–3 dk', '3–10 dk', '10+ dk'], dagBaslik: 'Tam isabet süresi', xEtiket: 'Ulaşamadı', api })); }
    if (window.Seri) { const o = Seri.ozet('birislem'); if (o.bugun) istCiz(); else { const b = E('button', { class: 'g-btn ghost', style: { display: 'block', margin: '12px auto 0' } }, '📊 İstatistik ve seri' + (o.seri ? ' · 🔥 ' + o.seri : '')); b.onclick = () => istCiz(); ist.append(b); } }
    msg.textContent = 'Bir sayı seç, işlem seç, ikinci sayıyı seç. Sonuç yeni kart olur. Her sayı bir kez kullanılır.';
    yeni();
  }
});
})();
