/* ================= liman sahnesi (iniş) ================= */
let lsP = null, lsT0 = 0, lsVeri = null;
const ZEMIN = { okyanus: ['#0E3A66', '#1C5C8C'], orman: ['#1E4A2A', '#2F6B3A'], col: ['#7A4A22', '#B97A40'], buz: ['#A8C8DC', '#E4F2FA'], kaya: ['#3E3B3A', '#6A6460'], lav: ['#1A0C0A', '#3A1810'], zehir: ['#4A5020', '#7A8236'] };
function limanSahne(p) {
  lsP = p; lsT0 = performance.now(); const r = rng(p.seed ^ 0x77), buyuk = p.kol.nuf > 1e5, n = Math.round(kis(Math.log10(p.kol.nuf) * 5, 8, 36)), bin = [];
  for (let i = 0; i < n; i++) { const w = 8 + r() * 16, h = (buyuk ? 22 : 10) + Math.pow(r(), 1.6) * (buyuk ? 70 : 26), x = r(); const pen = []; for (let k = 0; k < h * w / 40; k++) pen.push([r(), r(), r()]); bin.push({ x, w, h, k: r() < (buyuk ? 0.15 : 0.6), pen }); }
  const yil = []; for (let i = 0; i < 70; i++) yil.push([r(), r() * 0.6, r()]);
  lsVeri = { bin: bin.sort((a, b) => b.h - a.h), yil, dag: r() * 100, gaz: p.tip === 'gaz' || p.tip === 'buzdevi' };
  requestAnimationFrame(lsKare);
}
function lsKare(now) {
  if (!limanP || limanP !== lsP) return;
  const c = $('lmSahne'); if (!c) return; const w = c.clientWidth, h = c.clientHeight; if (!w) { requestAnimationFrame(lsKare); return; }
  if (c.width !== Math.round(w * DPR)) { c.width = Math.round(w * DPR); c.height = Math.round(h * DPR); }
  const x = c.getContext('2d'), p = lsP, V = lsVeri, t = (now - lsT0) / 1000, atm = p.P.atm || '150,170,220', yt = p.s.Y;
  x.setTransform(DPR, 0, 0, DPR, 0, 0);
  let g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#040714'); g.addColorStop(0.75, `rgba(${atm},.55)`); g.addColorStop(1, `rgba(${atm},.8)`); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (const [a, b, k] of V.yil) { x.fillStyle = `rgba(255,255,255,${(0.3 + 0.5 * Math.abs(Math.sin(t * (0.5 + k) + k * 9))).toFixed(2)})`; x.fillRect(a * w, b * h, 1.2, 1.2); }
  // yıldız / güneş
  const sx = w * 0.82, sy = h * 0.28; g = x.createRadialGradient(sx, sy, 0, sx, sy, h * 0.6); g.addColorStop(0, yt.kd ? 'rgba(255,170,90,.6)' : `rgba(${yt.g},.75)`); g.addColorStop(1, `rgba(${yt.g},0)`); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = yt.kd ? '#000' : yt.c; x.beginPath(); x.arc(sx, sy, h * 0.08, 0, TAU); x.fill();
  for (let i = 0; i < Math.min(2, p.ay.length); i++) { x.fillStyle = '#CFC8BC'; x.beginPath(); x.arc(w * (0.18 + i * 0.16), h * (0.22 + i * 0.1), h * (0.05 - i * 0.015), 0, TAU); x.fill(); x.fillStyle = 'rgba(4,7,20,.55)'; x.beginPath(); x.arc(w * (0.18 + i * 0.16) - h * 0.015, h * (0.22 + i * 0.1), h * (0.05 - i * 0.015), 0, TAU); x.fill(); }
  const zy = h * 0.78;
  if (V.gaz) {   // gaz devinde yüzen platform: bulut bantları
    for (let i = 0; i < 5; i++) { x.fillStyle = `rgba(${p.tip === 'gaz' ? '210,160,110' : '120,180,220'},${0.25 + i * 0.12})`; x.beginPath(); x.moveTo(0, h); for (let k = 0; k <= w; k += 8) x.lineTo(k, zy + i * 7 + Math.sin(k / 40 + t * 0.4 + i) * 4); x.lineTo(w, h); x.fill(); }
    x.fillStyle = '#1A2236'; x.fillRect(w * 0.25, zy - 14, w * 0.5, 8); x.fillRect(w * 0.48, zy - 6, w * 0.04, 30);
  } else {
    const Z = ZEMIN[p.tip] || ZEMIN.kaya;
    x.fillStyle = Z[0]; x.beginPath(); x.moveTo(0, h); for (let k = 0; k <= w; k += 6) x.lineTo(k, zy - 14 - (Math.sin(k / 37 + V.dag) * 0.5 + Math.sin(k / 13 + V.dag * 2) * 0.25 + 0.5) * h * 0.14); x.lineTo(w, h); x.fill();
    x.fillStyle = Z[1]; x.fillRect(0, zy, w, h - zy);
    if (p.tip === 'okyanus') { x.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 8; k++) x.fillRect(((k * 97 + t * 12) % w), zy + 6 + (k % 3) * 6, 18, 1.2); }
  }
  // binalar
  for (const b of V.bin) {
    const bx = V.gaz ? w * 0.27 + b.x * w * 0.46 : b.x * (w - 30) + 10, by = (V.gaz ? zy - 14 : zy) + 1;
    if (b.k) { x.fillStyle = 'rgba(200,230,255,.18)'; x.strokeStyle = 'rgba(200,230,255,.5)'; x.beginPath(); x.arc(bx, by, b.w * 0.9, Math.PI, 0); x.fill(); x.stroke(); }
    else if (yabanciMi(p) && p.kol.irk === 'vel') { x.fillStyle = 'rgba(40,90,100,.9)'; x.beginPath(); x.moveTo(bx - b.w / 2, by); x.lineTo(bx, by - b.h * 1.2); x.lineTo(bx + b.w / 2, by); x.fill(); }
    else if (yabanciMi(p) && p.kol.irk === 'krai') { x.fillStyle = '#1A2410'; x.beginPath(); x.ellipse(bx, by - b.h / 2, b.w / 2, b.h / 2, 0, 0, TAU); x.fill(); }
    else { x.fillStyle = yabanciMi(p) ? '#0B1A33' : '#0B1222'; x.fillRect(bx - b.w / 2, by - b.h, b.w, b.h); }
    x.fillStyle = yabanciMi(p) ? `rgba(${IRK[p.kol.irk].isik},.85)` : 'rgba(255,214,140,.85)';
    for (const [a, c2, k] of b.pen) { if (Math.sin(t * 0.6 + k * 40) < -0.6) continue; if (b.k) { const aa = Math.PI + a * Math.PI, rr = c2 * b.w * 0.75; x.fillRect(bx + Math.cos(aa) * rr, by + Math.sin(aa) * rr, 1.4, 1.4); } else x.fillRect(bx - b.w / 2 + 2 + a * (b.w - 4), by - b.h + 3 + c2 * (b.h - 6), 1.6, 1.6); }
  }
  // iniş pisti ve gemi
  const px = w * 0.5, py = (V.gaz ? zy - 14 : zy) - 2; x.fillStyle = '#2A3448'; x.fillRect(px - 26, py - 2, 52, 4);
  for (let i = -1; i <= 1; i += 2) { x.fillStyle = Math.sin(t * 6 + i) > 0 ? '#7FE3FF' : '#1D4A5A'; x.beginPath(); x.arc(px + i * 26, py - 1, 2, 0, TAU); x.fill(); }
  const k = Math.min(1, t / 1.8), e = 1 - Math.pow(1 - k, 3), gy = lerp(-30, py - 14, e), sk = h / 124;
  x.save(); x.translate(px, gy); x.rotate(-Math.PI / 2); x.scale(0.9 * sk, 0.9 * sk);
  if (k < 1) { const L = 14 + Math.random() * 10; const fg = x.createLinearGradient(-12, 0, -12 - L, 0); fg.addColorStop(0, 'rgba(255,255,255,.95)'); fg.addColorStop(0.3, 'rgba(127,227,255,.8)'); fg.addColorStop(1, 'rgba(60,110,255,0)'); x.fillStyle = fg; x.fillRect(-12 - L, -5, L, 10); }
  const GV = GOVDE[gemiTip] || GOVDE.kasif; g = x.createLinearGradient(0, -16, 0, 16); g.addColorStop(0, '#9AA6BC'); g.addColorStop(0.5, '#EEF3FA'); g.addColorStop(1, '#6E7A92');
  x.fillStyle = g; x.strokeStyle = '#1E2638'; x.lineWidth = 1.1; x.beginPath(); GV.p.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); x.stroke();
  x.strokeStyle = RENK[gemiRenk]; x.lineWidth = 1.8; x.beginPath(); for (const [a, b, c2, d] of GV.s) { x.moveTo(a, b); x.lineTo(c2, d); } x.stroke(); x.restore();
  // mekikler
  for (let i = 0; i < 3; i++) { const u = ((t * 0.07 + i * 0.37) % 1), mx = u * w, my = h * (0.3 + i * 0.12) + Math.sin(u * 6 + i) * 6; x.fillStyle = 'rgba(230,245,255,.9)'; x.fillRect(mx, my, 2, 2); x.fillStyle = 'rgba(120,200,255,.35)'; x.fillRect(mx - 10, my + 0.5, 10, 1); }
  requestAnimationFrame(lsKare);
}

