/* ================= derinlik: kontratlar, albüm, defter, gazete, zorluk ================= */
/* Bu parçadaki her şey oyun sırasında çağrılır; önceki parçalar buradaki sabitlere yüklenirken dokunmaz. */

/* ---- zorluk ---- */
const ZORL = {
  rahat: { e: '🌱', ad: ['Rahat', 'Relaxed'], ne: ['Hasar çok daha az, korsanlar seyrek. Keşfetmek ve ticaret için.', 'Much less damage, fewer pirates. For exploring and trading.'] },
  normal: { e: '⚖', ad: ['Normal', 'Normal'], ne: ['Dengeli deneyim.', 'The balanced experience.'] },
  zorlu: { e: '🔥', ad: ['Zorlu', 'Hard'], ne: ['Hasar +%50, görev/korsan/keşif kazancı +%25.', 'Damage +50%, mission/pirate/exploration earnings +25%.'] },
  demir: { e: '☠', ad: ['Demir pilot (tek can)', 'Iron pilot (one life)'], ne: ['Zorlu gibi, kazanç +%50. Gemin parçalanırsa kapsül yok: oyun biter ve yeni oyun başlar. Yalnızca yeni oyunun başında seçilir.', 'Like Hard, earnings +50%. If your ship is destroyed there is no pod: the game ends and a new one begins. Only at the start of a new game.'] },
};
function zorH() { const z = ST.zor; return z === 'rahat' ? 0.55 : z === 'zorlu' || z === 'demir' ? 1.5 : 1; }
function zorO(kat) { const z = ST.zor; if (!z || !['gorev', 'korsan', 'kesif', 'kervan'].includes(kat)) return 1; return z === 'rahat' ? 0.9 : z === 'zorlu' ? 1.25 : z === 'demir' ? 1.5 : 1; }
const demirUygun = () => (ST.gorev || 0) < 3 && sayK('s') < 8 && !PRS && !(ST.olum > 0);
function zorSecKur() {
  const s = $('zorSec'); if (!s) return; const z = ZORL[ST.zor] ? ST.zor : 'normal', dm = demirUygun();
  s.innerHTML = Object.keys(ZORL).map(k => `<option value="${k}" ${k === 'demir' && !dm && z !== 'demir' ? 'disabled' : ''}>${ZORL[k].e} ${L(ZORL[k].ad)}</option>`).join(''); s.value = z;
  $('zorNe').textContent = L(ZORL[z].ne) + (z !== 'demir' && !dm ? ' ' + T('(Demir pilot yalnızca yeni oyunda.)', '(Iron pilot only in a new game.)') : '');
}
$('zorSec').addEventListener('change', e => {
  const v = e.target.value; if (!ZORL[v]) return;
  if (v === 'demir' && !demirUygun()) { duyur('☠ ' + T('Demir pilot yalnızca yeni bir oyunun başında seçilebilir', 'Iron pilot can only be chosen at the start of a new game'), 'uyari'); zorSecKur(); return; }
  if (ST.zor === 'demir' && v !== 'demir') ST.demirB = 1;
  ST.zor = v === 'normal' ? undefined : v; if (v === 'demir') defter('☠ Demir pilot olarak yola çıktım: tek canım var.', '☠ I set out as an iron pilot: I have one life.');
  zorSecKur(); SES.tik(); kaydet(true);
});
function demirSon() {
  KORS.length = 0; MERMI.length = 0; SH.vx = SH.vy = 0; oto = null; patlamaEkle(SH.x, SH.y, 160, '255,190,110'); SES.patla();
  const oz = T(`${sayK('s')} yıldız sistemi keşfettin, ${ST.gorev || 0} görev tamamladın ve toplam ${SAYI(ST.kazanc || 0)} 💰 kazandın.`, `You discovered ${sayK('s')} star systems, completed ${ST.gorev || 0} missions and earned ${SAYI(ST.kazanc || 0)} 💰 in total.`);
  diyalog([['☠ Demir pilot düştü', '☠ The iron pilot has fallen'], [`Gemin parçalandı ve bu kez kaçış kapsülü yok.<br><br>${oz}<br><br>Son kaydın <b>Kayıt → Yedekler</b>’de saklanıyor. Şimdi yeni bir oyun başlıyor.`, `Your ship was destroyed and this time there is no escape pod.<br><br>${oz}<br><br>Your last save is kept under <b>Save → Backups</b>. A new game begins now.`]], () => oyunSifirla());
}

