/* Sudoku — günün bulmacası, 60 bölümlük yolculuk, beş zorlukta serbest oyun.
   Üretici her bulmacayı tek çözümlü ve mantıkla çözülebilir kurar; ipuçları aynı çözücüden gelir.
   Kayıt: api.saveState (hesaba göre yerel ya da bulut) + hızlı yerel kopya. */
/* ---------- Sudoku çekirdeği: üretici, mantık çözücü, ipucu ---------- */
const SDK = (() => {
  const R = i => (i / 9) | 0, C = i => i % 9, B = i => ((R(i) / 3) | 0) * 3 + ((C(i) / 3) | 0);
  const UNITS = [], PEERS = [];
  for (let r = 0; r < 9; r++) UNITS.push([...Array(9)].map((_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) UNITS.push([...Array(9)].map((_, r) => r * 9 + c));
  for (let b = 0; b < 9; b++) UNITS.push([...Array(9)].map((_, k) => (((b / 3) | 0) * 3 + ((k / 3) | 0)) * 9 + (b % 3) * 3 + (k % 3)));
  for (let i = 0; i < 81; i++) { const s = new Set([...UNITS[R(i)], ...UNITS[9 + C(i)], ...UNITS[18 + B(i)]]); s.delete(i); PEERS.push([...s]); }
  const CNT = new Uint8Array(512); for (let m = 1; m < 512; m++) CNT[m] = CNT[m >> 1] + (m & 1);
  const bit = d => 1 << (d - 1), tek = m => 32 - Math.clz32(m);            /* tek bitli maskenin rakamı */
  const rakamlar = m => { const o = []; for (let d = 1; d <= 9; d++) if (m & bit(d)) o.push(d); return o; };
  const rng = s => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const karistir = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  function adaylar(g) {
    const rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9), c = new Uint16Array(81);
    for (let i = 0; i < 81; i++) if (g[i]) { const b = bit(g[i]); rm[R(i)] |= b; cm[C(i)] |= b; bm[B(i)] |= b; }
    for (let i = 0; i < 81; i++) c[i] = g[i] ? 0 : 511 & ~(rm[R(i)] | cm[C(i)] | bm[B(i)]);
    return c;
  }
  /* çözüm sayısı (limit kadar); bitmaske + en az adaylı hücre */
  function say(g0, limit, cozum) {
    const g = Array.from(g0), rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9); let n = 0;
    for (let i = 0; i < 81; i++) if (g[i]) { const b = bit(g[i]); if ((rm[R(i)] | cm[C(i)] | bm[B(i)]) & b) return 0; rm[R(i)] |= b; cm[C(i)] |= b; bm[B(i)] |= b; }
    (function git() {
      let en = -1, em = 0, ec = 10;
      for (let i = 0; i < 81; i++) if (!g[i]) { const m = 511 & ~(rm[R(i)] | cm[C(i)] | bm[B(i)]), k = CNT[m]; if (k < ec) { ec = k; en = i; em = m; if (k <= 1) break; } }
      if (en < 0) { n++; if (cozum && n === 1) for (let i = 0; i < 81; i++) cozum[i] = g[i]; return; }
      if (!ec) return;
      const r = R(en), c = C(en), b = B(en);
      for (let m = em; m && n < limit; m &= m - 1) { const lb = m & -m; g[en] = tek(lb); rm[r] |= lb; cm[c] |= lb; bm[b] |= lb; git(); rm[r] &= ~lb; cm[c] &= ~lb; bm[b] &= ~lb; }
      g[en] = 0;
    })();
    return n;
  }
  function tamUret(rnd) {
    const g = new Array(81).fill(0), rm = new Uint16Array(9), cm = new Uint16Array(9), bm = new Uint16Array(9);
    (function git(i) {
      if (i === 81) return true; const r = R(i), c = C(i), b = B(i), m = 511 & ~(rm[r] | cm[c] | bm[b]);
      for (const d of karistir(rakamlar(m), rnd)) { const lb = bit(d); g[i] = d; rm[r] |= lb; cm[c] |= lb; bm[b] |= lb; if (git(i + 1)) return true; rm[r] &= ~lb; cm[c] &= ~lb; bm[b] &= ~lb; }
      g[i] = 0; return false;
    })(0);
    return g;
  }
  /* ---- mantık teknikleri: her biri bir adım döndürür ya da null ---- */
  const UAD = u => u < 9 ? (u + 1) + '. satır' : u < 18 ? (u - 8) + '. sütun' : (u - 17) + '. kutu';
  function tekli(g, c) {
    for (let u = 26; u >= 0; u--) for (let d = 1; d <= 9; d++) {      /* gizli tekli: önce kutular */
      const b = bit(d); let yer = -1, n = 0; for (const i of UNITS[u]) if (c[i] & b) { n++; yer = i; if (n > 1) break; }
      if (n === 1) return { t: 'gizli', lv: 1, i: yer, d, u };
    }
    for (let i = 0; i < 81; i++) if (!g[i] && CNT[c[i]] === 1) return { t: 'acik', lv: 1, i, d: tek(c[i]) };
    return null;
  }
  function kilitli(c) {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      for (let k = 0; k < 9; k++) {                                     /* işaret eden: kutu → satır/sütun */
        const h = UNITS[18 + k].filter(i => c[i] & b); if (h.length < 2) continue;
        for (const [f, off] of [[R, 0], [C, 9]]) if (h.every(i => f(i) === f(h[0]))) {
          const u = off + f(h[0]), sil = UNITS[u].filter(i => B(i) !== k && (c[i] & b));
          if (sil.length) return { t: 'isaret', lv: 2, d, u1: 18 + k, u2: u, kaynak: h, sil: sil.map(i => [i, d]) };
        }
      }
      for (let u = 0; u < 18; u++) {                                    /* sahiplenen: satır/sütun → kutu */
        const h = UNITS[u].filter(i => c[i] & b); if (h.length < 2 || !h.every(i => B(i) === B(h[0]))) continue;
        const k = B(h[0]), sil = UNITS[18 + k].filter(i => !UNITS[u].includes(i) && (c[i] & b));
        if (sil.length) return { t: 'sahip', lv: 2, d, u1: u, u2: 18 + k, kaynak: h, sil: sil.map(i => [i, d]) };
      }
    }
    return null;
  }
  function acikAlt(c, n) {
    for (let u = 0; u < 27; u++) {
      const h = UNITS[u].filter(i => c[i] && CNT[c[i]] <= n); if (h.length < n) continue;
      const dene = (bas, sec, m) => {
        if (sec.length === n) {
          if (CNT[m] !== n) return null; const sil = [];
          for (const i of UNITS[u]) if (!sec.includes(i) && (c[i] & m)) for (const d of rakamlar(c[i] & m)) sil.push([i, d]);
          return sil.length ? { t: n === 2 ? 'cift' : 'uclu', lv: n === 2 ? 3 : 4, u, kaynak: sec.slice(), ds: rakamlar(m), sil } : null;
        }
        for (let j = bas; j < h.length; j++) { const m2 = m | c[h[j]]; if (CNT[m2] > n) continue; sec.push(h[j]); const r = dene(j + 1, sec, m2); sec.pop(); if (r) return r; }
        return null;
      };
      const r = dene(0, [], 0); if (r) return r;
    }
    return null;
  }
  function gizliCift(c) {
    for (let u = 0; u < 27; u++) {
      const yer = []; for (let d = 1; d <= 9; d++) { let m = 0; UNITS[u].forEach((i, k) => { if (c[i] & bit(d)) m |= 1 << k; }); yer[d] = m; }
      for (let a = 1; a < 9; a++) if (CNT[yer[a]] === 2) for (let b = a + 1; b <= 9; b++) if (yer[b] === yer[a]) {
        const h = UNITS[u].filter((i, k) => yer[a] & (1 << k)), tut = bit(a) | bit(b), sil = [];
        for (const i of h) for (const d of rakamlar(c[i] & ~tut)) sil.push([i, d]);
        if (sil.length) return { t: 'gcift', lv: 3, u, kaynak: h, ds: [a, b], sil };
      }
    }
    return null;
  }
  function xKanat(c) {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      for (const [o1, o2] of [[0, 9], [9, 0]]) {
        const sat = []; for (let r = 0; r < 9; r++) { const p = []; UNITS[o1 + r].forEach((i, k) => { if (c[i] & b) p.push(k); }); sat.push(p); }
        for (let r1 = 0; r1 < 8; r1++) if (sat[r1].length === 2) for (let r2 = r1 + 1; r2 < 9; r2++) if (sat[r2].length === 2 && sat[r2][0] === sat[r1][0] && sat[r2][1] === sat[r1][1]) {
          const sil = []; for (const k of sat[r1]) UNITS[o2 + k].forEach((i, r) => { if (r !== r1 && r !== r2 && (c[i] & b)) sil.push([i, d]); });
          if (sil.length) return { t: 'xkanat', lv: 4, d, u1: o1 + r1, u2: o1 + r2, kaynak: sat[r1].flatMap(k => [UNITS[o1 + r1][k], UNITS[o1 + r2][k]]), sil };
        }
      }
    }
    return null;
  }
  const eleme = (c, maxLv) => (maxLv >= 2 && kilitli(c)) || (maxLv >= 3 && (acikAlt(c, 2) || gizliCift(c))) || (maxLv >= 4 && (acikAlt(c, 3) || xKanat(c))) || null;
  const koy = (g, c, i, d) => { g[i] = d; c[i] = 0; const b = ~bit(d); for (const j of PEERS[i]) c[j] &= b; };
  /* mantıkla çöz: { cozuldu, seviye (kullanılan en zor teknik), g } */
  function mantik(g0, maxLv) {
    const g = Array.from(g0), c = adaylar(g); let seviye = 0, bos = g.filter(x => !x).length, zor = 0;
    for (; ;) {
      if (!bos) return { cozuldu: true, seviye, zor, g };
      const s = tekli(g, c); if (s) { koy(g, c, s.i, s.d); bos--; if (!seviye) seviye = 1; continue; }
      const e = eleme(c, maxLv); if (!e) return { cozuldu: false, seviye, zor, g };
      for (const [i, d] of e.sil) c[i] &= ~bit(d); if (e.lv > seviye) seviye = e.lv; zor += e.lv;
    }
  }
  /* sıradaki mantıklı hamle: { i, d, t, u, once:[eleme adımları] } ya da null */
  function ipucu(g0) {
    const g = Array.from(g0), c = adaylar(g), adimlar = [];
    for (let tur = 0; tur < 60; tur++) {
      const s = tekli(g, c);
      if (s) {
        const ilgili = adimlar.filter(e => e.sil.some(([i, d]) => s.t === 'acik' ? i === s.i : (d === s.d && UNITS[s.u].includes(i))));
        return Object.assign(s, { once: ilgili.slice(-2) });
      }
      const e = eleme(c, 4); if (!e) return null;
      for (const [i, d] of e.sil) c[i] &= ~bit(d); adimlar.push(e);
    }
    return null;
  }
  const ZOR = { 1: { ad: 'Kolay', max: 1, min: 1, hedef: 42 }, 2: { ad: 'Orta', max: 1, min: 1, hedef: 31 }, 3: { ad: 'Zor', max: 2, min: 2, hedef: 27 }, 4: { ad: 'Uzman', max: 4, min: 3, hedef: 25 }, 5: { ad: 'Şeytan', max: 9, min: 5, hedef: 24 } };
  function dene(z, rnd) {
    const Z = ZOR[z], cozum = tamUret(rnd), p = cozum.slice(); let ipu = 81;
    for (const i of karistir([...Array(41).keys()], rnd)) {
      if (ipu <= Z.hedef) break; const j = 80 - i, a = p[i], b = p[j]; if (!a) continue;
      p[i] = 0; p[j] = 0;
      const ok = Z.max < 5 ? mantik(p, Z.max).cozuldu : say(p, 2) === 1;
      if (ok) ipu -= i === j ? 1 : 2; else { p[i] = a; p[j] = b; }
    }
    const m = mantik(p, 4); return { p, cozum, ipu, seviye: m.cozuldu ? m.seviye : 5, zor: m.zor };
  }
  /* zorluk z (1-5), tohum → { p, cozum, ipu, seviye }; aynı tohum hep aynı bulmacayı verir */
  function uret(z, tohum) {
    const Z = ZOR[z], rnd = rng(tohum * 7919 + z * 104729), N = z >= 3 ? 150 : 6; let en = null;
    for (let k = 0; k < N; k++) {
      const b = dene(z, rnd), uyar = b.seviye >= Z.min && (z !== 2 || b.ipu <= 35);
      if (!en || (b.seviye >= Z.min) > (en.seviye >= Z.min) || ((b.seviye >= Z.min) === (en.seviye >= Z.min) && (b.seviye > en.seviye || (b.seviye === en.seviye && b.ipu < en.ipu)))) en = b;
      if (uyar) return b;
    }
    return en;
  }
  return { R, C, B, UNITS, PEERS, CNT, bit, rakamlar, adaylar, say, mantik, ipucu, uret, ZOR, UAD, rng };
})();

