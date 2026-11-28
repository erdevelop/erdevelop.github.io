/* ================= tehlike: hasar, korsanlar, olaylar ================= */
function hasar(n, sessiz, cevre) {
  if (DEV.olumsuz) return;
  if (!oyunda || limanP || n <= 0) return;
  if (bankaAcik || borsaAcik || istAcik || inisAcik || istnAcik) return; if (cevre && giyili('termal')) n *= 0.6; if (giyili('zgiysi')) n *= 0.9;
  n *= (1 - YUK.kalkan * 0.08) * (tek('d3') ? 0.9 : 1) * (1.2 - 0.1 * GUC[2]) * (ST.zor ? zorH() : 1); if (!cevre && !sessiz && n > 2 && !kapsul) modulHasar(n);
  if (!cevre) titre(Math.round(Math.min(120, 25 + n * 3))); can -= n; if (GOREV.length) kirilganHasar(n); if (!sessiz && !cevre && n >= 10 && EKIP.length && Math.random() < 0.12) ekipYarala(); hasarFlas = Math.min(1, hasarFlas + 0.3 + n / 40); SARS = Math.min(1, SARS + n / 22); if (!sessiz) SES.vur();
  if (can <= 0) olumBekle = true;
}
function patlamaEkle(x, y, r, renk) { { const d = Math.hypot(x - SH.x, y - SH.y); if (d < 900 && r >= 40) titre(Math.round(Math.min(90, r / 2))); if (d < 2600) SARS = Math.min(1, SARS + (r / 260) * (1 - d / 2600)); for (let i = 0, n = Math.ceil((2 + ((r / 45) | 0)) * GK().par); i < n && DUMAN.length < 70 * GK().par; i++) { const a = Math.random() * TAU, v = 10 + Math.random() * r * 0.4; DUMAN.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, o: 0, w: 1.8 + Math.random() * 1.6, r: r * (0.25 + Math.random() * 0.3) }); } } const p = []; for (let i = 0, n = Math.ceil((10 + ((r / 6) | 0)) * GK().par); i < n; i++) { const a = Math.random() * TAU, v = 60 + Math.random() * r * 3; p.push([Math.cos(a) * v, Math.sin(a) * v]); } PATL.push({ x, y, r, o: 0, w: 0.7 + r / 150, c: renk || '255,170,80', p }); if (PATL.length > 40) PATL.shift(); }
function patla() {
  olumBekle = false; if (ST.zor === 'demir' && !ST.demirOl) { ST.demirOl = 1; demirSon(); return; } if (kapsul) { kurtar(T('Kapsülün de parçalandı.', 'Your capsule was destroyed too.')); return; }
  patlamaEkle(SH.x, SH.y, 140, '255,190,110'); SES.patla();
  const yuk = Object.assign({}, KARGO); for (const k in KARGO) delete KARGO[k];
  if (Object.keys(yuk).length) { OLAY.push({ tip: 'enkaz', x: SH.x, y: SH.y, r0: Math.random() * TAU, ben: true, yuk, t: Date.now() }); izEnkaz(yuk); }
  const kg = GOREV.filter(g => g.yuk > 0 && TESLIM_T.includes(g.tip)).length; GOREV = GOREV.filter(g => !(g.yuk > 0 && TESLIM_T.includes(g.tip)));
  KORS.length = 0; MERMI.length = 0; MAYIN.length = 0; oto = null; kazP = null; SH.warp = 0; SH.sarj = 0;
  const eskiGemi = gemiTip; let kayipYaz = '';
  if (sigorta) { sigorta = false; kayipYaz = T('Sigortan gemini ve teçhizatını karşıladı.', 'Your insurance covered the ship and equipment.'); }
  else {
    const L2 = []; if (GEMI[eskiGemi].f > 0) { GEMILER.delete(eskiGemi); L2.push(L(GEMI[eskiGemi].ad)); }
    for (const k of TAK) { TEKS.delete(k); delete TLV[k]; L2.push(L(TEC[k].ad) + MK[tlv(k)]); } TAK = [];
    kayipYaz = L2.length ? T('Kaybedilenler: ', 'Lost: ') + L2.join(', ') + '.' : '';
  }
  kapsul = true; oks = OKS_MAX(); can = maxCan(); SH.vx *= 0.3; SH.vy *= 0.3; hasarFlas = 1; ST.olum = (ST.olum || 0) + 1; moralEkle(-10); defter('💥 ' + L2Ad(eskiGemi, 0) + ' parçalandı, kaçış kapsülüyle kurtuldum.', '💥 My ' + L2Ad(eskiGemi, 1) + ' was destroyed; I escaped in the pod.');
  diyalog([['💥 Gemin parçalandı!', '💥 Your ship was destroyed!'], [`Son anda <b>kaçış kapsülüne</b> atladın. Kapsülde silah, ambar ve warp yok; oksijenin <b>${Math.round(OKS_MAX() / 60)} dakika</b> yeter.<br><br>Herhangi bir koloniye yanaş ve tersaneden yeni bir gemi seç. Kredilerin <b>Merkez Bankası</b>’nda güvende.${Object.keys(yuk).length ? ' Kargon enkazda kaldı: dönüp toplayabilirsin.' : ''}<br><br>${kayipYaz}${kg ? ' Kargo görevleri iptal oldu.' : ''}`, `You jumped into the <b>escape pod</b> at the last second. The pod has no weapons, hold or warp; your oxygen lasts <b>${Math.round(OKS_MAX() / 60)} minutes</b>.<br><br>Dock at any colony and pick a new ship at the shipyard. Your credits are safe in the <b>Central Bank</b>.${Object.keys(yuk).length ? ' Your cargo stayed in the wreck: come back for it.' : ''}<br><br>${kayipYaz}${kg ? ' Cargo missions failed.' : ''}`]]);
  gorevYaz(); gpImza = ''; kaydet();
}
function kurtar(neden) {
  olumBekle = false; let p = null; if (sonLiman) { const s2 = sistem(sonLiman[0], sonLiman[1]); p = s2 && s2.gez[sonLiman[2]]; } if (!p || !p.kol) p = evGezegen();
  const ucret = Math.min(kredi, 1000); kredi -= ucret; KORS.length = 0; MERMI.length = 0; oto = null;
  const [px, py] = gezPos(p, simT()), a = Math.atan2(py - p.s.y, px - p.s.x); SH.x = px + Math.cos(a) * (p.r + 260); SH.y = py + Math.sin(a) * (p.r + 260); SH.vx = SH.vy = 0; cam.x = SH.x; cam.y = SH.y;
  kapsul = true; oks = OKS_MAX(); can = maxCan();
  duyur('🚑 ' + T('Kurtarma ekibi seni buldu', 'A rescue team found you'), 'uyari', neden + ' ' + T(`${kolAd(p)} kolonisine çekildin · ücret ${SAYI(ucret)} 💰`, `Towed to ${kolAd(p)} · fee ${SAYI(ucret)} 💰`));
  setTimeout(() => { if (!limanP) limanAc(p); }, 600); kaydet();
}
function kapsulAdim(dt) {
  if (!kapsul || limanP || bankaAcik || !oyunda || diyalogAcik) return;
  const once = oks; oks -= dt;
  if (once > 60 && oks <= 60) { duyur('🫁 ' + T('Oksijen azalıyor: 1 dakika!', 'Oxygen running low: 1 minute!'), 'uyari'); SES.uyari(); }
  if (oks <= 0) kurtar(T('Oksijenin bitti.', 'You ran out of oxygen.'));
}
function enYakinKoloni() { const L2 = koloniBul(Math.floor(SH.x / SEK), Math.floor(SH.y / SEK), 4); let en = null, ed = Infinity; for (const p of L2) { const d = Math.hypot(p.s.x - SH.x, p.s.y - SH.y); if (d < ed) { ed = d; en = p; } } return en || evGezegen(); }
function kapsulGit() { const p = enYakinKoloni(); if (mod !== 'oto') modDegis(); oto = { p, ad: kolAd(p) }; wp = { x: p.s.t.x, y: p.s.t.y, k: p.s.t.k, ad: kolAd(p) }; duyur('🤖 ' + T('Otopilot: ', 'Autopilot: ') + '<b>' + esc(kolAd(p)) + '</b>', 'kesif'); }
function tehlike(dt, t, v) {
  hasarFlas = Math.max(0, hasarFlas - dt * 1.6);
  for (let i = PATL.length - 1; i >= 0; i--) { PATL[i].o += dt; if (PATL[i].o > PATL[i].w) PATL.splice(i, 1); }
  if (!oyunda || limanP || !$('menu').hidden || diyalogAcik) return;
  basT -= dt; if (basT <= 0) { basT = 2; basarimKontrol(); }
  if (wp && !wp.k && Math.hypot(wp.x - SH.x, wp.y - SH.y) < 500) wp = null;
  const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK);
  if (SH.warp < 0.3 && v > 450) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const tm = temel(ssx + i, ssy + j); if (!tm || !tm.tam || !tm.tam.kusak) continue; const K2 = tm.tam.kusak, d = Math.hypot(SH.x - tm.x, SH.y - tm.y);
    if (Math.abs(d - K2.R) < K2.W && Math.random() < dt * (v - 450) / 900) {
      hasar(3 + v / 450, false, true); patlamaEkle(SH.x + (Math.random() - 0.5) * 30, SH.y + (Math.random() - 0.5) * 30, 18, '200,190,170');
      if (t - (SH._kus || 0) > 8) { SH._kus = t; duyur('☄ ' + T('Asteroit çarpıyor: kuşakta yavaşla!', 'Asteroid impacts: slow down in the belt!'), 'uyari'); }
    }
  }
  if (firtina > 0) {
    firtina -= dt;
    if (firtS && Math.hypot(SH.x - firtS.x, SH.y - firtS.y) < firtS.yr * 14) hasar(dt * 1.3, true, true);
    if (firtina <= 0) duyur('🌤 ' + T('Güneş fırtınası geçti', 'The solar storm has passed'), 'kesif');
  }
  for (let i = OLAY.length - 1; i >= 0; i--) if (!OLAY[i].ben && Math.hypot(OLAY[i].x - SH.x, OLAY[i].y - SH.y) > 40000) OLAY.splice(i, 1);
  korsanlar(dt, t); olaylar(dt, t); tecGuncelle(dt, t); kelleKontrol(); kervanKontrol(); istilaKontrol(); hurdaAdim(dt); yanKontrol(dt); takvimKontrol(); kolosAdim(dt); radyoAdim(dt); tehAdim(dt); sapanAdim(dt); gazAdim(dt); modulAdim(dt); istnAdim(dt); ekipOlayAdim(dt); olay2Adim(dt); mezarAdim(); devriyeAdim(dt); ekipAdim(dt);
}
const korsanGuc = () => kis(Math.hypot(SH.x - SEK / 2, SH.y - SEK / 2) / SEK / 14, 0, 1);
let kalintiP = null, balinaP = null;
/* ================= teçhizat ================= */
const TEC = {
  fuze: { e: '🚀', ad: ['Füze rampası', 'Missile launcher'], ne: ['Korsanlara güdümlü füze atar (2,5 sn’de bir)', 'Fires homing missiles at enemies (every 2.5 s)'], f: 4000 },
  mayin: { e: '💣', ad: ['Mayın bırakıcı', 'Mine layer'], ne: ['Savaşta arkana mayın bırakır', 'Drops mines behind you in combat'], f: 2500 },
  patlama: { e: '💥', ad: ['Kalkan patlaması', 'Shield burst'], ne: ['Q ya da 💥: yakındaki düşmanları savurur ve yakar (20 sn)', 'Q or 💥: blasts nearby enemies away (20 s)'], f: 3500 },
  cekici: { e: '🧲', ad: ['Çekici ışın', 'Tractor beam'], ne: ['Enkazı uzaktan toplar, kaynak toplamayı 2 kat hızlandırır', 'Salvages wrecks from afar, doubles collecting speed'], f: 2000 },
  tamir: { e: '🔧', ad: ['Tamir botları', 'Repair bots'], ne: ['Savaş dışında gövdeyi yavaşça onarır', 'Slowly repairs the hull out of combat'], f: 3000 },
  drone: { e: '🤖', ad: ['Yardımcı drone', 'Companion drone'], ne: ['Yanında uçar: düşmanlara ateş eder, enkaz toplar', 'Flies with you: shoots enemies, salvages wrecks'], f: 5000 },
};
TEC.yakitgen = { e: '⚗', ad: ['Yakıt sentezleyici', 'Fuel synthesizer'], ne: ['Warp dışındayken yavaşça yakıt üretir (dakikada ~2)', 'Slowly makes fuel outside warp (~2/min)'], f: -1 };
TEC.gizli = { e: '🌫', ad: ['Gizlilik örtüsü', 'Cloak field'], ne: ['Korsanlar seni yarı yarıya daha seyrek bulur', 'Pirates find you half as often'], f: -1 };
const KIYE = {
  oksijen: { yuva: 'sirt', e: '🫁', ad: ['Oksijen tankı', 'Oxygen tank'], ne: ['Kapsülde oksijen 2 kat uzun', 'Pod oxygen lasts twice as long'] },
  jet: { yuva: 'sirt', e: '🎒', ad: ['İtki paketi', 'Thruster pack'], ne: ['Kapsül hızı +%60, gemi hızı +%5', 'Pod speed +60%, ship speed +5%'] },
  termal: { yuva: 'giysi', e: '🧥', ad: ['Termal giysi', 'Thermal suit'], ne: ['Yıldız, fırtına ve asteroit hasarı −%40', 'Star, storm and asteroid damage −40%'] },
  zgiysi: { yuva: 'giysi', e: '🦺', ad: ['Zırhlı giysi', 'Armoured suit'], ne: ['Tüm hasar −%10, kapsül gövdesi 3 kat', 'All damage −10%, pod hull ×3'] },
  hud: { yuva: 'kask', e: '⛑', ad: ['Taktik kask', 'Tactical helmet'], ne: ['Taret hasarı +%20', 'Turret damage +20%'] },
  tarakask: { yuva: 'kask', e: '🪖', ad: ['Kaşif kaskı', 'Explorer helmet'], ne: ['Keşif menzili +%25, kalıntı ödülü +%50', 'Discovery range +25%, ruin rewards +50%'] },
};
const YUVA = { kask: ['Kask', 'Helmet'], giysi: ['Giysi', 'Suit'], sirt: ['Sırt', 'Back'] };
const PLAN = {
  cekici: { mal: { metal: 4, elek: 2 }, k: 300 }, tamir: { mal: { metal: 3, elek: 3, ilac: 2 }, k: 400 },
  mayin: { mal: { metal: 5, gaz: 4 }, k: 400, pf: 1500 }, fuze: { mal: { metal: 6, elek: 4, gaz: 3 }, k: 700, pf: 2500 },
  patlama: { mal: { elek: 4, kris: 2, gaz: 3 }, k: 600, pf: 2500 }, drone: { mal: { metal: 6, elek: 6, kris: 1 }, k: 900, pf: 3500 },
  yakitgen: { mal: { gaz: 6, metal: 3, elek: 2 }, k: 500, pf: 2500 }, gizli: { mal: { neb: 2, elek: 4, krai: 1 }, k: 800, pf: 3000 },
  oksijen: { mal: { su: 4, gaz: 3, metal: 2 }, k: 200 }, termal: { mal: { gida: 2, metal: 2, ilac: 2 }, k: 250 },
  jet: { mal: { gaz: 5, metal: 4, elek: 2 }, k: 500, pf: 2000 }, zgiysi: { mal: { metal: 6, cevher: 4, kris: 1 }, k: 600, pf: 2500 },
  hud: { mal: { elek: 4, metal: 2, kris: 1 }, k: 500, pf: 2500 }, tarakask: { mal: { elek: 3, su: 2, inci: 1 }, k: 450, pf: 2000 },
};
const NADIR = ['kris', 'krai', 'inci', 'neb'];
function mkTarif(k) { const L0 = tlv(k), P = PLAN[k], mal = {}; for (const [m, n] of Object.entries(P.mal)) mal[m] = Math.ceil(n * (0.5 + 0.5 * L0) * (tek('u3') ? 0.7 : 1)); const nd = NADIR[(k.length + L0) % 4]; mal[nd] = (mal[nd] || 0) + 2 * L0; return { mal, k: P.k * 3 * L0 }; }
const MK_NE = { fuze: ['Daha sık ve daha güçlü füze', 'Faster, stronger missiles'], mayin: ['Daha sık, daha güçlü mayın', 'More frequent, stronger mines'], patlama: ['Daha kısa bekleme, daha çok hasar', 'Shorter cooldown, more damage'], cekici: ['Daha uzun menzil, daha hızlı toplama', 'Longer range, faster collecting'], tamir: ['Onarım hızı artar', 'Faster repairs'], drone: ['Drone daha hızlı ve sert ateş eder', 'Drone fires faster and harder'], yakitgen: ['Daha çok yakıt üretir', 'Makes more fuel'], gizli: ['Korsanlar daha da seyrek gelir', 'Pirates come even less often'] };
const PLAN_SAT = { vel: ['hud', 'patlama', 'drone'], krai: ['gizli', 'yakitgen', 'zgiysi'], oru: ['tarakask', 'jet', 'fuze'], insan: ['mayin', 'fuze', 'jet'] };
const planBilgi = k => TEC[k] ? { e: TEC[k].e, ad: TEC[k].ad, ne: TEC[k].ne, tur: 'tec' } : { e: KIYE[k].e, ad: KIYE[k].ad, ne: KIYE[k].ne, tur: 'kiy', yuva: KIYE[k].yuva };
const planVar = k => planBilgi(k).tur === 'tec' ? TEKS.has(k) : KIYS.has(k);
const SARFE = {
  kit: { e: '🩹', tus: '1', ad: ['Tamir kiti', 'Repair kit'], ne: ['Gövdeyi hemen 60 onarır (kapsülde de çalışır)', 'Instantly repairs 60 hull (works in the pod too)'], mal: { metal: 2, elek: 1 }, k: 80 },
  yhucre: { e: '🔋', tus: '2', ad: ['Yakıt hücresi', 'Fuel cell'], ne: ['Depoya hemen 20 yakıt ekler', 'Instantly adds 20 fuel'], mal: { gaz: 3, su: 1 }, k: 60 },
  okskart: { e: '🫧', tus: '3', ad: ['Oksijen kartuşu', 'Oxygen cartridge'], ne: ['Kapsülde oksijeni 3 dakika uzatır', 'Adds 3 minutes of pod oxygen'], mal: { su: 2, gaz: 1 }, k: 50 },
  emp: { e: '⚡', tus: '4', ad: ['EMP bombası', 'EMP bomb'], ne: ['Yakındaki düşmanlara 120 hasar, mermileri siler', '120 damage to nearby enemies, wipes their shots'], mal: { elek: 3, kris: 1, gaz: 2 }, k: 300 },
};
const SARF_MAX = 9;
function sarfKullan(k) {
  if (!oyunda || limanP || bankaAcik || !SARF[k]) return; const E = SARFE[k];
  if (k === 'kit') { if (can >= maxCan() - 0.5 && Object.values(MODUL).every(v => v >= 100)) return; can = Math.min(maxCan(), can + 60); for (const m in MODUL) MODUL[m] = Math.min(100, MODUL[m] + 30); patlamaEkle(SH.x, SH.y, 30, '155,224,122'); }
  else if (k === 'yhucre') { if (kapsul || yakit >= tank() - 0.5) return; yakit = Math.min(tank(), yakit + 20); }
  else if (k === 'okskart') { if (!kapsul) return; oks = Math.min(OKS_MAX() + 180, oks + 180); }
  else if (k === 'emp') { if (!KORS.length) return; patlamaEkle(SH.x, SH.y, 320, '160,200,255'); for (let i = MERMI.length - 1; i >= 0; i--) if (!MERMI[i].d && Math.hypot(MERMI[i].x - SH.x, MERMI[i].y - SH.y) < 700) MERMI.splice(i, 1); for (let i = KORS.length - 1; i >= 0; i--) { const q = KORS[i]; if (Math.hypot(q.x - SH.x, q.y - SH.y) < 700) { q.can -= q.ana && !HIK.mizrak ? 0 : 120; if (q.can <= 0) korsanOldu(q, i); } } }
  SARF[k]--; ST.sarf = (ST.sarf || 0) + 1; SES.koloni(); duyur(E.e + ' ' + L(E.ad), 'koloni', T('Kalan: ', 'Left: ') + SARF[k]); gpImza = ''; kaydet();
}
function sarfGp() {
  let h = ''; const uy = { kit: can < maxCan() * 0.7 || Object.values(MODUL).some(v => v < 50), yhucre: !kapsul && yakit < tank() - 8, okskart: kapsul, emp: KORS.length > 0 };
  for (const k in SARFE) if (SARF[k] > 0 && uy[k]) h += `<button class="gpb ${k === 'kit' && can < maxCan() * 0.3 || k === 'okskart' && oks < 90 ? 'y' : ''}" type="button" data-g="sarf" data-k="${k}">${SARFE[k].e} ${L(SARFE[k].ad)} ×${SARF[k]}${DOKUN ? '' : ' (' + SARFE[k].tus + ')'}</button>`;
  return h;
}
function planVer(neden) {
  const L2 = Object.keys(PLAN).filter(k => !PLANLAR.has(k)); if (!L2.length) return false;
  const k = L2[(Math.random() * L2.length) | 0], b = planBilgi(k); PLANLAR.add(k);
  setTimeout(() => { duyur('📜 ' + T('Yeni plan: ', 'New blueprint: ') + '<b>' + b.e + ' ' + L(b.ad) + '</b>', 'galaksi', T('Bir kolonide ⚒ Üretim sekmesinden üretebilirsin', 'Craft it at any colony in the ⚒ Crafting tab')); SES.galaksi(); basarimKontrol(); }, 900);
  return true;
}
function uretYaz(p) {
  let h = `<div class="alt" style="margin:4px 0 0;font-weight:900;color:var(--ink)">🧑‍🚀 ${T('Pilot kıyafeti', 'Pilot suit')}</div>`;
  for (const y in YUVA) {
    const var_ = [...KIYS].filter(k => KIYE[k] && KIYE[k].yuva === y), w = KIY[y];
    h += `<div class="satir"><div>${w ? KIYE[w].e : '▫'} <b>${L(YUVA[y])}</b>: ${w ? L(KIYE[w].ad) : T('boş', 'empty')}<small>${w ? L(KIYE[w].ne) : T('Üretilen kıyafet parçalarını buraya giyersin', 'Wear crafted suit parts here')}</small></div><div class="dg">${var_.map(k => `<button class="kb ${KIY[y] === k ? '' : 'al'}" type="button" data-giy="${k}">${KIYE[k].e} ${KIY[y] === k ? T('Çıkar', 'Remove') : T('Giy', 'Wear')}</button>`).join('') || `<button class="kb" type="button" disabled>—</button>`}</div></div>`;
  }
  const irk = yabanciMi(p) ? p.kol.irk : itSv(p) >= 2 ? 'insan' : null, sat = irk ? PLAN_SAT[irk].filter(k => !PLANLAR.has(k)) : [];
  if (sat.length) { h += `<div class="alt" style="margin:12px 0 0;font-weight:900;color:#FFE3A6">📜 ${T('Plan satıcısı', 'Blueprint dealer')}</div>`; for (const k of sat) { const b = planBilgi(k), f = PLAN[k].pf; h += `<div class="satir"><div>${b.e} <b>${L(b.ad)}</b> <span class="lv">${b.tur === 'tec' ? T('gemi teçhizatı', 'ship equipment') : L(YUVA[b.yuva])}</span><small>${L(b.ne)}</small></div><div class="dg"><button class="kb al" type="button" data-plal="${k}" ${kredi < f ? 'disabled' : ''}>${T('Planı al', 'Buy blueprint')} · ${SAYI(f)} 💰</button></div></div>`; } }
  else if (!irk) h += `<div class="alt" style="margin:10px 0 0;font-size:12px">📜 ${T('Uzaylı kolonileri ve “Dost” olduğun insan kolonileri plan satar.', 'Alien colonies and human colonies that count you as a “Friend” sell blueprints.')}</div>`;
  h += `<div class="alt" style="margin:12px 0 0;font-weight:900;color:var(--ink)">⚒ ${T('Planların', 'Your blueprints')} (${PLANLAR.size}/${Object.keys(PLAN).length})</div><div class="alt" style="margin:2px 0 0;font-size:12px">${T('Ambarındaki kaynaklarla üret. Teçhizatı Tersane’de gemine tak, kıyafeti yukarıda giy.', 'Craft with resources in your hold. Fit equipment at the Shipyard, wear suit parts above.')}</div>`;
  for (const k in PLAN) {
    if (!PLANLAR.has(k)) continue; const b = planBilgi(k), P = PLAN[k], var_ = planVar(k);
    const ok = Object.entries(P.mal).every(([m, n]) => (KARGO[m] || 0) >= n) && kredi >= uretF(P.k);
    const tarif = Object.entries(P.mal).map(([m, n]) => `<span style="color:${(KARGO[m] || 0) >= n ? '#9BE07A' : '#FF9AA6'}">${MAL[m].e} ${KARGO[m] || 0}/${n}</span>`).join(' ') + ` · ${SAYI(uretF(P.k))} 💰`;
    h += `<div class="satir"><div>${b.e} <b>${L(b.ad)}</b> <span class="lv">${b.tur === 'tec' ? T('gemi teçhizatı', 'ship equipment') : L(YUVA[b.yuva])}</span><small>${L(b.ne)}</small><small>${tarif}</small></div><div class="dg"><button class="kb al" type="button" data-uret="${k}" ${var_ || !ok ? 'disabled' : ''}>${var_ ? T('Sende var', 'Owned') : '⚒ ' + T('Üret', 'Craft')}</button></div></div>`;
  }
  h += `<div class="alt" style="margin:14px 0 0;font-weight:900;color:var(--ink)">🎒 ${T('Tek kullanımlık', 'Consumables')}</div><div class="alt" style="margin:2px 0 0;font-size:12px">${T('Cebinde taşınır: gemin patlasa da kaybolmaz. Her birinden en çok 9.', 'Carried in your pocket: never lost with the ship. Up to 9 of each.')}</div>`;
  for (const k in SARFE) { const E = SARFE[k], ok = SARF[k] < SARF_MAX && Object.entries(E.mal).every(([m, n]) => (KARGO[m] || 0) >= n) && kredi >= E.k; const tarif = Object.entries(E.mal).map(([m, n]) => `<span style="color:${(KARGO[m] || 0) >= n ? '#9BE07A' : '#FF9AA6'}">${MAL[m].e} ${KARGO[m] || 0}/${n}</span>`).join(' ') + ` · ${SAYI(E.k)} 💰`;
    h += `<div class="satir"><div>${E.e} <b>${L(E.ad)}</b> <span class="lv">×${SARF[k]}/${SARF_MAX}</span><small>${L(E.ne)}${DOKUN ? '' : ' · ' + T('tuş', 'key') + ' ' + E.tus}</small><small>${tarif}</small></div><div class="dg"><button class="kb al" type="button" data-sarf="${k}" ${ok ? '' : 'disabled'}>⚒ ${T('Üret', 'Craft')}</button></div></div>`; }
  const mkL = [...TEKS].filter(k => TEC[k] && PLAN[k]);
  if (mkL.length) {
    h += `<div class="alt" style="margin:14px 0 0;font-weight:900;color:var(--ink)">⬆ ${T('Teçhizat yükseltme', 'Equipment upgrades')}</div><div class="alt" style="margin:2px 0 0;font-size:12px">${T('Sahip olduğun teçhizatı Mk II ve Mk III’e çıkar: daha hızlı, daha güçlü. Seviye, teçhizat gemiyle kaybolursa sıfırlanır.', 'Upgrade owned equipment to Mk II and Mk III: faster and stronger. The level resets if the equipment is lost with the ship.')}</div>`;
    for (const k of mkL) { const L0 = tlv(k), E = TEC[k]; if (L0 >= 3) { h += `<div class="satir"><div>${E.e} <b>${L(E.ad)}${MK[3]}</b><small>${T('En üst seviye', 'Max level')}</small></div><div class="dg"><button class="kb" type="button" disabled>✓</button></div></div>`; continue; }
      const M = mkTarif(k), ok = Object.entries(M.mal).every(([m, n]) => (KARGO[m] || 0) >= n) && kredi >= M.k, tarif = Object.entries(M.mal).map(([m, n]) => `<span style="color:${(KARGO[m] || 0) >= n ? '#9BE07A' : '#FF9AA6'}">${MAL[m].e} ${KARGO[m] || 0}/${n}</span>`).join(' ') + ` · ${SAYI(M.k)} 💰`;
      h += `<div class="satir"><div>${E.e} <b>${L(E.ad)}${MK[L0]}</b> → <b style="color:var(--acc)">${MK[L0 + 1].trim()}</b><small>${L(MK_NE[k] || ['Daha güçlü', 'Stronger'])}</small><small>${tarif}</small></div><div class="dg"><button class="kb al" type="button" data-mk="${k}" ${ok ? '' : 'disabled'}>⬆ ${T('Yükselt', 'Upgrade')}</button></div></div>`; }
  }
  const kal = Object.keys(PLAN).length - PLANLAR.size;
  if (kal) h += `<div class="alt" style="margin:10px 0 0;font-size:12px">🔒 ${T(`${kal} plan daha var: antik kalıntılarda, aranan korsanlarda, uzay balinalarında ve plan satıcılarında bulunur.`, `${kal} more blueprints: found in ancient ruins, on wanted pirates, near space whales and at blueprint dealers.`)}</div>`;
  return h;
}
/* ================= güç dağıtımı ================= */
const GUC_AD = [['🔥', ['Motor', 'Engines'], '#7FE3FF', 'Z'], ['🔫', ['Silah', 'Weapons'], '#FF8A9A', 'X'], ['🛡', ['Kalkan', 'Shields'], '#9BE07A', 'C']];
function gucYaz() { $('guc').innerHTML = GUC_AD.map(([e, ad, c, k], i) => `<button type="button" data-guc="${i}" title="${L(ad)} (${k})" style="--c:${c}">${e}${[0, 1, 2, 3].map(j => `<i class="${GUC[i] > j ? 'on' : ''}"></i>`).join('')}</button>`).join('') + `<button type="button" data-guc="s" title="${T('Dengele', 'Balance')}">⟲</button>`; }
function gucVer(i) { if (GUC[i] >= 4) return; let j = -1, mx = 0; for (let k = 0; k < 3; k++) if (k !== i && GUC[k] > mx) { mx = GUC[k]; j = k; } if (j < 0) return; GUC[i]++; GUC[j]--; ST.guc = 1; gucYaz(); SES.tik(); basarimKontrol(); }
function gucDenge() { GUC[0] = GUC[1] = GUC[2] = 2; gucYaz(); SES.tik(); }
$('guc').addEventListener('pointerdown', e => e.stopPropagation());
$('guc').addEventListener('click', e => { const b = e.target.closest('[data-guc]'); if (!b) return; e.stopPropagation(); if (b.dataset.guc === 's') gucDenge(); else gucVer(+b.dataset.guc); });
gucYaz();
/* ================= asteroit madenciliği ================= */
const ASTC = new Map();
function devAst(s) { if (!s || !s.kusak) return null; let L2 = ASTC.get(s.t.k); if (L2) return L2; const K2 = s.kusak, r = rng(h32(Math.round(s.t.x), Math.round(s.t.y), 4242)); L2 = []; for (let i = 0; i < 4; i++) { const rr = 70 + r() * 70, v = [], kr = []; for (let j = 0; j < 11; j++) v.push(0.72 + r() * 0.3); for (let j = 0; j < 4; j++) kr.push([r() * TAU, r() * 0.55, 0.1 + r() * 0.12]); L2.push({ id: s.t.k + '#' + i, s, a0: r() * TAU, off: (r() - 0.5) * K2.W * 0.6, r: rr, v, kr, max: Math.round(rr * 1.2), c: 0.75 + r() * 0.25 }); } if (ASTC.size > 60) ASTC.clear(); ASTC.set(s.t.k, L2); return L2; }
function astPos(a) { const K2 = a.s.kusak, R = K2.R + a.off, ang = a.a0 + simT() * K2.w * (1 + a.off / K2.R * 0.5); return [a.s.x + Math.cos(ang) * R, a.s.y + Math.sin(ang) * R]; }
function astCan(a) { const d = ASTD[a.id]; if (!d) return a.max; if (d.k) { if (Date.now() - d.k > 3.6e6) { delete ASTD[a.id]; return a.max; } return 0; } return d.c; }
function astdTemiz() { const o = {}; for (const k in ASTD) { const d = ASTD[k]; if (d.k ? Date.now() - d.k < 3.6e6 : d.c < 1e4) o[k] = d; } return o; }
function astAdim(dt) {
  for (let i = PARCA.length - 1; i >= 0; i--) { const q = PARCA[i]; q.omur -= dt; q.x += q.vx * dt; q.y += q.vy * dt; const sd = Math.exp(-0.8 * dt); q.vx *= sd; q.vy *= sd; q.a += q.w * dt;
    if (q.omur <= 0) { PARCA.splice(i, 1); continue; } if (!oyunda || limanP || kapsul) continue; const dx = SH.x - q.x, dy = SH.y - q.y, d = Math.hypot(dx, dy);
    if (d < 260) { const k = Math.min(1, dt * 4); q.x += dx * k; q.y += dy * k; }
    if (d < 45) { if (kargoDolu() + q.n <= kapasite()) { KARGO[q.m] = (KARGO[q.m] || 0) + q.n; if (q.m === 'cekirdek') { ST.cekirdek = (ST.cekirdek || 0) + 1; basarimKontrol(); } duyur(MAL[q.m].e + ' ' + L(MAL[q.m].ad) + ' +' + q.n, 'kesif'); SES.tik(); PARCA.splice(i, 1); } else if (!q.dolu) { q.dolu = 1; duyur('📦 ' + T('Ambar dolu', 'Cargo hold full'), 'uyari'); } } }
  const once = astYakin; astYakin = null;
  if (oyunda && !limanP && !kapsul && SH.warp < 0.2) { const L2 = devAst(sistem(Math.floor(SH.x / SEK), Math.floor(SH.y / SEK)));
    if (L2) { let ed = 950; for (const a of L2) { if (astCan(a) <= 0) continue; const [x, y] = astPos(a), d = Math.hypot(x - SH.x, y - SH.y) - a.r; if (d < ed) { ed = d; astYakin = a; } }
      if (astYakin) { const a = astYakin, [x, y] = astPos(a), d = Math.hypot(SH.x - x, SH.y - y) || 1; if (d < a.r + 14) { const nx = (SH.x - x) / d, ny = (SH.y - y) / d, vn = SH.vx * nx + SH.vy * ny; SH.x = x + nx * (a.r + 14); SH.y = y + ny * (a.r + 14); if (vn < 0) { SH.vx -= vn * nx * 1.6; SH.vy -= vn * ny * 1.6; if (vn < -300) hasar(-vn / 120, false, true); } }
        if (madenLazer) { const c = Math.max(0, astCan(a) - dt * 12 * (0.8 + 0.1 * GUC[1]) * (takili('cekici') ? 1.25 : 1)); ASTD[a.id] = { c }; if (c <= 0) astKir(a); } } } }
  if (!astYakin) madenLazer = false; if (once !== astYakin) gpImza = '';
}
function astKir(a) {
  const [x, y] = astPos(a); ASTD[a.id] = { k: Date.now() }; madenLazer = false; patlamaEkle(x, y, a.r * 2.2, '210,190,160'); SES.patla(); flasT = 0.25;
  const n = 5 + ((Math.random() * 3) | 0); for (let i = 0; i < n; i++) { const an = Math.random() * TAU, sp = 60 + Math.random() * 140, rr = Math.random(); PARCA.push({ x: x + Math.cos(an) * a.r * 0.5, y: y + Math.sin(an) * a.r * 0.5, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, m: rr < 0.6 ? 'cevher' : rr < 0.85 ? 'metal' : 'kris', n: 1 + ((Math.random() * 2) | 0), omur: 90, a: Math.random() * TAU, w: (Math.random() - 0.5) * 2, r: 8 + Math.random() * 8 }); }
  if (Math.random() < 0.3) { const an = Math.random() * TAU; PARCA.push({ x, y, vx: Math.cos(an) * 60, vy: Math.sin(an) * 60, m: 'cekirdek', n: 1, omur: 120, a: 0, w: 1.5, r: 12, ck: true }); }
  ST.astKir = (ST.astKir || 0) + 1; bilimEkle(1); sezXp(20); duyur('⛏ ' + T('Asteroit parçalandı!', 'Asteroid cracked!'), 'kesif', T('Parçaların yanından geç, toplansın', 'Fly past the chunks to collect them')); basarimKontrol(); kaydet(); gpImza = '';
}
function astCiz(t) {
  const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { if (Math.abs(i) + Math.abs(j) > 1) continue; const L2 = devAst(sistem(sx + i, sy + j)); if (!L2) continue;
    for (const a of L2) { const c = astCan(a); if (c <= 0) continue; const [x, y] = astPos(a), [X, Y] = W2S(x, y), R = a.r * cam.z; if (R < 1.2 || X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) continue;
      const la = Math.atan2(a.s.y - y, a.s.x - x), g = ctx.createRadialGradient(X + Math.cos(la) * R * 0.4, Y + Math.sin(la) * R * 0.4, R * 0.1, X, Y, R * 1.1), b = a.c; g.addColorStop(0, `rgb(${(170 * b) | 0},${(156 * b) | 0},${(140 * b) | 0})`); g.addColorStop(1, `rgb(${(48 * b) | 0},${(42 * b) | 0},${(38 * b) | 0})`);
      ctx.fillStyle = g; ctx.beginPath(); a.v.forEach((k, q) => { const an = q * TAU / a.v.length + a.a0, px = X + Math.cos(an) * R * k, py = Y + Math.sin(an) * R * k; q ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath(); ctx.fill();
      if (R > 8) { ctx.fillStyle = 'rgba(0,0,0,.22)'; for (const [ka, kd, ks] of a.kr) { ctx.beginPath(); ctx.arc(X + Math.cos(ka) * R * kd, Y + Math.sin(ka) * R * kd, R * ks, 0, TAU); ctx.fill(); }
        const o = c / a.max; if (o < 0.66) { ctx.strokeStyle = `rgba(255,190,110,${(0.9 - o).toFixed(2)})`; ctx.lineWidth = Math.max(1, R * 0.03); ctx.beginPath(); for (let q = 0; q < 3; q++) { const an = a.a0 + q * 2.1; ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(an) * R * 0.5, Y + Math.sin(an) * R * 0.5); ctx.lineTo(X + Math.cos(an + 0.4) * R * (o < 0.33 ? 0.95 : 0.7), Y + Math.sin(an + 0.4) * R * (o < 0.33 ? 0.95 : 0.7)); } ctx.stroke(); }
        if (a === astYakin) { ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFD9A0'; ctx.fillText('⛏ ' + T('Dev asteroit', 'Giant asteroid'), X, Y - R - 18); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(X - 30, Y - R - 12, 60, 5); ctx.fillStyle = '#FFB45A'; ctx.fillRect(X - 30, Y - R - 12, 60 * o, 5); } } }
  }
  if (madenLazer && astYakin) { const [x, y] = astPos(astYakin), [X, Y] = W2S(x, y), [GX, GY] = W2S(SH.x, SH.y), d = Math.hypot(X - GX, Y - GY) || 1, R = astYakin.r * cam.z, HX = X - (X - GX) / d * R * 0.8, HY = Y - (Y - GY) / d * R * 0.8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,150,80,.35)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(GX, GY); ctx.lineTo(HX, HY); ctx.stroke(); ctx.strokeStyle = `rgba(255,230,180,${(0.7 + Math.random() * 0.3).toFixed(2)})`; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,${(160 + Math.random() * 90) | 0},90,.9)`; ctx.fillRect(HX + (Math.random() - 0.5) * 18, HY + (Math.random() - 0.5) * 18, 2.5, 2.5); } ctx.restore(); }
  for (const q of PARCA) { const [X, Y] = W2S(q.x, q.y), R = Math.max(2, q.r * cam.z); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; ctx.save(); ctx.translate(X, Y); ctx.rotate(q.a);
    if (q.ck) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 2.5); g.addColorStop(0, 'rgba(127,227,255,.9)'); g.addColorStop(1, 'rgba(127,227,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 2.5, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#CFF6FF'; ctx.beginPath(); ctx.moveTo(0, -R); ctx.lineTo(R * 0.7, 0); ctx.lineTo(0, R); ctx.lineTo(-R * 0.7, 0); ctx.fill(); }
    else { ctx.fillStyle = q.m === 'kris' ? '#B9A6FF' : q.m === 'metal' ? '#AEB6C4' : '#8E7A66'; ctx.beginPath(); ctx.moveTo(-R, -R * 0.4); ctx.lineTo(-R * 0.2, -R); ctx.lineTo(R, -R * 0.3); ctx.lineTo(R * 0.6, R * 0.8); ctx.lineTo(-R * 0.7, R * 0.7); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
}
/* ================= hackleme: şifre kırma ================= */
const HK_S = ['◆', '●', '▲', '■', '★', '✚'], HK_C = ['#7FE3FF', '#FF8A9A', '#9BE07A', '#FFC857', '#C9B4FF', '#FFB07A'];
let HK = null;
function hackAc(o) { const sym = o.zor >= 3 ? 6 : 5; HK = { o, sym, kod: Array.from({ length: 4 }, () => (Math.random() * sym) | 0), hak: 8 - o.zor + (ekipLv('muhendis') >= 2 ? 1 : 0), den: [], gir: [], bitti: null, sonuc: '' }; hackYaz(); $('hack').hidden = false; SES.tik(); }
function hkGeri(g, kod) { let t = 0, y = 0; const a = [], b = []; for (let i = 0; i < 4; i++) { if (g[i] === kod[i]) t++; else { a.push(g[i]); b.push(kod[i]); } } for (const v of a) { const j = b.indexOf(v); if (j >= 0) { y++; b.splice(j, 1); } } return [t, y]; }
function hkSem(i) { return `<span class="hkH" style="color:${HK_C[i]}">${HK_S[i]}</span>`; }
function hackYaz() {
  const H0 = HK; let h = `<h2 style="margin:0 0 4px;font-size:20px;font-weight:900">${H0.o.ad}</h2><div class="alt" style="font-size:12.5px">${T('4 sembollük şifreyi bul. Her denemeden sonra: ', 'Find the 4-symbol code. After each try: ')}<b style="color:#9BE07A">●</b> ${T('doğru sembol doğru yerde', 'right symbol, right place')}, <b style="color:#FFC857">●</b> ${T('doğru sembol yanlış yerde', 'right symbol, wrong place')}. ${T('Semboller tekrar edebilir.', 'Symbols can repeat.')}</div>`;
  for (const [g, [t, y]] of H0.den) h += `<div class="hkSat">${g.map(hkSem).join('')}<span class="hkGb">${[0, 1, 2, 3].map(i => `<i class="${i < t ? 't' : i < t + y ? 'y' : ''}"></i>`).join('')}</span></div>`;
  if (!H0.bitti) { h += `<div class="hkSat">${[0, 1, 2, 3].map(i => H0.gir[i] != null ? hkSem(H0.gir[i]) : '<span class="hkH" style="opacity:.4">·</span>').join('')}<small style="margin-left:8px;color:var(--mute)">${T('Kalan deneme', 'Tries left')}: <b>${H0.hak - H0.den.length}</b></small></div>`;
    h += `<div class="dg" style="flex-wrap:wrap;gap:6px;margin:8px 0">${Array.from({ length: H0.sym }, (_, i) => `<button class="kb" type="button" data-hks="${i}" style="font-size:19px;min-width:44px;color:${HK_C[i]}">${HK_S[i]}</button>`).join('')}<button class="kb" type="button" data-hk="sil">⌫</button></div><div class="dg" style="justify-content:flex-end"><button class="kb" type="button" data-hk="vaz">${T('Vazgeç', 'Give up')}</button><button class="kb al" type="button" data-hk="dene" ${H0.gir.length < 4 ? 'disabled' : ''}>🔓 ${T('Dene', 'Try')}</button></div>`; }
  else h += `<div style="margin:10px 0;font-weight:900;font-size:16px;color:${H0.bitti === 'ok' ? '#9BE07A' : '#FF9AA6'}">${H0.bitti === 'ok' ? '✅ ' + T('Şifre kırıldı!', 'Code cracked!') : '🚨 ' + T('Erişim reddedildi', 'Access denied') + ' · ' + H0.kod.map(hkSem).join('')}</div><div class="alt">${H0.sonuc}</div><button class="ana" type="button" data-hk="kapat">${T('Kapat', 'Close')}</button>`;
  $('hkIc').innerHTML = h;
}
$('hack').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled || !HK) return; const H0 = HK;
  if (b.dataset.hks != null && !H0.bitti) { if (H0.gir.length < 4) { H0.gir.push(+b.dataset.hks); SES.tik(); } }
  else if (b.dataset.hk === 'sil') H0.gir.pop();
  else if (b.dataset.hk === 'dene' && H0.gir.length === 4) { const g = H0.gir.slice(), f = hkGeri(g, H0.kod); H0.den.push([g, f]); H0.gir = [];
    if (f[0] === 4) { H0.bitti = 'ok'; ST.hack = (ST.hack || 0) + 1; sezXp(25); H0.sonuc = H0.o.odul() || ''; SES.galaksi(); basarimKontrol(); kaydet(); }
    else if (H0.den.length >= H0.hak) { H0.bitti = 'yok'; H0.sonuc = H0.o.ceza() || ''; SES.uyari(); kaydet(); } else SES.tik(); }
  else if (b.dataset.hk === 'vaz') { H0.bitti = 'yok'; H0.sonuc = H0.o.ceza() || ''; }
  else if (b.dataset.hk === 'kapat') { $('hack').hidden = true; HK = null; if (borsaAcik) borsaYaz(); return; }
  hackYaz();
});
function kasaAc() { const a = Math.random() * TAU, d = 1400 + Math.random() * 900; OLAY.push({ tip: 'kasa', x: SH.x + Math.cos(a) * d, y: SH.y + Math.sin(a) * d, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, r0: Math.random() * TAU, omur: 240 }); duyur('🔒 ' + T('Şifreli veri kasası sinyali', 'Encrypted data vault signal'), 'kesif', T('Yakınlarda süzülüyor: yaklaş ve hackle', 'Drifting nearby: get close and hack it')); }
function kasaYakin() { return OLAY.find(o => o.tip === 'kasa' && !o.acik && Math.hypot(o.x - SH.x, o.y - SH.y) < 380) || null; }
function kasaHack(o) { if (kilitli('hack')) return; o.acik = true; SH.vx *= 0.2; SH.vy *= 0.2; hackAc({ ad: T('🔒 Şifreli veri kasası', '🔒 Encrypted data vault'), zor: 2, odul: () => { const k = 700 + ((Math.random() * 1500) | 0); kazan(k, 'kesif'); bilimEkle(2); let ek = ''; if (Math.random() < 0.4) { planVer('kasa'); ek = ' · 📐 ' + T('plan', 'blueprint'); } OLAY.splice(OLAY.indexOf(o), 1); return `+${SAYI(k)} 💰 · 🔬 +2${ek}`; }, ceza: () => { const i = OLAY.indexOf(o); if (i >= 0) OLAY.splice(i, 1); patlamaEkle(o.x, o.y, 60, '255,120,90'); setTimeout(() => { if (oyunda && !KORS.length) korsanCikar(); }, 600); return T('Kasa kendini imha etti ve alarm verdi: korsanlar geliyor!', 'The vault self-destructed and raised an alarm: pirates incoming!'); } }); gpImza = ''; }
function kasaCiz(t) { for (const o of OLAY) { if (o.tip !== 'kasa') continue; o.x += o.vx * 0.016; o.y += o.vy * 0.016; const [X, Y] = W2S(o.x, o.y); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue; const s = Math.max(cam.z, 0.55); ctx.save(); ctx.translate(X, Y); ctx.rotate(o.r0 + t * 0.2); ctx.fillStyle = '#5A6478'; ctx.strokeStyle = '#B9C2D4'; ctx.lineWidth = 1.2; ctx.fillRect(-14 * s, -10 * s, 28 * s, 20 * s); ctx.strokeRect(-14 * s, -10 * s, 28 * s, 20 * s); ctx.fillStyle = Math.sin(t * 5) > 0 ? '#FF4D5E' : '#7A2530'; ctx.beginPath(); ctx.arc(8 * s, -4 * s, 2.5 * s, 0, TAU); ctx.fill(); ctx.fillStyle = '#7FE3FF'; ctx.fillRect(-9 * s, -2 * s, 10 * s, 3 * s); ctx.restore(); ctx.font = '800 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#C9D4F5'; ctx.fillText('🔒 ' + T('Veri kasası', 'Data vault'), X, Y - 22 * s); } }
/* ================= rota planlayıcı ================= */
function rotaYakit() { let px = SH.x, py = SH.y, top = 0; const k = (1 - YUK.warp * 0.1) * (tek('s1') ? 0.9 : 1); return ROTA.map(r => { const d = Math.hypot(r.x - px, r.y - py); px = r.x; py = r.y; const y = d > 6 * SEK ? d / SEK * k : 0; top += y; return { d, y, top }; }); }
function rotaPanel() {
  const P = $('hRotaP'); $('hRota').classList.toggle('on', rotaMod); P.hidden = !rotaMod && !ROTA.length; if (P.hidden) return; const Y = rotaYakit(), top = Y.length ? Y[Y.length - 1].top : 0;
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;font-weight:900;margin:0 0 6px"><span>🧭 ${T('Rota', 'Route')} (${ROTA.length}/8)</span>${rotaAktif ? `<span style="color:#9BE07A">▶ ${T('aktif', 'active')}</span>` : ''}</div>`;
  if (rotaMod) h += `<div class="alt" style="font-size:12px;margin:0 0 6px">${T('Haritada yıldızlara dokunarak durak ekle.', 'Tap stars on the map to add stops.')}</div>`;
  h += ROTA.map((r, i) => `<div style="display:flex;justify-content:space-between;gap:8px;margin:3px 0"><span>${i + 1}. ${esc(r.ad)}</span><small style="color:var(--mute);white-space:nowrap">${mesafeYaz(Y[i].d)}${Y[i].y ? ' · ⛽ ' + Math.ceil(Y[i].y) : ''}</small></div>`).join('') || `<div class="alt">${T('Henüz durak yok', 'No stops yet')}</div>`;
  if (ROTA.length) h += `<div style="margin:8px 0 4px;font-weight:800;color:${top > yakit ? '#FF9AA6' : '#9BE07A'}">⛽ ${T('Gereken yakıt', 'Fuel needed')} ≈ ${Math.ceil(top)} / ${Math.floor(yakit)}${top > yakit ? ' · ' + T('yetmez! Yola bir koloni ekle', 'not enough! add a colony stop') : ''}</div>`;
  h += `<div class="dg" style="flex-wrap:wrap;gap:6px;margin-top:6px">${ROTA.length ? `<button class="kb al" type="button" data-rt="bas">▶ ${T('Başlat', 'Start')}</button><button class="kb" type="button" data-rt="geri">↩</button><button class="kb" type="button" data-rt="sil">✕ ${T('Temizle', 'Clear')}</button>` : ''}<button class="kb" type="button" data-rt="mod">${rotaMod ? '✓ ' + T('Bitti', 'Done') : '✏ ' + T('Düzenle', 'Edit')}</button></div>`;
  P.innerHTML = h;
}
$('hRota').onclick = () => { rotaMod = !rotaMod; rotaPanel(); haritaCiz(); SES.tik(); };
$('hRotaP').addEventListener('click', e => { const b = e.target.closest('[data-rt]'); if (!b) return; const k = b.dataset.rt;
  if (k === 'mod') rotaMod = !rotaMod; else if (k === 'geri') ROTA.pop(); else if (k === 'sil') { ROTA.length = 0; rotaAktif = false; } else if (k === 'bas') { rotaMod = false; haritaKapat(); rotaBaslat(); return; }
  SES.tik(); rotaPanel(); haritaCiz(); kaydet(); });
function rotaBaslat() { if (!ROTA.length) return; rotaAktif = true; ST.rotaN = ROTA.length; rotaSonraki(); }
function rotaSonraki() {
  if (!ROTA.length) { rotaAktif = false; return; } const r = ROTA[0], tm = temel(Math.floor(r.x / SEK), Math.floor(r.y / SEK)), d = Math.hypot(r.x - SH.x, r.y - SH.y);
  if (mod !== 'oto') { mod = 'oto'; ls.set('kozmos-mod', mod); modYaz(); }
  oto = tm && tm.k === r.k ? { tm, ad: r.ad, warp: d > 6 * SEK } : { x: r.x, y: r.y, dur: 400, ad: r.ad, warp: d > 6 * SEK }; wp = { x: r.x, y: r.y, k: r.k, ad: r.ad };
  duyur('🧭 ' + T('Sıradaki durak: ', 'Next stop: ') + '<b>' + esc(r.ad) + '</b>', 'kesif', `${mesafeYaz(d)} · ${ROTA.length} ${T('durak kaldı', 'stops left')}`); gpImza = ''; kaydet();
}
function rotaVardi() { ROTA.shift(); kaydet(); gpImza = ''; if (ROTA.length) setTimeout(() => { if (rotaAktif && oyunda && !limanP && !oto) rotaSonraki(); }, 1500); else { rotaAktif = false; ST.rotaMax = Math.max(ST.rotaMax || 0, ST.rotaN || 0); duyur('🧭 ' + T('Rota tamamlandı!', 'Route complete!'), 'galaksi'); SES.galaksi(); basarimKontrol(); } }
function rotaHarita(c, M2S) {
  if (!ROTA.length) return; let [PX, PY] = M2S(SH.x, SH.y); c.strokeStyle = 'rgba(155,224,122,.75)'; c.lineWidth = 2; c.setLineDash([6, 5]);
  ROTA.forEach((r, i) => { const [X, Y] = M2S(r.x, r.y); c.beginPath(); c.moveTo(PX, PY); c.lineTo(X, Y); c.stroke(); PX = X; PY = Y; }); c.setLineDash([]);
  ROTA.forEach((r, i) => { const [X, Y] = M2S(r.x, r.y); c.fillStyle = '#0B1020'; c.strokeStyle = '#9BE07A'; c.beginPath(); c.arc(X, Y, 9, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#C8FFAA'; c.font = '900 11px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(String(i + 1), X, Y + 4); });
}
