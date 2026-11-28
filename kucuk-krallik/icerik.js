/* Küçük Krallık · İçerik ve geç oyun dengesi
   Sayı biçimi, düşman gücünün oyuncuyla büyümesi, ganimet tabanı, lord kademeleri ve sancaklar,
   kahramanlar, haftalık etkinlik, başarım listesi, inşaat ustası ve kısa bildirimler.
   Ana oyun betiğinden ÖNCE yüklenir; yalnızca tanımlar içerir. Oyun hazır olunca icerikInit() çağrılır. */

/* ================= SAYI BİÇİMİ ================= */
// üretim hızı ve küçük sayılar: 0,015 · 1,2 · 48,5 · 7.500 · 1,25Mn
function fmtR(x) {
  x = +x || 0; const a = Math.abs(x);
  if (a >= 1000) return fmt(x);
  const d = a < 1 ? 3 : a < 100 ? 1 : 0;
  return x.toLocaleString(EN() ? 'en-GB' : 'tr', { maximumFractionDigits: d, minimumFractionDigits: 0 });
}
function fmtS(x) { return (x >= 0 ? '+' : '−') + fmtR(Math.abs(x)); }

/* ================= DÜŞMAN GÜCÜ ================= */
// oyuncunun savaş çarpanı (taç, kalıntı, harikalar, taç ağacı, komutan)
function kkSavasCm() { return (1 + .02 * Math.min(S.cr || 0, 60)) * (1 + .04 * S.sk.war) * (1 + .02 * (S.rel || 0)) * (1 + (S.won ? (S.won.zafer || 0) * .07 : 0)) * (1 + crB('savas')) * komMul(); }
// bir ordunun kaba gücü: toplam vuruş × toplam can (karekök). Savaş motoru da bu ikisiyle çalışır.
function kkOrduGuc(A) { let a = 0, h = 0; for (const k in A) { const n = +A[k] || 0; if (n > 0 && AT[k]) { a += n * AT[k]; h += n * HP[k]; } } return Math.sqrt(a * h); }
let _kkPG = { t: 0, v: 0 };
// oyuncunun tüm ordusu (evdeki + seferdeki), çarpanlarıyla
function kkOyuncuGuc() {
  const now = Date.now(); if (now - _kkPG.t < 1000) return _kkPG.v;
  const A = {}; for (const k in U) A[k] = S.ar[k] || 0;
  (S.sefer || []).forEach(function (m) { for (const k in (m.A || {})) A[k] = (A[k] || 0) + (m.A[k] || 0); });
  let a = 0, h = 0; for (const k in A) { const n = A[k]; if (n > 0 && AT[k]) { let w = 1, d = 1; try { w = tW(k) * (k === 'cat' ? 1.5 : 1); d = tA(k); } catch (e) { } a += n * AT[k] * w; h += n * HP[k] * d; } }
  let v = Math.sqrt(a * h);
  try { const cm = kkSavasCm(), ma = (1 + .08 * (S.lv.tatk || 0)) * (1 + vb()) * cm, ha = (1 + .08 * (S.lv.tdef || 0)) * (1 + vb()) * cm; v *= Math.sqrt(ma * ha); } catch (e) { }
  _kkPG = { t: now, v: v }; return v;
}
// düşman, oyuncu gücünün en az f katı olsun: geç oyunda dalgalar ve kamplar boş geçmesin
function kkTaban(E, mult, f) {
  if (!(f > 0)) return E;
  const P = kkOyuncuGuc(), e = kkOrduGuc(E) * mult;
  if (!(P > 0) || !(e > 0) || e >= f * P) return E;
  const s = f * P / e, o = {}; for (const k in E) o[k] = Math.max(1, Math.round(E[k] * s)); return o;
}
function kkDalgaTaban(w) { return w % 5 === 0 ? .5 : .3; }
function kkKampMin() { return Math.max(1, Math.round((S.wave || 1) * .4)); }
function enemyT(lv) { return kkTaban(enemy(lv), 1 + .04 * (lv - 1), .25); }
function enemyC(lv) { return kkTaban(enemy(lv), 1 + .04 * (lv - 1), .2); }
// kamp ya da ejder ini: [düşman, çarpan]
function kkKampDusman(o) {
  if (o && o.ej) { const kz = (S.etk && S.etk.ej) || 0, E = enemy(o.lv), m = (1 + .04 * (o.lv - 1)) * 1.2; for (const k in E) E[k] = E[k] * 2; return [kkTaban(E, m, Math.min(.95, .55 + .07 * kz)), m]; }
  return [enemyC(o.lv), 1 + .04 * (o.lv - 1)];
}

