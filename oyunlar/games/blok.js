/* Blok Bulmaca — 8×8 tahtaya parçaları sürükle; dolan satır ve sütunlar silinir. Yer kalmayınca oyun biter.
   Klasik (rastgele) ve Günün oyunu (herkese aynı parça sırası). Kayıt: api.saveState (dizgi olarak). */
(function () {
const N = 8, RENK = ['', '#6c8cff', '#3bb27a', '#e4a11b', '#e45858', '#9b6cff', '#22a6b3', '#f0719b'];
const SEKIL = [   /* [hücreler (satır,sütun)…], ağırlık */
  [[[0,0]], 2], [[[0,0],[0,1]], 3], [[[0,0],[1,0]], 3], [[[0,0],[0,1],[0,2]], 3], [[[0,0],[1,0],[2,0]], 3],
  [[[0,0],[0,1],[0,2],[0,3]], 2], [[[0,0],[1,0],[2,0],[3,0]], 2], [[[0,0],[0,1],[0,2],[0,3],[0,4]], 1], [[[0,0],[1,0],[2,0],[3,0],[4,0]], 1],
  [[[0,0],[0,1],[1,0],[1,1]], 4], [[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], 1],
  [[[0,0],[1,0],[1,1]], 2], [[[0,1],[1,0],[1,1]], 2], [[[0,0],[0,1],[1,0]], 2], [[[0,0],[0,1],[1,1]], 2],
  [[[0,0],[1,0],[2,0],[2,1]], 1], [[[0,1],[1,1],[2,0],[2,1]], 1], [[[0,0],[0,1],[1,0],[2,0]], 1], [[[0,0],[0,1],[1,1],[2,1]], 1],
  [[[0,0],[0,1],[0,2],[1,0]], 1], [[[0,0],[0,1],[0,2],[1,2]], 1], [[[0,0],[1,0],[1,1],[1,2]], 1], [[[0,2],[1,0],[1,1],[1,2]], 1],
  [[[0,0],[0,1],[0,2],[1,1]], 2], [[[0,1],[1,0],[1,1],[1,2]], 2], [[[0,0],[1,0],[1,1],[2,0]], 1], [[[0,1],[1,0],[1,1],[2,1]], 1],
  [[[0,0],[0,1],[1,1],[1,2]], 1], [[[0,1],[0,2],[1,0],[1,1]], 1], [[[0,0],[1,0],[1,1],[2,1]], 1], [[[0,1],[1,0],[1,1],[2,0]], 1],
  [[[0,0],[1,0],[2,0],[2,1],[2,2]], 1], [[[0,2],[1,2],[2,0],[2,1],[2,2]], 1], [[[0,0],[0,1],[0,2],[1,0],[2,0]], 1], [[[0,0],[0,1],[0,2],[1,2],[2,2]], 1],
  [[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], 1], [[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]], 1]
].map(([h, w], i) => ({ h, w, r: 1 + i % 7, sat: Math.max(...h.map(c => c[0])) + 1, sut: Math.max(...h.map(c => c[1])) + 1 }));
const TOPW = SEKIL.reduce((a, s) => a + s.w, 0), HEDEF = 400;
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const gun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
function kapak() {
  const D = ['........', '..11....', '..11..3.', '......3.', '2222..3.', '55555555', '.44..666', '.44...6.'];
  let s = ''; D.forEach((row, r) => [...row].forEach((c, k) => { s += `<rect x="${5 + k * 10}" y="${5 + r * 10}" width="9" height="9" rx="2" fill="${c === '.' ? '#eef0f7' : RENK[+c]}"/>`; }));
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#fff"/>${s}</svg>`;
}
const CSS = `
.bl-mount{padding:10px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.bl{--c:calc(min(440px,100vw - 44px,100dvh - 360px)/8);width:min(460px,100%);margin:0 auto;display:flex;flex-direction:column;gap:10px;align-items:center;-webkit-user-select:none;user-select:none;touch-action:none;position:relative}
.bl-ust{display:flex;align-items:center;gap:8px;width:100%}
.bl-mod{display:flex;gap:4px;background:var(--bg2);padding:4px;border-radius:12px}
.bl-mod button{padding:7px 10px;border-radius:9px;font-weight:800;font-size:12.5px;color:var(--ink-soft)}.bl-mod button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 4px rgba(0,0,0,.12)}
.bl-skor{margin-left:auto;text-align:right;line-height:1.1}.bl-skor b{display:block;font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}.bl-skor span{font-size:11.5px;font-weight:700;color:var(--ink-soft)}
.bl-bilgi{font-size:13px;font-weight:700;color:var(--ink-soft);text-align:center;min-height:19px}
.bl-bilgi b{color:var(--ink)}
.bl-tahta{display:grid;grid-template-columns:repeat(8,var(--c));grid-template-rows:repeat(8,var(--c));gap:0;padding:5px;border-radius:14px;background:var(--bg2);position:relative}
.bl-h{margin:1.5px;border-radius:calc(var(--c)*.17);background:var(--card);box-shadow:inset 0 0 0 1px var(--line)}
.bl-h.d{box-shadow:inset 0 calc(var(--c)*-.09) 0 rgba(0,0,0,.18),inset 0 calc(var(--c)*.07) 0 rgba(255,255,255,.28)}
.bl-h.on{opacity:.55;box-shadow:none}.bl-h.yok{background:color-mix(in srgb,var(--bad) 35%,var(--bg2))}
.bl-h.sil{filter:brightness(1.35);box-shadow:0 0 0 2px #fff inset}
.bl-h.patla{animation:blPat .32s ease-in forwards}
@keyframes blPat{to{transform:scale(.2) rotate(25deg);opacity:0}}
.bl-h.kon{animation:blKon .18s ease-out}@keyframes blKon{from{transform:scale(.7)}}
.bl-tepsi{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;height:calc(var(--c)*2.9);min-height:96px}
.bl-yuva{display:grid;place-items:center;border-radius:14px;background:var(--bg2);touch-action:none}
.bl-p{display:grid;gap:0;cursor:grab;touch-action:none}.bl-p i{display:block;margin:1px;border-radius:22%}
.bl-p i.d{box-shadow:inset 0 -2px 0 rgba(0,0,0,.18),inset 0 2px 0 rgba(255,255,255,.28)}
.bl-p.olmaz{opacity:.35;filter:grayscale(.6)}
.bl-ucan{position:fixed;left:0;top:0;z-index:70;pointer-events:none;display:grid}.bl-ucan i{display:block;margin:1.5px;border-radius:17%}
.bl-ucan i.d{box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),inset 0 3px 0 rgba(255,255,255,.28)}
.bl-arti{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-size:30px;font-weight:800;color:var(--ink);text-shadow:0 2px 0 var(--card),0 0 12px var(--card);pointer-events:none;animation:blArti .9s ease-out forwards;white-space:nowrap;z-index:3}
@keyframes blArti{0%{opacity:0;transform:translate(-50%,-30%) scale(.7)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-120%)}}
.bl-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 82%,transparent);border-radius:14px;animation:blBel .3s}
@keyframes blBel{from{opacity:0}}
.bl-son>div{text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center;padding:16px}
.bl-son h3{margin:0;font-size:22px;font-weight:800}.bl-son .p{font-size:40px;font-weight:800;line-height:1}.bl-son small{font-size:13px;font-weight:700;color:var(--ink-soft)}
.bl-b{padding:11px 18px;border-radius:12px;background:var(--accent);color:#fff;font-weight:800;font-size:15px}.bl-b.hafif{background:var(--accent-soft);color:var(--accent-ink)}
.bl-alt{display:flex;gap:8px;justify-content:center}
`;
registerGame({
  id: 'blok', title: 'Blok Bulmaca', category: 'Bulmaca', tags: 'blok bulmaca parça yerleştir satır sütun sil', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Parçaları 8×8 tahtaya sürükle, satır ve sütunları doldurup sil. Üst üste silişler katlanarak puan kazandırır. Klasik mod ve herkese aynı parçalarla günün oyunu.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/></svg>',
  shareText() { return this._paylas || 'Blok Bulmaca: parçaları yerleştir, satırları sil.'; },
  render(root, api) {
    const oyun = this, G = gun();
    if (!document.getElementById('bl-css')) { const s = document.createElement('style'); s.id = 'bl-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('bl-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, mod: 'k', k: null, g: null, enG: 0, enGun: -1 }, (api.loadState && api.loadState()) || {});
    let S, rnd, kT = 0;
    const kaydet = () => { clearTimeout(kT); kT = setTimeout(() => { try { api.saveState && api.saveState(D); } catch (e) { } }, 400); };
    const yeni = mod => ({ b: '0'.repeat(64), t: '', skor: 0, seri: 0, n: 0, bitti: 0, gun: G, mod });
    const kok = E('div', { class: 'bl' }); root.append(kok);
    kok.innerHTML = `<div class="bl-ust"><div class="bl-mod"><button data-m="k">Klasik</button><button data-m="g">Günün oyunu</button></div><div class="bl-skor"><b id="bl-s">0</b><span id="bl-e"></span></div></div>
      <div class="bl-bilgi" id="bl-i"></div><div class="bl-tahta" id="bl-t"></div><div class="bl-tepsi" id="bl-p"></div><div class="bl-alt"><button class="bl-b hafif" data-a="yeni">↻ Baştan başla</button></div>`;
    const q = s => kok.querySelector(s), tahta = q('#bl-t'), tepsi = q('#bl-p');
    for (let i = 0; i < 64; i++) tahta.append(E('div', { class: 'bl-h' }));
    const H = [...tahta.children];
    let B, T;   /* B: 64 sayı; T: tepsideki şekil indeksleri (-1 boş) */
    const sigar = (s, r, c, b) => { b = b || B; if (r < 0 || c < 0 || r + s.sat > N || c + s.sut > N) return false; return s.h.every(([a, k]) => !b[(r + a) * N + c + k]); };
    const yerVar = s => { for (let r = 0; r <= N - s.sat; r++) for (let c = 0; c <= N - s.sut; c++) if (sigar(s, r, c)) return true; return false; };
    const cek = () => { let x = rnd() * TOPW; for (let i = 0; i < SEKIL.length; i++) { x -= SEKIL[i].w; if (x < 0) return i; } return 0; };
    function dagit() {
      T = [cek(), cek(), cek()];
      if (!T.some(i => yerVar(SEKIL[i]))) { for (let d = 0; d < 40; d++) { const i = cek(); if (yerVar(SEKIL[i])) { T[0] = i; break; } } if (!yerVar(SEKIL[T[0]])) T[0] = 0; }
    }
    function yaz() { S.b = B.join(''); S.t = T.join(','); if (S.mod === 'g') D.g = S; else D.k = S; D.mod = S.mod; kaydet(); }
    function basla(mod, sifirla) {
      const eski = mod === 'g' ? D.g : D.k;
      S = !sifirla && eski && eski.b && eski.b.length === 64 && (mod !== 'g' || eski.gun === G) ? eski : yeni(mod);
      S.mod = mod; let taban = mod === 'g' ? rng(90210 + G * 7919) : Math.random; if (mod === 'g' && S.t) for (let i = 0; i < S.n; i++) taban(); else S.n = 0;
      rnd = () => { S.n++; return taban(); };
      B = [...S.b].map(Number); T = S.t ? S.t.split(',').map(Number) : null;
      if (!T) dagit();
      const s = q('.bl-son'); if (s) s.remove();
      yaz(); ciz(); if (S.bitti || !T.some(i => i >= 0 && yerVar(SEKIL[i]))) bitir(true);
    }
    function ciz(on) {
      H.forEach((h, i) => { const v = B[i]; h.className = 'bl-h' + (v ? ' d' : ''); h.style.background = v ? RENK[v] : ''; });
      if (on) on();
      q('#bl-s').textContent = S.skor;
      const en = S.mod === 'g' ? (D.enGun === G ? D.enG : 0) : (api.best || 0);
      q('#bl-e').textContent = S.mod === 'g' ? 'hedef ' + HEDEF + (en ? ' · bugün en iyi ' + en : '') : Math.max(en, eniyi) ? 'en iyi ' + Math.max(en, eniyi) : '';
      kok.querySelectorAll('.bl-mod button').forEach(b => b.classList.toggle('on', b.dataset.m === S.mod));
      q('#bl-i').innerHTML = S.seri > 1 ? '🔥 <b>' + S.seri + ' kat seri</b> · silmeye devam et' : S.skor === 0 ? 'Parçaları tahtaya <b>sürükle</b>. Dolan satır ve sütun silinir.' : S.mod === 'g' ? 'Bugün herkes aynı parçalarla oynuyor.' : '';
      tepsi.innerHTML = '';
      T.forEach((si, k) => { const y = E('div', { class: 'bl-yuva' }); if (si >= 0) { const s = SEKIL[si], p = E('div', { class: 'bl-p' + (yerVar(s) ? '' : ' olmaz') }); const u = 'calc(var(--c)*.5)';
        p.style.gridTemplateColumns = `repeat(${s.sut},${u})`; p.style.gridTemplateRows = `repeat(${s.sat},${u})`;
        for (let r = 0; r < s.sat; r++) for (let c = 0; c < s.sut; c++) { const i = E('i'); if (s.h.some(x => x[0] === r && x[1] === c)) { i.className = 'd'; i.style.background = RENK[s.r]; } p.append(i); }
        y.append(p); y.onpointerdown = e => tut(e, k, y); } tepsi.append(y); });
    }
    let eniyi = api.best || 0;
    const silinecek = (b) => { const sat = [], sut = []; for (let r = 0; r < N; r++) { let d = true; for (let c = 0; c < N; c++) if (!b[r * N + c]) { d = false; break; } if (d) sat.push(r); } for (let c = 0; c < N; c++) { let d = true; for (let r = 0; r < N; r++) if (!b[r * N + c]) { d = false; break; } if (d) sut.push(c); } return { sat, sut }; };
    function koy(k, r, c) {
      const s = SEKIL[T[k]]; s.h.forEach(([a, b]) => { B[(r + a) * N + c + b] = s.r; }); T[k] = -1;
      let kazanc = s.h.length; const { sat, sut } = silinecek(B), L = sat.length + sut.length, sil = new Set();
      sat.forEach(x => { for (let i = 0; i < N; i++) sil.add(x * N + i); }); sut.forEach(x => { for (let i = 0; i < N; i++) sil.add(i * N + x); });
      if (L) { S.seri++; kazanc += 10 * L * L * S.seri; } else S.seri = 0;
      S.skor += kazanc;
      const konan = s.h.map(([a, b]) => (r + a) * N + c + b);
      if (L) {
        ciz(() => sil.forEach(i => H[i].classList.add('patla'))); ses(L > 1 ? 'win' : 'score'); try { api.buzz && api.buzz(20); } catch (e) { }
        const a = E('div', { class: 'bl-arti' }, '+' + kazanc + (L > 1 ? ' · ' + L + ' sıra!' : S.seri > 1 ? ' · seri ×' + S.seri : '')); tahta.append(a); setTimeout(() => a.remove(), 900);
        sil.forEach(i => { B[i] = 0; });
        kilit = true; setTimeout(() => { kilit = false; sonra(); }, 330);
      } else { ses('tap'); sonra(konan); }
    }
    function sonra(konan) {
      if (T.every(x => x < 0)) dagit();
      yaz(); ciz(konan ? () => konan.forEach(i => H[i].classList.add('kon')) : null);
      if (!T.some(i => i >= 0 && yerVar(SEKIL[i]))) setTimeout(() => bitir(false), 350);
    }
    function bitir(sessiz) {
      const ilk = !S.bitti; S.bitti = 1; yaz();
      let rekor = false;
      if (S.mod === 'g') { if (D.enGun !== G) { D.enGun = G; D.enG = 0; } if (S.skor > D.enG) { D.enG = S.skor; rekor = ilk; } if (ilk && window.Seri) Seri.kaydet('blok', G, { ok: S.skor >= HEDEF, b: Math.min(5, Math.floor(S.skor / 200)), max: true }); kaydet(); }
      if (ilk && S.skor > 0) { if (S.skor > eniyi) { eniyi = S.skor; rekor = true; } api.submitScore(S.skor); if (!sessiz) ses(rekor ? 'win' : 'lose'); }
      oyun._paylas = 'Blok Bulmaca' + (S.mod === 'g' ? ' · günün oyunu #' + (G + 1) : '') + ': ' + S.skor + ' puan\nerdevelop.com/oyunlar/#o/blok';
      const o = E('div', { class: 'bl-son' });
      o.innerHTML = `<div><h3>${S.mod === 'g' ? (S.skor >= HEDEF ? '🎯 Günün hedefi tamam!' : 'Yer kalmadı') : rekor ? '🏆 Yeni rekor!' : 'Yer kalmadı'}</h3><div class="p">${S.skor}</div><small>${S.mod === 'g' ? 'hedef ' + HEDEF + ' · bugün en iyi ' + D.enG : 'en iyi ' + eniyi}</small><button class="bl-b" data-a="yeni">${S.mod === 'g' ? 'Yeniden dene' : 'Yeni oyun'}</button>${S.mod === 'g' ? '<button class="bl-b hafif" data-m="k">Klasik oyna</button>' : '<button class="bl-b hafif" data-m="g">Günün oyununu dene</button>'}</div>`;
      tahta.append(o); ciz2Ust();
    }
    function ciz2Ust() { q('#bl-s').textContent = S.skor; }
    /* sürükleme */
    let kilit = false, tutulan = null;
    function tut(e, k, yuva) {
      if (kilit || S.bitti || tutulan || T[k] < 0) return; e.preventDefault();
      const s = SEKIL[T[k]], cs = H[0].getBoundingClientRect().width + 3, dokun = e.pointerType !== 'mouse';
      const u = E('div', { class: 'bl-ucan' }); u.style.gridTemplateColumns = `repeat(${s.sut},${cs}px)`; u.style.gridTemplateRows = `repeat(${s.sat},${cs}px)`;
      for (let r = 0; r < s.sat; r++) for (let c = 0; c < s.sut; c++) { const i = E('i'); if (s.h.some(x => x[0] === r && x[1] === c)) { i.className = 'd'; i.style.background = RENK[s.r]; } u.append(i); }
      document.body.append(u); yuva.firstChild.style.visibility = 'hidden';
      const w = s.sut * cs, h = s.sat * cs, yuk = dokun ? h / 2 + 56 : h / 2;
      tutulan = { k, s, u, yuva, hedef: null };
      const git = ev => {
        const x = ev.clientX - w / 2, y = ev.clientY - yuk - h / 2 + (dokun ? 0 : 0); u.style.transform = `translate(${x}px,${y}px)`;
        const t = H[0].getBoundingClientRect(), c = Math.round((x - t.left + 1.5) / cs), r = Math.round((y - t.top + 1.5) / cs);
        const yakin = r > -2 && c > -2 && r < N + 1 && c < N + 1, ok = yakin && sigar(s, r, c);
        const anahtar = ok ? r + ',' + c : yakin && r >= 0 && c >= 0 && r + s.sat <= N && c + s.sut <= N ? 'x' + r + ',' + c : '';
        if (anahtar === tutulan.anahtar) return; tutulan.anahtar = anahtar; tutulan.hedef = ok ? [r, c] : null;
        H.forEach((hh, i) => { hh.className = 'bl-h' + (B[i] ? ' d' : ''); hh.style.background = B[i] ? RENK[B[i]] : ''; });
        if (ok) { const b2 = B.slice(); s.h.forEach(([a, b]) => { const i = (r + a) * N + c + b; b2[i] = s.r; H[i].classList.add('d', 'on'); H[i].style.background = RENK[s.r]; });
          const z = silinecek(b2); z.sat.forEach(x => { for (let i = 0; i < N; i++) H[x * N + i].classList.add('sil'); }); z.sut.forEach(x => { for (let i = 0; i < N; i++) H[i * N + x].classList.add('sil'); });
        } else if (anahtar) s.h.forEach(([a, b]) => { const i = (r + a) * N + c + b; if (!B[i]) H[i].classList.add('yok'); });
      };
      const birak = () => { removeEventListener('pointermove', git); removeEventListener('pointerup', birak); removeEventListener('pointercancel', birak);
        const t = tutulan; tutulan = null; u.remove();
        if (t.hedef) koy(t.k, t.hedef[0], t.hedef[1]); else { ciz(); } };
      addEventListener('pointermove', git); addEventListener('pointerup', birak); addEventListener('pointercancel', birak); git(e); ses('click');
    }
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m) { if (b.dataset.m !== S.mod) basla(b.dataset.m, false); return; }
      if (b.dataset.a === 'yeni') { if (!S.bitti && S.skor > 0 && !b.dataset.emin) { b.dataset.emin = 1; b.textContent = 'Emin misin? Yeniden dokun'; setTimeout(() => { delete b.dataset.emin; b.textContent = '↻ Baştan başla'; }, 2500); return; } delete b.dataset.emin; if (b.closest('.bl-alt')) b.textContent = '↻ Baştan başla'; basla(S.mod, true); } });
    api.onCleanup(() => { clearTimeout(kT); try { api.saveState && api.saveState(D); } catch (e) { } root.classList.remove('bl-mount'); const u = document.querySelector('.bl-ucan'); if (u) u.remove(); });
    basla(D.mod === 'g' ? 'g' : 'k', false);
    if (/[?&]bltest/.test(location.search)) window.__bl = { S: () => S, B: () => B, T: () => T, SEKIL, sigar, koy: (k, r, c) => koy(k, r, c), yerVar };
  }
});
})();
