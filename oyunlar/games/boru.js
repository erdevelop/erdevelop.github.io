/* Boru Bağla — borulara dokunup döndür, ortadaki pompadan çıkan suyu bütün evlere ulaştır. Ağ tek parça olmalı, açıkta boru ucu kalmamalı.
   Bulmacalar rastgele kapsayan ağaçtan üretilir (her zaman çözülebilir); uzun basınca boru kilitlenir. */
(function () {
'use strict';
const BOY = { k: [5, 'Kolay'], o: [7, 'Orta'], z: [9, 'Zor'] }, U = 1, R = 2, A = 4, L = 8;
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const gun = () => window.Seri ? Seri.bugun() : Math.floor(Date.now() / 864e5);
const cevir = (m, k) => { k = ((k % 4) + 4) % 4; for (let i = 0; i < k; i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
const bitSay = m => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);
function uret(n, tohum) {
  const r = rng(tohum), M = new Array(n * n).fill(0), ic = new Set(), mrk = (n >> 1) * n + (n >> 1), sinir = [];
  const komsu = i => { const y = (i / n) | 0, x = i % n, K = []; if (y > 0) K.push([i - n, U, A]); if (x < n - 1) K.push([i + 1, R, L]); if (y < n - 1) K.push([i + n, A, U]); if (x > 0) K.push([i - 1, L, R]); return K; };
  ic.add(mrk); for (const k of komsu(mrk)) sinir.push([mrk, ...k]);
  while (ic.size < n * n) {
    /* dörtlü kavşakları azalt: dolu karelerden çıkan kenarlara düşük olasılık */
    let s; for (let d = 0; d < 6; d++) { const j = (r() * sinir.length) | 0; s = sinir[j]; if (bitSay(M[s[0]]) < 3 || r() < .25) { sinir.splice(j, 1); break; } if (d === 5) sinir.splice(j, 1); }
    const [a, b, ab, ba] = s; if (ic.has(b)) continue; M[a] |= ab; M[b] |= ba; ic.add(b);
    for (const k of komsu(b)) if (!ic.has(k[0])) sinir.push([b, ...k]);
  }
  const rot = M.map(m => { const sim = m === 5 || m === 10 ? 2 : m === 15 ? 1 : 4; return (r() * sim) | 0 ? ((r() * 3) | 0) + 1 : 0; });
  if (rot.every((x, i) => cevir(M[i], x) === M[i])) rot[0] = 1;
  const enAz = M.reduce((t, m, i) => { const c = cevir(m, rot[i]); for (let k = 0; k < 4; k++) if (cevir(c, k) === m) return t + k; return t; }, 0);
  return { n, M, rot, mrk, enAz };
}
function ag(n, C, mrk) {   /* pompadan suyun ulaştığı kareler ve açık uç var mı */
  const gor = new Set([mrk]), yig = [mrk]; let acik = false;
  while (yig.length) { const i = yig.pop(), m = C[i], y = (i / n) | 0, x = i % n;
    for (const [b, j, karsi, ok] of [[U, i - n, A, y > 0], [R, i + 1, L, x < n - 1], [A, i + n, U, y < n - 1], [L, i - 1, R, x > 0]]) { if (!(m & b)) continue; if (!ok || !(C[j] & karsi)) { acik = true; continue; } if (!gor.has(j)) { gor.add(j); yig.push(j); } } }
  for (let i = 0; i < C.length; i++) { const m = C[i], y = (i / n) | 0, x = i % n; for (const [b, j, karsi, ok] of [[U, i - n, A, y > 0], [R, i + 1, L, x < n - 1], [A, i + n, U, y < n - 1], [L, i - 1, R, x > 0]]) if ((m & b) && (!ok || !(C[j] & karsi))) acik = true; }
  return { gor, tamam: gor.size === C.length && !acik };
}
function kapak() {
  let s = '<rect width="90" height="90" fill="#0f2a3d"/>'; const P = [[45, 45, 45, 10], [45, 45, 80, 45], [45, 45, 45, 80], [10, 45, 45, 45], [45, 10, 80, 10], [80, 45, 80, 80]];
  for (const [a, b, c, d] of P) s += `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#38bdf8" stroke-width="9" stroke-linecap="round"/>`;
  s += '<circle cx="45" cy="45" r="11" fill="#f59e0b" stroke="#fde68a" stroke-width="3"/><rect x="73" y="73" width="14" height="12" rx="2" fill="#fde68a"/><path d="M71 75l9-8 9 8z" fill="#ef4444"/><rect x="3" y="38" width="12" height="11" rx="2" fill="#fde68a"/><path d="M1 40l8-7 8 7z" fill="#ef4444"/>';
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const CSS = `
.br-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.br{width:min(520px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none}
.br-ust{display:flex;gap:6px;align-items:center}.br-sev{display:flex;gap:4px;flex:1;flex-wrap:wrap}.br-sev button{padding:7px 10px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink-soft)}.br-sev button.ak{background:var(--accent);color:#fff}
.br-bil{font-weight:800;font-variant-numeric:tabular-nums;color:var(--ink-soft);font-size:13.5px;text-align:right;line-height:1.25}
.br-t{display:grid;gap:2px;padding:6px;background:#0f2a3d;border-radius:14px;width:100%;aspect-ratio:1;align-self:center;box-sizing:border-box;touch-action:manipulation}
.br-c{position:relative;background:#16384f;border-radius:6px;cursor:pointer;overflow:hidden}.br-c.kilit{background:#26516f;box-shadow:inset 0 0 0 2px #7dd3fc}
.br-c svg{position:absolute;inset:0;width:100%;height:100%;transition:transform .16s ease}.br-c svg.ust{transition:none;pointer-events:none}
.br-c .boru{stroke:#5b7a90;stroke-width:22;stroke-linecap:round;transition:stroke .2s}.br-c.su .boru{stroke:#38bdf8}
.br-c .ev{fill:#56707f;transition:fill .2s}.br-c.su .ev{fill:#fde68a}.br-c .cati{fill:#3e5563}.br-c.su .cati{fill:#ef4444}
.br-c .pompa{fill:#f59e0b;stroke:#fde68a;stroke-width:6}
.br-t.bitti .br-c.su .boru{animation:brAk 1.2s infinite}@keyframes brAk{50%{stroke:#7dd3fc}}
.br-alt{display:flex;gap:7px}.br-alt button{flex:1;padding:10px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14px}
.br-ipucu{font-size:12.5px;font-weight:700;color:var(--ink-soft);text-align:center}
.br-son{display:flex;flex-direction:column;gap:9px;padding:14px;border-radius:16px;background:var(--card);box-shadow:0 0 0 2px var(--accent);text-align:center}.br-son h3{margin:0;font-size:20px}.br-son p{margin:0;font-weight:700;color:var(--ink-soft)}
.br-son .sat{display:flex;gap:8px}.br-son .sat button{flex:1;padding:11px;border-radius:12px;background:var(--accent);color:#fff;font-weight:800}.br-son .sat button.ikinci{background:var(--accent-soft);color:var(--accent-ink)}
`;
function svgKare(m, pompa) {
  let s = ''; const C = 50;
  if (m & U) s += `<line class="boru" x1="${C}" y1="${C}" x2="${C}" y2="-4"/>`; if (m & R) s += `<line class="boru" x1="${C}" y1="${C}" x2="104" y2="${C}"/>`;
  if (m & A) s += `<line class="boru" x1="${C}" y1="${C}" x2="${C}" y2="104"/>`; if (m & L) s += `<line class="boru" x1="${C}" y1="${C}" x2="-4" y2="${C}"/>`;
  let ust = '';   /* ev ve pompa dönmez */
  if (pompa) ust = '<circle class="pompa" cx="50" cy="50" r="24"/><path d="M50 36c6 8 9 12 9 16a9 9 0 0 1-18 0c0-4 3-8 9-16z" fill="#fff"/>';
  else if (bitSay(m) === 1) ust = '<rect class="ev" x="30" y="42" width="40" height="30" rx="4"/><path class="cati" d="M24 46L50 24l26 22z"/><rect x="45" y="56" width="10" height="16" rx="1.500" fill="#16384f" opacity=".5"/>';
  else s += '<circle class="boru" cx="50" cy="50" r="2"/>';
  return `<svg viewBox="0 0 100 100">${s}</svg>${ust ? `<svg viewBox="0 0 100 100" class="ust">${ust}</svg>` : ''}`;
}
registerGame({
  id: 'boru', title: 'Boru Bağla', category: 'Bulmaca', tags: 'boru bağla su tesisat döndür bağlantı bulmaca mantık günlük', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Borulara dokunup döndür; ortadaki pompanın suyunu bütün evlere ulaştır, açıkta boru ucu kalmasın. Kolay, orta, zor ve günün bulmacası.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"><path d="M12 3v9h9M12 12v9M3 12h4"/><circle cx="12" cy="12" r="2.500" fill="currentColor"/></svg>',
  shareText() { return this._paylas || 'Boru Bağla: suyu bütün evlere ulaştır.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('br-css')) { const s = document.createElement('style'); s.id = 'br-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('br-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, sev: 'k', no: { k: 0, o: 0, z: 0 }, en: {}, o: null, gunB: -1 }, (api.loadState && api.loadState()) || {});
    let P = null, O = null, tm = 0, kT = 0, basT = 0, uzun = false;
    const kok = E('div', { class: 'br' }); root.append(kok);
    kok.innerHTML = `<div class="br-ust"><div class="br-sev">${Object.keys(BOY).map(k => `<button data-sev="${k}">${BOY[k][1]}</button>`).join('')}<button data-sev="g">Günün</button></div><span class="br-bil" id="br-b"></span></div>
      <div class="br-t" id="br-t"></div><div class="br-ipucu">Dokun: döndür · Uzun bas: kilitle</div>
      <div class="br-alt"><button data-a="ipucu">💡 İpucu</button><button data-a="bastan">↺ Baştan</button><button data-a="yeni">↻ Yeni</button></div><div id="br-son"></div>`;
    const q = s => kok.querySelector(s);
    const sure = () => { const t = O.t | 0; return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };
    const C = () => P.M.map((m, i) => cevir(m, O.r[i]));
    function kaydet() { D.o = O && !O.bitti ? O : null; clearTimeout(kT); kT = setTimeout(() => { try { api.saveState && api.saveState(D); } catch (e) { } }, 400); }
    const tohum = (sev, tur, no) => tur === 'g' ? 611000 + GN * 29 : ({ k: 1, o: 2, z: 3 })[sev] * 700001 + no * 173;
    function ac(sev, tur, eski) {
      const no = tur === 'g' ? GN : (D.no[sev] || 0), n = tur === 'g' ? 7 : BOY[sev][0]; P = uret(n, tohum(sev, tur, no));
      O = eski || { sev, tur, no, t: 0, h: 0, ip: 0, gun: GN, bitti: 0, r: P.rot.slice(), d: P.rot.map(x => x * 90), k: [] }; if (tur !== 'g') D.sev = sev;
      kok.querySelectorAll('[data-sev]').forEach(b => b.classList.toggle('ak', tur === 'g' ? b.dataset.sev === 'g' : b.dataset.sev === sev));
      const t = q('#br-t'); t.style.gridTemplateColumns = t.style.gridTemplateRows = `repeat(${n},1fr)`; t.classList.remove('bitti');
      t.innerHTML = P.M.map((m, i) => `<div class="br-c" data-i="${i}">${svgKare(m, i === P.mrk)}</div>`).join('');
      q('#br-son').innerHTML = ''; boyut(); ciz(); kaydet();
    }
    function boyut() { const t = q('#br-t'), ust = t.getBoundingClientRect().top, kalan = innerHeight - ust - 110; t.style.width = Math.max(250, Math.min(kok.clientWidth, kalan)) + 'px'; }
    function ciz() {
      const c = C(), a = ag(P.n, c, P.mrk);
      q('#br-t').querySelectorAll('.br-c').forEach(e => { const i = +e.dataset.i; e.classList.toggle('su', a.gor.has(i)); e.classList.toggle('kilit', O.k.includes(i)); e.firstElementChild.style.transform = `rotate(${O.d[i]}deg)`; });
      q('#br-b').innerHTML = `${O.tur === 'g' ? 'Günün · ' : ''}${O.h} hamle<br>${sure()}`;
      return a;
    }
    function dondur(i) {
      if (O.bitti || O.k.includes(i) || i === undefined) return; const m = P.M[i]; if (m === 15) return;
      O.r[i] = (O.r[i] + 1) % 4; O.d[i] += 90; O.h++; ses('tap'); const a = ciz();
      if (a.tamam) tamam(); kaydet();
    }
    function tamam() {
      O.bitti = 1; q('#br-t').classList.add('bitti'); ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      const anahtar = O.tur === 'g' ? 'g' : O.sev, rekor = !D.en[anahtar] || O.h < D.en[anahtar]; if (rekor) D.en[anahtar] = O.h;
      if (O.tur === 'g') { if (window.Seri) Seri.kaydet('boru', GN, { ok: true, b: O.h <= P.enAz + 2 ? 0 : O.h <= P.enAz * 1.5 ? 1 : O.h <= P.enAz * 2 ? 2 : 3, min: true }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      else D.no[O.sev] = (D.no[O.sev] || 0) + 1;
      api.submitScore(Math.max(1, 1000 - O.h * 5 - (O.t | 0) - O.ip * 50));
      oyun._paylas = `Boru Bağla ${O.tur === 'g' ? '· günün bulmacası #' + (GN + 1) : P.n + '×' + P.n}: ${O.h} hamle (en az ${P.enAz}), ${sure()}\nerdevelop.com/oyunlar/#o/boru`;
      const s = q('#br-son'); s.innerHTML = `<div class="br-son"><h3>💧 Su her eve ulaştı!</h3><p>${O.h} hamle · en az ${P.enAz} · ${sure()}${O.ip ? ' · ' + O.ip + ' ipucu' : ''}${rekor ? ' · 🏆 en iyi' : ''}</p>
        <div class="sat"><button data-a="sonraki">${O.tur === 'g' ? 'Serbest oyna' : 'Sonraki bulmaca'}</button><button class="ikinci" data-a="paylas">Paylaş</button></div></div>`;
      if (O.tur === 'g' && window.Seri) s.firstChild.appendChild(Seri.panel('boru', { etiketler: ['Kusursuz', 'İyi', 'Orta', 'Uzun'], xEtiket: null, baslik: 'Günün bulmacası', api }));
      D.o = null; try { api.saveState && api.saveState(D); } catch (e) { }
    }
    function ipucu() {   /* yanlış duran bir boruyu doğru yöne çevirip kilitle */
      if (O.bitti) return; const L = []; for (let i = 0; i < P.M.length; i++) if (cevir(P.M[i], O.r[i]) !== P.M[i] && !O.k.includes(i)) L.push(i); if (!L.length) return;
      const i = L[(Math.random() * L.length) | 0]; let k = 0; while (cevir(P.M[i], O.r[i] + k) !== P.M[i]) k++; O.r[i] = (O.r[i] + k) % 4; O.d[i] += k * 90; O.k.push(i); O.ip++; ses('click'); const a = ciz(); if (a.tamam) tamam(); kaydet();
    }
    const T = q('#br-t');
    T.addEventListener('pointerdown', e => { const c = e.target.closest('.br-c'); if (!c) return; uzun = false; clearTimeout(basT); basT = setTimeout(() => { uzun = true; const i = +c.dataset.i; const j = O.k.indexOf(i); if (j >= 0) O.k.splice(j, 1); else O.k.push(i); ses('click'); try { navigator.vibrate && navigator.vibrate(20); } catch (x) { } ciz(); kaydet(); }, 450); });
    T.addEventListener('pointerup', e => { clearTimeout(basT); const c = e.target.closest('.br-c'); if (!c || uzun) return; dondur(+c.dataset.i); });
    T.addEventListener('pointercancel', () => clearTimeout(basT)); T.addEventListener('contextmenu', e => e.preventDefault());
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.sev) { const v = b.dataset.sev; if (v === 'g') ac(D.sev, 'g', D.o && D.o.tur === 'g' && D.o.gun === GN ? D.o : null); else ac(v, 's', D.o && D.o.tur !== 'g' && D.o.sev === v && D.o.no === (D.no[v] || 0) ? D.o : null); return; }
      const a = b.dataset.a; if (a === 'ipucu') ipucu(); else if (a === 'bastan') { if (O.bitti) return; O.r = P.rot.slice(); O.d = O.d.map((d, i) => d + ((P.rot[i] - (d / 90)) % 4 + 4) % 4 * 90); O.k = []; ciz(); kaydet(); }
      else if (a === 'yeni') { if (O.tur !== 'g') { D.no[O.sev] = (D.no[O.sev] || 0) + 1; ac(O.sev, 's', null); } else ac(D.sev, 's', null); } else if (a === 'sonraki') ac(O.tur === 'g' ? D.sev : O.sev, 's', null);
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
    tm = setInterval(() => { if (O && !O.bitti && document.visibilityState === 'visible') { O.t++; q('#br-b').innerHTML = `${O.tur === 'g' ? 'Günün · ' : ''}${O.h} hamle<br>${sure()}`; if (O.t % 10 === 0) kaydet(); } }, 1000);
    const boyutla = () => { if (P) boyut(); }; addEventListener('resize', boyutla);
    api.onCleanup(() => { clearInterval(tm); clearTimeout(basT); removeEventListener('resize', boyutla); if (O && !O.bitti) { D.o = O; try { api.saveState && api.saveState(D); } catch (e) { } } root.classList.remove('br-mount'); });
    const o = D.o; if (o && (o.tur === 'g' ? o.gun === GN : o.no === (D.no[o.sev] || 0))) ac(o.sev, o.tur, o); else if (D.gunB !== GN) ac(D.sev, 'g', null); else ac(D.sev, 's', null);
    if (/[?&]brtest/.test(location.search)) window.__br = { P: () => P, O: () => O, dondur, cevir, ag };
  }
});
})();