/* ================= mini harita (keşfettikçe açılır) ================= */
const MM = $('mini'), mmx = MM.getContext('2d'), SIS = document.createElement('canvas'), sx_ = SIS.getContext('2d'); let mmS = 0;
const MMR = 6.5; // görünen yarıçap (sektör)
function miniBoyut() { mmS = MM.clientWidth || 180; MM.width = MM.height = SIS.width = SIS.height = Math.round(mmS * DPR); }
function miniCiz() {
  if (!mmS) miniBoyut(); const S = mmS, k = S / (2 * MMR * SEK), c = mmx, f = sx_;
  const M2 = (x, y) => [(x - SH.x) * k + S / 2, (y - SH.y) * k + S / 2];
  const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK), n = Math.ceil(MMR) + 1;
  c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, S, S);
  // açılmış bölgenin zemini
  const g0 = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.7); g0.addColorStop(0, '#16224A'); g0.addColorStop(1, '#0B1230');
  c.fillStyle = g0; c.fillRect(0, 0, S, S);
  c.strokeStyle = 'rgba(140,170,255,.07)'; c.lineWidth = 1; c.beginPath();
  for (let i = -n; i <= n + 1; i++) { const X = M2((ssx + i) * SEK, 0)[0], Y = M2(0, (ssy + i) * SEK)[1]; c.moveTo(X, 0); c.lineTo(X, S); c.moveTo(0, Y); c.lineTo(S, Y); } c.stroke();
  // sis: açılmamış her yer karanlık
  f.setTransform(DPR, 0, 0, DPR, 0, 0); f.globalCompositeOperation = 'source-over'; f.fillStyle = '#03050D'; f.fillRect(0, 0, S, S);
  f.globalCompositeOperation = 'destination-out'; const r = HC * k * 1.35, hx0 = Math.floor(SH.x / HC), hy0 = Math.floor(SH.y / HC), hn = Math.ceil(MMR * 2) + 2;
  for (let j = -hn; j <= hn; j++) for (let i = -hn; i <= hn; i++) {
    if (!ACIK.has((hx0 + i) + ',' + (hy0 + j))) continue;
    const [X, Y] = M2((hx0 + i + 0.5) * HC, (hy0 + j + 0.5) * HC), g = f.createRadialGradient(X, Y, 0, X, Y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.45, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    f.fillStyle = g; f.fillRect(X - r, Y - r, r * 2, r * 2);
  }
  c.drawImage(SIS, 0, 0, S, S);
  // açılmış bölgelerdeki sistemler
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const tm = temel(ssx + i, ssy + j); if (!tm || !ACIK.has(Math.floor(tm.x / HC) + ',' + Math.floor(tm.y / HC))) continue;
    const [X, Y] = M2(tm.x, tm.y), bil = KESIF.has('s:' + tm.k), Yt = YT[tm.yt];
    if (X < -6 || X > S + 6 || Y < -6 || Y > S + 6) continue;
    const rr = Math.max(1.4, Math.min(3.2, tm.yr / 110));
    if (bil) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(X, Y, 0, X, Y, rr * 3.5); g.addColorStop(0, `rgba(${Yt.g},.5)`); g.addColorStop(1, `rgba(${Yt.g},0)`); c.fillStyle = g; c.fillRect(X - rr * 3.5, Y - rr * 3.5, rr * 7, rr * 7); c.globalCompositeOperation = 'source-over'; }
    c.fillStyle = Yt.kd ? (bil ? '#B48CFF' : 'rgba(180,140,255,.45)') : bil ? Yt.c : 'rgba(170,190,255,.4)';
    c.beginPath(); c.arc(X, Y, bil ? rr : rr * 0.75, 0, TAU); c.fill();
    if (bil && tm.tam && tm.tam.gez.some(p => p.kol && KESIF.has('k:' + p.id))) { c.strokeStyle = 'rgba(255,200,87,.9)'; c.lineWidth = 1.2; c.beginPath(); c.arc(X, Y, rr + 2.6, 0, TAU); c.stroke(); }
  }
  // kenar işaretleri: ana üs ve rota
  const kenar = (x, y, renk, yazi) => {
    let [X, Y] = M2(x, y); const m = 9;
    if (X > m && X < S - m && Y > m && Y < S - m) { c.strokeStyle = renk; c.lineWidth = 1.5; c.beginPath(); c.arc(X, Y, 5, 0, TAU); c.stroke(); return; }
    const a = Math.atan2(Y - S / 2, X - S / 2), dx = Math.cos(a), dy = Math.sin(a), t2 = Math.min((S / 2 - m) / Math.abs(dx || 1e-6), (S / 2 - m) / Math.abs(dy || 1e-6));
    X = S / 2 + dx * t2; Y = S / 2 + dy * t2;
    c.save(); c.translate(X, Y); c.rotate(a); c.fillStyle = renk; c.beginPath(); c.moveTo(5, 0); c.lineTo(-3, -4); c.lineTo(-3, 4); c.closePath(); c.fill(); c.restore();
    if (yazi) { c.fillStyle = renk; c.font = '900 9px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(yazi, X - dx * 11, Y - dy * 11 + 3); }
  };
  const ev = temel(0, 0); kenar(ev.x, ev.y, 'rgba(127,227,255,.9)', '⌂');
  if (wp) kenar(wp.x, wp.y, 'rgba(200,170,255,.95)', '🏁');
  for (const [, e] of AG.UZAK) { const [X, Y] = M2(e.cx, e.cy); if (X > 2 && X < S - 2 && Y > 2 && Y < S - 2) { c.fillStyle = '#7CF0A6'; c.beginPath(); c.arc(X, Y, 2.6, 0, TAU); c.fill(); } }
  for (const g of GOREV) { const h = gorevHedef(g); if (!h) continue; const [x, y] = otoPos(h, simT()); kenar(x, y, g.tip === 'hikaye' ? 'rgba(200,170,255,.95)' : 'rgba(255,170,80,.95)', gEm(g)); }
  for (const k of KARAKOL) { const s2 = sistem(k.hs[0], k.hs[1]), p2 = s2 && s2.gez[k.hs[2]]; if (p2) { const [x, y] = gezPos(p2, simT()); kenar(x, y, 'rgba(155,224,122,.95)', '⚑'); } }
  // gemi
  c.save(); c.translate(S / 2, S / 2); c.rotate(SH.a); c.fillStyle = '#FFFFFF'; c.shadowColor = '#7FE3FF'; c.shadowBlur = 6;
  c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -4); c.lineTo(-2, 0); c.lineTo(-4, 4); c.closePath(); c.fill(); c.restore();
}
MM.addEventListener('click', () => { SES.baslat(); haritaAc(); });

