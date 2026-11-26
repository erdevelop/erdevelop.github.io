/* Nonogram (kare karalamaca) — sayılara bakarak gizli deseni boya. Her bulmaca yalnızca mantıkla, tek biçimde çözülür
   (üretimde satır çözücüyle sınanır). Boylar 5/8/10/12, her boyda sırayla ilerleyen bulmacalar ve günün bulmacası. */
(function () {
const BOY = [5, 8, 10, 12];
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const gun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
const ipuclari = L => { const o = []; let k = 0; for (const v of L) { if (v === 1) k++; else if (k) { o.push(k); k = 0; } } if (k) o.push(k); return o; };
/* bir satır: bilinenlerle uyumlu bütün yerleşimlerin ortak kareleri. dizi: 0 bilinmiyor, 1 dolu, 2 boş. Çelişkide null */
function satirCoz(ip, L) {
  const n = L.length, dolu = new Uint8Array(n), bos = new Uint8Array(n), cur = new Uint8Array(n); let say = 0;
  const kalan = ip.map((_, i) => ip.slice(i).reduce((a, b) => a + b, 0) + ip.length - i - 1);
  (function yer(k, bas) {
    if (k === ip.length) { for (let i = bas; i < n; i++) if (L[i] === 1) return; say++; for (let i = 0; i < n; i++) { if (cur[i]) dolu[i] = 1; else bos[i] = 1; } return; }
    for (let s = bas; s + kalan[k] <= n; s++) {
      if (s > bas && L[s - 1] === 1) return;   /* atlanan kare dolu olamaz */
      let ok = true; for (let i = s; i < s + ip[k]; i++) if (L[i] === 2) { ok = false; break; }
      if (ok && (s + ip[k] === n || L[s + ip[k]] !== 1)) { for (let i = s; i < s + ip[k]; i++) cur[i] = 1; yer(k + 1, s + ip[k] + 1); for (let i = s; i < s + ip[k]; i++) cur[i] = 0; }
    }
  })(0, 0);
  if (!say) return null; return Array.from(L, (v, i) => v ? v : dolu[i] && !bos[i] ? 1 : bos[i] && !dolu[i] ? 2 : 0);
}
function coz(n, SI, KI, G0) {   /* tam satır çözücü; G: n*n. döner {g, tam} */
  const g = G0 ? G0.slice() : new Array(n * n).fill(0);
  for (let tur = 0; tur < 60; tur++) { let deg = false;
    for (let r = 0; r < n; r++) { const L = g.slice(r * n, r * n + n), y = satirCoz(SI[r], L); if (!y) return { g, tam: false, celiski: true }; y.forEach((v, c) => { if (v !== L[c]) { g[r * n + c] = v; deg = true; } }); }
    for (let c = 0; c < n; c++) { const L = []; for (let r = 0; r < n; r++) L.push(g[r * n + c]); const y = satirCoz(KI[c], L); if (!y) return { g, tam: false, celiski: true }; y.forEach((v, r) => { if (v !== L[r]) { g[r * n + c] = v; deg = true; } }); }
    if (!deg) break; }
  return { g, tam: g.every(v => v) };
}
function uret(n, tohum) {
  for (let d = 0; d < 400; d++) {
    const r = rng(tohum + d * 7919), simetri = r() < .55, yog = .48 + r() * .16; let a = new Array(n * n).fill(0);
    for (let i = 0; i < n * n; i++) a[i] = r() < yog ? 1 : 0;
    if (n > 5) { const b = a.slice(); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if ((dx || dy) && yy >= 0 && xx >= 0 && yy < n && xx < n) k += a[yy * n + xx]; } if (k >= 5) b[y * n + x] = 1; else if (k <= 2) b[y * n + x] = 0; } a = b; }
    if (simetri) for (let y = 0; y < n; y++) for (let x = 0; x < n / 2; x++) a[y * n + n - 1 - x] = a[y * n + x];
    const top = a.reduce((p, v) => p + v, 0); if (top < n * n * .38 || top > n * n * .72) continue;
    const SI = [], KI = []; let bosVar = false; for (let i = 0; i < n; i++) { SI.push(ipuclari(a.slice(i * n, i * n + n))); const L = []; for (let y = 0; y < n; y++) L.push(a[y * n + i]); KI.push(ipuclari(L)); if (!SI[i].length || !KI[i].length) bosVar = true; }
    if (bosVar) continue; if (coz(n, SI, KI).tam) return { n, c: a, SI, KI };
  }
  return null;
}
function kapak() {
  const D = ['..11..', '.1111.', '11.1.1', '111111', '.1..1.', '1.11.1'];
  let s = ''; D.forEach((row, y) => [...row].forEach((c, x) => { s += `<rect x="${24 + x * 10.500}" y="${24 + y * 10.500}" width="9.500" height="9.500" rx="1.500" fill="${c === '1' ? '#3b5bdb' : '#eef0f7'}"/>`; }));
  const T = ['2', '4', '2 1 1', '6', '1 1', '1 2 1']; T.forEach((t, y) => { s += `<text x="21" y="${31.5 + y * 10.5}" text-anchor="end" font-family="system-ui,sans-serif" font-size="5.500" font-weight="800" fill="#6b7280">${t}</text>`; });
  ['2', '3', '4', '2', '4', '2'].forEach((t, x) => { s += `<text x="${28.7 + x * 10.5}" y="20" text-anchor="middle" font-family="system-ui,sans-serif" font-size="5.500" font-weight="800" fill="#6b7280">${t}</text>`; });
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#fff"/>${s}</svg>`;
}
const CSS = `
.ng-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.ng{width:min(540px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;align-items:center;-webkit-user-select:none;user-select:none;position:relative}
.ng-ust{display:flex;align-items:center;gap:6px;width:100%}
.ng-boy{display:flex;gap:3px;background:var(--bg2);padding:4px;border-radius:12px}
.ng-boy button{padding:7px 8px;border-radius:9px;font-weight:800;font-size:12.5px;color:var(--ink-soft);white-space:nowrap}.ng-boy button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 4px rgba(0,0,0,.12)}
.ng-say{margin-left:auto;padding:7px 10px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:14px;font-variant-numeric:tabular-nums}
.ng-bilgi{font-size:13px;font-weight:700;color:var(--ink-soft);text-align:center;height:36px;display:grid;place-items:center;line-height:1.35;overflow:hidden}.ng-bilgi b{color:var(--ink)}
.ng-t{display:grid;touch-action:none;background:var(--card);border-radius:10px;padding:4px}
.ng-h{box-sizing:border-box}
.ng-ki,.ng-si{display:flex;font-weight:800;font-size:var(--f);color:var(--ink);line-height:1.05}
.ng-ki{flex-direction:column;justify-content:flex-end;align-items:center;padding-bottom:3px;gap:1px}
.ng-si{justify-content:flex-end;align-items:center;padding-right:5px;gap:calc(var(--f)*.4)}
.ng-ki.tam,.ng-si.tam{color:var(--ink-soft);opacity:.45}.ng-ki.vur,.ng-si.vur{background:var(--accent-soft);border-radius:5px}
.ng-ki.ip,.ng-si.ip{background:#ffe680;color:#2b2f38;border-radius:5px}
.ng-h{width:var(--c);height:var(--c);background:var(--bg2);border:1px solid var(--card);border-radius:3px;display:grid;place-items:center;cursor:pointer}
.ng-h.s5{margin-left:2px;width:calc(var(--c) - 2px)}.ng-h.u5{margin-top:2px;height:calc(var(--c) - 2px)}
.ng-h.d{background:var(--ink);animation:ngD .1s ease-out}@keyframes ngD{from{transform:scale(.6)}}
.ng-h.x::after{content:'✕';font-size:calc(var(--c)*.5);font-weight:800;color:var(--ink-soft);opacity:.6}
.ng-h.yan{background:var(--bad)!important}.ng-h.ipk{box-shadow:inset 0 0 0 2px #f0b400}
.ng.bitti .ng-h{border-color:transparent;border-radius:0;cursor:default}.ng.bitti .ng-h.d{background:var(--accent);transition:background .5s}.ng.bitti .ng-h.x::after{content:''}
.ng-alt{display:flex;gap:6px;width:100%;align-items:stretch}
.ng-mod{flex:1;display:flex;gap:4px;background:var(--bg2);padding:4px;border-radius:14px}
.ng-mod button{flex:1;padding:11px 4px;border-radius:11px;font-weight:800;font-size:15px;color:var(--ink-soft)}.ng-mod button.on{background:var(--accent);color:#fff}
.ng-b{padding:10px 12px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14px;white-space:nowrap}.ng-b:disabled{opacity:.45}.ng-b.ana{background:var(--accent);color:#fff}
.ng-son{background:var(--bg2);border-radius:16px;padding:14px;text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center;width:100%;animation:ngS .35s ease-out}@keyframes ngS{from{opacity:0;transform:translateY(8px)}}
.ng-son h3{margin:0;font-size:20px;font-weight:800}.ng-son p{margin:0;font-size:14px;font-weight:700;color:var(--ink-soft)}.ng-son .dug{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.ng-perde{position:fixed;inset:0;z-index:60;background:rgba(20,24,34,.55);display:grid;place-items:center;padding:16px}
.ng-yardim{width:min(400px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:var(--card);border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:11px;-webkit-user-select:text;user-select:text}
.ng-yardim h3{margin:0;font-size:20px;font-weight:800}.ng-yardim p{margin:0;font-size:14.5px;font-weight:600;line-height:1.45}
.ng-ornek{display:flex;align-items:center;gap:8px;justify-content:center;font-weight:800}.ng-ornek i{display:inline-block;width:24px;height:24px;border-radius:4px;background:var(--bg2);margin-right:2px;vertical-align:middle;font-style:normal;text-align:center;line-height:24px;color:var(--ink-soft);font-size:13px}.ng-ornek i.d{background:var(--ink)}
`;
registerGame({
  id: 'nonogram', title: 'Nonogram', category: 'Bulmaca', tags: 'nonogram kare karalamaca sayı boyama mantık bulmaca', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Kare karalamaca: satır ve sütun başındaki sayılara bakarak gizli deseni boya. Her bulmaca yalnızca mantıkla çözülür. Dört boy, sırayla ilerleyen bulmacalar ve günün bulmacası.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><rect x="9" y="9" width="6" height="6" fill="currentColor"/></svg>',
  shareText() { return this._paylas || 'Nonogram: sayılara bakarak deseni boya.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('ng-css')) { const s = document.createElement('style'); s.id = 'ng-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('ng-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, n: 5, sira: {}, en: {}, o: null, gunB: -1, yardim: 0 }, (api.loadState && api.loadState()) || {});
    let P, O, g, gecmis = [], tm = 0, kT = 0, mod = 1, ipT = 0, H = [], SE = [], KE = [];
    const kok = E('div', { class: 'ng' }); root.append(kok);
    kok.innerHTML = `<div class="ng-ust"><div class="ng-boy">${BOY.map(b => `<button data-n="${b}">${b}×${b}</button>`).join('')}<button data-n="g">Günün</button></div><span class="ng-say" id="ng-s">0:00</span></div>
      <div class="ng-bilgi" id="ng-b"></div><div class="ng-t" id="ng-t"></div>
      <div class="ng-alt"><div class="ng-mod"><button data-mod="1">■ Boya</button><button data-mod="2">✕ Boş</button></div><button class="ng-b" data-a="geri">↶</button><button class="ng-b" data-a="ipucu">💡</button><button class="ng-b" data-a="yardim">?</button></div><div id="ng-son" style="width:100%"></div>`;
    const q = s => kok.querySelector(s), T = q('#ng-t');
    const sure = () => { const t = O.t | 0; return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };
    const bilgi = m => { q('#ng-b').innerHTML = '<span>' + (m || '') + '</span>'; };
    function kaydet(hemen) { if (O && !O.bitti) { O.g = g.join(''); D.o = O; } else D.o = null; clearTimeout(kT); const f = () => { try { api.saveState && api.saveState(D); } catch (e) { } }; if (hemen) f(); else kT = setTimeout(f, 500); }
    const tohum = (n, tur, no) => tur === 'g' ? 880000 + GN * 31 : n * 100000 + no * 37;
    function ac(n, tur, eski) {
      clearInterval(tm); tm = 0; ipTemizle(); const no = tur === 'g' ? 0 : (D.sira[n] || 0);
      P = uret(n, tohum(n, tur, no)); O = eski || { n, tur, no, t: 0, ip: 0, gun: GN, bitti: 0 }; D.n = n;
      g = eski && eski.g && eski.g.length === n * n ? [...eski.g].map(Number) : new Array(n * n).fill(0); gecmis = []; mod = 1;
      kok.classList.remove('bitti'); q('#ng-son').innerHTML = '';
      const maxS = Math.max(...P.SI.map(x => x.length)), maxK = Math.max(...P.KI.map(x => x.length));
      const W = (kok.clientWidth || 340) - 10, f = n <= 5 ? 16 : n <= 8 ? 14 : n <= 10 ? 13 : 12, solW = Math.ceil(maxS * f * .95 + 8), ustH = Math.ceil(maxK * f * 1.1 + 6);
      const c = Math.floor(Math.max(18, Math.min(n <= 5 ? 56 : 44, (W - solW) / n, (innerHeight - 280 - ustH) / n)));
      T.style.setProperty('--c', c + 'px'); T.style.setProperty('--f', f + 'px'); T.style.gridTemplateColumns = `${solW}px repeat(${n},${c}px)`; T.style.gridTemplateRows = `${ustH}px repeat(${n},${c}px)`; T.innerHTML = ''; H = []; SE = []; KE = [];
      T.append(E('div'));
      for (let x = 0; x < n; x++) { const e = E('div', { class: 'ng-ki' }); e.innerHTML = P.KI[x].map(v => `<span>${v}</span>`).join(''); T.append(e); KE.push(e); }
      for (let y = 0; y < n; y++) { const e = E('div', { class: 'ng-si' }); e.innerHTML = P.SI[y].map(v => `<span>${v}</span>`).join(''); T.append(e); SE.push(e);
        for (let x = 0; x < n; x++) { const h = E('div', { class: 'ng-h' + (x && x % 5 === 0 ? ' s5' : '') + (y && y % 5 === 0 ? ' u5' : '') }); h.dataset.i = y * n + x; T.append(h); H.push(h); } }
      ciz(); kaydet();
      bilgi(eski ? 'Kaldığın yerden devam.' : tur === 'g' ? 'Günün bulmacası: bugün herkes aynı deseni arıyor.' : `${n}×${n} · Bulmaca <b>#${no + 1}</b>. Sayılar, sıradaki boyalı grupların uzunluğu.`);
    }
    function ciz() {
      const n = P.n;
      for (let i = 0; i < n * n; i++) { const h = H[i], c = 'ng-h' + (h.classList.contains('s5') ? ' s5' : '') + (h.classList.contains('u5') ? ' u5' : '') + (g[i] === 1 ? ' d' : g[i] === 2 ? ' x' : ''); if (h.className.replace(/ (yan|ipk)/g, '') !== c) h.className = c; }
      for (let y = 0; y < n; y++) SE[y].classList.toggle('tam', String(ipuclari(g.slice(y * n, y * n + n))) === String(P.SI[y]));
      for (let x = 0; x < n; x++) { const L = []; for (let y = 0; y < n; y++) L.push(g[y * n + x]); KE[x].classList.toggle('tam', String(ipuclari(L)) === String(P.KI[x])); }
      q('#ng-s').textContent = sure(); q('[data-a=geri]').disabled = !gecmis.length || !!O.bitti;
      kok.querySelectorAll('.ng-boy button').forEach(b => b.classList.toggle('on', O.tur === 'g' ? b.dataset.n === 'g' : +b.dataset.n === P.n));
      kok.querySelectorAll('.ng-mod button').forEach(b => b.classList.toggle('on', +b.dataset.mod === mod));
    }
    function saat() { if (!tm && !O.bitti) tm = setInterval(() => { if (document.hidden || O.bitti) return; O.t++; q('#ng-s').textContent = sure(); if (O.t % 10 === 0) kaydet(); }, 1000); }
    function kontrol() {
      const n = P.n; if (!SE.every(e => e.classList.contains('tam')) || !KE.every(e => e.classList.contains('tam'))) return;
      O.bitti = 1; clearInterval(tm); tm = 0; for (let i = 0; i < n * n; i++) if (g[i] !== 1) g[i] = 2; kok.classList.add('bitti'); ciz();
      const eski = D.en[n] || 0, rekor = !O.ip && (!eski || O.t < eski); if (rekor && O.tur !== 'g') D.en[n] = O.t;
      const skor = Math.max(50, Math.round(({ 5: 150, 8: 400, 10: 700, 12: 1100 })[n] * Math.max(.5, Math.min(1.5, 1.5 - O.t / ({ 5: 120, 8: 400, 10: 800, 12: 1400 })[n])) - O.ip * 30));
      if (O.tur === 'g') { if (window.Seri) Seri.kaydet('nonogram', GN, { ok: true, b: O.t < 180 ? 0 : O.t < 360 ? 1 : O.t < 600 ? 2 : 3, min: true }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      else D.sira[n] = (D.sira[n] || 0) + 1;
      kaydet(true); api.submitScore(skor); ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      oyun._paylas = 'Nonogram ' + n + '×' + n + (O.tur === 'g' ? ' · günün bulmacası #' + (GN + 1) : '') + ': ' + sure() + '\nerdevelop.com/oyunlar/#o/nonogram';
      bilgi(''); const s = E('div', { class: 'ng-son' }), sonraki = BOY[BOY.indexOf(n) + 1];
      s.innerHTML = `<h3>🎉 Desen tamam!</h3><p>${O.tur === 'g' ? 'Günün bulmacası' : n + '×' + n + ' · #' + (O.no + 1)} · ${sure()}${O.ip ? ' · ' + O.ip + ' ipucu' : ''} · ${skor} puan${rekor && O.tur !== 'g' ? ' · 🏆 en iyi süre' : ''}</p><div class="dug"><button class="ng-b ana" data-n="${O.tur === 'g' ? 10 : n}">Sıradaki bulmaca ›</button>${O.tur !== 'g' && D.gunB !== GN ? '<button class="ng-b" data-n="g">Günün bulmacası</button>' : ''}${sonraki && (D.sira[n] || 0) >= 2 ? `<button class="ng-b" data-n="${sonraki}">${sonraki}×${sonraki} dene</button>` : ''}</div>`;
      q('#ng-son').append(s); s.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function ipTemizle() { clearTimeout(ipT); H.forEach(h => h.classList.remove('yan', 'ipk')); SE.concat(KE).forEach(e => e.classList.remove('ip')); }
    function ipucu() {
      if (O.bitti) return; ipTemizle(); const n = P.n; O.ip++; saat();
      const yan = []; for (let i = 0; i < n * n; i++) if ((g[i] === 1 && !P.c[i]) || (g[i] === 2 && P.c[i])) yan.push(i);
      if (yan.length) { yan.forEach(i => H[i].classList.add('yan')); bilgi(`Kırmızı ${yan.length > 1 ? yan.length + ' kare' : 'kare'} <b>yanlış</b>. Onları düzelt, sonra devam et.`); ipT = setTimeout(ipTemizle, 4000); return ses('bad'); }
      const dene = (ip, idx, el, ad) => { const L = idx.map(i => g[i]), y = satirCoz(ip, L); if (!y) return false; const yeni = idx.filter((i, k) => y[k] && !L[k]); if (!yeni.length) return false;
        gecmis.push(g.join('')); idx.forEach((i, k) => { if (y[k] && !L[k]) { g[i] = y[k]; H[i].classList.add('ipk'); } }); el.classList.add('ip'); bilgi(`${ad}: sayılar <b>${ip.join(' ')}</b>. Bu sıranın her olası dizilişinde aynı kalan <b>${yeni.length} kare</b> işaretlendi.`); return true; };
      let oldu = false; for (let y = 0; y < n && !oldu; y++) oldu = dene(P.SI[y], Array.from({ length: n }, (_, x) => y * n + x), SE[y], (y + 1) + '. satır');
      for (let x = 0; x < n && !oldu; x++) oldu = dene(P.KI[x], Array.from({ length: n }, (_, y) => y * n + x), KE[x], (x + 1) + '. sütun');
      if (!oldu) bilgi('Şu an tek satırdan çıkan bir şey yok.'); ses('click'); ciz(); kaydet(); kontrol(); ipT = setTimeout(ipTemizle, 5000);
    }
    function yardim() {
      const p = E('div', { class: 'ng-perde' });
      p.innerHTML = `<div class="ng-yardim"><h3>Nasıl oynanır?</h3>
        <p>Her satırın solunda ve her sütunun üstünde sayılar var. Sayılar, o sırada <b>arka arkaya boyalı kare gruplarının</b> uzunluklarını sırayla verir. Gruplar arasında <b>en az bir boş</b> kare olur.</p>
        <div class="ng-ornek"><span>3 1</span><span><i class="d"></i><i class="d"></i><i class="d"></i><i>✕</i><i class="d"></i></span></div>
        <p><b>İlk adım:</b> büyük sayılardan başla. 5 karelik sırada <b>5</b> yazıyorsa hepsi boyalıdır; <b>4</b> yazıyorsa ortadaki üç kare kesin boyalıdır.</p>
        <div class="ng-ornek"><span>4</span><span><i></i><i class="d"></i><i class="d"></i><i class="d"></i><i></i></span></div>
        <p><b>■ Boya</b> ile kareyi doldur, boş olduğundan emin olduğun kareyi <b>✕</b> ile işaretle. Parmağını sürükleyerek birden çok kareyi boyayabilirsin. Tamamlanan sıranın sayıları soluklaşır.</p>
        <p>Takılırsan <b>💡</b>: yanlışın varsa gösterir, yoksa bir sıranın kesin karelerini işaretler.</p>
        <button class="ng-b ana" data-a="kapat">Anladım</button></div>`;
      p.onclick = e => { if (e.target === p || e.target.dataset.a === 'kapat') p.remove(); }; document.body.append(p); D.yardim = 1; kaydet();
    }
    /* boyama: ilk karenin yeni değeri sürükleme boyunca uygulanır */
    let boya = null;
    const hucre = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.classList && el.classList.contains('ng-h') && T.contains(el) ? +el.dataset.i : -1; };
    const vur = i => { const n = P.n; SE.forEach((e, y) => e.classList.toggle('vur', i >= 0 && y === ((i / n) | 0))); KE.forEach((e, x) => e.classList.toggle('vur', i >= 0 && x === i % n)); };
    T.addEventListener('pointerdown', e => { if (O.bitti) return; const i = hucre(e); if (i < 0) return; e.preventDefault(); ipTemizle(); saat();
      const m = e.button === 2 ? 2 : mod, hedef = g[i] === m ? 0 : m; boya = { hedef, ilk: g[i], once: g.join(''), deg: false }; uygula(i); vur(i); });
    function uygula(i) { if (g[i] === boya.hedef) return; if (boya.hedef !== 0 && g[i] !== 0 && g[i] !== boya.ilk) return; if (boya.hedef === 0 && g[i] !== boya.ilk) return; g[i] = boya.hedef; boya.deg = true; ses('tap'); ciz(); }
    const hareket = e => { if (!boya) return; const i = hucre(e); if (i >= 0) { uygula(i); vur(i); } };
    const birak = () => { if (!boya) return; const b = boya; boya = null; vur(-1); if (b.deg) { gecmis.push(b.once); if (gecmis.length > 400) gecmis.shift(); ciz(); kaydet(); kontrol(); } };
    addEventListener('pointermove', hareket); addEventListener('pointerup', birak); addEventListener('pointercancel', birak);
    T.addEventListener('contextmenu', e => e.preventDefault());
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.n) { if (b.dataset.n === 'g') return ac(10, 'g', null); const n = +b.dataset.n; return ac(n, 's', null); }
      if (b.dataset.mod) { mod = +b.dataset.mod; return ciz(); }
      const a = b.dataset.a; if (a === 'ipucu') return ipucu(); if (a === 'yardim') return yardim();
      if (a === 'geri') { if (!gecmis.length || O.bitti) return; g = [...gecmis.pop()].map(Number); ipTemizle(); ses('click'); ciz(); kaydet(); } });
    const tusla = e => { const k = e.key.toLowerCase(); if (k === 'x') { mod = mod === 1 ? 2 : 1; ciz(); } else if (k === 'z' || k === 'u') q('[data-a=geri]').click(); else if (k === 'h') ipucu(); };
    document.addEventListener('keydown', tusla);
    const sakla = () => kaydet(true); addEventListener('pagehide', sakla);
    api.onCleanup(() => { clearInterval(tm); clearTimeout(kT); clearTimeout(ipT); removeEventListener('pointermove', hareket); removeEventListener('pointerup', birak); removeEventListener('pointercancel', birak); removeEventListener('pagehide', sakla); document.removeEventListener('keydown', tusla); kaydet(true); root.classList.remove('ng-mount'); const p = document.querySelector('.ng-perde'); if (p) p.remove(); });
    const o = D.o;
    if (o && BOY.includes(o.n) && (o.tur !== 'g' || o.gun === GN) && (o.tur === 'g' || o.no === (D.sira[o.n] || 0))) ac(o.n, o.tur, o); else ac(BOY.includes(D.n) ? D.n : 5, 's', null);
    if (!D.yardim) yardim();
    if (/[?&]ngtest/.test(location.search)) window.__ng = { P: () => P, g: () => g, O: () => O, D: () => D };
  }
});
})();
