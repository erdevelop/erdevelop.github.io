/* Amiral Battı — 10×10 deniz, 5 gemi (5, 4, 3, 3, 2), gemiler birbirine (çaprazdan da) değmez. Önce iki taraf filosunu dizer, sonra sırayla atış yapılır.
   İsabet eden bir daha atar. Bütün gemileri ilk batıran kazanır. Çevrimiçi oyunda gemilerin yeri yalnızca sahibinin cihazında durur:
   atışın sonucunu (karavana / isabet / battı) hedefin sahibi bildirir, böylece rakip tahtayı göremez. */
(function () {
'use strict';
const AB = (() => {
  const N = 10, FILO = [5, 4, 3, 3, 2], AD = { 5: 'Uçak gemisi', 4: 'Muharebe gemisi', 3: 'Kruvazör', 2: 'Muhrip' };
  const hucreler = g => { const R = []; for (let k = 0; k < g.u; k++) R.push(g.d ? [g.x, g.y + k] : [g.x + k, g.y]); return R; };
  function uygun(G) {   /* taşma, çakışma ya da değme yok mu (eksik filoda da çalışır) */
    const dolu = new Map();
    for (let i = 0; i < G.length; i++) for (const [x, y] of hucreler(G[i])) { if (x < 0 || y < 0 || x >= N || y >= N || dolu.has(x + ',' + y)) return false; dolu.set(x + ',' + y, i); }
    for (let i = 0; i < G.length; i++) for (const [x, y] of hucreler(G[i])) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const v = dolu.get((x + dx) + ',' + (y + dy)); if (v != null && v !== i) return false; }
    return true;
  }
  const gecerli = G => Array.isArray(G) && G.length === FILO.length && G.every((g, i) => g && g.u === FILO[i] && (g.d === 0 || g.d === 1) && Number.isInteger(g.x) && Number.isInteger(g.y)) && uygun(G);
  function rastgele() {
    for (;;) { const G = [];
      for (const u of FILO) { for (let d = 0; d < 200; d++) { const g = { u, d: Math.random() < .5 ? 1 : 0, x: 0, y: 0 }; g.x = (Math.random() * (N - (g.d ? 0 : u - 1))) | 0; g.y = (Math.random() * (N - (g.d ? u - 1 : 0))) | 0; G.push(g); if (uygun(G)) break; G.pop(); } }
      if (gecerli(G)) return G; }
  }
  function cevap(G, x, y, onceki) {
    const i = G.findIndex(g => hucreler(g).some(([a, b]) => a === x && b === y)); if (i < 0) return { r: 0 };
    const H = hucreler(G[i]), vur = new Set(onceki.filter(t => t.r).map(t => t.x + ',' + t.y)); vur.add(x + ',' + y);
    return H.every(([a, b]) => vur.has(a + ',' + b)) ? { r: 2, g: H } : { r: 1 };
  }
  function yeni(o) { o = o || {}; return { id: Math.random().toString(36).slice(2, 10), a: 'diz', s: o.ilk || 0, hz: [0, 0], g: [null, null], at: [[], []], bek: null, bat: [0, 0], bit: null }; }
  const sira = S => S.a === 'diz' ? (S.hz[S.s] ? 1 - S.s : S.s) : S.bek ? 1 - S.bek.p : S.s;
  function uygula(S, p, h) {
    if (S.bit || sira(S) !== p || !h) return false;
    if (h.t === 'hz') { if (S.a !== 'diz' || S.hz[p]) return false; if (h.g && !gecerli(h.g)) return false; S.hz[p] = 1; S.g[p] = h.g || null; if (S.hz[0] && S.hz[1]) S.a = 'ates'; return true; }
    if (h.t === 'at') { if (S.a !== 'ates' || S.bek || !(h.x >= 0 && h.x < N && h.y >= 0 && h.y < N) || S.at[p].some(t => t.x === h.x && t.y === h.y)) return false; S.bek = { p, x: h.x, y: h.y }; return true; }
    if (h.t === 'cv') { if (!S.bek || S.bek.p !== 1 - p || ![0, 1, 2].includes(h.r)) return false; const b = S.bek, q = b.p;
      if (S.g[p]) { const c = cevap(S.g[p], b.x, b.y, S.at[q]); if (c.r !== h.r) return false; }
      S.at[q].push(h.r === 2 ? { x: b.x, y: b.y, r: 2, g: h.g } : { x: b.x, y: b.y, r: h.r }); S.bek = null; S.son = { p: q, x: b.x, y: b.y, r: h.r };
      if (h.r === 2) { S.bat[q]++; if (S.bat[q] >= FILO.length) S.bit = { k: q, neden: `${S.at[q].length} atışta bütün filo battı` }; }
      if (!h.r) S.s = p; else S.s = q; return true; }
    return false;
  }
  const bitti = S => S.bit;
  /* ---------- bilgisayar ---------- */
  function hedefSec(S, p, sev) {
    const A = S.at[p], bil = new Map(A.map(t => [t.x + ',' + t.y, t.r])), yasak = new Set();
    A.filter(t => t.r === 2).forEach(t => t.g.forEach(([x, y]) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) yasak.add((x + dx) + ',' + (y + dy)); }));
    const bos = (x, y) => x >= 0 && y >= 0 && x < N && y < N && !bil.has(x + ',' + y) && !yasak.has(x + ',' + y);
    const kalan = FILO.slice(); A.filter(t => t.r === 2).forEach(t => { const i = kalan.indexOf(t.g.length); if (i >= 0) kalan.splice(i, 1); });
    const acikVur = A.filter(t => t.r === 1 && !A.some(s => s.r === 2 && s.g.some(([x, y]) => x === t.x && y === t.y)));
    const rnd = () => { const L = []; for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (bos(x, y)) L.push([x, y]); return L[(Math.random() * L.length) | 0]; };
    if (sev === 0 && (Math.random() < .5 || !acikVur.length)) return rnd();
    const P = Array.from({ length: N }, () => Array(N).fill(0));
    for (const u of new Set(kalan)) for (let d = 0; d < 2; d++) for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
      const H = []; let ok = true, vurus = 0;
      for (let k = 0; k < u; k++) { const a = d ? x : x + k, b = d ? y + k : y; if (a >= N || b >= N) { ok = false; break; } const key = a + ',' + b, r = bil.get(key);
        if (r === 1 && acikVur.some(t => t.x === a && t.y === b)) vurus++; else if (r != null || yasak.has(key)) { ok = false; break; } H.push([a, b]); }
      if (!ok) continue; const w = acikVur.length ? (vurus ? Math.pow(30, vurus) : 0) : 1; if (!w) continue;
      H.forEach(([a, b]) => { if (!bil.has(a + ',' + b)) P[a][b] += w; });
    }
    let en = -1, L = [];
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) { if (!bos(x, y)) continue; let v = P[x][y]; if (sev === 1 && !acikVur.length) v = (x + y) % 2 ? v * .15 + Math.random() : 1 + Math.random() * 2 + v * .01; if (v > en + 1e-9) { en = v; L = [[x, y]]; } else if (Math.abs(v - en) < 1e-9) L.push([x, y]); }
    return L.length ? L[(Math.random() * L.length) | 0] : rnd();
  }
  function bot(S, p, sev) {
    if (S.a === 'diz') return { t: 'hz', g: rastgele() };
    if (S.bek) { if (!S.g[p]) return null; const c = cevap(S.g[p], S.bek.x, S.bek.y, S.at[1 - p]); return Object.assign({ t: 'cv' }, c); }
    const [x, y] = hedefSec(S, p, sev); return { t: 'at', x, y };
  }
  return { N, FILO, AD, hucreler, uygun, gecerli, rastgele, cevap, yeni, sira, uygula, bitti, bot };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = AB; return; }
