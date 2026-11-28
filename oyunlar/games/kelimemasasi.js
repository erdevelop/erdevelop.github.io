/* Kelime Masası — 15×15 tahtada Türkçe kelime oyunu (100 taş: Türkçe dağılım, 2 boş taş). Kelimeler tek sıra/sütunda, bitişik; ilk kelime ortadan geçer.
   H²/H³ harf, K²/K³ kelime katlar; 7 taşın hepsi +50. Torba bitip biri rafını boşaltınca ya da art arda dört pas olunca biter.
   Sözlük: oyunlar/veri/sozluk-tr.txt (dictionary-tr'den türetildi, MIT; bkz. veri/SOZLUK-LISANS.txt). Bilgisayar Appel–Jacobson hamle üretimiyle oynar. */
(function () {
'use strict';
const KM = (() => {
  const ABC = 'abcçdefgğhıijklmnoöprsştuüvyz', N = 15, MERKEZ = 112;
  const DAG = { a: [12, 1], b: [2, 3], c: [2, 4], ç: [2, 4], d: [2, 3], e: [8, 1], f: [1, 7], g: [1, 5], ğ: [1, 8], h: [1, 5], ı: [4, 2], i: [7, 1], j: [1, 10], k: [7, 1], l: [7, 1], m: [4, 2], n: [5, 1], o: [3, 2], ö: [1, 7], p: [1, 5], r: [6, 1], s: [3, 2], ş: [2, 4], t: [5, 1], u: [3, 2], ü: [2, 3], v: [1, 7], y: [2, 3], z: [2, 4], '?': [2, 0] };
  const DEGER = h => (DAG[h] || [0, 0])[1];
  const P = Array(225).fill('');
  const isle = (L, t) => L.forEach(([r, c]) => { for (const [a, b] of [[r, c], [c, r], [14 - r, c], [r, 14 - c], [14 - r, 14 - c], [c, 14 - r], [14 - c, r], [14 - c, 14 - r]]) P[a * 15 + b] = t; });
  isle([[0, 0], [0, 7]], 'K3'); isle([[1, 1], [2, 2], [3, 3], [4, 4], [7, 7]], 'K2'); isle([[1, 5], [5, 5]], 'H3'); isle([[0, 3], [2, 6], [3, 7], [6, 6]], 'H2');
  /* ---- sözlük: ön ek sıkıştırmalı liste -> Set + düğüm dizili trie ---- */
  let SOZ = null, T = null;
  function yukle(metin, botYasak) {
    const W = []; let onceki = ''; for (const s of metin.split('\n')) { if (!s) continue; const k = s.charCodeAt(0) - 48, w = onceki.slice(0, k) + s.slice(1); W.push(w); onceki = w; }
    SOZ = new Set(W); const yas = new Set(botYasak || []);
    /* trie: ilk çocuk / kardeş / harf / son */
    let cap = 1 << 18, fc = new Int32Array(cap).fill(-1), sb = new Int32Array(cap).fill(-1), hr = new Uint8Array(cap), son = new Uint8Array(cap), n = 1;
    const buyut = () => { const c2 = cap * 2, f2 = new Int32Array(c2).fill(-1), s2 = new Int32Array(c2).fill(-1), h2 = new Uint8Array(c2), o2 = new Uint8Array(c2); f2.set(fc); s2.set(sb); h2.set(hr); o2.set(son); fc = f2; sb = s2; hr = h2; son = o2; cap = c2; };
    for (const w of W) { if (yas.has(w) || [...yas].some(y => y.length > 3 && w.startsWith(y))) continue; let d = 0;
      for (const ch of w) { const h = ABC.indexOf(ch) + 1; let c = fc[d], onc = -1; while (c >= 0 && hr[c] !== h) { onc = c; c = sb[c]; }
        if (c < 0) { if (n >= cap) buyut(); c = n++; hr[c] = h; if (onc < 0) fc[d] = c; else sb[onc] = c; } d = c; }
      son[d] = 1; }
    T = { fc, sb, hr, son, n }; return W.length;
  }
  const cocuk = (d, h) => { let c = T.fc[d]; while (c >= 0 && T.hr[c] !== h) c = T.sb[c]; return c; };
  const hazir = () => !!SOZ, var_ = w => !!SOZ && SOZ.has(w);
  /* ---- rastgelelik (tekrar izlenebilsin diye durumda tohum) ---- */
  const rnd = S => { let t = S.rs = (S.rs + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const kar = (S, a) => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd(S) * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  function yeni(o) {
    o = o || {}; const S = { rs: (Math.random() * 2 ** 31) | 0, b: Array(225).fill(''), bos: Array(225).fill(0), raf: [[], []], torba: [], puan: [0, 0], s: o.ilk || 0, pas: 0, son: null, bit: null, n: 0 };
    for (const h in DAG) for (let i = 0; i < DAG[h][0]; i++) S.torba.push(h); kar(S, S.torba); cek(S, 0); cek(S, 1); return S;
  }
  function cek(S, p) { while (S.raf[p].length < 7 && S.torba.length) S.raf[p].push(S.torba.pop()); }
  const sira = S => S.s;
  /* yerleştirilen taşlardan oluşan kelimeleri bul ve puanla; k = [[i, harf, bos]] */
  function kelimeler(S, k) {
    if (!k.length) return null; const yeniM = new Map(k.map(([i, h, b]) => [i, [h, b]]));
    const at = i => yeniM.has(i) ? yeniM.get(i)[0] : S.b[i], bosMu = i => yeniM.has(i) ? yeniM.get(i)[1] : S.bos[i];
    const R = k.map(x => (x[0] / 15) | 0), C = k.map(x => x[0] % 15), ayniS = R.every(r => r === R[0]), ayniK = C.every(c => c === C[0]);
    if (!ayniS && !ayniK) return null; if (k.some(([i]) => S.b[i] || i < 0 || i > 224) || new Set(k.map(x => x[0])).size !== k.length) return null;
    const yon = ayniS && (k.length > 1 || (k.length === 1 && (((k[0][0] % 15) > 0 && S.b[k[0][0] - 1]) || ((k[0][0] % 15) < 14 && S.b[k[0][0] + 1])))) ? 1 : 15;
    const ad = yon === 1 ? (i, d) => { const c = i % 15 + d; return c < 0 || c > 14 ? -1 : i + d; } : (i, d) => { const j = i + d * 15; return j < 0 || j > 224 ? -1 : j; };
    const k1 = k.map(x => x[0]).sort((a, b) => a - b); let bas = k1[0]; while (ad(bas, -1) >= 0 && at(ad(bas, -1))) bas = ad(bas, -1);
    let son = k1[k1.length - 1]; while (ad(son, 1) >= 0 && at(ad(son, 1))) son = ad(son, 1);
    for (let i = bas; ; i = ad(i, 1)) { if (!at(i)) return null; if (i === son) break; }
    const K = [], puanla = (L) => { let w = '', p = 0, m = 1; for (const i of L) { const h = at(i); w += h; let v = bosMu(i) ? 0 : DEGER(h); if (yeniM.has(i)) { const t = P[i]; if (t === 'H2') v *= 2; if (t === 'H3') v *= 3; if (t === 'K2') m *= 2; if (t === 'K3') m *= 3; } p += v; } return { w, p: p * m, L }; };
    const ana = []; for (let i = bas; ; i = ad(i, 1)) { ana.push(i); if (i === son) break; } if (ana.length > 1) K.push(puanla(ana));
    const dik = yon === 1 ? 15 : 1, ad2 = dik === 1 ? (i, d) => { const c = i % 15 + d; return c < 0 || c > 14 ? -1 : i + d; } : (i, d) => { const j = i + d * 15; return j < 0 || j > 224 ? -1 : j; };
    for (const [i] of k) { let a = i; while (ad2(a, -1) >= 0 && at(ad2(a, -1))) a = ad2(a, -1); let b = i; while (ad2(b, 1) >= 0 && at(ad2(b, 1))) b = ad2(b, 1); if (a === b) continue; const L = []; for (let x = a; ; x = ad2(x, 1)) { L.push(x); if (x === b) break; } K.push(puanla(L)); }
    if (!K.length) return null;
    const ilk = !S.b.some(Boolean); if (ilk ? !k.some(([i]) => i === MERKEZ) : !K.some(x => x.L.some(i => S.b[i]))) return null;
    const top = K.reduce((a, x) => a + x.p, 0) + (k.length === 7 ? 50 : 0); return { K, top, bingo: k.length === 7 };
  }
  function oynanabilir(S, p, k) { const R = S.raf[p].slice(); for (const [, h, b] of k) { const j = R.indexOf(b ? '?' : h); if (j < 0) return false; R.splice(j, 1); } return true; }
  function uygula(S, p, h) {
    if (S.bit || S.s !== p || !h) return false;
    if (h.t === 'oy') {
      if (!Array.isArray(h.k) || !h.k.length || !oynanabilir(S, p, h.k) || h.k.some(([, c]) => !ABC.includes(c))) return false;
      const r = kelimeler(S, h.k); if (!r || !SOZ || r.K.some(x => !SOZ.has(x.w))) return false;
      for (const [i, c, b] of h.k) { S.b[i] = c; S.bos[i] = b ? 1 : 0; S.raf[p].splice(S.raf[p].indexOf(b ? '?' : c), 1); }
      S.puan[p] += r.top; S.pas = 0; cek(S, p); S.son = { p, t: 'oy', k: h.k.map(x => x[0]), K: r.K.map(x => x.w), top: r.top, bingo: r.bingo };
      if (!S.raf[p].length && !S.torba.length) { const ek = S.raf[1 - p].reduce((a, x) => a + DEGER(x), 0); S.puan[p] += ek; S.puan[1 - p] -= ek; return bitir(S, 'Taşlar bitti'); }
    } else if (h.t === 'deg') {
      if (S.torba.length < 7 || !Array.isArray(h.h) || !h.h.length) return false; const R = S.raf[p].slice(); for (const x of h.h) { const j = R.indexOf(x); if (j < 0) return false; R.splice(j, 1); }
      S.raf[p] = R; cek(S, p); S.torba.push(...h.h); kar(S, S.torba); S.pas++; S.son = { p, t: 'deg', n: h.h.length };
    } else if (h.t === 'pas') { S.pas++; S.son = { p, t: 'pas' }; } else return false;
    S.n++; if (S.pas >= 4) { for (const q of [0, 1]) S.puan[q] -= S.raf[q].reduce((a, x) => a + DEGER(x), 0); return bitir(S, 'Art arda dört pas'); }
    S.s = 1 - p; return true;
  }
  function bitir(S, neden) { const [a, b] = S.puan; S.bit = { k: a === b ? -1 : a > b ? 0 : 1, neden: `${neden} · ${a} – ${b}` }; return true; }
  const bitti = S => S.bit;
  /* ---- hamle üretimi (Appel–Jacobson) ---- */
  function hamleler(S, raf, sinir) {
    const B = S.b, H = [], ilk = !B.some(Boolean), say = {}; raf.forEach(x => say[x] = (say[x] || 0) + 1);
    for (const yon of [1, 15]) {
      const dik = yon === 1 ? 15 : 1, sat = i => yon === 1 ? (i / 15) | 0 : i % 15, poz = i => yon === 1 ? i % 15 : (i / 15) | 0;
      const capraz = new Map(), kont = i => { if (capraz.has(i)) return capraz.get(i);
        const ust = [], alt = []; for (let x = i - dik; x >= 0 && (dik === 15 || sat(x) === sat(i)) && sinirli(x, i, dik) && B[x]; x -= dik) ust.unshift(B[x]);
        for (let x = i + dik; x < 225 && sinirli(x, i, dik) && B[x]; x += dik) alt.push(B[x]);
        let r = null; if (ust.length || alt.length) { r = new Set(); const u = ust.join(''), a = alt.join(''); for (const h of ABC) if (SOZ.has(u + h + a)) r.add(h); } capraz.set(i, r); return r; };
      for (let s = 0; s < 15; s++) {
        const hucre = j => yon === 1 ? s * 15 + j : j * 15 + s;
        for (let j = 0; j < 15; j++) {
          const i = hucre(j); if (B[i]) continue;
          const komsu = (j > 0 && B[hucre(j - 1)]) || (j < 14 && B[hucre(j + 1)]) || ((dik === 15 ? i - 15 >= 0 : i % 15 > 0) && B[i - dik]) || ((dik === 15 ? i + 15 < 225 : i % 15 < 14) && B[i + dik]);
          if (!(ilk ? i === MERKEZ : komsu)) continue;
          /* sol kısım: çapanın solunda tahtada taş varsa onlardan, yoksa raftan en çok boş-çapa-olmayan kare kadar */
          if (j > 0 && B[hucre(j - 1)]) { let a = j - 1; while (a > 0 && B[hucre(a - 1)]) a--; let d = 0, w = ''; for (let x = a; x < j; x++) { d = cocuk(d, ABC.indexOf(B[hucre(x)]) + 1); if (d < 0) break; w += B[hucre(x)]; } if (d >= 0) sag(d, j, [], w, a); }
          else { let lim = 0; for (let x = j - 1; x >= 0 && !B[hucre(x)] && !capaMi(hucre(x), x); x--) lim++; sol(0, [], j, lim, ''); }
          function capaMi(ii, jj) { return (jj > 0 && B[hucre(jj - 1)]) || (jj < 14 && B[hucre(jj + 1)]) || ((dik === 15 ? ii - 15 >= 0 : ii % 15 > 0) && B[ii - dik]) || ((dik === 15 ? ii + 15 < 225 : ii % 15 < 14) && B[ii + dik]) || (ilk && ii === MERKEZ); }
          function sol(d, k, jj, lim, w) {
            sag(d, jj, k.map((x, t) => [hucre(jj - k.length + t), x[0], x[1]]), w, jj - k.length);
            if (lim <= 0) return;
            for (let c = T.fc[d]; c >= 0; c = T.sb[c]) { const h = ABC[T.hr[c] - 1];
              for (const bos of [0, 1]) { const key = bos ? '?' : h; if (!say[key]) continue; if (bos && say[h]) continue; say[key]--; sol(c, k.concat([[h, bos]]), jj, lim - 1, w + h); say[key]++; } }
          }
          function sag(d, jj, k, w, bas) {
            if (jj > 14 || !B[hucre(jj)]) { if (T.son[d] && k.some(x => x[0] === i || true) && kapsar(k) && w.length > 1) { H.push(k.map(x => x.slice())); if (H.length > sinir) throw H; } }
            if (jj > 14) return; const ii = hucre(jj);
            if (B[ii]) { const c = cocuk(d, ABC.indexOf(B[ii]) + 1); if (c >= 0) sag(c, jj + 1, k, w + B[ii], bas); return; }
            const cr = kont(ii);
            for (let c = T.fc[d]; c >= 0; c = T.sb[c]) { const h = ABC[T.hr[c] - 1]; if (cr && !cr.has(h)) continue;
              for (const bos of [0, 1]) { const key = bos ? '?' : h; if (!say[key]) continue; if (bos && say[h]) continue; say[key]--; sag(c, jj + 1, k.concat([[ii, h, bos]]), w + h, bas); say[key]++; } }
          }
          function kapsar(k) { return k.some(x => x[0] === i); }
        }
      }
    }
    return H;
    function sinirli(x, i, dik) { return dik === 15 || ((x / 15) | 0) === ((i / 15) | 0); }
  }
  function bot(S, p, sev) {
    let H = []; try { H = hamleler(S, S.raf[p], 40000); } catch (e) { if (Array.isArray(e)) H = e; else throw e; }
    const goruldu = new Set(), A = [];
    for (const k of H) { const anahtar = k.map(x => x.join(':')).sort().join('|'); if (goruldu.has(anahtar)) continue; goruldu.add(anahtar); const r = kelimeler(S, k); if (!r || r.K.some(x => !SOZ.has(x.w))) continue; A.push({ k, p: r.top - (sev === 2 ? k.filter(x => x[2]).length * 8 : 0), K: r.K }); }
    if (!A.length) { if (S.torba.length >= 7) { const R = S.raf[p].slice().sort((a, b) => DEGER(b) - DEGER(a)); return { t: 'deg', h: R.slice(0, Math.min(7, Math.max(3, R.filter(x => DEGER(x) >= 4 || x === 'ğ').length))) }; } return { t: 'pas' }; }
    A.sort((a, b) => b.p - a.p);
    if (sev === 2) return { t: 'oy', k: A[0].k };
    if (sev === 1) { const ust = A.slice(0, Math.max(1, Math.ceil(A.length * .08))); return { t: 'oy', k: ust[(Math.random() * Math.min(ust.length, 6)) | 0].k }; }
    const kisa = A.filter(a => a.K.every(x => x.w.length <= 5)), L = kisa.length ? kisa : A, orta = L.slice(Math.floor(L.length * .3), Math.max(Math.floor(L.length * .3) + 1, Math.floor(L.length * .7)));
    return { t: 'oy', k: orta[(Math.random() * orta.length) | 0].k };
  }
  return { ABC, N, MERKEZ, DAG, DEGER, P, yukle, hazir, var_, yeni, sira, kelimeler, uygula, bitti, hamleler, bot };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = KM; return; }
if (!window.registerGame) return;
const TR = s => s.toLocaleUpperCase('tr-TR'), YASAK = ['sik', 'amcık', 'göt', 'orospu', 'piç', 'yarrak', 'taşak', 'kahpe', 'pezevenk', 'ibne', 'gavat', 'kaltak', 'sürtük', 'puşt'];
const CSS = `
.km-sar{overflow:auto;border-radius:10px;-webkit-overflow-scrolling:touch}
.km-t{display:grid;grid-template-columns:repeat(15,1fr);gap:1px;padding:3px;background:#14532d;border-radius:10px;width:100%;box-sizing:border-box;min-width:0}
.km-sar.buyuk .km-t{width:170%}
.km-t i{aspect-ratio:1;border-radius:2px;background:#dcfce7;font-style:normal;display:grid;place-items:center;font-size:clamp(6px,1.7vw,9px);font-weight:900;color:#166534;position:relative;overflow:hidden;line-height:1}
.km-t i.K3{background:#ef4444;color:#fff}.km-t i.K2{background:#fda4af;color:#881337}.km-t i.H3{background:#2563eb;color:#fff}.km-t i.H2{background:#93c5fd;color:#1e3a8a}.km-t i.mz{background:#fda4af}
.km-t i.ts,.km-raf .ts{background:linear-gradient(#fef3c7,#fde68a);color:#422006;font-size:clamp(11px,3.4vw,17px);box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}
.km-sar.buyuk .km-t i.ts{font-size:clamp(16px,5.2vw,24px)}
.km-t i.ts sub,.km-raf .ts sub{position:absolute;right:1px;bottom:0;font-size:.48em;font-weight:800}.km-t i.ts.bs{color:#b45309}
.km-t i.ts.gecici{background:linear-gradient(#bbf7d0,#86efac);cursor:pointer}.km-t i.ts.gecici.hata{background:linear-gradient(#fecaca,#fca5a5)}.km-t i.ts.son{box-shadow:inset 0 0 0 2px #f97316}
.km-t i.hedef{cursor:pointer}.km-t i.hedef:hover{filter:brightness(.92)}
.km-raf{display:flex;gap:5px;justify-content:center;padding:6px;border-radius:12px;background:#713f12;min-height:50px}
.km-raf .ts{width:min(12.5vw,50px);aspect-ratio:1;border-radius:7px;display:grid;place-items:center;font-weight:900;position:relative;cursor:pointer;font-size:clamp(18px,5.6vw,25px)}
.km-raf .ts.sec{transform:translateY(-5px);box-shadow:0 0 0 3px #3b82f6,0 5px 10px rgba(0,0,0,.3)}.km-raf .ts.deg{box-shadow:0 0 0 3px #ef4444}.km-raf .ts.kul{visibility:hidden}
.km-on{text-align:center;font-weight:800;font-size:13.5px;min-height:19px}.km-on b{color:#15803d}.km-on .x{color:#dc2626}
.km-dug{display:flex;gap:6px}.km-dug button{flex:1;padding:10px 2px;border-radius:11px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:13px}.km-dug button.ana{background:#15803d;color:#fff}.km-dug button:disabled{opacity:.4}
.km-harf{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;padding:8px;border-radius:12px;background:var(--bg2)}.km-harf button{padding:8px 0;border-radius:8px;background:var(--card);font-weight:900;font-size:16px}
.km-yuk{text-align:center;padding:40px 10px;font-weight:800;color:var(--ink-soft)}
`;
registerGame({
  id: 'kelimemasasi', title: 'Kelime Masası', category: 'Kelime', tags: 'kelime masası scrabble kelimelik kelime oyunu harf taşı tahta türkçe iki kişilik çevrimiçi online', odak: true, noRestart: true,
  aciklama: 'Türkçe tahta kelime oyunu: harf taşlarınla tahtaya kelime diz, renkli karelerle puanını katla. Bilgisayara karşı ya da arkadaşınla çevrimiçi; 100 bin kelimelik sözlük.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#14532d"/><g>' + Array.from({ length: 49 }, (_, i) => { const r = (i / 7) | 0, c = i % 7, t = (r === 0 && c === 0) || (r === 6 && c === 6) ? '#ef4444' : r === c ? '#fda4af' : (r + c) % 5 === 0 ? '#93c5fd' : '#dcfce7'; return `<rect x="${6 + c * 11.200}" y="${6 + r * 11.200}" width="10.200" height="10.200" rx="1.500" fill="${t}"/>`; }).join('') + '</g><g font-family="Arial,sans-serif" font-weight="900" font-size="8" text-anchor="middle" fill="#422006">' + [...'KALEM'].map((h, i) => `<rect x="${17.200 + i * 11.200}" y="39.600" width="10.200" height="10.200" rx="1.500" fill="#fde68a"/><text x="${22.300 + i * 11.200}" y="47.600">${h}</text>`).join('') + [...'AKİL'].map((h, i) => i === 1 ? '' : `<rect x="${28.400}" y="${17.200 + i * 11.200}" width="10.200" height="10.200" rx="1.500" fill="#fde68a"/><text x="33.500" y="${25.200 + i * 11.200}">${h}</text>`).join('') + '</g></svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
  shareText() { return (this._k && this._k.paylas()) || 'Kelime Masası: Türkçe tahta kelime oyunu.'; },
  render(root, api) {
    const oyun = this;
    root.innerHTML = '<div class="km-yuk">📖 Sözlük yükleniyor…</div>';
    const devam = () => {
      let gecici = [], sec = -1, degMod = false, degSec = new Set(), buyuk = false, harfSor = null, sira_ = null, anahtar = '';
      const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
      function ciz(alan, S, c) {
        const ben = c.ben, raf = S.raf[ben] || [], key = S.m.tur + ':' + S.m.i + ':' + ben;
        if (key !== anahtar) { anahtar = key; gecici = []; sec = -1; degMod = false; degSec = new Set(); harfSor = null; sira_ = raf.map((_, i) => i); }
        if (!sira_ || sira_.length !== raf.length) sira_ = raf.map((_, i) => i);
        const kullan = new Set(gecici.map(g => g.r)), gm = new Map(gecici.map(g => [g.i, g])), son = new Set(S.son && S.son.k ? S.son.k : []);
        const r = gecici.length ? KM.kelimeler(S, gecici.map(g => [g.i, g.h, g.b])) : null, gecersiz = r ? r.K.filter(x => !KM.var_(x.w)).map(x => x.w) : [];
        let h = '';
        for (let i = 0; i < 225; i++) { const t = S.b[i], g = gm.get(i), pr = KM.P[i];
          if (t) h += `<i class="ts${S.bos[i] ? ' bs' : ''}${son.has(i) ? ' son' : ''}">${TR(t)}<sub>${S.bos[i] ? '' : KM.DEGER(t)}</sub></i>`;
          else if (g) h += `<i class="ts gecici${!r || gecersiz.length ? ' hata' : ''}${g.b ? ' bs' : ''}" data-g="${i}">${TR(g.h)}<sub>${g.b ? '' : KM.DEGER(g.h)}</sub></i>`;
          else h += `<i class="${i === KM.MERKEZ ? 'mz' : pr}${c.oynayabilir && sec >= 0 ? ' hedef' : ''}" data-i="${i}">${i === KM.MERKEZ ? '★' : pr ? { K3: 'K³', K2: 'K²', H3: 'H³', H2: 'H²' }[pr] : ''}</i>`; }
        const rafH = sira_.map(j => { const x = raf[j]; return `<span class="ts${sec === j ? ' sec' : ''}${degSec.has(j) ? ' deg' : ''}${kullan.has(j) ? ' kul' : ''}" data-r="${j}">${x === '?' ? '' : TR(x)}<sub>${x === '?' ? '' : KM.DEGER(x)}</sub></span>`; }).join('');
        let on = '';
        if (gecici.length) on = !r ? '<span class="x">Taşlar tek bir sırada, bitişik olmalı ve tahtadaki taşlara değmeli.</span>' : gecersiz.length ? `<span class="x">Sözlükte yok: ${gecersiz.map(TR).join(', ')}</span>` : `${r.K.map(x => TR(x.w)).join(' · ')} <b>+${r.top}</b>${r.bingo ? ' 🎉 +50 bonus' : ''}`;
        else if (degMod) on = 'Değiştirmek istediğin taşlara dokun.';
        else if (S.son && !c.izle) { const sn = S.son; on = sn.t === 'oy' ? `Son: <b>${c.ad(sn.p)}</b> ${sn.K.map(TR).join(' · ')} (+${sn.top})${sn.bingo ? ' 🎉' : ''}` : sn.t === 'deg' ? `${c.ad(sn.p)} ${sn.n} taş değiştirdi.` : `${c.ad(sn.p)} pas geçti.`; }
        const ok = c.oynayabilir;
        alan.innerHTML = `<div class="km-sar${buyuk ? ' buyuk' : ''}"><div class="km-t">${h}</div></div><div class="km-on">${on}</div>
          ${harfSor != null ? `<div class="km-harf">${[...KM.ABC].map(x => `<button data-h="${x}">${TR(x)}</button>`).join('')}</div>` : ''}
          ${c.izle && !ok ? '' : `<div class="km-raf">${rafH}</div>`}
          <div class="km-dug">${degMod ? `<button data-k="degiptal">Vazgeç</button><button class="ana" data-k="degtamam" ${degSec.size ? '' : 'disabled'}>⇄ ${degSec.size} taşı değiştir</button>`
            : `<button data-k="buyut">${buyuk ? '🔍−' : '🔍+'}</button><button data-k="topla" ${gecici.length ? '' : 'disabled'}>↺</button><button data-k="kar">🔀</button><button data-k="deg" ${ok && S.torba.length >= 7 && !gecici.length ? '' : 'disabled'}>⇄</button><button data-k="pas" ${ok && !gecici.length ? '' : 'disabled'}>Pas</button><button class="ana" data-k="oyna" ${ok && r && !gecersiz.length ? '' : 'disabled'}>Oyna${r && !gecersiz.length ? ' +' + r.top : ''}</button>`}</div>`;
        alan.onclick = e => {
          const t = e.target.closest('[data-r],[data-i],[data-g],[data-k],[data-h]'); if (!t) return;
          if (t.dataset.k) { const k = t.dataset.k;
            if (k === 'buyut') buyuk = !buyuk; else if (k === 'topla') { gecici = []; sec = -1; } else if (k === 'kar') { for (let x = sira_.length - 1; x > 0; x--) { const y = (Math.random() * (x + 1)) | 0;[sira_[x], sira_[y]] = [sira_[y], sira_[x]]; } ses('click'); }
            else if (k === 'deg') { degMod = true; gecici = []; sec = -1; } else if (k === 'degiptal') { degMod = false; degSec = new Set(); }
            else if (k === 'degtamam') { const hh = [...degSec].map(j => raf[j]); if (c.hamle({ t: 'deg', h: hh })) return; }
            else if (k === 'pas') { if (!t.dataset.emin) { t.dataset.emin = 1; t.textContent = 'Emin?'; return; } c.hamle({ t: 'pas' }); return; }
            else if (k === 'oyna') { if (c.hamle({ t: 'oy', k: gecici.map(g => [g.i, g.h, g.b]) })) { ses('score'); return; } ses('bad'); }
            return ciz(alan, S, c); }
          if (!ok && !degMod) { if (t.dataset.r != null) { sec = sec === +t.dataset.r ? -1 : +t.dataset.r; ciz(alan, S, c); } return; }
          if (t.dataset.h) { if (harfSor == null) return; gecici.push({ i: harfSor.i, h: t.dataset.h, b: 1, r: harfSor.r }); harfSor = null; sec = -1; ses('tap'); return ciz(alan, S, c); }
          if (t.dataset.r != null) { const j = +t.dataset.r; if (degMod) { if (degSec.has(j)) degSec.delete(j); else degSec.add(j); } else sec = sec === j ? -1 : j; ses('click'); return ciz(alan, S, c); }
          if (t.dataset.g != null) { gecici = gecici.filter(g => g.i !== +t.dataset.g); ses('click'); return ciz(alan, S, c); }
          if (t.dataset.i != null) { const i = +t.dataset.i; if (sec < 0) return;
            if (raf[sec] === '?') { harfSor = { i, r: sec }; return ciz(alan, S, c); } gecici.push({ i, h: raf[sec], b: 0, r: sec }); sec = -1; ses('tap'); return ciz(alan, S, c); }
        };
      }
      const k = Ikili.kur(root, api, { id: 'kelimemasasi', baslik: 'Kelime Masası', emoji: '🔤', renk: '#15803d', zor: true, botBekle: 900, kural: '/oyun-kurallari/kelime-masasi/',
        giris: 'Harf taşlarınla tahtaya Türkçe kelimeler diz; renkli karelerle puanını katla. Torba bitip biri taşlarını bitirince oyun biter.', motor: KM, css: CSS,
        tasRenk: x => x ? '#15803d' : '#fde68a', ek: (S, x) => `<b>${S.puan[x]}</b> puan`,
        sende: S => `Sıra sende · torbada ${S.torba.length} taş. Bir taş seç, sonra tahtada bir kareye dokun.`,
        nasil: `<p>• Herkesin rafında 7 harf taşı var. Sıran gelince taşlarını tahtaya <b>tek bir sıra ya da sütun</b> boyunca, aralarında boşluk bırakmadan diz.</p>
          <p>• İlk kelime ortadaki ★ karesinden geçmeli; sonraki her kelime tahtadaki taşlara değmeli. Oluşan bütün kelimeler (yandakilerle birleşenler de) sözlükte olmalı.</p>
          <p>• Taş puanları köşede yazar. <b>H²/H³</b> taşın puanını, <b>K²/K³</b> bütün kelimenin puanını 2/3 kat yapar (yalnız ilk kullanıldığında). 7 taşın hepsini bir hamlede kullanırsan <b>+50</b>.</p>
          <p>• Boş taş (üstü yazısız) istediğin harf yerine geçer ama puanı 0’dır.</p>
          <p>• Taş değiştirebilir (torbada en az 7 taş varken) ya da pas geçebilirsin. Torba bitip biri rafını boşaltınca ya da art arda dört pas olunca oyun biter; kalan taşların puanı düşülür.</p>
          <p>• Sözlükte yaklaşık 100 bin kök ve türemiş kelime var (çoğul ve çekimli hâller yok).</p>`,
        ciz });
      oyun._k = k; window.__ik = k; if (/[?&]kmtest/.test(location.search)) window.__kmBot = S => KM.bot(S, S.s, 2);
    };
    if (KM.hazir()) return devam();
    fetch('veri/sozluk-tr.txt').then(r => { if (!r.ok) throw 0; return r.text(); }).then(t => { KM.yukle(t, YASAK); if (root.isConnected !== false) devam(); })
      .catch(() => { root.innerHTML = '<div class="km-yuk">Sözlük yüklenemedi. İnternet bağlantını kontrol edip oyunu yeniden aç.</div>'; });
  }
});
})();
