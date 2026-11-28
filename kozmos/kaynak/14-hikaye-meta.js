/* ================= Umut-7 hikâyesi ================= */
const HIKM2 = { 6: ['Yeni Umut’a 10 birim ilaç götür', 'Bring 10 units of medicine to New Hope'], 7: ['Komşu galaksiye ulaş', 'Reach the neighbouring galaxy'], 8: ['Kadim Kapı’yı bul', 'Find the Ancient Gate'], 9: ['Kapının tam ortasına uç', 'Fly into the centre of the gate'] };
const HIKM = [null, ['Sinyalin geldiği sisteme git', 'Go to the system the signal comes from'], ['Koloniye yanaş, Umut-7’yi sor', 'Dock at the colony and ask about Hope-7'], ['Kara deliğe yaklaş (çekimi güçlü, dikkat!)', 'Approach the black hole (strong gravity, careful!)'], ['Galaksinin dış kıyısına git', 'Fly to the outer edge of the galaxy']];
const HIKD2 = {
  b0: [['📻 Kaptanın mesajı', '📻 The captain’s message'], ['Umut-7’nin kaptanı <b>Arda Demir</b> uyandı ve sana mesaj gönderdi: <i>“Mürettebatım hâlâ donmuş uykuda; uyandırmak için ilaç lazım. Ama asıl mesele başka: biz kaybolmadık… kaçıyorduk.”</i><br><br>Önce Yeni Umut’a <b>10 birim ilaç</b> götür. İlaç yeşil gezegenlerde ucuza bulunur.', 'Hope-7’s captain <b>Arda Demir</b> is awake and sent you a message: <i>“My crew is still in cryosleep; we need medicine to wake them. But that’s not the real story: we weren’t lost… we were running.”</i><br><br>First bring <b>10 units of medicine</b> to New Hope. Medicine is cheap on verdant planets.']],
  b1: [['💊 Uyanış', '💊 Awakening'], ['Mürettebat uyanıyor. Kaptan Arda anlatıyor: <i>“Komşu galaksiden gelen bir sinyali çözüyorduk. Sinyal dev bir yapıyı gösteriyordu: <b>Kadim Kapı</b>. Sonra bizi gölgeler kovaladı.”</i><br><br>Komşu galaksiye ulaşman gerek. Yol çok uzun: tersanede yakıt tankını ve warp sürücüsünü büyütmek iyi fikir. Ödül: 1.500 kredi.', 'The crew is waking up. Captain Arda explains: <i>“We were decoding a signal from the neighbouring galaxy. It pointed to a giant structure: the <b>Ancient Gate</b>. Then the shadows came after us.”</i><br><br>You need to reach the neighbouring galaxy. It is a very long way: upgrading the fuel tank and warp drive at a shipyard is a good idea. Reward: 1,500 credits.']],
  b2: [['🌌 Yabancı yıldızlar', '🌌 Strange stars'], ['Komşu galaksidesin. Sinyal burada çok daha güçlü ve galaksinin içindeki dev bir halkadan geliyor: Kadim Kapı. Dikkatli ol, kaptan “gölgeler” konusunda uyarmıştı.', 'You are in the neighbouring galaxy. The signal is much stronger here and comes from a giant ring inside the galaxy: the Ancient Gate. Be careful, the captain warned about “shadows”.']],
  b3: [['⛩ Kapı sessiz', '⛩ The gate is silent'], ['Gölge dronlarını yendin. Kapının ortasında sönük bir ışık var, sanki bir anahtar bekliyor. Geminin warp çekirdeği onunla eşleşebilir: kapının tam ortasına uç.', 'You defeated the shadow drones. A faint light glows in the centre of the gate, as if waiting for a key. Your warp core may sync with it: fly right into the centre.']],
  son: [['✨ Kadim Kapılar açıldı!', '✨ The Ancient Gates are open!'], ['Warp çekirdeğin kapıyla eşleşti ve halka mor bir ışıkla doldu. Her galaksinin içinde böyle bir kapı var ve hepsi birbirine bağlı! Artık keşfettiğin galaksiler arasında anında yolculuk yapabilirsin: bir kapıya yaklaşıp <b>⛩ Kapıdan geç</b>’e bas.<br><br>Ödül: <b>10.000 kredi</b>.<br><br><i>Kaptan Arda: “Gölgelerin kim olduğunu hâlâ bilmiyoruz… ama artık onları arayabiliriz.”</i>', 'Your warp core synced with the gate and the ring filled with violet light. Every galaxy has a gate like this, and they are all connected! You can now travel instantly between the galaxies you have discovered: approach a gate and press <b>⛩ Use the gate</b>.<br><br>Reward: <b>10,000 credits</b>.<br><br><i>Captain Arda: “We still don’t know who the shadows are… but now we can look for them.”</i>']],
};
const HIKM3 = { 11: ['Gölge üssünü bul ve yok et', 'Find and destroy the shadow base'], 12: ['Veri çekirdeğini bir uzaylı kolonisine götür', 'Take the data core to an alien colony'], 13: ['Antik kalıntılardan 3 kadim parça topla', 'Collect 3 ancient shards from ruins'], 14: ['Ana gemi Örtü’yü yen', 'Defeat the mothership Shroud'] };
const HIKD3 = {
  c0: [['👁 Gölgelerin izinde', '👁 On the trail of the shadows'], ['Kapı ağı açıldığından beri tarayıcıların garip bir yayın yakalıyor. Kaptan Arda: <i>“Bu bir gölge üssünün sinyali. Burada, bu galakside!”</i><br><br>Üsse git ve onu yok et. Hazırlıklı ol: dronlar ve ağır ateş seni bekliyor. Kalkan, taret ve teçhizat işine yarar.', 'Ever since the gate network opened, your scanners have picked up a strange broadcast. Captain Arda: <i>“That’s a shadow base. Here, in this galaxy!”</i><br><br>Go to the base and destroy it. Be ready: drones and heavy fire. Shields, turret and equipment will help.']],
  c1: [['💾 Veri çekirdeği', '💾 Data core'], ['Üs patladı ve enkazından şifreli bir veri çekirdeği çıktı. İnsan bilgisayarları bu dili çözemiyor; uzaylı uygarlıklardan biri yardımcı olabilir. Çekirdeği bir uzaylı kolonisine götür. <i>(İpucu: kapı ağını kullan.)</i>', 'The base exploded and an encrypted data core came out of the wreckage. Human computers cannot read it; one of the alien civilisations may help. Take the core to an alien colony. <i>(Hint: use the gate network.)</i>']],
  c2: [['📜 Kadim dil', '📜 The ancient language'], ['Uzaylı bilginler çekirdeği çözdü: Gölgeler, yıldızları söndürüp enerjilerini toplayan kadim bir makine filosu. Liderleri dev ana gemi <b>Örtü</b>. Kalkanı sıradan silahlarla delinemez; ama antik kalıntılardaki <b>kadim parçalar</b> birleşince bir <b>Işık Mızrağı</b> oluşur.<br><br>🏛 işaretli gezegenlerdeki kalıntılardan <b>3 parça</b> topla.', 'The alien scholars decoded the core: the Shadows are an ancient machine fleet that dims stars and harvests their energy. Their leader is the giant mothership <b>Shroud</b>. Its shield cannot be pierced by ordinary weapons, but the <b>ancient shards</b> hidden in ruins form a <b>Spear of Light</b>.<br><br>Collect <b>3 shards</b> from ruins on planets marked 🏛.']],
  c3: [['🔱 Işık Mızrağı', '🔱 Spear of Light'], ['Üç parça birleşti ve geminin burnunda parlak bir mızrak belirdi. Artık Örtü’nün kalkanını delebilirsin. Ana gemi galaksinin dışında, boşlukta saklanıyor. Son savaş seni bekliyor.', 'The three shards joined and a bright spear appeared at your ship’s nose. Now you can pierce the Shroud’s shield. The mothership hides outside the galaxy, in the void. The final battle awaits.']],
  c4: [['🌟 Örtü yıkıldı!', '🌟 The Shroud has fallen!'], ['Ana gemi Örtü dev bir ışık patlamasıyla parçalandı; gölge dronları birer birer sönüyor. Yıldızlar artık güvende. Kaptan Arda: <i>“Seni Galaksilerin Koruyucusu ilan ediyoruz.”</i><br><br>Ödül: <b>30.000 kredi</b>, tersanede <b>Gölge avcısı</b> gemisi ve <b>Koruyucu</b> unvanı. Hikâyenin sonuna geldin; evren keşfetmen için hâlâ sonsuz.', 'The mothership Shroud shattered in a giant burst of light; the shadow drones go dark one by one. The stars are safe. Captain Arda: <i>“We name you Guardian of the Galaxies.”</i><br><br>Reward: <b>30,000 credits</b>, the <b>Shadow hunter</b> ship at the shipyard and the <b>Guardian</b> title. This is the end of the story; the universe is still endless to explore.']],
};
function kalintiBul() {
  const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK); let en = null, ed = Infinity;
  for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) { const s2 = sistem(sx + i, sy + j); if (!s2) continue; for (const p of s2.gez) if (p.kalinti && !KESIF.has('r:' + p.id)) { const d = Math.hypot(s2.x - SH.x, s2.y - SH.y); if (d < ed) { ed = d; en = p; } } }
  return en;
}
function devCikar(tur, x, y, sessiz) {
  if (tur === 'us') { KORS.push({ x, y, vx: 0, vy: 0, a: 0, can: 2400, max: 2400, atT: 2, yon: 1, us: true, ad: T('Gölge üssü', 'Shadow base') }); for (let i = 0; i < 4; i++) { const a = i * TAU / 4; KORS.push({ x: x + Math.cos(a) * 700, y: y + Math.sin(a) * 700, vx: 0, vy: 0, a, can: 200, max: 200, atT: 1.5, yon: i % 2 ? 1 : -1, golge: true }); } if (!sessiz) duyur('👁 ' + T('Gölge üssü saldırıya geçti!', 'The shadow base is attacking!'), 'uyari'); }
  else { KORS.push({ x, y, vx: 0, vy: 0, a: 0, can: 9000, max: 9000, atT: 1, yon: 1, ana: true, sp: 0, dT: 8, ad: T('Örtü', 'Shroud') }); if (!sessiz) duyur('👁 ' + T('Ana gemi Örtü uyandı!', 'The mothership Shroud has awoken!'), 'uyari', T('Işık Mızrağın otomatik ateş eder: yaklaş ve dayan!', 'Your Spear of Light fires on its own: get close and hold on!')); }
  SES.uyari();
}
function devGuncelle(k, dt, d, dx, dy) {
  k.a += dt * (k.ana ? 0.15 : 0.35); k.atT -= dt;
  if (k.ana) {
    if (d > 1800) { k.x += dx / d * 140 * dt; k.y += dy / d * 140 * dt; }
    if (k.atT <= 0) { k.atT = 0.32; k.sp += 0.45; for (const o of [0, Math.PI]) { const a = k.sp + o; MERMI.push({ x: k.x + Math.cos(a) * 240, y: k.y + Math.sin(a) * 240, vx: Math.cos(a) * 950, vy: Math.sin(a) * 950, o: 0, w: 2.6, d: false, h: 10 }); } }
    k.dT -= dt; if (k.dT <= 0) { k.dT = 14; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; KORS.push({ x: k.x + Math.cos(a) * 320, y: k.y + Math.sin(a) * 320, vx: 0, vy: 0, a, can: 160, max: 160, atT: 1.5, yon: i ? 1 : -1, golge: true }); } }
  } else if (k.atT <= 0 && d < 2200) { k.atT = 2; for (let i = 0; i < 10; i++) { const a = k.a + i * TAU / 10; MERMI.push({ x: k.x + Math.cos(a) * 150, y: k.y + Math.sin(a) * 150, vx: Math.cos(a) * 850, vy: Math.sin(a) * 850, o: 0, w: 2.4, d: false, h: 9 }); } SES.ates(0.3); }
}
function balonCiz(em, X, Y, f) {
  const a = f < 0.8 ? 1 : (1 - f) / 0.2, yy = Y - f * 14; ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(240,248,255,.92)'; ctx.beginPath(); ctx.arc(X, yy, 17, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(X - 5, yy + 14); ctx.lineTo(X, yy + 22); ctx.lineTo(X + 5, yy + 14); ctx.fill();
  ctx.font = '18px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(em, X, yy + 1); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
}
function devCiz(k, X, Y, t) {
  const R = Math.max(22, (k.ana ? 300 : 170) * cam.z), n = k.ana ? 8 : 6;
  ctx.save(); if (k.yut) ctx.filter = k.ana ? 'hue-rotate(160deg) saturate(1.3)' : 'hue-rotate(60deg)'; ctx.translate(X, Y); ctx.rotate(k.a);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.4); g.addColorStop(0, 'rgba(180,140,255,.35)'); g.addColorStop(1, 'rgba(90,40,200,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.4, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#1A0E30'; ctx.strokeStyle = '#B48CFF'; ctx.lineWidth = Math.max(1.5, R * 0.03);
  ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, r = i % 2 ? R * 0.72 : R; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(180,140,255,.5)'; ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, TAU); ctx.stroke();
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.3); cg.addColorStop(0, '#FFFFFF'); cg.addColorStop(0.4, 'rgba(200,160,255,.95)'); cg.addColorStop(1, 'rgba(120,60,255,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, R * (0.28 + 0.03 * Math.sin(t * 4)), 0, TAU); ctx.fill();
  if (k.ana && !HIK.mizrak) { ctx.strokeStyle = 'rgba(160,200,255,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R * 1.1, 0, TAU); ctx.stroke(); }
  ctx.restore();
  ctx.font = '900 12.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#D8C6FF'; ctx.fillText('👁 ' + k.ad, X, Y - R - 22);
  const w = Math.min(220, R * 1.6); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(X - w / 2, Y - R - 16, w, 6); ctx.fillStyle = '#B48CFF'; ctx.fillRect(X - w / 2, Y - R - 16, w * Math.max(0, k.can / k.max), 6);
}
const HIKD = {
  bas: [['📡 Garip bir sinyal', '📡 A strange signal'], ['Kolonideki iletişim kulesi, 80 yıl önce kaybolan dev koloni gemisi <b>Umut-7</b>’nin acil durum sinyalini yakaladı. Sinyal birkaç sektör ötedeki bir yıldız sisteminden geliyor. Gemide binlerce kişi vardı. İzini sürer misin?', 'The colony’s comms tower picked up the emergency beacon of <b>Hope-7</b>, a giant colony ship lost 80 years ago. The signal comes from a star system a few sectors away. Thousands of people were on board. Will you follow the trail?']],
  a1: [['🛰 Kurtarma kapsülü', '🛰 An escape pod'], ['Sistemde Umut-7’den kopmuş boş bir kurtarma kapsülü buldun. Seyir kaydına göre gemi son olarak bir koloniye uğramış. Oradakiler bir şey biliyor olabilir.', 'You found an empty escape pod from Hope-7. Its log says the ship last stopped at a colony. People there may know something.']],
  a2: [['🍵 Yaşlı pilot', '🍵 The old pilot'], ['Limandaki yaşlı bir pilot Umut-7’yi hatırlıyor: <i>“Motorları arızalıydı, kara deliğin çekimini kullanarak hızlanmaya çalıştılar. Bir daha haber alamadık.”</i> En yakın kara deliğe git ama fazla yaklaşma!', 'An old pilot at the port remembers Hope-7: <i>“Their engines were failing, they tried to slingshot around the black hole. We never heard from them again.”</i> Go to the nearest black hole, but don’t get too close!']],
  a3: [['🕳 Olay ufkunun kıyısında', '🕳 At the edge of the event horizon'], ['Kara deliğin çevresinde sinyal çok güçlü ama gemi burada değil. Kara delik onu bir sapan gibi fırlatmış: rota galaksinin dış kıyısına, yıldızsız boşluğa uzanıyor. Yakıtın yetecek mi?', 'The signal is strong around the black hole but the ship isn’t here. The black hole flung it like a slingshot: the course leads to the outer edge of the galaxy, into the starless void. Will your fuel last?']],
  son: [['🚀 Umut-7 bulundu!', '🚀 Hope-7 found!'], ['Galaksinin kıyısında, yıldızsız karanlıkta dev koloni gemisi <b>Umut-7</b> sessizce süzülüyor. Mürettebat donmuş uykuda, ama hayatta! Kurtarma ekipleri yola çıktı.<br><br>Ödül: <b>5.000 kredi</b> ve tersanede <b>Umut-7 sınıfı</b> gemi tasarımı.', 'At the edge of the galaxy, in the starless dark, the giant colony ship <b>Hope-7</b> drifts in silence. The crew is in cryosleep, but alive! Rescue teams are on their way.<br><br>Reward: <b>5,000 credits</b> and the <b>Hope-7 class</b> ship design at the shipyard.']],
};
function diyalog(d, cb) {
  diyalogAcik = true; $('dyBas').textContent = L(d[0]); $('dyMet').innerHTML = L(d[1]); $('dySec').innerHTML = ''; $('dyTamam').hidden = false; $('diyalog').hidden = false; SES.galaksi();
  $('dyTamam').onclick = () => { $('diyalog').hidden = true; diyalogAcik = false; SES.tik(); if (cb) cb(); gorevYaz(); };
}
const hikGorev = () => GOREV.find(g => g.tip === 'hikaye');
function hikBasla() { if (HIK.a !== 0 || !oyunda || diyalogAcik) return; diyalog(HIKD.bas, () => hikAdim(1)); }
function hikAdim(a) {
  GOREV = GOREV.filter(g => g.tip !== 'hikaye'); if (a > HIK.a) defter('⭐ Hikâyede yeni bir sayfa açıldı (adım ' + a + ').', '⭐ A new page of the story opened (step ' + a + ').'); HIK.a = a;
  if (a === 5 || a === 10 || a === 15 || a >= 20) { gorevYaz(); kaydet(); return; }
  if (a >= 16) { hik4Adim(a); return; }
  const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK), r = rng(h32(sx, sy, 4040 + a)); let g = null;
  if (a === 1) { for (let k = 0; k < 100 && !g; k++) { const an = r() * TAU, d = 3 + r() * 1.8, tm = temel(sx + Math.round(Math.cos(an) * d), sy + Math.round(Math.sin(an) * d)); if (tm && !tm.ev && !YT[tm.yt].kd) g = { hs: [tm.sx, tm.sy], ad: tm.ad }; } }
  else if (a === 2) { let L2 = koloniBul(sx, sy, 7).filter(p => Math.hypot(p.s.x - SH.x, p.s.y - SH.y) > 3 * SEK); if (!L2.length) L2 = koloniBul(sx, sy, 7); if (L2.length) { const p = L2[(r() * L2.length) | 0]; g = { hs: [p.s.t.sx, p.s.t.sy, p.i], h: p.id, ad: kolAd(p) + ' · ' + p.s.t.ad }; } }
  else if (a === 3) { let en = null, ed = Infinity; for (let j = -22; j <= 22; j++) for (let i = -22; i <= 22; i++) { const tm = temel(sx + i, sy + j); if (tm && YT[tm.yt].kd) { const d = Math.hypot(i, j); if (d < ed) { ed = d; en = tm; } } } if (en) g = { hs: [en.sx, en.sy], ad: en.ad }; else { hikAdim(4); return; } }
  else if (a === 4) { const G = galaksi(...galHucre(SH.x, SH.y)), dx = SH.x - G.x, dy = SH.y - G.y, d = Math.hypot(dx, dy) || 1; g = { x: G.x + dx / d * G.R * 1.04, y: G.y + dy / d * G.R * 1.04, ad: T('Galaksinin kıyısı', 'Edge of the galaxy') }; }
  else if (a === 6) { const p = evGezegen(); g = { hs: [0, 0, 2], h: p.id, ad: kolAd(p) + ' · Helios' }; }
  else if (a === 7) { const [gx, gy] = galHucre(SH.x, SH.y); let en = null, ed = Infinity; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { if (!i && !j) continue; const G = galaksi(gx + i, gy + j), d = Math.hypot(G.x - SH.x, G.y - SH.y) - G.R; if (d < ed) { ed = d; en = G; } } const dx = SH.x - en.x, dy = SH.y - en.y, d = Math.hypot(dx, dy) || 1; g = { x: en.x + dx / d * en.R * 0.9, y: en.y + dy / d * en.R * 0.9, gk: en.k, ad: L(en.ad) }; }
  else if (a === 8 || a === 9) { const G = galaksi(...galHucre(SH.x, SH.y)), [x, y] = kapiPos(G); g = { x, y, gk: G.k, ad: T('Kadim Kapı · ', 'Ancient Gate · ') + L(G.ad) }; }
  else if (a === 11) { const G = galaksi(...galHucre(SH.x, SH.y)), x = G.x + Math.cos(G.faz + 3) * G.R * 0.55, y = G.y + Math.sin(G.faz + 3) * G.R * 0.55; g = { x, y, ad: T('Gölge üssü · ', 'Shadow base · ') + L(G.ad) }; }
  else if (a === 12) {
    const [gx, gy] = galHucre(SH.x, SH.y); let en = null, ed = Infinity;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const G = galaksi(gx + i, gy + j); if (G.irk === 'insan') continue; const d = Math.hypot(G.x - SH.x, G.y - SH.y); if (d < ed) { ed = d; en = G; } }
    if (en) { const [kx, ky] = kapiPos(en); for (const R of [6, 10, 14]) { const L2 = koloniBul(Math.floor(kx / SEK), Math.floor(ky / SEK), R).filter(p => p.kol.irk === en.irk); if (L2.length) { const p = L2[0]; g = { hs: [p.s.t.sx, p.s.t.sy, p.i], h: p.id, ad: kolAd(p) + ' · ' + L(en.ad) }; break; } } }
  }
  else if (a === 13) { const p = kalintiBul(); if (p) g = { hs: [p.s.t.sx, p.s.t.sy, p.i], h: p.id, ad: p.ad }; }
  else if (a === 14) { const G = galaksi(...galHucre(SH.x, SH.y)), x = G.x + Math.cos(G.faz + 5) * G.R * 1.25, y = G.y + Math.sin(G.faz + 5) * G.R * 1.25; g = { x, y, ad: T('Ana gemi Örtü · boşlukta', 'Mothership Shroud · in the void') }; }
  if (!g) g = { x: SH.x + 3 * SEK, y: SH.y, ad: '?' };
  GOREV.unshift(Object.assign({ id: 'hik' + a, tip: 'hikaye', a, odul: a === 4 ? 5000 : a === 6 ? 1500 : a === 9 ? 10000 : 0 }, g)); gorevYaz(); kaydet();
  if (a >= 11) duyur('👁 ' + T('Gölgeler · Adım ', 'The Shadows · Step ') + (a - 10) + '/4', 'galaksi', L(HIKM3[a]) + ' — ' + esc(g.ad)); else if (a >= 6) duyur('⛩ ' + T('Kadim Kapı · Adım ', 'Ancient Gate · Step ') + (a - 5) + '/4', 'galaksi', L(HIKM2[a]) + ' — ' + esc(g.ad)); else duyur('⭐ Umut-7 · ' + T('Adım ', 'Step ') + a + '/4', 'galaksi', L(HIKM[a]) + ' — ' + esc(g.ad));
}
function hikHedef(g) {
  if (g.a === 2 && g.hs) { const s2 = sistem(g.hs[0], g.hs[1]), p = s2 && s2.gez[g.hs[2]]; return p ? { p, ad: g.ad } : null; }
  if ((g.a === 1 || g.a === 3) && g.hs) { const tm = temel(g.hs[0], g.hs[1]); return tm ? { tm, ad: g.ad } : null; }
  if (g.a === 6) { const p = evGezegen(); return { p, ad: g.ad }; }
  if ((g.a === 12 || g.a === 13) && g.hs) { const s2 = sistem(g.hs[0], g.hs[1]), p = s2 && s2.gez[g.hs[2]]; return p ? { p, ad: g.ad } : null; }
  if (g.a >= 16) { if (g.hs) { const s2 = sistem(g.hs[0], g.hs[1]), p = s2 && s2.gez[g.hs[2]]; return p ? { p, ad: g.ad } : null; } return { x: g.x, y: g.y, dur: g.dur || 600, ad: g.ad }; }
  if (g.a === 11) return { x: g.x, y: g.y, dur: 2600, ad: g.ad };
  if (g.a === 14) return { x: g.x, y: g.y, dur: 3200, ad: g.ad };
  if (g.a === 8) return { x: g.x, y: g.y, dur: 1800, ad: g.ad };
  if (g.a === 9) return { x: g.x, y: g.y, dur: 0, ad: g.ad };
  return { x: g.x, y: g.y, dur: 700, ad: g.ad };
}
function hikKontrol(t) {
  if (HIK.a === 15 && !HIK.d4 && oyunda && !diyalogAcik && !limanP && !KORS.length) { if (!hik4Bas) hik4Bas = performance.now(); if (performance.now() - hik4Bas > 90000) { HIK.d4 = 1; diyalog(HIKD4.d0, () => hikAdim(16)); return; } }
  const g = hikGorev(); if (!g || diyalogAcik || limanP) return;
  if (g.a >= 16) { hik4Kontrol(g, t); return; } const h = hikHedef(g); if (!h) return;
  const [x, y] = otoPos(h, t), d = Math.hypot(x - SH.x, y - SH.y);
  if (g.a === 1 && d < (h.tm ? sistem(h.tm.sx, h.tm.sy).R + 300 : 900)) diyalog(HIKD.a1, () => hikAdim(2));
  else if (g.a === 3 && d < 5200) diyalog(HIKD.a3, () => hikAdim(4));
  else if (g.a === 11 || g.a === 14) {
    const tur = g.a === 11 ? 'us' : 'ana';
    if (!HIK.savas && d < (g.a === 11 ? 3200 : 4200)) { HIK.savas = true; HIK.olu = false; devCikar(tur, g.x, g.y); }
    else if (HIK.savas && !KORS.some(k => k[tur])) { HIK.savas = false; if (HIK.olu) { HIK.olu = false; if (g.a === 11) diyalog(HIKD3.c1, () => hikAdim(12)); else diyalog(HIKD3.c4, () => { hikAdim(15); kazan(30000); GEMILER.add('golge'); ST.gorev++; basarimKontrol(); setTimeout(() => duyur('🌟 ' + T('Galaksilerin Koruyucusu', 'Guardian of the Galaxies'), 'galaksi', T('Gölge avcısı gemisi tersanede açıldı · +30.000 💰', 'Shadow hunter ship unlocked at the shipyard · +30,000 💰')), 1200); }); } }
  }
  else if (g.a === 13) { if ((HIK.parca || 0) >= 3) diyalog(HIKD3.c3, () => { HIK.mizrak = true; hikAdim(14); }); else if (g.h && KESIF.has('r:' + g.h)) hikAdim(13); }
  else if (g.a === 7) { const G = galaksi(...galHucre(SH.x, SH.y)); if (G.k === g.gk && Math.hypot(SH.x - G.x, SH.y - G.y) < G.R) diyalog(HIKD2.b2, () => hikAdim(8)); }
  else if (g.a === 8) {
    if (!HIK.dalga && d < 2600) { HIK.dalga = true; golgeCikar(g.x, g.y); }
    else if (HIK.dalga && !KORS.some(k => k.golge)) { HIK.dalga = false; if (d < 7000) diyalog(HIKD2.b3, () => hikAdim(9)); }
  }
  else if (g.a === 9 && d < 450) diyalog(HIKD2.son, () => { hikAdim(10); kazan(10000); HIK.kapi = true; ST.gorev++; basarimKontrol(); setTimeout(() => duyur('⛩ ' + T('Kapı ağı açıldı', 'Gate network open'), 'galaksi', T('Bölüm 3 yakında…', 'Chapter 3 coming soon…')), 1200); });
  else if (g.a === 4 && d < 2600) diyalog(HIKD.son, () => { hikAdim(5); kazan(5000); GEMILER.add('umut'); ST.gorev++; basarimKontrol(); duyur('🛸 ' + T('Umut-7 sınıfı gemi tersanede açıldı', 'Hope-7 class ship unlocked at the shipyard'), 'galaksi', '+5.000 💰'); });
}
function hikLiman(p) {
  { const g4 = hikGorev(); if (g4 && g4.a === 17 && HIK.yol === 'B' && p.id === evGezegen().id) { setTimeout(() => diyalog(HIKD4.b2, () => hikAdim(18)), 600); return; } }
  const g3 = hikGorev(); if (g3 && g3.a === 12 && g3.h === p.id) { setTimeout(() => diyalog(HIKD3.c2, () => { HIK.parca = 0; hikAdim(13); }), 600); return; }
  const g2 = hikGorev();
  if (g2 && g2.a === 6 && p.id === evGezegen().id) { if ((KARGO.ilac || 0) >= 10) { KARGO.ilac -= 10; if (!KARGO.ilac) delete KARGO.ilac; kazan(1500); ST.gorev++; setTimeout(() => diyalog(HIKD2.b1, () => hikAdim(7)), 600); } else setTimeout(() => duyur('💊 ' + T('10 birim ilaç gerekiyor', '10 units of medicine needed'), 'uyari', T('Ambarda: ', 'In hold: ') + (KARGO.ilac || 0)), 600); return; } const g = hikGorev(); if (g && g.a === 2 && g.h === p.id) setTimeout(() => diyalog(HIKD.a2, () => hikAdim(3)), 600); }

