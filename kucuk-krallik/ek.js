/* Küçük Krallık · ek sistemler
   Hava durumu, komutan yetenekleri, lordlarla diplomasi, sefer tekrarı ve sırası,
   köy sahnesine dokunma ve iskele, iş sırası kartı, "sen yokken" olayları.
   Ana oyun betiğinden ÖNCE yüklenir; yalnızca tanımlar içerir. Oyun hazır olunca kkInit() çağrılır. */

var kkBoot = Date.now() + 7000;          // açılıştan sonraki bu süre "sen yokken" sayılır
var kkSahneBekleyen = null;              // sekme gizliyken biten savaş sahnesi

function kkEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
/* dil: İngilizce seçiliyse ikinci metin */
function kkL(tr, en) { return window.erDil && erDil.lang === 'en' ? en : tr; }
function kkT(s) { return window.erDil && s != null ? erDil.tr(String(s)) : s; }
function kkTot(X) { let t = 0; for (const k in X) t += X[k] || 0; return t; }

/* ================= HAVA DURUMU ================= */
const HAVA = {
  acik:    { n: 'Açık', ne: 'Clear', i: '☀️', d: 'Hava açık, etkisi yok', de: 'Clear skies, no effect', u: {}, s: 1 },
  yagmur:  { n: 'Yağmur', ne: 'Rain', i: '🌧️', d: 'Okçular −%20 · seferler %15 yavaş', de: 'Archers −20% · marches 15% slower', u: { arch: .8 }, s: 1.15 },
  kar:     { n: 'Kar', ne: 'Snow', i: '❄️', d: 'Süvari −%25 · seferler %30 yavaş', de: 'Cavalry −25% · marches 30% slower', u: { cav: .75 }, s: 1.3 },
  sis:     { n: 'Sis', ne: 'Fog', i: '🌫️', d: 'Okçular −%15 · katapult −%25', de: 'Archers −15% · catapults −25%', u: { arch: .85, cat: .75 }, s: 1 },
  firtina: { n: 'Fırtına', ne: 'Storm', i: '⛈️', d: 'Okçular ve katapult −%30 · seferler %25 yavaş', de: 'Archers and catapults −30% · marches 25% slower', u: { arch: .7, cat: .7 }, s: 1.25 },
  sicak:   { n: 'Kavurucu sıcak', ne: 'Scorching heat', i: '🔥', d: 'Piyade ve süvari −%10', de: 'Infantry and cavalry −10%', u: { inf: .9, cav: .9 }, s: 1.05 }
};
const HAVA_SURE = 3 * 3600e3; // her hava 3 saat sürer
const HAVA_OLAS = [ // mevsime göre olasılıklar: kış, ilkbahar, yaz, sonbahar
  [['acik', .35], ['kar', .35], ['sis', .15], ['firtina', .15]],
  [['acik', .5], ['yagmur', .3], ['sis', .1], ['firtina', .1]],
  [['acik', .6], ['sicak', .25], ['firtina', .1], ['yagmur', .05]],
  [['acik', .4], ['yagmur', .3], ['sis', .2], ['firtina', .1]]
];
function kkSeason(t) { const m = new Date(t || Date.now()).getMonth(); return m === 11 || m < 2 ? 0 : m < 5 ? 1 : m < 8 ? 2 : 3; }
function havaAt(t) {
  const slot = Math.floor(t / HAVA_SURE);
  let h = (slot * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
  const r = (h % 10000) / 10000, L = HAVA_OLAS[kkSeason(slot * HAVA_SURE)];
  let a = 0; for (const p of L) { a += p[1]; if (r < a) return p[0]; } return 'acik';
}
var kkHavaC = { slot: -1, k: 'acik' };
function havaNow() { const s = Math.floor(Date.now() / HAVA_SURE); if (s !== kkHavaC.slot) { kkHavaC = { slot: s, k: havaAt(Date.now()) }; } return kkHavaC.k; }
function havaKalan() { return HAVA_SURE - (Date.now() % HAVA_SURE); }
/* savaşta birim çarpanı (iki taraf için de geçerli); "Her havada" yeteneği cezayı yarıya indirir */
function hvU(a) {
  const m = (HAVA[havaNow()].u[a]) || 1; if (m >= 1) return m;
  return typeof yetVar === 'function' && yetVar('hava') ? 1 - (1 - m) / 2 : m;
}
/* sefer süresi çarpanı */
function kkSeferMul() {
  let m = HAVA[havaNow()].s || 1;
  if (m > 1 && yetVar('hava')) m = 1 + (m - 1) / 2;
  if (yetVar('yuruyus')) m *= .8;
  return m;
}
/* haritada mevsim rengi (dünya koordinatlarında, arazinin hemen üstüne) */
function kkHaritaMevsim(c, B) {
  const si = kkSeason();
  c.save();
  if (si === 0) { c.globalAlpha = .34; c.fillStyle = '#eef3f8'; c.fillRect(B.x0, B.y0, B.w, B.h); }
  else if (si === 3) { c.globalCompositeOperation = 'multiply'; c.globalAlpha = .22; c.fillStyle = '#e0a060'; c.fillRect(B.x0, B.y0, B.w, B.h); }
  else if (si === 2) { c.globalAlpha = .08; c.fillStyle = '#ffe49a'; c.fillRect(B.x0, B.y0, B.w, B.h); }
  c.restore();
}
/* haritada hava parçacıkları ve bilgi rozeti (ekran koordinatlarında) */
function kkHaritaHava(c, cw, ch, dpr, now) {
  const k = havaNow(), H = HAVA[k];
  c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  kkHavaCiz(c, cw, ch, now, k, 1);
  // rozet
  const t = H.i + ' ' + kkL(H.n, H.ne) + (k === 'acik' ? '' : ' · ' + kkL(H.d, H.de).split(' · ')[0]);
  c.font = '600 12px Nunito,system-ui,sans-serif'; const w = Math.min(cw - 20, c.measureText(t).width + 18);
  c.fillStyle = 'rgba(40,30,20,.72)'; c.beginPath(); if (c.roundRect) c.roundRect(10, ch - 34, w, 24, 12); else c.rect(10, ch - 34, w, 24); c.fill();
  c.fillStyle = '#fbf1de'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(t, 19, ch - 21.5, w - 18);
  c.restore();
}
/* yağmur, kar, sis, fırtına parçacıkları; durumsuz (zamandan hesaplanır) */
function kkHavaCiz(c, cw, ch, now, k, yog) {
  const t = now / 1000;
  if (k === 'yagmur' || k === 'firtina') {
    const n = Math.round((k === 'firtina' ? 140 : 80) * yog); c.strokeStyle = 'rgba(200,220,240,.55)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < n; i++) { const sp = 520 + (i * 37 % 200); const x = ((i * 97.13 + t * 90) % (cw + 60)) - 30, y = ((i * 53.7 + t * sp) % (ch + 40)) - 20; c.moveTo(x, y); c.lineTo(x - 4, y + 13); }
    c.stroke();
    if (k === 'firtina') { const f = now % 9000; if (f < 90 || (f > 180 && f < 240)) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, 0, cw, ch); } c.fillStyle = 'rgba(20,25,40,.12)'; c.fillRect(0, 0, cw, ch); }
  } else if (k === 'kar') {
    const n = Math.round(90 * yog); c.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < n; i++) { const sp = 22 + (i * 13 % 30), x = ((i * 71.3 + Math.sin(t * .8 + i) * 18 + t * 12) % (cw + 20)) - 10, y = ((i * 41.9 + t * sp) % (ch + 20)) - 10, r = 1 + (i % 3) * .6; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); }
  } else if (k === 'sis') {
    for (let i = 0; i < 4; i++) { const y = ch * (.15 + i * .24), x = ((t * (8 + i * 3) + i * 300) % (cw + 600)) - 300, g = c.createRadialGradient(x, y, 10, x, y, 320); g.addColorStop(0, 'rgba(235,238,240,.42)'); g.addColorStop(1, 'rgba(235,238,240,0)'); c.fillStyle = g; c.fillRect(0, 0, cw, ch); }
    c.fillStyle = 'rgba(230,234,238,.18)'; c.fillRect(0, 0, cw, ch);
  } else if (k === 'sicak') {
    c.fillStyle = 'rgba(255,196,110,.10)'; c.fillRect(0, 0, cw, ch);
  }
}
function kkSure(ms) { const m = Math.max(1, Math.round(ms / 60000)), h = Math.floor(m / 60), r = m % 60; return kkL((h ? h + ' sa ' : '') + (r || !h ? r + ' dk' : ''), (h ? h + ' h ' : '') + (r || !h ? r + ' min' : '')).trim(); }
function kkHavaSatir() {
  const k = havaNow(), H = HAVA[k], now = Date.now();
  let nx = k, n = 0; for (n = 1; n <= 8; n++) { nx = havaAt(now + n * HAVA_SURE); if (nx !== k) break; }
  const N = HAVA[nx], kl = kkSure(havaKalan() + (n - 1) * HAVA_SURE), ayni = nx === k;
  return kkL(
    H.i + ' Hava: ' + H.n + (k === 'acik' ? '' : ' — ' + H.d) + ' · ' + (ayni ? 'gün boyu böyle' : kl + ' sonra ' + N.i + ' ' + N.n),
    H.i + ' Weather: ' + H.ne + (k === 'acik' ? '' : ' — ' + H.de) + ' · ' + (ayni ? 'all day' : N.i + ' ' + N.ne + ' in ' + kl));
}

