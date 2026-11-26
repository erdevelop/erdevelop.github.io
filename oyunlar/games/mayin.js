/* Mayın Tarlası — ilk dokunuş hep güvenli ve geniş açılır; tahtalar tahmin gerektirmeden, yalnızca mantıkla çözülür
   (üretimde bir çözücüyle sınanır). Telefonda Aç/Bayrak düğmesi ve uzun basma; ipucu çözücüden gelir. */
(function () {
const ZOR = { 1: { ad: 'Kolay', w: 8, h: 10, m: 10 }, 2: { ad: 'Orta', w: 10, h: 14, m: 24 }, 3: { ad: 'Zor', w: 12, h: 18, m: 44 } };
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const gun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
const KOM = {};
function komsu(w, h) { const k = w + 'x' + h; if (KOM[k]) return KOM[k]; const L = []; for (let i = 0; i < w * h; i++) { const x = i % w, y = (i / w) | 0, a = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h) a.push(ny * w + nx); } L.push(a); } return (KOM[k] = L); }
/* bir tur çıkarım: bilgi[i] 0 bilinmiyor, 1 mayın, 2 güvenli. Değişiklik listesi döner: [i, 1|2, neden] */
function cikar(w, h, acik, say, bilgi, toplam) {
  const K = komsu(w, h), cikti = [], isaret = (i, v, n) => { if (!bilgi[i] && !acik[i]) { bilgi[i] = v; cikti.push([i, v, n]); } }, kis = [];
  for (let i = 0; i < w * h; i++) { if (!acik[i] || !say[i]) continue; let m = say[i]; const U = []; for (const j of K[i]) { if (acik[j]) continue; if (bilgi[j] === 1) m--; else if (!bilgi[j]) U.push(j); } if (!U.length) continue;
    if (m === 0) U.forEach(j => isaret(j, 2, i)); else if (m === U.length) U.forEach(j => isaret(j, 1, i)); else kis.push({ U, m, i }); }
  if (cikti.length) return cikti;
  for (const A of kis) for (const B of kis) { if (A === B || A.U.length >= B.U.length) continue; const sB = new Set(B.U); if (!A.U.every(j => sB.has(j))) continue; const sA = new Set(A.U), fark = B.U.filter(j => !sA.has(j)), dm = B.m - A.m;
    if (dm === 0) fark.forEach(j => isaret(j, 2, B.i)); else if (dm === fark.length) fark.forEach(j => isaret(j, 1, B.i)); if (cikti.length) return cikti; }
  let kalan = toplam, bos = []; for (let i = 0; i < w * h; i++) { if (bilgi[i] === 1) kalan--; else if (!acik[i] && !bilgi[i]) bos.push(i); }
  if (bos.length && kalan === 0) bos.forEach(j => isaret(j, 2, -1)); else if (bos.length && kalan === bos.length) bos.forEach(j => isaret(j, 1, -1));
  return cikti;
}
function sayilar(w, h, mayin) { const K = komsu(w, h); return mayin.map((m, i) => m ? -1 : K[i].reduce((a, j) => a + mayin[j], 0)); }
function sel(w, h, say, acik, i) { const K = komsu(w, h), y = [i]; while (y.length) { const c = y.pop(); if (acik[c]) continue; acik[c] = 1; if (say[c] === 0) for (const j of K[c]) if (!acik[j]) y.push(j); } }
function cozulur(w, h, mayin, say, bas) {
  const acik = new Uint8Array(w * h), bilgi = new Uint8Array(w * h), top = mayin.reduce((a, b) => a + b, 0); sel(w, h, say, acik, bas);
  for (let t = 0; t < 400; t++) { const c = cikar(w, h, acik, say, bilgi, top); if (!c.length) break; for (const [i, v] of c) if (v === 2) sel(w, h, say, acik, i); }
  for (let i = 0; i < w * h; i++) if (!mayin[i] && !acik[i]) return false; return true;
}
function uret(z, bas, tohum) {
  const { w, h, m } = ZOR[z], K = komsu(w, h), r = rng(tohum), yasak = new Set([bas, ...K[bas]]), aday = []; for (let i = 0; i < w * h; i++) if (!yasak.has(i)) aday.push(i);
  let son = null;
  for (let d = 0; d < 600; d++) { const a = aday.slice(), mayin = new Array(w * h).fill(0); for (let k = 0; k < m; k++) { const j = k + ((r() * (a.length - k)) | 0);[a[k], a[j]] = [a[j], a[k]]; mayin[a[k]] = 1; }
    const say = sayilar(w, h, mayin); son = { mayin, say, deneme: d + 1, temiz: false }; if (cozulur(w, h, mayin, say, bas)) { son.temiz = true; return son; } }
  return son;
}
function kapak() {
  const D = ['1.....', '1221..', '..F21.', '....1.', '.F...1', '.....1'], R = { 1: '#3b6fe0', 2: '#2f9e6f', 3: '#d64545' };
  let s = ''; D.forEach((row, y) => [...row].forEach((c, x) => { const kap = c === '.' && !((y === 0 && x > 0) || (y === 1 && x > 3) || (y === 2 && x === 5) || (y === 3 && x === 5)), bay = c === 'F'; s += `<rect x="${6 + x * 13}" y="${6 + y * 13}" width="12" height="12" rx="2.5" fill="${kap || bay ? '#8fa3ff' : '#eef0f7'}"/>`; if (bay) s += `<path d="M${10 + x * 13} ${9 + y * 13}v7M${10 + x * 13} ${9 + y * 13}l5.5 2.200-5.500 2.200" stroke="#fff" stroke-width="1.5" fill="#d64545" stroke-linejoin="round"/>`; else if (R[c]) s += `<text x="${12 + x * 13}" y="${15.7 + y * 13}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="${R[c]}">${c}</text>`; }));
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#fff"/>${s}</svg>`;
}
const CSS = `
.my-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.my{width:min(520px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;align-items:center;-webkit-user-select:none;user-select:none;position:relative}
.my-ust{display:flex;align-items:center;gap:6px;width:100%}
.my-zor{display:flex;gap:3px;background:var(--bg2);padding:4px;border-radius:12px}
.my-zor button{padding:7px 9px;border-radius:9px;font-weight:800;font-size:12.5px;color:var(--ink-soft)}.my-zor button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 4px rgba(0,0,0,.12)}
.my-say{margin-left:auto;display:flex;gap:6px}.my-say span{padding:7px 10px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap}
.my-t{display:grid;gap:2px;padding:5px;border-radius:12px;background:var(--bg2);touch-action:manipulation;position:relative}
.my-h{width:var(--c);height:var(--c);border-radius:calc(var(--c)*.16);display:grid;place-items:center;font-weight:800;font-size:calc(var(--c)*.56);line-height:1;background:color-mix(in srgb,var(--accent) 62%,var(--card));box-shadow:inset 0 calc(var(--c)*-.08) 0 rgba(0,0,0,.14),inset 0 calc(var(--c)*.06) 0 rgba(255,255,255,.25);cursor:pointer;-webkit-tap-highlight-color:transparent}
.my-h.a{background:var(--card);box-shadow:none;cursor:default;animation:myAc .16s ease-out}
@keyframes myAc{from{transform:scale(.6);opacity:.4}}
.my-h.n1{color:#3b6fe0}.my-h.n2{color:#2f9e6f}.my-h.n3{color:#d64545}.my-h.n4{color:#7a4ce0}.my-h.n5{color:#b45f1d}.my-h.n6{color:#1f9aa8}.my-h.n7{color:#444}.my-h.n8{color:#888}
.my-h.b::after{content:'🚩';font-size:calc(var(--c)*.5)}
.my-h.m{background:var(--card)}.my-h.m::after{content:'💣';font-size:calc(var(--c)*.52)}
.my-h.pat{background:#e45858!important;animation:myPat .3s}.my-h.yb{background:color-mix(in srgb,var(--bad) 30%,var(--card))}.my-h.yb::after{content:'✕';color:var(--bad);font-size:calc(var(--c)*.6)}
@keyframes myPat{50%{transform:scale(1.25)}}
.my-h.ip{box-shadow:0 0 0 3px #ffd84a,0 0 12px #ffd84a;z-index:2;animation:myIp .5s ease-in-out infinite alternate}@keyframes myIp{to{filter:brightness(1.15)}}
.my-h.kn{box-shadow:0 0 0 2px var(--accent)}
.my-alt{display:flex;gap:8px;width:100%;align-items:stretch}
.my-mod{flex:1;display:flex;gap:4px;background:var(--bg2);padding:4px;border-radius:14px}
.my-mod button{flex:1;padding:11px 6px;border-radius:11px;font-weight:800;font-size:15px;color:var(--ink-soft)}.my-mod button.on{background:var(--accent);color:#fff}
.my-b{padding:10px 14px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14px;white-space:nowrap}.my-b.ana{background:var(--accent);color:#fff}
.my-bilgi{font-size:13px;font-weight:700;color:var(--ink-soft);text-align:center;height:36px;display:grid;place-items:center;line-height:1.35;overflow:hidden}.my-bilgi b{color:var(--ink)}
.my-son{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:6;background:var(--card);border-radius:18px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.3);text-align:center;display:flex;flex-direction:column;gap:8px;width:min(270px,86%);animation:mySon .3s .35s both}
@keyframes mySon{from{opacity:0;transform:translate(-50%,-40%)}}
.my-son h3{margin:0;font-size:20px;font-weight:800}.my-son p{margin:0;font-size:14px;font-weight:700;color:var(--ink-soft)}
`;
registerGame({
  id: 'mayin', title: 'Mayın Tarlası', category: 'Bulmaca', tags: 'mayın tarlası minesweeper bayrak mantık bulmaca tahminsiz', gunluk: true, odak: true, noRestart: true,
  aciklama: 'İlk dokunuş hep güvenli, tahtalar şansa değil mantığa dayanır: tahmin etmeden çözülür. Üç boy, bayrak modu, mantığını gösteren ipucu ve günün tahtası.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="6"/><path d="M12 3v4M5 6l2.500 2.500M19 6l-2.500 2.500M3 13h3M18 13h3"/></svg>',
  shareText() { return this._paylas || 'Mayın Tarlası: tahmin gerektirmeyen tahtalar.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('my-css')) { const s = document.createElement('style'); s.id = 'my-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('my-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, z: 1, o: null, en: {}, kaz: {}, gunB: -1 }, (api.loadState && api.loadState()) || {});
    let O, mayin, say, dur, w, h, K, tm = 0, kT = 0, bayrakMod = false, ipT = 0;   /* dur: 0 kapalı, 1 açık, 2 bayrak */
    const kok = E('div', { class: 'my' }); root.append(kok);
    kok.innerHTML = `<div class="my-ust"><div class="my-zor"><button data-z="1">Kolay</button><button data-z="2">Orta</button><button data-z="3">Zor</button><button data-z="g">Günün</button></div><div class="my-say"><span id="my-m">💣 0</span><span id="my-s">0:00</span></div></div>
      <div class="my-bilgi" id="my-b"></div><div class="my-t" id="my-t"></div>
      <div class="my-alt"><div class="my-mod"><button data-mod="a">👆 Aç</button><button data-mod="b">🚩 Bayrak</button></div><button class="my-b" data-a="ipucu">💡 İpucu</button><button class="my-b" data-a="yeni">↻</button></div>`;
    const q = s => kok.querySelector(s), T = q('#my-t'); let H = [];
    const sure = () => { const t = O.t | 0; return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };
    const bilgi = m => { q('#my-b').innerHTML = '<span>' + (m || '') + '</span>'; };
    function kaydet(hemen) { if (O && O.basladi && !O.bitti) { O.mayin = mayin.join(''); O.dur = dur.join(''); D.o = O; } else D.o = null; clearTimeout(kT); const f = () => { try { api.saveState && api.saveState(D); } catch (e) { } }; if (hemen) f(); else kT = setTimeout(f, 500); }
    function kur() {
      ({ w, h } = ZOR[O.z]); K = komsu(w, h);
      const c = Math.floor(Math.max(22, Math.min(44, ((kok.clientWidth || 360) - 10 - (w - 1) * 2) / w, (innerHeight - 268 - (h - 1) * 2) / h)));
      T.style.setProperty('--c', c + 'px'); T.style.gridTemplateColumns = `repeat(${w},${c}px)`; T.innerHTML = '';
      for (let i = 0; i < w * h; i++) { const e = E('div', { class: 'my-h' }); e.dataset.i = i; T.append(e); } H = [...T.children];
      const s = q('.my-son'); if (s) s.remove();
    }
    function ciz() {
      for (let i = 0; i < w * h; i++) { const e = H[i], d = dur[i]; let c = 'my-h', t = '';
        if (d === 1) { c += ' a'; if (mayin && mayin[i]) c += ' m'; else if (say[i] > 0) { c += ' n' + say[i]; t = say[i]; } } else if (d === 2) c += ' b';
        if (O.bitti === 2 && mayin) { if (mayin[i] && d !== 2) c += ' a m' + (i === O.patlayan ? ' pat' : ''); else if (!mayin[i] && d === 2) c = 'my-h a yb'; }
        if (O.bitti === 1 && mayin && mayin[i]) c = 'my-h b';
        if (e.className.replace(' ip', '') !== c || e.textContent !== String(t)) { const ip = e.classList.contains('ip'); e.className = c + (ip ? ' ip' : ''); e.textContent = t; } }
      const b = dur.reduce((a, d) => a + (d === 2), 0); q('#my-m').textContent = '💣 ' + (ZOR[O.z].m - b); q('#my-s').textContent = sure();
      kok.querySelectorAll('.my-zor button').forEach(x => x.classList.toggle('on', O.tur === 'g' ? x.dataset.z === 'g' : +x.dataset.z === O.z));
      kok.querySelectorAll('.my-mod button').forEach(x => x.classList.toggle('on', (x.dataset.mod === 'b') === bayrakMod));
    }
    function yeni(z, tur) {
      clearInterval(tm); tm = 0; ipTemizle();
      O = { z, tur: tur || 's', t: 0, basladi: 0, bitti: 0, ip: 0, gun: GN, bas: -1 }; D.z = z; mayin = null; say = null; dur = new Array(ZOR[z].w * ZOR[z].h).fill(0); bayrakMod = false;
      kur();
      if (O.tur === 'g') { const b = ((h / 2) | 0) * w + ((w / 2) | 0); basla(b); bilgi('Günün tahtası: bugün herkes aynı tahtayı çözüyor.'); }
      else { ciz(); bilgi('Bir kareye dokun: <b>ilk dokunuş hep güvenli</b>.'); }
      kaydet();
    }
    function basla(i) {
      const u = uret(O.z, i, O.tur === 'g' ? 31000 + GN * 17 + O.z : ((Date.now() % 1e9) | 0)); mayin = u.mayin; say = u.say; O.basladi = 1; O.bas = i; O.temiz = u.temiz;
      const a = new Uint8Array(w * h); sel(w, h, say, a, i); for (let k = 0; k < w * h; k++) if (a[k]) dur[k] = 1;
      saat(); ciz(); ses('score');
    }
    function saat() { if (!tm) tm = setInterval(() => { if (document.hidden || O.bitti) return; O.t++; q('#my-s').textContent = sure(); if (O.t % 10 === 0) kaydet(); }, 1000); }
    function ac(i) {
      if (O.bitti || dur[i] === 2) return;
      if (!mayin) { basla(i); bilgi('Sayı, çevresindeki 8 karede kaç mayın olduğunu söyler. Mayın olduğundan emin olduğun kareye 🚩 koy.'); return sonra(); }
      if (dur[i] === 1) return akor(i);
      if (mayin[i]) return kaybet(i);
      const a = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) a[k] = dur[k] === 1 ? 1 : 0; const once = a.slice(); sel(w, h, say, a, i);
      for (let k = 0; k < w * h; k++) if (a[k] && !once[k]) dur[k] = 1; ses('tap'); sonra();
    }
    function akor(i) { if (!say[i]) return; const b = K[i].filter(j => dur[j] === 2).length; if (b !== say[i]) return; const kap = K[i].filter(j => dur[j] === 0); if (!kap.length) return; const mi = kap.find(j => mayin[j]); if (mi !== undefined) return kaybet(mi);
      const a = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) a[k] = dur[k] === 1 ? 1 : 0; kap.forEach(j => sel(w, h, say, a, j)); for (let k = 0; k < w * h; k++) if (a[k] && dur[k] === 0) dur[k] = 1; ses('tap'); sonra(); }
    function bayrak(i) { if (O.bitti || !mayin || dur[i] === 1) return; dur[i] = dur[i] === 2 ? 0 : 2; ses('click'); try { api.buzz && api.buzz(12); } catch (e) { } sonra(); }
    function sonra() { ipTemizle(); saat(); if (mayin && dur.every((d, i) => d === 1 || mayin[i])) return kazan(); ciz(); kaydet(); }
    function kaybet(i) { O.bitti = 2; O.patlayan = i; clearInterval(tm); tm = 0; ciz(); ses('lose'); try { api.buzz && api.buzz([40, 60, 120]); } catch (e) { } kaydet(true);
      son(`<h3>💥 Mayına bastın</h3><p>${ZOR[O.z].ad} · ${sure()}</p><button class="my-b ana" data-a="yeni">Yeni tahta</button>`); }
    function kazan() {
      O.bitti = 1; clearInterval(tm); tm = 0; ciz(); const z = O.z, eski = D.en[z] || 0, rekor = !O.ip && (!eski || O.t < eski); if (rekor) D.en[z] = O.t; D.kaz[z] = (D.kaz[z] || 0) + 1;
      const skor = Math.max(50, Math.round([0, 300, 800, 1600][z] * Math.max(.4, Math.min(1.6, 1.6 - O.t / [0, 90, 300, 720][z])) - O.ip * 40));
      if (O.tur === 'g') { if (window.Seri) Seri.kaydet('mayin', GN, { ok: true, b: O.t < 60 ? 0 : O.t < 120 ? 1 : O.t < 240 ? 2 : 3, min: true }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      kaydet(true); api.submitScore(skor); ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      oyun._paylas = 'Mayın Tarlası · ' + (O.tur === 'g' ? 'günün tahtası #' + (GN + 1) : ZOR[z].ad) + ': ' + sure() + '\nerdevelop.com/oyunlar/#o/mayin';
      son(`<h3>🎉 Temizlendi!</h3><p>${O.tur === 'g' ? 'Günün tahtası' : ZOR[z].ad} · ${sure()}${O.ip ? ' · ' + O.ip + ' ipucu' : ''}<br>${skor} puan${rekor ? ' · 🏆 en iyi süre' : D.en[z] ? ' · en iyi ' + ((D.en[z] / 60) | 0) + ':' + String(D.en[z] % 60).padStart(2, '0') : ''}</p><button class="my-b ana" data-a="yeni">Yeni tahta</button>${O.tur !== 'g' && D.gunB !== GN ? '<button class="my-b" data-z="g">Günün tahtası</button>' : z < 3 && O.tur !== 'g' ? '<button class="my-b" data-z="' + (z + 1) + '">' + ZOR[z + 1].ad + ' dene</button>' : ''}`);
    }
    function son(html) { const s = E('div', { class: 'my-son' }); s.innerHTML = html; kok.append(s); }
    function ipTemizle() { clearTimeout(ipT); H.forEach(e => e.classList.remove('ip', 'kn')); }
    function ipucu() {
      if (O.bitti) return; ipTemizle();
      if (!mayin) { const b = ((h / 2) | 0) * w + ((w / 2) | 0); H[b].classList.add('ip'); return bilgi('Herhangi bir kareye dokunarak başla; ortalar iyi bir seçim.'); }
      const yb = dur.findIndex((d, i) => d === 2 && !mayin[i]); O.ip++;
      if (yb >= 0) { H[yb].classList.add('ip'); return bilgi('İşaretli bayrak <b>yanlış</b>: orada mayın yok. Önce onu kaldır.'); }
      const acik = dur.map(d => d === 1 ? 1 : 0), bl = new Uint8Array(w * h); let bulunan = null, mayinlar = [];
      for (let t = 0; t < 60 && !bulunan; t++) { const c = cikar(w, h, acik, say, bl, ZOR[O.z].m); if (!c.length) break; bulunan = c.find(x => x[1] === 2) || null; mayinlar.push(...c.filter(x => x[1] === 1 && dur[x[0]] !== 2)); }
      if (bulunan) { H[bulunan[0]].classList.add('ip'); if (bulunan[2] >= 0) H[bulunan[2]].classList.add('kn'); bilgi(bulunan[2] >= 0 ? `Sarı kare <b>güvenli</b>: çerçeveli <b>${say[bulunan[2]]}</b> sayısının mayınları zaten belli.` : 'Sarı kare <b>güvenli</b>: bütün mayınların yeri belli oldu.'); }
      else if (mayinlar.length) { const m = mayinlar[0]; H[m[0]].classList.add('ip'); if (m[2] >= 0) H[m[2]].classList.add('kn'); bilgi(`Sarı karede <b>mayın var</b>: çerçeveli <b>${m[2] >= 0 ? say[m[2]] : ''}</b> sayısı bunu gerektiriyor. 🚩 koy.`); }
      else { const g = dur.findIndex((d, i) => d === 0 && !mayin[i]); if (g >= 0) H[g].classList.add('ip'); bilgi('Burada mantık yetmiyor; sarı kare güvenli.'); }
      ses('click'); ipT = setTimeout(ipTemizle, 6000);
    }
    /* dokunma: kısa = aç (ya da bayrak modu), uzun = bayrak */
    let bas = null;
    T.addEventListener('pointerdown', e => { const el = e.target.closest('.my-h'); if (!el || O.bitti) return; if (e.button === 2) return; const i = +el.dataset.i; bas = { i, t: setTimeout(() => { if (bas && bas.i === i) { bas.uzun = true; if (dur[i] !== 1) bayrak(i); } }, 380), x: e.clientX, y: e.clientY }; });
    T.addEventListener('pointermove', e => { if (bas && Math.hypot(e.clientX - bas.x, e.clientY - bas.y) > 12) { clearTimeout(bas.t); bas = null; } });
    T.addEventListener('pointerup', e => { if (!bas) return; const b = bas; bas = null; clearTimeout(b.t); if (b.uzun) return; const el = e.target.closest('.my-h'); if (!el || +el.dataset.i !== b.i) return; if (bayrakMod && dur[b.i] !== 1 && mayin) bayrak(b.i); else ac(b.i); });
    T.addEventListener('pointercancel', () => { if (bas) { clearTimeout(bas.t); bas = null; } });
    T.addEventListener('contextmenu', e => { e.preventDefault(); const el = e.target.closest('.my-h'); if (el) { if (bas) { clearTimeout(bas.t); bas = null; } bayrak(+el.dataset.i); } });
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.z) return b.dataset.z === 'g' ? yeni(2, 'g') : yeni(+b.dataset.z, 's');
      if (b.dataset.mod) { bayrakMod = b.dataset.mod === 'b'; return ciz(); }
      if (b.dataset.a === 'yeni') return yeni(O.z, O.tur === 'g' ? 'g' : 's'); if (b.dataset.a === 'ipucu') return ipucu(); });
    const tusla = e => { if (e.key.toLowerCase() === 'f') { bayrakMod = !bayrakMod; ciz(); } else if (e.key.toLowerCase() === 'h') ipucu(); };
    document.addEventListener('keydown', tusla);
    const gizlen = () => kaydet(true); document.addEventListener('visibilitychange', gizlen); addEventListener('pagehide', gizlen);
    api.onCleanup(() => { document.removeEventListener('visibilitychange', gizlen); removeEventListener('pagehide', gizlen); clearInterval(tm); clearTimeout(kT); clearTimeout(ipT); document.removeEventListener('keydown', tusla); kaydet(true); root.classList.remove('my-mount'); });
    const e = D.o;
    if (e && e.mayin && e.dur && ZOR[e.z] && e.mayin.length === ZOR[e.z].w * ZOR[e.z].h && (e.tur !== 'g' || e.gun === GN)) { O = e; mayin = [...e.mayin].map(Number); dur = [...e.dur].map(Number); kur(); say = sayilar(w, h, mayin); ciz(); bilgi('Kaldığın yerden devam.'); }
    else yeni(ZOR[D.z] ? D.z : 1, 's');
    if (/[?&]mytest/.test(location.search)) window.__my = { O: () => O, mayin: () => mayin, dur: () => dur, say: () => say, ac, bayrak, uret, ZOR };
  }
});
})();
