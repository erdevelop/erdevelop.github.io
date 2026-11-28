/* ================= kuyruklu yıldızlar ve nebulalar ================= */
const KUY = new Map();
function kuyruk(sx, sy) {
  const k = sx + ',' + sy; if (KUY.has(k)) return KUY.get(k);
  const tm = temel(sx, sy); let c = null;
  if (tm && !YT[tm.yt].kd) { const r = rng(h32(sx, sy, 7171)); if (r() < 0.28) { const a = 3000 + r() * 2600; c = { id: 'c:' + k, kuyruk: true, tip: 'kuyruk', tm, a, e: 0.62 + r() * 0.25, w: r() * TAU, M0: r() * TAU, n: (r() < 0.5 ? 1 : -1) * 2.6 / a, r: 14 + r() * 10, ad: isim(r, 2) }; } }
  if (KUY.size > 4000) KUY.clear(); KUY.set(k, c); return c;
}
function kuyrukPos(c, t) { const M = c.M0 + c.n * t; let E = M; for (let i = 0; i < 6; i++) E = M + c.e * Math.sin(E); const x = c.a * (Math.cos(E) - c.e), y = c.a * Math.sqrt(1 - c.e * c.e) * Math.sin(E), cw = Math.cos(c.w), sw = Math.sin(c.w); return [c.tm.x + x * cw - y * sw, c.tm.y + x * sw + y * cw]; }
function yakinKuyruk(t) { const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const c = kuyruk(ssx + i, ssy + j); if (!c) continue; const [x, y] = kuyrukPos(c, t); if (Math.hypot(x - SH.x, y - SH.y) < 330) return c; } return null; }
const nesnePos = (o, t) => o.kuyruk ? kuyrukPos(o, t) : o.nebula ? [SH.x, SH.y] : gezPos(o, t);
const NBZ = new Map(), NBH = 5;
function nebulaB(cx, cy) {
  const k = cx + ',' + cy; if (NBZ.has(k)) return NBZ.get(k);
  const r = rng(h32(cx, cy, 6262)); let n = null;
  if (r() < 0.17 && !(cx === 0 && cy === 0)) n = { id: 'n:' + k, tip: 'nebula', nebula: true, x: (cx + 0.2 + r() * 0.6) * NBH * SEK, y: (cy + 0.2 + r() * 0.6) * NBH * SEK, R: (1.1 + r() * 1.4) * SEK, c: NTON[(r() * NTON.length) | 0], ad: isim(r, 2), sp: (r() * 6) | 0 };
  if (NBZ.size > 3000) NBZ.clear(); NBZ.set(k, n); return n;
}
function nebulaIc(x, y) { const C = NBH * SEK, cx = Math.floor(x / C), cy = Math.floor(y / C); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const n = nebulaB(cx + i, cy + j); if (n && Math.hypot(x - n.x, y - n.y) < n.R) return n; } return null; }
function nebulaCiz(t) {
  const z = cam.z, C = NBH * SEK, cx = Math.floor(cam.x / C), cy = Math.floor(cam.y / C), vr = Math.hypot(W, H) / 2 / z;
  ctx.globalCompositeOperation = 'lighter';
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const n = nebulaB(cx + i, cy + j); if (!n || Math.hypot(n.x - cam.x, n.y - cam.y) > n.R + vr) continue;
    const [X, Y] = W2S(n.x, n.y), R = n.R * z, a = n.c[0].join(','), b = n.c[1].join(',');
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, `rgba(${a},.2)`); g.addColorStop(0.55, `rgba(${b},.11)`); g.addColorStop(1, `rgba(${b},0)`);
    ctx.fillStyle = g; const x0 = Math.max(0, X - R), y0 = Math.max(0, Y - R); ctx.fillRect(x0, y0, Math.min(W, X + R) - x0, Math.min(H, Y + R) - y0);
    const r = rng(h32(cx + i, cy + j, 8));
    for (let k = 0; k < 6; k++) {
      const aa = r() * TAU, dd = Math.sqrt(r()) * n.R * 0.6, s2 = n.R * (0.5 + r() * 0.6) * z, x = X + Math.cos(aa) * dd * z, y = Y + Math.sin(aa) * dd * z, rot = r() * TAU, sp = NEB[(n.sp + k) % NEB.length];
      if (s2 > 5000 || x + s2 < 0 || x - s2 > W || y + s2 < 0 || y - s2 > H) continue;
      ctx.save(); ctx.globalAlpha = 0.42; ctx.translate(x, y); ctx.rotate(rot + t * 0.004); ctx.drawImage(sp, -s2, -s2, s2 * 2, s2 * 2); ctx.restore();
    }
    if (z < 0.12 && X > -50 && X < W + 50 && Y > -50 && Y < H + 50) { ctx.globalCompositeOperation = 'source-over'; ctx.font = '800 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(${a},.85)`; ctx.fillText('🌫 ' + n.ad, X, Y); ctx.globalCompositeOperation = 'lighter'; }
  }
  ctx.globalCompositeOperation = 'source-over';
}