/* ================= KOMUTAN YETENEKLERİ ================= */
const YET = {
  suvari:  { n: 'Süvari hücumu', ne: 'Cavalry charge', i: '🐎', d: 'Süvari saldırısı +%20', de: 'Cavalry attack +20%' },
  kalkan:  { n: 'Kalkan duvarı', ne: 'Shield wall', i: '🛡️', d: 'Piyade dayanıklılığı +%25', de: 'Infantry HP +25%' },
  ok:      { n: 'Ok yağmuru', ne: 'Arrow rain', i: '🏹', d: 'Okçu saldırısı +%20', de: 'Archer attack +20%' },
  mizrak:  { n: 'Mızrak ormanı', ne: 'Forest of spears', i: '🔱', d: 'Mızrakçı saldırısı ve dayanıklılığı +%12', de: 'Spearman attack and HP +12%' },
  kusatma: { n: 'Kuşatma ustası', ne: 'Siege master', i: '🪨', d: 'Katapult saldırısı +%25', de: 'Catapult attack +25%' },
  yuruyus: { n: 'Hızlı yürüyüş', ne: 'Forced march', i: '👣', d: 'Seferler %20 daha hızlı', de: 'Marches 20% faster' },
  hekim:   { n: 'Saha hekimi', ne: 'Field medic', i: '⚕️', d: 'Yaralı kurtarma +%10', de: 'Wounded saved +10%' },
  yagma:   { n: 'Yağmacı', ne: 'Plunderer', i: '💰', d: 'Ganimet +%10', de: 'Loot +10%' },
  hava:    { n: 'Her havada', ne: 'All-weather', i: '🌦️', d: 'Kötü hava cezaları yarıya iner', de: 'Bad weather penalties halved' }
};
const YET_SV = [3, 6, 10, 15]; // yetenek yuvalarının açıldığı komutan seviyeleri
function yetVar(id) { const k = typeof S !== 'undefined' && S && S.komutan; return !!(k && Array.isArray(k.yet) && k.yet.indexOf(id) >= 0); }
function kkYetW(u) { return (u === 'cav' && yetVar('suvari') ? 1.2 : 1) * (u === 'arch' && yetVar('ok') ? 1.2 : 1) * (u === 'spear' && yetVar('mizrak') ? 1.12 : 1) * (u === 'cat' && yetVar('kusatma') ? 1.25 : 1); }
function kkYetA(u) { return (u === 'inf' && yetVar('kalkan') ? 1.25 : 1) * (u === 'spear' && yetVar('mizrak') ? 1.12 : 1); }
function kkLootMul() { return yetVar('yagma') ? 1.1 : 1; }
function kkWoundAdd() { return yetVar('hekim') ? .1 : 0; }
/* savaş gücüne ek çarpan: müttefik lordlar */
function kkExtraMul() { return 1 + .06 * kkMuttefikSay(); }
function yetHtml(k) {
  const sv = k.sv || 1, my = Array.isArray(k.yet) ? k.yet : [];
  const yn = function (x) { return kkL(YET[x].n, YET[x].ne); }, yd = function (x) { return kkL(YET[x].d, YET[x].de); };
  let h = '<div style="margin-top:10px"><b style="font-size:13px">' + kkL('Komutan ustalıkları', 'Commander masteries') + '</b><p class="eff" style="margin:2px 0 6px">' + kkL('Komutan belirli seviyelerde yeni bir ustalık yuvası açar. Bir kez seçilir; değiştirmek 100 altın.', 'The commander unlocks a new mastery slot at certain levels. Chosen once; changing costs 100 gold.') + '</p>';
  YET_SV.forEach(function (lv, i) {
    const id = my[i];
    if (sv < lv) { h += '<p class="eff" style="margin:4px 0">🔒 ' + kkL((i + 1) + '. yuva · Sv ' + lv + '\'te açılır', 'Slot ' + (i + 1) + ' · opens at Lv ' + lv) + '</p>'; return; }
    if (id && YET[id]) { h += '<div class="foot" style="margin:4px 0"><span>' + YET[id].i + ' <b>' + yn(id) + '</b> <small style="color:var(--mute)">' + yd(id) + '</small></span><button class="sm g" data-yetsil="' + i + '">' + kkL('Değiştir', 'Change') + '</button></div>'; return; }
    h += '<p class="eff" style="margin:6px 0 4px">' + kkL((i + 1) + '. yuva boş — bir ustalık seç:', 'Slot ' + (i + 1) + ' is empty — pick a mastery:') + '</p><div class="btns wrapb" style="gap:4px">' + Object.keys(YET).filter(function (x) { return my.indexOf(x) < 0; }).map(function (x) { return '<button class="sm g" data-yet="' + x + '" data-yi="' + i + '" title="' + kkEsc(yd(x)) + '">' + YET[x].i + ' ' + yn(x) + '</button>'; }).join('') + '</div>';
  });
  return h + '</div>';
}
function yetSec(id, i) { const k = S.komutan; if (!k || !YET[id]) return; k.yet = Array.isArray(k.yet) ? k.yet : []; if ((k.sv || 1) < YET_SV[i]) return; if (k.yet.indexOf(id) >= 0) return; k.yet[i] = id; toast(YET[id].i + ' ' + kkL(YET[id].n + ' öğrenildi', YET[id].ne + ' learned')); sfx('win'); save(); render(); }
function yetSil(i) { const k = S.komutan; if (!k || !Array.isArray(k.yet) || !k.yet[i]) return; if ((S.g || 0) < 100) return toast(kkL('100 altın gerek', '100 gold needed')); S.g -= 100; k.yet[i] = null; save(); render(); }

