/* Batak — dört kişilik, ihaleli; bilgisayara karşı ya da çevrimiçi (assets/masa.js).
   52 kart, herkese 13. İhale 5'ten başlar; en yüksek teklifi veren kozu seçer ve ilk kartı atar. Koz kırılmadan kozla el açılmaz (elde yalnız koz yoksa).
   Atılan rengi izlemek, o renkte masadakini geçebiliyorsan geçmek zorunlu; renk yoksa koz atmak (geçebiliyorsan geçmek) zorunlu.
   İhaleyi tutturan aldığı el kadar, tutturamayan ihale kadar eksi; diğerleri aldıkları el kadar puan yazar. Maç dört el. */
(function () {
'use strict';
const BT = (() => {
  const MAC = 4, renk = c => Math.floor(c / 13), deger = c => c % 13;
  const kar = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sirala = el => el.sort((a, b) => [0, 1, 3, 2].indexOf(renk(a)) - [0, 1, 3, 2].indexOf(renk(b)) || deger(b) - deger(a));
  function yeni(dagitan, o) {
    o = o || {}; const D = kar(Array.from({ length: 52 }, (_, i) => i)), el = [0, 1, 2, 3].map(p => sirala(D.slice(p * 13, p * 13 + 13)));
    return { el, dagitan, sira: (dagitan + 1) % 4, asama: 'ihale', en: 0, kim: -1, teklif: [null, null, null, null], pas: [0, 0, 0, 0], koz: -1, masa: [], ilkAtan: -1, alinan: [0, 0, 0, 0],
      oynanan: [], kozKirik: false, sonEl: null, bitti: null, elNo: o.elNo || 1, puan: o.puan ? o.puan.slice() : [0, 0, 0, 0], gecmis: o.gecmis ? o.gecmis.map(x => x.slice()) : [], tur: o.tur || 1, esli: !!o.esli, mac: o.mac ? o.mac.slice() : [0, 0, 0, 0], son: { i: 0 } };
  }
  const ileri = (S, p, t, c) => { S.son = { i: S.son.i + 1, p, t, c: c == null ? -1 : c }; };
  /* ---------- ihale ---------- */
  const pasSay = S => S.pas.reduce((a, b) => a + b, 0);
  const pasOlur = S => !(S.en === 0 && pasSay(S) === 3);
  function teklifVer(S, p, n) {
    if (S.asama !== 'ihale' || S.sira !== p || S.pas[p]) return false;
    if (!n) { if (!pasOlur(S)) return false; S.pas[p] = 1; S.teklif[p] = 0; }
    else { if (n <= S.en || n < 5 || n > 13) return false; S.en = n; S.kim = p; S.teklif[p] = n; }
    ileri(S, p, 'ih', n);
    if (S.en && pasSay(S) === 3) { S.asama = 'koz'; S.sira = S.kim; return true; }
    let q = (p + 1) % 4; while (S.pas[q]) q = (q + 1) % 4; S.sira = q;
    if (S.en && q === S.kim) { S.asama = 'koz'; }
    return true;
  }
  function kozSec(S, p, k) { if (S.asama !== 'koz' || S.sira !== p || k < 0 || k > 3) return false; S.koz = k; S.asama = 'oyun'; S.ilkAtan = p; ileri(S, p, 'koz', k); return true; }
  /* ---------- oyun ---------- */
  function yasal(S, p) {
    const el = S.el[p], O = S.masa; if (!el.length) return [];
    if (!O.length) { if (!S.kozKirik) { const nk = el.filter(c => renk(c) !== S.koz); if (nk.length) return nk; } return el; }
    const led = renk(O[0].c), ayni = el.filter(c => renk(c) === led), kozlu = O.some(x => renk(x.c) === S.koz);
    if (ayni.length) { if (led !== S.koz && kozlu) return ayni; const ust = Math.max(...O.filter(x => renk(x.c) === led).map(x => deger(x.c))), b = ayni.filter(c => deger(c) > ust); return b.length ? b : ayni; }
    const kz = el.filter(c => renk(c) === S.koz); if (kz.length) { const ust = Math.max(-1, ...O.filter(x => renk(x.c) === S.koz).map(x => deger(x.c))), b = kz.filter(c => deger(c) > ust); return b.length ? b : kz; }
    return el;
  }
  function kazanan(S, O) { O = O || S.masa; const led = renk(O[0].c); let en = O[0]; for (const x of O) { const a = renk(x.c) === S.koz, b = renk(en.c) === S.koz; if (a && !b || (a === b && renk(x.c) === renk(en.c) && deger(x.c) > deger(en.c))) en = x; } return en.p; }
  function oyna(S, p, c) {
    if (S.asama !== 'oyun' || S.sira !== p || S.masa.length >= 4 || !yasal(S, p).includes(c)) return false;
    S.el[p].splice(S.el[p].indexOf(c), 1); S.masa.push({ p, c }); S.oynanan.push(c); if (renk(c) === S.koz) S.kozKirik = true; ileri(S, p, 'oy', c);
    S.sira = S.masa.length === 4 ? -1 : (p + 1) % 4; return true;
  }
  function topla(S) {
    if (S.masa.length !== 4) return false; const w = kazanan(S); S.alinan[w]++; S.sonEl = S.masa; S.masa = []; ileri(S, w, 'al');
    if (!S.el[w].length) { S.asama = 'bitti'; skorla(S); } else S.sira = w; return true;
  }
  const takimEl = (S, p) => S.esli ? S.alinan[p] + S.alinan[(p + 2) % 4] : S.alinan[p];
  function skorla(S) {
    const t = takimEl(S, S.kim), tuttu = t >= S.en;
    const sonuc = S.esli ? [0, 1, 2, 3].map(p => (p % 2) === (S.kim % 2) ? (tuttu ? t : -S.en) : takimEl(S, p))
      : [0, 1, 2, 3].map(p => p === S.kim ? (tuttu ? S.alinan[p] : -S.en) : S.alinan[p]);
    S.bitti = { tuttu }; S.sonuc = sonuc; S.gecmis.push(sonuc); sonuc.forEach((v, p) => S.puan[p] += v);
  }
  const macBitti = S => !!S.bitti && S.elNo >= MAC;
  function sonraki(S) { const mb = macBitti(S), mac = (S.mac || [0, 0, 0, 0]).slice(); if (mb) { const l = [0, 1, 2, 3].sort((a, b) => S.puan[b] - S.puan[a])[0]; mac[l]++; if (S.esli) mac[(l + 2) % 4]++; } return yeni((S.dagitan + 1) % 4, mb ? { tur: S.tur + 1, mac, esli: S.esli } : { elNo: S.elNo + 1, puan: S.puan, gecmis: S.gecmis, tur: S.tur + 1, mac, esli: S.esli }); }
  /* ---------- bilgisayar ---------- */
  function tahmin(el, koz) {
    let t = 0;
    for (let r = 0; r < 4; r++) {
      const K = el.filter(c => renk(c) === r).map(deger).sort((a, b) => b - a), n = K.length;
      if (r === koz) { t += K.filter(v => v >= 10).length * .95 + Math.max(0, n - 3) * .85 + (K.includes(9) && n >= 4 ? .4 : 0); continue; }
      if (K.includes(12)) t += .95; if (K.includes(11) && n >= 2) t += .7; if (K.includes(10) && n >= 3) t += .35;
      if (koz >= 0 && n <= 1) t += (2 - n) * .35;   /* kısa renk: kozla kesme şansı */
    }
    return t;
  }
  function enIyiKoz(el) { let en = -1, k = 0; for (let r = 0; r < 4; r++) { const v = tahmin(el, r) + el.filter(c => renk(c) === r).length * .01; if (v > en) { en = v; k = r; } } return { k, t: en }; }
  let ESK = 2.2;
  function botIhale(S, p, sev) {
    const { t } = enIyiKoz(S.el[p]), hedef = Math.floor(t * 1.12 + (sev === 0 ? Math.random() * 2 - .4 : .45) + (S.esli ? ESK : 0)), n = Math.max(5, S.en + 1);
    if (!pasOlur(S)) return Math.max(5, Math.min(13, n));
    return hedef >= n && n <= 13 ? n : 0;
  }
  const botKoz = (S, p) => enIyiKoz(S.el[p]).k;
  function usta(S, c) {   /* rengindeki en yüksek kalan kart mı */
    const r = renk(c), gor = new Set(S.oynanan.concat(S.masa.map(x => x.c))); for (let d = deger(c) + 1; d < 13; d++) { const x = r * 13 + d; if (!gor.has(x)) return false; } return true;
  }
  function botOyna(S, p, sev) {
    const L = yasal(S, p).slice().sort((a, b) => deger(a) - deger(b)), koz = S.koz;
    if (sev === 0 && Math.random() < .35) return L[(Math.random() * L.length) | 0];
    if (!S.masa.length) {
      const ust = L.filter(c => usta(S, c) && renk(c) !== koz); if (ust.length) return ust[ust.length - 1];
      if (p === S.kim) { const kz = L.filter(c => renk(c) === koz); if (kz.length && usta(S, kz[kz.length - 1])) return kz[kz.length - 1]; }
      /* en kısa yan renkten küçük kart */
      const say = r => S.el[p].filter(c => renk(c) === r).length, yan = L.filter(c => renk(c) !== koz);
      const A = (yan.length ? yan : L).slice().sort((a, b) => say(renk(a)) - say(renk(b)) || deger(a) - deger(b)); return A[0];
    }
    const kazanir = L.filter(c => { const O = S.masa.concat({ p, c }); return kazanan(S, O) === p; }), son = S.masa.length === 3;
    const ortakDusman = q => q === S.kim || p === S.kim;   /* ihale sahibine karşı herkes */
    const simdiki = kazanan(S);
    if (S.esli && simdiki === (p + 2) % 4) { const birak = L.filter(c => !kazanir.includes(c)), kc = S.masa.find(x => x.p === simdiki).c;
      if (birak.length && (son || usta(S, kc) || renk(kc) === koz)) return birak.sort((a, b) => (renk(a) === koz) - (renk(b) === koz) || deger(a) - deger(b))[0]; }
    if (kazanir.length) {
      if (son) return kazanir[0];
      const enIyi = kazanir[kazanir.length - 1]; if (renk(enIyi) !== koz && usta(S, enIyi)) return enIyi;
      if (renk(kazanir[0]) === koz && renk(S.masa[0].c) !== koz) return kazanir[0];
      return kazanir[0];
    }
    /* kazanamıyorsa en değersiz kartı at: koz olmayan, en küçük */
    const A = L.slice().sort((a, b) => (renk(a) === koz) - (renk(b) === koz) || deger(a) - deger(b)); return ortakDusman(simdiki) ? A[0] : A[0];
  }
  return { setEsk: v => { ESK = v; }, MAC, takimEl, renk, deger, sirala, yeni, teklifVer, kozSec, yasal, kazanan, oyna, topla, macBitti, sonraki, pasOlur, botIhale, botKoz, botOyna, tahmin, enIyiKoz };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = BT; return; }
window.BT = BT;
})();
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame || !window.BT) return;
const BT = window.BT, { renk, deger } = BT, BOT = ['Ada', 'Efe', 'Can', 'Naz'], SEMBOL = ['♠', '♥', '♦', '♣'], RAD = ['Maça', 'Kupa', 'Karo', 'Sinek'], KIRMIZI = r => r === 1 || r === 2, ADLAR = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function kapak() {
  const k = (x, y, a, d, r) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-13" y="-18" width="26" height="36" rx="3.500" fill="#fff" stroke="#c9ccd3"/><text x="-9" y="-6" font-family="Arial,sans-serif" font-weight="700" font-size="10" fill="${KIRMIZI(r) ? '#d32f2f' : '#1f2328'}">${d}</text><text y="10" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="${KIRMIZI(r) ? '#d32f2f' : '#1f2328'}">${SEMBOL[r]}</text></g>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#17603d"/><circle cx="45" cy="47" r="30" fill="#1f7a4d"/>${k(27, 45, -18, 'K', 1)}${k(45, 40, 0, 'A', 0)}${k(63, 45, 18, 'Q', 2)}${k(45, 64, 0, 'J', 3)}</svg>`;
}
const CSS = `
.bt-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.bt{width:min(560px,100%);margin:0 auto;display:flex;flex-direction:column;gap:7px;-webkit-user-select:none;user-select:none;position:relative;--cw:50px}
.bt h3{margin:0;font-size:19px;font-weight:800}.bt p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.bt-b.sec{box-shadow:inset 0 0 0 2px var(--accent);background:var(--card)}.bt-b{padding:11px 8px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center}.bt-b.ana{background:var(--accent);color:#fff}.bt-b:disabled{opacity:.35}
.bt-sat{display:flex;gap:8px}.bt-sat>*{flex:1;min-width:0}
.bt-menu{display:flex;flex-direction:column;gap:10px;width:min(460px,100%);margin:0 auto}
.bt-k{width:var(--cw);height:calc(var(--cw)*1.42);border-radius:calc(var(--cw)*.12);background:#fff;border:1px solid #c9ccd3;box-shadow:0 2px 4px rgba(0,0,0,.25);position:relative;font-family:Nunito,system-ui,sans-serif;color:#1f2328;flex:none;box-sizing:border-box}
.bt-k.kr{color:#d32f2f}.bt-k .d{position:absolute;left:calc(var(--cw)*.09);top:calc(var(--cw)*.05);font-weight:900;font-size:calc(var(--cw)*.36);line-height:1;letter-spacing:-.05em;display:flex;flex-direction:column;align-items:center}
.bt-k .d i{font-style:normal;font-size:calc(var(--cw)*.3);line-height:1}.bt-k .m{position:absolute;right:calc(var(--cw)*.08);bottom:calc(var(--cw)*.04);font-size:calc(var(--cw)*.62);line-height:1}
.bt-k.arka{background:repeating-linear-gradient(45deg,#2d5aa8,#2d5aa8 4px,#244a8c 4px,#244a8c 8px);border:2px solid #fff}
.bt-masa{position:relative;border-radius:16px;background:radial-gradient(ellipse at 50% 45%,#2c9160,#1b6b43);box-shadow:inset 0 0 0 4px #14532f,inset 0 0 30px rgba(0,0,0,.25);height:300px;flex:none;color:#fff}
.bt-oy{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 9px;border-radius:11px;background:rgba(0,0,0,.28);font-weight:800;font-size:13px;max-width:30%;line-height:1.15;text-align:center}
.bt-oy span{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bt-oy small{font-size:11.5px;font-weight:800;opacity:.9}
.bt-oy.k2{top:8px;left:50%;transform:translateX(-50%)}.bt-oy.k1{right:6px;top:50%;transform:translateY(-50%)}.bt-oy.k3{left:6px;top:50%;transform:translateY(-50%)}
.bt-oy.sira{background:#fff;color:#14532f;box-shadow:0 0 0 3px #ffd34d}.bt-oy.yok{opacity:.55}.bt-oy .ih{background:#ffd34d;color:#3b2a00;border-radius:7px;padding:0 5px;font-size:11px}
.bt-bilg{position:absolute;left:8px;bottom:8px;font-size:12px;font-weight:800;background:rgba(0,0,0,.3);padding:4px 8px;border-radius:9px;line-height:1.3}.bt-bilg b{font-size:15px}
.bt-son-el{position:absolute;right:8px;bottom:8px;font-size:11.5px;font-weight:800;background:rgba(0,0,0,.3);padding:4px 8px;border-radius:9px}
.bt-orta{position:absolute;left:50%;top:50%;width:0;height:0}
.bt-orta .bt-k{position:absolute;--cw:46px;transition:transform .35s,opacity .35s}
.bt-orta .r0{left:-23px;top:-2px}.bt-orta .r1{left:24px;top:-38px}.bt-orta .r2{left:-23px;top:-76px}.bt-orta .r3{left:-70px;top:-38px}
.bt-orta .bt-k.gel{animation:btG .3s}@keyframes btG{from{opacity:0;transform:translate(var(--gx),var(--gy)) scale(.8)}}
.bt-orta.topla .bt-k{transform:translate(var(--tx),var(--ty)) scale(.5);opacity:0}
.bt-orta .bt-k.kaz{box-shadow:0 0 0 3px #ffd34d,0 2px 4px rgba(0,0,0,.25)}
.bt-ben{display:flex;align-items:center;gap:8px;min-height:32px;padding:3px 10px;border-radius:11px;background:var(--bg2);font-size:13.5px;font-weight:800}
.bt-ben.sira{box-shadow:inset 0 0 0 2px var(--accent)}.bt-ben small{color:var(--ink-soft);font-weight:800;white-space:nowrap}
.bt-bilgi{flex:1;text-align:right;font-weight:700;color:var(--ink-soft);font-size:12.5px;line-height:1.25}.bt-bilgi b{color:var(--ink)}
.bt-el{position:relative;height:calc(var(--cw)*1.42 + 18px);flex:none}
.bt-el .bt-k{position:absolute;top:14px;transition:top .12s,filter .12s;cursor:pointer}.bt-el .bt-k.yas{top:4px}.bt-el .bt-k.sec{top:-6px;box-shadow:0 0 0 2.500px #3b82f6,0 6px 12px rgba(0,0,0,.3)}.bt-el .bt-k.kapali{filter:brightness(.72) saturate(.6)}
.bt-panel{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:46px;align-items:center}
.bt-panel .bt-b{flex:1 1 15%;padding:10px 4px;min-width:44px}.bt-panel .bt-b.genis{flex:1 1 100%}.bt-panel .bt-b.koz{font-size:17px;padding:9px 4px}.bt-panel .bt-b.koz.kr{color:#d32f2f}.bt-panel .bt-b.koz small{display:block;font-size:11px;color:var(--ink-soft)}
.bt-panel p{width:100%;text-align:center}
.bt-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:14px;animation:btS .3s .25s both}@keyframes btS{from{opacity:0}}
.bt-son>div{display:flex;flex-direction:column;gap:9px;align-items:stretch;text-align:center;padding:16px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(360px,94%)}.bt-son h3{font-size:22px}
.bt-tablo{width:100%;border-collapse:collapse;font-weight:800;font-size:13px;font-variant-numeric:tabular-nums}.bt-tablo th,.bt-tablo td{padding:4px 5px;text-align:right}.bt-tablo th:first-child,.bt-tablo td:first-child{text-align:left}
.bt-tablo thead th{color:var(--ink-soft);font-size:11.5px}.bt-tablo tr.ben td{color:var(--accent-ink)}.bt-tablo tr.ilk td:first-child::after{content:' 👑'}
`;
const kartHtml = (c, ek, stil) => c == null || c < 0 ? `<div class="bt-k arka ${ek || ''}" ${stil || ''}></div>` : `<div class="bt-k${KIRMIZI(renk(c)) ? ' kr' : ''} ${ek || ''}" data-c="${c}" ${stil || ''}><span class="d">${ADLAR[deger(c)]}<i>${SEMBOL[renk(c)]}</i></span><span class="m">${SEMBOL[renk(c)]}</span></div>`;
registerGame({
  id: 'batak', title: 'Batak', category: 'Masa', tags: 'batak ihale koz kart iskambil maça kupa çevrimiçi online dört kişilik', odak: true, noRestart: true,
  aciklama: 'İhaleli batak: teklif ver, kozu seç, ihaleni tuttur. Bilgisayara karşı ya da çevrimiçi arkadaşlarınla; boş koltuklara bilgisayar oturur.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="11" height="15" rx="2" transform="rotate(-10 8.500 12.500)"/><rect x="10" y="4" width="11" height="15" rx="2"/><path d="M15.500 8.500c-1.500 1.300-2.500 2.200-2.500 3.300a1.500 1.500 0 0 0 2.500 1.100 1.500 1.500 0 0 0 2.500-1.100c0-1.100-1-2-2.500-3.300z" fill="currentColor"/></svg>',
  shareText() { return this._paylas || 'Batak: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('bt-css')) { const s = document.createElement('style'); s.id = 'bt-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('bt-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, mac: 0, kaz: 0, ag: 0, tuttu: 0, o: '', sev: 1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'bt' }); root.append(kok);
    let sohbetK = null;
    let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, secili = -1, mesaj = '', mesajT = 0, surT = 0, canli = true, sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, vekil = '', gorulenI = -1, toplaniyor = false, yazSira = Promise.resolve();
    const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
    const koltuklar = () => oda ? oda.koltuklar() : null;
    const botMu = p => mod === 'yz' ? p !== ben : !(koltuklar()[p]);
    const kopuk = p => { const K = koltuklar(); return !!(K && K[p] && !K[p].var); };
    const ad = p => { if (mod === 'yz') return p === ben ? 'Sen' : BOT[p]; const K = koltuklar(); return K && K[p] ? K[p].n : BOT[p]; };
    const benimSira = () => S && !S.bitti && S.sira === ben;
    const rel = p => (p - ben + 4) % 4;
    function mesajVer(m, sure) { mesaj = m; clearTimeout(mesajT); mesajT = setTimeout(() => { mesaj = ''; ciz(); }, sure || 2200); ciz(); }
    /* ---------- menü ---------- */
    function menu() {
      temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { } const var_ = eski && eski.S && !(eski.S.bitti && BT.macBitti(eski.S));
      kok.innerHTML = `<div class="bt-menu"><h3>♠ Batak</h3><p>${D.mac ? `Bilgisayara karşı <b>${D.mac}</b> maç, <b>${D.kaz}</b> galibiyet · ${D.tuttu} kez ihaleni tutturdun${D.ag ? ' · çevrimiçi ' + D.ag + ' galibiyet' : ''}` : 'İhaleyi al, kozu sen seç, söz verdiğin kadar el topla. Maç dört el sürer.'}</p>
        ${var_ ? `<button class="bt-b ana" data-a="devam">▶ Yarım kalan maça devam (${eski.S.elNo}. el)</button>` : ''}
        <div class="bt-sat"><button class="bt-b${D.esli ? '' : ' sec'}" data-esli="0">👤 Tekli</button><button class="bt-b${D.esli ? ' sec' : ''}" data-esli="1">👥 Eşli (2’ye 2)</button></div>
        <div class="bt-sat"><button class="bt-b ${var_ ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="bt-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
        <button class="bt-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="bt-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/batak/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="bt-menu"><h3>Nasıl oynanır</h3>
        <p>• 52 kart dört kişiye dağıtılır. Herkes sırayla <b>ihale</b> verir: bu elde en az kaç el alacağını söyler (5–13) ya da pas der. En yüksek teklifi veren <b>kozu seçer</b> ve ilk kartı atar.</p>
        <p>• Atılan rengi izlemek zorundasın; o renkte masadaki en büyük kartı geçebiliyorsan <b>geçmek zorundasın</b>. O renk sende yoksa <b>koz atmak</b> zorundasın (geçebiliyorsan geçerek). Koz da yoksa istediğini atarsın.</p>
        <p>• Koz bir kez atılmadan (koz kırılmadan) kozla el açılmaz; elinde yalnız koz kaldıysa açabilirsin.</p>
        <p>• En büyük koz, koz yoksa atılan rengin en büyüğü eli alır. Atabileceğin kartlar parlak görünür: karta dokun, oynamak için yeniden dokun.</p>
        <p>• <b>Eşli (2’ye 2)</b> seçersen karşında oturan eşindir: ihale takımındır, ikinizin aldığı eller toplanır ve ikiniz de aynı puanı yazarsınız.</p>
        <p>• İhaleyi tutturan aldığı el kadar puan yazar, tutturamayan <b>batar</b> ve ihale kadar eksi yazar. Diğerleri aldıkları el kadar yazar. Maç dört el; en yüksek toplam kazanır.</p>
        <a class="bt-b" href="/oyun-kurallari/batak/" style="text-decoration:none;display:block">📖 Ayrıntılı kurallar ve ipuçları</a>
        <button class="bt-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="bt-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="bt-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'batak', koltuk: 4, enAz: 1, botlu: true, baslik: 'Batak', onGeri: menu,
        baslat: o => o.baslat(BT.yeni((Math.random() * 4) | 0, { esli: !!D.esli })), onOda: o => { lobi = null; agBasla(o); } });
    }
    /* ---------- ekran ---------- */
    function ekran() {
      kok.innerHTML = `<div class="bt-masa" id="bt-m"></div><div class="bt-ben" id="bt-ben"><b></b><small></small><span class="bt-bilgi" id="bt-b"></span></div>
        <div class="bt-el" id="bt-e"></div><div class="bt-panel" id="bt-p"></div><div class="bt-sat"><button class="bt-b" data-a="cik" style="flex:none;width:44px">‹</button><button class="bt-b" data-a="sonel" style="flex:1">Son eli gör</button></div>`;
    }
    function olcu() {
      const W = kok.clientWidth || 340, cw = Math.max(42, Math.min(64, Math.round(W / 7.6))); kok.style.setProperty('--cw', cw + 'px');
      const m = q('#bt-m'); if (m) { const ust = m.getBoundingClientRect().top, alt = cw * 1.42 + 18 + 32 + 46 + 44 + 7 * 4 + 14; m.style.height = Math.round(Math.max(230, Math.min(360, innerHeight - ust - alt))) + 'px'; }
    }
    const kozYazi = k => k < 0 ? '' : `<span style="color:${KIRMIZI(k) ? '#ff8a8a' : '#fff'}">${SEMBOL[k]}</span>`;
    function ciz(gelen) {
      if (!S || !q('#bt-m')) return; olcu(); const bS = benimSira(), L = bS && S.asama === 'oyun' && S.masa.length < 4 ? BT.yasal(S, ben) : [];
      if (secili >= 0 && !S.el[ben].includes(secili)) secili = -1;
      let h = '';
      for (const r of [1, 2, 3]) { const p = (ben + r) % 4; let alt;
        if (S.asama === 'ihale') alt = S.teklif[p] == null ? '…' : S.teklif[p] ? `<span class="ih">${S.teklif[p]}</span>` : 'pas';
        else alt = p === S.kim ? `<span class="ih">${BT.takimEl(S, p)}/${S.en}</span>` : `${S.alinan[p]} el`;
        if (S.esli) alt += r === 2 ? ' · 👥 eşin' : '';
        h += `<div class="bt-oy k${r}${S.sira === p && !S.bitti ? ' sira' : ''}${kopuk(p) ? ' yok' : ''}"><span>${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}${kopuk(p) ? ' (ayrıldı)' : ''}</span><small>${alt}</small><small>${S.puan[p]} puan</small></div>`; }
      h += `<div class="bt-bilg">${S.asama === 'ihale' ? `İhale: <b>${S.en || '–'}</b>${S.kim >= 0 ? ' · ' + esc(ad(S.kim)) : ''}` : `İhale: <b>${S.en}</b> · ${esc(ad(S.kim))}<br>Koz: <b>${kozYazi(S.koz) || '?'}</b>${S.koz >= 0 && !S.kozKirik ? ' <small>(kırılmadı)</small>' : ''}`}</div>`;
      h += `<div class="bt-son-el">${S.elNo}. el / ${BT.MAC}</div>`;
      const G = [[0, 70], [70, 0], [0, -70], [-70, 0]];
      h += `<div class="bt-orta${toplaniyor ? ' topla' : ''}">${S.masa.map((x, k) => { const r = rel(x.p), [gx, gy] = G[r], w = S.masa.length === 4 ? BT.kazanan(S) : -1, [tx, ty] = w >= 0 ? G[rel(w)].map(v => v * 2) : [0, 0];
        return kartHtml(x.c, `r${r}${gelen && k === S.masa.length - 1 ? ' gel' : ''}${w === x.p ? ' kaz' : ''}`, `style="--gx:${gx * 1.6}px;--gy:${gy * 1.6}px;--tx:${tx}px;--ty:${ty}px;z-index:${k + 1}"`); }).join('')}</div>`;
      q('#bt-m').innerHTML = h;
      /* elim */
      const el = S.el[ben], W = q('#bt-e').clientWidth || 340, cw = parseFloat(kok.style.getPropertyValue('--cw')) || 50, n = el.length, adim = n > 1 ? Math.min(cw + 4, (W - cw) / (n - 1)) : 0, bas = (W - (cw + adim * (n - 1))) / 2;
      q('#bt-e').innerHTML = el.map((c, i) => kartHtml(c, (L.includes(c) ? 'yas ' : bS && S.asama === 'oyun' ? 'kapali ' : '') + (secili === c ? 'sec' : ''), `style="left:${bas + i * adim}px;z-index:${i + 1}"`)).join('');
      const bn = q('#bt-ben'); bn.classList.toggle('sira', !!bS); bn.querySelector('b').textContent = ad(ben);
      bn.querySelector('small').textContent = (S.asama === 'ihale' ? (S.teklif[ben] == null ? '' : S.teklif[ben] ? 'teklif ' + S.teklif[ben] + ' · ' : 'pas · ') : ben === S.kim ? `${S.alinan[ben]}/${S.en} el · ` : `${S.alinan[ben]} el · `) + S.puan[ben] + ' puan';
      /* panel */
      let p = '';
      if (S.bitti) p = '';
      else if (S.asama === 'ihale' && bS) { const bas2 = Math.max(5, S.en + 1); for (let k = bas2; k <= Math.min(13, bas2 + 7); k++) p += `<button class="bt-b${k === bas2 ? ' ana' : ''}" data-ih="${k}">${k}</button>`; if (BT.pasOlur(S)) p += `<button class="bt-b genis" data-ih="0">Pas</button>`; else p += '<p>Herkes pas geçti; ihale sende kalıyor.</p>'; }
      else if (S.asama === 'koz' && bS) { for (let k = 0; k < 4; k++) { const say = el.filter(c => renk(c) === k).length; p += `<button class="bt-b koz${KIRMIZI(k) ? ' kr' : ''}" data-koz="${k}">${SEMBOL[k]}<small>${RAD[k]} · ${say}</small></button>`; } }
      q('#bt-p').innerHTML = p;
      q('[data-a=sonel]').disabled = !S.sonEl;
      let bilgi = '';
      if (!S.bitti) { if (S.asama === 'ihale') bilgi = bS ? 'Kaç el alacaksın? Teklif ver ya da pas.' : `<b>${esc(ad(S.sira))}</b> düşünüyor…`;
        else if (S.asama === 'koz') bilgi = bS ? '<b>İhale senin!</b> Kozu seç.' : `<b>${esc(ad(S.sira))}</b> kozu seçiyor…`;
        else if (S.masa.length === 4) bilgi = `Eli <b>${esc(ad(BT.kazanan(S)))}</b> aldı.`;
        else bilgi = bS ? (secili >= 0 ? 'Oynamak için karta <b>yeniden dokun</b>.' : 'Sıra sende: parlak kartlardan birine dokun.') : `<b>${esc(ad(S.sira))}</b> oynuyor…`; }
      q('#bt-b').innerHTML = mesaj || bilgi;
    }
    /* ---------- hamleler ---------- */
    function uygula(Y, gel) { S = Y; if (mod === 'ag') gonder(); else yerelKaydet(); ciz(gel); if (S.bitti) bitti(); else surucu(); }
    function oyna(f, s, gel) { const Y = kopya(S); if (!f(Y)) return false; ses(s || 'tap'); uygula(Y, gel); return true; }
    function kartDokun(c) {
      if (!S || S.bitti) return; if (!benimSira() || S.asama !== 'oyun') { secili = secili === c ? -1 : c; return ciz(); }
      const L = BT.yasal(S, ben); if (!L.includes(c)) { secili = -1; return mesajVer(neden(c)); }
      if (secili === c) { secili = -1; oyna(Y => BT.oyna(Y, ben, c), 'tap', true); } else { secili = c; ses('click'); ciz(); }
    }
    function neden(c) {
      if (!S.masa.length) return 'Koz kırılmadan kozla el açılmaz.';
      const led = renk(S.masa[0].c), el = S.el[ben];
      if (el.some(x => renk(x) === led)) return renk(c) === led ? 'Masadakini geçebilecek kartın varsa onu atmalısın.' : `${RAD[led]} izlemek zorundasın.`;
      return 'Rengin yok; koz atmak (geçebiliyorsan geçerek) zorundasın.';
    }
    function surucu() {
      clearTimeout(surT); if (!S || S.bitti || !canli) return;
      const yonetici = mod === 'yz' || (() => { const K = koltuklar(), bagli = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0); return bagli.length && bagli[0] === ben; })();
      if (S.masa.length === 4) { if (!yonetici) return; const i0 = S.son.i; surT = setTimeout(() => { if (!S || S.son.i !== i0 || S.masa.length !== 4) return; toplaniyor = true; ciz(); setTimeout(() => { toplaniyor = false; if (!S || S.son.i !== i0) return; const Y = kopya(S); BT.topla(Y); ses(BT.kazanan(S) === ben ? 'score' : 'click'); uygula(Y); }, 330); }, 900); return; }
      const p = S.sira; let sure;
      if (mod === 'yz') { if (p === ben) return; sure = S.asama === 'oyun' ? 650 : 750; }
      else { const K = koltuklar(), bagli = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0 && i !== p); if (!bagli.length || bagli[0] !== ben) return; sure = !K[p] || vekil === p + ':' + S.tur + ':' + S.son.i ? 700 : !K[p].var ? 12000 : 60000; }
      const i0 = S.son.i, tur0 = S.tur; surT = setTimeout(() => { if (!S || S.bitti || S.sira !== p || S.son.i !== i0 || S.tur !== tur0 || !canli) return; botAdim(p); }, sure);
    }
    function botAdim(p) {
      const Y = kopya(S), s = mod === 'yz' ? sev : 1;
      if (Y.asama === 'ihale') BT.teklifVer(Y, p, BT.botIhale(Y, p, s)); else if (Y.asama === 'koz') BT.kozSec(Y, p, BT.botKoz(Y, p)); else BT.oyna(Y, p, BT.botOyna(Y, p, s));
      if (p === ben) secili = -1; vekil = !Y.bitti && Y.sira === p ? p + ':' + Y.tur + ':' + Y.son.i : ''; ses('tap'); uygula(Y, Y.asama === 'oyun');
    }
    /* ---------- bitiş ---------- */
    function bitti() {
      clearTimeout(surT); const mb = BT.macBitti(S), anahtar = mod + ':' + S.tur + ':' + (oda ? oda.kod : ''), lider = [0, 1, 2, 3].sort((a, c) => S.puan[c] - S.puan[a])[0], tuttu = S.bitti.tuttu, macBen = S.esli ? (lider - ben + 4) % 2 === 0 : lider === ben, benimIhale = S.esli ? (S.kim - ben + 4) % 2 === 0 : S.kim === ben;
      if (sayilan !== anahtar) { sayilan = anahtar; const PR = window.Progress; if (PR) { if (S.kim === ben && tuttu) PR.olay('bt_tuttu'); }
        if (mod === 'yz') { if (S.kim === ben && tuttu) D.tuttu++; if (mb) { D.mac++; if (macBen) { D.kaz++; api.submitScore(D.kaz); } } kaydet(); yerelKaydet(); }
        else { if (mb && macBen) { D.ag++; kaydet(); } if (oda && mb) oda.bitir(); }
        const iyi = (benimIhale && tuttu) || (mb && macBen); ses(iyi ? 'win' : S.kim === ben ? 'lose' : 'click'); if (iyi) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } }
      if (mod === 'ag' && oda && window.Masa && Masa.sonuc && mb) Masa.sonuc(oda, macBen ? 1 : 0, 'm' + S.tur);
      oyun._paylas = 'Batak: ' + (mb ? (lider === ben ? 'maçı kazandım!' : 'maç bitti.') : S.kim === ben ? (tuttu ? S.en + ' ihaleyi tutturdum!' : 'battım :)') : 'bir el daha.') + '\nerdevelop.com/oyunlar/#o/batak';
      const e = q('.bt-son'); if (e) e.remove(); const s = E('div', { class: 'bt-son' }), sira = [0, 1, 2, 3].sort((a, c) => S.puan[c] - S.puan[a]), MS = (S.mac || [0, 0, 0, 0]).slice(); if (mb) MS[lider]++;
      s.innerHTML = `<div><h3>${mb ? (macBen ? (S.esli ? '🏆 Takımınız kazandı!' : '🏆 Maçı kazandın!') : (S.esli ? 'Rakip takım kazandı' : esc(ad(lider)) + ' maçı kazandı')) : S.kim === ben ? (tuttu ? '🎉 İhaleyi tutturdun!' : 'Battın') : S.esli && benimIhale ? (tuttu ? '🎉 Eşin ihaleyi tutturdu!' : 'Eşin battı') : esc(ad(S.kim)) + (tuttu ? ' ihaleyi tutturdu' : ' battı')}</h3>
        <p>${S.elNo}. el / ${BT.MAC} · ihale ${S.en} ${SEMBOL[S.koz]} · ${BT.takimEl(S, S.kim)} el ${S.esli ? 'aldılar' : 'aldı'}${S.esli ? ' · eşli' : ''}</p>
        <table class="bt-tablo"><thead><tr><th></th>${S.gecmis.map((_, i) => `<th>${i + 1}.</th>`).join('')}<th>Toplam</th>${MS.some(Boolean) ? '<th>🏆</th>' : ''}</tr></thead>
        <tbody>${sira.map((p, k) => `<tr class="${p === ben ? 'ben' : ''}${k === 0 ? ' ilk' : ''}"><td>${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}</td>${S.gecmis.map(g => `<td>${g[p]}</td>`).join('')}<td><b>${S.puan[p]}</b></td>${MS.some(Boolean) ? `<td>${MS[p]}</td>` : ''}</tr>`).join('')}</tbody></table>
        <button class="bt-b ana" data-a="yine">${mb ? 'Yeni maç' : 'Sonraki el'}</button><button class="bt-b" data-a="menu">Menü</button></div>`;
      if (mod === 'ag' && window.Masa && Masa.karsiYazi) { const kz = Masa.karsiYazi(oda); if (kz) { const p2 = document.createElement('p'); p2.className = 'ms-karsi'; p2.textContent = kz; const b1 = s.querySelector('button'); if (b1) b1.parentNode.insertBefore(p2, b1); } } kok.append(s);
    }
    /* ---------- kayıt / ağ ---------- */
    function yerelKaydet() { if (mod !== 'yz' || !S) return; D.o = S.bitti && BT.macBitti(S) ? '' : JSON.stringify({ S, sev }); D.sev = sev; kaydet(); }
    function gonder() {
      if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
      yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
    }
    function al(d) {
      const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
      const onceki = S; S = d; if (onceki && S.tur !== onceki.tur) { const e = q('.bt-son'); if (e) e.remove(); secili = -1; }
      const gel = onceki && S.son && onceki.son && S.son.i !== onceki.son.i && S.son.t === 'oy'; if (gel) ses('tap');
      ciz(gel); if (S.bitti) { if (!q('.bt-son')) bitti(); } else surucu();
    }
    function yzBasla(s, eski) { temizle(); mod = 'yz'; ben = 0; sev = s; secili = -1; mesaj = ''; S = eski && eski.S ? eski.S : BT.yeni((Math.random() * 4) | 0, { esli: !!D.esli }); ekran(); ciz(); yerelKaydet(); if (S.bitti) bitti(); else surucu(); }
    function agBasla(o) {
      temizle(); mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; secili = -1; mesaj = ''; yerelSur = 0; sonMetin = ''; bekleyen = 0; ekran(); sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('[data-a=cik]').parentNode, sonra: q('[data-a=cik]'), koltuk: p => p === ben ? q('#bt-ben') : q(`.bt-oy.k${rel(p)}`) }) : null;
      odaBirak = oda.dinle(v => { if (!v) { if (S) mesajVer('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben); if (!bekleyen) al(d); if (S && !S.bitti) { ciz(); surucu(); } });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); toplaniyor = false; if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (b && b.closest('.ms')) return;
      if (!b) { const k = e.target.closest('.bt-el .bt-k'); if (k) kartDokun(+k.dataset.c); else if (e.target.closest('#bt-m') && secili >= 0 && benimSira()) kartDokun(secili); return; }
      if (b.dataset.esli != null) { D.esli = +b.dataset.esli; kaydet(); kok.querySelectorAll('[data-esli]').forEach(x => x.classList.toggle('sec', x === b)); return; }
      if (b.dataset.ih != null) { if (benimSira() && S.asama === 'ihale') oyna(Y => BT.teklifVer(Y, ben, +b.dataset.ih), 'click'); return; }
      if (b.dataset.koz != null) { if (benimSira() && S.asama === 'koz') oyna(Y => BT.kozSec(Y, ben, +b.dataset.koz), 'score'); return; }
      const a = b.dataset.a;
      if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const o = JSON.parse(D.o); yzBasla(o.sev == null ? 1 : o.sev, o); } catch (x) { menu(); } }
      else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
      else if (a === 'cik') { if (mod === 'ag' && S && !S.bitti && !b.dataset.emin) { b.dataset.emin = 1; mesajVer('Çıkarsan masadan kalkmış olursun. Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
      else if (a === 'sonel') { if (S && S.sonEl) mesajVer('Son el: ' + S.sonEl.map(x => `${esc(ad(x.p))} <b style="color:${KIRMIZI(renk(x.c)) ? '#d32f2f' : 'inherit'}">${ADLAR[deger(x.c)]}${SEMBOL[renk(x.c)]}</b>`).join(' · ') + ` → <b>${esc(ad(BT.kazanan(S, S.sonEl)))}</b>`, 4500); }
      else if (a === 'yine') { const y = BT.sonraki(S), e2 = q('.bt-son'); if (e2) e2.remove(); secili = -1; if (mod === 'ag') { S = null; sonMetin = ''; oda.yeniden(y); } else { S = y; ciz(); yerelKaydet(); surucu(); } } });
    const boyutla = () => { if (S) ciz(); }; addEventListener('resize', boyutla);
    const sakla = () => yerelKaydet(); addEventListener('pagehide', sakla);
    api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); removeEventListener('resize', boyutla); removeEventListener('pagehide', sakla); root.classList.remove('bt-mount'); });
    menu();
    if (/[?&]bttest/.test(location.search)) window.__bt = { S: () => S, ben: () => ben, BT, kartDokun, mod: () => mod, botAdim, oyna: (f) => oyna(f) };
  }
});
})();