/* ================= harita ================= */
const HM = { acik: false, x: 0, y: 0, z: 0.0022, T: 0 };
const hc = $('hc'), hx = hc.getContext('2d'), GSPR = new Map();
function hcBoyut() { hc.width = Math.round(W * DPR); hc.height = Math.round(H * DPR); }
function haritaAc() { ST.rHarita = 1; HM.acik = true; $('harita').hidden = false; HM.x = SH.x; HM.y = SH.y; hcBoyut(); rotaPanel(); haritaCiz(); SES.tik(); }
function haritaKapat() { HM.acik = false; $('harita').hidden = true; }
const HZMIN = 4e-5, HZMAX = 0.06;
function galSprite(g) { let s = GSPR.get(g.k); if (!s) { s = galaksiSprite(g.seed, g.tip, g.kol, g.ton, 256); GSPR.set(g.k, s); if (GSPR.size > 40) GSPR.delete(GSPR.keys().next().value); } return s; }
function haritaCiz() {
  const c = hx, z = HM.z, M2S = (x, y) => [(x - HM.x) * z + W / 2, (y - HM.y) * z + H / 2];
  c.setTransform(DPR, 0, 0, DPR, 0, 0); c.fillStyle = '#02030A'; c.fillRect(0, 0, W, H);
  const wx0 = HM.x - W / 2 / z, wx1 = HM.x + W / 2 / z, wy0 = HM.y - H / 2 / z, wy1 = HM.y + H / 2 / z;
  const sp = SEK * z;
  // galaksiler
  const C = GH * SEK, gx0 = Math.round(wx0 / C) - 1, gx1 = Math.round(wx1 / C) + 1, gy0 = Math.round(wy0 / C) - 1, gy1 = Math.round(wy1 / C) + 1;
  const galA = sp < 10 ? 1 : Math.max(0.12, 1 - (sp - 10) / 30);
  c.font = '800 12.5px Nunito, system-ui, sans-serif'; c.textAlign = 'center';
  if ((gx1 - gx0 + 1) * (gy1 - gy0 + 1) < 400) for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const g = galaksi(gx, gy), [X, Y] = M2S(g.x, g.y), R = g.R * z * 1.15; if (X + R < 0 || X - R > W || Y + R < 0 || Y - R > H) continue;
    c.save(); c.globalAlpha = galA; c.globalCompositeOperation = 'lighter'; c.translate(X, Y); c.rotate(g.don); c.scale(1, g.egim); c.drawImage(galSprite(g), -R, -R, R * 2, R * 2); c.restore();
    skHarita(c, g, M2S, sp);
    if (HIK.kapi && KESIF.has('g:' + g.k)) { const [kx, ky] = M2S(...kapiPos(g)); c.strokeStyle = 'rgba(180,140,255,.9)'; c.lineWidth = 2; c.beginPath(); c.arc(kx, ky, 7, 0, TAU); c.stroke(); c.fillStyle = '#D8C6FF'; c.fillText('⛩', kx, ky - 11); }
    if (KESIF.has('g:' + g.k)) { c.font = '900 12px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; for (const [ps, e] of [[istPos(g), '🛰'], [korsanLimanPos(g), '☠'], [mezarPos(g), '⚓']]) { const [ix, iy] = M2S(ps[0], ps[1]); c.fillText(e, ix, iy + 4); } }
    if (sp < 16) { const bil = KESIF.has('g:' + g.k); c.fillStyle = bil ? '#E8EEFF' : 'rgba(170,185,230,.6)'; c.fillText(bil ? L(g.ad) : T('Bilinmeyen galaksi', 'Unknown galaxy'), X, Y + R * g.egim + 16); }
  }
  // sistemler
  if (sp >= 7) {
    const sx0 = Math.floor(wx0 / SEK), sx1 = Math.floor(wx1 / SEK), sy0 = Math.floor(wy0 / SEK), sy1 = Math.floor(wy1 / SEK);
    if (sp >= 40) { c.strokeStyle = 'rgba(140,170,255,.06)'; c.lineWidth = 1; c.beginPath(); for (let i = sx0; i <= sx1 + 1; i++) { const X = M2S(i * SEK, 0)[0]; c.moveTo(X, 0); c.lineTo(X, H); } for (let j = sy0; j <= sy1 + 1; j++) { const Y = M2S(0, j * SEK)[1]; c.moveTo(0, Y); c.lineTo(W, Y); } c.stroke(); }
    if ((sx1 - sx0 + 1) * (sy1 - sy0 + 1) < 9000) { c.globalAlpha = Math.min(0.11, 0.03 + sp / 900); for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) { const f = bolgeFr(sx, sy); if (!f) continue; const [X, Y] = M2S(sx * SEK, sy * SEK); c.fillStyle = `rgb(${FR_RENK[f]})`; c.fillRect(X, Y, sp + 0.5, sp + 0.5); } c.globalAlpha = 1; }
    if ((sx1 - sx0 + 1) * (sy1 - sy0 + 1) < 32000) for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) {
      const tm = temel(sx, sy); if (!tm) continue; const [X, Y] = M2S(tm.x, tm.y), bil = KESIF.has('s:' + tm.k), Yt = YT[tm.yt];
      const r = Math.max(1, Math.min(4.5, tm.yr / 90)) * (sp > 50 ? 1.5 : sp > 20 ? 1.1 : 0.8);
      c.fillStyle = Yt.kd ? (bil ? '#B48CFF' : 'rgba(180,140,255,.4)') : bil ? Yt.k : 'rgba(170,190,255,.32)';
      c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
      if (bil) {
        const s = sistem(sx, sy), kol = s.gez.some(p => p.kol && KESIF.has('k:' + p.id));
        if (kol) { c.strokeStyle = 'rgba(255,200,87,.85)'; c.lineWidth = 1.3; c.beginPath(); c.arc(X, Y, r + 3, 0, TAU); c.stroke(); }
        if (sp >= 26) { c.fillStyle = kol ? '#FFD98A' : '#C9D4F5'; c.font = '800 11.5px Nunito, system-ui, sans-serif'; c.fillText(tm.ad + (tm.ev ? ' ⌂' : ''), X, Y + r + 14); }
      }
    }
  }
  // ana üs
  { const h = temel(0, 0), [X, Y] = M2S(h.x, h.y); c.strokeStyle = 'rgba(127,227,255,.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(X, Y, 9, 0, TAU); c.stroke(); if (sp < 26) { c.fillStyle = '#9FEAFF'; c.font = '900 11.5px Nunito, system-ui, sans-serif'; c.fillText('⌂ ' + T('Ana üs', 'Home'), X, Y - 14); } }
  // rota
  if (wp) {
    const [X, Y] = M2S(wp.x, wp.y), [GX, GY] = M2S(SH.x, SH.y);
    c.strokeStyle = 'rgba(180,140,255,.7)'; c.lineWidth = 1.5; c.setLineDash([5, 6]); c.beginPath(); c.moveTo(GX, GY); c.lineTo(X, Y); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(X, Y, 12, 0, TAU); c.stroke(); c.fillStyle = '#D8C6FF'; c.font = '900 12px Nunito, system-ui, sans-serif'; c.fillText('🏁 ' + wp.ad, X, Y - 18);
  }
  rotaHarita(c, M2S);
  for (const [, e] of AG.UZAK) { const [X, Y] = M2S(e.cx, e.cy); c.fillStyle = '#7CF0A6'; c.beginPath(); c.arc(X, Y, 4, 0, TAU); c.fill(); c.font = '800 11px Nunito, system-ui, sans-serif'; c.fillText('🛰 ' + String(e.v.n || '?').slice(0, 20), X, Y - 9); }
  // görev hedefleri
  for (const g of GOREV) { const h = gorevHedef(g); if (!h) continue; const [x, y] = otoPos(h, simT()), [X, Y] = M2S(x, y); c.strokeStyle = 'rgba(255,170,80,.9)'; c.lineWidth = 1.5; c.beginPath(); c.arc(X, Y, 10, 0, TAU); c.stroke(); c.fillStyle = '#FFD2A0'; c.font = '900 12px Nunito, system-ui, sans-serif'; c.fillText(gEm(g) + ' ' + g.ad, X, Y + 24); }
  { const [bx, by] = bankaPos(), [X, Y] = M2S(bx, by); c.textAlign = 'center'; c.fillStyle = '#FFC857'; c.font = '900 12px Nunito, system-ui, sans-serif'; c.fillText('🏦', X + 14, Y - 6); }
  if (!KOLOS.yenildi) { const [x, y] = kolosPos(), [X, Y] = M2S(x, y); c.font = '900 12px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#FF8A3D'; c.fillText('👹 ' + T('Kolos', 'Colossus'), X, Y + 4); }
  if (KOL) { const q = zGez(KOL.z); if (q) { const [x, y] = gezPos(q, simT()), [X, Y] = M2S(x, y); c.font = '900 12px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#9BE07A'; c.fillText('🏠 ' + KOL.ad, X, Y - 10); } }
  for (const P of [parkur('ev'), parkur(galHucre(HM.x, HM.y))]) { const [X, Y] = M2S(P.x0, P.y0); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; c.font = '900 12px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#FFD98A'; c.fillText('🏁 ' + P.ad, X, Y + 4); }
  if (istnObj) { const [X, Y] = M2S(istnObj.x, istnObj.y); c.font = '900 12px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#FFE3A6'; c.fillText('🏗 ' + istnObj.ad, X, Y + 4); }
  for (const [, L0] of LON) { const [X, Y] = M2S(L0.x, L0.y); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; c.font = '900 11px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = L0.id === ST.lonca ? '#FFC857' : '#9BE07A'; c.fillText('🏰 ' + L0.ad, X, Y + 4); }
  c.textAlign = 'center'; for (const [, o] of OKK) { const [X, Y] = M2S(o.x, o.y); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; c.fillStyle = '#FFC36B'; c.beginPath(); c.arc(X, Y, 3, 0, TAU); c.fill(); if (sp >= 0.4 || OKK.size < 30) { c.font = '800 10.5px Nunito, system-ui, sans-serif'; c.fillText((o.k ? '🏙 ' : '⚑ ') + o.n, X, Y + 14); } }
  for (const k of KARAKOL) { const s2 = sistem(k.hs[0], k.hs[1]), p2 = s2 && s2.gez[k.hs[2]]; if (!p2) continue; const [X, Y] = M2S(...gezPos(p2, simT())); c.fillStyle = '#9BE07A'; c.font = '900 12px Nunito, system-ui, sans-serif'; c.fillText('⚑ ' + k.ad, X, Y - 12); c.beginPath(); c.arc(X, Y, 4, 0, TAU); c.fill(); }
  // gemi
  { const [X, Y] = M2S(SH.x, SH.y); c.save(); c.translate(X, Y); c.rotate(SH.a); c.fillStyle = '#7FE3FF'; c.beginPath(); c.moveTo(10, 0); c.lineTo(-7, -6); c.lineTo(-3, 0); c.lineTo(-7, 6); c.closePath(); c.fill(); c.restore();
    c.strokeStyle = 'rgba(127,227,255,.35)'; c.lineWidth = 1; c.beginPath(); c.arc(X, Y, 16 + (performance.now() / 40) % 14, 0, TAU); c.stroke(); }
  // bilgi
  $('hSil').hidden = !wp;
  $('hBilgi').innerHTML = sp >= 7 ? `${T('Bir sisteme dokun: rota çizilir', 'Tap a system to plot a route')}<small>${T('Sürükle, tekerlek ya da iki parmakla yakınlaş · ', 'Drag, wheel or pinch to zoom · ')}${SAYI(KESIF.size ? [...KESIF].filter(k => k[0] === 's').length : 0)} ${T('sistem keşfedildi', 'systems discovered')}</small>` : `${T('Galaksiler', 'Galaxies')}<small>${T('Yakınlaşınca yıldız sistemleri görünür', 'Zoom in to see star systems')}</small>`;
}
{
  const HP = new Map(); let hp = null, surukle = 0, bas = null;
  hc.addEventListener('pointerdown', e => { try { hc.setPointerCapture(e.pointerId); } catch (er) { } HP.set(e.pointerId, { x: e.clientX, y: e.clientY }); surukle = 0; bas = { x: e.clientX, y: e.clientY }; if (HP.size === 2) { const [a, b] = [...HP.values()]; hp = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: HM.z }; } });
  hc.addEventListener('pointermove', e => {
    const o = HP.get(e.pointerId); if (!o) return;
    if (hp && HP.size >= 2) { HP.set(e.pointerId, { x: e.clientX, y: e.clientY }); const [a, b] = [...HP.values()]; HM.z = kis(hp.z * Math.hypot(a.x - b.x, a.y - b.y) / hp.d, HZMIN, HZMAX); surukle = 99; haritaCiz(); return; }
    const dx = e.clientX - o.x, dy = e.clientY - o.y; HP.set(e.pointerId, { x: e.clientX, y: e.clientY }); surukle += Math.abs(dx) + Math.abs(dy);
    HM.x -= dx / HM.z; HM.y -= dy / HM.z; haritaCiz();
  });
  const up = e => {
    if (!HP.has(e.pointerId)) return; HP.delete(e.pointerId); if (HP.size < 2) hp = null;
    if (surukle < 8 && bas && !HP.size) haritaSec(bas.x, bas.y);
  };
  hc.addEventListener('pointerup', up); hc.addEventListener('pointercancel', e => { HP.delete(e.pointerId); hp = null; });
  hc.addEventListener('wheel', e => { e.preventDefault(); const z0 = HM.z, z1 = kis(z0 * Math.exp(-e.deltaY * 0.0016), HZMIN, HZMAX); const wx = HM.x + (e.clientX - W / 2) / z0, wy = HM.y + (e.clientY - H / 2) / z0; HM.z = z1; HM.x = wx - (e.clientX - W / 2) / z1; HM.y = wy - (e.clientY - H / 2) / z1; haritaCiz(); }, { passive: false });
}
function haritaSec(px, py) {
  const z = HM.z, sp = SEK * z;
  const wx = HM.x + (px - W / 2) / z, wy = HM.y + (py - H / 2) / z;
  if (sp < 7) { // galaksiye yakınlaş
    HM.x = wx; HM.y = wy; HM.z = kis(HM.z * 3, HZMIN, HZMAX); haritaCiz(); return;
  }
  let en = null, ed = 24;
  const sx = Math.floor(wx / SEK), sy = Math.floor(wy / SEK), rr = Math.ceil(24 / sp);
  for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) { const tm = temel(sx + i, sy + j); if (!tm) continue; const d = Math.hypot((tm.x - wx) * z, (tm.y - wy) * z); if (d < ed) { ed = d; en = tm; } }
  if (!en) return;
  if (rotaMod) { if (ROTA.length < 8 && !(ROTA.length && ROTA[ROTA.length - 1].k === en.k)) { ROTA.push({ x: en.x, y: en.y, k: en.k, ad: KESIF.has('s:' + en.k) ? en.ad : T('Bilinmeyen yıldız', 'Unknown star') }); SES.tik(); } rotaPanel(); haritaCiz(); kaydet(); return; }
  const bil = KESIF.has('s:' + en.k);
  wp = { x: en.x, y: en.y, k: en.k, ad: bil ? en.ad : T('Bilinmeyen yıldız', 'Unknown star') };
  if (mod === 'oto') oto = { tm: en, ad: wp.ad };
  SES.tik(); haritaCiz(); kaydet();
  duyur((mod === 'oto' ? '🤖 ' : '🏁 ') + T('Rota: ', 'Route: ') + esc(wp.ad), 'kesif', mesafeYaz(Math.hypot(en.x - SH.x, en.y - SH.y)) + T(' · Warp için Boşluk ya da 🌀', ' · Space or 🌀 to warp'));
}
$('haritaBtn').onclick = () => HM.acik ? haritaKapat() : haritaAc();
$('hKapat').onclick = haritaKapat;
$('hGemi').onclick = () => { HM.x = SH.x; HM.y = SH.y; HM.z = Math.max(HM.z, 0.0022); haritaCiz(); };
$('hEv').onclick = () => { const h = temel(0, 0); HM.x = h.x; HM.y = h.y; HM.z = Math.max(HM.z, 0.004); wp = { x: h.x, y: h.y, k: h.k, ad: 'Helios ⌂' }; if (mod === 'oto') oto = { tm: h, ad: 'Helios ⌂' }; haritaCiz(); kaydet(); SES.tik(); };
$('hSil').onclick = () => { wp = null; haritaCiz(); kaydet(); };