/* ================= DİPLOMASİ ================= */
const DIP_SURE = 24 * 3600e3;
function dipAktif(l) { return l && l.dip && l.dip.e > Date.now() ? l.dip : null; }
function kkMuttefikSay() { if (typeof S === 'undefined' || !S || !Array.isArray(S.lords)) return 0; return S.lords.filter(function (l) { const d = dipAktif(l); return d && d.t === 'ittifak'; }).length; }
function dipCeza() { return S.dipCeza && S.dipCeza > Date.now() ? 1.5 : 1; }
function dipFiyat(l, t) { const tr = l.tier || 1; return Math.round((t === 'ticaret' ? 40 + 30 * tr : 100 + 60 * tr) * dipCeza()); }
function dipGelir(l) { const t = l.tier || 1; return { w: 6 * t, s: 5 * t, f: 4 * t, g: .4 * t }; } // dakika başına
function dipHtml(l) {
  if (!l || l.beaten) return '';
  const d = dipAktif(l), now = Date.now();
  if (l.kin) return '<p class="eff" style="margin:6px 0 0">😠 ' + kkL('Anlaşmayı bozdun; ' + kkEsc(kkT(l.ad)) + ' kinli. Ordusu %25 güçlü, yenilene kadar anlaşma yapmaz.', 'You broke the pact; ' + kkEsc(kkT(l.ad)) + ' holds a grudge. Army 25% stronger, no deals until defeated.') + '</p>';
  if (d) {
    const gl = dipGelir(l), alli = d.t === 'ittifak';
    let h = '<p class="eff" style="margin:6px 0 0">' + (alli ? kkL('🛡️ <b>Müttefik</b> · savaş gücün +%6', '🛡️ <b>Ally</b> · combat power +6%') : kkL('🤝 <b>Ticaret anlaşması</b>', '🤝 <b>Trade pact</b>')) + kkL(' · kervan dakikada +' + gl.w + ' odun, +' + gl.s + ' taş, +' + gl.f + ' yemek · ' + tm((d.e - now) / 1000) + ' kaldı', ' · caravan per minute +' + gl.w + ' wood, +' + gl.s + ' stone, +' + gl.f + ' food · ' + tm((d.e - now) / 1000) + ' left') + '</p>';
    if (!alli) { const c = dipFiyat(l, 'ittifak'); h += '<div class="btns wrapb" style="margin-top:6px;gap:4px"><button class="sm g" data-dip="ittifak" data-dl="' + l.id + '"' + ((S.g || 0) < c ? ' disabled' : '') + '>🛡️ ' + kkL('İttifak kur (' + fmt(c) + ' altın)', 'Form alliance (' + fmt(c) + ' gold)') + '</button></div>'; }
    return h + '<p class="eff" style="margin:4px 0 0"><small>' + kkL('Anlaşma varken saldırırsan anlaşma bozulur.', 'Attacking while a pact is active breaks it.') + '</small></p>';
  }
  const c = dipFiyat(l, 'ticaret');
  return '<div class="btns wrapb" style="margin-top:6px;gap:4px"><button class="sm g" data-dip="ticaret" data-dl="' + l.id + '"' + ((S.g || 0) < c ? ' disabled' : '') + '>🤝 ' + kkL('Ticaret anlaşması (' + fmt(c) + ' altın)', 'Trade pact (' + fmt(c) + ' gold)') + '</button></div><p class="eff" style="margin:4px 0 0"><small>' + kkL('24 saat kervan geliri; sonra ittifak kurup savaş gücü kazanabilirsin.', '24 hours of caravan income; then you can form an alliance for combat power.') + (dipCeza() > 1 ? kkL(' Anlaşma bozduğun için fiyatlar geçici olarak %50 pahalı.', ' Prices are temporarily 50% higher because you broke a pact.') : '') + '</small></p>';
}
function dipYap(id, t) {
  ensureLords(); const l = S.lords.find(function (x) { return x.id === id; }); if (!l || l.beaten || l.kin) return;
  const d = dipAktif(l); if (t === 'ittifak' && (!d || d.t !== 'ticaret')) return toast(kkL('Önce ticaret anlaşması gerek', 'A trade pact is needed first'));
  const c = dipFiyat(l, t); if ((S.g || 0) < c) return toast(kkL(fmt(c) + ' altın gerek', fmt(c) + ' gold needed'));
  S.g -= c; const now = Date.now();
  if (t === 'ticaret') l.dip = { t: 'ticaret', e: now + DIP_SURE, lt: now };
  else { dipTick(); l.dip = { t: 'ittifak', e: now + DIP_SURE, lt: now }; }
  toast(t === 'ticaret' ? '🤝 ' + kkL(kkT(l.ad) + ' ile ticaret anlaşması yapıldı', 'Trade pact made with ' + l.ad) : '🛡️ ' + kkL(kkT(l.ad) + ' artık müttefikin', kkT(l.ad) + ' is now your ally')); sfx('coin'); save(); render();
}
/* anlaşmalı lorda saldırma: ilk basışta uyar, 6 sn içinde ikinci basışta boz */
var kkBozOnay = null;
function dipSaldiriIzni(id) {
  const l = (S.lords || []).find(function (x) { return x.id === id; }); if (!l || !dipAktif(l)) return true;
  if (kkBozOnay && kkBozOnay.id === id && kkBozOnay.t > Date.now()) {
    kkBozOnay = null; dipTick(); l.dip = null; l.kin = 1; for (const k in l.ordu) l.ordu[k] = Math.ceil(l.ordu[k] * 1.25);
    S.dipCeza = Date.now() + 2 * 3600e3; toast(kkL('Anlaşma bozuldu! ' + kkT(l.ad) + ' kinli, diğer lordlar sana güvenmiyor.', 'Pact broken! ' + kkT(l.ad) + ' holds a grudge and the other lords distrust you.')); return true;
  }
  kkBozOnay = { id: id, t: Date.now() + 6000 }; toast(kkL(kkT(l.ad) + ' ile anlaşman var. Bozup saldırmak için tekrar bas.', 'You have a pact with ' + kkT(l.ad) + '. Press again to break it and attack.')); return false;
}
/* ticaret geliri; çevrimdışı süreyi de kapsar */
function dipTick() {
  if (!Array.isArray(S.lords)) return; const now = Date.now(); let top = { w: 0, s: 0, f: 0, g: 0 }, bit = [];
  S.lords.forEach(function (l) {
    const d = l.dip; if (!d) return; const t1 = Math.min(now, d.e), mn = Math.max(0, t1 - (d.lt || t1)) / 60000;
    if (mn > 0) { const gl = dipGelir(l); for (const r in top) top[r] += gl[r] * mn; d.lt = t1; }
    if (d.e <= now) { bit.push(l.ad); l.dip = null; }
  });
  const c = cap(S.lv); let any = false;
  ['w', 's', 'f'].forEach(function (r) { const v = Math.floor(top[r]); if (v > 0) { S[r] = Math.min(c, (S[r] || 0) + v); any = true; } });
  S.dipG = (S.dipG || 0) + top.g; if (S.dipG >= 1) { const g = Math.floor(S.dipG); S.dipG -= g; S.g = (S.g || 0) + g; any = true; }
  if (any && Date.now() < kkBoot) { const o = kkOffSum(); o.tic = o.tic || { w: 0, s: 0, f: 0, g: 0 }; for (const r in top) o.tic[r] += top[r]; }
  bit.forEach(function (n) { const t = '🤝 ' + kkL(n + ' ile anlaşma sona erdi', 'Pact with ' + n + ' has ended'); kkOlay(t); try { postaEkle('krallik', t, kkL('Yeniden anlaşmak için lordun kartından ticaret anlaşması yapabilirsin.', 'You can make a new trade pact from the lord’s card.')); } catch (e) { } });
  return any;
}

