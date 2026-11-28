/* Tavla — bilgisayara karşı ya da çevrimiçi (assets/masa.js). Kurallar: iki zar, çift atınca dört hamle, kırık pul önce girer,
   oynanabilen en çok zar oynanır (tek zar oynanabiliyorsa büyüğü), toplama ancak bütün pullar evdeyken. Mars iki sayı.
   Oyuncu 0 dizin 23→0 yönünde oynar (evi 0–5), oyuncu 1 0→23 yönünde (evi 18–23). n[i] > 0: oyuncu 0'ın pulları, < 0: oyuncu 1'in. */
(function () {
'use strict';
const TV = (() => {
  const yeni = ilk => { const n = new Array(24).fill(0); n[23] = 2; n[12] = 5; n[7] = 3; n[5] = 5; n[0] = -2; n[11] = -5; n[16] = -3; n[18] = -5; return { n, bar: [0, 0], cik: [0, 0], sira: ilk, zar: null, kalan: [], bitti: null, mars: false, tur: 1, son: null }; };
  const kopya = S => ({ n: S.n.slice(), bar: S.bar.slice(), cik: S.cik.slice(), sira: S.sira, zar: S.zar ? S.zar.slice() : null, kalan: S.kalan.slice(), bitti: S.bitti, mars: S.mars, tur: S.tur, son: S.son });
  const say = (S, p, i) => p === 0 ? Math.max(0, S.n[i]) : Math.max(0, -S.n[i]);
  const acik = (S, p, i) => say(S, 1 - p, i) <= 1;
  const evde = (S, p) => { if (S.bar[p]) return false; if (p === 0) { for (let i = 6; i < 24; i++) if (S.n[i] > 0) return false; } else for (let i = 0; i < 18; i++) if (S.n[i] < 0) return false; return true; };
  /* tek zarla yapılabilen hamleler: { f: kaynak (-1 = kırık), t: hedef (-2 = toplama), d: zar, v: vurdu mu } */
  function tek(S, p, d) {
    const H = [];
    if (S.bar[p]) { const t = p === 0 ? 24 - d : d - 1; if (acik(S, p, t)) H.push({ f: -1, t, d, v: say(S, 1 - p, t) === 1 }); return H; }
    const ev = evde(S, p);
    for (let i = 0; i < 24; i++) { if (!say(S, p, i)) continue; const t = p === 0 ? i - d : i + d;
      if (t >= 0 && t < 24) { if (acik(S, p, t)) H.push({ f: i, t, d, v: say(S, 1 - p, t) === 1 }); }
      else if (ev) { const tam = p === 0 ? t === -1 : t === 24; let geride = false; if (!tam) { if (p === 0) { for (let j = i + 1; j < 6; j++) if (S.n[j] > 0) geride = true; } else for (let j = 18; j < i; j++) if (S.n[j] < 0) geride = true; } if (tam || !geride) H.push({ f: i, t: -2, d, v: false }); } }
    return H;
  }
  function uygula(S, m, p) {
    const s = p === 0 ? 1 : -1;
    if (m.f === -1) S.bar[p]--; else S.n[m.f] -= s;
    if (m.t === -2) S.cik[p]++; else { if (say(S, 1 - p, m.t) === 1) { S.n[m.t] = 0; S.bar[1 - p]++; } S.n[m.t] += s; }
    const k = S.kalan.indexOf(m.d); if (k >= 0) S.kalan.splice(k, 1);
    S.son = { f: m.f, t: m.t, p, v: m.v ? 1 : 0, i: (S.son && S.son.i || 0) + 1 };
    if (S.cik[p] === 15) { S.bitti = p; S.mars = S.cik[1 - p] === 0; }
  }
  const anahtar = S => S.n.join(',') + '|' + S.bar + '|' + S.cik;
  /* kalan zarlarla en çok kaç hamle yapılabilir */
  function enCok(S, p, kal, bellek) {
    if (!kal.length || S.bitti != null) return 0; bellek = bellek || new Map(); const k = anahtar(S) + '#' + kal.join(''); if (bellek.has(k)) return bellek.get(k);
    let en = 0; const gor = new Set();
    for (let x = 0; x < kal.length && en < kal.length; x++) { const d = kal[x]; if (gor.has(d)) continue; gor.add(d);
      for (const m of tek(S, p, d)) { const y = kopya(S); y.kalan = kal.slice(); uygula(y, m, p); const kk = kal.slice(); kk.splice(x, 1); en = Math.max(en, 1 + enCok(y, p, kk, bellek)); if (en === kal.length) break; } }
    bellek.set(k, en); return en;
  }
  /* şu an yasal olan tek hamleler (en çok zar kuralı + büyük zar kuralı) */
  function yasal(S, p) {
    p = p == null ? S.sira : p; const kal = S.kalan; if (!kal.length || S.bitti != null) return [];
    const bellek = new Map(), mx = enCok(S, p, kal, bellek); if (!mx) return [];
    let H = []; const gor = new Set();
    for (let x = 0; x < kal.length; x++) { const d = kal[x]; if (gor.has(d)) continue; gor.add(d);
      for (const m of tek(S, p, d)) { const y = kopya(S); y.kalan = kal.slice(); uygula(y, m, p); const kk = kal.slice(); kk.splice(x, 1); if (1 + enCok(y, p, kk, bellek) === mx) H.push(m); } }
    if (mx === 1 && kal.length === 2 && kal[0] !== kal[1]) { const b = Math.max(kal[0], kal[1]); if (H.some(m => m.d === b)) H = H.filter(m => m.d === b); }
    return H;
  }
  function zarAt(S, a, b) { a = a || 1 + ((Math.random() * 6) | 0); b = b || 1 + ((Math.random() * 6) | 0); S.zar = [a, b]; S.kalan = a === b ? [a, a, a, a] : [a, b]; return S; }
  function turBitir(S) { S.sira = 1 - S.sira; S.zar = null; S.kalan = []; S.tur++; return S; }
  const pip = (S, p) => { let t = S.bar[p] * 25; for (let i = 0; i < 24; i++) t += say(S, p, i) * (p === 0 ? i + 1 : 24 - i); return t; };
  /* --- yapay zekâ: bütün hamle dizilerinin sonundaki konumu puanla --- */
  function degerlendir(S, p) {
    const r = 1 - p, benP = pip(S, p), oP = pip(S, r); let v = (oP - benP) * 1.25 + S.cik[p] * 3;
    /* temas var mı: benim en gerideki pulum rakibin en gerideki pulunu geçti mi */
    let benGeri = -1, oGeri = -1; for (let i = 0; i < 24; i++) { const d = p === 0 ? i : 23 - i; if (say(S, p, i) && d > benGeri) benGeri = d; const e = r === 0 ? i : 23 - i; if (say(S, r, i) && e > oGeri) oGeri = e; }
    if (S.bar[p]) benGeri = 24; if (S.bar[r]) oGeri = 24;
    const temas = benGeri + oGeri >= 23;
    if (temas) {
      let kapaliEv = 0;
      for (let i = 0; i < 24; i++) { const c = say(S, p, i); if (!c) continue; const d = p === 0 ? i : 23 - i;   /* d: kendi evimden uzaklık (0 = en iç) */
        if (c >= 2) { v += d < 6 ? 3.2 : d < 8 ? 2.4 : d < 12 ? 1.2 : .6; if (d < 6) kapaliEv++; if (c > 4) v -= (c - 4) * .9; }
        else {   /* açık pul: rakibin vurabileceği atış sayısına göre ceza */
          let atis = 0; for (let j = 0; j < 24; j++) { const oc = say(S, r, j); if (!oc) continue; const mesafe = r === 0 ? j - i : i - j; if (mesafe > 0 && mesafe <= 6) atis += 1; else if (mesafe > 6 && mesafe <= 11) atis += .4; }
          if (S.bar[r]) { const m = r === 0 ? 24 - i : i + 1; if (m >= 1 && m <= 6) atis += 1; }
          if (atis) v -= Math.min(1, atis * .3) * (3 + (24 - d) * .55); } }
      v += S.bar[r] * (3 + kapaliEv * 1.8); v -= S.bar[p] * 4;
      /* arka arkaya kapılar */
      let seri = 0, enSeri = 0; for (let k = 0; k < 24; k++) { const i = p === 0 ? k : 23 - k; if (say(S, p, i) >= 2) { seri++; enSeri = Math.max(enSeri, seri); } else seri = 0; } v += enSeri >= 3 ? (enSeri - 2) * 2.5 : 0;
    } else { for (let i = 0; i < 24; i++) { const c = say(S, p, i), d = p === 0 ? i : 23 - i; if (c && d >= 6) v -= c * .6; } }   /* yarış: eve girmeyenler */
    if (S.bitti === p) v += 1000 + (S.mars ? 500 : 0);
    return v;
  }
  function yzDizi(S, p, seviye) {
    const son = new Map();
    (function git(st, yol) {
      const H = yasal(st, p); if (!H.length) { const k = anahtar(st); if (!son.has(k)) son.set(k, { yol, s: st }); return; }
      if (son.size > 1500) return;
      for (const m of H) { const y = kopya(st); uygula(y, m, p); git(y, yol.concat([m])); }
    })(S, []);
    let en = null; for (const x of son.values()) { const v = degerlendir(x.s, p) + (seviye === 0 ? (Math.random() - .5) * 9 : (Math.random() - .5) * .4); if (!en || v > en.v) en = { v, yol: x.yol }; }
    return en ? en.yol : [];
  }
  return { yeni, kopya, say, tek, uygula, yasal, zarAt, turBitir, pip, yzDizi, evde, degerlendir };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = TV; return; }
window.TV = TV;
})();

/* ====================== arayüz ====================== */
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame) return;
const TV = window.TV, bekle = ms => new Promise(r => setTimeout(r, ms));
function kapak() {
  let s = '<rect width="90" height="90" fill="#7a4b2a"/><rect x="5" y="5" width="80" height="80" rx="4" fill="#e9d3a8"/><rect x="42" y="5" width="6" height="80" fill="#7a4b2a"/>';
  for (let i = 0; i < 6; i++) { const x = i < 3 ? 7 + i * 11.5 : 50 + (i - 3) * 11.5; s += `<path d="M${x} 5h10l-5 32z" fill="${i % 2 ? '#b9552f' : '#3d2a1c'}"/><path d="M${x} 85h10l-5-32z" fill="${i % 2 ? '#3d2a1c' : '#b9552f'}"/>`; }
  const p = (x, y, c) => `<circle cx="${x}" cy="${y}" r="5" fill="${c ? '#2b2118' : '#fdf6e6'}" stroke="${c ? '#000' : '#b9a57c'}" stroke-width=".8"/>`;
  s += p(12, 11, 0) + p(12, 21, 0) + p(35, 11, 1) + p(35, 21, 1) + p(35, 31, 1) + p(55, 79, 0) + p(55, 69, 0) + p(55, 59, 0) + p(78, 79, 1) + p(78, 69, 1);
  s += '<rect x="54" y="38" width="12" height="12" rx="2.500" fill="#fff" stroke="#999"/><circle cx="57.500" cy="41.500" r="1.300"/><circle cx="62.500" cy="46.500" r="1.300"/><rect x="68" y="40" width="12" height="12" rx="2.500" fill="#fff" stroke="#999"/><circle cx="74" cy="46" r="1.300"/>';
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const CSS = `
.tv-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.tv{width:min(560px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none;position:relative}
.tv h3{margin:0;font-size:19px;font-weight:800}.tv p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.tv-b{padding:12px 14px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:15px;text-align:center}.tv-b.ana{background:var(--accent);color:#fff}.tv-b:disabled{opacity:.45}
.tv-sat{display:flex;gap:8px}.tv-sat>*{flex:1;min-width:0}
.tv-menu{display:flex;flex-direction:column;gap:10px;width:min(440px,100%);margin:0 auto}
.tv-kisi{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px;padding:6px 10px;border-radius:11px;background:var(--bg2)}
.tv-kisi .pul{width:18px;height:18px;border-radius:50%;flex:none;border:1.500px solid #b9a57c;background:#fdf6e6}.tv-kisi .pul.k{background:#2b2118;border-color:#000}
.tv-kisi .ad{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tv-kisi small{font-weight:800;color:var(--ink-soft);font-variant-numeric:tabular-nums;white-space:nowrap}
.tv-kisi.sira{box-shadow:inset 0 0 0 2px var(--accent)}.tv-kisi.yok .ad{opacity:.5}
.tv-c{display:block;width:100%;flex:none;border-radius:12px;touch-action:manipulation;cursor:pointer}
.tv-alt{display:flex;gap:8px;align-items:center;min-height:48px}.tv-alt .tv-b{flex:none;padding:11px 16px}
.tv-bilgi{flex:1;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.35}.tv-bilgi b{color:var(--ink)}
.tv-son{position:absolute;inset:0;z-index:40;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 82%,transparent);border-radius:14px;animation:tvB .3s .3s both}@keyframes tvB{from{opacity:0}}
.tv-son>div{display:flex;flex-direction:column;gap:9px;align-items:stretch;text-align:center;padding:18px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(300px,88%)}.tv-son h3{font-size:23px}
`;
registerGame({
  id: 'tavla', title: 'Tavla', category: 'Masa', tags: 'tavla backgammon zar pul mars çevrimiçi online iki kişilik', odak: true, noRestart: true,
  aciklama: 'Klasik tavla: bilgisayara karşı ya da çevrimiçi bir rakiple. Yasal hamleler işaretlenir, geri alabilirsin. Mars iki sayı.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M5 4l1.500 6L8 4M9 20l1.500-6L12 20M14 4l1.500 6L17 4M18 20l1.500-6"/></svg>',
  shareText() { return this._paylas || 'Tavla: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('tv-css')) { const s = document.createElement('style'); s.id = 'tv-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('tv-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, kaz: 0, kay: 0, mars: 0, ag: 0, o: '', sev: 1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'tv' }); root.append(kok);
    let sohbetK = null, sayilanOlay = '', izle = false;
    let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, adlar = ['Sen', 'Bilgisayar'], skor = [0, 0], gecmis = [], secili = null, mesaj = '', kilit = false, bitT = 0, raf = 0, anim = null, yaziSurum = 0, sonI = 0, yazSira = Promise.resolve(), cv = null, cx = null, geo = null, yokT = 0, canli = true;

    /* ---------- menü ---------- */
    function menu() {
      temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { }
      kok.innerHTML = `<div class="tv-menu"><h3>🎲 Tavla</h3><p>${D.kaz + D.kay ? `Bilgisayara karşı: <b>${D.kaz}</b> galibiyet, ${D.kay} yenilgi${D.mars ? ' · ' + D.mars + ' mars' : ''}${D.ag ? ' · çevrimiçi ' + D.ag + ' galibiyet' : ''}` : 'Pullarını evine topla, rakipten önce bitir.'}</p>
        ${eski && eski.S && eski.S.bitti == null ? '<button class="tv-b ana" data-a="devam">▶ Yarım kalan oyuna devam</button>' : ''}
        <div class="tv-sat"><button class="tv-b ${eski && eski.S && eski.S.bitti == null ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="tv-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
        <button class="tv-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="tv-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="tv-menu"><h3>Nasıl oynanır</h3>
        <p>• Açık renk pullar senin. Pullarını saat yönünde dolaştırıp <b>sağ alttaki evine</b> getir, sonra topla. 15 pulunu ilk toplayan kazanır.</p>
        <p>• <b>Zar at</b>’a bas. Oynayabileceğin pullar işaretlenir: pula dokun, sonra yeşil hedefe dokun. Çift atarsan dört hamle yaparsın.</p>
        <p>• Rakibin <b>tek</b> duran pulunun üstüne gelirsen onu kırarsın; kırılan pul ortaya çıkar ve önce onu oyuna sokmak gerekir. İki ve daha fazla pulun olduğu haneye girilmez.</p>
        <p>• Bütün pulların evindeyken toplamaya başlarsın: pula dokun, sonra sağdaki <b>toplama hanesine</b> dokun.</p>
        <p>• Rakip hiç pul toplayamadan bitirirsen <b>mars</b> olur, iki sayı alırsın.</p>
        <a class="tv-b" href="/oyun-kurallari/tavla/" style="text-decoration:none;display:block">📖 Ayrıntılı kurallar ve ipuçları</a>
        <button class="tv-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="tv-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="tv-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'tavla', koltuk: 2, enAz: 2, botlu: false, baslik: 'Tavla', onGeri: menu, onIzle: o => { lobi = null; agBasla(o); },
        baslat: o => { const s = TV.yeni(Math.random() < .5 ? 0 : 1); s.skor = [0, 0]; o.baslat(s); },
        onOda: o => { lobi = null; agBasla(o); } });
    }
    /* ---------- oyun ekranı ---------- */
    function ekran() {
      kok.innerHTML = `<div class="tv-kisi" id="tv-k1"><span class="pul"></span><span class="ad"></span><small></small></div><canvas class="tv-c" id="tv-c"></canvas><div class="tv-kisi" id="tv-k0"><span class="pul"></span><span class="ad"></span><small></small></div>
        <div class="tv-alt"><button class="tv-b" data-a="cik">‹</button><div class="tv-bilgi" id="tv-b"></div><button class="tv-b" data-a="geri" hidden>↶ Geri al</button><button class="tv-b ana" data-a="zar" hidden>🎲 Zar at</button></div>`;
      cv = kok.querySelector('#tv-c'); cx = cv.getContext('2d'); cv.addEventListener('pointerdown', dokun); boyut(); cancelAnimationFrame(raf); raf = requestAnimationFrame(dongu);
    }
    const q = s => kok.querySelector(s);
    function boyut() {
      if (!cv) return; const W = cv.clientWidth || 340, dpr = Math.min(2, devicePixelRatio || 1), ust = cv.getBoundingClientRect().top, H = Math.round(Math.max(W * .72, Math.min(W * .98, innerHeight - ust - 118)));
      cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const pad = Math.max(5, W * .014), tw = (W - 2 * pad) / 14.1, bx = pad + 6 * tw, tray = pad + 13 * tw + tw * .1, r = Math.min(tw * .46, (H - 2 * pad) / 2 / 5.2 / 2);
      geo = { W, H, dpr, pad, tw, bx, tray, r };
    }
    /* görünüm dizini: 0 = sağ alt … 11 = sol alt, 12 = sol üst … 23 = sağ üst (benim evim hep sağ altta) */
    const gor = i => ben === 0 ? i : 23 - i, ger = d => ben === 0 ? d : 23 - d;
    const kolonX = d => { const c = d < 12 ? 11 - d : d - 12; return geo.pad + c * geo.tw + (c >= 6 ? geo.tw : 0) + geo.tw / 2; };
    function pulYeri(d, k, n) { const ust = d >= 12, aralik = Math.min(geo.r * 2, (geo.H / 2 - geo.pad - geo.r * 1.2) / Math.max(1, n - 1 || 1)), y = ust ? geo.pad + geo.r + k * aralik : geo.H - geo.pad - geo.r - k * aralik; return [kolonX(d), y]; }
    function barYeri(p, k) { const benim = p === ben, y = geo.H / 2 + (benim ? 1 : -1) * (geo.r * 1.4 + k * geo.r * 1.5); return [geo.bx + geo.tw / 2, y]; }
    const trayYeri = p => [geo.tray + geo.tw * .45, p === ben ? geo.H - geo.pad - geo.r * 1.2 : geo.pad + geo.r * 1.2];
    function yer(p, konum, st, ek) {   /* konum: dizin, -1 kırık, -2 toplanan. ek: yığındaki sıra kaydırması */
      st = st || S; if (konum === -2) return trayYeri(p); if (konum === -1) return barYeri(p, Math.max(0, st.bar[p] - 1 + (ek || 0)));
      const n = Math.abs(st.n[konum]); return pulYeri(gor(konum), Math.max(0, n - 1 + (ek || 0)), Math.max(n + (ek || 0), 1));
    }
    function pulCiz(x, y, p, r, vurgu) {
      cx.beginPath(); cx.arc(x, y + r * .08, r, 0, 7); cx.fillStyle = 'rgba(0,0,0,.25)'; cx.fill();
      cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fillStyle = p === 0 ? '#fdf6e6' : '#2b2118'; cx.fill(); cx.lineWidth = Math.max(1, r * .1); cx.strokeStyle = p === 0 ? '#b9a57c' : '#000'; cx.stroke();
      cx.beginPath(); cx.arc(x, y, r * .62, 0, 7); cx.strokeStyle = p === 0 ? 'rgba(150,120,70,.45)' : 'rgba(255,255,255,.2)'; cx.lineWidth = Math.max(1, r * .08); cx.stroke();
      if (vurgu) { cx.beginPath(); cx.arc(x, y, r * 1.08, 0, 7); cx.strokeStyle = vurgu; cx.lineWidth = Math.max(2, r * .2); cx.stroke(); }
    }
    function zarCiz(x, y, b, v, soluk) {
      cx.globalAlpha = soluk ? .35 : 1; cx.fillStyle = '#fffdf5'; cx.strokeStyle = '#8a7a5a'; cx.lineWidth = 1.5; const k = b / 2;
      cx.beginPath(); if (cx.roundRect) cx.roundRect(x - k, y - k, b, b, b * .2); else cx.rect(x - k, y - k, b, b); cx.fill(); cx.stroke(); cx.fillStyle = '#2b2118';
      const N = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v];
      N.forEach(([a, c]) => { cx.beginPath(); cx.arc(x + a * b * .26, y + c * b * .26, b * .09, 0, 7); cx.fill(); }); cx.globalAlpha = 1;
    }
    function ciz() {
      if (!S || !geo) return; const { W, H, dpr, pad, tw, bx, tray, r } = geo; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.fillStyle = '#6b4226'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#e9d3a8'; cx.fillRect(pad, pad, 6 * tw, H - 2 * pad); cx.fillRect(pad + 7 * tw, pad, 6 * tw, H - 2 * pad);
      cx.fillStyle = '#5a3720'; cx.fillRect(tray, pad, tw * .9, H - 2 * pad);
      const L = benimSira() && S.zar && !kilit ? TV.yasal(S) : [], kaynak = new Set(L.map(m => m.f)), hedef = secili != null ? L.filter(m => m.f === secili) : [];
      for (let d = 0; d < 24; d++) { const x = kolonX(d), ust = d >= 12, y0 = ust ? pad : H - pad, y1 = ust ? pad + (H / 2 - pad) * .82 : H - pad - (H / 2 - pad) * .82;
        cx.beginPath(); cx.moveTo(x - tw / 2 + 1, y0); cx.lineTo(x + tw / 2 - 1, y0); cx.lineTo(x, y1); cx.closePath(); cx.fillStyle = d % 2 ? '#b9552f' : '#4a3323'; cx.fill();
        if (hedef.some(m => m.t === ger(d))) { cx.fillStyle = 'rgba(70,200,120,.5)'; cx.fill(); cx.beginPath(); cx.arc(x, ust ? y1 + r * .2 : y1 - r * .2, r * .34, 0, 7); cx.fillStyle = '#35c275'; cx.fill(); } }
      if (hedef.some(m => m.t === -2)) { cx.fillStyle = 'rgba(70,200,120,.55)'; cx.fillRect(tray, H / 2, tw * .9, H / 2 - pad); }
      /* pullar */
      const gizle = anim ? anim.gizle : null;
      for (let i = 0; i < 24; i++) { const v = S.n[i]; if (!v) continue; const p = v > 0 ? 0 : 1; let n = Math.abs(v); const d = gor(i), goster = gizle && gizle.k === i && gizle.p === p ? n - 1 : n;
        for (let k = 0; k < goster; k++) { const [x, y] = pulYeri(d, k, n); pulCiz(x, y, p, r, k === goster - 1 && p === ben && L.length ? (secili === i ? '#3b82f6' : kaynak.has(i) ? '#35c275' : null) : null); }
        if (n > 5) { const [x, y] = pulYeri(d, n - 1, n); cx.fillStyle = p === 0 ? '#2b2118' : '#fff'; cx.font = `800 ${Math.round(r * .95)}px Nunito,system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; if (goster === n) cx.fillText(n, x, y); } }
      for (const p of [0, 1]) { const n = S.bar[p] - (gizle && gizle.k === -1 && gizle.p === p ? 1 : 0); for (let k = 0; k < n; k++) { const [x, y] = barYeri(p, k); pulCiz(x, y, p, r, p === ben && k === n - 1 && L.length ? (secili === -1 ? '#3b82f6' : kaynak.has(-1) ? '#35c275' : null) : null); } }
      for (const p of [0, 1]) { const n = S.cik[p] - (gizle && gizle.k === -2 && gizle.p === p ? 1 : 0), ust = p !== ben; for (let k = 0; k < n; k++) { const y = ust ? pad + 3 + k * ((H / 2 - pad - 8) / 15) : H - pad - 3 - (k + 1) * ((H / 2 - pad - 8) / 15); cx.fillStyle = p === 0 ? '#fdf6e6' : '#2b2118'; cx.fillRect(tray + 3, y, tw * .9 - 6, (H / 2 - pad - 8) / 15 - 1.5); } }
      /* zarlar */
      if (S.zar) { const b = Math.min(tw * .95, 36), benim = S.sira === ben, x0 = benim ? pad + 7 * tw + 3 * tw : pad + 3 * tw, kal = S.kalan.slice();
        const Z = S.zar[0] === S.zar[1] ? [S.zar[0], S.zar[0], S.zar[0], S.zar[0]] : S.zar; Z.forEach((v, k) => { const i = kal.indexOf(v), var_ = i >= 0; if (var_) kal.splice(i, 1); zarCiz(x0 + (k - (Z.length - 1) / 2) * (b + 5), H / 2, b, v, !var_); }); }
      if (anim) pulCiz(anim.x, anim.y, anim.p, r * 1.06);
    }
    function dongu(t) { raf = requestAnimationFrame(dongu); if (!canli) return; if (cv && geo && Math.abs((cv.clientWidth || geo.W) - geo.W) > 1) boyut();
      if (anim) { const k = Math.min(1, (t - anim.t0) / anim.sure), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; anim.x = anim.x0 + (anim.x1 - anim.x0) * e; anim.y = anim.y0 + (anim.y1 - anim.y0) * e - Math.sin(k * Math.PI) * geo.r * 1.2; if (k >= 1) { const f = anim.bitince; anim = null; f && f(); } }
      ciz(); }
    function ust() {
      if (!S || !q('#tv-k0')) return; const K = oda ? oda.koltuklar() : null;
      for (const p of [0, 1]) { const e = q(p === ben ? '#tv-k0' : '#tv-k1'), yok = K && K[p] && !K[p].var; e.querySelector('.pul').className = 'pul' + (p ? ' k' : ''); e.querySelector('.ad').textContent = adlar[p] + (yok ? ' (ayrıldı)' : ''); e.querySelector('small').textContent = (mod === 'ag' ? skor[p] + ' sayı · ' : '') + 'kalan ' + TV.pip(S, p); e.classList.toggle('sira', S.bitti == null && S.sira === p); e.classList.toggle('yok', !!yok); }
      const benim = benimSira() && !kilit, z = q('[data-a=zar]'), g = q('[data-a=geri]'); z.hidden = !(benim && !S.zar && S.bitti == null); g.hidden = !(benim && S.zar && gecmis.length);
      q('#tv-b').innerHTML = mesaj || (S.bitti != null ? '' : benim ? (S.zar ? (TV.yasal(S).length ? 'Yeşil çerçeveli pula, sonra hedefe dokun.' : '') : 'Sıra sende.') : `<b>${esc(adlar[S.sira])}</b> oynuyor…`);
    }
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const benimSira = () => S && S.bitti == null && S.sira === ben && !izle;
    /* bir hamleyi canlandırarak uygula */
    function oynat(m, p) { return new Promise(coz => { const [x0, y0] = yer(p, m.f); TV.uygula(S, m, p); sonI = S.son.i; const [x1, y1] = yer(p, m.t); ses(m.v ? 'bad' : m.t === -2 ? 'score' : 'tap');
      anim = { p, x0, y0, x1, y1, x: x0, y: y0, t0: performance.now(), sure: 230, gizle: { k: m.t, p }, bitince: coz }; ust(); }); }
    /* ---------- benim hamlelerim ---------- */
    function dokun(e) {
      if (!S || kilit || anim || !benimSira()) return; if (!S.zar) return zarAt();
      const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, { pad, tw, bx, tray, H } = geo; let k;
      if (x >= tray - 2) k = -2; else if (x >= bx && x < bx + tw) k = -1; else { const c = Math.max(0, Math.min(11, Math.floor((x - pad - (x > bx ? tw : 0)) / tw))); k = ger(y < H / 2 ? 12 + c : 11 - c); }
      const L = TV.yasal(S);
      if (secili != null) { const U = L.filter(m => m.f === secili && m.t === k).sort((a, b2) => a.d - b2.d); if (U.length) return yap(U[0]); if (k === secili) { const T = L.filter(m => m.f === secili); if (new Set(T.map(m => m.t)).size === 1) return yap(T.sort((a, b2) => a.d - b2.d)[0]); secili = null; return ust(); } }
      if (k !== -2 && L.some(m => m.f === k)) { secili = k; ses('click'); } else { if (secili == null && L.length && k >= 0 && TV.say(S, ben, k)) { mesaj = 'Bu pul bu zarlarla oynayamaz.'; ses('bad'); setTimeout(() => { mesaj = ''; ust(); }, 1500); } secili = null; }
      ust();
    }
    async function yap(m) { clearTimeout(bitT); gecmis.push(JSON.stringify(S)); secili = null; mesaj = ''; kilit = true; await oynat(m, ben); kilit = false; gonder(); sonra(); }
    function sonra() {
      if (S.bitti != null) return bitti();
      if (!TV.yasal(S).length) { mesaj = S.kalan.length ? 'Kalan zar oynanamıyor. Sıra geçiyor…' : 'Sıra geçiyor…'; ust(); bitT = setTimeout(turSonu, S.kalan.length ? 1300 : 800); } else ust();
    }
    function zarAt() { if (!benimSira() || S.zar || kilit) return; TV.zarAt(S); gecmis = []; mesaj = ''; ses('click'); gonder();
      if (!TV.yasal(S).length) { mesaj = `<b>${S.zar.join('-')}</b>: oynayacak hamle yok. Sıra geçiyor…`; ust(); bitT = setTimeout(turSonu, 1500); } else ust(); }
    function turSonu() { clearTimeout(bitT); if (!S || S.bitti != null || S.sira !== ben) return; TV.turBitir(S); gecmis = []; mesaj = ''; secili = null; gonder(); ust(); yerelKaydet(); if (mod === 'yz') yzOyna(); }
    function geriAl() { if (!gecmis.length || kilit || !benimSira()) return; clearTimeout(bitT); const i = S.son ? S.son.i : 0; S = JSON.parse(gecmis.pop()); S.son = Object.assign({}, S.son || {}, { i: i + 1, f: undefined }); sonI = S.son.i; secili = null; mesaj = ''; ses('click'); gonder(); ust(); }
    /* ---------- bilgisayar ---------- */
    async function yzOyna(p) {
      p = p == null ? 1 - ben : p; if (!S || S.bitti != null || S.sira !== p || kilit) return; kilit = true; const buS = S; ust(); await bekle(550); if (S !== buS || !canli) { kilit = false; return; }
      TV.zarAt(S); ses('click'); gonder(); ust(); await bekle(750); if (S !== buS || !canli) { kilit = false; return; }
      const yol = TV.yzDizi(S, p, mod === 'ag' ? 1 : sev);
      if (!yol.length) { mesaj = `${esc(adlar[p])}: <b>${S.zar.join('-')}</b>, oynayamadı.`; ust(); await bekle(1100); }
      for (const m of yol) { await oynat(m, p); gonder(); await bekle(260); if (S !== buS || !canli) { kilit = false; return; } }
      kilit = false; mesaj = ''; if (S.bitti != null) return bitti(); TV.turBitir(S); gonder(); ust(); yerelKaydet();
    }
    /* ---------- bitiş ---------- */
    function bitti() {
      clearTimeout(bitT); const kazandim = S.bitti === ben, sayi = S.mars ? 2 : 1; ust();
      { const tvA = mod + ':' + S.tur + ':' + (S.son ? S.son.i : 0) + ':' + S.cik.join('-'); if (window.Progress && kazandim && sayilanOlay !== tvA) { sayilanOlay = tvA; Progress.olay('tv_kazan'); if (S.mars) Progress.olay('tv_mars'); } }
      if (mod === 'yz') { if (kazandim) { D.kaz++; if (S.mars) D.mars++; api.submitScore(D.kaz); } else D.kay++; D.o = ''; kaydet(); }
      else if (!S.sayildi) { S.sayildi = 1; skor[S.bitti] += sayi; S.skor = skor.slice(); gonder(); if (kazandim) { D.ag++; kaydet(); } if (oda) oda.bitir(); }
      ses(kazandim ? 'win' : 'lose'); if (kazandim) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } }
      if (mod === 'ag' && oda && window.Masa && Masa.sonuc) Masa.sonuc(oda, kazandim ? 1 : 0, S.tur + ':' + (S.son ? S.son.i : 0) + ':' + S.cik.join('-'));
      oyun._paylas = 'Tavla: ' + (kazandim ? (S.mars ? 'mars ettim!' : 'kazandım.') : 'bu sefer olmadı.') + '\nerdevelop.com/oyunlar/#o/tavla';
      const e = q('.tv-son'); if (e) e.remove(); const s = E('div', { class: 'tv-son' });
      s.innerHTML = `<div><h3>${kazandim ? (S.mars ? '🏆 Mars!' : '🎉 Kazandın!') : S.mars ? 'Mars oldun' : 'Kaybettin'}</h3><p>${esc(adlar[S.bitti])} ${sayi} sayı aldı${mod === 'ag' ? ` · ${esc(adlar[0])} ${skor[0]} – ${skor[1]} ${esc(adlar[1])}` : ''}</p><button class="tv-b ana" data-a="yine">${mod === 'ag' ? 'Rövanş' : 'Yeni oyun'}</button><button class="tv-b" data-a="menu">Menü</button></div>`;
      if (mod === 'ag' && window.Masa && Masa.karsiYazi) { const kz = Masa.karsiYazi(oda); if (kz) { const p2 = document.createElement('p'); p2.className = 'ms-karsi'; p2.textContent = kz; const b1 = s.querySelector('button'); if (b1) b1.parentNode.insertBefore(p2, b1); } } kok.append(s); ust();
    }
    /* ---------- kayıt / ağ ---------- */
    function yerelKaydet() { if (mod !== 'yz' || !S) return; D.o = S.bitti == null ? JSON.stringify({ S, sev }) : ''; D.sev = sev; kaydet(); }
    function gonder() { if (mod !== 'ag' || !oda || !S) return; const kopya = JSON.parse(JSON.stringify(S)); kopya.skor = skor.slice(); yazSira = yazSira.then(async () => { const b = oda.surum(); const ok = await oda.yaz(kopya, b).catch(() => false); if (ok) yaziSurum = b + 1; }); }
    function yzBasla(s, eski) { temizle(); izle = false; mod = 'yz'; ben = 0; sev = s; adlar = ['Sen', sev ? 'Bilgisayar' : 'Bilgisayar (kolay)']; skor = [0, 0]; S = eski || TV.yeni(Math.random() < .5 ? 0 : 1); sonI = S.son ? S.son.i : 0; gecmis = []; secili = null; mesaj = eski ? 'Kaldığın yerden devam.' : S.sira === ben ? 'İlk zar senin.' : ''; kilit = false; ekran(); ust(); yerelKaydet(); if (S.sira !== ben) yzOyna(); else if (S.zar && !TV.yasal(S).length) sonra(); }
    function agBasla(o) {
      temizle(); izle = !!o.izleyici; mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; gecmis = []; secili = null; mesaj = ''; kilit = false; yaziSurum = 0; ekran(); sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('.tv-alt'), sonra: q('[data-a=cik]'), koltuk: p => q(p === ben ? '#tv-k0' : '#tv-k1') }) : null;
      odaBirak = oda.dinle(v => {
        if (!v) { mesaj = 'Oda kapandı.'; return ust(); }
        const K = oda.koltuklar(); adlar = [0, 1].map(i => K[i] ? K[i].n : 'Rakip'); const d = oda.durum(), sur = oda.surum(); if (!d) return;
        if (!S || (sur > yaziSurum && !(benimSira() && kilit))) {
          const onceki = S, yeniMac = !onceki || d.tur < onceki.tur || (onceki.bitti != null && d.bitti == null);
          if (yeniMac) { const e = q('.tv-son'); if (e) e.remove(); gecmis = []; }
          if (Array.isArray(d.skor)) skor = d.skor.slice();
          const uzak = !onceki || d.sira !== ben || onceki.sira !== ben;
          if (onceki && d.son && d.son.f !== undefined && d.son.i === sonI + 1 && d.son.p !== ben && !anim) { const [x0, y0] = yer(d.son.p, d.son.f, onceki); S = d; const [x1, y1] = yer(d.son.p, d.son.t); anim = { p: d.son.p, x0, y0, x1, y1, x: x0, y: y0, t0: performance.now(), sure: 230, gizle: { k: d.son.t, p: d.son.p }, bitince: null }; ses(d.son.v ? 'bad' : 'tap'); }
          else if (uzak || !onceki) S = d;
          if (S === d) { sonI = d.son ? d.son.i : 0; yaziSurum = Math.max(yaziSurum, sur); }
          if (S.bitti != null && !q('.tv-son')) bitti();
        }
        /* rakip koptuysa bir süre sonra onun yerine bilgisayar oynar */
        const r = 1 - ben, yok = K[r] && !K[r].var; clearTimeout(yokT);
        if (!izle && S && S.bitti == null && yok && S.sira === r && !kilit) yokT = setTimeout(() => { const K2 = oda.koltuklar(); if (K2[r] && !K2[r].var && S && S.sira === r) { mesaj = `${esc(adlar[r])} ayrıldı, yerine bilgisayar oynuyor.`; yzOyna(r).then(() => { mesaj = ''; ust(); }); } }, 15000);
        ust();
      });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(bitT); clearTimeout(yokT); cancelAnimationFrame(raf); anim = null; if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } cv = null; }
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.closest('.ms')) return; const a = b.dataset.a;
      if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const o = JSON.parse(D.o); yzBasla(o.sev == null ? 1 : o.sev, o.S); } catch (x) { menu(); } }
      else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
      else if (a === 'cik') { if (mod === 'ag' && S && S.bitti == null && !b.dataset.emin) { b.dataset.emin = 1; mesaj = 'Çıkarsan oyunu bırakmış olursun. Çıkmak için ‹’ye yeniden bas.'; ust(); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
      else if (a === 'zar') zarAt(); else if (a === 'geri') geriAl();
      else if (a === 'yine') { const e2 = q('.tv-son'); if (e2) e2.remove(); if (mod === 'ag') { const y = TV.yeni(S.bitti === 0 ? 1 : 0); y.skor = skor.slice(); S = null; oda.yeniden(y); } else yzBasla(sev, null); } });
    const boyutla = () => boyut(); addEventListener('resize', boyutla);
    const sakla = () => yerelKaydet(); addEventListener('pagehide', sakla);
    api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); removeEventListener('resize', boyutla); removeEventListener('pagehide', sakla); root.classList.remove('tv-mount'); });
    menu();
    if (/[?&]tvtest/.test(location.search)) window.__tv = { S: () => S, ben: () => ben, TV, zarAt, yap, turSonu, geo: () => geo, yer, mod: () => mod, kilit: () => kilit, koy: s => { S = s; ust(); } };
  }
});
})();
