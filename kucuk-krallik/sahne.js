/* Küçük Krallık · savaş sahnesi
   Bir sefer hedefe varıp savaş çözüldüğünde, savaş motorunun tur tur kayıtlarından kısa bir animasyon oynatır.
   Sol taraf senin ordun, sağ taraf düşman. Asker sayıları gerçek savaştaki gibi azalır. */

var kkSahneQ = [], kkSahneAkt = null;
const SAH_SIRA = ['inf', 'spear', 'cav', 'arch', 'cat']; // önden arkaya
function kkSahneOyna(d) { if (!d || !d.cap || !d.cap.sn) return; kkSahneQ.push(d); if (!kkSahneAkt) kkSahneSiradaki(); }
function kkSahneSiradaki() {
  const d = kkSahneQ.shift(); if (!d) { kkSahneAkt = null; return; }
  let ov = document.getElementById('kkSah');
  if (!ov) {
    ov = document.createElement('div'); ov.id = 'kkSah';
    ov.innerHTML = '<div class="kks-box"><div class="kks-hd"><b id="kksT"></b><button class="mini" id="kksX" aria-label="' + kkL('Kapat', 'Close') + '">✕</button></div><canvas id="kksC"></canvas><div class="kks-ft"><span id="kksS"></span><span class="btns"><button class="sm g" id="kksAtla">' + kkL('Atla', 'Skip') + '</button><button class="sm g hide" id="kksRap">' + kkL('Raporu gör', 'View report') + '</button><button id="kksOk" class="hide">' + kkL('Tamam', 'OK') + '</button></span></div></div>';
    document.body.appendChild(ov);
    const st = document.createElement('style');
    st.textContent = '#kkSah{position:fixed;inset:0;z-index:300;background:rgba(10,8,5,.62);display:flex;align-items:center;justify-content:center;padding:12px}#kkSah.hide{display:none}' +
      '#kkSah .kks-box{width:min(720px,100%);background:var(--card);border:2px solid var(--frame,#8b6a44);border-radius:12px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.5)}' +
      '#kkSah .kks-hd{display:flex;align-items:center;gap:8px;padding:8px 12px}#kkSah .kks-hd b{flex:1;font-size:16px;font-family:"Cinzel",Georgia,serif}' +
      '#kksC{display:block;width:100%;aspect-ratio:16/9;background:#9cc3d8}#kkSah .kks-ft{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;flex-wrap:wrap}#kksS{font-size:13px;color:var(--mute);font-weight:700}';
    document.head.appendChild(st);
    ov.addEventListener('click', function (e) {
      const id = e.target.id;
      if (id === 'kksAtla') { if (kkSahneAkt) kkSahneAkt.t0 = performance.now() - kkSahneAkt.T * 1000; }
      else if (id === 'kksX' || id === 'kksOk' || (e.target === ov && kkSahneAkt && kkSahneAkt.bitti)) kkSahneKapat();
      else if (id === 'kksRap') { const rid = kkSahneAkt && kkSahneAkt.d.rid; kkSahneKapat(); kkSahneQ = []; if (typeof mapKapa === 'function' && window.mapOpen) mapKapa(); try { kkRapGoster(rid); } catch (er) { } }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && kkSahneAkt) kkSahneKapat(); });
  }
  ov.classList.remove('hide');
  document.getElementById('kksT').textContent = '⚔️ ' + kkT(d.ad);
  document.getElementById('kksAtla').textContent = kkL('Atla', 'Skip'); document.getElementById('kksRap').textContent = kkL('Raporu gör', 'View report'); document.getElementById('kksOk').textContent = kkL('Tamam', 'OK');
  document.getElementById('kksAtla').classList.remove('hide'); document.getElementById('kksOk').classList.add('hide'); document.getElementById('kksRap').classList.add('hide');
  kkSahneAkt = kkSahneKur(d);
  requestAnimationFrame(kkSahneCiz);
}
function kkSahneKapat() { const ov = document.getElementById('kkSah'); if (ov) ov.classList.add('hide'); kkSahneAkt = null; if (kkSahneQ.length) setTimeout(kkSahneSiradaki, 250); }

function kkRnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
/* figürleri ve zaman çizelgesini hazırla */
function kkSahneKur(d) {
  const cv0 = document.getElementById('kksC'), narrow = (cv0 && cv0.clientWidth || 640) < 520, c = d.cap, N = narrow ? 26 : 40;
  const per = Math.max(1, Math.ceil(Math.max(kkTot(c.A0), kkTot(c.B0)) / N));
  const side = function (X0, dir) {
    const F = []; let col = 0;
    SAH_SIRA.forEach(function (k) {
      const n = X0[k] ? Math.max(1, Math.round(X0[k] / per)) : 0; if (!n) return;
      const rows = k === 'cav' || k === 'cat' ? 3 : 5, cols = Math.ceil(n / rows);
      for (let i = 0; i < n; i++) { const cc = col + Math.floor(i / rows), r = i % rows; F.push({ k: k, i: i, col: cc, row: r, rows: rows, seed: kkRnd(F.length * 3.7 + dir), die: kkRnd(F.length * 9.1 + dir * 5) }); }
      col += cols + (k === 'cav' ? .6 : .3);
    });
    // aynı türde ölüm sırası: önce "die" değeri küçük olanlar
    SAH_SIRA.forEach(function (k) { F.filter(function (f) { return f.k === k; }).sort(function (a, b) { return a.die - b.die; }).forEach(function (f, j) { f.ord = j; }); });
    return F;
  };
  const sn = c.sn.length ? c.sn : [[c.A1, c.B1]];
  const T = 1.3 + Math.max(2.6, Math.min(5.2, sn.length * .28)) + .2;
  return { d: d, per: per, A: side(c.A0, 1), B: side(c.B0, -1), sn: sn, Tb: T - 1.5, T: T, t0: performance.now(), parts: [], lastShot: 0, bitti: false, hava: typeof havaNow === 'function' ? havaNow() : 'acik' };
}
/* zaman içinde kalan asker: başlangıç + tur kayıtları arasında yumuşak geçiş */
function kkDeger(S0, sn, pos, k) { const L = [S0].concat(sn), i = Math.max(0, Math.min(L.length - 1, Math.floor(pos))), j = Math.min(L.length - 1, i + 1), f = Math.max(0, Math.min(1, pos - i)); return (L[i][k] || 0) * (1 - f) + (L[j][k] || 0) * f; }
function kkCanli(S0, sn, pos, k, per) { const v = kkDeger(S0, sn, pos, k); return v < .5 ? 0 : Math.max(1, Math.round(v / per)); }

