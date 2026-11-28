/* Bir İşlem — altı sayı (beşi 1–9 arası, biri 25/50/75/100) ve üç basamaklı bir hedef. Dört işlemle hedefe ulaş ya da en çok yaklaş.
   Her sayı bir kez kullanılır; çıkarmada büyükten küçük çıkar, bölmede yalnız tam bölünme. Günün sorusu her gün herkese aynı ve kesin çözümü var. */
(function () {
'use strict';
const BI = (() => {
  const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  function birles(a, b, op) {
    if (op === '+') return a + b; if (op === '×') return a * b;
    if (op === '−') return a === b ? null : Math.max(a, b) - Math.min(a, b);
    if (op === '÷') { const [x, y] = a >= b ? [a, b] : [b, a]; return y > 0 && x % y === 0 ? x / y : null; }
    return null;
  }
  function coz(sayilar, hedef) {
    let en = { f: Infinity, v: 0, e: '' }; const gor = new Set();
    function ara(L) {
      for (const x of L) { const f = Math.abs(x.v - hedef); if (f < en.f || (f === en.f && x.e.length < en.e.length)) en = { f, v: x.v, e: x.e }; }
      if (en.f === 0 || L.length < 2) return; const k = L.map(x => x.v).sort((a, b) => a - b).join(','); if (gor.has(k)) return; gor.add(k);
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
        const a = L[i], b = L[j], R = L.filter((_, k2) => k2 !== i && k2 !== j), [b1, k1] = a.v >= b.v ? [a, b] : [b, a];
        const w = (x, m) => x.p < m ? `(${x.e})` : x.e;
        const S = [[a.v + b.v, `${w(a, 1)} + ${w(b, 1)}`, 1], [a.v * b.v, `${w(a, 2)} × ${w(b, 2)}`, 2]];
        if (a.v !== b.v) S.push([b1.v - k1.v, `${w(b1, 1)} − ${w(k1, 2)}`, 1]);
        if (k1.v > 1 && b1.v % k1.v === 0) S.push([b1.v / k1.v, `${w(b1, 2)} ÷ ${w(k1, 3)}`, 2]);
        for (const [v, e, p] of S) { if (v <= 0) continue; ara(R.concat({ v, e, p })); if (en.f === 0) return; }
      }
    }
    ara(sayilar.map(v => ({ v, e: String(v), p: 3 }))); return en;
  }
  function uret(tohum) {
    const r = rng(tohum);
    for (let d = 0; d < 200; d++) {
      const N = []; for (let i = 0; i < 5; i++) N.push(1 + ((r() * 9) | 0)); N.push([25, 50, 75, 100][(r() * 4) | 0]);
      const H = 101 + ((r() * 899) | 0);
      const iki = new Set(); for (let i = 0; i < 6; i++) { iki.add(N[i]); for (let j = 0; j < 6; j++) if (i !== j) ['+', '×', '−', '÷'].forEach(o => iki.add(birles(N[i], N[j], o))); }
      if (iki.has(H)) continue; const c = coz(N, H); if (c.f === 0) return { N, H, cozum: c.e };
    }
    return { N: [4, 7, 2, 9, 3, 100], H: 763, cozum: coz([4, 7, 2, 9, 3, 100], 763).e };
  }
  const yildiz = f => f === 0 ? 3 : f <= 5 ? 2 : f <= 10 ? 1 : 0;
  return { birles, coz, uret, yildiz };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = BI; return; }
if (!window.registerGame) return;
const gun = () => window.Seri ? Seri.bugun() : Math.floor(Date.now() / 864e5);
const CSS = `
.bi-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.bi{width:min(460px,100%);margin:0 auto;display:flex;flex-direction:column;gap:9px;-webkit-user-select:none;user-select:none}
.bi-ust{display:flex;gap:6px;align-items:center;font-weight:800;font-size:13px}.bi-ust .sp{flex:1}.bi-ust button{padding:7px 11px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink)}.bi-ust button.ak{background:var(--accent);color:#fff}
.bi-hedef{display:flex;align-items:center;justify-content:center;gap:14px;padding:12px;border-radius:18px;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff}
.bi-hedef small{font-weight:800;opacity:.85;font-size:12.5px;line-height:1.3}.bi-hedef b{font-size:46px;font-weight:900;letter-spacing:.04em;font-variant-numeric:tabular-nums;background:rgba(0,0,0,.18);padding:2px 16px;border-radius:12px}
.bi-durum{text-align:center;font-weight:800;font-size:13.5px;color:var(--ink-soft);min-height:19px}.bi-durum b{color:var(--ink)}
.bi-taslar{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.bi-tas{padding:15px 4px;border-radius:14px;background:var(--card);box-shadow:0 0 0 2px #99f6e4 inset,0 2px 5px rgba(0,0,0,.08);font-size:27px;font-weight:900;color:var(--ink);font-variant-numeric:tabular-nums}
.bi-tas.buyuk{box-shadow:0 0 0 2px #5eead4 inset;color:#0f766e}.bi-tas.yeni{background:#f0fdfa;animation:biY .35s}@keyframes biY{from{transform:scale(.6)}}
.bi-tas.sec{background:#14b8a6;color:#fff;box-shadow:0 4px 12px rgba(20,184,166,.4);transform:translateY(-2px)}.bi-tas.bos{visibility:hidden}
.bi-op{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.bi-op button{padding:12px 0;border-radius:13px;background:#ccfbf1;color:#115e59;font-size:26px;font-weight:900}.bi-op button.sec{background:#0f766e;color:#fff}
.bi-log{display:flex;flex-direction:column;gap:3px;font-weight:800;font-size:14px;color:var(--ink-soft);text-align:center;min-height:22px}.bi-log b{color:var(--ink)}
.bi-alt{display:flex;gap:7px}.bi-alt button{flex:1;padding:11px 4px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14px}.bi-alt button.ana{background:var(--accent);color:#fff}.bi-alt button:disabled{opacity:.4}
.bi-son{display:flex;flex-direction:column;gap:9px;padding:14px;border-radius:16px;background:var(--card);box-shadow:0 0 0 2px #14b8a6;text-align:center}.bi-son h3{margin:0;font-size:21px}.bi-son p{margin:0;font-weight:700;color:var(--ink-soft);font-size:13.5px}
.bi-son .cz{font-weight:900;color:var(--ink);font-size:15px;background:var(--bg2);border-radius:10px;padding:7px}.bi-son .sat{display:flex;gap:8px}.bi-son .sat button{flex:1;padding:11px;border-radius:12px;background:#0f766e;color:#fff;font-weight:800}.bi-son .sat button.ikinci{background:var(--accent-soft);color:var(--accent-ink)}
`;
registerGame({
  id: 'birislem', title: 'Bir İşlem', category: 'Bulmaca', tags: 'bir işlem bir kelime bir işlem sayı bulmacası matematik dört işlem hedef sayı günlük', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Altı sayı ve dört işlemle hedef sayıya ulaş. Her gün yeni bir soru, kesin çözümü olan günün sorusu, yıldızlar ve seri.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#0f766e"/><rect x="18" y="10" width="54" height="26" rx="6" fill="#134e4a"/><text x="45" y="30" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="20" fill="#fff">763</text><g font-family="Arial,sans-serif" font-weight="900" font-size="12" text-anchor="middle" fill="#0f766e">' + [[8, 4], [36, 7], [64, 100]].map(([x, n], i) => `<rect x="${x}" y="44" width="20" height="17" rx="4" fill="#ccfbf1"/><text x="${x + 10}" y="57">${n}</text>`).join('') + '</g><g font-family="Arial,sans-serif" font-weight="900" font-size="15" text-anchor="middle" fill="#ccfbf1"><text x="17" y="80">+</text><text x="36" y="80">−</text><text x="55" y="80">×</text><text x="73" y="80">÷</text></g></svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 8h4M9 6v4M13 8h4M7 16l3-3M7 13l3 3M13 15h4M15 13v0M15 17v0"/></svg>',
  shareText() { return this._paylas || 'Bir İşlem: altı sayıyla hedefe ulaş.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('bi-css')) { const s = document.createElement('style'); s.id = 'bi-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('bi-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, coz: 0, oyn: 0, gunB: -1, gunO: null, sv: 0 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'bi' }); root.append(kok);
    let P = null, T = [], log = [], gecmis = [], sec = -1, op = '', bitti = false, gunluk = true, bas = 0, saatT = 0, en = null;
    const q = s => kok.querySelector(s);
    kok.innerHTML = `<div class="bi-ust"><button data-a="gunun">📅 Günün sorusu</button><button data-a="serbest">🎲 Serbest</button><span class="sp"></span><span id="bi-saat">0:00</span></div>
      <div class="bi-hedef"><small>HEDEF</small><b id="bi-h">000</b><small id="bi-alt"></small></div><div class="bi-durum" id="bi-d"></div>
      <div class="bi-taslar" id="bi-t"></div><div class="bi-op">${['+', '−', '×', '÷'].map(o => `<button data-op="${o}">${o}</button>`).join('')}</div>
      <div class="bi-log" id="bi-l"></div><div class="bi-alt"><button data-a="geri">↶ Geri al</button><button data-a="bastan">⟲ Baştan</button><button class="ana" data-a="bitir">✓ Bitir</button></div><div id="bi-son"></div>`;
    function ac(g) {
      gunluk = g; const tohum = g ? 7300 + GN * 31 : 99000 + D.sv * 13 + ((Math.random() * 1e6) | 0);
      P = BI.uret(tohum); T = P.N.map((v, i) => ({ v, id: i, b: v >= 25 })); log = []; gecmis = []; sec = -1; op = ''; bitti = false; en = null; bas = Date.now(); q('#bi-son').innerHTML = '';
      if (g && D.gunO && D.gunO.g === GN) { bitti = true; en = { v: D.gunO.v, f: D.gunO.f }; log = D.gunO.log || []; T = []; }
      enGuncelle(); ciz(); saat(); if (g && D.gunO && D.gunO.g === GN) sonGoster(true);
    }
    function saat() { clearTimeout(saatT); const x = q('#bi-saat'); if (!x) return; if (!bitti) { const s = Math.floor((Date.now() - bas) / 1000); x.textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; saatT = setTimeout(saat, 500); } }
    function enGuncelle() { for (const t of T) { const f = Math.abs(t.v - P.H); if (!en || f < en.f) en = { v: t.v, f }; } }
    function ciz(yeniId) {
      q('#bi-h').textContent = P.H; q('#bi-alt').innerHTML = gunluk ? `Günün<br>sorusu #${GN + 1}` : `Serbest<br>${D.coz} çözüm`;
      q('[data-a=gunun]').classList.toggle('ak', gunluk); q('[data-a=serbest]').classList.toggle('ak', !gunluk);
      q('#bi-d').innerHTML = bitti ? '' : en ? (en.f === 0 ? '🎯 Tam isabet!' : `En yakın: <b>${en.v}</b> (fark ${en.f})`) : 'İki sayı ve bir işlem seç.';
      const dolu = T.slice(); while (dolu.length < 6 && !bitti && T.length) dolu.push(null);
      q('#bi-t').innerHTML = dolu.map((t, i) => t ? `<button class="bi-tas${t.b ? ' buyuk' : ''}${sec === i ? ' sec' : ''}${t.id === yeniId ? ' yeni' : ''}" data-i="${i}">${t.v}</button>` : '<span class="bi-tas bos"></span>').join('');
      kok.querySelectorAll('[data-op]').forEach(b => { b.classList.toggle('sec', b.dataset.op === op); b.disabled = bitti; });
      q('#bi-l').innerHTML = log.map(x => `<span>${x}</span>`).join('');
      q('[data-a=geri]').disabled = bitti || !gecmis.length; q('[data-a=bastan]').disabled = bitti || !gecmis.length; q('[data-a=bitir]').disabled = bitti;
    }
    function tasDokun(i) {
      if (bitti) return;
      if (sec < 0 || !op) { sec = sec === i ? -1 : i; ses('click'); return ciz(); }
      if (sec === i) { sec = -1; op = ''; return ciz(); }
      const a = T[sec], b = T[i], v = BI.birles(a.v, b.v, op);
      if (v == null || v <= 0) { ses('bad'); q('#bi-d').innerHTML = op === '÷' ? '⚠️ Tam bölünmüyor.' : '⚠️ Sonuç sıfır olamaz.'; return; }
      const [x, y] = (op === '−' || op === '÷') && a.v < b.v ? [b.v, a.v] : [a.v, b.v];
      gecmis.push({ T: T.slice(), log: log.slice() });
      const yeni = { v, id: 100 + gecmis.length, b: false }, R = T.filter((_, k) => k !== sec && k !== i); R.splice(Math.min(sec, i), 0, yeni); T = R;
      log.push(`${x} ${op} ${y} = <b>${v}</b>`); sec = -1; op = ''; ses('tap'); enGuncelle(); ciz(yeni.id);
      if (v === P.H) setTimeout(() => bitir(), 450); else if (T.length === 1) setTimeout(() => bitir(), 500);
    }
    function bitir() {
      if (bitti) return; bitti = true; sec = -1; op = ''; clearTimeout(saatT); const sure = Math.round((Date.now() - bas) / 1000), y = BI.yildiz(en ? en.f : 999);
      if (gunluk) { if (window.Seri) Seri.kaydet('birislem', GN, { ok: en.f === 0, b: y }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } D.gunO = { g: GN, v: en.v, f: en.f, s: sure, log }; }
      else { D.sv++; if (en.f === 0) D.coz++; }
      D.oyn++; if (en.f === 0) api.submitScore(D.coz + (gunluk ? 1 : 0)); kaydet(); ses(en.f === 0 ? 'win' : y ? 'score' : 'lose');
      if (en.f === 0) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } }
      try { window.Progress && Progress.olay(en.f === 0 ? 'bi_tam' : 'bi_oyn'); } catch (e) { }
      sonGoster(false, sure);
    }
    function sonGoster(eski, sure) {
      const f = en.f, y = BI.yildiz(f), s = sure != null ? sure : (D.gunO && D.gunO.s) || 0, zm = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      oyun._paylas = `Bir İşlem${gunluk ? ' #' + (GN + 1) : ''}: ${P.H} → ${f === 0 ? 'tam isabet 🎯' : en.v + ' (fark ' + f + ')'} ${'⭐'.repeat(y)}${gunluk && f === 0 ? ' · ' + zm : ''}\nerdevelop.com/oyunlar/#o/birislem`;
      const k = q('#bi-son'); k.innerHTML = `<div class="bi-son"><h3>${f === 0 ? '🎯 Tam isabet!' : y ? `${en.v}: ${f} fark` : `${en.v}: hedeften ${f} uzakta`} ${'⭐'.repeat(y)}</h3>
        <p>${eski ? 'Bugünün sorusunu çözdün. ' : ''}${gunluk ? `Süre ${zm}. Yarın yeni soru.` : `Serbest modda ${D.coz} tam çözüm.`}</p>
        ${f ? `<p>Olası çözüm:</p><div class="cz">${P.cozum} = ${P.H}</div>` : `<p>Bizim çözüm:</p><div class="cz">${P.cozum} = ${P.H}</div>`}
        <div class="sat"><button data-a="${gunluk ? 'serbest' : 'yeni'}">${gunluk ? '🎲 Serbest moda geç' : 'Yeni soru'}</button><button class="ikinci" data-a="paylas">Paylaş</button></div></div>`;
      if (gunluk && window.Seri) k.firstChild.appendChild(Seri.panel('birislem', { etiketler: ['0 ⭐', '1 ⭐', '2 ⭐', '3 ⭐'], baslik: 'Günün sorusu', api }));
      ciz();
    }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.i != null) return tasDokun(+b.dataset.i);
      if (b.dataset.op) { if (bitti) return; op = op === b.dataset.op ? '' : b.dataset.op; ses('click'); if (sec < 0) q('#bi-d').innerHTML = 'Önce bir sayı seç, sonra işlemi, sonra ikinci sayıyı.'; return ciz(); }
      const a = b.dataset.a;
      if (a === 'geri') { const g = gecmis.pop(); if (g) { T = g.T; log = g.log; sec = -1; op = ''; ciz(); } }
      else if (a === 'bastan') { if (gecmis.length) { T = gecmis[0].T; log = []; gecmis = []; sec = -1; op = ''; ciz(); } }
      else if (a === 'bitir') bitir();
      else if (a === 'gunun') ac(true); else if (a === 'serbest' || a === 'yeni') ac(false);
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
    api.onCleanup(() => { clearTimeout(saatT); root.classList.remove('bi-mount'); });
    ac(D.gunB !== GN || !D.gunO || D.gunO.g !== GN);
    if (/[?&]bitest/.test(location.search)) window.__bi = { P: () => P, T: () => T, tasDokun, BI };
  }
});
})();
