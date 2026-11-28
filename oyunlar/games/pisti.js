/* Pişti — iki kişilik; bilgisayara karşı ya da çevrimiçi (assets/masa.js).
   Yere dört kart (üstteki açık, üçü kapalı), oyunculara dörder kart. Yerdeki üst kartla aynı sayıdaki kart ya da vale yerdekilerin hepsini alır.
   Yerde tek kart varken aynı sayıyla alış pişti (10), valeyle vale almak vale piştisi (20). Eller bitince yeniden dörder dağıtılır; deste bitince yerde kalanlar son alana gider.
   Puanlar: as ve vale 1, sinek 2'si 2, karo 10'u 3, en çok kart 3. Maç 101'e. */
(function () {
'use strict';
const PI = (() => {
  const HEDEF = 101, renk = c => Math.floor(c / 13), sayi = c => c % 13, VALE = 9, AS = 12;
  const kar = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const kartPuan = c => c === 39 ? 2 : c === 34 ? 3 : sayi(c) === AS || sayi(c) === VALE ? 1 : 0;
  function yeni(dagitan, o) {
    o = o || {}; const D = kar(Array.from({ length: 52 }, (_, i) => i)), yer = D.splice(-4);
    if (sayi(yer[3]) === VALE) { const i = D.findIndex(c => sayi(c) !== VALE); [yer[3], D[i]] = [D[i], yer[3]]; }
    const el = [D.splice(-4), D.splice(-4)];
    return { el, deste: D, yer, gizli: 3, alinan: [[], []], pisti: [0, 0], vpisti: [0, 0], sonAlan: -1, dagitan, sira: 1 - dagitan, gor: [yer[3]], bitti: null,
      elNo: o.elNo || 1, puan: o.puan ? o.puan.slice() : [0, 0], gecmis: o.gecmis ? o.gecmis.map(x => Object.assign({}, x)) : [], tur: o.tur || 1, mac: o.mac ? o.mac.slice() : [0, 0], son: { i: 0 } };
  }
  const alabilir = (S, c) => S.yer.length > 0 && (sayi(c) === VALE || sayi(c) === sayi(S.yer[S.yer.length - 1]));
  function oyna(S, p, c) {
    if (S.bitti || S.sira !== p || !S.el[p].includes(c)) return false;
    S.el[p].splice(S.el[p].indexOf(c), 1); S.gor.push(c); let t = 'at', puan = 0;
    if (alabilir(S, c)) {
      const ust = S.yer[S.yer.length - 1];
      if (S.yer.length === 1 && sayi(c) === sayi(ust)) { if (sayi(c) === VALE) { S.vpisti[p]++; t = 'vp'; puan = 20; } else { S.pisti[p]++; t = 'p'; puan = 10; } } else t = 'al';
      S.alinan[p].push(...S.yer, c); S.yer = []; S.gizli = 0; S.sonAlan = p;
    } else S.yer.push(c);
    S.son = { i: S.son.i + 1, p, t, c, puan }; S.sira = 1 - p;
    if (!S.el[0].length && !S.el[1].length) {
      if (S.deste.length) { S.el[S.sira] = S.deste.splice(-4); S.el[1 - S.sira] = S.deste.splice(-4); }
      else { if (S.yer.length) { const k = S.sonAlan >= 0 ? S.sonAlan : p; S.alinan[k].push(...S.yer); S.yer = []; } skorla(S); }
    }
    return true;
  }
  function hesap(S, p) {
    const kart = S.alinan[p].reduce((a, c) => a + kartPuan(c), 0), n = S.alinan[p].length, m = S.alinan[1 - p].length, cok = n > m ? 3 : 0;
    return { kart, cok, n, pisti: S.pisti[p] * 10 + S.vpisti[p] * 20, top: kart + cok + S.pisti[p] * 10 + S.vpisti[p] * 20 };
  }
  function skorla(S) { const H = [hesap(S, 0), hesap(S, 1)]; H.forEach((h, p) => S.puan[p] += h.top); S.gecmis.push({ a: H[0].top, b: H[1].top }); S.bitti = { H }; }
  const macBitti = S => !!S.bitti && Math.max(...S.puan) >= HEDEF && S.puan[0] !== S.puan[1];
  function sonraki(S) { const mb = macBitti(S), mac = (S.mac || [0, 0]).slice(); if (mb) mac[S.puan[0] > S.puan[1] ? 0 : 1]++; return yeni(1 - S.dagitan, mb ? { tur: S.tur + 1, mac } : { elNo: S.elNo + 1, puan: S.puan, gecmis: S.gecmis, tur: S.tur + 1, mac }); }
  /* ---------- bilgisayar ---------- */
  function gorulmemis(S, p, s) { let n = 4; for (const c of S.gor) if (sayi(c) === s) n--; for (const c of S.el[p]) if (sayi(c) === s) n--; return Math.max(0, n); }
  function botOyna(S, p, sev) {
    const el = S.el[p]; if (sev === 0 && Math.random() < .45) return el[(Math.random() * el.length) | 0];
    const yerDeger = S.yer.reduce((a, c) => a + kartPuan(c), 0) + S.yer.length * .3 + S.gizli * .3;
    if (S.yer.length) {
      const ust = S.yer[S.yer.length - 1], esle = el.filter(c => sayi(c) === sayi(ust) && sayi(c) !== VALE), vale = el.filter(c => sayi(c) === VALE);
      if (esle.length) return esle.sort((a, b) => kartPuan(a) - kartPuan(b))[0];
      if (vale.length) { if (S.yer.length === 1 && sayi(ust) === VALE) return vale[0]; if (yerDeger >= 2.2 || S.yer.length >= 4 || (!S.deste.length && el.length <= 2)) return vale[0]; }
    }
    let en = 1e9, sec = el[0];
    for (const c of el) {
      const g = gorulmemis(S, p, sayi(c)), risk = S.yer.length ? (yerDeger + kartPuan(c) + 1) : 10;
      let v = g * risk + kartPuan(c) * 3 + (sayi(c) === VALE ? 14 : 0);
      if (!S.yer.length && g === 0) v -= 2;
      if (v < en) { en = v; sec = c; }
    }
    return sec;
  }
  return { HEDEF, renk, sayi, VALE, kartPuan, yeni, oyna, alabilir, hesap, macBitti, sonraki, botOyna };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = PI; return; }
window.PI = PI;
})();
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame || !window.PI) return;
const PI = window.PI, { renk, sayi } = PI, SEMBOL = ['♠', '♥', '♦', '♣'], KIRMIZI = r => r === 1 || r === 2, ADLAR = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function kapak() {
  const k = (x, y, a, d, r) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-14" y="-19" width="28" height="38" rx="3.500" fill="#fff" stroke="#c9ccd3"/><text x="-10" y="-7" font-family="Arial,sans-serif" font-weight="700" font-size="10" fill="${KIRMIZI(r) ? '#d32f2f' : '#1f2328'}">${d}</text><text y="11" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="${KIRMIZI(r) ? '#d32f2f' : '#1f2328'}">${SEMBOL[r]}</text></g>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#7a2e2e"/><circle cx="45" cy="45" r="33" fill="#943a3a"/>${k(38, 50, -12, '7', 3)}${k(52, 46, 10, '7', 1)}<text x="45" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="12" fill="#ffd34d">PİŞTİ!</text></svg>`;
}
const CSS = `
.pi-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.pi{width:min(520px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none;position:relative;--cw:68px}
.pi h3{margin:0;font-size:19px;font-weight:800}.pi p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.pi-b{padding:11px 8px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center}.pi-b.ana{background:var(--accent);color:#fff}.pi-b:disabled{opacity:.35}
.pi-sat{display:flex;gap:8px}.pi-sat>*{flex:1;min-width:0}
.pi-menu{display:flex;flex-direction:column;gap:10px;width:min(460px,100%);margin:0 auto}
.pi-k{width:var(--cw);height:calc(var(--cw)*1.42);border-radius:calc(var(--cw)*.1);background:#fff;border:1px solid #c9ccd3;box-shadow:0 2px 5px rgba(0,0,0,.28);position:relative;font-family:Nunito,system-ui,sans-serif;color:#1f2328;flex:none;box-sizing:border-box}
.pi-k.kr{color:#d32f2f}.pi-k .d{position:absolute;left:calc(var(--cw)*.08);top:calc(var(--cw)*.05);font-weight:900;font-size:calc(var(--cw)*.32);line-height:1;letter-spacing:-.05em;display:flex;flex-direction:column;align-items:center}
.pi-k .d i{font-style:normal;font-size:calc(var(--cw)*.26);line-height:1}.pi-k .m{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);font-size:calc(var(--cw)*.6);line-height:1}
.pi-k .y{position:absolute;right:calc(var(--cw)*.06);bottom:calc(var(--cw)*.04);font-size:calc(var(--cw)*.22);font-weight:900;transform:rotate(180deg)}
.pi-k.arka{background:repeating-linear-gradient(45deg,#a33d3d,#a33d3d 4px,#8e3434 4px,#8e3434 8px);border:2px solid #fff}
.pi-masa{position:relative;border-radius:16px;background:radial-gradient(ellipse at 50% 45%,#2c9160,#1b6b43);box-shadow:inset 0 0 0 4px #14532f,inset 0 0 30px rgba(0,0,0,.25);height:330px;flex:none;color:#fff}
.pi-rakip{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:5px}
.pi-rakip .kartlar{display:flex;--cw:30px}.pi-rakip .kartlar .pi-k{margin-left:-10px}.pi-rakip .kartlar .pi-k:first-child{margin:0}
.pi-ad{padding:4px 10px;border-radius:10px;background:rgba(0,0,0,.28);font-weight:800;font-size:13px;text-align:center;line-height:1.2}.pi-ad small{display:block;font-size:11.5px;opacity:.9}
.pi-ad.sira{background:#fff;color:#14532f;box-shadow:0 0 0 3px #ffd34d}.pi-ad.yok{opacity:.55}
.pi-yer{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:calc(var(--cw)*1.6);height:calc(var(--cw)*1.6)}
.pi-yer .pi-k{position:absolute;left:50%;top:50%;margin-left:calc(var(--cw)*-.5);margin-top:calc(var(--cw)*-.71)}
.pi-yer .pi-k.gel{animation:piG .3s}@keyframes piG{from{opacity:0;transform:translate(0,var(--gy)) scale(.85)}}
.pi-yer.topla .pi-k{transition:transform .35s,opacity .35s;transform:translate(0,var(--ty)) scale(.5);opacity:0}
.pi-yer .say{position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);font-size:11.5px;font-weight:800;background:rgba(0,0,0,.35);padding:2px 8px;border-radius:8px;white-space:nowrap}
.pi-deste{position:absolute;left:10px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:3px;--cw:38px;font-size:11px;font-weight:800}
.pi-bilg{position:absolute;right:8px;bottom:8px;font-size:11.5px;font-weight:800;background:rgba(0,0,0,.3);padding:4px 8px;border-radius:9px;text-align:right;line-height:1.3}
.pi-patla{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-size:34px;font-weight:900;color:#ffd34d;text-shadow:0 3px 0 #8a5a00,0 0 20px rgba(0,0,0,.4);pointer-events:none;animation:piP 1.4s forwards;white-space:nowrap;z-index:4}
@keyframes piP{0%{transform:translate(-50%,-50%) scale(.3);opacity:0}25%{transform:translate(-50%,-50%) scale(1.15);opacity:1}75%{opacity:1}100%{transform:translate(-50%,-90%) scale(1);opacity:0}}
.pi-ben{display:flex;align-items:center;gap:8px;min-height:32px;padding:3px 10px;border-radius:11px;background:var(--bg2);font-size:13.5px;font-weight:800}
.pi-ben.sira{box-shadow:inset 0 0 0 2px var(--accent)}.pi-ben small{color:var(--ink-soft);font-weight:800;white-space:nowrap}
.pi-bilgi{flex:1;text-align:right;font-weight:700;color:var(--ink-soft);font-size:12.5px;line-height:1.25}.pi-bilgi b{color:var(--ink)}
.pi-el{display:flex;justify-content:center;gap:8px;min-height:calc(var(--cw)*1.42 + 16px);align-items:flex-end;padding-top:12px}
.pi-el .pi-k{cursor:pointer;transition:transform .12s}.pi-el .pi-k.sec{transform:translateY(-12px);box-shadow:0 0 0 3px #3b82f6,0 8px 14px rgba(0,0,0,.3)}.pi-el .pi-k.alir{box-shadow:0 0 0 2.500px #16a34a,0 2px 5px rgba(0,0,0,.28)}
.pi-el.bekle .pi-k{filter:brightness(.85)}
.pi-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:14px;animation:piS .3s .25s both}@keyframes piS{from{opacity:0}}
.pi-son>div{display:flex;flex-direction:column;gap:9px;align-items:stretch;text-align:center;padding:16px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(360px,94%)}.pi-son h3{font-size:22px}
.pi-tablo{width:100%;border-collapse:collapse;font-weight:800;font-size:13.5px;font-variant-numeric:tabular-nums}.pi-tablo th,.pi-tablo td{padding:4px 6px;text-align:right}.pi-tablo th:first-child,.pi-tablo td:first-child{text-align:left;color:var(--ink-soft)}
.pi-tablo thead th{font-size:12px}.pi-tablo tfoot td{border-top:2px solid var(--line)}
`;
const kartHtml = (c, ek, stil) => c == null || c < 0 ? `<div class="pi-k arka ${ek || ''}" ${stil || ''}></div>` : `<div class="pi-k${KIRMIZI(renk(c)) ? ' kr' : ''} ${ek || ''}" data-c="${c}" ${stil || ''}><span class="d">${ADLAR[sayi(c)]}<i>${SEMBOL[renk(c)]}</i></span><span class="m">${SEMBOL[renk(c)]}</span><span class="y">${ADLAR[sayi(c)]}</span></div>`;
registerGame({
  id: 'pisti', title: 'Pişti', category: 'Masa', tags: 'pişti pisti kart iskambil vale iki kişilik çevrimiçi online', odak: true, noRestart: true,
  aciklama: 'Klasik pişti: yerdeki kartı aynı sayıyla ya da valeyle al, tek kartı yakalayıp pişti yap. Bilgisayara karşı ya da çevrimiçi; maç 101’e.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="3" width="11" height="15" rx="2"/><rect x="9" y="6" width="11" height="15" rx="2"/><path d="M14.500 11v6M12 14h5"/></svg>',
  shareText() { return this._paylas || 'Pişti: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('pi-css')) { const s = document.createElement('style'); s.id = 'pi-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('pi-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, mac: 0, kaz: 0, ag: 0, pisti: 0, o: '', sev: 1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'pi' }); root.append(kok);
    let sohbetK = null;
    let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, secili = -1, mesaj = '', mesajT = 0, surT = 0, canli = true, sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, vekil = '', gorulenI = -1, yazSira = Promise.resolve();
    const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
    const koltuklar = () => oda ? oda.koltuklar() : null;
    const kopuk = p => { const K = koltuklar(); return !!(K && K[p] && !K[p].var); };
    const ad = p => { if (mod === 'yz') return p === ben ? 'Sen' : sev ? 'Bilgisayar' : 'Bilgisayar (kolay)'; const K = koltuklar(); return K && K[p] ? K[p].n : 'Rakip'; };
    const benimSira = () => S && !S.bitti && S.sira === ben;
    function mesajVer(m, sure) { mesaj = m; clearTimeout(mesajT); mesajT = setTimeout(() => { mesaj = ''; ciz(); }, sure || 2200); ciz(); }
    function menu() {
      temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { } const var_ = eski && eski.S && !(eski.S.bitti && PI.macBitti(eski.S));
      kok.innerHTML = `<div class="pi-menu"><h3>🃏 Pişti</h3><p>${D.mac ? `Bilgisayara karşı <b>${D.mac}</b> maç, <b>${D.kaz}</b> galibiyet · ${D.pisti} pişti${D.ag ? ' · çevrimiçi ' + D.ag + ' galibiyet' : ''}` : 'Yerdeki kartı aynı sayıyla ya da valeyle al; tek kartı yakalarsan pişti! Maç 101’e.'}</p>
        ${var_ ? `<button class="pi-b ana" data-a="devam">▶ Yarım kalan maça devam (${eski.S.puan[0]} – ${eski.S.puan[1]})</button>` : ''}
        <div class="pi-sat"><button class="pi-b ${var_ ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="pi-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
        <button class="pi-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="pi-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/pisti/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="pi-menu"><h3>Nasıl oynanır</h3>
        <p>• Yere dört kart konur: üstteki açık, alttaki üçü kapalı. Her oyuncuya dört kart dağıtılır; eller bitince desteden yeniden dörder kart gelir.</p>
        <p>• Sırayla birer kart atarsın. Attığın kart yerdeki üst kartla <b>aynı sayıdaysa</b> ya da bir <b>vale (J)</b> ise yerdeki bütün kartları alırsın. Alabileceğin kartlar yeşil çerçevelidir.</p>
        <p>• Yerde <b>tek kart</b> varken onu aynı sayıyla alırsan <b>pişti</b>: 10 puan. Tek valeyi valeyle alırsan <b>vale piştisi</b>: 20 puan.</p>
        <p>• Elin sonunda: her as ve vale 1, <b>sinek 2’si</b> 2, <b>karo 10’u</b> 3 puan; en çok kartı toplayan 3 puan. Deste bitince yerde kalanlar son alana gider.</p>
        <p>• Karta dokun, atmak için yeniden dokun. Maçı ilk 101’e ulaşan kazanır.</p>
        <a class="pi-b" href="/oyun-kurallari/pisti/" style="text-decoration:none;display:block">📖 Ayrıntılı kurallar ve ipuçları</a>
        <button class="pi-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="pi-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="pi-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'pisti', koltuk: 2, enAz: 2, botlu: false, baslik: 'Pişti', onGeri: menu, baslat: o => o.baslat(PI.yeni((Math.random() * 2) | 0)), onOda: o => { lobi = null; agBasla(o); } });
    }
    function ekran() {
      kok.innerHTML = `<div class="pi-masa" id="pi-m"></div><div class="pi-ben" id="pi-ben"><b></b><small></small><span class="pi-bilgi" id="pi-b"></span></div><div class="pi-el" id="pi-e"></div>
        <div class="pi-sat"><button class="pi-b" data-a="cik" style="flex:none;width:44px">‹</button><button class="pi-b" data-a="durum" style="flex:1">Puan durumu</button></div>`;
    }
    function olcu() {
      const W = kok.clientWidth || 340, cw = Math.max(54, Math.min(84, Math.round((W - 40) / 4.6))); kok.style.setProperty('--cw', cw + 'px');
      const m = q('#pi-m'); if (m) { const ust = m.getBoundingClientRect().top, alt = cw * 1.42 + 16 + 12 + 32 + 44 + 8 * 3 + 14; m.style.height = Math.round(Math.max(250, Math.min(380, innerHeight - ust - alt))) + 'px'; }
    }
    function ciz(gel, topla) {
      if (!S || !q('#pi-m')) return; olcu(); const r = 1 - ben, bS = benimSira();
      const kisa = p => `${S.alinan[p].length} kart${S.pisti[p] + S.vpisti[p] ? ' · ' + (S.pisti[p] + S.vpisti[p]) + ' pişti' : ''}`;
      let h = `<div class="pi-rakip"><div class="kartlar">${S.el[r].map(() => kartHtml(-1)).join('')}</div><div class="pi-ad${S.sira === r && !S.bitti ? ' sira' : ''}${kopuk(r) ? ' yok' : ''}">${mod === 'yz' ? '🤖 ' : ''}${esc(ad(r))}${kopuk(r) ? ' (ayrıldı)' : ''}<small>${S.puan[r]} puan · ${kisa(r)}</small></div></div>`;
      h += `<div class="pi-deste">${S.deste.length ? kartHtml(-1) : ''}<span>${S.deste.length ? S.deste.length + ' kart' : 'deste bitti'}</span></div>`;
      const n = S.yer.length, gy = S.son && S.son.p === ben ? '120px' : '-120px', ty = topla ? (topla.p === ben ? '160px' : '-160px') : '0';
      const goster = topla ? topla.yer : S.yer, gizliN = topla ? topla.gizli : S.gizli;
      h += `<div class="pi-yer${topla ? ' topla' : ''}" style="--ty:${ty}">${goster.map((c, i) => { const kapali = i < gizliN, k = goster.length - 1 - i; if (k > 5) return ''; return kartHtml(kapali ? -1 : c, i === goster.length - 1 && gel ? 'gel' : '', `style="--gy:${gy};transform:translate(${(i % 3 - 1) * 3 + (kapali ? -8 : 0)}px,${-k * 1.5}px) rotate(${((c * 37) % 13) - 6}deg);z-index:${i + 1}"`); }).join('')}
        ${goster.length ? `<span class="say">${goster.length} kart</span>` : ''}</div>`;
      h += `<div class="pi-bilg">${S.elNo}. el · hedef ${PI.HEDEF}<br>${esc(ad(ben))} ${S.puan[ben]} – ${S.puan[r]}</div>`;
      q('#pi-m').innerHTML = h;
      if (secili >= 0 && !S.el[ben].includes(secili)) secili = -1;
      const e = q('#pi-e'); e.classList.toggle('bekle', !bS); e.innerHTML = S.el[ben].map(c => kartHtml(c, (secili === c ? 'sec ' : '') + (bS && PI.alabilir(S, c) ? 'alir' : ''))).join('');
      const bn = q('#pi-ben'); bn.classList.toggle('sira', !!bS); bn.querySelector('b').textContent = ad(ben); bn.querySelector('small').textContent = `${S.puan[ben]} puan · ${kisa(ben)}`;
      q('#pi-b').innerHTML = mesaj || (S.bitti ? '' : bS ? (secili >= 0 ? 'Atmak için karta <b>yeniden dokun</b>.' : S.yer.length === 1 && S.el[ben].some(c => sayi(c) === sayi(S.yer[0])) ? '<b>Pişti fırsatı!</b>' : 'Sıra sende: bir kart seç.') : `<b>${esc(ad(S.sira))}</b> oynuyor…`);
    }
    function patla(yazi) { const m = q('#pi-m'); if (!m) return; const p = document.createElement('div'); p.className = 'pi-patla'; p.textContent = yazi; m.appendChild(p); setTimeout(() => p.remove(), 1500); }
    /* bir hamlenin sonucunu canlandır: kart yere gelir, alındıysa toplanır */
    function goster(onceki) {
      const s = S.son; if (!s || s.i === gorulenI) return ciz(); gorulenI = s.i;
      if (s.t === 'at') { ses('tap'); return ciz(true); }
      const ara = Object.assign({}, S, { yer: onceki.yer.concat(s.c), gizli: onceki.gizli });
      const gercek = S; S = ara; ciz(true); S = gercek;
      if (s.t === 'p' || s.t === 'vp') { patla(s.t === 'vp' ? 'VALE PİŞTİ! +20' : 'PİŞTİ! +10'); ses('win'); } else ses('score');
      setTimeout(() => { if (S !== gercek) return; ciz(false, { p: s.p, yer: onceki.yer.concat(s.c), gizli: onceki.gizli }); setTimeout(() => { if (S === gercek) ciz(); }, 380); }, 520);
    }
    function uygula(Y) { const onceki = S; S = Y; if (mod === 'ag') gonder(); else yerelKaydet(); goster(onceki); if (S.bitti) setTimeout(() => { if (S === Y) bitti(); }, 1100); else surucu(); }
    function kartDokun(c) {
      if (!S || S.bitti) return; if (!benimSira()) { secili = secili === c ? -1 : c; return ciz(); }
      if (secili === c) { secili = -1; const Y = kopya(S); if (!PI.oyna(Y, ben, c)) return; if (mod === 'yz' && (Y.son.t === 'p' || Y.son.t === 'vp')) { D.pisti++; kaydet(); } if (window.Progress && (Y.son.t === 'p' || Y.son.t === 'vp')) Progress.olay(Y.son.t === 'vp' ? 'vpisti' : 'pisti'); uygula(Y); } else { secili = c; ses('click'); ciz(); }
    }
    function surucu() {
      clearTimeout(surT); if (!S || S.bitti || !canli) return; const p = S.sira; let sure;
      if (mod === 'yz') { if (p === ben) return; sure = 950; }
      else { const K = koltuklar(), bagli = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0 && i !== p); if (!bagli.length || bagli[0] !== ben) return; sure = vekil === p + ':' + S.tur + ':' + S.son.i ? 900 : !K[p] || !K[p].var ? 12000 : 60000; }
      const i0 = S.son.i, tur0 = S.tur; surT = setTimeout(() => { if (!S || S.bitti || S.sira !== p || S.son.i !== i0 || S.tur !== tur0 || !canli) return; botAdim(p); }, sure);
    }
    function botAdim(p) { const Y = kopya(S); PI.oyna(Y, p, PI.botOyna(Y, p, mod === 'yz' ? sev : 1)); if (p === ben) secili = -1; vekil = !Y.bitti && Y.sira === p ? p + ':' + Y.tur + ':' + Y.son.i : ''; uygula(Y); }
    function tablo() {
      const H = S.bitti ? S.bitti.H : [PI.hesap(S, 0), PI.hesap(S, 1)], r = 1 - ben;
      return `<table class="pi-tablo"><thead><tr><th>Bu el</th><th>${esc(ad(ben))}</th><th>${esc(ad(r))}</th></tr></thead><tbody>
        <tr><td>Kart (${H[ben].n} – ${H[r].n})</td><td>${H[ben].cok}</td><td>${H[r].cok}</td></tr><tr><td>As, vale, ♣2, ♦10</td><td>${H[ben].kart}</td><td>${H[r].kart}</td></tr>
        <tr><td>Pişti</td><td>${H[ben].pisti}</td><td>${H[r].pisti}</td></tr><tr><td><b>El toplamı</b></td><td><b>${H[ben].top}</b></td><td><b>${H[r].top}</b></td></tr></tbody>
        <tfoot><tr><td>Maç (${PI.HEDEF}’e)</td><td><b>${S.puan[ben]}</b></td><td><b>${S.puan[r]}</b></td></tr>${(() => { const M = (S.mac || [0, 0]).slice(); if (PI.macBitti(S)) M[S.puan[0] > S.puan[1] ? 0 : 1]++; return M[0] + M[1] ? `<tr><td>Kazanılan maç</td><td><b>${M[ben]}</b></td><td><b>${M[r]}</b></td></tr>` : ''; })()}</tfoot></table>`;
    }
    function bitti() {
      clearTimeout(surT); const mb = PI.macBitti(S), anahtar = mod + ':' + S.tur + ':' + (oda ? oda.kod : ''), lider = S.puan[0] > S.puan[1] ? 0 : 1, H = S.bitti.H, r = 1 - ben;
      if (sayilan !== anahtar) { sayilan = anahtar;
        if (mod === 'yz') { if (mb) { D.mac++; if (lider === ben) { D.kaz++; api.submitScore(D.kaz); } } kaydet(); yerelKaydet(); } else { if (mb && lider === ben) { D.ag++; kaydet(); } if (oda && mb) oda.bitir(); }
        const iyi = mb ? lider === ben : H[ben].top > H[r].top; ses(iyi ? 'win' : 'lose'); if (mb && iyi) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } }
      if (mod === 'ag' && oda && window.Masa && Masa.sonuc && mb) Masa.sonuc(oda, lider === ben ? 1 : 0, 'm' + S.tur);
      oyun._paylas = 'Pişti: ' + (mb ? (lider === ben ? `maçı ${S.puan[ben]}–${S.puan[r]} kazandım!` : 'maç bitti.') : 'bir el daha.') + '\nerdevelop.com/oyunlar/#o/pisti';
      const e = q('.pi-son'); if (e) e.remove(); const s = E('div', { class: 'pi-son' });
      s.innerHTML = `<div><h3>${mb ? (lider === ben ? '🏆 Maçı kazandın!' : esc(ad(lider)) + ' maçı kazandı') : H[ben].top > H[r].top ? '👍 Eli kazandın' : H[ben].top < H[r].top ? 'Eli kaybettin' : 'El berabere'}</h3>${tablo()}
        <button class="pi-b ana" data-a="yine">${mb ? 'Yeni maç' : 'Sonraki el'}</button><button class="pi-b" data-a="menu">Menü</button></div>`;
      if (mod === 'ag' && window.Masa && Masa.karsiYazi) { const kz = Masa.karsiYazi(oda); if (kz) { const p2 = document.createElement('p'); p2.className = 'ms-karsi'; p2.textContent = kz; const b1 = s.querySelector('button'); if (b1) b1.parentNode.insertBefore(p2, b1); } } kok.append(s);
    }
    function yerelKaydet() { if (mod !== 'yz' || !S) return; D.o = S.bitti && PI.macBitti(S) ? '' : JSON.stringify({ S, sev }); D.sev = sev; kaydet(); }
    function gonder() {
      if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
      yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
    }
    function al(d) {
      const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
      const onceki = S; S = d; if (onceki && S.tur !== onceki.tur) { const e = q('.pi-son'); if (e) e.remove(); secili = -1; gorulenI = S.son.i; ciz(); surucu(); return; }
      if (onceki && S.son.i === onceki.son.i + 1) goster(onceki); else { gorulenI = S.son.i; ciz(); }
      if (S.bitti) { if (!q('.pi-son')) setTimeout(() => { if (S && S.bitti && !q('.pi-son')) bitti(); }, 1100); } else surucu();
    }
    function yzBasla(s, eski) { temizle(); mod = 'yz'; ben = 0; sev = s; secili = -1; mesaj = ''; S = eski && eski.S ? eski.S : PI.yeni((Math.random() * 2) | 0); gorulenI = S.son.i; ekran(); ciz(); yerelKaydet(); if (S.bitti) bitti(); else surucu(); }
    function agBasla(o) {
      temizle(); mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; secili = -1; mesaj = ''; yerelSur = 0; sonMetin = ''; bekleyen = 0; ekran();
      sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('[data-a=cik]').parentNode, sonra: q('[data-a=cik]'), koltuk: p => p === ben ? q('#pi-ben') : q('.pi-ad') }) : null;
      odaBirak = oda.dinle(v => { if (!v) { if (S) mesajVer('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben); if (!bekleyen) al(d); if (S && !S.bitti) surucu(); });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (b && b.closest('.ms')) return;
      if (!b) { const k = e.target.closest('.pi-el .pi-k'); if (k) kartDokun(+k.dataset.c); return; }
      const a = b.dataset.a;
      if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const o = JSON.parse(D.o); yzBasla(o.sev == null ? 1 : o.sev, o); } catch (x) { menu(); } }
      else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
      else if (a === 'cik') { if (mod === 'ag' && S && !S.bitti && !b.dataset.emin) { b.dataset.emin = 1; mesajVer('Çıkarsan masadan kalkmış olursun. Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
      else if (a === 'durum') { if (S) mesajVer(`Şu ana kadar bu el: sen ${PI.hesap(S, ben).top} · rakip ${PI.hesap(S, 1 - ben).top} (çoğunluk dahil)`, 3500); }
      else if (a === 'yine') { const y = PI.sonraki(S), e2 = q('.pi-son'); if (e2) e2.remove(); secili = -1; if (mod === 'ag') { S = null; sonMetin = ''; oda.yeniden(y); } else { S = y; gorulenI = S.son.i; ciz(); yerelKaydet(); surucu(); } } });
    const boyutla = () => { if (S) ciz(); }; addEventListener('resize', boyutla);
    const sakla = () => yerelKaydet(); addEventListener('pagehide', sakla);
    api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); removeEventListener('resize', boyutla); removeEventListener('pagehide', sakla); root.classList.remove('pi-mount'); });
    menu();
    if (/[?&]pitest/.test(location.search)) window.__pi = { S: () => S, ben: () => ben, PI, kartDokun, mod: () => mod };
  }
});
})();
