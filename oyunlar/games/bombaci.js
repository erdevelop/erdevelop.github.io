/* Bombacı — 13×11 labirentte bomba bırak, kutuları kır, güçlendiricileri topla, rakiplerini alevin içinde bırak.
   Bilgisayara karşı (1–3 rakip, üç zorluk) ya da çevrimiçi 2–4 kişi (boş koltuklara bilgisayar oturur).
   Çevrimiçi düzen: masayı yöneten cihaz oyunu yürütür ve durumu saniyede ~10 kez yazar; diğerleri yalnızca yön/bomba girdisini
   hazır ifade kanalından (m, i = 20…39) gönderir. Yönetici ayrılırsa sıradaki oyuncu son durumdan devam eder. */
(function () {
'use strict';
const W = 13, H = 11, DIR = [[0, 0], [0, -1], [1, 0], [0, 1], [-1, 0]], SURE = 120000, FITIL = 2400, ALEV = 550, ANI = 260;
const BAS = [[1, 1], [W - 2, H - 2], [W - 2, 1], [1, H - 2]];
const SPIRAL = (() => { const L = []; let x0 = 1, y0 = 1, x1 = W - 2, y1 = H - 2; while (x0 <= x1 && y0 <= y1) { for (let x = x0; x <= x1; x++) L.push(y0 * W + x); for (let y = y0 + 1; y <= y1; y++) L.push(y * W + x1); if (y1 > y0) for (let x = x1 - 1; x >= x0; x--) L.push(y1 * W + x); if (x1 > x0) for (let y = y1 - 1; y > y0; y--) L.push(y * W + x0); x0++; y0++; x1--; y1--; } return L.filter(c => { const x = c % W, y = (c / W) | 0; return !(x % 2 === 0 && y % 2 === 0); }); })();
function rnd(S) { let t = S.rs = (S.rs + 0x6D2B79F5) | 0; t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const hiz = P => 3.2 + 0.6 * P.h;
const hc = P => Math.round(P.y) * W + Math.round(P.x);
function harita(S) {
  const g = [], u = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0; if (!x || !y || x === W - 1 || y === H - 1 || (x % 2 === 0 && y % 2 === 0)) v = 1;
    else if (!BAS.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) <= 1) && rnd(S) < 0.72) v = 2;
    g.push(v); let k = 0; if (v === 2 && rnd(S) < 0.32) { const r = rnd(S); k = r < 0.4 ? 1 : r < 0.8 ? 2 : 3; } u.push(k);
  }
  S.g = g; S.u = u;
}
function yeniTur(S) {
  harita(S); S.tur++; S.z = 0; S.ani = -1; S.B = []; S.F = []; S.d = 'hazir'; S.bek = 1600; S.kaz = -2;
  S.P = Array.from({ length: S.n }, (_, p) => { const [x, y] = BAS[p]; return { x, y, tx: x, ty: y, can: 1, bm: 1, a: 1, h: 0, yon: 3 }; });
}
function yeni(o) { const S = { n: o.n, bot: o.bot || [], sev: o.sev == null ? 1 : o.sev, hedef: o.hedef || 3, gl: Array(o.n).fill(0), tur: 0, mac: o.mac || 1, rs: o.seed | 0, kazanan: -1 }; yeniTur(S); return S; }
function bombaVar(S, x, y) { return S.B.some(b => b.x === x && b.y === y); }
function gecer(S, x, y) { if (x < 0 || y < 0 || x >= W || y >= H) return false; return !S.g[y * W + x] && !bombaVar(S, x, y); }
function hareket(S, P, d, dt, tek) {
  let kal = hiz(P) * dt / 1000;
  for (let k = 0; k < 4 && kal > 1e-6; k++) {
    if (P.x === P.tx && P.y === P.ty) {
      if (!d || (tek && k)) return; P.yon = d; const nx = P.tx + DIR[d][0], ny = P.ty + DIR[d][1]; if (!gecer(S, nx, ny)) return; P.tx = nx; P.ty = ny;
    } else if (d) {
      const mx = Math.sign(P.tx - P.x), my = Math.sign(P.ty - P.y);
      if (DIR[d][0] === -mx && DIR[d][1] === -my) { const ox = P.tx - mx, oy = P.ty - my; if (!bombaVar(S, ox, oy) && !S.g[oy * W + ox]) { P.tx = ox; P.ty = oy; P.yon = d; } }
    }
    const dx = P.tx - P.x, dy = P.ty - P.y, uz = Math.abs(dx) + Math.abs(dy), a = Math.min(kal, uz);
    P.x += Math.sign(dx) * a; P.y += Math.sign(dy) * a; kal -= a;
    if (Math.abs(P.tx - P.x) < 1e-6 && Math.abs(P.ty - P.y) < 1e-6) { P.x = P.tx; P.y = P.ty; }
  }
}
function bombaKoy(S, p) {
  const P = S.P[p], x = Math.round(P.x), y = Math.round(P.y);
  if (!P.can || S.B.filter(b => b.s === p).length >= P.bm || bombaVar(S, x, y) || S.g[y * W + x]) return false;
  S.B.push({ x, y, t: FITIL, r: P.a, s: p }); return true;
}
function alan(S, b, B) {
  const L = [b.y * W + b.x];
  for (let d = 1; d <= 4; d++) for (let i = 1; i <= b.r; i++) {
    const x = b.x + DIR[d][0] * i, y = b.y + DIR[d][1] * i, c = y * W + x;
    if (S.g[c] === 1) break; L.push(c); if (S.g[c] === 2 || (B || S.B).some(o => o !== b && o.x === x && o.y === y) || (S.u[c] && !S.g[c])) break;
  }
  return L;
}
function patlat(S, b) {
  for (const c of alan(S, b)) {
    const x = c % W, y = (c / W) | 0, o = S.B.find(q => q.x === x && q.y === y);
    if (o) o.t = 0;
    if (S.g[c] === 2) S.g[c] = 0; else if (S.u[c] && c !== b.y * W + b.x) S.u[c] = 0;
    S.F.push({ x, y, t: ALEV, s: b.s });
  }
}
/* bir zaman adımı; girdiler inp[p] = { d, b } (b işlenince sıfırlanır). Olay listesi döner. */
function adim(S, dt, inp) {
  const ol = [];
  if (S.d === 'bitti') return ol;
  if (S.d === 'hazir') { S.bek -= dt; if (S.bek <= 0) { S.d = 'oyna'; ol.push(['basla']); } return ol; }
  if (S.d === 'tur') { S.bek -= dt; if (S.bek <= 0) { if (S.kazanan >= 0) { S.d = 'bitti'; ol.push(['bitti', S.kazanan]); } else yeniTur(S); } return ol; }
  S.z += dt;
  S.P.forEach((P, p) => {
    if (!P.can) return; const I = inp[p] || { d: 0 };
    if (I.b) { I.b = 0; if (bombaKoy(S, p)) ol.push(['bomba', p]); }
    hareket(S, P, I.d | 0, dt, I.tek);
    const c = hc(P), k = S.u[c];
    if (!S.g[c] && k) { S.u[c] = 0; if (k === 1) P.bm = Math.min(8, P.bm + 1); else if (k === 2) P.a = Math.min(8, P.a + 1); else P.h = Math.min(5, P.h + 1); ol.push(['al', p, k]); }
  });
  S.B.forEach(b => b.t -= dt);
  let pat = 0; for (;;) { const i = S.B.findIndex(b => b.t <= 0); if (i < 0) break; patlat(S, S.B.splice(i, 1)[0]); pat++; }
  if (pat) ol.push(['patla', pat]);
  S.F.forEach(f => f.t -= dt); S.F = S.F.filter(f => f.t > 0);
  if (S.z > SURE) { const k = Math.min(SPIRAL.length - 1, Math.floor((S.z - SURE) / ANI)); while (S.ani < k) { S.ani++; const c = SPIRAL[S.ani]; S.g[c] = 1; S.u[c] = 0; S.B = S.B.filter(b => b.y * W + b.x !== c); } }
  const yanan = new Map(S.F.map(f => [f.y * W + f.x, f.s]));
  S.P.forEach((P, p) => { if (!P.can) return; const c = hc(P); if (yanan.has(c) || S.g[c] === 1) { P.can = 0; ol.push(['ol', p, yanan.has(c) ? yanan.get(c) : -1]); } });
  const sag = S.P.map((P, p) => P.can ? p : -1).filter(p => p >= 0);
  if (sag.length <= 1) {
    S.d = 'tur'; S.bek = 2400; S.kaz = sag.length ? sag[0] : -1;
    if (sag.length) { S.gl[sag[0]]++; if (S.gl[sag[0]] >= S.hedef) S.kazanan = sag[0]; }
    ol.push(['tur', S.kaz]);
  }
  return ol;
}
/* ---------- bilgisayar ---------- */
function tehlike(S, ek) {
  const T = new Array(W * H).fill(Infinity); S.F.forEach(f => { T[f.y * W + f.x] = -1; });
  const B = S.B.map(b => ({ x: b.x, y: b.y, t: b.t, r: b.r })).concat(ek || []);
  const A = B.map(b => alan(S, b, B));
  for (let it = 0; it < 4; it++) B.forEach((b, i) => A[i].forEach(c => { const o = B.find(q => q !== b && q.y * W + q.x === c); if (o && o.t > b.t) o.t = b.t; }));
  B.forEach((b, i) => A[i].forEach(c => { T[c] = Math.min(T[c], b.t); }));
  return T;
}
function bfs(S, p, T, sinir) {
  const P = S.P[p], st = 1000 / hiz(P), bas = P.ty * W + P.tx, D = new Map([[bas, { n: 0, d: 0 }]]), Q = [bas];
  while (Q.length) {
    const c = Q.shift(), o = D.get(c); if (o.n >= (sinir || 16)) continue; const x = c % W, y = (c / W) | 0;
    for (let d = 1; d <= 4; d++) {
      const nx = x + DIR[d][0], ny = y + DIR[d][1], n = ny * W + nx; if (D.has(n) || !gecer(S, nx, ny)) continue;
      const tau = (o.n + 1) * st; if (T[n] !== Infinity && !(tau + 260 < T[n] || tau > T[n] + ALEV + 180)) continue;
      D.set(n, { n: o.n + 1, d: o.d || d }); Q.push(n);
    }
  }
  return D;
}
function kacis(S, p, T, enAz) { let en = null, say = 0; for (const [c, o] of bfs(S, p, T)) if (T[c] === Infinity) { say++; if (!en || o.n < en.n) en = o; } return say >= (enAz || 1) ? en : null; }
function vurur(S, x, y, r, p, dusman) {
  let v = 0; const b = { x, y, r };
  for (const c of alan(S, b)) { if (S.g[c] === 2) v += 2; if (dusman) S.P.forEach((Q, q) => { if (q !== p && Q.can && (Q.ty * W + Q.tx === c || hc(Q) === c)) v += dusman; }); }
  return v;
}
const SEV = [{ dus: 1, bek: 380, kacir: 0.18 }, { dus: 4, bek: 140, kacir: 0.05 }, { dus: 8, bek: 0, kacir: 0 }];
function bot(S, p, hafiza) {
  const P = S.P[p], K = SEV[S.sev] || SEV[1], I = { d: 0, b: 0 };
  const T = tehlike(S), c = P.ty * W + P.tx;
  if (T[c] !== Infinity) { const k = kacis(S, p, T); I.d = k ? k.d : 0; return I; }
  if (hafiza.t > 0) return I;
  hafiza.t = K.bek * (0.6 + Math.random() * 0.8);
  const bombaHak = S.B.filter(b => b.s === p).length < P.bm;
  if (bombaHak && Math.random() >= K.kacir) {
    const v = vurur(S, P.tx, P.ty, P.a, p, K.dus);
    if (v > 0) { const T2 = tehlike(S, [{ x: P.tx, y: P.ty, t: FITIL, r: P.a }]); const yakin = S.P.some((Q, q) => q !== p && Q.can && Math.abs(Q.tx - P.tx) + Math.abs(Q.ty - P.ty) <= 5), k = kacis(S, p, T2, S.sev && yakin ? 3 : 1); if (k && k.n > 0) { I.b = 1; I.d = k.d; return I; } }
  }
  const D = bfs(S, p, T, 14); let en = null, enP = -Infinity;
  for (const [n, o] of D) {
    if (T[n] !== Infinity || !o.d) continue; const x = n % W, y = (n / W) | 0; let v = 0;
    if (S.u[n] && !S.g[n]) v += 7;
    if (bombaHak) v += vurur(S, x, y, P.a, p, K.dus);
    if (K.dus) S.P.forEach((Q, q) => { if (q !== p && Q.can) v += Math.max(0, 3 - (Math.abs(Q.tx - x) + Math.abs(Q.ty - y))) * 0.6; });
    const puan = v * 6 - o.n + Math.random() * 0.8; if (v > 0 && puan > enP) { enP = puan; en = o; }
  }
  if (en) I.d = en.d;
  else { const A = [...D].filter(([n, o]) => o.n === 1 && T[n] === Infinity); if (A.length && Math.random() < 0.5) I.d = A[(Math.random() * A.length) | 0][1].d; }
  return I;
}
const BC = { W, H, yeni, yeniTur, adim, bot, tehlike, bombaKoy, SPIRAL };
if (typeof module !== 'undefined' && module.exports) { module.exports = BC; return; }
if (!window.registerGame) return;