/* ---------- görünüm ---------- */
const SDK_CSS = `
.sdk-mount{padding:12px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.sdk{--t-hucre:var(--card);--t-cizgi:var(--line);--t-kalin:var(--ink);--t-ver:var(--ink);--t-kul:var(--accent-ink);--t-sel:var(--accent);--t-selink:#fff;--t-es:var(--accent-soft);
  --t-ay:color-mix(in srgb,var(--accent) 34%,var(--card));--t-not:var(--ink-soft);--t-hat:var(--bad);--t-hatbg:color-mix(in srgb,var(--bad) 16%,var(--card));--t-ip:#f6c85f;
  width:100%;max-width:820px;margin:0 auto;font-variant-numeric:tabular-nums;-webkit-user-select:none;user-select:none}
.sdk[data-tema=kagit]{--t-hucre:#FFFDF5;--t-cizgi:#DCCFB0;--t-kalin:#5B4A32;--t-ver:#33281A;--t-kul:#1F5FA8;--t-sel:#EDB73C;--t-selink:#33281A;--t-es:#F6EBCB;--t-ay:#F3D98E;--t-not:#8A7A5C;--t-hat:#C2412D;--t-hatbg:#F9D9CF}
.sdk[data-tema=gece]{--t-hucre:#131C3A;--t-cizgi:#27335E;--t-kalin:#8798DA;--t-ver:#E8EDFF;--t-kul:#5EE0C8;--t-sel:#4563FF;--t-selink:#fff;--t-es:#1C2852;--t-ay:#2E4088;--t-not:#8B98C6;--t-hat:#FF7A7A;--t-hatbg:#4A2338}
.sdk[data-tema=orman]{--t-hucre:#F7FBF3;--t-cizgi:#C6D9BD;--t-kalin:#2F5D3A;--t-ver:#1F3D27;--t-kul:#B4531F;--t-sel:#3E8E57;--t-selink:#fff;--t-es:#DFEDD7;--t-ay:#B7DCC0;--t-not:#6B8A70;--t-hat:#C2412D;--t-hatbg:#F6D6CC}
.sdk button{font-family:inherit}
.sdk h3{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft)}
/* lobi */
.sl{display:flex;flex-direction:column;gap:16px;padding:6px 4px 10px}
.sl-bas{display:flex;align-items:center;gap:14px}
.sl-logo{width:64px;height:64px;flex:0 0 auto;border-radius:16px;box-shadow:var(--shadow)}
.sl-bas h2{font-size:26px;line-height:1.1}.sl-bas p{margin:2px 0 0;color:var(--ink-soft);font-size:14px;font-weight:600}
.sl-seri{margin-left:auto;text-align:center;font-weight:800;font-size:20px;line-height:1.1;white-space:nowrap}.sl-seri small{display:block;font-size:11px;color:var(--ink-soft);letter-spacing:.04em;text-transform:uppercase}
.sl-devam{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:12px;border-radius:16px;background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 60%,#a06cff));color:#fff;box-shadow:var(--shadow)}
.sl-devam b{display:block;font-size:17px;font-weight:800}.sl-devam small{font-size:13px;opacity:.9;font-weight:700}
.sl-devam .git{margin-left:auto;font-size:26px;font-weight:800;padding-right:6px}
.sdk-mini{width:62px;height:62px;flex:0 0 auto;border-radius:9px;background:#fff}.sdk-mini text{font:800 7px Nunito,sans-serif;text-anchor:middle;fill:#2b2f38}.sdk-mini text.k{fill:#3b5bdb}
.sl-kutu{border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--bg)}
.sl-kutu>.ust{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:10px}.sl-kutu>.ust span{font-size:13px;font-weight:700;color:var(--ink-soft)}
.sl-uc{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.sl-bes{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.sl-z{position:relative;padding:12px 6px 10px;border-radius:14px;background:var(--card);border:1px solid var(--line);box-shadow:var(--shadow);text-align:center;transition:transform .12s}
.sl-z:active{transform:scale(.96)}.sl-z b{display:block;font-size:15.5px;font-weight:800}.sl-z small{display:block;font-size:12px;color:var(--ink-soft);font-weight:700;min-height:17px}
.sl-z .nokta{display:flex;gap:3px;justify-content:center;margin-bottom:6px}.sl-z .nokta i{width:7px;height:7px;border-radius:50%;background:var(--line)}.sl-z .nokta i.d{background:var(--accent)}
.sl-z.ok{border-color:color-mix(in srgb,var(--good) 55%,var(--line));background:color-mix(in srgb,var(--good) 9%,var(--card))}.sl-z.ok small{color:var(--good)}
.sl-hafta{display:flex;gap:6px;justify-content:space-between;margin-top:12px}
.sl-hafta span{flex:1;text-align:center;font-size:11px;font-weight:800;color:var(--ink-soft)}
.sl-hafta i{display:grid;place-items:center;height:28px;margin:0 auto 3px;max-width:34px;border-radius:9px;background:var(--card);border:1px solid var(--line);font-style:normal;font-size:13px;color:#fff}
.sl-hafta span.ok i{background:var(--good);border-color:transparent}.sl-hafta span.bu i{outline:2px solid var(--accent);outline-offset:1px}
.sl-yol{display:flex;align-items:center;gap:12px}
.sl-yol .cub{flex:1}.sl-yol .cub div{height:9px;border-radius:6px;background:var(--line);overflow:hidden}.sl-yol .cub div i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,var(--accent),#a06cff)}
.sl-yol .cub small{display:block;margin-top:5px;font-size:12.5px;font-weight:700;color:var(--ink-soft)}
.sdk-btn{padding:11px 16px;border-radius:12px;font-weight:800;font-size:14.5px;background:var(--accent);color:#fff;box-shadow:var(--shadow);transition:transform .12s;white-space:nowrap}
.sdk-btn:active{transform:scale(.96)}.sdk-btn.hafif{background:var(--accent-soft);color:var(--accent-ink);box-shadow:none}.sdk-btn.blok{display:block;width:100%;margin-top:8px}
.sl-alt{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.sdk-bekle{min-height:50vh;display:grid;place-items:center;text-align:center;font-weight:800;color:var(--ink-soft)}
.sdk-bekle i{display:block;width:44px;height:44px;margin:0 auto 12px;border-radius:50%;border:4px solid var(--line);border-top-color:var(--accent);animation:sdkDon .8s linear infinite}
@keyframes sdkDon{to{transform:rotate(360deg)}}
/* oyun */
.so{display:flex;flex-direction:column;gap:10px}
.so-ust{display:flex;align-items:center;gap:8px}
.so-ik{width:38px;height:38px;flex:0 0 auto;border-radius:11px;display:grid;place-items:center;background:var(--bg);border:1px solid var(--line);color:var(--ink-soft)}
.so-ik svg{width:19px;height:19px}
.so-ad{flex:1;min-width:0;line-height:1.15}.so-ad b{display:block;font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.so-ad small{display:block;font-size:12px;color:var(--ink-soft);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.so-hata,.so-sure{font-weight:800;font-size:15px;padding:7px 10px;border-radius:10px;background:var(--bg);border:1px solid var(--line);white-space:nowrap}
.so-hata.var{color:var(--bad)}.so-hata[hidden],.so-sure[hidden]{display:none}
.so-govde{display:flex;flex-direction:column;gap:10px;align-items:center}
.so-tk{position:relative;width:min(100%,max(250px,calc(100dvh - 292px)));flex:0 0 auto}
.so-tahta{--sz:38px;display:grid;grid-template-columns:repeat(9,1fr);aspect-ratio:1;border:2.5px solid var(--t-kalin);border-radius:10px;overflow:hidden;background:var(--t-kalin);touch-action:manipulation;transition:filter .2s}
.so-tahta.gizli{filter:blur(9px) saturate(.6);pointer-events:none}
.sc{cursor:pointer;position:relative;display:grid;place-items:center;background:var(--t-hucre);color:var(--t-kul);font-weight:700;font-size:calc(var(--sz)*.6);line-height:1;
  box-shadow:inset -1px 0 0 var(--t-cizgi),inset 0 -1px 0 var(--t-cizgi);cursor:pointer;-webkit-tap-highlight-color:transparent}
.sc.br{box-shadow:inset -2px 0 0 var(--t-kalin),inset 0 -1px 0 var(--t-cizgi)}.sc.bb{box-shadow:inset -1px 0 0 var(--t-cizgi),inset 0 -2px 0 var(--t-kalin)}.sc.br.bb{box-shadow:inset -2px 0 0 var(--t-kalin),inset 0 -2px 0 var(--t-kalin)}
.sc.ver{color:var(--t-ver);font-weight:800}
.sc.es{background:var(--t-es)}.sc.ay{background:var(--t-ay)}
.sc.sel{background:var(--t-sel);color:var(--t-selink)}
.sc.hat{color:var(--t-hat);background:var(--t-hatbg)}.sc.hat.sel{background:var(--t-hat);color:#fff}
.sc.cak{color:var(--t-hat)}
.sc.ipb{background:color-mix(in srgb,var(--t-ip) 26%,var(--t-hucre))}.sc.ipk{background:color-mix(in srgb,var(--t-ip) 55%,var(--t-hucre))}
.sc.ipu{background:var(--t-ip);color:#3a2a00;animation:sdkNabiz 1.1s ease-in-out infinite}
.sc b{font-weight:inherit}.sc b.pop{animation:sdkPop .22s cubic-bezier(.2,1.6,.4,1)}
.sc.salla{animation:sdkSalla .32s}
.sc.dalga{animation:sdkDalga .55s ease-out both;animation-delay:var(--g,0s)}
.sn{position:absolute;inset:2px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);font-size:calc(var(--sz)*.25);font-weight:700;color:var(--t-not)}
.sn i{display:grid;place-items:center;font-style:normal}.sn i.v{color:var(--t-kul);font-weight:900;background:var(--t-ay);border-radius:3px}
.sc.sel .sn{color:var(--t-selink)}.sc.sel .sn i.v{color:var(--t-sel);background:var(--t-selink)}
@keyframes sdkPop{from{transform:scale(.3);opacity:0}}
@keyframes sdkSalla{20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
@keyframes sdkDalga{0%{transform:scale(1)}40%{transform:scale(1.16);background:var(--t-ay);z-index:2}100%{transform:scale(1)}}
@keyframes sdkNabiz{50%{filter:brightness(1.15)}}
.so-durak{position:absolute;inset:0;display:grid;place-items:center;border-radius:10px;cursor:pointer}
.so-durak div{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 24px;text-align:center;font-weight:800;box-shadow:var(--shadow)}
.so-durak div b{display:block;font-size:20px}.so-durak div small{color:var(--ink-soft)}.so-durak[hidden]{display:none}
.so-yan{position:relative;width:100%;max-width:520px;display:flex;flex-direction:column;gap:10px}
.so-arac{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.so-arac button{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 2px 5px;border-radius:12px;color:var(--ink-soft);font-size:11.5px;font-weight:800;transition:transform .1s,background .15s}
.so-arac button:active{transform:scale(.92)}.so-arac svg{width:24px;height:24px}
.so-arac button.acik{background:var(--accent);color:#fff}
.so-arac button em{position:absolute;top:1px;right:calc(50% - 24px);font-style:normal;font-size:9.5px;font-weight:900;padding:1px 5px;border-radius:8px;background:var(--ink-soft);color:var(--card)}.so-arac button.acik em{background:#fff;color:var(--accent-ink)}
.so-pad{display:grid;grid-template-columns:repeat(9,1fr);gap:5px}
.so-pad button{padding:9px 0 5px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-size:25px;font-weight:800;line-height:1;transition:transform .1s,background .15s;touch-action:manipulation}
.so-pad button small{display:block;font-size:10.5px;font-weight:800;opacity:.65;margin-top:3px;min-height:13px}
.so-pad button:active{transform:scale(.9)}
.so-pad button.kilit{background:var(--accent);color:#fff;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 35%,transparent)}
.so-pad button.bitti{opacity:.28}
.so-pad button.sevin{animation:sdkPop .4s cubic-bezier(.2,1.6,.4,1)}
.so-bilgi{min-height:18px;text-align:center;font-size:12.5px;font-weight:700;color:var(--ink-soft)}
.so-ipucu{position:absolute;inset:-4px;z-index:5;display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:16px;background:var(--card);border:2px solid var(--t-ip);box-shadow:0 10px 30px rgba(0,0,0,.18);overflow-y:auto;animation:sdkYuksel .2s ease-out}
.so-ipucu[hidden]{display:none}.so-ipucu b.bas{font-size:15px;font-weight:800}.so-ipucu p{margin:0;font-size:14px;font-weight:600;line-height:1.45;-webkit-user-select:text;user-select:text}
.so-ipucu .dug{display:flex;gap:8px;margin:auto -14px -12px;padding:8px 14px 12px;position:sticky;bottom:-12px;background:var(--card);box-shadow:0 -8px 10px -6px var(--card)}.so-ipucu .dug button{flex:1}
@keyframes sdkYuksel{from{transform:translateY(12px);opacity:0}}
/* modal */
.sdk-m{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:14px;background:rgba(15,18,30,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:sdkBel .18s}
@keyframes sdkBel{from{opacity:0}}
.sdk-mk{position:relative;width:100%;max-width:430px;max-height:88dvh;overflow-y:auto;background:var(--card);color:var(--ink);border-radius:20px;padding:20px 18px;box-shadow:0 20px 60px rgba(10,14,30,.4);animation:sdkYuksel .22s ease-out}
.sdk-mk h4{margin:0 0 12px;font-size:20px;font-weight:800;padding-right:34px}
.sdk-mk .x{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:10px;font-size:22px;line-height:1;color:var(--ink-soft);background:var(--bg)}
.sdk-mk p{margin:0 0 10px;font-size:14.5px;font-weight:600;color:var(--ink)}.sdk-mk p.soluk{color:var(--ink-soft);font-size:13px}
.sm-sat{display:flex;align-items:center;gap:12px;width:100%;padding:11px 2px;border-bottom:1px solid var(--line);text-align:left}
.sm-sat span{flex:1;font-weight:700;font-size:14.5px}.sm-sat span small{display:block;font-weight:600;font-size:12px;color:var(--ink-soft)}
.sm-sat i{flex:0 0 auto;width:44px;height:26px;border-radius:14px;background:var(--line);position:relative;transition:background .15s}
.sm-sat i::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}
.sm-sat.acik i{background:var(--accent)}.sm-sat.acik i::after{transform:translateX(18px)}
.sm-tema{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0 4px}
.sm-tema button{padding:8px 4px;border-radius:12px;border:2px solid var(--line);font-size:12.5px;font-weight:800}.sm-tema button.sec{border-color:var(--accent)}
.sm-tema button svg{display:block;width:100%;max-width:56px;margin:0 auto 5px;border-radius:6px}
.sm-yol{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin-bottom:14px}
.sm-yol button{aspect-ratio:1;border-radius:12px;background:var(--bg);border:1px solid var(--line);font-weight:800;font-size:15px;line-height:1.05;display:grid;place-items:center;align-content:center}
.sm-yol button small{font-size:9px;color:#e4a11b;letter-spacing:-1px;min-height:11px}
.sm-yol button.ok{background:color-mix(in srgb,var(--good) 12%,var(--card));border-color:color-mix(in srgb,var(--good) 45%,var(--line))}
.sm-yol button.sira{background:var(--accent);color:#fff;border-color:transparent;animation:sdkNabiz 1.4s infinite}
.sm-yol button:disabled{opacity:.4;cursor:default}
.sm-tablo{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:12px}.sm-tablo th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-soft);text-align:right;padding:4px 6px}
.sm-tablo td{padding:8px 6px;border-top:1px solid var(--line);text-align:right;font-weight:700}.sm-tablo td:first-child,.sm-tablo th:first-child{text-align:left;font-weight:800}
.sm-zafer{text-align:center}.sm-zafer .yil{font-size:44px;letter-spacing:6px;color:#e4a11b;margin:2px 0 4px}.sm-zafer .yil i{font-style:normal;display:inline-block;animation:sdkPop .45s cubic-bezier(.2,1.6,.4,1) both}.sm-zafer .yil i.bos{color:var(--line)}
.sm-zafer .oz{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.sm-zafer .oz div{background:var(--bg);border-radius:12px;padding:9px 4px}.sm-zafer .oz b{display:block;font-size:19px}.sm-zafer .oz small{font-size:11px;font-weight:800;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.04em}
.sm-zafer .rekor{display:inline-block;margin-bottom:6px;padding:4px 12px;border-radius:999px;background:color-mix(in srgb,var(--good) 16%,transparent);color:var(--good);font-weight:800;font-size:13px}
.sm-yard li{margin:0 0 7px;font-size:14px;font-weight:600}.sm-yard ul{padding-left:20px;margin:0 0 6px}
@media (min-width:760px){
  .sdk-mount{padding:18px!important}
  .so-govde{flex-direction:row;align-items:flex-start;justify-content:center;gap:22px}
  .so-tk{width:min(500px,calc(100dvh - 215px))}
  .so-yan{width:270px;flex:0 0 270px;gap:14px}
  .so-pad{grid-template-columns:repeat(3,1fr);gap:8px}.so-pad button{padding:15px 0 9px;font-size:30px}
  .so-arac{grid-template-columns:repeat(5,1fr)}
  .so-ipucu{inset:-6px}
  .sl-bes .sl-z{padding:16px 6px 12px}
}
@media (max-width:480px){.sl-bes{grid-template-columns:repeat(3,1fr)}.sl-bes .sl-z:nth-child(n+4){grid-column:span 1}.sl-bas h2{font-size:23px}.so-pad button{font-size:23px}.so-hata,.so-sure{font-size:14px;padding:7px 8px}}
@media (prefers-reduced-motion:reduce){.sc.dalga,.sc.salla,.sc b.pop,.sc.ipu{animation:none}}
`;
const SDK_IK = {
  geri: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  sil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H9L3.5 14.5a2 2 0 0 1 0-2.8L12 3.2a2 2 0 0 1 2.8 0l5.5 5.5a2 2 0 0 1 0 2.8L12 20"/><path d="M8.5 8.5l6.5 6.5"/></svg>',
  not: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z"/><path d="M14.5 6.5l3 3"/></svg>',
  oto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" stroke-width="2.6"/></svg>',
  ipucu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2.2h5c.1-1 .5-1.700 1.100-2.200A6 6 0 0 0 12 3z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  durak: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
  ayar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3h.1a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800v.1a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/></svg>'
};
function sdkKapak(renk) {   /* kart kapağı ve logo: küçük bir sudoku tahtası */
  const D = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79', K = { 2: 4, 3: 6, 10: 7, 18: 1, 29: 9, 40: 5, 50: 4, 54: 9, 63: 2 };
  let s = ''; for (let i = 0; i < 81; i++) { const x = (i % 9) * 10, y = ((i / 9) | 0) * 10, v = D[i] !== '.' ? D[i] : K[i]; if (i === 40) s += `<rect x="${x}" y="${y}" width="10" height="10" fill="${renk || '#6c8cff'}"/>`; else if (((i / 9) | 0) === 4 || i % 9 === 4) s += `<rect x="${x}" y="${y}" width="10" height="10" fill="#eaf0ff"/>`; if (v) s += `<text x="${x + 5}" y="${y + 7.6}" font-family="Nunito,sans-serif" font-weight="800" font-size="7" text-anchor="middle" fill="${i === 40 ? '#fff' : D[i] !== '.' ? '#2b2f38' : '#3b5bdb'}">${v}</text>`; }
  let l = ''; for (let k = 1; k < 9; k++) l += `<path d="M${k * 10} 0V90M0 ${k * 10}H90" stroke="${k % 3 ? '#d9deea' : '#2b2f38'}" stroke-width="${k % 3 ? .5 : 1.3}"/>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#fff"/>${s}${l}<rect x=".8" y=".8" width="88.4" height="88.400" fill="none" stroke="#2b2f38" stroke-width="1.6"/></svg>`;
}

