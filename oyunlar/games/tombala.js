/* Tombala — 90 sayı, her oyuncuya 3 satır × 9 sütunluk (satır başına 5 sayı) bir kart. Sayılar torbadan tek tek çekilir.
   İlk satırını tamamlayan "Çinko!" der (1. çinko, 10 puan), iki satırını tamamlayan 2. çinkoyu alır (20 puan), bütün kartını kapatan "Tombala!" der (50 puan) ve el biter.
   Bilgisayarlarla ya da çevrimiçi (2–10 kişi, masayı kuran seçer; boş koltuklara bilgisayar oturur). Çekişi masadaki ilk bağlı oyuncu yürütür. */
(function () {
'use strict';
const TB = (() => {
  const PUAN = { c1: 10, c2: 20, t: 50 }, AD = { c1: '1. çinko', c2: '2. çinko', t: 'Tombala' };
  const kar = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  function kart() {
    let R; do R = [0, 1, 2].map(() => kar([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5)); while (new Set(R.flat()).size < 9);
    const K = Array(27).fill(0);
    for (let c = 0; c < 9; c++) {
      const sat = [0, 1, 2].filter(r => R[r].includes(c)), lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9;
      const N = kar(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, sat.length).sort((a, b) => a - b);
      sat.forEach((r, i) => K[r * 9 + c] = N[i]);
    }
    return K;
  }
  const ileri = (S, p, t, x) => { S.son = { i: S.son.i + 1, p, t, x: x == null ? -1 : x }; };
  function yeni(o) { o = o || {}; const n = Math.max(2, Math.min(10, o.n || (o.puan ? o.puan.length : 4))); return { kart: Array.from({ length: n }, kart), cek: [], odul: { c1: -1, c2: -1, t: -1 }, puan: o.puan ? o.puan.slice() : Array(n).fill(0), tur: o.tur || 1, son: { i: 0 }, bitti: null }; }
  const tamSatir = (S, p) => { const c = new Set(S.cek), K = S.kart[p]; return [0, 1, 2].filter(r => K.slice(r * 9, r * 9 + 9).every(n => !n || c.has(n))).length; };
  const kalan = (S, p) => { const c = new Set(S.cek); return S.kart[p].filter(n => n && !c.has(n)).length; };
  function haklar(S, p) { if (S.bitti) return []; const t = tamSatir(S, p), R = []; if (S.odul.c1 < 0 && t >= 1) R.push('c1'); if (S.odul.c1 >= 0 && S.odul.c2 < 0 && t >= 2) R.push('c2'); if (t === 3) R.push('t'); return R; }
  function iddia(S, p, tur) { if (!haklar(S, p).includes(tur)) return false; S.odul[tur] = p; S.puan[p] += PUAN[tur]; ileri(S, p, 'id', tur); if (tur === 't') S.bitti = { p }; return true; }
  function cek(S) { if (S.bitti || S.cek.length >= 90) return false; const k = new Set(S.cek), L = []; for (let n = 1; n <= 90; n++) if (!k.has(n)) L.push(n); const n = L[(Math.random() * L.length) | 0]; S.cek.push(n); ileri(S, -1, 'cek', n); return true; }
  const sonraki = S => yeni({ puan: S.puan, tur: S.tur + 1, n: S.kart.length });
  return { PUAN, AD, kart, yeni, tamSatir, kalan, haklar, iddia, cek, sonraki };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = TB; return; }
if (!window.registerGame) return;
const BOT = ['Ada', 'Efe', 'Can', 'Naz', 'Ece', 'Mert', 'Deniz', 'Eda', 'Kaan', 'Selin'], esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RENK = n => ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'][Math.min(8, Math.floor(n / 10))];
function kapak() {
  const top = (x, y, n, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${RENK(n)}"/><circle cx="${x}" cy="${y}" r="${r * .62}" fill="#fff"/><text x="${x}" y="${y + r * .3}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="${r * .82}" fill="#1f2328">${n}</text>`;
  let g = ''; for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) { const on = [[0, 2, 4, 5, 7], [1, 3, 4, 6, 8], [0, 2, 3, 6, 7]][r].includes(c); g += `<rect x="${9 + c * 8}" y="${55 + r * 9}" width="7" height="8" rx="1.500" fill="${on ? (r === 1 && c < 5 ? '#fde68a' : '#fff') : '#fecaca'}"/>`; }
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#be123c"/><rect x="6" y="52" width="78" height="33" rx="4" fill="#9f1239"/>${g}${top(28, 26, 42, 15)}${top(57, 22, 7, 11)}${top(74, 38, 88, 9)}</svg>`;
}
const CSS = `
.tb-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.tb{width:min(540px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none;position:relative}
.tb h3{margin:0;font-size:19px;font-weight:800}.tb p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.tb-b{padding:11px 8px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center}.tb-b.ana{background:var(--accent);color:#fff}.tb-b:disabled{opacity:.35}
.tb-sat{display:flex;gap:8px}.tb-sat>*{flex:1;min-width:0}.tb-ks{display:flex;align-items:center;justify-content:center;gap:10px;font-weight:800}.tb-ks .tb-b{width:46px;padding:8px 0;font-size:18px}.tb-ks b{min-width:70px;text-align:center;font-size:16px}
.tb-menu{display:flex;flex-direction:column;gap:10px;width:min(460px,100%);margin:0 auto}
.tb-ust{display:flex;align-items:center;gap:10px;padding:10px;border-radius:16px;background:linear-gradient(135deg,#9f1239,#be123c);color:#fff}
.tb-top{--r:31px;width:calc(var(--r)*2);height:calc(var(--r)*2);border-radius:50%;background:var(--c,#ccc);display:grid;place-items:center;flex:none;box-shadow:inset -4px -6px 0 rgba(0,0,0,.18),0 3px 8px rgba(0,0,0,.25)}
.tb-top b{width:64%;height:64%;border-radius:50%;background:#fff;color:#1f2328;display:grid;place-items:center;font-size:calc(var(--r)*.78);font-weight:900}
.tb-top.yeni{animation:tbT .45s}@keyframes tbT{from{transform:scale(.3) rotate(-120deg)}}
.tb-gec{display:flex;gap:5px;flex:1;flex-wrap:wrap;align-items:center}.tb-gec .tb-top{--r:14px}.tb-gec .tb-top b{font-size:11px}
.tb-say{font-weight:800;font-size:12.5px;text-align:right;line-height:1.3}.tb-say b{font-size:18px}
.tb-oy{display:grid;grid-template-columns:repeat(auto-fit,minmax(74px,1fr));gap:5px}
.tb-oy>div{padding:5px 4px;border-radius:11px;background:var(--bg2);text-align:center;font-weight:800;font-size:12px;line-height:1.25;min-width:0}
.tb-oy>div span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tb-oy>div.ben{box-shadow:inset 0 0 0 2px var(--accent)}.tb-oy>div.yok{opacity:.5}
.tb-oy small{color:var(--ink-soft);font-weight:800}.tb-oy .az{color:#be123c}
.tb-kart{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;padding:6px;border-radius:14px;background:#9f1239}
.tb-kart i{aspect-ratio:.92;border-radius:6px;background:#fecdd3;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:clamp(14px,4.6vw,22px);color:#1f2328;position:relative}
.tb-kart i.s{background:#fff;cursor:pointer}.tb-kart i.cik{background:#fde68a}.tb-kart i.cik::after{content:'';position:absolute;inset:16%;border-radius:50%;border:3px solid #be123c;opacity:.75}
.tb-kart i.tam{background:#bbf7d0}.tb-kart i.yeni{animation:tbY .6s}@keyframes tbY{40%{transform:scale(1.15);background:#fb7185}}
.tb-dug{display:flex;gap:7px}.tb-dug .tb-b{flex:1;font-size:17px;padding:13px 6px;background:#fff1f2;color:#9f1239;box-shadow:inset 0 0 0 2px #fecdd3}
.tb-dug .tb-b.hazir{background:#be123c;color:#fff;box-shadow:0 0 0 4px rgba(190,18,60,.25);animation:tbH 1s infinite}@keyframes tbH{50%{box-shadow:0 0 0 8px rgba(190,18,60,.1)}}
.tb-ayar{display:flex;gap:6px;flex-wrap:wrap}.tb-ayar button{flex:1;padding:7px 4px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:12.5px;color:var(--ink)}.tb-ayar button.ak{background:var(--accent-soft);color:var(--accent-ink)}
.tb-msg{min-height:20px;text-align:center;font-weight:800;font-size:13.5px}
.tb-pano{display:grid;grid-template-columns:repeat(10,1fr);gap:2px}.tb-pano i{font-style:normal;text-align:center;font-size:11.5px;font-weight:800;padding:3px 0;border-radius:5px;background:var(--bg2);color:var(--ink-soft)}.tb-pano i.on{background:#be123c;color:#fff}
.tb-son{position:absolute;inset:0;z-index:40;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:14px;animation:tbS .3s .2s both}@keyframes tbS{from{opacity:0}}
.tb-son>div{display:flex;flex-direction:column;gap:9px;text-align:center;padding:16px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(360px,94%);max-height:92%;overflow:auto;box-sizing:border-box}.tb-son h3{font-size:22px}
.tb-tablo{width:100%;border-collapse:collapse;font-weight:800;font-size:13.5px}.tb-tablo td{padding:4px 6px;text-align:right}.tb-tablo td:first-child{text-align:left}.tb-tablo tr.ben td{color:var(--accent-ink)}
`;
registerGame({
  id: 'tombala', title: 'Tombala', category: 'Masa', tags: 'tombala çinko yılbaşı tombalası torba sayı aile çevrimiçi online dört kişilik', odak: true, noRestart: true,
  aciklama: 'Yılbaşı tombalası: torbadan çekilen sayıları kartında işaretle, ilk satırı bitirince Çinko!, kartı kapatınca Tombala! de. Bilgisayarlarla ya da 10 kişiye kadar arkadaşlarınla çevrimiçi.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M3 16h18M9 11v10M15 11v10"/><circle cx="12" cy="6" r="3.500"/></svg>',
  shareText() { return this._paylas || 'Tombala: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('tb-css')) { const s = document.createElement('style'); s.id = 'tb-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('tb-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, el: 0, tombala: 0, cinko: 0, oto: 1, sesli: 1, hiz: 1, n: 4 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'tb' }); root.append(kok);
    let S = null, ben = 0, mod = 'yz', oda = null, odaBirak = null, lobi = null, sohbetK = null, izle = false, canli = true, surT = 0, mesajT = 0, kilit = 0, isaret = new Set(), sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, yazSira = Promise.resolve(), sonCek = 0;
    const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
    const HIZ = [4600, 3300, 2200];
    const koltuklar = () => oda ? oda.koltuklar() : null;
    const botMu = p => mod === 'yz' ? p !== ben : !(koltuklar()[p]);
    const kopuk = p => { const K = koltuklar(); return !!(K && K[p] && !K[p].var); };
    const ad = p => { if (mod === 'yz') return p === ben ? 'Sen' : BOT[p]; const K = koltuklar(); return K && K[p] ? K[p].n : BOT[p]; };
    const yonetici = () => mod === 'yz' || (() => { const K = koltuklar(), b = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0); return b.length && b[0] === ben; })();
    function oku(n) { if (!D.sesli || !('speechSynthesis' in window)) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(n)); u.lang = 'tr-TR'; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) { } }
    function mesaj(m, sure) { const x = q('#tb-msg'); if (!x) return; x.innerHTML = m; clearTimeout(mesajT); mesajT = setTimeout(() => { const y = q('#tb-msg'); if (y) y.innerHTML = ''; }, sure || 2600); }
    /* ---------- menü ---------- */
    function menu() {
      temizle();
      kok.innerHTML = `<div class="tb-menu"><h3>🎱 Tombala</h3><p>${D.el ? `<b>${D.el}</b> el oynadın · <b>${D.cinko}</b> çinko · <b>${D.tombala}</b> tombala` : 'Torbadan çekilen sayıları kartında işaretle. İlk satırını bitiren Çinko!, kartını kapatan Tombala! der.'}</p>
        <div class="tb-ks"><span>Masada</span><button class="tb-b" data-a="n" data-d="-1">−</button><b>${D.n} kişi</b><button class="tb-b" data-a="n" data-d="1">+</button></div>
        <button class="tb-b ana" data-a="yz">🤖 Bilgisayarlarla oyna (${D.n - 1} rakip)</button><button class="tb-b" data-a="ag">🌐 Çevrimiçi oyna (2–10 kişi)</button><button class="tb-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/tombala/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="tb-menu"><h3>Nasıl oynanır</h3>
        <p>• Herkesin bir kartı var: 3 satır, her satırda 5 sayı. Sütunlar onluklara göre dizilir (ilk sütun 1–9, son sütun 80–90).</p>
        <p>• Torbadan 1–90 arası sayılar tek tek çekilir ve sesli okunur. Kartındaki sayı çekilince işaretlenir (otomatik işaretlemeyi kapatıp kendin de işaretleyebilirsin).</p>
        <p>• Bir satırını ilk tamamlayan <b>Çinko!</b> düğmesine basar: <b>1. çinko</b>, 10 puan. Sonra iki satırını ilk tamamlayan <b>2. çinkoyu</b> alır: 20 puan.</p>
        <p>• Bütün kartını ilk kapatan <b>Tombala!</b> der: 50 puan ve el biter. Düğmeye basmazsan hakkın başkasına geçebilir; çabuk ol!</p>
        <p>• Yanlış çinko dersen birkaç saniye bekletilirsin.</p>
        <a class="tb-b" href="/oyun-kurallari/tombala/" style="text-decoration:none;display:block">📖 Tombala kuralları ve kart düzeni</a><button class="tb-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="tb-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="tb-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'tombala', koltuk: Math.max(2, Math.min(10, D.n || 4)), koltukSec: [2, 10], enAz: 1, botlu: true, baslik: 'Tombala', onGeri: menu, onIzle: o => { lobi = null; agBasla(o); },
        baslat: o => o.baslat(TB.yeni({ n: o.koltuklar().length })), onOda: o => { lobi = null; agBasla(o); } });
    }
    /* ---------- ekran ---------- */
    function ekran() {
      kok.innerHTML = `<div class="tb-ust"><div class="tb-top" id="tb-top"><b>–</b></div><div class="tb-gec" id="tb-gec"></div><div class="tb-say" id="tb-say"></div></div>
        <div class="tb-oy" id="tb-oy"></div><div class="tb-kart" id="tb-k"></div><div class="tb-msg" id="tb-msg"></div>
        <div class="tb-dug"><button class="tb-b" data-a="cinko">Çinko!</button><button class="tb-b" data-a="tombala">Tombala!</button></div>
        <div class="tb-ayar"><button data-a="cik" style="flex:none;width:44px">‹</button><button data-a="oto"></button><button data-a="sesli"></button>${mod === 'yz' ? '<button data-a="hiz"></button>' : ''}<button data-a="pano">🔢 Çekilenler</button></div><div id="tb-pano"></div>`;
    }
    function ciz(yeniSayi) {
      if (!S || !q('#tb-k')) return;
      const son = S.cek[S.cek.length - 1], cekS = new Set(S.cek), tp = q('#tb-top');
      tp.style.setProperty('--c', son ? RENK(son) : '#cbd5e1'); tp.querySelector('b').textContent = son || '–';
      if (yeniSayi) { tp.classList.remove('yeni'); void tp.offsetWidth; tp.classList.add('yeni'); }
      q('#tb-gec').innerHTML = S.cek.slice(-6, -1).reverse().map(n => `<div class="tb-top" style="--c:${RENK(n)}"><b>${n}</b></div>`).join('');
      q('#tb-say').innerHTML = `<b>${S.cek.length}</b>/90<br>${S.odul.c1 < 0 ? '1. çinko' : S.odul.c2 < 0 ? '2. çinko' : 'tombala'} bekleniyor`;
      q('#tb-oy').innerHTML = S.kart.map((_, p) => { const k = TB.kalan(S, p), od = ['c1', 'c2', 't'].filter(t => S.odul[t] === p).map(t => t === 't' ? '🎉' : t === 'c1' ? '①' : '②').join('');
        return `<div class="${p === ben && !izle ? 'ben' : ''}${kopuk(p) ? ' yok' : ''}"><span>${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}</span><small class="${k <= 2 ? 'az' : ''}">${k} kaldı</small> ${od}<br><small>${S.puan[p]} puan</small></div>`; }).join('');
      const K = S.kart[ben], tam = [0, 1, 2].map(r => K.slice(r * 9, r * 9 + 9).every(n => !n || cekS.has(n)));
      q('#tb-k').innerHTML = K.map((n, i) => { if (!n) return '<i></i>'; const isl = D.oto ? cekS.has(n) : isaret.has(n); return `<i class="s${isl ? ' cik' : ''}${tam[Math.floor(i / 9)] && isl ? ' tam' : ''}${yeniSayi && n === son && isl ? ' yeni' : ''}" data-n="${n}">${n}</i>`; }).join('');
      const H = izle ? [] : TB.haklar(S, ben), cb = q('[data-a=cinko]'), tb = q('[data-a=tombala]');
      cb.textContent = S.odul.c1 < 0 ? 'Çinko!' : S.odul.c2 < 0 ? '2. Çinko!' : 'Çinko ✓'; cb.disabled = S.odul.c2 >= 0 || !!S.bitti || izle; tb.disabled = !!S.bitti || izle;
      cb.classList.toggle('hazir', !!D.oto && (H.includes('c1') || H.includes('c2'))); tb.classList.toggle('hazir', !!D.oto && H.includes('t'));
      q('[data-a=oto]').textContent = D.oto ? '✔ Otomatik işaret' : '✋ Kendim işaretlerim'; q('[data-a=oto]').classList.toggle('ak', !!D.oto);
      q('[data-a=sesli]').textContent = D.sesli ? '🔊 Sesli oku' : '🔇 Sessiz'; q('[data-a=sesli]').classList.toggle('ak', !!D.sesli);
      if (q('[data-a=hiz]')) q('[data-a=hiz]').textContent = ['🐢 Yavaş', '▶ Normal', '⚡ Hızlı'][D.hiz];
      if (q('#tb-pano').innerHTML) panoCiz();
    }
    const panoCiz = () => { const c = new Set(S.cek); q('#tb-pano').innerHTML = `<div class="tb-pano">${Array.from({ length: 90 }, (_, i) => `<i class="${c.has(i + 1) ? 'on' : ''}">${i + 1}</i>`).join('')}</div>`; };
    /* ---------- akış ---------- */
    function sonDegisim(onceki) {
      if (!onceki || !S.son || S.son.i === onceki.son.i) return;
      const yeniler = S.cek.length > onceki.cek.length;
      if (yeniler) { const n = S.cek[S.cek.length - 1]; oku(n); if (S.kart[ben].includes(n)) ses('tap'); }
      for (const t of ['c1', 'c2', 't']) if (S.odul[t] >= 0 && onceki.odul[t] < 0) { const p = S.odul[t]; mesaj(`${t === 't' ? '🎉' : '🔔'} <b>${esc(ad(p))}</b>: ${TB.AD[t]}! (+${TB.PUAN[t]})`, 3500); ses(p === ben ? 'score' : 'click');
        if (p === ben && !izle) { if (t !== 't') { D.cinko++; kaydet(); } try { window.Progress && Progress.olay(t === 't' ? 'tb_tombala' : 'tb_cinko'); } catch (e) { } } }
    }
    function uygula(Y) { const onceki = S; S = Y; if (mod === 'ag') gonder(); ciz(onceki && Y.cek.length > onceki.cek.length); sonDegisim(onceki); if (S.bitti) bitti(); else surucu(); }
    function surucu() {
      clearTimeout(surT); if (izle || !S || S.bitti || !canli || !yonetici()) return;
      const bekle = mod === 'yz' ? HIZ[D.hiz] : 3300, gecen = Date.now() - sonCek;
      surT = setTimeout(tik, Math.max(400, bekle - Math.min(gecen, bekle)));
    }
    function tik() {
      if (!S || S.bitti || !canli) return; const Y = kopya(S);
      /* bilgisayar oyuncuları: hakkı olan, bir önceki çekişten beri bekleyen bot çoğu zaman söyler */
      for (let p = 0; p < Y.kart.length; p++) { if (!botMu(p) || Y.bitti) continue; const H = TB.haklar(Y, p); if (H.length && Math.random() < .72) { const t = H.includes('t') ? 't' : H[0]; TB.iddia(Y, p, t); break; } }
      if (!Y.bitti) TB.cek(Y); sonCek = Date.now(); uygula(Y);
    }
    function iddiaEt(tur, deneme) {
      if (!S || S.bitti || izle) return; if (Date.now() < kilit) return mesaj('⏳ Biraz bekle…', 1200);
      const H = TB.haklar(S, ben), t = tur === 't' ? 't' : H.includes('c1') ? 'c1' : H.includes('c2') ? 'c2' : S.odul.c1 < 0 ? 'c1' : 'c2';
      if (!H.includes(t)) { kilit = Date.now() + 3000; ses('bad'); return mesaj(t === 't' ? 'Kartın daha kapanmadı! 3 saniye bekle.' : `Henüz ${t === 'c1' ? 'tamamlanmış satırın' : 'iki tam satırın'} yok! 3 saniye bekle.`); }
      const Y = kopya(S); TB.iddia(Y, ben, t);
      if (mod === 'yz') return uygula(Y);
      const onceki = S; S = Y; ciz(); sonDegisim(onceki);
      gonder(tamam => { if (!tamam && !deneme) setTimeout(() => { if (S && TB.haklar(S, ben).includes(t)) iddiaEt(tur, 1); }, 200); });
      if (S.bitti) bitti();
    }
    function bitti() {
      clearTimeout(surT); const p = S.bitti.p, anahtar = mod + ':' + S.tur + ':' + (oda ? oda.kod : '');
      if (sayilan !== anahtar) { sayilan = anahtar; if (!izle) { D.el++; if (p === ben) { D.tombala++; api.submitScore(D.tombala); } kaydet(); } ses(p === ben ? 'win' : 'click'); if (p === ben) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } }
        if (mod === 'ag' && oda && window.Masa && Masa.sonuc && !izle) Masa.sonuc(oda, p === ben ? 1 : 0, 't' + S.tur); }
      oyun._paylas = 'Tombala: ' + (p === ben ? `${S.cek.length}. sayıda TOMBALA yaptım! 🎉` : `${S.puan[ben]} puan topladım.`) + '\nerdevelop.com/oyunlar/#o/tombala';
      const e = q('.tb-son'); if (e) e.remove(); const s = E('div', { class: 'tb-son' }), sira = S.kart.map((_, i) => i).sort((a, b) => S.puan[b] - S.puan[a]);
      s.innerHTML = `<div><h3>${p === ben && !izle ? '🎉 TOMBALA!' : `🎉 ${esc(ad(p))} tombala yaptı`}</h3><p>${S.cek.length} sayı çekildi · ${S.tur}. el</p>
        <p>${['c1', 'c2', 't'].map(t => `${TB.AD[t]}: <b>${S.odul[t] >= 0 ? esc(ad(S.odul[t])) : '–'}</b>`).join(' · ')}</p>
        <table class="tb-tablo">${sira.map(x => `<tr class="${x === ben ? 'ben' : ''}"><td>${botMu(x) ? '🤖 ' : ''}${esc(ad(x))}</td><td>${S.puan[x]} puan</td></tr>`).join('')}</table>
        <button class="tb-b ana" data-a="yine">Yeni kartlarla devam</button><button class="tb-b" data-a="menu">Menü</button></div>`;
      kok.append(s);
    }
    /* ---------- ağ ---------- */
    function gonder(sonra) {
      if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
      yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (sonra) sonra(tamam); if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
    }
    function al(d) {
      const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
      const onceki = S; S = d; if (onceki && S.tur !== onceki.tur) { const e = q('.tb-son'); if (e) e.remove(); isaret = new Set(); }
      if (onceki && S.cek.length > onceki.cek.length) sonCek = Date.now();
      ciz(onceki && S.cek.length > onceki.cek.length); if (onceki && S.tur === onceki.tur) sonDegisim(onceki);
      if (S.bitti) { if (!q('.tb-son')) bitti(); } else surucu();
    }
    function yzBasla() { temizle(); izle = false; mod = 'yz'; ben = 0; isaret = new Set(); S = TB.yeni({ n: D.n }); ekran(); ciz(); sonCek = Date.now() - 2500; mesaj('Torba karıştırıldı, ilk sayı geliyor…', 1800); surucu(); }
    function agBasla(o) {
      temizle(); izle = !!o.izleyici; mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; isaret = new Set(); yerelSur = 0; sonMetin = ''; bekleyen = 0; ekran(); sonCek = Date.now();
      sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('.tb-ayar'), sonra: q('[data-a=cik]'), koltuk: p => q('#tb-oy').children[p] }) : null;
      odaBirak = oda.dinle(v => { if (!v) { mesaj('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben); if (!bekleyen) al(d); if (S && !S.bitti) surucu(); });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); try { speechSynthesis.cancel(); } catch (e) { } if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (b && b.closest('.ms')) return;
      if (!b) { const c = e.target.closest('.tb-kart i.s'); if (c && S && !D.oto) { const n = +c.dataset.n; if (isaret.has(n)) isaret.delete(n); else if (S.cek.includes(n)) { isaret.add(n); ses('tap'); } else { ses('bad'); mesaj(`${n} daha çekilmedi.`, 1400); } ciz(); } return; }
      const a = b.dataset.a;
      if (a === 'n') { D.n = Math.max(2, Math.min(10, (D.n || 4) + +b.dataset.d)); kaydet(); return menu(); }
      if (a === 'yz') yzBasla(); else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { S = null; menu(); }
      else if (a === 'cinko') iddiaEt('c'); else if (a === 'tombala') iddiaEt('t');
      else if (a === 'oto') { D.oto = D.oto ? 0 : 1; if (!D.oto && S) isaret = new Set(S.kart[ben].filter(n => n && S.cek.includes(n))); kaydet(); ciz(); }
      else if (a === 'sesli') { D.sesli = D.sesli ? 0 : 1; kaydet(); ciz(); if (D.sesli && S && S.cek.length) oku(S.cek[S.cek.length - 1]); }
      else if (a === 'hiz') { D.hiz = (D.hiz + 1) % 3; kaydet(); ciz(); surucu(); }
      else if (a === 'pano') { const p = q('#tb-pano'); if (p.innerHTML) p.innerHTML = ''; else panoCiz(); }
      else if (a === 'cik') { if (mod === 'ag' && S && !S.bitti && !b.dataset.emin) { b.dataset.emin = 1; mesaj('Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } S = null; menu(); }
      else if (a === 'yine') { const y = TB.sonraki(S), e2 = q('.tb-son'); if (e2) e2.remove(); isaret = new Set(); if (mod === 'ag') { S = null; sonMetin = ''; oda.yeniden(y); } else { S = y; sonCek = Date.now() - 1500; ciz(); surucu(); } } });
    api.onCleanup(() => { canli = false; temizle(); root.classList.remove('tb-mount'); });
    menu();
    if (/[?&]tbtest/.test(location.search)) window.__tb = { S: () => S, TB, tik, iddiaEt, ben: () => ben, set: Y => { S = Y; ciz(); } };
  }
});
})();
