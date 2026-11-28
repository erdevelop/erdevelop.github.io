/* ================= çizim ================= */
const W2S = (x, y) => [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2];
function arkaPlan(t) {
  ctx.fillStyle = '#02030A'; ctx.fillRect(0, 0, W, H);
  // uzak galaksiler
  if (GK().gal) tileSprite(0.006, 1100, 71, 0.4, (r, X, Y) => { const sp = GSP[(r() * GSP.length) | 0], s = 50 + r() * r() * 260; ctx.save(); ctx.globalAlpha = 0.35 + r() * 0.5; ctx.translate(X, Y); ctx.rotate(r() * TAU); ctx.scale(1, 0.25 + r() * 0.75); ctx.drawImage(sp, -s / 2, -s / 2, s, s); ctx.restore(); }, 300);
  if (GK().saman) samanCiz();
  // bulutsular
  ctx.globalCompositeOperation = 'lighter';
  if (GK().bul) tileSprite(0.014, 1500, 83, 0.55, (r, X, Y) => { const sp = NEB[(r() * NEB.length) | 0], s = 700 + r() * 1100; ctx.save(); ctx.globalAlpha = 0.22 + r() * 0.3; ctx.translate(X, Y); ctx.rotate(r() * TAU); ctx.drawImage(sp, -s / 2, -s / 2, s, s); ctx.restore(); }, 1000);
  ctx.globalCompositeOperation = 'source-over';
  const nk = GK().katman; for (let i = 0; i < KAT.length && i < nk; i++) katman(KAT[i]);
}
function katman(Lk) {
  const ox = bg.x * Lk.p, oy = bg.y * Lk.p, ts = Lk.ts, i0 = Math.floor(ox / ts), j0 = Math.floor(oy / ts), fx = ox - i0 * ts, fy = oy - j0 * ts;
  for (let j = 0; j * ts - fy < H; j++) for (let i = 0; i * ts - fx < W; i++) ctx.drawImage(Lk.v[h32(i0 + i, j0 + j, Lk.seed) % Lk.v.length], i * ts - fx, j * ts - fy, ts, ts);
}
function tileSprite(p, ts, seed, sans, ciz, pay) {
  const ox = bg.x * p, oy = bg.y * p, i0 = Math.floor((ox - pay) / ts), j0 = Math.floor((oy - pay) / ts), i1 = Math.floor((ox + W + pay) / ts), j1 = Math.floor((oy + H + pay) / ts);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const r = rng(h32(i, j, seed)); if (r() > sans) continue; ciz(r, i * ts + r() * ts - ox, j * ts + r() * ts - oy); }
}

function dunya(t) {
  const z = cam.z, vw = W / 2 / z, vh = H / 2 / z, M = 5200;
  const sx0 = Math.floor((cam.x - vw - M) / SEK), sx1 = Math.floor((cam.x + vw + M) / SEK), sy0 = Math.floor((cam.y - vh - M) / SEK), sy1 = Math.floor((cam.y + vh + M) / SEK);
  const etiket = [];
  for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) {
    const tm = temel(sx, sy); if (!tm) continue;
    const [X, Y] = W2S(tm.x, tm.y), Rs = 4800 * z; if (X + Rs < 0 || X - Rs > W || Y + Rs < 0 || Y - Rs > H) continue;
    sistemCiz(sistem(sx, sy), t, X, Y, etiket);
  }
  ctx.font = '800 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
  for (const e of etiket) { ctx.fillStyle = 'rgba(2,3,10,.65)'; const w = ctx.measureText(e[0]).width; ctx.fillRect(e[1] - w / 2 - 5, e[2] - 11, w + 10, 16); ctx.fillStyle = e[3]; ctx.fillText(e[0], e[1], e[2] + 1); }
}

function sistemCiz(s, t, X, Y, etiket) {
  const z = cam.z, tm = s.t, bilinen = KESIF.has('s:' + tm.k);
  // yörüngeler
  if (z > 0.018) {
    ctx.lineWidth = 1; ctx.strokeStyle = `rgba(140,170,255,${kis(z * 0.5, 0.035, 0.08)})`;
    for (const p of s.gez) { const r = p.R * z; if (r < 18) continue; ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.stroke(); }
  }
  // asteroit kuşağı
  if (s.kusak) kusakCiz(s, t, X, Y);
  // yıldız
  if (s.Y.kd) karaDelikCiz(s, t, X, Y); else yildizCiz(s, t, X, Y);
  // gezegenler
  for (const p of s.gez) {
    const [px, py] = gezPos(p, t), [GX, GY] = W2S(px, py), sr = p.r * z, ext = Math.max(sr * 2.6, (p.ay.length ? p.ay[p.ay.length - 1].R * z : 0) + 10, p.kol && p.kol.ist ? p.r * 3 * z + 20 : 0);
    if (GX + ext < -20 || GX - ext > W + 20 || GY + ext < -20 || GY - ext > H + 20) continue;
    let lx = px - s.x, ly = py - s.y; const ld = Math.hypot(lx, ly) || 1; lx /= ld; ly /= ld;
    gezegenCiz(p, t, GX, GY, sr, lx, ly);
    if (KOL && p.id === KOL.id) kolOrtu(p, t, GX, GY, sr, lx, ly);
    if (sr > 2.5 && z > 0.035) {
      const pb = KESIF.has('p:' + p.id);
      const kkx = KARAKOL.find(k => k.id === p.id), okx = !kkx && OKK.size && OKK.get(p.s.t.sx + ',' + p.s.t.sy + ',' + p.i); if (okx) etiket.push([(okx.k ? '🏙⚑ ' : '⚑ ') + okx.n, GX, GY - Math.max(sr, 4) - 12, '#FFC36B']);
      if (kkx) { etiket.push([kkx.koloni ? '🏙⚑ ' + kkx.koloni.ad : '⚑ ' + p.ad, GX, GY + Math.max(sr, 4) + 18, '#B8F09A']); karakolCiz(GX, GY, sr, t); }
      else if (pb && p.kol) etiket.push([(yabanciMi(p) ? IRK[p.kol.irk].e : '🏙') + ' ' + kolAd(p), GX, GY + Math.max(sr, 4) + 18, '#FFD98A']);
      else if (pb) etiket.push([(p.kalinti && !KESIF.has('r:' + p.id) ? '🏛 ' : '') + p.ad, GX, GY + Math.max(sr, 4) + 18, '#C9D4F5']);
    }
  }
  // trafik
  if (s.trafik.length && z > 0.03) trafikCiz(s, t);
  // sistem etiketi
  if (z < 0.16) etiket.push([bilinen ? tm.ad + (tm.ev ? ' ⌂' : '') : T('Bilinmeyen yıldız', 'Unknown star'), X, Y + Math.max(tm.yr * z * 2.2, 10) + 16, bilinen ? '#E8EEFF' : 'rgba(170,185,230,.7)']);
}

