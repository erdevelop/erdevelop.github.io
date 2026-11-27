/* Kakuro — beyaz karelere 1–9 yaz: her yatay ve dikey dizi, solundaki ya da üstündeki ipucu toplamını versin; bir dizide rakam tekrar etmez.
   Bulmacalar tohumla üretilir ve tek çözümlü olması sağlanır (gerekirse birkaç kare baştan verilir). */
(function () {
'use strict';
const KK = (() => {
  const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  /* toplam/uzunluk için kullanılabilecek rakam maskeleri */
  const KOMB = {}; for (let m = 1; m < 512; m++) { let s = 0, n = 0; for (let d = 0; d < 9; d++) if (m & (1 << d)) { s += d + 1; n++; } (KOMB[n * 100 + s] = KOMB[n * 100 + s] || []).push(m); }
  const birlesim = (n, s) => (KOMB[n * 100 + s] || []).reduce((a, m) => a | m, 0);
  const bitSay = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
  /* desen: N×N, ilk satır ve sütun siyah; beyaz kareler en az 2'lik dizilerde */
  function desen(N, r) {
    for (let d = 0; d < 400; d++) {
      const B = new Array(N * N).fill(1); for (let y = 1; y < N; y++) for (let x = 1; x < N; x++) B[y * N + x] = 0;
      const yog = .16 + r() * .08;
      for (let y = 1; y < N; y++) for (let x = 1; x < N; x++) if (r() < yog) { B[y * N + x] = 1; B[(N - y) * N + (N - x)] = 1; }
      /* 2×2 beyaz bloklarını azalt (rakam takası çok çözüme yol açar) */
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = y * N + x; if (!B[i] && !B[i + 1] && !B[i + N] && !B[i + N + 1] && r() < .4) { const j = [i, i + 1, i + N, i + N + 1][(r() * 4) | 0]; B[j] = 1; B[(N - 1 - ((j / N) | 0) + 1) * N + (N - (j % N))] = 1; } }
      /* tek kalan beyazları siyaha çevir */
      for (let tur = 0; tur < 20; tur++) { let degisti = false;
        for (let y = 1; y < N; y++) for (let x = 1; x < N; x++) { const i = y * N + x; if (B[i]) continue; const h = (!B[i - 1]) || (x < N - 1 && !B[i + 1]), v = (!B[i - N]) || (y < N - 1 && !B[i + N]);
          if (!h || !v) { B[i] = 1; B[(N - y) * N + (N - x)] = 1; degisti = true; } }
        if (!degisti) break; }
      /* dizi uzunluğu en çok 9; beyaz sayısı yeterli ve bağlı */
      const W = []; for (let i = 0; i < N * N; i++) if (!B[i]) W.push(i); if (W.length < (N - 1) * (N - 1) * .42) continue;
      const gor = new Set([W[0]]), yig = [W[0]]; while (yig.length) { const i = yig.pop(); for (const j of [i - 1, i + 1, i - N, i + N]) if (j >= 0 && j < N * N && !B[j] && !gor.has(j) && Math.abs((j % N) - (i % N)) <= 1) { gor.add(j); yig.push(j); } }
      if (gor.size !== W.length) continue;
      return B;
    }
    return null;
  }
  function diziler(N, B) {
    const D = [], H = new Array(N * N).fill(-1), V = new Array(N * N).fill(-1);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!B[i]) continue;
      if (x < N - 1 && !B[i + 1]) { const k = []; let j = i + 1; while ((j % N) !== 0 && !B[j]) { k.push(j); j++; } D.push({ ip: i, yon: 'y', k }); }
      if (y < N - 1 && !B[i + N]) { const k = []; let j = i + N; while (j < N * N && !B[j]) { k.push(j); j += N; } D.push({ ip: i, yon: 'd', k }); } }
    D.forEach((d, n) => d.k.forEach(i => { if (d.yon === 'y') H[i] = n; else V[i] = n; }));
    return { D, H, V };
  }
  function doldur(N, B, Z, r) {   /* rastgele geçerli rakamlar */
    const { D, H, V } = Z, W = []; for (let i = 0; i < N * N; i++) if (!B[i]) W.push(i);
    const A = new Array(N * N).fill(0); let say = 0;
    const git = k => { if (k === W.length) return true; if (++say > 200000) return false; const i = W[k], kul = new Set(); for (const d of [D[H[i]], D[V[i]]]) for (const j of d.k) if (A[j]) kul.add(A[j]);
      const S = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => !kul.has(x)).map(x => [x, r() - Math.abs(x - 5) * .22]).sort((a, b) => a[1] - b[1]).map(x => x[0]); for (const x of S) { A[i] = x; if (git(k + 1)) return true; } A[i] = 0; return false; };
    return git(0) ? A : null;
  }
  /* çözüm sayısı (en çok 2) ve ikinci çözüm */
  function coz(N, B, Z, top, verilen, sinir) {
    const { D, H, V } = Z, W = []; for (let i = 0; i < N * N; i++) if (!B[i]) W.push(i);
    const A = verilen.slice(), sonuc = []; let dugum = 0;
    const aday = i => { let m = 511; for (const n of [H[i], V[i]]) { const d = D[n]; let kul = 0, s = 0, bos = 0; for (const j of d.k) { if (A[j]) { kul |= 1 << (A[j] - 1); s += A[j]; } else bos++; }
        let mm = 0; for (const c of KOMB[bos * 100 + (top[n] - s)] || []) if (!(c & kul)) mm |= c; m &= mm; } return m; };
    const git = () => {
      if (++dugum > (sinir || 300000)) return true;
      let en = -1, enM = 0, enS = 99; for (const i of W) { if (A[i]) continue; const m = aday(i), c = bitSay(m); if (!c) return false; if (c < enS) { enS = c; en = i; enM = m; if (c === 1) break; } }
      if (en < 0) { sonuc.push(A.slice()); return sonuc.length >= 2; }
      for (let d = 0; d < 9; d++) if (enM & (1 << d)) { A[en] = d + 1; if (git()) return true; } A[en] = 0; return false;
    };
    git(); return { say: sonuc.length, sonuc, asildi: dugum > (sinir || 300000) };
  }
  function uret(N, tohum) {
    const r = rng(tohum);
    for (let d = 0; d < 50; d++) {
      const B = desen(N, r); if (!B) continue; const Z = diziler(N, B); if (Z.D.some(x => x.k.length > 9)) continue;
      /* birçok dolgu dene: tek çözümlü olanı ya da en az kare vermeyi gerektireni seç */
      let A = null, top = null;
      for (let f = 0; f < 40; f++) { const A2 = doldur(N, B, Z, r); if (!A2) continue; const t2 = Z.D.map(x => x.k.reduce((a, i) => a + A2[i], 0)); const c = coz(N, B, Z, t2, new Array(N * N).fill(0), 60000);
        if (!A || (!c.asildi && c.say === 1)) { A = A2; top = t2; } if (!c.asildi && c.say === 1) break; }
      if (!A) continue;
      const ver = new Array(N * N).fill(0); let tamam = false;
      for (let t = 0; t < 30; t++) { const c = coz(N, B, Z, top, ver); if (c.asildi) break; if (c.say === 1) { tamam = true; break; }
        const [s1, s2] = c.sonuc, fark = []; for (let i = 0; i < N * N; i++) if (!B[i] && s1[i] !== s2[i]) fark.push(i); const i = fark[(r() * fark.length) | 0]; ver[i] = A[i]; }
      if (!tamam) continue;
      return { N, B, D: Z.D.map((x, n) => ({ ip: x.ip, yon: x.yon, k: x.k, t: top[n] })), A, ver };
    }
    return null;
  }
  return { uret, birlesim, KOMB, coz, diziler };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = KK; return; }