if (!window.registerGame) return;
const CSS = `
.ab-bas{font-weight:800;font-size:12.5px;color:var(--ink-soft);display:flex;justify-content:space-between;align-items:center;margin:2px 2px 4px}
.ab-g{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;padding:5px;border-radius:12px;background:#0c4a6e;width:100%;box-sizing:border-box;touch-action:manipulation}
.ab-g i{aspect-ratio:1;border-radius:3px;background:#0ea5e9;font-style:normal;display:grid;place-items:center;font-size:clamp(10px,3vw,15px);font-weight:900;color:#fff;position:relative}
.ab-g.kucuk{width:62%;margin:0 auto;gap:1px;padding:3px}.ab-g.kucuk i{border-radius:2px;font-size:9px}
.ab-g i.gm{background:#475569}.ab-g i.gm.bas{border-radius:6px 3px 3px 6px}.ab-g i.sec{background:#f59e0b}.ab-g i.hata{background:#ef4444}
.ab-g i.kv::after{content:'';width:28%;aspect-ratio:1;border-radius:50%;background:#e0f2fe;opacity:.9}
.ab-g i.vr{background:#f97316}.ab-g i.vr::after{content:'✕';color:#fff}.ab-g i.bt{background:#7f1d1d}.ab-g i.bt::after{content:'✕';color:#fecaca}
.ab-g.ates i:not(.kv):not(.vr):not(.bt){cursor:pointer}.ab-g.ates i:not(.kv):not(.vr):not(.bt):hover{background:#38bdf8}
.ab-g i.yeni{animation:abY .5s}@keyframes abY{30%{transform:scale(1.35)}}.ab-g i.bek{background:#fde047;animation:abB .6s infinite}@keyframes abB{50%{opacity:.5}}
.ab-g.kapali{opacity:.55;filter:saturate(.6)}
.ab-dz{display:flex;gap:6px;flex-wrap:wrap}.ab-dz button{flex:1;padding:10px 4px;border-radius:11px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:13.5px}.ab-dz button.ana{background:var(--accent);color:#fff}.ab-dz button:disabled{opacity:.4}
.ab-filo{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;font-size:11.5px;font-weight:800;color:var(--ink-soft)}.ab-filo span{padding:2px 7px;border-radius:8px;background:var(--bg2)}.ab-filo span.bt{text-decoration:line-through;opacity:.55}
`;
registerGame({
  id: 'amiral', title: 'Amiral Battı', category: 'Masa', tags: 'amiral battı amiral batti gemi savaşı battleship deniz savaşı iki kişilik çevrimiçi online', odak: true, noRestart: true,
  aciklama: 'Klasik Amiral Battı: filonu diz, rakibin denizine atış yap, bütün gemilerini ilk sen batır. Bilgisayara karşı ya da çevrimiçi; gemilerin yeri yalnız sende durur.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#0c4a6e"/><g fill="#0ea5e9">' + Array.from({ length: 36 }, (_, i) => `<rect x="${8 + (i % 6) * 12.5}" y="${8 + Math.floor(i / 6) * 12.5}" width="11" height="11" rx="2"/>`).join('') + '</g><rect x="20.500" y="33" width="36" height="11" rx="4" fill="#475569"/><rect x="58" y="8" width="11" height="36" rx="4" fill="#475569"/><rect x="33" y="33" width="11" height="11" fill="#f97316"/><path d="M35.500 35.500l6 6M41.500 35.500l-6 6" stroke="#fff" stroke-width="2"/><circle cx="26" cy="64" r="2.500" fill="#e0f2fe"/><circle cx="64" cy="64" r="2.500" fill="#e0f2fe"/></svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 15h18l-3 4H6z"/><path d="M8 15V9h7l2 6M11 9V5"/><path d="M2 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1"/></svg>',
  shareText() { return (this._k && this._k.paylas()) || 'Amiral Battı: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    let yerel = null, secG = -1, anahtar = '', cvT = 0;
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    const filoOku = (S, b) => { const k = 'ob-ab-' + S.id + '-' + S.m.tur + '-' + b; if (anahtar !== k) { anahtar = k; secG = -1; try { yerel = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { yerel = null; } if (!yerel) yerel = AB.rastgele(); } return yerel; };
    const filoYaz = S => { try { localStorage.setItem(anahtar, JSON.stringify(yerel)); } catch (e) { } };
    function izgara(G, atislar, o) {
      const m = new Map(); (atislar || []).forEach(t => { if (t.r === 2) t.g.forEach(([x, y]) => m.set(x + ',' + y, 'bt')); else if (!m.has(t.x + ',' + t.y)) m.set(t.x + ',' + t.y, t.r ? 'vr' : 'kv'); });
      const gm = new Map(); (G || []).forEach((g, i) => AB.hucreler(g).forEach(([x, y], k) => gm.set(x + ',' + y, { i, bas: !k })));
      let h = ''; for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { const k = x + ',' + y, g = gm.get(k), s = m.get(k);
        h += `<i data-x="${x}" data-y="${y}" class="${g ? 'gm' + (g.bas ? ' bas' : '') + (o.sec === g.i ? ' sec' : '') + (o.hata && o.hata.has(g.i) ? ' hata' : '') : ''}${s ? ' ' + s : ''}${o.son && o.son.x === x && o.son.y === y ? ' yeni' : ''}${o.bek && o.bek.x === x && o.bek.y === y ? ' bek' : ''}"></i>`; }
      return h;
    }
    function filoListe(S, p) { const bt = S.at[p].filter(t => t.r === 2).map(t => t.g.length), kalan = bt.slice(); return AB.FILO.map(u => { const i = kalan.indexOf(u); const b = i >= 0; if (b) kalan.splice(i, 1); return `<span class="${b ? 'bt' : ''}">${AB.AD[u]} ${u}</span>`; }).join(''); }
    function ciz(alan, S, c) {
      clearTimeout(cvT); const ben = c.ben, G = S.g[ben] || filoOku(S, ben);
      if (S.a === 'diz' && !S.hz[ben] && !c.izle) {
        const hata = new Set(); G.forEach((g, i) => { if (!AB.uygun([g]) || G.some((h, j) => j !== i && !AB.uygun([g, h]))) hata.add(i); });
        const ok = AB.gecerli(G);
        alan.innerHTML = `<div class="ab-bas"><span>⚓ Filonu diz</span><span>${ok ? '✓ Düzen uygun' : '⚠️ Gemiler değmemeli'}</span></div><div class="ab-g" id="ab-d">${izgara(G, [], { sec: secG, hata })}</div>
          <p style="text-align:center;font-size:12.5px">Gemiye dokun, sonra götürmek istediğin kareye dokun. Seçili gemiye yeniden dokunursan döner.</p>
          <div class="ab-dz"><button data-ab="rast">🎲 Rastgele diz</button><button class="ana" data-ab="hazir" ${ok && c.oynayabilir ? '' : 'disabled'}>${c.oynayabilir ? '✓ Hazırım' : 'Rakip diziyor…'}</button></div>`;
        alan.onclick = e => { const b = e.target.closest('[data-ab]'); if (b) { if (b.dataset.ab === 'rast') { yerel = AB.rastgele(); secG = -1; filoYaz(S); ses('click'); ciz(alan, S, c); } else if (b.dataset.ab === 'hazir') { filoYaz(S); c.hamle({ t: 'hz', g: c.mod === 'yz' ? yerel : null }); } return; }
          const h = e.target.closest('#ab-d i'); if (!h) return; const x = +h.dataset.x, y = +h.dataset.y, i = G.findIndex(g => AB.hucreler(g).some(([a, b2]) => a === x && b2 === y));
          if (i >= 0 && i === secG) { const g = G[i]; g.d = 1 - g.d; if (g.d ? g.y + g.u > 10 : g.x + g.u > 10) { if (g.d) g.y = 10 - g.u; else g.x = 10 - g.u; } ses('click'); }
          else if (i >= 0) { secG = i; ses('click'); }
          else if (secG >= 0) { const g = G[secG]; g.x = Math.min(x, g.d ? 9 : 10 - g.u); g.y = Math.min(y, g.d ? 10 - g.u : 9); ses('tap'); }
          filoYaz(S); ciz(alan, S, c); };
        if (c.mesaj) c.mesaj('Gemilerini yerleştir, sonra “Hazırım” de.', 0); return;
      }
      const rakip = 1 - ben, atisSirasi = S.a === 'ates' && !S.bek && c.oynayabilir;
      alan.innerHTML = `<div class="ab-bas"><span>🎯 ${c.izle ? c.ad(rakip) + ' denizi' : 'Rakibin denizi'}</span><span>${S.at[ben].length} atış · ${S.bat[ben]}/5 battı</span></div>
        <div class="ab-g ${atisSirasi ? 'ates' : 'kapali'}" id="ab-h">${izgara(null, S.at[ben], { son: S.son && S.son.p === ben ? S.son : null, bek: S.bek && S.bek.p === ben ? S.bek : null })}</div>
        <div class="ab-filo">${filoListe(S, ben)}</div>
        <div class="ab-bas" style="margin-top:6px"><span>🚢 ${c.izle ? c.ad(ben) + ' filosu' : 'Senin filon'}</span><span>${S.bat[rakip]}/5 battı</span></div>
        <div class="ab-g kucuk">${izgara(c.izle && !S.g[ben] ? null : G, S.at[rakip], { son: S.son && S.son.p === rakip ? S.son : null, bek: S.bek && S.bek.p === rakip ? S.bek : null })}</div>`;
      alan.onclick = e => { const h = e.target.closest('#ab-h.ates i'); if (!h || h.classList.contains('kv') || h.classList.contains('vr') || h.classList.contains('bt')) return; c.hamle({ t: 'at', x: +h.dataset.x, y: +h.dataset.y }); ses('tap'); };
      /* hedefin sahibi atışı yanıtlar (çevrimiçide gemiler yalnız burada) */
      if (S.bek && S.bek.p === rakip && c.oynayabilir && S.a === 'ates') { const b = S.bek; cvT = setTimeout(() => { const cv = AB.cevap(G, b.x, b.y, S.at[rakip]); c.hamle(Object.assign({ t: 'cv' }, cv)); }, 250); }
      if (S.son && c.onceki && c.onceki.at && (c.onceki.at[0].length + c.onceki.at[1].length) < (S.at[0].length + S.at[1].length)) { const r = S.son.r, kim = S.son.p === ben;
        ses(r === 2 ? (kim ? 'score' : 'bad') : r ? 'tap' : 'click'); c.mesaj(r === 2 ? `💥 ${kim ? 'Batırdın' : c.ad(S.son.p) + ' batırdı'}: <b>${AB.AD[(S.at[S.son.p].slice(-1)[0].g || []).length] || 'gemi'}</b>!${S.bit ? '' : kim ? ' Bir daha at.' : ''}` : r ? (kim ? '🔥 İsabet! Bir daha at.' : `🔥 ${c.ad(S.son.p)} isabet ettirdi.`) : (kim ? '💧 Karavana.' : `💧 ${c.ad(S.son.p)} karavana attı.`), 2400); }
      else if (atisSirasi) c.mesaj('Rakibin denizinde bir kareye dokun.', 0);
    }
    const k = Ikili.kur(root, api, { id: 'amiral', baslik: 'Amiral Battı', emoji: '🚢', renk: '#0369a1', zor: true, botBekle: 600, kural: '/oyun-kurallari/amiral-batti/',
      giris: 'Filonu diz, rakibin denizine atış yap. İsabet edersen bir daha atarsın; bütün gemileri ilk batıran kazanır.', motor: AB, css: CSS,
      tasRenk: x => x ? '#0c4a6e' : '#0ea5e9', ek: (S, x) => S.a === 'diz' ? (S.hz[x] ? '✓ hazır' : 'diziyor') : `💥 ${S.bat[x]}/5`,
      nasil: `<p>• 10×10 bir denizde herkesin 5 gemisi var: uçak gemisi (5), muharebe gemisi (4), kruvazör (3), denizaltı (3) ve muhrip (2). Gemiler birbirine, çaprazdan bile değemez.</p>
        <p>• Önce filonu yerleştir: gemiye dokun, sonra götürmek istediğin kareye dokun; seçili gemiye yeniden dokunursan döner. “Rastgele diz” de olur.</p>
        <p>• Sonra sırayla rakibin denizinde bir kareye atış yapılır: 💧 karavana, 🔥 isabet ya da 💥 battı. <b>İsabet ettiren bir daha atar.</b></p>
        <p>• Batan geminin çevresine gemi olamayacağını unutma. Rakibin bütün gemilerini ilk batıran kazanır.</p>
        <p>• Çevrimiçi oyunda gemilerinin yeri yalnız senin cihazında durur; atışların sonucunu cihazın kendisi bildirir.</p>`,
      sende: S => S.a === 'diz' ? 'Gemilerini yerleştir.' : S.bek ? 'Rakip atış yaptı…' : 'Rakibin denizinde bir kareye dokun.',
      ciz });
    this._k = k; window.__ik = k;
  }
});
})();
