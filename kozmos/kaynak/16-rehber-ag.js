/* ================= kaptan rehberi ================= */
const REHA = [
  [['Gemini uçur', 'Fly your ship'], ['W A S D ile uç. Telefonda “Sürüş” modunda ekrana dokunup yönlendir.', 'Fly with W A S D. On a phone, touch and steer in “Drive” mode.'], () => yol > 1500, 100],
  [['Haritayı aç', 'Open the map'], ['M tuşuna ya da sağ üstteki 🗺 düğmesine bas.', 'Press M or the 🗺 button at the top right.'], () => !!ST.rHarita, 100],
  [['Yeni bir sistem keşfet', 'Discover a new system'], ['Haritada bir yıldıza dokun, Boşluk ya da 🌀 ile warp yap. Varınca yavaşla: hızla geçtiğin yerler keşif sayılmaz.', 'Tap a star on the map and warp with Space or 🌀. Slow down when you arrive: places you rush past are not discovered.'], () => sayK('s') >= 2, 200],
  [['Bir koloniye yanaş', 'Dock at a colony'], ['Bir koloniye yaklaş ve gemi yanındaki “Yanaş” düğmesine bas.', 'Fly up to a colony and press “Dock” by your ship.'], () => ST.yanas >= 1, 200],
  [['Pazarda bir şey sat', 'Sell something at the market'], ['Ucuz olduğu yerden al, pahalı olduğu yerde sat. Fiyat etiketlerine bak.', 'Buy where it is cheap, sell where it is dear. Watch the price tags.'], () => ((ST.gk || {}).ticaret || 0) > 0, 200],
  [['Bir görev tamamla', 'Complete a mission'], ['Limanda 📋 Görevler sekmesinden bir iş al.', 'Take a job from the 📋 Missions tab at a port.'], () => ST.gorev >= 1, 300],
  [['Kaynak topla', 'Gather resources'], ['Bir gezegene yaklaş ve E tuşu ya da “⛏ Topla” düğmesiyle kaz.', 'Fly up to a planet and drill with E or the “⛏ Gather” button.'], () => Object.keys(KOTA).length > 0 || ST.astKir > 0, 200],
  [['Bir korsanı yen', 'Defeat a pirate'], ['Taretin korsanlara kendiliğinden ateş eder. Etrafında dön, isabet alma.', 'Your turret fires at pirates on its own. Circle them and dodge their shots.'], () => ST.korsan >= 1, 300],
  [['Güç dağıtımını dene', 'Try power distribution'], ['Sol alttaki 🔥 🔫 🛡 çubuklarına dokun ya da Z X C tuşlarına bas.', 'Tap the 🔥 🔫 🛡 bars at the bottom left or press Z X C.'], () => !!ST.guc, 100],
  [['Tersanede geliştirme al', 'Buy a shipyard upgrade'], ['Limanda 🛠 Tersane sekmesinden motor, tank ya da kalkan yükselt.', 'Upgrade engines, tank or shields in the 🛠 Shipyard tab at a port.'], () => Object.values(YUK).some(v => v > 0), 300],
  [['Araştırma ağacına bak', 'Look at the research tree'], ['📦 Ambar → 🔬 Araştırma: bilim puanlarını harca.', '📦 Hold → 🔬 Research: spend your science points.'], () => !!ST.rBilim, 100],
  [['Fabrikada ürün işle', 'Process a product at a factory'], ['Limanda ⚒ Üretim → 🏭 Fabrika: cevheri alaşıma çevir.', 'At a port, ⚒ Crafting → 🏭 Factory: turn ore into alloy.'], () => (ST.isle || 0) > 0, 300],
  [['Hikâyenin peşine düş', 'Follow the story'], ['Garip sinyali takip et: sağ alttaki görev hedefine git.', 'Follow the strange signal: head for the mission target.'], () => HIK.a >= 2, 300],
  [['Kodekse göz at', 'Browse the codex'], ['📦 Ambar → 📖 Kodeks: keşfettikçe sayfalar açılır.', '📦 Hold → 📖 Codex: pages unlock as you explore.'], () => KOD.size >= 4, 200],
];
function rehKontrol(sessiz) {
  if (REH.bitti) return; let deg = false;
  while (REH.i < REHA.length && REHA[REH.i][2]()) { const R = REHA[REH.i]; if (!sessiz) { kazan(R[3], 'gorev'); duyur('🧭 ' + T('Rehber: ', 'Guide: ') + L(R[0]) + ' ✓', 'koloni', `+${R[3]} 💰`); SES.koloni(); } REH.i++; deg = true; }
  if (REH.i >= REHA.length && !REH.bitti) { REH.bitti = true; if (!sessiz) { kazan(2000, 'gorev'); setTimeout(() => duyur('🧭 ' + T('Kaptan rehberi tamamlandı!', 'Captain’s guide complete!'), 'galaksi', '+2.000 💰'), 800); basarimKontrol(); } deg = true; }
  if (deg) { rehYaz(); kaydet(); }
}
function rehYaz() {
  const el = $('rehber'); if (REH.kapali || REH.bitti || !oyunda) { el.hidden = true; return; } const R = REHA[REH.i]; if (!R) { el.hidden = true; return; }
  if (REH.kucuk === undefined) REH.kucuk = !!DOKUN; el.hidden = false; rehKonum(); el.classList.toggle('kucuk', !!REH.kucuk);
  el.innerHTML = `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;cursor:pointer" data-rh="kuc"><span>🧭 <b>${T('Kaptan rehberi', 'Captain’s guide')}</b> · ${REH.i + 1}/${REHA.length}</span><span style="opacity:.7">${REH.kucuk ? '▾' : '▴'}</span></div><div style="margin-top:4px;font-weight:900">${L(R[0])} <span style="color:#FFC857;font-weight:800">+${R[3]} 💰</span></div><div class="rb" style="margin-top:6px"><button type="button" class="rgit" data-rh="git">${L(REHG[REH.i][0])}</button></div><div class="rgov"><div style="color:var(--mute);margin-top:3px;line-height:1.35">${L(R[1])}</div><div class="rbar"><i style="width:${(REH.i / REHA.length * 100).toFixed(0)}%"></i></div><div class="rb"><button type="button" data-rh="atla">⏭ ${T('Atla', 'Skip')}</button><button type="button" data-rh="kapat">✕ ${T('Kapat', 'Close')}</button></div></div>`;
}
$('rehber').addEventListener('pointerdown', e => e.stopPropagation());
$('rehber').addEventListener('click', e => { const b = e.target.closest('[data-rh]'); if (!b) return; e.stopPropagation(); const k = b.dataset.rh; if (k === 'kuc') REH.kucuk = !REH.kucuk; else if (k === 'atla') { REH.i++; if (REH.i >= REHA.length) REH.bitti = true; } else if (k === 'git') { rehGit(REH.i); return; } else if (k === 'kapat') { REH.kapali = true; duyur('🧭 ' + T('Rehberi ayarlardan yeniden açabilirsin', 'You can reopen the guide from settings'), 'kesif'); } SES.tik(); rehYaz(); kaydet(); });
$('rehBtn').onclick = () => { $('menu').hidden = true; REH.kapali = false; if (REH.bitti) { REH.bitti = false; REH.i = 0; rehKontrol(true); } rehYaz(); SES.tik(); };
let rehT = 1;
function parla(el) { if (!el) return; el.classList.remove('parla'); void el.offsetWidth; el.classList.add('parla'); setTimeout(() => el.classList.remove('parla'), 4200); }
function rehKol() { const p = enYakinKoloni(); if (!p) return; const [x, y] = gezPos(p, simT()); hedefGit({ h: { p, ad: kolAd(p) }, ad: kolAd(p), x, y, d: Math.hypot(x - SH.x, y - SH.y) }); duyur('🏙 ' + T('Varınca gemi yanındaki “Yanaş” düğmesine bas', 'When you arrive, press “Dock” by your ship'), 'kesif'); }
function rehSek(sk) { if (!limanP) return false; limanSek = sk; limanYaz(); SES.tik(); return true; }
function rehYildiz() { const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK); let en = null, ed = Infinity; for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const s2 = sistem(sx + i, sy + j); if (!s2 || KESIF.has('s:' + s2.t.k)) continue; const d = Math.hypot(s2.x - SH.x, s2.y - SH.y); if (d < ed) { ed = d; en = s2; } } if (!en) { haritaAc(); return; } hedefGit({ h: { tm: en.t, ad: en.t.ad }, ad: T('Keşfedilmemiş yıldız', 'Undiscovered star'), x: en.x, y: en.y, d: ed }); parla($('gp')); }
function rehKaynak() { const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK); let en = null, ed = Infinity; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const s2 = sistem(sx + i, sy + j); if (!s2) continue; for (const q of s2.gez) { if (q.kol) continue; const [x, y] = gezPos(q, simT()), d = Math.hypot(x - SH.x, y - SH.y); if (d < ed) { ed = d; en = q; } } } if (!en) { rehYildiz(); return; } const [x, y] = gezPos(en, simT()); hedefGit({ h: { p: en, ad: en.ad }, ad: en.ad, x, y, d: ed }); duyur('⛏ ' + T('Varınca E tuşuna ya da “Topla” düğmesine bas', 'When you arrive, press E or the “Gather” button'), 'kesif'); }
const REHG = [
  [['🎮 Nasıl uçulur?', '🎮 How to fly?'], () => { if (mod === 'oto') modDegis(); duyur('🎮 ' + T('Sürüş modu', 'Drive mode'), 'kesif', DOKUN ? T('Ekrana dokunup gitmek istediğin yöne sürükle', 'Touch the screen and drag towards where you want to go') : T('W ileri · A/D dön · S fren · Shift hız', 'W forward · A/D turn · S brake · Shift boost')); parla($('gosterge')); }],
  [['🗺 Haritayı aç', '🗺 Open the map'], () => haritaAc()],
  [['🧭 En yakın yeni yıldıza git', '🧭 Go to the nearest new star'], rehYildiz],
  [['🏙 En yakın koloniye git', '🏙 Go to the nearest colony'], () => { if (limanP) { duyur('🏙 ' + T('Zaten bir limandasın', 'You are already docked'), 'kesif'); return; } rehKol(); }],
  [['🛒 Pazara git', '🛒 Go to the market'], () => { if (!rehSek('pazar')) rehKol(); }],
  [['📋 Görevlere git', '📋 Go to missions'], () => { if (!rehSek('gorev')) rehKol(); }],
  [['⛏ En yakın gezegene git', '⛏ Go to the nearest planet'], rehKaynak],
  [['☠ Korsan avına çık', '☠ Go pirate hunting'], () => { if (limanP) { duyur('☠ ' + T('Önce limandan çık', 'Undock first'), 'kesif'); return; } if (KORS.length) { duyur('☠ ' + T('Korsanlar zaten burada!', 'Pirates are already here!'), 'uyari'); return; } korsanCikar(); }],
  [['⚡ Güç çubuklarını göster', '⚡ Show the power bars'], () => { parla($('guc')); duyur('⚡ ' + T('Sol alttaki 🔥 🔫 🛡 çubuklarına dokun', 'Tap the 🔥 🔫 🛡 bars at the bottom left'), 'kesif', DOKUN ? '' : T('ya da Z X C tuşlarına bas', 'or press Z X C')); }],
  [['🛠 Tersaneye git', '🛠 Go to the shipyard'], () => { if (!rehSek('ters')) rehKol(); }],
  [['🔬 Araştırmayı aç', '🔬 Open research'], () => ambarAc('bilim')],
  [['🏭 Fabrikaya git', '🏭 Go to the factory'], () => { if (!rehSek('uret')) rehKol(); }],
  [['📡 Sinyale git', '📡 Go to the signal'], () => { const g = hikGorev(), h = g && hikHedef(g); if (!h) { duyur('📡 ' + T('Sinyal birazdan gelecek: uçmaya devam et', 'The signal is coming soon: keep flying'), 'kesif'); return; } const [x, y] = otoPos(h, simT()); hedefGit({ h, ad: g.ad || T('Sinyal', 'Signal'), x, y, d: Math.hypot(x - SH.x, y - SH.y) }); }],
  [['📖 Kodeksi aç', '📖 Open the codex'], () => ambarAc('kod')],
];
function rehGit(i) { const G = REHG[i]; if (!G) return; SES.tik(); try { G[1](); } catch (e) { console.warn('rehber', e); } }
function rehKonum() { const el = $('rehber'), gp = $('gorevPanel'); if (el.hidden) return; const yat = innerHeight < 500 && innerWidth > innerHeight * 1.3; el.classList.toggle('yatay', yat); if (yat) { el.style.top = ''; return; } if (gp && !gp.hidden) { const r = gp.getBoundingClientRect(); el.style.top = Math.round(r.bottom + 8) + 'px'; } else el.style.top = ''; }
/* ================= başarımlar ================= */
function sayK(c) { let n = 0; for (const k of KESIF) if (k[0] === c) n++; return n; }
const BASARIM = [
  ['sis1', '🔭', ['İlk adım', 'First step'], ['Ana sistemin dışında bir sistem keşfet', 'Discover a system beyond home'], () => sayK('s') >= 2],
  ['sis10', '✨', ['Kâşif', 'Explorer'], ['10 yıldız sistemi keşfet', 'Discover 10 star systems'], () => sayK('s') >= 10],
  ['sis50', '🌟', ['Yıldız avcısı', 'Star hunter'], ['50 sistem keşfet', 'Discover 50 systems'], () => sayK('s') >= 50],
  ['sis200', '💫', ['Haritacı', 'Cartographer'], ['200 sistem keşfet', 'Discover 200 systems'], () => sayK('s') >= 200],
  ['kol10', '🏙', ['Koloniler', 'Colonies'], ['10 koloni keşfet', 'Discover 10 colonies'], () => sayK('k') >= 10],
  ['gal', '🌌', ['Galaksiler arası', 'Intergalactic'], ['İkinci bir galaksiye ulaş', 'Reach a second galaxy'], () => sayK('g') >= 2],
  ['kd', '🕳', ['Olay ufku', 'Event horizon'], ['Bir kara delik sistemi keşfet', 'Discover a black hole system'], () => ST.kd > 0],
  ['yanas', '🛬', ['İlk liman', 'First port'], ['Bir koloniye yanaş', 'Dock at a colony'], () => ST.yanas >= 1],
  ['gor1', '📋', ['İş başı', 'On the job'], ['Bir görevi tamamla', 'Complete a mission'], () => ST.gorev >= 1],
  ['gor25', '🎖', ['Güvenilir kaptan', 'Trusted captain'], ['25 görev tamamla', 'Complete 25 missions'], () => ST.gorev >= 25],
  ['kor1', '☠', ['İlk zafer', 'First victory'], ['Bir korsan gemisini yok et', 'Destroy a pirate ship'], () => ST.korsan >= 1],
  ['kor25', '⚔', ['Korsan avcısı', 'Pirate hunter'], ['25 korsan yok et', 'Destroy 25 pirates'], () => ST.korsan >= 25],
  ['zen1', '💰', ['Tüccar', 'Trader'], ['Toplam 10.000 kredi kazan', 'Earn 10,000 credits in total'], () => ST.kazanc >= 1e4],
  ['zen2', '💎', ['Uzay zengini', 'Space tycoon'], ['Toplam 100.000 kredi kazan', 'Earn 100,000 credits in total'], () => ST.kazanc >= 1e5],
  ['kar', '⚑', ['Toprak sahibi', 'Landholder'], ['Bir karakol kur', 'Build an outpost'], () => KARAKOL.length > 0],
  ['tam', '🛠', ['Usta mühendis', 'Master engineer'], ['Bir parçayı en üst seviyeye çıkar', 'Max out a ship part'], () => Object.values(YUK).some(v => v >= 4)],
  ['kuy', '☄', ['Buz avcısı', 'Ice hunter'], ['Kuyruklu yıldızdan buz topla', 'Collect ice from a comet'], () => ST.kuyruk > 0],
  ['neb', '🌫', ['Bulut sörfçüsü', 'Cloud surfer'], ['Nebula özü topla', 'Collect nebula essence'], () => ST.nebula > 0],
  ['gemi', '🛸', ['Filo', 'Fleet'], ['İkinci bir gemi satın al', 'Buy a second ship'], () => GEMILER.size >= 2],
  ['dost', '🤝', ['Müttefik', 'Ally'], ['Bir kolonide müttefik ol', 'Become an ally of a colony'], () => Object.values(ITIBAR).some(v => v >= 60)],
  ['temas', '🛸', ['İlk temas', 'First contact'], ['Bir uzaylı kolonisine yanaş', 'Dock at an alien colony'], () => (ST.temas || 0) > 0],
  ['kal1', '🏛', ['Arkeolog', 'Archaeologist'], ['Bir antik kalıntıyı çöz', 'Solve ancient ruins'], () => (ST.kalinti || 0) >= 1],
  ['kal10', '📜', ['Kadim bilge', 'Ancient sage'], ['10 kalıntı çöz', 'Solve 10 ruins'], () => (ST.kalinti || 0) >= 10],
  ['balina', '🐋', ['Balina şarkısı', 'Whale song'], ['Uzay balinalarını gözlemle', 'Observe space whales'], () => (ST.balina || 0) > 0],
  ['kelle', '🎯', ['Kelle avcısı', 'Bounty hunter'], ['Bir aranan korsanı yakala', 'Catch a wanted pirate'], () => (ST.kelle || 0) >= 1],
  ['tec', '🧰', ['Donanımlı', 'Well equipped'], ['Tüm teçhizat yuvalarını doldur', 'Fill all equipment slots'], () => TAK.length >= 2],
  ['kendi', '🏙', ['Kurucu', 'Founder'], ['Kendi kolonini kur', 'Found your own colony'], () => KARAKOL.some(k => k.koloni)],
  ['kapi', '⛩', ['Kapı bekçisi', 'Gatekeeper'], ['Kadim Kapıları aç', 'Open the Ancient Gates'], () => !!HIK.kapi],
  ['kapsul', '🫁', ['Hayatta kalan', 'Survivor'], ['Kaçış kapsülüyle yeni bir gemiye kavuş', 'Get a new ship after escaping in the pod'], () => (ST.kapsulK || 0) > 0],
  ['yaris1', '🏁', ['Pist tozu', 'Track dust'], ['Bir yarışı bitir', 'Finish a race'], () => (ST.yaris || 0) > 0],
  ['yarisPar', '⏱', ['Hız şeytanı', 'Speed demon'], ['Bir yarışı hedef sürenin altında bitir', 'Beat a race’s target time'], () => !!ST.yarisPar],
  ['sezon5', '🏆', ['Sezon avcısı', 'Season hunter'], ['Bir sezonda 5. seviyeye ulaş', 'Reach level 5 in a season'], () => sezSv() >= 5],
  ['galeri', '📸', ['Uzay fotoğrafçısı', 'Space photographer'], ['Galeriye bir fotoğraf gönder', 'Post a photo to the gallery'], () => (ST.galeri || 0) > 0],
  ['bulut', '☁', ['Bulut pilotu', 'Cloud pilot'], ['Kaydını buluta yedekle', 'Back up your save to the cloud'], () => !!ST.bulut],
  ['bolum4', '📡', ['Yankının sonu', 'Echo’s end'], ['Bölüm 4’ü herhangi bir sonla bitir', 'Finish chapter 4 with any ending'], () => !!HIK.son4],
  ['sonA', '🕊', ['Barış elçisi', 'Peace envoy'], ['Bölüm 4’ü uzlaşma yoluyla bitir', 'Finish chapter 4 on the path of peace'], () => HIK.son4 === 'A'],
  ['sonB', '🎖', ['Birlik amirali', 'Union admiral'], ['Bölüm 4’ü Birlik’in yanında bitir', 'Finish chapter 4 on the Union’s side'], () => HIK.son4 === 'B'],
  ['sonC', '🌑', ['Gölge lordu', 'Shadow lord'], ['Bölüm 4’ü kendi yolunda bitir', 'Finish chapter 4 on your own path'], () => HIK.son4 === 'C'],
  ['rehber', '🧭', ['Hazır kaptan', 'Ready captain'], ['Kaptan rehberini tamamla', 'Complete the captain’s guide'], () => !!REH.bitti],
  ['koloni', '🏠', ['Kurucu', 'Founder'], ['Kendi kolonini kur', 'Found your own colony'], () => !!KOL],
  ['terraform', '🌍', ['Dünya yapıcı', 'World builder'], ['Kolonini tamamen yaşanabilir yap', 'Make your colony fully habitable'], () => !!KOL && KOL.asama >= 4],
  ['nufus', '👥', ['Kalabalık dünya', 'Crowded world'], ['Kolonin 100 bin nüfusa ulaşsın', 'Grow your colony to 100,000 people'], () => !!KOL && KOL.nuf >= 1e5],
  ['egitim', '🎓', ['Akıl hocası', 'Mentor'], ['Bir mürettebatı 5. seviyeye çıkar', 'Raise a crew member to level 5'], () => EKIP.some(e => e.lv >= 5)],
  ['guc', '⚡', ['Baş mühendis', 'Chief engineer'], ['Güç dağıtımını değiştir', 'Change your power distribution'], () => !!ST.guc],
  ['maden', '⛏', ['Asteroit madencisi', 'Asteroid miner'], ['5 dev asteroit parçala', 'Crack 5 giant asteroids'], () => (ST.astKir || 0) >= 5],
  ['cekirdek', '💠', ['Çekirdek avcısı', 'Core hunter'], ['Bir asteroit çekirdeği bul', 'Find an asteroid core'], () => (ST.cekirdek || 0) > 0],
  ['hacker', '💻', ['Hacker', 'Hacker'], ['3 şifre kır', 'Crack 3 codes'], () => (ST.hack || 0) >= 3],
  ['rota', '🧭', ['Seyir subayı', 'Navigator'], ['3 duraklı bir rotayı tamamla', 'Complete a route with 3 stops'], () => (ST.rotaMax || 0) >= 3],
  ['rover', '🚙', ['Yüzey kâşifi', 'Surface explorer'], ['Yüzeyde 5 maden damarı kaz', 'Drill 5 ore veins on surfaces'], () => (ST.damar || 0) >= 5],
  ['kontrat', '📜', ['Şirket adamı', 'Company pilot'], ['Bir şirket kontratını baştan sona bitir', 'Complete a company contract from start to finish'], () => (ST.kontrat || 0) >= 1],
  ['seckin', '💎', ['Seçkinler kulübü', 'Elite club'], ['Bir seçkin işi teslim et', 'Deliver an elite job'], () => (ST.seckin || 0) >= 1],
  ['album', '🦋', ['Tür avcısı', 'Species hunter'], ['Tür albümünde 6 tür topla', 'Collect 6 species in the album'], () => Array.isArray(ST.alb) && ST.alb.length >= 6],
  ['senaryo', '🏁', ['Haftanın pilotu', 'Pilot of the week'], ['Bir haftalık senaryoyu bitir', 'Finish a weekly scenario'], () => (ST.senN || 0) >= 1],
  ['yasam', '🦠', ['Ekzobiyolog', 'Exobiologist'], ['3 yaşam formu tara', 'Scan 3 life forms'], () => (ST.yasam || 0) >= 3],
  ['kodeks', '📖', ['Ansiklopedist', 'Encyclopedist'], ['Kodekste 20 kayıt aç', 'Unlock 20 codex entries'], () => KOD.size >= 20],
  ['iz', '📮', ['İz bırakan', 'Trailblazer'], ['Diğer pilotlar için bir iz bırak', 'Leave a beacon for other pilots'], () => (ST.izBir || 0) > 0],
  ['izEnkaz', '🛰', ['Hurdacı', 'Scavenger'], ['Başka bir pilotun enkazını topla', 'Salvage another pilot’s wreck'], () => (ST.izEnkaz || 0) > 0],
  ['fabrika', '🏭', ['Sanayici', 'Industrialist'], ['Fabrikada ilk ürününü işle', 'Process your first product at a factory'], () => (ST.isle || 0) > 0],
  ['besle', '📈', ['Koloni kurucusu', 'Colony builder'], ['Bir koloniyi besleyip 2. gelişim seviyesine çıkar', 'Feed a colony up to development level 2'], () => (ST.besMax || 0) >= 2],
  ['piyasa', '📉', ['Piyasa yapıcı', 'Market maker'], ['Bir malın fiyatını satarak %30 düşür', 'Crash a price by 30% with your sales'], () => !!ST.pzKir],
  ['tasarim', '🧩', ['Gemi mühendisi', 'Ship engineer'], ['Gemine 4 modül yerleştir', 'Fit 4 modules to your ship'], () => (ST.modMax || 0) >= 4],
  ['silah', '🔫', ['Cephanelik', 'Armoury'], ['Yeni bir ana silah satın al', 'Buy a new main weapon'], () => (ST.silahA || 0) > 0],
  ['eskort', '🛡', ['Filo komutanı', 'Fleet commander'], ['Bir eskort kirala', 'Hire an escort'], () => (ST.eskort || 0) > 0],
  ['iyon', '⚡', ['Fırtına avcısı', 'Storm chaser'], ['Bir iyon fırtınasının içine gir', 'Fly into an ion storm'], () => (ST.iyon || 0) > 0],
  ['meteor', '☄', ['Taş kıran', 'Rock breaker'], ['15 meteor parçala', 'Break 15 meteors'], () => (ST.meteor || 0) >= 15],
  ['rad', '☢', ['Geiger sayacı', 'Geiger counter'], ['3 radyasyon kuşağını ölç', 'Measure 3 radiation belts'], () => (ST.rad || 0) >= 3],
  ['gecit', '🌀', ['Kısayolcu', 'Shortcut taker'], ['Kararlı bir solucan deliğinden geç', 'Travel through a stable wormhole'], () => (ST.gecit || 0) > 0],
  ['penrose', '🕳', ['Penrose sapanı', 'Penrose slingshot'], ['Bir kara deliğin dönüşünden hız çal', 'Steal speed from a black hole’s spin'], () => (ST.penrose || 0) > 0],
  ['kolos', '👹', ['Kolos avcısı', 'Colossus hunter'], ['Haftalık Kolos’a hasar ver', 'Damage the weekly Colossus'], () => Object.values(ST.bossD || {}).some(v => v > 0)],
  ['kolosYen', '🏆', ['Dev düşüren', 'Giant slayer'], ['Kolos’un yenildiği haftada savaşa katıl', 'Take part in a week the Colossus falls'], () => (ST.bossKaz || 0) > 0],
  ['radyo', '📻', ['Frekans avcısı', 'Frequency hunter'], ['Uzay radyosunda kanal değiştir', 'Change channel on the space radio'], () => !!ST.radyo],
  ['profil', '🪪', ['Tanınmış pilot', 'Known pilot'], ['Pilot kartını oluştur', 'Create your pilot card'], () => !!ST.profil],
  ['yan', '📼', ['Kayıpların izinde', 'On the trail of the lost'], ['Bir kara kutu yan görev zincirini bitir', 'Finish a black-box side quest chain'], () => Object.values(ST.yan || {}).some(v => v === 'bitti')],
  ['yanTam', '🕯', ['Hepsini eve getirdin', 'You brought them all home'], ['Bütün kara kutu zincirlerini bitir', 'Finish every black-box chain'], () => Object.keys(YANZ).every(k => (ST.yan || {})[k] === 'bitti')],
  ['elci', '🕊', ['Elçi', 'Envoy'], ['Bir uzaylı ırkla dost ol', 'Befriend an alien race'], () => Object.values(DIP).some(v => v >= 30)],
  ['muttefik', '🤝', ['Galaktik müttefik', 'Galactic ally'], ['Bir uzaylı ırkla ittifak kur', 'Form an alliance with an alien race'], () => Object.values(DIP).some(v => v >= 70)],
  ['istn', '🏗', ['İstasyon sahibi', 'Station owner'], ['Kendi uzay istasyonunu kur', 'Build your own space station'], () => !!istnObj],
  ['istnTam', '🏙', ['Uzay baronu', 'Space baron'], ['İstasyonunun bütün modüllerini 3. seviyeye çıkar', 'Max out every module of your station'], () => !!istnObj && Object.values(istnObj.mod).every(v => v >= 3)],
  ['moral', '😄', ['Sevilen kaptan', 'Beloved captain'], ['Mürettebat moralini 100’e çıkar', 'Raise crew morale to 100'], () => MORAL >= 99.5],
  ['bilim', '🔬', ['Bilim insanı', 'Scientist'], ['5 araştırma tamamla', 'Complete 5 research projects'], () => TEKNO.size >= 5],
  ['bilimTam', '🧪', ['Teknoloji ustası', 'Tech master'], ['Bütün araştırma ağacını aç', 'Unlock the whole research tree'], () => TEKNO.size >= 15],
  ['sapan', '🪐', ['Sapan ustası', 'Slingshot ace'], ['10 yerçekimi sapanı yap', 'Do 10 gravity slingshots'], () => (ST.sapan || 0) >= 10],
  ['gazYakit', '⛽', ['Atmosfer dalgıcı', 'Atmosphere diver'], ['Gaz devinden 50 yakıt topla', 'Scoop 50 fuel from gas giants'], () => (ST.gazY || 0) >= 50],
  ['tamirci', '🔧', ['Kendi tamircin', 'Your own mechanic'], ['Uzayda 5 sistem onar', 'Repair 5 systems in space'], () => (ST.tamir || 0) >= 5],
  ['hurda', '🛰', ['Hurdacı', 'Scavenger'], ['Uzayda 40 hurda topla', 'Collect 40 pieces of space salvage'], () => (ST.hurda || 0) >= 40],
  ['arsiv', '🗃', ['Küratör', 'Curator'], ['Arşive 10 eser ekle', 'Add 10 items to the archive'], () => ARSIV.size >= 10],
  ['kolek', '🏛', ['Koleksiyoncu', 'Collector'], ['Bir arşiv koleksiyonunu tamamla', 'Complete an archive collection'], () => Object.keys(ARS_ID).some(arsivTam)],
  ['arsivTam', '🌌', ['Evrenin hafızası', 'Memory of the universe'], ['Arşivin tamamını doldur', 'Fill the whole archive'], () => Object.keys(ARS_ID).every(arsivTam)],
  ['sohbet', '💬', ['Sohbet kuşu', 'Chatterbox'], ['Sohbete bir mesaj yaz', 'Write a chat message'], () => (ST.sohN || 0) > 0],
  ['lonca', '🏰', ['Lonca üyesi', 'Guild member'], ['Bir loncaya katıl ya da kur', 'Join or found a guild'], () => !!ST.lonca],
  ['bagis', '🎁', ['Hayırsever', 'Benefactor'], ['Loncana toplam 20.000 puan bağışla', 'Donate 20,000 points to your guild'], () => (ST.bagis || 0) >= 20000],
  ['pazar', '🤝', ['Tüccar ruhu', 'Merchant spirit'], ['Pilot pazarında al ya da sat', 'Buy or sell at the pilot market'], () => (ST.pal || 0) + (ST.pkoy || 0) > 0],
  ['inis', '🛬', ['Yüzey kâşifi', 'Surface explorer'], ['5 gezegenin yüzeyine in', 'Land on 5 planet surfaces'], () => (ST.inisN || 0) >= 5],
  ['foto', '📷', ['Uzay fotoğrafçısı', 'Space photographer'], ['Fotoğraf modunda bir kare kaydet', 'Save a shot in photo mode'], () => (ST.foto || 0) > 0],
  ['fp', '🪟', ['Camdan bakış', 'Window seat'], ['Kokpit görünümünü dene', 'Try the cockpit view'], () => (ST.fp || 0) > 0],
  ['sn', '💥', ['Yıldız ölümü', 'Star death'], ['Bir süpernovaya tanık ol', 'Witness a supernova'], () => (ST.sn || 0) > 0],
  ['solucan', '🌀', ['Kestirme', 'Shortcut'], ['Bir solucan deliğinden geç', 'Go through a wormhole'], () => (ST.solucan || 0) > 0],
  ['istila', '👾', ['Koloni savunucusu', 'Colony defender'], ['Bir uzaylı istilasını püskürt', 'Repel an alien raid'], () => (ST.istila || 0) > 0],
  ['ist', '🛰', ['İstasyon müdavimi', 'Station regular'], ['Bir yıldız istasyonuna yanaş', 'Dock at a star station'], () => (ST.istZ || 0) > 0],
  ['zula', '💎', ['Hazine avcısı', 'Treasure hunter'], ['Gemi mezarlığında 3 zula aç', 'Open 3 caches in ship graveyards'], () => (ST.zula || 0) >= 3],
  ['ekip', '👥', ['Kaptan', 'Captain'], ['3 kişilik mürettebat topla', 'Gather a crew of 3'], () => EKIP.length >= 3],
  ['kervan', '🚚', ['Lojistikçi', 'Logistician'], ['Kervanların 20 sefer yapsın', 'Have your convoys make 20 trips'], () => (ST.kvSefer || 0) >= 20],
  ['klan', '☠', ['Kanun kaçağı', 'Outlaw'], ['Korsan klanlarıyla dost ol', 'Become friends with the pirate clans'], () => FR.klan >= 30],
  ['birlik', '🛡', ['Birlik kahramanı', 'Union hero'], ['İnsan Birliği ile dost ol', 'Become friends with the Human Union'], () => FR.birlik >= 30],
  ['mk', '⬆', ['Mühendis', 'Engineer'], ['Bir teçhizatı Mk III’e çıkar', 'Upgrade equipment to Mk III'], () => Object.values(TLV).some(v => v >= 3)],
  ['usta', '⚒', ['Usta', 'Craftsman'], ['İlk eşyanı üret', 'Craft your first item'], () => (ST.uret || 0) > 0],
  ['plan', '📜', ['Plan avcısı', 'Blueprint hunter'], ['8 plan topla', 'Collect 8 blueprints'], () => PLANLAR.size >= 8],
  ['faiz', '📈', ['Yatırımcı', 'Investor'], ['Bankadan faiz al', 'Collect interest from the bank'], () => (ST.faizTop || 0) > 0],
  ['selam', '👋', ['Dost canlısı', 'Friendly'], ['Başka bir pilota selam ver', 'Wave at another pilot'], () => (ST.selam || 0) > 0],
  ['comert', '🎁', ['Cömert', 'Generous'], ['Bir pilota hediye gönder', 'Send a gift to a pilot'], () => (ST.hediye || 0) > 0],
  ['filo', '🤝', ['Filo arkadaşı', 'Wingmate'], ['Başka bir pilotla birlikte 5 korsan yen', 'Defeat 5 pirates alongside another pilot'], () => (ST.filo || 0) >= 5],
  ['hafta', '📅', ['Haftanın yıldızı', 'Star of the week'], ['Haftalık yarışmada ilk 3’e gir', 'Finish top 3 in the weekly contest'], () => (ST.hilk || 0) > 0],
  ['son', '🌟', ['Galaksilerin Koruyucusu', 'Guardian of the Galaxies'], ['Bölüm 3’ü bitir', 'Finish chapter 3'], () => HIK.a >= 15],
  ['hik', '🚀', ['Umut-7', 'Hope-7'], ['Hikâyeyi bitir', 'Finish the story'], () => HIK.a >= 5],
];
function basarimKontrol() {
  if (!oyunda) return; let gec = 0;
  for (const b of BASARIM) if (!BAS.has(b[0]) && b[4]()) { BAS.add(b[0]); kazan(100); defter('🏅 Başarım kazandım: ' + b[2][0] + ' — ' + b[3][0], '🏅 Earned an achievement: ' + b[2][1] + ' — ' + b[3][1]); const d = gec; gec += 1600; setTimeout(() => { duyur('🏅 ' + T('Başarım: ', 'Achievement: ') + '<b>' + L(b[2]) + '</b>', 'galaksi', L(b[3]) + ' · +100 💰'); SES.galaksi(); }, 700 + d); }
}