registerGame({
  id:'sudoku', title:'Sudoku', category:'Bulmaca', tags:'sudoku günlük bulmaca rakam mantık zeka ipucu not yolculuk',
  gunluk: true, odak: true, noRestart: true,
  aciklama: 'Günün bulmacası, 60 bölümlük yolculuk ve beş zorlukta serbest oyun. Notlar, açıklamalı ipuçları, dört tahta teması.',
  cover: sdkKapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  shareText() { return this._paylas || 'Oyun Bahçesi\'nde Sudoku oynuyorum: günün bulmacası, 60 bölüm ve açıklamalı ipuçları.'; },
  render(root, api) {
    if (!document.getElementById('sdk-css')) { const st = document.createElement('style'); st.id = 'sdk-css'; st.textContent = SDK_CSS; document.head.appendChild(st); }
    const { R, C, B, UNITS, PEERS, bit, UAD } = SDK, oyunDef = this;
    const ZAD = { 1: 'Kolay', 2: 'Orta', 3: 'Zor', 4: 'Uzman', 5: 'Şeytan' }, TABAN = { 1: 300, 2: 600, 3: 1000, 4: 1500, 5: 2200 }, HSURE = { 1: 300, 2: 480, 3: 720, 4: 1080, 5: 1500 };
    const YOL_N = 60, yolZ = n => n < 10 ? 1 : n < 24 ? 2 : n < 40 ? 3 : n < 52 ? 4 : 5;
    const TEMA = [['klasik', 'Klasik', '#ffffff', '#6c8cff', '#2b2f38'], ['kagit', 'Kâğıt', '#FFFDF5', '#EDB73C', '#33281A'], ['gece', 'Gece', '#131C3A', '#4563FF', '#E8EDFF'], ['orman', 'Orman', '#F7FBF3', '#3E8E57', '#1F3D27']];
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const sure = t => { t = Math.max(0, Math.round(t)); const m = (t / 60) | 0, s = t % 60; return (m >= 60 ? ((m / 60) | 0) + ':' + String(m % 60).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
    const bugun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };

    /* ---------- kayıt ---------- */
    const uid = api.user ? api.user.uid : '_guest', LSK = 'ob_sudoku_v2:' + uid, bulut = !!(api.user && api.user.cloud);
    const bosIst = () => ({ b: 0, k: 0, en: 0, top: 0 });
    const AYAR0 = { denetim: 1, sinir: 0, ayni: 1, satir: 1, notSil: 1, kalan: 1, sayac: 1, tema: 'klasik' };
    function yukle() {
      let a = null, b = null; try { a = JSON.parse(localStorage.getItem(LSK)); } catch (e) { } try { b = api.loadState && api.loadState(); b = b && JSON.parse(JSON.stringify(b)); } catch (e) { }
      if (!a || a.v !== 2) a = null; if (!b || b.v !== 2) b = null;
      const d = a && b ? ((b.zaman || 0) > (a.zaman || 0) ? b : a) : (a || b || { v: 2, zaman: 0 });
      d.ayar = Object.assign({}, AYAR0, d.ayar || {}); d.ist = d.ist || {}; for (let z = 1; z <= 5; z++) d.ist[z] = Object.assign(bosIst(), d.ist[z] || {});
      d.yol = Array.isArray(d.yol) ? d.yol : []; d.yolT = Array.isArray(d.yolT) ? d.yolT : []; d.gun = Array.isArray(d.gun) ? d.gun.filter(x => typeof x === 'string') : [];
      if (a && b) { const o = d === a ? b : a; (o.yol || []).forEach((y, i) => { if ((y | 0) > (d.yol[i] | 0)) { d.yol[i] = y; d.yolT[i] = (o.yolT || [])[i] || 0; } }); }
      for (let i = 0; i < YOL_N; i++) { d.yol[i] = d.yol[i] | 0; d.yolT[i] = d.yolT[i] | 0; }
      const o = d.oyun; if (!o || !o.p || !o.c || !Array.isArray(o.g) || o.g.length !== 81 || o.bitti) d.oyun = null; else { o.n = Array.isArray(o.n) && o.n.length === 81 ? o.n : new Array(81).fill(0); }
      return d;
    }
    let D = yukle(), kT = null, sonBulut = 0;
    function kaydet(hemen) {
      D.zaman = Date.now(); try { localStorage.setItem(LSK, JSON.stringify(D)); } catch (e) { }
      if (!api.saveState) return; const yaz = () => { sonBulut = Date.now(); try { api.saveState(JSON.parse(JSON.stringify(D))); } catch (e) { } };
      if (hemen) { clearTimeout(kT); kT = null; return yaz(); }
      if (!kT) kT = setTimeout(() => { kT = null; yaz(); }, bulut ? Math.max(1500, 20000 - (Date.now() - sonBulut)) : 500);
    }
    const A = () => D.ayar;
    const gunKayit = (N, z) => { for (const s of D.gun) { const p = s.split('|').map(Number); if (p[0] === N && p[1] === z) return { t: p[2], h: p[3], ip: p[4] }; } return null; };
    const yolSira = () => { const i = D.yol.findIndex(y => !y); return i < 0 ? YOL_N : i; };
    const yildizTop = () => D.yol.reduce((a, b) => a + b, 0);

    /* ---------- kök ---------- */
    root.innerHTML = ''; root.classList.add('sdk-mount');
    const kok = document.createElement('div'); kok.className = 'sdk'; root.append(kok);
    const katman = document.createElement('div'); kok.after(katman);            /* modallar */
    let ekran = 'lobi', G = null, secili = -1, kilit = 0, notMod = false, durak = false, geriY = [], ipu = null, H = [], onb = [], efekt = new Array(81).fill(''), bilgi = '', bilgiT = 0, ro = null;
    const temaUygula = () => { kok.dataset.tema = A().tema; };

    /* ---------- modal ---------- */
    function modal(html, o) {
      o = o || {}; katman.innerHTML = `<div class="sdk-m"><div class="sdk-mk sdk" data-tema="klasik">${o.kapanmaz ? '' : '<button class="x" data-a="kapat" aria-label="Kapat">×</button>'}${html}</div></div>`;
      const m = katman.firstChild; m.addEventListener('click', e => { if (e.target === m && !o.kapanmaz) kapat(); else tikla(e); });
      return m;
    }
    let sorFn = null;
    function kapat() { katman.innerHTML = ''; }
    const modalAcik = () => !!katman.firstChild;
    function sor(baslik, metin, evet, fn) { modal(`<h4>${baslik}</h4><p>${metin}</p><button class="sdk-btn blok" data-a="evet">${evet}</button><button class="sdk-btn hafif blok" data-a="kapat">Vazgeç</button>`); sorFn = fn; }

    /* ---------- lobi ---------- */
    function onizle(o) {
      let s = ''; for (let i = 0; i < 81; i++) if (o.g[i]) s += `<text x="${C(i) * 10 + 5}" y="${R(i) * 10 + 7.6}"${o.p[i] === '0' ? ' class="k"' : ''}>${o.g[i]}</text>`;
      let l = ''; for (let k = 1; k < 9; k++) l += `<path d="M${k * 10} 0V90M0 ${k * 10}H90" stroke="${k % 3 ? '#dfe3ee' : '#2b2f38'}" stroke-width="${k % 3 ? .5 : 1.2}"/>`;
      return `<svg class="sdk-mini" viewBox="0 0 90 90">${s}${l}</svg>`;
    }
    const turAd = o => o.tur === 'g' ? 'Günün bulmacası' : o.tur === 'y' ? 'Yolculuk · Bölüm ' + (o.no + 1) : 'Serbest oyun';
    const doluluk = o => { let b = 0, d = 0; for (let i = 0; i < 81; i++) if (o.p[i] === '0') { b++; if (o.g[i] && o.g[i] === +o.c[i]) d++; } return b ? Math.round(100 * d / b) : 0; };
    const hamleVar = o => o && !o.bitti && (o.t > 20 || o.g.some((v, i) => v && o.p[i] === '0'));
    function lobiHTML() {
      const N = bugun(), S = window.Seri ? Seri.ozet('sudoku') : { seri: 0, g: {} }, o = D.oyun && !D.oyun.bitti ? D.oyun : null, sira = yolSira();
      const GUN = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'], tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
      let hafta = ''; for (let n = N - 6; n <= N; n++) { const x = S.g && S.g[n], d = new Date(Date.UTC(2026, 0, 1) + n * 864e5).getUTCDay(); hafta += `<span class="${x && x.ok ? 'ok' : ''}${n === N ? ' bu' : ''}"><i>${x && x.ok ? '✓' : ''}</i>${GUN[d]}</span>`; }
      const noktalar = z => '<span class="nokta">' + [1, 2, 3, 4, 5].map(k => `<i${k <= z ? ' class="d"' : ''}></i>`).join('') + '</span>';
      return `<div class="sl">
        <div class="sl-bas"><div class="sl-logo">${sdkKapak()}</div><div><h2>Sudoku</h2><p>Her satır, sütun ve kutuda 1–9 birer kez.</p></div>${S.seri ? `<div class="sl-seri">🔥 ${S.seri}<small>gün seri</small></div>` : ''}</div>
        ${o ? `<button class="sl-devam" data-a="devam">${onizle(o)}<span><b>Devam et</b><small>${ZAD[o.z]} · ${turAd(o)} · %${doluluk(o)} · ${sure(o.t)}</small></span><span class="git">›</span></button>` : ''}
        <div class="sl-kutu"><div class="ust"><h3>Günün bulmacası</h3><span>${tarih}</span></div>
          <div class="sl-uc">${[1, 2, 3].map(z => { const k = gunKayit(N, z); return `<button class="sl-z${k ? ' ok' : ''}" data-a="gun" data-z="${z}">${noktalar(z)}<b>${ZAD[z]}</b><small>${k ? '✓ ' + sure(k.t) : 'bugün çöz'}</small></button>`; }).join('')}</div>
          <div class="sl-hafta">${hafta}</div></div>
        <div class="sl-kutu"><div class="ust"><h3>Yolculuk</h3><span>★ ${yildizTop()} / ${YOL_N * 3}</span></div>
          <div class="sl-yol"><div class="cub"><div><i style="width:${Math.round(100 * D.yol.filter(Boolean).length / YOL_N)}%"></i></div><small>${D.yol.filter(Boolean).length} / ${YOL_N} bölüm${sira < YOL_N ? ' · sıradaki: ' + ZAD[yolZ(sira)] : ' · hepsi tamam!'}</small></div>
          ${sira < YOL_N ? `<button class="sdk-btn" data-a="yol" data-n="${sira}">Bölüm ${sira + 1} ›</button>` : ''}<button class="sdk-btn hafif" data-a="yolAc">Tümü</button></div></div>
        <div class="sl-kutu"><div class="ust"><h3>Serbest oyun</h3><span>en iyi süre</span></div>
          <div class="sl-bes">${[1, 2, 3, 4, 5].map(z => `<button class="sl-z" data-a="serbest" data-z="${z}">${noktalar(z)}<b>${ZAD[z]}</b><small>${D.ist[z].en ? sure(D.ist[z].en) : '—'}</small></button>`).join('')}</div></div>
        <div class="sl-alt"><button class="sdk-btn hafif" data-a="ist">📊 İstatistik</button><button class="sdk-btn hafif" data-a="ayar">⚙ Ayarlar</button><button class="sdk-btn hafif" data-a="yardim">? Nasıl oynanır</button></div>
      </div>`;
    }
    function lobi() { ekran = 'lobi'; G = null; durak = false; ipu = null; if (ro) { ro.disconnect(); ro = null; } kok.innerHTML = lobiHTML(); temaUygula(); }

    /* ---------- oyun başlat ---------- */
    function basla(tur, z, no) {
      const o = D.oyun;
      if (o && !o.bitti && tur !== 's' && o.tur === tur && o.z === z && o.no === no) return oyunAc();
      const git = () => {
        kapat(); kok.innerHTML = '<div class="sdk-bekle"><div><i></i>Bulmaca hazırlanıyor…</div></div>';
        setTimeout(() => {
          const tohum = tur === 'g' ? 50000 + no * 10 : tur === 'y' ? 700 + no : (no = (Date.now() % 1e9) | 0);
          const b = SDK.uret(z, tohum);
          D.oyun = { tur, z, no, p: b.p.join(''), c: b.cozum.join(''), g: b.p.slice(), n: new Array(81).fill(0), t: 0, h: 0, ip: 0, sans: 0, bitti: 0 };
          D.ist[z].b++; kaydet(true); oyunAc();
        }, 60);
      };
      if (hamleVar(o)) sor('Yeni bulmaca', `Süren bulmacan var (${ZAD[o.z]} · ${turAd(o)}, %${doluluk(o)}). Yenisine başlarsan o silinir.`, 'Yenisine başla', git); else git();
    }

    /* ---------- oyun ekranı ---------- */
    function oyunAc() {
      ekran = 'oyun'; G = D.oyun; secili = -1; kilit = 0; notMod = false; durak = false; geriY = []; ipu = null; onb = []; efekt.fill('');
      let hc = ''; for (let i = 0; i < 81; i++) hc += `<div class="sc" data-i="${i}"></div>`;
      const arac = (a, ad, ik) => `<button data-a="${a}" id="sa-${a}">${SDK_IK[ik]}<span>${ad}</span></button>`;
      kok.innerHTML = `<div class="so">
        <div class="so-ust"><button class="so-ik" data-a="menu" title="Menü" aria-label="Menü">${SDK_IK.menu}</button>
          <div class="so-ad"><b>${ZAD[G.z]}</b><small>${turAd(G)}</small></div>
          <span class="so-hata" id="so-hata"></span><span class="so-sure" id="so-sure"></span>
          <button class="so-ik" data-a="durak" title="Duraklat" aria-label="Duraklat">${SDK_IK.durak}</button><button class="so-ik" data-a="ayar" title="Ayarlar" aria-label="Ayarlar">${SDK_IK.ayar}</button></div>
        <div class="so-govde"><div class="so-tk"><div class="so-tahta" id="so-tahta">${hc}</div><div class="so-durak" id="so-durak" data-a="durak" hidden><div><b>Duraklatıldı</b><small>Devam etmek için dokun</small></div></div></div>
          <div class="so-yan"><div class="so-arac">${arac('geri', 'Geri al', 'geri')}${arac('sil', 'Sil', 'sil')}${arac('not', 'Not', 'not')}${arac('oto', 'Oto not', 'oto')}${arac('ipucu', 'İpucu', 'ipucu')}</div>
            <div class="so-pad" id="so-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-d="${d}">${d}<small></small></button>`).join('')}</div>
            <div class="so-bilgi" id="so-bilgi"></div><div class="so-ipucu" id="so-ipucu" hidden></div></div></div></div>`;
      temaUygula();
      const tahta = kok.querySelector('#so-tahta'); H = [...tahta.children];
      const olc = () => { const w = tahta.clientWidth; if (w) tahta.style.setProperty('--sz', (w / 9) + 'px'); };
      olc(); if (window.ResizeObserver) { ro = new ResizeObserver(olc); ro.observe(tahta); }
      tahta.addEventListener('pointerdown', e => { const el = e.target.closest('.sc'); if (!el || durak) return; e.preventDefault(); hucreDokun(+el.dataset.i); });
      const pad = kok.querySelector('#so-pad'); let basT = null, uzun = false;
      pad.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (!b) return; uzun = false; clearTimeout(basT); basT = setTimeout(() => { uzun = true; kilitle(+b.dataset.d); }, 430); });
      const bitir = () => clearTimeout(basT); pad.addEventListener('pointerup', bitir); pad.addEventListener('pointerleave', bitir); pad.addEventListener('pointercancel', bitir);
      pad.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (uzun) { uzun = false; return; } rakamBas(+b.dataset.d); });
      pad.addEventListener('contextmenu', e => e.preventDefault());
      ciz(); ustCiz();
    }
    const verili = i => G.p[i] !== '0';
    const cozum = i => +G.c[i];
    const hataUst = () => A().sinir ? 3 * (1 + (G.sans | 0)) : 0;
    function ustCiz() {
      if (ekran !== 'oyun') return; const h = kok.querySelector('#so-hata'), s = kok.querySelector('#so-sure'); if (!h) return;
      h.hidden = !A().denetim; h.textContent = '✕ ' + G.h + (hataUst() ? '/' + hataUst() : ''); h.classList.toggle('var', G.h > 0);
      s.hidden = !A().sayac; s.textContent = sure(G.t);
    }
    function bilgiYaz(m, sn) { bilgi = m; bilgiT = Date.now() + (sn || 3) * 1000; const b = kok.querySelector('#so-bilgi'); if (b) b.textContent = m; }
    function cakisanlar() { const s = new Set(); for (const u of UNITS) { const yer = {}; for (const i of u) { const v = G.g[i]; if (!v) continue; if (yer[v] !== undefined) { s.add(i); s.add(yer[v]); } else yer[v] = i; } } return s; }
    function ciz() {
      if (ekran !== 'oyun' || !H.length) return;
      const a = A(), vr = kilit || (secili >= 0 ? G.g[secili] : 0), cak = a.denetim ? null : cakisanlar(), say = new Array(10).fill(0);
      for (let i = 0; i < 81; i++) {
        const v = G.g[i]; if (v) say[v]++;
        let c = 'sc' + (C(i) % 3 === 2 && C(i) < 8 ? ' br' : '') + (R(i) % 3 === 2 && R(i) < 8 ? ' bb' : '');
        if (verili(i)) c += ' ver';
        if (i === secili) c += ' sel'; else if (secili >= 0 && a.satir && (R(i) === R(secili) || C(i) === C(secili) || B(i) === B(secili))) c += ' es';
        if (v && vr && v === vr && a.ayni && i !== secili) c += ' ay';
        if (v && !verili(i) && a.denetim && v !== cozum(i)) c += ' hat'; else if (v && cak && cak.has(i)) c += ' cak';
        if (ipu) { if (ipu.i === i) c += ' ipu'; else if (ipu.kaynak.has(i)) c += ' ipk'; else if (ipu.birim.has(i)) c += ' ipb'; if (ipu.yanlis && ipu.yanlis.has(i)) c += ' hat'; }
        c += efekt[i];
        let ic; if (v) ic = 'v' + v + (efekt[i] === ' yeni' ? 'p' : ''); else if (G.n[i]) ic = 'n' + G.n[i] + '.' + (a.ayni ? vr : 0); else ic = '';
        const anahtar = c + '|' + ic; if (onb[i] === anahtar) continue; onb[i] = anahtar;
        const el = H[i]; el.className = c.replace(' yeni', '');
        if (v) el.innerHTML = `<b${efekt[i] === ' yeni' ? ' class="pop"' : ''}>${v}</b>`;
        else if (G.n[i]) { let s = '<div class="sn">'; for (let d = 1; d <= 9; d++) s += G.n[i] & bit(d) ? `<i${a.ayni && d === vr ? ' class="v"' : ''}>${d}</i>` : '<i></i>'; el.innerHTML = s + '</div>'; }
        else el.innerHTML = '';
      }
      const pad = kok.querySelector('#so-pad'); if (pad) [...pad.children].forEach((b, k) => { const d = k + 1, kal = 9 - say[d]; b.classList.toggle('kilit', kilit === d); b.classList.toggle('bitti', kal <= 0); b.lastChild.textContent = a.kalan ? (kal > 0 ? kal : '✓') : ''; });
      const nb = kok.querySelector('#sa-not'); if (nb) { nb.classList.toggle('acik', notMod); nb.querySelector('span').textContent = notMod ? 'Not: açık' : 'Not'; }
      const ib = kok.querySelector('#sa-ipucu'); if (ib && G.ip && !ib.querySelector('em')) ib.insertAdjacentHTML('beforeend', '<em></em>'); if (ib && G.ip) ib.querySelector('em').textContent = G.ip;
      const b = kok.querySelector('#so-bilgi'); if (b) b.textContent = Date.now() < bilgiT ? bilgi : kilit ? `${kilit} kilitli: boş hücrelere dokun${notMod ? ' (not)' : ''} · yeniden bas, bırak` : '';
    }
    function efektVer(liste, sinif, ms) { liste.forEach(i => { efekt[i] = ' ' + sinif; }); setTimeout(() => { liste.forEach(i => { if (efekt[i] === ' ' + sinif) efekt[i] = ''; }); ciz(); }, ms); }
    function dalga(liste, merkez) { const mr = R(merkez), mc = C(merkez); liste.forEach(i => { H[i].style.setProperty('--g', ((Math.abs(R(i) - mr) + Math.abs(C(i) - mc)) * 0.035) + 's'); }); efektVer(liste, 'dalga', 1100); }

    /* ---------- hamleler ---------- */
    function hucreDokun(i) {
      if (G.bitti) return; ipuKapat();
      if (kilit && !verili(i) && (!G.g[i] || G.g[i] !== cozum(i) || !A().denetim)) { secili = i; rakamKoy(i, kilit); return; }
      secili = i === secili ? -1 : i; ses('click'); ciz();
    }
    function kilitle(d) { kilit = kilit === d ? 0 : d; if (kilit) secili = -1; try { api.buzz && api.buzz(14); } catch (e) { } ciz(); }
    function rakamBas(d) {
      if (G.bitti || durak) return; ipuKapat();
      if (kilit) { kilit = kilit === d ? 0 : d; return ciz(); }
      if (secili >= 0) { if (!verili(secili) && !(A().denetim && G.g[secili] && G.g[secili] === cozum(secili))) return rakamKoy(secili, d); return bilgiYaz('Bu hücre dolu. Rakamı kilitlemek için rakama uzun bas.', 4); }
      kilit = d; ciz();
    }
    function rakamKoy(i, d) {
      if (verili(i) || G.bitti) return;
      if (notMod) { if (G.g[i]) return ciz(); geriY.push({ i, v: 0, n: G.n[i], es: [] }); G.n[i] ^= bit(d); ses('click'); kaydet(); return ciz(); }
      const eski = G.g[i]; if (eski === d) { geriY.push({ i, v: eski, n: G.n[i], es: [] }); G.g[i] = 0; kaydet(); return ciz(); }
      const kayit = { i, v: eski, n: G.n[i], es: [] }; G.g[i] = d; G.n[i] = 0;
      const dogru = d === cozum(i);
      if (A().notSil && (dogru || !A().denetim)) for (const j of PEERS[i]) if (G.n[j] & bit(d)) { kayit.es.push([j, G.n[j]]); G.n[j] &= ~bit(d); }
      geriY.push(kayit); if (geriY.length > 400) geriY.shift();
      if (A().denetim && !dogru) {
        G.h++; ses('bad'); efektVer([i], 'salla', 380); ustCiz(); kaydet(); ciz();
        if (hataUst() && G.h >= hataUst()) setTimeout(hakBitti, 450);
        return;
      }
      efektVer([i], 'yeni', 260); kaydet(); tamamKontrol(i, d);
    }
    function tamamKontrol(i, d) {
      if (G.g.every((v, k) => v === cozum(k))) return kazan(i);
      const tam = []; for (const u of [R(i), 9 + C(i), 18 + B(i)]) if (UNITS[u].every(k => G.g[k] === cozum(k))) tam.push(...UNITS[u]);
      if (tam.length) { dalga([...new Set(tam)], i); ses('good'); }
      else if (G.g.filter(v => v === d).length === 9 && G.g.every((v, k) => v !== d || cozum(k) === d)) { ses('score'); const b = kok.querySelector('#so-pad').children[d - 1]; b.classList.remove('sevin'); void b.offsetWidth; b.classList.add('sevin'); if (kilit === d) kilit = 0; }
      else ses('tap');
      if (!G.g.includes(0) && !A().denetim) bilgiYaz('Tahta doldu ama bazı rakamlar yanlış. Çakışanlar kırmızı görünür.', 6);
      ciz();
    }
    function sil() { if (secili < 0 || verili(secili) || G.bitti) return; const i = secili; if (!G.g[i] && !G.n[i]) return; if (A().denetim && G.g[i] && G.g[i] === cozum(i)) return bilgiYaz('Doğru rakam silinmez.'); geriY.push({ i, v: G.g[i], n: G.n[i], es: [] }); G.g[i] = 0; G.n[i] = 0; ses('click'); kaydet(); ciz(); }
    function geriAl() {
      const k = geriY.pop(); if (!k || G.bitti) { if (!k) bilgiYaz('Geri alınacak hamle yok.'); return; }
      if (k.tum) G.n = k.tum; else { G.g[k.i] = k.v; G.n[k.i] = k.n; for (const [j, n] of k.es) G.n[j] = n; secili = k.i; }
      ses('click'); kaydet(); ciz();
    }
    function otoNot() {
      if (G.bitti) return; const c = SDK.adaylar(G.g), dolu = G.g.some((v, i) => !v && G.n[i] === c[i] && c[i]), hepsi = G.g.every((v, i) => v || G.n[i] === c[i]);
      geriY.push({ tum: G.n.slice() });
      if (hepsi && dolu) { G.n = new Array(81).fill(0); bilgiYaz('Notlar temizlendi.'); } else { G.n = Array.from(c); bilgiYaz('Bütün adaylar not edildi. Yeniden basarsan temizlenir.', 4); }
      ses('click'); kaydet(); ciz();
    }
    function hakBitti() {
      if (!G || G.bitti) return;
      modal(`<h4>${G.h} hata</h4><p>Hata hakkın bitti. İkinci şansla 3 hak daha alırsın, ama bu bulmacadan en çok 1 yıldız kazanırsın.</p><button class="sdk-btn blok" data-a="sans">İkinci şans</button><button class="sdk-btn hafif blok" data-a="bastan">Baştan başla</button>`, { kapanmaz: true });
    }
    function bastan() { kapat(); G.g = G.p.split('').map(Number); G.n = new Array(81).fill(0); G.t = 0; G.h = 0; G.ip = 0; G.sans = 0; geriY = []; secili = -1; kilit = 0; ipu = null; ipuKapat(); kaydet(true); onb = []; ciz(); ustCiz(); }

    /* ---------- ipucu ---------- */
    const TEK = { isaret: 'Kilitli aday', sahip: 'Kilitli aday', cift: 'Açık çift', uclu: 'Açık üçlü', gcift: 'Gizli çift', xkanat: 'X-kanat' };
    function elemeMetin(e) {
      const ds = (e.ds || []).join(e.ds && e.ds.length === 2 ? ' ve ' : ', ');
      return e.t === 'isaret' ? `<b>Kilitli aday:</b> ${UAD(e.u1)} içinde ${e.d} yalnızca ${UAD(e.u2)} üzerinde olabilir; o yüzden ${UAD(e.u2)} üzerindeki diğer hücrelere ${e.d} giremez.`
        : e.t === 'sahip' ? `<b>Kilitli aday:</b> ${UAD(e.u1)} üzerinde ${e.d} yalnızca ${UAD(e.u2)} içinde olabilir; o yüzden kutunun diğer hücrelerine ${e.d} giremez.`
          : e.t === 'cift' ? `<b>Açık çift:</b> ${UAD(e.u)} içindeki iki hücre yalnızca ${ds} alabilir; bu rakamlar aynı birimin diğer hücrelerine giremez.`
            : e.t === 'uclu' ? `<b>Açık üçlü:</b> ${UAD(e.u)} içindeki üç hücre yalnızca ${ds} alabilir; bu rakamlar aynı birimin diğer hücrelerine giremez.`
              : e.t === 'gcift' ? `<b>Gizli çift:</b> ${UAD(e.u)} içinde ${ds} yalnızca aynı iki hücreye girebilir; o iki hücreye başka rakam giremez.`
                : `<b>X-kanat:</b> ${e.d} rakamı ${UAD(e.u1)} ve ${UAD(e.u2)} üzerinde aynı iki hizada kalıyor; o hizalardaki diğer hücrelere ${e.d} giremez.`;
    }
    function ipuKapat() { if (!ipu) return; ipu = null; const p = kok.querySelector('#so-ipucu'); if (p) p.hidden = true; ciz(); }
    function ipuGoster() {
      if (G.bitti || durak) return; const p = kok.querySelector('#so-ipucu'); kilit = 0;
      const yanlis = []; for (let i = 0; i < 81; i++) if (G.g[i] && G.g[i] !== cozum(i)) yanlis.push(i);
      if (yanlis.length) {
        ipu = { i: -1, kaynak: new Set(), birim: new Set(), yanlis: null, asama: 9 }; secili = -1;
        p.innerHTML = `<b class="bas">💡 Önce yanlışlar</b><p>Tahtada ${yanlis.length} yanlış rakam var. İpucu vermeden önce onların düzelmesi gerekiyor.</p><div class="dug"><button class="sdk-btn" data-a="ipYanlis">Yanlışları göster</button><button class="sdk-btn hafif" data-a="ipKapat">Kapat</button></div>`;
        ipu.liste = yanlis; p.hidden = false; return ciz();
      }
      const h = SDK.ipucu(G.g);
      if (!h) {
        const c = SDK.adaylar(G.g); let en = -1; for (let i = 0; i < 81; i++) if (!G.g[i] && (en < 0 || SDK.CNT[c[i]] < SDK.CNT[c[en]])) en = i; if (en < 0) return;
        ipu = { i: en, d: cozum(en), kaynak: new Set(), birim: new Set(), asama: 2 }; secili = en;
        p.innerHTML = `<b class="bas">💡 Deneme gerekiyor</b><p>Bu noktada bilinen tekniklerle ilerlenmiyor; burada bir varsayım yapıp sonucuna bakmak gerekir. İşaretli hücreyi senin için açabilirim.</p><div class="dug"><button class="sdk-btn" data-a="ipKoy">Hücreyi aç</button><button class="sdk-btn hafif" data-a="ipKapat">Kapat</button></div>`;
        p.hidden = false; return ciz();
      }
      ipu = { i: h.i, d: h.d, h, kaynak: new Set(h.once.flatMap(e => e.kaynak)), birim: new Set(h.t === 'gizli' ? UNITS[h.u] : [...UNITS[R(h.i)], ...UNITS[9 + C(h.i)], ...UNITS[18 + B(h.i)]]), asama: 1 };
      secili = -1;
      const on = h.once.length ? ` Bunu görmek için önce bir eleme gerekiyor (${[...new Set(h.once.map(e => TEK[e.t]))].join(', ')}).` : '';
      p.innerHTML = `<b class="bas">💡 ${h.t === 'gizli' ? 'Gizli tekli' : 'Tek aday'}</b><p>${h.t === 'gizli' ? `${UAD(h.u)} içinde bir rakam yalnızca işaretli hücreye girebilir.` : 'İşaretli hücreye yalnızca tek bir rakam girebilir: satırına, sütununa ve kutusuna bak.'}${on}</p><div class="dug"><button class="sdk-btn" data-a="ipAcikla">Açıkla</button><button class="sdk-btn hafif" data-a="ipKapat">Kendim bulurum</button></div>`;
      p.hidden = false; p.scrollTop = 0; ses('click'); ciz();
    }
    function ipuAcikla() {
      if (!ipu || !ipu.h) return; const h = ipu.h, p = kok.querySelector('#so-ipucu'); ipu.asama = 2;
      const neden = h.t === 'gizli' ? `${UAD(h.u)} içinde <b>${h.d}</b> yalnızca işaretli hücreye girebilir: diğer boş hücrelerin satırında, sütununda ya da kutusunda zaten ${h.d} var${h.once.length ? ' ya da yukarıdaki eleme onları dışarıda bırakıyor' : ''}.`
        : `İşaretli hücrenin satırında, sütununda ve kutusunda <b>${h.d}</b> dışındaki bütün rakamlar ${h.once.length ? 'var ya da yukarıdaki elemeyle dışarıda kalıyor' : 'zaten var'}; geriye yalnızca ${h.d} kalıyor.`;
      p.innerHTML = `<b class="bas">💡 ${R(h.i) + 1}. satır, ${C(h.i) + 1}. sütun = ${h.d}</b>${h.once.map(e => `<p>${elemeMetin(e)}</p>`).join('')}<p>${neden}</p><div class="dug"><button class="sdk-btn" data-a="ipKoy">Yerleştir</button><button class="sdk-btn hafif" data-a="ipKapat">Kapat</button></div>`;
      p.scrollTop = 0; ciz(); requestAnimationFrame(() => { p.scrollTop = 0; });
    }
    function ipuKoy() {
      if (!ipu || ipu.i < 0) return; const i = ipu.i, d = ipu.d; ipuKapat(); G.ip++; secili = i; const nm = notMod; notMod = false;
      if (G.g[i] !== d) { const kayit = { i, v: G.g[i], n: G.n[i], es: [] }; G.g[i] = d; G.n[i] = 0; if (A().notSil) for (const j of PEERS[i]) if (G.n[j] & bit(d)) { kayit.es.push([j, G.n[j]]); G.n[j] &= ~bit(d); } geriY.push(kayit); efektVer([i], 'yeni', 260); kaydet(); tamamKontrol(i, d); }
      notMod = nm; ciz();
    }

    /* ---------- bitiş ---------- */
    function kazan(son) {
      G.bitti = 1; const z = G.z, t = G.t, yildiz = G.sans ? 1 : (G.h + G.ip === 0 ? 3 : G.h + G.ip <= 2 ? 2 : 1);
      const skor = Math.max(50, Math.round(TABAN[z] * Math.min(1.5, Math.max(0.5, 1.5 - 0.5 * t / HSURE[z])) - 40 * G.h - 60 * G.ip));
      const I = D.ist[z], rekor = !I.en || t < I.en; I.k++; I.top += t; if (rekor) I.en = t;
      const ozet = { tur: G.tur, z, no: G.no, t, h: G.h, ip: G.ip, yildiz, skor, rekor: rekor && I.k > 1 };
      if (G.tur === 'y') { if (yildiz > D.yol[G.no]) D.yol[G.no] = yildiz; if (!D.yolT[G.no] || t < D.yolT[G.no]) D.yolT[G.no] = t; }
      if (G.tur === 'g') {
        const N = G.no, eski = gunKayit(N, z), ilkBugun = !D.gun.some(s => +s.split('|')[0] === N);
        if (!eski || t < eski.t) { D.gun = D.gun.filter(s => { const p = s.split('|'); return !(+p[0] === N && +p[1] === z); }); D.gun.push([N, z, t, G.h, G.ip].join('|')); if (D.gun.length > 120) D.gun = D.gun.slice(-120); }
        if (window.Seri && N === bugun()) Seri.kaydet('sudoku', N, { ok: true, b: z, max: true });
        if (ilkBugun && window.Progress && Progress.onDailyDone) { try { const p = Progress.onDailyDone(); (p.badges || []).forEach((b, k) => setTimeout(() => api.toast(b.emoji + ' Rozet: ' + b.name), 2600 + k * 1400)); } catch (e) { } }
      }
      const gunAd = G.tur === 'g' ? new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ' günün bulmacası' : G.tur === 'y' ? 'Yolculuk ' + (G.no + 1) + '. bölüm' : 'Serbest oyun';
      oyunDef._paylas = `Sudoku · ${gunAd} (${ZAD[z]}) — ${sure(t)}${A().denetim ? ', ' + G.h + ' hata' : ''}${G.ip ? ', ' + G.ip + ' ipucu' : ''} ${'★'.repeat(yildiz)}${'☆'.repeat(3 - yildiz)}`;
      D.oyun = null; kaydet(true); ipu = null; kilit = 0; secili = -1;
      dalga([...Array(81).keys()], son); ses('win'); try { window.FX && FX.confetti(); } catch (e) { }
      try { api.submitScore(skor); } catch (e) { }
      setTimeout(() => zaferGoster(ozet), 1150); ciz();
    }
    function zaferGoster(o) {
      if (ekran !== 'oyun') return; const N = bugun(); let sonra = '';
      if (o.tur === 'y' && o.no + 1 < YOL_N) sonra = `<button class="sdk-btn blok" data-a="yol" data-n="${o.no + 1}">Bölüm ${o.no + 2} · ${ZAD[yolZ(o.no + 1)]} ›</button>`;
      else if (o.tur === 'g') { const z = [1, 2, 3].find(k => !gunKayit(N, k)); sonra = z ? `<button class="sdk-btn blok" data-a="gun" data-z="${z}">Bugünün ${ZAD[z]} bulmacası ›</button>` : `<p class="soluk">Bugünün üç bulmacası da tamam. Yarın yenileri gelir.</p>`; }
      else if (o.tur === 's') sonra = `<button class="sdk-btn blok" data-a="serbest" data-z="${o.z}">Yeni ${ZAD[o.z]} bulmaca ›</button>`;
      modal(`<div class="sm-zafer"><h4 style="padding:0">${o.yildiz === 3 ? 'Kusursuz!' : o.yildiz === 2 ? 'Çok iyi!' : 'Tamamlandı!'}</h4>
        <div class="yil">${[1, 2, 3].map(k => `<i class="${k <= o.yildiz ? '' : 'bos'}" style="animation-delay:${k * .16}s">★</i>`).join('')}</div>
        ${o.rekor ? `<span class="rekor">🏆 ${ZAD[o.z]} için yeni en iyi süre</span>` : ''}
        <p class="soluk">${ZAD[o.z]} · ${o.tur === 'g' ? 'Günün bulmacası' : o.tur === 'y' ? 'Yolculuk · Bölüm ' + (o.no + 1) : 'Serbest oyun'}</p>
        <div class="oz"><div><b>${sure(o.t)}</b><small>Süre</small></div><div><b>${A().denetim ? o.h : '—'}</b><small>Hata</small></div><div><b>${o.ip}</b><small>İpucu</small></div></div>
        <p><b>${o.skor}</b> puan</p>${sonra}
        <button class="sdk-btn hafif blok" data-a="paylas">Sonucu paylaş</button><button class="sdk-btn hafif blok" data-a="menu">Menüye dön</button></div>`, { kapanmaz: true });
    }
    async function paylas() {
      const text = oyunDef.shareText(), url = 'https://erdevelop.com/oyunlar/#o/sudoku';
      try { if (navigator.share) { await navigator.share({ title: 'Sudoku · Oyun Bahçesi', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text + ' ' + url); api.toast('🔗 Sonuç kopyalandı'); } catch (e) { api.toast('Paylaşım bu cihazda desteklenmiyor'); }
    }

    /* ---------- pencereler ---------- */
    function ayarAc() {
      const a = A(), sat = (k, ad, alt) => `<button class="sm-sat${a[k] ? ' acik' : ''}" data-a="ayarla" data-k="${k}"><span>${ad}${alt ? `<small>${alt}</small>` : ''}</span><i></i></button>`;
      const temaSvg = t => `<svg viewBox="0 0 30 30"><rect width="30" height="30" fill="${t[2]}"/><rect x="10" y="10" width="10" height="10" fill="${t[3]}"/><path d="M10 0V30M20 0V30M0 10H30M0 20H30" stroke="${t[4]}" stroke-width="1.2"/><rect x=".6" y=".6" width="28.800" height="28.800" fill="none" stroke="${t[4]}" stroke-width="1.2"/></svg>`;
      modal(`<h4>Ayarlar</h4>
        ${sat('denetim', 'Hataları anında göster', 'Yanlış rakam kırmızı olur ve hata sayılır')}${sat('sinir', '3 hata hakkı', 'Hatalar bitince bulmaca durur')}
        ${sat('ayni', 'Aynı rakamları vurgula')}${sat('satir', 'Satır, sütun ve kutuyu vurgula')}${sat('notSil', 'Notları kendiliğinden temizle', 'Rakam koyunca aynı satır, sütun ve kutudaki notlardan silinir')}
        ${sat('kalan', 'Kalan rakam sayısını göster')}${sat('sayac', 'Süreyi göster')}
        <button class="sm-sat${window.FX && !FX.muted ? ' acik' : ''}" data-a="sesAc"><span>Ses ve titreşim</span><i></i></button>
        <h3 style="margin-top:14px">Tahta teması</h3><div class="sm-tema">${TEMA.map(t => `<button data-a="tema" data-t="${t[0]}" class="${a.tema === t[0] ? 'sec' : ''}">${temaSvg(t)}${t[1]}</button>`).join('')}</div>
        ${ekran === 'oyun' && G && !G.bitti ? '<button class="sdk-btn hafif blok" data-a="bastanSor">Bu bulmacayı baştan başlat</button>' : ''}`);
    }
    function yolAc() {
      const sira = yolSira(); let h = '<h4>Yolculuk</h4><p class="soluk">Bölümler sırayla açılır. Hatasız ve ipucusuz bitirirsen 3 yıldız alırsın.</p>', bas = 0;
      for (const [z, n] of [[1, 10], [2, 14], [3, 16], [4, 12], [5, 8]]) {
        h += `<h3 style="margin:6px 0 8px">${ZAD[z]}</h3><div class="sm-yol">`;
        for (let i = bas; i < bas + n; i++) h += `<button data-a="yol" data-n="${i}" class="${D.yol[i] ? 'ok' : i === sira ? 'sira' : ''}"${i > sira ? ' disabled' : ''}>${i > sira ? '🔒' : i + 1}<small>${'★'.repeat(D.yol[i] || 0)}</small></button>`;
        h += '</div>'; bas += n;
      }
      modal(h);
    }
    function istAc() {
      let t = '<h4>İstatistik</h4><table class="sm-tablo"><tr><th>Zorluk</th><th>Başlanan</th><th>Çözülen</th><th>En iyi</th><th>Ortalama</th></tr>';
      for (let z = 1; z <= 5; z++) { const I = D.ist[z]; t += `<tr><td>${ZAD[z]}</td><td>${I.b}</td><td>${I.k}</td><td>${I.en ? sure(I.en) : '—'}</td><td>${I.k ? sure(I.top / I.k) : '—'}</td></tr>`; }
      t += `</table><p class="soluk">Yolculuk: ${D.yol.filter(Boolean).length} / ${YOL_N} bölüm · ★ ${yildizTop()}</p><div id="sdk-seri"></div>`;
      const m = modal(t); if (window.Seri) { try { m.querySelector('#sdk-seri').append(Seri.panel('sudoku', { baslik: 'Günün bulmacası', api })); } catch (e) { } }
    }
    function yardimAc() {
      modal(`<h4>Nasıl oynanır</h4><div class="sm-yard"><ul>
        <li><b>Kural:</b> her satırda, her sütunda ve her 3×3 kutuda 1'den 9'a kadar rakamlar birer kez bulunur.</li>
        <li><b>Rakam koymak:</b> bir hücreye dokun, sonra rakama bas. Ya da hiçbir hücre seçili değilken bir rakama bas (ya da rakama uzun bas): rakam <b>kilitlenir</b>, dokunduğun her boş hücreye o yazılır.</li>
        <li><b>Not:</b> Not açıkken rakamlar küçük aday olarak yazılır. <b>Oto not</b> bütün adayları senin yerine doldurur.</li>
        <li><b>İpucu:</b> sıradaki mantıklı adımı gösterir; “Açıkla” dersen hangi teknikle bulunduğunu da anlatır. İpucu ve hata yıldız düşürür.</li>
        <li><b>Günün bulmacası:</b> her gün herkes için aynı üç bulmaca. Birini çözmek seriyi sürdürür.</li>
        <li><b>Yolculuk:</b> Kolay'dan Şeytan'a 60 bölüm; her bölümde en çok 3 yıldız.</li>
        <li><b>Klavye:</b> ok tuşları, 1–9, Sil/0, N (not), Z (geri al), H (ipucu), boşluk (duraklat).</li></ul></div>`);
    }

    /* ---------- tıklamalar ---------- */
    function tikla(e) {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, N = bugun();
      if (a === 'kapat') return kapat();
      if (a === 'evet') { const f = sorFn; sorFn = null; kapat(); return f && f(); }
      if (a === 'devam') return oyunAc();
      if (a === 'gun') { kapat(); return basla('g', +b.dataset.z, N); }
      if (a === 'yol') { if (b.disabled) return; kapat(); return basla('y', yolZ(+b.dataset.n), +b.dataset.n); }
      if (a === 'serbest') { kapat(); return basla('s', +b.dataset.z, 0); }
      if (a === 'yolAc') return yolAc(); if (a === 'ist') return istAc(); if (a === 'ayar') return ayarAc(); if (a === 'yardim') return yardimAc();
      if (a === 'ayarla') { const k = b.dataset.k; A()[k] = A()[k] ? 0 : 1; b.classList.toggle('acik', !!A()[k]); kaydet(); onb = []; ciz(); ustCiz(); return; }
      if (a === 'sesAc') { if (window.FX) { FX.toggle(); b.classList.toggle('acik', !FX.muted); } return; }
      if (a === 'tema') { A().tema = b.dataset.t; temaUygula(); b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('sec', x === b)); return kaydet(); }
      if (a === 'menu') { kapat(); kaydet(true); return lobi(); }
      if (a === 'paylas') return paylas();
      if (ekran !== 'oyun' || !G) return;
      if (a === 'durak') return durakla(!durak);
      if (a === 'bastanSor') return sor('Baştan başla', 'Bu bulmacadaki bütün rakamların, notların ve süren silinir.', 'Baştan başla', bastan);
      if (a === 'bastan') return bastan();
      if (a === 'sans') { G.sans = (G.sans | 0) + 1; kapat(); kaydet(); return ustCiz(); }
      if (durak || G.bitti) return;
      if (a === 'geri') { ipuKapat(); return geriAl(); } if (a === 'sil') { ipuKapat(); return sil(); }
      if (a === 'not') { notMod = !notMod; ses('click'); return ciz(); }
      if (a === 'oto') { ipuKapat(); return otoNot(); } if (a === 'ipucu') return ipu ? ipuKapat() : ipuGoster();
      if (a === 'ipKapat') return ipuKapat(); if (a === 'ipAcikla') return ipuAcikla(); if (a === 'ipKoy') return ipuKoy();
      if (a === 'ipYanlis') { ipu.yanlis = new Set(ipu.liste); secili = ipu.liste[0]; kok.querySelector('#so-ipucu').hidden = true; ciz(); setTimeout(() => { if (ipu && ipu.yanlis) { ipu = null; ciz(); } }, 3500); return; }
    }
    kok.addEventListener('click', tikla);
    function durakla(v) {
      if (ekran !== 'oyun' || !G || G.bitti) return; durak = v; const t = kok.querySelector('#so-tahta'), d = kok.querySelector('#so-durak'); if (!t) return;
      t.classList.toggle('gizli', durak); d.hidden = !durak; if (durak) kaydet(true);
    }

    /* ---------- klavye, sayaç ---------- */
    function tus(e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.ctrlKey && e.key.toLowerCase() !== 'z' || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') { if (modalAcik()) { if (!katman.querySelector('.x')) return; kapat(); } else if (ipu) ipuKapat(); else if (kilit) { kilit = 0; ciz(); } else if (secili >= 0) { secili = -1; ciz(); } return; }
      if (ekran !== 'oyun' || !G || modalAcik()) return;
      if (e.key === ' ' || e.key.toLowerCase() === 'p') { e.preventDefault(); return durakla(!durak); }
      if (durak || G.bitti) return; const k = e.key;
      if (k.startsWith('Arrow')) { e.preventDefault(); let i = secili < 0 ? 40 : secili; i = k === 'ArrowUp' ? (i + 72) % 81 : k === 'ArrowDown' ? (i + 9) % 81 : k === 'ArrowLeft' ? (i % 9 ? i - 1 : i + 8) : (i % 9 === 8 ? i - 8 : i + 1); secili = i; ipuKapat(); return ciz(); }
      if (/^[1-9]$/.test(k)) { e.preventDefault(); ipuKapat(); if (secili >= 0) { kilit = 0; if (!verili(secili) && !(A().denetim && G.g[secili] && G.g[secili] === cozum(secili))) rakamKoy(secili, +k); else ciz(); } else { kilit = kilit === +k ? 0 : +k; ciz(); } return; }
      if (k === 'Backspace' || k === 'Delete' || k === '0') { e.preventDefault(); return sil(); }
      const h = k.toLowerCase(); if (h === 'n') { notMod = !notMod; return ciz(); } if (h === 'z' || h === 'u') { e.preventDefault(); ipuKapat(); return geriAl(); } if (h === 'h') return ipu ? (ipu.asama === 1 ? ipuAcikla() : ipuKoy()) : ipuGoster();
    }
    document.addEventListener('keydown', tus);
    const tm = setInterval(() => { if (ekran !== 'oyun' || !G || G.bitti || durak || document.hidden || modalAcik()) return; G.t++; ustCiz(); if (G.t % 5 === 0) { D.zaman = Date.now(); try { localStorage.setItem(LSK, JSON.stringify(D)); } catch (e) { } } if (bilgiT && Date.now() > bilgiT) { bilgiT = 0; ciz(); } }, 1000);
    const gorunur = () => { if (document.hidden && ekran === 'oyun' && G && !G.bitti && !durak) durakla(true); if (document.hidden) kaydet(true); };
    document.addEventListener('visibilitychange', gorunur);
    api.onCleanup(() => { clearInterval(tm); clearTimeout(kT); document.removeEventListener('keydown', tus); document.removeEventListener('visibilitychange', gorunur); if (ro) ro.disconnect(); if (D.zaman) kaydet(true); katman.remove(); root.classList.remove('sdk-mount'); });

    if (/[?&]sdktest/.test(location.search)) window.__sdk = { D: () => D, G: () => G, basla, coz(kalan) { let n = G.g.filter((v, i) => v !== cozum(i)).length; for (let i = 0; i < 81 && n > (kalan || 0); i++) if (G.g[i] !== cozum(i)) { G.g[i] = cozum(i); G.n[i] = 0; n--; } onb = []; ciz(); }, cozumu: () => G.c, lobi };
    lobi();
  }
});