/* ---------- görünüm ---------- */
const RENK = ['#f49ab0', '#7fb8f0', '#f5c94f', '#b49cf2'], KOYU = ['#c9617c', '#4f86c2', '#c99a1c', '#7e63c4'];
const ADLAR_YZ = ['Sen', 'Mavi', 'Sarı', 'Mor'], SEVAD = ['Kolay', 'Orta', 'Zor'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CSS = `
.bc-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.bc{width:min(560px,100%);margin:0 auto;display:flex;flex-direction:column;gap:7px;-webkit-user-select:none;user-select:none;position:relative}
.bc-ust{display:flex;gap:5px;align-items:stretch}
.bc-oy{flex:1;display:flex;gap:4px;min-width:0}.bc-oy>div{flex:1;min-width:0;padding:3px 4px;border-radius:11px;background:color-mix(in srgb,var(--c) 16%,var(--bg2));font-size:10.5px;font-weight:800;line-height:1.25;display:flex;flex-direction:column;align-items:center;border:2px solid transparent}
.bc-oy>div.ben{border-color:var(--c)}.bc-oy>div.olu{opacity:.45}.bc-oy span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bc-oy i{font-style:normal;color:var(--c);letter-spacing:1px;font-size:12px}
.bc-sure{flex:none;width:56px;border-radius:11px;background:var(--bg2);display:grid;place-items:center;font-weight:900;font-size:15px}.bc-sure.ani{background:#fde2e2;color:#c0392b}
.bc-ust>button{flex:none;width:40px;border-radius:11px;background:var(--bg2);font-weight:900;font-size:16px;color:var(--ink)}
.bc canvas{display:block;margin:0 auto;border-radius:12px;touch-action:none;box-shadow:0 2px 0 rgba(0,0,0,.06)}
.bc-alt{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 6px}
.bc-joy{width:128px;height:128px;border-radius:50%;background:var(--bg2);position:relative;touch-action:none;flex:none;box-shadow:inset 0 0 0 2px rgba(0,0,0,.04)}
.bc-joy b{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:var(--accent-soft);box-shadow:0 2px 0 rgba(0,0,0,.08);transition:transform .06s}
.bc-joy::before{content:'▲  ▶  ▼  ◀';position:absolute;inset:0;display:none}
.bc-guc{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12.5px;font-weight:800;color:var(--ink-soft)}
.bc-bomba{width:104px;height:104px;border-radius:50%;background:#3d4270;color:#fff;font-size:38px;flex:none;box-shadow:0 4px 0 #262a4d;touch-action:none}.bc-bomba:active{transform:translateY(3px);box-shadow:0 1px 0 #262a4d}
.bc-not{text-align:center;font-size:12px;font-weight:700;color:var(--ink-soft)}
.bc-menu{display:flex;flex-direction:column;gap:9px;padding:6px 4px}.bc-menu h2{margin:4px 0 0;text-align:center;font-size:26px}.bc-menu p{margin:0;font-weight:600;color:var(--ink-soft);line-height:1.45;font-size:14px}
.bc-b{padding:13px;border-radius:13px;background:var(--bg2);font-weight:800;font-size:15px;color:var(--ink)}.bc-b.ana{background:var(--accent);color:#fff}
.bc-sec{display:flex;gap:6px;align-items:center}.bc-sec>span{flex:none;width:92px;font-weight:800;font-size:13px;color:var(--ink-soft)}.bc-sec button{flex:1;padding:10px 0;border-radius:11px;background:var(--bg2);font-weight:800;color:var(--ink)}.bc-sec button.ak{background:var(--accent-soft);color:var(--accent-ink);box-shadow:inset 0 0 0 2px var(--accent)}
.bc-son{position:absolute;inset:0;display:grid;place-items:center;background:rgba(40,40,70,.55);border-radius:14px;z-index:5}
.bc-son>div{width:min(320px,90%);background:var(--card);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:9px;text-align:center}.bc-son h3{margin:0;font-size:22px}.bc-son p{margin:0;font-weight:700;color:var(--ink-soft)}
@media (hover:hover) and (pointer:fine){.bc-alt{display:none}}
`;
registerGame({
  id: 'bombaci', title: 'Bombacı', category: 'Refleks', tags: 'bombacı bomba labirent bomberman benzeri retro aksiyon çok oyunculu çevrimiçi 4 kişilik bilgisayara karşı', noRestart: true,
  aciklama: 'Klasik bomba bırakma oyunu: labirentte kutuları patlat, güçlendiricileri topla, rakiplerini alevde bırak. Bilgisayara karşı ya da çevrimiçi 2–4 kişi.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#dff2d8"/>' + Array.from({ length: 49 }, (_, i) => { const x = i % 7, y = (i / 7) | 0; return (!x || !y || x === 6 || y === 6 || (x % 2 === 0 && y % 2 === 0)) ? `<rect x="${3 + x * 12}" y="${3 + y * 12}" width="11.500" height="11.500" rx="3" fill="#a9b0d6"/>` : ([[3, 1], [1, 3], [5, 3], [3, 5]].some(([a, b]) => a === x && b === y) ? `<rect x="${3 + x * 12}" y="${3 + y * 12}" width="11.500" height="11.500" rx="2.500" fill="#f3c9a1"/>` : ''); }).join('') + '<rect x="27" y="39" width="35" height="11" rx="4" fill="#ffc27a"/><rect x="39" y="27" width="11" height="35" rx="4" fill="#ffc27a"/><circle cx="44.500" cy="44.500" r="6" fill="#3d4270"/><circle cx="21" cy="21" r="6" fill="#f49ab0"/><circle cx="19" cy="20" r="1.600" fill="#fff"/><circle cx="23" cy="20" r="1.600" fill="#fff"/><circle cx="69" cy="69" r="6" fill="#7fb8f0"/></svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="14" r="7"/><path d="M15.500 8.500 18 6M18 6l1.500-1.500M18 6l2 .500M18 6l-.500-2"/></svg>',
  shareText() { return this._paylas || 'Bombacı: labirentte bomba bırak, son ayakta kalan kazanır.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('bc-css')) { const s = document.createElement('style'); s.id = 'bc-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('bc-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } }, titre = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };
    let D = Object.assign({ v: 1, rakip: 2, sev: 1, ak: 4, oyn: 0, galip: 0 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'bc' }); root.append(kok);
    const q = s => kok.querySelector(s);
    /* oyun durumu */
    let S = null, mod = 'yz', oda = null, izle = false, ben = 0, lobi = null, odaBirak = null, mesajBirak = null, sohbetK = null;
    let raf = 0, son = 0, yayT = 0, onceki = null, alindi = 0, hafiza = [], inp = [], benInp = { d: 0, b: 0 }, sayilan = '', cv = null, cx = null, ts = 24, dpr = 1;
    const yonetici = () => mod === 'yz' || (oda && !izle && oda.yonetici());
    const ad = p => { if (mod === 'yz') return p === 0 ? 'Sen' : ADLAR_YZ[p]; const K = oda ? oda.koltuklar() : []; return K[p] ? K[p].n : 'Bot'; };
    const botMu = p => mod === 'yz' ? p > 0 : (S && S.bot[p]) || !(oda && oda.koltuklar()[p] && oda.koltuklar()[p].var);
    function temizle() {
      cancelAnimationFrame(raf); raf = 0; if (sohbetK) { sohbetK.kapat(); sohbetK = null; } if (mesajBirak) { mesajBirak(); mesajBirak = null; }
      if (lobi) { const x = lobi.kapat && lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } S = null;
    }
    /* ---------- menü ---------- */
    function menu() {
      temizle(); mod = 'yz';
      const sec = (k, A) => A.map(([v, t]) => `<button data-s="${k}" data-v="${v}" class="${D[k] === v ? 'ak' : ''}">${t}</button>`).join('');
      kok.innerHTML = `<div class="bc-menu"><h2>💣 Bombacı</h2><p>Labirentte bomba bırak, kutuları kır, güçlendiricileri topla. Alevler artı şeklinde yayılır; son ayakta kalan turu alır. <b>3 tur</b> alan maçı kazanır.</p>
        <div class="bc-sec"><span>Rakip</span>${sec('rakip', [[1, '1'], [2, '2'], [3, '3']])}</div>
        <div class="bc-sec"><span>Zorluk</span>${sec('sev', [[0, 'Kolay'], [1, 'Orta'], [2, 'Zor']])}</div>
        <button class="bc-b ana" data-a="yz">▶ Bilgisayara karşı</button><button class="bc-b" data-a="ag">🌐 Çevrimiçi (2–4 kişi)</button><button class="bc-b" data-a="nasil">❓ Nasıl oynanır</button>
        ${D.oyn ? `<p style="text-align:center">${D.oyn} maç · ${D.galip} galibiyet</p>` : ''}</div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/bombaci/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="bc-menu"><h2>Nasıl oynanır</h2>
        <p>• <b>Telefonda:</b> soldaki yuvarlak kolu sürükleyerek yürü, sağdaki 💣 düğmesiyle bomba bırak. <b>Bilgisayarda:</b> ok tuşları ya da WASD, bomba için boşluk.</p>
        <p>• Bomba yaklaşık 2,5 saniye sonra patlar; alev dört yöne yayılır. Gri sütunlar sağlamdır, turuncu kutular kırılır.</p>
        <p>• Kutuların altından güçlendirici çıkabilir: 💣 bir bomba daha, 🔥 daha uzun alev, 👟 daha hızlı yürüme. Alev güçlendiricileri de yakar.</p>
        <p>• Bombalar zincirleme patlar. Kendi bombandan da yanarsın; bırakınca hemen bir köşeye saklan!</p>
        <p>• Tur 2 dakikayı geçerse kenarlardan duvar örülmeye başlar. Son ayakta kalan turu alır; 3 tur alan maçı kazanır.</p>
        <button class="bc-b ana" data-a="menu">Tamam</button></div>`;
    }
    /* ---------- oyun ekranı ---------- */
    function ekran() {
      kok.innerHTML = `<div class="bc-ust"><button data-a="cik" aria-label="Çık">‹</button><div class="bc-oy" id="bc-oy"></div><div class="bc-sure" id="bc-sure">2:00</div></div>
        <canvas id="bc-c"></canvas>
        <div class="bc-alt"><div class="bc-joy" id="bc-joy"><b></b></div><div class="bc-guc" id="bc-guc"></div><button class="bc-bomba" id="bc-bomba" aria-label="Bomba bırak">💣</button></div>
        <div class="bc-not" id="bc-not"></div>`;
      cv = q('#bc-c'); cx = cv.getContext('2d'); boyut(); kontroller();
      q('#bc-not').textContent = matchMedia('(hover:hover) and (pointer:fine)').matches ? 'Ok tuşları / WASD ile yürü, boşlukla bomba bırak.' : '';
    }
    function boyut() {
      if (!cv) return; dpr = Math.min(2, devicePixelRatio || 1);
      const ust = cv.getBoundingClientRect().top + scrollY, alt = matchMedia('(hover:hover) and (pointer:fine)').matches ? 40 : 160;
      ts = Math.max(14, Math.floor(Math.min((kok.clientWidth - 4) / W, (innerHeight - Math.max(60, ust - scrollY) - alt) / H)));
      cv.style.width = ts * W + 'px'; cv.style.height = ts * H + 'px'; cv.width = ts * W * dpr; cv.height = ts * H * dpr;
    }
    /* kontroller */
    function yonVer(d) { if (benInp.d === d) return; benInp.d = d; gonder(0); }
    function bombaBas() { if (!S || S.d !== 'oyna' || izle) return; benInp.b = 1; gonder(1); }
    function gonder(b) { if (mod !== 'ag' || izle || !oda || yonetici()) return; oda.mesaj(20 + benInp.d * 2 + (b ? 1 : 0)); }
    function kontroller() {
      const joy = q('#bc-joy'), dugme = joy.querySelector('b'); let id = null;
      const yon = e => { const r = joy.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), u = Math.hypot(dx, dy), m = Math.min(1, u / 44);
        dugme.style.transform = `translate(${(dx / (u || 1)) * m * 34}px,${(dy / (u || 1)) * m * 34}px)`;
        yonVer(u < 14 ? 0 : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 4) : (dy > 0 ? 3 : 1)); };
      joy.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; try { joy.setPointerCapture(id); } catch (x) { } yon(e); });
      joy.addEventListener('pointermove', e => { if (e.pointerId === id) yon(e); });
      const birak = e => { if (e.pointerId !== id) return; id = null; dugme.style.transform = ''; yonVer(0); };
      joy.addEventListener('pointerup', birak); joy.addEventListener('pointercancel', birak);
      q('#bc-bomba').addEventListener('pointerdown', e => { e.preventDefault(); bombaBas(); titre(12); });
    }
    const basili = [];
    const TUS = { ArrowUp: 1, w: 1, W: 1, ArrowRight: 2, d: 2, D: 2, ArrowDown: 3, s: 3, S: 3, ArrowLeft: 4, a: 4, A: 4 };
    const tusAsagi = e => { if (!cv || !S) return; const d = TUS[e.key]; if (d) { e.preventDefault(); if (!basili.includes(d)) basili.push(d); yonVer(d); } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'x' || e.key === 'X') { e.preventDefault(); if (!e.repeat) bombaBas(); } };
    const tusYukari = e => { const d = TUS[e.key]; if (!d) return; const i = basili.indexOf(d); if (i >= 0) basili.splice(i, 1); yonVer(basili[basili.length - 1] || 0); };
    addEventListener('keydown', tusAsagi); addEventListener('keyup', tusYukari);
    const odak = () => { basili.length = 0; yonVer(0); }; addEventListener('blur', odak);
    /* ---------- çizim ---------- */
    function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function ciz(t) {
      if (!S || !cx) return; const c = cx, s = ts * dpr; c.clearRect(0, 0, cv.width, cv.height);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, v = S.g[i], X = x * s, Y = y * s;
        c.fillStyle = (x + y) % 2 ? '#d6edcf' : '#dff2d8'; c.fillRect(X, Y, s, s);
        if (v === 1) { c.fillStyle = '#8f97c4'; rr(c, X + s * .04, Y + s * .1, s * .92, s * .88, s * .2); c.fill(); c.fillStyle = '#b3b9df'; rr(c, X + s * .04, Y + s * .02, s * .92, s * .8, s * .2); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(X + s * .2, Y + s * .14, s * .4, s * .08); }
        else if (v === 2) { c.fillStyle = '#e3b183'; rr(c, X + s * .06, Y + s * .1, s * .88, s * .86, s * .16); c.fill(); c.fillStyle = '#f3c9a1'; rr(c, X + s * .06, Y + s * .05, s * .88, s * .8, s * .16); c.fill(); c.strokeStyle = '#e0ad80'; c.lineWidth = Math.max(1, s * .05); c.beginPath(); c.moveTo(X + s * .1, Y + s * .45); c.lineTo(X + s * .9, Y + s * .45); c.moveTo(X + s * .5, Y + s * .08); c.lineTo(X + s * .5, Y + s * .45); c.moveTo(X + s * .3, Y + s * .45); c.lineTo(X + s * .3, Y + s * .82); c.moveTo(X + s * .7, Y + s * .45); c.lineTo(X + s * .7, Y + s * .82); c.stroke(); }
        else if (S.u[i]) { c.fillStyle = '#fffaf0'; rr(c, X + s * .14, Y + s * .14, s * .72, s * .72, s * .18); c.fill(); c.strokeStyle = ['', '#7fb8f0', '#f49ab0', '#8fd3a5'][S.u[i]]; c.lineWidth = s * .07; c.stroke(); c.font = `${s * .46}px system-ui,"Apple Color Emoji","Segoe UI Emoji"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['', '💣', '🔥', '👟'][S.u[i]], X + s / 2, Y + s * .54); }
      }
      for (const f of S.F) { const a = Math.min(1, f.t / (ALEV * .5)); c.globalAlpha = a; c.fillStyle = '#ffb35c'; rr(c, f.x * s + s * .06, f.y * s + s * .06, s * .88, s * .88, s * .3); c.fill(); c.fillStyle = '#fff0bf'; rr(c, f.x * s + s * .24, f.y * s + s * .24, s * .52, s * .52, s * .22); c.fill(); c.globalAlpha = 1; }
      for (const b of S.B) {
        const X = b.x * s + s / 2, Y = b.y * s + s / 2, nab = 1 + Math.sin(t / (b.t < 800 ? 60 : 140)) * .05, r = s * .34 * nab;
        c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(X, Y + s * .3, s * .3, s * .08, 0, 0, 7); c.fill();
        c.fillStyle = b.t < 600 && Math.floor(t / 90) % 2 ? '#6b4f8f' : '#3d4270'; c.beginPath(); c.arc(X, Y + s * .04, r, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(X - r * .35, Y - r * .3, r * .25, 0, 7); c.fill();
        c.strokeStyle = '#8a6a4a'; c.lineWidth = s * .06; c.beginPath(); c.moveTo(X + r * .4, Y - r * .75); c.quadraticCurveTo(X + r * .7, Y - r * 1.25, X + r * .95, Y - r * 1.1); c.stroke();
        c.fillStyle = Math.floor(t / 70) % 2 ? '#ffd166' : '#ff8c42'; c.beginPath(); c.arc(X + r * .95, Y - r * 1.1, s * .07, 0, 7); c.fill();
      }
      const kar = konumlar(t);
      S.P.forEach((P, p) => {
        if (!P.can) return; const [x, y] = kar[p], X = x * s + s / 2, Y = y * s + s / 2, r = s * .38, zip = Math.abs(Math.sin((x + y) * Math.PI)) * s * .05;
        c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.ellipse(X, Y + s * .36, s * .3, s * .08, 0, 0, 7); c.fill();
        c.fillStyle = KOYU[p]; c.beginPath(); c.arc(X, Y - zip + s * .03, r, 0, 7); c.fill(); c.fillStyle = RENK[p]; c.beginPath(); c.arc(X, Y - zip, r, 0, 7); c.fill();
        const [ex, ey] = DIR[P.yon || 3];
        c.fillStyle = '#fff'; const gz = ex ? [[X + ex * r * .3, Y - zip - r * .18], [X + ex * r * .62, Y - zip - r * .18]] : [[X - r * .36, Y - zip - r * .1 + ey * r * .12], [X + r * .36, Y - zip - r * .1 + ey * r * .12]];
        gz.forEach(([a, b]) => { c.beginPath(); c.arc(a, b, r * .25, 0, 7); c.fill(); });
        c.fillStyle = '#2b2d42'; gz.forEach(([a, b]) => { c.beginPath(); c.arc(a + ex * r * .09, b + ey * r * .09, r * .12, 0, 7); c.fill(); });
        if (p === ben && !izle && S.n > 1) { c.fillStyle = KOYU[p]; c.beginPath(); c.moveTo(X, Y - r - s * .1); c.lineTo(X - s * .1, Y - r - s * .24); c.lineTo(X + s * .1, Y - r - s * .24); c.fill(); }
      });
      if (S.d === 'hazir' || S.d === 'tur') {
        c.fillStyle = 'rgba(40,40,70,.35)'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${s * 1.1}px system-ui`;
        const m = S.d === 'hazir' ? (S.bek > 800 ? `${S.tur}. tur` : 'Başla!') : S.kaz >= 0 ? (S.kaz === ben && !izle ? 'Turu aldın!' : `${ad(S.kaz)} aldı`) : 'Berabere';
        c.fillText(m, cv.width / 2, cv.height / 2);
      }
    }
    /* çevrimiçi istemcide oyuncu konumları iki durum arasında yumuşatılır */
    function konumlar(t) {
      if (yonetici() || !onceki || onceki.length !== S.P.length) return S.P.map(P => [P.x, P.y]);
      const a = Math.min(1, (performance.now() - alindi) / 110);
      return S.P.map((P, p) => { const o = onceki[p]; if (!o || Math.abs(o[0] - P.x) + Math.abs(o[1] - P.y) > 2) return [P.x, P.y]; return [o[0] + (P.x - o[0]) * a, o[1] + (P.y - o[1]) * a]; });
    }
    function hud() {
      if (!S || !q('#bc-oy')) return;
      q('#bc-oy').innerHTML = S.P.map((P, p) => `<div style="--c:${KOYU[p]}" class="${p === ben && !izle ? 'ben' : ''}${P.can ? '' : ' olu'}"><span>${botMu(p) && mod === 'ag' ? '🤖' : ''}${esc(ad(p))}</span><i>${'★'.repeat(S.gl[p])}${'☆'.repeat(Math.max(0, S.hedef - S.gl[p]))}</i></div>`).join('');
      const kal = Math.max(0, SURE - S.z), su = q('#bc-sure'); su.textContent = S.z > SURE ? '⚠' : `${Math.floor(kal / 60000)}:${String(Math.floor(kal / 1000) % 60).padStart(2, '0')}`; su.classList.toggle('ani', S.z > SURE - 10000);
      const P = S.P[ben]; if (P && !izle) q('#bc-guc').innerHTML = `<span>💣 ${P.bm}</span><span>🔥 ${P.a}</span><span>👟 ${P.h + 1}</span>`;
    }
    let hudT = 0;
    /* ---------- olaylar ---------- */
    function olaylar(L) {
      for (const [t, p, k] of L) {
        if (t === 'bomba') ses('tap'); else if (t === 'patla') { ses('score'); titre(25); } else if (t === 'al' && (p === ben || mod === 'yz')) { if (p === ben) ses('click'); }
        else if (t === 'ol') { ses(p === ben && !izle ? 'lose' : 'bad'); if (p === ben) titre([40, 40, 60]); }
        else if (t === 'tur') { if (p === ben && !izle) ses('win'); } else if (t === 'basla') ses('click');
        else if (t === 'bitti') bitti();
      }
    }
    function bitti() {
      if (!S) return; const kaz = S.kazanan, anahtar = (oda ? oda.kod : 'yz') + ':' + S.mac;
      if (sayilan !== anahtar) {
        sayilan = anahtar; if (!izle) { D.oyn++; if (kaz === ben) { D.galip++; api.submitScore(D.galip); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } kaydet(); }
        try { window.Progress && Progress.olay('bombaci_bitti'); } catch (e) { }
        if (mod === 'ag' && oda && !izle && window.Masa && Masa.sonuc) Masa.sonuc(oda, kaz === ben ? 1 : 0, 'm' + S.mac);
        ses(kaz === ben && !izle ? 'win' : 'lose');
      }
      oyun._paylas = `Bombacı: ${kaz === ben && !izle ? 'maçı kazandım' : ad(kaz) + ' kazandı'} (${S.gl.join('–')})\nerdevelop.com/oyunlar/#o/bombaci`;
      if (q('.bc-son')) return;
      const rov = mod === 'yz' || yonetici();
      kok.insertAdjacentHTML('beforeend', `<div class="bc-son"><div><h3>${kaz === ben && !izle ? '🏆 Maçı kazandın!' : `${esc(ad(kaz))} kazandı`}</h3><p>Skor: ${S.gl.map((g, p) => `<b style="color:${KOYU[p]}">${g}</b>`).join(' – ')}</p>
        ${rov ? '<button class="bc-b ana" data-a="rovans">↻ Rövanş</button>' : '<p>Rövanşı masayı yöneten başlatabilir.</p>'}<button class="bc-b" data-a="paylas">Paylaş</button><button class="bc-b" data-a="menu">Menü</button></div></div>`);
      if (mod === 'ag' && oda && yonetici()) oda.bitir();
    }
    /* ---------- döngü ---------- */
    function dongu(t) {
      raf = requestAnimationFrame(dongu); let dt = Math.min(50, t - (son || t)); son = t; if (!S) return;
      if (yonetici() && S.d !== 'bitti') {
        if (mod === 'yz' && S.d === 'oyna' && !S.P[0].can) dt *= 2;
        inp[ben] = benInp;
        S.P.forEach((P, p) => { if (!botMu(p) || !P.can || S.d !== 'oyna') return; const h = hafiza[p] || (hafiza[p] = { t: 0 }); h.t -= dt; if (P.x === P.tx && P.y === P.ty) { const k = BC.bot(S, p, h); inp[p] = { d: k.d, b: k.b, tek: 1 }; } });
        for (let kal = dt; kal > 0; kal -= 20) olaylar(BC.adim(S, Math.min(20, kal), inp));
        if (mod === 'ag' && oda && (t - yayT > 100 || S.d === 'bitti')) { yayT = t; yay(); }
      }
      ciz(t); if (t - hudT > 200) { hudT = t; hud(); }
    }
    const yuvarla = (k, v) => typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v;
    function yay() { try { oda.yeniden(JSON.parse(JSON.stringify(S, yuvarla))); } catch (e) { } }
    function yzBasla() {
      temizle(); mod = 'yz'; izle = false; ben = 0; const n = 1 + D.rakip; hafiza = []; inp = []; benInp = { d: 0, b: 0 };
      S = BC.yeni({ n, sev: D.sev, hedef: 3, seed: (Math.random() * 2 ** 31) | 0 }); ekran(); hud(); son = 0; raf = requestAnimationFrame(dongu);
    }
    /* ---------- çevrimiçi ---------- */
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="bc-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="bc-b" data-a="menu">‹ Geri</button></div>'; return; }
      mod = 'ag';
      lobi = Masa.lobi(kok, { oyun: 'bombaci', koltuk: Math.max(2, Math.min(4, D.ak || 4)), koltukSec: [2, 4], enAz: 2, botlu: true, baslik: 'Bombacı', onGeri: menu,
        onIzle: o => { lobi = null; agBasla(o); },
        baslat: o => { const K = o.koltuklar(); return o.baslat(BC.yeni({ n: K.length, bot: K.map(x => !x), sev: 1, hedef: 3, seed: (Math.random() * 2 ** 31) | 0 })); },
        onOda: o => { lobi = null; agBasla(o); } });
    }
    function agBasla(o) {
      oda = o; mod = 'ag'; izle = !!o.izleyici; ben = izle ? 0 : Math.max(0, o.ben); hafiza = []; inp = []; benInp = { d: 0, b: 0 }; onceki = null;
      const d0 = o.durum(); S = d0; ekran(); if (S) hud();
      if (!izle) { if (window.Masa && Masa.sohbet) sohbetK = Masa.sohbet(o, { yer: q('.bc-ust'), sonra: q('[data-a=cik]'), koltuk: p => q('#bc-oy') && q('#bc-oy').children[p] }); if (izle) q('.bc-alt').style.display = 'none'; }
      else q('.bc-alt').style.display = 'none';
      mesajBirak = o.mesajDinle((uid, i) => { if (i < 20 || i >= 40 || !yonetici() || !S) return; const p = o.koltuklar().findIndex(x => x && x.uid === uid); if (p < 0 || p === ben) return; const k = i - 20, I = inp[p] || (inp[p] = { d: 0, b: 0 }); I.d = k >> 1; if (k & 1) I.b = 1; });
      let sonV = 0;
      odaBirak = o.dinle(v => {
        if (!v) { S = null; kok.innerHTML = '<div class="bc-menu"><p>Masa kapandı.</p><button class="bc-b ana" data-a="menu">Menü</button></div>'; return; }
        if (yonetici() && S && S.d !== 'bitti' && sonV) return; /* durumu biz yürütüyoruz */
        const sv = o.surum(); if (sv === sonV) return; sonV = sv; const d = o.durum(); if (!d) return;
        const eskiB = S ? S.B.length : 0, eskiF = S ? S.F.length : 0, eskiCan = S ? S.P.map(P => P.can) : [], eskiD = S ? S.d : '', eskiMac = S ? S.mac : 0;
        onceki = S && S.P ? S.P.map(P => [P.x, P.y]) : null; alindi = performance.now(); S = d;
        if (eskiMac && d.mac !== eskiMac) { const x = q('.bc-son'); if (x) x.remove(); }
        if (!yonetici()) { /* istemci tarafı sesler */
          if (d.B.length > eskiB) ses('tap'); if (d.F.length > eskiF && eskiF === 0) { ses('score'); titre(25); }
          d.P.forEach((P, p) => { if (eskiCan[p] && !P.can) { ses(p === ben && !izle ? 'lose' : 'bad'); if (p === ben) titre([40, 40, 60]); } });
          if (d.d === 'bitti' && eskiD !== 'bitti') bitti();
        } else if (d.d === 'bitti' && !q('.bc-son')) bitti();
        hud();
      });
      son = 0; raf = requestAnimationFrame(dongu);
    }
    function rovans() {
      const x = q('.bc-son'); if (x) x.remove();
      if (mod === 'yz') return yzBasla();
      if (!oda || !yonetici() || !S) return; const K = oda.koltuklar();
      S = BC.yeni({ n: S.n, bot: K.map(k => !k), sev: 1, hedef: 3, mac: (S.mac || 1) + 1, seed: (Math.random() * 2 ** 31) | 0 }); hafiza = []; inp = []; yay();
    }
    kok.addEventListener('click', e => {
      const sb = e.target.closest('[data-s]'); if (sb) { D[sb.dataset.s] = +sb.dataset.v; kaydet(); ses('click'); return menu(); }
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'yz') yzBasla(); else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') menu(); else if (a === 'cik') menu();
      else if (a === 'rovans') rovans();
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } }
    });
    addEventListener('resize', boyut);
    api.onCleanup(() => { temizle(); removeEventListener('keydown', tusAsagi); removeEventListener('keyup', tusYukari); removeEventListener('blur', odak); removeEventListener('resize', boyut); root.classList.remove('bc-mount'); });
    menu();
    if (/[?&]bctest/.test(location.search)) window.__bc = { S: () => S, BC, yonVer, bombaBas, oda: () => oda };
  }
});
})();