/* ================= GANİMET TABANI ================= */
// ganimet, en az birkaç dakikalık odun üretimi kadar olsun; erken oyunda değişmez
function kkGX(tur, lv) {
  let base = 0, sn = 0;
  if (tur === 'wave') { base = 60 * lv; sn = 60; }
  else if (tur === 'camp') { base = 70 * lv; sn = 45; }
  else if (tur === 'ejder') { base = 70 * lv; sn = 150; }
  else if (tur === 'lord') { base = 40 * lv; sn = 40 + 20 * lv; }
  else return 1;
  let p = 0; try { p = prod(S.lv).w; } catch (e) { }
  return base > 0 ? Math.max(1, p * sn / base) : 1;
}
// ek ganimet çarpanı: lord sancakları, sefere katılan kahraman, ganimet tabanı
function kkIcLoot() { return (1 + .01 * Math.min(30, S.sancak || 0)) * kahLoot(window._kahAktif) * (window._kkGX || 1); }
function kkIcGuc() { return kahGuc(window._kahAktif); }

/* ================= LORD KADEMELERİ ================= */
// ordu büyüdükçe yeni lordlar daha üst kademeden gelir
function kkLordMinTier() { const P = lordArmyTot(); return P >= 200000 ? 5 : P >= 50000 ? 4 : P >= 10000 ? 3 : P >= 2000 ? 2 : 1; }
function kkSancakKazan(l) {
  const t = l.tier || 1; if (t < 3 || (S.sancak || 0) >= 30) return;
  if (Math.random() >= Math.min(.8, .3 + .05 * t)) return;
  S.sancak = (S.sancak || 0) + 1;
  const m = '🚩 ' + kkL('Lord sancağı ele geçirildi: ', 'Lord banner captured: ') + l.ad;
  kkOlay(m); try { postaEkle('savas', m, kkL('Her sancak bütün ganimeti kalıcı olarak %1 artırır. Toplam ' + S.sancak + ' sancak, ganimet +%' + S.sancak + '.', 'Each banner permanently raises all loot by 1%. ' + S.sancak + ' banners in total, loot +' + S.sancak + '%.'), { ik: '🚩' }); } catch (e) { }
}

