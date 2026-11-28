/* King — dört kişilik, 20 el. Her oyuncu 5 kez oyun seçer: 3 ceza + 2 koz. Her ceza türü toplam en çok 2 kez oynanır.
   Cezalar: El almaz (el başı −50), Kupa almaz (kupa başı −30), Erkek almaz (K ve J başı −60), Kız almaz (Q başı −100), Rıfkı (kupa papazı −320), Son iki (son iki elin her biri −180).
   Koz: seçen kozu belirler, alınan her el +50. Renk izlemek zorunlu; koz oyununda rengin yoksa koz atmak zorunlu; cezada rengin yoksa ceza kartı (varsa) atmak zorunlu.
   Kupa almaz ve rıfkıda kupa kırılmadan kupayla, kozda koz kırılmadan kozla el açılmaz (elde yalnız o renk yoksa). Rıfkıda kupa açılıp masaya as düştüyse papaz, kız almazda
   masaya o rengin papazı/ası düştüyse kız atılmak zorunda. Bütün ceza kartları çıkınca el erken biter. */
(function () {
'use strict';
const KG = (() => {
  const MAC = 20, renk = c => Math.floor(c / 13), deger = c => c % 13, RIFKI = 24, KUPA_AS = 25;
  const CEZA = ['el', 'kupa', 'erkek', 'kiz', 'rifki', 'son'], AD = { el: 'El almaz', kupa: 'Kupa almaz', erkek: 'Erkek almaz', kiz: 'Kız almaz', rifki: 'Rıfkı', son: 'Son iki', koz: 'Koz' };
  const TOPLAM = { el: 650, kupa: 390, erkek: 480, kiz: 400, rifki: 320, son: 360, koz: 650 }, CEZA_SAY = { kupa: 13, erkek: 8, kiz: 4, rifki: 1 };
  const kar = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sirala = el => el.sort((a, b) => [0, 1, 3, 2].indexOf(renk(a)) - [0, 1, 3, 2].indexOf(renk(b)) || deger(b) - deger(a));
  const cezaKart = (t, c) => t === 'kupa' ? renk(c) === 1 : t === 'erkek' ? deger(c) === 11 || deger(c) === 9 : t === 'kiz' ? deger(c) === 10 : t === 'rifki' ? c === RIFKI : false;
  function yeni(o) {
    o = o || {}; const D = kar(Array.from({ length: 52 }, (_, i) => i)), el = [0, 1, 2, 3].map(p => sirala(D.slice(p * 13, p * 13 + 13)));
    const ilk = o.ilk == null ? (Math.random() * 4) | 0 : o.ilk, elNo = o.elNo || 1, secen = (ilk + elNo - 1) % 4;
    return { el, ilk, elNo, secen, sira: secen, asama: 'secim', t: '', koz: -1, masa: [], alinan: [0, 0, 0, 0], ceza: [0, 0, 0, 0], elPuan: [0, 0, 0, 0], cezaAl: 0, oynanan: [], kirik: false, sonEl: null, bitti: null,
      puan: o.puan ? o.puan.slice() : [0, 0, 0, 0], gecmis: o.gecmis ? o.gecmis.map(x => Object.assign({}, x, { v: x.v.slice() })) : [],
      kul: o.kul ? o.kul.map(u => ({ c: u.c.slice(), k: u.k })) : [0, 0, 0, 0].map(() => ({ c: [], k: 0 })), cs: Object.assign({ el: 0, kupa: 0, erkek: 0, kiz: 0, rifki: 0, son: 0 }, o.cs || {}),
      tur: o.tur || 1, mac: o.mac ? o.mac.slice() : [0, 0, 0, 0], son: { i: 0 } };
  }
  const ileri = (S, p, t, c) => { S.son = { i: S.son.i + 1, p, t, c: c == null ? -1 : c }; };
  function secenekler(S, p) { const U = S.kul[p], R = []; if (U.c.length < 3) for (const t of CEZA) if (S.cs[t] < 2) R.push(t); if (U.k < 2) R.push('koz'); return R; }
  function sec(S, p, t, k) {
    if (S.asama !== 'secim' || S.sira !== p || !secenekler(S, p).includes(t)) return false;
    if (t === 'koz') { if (!(k >= 0 && k <= 3)) return false; S.koz = k; S.kul[p].k++; } else { S.koz = -1; S.kul[p].c.push(t); S.cs[t]++; }
    S.t = t; S.asama = 'oyun'; ileri(S, p, 'sec', t === 'koz' ? 'koz' + k : t); return true;
  }
  const kirilacak = S => S.t === 'kupa' || S.t === 'rifki' ? 1 : S.t === 'koz' ? S.koz : -1;
  function yasal(S, p) {
    const el = S.el[p], O = S.masa, t = S.t; if (!el.length) return [];
    if (!O.length) { const kr = kirilacak(S); if (kr >= 0 && !S.kirik) { const nk = el.filter(c => renk(c) !== kr); if (nk.length) return nk; } return el; }
    const led = renk(O[0].c), ayni = el.filter(c => renk(c) === led);
    if (ayni.length) {
      if (t === 'rifki' && led === 1 && ayni.includes(RIFKI) && O.some(x => x.c === KUPA_AS)) return [RIFKI];
      if (t === 'kiz') { const q = led * 13 + 10; if (ayni.includes(q) && O.some(x => renk(x.c) === led && deger(x.c) > 10)) return [q]; }
      return ayni;
    }
    if (t === 'koz') { const kz = el.filter(c => renk(c) === S.koz); return kz.length ? kz : el; }
    const ce = el.filter(c => cezaKart(t, c)); return ce.length ? ce : el;
  }
  function kazanan(S, O) { O = O || S.masa; let en = O[0]; for (const x of O) { const a = renk(x.c) === S.koz, b = renk(en.c) === S.koz; if (a && !b || (a === b && renk(x.c) === renk(en.c) && deger(x.c) > deger(en.c))) en = x; } return en.p; }
  function oyna(S, p, c) {
    if (S.asama !== 'oyun' || S.sira !== p || S.masa.length >= 4 || !yasal(S, p).includes(c)) return false;
    S.el[p].splice(S.el[p].indexOf(c), 1); S.masa.push({ p, c }); S.oynanan.push(c); if (renk(c) === kirilacak(S)) S.kirik = true; ileri(S, p, 'oy', c);
    S.sira = S.masa.length === 4 ? -1 : (p + 1) % 4; return true;
  }
  const elDegeri = (S, O, no) => { const t = S.t, n = O.filter(x => cezaKart(t, x.c)).length;
    return t === 'koz' ? 50 : t === 'el' ? -50 : t === 'kupa' ? -30 * n : t === 'erkek' ? -60 * n : t === 'kiz' ? -100 * n : t === 'rifki' ? -320 * n : t === 'son' ? (no >= 12 ? -180 : 0) : 0; };
  function topla(S) {
    if (S.masa.length !== 4) return false; const w = kazanan(S), no = 13 - S.el[w].length, v = elDegeri(S, S.masa, no), n = S.masa.filter(x => cezaKart(S.t, x.c)).length;
    S.alinan[w]++; S.elPuan[w] += v; S.cezaAl += n; S.ceza[w] += n; S.sonEl = S.masa; S.masa = []; ileri(S, w, 'al');
    const erken = CEZA_SAY[S.t] && S.cezaAl >= CEZA_SAY[S.t];
    if (!S.el[w].length || erken) { S.asama = 'bitti'; S.erken = erken && !!S.el[w].length; skorla(S); } else S.sira = w; return true;
  }
  function skorla(S) { const v = S.elPuan.slice(); S.bitti = { t: S.t }; S.sonuc = v; S.gecmis.push({ t: S.t, s: S.secen, k: S.koz, v }); v.forEach((x, p) => S.puan[p] += x); }
  const macBitti = S => !!S.bitti && S.elNo >= MAC;
  function sonraki(S) {
    const mb = macBitti(S), mac = (S.mac || [0, 0, 0, 0]).slice(); if (mb) { const l = [0, 1, 2, 3].sort((a, b) => S.puan[b] - S.puan[a])[0]; mac[l]++; }
    return mb ? yeni({ ilk: (S.ilk + 1) % 4, tur: S.tur + 1, mac }) : yeni({ ilk: S.ilk, elNo: S.elNo + 1, puan: S.puan, gecmis: S.gecmis, kul: S.kul, cs: S.cs, tur: S.tur + 1, mac });
  }
  /* ---------- bilgisayar ---------- */
  function tahmin(el, koz) {
    let t = 0;
    for (let r = 0; r < 4; r++) {
      const K = el.filter(c => renk(c) === r).map(deger).sort((a, b) => b - a), n = K.length;
      if (r === koz) { t += K.filter(v => v >= 10).length * .95 + Math.max(0, n - 3) * .85 + (K.includes(9) && n >= 4 ? .4 : 0); continue; }
      if (K.includes(12)) t += .95; if (K.includes(11) && n >= 2) t += .7; if (K.includes(10) && n >= 3) t += .35;
      if (koz >= 0 && n <= 1) t += (2 - n) * .35;
    }
    return t;
  }
  function enIyiKoz(el) { let en = -1, k = 0; for (let r = 0; r < 4; r++) { const v = tahmin(el, r) + el.filter(c => renk(c) === r).length * .01; if (v > en) { en = v; k = r; } } return { k, t: en }; }
  function risk(el, t) {   /* elin bu cezadaki tahmini payı (adil pay .25) */
    const R = r => el.filter(c => renk(c) === r).map(deger), yuk = el.reduce((a, c) => a + (deger(c) === 12 ? 1 : deger(c) === 11 ? .7 : deger(c) === 10 ? .4 : deger(c) === 9 ? .15 : 0), 0);
    const kisa = [0, 1, 2, 3].filter(r => R(r).length <= 1).length, H = R(1);
    if (t === 'el') return .25 + (yuk - 3.2) * .05 - kisa * .02;
    if (t === 'son') return .25 + (yuk - 3.2) * .035;
    if (t === 'kupa') return .25 + (H.filter(v => v >= 9).length - 1) * .07 + (H.length - 3.25) * .015 + (yuk - 3.2) * .02;
    if (t === 'erkek') return .25 + (el.filter(c => deger(c) === 11 || deger(c) === 9).length - 2) * .06 + (el.filter(c => deger(c) === 12).length - 1) * .03;
    if (t === 'kiz') return .25 + [0, 1, 2, 3].reduce((a, r) => { const K = R(r); return a + (K.includes(10) ? (K.filter(v => v < 10).length < 3 ? .14 : .03) : 0) + (K.includes(12) || K.includes(11) ? .03 : 0); }, 0) - .08;
    if (t === 'rifki') return H.includes(11) ? (H.length <= 3 ? .75 : .45) : H.includes(12) && H.length <= 2 ? .35 : .2 - H.length * .01;
    return .25;
  }
  function botSec(S, p, sev) {
    const O = secenekler(S, p), el = S.el[p]; let en = null, ev = -1e9, kk = 0;
    for (const t of O) { let v;
      if (t === 'koz') { const x = enIyiKoz(el); v = (x.t - 3.4) * 50 * 1.15; kk = x.k; }
      else v = TOPLAM[t] * (.25 - risk(el, t));
      if (sev === 0) v += (Math.random() - .5) * 120;
      if (v > ev) { ev = v; en = t; } }
    return en === 'koz' ? { t: 'koz', k: kk } : { t: en };
  }
  function usta(S, c) { const r = renk(c), gor = new Set(S.oynanan.concat(S.masa.map(x => x.c))); for (let d = deger(c) + 1; d < 13; d++) if (!gor.has(r * 13 + d)) return false; return true; }
  function botOyna(S, p, sev) {
    const L = yasal(S, p).slice().sort((a, b) => deger(a) - deger(b)); if (L.length === 1) return L[0];
    if (sev === 0 && Math.random() < .3) return L[(Math.random() * L.length) | 0];
    const O = S.masa, t = S.t, son = O.length === 3, kalan = S.el[p].length;
    if (t === 'koz') {
      const koz = S.koz;
      if (!O.length) { const ust = L.filter(c => usta(S, c) && renk(c) !== koz); if (ust.length) return ust[ust.length - 1];
        const kz = L.filter(c => renk(c) === koz); if (kz.length && usta(S, kz[kz.length - 1])) return kz[kz.length - 1];
        const say = r => S.el[p].filter(c => renk(c) === r).length, yan = L.filter(c => renk(c) !== koz);
        return (yan.length ? yan : L).slice().sort((a, b) => say(renk(a)) - say(renk(b)) || deger(a) - deger(b))[0]; }
      const kaz = L.filter(c => kazanan(S, O.concat({ p, c })) === p);
      if (kaz.length) { if (son) return kaz[0]; const b = kaz[kaz.length - 1]; if (renk(b) !== koz && usta(S, b)) return b; return kaz[0]; }
      return L.slice().sort((a, b) => (renk(a) === koz) - (renk(b) === koz) || deger(a) - deger(b))[0];
    }
    const ce = c => cezaKart(t, c), bosalt = t === 'son' && kalan > 3;
    if (!O.length) {
      if (bosalt) return L[L.length - 1];
      const dis = S.oynanan.length, A = L.slice().sort((a, b) => (ce(a) - ce(b)) || (usta(S, a) - usta(S, b)) || deger(a) - deger(b));
      if (t === 'rifki' && !S.el[p].includes(RIFKI) && !S.oynanan.includes(RIFKI)) { const k = L.filter(c => renk(c) === 1 && deger(c) < 11); if (k.length && dis > 4) return k[k.length - 1]; }
      return A[0];
    }
    const led = renk(O[0].c), ust = Math.max(...O.filter(x => renk(x.c) === led).map(x => deger(x.c))), cezali = O.some(x => ce(x.c));
    if (renk(L[0]) === led && L.every(c => renk(c) === led)) {
      if (bosalt) return L[L.length - 1];
      const alt = L.filter(c => deger(c) < ust); if (alt.length) return alt[alt.length - 1];
      if (son) { const g = L.filter(c => !ce(c)); return g.length && !cezali ? g[g.length - 1] : L[L.length - 1]; }
      const g = L.filter(c => !ce(c)); return g.length ? g[0] : L[0];
    }
    /* rengim yok: ceza kartı ya da en tehlikeli büyük kartı at */
    const say = r => S.el[p].filter(c => renk(c) === r).length;
    return L.slice().sort((a, b) => (ce(b) - ce(a)) || deger(b) - deger(a) || say(renk(a)) - say(renk(b)))[0];
  }
  return { MAC, CEZA, AD, TOPLAM, RIFKI, renk, deger, sirala, cezaKart, yeni, secenekler, sec, yasal, kazanan, oyna, topla, macBitti, sonraki, botSec, botOyna, risk, enIyiKoz };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = KG; return; }
window.KG = KG;
})();
(function () {
'use strict';
if (typeof window === 'undefined' || !window.registerGame || !window.KG) return;
const KG = window.KG, { renk, deger } = KG, BOT = ['Ada', 'Efe', 'Can', 'Naz'], SEMBOL = ['♠', '♥', '♦', '♣'], RAD = ['Maça', 'Kupa', 'Karo', 'Sinek'], KIRMIZI = r => r === 1 || r === 2, ADLAR = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const IKON = { el: '✋', kupa: '♥', erkek: '🤴', kiz: '👸', rifki: '👑', son: '⏳', koz: '⭐' }, ACIK = { el: 'el başı −50', kupa: 'kupa başı −30', erkek: 'K ve J başı −60', kiz: 'Q başı −100', rifki: 'K♥ −320', son: 'son 2 el −180', koz: 'el başı +50' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function kapak() {
  const k = (x, y, a, d, r) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-13" y="-18" width="26" height="36" rx="3.500" fill="#fff" stroke="#c9ccd3"/><text x="-9" y="-6" font-family="Arial,sans-serif" font-weight="700" font-size="10" fill="${KIRMIZI(r) ? '#d32f2f' : '#1f2328'}">${d}</text><text y="10" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="${KIRMIZI(r) ? '#d32f2f' : '#1f2328'}">${SEMBOL[r]}</text></g>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#5b2a86"/><circle cx="45" cy="50" r="30" fill="#7440a6"/>${k(30, 54, -16, 'Q', 0)}${k(60, 54, 16, 'J', 3)}${k(45, 50, 0, 'K', 1)}<path d="M33 17l6 7 6-9 6 9 6-7-2 12H35z" fill="#ffd34d" stroke="#b8860b" stroke-width="1.200" stroke-linejoin="round"/></svg>`;
}
const CSS = `
.kg-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.kg{width:min(560px,100%);margin:0 auto;display:flex;flex-direction:column;gap:7px;-webkit-user-select:none;user-select:none;position:relative;--cw:50px}
.kg h3{margin:0;font-size:19px;font-weight:800}.kg p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.4}
.kg-b{padding:11px 8px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center}.kg-b.ana{background:var(--accent);color:#fff}.kg-b:disabled{opacity:.35}
.kg-sat{display:flex;gap:8px}.kg-sat>*{flex:1;min-width:0}
.kg-menu{display:flex;flex-direction:column;gap:10px;width:min(460px,100%);margin:0 auto}
.kg-k{width:var(--cw);height:calc(var(--cw)*1.42);border-radius:calc(var(--cw)*.12);background:#fff;border:1px solid #c9ccd3;box-shadow:0 2px 4px rgba(0,0,0,.25);position:relative;font-family:Nunito,system-ui,sans-serif;color:#1f2328;flex:none;box-sizing:border-box}
.kg-k.kr{color:#d32f2f}.kg-k .d{position:absolute;left:calc(var(--cw)*.09);top:calc(var(--cw)*.05);font-weight:900;font-size:calc(var(--cw)*.36);line-height:1;letter-spacing:-.05em;display:flex;flex-direction:column;align-items:center}
.kg-k .d i{font-style:normal;font-size:calc(var(--cw)*.3);line-height:1}.kg-k .m{position:absolute;right:calc(var(--cw)*.08);bottom:calc(var(--cw)*.04);font-size:calc(var(--cw)*.62);line-height:1}
.kg-k.ceza::after{content:'';position:absolute;right:3px;top:3px;width:7px;height:7px;border-radius:50%;background:#e11d48}
.kg-masa{position:relative;border-radius:16px;background:radial-gradient(ellipse at 50% 45%,#7a46ad,#4b2273);box-shadow:inset 0 0 0 4px #3a1a5a,inset 0 0 30px rgba(0,0,0,.25);height:300px;flex:none;color:#fff}
.kg-oy{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 9px;border-radius:11px;background:rgba(0,0,0,.28);font-weight:800;font-size:13px;max-width:30%;line-height:1.15;text-align:center}
.kg-oy span{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kg-oy small{font-size:11.5px;font-weight:800;opacity:.9}
.kg-oy.k2{top:8px;left:50%;transform:translateX(-50%)}.kg-oy.k1{right:6px;top:50%;transform:translateY(-50%)}.kg-oy.k3{left:6px;top:50%;transform:translateY(-50%)}
.kg-oy.sira{background:#fff;color:#3a1a5a;box-shadow:0 0 0 3px #ffd34d}.kg-oy.yok{opacity:.55}.kg .ep{background:#ffd34d;color:#3b2a00;border-radius:7px;padding:0 5px;font-size:11px}.kg .ep.eksi{background:#fecdd3;color:#881337}
.kg-bilg{position:absolute;left:8px;bottom:8px;font-size:12px;font-weight:800;background:rgba(0,0,0,.3);padding:4px 8px;border-radius:9px;line-height:1.3}.kg-bilg b{font-size:15px}
.kg-sag{position:absolute;right:8px;bottom:8px;font-size:11.5px;font-weight:800;background:rgba(0,0,0,.3);padding:4px 8px;border-radius:9px}
.kg-orta{position:absolute;left:50%;top:50%;width:0;height:0}
.kg-orta .kg-k{position:absolute;--cw:46px;transition:transform .35s,opacity .35s}
.kg-orta .r0{left:-23px;top:-2px}.kg-orta .r1{left:24px;top:-38px}.kg-orta .r2{left:-23px;top:-76px}.kg-orta .r3{left:-70px;top:-38px}
.kg-orta .kg-k.gel{animation:kgG .3s}@keyframes kgG{from{opacity:0;transform:translate(var(--gx),var(--gy)) scale(.8)}}
.kg-orta.topla .kg-k{transform:translate(var(--tx),var(--ty)) scale(.5);opacity:0}
.kg-orta .kg-k.kaz{box-shadow:0 0 0 3px #ffd34d,0 2px 4px rgba(0,0,0,.25)}
.kg-ben{display:flex;align-items:center;gap:8px;min-height:32px;padding:3px 10px;border-radius:11px;background:var(--bg2);font-size:13.5px;font-weight:800}
.kg-ben.sira{box-shadow:inset 0 0 0 2px var(--accent)}.kg-ben small{color:var(--ink-soft);font-weight:800;white-space:nowrap}
.kg-bilgi{flex:1;text-align:right;font-weight:700;color:var(--ink-soft);font-size:12.5px;line-height:1.25}.kg-bilgi b{color:var(--ink)}
.kg-el{position:relative;height:calc(var(--cw)*1.42 + 18px);flex:none}
.kg-el .kg-k{position:absolute;top:14px;transition:top .12s,filter .12s;cursor:pointer}.kg-el .kg-k.yas{top:4px}.kg-el .kg-k.sec{top:-6px;box-shadow:0 0 0 2.500px #3b82f6,0 6px 12px rgba(0,0,0,.3)}.kg-el .kg-k.kapali{filter:brightness(.72) saturate(.6)}
.kg-panel{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:46px;align-items:center}
.kg-panel .kg-b{flex:1 1 30%;padding:8px 4px;min-width:90px;font-size:13.5px;line-height:1.2}.kg-panel .kg-b small{display:block;font-size:11px;color:var(--ink-soft);font-weight:700}
.kg-panel .kg-b.koz{flex:1 1 20%;min-width:60px;font-size:18px}.kg-panel .kg-b.koz.kr{color:#d32f2f}.kg-panel .kg-b.koz-ana{background:#fef3c7;color:#78350f}
.kg-panel p{width:100%;text-align:center}
.kg-son{position:absolute;inset:0;z-index:40;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:14px;animation:kgS .3s .25s both}@keyframes kgS{from{opacity:0}}
.kg-son>div{display:flex;flex-direction:column;gap:9px;align-items:stretch;text-align:center;padding:16px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(380px,94%);max-height:92%;overflow:auto;box-sizing:border-box}.kg-son h3{font-size:22px}
.kg-tablo{width:100%;border-collapse:collapse;font-weight:800;font-size:13px;font-variant-numeric:tabular-nums}.kg-tablo th,.kg-tablo td{padding:4px 5px;text-align:right}.kg-tablo th:first-child,.kg-tablo td:first-child{text-align:left}
.kg-tablo thead th{color:var(--ink-soft);font-size:11.5px}.kg-tablo tr.ben td{color:var(--accent-ink)}.kg-tablo tr.ilk td:first-child::after{content:' 👑'}
.kg-gec{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}.kg-gec span{padding:2px 7px;border-radius:8px;background:var(--bg2);font-size:11.5px;font-weight:800}
.kg-gec span.ben{background:var(--accent-soft);color:var(--accent-ink)}
`;
const kartHtml = (c, ek, stil) => `<div class="kg-k${KIRMIZI(renk(c)) ? ' kr' : ''} ${ek || ''}" data-c="${c}" ${stil || ''}><span class="d">${ADLAR[deger(c)]}<i>${SEMBOL[renk(c)]}</i></span><span class="m">${SEMBOL[renk(c)]}</span></div>`;
const kartYazi = c => `<b style="color:${KIRMIZI(renk(c)) ? '#d32f2f' : 'inherit'}">${ADLAR[deger(c)]}${SEMBOL[renk(c)]}</b>`;
registerGame({
  id: 'king', title: 'King', category: 'Masa', tags: 'king rıfkı kız almaz erkek almaz kupa almaz el almaz son iki koz kart iskambil çevrimiçi online dört kişilik', odak: true, noRestart: true,
  aciklama: 'Klasik King: 20 el, 6 ceza ve koz. Rıfkıdan kaç, kızları alma, kozda elleri topla. Bilgisayara karşı ya da çevrimiçi; boş koltuklara bilgisayar oturur.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8l4 4 4-7 4 7 4-4-2 11H6z"/><path d="M6 21h12"/></svg>',
  shareText() { return this._paylas || 'King: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('kg-css')) { const s = document.createElement('style'); s.id = 'kg-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('kg-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, mac: 0, kaz: 0, ag: 0, o: '', sev: 1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'kg' }); root.append(kok);
    let sohbetK = null, izle = false, kozAc = false;
    let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, secili = -1, mesaj = '', mesajT = 0, surT = 0, canli = true, sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, vekil = '', toplaniyor = false, yazSira = Promise.resolve();
    const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
    const koltuklar = () => oda ? oda.koltuklar() : null;
    const botMu = p => mod === 'yz' ? p !== ben : !(koltuklar()[p]);
    const kopuk = p => { const K = koltuklar(); return !!(K && K[p] && !K[p].var); };
    const ad = p => { if (mod === 'yz') return p === ben ? 'Sen' : BOT[p]; const K = koltuklar(); return K && K[p] ? K[p].n : BOT[p]; };
    const benimSira = () => S && !S.bitti && S.sira === ben && !izle;
    const rel = p => (p - ben + 4) % 4;
    const oyunAd = (t, k) => t === 'koz' ? `Koz ${k >= 0 ? SEMBOL[k] : ''}` : KG.AD[t];
    function mesajVer(m, sure) { mesaj = m; clearTimeout(mesajT); mesajT = setTimeout(() => { mesaj = ''; ciz(); }, sure || 2200); ciz(); }
    /* ---------- menü ---------- */
    function menu() {
      temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { } const var_ = eski && eski.S && !(eski.S.bitti && KG.macBitti(eski.S));
      kok.innerHTML = `<div class="kg-menu"><h3>👑 King</h3><p>${D.mac ? `Bilgisayara karşı <b>${D.mac}</b> maç, <b>${D.kaz}</b> galibiyet${D.ag ? ' · çevrimiçi ' + D.ag + ' galibiyet' : ''}` : 'Yirmi el: altı ceza oyunu ve koz. Her oyuncu üç ceza, iki koz seçer. En yüksek toplam kazanır.'}</p>
        ${var_ ? `<button class="kg-b ana" data-a="devam">▶ Yarım kalan maça devam (${eski.S.elNo}. el)</button>` : ''}
        <div class="kg-sat"><button class="kg-b ${var_ ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="kg-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
        <button class="kg-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="kg-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
      if (new URLSearchParams(location.search).get('masa') && /#o\/king/.test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
    }
    function nasil() {
      kok.innerHTML = `<div class="kg-menu"><h3>Nasıl oynanır</h3>
        <p>• 52 kart dört kişiye dağıtılır, maç <b>20 el</b> sürer. Sırası gelen oyuncu elindeki kartlara bakıp o elin oyununu seçer ve ilk kartı o atar.</p>
        <p>• Herkes maç boyunca <b>3 ceza</b> ve <b>2 koz</b> seçer. Her ceza oyunu toplam en çok 2 kez oynanır.</p>
        <p>• <b>Cezalar:</b> El almaz (aldığın her el −50) · Kupa almaz (her kupa −30) · Erkek almaz (her papaz ve vale −60) · Kız almaz (her kız −100) · Rıfkı (kupa papazı −320) · Son iki (son iki elin her biri −180).</p>
        <p>• <b>Koz:</b> seçen kozu belirler; aldığın her el +50.</p>
        <p>• Atılan rengi izlemek zorunludur. Kozda rengin yoksa koz atmak zorundasın. Cezalarda rengin yoksa elindeki ceza kartını atmak zorundasın (kırmızı noktalı kartlar).</p>
        <p>• Kupa almaz ve rıfkıda kupa, kozda koz <b>kırılmadan</b> o renkle el açılmaz. Rıfkıda kupa açılıp masaya as düştüyse papazı, kız almazda masaya o rengin papazı ya da ası düştüyse kızı atmak zorundasın.</p>
        <p>• Bütün ceza kartları çıkınca el erken biter. Atabileceğin kartlar parlak görünür: karta dokun, oynamak için yeniden dokun.</p>
        <a class="kg-b" href="/oyun-kurallari/king/" style="text-decoration:none;display:block">📖 Ayrıntılı kurallar ve ipuçları</a>
        <button class="kg-b ana" data-a="menu">Tamam</button></div>`;
    }
    function agLobi() {
      temizle(); if (!window.Masa) { kok.innerHTML = '<div class="kg-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="kg-b" data-a="menu">‹ Geri</button></div>'; return; }
      lobi = Masa.lobi(kok, { oyun: 'king', koltuk: 4, enAz: 1, botlu: true, baslik: 'King', onGeri: menu, onIzle: o => { lobi = null; agBasla(o); },
        baslat: o => o.baslat(KG.yeni({ ilk: (Math.random() * 4) | 0 })), onOda: o => { lobi = null; agBasla(o); } });
    }
    /* ---------- ekran ---------- */
    function ekran() {
      kok.innerHTML = `<div class="kg-masa" id="kg-m"></div><div class="kg-ben" id="kg-ben"><b></b><small></small><span class="kg-bilgi" id="kg-b"></span></div>
        <div class="kg-el" id="kg-e"></div><div class="kg-panel" id="kg-p"></div><div class="kg-sat"><button class="kg-b" data-a="cik" style="flex:none;width:44px">‹</button><button class="kg-b" data-a="sonel">Son eli gör</button><button class="kg-b" data-a="tablo">📋 Tablo</button></div>`;
    }
    function olcu() {
      const W = kok.clientWidth || 340, cw = Math.max(42, Math.min(64, Math.round(W / 7.6))); kok.style.setProperty('--cw', cw + 'px');
      const m = q('#kg-m'); if (m) { const ust = m.getBoundingClientRect().top, alt = cw * 1.42 + 18 + 32 + 46 + 44 + 7 * 4 + 14 + (S && S.asama === 'secim' && benimSira() ? 60 : 0); m.style.height = Math.round(Math.max(220, Math.min(360, innerHeight - ust - alt))) + 'px'; }
    }
    const epYaz = v => `<span class="ep${v < 0 ? ' eksi' : ''}">${v > 0 ? '+' : ''}${v}</span>`;
    function ciz(gelen) {
      if (!S || !q('#kg-m')) return; olcu(); const bS = benimSira(), L = bS && S.asama === 'oyun' && S.masa.length < 4 ? KG.yasal(S, ben) : [];
      if (secili >= 0 && !S.el[ben].includes(secili)) secili = -1;
      let h = '';
      for (const r of [1, 2, 3]) { const p = (ben + r) % 4, alt = S.asama === 'secim' ? (p === S.secen ? 'seçiyor…' : `${S.alinan[p]} el`) : `${S.alinan[p]} el ${S.elPuan[p] ? epYaz(S.elPuan[p]) : ''}`;
        h += `<div class="kg-oy k${r}${S.sira === p && !S.bitti ? ' sira' : ''}${kopuk(p) ? ' yok' : ''}"><span>${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}${kopuk(p) ? ' (ayrıldı)' : ''}</span><small>${alt}</small><small>${S.puan[p]} puan</small></div>`; }
      h += `<div class="kg-bilg">${S.asama === 'secim' ? `Seçen: <b>${esc(ad(S.secen))}</b>` : `${IKON[S.t]} <b>${oyunAd(S.t, S.koz)}</b><br><small>${esc(ad(S.secen))} seçti · ${ACIK[S.t]}${(S.t === 'kupa' || S.t === 'rifki' || S.t === 'koz') && !S.kirik ? ' · kırılmadı' : ''}</small>`}</div>`;
      h += `<div class="kg-sag">${S.elNo}. el / ${KG.MAC}</div>`;
      const G = [[0, 70], [70, 0], [0, -70], [-70, 0]];
      h += `<div class="kg-orta${toplaniyor ? ' topla' : ''}">${S.masa.map((x, k) => { const r = rel(x.p), [gx, gy] = G[r], w = S.masa.length === 4 ? KG.kazanan(S) : -1, [tx, ty] = w >= 0 ? G[rel(w)].map(v => v * 2) : [0, 0];
        return kartHtml(x.c, `r${r}${gelen && k === S.masa.length - 1 ? ' gel' : ''}${w === x.p ? ' kaz' : ''}${S.t && KG.cezaKart(S.t, x.c) ? ' ceza' : ''}`, `style="--gx:${gx * 1.6}px;--gy:${gy * 1.6}px;--tx:${tx}px;--ty:${ty}px;z-index:${k + 1}"`); }).join('')}</div>`;
      q('#kg-m').innerHTML = h;
      const el = S.el[ben], W = q('#kg-e').clientWidth || 340, cw = parseFloat(kok.style.getPropertyValue('--cw')) || 50, n = el.length, adim = n > 1 ? Math.min(cw + 4, (W - cw) / (n - 1)) : 0, bas = (W - (cw + adim * (n - 1))) / 2;
      q('#kg-e').innerHTML = el.map((c, i) => kartHtml(c, (L.includes(c) ? 'yas ' : bS && S.asama === 'oyun' ? 'kapali ' : '') + (secili === c ? 'sec ' : '') + (S.t && KG.cezaKart(S.t, c) ? 'ceza' : ''), `style="left:${bas + i * adim}px;z-index:${i + 1}"`)).join('');
      const bn = q('#kg-ben'); bn.classList.toggle('sira', !!bS); bn.querySelector('b').textContent = ad(ben);
      bn.querySelector('small').innerHTML = (S.asama === 'secim' ? '' : `${S.alinan[ben]} el ${S.elPuan[ben] ? epYaz(S.elPuan[ben]) : ''} · `) + S.puan[ben] + ' puan';
      let p = '';
      if (!S.bitti && S.asama === 'secim' && bS) {
        const O = KG.secenekler(S, ben), U = S.kul[ben];
        if (kozAc) { for (let k = 0; k < 4; k++) { const say = el.filter(c => renk(c) === k).length; p += `<button class="kg-b koz${KIRMIZI(k) ? ' kr' : ''}" data-koz="${k}">${SEMBOL[k]}<small>${RAD[k]} · ${say}</small></button>`; } p += `<button class="kg-b" data-a="kozgeri" style="flex:1 1 100%">‹ Ceza seç</button>`; }
        else { for (const t of KG.CEZA) { const ok = O.includes(t); p += `<button class="kg-b" data-sec="${t}"${ok ? '' : ' disabled'}>${IKON[t]} ${KG.AD[t]}<small>${ok ? ACIK[t] + ' · ' + (2 - S.cs[t]) + ' kaldı' : S.cs[t] >= 2 ? 'oynandı' : 'cezaların bitti'}</small></button>`; }
          p += `<button class="kg-b koz-ana" data-sec="koz"${O.includes('koz') ? '' : ' disabled'}>⭐ Koz<small>${O.includes('koz') ? 'el başı +50 · ' + (2 - U.k) + ' hakkın var' : 'kozların bitti'}</small></button>`;
          p += `<p>Senin hakların: <b>${3 - U.c.length}</b> ceza, <b>${2 - U.k}</b> koz</p>`; }
      }
      q('#kg-p').innerHTML = p;
      q('[data-a=sonel]').disabled = !S.sonEl;
      let bilgi = '';
      if (!S.bitti) { if (S.asama === 'secim') bilgi = bS ? (kozAc ? 'Kozu seç.' : '<b>Oyunu sen seçiyorsun.</b> Eline bak ve seç.') : `<b>${esc(ad(S.sira))}</b> oyunu seçiyor…`;
        else if (S.masa.length === 4) bilgi = `Eli <b>${esc(ad(KG.kazanan(S)))}</b> aldı.`;
        else bilgi = bS ? (secili >= 0 ? 'Oynamak için karta <b>yeniden dokun</b>.' : 'Sıra sende: parlak kartlardan birine dokun.') : `<b>${esc(ad(S.sira))}</b> oynuyor…`; }
      q('#kg-b').innerHTML = mesaj || bilgi;
    }
    /* ---------- hamleler ---------- */
    function uygula(Y, gel) { S = Y; if (mod === 'ag') gonder(); else yerelKaydet(); ciz(gel); if (S.bitti) bitti(); else surucu(); }
    function oyna(f, s, gel) { const Y = kopya(S); if (!f(Y)) return false; ses(s || 'tap'); uygula(Y, gel); return true; }
    function kartDokun(c) {
      if (!S || S.bitti) return; if (!benimSira() || S.asama !== 'oyun') { secili = secili === c ? -1 : c; return ciz(); }
      const L = KG.yasal(S, ben); if (!L.includes(c)) { secili = -1; return mesajVer(neden(c)); }
      if (secili === c) { secili = -1; oyna(Y => KG.oyna(Y, ben, c), 'tap', true); } else { secili = c; ses('click'); ciz(); }
    }
    function neden(c) {
      const t = S.t, L = KG.yasal(S, ben);
      if (!S.masa.length) return t === 'koz' ? 'Koz kırılmadan kozla el açılmaz.' : 'Kupa kırılmadan kupayla el açılmaz.';
      const led = renk(S.masa[0].c), el = S.el[ben];
      if (L.length === 1 && L[0] === KG.RIFKI && led === 1) return 'Masada kupa ası var: rıfkıyı atmak zorundasın.';
      if (t === 'kiz' && L.length === 1 && deger(L[0]) === 10 && renk(L[0]) === led) return 'Masada papaz ya da as var: kızı atmak zorundasın.';
      if (el.some(x => renk(x) === led)) return `${RAD[led]} izlemek zorundasın.`;
      return t === 'koz' ? 'Rengin yok; koz atmak zorundasın.' : 'Rengin yok; elindeki ceza kartını atmak zorundasın.';
    }
    function surucu() {
      if (izle) return;
      clearTimeout(surT); if (!S || S.bitti || !canli) return;
      const yonetici = mod === 'yz' || (() => { const K = koltuklar(), bagli = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0); return bagli.length && bagli[0] === ben; })();
      if (S.masa.length === 4) { if (!yonetici) return; const i0 = S.son.i; surT = setTimeout(() => { if (!S || S.son.i !== i0 || S.masa.length !== 4) return; toplaniyor = true; ciz(); setTimeout(() => { toplaniyor = false; if (!S || S.son.i !== i0) return; const w = KG.kazanan(S), cezali = S.t !== 'koz' && S.masa.some(x => KG.cezaKart(S.t, x.c)); const Y = kopya(S); KG.topla(Y); ses(w === ben ? (S.t === 'koz' ? 'score' : cezali || S.t === 'el' ? 'bad' : 'click') : 'click'); uygula(Y); }, 330); }, 900); return; }
      const p = S.sira; let sure;
      if (mod === 'yz') { if (p === ben) return; sure = S.asama === 'oyun' ? 650 : 900; }
      else { const K = koltuklar(), bagli = K.map((x, i) => x && x.var ? i : -1).filter(i => i >= 0 && i !== p); if (!bagli.length || bagli[0] !== ben) return; sure = !K[p] || vekil === p + ':' + S.tur + ':' + S.son.i ? 700 : !K[p].var ? 12000 : 60000; }
      const i0 = S.son.i, tur0 = S.tur; surT = setTimeout(() => { if (!S || S.bitti || S.sira !== p || S.son.i !== i0 || S.tur !== tur0 || !canli) return; botAdim(p); }, sure);
    }
    function botAdim(p) {
      const Y = kopya(S), s = mod === 'yz' ? sev : 1;
      if (Y.asama === 'secim') { const x = KG.botSec(Y, p, s); KG.sec(Y, p, x.t, x.k); if (p !== ben) mesajVer(`<b>${esc(ad(p))}</b> ${IKON[x.t]} <b>${oyunAd(x.t, x.k == null ? -1 : x.k)}</b> seçti.`, 2600); }
      else KG.oyna(Y, p, KG.botOyna(Y, p, s));
      if (p === ben) { secili = -1; kozAc = false; } vekil = !Y.bitti && Y.sira === p ? p + ':' + Y.tur + ':' + Y.son.i : ''; ses('tap'); uygula(Y, Y.asama === 'oyun' && Y.son.t === 'oy');
    }
    /* ---------- bitiş ---------- */
    function tabloHtml(bitis) {
      const mb = bitis && KG.macBitti(S), sira = [0, 1, 2, 3].sort((a, c) => S.puan[c] - S.puan[a]), MS = (S.mac || [0, 0, 0, 0]).slice(); if (mb) MS[sira[0]]++;
      const son = bitis ? S.sonuc : S.elPuan;
      return `<table class="kg-tablo"><thead><tr><th></th><th>${bitis ? 'Bu el' : 'Bu el (şimdilik)'}</th><th>Toplam</th>${MS.some(Boolean) ? '<th>🏆</th>' : ''}</tr></thead>
        <tbody>${sira.map((p, k) => `<tr class="${p === ben ? 'ben' : ''}${k === 0 ? ' ilk' : ''}"><td>${botMu(p) ? '🤖 ' : ''}${esc(ad(p))}</td><td>${son[p] > 0 ? '+' : ''}${son[p]}</td><td><b>${S.puan[p]}</b></td>${MS.some(Boolean) ? `<td>${MS[p]}</td>` : ''}</tr>`).join('')}</tbody></table>
        <div class="kg-gec">${S.gecmis.map((g, i) => `<span class="${g.s === ben ? 'ben' : ''}" title="${esc(ad(g.s))}">${i + 1}. ${IKON[g.t]} ${oyunAd(g.t, g.k)}</span>`).join('')}</div>
        <p style="font-size:12px">Kalan cezalar: ${KG.CEZA.filter(t => S.cs[t] < 2).map(t => `${KG.AD[t]} ×${2 - S.cs[t]}`).join(' · ') || 'yok'} · Senin hakların: ${3 - S.kul[ben].c.length} ceza, ${2 - S.kul[ben].k} koz</p>`;
    }
    function tablo() {
      if (!S) return; const e = q('.kg-son'); if (e) e.remove(); const s = E('div', { class: 'kg-son' });
      s.innerHTML = `<div><h3>📋 Puan tablosu</h3><p>${S.elNo}. el / ${KG.MAC}</p>${tabloHtml(false)}<button class="kg-b ana" data-a="tabkapat">Kapat</button></div>`; kok.append(s);
    }
    function bitti() {
      clearTimeout(surT); const mb = KG.macBitti(S), anahtar = mod + ':' + S.tur + ':' + (oda ? oda.kod : ''), lider = [0, 1, 2, 3].sort((a, c) => S.puan[c] - S.puan[a])[0], macBen = lider === ben, benim = S.sonuc[ben];
      if (sayilan !== anahtar) { sayilan = anahtar; const PR = window.Progress; if (PR) PR.olay('kg_el');
        if (mod === 'yz') { if (mb) { D.mac++; if (macBen) { D.kaz++; api.submitScore(D.kaz); } } kaydet(); yerelKaydet(); }
        else { if (mb && macBen) { D.ag++; kaydet(); } if (oda && mb) oda.bitir(); }
        const iyi = (mb && macBen) || (S.t === 'koz' ? benim >= 250 : benim === 0); ses(iyi ? 'win' : benim < -150 ? 'lose' : 'click'); if (mb && macBen) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } }
      if (mod === 'ag' && oda && window.Masa && Masa.sonuc && mb) Masa.sonuc(oda, macBen ? 1 : 0, 'm' + S.tur);
      oyun._paylas = 'King: ' + (mb ? (macBen ? 'maçı ' + S.puan[ben] + ' puanla kazandım! 👑' : 'maç bitti, ' + S.puan[ben] + ' puan.') : oyunAd(S.t, S.koz) + ' elinde ' + (benim > 0 ? '+' : '') + benim + '.') + '\nerdevelop.com/oyunlar/#o/king';
      const e = q('.kg-son'); if (e) e.remove(); const s = E('div', { class: 'kg-son' });
      const bas = mb ? (macBen ? '🏆 Maçı kazandın!' : esc(ad(lider)) + ' maçı kazandı') : S.t === 'koz' ? (benim >= 250 ? `⭐ ${benim / 50} el topladın!` : `${oyunAd(S.t, S.koz)}: ${benim / 50} el aldın`) : benim === 0 ? `😎 ${KG.AD[S.t]}: temiz çıktın!` : `${KG.AD[S.t]}: ${benim}`;
      s.innerHTML = `<div><h3>${bas}</h3><p>${S.elNo}. el / ${KG.MAC} · ${IKON[S.t]} ${oyunAd(S.t, S.koz)} · ${esc(ad(S.secen))} seçti${S.erken ? ' · ceza kartları bitti, el erken kapandı' : ''}</p>${tabloHtml(true)}
        <button class="kg-b ana" data-a="yine">${mb ? 'Yeni maç' : 'Sonraki el'}</button><button class="kg-b" data-a="menu">Menü</button></div>`;
      if (mod === 'ag' && window.Masa && Masa.karsiYazi) { const kz = Masa.karsiYazi(oda); if (kz) { const p2 = document.createElement('p'); p2.className = 'ms-karsi'; p2.textContent = kz; const b1 = s.querySelector('button'); if (b1) b1.parentNode.insertBefore(p2, b1); } } kok.append(s);
    }
    /* ---------- kayıt / ağ ---------- */
    function yerelKaydet() { if (mod !== 'yz' || !S) return; D.o = S.bitti && KG.macBitti(S) ? '' : JSON.stringify({ S, sev }); D.sev = sev; kaydet(); }
    function gonder() {
      if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
      yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
    }
    function al(d) {
      const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
      const onceki = S; S = d; if (onceki && S.tur !== onceki.tur) { const e = q('.kg-son'); if (e) e.remove(); secili = -1; kozAc = false; }
      if (onceki && S.son && onceki.son && S.son.i !== onceki.son.i && S.son.t === 'sec' && S.son.p !== ben) mesajVer(`<b>${esc(ad(S.son.p))}</b> ${IKON[S.t]} <b>${oyunAd(S.t, S.koz)}</b> seçti.`, 2600);
      const gel = onceki && S.son && onceki.son && S.son.i !== onceki.son.i && S.son.t === 'oy'; if (gel) ses('tap');
      ciz(gel); if (S.bitti) { if (!q('.kg-son')) bitti(); } else surucu();
    }
    function yzBasla(s, eski) { temizle(); izle = false; mod = 'yz'; ben = 0; sev = s; secili = -1; mesaj = ''; kozAc = false; S = eski && eski.S ? eski.S : KG.yeni({}); ekran(); ciz(); yerelKaydet(); if (S.bitti) bitti(); else surucu(); }
    function agBasla(o) {
      temizle(); izle = !!o.izleyici; mod = 'ag'; oda = o; ben = Math.max(0, o.ben); S = null; secili = -1; mesaj = ''; kozAc = false; yerelSur = 0; sonMetin = ''; bekleyen = 0; ekran(); sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(o, { yer: q('[data-a=cik]').parentNode, sonra: q('[data-a=cik]'), koltuk: p => p === ben ? q('#kg-ben') : q(`.kg-oy.k${rel(p)}`) }) : null;
      odaBirak = oda.dinle(v => { if (!v) { if (S) mesajVer('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben); if (!bekleyen) al(d); if (S && !S.bitti) { ciz(); surucu(); } });
    }
    function temizle() { if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); toplaniyor = false; if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
    kok.addEventListener('click', e => {
      const b = e.target.closest('button'); if (b && b.closest('.ms')) return;
      if (!b) { const k = e.target.closest('.kg-el .kg-k'); if (k) kartDokun(+k.dataset.c); else if (e.target.closest('#kg-m') && secili >= 0 && benimSira()) kartDokun(secili); return; }
      if (b.dataset.sec != null) { if (!benimSira() || S.asama !== 'secim') return; const t = b.dataset.sec; if (t === 'koz') { kozAc = true; ses('click'); return ciz(); } oyna(Y => KG.sec(Y, ben, t), 'click'); return; }
      if (b.dataset.koz != null) { if (benimSira() && S.asama === 'secim') { kozAc = false; oyna(Y => KG.sec(Y, ben, 'koz', +b.dataset.koz), 'score'); } return; }
      const a = b.dataset.a;
      if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const o = JSON.parse(D.o); yzBasla(o.sev == null ? 1 : o.sev, o); } catch (x) { menu(); } }
      else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
      else if (a === 'kozgeri') { kozAc = false; ciz(); }
      else if (a === 'tablo') tablo(); else if (a === 'tabkapat') { const e2 = q('.kg-son'); if (e2) e2.remove(); }
      else if (a === 'cik') { if (mod === 'ag' && S && !S.bitti && !b.dataset.emin) { b.dataset.emin = 1; mesajVer('Çıkarsan masadan kalkmış olursun. Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
      else if (a === 'sonel') { if (S && S.sonEl) mesajVer('Son el: ' + S.sonEl.map(x => `${esc(ad(x.p))} ${kartYazi(x.c)}`).join(' · ') + ` → <b>${esc(ad(KG.kazanan(S, S.sonEl)))}</b>`, 4500); }
      else if (a === 'yine') { const y = KG.sonraki(S), e2 = q('.kg-son'); if (e2) e2.remove(); secili = -1; kozAc = false; if (mod === 'ag') { S = null; sonMetin = ''; oda.yeniden(y); } else { S = y; ciz(); yerelKaydet(); surucu(); } } });
    const boyutla = () => { if (S) ciz(); }; addEventListener('resize', boyutla);
    const sakla = () => yerelKaydet(); addEventListener('pagehide', sakla);
    api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); removeEventListener('resize', boyutla); removeEventListener('pagehide', sakla); root.classList.remove('kg-mount'); });
    menu();
    if (/[?&]kgtest/.test(location.search)) window.__kg = { S: () => S, ben: () => ben, KG, kartDokun, mod: () => mod, botAdim, set: Y => { S = Y; ciz(); surucu(); } };
  }
});
})();