/* ================= mini harita/* ================= çevrimiçi (Firebase Realtime Database) =================
   kozmos/o/<uid>  konum (1,2 sn'de bir; çıkınca silinir)  ·  kozmos/k/<sistem>  ilk keşfeden  ·  kozmos/r/<uid>  sıralama  ·  kozmos/m/<uid> selam/hediye  ·  kozmos/h/<hafta>/<uid> haftalık  ·  kozmos/kk/<uid> karakollar  ·  kozmos/s sohbet  ·  kozmos/l loncalar  ·  kozmos/p pilot pazarı
   ?ag=yok → kapalı. Kurallar firebase-kurallari-oyunlar.json içinde. */
function pilotAd() { if (gemiAd) return gemiAd; let a = ls.get('kozmos-pilot', ''); if (!a) { a = 'Pilot-' + (100 + ((Math.random() * 900) | 0)); ls.set('kozmos-pilot', a); } return a; }
const AG = (() => {
  const CONFIG = { apiKey: 'AIzaSyCQly5YyU9TNMfvZNBVA1UPZuglO8Rzogo', authDomain: 'mesaj1-fc2c5.firebaseapp.com', databaseURL: 'https://mesaj1-fc2c5-default-rtdb.firebaseio.com', projectId: 'mesaj1-fc2c5', appId: '1:835014166916:web:f47e7f8ec1641bc44c75d1' };
  const UZAK = new Map(), ILK = new Map(); let db = null, uid = null, durum = 'kapali', benRef = null, sonGon = 0, sonR = 0, saatFarki = 0, basladi = false, balonE = null, balonT = 0, sonKK = 0;
  const yukle = src => { const c = window.__erJs = window.__erJs || {}; return c[src] || (c[src] = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = () => { delete c[src]; no(); }; document.head.appendChild(sc); })); };
  function al(id, v) {
    if (!v || id === uid || typeof v.x !== 'number') return; if (Date.now() + saatFarki - (v.t || 0) > 30000) return;
    const e = UZAK.get(id), n = performance.now();
    if (e) { const k = Math.min(1, (n - e.t0) / 1300); e.px = lerp(e.px, e.cx, k); e.py = lerp(e.py, e.cy, k); e.t0 = n; e.cx = v.x; e.cy = v.y; e.ca = v.a || 0; e.v = v; e.son = n; }
    else { UZAK.set(id, { px: v.x, py: v.y, cx: v.x, cy: v.y, ca: v.a || 0, t0: n, son: n, v }); try { if (window.pilotGeldi) pilotGeldi(id, v); } catch (x) { } }
    const E = UZAK.get(id); if (v.e && v.et && v.et !== E.bt) { if (E.bt !== undefined || Date.now() + saatFarki - v.et < 4000) E.bub = { e: String(v.e).slice(0, 4), t: n }; E.bt = v.et; } else if (E.bt === undefined) E.bt = v.et || 0;
  }
  async function baslat() {
    if (basladi || new URLSearchParams(location.search).get('ag') === 'yok') return; basladi = true; durum = 'baglaniyor';
    try {
      for (const n of ['app', 'auth', 'database']) await yukle(`https://www.gstatic.com/firebasejs/10.12.2/firebase-${n}-compat.js`);
      const app = firebase.apps.find(a => a.name === 'koz') || firebase.initializeApp(CONFIG, 'koz');
      const cr = await firebase.auth(app).signInAnonymously(); uid = cr.user.uid;
      db = firebase.database(app);
      db.ref('.info/serverTimeOffset').on('value', sn => saatFarki = sn.val() || 0);
      const r = db.ref('kozmos/o');
      r.on('child_added', sn => al(sn.key, sn.val()), () => { durum = 'kapali'; });
      r.on('child_changed', sn => al(sn.key, sn.val()), () => { });
      r.on('child_removed', sn => UZAK.delete(sn.key), () => { });
      benRef = db.ref('kozmos/o/' + uid); benRef.onDisconnect().remove().catch(() => { });
      const gm = db.ref('kozmos/m/' + uid); gm.on('child_added', sn => { const v = sn.val(); sn.ref.remove().catch(() => { }); if (v && v.f !== uid && Date.now() + saatFarki - (v.t || 0) < 600000) oyGelen(v); }, () => { });
      setTimeout(() => { kkOku(); odulKontrol(); sohBaslat(); lOku(); pOku(); $('topBtn').hidden = false; kolosBagla(); }, 2500);
      durum = 'acik';
    } catch (e) { durum = 'kapali'; }
  }
  function gonder(zorla) {
    if (!benRef || durum !== 'acik' || !oyunda) return; const n = performance.now(); if (!zorla && n - sonGon < 1200) return; sonGon = n;
    const o = { t: firebase.database.ServerValue.TIMESTAMP, n: pilotAd(), x: Math.round(SH.x), y: Math.round(SH.y), a: Math.round(SH.a * 100) / 100, g: kapsul ? 'kapsul' : gemiTip, c: gemiRenk }; if (balonE && Date.now() + saatFarki - balonT < 4000) { o.e = balonE; o.et = balonT; }
    benRef.set(o).catch(() => { durum = 'kapali'; UZAK.clear(); });
  }
  function tur() { const n = performance.now(); for (const [id, e] of UZAK) if (n - e.son > 30000) UZAK.delete(id); if (durum === 'acik' && n - sonKK > 300000) { kkOku(); lOku(); pOku(); } }
  const simdi = () => Date.now() + saatFarki;
  function balon(e) { balonE = e; balonT = simdi(); gonder(true); }
  function mesaj(to, e, k) { if (!db || durum !== 'acik' || !uid) return; const m = { f: uid, n: pilotAd(), e, t: firebase.database.ServerValue.TIMESTAMP }; if (k) m.k = k; db.ref('kozmos/m/' + to).push(m).catch(() => { }); }
  function kkOku() {
    if (!db) return; sonKK = performance.now();
    db.ref('kozmos/kk').limitToLast(300).once('value').then(sn => { OKK.clear(); sn.forEach(c => { if (c.key === uid) return; const v = c.val(); if (!v || !v.l) return; for (const o of Object.values(v.l)) if (o && Array.isArray(o.h)) OKK.set(o.h.join(','), { n: String(v.n || '?').slice(0, 20), k: o.k ? 1 : 0, x: +o.x || 0, y: +o.y || 0 }); }); }).catch(() => { });
  }
  function kkGonder() {
    if (!db || !uid) return; const r = db.ref('kozmos/kk/' + uid);
    if (!KARAKOL.length) { r.remove().catch(() => { }); return; }
    r.set({ n: pilotAd(), t: firebase.database.ServerValue.TIMESTAMP, l: KARAKOL.slice(0, 12).map(k => { const s2 = sistem(k.hs[0], k.hs[1]); return { h: k.hs, k: k.koloni ? 1 : 0, x: s2 ? Math.round(s2.x) : 0, y: s2 ? Math.round(s2.y) : 0 }; }) }).catch(() => { });
  }
  async function hafta(hk) { if (!db) return null; try { const sn = await db.ref('kozmos/h/' + hk).orderByChild('p').limitToLast(20).once('value'); const L2 = []; sn.forEach(c => { L2.push(Object.assign({ id: c.key }, c.val())); }); return L2.reverse(); } catch (e) { return null; } }
  async function odulKontrol() {
    const onceki = haftaK(simdi() - 7 * 864e5); if (ST.hod === onceki) return; const L2 = await hafta(onceki); if (!L2) return; ST.hod = onceki;
    const i = L2.findIndex(r => r.id === uid); if (L2[0]) ST.hsamp = String(L2[0].n || '?').slice(0, 20);
    if (i >= 0 && i < 3 && (L2[i].p || 0) > 0) { const od = [15000, 8000, 4000][i]; kazan(od); ST.hilk = (ST.hilk || 0) + 1; duyur('📅 ' + T('Haftalık yarışma: ', 'Weekly contest: ') + '<b>' + (i + 1) + T('. oldun!', ' place!') + '</b>', 'galaksi', `+${SAYI(od)} 💰`); SES.galaksi(); basarimKontrol(); }
    kaydet();
  }
  async function ilkKesif(k) {
    if (!db || durum !== 'acik') return null;
    try { const r = await db.ref('kozmos/k/' + k).transaction(c => c === null ? { n: pilotAd(), t: Date.now() } : undefined, null, false); const v = r.snapshot.val(); if (v && v.n) ILK.set(k, v.n); return r.committed; } catch (e) { return null; }
  }
  function ilkAd(k) { if (ILK.has(k)) return ILK.get(k) || ''; if (!db || durum !== 'acik') return ''; ILK.set(k, ''); db.ref('kozmos/k/' + k).once('value').then(sn => { const v = sn.val(); ILK.set(k, v && v.n ? v.n : ''); }).catch(() => { }); return ''; }
  function siraGonder(zorla) { if (!db || durum !== 'acik' || !uid || !oyunda) return; const n = performance.now(); if (!zorla && n - sonR < 60000) return; sonR = n; db.ref('kozmos/r/' + uid).set({ n: pilotAd(), s: sayK('s'), p: Math.round(ST.kazanc), g: sayK('g'), t: firebase.database.ServerValue.TIMESTAMP }).catch(() => { }); try { db.ref('kozmos/pk/' + uid).set(pkVeri()).catch(() => { }); } catch (e) { } haftaKontrol(); if (ST.hp > 0) db.ref('kozmos/h/' + ST.hw + '/' + uid).set({ n: pilotAd(), p: Math.round(ST.hp), t: firebase.database.ServerValue.TIMESTAMP }).catch(() => { }); kkGonder(); }
  async function sira(alan) { if (!db) return null; try { const sn = await db.ref('kozmos/r').orderByChild(alan).limitToLast(20).once('value'); const L2 = []; sn.forEach(c => { L2.push(Object.assign({ id: c.key }, c.val())); }); return L2.reverse(); } catch (e) { return null; } }
  /* sohbet */
  let sohDin = false;
  function sohBaslat() { if (!db || sohDin) return; sohDin = true; db.ref('kozmos/s').orderByChild('t').startAt(simdi() - 86400000).limitToLast(60).on('child_added', sn => { const v = sn.val(); if (!v || typeof v.m !== 'string') return; SOH.push(Object.assign({ id: sn.key, ben: v.u === uid }, v)); if (SOH.length > 120) SOH.shift(); sohGeldi(v.u === uid); }, () => { }); }
  function sohGonder(m) { if (!db || durum !== 'acik' || !uid) return false; db.ref('kozmos/s').push({ u: uid, n: pilotAd(), m: m.slice(0, 140), t: firebase.database.ServerValue.TIMESTAMP, x: Math.floor(SH.x / SEK), y: Math.floor(SH.y / SEK) }).catch(() => { }); return true; }
  /* lonca */
  function lOku(cb) { if (!db) return; db.ref('kozmos/l').limitToLast(100).once('value').then(sn => { LON.clear(); sn.forEach(c => { const v = c.val(); if (v && typeof v.x === 'number') LON.set(c.key, Object.assign({ id: c.key }, v)); }); if (ST.lonca && !LON.has(ST.lonca)) ST.lonca = null; if (cb) cb(); }).catch(() => { }); }
  async function lKur(ad) { if (!db || !uid) return null; const r = db.ref('kozmos/l').push(); try { await r.set({ ad, kur: uid, x: Math.round(SH.x), y: Math.round(SH.y), p: 0, t: firebase.database.ServerValue.TIMESTAMP, u: { [uid]: pilotAd() } }); return r.key; } catch (e) { return null; } }
  async function lKatil(id) { if (!db || !uid) return false; try { if (ST.lonca && ST.lonca !== id) await db.ref('kozmos/l/' + ST.lonca + '/u/' + uid).remove(); await db.ref('kozmos/l/' + id + '/u/' + uid).set(pilotAd()); return true; } catch (e) { return false; } }
  async function lAyril(id) { if (!db || !uid) return; try { await db.ref('kozmos/l/' + id + '/u/' + uid).remove(); } catch (e) { } }
  async function lBagis(id, n) { if (!db) return false; try { const r = await db.ref('kozmos/l/' + id + '/p').transaction(c => (c || 0) + n); return r.committed; } catch (e) { return false; } }
  /* bulut kayıt */
  async function bulutYaz(kod, v) { if (!db || !uid) return false; try { await db.ref('kozmos/bulut/' + kod).set({ v, t: firebase.database.ServerValue.TIMESTAMP, n: pilotAd() }); return true; } catch (e) { return false; } }
  async function bulutOku(kod) { if (!db) return null; try { const sn = await db.ref('kozmos/bulut/' + kod).once('value'); return sn.val(); } catch (e) { return null; } }
  /* yarış sıralaması */
  function yrGonder(pid, ms) { if (!db || !uid) return; db.ref('kozmos/yr/' + pid + '/' + uid).transaction(c => !c || ms < c.s ? { n: pilotAd(), s: Math.round(ms) } : undefined).catch(() => { }); }
  async function yrSira(pid) { if (!db) return null; try { const sn = await db.ref('kozmos/yr/' + pid).orderByChild('s').limitToFirst(10).once('value'); const L2 = []; sn.forEach(c => { L2.push(Object.assign({ id: c.key }, c.val())); }); return L2; } catch (e) { return null; } }
  /* fotoğraf galerisi */
  async function fotoGonder(img, k) { if (!db || !uid) return false; try { await db.ref('kozmos/foto').push({ u: uid, n: pilotAd(), t: firebase.database.ServerValue.TIMESTAMP, img, k }); return true; } catch (e) { return false; } }
  async function fotoOku(tur) { if (!db) return null; try { const sn = await db.ref('kozmos/foto').orderByChild(tur === 'pop' ? 'b' : 't').limitToLast(12).once('value'); const L2 = []; sn.forEach(c => { L2.push(Object.assign({ id: c.key }, c.val())); }); return L2.reverse(); } catch (e) { return null; } }
  function fotoBegen(id) { if (!db || !uid) return; db.ref('kozmos/foto/' + id + '/b').transaction(c => (c || 0) + 1).catch(() => { }); }
  /* pilot izleri */
  async function izOku(sk) { if (!db) return null; try { const sn = await db.ref('kozmos/iz/' + sk).orderByChild('z').limitToLast(20).once('value'); const L2 = []; sn.forEach(c => { const v = c.val(); if (v && typeof v.x === 'number' && Date.now() - (v.z || 0) < 7 * 864e5) L2.push(Object.assign({ id: c.key, sk }, v)); }); return L2; } catch (e) { return null; } }
  function izYaz(sk, o) { if (!db || !uid || durum !== 'acik') return false; db.ref('kozmos/iz/' + sk).push(Object.assign({ u: uid, n: pilotAd(), z: firebase.database.ServerValue.TIMESTAMP }, o)).catch(() => { }); return true; }
  async function izAl(sk, id) { if (!db || !uid) return false; try { const r = await db.ref('kozmos/iz/' + sk + '/' + id + '/al').transaction(c => c ? undefined : uid); return !!(r && r.committed); } catch (e) { return false; } }
  function izBegen(sk, id) { if (!db || !uid) return; db.ref('kozmos/iz/' + sk + '/' + id + '/b').transaction(c => (c || 0) + 1).catch(() => { }); }
  /* haftalık boss */
  let bossRef = null;
  function bossBaslat(hk, M) {
    if (!db || !uid) return false; if (bossRef) bossRef.off();
    db.ref('kozmos/b/' + hk).transaction(c => c ? undefined : { max: M, can: M }).catch(() => { });
    bossRef = db.ref('kozmos/b/' + hk + '/can'); bossRef.on('value', sn => { const v = sn.val(); if (typeof v === 'number') bossGuncel(v, M); }, () => { }); return true;
  }
  function bossVur(hk, n, top) { if (!db || !uid || n <= 0) return; db.ref('kozmos/b/' + hk + '/can').transaction(c => typeof c === 'number' ? Math.max(0, c - Math.min(5000, n)) : c).catch(() => { }); db.ref('kozmos/b/' + hk + '/k/' + uid).set({ n: pilotAd(), d: Math.round(top) }).catch(() => { }); }
  async function bossSira(hk) { if (!db) return null; try { const sn = await db.ref('kozmos/b/' + hk + '/k').orderByChild('d').limitToLast(10).once('value'); const L2 = []; sn.forEach(c => { L2.push(Object.assign({ id: c.key }, c.val())); }); return L2.reverse(); } catch (e) { return null; } }
  /* pazar */
  function pOku(cb) { if (!db) return; db.ref('kozmos/p').limitToLast(150).once('value').then(sn => { PAZ.length = 0; sn.forEach(c => { const v = c.val(); if (v && v.m) PAZ.push(Object.assign({ id: c.key }, v)); }); pazarTahsil(); if (cb) cb(); }).catch(() => { }); }
  async function pKoy(m, a, f) { if (!db || !uid) return false; try { await db.ref('kozmos/p').push({ s: uid, n: pilotAd(), m, a, f, t: firebase.database.ServerValue.TIMESTAMP }); return true; } catch (e) { return false; } }
  async function pAl(id) { if (!db || !uid) return false; try { const r = await db.ref('kozmos/p/' + id).transaction(c => c && !c.b && c.s !== uid ? Object.assign({}, c, { b: uid, bn: pilotAd() }) : undefined); return r.committed; } catch (e) { return false; } }
  async function pSil(id) { if (!db) return false; try { await db.ref('kozmos/p/' + id).remove(); return true; } catch (e) { return false; } }
  async function pkOku(id) { if (!db) return null; try { return (await db.ref('kozmos/pk/' + id).once('value')).val(); } catch (e) { return null; } }
  async function ortakYaz(o) { if (!db || !uid || durum !== 'acik') return false; try { await db.ref('kozmos/ortak/' + uid).set(Object.assign({ t: firebase.database.ServerValue.TIMESTAMP, n: pilotAd() }, o)); return true; } catch (e) { return false; } }
  async function ortakOku(id) { if (!db) return null; try { return (await db.ref('kozmos/ortak/' + id).once('value')).val(); } catch (e) { return null; } }
  async function ortakKabul(id) { if (!db || !uid) return false; try { await db.ref('kozmos/ortak/' + id + '/k').set(uid); return true; } catch (e) { return false; } }
  function ortakSil() { if (db && uid) db.ref('kozmos/ortak/' + uid).remove().catch(() => { }); }
  const benimId = () => uid;
  async function frOku(hk) { if (!db) return null; try { return (await db.ref('kozmos/fr/' + hk).once('value')).val() || {}; } catch (e) { return null; } }
  /* sayaçlar: her artış oyuncunun kendi kaydıyla birlikte tek yazmada gider; kurallar hız ve haftalık tavanı denetler */
  const ART = n => firebase.database.ServerValue.increment(n), ZD = () => firebase.database.ServerValue.TIMESTAMP;
  function frEkleU(hk, k, n) { if (!db || !uid || durum !== 'acik') return Promise.resolve(false); const m = Math.min(50, n); return db.ref('kozmos').update({ ['fr/' + hk + '/' + k]: ART(m), ['fru/' + hk + '/' + uid + '/' + k]: ART(m), ['fru/' + hk + '/' + uid + '/z']: ZD() }).then(() => true).catch(() => false); }
  let anC = null;
  async function say(gun, olay) {
    if (!db || !uid || durum !== 'acik') return false;
    try {
      const sim = simdi();
      if (!anC) { const v = (await db.ref('kozmos/anu/' + uid).once('value')).val(); anC = v && Number.isFinite(v.b) && Number.isFinite(v.c) ? { b: v.b, c: v.c } : { b: 0, c: 0 }; }
      const yeni = !anC.b || sim - anC.b > 86400000;
      if (!yeni && anC.c >= 60) return true;
      await db.ref('kozmos').update({ ['an/' + gun + '/' + olay]: ART(1), ['anu/' + uid]: { b: yeni ? ZD() : anC.b, c: yeni ? 1 : anC.c + 1 } });
      if (yeni) anC = null; else anC.c++;
      return true;
    } catch (e) { anC = null; return false; }
  }
  async function evOku(hk) { if (!db) return null; try { const [a, b] = await Promise.all([db.ref('kozmos/ev/' + hk + '/t').once('value'), db.ref('kozmos/ev/' + hk + '/k').orderByChild('d').limitToLast(5).once('value')]); const L2 = []; b.forEach(c => { const v = c.val(); if (v && typeof v.d === 'number') L2.push(Object.assign({ id: c.key }, v)); }); return { t: +a.val() || 0, top: L2.reverse() }; } catch (e) { return null; } }
  async function evEkle(hk, n) { if (!db || !uid || durum !== 'acik' || n <= 0) return false; const m = Math.min(40, n), y = 'ev/' + hk + '/k/' + uid + '/'; try { await db.ref('kozmos').update({ ['ev/' + hk + '/t']: ART(m), [y + 'd']: ART(m), [y + 'n']: pilotAd(), [y + 'z']: ZD() }); return true; } catch (e) { return false; } }
  function sil() { if (benRef) benRef.remove().catch(() => { }); }
  return { pkOku, ortakYaz, ortakOku, ortakKabul, ortakSil, benimId, frOku, frEkle: frEkleU, say, evOku, evEkle, baslat, gonder, tur, UZAK, ilkKesif, ilkAd, siraGonder, sira, sil, simdi, balon, mesaj, kkOku, hafta, odulKontrol, sohBaslat, sohGonder, bulutYaz, bulutOku, yrGonder, yrSira, fotoGonder, fotoOku, fotoBegen, izOku, izYaz, izAl, izBegen, bossBaslat, bossVur, bossSira, lOku, lKur, lKatil, lAyril, lBagis, pOku, pKoy, pAl, pSil, durum: () => durum, uid: () => uid };
})();
let siraAlan = 's';
async function siraYaz() {
  const el = $('siraList'); if (!$('siraDet').open) return;
  document.querySelectorAll('[data-sira]').forEach(b => b.classList.toggle('on', b.dataset.sira === siraAlan));
  if (AG.durum() !== 'acik') { el.innerHTML = `<div style="display:block;color:var(--mute)">${AG.durum() === 'baglaniyor' ? T('Bağlanıyor…', 'Connecting…') : T('Çevrimiçi bağlantı kurulamadı.', 'Could not connect online.')}</div>`; if (AG.durum() === 'baglaniyor') setTimeout(siraYaz, 1500); return; }
  AG.siraGonder(true); el.innerHTML = `<div style="display:block;color:var(--mute)">${T('Yükleniyor…', 'Loading…')}</div>`;
  if (siraAlan === 'h') {
    haftaKontrol(); const L3 = await AG.hafta(ST.hw), son = new Date(AG.simdi()); son.setUTCHours(0, 0, 0, 0); son.setUTCDate(son.getUTCDate() + ((8 - (son.getUTCDay() || 7)) % 7 || 7)); const kal = son - AG.simdi(), gun = Math.floor(kal / 864e5), saat = Math.floor(kal % 864e5 / 36e5);
    const bas = `<div style="display:block;color:var(--mute);font-size:12px;margin-bottom:4px">📅 ${T('Bu hafta en çok kazanan ilk 3 ödül alır: 15.000 / 8.000 / 4.000 💰', 'Top 3 earners this week win 15,000 / 8,000 / 4,000 💰')} · ⏳ ${gun} ${T('gün', 'd')} ${saat} ${T('sa', 'h')}${ST.hsamp ? `<br>🏆 ${T('Geçen haftanın şampiyonu', 'Last week’s champion')}: <b>${esc(ST.hsamp)}</b>` : ''}<br>${T('Bu haftaki kazancın', 'Your earnings this week')}: <b>${SAYI(Math.round(ST.hp || 0))} 💰</b></div>`;
    if (!L3) { el.innerHTML = bas + `<div style="display:block;color:var(--mute)">${T('Sıralama okunamadı.', 'Could not read the leaderboard.')}</div>`; return; }
    el.innerHTML = bas + (L3.length ? L3.map((r, i) => `<div class="${r.id === AG.uid() ? 'ben' : ''}"><i>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1 + '.'}</i><span>${esc(String(r.n || '?').slice(0, 20))}</span><b>${SAYI(r.p || 0)} 💰</b></div>`).join('') : `<div style="display:block;color:var(--mute)">${T('Bu hafta henüz kimse yok — ilk sen ol!', 'Nobody yet this week — be the first!')}</div>`);
    return;
  }
  const L2 = await AG.sira(siraAlan); if (!L2) { el.innerHTML = `<div style="display:block;color:var(--mute)">${T('Sıralama okunamadı.', 'Could not read the leaderboard.')}</div>`; return; }
  el.innerHTML = L2.length ? L2.map((r, i) => `<div class="${r.id === AG.uid() ? 'ben' : ''}"><i>${i + 1}.</i><span>${esc(String(r.n || '?').slice(0, 20))}</span><b>${siraAlan === 's' ? SAYI(r.s || 0) + ' 🔭' : SAYI(r.p || 0) + ' 💰'}</b></div>`).join('') : `<div style="display:block;color:var(--mute)">${T('Henüz kimse yok — ilk sen ol!', 'Nobody yet — be the first!')}</div>`;
}
$('siraDet').addEventListener('toggle', siraYaz);
document.querySelectorAll('[data-sira]').forEach(b => b.onclick = () => { siraAlan = b.dataset.sira; SES.tik(); siraYaz(); });
addEventListener('pagehide', () => AG.sil());
setTimeout(() => AG.baslat(), 800);