/* ================= KAHRAMANLAR ================= */
const KAHS = {
  savasci: { i: '⚔️', n: 'Savaşçı', ne: 'Warrior', d: 'Katıldığı seferde savaş gücü +%4 / seviye', de: '+4% battle power per level on its march' },
  yagmaci: { i: '💰', n: 'Yağmacı', ne: 'Raider', d: 'Katıldığı seferde ganimet +%6 / seviye', de: '+6% loot per level on its march' },
  kasif: { i: '🧭', n: 'Kâşif', ne: 'Pathfinder', d: 'Yol süresi −%3 / seviye (en çok %50), savaş gücü +%2 / seviye', de: '−3% travel time per level (up to 50%), +2% battle power per level' }
};
const KAHAD = ['Aras', 'Defne', 'Tolga', 'Ilgaz', 'Mete', 'Elif', 'Kaya', 'Asena', 'Oğuz', 'Nehir', 'Bora', 'Ece', 'Alp', 'Yağmur'];
const KAHMAX = 3, KAHCOST = [1500, 15000, 150000], KAHSV = 20;
function kahListe() { if (!Array.isArray(S.kahr)) S.kahr = []; return S.kahr; }
function kahBul(id) { return kahListe().find(function (h) { return h.id === id; }); }
function kahMesgul(id) { return (S.sefer || []).some(function (m) { return m.kah === id; }); }
function kahGuc(h) { return h ? 1 + (h.s === 'savasci' ? .04 : h.s === 'kasif' ? .02 : 0) * (h.sv || 1) : 1; }
function kahLoot(h) { return h && h.s === 'yagmaci' ? 1 + .06 * (h.sv || 1) : 1; }
function kahHiz(h) { return h && h.s === 'kasif' ? Math.max(.5, 1 - .03 * (h.sv || 1)) : 1; }
function kahGerek(sv) { return 2 + sv; } // bir sonraki seviye için zafer
function kahEgitCost(sv) { return Math.round(400 * Math.pow(1.7, sv)); }
function kahAcik() { return !!S.komutan; }
function kahAd(h) { return h.ad + ' · ' + kkL(KAHS[h.s].n, KAHS[h.s].ne); }
function kahEtki(h) {
  const p = [];
  if (h.s === 'savasci' || h.s === 'kasif') p.push(kkL('güç', 'power') + ' +%' + Math.round((kahGuc(h) - 1) * 100));
  if (h.s === 'yagmaci') p.push(kkL('ganimet', 'loot') + ' +%' + Math.round((kahLoot(h) - 1) * 100));
  if (h.s === 'kasif') p.push(kkL('yol', 'travel') + ' −%' + Math.round((1 - kahHiz(h)) * 100));
  return p.join(' · ');
}
function kahAl(s) {
  if (!KAHS[s] || !kahAcik()) return; const L = kahListe(); if (L.length >= KAHMAX) return;
  const c = KAHCOST[L.length]; if ((S.g || 0) < c) return toast(kkL(fmt(c) + ' altın gerek', fmt(c) + ' gold needed'));
  S.g -= c; const used = L.map(function (h) { return h.ad; }), free = KAHAD.filter(function (n) { return used.indexOf(n) < 0; });
  const h = { id: 'h' + Date.now().toString(36), ad: free[(Math.random() * free.length) | 0] || 'Kahraman', s: s, sv: 1, xp: 0 };
  L.push(h); toast(KAHS[s].i + ' ' + kkL(h.ad + ' kahraman oldu!', h.ad + ' joined as a hero!')); sfx('win'); save(); render();
}
function kahEgit(id) {
  const h = kahBul(id); if (!h || h.sv >= KAHSV) return; const c = kahEgitCost(h.sv);
  if ((S.g || 0) < c) return toast(kkL(fmt(c) + ' altın gerek', fmt(c) + ' gold needed'));
  S.g -= c; h.sv++; h.xp = 0; toast(KAHS[h.s].i + ' ' + h.ad + kkL(' Sv ', ' Lv ') + h.sv); sfx('coin'); save(); render();
}
function kahXp(h, n) {
  if (!h || h.sv >= KAHSV) return; h.xp = (h.xp || 0) + n;
  if (h.xp >= kahGerek(h.sv)) { h.xp = 0; h.sv++; const m = KAHS[h.s].i + ' ' + kkL(h.ad + ' seferlerde pişti: Sv ' + h.sv, h.ad + ' grew from the marches: Lv ' + h.sv); kkOlay(m); try { postaEkle('krallik', m, kahEtki(h), { ik: KAHS[h.s].i }); } catch (e) { } }
}
// sefer kartında kahraman seçimi
function kahSecili() { const h = window.w2Kah ? kahBul(window.w2Kah) : null; return h && !kahMesgul(h.id) ? h : null; }
function kahSecHtml() {
  const L = kahListe(); if (!L.length) return '';
  const sec = kahSecili();
  return '<div class="kahsec"><b>' + kkL('Kahraman', 'Hero') + '</b><span class="btns" style="gap:4px;flex-wrap:wrap"><button class="sm' + (sec ? ' g' : '') + '" data-kahs="">' + kkL('Yok', 'None') + '</button>' + L.map(function (h) {
    const mg = kahMesgul(h.id);
    return '<button class="sm' + (sec && sec.id === h.id ? '' : ' g') + '" data-kahs="' + h.id + '"' + (mg ? ' disabled title="' + kkL('Seferde', 'On a march') + '"' : ' title="' + kkEsc(kahEtki(h)) + '"') + '>' + KAHS[h.s].i + ' ' + kkEsc(h.ad) + ' <small>' + kkL('Sv', 'Lv') + h.sv + '</small>' + (mg ? ' ⏳' : '') + '</button>';
  }).join('') + '</span>' + (sec ? '<small class="kahet">' + kkEsc(kahEtki(sec)) + '</small>' : '') + '</div>';
}
// Lord sekmesindeki kahraman kartı
function kahKartHtml() {
  if (!kahAcik()) return '<p class="eff" style="margin:0">' + kkL('Kahramanlar, bir komutan işe alınca açılır.', 'Heroes unlock once you hire a commander.') + '</p>';
  const L = kahListe();
  let h = '<p class="eff" style="margin:0 0 8px">' + kkL('Kahramanlar seferlere tek tek katılır: hedef kartında bir kahraman seç. Her zafer kahramana deneyim kazandırır.', 'Heroes join marches one at a time: pick a hero on the target card. Every victory gives the hero experience.') + '</p>';
  L.forEach(function (x) {
    const K = KAHS[x.s], mg = kahMesgul(x.id), mx = x.sv >= KAHSV, c = kahEgitCost(x.sv), need = kahGerek(x.sv);
    h += '<div class="kahrow"><span class="kahic">' + K.i + '</span><span class="kahmid"><b>' + kkEsc(x.ad) + '</b> <small>' + kkL(K.n, K.ne) + kkL(' · Sv ', ' · Lv ') + x.sv + (mg ? ' · ⏳ ' + kkL('seferde', 'on a march') : '') + '</small><small>' + kkEsc(kahEtki(x)) + '</small>' +
      (mx ? '' : '<span class="kahxp"><i style="width:' + Math.round((x.xp || 0) / need * 100) + '%"></i></span><small>' + (x.xp || 0) + ' / ' + need + kkL(' zafer', ' victories') + '</small>') + '</span>' +
      (mx ? '<small>' + kkL('en üst', 'max') + '</small>' : '<button class="sm g" data-kahe="' + x.id + '"' + ((S.g || 0) < c ? ' disabled' : '') + '>' + kkL('Eğit', 'Train') + ' · ' + fmt(c) + '</button>') + '</div>';
  });
  if (L.length < KAHMAX) {
    const c = KAHCOST[L.length];
    h += '<p class="eff" style="margin:8px 0 4px">' + kkL('Yeni kahraman (' + fmt(c) + ' altın):', 'New hero (' + fmt(c) + ' gold):') + '</p><div class="btns wrapb" style="gap:4px">' + Object.keys(KAHS).map(function (s) { return '<button class="sm g" data-kaha="' + s + '" title="' + kkEsc(kkL(KAHS[s].d, KAHS[s].de)) + '"' + ((S.g || 0) < c ? ' disabled' : '') + '>' + KAHS[s].i + ' ' + kkL(KAHS[s].n, KAHS[s].ne) + '</button>'; }).join('') + '</div>' +
      '<p class="eff" style="margin:6px 0 0"><small>' + Object.keys(KAHS).map(function (s) { return KAHS[s].i + ' ' + kkL(KAHS[s].d, KAHS[s].de); }).join('<br>') + '</small></p>';
  }
  return h;
}