/* ================= SEFER TEKRARI VE SIRASI ================= */
function kkHedefDusman(kind, target) {
  if (kind === 'ter') { const lv = TR[target].lv; return [enemy(lv), 1 + .04 * (lv - 1)]; }
  if (kind === 'lord') { const l = (S.lords || []).find(function (x) { return x.id === target; }); return l ? [l.ordu, 1 + .05 * ((l.tier || 1) - 1)] : null; }
  if (kind === 'wave') { const w = S.wave || 1; return [enemyW(w), (1 + .04 * (w - 1)) * (w % 5 === 0 ? 1.3 : 1)]; }
  if (kind === 'obj') { const o = (S.mobj || []).find(function (x) { return x.id === target; }); return o && o.k === 'camp' ? [enemy(o.lv), 1 + .04 * (o.lv - 1)] : null; }
  return null;
}
function kkHedefGecerli(q) {
  if (q.kind === 'ter') return !S.ter[q.target] && (q.target === 0 || !!S.ter[q.target - 1]);
  if (q.kind === 'lord') { const l = (S.lords || []).find(function (x) { return x.id === q.target; }); return !!(l && !l.beaten && !dipAktif(l)); }
  if (q.kind === 'obj') { const o = (S.mobj || []).find(function (x) { return x.id === q.target; }); return !!(o && (o.k !== 'res' || o.amt > 0)); }
  if (q.kind === 'boss') return !!(S.boss && !S.boss.beaten && S.boss.hp > 0);
  return true;
}
function kkSiraEkle(kind, target, A) {
  S.seferQ = Array.isArray(S.seferQ) ? S.seferQ : [];
  if (S.seferQ.length >= 6) return toast(kkL('Sırada en fazla 6 hedef olabilir', 'At most 6 targets can be queued'));
  if (S.seferQ.some(function (q) { return q.kind === kind && q.target === target; })) return toast(kkL('Bu hedef zaten sırada', 'This target is already queued'));
  const res = kind === 'obj' && ((S.mobj || []).find(function (x) { return x.id === target; }) || {}).k === 'res';
  S.seferQ.push({ kind: kind, target: target, A: res ? Object.assign({}, A || {}) : null, ad: seferAd({ kind: kind, target: target }) });
  toast('➕ ' + kkL('Sıraya eklendi: ', 'Queued: ') + kkT(seferAd({ kind: kind, target: target })) + (res ? '' : kkL(' · ordu yola çıkarken düşmana göre ayarlanır', ' · the army is sized to the enemy when it sets off'))); save(); render();
}
function kkSiraTick() {
  const Q = S.seferQ; if (!Array.isArray(Q) || !Q.length) return;
  if ((S.sefer || []).length >= SEFMAX) return;
  const q = Q[0];
  if (!kkHedefGecerli(q)) { Q.shift(); toast(kkL('Sıradaki hedef artık yok: ', 'Queued target is gone: ') + kkT(q.ad)); save(); render(); return; }
  const old = Object.assign({}, sel), home = wHomeArmy(), busy = (S.sefer || []).length;
  let ok = true;
  if (q.A) { for (const k in U) sel[k] = Math.min(q.A[k] || 0, S.ar[k] || 0); if (kkTot(sel) < 1) ok = false; }
  else {
    const T = kkHedefDusman(q.kind, q.target);
    if (T) { const r = autoOrdu(T[0], T[1]); if (!r) ok = false; else if (r.m === 'full') { ok = false; if (!busy) { Q.shift(); toast(kkL('Sıradan çıkarıldı: ' + q.ad + ' için ordun yetmiyor (' + r.r + ')', 'Removed from queue: your army is not enough for ' + kkT(q.ad) + ' (' + kkT(r.r) + ')')); save(); render(); for (const k in U) sel[k] = old[k] || 0; return; } } }
    else { for (const k in U) sel[k] = home[k] || 0; if (kkTot(home) < 1) ok = false; }
  }
  if (ok) { const n0 = (S.sefer || []).length; seferGonder(q.kind, q.target); if ((S.sefer || []).length > n0) { Q.shift(); save(); } }
  for (const k in U) sel[k] = old[k] || 0;
}
/* kaynak seferi dönünce tekrar gönderilir */
function kkTekrarDonus(m) {
  if (!m.tekrar || m.kind !== 'obj') return;
  const o = (S.mobj || []).find(function (x) { return x.id === m.target; });
  if (!o || o.k !== 'res' || o.amt <= 0) { toast(kkL('🔁 Kaynak tükendi, tekrar durdu', '🔁 Node depleted, repeat stopped')); return; }
  S.seferQ = Array.isArray(S.seferQ) ? S.seferQ : [];
  if (!S.seferQ.some(function (q) { return q.kind === 'obj' && q.target === m.target; })) S.seferQ.unshift({ kind: 'obj', target: m.target, A: Object.assign({}, m.A0 || m.A), ad: seferAd(m), tekrar: 1 });
}
function kkSiraHtml() {
  const Q = S.seferQ || []; if (!Q.length) return '';
  return '<p class="eff" style="margin:8px 0 2px">' + kkL('<b>Sırada</b> · yer açılınca kendiliğinden yola çıkar', '<b>Queued</b> · sets off automatically when a slot frees up') + '</p>' + Q.map(function (q, i) { return '<div class="foot" style="margin:2px 0"><span class="eff" style="margin:0">' + (i + 1) + '. ' + (q.tekrar ? '🔁 ' : '') + kkEsc(kkT(q.ad)) + (q.A ? ' · ' + fmt(kkTot(q.A)) + kkL(' asker', ' soldiers') : kkL(' · ordu otomatik', ' · auto army')) + '</span><button class="mini" data-kqs="' + i + '" aria-label="' + kkL('Sıradan çıkar', 'Remove from queue') + '">✕</button></div>'; }).join('');
}

