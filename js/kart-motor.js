/* erdevelop · Krallık Kartları oyun motoru (arayüzden bağımsız; tarayıcıda window.KK, Node'da module.exports)
   Kurallar: her oyuncunun kalesi (can), destesi, eli (en çok 8) ve sahası (en çok 5 birlik) var.
   Her tur altın bir artar (en çok 10), bir kart çekilir. Deste biterse her çekişte artan yorgunluk hasarı alınır.
   Özellikler: koruma (rakip önce buna saldırmak zorunda), hucum (geldiği tur saldırır), menzil (saldırırken karşılık almaz).
   G.olay: arayüzün canlandırması için olay listesi. */
(function (root) {
  'use strict';
  const T = (tr, en) => ({ tr, en });
  const EL_MAX = 8, SAHA_MAX = 5, ALTIN_MAX = 10, DESTE = 20;
  const rast = a => a[Math.floor(Math.random() * a.length)];
  const kar = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* m: altın bedeli · s: saldırı · c: can · e: simge */
  const K = {
    koylu: { m: 1, s: 1, c: 2, e: '🧑‍🌾', ad: T('Köylü', 'Villager') },
    oduncu: { m: 1, s: 2, c: 1, e: '🪓', ad: T('Oduncu', 'Woodcutter') },
    haberci: { m: 1, s: 1, c: 1, e: '📯', ad: T('Haberci', 'Herald'), yazi: T('Oynanınca: bir kart çek.', 'When played: draw a card.'), oyna: (G, p) => cek(G, p) },
    mizrakci: { m: 2, s: 2, c: 3, e: '🔱', ad: T('Mızrakçı', 'Spearman') },
    okcu: { m: 2, s: 2, c: 2, e: '🏹', menzil: 1, ad: T('Okçu', 'Archer') },
    kalkanci: { m: 2, s: 1, c: 4, e: '🛡️', koruma: 1, ad: T('Kalkancı', 'Shieldbearer') },
    kurt: { m: 2, s: 3, c: 1, e: '🐺', hucum: 1, ad: T('Kurt', 'Wolf') },
    ciftci: { m: 2, s: 1, c: 3, e: '🌾', ad: T('Çiftçi', 'Farmer'), yazi: T('Oynanınca: kalene 2 can.', 'When played: restore 2 to your castle.'), oyna: (G, p) => iyilestir(G, p, 2) },
    suvari: { m: 3, s: 3, c: 2, e: '🐎', hucum: 1, ad: T('Süvari', 'Cavalry') },
    demirci: { m: 3, s: 2, c: 3, e: '⚒️', ad: T('Demirci', 'Blacksmith'), yazi: T('Oynanınca: diğer birliklerine +1 saldırı.', 'When played: your other units get +1 attack.'), oyna: (G, p, h, b) => G.p[p].saha.forEach(x => { if (x !== b) guc(G, x, 1, 0); }) },
    sifaci: { m: 3, s: 2, c: 3, e: '🌿', ad: T('Şifacı', 'Healer'), yazi: T('Oynanınca: kalene 3 can.', 'When played: restore 3 to your castle.'), oyna: (G, p) => iyilestir(G, p, 3) },
    haydut: { m: 3, s: 4, c: 2, e: '🗡️', ad: T('Haydut', 'Bandit') },
    tasduvar: { m: 3, s: 0, c: 6, e: '🧱', koruma: 1, ad: T('Taş Duvar', 'Stone Wall') },
    ustaokcu: { m: 4, s: 3, c: 3, e: '🎯', menzil: 1, ad: T('Usta Okçu', 'Marksman'), yazi: T('Oynanınca: rastgele bir düşman birliğe 1 hasar.', 'When played: 1 damage to a random enemy unit.'), oyna: (G, p) => { const d = G.p[1 - p].saha; if (d.length) hasarVer(G, { t: 'b', p: 1 - p, uid: rast(d).uid }, 1); } },
    sovalye: { m: 4, s: 4, c: 4, e: '⚔️', ad: T('Şövalye', 'Knight') },
    muhafiz: { m: 4, s: 3, c: 5, e: '💂', koruma: 1, ad: T('Muhafız', 'Guard') },
    mancinik: { m: 5, s: 2, c: 4, e: '🪨', ad: T('Mancınık', 'Catapult'), yazi: T('Turunun sonunda: düşman kalesine 2 hasar.', 'At the end of your turn: 2 damage to the enemy castle.'), sonTur: (G, p) => hasarVer(G, { t: 'k', p: 1 - p }, 2) },
    komutan: { m: 5, s: 4, c: 4, e: '🚩', ad: T('Komutan', 'Commander'), yazi: T('Oynanınca: diğer birliklerine +1/+1.', 'When played: your other units get +1/+1.'), oyna: (G, p, h, b) => G.p[p].saha.forEach(x => { if (x !== b) guc(G, x, 1, 1); }) },
    agirsuvari: { m: 5, s: 5, c: 3, e: '🏇', hucum: 1, ad: T('Ağır Süvari', 'Heavy Cavalry') },
    dev: { m: 6, s: 5, c: 7, e: '🗿', koruma: 1, ad: T('Kale Devi', 'Castle Giant') },
    ejder: { m: 8, s: 7, c: 7, e: '🐉', tek: 1, ad: T('Ejder', 'Dragon'), yazi: T('Oynanınca: bütün düşman birliklere 2 hasar.', 'When played: 2 damage to all enemy units.'), oyna: (G, p) => G.p[1 - p].saha.slice().forEach(x => hasarVer(G, { t: 'b', p: 1 - p, uid: x.uid }, 2)) },
    /* büyüler */
    kuyu: { m: 1, e: '💧', ad: T('Kuyu Suyu', 'Well Water'), yazi: T('Kalene 4 can.', 'Restore 4 to your castle.'), oyna: (G, p) => iyilestir(G, p, 4) },
    bileme: { m: 1, e: '✨', hedef: 'dost', ad: T('Bileme', 'Sharpen'), yazi: T('Bir birliğine +2 saldırı.', 'Give one of your units +2 attack.'), oyna: (G, p, h) => { const b = bul(G, h.p, h.uid); if (b) guc(G, b, 2, 0); } },
    okyagmuru: { m: 2, e: '🌧️', ad: T('Ok Yağmuru', 'Arrow Rain'), yazi: T('Bütün düşman birliklere 1 hasar.', '1 damage to all enemy units.'), oyna: (G, p) => G.p[1 - p].saha.slice().forEach(x => hasarVer(G, { t: 'b', p: 1 - p, uid: x.uid }, 1)) },
    atesoku: { m: 2, e: '🔥', hedef: 'dusman', ad: T('Ateş Oku', 'Fire Arrow'), yazi: T('Bir düşmana 3 hasar.', '3 damage to an enemy.'), oyna: (G, p, h) => hasarVer(G, h, 3) },
    hasat: { m: 2, e: '🧺', ad: T('Hasat', 'Harvest'), yazi: T('2 kart çek.', 'Draw 2 cards.'), oyna: (G, p) => { cek(G, p); cek(G, p); } },
    kalkanduvari: { m: 3, e: '🏰', ad: T('Kalkan Duvarı', 'Shield Wall'), yazi: T('Bütün birliklerine +2 can.', 'Your units get +2 health.'), oyna: (G, p) => G.p[p].saha.forEach(x => guc(G, x, 0, 2)) },
    takviye: { m: 4, e: '🎺', ad: T('Takviye', 'Reinforcements'), yazi: T('İki Mızrakçı çağır.', 'Summon two Spearmen.'), oyna: (G, p) => { cagir(G, p, 'mizrakci'); cagir(G, p, 'mizrakci'); } },
    mancinikatis: { m: 4, e: '☄️', hedef: 'dusman', ad: T('Mancınık Atışı', 'Catapult Shot'), yazi: T('Bir düşmana 5 hasar.', '5 damage to an enemy.'), oyna: (G, p, h) => hasarVer(G, h, 5) },
    deprem: { m: 6, e: '🌋', ad: T('Deprem', 'Earthquake'), yazi: T('Bütün birliklere 3 hasar.', '3 damage to all units.'), oyna: G => [0, 1].forEach(q => G.p[q].saha.slice().forEach(x => hasarVer(G, { t: 'b', p: q, uid: x.uid }, 3))) },
  };
  for (const id in K) { K[id].id = id; K[id].tip = K[id].s != null ? 'b' : 'y'; }

  const BASLANGIC = ['koylu', 'oduncu', 'mizrakci', 'okcu', 'kalkanci', 'kurt', 'ciftci', 'suvari', 'haydut', 'sovalye', 'muhafiz', 'atesoku', 'okyagmuru', 'kuyu', 'hasat'];
  const KILIT_SIRA = ['haberci', 'bileme', 'demirci', 'tasduvar', 'sifaci', 'ustaokcu', 'takviye', 'kalkanduvari', 'mancinik', 'komutan', 'agirsuvari', 'mancinikatis', 'dev', 'deprem', 'ejder'];
  const ac = o => Object.entries(o).flatMap(([id, n]) => Array(n).fill(id));
  const DESTELER = {
    baslangic: ac({ koylu: 2, oduncu: 2, mizrakci: 2, okcu: 2, kalkanci: 2, kurt: 1, ciftci: 1, suvari: 2, haydut: 1, sovalye: 2, muhafiz: 1, atesoku: 1, okyagmuru: 1 }),
    rakip: [
      { ad: T('Haydut Çetesi', 'Bandit Gang'), e: '🗡️', can: 18, deste: ac({ koylu: 2, oduncu: 2, kurt: 2, haydut: 2, mizrakci: 2, okcu: 2, suvari: 2, kalkanci: 2, sovalye: 2, atesoku: 1, kuyu: 1 }) },
      { ad: T('Kuzey Ordusu', 'Northern Army'), e: '🚩', can: 20, deste: ac({ koylu: 2, mizrakci: 2, okcu: 2, kalkanci: 2, kurt: 1, suvari: 2, demirci: 1, haydut: 1, ustaokcu: 1, ciftci: 1, sovalye: 2, muhafiz: 1, atesoku: 1, okyagmuru: 1 }) },
      { ad: T('Ejder Lordu', 'Dragon Lord'), e: '🐉', can: 20, deste: ac({ haberci: 2, okcu: 2, kalkanci: 2, suvari: 2, ustaokcu: 1, sovalye: 2, muhafiz: 2, mancinik: 1, komutan: 1, agirsuvari: 1, dev: 1, atesoku: 1, mancinikatis: 1, ejder: 1 }) },
    ],
  };

  /* ---------- temel işlemler ---------- */
  const bul = (G, p, uid) => G.p[p].saha.find(b => b.uid === uid);
  function birlik(G, id) { const k = K[id]; return { uid: ++G.uid, id, s: k.s, c: k.c, mc: k.c, koruma: !!k.koruma, hucum: !!k.hucum, menzil: !!k.menzil, hazir: !!k.hucum, sal: false }; }
  function cagir(G, p, id) { const P = G.p[p]; if (P.saha.length >= SAHA_MAX) return null; const b = birlik(G, id); P.saha.push(b); G.olay.push({ t: 'geldi', uid: b.uid }); return b; }
  function cek(G, p) {
    const P = G.p[p];
    if (!P.deste.length) { P.yorgun++; G.olay.push({ t: 'yorgun', p, n: P.yorgun }); hasarVer(G, { t: 'k', p }, P.yorgun); return; }
    const id = P.deste.pop();
    if (P.el.length >= EL_MAX) G.olay.push({ t: 'yandi', p, id }); else { P.el.push(id); G.olay.push({ t: 'cek', p }); }
  }
  function hasarVer(G, h, n) {
    if (!(n > 0)) return;
    if (h.t === 'k') { G.p[h.p].can -= n; G.olay.push({ t: 'hasar', h: 'k' + h.p, n }); }
    else { const b = bul(G, h.p, h.uid); if (!b) return; b.c -= n; G.olay.push({ t: 'hasar', h: 'b' + b.uid, n }); }
  }
  function iyilestir(G, p, n) { const P = G.p[p], o = P.can; P.can = Math.min(P.mcan, P.can + n); if (P.can > o) G.olay.push({ t: 'iyi', h: 'k' + p, n: P.can - o }); }
  function guc(G, b, s, c) { b.s += s; b.c += c; b.mc += c; G.olay.push({ t: 'guc', h: 'b' + b.uid, s, c }); }
  function temizle(G) {
    for (const p of [0, 1]) { const P = G.p[p]; for (let i = P.saha.length - 1; i >= 0; i--) if (P.saha[i].c <= 0) { G.olay.push({ t: 'oldu', h: 'b' + P.saha[i].uid, p }); P.saha.splice(i, 1); } }
    if (G.bitti == null) { const a = G.p[0].can <= 0, b = G.p[1].can <= 0; if (a && b) G.bitti = 2; else if (a) G.bitti = 1; else if (b) G.bitti = 0; if (G.bitti != null) G.olay.push({ t: 'bitti', k: G.bitti }); }
  }
  function basla(G) {
    const P = G.p[G.tur];
    P.maxAltin = Math.min(ALTIN_MAX, P.maxAltin + 1); P.altin = P.maxAltin;
    if (G.n === 2 && G.ikinciAltin) { P.altin += G.ikinciAltin; G.olay.push({ t: 'bonus', p: G.tur }); } /* ikinci başlayana ilk turunda ek altın */
    P.saha.forEach(b => { b.hazir = true; b.sal = false; });
    G.olay.push({ t: 'tur', p: G.tur });
    cek(G, G.tur); temizle(G);
  }
  function yeniOyun(o) {
    const G = { uid: 0, n: 1, tur: o.ilk != null ? o.ilk : (Math.random() < .5 ? 0 : 1), bitti: null, olay: [], p: [], ikinciAltin: o.ikinciAltin || 0 };
    for (const p of [0, 1]) { const can = (o.can && o.can[p]) || 20; G.p.push({ can, mcan: can, maxAltin: 0, altin: 0, deste: kar(o.desteler[p].slice()), el: [], saha: [], yorgun: 0 }); }
    for (const p of [0, 1]) { const n = p === G.tur ? 3 : 5; /* ikinci başlayan iki kart fazla alır (ilk başlama üstünlüğünü dengeler) */ for (let i = 0; i < n; i++) G.p[p].el.push(G.p[p].deste.pop()); }
    basla(G); G.olay = [];
    return G;
  }

  /* ---------- kurallar ---------- */
  const ayni = (a, b) => a && b && a.t === b.t && a.p === b.p && a.uid === b.uid;
  function hedefler(G, p, id) {
    const k = K[id]; if (!k.hedef) return null;
    if (k.hedef === 'dost') return G.p[p].saha.map(b => ({ t: 'b', p, uid: b.uid }));
    return G.p[1 - p].saha.map(b => ({ t: 'b', p: 1 - p, uid: b.uid })).concat([{ t: 'k', p: 1 - p }]);
  }
  /* neden oynanamadığını döndürür; oynanabiliyorsa '' */
  function engel(G, p, i) {
    const P = G.p[p], k = K[P.el[i]];
    if (!k || G.bitti != null || G.tur !== p) return 'sira';
    if (k.m > P.altin) return 'altin';
    if (k.tip === 'b' && P.saha.length >= SAHA_MAX) return 'saha';
    if (k.hedef && !hedefler(G, p, k.id).length) return 'hedef';
    return '';
  }
  const oynanabilir = (G, p, i) => engel(G, p, i) === '';
  function oyna(G, p, i, hedef) {
    if (!oynanabilir(G, p, i)) return false;
    const P = G.p[p], k = K[P.el[i]];
    if (k.hedef && !hedefler(G, p, k.id).some(x => ayni(x, hedef))) return false;
    P.altin -= k.m; P.el.splice(i, 1); G.olay.push({ t: 'oyna', p, id: k.id });
    if (k.tip === 'b') { const b = birlik(G, k.id); P.saha.push(b); G.olay.push({ t: 'geldi', uid: b.uid }); if (k.oyna) k.oyna(G, p, hedef, b); }
    else k.oyna(G, p, hedef);
    temizle(G); return true;
  }
  const saldirabilir = (G, p, b) => G.bitti == null && G.tur === p && b && b.hazir && !b.sal && b.s > 0;
  function saldiriHedefleri(G, p, uid) {
    const b = bul(G, p, uid); if (!saldirabilir(G, p, b)) return [];
    const d = G.p[1 - p].saha, kor = d.filter(x => x.koruma);
    if (kor.length) return kor.map(x => ({ t: 'b', p: 1 - p, uid: x.uid }));
    return d.map(x => ({ t: 'b', p: 1 - p, uid: x.uid })).concat([{ t: 'k', p: 1 - p }]);
  }
  function saldir(G, p, uid, hedef) {
    if (!saldiriHedefleri(G, p, uid).some(x => ayni(x, hedef))) return false;
    const a = bul(G, p, uid); a.sal = true; G.olay.push({ t: 'saldir', uid, h: hedef.t === 'k' ? 'k' + hedef.p : 'b' + hedef.uid });
    if (hedef.t === 'k') hasarVer(G, hedef, a.s);
    else { const d = bul(G, hedef.p, hedef.uid), ds = d.s; hasarVer(G, hedef, a.s); if (!a.menzil) hasarVer(G, { t: 'b', p, uid }, ds); }
    temizle(G); return true;
  }
  function bitir(G) {
    if (G.bitti != null) return false;
    const p = G.tur; G.p[p].saha.slice().forEach(b => { const k = K[b.id]; if (k.sonTur) k.sonTur(G, p, b); });
    temizle(G); if (G.bitti != null) return true;
    G.tur = 1 - p; G.n++; basla(G); return true;
  }
  function eylemler(G, p) {
    const E = []; if (G.bitti != null || G.tur !== p) return E;
    const P = G.p[p], gorulen = new Set();
    P.el.forEach((id, i) => { if (gorulen.has(id) || !oynanabilir(G, p, i)) return; gorulen.add(id); const hs = hedefler(G, p, id); if (hs) hs.forEach(h => E.push({ t: 'oyna', i, h })); else E.push({ t: 'oyna', i }); });
    P.saha.forEach(b => saldiriHedefleri(G, p, b.uid).forEach(h => E.push({ t: 'saldir', uid: b.uid, h })));
    return E;
  }
  function uygula(G, a) { return a.t === 'oyna' ? oyna(G, G.tur, a.i, a.h) : a.t === 'saldir' ? saldir(G, G.tur, a.uid, a.h) : bitir(G); }
  const kopya = G => { const o = G.olay; G.olay = []; const C = JSON.parse(JSON.stringify(G)); G.olay = o; return C; };

  /* ---------- bilgisayar oyuncusu ---------- */
  const bDeger = b => b.s * 1.2 + b.c * .9 + (b.koruma ? 1 : 0) + (b.menzil ? .6 : 0) + (K[b.id].sonTur ? 2 : 0);
  function deger(G, p, zor) {
    if (G.bitti === p) return 1e6; if (G.bitti != null) return -1e6;
    const B = G.p[p], D = G.p[1 - p]; let v = 0;
    const baski = D.can <= 8 ? 1.15 : .7;
    v += B.can * .55 - D.can * baski;
    B.saha.forEach(b => v += bDeger(b)); D.saha.forEach(b => v -= bDeger(b) * 1.1);
    v += (B.el.length - D.el.length) * .6;
    if (zor >= 1) {
      const ds = D.saha.reduce((a, b) => a + b.s, 0), bs = B.saha.reduce((a, b) => a + b.s, 0);
      if (ds >= B.can && !B.saha.some(b => b.koruma)) v -= 25;      /* gelecek tur ölürüm */
      if (bs >= D.can && !D.saha.some(b => b.koruma)) v += 10;      /* gelecek tur bitiririm */
    }
    return v;
  }
  /* zor: 0 kolay · 1 orta · 2 zor  →  tek eylem döndürür ({t:'bitir'} dahil) */
  function yzSec(G, p, zor) {
    const E = eylemler(G, p); if (!E.length) return { t: 'bitir' };
    if (zor === 0) { if (Math.random() < .1) return { t: 'bitir' }; if (Math.random() < .35) return rast(E); }
    if (zor === 1 && Math.random() < .08) return rast(E);
    const taban = deger(G, p, zor), gurultu = zor === 0 ? 3.5 : zor === 1 ? 2.6 : 0;
    let en = null, env = -Infinity;
    for (const a of E) { const C = kopya(G); uygula(C, a); const v = deger(C, p, zor) + (Math.random() - .5) * gurultu; if (v > env) { env = v; en = a; } }
    return env > taban + .05 ? en : { t: 'bitir' };
  }

  const KK = { K, BASLANGIC, KILIT_SIRA, DESTELER, EL_MAX, SAHA_MAX, ALTIN_MAX, DESTE, yeniOyun, hedefler, engel, oynanabilir, saldirabilir, saldiriHedefleri, eylemler, uygula, kopya, deger, yzSec, bul, ayni, kar };
  if (typeof module !== 'undefined' && module.exports) module.exports = KK; else root.KK = KK;
})(typeof window !== 'undefined' ? window : globalThis);
