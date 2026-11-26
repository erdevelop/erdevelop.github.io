/* erdevelop · Krallık Kartları oyun motoru (arayüzden bağımsız; tarayıcıda window.KK, Node'da module.exports)
   Kurallar: her oyuncunun kalesi (can), destesi, eli (en çok 8) ve sahası (en çok 5 birlik) var.
   Her tur altın bir artar (en çok 10), bir kart çekilir. Deste biterse her çekişte artan yorgunluk hasarı alınır.
   Özellikler: koruma (rakip önce buna saldırmak zorunda), hucum (geldiği tur saldırır), menzil (saldırırken karşılık almaz),
   kalkan (zırh: aldığı ilk hasarı yok sayar), olum (ölünce etki), sonTur (tur sonunda etki), donuk (o tur saldıramaz).
   Kahramanlar (KH): her tur bir kez, altınla kullanılan güç. Sefer (SEFER): 15 duraklı yol, her durağın rakibi, kuralı ve ödülü.
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
    /* --- sefer kartları --- */
    fedai: { m: 1, s: 2, c: 1, e: '🧨', ad: T('Fedai', 'Zealot'), yazi: T('Ölünce: rastgele bir düşman birliğe 1 hasar.', 'On death: 1 damage to a random enemy unit.'), olum: (G, p) => { const d = G.p[1 - p].saha.filter(x => x.c > 0); if (d.length) hasarVer(G, { t: 'b', p: 1 - p, uid: rast(d).uid }, 1); } },
    gozcu: { m: 2, s: 1, c: 2, e: '🔭', ad: T('Gözcü', 'Scout'), yazi: T('Ölünce: bir kart çek.', 'On death: draw a card.'), olum: (G, p) => cek(G, p) },
    zirhlipiyade: { m: 2, s: 2, c: 1, e: '🪖', kalkan: 1, ad: T('Zırhlı Piyade', 'Armoured Footman') },
    rahip: { m: 3, s: 1, c: 4, e: '🕯️', ad: T('Rahip', 'Priest'), yazi: T('Turunun sonunda: kalene 1 can.', 'At the end of your turn: restore 1 to your castle.'), sonTur: (G, p) => iyilestir(G, p, 1) },
    egitmen: { m: 3, s: 2, c: 2, e: '🎓', ad: T('Eğitmen', 'Drillmaster'), yazi: T('Turunun sonunda: rastgele bir diğer birliğine +1 saldırı.', 'At the end of your turn: another random unit of yours gets +1 attack.'), sonTur: (G, p, b) => { const d = G.p[p].saha.filter(x => x !== b && x.uid !== b.uid); if (d.length) guc(G, rast(d), 1, 0); } },
    bombaci: { m: 3, s: 3, c: 2, e: '💣', ad: T('Bombacı', 'Bomber'), yazi: T('Ölünce: bütün birliklere 1 hasar.', 'On death: 1 damage to all units.'), olum: G => [0, 1].forEach(q => G.p[q].saha.slice().forEach(x => { if (x.c > 0) hasarVer(G, { t: 'b', p: q, uid: x.uid }, 1); })) },
    paladin: { m: 4, s: 3, c: 3, e: '🛐', kalkan: 1, koruma: 1, ad: T('Paladin', 'Paladin') },
    suikastci: { m: 4, s: 4, c: 2, e: '🥷', hucum: 1, menzil: 1, ad: T('Suikastçı', 'Assassin') },
    mezarci: { m: 4, s: 2, c: 3, e: '⚰️', ad: T('Mezarcı', 'Gravedigger'), yazi: T('Ölünce: iki Köylü çağır.', 'On death: summon two Villagers.'), olum: (G, p) => { cagir(G, p, 'koylu'); cagir(G, p, 'koylu'); } },
    kraliyetmuhafizi: { m: 5, s: 3, c: 6, e: '🏵️', koruma: 1, kalkan: 1, ad: T('Kraliyet Muhafızı', 'Royal Guard') },
    kusatmakulesi: { m: 6, s: 4, c: 6, e: '🗼', ad: T('Kuşatma Kulesi', 'Siege Tower'), yazi: T('Turunun sonunda: en zayıf düşman birliğe 2 hasar.', 'At the end of your turn: 2 damage to the weakest enemy unit.'), sonTur: (G, p) => { const d = G.p[1 - p].saha.slice().sort((a, b) => a.c - b.c)[0]; if (d) hasarVer(G, { t: 'b', p: 1 - p, uid: d.uid }, 2); } },
    hukumdar: { m: 7, s: 5, c: 6, e: '🤴', tek: 1, ad: T('Hükümdar', 'Sovereign'), yazi: T('Turunun sonunda: bir Mızrakçı çağır.', 'At the end of your turn: summon a Spearman.'), sonTur: (G, p) => cagir(G, p, 'mizrakci') },
    /* büyüler */
    zirhla: { m: 1, e: '🔰', hedef: 'dost', ad: T('Zırhla', 'Armour Up'), yazi: T('Bir birliğine Zırh ve +1 can ver.', 'Give one of your units Armour and +1 health.'), oyna: (G, p, h) => { const b = bul(G, h.p, h.uid); if (b) { b.kalkan = true; guc(G, b, 0, 1); } } },
    vergi: { m: 1, e: '💰', ad: T('Vergi', 'Tax'), yazi: T('Bu tur 2 altın kazan.', 'Gain 2 gold this turn.'), oyna: (G, p) => { G.p[p].altin += 2; G.olay.push({ t: 'altin', p, n: 2 }); } },
    kis: { m: 3, e: '❄️', ad: T('Kış', 'Winter'), yazi: T('Bütün düşman birlikler bir tur saldıramaz.', 'All enemy units cannot attack for a turn.'), oyna: (G, p) => G.p[1 - p].saha.forEach(x => { x.donuk = 1; G.olay.push({ t: 'dondu', h: 'b' + x.uid }); }) },
    idam: { m: 5, e: '🪓', hedef: 'dbirlik', ad: T('İdam', 'Execution'), yazi: T('Bir düşman birliği yok et.', 'Destroy an enemy unit.'), oyna: (G, p, h) => { const b = bul(G, h.p, h.uid); if (b) { b.kalkan = false; hasarVer(G, h, 99); } } },
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
  /* kahramanlar: m altın, tur başına bir kez. dusman: yalnızca rakipte (patron gücü) */
  const KH = {
    kral: { m: 2, e: '👑', saha: 1, ad: T('Kral', 'King'), guc: T('Halkı Topla', 'Rally'), yazi: T('Bir Köylü (1/2) çağır.', 'Summon a Villager (1/2).'), kullan: (G, p) => cagir(G, p, 'koylu') },
    okcubasi: { m: 2, e: '🏹', hedef: 'dusman', ad: T('Okçubaşı', 'Master Archer'), guc: T('Keskin Ok', 'Sharp Arrow'), yazi: T('Bir düşmana 1 hasar.', '1 damage to an enemy.'), kullan: (G, p, h) => hasarVer(G, h, 1) },
    demirciusta: { m: 2, e: '⚒️', hedef: 'dost', ad: T('Demirci Usta', 'Master Smith'), guc: T('Bileyle', 'Hone'), yazi: T('Bir birliğine +1 saldırı.', 'Give one of your units +1 attack.'), kullan: (G, p, h) => { const b = bul(G, h.p, h.uid); if (b) guc(G, b, 1, 0); } },
    rahibe: { m: 2, e: '🌿', ad: T('Başrahibe', 'High Priestess'), guc: T('Şifa', 'Mend'), yazi: T('Kalene 2 can.', 'Restore 2 to your castle.'), kullan: (G, p) => iyilestir(G, p, 2) },
    haydutbasi: { m: 2, e: '💀', dusman: 1, ad: T('Haydut Başı', 'Bandit Chief'), guc: T('Pusu', 'Ambush'), yazi: T('Rastgele bir düşman birliğe 1 hasar.', '1 damage to a random enemy unit.'), kosul: (G, p) => G.p[1 - p].saha.length > 0, kullan: (G, p) => { const d = G.p[1 - p].saha; if (d.length) hasarVer(G, { t: 'b', p: 1 - p, uid: rast(d).uid }, 1); } },
    komutanK: { m: 2, e: '🎖️', dusman: 1, hedef: 'dost', ad: T('Kuzey Komutanı', 'Northern Commander'), guc: T('Emir', 'Command'), yazi: T('Bir birliğine +1 saldırı.', 'Give one of his units +1 attack.'), kullan: (G, p, h) => { const b = bul(G, h.p, h.uid); if (b) guc(G, b, 1, 0); } },
    buzcadisi: { m: 3, e: '🧙‍♀️', dusman: 1, hedef: 'dbirlik', ad: T('Buz Cadısı', 'Ice Witch'), guc: T('Dondur', 'Freeze'), yazi: T('Bir düşman birliği bir tur dondur.', 'Freeze an enemy unit for a turn.'), kullan: (G, p, h) => { const b = bul(G, h.p, h.uid); if (b) { b.donuk = 1; G.olay.push({ t: 'dondu', h: 'b' + b.uid }); } } },
    ejderlordu: { m: 4, e: '🐉', dusman: 1, ad: T('Ejder Lordu', 'Dragon Lord'), guc: T('Alev Nefesi', 'Fire Breath'), yazi: T('Bütün düşman birliklere 1 hasar.', '1 damage to all enemy units.'), kosul: (G, p) => G.p[1 - p].saha.length > 0, kullan: (G, p) => G.p[1 - p].saha.slice().forEach(x => hasarVer(G, { t: 'b', p: 1 - p, uid: x.uid }, 1)) },
  };
  for (const id in KH) KH[id].id = id;
  const KAHRAMANLAR = ['kral', 'okcubasi', 'demirciusta', 'rahibe'];
  const KILIT_SIRA = ['haberci', 'gozcu', 'bileme', 'fedai', 'zirhlipiyade', 'demirci', 'tasduvar', 'zirhla', 'sifaci', 'ustaokcu', 'rahip', 'vergi', 'kis', 'mancinik', 'takviye', 'bombaci', 'kalkanduvari', 'egitmen', 'paladin', 'komutan', 'agirsuvari', 'suikastci', 'mezarci', 'mancinikatis', 'idam', 'dev', 'kraliyetmuhafizi', 'deprem', 'kusatmakulesi', 'ejder', 'hukumdar'];
  const ac = o => Object.entries(o).flatMap(([id, n]) => Array(n).fill(id));
  const DESTELER = {
    baslangic: ac({ koylu: 2, oduncu: 2, mizrakci: 2, okcu: 2, kalkanci: 2, kurt: 1, ciftci: 1, suvari: 2, haydut: 1, sovalye: 2, muhafiz: 1, atesoku: 1, okyagmuru: 1 }),
    rakip: [
      { ad: T('Haydut Çetesi', 'Bandit Gang'), e: '🗡️', can: 18, deste: ac({ koylu: 2, oduncu: 2, kurt: 2, haydut: 2, mizrakci: 2, okcu: 2, suvari: 2, kalkanci: 2, sovalye: 2, atesoku: 1, kuyu: 1 }) },
      { ad: T('Kuzey Ordusu', 'Northern Army'), e: '🚩', can: 20, deste: ac({ koylu: 2, mizrakci: 2, okcu: 2, kalkanci: 2, kurt: 1, suvari: 2, demirci: 1, haydut: 1, ustaokcu: 1, ciftci: 1, sovalye: 2, muhafiz: 1, atesoku: 1, okyagmuru: 1 }) },
      { ad: T('Ejder Lordu', 'Dragon Lord'), e: '🐉', can: 20, deste: ac({ haberci: 2, okcu: 2, kalkanci: 2, suvari: 2, ustaokcu: 1, sovalye: 2, muhafiz: 2, mancinik: 1, komutan: 1, agirsuvari: 1, dev: 1, atesoku: 1, mancinikatis: 1, ejder: 1 }) },
    ],
  };

  /* sefer: z = yapay zekâ düzeyi, bas = rakibin sahada başladığı birlikler, kural: 'tipi' (tur başında sırası gelenin birlikleri 1 hasar alır) */
  const SEFER = [
    { bolge: T('Sınır Köyleri', 'Border Villages'), ad: T('Tavuk Hırsızları', 'Chicken Thieves'), e: '🐔', can: 12, z: 0, deste: ac({ koylu: 2, oduncu: 2, mizrakci: 2, okcu: 2, kurt: 2, ciftci: 2, kalkanci: 2, haydut: 2, suvari: 2, kuyu: 2 }), odul: ['haberci', 'gozcu'] },
    { ad: T('Haydut Çetesi', 'Bandit Gang'), e: '🗡️', can: 15, z: 0, deste: ac({ koylu: 2, oduncu: 2, fedai: 2, kurt: 2, haydut: 2, mizrakci: 2, okcu: 2, suvari: 2, sovalye: 2, atesoku: 2 }), odul: ['bileme', 'fedai'] },
    { ad: T('Kurt Sürüsü', 'Wolf Pack'), e: '🐺', can: 13, z: 0, bas: ['kurt'], not: T('Rakip sahada bir Kurt ile başlar.', 'The enemy starts with a Wolf.'), deste: ac({ kurt: 2, oduncu: 2, fedai: 2, suvari: 2, haydut: 2, mizrakci: 2, koylu: 2, okcu: 2, sovalye: 2, atesoku: 2 }), odul: ['zirhlipiyade', 'demirci'] },
    { ad: T('Orman Okçuları', 'Forest Archers'), e: '🏹', can: 14, z: 1, deste: ac({ okcu: 2, gozcu: 2, ustaokcu: 2, kalkanci: 2, mizrakci: 2, koylu: 2, okyagmuru: 2, atesoku: 2, suikastci: 1, sovalye: 2, hasat: 1 }), odul: ['tasduvar', 'zirhla'] },
    { ad: T('Haydut Başı', 'Bandit Chief'), e: '💀', can: 18, z: 1, kah: 'haydutbasi', patron: 1, deste: ac({ fedai: 2, kurt: 2, haydut: 2, suvari: 2, zirhlipiyade: 2, bombaci: 2, sovalye: 2, suikastci: 2, agirsuvari: 1, atesoku: 2, bileme: 1 }), odul: ['sifaci'], kahOdul: 'okcubasi' },
    { bolge: T('Kuzey Yolu', 'Northern Road'), ad: T('Sınır Devriyesi', 'Border Patrol'), e: '🚩', can: 18, z: 1, deste: ac({ mizrakci: 2, kalkanci: 2, zirhlipiyade: 2, okcu: 2, suvari: 2, demirci: 1, sovalye: 2, muhafiz: 2, ustaokcu: 1, rahip: 1, atesoku: 2, kalkanduvari: 1 }), odul: ['ustaokcu', 'rahip'] },
    { ad: T('Kış Geçidi', 'Winter Pass'), e: '❄️', can: 12, z: 0, kural: 'tipi', not: T('Tipi: her turun başında, sırası gelenin birlikleri 1 hasar alır.', 'Blizzard: at the start of each turn, the active side\'s units take 1 damage.'), deste: ac({ kalkanci: 2, tasduvar: 2, mizrakci: 2, rahip: 2, muhafiz: 2, sovalye: 2, paladin: 2, kis: 2, atesoku: 2, dev: 1, kuyu: 1 }), odul: ['vergi', 'kis'] },
    { ad: T('Kuşatma Kampı', 'Siege Camp'), e: '🪨', can: 15, z: 1, bas: ['tasduvar'], not: T('Rakip bir Taş Duvar arkasında başlar; mancınıkları kaleni döver.', 'The enemy starts behind a Stone Wall; its catapults pound your castle.'), deste: ac({ kalkanci: 2, tasduvar: 2, muhafiz: 2, mancinik: 2, okcu: 2, zirhlipiyade: 2, bombaci: 2, sovalye: 2, mancinikatis: 1, atesoku: 2, takviye: 1 }), odul: ['mancinik', 'takviye', 'bombaci'] },
    { ad: T('Paralı Askerler', 'Mercenaries'), e: '⚔️', can: 20, z: 2, deste: ac({ zirhlipiyade: 2, haydut: 2, suvari: 2, egitmen: 2, sovalye: 2, paladin: 2, suikastci: 2, agirsuvari: 2, vergi: 1, atesoku: 2, bileme: 1 }), odul: ['kalkanduvari', 'egitmen', 'paladin'] },
    { ad: T('Kuzey Komutanı', 'Northern Commander'), e: '🎖️', can: 20, z: 1, kah: 'komutanK', patron: 1, deste: ac({ haberci: 2, zirhlipiyade: 2, okcu: 2, suvari: 2, demirci: 2, sovalye: 2, muhafiz: 2, komutan: 2, agirsuvari: 1, takviye: 1, atesoku: 1, mancinikatis: 1 }), odul: ['komutan'], kahOdul: 'demirciusta' },
    { bolge: T('Ejder Dağı', 'Dragon Mountain'), ad: T('Dağ Eşkıyaları', 'Mountain Raiders'), e: '🏔️', can: 22, z: 2, deste: ac({ fedai: 2, gozcu: 2, suvari: 2, bombaci: 2, mezarci: 2, suikastci: 2, agirsuvari: 2, sovalye: 2, atesoku: 2, idam: 1, vergi: 1 }), odul: ['agirsuvari', 'suikastci', 'mezarci'] },
    { ad: T('Buz Cadısı', 'Ice Witch'), e: '🧙‍♀️', can: 16, z: 1, kah: 'buzcadisi', patron: 1, deste: ac({ gozcu: 2, kalkanci: 2, rahip: 2, tasduvar: 2, paladin: 2, ustaokcu: 2, kis: 2, mancinikatis: 2, okyagmuru: 1, kusatmakulesi: 1, dev: 1, hasat: 1 }), odul: ['mancinikatis', 'idam'], kahOdul: 'rahibe' },
    { ad: T('Dev Mağarası', 'Giant\'s Cave'), e: '🗿', can: 18, z: 1, bas: ['tasduvar'], not: T('Rakip bir Taş Duvar ile başlar; arkasında devler bekler.', 'The enemy starts with a Stone Wall; giants wait behind it.'), deste: ac({ koylu: 2, kalkanci: 2, tasduvar: 2, muhafiz: 2, mizrakci: 2, kraliyetmuhafizi: 1, dev: 2, sovalye: 2, rahip: 2, kalkanduvari: 1, mancinikatis: 1, zirhla: 1 }), odul: ['dev', 'kraliyetmuhafizi'] },
    { ad: T('Ejder Tapınağı', 'Dragon Temple'), e: '🔥', can: 20, z: 1, deste: ac({ haberci: 2, zirhlipiyade: 2, ustaokcu: 2, egitmen: 1, paladin: 2, komutan: 1, agirsuvari: 2, kusatmakulesi: 2, mancinik: 1, atesoku: 2, mancinikatis: 1, deprem: 1, idam: 1 }), odul: ['deprem', 'kusatmakulesi'] },
    { ad: T('Ejder Lordu', 'Dragon Lord'), e: '🐉', can: 21, z: 2, kah: 'ejderlordu', patron: 1, deste: ac({ haberci: 2, gozcu: 2, koylu: 2, zirhlipiyade: 2, ustaokcu: 1, sovalye: 2, muhafiz: 2, komutan: 1, agirsuvari: 1, dev: 1, hukumdar: 1, ejder: 1, atesoku: 1, mancinikatis: 1 }), odul: ['ejder', 'hukumdar'] },
  ];

  /* ---------- temel işlemler ---------- */
  const bul = (G, p, uid) => G.p[p].saha.find(b => b.uid === uid);
  function birlik(G, id) { const k = K[id]; return { uid: ++G.uid, id, s: k.s, c: k.c, mc: k.c, koruma: !!k.koruma, hucum: !!k.hucum, menzil: !!k.menzil, kalkan: !!k.kalkan, donuk: 0, buz: false, hazir: !!k.hucum, sal: false }; }
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
    else { const b = bul(G, h.p, h.uid); if (!b) return; if (b.kalkan) { b.kalkan = false; G.olay.push({ t: 'kalkan', h: 'b' + b.uid }); return; } b.c -= n; G.olay.push({ t: 'hasar', h: 'b' + b.uid, n }); }
  }
  function iyilestir(G, p, n) { const P = G.p[p], o = P.can; P.can = Math.min(P.mcan, P.can + n); if (P.can > o) G.olay.push({ t: 'iyi', h: 'k' + p, n: P.can - o }); }
  function guc(G, b, s, c) { b.s += s; b.c += c; b.mc += c; G.olay.push({ t: 'guc', h: 'b' + b.uid, s, c }); }
  function temizle(G) {
    for (let tur = 0; tur < 12; tur++) {   /* ölünce etkileri yeni ölümlere yol açabilir */
      const olen = [];
      for (const p of [0, 1]) { const P = G.p[p]; for (let i = P.saha.length - 1; i >= 0; i--) if (P.saha[i].c <= 0) { const b = P.saha[i]; G.olay.push({ t: 'oldu', h: 'b' + b.uid, p, id: b.id }); P.saha.splice(i, 1); olen.push([p, b]); } }
      if (!olen.length) break;
      for (const [p, b] of olen) { const k = K[b.id]; if (k.olum) k.olum(G, p, b); }
    }
    if (G.bitti == null) { const a = G.p[0].can <= 0, b = G.p[1].can <= 0; if (a && b) G.bitti = 2; else if (a) G.bitti = 1; else if (b) G.bitti = 0; if (G.bitti != null) G.olay.push({ t: 'bitti', k: G.bitti }); }
  }
  function basla(G) {
    const P = G.p[G.tur];
    P.maxAltin = Math.min(ALTIN_MAX, P.maxAltin + 1); P.altin = P.maxAltin; P.guc = false;
    if (G.n === 2 && G.ikinciAltin) { P.altin += G.ikinciAltin; G.olay.push({ t: 'bonus', p: G.tur }); } /* ikinci başlayana ilk turunda ek altın */
    P.saha.forEach(b => { b.buz = !!b.donuk; b.hazir = !b.donuk; b.sal = false; if (b.donuk) b.donuk--; });
    G.olay.push({ t: 'tur', p: G.tur });
    if (G.kural === 'tipi' && G.n > 2) P.saha.slice().forEach(b => hasarVer(G, { t: 'b', p: G.tur, uid: b.uid }, 1));
    cek(G, G.tur); temizle(G);
  }
  function yeniOyun(o) {
    const G = { uid: 0, n: 1, tur: o.ilk != null ? o.ilk : (Math.random() < .5 ? 0 : 1), bitti: null, olay: [], p: [], ikinciAltin: o.ikinciAltin || 0, kural: o.kural || '' };
    for (const p of [0, 1]) { const can = (o.can && o.can[p]) || 20; G.p.push({ can, mcan: can, maxAltin: (o.ekAltin && o.ekAltin[p]) || 0, altin: 0, deste: kar(o.desteler[p].slice()), el: [], saha: [], yorgun: 0, kah: (o.kah && o.kah[p]) || '', guc: false }); }
    for (const p of [0, 1]) ((o.bas && o.bas[p]) || []).forEach(id => cagir(G, p, id));
    for (const p of [0, 1]) { const n = p === G.tur ? 3 : 5; /* ikinci başlayan iki kart fazla alır (ilk başlama üstünlüğünü dengeler) */ for (let i = 0; i < n; i++) G.p[p].el.push(G.p[p].deste.pop()); }
    basla(G); G.olay = [];
    return G;
  }

  /* ---------- kurallar ---------- */
  const ayni = (a, b) => a && b && a.t === b.t && a.p === b.p && a.uid === b.uid;
  function hedefler(G, p, id) {
    const k = K[id]; if (!k.hedef) return null; return hedefListe(G, p, k.hedef);
  }
  function hedefListe(G, p, tip) {
    if (tip === 'dost') return G.p[p].saha.map(b => ({ t: 'b', p, uid: b.uid }));
    const d = G.p[1 - p].saha.map(b => ({ t: 'b', p: 1 - p, uid: b.uid }));
    return tip === 'dbirlik' ? d : d.concat([{ t: 'k', p: 1 - p }]);
  }
  /* kahraman gücü */
  const gucHedefleri = (G, p) => { const k = KH[G.p[p].kah]; return k && k.hedef ? hedefListe(G, p, k.hedef) : null; };
  function gucEngel(G, p) {
    const P = G.p[p], k = KH[P.kah];
    if (!k) return 'yok'; if (G.bitti != null || G.tur !== p) return 'sira';
    if (P.guc) return 'kullanildi'; if (k.m > P.altin) return 'altin';
    if (k.saha && P.saha.length >= SAHA_MAX) return 'saha';
    if (k.hedef && !hedefListe(G, p, k.hedef).length) return 'hedef';
    if (k.kosul && !k.kosul(G, p)) return 'hedef';
    return '';
  }
  function gucKullan(G, p, hedef) {
    if (gucEngel(G, p)) return false; const P = G.p[p], k = KH[P.kah];
    if (k.hedef && !hedefListe(G, p, k.hedef).some(x => ayni(x, hedef))) return false;
    P.altin -= k.m; P.guc = true; G.olay.push({ t: 'guckul', p, id: k.id }); k.kullan(G, p, hedef); temizle(G); return true;
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
    if (!gucEngel(G, p)) { const hs = gucHedefleri(G, p); if (hs) hs.forEach(h => E.push({ t: 'guc', h })); else E.push({ t: 'guc' }); }
    return E;
  }
  function uygula(G, a) { return a.t === 'oyna' ? oyna(G, G.tur, a.i, a.h) : a.t === 'saldir' ? saldir(G, G.tur, a.uid, a.h) : a.t === 'guc' ? gucKullan(G, G.tur, a.h) : bitir(G); }
  const kopya = G => { const o = G.olay; G.olay = []; const C = JSON.parse(JSON.stringify(G)); G.olay = o; return C; };

  /* ---------- bilgisayar oyuncusu ---------- */
  const bDeger = b => b.s * 1.2 + b.c * .9 + (b.koruma ? 1 : 0) + (b.menzil ? .6 : 0) + (K[b.id].sonTur ? 2 : 0) + (b.kalkan ? 1.4 : 0) + (K[b.id].olum ? .7 : 0) - (b.donuk || b.buz ? b.s * .5 : 0);
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

  const KK = { K, KH, KAHRAMANLAR, SEFER, gucEngel, gucHedefleri, BASLANGIC, KILIT_SIRA, DESTELER, EL_MAX, SAHA_MAX, ALTIN_MAX, DESTE, yeniOyun, hedefler, engel, oynanabilir, saldirabilir, saldiriHedefleri, eylemler, uygula, kopya, deger, yzSec, bul, ayni, kar };
  if (typeof module !== 'undefined' && module.exports) module.exports = KK; else root.KK = KK;
})(typeof window !== 'undefined' ? window : globalThis);