/* ---- yeni görev türleri: acil, kırılgan, VIP, seçkin ---- */
const TESLIM_T = ['teslim', 'yolcu', 'acil', 'kirilgan', 'vip', 'seckin'];
const sureYaz = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? Math.floor(s / 60) + ' ' + T('dk', 'min') + ' ' + String(s % 60).padStart(2, '0') + ' ' + T('sn', 's') : s + ' ' + T('sn', 's'); };
function ekGorevler(p, r, saat, kols) {
  const L2 = []; if (!kols.length) return L2; const u = pilotUn();
  const yap = (j, tip) => {
    const id = p.id + '@' + saat + '#e' + j, q = kols[(r() * kols.length) | 0], ds = Math.hypot(q.s.x - p.s.x, q.s.y - p.s.y) / SEK, b = { id, k: p.id, tip, h: q.id, hs: [q.s.t.sx, q.s.t.sy, q.i], ad: kolAd(q), sis: q.s.t.ad, kisi: 0, yuk: 0 };
    if (tip === 'acil') { b.yuk = 2 + ((r() * 4) | 0); b.sure = Math.round(100 + ds * 55); b.odul = odulK((110 + b.yuk * 9 + ds * 75) * 1.8); }
    else if (tip === 'kirilgan') { b.yuk = 3 + ((r() * 5) | 0); b.sag = 100; b.odul = odulK((100 + b.yuk * 10 + ds * 70) * 1.7); }
    else { b.kisi = 1; b.vip = isim(r, 2); b.odul = odulK((260 + ds * 90) * 2.2); }
    if (!ALINAN.has(id)) L2.push(b);
  };
  const t1 = r(); yap(0, t1 < 0.45 ? 'acil' : t1 < 0.8 ? 'kirilgan' : 'vip');
  if (r() < 0.35) yap(1, ['acil', 'kirilgan', 'vip'][(r() * 3) | 0]);
  if (u.i >= 2) {   // Usta ve üstü: uzak koloniye, süreli ve kırılgan seçkin iş
    const id = p.id + '@' + saat + '#sk'; if (!p._skC || p._skC.s !== saat) p._skC = { s: saat, L: koloniBul(p.s.t.sx, p.s.t.sy, 9).filter(q => q !== p).sort((a, b) => Math.hypot(b.s.x - p.s.x, b.s.y - p.s.y) - Math.hypot(a.s.x - p.s.x, a.s.y - p.s.y)).slice(0, 3) };
    const uz = p._skC.L, q = uz[(r() * uz.length) | 0];
    if (q && !ALINAN.has(id)) { const ds = Math.hypot(q.s.x - p.s.x, q.s.y - p.s.y) / SEK, yuk = 4 + ((r() * 6) | 0); L2.unshift({ id, k: p.id, tip: 'seckin', h: q.id, hs: [q.s.t.sx, q.s.t.sy, q.i], ad: kolAd(q), sis: q.s.t.ad, yuk, kisi: 0, sag: 100, sure: Math.round(150 + ds * 50), odul: odulK((300 + yuk * 14 + ds * 110) * 2.2) }); }
  }
  return L2;
}
function ekMetin(g) {
  const sek = g.hs ? `${T('Sektör', 'Sector')} ${g.hs[0]} : ${g.hs[1]}` : '', kal = ' · ⏳ ' + (g.son ? sureYaz(g.son - Date.now()) : sureYaz((g.sure || 0) * 1000)), sg = g.sag != null ? ` · 🥚 ${Math.round(g.sag)}%` : '', bir = T('birim', 'units');
  if (g.tip === 'acil') return `⏱ <b>${T('Acil teslimat', 'Rush delivery')}: ${g.yuk} ${bir}</b> → ${esc(g.ad)}<small>${esc(g.sis)} · ${sek}${kal}</small>`;
  if (g.tip === 'kirilgan') return `🥚 <b>${T('Kırılgan kargo', 'Fragile cargo')}: ${g.yuk} ${bir}</b> → ${esc(g.ad)}<small>${T('aldığın her hasar kargoya da işler', 'every hit you take damages the cargo')}${sg} · ${sek}</small>`;
  if (g.tip === 'vip') return `🕴 <b>VIP: ${esc(g.vip || '?')}</b> → ${esc(g.ad)}<small>${T('korsanlar yolda peşine düşebilir', 'pirates may come after them on the way')} · ${sek}</small>`;
  if (g.tip === 'seckin') return `💎 <b>${T('Seçkin iş', 'Elite job')}: ${g.yuk} ${T('birim, kırılgan ve süreli', 'units, fragile and timed')}</b> → ${esc(g.ad)}<small>${esc(g.sis)}${sg}${kal} · ${sek}</small>`;
  if (g.tip === 'kontrat') return kontratMetin(g);
  return '';
}
function kirilganHasar(n) {
  for (const g of GOREV.slice()) { if (g.sag == null) continue; g.sag = Math.max(0, g.sag - n * 1.2);
    if (g.sag <= 0) { GOREV = GOREV.filter(x => x !== g); duyur('💔 ' + T('Kırılgan kargo paramparça oldu', 'The fragile cargo was smashed'), 'uyari', esc(g.ad) + ' · ' + T('görev başarısız', 'mission failed')); SES.uyari(); gorevYaz(); } }
}
function gorevZaman() {
  const t = Date.now();
  for (const g of GOREV.slice()) {
    if (g.son && TESLIM_T.includes(g.tip) && t > g.son) { GOREV = GOREV.filter(x => x !== g); ST.gorevKac = (ST.gorevKac || 0) + 1; duyur('⌛ ' + T('Süre doldu: ', 'Time is up: ') + esc(g.ad), 'uyari', T('Süreli teslimat başarısız oldu', 'The timed delivery failed')); SES.uyari(); gorevYaz(); continue; }
    if (g.tip === 'vip' && !g.pusu && !limanP && !kapsul && oyunda) { const h = gorevHedef(g); if (!h) continue; const [x, y] = otoPos(h, simT()), d = Math.hypot(x - SH.x, y - SH.y); if (!g.d0) g.d0 = d; if (d < g.d0 * 0.6 && d > 2500 && !KORS.length) { g.pusu = 1; korsanCikar(); setTimeout(() => duyur('🕴 ' + T('Korsanlar VIP yolcunun peşinde!', 'Pirates are after your VIP passenger!'), 'uyari', T('Koru ve hedefe ulaştır', 'Protect them and get to the destination')), 900); } }
  }
}