function kkSahneCiz(now) {
  const a = kkSahneAkt; if (!a) return;
  const cv = document.getElementById('kksC'); if (!cv) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 640, H = cv.clientHeight || 360;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const t = (now - a.t0) / 1000, cap = a.d.cap;
  const intro = 1.3, bp = Math.max(0, Math.min(1, (t - intro) / a.Tb));
  const pos = t < intro ? 0 : bp * a.sn.length, idx = t < intro ? -1 : Math.min(a.sn.length - 1, Math.floor(pos));
  const sc = Math.max(.78, W / 600), gy = H * .44; // ufuk
  // gökyüzü ve zemin
  let g = c.createLinearGradient(0, 0, 0, gy); const kis = a.hava === 'kar';
  g.addColorStop(0, a.hava === 'firtina' ? '#6f7b8c' : a.hava === 'yagmur' ? '#9aabb8' : a.hava === 'sis' ? '#c9d2d8' : kis ? '#b9c8d4' : '#8fc0de'); g.addColorStop(1, a.hava === 'firtina' ? '#a3aab4' : '#e8efe6');
  c.fillStyle = g; c.fillRect(0, 0, W, gy + 2);
  c.fillStyle = kis ? '#d7dee4' : '#9bb48a'; c.beginPath(); c.moveTo(0, gy); for (let x = 0; x <= W; x += 20) c.lineTo(x, gy - 18 * sc - Math.sin(x / 90 + 1) * 14 * sc - Math.sin(x / 37) * 5 * sc); c.lineTo(W, gy); c.fill();
  c.fillStyle = kis ? '#c3ccd2' : '#7f9e6e'; c.beginPath(); c.moveTo(0, gy + 2); for (let x = 0; x <= W; x += 16) c.lineTo(x, gy - 6 * sc - Math.sin(x / 55 + 3) * 7 * sc); c.lineTo(W, gy + 2); c.fill();
  g = c.createLinearGradient(0, gy, 0, H); g.addColorStop(0, kis ? '#e4e9ec' : '#8db36e'); g.addColorStop(1, kis ? '#cfd8dd' : '#6d9450'); c.fillStyle = g; c.fillRect(0, gy, W, H - gy);
  c.globalAlpha = .12; c.fillStyle = '#2f4a22'; for (let i = 0; i < 60; i++) { const x = kkRnd(i) * W, y = gy + 8 + kkRnd(i + 50) * (H - gy - 8); c.fillRect(x, y, 3 * sc, 1.2 * sc); } c.globalAlpha = 1;
  // ağaçlar uzakta
  for (let i = 0; i < 9; i++) { const x = (i * 83 + 20) % W * 1, y = gy - 2; kkAgac(c, x, y, sc * (0.6 + kkRnd(i) * .4), kis); }
  // sancaklar
  kkSancak(c, 24 * sc, gy + 6 * sc, sc, '#3f6fb0'); kkSancak(c, W - 24 * sc, gy + 6 * sc, sc, a.d.col || '#a8382c');
  // ordu yerleşimi
  const front = W * .5, gap = 34 * sc, cw = 15 * sc, rh = (H - gy - 30 * sc) / 5.4;
  const yer = function (f, dir) {
    const march = t < intro ? (1 - t / intro) * W * .32 : 0;
    let x = front - dir * (gap + f.col * cw) - dir * march;
    const y = gy + 22 * sc + (f.row + (f.rows === 3 ? .8 : 0)) * rh * (f.rows === 3 ? 1.5 : 1) + (f.col % 2) * rh * .35;
    if (t >= intro && !a.bitti) {
      const ph = (t * 2.2 + f.seed * 6.28);
      if (f.k === 'inf' || f.k === 'spear') x += dir * (Math.sin(ph) * .5 + .5) * 9 * sc * (f.col < 2 ? 1 : .3);
      if (f.k === 'cav') x += dir * (Math.max(0, Math.sin(t * 1.4 + f.seed * 3)) * 30 * sc);
    }
    return [x, y];
  };
  const sideCiz = function (F, S0, idxS, dir, col, si) {
    const alive = {}; SAH_SIRA.forEach(function (k) { alive[k] = kkCanli(S0, a.sn.map(function (s) { return s[si]; }), pos, k, a.per); });
    const L = F.map(function (f) { return { f: f, p: yer(f, dir), dead: f.ord >= alive[f.k] }; }).sort(function (p, q) { return p.p[1] - q.p[1]; });
    L.forEach(function (o) { kkFigur(c, o.p[0], o.p[1], o.f.k, col, dir, t + o.f.seed * 3, o.dead, sc); });
    return L;
  };
  const LA = sideCiz(a.A, cap.A0, idx, 1, '#3f6fb0', 0), LB = sideCiz(a.B, cap.B0, idx, -1, a.d.col || '#a8382c', 1);
  // atışlar: okçular ve katapultlar
  if (t > intro && bp < 1) {
    if (now - a.lastShot > 110) {
      a.lastShot = now;
      [[LA, LB, 1], [LB, LA, -1]].forEach(function (pr) {
        const sh = pr[0].filter(function (o) { return !o.dead && (o.f.k === 'arch' || o.f.k === 'cat'); }), tg = pr[1].filter(function (o) { return !o.dead; });
        if (!sh.length || !tg.length) return;
        const s = sh[(Math.random() * sh.length) | 0], q = tg[(Math.random() * tg.length) | 0];
        a.parts.push({ k: s.f.k === 'cat' ? 'tas' : 'ok', x0: s.p[0], y0: s.p[1] - 10 * sc, x1: q.p[0] + (Math.random() - .5) * 10 * sc, y1: q.p[1] - 4 * sc, t0: t, d: s.f.k === 'cat' ? 1.1 : .55 });
      });
      if (Math.random() < .6) a.parts.push({ k: 'kivilcim', x0: front + (Math.random() - .5) * 40 * sc, y0: gy + 30 * sc + Math.random() * (H - gy - 50 * sc), t0: t, d: .35 });
    }
  }
  a.parts = a.parts.filter(function (p) { return t - p.t0 < p.d + .4; });
  a.parts.forEach(function (p) {
    const f = (t - p.t0) / p.d;
    if (p.k === 'kivilcim') { if (f > 1) return; c.strokeStyle = 'rgba(255,230,150,' + (1 - f) + ')'; c.lineWidth = 1.2; for (let i = 0; i < 5; i++) { const an = i * 1.26 + p.t0, r = (3 + f * 9) * sc; c.beginPath(); c.moveTo(p.x0 + Math.cos(an) * r * .4, p.y0 + Math.sin(an) * r * .4); c.lineTo(p.x0 + Math.cos(an) * r, p.y0 + Math.sin(an) * r); c.stroke(); } return; }
    if (f > 1) { if (p.k === 'tas') { const ff = (f - 1) / (.4 / p.d); c.fillStyle = 'rgba(140,120,90,' + Math.max(0, .5 - ff * .5) + ')'; c.beginPath(); c.arc(p.x1, p.y1, (4 + ff * 10) * sc, 0, 6.3); c.fill(); } return; }
    const x = p.x0 + (p.x1 - p.x0) * f, hgt = (p.k === 'tas' ? 70 : 34) * sc, y = p.y0 + (p.y1 - p.y0) * f - Math.sin(f * Math.PI) * hgt;
    if (p.k === 'tas') { c.fillStyle = '#6f6a62'; c.beginPath(); c.arc(x, y, 2.6 * sc, 0, 6.3); c.fill(); }
    else { const dx = (p.x1 - p.x0) / p.d, dy = (p.y1 - p.y0) / p.d - Math.cos(f * Math.PI) * Math.PI * hgt / p.d, m = Math.hypot(dx, dy) || 1; c.strokeStyle = '#3b2e21'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x - dx / m * 7 * sc, y - dy / m * 7 * sc); c.stroke(); }
  });
  if (typeof kkHavaCiz === 'function') kkHavaCiz(c, W, H, Date.now(), a.hava, .6);
  // sayaçlar
  const sumAt = function (S0, si) { let v = 0; const L = a.sn.map(function (x) { return x[si]; }); for (const k in S0) v += kkDeger(S0, L, pos, k); return Math.round(v); }, nA = sumAt(cap.A0, 0), nB = sumAt(cap.B0, 1);
  kkEtiket(c, 12 * sc, 12 * sc, kkL('Ordun: ', 'Your army: ') + fmt(nA) + ' / ' + fmt(Math.round(kkTot(cap.A0))), '#3f6fb0', 'left', sc);
  kkEtiket(c, W - 12 * sc, 12 * sc, kkL('Düşman: ', 'Enemy: ') + fmt(nB) + ' / ' + fmt(Math.round(kkTot(cap.B0))), a.d.col || '#a8382c', 'right', sc);
  const st = document.getElementById('kksS');
  // sonuç
  if (t >= a.T) {
    if (!a.bitti) {
      a.bitti = true; document.getElementById('kksAtla').classList.add('hide'); document.getElementById('kksOk').classList.remove('hide');
      if (a.d.rep) document.getElementById('kksRap').classList.remove('hide');
      st.textContent = kkL('Kayıp: ', 'Losses: ') + fmt(Math.round(kkTot(cap.A0) - kkTot(cap.A1))) + kkL(' asker · Düşman kaybı: ', ' soldiers · Enemy losses: ') + fmt(Math.round(kkTot(cap.B0) - kkTot(cap.B1)));
    }
    const k = Math.min(1, (t - a.T) / .5); c.fillStyle = 'rgba(20,14,8,' + (.35 * k) + ')'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(W / 2, H / 2); c.scale(.8 + .2 * k, .8 + .2 * k); c.globalAlpha = k;
    c.font = '700 ' + Math.round(54 * sc) + 'px Cinzel,Georgia,serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 6 * sc; c.strokeStyle = 'rgba(30,20,10,.8)'; const yz = a.d.win ? kkL('ZAFER', 'VICTORY') : kkL('YENİLGİ', 'DEFEAT'); c.strokeText(yz, 0, 0);
    c.fillStyle = a.d.win ? '#f3cf5a' : '#e06a55'; c.fillText(yz, 0, 0); c.restore();
  } else st.textContent = t < intro ? kkL('Ordular karşı karşıya…', 'The armies face off…') : kkL('Savaş sürüyor… tur ', 'Battle under way… round ') + Math.max(1, idx + 1) + ' / ' + a.sn.length;
  if (kkSahneAkt === a && !(a.bitti && t > a.T + .6)) requestAnimationFrame(kkSahneCiz);
}
function kkEtiket(c, x, y, s, col, al, sc) {
  c.font = '700 ' + Math.round(12 * sc + 1) + 'px Nunito,system-ui,sans-serif'; const w = c.measureText(s).width + 16 * sc, x0 = al === 'left' ? x : x - w;
  c.fillStyle = 'rgba(250,244,230,.9)'; c.beginPath(); if (c.roundRect) c.roundRect(x0, y, w, 22 * sc, 11 * sc); else c.rect(x0, y, w, 22 * sc); c.fill();
  c.fillStyle = col; c.fillRect(x0 + 6 * sc, y + 7 * sc, 4 * sc, 8 * sc); c.fillStyle = '#3a2c1e'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(s, x0 + 13 * sc, y + 11.5 * sc);
}
function kkAgac(c, x, y, s, kis) { c.fillStyle = '#5e4229'; c.fillRect(x - 1.5 * s, y - 10 * s, 3 * s, 10 * s); c.fillStyle = kis ? '#e6ecef' : '#5f8a4c'; c.beginPath(); c.moveTo(x, y - 34 * s); c.lineTo(x + 10 * s, y - 8 * s); c.lineTo(x - 10 * s, y - 8 * s); c.fill(); c.fillStyle = kis ? '#f6f9fa' : '#6f9a59'; c.beginPath(); c.moveTo(x, y - 38 * s); c.lineTo(x + 7 * s, y - 20 * s); c.lineTo(x - 7 * s, y - 20 * s); c.fill(); }
function kkSancak(c, x, y, s, col) { c.strokeStyle = '#5e4229'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 46 * s); c.stroke(); c.fillStyle = col; const w = Math.sin(performance.now() / 300) * 2 * s; c.beginPath(); c.moveTo(x, y - 46 * s); c.quadraticCurveTo(x + 10 * s, y - 44 * s + w, x + 20 * s, y - 42 * s); c.lineTo(x + 18 * s, y - 32 * s); c.quadraticCurveTo(x + 9 * s, y - 34 * s - w, x, y - 30 * s); c.fill(); }
/* tek bir asker figürü; dir=1 sağa bakar */
function kkFigur(c, x, y, k, col, dir, t, dead, sc) {
  c.save(); c.translate(x, y); c.scale(dir * sc, sc);
  if (dead) { c.globalAlpha = .38; c.rotate(-Math.PI / 2 * .95); c.translate(-2, 2); }
  const step = dead ? 0 : Math.sin(t * 9) * 2.2, skin = '#e8c9a0', dark = '#3b2e21';
  if (k === 'cav') {
    // at
    c.fillStyle = '#7a4f2e'; c.beginPath(); c.ellipse(0, -9, 10, 5, 0, 0, 6.3); c.fill();
    c.fillRect(7, -17, 4, 9); c.beginPath(); c.ellipse(11.5, -17.5, 4, 2.4, -.5, 0, 6.3); c.fill();
    c.strokeStyle = '#5a3820'; c.lineWidth = 1.8; [[-7, step], [-4, -step], [4, step], [7, -step]].forEach(function (l) { c.beginPath(); c.moveTo(l[0], -6); c.lineTo(l[0] + l[1] * .6, 0); c.stroke(); });
    c.strokeStyle = '#3b2412'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-10, -10); c.quadraticCurveTo(-14, -6, -13, -2); c.stroke();
    // binici
    c.fillStyle = col; c.fillRect(-2.5, -21, 5, 8); c.fillStyle = skin; c.beginPath(); c.arc(0, -23.5, 2.6, 0, 6.3); c.fill(); c.fillStyle = '#8a9298'; c.beginPath(); c.arc(0, -24.3, 2.7, Math.PI, 0); c.fill();
    c.strokeStyle = '#6b4a2b'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-6, -15); c.lineTo(16, -26); c.stroke(); c.fillStyle = '#b9c0c4'; c.beginPath(); c.moveTo(16, -26); c.lineTo(19.5, -28); c.lineTo(17, -24.6); c.fill();
  } else if (k === 'cat') {
    c.fillStyle = '#8a5a32'; c.fillRect(-9, -7, 18, 4); c.fillStyle = '#5e4229'; c.beginPath(); c.arc(-6, -2, 3, 0, 6.3); c.arc(6, -2, 3, 0, 6.3); c.fill();
    c.strokeStyle = '#6b4224'; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -7); c.lineTo(0, -16); c.lineTo(4, -7); c.stroke();
    const an = dead ? 0 : -1.1 + Math.max(0, Math.sin(t * 2.4)) * 1.5; c.save(); c.translate(0, -15); c.rotate(an); c.strokeStyle = '#8a5a32'; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, 0); c.lineTo(8, 0); c.stroke(); c.fillStyle = '#5e4229'; c.beginPath(); c.arc(-10, -1, 2.4, 0, 6.3); c.fill(); c.restore();
    c.fillStyle = col; c.fillRect(-12, -14, 3, 6);
  } else {
    // bacaklar
    c.strokeStyle = dark; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-1.2, -7); c.lineTo(-1.2 - step * .5, 0); c.moveTo(1.2, -7); c.lineTo(1.2 + step * .5, 0); c.stroke();
    // gövde, baş, miğfer
    c.fillStyle = col; c.beginPath(); c.moveTo(-3.4, -7); c.lineTo(3.4, -7); c.lineTo(2.8, -15); c.lineTo(-2.8, -15); c.closePath(); c.fill();
    c.fillStyle = skin; c.beginPath(); c.arc(0, -17.6, 2.7, 0, 6.3); c.fill();
    c.fillStyle = k === 'arch' ? '#6b4a2b' : '#8a9298'; c.beginPath(); c.arc(0, -18.4, 2.9, Math.PI, 0); c.fill();
    if (k === 'inf') {
      const sw = dead ? 0 : Math.sin(t * 6) * .9; c.save(); c.translate(2.5, -12); c.rotate(-.6 + sw); c.strokeStyle = '#c9d0d4'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(8, 0); c.stroke(); c.restore();
      c.fillStyle = '#5b3a22'; c.beginPath(); c.ellipse(3.6, -10.5, 2.4, 4.4, 0, 0, 6.3); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(3.9, -10.5, 1.6, 3.4, 0, 0, 6.3); c.fill();
    } else if (k === 'spear') {
      const th = dead ? 0 : Math.sin(t * 5) * 1.6; c.strokeStyle = '#6b4a2b'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-4 + th, -9); c.lineTo(14 + th, -20); c.stroke(); c.fillStyle = '#c9d0d4'; c.beginPath(); c.moveTo(14 + th, -20); c.lineTo(18 + th, -22.6); c.lineTo(15.3 + th, -18.4); c.fill();
      c.fillStyle = '#6b4a2b'; c.fillRect(-4.6, -14, 2.2, 7);
    } else if (k === 'arch') {
      const dr = dead ? 0 : Math.max(0, Math.sin(t * 3.2)) * 2.4; c.strokeStyle = '#5b3a22'; c.lineWidth = 1.3; c.beginPath(); c.arc(3.5, -12, 6, -1.25, 1.25); c.stroke();
      c.strokeStyle = '#e9e2d0'; c.lineWidth = .6; c.beginPath(); c.moveTo(3.5 + 6 * Math.cos(-1.25), -12 + 6 * Math.sin(-1.25)); c.lineTo(3.5 - dr, -12); c.lineTo(3.5 + 6 * Math.cos(1.25), -12 + 6 * Math.sin(1.25)); c.stroke();
      c.fillStyle = '#6b4a2b'; c.fillRect(-4.4, -15, 2, 6);
    }
  }
  c.restore();
}