/* ================= OLAYLAR, SEN YOKKEN, BİLDİRİM ================= */
function kkOffSum() { window.offSummary = window.offSummary || {}; return window.offSummary; }
/* önemli bir olay: açılışta "sen yokken" kartına, sekme gizliyse bildirime gider */
function kkOlay(msg) {
  if (Date.now() < kkBoot) { const o = kkOffSum(); (o.ev = o.ev || []).push(msg); return 'boot'; }
  if (document.hidden && typeof bitti !== 'undefined') { bitti.push(msg); return 'hidden'; }
  return 'live';
}
/* sefer savaşı bitti: sahne, rapor ya da bildirim */
function kkSavasBitti(m, cap, ad, ek) {
  let rap = null; try { rap = kkRaporSavas(m, cap, ad, ek); } catch (e) { console.error('rapor', e); }
  const win = kkTot(cap.B1) < .5 && kkTot(cap.A1) >= .5, lost = Math.max(0, Math.round(kkTot(cap.A0) - kkTot(cap.A1)));
  const msg = (win ? '🏆 ' : '💀 ') + kkT(ad) + ': ' + (win ? kkL('zafer', 'victory') : kkL('yenilgi', 'defeat')) + kkL(' · kayıp ', ' · losses ') + fmt(lost);
  const w = kkOlay(msg);
  const data = { ad: ad, kind: m ? m.kind : '', cap: cap, win: win, rep: !!rap, rid: rap && rap.id, col: kkLordRenk(m) };
  if (w === 'hidden') kkSahneBekleyen = data;
  else if (w === 'live' && kAyar.sahne !== false && typeof kkSahneOyna === 'function') kkSahneOyna(data);
}
function kkLordRenk(m) { if (!m || m.kind !== 'lord') return null; const l = (S.lords || []).find(function (x) { return x.id === m.target; }); return l ? l.col : null; }