/* ---- şirket kontratları (çok aşamalı) ---- */
const KON_SIR = [['Nova Lojistik', 'Nova Logistics'], ['Orion Madencilik', 'Orion Mining'], ['Vega Biyoteknik', 'Vega Biotech'], ['Atlas İnşaat', 'Atlas Construction'], ['Kuasar Enerji', 'Quasar Energy'], ['Selene Tıp', 'Selene Medical']];
const KON_MAL = ['su', 'gida', 'cevher', 'metal', 'elek', 'ilac', 'gaz', 'luks'];
const kontratAktif = () => GOREV.find(g => g.tip === 'kontrat');
function kontratTeklif(p) {
  if (kontratAktif()) return null; const gun = Math.floor(Date.now() / 864e5), id = 'kn' + p.id + '@' + gun; if (ALINAN.has(id)) return null;
  if (p._konC && p._konC.id === id) return p._konC.k;
  const r = rng(h32(p.seed, gun, 909)), sx = p.s.t.sx, sy = p.s.t.sy, kols = koloniBul(sx, sy, 6).filter(q => q !== p); if (kols.length < 2) return null;
  const u = pilotUn(), efs = u.i >= 4 && r() < 0.5, n = efs ? 6 : 3 + (u.i >= 2 ? 1 : 0), adim = []; let top = 0;
  for (let i = 0; i < n; i++) {
    const once = adim.length ? adim[adim.length - 1].t : '', sec = ['git', 'getir', 'kesif'].filter(x => x !== once), t = i === n - 1 ? 'git' : sec[(r() * sec.length) | 0];
    if (t === 'kesif') { let hd = null; for (let k = 0; k < 30 && !hd; k++) { const a = r() * TAU, dd = 2 + r() * 6, tm = temel(sx + Math.round(Math.cos(a) * dd), sy + Math.round(Math.sin(a) * dd)); if (tm && !KESIF.has('s:' + tm.k) && !adim.some(x => x.h === 's:' + tm.k)) hd = tm; } if (hd) { adim.push({ t, h: 's:' + hd.k, hs: [hd.sx, hd.sy], ad: T('Sektör ', 'Sector ') + hd.sx + ' : ' + hd.sy }); top += 500; continue; } }
    const q = kols[(r() * kols.length) | 0], o = { t: t === 'kesif' ? 'git' : t, h: q.id, hs: [q.s.t.sx, q.s.t.sy, q.i], ad: kolAd(q) };
    if (o.t === 'getir') { o.m = KON_MAL[(r() * KON_MAL.length) | 0]; o.n = 4 + ((r() * 8) | 0); top += o.n * MAL[o.m].f * 2; }
    top += 300 + Math.hypot(q.s.x - p.s.x, q.s.y - p.s.y) / SEK * 120; adim.push(o);
  }
  const s = (r() * KON_SIR.length) | 0, k = { id, tip: 'kontrat', k: p.id, s, a: 0, adim, efs: efs ? 1 : 0, ad: L(KON_SIR[s]), hs: adim[0].hs.slice(), odul: odulK((top + 1500) * (efs ? 3 : 1.5)) };
  p._konC = { id, k }; return k;
}
const konAdMetin = o => o.t === 'kesif' ? '🔭 ' + T('keşfet: ', 'discover: ') + esc(o.ad) : o.t === 'getir' ? `📦 ${o.n} ${MAL[o.m].e} ${L(MAL[o.m].ad)} → ${esc(o.ad)}` : '🛬 ' + T('yanaş: ', 'dock at: ') + esc(o.ad);
function kontratMetin(g) { const o = g.adim[g.a]; if (!o) return '📜 ' + esc(g.ad); return `📜 <b>${esc(g.ad)}${g.efs ? ' 👑' : ''} · ${T('Adım', 'Step')} ${g.a + 1}/${g.adim.length}</b> — ${konAdMetin(o)}<small>${T('Kontrat ödülü', 'Contract reward')} ${SAYI(g.odul)} 💰${o.t === 'getir' ? ' · ' + T('ambarda', 'in hold') + ' ' + (KARGO[o.m] || 0) + '/' + o.n : ''}</small>`; }
function kontratHedef(g) { const o = g.adim[g.a]; if (!o) return null; if (o.t === 'kesif') { const tm = temel(o.hs[0], o.hs[1]); return tm ? { tm, ad: o.ad } : null; } const s2 = sistem(o.hs[0], o.hs[1]), q = s2 && s2.gez[o.hs[2]]; return q ? { p: q, ad: o.ad } : null; }
function kontratAdim(g, mesaj) {
  if (!GOREV.includes(g)) return; g.a++; const pay = Math.round(g.odul * 0.08 / 10) * 10; kazan(pay, 'gorev');
  if (g.a >= g.adim.length) {
    GOREV = GOREV.filter(x => x !== g); kazan(g.odul, 'gorev'); ST.gorev = (ST.gorev || 0) + 1; ST.kontrat = (ST.kontrat || 0) + 1; if (g.efs) ST.efsK = (ST.efsK || 0) + 1; frEkle('birlik', 2); if (g.k) itEkle(g.k, 15);
    defter('📜 ' + KON_SIR[g.s][0] + ' kontratını bitirdim.', '📜 I completed the ' + KON_SIR[g.s][1] + ' contract.');
    duyur('📜 ' + T('Kontrat tamamlandı: ', 'Contract complete: ') + '<b>' + esc(g.ad) + '</b>', 'galaksi', `+${SAYI(g.odul + pay)} 💰`); SES.galaksi(); basarimKontrol();
  } else { g.hs = g.adim[g.a].hs.slice(); duyur('📜 ' + esc(g.ad) + ' · ' + T('Adım', 'Step') + ' ' + g.a + '/' + g.adim.length + ' ✓', 'koloni', esc(mesaj) + ` · +${SAYI(pay)} 💰 · ` + T('Sıradaki: ', 'Next: ') + konAdMetin(g.adim[g.a])); SES.koloni(); }
  gorevYaz(); if (limanP) limanYaz(); kaydet();
}
function kontratLiman(p, elle) {
  const g = kontratAktif(); if (!g) return; const o = g.adim[g.a]; if (!o || o.t === 'kesif' || o.h !== p.id) return;
  if (o.t === 'getir') { if ((KARGO[o.m] || 0) < o.n) { if (!elle) setTimeout(() => duyur('📜 ' + esc(g.ad), 'kesif', T(`Bu adım için ${o.n} ${L(MAL[o.m].ad)} getirmelisin. Burada alırsan Görevler sekmesinden teslim et.`, `This step needs ${o.n} ${L(MAL[o.m].ad)}. If you buy them here, deliver from the Missions tab.`)), 700); return; } KARGO[o.m] -= o.n; if (!KARGO[o.m]) delete KARGO[o.m]; }
  if (elle) kontratAdim(g, T('Mallar teslim edildi', 'Goods delivered')); else setTimeout(() => kontratAdim(g, o.t === 'getir' ? T('Mallar teslim edildi', 'Goods delivered') : T('Görüşme yapıldı', 'Meeting held')), 700);
}
function kontratKesif(k) { const g = kontratAktif(); if (!g) return; const o = g.adim[g.a]; if (o && o.t === 'kesif' && o.h === k) setTimeout(() => kontratAdim(g, T('Sistem keşfedildi', 'System discovered')), 1200); }
function kontratHtml(p) {
  const g = kontratAktif(); let h = `<div class="alt" style="margin:12px 0 0;font-weight:900;color:var(--ink)">📜 ${T('Şirket kontratı', 'Company contract')}</div>`;
  if (g) { const o = g.adim[g.a], burada = o && o.t === 'getir' && o.h === p.id; return h + `<div class="satir"><div>${kontratMetin(g)}</div>${burada ? `<div class="dg"><button class="kb al" type="button" data-kontes ${(KARGO[o.m] || 0) < o.n ? 'disabled' : ''}>${T('Teslim et', 'Deliver')}</button></div>` : ''}</div>`; }
  const k = kontratTeklif(p); p._kon = k; if (!k) return h + `<div class="alt">${T('Bugün bu limanda kontrat yok. Başka limanlara uğra.', 'No contract at this port today. Try other ports.')}</div>`;
  return h + `<div class="satir"><div>📜 <b>${esc(k.ad)}${k.efs ? ' · 👑 ' + T('Efsane kontratı', 'Legendary contract') : ''}</b> — ${k.adim.length} ${T('adım', 'steps')}<small>${k.adim.map(konAdMetin).join(' → ')}<br><span style="color:var(--altin)">+${SAYI(k.odul)} 💰 · ${T('her adımda ara ödeme', 'a payment at every step')}</span></small></div><div class="dg"><button class="kb al" type="button" data-kon>${T('Kabul et', 'Accept')}</button></div></div>`;
}
function kontratKabul(p) { const k = p._kon; if (!k || kontratAktif() || ALINAN.has(k.id)) return; GOREV.unshift(JSON.parse(JSON.stringify(k))); ALINAN.add(k.id); p._kon = null; duyur('📜 ' + T('Kontrat imzalandı: ', 'Contract signed: ') + '<b>' + esc(k.ad) + '</b>', 'koloni', konAdMetin(k.adim[0])); SES.koloni(); gorevYaz(); kaydet(); }