/* ================= SEFER ÖNCESİ VE SONRASI ================= */
function kkIcOnce(m) {
  const o = { bw: (S.st.bw || 0) + (S.st.lw || 0), kah: m.kah ? kahBul(m.kah) : null };
  if (m.kind === 'obj') { const x = (S.mobj || []).find(function (y) { return y.id === m.target; }); if (x && x.k === 'camp') o.kamp = Object.assign({}, x); }
  if (m.kind === 'lord') { const l = (S.lords || []).find(function (y) { return y.id === m.target; }); if (l) o.lord = l; }
  window._kahAktif = o.kah || null;
  window._kkGX = m.kind === 'wave' ? kkGX('wave', S.wave || 1) : o.kamp ? kkGX(o.kamp.ej ? 'ejder' : 'camp', o.kamp.lv) : o.lord ? kkGX('lord', o.lord.tier || 1) : 1;
  _kkPG.t = 0; return o;
}
function kkIcSonra(m, o) {
  window._kahAktif = null; window._kkGX = 1; _kkPG.t = 0;
  try {
    const win = (S.st.bw || 0) + (S.st.lw || 0) > o.bw;
    if (o.kah && (win || m.kind === 'boss')) kahXp(o.kah, 1);
    if (o.lord && o.lord.beaten) kkSancakKazan(o.lord);
    if (o.kamp && win && !(S.mobj || []).some(function (y) { return y.id === o.kamp.id; })) {
      if (o.kamp.ej) { const e = etk(); e.ej = (e.ej || 0) + 1; S.st.ejd = (S.st.ejd || 0) + 1; etkIlerle('ejder', 1); etkEjder(); }
      else etkIlerle('haydut', 1);
    }
  } catch (e) { console.error('icerik', e); }
}

