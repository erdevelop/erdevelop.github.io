/* Düşen Bloklar — 10×20 kuyuda düşen dörtlü blokları döndürüp yerleştir, dolan satırlar silinir. Her 10 satırda seviye ve hız artar.
   Dokunmatik: sağa/sola kaydır = kaydır, dokun = döndür, aşağı hızlı kaydır = hemen bırak, aşağı yavaş sürükle = hızlı indir; ↺ sakla.
   Klavye: ← → ↓, ↑/X döndür, Z ters döndür, boşluk bırak, C sakla. Günün oyunu: herkes aynı parça sırasıyla oynar. */
(function () {
'use strict';
const GEN = 10, YUK = 20;
const PARCA = { I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]] };
const RENK = { I: '#93d5f0', O: '#fde68a', T: '#c4b5fd', S: '#a7e3c4', Z: '#f8b4c8', J: '#9db4ff', L: '#fbc7a4' };
function rng(t) { return () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
function torba(r) { let B = []; return () => { if (!B.length) { B = Object.keys(PARCA); for (let i = B.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0;[B[i], B[j]] = [B[j], B[i]]; } } return B.pop(); }; }
function hucreler(t, d) { const boy = t === 'I' ? 4 : t === 'O' ? 4 : 3; return PARCA[t].map(([x, y]) => { for (let k = 0; k < d; k++) { const nx = boy - 1 - y; y = x; x = nx; } return [x, y]; }); }
const TEKME = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]];
function motor(tohum) {
  const r = rng(tohum), cek = torba(r), S = { G: Array.from({ length: YUK }, () => Array(GEN).fill('')), sira: [cek(), cek(), cek()], p: null, sak: null, sakKul: false, satir: 0, puan: 0, sev: 1, bit: false, son: 0 };
  const sigar = (t, d, x, y) => hucreler(t, d).every(([a, b]) => { const X = x + a, Y = y + b; return X >= 0 && X < GEN && Y < YUK && (Y < 0 || !S.G[Y][X]); });
  function yeni(t) { t = t || S.sira.shift(); if (S.sira.length < 3) S.sira.push(cek()); S.p = { t, d: 0, x: t === 'O' ? 3 : 3, y: t === 'I' ? -2 : -1 }; if (!sigar(S.p.t, 0, S.p.x, S.p.y)) S.bit = true; }
  function oynat(dx, dy) { const p = S.p; if (!p || S.bit) return false; if (sigar(p.t, p.d, p.x + dx, p.y + dy)) { p.x += dx; p.y += dy; return true; } return false; }
  function don(yon) { const p = S.p; if (!p || S.bit || p.t === 'O') return false; const d = (p.d + (yon > 0 ? 1 : 3)) % 4; for (const [kx, ky] of TEKME) if (sigar(p.t, d, p.x + kx, p.y + ky)) { p.d = d; p.x += kx; p.y += ky; return true; } return false; }
  function golge() { const p = S.p; let y = p.y; while (sigar(p.t, p.d, p.x, y + 1)) y++; return y; }
  function kilitle() {
    const p = S.p; for (const [a, b] of hucreler(p.t, p.d)) { if (p.y + b < 0) { S.bit = true; continue; } S.G[p.y + b][p.x + a] = p.t; }
    const dolu = []; S.G.forEach((row, i) => { if (row.every(Boolean)) dolu.push(i); });
    if (dolu.length) { dolu.forEach(i => { S.G.splice(i, 1); S.G.unshift(Array(GEN).fill('')); }); S.satir += dolu.length; S.puan += [0, 100, 300, 500, 800][dolu.length] * S.sev; S.sev = 1 + Math.floor(S.satir / 10); }
    S.son = dolu.length; S.sakKul = false; S.p = null; if (!S.bit) yeni(); return dolu;
  }
  function birak() { const p = S.p; if (!p) return []; const y = golge(); S.puan += 2 * (y - p.y); p.y = y; return kilitle(); }
  function sakla() { if (S.sakKul || !S.p) return false; const t = S.p.t; S.p = null; if (S.sak) yeni(S.sak); else yeni(); S.sak = t; S.sakKul = true; return true; }
  yeni();
  return { S, oynat, don, golge, kilitle, birak, sakla, sigar };
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { motor, hucreler, GEN, YUK }; return; }
if (!window.registerGame) return;
const gun = () => window.Seri ? Seri.bugun() : Math.floor(Date.now() / 864e5);
const CSS = `
.db-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.db{width:min(460px,100%);margin:0 auto;display:flex;flex-direction:column;gap:6px;position:relative;-webkit-user-select:none;user-select:none}
.db-ust{display:flex;gap:6px;align-items:stretch}.db-kutu{flex:1;padding:5px 8px;border-radius:11px;background:var(--bg2);font-weight:800;font-size:11px;color:var(--ink-soft);text-align:center;line-height:1.2}.db-kutu b{display:block;font-size:17px;color:var(--ink)}
.db-orta{display:flex;gap:7px;align-items:flex-start}
.db canvas{display:block;border-radius:14px;background:#262449;touch-action:none}
.db-yan{display:flex;flex-direction:column;gap:6px;width:64px;flex:none}.db-yan canvas{width:64px;border-radius:10px;background:var(--bg2)}.db-yan small{font-size:10.5px;font-weight:800;color:var(--ink-soft);text-align:center}
.db-tus{display:flex;gap:6px}.db-tus button{flex:1;padding:12px 0;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:900;font-size:18px}
.db-ekran{position:absolute;inset:0;display:grid;place-items:center;background:rgba(38,36,73,.74);border-radius:14px;z-index:5}
.db-ekran>div{width:min(310px,88%);display:flex;flex-direction:column;gap:9px;text-align:center;color:#fff}.db-ekran h2{margin:0;font-size:26px;font-weight:900;color:#c4b5fd}.db-ekran p{margin:0;font-weight:700;font-size:13.5px;line-height:1.45;color:#e2e0f5}
.db-ekran button{padding:12px;border-radius:13px;font-weight:900;font-size:15px;background:rgba(255,255,255,.14);color:#fff}.db-ekran button.ana{background:linear-gradient(90deg,#c4b5fd,#93d5f0);color:#1e1b4b}
`;
registerGame({
  id: 'dusen', title: 'Düşen Bloklar', category: 'Bulmaca', tags: 'düşen bloklar blok yerleştirme satır silme klasik retro tetris benzeri günlük', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Klasik düşen blok oyunu: parçaları döndür, satırları doldur ve sil. Gölge, saklama, sıradaki üç parça, hızlanan seviyeler ve herkese aynı parçalarla günün oyunu.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#262449"/>' + [[2, 1, 'T'], [3, 1, 'T'], [4, 1, 'T'], [3, 2, 'T'], [0, 6, 'J'], [0, 7, 'J'], [1, 7, 'J'], [2, 7, 'J'], [3, 7, 'O'], [4, 7, 'O'], [3, 6, 'O'], [4, 6, 'O'], [5, 7, 'S'], [6, 7, 'S'], [6, 6, 'S'], [7, 6, 'S'], [5, 6, 'L'], [5, 5, 'L'], [5, 4, 'L'], [6, 5, 'Z'], [7, 5, 'Z'], [7, 4, 'Z'], [8, 4, 'Z'], [1, 6, 'I'], [2, 6, 'I'], [1, 5, 'I']].map(([x, y, t]) => `<rect x="${5 + x * 9}" y="${8 + y * 9.500}" width="8.200" height="8.700" rx="2" fill="${RENK[t]}"/>`).join('') + '</svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3h8v5H8zM3 13h5v8H3zM8 16h5v5H8zM13 11h8v5h-8zM16 16h5v5h-5z"/></svg>',
  shareText() { return this._paylas || 'Düşen Bloklar: satırları doldur, sil.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('db-css')) { const s = document.createElement('style'); s.id = 'db-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('db-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, en: 0, enS: 0, oyn: 0, gunB: -1, gunO: null }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'db' }); root.append(kok);
    kok.innerHTML = `<div class="db-ust"><div class="db-kutu">PUAN<b id="db-p">0</b></div><div class="db-kutu">SATIR<b id="db-s">0</b></div><div class="db-kutu">SEVİYE<b id="db-v">1</b></div><button class="db-kutu" data-a="dur" style="flex:none;width:46px"><b>❚❚</b></button></div>
      <div class="db-orta"><canvas id="db-c"></canvas><div class="db-yan"><small>SAKLA</small><canvas id="db-h" data-a="sakla"></canvas><small>SIRADAKİ</small><canvas id="db-n"></canvas></div></div>
      <div class="db-tus"><button data-t="sol">◀</button><button data-t="don">⟳</button><button data-t="sag">▶</button><button data-t="bırak">⤓</button></div><div class="db-ekran" id="db-e"></div><div id="db-seri"></div>`;
    const q = s => kok.querySelector(s), cv = q('#db-c'), cx = cv.getContext('2d'), hv = q('#db-h'), nv = q('#db-n');
    let M = null, gunluk = false, durum = 'menu', raf = 0, son = 0, dusT = 0, hc = 20, dpr = 1, silinen = [], silT = 0, kilitT = 0;
    function boyut() {
      dpr = Math.min(2, devicePixelRatio || 1); const ust = cv.getBoundingClientRect().top, wMax = kok.clientWidth - 64 - 7, hMax = innerHeight - ust - 70;
      hc = Math.max(12, Math.floor(Math.min(wMax / GEN, hMax / YUK))); cv.style.width = hc * GEN + 'px'; cv.style.height = hc * YUK + 'px'; cv.width = hc * GEN * dpr; cv.height = hc * YUK * dpr;
      hv.width = nv.width = 64 * dpr; hv.height = 48 * dpr; hv.style.height = '48px'; nv.height = 150 * dpr; nv.style.height = '150px'; ciz();
    }
    function kare(c, x, y, s, renk, a) { c.globalAlpha = a == null ? 1 : a; c.fillStyle = renk; const r = s * .22; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + s, y, x + s, y + s, r); c.arcTo(x + s, y + s, x, y + s, r); c.arcTo(x, y + s, x, y, r); c.arcTo(x, y, x + s, y, r); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + s * .2, y + s * .14, s * .6, s * .1); c.globalAlpha = 1; }
    function mini(c, t, W, Hh, y0) { if (!t) return; const H = hucreler(t, 0), s = 12 * dpr, mx = Math.min(...H.map(h => h[0])), Mx = Math.max(...H.map(h => h[0])), my = Math.min(...H.map(h => h[1])), My = Math.max(...H.map(h => h[1])), ox = (W - (Mx - mx + 1) * s) / 2, oy = y0 + (Hh - (My - my + 1) * s) / 2; H.forEach(([a, b]) => kare(c, ox + (a - mx) * s, oy + (b - my) * s, s - 1, RENK[t])); }
    function ciz() {
      if (!M) return; const S = M.S, c = cx, s = hc * dpr; c.clearRect(0, 0, cv.width, cv.height);
      c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; for (let x = 1; x < GEN; x++) { c.beginPath(); c.moveTo(x * s, 0); c.lineTo(x * s, cv.height); c.stroke(); } for (let y = 1; y < YUK; y++) { c.beginPath(); c.moveTo(0, y * s); c.lineTo(cv.width, y * s); c.stroke(); }
      S.G.forEach((row, y) => row.forEach((t, x) => { if (t) kare(c, x * s + 1, y * s + 1, s - 2, RENK[t], silinen.includes(y) && silT > 0 ? .4 : 1); }));
      if (S.p && !S.bit) { const p = S.p, gy = M.golge(); M.S.p && hucreler(p.t, p.d).forEach(([a, b]) => { if (gy + b >= 0) kare(c, (p.x + a) * s + 1, (gy + b) * s + 1, s - 2, RENK[p.t], .22); }); hucreler(p.t, p.d).forEach(([a, b]) => { if (p.y + b >= 0) kare(c, (p.x + a) * s + 1, (p.y + b) * s + 1, s - 2, RENK[p.t]); }); }
      hv.getContext('2d').clearRect(0, 0, hv.width, hv.height); mini(hv.getContext('2d'), S.sak, hv.width, hv.height, 0);
      const nc = nv.getContext('2d'); nc.clearRect(0, 0, nv.width, nv.height); S.sira.slice(0, 3).forEach((t, i) => mini(nc, t, nv.width, 50 * dpr, i * 50 * dpr));
      q('#db-p').textContent = S.puan; q('#db-s').textContent = S.satir; q('#db-v').textContent = S.sev;
    }
    const hizMs = () => Math.max(60, 800 * Math.pow(.84, M.S.sev - 1));
    function sonra(silinenler) { if (silinenler && silinenler.length) { silinen = silinenler.slice(); silT = 10; ses(silinenler.length >= 4 ? 'win' : 'score'); try { navigator.vibrate && navigator.vibrate(20); } catch (e) { } } else ses('tap'); if (M.S.bit) bitti(); ciz(); }
    function eylem(t) {
      if (durum !== 'oyna' || !M) return; const S = M.S;
      if (t === 'sol') { if (M.oynat(-1, 0)) ses('click'); } else if (t === 'sag') { if (M.oynat(1, 0)) ses('click'); } else if (t === 'don') { if (M.don(1)) ses('click'); } else if (t === 'ters') M.don(-1);
      else if (t === 'asagi') { if (M.oynat(0, 1)) { S.puan++; dusT = 0; } } else if (t === 'bırak') { const s = M.birak(); dusT = 0; return sonra(s); } else if (t === 'sakla') { if (M.sakla()) ses('click'); }
      ciz();
    }
    function dongu(t) { raf = requestAnimationFrame(dongu); const dt = Math.min(100, t - son); son = t; if (silT > 0) silT--; if (durum !== 'oyna' || !M) return;
      dusT += dt; if (dusT >= hizMs()) { dusT = 0; if (!M.oynat(0, 1)) { kilitT += hizMs(); if (kilitT >= 450 || M.S.sev > 8) { kilitT = 0; sonra(M.kilitle()); } } else kilitT = 0; ciz(); } else if (silT > 0) ciz(); }
    function basla(g) { gunluk = g; q('#db-seri').innerHTML = ''; M = motor(g ? 31000 + GN * 7 : (Math.random() * 2 ** 31) | 0); durum = 'oyna'; ekran(''); dusT = 0; boyut(); ses('click'); }
    function bitti() {
      durum = 'bitti'; const S = M.S, yeni = S.puan > D.en; if (yeni) D.en = S.puan; D.enS = Math.max(D.enS, S.satir); D.oyn++; if (S.puan) api.submitScore(S.puan);
      if (gunluk) { D.gunO = { g: GN, p: S.puan, s: S.satir }; if (window.Seri) Seri.kaydet('dusen', GN, { ok: S.satir >= 10, b: S.satir >= 40 ? 3 : S.satir >= 20 ? 2 : S.satir >= 10 ? 1 : 0 }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      kaydet(); ses(yeni ? 'win' : 'lose');
      oyun._paylas = `Düşen Bloklar${gunluk ? ' · günün oyunu #' + (GN + 1) : ''}: ${S.puan} puan, ${S.satir} satır, seviye ${S.sev}\nerdevelop.com/oyunlar/#o/dusen`;
      ekran(`<h2>${yeni ? 'Yeni rekor!' : 'Oyun bitti'}</h2><p>${S.puan} puan · ${S.satir} satır · seviye ${S.sev}</p>${gunluk ? '<p>Günün oyunu bitti; yarın yeni parça sırası.</p>' : ''}<button class="ana" data-a="serbest">↻ Yeni oyun</button><button data-a="paylas">Paylaş</button><button data-a="menu">Menü</button>`);
      if (gunluk && window.Seri) q('#db-seri').appendChild(Seri.panel('dusen', { etiketler: ['0–9 satır', '10–19', '20–39', '40+'], baslik: 'Günün oyunu', api }));
    }
    function ekran(h) { const e = q('#db-e'); if (!h) { e.style.display = 'none'; e.innerHTML = ''; return; } e.style.display = ''; e.innerHTML = `<div>${h}</div>`; }
    function menu() { durum = 'menu'; const g = D.gunO && D.gunO.g === GN;
      ekran(`<h2>Düşen Bloklar</h2><p>Sağa sola kaydır, dokun ve döndür, aşağı hızla kaydır ve bırak. Dolan satırlar silinir, 4 satır birden çok puan getirir.</p>
        <button class="ana" data-a="gunluk">${g ? `📅 Günün oyunu: ${D.gunO.p} puan ✓` : '📅 Günün oyunu'}</button><button data-a="serbest">▶ Serbest oyun</button>${D.en ? `<p>En yüksek: ${D.en} puan · ${D.enS} satır</p>` : ''}`); }
    function duraklat() { if (durum !== 'oyna') return; durum = 'durdu'; ekran('<h2>Durdu</h2><button class="ana" data-a="surdur">▶ Devam</button><button data-a="menu">Menü</button>'); }
    kok.addEventListener('click', e => { const b = e.target.closest('button,[data-a]'); if (!b) return;
      if (b.dataset.t) return eylem(b.dataset.t);
      const a = b.dataset.a;
      if (a === 'gunluk') { if (D.gunO && D.gunO.g === GN) { ekran(`<h2>Bugünkü sonucun</h2><p>${D.gunO.p} puan · ${D.gunO.s} satır. Yarın yeni parça sırası gelecek.</p><button class="ana" data-a="serbest">▶ Serbest oyun</button><button data-a="menu">Menü</button>`); return; } basla(true); }
      else if (a === 'serbest') basla(false); else if (a === 'menu') menu(); else if (a === 'surdur') { durum = 'oyna'; ekran(''); }
      else if (a === 'dur') { if (durum === 'oyna') duraklat(); else if (durum === 'durdu') { durum = 'oyna'; ekran(''); } } else if (a === 'sakla') eylem('sakla');
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
    /* dokunma hareketleri */
    let d0 = null;
    cv.addEventListener('pointerdown', e => { if (durum !== 'oyna') return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } d0 = { x: e.clientX, y: e.clientY, t: Date.now(), ax: 0, ay: 0, hareket: false }; });
    cv.addEventListener('pointermove', e => { if (!d0 || durum !== 'oyna') return; const dx = e.clientX - d0.x - d0.ax, dy = e.clientY - d0.y - d0.ay, adim = hc * .9;
      while (Math.abs(dx) >= adim && Math.abs(e.clientX - d0.x - d0.ax) >= adim) { const y = Math.sign(e.clientX - d0.x - d0.ax); eylem(y > 0 ? 'sag' : 'sol'); d0.ax += y * adim; d0.hareket = true; }
      if (e.clientY - d0.y - d0.ay >= adim) { eylem('asagi'); d0.ay += adim; d0.hareket = true; } });
    cv.addEventListener('pointerup', e => { if (!d0 || durum !== 'oyna') { d0 = null; return; } const dt = Date.now() - d0.t, dy = e.clientY - d0.y, dx = e.clientX - d0.x;
      if (dy > hc * 3 && dt < 260 && Math.abs(dy) > Math.abs(dx) * 1.5) eylem('bırak'); else if (!d0.hareket && Math.hypot(dx, dy) < 10) eylem('don'); d0 = null; });
    const tus = e => { if (durum !== 'oyna') return; const k = e.key; const m = { ArrowLeft: 'sol', ArrowRight: 'sag', ArrowDown: 'asagi', ArrowUp: 'don', x: 'don', X: 'don', z: 'ters', Z: 'ters', ' ': 'bırak', c: 'sakla', C: 'sakla', Shift: 'sakla' }[k]; if (m) { e.preventDefault(); eylem(m); } else if (k === 'p' || k === 'Escape') duraklat(); };
    addEventListener('keydown', tus); const gizlen = () => { if (document.hidden) duraklat(); }; document.addEventListener('visibilitychange', gizlen); addEventListener('resize', boyut);
    M = motor(1); boyut(); menu(); raf = requestAnimationFrame(dongu);
    api.onCleanup(() => { cancelAnimationFrame(raf); removeEventListener('keydown', tus); removeEventListener('resize', boyut); document.removeEventListener('visibilitychange', gizlen); root.classList.remove('db-mount'); });
    if (/[?&]dbtest/.test(location.search)) window.__db = { M: () => M, eylem, durum: () => durum };
  }
});
})();