/* ---- tür albümü ve kodeks bölüm ödülleri ---- */
const TURLER = {
  okyanus: [['🐙', 'Derin mürekkepçi', 'Deep inkling'], ['🪼', 'Işık medüzü', 'Glow jelly'], ['🐚', 'Sarmal kabuklu', 'Spiral shell']],
  orman: [['🍄', 'Yürüyen mantar', 'Walking mushroom'], ['🦋', 'Cam kanat', 'Glasswing'], ['🌿', 'Salınan sap', 'Swaying stalk']],
  buz: [['🦭', 'Buz foku', 'Ice seal'], ['🦐', 'Kristal karides', 'Crystal shrimp'], ['🐧', 'Kar kuşu', 'Snow bird']],
  zehir: [['🦠', 'Asit jölesi', 'Acid jelly'], ['🪸', 'Zehir mercanı', 'Toxic coral'], ['🐸', 'Boğuk kurbağa', 'Croaker toad']],
};
const TIP_ALB = { okyanus: ['🌊 Okyanus dünyaları', '🌊 Ocean worlds'], orman: ['🌳 Orman dünyaları', '🌳 Verdant worlds'], buz: ['🧊 Buz dünyaları', '🧊 Ice worlds'], zehir: ['☣ Zehirli dünyalar', '☣ Toxic worlds'] };
const albL = () => Array.isArray(ST.alb) ? ST.alb : (ST.alb = []);
function albumEkle(tip, tur) {
  const T0 = TURLER[tip]; if (!T0 || !T0[tur]) return; const id = tip + ':' + tur, A = albL(); if (A.includes(id)) return; A.push(id); const E = T0[tur];
  setTimeout(() => duyur(E[0] + ' ' + T('Yeni tür: ', 'New species: ') + '<b>' + L([E[1], E[2]]) + '</b>', 'kesif', T('Tür albümüne eklendi', 'Added to the species album') + ` · ${A.length}/12`), 1500);
  if (T0.every((_, i) => A.includes(tip + ':' + i))) { kazan(1500, 'kesif'); bilimEkle(10); setTimeout(() => { duyur('📗 ' + T('Albüm sayfası tamam: ', 'Album page complete: ') + L(TIP_ALB[tip]), 'galaksi', `+${SAYI(1500)} 💰 · 🔬 +10`); SES.galaksi(); }, 3000); }
  if (A.length >= 12 && !ST.albTam) { ST.albTam = 1; kazan(6000, 'kesif'); bilimEkle(30); defter('🦋 Tür albümünün bütün sayfalarını doldurdum.', '🦋 I filled every page of the species album.'); setTimeout(() => duyur('🏆 ' + T('Tür albümü tamamlandı!', 'Species album complete!'), 'galaksi', `+${SAYI(6000)} 💰 · 🔬 +30`), 4500); }
}
function kodBolum(k) {
  const E = KODX[k]; if (!E) return; const kat = E[0], L2 = Object.keys(KODX).filter(x => KODX[x][0] === kat); if (!L2.every(x => KOD.has(x))) return;
  const od = ST.kodOd = Array.isArray(ST.kodOd) ? ST.kodOd : []; if (od.includes(kat)) return; od.push(kat); kazan(2500, 'kesif'); bilimEkle(10);
  setTimeout(() => { duyur('📖 ' + T('Kodeks bölümü tamam: ', 'Codex chapter complete: ') + L(KOD_KAT[kat]), 'galaksi', `+${SAYI(2500)} 💰 · 🔬 +10`); SES.galaksi(); }, 2500);
}
function albumHtml() {
  const A = albL(); let h = `<div class="alt" style="margin:4px 0 2px;font-weight:900;color:var(--ink)">🦋 ${T('Tür albümü', 'Species album')} <small style="color:var(--mute)">${A.length}/12</small></div><div class="alt" style="font-size:12px">${T(`Okyanus, orman, buz ve zehirli gezegenlere in, yaşam formlarını tara. Her tamamlanan sayfa +${SAYI(1500)} 💰, bütün albüm +${SAYI(6000)} 💰. Kodeksin her bölümünü tamamlamak da +${SAYI(2500)} 💰 verir.`, `Land on ocean, verdant, ice and toxic worlds and scan life forms. Each complete page +${SAYI(1500)} 💰, the whole album +${SAYI(6000)} 💰. Completing each codex chapter also gives +${SAYI(2500)} 💰.`)}</div>`;
  for (const tip in TURLER) { const n = TURLER[tip].filter((_, i) => A.includes(tip + ':' + i)).length; h += `<div class="satir"><div><b>${L(TIP_ALB[tip])}</b> <span style="color:var(--mute);font-size:12px">${n}/3${n === 3 ? ' ✅' : ''}</span><small>${TURLER[tip].map((E, i) => A.includes(tip + ':' + i) ? `${E[0]} ${L([E[1], E[2]])}` : '❔ ???').join(' · ')}</small></div></div>`; }
  return h;
}

