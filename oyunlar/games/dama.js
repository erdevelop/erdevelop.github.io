/* Dama (Türk daması) — iki kişilik; bilgisayara karşı ya da çevrimiçi (assets/masa.js).
   8×8, her taraf 16 taş (ikinci ve üçüncü sıralar). Taşlar ileri ya da yana bir kare gider; geri gitmez. Alma: ileri ya da yandaki rakip taşın üstünden atlamak.
   Almak zorunludur ve en çok taş alan yol seçilmelidir; alınan taş hemen kalkar. Son sıraya varan taş dama olur: dört yöne istediği kadar gider,
   aradaki boşluklar ne olursa olsun bir rakip taşı atlayıp arkasındaki herhangi bir boş kareye konabilir; art arda almada geri dönemez.
   Hamlesi kalmayan kaybeder. Tek dama tek damaya karşı ya da 50 hamle boyunca alma ve taş ilerlemesi olmazsa berabere. */
(function () {
'use strict';
const DM = (() => {
  const Y = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const sahip = v => v > 0 ? 0 : v < 0 ? 1 : -1, dama = v => Math.abs(v) === 2;
  function yeni(ilk, o) {
    o = o || {}; const b = new Array(64).fill(0);
    for (let c = 0; c < 8; c++) { b[1 * 8 + c] = -1; b[2 * 8 + c] = -1; b[5 * 8 + c] = 1; b[6 * 8 + c] = 1; }
    return { b, sira: ilk || 0, sakin: 0, bitti: null, son: { i: 0 }, tur: o.tur || 1, skor: o.skor ? o.skor.slice() : [0, 0], hamle: 0 };
  }
  const ileriY = p => p === 0 ? -1 : 1;
  /* p'nin tüm yasal hamleleri: [{ yol:[kare…], al:[kare…] }] (en çok alma kuralı uygulanmış) */
  function hamleler(S, p) {
    const b = S.b, A = [];
    for (let k = 0; k < 64; k++) { if (sahip(b[k]) !== p) continue; almaAra(b, p, k, dama(b[k]), [k], [], null, A); }
    if (A.length) { const en = Math.max(...A.map(m => m.al.length)); return A.filter(m => m.al.length === en); }
    const L = [];
    for (let k = 0; k < 64; k++) {
      const v = b[k]; if (sahip(v) !== p) continue; const r = k >> 3, c = k & 7;
      for (const [dr, dc] of Y) {
        if (!dama(v) && dr === -ileriY(p)) continue;
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && !b[rr * 8 + cc]) { L.push({ yol: [k, rr * 8 + cc], al: [] }); if (!dama(v)) break; rr += dr; cc += dc; }
      }
    }
    return L;
  }
  function almaAra(b, p, k, dm, yol, al, gelis, A) {
    const r = k >> 3, c = k & 7; let devam = false;
    for (const [dr, dc] of Y) {
      if (!dm && dr === -ileriY(p)) continue;
      if (dm && gelis && dr === -gelis[0] && dc === -gelis[1]) continue;   /* geri dönüş yok */
      let rr = r + dr, cc = c + dc;
      if (dm) while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && !b[rr * 8 + cc]) { rr += dr; cc += dc; }
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue; const ak = rr * 8 + cc; if (sahip(b[ak]) !== 1 - p) continue;
      let lr = rr + dr, lc = cc + dc;
      while (lr >= 0 && lr < 8 && lc >= 0 && lc < 8 && !b[lr * 8 + lc]) {
        const lk = lr * 8 + lc, v = b[k], av = b[ak]; b[lk] = v; b[k] = 0; b[ak] = 0; devam = true;
        almaAra(b, p, lk, dm, yol.concat(lk), al.concat(ak), [dr, dc], A);
        b[k] = v; b[lk] = 0; b[ak] = av;
        if (!dm) break; lr += dr; lc += dc;
      }
    }
    if (!devam && al.length) A.push({ yol, al });
  }
  function uygula(S, m) {
    const p = S.sira, b = S.b, bas = m.yol[0], son = m.yol[m.yol.length - 1], v = b[bas], ilerledi = !dama(v);
    b[bas] = 0; for (const a of m.al) b[a] = 0; b[son] = v;
    let terfi = false; if (!dama(v) && (son >> 3) === (p === 0 ? 0 : 7)) { b[son] = p === 0 ? 2 : -2; terfi = true; }
    S.sakin = m.al.length || ilerledi ? 0 : S.sakin + 1; S.hamle++;
    S.son = { i: S.son.i + 1, p, yol: m.yol, al: m.al, terfi }; S.sira = 1 - p;
    const L = hamleler(S, S.sira);
    if (!L.length) S.bitti = { k: p, neden: S.b.some(x => sahip(x) === S.sira) ? 'kapandı' : 'taş kalmadı' };
    else { const t = S.b.filter(x => x), d = t.filter(dama); if ((t.length === 2 && d.length === 2) || S.sakin >= 50) S.bitti = { k: -1, neden: S.sakin >= 50 ? '50 hamle' : 'dama dama' }; }
    if (S.bitti && !S.bitti.sayildi) { S.bitti.sayildi = 1; if (S.bitti.k >= 0) S.skor[S.bitti.k]++; }
    return true;
  }
  function yap(S, p, yol) {   /* yol: yasal hamlenin kare dizisi (başlangıç + bitiş yeter) */
    if (S.bitti || S.sira !== p) return false; const L = hamleler(S, p);
    const m = L.find(x => x.yol.length === yol.length && x.yol.every((k, i) => k === yol[i])) || L.find(x => x.yol[0] === yol[0] && x.yol[x.yol.length - 1] === yol[yol.length - 1]);
    if (!m) return false; return uygula(S, m);
  }
  /* ---------- bilgisayar (alfa-beta) ---------- */
  function degerle(b, p) {
    let s = 0, n0 = 0, n1 = 0;
    for (let k = 0; k < 64; k++) { const v = b[k]; if (!v) continue; const r = k >> 3, c = k & 7, mer = (c >= 2 && c <= 5 ? 4 : 0);
      if (v === 1) { s += 100 + (6 - r) * 7 + mer + (r === 7 ? 4 : 0); n0++; } else if (v === 2) { s += 330; n0++; }
      else if (v === -1) { s -= 100 + (r - 1) * 7 + mer + (r === 0 ? 4 : 0); n1++; } else { s -= 330; n1++; } }
    if (!n1) s += 10000; if (!n0) s -= 10000;
    return p === 0 ? s : -s;
  }
  function ara(S, p, d, a, bb, bitis, dugum) {
    if (++dugum.n % 2000 === 0 && Date.now() > bitis) throw 'zaman';
    const L = hamleler(S, p); if (!L.length) return -100000 + (20 - d);
    if (d <= 0 && !L[0].al.length) return degerle(S.b, p);
    let en = -1e9;
    for (const m of L) {
      const yedek = S.b.slice(), sk = S.sakin, b0 = S.b[m.yol[0]], son = m.yol[m.yol.length - 1];
      S.b[m.yol[0]] = 0; for (const x of m.al) S.b[x] = 0; S.b[son] = b0; if (!dama(b0) && (son >> 3) === (p === 0 ? 0 : 7)) S.b[son] = p === 0 ? 2 : -2;
      const v = -ara(S, 1 - p, d - 1, -bb, -a, bitis, dugum); S.b = yedek; S.sakin = sk;
      if (v > en) en = v; if (en > a) a = en; if (a >= bb) break;
    }
    return en;
  }
  function botHamle(S, p, sev) {
    const L = hamleler(S, p); if (L.length === 1) return L[0];
    if (sev === 0 && Math.random() < .3) return L[(Math.random() * L.length) | 0];
    const kopya = { b: S.b.slice(), sakin: S.sakin }, bitis = Date.now() + (sev === 0 ? 120 : 650), dugum = { n: 0 }, maxD = sev === 0 ? 2 : 12;
    let enIyi = L[(Math.random() * L.length) | 0], sira = L.slice().sort(() => Math.random() - .5);
    try {
      for (let d = 1; d <= maxD; d++) {
        let en = -1e9, sec = null; const puan = [];
        for (const m of sira) {
          const yedek = kopya.b.slice(), b0 = kopya.b[m.yol[0]], son = m.yol[m.yol.length - 1];
          kopya.b[m.yol[0]] = 0; for (const x of m.al) kopya.b[x] = 0; kopya.b[son] = b0; if (!dama(b0) && (son >> 3) === (p === 0 ? 0 : 7)) kopya.b[son] = p === 0 ? 2 : -2;
          const v = -ara(kopya, 1 - p, d - 1, -1e9, -en, bitis, dugum); kopya.b = yedek; puan.push([m, v]);
          if (v > en) { en = v; sec = m; }
        }
        enIyi = sec; sira = puan.sort((x, y) => y[1] - x[1]).map(x => x[0]);
        if (en > 50000) break;
      }
    } catch (e) { if (e !== 'zaman') throw e; }
    return enIyi;
  }
  return { sahip, dama, yeni, hamleler, uygula, yap, botHamle, degerle };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = DM; return; }
window.DM = DM;
})();
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame || !window.DM) return;
const DM = window.DM, bekle = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TAC = '<svg viewBox="0 0 24 24"><path d="M3 17l2-10 5 5 2-7 2 7 5-5 2 10z" fill="currentColor"/></svg>';
function kapak() {
  let s = '<rect width="90" height="90" fill="#8a5a33"/>';
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) s += `<rect x="${9 + c * 12}" y="${9 + r * 12}" width="12" height="12" fill="${(r + c) % 2 ? '#e7c99a' : '#d9b27a'}"/>`;
  const t = (x, y, k) => `<circle cx="${x}" cy="${y + 1}" r="4.700" fill="rgba(0,0,0,.3)"/><circle cx="${x}" cy="${y}" r="4.700" fill="${k ? '#2a2420' : '#f4efe6'}" stroke="${k ? '#000' : '#a89f8e'}" stroke-width=".7"/>`;
  [[15, 15], [27, 15], [39, 15], [51, 27]].forEach(([x, y]) => s += t(x, y, 1)); [[27, 63], [51, 63], [63, 63], [39, 51]].forEach(([x, y]) => s += t(x, y, 0));
  s += '<path d="M36 47l1.200-4 2 2 .800-3 .800 3 2-2 1.200 4z" fill="#d4a017"/>';
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
const CSS = `
.dm-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.dm{width:min(520px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none;position:relative}
.dm h3{margin:0;font-size:19px;font-weight:800}.dm p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.dm-b{padding:11px 10px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center}.dm-b.ana{background:var(--accent);color:#fff}.dm-b:disabled{opacity:.4}
.dm-sat{display:flex;gap:8px}.dm-sat>*{flex:1;min-width:0}
.dm-menu{display:flex;flex-direction:column;gap:10px;width:min(440px,100%);margin:0 auto}
.dm-kisi{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px;padding:6px 10px;border-radius:11px;background:var(--bg2)}
.dm-kisi .t{width:18px;height:18px;border-radius:50%;flex:none;background:#f4efe6;border:1.500px solid #a89f8e}.dm-kisi .t.k{background:#2a2420;border-color:#000}
.dm-kisi .ad{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dm-kisi small{font-weight:800;color:var(--ink-soft);white-space:nowrap}
.dm-kisi.sira{box-shadow:inset 0 0 0 2px var(--accent)}.dm-kisi.yok .ad{opacity:.5}
.dm-tahta{position:relative;width:100%;aspect-ratio:1;border-radius:12px;padding:3%;background:#7a4d2a;box-shadow:inset 0 0 0 2px #5c3a20,0 4px 14px rgba(0,0,0,.25);box-sizing:border-box;touch-action:manipulation}
.dm-izgara{position:relative;width:100%;height:100%;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr)}
.dm-k{position:relative;background:#e3c391;cursor:pointer}.dm-k.k{background:#d2a96d}
.dm-k.son{background:#e8d36a}.dm-k.son.k{background:#dcc251}
.dm-k.hedef::after{content:'';position:absolute;left:34%;top:34%;width:32%;height:32%;border-radius:50%;background:rgba(22,163,74,.75)}
.dm-k.hedef.al::after{left:12%;top:12%;width:76%;height:76%;background:none;border:3px solid rgba(220,38,38,.75);box-sizing:border-box}
.dm-t{position:absolute;width:10.4%;height:10.4%;margin:.8%;border-radius:50%;transition:transform .2s ease;z-index:2;pointer-events:none;display:grid;place-items:center;box-sizing:border-box}
.dm-t::before{content:'';position:absolute;inset:0;border-radius:50%;box-shadow:0 3px 0 rgba(0,0,0,.35),inset 0 -3px 0 rgba(0,0,0,.15)}
.dm-t.b{background:radial-gradient(circle at 40% 35%,#fffdf8,#e7dfd0);border:2px solid #a89f8e}.dm-t.s{background:radial-gradient(circle at 40% 35%,#4a3f37,#211b17);border:2px solid #000}
.dm-t svg{width:62%;height:62%;color:#c9940f;filter:drop-shadow(0 1px 0 rgba(0,0,0,.4))}.dm-t.s svg{color:#f0c040}
.dm-t.oyn{box-shadow:0 0 0 3px #16a34a}.dm-t.sec{box-shadow:0 0 0 3.500px #3b82f6}.dm-t.git{opacity:0;transform:scale(.4)!important;transition:opacity .25s,transform .25s}
.dm-alt{display:flex;gap:8px;align-items:center;min-height:46px}.dm-alt .dm-b{flex:none;padding:11px 15px}
.dm-bilgi{flex:1;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.35}.dm-bilgi b{color:var(--ink)}
.dm-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 82%,transparent);border-radius:14px;animation:dmS .3s .3s both}@keyframes dmS{from{opacity:0}}
.dm-son>div{display:flex;flex-direction:column;gap:9px;text-align:center;padding:18px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(300px,88%)}.dm-son h3{font-size:23px}
`;
registerGame({
  id: 'dama', title: 'Dama', category: 'Masa', tags: 'dama türk daması checkers draughts taş iki kişilik çevrimiçi online', odak: true, noRestart: true,
  aciklama: 'Türk daması: taşlar ileri ve yana gider, almak zorunlu, en çok alan yol seçilir, son sıraya varan dama olur. Bilgisayara karşı ya da çevrimiçi.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2.500" fill="currentColor"/><circle cx="15" cy="15" r="2.500"/></svg>',
  shareText() { return this._paylas || 'Dama: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('dm-css')) { const s = document.createElement('style'); s.id = 'dm-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('dm-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, kaz: 0, kay: 0, ber: 0, ag: 0, o: '', sev: 1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'dm' }); root.append(kok);
    let sohbetK = null;
    let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, secili = -1, mesaj = '', mesajT = 0, surT = 0, canli = true, sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, vekil = '', gecmis = [], kilit = false, yazSira = Promise.resolve();
    const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
    const koltuklar = () => oda ? oda.koltuklar() : null;
    const kopuk = p => { const K = koltuklar(); return !!(K && K[p] && !K[p].var); };
    const ad = p => { if (mod === 'yz') return p === ben ? 'Sen' : sev ? 'Bilgisayar' : 'Bilgisayar (kolay)'; const K = koltuklar(); return K && K[p] ? K[p].n : 'Rakip'; };
    const benimSira = () => S && !S.bitti && S.sira === ben && !kilit;
    const gor = k => ben === 0 ? k : 63 - k;   /* ekrandaki konum */
    function mesajVer(m, sure) { mesaj = m; clearTimeout(mesajT); mesajT = setTimeout(() => { mesaj = ''; ust(); }, sure || 2200); ust(); }
    function menu() {
      temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { }
      kok.innerHTML = `<div class="dm-menu"><h3>⛀ Dama</h3><p>${D.kaz + D.kay + D.ber ? `Bilgisayara karşı <b>${D.kaz}</b> galibiyet, ${D.kay} yenilgi, ${D.ber} beraberlik${D.ag ? ' · çevrimiçi ' + D.ag + ' galibiyet' : ''}` : 'Rakibin bütün taşlarını al ya da onu hamlesiz bırak.'}</p>
        ${eski && eski.S && !eski.S.bitti ? '<button class="dm-b ana" data-a="devam">▶ Yarım kalan oyuna devam</button>' : ''}
        <div class="dm-sat"><button class="dm-b ${eski && eski.S && !eski.S.bitti ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="dm-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
        <button class="dm-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="dm-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/dama/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="dm-menu"><h3>Nasıl oynanır</h3>
        <p>• Türk daması bütün karelerde oynanır. Taşlar <b>ileri ya da yana</b> bir kare gider, geri gitmez. Beyaz başlar.</p>
        <p>• Önündeki ya da yanındaki rakip taşın arkası boşsa üstünden atlayıp onu <b>alırsın</b>. Almak <b>zorunludur</b>; birden çok yol varsa <b>en çok taş alan</b> yolu oynamalısın. Alınan taş hemen kalkar.</p>
        <p>• Karşı sıraya varan taş <b>dama</b> olur (👑): dört yöne istediği kadar gider, uzaktaki bir taşı atlayıp arkasındaki herhangi bir boş kareye konabilir. Art arda alırken geri dönemez.</p>
        <p>• Taşına dokun: gidebileceği kareler yeşil, alma hamlelerinde kırmızı halka çıkar. Hamlesi kalmayan kaybeder.</p>
        <button class="dm-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="dm-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="dm-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'dama', koltuk: 2, enAz: 2, botlu: false, baslik: 'Dama', onGeri: menu, baslat: o => o.baslat(DM.yeni(0)), onOda: o => { lobi = null; agBasla(o); } });
    }
    function ekran() {
      kok.innerHTML = `<div class="dm-kisi" id="dm-k1"><span class="t"></span><span class="ad"></span><small></small></div><div class="dm-tahta"><div class="dm-izgara" id="dm-i"></div></div>
        <div class="dm-kisi" id="dm-k0"><span class="t"></span><span class="ad"></span><small></small></div>
        <div class="dm-alt"><button class="dm-b" data-a="cik">‹</button><div class="dm-bilgi" id="dm-b"></div><button class="dm-b" data-a="geri" hidden>↶</button></div>`;
      let h = ''; for (let k = 0; k < 64; k++) h += `<div class="dm-k${((k >> 3) + (k & 7)) % 2 ? ' k' : ''}" data-k="${k}"></div>`; q('#dm-i').innerHTML = h;
    }
    function tahtaBoy() { const t = q('.dm-tahta'); if (!t) return; const ust = t.getBoundingClientRect().top, kalan = innerHeight - ust - 46 - 46 - 24, W = kok.clientWidth; t.style.width = Math.max(240, Math.min(W, kalan)) + 'px'; t.style.alignSelf = 'center'; }
    function hedefler() { if (!benimSira() || secili < 0) return []; return DM.hamleler(S, ben).filter(m => m.yol[0] === secili); }
    function ciz() {
      if (!S || !q('#dm-i')) return; tahtaBoy(); const L = benimSira() ? DM.hamleler(S, ben) : [], oyn = new Set(L.map(m => m.yol[0])), H = hedefler(), hs = new Map(H.map(m => [m.yol[m.yol.length - 1], m]));
      const sonK = new Set(S.son && S.son.yol ? S.son.yol : []);
      q('#dm-i').querySelectorAll('.dm-k').forEach(e => { const g = +e.dataset.k, k = gor(g); e.classList.toggle('son', sonK.has(k)); e.classList.toggle('hedef', hs.has(k)); e.classList.toggle('al', hs.has(k) && hs.get(k).al.length > 0); });
      const iz = q('#dm-i'); iz.querySelectorAll('.dm-t').forEach(x => x.remove());
      for (let k = 0; k < 64; k++) { const v = S.b[k]; if (!v) continue; const g = gor(k), t = document.createElement('div');
        t.className = 'dm-t ' + (v > 0 ? 'b' : 's') + (oyn.has(k) && secili < 0 ? ' oyn' : '') + (secili === k ? ' sec' : ''); t.dataset.k = k;
        t.style.left = (g & 7) * 12.5 + '%'; t.style.top = (g >> 3) * 12.5 + '%'; if (DM.dama(v)) t.innerHTML = TAC; iz.appendChild(t); }
      ust();
    }
    function ust() {
      if (!S || !q('#dm-k0')) return; const K = koltuklar(), say = p => S.b.filter(v => DM.sahip(v) === p).length;
      for (const p of [0, 1]) { const e = q(p === ben ? '#dm-k0' : '#dm-k1'), yok = K && K[p] && !K[p].var; e.querySelector('.t').className = 't' + (p ? ' k' : ''); e.querySelector('.ad').textContent = ad(p) + (yok ? ' (ayrıldı)' : '');
        e.querySelector('small').textContent = `${say(p)} taş${mod === 'ag' ? ' · ' + S.skor[p] + ' galibiyet' : ''}`; e.classList.toggle('sira', !S.bitti && S.sira === p); e.classList.toggle('yok', !!yok); }
      const L = benimSira() ? DM.hamleler(S, ben) : [], zor = L.length && L[0].al.length;
      q('#dm-b').innerHTML = mesaj || (S.bitti ? '' : benimSira() ? (zor ? `<b>Almak zorunlu</b>${L[0].al.length > 1 ? ` (${L[0].al.length} taş)` : ''}: yeşil çerçeveli taşa dokun.` : secili >= 0 ? 'Gideceği kareye dokun.' : 'Sıra sende: bir taşına dokun.') : `<b>${esc(ad(S.sira))}</b> düşünüyor…`);
      q('[data-a=geri]').hidden = !(mod === 'yz' && gecmis.length && !S.bitti);
    }
    /* hamleyi adım adım canlandır */
    async function canlandir(m, p) {
      const iz = q('#dm-i'); if (!iz) return; const t = iz.querySelector(`.dm-t[data-k="${m.yol[0]}"]`); if (!t) return;
      for (let i = 1; i < m.yol.length; i++) { const g = gor(m.yol[i]); t.style.left = (g & 7) * 12.5 + '%'; t.style.top = (g >> 3) * 12.5 + '%'; t.style.transition = 'left .2s ease,top .2s ease';
        if (m.al[i - 1] != null) { const a = iz.querySelector(`.dm-t[data-k="${m.al[i - 1]}"]`); if (a) a.classList.add('git'); ses('score'); } else ses('tap'); await bekle(210); }
    }
    async function oyna(m, p) {
      kilit = true; secili = -1; const Y = kopya(S); if (!DM.uygula(Y, m)) { kilit = false; return; }
      if (mod === 'yz' && p === ben) gecmis.push(JSON.stringify(S));
      await canlandir(m, p); if (!canli) return; kilit = false; S = Y; if (Y.son.terfi) ses('win');
      if (mod === 'ag') gonder(); else yerelKaydet(); ciz(); if (S.bitti) bitti(); else surucu();
    }
    function dokun(e) {
      const h = e.target.closest('.dm-k'); if (!h || !S || !benimSira()) return; const k = gor(+h.dataset.k), L = DM.hamleler(S, ben);
      if (secili >= 0) { const M = L.filter(m => m.yol[0] === secili && m.yol[m.yol.length - 1] === k); if (M.length) return oyna(M[0], ben); }
      if (L.some(m => m.yol[0] === k)) { secili = secili === k ? -1 : k; ses('click'); return ciz(); }
      if (DM.sahip(S.b[k]) === ben) { secili = -1; ciz(); const zor = L.length && L[0].al.length; return mesajVer(zor ? 'Almak zorunlu: başka bir taşınla almalısın.' : 'Bu taş şu an oynayamaz.'); }
      secili = -1; ciz();
    }
    function surucu() {
      clearTimeout(surT); if (!S || S.bitti || !canli) return; const p = S.sira; let sure;
      if (mod === 'yz') { if (p === ben) return; sure = 350; }
      else { const K = koltuklar(), bagli = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0 && i !== p); if (!bagli.length || bagli[0] !== ben || !K[p] || K[p].var) return; sure = 15000; }
      const i0 = S.son.i, tur0 = S.tur; surT = setTimeout(() => { if (!S || S.bitti || S.sira !== p || S.son.i !== i0 || S.tur !== tur0 || !canli || kilit) return; if (mod === 'ag') mesajVer(`${esc(ad(p))} ayrıldı, yerine bilgisayar oynuyor.`, 4000); const m = DM.botHamle(S, p, mod === 'yz' ? sev : 1); oyna(m, p); }, sure);
    }
    function geriAl() { if (!gecmis.length || kilit || mod !== 'yz') return; clearTimeout(surT); S = JSON.parse(gecmis.pop()); secili = -1; ses('click'); yerelKaydet(); ciz(); surucu(); }
    function bitti() {
      clearTimeout(surT); const b = S.bitti, anahtar = mod + ':' + S.tur + ':' + (oda ? oda.kod : '') + ':' + S.hamle, kaz = b.k === ben;
      if (sayilan !== anahtar) { sayilan = anahtar;
        if (mod === 'yz') { if (b.k < 0) D.ber++; else if (kaz) { D.kaz++; api.submitScore(D.kaz); } else D.kay++; D.o = ''; kaydet(); } else { if (kaz) { D.ag++; kaydet(); } if (oda) oda.bitir(); }
        ses(kaz ? 'win' : b.k < 0 ? 'click' : 'lose'); if (kaz) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } }
      if (mod === 'ag' && oda && window.Masa && Masa.sonuc) Masa.sonuc(oda, b.k < 0 ? .5 : kaz ? 1 : 0, S.tur + ':' + S.hamle);
      oyun._paylas = 'Dama: ' + (kaz ? 'kazandım!' : b.k < 0 ? 'berabere.' : 'bu sefer olmadı.') + '\nerdevelop.com/oyunlar/#o/dama';
      const e = q('.dm-son'); if (e) e.remove(); const s = E('div', { class: 'dm-son' });
      s.innerHTML = `<div><h3>${b.k < 0 ? '🤝 Berabere' : kaz ? '🎉 Kazandın!' : 'Kaybettin'}</h3><p>${b.k < 0 ? (b.neden === '50 hamle' ? '50 hamledir alma olmadı.' : 'Tek dama tek damaya karşı.') : b.neden === 'kapandı' ? (kaz ? 'Rakibin hamlesiz kaldı.' : 'Hamlen kalmadı.') : (kaz ? 'Rakibin bütün taşlarını aldın.' : 'Bütün taşların alındı.')}${mod === 'ag' ? ` · ${esc(ad(ben))} ${S.skor[ben]} – ${S.skor[1 - ben]} ${esc(ad(1 - ben))}` : ''}</p>
        <button class="dm-b ana" data-a="yine">${mod === 'ag' ? 'Rövanş' : 'Yeni oyun'}</button><button class="dm-b" data-a="menu">Menü</button></div>`;
      if (mod === 'ag' && window.Masa && Masa.karsiYazi) { const kz = Masa.karsiYazi(oda); if (kz) { const p2 = document.createElement('p'); p2.className = 'ms-karsi'; p2.textContent = kz; const b1 = s.querySelector('button'); if (b1) b1.parentNode.insertBefore(p2, b1); } } kok.append(s);
    }
    function yerelKaydet() { if (mod !== 'yz' || !S) return; D.o = S.bitti ? '' : JSON.stringify({ S, sev }); D.sev = sev; kaydet(); }
    function gonder() {
      if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
      yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
    }
    async function al(d) {
      const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
      const onceki = S; if (onceki && d.tur !== onceki.tur) { const e = q('.dm-son'); if (e) e.remove(); secili = -1; S = d; ciz(); return surucu(); }
      if (onceki && d.son && d.son.i === onceki.son.i + 1 && d.son.p !== ben && !kilit) { kilit = true; await canlandir({ yol: d.son.yol, al: d.son.al }, d.son.p); kilit = false; }
      S = d; ciz(); if (S.bitti) { if (!q('.dm-son')) bitti(); } else surucu();
    }
    function yzBasla(s, eski) { temizle(); mod = 'yz'; ben = 0; sev = s; secili = -1; mesaj = ''; gecmis = []; kilit = false; S = eski && eski.S ? eski.S : DM.yeni(0); ekran(); ciz(); yerelKaydet(); surucu(); }
    function agBasla(o) {
      temizle(); mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; secili = -1; mesaj = ''; yerelSur = 0; sonMetin = ''; bekleyen = 0; kilit = false; ekran();
      sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('.dm-alt'), sonra: q('[data-a=cik]'), koltuk: p => q(p === ben ? '#dm-k0' : '#dm-k1') }) : null;
      odaBirak = oda.dinle(v => { if (!v) { if (S) mesajVer('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben); if (!bekleyen && !kilit) al(d); else if (S) ust(); if (S && !S.bitti) surucu(); });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (b && b.closest('.ms')) return;
      if (!b) { if (e.target.closest('#dm-i')) dokun(e); return; }
      const a = b.dataset.a;
      if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const o = JSON.parse(D.o); yzBasla(o.sev == null ? 1 : o.sev, o); } catch (x) { menu(); } }
      else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
      else if (a === 'cik') { if (mod === 'ag' && S && !S.bitti && !b.dataset.emin) { b.dataset.emin = 1; mesajVer('Çıkarsan oyunu bırakmış olursun. Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
      else if (a === 'geri') geriAl();
      else if (a === 'yine') { const e2 = q('.dm-son'); if (e2) e2.remove(); if (mod === 'ag') { const y = DM.yeni(S.bitti.k === 0 ? 1 : 0, { tur: S.tur + 1, skor: S.skor }); S = null; sonMetin = ''; oda.yeniden(y); } else yzBasla(sev, null); } });
    const boyutla = () => { if (S) ciz(); }; addEventListener('resize', boyutla);
    const sakla = () => yerelKaydet(); addEventListener('pagehide', sakla);
    api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); removeEventListener('resize', boyutla); removeEventListener('pagehide', sakla); root.classList.remove('dm-mount'); });
    menu();
    if (/[?&]dmtest/.test(location.search)) window.__dm = { S: () => S, ben: () => ben, DM, oyna, kilit: () => kilit, mod: () => mod };
  }
});
})();
