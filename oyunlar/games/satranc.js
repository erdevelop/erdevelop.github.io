/* Satranç — iki kişilik; bilgisayara karşı ya da çevrimiçi (assets/masa.js). Tam kurallar: rok, geçerken alma, terfi, şah, mat, pat,
   50 hamle, üç kez tekrar, yetersiz taş. Bilgisayar: alfa-beta + sükûnet araması, zaman sınırlı derinleştirme.
   Tahta: 64 kare, 0 = a8 … 63 = h1. Taşlar: 'PNBRQK' beyaz, 'pnbrqk' siyah, '' boş. */
(function () {
'use strict';
const ST = (() => {
  const BAS = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const renk = x => !x ? -1 : x === x.toUpperCase() ? 0 : 1, tur = x => x.toLowerCase();
  const AT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]], SAH = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const FIL = [[-1, -1], [-1, 1], [1, -1], [1, 1]], KALE = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const kare = s => 'abcdefgh'[s & 7] + (8 - (s >> 3));
  function fenOku(f) {
    const [d, s, r, e, h, t] = f.split(' '), b = []; for (const ch of d) { if (ch === '/') continue; if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) b.push(''); else b.push(ch); }
    return { b, sira: s === 'w' ? 0 : 1, rok: r === '-' ? '' : r, ep: e === '-' ? -1 : 'abcdefgh'.indexOf(e[0]) + (8 - +e[1]) * 8, yarim: +h || 0, tam: +t || 1 };
  }
  function yeni(o) { o = o || {}; const P = fenOku(BAS); return Object.assign(P, { bitti: null, son: { i: 0 }, tekrar: {}, tur: o.tur || 1, skor: o.skor ? o.skor.slice() : [0, 0], beyaz: o.beyaz || 0, alinan: [[], []] }); }
  function saldiri(b, s, by) {   /* s karesine 'by' rengi saldırıyor mu */
    const r = s >> 3, c = s & 7;
    const pr = by === 0 ? r + 1 : r - 1, pp = by === 0 ? 'P' : 'p';
    if (pr >= 0 && pr < 8) { if (c > 0 && b[pr * 8 + c - 1] === pp) return true; if (c < 7 && b[pr * 8 + c + 1] === pp) return true; }
    const N = by === 0 ? 'N' : 'n', K = by === 0 ? 'K' : 'k', B = by === 0 ? 'B' : 'b', R = by === 0 ? 'R' : 'r', Q = by === 0 ? 'Q' : 'q';
    for (const [dr, dc] of AT) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === N) return true; }
    for (const [dr, dc] of SAH) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === K) return true; }
    for (const [dr, dc] of FIL) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const x = b[rr * 8 + cc]; if (x) { if (x === B || x === Q) return true; break; } rr += dr; cc += dc; } }
    for (const [dr, dc] of KALE) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const x = b[rr * 8 + cc]; if (x) { if (x === R || x === Q) return true; break; } rr += dr; cc += dc; } }
    return false;
  }
  const sahKare = (b, p) => b.indexOf(p === 0 ? 'K' : 'k');
  const sahta = (P, p) => saldiri(P.b, sahKare(P.b, p), 1 - p);
  /* sözde-yasal hamleler; sadeceAlma: sükûnet araması için */
  function uret(P, sadeceAlma) {
    const b = P.b, p = P.sira, L = [];
    const ekle = (f, t, ek) => { const m = { f, t, x: b[f], a: b[t] }; if (ek) Object.assign(m, ek); L.push(m); };
    for (let s = 0; s < 64; s++) {
      const x = b[s]; if (!x || renk(x) !== p) continue; const r = s >> 3, c = s & 7, t = tur(x);
      if (t === 'p') {
        const d = p === 0 ? -1 : 1, son = p === 0 ? 0 : 7, bas = p === 0 ? 6 : 1, ileri = s + d * 8;
        const terfiEkle = (f, tt, ek) => { if ((tt >> 3) === son) for (const q of 'qrbn') ekle(f, tt, Object.assign({ terfi: p === 0 ? q.toUpperCase() : q }, ek)); else ekle(f, tt, ek); };
        if (!sadeceAlma || ((ileri >> 3) === son)) if (ileri >= 0 && ileri < 64 && !b[ileri]) { terfiEkle(s, ileri); if (r === bas && !b[ileri + d * 8] && !sadeceAlma) ekle(s, ileri + d * 8, { cift: 1 }); }
        for (const dc of [-1, 1]) { const cc = c + dc; if (cc < 0 || cc > 7) continue; const tt = (r + d) * 8 + cc; if (tt < 0 || tt > 63) continue;
          if (b[tt] && renk(b[tt]) === 1 - p) terfiEkle(s, tt); else if (tt === P.ep) ekle(s, tt, { ep: 1, a: p === 0 ? 'p' : 'P' }); }
        continue;
      }
      const yon = t === 'n' ? AT : t === 'k' ? SAH : t === 'b' ? FIL : t === 'r' ? KALE : SAH, kay = t === 'b' || t === 'r' || t === 'q';
      for (const [dr, dc] of yon) { let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const tt = rr * 8 + cc, y = b[tt]; if (y && renk(y) === p) break; if (y || !sadeceAlma) ekle(s, tt); if (y || !kay) break; rr += dr; cc += dc; } }
      if (t === 'k' && !sadeceAlma) {
        const R = p === 0 ? 7 : 0, ks = p === 0 ? 'K' : 'k', qs = p === 0 ? 'Q' : 'q', ana = R * 8 + 4;
        if (s === ana && !saldiri(b, ana, 1 - p)) {
          if (P.rok.includes(ks) && !b[ana + 1] && !b[ana + 2] && b[ana + 3] === (p === 0 ? 'R' : 'r') && !saldiri(b, ana + 1, 1 - p) && !saldiri(b, ana + 2, 1 - p)) ekle(s, ana + 2, { rok: 'k' });
          if (P.rok.includes(qs) && !b[ana - 1] && !b[ana - 2] && !b[ana - 3] && b[ana - 4] === (p === 0 ? 'R' : 'r') && !saldiri(b, ana - 1, 1 - p) && !saldiri(b, ana - 2, 1 - p)) ekle(s, ana - 2, { rok: 'q' });
        }
      }
    }
    return L;
  }
  /* yap/geri al (arama için hızlı) */
  function yap(P, m) {
    const b = P.b, p = P.sira, g = { rok: P.rok, ep: P.ep, yarim: P.yarim };
    b[m.t] = m.terfi || m.x; b[m.f] = '';
    if (m.ep) b[m.t + (p === 0 ? 8 : -8)] = '';
    if (m.rok) { const R = p === 0 ? 7 : 0; if (m.rok === 'k') { b[R * 8 + 5] = b[R * 8 + 7]; b[R * 8 + 7] = ''; } else { b[R * 8 + 3] = b[R * 8]; b[R * 8] = ''; } }
    let rk = P.rok; if (rk) { const sil = ch => { rk = rk.replace(ch, ''); };
      if (m.x === 'K') { sil('K'); sil('Q'); } else if (m.x === 'k') { sil('k'); sil('q'); }
      for (const s of [m.f, m.t]) { if (s === 63) sil('K'); if (s === 56) sil('Q'); if (s === 7) sil('k'); if (s === 0) sil('q'); } P.rok = rk; }
    P.ep = m.cift ? (m.f + m.t) >> 1 : -1; P.yarim = tur(m.x) === 'p' || m.a ? 0 : P.yarim + 1; P.sira = 1 - p;
    return g;
  }
  function geriAl(P, m, g) {
    const b = P.b, p = 1 - P.sira; P.sira = p; P.rok = g.rok; P.ep = g.ep; P.yarim = g.yarim;
    b[m.f] = m.x; b[m.t] = m.ep ? '' : (m.a || ''); if (m.ep) b[m.t + (p === 0 ? 8 : -8)] = m.a;
    if (m.rok) { const R = p === 0 ? 7 : 0; if (m.rok === 'k') { b[R * 8 + 7] = b[R * 8 + 5]; b[R * 8 + 5] = ''; } else { b[R * 8] = b[R * 8 + 3]; b[R * 8 + 3] = ''; } }
  }
  function yasal(P) { const L = uret(P), p = P.sira, Y = []; for (const m of L) { const g = yap(P, m); if (!sahta(P, p)) Y.push(m); geriAl(P, m, g); } return Y; }
  const anahtar = P => P.b.map(x => x || '.').join('') + P.sira + P.rok + P.ep;
  function yetersiz(b) { const t = b.filter(x => x && tur(x) !== 'k'); if (!t.length) return true; if (t.length === 1 && 'bn'.includes(tur(t[0]))) return true; return false; }
  /* oyun hamlesi: durumu günceller, bitişi denetler */
  function oyna(S, m) {
    const p = S.sira, L = yasal(S), mm = L.find(x => x.f === m.f && x.t === m.t && (!x.terfi || x.terfi.toLowerCase() === (m.terfi || 'q').toLowerCase())); if (S.bitti || !mm) return false;
    yap(S, mm); if (mm.a) S.alinan[p].push(mm.a); if (p === 1) S.tam++;
    const k = anahtar(S); S.tekrar[k] = (S.tekrar[k] || 0) + 1;
    const Y = yasal(S), sah = sahta(S, S.sira);
    S.son = { i: S.son.i + 1, p, f: mm.f, t: mm.t, terfi: mm.terfi || '', al: !!mm.a, rok: mm.rok || '', ep: !!mm.ep, sah, san: san(mm, L, sah, !Y.length) };
    if (!Y.length) S.bitti = sah ? { k: p, neden: 'mat' } : { k: -1, neden: 'pat' };
    else if (S.yarim >= 100) S.bitti = { k: -1, neden: '50 hamle' };
    else if (S.tekrar[k] >= 3) S.bitti = { k: -1, neden: 'üç kez tekrar' };
    else if (yetersiz(S.b)) S.bitti = { k: -1, neden: 'yetersiz taş' };
    if (S.bitti && S.bitti.k >= 0) S.skor[S.bitti.k]++;
    return true;
  }
  function san(m, L, sah, mat) {   /* kısa cebirsel gösterim (Türkçe harfler: Ş V K F A) */
    if (m.rok) return (m.rok === 'k' ? 'O-O' : 'O-O-O') + (mat ? '#' : sah ? '+' : '');
    const t = tur(m.x), H = { n: 'A', b: 'F', r: 'K', q: 'V', k: 'Ş' };
    let s = '';
    if (t === 'p') { if (m.a) s = 'abcdefgh'[m.f & 7] + 'x'; s += kare(m.t); if (m.terfi) s += '=' + H[tur(m.terfi)]; }
    else { s = H[t]; const ayni = L.filter(x => x.x === m.x && x.t === m.t && x.f !== m.f); if (ayni.length) s += ayni.some(x => (x.f & 7) === (m.f & 7)) ? (8 - (m.f >> 3)) : 'abcdefgh'[m.f & 7]; if (m.a) s += 'x'; s += kare(m.t); }
    return s + (mat ? '#' : sah ? '+' : '');
  }
  /* ---------- bilgisayar ---------- */
  const DEG = { p: 100, n: 315, b: 330, r: 500, q: 920, k: 0 };
  const PST = {   /* beyaz bakışıyla, 0 = a8 */
    p: [0, 0, 0, 0, 0, 0, 0, 0, 60, 60, 60, 60, 60, 60, 60, 60, 14, 16, 22, 30, 30, 22, 16, 14, 6, 8, 12, 24, 24, 12, 8, 6, 2, 3, 8, 20, 20, 6, 3, 2, 4, 2, -2, 4, 4, -4, 2, 4, 4, 8, 8, -16, -16, 8, 8, 4, 0, 0, 0, 0, 0, 0, 0, 0],
    n: [-50, -36, -28, -26, -26, -28, -36, -50, -36, -18, 0, 2, 2, 0, -18, -36, -28, 2, 12, 16, 16, 12, 2, -28, -26, 6, 16, 22, 22, 16, 6, -26, -26, 2, 16, 20, 20, 16, 2, -26, -28, 6, 12, 14, 14, 12, 6, -28, -36, -18, 2, 6, 6, 2, -18, -36, -50, -34, -28, -26, -26, -28, -34, -50],
    b: [-18, -10, -10, -10, -10, -10, -10, -18, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 6, 10, 10, 6, 0, -10, -10, 6, 6, 10, 10, 6, 6, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 6, 0, 0, 0, 0, 6, -10, -18, -10, -12, -10, -10, -12, -10, -18],
    r: [0, 0, 0, 0, 0, 0, 0, 0, 6, 12, 12, 12, 12, 12, 12, 6, -4, 0, 0, 0, 0, 0, 0, -4, -4, 0, 0, 0, 0, 0, 0, -4, -4, 0, 0, 0, 0, 0, 0, -4, -4, 0, 0, 0, 0, 0, 0, -4, -4, 0, 0, 0, 0, 0, 0, -4, 0, 0, 2, 6, 6, 4, 0, 0],
    q: [-18, -10, -10, -4, -4, -10, -10, -18, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 4, 4, 4, 4, 0, -10, -4, 0, 4, 4, 4, 4, 0, -4, 0, 0, 4, 4, 4, 4, 0, -4, -10, 4, 4, 4, 4, 4, 0, -10, -10, 0, 4, 0, 0, 0, 0, -10, -18, -10, -10, -4, -4, -10, -10, -18],
    k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 16, 16, 0, -6, -6, 0, 16, 16, 18, 28, 12, 0, 0, 8, 30, 18],
    ks: [-50, -36, -28, -20, -20, -28, -36, -50, -28, -16, -6, 0, 0, -6, -16, -28, -28, -6, 18, 26, 26, 18, -6, -28, -28, -6, 26, 36, 36, 26, -6, -28, -28, -6, 26, 36, 36, 26, -6, -28, -28, -6, 18, 26, 26, 18, -6, -28, -28, -26, 0, 0, 0, 0, -26, -28, -50, -28, -28, -28, -28, -28, -28, -50]
  };
  function degerle(P) {
    const b = P.b; let s = 0, tas = 0;
    for (let i = 0; i < 64; i++) { const x = b[i]; if (x && 'qrbn'.includes(tur(x))) tas += DEG[tur(x)]; }
    const son = tas < 2600;
    for (let i = 0; i < 64; i++) { const x = b[i]; if (!x) continue; const t = tur(x), w = renk(x) === 0, j = w ? i : (7 - (i >> 3)) * 8 + (i & 7), v = DEG[t] + (t === 'k' && son ? PST.ks : PST[t])[j]; s += w ? v : -v; }
    return P.sira === 0 ? s : -s;
  }
  const MVV = m => (m.a ? DEG[tur(m.a)] * 10 - DEG[tur(m.x)] / 10 + 1000 : 0) + (m.terfi ? 900 : 0);
  function sukun(P, a, bb, ctx) {
    if (++ctx.n % 4096 === 0 && Date.now() > ctx.bitis) throw 'zaman';
    const durus = degerle(P); if (durus >= bb) return durus; if (durus > a) a = durus;
    const L = uret(P, true).sort((x, y) => MVV(y) - MVV(x)), p = P.sira;
    for (const m of L) { const g = yap(P, m); if (sahta(P, p)) { geriAl(P, m, g); continue; } const v = -sukun(P, -bb, -a, ctx); geriAl(P, m, g); if (v >= bb) return v; if (v > a) a = v; }
    return a;
  }
  function ara(P, d, a, bb, ctx, ply) {
    if (++ctx.n % 4096 === 0 && Date.now() > ctx.bitis) throw 'zaman';
    if (ply && P.yarim >= 100) return 0;
    const p = P.sira, sah = sahta(P, p); if (sah) d++;
    if (d <= 0) return sukun(P, a, bb, ctx);
    const L = uret(P), kat = ctx.katil[ply] || [];
    L.sort((x, y) => (MVV(y) + (kat.some(k => k.f === y.f && k.t === y.t) ? 800 : 0)) - (MVV(x) + (kat.some(k => k.f === x.f && k.t === x.t) ? 800 : 0)));
    let en = -1e9, yasalVar = false;
    for (const m of L) {
      const g = yap(P, m); if (sahta(P, p)) { geriAl(P, m, g); continue; } yasalVar = true;
      const v = -ara(P, d - 1, -bb, -a, ctx, ply + 1); geriAl(P, m, g);
      if (v > en) en = v; if (v > a) a = v;
      if (a >= bb) { if (!m.a) { ctx.katil[ply] = [m].concat(kat).slice(0, 2); } break; }
    }
    if (!yasalVar) return sah ? -100000 + ply : 0;
    return en;
  }
  function botHamle(S, sev, sure) {
    const P = { b: S.b.slice(), sira: S.sira, rok: S.rok, ep: S.ep, yarim: S.yarim }, L = yasal(P); if (!L.length) return null;
    if (sev === 0 && Math.random() < .25) return L[(Math.random() * L.length) | 0];
    const ctx = { n: 0, bitis: Date.now() + (sure || (sev === 0 ? 150 : 900)), katil: [] }, maxD = sev === 0 ? 2 : 30;
    let sira = L.slice().sort((x, y) => MVV(y) - MVV(x) + Math.random() - .5), enIyi = sira[0];
    try {
      for (let d = 1; d <= maxD; d++) {
        let en = -1e9, sec = null; const puan = [];
        for (const m of sira) { const g = yap(P, m); const v = sev === 0 ? -ara(P, d - 1, -1e9, 1e9, ctx, 1) + Math.random() * 80 : -ara(P, d - 1, -1e9, -en, ctx, 1); geriAl(P, m, g); puan.push([m, v]); if (v > en) { en = v; sec = m; } }
        enIyi = sec; sira = puan.sort((x, y) => y[1] - x[1]).map(x => x[0]); if (en > 90000) break;
      }
    } catch (e) { if (e !== 'zaman') throw e; }
    return enIyi;
  }
  function perft(P, d) { if (!d) return 1; let n = 0; for (const m of uret(P)) { const p = P.sira, g = yap(P, m); if (!sahta(P, p)) n += perft(P, d - 1); geriAl(P, m, g); } return n; }
  return { yeni, fenOku, renk, tur, kare, yasal, oyna, sahta, botHamle, perft, saldiri, degerle };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = ST; return; }