/* ---- ticaret defteri ---- */
function ticKay(y, p, m, n, f) {
  if (!(n > 0)) return; const L2 = ST.tic = Array.isArray(ST.tic) ? ST.tic : [], M = ST.mly = ST.mly && typeof ST.mly === 'object' && !Array.isArray(ST.mly) ? ST.mly : {}, ad = kolAd(p); let kar = null;
  if (y === 'al') { const o = M[m] = Array.isArray(M[m]) ? M[m] : [0, 0, '']; o[0] += n; o[1] += f; o[2] = ad; }
  else { const o = M[m]; if (Array.isArray(o) && o[0] > 0) { const q = Math.min(n, o[0]), ort = o[1] / o[0], al = o[2]; kar = Math.round(f * q / n - ort * q); o[0] -= q; o[1] -= ort * q; if (o[0] <= 0) delete M[m]; ST.ticKar = (ST.ticKar || 0) + kar; if (al && al !== ad) rotaKay(al, ad, m, kar / q); } }
  L2.unshift({ t: Date.now(), y, p: ad, m, n, f: Math.round(f), k: kar }); if (L2.length > 40) L2.length = 40;
}
function rotaKay(a, b, m, birim) {
  const R = ST.trot = Array.isArray(ST.trot) ? ST.trot : []; let o = R.find(x => x.a === a && x.b === b && x.m === m);
  if (!o) { o = { a, b, m, b1: birim, n: 0 }; R.push(o); } o.n++; o.b1 = Math.max(o.b1, birim); R.sort((x, y) => y.b1 - x.b1); if (R.length > 20) R.length = 20;
}
function ticDefterHtml() {
  const L2 = Array.isArray(ST.tic) ? ST.tic : [], gun = Date.now() - 864e5, k24 = L2.filter(x => x.t > gun && x.k != null).reduce((a, x) => a + x.k, 0), R = (Array.isArray(ST.trot) ? ST.trot : []).filter(r => r.b1 > 0 && MAL[r.m]).slice(0, 3), renk = v => v >= 0 ? '#9BE07A' : '#FF9AA6';
  let h = `<div class="alt" style="margin:14px 0 2px;font-weight:900;color:var(--ink)">📒 ${T('Ticaret defteri', 'Trade log')}</div><div class="alt" style="font-size:12.5px">${T('Son 24 saat kâr', 'Profit, last 24h')}: <b style="color:${renk(k24)}">${k24 >= 0 ? '+' : ''}${SAYI(k24)} 💰</b> · ${T('toplam', 'total')} <b style="color:${renk(ST.ticKar || 0)}">${SAYI(ST.ticKar || 0)} 💰</b></div>`;
  if (R.length) h += `<div class="alt" style="font-size:12.5px;margin:6px 0 0">🏆 ${T('En kârlı rotaların', 'Your most profitable routes')}</div>` + R.map(r => `<div class="alt" style="font-size:12px;margin:2px 0 0 8px">${MAL[r.m].e} ${esc(r.a)} → ${esc(r.b)} · <b style="color:#9BE07A">+${SAYI(Math.round(r.b1))}</b> 💰/${T('birim', 'unit')} <span style="color:var(--mute)">×${r.n}</span></div>`).join('');
  h += L2.slice(0, 8).map(x => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;margin:3px 0;color:var(--mute)"><span>${x.y === 'al' ? '🛒' : '💰'} ${MAL[x.m] ? MAL[x.m].e : ''} ${x.n} · ${esc(x.p)}</span><span>${x.y === 'al' ? '−' : '+'}${SAYI(x.f)}${x.k != null ? ` <b style="color:${renk(x.k)}">(${x.k >= 0 ? '+' : ''}${SAYI(x.k)})</b>` : ''}</span></div>`).join('') || `<div class="alt" style="font-size:12px">${T('Henüz alım satım yok. Aldığın ve sattığın her mal burada kârıyla birlikte görünür.', 'No trades yet. Everything you buy and sell shows up here with its profit.')}</div>`;
  return h;
}

/* ---- kendi kolonilerinin istekleri ---- */
const IST_MAL = ['ilac', 'gida', 'su', 'metal', 'elek', 'luks', 'gaz'];
function kolMut(kk) { const m = kk && kk.koloni && kk.koloni.mut; return Number.isFinite(m) ? m : 60; }
const kolYuz = kk => { const m = kolMut(kk); return m >= 70 ? '😊' : m >= 40 ? '😐' : '😟'; };
function kolIstekAdim() {
  const t = Date.now();
  for (const kk of KARAKOL) {
    const K0 = kk.koloni; if (!K0) continue;
    if (K0.ist && !(MAL[K0.ist.m] && Number.isFinite(K0.ist.son))) K0.ist = null;
    if (K0.ist && t > K0.ist.son) { K0.mut = Math.max(0, kolMut(kk) - 15); duyur('😟 ' + esc(K0.ad), 'uyari', T('İsteği karşılanmadı: koloni huzursuz, vergi azaldı', 'Request not met: the colony is restless, taxes are down')); K0.ist = null; K0.iT = t + 2 * 3.6e6; }
    else if (!K0.ist) { if (!Number.isFinite(K0.iT)) K0.iT = t + 20 * 60000; if (t > K0.iT) { const m = IST_MAL[(Math.random() * IST_MAL.length) | 0]; K0.ist = { m, n: 5 + ((Math.random() * 11) | 0), son: t + 6 * 3.6e6 }; duyur('📦 ' + esc(K0.ad) + T(' kolonin bir şey istiyor', ' colony needs something'), 'koloni', `${K0.ist.n} ${MAL[m].e} ${L(MAL[m].ad)} · ⏳ 6 ${T('sa', 'h')} · ${T('getirirsen mutluluk ve vergi artar', 'bring it for happiness and taxes')}`); } }
  }
}
function kolIstekBtn(kk) {
  const I = kk.koloni.ist; if (!I || !MAL[I.m]) return ''; const var_ = KARGO[I.m] || 0, ok = var_ >= I.n;
  return `<button class="gpb ${ok ? 'y' : ''}" type="button" data-g="kistek" ${ok ? '' : 'disabled'}>📦 ${T('İstek', 'Request')}: ${I.n} ${MAL[I.m].e} ${L(MAL[I.m].ad)} · ${var_}/${I.n} · ⏳ ${Math.max(1, Math.ceil((I.son - Date.now()) / 3.6e6))} ${T('sa', 'h')}</button>`;
}
function kolIstekVer(kk) {
  const K0 = kk && kk.koloni, I = K0 && K0.ist; if (!I || (KARGO[I.m] || 0) < I.n) return;
  KARGO[I.m] -= I.n; if (!KARGO[I.m]) delete KARGO[I.m]; const od = Math.round(I.n * MAL[I.m].f * 1.6); kazan(od, 'koloni'); K0.mut = Math.min(100, kolMut(kk) + 20); K0.ist = null; K0.iT = Date.now() + (3 + Math.random() * 3) * 3.6e6; ST.kolIst = (ST.kolIst || 0) + 1;
  duyur('😊 ' + esc(K0.ad) + T(' sana teşekkür ediyor', ' thanks you'), 'koloni', `+${SAYI(od)} 💰 · ${T('mutluluk', 'happiness')} ${Math.round(K0.mut)}% · ${T('vergi', 'taxes')} ×${(0.6 + K0.mut / 150).toFixed(2)}`); SES.koloni(); gpImza = ''; kaydet();
}

/* ---- konvoy (kervan) filosu yükseltmeleri ---- */
const KV_UP = [5000, 11000, 20000], KV_YUKL = [8, 12, 18, 26];
const kvLv = kv => Math.max(0, Math.min(3, (kv && kv.lv) | 0));
function kvYukselt(i) {
  const kv = KERVAN[i]; if (!kv) return; const lv = kvLv(kv), f = KV_UP[lv]; if (f == null || kredi < f) return;
  kredi -= f; kv.lv = lv + 1; duyur('🚚 ' + T('Kervan yükseltildi: Sv ', 'Convoy upgraded: Lv ') + kv.lv, 'koloni', T(`Ambar ${KV_YUKL[kv.lv]} birim · korsan saldırısı daha seyrek`, `Hold ${KV_YUKL[kv.lv]} units · fewer pirate attacks`)); SES.koloni(); kaydet();
}

/* ---- gövde çatlakları ---- */
const CATLAK = [[[-6, -3], [-2, -1], [1, -4], [5, -2]], [[-10, 4], [-6, 2], [-3, 5], [0, 3]], [[2, 2], [6, 4], [10, 1]], [[-13, -5], [-9, -8], [-5, -6]]];
function govdeCatlak(X, Y, a, s, o, t) {
  const n = o < 0.2 ? 4 : o < 0.4 ? 3 : 2; ctx.save(); ctx.translate(X, Y); ctx.rotate(a); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) { const c = CATLAK[i]; ctx.beginPath(); c.forEach(([x, y], j) => j ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s));
    ctx.strokeStyle = 'rgba(18,12,10,.85)'; ctx.lineWidth = Math.max(1, s * 1.1); ctx.stroke();
    if (o < 0.3) { ctx.strokeStyle = `rgba(255,140,60,${(0.35 + 0.3 * Math.sin(t * 9 + i * 2)).toFixed(2)})`; ctx.lineWidth = Math.max(0.6, s * 0.45); ctx.stroke(); } }
  ctx.restore();
}
const tmDeger = k => k === 'govde' ? can / maxCan() * 100 : MODUL[k];
function tmEkle(k, art) { if (k === 'govde') can = Math.min(maxCan(), can + maxCan() * art / 100 * 0.4); else MODUL[k] = Math.min(100, MODUL[k] + art); }
const tmAd = k => k === 'govde' ? { e: '🩹', ad: ['Gövde yaması', 'Hull patch'] } : MODAD[k];