/* ================= ek çizimler ================= */
function govdeYol(GV, sk) { ctx.beginPath(); GV.p.forEach(([x, y], i) => i ? ctx.lineTo(x * sk, y * sk) : ctx.moveTo(x * sk, y * sk)); ctx.closePath(); }
function ekCiz(t) {
  const z = cam.z, s = Math.max(z, 0.6);
  // kuyruklu yıldızlar
  const vw = W / 2 / z + 6000, vh = H / 2 / z + 6000, sx0 = Math.floor((cam.x - vw) / SEK), sx1 = Math.floor((cam.x + vw) / SEK), sy0 = Math.floor((cam.y - vh) / SEK), sy1 = Math.floor((cam.y + vh) / SEK);
  if ((sx1 - sx0 + 1) * (sy1 - sy0 + 1) < 120) for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) {
    const c = kuyruk(sx, sy); if (!c) continue; const [x, y] = kuyrukPos(c, t), [X, Y] = W2S(x, y);
    const ux = x - c.tm.x, uy = y - c.tm.y, ud = Math.hypot(ux, uy) || 1, dx = ux / ud, dy = uy / ud, Lt = kis(3.2e6 / (ud + 400), 250, 3000) * z, w = Math.max(2.5, c.r * 2 * z);
    if (X + Lt < -50 || X - Lt > W + 50 || Y + Lt < -50 || Y - Lt > H + 50) continue;
    ctx.globalCompositeOperation = 'lighter';
    for (const [aci, gen, renk] of [[0, 3, '200,230,255'], [0.1, 1.4, '140,160,255']]) {
      const ca = Math.cos(aci), sa = Math.sin(aci), ex = dx * ca - dy * sa, ey = dx * sa + dy * ca, tx = X + ex * Lt, ty = Y + ey * Lt;
      const g = ctx.createLinearGradient(X, Y, tx, ty); g.addColorStop(0, `rgba(${renk},.5)`); g.addColorStop(1, `rgba(${renk},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X - ey * w, Y + ex * w); ctx.lineTo(tx - ey * w * gen, ty + ex * w * gen); ctx.lineTo(tx + ey * w * gen, ty - ex * w * gen); ctx.lineTo(X + ey * w, Y - ex * w); ctx.closePath(); ctx.fill();
    }
    const nr = Math.max(3, c.r * z * 2.4), g = ctx.createRadialGradient(X, Y, 0, X, Y, nr); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.4, 'rgba(190,225,255,.6)'); g.addColorStop(1, 'rgba(150,200,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, nr, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    if (z > 0.05 && Math.hypot(x - SH.x, y - SH.y) < 6000) { ctx.font = '800 11.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(190,225,255,.85)'; ctx.fillText('☄ ' + c.ad, X, Y + nr + 14); }
  }
  // karakollar: haritada değil gezegen üstünde (sistemCiz içinde)
  // enkazlar
  for (const o of OLAY) {
    if (o.tip !== 'enkaz') continue; const [X, Y] = W2S(o.x, o.y); if (X < -60 || X > W + 60 || Y < -60 || Y > H + 60) continue;
    ctx.save(); ctx.translate(X, Y); ctx.scale(s, s);
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(o.r0 + t * (0.2 + i * 0.13) * (i % 2 ? 1 : -1)); ctx.translate(Math.cos(i * 1.7) * 14, Math.sin(i * 2.3) * 12); ctx.fillStyle = ['#7E8796', '#5E6674', '#9AA3B2', '#6C5A4E'][i]; ctx.strokeStyle = '#2A2F3A'; ctx.beginPath(); ctx.moveTo(-9, -5); ctx.lineTo(8, -7); ctx.lineTo(10, 4); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    ctx.strokeStyle = `rgba(255,200,87,${(0.4 + 0.3 * Math.sin(t * 3)).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, 34 * s, 0, TAU); ctx.stroke();
    ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE3A6'; ctx.fillText('📦 ' + T('Enkaz', 'Wreck'), X, Y - 40 * s);
  }
  // imdat gemileri ve Umut-7
  for (const g of GOREV) {
    if (g.tip !== 'imdat' && !(g.tip === 'hikaye' && g.a === 4)) continue;
    const umut = g.tip === 'hikaye', [X, Y] = W2S(g.x, g.y), sk = umut ? Math.max(z * 7, 2.2) : s; if (X < -300 || X > W + 300 || Y < -300 || Y > H + 300) continue;
    gemiCizGenel(X, Y, t * (umut ? 0.01 : 0.15), sk, umut ? 'umut' : 'kasif', 5, 'hurda', { t });
    if (Math.sin(t * 5) > 0) { ctx.fillStyle = '#FF4D5E'; ctx.beginPath(); ctx.arc(X, Y, Math.max(2.5, 3 * s), 0, TAU); ctx.fill(); }
    ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = umut ? '#D8C6FF' : '#FFB3A6'; ctx.fillText(umut ? '⭐ Umut-7' : '🆘 ' + g.ad, X, Y - 24 * sk - 6);
  }
  radCiz(t); skCiz(t); izCiz(t); astCiz(t); kasaCiz(t); yarisCiz(t); yanCiz(t); istnCiz(t); lonCiz(t); mezarCiz(t); olay2Ciz(t); hurdaCiz(t); sapanCiz(t); istCiz(t); bankaCiz(t); korsanLimanCiz(t); kervanCiz(s); devriyeCiz(s);
  // diğer oyuncular
  const [GX, GY] = W2S(SH.x, SH.y), simdi = performance.now();
  for (const [id, e] of AG.UZAK) {
    const k = Math.min(1, (simdi - e.t0) / 1300), x = lerp(e.px, e.cx, k), y = lerp(e.py, e.cy, k), a = e.ca, d = Math.hypot(x - SH.x, y - SH.y);
    if (d > SEK * 6) continue; const [X, Y] = W2S(x, y), ad = String(e.v.n || '?').slice(0, 20);
    ctx.font = '800 11.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
    if (X < -30 || X > W + 30 || Y < -30 || Y > H + 30) { const aa = Math.atan2(y - SH.y, x - SH.x), R = 124; okCiz(GX + Math.cos(aa) * R, GY + Math.sin(aa) * R, aa, 7, 'rgba(120,240,160,.95)'); ctx.fillStyle = 'rgba(150,245,180,.9)'; ctx.fillText(ad, GX + Math.cos(aa) * (R + 18), GY + Math.sin(aa) * (R + 18) + 4); continue; }
    const hz = Math.hypot(e.cx - e.px, e.cy - e.py); gemiCizGenel(X, Y, a, s, GOVDE[e.v.g] ? e.v.g : 'kasif', +e.v.c || 0, 'diger', { itki: hz > 40 ? 0.7 : 0.05, t, nav: true });
    ctx.fillStyle = 'rgba(150,245,180,.95)'; ctx.fillText('🛰 ' + ad, X, Y - 26 * s);
    if (e.bub && simdi - e.bub.t < 4000) balonCiz(e.bub.e, X, Y - 26 * s - 26, (simdi - e.bub.t) / 4000);
  }
  { let en = null, ed = Infinity; for (const [, e] of AG.UZAK) { const d = Math.hypot(e.cx - SH.x, e.cy - SH.y); if (d < ed) { ed = d; en = e; } }
    if (en && ed > SEK * 6 && !HM.acik) { const aa = Math.atan2(en.cy - SH.y, en.cx - SH.x), R = 150, X = GX + Math.cos(aa) * R, Y = GY + Math.sin(aa) * R; ctx.globalAlpha = 0.75; okCiz(X, Y, aa, 6, 'rgba(120,240,160,.9)'); ctx.font = '800 10.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(150,245,180,.9)'; { const tx = '🛰 ' + String(en.v.n || '?').slice(0, 14) + ' · ' + mesafeYaz(ed), tw = ctx.measureText(tx).width / 2 + 6; ctx.fillText(tx, Math.max(tw, Math.min(W - tw, X)), Y + (Math.sin(aa) > 0 ? 18 : -12)); } ctx.globalAlpha = 1; } }
  if (benBalon && simdi - benBalon.t < 4000) balonCiz(benBalon.e, GX, GY - 54, (simdi - benBalon.t) / 4000);
  eskCiz(s, t); tehCiz(t);
  // korsanlar
  for (const k of KORS) {
    const [X, Y] = W2S(k.x, k.y);
    if (X < -30 || X > W + 30 || Y < -30 || Y > H + 30) { const a = Math.atan2(k.y - SH.y, k.x - SH.x); okCiz(GX + Math.cos(a) * 92, GY + Math.sin(a) * 92, a, 8, k.golge ? 'rgba(180,140,255,.95)' : 'rgba(255,80,95,.95)'); continue; }
    if (k.kolos) { kolosCiz(k, X, Y, t); continue; }
    if (k.us || k.ana) { devCiz(k, X, Y, t); continue; }
    const kb = k.boss ? 1.9 : 1;
    gemiCizGenel(X, Y, k.a, s * kb, k.golge ? 'golge' : k.boss ? 'avci' : 'korsan', 0, k.ist ? 'ist' : k.golge ? 'golge' : 'korsan', { itki: 0.55 + 0.3 * Math.sin(t * 7 + k.x), t, hasar: k._hf || 0 });
    if (k._hf) k._hf = Math.max(0, k._hf - 0.04);
    if (k.zr || k.sersem > 0) korsanRozet(k, X, Y, s, t);
    if (k.boss) { ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFD98A'; ctx.fillText('👑 ' + k.ad, X, Y - 40 * s); }
    if (k.can < k.max || k.boss) { const w = 34 * s * kb; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(X - w / 2, Y - 26 * s, w, 4); ctx.fillStyle = '#FF5C6E'; ctx.fillRect(X - w / 2, Y - 26 * s, w * Math.max(0, k.can / k.max), 4); }
  }
  // mermiler
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const m of MERMI) { const [X, Y] = W2S(m.x, m.y); if (m.fuze) { if (X > -20 && X < W + 20 && Y > -20 && Y < H + 20) { ctx.fillStyle = 'rgba(255,190,90,.95)'; ctx.beginPath(); ctx.arc(X, Y, 3.2, 0, TAU); ctx.fill(); } continue; } if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; const k = 0.018 * Math.max(z, 0.4); ctx.strokeStyle = m.d ? 'rgba(' + (m.rk || '127,227,255') + ',.95)' : 'rgba(255,110,90,.95)'; ctx.lineWidth = m.kal || 2.2; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X - m.vx * k, Y - m.vy * k); ctx.stroke(); }
  // patlamalar
  ctx.globalCompositeOperation = 'source-over';
  for (const d of DUMAN) { const [X, Y] = W2S(d.x, d.y), k = d.o / d.w, R = d.r * (0.5 + k * 1.6) * Math.max(z, 0.4); if (X < -R || X > W + R || Y < -R || Y > H + R) continue; const g = ctx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, `rgba(${d.c || '70,64,72'},${((d.c ? 0.62 : 0.3) * (1 - k)).toFixed(3)})`); g.addColorStop(1, `rgba(${d.c || '40,36,44'},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.fill(); }
  ctx.globalCompositeOperation = 'lighter';
  for (const p of PATL) {
    const [X, Y] = W2S(p.x, p.y), k = p.o / p.w, R = p.r * (0.3 + k) * Math.max(z, 0.5); if (X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) continue;
    if (k < 0.18) { const fr = p.r * 0.7 * Math.max(z, 0.5) * (1 - k * 3), gf = ctx.createRadialGradient(X, Y, 0, X, Y, fr); gf.addColorStop(0, `rgba(255,255,255,${(1 - k * 5).toFixed(2)})`); gf.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gf; ctx.beginPath(); ctx.arc(X, Y, fr, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = `rgba(${p.c},${(0.45 * (1 - k)).toFixed(2)})`; ctx.lineWidth = Math.max(1, 3 * (1 - k)); ctx.beginPath(); ctx.arc(X, Y, p.r * (0.4 + k * 1.9) * Math.max(z, 0.5), 0, TAU); ctx.stroke();
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, `rgba(255,250,220,${(1 - k).toFixed(2)})`); g.addColorStop(0.4, `rgba(${p.c},${(0.7 * (1 - k)).toFixed(2)})`); g.addColorStop(1, `rgba(${p.c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.fill();
    const sk = Math.max(z, 0.5); ctx.strokeStyle = `rgba(${p.c},${(1 - k).toFixed(2)})`; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath();
    for (const [vx, vy] of p.p) { const o2 = p.o * (1 - p.o * 0.3), o1 = Math.max(0, o2 - 0.05); ctx.moveTo(X + vx * o1 * sk, Y + vy * o1 * sk); ctx.lineTo(X + vx * o2 * sk, Y + vy * o2 * sk); } ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}
function karakolCiz(X, Y, sr, t) {
  if (sr < 3) return; const r = Math.max(4, sr * 0.22), x = X, y = Y - sr * 0.92;
  ctx.fillStyle = '#CFE8D2'; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = RENK[gemiRenk]; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y - r - r * 1.6); ctx.stroke();
  ctx.fillStyle = RENK[gemiRenk]; ctx.beginPath(); ctx.moveTo(x, y - r - r * 1.6); ctx.lineTo(x + r * 1.1, y - r - r * 1.25); ctx.lineTo(x, y - r - r * 0.9); ctx.fill();
  if (Math.sin(t * 2.5) > 0) { ctx.fillStyle = '#9BE07A'; ctx.beginPath(); ctx.arc(x, y - r * 0.4, Math.max(1, r * 0.2), 0, TAU); ctx.fill(); }
}
function gemiEtiket() {
  if (!oyunda) return; const [X, Y] = W2S(SH.x, SH.y), s = Math.max(cam.z, 0.62), mx = maxCan();
  if (can < mx - 0.5 || KORS.length) { const w = 46, y = Y - 30 * s; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(X - w / 2 - 1, y - 1, w + 2, 6); const k = Math.max(0, can / mx); ctx.fillStyle = k > 0.5 ? '#9BE07A' : k > 0.25 ? '#FFC857' : '#FF5C6E'; ctx.fillRect(X - w / 2, y, w * k, 4); }
  if (gemiAd && cam.z > 0.2) { ctx.font = '800 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(230,238,255,.75)'; ctx.fillText(gemiAd, X, Y + 32 * s); }
}
/* ================= kokpit göstergeleri ================= */
let kokAcik = ls.get('kozmos-kokpit', !DOKUN) !== false, nabiz = 68, isi = -80, kokT = 0;
const EKG = new Float32Array(150); let ekgI = 0, ekgFaz = 0, ekgBirikim = 0;
function kokpitAc(v) { kokAcik = !!v; ls.set('kozmos-kokpit', kokAcik); $('kokpit').hidden = !kokAcik || !oyunda; $('kokSec').checked = kokAcik; }
function kokpitGuncelle(dt, v) {
  // gövde ısısı: yakın yıldızlar, fırtına, warp
  let f = 0; const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tm = temel(ssx + i, ssy + j); if (!tm || YT[tm.yt].kd) continue; const d = Math.max(tm.yr, Math.hypot(tm.x - SH.x, tm.y - SH.y)); f += Math.pow(tm.yr * 1.12 / d, 2) * (tm.yr / 220); }
  const isiH = -80 + 2500 * f + (firtina > 0 ? 140 : 0) + SH.warp * 90 + SH.itki * 25 + gazToplama * 900;
  isi += (isiH - isi) * Math.min(1, dt * 1.5);
  if (oyunda && !limanP && isi > 1200) { hasar(dt * (isi - 1200) / 160, true); if (performance.now() - (SH._isiU || 0) > 6000) { SH._isiU = performance.now(); duyur('🌡 ' + T('Gövde ısısı kritik! Yıldızdan uzaklaş', 'Hull temperature critical! Move away from the star'), 'uyari'); SES.uyari(); } }
  // pilot nabzı: hız, warp, korsan, hasar, kara delik, ısı
  let bh = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tm = temel(ssx + i, ssy + j); if (tm && YT[tm.yt].kd) bh = Math.max(bh, 1 - Math.hypot(tm.x - SH.x, tm.y - SH.y) / 9000); }
  const hedef = 66 + Math.min(v, 3200) / 3200 * 16 + SH.warp * 30 + (KORS.length ? 28 : 0) + hasarFlas * 40 + Math.max(0, bh) * 38 + kis((isi - 300) / 900, 0, 1) * 22 + (can < maxCan() * 0.3 ? 14 : 0) + (limanP ? -6 : 0);
  nabiz += (hedef - nabiz) * Math.min(1, dt * (hedef > nabiz ? 1.2 : 0.25));
  // EKG dalgası
  ekgFaz += dt * nabiz / 60; ekgBirikim += dt * 60;
  while (ekgBirikim >= 1) {
    ekgBirikim -= 1; const ph = ekgFaz % 1;
    let y = 0; if (ph < 0.12) y = Math.sin(ph / 0.12 * Math.PI) * 0.12; else if (ph < 0.2) y = 0; else if (ph < 0.23) y = -0.25; else if (ph < 0.27) y = 1; else if (ph < 0.3) y = -0.35; else if (ph < 0.5) y = 0; else if (ph < 0.68) y = Math.sin((ph - 0.5) / 0.18 * Math.PI) * 0.22;
    EKG[ekgI] = y + (Math.random() - 0.5) * 0.03; ekgI = (ekgI + 1) % EKG.length;
  }
}
let kokG = 0, kokSonV = 0, kokSonZ = 0, kokTara = 0;
function kokpitCiz(t) {
  const c = $('kokpit'); if (c.hidden) return; kokT++;
  // G kuvveti (her karede ölç)
  const vv = Math.hypot(SH.vx, SH.vy), zz = performance.now(), dtt = Math.max(0.001, (zz - kokSonZ) / 1000); if (kokSonZ) { const gA = Math.abs(vv - kokSonV) / dtt / 320; kokG += (Math.min(9.9, gA + (SH.warp > 0.2 ? 4 + SH.warp * 3 : 0)) - kokG) * Math.min(1, dtt * 3); } kokSonV = vv; kokSonZ = zz;
  if (kokT % 2) return;
  const w = 212, av = kis(innerHeight - 354, 274, 446), bolum = { ekg: av >= 324, tec: av >= 352, mini: av >= 396 };
  const h = 274 + (bolum.ekg ? 50 : 0) + (bolum.mini ? 44 : 0) + (bolum.tec ? 28 : 0);
  if (c.width !== Math.round(w * DPR) || c.height !== Math.round(h * DPR)) { c.width = Math.round(w * DPR); c.height = Math.round(h * DPR); c.style.height = h + 'px'; c.style.width = w + 'px'; }
  const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, w, h);
  x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineCap = 'round';
  const yazi = (s2, X, Y, f, renk, hz, hiz) => { x.font = `${f || 800} ${hz || 10}px Nunito, system-ui, sans-serif`; x.fillStyle = renk || '#97A5CA'; if (hiz) x.textAlign = hiz; x.fillText(s2, X, Y); x.textAlign = 'center'; };
  const ayrac = Y => { const g = x.createLinearGradient(10, 0, w - 10, 0); g.addColorStop(0, 'rgba(127,227,255,0)'); g.addColorStop(0.5, 'rgba(127,227,255,.22)'); g.addColorStop(1, 'rgba(127,227,255,0)'); x.fillStyle = g; x.fillRect(10, Y, w - 20, 1); };
  const yan = ph => Math.sin(t * 8 + (ph || 0)) > 0;
  // köşe braketleri
  x.strokeStyle = 'rgba(127,227,255,.45)'; x.lineWidth = 1.5; for (const [cx, cy, sx, sy] of [[5, 5, 1, 1], [w - 5, 5, -1, 1], [5, h - 5, 1, -1], [w - 5, h - 5, -1, -1]]) { x.beginPath(); x.moveTo(cx, cy + sy * 10); x.lineTo(cx, cy); x.lineTo(cx + sx * 10, cy); x.stroke(); }
  // tarama çizgisi
  kokTara = (kokTara + 0.6) % h; { const g = x.createLinearGradient(0, kokTara - 14, 0, kokTara); g.addColorStop(0, 'rgba(127,227,255,0)'); g.addColorStop(1, 'rgba(127,227,255,.05)'); x.fillStyle = g; x.fillRect(2, kokTara - 14, w - 4, 14); }
  // ---- başlık ----
  const gAd = kapsul ? T('Kaçış kapsülü', 'Escape pod') : L((GEMI[gemiTip] || GEMI.kasif).ad), deg = Math.round((((SH.a * 180 / Math.PI) + 90) % 360 + 360) % 360);
  yazi('◈ ' + gAd.toUpperCase(), 12, 17, 900, '#E8EEFF', 10.5, 'left'); yazi(String(deg).padStart(3, '0') + '°', w - 12, 17, 900, '#7FE3FF', 11, 'right');
  const led = [['OTO', mod === 'oto', '#7FE3FF'], ['FREN', fren, '#FFC857'], ['WARP', SH.warp > 0.2 || SH.sarj > 0.01, '#B48CFF'], [T('TRT', 'TUR'), KORS.length > 0 && !kapsul, '#FF7B8A'], ['SİG', sigorta, '#9BE07A']];
  led.forEach(([ad, on, rk], i) => { const lw = (w - 24) / led.length, lx = 12 + i * lw; x.fillStyle = on ? rk : 'rgba(255,255,255,.07)'; x.globalAlpha = on ? (ad === 'TRT' || ad === 'TUR' ? (yan(i) ? 1 : 0.55) : 0.9) : 1; x.beginPath(); x.roundRect ? x.roundRect(lx, 24, lw - 4, 11, 3) : x.rect(lx, 24, lw - 4, 11); x.fill(); x.globalAlpha = 1; yazi(ad, lx + (lw - 4) / 2, 32.5, 900, on ? '#08101E' : 'rgba(151,165,202,.55)', 7.5); });
  let Y = 40; ayrac(Y);
  // ---- hız kadranı ----
  { const cx = 50, cy = Y + 50, r = 36, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, warpO = SH.warp > 0.2, oran = warpO ? 0.8 + 0.2 * kis(SH.warp, 0, 1) : 0.8 * Math.sqrt(kis(vv / 3200, 0, 1));
    x.lineWidth = 5; x.strokeStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.arc(cx, cy, r, a0, a1); x.stroke();
    x.strokeStyle = 'rgba(180,140,255,.25)'; x.beginPath(); x.arc(cx, cy, r, a0 + (a1 - a0) * 0.8, a1); x.stroke();
    const gk = x.createLinearGradient(cx - r, cy, cx + r, cy); gk.addColorStop(0, '#3AA8FF'); gk.addColorStop(0.7, '#7FE3FF'); gk.addColorStop(1, '#B48CFF'); x.strokeStyle = gk; x.shadowColor = '#7FE3FF'; x.shadowBlur = 6; x.beginPath(); x.arc(cx, cy, r, a0, a0 + (a1 - a0) * oran); x.stroke(); x.shadowBlur = 0;
    for (let i = 0; i <= 20; i++) { const a = a0 + (a1 - a0) * i / 20, r1 = r - 6, r2 = r - (i % 5 ? 9 : 13); x.strokeStyle = i >= 16 ? 'rgba(180,140,255,.5)' : 'rgba(200,215,255,.32)'; x.lineWidth = 1; x.beginPath(); x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); x.stroke(); }
    // itki iç halkası
    const mot = SH.warp > 0.2 ? 1 : SH.itki; x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,.06)'; x.beginPath(); x.arc(cx, cy, r - 17, a0, a1); x.stroke(); x.strokeStyle = boost && guc > 0 ? '#FFC857' : '#9BE07A'; x.beginPath(); x.arc(cx, cy, r - 17, a0, a0 + (a1 - a0) * kis(mot, 0, 1)); x.stroke();
    const an = a0 + (a1 - a0) * oran; x.strokeStyle = '#FF7B8A'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - Math.cos(an) * 5, cy - Math.sin(an) * 5); x.lineTo(cx + Math.cos(an) * (r - 4), cy + Math.sin(an) * (r - 4)); x.stroke(); x.fillStyle = '#E8EEFF'; x.beginPath(); x.arc(cx, cy, 3, 0, TAU); x.fill();
    const [hd, hb] = hizYaz(vv); yazi(hd, cx, cy + 22, 900, '#E8EEFF', 13); yazi(hb, cx, cy + 32, 900, '#97A5CA', 8.5); yazi(T('HIZ', 'SPEED'), cx, Y + 10, 900, '#97A5CA', 8.5);
  }
  // ---- radar ----
  { let kd = Infinity; for (const k of KORS) kd = Math.min(kd, Math.hypot(k.x - SH.x, k.y - SH.y)); const cx = 154, cy = Y + 50, r = 44, RR = Math.min(6000 * taraK(), Math.max(1200, kd * 1.7)), sc = r / RR, ca = Math.cos(-SH.a - Math.PI / 2), sa = Math.sin(-SH.a - Math.PI / 2);
    const P = (wx, wy) => { const dx = wx - SH.x, dy = wy - SH.y; return [cx + (dx * ca - dy * sa) * sc, cy + (dx * sa + dy * ca) * sc, Math.hypot(dx, dy)]; };
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
    const bg2 = x.createRadialGradient(cx, cy, 0, cx, cy, r); bg2.addColorStop(0, 'rgba(20,60,50,.55)'); bg2.addColorStop(1, 'rgba(4,16,14,.7)'); x.fillStyle = bg2; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    x.strokeStyle = 'rgba(124,240,166,.18)'; x.lineWidth = 1; for (const k of [0.33, 0.66]) { x.beginPath(); x.arc(cx, cy, r * k, 0, TAU); x.stroke(); } x.beginPath(); x.moveTo(cx - r, cy); x.lineTo(cx + r, cy); x.moveTo(cx, cy - r); x.lineTo(cx, cy + r); x.stroke();
    const sw = (t * 2.2) % TAU; for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(124,240,166,${(0.16 * (1 - i / 14)).toFixed(3)})`; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r, sw - (i + 1) * 0.06, sw - i * 0.06); x.closePath(); x.fill(); }
    x.strokeStyle = 'rgba(160,255,200,.7)'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(sw) * r, cy + Math.sin(sw) * r); x.stroke();
    const nokta = (wx, wy, renk, tip, puls) => { const [px, py, d] = P(wx, wy); if (d > RR * 1.02) return; const ba = Math.atan2(py - cy, px - cx), fark = ((sw - ba) % TAU + TAU) % TAU, parla = 0.45 + 0.55 * Math.max(0, 1 - fark / 2.2); x.globalAlpha = parla; x.fillStyle = renk; if (tip === 'k') { x.fillRect(px - 2.5, py - 2.5, 5, 5); } else if (tip === 'e') { x.beginPath(); x.moveTo(px, py - 3.5); x.lineTo(px + 3, py + 2.5); x.lineTo(px - 3, py + 2.5); x.closePath(); x.fill(); } else { x.beginPath(); x.arc(px, py, tip === 'b' ? 3.2 : 2.2, 0, TAU); x.fill(); } if (puls) { x.strokeStyle = renk; x.globalAlpha = parla * (1 - (t * 1.5 % 1)); x.lineWidth = 1; x.beginPath(); x.arc(px, py, 3 + (t * 1.5 % 1) * 6, 0, TAU); x.stroke(); } x.globalAlpha = 1; };
    const sx2 = Math.floor(SH.x / SEK), sy2 = Math.floor(SH.y / SEK), tt = simT();
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tm = temel(sx2 + i, sy2 + j); if (tm) nokta(tm.x, tm.y, `rgb(${YT[tm.yt].g})`, 'b'); const s2 = Math.abs(i) + Math.abs(j) <= 1 && sistem(sx2 + i, sy2 + j); if (s2) for (const q of s2.gez) { const [qx, qy] = gezPos(q, tt); nokta(qx, qy, q.kol ? '#FFC857' : 'rgba(127,190,255,.9)', ''); } }
    for (const o of OLAY) nokta(o.x, o.y, o.tip === 'enkaz' ? '#FFB066' : '#D8C6FF', '');
    for (const hq of HURDA) nokta(hq.x, hq.y, HURT[hq.tip].ars ? '#FFE3A6' : 'rgba(220,230,255,.85)', '');
    { const [bx, by] = bankaPos(); nokta(bx, by, '#FFC857', 'k'); const G = galaksi(...galHucre(SH.x, SH.y)), [ix, iy] = istPos(G), [kx, ky] = korsanLimanPos(G); nokta(ix, iy, '#7FE3FF', 'k'); nokta(kx, ky, '#FF7B8A', 'k'); }
    for (const [, L0] of LON) nokta(L0.x, L0.y, L0.id === ST.lonca ? '#FFC857' : '#9BE07A', 'k');
    if (istnObj) nokta(istnObj.x, istnObj.y, '#FFE3A6', 'k');
    if (!KOLOS.yenildi) { const [x, y] = kolosPos(); nokta(x, y, '#FF8A3D', 'k', true); }
    for (const e of ESK) if (e.x != null) nokta(e.x, e.y, '#9BE07A', 'k');
    for (const kv of KERVAN) { const ps = kvPos(kv); if (ps) nokta(ps[0], ps[1], '#FFE3A6', 'e'); }
    for (const d of DOST) nokta(d.x, d.y, '#7FE3FF', 'e');
    for (const [, e] of AG.UZAK) nokta(e.cx, e.cy, '#7CF0A6', 'e');
    for (const k of KORS) nokta(k.x, k.y, k.golge ? '#B48CFF' : k.ist ? '#7CF0A6' : '#FF5C6E', 'e', true);
    x.restore();
    // hedef işareti (kenarda)
    const hd = wp || (oto ? (() => { const q = otoPos(oto, simT()); return q ? { x: q[0], y: q[1] } : null; })() : null);
    if (hd) { const [px, py, d] = P(hd.x, hd.y), ba = Math.atan2(py - cy, px - cx), ic = d < RR, mx = ic ? px : cx + Math.cos(ba) * (r - 4), my = ic ? py : cy + Math.sin(ba) * (r - 4); x.strokeStyle = '#FFC857'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(mx, my - 4); x.lineTo(mx + 4, my); x.lineTo(mx, my + 4); x.lineTo(mx - 4, my); x.closePath(); x.stroke(); }
    if (MODUL.sensor < 60) { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip(); for (let i = 0; i < (60 - MODUL.sensor) * 4; i++) { x.fillStyle = `rgba(200,255,220,${(Math.random() * 0.35).toFixed(2)})`; x.fillRect(cx - r + Math.random() * r * 2, cy - r + Math.random() * r * 2, 2, 1); } x.restore(); }
    x.strokeStyle = 'rgba(124,240,166,.5)'; x.lineWidth = 1.2; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
    x.fillStyle = '#E8EEFF'; x.beginPath(); x.moveTo(cx, cy - 5); x.lineTo(cx + 3.5, cy + 4); x.lineTo(cx, cy + 2); x.lineTo(cx - 3.5, cy + 4); x.closePath(); x.fill();
    yazi('RADAR', cx, Y + 10, 900, '#97A5CA', 8.5);
    yazi('◎ ' + mesafeYaz(RR), cx - r - 4, cy + r + 9, 800, 'rgba(124,240,166,.85)', 7.5, 'left'); if (KORS.length) yazi('⚠ ' + KORS.length, cx + r + 4, cy + r + 9, 900, yan() ? '#FF7B8A' : '#FFB3BC', 9, 'right');
  }
  Y += 100; ayrac(Y);
  // ---- nabız ----
  if (bolum.ekg) {
    const ey = Y + 6, eh = 40, ux = 10, uw = w - 20, nb = Math.round(nabiz), nR = nb < 95 ? '#7CF0A6' : nb < 125 ? '#FFC857' : '#FF5C6E';
    x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(ux, ey, uw, eh);
    x.strokeStyle = 'rgba(124,240,166,.07)'; x.lineWidth = 1; x.beginPath(); for (let i = 1; i < 8; i++) { x.moveTo(ux + uw * i / 8, ey); x.lineTo(ux + uw * i / 8, ey + eh); } for (let i = 1; i < 4; i++) { x.moveTo(ux, ey + eh * i / 4); x.lineTo(ux + uw, ey + eh * i / 4); } x.stroke();
    x.strokeStyle = nR; x.lineWidth = 1.6; x.shadowColor = nR; x.shadowBlur = 6; x.beginPath();
    for (let i = 0; i < EKG.length; i++) { const v = EKG[(ekgI + i) % EKG.length], px = ux + uw * i / (EKG.length - 1), py = ey + eh * 0.64 - v * eh * 0.5; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke(); x.shadowBlur = 0;
    { const px = ux + uw, py = ey + eh * 0.64 - EKG[(ekgI + EKG.length - 1) % EKG.length] * eh * 0.5; x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(px - 1, py, 2, 0, TAU); x.fill(); }
    yazi('♥ ' + nb, ux + 5, ey + 12, 900, nR, 12, 'left'); yazi(T('PİLOT NABZI', 'PILOT PULSE') + ' · ' + (nb < 95 ? T('SAKİN', 'CALM') : nb < 125 ? T('GERGİN', 'TENSE') : T('PANİK', 'PANIC')), ux + uw - 5, ey + 11, 900, '#97A5CA', 7.5, 'right');
    Y += 50; ayrac(Y);
  }
  // ---- mini kadranlar ----
  if (bolum.mini) {
    const mini = (cx, oran, renk, etk, deger, uy) => { const cy = Y + 30, r = 17, a0 = Math.PI, a1 = Math.PI * 2; x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.arc(cx, cy, r, a0, a1); x.stroke(); x.strokeStyle = renk; x.beginPath(); x.arc(cx, cy, r, a0, a0 + Math.PI * kis(oran, 0, 1)); x.stroke(); yazi(deger, cx, cy - 2, 900, uy && yan() ? '#FF7B8A' : '#E8EEFF', 11); yazi(etk, cx, cy + 10, 900, '#97A5CA', 7.5); };
    const mot = SH.warp > 0.2 ? 1 : SH.itki, isiO = (isi + 100) / 1600, isiR = isi < 0 ? '#7FB8FF' : isi < 400 ? '#9BE07A' : isi < 1000 ? '#FFC857' : '#FF5C6E';
    mini(40, mot, SH.warp > 0.2 ? '#B48CFF' : boost && guc > 0 ? '#FFC857' : '#7FE3FF', T('MOTOR', 'ENGINE'), SH.warp > 0.2 ? 'W' : Math.round(mot * 100) + '%');
    mini(106, isiO, isiR, T('GÖVDE ISISI', 'HULL HEAT'), Math.round(isi) + '°', isi > 1000);
    mini(172, kokG / 9.9, kokG > 6 ? '#FF7B8A' : kokG > 3 ? '#FFC857' : '#9BE07A', T('G-KUVVETİ', 'G-FORCE'), kokG.toFixed(1) + 'g', kokG > 7);
    Y += 44; ayrac(Y);
  }
  // ---- çubuklar ----
  const cubuk = (etiket, oran, renk, deger, uyari) => {
    const y = Y + 13; yazi(etiket, 12, y, 900, '#97A5CA', 9, 'left'); yazi(deger, w - 12, y, 900, uyari && yan() ? '#FF7B8A' : '#E8EEFF', 10, 'right');
    x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(12, y + 4, w - 24, 6);
    const n = 24, gw = (w - 24) / n, dolu = Math.round(kis(oran, 0, 1) * n); for (let i = 0; i < n; i++) if (i < dolu) { x.fillStyle = renk; x.globalAlpha = 0.55 + 0.45 * (i / n); x.fillRect(12 + i * gw + 0.5, y + 4, gw - 1.5, 6); } x.globalAlpha = 1;
    if (dolu) { x.fillStyle = renk; x.shadowColor = renk; x.shadowBlur = 8; x.fillRect(12 + (dolu - 1) * gw + 0.5, y + 4, gw - 1.5, 6); x.shadowBlur = 0; }
    Y += 26;
  };
  const yo = yakit / tank(), co = can / maxCan(), ko = kargoDolu() / Math.max(1, kapasite()), wo = Math.max(SH.sarj, SH.warp);
  if (kapsul) { const oo = oks / OKS_MAX(), dk = Math.max(0, Math.ceil(oks)); cubuk('🫁 ' + T('OKSİJEN', 'OXYGEN'), oo, oo < 0.2 ? '#FF5C6E' : '#7FE3FF', Math.floor(dk / 60) + ':' + String(dk % 60).padStart(2, '0'), oo < 0.2); }
  else { const menz = yakit > 0 ? Math.round(yakit / 0.9) : 0; cubuk('⛽ ' + T('YAKIT', 'FUEL'), yo, yo < 0.15 ? '#FF5C6E' : '#FFC857', Math.floor(yakit) + '/' + tank(), yo < 0.15); }
  cubuk('🛡 ' + T('GÖVDE', 'HULL') + (sigorta ? ' · 🛡' : ''), co, co < 0.3 ? '#FF5C6E' : co < 0.6 ? '#FFC857' : '#9BE07A', Math.ceil(can) + '/' + maxCan(), co < 0.3);
  { const y = Y + 13; yazi('⚙ ' + T('SİSTEMLER', 'SYSTEMS'), 12, y, 900, '#97A5CA', 9, 'left'); const ks = Object.keys(MODUL), gw = (w - 24) / ks.length; const zay = ks.filter(k => MODUL[k] < 99.5); yazi(zay.length ? zay.map(k => MODAD[k].e + Math.round(MODUL[k])).join(' ') : '✓ ' + T('TAMAM', 'OK'), w - 12, y, 900, zay.some(k => MODUL[k] < 40) && yan() ? '#FF7B8A' : '#E8EEFF', 9.5, 'right'); ks.forEach((k, i) => { const v2 = MODUL[k], rk = v2 >= 70 ? '#9BE07A' : v2 >= 40 ? '#FFC857' : '#FF5C6E', xx = 12 + i * gw; x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(xx, y + 4, gw - 4, 6); x.fillStyle = rk; x.globalAlpha = v2 < 40 && !yan(i) ? 0.45 : 1; x.fillRect(xx, y + 4, (gw - 4) * v2 / 100, 6); x.globalAlpha = 1; }); Y += 26; }
  cubuk('📦 ' + T('KARGO', 'CARGO'), ko, ko > 0.9 ? '#FFC857' : '#7FE3FF', kargoDolu() + '/' + kapasite());
  cubuk('🌀 ' + T('WARP ÇEKİRDEĞİ', 'WARP CORE'), yakit > 0 ? (wo > 0.01 ? wo : 1) : 0, wo > 0.01 ? '#B48CFF' : 'rgba(180,140,255,.55)', kapsul ? T('YOK', 'NONE') : yakit <= 0 ? T('YAKIT YOK', 'NO FUEL') : SH.warp > 0.2 ? T('AKTİF', 'ACTIVE') : wo > 0.01 ? Math.round(wo * 100) + '%' : T('HAZIR', 'READY'), yakit <= 0);
  // ---- teçhizat ----
  if (bolum.tec) {
    ayrac(Y + 2); const L2 = [];
    for (const k of TAK) { const E = TEC[k]; let o = 1; if (k === 'fuze') o = 1 - fuzeT / (2.5 / (1 + 0.35 * (tlv('fuze') - 1))); else if (k === 'mayin') o = 1 - mayinT / (3 / (1 + 0.35 * (tlv('mayin') - 1))); else if (k === 'patlama') o = 1 - patlamaT / (20 - 4 * (tlv('patlama') - 1)); L2.push([E.e, kis(o, 0, 1), k === 'patlama' ? 'Q' : '']); }
    if (!kapsul) L2.unshift([SILAH[silahS].e, kis(1 - (SH.atT || 0) / silahCd(), 0, 1), SILAHLAR.size > 1 ? 'R' : '']);
    if (ESK.length) L2.push(['🛡', ESK.reduce((a, e) => a + e.can / ESKT[e.t].can, 0) / ESK.length, '×' + ESK.length]);
    for (const k in SARF) if (SARF[k] > 0) L2.push([SARFE[k].e, 1, '×' + SARF[k]]);
    if (!L2.length) yazi(T('Teçhizat yok', 'No equipment'), w / 2, Y + 20, 800, 'rgba(151,165,202,.6)', 9);
    L2.slice(0, 8).forEach(([e, o, et], i) => { const cx = 20 + i * 24.5, cy = Y + 16; x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(cx, cy, 9.5, 0, TAU); x.stroke(); x.strokeStyle = o >= 1 ? '#7CF0A6' : '#7FE3FF'; x.beginPath(); x.arc(cx, cy, 9.5, -Math.PI / 2, -Math.PI / 2 + TAU * o); x.stroke(); x.globalAlpha = o >= 1 ? 1 : 0.5; x.font = '11px system-ui, sans-serif'; x.textBaseline = 'middle'; x.fillText(e, cx, cy + 0.5); x.textBaseline = 'alphabetic'; x.globalAlpha = 1; if (et) yazi(et, cx + 8, cy + 10, 900, '#E8EEFF', 7.5); });
  }
}
$('kokSec').checked = kokAcik;
$('kokSec').addEventListener('change', e => { kokpitAc(e.target.checked); SES.tik(); });
$('grafSec').value = grafSec; $('grafSec').addEventListener('change', e => { grafSec = e.target.value; ls.set('kozmos-graf', grafSec); if (grafSec === 'oto') { grafOto = 'yuksek'; ls.set('kozmos-graf-oto', grafOto); } FPS.pen.length = 0; FPS.bas = 0; boyutla(); SES.tik(); });
$('pilSec').checked = PIL.acik; $('pilSec').addEventListener('change', e => { PIL.acik = e.target.checked; ls.set('kozmos-pil', PIL.acik); boyutla(); SES.tik(); duyur('🔋 ' + (PIL.acik ? T('Pil tasarrufu açık', 'Battery saver on') : T('Pil tasarrufu kapalı', 'Battery saver off')), 'kesif', PIL.acik ? T('30 FPS, hafif grafik; menüdeyken daha da yavaşlar', '30 FPS, lighter graphics; slower still while a menu is open') : ''); });
$('fpsSec').checked = !!ls.get('kozmos-fps', false); $('fpsSec').addEventListener('change', e => { ls.set('kozmos-fps', e.target.checked); $('fpsG').hidden = !e.target.checked; SES.tik(); });
$('dinKamSec').checked = dinKam; $('dinKamSec').addEventListener('change', e => { dinKam = e.target.checked; ls.set('kozmos-dinkam', dinKam); SES.tik(); });

function ustCiz(t) {
  if (flasT > 0) { ctx.fillStyle = `rgba(255,250,235,${Math.min(0.85, flasT * 0.6).toFixed(2)})`; ctx.fillRect(0, 0, W, H); }
  { const kl = KORS.find(k => k.kolos); if (kl && KOLOS.max) { const w = Math.min(460, W * (DOKUN ? 0.92 : 0.46)), x = W / 2 - w / 2, y = DOKUN ? H - 150 : H - 46; ctx.fillStyle = 'rgba(6,10,26,.78)'; ctx.fillRect(x - 6, y - 18, w + 12, 32); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFB066'; ctx.fillText('👹 ' + T('Kolos', 'Colossus') + ' · ' + SAYI(Math.max(0, Math.round(KOLOS.can))) + ' / ' + SAYI(KOLOS.max) + (KOLOS.cevrim ? T(' · bütün pilotlar', ' · all pilots') : ''), W / 2, y - 4); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x, y + 2, w, 7); ctx.fillStyle = '#FF8A3D'; ctx.fillRect(x, y + 2, w * Math.max(0, KOLOS.can / KOLOS.max), 7); } }
  const dv = KORS.find(k => k.ana || k.us); if (dv) { const w = Math.min(420, W * (DOKUN ? 0.9 : 0.42)), x = W / 2 - w / 2, y = DOKUN ? H - 150 : H - 46; ctx.fillStyle = 'rgba(6,10,26,.75)'; ctx.fillRect(x - 6, y - 18, w + 12, 32); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#D8C6FF'; ctx.fillText('👁 ' + dv.ad + (dv.ana && !HIK.mizrak ? T(' · kalkan aşılamıyor', ' · shield impenetrable') : ''), W / 2, y - 4); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x, y + 2, w, 7); ctx.fillStyle = '#B48CFF'; ctx.fillRect(x, y + 2, w * Math.max(0, dv.can / dv.max), 7); }
  tehUst(t);
  if (nebSon) { ctx.fillStyle = `rgba(${nebSon.c[0].join(',')},.07)`; ctx.fillRect(0, 0, W, H); }
  if (firtina > 0) {
    const f = 0.05 + 0.04 * Math.sin(t * 9) + (Math.random() < 0.05 ? 0.08 : 0); ctx.fillStyle = `rgba(255,140,60,${f.toFixed(3)})`; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,220,180,.12)'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { const y = Math.random() * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + (Math.random() - 0.5) * 20); ctx.stroke(); }
  }
  if (hasarFlas > 0.03) { const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, 'rgba(255,40,60,0)'); g.addColorStop(1, `rgba(255,40,60,${(hasarFlas * (AZ_HAREKET ? 0.15 : 0.45)).toFixed(2)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}

/* ================= karakollar ================= */
const KK_F = 3000, KK_MAX = 5;
const kkBul = p => p && KARAKOL.find(k => k.id === p.id);
/* ---- oyuncular arası: selam, emoji, hediye ---- */
const OY_EMO = ['😄', '👍', '🚀', '❤️'], HED_K = 500; let hedT = 0, selT = 0, benBalon = null;
function oyuncuYakin(r) { let en = null, ed = r; const n = performance.now(); for (const [id, e] of AG.UZAK) { const k = Math.min(1, (n - e.t0) / 1300), x = lerp(e.px, e.cx, k), y = lerp(e.py, e.cy, k), d = Math.hypot(x - SH.x, y - SH.y); if (d < ed) { ed = d; en = { id, e, d }; } } return en; }
function oySelam(em) {
  const oy = oyuncuYakin(1800); if (!oy || selT > 0) return; selT = 1.5;
  benBalon = { e: em, t: performance.now() }; AG.balon(em); AG.mesaj(oy.id, em, 0); SES.tik();
  ST.selam = (ST.selam || 0) + 1; basarimKontrol();
}
function oyHediye() {
  const oy = oyuncuYakin(1800); if (!oy || kredi < HED_K || hedT > 0) return; hedT = 60;
  kredi -= HED_K; benBalon = { e: '🎁', t: performance.now() }; AG.balon('🎁'); AG.mesaj(oy.id, '🎁', HED_K); SES.tik();
  ST.hediye = (ST.hediye || 0) + 1; duyur('🎁 ' + T('Hediye gönderildi: ', 'Gift sent to ') + '<b>' + esc(String(oy.e.v.n || '?').slice(0, 20)) + '</b>', 'koloni', `-${SAYI(HED_K)} 💰`); basarimKontrol(); kaydet();
}
function oyGelen(v) {
  if (typeof v.e === 'string' && v.e.startsWith('🤝')) { ortakMesaj(v); return; }
  const ad = esc(String(v.n || '?').slice(0, 20)), k = Math.max(0, Math.min(5000, +v.k || 0));
  for (const [, e] of AG.UZAK) if (e.v && e.v.n === v.n) e.bub = { e: v.e, t: performance.now() };
  if (k > 0) { kazan(k, 'hediye'); duyur('🎁 ' + ad + T(' sana hediye gönderdi!', ' sent you a gift!'), 'galaksi', `+${SAYI(k)} 💰`); SES.galaksi(); kaydet(); }
  else duyur(v.e + ' <b>' + ad + '</b>' + (v.e === '👋' ? T(' sana selam verdi', ' waved at you') : ''), 'koloni');
}
/* diğer oyuncuların karakolları: "sx,sy,i" → bilgi */
const OKK = new Map();
const kkHiz = k => 6 * k.sv, kkKap = k => 30 * k.sv;
const kkStok = k => Math.min(kkKap(k), Math.floor((Date.now() - k.t) / 3.6e6 * kkHiz(k)));
function kkKur(p) {
  if (KARAKOL.length >= KK_MAX || kredi < KK_F || kkBul(p)) return;
  kredi -= KK_F; KARAKOL.push({ id: p.id, hs: [p.s.t.sx, p.s.t.sy, p.i], sv: 1, t: Date.now(), ad: p.ad });
  duyur('⚑ ' + T('Karakol kuruldu: ', 'Outpost built: ') + '<b>' + esc(p.ad) + '</b>', 'koloni', T(`Saatte ${6} ${L(MAL[KAYN[p.tip]].ad)} üretir, sen yokken de. Gelip topla.`, `Produces ${6} ${L(MAL[KAYN[p.tip]].ad)} per hour, even while you are away.`)); SES.koloni(); basarimKontrol();
}
function kkAl(k, p) {
  if (!k) return; const st = kkStok(k), n = Math.min(st, kapasite() - kargoDolu());
  if (n <= 0) { duyur(st ? '📦 ' + T('Ambar dolu', 'Cargo hold full') : '⚑ ' + T('Henüz üretim yok, biraz sonra uğra', 'Nothing produced yet, come back later'), 'uyari'); return; }
  const m = KAYN[p.tip]; KARGO[m] = (KARGO[m] || 0) + n; const kal = st - n; k.t = Date.now() - kal / kkHiz(k) * 3.6e6;
  duyur('⚑ ' + T('Karakoldan alındı', 'Collected from outpost'), 'kesif', `${MAL[m].e} +${n}`); SES.koloni();
}
function kkYukselt(k) { if (!k || k.sv >= 5) return; const f = 2000 * k.sv; if (kredi < f) return; const st = kkStok(k); kredi -= f; k.sv++; k.t = Date.now() - st / kkHiz(k) * 3.6e6; duyur('⚑ ' + T('Karakol seviye ', 'Outpost level ') + k.sv, 'koloni', k.sv === 3 ? T('Artık ücretsiz yakıt verir', 'Now gives free fuel') : k.sv === 5 ? T('Artık ücretsiz onarım yapar', 'Now repairs for free') : T(`Saatte ${kkHiz(k)} birim`, `${kkHiz(k)} units per hour`)); SES.koloni(); }