/* ================= HAFTALIK ETKİNLİK ================= */
const ETK = [
  { id: 'ejder', i: '🐉', n: 'Ejder Haftası', ne: 'Dragon Week', d: 'Haritada bir Ejder İni belirdi. Ejderi yen: her zaferden sonra daha güçlü döner ve daha çok ganimet bırakır.', de: 'A Dragon’s Lair has appeared on the map. Defeat the dragon: after every victory it returns stronger and drops more loot.', h: 5, b: 'ejder yenildi', be: 'dragons defeated' },
  { id: 'haydut', i: '⛺', n: 'Haydut Avı', ne: 'Bandit Hunt', d: 'Bu hafta haydut kamplarını dağıt. Kamp bulamazsan haritada 🔍 ile ara.', de: 'Break up bandit camps this week. If you cannot find one, use 🔍 on the map.', h: 12, b: 'kamp dağıtıldı', be: 'camps broken' },
  { id: 'hasat', i: '⛏️', n: 'Hasat Haftası', ne: 'Harvest Week', d: 'Haritadaki kaynak noktalarına birlik gönder; dolu dönen her birlik sayılır.', de: 'Send troops to resource sites on the map; every troop that returns loaded counts.', h: 15, b: 'yük getirildi', be: 'loads brought home' }
];
function etkHafta() { return Math.floor((Date.now() / 864e5 + 3) / 7); } // pazartesi başlar
function etkBitis() { return ((etkHafta() + 1) * 7 - 3) * 864e5; }
function etk() { const k = etkHafta(); if (!S.etk || S.etk.k !== k) S.etk = { k: k, t: ETK[k % ETK.length].id, p: 0, al: [0, 0, 0], ej: 0 }; return S.etk; }
function etkTanim() { const e = etk(); return ETK.find(function (x) { return x.id === e.t; }) || ETK[0]; }
function etkAcik() { return stg(S.lv) >= 2; }
function etkEsik(T) { return [Math.ceil(T.h / 3), Math.ceil(T.h * 2 / 3), T.h]; }
function etkIlerle(t, n) {
  if (!etkAcik()) return; const e = etk(); if (e.t !== t) return; const T = etkTanim(), p0 = e.p;
  e.p = Math.min(T.h, e.p + n); if (e.p === p0) return;
  const es = etkEsik(T), i = es.findIndex(function (x) { return p0 < x && e.p >= x; });
  if (i >= 0) { const m = T.i + ' ' + kkL(T.n + ': ' + (i + 1) + '. ödül hazır', T.ne + ': reward ' + (i + 1) + ' is ready'); kkOlay(m); try { postaEkle('krallik', m, kkL('Ödülü buradan ya da Savaş sekmesindeki etkinlik kartından alabilirsin.', 'Claim it here or on the event card in the War tab.'), { ik: T.i, od: { etk: i, k: e.k } }); } catch (x) { } }
}
function etkOdulMetin(i) {
  return [kkL('10 dakikalık odun üretimi kadar altın', 'Gold worth 10 minutes of wood output'),
  kkL('15 dakikalık üretim + 1 kalıntı', '15 minutes of output + 1 relic'),
  kkL('2 kalıntı + 1 taç + 1 lord sancağı', '2 relics + 1 crown + 1 lord banner')][i];
}
function etkAl(i) {
  const e = etk(), T = etkTanim(), es = etkEsik(T); if (e.al[i] || e.p < es[i]) return;
  const p = prod(S.lv), c = cap(S.lv); e.al[i] = 1; let m = '';
  if (i === 0) { const g = Math.max(500, Math.round(p.w * 600)); S.g = (S.g || 0) + g; S.st.g = (S.st.g || 0) + g; m = '+' + fmt(g) + kkL(' altın', ' gold'); }
  if (i === 1) { ['w', 's', 'f', 'a', 'i'].forEach(function (r) { S[r] = Math.min(c, (S[r] || 0) + p[r] * 900); }); S.rel = (S.rel || 0) + 1; m = kkL('15 dk üretim + 1 kalıntı', '15 min output + 1 relic'); }
  if (i === 2) { S.rel = (S.rel || 0) + 2; S.cr = (S.cr || 0) + 1; S.sancak = Math.min(30, (S.sancak || 0) + 1); S.st.etk = (S.st.etk || 0) + 1; m = kkL('2 kalıntı, 1 taç, 1 sancak', '2 relics, 1 crown, 1 banner'); }
  toast(T.i + ' ' + m); sfx('win'); save(); render();
}
// ejder haftasında haritada ejder ini
function etkEjder() {
  if (!Array.isArray(S.mobj)) S.mobj = [];
  const e = etk(), on = etkAcik() && e.t === 'ejder' && e.p < etkTanim().h;
  const id = 'ejder' + e.k, var0 = S.mobj.find(function (o) { return o.ej; });
  if (var0 && (!on || var0.id !== id)) { if (!(S.sefer || []).some(function (m) { return m.target === var0.id; })) S.mobj = S.mobj.filter(function (o) { return o !== var0; }); return; }
  if (on && !var0) S.mobj.push({ id: id, k: 'camp', ej: 1, lv: Math.max(10, Math.round((S.wave || 1) * .9)) + 6 * (e.ej || 0), e: etkBitis() });
}
function etkSure(sn) { const d = Math.floor(sn / 86400), h = Math.floor(sn % 86400 / 3600); return d ? kkL(d + ' gün ' + h + ' sa', d + 'd ' + h + 'h') : kkSure(sn * 1000); }
function etkHtml() {
  if (!etkAcik()) return '';
  const e = etk(), T = etkTanim(), es = etkEsik(T), kal = Math.max(0, (etkBitis() - Date.now()) / 1000);
  const btn = es.map(function (x, i) {
    const ok = e.p >= x, al = e.al[i];
    return '<div class="etkod' + (al ? ' al' : ok ? ' hazir' : '') + '"><span>' + (al ? '✓' : ok ? '🎁' : '🔒') + ' <b>' + x + '</b> · ' + etkOdulMetin(i) + '</span>' + (ok && !al ? '<button class="sm" data-etka="' + i + '">' + kkL('Al', 'Claim') + '</button>' : '') + '</div>';
  }).join('');
  return '<article class="card etk"><div class="top"><h3>' + T.i + ' ' + kkL(T.n, T.ne) + '</h3><span class="lv">' + etkSure(kal) + '</span></div><p class="eff" style="margin:0 0 6px">' + kkL(T.d, T.de) + '</p>' +
    '<div class="etkbar"><i style="width:' + Math.round(e.p / T.h * 100) + '%"></i>' + es.map(function (x) { return '<b style="left:' + (x / T.h * 100) + '%"></b>'; }).join('') + '</div><p class="eff" style="margin:4px 0 6px"><small>' + e.p + ' / ' + T.h + ' ' + kkL(T.b, T.be) + kkL(' · her hafta yeni etkinlik', ' · a new event every week') + '</small></p>' + btn + '</article>';
}