/* ---- gezegen ortam sesi ---- */
function ortamAdim() {
  if (!oyunda || SES.duzey() <= 0) { SES.ortam('', 0); return; }
  let tip = '', k = 0;
  if (limanP) { tip = limanP.tip; k = 0.55; }
  else { const s2 = sistem(Math.floor(SH.x / SEK), Math.floor(SH.y / SEK)); if (s2) { const t = simT(); let ed = Infinity, en = null; for (const p of s2.gez) { const [px, py] = gezPos(p, t), d = Math.hypot(px - SH.x, py - SH.y) - p.r; if (d < ed) { ed = d; en = p; } } if (en && ed < 2600) { tip = en.tip; k = kis(1 - ed / 2600, 0, 1); k *= k; } } }
  SES.ortam(tip, k);
}

/* ---- dönemsel adım (saniyede bir) ---- */
let derinT = 0;
function derinAdim() {
  if (!oyunda) return; gorevZaman(); ortamAdim();
  if (--derinT > 0) return; derinT = 30; kolIstekAdim();
}

/* ---- Kozmos Gazetesi ---- */
function gazeteHtml() {
  const d = new Date(), tk = TAKVIM[gunOlay()] || { e: '📅', ad: ['Sakin bir gün', 'A quiet day'], ne: ['', ''] };
  const bl = (bas, ic) => `<div class="satir" style="display:block"><div style="font-weight:900;color:var(--altin);font-size:11.5px;letter-spacing:.6px;text-transform:uppercase">${bas}</div><div style="margin-top:3px;font-size:13.5px">${ic}</div></div>`;
  let h = `<div style="text-align:center;margin:4px 0 8px;border-bottom:1px solid var(--line);padding-bottom:8px"><div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:900;letter-spacing:.5px">${T('Kozmos Gazetesi', 'The Kozmos Gazette')}</div><div class="alt" style="font-size:12px;margin:2px 0 0">${d.toLocaleDateString(EN() ? 'en-GB' : 'tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${T('Sayı', 'Issue')} ${Math.floor(Date.now() / 864e5) - 20000}</div></div>`;
  h += bl('📰 ' + T('Manşet', 'Headline'), `<b style="font-size:16px">${tk.e || '📅'} ${L(tk.ad)}</b>${tk.ne && L(tk.ne) ? `<div class="alt" style="font-size:12.5px;margin:2px 0 0">${L(tk.ne)}</div>` : ''}`);
  const bx = Math.floor(Math.floor(SH.x / SEK) / 8), by = Math.floor(Math.floor(SH.y / SEK) / 8), po = [];
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) for (const o of piyasaOlay(bx + dx, by + dy)) if (po.length < 5 && !po.some(x => x.p === o.p && x.m === o.m)) po.push(o);
  h += bl('📈 ' + T('Piyasalar', 'Markets'), po.length ? po.map(o => `${o.kit ? '🔺 ' + T('Kıtlık', 'Shortage') : '🔻 ' + T('Bolluk', 'Glut')}: <b>${esc(kolAd(o.p))}</b> · ${MAL[o.m].e} ${L(MAL[o.m].ad)} ×${SAYI(o.kat, 1)} <span style="color:var(--mute);font-size:12px">(${mesafeYaz(Math.hypot(o.p.s.x - SH.x, o.p.s.y - SH.y))})</span>`).join('<br>') : T('Bölgende fiyatlar sakin.', 'Prices are calm in your region.'));
  const P = haftaParkur(); h += bl('🏁 ' + T('Haftanın senaryosu', 'Scenario of the week'), `<b>${esc(P.ad)}</b> — ${L(SEN[P.mod].ne)}<div class="alt" style="font-size:12px;margin:2px 0 0">${T('Topluluk → 🏁 Yarış sekmesinden katıl. Herkes aynı parkurda yarışıyor.', 'Join from Community → 🏁 Racing. Everyone races the same course.')}</div>`);
  const kisa = haberListe().filter(s2 => !/^(Piyasa|Markets)/.test(s2)).slice(1, 5); if (kisa.length) h += bl('🗞 ' + T('Kısa kısa', 'In brief'), kisa.map(s2 => '• ' + esc(s2)).join('<br>'));
  h += bl('🏆 ' + T('Haftanın en çok kazanan pilotları', 'Top earners of the week'), `<div id="gazSira" class="alt" style="font-size:12.5px">${AG.durum() === 'acik' ? T('Yükleniyor…', 'Loading…') : T('Çevrimiçi değilsin.', 'You are offline.')}</div>`);
  const u = pilotUn(), istek = KARAKOL.filter(k => k.koloni && k.koloni.ist).length, sonD = DEFTER.slice(-3).reverse();
  h += bl('🧑‍🚀 ' + T('Senin köşen', 'Your corner'), `${u.e} ${T('Rütbe', 'Rank')}: <b>${u.ad}</b> · ${T('görev', 'missions')} ${ST.gorev || 0}${istek ? ` · 📦 ${istek} ${T('koloni isteği bekliyor', 'colony requests waiting')}` : ''}${kontratAktif() ? ' · 📜 ' + esc(kontratAktif().ad) : ''}${sonD.length ? '<div class="alt" style="font-size:12px;margin:4px 0 0">' + sonD.map(x => '• ' + esc(L(x.m))).join('<br>') + '</div>' : ''}`);
  return h;
}
function gazeteYukle() {
  if (AG.durum() !== 'acik') return; haftaKontrol();
  AG.hafta(ST.hw).then(L2 => { const el = $('gazSira'); if (!el) return; el.innerHTML = L2 && L2.length ? L2.slice(0, 3).map((r, i) => `${['🥇', '🥈', '🥉'][i]} <b>${esc(String(r.n || '?').slice(0, 20))}</b> · ${SAYI(Math.round(r.p || 0))} 💰`).join('<br>') : T('Bu hafta henüz kimse kazanmadı.', 'Nobody has earned yet this week.'); });
}