/* ================= KÖY SAHNESİ: DOKUN, İSKELE ================= */
var kkPopK = null;
function kkSahneTik(e) {
  const g = e.target.closest && e.target.closest('g[id^="g-"]'); if (!g) { kkPopKapat(); return; }
  const k = g.id.slice(2); if (!D[k] || !$('bt-' + k)) return;
  kkPopK = k; kkPopAc(e.clientX, e.clientY); if (typeof sfx === 'function') sfx('tap');
}
function kkPopAc(x, y) {
  let p = $('kkPop'); if (!p) { p = document.createElement('div'); p.id = 'kkPop'; p.className = 'card'; document.body.appendChild(p);
    p.addEventListener('click', function (ev) { const b = ev.target.closest('button'); if (!b) return; const k = kkPopK;
      if (b.dataset.pa === 'up') { const bt = $('bt-' + k); if (bt && !bt.disabled) bt.click(); kkPopYaz(); }
      else if (b.dataset.pa === 'sp') { const sp = $('sp-' + k); if (sp && !sp.disabled) sp.click(); kkPopYaz(); }
      else if (b.dataset.pa === 'kart') { kkPopKapat(); const tb = document.querySelector('.tab[data-t="b"]'); if (tb && !tb.classList.contains('on')) tb.click(); const bt = $('bt-' + k), card = bt && bt.closest('article'); if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); } }
      else if (b.dataset.pa === 'x') kkPopKapat(); }); }
  kkPopYaz(); p.classList.remove('hide');
  const r = p.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
  p.style.left = Math.max(8, Math.min(vw - r.width - 8, x - r.width / 2)) + 'px';
  p.style.top = Math.max(8, Math.min(vh - r.height - 8, y + 14)) + 'px';
}
function kkPopYaz() {
  const p = $('kkPop'), k = kkPopK; if (!p || !k || !D[k]) return;
  const l = S.lv[k] || 0, bt = $('bt-' + k), sp = $('sp-' + k), busy = !!S.up[k];
  const h = '<div class="top"><h3>' + kkEsc(kkT(D[k].n)) + '</h3><span class="lv">' + (l ? kkL('Sv ', 'Lv ') + l : kkL('Yeni', 'New')) + '</span><button class="mini" data-pa="x" aria-label="' + kkL('Kapat', 'Close') + '">✕</button></div>' +
    '<p class="eff" style="margin:4px 0 6px">' + kkEsc(($('ef-' + k) || {}).textContent || '') + '</p>' +
    (busy ? '<p class="eff" style="margin:0 0 6px">🔨 ' + kkL('İnşaat sürüyor: ', 'Under construction: ') + tm(Math.max(0, (S.up[k] - Date.now()) / 1000)) + '</p>' : '') +
    '<div class="cost" style="font-size:13px;margin-bottom:8px">' + (($('co-' + k) || {}).innerHTML || '') + '</div>' +
    '<div class="btns wrapb" style="gap:6px"><button data-pa="up"' + (bt && bt.disabled ? ' disabled' : '') + '>' + kkEsc(bt ? bt.textContent : kkL('Yükselt', 'Upgrade')) + '</button>' + (busy && sp && !sp.hidden ? '<button class="sm g" data-pa="sp"' + (sp.disabled ? ' disabled' : '') + '>' + kkEsc(sp.textContent) + '</button>' : '') + '<button class="sm g" data-pa="kart">' + kkL('Kartına git', 'Go to card') + '</button></div>';
  if (p._h !== h) { p.innerHTML = h; p._h = h; }
}
function kkPopKapat() { const p = $('kkPop'); if (p) p.classList.add('hide'); kkPopK = null; }
const KK_NS = 'http://www.w3.org/2000/svg';
function kkSvg(tag, at) { const e = document.createElementNS(KK_NS, tag); for (const a in at) e.setAttribute(a, at[a]); return e; }
/* inşaat sürerken binanın üstüne iskele ve çekiç sallayan işçi */
function kkIskele() {
  if (typeof ORDER === 'undefined') return;
  for (const k of ORDER) {
    const g = $('g-' + k); if (!g) continue; const busy = !!S.up[k]; let sc = g.querySelector(':scope > g.kkscaf');
    if (busy && !sc) {
      let b; try { b = g.getBBox(); } catch (e) { continue; } if (!b || b.width < 2) continue;
      sc = kkSvg('g', { class: 'kkscaf', 'pointer-events': 'none' });
      const x0 = b.x - 1.5, x1 = b.x + b.width + 1.5, y1 = b.y + b.height, y0 = b.y + b.height * .1, sw = Math.max(.5, b.width / 70), col = '#8a5a32';
      const n = Math.max(2, Math.round(b.width / 14)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; sc.appendChild(kkSvg('line', { x1: x, y1: y0, x2: x, y2: y1, stroke: col, 'stroke-width': sw })); }
      for (let j = 1; j <= 3; j++) { const y = y0 + (y1 - y0) * j / 3.4; sc.appendChild(kkSvg('rect', { x: x0 - 1, y: y - sw, width: x1 - x0 + 2, height: sw * 2.2, fill: '#c9a06a', stroke: col, 'stroke-width': sw * .5 })); }
      sc.appendChild(kkSvg('line', { x1: x0, y1: y1, x2: x1, y2: y0 + (y1 - y0) * .3, stroke: col, 'stroke-width': sw * .8, opacity: .8 }));
      // işçi
      const s = Math.max(.6, b.width / 45), wx = x1 - 3 * s, wy = y0 + (y1 - y0) / 3.4 - sw;
      const w = kkSvg('g', { transform: 'translate(' + wx.toFixed(1) + ' ' + wy.toFixed(1) + ') scale(' + s.toFixed(2) + ')' });
      w.appendChild(kkSvg('rect', { x: -1.6, y: -7, width: 3.2, height: 4.5, rx: .8, fill: '#c98b6b' }));
      w.appendChild(kkSvg('circle', { cx: 0, cy: -8.6, r: 1.6, fill: '#e8c9a0' }));
      w.appendChild(kkSvg('path', { d: 'M-1.8 -9.6 Q0 -11.6 1.8 -9.6 Z', fill: '#e9c84a' }));
      w.appendChild(kkSvg('line', { x1: -.8, y1: -2.5, x2: -1.2, y2: 0, stroke: '#5b4630', 'stroke-width': .9 }));
      w.appendChild(kkSvg('line', { x1: .8, y1: -2.5, x2: 1.2, y2: 0, stroke: '#5b4630', 'stroke-width': .9 }));
      const arm = kkSvg('g', { class: 'swing', transform: 'translate(-1.2 -6)' });
      arm.appendChild(kkSvg('line', { x1: 0, y1: 0, x2: -3.6, y2: -1.2, stroke: '#8c6b4f', 'stroke-width': .7 }));
      arm.appendChild(kkSvg('rect', { x: -4.6, y: -2.2, width: 2, height: 1.4, fill: '#707a80' }));
      w.appendChild(arm); sc.appendChild(w);
      g.appendChild(sc);
    } else if (!busy && sc) sc.remove();
  }
}