function yildizCiz(s, t, X, Y) {
  const z = cam.z, Y_ = s.Y, R = Math.max(s.t.yr * z, 2.2), fl = 1 + Math.sin(t * 1.7 + s.t.sx) * 0.02 + Math.sin(t * 4.3 + s.t.sy) * 0.012;
  ctx.globalCompositeOperation = 'lighter';
  const gR = Math.max(R * 8 * fl, 26);
  let g = ctx.createRadialGradient(X, Y, 0, X, Y, gR);
  g.addColorStop(0, `rgba(${Y_.g},.55)`); g.addColorStop(0.1, `rgba(${Y_.g},.3)`); g.addColorStop(0.3, `rgba(${Y_.g},.08)`); g.addColorStop(1, `rgba(${Y_.g},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, gR, 0, TAU); ctx.fill();
  // anamorfik çizgi ve kırınım dikenleri
  { const aw = Math.min(Math.max(R * 14, 100), 640), ah = Math.max(R * 0.07, 1.1); const ga = ctx.createLinearGradient(X - aw, Y, X + aw, Y); ga.addColorStop(0, `rgba(${Y_.g},0)`); ga.addColorStop(0.5, `rgba(${Y_.g},.16)`); ga.addColorStop(1, `rgba(${Y_.g},0)`); ctx.fillStyle = ga; ctx.beginPath(); ctx.ellipse(X, Y, aw, ah, 0, 0, TAU); ctx.fill(); }
  if (R < 40) { const sp = Math.min(Math.max(R * 7, 40), 260); ctx.lineCap = 'round';
    for (const [a0, Lk, lw] of [[0.785, 1, 1], [2.356, 1, 1], [0, 0.55, 0.6], [1.571, 0.55, 0.6]]) { const L1 = sp * Lk, dx = Math.cos(a0) * L1, dy = Math.sin(a0) * L1, gd = ctx.createLinearGradient(X - dx, Y - dy, X + dx, Y + dy); gd.addColorStop(0, `rgba(${Y_.g},0)`); gd.addColorStop(0.5, `rgba(255,255,255,${(0.36 * Lk).toFixed(2)})`); gd.addColorStop(1, `rgba(${Y_.g},0)`); ctx.strokeStyle = gd; ctx.lineWidth = Math.max(0.7, Math.min(1.6, R * 0.05)) * lw; ctx.beginPath(); ctx.moveTo(X - dx, Y - dy); ctx.lineTo(X + dx, Y + dy); ctx.stroke(); } }
  // korona ışınları
  if (R > 10) { ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 0.015 + s.t.sx); for (let i = 0; i < 36; i++) { const a0 = i * TAU / 36 + Math.sin(t * 0.3 + i) * 0.04, L1 = R * (1.22 + 0.22 * Math.sin(i * 7.3 + t * 0.4) + 0.1 * Math.sin(i * 3.1)), gc = ctx.createLinearGradient(Math.cos(a0) * R * 0.9, Math.sin(a0) * R * 0.9, Math.cos(a0) * L1, Math.sin(a0) * L1); gc.addColorStop(0, `rgba(${Y_.g},.1)`); gc.addColorStop(1, `rgba(${Y_.g},0)`); ctx.fillStyle = gc; ctx.beginPath(); ctx.moveTo(Math.cos(a0 - 0.06) * R * 0.95, Math.sin(a0 - 0.06) * R * 0.95); ctx.lineTo(Math.cos(a0) * L1, Math.sin(a0) * L1); ctx.lineTo(Math.cos(a0 + 0.06) * R * 0.95, Math.sin(a0 + 0.06) * R * 0.95); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  if (X > -R && X < W + R && Y > -R && Y < H + R && (!FLARE || R > FLARE.R)) FLARE = { X, Y, R, g: Y_.g };
  ctx.globalCompositeOperation = 'source-over';
  g = ctx.createRadialGradient(X, Y, 0, X, Y, R);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, Y_.c); g.addColorStop(0.92, Y_.k); g.addColorStop(1, `rgba(${Y_.g},.6)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.fill();
  if (R > 40) { // püskürmeler
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r2 = rng(h32(s.t.sx, s.t.sy, 77)); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a0 = r2() * TAU + t * 0.01, w0 = 0.08 + r2() * 0.08, hh = R * (0.15 + r2() * 0.2) * (0.85 + 0.15 * Math.sin(t * 0.7 + i)); ctx.strokeStyle = `rgba(255,${(140 + r2() * 60) | 0},90,.2)`; ctx.lineWidth = Math.max(1.5, R * 0.025); ctx.beginPath(); const ax = X + Math.cos(a0 - w0) * R, ay = Y + Math.sin(a0 - w0) * R, bx = X + Math.cos(a0 + w0) * R, by = Y + Math.sin(a0 + w0) * R, cx = X + Math.cos(a0) * (R + hh * 2), cy = Y + Math.sin(a0) * (R + hh * 2); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(cx, cy, bx, by); ctx.stroke(); }
    ctx.restore();
  }
  if (R > 30) { // yüzey kaynaması
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.07; const r = rng(h32(s.t.sx, s.t.sy, 5));
    for (let i = 0; i < 70; i++) { const a = r() * TAU + t * 0.02 * (r() - 0.5), d = Math.sqrt(r()) * R * 0.88, rr = R * (0.03 + r() * 0.05) * (0.8 + 0.2 * Math.sin(t * (1 + r() * 2) + i)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X + Math.cos(a) * d, Y + Math.sin(a) * d, rr, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
function karaDelikCiz(s, t, X, Y) {
  const z = cam.z, R = Math.max(s.t.yr * z, 3), D = s.disk;
  ctx.globalCompositeOperation = 'lighter';
  let g = ctx.createRadialGradient(X, Y, R, X, Y, Math.max(D.dis * z * 1.6, 30));
  g.addColorStop(0, 'rgba(255,170,90,.25)'); g.addColorStop(0.4, 'rgba(180,90,255,.06)'); g.addColorStop(1, 'rgba(120,60,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, Math.max(D.dis * z * 1.6, 30), 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  const disk = yarim => {
    ctx.save(); ctx.translate(X, Y); ctx.rotate(D.rot); ctx.beginPath(); const m = D.dis * z * 1.2 + 4; if (yarim < 0) ctx.rect(-m, -m, m * 2, m); else ctx.rect(-m, 0, m * 2, m); ctx.clip(); ctx.scale(1, D.tilt);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { const f = i / 26, rr = (D.ic + (D.dis - D.ic) * f) * z, a = (1 - f) * 0.5 + 0.08; ctx.strokeStyle = `rgba(${Math.round(255)},${Math.round(lerp(240, 120, f))},${Math.round(lerp(200, 60, f))},${a.toFixed(2)})`; ctx.lineWidth = Math.max(1, (D.dis - D.ic) * z / 26 * 1.3); ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); }
    // dönen parlak lekeler
    ctx.fillStyle = 'rgba(255,240,220,.5)';
    for (let i = 0; i < 18; i++) { const f = ((i * 0.377) % 1), rr = (D.ic + (D.dis - D.ic) * f) * z, a = i * 2.1 + t * D.w * (1.4 - f); ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, Math.max(1, 3 * z * 10 * (1 - f)), 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  disk(-1);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,225,180,.85)'; ctx.lineWidth = Math.max(1, R * 0.08); ctx.beginPath(); ctx.arc(X, Y, R * 1.12, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,200,140,.3)'; ctx.lineWidth = Math.max(1, R * 0.25); ctx.beginPath(); ctx.arc(X, Y, R * 1.3, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  disk(1);
}
function kusakCiz(s, t, X, Y) {
  const z = cam.z, K = s.kusak, RR = (K.R + K.W) * z, rr = (K.R - K.W) * z;
  const d = Math.hypot(X - W / 2, Y - H / 2), ek = Math.hypot(W, H) / 2;
  if (d - RR > ek || rr - d > ek) return;
  if (z < 0.05) { ctx.strokeStyle = 'rgba(180,170,150,.09)'; ctx.lineWidth = K.W * 2 * z; ctx.beginPath(); ctx.arc(X, Y, K.R * z, 0, TAU); ctx.stroke(); return; }
  const rot = t * K.w;
  for (const a of K.tas) {
    const ang = a[0] + rot * (1 + a[1] / K.R * 0.5), r = (K.R + a[1]) * z, x = X + Math.cos(ang) * r, y = Y + Math.sin(ang) * r;
    if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
    const sz = Math.max(0.8, a[2] * z * 2.2); ctx.fillStyle = `rgba(${(150 * a[3]) | 0},${(140 * a[3]) | 0},${(128 * a[3]) | 0},.9)`;
    if (sz < 2.5) ctx.fillRect(x, y, sz, sz); else { if (!KAYA.length) kayaKur(); const ka = KAYA[(a[0] * 1000 | 0) % KAYA.length], la = Math.atan2(Y - y, X - x); ctx.save(); ctx.translate(x, y); ctx.rotate(la); ctx.globalAlpha = kis(a[3] + 0.1, 0.6, 1); ctx.drawImage(ka, -sz * 1.25, -sz * 1.25, sz * 2.5, sz * 2.5); ctx.restore(); ctx.globalAlpha = 1; }
  }
}
function halkaCiz(h, X, Y, sr, yarim) {
  ctx.save(); ctx.translate(X, Y); ctx.rotate(h.rot); ctx.beginPath(); const m = sr * (h.dis + 0.2); if (yarim < 0) ctx.rect(-m, -m, m * 2, m); else ctx.rect(-m, 0, m * 2, m); ctx.clip(); ctx.scale(1, h.tilt);
  const lw = Math.max(0.6, sr * (h.dis - 1.3) / h.b.length * 1.25);
  for (const b of h.b) { ctx.strokeStyle = b.c; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(0, 0, sr * b.f, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
/* ================= görsel efektler: warp giriş/çıkış, hasar dumanı ve kıvılcım, bulut katmanı ================= */
const WFX = { on: 0, t: -9e9, tur: '' }, KIV = [], BULC = new Map();
function fxAdim(dt) {
  const w = SH.warp || 0;
  if (w > 0.25 && !WFX.on) { WFX.on = 1; WFX.t = performance.now(); WFX.tur = 'gir'; titre(45, 1); }
  else if (w < 0.08 && WFX.on) { WFX.on = 0; WFX.t = performance.now(); WFX.tur = 'cik'; SARS = Math.min(1, SARS + 0.3); titre([30, 40, 60], 1); }
  if (oyunda && !kapsul) {
    const o = can / maxCan(), pr = GK().par;
    if (o < 0.5 && DUMAN.length < 70 * pr && Math.random() < (0.5 - o) * 24 * dt * pr) { const a = SH.a + Math.PI + (Math.random() - 0.5) * 0.9; DUMAN.push({ x: SH.x + Math.cos(a) * 16, y: SH.y + Math.sin(a) * 16, vx: SH.vx * 0.35 + Math.cos(a) * 40, vy: SH.vy * 0.35 + Math.sin(a) * 40, o: 0, w: 1.1 + Math.random(), r: 9 + Math.random() * 10, c: o < 0.25 ? '125,118,122' : '170,170,180' }); }
    if (o < 0.3 && Math.random() < dt * 4 * pr) for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, v = 80 + Math.random() * 170; KIV.push({ x: SH.x, y: SH.y, vx: SH.vx + Math.cos(a) * v, vy: SH.vy + Math.sin(a) * v, o: 0, w: 0.2 + Math.random() * 0.3 }); }
  }
  for (let i = KIV.length - 1; i >= 0; i--) { const k = KIV[i]; k.o += dt; k.x += k.vx * dt; k.y += k.vy * dt; if (k.o > k.w) KIV.splice(i, 1); }
  if (KIV.length > 60) KIV.splice(0, KIV.length - 60);
}
function fxCiz() {
  if (KIV.length) { ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.6; for (const k of KIV) { const [X, Y] = W2S(k.x, k.y), f = 1 - k.o / k.w; ctx.strokeStyle = `rgba(255,${(180 + 60 * f) | 0},90,${f.toFixed(2)})`; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X - k.vx * 0.025 * cam.z, Y - k.vy * 0.025 * cam.z); ctx.stroke(); } ctx.globalCompositeOperation = 'source-over'; }
  const d = (performance.now() - WFX.t) / 1000; if (d > 0.9 || AZ_HAREKET) return;
  const [X, Y] = W2S(SH.x, SH.y); ctx.globalCompositeOperation = 'lighter';
  if (WFX.tur === 'gir' && d < 0.6) { const f = d / 0.6, R = Math.hypot(W, H); ctx.strokeStyle = `rgba(170,150,255,${((1 - f) * 0.6).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 48; i++) { const a = i / 48 * TAU + i * 0.37, r0 = 40 + f * R * 0.35, r1 = r0 + 60 + f * R * 0.5 * (0.5 + (i * 7 % 5) / 5); ctx.moveTo(X + Math.cos(a) * r0, Y + Math.sin(a) * r0); ctx.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1); } ctx.stroke(); ctx.fillStyle = `rgba(190,170,255,${((1 - f) * 0.22).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (WFX.tur === 'cik' && d < 0.8) { const f = d / 0.8; ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 0.42 - f * 0.9).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = `rgba(160,200,255,${((1 - f) * 0.8).toFixed(3)})`; ctx.lineWidth = 3 * (1 - f) + 1; ctx.beginPath(); ctx.arc(X, Y, 20 + f * Math.max(W, H) * 0.6, 0, TAU); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
}
function bulutTuval(p) {
  let c = BULC.get(p.id); if (c) return c;
  const S = 256; c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(h32(String(p.id).length * 131 + [...String(p.id)].reduce((a, ch) => a * 31 + ch.charCodeAt(0) | 0, 7), 3, 5151));
  const yog = p.tip === 'okyanus' ? 46 : p.tip === 'orman' ? 38 : p.tip === 'zehir' ? 52 : 26, renk = p.tip === 'zehir' ? '235,240,170' : p.tip === 'col' ? '255,232,200' : '255,255,255';
  for (let i = 0; i < yog; i++) { const a = r() * TAU, d = Math.sqrt(r()) * S * 0.44, cx = S / 2 + Math.cos(a) * d, cy = S / 2 + Math.sin(a) * d * 0.9, rx = 10 + r() * 30, ry = rx * (0.3 + r() * 0.35), g = x.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(${renk},${(0.35 + r() * 0.4).toFixed(2)})`); g.addColorStop(1, `rgba(${renk},0)`); x.save(); x.translate(cx, cy); x.scale(1, ry / rx); x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, TAU); x.fill(); x.restore(); }
  BULC.set(p.id, c); if (BULC.size > 14) BULC.delete(BULC.keys().next().value); return c;
}
function bulutCiz(p, X, Y, sr, t) {
  if (sr < 40 || !p.P.atm || ['gaz', 'buzdevi', 'lav'].includes(p.tip) || !GK().bul && sr < 90) return;
  const c = bulutTuval(p); ctx.save(); ctx.beginPath(); ctx.arc(X, Y, sr, 0, TAU); ctx.clip(); ctx.translate(X, Y); ctx.rotate(p.a0 * 1.3 + t * p.spin * 1.7); ctx.globalAlpha = Math.min(0.75, (sr - 40) / 90 + 0.25); ctx.drawImage(c, -sr, -sr, sr * 2, sr * 2); ctx.restore();
}
function gezegenCiz(p, t, X, Y, sr, lx, ly) {
  if (sr < 1.3) { ctx.fillStyle = p.P.c; ctx.fillRect(X - 1, Y - 1, 2, 2); return; }
  if (p.halka) halkaCiz(p.halka, X, Y, sr, -1);
  const don = p.a0 + t * p.spin;
  if (sr < 6) { ctx.fillStyle = p.P.c; ctx.beginPath(); ctx.arc(X, Y, sr, 0, TAU); ctx.fill(); }
  else {
    const d = DOKU.get(p.id);
    if (d) { d.k = kareNo; ctx.save(); ctx.translate(X, Y); ctx.rotate(don); ctx.drawImage(d.c, -sr, -sr, sr * 2, sr * 2); ctx.restore(); bulutCiz(p, X, Y, sr, t); }
    else { dokuIste(p); ctx.fillStyle = p.P.c; ctx.beginPath(); ctx.arc(X, Y, sr, 0, TAU); ctx.fill(); }
  }
  // atmosfer
  if (p.P.atm && sr > 3) {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(X - lx * sr * 0.08, Y - ly * sr * 0.08, sr * 0.88, X, Y, sr * 1.16);
    g.addColorStop(0, `rgba(${p.P.atm},0)`); g.addColorStop(0.45, `rgba(${p.P.atm},${p.tip === 'lav' ? 0.18 : 0.3})`); g.addColorStop(1, `rgba(${p.P.atm},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, sr * 1.16, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  // gölge (yıldızdan uzak taraf)
  ctx.save(); ctx.beginPath(); ctx.arc(X, Y, sr + 0.5, 0, TAU); ctx.clip();
  const g = ctx.createLinearGradient(X - lx * sr, Y - ly * sr, X + lx * sr, Y + ly * sr);
  g.addColorStop(0, 'rgba(2,4,14,0)'); g.addColorStop(0.4, 'rgba(2,4,14,0)'); g.addColorStop(0.56, 'rgba(2,4,14,.5)'); g.addColorStop(0.72, 'rgba(2,4,14,.86)'); g.addColorStop(1, 'rgba(2,4,14,.95)');
  ctx.fillStyle = g; ctx.fillRect(X - sr - 1, Y - sr - 1, sr * 2 + 2, sr * 2 + 2);
  if (sr > 8) {
    ctx.globalCompositeOperation = 'lighter';
    if (p.P.atm) { const gt = ctx.createLinearGradient(X - lx * sr, Y - ly * sr, X + lx * sr, Y + ly * sr); gt.addColorStop(0.4, 'rgba(255,120,60,0)'); gt.addColorStop(0.5, `rgba(255,130,70,${p.tip === 'lav' ? 0.1 : 0.16})`); gt.addColorStop(0.6, 'rgba(255,120,60,0)'); ctx.fillStyle = gt; ctx.fillRect(X - sr - 1, Y - sr - 1, sr * 2 + 2, sr * 2 + 2); }
    if (p.tip === 'okyanus' || p.tip === 'buz') { const hx = X - lx * sr * 0.42, hy = Y - ly * sr * 0.42, gs = ctx.createRadialGradient(hx, hy, 0, hx, hy, sr * 0.38); gs.addColorStop(0, `rgba(255,255,255,${p.tip === 'buz' ? 0.16 : 0.24})`); gs.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(hx, hy, sr * 0.38, 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  // koloni ışıkları (gece tarafında)
  if (p.kol && p.kol.isik.length && sr > 7) {
    ctx.globalCompositeOperation = 'lighter'; const c = Math.cos(don), s = Math.sin(don), bs = Math.max(0.8, sr / 70);
    for (const q of p.kol.isik) {
      const rx = q[0] * c - q[1] * s, ry = q[0] * s + q[1] * c, k = rx * lx + ry * ly; if (k < 0.08) continue;
      const a = kis((k - 0.08) * 3.2, 0, 1) * (0.75 + 0.25 * Math.sin(t * 2 + q[3] * 30));
      ctx.fillStyle = yabanciMi(p) ? `rgba(${IRK[p.kol.irk].isik},${a.toFixed(2)})` : `rgba(255,${q[2] > 1 ? 235 : 196},${q[2] > 1 ? 190 : 110},${a.toFixed(2)})`; const b = bs * q[2]; ctx.fillRect(X + rx * sr - b / 2, Y + ry * sr - b / 2, b, b);
    }
  }
  ctx.restore();
  if (p.halka) halkaCiz(p.halka, X, Y, sr, 1);
  // uydular
  const z = cam.z;
  for (const m of p.ay) {
    const a = m.a0 + m.w * t, mx = X + Math.cos(a) * m.R * z, my = Y + Math.sin(a) * m.R * z, mr = m.r * z;
    if (mr < 0.7) { if (z > 0.03) { ctx.fillStyle = 'rgba(210,205,195,.8)'; ctx.fillRect(mx - 0.6, my - 0.6, 1.2, 1.2); } continue; }
    const g2 = ctx.createLinearGradient(mx - lx * mr, my - ly * mr, mx + lx * mr, my + ly * mr); g2.addColorStop(0, m.c); g2.addColorStop(0.48, '#7C776F'); g2.addColorStop(0.62, '#15161E'); g2.addColorStop(1, '#0A0B12');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
  }
  // yörünge istasyonu
  if (p.kol && p.kol.ist && z > 0.04) {
    const [, , ia] = istPos(p, t), R = (p.r * (p.halka ? p.halka.dis + 0.35 : 1.6) + 40) * z, ix = X + Math.cos(ia) * R, iy = Y + Math.sin(ia) * R, s = Math.max(3, 15 * z);
    ctx.save(); ctx.translate(ix, iy); ctx.rotate(t * 0.6);
    ctx.strokeStyle = 'rgba(200,215,240,.9)'; ctx.lineWidth = Math.max(1, s * 0.18); ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.stroke();
    ctx.lineWidth = Math.max(0.7, s * 0.08); ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); } ctx.stroke();
    ctx.fillStyle = '#DCE6F8'; ctx.fillRect(-s * 0.25, -s * 0.25, s * 0.5, s * 0.5);
    ctx.fillStyle = 'rgba(90,150,255,.85)'; ctx.fillRect(s * 0.3, -s * 1.5, s * 0.35, s * 0.9); ctx.fillRect(-s * 0.65, s * 0.6, s * 0.35, s * 0.9);
    const yan = (Math.sin(t * 3 + p.i) > 0.6); if (yan) { ctx.fillStyle = '#FF5B5B'; ctx.beginPath(); ctx.arc(s, 0, Math.max(1.2, s * 0.14), 0, TAU); ctx.fill(); ctx.fillStyle = '#5BFF9B'; ctx.beginPath(); ctx.arc(-s, 0, Math.max(1.2, s * 0.14), 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
function trafikCiz(s, t) {
  const z = cam.z;
  for (const m of s.trafik) {
    let u = (t * m.hiz + m.faz) % 2, ters = u > 1; if (ters) u = 2 - u;
    const e = u * u * (3 - 2 * u), A = dugumPos(s, s.dugum[ters ? m.b : m.a], t), Bp = dugumPos(s, s.dugum[ters ? m.a : m.b], t);
    const ee = ters ? 1 - e : e;
    let [ax, ay] = A, [bx, by] = Bp; { const dA = s.dugum[ters ? m.b : m.a], dB = s.dugum[ters ? m.a : m.b], L0 = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L0, uy = (by - ay) / L0; if (dA.p && !dA.ist) { ax += ux * dA.p.r * 1.15; ay += uy * dA.p.r * 1.15; } if (dB.p && !dB.ist) { bx -= ux * dB.p.r * 1.15; by -= uy * dB.p.r * 1.15; } }
    const dx = bx - ax, dy = by - ay, L2 = Math.hypot(dx, dy) || 1, nx = -dy / L2 * m.yan, ny = dx / L2 * m.yan;
    const pos = k => { const b = Math.sin(Math.PI * k) * L2 * 0.12; return [ax + dx * k + nx * b, ay + dy * k + ny * b]; };
    const [x, y] = pos(ee), [x2, y2] = pos(ters ? Math.min(1, ee + 0.012) : Math.max(0, ee - 0.012));
    const [X, Y] = W2S(x, y); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue;
    const [X2, Y2] = W2S(x2, y2);
    ctx.globalCompositeOperation = 'lighter';
    const ux = X - X2, uy = Y - Y2, ul = Math.hypot(ux, uy) || 1, iz = Math.min(26, ul * 2.2 + 4);
    ctx.strokeStyle = 'rgba(120,200,255,.3)'; ctx.lineWidth = Math.max(1, Math.min(2.5, 2 * z)); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X - ux / ul * iz, Y - uy / ul * iz); ctx.stroke();
    ctx.fillStyle = 'rgba(230,245,255,.95)'; ctx.beginPath(); ctx.arc(X, Y, Math.max(1.1, Math.min(2.6, 2.2 * z)), 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* ================= gerçekçi çizim: ışık, gemi sprite'ları, kaya, sarsıntı ================= */
let AZ_HAREKET = (() => { const v = ls.get('kozmos-azh', null); return typeof v === 'boolean' ? v : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); })();
const GISIK = { a: 0, k: 0.5, c: '255,240,220' }; let SARS = 0;
function isikGuncelle() {
  const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK); let en = null, ed = Infinity;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tm = temel(sx + i, sy + j); if (!tm) continue; const d = Math.hypot(tm.x - SH.x, tm.y - SH.y); if (d < ed) { ed = d; en = tm; } }
  if (!en) { GISIK.k += (0.22 - GISIK.k) * 0.05; return; }
  const a = Math.atan2(en.y - SH.y, en.x - SH.x), Y_ = YT[en.yt]; let da = a - GISIK.a; da = Math.atan2(Math.sin(da), Math.cos(da)); GISIK.a += da * 0.2;
  const k = kis(1.25 - ed / (SEK * 1.1), 0.22, 1); GISIK.k += (k - GISIK.k) * 0.05; GISIK.c = Y_.kd ? '255,190,140' : Y_.g;
}
const TEMA = {
  oyuncu: { a: '#B9C3D4', b: '#F2F6FC', c: '#4E5A72', p: 'rgba(16,24,40,.38)', cam: ['#D8FBFF', '#1D6FA8'], m: '127,227,255' },
  diger: { a: '#A3C4B6', b: '#E6F8EE', c: '#43625A', p: 'rgba(10,30,24,.38)', cam: ['#E0FFF0', '#1A7A5A'], m: '150,255,200' },
  korsan: { a: '#7A3034', b: '#B05A54', c: '#26090D', p: 'rgba(0,0,0,.45)', cam: ['#FFC0B0', '#7A1020'], m: '255,110,80' },
  golge: { a: '#3E2766', b: '#6A48A2', c: '#12081F', p: 'rgba(0,0,0,.45)', cam: ['#ECD8FF', '#5A2AA0'], m: '190,150,255' },
  ist: { a: '#1F4E33', b: '#3E8458', c: '#081A0F', p: 'rgba(0,0,0,.45)', cam: ['#D0FFE0', '#1A7A3A'], m: '130,255,170' },
  dost: { a: '#2E4E78', b: '#6A92C2', c: '#0C1A30', p: 'rgba(0,0,0,.4)', cam: ['#D8F0FF', '#1D5FA8'], m: '127,227,255' },
  kervan: { a: '#7E6844', b: '#C4A672', c: '#33281A', p: 'rgba(0,0,0,.38)', cam: ['#FFF0C0', '#8A6A20'], m: '255,210,140' },
  hurda: { a: '#6E747F', b: '#A8AEB8', c: '#2A2E36', p: 'rgba(0,0,0,.4)', cam: ['#C8D0DA', '#3A4250'], m: '255,140,90' },
};
const MOTOR = { velk: [[-14, -1.5], [-14, 1.5]], kraik: [[-20, -5], [-20, 5]], oruk: [[-18, -3], [-18, 3]], kasif: [[-13, -4], [-13, 4]], yuk: [[-17, -5.5], [-17, 0], [-17, 5.5]], avci: [[-14, -2.4], [-14, 2.4]], zirh: [[-16, -4], [-16, 4]], golge: [[-18, -2.5], [-18, 2.5]], umut: [[-16, -3.5], [-16, 3.5]], kapsul: [[-9, 0]], korsan: [[-12, 0]] };
const GEMSPR = new Map(), SS = 4;
function gemiSprite(tip, renk, tema) {
  const key = tip + '|' + renk + '|' + tema; let o = GEMSPR.get(key); if (o) return o;
  const GV = GOVDE[tip] || GOVDE.kasif, TM = TEMA[tema] || TEMA.oyuncu, xs = GV.p.map(q => q[0]), ys = GV.p.map(q => q[1]);
  const x0 = Math.min(...xs) - 5, x1 = Math.max(...xs) + 4, y0 = Math.min(...ys) - 4, y1 = Math.max(...ys) + 4, mx = Math.max(...xs), my = Math.max(...ys);
  const c = document.createElement('canvas'); c.width = Math.ceil((x1 - x0) * SS); c.height = Math.ceil((y1 - y0) * SS);
  const g = c.getContext('2d'); g.scale(SS, SS); g.translate(-x0, -y0);
  const yol = (k = 1) => { g.beginPath(); GV.p.forEach(([x, y], i) => i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k)); g.closePath(); };
  // gövde hacmi
  let gr = g.createLinearGradient(0, -my, 0, my); gr.addColorStop(0, TM.c); gr.addColorStop(0.28, TM.a); gr.addColorStop(0.5, TM.b); gr.addColorStop(0.72, TM.a); gr.addColorStop(1, TM.c);
  yol(); g.fillStyle = gr; g.fill();
  g.save(); yol(); g.clip();
  const r = rng(h32(tip.length * 7 + renk, tema.length, 9191));
  // kanat plakaları daha koyu
  g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x0, 7.5, x1 - x0, 40); g.fillRect(x0, -47.5, x1 - x0, 40);
  // burun ve kuyruk tonları
  gr = g.createLinearGradient(mx, 0, x0, 0); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  // aşınma lekeleri
  for (let i = 0; i < 260; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), w = 0.3 + r() * 1.6, h = 0.2 + r() * 0.6; g.fillStyle = r() < 0.7 ? `rgba(0,0,0,${(0.05 + r() * 0.09).toFixed(3)})` : `rgba(255,255,255,${(0.04 + r() * 0.06).toFixed(3)})`; g.fillRect(x, y, w, h); }
  // panel çizgileri
  g.strokeStyle = TM.p; g.lineWidth = 0.22;
  for (let x = mx - 5; x > x0; x -= 4.2 + r() * 1.6) { g.beginPath(); g.moveTo(x, -my); g.lineTo(x, my); g.stroke(); }
  g.beginPath(); g.moveTo(x0, 0); g.lineTo(mx * 0.55, 0); g.stroke();
  for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(x0, sgn * 4.2); g.lineTo(mx * 0.7, sgn * 2.4); g.stroke(); g.beginPath(); g.moveTo(x0, sgn * 9.5); g.lineTo(mx * 0.2, sgn * 6.5); g.stroke(); }
  g.lineWidth = 0.35; g.strokeStyle = 'rgba(0,0,0,.28)'; yol(0.8); g.stroke();
  // perçin ve kapaklar
  for (let i = 0; i < 26; i++) { const p0 = GV.p[(r() * GV.p.length) | 0], f = 0.55 + r() * 0.35; g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(p0[0] * f, p0[1] * f, 0.22, 0, TAU); g.fill(); }
  for (const sgn of [-1, 1]) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-6, sgn * 3 - 0.9, 3.2, 1.8); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-6, sgn * 3 - 0.9, 3.2, 0.35); }
  // havalandırma ızgarası
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(0,0,0,.42)'; g.fillRect(x0 + 6 + i * 1.6, -1.4, 0.8, 2.8); }
  g.restore();
  // renk şeritleri
  if (GV.s.length) { g.lineCap = 'round'; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2.2; g.beginPath(); for (const [a, b, cc, d] of GV.s) { g.moveTo(a + 0.25, b + 0.3); g.lineTo(cc + 0.25, d + 0.3); } g.stroke(); g.strokeStyle = tema === 'oyuncu' || tema === 'diger' ? RENK[renk] || '#FFC857' : TM.b; g.lineWidth = 1.6; g.beginPath(); for (const [a, b, cc, d] of GV.s) { g.moveTo(a, b); g.lineTo(cc, d); } g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.4; g.beginPath(); for (const [a, b, cc, d] of GV.s) { g.moveTo(a - 0.2, b - 0.4); g.lineTo(cc - 0.2, d - 0.4); } g.stroke(); }
  // kenarlar
  yol(); g.strokeStyle = '#0E131F'; g.lineWidth = 0.9; g.stroke();
  g.save(); yol(); g.clip(); yol(0.95); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 0.5; g.stroke(); g.restore();
  // motor çanları
  for (const [ex, ey] of (MOTOR[tip] || MOTOR.kasif)) { gr = g.createLinearGradient(ex - 2, 0, ex + 2, 0); gr.addColorStop(0, '#0B0E16'); gr.addColorStop(1, '#3A4254'); g.fillStyle = gr; g.beginPath(); g.moveTo(ex + 1.6, ey - 1.7); g.lineTo(ex - 1.8, ey - 2.4); g.lineTo(ex - 1.8, ey + 2.4); g.lineTo(ex + 1.6, ey + 1.7); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 0.3; g.stroke(); g.fillStyle = `rgba(${TM.m},.35)`; g.fillRect(ex - 1.9, ey - 1.6, 0.6, 3.2); }
  // kokpit camı
  if (tip === 'kapsul') { gr = g.createRadialGradient(3.5, -1, 0.3, 2.5, 0, 3.2); gr.addColorStop(0, TM.cam[0]); gr.addColorStop(1, TM.cam[1]); g.fillStyle = gr; g.beginPath(); g.arc(2.5, 0, 3, 0, TAU); g.fill(); g.strokeStyle = '#0E131F'; g.lineWidth = 0.5; g.stroke(); }
  else { const cx = mx * 0.42, rx = Math.max(3.2, mx * 0.2), ry = tip === 'yuk' ? 4 : tip === 'zirh' ? 3.4 : 2.5; gr = g.createLinearGradient(cx + rx, -ry, cx - rx, ry); gr.addColorStop(0, TM.cam[0]); gr.addColorStop(0.45, TM.cam[1]); gr.addColorStop(1, '#061020'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, 0, rx, ry, 0, 0, TAU); g.fill(); g.strokeStyle = '#0B101C'; g.lineWidth = 0.55; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 0.35; g.beginPath(); g.ellipse(cx + rx * 0.15, -ry * 0.1, rx * 0.7, ry * 0.55, 0, -2.4, -1.2); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 0.25; g.beginPath(); g.moveTo(cx - rx * 0.2, -ry); g.lineTo(cx - rx * 0.2, ry); g.stroke(); }
  o = { c, x0, y0, GV, R: Math.max(mx, my, -x0) + 2 }; GEMSPR.set(key, o); return o;
}
function itkiCiz(tip, TM, itki, warp, t, olcek, izr) {
  const L0 = MOTOR[tip] || MOTOR.kasif, f = 0.86 + Math.random() * 0.28, renk = warp > 0.2 ? '200,160,255' : (izr || TM.m);
  ctx.globalCompositeOperation = 'lighter';
  for (const [ex, ey] of L0) {
    const x = ex - 1.8, gl = ctx.createRadialGradient(x, ey, 0, x, ey, 5 + itki * 7); gl.addColorStop(0, `rgba(${renk},${(0.35 + itki * 0.45).toFixed(2)})`); gl.addColorStop(1, `rgba(${renk},0)`); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, ey, 5 + itki * 7, 0, TAU); ctx.fill();
    if (itki < 0.03) continue;
    const Lf = (10 + itki * 28 + warp * 46) * f * olcek, w = 2.4 * (0.8 + itki * 0.4);
    let g = ctx.createLinearGradient(x, 0, x - Lf, 0); g.addColorStop(0, `rgba(${renk},.75)`); g.addColorStop(0.5, `rgba(${renk},.3)`); g.addColorStop(1, `rgba(${renk},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, ey - w); ctx.quadraticCurveTo(x - Lf * 0.45, ey - w * 1.25, x - Lf, ey); ctx.quadraticCurveTo(x - Lf * 0.45, ey + w * 1.25, x, ey + w); ctx.fill();
    g = ctx.createLinearGradient(x, 0, x - Lf * 0.45, 0); g.addColorStop(0, 'rgba(255,255,255,.98)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, ey - w * 0.45); ctx.quadraticCurveTo(x - Lf * 0.25, ey - w * 0.3, x - Lf * 0.45, ey); ctx.quadraticCurveTo(x - Lf * 0.25, ey + w * 0.3, x, ey + w * 0.45); ctx.fill();
    if (itki > 0.6) for (let k = 1; k <= 3; k++) { const dx = x - Lf * 0.12 * k; ctx.fillStyle = `rgba(255,255,255,${(0.5 / k).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(dx, ey, 1.3, w * 0.35, 0, 0, TAU); ctx.fill(); }
  }
  ctx.globalCompositeOperation = 'source-over';
}
function gemiCizGenel(X, Y, a, sc, tip, renk, tema, o) {
  o = o || {}; const sp = gemiSprite(tip, renk, tema), TM = TEMA[tema] || TEMA.oyuncu, GV = sp.GV;
  ctx.save(); ctx.translate(X, Y); ctx.rotate(a); ctx.scale(sc, sc);
  itkiCiz(tip, TM, o.itki || 0, o.warp || 0, o.t || 0, o.olcek || 1, o.iz);
  ctx.drawImage(sp.c, sp.x0, sp.y0, sp.c.width / SS, sp.c.height / SS);
  // dinamik ışık: yıldız yönü
  const la = GISIK.a - a, lx = Math.cos(la), ly = Math.sin(la), R = sp.R, k = GISIK.k;
  ctx.save(); ctx.beginPath(); GV.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  let g = ctx.createLinearGradient(lx * R, ly * R, -lx * R, -ly * R); g.addColorStop(0, 'rgba(0,0,8,0)'); g.addColorStop(0.42, 'rgba(0,0,8,0)'); g.addColorStop(0.7, `rgba(0,2,12,${(0.32 + 0.22 * k).toFixed(2)})`); g.addColorStop(1, `rgba(0,2,12,${(0.55 + 0.25 * k).toFixed(2)})`);
  ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.globalCompositeOperation = 'lighter'; g = ctx.createLinearGradient(lx * R, ly * R, 0, 0); g.addColorStop(0, `rgba(${GISIK.c},${(0.38 * k).toFixed(2)})`); g.addColorStop(0.55, `rgba(${GISIK.c},${(0.08 * k).toFixed(2)})`); g.addColorStop(1, `rgba(${GISIK.c},0)`); ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.restore();
  // kenar ışığı
  ctx.globalCompositeOperation = 'lighter'; g = ctx.createLinearGradient(lx * R, ly * R, -lx * R * 0.2, -ly * R * 0.2); g.addColorStop(0, `rgba(${GISIK.c},${(0.75 * k).toFixed(2)})`); g.addColorStop(1, `rgba(${GISIK.c},0)`); ctx.strokeStyle = g; ctx.lineWidth = 0.8; ctx.beginPath(); GV.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke();
  // seyir ışıkları
  if (o.nav) { const t = o.t || 0, my = Math.max(...GV.p.map(q => q[1])), wx = (GV.p.find(q => q[1] === my) || [0])[0], yan = Math.sin(t * 4) > 0.25, flas = (t % 1.6) < 0.08 || ((t % 1.6) > 0.18 && (t % 1.6) < 0.26);
    const isik = (x, y, c, r) => { const gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(${c},.95)`); gg.addColorStop(0.25, `rgba(${c},.5)`); gg.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
    if (yan) { isik(wx + 1, -my + 0.8, '255,70,80', 5); isik(wx + 1, my - 0.8, '70,255,140', 5); }
    if (flas) isik(Math.min(...GV.p.map(q => q[0])) + 1, 0, '255,255,255', 9);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (o.hasar > 0.03) { ctx.globalCompositeOperation = 'lighter'; const r0 = R * 1.25, gg = ctx.createRadialGradient(0, 0, r0 * 0.6, 0, 0, r0); gg.addColorStop(0, 'rgba(120,220,255,0)'); gg.addColorStop(0.85, `rgba(120,220,255,${(o.hasar * 0.45).toFixed(2)})`); gg.addColorStop(1, 'rgba(120,220,255,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(0, 0, r0, r0 * 0.8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = `rgba(190,240,255,${(o.hasar * 0.5).toFixed(2)})`; ctx.lineWidth = 0.6; for (let i = 0; i < 6; i++) { const aa = i * TAU / 6 + (o.t || 0); ctx.beginPath(); ctx.arc(0, 0, r0 * 0.92, aa, aa + 0.5); ctx.stroke(); } ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(0.35, o.hasar * 0.35); ctx.fillStyle = '#FF3B4E'; ctx.beginPath(); GV.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}
/* manevra iticileri */
const RCS = []; let rcsSonA = 0;
function rcsAdim(dt) {
  if (!oyunda || dt <= 0) return; let da = SH.a - rcsSonA; da = Math.atan2(Math.sin(da), Math.cos(da)); rcsSonA = SH.a; const w = da / dt, v = Math.hypot(SH.vx, SH.vy);
  const GV = kapsul ? GOVDE.kapsul : GOVDE[gemiTip] || GOVDE.kasif, mx = Math.max(...GV.p.map(q => q[0])), c = Math.cos(SH.a), sn = Math.sin(SH.a), dun = (lx, ly) => [SH.x + lx * c - ly * sn, SH.y + lx * sn + ly * c], yon = (lx, ly) => [lx * c - ly * sn, lx * sn + ly * c];
  const puf = (lx, ly, dx, dy) => { if (RCS.length > 60) return; const [x, y] = dun(lx, ly), [vx, vy] = yon(dx, dy); RCS.push({ x, y, vx: vx * 120 + SH.vx, vy: vy * 120 + SH.vy, o: 0, w: 0.2 + Math.random() * 0.1 }); };
  if (Math.abs(w) > 0.9 && Math.random() < 0.3) { const sg = Math.sign(w); puf(mx * 0.62, -sg * 3, 0, -sg); puf(-mx * 0.4, sg * 4, 0, sg); }
  if (fren && v > 60 && Math.random() < 0.35) { puf(mx * 0.8, -2, 1, -0.2); puf(mx * 0.8, 2, 1, 0.2); }
  for (let i = RCS.length - 1; i >= 0; i--) { const q = RCS[i]; q.o += dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.o > q.w) RCS.splice(i, 1); }
}
function rcsCiz() {
  ctx.globalCompositeOperation = 'lighter';
  for (const q of RCS) { const [X, Y] = W2S(q.x, q.y), k = 1 - q.o / q.w, r = Math.max(1, (1.5 + q.o * 14) * Math.max(cam.z, 0.5)), g = ctx.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(235,245,255,${(0.55 * k).toFixed(2)})`); g.addColorStop(1, 'rgba(235,245,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
}
/* kaya sprite'ları (ışık +x yönünden) */
const KAYA = [];
function kayaKur() {
  for (let n = 0; n < 8; n++) {
    const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), r = rng(7000 + n * 13), m = 9 + ((r() * 6) | 0), P = [];
    for (let i = 0; i < m; i++) { const a = i / m * TAU, rr = S * 0.42 * (0.68 + r() * 0.32); P.push([S / 2 + Math.cos(a) * rr, S / 2 + Math.sin(a) * rr * (0.75 + r() * 0.25)]); }
    const yol = () => { g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    const ton = 0.8 + r() * 0.4, gr = g.createLinearGradient(S, S / 2, 0, S / 2); gr.addColorStop(0, `rgb(${(190 * ton) | 0},${(180 * ton) | 0},${(165 * ton) | 0})`); gr.addColorStop(0.45, `rgb(${(110 * ton) | 0},${(102 * ton) | 0},${(92 * ton) | 0})`); gr.addColorStop(1, '#141210');
    yol(); g.fillStyle = gr; g.fill(); g.save(); yol(); g.clip();
    for (let i = 0; i < 9; i++) { const x = S * 0.2 + r() * S * 0.6, y = S * 0.2 + r() * S * 0.6, rr = 2 + r() * 6; g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,240,220,.18)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, rr, -1.2, 1.2); g.stroke(); }
    for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.06)'; g.fillRect(r() * S, r() * S, 1.5, 1.5); }
    g.restore(); KAYA.push(c);
  }
}
/* Samanyolu şeridi */
let SAMAN = null;
function samanKur() {
  const Wd = 2048, Hd = 560, c = document.createElement('canvas'); c.width = Wd; c.height = Hd; const g = c.getContext('2d'), r = rng(4242), orta = x => Hd / 2 + Math.sin(x / Wd * TAU) * 40 + Math.sin(x / Wd * TAU * 3 + 1) * 18;
  const kopya = (x, f) => { for (const dx of [-Wd, 0, Wd]) f(x + dx); };
  for (let i = 0; i < 220; i++) { const x = r() * Wd, y = orta(x) + (r() - 0.5) * (r() * 200), rr = 40 + r() * 150, renk = r() < 0.5 ? '255,220,190' : r() < 0.5 ? '190,205,255' : '230,200,255'; kopya(x, X => { const gr = g.createRadialGradient(X, y, 0, X, y, rr); gr.addColorStop(0, `rgba(${renk},${(0.05 + r() * 0.05).toFixed(3)})`); gr.addColorStop(1, `rgba(${renk},0)`); g.fillStyle = gr; g.fillRect(X - rr, y - rr, rr * 2, rr * 2); }); }
  for (let i = 0; i < 5200; i++) { const x = r() * Wd, sap = (r() + r() + r() - 1.5) * 150, y = orta(x) + sap, b = 0.25 + r() * 0.6, sz = r() < 0.04 ? 1.6 : 0.9; g.fillStyle = `rgba(${r() < 0.3 ? '255,225,200' : '220,230,255'},${b.toFixed(2)})`; g.fillRect(x, y, sz, sz); }
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 160; i++) { const x = r() * Wd, y = orta(x) + (r() - 0.5) * 50 + Math.sin(x / 120) * 14, rr = 14 + r() * 46; kopya(x, X => { const gr = g.createRadialGradient(X, y, 0, X, y, rr); gr.addColorStop(0, `rgba(0,0,0,${(0.18 + r() * 0.2).toFixed(2)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - rr, y - rr, rr * 2, rr * 2); }); }
  g.globalCompositeOperation = 'destination-in'; const fm = g.createLinearGradient(0, 0, 0, Hd); fm.addColorStop(0, 'rgba(0,0,0,0)'); fm.addColorStop(0.3, 'rgba(0,0,0,1)'); fm.addColorStop(0.7, 'rgba(0,0,0,1)'); fm.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fm; g.fillRect(0, 0, Wd, Hd);
  SAMAN = c;
}
function samanCiz() {
  if (!SAMAN) samanKur(); const ang = -0.42, L0 = Math.hypot(W, H) * 1.25, sk = L0 / SAMAN.width * 1.6, u = ((bg.x * Math.cos(ang) + bg.y * Math.sin(ang)) * 0.006) % (SAMAN.width * sk), v = (-bg.x * Math.sin(ang) + bg.y * Math.cos(ang)) * 0.006;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5;
  const w = SAMAN.width * sk, h = SAMAN.height * sk, gor = Math.hypot(W, H) * 0.6; for (let k = -2; k <= 1; k++) { const x0 = -u + k * w; if (x0 > gor || x0 + w < -gor) continue; ctx.drawImage(SAMAN, x0, -h / 2 - v + H * 0.05, w, h); }
  ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
/* lens parlaması */
let FLARE = null;
function flareCiz() {
  const F = FLARE; FLARE = null; if (!F || F.R < 3) return; const cx = W / 2, cy = H / 2, dx = cx - F.X, dy = cy - F.Y, guc = kis(F.R / 40, 0.15, 1) * kis(1 - Math.hypot(dx, dy) / Math.hypot(W, H), 0.2, 1);
  ctx.globalCompositeOperation = 'lighter';
  const gh = [[0.35, 0.5, F.g, 0.06], [0.7, 0.2, '160,200,255', 0.08], [1.0, 0.35, '190,255,210', 0.04], [1.35, 0.8, F.g, 0.03], [1.8, 0.28, '210,170,255', 0.06]];
  for (const [k, s0, c, al] of gh) { const x = F.X + dx * k, y = F.Y + dy * k, r = Math.max(8, Math.min(140, F.R * 2.2 * s0 + 18 * s0)), g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r); g.addColorStop(0, `rgba(${c},${(al * guc * 0.6).toFixed(3)})`); g.addColorStop(0.8, `rgba(${c},${(al * guc).toFixed(3)})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
}
const DUMAN = [];
function gemiCiz(t) {
  const [X, Y] = W2S(SH.x, SH.y), s = Math.max(cam.z, 0.62);
  // egzoz
  ctx.globalCompositeOperation = 'lighter';
  for (const p of PAR) {
    const [px, py] = W2S(p.x, p.y), k = 1 - p.o / p.w, r = Math.max(0.8, p.s * k * Math.max(cam.z, 0.35));
    ctx.fillStyle = p.wp ? `rgba(190,150,255,${(k * 0.5).toFixed(2)})` : `rgba(${(120 + 135 * k) | 0},${(190 + 50 * k) | 0},255,${(k * 0.55).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  rcsCiz();
  gemiCizGenel(X, Y, SH.a, s, kapsul ? 'kapsul' : gemiTip, gemiRenk, 'oyuncu', { itki: SH.itki, warp: SH.warp, t, nav: !kapsul, hasar: hasarFlas, iz: IZR[KOZM.sec.iz] });
  if (oyunda && !kapsul && can < maxCan() * 0.6) govdeCatlak(X, Y, SH.a, s, can / maxCan(), t);
  if (!kapsul) { desenCiz(ctx, X, Y, SH.a, s, t); modCiz(ctx, X, Y, SH.a, s, gemiTip, t); }
}

function tozCiz() {
  const svx = SH.vx * cam.z, svy = SH.vy * cam.z, sv = Math.hypot(svx, svy);
  ctx.lineCap = 'round';
  for (const d of TOZ) {
    const x = d.x - 30, y = d.y - 30, a = Math.min(0.55, 0.12 + sv / 2500) * (d.d / 1.8);
    if (sv < 40) { ctx.fillStyle = `rgba(200,215,255,${(0.22 * d.d / 1.8).toFixed(2)})`; ctx.fillRect(x, y, 1.2, 1.2); continue; }
    const k = Math.min(0.045 * d.d * (1 + SH.warp * 3), 420 / sv);
    ctx.strokeStyle = SH.warp > 0.2 ? `rgba(215,195,255,${a.toFixed(2)})` : `rgba(200,220,255,${a.toFixed(2)})`; ctx.lineWidth = d.d * 0.9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + svx * k, y + svy * k); ctx.stroke();
  }
  if (SH.warp > 0.25) {
    const w = SH.warp, ang = Math.atan2(SH.vy, SH.vx), dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, D = Math.hypot(W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 55 * w; i++) {
      const o = (Math.random() - 0.5) * D, k = (Math.random() - 0.5) * D, l = 80 + Math.random() * 380 * w, x = W / 2 + nx * o + dx * k, y = H / 2 + ny * o + dy * k;
      ctx.strokeStyle = `rgba(${Math.random() < 0.5 ? '190,165,255' : '170,220,255'},${(0.08 + Math.random() * 0.22 * w).toFixed(2)})`; ctx.lineWidth = 0.8 + Math.random() * 1.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dx * l, y - dy * l); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

function okCiz(X, Y, a, boy, renk) { ctx.save(); ctx.translate(X, Y); ctx.rotate(a); ctx.fillStyle = renk; ctx.beginPath(); ctx.moveTo(boy, 0); ctx.lineTo(-boy * 0.6, -boy * 0.65); ctx.lineTo(-boy * 0.25, 0); ctx.lineTo(-boy * 0.6, boy * 0.65); ctx.closePath(); ctx.fill(); ctx.restore(); }
function yonCiz() {
  if (!oyunda) return;
  const [X, Y] = W2S(SH.x, SH.y);
  ctx.font = '800 10.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
  let ilkBilinmeyen = true;
  for (const r of (firtina > 0 || nebSon || iyonIc ? [] : radar)) {
    const tm = r.tm, [sx, sy] = W2S(tm.x, tm.y); if (sx > 20 && sx < W - 20 && sy > 60 && sy < H - 20) continue;
    const a = Math.atan2(tm.y - SH.y, tm.x - SH.x), bil = KESIF.has('s:' + tm.k), kol = bil && tm.tam && tm.tam.gez.some(p => p.kol && KESIF.has('k:' + p.id));
    const renk = kol ? 'rgba(255,200,87,.85)' : bil ? 'rgba(190,200,230,.45)' : 'rgba(127,227,255,.9)';
    const R = 74 + Math.min(26, r.d / 3000);
    okCiz(X + Math.cos(a) * R, Y + Math.sin(a) * R, a, 6, renk);
    if (!bil && ilkBilinmeyen) { ilkBilinmeyen = false; ctx.fillStyle = 'rgba(127,227,255,.8)'; ctx.fillText(mesafeYaz(r.d), X + Math.cos(a) * (R + 20), Y + Math.sin(a) * (R + 20) + 4); }
  }
  // görev hedefleri
  for (const g of GOREV) {
    const h = gorevHedef(g); if (!h) continue; const [tx, ty] = otoPos(h, simT()), [gx, gy] = W2S(tx, ty), em = gEm(g);
    ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
    if (gx > 20 && gx < W - 20 && gy > 60 && gy < H - 20) { ctx.strokeStyle = 'rgba(255,170,80,.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(gx, gy, Math.max(16, (h.p ? h.p.r : 60) * cam.z + 12), 0, TAU); ctx.stroke(); ctx.fillStyle = '#FFD2A0'; ctx.fillText(em, gx, gy - Math.max(16, (h.p ? h.p.r : 60) * cam.z + 12) - 6); }
    else { const a = Math.atan2(ty - SH.y, tx - SH.x), R = 108; okCiz(X + Math.cos(a) * R, Y + Math.sin(a) * R, a, 7, 'rgba(255,170,80,.95)'); ctx.fillText(em, X + Math.cos(a) * (R + 16), Y + Math.sin(a) * (R + 16) + 4); }
  }
  // otopilot hedefi
  if (oto) {
    const [tx, ty, dur] = otoPos(oto, simT()), [OX, OY] = W2S(tx, ty), d = Math.max(0, Math.hypot(tx - SH.x, ty - SH.y) - dur);
    ctx.save(); ctx.strokeStyle = 'rgba(127,227,255,.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 7]); ctx.lineDashOffset = -performance.now() / 40;
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(OX, OY); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
    if (OX > 20 && OX < W - 20 && OY > 60 && OY < H - 20) {
      const rr = Math.max(14, dur * cam.z * (oto.p || oto.tm ? 1 : 0) + 10) + Math.sin(performance.now() / 250) * 3;
      ctx.strokeStyle = 'rgba(127,227,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(OX, OY, rr, 0, TAU); ctx.stroke();
      if (!oto.p && !oto.tm) { ctx.beginPath(); ctx.moveTo(OX - 6, OY); ctx.lineTo(OX + 6, OY); ctx.moveTo(OX, OY - 6); ctx.lineTo(OX, OY + 6); ctx.stroke(); }
      ctx.fillStyle = '#BFF2FF'; ctx.fillText('🤖 ' + (oto.ad || mesafeYaz(d)), OX, OY - rr - 8);
    } else {
      const a = Math.atan2(OY - H / 2, OX - W / 2), dx = Math.cos(a), dy = Math.sin(a), m = 40, k = Math.min(Math.abs((W / 2 - m) / (dx || 1e-6)), Math.abs((H / 2 - m - 26) / (dy || 1e-6)));
      const ex = W / 2 + dx * k, ey = H / 2 + dy * k + 13; okCiz(ex, ey, a, 12, 'rgba(127,227,255,.95)');
      ctx.fillStyle = '#BFF2FF'; ctx.fillText('🤖 ' + (oto.ad || '') + ' ' + mesafeYaz(d), kis(ex - dx * 40, 110, W - 110), kis(ey - dy * 34, 70, H - 20));
    }
    ctx.restore();
  }
  // rota oku (otopilot aynı yere gidiyorsa tekrar çizme)
  if (wp && !(oto && Math.hypot(otoPos(oto, simT())[0] - wp.x, otoPos(oto, simT())[1] - wp.y) < 6000)) {
    const [wx, wy] = W2S(wp.x, wp.y), d = Math.hypot(wp.x - SH.x, wp.y - SH.y), a = Math.atan2(wp.y - SH.y, wp.x - SH.x);
    ctx.font = '900 12px Nunito, system-ui, sans-serif';
    if (wx > 30 && wx < W - 30 && wy > 70 && wy < H - 30) {
      ctx.strokeStyle = 'rgba(180,140,255,.8)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(wx, wy, 26 + Math.sin(performance.now() / 300) * 3, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#D8C6FF'; ctx.fillText('🏁 ' + wp.ad, wx, wy - 36);
    } else {
      const m = 40, cx = W / 2, cy = H / 2, dx = Math.cos(a), dy = Math.sin(a);
      const k = Math.min(Math.abs((W / 2 - m) / (dx || 1e-6)), Math.abs((H / 2 - m - 26) / (dy || 1e-6)));
      const ex = cx + dx * k, ey = cy + dy * k + 13;
      okCiz(ex, ey, a, 13, 'rgba(180,140,255,.95)');
      const lx = kis(ex - dx * 34, 90, W - 90), ly = kis(ey - dy * 34, 70, H - 30); ctx.fillStyle = '#E3D8FF'; ctx.fillText('🏁 ' + wp.ad, lx, ly - 6); ctx.fillStyle = 'rgba(216,198,255,.85)'; ctx.fillText(mesafeYaz(d), lx, ly + 9);
    }
  }
}

/* gemi yanı düğmeleri gemiyi izler ama alttaki göstergenin, mini haritanın ve kontrol düğmelerinin üstüne inmez */
let gpAltT = 0, gpAlt = 1e9;
function gpKonum() {
  const g = $('gp'); if (!g.firstChild) return; const [X, Y] = W2S(SH.x, SH.y), s = Math.max(cam.z, 0.62), n = performance.now();
  if (n - gpAltT > 500) { gpAltT = n; gpAlt = H - 60; const gw = g.offsetWidth || 200, x0 = kis(X, 120, W - 120) - gw / 2, x1 = x0 + gw; for (const id of ['gosterge', 'mini', 'kont', 'joy', 'yakin']) { const e = $(id); if (!e || e.hidden || !e.getClientRects().length) continue; const r = e.getBoundingClientRect(); if (r.width > 4 && r.right > x0 && r.left < x1 && r.top > H * 0.45) gpAlt = Math.min(gpAlt, r.top - 8 - (g.offsetHeight || 40)); } }
  g.style.transform = `translate(${Math.round(kis(X, 120, W - 120))}px,${Math.round(kis(Y + 30 * s + 14, 70, Math.max(70, gpAlt)))}px) translateX(-50%)`;
}
function ciz(t) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  if (kokGor && oyunda && !HM.acik && !fotoMod) { fpCiz(t); ustCiz(t); return; }
  const sars = AZ_HAREKET || fotoMod ? 0 : SARS * SARS * 12, sxo = sars ? (Math.random() - 0.5) * sars / cam.z : 0, syo = sars ? (Math.random() - 0.5) * sars / cam.z : 0; cam.x += sxo; cam.y += syo;
  arkaPlan(t);
  nebulaCiz(t);
  dunya(t);
  kapiCiz(t);
  balinaCiz(t);
  konvoyCiz(t);
  ekCiz(t);
  tozCiz();
  if (kazP) {
    const [X, Y] = W2S(SH.x, SH.y);
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    if (kazP.nebula) {
      for (let i = 0; i < 14; i++) { const a = Math.random() * TAU, r = 20 + Math.random() * 90, c = kazP.c[i % 2]; ctx.fillStyle = `rgba(${c.join(',')},.7)`; ctx.fillRect(X + Math.cos(a) * r, Y + Math.sin(a) * r, 2, 2); ctx.strokeStyle = `rgba(${c.join(',')},.25)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); ctx.lineTo(X + Math.cos(a) * r * 0.6, Y + Math.sin(a) * r * 0.6); ctx.stroke(); }
    } else {
      const [px, py] = nesnePos(kazP, t), [GX, GY] = W2S(px, py), dx = GX - X, dy = GY - Y, d = Math.hypot(dx, dy) || 1, sr = kazP.r * cam.z;
      const ex = GX - dx / d * sr * 0.85, ey = GY - dy / d * sr * 0.85, f = 0.6 + Math.random() * 0.4, c = kazP.kuyruk ? '150,220,255' : '255,190,90';
      ctx.strokeStyle = `rgba(${c},${(0.25 * f).toFixed(2)})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = `rgba(255,240,220,${(0.85 * f).toFixed(2)})`; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(ex, ey); ctx.stroke();
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 14); g.addColorStop(0, `rgba(${c},.9)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, 14, 0, TAU); ctx.fill();
      for (let i = 0; i < 5; i++) { const a = Math.random() * TAU, r = Math.random() * 16; ctx.fillStyle = `rgba(${c},.8)`; ctx.fillRect(ex + Math.cos(a) * r, ey + Math.sin(a) * r, 1.6, 1.6); }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  tecCiz(t);
  ortCiz(); mevCiz(t);
  gemiCiz(t);
  fxCiz();
  cam.x -= sxo; cam.y -= syo;
  if (GK().flare) flareCiz(); else FLARE = null;
  gemiEtiket();
  yonCiz();
  if (VIG && GK().vig) ctx.drawImage(VIG, 0, 0, W, H);
  if (SH.warp > 0.05) { ctx.fillStyle = `rgba(90,60,200,${(SH.warp * 0.08).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  ustCiz(t);
  gpKonum();
  kokpitCiz(t);
}

