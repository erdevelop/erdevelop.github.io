/* Okey — dört kişilik; bilgisayara karşı ya da çevrimiçi (assets/masa.js; boş koltuklara bilgisayar oturur).
   106 taş: 4 renk × 1–13 × 2 ve 2 sahte okey. Gösterge taşının bir üstü okeydir (13'ün üstü 1); o iki taş her taşın yerine geçer,
   sahte okeyler okey taşının kendi değerini taşır. Sıra gelince ortadan ya da solundakinin attığından bir taş çekilir, bir taş atılır.
   Bitiş: elde kalan 14 taş perlere ayrılıyorsa (seri: aynı renk ardışık en az 3, 12-13-1 olur, 13-1-2 olmaz; küt: aynı sayı farklı renk 3–4)
   ya da 7 çiftse. Okey atarak ya da çiftle bitiş iki kat sayılır. Durum düz bir nesnedir (JSON), çevrimiçinde olduğu gibi yazılır. */
(function () {
'use strict';
const OK = (() => {
  const SAHTE = 104, renk = t => Math.floor(t / 26), sayi = t => (Math.floor(t / 2) % 13) + 1;
  /* taşın oyundaki karşılığı: { j:1 } okey, { r, s, sahte } sahte okey, { r, s } düz taş */
  const deger = (t, ok) => t >= SAHTE ? { r: ok.r, s: ok.s, sahte: 1 } : (renk(t) === ok.r && sayi(t) === ok.s) ? { j: 1 } : { r: renk(t), s: sayi(t) };
  const okeyMi = (t, ok) => t < SAHTE && renk(t) === ok.r && sayi(t) === ok.s;
  const kar = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  function yeni(ilk, puan, tur) {
    const D = kar(Array.from({ length: 106 }, (_, i) => i)), gi = D.findIndex(t => t < SAHTE), gosterge = D.splice(gi, 1)[0];
    const ok = { r: renk(gosterge), s: sayi(gosterge) % 13 + 1 }, el = [[], [], [], []];
    for (let p = 0; p < 4; p++) el[p] = D.splice(0, p === ilk ? 15 : 14);
    return { el, deste: D, atik: [[], [], [], []], gosterge, ok, ilk, sira: ilk, cekti: true, bitti: null, tur: tur || 1, puan: puan ? puan.slice() : [0, 0, 0, 0], son: { i: 0 } };
  }
  /* En çok taşı perlere yerleştiren dizilim. tam: yalnızca hepsi yerleşiyor mu diye bakar (erken çıkar).
     Dönen: { n: perlere giren düz taş sayısı, gercek: düz taş sayısı, j: okey sayısı, per: [[jeton…]…], artan: [jeton…] }  jeton: { r, s } ya da { j:1 } */
  function coz(taslar, ok, tam) {
    const C = [0, 1, 2, 3].map(() => new Array(15).fill(0)); let J = 0, gercek = 0;
    for (const t of taslar) { const d = deger(t, ok); if (d.j) J++; else { C[d.r][d.s]++; gercek++; } }
    let en = -1, enPer = [], enArtan = [], bulundu = false, dugum = 0; const per = [], artan = [];
    function ara(j, kapsanan, kalan) {
      if (bulundu || kapsanan + kalan <= en || ++dugum > 60000) return;
      let r = -1, s = 0; for (let a = 0; a < 4 && r < 0; a++) for (let b = 1; b <= 13; b++) if (C[a][b]) { r = a; s = b; break; }
      if (r < 0) { en = kapsanan; enPer = per.map(x => x.slice()); enArtan = artan.slice(); if (tam || en === gercek) bulundu = true; return; }
      C[r][s]--; const ben = { r, s };
      /* küt */
      const dg = [0, 1, 2, 3].filter(x => x !== r);
      for (let m = 1; m < 27 && !bulundu; m++) {
        const sec = [m % 3, Math.floor(m / 3) % 3, Math.floor(m / 9)]; let uye = 0, jk = 0, olur = true;
        for (let i = 0; i < 3; i++) { if (sec[i]) uye++; if (sec[i] === 2) jk++; else if (sec[i] === 1 && !C[dg[i]][s]) olur = false; }
        if (!olur || uye < 2 || jk > j) continue; const g = [ben];
        for (let i = 0; i < 3; i++) { if (sec[i] === 1) { C[dg[i]][s]--; g.push({ r: dg[i], s }); } else if (sec[i] === 2) g.push({ j: 1 }); }
        per.push(g); ara(j - jk, kapsanan + 1 + uye - jk, kalan - 1 - (uye - jk)); per.pop();
        for (let i = 0; i < 3; i++) if (sec[i] === 1) C[dg[i]][s]++;
      }
      /* seri: bu taş en küçük; yukarı uzar (14. konum = 13'ten sonraki 1) */
      const yukari = (kon, g, jk, ger) => {
        if (bulundu) return;
        if (g.length >= 3) { per.push(g.slice()); ara(j - jk, kapsanan + 1 + ger, kalan - 1 - ger); per.pop(); }
        if (g.length >= 5) return;
        if (kon > 14 || (kon === 14 && s === 1)) { const lazim = 3 - g.length; if (lazim > 0 && j - jk >= lazim && s - lazim >= 1) { const h = g.slice(); for (let i = 0; i < lazim; i++) h.unshift({ j: 1 }); per.push(h); ara(j - jk - lazim, kapsanan + 1 + ger, kalan - 1 - ger); per.pop(); } return; }
        const n = kon === 14 ? 1 : kon;
        if (C[r][n]) { C[r][n]--; g.push({ r, s: n }); yukari(kon + 1, g, jk, ger + 1); g.pop(); C[r][n]++; }
        if (jk < j) { g.push({ j: 1 }); yukari(kon + 1, g, jk + 1, ger); g.pop(); }
      };
      yukari(s + 1, [ben], 0, 0);
      /* 1 seri sonunda: …12-13-1 */
      if (s === 1) {
        const asagi = (n, g, jk, ger) => {
          if (bulundu) return;
          if (g.length >= 3) { per.push(g.slice()); ara(j - jk, kapsanan + 1 + ger, kalan - 1 - ger); per.pop(); }
          if (g.length >= 5 || n < 2) return;
          if (C[r][n]) { C[r][n]--; g.unshift({ r, s: n }); asagi(n - 1, g, jk, ger + 1); g.shift(); C[r][n]++; }
          if (jk < j) { g.unshift({ j: 1 }); asagi(n - 1, g, jk + 1, ger); g.shift(); }
        };
        asagi(13, [ben], 0, 0);
      }
      /* bu taşı açıkta bırak */
      if (!tam && !bulundu) { artan.push(ben); ara(j, kapsanan, kalan - 1); artan.pop(); }
      C[r][s]++;
    }
    ara(J, 0, gercek);
    return { n: Math.max(0, en), gercek, j: J, per: enPer, artan: enArtan, tamam: en === gercek };
  }
  /* çiftler: { cift: [[jeton, jeton]…], tek: [jeton…], j } */
  function ciftler(taslar, ok) {
    const C = {}, cift = [], tek = []; let j = 0;
    for (const t of taslar) { const d = deger(t, ok); if (d.j) j++; else { const k = d.r * 14 + d.s; C[k] = (C[k] || 0) + 1; } }
    for (const k in C) { const r = Math.floor(k / 14), s = k % 14; if (C[k] >= 2) cift.push([{ r, s }, { r, s }]); if (C[k] % 2) tek.push({ r, s }); }
    return { cift, tek, j };
  }
  /* 14 taş bitiyor mu: 'cift' | 'per' | null */
  function kazanir(taslar, ok) {
    if (taslar.length !== 14) return null; const c = ciftler(taslar, ok); if (c.tek.length <= c.j) return 'cift';
    return coz(taslar, ok, true).tamam ? 'per' : null;
  }
  /* 15 taşlık elde bitiren atışlar: [{ tas, tur, okey }] (okey atarak bitiş başta) */
  function bitisler(el, ok) {
    const L = [], gor = new Set();
    for (const t of el) { const d = deger(t, ok), k = d.j ? 'j' : d.r * 14 + d.s + (d.sahte ? 0 : 0); if (gor.has(k)) continue; gor.add(k); const kalan = el.slice(); kalan.splice(kalan.indexOf(t), 1); const tur = kazanir(kalan, ok); if (tur) L.push({ tas: t, tur, okey: !!d.j }); }
    return L.sort((a, b) => (b.okey - a.okey) || ((b.tur === 'cift') - (a.tur === 'cift')));
  }
  /* jetonları eldeki taş numaralarına çevir (dizme ve sonuç ekranı için) */
  function tasla(taslar, ok, gruplar) {
    const havuz = {}, jok = [];
    for (const t of taslar) { const d = deger(t, ok); if (d.j) jok.push(t); else { const k = d.r * 14 + d.s; (havuz[k] = havuz[k] || []).push(t); } }
    for (const k in havuz) havuz[k].sort((a, b) => a - b);   /* sahte okey (104+) en sona: düz taş önce kullanılır */
    return gruplar.map(g => g.map(x => x.j ? jok.pop() : havuz[x.r * 14 + x.s].shift()).filter(t => t != null));
  }
  /* el dizimi: { gruplar: [[taş…]…], artan: [taş…] } — mod 'per' ya da 'cift' */
  function diz(taslar, ok, mod) {
    if (mod === 'cift') { const c = ciftler(taslar, ok), g = tasla(taslar, ok, c.cift.concat([c.tek.sort((a, b) => a.s - b.s || a.r - b.r)])); const artan = g.pop(); return { gruplar: g, artan: artan.concat(taslar.filter(t => okeyMi(t, ok))) }; }
    const c = coz(taslar, ok), sirali = c.artan.slice().sort((a, b) => a.r - b.r || a.s - b.s), g = tasla(taslar, ok, c.per.concat([sirali])), artan = g.pop(), kullanilan = new Set(g.flat().concat(artan));
    return { gruplar: g, artan: artan.concat(taslar.filter(t => !kullanilan.has(t))) };
  }
  /* ----- hamleler ----- */
  const onceki = p => (p + 3) % 4;
  function cek(S, p, nereden) {
    if (S.bitti || S.sira !== p || S.cekti) return false; let t;
    if (nereden === 'a') { const A = S.atik[onceki(p)]; if (!A.length) return false; t = A.pop(); } else { if (!S.deste.length) return false; t = S.deste.pop(); }
    S.el[p].push(t); S.cekti = true; S.son = { i: S.son.i + 1, p, t: nereden === 'a' ? 'a' : 'd', tas: nereden === 'a' ? t : -1 }; return true;
  }
  function at(S, p, tas) {
    if (S.bitti || S.sira !== p || !S.cekti) return false; const i = S.el[p].indexOf(tas); if (i < 0) return false;
    const kalan = S.el[p].slice(); kalan.splice(i, 1); const tur = kazanir(kalan, S.ok); S.el[p] = kalan;
    if (tur) { const okey = okeyMi(tas, S.ok), sayi = (tur === 'cift' ? 2 : 1) * (okey ? 2 : 1); S.puan[p] += sayi; S.bitti = { k: p, tur, okey, tas, sayi }; S.son = { i: S.son.i + 1, p, t: 'b', tas }; return true; }
    S.atik[p].push(tas); S.son = { i: S.son.i + 1, p, t: 'at', tas };
    if (!S.deste.length) { S.bitti = { k: -1 }; return true; }
    S.sira = (p + 1) % 4; S.cekti = false; return true;
  }
  /* ----- bilgisayar ----- */
  const komsu = (a, b) => a.s === b.s ? a.r !== b.r : a.r === b.r && (Math.abs(a.s - b.s) <= 2 || (Math.min(a.s, b.s) === 1 && Math.max(a.s, b.s) >= 12));
  function elDegeri(taslar, ok) {
    const c = coz(taslar, ok), A = c.artan; let aday = 0;
    for (let i = 0; i < A.length; i++) { let v = 0; for (let k = 0; k < A.length; k++) if (k !== i) { if (A[k].r === A[i].r && A[k].s === A[i].s) v = Math.max(v, .3); else if (komsu(A[i], A[k])) v = 1; } aday += v; }
    const per = c.n * 10 + c.j * 14 + aday * 3, cf = ciftler(taslar, ok), cift = (cf.cift.length * 2 + cf.j) * 10 - 22 + cf.j * 14;
    return Math.max(per, cift);
  }
  function botCek(S, p, seviye) {
    const A = S.atik[onceki(p)]; if (!A.length) return 'd'; const t = A[A.length - 1], el = S.el[p];
    if (okeyMi(t, S.ok)) return 'a';
    if (bitisler(el.concat(t), S.ok).length) return 'a';
    if (seviye === 0 && Math.random() < .6) return 'd';
    const c0 = coz(el, S.ok).n, c1 = coz(el.concat(t), S.ok).n; if (c1 > c0) return 'a';
    const f0 = ciftler(el, S.ok), f1 = ciftler(el.concat(t), S.ok); if (f0.cift.length >= 4 && f1.cift.length > f0.cift.length) return 'a';
    return 'd';
  }
  function botAt(S, p, seviye) {
    const el = S.el[p], B = bitisler(el, S.ok); if (B.length) return B[0].tas;
    let en = -1e9, sec = el[0]; const gor = new Set(), oyna = seviye === 0 ? 13 : .9;
    for (const t of el) { const d = deger(t, S.ok); if (d.j) continue; const k = d.r * 14 + d.s; if (gor.has(k)) continue; gor.add(k);
      if (S.son && S.son.t === 'a' && S.son.p === p && S.son.tas === t) continue;   /* az önce aldığını geri atmaz */
      const kalan = el.slice(); kalan.splice(kalan.indexOf(t), 1); const v = elDegeri(kalan, S.ok) + Math.random() * oyna; if (v > en) { en = v; sec = t; } }
    return sec;
  }
  return { SAHTE, renk, sayi, deger, okeyMi, yeni, coz, ciftler, kazanir, bitisler, diz, cek, at, botCek, botAt, elDegeri, onceki };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = OK; return; }
window.OK = OK;
})();
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame) return;
const OK = window.OK;
const bekle = ms => new Promise(r => setTimeout(r, ms));
const RENK = ['#d43a3a', '#23272e', '#2468d8', '#d08c00'], SEKIL = ['●', '■', '▲', '◆'], BOT = ['Ada', 'Efe', 'Can', 'Naz'], YUVA = 22, SUTUN = 11;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function kapak() {
  const t = (x, y, c, n, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-10" y="-14" width="20" height="28" rx="3" fill="#fffdf4" stroke="#cbbf9c"/><text y="2" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="14" fill="${c}">${n}</text><circle cy="8" r="2" fill="${c}"/></g>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#1f7a4d"/><rect x="6" y="58" width="78" height="26" rx="4" fill="#a8743f"/><rect x="6" y="58" width="78" height="5" rx="2" fill="#c08a52"/>${t(22, 62, RENK[0], 7, -6)}${t(45, 60, RENK[1], 7, 0)}${t(68, 62, RENK[2], 7, 6)}${t(33, 26, RENK[3], 12, -10)}${t(57, 26, RENK[0], 13, 8)}<path d="M45 6l2.200 4.600 5 .700-3.600 3.500.900 5-4.500-2.400-4.500 2.400.900-5-3.600-3.500 5-.700z" fill="#ffd34d"/></svg>`;
}
const CSS = `
.ok-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.ok{width:min(600px,100%);margin:0 auto;display:flex;flex-direction:column;gap:7px;-webkit-user-select:none;user-select:none;position:relative;--tw:32px}
.ok h3{margin:0;font-size:19px;font-weight:800}.ok p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.ok-b{padding:12px 10px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center}.ok-b.ana{background:var(--accent);color:#fff}.ok-b:disabled{opacity:.4}
.ok-sat{display:flex;gap:8px}.ok-sat>*{flex:1;min-width:0}
.ok-menu{display:flex;flex-direction:column;gap:10px;width:min(440px,100%);margin:0 auto}
.ok-masa{position:relative;border-radius:14px;background:radial-gradient(ellipse at 50% 45%,#2c9160,#1b6b43);box-shadow:inset 0 0 0 4px #14532f,inset 0 0 30px rgba(0,0,0,.25);height:240px;flex:none}
.ok-t{width:var(--tw);height:calc(var(--tw)*1.38);border-radius:calc(var(--tw)*.14);background:linear-gradient(#fffef8,#efe6cf);border:1px solid #c9bd9a;box-shadow:0 1.500px 0 #b3a57e,0 2px 4px rgba(0,0,0,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;position:relative;font-family:Nunito,system-ui,sans-serif;flex:none;box-sizing:border-box}
.ok-t b{font-size:calc(var(--tw)*.56);font-weight:900;line-height:1;letter-spacing:-.04em}.ok-t i{font-style:normal;font-size:calc(var(--tw)*.26);line-height:1}
.ok-t.okey{box-shadow:0 0 0 2px #f2b600,0 2px 4px rgba(0,0,0,.25)}.ok-t.okey::after{content:'★';position:absolute;top:0;right:1px;font-size:calc(var(--tw)*.28);color:#e0a400;line-height:1}
.ok-t.sahte i{font-size:calc(var(--tw)*.2);font-weight:800}
.ok-t.arka{background:repeating-linear-gradient(45deg,#c9a56b,#c9a56b 4px,#b8935a 4px,#b8935a 8px);border-color:#8e6c3a}
.ok-t.bos{background:rgba(255,255,255,.08);border:1.500px dashed rgba(255,255,255,.35);box-shadow:none}
.ok-t.yeni{animation:okY .7s}@keyframes okY{0%{transform:scale(1.35);filter:brightness(1.25)}100%{transform:none}}
.ok-oy{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 10px;border-radius:11px;background:rgba(0,0,0,.28);color:#fff;font-weight:800;font-size:13px;max-width:34%;line-height:1.15}
.ok-oy span{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ok-oy small{font-size:11px;font-weight:800;opacity:.8}
.ok-oy.k2{top:8px;left:50%;transform:translateX(-50%)}.ok-oy.k1{right:8px;top:50%;transform:translateY(-50%)}.ok-oy.k3{left:8px;top:50%;transform:translateY(-50%)}
.ok-oy.sira{background:#fff;color:#14532f;box-shadow:0 0 0 3px #ffd34d;animation:okN 1.2s infinite alternate}@keyframes okN{to{box-shadow:0 0 0 3px rgba(255,211,77,.35)}}.ok-oy.yok{opacity:.55}
.ok-atik{position:absolute;display:flex;align-items:center;gap:3px;padding:4px;border-radius:9px}
.ok-atik em,.ok-deste em{font-style:normal;font-size:11px;font-weight:800;color:#fff;background:rgba(0,0,0,.35);border-radius:8px;padding:1px 5px}
.ok-atik.k0{right:8px;bottom:8px;flex-direction:row-reverse}.ok-atik.k1{right:8px;top:8px;flex-direction:row-reverse}.ok-atik.k2{left:8px;top:8px}.ok-atik.k3{left:8px;bottom:8px}
.ok-atik.al,.ok-deste.al{box-shadow:0 0 0 3px #7dffb0;background:rgba(125,255,176,.18);cursor:pointer;animation:okA 1s infinite alternate}@keyframes okA{to{box-shadow:0 0 0 3px rgba(125,255,176,.3)}}
.ok-atik.at{box-shadow:0 0 0 2px rgba(255,255,255,.6);cursor:pointer}.ok-atik.at.hedef{background:rgba(255,255,255,.3)}
.ok-orta{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:12px;align-items:flex-start}
.ok-deste,.ok-gost{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px;border-radius:9px}.ok-gost small{font-size:10.5px;font-weight:800;color:#fff;opacity:.85}
.ok-ben{display:flex;align-items:center;gap:8px;min-height:34px;padding:4px 10px;border-radius:11px;background:var(--bg2);font-size:13.5px;font-weight:800}
.ok-ben.sira{box-shadow:inset 0 0 0 2px var(--accent)}.ok-ben small{color:var(--ink-soft);font-weight:800;white-space:nowrap}
.ok-bilgi{flex:1;text-align:right;font-weight:700;color:var(--ink-soft);font-size:13px;line-height:1.25}.ok-bilgi b{color:var(--ink)}
.ok-raf{display:grid;grid-template-columns:repeat(${SUTUN},var(--tw));gap:3px;padding:6px;justify-content:center;border-radius:12px;background:linear-gradient(#b88a55,#9a6f3f);box-shadow:inset 0 2px 0 rgba(255,255,255,.25),inset 0 -3px 0 rgba(0,0,0,.2);touch-action:none}
.ok-s{width:var(--tw);height:calc(var(--tw)*1.38);border-radius:calc(var(--tw)*.14);background:rgba(0,0,0,.13)}
.ok-s .ok-t{cursor:grab;transition:transform .12s}.ok-s .ok-t.sec{transform:translateY(-18%);box-shadow:0 0 0 2.500px #3b82f6,0 6px 10px rgba(0,0,0,.3)}.ok-s .ok-t.sec.okey{box-shadow:0 0 0 2.500px #3b82f6,0 0 0 4.500px #f2b600}
.ok-s.tasiniyor .ok-t{opacity:.25}.ok-s.hedef{background:rgba(255,255,255,.4)}
.ok-hayalet{position:fixed;z-index:60;pointer-events:none;transform:translate(-50%,-70%) scale(1.15);box-shadow:0 10px 18px rgba(0,0,0,.4)}
.ok-alt{display:flex;gap:7px}.ok-alt .ok-b{flex:1}.ok-alt .ok-b[data-a=cik]{flex:none;width:44px}
.ok-bitir{padding:13px;border-radius:13px;background:#16a34a;color:#fff;font-weight:800;font-size:16px;animation:okB 0.8s infinite alternate}@keyframes okB{to{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.3)}}
.ok-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:14px;animation:okS .3s .25s both}@keyframes okS{from{opacity:0}}
.ok-son>div{display:flex;flex-direction:column;gap:9px;align-items:stretch;text-align:center;padding:16px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(360px,94%)}.ok-son h3{font-size:22px}
.ok-mini{display:flex;flex-wrap:wrap;gap:4px 9px;justify-content:center;--tw:21px}.ok-mini>div{display:flex;gap:1.500px}
.ok-puan{display:grid;grid-template-columns:1fr auto;gap:3px 12px;text-align:left;font-weight:800;font-size:14px;padding:8px 12px;border-radius:12px;background:var(--bg2)}.ok-puan .k{color:var(--accent-ink)}
`;
function tasHtml(t, ok, ek) {
  if (t == null || t < 0) return '<div class="ok-t arka"></div>';
  const sahte = t >= OK.SAHTE, r = sahte ? -1 : OK.renk(t);
  return `<div class="ok-t${OK.okeyMi(t, ok) ? ' okey' : ''}${sahte ? ' sahte' : ''} ${ek || ''}" data-t="${t}" style="color:${sahte ? '#15803d' : RENK[r]}"><b>${sahte ? '✤' : OK.sayi(t)}</b><i>${sahte ? 'sahte' : SEKIL[r]}</i></div>`;
}
registerGame({
  id: 'okey', title: 'Okey', category: 'Masa', tags: 'okey taş per çift gösterge ıstaka çevrimiçi online dört kişilik', odak: true, noRestart: true,
  aciklama: 'Dört kişilik okey: bilgisayara karşı ya da çevrimiçi arkadaşlarınla. Taşlarını sürükleyerek diz, perleri tamamla, bitir.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="3" y="5" width="7" height="10" rx="1.500"/><rect x="14" y="5" width="7" height="10" rx="1.500"/><path d="M6.500 8.500v3M17.500 8.500v3M2 19h20"/></svg>',
  shareText() { return this._paylas || 'Okey: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('ok-css')) { const s = document.createElement('style'); s.id = 'ok-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('ok-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, el: 0, kaz: 0, ag: 0, o: '', sev: 1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'ok' }); root.append(kok);
    let sohbetK = null;
    let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, raf = new Array(YUVA).fill(null), rafTur = -1, secili = null, mesaj = '', mesajT = 0, yeniTas = null, gorulenI = -1,
      surT = 0, sur = null, cizBekle = false, canli = true, sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, vekil = '', yazSira = Promise.resolve();
    const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
    const koltuklar = () => oda ? oda.koltuklar() : null;
    const botMu = p => mod === 'yz' ? p !== ben : !(koltuklar()[p]);
    const kopuk = p => { const K = koltuklar(); return !!(K && K[p] && !K[p].var); };
    const ad = p => { if (mod === 'yz') return p === ben ? 'Sen' : BOT[p]; const K = koltuklar(); return K && K[p] ? K[p].n : BOT[p]; };
    const benimSira = () => S && !S.bitti && S.sira === ben;
    function mesajVer(m, sure) { mesaj = m; clearTimeout(mesajT); mesajT = setTimeout(() => { mesaj = ''; ciz(); }, sure || 1800); ciz(); }

    /* ---------- menü ---------- */
    function menu() {
      temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { } const var_ = eski && eski.S && !eski.S.bitti;
      kok.innerHTML = `<div class="ok-menu"><h3>🀄 Okey</h3><p>${D.el ? `Bilgisayara karşı <b>${D.el}</b> el, <b>${D.kaz}</b> bitiriş${D.ag ? ' · çevrimiçi ' + D.ag + ' bitiriş' : ''}` : 'Taşlarını perlere ayır, ilk bitiren sen ol.'}</p>
        ${var_ ? '<button class="ok-b ana" data-a="devam">▶ Yarım kalan ele devam</button>' : ''}
        <div class="ok-sat"><button class="ok-b ${var_ ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="ok-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
        <button class="ok-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="ok-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/okey/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="ok-menu"><h3>Nasıl oynanır</h3>
        <p>• Amaç, elindeki 14 taşı <b>perlere</b> ayırmak. <b>Seri:</b> aynı renkten sırayla en az üç taş (5-6-7; 12-13-1 de olur). <b>Küt:</b> aynı sayının farklı renklerinden üç ya da dört taş.</p>
        <p>• Sıran gelince <b>ortadaki desteden</b> ya da <b>sol alttaki taştan</b> (solundakinin attığı) birini çek: üstüne dokun. Sonra bir taş at: taşa dokun ve <b>At</b>’a bas, ya da taşı sağ alttaki yere sürükle.</p>
        <p>• Ortada açık duran taş <b>göstergedir</b>. Aynı rengin bir büyüğü <b>okeydir</b> (★ işaretli): her taşın yerine geçer. Yonca işaretli <b>sahte okey</b>, okey taşının kendi sayısı ve rengi sayılır.</p>
        <p>• Elin bitecek duruma gelince yeşil <b>Bitir</b> düğmesi çıkar. Yedi çift toplamak da bitirir.</p>
        <p>• Normal bitiş 1 sayı; çiftle ya da okeyi atarak bitiş 2 sayı. Deste biterse el berabere kalır.</p>
        <p>• Taşlarını sürükleyerek ya da dokunarak istediğin gibi diz; <b>Seri diz</b> ve <b>Çift diz</b> senin yerine dizer.</p>
        <p>• Çevrimiçinde boş koltuklara bilgisayar oturur. 75 saniye oynamayanın o hamlesini bilgisayar yapar.</p>
        <button class="ok-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="ok-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="ok-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'okey', koltuk: 4, enAz: 1, botlu: true, baslik: 'Okey', onGeri: menu,
        baslat: o => o.baslat(OK.yeni((Math.random() * 4) | 0)),
        onOda: o => { lobi = null; agBasla(o); } });
    }
    /* ---------- ekran ---------- */
    function ekran() {
      kok.innerHTML = `<div class="ok-masa" id="ok-m"></div><div class="ok-ben" id="ok-ben"><b></b><small></small><span class="ok-bilgi" id="ok-b"></span></div>
        <div class="ok-raf" id="ok-r"></div><button class="ok-bitir" data-a="bitir" hidden>🏁 Bitir</button>
        <div class="ok-alt"><button class="ok-b" data-a="cik">‹</button><button class="ok-b" data-a="seri">Seri diz</button><button class="ok-b" data-a="cift">Çift diz</button><button class="ok-b ana" data-a="at" disabled>At</button></div>`;
      q('#ok-r').addEventListener('pointerdown', basla);
    }
    function olcu() {
      const W = kok.clientWidth || 340, tw = Math.max(22, Math.min(46, Math.floor(((W - 12 - (SUTUN - 1) * 3) / SUTUN) * 10) / 10)); kok.style.setProperty('--tw', tw + 'px');
      const m = q('#ok-m'); if (m) { const ust = m.getBoundingClientRect().top, alt = tw * 1.38 * 2 + 3 + 12 + 34 + 48 + 7 * 4 + 14; m.style.height = Math.round(Math.max(tw * 1.38 * 3 + 86, Math.min(330, innerHeight - ust - alt))) + 'px'; }
    }
    /* ıstaka: elimdeki taşlarla yuvaları eşle */
    function rafEsle() {
      const el = S.el[ben]; if (S.tur !== rafTur) { raf.fill(null); rafTur = S.tur; }
      const var_ = new Set(el); for (let i = 0; i < YUVA; i++) if (raf[i] != null && !var_.has(raf[i])) raf[i] = null;
      const yerde = new Set(raf.filter(x => x != null)), eksik = el.filter(t => !yerde.has(t));
      if (!yerde.size && eksik.length > 1) return yerlestir('seri');
      for (const t of eksik) { let i = YUVA - 1; while (i >= 0 && raf[i] != null) i--; if (i >= 0) raf[i] = t; }
    }
    function yerlestir(tur) {
      const d = OK.diz(S.el[ben], S.ok, tur === 'cift' ? 'cift' : 'per'), G = d.gruplar.slice(); if (d.artan.length) G.push(d.artan);
      const dene = bosluk => { const R = new Array(YUVA).fill(null); let i = 0;
        for (const g of G) { if (bosluk && g.length <= SUTUN && i % SUTUN && Math.floor(i / SUTUN) !== Math.floor((i + g.length - 1) / SUTUN)) i = (Math.floor(i / SUTUN) + 1) * SUTUN;
          for (const t of g) { if (i >= YUVA) return null; R[i++] = t; } if (bosluk && i % SUTUN) i++; } return R; };
      raf = dene(true) || dene(false) || raf;
    }
    function ciz() {
      if (!S || !q('#ok-m')) return; if (sur && sur.h) { cizBekle = true; return; }
      olcu(); rafEsle(); const bS = benimSira(), B = bS && S.cekti ? OK.bitisler(S.el[ben], S.ok) : [], vurgu = S.son && S.son.i !== gorulenI ? S.son : null; gorulenI = S.son ? S.son.i : -1;
      let h = '';
      for (const r of [1, 2, 3]) { const p = (ben + r) % 4; h += `<div class="ok-oy k${r}${S.sira === p && !S.bitti ? ' sira' : ''}${kopuk(p) ? ' yok' : ''}"><span>${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}${kopuk(p) ? ' (ayrıldı)' : ''}</span><small>${S.puan[p]} sayı</small></div>`; }
      for (const r of [0, 1, 2, 3]) { const p = (ben + r) % 4, A = S.atik[p], ust = A[A.length - 1], al = r === 3 && bS && !S.cekti && A.length, at = r === 0 && bS && S.cekti;
        h += `<div class="ok-atik k${r}${al ? ' al' : ''}${at ? ' at' : ''}" data-atik="${r}">${ust != null ? tasHtml(ust, S.ok, vurgu && vurgu.t === 'at' && vurgu.p === p ? 'yeni' : '') : '<div class="ok-t bos"></div>'}${A.length > 1 ? `<em>${A.length}</em>` : ''}</div>`; }
      h += `<div class="ok-orta"><div class="ok-deste${bS && !S.cekti ? ' al' : ''}" data-a="deste"><div class="ok-t arka"></div><em>${S.deste.length} taş</em></div><div class="ok-gost">${tasHtml(S.gosterge, S.ok)}<small>gösterge</small></div></div>`;
      q('#ok-m').innerHTML = h;
      let rh = ''; for (let i = 0; i < YUVA; i++) rh += `<div class="ok-s" data-i="${i}">${raf[i] != null ? tasHtml(raf[i], S.ok, (secili === i ? 'sec ' : '') + (raf[i] === yeniTas ? 'yeni' : '')) : ''}</div>`;
      q('#ok-r').innerHTML = rh; yeniTas = null;
      const bn = q('#ok-ben'); bn.classList.toggle('sira', !!bS); bn.querySelector('b').textContent = ad(ben); bn.querySelector('small').textContent = S.puan[ben] + ' sayı';
      const solVar = S.atik[(ben + 3) % 4].length;
      q('#ok-b').innerHTML = mesaj || (S.bitti ? '' : bS ? (!S.cekti ? (solVar ? 'Sıra sende: <b>desteden</b> ya da <b>sol alttan</b> taş çek.' : 'Sıra sende: <b>desteye dokun</b>, taş çek.') : B.length ? '<b>Bitirebilirsin!</b>' : secili != null ? '<b>At</b>’a bas ya da başka yuvaya dokun.' : 'Atacağın taşa dokun, sonra <b>At</b>.') : `<b>${esc(ad(S.sira))}</b> ${S.cekti ? 'taş atıyor' : 'taş çekiyor'}…`);
      q('[data-a=at]').disabled = !(bS && S.cekti && secili != null && raf[secili] != null); q('[data-a=bitir]').hidden = !B.length;
    }
    /* ---------- ıstakada dokunma / sürükleme ---------- */
    function basla(e) { const s = e.target.closest('.ok-s'); if (!s || !S || sur) return; const i = +s.dataset.i; sur = { i, t: raf[i], x0: e.clientX, y0: e.clientY, h: null, id: e.pointerId }; }
    function oynat(e) {
      if (!sur || sur.t == null || e.pointerId !== sur.id) return;
      if (!sur.h) { if (Math.hypot(e.clientX - sur.x0, e.clientY - sur.y0) < 9) return; const kay = q(`.ok-s[data-i="${sur.i}"]`), t = kay && kay.querySelector('.ok-t'); if (!t) { sur = null; return; }
        const h = t.cloneNode(true); h.classList.remove('sec', 'yeni'); h.classList.add('ok-hayalet'); h.style.setProperty('--tw', getComputedStyle(kok).getPropertyValue('--tw')); document.body.appendChild(h); sur.h = h; kay.classList.add('tasiniyor'); }
      sur.h.style.left = e.clientX + 'px'; sur.h.style.top = e.clientY + 'px';
      kok.querySelectorAll('.hedef').forEach(x => x.classList.remove('hedef')); const hd = altindaki(e); if (hd) hd.classList.add('hedef');
    }
    function altindaki(e) { const el = document.elementFromPoint(e.clientX, e.clientY); if (!el || !kok.contains(el)) return null; return el.closest('.ok-s') || el.closest('.ok-atik.k0'); }
    function birak(e) {
      if (!sur || (e.pointerId != null && e.pointerId !== sur.id)) return; const x = sur; sur = null;
      if (x.h) { x.h.remove(); const hd = e.type === 'pointercancel' ? null : altindaki(e); secili = null;
        if (hd && hd.classList.contains('ok-s')) tasi(x.i, +hd.dataset.i); else if (hd) atDene(x.t); cizBekle = false; ciz(); return; }
      if (e.type === 'pointercancel') return;
      /* dokunma */
      if (secili == null) { if (x.t != null) { secili = x.i; ses('click'); } } else if (secili === x.i) secili = null; else { tasi(secili, x.i); secili = null; }
      ciz();
    }
    function tasi(a, b) { if (a === b) return; const t = raf[a]; raf[a] = raf[b]; raf[b] = t; ses('click'); yerelKaydet(); }
    /* ---------- hamleler ---------- */
    function cekDene(n) {
      if (!S || S.bitti) return; if (!benimSira()) return mesajVer('Sıra sende değil.'); if (S.cekti) return mesajVer('Taşını çektin; şimdi bir taş at.');
      const Y = kopya(S); if (!OK.cek(Y, ben, n)) return; yeniTas = Y.el[ben][Y.el[ben].length - 1]; secili = null; mesaj = ''; ses('tap'); uygula(Y);
    }
    function atDene(t) {
      if (!S || S.bitti || t == null) return; if (!benimSira()) return mesajVer('Sıra sende değil.'); if (!S.cekti) return mesajVer('Önce bir taş çek.');
      const Y = kopya(S); if (!OK.at(Y, ben, t)) return; secili = null; mesaj = ''; ses('tap'); uygula(Y);
    }
    function uygula(Y) { S = Y; if (mod === 'ag') gonder(); else yerelKaydet(); ciz(); if (S.bitti) bitti(); else surucu(); }
    /* sıradaki koltuğu yürüt: bilgisayar koltukları, kopanlar ve uzun süre oynamayanlar */
    function surucu() {
      clearTimeout(surT); if (!S || S.bitti || !canli) return; const p = S.sira; let sure;
      if (mod === 'yz') { if (p === ben) return; sure = S.cekti ? 750 : 650; }
      else { const K = koltuklar(), bagli = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0 && i !== p); if (!bagli.length || bagli[0] !== ben) return; sure = !K[p] || (vekil === p + ':' + S.tur + ':' + S.son.i) ? (S.cekti ? 800 : 700) : !K[p].var ? 12000 : 75000; }
      const i0 = S.son.i, tur0 = S.tur; surT = setTimeout(() => { if (!S || S.bitti || S.sira !== p || S.son.i !== i0 || S.tur !== tur0 || !canli) return; botAdim(p); }, sure);
    }
    function botAdim(p) {
      const Y = kopya(S), s = mod === 'yz' ? sev : 1; if (!Y.cekti) OK.cek(Y, p, OK.botCek(Y, p, s)); else OK.at(Y, p, OK.botAt(Y, p, s));
      if (p === ben) secili = null; vekil = Y.cekti && !Y.bitti && Y.sira === p ? p + ':' + Y.tur + ':' + Y.son.i : ''; ses('tap'); uygula(Y);
    }
    /* ---------- bitiş ---------- */
    function bitti() {
      clearTimeout(surT); const b = S.bitti, anahtar = mod + ':' + S.tur + ':' + (oda ? oda.kod : ''), kazandim = b.k === ben;
      if (sayilan !== anahtar) { sayilan = anahtar;
        if (mod === 'yz') { D.el++; if (kazandim) { D.kaz++; api.submitScore(D.kaz); } D.o = ''; kaydet(); } else { if (kazandim) { D.ag++; kaydet(); } if (oda) oda.bitir(); }
        ses(kazandim ? 'win' : b.k < 0 ? 'click' : 'lose'); if (kazandim) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } }
      oyun._paylas = 'Okey: ' + (kazandim ? (b.tur === 'cift' ? 'çiftle bitirdim!' : b.okey ? 'okey atarak bitirdim!' : 'eli bitirdim.') : 'bu el olmadı.') + '\nerdevelop.com/oyunlar/#o/okey';
      const e = q('.ok-son'); if (e) e.remove(); const s = E('div', { class: 'ok-son' }); let elH = '';
      if (b.k >= 0) { const d = OK.diz(S.el[b.k], S.ok, b.tur === 'cift' ? 'cift' : 'per'), G = d.gruplar.slice(); if (d.artan.length) G.push(d.artan); elH = `<div class="ok-mini">${G.map(g => `<div>${g.map(t => tasHtml(t, S.ok)).join('')}</div>`).join('')}</div>`; }
      const sira = [0, 1, 2, 3].sort((a, c) => S.puan[c] - S.puan[a]);
      s.innerHTML = `<div><h3>${b.k < 0 ? 'Deste bitti' : kazandim ? '🎉 Bitirdin!' : esc(ad(b.k)) + ' bitirdi'}</h3>
        <p>${b.k < 0 ? 'Kimse bitiremedi; el berabere.' : (b.tur === 'cift' ? 'Yedi çiftle' : 'Perlerle') + (b.okey ? ', okeyi atarak' : '') + ` · <b>${b.sayi} sayı</b>`}</p>${elH}
        <div class="ok-puan">${sira.map(p => `<span class="${p === ben ? 'k' : ''}">${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}</span><span>${S.puan[p]}</span>`).join('')}</div>
        <button class="ok-b ana" data-a="yine">Yeni el</button><button class="ok-b" data-a="menu">Menü</button></div>`;
      kok.append(s);
    }
    /* ---------- kayıt / ağ ---------- */
    function yerelKaydet() { if (mod !== 'yz' || !S) return; D.o = S.bitti ? '' : JSON.stringify({ S, raf, sev }); D.sev = sev; kaydet(); }
    function gonder() {
      if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
      yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
    }
    function al(d) {
      const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
      const onceki = S; S = d; if (onceki && (S.tur !== onceki.tur)) { const e = q('.ok-son'); if (e) e.remove(); secili = null; }
      if (onceki && S.son && onceki.son && S.son.i !== onceki.son.i) ses('tap');
      ciz(); if (S.bitti) { if (!q('.ok-son')) bitti(); } else surucu();
    }
    function yzBasla(s, eski) {
      temizle(); mod = 'yz'; ben = 0; sev = s; secili = null; mesaj = ''; gorulenI = -1;
      if (eski && eski.S) { S = eski.S; raf = Array.isArray(eski.raf) && eski.raf.length === YUVA ? eski.raf : new Array(YUVA).fill(null); rafTur = S.tur; } else { S = OK.yeni((Math.random() * 4) | 0); rafTur = -1; }
      ekran(); ciz(); yerelKaydet(); surucu();
    }
    function agBasla(o) {
      temizle(); mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; secili = null; mesaj = ''; rafTur = -1; gorulenI = -1; yerelSur = 0; sonMetin = ''; bekleyen = 0; ekran(); sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('.ok-alt'), sonra: q('[data-a=cik]'), koltuk: p => p === ben ? q('#ok-ben') : q(`.ok-oy.k${(p - ben + 4) % 4}`) }) : null;
      odaBirak = oda.dinle(v => {
        if (!v) { if (S) mesajVer('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben);
        if (!bekleyen) al(d); if (S && !S.bitti) { ciz(); surucu(); }
      });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); if (sur && sur.h) sur.h.remove(); sur = null; if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (b && b.closest('.ms')) return;
      if (!b) { if (!S || !q('#ok-m')) return; if (e.target.closest('.ok-deste')) return cekDene('d'); const a = e.target.closest('.ok-atik'); if (!a) return;
        if (a.dataset.atik === '3') return cekDene('a'); if (a.dataset.atik === '0' && secili != null) return atDene(raf[secili]); return; }
      const a = b.dataset.a;
      if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const o = JSON.parse(D.o); yzBasla(o.sev == null ? 1 : o.sev, o); } catch (x) { menu(); } }
      else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
      else if (a === 'cik') { if (mod === 'ag' && S && !S.bitti && !b.dataset.emin) { b.dataset.emin = 1; mesajVer('Çıkarsan masadan kalkmış olursun. Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
      else if (a === 'seri' || a === 'cift') { if (!S) return; secili = null; yerlestir(a); ses('click'); yerelKaydet(); ciz(); }
      else if (a === 'at') { if (secili != null) atDene(raf[secili]); }
      else if (a === 'bitir') { const B = benimSira() && S.cekti ? OK.bitisler(S.el[ben], S.ok) : []; if (!B.length) return; const sec = secili != null ? B.find(x => x.tas === raf[secili]) : null; atDene((sec || B[0]).tas); }
      else if (a === 'yine') { const y = OK.yeni((S.ilk + 1) % 4, S.puan, S.tur + 1), e2 = q('.ok-son'); if (e2) e2.remove(); secili = null; if (mod === 'ag') { S = null; sonMetin = ''; oda.yeniden(y); } else { S = y; ciz(); yerelKaydet(); surucu(); } } });
    const boyutla = () => { if (S) ciz(); }; addEventListener('resize', boyutla); addEventListener('pointermove', oynat); addEventListener('pointerup', birak); addEventListener('pointercancel', birak);
    const sakla = () => yerelKaydet(); addEventListener('pagehide', sakla);
    api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); removeEventListener('resize', boyutla); removeEventListener('pointermove', oynat); removeEventListener('pointerup', birak); removeEventListener('pointercancel', birak); removeEventListener('pagehide', sakla); root.classList.remove('ok-mount'); });
    menu();
    if (/[?&]oktest/.test(location.search)) window.__ok = { S: () => S, ben: () => ben, OK, cekDene, atDene, raf: () => raf, mod: () => mod, koy: s => { S = s; ciz(); surucu(); }, botAdim };
  }
});
})();