window.KK = KK;
})();
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame || !window.KK) return;
const KK = window.KK, BOY = { k: [6, 'Kolay'], o: [8, 'Orta'], z: [10, 'Zor'] };
const gun = () => window.Seri ? Seri.bugun() : Math.floor(Date.now() / 864e5);
function kapak() {
  let s = '<rect width="90" height="90" fill="#1f2937"/>'; const W = [[1, 1], [2, 1], [1, 2], [2, 2], [3, 2], [2, 3], [3, 3]], v = { '1,1': 9, '2,1': 7, '1,2': 8, '2,2': 2, '3,2': 1, '2,3': 4, '3,3': 3 };
  for (const [x, y] of W) s += `<rect x="${6 + x * 19}" y="${6 + y * 19}" width="18" height="18" rx="2" fill="#fff"/><text x="${15 + x * 19}" y="${20 + y * 19}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="12" fill="#1d4ed8">${v[x + ',' + y]}</text>`;
  s += `<path d="M6 25l18 18M25 6l18 18" stroke="#9ca3af" stroke-width="1"/><text x="20" y="22" font-family="Arial" font-size="8" fill="#fbbf24" font-weight="700">16</text><text x="9" y="40" font-family="Arial" font-size="8" fill="#fbbf24" font-weight="700">17</text>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const CSS = `
.kk-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.kk{width:min(520px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none}
.kk-ust{display:flex;gap:6px;align-items:center}.kk-sev{display:flex;gap:4px;flex:1;flex-wrap:wrap}.kk-sev button{padding:7px 10px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink-soft)}.kk-sev button.ak{background:var(--accent);color:#fff}
.kk-sure{font-weight:800;font-variant-numeric:tabular-nums;color:var(--ink-soft);font-size:14px}
.kk-t{display:grid;gap:2px;padding:2px;background:#374151;border-radius:10px;width:100%;aspect-ratio:1;align-self:center;box-sizing:border-box}
.kk-c{position:relative;background:#fff;border-radius:3px;display:grid;place-items:center;font-weight:800;color:#1d4ed8;cursor:pointer;font-family:Nunito,system-ui,sans-serif;overflow:hidden}
.kk-c.s{background:#4b5563;cursor:default;color:#fde68a}.kk-c.s.bos{background:#374151}
.kk-c.s svg{position:absolute;inset:0;width:100%;height:100%}.kk-c.s .a,.kk-c.s .d{position:absolute;font-size:.52em;font-weight:800;line-height:1}.kk-c.s .a{right:9%;top:9%}.kk-c.s .d{left:9%;bottom:9%}
.kk-c.v{color:#111827;background:#eef2f7;cursor:default}.kk-c.dz{background:#e0ecff}.kk-c.sec{background:#bfdbfe;box-shadow:inset 0 0 0 2.500px #2563eb}
.kk-c.hata{color:#dc2626}.kk-c.ok{animation:kkOk .5s}@keyframes kkOk{50%{background:#bbf7d0}}
.kk-c .n{position:absolute;inset:6%;display:grid;grid-template-columns:repeat(3,1fr);font-size:.34em;color:#64748b;font-weight:800;line-height:1}.kk-c .n span{display:grid;place-items:center}
.kk-yar{min-height:38px;font-size:12.5px;font-weight:700;color:var(--ink-soft);line-height:1.4;text-align:center}.kk-yar b{color:var(--ink)}
.kk-pad{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.kk-pad button{padding:11px 0;border-radius:11px;background:var(--bg2);font-weight:800;font-size:18px;color:var(--ink)}
.kk-pad button.not.ak{background:var(--accent);color:#fff}.kk-pad button.k{font-size:14px;background:var(--accent-soft);color:var(--accent-ink)}
.kk-son{display:flex;flex-direction:column;gap:9px;padding:14px;border-radius:16px;background:var(--card);box-shadow:0 0 0 2px var(--accent);text-align:center}.kk-son h3{margin:0;font-size:20px}.kk-son p{margin:0;font-weight:700;color:var(--ink-soft)}
.kk-son .sat{display:flex;gap:8px}.kk-son .sat button{flex:1;padding:11px;border-radius:12px;background:var(--accent);color:#fff;font-weight:800}.kk-son .sat button.ikinci{background:var(--accent-soft);color:var(--accent-ink)}
`;
registerGame({
  id: 'kakuro', title: 'Kakuro', category: 'Bulmaca', tags: 'kakuro toplam bulmaca sayı rakam mantık sudoku benzeri günlük', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Toplamlı bulmaca: beyaz karelere 1–9 yaz; her dizi ipucundaki toplamı versin, aynı dizide rakam tekrar etmesin. Olası rakamlar yardımcı satırda.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M3 3l6 6"/></svg>',
  shareText() { return this._paylas || 'Kakuro: toplamlı rakam bulmacası.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('kk-css')) { const s = document.createElement('style'); s.id = 'kk-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('kk-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, sev: 'k', no: { k: 0, o: 0, z: 0 }, en: {}, o: null, gunB: -1, ilk: 1 }, (api.loadState && api.loadState()) || {});
    let P = null, O = null, g = [], notlar = {}, sec = -1, notMod = false, gecmis = [], tm = 0, kT = 0, H = [], V = [];
    const kok = E('div', { class: 'kk' }); root.append(kok);
    kok.innerHTML = `<div class="kk-ust"><div class="kk-sev">${Object.keys(BOY).map(k => `<button data-sev="${k}">${BOY[k][1]}</button>`).join('')}<button data-sev="g">Günün</button></div><span class="kk-sure" id="kk-s">0:00</span></div>
      <div class="kk-t" id="kk-t"></div><div class="kk-yar" id="kk-y"></div>
      <div class="kk-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => `<button data-d="${x}">${x}</button>`).join('')}<button data-d="0" class="k">⌫</button><button class="k not" data-a="not">✎ Not</button><button class="k" data-a="geri">↶</button></div>
      <div style="display:flex;gap:7px"><button class="kk-pad-b" data-a="ipucu" style="flex:1;padding:10px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800">💡 İpucu</button><button data-a="yardim" style="flex:1;padding:10px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800">❓ Nasıl oynanır</button></div><div id="kk-son"></div>`;
    const q = s => kok.querySelector(s);
    const sure = () => { const t = O.t | 0; return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };
    function kaydet() { if (O && !O.bitti) { O.g = g.join(''); O.not = notlar; D.o = O; } else D.o = null; clearTimeout(kT); kT = setTimeout(() => { try { api.saveState && api.saveState(D); } catch (e) { } }, 400); }
    const tohum = (sev, tur, no) => tur === 'g' ? 733000 + GN * 41 : ({ k: 1, o: 2, z: 3 })[sev] * 900007 + no * 131;
    function ac(sev, tur, eski) {
      const no = tur === 'g' ? GN : (D.no[sev] || 0), N = tur === 'g' ? 8 : BOY[sev][0]; P = KK.uret(N, tohum(sev, tur, no)) || KK.uret(N, tohum(sev, tur, no) + 1);
      O = eski || { sev, tur, no, t: 0, ip: 0, gun: GN, bitti: 0 }; if (tur !== 'g') D.sev = sev;
      g = O.g && O.g.length === N * N ? [...O.g].map(Number) : P.ver.slice(); notlar = O.not || {}; sec = -1; gecmis = [];
      H = new Array(N * N).fill(-1); V = new Array(N * N).fill(-1); P.D.forEach((d, n) => d.k.forEach(i => { if (d.yon === 'y') H[i] = n; else V[i] = n; }));
      kok.querySelectorAll('[data-sev]').forEach(b => b.classList.toggle('ak', tur === 'g' ? b.dataset.sev === 'g' : b.dataset.sev === sev));
      const t = q('#kk-t'); t.style.gridTemplateColumns = t.style.gridTemplateRows = `repeat(${N},1fr)`; q('#kk-son').innerHTML = ''; boyut(); ciz(); kaydet();
      if (D.ilk) { D.ilk = 0; yardim(); }
    }
    function boyut() { const t = q('#kk-t'), ust = t.getBoundingClientRect().top, kalan = innerHeight - ust - 38 - 100 - 60, W = Math.max(250, Math.min(kok.clientWidth, kalan)); t.style.width = W + 'px'; t.style.fontSize = (W / P.N * .5) + 'px'; }
    function hatalar() {
      const X = new Set();
      for (const d of P.D) { const vs = d.k.map(i => g[i]).filter(Boolean), dolu = vs.length === d.k.length, top = vs.reduce((a, b) => a + b, 0);
        const sayac = {}; for (const i of d.k) if (g[i]) sayac[g[i]] = (sayac[g[i]] || 0) + 1; for (const i of d.k) if (g[i] && sayac[g[i]] > 1) X.add(i);
        if ((dolu && top !== d.t) || top > d.t) for (const i of d.k) if (g[i] && !P.ver[i]) X.add(i); }
      return X;
    }
    function ciz() {
      const N = P.N, X = hatalar(), dz = new Set(); if (sec >= 0) { for (const n of [H[sec], V[sec]]) if (n >= 0) P.D[n].k.forEach(i => dz.add(i)); }
      const ipY = {}, ipD = {}; P.D.forEach(d => { if (d.yon === 'y') ipY[d.ip] = d.t; else ipD[d.ip] = d.t; });
      let h = '';
      for (let i = 0; i < N * N; i++) {
        if (P.B[i]) { const a = ipY[i], d = ipD[i]; if (a == null && d == null) { h += '<div class="kk-c s bos"></div>'; continue; }
          h += `<div class="kk-c s"><svg viewBox="0 0 10 10" preserveAspectRatio="none"><path d="M0 0L10 10" stroke="#9ca3af" stroke-width=".25"/></svg>${a != null ? `<span class="a">${a}</span>` : ''}${d != null ? `<span class="d">${d}</span>` : ''}</div>`; continue; }
        const v = P.ver[i]; let ic = g[i] ? g[i] : '';
        if (!g[i] && notlar[i]) { ic = '<div class="n">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => `<span>${notlar[i] & (1 << (x - 1)) ? x : ''}</span>`).join('') + '</div>'; }
        h += `<div class="kk-c${v ? ' v' : ''}${dz.has(i) ? ' dz' : ''}${sec === i ? ' sec' : ''}${X.has(i) ? ' hata' : ''}" data-i="${i}">${ic}</div>`;
      }
      q('#kk-t').innerHTML = h; q('#kk-s').textContent = sure(); kok.querySelector('[data-a=not]').classList.toggle('ak', notMod);
      /* yardımcı: seçili karenin dizilerinde olası rakamlar */
      let y = '';
      if (sec >= 0) for (const n of [H[sec], V[sec]]) { if (n < 0) continue; const d = P.D[n], L = d.k.length, kul = d.k.filter(i => g[i]).map(i => g[i]);
        const K = (KK.KOMB[L * 100 + d.t] || []).filter(m => kul.every(x => m & (1 << (x - 1)))).slice(0, 4).map(m => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => m & (1 << (x - 1))).join('+'));
        y += `<div>${d.yon === 'y' ? '↔' : '↕'} <b>${d.t}</b> (${L} kare): ${K.length ? K.join(' · ') + ((KK.KOMB[L * 100 + d.t] || []).length > 4 ? ' …' : '') : '<b style="color:#dc2626">bu rakamlarla olmaz</b>'}</div>`; }
      q('#kk-y').innerHTML = y || 'Bir kareye dokun; olası rakam toplulukları burada çıkar.';
    }
    function yaz(d) {
      if (sec < 0 || O.bitti || P.ver[sec]) return; gecmis.push([sec, g[sec], notlar[sec] || 0]);
      if (notMod && d) { notlar[sec] = (notlar[sec] || 0) ^ (1 << (d - 1)); if (!notlar[sec]) delete notlar[sec]; g[sec] = 0; }
      else { g[sec] = g[sec] === d ? 0 : d; if (d) { delete notlar[sec]; for (const n of [H[sec], V[sec]]) if (n >= 0) for (const j of P.D[n].k) if (notlar[j]) { notlar[j] &= ~(1 << (d - 1)); if (!notlar[j]) delete notlar[j]; } } }
      ses('tap'); ciz(); denetle(); kaydet();
    }
    function denetle() {
      for (let i = 0; i < g.length; i++) if (!P.B[i] && !g[i]) return;
      if (!g.every((x, i) => P.B[i] || x === P.A[i])) { if (!hatalar().size) { /* toplamlar tutuyor ama farklı: yine de geçerli bir çözüm */ } else return; }
      if (hatalar().size) return; tamam();
    }
    function tamam() {
      O.bitti = 1; sec = -1; ciz(); ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      const anahtar = O.tur === 'g' ? 'g' : O.sev, rekor = !D.en[anahtar] || O.t < D.en[anahtar]; if (rekor) D.en[anahtar] = O.t | 0;
      if (O.tur === 'g') { if (window.Seri) Seri.kaydet('kakuro', GN, { ok: true, b: O.t < 300 ? 0 : O.t < 600 ? 1 : O.t < 1200 ? 2 : 3, min: true }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      else D.no[O.sev] = (D.no[O.sev] || 0) + 1;
      api.submitScore(Math.max(1, 3000 - (O.t | 0) - O.ip * 60));
      oyun._paylas = `Kakuro ${O.tur === 'g' ? '· günün bulmacası #' + (GN + 1) : P.N + '×' + P.N}: ${sure()}${O.ip ? ' · ' + O.ip + ' ipucu' : ''}\nerdevelop.com/oyunlar/#o/kakuro`;
      const s = q('#kk-son'); s.innerHTML = `<div class="kk-son"><h3>🎉 Çözdün!</h3><p>${O.tur === 'g' ? 'Günün bulmacası' : BOY[O.sev][1]} · ${sure()}${O.ip ? ' · ' + O.ip + ' ipucu' : ''}${rekor ? ' · 🏆 en iyi süren' : ''}</p>
        <div class="sat"><button data-a="sonraki">${O.tur === 'g' ? 'Serbest oyna' : 'Sonraki bulmaca'}</button><button class="ikinci" data-a="paylas">Paylaş</button></div></div>`;
      if (O.tur === 'g' && window.Seri) s.firstChild.appendChild(Seri.panel('kakuro', { etiketler: ['5 dk', '10 dk', '20 dk', '20+ dk'], xEtiket: null, baslik: 'Günün bulmacası', api }));
      D.o = null; try { api.saveState && api.saveState(D); } catch (e) { }
    }
    function ipucu() {
      if (O.bitti) return; let i = sec >= 0 && !P.ver[sec] && g[sec] !== P.A[sec] ? sec : -1;
      if (i < 0) { const L = []; for (let j = 0; j < g.length; j++) if (!P.B[j] && g[j] !== P.A[j]) L.push(j); if (!L.length) return; i = L[(Math.random() * L.length) | 0]; }
      gecmis.push([i, g[i], notlar[i] || 0]); g[i] = P.A[i]; delete notlar[i]; O.ip++; sec = i; ses('click'); ciz(); const e = q(`.kk-c[data-i="${i}"]`); if (e) e.classList.add('ok'); denetle(); kaydet();
    }
    function yardim() {
      const s = q('#kk-son'); s.innerHTML = `<div class="kk-son" style="text-align:left"><h3 style="text-align:center">Nasıl oynanır</h3>
        <p>• Koyu karelerdeki sayılar ipucudur: sağ üstteki sayı, sağındaki beyaz karelerin <b>toplamı</b>; sol alttaki, altındaki karelerin toplamıdır.</p>
        <p>• Beyaz karelere 1–9 yaz. Aynı dizide bir rakam <b>iki kez kullanılmaz</b>.</p>
        <p>• Bir kareye dokunduğunda altta o dizilere uyan rakam toplulukları yazar: ör. iki karede 17 yalnızca <b>8+9</b> olabilir. Oradan başla.</p>
        <p>• ✎ Not modunda küçük aday rakamlar yazabilirsin. Gri kareler baştan verilmiştir.</p>
        <div class="sat"><button data-a="kapat">Başla</button></div></div>`;
    }
    kok.addEventListener('click', e => {
      const c = e.target.closest('.kk-c'); if (c && c.dataset.i != null) { const i = +c.dataset.i; if (P.ver[i]) return; sec = sec === i ? -1 : i; ses('click'); return ciz(); }
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.sev) { const v = b.dataset.sev; if (v === 'g') ac(D.sev, 'g', D.o && D.o.tur === 'g' && D.o.gun === GN ? D.o : null); else ac(v, 's', D.o && D.o.tur !== 'g' && D.o.sev === v && D.o.no === (D.no[v] || 0) ? D.o : null); return; }
      if (b.dataset.d != null) return yaz(+b.dataset.d);
      const a = b.dataset.a;
      if (a === 'not') { notMod = !notMod; ciz(); } else if (a === 'geri') { const x = gecmis.pop(); if (!x || O.bitti) return; g[x[0]] = x[1]; if (x[2]) notlar[x[0]] = x[2]; else delete notlar[x[0]]; sec = x[0]; ciz(); kaydet(); }
      else if (a === 'ipucu') ipucu(); else if (a === 'yardim') yardim(); else if (a === 'kapat') q('#kk-son').innerHTML = '';
      else if (a === 'sonraki') ac(O.tur === 'g' ? D.sev : O.sev, 's', null);
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
    const tus = e => { if (!P || e.target.closest('input,textarea')) return; if (/^[1-9]$/.test(e.key)) yaz(+e.key); else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') yaz(0);
      else if (sec >= 0 && /^Arrow/.test(e.key)) { const N = P.N, dx = { ArrowLeft: -1, ArrowRight: 1 }[e.key] || 0, dy = { ArrowUp: -N, ArrowDown: N }[e.key] || 0; let j = sec; do { j += dx + dy; } while (j >= 0 && j < N * N && P.B[j]); if (j >= 0 && j < N * N && !P.B[j]) { sec = j; ciz(); } e.preventDefault(); } };
    addEventListener('keydown', tus);
    tm = setInterval(() => { if (O && !O.bitti && document.visibilityState === 'visible') { O.t++; q('#kk-s').textContent = sure(); if (O.t % 10 === 0) kaydet(); } }, 1000);
    const boyutla = () => { if (P) { boyut(); } }; addEventListener('resize', boyutla);
    api.onCleanup(() => { clearInterval(tm); removeEventListener('resize', boyutla); removeEventListener('keydown', tus); if (O && !O.bitti) { O.g = g.join(''); O.not = notlar; D.o = O; try { api.saveState && api.saveState(D); } catch (e) { } } root.classList.remove('kk-mount'); });
    const o = D.o; if (o && (o.tur === 'g' ? o.gun === GN : o.no === (D.no[o.sev] || 0))) ac(o.sev, o.tur, o); else if (D.gunB !== GN) ac(D.sev, 'g', null); else ac(D.sev, 's', null);
    if (/[?&]kktest/.test(location.search)) window.__kk = { P: () => P, O: () => O, g: () => g, yaz, sec: i => { sec = i; ciz(); } };
  }
});
})();