/* ================= menü, kayıt ================= */
function kaydet(zorla) { if (window.__seriYukleniyor || (!oyunda && !zorla)) return; AG.siraGonder(); ls.set('kozmos-bil', BIL.slice(0, 40)); ls.set(KAYIT, { acl: [...ACL], gun: GUN, prs: PRS, evb: EVB, frk: (() => { const o = {}; for (const k of Object.keys(FRW.kat).sort().slice(-3)) o[k] = FRW.kat[k]; return o; })(), x: SH.x, y: SH.y, a: SH.a, kesif: [...KESIF], acik: [...ACIK], wp, zu: zKul, yol, kr: kredi, yak: yakit, kargo: KARGO, gorev: GOREV, alinan: [...ALINAN].slice(-300), yuk: YUK, kota: KOTA, gemi: gemiTip, gemiler: [...GEMILER], renk: gemiRenk, gad: gemiAd, can, sl: sonLiman, st: ST, bas: [...BAS], itibar: ITIBAR, karakol: KARAKOL, hik: HIK, tek: [...TEKS], tak: TAK, kap: kapsul, oks, sig: sigorta, kiys: [...KIYS], kiy: KIY, plan: [...PLANLAR], sarf: SARF, tlv: TLV, ekip: EKIP, fr: FR, kervan: KERVAN, ziy: ZIY, defter: DEFTER, arsiv: [...ARSIV], tekno: [...TEKNO], modul: MODUL, istn: istnObj, moral: MORAL, dip: DIP, silahlar: [...SILAHLAR], silahS, esk: ESK.map(e => ({ t: e.t, can: Math.round(e.can), ad: e.ad })), eskEmir, kod: [...KOD], guc: GUC, kol: KOL, reh: REH, sez: SEZ, kozm: KOZM, astd: astdTemiz(), rota: ROTA, pz: pzTemiz(), bes: BES, mods: MODS, yer: YER, v: 1 }); }
function menuKur() {
  const dene = f => { try { f(); } catch (e) { console.warn('menuKur', e); if (window.kozHataGonder) kozHataGonder('menuKur: ' + e.message, e.stack); } };
  dene(zorSecKur);
  try { const ilk = !oyunda && !KESIF.size && !PRS && !ilkGecildi; $('menu').querySelector('.kart').classList.toggle('ilk', ilk); $('ilkDil').textContent = EN() ? '🌐 Türkçe' : '🌐 English'; } catch (e) { }
  try { $('mBasla').textContent = oyunda ? T('Uçuşa dön', 'Back to flight') : KESIF.size ? T('Kaldığın yerden devam et', 'Continue where you left off') : T('Uçuşa başla', 'Start flying'); } catch (e) { }
  let s = 0, p = 0, k = 0, g = 0; for (const x of KESIF) { if (x[0] === 's') s++; else if (x[0] === 'p') p++; else if (x[0] === 'k') k++; else if (x[0] === 'g') g++; }
  dene(radyoYaz); dene(bulYaz); dene(() => { $('frList').innerHTML = frYaz() + frSavasYaz() + dipOzet(); }); dene(() => { $('takList').innerHTML = takvimHtml(); }); dene(() => { $('defList').innerHTML = defterHtml(); }); dene(() => { $('fpSec').checked = kokGor; });
  dene(() => { $('istat').innerHTML = [[s, T('Sistem', 'Systems')], [p, T('Gezegen', 'Planets')], [k, T('Koloni', 'Colonies')], [g, T('Galaksi', 'Galaxies')]].map(([n, a]) => `<div><b>${SAYI(n)}</b><span>${a}</span></div>`).join(''); });
  dene(() => { $('yolYaz').textContent = (PRS ? '⭐ ' + T('Prestij ', 'Prestige ') + PRS + ' · ' : '') + (KOZM.sec.unvan && UNVAN[KOZM.sec.unvan] ? '🏷 ' + L(UNVAN[KOZM.sec.unvan]) + ' · ' : HIK.son4 ? SON4[HIK.son4].e + ' ' + L(SON4[HIK.son4].u) + ' · ' : HIK.a >= 15 ? '🌟 ' + T('Galaksilerin Koruyucusu', 'Guardian of the Galaxies') + ' · ' : '') + '💰 ' + SAYI(kredi) + T(' kredi', ' credits') + (yol > 10 ? ' · ' + T('Uçulan yol: ', 'Distance flown: ') + mesafeYaz(yol) : ''); });
  const var_ = KESIF.size > 0;
  $('mBasla').textContent = oyunda ? T('Uçuşa dön', 'Back to flight') : var_ ? T('Kaldığın yerden devam et', 'Continue where you left off') : T('Uçuşa başla', 'Start flying');
  dene(() => { $('basOz').textContent = T('🏅 Başarımlar', '🏅 Achievements') + ` (${BAS.size}/${BASARIM.length})`; $('basList').innerHTML = BASARIM.map(b => `<div class="${BAS.has(b[0]) ? 'ok' : ''}"><b>${b[1]} ${L(b[2])}</b>${L(b[3])}</div>`).join(''); });
  dene(mevYaz); dene(gunYaz); dene(prsYaz); dene(pilotYaz); dene(evYaz); if (AG.durum() === 'acik' && performance.now() - evOkT > 30000) dene(() => evYukle());
  const sb = $('mSifirla'); sb.hidden = !(var_ || oyunda); delete sb.dataset.emin; sb.classList.remove('emin'); sb.textContent = '🔄 ' + T('Baştan başla (yeni oyun)', 'Start over (new game)');
}
function basla() {
  $('menu').hidden = true; SES.baslat();
  setTimeout(() => { kaydet(); if (window.seriKayit) seriKayit.simdi(); }, 1500);
  setTimeout(() => kokpitAc(kokAcik), 0);
  setTimeout(gorevYaz, 0);
  if (!oyunda) {
    oyunda = true; sonGal = undefined;
    if (!KESIF.size) { ['g:0,0', 's:0,0', 'p:0,0:2', 'k:0,0:2'].forEach(k => KESIF.add(k)); kesifSayYaz(); setTimeout(() => duyur('🏙 ' + T('Ana üs: Helios sistemi, Yeni Umut kolonisi', 'Home: Helios system, New Hope colony'), 'koloni', DOKUN ? T('Ekrana basılı tut: o yöne uçarsın', 'Press and hold: you fly that way') : T('Fareye basılı tut ya da W A S D · Boşluk: warp · M: harita', 'Hold the mouse or use W A S D · Space: warp · M: map')), 400); }
  }
  SES.tik();
}
$('mBasla').onclick = basla;
$('mSifirla').onclick = () => {
  const b = $('mSifirla'); SES.tik();
  if (!b.dataset.emin) { b.dataset.emin = 1; b.classList.add('emin'); b.textContent = '⚠ ' + T('Emin misin? Tüm ilerleme silinir, tekrar bas', 'Sure? All progress is erased, press again'); setTimeout(() => { if (b.dataset.emin) { delete b.dataset.emin; b.classList.remove('emin'); b.textContent = '🔄 ' + T('Baştan başla (yeni oyun)', 'Start over (new game)'); } }, 6000); return; }
  b.textContent = T('Sıfırlanıyor…', 'Resetting…'); setTimeout(oyunSifirla, 250);
};
/* menü sekmeleri: Oyun · Görüntü · Kayıt · Topluluk · Defter */
const MSEK = [['oyun', '🎮', ['Oyun', 'Game']], ['gor', '🎨', ['Görüntü', 'Display']], ['kayit', '💾', ['Kayıt', 'Save']], ['top', '🌐', ['Topluluk', 'Community']], ['def', '📖', ['Defter', 'Logbook']]];
function menuSekmeKur() {
  const kart = $('menu').querySelector('.kart'), sec = id => $(id) && ($(id).closest('label.secim, div.secim') || $(id));
  const nasil = [...kart.querySelectorAll('details')].find(d => d.querySelector('summary[data-en="How to fly"]'));
  const yer = { oyun: ['mevDet', 'gunDet', 'prsBtn', 'rehBtn', 'bilBtn', 'profBtn', 'fotoBtn', 'kurBtn', 'zorSat', 'mSifirla'].map($), gor: ['kontSec', 'otoHizSec', 'kboySec', 'renkSec', 'yaziSec', 'azSec', 'titSec', 'solakSec', 'dinKamSec', 'grafSec', 'pilSec', 'fpsSec', 'kokSec', 'fpSec'].map(sec), kayit: ['seriHesap', 'bulDet'].map($), top: ['evDet', 'pilotDet', 'siraDet'].map($), def: ['basDet', 'defDet', 'radDet', 'takDet', 'frDet'].map($).concat([nasil]) };
  const bar = document.createElement('div'); bar.className = 'sekme'; bar.id = 'mSek';
  bar.innerHTML = MSEK.map(([k, e, a]) => `<button type="button" data-ms="${k}"><span>${e}</span><b data-en="${a[1]}">${a[0]}</b></button>`).join('');
  $('mBasla').after(bar); let son = bar;
  for (const [k] of MSEK) { const d = document.createElement('div'); d.className = 'msp'; d.dataset.p = k; for (const el of yer[k]) if (el) d.appendChild(el); son.after(d); son = d; }
  if ($('bulDet')) $('bulDet').open = true;
  bar.onclick = e => { const b = e.target.closest('[data-ms]'); if (!b) return; menuSekme(b.dataset.ms); SES.tik(); };
  menuSekme(ls.get('kozmos-msek', 'oyun'));
}
function menuSekme(k) {
  if (!MSEK.some(x => x[0] === k)) k = 'oyun'; ls.set('kozmos-msek', k);
  for (const b of $('mSek').querySelectorAll('[data-ms]')) b.classList.toggle('on', b.dataset.ms === k);
  for (const d of $('menu').querySelectorAll('.msp')) d.hidden = d.dataset.p !== k;
  if (k === 'kayit') try { bulYaz(); } catch (e) { }
}
let ilkGecildi = false;
$('ilkDiger').onclick = () => { ilkGecildi = true; $('menu').querySelector('.kart').classList.remove('ilk'); SES.tik(); };
$('ilkDil').onclick = () => { const b = document.querySelector('#ust [data-dil-btn]'); if (b) b.click(); };
$('mKapat').onclick = () => { if (oyunda) $('mBasla').click(); else basla(); };
$('baslik').onclick = () => { menuKur(); $('menu').hidden = false; };
$('kesifCip').onclick = () => { menuKur(); $('menu').hidden = false; };
$('ayarBtn').onclick = () => { menuKur(); $('menu').hidden = false; SES.tik(); };