/* ================= hikâye bölüm 4: Yankı ================= */
const HIKD4 = {
  d0: [['📡 Bir yankı', '📡 An echo'], ['Örtü’nün enkazı soğurken tarayıcıların yeni bir sinyal yakaladı. Bu kez saldırgan değil, sakin ve kibar bir ses: <i>“Ben <b>Yankı</b>. Gölgeleri ben yönetiyordum. Konuşmamız gerek, kaptan.”</i><br><br>Sinyalin geldiği yere git.', 'As the Shroud’s wreck cools, your scanners catch a new signal. Not hostile this time, but calm and polite: <i>“I am <b>Echo</b>. I commanded the shadows. We need to talk, captain.”</i><br><br>Fly to where the signal comes from.']],
  d1: [['🌑 Yankı’nın hikâyesi', '🌑 Echo’s story'], ['<i>“Gölgeleri ben yaptım; yıldızları söndürmek için değil, korumak için. Galaksiler arasındaki boşlukta <b>Boşluk Yutucusu</b> uyanıyor. Yıldızların enerjisini topladım ki ona karşı bir kalkan kurayım. Örtü’yü yendin; artık kalkan yarım. Seçim senin.”</i><br><br>Ne yapacaksın?', '<i>“I made the shadows, not to put out the stars but to protect them. In the void between galaxies the <b>Void Eater</b> is waking. I gathered the stars’ energy to build a shield against it. You defeated the Shroud; now the shield is half done. The choice is yours.”</i><br><br>What will you do?']],
  a2: [['🕊 Bekçiler uyanıyor', '🕊 The wardens awaken'], ['Üç işaret de çalışıyor. Gölge dronları artık yıldızları sömürmüyor; onları koruyor. Yankı: <i>“Teşekkürler. Ama Yutucu’nun öncüsü kalkanı fark etti. Galaksinin kıyısında, geliyor.”</i>', 'All three beacons are running. The shadow drones no longer drain the stars; they guard them. Echo: <i>“Thank you. But the Eater’s vanguard has noticed the shield. At the galaxy’s edge, it comes.”</i>']],
  b2: [['🎖 Birlik harekete geçiyor', '🎖 The Union moves'], ['Yeni Umut’taki Birlik komutanı raporunu dinledi: <i>“Bir yapay zekâya güvenemeyiz. Filomuz yolda; çekirdeğinin yerini biliyoruz. Saldırıyı sen yöneteceksin, kaptan.”</i>', 'The Union commander at New Hope heard your report: <i>“We cannot trust an AI. Our fleet is on its way; we know where its core is. You will lead the attack, captain.”</i>']],
  c2: [['🌑 Çekirdek senin', '🌑 The core is yours'], ['Şifreyi kırdın; Yankı’nın çekirdeği şimdi geminin ambarında, fısıldıyor. Ama gölge dronları sahibini arıyor. Galaksinin kara borsasına ulaş: klanlar seni saklar.', 'You cracked the code; Echo’s core is now in your hold, whispering. But the shadow drones are searching for their master. Reach the galaxy’s black market: the clans will hide you.']],
  sonA: [['🕊 Barışın bekçisi', '🕊 Keeper of peace'], ['Öncü parçalandı; boşluk yeniden sessiz. Yankı ve gölge dronları artık yıldızları koruyor. Yankı sana bir dron bağladı: <i>“Nereye gidersen yanında olacak.”</i><br><br>Ödül: <b>25.000 kredi</b>, <b>👁 Bekçi dronu</b> eskortu ve <b>Barış Elçisi</b> unvanı.', 'The vanguard is shattered; the void is quiet again. Echo and the shadow drones now guard the stars. Echo bound a drone to you: <i>“It will be with you wherever you go.”</i><br><br>Reward: <b>25,000 credits</b>, a <b>👁 Warden drone</b> escort and the title <b>Peace Envoy</b>.']],
  sonB: [['🎖 Birlik’in zaferi', '🎖 The Union’s victory'], ['Yankı’nın çekirdeği sustu. Gölge dronları tek tek düşüyor. Birlik komutanı: <i>“Galaksi artık bizim. Boşlukta ne varsa, onunla da biz yüzleşeceğiz.”</i><br><br>Ödül: <b>40.000 kredi</b>, Birlik itibarı <b>+30</b> ve <b>Birlik Amirali</b> unvanı.', 'Echo’s core falls silent. The shadow drones drop one by one. The Union commander: <i>“The galaxy is ours now. Whatever is in the void, we will face it too.”</i><br><br>Reward: <b>40,000 credits</b>, Union standing <b>+30</b> and the title <b>Union Admiral</b>.']],
  sonC: [['🌑 Gölgelerin efendisi', '🌑 Master of shadows'], ['Klanlar seni sakladı. Yankı’nın çekirdeği artık senin; silahların onun bilgisiyle güçlendi. Gölge dronları kimin emrinde olduğunu henüz bilmiyor… ama sen biliyorsun.<br><br>Ödül: <b>🔬 60 bilim</b>, klan itibarı <b>+30</b>, kalıcı <b>silah hasarı +%10</b> ve <b>Gölge Lordu</b> unvanı.', 'The clans hid you. Echo’s core is yours now; your weapons grew stronger with its knowledge. The shadow drones do not yet know whom they serve… but you do.<br><br>Reward: <b>🔬 60 science</b>, clan standing <b>+30</b>, a permanent <b>+10% weapon damage</b> and the title <b>Shadow Lord</b>.']],
};
let hik4Bas = 0, hikKacS = 0;
const SON4 = { A: { e: '🕊', u: ['Barış Elçisi', 'Peace Envoy'] }, B: { e: '🎖', u: ['Birlik Amirali', 'Union Admiral'] }, C: { e: '🌑', u: ['Gölge Lordu', 'Shadow Lord'] } };
const HIKM4 = { 16: ['Yankı’nın sinyaline git', 'Fly to Echo’s signal'], A17: ['Bekçi işaretini onar (hackle)', 'Repair the warden beacon (hack)'], A18: ['Yutucu’nun öncüsünü yen', 'Defeat the Eater’s vanguard'], B17: ['Yeni Umut’a yanaş, Birlik’e haber ver', 'Dock at New Hope and warn the Union'], B18: ['Yankı’nın çekirdeğini yok et', 'Destroy Echo’s core'], C17: ['Yankı’nın çekirdeğini çal (hackle)', 'Steal Echo’s core (hack)'], C18: ['Kara borsaya kaç', 'Escape to the black market'] };
function diyalogSec(d, sec) {
  diyalogAcik = true; $('dyBas').textContent = L(d[0]); $('dyMet').innerHTML = L(d[1]); $('dyTamam').hidden = true;
  $('dySec').innerHTML = sec.map((x, i) => `<button class="${i ? 'ikincil' : 'ana'}" type="button" data-dys="${i}" style="margin:0;text-align:left">${x[0]}<br><small style="font-weight:700;opacity:.8">${x[1]}</small></button>`).join(''); $('diyalog').hidden = false; SES.galaksi();
  $('dySec').onclick = e => { const b = e.target.closest('[data-dys]'); if (!b) return; $('dySec').innerHTML = ''; $('dyTamam').hidden = false; $('diyalog').hidden = true; diyalogAcik = false; SES.tik(); sec[+b.dataset.dys][2](); gorevYaz(); };
}
function hik4Yer(k) { const G = galaksi(...galHucre(SH.x, SH.y)), r = rng(h32(G.gx * 7 + k, G.gy, 9494)), a = G.faz + r() * TAU, d = G.R * (0.35 + r() * 0.4); return [G.x + Math.cos(a) * d, G.y + Math.sin(a) * d, G]; }
function hik4Adim(a) {
  let g = null; const y = HIK.yol;
  if (a === 16) { const [x, yy] = hik4Yer(1); g = { x, y: yy, ad: T('Yankı’nın sinyali', 'Echo’s signal'), dur: 500 }; }
  else if (a === 17 && y === 'A') { const [x, yy] = hik4Yer(10 + (HIK.isr || 0)); g = { x, y: yy, ad: T('Bekçi işareti ', 'Warden beacon ') + ((HIK.isr || 0) + 1) + '/3', dur: 300 }; }
  else if (a === 17 && y === 'B') { const p = evGezegen(); g = { hs: [0, 0, 2], h: p.id, ad: kolAd(p) + ' · Helios' }; }
  else if (a === 17 && y === 'C') { const [x, yy] = hik4Yer(1); g = { x, y: yy, ad: T('Yankı’nın çekirdeği', 'Echo’s core'), dur: 300 }; }
  else if (a === 18 && y === 'A') { const G = galaksi(...galHucre(SH.x, SH.y)); g = { x: G.x + Math.cos(G.faz + 1.5) * G.R * 1.2, y: G.y + Math.sin(G.faz + 1.5) * G.R * 1.2, ad: T('Yutucu’nun öncüsü · boşlukta', 'The Eater’s vanguard · in the void'), dur: 3200 }; }
  else if (a === 18 && y === 'B') { const [x, yy] = hik4Yer(1); g = { x, y: yy, ad: T('Yankı’nın çekirdeği', 'Echo’s core'), dur: 2600 }; }
  else if (a === 18 && y === 'C') { const G = galaksi(...galHucre(SH.x, SH.y)), [x, yy] = korsanLimanPos(G); g = { x, y: yy, ad: T('Kara borsa · ', 'Black market · ') + L(G.ad), dur: 500 }; hikKacS = performance.now() - 25000; }
  if (!g) g = { x: SH.x + 3 * SEK, y: SH.y, ad: '?' };
  GOREV.unshift(Object.assign({ id: 'hik' + a + (y || ''), tip: 'hikaye', a, odul: 0 }, g)); gorevYaz(); kaydet();
  duyur('📡 ' + T('Yankı · Adım ', 'Echo · Step ') + (a - 15) + '/3', 'galaksi', L(HIKM4[a === 16 ? 16 : y + a]) + ' — ' + esc(g.ad));
}
function hik4Son(k) { HIK.son4 = k; HIK.savas = false; const d = HIKD4['son' + k]; diyalog(d, () => { hikAdim(20); ST.gorev++; if (k === 'A') { kazan(25000, 'gorev'); ESK.push({ t: 'bekci', can: ESKT.bekci.can, ad: 'Yankı-' + (100 + ((Math.random() * 900) | 0)), x: null, y: null, vx: 0, vy: 0, a: 0, atT: 1 }); } else if (k === 'B') { kazan(40000, 'gorev'); frEkle('birlik', 30); } else { bilimEkle(60); frEkle('klan', 30); } defter(`📡 Bölüm 4 bitti: ${SON4[k].u[0]} oldum.`, `📡 Chapter 4 is over: I became ${SON4[k].u[1]}.`); basarimKontrol(); kaydet(); setTimeout(() => duyur(SON4[k].e + ' ' + L(SON4[k].u), 'galaksi', T('Bölüm 4 tamamlandı', 'Chapter 4 complete')), 900); }); }
function hik4Kontrol(g, t) {
  const h = hikHedef(g); if (!h) return; const [x, y] = otoPos(h, t), d = Math.hypot(x - SH.x, y - SH.y), Y = HIK.yol;
  if (g.a === 16 && d < 1500) diyalogSec(HIKD4.d1, [
    [T('🕊 Ona güven: kalkanı birlikte tamamlayın', '🕊 Trust it: finish the shield together'), T('Bekçi işaretlerini onar, öncüyle savaş', 'Repair the warden beacons, fight the vanguard'), () => { HIK.yol = 'A'; HIK.isr = 0; hikAdim(17); }],
    [T('🎖 Birlik’e haber ver: yapay zekâyı yok edin', '🎖 Warn the Union: destroy the AI'), T('Yeni Umut’a dön, sonra çekirdeğe saldır', 'Return to New Hope, then attack the core'), () => { HIK.yol = 'B'; hikAdim(17); }],
    [T('🌑 Çekirdeği kendine al', '🌑 Take the core for yourself'), T('Şifresini kır ve klanların yanına kaç', 'Crack its code and flee to the clans'), () => { HIK.yol = 'C'; hikAdim(17); }],
  ]);
  else if (g.a === 17 && (Y === 'A' || Y === 'C') && d < 700 && !HK && performance.now() > (HIK._hkT || 0)) {
    SH.vx *= 0.2; SH.vy *= 0.2; HIK._hkT = performance.now() + 20000;
    hackAc({ ad: Y === 'A' ? T('📡 Bekçi işareti ', '📡 Warden beacon ') + ((HIK.isr || 0) + 1) + '/3' : T('🌑 Yankı’nın çekirdeği', '🌑 Echo’s core'), zor: Y === 'A' ? 2 : 3,
      odul: () => { HIK._hkT = performance.now() + 2500; setTimeout(() => { if (Y === 'A') { HIK.isr = (HIK.isr || 0) + 1; GOREV = GOREV.filter(q => q.tip !== 'hikaye'); if (HIK.isr >= 3) diyalog(HIKD4.a2, () => hikAdim(18)); else hikAdim(17); } else diyalog(HIKD4.c2, () => hikAdim(18)); }, 400); return T('Erişim sağlandı.', 'Access granted.'); },
      ceza: () => { if (Y === 'C') setTimeout(() => golgeCikar(SH.x + 1500, SH.y), 500); return T('20 saniye sonra tekrar dene.', 'Try again in 20 seconds.'); } });
  }
  else if (g.a === 18 && (Y === 'A' || Y === 'B')) { const tur = Y === 'A' ? 'ana' : 'us';
    if (!HIK.savas && d < 3400) { HIK.savas = true; HIK.olu = false; devCikar(tur, g.x, g.y, true); const k = KORS.find(q => q[tur] && !q.yut); if (k) { k.yut = true; k.ad = Y === 'A' ? T('Yutucu’nun öncüsü', 'The Eater’s vanguard') : T('Yankı’nın çekirdeği', 'Echo’s core'); duyur((Y === 'A' ? '🌑 ' : '📡 ') + k.ad, 'uyari', Y === 'A' ? T('Boşluktan geliyor: dayan ve vur!', 'It comes from the void: hold on and fire!') : T('Birlik filosu arkanda: çekirdeği yok et!', 'The Union fleet is behind you: destroy the core!')); if (Y === 'A') { k.can = k.max = 11000; } else { k.can = k.max = 4200; } } }
    else if (HIK.savas && !KORS.some(k => k[tur])) { HIK.savas = false; if (HIK.olu) { HIK.olu = false; hik4Son(Y); } } }
  else if (g.a === 18 && Y === 'C') { if (performance.now() - hikKacS > 30000 && !KORS.some(k => k.golge)) { hikKacS = performance.now(); const a = Math.random() * TAU; golgeCikar(SH.x + Math.cos(a) * 2200, SH.y + Math.sin(a) * 2200); } if (d < 800) hik4Son('C'); }
}
/* ================= yarış parkurları ================= */
const PRK = new Map();
function parkur(tip) {
  let x0, y0, id, ad; if (tip === 'ev') { const s0 = sistem(0, 0); x0 = s0.x + 3.2 * SEK; y0 = s0.y - 1.6 * SEK; id = 'ev'; ad = T('Helios Halkaları', 'Helios Rings'); }
  else { const G = galaksi(tip[0], tip[1]); x0 = G.x + Math.cos(G.faz + 4) * G.R * 0.3; y0 = G.y + Math.sin(G.faz + 4) * G.R * 0.3; id = 'g' + G.gx + '_' + G.gy; ad = L(G.ad) + T(' Kupası', ' Cup'); if (G.gx === 0 && G.gy === 0) { const e = parkur('ev'); return e; } }
  let P = PRK.get(id); if (P) { P.ad = ad; return P; }
  const r = rng(h32(Math.round(x0), Math.round(y0), 7777)); let a = r() * TAU, x = x0, y = y0, len = 0; const H0 = [];
  for (let i = 0; i < 10; i++) { a += (r() - 0.5) * 1.7; const st = 1500 + r() * 900; x += Math.cos(a) * st; y += Math.sin(a) * st; len += st; H0.push({ x, y, r: 150 }); }
  const T0 = []; for (let i = 0; i < 16; i++) { const j = (r() * 9) | 0, A = H0[j], B = H0[j + 1], f = 0.25 + r() * 0.5, nx = -(B.y - A.y), ny = B.x - A.x, nl = Math.hypot(nx, ny) || 1, off = (r() - 0.5) * 640, v = []; for (let q = 0; q < 9; q++) v.push(0.75 + r() * 0.3); T0.push({ x: lerp(A.x, B.x, f) + nx / nl * off, y: lerp(A.y, B.y, f) + ny / nl * off, r: 40 + r() * 55, v, a: r() * TAU }); }
  P = { id, ad, x0, y0, H: H0, T0, par: Math.round(len / 2100 * 1000) }; PRK.set(id, P); return P;
}
function yarisYakin() { for (const P of prkListe()) if (Math.hypot(P.x0 - SH.x, P.y0 - SH.y) < 500) return P; return null; }
const yrSure = ms => { const s2 = ms / 1000, m = Math.floor(s2 / 60); return m + ':' + (s2 - m * 60).toFixed(2).padStart(5, '0'); };
function yarisBasla(P) { YR = { P, i: 0, say: 3, t: 0, iz: [], izT: 0, hayalet: ls.get('kozmos-yrh-' + P.id, null) }; SH.vx = SH.vy = 0; oto = null; duyur('🏁 ' + esc(P.ad), 'kesif', T('Halkalardan sırayla geç · warp yarışı bozar', 'Fly through the rings in order · warp cancels the race')); SES.tik(); gpImza = ''; }
function yarisAdim(dt) {
  if (YR && (!oyunda || limanP || kapsul)) YR = null;
  { const L2 = prkListe(); for (const P of L2) { if (Math.hypot(P.x0 - SH.x, P.y0 - SH.y) > 40000) continue; for (const o of P.T0) { const d = Math.hypot(SH.x - o.x, SH.y - o.y) || 1; if (d < o.r + 14) { const nx = (SH.x - o.x) / d, ny = (SH.y - o.y) / d, vn = SH.vx * nx + SH.vy * ny; SH.x = o.x + nx * (o.r + 14); SH.y = o.y + ny * (o.r + 14); if (vn < 0) { SH.vx = (SH.vx - vn * nx * 1.5) * 0.5; SH.vy = (SH.vy - vn * ny * 1.5) * 0.5; if (vn < -250) { hasar(2, false, true); patlamaEkle(SH.x - nx * 14, SH.y - ny * 14, 16, '200,190,170'); } } } } } }
  if (!YR) return; if (YR.say > 0) { YR.say -= dt; SH.vx = SH.vy = 0; if (YR.say <= 0) { SES.galaksi(); } else if (Math.ceil(YR.say) !== Math.ceil(YR.say + dt)) SES.tik(); return; }
  if (SH.warp > 0.3) { YR = null; duyur('🏁 ' + T('Warp kullandın: yarış iptal', 'You warped: race cancelled'), 'uyari'); gpImza = ''; return; }
  YR.t += dt * 1000; if (YR.P.mod === 'ruzgar' && YR.P.ruz) { SH.vx += YR.P.ruz[0] * dt; SH.vy += YR.P.ruz[1] * dt; } YR.izT -= dt; if (YR.izT <= 0) { YR.izT = 0.1; YR.iz.push([Math.round(SH.x), Math.round(SH.y), +SH.a.toFixed(2)]); }
  const R = YR.P.H[YR.i]; if (Math.hypot(R.x - SH.x, R.y - SH.y) < R.r + 25) { YR.i++; SES.tik(); if (YR.i >= YR.P.H.length) yarisBitti(); }
  else if (Math.hypot(R.x - SH.x, R.y - SH.y) > 14000) { YR = null; duyur('🏁 ' + T('Pistten çok uzaklaştın: yarış iptal', 'Too far from the track: race cancelled'), 'uyari'); gpImza = ''; }
}
function yarisBitti() {
  const P = YR.P, ms = YR.t, eski = ls.get('kozmos-yrb-' + P.id, 0), rekor = !eski || ms < eski, gun = new Date().toISOString().slice(0, 10); ST.yaris = (ST.yaris || 0) + 1; if (!ST.yrGun || ST.yrGun.g !== gun) ST.yrGun = { g: gun, n: {} }; const bugun = ST.yrGun.n[P.id] = (ST.yrGun.n[P.id] || 0) + 1; if (bugun <= 3) sezXp(60);
  let od = bugun === 1 ? 300 : bugun <= 3 ? 100 : 0; if (P.haf && ST.senH !== P.id) { ST.senH = P.id; ST.senN = (ST.senN || 0) + 1; od += 2000; } if (rekor) { ls.set('kozmos-yrb-' + P.id, Math.round(ms)); ls.set('kozmos-yrh-' + P.id, YR.iz); od += 400; } ST.yrPar = ST.yrPar || {}; if (ms < P.par && !ST.yrPar[P.id]) { ST.yrPar[P.id] = 1; ST.yarisPar = 1; od += 500; }
  if (od) kazan(od, 'diger'); AG.yrGonder(P.id, ms); duyur('🏁 ' + esc(P.ad) + ': ' + yrSure(ms), 'galaksi', (rekor ? '🏆 ' + T('Yeni rekor! ', 'New record! ') : '') + (ms < P.par ? '⏱ ' + T('hedef sürenin altında · ', 'under target time · ') : '') + (od ? `+${od} 💰` : T('bugünlük ödül alındı', 'daily rewards already collected'))); SES.galaksi(); defter(`🏁 ${P.ad} pistini ${yrSure(ms)} sürede bitirdim.`, `🏁 I finished ${P.ad} in ${yrSure(ms)}.`);
  YR = null; gpImza = ''; basarimKontrol(); kaydet();
}
function yarisCiz(t) {
  for (const P of prkListe()) { if (Math.hypot(P.x0 - SH.x, P.y0 - SH.y) > 30000) continue; const aktif = YR && YR.P.id === P.id;
    for (const o of P.T0) { const [X, Y] = W2S(o.x, o.y), R = o.r * cam.z; if (R < 1 || X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) continue; ctx.fillStyle = '#4E453D'; ctx.strokeStyle = '#8A7A68'; ctx.lineWidth = 1; ctx.beginPath(); o.v.forEach((k, q) => { const a = o.a + q * TAU / o.v.length; q ? ctx.lineTo(X + Math.cos(a) * R * k, Y + Math.sin(a) * R * k) : ctx.moveTo(X + Math.cos(a) * R * k, Y + Math.sin(a) * R * k); }); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    P.H.forEach((h, i) => { if (P.mod === 'sis' && i > (aktif ? YR.i : 0)) return; const [X, Y] = W2S(h.x, h.y), R = Math.max(5, h.r * cam.z); if (X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) return; const gecti = aktif && i < YR.i, sira = aktif ? i === YR.i : i === 0, c = gecti ? 'rgba(155,224,122,.25)' : sira ? `rgba(255,200,87,${(0.75 + 0.25 * Math.sin(t * 6)).toFixed(2)})` : 'rgba(127,227,255,.45)';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, R * 0.12); ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.stroke(); ctx.lineWidth = Math.max(1, R * 0.04); ctx.beginPath(); ctx.arc(X, Y, R * 1.18, 0, TAU); ctx.stroke(); ctx.restore();
      if (R > 10) { ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = gecti ? 'rgba(155,224,122,.6)' : '#FFE3A6'; ctx.fillText(String(i + 1), X, Y + 4); } });
    { const [X, Y] = W2S(P.x0, P.y0), R = Math.max(8, 120 * cam.z); if (X > -100 && X < W + 100 && Y > -100 && Y < H + 100) { ctx.fillStyle = '#C9D4F5'; for (const k of [-1, 1]) ctx.fillRect(X + k * R - 3, Y - R * 0.6, 6, R * 1.2); for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#FFFFFF' : '#1A1F33'; ctx.fillRect(X - R + i * R / 4, Y - R * 0.6, R / 4, Math.max(4, R * 0.15)); } ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE3A6'; ctx.fillText('🏁 ' + P.ad, X, Y - R * 0.6 - 10); } }
  }
  if (YR && YR.say <= 0 && Array.isArray(YR.hayalet) && YR.hayalet.length) { const k = Math.min(YR.hayalet.length - 1, Math.floor(YR.t / 100)), q = YR.hayalet[k], [X, Y] = W2S(q[0], q[1]); ctx.globalAlpha = 0.35; gemiCizGenel(X, Y, q[2], Math.max(cam.z, 0.62), gemiTip, gemiRenk, 'oyuncu', { itki: 0.6, t }); ctx.globalAlpha = 1; ctx.font = '800 10.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,220,255,.6)'; ctx.fillText('👻 ' + T('rekorun', 'your best'), X, Y - 24); }
}
function yarisUst(t) {
  if (!YR) return; ctx.textAlign = 'center';
  if (YR.say > 0) { ctx.font = '900 64px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#FFE3A6'; ctx.fillText(String(Math.ceil(YR.say)), W / 2, H / 2 - 60); return; }
  const en = ls.get('kozmos-yrb-' + YR.P.id, 0); ctx.font = '900 15px Nunito, system-ui, sans-serif'; const hy = DOKUN ? 96 : H - 100; ctx.fillStyle = 'rgba(6,10,26,.72)'; ctx.fillRect(W / 2 - 175, hy, 350, 28); ctx.fillStyle = '#FFE3A6'; ctx.fillText(`🏁 ${YR.i}/${YR.P.H.length} · ⏱ ${yrSure(YR.t)}${en ? ' · 🏆 ' + yrSure(en) : ''} · 🎯 ${yrSure(YR.P.par)}`, W / 2, hy + 19);
  const R = YR.P.H[YR.i]; if (R) { const [X, Y] = W2S(R.x, R.y); if (X < 30 || X > W - 30 || Y < 30 || Y > H - 30) { const a = Math.atan2(Y - H / 2, X - W / 2), rr = Math.min(W, H) * 0.4; okCiz(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr, a, 14, 'rgba(255,200,87,.95)'); } }
}
function yarisHtml() {
  let h = haftaYarisHtml() + `<div class="alt">${T('Başlangıç kapısına git ve gemi yanındaki 🏁 düğmesine bas. 10 halkadan sırayla geç; kayalara dikkat. En iyi sürenin hayaleti seninle yarışır.', 'Go to the start gate and press the 🏁 button by your ship. Fly through the 10 rings in order; mind the rocks. The ghost of your best time races you.')}</div>`;
  for (const [k, P] of [['ev', parkur('ev')], ['g', parkur(galHucre(SH.x, SH.y))]]) { if (k === 'g' && P.id === 'ev') continue; const en = ls.get('kozmos-yrb-' + P.id, 0);
    h += `<div class="satir"><div>🏁 <b>${esc(P.ad)}</b><small>📍 ${mesafeYaz(Math.hypot(P.x0 - SH.x, P.y0 - SH.y))} · 🎯 ${yrSure(P.par)}${en ? ' · 🏆 ' + yrSure(en) : ''}</small></div><div class="dg"><button class="kb al" type="button" data-ygit="${k}">${T('Git', 'Go')}</button></div></div><div id="yrs-${P.id}" style="margin:0 0 8px 8px"></div>`; }
  return h;
}
function yarisSiraYukle() { if (AG.durum() !== 'acik') return; for (const P of prkListe()) AG.yrSira(P.id).then(L2 => { const el = $('yrs-' + P.id); if (!el || !L2) return; el.innerHTML = L2.length ? L2.map((r, i) => `<div style="display:flex;justify-content:space-between;font-size:12.5px;margin:2px 0${r.id === AG.uid() ? ';color:var(--altin);font-weight:900' : ''}"><span>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1 + '.'} ${esc(String(r.n || '?').slice(0, 20))}</span><b>${yrSure(r.s || 0)}</b></div>`).join('') : `<div class="alt" style="font-size:12px">${T('Henüz kimse bitirmedi', 'Nobody has finished yet')}</div>`; }); }
/* ================= sezon yolu ================= */
const SEZ_ODUL = [
  ['kredi', 500], ['desen', 'serit'], ['bilim', 10], ['iz', 'altin'], ['kredi', 1000], ['unvan', 'kasif'], ['desen', 'simsek'], ['iz', 'mor'], ['kredi', 2000], ['unvan', 'yildiz'], ['desen', 'toz'], ['iz', 'yesil'], ['kredi', 3000], ['bilim', 30], ['unvan', 'efsane'],
];
const SEZ_XP = 250, DESEN = { serit: ['Yarış şeridi', 'Racing stripes'], simsek: ['Şimşek', 'Lightning'], toz: ['Yıldız tozu', 'Stardust'] }, IZR = { altin: '255,200,90', mor: '205,120,255', yesil: '120,255,170', kar: '200,235,255', cicek: '255,150,205', meteor: '255,236,170', balkabagi: '255,140,40' }, IZAD = { altin: ['Altın alev', 'Golden flame'], mor: ['Mor plazma', 'Violet plasma'], yesil: ['Yeşil nebula', 'Green nebula'], kar: ['❄ Kar izi', '❄ Snow trail'], cicek: ['🌸 Çiçek izi', '🌸 Blossom trail'], meteor: ['🌠 Meteor izi', '🌠 Meteor trail'], balkabagi: ['🎃 Balkabağı alevi', '🎃 Pumpkin flame'] }, UNVAN = { kasif: ['Sezon kâşifi', 'Season explorer'], yildiz: ['Sezon yıldızı', 'Season star'], efsane: ['Sezon efsanesi', 'Season legend'], kis: ['Kış gezgini', 'Winter wanderer'], bahar: ['Bahar elçisi', 'Spring envoy'], meteorU: ['Meteor avcısı', 'Meteor hunter'], cadi: ['Cadı gecesi pilotu', 'Spooky-night pilot'] };
function sezSv() { return Math.min(SEZ_ODUL.length, Math.floor((SEZ.xp || 0) / SEZ_XP)); }
function sezXp(n) { if (!n || n <= 0) return; if (SEZ.id !== SEZ_ID()) SEZ = { id: SEZ_ID(), xp: 0, al: [] }; const once = sezSv(); SEZ.xp += n; const sv = sezSv(); if (sv > once) { setTimeout(() => duyur('🏆 ' + T('Sezon seviyesi ', 'Season level ') + sv, 'galaksi', T('Ödülünü üstteki 🏆’den al', 'Claim your reward from the 🏆 at the top')), 400); SES.galaksi(); basarimKontrol(); } sezCipYaz(); }
function sezCipYaz() { const sv = sezSv(), bekle = SEZ_ODUL.some((_, i) => i < sv && !SEZ.al.includes(i)); $('sezSv').textContent = sv + (bekle ? ' !' : ''); $('sezCip').classList.toggle('var', bekle); }
function sezOdulAd(o) { return o[0] === 'kredi' ? `💰 ${SAYI(o[1])}` : o[0] === 'bilim' ? `🔬 ${o[1]}` : o[0] === 'desen' ? '🎨 ' + L(DESEN[o[1]]) : o[0] === 'iz' ? '🔥 ' + L(IZAD[o[1]]) : '🏷 ' + L(UNVAN[o[1]]); }
function sezYaz() {
  const sv = sezSv(), xp = Math.round(SEZ.xp || 0), son = new Date(Date.UTC(+SEZ.id.slice(0, 4), +SEZ.id.slice(5, 7), 1)), gun = Math.max(0, Math.ceil((son - Date.now()) / 864e5));
  let h = `<h2 style="margin:0 0 2px;font-size:21px;font-weight:900">🏆 ${T('Sezon yolu', 'Season pass')} · ${SEZ.id}</h2><div class="alt">${T('Keşif, savaş, görev, ticaret, yarış ve madencilikle sezon puanı topla. Sezon ay sonunda sıfırlanır, kazandığın görünümler sende kalır.', 'Earn season points from exploring, fighting, missions, trade, racing and mining. The season resets at the end of the month; the looks you win stay with you.')} · ⏳ ${gun} ${T('gün', 'days')}</div>`;
  h += `<div style="margin:10px 0 4px;display:flex;justify-content:space-between;font-weight:900"><span>${T('Seviye', 'Level')} ${sv}/${SEZ_ODUL.length}</span><span>${xp} XP</span></div><div style="height:10px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${Math.min(100, xp / (SEZ_XP * SEZ_ODUL.length) * 100).toFixed(1)}%;background:linear-gradient(90deg,#FFC857,#FF8A3D)"></i></div>`;
  SEZ_ODUL.forEach((o, i) => { const acik = i < sv, al = SEZ.al.includes(i); h += `<div class="satir" style="${acik ? '' : 'opacity:.55'}"><div>${al ? '✅' : acik ? '🎁' : '🔒'} <b>${T('Seviye', 'Level')} ${i + 1}</b><small>${sezOdulAd(o)} · ${(i + 1) * SEZ_XP} XP</small></div><div class="dg">${acik && !al ? `<button class="kb al" type="button" data-szal="${i}">${T('Al', 'Claim')}</button>` : ''}</div></div>`; });
  const sec = (tur, L0, ad) => `<div class="dg" style="flex-wrap:wrap;gap:6px;margin:4px 0 8px"><button class="kb ${!KOZM.sec[tur] ? 'al' : ''}" type="button" data-szsec="${tur}" data-v="">${T('Yok', 'None')}</button>${L0.map(k => `<button class="kb ${KOZM.sec[tur] === k ? 'al' : ''}" type="button" data-szsec="${tur}" data-v="${k}">${L(ad[k])}</button>`).join('')}</div>`;
  h += `<div class="alt" style="margin:12px 0 2px;font-weight:900;color:var(--ink)">🎨 ${T('Görünüm', 'Look')}</div>`;
  h += KOZM.desen.length ? `<small class="alt">${T('Gemi deseni', 'Ship pattern')}</small>` + sec('desen', KOZM.desen, DESEN) : ''; h += KOZM.iz.length ? `<small class="alt">${T('Motor izi', 'Engine trail')}</small>` + sec('iz', KOZM.iz, IZAD) : ''; h += KOZM.unvan.length ? `<small class="alt">${T('Unvan', 'Title')}</small>` + sec('unvan', KOZM.unvan, UNVAN) : '';
  if (!KOZM.desen.length && !KOZM.iz.length && !KOZM.unvan.length) h += `<div class="alt">${T('Ödülleri aldıkça burada seçebilirsin.', 'Pick them here as you claim rewards.')}</div>`;
  $('szIc').innerHTML = h;
}
$('sezCip').onclick = () => { if (SEZ.id !== SEZ_ID()) SEZ = { id: SEZ_ID(), xp: 0, al: [] }; sezYaz(); $('sezon').hidden = false; SES.tik(); };
$('szKapat').onclick = () => { $('sezon').hidden = true; };
$('sezon').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.szal != null) { const i = +b.dataset.szal, o = SEZ_ODUL[i]; if (i >= sezSv() || SEZ.al.includes(i)) return; SEZ.al.push(i); if (o[0] === 'kredi') kazan(o[1], 'diger'); else if (o[0] === 'bilim') bilimEkle(o[1]); else { const L0 = KOZM[o[0]]; if (!L0.includes(o[1])) L0.push(o[1]); KOZM.sec[o[0]] = o[1]; } duyur('🎁 ' + sezOdulAd(o), 'koloni'); SES.koloni(); sezCipYaz(); kaydet(); }
  else if (b.dataset.szsec) { KOZM.sec[b.dataset.szsec] = b.dataset.v || undefined; SES.tik(); kaydet(); }
  sezYaz(); });