window.ST = ST;
})();
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame || !window.ST) return;
const ST = window.ST, bekle = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* özgün taş çizimleri (45×45) */
const CIZ = {
  p: '<circle cx="22.5" cy="13.5" r="5.200"/><path d="M17 24c0-3 2.500-4.800 5.500-4.800S28 21 28 24c0 2-1 3.200-2 4 1.500 2 3 5.500 3.500 8.500h-14c.500-3 2-6.500 3.500-8.500-1-.800-2-2-2-4z"/><path d="M11.500 38h22v3h-22z"/>',
  r: '<path d="M11.500 38h22v3h-22zM14 35h17l-1.500-3.200h-14zM16.200 31.800l1-13.300h10.600l1 13.300z"/><path d="M13 12h4v3h3.200v-3h4.600v3H28v-3h4v6.500H13z"/>',
  b: '<path d="M11.500 38h22v3h-22z"/><path d="M15.500 35h14l-2-3.500h-10z"/><path d="M17.500 31.500c-3.200-3.200-4-7.200-1.500-11 2-3.200 4.500-5.600 6.500-7.200 2 1.600 4.500 4 6.500 7.200 2.500 3.800 1.700 7.800-1.500 11z"/><circle cx="22.500" cy="9.300" r="2.400"/><path class="d" d="M22.500 17.500v8M19.200 21.500h6.600" fill="none"/>',
  n: '<path d="M11.500 38h22v3h-22z"/><path d="M14.500 35.500c0-5.500 1.800-8.500 5-12-2.800.200-5 1-7 2.700-1.700-1.200-2.200-2.700-1.200-4.700 1.600-3.200 4.600-6.200 6.700-8.700l-.400-3.800 3.200 1.700 1.500-3.200 1.800 3.700c5.600 1.500 9.700 6.700 9.700 14.300v10z"/><circle class="d" cx="19.500" cy="15.200" r="1.300"/><path class="d" d="M29 17c1.500 3 2 7 1.500 12" fill="none"/>',
  q: '<path d="M11.500 38h22v3h-22zM14 35h17l1.500-3.500h-20z"/><path d="M12.500 31.500L10 16.500l6.500 7L17 13.500l4 8.500 1.500-10 1.500 10 4-8.500.500 10 6.500-7-2.500 15z"/><circle cx="10" cy="15.500" r="2.200"/><circle cx="17" cy="12.300" r="2.200"/><circle cx="22.500" cy="10.800" r="2.200"/><circle cx="28" cy="12.300" r="2.200"/><circle cx="35" cy="15.500" r="2.200"/>',
  k: '<path d="M11.500 38h22v3h-22zM14 35h17l1.500-3.500h-20z"/><path d="M12.500 31.500c-2-4-3-8-.500-11 3-3.500 8-2 10.500 2.500 2.500-4.500 7.500-6 10.500-2.500 2.500 3 1.500 7-.500 11z"/><path d="M22.500 23c-1.200-3.200-1.200-6.200 0-9.200 1.200 3 1.200 6 0 9.200z"/><path d="M22.500 4.500v8M18.800 8h7.400" fill="none" stroke-width="2.400"/>'
};
const tasSvg = x => { const t = x.toLowerCase(), b = x === x.toUpperCase(); return `<svg viewBox="0 0 45 45" class="${b ? 'bz' : 'sy'}">${CIZ[t]}</svg>`; };
function kapak() {
  let s = '<rect width="90" height="90" fill="#6b4a2f"/>';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s += `<rect x="${9 + c * 18}" y="${9 + r * 18}" width="18" height="18" fill="${(r + c) % 2 ? '#b98a5e' : '#ecd9b6'}"/>`;
  const g = (x, y, t, b) => `<g transform="translate(${x} ${y}) scale(.62)" fill="${b ? '#faf8f2' : '#2b2724'}" stroke="${b ? '#2b2724' : '#000'}" stroke-width="1.500" stroke-linejoin="round">${CIZ[t].replace(/class="d"/g, `stroke="${b ? '#2b2724' : '#eee'}"`)}</g>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${s}${g(14, 30, 'k', 0)}${g(44, 14, 'n', 1)}${g(32, 46, 'q', 1)}</svg>`;
}
const CSS = `
.st-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.st{width:min(540px,100%);margin:0 auto;display:flex;flex-direction:column;gap:7px;-webkit-user-select:none;user-select:none;position:relative}
.st h3{margin:0;font-size:19px;font-weight:800}.st p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.st-b{padding:11px 10px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center}.st-b.ana{background:var(--accent);color:#fff}.st-b:disabled{opacity:.4}
.st-b.sec{box-shadow:inset 0 0 0 2px var(--accent);background:var(--card)}
.st-sat{display:flex;gap:8px}.st-sat>*{flex:1;min-width:0}
.st-menu{display:flex;flex-direction:column;gap:10px;width:min(440px,100%);margin:0 auto}
.st-menu small{font-weight:800;color:var(--ink-soft);font-size:12px}
svg.bz{fill:#faf8f2;stroke:#2b2724;stroke-width:1.500;stroke-linejoin:round}svg.sy{fill:#2b2724;stroke:#000;stroke-width:1.500;stroke-linejoin:round}
svg.bz .d{stroke:#2b2724}svg.sy .d{stroke:#e8e4dc;fill:#e8e4dc}svg.sy circle.d{stroke:none}svg.bz circle.d{fill:#2b2724;stroke:none}
.st-kisi{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px;padding:5px 10px;border-radius:11px;background:var(--bg2);min-height:36px}
.st-kisi .ad{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}.st-kisi .al{flex:1;display:flex;align-items:center;flex-wrap:wrap;min-width:0}
.st-kisi .al svg{width:17px;height:17px;margin-right:-5px}.st-kisi .al b{margin-left:8px;font-size:12.5px;color:var(--ink-soft)}
.st-kisi small{font-weight:800;color:var(--ink-soft);white-space:nowrap}.st-kisi.sira{box-shadow:inset 0 0 0 2px var(--accent)}.st-kisi.yok .ad{opacity:.5}
.st-tahta{position:relative;width:100%;aspect-ratio:1;border-radius:10px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.25);align-self:center;touch-action:manipulation}
.st-izgara{position:absolute;inset:0;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr)}
.st-k{position:relative;background:#ecd9b6;cursor:pointer}.st-k.k{background:#b98a5e}
.st-k.son{background:#f0dd7a}.st-k.son.k{background:#d6bb4e}.st-k.sec{background:#9fd0a0}.st-k.sec.k{background:#7bb37d}.st-k.ipucu{background:#9cc5f5}.st-k.ipucu.k{background:#6fa3e0}
.st-k.sah{background:radial-gradient(circle,#ff5a5a 0,#e23b3b 45%,transparent 75%),#ecd9b6}.st-k.sah.k{background:radial-gradient(circle,#ff5a5a 0,#e23b3b 45%,transparent 75%),#b98a5e}
.st-k.hedef::after{content:'';position:absolute;left:36%;top:36%;width:28%;height:28%;border-radius:50%;background:rgba(20,85,30,.45)}
.st-k.hedef.al::after{left:4%;top:4%;width:92%;height:92%;background:none;border:5px solid rgba(20,85,30,.45);box-sizing:border-box}
.st-k .kr{position:absolute;font-size:10px;font-weight:800;line-height:1;opacity:.75;pointer-events:none}.st-k .kr.s{left:3px;bottom:2px}.st-k .kr.r{right:3px;top:2px}
.st-k .kr{color:#b98a5e}.st-k.k .kr{color:#ecd9b6}
.st-t{position:absolute;width:12.5%;height:12.5%;pointer-events:none;z-index:2;transition:left .2s ease,top .2s ease}.st-t svg{width:100%;height:100%;display:block;filter:drop-shadow(0 2px 1px rgba(0,0,0,.3))}
.st-t.git{opacity:0;transition:opacity .2s}
.st-alt{display:flex;gap:7px;align-items:center;min-height:46px}.st-alt .st-b{flex:none;padding:11px 13px}
.st-bilgi{flex:1;font-size:13px;font-weight:700;color:var(--ink-soft);line-height:1.3}.st-bilgi b{color:var(--ink)}
.st-terfi{position:absolute;inset:0;z-index:6;display:grid;place-items:center;background:rgba(0,0,0,.35);border-radius:10px}
.st-terfi>div{display:flex;gap:6px;padding:10px;background:var(--card);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35)}.st-terfi button{width:58px;height:58px;border-radius:10px;background:var(--bg2)}.st-terfi svg{width:46px;height:46px}
.st-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 82%,transparent);border-radius:14px;animation:stS .3s .3s both}@keyframes stS{from{opacity:0}}
.st-son>div{display:flex;flex-direction:column;gap:9px;text-align:center;padding:18px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(300px,88%)}.st-son h3{font-size:23px}
`;
const DEGER = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
registerGame({
  id: 'satranc', title: 'Satranç', category: 'Masa', tags: 'satranç satranc chess şah mat vezir at fil kale piyon iki kişilik çevrimiçi online', odak: true, noRestart: true,
  aciklama: 'Satranç: bilgisayara karşı (beyaz ya da siyah, iki seviye) ya da çevrimiçi. Yasal hamleler gösterilir; ipucu ve geri alma var.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 21h10M8 18h8l-1-6H9zM9 12c-1-2-1-4 1-6h4c2 2 2 4 1 6M12 2v4M10 4h4"/></svg>',
  shareText() { return this._paylas || 'Satranç: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('st-css')) { const s = document.createElement('style'); s.id = 'st-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('st-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, kaz: 0, kay: 0, ber: 0, ag: 0, o: '', sev: 1, renk: 0 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'st' }); root.append(kok);
    let sohbetK = null;
    let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, secili = -1, mesaj = '', mesajT = 0, surT = 0, canli = true, sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, gecmis = [], kilit = false, ipucu = null, yazSira = Promise.resolve();
    const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
    const koltuklar = () => oda ? oda.koltuklar() : null;
    const benRenk = () => mod === 'yz' ? ben : (ben === S.beyaz ? 0 : 1);       /* yz: ben = renk; ag: ben = koltuk */
    const koltukRenk = r => mod === 'yz' ? r : (r === 0 ? S.beyaz : 1 - S.beyaz);
    const kopuk = r => { const K = koltuklar(); if (!K) return false; const x = K[koltukRenk(r)]; return !!(x && !x.var); };
    const ad = r => { if (mod === 'yz') return r === benRenk() ? 'Sen' : sev ? 'Bilgisayar' : 'Bilgisayar (kolay)'; const K = koltuklar(), x = K && K[koltukRenk(r)]; return x ? x.n : 'Rakip'; };
    const benimSira = () => S && !S.bitti && S.sira === benRenk() && !kilit;
    const gor = k => benRenk() === 0 ? k : 63 - k;
    function mesajVer(m, sure) { mesaj = m; clearTimeout(mesajT); mesajT = setTimeout(() => { mesaj = ''; ust(); }, sure || 2400); ust(); }
    function menu() {
      temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { } const var_ = eski && eski.S && !eski.S.bitti;
      kok.innerHTML = `<div class="st-menu"><h3>♞ Satranç</h3><p>${D.kaz + D.kay + D.ber ? `Bilgisayara karşı <b>${D.kaz}</b> galibiyet, ${D.kay} yenilgi, ${D.ber} beraberlik${D.ag ? ' · çevrimiçi ' + D.ag + ' galibiyet' : ''}` : 'Rakibin şahını mat et.'}</p>
        ${var_ ? '<button class="st-b ana" data-a="devam">▶ Yarım kalan oyuna devam</button>' : ''}
        <small>Rengin</small><div class="st-sat">${['Beyaz', 'Siyah', 'Rastgele'].map((x, i) => `<button class="st-b${D.renk === i ? ' sec' : ''}" data-renk="${i}">${x}</button>`).join('')}</div>
        <div class="st-sat"><button class="st-b ${var_ ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="st-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
        <button class="st-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="st-b" data-a="nasil">❓ Taşlar nasıl gider</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/satranc/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      const t = (x, s) => `<p style="display:flex;gap:8px;align-items:center"><span style="width:30px;flex:none">${tasSvg(x)}</span><span>${s}</span></p>`;
      kok.innerHTML = `<div class="st-menu"><h3>Taşlar nasıl gider</h3>
        ${t('K', '<b>Şah</b>: her yöne bir kare. Saldırı altındaki kareye giremez. Şahın kaçacak yeri kalmazsa <b>mat</b>, oyun biter.')}
        ${t('Q', '<b>Vezir</b>: düz ve çapraz, istediği kadar.')}${t('R', '<b>Kale</b>: düz, istediği kadar.')}${t('B', '<b>Fil</b>: çapraz, istediği kadar.')}
        ${t('N', '<b>At</b>: L biçiminde gider (iki kare bir yöne, bir kare yana); taşların üstünden atlar.')}
        ${t('P', '<b>Piyon</b>: bir kare ileri (ilk hamlede iki), çapraz alır. Son sıraya varınca istediğin taşa dönüşür. Geçerken alma da yapılabilir.')}
        <p>• <b>Rok</b>: şah ve kale hiç oynamadıysa, aradaki kareler boşsa ve şah tehdit altından geçmiyorsa şah iki kare kaleye doğru gider. Şahı kaleye doğru iki kare sürükle.</p>
        <p>• Taşına dokun: gidebileceği kareler noktayla, alabileceği taşlar halkayla gösterilir. Hamle kalmadığında şah tehdit altında değilse <b>pat</b> (berabere).</p>
        <a class="st-b" href="/oyun-kurallari/satranc/" style="text-decoration:none;display:block">📖 Ayrıntılı kurallar ve ipuçları</a>
        <button class="st-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="st-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="st-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'satranc', koltuk: 2, enAz: 2, botlu: false, baslik: 'Satranç', onGeri: menu, baslat: o => o.baslat(ST.yeni({ beyaz: Math.random() < .5 ? 0 : 1 })), onOda: o => { lobi = null; agBasla(o); } });
    }
    function ekran() {
      kok.innerHTML = `<div class="st-kisi" id="st-k1"><span class="ad"></span><span class="al"></span><small></small></div><div class="st-tahta"><div class="st-izgara" id="st-i"></div></div>
        <div class="st-kisi" id="st-k0"><span class="ad"></span><span class="al"></span><small></small></div>
        <div class="st-alt"><button class="st-b" data-a="cik">‹</button><div class="st-bilgi" id="st-b"></div><button class="st-b" data-a="ipucu" hidden>💡</button><button class="st-b" data-a="geri" hidden>↶</button><button class="st-b" data-a="teslim">⚑</button></div>`;
    }
    function izgara() {
      let h = ''; for (let g = 0; g < 64; g++) { const k = gor(g), r = g >> 3, c = g & 7; h += `<div class="st-k${(r + c) % 2 ? ' k' : ''}" data-g="${g}">${c === 0 ? `<span class="kr r" style="left:3px;right:auto">${8 - (k >> 3)}</span>` : ''}${r === 7 ? `<span class="kr s" style="left:auto;right:3px">${'abcdefgh'[k & 7]}</span>` : ''}</div>`; }
      q('#st-i').innerHTML = h;
    }
    function tahtaBoy() { const t = q('.st-tahta'); if (!t) return; const ust = t.getBoundingClientRect().top, kalan = innerHeight - ust - 36 - 46 - 22, W = kok.clientWidth; t.style.width = Math.max(240, Math.min(W, kalan)) + 'px'; }
    function ciz() {
      if (!S || !q('#st-i')) return; tahtaBoy(); if (!q('#st-i .st-k')) izgara(); if (q('#st-i').dataset.yon !== String(benRenk())) { izgara(); q('#st-i').dataset.yon = benRenk(); }
      const L = benimSira() && secili >= 0 ? ST.yasal(S).filter(m => m.f === secili) : [], hd = new Map(L.map(m => [m.t, m])), sah = !S.bitti && ST.sahta(S, S.sira) ? S.b.indexOf(S.sira === 0 ? 'K' : 'k') : -1;
      q('#st-i').querySelectorAll('.st-k').forEach(e => { const k = gor(+e.dataset.g); e.classList.toggle('son', !!S.son && (S.son.f === k || S.son.t === k)); e.classList.toggle('sec', k === secili);
        e.classList.toggle('hedef', hd.has(k)); e.classList.toggle('al', hd.has(k) && (!!S.b[k] || !!hd.get(k).ep)); e.classList.toggle('sah', k === sah); e.classList.toggle('ipucu', !!ipucu && (ipucu.f === k || ipucu.t === k)); });
      const iz = q('#st-i'); iz.querySelectorAll('.st-t').forEach(x => x.remove());
      for (let k = 0; k < 64; k++) { const x = S.b[k]; if (!x) continue; const g = gor(k), t = document.createElement('div'); t.className = 'st-t'; t.dataset.k = k; t.style.left = (g & 7) * 12.5 + '%'; t.style.top = (g >> 3) * 12.5 + '%'; t.innerHTML = tasSvg(x); iz.appendChild(t); }
      ust();
    }
    function ust() {
      if (!S || !q('#st-k0')) return; const br = benRenk();
      const mal = r => S.alinan[r].reduce((a, x) => a + DEGER[x.toLowerCase()], 0);
      for (const r of [0, 1]) { const e = q(r === br ? '#st-k0' : '#st-k1'), fark = mal(r) - mal(1 - r); e.querySelector('.ad').textContent = (r === 0 ? '○ ' : '● ') + ad(r) + (kopuk(r) ? ' (ayrıldı)' : '');
        e.querySelector('.al').innerHTML = S.alinan[r].slice().sort((a, b) => DEGER[b.toLowerCase()] - DEGER[a.toLowerCase()]).map(tasSvg).join('') + (fark > 0 ? `<b>+${fark}</b>` : '');
        e.querySelector('small').textContent = mod === 'ag' ? S.skor[r] + ' galibiyet' : ''; e.classList.toggle('sira', !S.bitti && S.sira === r); e.classList.toggle('yok', kopuk(r)); }
      const son = S.son && S.son.san ? `${S.son.p === br ? 'Sen' : esc(ad(S.son.p))}: <b>${esc(S.son.san)}</b> · ` : '';
      q('#st-b').innerHTML = mesaj || (S.bitti ? '' : benimSira() ? son + (ST.sahta(S, br) ? '<b>Şah!</b> Şahını kurtar.' : 'Sıra sende.') : son + `<b>${esc(ad(S.sira))}</b> düşünüyor…`);
      q('[data-a=geri]').hidden = !(mod === 'yz' && gecmis.length && !S.bitti); q('[data-a=ipucu]').hidden = !(mod === 'yz' && !S.bitti); q('[data-a=teslim]').hidden = !!S.bitti;
    }
    async function canlandir(m) {
      const iz = q('#st-i'); if (!iz) return; const t = iz.querySelector(`.st-t[data-k="${m.f}"]`); if (!t) return; const a = iz.querySelector(`.st-t[data-k="${m.ep ? m.t + (S.sira === 0 ? 8 : -8) : m.t}"]`);
      const g = gor(m.t); t.style.zIndex = 3; t.style.left = (g & 7) * 12.5 + '%'; t.style.top = (g >> 3) * 12.5 + '%';
      if (m.rok) { const R = S.sira === 0 ? 56 : 0, kf = m.rok === 'k' ? R + 7 : R, kt = m.rok === 'k' ? R + 5 : R + 3, kt2 = iz.querySelector(`.st-t[data-k="${kf}"]`); if (kt2) { const g2 = gor(kt); kt2.style.left = (g2 & 7) * 12.5 + '%'; kt2.style.top = (g2 >> 3) * 12.5 + '%'; } }
      await bekle(110); if (a && a !== t) a.classList.add('git'); await bekle(110);
    }
    async function oyna(m) {
      kilit = true; secili = -1; ipucu = null; const Y = kopya(S); if (!ST.oyna(Y, m)) { kilit = false; return; }
      if (mod === 'yz' && m.oyuncu) gecmis.push(JSON.stringify(S));
      await canlandir(m); if (!canli) return; kilit = false; S = Y; ses(S.bitti ? 'win' : S.son.sah ? 'bad' : S.son.al ? 'score' : 'tap');
      if (mod === 'ag') gonder(); else yerelKaydet(); ciz(); if (S.bitti) bitti(); else surucu();
    }
    function terfiSor(L) {
      const r = S.sira, e = E('div', { class: 'st-terfi' }); e.innerHTML = `<div>${['q', 'r', 'b', 'n'].map(x => `<button data-t="${x}">${tasSvg(r === 0 ? x.toUpperCase() : x)}</button>`).join('')}</div>`;
      q('.st-tahta').appendChild(e); e.addEventListener('click', ev => { ev.stopPropagation(); const b = ev.target.closest('button'); e.remove(); if (!b) { secili = -1; return ciz(); } const m = L.find(x => x.terfi.toLowerCase() === b.dataset.t); oyna(Object.assign({}, m, { oyuncu: 1 })); });
    }
    function dokun(e) {
      const h = e.target.closest('.st-k'); if (!h || !S || !benimSira()) return; const k = gor(+h.dataset.g), br = benRenk();
      if (secili >= 0) { const L = ST.yasal(S).filter(m => m.f === secili && m.t === k); if (L.length) { if (L.length > 1 && L[0].terfi) return terfiSor(L); return oyna(Object.assign({}, L[0], { oyuncu: 1 })); } }
      if (S.b[k] && ST.renk(S.b[k]) === br) { if (!ST.yasal(S).some(m => m.f === k)) { secili = -1; ciz(); return mesajVer(ST.sahta(S, br) ? 'Şahın tehdit altında: önce onu kurtar.' : 'Bu taşın yasal hamlesi yok.'); } secili = secili === k ? -1 : k; ses('click'); return ciz(); }
      secili = -1; ciz();
    }
    function surucu() {
      clearTimeout(surT); if (!S || S.bitti || !canli) return; const r = S.sira;
      if (mod === 'yz') { if (r === benRenk()) return; surT = setTimeout(() => { if (!S || S.bitti || S.sira !== r || kilit || !canli) return; const m = ST.botHamle(S, sev); if (m) oyna(m); }, 250); return; }
      const K = koltuklar(), x = K[koltukRenk(r)], bagli = K.map((y, i) => y && y.var ? i : -1).filter(i => i >= 0 && i !== koltukRenk(r)); if (!bagli.length || bagli[0] !== ben || !x || x.var) return;
      const i0 = S.son.i; surT = setTimeout(() => { if (!S || S.bitti || S.sira !== r || S.son.i !== i0 || kilit || !canli) return; mesajVer(`${esc(ad(r))} ayrıldı, yerine bilgisayar oynuyor.`, 4000); const m = ST.botHamle(S, 1, 500); if (m) oyna(m); }, 15000);
    }
    function geriAl() { if (!gecmis.length || kilit || mod !== 'yz') return; clearTimeout(surT); S = JSON.parse(gecmis.pop()); secili = -1; ipucu = null; ses('click'); yerelKaydet(); ciz(); surucu(); }
    function ipucuVer() { if (!benimSira() || mod !== 'yz') return; mesajVer('Düşünüyorum…', 1500); setTimeout(() => { const m = ST.botHamle(S, 1, 700); if (!m) return; ipucu = { f: m.f, t: m.t }; secili = -1; ciz(); mesajVer(`İpucu: <b>${ST.kare(m.f)} → ${ST.kare(m.t)}</b>`, 3500); }, 30); }
    function teslim() {
      if (!S || S.bitti) return; const b = q('[data-a=teslim]'); if (!b.dataset.emin) { b.dataset.emin = 1; mesajVer('Pes etmek için ⚑’e yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; }
      const Y = kopya(S); Y.bitti = { k: 1 - benRenk(), neden: 'pes' }; Y.skor[1 - benRenk()]++; Y.son = Object.assign({}, Y.son, { i: Y.son.i + 1 }); S = Y; if (mod === 'ag') gonder(); ciz(); bitti();
    }
    const NEDEN = { mat: 'Şah mat.', pat: 'Pat: hamle yok ama şah tehdit altında değil.', '50 hamle': '50 hamledir taş alınmadı, piyon oynanmadı.', 'üç kez tekrar': 'Aynı konum üç kez tekrarlandı.', 'yetersiz taş': 'Mat etmeye yetecek taş kalmadı.', pes: 'Pes edildi.' };
    function bitti() {
      clearTimeout(surT); const b = S.bitti, br = benRenk(), kaz = b.k === br, anahtar = mod + ':' + S.tur + ':' + (oda ? oda.kod : '') + ':' + S.son.i;
      if (sayilan !== anahtar) { sayilan = anahtar;
        if (mod === 'yz') { if (b.k < 0) D.ber++; else if (kaz) { D.kaz++; api.submitScore(D.kaz); } else D.kay++; D.o = ''; kaydet(); } else { if (kaz) { D.ag++; kaydet(); } if (oda) oda.bitir(); }
        ses(kaz ? 'win' : b.k < 0 ? 'click' : 'lose'); if (kaz) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } }
      if (mod === 'ag' && oda && window.Masa && Masa.sonuc) Masa.sonuc(oda, b.k < 0 ? .5 : kaz ? 1 : 0, S.tur + ':' + S.son.i);
      oyun._paylas = 'Satranç: ' + (kaz ? (b.neden === 'mat' ? 'mat ettim!' : 'kazandım!') : b.k < 0 ? 'berabere.' : 'bu sefer olmadı.') + '\nerdevelop.com/oyunlar/#o/satranc';
      const e = q('.st-son'); if (e) e.remove(); const s = E('div', { class: 'st-son' });
      s.innerHTML = `<div><h3>${b.k < 0 ? '🤝 Berabere' : kaz ? (b.neden === 'mat' ? '🏆 Mat ettin!' : '🎉 Kazandın!') : b.neden === 'mat' ? 'Mat oldun' : 'Kaybettin'}</h3><p>${NEDEN[b.neden] || ''}${mod === 'ag' ? ` · ${esc(ad(br))} ${S.skor[br]} – ${S.skor[1 - br]} ${esc(ad(1 - br))}` : ''}</p>
        <button class="st-b ana" data-a="yine">${mod === 'ag' ? 'Rövanş (renkler değişir)' : 'Yeni oyun'}</button><button class="st-b" data-a="incele">Tahtaya bak</button><button class="st-b" data-a="menu">Menü</button></div>`;
      if (mod === 'ag' && window.Masa && Masa.karsiYazi) { const kz = Masa.karsiYazi(oda); if (kz) { const p2 = document.createElement('p'); p2.className = 'ms-karsi'; p2.textContent = kz; const b1 = s.querySelector('button'); if (b1) b1.parentNode.insertBefore(p2, b1); } } kok.append(s);
    }
    function yerelKaydet() { if (mod !== 'yz' || !S) return; D.o = S.bitti ? '' : JSON.stringify({ S, sev, ben }); D.sev = sev; kaydet(); }
    function gonder() {
      if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
      yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
    }
    async function al(d) {
      const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
      const onceki = S; if (onceki && d.tur !== onceki.tur) { const e = q('.st-son'); if (e) e.remove(); secili = -1; S = d; ciz(); return surucu(); }
      if (onceki && d.son && d.son.i === onceki.son.i + 1 && d.son.f != null && d.son.p !== benRenk() && !kilit && !d.son.pes) { kilit = true; await canlandir({ f: d.son.f, t: d.son.t, rok: d.son.rok, ep: d.son.ep }); kilit = false; }
      S = d; ciz(); if (S.bitti) { if (!q('.st-son')) bitti(); } else surucu();
    }
    function yzBasla(s, eski) {
      temizle(); mod = 'yz'; sev = s; secili = -1; ipucu = null; mesaj = ''; gecmis = []; kilit = false;
      if (eski && eski.S) { S = eski.S; ben = eski.ben || 0; } else { S = ST.yeni(); ben = D.renk === 2 ? (Math.random() < .5 ? 0 : 1) : D.renk; }
      ekran(); ciz(); yerelKaydet(); surucu();
    }
    function agBasla(o) {
      temizle(); mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; secili = -1; mesaj = ''; yerelSur = 0; sonMetin = ''; bekleyen = 0; kilit = false; ekran();
      sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('.st-alt'), sonra: q('[data-a=cik]'), koltuk: p => q(p === ben ? '#st-k0' : '#st-k1') }) : null;
      odaBirak = oda.dinle(v => { if (!v) { if (S) mesajVer('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben); if (!bekleyen && !kilit) al(d); else if (S) ust(); if (S && !S.bitti) surucu(); });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (b && (b.closest('.ms') || b.closest('.st-terfi'))) return;
      if (!b) { if (e.target.closest('#st-i')) dokun(e); return; }
      if (b.dataset.renk != null) { D.renk = +b.dataset.renk; kaydet(); kok.querySelectorAll('[data-renk]').forEach(x => x.classList.toggle('sec', x === b)); return; }
      const a = b.dataset.a;
      if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const o = JSON.parse(D.o); yzBasla(o.sev == null ? 1 : o.sev, o); } catch (x) { menu(); } }
      else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
      else if (a === 'cik') { if (mod === 'ag' && S && !S.bitti && !b.dataset.emin) { b.dataset.emin = 1; mesajVer('Çıkarsan oyunu bırakmış olursun. Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
      else if (a === 'geri') geriAl(); else if (a === 'ipucu') ipucuVer(); else if (a === 'teslim') teslim();
      else if (a === 'incele') { const e2 = q('.st-son'); if (e2) e2.remove(); mesajVer('Oyun bitti. Yeni oyun için ‹ ile menüye dön.', 6000); }
      else if (a === 'yine') { const e2 = q('.st-son'); if (e2) e2.remove(); if (mod === 'ag') { const y = ST.yeni({ beyaz: 1 - S.beyaz, tur: S.tur + 1, skor: [S.skor[1], S.skor[0]] }); S = null; sonMetin = ''; oda.yeniden(y); } else { D.renk = D.renk === 2 ? 2 : 1 - ben; yzBasla(sev, null); } } });
    const boyutla = () => { if (S) ciz(); }; addEventListener('resize', boyutla);
    const sakla = () => yerelKaydet(); addEventListener('pagehide', sakla);
    api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); removeEventListener('resize', boyutla); removeEventListener('pagehide', sakla); root.classList.remove('st-mount'); });
    menu();
    if (/[?&]sttest/.test(location.search)) window.__st = { S: () => S, ben: () => ben, benRenk, ST, oyna, kilit: () => kilit, mod: () => mod };
  }
});
})();