/* ================= tam ekran, ses ayarı ================= */
const TAMVAR = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
function tamEkran() {
  const d = document, el = d.documentElement;
  if (!TAMVAR) { odak = !odak; document.body.classList.toggle('odak', odak); duyur(odak ? T('Göstergeler gizlendi (tekrar bas: aç)', 'HUD hidden (press again to show)') : T('Göstergeler açık', 'HUD shown')); return; }
  try { if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(() => { }); } } catch (er) { }
}
const tamGuncel = () => $('tamYol').setAttribute('d', document.fullscreenElement || document.webkitFullscreenElement ? 'M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4' : 'M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4');
document.addEventListener('fullscreenchange', tamGuncel); document.addEventListener('webkitfullscreenchange', tamGuncel);
$('tamBtn').onclick = tamEkran;
{ let dT = 0; const kapa = () => { $('ust').classList.remove('acik'); if (!$('sesKutu').hidden) $('sesKutu').hidden = true; try { rehKonum(); } catch (e) { } }; $('digerBtn').onclick = () => { const ac = $('ust').classList.toggle('acik'); clearTimeout(dT); if (ac) dT = setTimeout(kapa, 7000); else kapa(); SES.tik(); try { rehKonum(); } catch (e) { } }; $('ust').addEventListener('click', e => { if ($('ust').classList.contains('acik') && e.target.closest('#tamBtn,#sesBtn,[data-dil-btn]')) { clearTimeout(dT); dT = setTimeout(kapa, e.target.closest('#sesBtn') ? 9000 : 600); } }); }
const sesYaz = () => { const d = SES.duzey(); $('sesBtn').textContent = d <= 0 ? '🔇' : d < 0.5 ? '🔉' : '🔊'; $('sesYuzde').textContent = '%' + Math.round(d * 100); $('sesSus').textContent = d <= 0 ? '🔇' : '🔈'; };
$('sesBtn').onclick = () => { $('sesKutu').hidden = !$('sesKutu').hidden; SES.baslat(); };
$('sesKaydir').value = Math.round(SES.duzey() * 100);
$('sesKaydir').addEventListener('input', e => { SES.baslat(); SES.ayarla(+e.target.value / 100); sesYaz(); });
$('sesKaydir').addEventListener('change', () => SES.tik());
$('sesSus').onclick = () => { SES.baslat(); SES.ayarla(SES.duzey() > 0 ? 0 : 0.6); $('sesKaydir').value = Math.round(SES.duzey() * 100); sesYaz(); SES.tik(); };
sesYaz();
const muzYaz = () => $('muzBtn').classList.toggle('kapali', !SES.muzik());
$('muzBtn').onclick = () => { SES.baslat(); SES.muzik(!SES.muzik()); muzYaz(); SES.tik(); };
muzYaz();
$('ipucu').textContent = '';
function ipucuYaz() { $('ipucu').textContent = mod === 'oto' ? T('Gideceğin yere tıkla · O sürüş modu · M harita', 'Click where to go · O manual · M map') : T('W A S D · Shift hız · Boşluk warp · O otopilot · M harita', 'W A S D · Shift boost · Space warp · O autopilot · M map'); }
modYaz();
if (window.erDil && erDil.on) erDil.on(() => { menuKur(); modYaz(); gorevYaz(); gpImza = ''; if (limanP) limanYaz(); sesYaz(); hudT = 0; });