/* ---- haftalık senaryo: herkes aynı parkurda ---- */
const SEN = {
  ruzgar: { e: '🌬', ad: ['Güneş rüzgârı', 'Solar wind'], ne: ['Sürekli yan rüzgâr gemiyi itiyor; rotanı düzelterek uç.', 'A constant crosswind pushes the ship; keep correcting your line.'] },
  sis: { e: '🌫', ad: ['Sis koşusu', 'Fog run'], ne: ['Yalnızca sıradaki halka görünür; gerisini sezerek bul.', 'Only the next ring is visible; find the rest by feel.'] },
  kaya: { e: '🪨', ad: ['Kaya labirenti', 'Rock maze'], ne: ['Parkur iki kat daha kayalık; çarpmadan geç.', 'The course is twice as rocky; get through without crashing.'] },
};
function haftaParkur() {
  const hw = haftaK(Date.now()), id = 'h' + hw.replace('-', ''); let P = PRK.get(id);
  if (!P) {
    const r = rng(h32(+hw.slice(0, 4), +hw.slice(5), 4242)), mod = ['ruzgar', 'sis', 'kaya'][(r() * 3) | 0], s0 = sistem(0, 0), a0 = r() * TAU, x0 = s0.x + Math.cos(a0) * 2.6 * SEK, y0 = s0.y + Math.sin(a0) * 2.6 * SEK;
    let a = r() * TAU, x = x0, y = y0, len = 0; const H0 = [];
    for (let i = 0; i < 12; i++) { a += (r() - 0.5) * 1.6; const st = 1800 + r() * 1400; x += Math.cos(a) * st; y += Math.sin(a) * st; len += st; H0.push({ x, y, r: mod === 'sis' ? 175 : 150 }); }
    const T0 = []; for (let i = 0; i < (mod === 'kaya' ? 40 : 18); i++) { const j = (r() * 11) | 0, A = H0[j], B = H0[j + 1], f = 0.2 + r() * 0.6, nx = -(B.y - A.y), ny = B.x - A.x, nl = Math.hypot(nx, ny) || 1, off = (r() - 0.5) * (mod === 'kaya' ? 520 : 700), v = []; for (let q = 0; q < 9; q++) v.push(0.75 + r() * 0.3); T0.push({ x: lerp(A.x, B.x, f) + nx / nl * off, y: lerp(A.y, B.y, f) + ny / nl * off, r: 40 + r() * 55, v, a: r() * TAU }); }
    const ra = r() * TAU; P = { id, x0, y0, H: H0, T0, mod, haf: 1, ruz: [Math.cos(ra) * 260, Math.sin(ra) * 260], par: Math.round(len / 2100 * 1000 * (mod === 'ruzgar' ? 1.2 : mod === 'kaya' ? 1.1 : 1.05)) };
    PRK.set(id, P);
  }
  P.ad = SEN[P.mod].e + ' ' + T('Haftalık: ', 'Weekly: ') + L(SEN[P.mod].ad); return P;
}
function prkListe() { const L2 = [parkur('ev')], g = parkur(galHucre(SH.x, SH.y)); if (g.id !== 'ev') L2.push(g); L2.push(haftaParkur()); return L2; }
function haftaKalan() { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + ((8 - (d.getUTCDay() || 7)) % 7 || 7)); const k = d - Date.now(); return Math.floor(k / 864e5) + ' ' + T('gün', 'd') + ' ' + Math.floor(k % 864e5 / 36e5) + ' ' + T('sa', 'h'); }
function haftaYarisHtml() {
  const P = haftaParkur(), en = ls.get('kozmos-yrb-' + P.id, 0);
  return `<div class="satir" style="border-color:rgba(255,200,87,.5)"><div>${SEN[P.mod].e} <b>${T('Haftalık senaryo', 'Weekly scenario')}: ${L(SEN[P.mod].ad)}</b><small>${L(SEN[P.mod].ne)}<br>📍 ${mesafeYaz(Math.hypot(P.x0 - SH.x, P.y0 - SH.y))} · 🎯 ${yrSure(P.par)}${en ? ' · 🏆 ' + yrSure(en) : ''} · ⏳ ${haftaKalan()} · ${T(`ilk bitiriş +${SAYI(2000)} 💰`, `first finish +${SAYI(2000)} 💰`)}</small></div><div class="dg"><button class="kb al" type="button" data-ygit="h">${T('Git', 'Go')}</button></div></div><div id="yrs-${P.id}" style="margin:0 0 8px 8px"></div>`;
}

