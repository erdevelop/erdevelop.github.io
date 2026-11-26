/* ================= kendi istasyonun ================= */
const ISTN_F = 25000, ISTN_MAL = { metal: 15, elek: 5 };
const ISTM = {
  depo: { e: '📦', ad: ['Depo', 'Storage'], ne: L0 => T(`${[0, 60, 150, 300][L0]} birim mal saklar`, `Stores ${[0, 60, 150, 300][L0]} units`), f: [0, 0, 8000, 20000] },
  rafineri: { e: '🏭', ad: ['Rafineri', 'Refinery'], ne: L0 => L0 ? T(`Saatte ${10 * L0} işlem: 2 cevher → 1 metal, 1 gaz → 4 yakıt`, `${10 * L0} jobs per hour: 2 ore → 1 metal, 1 gas → 4 fuel`) : T('Ham maddeyi işler', 'Processes raw materials'), f: [0, 6000, 14000, 30000] },
  savunma: { e: '🎯', ad: ['Savunma tareti', 'Defence turret'], ne: L0 => L0 ? T(`Yakındaki korsanları vurur (güç ${L0})`, `Shoots nearby pirates (power ${L0})`) : T('İstasyon çevresini korur', 'Guards the station'), f: [0, 5000, 12000, 26000] },
  iskele: { e: '⚓', ad: ['Ticaret iskelesi', 'Trade pier'], ne: L0 => L0 ? T(`Uğrayan tüccarlardan saatte ${SAYI(120 * L0)} 💰`, `${SAYI(120 * L0)} 💰 per hour from visiting traders`) : T('Tüccarlar uğrar, kira öder', 'Traders visit and pay fees'), f: [0, 7000, 16000, 34000] },
};
let istnAcik = false, istnAtT = 0, istnLaz = null;
function istnKur(x, y) {
  if (istnObj || kapsul) return; const eksik = Object.entries(ISTN_MAL).filter(([m, n]) => (KARGO[m] || 0) < n);
  if (kredi < ISTN_F || eksik.length) { duyur('🏗 ' + T('İstasyon için gerekenler', 'A station needs'), 'uyari', `${SAYI(ISTN_F)} 💰 · ${Object.entries(ISTN_MAL).map(([m, n]) => `${MAL[m].e} ${KARGO[m] || 0}/${n}`).join(' · ')}`); return; }
  const sx = Math.floor(x / SEK), sy = Math.floor(y / SEK); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tm = temel(sx + i, sy + j); if (tm && Math.hypot(tm.x - x, tm.y - y) < tm.yr * 4) { duyur('🏗 ' + T('Yıldıza çok yakın: biraz daha uzağa kur', 'Too close to a star: build further away'), 'uyari'); return; } }
  kredi -= ISTN_F; for (const [m, n] of Object.entries(ISTN_MAL)) { KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; }
  istnObj = { x: Math.round(x), y: Math.round(y), ad: pilotAd() + T(' İstasyonu', ' Station'), mod: { depo: 1, rafineri: 0, savunma: 0, iskele: 0 }, depo: {}, yakit: 0, kasa: 0, son: Date.now() };
  defter('🏗 Kendi uzay istasyonumu kurdum.', '🏗 I built my own space station.'); patlamaEkle(x, y, 200, '255,227,166'); SES.galaksi(); duyur('🏗 ' + T('İstasyonun kuruldu!', 'Your station is built!'), 'galaksi', T('Yanına uçup yanaş ve modüllerini büyüt', 'Fly over, dock and grow its modules')); basarimKontrol(); kaydet();
}
function istnIsle() {
  const I = istnObj; if (!I) return; const sa = Math.min(24, (Date.now() - I.son) / 3.6e6); if (sa < 0.01) return; I.son = Date.now();
  I.kasa = Math.min(12000, I.kasa + Math.round(120 * I.mod.iskele * sa));
  let is = Math.floor(10 * I.mod.rafineri * sa + (I._kir || 0)); I._kir = (10 * I.mod.rafineri * sa + (I._kir || 0)) % 1;
  while (is > 0 && (I.depo.cevher || 0) >= 2) { I.depo.cevher -= 2; I.depo.metal = (I.depo.metal || 0) + 1; is--; }
  while (is > 0 && (I.depo.gaz || 0) >= 1) { I.depo.gaz -= 1; I.yakit += 4; is--; }
  for (const m in I.depo) if (!I.depo[m]) delete I.depo[m];
}
const depoDolu = () => istnObj ? Object.values(istnObj.depo).reduce((a, b) => a + b, 0) : 0, depoKap = () => istnObj ? [0, 60, 150, 300][istnObj.mod.depo] : 0;
function istnAdim(dt) {
  const I = istnObj; if (!I || !oyunda) return; istnAtT -= dt; if (istnLaz) { istnLaz.o += dt; if (istnLaz.o > 0.25) istnLaz = null; }
  if (I.mod.savunma && istnAtT <= 0) { let en = null, ed = 3200; for (const k of KORS) { const d = Math.hypot(k.x - I.x, k.y - I.y); if (d < ed && !k.ana) { ed = d; en = k; } } if (en) { istnAtT = 0.9; en.can -= 35 * I.mod.savunma; en._hf = 1; istnLaz = { x2: en.x, y2: en.y, o: 0 }; if (en.can <= 0) korsanOldu(en, KORS.indexOf(en)); } }
}
function istnCiz(t) {
  const I = istnObj; if (!I) return; const [X, Y] = W2S(I.x, I.y), R = Math.max(12, 190 * cam.z); if (X < -R * 3 || X > W + R * 3 || Y < -R * 3 || Y > H + R * 3) return;
  ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 0.025);
  ctx.strokeStyle = '#C8D2EC'; ctx.lineWidth = Math.max(2, R * 0.09); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = Math.max(1, R * 0.03); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  const mods = Object.entries(I.mod).filter(([, v]) => v > 0), renk = { depo: '#C26A2A', rafineri: '#8A8F9A', savunma: '#FF7B8A', iskele: '#FFC857' };
  ctx.strokeStyle = '#9AA6BC'; ctx.lineWidth = Math.max(1, R * 0.04); for (let i = 0; i < 4; i++) { const a = i * TAU / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke(); }
  mods.forEach(([k, v], i) => { const a = i * TAU / Math.max(4, mods.length) + Math.PI / 4; ctx.save(); ctx.translate(Math.cos(a) * R, Math.sin(a) * R); ctx.rotate(a); ctx.fillStyle = renk[k]; const s2 = R * (0.16 + v * 0.05); ctx.fillRect(-s2, -s2 * 0.7, s2 * 2, s2 * 1.4); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeRect(-s2, -s2 * 0.7, s2 * 2, s2 * 1.4); ctx.restore(); });
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.34); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#5A6A8A'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 0.3, 0, TAU); ctx.fill();
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.fillStyle = Math.sin(t * 3 + i) > 0 ? '#FFE3A6' : '#7FE3FF'; ctx.beginPath(); ctx.arc(Math.cos(a) * R, Math.sin(a) * R, Math.max(1.2, R * 0.025), 0, TAU); ctx.fill(); }
  ctx.restore();
  if (istnLaz) { const [x2, y2] = W2S(istnLaz.x2, istnLaz.y2); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,123,138,${(1 - istnLaz.o * 4).toFixed(2)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE3A6'; ctx.fillText('🏗 ' + I.ad, X, Y - R - 12);
}
function istnAc() { if (!istnObj) return; istnIsle(); istnAcik = true; SH.vx = SH.vy = 0; oto = null; KORS.length = 0; MERMI.length = 0; istnYaz(); $('istnP').hidden = false; SES.koloni(); gpImza = ''; }
function istnKapat() { istnAcik = false; $('istnP').hidden = true; SES.tik(); kaydet(); }
function istnYaz() {
  const I = istnObj, dd = depoDolu(), dk = depoKap(), eks = Math.ceil(tank() - yakit), onr = Math.ceil(maxCan() - can);
  let h = `<h2 style="margin:0 0 2px;font-size:21px;font-weight:900">🏗 ${esc(I.ad)}</h2><div class="alt" style="margin:0 0 6px">${T('Senin istasyonun: yakıt ve onarım burada her zaman ücretsiz.', 'Your own station: fuel and repairs are always free here.')}</div>`;
  h += `<div class="dg" style="margin:4px 0 8px">${onr > 0 || Object.values(MODUL).some(v => v < 100) ? `<button class="kb al" type="button" data-isn="onar">🔧 ${T('Onar', 'Repair')}</button>` : ''}${eks > 0 && !kapsul ? `<button class="kb al" type="button" data-isn="yakit" ${I.yakit < 1 ? 'disabled' : ''}>⛽ ${T('Yakıt al', 'Refuel')} (${T('depoda', 'stored')} ${Math.floor(I.yakit)})</button>` : ''}${I.kasa > 0 ? `<button class="kb al" type="button" data-isn="kasa">💰 ${T('Kasayı topla', 'Collect')} ${SAYI(I.kasa)}</button>` : ''}</div>`;
  h += `<div class="alt" style="margin:8px 0 0;font-weight:900;color:var(--ink)">🧩 ${T('Modüller', 'Modules')}</div>`;
  for (const k in ISTM) { const M = ISTM[k], L0 = I.mod[k], f = M.f[L0 + 1]; h += `<div class="satir"><div>${M.e} <b>${L(M.ad)}</b> <span class="lv">${L0 ? T('Sv ', 'Lv ') + L0 : T('yok', 'none')}</span><small>${M.ne(L0)}${L0 < 3 ? ' → ' + M.ne(L0 + 1) : ''}</small></div><div class="dg">${L0 >= 3 ? `<button class="kb" type="button" disabled>✓ ${T('En üst', 'Max')}</button>` : `<button class="kb al" type="button" data-isnm="${k}" ${kredi < f ? 'disabled' : ''}>${L0 ? T('Yükselt', 'Upgrade') : T('Kur', 'Build')} · ${SAYI(f)} 💰</button>`}</div></div>`; }
  h += `<div class="alt" style="margin:12px 0 0;font-weight:900;color:var(--ink)">📦 ${T('Depo', 'Storage')} ${dd}/${dk}</div><div class="alt" style="font-size:12px;margin:2px 0 4px">${T('Rafineri depodaki cevheri metale, gazı yakıta çevirir.', 'The refinery turns stored ore into metal and gas into fuel.')}</div>`;
  const tum = [...new Set([...Object.keys(KARGO), ...Object.keys(I.depo)])].filter(m => (KARGO[m] || 0) + (I.depo[m] || 0) > 0);
  h += tum.length ? tum.map(m => `<div class="satir"><div>${MAL[m].e} <b>${L(MAL[m].ad)}</b><small>${T('Ambar', 'Hold')}: ${KARGO[m] || 0} · ${T('Depo', 'Storage')}: ${I.depo[m] || 0}</small></div><div class="dg"><button class="kb" type="button" data-dep="${m}" ${!(KARGO[m] > 0) || dd >= dk ? 'disabled' : ''}>⬇ ${T('Depoya', 'Store')}</button><button class="kb" type="button" data-cek="${m}" ${!(I.depo[m] > 0) || kargoDolu() >= kapasite() ? 'disabled' : ''}>⬆ ${T('Ambara', 'Take')}</button></div></div>`).join('') : `<div class="alt">${T('Ambar ve depo boş.', 'Hold and storage are empty.')}</div>`;
  $('isnIc').innerHTML = h;
}
$('istnP').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return; const I = istnObj;
  if (b.id === 'isnKapat') { istnKapat(); return; }
  if (b.dataset.isn === 'onar') { can = maxCan(); for (const k in MODUL) MODUL[k] = 100; SES.koloni(); }
  else if (b.dataset.isn === 'yakit') { const n = Math.min(I.yakit, tank() - yakit); yakit += n; I.yakit -= n; SES.tik(); }
  else if (b.dataset.isn === 'kasa') { kazan(I.kasa, 'ticaret'); duyur('💰 ' + T('İstasyon kasası toplandı', 'Station takings collected'), 'koloni', `+${SAYI(I.kasa)} 💰`); I.kasa = 0; SES.koloni(); }
  else if (b.dataset.isnm) { const k = b.dataset.isnm, L0 = I.mod[k], f = ISTM[k].f[L0 + 1]; if (L0 < 3 && kredi >= f) { kredi -= f; istnIsle(); I.mod[k] = L0 + 1; SES.galaksi(); duyur('🏗 ' + ISTM[k].e + ' ' + L(ISTM[k].ad) + ' · ' + T('Sv ', 'Lv ') + I.mod[k], 'koloni', ISTM[k].ne(I.mod[k])); basarimKontrol(); } }
  else if (b.dataset.dep) { const m = b.dataset.dep, n = Math.min(KARGO[m] || 0, depoKap() - depoDolu()); if (n > 0) { KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; I.depo[m] = (I.depo[m] || 0) + n; SES.tik(); } }
  else if (b.dataset.cek) { const m = b.dataset.cek, n = Math.min(I.depo[m] || 0, kapasite() - kargoDolu()); if (n > 0) { I.depo[m] -= n; if (!I.depo[m]) delete I.depo[m]; KARGO[m] = (KARGO[m] || 0) + n; SES.tik(); } }
  istnYaz(); kaydet();
});
/* ================= mürettebat olayları ================= */
function moralEkle(n) { MORAL = Math.max(0, Math.min(100, MORAL + n)); }
let ekOlayT = 300 + Math.random() * 240, EOL = null;
const EKOLAY = [
  { id: 'hasta', e: '🤒', bas: ['Hastalık', 'Illness'], yaz: e => [`${e.ad} ateşler içinde yatıyor. Revir malzemesi az.`, `${e.ad} is down with a fever. Medical supplies are low.`], sec: [[['Doktor çağır (300 💰)', 'Call a doctor (300 💰)'], e => { if (kredi < 300) return [T('Paran yetmedi…', 'Not enough credits…'), -6]; kredi -= 300; return [T('Hızla iyileşti ve sana teşekkür etti.', 'Recovered quickly and thanked you.'), 6]; }], [['Dinlensin, geçer', 'Let them rest, it’ll pass'], e => Math.random() < 0.5 ? [T('Birkaç gün sonra kendine geldi.', 'Back on their feet after a few days.'), 0] : (e.xp = 0, [T('Uzun sürdü; deneyiminin bir kısmını unuttu.', 'It dragged on; they forgot some of their experience.'), -8])]] },
  { id: 'kavga', iki: true, e: '😠', bas: ['Tartışma', 'Argument'], yaz: (e, f) => [`${e.ad} ile ${f.ad} vardiya yüzünden kavga ediyor. Herkes sana bakıyor.`, `${e.ad} and ${f.ad} are fighting over shifts. Everyone is looking at you.`], sec: [[['Arabulucu ol', 'Mediate'], () => Math.random() < 0.7 ? [T('Barıştılar, ortam yumuşadı.', 'They made up; the mood softened.'), 8] : [T('Pek ikna olmadılar.', 'They weren’t really convinced.'), -2]], [['Vardiyaları sen belirle', 'Set the shifts yourself'], () => [T('Kavga bitti ama kimse mutlu değil.', 'The fight ended but nobody is happy.'), -4]]] },
  { id: 'sinyal', e: '📡', bas: ['Garip sinyal', 'Strange signal'], yaz: e => [`${e.ad} telsizde tekrar eden zayıf bir sinyal yakaladı. Yakında olmalı.`, `${e.ad} caught a faint repeating signal on the radio. It must be close.`], sec: [[['İzini sür', 'Track it'], () => { const a = Math.random() * TAU, d = 1800 + Math.random() * 1500; hurdaCikar(SH.x + Math.cos(a) * d, SH.y + Math.sin(a) * d, Math.random() < 0.6 ? 'kutu' : 'garip'); const q = HURDA[HURDA.length - 1]; q.vx = q.vy = 0; wp = { x: q.x, y: q.y, k: '', ad: T('Sinyal', 'Signal') }; return [T('Kaynağı işaretlendi: rotada!', 'Source marked: it is on your route!'), 4]; }], [['Boş ver', 'Ignore it'], () => [T('Sinyal bir süre sonra sustu.', 'The signal faded after a while.'), -1]]] },
  { id: 'dogum', e: '🎂', bas: ['Doğum günü', 'Birthday'], yaz: e => [`Bugün ${e.ad}’nın doğum günü!`, `It’s ${e.ad}’s birthday today!`], sec: [[['Parti ver (200 💰)', 'Throw a party (200 💰)'], () => { if (kredi < 200) return [T('Kredi yetmedi, kart yazdınız.', 'No credits, so you wrote a card.'), 3]; kredi -= 200; return [T('Uzayın en güzel partisi!', 'The best party in space!'), 12]; }], [['Kart imzalat', 'Sign a card'], () => [T('Küçük ama içten bir jest.', 'Small but heartfelt.'), 4]]] },
  { id: 'borc', e: '💳', bas: ['Borç', 'Debt'], yaz: e => [`${e.ad} istasyonda gemi parçası almak için 400 kredi borçlanmış.`, `${e.ad} borrowed 400 credits at a station for ship parts.`], sec: [[['Borcunu öde (400 💰)', 'Pay the debt (400 💰)'], () => { if (kredi < 400) return [T('Ödeyemedin.', 'You couldn’t pay.'), -5]; kredi -= 400; return [T('Bu iyiliği unutmayacak.', 'They won’t forget this kindness.'), 7]; }], [['Kendi sorunu', 'Their problem'], (e) => { if (Math.random() < 0.2) { const i = EKIP.indexOf(e); if (i >= 0) EKIP.splice(i, 1); return [T(`${e.ad} bir sonraki limanda gemiden ayrıldı.`, `${e.ad} left the ship at the next port.`), -10]; } return [T('Biraz küstü ama işine devam ediyor.', 'A bit sulky, but still working.'), -4]; }]] },
  { id: 'fikir', rol: 'muhendis', e: '💡', bas: ['Parlak fikir', 'Bright idea'], yaz: e => [`${e.ad} sistemleri yeniden ayarlamak için bir fikir buldu. Biraz parça gerekiyor.`, `${e.ad} has an idea to retune the systems. Needs a few parts.`], sec: [[['Dene (500 💰)', 'Try it (500 💰)'], () => { if (kredi < 500) return [T('Parça alamadın.', 'You couldn’t buy parts.'), -1]; kredi -= 500; for (const k in MODUL) MODUL[k] = 100; can = maxCan(); bilimEkle(10); return [T('İşe yaradı! Sistemler tam, +10 bilim.', 'It worked! Systems at full, +10 science.'), 5]; }], [['Şimdi değil', 'Not now'], () => [T('Fikrini not etti.', 'They noted the idea down.'), -1]]] },
  { id: 'ozlem', e: '🏠', bas: ['Özlem', 'Homesick'], yaz: e => [`${e.ad} ailesini çok özlüyor, gözleri dalıp gidiyor.`, `${e.ad} misses their family terribly.`], sec: [[['Eve mesaj attır', 'Let them message home'], () => [T('Ailesinden gelen cevap yüzünü güldürdü.', 'The reply from home made them smile.'), 5]], [['Ekibe moral gecesi (300 💰)', 'Crew movie night (300 💰)'], () => { if (kredi < 300) return [T('Bütçe yetmedi.', 'Not enough budget.'), 1]; kredi -= 300; return [T('Herkes biraz rahatladı.', 'Everyone relaxed a bit.'), 10]; }]] },
  { id: 'kacak', e: '🫣', bas: ['Kaçak yolcu', 'Stowaway'], yaz: () => [`Kargo bölmesinde saklanan genç bir kaçak yolcu bulundu. Çalışmak istediğini söylüyor.`, `A young stowaway was found hiding in the cargo bay. They say they want to work.`], sec: [[['Ekibe al', 'Take them on'], () => { if (EKIP.length >= EKIP_MAX()) return [T('Yer yoktu; bir sonraki limanda bıraktın.', 'No room; you dropped them at the next port.'), 0]; const roller = Object.keys(ROL), rol = roller[(Math.random() * roller.length) | 0]; EKIP.push({ id: 'kc' + Date.now(), ad: ADLAR[(Math.random() * ADLAR.length) | 0] + ' ' + SOY[(Math.random() * SOY.length) | 0], rol, lv: 1, xp: 0, maas: 40 }); return [T('Yeni bir ' + ROL[rol].ad[0].toLowerCase() + ' kazandın!', 'You gained a new ' + ROL[rol].ad[1].toLowerCase() + '!'), 4]; }], [['Yetkililere teslim et', 'Hand them over'], () => { kazan(150); return [T('Küçük bir ödül aldın: +150 💰', 'You got a small reward: +150 💰'), -3]; }]] },
];
function ekipOlayAdim(dt) {
  if (!oyunda || !EKIP.length || limanP || KORS.length || diyalogAcik || !$('ekOlay').hidden || bankaAcik || istAcik || borsaAcik || istnAcik || inisAcik || fotoMod) return;
  ekOlayT -= dt; if (ekOlayT > 0) return; ekOlayT = 360 + Math.random() * 300;
  const L2 = EKOLAY.filter(o => (!o.iki || EKIP.length >= 2) && (!o.rol || EKIP.some(e => e.rol === o.rol)) && (!o.huy || EKIP.some(e => huyOf(e) === o.huy))), O = L2[(Math.random() * L2.length) | 0];
  const e = O.rol ? EKIP.find(x => x.rol === O.rol) : O.huy ? EKIP.find(x => huyOf(x) === O.huy) : EKIP[(Math.random() * EKIP.length) | 0], f = EKIP.find(x => x !== e);
  EOL = { O, e, f }; $('eoBas').textContent = O.e + ' ' + L(O.bas); $('eoYaz').textContent = L(O.yaz(e, f));
  $('eoSec').innerHTML = O.sec.map((sc, i) => `<button class="${i ? 'ikincil' : 'ana'}" type="button" data-eo="${i}" style="margin:0">${esc(L(sc[0]))}</button>`).join(''); $('ekOlay').hidden = false; SES.uyari();
}
$('ekOlay').addEventListener('click', e => {
  const b = e.target.closest('[data-eo]'); if (!b || !EOL) return;
  if (EOL.bitti) { $('ekOlay').hidden = true; EOL = null; return; }
  const [yaz, md] = EOL.O.sec[+b.dataset.eo][1](EOL.e, EOL.f); moralEkle(md); ekipXp('doktor', 4); ST.ekOlay = (ST.ekOlay || 0) + 1;
  $('eoYaz').innerHTML = esc(yaz) + `<br><br><b style="color:${md > 0 ? '#9BE07A' : md < 0 ? '#FF7B8A' : 'var(--mute)'}">${T('Moral', 'Morale')} ${md > 0 ? '+' : ''}${md} → ${Math.round(MORAL)}</b>`;
  $('eoSec').innerHTML = `<button class="ana" type="button" data-eo="0" style="margin:0">${T('Tamam', 'OK')}</button>`; EOL.bitti = true; SES.tik(); basarimKontrol(); kaydet();
});
/* ================= mürettebat: huylar, yaralanma, eğitim ================= */
const HUY = {
  hizli: { e: '📚', ad: ['Hızlı öğrenen', 'Quick learner'], ne: ['Deneyim +%50', 'XP +50%'], xp: 1.5 },
  tembel: { e: '😴', ad: ['Tembel', 'Lazy'], ne: ['Deneyim −%30', 'XP −30%'], xp: 0.7 },
  tutumlu: { e: '🪙', ad: ['Tutumlu', 'Thrifty'], ne: ['Maaş −%20', 'Wage −20%'], maas: 0.8 },
  hirsli: { e: '💼', ad: ['Hırslı', 'Ambitious'], ne: ['Maaş +%20, deneyim +%25', 'Wage +20%, XP +25%'], maas: 1.2, xp: 1.25 },
  neseli: { e: '😄', ad: ['Neşeli', 'Cheerful'], ne: ['Ekip morali yavaş yavaş yükselir', 'Crew morale slowly rises'], moral: 0.5 },
  asabi: { e: '😤', ad: ['Asabi', 'Hot-headed'], ne: ['Moral yavaş yavaş düşer', 'Morale slowly drops'], moral: -0.4 },
  cesur: { e: '🦁', ad: ['Cesur', 'Brave'], ne: ['Korsan düştükçe moral yükselir', 'Morale rises with every pirate downed'] },
  sansli: { e: '🍀', ad: ['Şanslı', 'Lucky'], ne: ['Keşif ödülleri +%10', 'Exploration rewards +10%'] },
};
const HUY_K = Object.keys(HUY);
function strH(s2) { let h = 7; for (let i = 0; i < s2.length; i++) h = (h * 31 + s2.charCodeAt(i)) | 0; return h >>> 0; }
function huyOf(e) { if (!e.huy || !HUY[e.huy]) e.huy = HUY_K[strH(String(e.id || e.ad)) % HUY_K.length]; return e.huy; }
const huyXp = e => HUY[huyOf(e)].xp || 1, huyEt = e => { const H0 = HUY[huyOf(e)]; return `<span title="${L(H0.ne)}">${H0.e} ${L(H0.ad)}</span>`; };
const egitF = e => 150 * e.lv;
function xpBar(e) { if (e.lv >= 5) return `<small style="color:var(--altin)">⭐ ${T('En üst seviye', 'Max level')}</small>`; const g = 40 * e.lv, o = Math.min(1, (e.xp || 0) / g); return `<div style="height:4px;border-radius:2px;background:rgba(255,255,255,.08);margin:4px 0 0;max-width:180px"><i style="display:block;height:100%;width:${(o * 100).toFixed(0)}%;background:#9BE07A;border-radius:2px"></i></div>`; }
function ekipEgit(p, i) { const e = EKIP[i]; if (!e || e.lv >= 5 || e._eg === p.id) return; const f = egitF(e); if (kredi < f) return; kredi -= f; e._eg = p.id; const once = e.lv; e.xp = (e.xp || 0) + 40 * e.lv * 0.6 / huyXp(e); ekipXp('__yok__', 0); duyur('🎓 ' + esc(e.ad) + T(' eğitim aldı', ' completed training'), 'koloni', e.lv > once ? T('Terfi etti!', 'Promoted!') : `-${SAYI(f)} 💰`); SES.koloni(); basarimKontrol(); kaydet(); }
function ekipYarala() { const L2 = EKIP.filter(e => !(e.yara > Date.now())); if (!L2.length) return; const e = L2[(Math.random() * L2.length) | 0], dk = Math.max(1.5, 5 - ekipLv('doktor')); e.yara = Date.now() + dk * 60000; moralEkle(-3); duyur('🤕 ' + esc(e.ad) + T(' yaralandı!', ' was injured!'), 'uyari', T(`${Math.round(dk)} dakika görev yapamaz · limanda hemen iyileşir`, `Out of action for ${Math.round(dk)} min · heals at once in port`)); }
function ekipIyiles() { let n = 0; for (const e of EKIP) if (e.yara > Date.now()) { e.yara = 0; n++; } if (n) setTimeout(() => duyur('🩹 ' + T('Yaralılar limanda iyileşti', 'The injured healed in port'), 'koloni'), 700); }
EKOLAY.push(
  { id: 'asabi', huy: 'asabi', e: '😤', bas: ['Gergin hava', 'Tension'], yaz: e => [`${e.ad} yine sinirli, köprüde herkese bağırıyor.`, `${e.ad} is angry again, shouting at everyone on the bridge.`], sec: [[['Sakin bir konuşma yap', 'Have a calm talk'], () => Math.random() < 0.6 ? [T('Biraz yumuşadı, özür diledi.', 'They softened and apologised.'), 4] : [T('Dinlemedi bile.', 'They didn’t even listen.'), -2]], [['Resmi uyarı ver', 'Give a formal warning'], () => [T('Sustu ama ortam soğudu.', 'They went quiet, but the mood chilled.'), -1]]] },
  { id: 'usta', iki: true, e: '🎓', bas: ['Usta çırak', 'Mentoring'], yaz: (e, f) => [`${e.ad}, ${f.ad}’ya işini öğretmek istiyor. Birkaç vardiyalarını alacak.`, `${e.ad} wants to teach ${f.ad} the job. It will take a few of their shifts.`], sec: [[['İzin ver', 'Allow it'], (e, f) => { f.xp = (f.xp || 0) + 20 * f.lv; ekipXp('__yok__', 0); return [T(`${f.ad} çok şey öğrendi.`, `${f.ad} learned a lot.`), 4]; }], [['Şimdi olmaz', 'Not now'], () => [T('İkisi de biraz bozuldu.', 'Both were a little disappointed.'), -2]]] },
  { id: 'sans', huy: 'sansli', e: '🍀', bas: ['Şans eseri', 'Lucky find'], yaz: e => [`${e.ad} kargo bölmesinde unutulmuş bir kredi çipi buldu!`, `${e.ad} found a forgotten credit chip in the cargo bay!`], sec: [[['Ekiple paylaş', 'Share it with the crew'], () => { kazan(300, 'diger'); return [T('+300 💰 ve herkes mutlu.', '+300 💰 and everyone is happy.'), 6]; }], [['Hepsini kasaya koy', 'Put it all in the safe'], () => { kazan(600, 'diger'); return [T('+600 💰, ama ekip biraz homurdandı.', '+600 💰, but the crew grumbled.'), -3]; }]] },
);
/* ================= kendi kolonin ve terraform ================= */
const KOL_TIP = ['kaya', 'col', 'buz', 'lav', 'zehir', 'okyanus', 'orman'], KOLK_F = 20000, KOL_MAL = { gida: 10, metal: 10, su: 10, alasim: 4 };
const TF = [
  { e: '🪨', ad: ['Çorak', 'Barren'] },
  { e: '🌫', ad: ['Atmosfer', 'Atmosphere'], g: { gaz: 20, islemci: 2 }, dk: 8 },
  { e: '🌊', ad: ['Su', 'Water'], g: { su: 30, alasim: 4 }, dk: 12 },
  { e: '🌿', ad: ['Bitki örtüsü', 'Plant life'], g: { gida: 20, ilac: 6 }, dk: 16 },
  { e: '🏙', ad: ['Yaşanabilir', 'Habitable'], g: { parca: 4, cekirdek: 2, luks: 10 }, dk: 20 },
];
const KBINA = {
  maden: { e: '⛏', ad: ['Maden', 'Mine'], ne: ['Saatte cevher ve metal', 'Ore and metal every hour'], f: 2500, g: { alasim: 2 }, as: 0 },
  aritma: { e: '💧', ad: ['Su arıtma', 'Water plant'], ne: ['Saatte su', 'Water every hour'], f: 2500, g: { metal: 5 }, as: 2 },
  ciftlik: { e: '🌾', ad: ['Çiftlik', 'Farm'], ne: ['Saatte gıda, nüfus sınırı +%50', 'Food every hour, population cap +50%'], f: 3000, g: { su: 10 }, as: 3 },
  fabrika: { e: '🏭', ad: ['Fabrika', 'Factory'], ne: ['Saatte alaşım', 'Alloy every hour'], f: 5000, g: { parca: 2 }, as: 1 },
  lab: { e: '🔬', ad: ['Laboratuvar', 'Laboratory'], ne: ['Saatte seviyesi kadar bilim puanı', 'Science each hour equal to its level'], f: 6000, g: { islemci: 1 }, as: 1 },
  iskele: { e: '🛰', ad: ['Yörünge iskelesi', 'Orbital dock'], ne: ['Kolonine inince yakıt ve onarım', 'Fuel and repairs when you visit'], f: 4000, g: { alasim: 3 }, as: 0 },
};
const KOL_URET = { maden: [['cevher', 5], ['metal', 2]], aritma: [['su', 6]], ciftlik: [['gida', 6]], fabrika: [['alasim', 2]] };
let kolT = 2;
const kolVergi = () => (20 + Math.sqrt(KOL.nuf) * 0.5) * (1 + 0.1 * KOL.asama);
const kolCap = () => [300, 3000, 3e4, 3e5, 3e6][KOL.asama] * (1 + 0.5 * (KOL.bina.ciftlik || 0));
function kolKur(p) {
  if (KOL || !p || p.kol || kapsul) return; const eksik = Object.entries(KOL_MAL).filter(([m, n]) => (KARGO[m] || 0) < n);
  if (kredi < KOLK_F || eksik.length) { duyur('🏠 ' + T('Koloni için gerekenler', 'A colony needs'), 'uyari', `${SAYI(KOLK_F)} 💰 · ${Object.entries(KOL_MAL).map(([m, n]) => `${MAL[m].e} ${KARGO[m] || 0}/${n}`).join(' · ')}`); return; }
  kredi -= KOLK_F; for (const [m, n] of Object.entries(KOL_MAL)) { KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; }
  const bas = p.tip === 'orman' ? 3 : p.tip === 'okyanus' ? 2 : 0; KOL = { z: [p.s.t.sx, p.s.t.sy, p.i], id: p.id, ad: p.ad + T(' Kolonisi', ' Colony'), tip0: p.tip, asama: bas, tf: null, nuf: 120, bina: {}, depo: {}, kasa: 0, bilim: 0, son: Date.now(), kur: Date.now() };
  defter(`🏠 ${p.ad} gezegeninde kendi kolonimi kurdum.`, `🏠 I founded my own colony on ${p.ad}.`); SES.galaksi(); duyur('🏠 ' + T('Kolonin kuruldu!', 'Your colony is founded!'), 'galaksi', esc(KOL.ad)); kodAc('p:' + p.tip); basarimKontrol(); kaydet(); gpImza = ''; kolAc();
}
function kolIsle() {
  if (!KOL) return; const simdi = Date.now(), sa = Math.min(24, (simdi - KOL.son) / 3.6e6); KOL.son = simdi;
  if (KOL.tf && simdi >= KOL.tf.bit) { KOL.asama = KOL.tf.hedef; KOL.tf = null; const A = TF[KOL.asama]; defter(`🌍 ${KOL.ad}: terraform aşaması tamamlandı — ${A.ad[0]}.`, `🌍 ${KOL.ad}: terraforming stage complete — ${A.ad[1]}.`); setTimeout(() => { duyur('🌍 ' + esc(KOL.ad) + ': ' + A.e + ' ' + L(A.ad), 'galaksi', T('Terraform aşaması tamamlandı', 'Terraforming stage complete')); SES.galaksi(); basarimKontrol(); }, 300); kaydet(); }
  if (sa <= 0) return; const cap = kolCap(); KOL.nuf = Math.min(cap, KOL.nuf + (cap - KOL.nuf) * (1 - Math.exp(-0.15 * sa)) + 2 * sa);
  for (const k in KOL_URET) { const lv = KOL.bina[k] || 0; if (!lv) continue; for (const [m, n] of KOL_URET[k]) KOL.depo[m] = Math.min(40 * lv, (KOL.depo[m] || 0) + n * lv * sa); }
  KOL.kasa = Math.min(15000, KOL.kasa + kolVergi() * sa); if (KOL.bina.lab) KOL.bilim = Math.min(24, (KOL.bilim || 0) + KOL.bina.lab * sa);
  if (!$('kolonim').hidden) kolYaz();
}
function kolAc() { if (!KOL) return; kolIsle(); const q = zGez(KOL.z); if (KOL.bina.iskele && q) { const yk = tank() - yakit, on = maxCan() - can; if (yk > 0.5 || on > 0.5) { yakit = tank(); can = maxCan(); setTimeout(() => duyur('🛰 ' + T('Yörünge iskelesi: yakıt dolduruldu, gövde onarıldı', 'Orbital dock: refuelled and repaired'), 'koloni'), 300); } } SH.vx *= 0.2; SH.vy *= 0.2; kolYaz(); $('kolonim').hidden = false; SES.koloni(); }
function kolYaz() {
  const q = zGez(KOL.z), A = TF[KOL.asama], gelisen = KOL.tf; let h = `<h2 style="margin:0 0 2px;font-size:21px;font-weight:900">🏠 ${esc(KOL.ad)}</h2><div class="alt">${q ? esc(q.ad) + ' · ' + L(PT[KOL.tip0] ? PT[KOL.tip0].ad : ['', '']) : ''} · ${A.e} ${L(A.ad)} · 👥 ${nufYaz(KOL.nuf)} / ${nufYaz(kolCap())}</div>`;
  h += `<div class="alt" style="margin:12px 0 4px;font-weight:900;color:var(--ink)">🌍 ${T('Terraform', 'Terraforming')}</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin:0 0 6px">${TF.map((a, i) => `<span style="font-size:12px;font-weight:800;padding:3px 8px;border-radius:8px;border:1px solid var(--line);${i <= KOL.asama ? 'background:rgba(155,224,122,.18);color:#C8FFAA' : 'opacity:.55'}">${a.e} ${L(a.ad)}${i <= KOL.asama ? ' ✓' : ''}</span>`).join('')}</div>`;
  if (gelisen) { const kal = Math.max(0, gelisen.bit - Date.now()), top = TF[gelisen.hedef].dk * 60000, o = 1 - kal / top; h += `<div class="alt">${TF[gelisen.hedef].e} ${L(TF[gelisen.hedef].ad)} ${T('sürüyor', 'in progress')} · ${Math.ceil(kal / 60000)} ${T('dk kaldı', 'min left')}</div><div style="height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin:4px 0"><i style="display:block;height:100%;width:${(o * 100).toFixed(1)}%;background:linear-gradient(90deg,#4FA3FF,#9BE07A)"></i></div>`; }
  else if (KOL.asama < 4) { const S = TF[KOL.asama + 1], yap = Object.entries(S.g).every(([m, n]) => (KARGO[m] || 0) >= n); h += `<div class="satir"><div>${S.e} <b>${T('Sıradaki: ', 'Next: ')}${L(S.ad)}</b><small>${Object.entries(S.g).map(([m, n]) => `${MAL[m].e} ${KARGO[m] || 0}/${n}`).join(' · ')} · ⏱ ${S.dk} ${T('dk', 'min')}</small></div><div class="dg"><button class="kb al" type="button" data-km="tf" ${yap ? '' : 'disabled'}>${T('Teslim et ve başlat', 'Deliver and start')}</button></div></div>`; }
  else h += `<div class="alt" style="color:#9BE07A;font-weight:800">🏙 ${T('Gezegen tamamen yaşanabilir!', 'The planet is fully habitable!')}</div>`;
  h += `<div class="alt" style="margin:12px 0 4px;font-weight:900;color:var(--ink)">💰 ${T('Gelir', 'Income')}</div><div class="satir"><div>🏦 <b>${T('Vergi kasası', 'Tax chest')}</b><small>${SAYI(Math.floor(KOL.kasa))} 💰${KOL.bilim >= 1 ? ' · 🔬 ' + Math.floor(KOL.bilim) : ''} · ${T('saatte', 'per hour')} ~${SAYI(Math.round(kolVergi()))} 💰</small></div><div class="dg"><button class="kb al" type="button" data-km="topla" ${KOL.kasa < 1 && (KOL.bilim || 0) < 1 ? 'disabled' : ''}>${T('Topla', 'Collect')}</button></div></div>`;
  const dp = Object.entries(KOL.depo).filter(([, n]) => n >= 1); h += `<div class="alt" style="margin:12px 0 4px;font-weight:900;color:var(--ink)">📦 ${T('Koloni deposu', 'Colony storage')}</div>` + (dp.length ? dp.map(([m, n]) => `<div class="satir"><div>${MAL[m].e} <b>${L(MAL[m].ad)}</b><small>${Math.floor(n)}</small></div><div class="dg"><button class="kb al" type="button" data-kmal="${m}" ${kargoDolu() >= kapasite() ? 'disabled' : ''}>${T('Ambara al', 'Load')}</button></div></div>`).join('') : `<div class="alt">${T('Binalar kurdukça burada ürün birikir.', 'Goods pile up here as you build structures.')}</div>`);
  h += `<div class="alt" style="margin:12px 0 4px;font-weight:900;color:var(--ink)">🏗 ${T('Binalar', 'Structures')}</div>`;
  for (const k in KBINA) { const B = KBINA[k], lv = KOL.bina[k] || 0, f = B.f * (lv + 1), kilit = KOL.asama < B.as, yap = !kilit && lv < 3 && kredi >= f && Object.entries(B.g).every(([m, n]) => (KARGO[m] || 0) >= n * (lv + 1));
    h += `<div class="satir"><div>${B.e} <b>${L(B.ad)}</b> ${lv ? `<span class="lv">${T('sv', 'lv')} ${lv}</span>` : ''}<small>${L(B.ne)}${kilit ? ' · 🔒 ' + TF[B.as].e + ' ' + L(TF[B.as].ad) + T(' aşaması gerekir', ' stage needed') : ''}</small>${lv < 3 && !kilit ? `<small>${SAYI(f)} 💰 · ${Object.entries(B.g).map(([m, n]) => `${MAL[m].e} ${KARGO[m] || 0}/${n * (lv + 1)}`).join(' · ')}</small>` : ''}</div><div class="dg">${lv < 3 ? `<button class="kb al" type="button" data-kbina="${k}" ${yap ? '' : 'disabled'}>${lv ? T('Geliştir', 'Upgrade') : T('Kur', 'Build')}</button>` : '<span class="lv">MAX</span>'}</div></div>`; }
  $('kmIc').innerHTML = h;
}
$('kolonim').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled || !KOL) return;
  if (b.id === 'kmKapat') { $('kolonim').hidden = true; kaydet(); return; }
  if (b.dataset.km === 'tf' && !KOL.tf && KOL.asama < 4) { const S = TF[KOL.asama + 1]; if (!Object.entries(S.g).every(([m, n]) => (KARGO[m] || 0) >= n)) return; for (const [m, n] of Object.entries(S.g)) { KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; } KOL.tf = { hedef: KOL.asama + 1, bit: Date.now() + S.dk * 60000 }; duyur('🌍 ' + T('Terraform başladı: ', 'Terraforming started: ') + S.e + ' ' + L(S.ad), 'koloni', `⏱ ${S.dk} ${T('dk', 'min')}`); SES.koloni(); }
  else if (b.dataset.km === 'topla') { const k = Math.floor(KOL.kasa), bl = Math.floor(KOL.bilim || 0); if (k > 0) kazan(k, 'koloni'); if (bl > 0) bilimEkle(bl); KOL.kasa -= k; KOL.bilim = (KOL.bilim || 0) - bl; duyur('🏦 ' + T('Koloni geliri toplandı', 'Colony income collected'), 'koloni', `+${SAYI(k)} 💰${bl ? ' · 🔬 +' + bl : ''}`); SES.koloni(); }
  else if (b.dataset.kmal) { const m = b.dataset.kmal, n = Math.min(Math.floor(KOL.depo[m] || 0), kapasite() - kargoDolu()); if (n > 0) { KARGO[m] = (KARGO[m] || 0) + n; KOL.depo[m] -= n; SES.tik(); } }
  else if (b.dataset.kbina) { const k = b.dataset.kbina, B = KBINA[k], lv = KOL.bina[k] || 0, f = B.f * (lv + 1); if (lv >= 3 || KOL.asama < B.as || kredi < f || !Object.entries(B.g).every(([m, n]) => (KARGO[m] || 0) >= n * (lv + 1))) return; kredi -= f; for (const [m, n] of Object.entries(B.g)) { KARGO[m] -= n * (lv + 1); if (!KARGO[m]) delete KARGO[m]; } KOL.bina[k] = lv + 1; duyur(B.e + ' ' + L(B.ad) + (lv ? T(' geliştirildi', ' upgraded') : T(' kuruldu', ' built')), 'koloni'); SES.koloni(); }
  basarimKontrol(); kolYaz(); kaydet();
});
$('kmKapat').onclick = () => { $('kolonim').hidden = true; kaydet(); };
function kolOrtu(p, t, X, Y, sr, lx, ly) {
  if (sr < 2) return; const as = KOL.asama + (KOL.tf ? kis(1 - (KOL.tf.bit - Date.now()) / (TF[KOL.tf.hedef].dk * 60000), 0, 1) * 0.999 : 0), r = rng((p.seed >>> 0) || 1);
  ctx.save(); ctx.beginPath(); ctx.arc(X, Y, sr, 0, TAU); ctx.clip();
  if (as > 1.2) { ctx.fillStyle = `rgba(40,110,230,${(0.45 * kis(as - 1.2, 0, 1)).toFixed(2)})`; for (let i = 0; i < 6; i++) { const a = r() * TAU + t * p.spin, d = r() * sr * 0.8; ctx.beginPath(); ctx.ellipse(X + Math.cos(a) * d, Y + Math.sin(a) * d, sr * (0.25 + r() * 0.3), sr * (0.15 + r() * 0.2), a, 0, TAU); ctx.fill(); } }
  if (as > 2.2) { ctx.fillStyle = `rgba(70,170,80,${(0.5 * kis(as - 2.2, 0, 1)).toFixed(2)})`; for (let i = 0; i < 7; i++) { const a = r() * TAU + t * p.spin, d = r() * sr * 0.85; ctx.beginPath(); ctx.ellipse(X + Math.cos(a) * d, Y + Math.sin(a) * d, sr * (0.12 + r() * 0.18), sr * (0.08 + r() * 0.14), a * 2, 0, TAU); ctx.fill(); } }
  if (as > 3.2) { ctx.strokeStyle = `rgba(255,255,255,${(0.35 * kis(as - 3.2, 0, 1)).toFixed(2)})`; ctx.lineWidth = Math.max(1, sr * 0.06); for (let i = 0; i < 4; i++) { const yy = Y - sr + (i + 0.5) * sr * 0.5 + Math.sin(t * 0.3 + i) * sr * 0.05; ctx.beginPath(); ctx.moveTo(X - sr, yy); ctx.bezierCurveTo(X - sr * 0.3, yy - sr * 0.1, X + sr * 0.3, yy + sr * 0.1, X + sr, yy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,220,140,.8)'; for (let i = 0; i < 14; i++) { const a = r() * TAU, d = r() * sr * 0.9, px = X + Math.cos(a) * d, py = Y + Math.sin(a) * d; if ((px - X) * lx + (py - Y) * ly < -sr * 0.1) ctx.fillRect(px, py, Math.max(1, sr * 0.025), Math.max(1, sr * 0.025)); } }
  ctx.restore();
  if (as > 0.2) { const g = ctx.createRadialGradient(X, Y, sr * 0.95, X, Y, sr * 1.18); g.addColorStop(0, `rgba(140,200,255,${(0.45 * kis(as, 0, 1)).toFixed(2)})`); g.addColorStop(1, 'rgba(140,200,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, sr * 1.18, 0, TAU); ctx.fill(); }
  if (sr > 6) { ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#C8FFAA'; ctx.fillText('🏠 ' + KOL.ad, X, Y + sr + 30); }
}
/* ================= araştırma ağacı ================= */
const TEK = {
  t1: { e: '📡', d: 'tara', s: 1, f: 20, ad: ['Geniş sensör', 'Wide sensors'], ne: ['Tarama menzili +%15', 'Scan range +15%'] },
  t2: { e: '🛰', d: 'tara', s: 2, f: 50, ad: ['Derin tarama', 'Deep scan'], ne: ['Tarama menzili bir %15 daha', 'Another +15% scan range'] },
  t3: { e: '🔭', d: 'tara', s: 3, f: 120, ad: ['Kuantum tarama', 'Quantum scan'], ne: ['Keşif ödülleri +%15', 'Exploration rewards +15%'] },
  s1: { e: '⛽', d: 'surus', s: 1, f: 20, ad: ['Verimli warp', 'Efficient warp'], ne: ['Warp yakıt tüketimi −%10', 'Warp fuel use −10%'] },
  s2: { e: '🌀', d: 'surus', s: 2, f: 50, ad: ['Warp kararlılığı', 'Warp stability'], ne: ['Warp şarjı %25 hızlı', 'Warp charges 25% faster'] },
  s3: { e: '🪐', d: 'surus', s: 3, f: 120, ad: ['Sapan ustalığı', 'Slingshot mastery'], ne: ['Yerçekimi sapanı 1,5 kat güçlü', 'Gravity slingshots 1.5× stronger'] },
  d1: { e: '🛡', d: 'savunma', s: 1, f: 20, ad: ['Güçlendirilmiş zırh', 'Reinforced armour'], ne: ['Gövde +%10', 'Hull +10%'] },
  d2: { e: '🔧', d: 'savunma', s: 2, f: 50, ad: ['Hasar kontrolü', 'Damage control'], ne: ['Sistem hasarı şansı −%40, tamir 2 kat hızlı', 'System damage chance −40%, repairs twice as fast'] },
  d3: { e: '✨', d: 'savunma', s: 3, f: 120, ad: ['Kalkan rezonansı', 'Shield resonance'], ne: ['Alınan tüm hasar −%10', 'All damage taken −10%'] },
  c1: { e: '💼', d: 'ticaret', s: 1, f: 20, ad: ['Pazarlık', 'Haggling'], ne: ['Alış ve satışta %3 iyi fiyat', '3% better buying and selling prices'] },
  c2: { e: '📦', d: 'ticaret', s: 2, f: 50, ad: ['Lojistik', 'Logistics'], ne: ['Ambar +%15', 'Cargo hold +15%'] },
  c3: { e: '🚚', d: 'ticaret', s: 3, f: 120, ad: ['Kervan ağı', 'Convoy network'], ne: ['En çok 5 kervan, kazanç +%20', 'Up to 5 convoys, +20% earnings'] },
  u1: { e: '⚒', d: 'uretim', s: 1, f: 20, ad: ['Verimli üretim', 'Efficient crafting'], ne: ['Üretimin kredi maliyeti −%25', 'Crafting credit cost −25%'] },
  u2: { e: '♻', d: 'uretim', s: 2, f: 50, ad: ['Geri dönüşüm', 'Recycling'], ne: ['Hurda metal 2 kat', 'Double scrap metal'] },
  u3: { e: '⚙', d: 'uretim', s: 3, f: 120, ad: ['Usta zanaat', 'Master craft'], ne: ['Mk yükseltme malzemeleri −%30', 'Mk upgrade materials −30%'] },
};
const DAL = { tara: ['📡 Tarama', '📡 Scanning'], surus: ['🚀 Sürüş', '🚀 Propulsion'], savunma: ['🛡 Savunma', '🛡 Defence'], ticaret: ['💼 Ticaret', '💼 Trade'], uretim: ['⚒ Üretim', '⚒ Crafting'] };
const uretF = k => Math.round(k * (tek('u1') ? 0.75 : 1));
const tekAcik = k => { const T0 = TEK[k]; return T0.s === 1 || Object.keys(TEK).some(q => TEK[q].d === T0.d && TEK[q].s === T0.s - 1 && tek(q)); };
function bilimEkle(n) { if (!n) return; if (gOl('kesif')) n = Math.round(n * 1.5); ST.bilim = (ST.bilim || 0) + n; ST.bilimTop = (ST.bilimTop || 0) + n; const ucuz = Object.keys(TEK).filter(k => !tek(k) && tekAcik(k)).map(k => TEK[k].f).sort((a, b) => a - b)[0]; if (ucuz && ST.bilim >= ucuz && ST.bilim - n < ucuz) duyur('🔬 ' + T('Yeni bir araştırmaya yetecek bilim puanın var', 'You have enough science for a new research'), 'galaksi', T('I → Araştırma', 'I → Research')); }
function bilimYaz() {
  let h = `<div class="alt" style="margin:4px 0 0">${T('Bilim puanını keşiflerden (yeni sistem, gezegen, galaksi), arşiv eserlerinden, çözdüğün kalıntılardan ve yüzey inişlerinden kazanırsın. Her dalda önce alt seviyeyi açmalısın.', 'You earn science from discoveries (new systems, planets, galaxies), archive artefacts, solved ruins and surface landings. Unlock the lower tier of a branch first.')}</div><div style="margin:8px 0;font-size:18px;font-weight:900;color:#B48CFF">🔬 ${SAYI(Math.floor(ST.bilim || 0))} ${T('bilim puanı', 'science')}</div>`;
  for (const d in DAL) {
    h += `<div class="arsKol"><h3><span>${L(DAL[d])}</span><small>${Object.keys(TEK).filter(k => TEK[k].d === d && tek(k)).length}/3</small></h3>`;
    for (const k of Object.keys(TEK).filter(q => TEK[q].d === d)) { const T0 = TEK[k], var_ = tek(k), acik = tekAcik(k); h += `<div class="satir" style="${var_ ? 'border-color:rgba(155,224,122,.5)' : acik ? '' : 'opacity:.55'}"><div>${T0.e} <b>${L(T0.ad)}</b> <span class="lv">${'I'.repeat(T0.s)}</span><small>${L(T0.ne)}</small></div><div class="dg">${var_ ? `<button class="kb" type="button" disabled>✓ ${T('Açık', 'Done')}</button>` : `<button class="kb al" type="button" data-tek="${k}" ${!acik || (ST.bilim || 0) < T0.f ? 'disabled' : ''}>${acik ? '🔬 ' + T0.f : '🔒 ' + T0.f}</button>`}</div></div>`; }
    h += `</div>`;
  }
  return h;
}
/* ================= yerçekimi sapanı ================= */
function sapanAdim(dt) {
  sapanBoost = Math.max(0, sapanBoost - dt * 0.06 * (1 + sapanBoost));
  if (!oyunda || limanP || SH.warp > 0.2) { sapanHedef = null; return; }
  const v = Math.hypot(SH.vx, SH.vy), sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK); let en = null, ed = Infinity, er = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const tm = temel(sx + i, sy + j); if (tm && !YT[tm.yt].kd) { const d = Math.hypot(tm.x - SH.x, tm.y - SH.y), o = d / tm.yr; if (o < ed) { ed = o; en = { x: tm.x, y: tm.y, r: tm.yr, ad: tm.ad, yildiz: true }; er = d; } }
    if (Math.abs(i) + Math.abs(j) <= 1) { const s2 = sistem(sx + i, sy + j); if (s2) for (const q of s2.gez) { if (q.tip !== 'gaz' && q.tip !== 'buzdevi') continue; const [qx, qy] = gezPos(q, simT()), d = Math.hypot(qx - SH.x, qy - SH.y), o = d / q.r; if (o < ed) { ed = o; en = { x: qx, y: qy, r: q.r, ad: q.ad }; er = d; } } }
  }
  if (!en || ed > 3.2) { if (sapanHedef && sapanEn < 2.4 && sapanEn > 1.15 && sapanHedef.v > 450 && (!sapanSonT || performance.now() - sapanSonT > 8000)) { sapanSonT = performance.now(); sapanAt(sapanHedef); } sapanHedef = null; sapanEn = Infinity; return; }
  // hafif çekim
  if (ed > 1.45) { const dx = en.x - SH.x, dy = en.y - SH.y, cek = Math.min(260, 900 / (ed * ed)); SH.vx += dx / er * cek * dt; SH.vy += dy / er * cek * dt; }
  if (!sapanHedef || sapanHedef.ad !== en.ad) { sapanHedef = Object.assign({ v }, en); sapanEn = ed; } else { sapanEn = Math.min(sapanEn, ed); sapanHedef.v = Math.max(sapanHedef.v, v); sapanHedef.x = en.x; sapanHedef.y = en.y; }
}
function sapanAt(h) {
  const guc = kis((2.4 - sapanEn) / 1.2, 0.2, 1) * (tek('s3') ? 1.5 : 1) * (h.yildiz ? 1 : 0.8), ek = 0.35 + 0.55 * guc; sapanBoost = Math.min(1.4, sapanBoost + ek);
  const v = Math.hypot(SH.vx, SH.vy) || 1, hz = Math.min(5200, v * (1 + ek * 0.8)); SH.vx = SH.vx / v * hz; SH.vy = SH.vy / v * hz;
  ST.sapan = (ST.sapan || 0) + 1; SES.galaksi(); duyur('🪐 ' + T('Yerçekimi sapanı!', 'Gravity slingshot!'), 'galaksi', esc(h.ad) + ` · ${T('hız', 'speed')} +${Math.round(ek * 100)}%`); basarimKontrol();
}
function sapanCiz(t) {
  if (!sapanHedef || SH.warp > 0.2) return; const v = Math.hypot(SH.vx, SH.vy); if (v < 300) return; const [X, Y] = W2S(sapanHedef.x, sapanHedef.y), R = sapanHedef.r * cam.z;
  ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * 30; ctx.strokeStyle = `rgba(180,140,255,${sapanEn < 2.4 ? 0.55 : 0.25})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, R * 2.4, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  if (sapanEn < 2.4) { ctx.font = '900 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#D8C6FF'; ctx.fillText('🪐 ' + T('Sapan bölgesi: hızla geç!', 'Slingshot zone: keep your speed!'), X, Y - R * 2.4 - 8); }
}
/* ================= gaz devinden yakıt ================= */
function gazAdim(dt) {
  gazToplama = 0; if (!oyunda || limanP || kapsul || SH.warp > 0.1) return; const s2 = sistem(Math.floor(SH.x / SEK), Math.floor(SH.y / SEK)); if (!s2) return;
  for (const q of s2.gez) { if (q.tip !== 'gaz' && q.tip !== 'buzdevi') continue; const [qx, qy] = gezPos(q, simT()), d = Math.hypot(qx - SH.x, qy - SH.y), o = d / q.r, v = Math.hypot(SH.vx, SH.vy);
    if (o < 1.4 && o > 0.6) {
      if (v > 900) { if (performance.now() - (SH._gz || 0) > 5000) { SH._gz = performance.now(); duyur('⛽ ' + T('Atmosfere çok hızlı girdin: yavaşla', 'Too fast for the atmosphere: slow down'), 'uyari', T('Yakıt toplamak için 900 km/s altına in', 'Drop below 900 km/s to scoop fuel')); } return; }
      gazToplama = kis((1.4 - o) / 0.5, 0.2, 1);
      if (yakit < tank()) { const n = dt * 1.6 * gazToplama * (gOl('gunes') ? 2 : 1); yakit = Math.min(tank(), yakit + n); ST.gazY = (ST.gazY || 0) + n; if (!SH._gzb) { SH._gzb = 1; duyur('⛽ ' + T('Atmosferden yakıt toplanıyor', 'Scooping fuel from the atmosphere'), 'kesif', esc(q.ad) + ' · ' + T('daha derin = daha hızlı ama daha sıcak', 'deeper = faster but hotter')); } }
      if (o < 0.9) hasar(dt * 6 * (0.9 - o) / 0.3, true, true);
      basarimKontrol(); return;
    } }
  SH._gzb = 0;
}
/* ================= bölgesel hasar ve tamir ================= */
const MODAD = { motor: { e: '🔥', ad: ['Motor', 'Engine'] }, sensor: { e: '📡', ad: ['Sensör', 'Sensors'] }, warp: { e: '🌀', ad: ['Warp', 'Warp'] }, silah: { e: '🎯', ad: ['Silah', 'Weapons'] } };
function modulHasar(n) {
  if (Math.random() > Math.min(0.5, n / 40) * (tek('d2') ? 0.6 : 1)) return; const ks = Object.keys(MODUL), k = ks[(Math.random() * ks.length) | 0], once = MODUL[k]; MODUL[k] = Math.max(0, MODUL[k] - n * (1.2 + Math.random()));
  if (once >= 40 && MODUL[k] < 40) { duyur('⚠ ' + MODAD[k].e + ' ' + L(MODAD[k].ad) + T(' ağır hasar aldı!', ' badly damaged!'), 'uyari', { motor: T('Gemi yavaşladı', 'The ship slowed down'), sensor: T('Radar ve tarama zayıfladı', 'Radar and scanning weakened'), warp: T('Warp yapılamıyor', 'Warp unavailable'), silah: T('Taret yavaş ateş ediyor', 'The turret fires slowly') }[k]); SES.uyari(); }
  gpImza = '';
}
function modulAdim(dt) { const ml = ekipLv('muhendis'); if (!ml || KORS.length) return; for (const k in MODUL) if (MODUL[k] < 100) MODUL[k] = Math.min(100, MODUL[k] + dt * 0.25 * ml * (tek('d2') ? 2 : 1)); }
let TMR = null;
function tamirAc(k) { if (!MODUL[k] && MODUL[k] !== 0) return; TMR = { k, deneme: 3, poz: 0, yon: 1, hiz: 1.1, bolge: [0.38 + Math.random() * 0.24, 0.12], son: '' }; tamirYaz(); $('tamir').hidden = false; SES.tik(); requestAnimationFrame(tamirKare); }
function tamirYaz() { const k = TMR.k; $('tmBas').innerHTML = '🔧 ' + MODAD[k].e + ' ' + L(MODAD[k].ad) + ` · <span style="color:${MODUL[k] >= 70 ? '#9BE07A' : MODUL[k] >= 40 ? '#FFC857' : '#FF5C6E'}">${Math.round(MODUL[k])}%</span>`; $('tmYaz').textContent = T(`İbre yeşil bölgedeyken “Kaynak yap”a bas. Kalan deneme: ${TMR.deneme}`, `Press “Weld” while the needle is in the green zone. Attempts left: ${TMR.deneme}`) + (TMR.son ? ' · ' + TMR.son : ''); }
function tamirKare() {
  if (!TMR || $('tamir').hidden) return; const c = $('tmC'), w = c.clientWidth, h = c.clientHeight; if (c.width !== Math.round(w * DPR)) { c.width = Math.round(w * DPR); c.height = Math.round(h * DPR); }
  const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); TMR.poz += TMR.yon * 0.016 * TMR.hiz; if (TMR.poz > 1) { TMR.poz = 1; TMR.yon = -1; } if (TMR.poz < 0) { TMR.poz = 0; TMR.yon = 1; }
  x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(10, h / 2 - 12, w - 20, 24);
  const [b0, bw] = TMR.bolge, bx = 10 + (w - 20) * b0, bww = (w - 20) * bw * (tek('d2') ? 1.5 : 1); const gg = x.createLinearGradient(bx, 0, bx + bww, 0); gg.addColorStop(0, 'rgba(155,224,122,.35)'); gg.addColorStop(0.5, 'rgba(155,224,122,.9)'); gg.addColorStop(1, 'rgba(155,224,122,.35)'); x.fillStyle = gg; x.fillRect(bx, h / 2 - 12, bww, 24);
  for (let i = 0; i <= 20; i++) { x.fillStyle = 'rgba(200,215,255,.3)'; x.fillRect(10 + (w - 20) * i / 20, h / 2 + 14, 1, i % 5 ? 4 : 8); }
  const nx = 10 + (w - 20) * TMR.poz; x.fillStyle = '#FFC857'; x.shadowColor = '#FFC857'; x.shadowBlur = 10; x.fillRect(nx - 2, h / 2 - 20, 4, 40); x.shadowBlur = 0;
  requestAnimationFrame(tamirKare);
}
function tamirVur() {
  if (!TMR || TMR.deneme <= 0) return; const [b0, bw0] = TMR.bolge, bw = bw0 * (tek('d2') ? 1.5 : 1), ok = TMR.poz >= b0 && TMR.poz <= b0 + bw, k = TMR.k; TMR.deneme--;
  if (ok) { const merkez = 1 - Math.abs(TMR.poz - (b0 + bw / 2)) / (bw / 2), art = Math.round(20 + merkez * 20); MODUL[k] = Math.min(100, MODUL[k] + art); TMR.son = '✓ +' + art + '%'; SES.koloni(); patlamaEkle(SH.x, SH.y, 20, '255,220,140'); ST.tamir = (ST.tamir || 0) + 1; } else { TMR.son = T('✗ ıskaladın', '✗ missed'); SES.vur(); }
  TMR.hiz += 0.25; TMR.bolge = [0.15 + Math.random() * 0.6, Math.max(0.07, TMR.bolge[1] - 0.015)];
  if (TMR.deneme <= 0 || MODUL[k] >= 100) { TMR.son += ' · ' + T('tamir bitti', 'repair done'); setTimeout(() => { $('tamir').hidden = true; gpImza = ''; basarimKontrol(); kaydet(); }, 900); }
  tamirYaz();
}
$('tmVur').onclick = tamirVur;
$('tmKapat').onclick = () => { $('tamir').hidden = true; gpImza = ''; };
addEventListener('keydown', e => { if (!$('tamir').hidden && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); e.stopPropagation(); tamirVur(); } }, true);
/* ================= arşiv kataloğu ================= */
const ARS = {
  kask: ['🪖', 1, ['Paslı astronot kaskı', 'Rusty astronaut helmet'], ['İlk derin uzay seferlerinden kalma. Vizörünün içinde hâlâ bir çocuk resmi yapışık duruyor.', 'From the first deep-space voyages. A child’s drawing is still stuck inside the visor.']],
  plak: ['💿', 2, ['Altın plak', 'Golden record'], ['Yıldızlara gönderilmiş seslerle dolu bir plak: yağmur, kahkaha, selamlar. Hiçbir uzaylı çalmayı başaramamış.', 'A record full of sounds sent to the stars: rain, laughter, greetings. No alien ever managed to play it.']],
  sonda: ['📡', 1, ['Eski sonda anteni', 'Old probe antenna'], ['Yüzyıllar önce fırlatılmış bir sondanın anteni. Hâlâ zayıf bir sinyal yayıyor.', 'The antenna of a probe launched centuries ago. It still sends a faint signal.']],
  rozet: ['🎖', 1, ['Görev rozeti', 'Mission patch'], ['“Önce merak, sonra cesaret” yazıyor. Hangi ekibe ait olduğu bilinmiyor.', '“Curiosity first, then courage”, it reads. Nobody knows which crew it belonged to.']],
  kupa: ['☕', 1, ['Sıfır yerçekimi kupası', 'Zero-g mug'], ['Kapaklı, emzikli, biraz ezik. Birinin en sevdiği kupasıymış belli.', 'Lidded, spouted, a little dented. Clearly someone’s favourite mug.']],
  harita: ['🗺', 3, ['İlk koloni haritası', 'First colony map'], ['Yeni Umut’un kurulmadan önceki taslak planı. Köşesinde el yazısıyla “burası güzel olacak” notu var.', 'The draft plan of New Hope before it was built. A handwritten note in the corner: “this will be lovely”.']],
  k1: ['📼', 1, ['Kara kutu: Mavi Serçe', 'Black box: Blue Sparrow'], ['“Gün 212. Yakıt bitti, akıntıya kapıldık. Bu kaydı bulan, ailelerimize sevgimizi iletsin.”', '“Day 212. Out of fuel, drifting. Whoever finds this, pass our love to our families.”']],
  k2: ['📼', 1, ['Kara kutu: Demir Kartal', 'Black box: Iron Eagle'], ['“Korsanlar üç yönden geldi. Kalkan %4… Kargo bölmesini açıyorum, belki yükü alıp bizi bırakırlar.”', '“Pirates from three sides. Shields at 4%… Opening the cargo bay, maybe they’ll take the load and let us go.”']],
  k3: ['📼', 2, ['Kara kutu: Sessiz Gezgin', 'Black box: Silent Wanderer'], ['“Bu galakside yıldızlar teker teker sönüyor. Sanki biri onları kapatıyor.”', '“Stars in this galaxy are going out one by one. As if someone is switching them off.”']],
  k4: ['📼', 2, ['Kara kutu: Altın Pusula', 'Black box: Golden Compass'], ['“Vel’lerle ilk temas: bizi kristal sesleriyle selamladılar. Hayatımda duyduğum en güzel şeydi.”', '“First contact with the Vel: they greeted us with crystal voices. The most beautiful thing I have ever heard.”']],
  k5: ['📼', 2, ['Kara kutu: Gece Kuşu', 'Black box: Nightjar'], ['“Kapı açıldı ama karşı tarafta bir şey bizi bekliyordu. Geri dönüyoruz. Dönebilirsek.”', '“The gate opened, but something was waiting on the other side. We are turning back. If we can.”']],
  k6: ['📼', 3, ['Kara kutu: Umut-3', 'Black box: Hope-3'], ['“Umut-7’den önce Umut-3 vardı. Kimse bizi hatırlamayacak ama yolu biz açtık.”', '“Before Hope-7 there was Hope-3. No one will remember us, but we opened the way.”']],
  vel1: ['💎', 2, ['Vel ses kristali', 'Vel song crystal'], ['Dokununca kısa bir melodi çalıyor. Vel’ler bunlarla şiir yazar.', 'It plays a short melody when touched. The Vel write poems with these.']],
  vel2: ['🔮', 3, ['Vel yıldız küresi', 'Vel star orb'], ['İçinde minik bir galaksi dönüyor. Hangi galaksi olduğunu kimse bilmiyor.', 'A tiny galaxy spins inside. Nobody knows which one.']],
  krai1: ['🏺', 2, ['Krai reçine mührü', 'Krai resin seal'], ['Krai tüccarlarının sözleşme mührü. Kokusu hâlâ taze.', 'A Krai merchant’s contract seal. It still smells fresh.']],
  krai2: ['🪶', 3, ['Krai tüy yazıtı', 'Krai feather script'], ['Tüylere işlenmiş bir şarkı. Krai’lere göre her tüy bir anı taşır.', 'A song woven into feathers. The Krai say each feather carries a memory.']],
  oru1: ['🐚', 2, ['Oru inci kabuğu', 'Oru pearl shell'], ['Kulağına tutunca uzak bir okyanus gezegeninin sesi geliyor.', 'Hold it to your ear and you hear a distant ocean world.']],
  oru2: ['🌊', 3, ['Oru dalga taşı', 'Oru wave stone'], ['Yüzeyi kendiliğinden dalgalanan bir taş. Oru çocuklarının oyuncağı.', 'A stone whose surface ripples by itself. A toy of Oru children.']],
  cip: ['🔲', 2, ['Gölge çipi', 'Shadow chip'], ['Gölge dronlarından birinin beyni. Artık sessiz, ama hâlâ soğuk.', 'The brain of a shadow drone. Silent now, but still cold.']],
  kiymik: ['✴', 2, ['Işık kıymığı', 'Shard of light'], ['Avucunda sıcacık parlıyor. Işık Mızrağı’nın küçük bir kardeşi gibi.', 'It glows warm in your palm. Like a little sibling of the Spear of Light.']],
  pusula: ['🧭', 3, ['Kuantum pusula', 'Quantum compass'], ['İbresi kuzeyi değil, en yakın merakı gösteriyor.', 'Its needle points not north, but to the nearest curiosity.']],
  levha: ['📜', 2, ['Yıldız haritası levhası', 'Star chart tablet'], ['Bugün var olmayan yıldızların haritası. Ya çok eski, ya da gelecekten.', 'A chart of stars that do not exist today. Either very old, or from the future.']],
  zaman: ['⏳', 3, ['Zaman kristali', 'Time crystal'], ['İçindeki kum yukarı doğru akıyor.', 'The sand inside flows upwards.']],
  bosluk: ['⚙', 2, ['Boşluk motoru dişlisi', 'Void engine gear'], ['Hiçbir şeye bağlı olmadan kendi kendine dönüyor.', 'It turns on its own, attached to nothing.']],
  buz: ['🧊', 1, ['Donmuş kuyruklu yıldız buzu', 'Frozen comet ice'], ['Milyarlarca yıllık su. Erimesin diye özel bir kapta.', 'Water billions of years old, kept in a special flask so it never melts.']],
  cam: ['🪟', 2, ['Süpernova camı', 'Supernova glass'], ['Bir yıldızın son anında eriyip donmuş kum. İçinden bakınca her şey turuncu.', 'Sand melted and frozen in a star’s last moment. Everything looks orange through it.']],
  toz: ['✨', 2, ['Yıldız tozu şişesi', 'Bottle of stardust'], ['Sallayınca parıldıyor. Belki de sen de bundan yapıldın.', 'It sparkles when shaken. Maybe you are made of this too.']],
  tas: ['🌑', 3, ['Kara delik taşı', 'Black hole stone'], ['Işığı yutan ağır, simsiyah bir taş. Elinde tutarken zaman biraz yavaşlıyor gibi.', 'A heavy, pitch-black stone that swallows light. Time seems to slow while you hold it.']],
  kum: ['🌀', 2, ['Solucan deliği kumu', 'Wormhole sand'], ['Kum taneleri bazen kaybolup kabın öbür ucunda beliriyor.', 'Grains sometimes vanish and reappear at the other end of the jar.']],
  inci: ['🫧', 3, ['Kozmik inci', 'Cosmic pearl'], ['Bir bulutsunun içinde binlerce yılda büyümüş. Gökkuşağı gibi parlıyor.', 'Grown over millennia inside a nebula. It shimmers like a rainbow.']],
};
const ARS_KOL = {
  eski: { e: '🌍', ad: ['Eski Dünya kalıntıları', 'Old Earth relics'], bonus: ['Keşif ödülleri +%10', 'Exploration rewards +10%'], ip: ['Süzülen eski uydu ve boş kapsüllerden', 'From drifting old satellites and empty pods'] },
  kara: { e: '📼', ad: ['Kara kutular', 'Black boxes'], bonus: ['Tek seferlik 15.000 kredi', 'One-off 15,000 credits'], ip: ['Uzayda yanıp sönen kara kutulardan', 'From blinking black boxes in space'] },
  uzayli: { e: '👽', ad: ['Uzaylı eserleri', 'Alien artefacts'], bonus: ['Uzaylı kolonilerinde alışlar %5 ucuz', 'Buying at alien colonies 5% cheaper'], ip: ['Uzaylı galaksilerinde süzülen eserlerden', 'From artefacts drifting in alien galaxies'] },
  kadim: { e: '🏛', ad: ['Kadim teknoloji', 'Ancient technology'], bonus: ['Hurda toplama menzili +%60', 'Salvage pickup range +60%'], ip: ['Antik kalıntılardan ve gizli zulalardan', 'From ancient ruins and hidden caches'] },
  tuhaf: { e: '🌌', ad: ['Uzay tuhaflıkları', 'Cosmic oddities'], bonus: ['Gövde dayanıklılığı +%10', 'Hull strength +10%'], ip: ['Süpernova bulutları, solucan delikleri, zulalar ve nadir hurdalardan', 'From supernova clouds, wormholes, caches and rare salvage'] },
};
const NADIRLIK = new Proxy([], { get: (o, i) => L([['', ''], ['yaygın', 'common'], ['nadir', 'rare'], ['efsanevi', 'legendary']][+i] || ['', '']) });
function arsivBul(kol, neden, irk) {
  let L2 = ARS_ID[kol].slice(); if (kol === 'uzayli' && irk) L2 = L2.filter(i => i.startsWith(irk)); if (kol === 'tuhaf' && neden === 'snb') L2 = ['cam', 'toz']; if (kol === 'tuhaf' && neden === 'solucan') L2 = ['kum']; if (kol === 'tuhaf' && neden === 'zula') L2 = ['tas']; if (kol === 'tuhaf' && neden === 'hurda') L2 = ['buz', 'inci'];
  if (!L2.length) return null;
  const yeni = L2.filter(i => !ARSIV.has(i)), agir = arr => { const w = arr.map(i => 4 - ARS[i][1]), top = w.reduce((a, b) => a + b, 0); let r = Math.random() * top; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[0]; };
  if (kol === 'kara') { const i = ARS_ID.kara.find(x => !ARSIV.has(x)); if (i) return arsivEkle(i, kol); }
  if (yeni.length && Math.random() < 0.85) return arsivEkle(agir(yeni), kol);
  const i = agir(L2); if (!ARSIV.has(i)) return arsivEkle(i, kol);
  const od = 150 * ARS[i][1]; kazan(od, 'kesif'); duyur(ARS[i][0] + ' ' + T('Kopya eser satıldı', 'Duplicate artefact sold'), 'kesif', L(ARS[i][2]) + ` · +${SAYI(od)} 💰`); return i;
}
function arsivEkle(i, kol) {
  const tamOnce = arsivTam(kol); ARSIV.add(i); const A = ARS[i]; bilimEkle(A[1] * 6); if (YANZ[i]) setTimeout(() => yanBasla(i), 2500);
  defter('🗃 Arşive yeni eser: ' + A[2][0] + '.', '🗃 New archive item: ' + A[2][1] + '.');
  setTimeout(() => { duyur(A[0] + ' ' + T('Arşive eklendi: ', 'Added to archive: ') + '<b>' + L(A[2]) + '</b>', 'galaksi', NADIRLIK[A[1]] + ' · ' + L(ARS_KOL[kol].ad) + ` ${ARS_ID[kol].filter(x => ARSIV.has(x)).length}/6 · ` + T('I ile bak', 'press I to view')); SES.galaksi(); }, 300);
  if (!tamOnce && arsivTam(kol)) { if (kol === 'kara') kazan(15000, 'kesif'); if (kol === 'tuhaf') can = Math.min(maxCan(), can + 20); defter('🏛 ' + ARS_KOL[kol].ad[0] + ' koleksiyonunu tamamladım!', '🏛 Completed the ' + ARS_KOL[kol].ad[1] + ' collection!'); setTimeout(() => { duyur('🏛 ' + T('Koleksiyon tamamlandı: ', 'Collection complete: ') + '<b>' + L(ARS_KOL[kol].ad) + '</b>', 'galaksi', '🎁 ' + L(ARS_KOL[kol].bonus)); SES.galaksi(); }, 1600); }
  basarimKontrol(); kaydet(); return i;
}
/* ================= uzay hurdaları ================= */
const HURDA = []; let hurdaT = 8, hurdaId = 0;
const HURT = {
  metal: { e: '🔩', ad: ['Hurda metal', 'Scrap metal'], w: 40 }, konteyner: { e: '📦', ad: ['Kayıp konteyner', 'Lost container'], w: 20 },
  kutu: { e: '📼', ad: ['Kara kutu', 'Black box'], w: 7, ars: 'kara' }, uydu: { e: '🛰', ad: ['Eski uydu', 'Old satellite'], w: 9, ars: 'eski' }, kapsul: { e: '🥚', ad: ['Boş kaçış kapsülü', 'Empty escape pod'], w: 6, ars: 'eski' },
  eser: { e: '🔮', ad: ['Uzaylı eseri', 'Alien artefact'], w: 0, ars: 'uzayli' }, garip: { e: '❔', ad: ['Tuhaf nesne', 'Strange object'], w: 3, ars: 'tuhaf' },
};
function hurdaCikar(x, y, tip, yuk) {
  const a = Math.random() * TAU, G = galaksi(...galHucre(x, y)), irk = G.irk && G.irk !== 'insan' ? G.irk : null;
  if (!tip) { const L2 = Object.keys(HURT).map(k => [k, k === 'eser' ? (irk ? 14 : 0) : k === 'kutu' && arsivTam('kara') ? 2 : HURT[k].w]); let r = Math.random() * L2.reduce((s2, q) => s2 + q[1], 0); tip = L2.find(q => (r -= q[1]) <= 0)[0]; }
  if (tip === 'konteyner' && !yuk) { const ml = Object.keys(MAL).filter(m => !OZEL.includes(m)), m = ml[(Math.random() * ml.length) | 0]; yuk = { [m]: 2 + ((Math.random() * 4) | 0) }; }
  HURDA.push({ id: ++hurdaId, x, y, vx: Math.cos(a) * (8 + Math.random() * 20), vy: Math.sin(a) * (8 + Math.random() * 20), a: Math.random() * TAU, w: (Math.random() - 0.5) * 1.2, tip, yuk, irk, t0: performance.now() });
}
function hurdaAdim(dt) {
  if (!oyunda || limanP) return; const v = Math.hypot(SH.vx, SH.vy), Gm = mezar(galaksi(...galHucre(SH.x, SH.y))), mezarda = Math.hypot(Gm.x - SH.x, Gm.y - SH.y) < 6000;
  hurdaT -= dt * (mezarda ? 4 : 1) * (v > 150 ? 1.4 : 1) * (gOl('meteor') ? 2.5 : 1);
  if (hurdaT <= 0 && HURDA.length < (mezarda ? 10 : 6) && SH.warp < 0.2) { hurdaT = 22 + Math.random() * 20; const a = (v > 80 ? Math.atan2(SH.vy, SH.vx) : Math.random() * TAU) + (Math.random() - 0.5) * 1.8, d = 1400 + Math.random() * 2400; hurdaCikar(SH.x + Math.cos(a) * d, SH.y + Math.sin(a) * d); }
  const ry = 75 * (arsivTam('kadim') ? 1.6 : 1), cek = takili('cekici') ? 950 * (1 + 0.3 * (tlv('cekici') - 1)) * (arsivTam('kadim') ? 1.3 : 1) : 0;
  for (let i = HURDA.length - 1; i >= 0; i--) {
    const q = HURDA[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.a += q.w * dt; const dx = SH.x - q.x, dy = SH.y - q.y, d = Math.hypot(dx, dy);
    if (d > 11000) { HURDA.splice(i, 1); continue; }
    if (kapsul || bankaAcik || borsaAcik || istAcik || inisAcik) continue;
    if (cek && d < cek && d > ry) { q.vx += dx / d * 420 * dt; q.vy += dy / d * 420 * dt; }
    if (q.bek > 0) { q.bek -= dt; continue; }
    if (d < ry + 18) hurdaTopla(q, i);
  }
}
function hurdaTopla(q, i) {
  const H2 = HURT[q.tip], yer = kapasite() - kargoDolu();
  if (q.tip === 'metal' || q.tip === 'konteyner') {
    const yuk = q.tip === 'metal' ? { metal: (1 + ((Math.random() * 3) | 0)) * (tek('u2') ? 2 : 1), ...(Math.random() < 0.3 ? { cevher: 1 } : {}) } : q.yuk;
    if (yer < 1) { if (!q.uy || performance.now() - q.uy > 6000) { q.uy = performance.now(); duyur('📦 ' + T('Ambar dolu: hurda alınamadı', 'Hold full: salvage left behind'), 'uyari', T('I ile ambarını aç, gereksizi uzaya at', 'Open your hold with I and jettison what you don’t need')); } q.vx = -q.vx; q.vy = -q.vy; return; }
    let kal = yer; const yz = []; for (const m in yuk) { const n = Math.min(kal, yuk[m]); if (n > 0) { KARGO[m] = (KARGO[m] || 0) + n; kal -= n; yz.push(`${MAL[m].e} +${n}`); yuk[m] -= n; } if (!yuk[m]) delete yuk[m]; }
    if (q.tip === 'konteyner' && Object.keys(yuk).length) { q.yuk = yuk; duyur(H2.e + ' ' + L(H2.ad), 'kesif', yz.join(' · ') + ' · ' + T('ambar doldu', 'hold full')); SES.tik(); return; }
    HURDA.splice(i, 1); ST.hurda = (ST.hurda || 0) + 1; duyur(H2.e + ' ' + L(H2.ad), 'kesif', yz.join(' · ')); SES.tik(); basarimKontrol(); return;
  }
  HURDA.splice(i, 1); ST.hurda = (ST.hurda || 0) + 1; const od = 60 + ((Math.random() * 140) | 0); kazan(od, 'kesif');
  if (q.tip === 'uydu' && yer > 0) { KARGO.elek = (KARGO.elek || 0) + 1; }
  if (!arsivBul(H2.ars, 'hurda', q.irk)) duyur(H2.e + ' ' + L(H2.ad), 'kesif', `+${SAYI(od)} 💰`);
  patlamaEkle(q.x, q.y, 24, '255,230,160'); basarimKontrol(); kaydet();
}
function hurdaCiz(t) {
  for (const q of HURDA) {
    const [X, Y] = W2S(q.x, q.y); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue; const sk = Math.max(0.55, cam.z), la = GISIK.a;
    ctx.save(); ctx.translate(X, Y); ctx.rotate(q.a); ctx.scale(sk, sk);
    if (q.tip === 'metal') { ctx.fillStyle = '#7C828E'; ctx.strokeStyle = '#2A2E36'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(9, -2); ctx.lineTo(3, -7); ctx.lineTo(-6, -5); ctx.lineTo(-9, 2); ctx.lineTo(-2, 7); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(4, 3); ctx.stroke(); }
    else if (q.tip === 'konteyner') { ctx.fillStyle = '#C26A2A'; ctx.strokeStyle = '#3A1E0A'; ctx.lineWidth = 1; ctx.fillRect(-11, -7, 22, 14); ctx.strokeRect(-11, -7, 22, 14); ctx.strokeStyle = 'rgba(0,0,0,.35)'; for (let k = -7; k <= 7; k += 3.5) { ctx.beginPath(); ctx.moveTo(k, -7); ctx.lineTo(k, 7); ctx.stroke(); } ctx.fillStyle = '#FFE3A6'; ctx.fillRect(-11, -1, 22, 2); }
    else if (q.tip === 'kutu') { ctx.fillStyle = '#E8741E'; ctx.strokeStyle = '#2A1206'; ctx.lineWidth = 1; ctx.fillRect(-6, -4.5, 12, 9); ctx.strokeRect(-6, -4.5, 12, 9); ctx.fillStyle = '#1A1A1A'; ctx.fillRect(-6, -1, 12, 2); if (Math.sin(t * 5 + q.id) > 0.6) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -6, 0, 0, -6, 12); g.addColorStop(0, 'rgba(255,80,60,.9)'); g.addColorStop(1, 'rgba(255,80,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -6, 12, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; } }
    else if (q.tip === 'uydu') { ctx.fillStyle = '#2A4A8A'; ctx.strokeStyle = '#8AA8E0'; ctx.lineWidth = 0.6; for (const sx of [-1, 1]) { ctx.fillRect(sx * 6 - (sx < 0 ? 12 : 0), -3.5, 12, 7); ctx.strokeRect(sx * 6 - (sx < 0 ? 12 : 0), -3.5, 12, 7); } ctx.fillStyle = '#C8CED8'; ctx.fillRect(-5, -5, 10, 10); ctx.strokeStyle = '#C8CED8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, -11); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -12, 2, 0, TAU); ctx.stroke(); }
    else if (q.tip === 'kapsul') { const sp = gemiSprite('kapsul', 5, 'hurda'); ctx.drawImage(sp.c, sp.x0, sp.y0, sp.c.width / SS, sp.c.height / SS); }
    else { const renk = q.tip === 'eser' ? (q.irk === 'vel' ? '127,227,255' : q.irk === 'krai' ? '255,180,90' : '150,255,200') : '220,180,255'; ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 18); g.addColorStop(0, `rgba(${renk},.6)`); g.addColorStop(1, `rgba(${renk},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgb(${renk})`; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 0); ctx.lineTo(0, 8); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.7; ctx.stroke(); }
    // ışık
    if (q.tip !== 'eser' && q.tip !== 'garip') { ctx.rotate(-q.a); ctx.globalCompositeOperation = 'lighter'; const lx = Math.cos(la) * 10, ly = Math.sin(la) * 10, g = ctx.createLinearGradient(lx, ly, -lx, -ly); g.addColorStop(0, `rgba(${GISIK.c},${(0.3 * GISIK.k).toFixed(2)})`); g.addColorStop(0.5, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
    const d = Math.hypot(q.x - SH.x, q.y - SH.y); if (d < 1400) { ctx.font = '800 10.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = HURT[q.tip].ars ? 'rgba(255,227,166,.9)' : 'rgba(210,220,240,.75)'; ctx.fillText(HURT[q.tip].e + ' ' + L(HURT[q.tip].ad), X, Y - 16 * sk); }
  }
}