addEventListener('resize', boyutla);
addEventListener('pagehide', kaydet);
document.addEventListener('visibilitychange', () => { if (document.hidden) kaydet(); });

/* ================= döngü ================= */
let son = performance.now();
const FPS = { n: 0, t: 0, ms: 0, deger: 60, pen: [], bas: 0 };
function fpsKonum() { const e = $('fpsG'), u = $('ust'); if (!e || e.hidden || !u) return; const r = u.getBoundingClientRect(), mid = innerWidth / 2, wE = e.offsetWidth / 2; let carp = false; for (const b of u.querySelectorAll('button, a, .cip')) { const q = b.getBoundingClientRect(); if (q.width && q.right > mid - wE && q.left < mid + wE && q.top < r.top + 40) { carp = true; break; } } e.style.top = carp ? Math.round(r.bottom + 4) + 'px' : ''; }
function fpsAdim(now, ham, is) {
  FPS.n++; FPS.ms += is; if (!FPS.t) FPS.t = now; if (now - FPS.t < 1000) return;
  const sn = (now - FPS.t) / 1000; FPS.deger = FPS.n / sn; const ort = FPS.ms / FPS.n; FPS.n = 0; FPS.ms = 0; FPS.t = now;
  if (ls.get('kozmos-fps', false)) { const el = $('fpsG'); el.hidden = false; el.textContent = `${Math.round(FPS.deger)} FPS · ${ort.toFixed(1)} ms · ${({ yuksek: T('Yüksek', 'High'), orta: T('Orta', 'Medium'), dusuk: T('Düşük', 'Low') })[grafAd()]}${grafSec === 'oto' ? ' (' + T('oto', 'auto') + ')' : ''} · DPR ${DPR.toFixed(2)}`; fpsKonum(); } else $('fpsG').hidden = true;
  if (grafSec !== 'oto' || PIL.acik || !oyunda || document.hidden || ham > 400) { FPS.pen.length = 0; return; } if (!FPS.bas) FPS.bas = now; if (now - FPS.bas < 6000) return;
  FPS.pen.push(FPS.deger); if (FPS.pen.length > 4) FPS.pen.shift(); if (FPS.pen.length < 4) return; const o = FPS.pen.reduce((a, b) => a + b, 0) / FPS.pen.length;
  if (o < 40 && grafOto !== 'dusuk') { grafOto = grafOto === 'yuksek' ? 'orta' : 'dusuk'; ls.set('kozmos-graf-oto', grafOto); FPS.pen.length = 0; FPS.bas = now; boyutla(); duyur('🎨 ' + T('Grafik kalitesi otomatik düşürüldü: ', 'Graphics quality lowered automatically: ') + (grafOto === 'orta' ? T('Orta', 'Medium') : T('Düşük', 'Low')), 'kesif', T('Ayarlardan değiştirebilirsin', 'You can change it in settings')); }
  else if (o > 57 && grafOto !== 'yuksek' && FPS.pen.every(v => v > 57)) { FPS.yuk = (FPS.yuk || 0) + 1; if (FPS.yuk >= 8) { FPS.yuk = 0; grafOto = grafOto === 'dusuk' ? 'orta' : 'yuksek'; ls.set('kozmos-graf-oto', grafOto); FPS.pen.length = 0; FPS.bas = now; boyutla(); } }
}
function kare(now) {
  if (PIL.acik || document.hidden) { const bek = document.hidden ? 1000 : (!$('menu').hidden || HM.acik) ? 60 : 28; if (now - son < bek) { requestAnimationFrame(kare); return; } }
  const ham = now - son, dt = Math.min(0.05, Math.max(0, (now - son) / 1000)); son = now; const t0 = performance.now();
  const t = simT();
  try { padOku(); } catch (e) { } guncelle(dt, t); ciz(t);
  if (HM.acik) { HM.T -= dt; if (HM.T <= 0) { HM.T = 0.25; haritaCiz(); } }
  fpsAdim(now, ham, performance.now() - t0);
  requestAnimationFrame(kare);
}
kayitOnar(); try { if (ST.devKul) devAgKoru(); } catch (e) { } try { yedekAl('gun'); } catch (e) { } try { kilitIlk(); } catch (e) { } try { menuSekmeKur(); } catch (e) { console.warn(e); } boyutla(); kesifSayYaz(); menuKur(); radarKur(); gorevYaz();
requestAnimationFrame(kare);
window.KOZ = { GRAF, ST, kontratTeklif, kontratKabul, kontratLiman, kontratKesif, albumEkle, albumHtml, ticKay, ticDefterHtml, gazeteHtml, haftaParkur, prkListe, kolIstekAdim, kolIstekVer, kvYukselt, zorSecKur, ekGorevler, gorevZaman, gorevMetin, kirilganHasar, demirSon, govdeCatlak, ortamAdim, limanYaz, pilotUn, gorevTeklif, unSatir, evGezegen, otoSec, hasar, HM, PAD, MEVP, KOZM, YBL: () => YBL, oyGelen, ORT: () => ORT, KORS, haftaK, bolgeFr, frEkle, get BOLGE() { return BOLGE; }, DUMAN, KIV, get GUN() { return GUN; }, gunKontrol, PRS, prsBasla, HIK, BIL, bilAc, duyur, ACL, KILIT, acikMi, kilitKontrol, get oto() { return oto; }, parkur, yarisBasla, get YR() { return YR; }, get SEZ() { return SEZ; }, sezXp, KOZM, kayitPaket, kayitUygula, bulutKaydet, galeriYukle, fotoGoster,  get yol() { return yol; }, REH, rehKontrol, rehYaz, hikAdim, hik4Son, diyalogSec,  get KOL() { return KOL; }, set KOL(v) { KOL = v; }, kolKur, kolAc, kolIsle, EKIP, huyOf, ekipYarala, HUY, get kaynP() { return kaynP; },  GUC, gucVer, ASTD, ROTA, devAst, astPos, astCan, kasaAc, hackAc, rotaBaslat, rotaPanel, get HK() { return HK; }, get astYakin() { return astYakin; }, get madenLazer() { return madenLazer; }, set madenLazer(v) { madenLazer = v; }, PARCA, get rotaAktif() { return rotaAktif; },  KOD, kodAc, kodKontrol, IZ, izPen, izEnkaz, get INS() { return INS; }, get izYakin() { return izYakin; },  PZ, BES, MODS, YER, besLv, pzKat, isle, tasarimAc, mSay,  get kdIc() { return kdIc; }, get iyonIc() { return iyonIc; }, SILAHLAR, ESK, iyonAc, meteorAc, skListe, skEs, skGec, penrose, get silahS() { return silahS; }, set silahS(v) { silahS = v; }, get kredi2() { return kredi; }, set kredi2(v) { kredi = v; }, get skYakin() { return skYakin; },  KOLOS, kolosPos, kolosBagla, profilCiz, haberUret,  DIP, dipEkle, yanBasla, gunOlay,  get istn() { return istnObj; }, istnKur, istnAc, istnIsle, get moral() { return MORAL; }, set ekOlayT(v) { ekOlayT = v; }, fiyat,  get sapanDbg() { return [sapanEn, sapanHedef && sapanHedef.ad, sapanHedef && sapanHedef.v]; }, TEKNO, MODUL, bilimEkle, tamirAc, get sapanBoost() { return sapanBoost; },  HURDA, ARSIV, hurdaCikar, arsivBul, ambarAc,  sagAc, sagHedefler,  gezPos, simT, patlamaEkle, SOH, LON, PAZ, tpAc, sohGeldi,  fotoAc, fpAc, inisAc, inisKapat, get INS() { return INS; }, DEFTER, defter,  zulaYakin, snBasla, solucanAc, istilaBasla, istPos, istAc, mezarPos, mezar, OLAY2: () => OLAY,  EKIP, FR, KERVAN, ZIY, DOST, kervanAdim, kvPos, borsaAc, korsanLimanPos, frEkle, adaylar,  SARF, TLV, sarfKullan,  get kapsul() { return kapsul; }, get oks() { return oks; }, set oks(v) { oks = v; }, PLANLAR, KIY, KIYS, bankaAc, bankaPos, planVer, get sigorta() { return sigorta; },  OKK, oyuncuYakin, oyGelen, haftaK,  devCikar, kalintiBul,  TEKS, get TAK() { return TAK; }, set TAK(v) { TAK = v; }, arananlar, patlamaKullan,  IRK, piyasaOlay, balinaSuru, yakinBalinalar, bulmacaAc, get BLM() { return BLM; },  kapiPos, golgeCikar,  get nabiz() { return nabiz; }, get isi() { return isi; },  AG, bolgeBul,  KORS, OLAY, HIK, ST, BAS, get can() { return can; }, set can(v) { can = v; }, korsanCikar, hikAdim, hikBasla, kuyruk, kuyrukPos, nebulaB, nebulaIc, get gemiTip() { return gemiTip; }, KARAKOL: () => KARAKOL, olayZorla: () => { olayT = 0; },  get kaynP() { return kaynP; }, get kazP() { return kazP; }, KARGO, get kredi() { return kredi; }, set kredi(v) { kredi = v; }, get yakit() { return yakit; }, set yakit(v) { yakit = v; }, GOREV: () => GOREV, YUK, limanAc, get limanP() { return limanP; }, get yanasP() { return yanasP; }, SH, cam, temel, sistem, galaksi, KESIF, basla, haritaAc, haritaKapat, set zoom(v) { zKul = v; }, DOKU };
})();