/* ================= İŞ SIRASI KARTI ================= */
function kkIsHtml() {
  const now = Date.now(), rows = [];
  if (typeof ORDER !== 'undefined') for (const k of ORDER) {
    if (!S.up[k]) continue; const l = S.lv[k] || 0, q = (S.upq && S.upq[k]) || 0, res = D[k].req === 'univ';
    rows.push({ t: S.up[k], h: (res ? '📜 ' : '🔨 ') + kkEsc(kkT(D[k].n)) + kkL(' → Sv ', ' → Lv ') + (l + 1) + (q ? ' <small>(+' + q + kkL(' sırada)', ' queued)') + '</small>' : ''), k: k });
  }
  for (const k in (S.tr || {})) { const t = S.tr[k]; if (!t || !t.n) continue; const u = U[k] || (typeof SC !== 'undefined' ? SC : { n: k }); rows.push({ t: t.e, h: '⚔️ ' + fmt(t.n) + ' ' + kkEsc(kkT(u.n)) + kkL(' eğitimde', ' in training'), k: null }); }
  if (!rows.length) return '';
  rows.sort(function (a, b) { return a.t - b.t; });
  return '<div class="top"><h3>⏳ ' + kkL('İş sırası', 'Work queue') + '</h3><span class="lv">' + rows.length + kkL(' iş', ' jobs') + '</span></div>' + rows.map(function (r) { return '<div class="foot" style="margin:4px 0 0"><span class="eff" style="margin:0">' + r.h + '</span><small style="color:var(--mute);font-variant-numeric:tabular-nums">' + tm(Math.max(0, (r.t - now) / 1000)) + '</small></div>'; }).join('') + '<p class="eff" style="margin:8px 0 0"><small>' + kkL('Binalarda "+sıra" ile 5 seviyeye kadar sıraya koyabilirsin; eğitimde aynı birimden istediğin kadar sırala.', 'Use "+queue" on buildings to queue up to 5 levels; in training you can queue as many units as you like.') + '</small></p>';
}