/* ================= BAŞARIM LİSTESİ ================= */
function achHtml() {
  const rows = ACH.map(function (a, i) { const v = av(a[1]); return { i: i, nm: a[0], n: a[2], g: a[3], v: Math.min(v, a[2]), ok: !!S.ach[i], r: Math.min(1, v / a[2]) }; });
  const bek = rows.filter(function (r) { return !r.ok; }).sort(function (a, b) { return b.r - a.r; }), kaz = rows.filter(function (r) { return r.ok; });
  const satir = function (r) {
    return '<div class="achr' + (r.ok ? ' ok' : '') + '"><span class="achi">' + (r.ok ? '✓' : r.r >= .75 ? '🔥' : '🏅') + '</span><span class="achm"><b>' + kkEsc(kkT(r.nm)) + '</b>' +
      (r.ok ? '' : '<span class="achp"><i style="width:' + Math.round(r.r * 100) + '%"></i></span>') + '</span><small>' + (r.ok ? '+' + fmt(r.g) + kkL(' altın', ' gold') : fmt(r.v) + ' / ' + fmt(r.n)) + '</small></div>';
  };
  let h = '';
  if (bek.length) h += '<p class="achh">' + kkL('Sıradakiler', 'Up next') + ' <small>' + bek.length + '</small></p>' + bek.map(satir).join('');
  if (kaz.length) h += '<details class="achd"><summary>' + kkL('Kazanılanlar', 'Earned') + ' <small>' + kaz.length + '</small></summary>' + kaz.map(satir).join('') + '</details>';
  return h;
}