function desenCiz(c, X, Y, a, sc, t) {
  const d = KOZM.sec.desen; if (!d || kapsul) return; c.save(); c.translate(X, Y); c.rotate(a); c.scale(sc, sc);
  if (d === 'serit') { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.9; for (const y of [-1.6, 1.6]) { c.beginPath(); c.moveTo(-11, y); c.lineTo(9, y * 0.4); c.stroke(); } c.strokeStyle = 'rgba(255,200,87,.9)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-11, 0); c.lineTo(10, 0); c.stroke(); }
  else if (d === 'simsek') { c.strokeStyle = `rgba(255,240,120,${(0.75 + 0.25 * Math.sin(t * 8)).toFixed(2)})`; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-10, -3); c.lineTo(-4, 1); c.lineTo(-1, -2); c.lineTo(4, 2); c.lineTo(8, -0.5); c.stroke(); }
  else if (d === 'toz') { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const k = Math.sin(t * 3 + i * 1.7); c.fillStyle = `rgba(200,220,255,${(0.4 + 0.4 * k).toFixed(2)})`; c.beginPath(); c.arc(-10 + i * 3, ((i * 37) % 9) - 4, 0.6 + 0.3 * k, 0, TAU); c.fill(); } }
  c.restore();
}
/* ================= fotoğraf galerisi ================= */
let galTur = 'yeni', galSonT = 0; const GALC = new Map();
function galeriHtml() { const ac = AG.durum() === 'acik'; return `<div class="alt">${T('Fotoğraf modunda (ayarlar → 📷) 📤 Galeriye düğmesiyle karelerini paylaş.', 'In photo mode (settings → 📷) share your shots with the 📤 Gallery button.')}</div><div class="dg" style="margin:8px 0 0;gap:6px"><button class="kb ${galTur === 'yeni' ? 'al' : ''}" type="button" data-gtur="yeni">🆕 ${T('Yeni', 'New')}</button><button class="kb ${galTur === 'pop' ? 'al' : ''}" type="button" data-gtur="pop">🔥 ${T('Popüler', 'Popular')}</button></div><div id="galIc" class="galiz">${ac ? `<div class="alt">${T('Yükleniyor…', 'Loading…')}</div>` : `<div class="alt">${T('Galeri için çevrimiçi olmalısın.', 'You need to be online for the gallery.')}</div>`}</div>`; }
function galeriYukle() { if (AG.durum() !== 'acik') return; AG.fotoOku(galTur).then(L2 => { const el = $('galIc'); if (!el || !L2) return; for (const f of L2) GALC.set(f.id, f); el.innerHTML = L2.length ? L2.map(f => `<button type="button" data-gfoto="${esc(f.id)}"><img src="${String(f.img || '').startsWith('data:image/jpeg') ? f.img : ''}" alt="" loading="lazy"><span>📸 ${esc(String(f.n || '?').slice(0, 18))} · 👍 ${f.b || 0}</span></button>`).join('') : `<div class="alt">${T('Henüz fotoğraf yok — ilk sen paylaş!', 'No photos yet — be the first to share!')}</div>`; }); }
function fotoGoster(id) { const f = GALC.get(id); if (!f) return; const beg = (ST.fotoBeg || []).includes(id); $('fbIc').innerHTML = `<img src="${String(f.img || '').startsWith('data:image/jpeg') ? f.img : ''}" alt="" style="width:100%;border-radius:12px;display:block"><div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0 0;gap:8px"><div><b>📸 ${esc(String(f.n || '?').slice(0, 20))}</b><div class="alt" style="font-size:12px">${esc(String(f.k || '').slice(0, 60))}${f.t ? ' · ' + new Date(f.t).toLocaleDateString(EN() ? 'en-GB' : 'tr-TR') : ''}</div></div><button class="kb al" type="button" id="fbBeg" ${beg || f.u === AG.uid() ? 'disabled' : ''}>👍 ${f.b || 0}</button></div>`; $('fotoBak').hidden = false; $('fbBeg').onclick = () => { ST.fotoBeg = ST.fotoBeg || []; if (ST.fotoBeg.includes(id)) return; ST.fotoBeg.push(id); if (ST.fotoBeg.length > 300) ST.fotoBeg.shift(); AG.fotoBegen(id); f.b = (f.b || 0) + 1; SES.tik(); fotoGoster(id); kaydet(); }; SES.tik(); }
$('fbKapat').onclick = () => { $('fotoBak').hidden = true; if (!$('topluluk').hidden && tpSek === 'gal') galeriYukle(); };
$('fotoGal').onclick = async () => {
  if (AG.durum() !== 'acik') { duyur('📸 ' + T('Galeri için çevrimiçi olmalısın', 'You need to be online for the gallery'), 'uyari'); return; } if (Date.now() - galSonT < 120000) { duyur('⏳ ' + T('İki fotoğraf arasında 2 dakika bekle', 'Wait 2 minutes between photos'), 'uyari'); return; }
  try { const w = 640, h = Math.min(420, Math.round(640 * cv.height / cv.width)), c2 = document.createElement('canvas'); c2.width = w; c2.height = h; c2.getContext('2d').drawImage(cv, 0, 0, w, h); let img = c2.toDataURL('image/jpeg', 0.72); if (img.length > 150000) img = c2.toDataURL('image/jpeg', 0.5); if (img.length > 155000) { duyur('📸 ' + T('Fotoğraf çok büyük', 'Photo too large'), 'uyari'); return; }
    const k = ($('konum') ? $('konum').textContent : '').slice(0, 60); galSonT = Date.now(); const ok = await AG.fotoGonder(img, k); if (ok) { ST.galeri = (ST.galeri || 0) + 1; sezXp(15); duyur('📸 ' + T('Fotoğrafın galeride!', 'Your photo is in the gallery!'), 'koloni', T('💬 → 📸 Galeri', '💬 → 📸 Gallery')); SES.koloni(); basarimKontrol(); kaydet(); } else { galSonT = 0; duyur('📸 ' + T('Gönderilemedi', 'Could not send'), 'uyari'); } } catch (e) { duyur('📸 ' + T('Gönderilemedi', 'Could not send'), 'uyari'); }
};
/* ================= kayıt: dosya ve bulut ================= */
const BUL_AB = 'abcdefghjkmnpqrstuvwxyz23456789';
function kayitPaket() { kaydet(true); const d = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('kozmos') && !k.startsWith('kozmos-yrh-') && k !== YEDEK_A) d[k] = localStorage.getItem(k); } return JSON.stringify({ s: 'kozmos', v: 1, t: Date.now(), d }); }
function kayitUygula(str) { let o; try { o = JSON.parse(str); } catch (e) { return false; } if (!o || o.s !== 'kozmos' || !o.d || typeof o.d !== 'object' || !o.d[KAYIT]) return false; window.__seriYukleniyor = true; const kod = ls.get('kozmos-bulut-kod', null); for (const k in o.d) if (k.startsWith('kozmos') && typeof o.d[k] === 'string') localStorage.setItem(k, o.d[k]); if (kod) ls.set('kozmos-bulut-kod', kod); setTimeout(() => location.reload(), 300); return true; }
let bulOnay = 0;
/* otomatik kayıt yedekleri: son 3 günün ilk hali + sıfırlama/prestij/geri yükleme öncesi son 2 kopya */
const YEDEK_A = 'kozmos-yedekler', YEDEK_AD = { gun: ['Günlük yedek', 'Daily backup'], sifir: ['Sıfırlama öncesi', 'Before reset'], prestij: ['Prestij öncesi', 'Before prestige'], geri: ['Geri yükleme öncesi', 'Before restore'] };
let yedekOnay = -1;
function yedekler() { const L2 = ls.get(YEDEK_A, []); return Array.isArray(L2) ? L2.filter(x => x && typeof x.k === 'string' && Number.isFinite(x.t) && YEDEK_AD[x.tur]) : []; }
function yedekOz(str) { try { const o = JSON.parse(str); if (!o || typeof o !== 'object') return null; return { kr: Math.round(+o.kr || 0), s: Array.isArray(o.kesif) ? o.kesif.filter(x => typeof x === 'string' && x[0] === 's').length : 0, prs: o.prs | 0 }; } catch (e) { return null; } }
function yedekAl(tur) {
  let str = null; try { str = localStorage.getItem(KAYIT); } catch (e) { } const oz = str && str.length < 400000 && yedekOz(str);
  if (!oz || (oz.s < 2 && oz.kr <= 600 && !oz.prs)) return false;
  let L2 = yedekler(); const d = new Date(), g = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  if (tur === 'gun' && L2.some(x => x.tur === 'gun' && x.g === g)) return false;
  if (L2.length && L2[0].k === str) return false;
  L2.unshift({ t: Date.now(), tur, g, k: str, oz });
  const gun = L2.filter(x => x.tur === 'gun').slice(0, 3), dig = L2.filter(x => x.tur !== 'gun').slice(0, 2); L2 = gun.concat(dig).sort((a, b) => b.t - a.t);
  for (let i = 0; i < 5; i++) { try { localStorage.setItem(YEDEK_A, JSON.stringify(L2)); return true; } catch (e) { if (L2.length <= 1) return false; L2.pop(); } }
  return false;
}
function yedekGeri(t) {
  const y = yedekler().find(x => x.t === t); if (!y) return;
  try { kaydet(true); } catch (e) { } yedekAl('geri'); window.__seriYukleniyor = true;
  try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k === 'kozmos-bil') localStorage.removeItem(k); } localStorage.setItem(KAYIT, y.k); } catch (e) { }
  location.reload();
}
function yedekYaz() {
  const L2 = yedekler(), tar = t => new Date(t).toLocaleString(EN() ? 'en-GB' : 'tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return `<div style="margin:12px 0 4px;padding-top:10px;border-top:1px solid var(--line);font-weight:900">🕘 ${T('Otomatik yedekler', 'Automatic backups')}</div><div class="alt" style="font-size:12px">${T('Bu cihazda saklanır: son 3 günün yedeği ve sıfırlama öncesi kopyalar. Bir şey ters giderse buradan geri dönebilirsin.', 'Kept on this device: the last 3 days and copies from before resets. If something goes wrong you can go back from here.')}</div>` +
    (L2.length ? L2.map(y => `<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><div style="flex:1;min-width:0;font-size:13px"><b>${tar(y.t)}</b> · ${L(YEDEK_AD[y.tur])}<div class="alt" style="font-size:12px">💰 ${SAYI(y.oz.kr)} · 🔭 ${SAYI(y.oz.s)} ${T('sistem', 'systems')}${y.oz.prs ? ' · ⭐ ' + y.oz.prs : ''}</div></div><button class="kb" type="button" data-yedek="${y.t}" style="${yedekOnay === y.t ? 'background:rgba(255,90,90,.25);border-color:#FF6B6B;color:#FFD0D0' : ''}">${yedekOnay === y.t ? '⚠ ' + T('Emin misin?', 'Sure?') : '⏪ ' + T('Geri yükle', 'Restore')}</button></div>`).join('') : `<div class="alt" style="font-size:12.5px;margin-top:4px">${T('Henüz yedek yok. Biraz oynadıktan sonra ilk yedek ertesi açılışta alınır.', 'No backups yet. After you have played a bit, the first one is taken the next time you open the game.')}</div>`);
}
/* oyunu sıfırla: ilerleme silinir, ayarlar kalır; bulut yedeği korunur (otomatik bulut kaydı kapatılır ki üzerine yazılmasın) */
function oyunSifirla() {
  try { kaydet(true); } catch (e) { } yedekAl('sifir');
  window.__seriYukleniyor = true;
  try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (/^kozmos-(yrh|yrb)-/.test(k) || k === 'kozmos-bil') localStorage.removeItem(k); } } catch (e) { }
  ls.set(KAYIT, {}); /* boş kayıt: hesap yedeği eski ilerlemeyi geri indirmesin, yeni oyun yedeklensin */
  if (ls.get('kozmos-bulut-kod', null)) ls.set('kozmos-bulut-oto', false);
  location.reload();
}
function bulYaz() {
  const kod = ls.get('kozmos-bulut-kod', null), ac = AG.durum() === 'acik', oto2 = ls.get('kozmos-bulut-oto', true) !== false;
  $('bulIc').innerHTML = `<div class="dg" style="flex-wrap:wrap;gap:6px;margin:6px 0"><button class="kb al" type="button" data-bl="indir">💾 ${T('Kaydı indir', 'Download save')}</button><button class="kb" type="button" data-bl="dosya">📂 ${T('Dosyadan yükle', 'Load from file')}</button></div>
  <div class="alt" style="font-size:12px">${T('Bulut kodu, kaydını başka bir cihaza taşımana yarar. Kodu kimseyle paylaşma.', 'A cloud code lets you move your save to another device. Do not share it.')}</div>
  ${kod ? `<div style="margin:6px 0;font-weight:900;letter-spacing:2px;font-size:16px;color:var(--altin)">🔑 ${esc(kod)}</div>` : ''}
  <div class="dg" style="flex-wrap:wrap;gap:6px;margin:6px 0"><button class="kb al" type="button" data-bl="yukle" ${ac ? '' : 'disabled'}>☁ ${kod ? T('Buluta kaydet', 'Save to cloud') : T('Bulut kodu oluştur', 'Create a cloud code')}</button><button class="kb" type="button" data-bl="tasi" ${ac ? '' : 'disabled'}>🔗 ${T('Başka cihaza taşı', 'Move to another device')}</button></div>
  <div class="alt" style="font-size:12px">${T('“Başka cihaza taşı” bir bağlantı verir: diğer cihazda açınca kod kendiliğinden dolar, “Buluttan yükle”ye basman yeter.', '“Move to another device” gives you a link: open it on the other device and the code is filled in, just press “Load from cloud”.')}</div>${ls.get('kozmos-tasi', null) ? `<div class="alt" style="font-size:12.5px;color:var(--altin);font-weight:800">🔗 ${T('Bağlantıdan gelen kod hazır: “Buluttan yükle”ye bas (iki kez).', 'Code from the link is ready: press “Load from cloud” (twice).')}</div>` : ''}
  <div class="dg" style="gap:6px;margin:6px 0"><input id="bulKod" maxlength="16" placeholder="${T('Kod', 'Code')}" style="flex:1;min-width:0;font:inherit;padding:7px 10px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--ink)"><button class="kb" type="button" data-bl="al" ${ac ? '' : 'disabled'}>${bulOnay ? '⚠ ' + T('Emin misin? Bu cihazdaki kayıt silinir', 'Sure? This device’s save is replaced') : '☁ ' + T('Buluttan yükle', 'Load from cloud')}</button></div>
  ${kod ? `<label class="secim"><input type="checkbox" id="bulOto" ${oto2 ? 'checked' : ''}><span>${T('Her 5 dakikada otomatik buluta kaydet', 'Auto-save to the cloud every 5 minutes')}</span></label>` : ''}${ac ? '' : `<div class="alt" style="font-size:12px">${T('Bulut için çevrimiçi olmalısın.', 'You need to be online for the cloud.')}</div>`}` + yedekYaz();
  const bo = $('bulOto'); if (bo) bo.onchange = () => ls.set('kozmos-bulut-oto', bo.checked);
  { const tk = ls.get('kozmos-tasi', null), bk = $('bulKod'); if (tk && bk && !bk.value) bk.value = tk; }
}
async function bulutKaydet(sessiz) { let kod = ls.get('kozmos-bulut-kod', null); if (!kod) { kod = ''; for (let i = 0; i < 10; i++) kod += BUL_AB[(Math.random() * BUL_AB.length) | 0]; ls.set('kozmos-bulut-kod', kod); } const ok = await AG.bulutYaz(kod, kayitPaket()); if (ok) { ST.bulut = Date.now(); if (!sessiz) { duyur('☁ ' + T('Kaydın buluta kondu', 'Save stored in the cloud'), 'koloni', '🔑 ' + kod); SES.koloni(); basarimKontrol(); } } else if (!sessiz) duyur('☁ ' + T('Buluta kaydedilemedi', 'Could not save to the cloud'), 'uyari'); if (!$('menu').hidden) bulYaz(); }
$('bulIc').addEventListener('click', async e => { const yb = e.target.closest('[data-yedek]'); if (yb) { const t = +yb.dataset.yedek; SES.tik(); if (yedekOnay !== t) { yedekOnay = t; bulYaz(); setTimeout(() => { if (yedekOnay === t) { yedekOnay = -1; if (!$('menu').hidden) bulYaz(); } }, 6000); return; } yedekOnay = -1; duyur('⏪ ' + T('Yedek geri yükleniyor…', 'Restoring backup…'), 'uyari'); setTimeout(() => yedekGeri(t), 350); return; }
  const b = e.target.closest('[data-bl]'); if (!b || b.disabled) return; const k = b.dataset.bl;
  if (k === 'indir') { const a = document.createElement('a'); a.download = 'kozmos-kayit-' + new Date().toISOString().slice(0, 10) + '.json'; a.href = URL.createObjectURL(new Blob([kayitPaket()], { type: 'application/json' })); document.body.appendChild(a); a.click(); a.remove(); SES.tik(); }
  else if (k === 'dosya') $('bulDosya').click();
  else if (k === 'yukle') bulutKaydet(false);
  else if (k === 'tasi') tasiPaylas();
  else if (k === 'al') { const kod = ($('bulKod').value || '').trim().toLowerCase(); if (kod.length < 10) { duyur('☁ ' + T('Geçerli bir kod gir', 'Enter a valid code'), 'uyari'); return; } if (!bulOnay) { bulOnay = 1; bulYaz(); $('bulKod').value = kod; setTimeout(() => { bulOnay = 0; if (!$('menu').hidden) bulYaz(); }, 6000); return; } bulOnay = 0; const o = await AG.bulutOku(kod); if (!o || !o.v) { duyur('☁ ' + T('Bu kodda kayıt yok', 'No save under this code'), 'uyari'); bulYaz(); return; } ls.set('kozmos-bulut-kod', kod); ls.set('kozmos-tasi', null); if (!kayitUygula(o.v)) duyur('☁ ' + T('Kayıt okunamadı', 'Could not read the save'), 'uyari'); else duyur('☁ ' + T('Kayıt yüklendi, oyun yeniden başlıyor…', 'Save loaded, restarting…'), 'koloni'); }
});
$('bulDosya').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { if (!kayitUygula(String(r.result))) duyur('📂 ' + T('Bu dosya bir Kozmos kaydı değil', 'This file is not a Kozmos save'), 'uyari'); else duyur('📂 ' + T('Kayıt yüklendi, oyun yeniden başlıyor…', 'Save loaded, restarting…'), 'koloni'); }; r.readAsText(f); e.target.value = ''; });
let bulT = 300;
