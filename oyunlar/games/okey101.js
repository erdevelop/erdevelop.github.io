/* 101 Okey — dört kişilik; bilgisayara karşı ya da çevrimiçi (assets/masa.js). Taşlar, gösterge ve okey Okey ile aynıdır (games/okey.js → OK).
   Başlayan 22, diğerleri 21 taş alır. Açmak için perlerin toplamı en az 101 olmalı (seri: aynı renk ardışık; küt: aynı sayı farklı renk; okey yerine geçtiği taşın değerini alır)
   ya da en az 5 çift. Açan, sonraki turlarından itibaren yeni per indirebilir ve masadaki perlere taş işleyebilir; çiftle açan yalnızca çift indirir.
   Yandan (solundakinin attığı) alınan taş o tur kullanılmak zorundadır. İşlenebilecek taşı ya da okeyi atmak 101 ceza.
   El, son taşını atan oyuncuyla biter: bitiren −101, açmayanlar 202, açanlar elindeki taşların toplamı (elde kalan okey 101) yazar.
   Okeyle, çiftle ya da elden (tek turda açıp) bitiş cezaları ikiye katlar; çiftle açanın cezası da iki katıdır. 5 elin sonunda en düşük toplam kazanır. */
(function () {
'use strict';
const OK = typeof module !== 'undefined' && module.exports ? require('./okey.js') : window.OK;
const O1 = (() => {
  const { SAHTE, renk, sayi, deger, okeyMi } = OK, MAC = 5, LIM = 120000;
  const kar = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const onceki = p => (p + 3) % 4;
  function yeni(ilk, o) {
    o = o || {}; const D = kar(Array.from({ length: 106 }, (_, i) => i)), gi = D.findIndex(t => t < SAHTE), gosterge = D.splice(gi, 1)[0];
    const ok = { r: renk(gosterge), s: sayi(gosterge) % 13 + 1 }, el = [[], [], [], []];
    for (let p = 0; p < 4; p++) el[p] = D.splice(0, p === ilk ? 22 : 21);
    return { el, deste: D, atik: [[], [], [], []], gosterge, ok, ilk, sira: ilk, cekti: true, yan: -1, acti: [0, 0, 0, 0], acDeger: [0, 0, 0, 0], acH: [-1, -1, -1, -1], h: 0,
      masa: [], ceza: [0, 0, 0, 0], bitti: null, elNo: o.elNo || 1, puan: o.puan ? o.puan.slice() : [0, 0, 0, 0], gecmis: o.gecmis ? o.gecmis.map(x => x.slice()) : [], tur: o.tur || 1, mac: o.mac ? o.mac.slice() : [0, 0, 0, 0], son: { i: 0 } };
  }
  /* ---------- en yüksek değerli per dizilimi ----------
     opt: { zorunlu: taş (kullanılması şart), birak1: elde en az bir taş kalsın }  →  { deger, perler: [{ tip:'s', r, lo, t } | { tip:'k', s, t }], kalan } ya da null */
  function coz(taslar, ok, opt) {
    opt = opt || {}; const C = [0, 1, 2, 3].map(() => new Array(15).fill(0)); let J = 0, KV = 0;
    for (const t of taslar) { const d = deger(t, ok); if (d.j) J++; else { C[d.r][d.s]++; KV += d.s; } }
    const zor = opt.zorunlu != null && opt.zorunlu >= 0 && taslar.includes(opt.zorunlu) ? deger(opt.zorunlu, ok) : null, zk = zor && !zor.j ? zor.r * 14 + zor.s : -2, zIlk = zor && !zor.j ? C[zor.r][zor.s] : 0;
    let en = -1, enG = null, dugum = 0, artanN = 0, artanZ = 0; const G = [];
    function ara(j, val, kV) {
      if (++dugum > LIM || val + kV + j * 13 <= en) return;
      let r = -1, s = 0; for (let a = 0; a < 4 && r < 0; a++) for (let b = 1; b <= 13; b++) if (C[a][b]) { r = a; s = b; break; }
      if (r < 0) { const zOk = !zor || (zor.j ? j < J : artanZ < zIlk); if (!zOk || (opt.birak1 && artanN + j < 1)) return; if (val > en) { en = val; enG = G.map(g => ({ tip: g.tip, r: g.r, s: g.s, lo: g.lo, g: g.g.slice() })); } return; }
      C[r][s]--; const kV2 = kV - s, buZ = zk === r * 14 + s;
      /* seri: bu taş rengindeki en küçük taş; önüne en çok iki okey gelebilir, 13'ten sonra 1 (14. konum) gelebilir */
      for (let pre = Math.min(2, j, s - 1); pre >= 0; pre--) {
        const lo = s - pre, g = []; let v0 = 0; for (let k = 0; k < pre; k++) { g.push({ j: 1, n: lo + k }); v0 += lo + k; } g.push({ r, s, n: s }); v0 += s;
        const uzat = (kon, jk, v, kv) => {
          if (g.length >= 5 || kon > 14 || (kon === 14 && lo === 1)) { if (g.length >= 3) { G.push({ tip: 's', r, lo, g }); ara(j - jk, val + v, kV2 - kv); G.pop(); } return; }
          const n = kon === 14 ? 1 : kon;
          if (C[r][n]) { C[r][n]--; g.push({ r, s: n, n: kon }); uzat(kon + 1, jk, v + n, kv + n); g.pop(); C[r][n]++; }
          if (jk < j) { g.push({ j: 1, n: kon }); uzat(kon + 1, jk + 1, v + n, kv); g.pop(); }
          if (g.length >= 3) { G.push({ tip: 's', r, lo, g }); ara(j - jk, val + v, kV2 - kv); G.pop(); }
        };
        uzat(s + 1, pre, v0, 0);
      }
      if (s === 1) {   /* …12-13-1 */
        const g = [{ r, s: 1, n: 14 }];
        const asagi = (kon, jk, v, kv) => {
          if (g.length >= 3) { G.push({ tip: 's', r, lo: 15 - g.length, g }); ara(j - jk, val + v, kV2 - kv); G.pop(); }
          if (g.length >= 5 || kon < 2) return;
          if (C[r][kon]) { C[r][kon]--; g.unshift({ r, s: kon, n: kon }); asagi(kon - 1, jk, v + kon, kv + kon); g.shift(); C[r][kon]++; }
          if (jk < j) { g.unshift({ j: 1, n: kon }); asagi(kon - 1, jk + 1, v + kon, kv); g.shift(); }
        };
        asagi(13, 0, 1, 0);
      }
      /* küt */
      const dg = [0, 1, 2, 3].filter(x => x !== r);
      for (let m = 26; m >= 1; m--) {
        const sec = [m % 3, Math.floor(m / 3) % 3, Math.floor(m / 9)]; let uye = 0, jk = 0, olur = true;
        for (let i = 0; i < 3; i++) { if (sec[i]) uye++; if (sec[i] === 2) jk++; else if (sec[i] === 1 && !C[dg[i]][s]) olur = false; }
        if (!olur || uye < 2 || jk > j) continue; const g = [{ r, s }];
        for (let i = 0; i < 3; i++) { if (sec[i] === 1) { C[dg[i]][s]--; g.push({ r: dg[i], s }); } else if (sec[i] === 2) g.push({ j: 1 }); }
        G.push({ tip: 'k', s, g }); ara(j - jk, val + s * (1 + uye), kV2 - s * (uye - jk)); G.pop();
        for (let i = 0; i < 3; i++) if (sec[i] === 1) C[dg[i]][s]++;
      }
      artanN++; if (buZ) artanZ++; ara(j, val, kV2); artanN--; if (buZ) artanZ--;
      C[r][s]++;
    }
    ara(J, 0, KV);
    if (en < 0) return null;
    /* jetonları taşlara çevir; zorunlu taş önce kullanılır */
    const havuz = {}, jok = [];
    for (const t of taslar) { const d = deger(t, ok); if (d.j) jok.push(t); else (havuz[d.r * 14 + d.s] = havuz[d.r * 14 + d.s] || []).push(t); }
    for (const k in havuz) havuz[k].sort((a, b) => (b === opt.zorunlu) - (a === opt.zorunlu) || a - b);
    if (jok.includes(opt.zorunlu)) jok.sort((a, b) => (a === opt.zorunlu) - (b === opt.zorunlu));
    const kul = new Set(), perler = enG.map(x => { const t = x.g.map(y => { const id = y.j ? jok.pop() : havuz[y.r * 14 + y.s].shift(); kul.add(id); return id; }); return x.tip === 's' ? { tip: 's', r: x.r, lo: x.lo, t } : { tip: 'k', s: x.s, t }; });
    return { deger: en, perler, kalan: taslar.filter(t => !kul.has(t)) };
  }
  /* ---------- çiftler ---------- */
  function ciftCoz(taslar, ok, opt) {
    opt = opt || {}; const havuz = {}, jok = [];
    for (const t of taslar) { const d = deger(t, ok); if (d.j) jok.push(t); else (havuz[d.r * 14 + d.s] = havuz[d.r * 14 + d.s] || []).push(t); }
    const z = opt.zorunlu != null && taslar.includes(opt.zorunlu) ? opt.zorunlu : -1, C = [], tek = [];
    for (const k in havuz) { const L = havuz[k].sort((a, b) => (b === z) - (a === z)); while (L.length >= 2) C.push([L.shift(), L.shift()]); if (L.length) tek.push(L[0]); }
    tek.sort((a, b) => (b === z) - (a === z) || sayi(b) - sayi(a));
    while (jok.length && tek.length) C.push([tek.shift(), jok.pop()]);
    while (jok.length >= 2) C.push([jok.pop(), jok.pop()]);
    if (opt.birak1 && !tek.length && !jok.length && C.length) { const i = C.findIndex(c => !c.includes(z)); if (i >= 0) C.splice(i, 1); }
    const kul = new Set(C.flat()); if (z >= 0 && !kul.has(z)) return null;
    return { ciftler: C, kalan: taslar.filter(t => !kul.has(t)) };
  }
  /* ---------- masadaki perlere işleme ---------- */
  function isleBul(S, tas) {
    const d = deger(tas, S.ok), L = [];
    S.masa.forEach((P, i) => {
      if (P.tip === 'c') return;
      if (P.tip === 's') {
        const hi = P.lo + P.t.length - 1;
        if (d.j) { if (hi < 14 && !(hi + 1 === 14 && P.lo === 1)) L.push({ i, m: 'sag' }); else if (P.lo > 1 && !(hi === 14 && P.lo === 2)) L.push({ i, m: 'sol' }); return; }
        if (d.r !== P.r) return;
        if (P.lo > 1 && d.s === P.lo - 1 && !(hi === 14 && P.lo === 2)) L.push({ i, m: 'sol' });
        const ns = hi + 1; if (ns <= 14 && !(ns === 14 && P.lo === 1) && (ns === 14 ? 1 : ns) === d.s) L.push({ i, m: 'sag' });
        P.t.forEach((x, k) => { if (okeyMi(x, S.ok)) { const n = P.lo + k; if ((n === 14 ? 1 : n) === d.s) L.push({ i, m: 'takas', k }); } });
      } else {
        if (d.j) { if (P.t.length < 4) L.push({ i, m: 'kut' }); return; }
        if (d.s !== P.s) return; const R = new Set(P.t.filter(x => !okeyMi(x, S.ok)).map(x => deger(x, S.ok).r)); if (R.has(d.r)) return;
        if (P.t.length < 4) L.push({ i, m: 'kut' });
        const jx = P.t.findIndex(x => okeyMi(x, S.ok)); if (jx >= 0) L.push({ i, m: 'takas', k: jx });
      }
    });
    return L;
  }
  const islek = (S, tas) => isleBul(S, tas).some(x => x.m !== 'takas');
  const isleyebilir = (S, p) => S.acti[p] === 1 && S.acH[p] < S.h;
  const indirebilir = (S, p) => S.acti[p] > 0 && S.acH[p] < S.h;
  /* ---------- açış seçenekleri ---------- */
  function acis(S, p) {
    const el = S.el[p], z = S.yan >= 0 && el.includes(S.yan) ? S.yan : -1, R = { seri: null, cift: null, deger: 0, ciftSay: 0 };
    const c = coz(el, S.ok, { zorunlu: z, birak1: true }); if (c) { R.deger = c.deger; if (c.deger >= 101) R.seri = c; }
    const f = ciftCoz(el, S.ok, { zorunlu: z, birak1: true }); if (f) { R.ciftSay = f.ciftler.length; if (f.ciftler.length >= 5) R.cift = f; }
    if (!c) R.deger = (coz(el, S.ok, { birak1: true }) || { deger: 0 }).deger; if (!f) R.ciftSay = (ciftCoz(el, S.ok, { birak1: true }) || { ciftler: [] }).ciftler.length;
    return R;
  }
  /* indirilebilecek yeni perler (açmış oyuncu, sonraki turlarda) */
  function indirme(S, p) {
    const el = S.el[p], z = S.yan >= 0 && el.includes(S.yan) ? S.yan : -1;
    if (S.acti[p] === 2) { const f = ciftCoz(el, S.ok, { zorunlu: z, birak1: true }); return f && f.ciftler.length ? { cift: f.ciftler } : null; }
    const c = coz(el, S.ok, { zorunlu: z, birak1: true }); return c && c.perler.length ? { perler: c.perler } : null;
  }
  /* ---------- hamleler ---------- */
  const ileri = (S, p, t, tas) => { S.son = { i: S.son.i + 1, p, t, tas: tas == null ? -1 : tas }; };
  function yanUygun(S, p, t) {   /* yandan alınacak taş bu tur kullanılabilir mi */
    const el = S.el[p].concat(t), Y = Object.assign({}, S, { el: S.el.map((e, i) => i === p ? el : e), yan: t });
    if (!S.acti[p]) return !!(acis(Y, p).seri || acis(Y, p).cift);
    if (S.acti[p] === 1 && isleBul(S, t).length) return true;
    const x = indirme(Y, p); return !!x;
  }
  function cek(S, p, n) {
    if (S.bitti || S.sira !== p || S.cekti) return false; let t;
    if (n === 'a') { const A = S.atik[onceki(p)]; if (!A.length || !yanUygun(S, p, A[A.length - 1])) return false; t = A.pop(); S.yan = t; }
    else { if (!S.deste.length) return false; t = S.deste.pop(); S.yan = -1; }
    S.el[p].push(t); S.cekti = true; ileri(S, p, n === 'a' ? 'a' : 'd', n === 'a' ? t : -1); return true;
  }
  const cikar = (S, p, L) => { const s = new Set(L); S.el[p] = S.el[p].filter(t => !s.has(t)); if (s.has(S.yan)) S.yan = -1; };
  function ac(S, p, tur) {
    if (S.bitti || S.sira !== p || !S.cekti || S.acti[p]) return false; const A = acis(S, p);
    if (tur === 'cift') { if (!A.cift) return false; for (const c of A.cift.ciftler) S.masa.push({ tip: 'c', o: p, t: c }); cikar(S, p, A.cift.ciftler.flat()); S.acti[p] = 2; S.acDeger[p] = A.cift.ciftler.length; }
    else { if (!A.seri) return false; for (const P of A.seri.perler) S.masa.push(Object.assign({ o: p }, P)); cikar(S, p, A.seri.perler.flatMap(P => P.t)); S.acti[p] = 1; S.acDeger[p] = A.seri.deger; }
    S.acH[p] = S.h; ileri(S, p, 'ac'); return true;
  }
  function indir(S, p) {
    if (S.bitti || S.sira !== p || !S.cekti || !indirebilir(S, p)) return false; const x = indirme(S, p); if (!x) return false;
    if (x.cift) { for (const c of x.cift) S.masa.push({ tip: 'c', o: p, t: c }); cikar(S, p, x.cift.flat()); }
    else { for (const P of x.perler) S.masa.push(Object.assign({ o: p }, P)); cikar(S, p, x.perler.flatMap(P => P.t)); }
    ileri(S, p, 'in'); return true;
  }
  function isle(S, p, tas, i) {
    if (S.bitti || S.sira !== p || !S.cekti || !isleyebilir(S, p) || !S.el[p].includes(tas)) return false;
    const L = isleBul(S, tas).filter(x => x.i === i); if (!L.length) return false; const x = L.find(y => y.m === 'takas') || L[0], P = S.masa[i];
    if (x.m !== 'takas' && S.el[p].length < 2) return false;
    if (x.m === 'takas') { const j = P.t[x.k]; P.t[x.k] = tas; cikar(S, p, [tas]); S.el[p].push(j); }
    else { if (x.m === 'sol') { P.t.unshift(tas); P.lo--; } else P.t.push(tas); cikar(S, p, [tas]); }
    ileri(S, p, x.m === 'takas' ? 'tk' : 'is', tas); return true;
  }
  /* atış; uyarı: { ceza } döner (atmadan bakmak için atCeza) */
  function atCeza(S, p, tas) { if (S.el[p].length <= 1) return 0; return okeyMi(tas, S.ok) || islek(S, tas) ? 101 : 0; }
  function at(S, p, tas) {
    if (S.bitti || S.sira !== p || !S.cekti) return false; if (S.yan >= 0 && S.el[p].includes(S.yan)) return false; const i = S.el[p].indexOf(tas); if (i < 0) return false;
    const ceza = atCeza(S, p, tas); S.el[p].splice(i, 1);
    if (!S.el[p].length) { S.bitti = { k: p, okey: okeyMi(tas, S.ok), cift: S.acti[p] === 2, elden: S.acH[p] === S.h, tas }; ileri(S, p, 'b', tas); skorla(S); return true; }
    S.ceza[p] += ceza; S.atik[p].push(tas); ileri(S, p, 'at', tas); if (ceza) S.son.ceza = ceza;
    if (!S.deste.length) { S.bitti = { k: -1 }; skorla(S); return true; }
    S.sira = (p + 1) % 4; S.cekti = false; S.yan = -1; S.h++; return true;
  }
  const tasCeza = (t, ok) => okeyMi(t, ok) ? 101 : deger(t, ok).s;
  function skorla(S) {
    const b = S.bitti, m = b.k >= 0 ? (b.okey ? 2 : 1) * (b.cift ? 2 : 1) * (b.elden ? 2 : 1) : 1, sonuc = [0, 0, 0, 0];
    for (let p = 0; p < 4; p++) {
      if (p === b.k) sonuc[p] = -101 * m;
      else if (!S.acti[p]) sonuc[p] = 202 * m;
      else sonuc[p] = S.el[p].reduce((a, t) => a + tasCeza(t, S.ok), 0) * m * (S.acti[p] === 2 ? 2 : 1);
      sonuc[p] += S.ceza[p]; S.puan[p] += sonuc[p];
    }
    b.m = m; S.sonuc = sonuc; S.gecmis.push(sonuc);
  }
  const macBitti = S => !!S.bitti && S.elNo >= MAC;
  const macKazanan = S => [0, 1, 2, 3].sort((a, b) => S.puan[a] - S.puan[b])[0];
  function sonraki(S) { const bitti = macBitti(S), mac = (S.mac || [0, 0, 0, 0]).slice(); if (bitti) mac[macKazanan(S)]++; return yeni((S.ilk + 1) % 4, bitti ? { tur: S.tur + 1, mac } : { elNo: S.elNo + 1, puan: S.puan, gecmis: S.gecmis, tur: S.tur + 1, mac }); }
  /* ---------- bilgisayar ---------- */
  function botCek(S, p, sev) {
    const A = S.atik[onceki(p)]; if (!A.length) return 'd'; const t = A[A.length - 1];
    if (sev === 0 && Math.random() < .5) return 'd';
    return yanUygun(S, p, t) ? 'a' : 'd';
  }
  /* açma / indirme / işleme: bir şey yaptıysa true (her çağrı bir adım) */
  function botYerlestir(S, p, sev) {
    if (!S.acti[p]) { const A = acis(S, p); if (A.seri) return ac(S, p, 'seri'); if (A.cift && (A.ciftSay >= 6 || S.deste.length < 25 || (S.yan >= 0 && S.el[p].includes(S.yan)) || sev === 0)) return ac(S, p, 'cift'); return false; }
    if (!indirebilir(S, p)) return false;
    if (indirme(S, p)) return indir(S, p);
    if (S.acti[p] !== 1) return false;
    /* önce okey değiştir, sonra işle (okey en son) */
    const el = S.el[p].slice().sort((a, b) => okeyMi(a, S.ok) - okeyMi(b, S.ok));
    for (const t of el) { const L = isleBul(S, t); const tk = L.find(x => x.m === 'takas'); if (tk) return isle(S, p, t, tk.i); }
    if (S.el[p].length < 2) return false;
    for (const t of el) { const L = isleBul(S, t).filter(x => x.m !== 'takas'); if (L.length) return isle(S, p, t, L[0].i); }
    return false;
  }
  const komsu = (a, b) => a.s === b.s ? a.r !== b.r : a.r === b.r && Math.abs(a.s - b.s) <= 2;
  function botAt(S, p, sev) {
    const el = S.el[p].filter(t => t !== S.yan), ok = S.ok; if (el.length === 1) return el[0];
    const c = coz(S.el[p], ok, {}) || { perler: [] }, perde = new Set(c.perler.flatMap(P => P.t));
    const f = ciftCoz(S.el[p], ok, {}), ciftte = new Set(f ? f.ciftler.flat() : []), ciftYol = !S.acti[p] && f && f.ciftler.length >= 4 || S.acti[p] === 2;
    let en = -1e9, sec = el[0];
    for (const t of el) {
      const d = deger(t, ok); let v = 0;
      if (d.j) v -= 5000; else {
        if (atCeza(S, p, t)) v -= 2000;
        if (S.acti[p] === 2 || ciftYol) { if (ciftte.has(t)) v -= 600; } else if (perde.has(t)) v -= 600;
        let k = 0; for (const u of S.el[p]) if (u !== t) { const e = deger(u, ok); if (!e.j && komsu(d, e)) k++; else if (!e.j && e.s === d.s && e.r === d.r) k += .5; }
        v -= k * 40; v += d.s * (S.acti[p] ? 6 : 2);
        if (sev === 0) v += Math.random() * 400;
      }
      if (v > en) { en = v; sec = t; }
    }
    return sec;
  }
  return { MAC, yeni, coz, ciftCoz, isleBul, islek, isleyebilir, indirebilir, acis, indirme, yanUygun, cek, ac, indir, isle, at, atCeza, skorla, macBitti, sonraki, botCek, botYerlestir, botAt, onceki, tasCeza };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = O1; return; }
window.O1 = O1;
})();
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame || !window.O1) return;
const OK = window.OK, O1 = window.O1, bekle = ms => new Promise(r => setTimeout(r, ms));
const RENK = ['#d43a3a', '#23272e', '#2468d8', '#d08c00'], SEKIL = ['●', '■', '▲', '◆'], BOT = ['Ada', 'Efe', 'Can', 'Naz'], SAHIP = ['#7c3aed', '#0891b2', '#e11d48', '#059669'], YUVA = 36, SUTUN = 12;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function kapak() {
  const t = (x, y, c, n, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-8" y="-11" width="16" height="22" rx="2.500" fill="#fffdf4" stroke="#cbbf9c"/><text y="2" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="11" fill="${c}">${n}</text><circle cy="7" r="1.600" fill="${c}"/></g>`;
  let s = '<rect width="90" height="90" fill="#155e3b"/><rect x="5" y="62" width="80" height="23" rx="4" fill="#a8743f"/><rect x="5" y="62" width="80" height="4" rx="2" fill="#c08a52"/>';
  [10, 11, 12, 13].forEach((n, i) => s += t(18 + i * 17, 20, RENK[2], n, 0)); [7, 7, 7].forEach((n, i) => s += t(27 + i * 17, 45, RENK[i === 1 ? 1 : i * 3 / 2 | 0], n, 0));
  s += '<text x="45" y="80" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="15" fill="#fff">101</text>';
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const CSS = `
.o1-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.o1{width:min(620px,100%);margin:0 auto;display:flex;flex-direction:column;gap:6px;-webkit-user-select:none;user-select:none;position:relative;--tw:30px;--mt:19px}
.o1 h3{margin:0;font-size:19px;font-weight:800}.o1 p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.o1-b{padding:11px 8px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center}.o1-b.ana{background:var(--accent);color:#fff}.o1-b:disabled{opacity:.4}
.o1-b.yesil{background:#16a34a;color:#fff;animation:o1P .8s infinite alternate}@keyframes o1P{to{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.3)}}
.o1-sat{display:flex;gap:8px}.o1-sat>*{flex:1;min-width:0}
.o1-menu{display:flex;flex-direction:column;gap:10px;width:min(460px,100%);margin:0 auto}
.o1-t{width:var(--tw);height:calc(var(--tw)*1.38);border-radius:calc(var(--tw)*.14);background:linear-gradient(#fffef8,#efe6cf);border:1px solid #c9bd9a;box-shadow:0 1.500px 0 #b3a57e,0 2px 3px rgba(0,0,0,.22);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;font-family:Nunito,system-ui,sans-serif;flex:none;box-sizing:border-box}
.o1-t b{font-size:calc(var(--tw)*.56);font-weight:900;line-height:1;letter-spacing:-.04em}.o1-t i{font-style:normal;font-size:calc(var(--tw)*.26);line-height:1}
.o1-t.okey{box-shadow:0 0 0 2px #f2b600,0 2px 3px rgba(0,0,0,.22)}.o1-t.okey::after{content:'★';position:absolute;top:0;right:1px;font-size:calc(var(--tw)*.3);color:#e0a400;line-height:1}
.o1-t.sahte i{font-size:calc(var(--tw)*.2);font-weight:800}
.o1-t.arka{background:repeating-linear-gradient(45deg,#c9a56b,#c9a56b 4px,#b8935a 4px,#b8935a 8px);border-color:#8e6c3a}
.o1-t.bos{background:transparent;border:1.500px dashed var(--line);box-shadow:none}
.o1-t.yeni{animation:o1Y .7s}@keyframes o1Y{0%{transform:scale(1.35);filter:brightness(1.25)}100%{transform:none}}
.o1-ust{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.o1-oy{display:flex;flex-direction:column;gap:2px;padding:5px 7px;border-radius:11px;background:var(--bg2);min-width:0;font-size:12px;font-weight:800;line-height:1.2;position:relative;border-left:4px solid var(--c)}
.o1-oy .ad{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.o1-oy small{color:var(--ink-soft);font-weight:800;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.o1-oy .son{position:absolute;right:5px;bottom:4px;--tw:17px}
.o1-oy.sira{box-shadow:inset 0 0 0 2px var(--accent)}.o1-oy.yok{opacity:.55}
.o1-orta{display:flex;gap:8px;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:radial-gradient(ellipse at 50% 40%,#2c9160,#1b6b43);color:#fff}
.o1-yer{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;border-radius:9px;min-width:44px}.o1-yer small{font-size:10.5px;font-weight:800;opacity:.9;white-space:nowrap}
.o1-yer.al{box-shadow:0 0 0 3px #7dffb0;background:rgba(125,255,176,.18);cursor:pointer;animation:o1A 1s infinite alternate}@keyframes o1A{to{box-shadow:0 0 0 3px rgba(125,255,176,.3)}}
.o1-yer.at{box-shadow:0 0 0 2px rgba(255,255,255,.6);cursor:pointer}.o1-yer.hedef{background:rgba(255,255,255,.3)}
.o1-yer .o1-t.bos{border-color:rgba(255,255,255,.45)}
.o1-masa{flex:1 1 auto;min-height:92px;overflow:auto;padding:6px;border-radius:13px;background:color-mix(in srgb,#1b6b43 14%,var(--bg2));display:flex;flex-direction:column;gap:5px;--tw:var(--mt)}
.o1-masa .bos{margin:auto;font-size:12.5px;font-weight:800;color:var(--ink-soft);text-align:center}
.o1-grup{display:flex;flex-wrap:wrap;gap:4px 7px;align-items:center}.o1-grup>em{font-style:normal;font-size:11px;font-weight:800;color:#fff;background:var(--c);border-radius:7px;padding:1px 6px;white-space:nowrap}
.o1-per{display:flex;gap:1px;padding:2px;border-radius:6px;border:1.500px solid transparent}.o1-per.hedef{border-color:#16a34a;background:rgba(34,197,94,.2);cursor:pointer;animation:o1A 1s infinite alternate}
.o1-per.yeni{animation:o1Y .7s}
.o1-ben{display:flex;align-items:center;gap:8px;min-height:32px;padding:3px 10px;border-radius:11px;background:var(--bg2);font-size:13.5px;font-weight:800;border-left:4px solid ${SAHIP[0]}}
.o1-ben.sira{box-shadow:inset 0 0 0 2px var(--accent)}.o1-ben small{color:var(--ink-soft);font-weight:800;white-space:nowrap}
.o1-bilgi{flex:1;text-align:right;font-weight:700;color:var(--ink-soft);font-size:12.5px;line-height:1.25}.o1-bilgi b{color:var(--ink)}
.o1-raf{display:grid;grid-template-columns:repeat(${SUTUN},var(--tw));gap:3px;padding:5px;justify-content:center;border-radius:12px;background:linear-gradient(#b88a55,#9a6f3f);box-shadow:inset 0 2px 0 rgba(255,255,255,.25),inset 0 -3px 0 rgba(0,0,0,.2);touch-action:none;flex:none}
.o1-s{width:var(--tw);height:calc(var(--tw)*1.38);border-radius:calc(var(--tw)*.14);background:rgba(0,0,0,.13)}
.o1-s .o1-t{cursor:grab;transition:transform .12s}.o1-s .o1-t.sec{transform:translateY(-18%);box-shadow:0 0 0 2.500px #3b82f6,0 6px 10px rgba(0,0,0,.3)}
.o1-s .o1-t.yan{outline:2.500px dashed #16a34a;outline-offset:1px}
.o1-s.tasiniyor .o1-t{opacity:.25}.o1-s.hedef{background:rgba(255,255,255,.4)}
.o1-hayalet{position:fixed;z-index:60;pointer-events:none;transform:translate(-50%,-70%) scale(1.15);box-shadow:0 10px 18px rgba(0,0,0,.4)}
.o1-alt{display:flex;gap:6px;flex:none}.o1-alt .o1-b{flex:1}.o1-alt .o1-b[data-a=cik]{flex:none;width:42px}
.o1-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:14px;animation:o1S .3s .25s both}@keyframes o1S{from{opacity:0}}
.o1-son>div{display:flex;flex-direction:column;gap:9px;align-items:stretch;text-align:center;padding:16px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(380px,94%);max-height:94%;overflow:auto}.o1-son h3{font-size:22px}
.o1-tablo{width:100%;border-collapse:collapse;font-weight:800;font-size:13px;font-variant-numeric:tabular-nums}.o1-tablo th,.o1-tablo td{padding:4px 5px;text-align:right}.o1-tablo th:first-child,.o1-tablo td:first-child{text-align:left}
.o1-tablo thead th{color:var(--ink-soft);font-size:11.5px}.o1-tablo tr.ben td{color:var(--accent-ink)}.o1-tablo tr.ilk td:first-child::after{content:' 👑'}.o1-tablo tfoot td{border-top:2px solid var(--line)}
`;
function tasHtml(t, ok, ek) {
  if (t == null || t < 0) return '<div class="o1-t arka"></div>';
  const sahte = t >= OK.SAHTE, r = sahte ? -1 : OK.renk(t);
  return `<div class="o1-t${OK.okeyMi(t, ok) ? ' okey' : ''}${sahte ? ' sahte' : ''} ${ek || ''}" data-t="${t}" style="color:${sahte ? '#15803d' : RENK[r]}"><b>${sahte ? '✤' : OK.sayi(t)}</b><i>${sahte ? 'sahte' : SEKIL[r]}</i></div>`;
}
registerGame({
  id: 'okey101', title: '101 Okey', category: 'Masa', tags: '101 okey yüzbir taş per çift işleme el açma çevrimiçi online dört kişilik', odak: true, noRestart: true,
  aciklama: 'Dört kişilik 101: 101 ile ya da beş çiftle elini aç, masadaki perlere taş işle, ilk bitiren ol. Bilgisayara karşı ya da çevrimiçi.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="2" y="6" width="6" height="9" rx="1.300"/><rect x="9" y="6" width="6" height="9" rx="1.300"/><rect x="16" y="6" width="6" height="9" rx="1.300"/><path d="M2 19h20"/></svg>',
  shareText() { return this._paylas || '101 Okey: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('o1-css')) { const s = document.createElement('style'); s.id = 'o1-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('o1-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, mac: 0, kaz: 0, ag: 0, o: '', sev: 1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'o1' }); root.append(kok);
    let sohbetK = null;
    let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, raf = new Array(YUVA).fill(null), rafTur = -1, secili = null, mesaj = '', mesajT = 0, yeniTas = null, gorulenI = -1,
      surT = 0, sur = null, canli = true, sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, vekil = '', uyari = -1, dizTur = 'seri', masaGor = 0, yazSira = Promise.resolve();
    const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
    const koltuklar = () => oda ? oda.koltuklar() : null;
    const botMu = p => mod === 'yz' ? p !== ben : !(koltuklar()[p]);
    const kopuk = p => { const K = koltuklar(); return !!(K && K[p] && !K[p].var); };
    const ad = p => { if (mod === 'yz') return p === ben ? 'Sen' : BOT[p]; const K = koltuklar(); return K && K[p] ? K[p].n : BOT[p]; };
    const benimSira = () => S && !S.bitti && S.sira === ben;
    const renkOf = p => SAHIP[(p - ben + 4) % 4];
    function mesajVer(m, sure) { mesaj = m; clearTimeout(mesajT); mesajT = setTimeout(() => { mesaj = ''; ciz(); }, sure || 2200); ciz(); }

    /* ---------- menü ---------- */
    function menu() {
      temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { } const var_ = eski && eski.S && !(eski.S.bitti && O1.macBitti(eski.S));
      kok.innerHTML = `<div class="o1-menu"><h3>🀄 101 Okey</h3><p>${D.mac ? `Bilgisayara karşı <b>${D.mac}</b> maç, <b>${D.kaz}</b> galibiyet${D.ag ? ' · çevrimiçi ' + D.ag + ' galibiyet' : ''}` : '101 ile ya da beş çiftle elini aç, taşlarını masaya indir, ilk bitiren ol. Maç beş el sürer; en düşük toplam kazanır.'}</p>
        ${var_ ? `<button class="o1-b ana" data-a="devam">▶ Yarım kalan maça devam (${eski.S.elNo}. el)</button>` : ''}
        <div class="o1-sat"><button class="o1-b ${var_ ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="o1-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
        <button class="o1-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="o1-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/okey101/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="o1-menu"><h3>Nasıl oynanır</h3>
        <p>• Taşlar ve okey, Okey’dekiyle aynı: gösterge taşının bir büyüğü okeydir (★), her taşın yerine geçer. Başlayan 22, diğerleri 21 taşla başlar.</p>
        <p>• Sıran gelince <b>desteden</b> ya da <b>solundakinin attığı taştan</b> çek. Yandan aldığın taşı o tur kullanmak zorundasın (açarken, indirirken ya da işlerken). Sonra bir taş at.</p>
        <p>• <b>Elini açmak</b> için perlerinin toplamı en az <b>101</b> olmalı (seri: aynı renk ardışık; küt: aynı sayı farklı renk; okey yerine geçtiği taşın değerini alır) ya da en az <b>5 çiftin</b> olmalı. Bilgi satırında kaç puanın olduğu yazar; yetince <b>Aç</b> düğmesi yanar ve en iyi dizilimle açar.</p>
        <p>• Açtıktan sonraki turlarında <b>İndir</b> ile yeni perler indirebilir, bir taşa sonra masadaki bir pere dokunarak <b>işleyebilirsin</b>. Masadaki okeyin yerini tutan taş sende varsa o pere dokununca okeyi alırsın. Çiftle açan yalnızca çift indirir, işleme yapamaz.</p>
        <p>• İşlenebilecek bir taşı ya da okeyi atmak <b>101 ceza</b> yazar (atmadan önce uyarılırsın).</p>
        <p>• Son taşını atan eli bitirir: <b>−101</b> yazar. Açmayanlar <b>202</b>, açanlar elinde kalan taşların toplamını yazar (elde kalan okey 101). Okeyle, çiftle ya da tek turda açıp bitirmek cezaları ikiye katlar. Deste biterse kimse −101 almaz.</p>
        <p>• Maç beş el sürer; toplamı en düşük olan kazanır.</p>
        <a class="o1-b" href="/oyun-kurallari/101-okey/" style="text-decoration:none;display:block">📖 Ayrıntılı kurallar ve ipuçları</a>
        <button class="o1-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="o1-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="o1-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'okey101', koltuk: 4, enAz: 1, botlu: true, baslik: '101 Okey', onGeri: menu,
        baslat: o => o.baslat(O1.yeni((Math.random() * 4) | 0)), onOda: o => { lobi = null; agBasla(o); } });
    }
    /* ---------- ekran ---------- */
    function ekran() {
      kok.innerHTML = `<div class="o1-ust" id="o1-u"></div><div class="o1-orta" id="o1-o"></div><div class="o1-masa" id="o1-m"></div>
        <div class="o1-ben" id="o1-ben"><b></b><small></small><span class="o1-bilgi" id="o1-b"></span></div><div class="o1-raf" id="o1-r"></div>
        <div class="o1-alt"><button class="o1-b" data-a="cik">‹</button><button class="o1-b" data-a="diz">Diz</button><button class="o1-b" data-a="ac" disabled>Aç</button><button class="o1-b ana" data-a="at" disabled>At</button></div>`;
      q('#o1-r').addEventListener('pointerdown', basla);
    }
    function olcu() {
      const W = kok.clientWidth || 340, tw = Math.max(21, Math.min(40, Math.floor(((W - 10 - (SUTUN - 1) * 3) / SUTUN) * 10) / 10)); kok.style.setProperty('--tw', tw + 'px'); kok.style.setProperty('--mt', Math.max(16, Math.min(24, tw * .66)) + 'px');
    }
    function masaBoy() { const m = q('#o1-m'), r = q('#o1-r'); if (!m || !r) return; const tw = parseFloat(kok.style.getPropertyValue('--tw')) || 28, ust = m.getBoundingClientRect().top, alt = tw * 1.38 * 3 + 6 + 10 + 32 + 44 + 6 * 3 + 12; m.style.height = Math.round(Math.max(96, innerHeight - ust - alt)) + 'px'; }
    function rafEsle() {
      const el = S.el[ben]; if (S.tur !== rafTur) { raf.fill(null); rafTur = S.tur; }
      const var_ = new Set(el); for (let i = 0; i < YUVA; i++) if (raf[i] != null && !var_.has(raf[i])) { raf[i] = null; if (secili === i) secili = null; }
      const yerde = new Set(raf.filter(x => x != null)), eksik = el.filter(t => !yerde.has(t));
      if (!yerde.size && eksik.length > 1) return yerlestir('seri');
      for (const t of eksik) { let i = YUVA - 1; while (i >= 0 && raf[i] != null) i--; if (i >= 0) raf[i] = t; }
    }
    function yerlestir(tur) {
      const el = S.el[ben], G = [];
      if (tur === 'cift') { const f = O1.ciftCoz(el, S.ok, {}); f.ciftler.forEach(c => G.push(c)); if (f.kalan.length) G.push(f.kalan.sort((a, b) => OK.renk(a) - OK.renk(b) || OK.sayi(a) - OK.sayi(b))); }
      else { const c = O1.coz(el, S.ok, {}) || { perler: [], kalan: el.slice() }; c.perler.forEach(P => G.push(P.t)); if (c.kalan.length) G.push(c.kalan.sort((a, b) => (a >= OK.SAHTE ? 9 : OK.renk(a)) - (b >= OK.SAHTE ? 9 : OK.renk(b)) || OK.sayi(a) - OK.sayi(b))); }
      const dene = bosluk => { const R = new Array(YUVA).fill(null); let i = 0;
        for (const g of G) { if (bosluk && g.length <= SUTUN && i % SUTUN && Math.floor(i / SUTUN) !== Math.floor((i + g.length - 1) / SUTUN)) i = (Math.floor(i / SUTUN) + 1) * SUTUN;
          for (const t of g) { if (i >= YUVA) return null; R[i++] = t; } if (bosluk && i % SUTUN) i++; } return R; };
      raf = dene(true) || dene(false) || raf; secili = null;
    }
    const secTas = () => secili != null ? raf[secili] : null;
    function ciz() {
      if (!S || !q('#o1-m')) return; if (sur && sur.h) return;
      olcu(); rafEsle(); const bS = benimSira(), vurgu = S.son && S.son.i !== gorulenI ? S.son : null; gorulenI = S.son ? S.son.i : -1;
      /* rakipler: sol, karşı, sağ */
      let h = '';
      for (const r of [3, 2, 1]) { const p = (ben + r) % 4, A = S.atik[p];
        h += `<div class="o1-oy${S.sira === p && !S.bitti ? ' sira' : ''}${kopuk(p) ? ' yok' : ''}" style="--c:${renkOf(p)}" data-p="${p}"><span class="ad">${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}</span>
          <small>${S.el[p].length} taş · ${S.acti[p] ? (S.acti[p] === 2 ? S.acDeger[p] + ' çift' : S.acDeger[p] + ' açtı') : 'açmadı'}</small><small>${S.puan[p]} puan${S.ceza[p] ? ' · ceza ' + S.ceza[p] : ''}</small>
          ${A.length && r !== 3 ? `<span class="son">${tasHtml(A[A.length - 1], S.ok)}</span>` : ''}</div>`; }
      q('#o1-u').innerHTML = h;
      const sol = S.atik[(ben + 3) % 4], solUst = sol[sol.length - 1], yanAl = bS && !S.cekti && sol.length, atY = bS && S.cekti;
      q('#o1-o').innerHTML = `<div class="o1-yer${bS && !S.cekti ? ' al' : ''}" data-a="deste"><div class="o1-t arka"></div><small>${S.deste.length} taş</small></div>
        <div class="o1-yer">${tasHtml(S.gosterge, S.ok)}<small>gösterge</small></div>
        <div class="o1-yer${yanAl ? ' al' : ''}" data-a="yan">${solUst != null ? tasHtml(solUst, S.ok, vurgu && vurgu.t === 'at' && vurgu.p === (ben + 3) % 4 ? 'yeni' : '') : '<div class="o1-t bos"></div>'}<small>soldan</small></div>
        <div class="o1-yer${atY ? ' at' : ''}" data-a="atyer">${S.atik[ben].length ? tasHtml(S.atik[ben][S.atik[ben].length - 1], S.ok) : '<div class="o1-t bos"></div>'}<small>at</small></div>`;
      /* masa */
      const st = secTas(), hedefler = st != null && bS && S.cekti && O1.isleyebilir(S, ben) ? new Set(O1.isleBul(S, st).filter(x => x.m === 'takas' || S.el[ben].length > 1).map(x => x.i)) : new Set();
      let m = ''; const sahipler = [];
      for (const r of [0, 1, 2, 3]) { const p = (ben + r) % 4, L = S.masa.map((P, i) => [P, i]).filter(([P]) => P.o === p); if (!L.length) continue;
        m += `<div class="o1-grup" style="--c:${renkOf(p)}"><em>${esc(ad(p))}</em>${L.map(([P, i]) => `<div class="o1-per${hedefler.has(i) ? ' hedef' : ''}${vurgu && i >= masaGor ? ' yeni' : ''}" data-per="${i}">${P.t.map(t => tasHtml(t, S.ok)).join('')}</div>`).join('')}</div>`; }
      masaGor = S.masa.length;
      const mEl = q('#o1-m'), kay = mEl.scrollTop; mEl.innerHTML = m || '<div class="bos">Masada henüz per yok. Açan oyuncuların perleri burada görünür.</div>'; mEl.scrollTop = kay;
      /* ıstaka */
      let rh = ''; const yanVar = S.yan >= 0 && S.el[ben].includes(S.yan) && bS;
      for (let i = 0; i < YUVA; i++) rh += `<div class="o1-s" data-i="${i}">${raf[i] != null ? tasHtml(raf[i], S.ok, (secili === i ? 'sec ' : '') + (raf[i] === yeniTas ? 'yeni ' : '') + (yanVar && raf[i] === S.yan ? 'yan' : '')) : ''}</div>`;
      q('#o1-r').innerHTML = rh; yeniTas = null;
      const bn = q('#o1-ben'); bn.classList.toggle('sira', !!bS); bn.querySelector('b').textContent = ad(ben); bn.querySelector('small').textContent = S.puan[ben] + ' puan' + (S.ceza[ben] ? ' · ceza ' + S.ceza[ben] : '');
      /* düğmeler ve bilgi */
      const acB = q('[data-a=ac]'), atB = q('[data-a=at]'); let bilgi = '';
      acB.className = 'o1-b'; acB.disabled = true; acB.textContent = S.acti[ben] ? 'İndir' : 'Aç'; acB.dataset.tur = '';
      if (bS && S.cekti) {
        if (!S.acti[ben]) { const A = O1.acis(S, ben); if (A.seri || A.cift) { acB.disabled = false; acB.classList.add('yesil'); acB.dataset.tur = A.seri ? 'seri' : 'cift'; acB.textContent = A.seri ? `Aç (${A.seri.deger})` : `Çift aç (${A.cift.ciftler.length})`; }
          bilgi = yanVar ? 'Soldan aldığın taşla <b>açmalısın</b>.' : A.seri || A.cift ? '<b>Açabilirsin!</b>' : `Açış: <b>${A.deger}</b>/101 · ${A.ciftSay}/5 çift`; }
        else if (O1.indirebilir(S, ben)) { const x = O1.indirme(S, ben); if (x) { acB.disabled = false; acB.classList.add('yesil'); }
          bilgi = yanVar ? 'Soldan aldığın taşı <b>kullan</b> (indir ya da işle).' : st != null && hedefler.size ? 'Yeşil pere dokunarak <b>işle</b>.' : x ? 'Yeni per indirebilirsin.' : 'Taşa dokun, işle ya da <b>At</b>.'; }
        else bilgi = 'Bu tur açtın; işleme sonraki turda.';
      }
      atB.disabled = !(bS && S.cekti && st != null && !yanVar); atB.textContent = uyari === st && st != null ? 'Yine de at' : 'At';
      q('#o1-b').innerHTML = mesaj || (S.bitti ? '' : bS ? (!S.cekti ? (sol.length ? 'Sıra sende: <b>desteden</b> ya da <b>soldan</b> çek.' : 'Sıra sende: <b>desteye dokun</b>.') : bilgi) : `<b>${esc(ad(S.sira))}</b> oynuyor…`);
      q('[data-a=diz]').textContent = dizTur === 'seri' ? 'Seri diz' : 'Çift diz'; masaBoy();
    }
    /* ---------- ıstaka ---------- */
    function basla(e) { const s = e.target.closest('.o1-s'); if (!s || !S || sur) return; const i = +s.dataset.i; sur = { i, t: raf[i], x0: e.clientX, y0: e.clientY, h: null, id: e.pointerId }; }
    function oynat(e) {
      if (!sur || sur.t == null || e.pointerId !== sur.id) return;
      if (!sur.h) { if (Math.hypot(e.clientX - sur.x0, e.clientY - sur.y0) < 9) return; const kay = q(`.o1-s[data-i="${sur.i}"]`), t = kay && kay.querySelector('.o1-t'); if (!t) { sur = null; return; }
        const h = t.cloneNode(true); h.classList.remove('sec', 'yeni', 'yan'); h.classList.add('o1-hayalet'); h.style.setProperty('--tw', getComputedStyle(kok).getPropertyValue('--tw')); document.body.appendChild(h); sur.h = h; kay.classList.add('tasiniyor');
        if (secili !== sur.i) { secili = sur.i; } const bek = sur; sur = null; ciz(); sur = bek; const k2 = q(`.o1-s[data-i="${sur.i}"]`); if (k2) k2.classList.add('tasiniyor'); }
      sur.h.style.left = e.clientX + 'px'; sur.h.style.top = e.clientY + 'px';
      kok.querySelectorAll('.o1-s.hedef,.o1-yer.hedef').forEach(x => x.classList.remove('hedef')); const hd = altindaki(e); if (hd && !hd.classList.contains('o1-per')) hd.classList.add('hedef');
    }
    function altindaki(e) { const el = document.elementFromPoint(e.clientX, e.clientY); if (!el || !kok.contains(el)) return null; return el.closest('.o1-s') || el.closest('.o1-yer[data-a=atyer]') || el.closest('.o1-per.hedef'); }
    function birak(e) {
      if (!sur || (e.pointerId != null && e.pointerId !== sur.id)) return; const x = sur; sur = null;
      if (x.h) { x.h.remove(); const hd = e.type === 'pointercancel' ? null : altindaki(e);
        if (hd && hd.classList.contains('o1-s')) { tasi(x.i, +hd.dataset.i); secili = null; } else if (hd && hd.dataset.per != null) isleDene(x.t, +hd.dataset.per); else if (hd) atDene(x.t); else secili = null; ciz(); return; }
      if (e.type === 'pointercancel') return;
      if (secili == null) { if (x.t != null) { secili = x.i; ses('click'); } } else if (secili === x.i) secili = null; else { tasi(secili, x.i); secili = null; }
      uyari = -1; ciz();
    }
    function tasi(a, b) { if (a === b) return; const t = raf[a]; raf[a] = raf[b]; raf[b] = t; ses('click'); yerelKaydet(); }
    /* ---------- hamleler ---------- */
    function oyna(f, sesAdi) { const Y = kopya(S); if (!f(Y)) return false; ses(sesAdi || 'tap'); uygula(Y); return true; }
    function cekDene(n) {
      if (!S || S.bitti) return; if (!benimSira()) return mesajVer('Sıra sende değil.'); if (S.cekti) return mesajVer('Taşını çektin.');
      if (n === 'a') { const A = S.atik[(ben + 3) % 4]; if (!A.length) return; if (!O1.yanUygun(S, ben, A[A.length - 1])) return mesajVer(S.acti[ben] ? 'Bu taşı bu tur kullanamazsın; desteden çek.' : 'Bu taşla şu an açamazsın; desteden çek.', 2600); }
      secili = null; uyari = -1; mesaj = ''; const Y = kopya(S); if (!O1.cek(Y, ben, n)) return; yeniTas = Y.el[ben][Y.el[ben].length - 1]; ses('tap'); uygula(Y);
    }
    function atDene(t) {
      if (!S || S.bitti || t == null) return; if (!benimSira()) return mesajVer('Sıra sende değil.'); if (!S.cekti) return mesajVer('Önce bir taş çek.');
      if (S.yan >= 0 && S.el[ben].includes(S.yan)) return mesajVer('Soldan aldığın taşı önce kullanmalısın.');
      const c = O1.atCeza(S, ben, t); if (c && uyari !== t) { uyari = t; return mesajVer(OK.okeyMi(t, S.ok) ? 'Okeyi atarsan <b>101 ceza</b> yazar. Yine de atmak için yeniden bas.' : 'Bu taş masadaki bir pere işlenebiliyor: atarsan <b>101 ceza</b>. Yine de atmak için yeniden bas.', 3500); }
      uyari = -1; secili = null; mesaj = ''; oyna(Y => O1.at(Y, ben, t), c ? 'bad' : 'tap');
    }
    function isleDene(t, i) {
      if (!S || t == null || !benimSira() || !S.cekti) return; if (!O1.isleyebilir(S, ben)) return mesajVer(S.acti[ben] === 2 ? 'Çiftle açan işleme yapamaz.' : 'İşlemek için önceki bir turda açmış olmalısın.');
      const L = O1.isleBul(S, t).filter(x => x.i === i); if (!L.length) return mesajVer('Bu taş o pere uymuyor.'); if (!L.some(x => x.m === 'takas') && S.el[ben].length < 2) return mesajVer('Atmak için elinde bir taş kalmalı.');
      secili = null; uyari = -1; mesaj = ''; const okeyAl = L.some(x => x.m === 'takas'); if (oyna(Y => O1.isle(Y, ben, t, i), okeyAl ? 'score' : 'tap') && okeyAl) mesajVer('Okeyi aldın! ★');
    }
    function acDene() {
      if (!benimSira() || !S.cekti) return; secili = null; uyari = -1;
      if (!S.acti[ben]) { const A = O1.acis(S, ben), tur = A.seri ? 'seri' : A.cift ? 'cift' : ''; if (!tur) return; if (oyna(Y => O1.ac(Y, ben, tur), 'score')) { if (window.Progress) Progress.olay('o1_ac'); yerlestir(dizTur === 'seri' ? 'seri' : 'cift'); ciz(); } if (S.acti[ben]) mesajVer(tur === 'seri' ? `<b>${A.seri.deger}</b> ile açtın!` : `<b>${A.cift.ciftler.length} çift</b> ile açtın!`); }
      else if (oyna(Y => O1.indir(Y, ben), 'score')) { yerlestir('seri'); mesajVer('Perlerini indirdin.'); }
    }
    function uygula(Y) { S = Y; if (mod === 'ag') gonder(); else yerelKaydet(); ciz(); if (S.bitti) bitti(); else surucu(); }
    function surucu() {
      clearTimeout(surT); if (!S || S.bitti || !canli) return; const p = S.sira; let sure;
      if (mod === 'yz') { if (p === ben) return; sure = S.cekti ? 650 : 600; }
      else { const K = koltuklar(), bagli = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0 && i !== p); if (!bagli.length || bagli[0] !== ben) return; sure = !K[p] || vekil === p + ':' + S.tur + ':' + S.son.i ? 700 : !K[p].var ? 12000 : 90000; }
      const i0 = S.son.i, tur0 = S.tur; surT = setTimeout(() => { if (!S || S.bitti || S.sira !== p || S.son.i !== i0 || S.tur !== tur0 || !canli) return; botAdim(p); }, sure);
    }
    function botAdim(p) {
      const Y = kopya(S), s = mod === 'yz' ? sev : 1;
      if (!Y.cekti) O1.cek(Y, p, O1.botCek(Y, p, s)); else if (!O1.botYerlestir(Y, p, s)) { if (Y.yan >= 0 && Y.el[p].includes(Y.yan)) Y.yan = -1; O1.at(Y, p, O1.botAt(Y, p, s)); }
      if (p === ben) secili = null; vekil = !Y.bitti && Y.sira === p ? p + ':' + Y.tur + ':' + Y.son.i : ''; ses('tap'); uygula(Y);
    }
    /* ---------- bitiş ---------- */
    function bitti() {
      clearTimeout(surT); const b = S.bitti, mb = O1.macBitti(S), anahtar = mod + ':' + S.tur + ':' + (oda ? oda.kod : ''), lider = [0, 1, 2, 3].sort((a, c) => S.puan[a] - S.puan[c])[0];
      if (sayilan !== anahtar) { sayilan = anahtar; const PR = window.Progress; if (PR) { if (b.k === ben && b.elden) PR.olay('o1_elden'); }
        if (mod === 'yz') { if (mb) { D.mac++; if (lider === ben) { D.kaz++; api.submitScore(D.kaz); } } kaydet(); yerelKaydet(); } else { if (mb && lider === ben) { D.ag++; kaydet(); } if (oda && mb) oda.bitir(); }
        const iyi = b.k === ben || (mb && lider === ben); ses(iyi ? 'win' : b.k < 0 ? 'click' : 'lose'); if (iyi) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } }
      if (mod === 'ag' && oda && window.Masa && Masa.sonuc && mb) Masa.sonuc(oda, lider === ben ? 1 : 0, 'm' + S.tur);
      oyun._paylas = '101 Okey: ' + (mb ? (lider === ben ? 'maçı kazandım!' : 'maç bitti.') : b.k === ben ? 'eli bitirdim!' : 'bir el daha oynadık.') + '\nerdevelop.com/oyunlar/#o/okey101';
      const e = q('.o1-son'); if (e) e.remove(); const s = E('div', { class: 'o1-son' });
      const nedeni = b.k < 0 ? 'Deste bitti; kimse bitiremedi.' : [b.okey && 'okeyle', b.cift && 'çiftle', b.elden && 'elden'].filter(Boolean).join(', ') + (b.m > 1 ? ` bitti · cezalar ×${b.m}` : 'Normal bitiş');
      const sira = [0, 1, 2, 3].sort((a, c) => S.puan[a] - S.puan[c]), MS = (S.mac || [0, 0, 0, 0]).slice(); if (mb) MS[lider]++;
      s.innerHTML = `<div><h3>${mb ? (lider === ben ? '🏆 Maçı kazandın!' : esc(ad(lider)) + ' maçı kazandı') : b.k < 0 ? 'Deste bitti' : b.k === ben ? '🎉 Bitirdin!' : esc(ad(b.k)) + ' bitirdi'}</h3>
        <p>${mb ? `${S.elNo} el oynandı · ` : `${S.elNo}. el / ${O1.MAC} · `}${esc(nedeni.charAt(0).toUpperCase() + nedeni.slice(1))}</p>
        <table class="o1-tablo"><thead><tr><th></th>${S.gecmis.map((_, i) => `<th>${i + 1}.</th>`).join('')}<th>Toplam</th>${MS.some(Boolean) ? '<th>🏆</th>' : ''}</tr></thead>
        <tbody>${sira.map((p, k) => `<tr class="${p === ben ? 'ben' : ''}${k === 0 ? ' ilk' : ''}"><td>${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}</td>${S.gecmis.map(g => `<td>${g[p]}</td>`).join('')}<td><b>${S.puan[p]}</b></td>${MS.some(Boolean) ? `<td>${MS[p]}</td>` : ''}</tr>`).join('')}</tbody></table>
        <button class="o1-b ana" data-a="yine">${mb ? 'Yeni maç' : 'Sonraki el'}</button><button class="o1-b" data-a="menu">Menü</button></div>`;
      if (mod === 'ag' && window.Masa && Masa.karsiYazi) { const kz = Masa.karsiYazi(oda); if (kz) { const p2 = document.createElement('p'); p2.className = 'ms-karsi'; p2.textContent = kz; const b1 = s.querySelector('button'); if (b1) b1.parentNode.insertBefore(p2, b1); } } kok.append(s);
    }
    /* ---------- kayıt / ağ ---------- */
    function yerelKaydet() { if (mod !== 'yz' || !S) return; D.o = S.bitti && O1.macBitti(S) ? '' : JSON.stringify({ S, raf, sev }); D.sev = sev; kaydet(); }
    function gonder() {
      if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
      yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
    }
    function al(d) {
      const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
      const onceki = S; S = d; if (onceki && S.tur !== onceki.tur) { const e = q('.o1-son'); if (e) e.remove(); secili = null; masaGor = 0; }
      if (onceki && S.son && onceki.son && S.son.i !== onceki.son.i) ses('tap');
      ciz(); if (S.bitti) { if (!q('.o1-son')) bitti(); } else surucu();
    }
    function yzBasla(s, eski) {
      temizle(); mod = 'yz'; ben = 0; sev = s; secili = null; mesaj = ''; gorulenI = -1; masaGor = 0;
      if (eski && eski.S) { S = eski.S; raf = Array.isArray(eski.raf) && eski.raf.length === YUVA ? eski.raf : new Array(YUVA).fill(null); rafTur = S.tur; masaGor = S.masa.length; } else { S = O1.yeni((Math.random() * 4) | 0); rafTur = -1; }
      ekran(); ciz(); yerelKaydet(); if (S.bitti) bitti(); else surucu();
    }
    function agBasla(o) {
      temizle(); mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; secili = null; mesaj = ''; rafTur = -1; gorulenI = -1; yerelSur = 0; sonMetin = ''; bekleyen = 0; masaGor = 0; ekran(); sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('.o1-alt'), sonra: q('[data-a=cik]'), koltuk: p => p === ben ? q('#o1-ben') : q(`.o1-oy[data-p="${p}"]`) }) : null;
      odaBirak = oda.dinle(v => { if (!v) { if (S) mesajVer('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben); if (!bekleyen) al(d); if (S && !S.bitti) { ciz(); surucu(); } });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); if (sur && sur.h) sur.h.remove(); sur = null; if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (b && b.closest('.ms')) return;
      if (!b) { if (!S || !q('#o1-m')) return; const y = e.target.closest('.o1-yer'); if (y) { const a = y.dataset.a; if (a === 'deste') return cekDene('d'); if (a === 'yan') return cekDene('a'); if (a === 'atyer' && secili != null) return atDene(raf[secili]); return; }
        const per = e.target.closest('.o1-per'); if (per && secili != null) return isleDene(raf[secili], +per.dataset.per); return; }
      const a = b.dataset.a;
      if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const o = JSON.parse(D.o); yzBasla(o.sev == null ? 1 : o.sev, o); } catch (x) { menu(); } }
      else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
      else if (a === 'cik') { if (mod === 'ag' && S && !S.bitti && !b.dataset.emin) { b.dataset.emin = 1; mesajVer('Çıkarsan masadan kalkmış olursun. Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
      else if (a === 'diz') { if (!S) return; yerlestir(dizTur); dizTur = dizTur === 'seri' ? 'cift' : 'seri'; ses('click'); yerelKaydet(); ciz(); }
      else if (a === 'at') { if (secili != null) atDene(raf[secili]); }
      else if (a === 'ac') acDene();
      else if (a === 'yine') { const y = O1.sonraki(S), e2 = q('.o1-son'); if (e2) e2.remove(); secili = null; masaGor = 0; if (mod === 'ag') { S = null; sonMetin = ''; oda.yeniden(y); } else { S = y; ciz(); yerelKaydet(); surucu(); } } });
    const boyutla = () => { if (S) ciz(); }; addEventListener('resize', boyutla); addEventListener('pointermove', oynat); addEventListener('pointerup', birak); addEventListener('pointercancel', birak);
    const sakla = () => yerelKaydet(); addEventListener('pagehide', sakla);
    api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); removeEventListener('resize', boyutla); removeEventListener('pointermove', oynat); removeEventListener('pointerup', birak); removeEventListener('pointercancel', birak); removeEventListener('pagehide', sakla); root.classList.remove('o1-mount'); });
    menu();
    if (/[?&]o1test/.test(location.search)) window.__o1 = { S: () => S, ben: () => ben, O1, OK, cekDene, atDene, isleDene, acDene, raf: () => raf, mod: () => mod, koy: s => { S = s; ciz(); surucu(); }, botAdim, sec: i => { secili = i; ciz(); } };
  }
});
})();