/* ---- erişilebilirlik ---- */
function erisimUygula() {
  const D = document.documentElement; D.dataset.renk = ls.get('kozmos-renk', '') || ''; D.dataset.yazi = ls.get('kozmos-yazi', '') || '';
  if ($('renkSec')) $('renkSec').value = D.dataset.renk; if ($('yaziSec')) $('yaziSec').value = D.dataset.yazi; if ($('azSec')) $('azSec').checked = AZ_HAREKET;
}
$('renkSec').addEventListener('change', e => { ls.set('kozmos-renk', e.target.value); erisimUygula(); SES.tik(); });
$('yaziSec').addEventListener('change', e => { ls.set('kozmos-yazi', e.target.value); erisimUygula(); SES.tik(); gpKonum(); });
$('azSec').addEventListener('change', e => { AZ_HAREKET = e.target.checked; ls.set('kozmos-azh', AZ_HAREKET); SES.tik(); });
erisimUygula();

/* ---- cihazlar arası taşıma bağlantısı ---- */
function tasiLink(kod) { return location.origin + location.pathname + '?tasi=' + encodeURIComponent(kod); }
async function tasiPaylas() {
  if (AG.durum() !== 'acik') { duyur('☁ ' + T('Taşıma için çevrimiçi olmalısın', 'You need to be online to transfer'), 'uyari'); return; }
  await bulutKaydet(true); const kod = ls.get('kozmos-bulut-kod', null); if (!kod) return; const url = tasiLink(kod);
  try { if (navigator.share) { await navigator.share({ title: 'Kozmos', text: T('Kozmos kaydımı bu cihaza taşı', 'Move my Kozmos save to this device'), url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); duyur('🔗 ' + T('Taşıma bağlantısı kopyalandı', 'Transfer link copied'), 'koloni', T('Diğer cihazda aç: kod hazır gelir', 'Open it on the other device: the code is filled in')); } catch (e) { duyur('🔗 ' + T('Bağlantı', 'Link'), 'koloni', esc(url)); }
}
(function tasiGeldi() {
  let kod = null; try { kod = new URLSearchParams(location.search).get('tasi'); } catch (e) { } if (!kod) return;
  kod = String(kod).trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16); if (kod.length < 10) return;
  ls.set('kozmos-tasi', kod); try { history.replaceState(null, '', location.pathname); } catch (e) { }
  setTimeout(() => { try { const b = document.querySelector('[data-ms="kayit"]'); if (b) b.click(); const d = $('bulDet'); if (d) d.open = true; bulYaz(); } catch (e) { } }, 600);
})();
