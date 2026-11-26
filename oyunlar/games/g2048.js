/* 2048 — kaydır, aynı sayılar birleşsin. Akıcı kayma/birleşme animasyonu, 3 geri alma hakkı, kaldığın yerden devam. */
(function () {
const RENK = { 2: ['#a9dcff', '#1d3557'], 4: ['#74b3ff', '#fff'], 8: ['#ffcf8a', '#5a3a00'], 16: ['#ffab57', '#fff'], 32: ['#ff8a65', '#fff'], 64: ['#ee5a4a', '#fff'], 128: ['#f4d35e', '#5a4500'], 256: ['#e8b62c', '#fff'], 512: ['#3bb27a', '#fff'], 1024: ['#1f9aa8', '#fff'], 2048: ['#8b5cf6', '#fff'], 4096: ['#e0509b', '#fff'], 8192: ['#2b2f38', '#fff'] };
function kapak() {
  const D = [[2, 4, 8, 16], [0, 32, 64, 128], [0, 0, 256, 512], [0, 0, 2, 2048]];
  let s = ''; D.forEach((row, r) => row.forEach((v, c) => { const k = RENK[v] || ['#e6e8f0', '#000']; s += `<rect x="${7 + c * 19.500}" y="${7 + r * 19.500}" width="17.500" height="17.500" rx="3.500" fill="${v ? k[0] : '#e6e8f0'}"/>`; if (v) s += `<text x="${15.75 + c * 19.5}" y="${18.6 + r * 19.5}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${v > 999 ? 6 : v > 99 ? 7.500 : 9}" font-weight="800" fill="${k[1]}">${v}</text>`; }));
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#fff"/><rect x="3" y="3" width="84" height="84" rx="7" fill="#cfd5e6"/>${s}</svg>`;
}
const CSS = `
.g2-mount{padding:10px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.g2{--s:min(420px,100vw - 44px,100dvh - 300px);--g:calc(var(--s)*.025);--c:calc((var(--s) - var(--g)*5)/4);width:min(440px,100%);margin:0 auto;display:flex;flex-direction:column;gap:10px;align-items:center;-webkit-user-select:none;user-select:none}
.g2-ust{display:flex;gap:8px;width:100%;align-items:stretch}
.g2-kutu{flex:1;background:var(--bg2);border-radius:12px;padding:6px 10px;text-align:center;line-height:1.15}.g2-kutu small{display:block;font-size:11px;font-weight:800;color:var(--ink-soft);letter-spacing:.05em}.g2-kutu b{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums}
.g2-b{padding:8px 12px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:13.5px;white-space:nowrap}.g2-b:disabled{opacity:.45}.g2-b.ana{background:var(--accent);color:#fff;font-size:15px;padding:11px 16px}
.g2-bilgi{font-size:13px;font-weight:700;color:var(--ink-soft);text-align:center;min-height:19px}.g2-bilgi b{color:var(--ink)}
.g2-t{position:relative;width:var(--s);height:var(--s);border-radius:calc(var(--s)*.035);background:#cfd5e6;touch-action:none}
:root[data-theme="dark"] .g2-t{background:#2a2f3a}
.g2-z{position:absolute;width:var(--c);height:var(--c);border-radius:calc(var(--c)*.14);background:rgba(255,255,255,.38)}:root[data-theme="dark"] .g2-z{background:rgba(255,255,255,.06)}
.g2-k{position:absolute;left:var(--g);top:var(--g);width:var(--c);height:var(--c);border-radius:calc(var(--c)*.14);display:grid;place-items:center;font-weight:800;font-size:calc(var(--c)*.42);transition:transform .11s ease-out;will-change:transform;box-shadow:inset 0 calc(var(--c)*-.05) 0 rgba(0,0,0,.1)}
.g2-k.b3{font-size:calc(var(--c)*.34)}.g2-k.b4{font-size:calc(var(--c)*.27)}
.g2-k>i{font-style:normal;display:block}.g2-k.yeni>i{animation:g2Yeni .16s ease-out .08s both}.g2-k.pop{z-index:2}.g2-k.pop>i{animation:g2Pop .18s ease-out}
@keyframes g2Yeni{from{transform:scale(0)}}@keyframes g2Pop{40%{transform:scale(1.28)}}
.g2-k.yeni{animation:g2YeniK .16s ease-out .08s both}@keyframes g2YeniK{from{opacity:0;scale:.3}}
.g2-son{position:absolute;inset:0;z-index:5;border-radius:inherit;background:color-mix(in srgb,var(--card) 84%,transparent);display:grid;place-items:center;animation:g2Bel .4s .25s both}@keyframes g2Bel{from{opacity:0}}
.g2-son>div{display:flex;flex-direction:column;gap:9px;align-items:center;text-align:center;padding:14px}.g2-son h3{margin:0;font-size:24px;font-weight:800}.g2-son p{margin:0;font-size:14px;font-weight:700;color:var(--ink-soft)}
.g2-alt{display:flex;gap:8px;justify-content:center}
`;
registerGame({
  id: 'g2048', title: '2048', category: 'Bulmaca', tags: '2048 sayı birleştir kaydır bulmaca', odak: true, noRestart: true,
  aciklama: 'Kaydır, aynı sayıları birleştir, 2048’e ulaş. Akıcı animasyonlar, üç geri alma hakkı ve kaldığın yerden devam.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  shareText() { return this._paylas || '2048: kaydır, birleştir.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('g2-css')) { const s = document.createElement('style'); s.id = 'g2-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('g2-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, o: null, enK: 0 }, (api.loadState && api.loadState()) || {});
    let G, skor, geri, gecmis, bitti, kazandi, devam, nid = 1, kilit = false, kT = 0, eniyi = api.best || 0, gonderilen = 0;
    const kok = E('div', { class: 'g2' }); root.append(kok);
    kok.innerHTML = `<div class="g2-ust"><div class="g2-kutu"><small>PUAN</small><b id="g2-s">0</b></div><div class="g2-kutu"><small>EN İYİ</small><b id="g2-e">0</b></div><button class="g2-b" data-a="geri">↶ Geri al <span id="g2-g"></span></button></div>
      <div class="g2-bilgi" id="g2-i"></div><div class="g2-t" id="g2-t"></div><div class="g2-alt"><button class="g2-b" data-a="yeni">↻ Yeni oyun</button></div>`;
    const q = s => kok.querySelector(s), T = q('#g2-t');
    for (let i = 0; i < 16; i++) { const z = E('div', { class: 'g2-z' }); z.style.left = `calc(var(--g) + ${i % 4} * (var(--c) + var(--g)))`; z.style.top = `calc(var(--g) + ${(i / 4) | 0} * (var(--c) + var(--g)))`; T.append(z); }
    const EL = new Map();
    const yerles = (e, i) => { e.style.transform = `translate(calc(${i % 4} * (var(--c) + var(--g))), calc(${(i / 4) | 0} * (var(--c) + var(--g))))`; };
    const boya = (e, v) => { const k = RENK[v] || RENK[8192]; e.style.background = k[0]; e.style.color = k[1]; e.firstChild.textContent = v; e.classList.toggle('b3', v > 99 && v < 1000); e.classList.toggle('b4', v > 999); };
    function ekle(t, i, sinif) { const e = E('div', { class: 'g2-k ' + (sinif || '') }, E('i')); boya(e, t.v); yerles(e, i); T.append(e); EL.set(t.id, e); }
    function bastan() { EL.forEach(e => e.remove()); EL.clear(); G.forEach((t, i) => { if (t) ekle(t, i); }); ust(); }
    function ust() { q('#g2-s').textContent = skor; q('#g2-e').textContent = Math.max(eniyi, skor); q('#g2-g').textContent = '(' + geri + ')'; q('[data-a=geri]').disabled = !geri || !gecmis.length || bitti; }
    const kodla = () => G.map(t => t ? t.v : 0).join(',');
    function kaydet(hemen) { D.o = bitti ? null : { g: kodla(), s: skor, geri, kz: kazandi ? 1 : 0, dv: devam ? 1 : 0 }; clearTimeout(kT); const f = () => { try { api.saveState && api.saveState(D); } catch (e) { } }; if (hemen) f(); else kT = setTimeout(f, 400); }
    function rastgele() { const b = []; G.forEach((t, i) => { if (!t) b.push(i); }); if (!b.length) return; const i = b[(Math.random() * b.length) | 0], t = { id: nid++, v: Math.random() < .9 ? 2 : 4 }; G[i] = t; ekle(t, i, 'yeni'); }
    function yeni() { G = new Array(16).fill(null); skor = 0; geri = 3; gecmis = []; bitti = false; kazandi = false; devam = false; gonderilen = 0; const s = q('.g2-son'); if (s) s.remove(); bastan(); rastgele(); rastgele(); ust(); bilgi('<b>Kaydır</b>: aynı sayılar çarpışınca birleşir. Hedef 2048.'); kaydet(); }
    const bilgi = m => { q('#g2-i').innerHTML = m || ''; };
    const hamleVar = () => { for (let i = 0; i < 16; i++) { if (!G[i]) return true; const v = G[i].v; if (i % 4 < 3 && G[i + 1] && G[i + 1].v === v) return true; if (i < 12 && G[i + 4] && G[i + 4].v === v) return true; } return false; };
    function kaydir(yon) {   /* 0 sol, 1 sağ, 2 yukarı, 3 aşağı */
      if (kilit || bitti || q('.g2-son')) return;
      const once = kodla(), onceSkor = skor; let oynadi = false, kazanc = 0, enBuyuk = 0; const sil = [], pop = [];
      for (let k = 0; k < 4; k++) {
        const idx = [0, 1, 2, 3].map(j => yon === 0 ? k * 4 + j : yon === 1 ? k * 4 + 3 - j : yon === 2 ? j * 4 + k : (3 - j) * 4 + k);
        const sira = idx.map(i => G[i]).filter(Boolean), yeniS = [];
        for (let j = 0; j < sira.length; j++) { if (j + 1 < sira.length && sira[j].v === sira[j + 1].v) { const t = sira[j], u = sira[j + 1]; t.v *= 2; kazanc += t.v; enBuyuk = Math.max(enBuyuk, t.v); yeniS.push(t); sil.push([u, idx[yeniS.length - 1]]); pop.push(t); j++; } else yeniS.push(sira[j]); }
        idx.forEach((i, j) => { const t = yeniS[j] || null; if (G[i] !== t) oynadi = true; G[i] = t; });
      }
      if (!oynadi) return;
      gecmis.push({ g: once, s: onceSkor }); if (gecmis.length > 3) gecmis.shift();
      skor += kazanc; kilit = true;
      G.forEach((t, i) => { if (t) yerles(EL.get(t.id), i); }); sil.forEach(([u, i]) => { const e = EL.get(u.id); e.style.zIndex = 0; yerles(e, i); });
      ses(kazanc ? 'score' : 'tap'); if (kazanc) { try { api.buzz && api.buzz(8); } catch (e) { } }
      setTimeout(() => {
        sil.forEach(([u]) => { const e = EL.get(u.id); if (e) e.remove(); EL.delete(u.id); });
        pop.forEach(t => { const e = EL.get(t.id); boya(e, t.v); e.classList.remove('pop', 'yeni'); void e.offsetWidth; e.classList.add('pop'); });
        rastgele(); ust(); kilit = false;
        if (enBuyuk >= 2048 && !kazandi) { kazandi = true; ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } gonder(); son(`<h3>🎉 2048!</h3><p>${skor} puan. İstersen devam et, daha büyüğü de var.</p><button class="g2-b ana" data-a="devam">Devam et</button><button class="g2-b" data-a="yeni">Yeni oyun</button>`); }
        else if (enBuyuk >= 512 && enBuyuk > (D.enK || 0)) { D.enK = enBuyuk; bilgi('🔥 İlk kez <b>' + enBuyuk + '</b> yaptın!'); }
        else if (kazanc) bilgi('');
        if (enBuyuk > (D.enK || 0)) D.enK = enBuyuk;
        if (!hamleVar()) { bitti = true; ust(); gonder(); ses('lose'); const rekor = skor >= eniyi && skor > 0; son(`<h3>${rekor ? '🏆 Yeni rekor!' : 'Hamle kalmadı'}</h3><p>${skor} puan · en büyük kare ${Math.max(...G.map(t => t ? t.v : 0))}</p><button class="g2-b ana" data-a="yeni">Yeni oyun</button>`); }
        kaydet();
      }, 115);
    }
    function gonder() { if (skor > gonderilen) { gonderilen = skor; if (skor > eniyi) eniyi = skor; api.submitScore(skor); oyun._paylas = '2048: ' + skor + ' puan, en büyük kare ' + Math.max(...G.map(t => t ? t.v : 0)) + '\nerdevelop.com/oyunlar/#o/g2048'; } }
    function son(html) { const s = E('div', { class: 'g2-son' }); s.innerHTML = '<div>' + html + '</div>'; T.append(s); }
    function geriAl() { if (!geri || !gecmis.length || kilit || bitti) return; const g = gecmis.pop(); geri--; skor = g.s; G = g.g.split(',').map(v => +v ? { id: nid++, v: +v } : null); bastan(); ses('click'); bilgi('Geri alındı. Kalan hak: <b>' + geri + '</b>'); kaydet(); }
    /* girdi */
    let p0 = null;
    T.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; p0 = { x: e.clientX, y: e.clientY }; });
    addEventListener('pointermove', hareket); function hareket(e) { if (!p0) return; const dx = e.clientX - p0.x, dy = e.clientY - p0.y; if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return; p0 = null; kaydir(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 1) : (dy < 0 ? 2 : 3)); }
    const birak = () => { p0 = null; }; addEventListener('pointerup', birak); addEventListener('pointercancel', birak);
    const TUS = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3, a: 0, d: 1, w: 2, s: 3 };
    const tusla = e => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (k in TUS) { e.preventDefault(); kaydir(TUS[k]); } else if (k === 'z' || k === 'u') geriAl(); };
    document.addEventListener('keydown', tusla);
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'geri') return geriAl(); if (a === 'devam') { devam = true; q('.g2-son').remove(); return kaydet(); }
      if (a === 'yeni') { if (!bitti && skor > 200 && !b.dataset.emin && !b.closest('.g2-son')) { b.dataset.emin = 1; b.textContent = 'Emin misin? Yeniden dokun'; setTimeout(() => { delete b.dataset.emin; b.textContent = '↻ Yeni oyun'; }, 2500); return; } delete b.dataset.emin; if (b.closest('.g2-alt')) b.textContent = '↻ Yeni oyun'; gonder(); yeni(); } });
    const sakla = () => kaydet(true); addEventListener('pagehide', sakla);
    api.onCleanup(() => { clearTimeout(kT); document.removeEventListener('keydown', tusla); removeEventListener('pagehide', sakla); removeEventListener('pointermove', hareket); removeEventListener('pointerup', birak); removeEventListener('pointercancel', birak); if (G) { gonder(); kaydet(true); } root.classList.remove('g2-mount'); });
    const o = D.o;
    if (o && o.g && o.g.split(',').length === 16) { G = o.g.split(',').map(v => +v ? { id: nid++, v: +v } : null); skor = o.s | 0; geri = o.geri | 0; gecmis = []; bitti = false; kazandi = !!o.kz; devam = !!o.dv; bastan(); bilgi('Kaldığın yerden devam.'); if (!hamleVar()) yeni(); }
    else yeni();
    if (/[?&]g2test/.test(location.search)) window.__g2 = { G: () => G.map(t => t ? t.v : 0), skor: () => skor, kaydir, koy: L => { G = L.map(v => v ? { id: nid++, v } : null); bastan(); }, el: () => EL.size };
  }
});
})();
