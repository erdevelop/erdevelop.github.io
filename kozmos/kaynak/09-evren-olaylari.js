/* ================= pilot kartı ================= */
function profilCiz() {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 630; const x = c.getContext('2d'), r = rng(h32(gemiRenk, 4, 77));
  let g = x.createLinearGradient(0, 0, 1200, 630); g.addColorStop(0, '#070B1E'); g.addColorStop(1, '#141A3A'); x.fillStyle = g; x.fillRect(0, 0, 1200, 630);
  for (const [cx, cy, rr, cc] of [[900, 200, 420, '120,80,255'], [250, 520, 380, '40,180,255'], [1050, 560, 300, '255,120,180']]) { g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(${cc},.22)`); g.addColorStop(1, `rgba(${cc},0)`); x.fillStyle = g; x.fillRect(0, 0, 1200, 630); }
  for (let i = 0; i < 380; i++) { x.fillStyle = `rgba(255,255,255,${(0.2 + r() * 0.7).toFixed(2)})`; const sz = r() < 0.05 ? 2.4 : 1.2; x.fillRect(r() * 1200, r() * 630, sz, sz); }
  // gemi
  const tip = kapsul ? 'kapsul' : gemiTip, sp = gemiSprite(tip, gemiRenk, 'oyuncu'); x.save(); x.translate(860, 330); x.rotate(-0.45); const sc = 7;
  x.globalCompositeOperation = 'lighter'; for (const [ex, ey] of (MOTOR[tip] || MOTOR.kasif)) { const gx = x.createLinearGradient((ex - 2) * sc, 0, (ex - 26) * sc, 0); gx.addColorStop(0, 'rgba(160,235,255,.9)'); gx.addColorStop(1, 'rgba(120,200,255,0)'); x.fillStyle = gx; x.beginPath(); x.moveTo((ex - 1.8) * sc, (ey - 2.6) * sc); x.quadraticCurveTo((ex - 14) * sc, (ey - 3.2) * sc, (ex - 28) * sc, ey * sc); x.quadraticCurveTo((ex - 14) * sc, (ey + 3.2) * sc, (ex - 1.8) * sc, (ey + 2.6) * sc); x.fill(); } x.globalCompositeOperation = 'source-over';
  x.drawImage(sp.c, sp.x0 * sc, sp.y0 * sc, sp.c.width / SS * sc, sp.c.height / SS * sc); x.restore();
  // yazılar
  const yaz = (s2, X, Y, f, renk, hz) => { x.font = `${f} ${hz}px Nunito, system-ui, sans-serif`; x.fillStyle = renk; x.fillText(s2, X, Y); };
  x.textAlign = 'left'; yaz('KOZMOS · ' + T('PİLOT KARTI', 'PILOT CARD'), 64, 78, 900, '#7FE3FF', 22);
  yaz(pilotAd(), 64, 150, 900, '#FFFFFF', 64);
  const unvan = KOZM.sec.unvan && UNVAN[KOZM.sec.unvan] ? L(UNVAN[KOZM.sec.unvan]) : HIK.son4 ? L(SON4[HIK.son4].u) : HIK.a >= 15 ? T('Galaksilerin Koruyucusu', 'Guardian of the Galaxies') : ARSIV.size >= 30 ? T('Evrenin Hafızası', 'Memory of the Universe') : TEKNO.size >= 15 ? T('Teknoloji Ustası', 'Tech Master') : sayK('g') >= 5 ? T('Galaksi Gezgini', 'Galaxy Wanderer') : sayK('s') >= 50 ? T('Deneyimli Kâşif', 'Seasoned Explorer') : T('Genç Kâşif', 'Young Explorer');
  yaz('★ ' + unvan, 64, 196, 800, '#FFC857', 26); yaz((kapsul ? T('Kaçış kapsülü', 'Escape pod') : L(GEMI[gemiTip].ad)) + (gemiAd ? ' · “' + gemiAd + '”' : ''), 64, 232, 700, '#B7C3E0', 22);
  const bas = BASARIM.filter(b => BAS.has(b[0])).length, L2 = [['🔭', T('Keşfedilen sistem', 'Systems discovered'), SAYI(sayK('s'))], ['🌌', T('Galaksi', 'Galaxies'), SAYI(sayK('g'))], ['💰', T('Toplam kazanç', 'Total earned'), SAYI(Math.round(ST.kazanc))], ['☠', T('Yenilen korsan', 'Pirates defeated'), SAYI(ST.korsan || 0)], ['🏅', T('Başarım', 'Achievements'), bas + '/' + BASARIM.length], ['🗃', T('Arşiv', 'Archive'), ARSIV.size + '/30'], ['🔬', T('Araştırma', 'Research'), TEKNO.size + '/15'], ['📅', T('Yolculuk günü', 'Voyage day'), String(gunNo())]];
  L2.forEach(([e, ad, v], i) => { const cx = 64 + (i % 2) * 300, cy = 300 + Math.floor(i / 2) * 70; x.fillStyle = 'rgba(255,255,255,.06)'; x.beginPath(); x.roundRect ? x.roundRect(cx, cy, 280, 58, 14) : x.rect(cx, cy, 280, 58); x.fill(); x.font = '28px system-ui, sans-serif'; x.fillText(e, cx + 14, cy + 40); yaz(ad, cx + 58, cy + 24, 800, '#97A5CA', 15); yaz(v, cx + 58, cy + 48, 900, '#FFFFFF', 22); });
  const B = typeof benLonca === 'function' && benLonca(); x.textAlign = 'right'; if (B) yaz('🏰 ' + B.ad, 1136, 560, 900, '#9BE07A', 22); yaz('erdevelop.com/kozmos', 1136, 596, 800, 'rgba(183,195,224,.7)', 18); x.textAlign = 'left'; yaz(new Date().toLocaleDateString(EN() ? 'en-GB' : 'tr-TR'), 64, 596, 800, 'rgba(183,195,224,.6)', 16);
  return c;
}
let prCanvas = null;
$('profBtn').onclick = () => { $('menu').hidden = true; prCanvas = profilCiz(); $('prImg').src = prCanvas.toDataURL('image/png'); $('profil').hidden = false; ST.profil = 1; basarimKontrol(); SES.tik(); $('prPaylas').hidden = !(navigator.share && navigator.canShare); };
$('prKapat').onclick = () => { $('profil').hidden = true; };
$('prIndir').onclick = () => { const a = document.createElement('a'); a.download = 'kozmos-pilot.png'; a.href = $('prImg').src; document.body.appendChild(a); a.click(); a.remove(); };
$('prPaylas').onclick = () => { if (!prCanvas) return; prCanvas.toBlob(b => { try { const f = new File([b], 'kozmos-pilot.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: 'Kozmos', text: T('Kozmos pilot kartım', 'My Kozmos pilot card') }).catch(() => { }); } catch (e) { } }, 'image/png'); };
/* ================= uzay radyosu ================= */
const KANALLAR = { oto: ['🌌 Bölge müziği', '🌌 Region music'], fm: ['📻 Kozmos FM', '📻 Kozmos FM'], derin: ['🌑 Derin Uzay', '🌑 Deep Space'], pop: ['🎶 Koloni Pop', '🎶 Colony Pop'], korsan: ['☠ Korsan Frekansı', '☠ Pirate Frequency'] };
let spiker = ls.get('kozmos-spiker', false) === true, radyoT = 90;
function radyoYaz() { const k = SES.kanal(); $('radList').innerHTML = `<div class="dg" style="flex-wrap:wrap;margin:6px 0">${Object.keys(KANALLAR).map(c => `<button class="kb ${c === k ? 'al' : ''}" type="button" data-kanal="${c}">${L(KANALLAR[c])}</button>`).join('')}</div><div class="alt" style="font-size:12px">${T('Haberler birkaç dakikada bir ekranda çıkar.', 'News bulletins appear every few minutes.')}</div>`; $('spikSec').checked = spiker; }
$('radList').addEventListener('click', e => { const b = e.target.closest('[data-kanal]'); if (!b) return; SES.baslat(); SES.kanal(b.dataset.kanal); if (!SES.muzik()) { SES.muzik(true); if (typeof muzYaz === 'function') muzYaz(); } ST.radyo = 1; basarimKontrol(); radyoYaz(); duyur('📻 ' + L(KANALLAR[b.dataset.kanal]), 'kesif'); radyoT = 6; });
$('spikSec').addEventListener('change', e => { spiker = e.target.checked; ls.set('kozmos-spiker', spiker); if (!spiker && window.speechSynthesis) speechSynthesis.cancel(); });
function haberUret() { const L2 = haberListe(); return L2[(Math.random() * L2.length) | 0]; }
function haberListe() {
  const L2 = [], tk = TAKVIM[gunOlay()];
  L2.push(T(`Günün olayı: ${tk.ad[0]}. ${tk.ne[0]}.`, `Event of the day: ${tk.ad[1]}. ${tk.ne[1]}.`));
  const po = piyasaOlay(Math.floor(Math.floor(SH.x / SEK) / 8), Math.floor(Math.floor(SH.y / SEK) / 8)); for (const o of po) L2.push(T(`Piyasa: ${kolAd(o.p)} kolonisinde ${o.kit ? 'kıtlık' : 'bolluk'} var, ${MAL[o.m].ad[0].toLocaleLowerCase('tr')} ${o.kit ? 'pahalı' : 'ucuz'}.`, `Markets: ${o.kit ? 'a shortage' : 'a glut'} of ${MAL[o.m].ad[1].toLowerCase()} at ${kolAd(o.p)}.`));
  if (!KOLOS.yenildi && KOLOS.max) L2.push(T(`Kolos hâlâ ayakta: canı yüzde ${Math.round(KOLOS.can / KOLOS.max * 100)}. Bütün pilotlar göreve!`, `The Colossus still stands at ${Math.round(KOLOS.can / KOLOS.max * 100)} percent. All pilots to battle!`));
  else if (KOLOS.yenildi) L2.push(T('Bu haftanın Kolos’u düştü! Pilotlara teşekkürler.', 'This week’s Colossus has fallen! Thank you, pilots.'));
  for (const k in DIP) if (DIP[k] >= 30) L2.push(T(`${IRK[k].ad[0]} elçiliği insanlarla dostluğun sürdüğünü açıkladı.`, `The ${IRK[k].ad[1]} embassy confirmed its friendship with humanity.`));
  L2.push(T('Hatırlatma: uzayda süzülen kara kutular kayıp gemilerin hikâyelerini taşıyor.', 'Reminder: black boxes drifting in space carry the stories of lost ships.'), T('Güvenli uçuşlar! Yakıtınızı kontrol etmeyi unutmayın.', 'Fly safe! Don’t forget to check your fuel.'), T('Bilim ofisinden: her yeni keşif bilim puanı kazandırıyor.', 'From the science office: every new discovery earns science.'));
  if (KERVAN.length) L2.push(T(`Kervan hatları açık: ${KERVAN.length} kervanınız yolda.`, `Convoy lanes are open: ${KERVAN.length} of your convoys are on the road.`));
  return L2;
}
function radyoAdim(dt) {
  if (!oyunda || !SES.muzik() || SES.kanal() === 'oto') return; radyoT -= dt; if (radyoT > 0) return; radyoT = 150 + Math.random() * 90;
  const L1 = haberListe(), hi = (Math.random() * L1.length) | 0, m = L1[hi]; duyur('📻 ' + L(KANALLAR[SES.kanal()]), 'kesif', esc(m));
  if (spiker && window.speechSynthesis) { try { let me = m; enZorla = true; try { me = haberListe()[hi] || m; } finally { enZorla = false; } const u = new SpeechSynthesisUtterance(me); u.lang = 'en-US'; const ses = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang)); if (ses.length) u.voice = ses.find(v => /en[-_]US/i.test(v.lang) && /natural|google|samantha|aria|jenny/i.test(v.name)) || ses.find(v => /en[-_](US|GB)/i.test(v.lang)) || ses[0]; u.rate = 1.05; u.volume = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
}
/* ================= galaksi takvimi ================= */
const TAKVIM = {
  fuar: { e: '🎪', ad: ['Ticaret fuarı', 'Trade fair'], ne: ['Her yerde satış fiyatları +%15', 'Selling prices +15% everywhere'] },
  korsan: { e: '☠', ad: ['Korsan haftası', 'Pirate week'], ne: ['Korsanlar iki kat sık, korsan ödülleri +%50', 'Pirates twice as often, pirate rewards +50%'] },
  kesif: { e: '🔭', ad: ['Keşif festivali', 'Exploration festival'], ne: ['Keşif ödülleri 2 kat, bilim +%50', 'Double exploration rewards, +50% science'] },
  meteor: { e: '☄', ad: ['Meteor yağmuru', 'Meteor shower'], ne: ['Uzayda çok daha fazla hurda süzülüyor', 'Much more salvage drifting in space'] },
  gunes: { e: '🌞', ad: ['Güneş fırtınası', 'Solar storm'], ne: ['Warp şarjı yavaş, gaz devlerinden 2 kat yakıt', 'Slow warp charge, double fuel from gas giants'] },
  hasat: { e: '🌾', ad: ['Hasat bayramı', 'Harvest festival'], ne: ['Gıda ve su %30 ucuz, mürettebat neşeli', 'Food and water 30% cheaper, the crew is cheerful'] },
  sakin: { e: '🕊', ad: ['Sakin gün', 'Calm day'], ne: ['Korsanlar ortalıkta yok', 'No pirates around'] },
};
let takSon = null;
function takvimKontrol() { const k = gunOlay(); if (k === takSon) return; const ilk = takSon === null; takSon = k; if (!oyunda) return; if (k === 'hasat' && ST.hasatG !== Math.floor(Date.now() / 864e5)) { ST.hasatG = Math.floor(Date.now() / 864e5); moralEkle(8); } setTimeout(() => duyur('📅 ' + T('Bugün: ', 'Today: ') + TAKVIM[k].e + ' <b>' + L(TAKVIM[k].ad) + '</b>', 'galaksi', L(TAKVIM[k].ne)), ilk ? 4500 : 300); }
function takvimHtml() {
  const g0 = Math.floor(Date.now() / 864e5 + 3 / 24), gunAd = EN() ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  let h = ''; for (let i = 0; i < 7; i++) { const g = g0 + i, hf = Math.floor((g + 3) / 7), L2 = ['fuar', 'korsan', 'kesif', 'meteor', 'gunes', 'hasat', 'sakin'], r = rng(h32(hf, 7, 2026)); for (let a = L2.length - 1; a > 0; a--) { const j = (r() * (a + 1)) | 0; [L2[a], L2[j]] = [L2[j], L2[a]]; } const k = L2[((g + 3) % 7 + 7) % 7], T0 = TAKVIM[k]; h += `<div style="display:flex;gap:8px;align-items:flex-start;margin:5px 0;${i ? 'opacity:.75' : 'font-weight:900'}"><span style="width:38px;color:var(--mute);font-size:12px;font-weight:900">${i ? gunAd[((g + 3) % 7 + 7) % 7] : T('Bugün', 'Today')}</span><span>${T0.e} <b>${L(T0.ad)}</b><br><small style="color:var(--mute)">${L(T0.ne)}</small></span></div>`; }
  return h;
}
/* ================= uzaylı diplomasisi ================= */
function dipEkle(irk, n) { if (!DIP.hasOwnProperty(irk)) return; const once = DIP[irk]; DIP[irk] = Math.max(-100, Math.min(100, once + n)); for (const [e, ad] of [[30, ['Dostluk anlaşması', 'Friendship pact']], [70, ['İttifak', 'Alliance']]]) if (once < e && DIP[irk] >= e) { defter('🕊 ' + IRK[irk].ad[0] + ' ile ' + ad[0].toLowerCase() + ' kurduk.', '🕊 We formed a ' + ad[1].toLowerCase() + ' with the ' + IRK[irk].ad[1] + '.'); setTimeout(() => { duyur(IRK[irk].e + ' ' + L(IRK[irk].ad) + ': <b>' + L(ad) + '</b>', 'galaksi', e === 30 ? T('Kolonilerinde %10 indirim', '10% off at their colonies') : T('Gemileri savaşta yardıma gelir, özel gemileri satın alınabilir', 'Their ships help you in battle and you can buy their special ship')); SES.galaksi(); basarimKontrol(); }, 400); } }
const dipSv = v => v >= 70 ? ['🤝 Müttefik', '🤝 Ally'] : v >= 30 ? ['🕊 Dost', '🕊 Friendly'] : v > -30 ? ['😐 Tarafsız', '😐 Neutral'] : ['😠 Soğuk', '😠 Cold'];
function dipOzet() { return `<div style="margin:10px 0 4px;font-weight:900;font-size:13px">🕊 ${T('Uzaylı ırklar', 'Alien races')}</div>` + Object.keys(DIP).map(k => `<div style="display:flex;justify-content:space-between;font-size:13px;margin:3px 0"><span>${IRK[k].e} ${L(IRK[k].ad)}</span><span>${L(dipSv(DIP[k]))} · ${Math.round(DIP[k])}</span></div>`).join(''); }
function elciYaz(p) {
  if (!yabanciMi(p)) return `<div class="alt">${T('Elçilikler yalnızca uzaylı kolonilerinde var.', 'Embassies exist only at alien colonies.')}</div>`;
  const irk = p.kol.irk, I = IRK[irk], v = DIP[irk], hm = I.mal, dg = g => GOREV.some(x => x.tip === 'dip' && x.irk === irk);
  let h = `<div style="margin:8px 0 2px;display:flex;justify-content:space-between;font-weight:900"><span>${I.e} ${L(I.ad)} · ${L(I.ne)}</span><span>${L(dipSv(v))} ${Math.round(v)}</span></div><div style="height:8px;border-radius:4px;background:rgba(255,255,255,.08);position:relative;overflow:hidden"><i style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.35)"></i><i style="display:block;height:100%;width:${(v + 100) / 2}%;background:${v >= 70 ? '#9BE07A' : v >= 30 ? '#7FE3FF' : v > -30 ? '#97A5CA' : '#FF7B8A'}"></i></div><div class="alt" style="font-size:12px;margin:4px 0 0">30: ${T('dostluk anlaşması · kolonilerinde %10 indirim', 'friendship pact · 10% off at their colonies')} · 70: ${T('ittifak · savaşta yardım ve özel gemi', 'alliance · help in battle and a special ship')}</div>`;
  const hed = { vel: 'elek', krai: 'luks', oru: 'ilac' }[irk];
  h += `<div class="satir"><div>🎁 <b>${T('Hediye: ', 'Gift: ')}${MAL[hed].e} ${L(MAL[hed].ad)} ×5</b><small>${T('Bu ırkın en sevdiği mal · ilişki +8', 'Their favourite good · relations +8')} · ${T('Ambarda', 'In hold')}: ${KARGO[hed] || 0}</small></div><div class="dg"><button class="kb al" type="button" data-dip="hediye" ${(KARGO[hed] || 0) < 5 ? 'disabled' : ''}>${T('Ver', 'Give')}</button></div></div>`;
  h += `<div class="satir"><div>💰 <b>${T('Kültür bağışı', 'Cultural donation')}</b><small>${T('İlişki +4', 'Relations +4')}</small></div><div class="dg"><button class="kb al" type="button" data-dip="bagis" ${kredi < 2000 ? 'disabled' : ''}>2.000 💰</button></div></div>`;
  h += `<div class="satir"><div>📜 <b>${T('Elçilik görevi', 'Envoy mission')}</b><small>${T('Mesajı aynı ırkın başka bir kolonisine götür · ilişki +12, ödül', 'Carry a message to another colony of the same race · relations +12, reward')}</small></div><div class="dg"><button class="kb al" type="button" data-dip="gorev" ${dg() ? 'disabled' : ''}>${dg() ? T('Görevde', 'On a mission') : T('Kabul et', 'Accept')}</button></div></div>`;
  if (v >= 70) { const gk = irk + 'k'; h += `<div class="alt" style="margin:8px 0 0">🚀 ${T('Müttefik olarak ', 'As an ally you can buy the ')}<b>${L(GEMI[gk].ad)}</b>${T(' gemisini Gemiler sekmesinden alabilirsin.', ' at the Ships tab.')}</div>`; }
  return h;
}
function elciIslem(p, k) {
  const irk = p.kol.irk, hed = { vel: 'elek', krai: 'luks', oru: 'ilac' }[irk];
  if (k === 'hediye' && (KARGO[hed] || 0) >= 5) { KARGO[hed] -= 5; if (!KARGO[hed]) delete KARGO[hed]; dipEkle(irk, 8); itEkle(p.id, 5); SES.koloni(); duyur(IRK[irk].e + ' ' + T('Hediyen sevinçle karşılandı', 'Your gift was received with joy'), 'koloni', '🕊 +8'); }
  else if (k === 'bagis' && kredi >= 2000) { kredi -= 2000; dipEkle(irk, 4); SES.koloni(); }
  else if (k === 'gorev' && !GOREV.some(x => x.tip === 'dip' && x.irk === irk)) {
    const G = galaksi(...galHucre(p.s.x, p.s.y)), [kx, ky] = kapiPos(G), L2 = koloniBul(Math.floor(p.s.x / SEK), Math.floor(p.s.y / SEK), 10).filter(q => yabanciMi(q) && q.kol.irk === irk && q !== p && Math.hypot(q.s.x - p.s.x, q.s.y - p.s.y) > 2 * SEK);
    if (!L2.length) { duyur('🕊 ' + T('Yakında başka bir koloni yok', 'No other colony nearby'), 'uyari'); return; } const q = L2[(Math.random() * L2.length) | 0];
    GOREV.push({ id: 'dp' + Date.now(), tip: 'dip', irk, h: q.id, hs: [q.s.t.sx, q.s.t.sy, q.i], ad: kolAd(q), odul: odulK(900 + Math.hypot(q.s.x - p.s.x, q.s.y - p.s.y) / SEK * 90) }); SES.koloni(); gorevYaz();
  }
}
/* ================= kara kutu yan görevleri ================= */
const YANZ = {
  k1: { ad: ['Mavi Serçe', 'Blue Sparrow'], adim: [
    { tip: 'git', m: ['Sinyalin kaynağına git', 'Go to the source of the signal'], son: ['Akıntıda süzülen bir kaçış kapsülü buldun. İçinde üç kişi hâlâ hayatta! Zayıf ama gülümsüyorlar.', 'You found an escape pod drifting. Three people inside are still alive! Weak, but smiling.'] },
    { tip: 'yanas', m: ['Hayatta kalanları en yakın koloniye götür', 'Take the survivors to the nearest colony'], son: ['Doktorlar onları hemen tedaviye aldı. Kaptanları sana ailelerine iletmen için bir mektup verdi.', 'Doctors took them straight into care. Their captain gave you a letter for their families.'] },
    { tip: 'ev', m: ['Mektubu Yeni Umut’taki ailelerine ulaştır', 'Deliver the letter to their families on New Hope'], son: ['Aileler gözyaşları içinde mektubu okudu. Mavi Serçe’nin hikâyesi mutlu bitti.', 'The families read the letter in tears. The Blue Sparrow’s story has a happy ending.'] }], odul: 5000 },
  k2: { ad: ['Demir Kartal', 'Iron Eagle'], adim: [
    { tip: 'git', dusman: 4, m: ['Pusu noktasına git ve korsanları temizle', 'Go to the ambush point and clear the pirates'], son: ['Korsanlar dağıldı. Enkazın arasında Demir Kartal’ın çalınan kargo kapsülünün izi var.', 'The pirates scattered. Among the debris is a trace of the Iron Eagle’s stolen cargo pod.'] },
    { tip: 'git', m: ['Çalınan kargo kapsülünü bul', 'Find the stolen cargo pod'], son: ['Kapsül sağlam! Üzerinde bir koloninin damgası var.', 'The pod is intact! It bears a colony’s stamp.'] },
    { tip: 'yanas', m: ['Kargoyu sahibine teslim et', 'Return the cargo to its owner'], son: ['Koloni sana minnettar. Demir Kartal’ın mürettebatı bu kez korkmadan uçabilir.', 'The colony is grateful. The Iron Eagle’s crew can fly without fear again.'] }], odul: 6000 },
  k3: { ad: ['Sessiz Gezgin', 'Silent Wanderer'], adim: [
    { tip: 'git', bekle: 8, m: ['Kayıttaki ilk yıldızı yakından tara', 'Scan the first star from the log up close'], son: ['Yıldızın ışığı ritmik olarak titriyor, sanki biri ondan enerji çekiyor.', 'The star’s light flickers rhythmically, as if something is drawing energy from it.'] },
    { tip: 'git', bekle: 8, m: ['İkinci yıldızı tara', 'Scan the second star'], son: ['Aynı titreşim! Gölgelerin izine benziyor ama çok daha eski.', 'The same flicker! It resembles the Shadows’ trace, but much older.'] },
    { tip: 'banka', m: ['Verileri Merkez Bankası’ndaki bilim ofisine götür', 'Take the data to the science office at the Central Bank'], son: ['Bilim insanları verilerle büyülendi. Sessiz Gezgin’in uyarısı sonunda duyuldu.', 'The scientists were captivated by the data. The Silent Wanderer’s warning was finally heard.'] }], odul: 4000, bilim: 40 },
  k4: { ad: ['Altın Pusula', 'Golden Compass'], adim: [
    { tip: 'uzayli', irk: 'vel', m: ['En yakın Vel kolonisine yanaş', 'Dock at the nearest Vel colony'], son: ['Vel’ler Altın Pusula’nın kaydını duyunca kristal sesleriyle bir şarkı söylediler.', 'Hearing the Golden Compass’s log, the Vel sang a song with their crystal voices.'] },
    { tip: 'getir', mal: 'kris', n: 3, irk: 'vel', m: ['Vel’lere 3 Vel kristali getir (anma töreni için)', 'Bring the Vel 3 Vel crystals (for a memorial)'], son: ['Kristaller anma kulesine yerleştirildi. Vel’ler seni dost olarak anıyor.', 'The crystals were placed on the memorial tower. The Vel remember you as a friend.'] },
    { tip: 'ev', m: ['Hikâyeyi Yeni Umut’a anlat', 'Tell the story on New Hope'], son: ['İnsanlar ile Vel’ler arasındaki ilk dostluğun hikâyesi artık herkesin dilinde.', 'The story of the first friendship between humans and the Vel is now on everyone’s lips.'] }], odul: 5000, dip: ['vel', 20] },
  k5: { ad: ['Gece Kuşu', 'Nightjar'], adim: [
    { tip: 'kapi', dusman: 3, golge: true, m: ['Gece Kuşu’nun geçtiği kapıya git', 'Go to the gate the Nightjar passed'], son: ['Kapının önünde gölge dronları seni bekliyordu, ama artık yoklar. Geride bir kayıt sürücüsü kaldı.', 'Shadow drones were waiting at the gate, but they are gone now. A log drive was left behind.'] },
    { tip: 'git', m: ['Sürücüdeki koordinatlara git', 'Go to the coordinates on the drive'], son: ['Gece Kuşu’nun enkazı burada. Mürettebat kurtulamamış ama son anlarında yolu işaretlemişler.', 'The Nightjar’s wreck is here. The crew did not survive, but they marked the way in their last moments.'] },
    { tip: 'ev', m: ['Kayıtları Yeni Umut’a getir', 'Bring the logs to New Hope'], son: ['Gece Kuşu’nun mürettebatı kahraman olarak anıldı.', 'The Nightjar’s crew was honoured as heroes.'] }], odul: 7000 },
  k6: { ad: ['Umut-3', 'Hope-3'], adim: [
    { tip: 'git', uzak: 18, m: ['Umut-3’ün son konumuna git', 'Go to Hope-3’s last known position'], son: ['Devasa, eski bir koloni gemisi… Umut-3! Gövdesinde yüzlerce isim kazılı.', 'A huge, ancient colony ship… Hope-3! Hundreds of names are carved into its hull.'] },
    { tip: 'git', bekle: 10, m: ['Gemiyi tara ve isimleri kaydet', 'Scan the ship and record the names'], son: ['Bütün isimler kaydedildi. Umut-3’ün yolcuları artık unutulmayacak.', 'Every name is recorded. The passengers of Hope-3 will no longer be forgotten.'] },
    { tip: 'ev', m: ['İsimleri Yeni Umut’taki anıta götür', 'Take the names to the memorial on New Hope'], son: ['Yeni Umut’ta Umut-3 için bir anıt dikildi. Yolu açanlar sonunda hatırlanıyor.', 'A memorial to Hope-3 was raised on New Hope. Those who opened the way are finally remembered.'] }], odul: 12000, bilim: 30 },
};
function yanBasla(z) {
  ST.yan = ST.yan || {}; if (ST.yan[z] != null) return; ST.yan[z] = 0; const Z = YANZ[z];
  diyalog([['📼 ' + Z.ad[0], '📼 ' + Z.ad[1]], [`Kara kutunun kaydında koordinatlar ve yarım kalmış bir hikâye var. Belki sonunu sen getirebilirsin.<br><br><b>Yeni yan görev:</b> ${Z.adim[0].m[0]}`, `The black box log holds coordinates and an unfinished story. Maybe you can bring it to an end.<br><br><b>New side quest:</b> ${Z.adim[0].m[1]}`]], () => yanAdim(z, 0));
}
function yanAdim(z, a) {
  const Z = YANZ[z], A = Z.adim[a]; GOREV = GOREV.filter(g => !(g.tip === 'yan' && g.z === z)); ST.yan[z] = a;
  const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK), g = { id: 'yn' + z + a, tip: 'yan', z, a, ad: L(Z.ad) };
  if (A.tip === 'git') { const r = rng(h32(z.charCodeAt(1), a, 4321 + sx)), an = r() * TAU, d = (A.uzak || (4 + r() * 5)) * SEK; let x = SH.x + Math.cos(an) * d, y = SH.y + Math.sin(an) * d; if (A.bekle) { const tm = temel(Math.floor(x / SEK), Math.floor(y / SEK)) || (() => { for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const q = temel(Math.floor(x / SEK) + i, Math.floor(y / SEK) + j); if (q) return q; } return null; })(); if (tm) { x = tm.x + tm.yr * 3; y = tm.y; g.ad += ' · ' + tm.ad; } } Object.assign(g, { x, y }); }
  else if (A.tip === 'kapi') { const G = galaksi(...galHucre(SH.x, SH.y)), [x, y] = kapiPos(G); Object.assign(g, { x, y }); }
  else if (A.tip === 'banka') { const [x, y] = bankaPos(); Object.assign(g, { x, y, banka: true, ad: L(Z.ad) + ' · ' + T('Merkez Bankası', 'Central Bank') }); }
  else { let q = null; if (A.tip === 'ev') q = evGezegen(); else if (A.irk) { const L2 = koloniBul(sx, sy, 14).filter(c => yabanciMi(c) && c.kol.irk === A.irk).sort((c1, c2) => Math.hypot(c1.s.x - SH.x, c1.s.y - SH.y) - Math.hypot(c2.s.x - SH.x, c2.s.y - SH.y)); q = L2[0] || null; } else { const L2 = koloniBul(sx, sy, 5).sort((c1, c2) => Math.hypot(c1.s.x - SH.x, c1.s.y - SH.y) - Math.hypot(c2.s.x - SH.x, c2.s.y - SH.y)); q = L2[0] || evGezegen(); }
    if (!q) q = evGezegen(); Object.assign(g, { h: q.id, hs: [q.s.t.sx, q.s.t.sy, q.i], ad: L(Z.ad) + ' · ' + kolAd(q) }); }
  GOREV.push(g); gorevYaz(); kaydet();
}
function yanIlerle(g) {
  const Z = YANZ[g.z], A = Z.adim[g.a]; GOREV = GOREV.filter(x => x !== g);
  diyalog([['📼 ' + Z.ad[0] + ' · ' + (g.a + 1) + '/3', '📼 ' + Z.ad[1] + ' · ' + (g.a + 1) + '/3'], A.son], () => {
    if (g.a + 1 < Z.adim.length) { yanAdim(g.z, g.a + 1); return; }
    ST.yan[g.z] = 'bitti'; kazan(Z.odul, 'gorev'); if (Z.bilim) bilimEkle(Z.bilim); if (Z.dip) dipEkle(Z.dip[0], Z.dip[1]); moralEkle(6); defter('📼 ' + Z.ad[0] + ' hikâyesini tamamladım.', '📼 I completed the story of the ' + Z.ad[1] + '.');
    duyur('📼 ' + T('Yan görev tamamlandı: ', 'Side quest complete: ') + '<b>' + L(Z.ad) + '</b>', 'galaksi', `+${SAYI(Z.odul)} 💰${Z.bilim ? ' · 🔬 +' + Z.bilim : ''}`); SES.galaksi(); gorevYaz(); basarimKontrol(); kaydet();
  });
}
function yanKontrol(dt) {
  if (!oyunda || limanP || diyalogAcik) return;
  for (const g of GOREV.slice()) {
    if (g.tip !== 'yan' || g.hs) continue; const A = YANZ[g.z].adim[g.a], d = Math.hypot(g.x - SH.x, g.y - SH.y);
    if (g.banka) { if (bankaYakin()) yanIlerle(g); continue; }
    if (d > 1400) { g.bek = 0; continue; }
    if (A.dusman && !g.sp) { g.sp = true; const gg = korsanGuc(); for (let i = 0; i < A.dusman; i++) { const a = i * TAU / A.dusman, mx = Math.round(100 + gg * 160); KORS.push({ x: g.x + Math.cos(a) * 600, y: g.y + Math.sin(a) * 600, vx: 0, vy: 0, a, can: mx, max: mx, atT: 1.5, yon: i % 2 ? 1 : -1, yan: g.id, golge: !!A.golge }); } duyur('📼 ' + T('Pusu!', 'Ambush!'), 'uyari'); SES.uyari(); continue; }
    if (A.dusman && KORS.some(k => k.yan === g.id)) continue;
    if (A.bekle) { g.bek = (g.bek || 0) + dt; if (performance.now() - (g._by || 0) > 2000) { g._by = performance.now(); duyur('📡 ' + T('Taranıyor… ', 'Scanning… ') + Math.min(100, Math.round(g.bek / A.bekle * 100)) + '%', 'kesif'); } if (g.bek < A.bekle) continue; }
    yanIlerle(g); return;
  }
}
function yanLiman(p) {
  for (const g of GOREV.slice()) {
    if (g.tip === 'dip' && g.h === p.id) { GOREV = GOREV.filter(x => x !== g); kazan(g.odul, 'gorev'); dipEkle(g.irk, 12); ST.gorev++; setTimeout(() => duyur('🕊 ' + T('Elçilik mesajı teslim edildi', 'Envoy message delivered'), 'galaksi', `+${SAYI(g.odul)} 💰 · ${IRK[g.irk].e} +12`), 500); gorevYaz(); continue; }
    if (g.tip !== 'yan' || g.h !== p.id) continue; const A = YANZ[g.z].adim[g.a];
    if (A.tip === 'getir') { if ((KARGO[A.mal] || 0) < A.n) { setTimeout(() => duyur('📼 ' + T('Görev için gereken: ', 'Needed for the quest: ') + `${MAL[A.mal].e} ${A.n}`, 'uyari', T('Ambarında ', 'In your hold: ') + (KARGO[A.mal] || 0)), 500); continue; } KARGO[A.mal] -= A.n; if (!KARGO[A.mal]) delete KARGO[A.mal]; }
    setTimeout(() => { limanKapatSessiz(); yanIlerle(g); }, 700); return;
  }
}
function limanKapatSessiz() { }
function yanCiz(t) { for (const g of GOREV) { if (g.tip !== 'yan' || g.hs || g.banka) continue; const [X, Y] = W2S(g.x, g.y); if (X < -200 || X > W + 200 || Y < -200 || Y > H + 200) continue; const buyuk = g.z === 'k6' && g.a <= 1, sk = Math.max(0.5, cam.z) * (buyuk ? 4 : 1.4); const sp = gemiSprite(buyuk ? 'yuk' : g.z === 'k1' ? 'kapsul' : 'kasif', 5, 'hurda'); ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 0.05 + g.a); ctx.scale(sk, sk); ctx.drawImage(sp.c, sp.x0, sp.y0, sp.c.width / SS, sp.c.height / SS); ctx.restore(); if (Math.sin(t * 4) > 0) { ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createRadialGradient(X, Y, 0, X, Y, 30); gg.addColorStop(0, 'rgba(255,200,87,.5)'); gg.addColorStop(1, 'rgba(255,200,87,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(X, Y, 30, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; } ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE3A6'; ctx.fillText('📼 ' + L(YANZ[g.z].ad), X, Y - 30 * sk / 1.4); } }
/* ================= fiyat grafiği ================= */
function fiyatGrafik(p, m) {
  const s0 = Math.floor(Date.now() / 3.6e6), L2 = []; for (let i = 23; i >= 0; i--) L2.push(fiyat(p, m, s0 - i));
  const mn = Math.min(...L2), mx = Math.max(...L2), ort = L2.reduce((a, b) => a + b, 0) / L2.length, w = 74, h = 20, sy = v => mx === mn ? h / 2 : h - 2 - (v - mn) / (mx - mn) * (h - 4);
  const pts = L2.map((v, i) => `${(i / 23 * (w - 4) + 2).toFixed(1)},${sy(v).toFixed(1)}`).join(' '), son = L2[23], renk = son < ort * 0.97 ? '#9BE07A' : son > ort * 1.03 ? '#FFC857' : '#7FE3FF';
  return ` <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="vertical-align:middle;margin-left:4px" role="img" aria-label="${T('24 saat', '24 h')}: ${mn}–${mx}"><title>${T('Son 24 saat', 'Last 24 hours')}: ${SAYI(mn)}–${SAYI(mx)} 💰 · ${T('ort.', 'avg')} ${SAYI(Math.round(ort))}</title><line x1="2" x2="${w - 2}" y1="${sy(ort).toFixed(1)}" y2="${sy(ort).toFixed(1)}" stroke="rgba(255,255,255,.15)" stroke-dasharray="2 2"/><polyline points="${pts}" fill="none" stroke="${renk}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="${w - 2}" cy="${sy(son).toFixed(1)}" r="2.5" fill="${renk}"/></svg>`;
}