/* ================= ÇİZİM VE BAĞLANTILAR ================= */
function kkRender() {
  try { kkIskele(); } catch (e) { }
  try { kkDuzenRender(); } catch (e) { }
  const hv = $('kkHava'); if (hv) { const t = kkHavaSatir(); if (hv.textContent !== t) hv.textContent = t; }
  const is = $('kkIs'); if (is) { const h = kkIsHtml(); if (is._h !== h) { is._h = h; is.innerHTML = h; is.classList.toggle('hide', !h); } }
  if (kkPopK) kkPopYaz();
  const ko = $('komv'); if (ko && S.komutan) { const h = yetHtml(S.komutan); let y = $('kkYet'); if (!y) { y = document.createElement('div'); y.id = 'kkYet'; } if (y.parentNode !== ko) ko.appendChild(y); if (y._h !== h) { y._h = h; y.innerHTML = h; } }
}
function kkTick() {
  try { if (dipTick()) render(); } catch (e) { }
  try { kkSiraTick(); } catch (e) { }
}
function kkInit() {
  const st = document.createElement('style');
  st.textContent = 'svg.scene g[id^="g-"]{cursor:pointer}svg.scene g[id^="g-"]:hover{filter:brightness(1.08) drop-shadow(0 0 3px rgba(255,240,190,.9))}' +
    '#kkPop{position:fixed;z-index:180;width:min(300px,calc(100vw - 16px));box-shadow:0 8px 24px rgba(0,0,0,.28)!important}#kkPop .top .mini{margin-left:4px}#kkPop .cost{flex-wrap:wrap;gap:8px}' +
    '#kkHava{margin:-4px 2px 8px;color:var(--mute);font-size:13px}';
  document.head.appendChild(st);
  const sea = $('sea'); if (sea && !$('kkHava')) { const p = document.createElement('p'); p.id = 'kkHava'; sea.parentNode.insertBefore(p, sea.nextSibling); }
  const off = $('offsum'); if (off && !$('kkIs')) { const a = document.createElement('article'); a.id = 'kkIs'; a.className = 'card hide'; a.style.marginBottom = '10px'; off.parentNode.insertBefore(a, off.nextSibling); }
  const sc = document.querySelector('svg.scene'); if (sc) sc.addEventListener('click', kkSahneTik);
  document.addEventListener('click', function (e) {
    const p = $('kkPop'); if (p && !p.classList.contains('hide') && !p.contains(e.target) && !(e.target.closest && e.target.closest('svg.scene'))) kkPopKapat();
    const b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.dataset.dip) { dipYap(b.dataset.dl, b.dataset.dip); return; }
    if (b.dataset.yet) { yetSec(b.dataset.yet, +b.dataset.yi); return; }
    if (b.dataset.yetsil != null) { yetSil(+b.dataset.yetsil); return; }
    if (b.dataset.kqs != null) { const Q = S.seferQ || []; Q.splice(+b.dataset.kqs, 1); save(); render(); return; }
    if (b.dataset.ktk) { const m = (S.sefer || []).find(function (x) { return x.id === b.dataset.ktk; }); if (m) { m.tekrar = !m.tekrar; toast(m.tekrar ? kkL('🔁 Dönünce tekrar gönderilecek', '🔁 Will be sent again on return') : kkL('Tekrar kapatıldı', 'Repeat turned off')); save(); render(); } return; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') kkPopKapat(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && kkSahneBekleyen && kAyar.sahne !== false && typeof kkSahneOyna === 'function') { const d = kkSahneBekleyen; kkSahneBekleyen = null; setTimeout(function () { kkSahneOyna(d); }, 400); } });
  // ayar: savaş sahnesi
  const am = $('ayMus'); if (am && !$('aySahne')) { const lb = document.createElement('label'); lb.className = 'kch'; lb.innerHTML = '<input type="checkbox" id="aySahne"> <span>Savaş sahnesini göster</span>'; am.closest('label').after(lb); const cb = $('aySahne'); cb.checked = kAyar.sahne !== false; cb.onchange = function () { kAyar.sahne = cb.checked; kSak(); }; }
  try { kkDuzenInit(); } catch (e) { console.error('kkDuzenInit', e); }
  try { if (typeof savasInit === 'function') savasInit(); } catch (e) { console.error('savasInit', e); }
  try { if (typeof sistemInit === 'function') sistemInit(); } catch (e) { console.error('sistemInit', e); }
  try { if (typeof raporInit === 'function') raporInit(); } catch (e) { console.error('raporInit', e); }
  try { if (typeof postaInit === 'function') postaInit(); } catch (e) { console.error('postaInit', e); }
  const hi = $('hedefInfo'); if (hi) hi.textContent = kkL('Bir hedefe dokun: ordu düşmana göre kendiliğinden ayarlanır, sana göndermek kalır.', 'Tap a target: the army is sized to the enemy automatically, you just send it.');
  dipTick();
  setInterval(kkTick, 2000);
  render();
}

/* ================= DÜZEN: sabit sekme çubuğu, mini kaynak satırı, acemi görünümü ================= */
var kkMiniAcik = false;
function kkAcemi() { return !(S.lv.inf || S.lv.spear || S.lv.arch || S.lv.cav || S.lv.cat) && kkTot(S.ar) < 1 && !(S.sefer || []).length; }
function kkSec(pane, ad) { const h = document.querySelector('#' + pane + ' > h2[data-sec="' + ad + '"]'); if (!h) return []; const w = h.nextElementSibling; return w && w.classList.contains('accw') ? [h, w] : [h]; }
function kkDuzenInit() {
  const nav = $('tabs'); if (!nav) return;
  if (!$('kkMini')) { const m = document.createElement('div'); m.id = 'kkMini'; m.className = 'hide'; m.setAttribute('aria-hidden', 'true'); nav.insertBefore(m, nav.firstChild); }
  const res = document.querySelector('.res');
  if (res && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { kkMiniAcik = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; kkDuzenRender(); }).observe(res);
  // başka sekmeye geçince içerik sekme çubuğunun hemen altından başlasın
  nav.addEventListener('click', function (e) {
    if (!(e.target.closest && e.target.closest('.tab'))) return;
    requestAnimationFrame(function () { const r = nav.getBoundingClientRect(); if (r.top > 1) return; const pane = document.querySelector('.pane:not(.hide)'); if (!pane) return; window.scrollTo(0, Math.max(0, pane.getBoundingClientRect().top + window.scrollY - r.height - 2)); });
  });
  const sh = document.querySelector('#scout > h2'); if (sh) { const sc = $('scout'), key = 'acc2:p-o:Keşif'; try { if (localStorage.getItem(key) === '1') sc.classList.add('kapali'); } catch (e) { } sh.classList.add('acch'); sh.setAttribute('role', 'button'); sh.tabIndex = 0; const tg = function () { const c = sc.classList.toggle('kapali'); sh.classList.toggle('col', c); try { localStorage.setItem(key, c ? '1' : '0'); } catch (e) { } }; sh.classList.toggle('col', sc.classList.contains('kapali')); sh.addEventListener('click', tg); sh.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } }); }
  const sk = $('strk'); if (sk) { const tg = function () { window.strkAcik = !window.strkAcik; if (typeof renderStreak === 'function') renderStreak(); }; sk.addEventListener('click', function (e) { if (e.target.closest('#strkL')) tg(); }); sk.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'strkL') { e.preventDefault(); tg(); const l = $('strkL'); if (l) l.focus(); } }); }
  const ks = $('hedefv') || $('kmsel'); if (ks && !$('kkAcemiNot')) { const p = document.createElement('p'); p.id = 'kkAcemiNot'; p.className = 'eff hide'; p.style.margin = '8px 2px'; ks.parentNode.insertBefore(p, ks.nextSibling); }
}
function kkDuzenRender() {
  const m = $('kkMini');
  if (m) {
    m.classList.toggle('hide', !kkMiniAcik);
    if (kkMiniAcik) { let h = ''; document.querySelectorAll('.res .chip:not(.hide)').forEach(function (c) { const i = c.querySelector('i.ic'), v = c.querySelector('b span'); if (i && v) h += '<span><i class="' + i.className + '"></i>' + v.textContent + '</span>'; }); if (m._h !== h) { m._h = h; m.innerHTML = h; } }
  }
  const rs = document.querySelector('.res'); if (rs) rs.classList.toggle('uc', rs.querySelectorAll('.chip:not(.hide)').length >= 5);
  const ac = kkAcemi(), lv = $('lordv'), not = $('kkAcemiNot');
  if (lv) lv.classList.toggle('hide', ac);
  ['Dünya Kuşatması', 'Taktik', 'Savunma'].forEach(function (a) { kkSec('p-s', a).forEach(function (e) { e.classList.toggle('hide', ac); }); });
  const mis = $('misc'); kkSec('p-s', 'Misilleme').forEach(function (e) { e.classList.toggle('hide', ac || !mis || mis.classList.contains('hide')); });
  if (not) { not.classList.toggle('hide', !ac); if (ac) { const t = kkL('🔒 Haydut kampları, lordlar, dünya kuşatması, taktik ve savunma ilk kışlanı kurup asker eğitince açılır.', '🔒 Bandit camps, lords, the world siege, tactics and defense open once you build your first barracks and train soldiers.'); if (not.textContent !== t) not.textContent = t; } }
}
