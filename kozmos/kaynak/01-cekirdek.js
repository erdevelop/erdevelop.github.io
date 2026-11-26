(() => {
'use strict';
const $ = id => document.getElementById(id);
let enZorla = false;
const EN = () => enZorla || !!(window.erDil && erDil.lang === 'en');
const T = (a, b) => EN() ? b : a;
const L = a => EN() ? a[1] : a[0];
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
const kis = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const DOKUN = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window;
if (DOKUN) document.body.classList.add('dokun');
const SAYIF = {}, SAYI = (n, k) => { const a = (EN() ? 'e' : 't') + (k || 0); return (SAYIF[a] || (SAYIF[a] = new Intl.NumberFormat(EN() ? 'en-US' : 'tr-TR', { maximumFractionDigits: k || 0, minimumFractionDigits: k || 0 }))).format(n); };

/* ================= rastgelelik ve gürültü ================= */
function h32(a, b, c) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x5bd1e995, 0x165667b1) ^ Math.imul((c | 0) + 0x3c6ef372, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0;
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gurultu(seed) {
  const r = rng(seed), p = new Uint8Array(512), v = new Float32Array(256);
  for (let i = 0; i < 256; i++) { p[i] = i; v[i] = r(); }
  for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const n = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = v[p[p[X] + Y]], b = v[p[p[X + 1] + Y]], c = v[p[p[X] + Y + 1]], d = v[p[p[X + 1] + Y + 1]];
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const f = (x, y, o) => { let s = 0, a = 0.5, t = 0; for (let i = 0; i < o; i++) { s += n(x, y) * a; t += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= 0.5; } return s / t; };
  return { n, f };
}
const HECE = ['ka', 'ri', 'on', 've', 'ta', 'lu', 'mi', 'ser', 'da', 'nu', 'ze', 'ra', 'os', 'ti', 'an', 'ke', 'lo', 'vi', 'sa', 'dor', 'el', 'um', 'ar', 'ix', 'pha', 'sol', 'ter', 'ae', 'ko', 'mar', 'bel', 'gar', 'tu', 'dra', 'li', 'or', 'cy', 'pe', 'is', 'go', 'ran', 'ny', 'thal', 'vor', 'qu', 'ce', 'zan', 'mo'];
function isim(r, n) {
  n = n || (2 + (r() < 0.42 ? 1 : 0)); let s = '';
  for (let i = 0; i < n; i++) s += HECE[(r() * HECE.length) | 0];
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (r() < 0.16) s += '-' + (2 + ((r() * 97) | 0));
  return s;
}
const ROMA = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

/* ================= evren ================= */
const SEK = 14000;               // sektör kenarı (birim)
const GH = 120;                  // galaksi hücresi (sektör)
const ISIK = 300;                // 1 c = 300 birim/sn (gösterim için)
const YT = [
  { ad: ['Sarı cüce', 'Yellow dwarf'], c: '#FFF4D6', k: '#FFD27A', g: '255,212,135', r: [190, 250], w: 26 },
  { ad: ['Turuncu cüce', 'Orange dwarf'], c: '#FFE6C4', k: '#FFA654', g: '255,165,85', r: [160, 210], w: 22 },
  { ad: ['Kırmızı cüce', 'Red dwarf'], c: '#FFD0B8', k: '#FF6E4A', g: '255,105,75', r: [110, 160], w: 26 },
  { ad: ['Beyaz yıldız', 'White star'], c: '#FFFFFF', k: '#DDE6FF', g: '215,228,255', r: [200, 260], w: 10 },
  { ad: ['Mavi dev', 'Blue giant'], c: '#F2F6FF', k: '#8FB4FF', g: '135,172,255', r: [330, 430], w: 6 },
  { ad: ['Kırmızı dev', 'Red giant'], c: '#FFD8BC', k: '#FF7A45', g: '255,115,65', r: [430, 560], w: 5 },
  { ad: ['Kara delik', 'Black hole'], kd: true, c: '#000', k: '#FFB060', g: '255,175,95', r: [110, 150], w: 3 },
];
const YTW = YT.reduce((a, y) => a + y.w, 0);
const PT = {
  kaya: { ad: ['Kayalık', 'Rocky'], r: [45, 95], c: '#8A8178', atm: null, km: 90 },
  col: { ad: ['Çöl', 'Desert'], r: [55, 110], c: '#D39A5A', atm: '255,205,160', km: 90 },
  okyanus: { ad: ['Okyanus', 'Ocean'], r: [65, 120], c: '#2F6FB3', atm: '120,185,255', km: 95 },
  orman: { ad: ['Yeşil', 'Verdant'], r: [60, 115], c: '#4C9A5A', atm: '150,225,190', km: 95 },
  buz: { ad: ['Buz', 'Ice'], r: [50, 105], c: '#CFE6F0', atm: '205,235,255', km: 85 },
  lav: { ad: ['Lav', 'Lava'], r: [45, 95], c: '#5A2A1E', atm: '255,120,60', km: 85 },
  zehir: { ad: ['Zehirli', 'Toxic'], r: [60, 120], c: '#B8C25A', atm: '215,232,125', km: 95 },
  gaz: { ad: ['Gaz devi', 'Gas giant'], r: [170, 270], c: '#D2A874', atm: '255,222,175', km: 260 },
  buzdevi: { ad: ['Buz devi', 'Ice giant'], r: [140, 210], c: '#7FC4D8', atm: '165,230,255', km: 230 },
};
const KOLTIP = {
  okyanus: ['Şehir kolonisi', 'City colony'], orman: ['Şehir kolonisi', 'City colony'], col: ['Kubbe şehir', 'Dome city'],
  buz: ['Buz altı üssü', 'Sub-ice base'], kaya: ['Maden kolonisi', 'Mining colony'], lav: ['Maden istasyonu', 'Mining outpost'],
  zehir: ['Araştırma üssü', 'Research base'], gaz: ['Gaz rafinerisi', 'Gas refinery'], buzdevi: ['Gaz rafinerisi', 'Gas refinery'],
};
const KOLSANS = { okyanus: 0.6, orman: 0.6, col: 0.25, buz: 0.15, kaya: 0.12, lav: 0.06, zehir: 0.06, gaz: 0.18, buzdevi: 0.14 };

const IRK = {
  vel: { ad: ['Vel', 'Vel'], e: '💠', hece: ['vel', 'ith', 'ael', 'ys', 'qua', 'lir', 'sae', 'thi', 'oo', 'ril', 'yne', 'zae'], mal: 'kris', isik: '120,255,230', ne: ['kristal varlıklar', 'crystalline beings'] },
  krai: { ad: ['Krai', 'Krai'], e: '🪲', hece: ['kra', 'tik', 'zak', 'xi', 'kri', 'tok', 'vax', 'rek', 'kai', 'zz', 'tra', 'kol'], mal: 'krai', isik: '200,255,120', ne: ['böceksi tüccarlar', 'insectoid traders'] },
  oru: { ad: ['Oru', 'Oru'], e: '🐙', hece: ['oru', 'lua', 'mo', 'wa', 'nau', 'ei', 'po', 'ula', 'ma', 'oa', 'hu', 'ne'], mal: 'inci', isik: '120,180,255', ne: ['sucul bilgeler', 'aquatic sages'] },
};
function isimH(r, hece) { let s2 = ''; const n = 2 + (r() < 0.4 ? 1 : 0); for (let i = 0; i < n; i++) s2 += hece[(r() * hece.length) | 0]; return s2.charAt(0).toUpperCase() + s2.slice(1); }
const yabanciMi = p => p && p.kol && p.kol.irk && p.kol.irk !== 'insan';
const GAL = new Map();
function galaksi(gx, gy) {
  const k = gx + ',' + gy; let g = GAL.get(k); if (g) return g;
  const r = rng(h32(gx, gy, 4242)), ev = gx === 0 && gy === 0;
  const R = (ev ? 0.33 : 0.17 + r() * 0.15) * GH * SEK, j = 0.46 - R / (GH * SEK);
  let x = (gx + (r() * 2 - 1) * j) * GH * SEK, y = (gy + (r() * 2 - 1) * j) * GH * SEK;
  const ad = isim(r, 2);
  g = { k, gx, gy, x, y, R, ad: ev ? ['Samanyolu', 'Milky Way'] : [ad + ' Galaksisi', ad + ' Galaxy'], kol: 2 + ((r() * 3) | 0), faz: r() * TAU, egim: 0.45 + r() * 0.55, don: r() * TAU, tip: !ev && r() < 0.22 ? 'eliptik' : 'sarmal', ton: (r() * GTON.length) | 0, seed: h32(gx, gy, 77) };
  if (ev) { g.x = -0.55 * R + SEK * 0.5; g.y = 0.14 * R + SEK * 0.5; g.ton = 0; g.kol = 2; g.faz = 0.6; }
  g.irk = ev ? 'insan' : ['insan', 'vel', 'krai', 'oru'][(rng(h32(gx, gy, 999))() * 4) | 0];
  GAL.set(k, g); return g;
}
const galHucre = (x, y) => [Math.round(x / (GH * SEK)), Math.round(y / (GH * SEK))];
function yogunluk(sx, sy) {
  const g = galaksi(Math.round(sx / GH), Math.round(sy / GH));
  const dx = (sx + 0.5) * SEK - g.x, dy = (sy + 0.5) * SEK - g.y, d = Math.hypot(dx, dy) / g.R;
  if (d >= 1) return 0.012;
  let k = 0.5 * (1 - d * 0.55);
  if (g.tip === 'sarmal') { const th = Math.atan2(dy, dx), a = 0.5 + 0.5 * Math.cos(g.kol * (th - g.faz) - Math.log(d + 0.04) * 3.4); k *= 0.28 + 0.72 * a * a; }
  if (d < 0.12) k += 0.25 * (1 - d / 0.12);
  return Math.min(0.8, k + (1 - d) * 0.04);
}

const TEM = new Map();
function temel(sx, sy) {
  const k = sx + ',' + sy; if (TEM.has(k)) return TEM.get(k);
  if (TEM.size > 60000) TEM.clear();
  const r = rng(h32(sx, sy, 911)), ev = sx === 0 && sy === 0;
  let s = null;
  if (ev || r() < yogunluk(sx, sy)) {
    let yt = 0;
    if (!ev) { let q = r() * YTW; for (let i = 0; i < YT.length; i++) { q -= YT[i].w; if (q <= 0) { yt = i; break; } } }
    const Y = YT[yt];
    s = { k, sx, sy, x: (sx + (ev ? 0.5 : 0.3 + r() * 0.4)) * SEK, y: (sy + (ev ? 0.5 : 0.3 + r() * 0.4)) * SEK, yt, yr: ev ? 220 : lerp(Y.r[0], Y.r[1], r()), ad: ev ? 'Helios' : isim(r), ev, tam: null };
  }
  TEM.set(k, s); return s;
}

function sistem(sx, sy) {
  const t = temel(sx, sy); if (!t) return null; if (t.tam) return t.tam;
  const r = rng(h32(sx, sy, 1777)), Y = YT[t.yt];
  const s = { t, x: t.x, y: t.y, Y, gez: [], kusak: null, trafik: [], dugum: [], R: 0 };
  if (Y.kd) { s.disk = { ic: t.yr * 1.7, dis: t.yr * 5.2, tilt: 0.28 + r() * 0.2, rot: r() * TAU, w: 0.9 + r() * 0.6 }; }
  let n = t.ev ? 6 : Y.kd ? (r() * 3) | 0 : 1 + ((r() * 7) | 0);
  let orb = (Y.kd ? t.yr * 9 : t.yr * 2.6 + 260) + r() * 200;
  const hz0 = t.yr * 4, hz1 = t.yr * 9.5;
  for (let i = 0; i < n; i++) {
    if (orb > (t.ev ? 5200 : 4000)) break;
    let tip;
    if (t.ev) tip = ['lav', 'col', 'okyanus', 'orman', 'gaz', 'buzdevi'][i];
    else if (Y.kd) tip = r() < 0.5 ? 'kaya' : 'buz';
    else if (orb < hz0) tip = ['lav', 'kaya', 'col', 'kaya'][(r() * 4) | 0];
    else if (orb < hz1) tip = ['okyanus', 'orman', 'col', 'zehir', 'kaya', 'okyanus'][(r() * 6) | 0];
    else tip = ['gaz', 'buzdevi', 'buz', 'kaya', 'gaz'][(r() * 5) | 0];
    const P = PT[tip], pr = lerp(P.r[0], P.r[1], r()), dev = tip === 'gaz' || tip === 'buzdevi';
    const R = orb + (dev ? pr * 0.9 : 0);
    const p = { id: t.k + ':' + i, i, s, tip, P, r: pr, R, a0: r() * TAU, w: (6 / Math.pow(R, 0.9)) * (r() < 0.5 ? 1 : 0.85), spin: (r() - 0.5) * 0.12, seed: h32(sx * 31 + i, sy, 555), ad: t.ad + ' ' + ROMA[i], ay: [], halka: null, kol: null, ton: [r() - 0.5, r() - 0.5, r() - 0.5] };
    const ays = dev ? 1 + ((r() * 4) | 0) : (r() < 0.35 ? 1 : 0) + (r() < 0.1 ? 1 : 0);
    let ar = pr * (dev ? 1.55 : 1.9);
    if (dev && r() < (tip === 'gaz' ? 0.5 : 0.35)) {
      const dis = 1.9 + r() * 0.5, b = [], rr = rng(p.seed ^ 99), baz = tip === 'gaz' ? [222, 200, 160] : [185, 225, 240];
      for (let j = 0; j < 22; j++) { const f = 1.3 + (dis - 1.3) * (j / 22); const a = (0.12 + rr() * 0.5) * (rr() < 0.15 ? 0.15 : 1); const m = 0.75 + rr() * 0.4; b.push({ f, a, c: `rgba(${(baz[0] * m) | 0},${(baz[1] * m) | 0},${(baz[2] * m) | 0},${a.toFixed(2)})` }); }
      p.halka = { b, dis, tilt: 0.24 + r() * 0.3, rot: r() * TAU };
      ar = pr * (dis + 0.4);
    }
    for (let j = 0; j < ays; j++) { const mr = dev ? 9 + r() * 22 : 7 + r() * 12; ar += mr + 25 + r() * 60; p.ay.push({ r: mr, R: ar, a0: r() * TAU, w: (r() < 0.5 ? 1 : -1) * 2.2 / Math.pow(ar / 40, 1.1), c: r() < 0.5 ? '#D8D2C8' : '#C9BFAE' }); ar += mr; }
    const kolVar = t.ev ? i === 2 || i === 4 : r() < KOLSANS[tip] * (Y.kd ? 0.3 : 1);
    if (kolVar) {
      const kr = rng(p.seed ^ 7);
      const buyuk = tip === 'okyanus' || tip === 'orman';
      const nuf = buyuk ? 2e5 + Math.pow(kr(), 2) * 1.2e7 : 800 + Math.pow(kr(), 2) * 9e4;
      const isik = [];
      if (!dev) {
        const kume = buyuk ? 6 + ((kr() * 6) | 0) : 2 + ((kr() * 3) | 0);
        for (let c = 0; c < kume; c++) {
          const ca = kr() * TAU, cd = Math.sqrt(kr()) * 0.82, cx = Math.cos(ca) * cd, cy = Math.sin(ca) * cd, m = buyuk ? 10 + kr() * 26 : 6 + kr() * 10, yay = 0.05 + kr() * 0.1;
          for (let q = 0; q < m; q++) { const qa = kr() * TAU, qd = Math.pow(kr(), 1.7) * yay; const x = cx + Math.cos(qa) * qd, y = cy + Math.sin(qa) * qd; if (x * x + y * y < 0.9) isik.push([x, y, kr() < 0.15 ? 1.6 : 1, kr()]); }
        }
      }
      const irk = galaksi(Math.round(sx / GH), Math.round(sy / GH)).irk, I = IRK[irk];
      p.kol = { ad: t.ev && i === 2 ? (EN() ? 'New Hope' : 'Yeni Umut') : I ? isimH(kr, I.hece) : isim(kr, 2), adEv: t.ev && i === 2, nuf, tip: I ? [I.ad[0] + ' kolonisi', I.ad[1] + ' colony'] : KOLTIP[tip], isik, ist: dev || kr() < 0.7, istA: kr() * TAU, irk };
    }
    if (!p.kol && ['kaya', 'col', 'buz', 'lav'].includes(tip) && rng(p.seed ^ 0x3131)() < 0.09) p.kalinti = true;
    s.gez.push(p);
    orb = R + pr * (dev ? 2.2 : 1.5) + (t.ev ? 220 : 300 + r() * 380) + (p.halka ? pr : 0);
    if (!s.kusak && i >= 1 && !Y.kd && (t.ev ? i === 3 : r() < 0.3 && orb < 3400)) {
      const kw = 110 + r() * 170, KR = orb + kw, tas = [], rr = rng(h32(sx, sy, 31337));
      for (let j = 0; j < 420; j++) tas.push([rr() * TAU, (rr() + rr() - 1) * kw, 1 + rr() * rr() * 7, 0.6 + rr() * 0.4]);
      s.kusak = { R: KR, W: kw, tas, w: 6 / Math.pow(KR, 0.9) };
      orb = KR + kw + 300;
    }
  }
  const son = s.gez[s.gez.length - 1];
  s.R = Math.max(s.disk ? s.disk.dis * 2.5 : t.yr * 6, son ? son.R + son.r * 3 + 300 : 0, s.kusak ? s.kusak.R + s.kusak.W : 0);
  // trafik: koloniler arası mekikler, dışarıdan gelen yük gemileri
  const kols = s.gez.filter(p => p.kol);
  if (kols.length) {
    const rr = rng(h32(sx, sy, 2024));
    for (const p of kols) { s.dugum.push({ p }); if (p.kol.ist) s.dugum.push({ p, ist: 1 }); }
    const dis0 = s.dugum.length; for (let j = 0; j < 2; j++) { const a = rr() * TAU; s.dugum.push({ x: s.x + Math.cos(a) * (s.R + 600), y: s.y + Math.sin(a) * (s.R + 600), dis: 1 }); }
    const m = Math.min(10, kols.length * 3 + 1);
    for (let j = 0; j < m; j++) { const a = (rr() * dis0) | 0; let b = (rr() * s.dugum.length) | 0; if (b === a) b = (a + 1) % s.dugum.length; s.trafik.push({ a, b, hiz: 0.012 + rr() * 0.03, faz: rr() * 2, yan: rr() < 0.5 ? 1 : -1 }); }
  }
  t.tam = s; return s;
}
function gezPos(p, t) { const a = p.a0 + p.w * t; return [p.s.x + Math.cos(a) * p.R, p.s.y + Math.sin(a) * p.R]; }
function istPos(p, t) { const [x, y] = gezPos(p, t); const a = p.kol.istA + t * 0.11, R = p.r * (p.halka ? p.halka.dis + 0.35 : 1.6) + 40; return [x + Math.cos(a) * R, y + Math.sin(a) * R, a]; }
function dugumPos(s, d, t) { if (d.p) return d.ist ? istPos(d.p, t) : gezPos(d.p, t); return [d.x, d.y]; }

/* ================= sprite üreticiler ================= */
const GTON = [
  [[255, 236, 205], [170, 195, 255], [255, 140, 190]],
  [[255, 225, 180], [255, 200, 150], [255, 120, 140]],
  [[230, 235, 255], [140, 170, 255], [120, 200, 255]],
  [[255, 215, 230], [210, 160, 255], [255, 120, 200]],
  [[255, 245, 220], [190, 255, 230], [120, 220, 255]],
];
function galaksiSprite(seed, tip, kol, ton, S) {
  S = S || 256; const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), r = rng(seed), m = S / 2, P = GTON[ton % GTON.length];
  const rg = (a, b) => `rgba(${a[0]},${a[1]},${a[2]},${b})`;
  x.globalCompositeOperation = 'lighter';
  let g = x.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, rg(P[0], 0.5)); g.addColorStop(0.12, rg(P[0], 0.22)); g.addColorStop(0.45, rg(P[1], 0.05)); g.addColorStop(1, rg(P[1], 0));
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const gauss = () => (r() + r() + r() - 1.5) / 1.5;
  if (tip === 'sarmal') {
    const N = Math.round(S * 11);
    for (let i = 0; i < N; i++) {
      const arm = i % kol, tt = Math.pow(r(), 0.75), rad = tt * m * 0.95;
      const th = arm * TAU / kol + Math.log(1 + rad / (m * 0.05)) * 2.25 + gauss() * (0.42 - tt * 0.2);
      const px = m + Math.cos(th) * rad + gauss() * 3, py = m + Math.sin(th) * rad + gauss() * 3;
      const hii = r() < 0.05, col = hii ? P[2] : (r() < 0.25 * (1 - tt) ? P[0] : P[1]);
      const a = (hii ? 0.5 : 0.1 + 0.28 * (1 - tt)) * (0.5 + r() * 0.5), s = (hii ? 1.4 : 0.7 + r() * 1.3) * S / 256;
      x.fillStyle = rg(col, a.toFixed(3)); x.fillRect(px, py, s, s);
    }
  } else {
    const N = Math.round(S * 9);
    for (let i = 0; i < N; i++) { const rad = Math.abs(gauss()) * m * 0.75, th = r() * TAU; x.fillStyle = rg(r() < 0.6 ? P[0] : P[1], (0.07 + 0.25 * (1 - rad / m)).toFixed(3)); x.fillRect(m + Math.cos(th) * rad, m + Math.sin(th) * rad, 1.1 * S / 256, 1.1 * S / 256); }
  }
  g = x.createRadialGradient(m, m, 0, m, m, m * 0.13); g.addColorStop(0, 'rgba(255,255,245,.95)'); g.addColorStop(0.4, rg(P[0], 0.5)); g.addColorStop(1, rg(P[0], 0));
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return c;
}
const NTON = [[[255, 90, 160], [110, 130, 255]], [[90, 200, 255], [150, 90, 255]], [[255, 150, 90], [255, 80, 130]], [[90, 255, 200], [60, 120, 255]], [[200, 120, 255], [255, 120, 200]], [[255, 210, 140], [120, 170, 255]]];
function nebulaSprite(seed, S) {
  S = S || 160; const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), im = x.createImageData(S, S), d = im.data;
  const N = gurultu(seed), r = rng(seed), P = NTON[(r() * NTON.length) | 0], ox = r() * 50, oy = r() * 50;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const X = i / S * 2 - 1, Y = j / S * 2 - 1, q = Math.sqrt(X * X + Y * Y), o = (j * S + i) * 4;
    const fall = Math.max(0, 1 - q * 1.08); if (fall <= 0) continue;
    const f = N.f(X * 2.2 + ox, Y * 2.2 + oy, 5), g = N.f(X * 3.5 + 40, Y * 3.5 + 11, 4), toz = N.f(X * 5 + 70, Y * 5 + 3, 4);
    let v = Math.max(0, f - 0.36) * 2.6 * Math.pow(fall, 1.4); if (toz > 0.58) v *= Math.max(0, 1 - (toz - 0.58) * 6);
    const m = kis(g * 1.6 - 0.3, 0, 1);
    d[o] = lerp(P[0][0], P[1][0], m); d[o + 1] = lerp(P[0][1], P[1][1], m); d[o + 2] = lerp(P[0][2], P[1][2], m); d[o + 3] = kis(v * 255, 0, 255);
  }
  x.putImageData(im, 0, 0); return c;
}
function yildizKarosu(seed, S, n, boy, parlak) {
  const c = document.createElement('canvas'); c.width = c.height = Math.round(S * DPR); const x = c.getContext('2d'), r = rng(seed); x.scale(DPR, DPR);
  for (let i = 0; i < n; i++) {
    const px = r() * S, py = r() * S, k = r(), s = boy[0] + Math.pow(r(), 3) * (boy[1] - boy[0]);
    const col = k < 0.12 ? '255,205,170' : k < 0.3 ? '190,210,255' : k < 0.36 ? '255,170,150' : '240,244,255';
    const a = (0.25 + r() * 0.75) * parlak;
    if (s > 1.3) { const g = x.createRadialGradient(px, py, 0, px, py, s * 3.2); g.addColorStop(0, `rgba(${col},${(a * 0.45).toFixed(2)})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(px - s * 3.2, py - s * 3.2, s * 6.4, s * 6.4); }
    x.fillStyle = `rgba(${col},${a.toFixed(2)})`; x.beginPath(); x.arc(px, py, s / 2, 0, TAU); x.fill();
  }
  return c;
}

/* ================= gezegen dokusu ================= */
const DOKU = new Map(), KUYRUK = []; let kareNo = 0;
function dokuIste(p) { if (!p._kuy) { p._kuy = 1; KUYRUK.push(p); } }
function dokuUret(p) {
  const S = Math.round(kis(p.r * 2.4, 96, 400)), c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'), im = x.createImageData(S, S), d = im.data, N = gurultu(p.seed), r = rng(p.seed ^ 0x55), tip = p.tip;
  const tm = [1 + p.ton[0] * 0.22, 1 + p.ton[1] * 0.18, 1 + p.ton[2] * 0.22];
  const kr = []; if (tip === 'kaya' || tip === 'buz' || tip === 'col') for (let i = 0; i < 46; i++) kr.push([r() * 2 - 1, r() * 2 - 1, 0.025 + r() * r() * 0.17]);
  const leke = (tip === 'gaz' || tip === 'buzdevi') && r() < 0.65 ? [r() * 1.2 - 0.6, r() * 1.2 - 0.6, 0.12 + r() * 0.1] : null;
  const deniz = tip === 'okyanus' ? 0.56 : 0.45, bf = 10 + r() * 10, ox = r() * 90, oy = r() * 90;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const X = (i + 0.5) / S * 2 - 1, Y = (j + 0.5) / S * 2 - 1, q = X * X + Y * Y, o = (j * S + i) * 4;
    if (q > 1) continue;
    const Z = Math.sqrt(1 - q), k = 1 / (0.5 + Z * 0.5), u = X * k * 1.5 + ox, v = Y * k * 1.5 + oy;
    let R = 128, G = 128, B = 128;
    if (tip === 'gaz' || tip === 'buzdevi') {
      const tb = Y * k + (N.f(u * 1.6, v * 3, 4) - 0.5) * 0.3, s = 0.5 + 0.5 * Math.sin(tb * bf + N.n(u * 3, v * 2) * 2.2), s2 = 0.5 + 0.5 * Math.sin(tb * bf * 2.7 + 1);
      const A = tip === 'gaz' ? [226, 196, 150] : [160, 215, 235], Bc = tip === 'gaz' ? [168, 110, 72] : [85, 150, 200], C = tip === 'gaz' ? [245, 232, 205] : [215, 245, 252];
      R = lerp(lerp(A[0], Bc[0], s), C[0], s2 * 0.4); G = lerp(lerp(A[1], Bc[1], s), C[1], s2 * 0.4); B = lerp(lerp(A[2], Bc[2], s), C[2], s2 * 0.4);
      if (leke) { const dx = (X - leke[0]) / (leke[2] * 1.6), dy = (Y - leke[1]) / leke[2], e = dx * dx + dy * dy; if (e < 1) { const m = (1 - e) * 0.8; R = lerp(R, tip === 'gaz' ? 190 : 60, m); G = lerp(G, tip === 'gaz' ? 90 : 110, m); B = lerp(B, tip === 'gaz' ? 60 : 190, m); } }
    } else if (tip === 'okyanus' || tip === 'orman') {
      const h = N.f(u * 1.7, v * 1.7, 6);
      if (h < deniz) { const e = Math.pow(h / deniz, 3); R = lerp(14, 40, e); G = lerp(40, 112, e); B = lerp(95, 170, e); }
      else { const e = (h - deniz) / (1 - deniz); if (tip === 'orman') { R = lerp(55, 130, e * 1.4); G = lerp(125, 115, e); B = lerp(55, 70, e); } else { R = lerp(70, 150, e * 1.3); G = lerp(120, 125, e); B = lerp(60, 85, e); } if (e < 0.04) { R += 50; G += 45; B += 25; } }
      const kut = Math.abs(Y) + (N.n(u * 4, v * 4) - 0.5) * 0.12; if (kut > 0.84) { R = G = 238; B = 248; }
      const bul = kis((N.f(u * 2.4 + 40, v * 3.6 + 7, 5) - 0.5) * 3.2, 0, 0.88); R = lerp(R, 250, bul); G = lerp(G, 252, bul); B = lerp(B, 255, bul);
    } else if (tip === 'col') {
      const h = N.f(u * 2, v * 2, 5), dn = 0.06 * Math.sin((u + v * 0.35) * 28 + h * 12); const e = kis(h + dn, 0, 1);
      R = lerp(180, 240, e); G = lerp(115, 190, e); B = lerp(65, 125, e);
    } else if (tip === 'kaya') {
      const h = N.f(u * 2.4, v * 2.4, 6); R = G = B = lerp(80, 170, h); R += 12; B -= 8;
    } else if (tip === 'buz') {
      const h = N.f(u * 2, v * 2, 5); R = lerp(185, 245, h); G = lerp(215, 250, h); B = 255;
      if (Math.abs(N.f(u * 3 + 20, v * 3, 4) - 0.5) < 0.018) { R -= 90; G -= 50; B -= 20; }
    } else if (tip === 'lav') {
      const h = N.f(u * 2, v * 2, 5); R = lerp(30, 75, h); G = lerp(20, 40, h); B = lerp(20, 32, h);
      const m = Math.abs(N.f(u * 2.6 + 5, v * 2.6, 5) - 0.5), gl = Math.pow(kis(1 - m / 0.07, 0, 1), 2);
      R = lerp(R, 255, gl); G = lerp(G, 140, gl); B = lerp(B, 40, gl);
    } else if (tip === 'zehir') {
      const h = N.f(u * 1.4, v * 4.2, 5), e = 0.5 + 0.5 * Math.sin(h * 14);
      R = lerp(165, 215, e); G = lerp(170, 220, e); B = lerp(60, 110, e);
    }
    for (const c2 of kr) { const dd = Math.hypot(X - c2[0], Y - c2[1]) / c2[2]; if (dd < 1.15) { const f = dd < 0.85 ? 0.72 + dd * 0.2 : 1.18; R *= f; G *= f; B *= f; } }
    const limb = 0.5 + 0.5 * Math.pow(Z, 0.55);
    const a = kis((1 - Math.sqrt(q)) * S * 0.5, 0, 1);
    d[o] = kis(R * tm[0] * limb, 0, 255); d[o + 1] = kis(G * tm[1] * limb, 0, 255); d[o + 2] = kis(B * tm[2] * limb, 0, 255); d[o + 3] = a * 255;
  }
  x.putImageData(im, 0, 0);
  DOKU.set(p.id, { c, k: kareNo });
  if (DOKU.size > 50) { let e = null, ek = Infinity; for (const [k, v] of DOKU) if (v.k < ek) { ek = v.k; e = k; } DOKU.delete(e); }
}