/* ================= İNŞAAT USTASI ================= */
function kkBinaKeys() { return ORDER.filter(function (k) { const c = $('c-' + k); return c && c.parentNode && c.parentNode.id === 'list'; }); }
function kkBinaAcik(k) { return !((D[k].lock && stg(S.lv) < D[k].lock) || (D[k].req && !S.lv[D[k].req])); }
function kkVar(c) { return S.w >= c.w && S.s >= c.s && S.g >= c.g && S.i >= c.i; }
function kkCostTop(c) { return (c.w || 0) + (c.s || 0) + (c.g || 0) * 5 + (c.i || 0) * 2; }
// her binaya bir seviye: boştaysa başlat, çalışıyorsa sıraya ekle; ucuzdan pahalıya
function kkHepsineSira() {
  S.upq = S.upq || {}; let n = 0, yok = 0;
  const L = kkBinaKeys().filter(kkBinaAcik).map(function (k) { const q = S.up[k] ? (S.upq[k] || 0) : 0; return { k: k, q: q, c: cost(k, (S.lv[k] || 0) + q) }; })
    .filter(function (x) { return !(S.up[x.k] && x.q >= 5); }).sort(function (a, b) { return kkCostTop(a.c) - kkCostTop(b.c); });
  L.forEach(function (x) {
    const c = cost(x.k, (S.lv[x.k] || 0) + (S.up[x.k] ? (S.upq[x.k] || 0) : 0)); if (!kkVar(c)) { yok++; return; }
    S.w -= c.w; S.s -= c.s; S.g -= c.g; S.i -= c.i;
    if (S.up[x.k]) S.upq[x.k] = (S.upq[x.k] || 0) + 1; else S.up[x.k] = Date.now() + T(S.lv[x.k] || 0) * 1000;
    n++;
  });
  if (n) { sfx('tap'); toast('🔨 ' + kkL(n + ' bina sıraya alındı', n + ' buildings queued') + (yok ? kkL(' · ' + yok + ' tanesine kaynak yetmedi', ' · not enough resources for ' + yok) : '')); save(); render(); }
  else toast(kkL('Sıraya alınacak bina yok ya da kaynak yetmiyor', 'Nothing to queue or not enough resources'));
}
// usta açıksa boştaki en ucuz binayı kendiliğinden yükseltir (oyun açıkken)
function kkUstaTick() {
  if (!S.usta) return;
  const L = kkBinaKeys().filter(function (k) { return !S.up[k] && kkBinaAcik(k); }).map(function (k) { return { k: k, c: cost(k, S.lv[k] || 0) }; }).filter(function (x) { return kkVar(x.c); })
    .sort(function (a, b) { return kkCostTop(a.c) - kkCostTop(b.c); });
  if (!L.length) return; upgrade(L[0].k);
}
function kkUstaHtml() {
  if ((S.lv.main || 1) < 2) return '';
  const bos = kkBinaKeys().filter(function (k) { return !S.up[k] && kkBinaAcik(k); }).length;
  return '<button class="sm" data-kkhs="1" title="' + kkL('Her binaya bir seviye: boştakileri başlatır, çalışanları sıraya ekler', 'One level for every building: starts idle ones, queues busy ones') + '">🔨 ' + kkL('Hepsine +1', 'All +1') + '</button><button class="sm' + (S.usta ? '' : ' g') + '" data-kkus="1" title="' + kkL('Açıkken boştaki en ucuz binayı kendiliğinden yükseltir (oyun açıkken)', 'When on, it upgrades the cheapest idle building by itself (while the game is open)') + '">🧑‍🔧 ' + kkL('Usta: ', 'Builder: ') + (S.usta ? kkL('açık', 'on') : kkL('kapalı', 'off')) + '</button><small>' + kkL(bos + ' bina boşta', bos + ' idle') + '</small>';
}

/* ================= KISA BİLDİRİM ================= */
// birden çok olay aynı anda gelince ekranı kaplamasın: hepsi postaya gider, ekranda kısa not
function kkPendToast(L) {
  if (!L.length) return;
  L = L.map(function (x) { if (typeof x === 'string') { try { postaEkle('krallik', x, ''); } catch (e) { } return x; } try { postaEkle('krallik', x.b || x.m, x.o || '', x.od ? { od: x.od } : null); } catch (e) { } return x.m; });
  if (L.length === 1 && L[0].length <= 70) { toast(L[0]); return; }
  const t0 = kkT(L[0]), ilk = t0.length > 42 ? t0.slice(0, 40) + '…' : t0;
  toast('✉️ ' + kkL(L.length + ' yeni mektup · ', L.length + ' new letters · ') + ilk);
}

/* ================= ÇİZİM ================= */
function icerikRender() {
  try { etkEjder(); } catch (e) { }
  const u = $('kkUsta'); if (u) { const h = kkUstaHtml(); if (u._h !== h) { u._h = h; u.innerHTML = h; u.classList.toggle('hide', !h); } }
  const kv = $('kahv'); if (kv) { const h = kahKartHtml(); if (kv._h !== h) { kv._h = h; kv.innerHTML = h; } }
}
function icerikInit() {
  const st = document.createElement('style');
  st.textContent =
    '#kkUsta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 10px}#kkUsta button{padding:6px 12px;font-size:13.5px}#kkUsta small{color:var(--mute)}' +
    '.kahsec{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:6px 0 2px;font-size:13px}.kahsec .kahet{flex-basis:100%;color:var(--mute)}' +
    '.kahrow{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid var(--line)}.kahrow:first-of-type{border-top:0}.kahic{font-size:22px;width:28px;text-align:center}.kahmid{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.kahmid small{color:var(--mute)}' +
    '.kahxp,.achp{display:block;height:5px;border-radius:3px;background:var(--line);overflow:hidden;margin:2px 0}.kahxp i,.achp i{display:block;height:100%;background:var(--acc2,var(--acc))}' +
    '.etkbar{position:relative;height:10px;border-radius:5px;background:var(--line);overflow:hidden}.etkbar i{display:block;height:100%;background:linear-gradient(90deg,var(--acc),var(--gold,#c9a14a))}.etkbar b{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:rgba(0,0,0,.25)}' +
    '.etkod{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;padding:4px 0}.etkod.al{opacity:.6}.etkod.hazir b{color:var(--acc2,var(--acc))}' +
    '.achh{margin:2px 0 4px;font-weight:700;font-size:13px;color:var(--mute)}.achr{display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid var(--line);font-size:13.5px}.achr.ok{opacity:.75}.achi{width:22px;text-align:center}.achm{flex:1;min-width:0}.achr small{color:var(--mute);white-space:nowrap;font-variant-numeric:tabular-nums}' +
    '.achd{margin-top:8px}.achd summary{cursor:pointer;font-weight:700;font-size:13px;color:var(--mute);padding:4px 0}';
  document.head.appendChild(st);
  // inşaat ustası çubuğu: bina listesinin üstünde
  const li = $('list'); if (li && !$('kkUsta')) { const d = document.createElement('div'); d.id = 'kkUsta'; d.className = 'hide'; li.parentNode.insertBefore(d, li); d.addEventListener('click', function (e) { const b = e.target.closest('button'); if (!b) return; if (b.dataset.kkhs) kkHepsineSira(); if (b.dataset.kkus) { S.usta = !S.usta; toast('🧑‍🔧 ' + (S.usta ? kkL('İnşaat ustası işe başladı', 'Builder started') : kkL('İnşaat ustası durdu', 'Builder stopped'))); save(); render(); } }); }
  // kahramanlar kartı (Lord sekmesi, komutanın altında)
  const kv = $('kahv'); if (kv && !kv._bag) { kv._bag = 1; kv.addEventListener('click', function (e) { const b = e.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.kaha) kahAl(b.dataset.kaha); if (b.dataset.kahe) kahEgit(b.dataset.kahe); }); }
  setInterval(function () { try { kkUstaTick(); } catch (e) { } }, 2000);
}
