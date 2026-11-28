/* ================= dinamik olaylar: süpernova, solucan deliği, istila ================= */
let flasT = 0;
function snBasla(tm) { OLAY.push({ tip: 'sn', x: tm.x, y: tm.y, yr: tm.yr, t: 60, ad: tm.ad }); duyur('⚠ ' + T('Kararsız yıldız: ', 'Unstable star: ') + '<b>' + esc(tm.ad) + '</b>', 'uyari', T('60 saniye içinde süpernova olacak: uzaklaş! Sonra geride değerli bir bulut kalır.', 'It goes supernova in 60 seconds: get away! A valuable cloud will remain.')); SES.uyari(); }
function solucanAc() { const a = Math.atan2(SH.vy, SH.vx) + (Math.random() - 0.5) * 1.6, d = 1800 + Math.random() * 1500; OLAY.push({ tip: 'solucan', x: SH.x + Math.cos(a) * d, y: SH.y + Math.sin(a) * d, omur: 240 }); duyur('🌀 ' + T('Solucan deliği açıldı!', 'A wormhole opened!'), 'galaksi', T('4 dakika açık kalır · içine girersen bilinmeyen bir yere fırlatılırsın', 'Open for 4 minutes · enter it to be flung somewhere unknown')); SES.galaksi(); }
function istilaBasla() {
  const L2 = koloniBul(Math.floor(SH.x / SEK), Math.floor(SH.y / SEK), 4).filter(p => !yabanciMi(p)); if (!L2.length) return false; const p = L2[(Math.random() * L2.length) | 0];
  GOREV.push({ id: 'is' + Date.now(), tip: 'istila', h: p.id, hs: [p.s.t.sx, p.s.t.sy, p.i], ad: kolAd(p), son: Date.now() + 420000 }); gorevYaz();
  duyur('👾 ' + T('Uzaylı istilası: ', 'Alien raid: ') + '<b>' + esc(kolAd(p)) + '</b>', 'uyari', T('7 dakika içinde yetiş ve koloniyi savun · görevlere eklendi', 'Reach it within 7 minutes and defend it · added to missions')); SES.uyari(); return true;
}
function istilaKontrol() {
  for (const g of GOREV.slice()) {
    if (g.tip !== 'istila') continue; const s2 = sistem(g.hs[0], g.hs[1]), p = s2 && s2.gez[g.hs[2]]; if (!p) { GOREV = GOREV.filter(x => x !== g); continue; }
    if (Date.now() > g.son) { GOREV = GOREV.filter(x => x !== g); for (let i = KORS.length - 1; i >= 0; i--) if (KORS[i].ist === g.id) KORS.splice(i, 1); gorevYaz(); duyur('👾 ' + esc(g.ad) + T(' istilacılara dayanamadı', ' could not hold out against the raiders'), 'uyari'); continue; }
    const [px, py] = gezPos(p, simT()), d = Math.hypot(px - SH.x, py - SH.y);
    if (!g.aktif && d < 3500 && SH.warp < 0.3) { g.aktif = true; const gg = korsanGuc(); for (let i = 0; i < 5; i++) { const a = i * TAU / 5, mx = Math.round(150 + gg * 150); KORS.push({ x: px + Math.cos(a) * 700, y: py + Math.sin(a) * 700, vx: 0, vy: 0, a, can: mx, max: mx, atT: 1.5, yon: i % 2 ? 1 : -1, ist: g.id }); } duyur('👾 ' + T('İstilacılar seni gördü!', 'The raiders spotted you!'), 'uyari'); SES.uyari(); }
    else if (g.aktif && !KORS.some(k => k.ist === g.id)) { GOREV = GOREV.filter(x => x !== g); const od = 1200 + Math.round(korsanGuc() * 2000); kazan(od, 'gorev'); itEkle(p.id, 15); defter('👾 ' + g.ad + ' kolonisini uzaylı istilacılardan kurtardım.', '👾 I saved ' + g.ad + ' from alien raiders.'); frEkle('birlik', 4); ST.istila = (ST.istila || 0) + 1; if (Math.random() < 0.4) planVer('istila'); gorevYaz(); duyur('👾 ' + esc(g.ad) + T(' kurtarıldı!', ' is saved!'), 'galaksi', `+${SAYI(od)} 💰 · 🤝 +15`); SES.galaksi(); basarimKontrol(); }
  }
}
function olay2Adim(dt) {
  flasT = Math.max(0, flasT - dt);
  for (let i = OLAY.length - 1; i >= 0; i--) {
    const o = OLAY[i];
    if (o.tip === 'sn') { const once = o.t; o.t -= dt; if (once > 10 && o.t <= 10) duyur('⚠ ' + T('Süpernova 10 saniye içinde!', 'Supernova in 10 seconds!'), 'uyari'); if (o.t <= 0) { const d = Math.hypot(o.x - SH.x, o.y - SH.y); flasT = d < 30000 ? 1.5 : 0; patlamaEkle(o.x, o.y, 900, '255,240,210'); SES.patla(); if (d < 9000) hasar(15 + 70 * (1 - d / 9000), false, true); OLAY[i] = { tip: 'snb', x: o.x, y: o.y, R: 5000, n: 6, omur: 1800, ad: o.ad }; ST.sn = (ST.sn || 0) + 1; defter('💥 ' + o.ad + ' yıldızının süpernova oluşuna tanık oldum.', '💥 I watched the star ' + o.ad + ' go supernova.'); duyur('💥 ' + T('Süpernova: ', 'Supernova: ') + '<b>' + esc(o.ad) + '</b>', 'galaksi', T('Bulutun içinde nadir öz toplayabilirsin', 'Collect rare essence inside the cloud')); basarimKontrol(); } }
    else if (o.tip === 'snb' || o.tip === 'solucan') { o.omur -= dt; if (o.omur <= 0) OLAY.splice(i, 1); }
  }
}
const snbYakin = () => OLAY.find(o => o.tip === 'snb' && o.n > 0 && Math.hypot(o.x - SH.x, o.y - SH.y) < o.R);
const solucanYakin = () => OLAY.find(o => o.tip === 'solucan' && Math.hypot(o.x - SH.x, o.y - SH.y) < 380);
function snbTopla(o) { const yer = kapasite() - kargoDolu(); if (yer < 1) { duyur('📦 ' + T('Ambar dolu', 'Cargo hold full'), 'uyari'); return; } o.n--; if (Math.random() < 0.35) arsivBul('tuhaf', 'snb'); const n1 = Math.min(yer, 2), n2 = Math.min(yer - n1, Math.random() < 0.5 ? 1 : 0); KARGO.neb = (KARGO.neb || 0) + n1; if (n2) KARGO.kris = (KARGO.kris || 0) + n2; SES.koloni(); duyur('✨ ' + T('Süpernova özü', 'Supernova essence'), 'kesif', `${MAL.neb.e} +${n1}${n2 ? ' · ' + MAL.kris.e + ' +' + n2 : ''} · ${T('kalan', 'left')} ${o.n}`); }
function solucanGir(o) {
  OLAY.splice(OLAY.indexOf(o), 1); const a = Math.random() * TAU, d = (25 + Math.random() * 65) * SEK;
  SH.x += Math.cos(a) * d; SH.y += Math.sin(a) * d; SH.vx *= 0.2; SH.vy *= 0.2; cam.x = SH.x; cam.y = SH.y; oto = null; wp = null; flasT = 1; defter(`🌀 Bir solucan deliğine girdim ve ${Math.round(d / SEK)} sektör öteye fırlatıldım.`, `🌀 I entered a wormhole and was flung ${Math.round(d / SEK)} sectors away.`); KORS.length = 0; MERMI.length = 0; ST.solucan = (ST.solucan || 0) + 1;
  if (Math.random() < 0.5) setTimeout(() => arsivBul('tuhaf', 'solucan'), 1500);
  SES.galaksi(); duyur('🌀 ' + T('Solucan deliğinden çıktın!', 'You came out of the wormhole!'), 'galaksi', T(`${Math.round(d / SEK)} sektör öteye fırlatıldın · Sektör ${Math.floor(SH.x / SEK)} : ${Math.floor(SH.y / SEK)}`, `Flung ${Math.round(d / SEK)} sectors away · Sector ${Math.floor(SH.x / SEK)} : ${Math.floor(SH.y / SEK)}`)); basarimKontrol(); kaydet();
}
function olay2Ciz(t) {
  for (const o of OLAY) {
    if (o.tip !== 'sn' && o.tip !== 'snb' && o.tip !== 'solucan') continue; const [X, Y] = W2S(o.x, o.y);
    if (o.tip === 'sn') { const R = Math.max(30, o.yr * 3 * cam.z) * (1 + 0.25 * Math.sin(t * (12 - o.t / 6))); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, 'rgba(255,255,255,.6)'); g.addColorStop(0.5, 'rgba(255,120,80,.3)'); g.addColorStop(1, 'rgba(255,60,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FF9A80'; ctx.fillText('⚠ ' + T('Süpernova', 'Supernova') + ' 0:' + String(Math.max(0, Math.ceil(o.t))).padStart(2, '0'), X, Y - R - 8); }
    else if (o.tip === 'snb') { const R = o.R * cam.z; if (X < -R || X > W + R || Y < -R || Y > H + R) continue; ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const a = t * 0.05 + k * 2.1, cx = X + Math.cos(a) * R * 0.25, cy = Y + Math.sin(a) * R * 0.25, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, ['rgba(255,120,200,.22)', 'rgba(120,200,255,.2)', 'rgba(255,210,120,.18)'][k]); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; if (R > 40) { ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFC8E8'; ctx.fillText('✨ ' + T('Süpernova bulutu', 'Supernova cloud') + ' · ' + o.n, X, Y); } }
    else { const R = Math.max(14, 160 * cam.z); if (X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) continue; ctx.save(); ctx.translate(X, Y); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { ctx.rotate(t * 0.8 + k); ctx.strokeStyle = `rgba(${150 + k * 20},${120 + k * 15},255,${0.5 - k * 0.07})`; ctx.lineWidth = Math.max(1.5, R * 0.06); ctx.beginPath(); ctx.ellipse(0, 0, R * (1 - k * 0.15), R * (0.55 - k * 0.07), 0, 0, TAU * 0.8); ctx.stroke(); } const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.5); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(60,20,120,0)'); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, TAU); ctx.fill(); ctx.restore(); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#D8C6FF'; ctx.fillText('🌀 ' + T('Solucan deliği', 'Wormhole') + ' · ' + Math.ceil(o.omur / 60) + T(' dk', ' min'), X, Y - R - 10); }
  }
}
/* ================= yıldız istasyonları ================= */
function istPos(G) { return [G.x + Math.cos(G.faz + 4) * G.R * 0.45, G.y + Math.sin(G.faz + 4) * G.R * 0.45]; }
function istYakin() { const G = galaksi(...galHucre(SH.x, SH.y)), [x, y] = istPos(G); return Math.hypot(x - SH.x, y - SH.y) < 650 ? G : null; }
const istAd = G => L(G.ad).split(' ')[0] + T(' Yıldız İstasyonu', ' Star Station');
function istCiz(t) {
  const [gx, gy] = galHucre(cam.x, cam.y); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const G = galaksi(gx + i, gy + j), [x, y] = istPos(G), [X, Y] = W2S(x, y), R = Math.max(12, 220 * cam.z); if (X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) continue;
    ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 0.04); ctx.strokeStyle = '#7FE3FF'; ctx.lineWidth = Math.max(1.5, R * 0.05); ctx.fillStyle = '#122038';
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; k ? ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R) : ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R); } ctx.closePath(); ctx.stroke();
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke(); ctx.fillStyle = Math.sin(t * 3 + k) > 0 ? '#FFE3A6' : '#7FE3FF'; ctx.beginPath(); ctx.arc(Math.cos(a) * R, Math.sin(a) * R, Math.max(2, R * 0.06), 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1C3050'; ctx.beginPath(); ctx.arc(0, 0, R * 0.38, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#BFF0FF'; ctx.fillText('🛰 ' + istAd(G), X, Y - R - 10);
  }
}
let istAcik = false, istG = null, istSek = 'bar', ISK = { kart: 7, son: '' };
function istAc(G) { istAcik = true; istG = G; SH.vx = SH.vy = 0; oto = null; KORS.length = 0; MERMI.length = 0; ISK.kart = 1 + ((Math.random() * 13) | 0); ISK.son = ''; ST.istZ = (ST.istZ || 0) + 1; istYaz(); $('istasyon').hidden = false; SES.koloni(); gpImza = ''; basarimKontrol(); }
function istKapat() { istAcik = false; $('istasyon').hidden = true; SES.tik(); kaydet(); }
function istIlan(G) {
  const saat = Math.floor(Date.now() / 3.6e6), r = rng(h32(G.seed, saat, 919)), [x, y] = istPos(G), sx = Math.floor(x / SEK), sy = Math.floor(y / SEK), L2 = [];
  for (let j = 0; j < 2; j++) { const a = r() * TAU, dd = 6 + r() * 8, ks = koloniBul(sx + Math.round(Math.cos(a) * dd), sy + Math.round(Math.sin(a) * dd), 2); if (!ks.length) continue; const q = ks[(r() * ks.length) | 0], id = G.k + '@' + saat + '#' + j; if (ALINAN.has(id)) continue; const ds = Math.hypot(q.s.x - x, q.s.y - y) / SEK, yuk = 3 + ((r() * 5) | 0); L2.push({ id, tip: 'teslim', h: q.id, hs: [q.s.t.sx, q.s.t.sy, q.i], ad: kolAd(q), sis: q.s.t.ad, yuk, kisi: 0, odul: Math.round((80 + yuk * 7 + ds * 65) * 1.8), oz: true }); }
  return L2;
}
const SOYLENTI = [['Bir pilot uzak bir sektörde açık bir solucan deliği gördüğünü fısıldıyor… ve gerçekten de yakında bir tane açılıyor!', 'A pilot whispers about an open wormhole… and one really is opening nearby!'], ['Barmen eğilip korsan limanının yerini söylüyor. Haritana işaretlendi.', 'The bartender leans in and tells you where the pirate haven is. Marked on your map.'], ['Yaşlı bir kâşif, yakında çözülmemiş antik kalıntılar olduğunu anlatıyor. Rota çizildi.', 'An old explorer tells of unsolved ancient ruins nearby. Route set.'], ['Hurdacılar bu galaksideki gemi mezarlığından söz ediyor: zulalar ve mayınlar… Rota çizildi.', 'Scavengers talk about this galaxy’s ship graveyard: caches and mines… Route set.'], ['Tüccarlar piyasa haberlerini konuşuyor:', 'Traders are talking market news:']];
function istYaz() {
  const G = istG; if (!G) return; const eksik = Math.max(0, Math.ceil(tank() - yakit)), onar = Math.ceil(maxCan() - can);
  let h = `<h2 style="margin:0 0 2px;font-size:21px;font-weight:900">🛰 ${esc(istAd(G))}</h2><div class="alt" style="margin:0 0 6px">${T('Galaksinin ticaret ve eğlence merkezi.', 'The galaxy’s hub for trade and fun.')}</div><div class="lmEk"><span>💰 ${SAYI(kredi)}</span><span>⛽ ${Math.floor(yakit)}/${tank()}</span><span>🛡 ${Math.ceil(can)}/${maxCan()}</span><span style="flex:1"></span>${onar > 0 && !kapsul ? `<button class="kb al" type="button" data-is="onar" ${kredi < onar ? 'disabled' : ''}>🔧 ${SAYI(onar)} 💰</button>` : ''}${eksik && !kapsul ? `<button class="kb al" type="button" data-is="yakit" ${kredi < eksik * 5 ? 'disabled' : ''}>⛽ ${SAYI(eksik * 5)} 💰</button>` : ''}</div>`;
  h += `<div class="dg" style="margin:6px 0 0"><button class="kb al" type="button" data-is="pazar">🤝 ${T('Pilot pazarı', 'Pilot market')}</button></div>`;
  h += `<div class="sekme">${[['bar', T('🍹 Bar', '🍹 Bar')], ['sans', T('🃏 Şans kartı', '🃏 Lucky card')], ['ilan', T('📌 İş ilanları', '📌 Job board')]].map(([k, a]) => `<button type="button" data-isek="${k}" class="${istSek === k ? 'on' : ''}">${a}</button>`).join('')}</div>`;
  if (istSek === 'bar') {
    h += `<div class="satir"><div>🍹 <b>${T('Bir içki ısmarla', 'Buy a round')}</b><small>${T('Müdavimler konuşmaya başlar: söylentiler, ipuçları, yer bilgileri', 'The regulars start talking: rumours, tips, locations')}</small></div><div class="dg"><button class="kb al" type="button" data-is="icki" ${kredi < 80 ? 'disabled' : ''}>80 💰</button></div></div>`;
    if (ISK.soy) h += `<div class="alt" style="margin:8px 0 0;padding:10px;border-radius:12px;background:rgba(255,200,87,.1);color:#FFE3A6">💬 ${ISK.soy}</div>`;
  } else if (istSek === 'sans') {
    /* bahissiz: günde 3 tahmin hakkı; bilirsen sabit ödül, bilemezsen bir şey kaybetmezsin */
    const bugun = new Date().toDateString(); if (ST.sansGun !== bugun) { ST.sansGun = bugun; ST.sansHak = 3; }
    h += `<div class="alt" style="margin:4px 0 6px">${T('Barmenin kart oyunu: sıradaki kart açık karttan yüksek mi, alçak mı? Bilirsen 300 💰 ödül. Bilemezsen bir şey kaybetmezsin. Her gün 3 hakkın var.', 'The bartender\'s card game: will the next card be higher or lower than the open one? Guess right for a 300 💰 reward. A wrong guess costs nothing. You get 3 tries a day.')}</div>`;
    const kartY = n => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][n - 1], hak = ST.sansHak || 0;
    h += `<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin:8px 0"><div style="width:74px;height:104px;border-radius:12px;background:linear-gradient(#F4F6FF,#C8D2EC);color:#1A2340;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;box-shadow:0 6px 18px rgba(0,0,0,.4)">${kartY(ISK.kart)}</div><div style="display:flex;flex-direction:column;gap:6px"><button class="kb al" type="button" data-is="yuk" ${hak ? '' : 'disabled'}>⬆ ${T('Yüksek', 'Higher')}</button><button class="kb al" type="button" data-is="alc" ${hak ? '' : 'disabled'}>⬇ ${T('Alçak', 'Lower')}</button></div></div>`;
    h += `<div class="alt" style="text-align:center">${hak ? T(`Bugün ${hak} hakkın kaldı.`, `${hak} tries left today.`) : T('Bugünlük hakların bitti; yarın yine gel.', 'No tries left today; come back tomorrow.')}</div>`;
    if (ISK.son) h += `<div class="alt" style="text-align:center;margin:8px 0 0;font-weight:900">${ISK.son}</div>`;
  } else {
    const L2 = istIlan(G); G._il = L2;
    h += `<div class="alt" style="margin:4px 0 0">${T('Uzak kolonilere yüksek ücretli teslimatlar.', 'Well-paid deliveries to distant colonies.')}</div>`;
    if (!L2.length) h += `<div class="alt">${T('Şu an ilan yok, bir saat sonra tekrar bak.', 'No jobs right now, check again in an hour.')}</div>`;
    L2.forEach((g, i) => { const yer = kargoDolu() + g.yuk <= kapasite(), dol = gSay() >= 4; h += `<div class="satir"><div>${gorevMetin(g)}<small style="color:var(--altin)">+${SAYI(g.odul)} 💰 · 📦 ${g.yuk}</small></div><div class="dg"><button class="kb al" type="button" data-ilan="${i}" ${!yer || dol || kapsul ? 'disabled' : ''}>${dol ? T('En çok 4', 'Max 4') : !yer ? T('Yer yok', 'No room') : T('Kabul et', 'Accept')}</button></div></div>`; });
  }
  $('isIc').innerHTML = h;
}
$('istasyon').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return; const G = istG;
  if (b.id === 'isKapat') { istKapat(); return; }
  if (b.dataset.isek) { istSek = b.dataset.isek; SES.tik(); }
  else if (b.dataset.is === 'pazar') { tpAc('paz'); return; }
  else if (b.dataset.is === 'onar') { const f = Math.ceil(maxCan() - can); if (kredi >= f) { kredi -= f; can = maxCan(); SES.koloni(); } }
  else if (b.dataset.is === 'yakit') { const n = Math.ceil(tank() - yakit); if (kredi >= n * 5) { kredi -= n * 5; yakit = tank(); SES.tik(); } }
  else if (b.dataset.is === 'icki' && kredi >= 80) {
    kredi -= 80; const r = (Math.random() * SOYLENTI.length) | 0; let ek = '';
    if (r === 0) solucanAc();
    else if (r === 1) { const [x, y] = korsanLimanPos(G); wp = { x, y, k: '', ad: T('Korsan limanı', 'Pirate haven') }; }
    else if (r === 2) { const p2 = kalintiBul(); if (p2) { wp = { x: p2.s.t.x, y: p2.s.t.y, k: p2.s.t.k, ad: p2.ad }; ek = ' <b>' + esc(p2.ad) + '</b>'; } }
    else if (r === 3) { const [x, y] = mezarPos(G); wp = { x, y, k: '', ad: T('Gemi mezarlığı', 'Ship graveyard') }; }
    else { const L2 = piyasaOlay(Math.floor(Math.floor(SH.x / SEK) / 8), Math.floor(Math.floor(SH.y / SEK) / 8)); ek = L2.length ? ' ' + L2.map(o => `${o.kit ? T('Kıtlık', 'Shortage') : T('Bolluk', 'Glut')} <b>${esc(kolAd(o.p))}</b> ${MAL[o.m].e}`).join(' · ') : T(' bu ara piyasa sakin.', ' the market is quiet these days.'); }
    ISK.soy = L(SOYLENTI[r]) + ek; SES.tik();
  }
  else if ((b.dataset.is === 'yuk' || b.dataset.is === 'alc') && (ST.sansHak || 0) > 0) {
    const yeni = 1 + ((Math.random() * 13) | 0), kaz = b.dataset.is === 'yuk' ? yeni > ISK.kart : yeni < ISK.kart; ST.sansHak--; ST.sans = (ST.sans || 0) + 1;
    if (kaz) { kredi += 300; ISK.son = '🎉 ' + T('Bildin! ', 'Correct! ') + '+300 💰'; SES.koloni(); } else { ISK.son = '🙂 ' + T('Bilemedin, kart ', 'Not this time, the card was ') + ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][yeni - 1]; SES.tik(); }
    ISK.kart = yeni; basarimKontrol();
  }
  else if (b.dataset.ilan != null) { const g = (G._il || [])[+b.dataset.ilan]; if (g && gSay() < 4 && kargoDolu() + g.yuk <= kapasite()) { GOREV.push(g); ALINAN.add(g.id); SES.koloni(); gorevYaz(); } }
  istYaz(); kaydet();
});
/* ================= gemi mezarlığı ================= */
function mezarPos(G) { return [G.x + Math.cos(G.faz + 3.6) * G.R * 0.9, G.y + Math.sin(G.faz + 3.6) * G.R * 0.9]; }
const MZC = new Map(), MZP = new Set();
function mezar(G) {
  if (MZC.has(G.k)) return MZC.get(G.k); const r = rng(h32(G.seed, 5, 6161)), [x, y] = mezarPos(G), o = { x, y, enk: [], may: [], zul: [] };
  for (let i = 0; i < 46; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 5200; o.enk.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, a: r() * TAU, s: 0.7 + r() * 1.8, g: ['kasif', 'yuk', 'avci', 'zirh'][(r() * 4) | 0], w: (r() - 0.5) * 0.2 }); }
  for (let i = 0; i < 7; i++) { const a = r() * TAU, d = 900 + r() * 3800; o.may.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, id: G.k + 'm' + i }); }
  for (let i = 0; i < 4; i++) { const a = r() * TAU, d = 1200 + r() * 3600; o.zul.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, id: 'z:' + G.k + ':' + i }); }
  MZC.set(G.k, o); return o;
}
let mezarIc = '';
function mezarAdim() {
  const G = galaksi(...galHucre(SH.x, SH.y)), M = mezar(G), d = Math.hypot(M.x - SH.x, M.y - SH.y);
  if (d < 5600 && mezarIc !== G.k) { mezarIc = G.k; ST.mezar = (ST.mezar || 0) + 1; duyur('⚓ ' + T('Gemi mezarlığı', 'Ship graveyard'), 'galaksi', T('Eski bir savaşın kalıntıları: dikkat, mayınlar var! Gizli zulaları ara.', 'Remains of an old battle: careful, mines! Look for hidden caches.')); if (FR.klan < 30 && !KORS.length && !kapsul) setTimeout(() => { if (!KORS.length) korsanCikar(); }, 3000); basarimKontrol(); }
  else if (d > 7000 && mezarIc === G.k) mezarIc = '';
  if (d > 6000) return;
  for (const m of M.may) if (!MZP.has(m.id) && Math.hypot(m.x - SH.x, m.y - SH.y) < 150) { MZP.add(m.id); patlamaEkle(m.x, m.y, 140, '255,140,80'); SES.patla(); hasar(25); duyur('💣 ' + T('Eski bir mayına çarptın!', 'You hit an old mine!'), 'uyari'); }
}
const zulaYakin = () => { const G = galaksi(...galHucre(SH.x, SH.y)), M = mezar(G); if (Math.hypot(M.x - SH.x, M.y - SH.y) > 6000) return null; return M.zul.find(z => !KESIF.has(z.id) && Math.hypot(z.x - SH.x, z.y - SH.y) < 320) || null; };
function zulaAc(z) {
  KESIF.add(z.id); defter('💎 Bir gemi mezarlığında gizli bir zula buldum.', '💎 I found a hidden cache in a ship graveyard.'); const od = 600 + ((Math.random() * 1400) | 0); kazan(od, 'kesif'); const yaz = [`+${SAYI(od)} 💰`];
  const m = NADIR[(Math.random() * NADIR.length) | 0], n = Math.min(kapasite() - kargoDolu(), 2 + ((Math.random() * 3) | 0)); if (n > 0) { KARGO[m] = (KARGO[m] || 0) + n; yaz.push(`${MAL[m].e} +${n}`); }
  if (Math.random() < 0.35 && planVer('zula')) yaz.push('📜'); else if (Math.random() < 0.4) { const k = ['kit', 'emp', 'yhucre'][(Math.random() * 3) | 0]; if (SARF[k] < SARF_MAX) { SARF[k]++; yaz.push(SARFE[k].e + ' +1'); } }
  if (Math.random() < 0.35) arsivBul(Math.random() < 0.5 ? 'kadim' : 'tuhaf', 'zula');
  ST.zula = (ST.zula || 0) + 1; SES.galaksi(); duyur('💎 ' + T('Gizli zula açıldı!', 'Hidden cache opened!'), 'galaksi', yaz.join(' · ')); basarimKontrol(); kaydet();
}
function mezarCiz(t) {
  const G = galaksi(...galHucre(cam.x, cam.y)), M = mezar(G); const [CX, CY] = W2S(M.x, M.y), RR = 6000 * cam.z; if (CX < -RR || CX > W + RR || CY < -RR || CY > H + RR) return;
  for (const e of M.enk) { const [X, Y] = W2S(e.x, e.y), sk = Math.max(0.35, cam.z) * e.s; if (X < -60 || X > W + 60 || Y < -60 || Y > H + 60) continue; { const sp = gemiSprite(e.g, 5, 'hurda'); ctx.save(); ctx.translate(X, Y); ctx.rotate(e.a + t * e.w); ctx.scale(sk, sk); ctx.globalAlpha = 0.75; ctx.drawImage(sp.c, sp.x0, sp.y0, sp.c.width / SS, sp.c.height / SS); ctx.globalAlpha = 1; ctx.strokeStyle = '#07090E'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-1, -2); ctx.lineTo(4, 8); ctx.stroke(); ctx.restore(); } }
  for (const m of M.may) { if (MZP.has(m.id)) continue; const [X, Y] = W2S(m.x, m.y); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; ctx.fillStyle = Math.sin(t * 5) > 0 ? '#FF5C6E' : '#7A2830'; ctx.beginPath(); ctx.arc(X, Y, Math.max(3, 14 * cam.z), 0, TAU); ctx.fill(); }
  for (const z of M.zul) { if (KESIF.has(z.id)) continue; const [X, Y] = W2S(z.x, z.y); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; if (Math.hypot(z.x - SH.x, z.y - SH.y) < 1500 * taraK()) { ctx.fillStyle = `rgba(127,227,255,${(0.5 + 0.4 * Math.sin(t * 4)).toFixed(2)})`; ctx.beginPath(); ctx.arc(X, Y, Math.max(3.5, 16 * cam.z), 0, TAU); ctx.fill(); ctx.font = '800 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💎', X, Y - 12); } }
  if (RR > 30) { ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#B8C0D8'; ctx.fillText('⚓ ' + T('Gemi mezarlığı', 'Ship graveyard'), CX, CY); }
}
/* ================= fraksiyonlar ================= */
const FRA = { birlik: { e: '🛡', ad: ['İnsan Birliği', 'Human Union'] }, tuccar: { e: '💼', ad: ['Serbest Tüccarlar', 'Free Traders'] }, klan: { e: '☠', ad: ['Korsan Klanları', 'Pirate Clans'] } };
/* ================= fraksiyon bölge savaşları ================= */
const FRK = ['birlik', 'tuccar', 'klan'], FR_RENK = { birlik: '110,170,255', tuccar: '255,205,100', klan: '255,95,110' };
const FR_ETKI = { birlik: ['Devriye bölgesi: korsan daha az, görev ödülleri +%10', 'Patrolled space: fewer pirates, mission rewards +10%'], tuccar: ['Ticaret bölgesi: alışta %7 ucuz, satışta %8 pahalı', 'Trade space: buy 7% cheaper, sell 8% higher'], klan: ['Klan bölgesi: korsan daha sık, ödül avcılığı +%25', 'Clan space: more pirates, bounties +25%'] };
const FRW = { bu: null, gecen: null, hk: '', ben: { birlik: 0, tuccar: 0, klan: 0 }, kat: K.frk && typeof K.frk === 'object' ? K.frk : {}, gonT: -1e9, okT: -1e9 };
const BOLC = new Map(); let bolgeSon = undefined, bolgeT = 0;
function frPay() { const g = FRW.gecen, t = g ? FRK.reduce((a, k) => a + (+g[k] || 0), 0) : 0; if (t < 30) return { birlik: 1 / 3, tuccar: 1 / 3, klan: 1 / 3 }; const o = {}; for (const k of FRK) o[k] = (+g[k] || 0) / t; return o; }
function frGurultu(x, y, sd) { const X = Math.floor(x), Y = Math.floor(y), fx = x - X, fy = y - Y, v = (a, b) => (h32(a, b, sd) % 10007) / 10007, s = t => t * t * (3 - 2 * t), a = v(X, Y), b = v(X + 1, Y), c = v(X, Y + 1), d = v(X + 1, Y + 1), ux = s(fx), uy = s(fy); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; }
function bolgeFr(sx, sy) {
  const an = sx + ',' + sy; if (BOLC.has(an)) return BOLC.get(an);
  const cx = (sx + 0.5) * SEK, cy = (sy + 0.5) * SEK, G = galaksi(...galHucre(cx, cy)); let r = null;
  if (Math.hypot(cx - G.x, cy - G.y) < G.R && !(G.irk && G.irk !== 'insan')) {
    const p = frPay(), m = Math.hypot(sx, sy); let ev = -1; if (m < 4.5) { BOLC.set(an, 'birlik'); return 'birlik'; }
    FRK.forEach((k, i) => { let v = frGurultu(sx / 7, sy / 7, 501 + i * 97) * 0.7 + frGurultu(sx / 2.5, sy / 2.5, 777 + i * 13) * 0.3; if (k === 'birlik') v += 0.22 * Math.exp(-m / 10); if (k === 'klan') v += 0.12 * Math.min(1, m / 40); v *= 0.85 + 0.45 * p[k]; if (v > ev) { ev = v; r = k; } });
  }
  BOLC.set(an, r); if (BOLC.size > 20000) BOLC.clear(); return r;
}
function bolgeAdim() {
  BOLGE = oyunda ? bolgeFr(Math.floor(SH.x / SEK), Math.floor(SH.y / SEK)) : null;
  if (oyunda && BOLGE !== bolgeSon && SH.warp < 0.3) { if (bolgeSon !== undefined && BOLGE && performance.now() - bolgeT > 25000) { bolgeT = performance.now(); duyur(FRA[BOLGE].e + ' ' + L(FRA[BOLGE].ad) + T(' bölgesine girdin', ' territory'), 'kesif', L(FR_ETKI[BOLGE])); } bolgeSon = BOLGE; }
  const hk = evHk(); if (FRW.hk !== hk) { FRW.hk = hk; FRW.bu = null; FRW.gecen = null; BOLC.clear(); FRW.okT = -1e9; }
  if (AG.durum() !== 'acik') return; const n = performance.now();
  if (n - FRW.gonT > 60000) { const k = FRK.find(x => FRW.ben[x] >= 1); if (k) { FRW.gonT = n; const m = Math.min(50, Math.floor(FRW.ben[k])); FRW.ben[k] -= m; AG.frEkle(hk, k, m).then(ok => { if (ok) { FRW.kat[hk] = FRW.kat[hk] || {}; FRW.kat[hk][k] = (FRW.kat[hk][k] || 0) + m; } else FRW.ben[k] += m; }); } }
  if (n - FRW.okT > 180000) { FRW.okT = n; const gk = haftaK(Date.now() - 7 * 864e5); Promise.all([AG.frOku(hk), AG.frOku(gk)]).then(([a, b]) => { if (a) FRW.bu = a; if (b) { const eski = JSON.stringify(FRW.gecen); FRW.gecen = b; if (eski !== JSON.stringify(b)) BOLC.clear(); } }); }
}
setInterval(() => { try { bolgeAdim(); } catch (e) { } }, 1000);
function frSavasYaz() {
  const hk = evHk(), bu = FRW.bu || {}, t = FRK.reduce((a, k) => a + (+bu[k] || 0), 0), ben = (FRW.kat[hk] || {}), p = frPay();
  return `<div style="margin-top:12px;font-weight:900">⚔ ${T('Bölge savaşı', 'Territory war')} <span class="alt" style="font-weight:700;font-size:12px">· ${T('bu hafta', 'this week')}</span></div>
  <div class="alt" style="font-size:12px">${T('Bir fraksiyona yaptığın her iyilik (görev, kervan, korsan avı, kara borsa) o fraksiyonun haftalık etkisine eklenir. Haftanın sonunda sınırlar sonuca göre kayar.', 'Every favour you do a faction (missions, convoys, pirate hunting, black market) adds to its weekly influence. At week end the borders shift by the result.')}</div>
  ${FRK.map(k => `<div style="display:grid;grid-template-columns:110px 1fr 70px;gap:8px;align-items:center;margin:5px 0;font-size:12.5px;font-weight:800"><span>${FRA[k].e} ${L(FRA[k].ad).split(' ').slice(-1)[0]}</span><span style="display:block;height:9px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${t ? Math.round(100 * (+bu[k] || 0) / t) : 0}%;background:rgb(${FR_RENK[k]})"></i></span><span class="alt" style="text-align:right">${SAYI(+bu[k] || 0)}${ben[k] ? ' · ' + T('sen ', 'you ') + SAYI(ben[k]) : ''}</span></div>`).join('')}
  <div class="alt" style="font-size:12px">${T('Şu an bulunduğun yer', 'You are in')}: ${BOLGE ? `<b style="color:rgb(${FR_RENK[BOLGE]})">${FRA[BOLGE].e} ${L(FRA[BOLGE].ad)}</b> — ${L(FR_ETKI[BOLGE])}` : T('tarafsız bölge', 'neutral space')} · ${T('Geçen haftanın payları', 'Last week’s shares')}: ${FRK.map(k => FRA[k].e + ' %' + Math.round(100 * p[k])).join(' ')}</div>`;
}
function frEkle(k, n) {
  if (n > 0 && FRW.ben[k] != null) FRW.ben[k] += n;
  const once = FR[k]; FR[k] = Math.max(-100, Math.min(100, once + n)); const sv = v => v >= 30 ? 1 : v <= -30 ? -1 : 0;
  if (sv(FR[k]) !== sv(once)) setTimeout(() => duyur(FRA[k].e + ' ' + L(FRA[k].ad) + ': <b>' + (sv(FR[k]) > 0 ? T('dost', 'friendly') : sv(FR[k]) < 0 ? T('düşman', 'hostile') : T('tarafsız', 'neutral')) + '</b>', sv(FR[k]) < 0 ? 'uyari' : 'galaksi', L(frEtki(k))), 600);
}
function frEtki(k) {
  const v = FR[k];
  if (k === 'birlik') return v >= 30 ? ['İnsan galaksilerinde devriyeler korsanlara karşı yardımına gelir', 'Patrols help you against pirates in human galaxies'] : v <= -30 ? ['Aranıyorsun: insan kolonilerinde fiyatlar %15 pahalı, taramalar sıklaşır', 'Wanted: human colonies charge 15% more and scan you more often'] : ['Korsan avla, görev yap: Birlik seni sever', 'Hunt pirates and run missions to win the Union over'];
  if (k === 'tuccar') return v >= 30 ? ['Her yerde alış ve satışta %5 daha iyi fiyat; 60’ta kervanlar %20 fazla kazanır', '5% better prices everywhere; at 60 convoys earn 20% more'] : ['Ticaret yaptıkça ve kervanları korudukça artar', 'Grows as you trade and protect convoys'];
  return v >= 30 ? ['Sıradan korsanlar sana saldırmaz', 'Ordinary pirates leave you alone'] : v <= -30 ? ['Klanlar peşinde: korsanlar daha sık gelir, kara borsa kapalı', 'The clans hunt you: more pirates, black market closed'] : ['Kara borsada iş yaptıkça artar, korsan avladıkça düşer', 'Rises with black-market deals, falls as you hunt pirates'];
}
function frYaz() {
  return Object.keys(FRA).map(k => { const v = Math.round(FR[k]), f = (v + 100) / 2; return `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:900"><span>${FRA[k].e} ${L(FRA[k].ad)}</span><span style="color:${v >= 30 ? '#9BE07A' : v <= -30 ? '#FF7B8A' : 'var(--mute)'}">${v > 0 ? '+' : ''}${v}</span></div><div style="height:7px;border-radius:4px;background:rgba(255,255,255,.08);position:relative;margin:3px 0"><i style="position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:rgba(255,255,255,.3)"></i><i style="display:block;height:100%;width:${f}%;border-radius:4px;background:${v >= 30 ? '#9BE07A' : v <= -30 ? '#FF7B8A' : '#7FE3FF'}"></i></div><small style="color:var(--mute);font-size:11.5px">${L(frEtki(k))}</small></div>`; }).join('');
}
/* devriyeler (Birlik dostuysan) */
const DOST = [];
function devriyeCagir() {
  const G = galaksi(...galHucre(SH.x, SH.y)), uz = G.irk && G.irk !== 'insan'; if (uz ? DIP[G.irk] < 70 : FR.birlik < 30) return;
  setTimeout(() => { if (!KORS.length) return; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; DOST.push({ x: SH.x + Math.cos(a) * 2200, y: SH.y + Math.sin(a) * 2200, vx: 0, vy: 0, a: 0, atT: 1, yon: i ? 1 : -1, git: 0, irk: uz ? G.irk : null }); } duyur(uz ? IRK[G.irk].e + ' ' + L(IRK[G.irk].ad) + T(' müttefiklerin yardıma geliyor', ' allies are coming to help') : '🛡 ' + T('Birlik devriyesi yardıma geliyor', 'A Union patrol is coming to help'), 'koloni'); }, 4000);
}
function devriyeAdim(dt) {
  for (let i = DOST.length - 1; i >= 0; i--) {
    const d = DOST[i]; let en = null, ed = Infinity; for (const k of KORS) { const e = Math.hypot(k.x - d.x, k.y - d.y); if (e < ed) { ed = e; en = k; } }
    if (!en) { d.git += dt; d.vx += Math.cos(d.a) * 900 * dt; d.vy += Math.sin(d.a) * 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.git > 5) DOST.splice(i, 1); continue; }
    const dx = en.x - d.x, dy = en.y - d.y, yak = ed < 450, tx = yak ? -dy / ed * d.yon : dx / ed, ty = yak ? dx / ed * d.yon : dy / ed, vm = yak ? 700 : 1700;
    d.vx += (tx * vm - d.vx) * Math.min(1, dt * 2); d.vy += (ty * vm - d.vy) * Math.min(1, dt * 2); d.x += d.vx * dt; d.y += d.vy * dt; d.a = Math.atan2(dy, dx); d.atT -= dt;
    if (d.atT <= 0 && ed < 900) { d.atT = 0.5; MERMI.push({ x: d.x, y: d.y, vx: dx / ed * 2400, vy: dy / ed * 2400, o: 0, w: 0.6, d: true, h: 9 }); }
  }
}
function devriyeCiz(s) {
  for (const d of DOST) { const [X, Y] = W2S(d.x, d.y); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue; gemiCizGenel(X, Y, d.a, s, d.irk ? d.irk + 'k' : 'avci', 1, d.irk ? 'diger' : 'dost', { itki: 0.7, t: performance.now() / 1000, nav: true }); ctx.font = '800 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#9EE8FF'; ctx.fillText(d.irk ? IRK[d.irk].e + ' ' + L(IRK[d.irk].ad) : '🛡 ' + T('Devriye', 'Patrol'), X, Y - 24 * s); }
}
/* ================= mürettebat ================= */
const ROL = { pilot: { e: '🧑‍✈️', ad: ['Pilot', 'Pilot'], ne: L2 => T(`Hız +%${4 * L2}`, `Speed +${4 * L2}%`) }, muhendis: { e: '🔧', ad: ['Mühendis', 'Engineer'], ne: L2 => T(`Uçarken onarır, tersane %${3 * L2} ucuz`, `Repairs in flight, shipyard ${3 * L2}% cheaper`) }, doktor: { e: '🩺', ad: ['Doktor', 'Doctor'], ne: L2 => T(`Kapsül oksijeni +%${15 * L2}`, `Pod oxygen +${15 * L2}%`) }, tuccar: { e: '💼', ad: ['Tüccar', 'Trader'], ne: L2 => T(`Alış/satış %${2 * L2} daha iyi`, `Buy/sell ${2 * L2}% better`) }, topcu: { e: '🎯', ad: ['Topçu', 'Gunner'], ne: L2 => T(`Taret hasarı +%${6 * L2}`, `Turret damage +${6 * L2}%`) } };
const ADLAR = ['Ada', 'Bora', 'Cem', 'Defne', 'Ece', 'Fırat', 'Gaye', 'Halil', 'İpek', 'Kaan', 'Lale', 'Mert', 'Nil', 'Onur', 'Pelin', 'Rüzgar', 'Selin', 'Tuna', 'Umay', 'Vera', 'Yağız', 'Zeyno', 'Kira', 'Orion', 'Nova', 'Juno', 'Rhea', 'Atlas'];
const SOY = ['Yıldız', 'Ay', 'Demir', 'Kaya', 'Deniz', 'Gök', 'Tan', 'Er', 'Vel', 'Oru', 'Kuzey', 'Sönmez'];
const EKIP_MAX = () => gemiTip === 'yuk' || gemiTip === 'umut' || gemiTip === 'golge' ? 4 : 3;
function adaylar(p) { const slot = Math.floor(Date.now() / 7.2e6), r = rng(h32(p.seed, slot, 7171)), roller = Object.keys(ROL), L2 = []; for (let i = 0; i < 2; i++) { const lv = 1 + ((r() * r() * 3) | 0); L2.push({ id: p.id + ':' + slot + ':' + i, ad: ADLAR[(r() * ADLAR.length) | 0] + ' ' + SOY[(r() * SOY.length) | 0], rol: roller[(r() * roller.length) | 0], lv, xp: 0, maas: 40 * lv, f: 600 * lv * lv }); } return L2; }
function ekipXp(rol, n) { for (const e of EKIP) { e.xp += (e.rol === rol ? n : n * 0.3) * huyXp(e); const gerek = 40 * e.lv; if (e.lv < 5 && e.xp >= gerek) { e.xp -= gerek; e.lv++; e.maas = Math.round(40 * e.lv * (HUY[huyOf(e)].maas || 1)); defter(`⭐ ${e.ad} terfi etti: seviye ${e.lv}.`, `⭐ ${e.ad} was promoted: level ${e.lv}.`); duyur(ROL[e.rol].e + ' <b>' + esc(e.ad) + '</b> ' + T('seviye atladı: ', 'levelled up: ') + e.lv, 'koloni', ROL[e.rol].ne(e.lv)); } } }
function ekipAdim(dt) {
  if (!EKIP.length) return; ST.ekT = (ST.ekT || 0) + dt; ST.ekX = (ST.ekX || 0) + dt;
  if (ST.ekX > 60) { ST.ekX = 0; for (const e of EKIP) ekipXp(e.rol, 1); }
  if (ST.ekT > 600) { ST.ekT = 0; const top = EKIP.reduce((a, e) => a + e.maas, 0); if (kredi >= top) { kredi -= top; moralEkle(2); } else { moralEkle(-15); const e = EKIP.pop(); duyur('👋 ' + esc(e.ad) + T(' maaşını alamadığı için ayrıldı', ' left: you could not pay the wages'), 'uyari'); } }
}
/* ================= kervanlar ================= */
const KV_F = 8000, KV_MAX = 3 + (tek('c3') ? 2 : 0), KV_YUK = 8, KV_HIZ = 600;
function zGez(z) { const s2 = sistem(z[0], z[1]); return s2 && s2.gez[z[2]]; }
const kvMax = () => 3 + (tek('c3') ? 2 : 0);
function kvKar(a, b, m) { return Math.round(KV_YUK * (satFiyat(b, m) - fiyat(a, m)) * (FR.tuccar >= 60 ? 1.2 : 1) * (tek('c3') ? 1.2 : 1) - 100); }
function kvSure(kv) { const a = zGez(kv.a), b = zGez(kv.b); return a && b ? Math.max(60, Math.hypot(a.s.x - b.s.x, a.s.y - b.s.y) / KV_HIZ) : 600; }
function kvPos(kv) { const a = zGez(kv.a), b = zGez(kv.b); if (!a || !b) return null; const t = simT(), [ax, ay] = gezPos(a, t), [bx, by] = gezPos(b, t), u = ((Date.now() - kv.t0) / 1000 / kvSure(kv)) % 2, f = u < 1 ? u : 2 - u, k = f * f * (3 - 2 * f); return [lerp(ax, bx, k), lerp(ay, by, k), Math.atan2(by - ay, bx - ax) + (u < 1 ? 0 : Math.PI)]; }
function kervanAdim() {
  let top = 0, n = 0;
  KERVAN.forEach((kv, i) => {
    const dur = kvSure(kv), sefer = Math.floor((Date.now() - kv.t0) / 1000 / dur); if (sefer - kv.n > 4 * 3600 / dur) kv.n = sefer - Math.floor(4 * 3600 / dur);
    while (kv.n < sefer) {
      kv.n++; if (kv.durT > 0) { kv.durT--; continue; }
      const a = zGez(kv.n % 2 ? kv.a : kv.b), b = zGez(kv.n % 2 ? kv.b : kv.a); if (!a || !b) continue; const kar = kv.n % 2 ? kvKar(a, b, kv.m) : Math.round(kvKar(a, b, kv.m) * 0.25); if (kar > 0) { top += kar; n++; }
      if (sefer - kv.n < 1 && Math.random() < 0.07 && !GOREV.some(g => g.tip === 'kervan') && oyunda) { const ps = kvPos(kv); if (ps) { GOREV.push({ id: 'kv' + Date.now(), tip: 'kervan', ki: i, x: ps[0], y: ps[1], son: Date.now() + 300000, ad: kolAd(zGez(kv.a)) + ' ⇄ ' + kolAd(zGez(kv.b)), hs: [Math.floor(ps[0] / SEK), Math.floor(ps[1] / SEK)] }); gorevYaz(); duyur('🚚 ' + T('Kervanına korsan saldırısı!', 'Pirates are attacking your convoy!'), 'uyari', T('5 dakika içinde yetişirsen kurtarırsın · görevlere eklendi', 'Reach it within 5 minutes to save it · added to missions')); SES.uyari(); } }
    }
  });
  if (top > 0) { kazan(top, 'kervan'); ST.kvSefer = (ST.kvSefer || 0) + n; duyur('🚚 ' + T(`Kervanların ${n} sefer yaptı`, `Your convoys made ${n} trip${n > 1 ? 's' : ''}`), 'koloni', `+${SAYI(top)} 💰`); }
}
function kervanCiz(s) {
  for (const kv of KERVAN) { const ps = kvPos(kv); if (!ps) continue; const [X, Y] = W2S(ps[0], ps[1]); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue; gemiCizGenel(X, Y, ps[2], s * 0.95, 'yuk', 0, 'kervan', { itki: 0.5, t: performance.now() / 1000, nav: true }); ctx.font = '800 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE3A6'; ctx.fillText('🚚 ' + T('Kervanın', 'Your convoy') + ' · ' + MAL[kv.m].e, X, Y - 22 * s); }
}
/* ================= mürettebat hikâyeleri ================= */
const EHM = { s: () => sayK('s'), hurda: () => ST.hurda || 0, ast: () => ST.astKir || 0, korsan: () => ST.korsan || 0, yanas: () => ST.yanas || 0, gorev: () => ST.gorev || 0, tic: () => (ST.gk && ST.gk.ticaret) || 0 };
const EHB = { s: ['yeni sistem keşfet', 'new systems discovered'], hurda: ['enkaz topla', 'wrecks salvaged'], ast: ['asteroit kır', 'asteroids broken'], korsan: ['korsan yen', 'pirates defeated'], yanas: ['koloniye yanaş', 'colony dockings'], gorev: ['görev bitir', 'missions done'], tic: ['kredi ticaretten kazan', 'credits from trading'] };
const EHIK = {
  pilot: { oz: ['Usta pilot', 'Ace pilot'], A: [
    ['s', 2, ['{a} eski bir akademi rotasını anlatıyor: "Bu sektörlerin ötesini hiç görmedim."', '{a} talks about an old academy route: "I never saw past these sectors."']],
    ['hurda', 1, ['{a}, kaybolan kanat arkadaşının gemisinin enkazını aramak istiyor.', '{a} wants to search for a lost wingmate’s wreck.']],
    ['s', 3, ['Enkazda bir not bulundu: "Uçmaya devam et." {a} onun anısına uzaklara gitmek istiyor.', 'A note was found in the wreck: "Keep flying." {a} wants to fly far in their memory.']]] },
  muhendis: { oz: ['Dâhi tamirci', 'Genius mechanic'], A: [
    ['ast', 3, ['{a} yeni bir alaşım denemek istiyor; asteroitlerden örnek lazım.', '{a} wants to test a new alloy; asteroid samples needed.']],
    ['hurda', 2, ['Alaşım tutuyor! {a} eski gemilerden parça toplamak istiyor.', 'The alloy holds! {a} wants parts from old wrecks.']],
    ['korsan', 2, ['{a} taretleri yeniden ayarladı. Bir de gerçek bir çatışmada görmek istiyor.', '{a} retuned the turrets and wants to see them in a real fight.']]] },
  doktor: { oz: ['Salgın uzmanı', 'Outbreak specialist'], A: [
    ['yanas', 2, ['{a} kolonilerde tuhaf bir öksürük salgını duymuş; birkaç koloniye uğrayalım.', '{a} heard of a strange cough in the colonies; let’s visit a few.']],
    ['gorev', 1, ['Örnekler toplandı. {a} ilaç dağıtımı için bir görev üstlenmek istiyor.', 'Samples collected. {a} wants to take a mission to deliver medicine.']],
    ['yanas', 3, ['Aşı hazır! {a} onu kolonilere ulaştırmak istiyor.', 'The vaccine is ready! {a} wants to bring it to the colonies.']]] },
  tuccar: { oz: ['Pazarlık ustası', 'Master haggler'], A: [
    ['tic', 1500, ['{a} borcunu ödemek için bir ticaret serisi planlıyor.', '{a} plans a trading run to pay off an old debt.']],
    ['yanas', 2, ['Alacaklı peşimizde! {a} farklı limanlarda iz kaybettirmek istiyor.', 'The creditor is after us! {a} wants to lose them across ports.']],
    ['tic', 4000, ['Son bir büyük vurgun ve borç kapanacak.', 'One last big deal and the debt is settled.']]] },
  topcu: { oz: ['Keskin nişancı', 'Sharpshooter'], A: [
    ['korsan', 2, ['{a} köyünü yakan korsan çetesinin izini sürüyor.', '{a} is hunting the pirate gang that burned their village.']],
    ['korsan', 3, ['Çetenin gözcülerini bulduk. {a} daha fazlasını istiyor.', 'We found the gang’s scouts. {a} wants more.']],
    ['korsan', 5, ['Çetenin reisi yakında. {a} son hesaplaşmaya hazır.', 'The gang leader is close. {a} is ready for the reckoning.']]] }
};
function ekipHikAdim() {
  if (!oyunda) return;
  for (const e of EKIP) {
    const H = EHIK[e.rol]; if (!H) continue;
    if (!e.hk || typeof e.hk !== 'object' || !Number.isFinite(e.hk.a)) { e.hk = { a: 0, b: EHM[H.A[0][0]]() }; duyur('📖 ' + esc(e.ad) + ': ' + L(H.A[0][2]).replace('{a}', esc(e.ad)), 'kesif', T('Hikâye görevi: ', 'Story goal: ') + SAYI(H.A[0][1]) + ' ' + L(EHB[H.A[0][0]])); continue; }
    if (e.hk.a >= H.A.length) continue;
    const [m, n] = H.A[e.hk.a]; if (EHM[m]() - e.hk.b < n) continue;
    e.hk.a++; ekipXp(e.rol, 20); moralEkle(5); SES.koloni();
    if (e.hk.a < H.A.length) { const S = H.A[e.hk.a]; e.hk.b = EHM[S[0]](); duyur('📖 ' + esc(e.ad) + ': ' + L(S[2]).replace('{a}', esc(e.ad)), 'koloni', T('Sıradaki: ', 'Next: ') + SAYI(S[1]) + ' ' + L(EHB[S[0]])); }
    else { e.oz = 1; defter('🌟 ' + e.ad + ' hikâyesini tamamladı: ' + H.oz[0], '🌟 ' + e.ad + ' finished their story: ' + H.oz[1]); diyalog([['🌟 ' + e.ad + ': ' + H.oz[0], '🌟 ' + e.ad + ': ' + H.oz[1]], [`${esc(e.ad)} ${T('hikâyesini tamamladı ve sana bağlılığını kanıtladı.', 'finished their story and proved their loyalty.')}<br><br>${ROL[e.rol].e} <b>${L(H.oz)}</b>: ${T('rolünün etkisi kalıcı olarak 1 seviye daha güçlü', 'their role’s effect is permanently one level stronger')} (${ROL[e.rol].ne(e.lv + 1)})`, `${esc(e.ad)} finished their story and proved their loyalty.<br><br>${ROL[e.rol].e} <b>${H.oz[1]}</b>: their role’s effect is permanently one level stronger (${ROL[e.rol].ne(e.lv + 1)})`]]); }
  }
}
function ekipHikYaz(e) {
  const H = EHIK[e.rol]; if (!H || !e.hk) return '';
  if (e.oz) return `<br><b style="color:#FFE3A6">🌟 ${L(H.oz)}</b> <span class="alt">· ${T('+1 seviye etkisi', '+1 level effect')}</span>`;
  const [m, n] = H.A[Math.min(e.hk.a, H.A.length - 1)], il = Math.max(0, Math.min(n, EHM[m]() - e.hk.b));
  return `<br>📖 ${T('Hikâye', 'Story')} ${e.hk.a + 1}/3: ${SAYI(n)} ${L(EHB[m])} <b>(${SAYI(il)}/${SAYI(n)})</b>`;
}
setInterval(() => { try { ekipHikAdim(); } catch (e) { } }, 3000);
function ekipYaz(p) {
  let h = `<div class="alt" style="margin:4px 0 0;font-weight:900;color:var(--ink)">👥 ${T('Mürettebat', 'Crew')} (${EKIP.length}/${EKIP_MAX()})</div>${EKIP.length ? `<div style="margin:6px 0 2px;font-size:13px;font-weight:900">${MORAL >= 80 ? '😄' : MORAL >= 50 ? '🙂' : MORAL >= 30 ? '😐' : '😟'} ${T('Moral', 'Morale')}: ${Math.round(MORAL)}/100 <span style="color:var(--mute);font-weight:800;font-size:11.5px">${MORAL >= 80 ? T('· keyifli: tüm bonuslar +1 seviye', '· happy: all bonuses +1 level') : MORAL < 30 ? T('· mutsuz: bonuslar −1 seviye', '· unhappy: bonuses −1 level') : ''}</span></div><div style="height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${MORAL}%;background:${MORAL >= 80 ? '#9BE07A' : MORAL >= 30 ? '#FFC857' : '#FF5C6E'}"></i></div>` : ''}<div class="alt" style="margin:2px 0 0;font-size:12px">${T('Her 10 dakikada maaş öderler; uçtukça ve işlerini yaptıkça seviye atlarlar (en çok 5).', 'They are paid every 10 minutes and level up as you fly and they work (max 5).')}</div>`;
  EKIP.forEach((e, i) => { h += `<div class="satir"><div>${ROL[e.rol].e} <b>${esc(e.ad)}</b>${e.oz ? ' 🌟' : ''} <span class="lv">${L(ROL[e.rol].ad)} · ${T('sv', 'lv')} ${e.lv}</span><small>${huyEt(e)} · ${ROL[e.rol].ne(e.lv + (e.oz ? 1 : 0))} · ${T('maaş', 'wage')} ${e.maas} 💰${ekipHikYaz(e)}${e.yara > Date.now() ? ' · <b style="color:#FF9AA6">🤕 ' + T('yaralı', 'injured') + '</b>' : ''}</small>${xpBar(e)}</div><div class="dg">${e.lv < 5 ? `<button class="kb al" type="button" data-egit="${i}" ${e._eg === p.id || kredi < egitF(e) ? 'disabled' : ''} title="${T('Eğitim: deneyim kazandırır (limanda bir kez)', 'Training: grants XP (once per port)')}">🎓 ${SAYI(egitF(e))} 💰</button>` : ''}<button class="kb" type="button" data-kov="${i}">${T('Ayrıl', 'Dismiss')}</button></div></div>`; });
  if (!EKIP.length) h += `<div class="alt">${T('Henüz mürettebatın yok.', 'No crew yet.')}</div>`;
  h += `<div class="alt" style="margin:10px 0 0;font-weight:900;color:#FFE3A6">🍸 ${T('Limandaki adaylar', 'Candidates at this port')}</div>`;
  const ad = adaylar(p).filter(a => !EKIP.some(e => e.id === a.id)); p._aday = ad;
  ad.forEach((a, i) => { h += `<div class="satir"><div>${ROL[a.rol].e} <b>${esc(a.ad)}</b> <span class="lv">${L(ROL[a.rol].ad)} · ${T('sv', 'lv')} ${a.lv}</span><small>${huyEt(a)} · ${ROL[a.rol].ne(a.lv)} · ${T('maaş', 'wage')} ${Math.round(a.maas * (HUY[huyOf(a)].maas || 1))} 💰</small></div><div class="dg"><button class="kb al" type="button" data-ise="${i}" ${EKIP.length >= EKIP_MAX() || kredi < a.f ? 'disabled' : ''}>${EKIP.length >= EKIP_MAX() ? T('Yer yok', 'No room') : T('İşe al', 'Hire') + ' · ' + SAYI(a.f) + ' 💰'}</button></div></div>`; });
  if (!ad.length) h += `<div class="alt">${T('Adaylar 2 saatte bir yenilenir.', 'New candidates every 2 hours.')}</div>`;
  h += `<div class="alt" style="margin:14px 0 0;font-weight:900;color:var(--ink)">🚚 ${T('Kervanlar', 'Convoys')} (${KERVAN.length}/${kvMax()})</div><div class="alt" style="margin:2px 0 0;font-size:12px">${T('Kervan iki kolonin arasında kendiliğinden mal taşır, kazancı bankana yatar. Bazen korsanlar saldırır: yetişirsen kurtarırsın.', 'A convoy carries goods between two colonies on its own; earnings go to your bank. Pirates sometimes attack: get there to save it.')}</div>`;
  KERVAN.forEach((kv, i) => { const a = zGez(kv.a), b = zGez(kv.b); if (!a || !b) return; h += `<div class="satir"><div>🚚 <b>${esc(kolAd(a))} ⇄ ${esc(kolAd(b))}</b> <span class="lv">${MAL[kv.m].e} ${L(MAL[kv.m].ad)}</span><small>${T('Sefer başı', 'Per trip')} ~${SAYI(kvKar(a, b, kv.m))} 💰 · ${Math.round(kvSure(kv) / 60)} ${T('dk', 'min')}${kv.durT ? ' · ⚠ ' + T('yağmalandı', 'looted') : ''}</small></div><div class="dg"><button class="kb" type="button" data-kvsil="${i}">${T('Kapat', 'Close')}</button></div></div>`; });
  const hed = ZIY.filter(z => z.join(',') !== [p.s.t.sx, p.s.t.sy, p.i].join(',')).map(zGez).filter(q => q && q.kol);
  if (KERVAN.length < kvMax()) {
    if (!hed.length) h += `<div class="alt">${T('Kervan kurmak için önce başka bir koloniye de yanaşmış olmalısın.', 'Dock at another colony first to set up a convoy.')}</div>`;
    else { const sb = +(limanP._kvb || 0) % hed.length, b = hed[sb], ml = Object.keys(MAL).filter(m => !OZEL.includes(m)).sort((x, y) => kvKar(p, b, y) - kvKar(p, b, x)), m = limanP._kvm && ml.includes(limanP._kvm) ? limanP._kvm : ml[0], kar = kvKar(p, b, m);
      h += `<div class="satir"><div>🆕 <b>${esc(kolAd(p))} ⇄ <button class="kb" type="button" data-kvb style="padding:3px 8px">${esc(kolAd(b))} ▾</button></b><small>${T('Mal', 'Goods')}: <button class="kb" type="button" data-kvm style="padding:3px 8px">${MAL[m].e} ${L(MAL[m].ad)} ▾</button> · ${T('sefer başı', 'per trip')} <b style="color:${kar > 0 ? '#9BE07A' : '#FF9AA6'}">${SAYI(kar)} 💰</b> · ${Math.round(Math.max(60, Math.hypot(p.s.x - b.s.x, p.s.y - b.s.y) / KV_HIZ) / 60)} ${T('dk', 'min')}</small></div><div class="dg"><button class="kb al" type="button" data-kvkur="${m}" ${kredi < KV_F || kar <= 0 ? 'disabled' : ''}>${T('Kur', 'Set up')} · ${SAYI(KV_F)} 💰</button></div></div>`;
      limanP._kvHed = b; limanP._kvMl = ml; limanP._kvM = m; }
  }
  return h;
}
/* ================= kara borsa ================= */
let borsaAcik = false, borsaG = null;
function korsanLimanPos(G) { return [G.x + Math.cos(G.faz + 2) * G.R * 0.75, G.y + Math.sin(G.faz + 2) * G.R * 0.75]; }
function korsanLimanYakin() { const G = galaksi(...galHucre(SH.x, SH.y)), [x, y] = korsanLimanPos(G); return Math.hypot(x - SH.x, y - SH.y) < 600 ? G : null; }
function korsanLimanCiz(t) {
  const [gx, gy] = galHucre(cam.x, cam.y); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const G = galaksi(gx + i, gy + j), [x, y] = korsanLimanPos(G), [X, Y] = W2S(x, y), R = Math.max(9, 120 * cam.z); if (X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) continue;
    ctx.save(); ctx.translate(X, Y); ctx.rotate(-t * 0.08); ctx.fillStyle = '#2A0E14'; ctx.strokeStyle = '#FF5C6E'; ctx.lineWidth = Math.max(1.2, R * 0.05);
    ctx.beginPath(); for (let k = 0; k < 12; k++) { const a = k * TAU / 12, r = k % 2 ? R * 0.65 : R; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,92,110,.6)'; ctx.beginPath(); ctx.arc(0, 0, R * 0.25, 0, TAU); ctx.fill(); ctx.restore();
    ctx.font = '900 12.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FF9AA6'; ctx.fillText('☠ ' + T('Korsan limanı', 'Pirate haven'), X, Y - R - 10);
  }
}
const KAC_AL = { kyaz: 45, ctek: 70 };
function borsaAc(G) {
  if (FR.klan <= -30) { duyur('☠ ' + T('Klanlar seni içeri almıyor!', 'The clans will not let you in!'), 'uyari', T('Korsan avladığın için düşmanısın', 'You are their enemy for hunting pirates')); if (!KORS.length) korsanCikar(); return; }
  borsaAcik = true; borsaG = G; SH.vx = SH.vy = 0; oto = null; KORS.length = 0; MERMI.length = 0; borsaYaz(); $('borsa').hidden = false; SES.koloni(); gpImza = '';
}
function borsaKapat() { borsaAcik = false; $('borsa').hidden = true; SES.tik(); kaydet(); }
function borsaYaz() {
  const bos = kapasite() - kargoDolu();
  let h = `<h2 style="margin:0 0 2px;font-size:21px;font-weight:900">☠ ${T('Korsan limanı', 'Pirate haven')} · ${T('Kara borsa', 'Black market')}</h2><div class="alt" style="margin:0 0 8px">${T('Burada soru sorulmaz. Kaçak malları insan kolonilerinde iyi fiyata satabilirsin, ama Birlik taramasına yakalanırsan el konur ve ceza kesilir.', 'No questions asked. Contraband sells well at human colonies, but if a Union scan catches you it is seized and you are fined.')}</div><div class="lmEk"><span>💰 ${SAYI(kredi)}</span><span>📦 ${kargoDolu()}/${kapasite()}</span><span>☠ ${Math.round(FR.klan)}</span><span>🛡 ${Math.round(FR.birlik)}</span></div>`;
  for (const m of KACAK) { const f = KAC_AL[m], n = Math.min(bos, Math.floor(kredi / f)); h += `<div class="satir"><div>${MAL[m].e} <b>${L(MAL[m].ad)}</b><small>${T('Al', 'Buy')} ${f} 💰 · ${T('kolonilerde', 'at colonies')} ~${MAL[m].f} 💰${KARGO[m] ? ' · ' + T('Ambarda', 'In hold') + ': ' + KARGO[m] : ''}</small></div><div class="dg"><button class="kb al" type="button" data-kal="${m}" data-n="1" ${n < 1 ? 'disabled' : ''}>${T('Al', 'Buy')} 1</button><button class="kb al" type="button" data-kal="${m}" data-n="${n}" ${n < 2 ? 'disabled' : ''}>${T('Al', 'Buy')} ${Math.max(0, n)}</button></div></div>`; }
  const sat = Object.keys(KARGO).filter(m => !KACAK.includes(m) && KARGO[m] > 0);
  if (sat.length) { h += `<div class="alt" style="margin:10px 0 0;font-weight:900;color:var(--ink)">💰 ${T('Ganimet al-sat', 'Fence your loot')}</div>`; for (const m of sat) { const f = Math.round(MAL[m].f * 0.85); h += `<div class="satir"><div>${MAL[m].e} <b>${L(MAL[m].ad)}</b><small>${f} 💰 · ${T('Ambarda', 'In hold')}: ${KARGO[m]}</small></div><div class="dg"><button class="kb" type="button" data-ksat="${m}">${T('Hepsini sat', 'Sell all')}</button></div></div>`; } }
  h += `<div class="alt" style="margin:10px 0 0;font-weight:900;color:var(--ink)">🤝 ${T('Klan işleri', 'Clan business')}</div>`;
  h += `<div class="satir"><div>🎁 <b>${T('Klana haraç', 'Tribute to the clans')}</b><small>${T('Klan itibarı +10', 'Clan standing +10')}</small></div><div class="dg"><button class="kb al" type="button" data-kb="harac" ${kredi < 1000 ? 'disabled' : ''}>1.000 💰</button></div></div>`;
  h += `<div class="satir"><div>🪪 <b>${T('Sahte kimlik', 'Forged ID')}</b><small>${T('Birlik kayıtların temizlenir (en az 0’a çıkar)', 'Wipes your Union record (back to at least 0)')}</small></div><div class="dg"><button class="kb al" type="button" data-kb="kimlik" ${kredi < 5000 || FR.birlik >= 0 ? 'disabled' : ''}>5.000 💰</button></div></div>`;
  { const kal = Math.ceil(((ST.hackKB || 0) + 3.6e6 - Date.now()) / 60000); h += `<div class="satir"><div>💻 <b>${T('Klan veri bankasını hackle', 'Hack the clan data bank')}</b><small>${T('Başarırsan kredi çalarsın ve Birlik’e istihbarat satarsın. Başaramazsan klanlar seni kovar.', 'Succeed and you steal credits and sell intel to the Union. Fail and the clans throw you out.')}${kal > 0 ? ' · ⏳ ' + kal + T(' dk', ' min') : ''}</small></div><div class="dg"><button class="kb al" type="button" data-kb="hack" ${kal > 0 ? 'disabled' : ''}>💻 ${T('Hackle', 'Hack')}</button></div></div>`; }
  $('brIc').innerHTML = h;
}
function kacakTara(p) {
  if (yabanciMi(p) || !KACAK.some(m => KARGO[m])) return;
  const sans = 0.3 * (takili('gizli') ? 0.5 : 1) * (FR.birlik <= -30 ? 1.6 : 1); if (Math.random() > sans) return;
  let n = 0; for (const m of KACAK) { n += KARGO[m] || 0; delete KARGO[m]; } const ceza = Math.min(kredi, Math.min(3000, 300 + Math.round(kredi * 0.05))); kredi -= ceza; frEkle('birlik', -8); ST.yakalan = (ST.yakalan || 0) + 1;
  setTimeout(() => { duyur('🚨 ' + T('Birlik taraması: kaçak mal bulundu!', 'Union scan: contraband found!'), 'uyari', T(`${n} birime el kondu · ceza ${SAYI(ceza)} 💰`, `${n} units seized · fine ${SAYI(ceza)} 💰`)); SES.uyari(); }, 400);
}
$('borsa').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.id === 'brKapat') { borsaKapat(); return; }
  if (b.dataset.kb === 'hack') { if (kilitli('hack')) return; ST.hackKB = Date.now(); hackAc({ ad: T('💻 Klan veri bankası', '💻 Clan data bank'), zor: 3, odul: () => { const k = 1200 + ((Math.random() * 1800) | 0); kazan(k, 'korsan'); frEkle('birlik', 6); return `+${SAYI(k)} 💰 · ${T('Birlik itibarı', 'Union standing')} +6`; }, ceza: () => { frEkle('klan', -15); setTimeout(() => { borsaKapat(); korsanCikar(); }, 300); return T('Klanlar seni yakaladı! Klan itibarı −15', 'The clans caught you! Clan standing −15'); } }); return; }
  if (b.dataset.kal) { const m = b.dataset.kal, f = KAC_AL[m], n = Math.min(+b.dataset.n, kapasite() - kargoDolu(), Math.floor(kredi / f)); if (n > 0) { kredi -= n * f; KARGO[m] = (KARGO[m] || 0) + n; frEkle('klan', 0.5 * n); frEkle('birlik', -0.2 * n); SES.tik(); } }
  else if (b.dataset.ksat) { const m = b.dataset.ksat, n = KARGO[m] || 0; if (n) { kazan(n * Math.round(MAL[m].f * 0.85), 'ticaret'); delete KARGO[m]; frEkle('klan', 1); SES.tik(); } }
  else if (b.dataset.kb === 'harac' && kredi >= 1000) { kredi -= 1000; frEkle('klan', 10); SES.koloni(); }
  else if (b.dataset.kb === 'kimlik' && kredi >= 5000) { kredi -= 5000; FR.birlik = Math.max(0, FR.birlik); SES.koloni(); duyur('🪪 ' + T('Yeni kimliğin hazır', 'Your new identity is ready'), 'koloni'); }
  borsaYaz(); kaydet();
});
/* ================= Merkez Bankası ================= */
function bankaPos() { const p = evGezegen(), [px, py] = gezPos(p, simT()), a = simT() * 0.01; return [px + Math.cos(a) * (p.r + 1100), py + Math.sin(a) * (p.r + 1100)]; }
function bankaYakin() { const [x, y] = bankaPos(); return Math.hypot(x - SH.x, y - SH.y) < 520; }
function bankaCiz(t) {
  const [bx, by] = bankaPos(), [X, Y] = W2S(bx, by), R = Math.max(10, 150 * cam.z); if (X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) return;
  ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 0.05);
  ctx.strokeStyle = '#FFC857'; ctx.lineWidth = Math.max(1.5, R * 0.08); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#3A3020'; for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * TAU / 4); ctx.fillRect(-R * 0.06, 0, R * 0.12, R); ctx.fillStyle = '#FFE3A6'; ctx.fillRect(-R * 0.18, R * 0.85, R * 0.36, R * 0.3); ctx.fillStyle = '#3A3020'; ctx.restore(); }
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.45); g.addColorStop(0, '#FFF3C8'); g.addColorStop(1, '#B8892A'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 0.42, 0, TAU); ctx.fill();
  ctx.restore(); ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFE3A6'; ctx.fillText('🏦 ' + T('Merkez Bankası', 'Central Bank'), X, Y - R - 12);
}
const GK_AD = { ticaret: ['🛒 Ticaret', '🛒 Trade'], gorev: ['📋 Görevler', '📋 Missions'], korsan: ['☠ Korsan avı', '☠ Pirate hunting'], kesif: ['🔭 Keşif', '🔭 Exploration'], koloni: ['🏙 Koloni vergisi', '🏙 Colony taxes'], faiz: ['📈 Faiz', '📈 Interest'], hediye: ['🎁 Hediyeler', '🎁 Gifts'], diger: ['✨ Diğer', '✨ Other'] };
function faizBirik() { const n = Date.now(); if (!ST.fT) ST.fT = n; const sa = Math.min(12, (n - ST.fT) / 3.6e6); return Math.floor(sa * Math.min(400, kredi * 0.002)); }
function sigPrim() { const d = (GEMI[gemiTip].f > 0 ? GEMI[gemiTip].f : 2500) + TAK.reduce((a, k) => a + (TEC[k].f > 0 ? TEC[k].f : 3000), 0) + 1000; return Math.max(300, Math.round(d * 0.12 / 10) * 10); }
function bankaAc() { bankaAcik = true; SH.vx = SH.vy = 0; oto = null; KORS.length = 0; MERMI.length = 0; ST.bankaZ = (ST.bankaZ || 0) + 1; bankaYaz(); $('banka').hidden = false; SES.koloni(); gpImza = ''; }
function bankaKapat() { bankaAcik = false; $('banka').hidden = true; SES.tik(); kaydet(); }
function bankaYaz() {
  const fz = faizBirik(), kol = KARAKOL.filter(k => k.koloni), vg = kol.reduce((a, k) => a + kkVergi(k), 0), gk = ST.gk || {}, top = Object.values(gk).reduce((a, b) => a + b, 0) || 1;
  let h = `<h2 style="margin:0 0 2px;font-size:21px;font-weight:900">🏦 ${T('Merkez Bankası', 'Central Bank')}</h2><div class="alt" style="margin:0 0 8px">${T('Bütün kazançların burada toplanır; gemin patlasa da hesabın güvende. Her kolonide bu hesaptan harcarsın.', 'All your earnings are kept here; your account is safe even if your ship is destroyed. You spend from it at every colony.')}</div>`;
  h += `<div class="satir"><div>💰 <b>${T('Hesap bakiyesi', 'Balance')}</b><small>${T('Bu hafta', 'This week')}: ${SAYI(Math.round(ST.hp || 0))} · ${T('toplam kazanç', 'total earned')}: ${SAYI(Math.round(ST.kazanc))}</small></div><div class="dg"><b style="font-size:18px;color:var(--altin)">${SAYI(kredi)} 💰</b></div></div>`;
  h += `<div class="satir"><div>📈 <b>${T('Mevduat faizi', 'Savings interest')}</b><small>${T('Saatte bakiyenin %0,2’si (en çok 400), 12 saate kadar birikir', '0.2% of the balance per hour (max 400), builds up for 12 hours')}</small></div><div class="dg"><button class="kb al" type="button" data-bk="faiz" ${fz < 1 ? 'disabled' : ''}>${T('Faizi al', 'Collect')} · ${SAYI(fz)} 💰</button></div></div>`;
  h += `<div class="satir"><div>🏙 <b>${T('Koloni vergileri', 'Colony taxes')}</b><small>${kol.length ? T(`${kol.length} kolonin var: vergileri tek seferde buraya aktar`, `You own ${kol.length} colonies: transfer all taxes here at once`) : T('Henüz kolonin yok (5. seviye karakolu koloniye çevir)', 'No colonies yet (turn a level 5 outpost into a colony)')}</small></div><div class="dg"><button class="kb al" type="button" data-bk="vergi" ${vg < 1 ? 'disabled' : ''}>${T('Topla', 'Collect')} · ${SAYI(vg)} 💰</button></div></div>`;
  h += `<div class="satir"><div>🛡 <b>${T('Gemi sigortası', 'Ship insurance')}</b><small>${sigorta ? T('Aktif: gemin patlarsa gemi ve takılı teçhizat geri gelir (tek kullanımlık)', 'Active: if your ship is destroyed, the ship and fitted equipment come back (single use)') : kapsul ? T('Kapsüldeyken sigorta yapılamaz', 'Cannot insure while in the pod') : T('Gemin patlarsa gemiyi ve takılı teçhizatı kaybetmezsin (tek kullanımlık)', 'Keep your ship and fitted equipment if you are destroyed (single use)')}</small></div><div class="dg">${sigorta ? `<button class="kb" type="button" disabled>✓ ${T('Sigortalı', 'Insured')}</button>` : `<button class="kb al" type="button" data-bk="sig" ${kapsul || kredi < sigPrim() ? 'disabled' : ''}>${T('Sigortala', 'Insure')} · ${SAYI(sigPrim())} 💰</button>`}</div></div>`;
  h += `<div class="alt" style="margin:12px 0 4px;font-weight:900;color:var(--ink)">📊 ${T('Kazanç dökümü', 'Earnings breakdown')}</div>`;
  const L2 = Object.entries(gk).sort((a, b) => b[1] - a[1]);
  h += L2.length ? L2.map(([k, v]) => `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:13px"><span style="width:130px">${L(GK_AD[k] || GK_AD.diger)}</span><span style="flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${(v / top * 100).toFixed(1)}%;background:#FFC857"></i></span><b style="width:80px;text-align:right">${SAYI(Math.round(v))}</b></div>`).join('') : `<div class="alt">${T('Henüz kayıt yok.', 'No records yet.')}</div>`;
  $('bkIc').innerHTML = h;
}
$('banka').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.id === 'bkKapat') { bankaKapat(); return; }
  const k = b.dataset.bk;
  if (k === 'faiz') { const fz = faizBirik(); if (fz > 0) { kazan(fz, 'faiz'); ST.fT = Date.now(); ST.faizTop = (ST.faizTop || 0) + fz; SES.koloni(); duyur('📈 ' + T('Faiz yatırıldı', 'Interest paid'), 'koloni', `+${SAYI(fz)} 💰`); basarimKontrol(); } }
  else if (k === 'vergi') { let top = 0; for (const kk of KARAKOL) if (kk.koloni) { const v = kkVergi(kk); if (v > 0) { top += v; kk.koloni.vt = Date.now(); } } if (top) { kazan(top, 'koloni'); SES.koloni(); duyur('🏙 ' + T('Koloni vergileri toplandı', 'Colony taxes collected'), 'koloni', `+${SAYI(top)} 💰`); } }
  else if (k === 'sig') { const f = sigPrim(); if (!kapsul && kredi >= f) { kredi -= f; sigorta = true; SES.koloni(); duyur('🛡 ' + T('Gemin sigortalandı', 'Your ship is insured'), 'koloni'); } }
  bankaYaz(); kaydet();
});
const TEKS = new Set(Array.isArray(K.tek) ? K.tek : []);
let TAK = Array.isArray(K.tak) ? K.tak.filter(k => TEC[k]) : [];
const slotSay = () => gemiTip === 'zirh' || gemiTip === 'umut' || gemiTip === 'golge' ? 3 : 2;
const takili = k => TAK.includes(k);
let LAZ = null;
const MAYIN = []; let patlamaT = 0, fuzeT = 0, mayinT = 0, droneA = 0, droneT = 0;
function patlamaKullan() {
  if (!takili('patlama') || patlamaT > 0 || !oyunda || limanP || kapsul) return; patlamaT = 20 - 4 * (tlv('patlama') - 1);
  patlamaEkle(SH.x, SH.y, 260, '127,227,255'); SES.patla();
  for (let i = KORS.length - 1; i >= 0; i--) { const k = KORS[i], dx = k.x - SH.x, dy = k.y - SH.y, d = Math.hypot(dx, dy) || 1; if (d < 460) { k.can -= 60 * (1 + 0.4 * (tlv('patlama') - 1)); k.vx += dx / d * 1400; k.vy += dy / d * 1400; if (k.can <= 0) korsanOldu(k, i); } }
  for (let i = MERMI.length - 1; i >= 0; i--) if (!MERMI[i].d && Math.hypot(MERMI[i].x - SH.x, MERMI[i].y - SH.y) < 460) MERMI.splice(i, 1);
  gpImza = ''; gpYaz();
}
function tecGuncelle(dt, t) {
  patlamaT = Math.max(0, patlamaT - dt);
  if (!oyunda || limanP || kapsul) return;
  if (takili('yakitgen') && SH.warp < 0.2 && yakit < tank()) yakit = Math.min(tank(), yakit + dt * 0.035 * tlv('yakitgen'));
  const savas = KORS.length > 0;
  if (ekipLv('muhendis') && !savas && can < maxCan()) can = Math.min(maxCan(), can + dt * 0.25 * ekipLv('muhendis'));
  if (takili('tamir') && !savas && can < maxCan()) can = Math.min(maxCan(), can + dt * 1.5 * tlv('tamir'));
  if (takili('fuze') && savas) { fuzeT -= dt; if (fuzeT <= 0) { let en = null, ed = 1700; for (const k of KORS) { const d = Math.hypot(k.x - SH.x, k.y - SH.y); if (d < ed) { ed = d; en = k; } } if (en) { fuzeT = 2.5 / (1 + 0.35 * (tlv('fuze') - 1)); const a = Math.atan2(en.y - SH.y, en.x - SH.x) + (Math.random() - 0.5) * 0.8; MERMI.push({ x: SH.x, y: SH.y, vx: Math.cos(a) * 700 + SH.vx, vy: Math.sin(a) * 700 + SH.vy, o: 0, w: 3.5, d: true, h: 45 * (1 + 0.25 * (tlv('fuze') - 1)), fuze: en }); SES.ates(0.3); } } }
  if (takili('mayin') && savas) { mayinT -= dt; if (mayinT <= 0 && KORS.some(k => Math.hypot(k.x - SH.x, k.y - SH.y) < 900)) { mayinT = 3 / (1 + 0.35 * (tlv('mayin') - 1)); MAYIN.push({ x: SH.x - Math.cos(SH.a) * 30, y: SH.y - Math.sin(SH.a) * 30, o: 0 }); } }
  for (let i = MAYIN.length - 1; i >= 0; i--) {
    const m = MAYIN[i]; m.o += dt; if (m.o > 25) { MAYIN.splice(i, 1); continue; }
    if (m.o > 0.8 && KORS.some(k => Math.hypot(k.x - m.x, k.y - m.y) < 120)) { MAYIN.splice(i, 1); patlamaEkle(m.x, m.y, 120, '255,170,80'); SES.patla(); for (let j = KORS.length - 1; j >= 0; j--) { const k = KORS[j]; if (Math.hypot(k.x - m.x, k.y - m.y) < 200) { k.can -= 80 * (1 + 0.3 * (tlv('mayin') - 1)); if (k.can <= 0) korsanOldu(k, j); } } }
  }
  if (HIK.mizrak) { SH.mizT = (SH.mizT || 0) - dt; const dv = KORS.find(k => k.ana || k.us); if (dv && SH.mizT <= 0 && Math.hypot(dv.x - SH.x, dv.y - SH.y) < 1800) { SH.mizT = 1.4; dv.can -= 150; LAZ = { x1: SH.x, y1: SH.y, x2: dv.x, y2: dv.y, o: 0 }; patlamaEkle(dv.x, dv.y, 50, '255,240,200'); SES.ates(1); if (dv.can <= 0) korsanOldu(dv, KORS.indexOf(dv)); } }
  if (LAZ) { LAZ.o += dt; if (LAZ.o > 0.3) LAZ = null; }
  if (takili('drone')) {
    droneA += dt * 1.6; droneT -= dt; const dx = SH.x + Math.cos(droneA) * 70, dy = SH.y + Math.sin(droneA) * 70;
    if (droneT <= 0) {
      droneT = 0.6 / (1 + 0.3 * (tlv('drone') - 1)); let en = null, ed = 750; for (const k of KORS) { const d = Math.hypot(k.x - dx, k.y - dy); if (d < ed) { ed = d; en = k; } }
      if (en) { const hz = 2400, ax = en.x + en.vx * ed / hz - dx, ay = en.y + en.vy * ed / hz - dy, al = Math.hypot(ax, ay) || 1; MERMI.push({ x: dx, y: dy, vx: ax / al * hz + SH.vx, vy: ay / al * hz + SH.vy, o: 0, w: 0.8, d: true, h: 7 * (1 + 0.25 * (tlv('drone') - 1)) }); }
      else { const o = OLAY.find(o2 => o2.tip === 'enkaz' && Math.hypot(o2.x - SH.x, o2.y - SH.y) < 650); if (o) enkazTopla(o); }
    }
  }
  if (takili('cekici') && !takili('drone')) { const o = OLAY.find(o2 => o2.tip === 'enkaz' && Math.hypot(o2.x - SH.x, o2.y - SH.y) < 950 * (1 + 0.3 * (tlv('cekici') - 1))); if (o && Math.random() < dt) enkazTopla(o); }
}
function tecCiz(t) {
  const s2 = Math.max(cam.z, 0.6);
  if (LAZ) { const [a1, b1] = W2S(LAZ.x1, LAZ.y1), [a2, b2] = W2S(LAZ.x2, LAZ.y2), k = 1 - LAZ.o / 0.3; ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,240,200,${(0.9 * k).toFixed(2)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${k.toFixed(2)})`; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
  for (const m of MAYIN) { const [X, Y] = W2S(m.x, m.y); if (X < -10 || X > W + 10 || Y < -10 || Y > H + 10) continue; ctx.fillStyle = '#2A2F3A'; ctx.beginPath(); ctx.arc(X, Y, 6 * s2, 0, TAU); ctx.fill(); ctx.fillStyle = Math.sin(t * 8) > 0 ? '#FF5C6E' : '#5A1E26'; ctx.beginPath(); ctx.arc(X, Y, 2.5 * s2, 0, TAU); ctx.fill(); }
  if (takili('drone') && oyunda) {
    const [X, Y] = W2S(SH.x + Math.cos(droneA) * 70, SH.y + Math.sin(droneA) * 70);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(droneA * 2); ctx.scale(s2, s2); ctx.fillStyle = '#CFD8E8'; ctx.strokeStyle = '#2A3448'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.fillStyle = '#7FE3FF'; ctx.fillRect(Math.cos(a) * 7 - 1.5, Math.sin(a) * 7 - 1.5, 3, 3); } ctx.restore();
  }
}

/* ================= aranan korsanlar ================= */
const ARANAN_AD = [['Kızıl Sakal', 'Red Beard'], ['Kör Yıldız', 'Blind Star'], ['Demir Pençe', 'Iron Claw'], ['Kuzgun', 'Raven'], ['Sessiz Ölüm', 'Silent Death'], ['Yarım Ay', 'Half Moon'], ['Kara Toz', 'Black Dust'], ['Buz Diş', 'Ice Fang'], ['Çifte Kuyruk', 'Twin Tail'], ['Paslı Kanca', 'Rusty Hook']];
function arananlar(p) {
  const gun = Math.floor(Date.now() / 864e5), r = rng(h32(p.seed, gun, 66)), L2 = [];
  for (let i = 0; i < 2; i++) {
    const id = 'b' + p.id + '@' + gun + '#' + i; if (ALINAN.has(id)) continue;
    const a = r() * TAU, d = 4 + r() * 8, x = p.s.x + Math.cos(a) * d * SEK, y = p.s.y + Math.sin(a) * d * SEK, ad = ARANAN_AD[(r() * ARANAN_AD.length) | 0];
    L2.push({ id, tip: 'kelle', x, y, hs: [Math.floor(x / SEK), Math.floor(y / SEK)], ad: L(ad), odul: odulK(1500 + d * 260 + r() * 900, false), kc: Math.round(500 + d * 80 + korsanGuc() * 400) });
  }
  return L2;
}
function kervanKontrol() {
  for (const g of GOREV.slice()) {
    if (g.tip !== 'kervan') continue; const kv = KERVAN[g.ki], d = Math.hypot(g.x - SH.x, g.y - SH.y);
    if (Date.now() > g.son) { GOREV = GOREV.filter(x => x !== g); for (let i = KORS.length - 1; i >= 0; i--) if (KORS[i].kvg === g.id) KORS.splice(i, 1); if (kv) kv.durT = 3; gorevYaz(); duyur('🚚 ' + T('Kervan yağmalandı', 'Convoy looted'), 'uyari', T('Sonraki 3 seferin kazancı yok', 'No income for the next 3 trips')); continue; }
    if (!g.aktif && d < 3500 && SH.warp < 0.3) { g.aktif = true; const n = 3, gg = korsanGuc(); for (let i = 0; i < n; i++) { const a = i * TAU / n, mx = Math.round(60 + gg * 140); KORS.push({ x: g.x + Math.cos(a) * 500, y: g.y + Math.sin(a) * 500, vx: 0, vy: 0, a, can: mx, max: mx, atT: 2, yon: i % 2 ? 1 : -1, kvg: g.id }); } duyur('🚚 ' + T('Kervanın görünüyor: korsanları temizle!', 'Your convoy is in sight: clear the pirates!'), 'uyari'); SES.uyari(); }
    else if (g.aktif && !KORS.some(k => k.kvg === g.id)) { GOREV = GOREV.filter(x => x !== g); const od = 400 + Math.round(korsanGuc() * 900); kazan(od, 'kervan'); frEkle('tuccar', 3); gorevYaz(); duyur('🚚 ' + T('Kervan kurtarıldı', 'Convoy saved'), 'koloni', `+${SAYI(od)} 💰`); SES.koloni(); }
  }
}
function kelleKontrol() {
  for (const g of GOREV) {
    if (g.tip !== 'kelle') continue; const d = Math.hypot(g.x - SH.x, g.y - SH.y);
    if (!g.aktif && d < 3500 && SH.warp < 0.3) {
      g.aktif = true; const a0 = Math.random() * TAU;
      KORS.push({ x: g.x, y: g.y, vx: 0, vy: 0, a: a0, can: g.kc, max: g.kc, atT: 2, yon: 1, boss: true, gid: g.id, ad: g.ad });
      for (let i = 0; i < 2; i++) { const a = a0 + (i ? 1 : -1) * 0.8; KORS.push({ x: g.x + Math.cos(a) * 400, y: g.y + Math.sin(a) * 400, vx: 0, vy: 0, a, can: 90, max: 90, atT: 2.5, yon: i ? 1 : -1 }); }
      duyur('☠ ' + T('Aranan korsan: ', 'Wanted pirate: ') + '<b>' + esc(g.ad) + '</b>', 'uyari', T('Korumalarıyla birlikte saldırıyor!', 'Attacking with escorts!')); SES.uyari();
    } else if (g.aktif && !KORS.some(k => k.gid === g.id)) g.aktif = false;
  }
}

/* ================= karakoldan koloniye ================= */
const KOL_F = 15000;
const kkNufus = k => Math.min(250000, Math.round(1000 + (Date.now() - k.koloni.t0) / 3.6e6 * 400));
const kkVergi = k => Math.floor(Math.min(24, (Date.now() - k.koloni.vt) / 3.6e6) * (40 + kkNufus(k) / 1000));
function kkKoloni(k, p) {
  if (!k || k.koloni || k.sv < 5 || kredi < KOL_F) return;
  let ad = null; try { ad = prompt(T('Kolonine bir ad ver:', 'Name your colony:'), (gemiAd || pilotAd()) + T(' Kolonisi', ' Colony')); } catch (e) { }
  if (ad === null) return; ad = (ad || '').trim().slice(0, 24) || p.ad;
  kredi -= KOL_F; k.koloni = { ad, t0: Date.now(), vt: Date.now() };
  duyur('🏙 ' + T('Kendi kolonin kuruldu: ', 'Your own colony is founded: ') + '<b>' + esc(ad) + '</b>', 'galaksi', T('Nüfus büyüdükçe vergi toplarsın; ücretsiz yakıt ve onarım verir.', 'As it grows you collect taxes; free fuel and repairs.')); SES.galaksi(); basarimKontrol(); kaydet();
}

/* ---- uzay balinaları ---- */
const BAL = new Map();
function balinaSuru(cx, cy) {
  const k = cx + ',' + cy; if (BAL.has(k)) return BAL.get(k);
  const r = rng(h32(cx, cy, 8181)); let b = null;
  if (r() < 0.3 && !(cx === 0 && cy === 0)) b = { id: k, x: (cx + 0.3 + r() * 0.4) * NBH * SEK, y: (cy + 0.3 + r() * 0.4) * NBH * SEK, R: 5000 + r() * 8000, a0: r() * TAU, w: (r() < 0.5 ? 1 : -1) * (0.0012 + r() * 0.001), n: 1 + ((r() * 3) | 0), ad: isim(r, 2), ton: r() };
  if (BAL.size > 2000) BAL.clear(); BAL.set(k, b); return b;
}
function yakinBalinalar(t) {
  const C = NBH * SEK, cx = Math.floor(SH.x / C), cy = Math.floor(SH.y / C), L2 = [];
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const b = balinaSuru(cx + i, cy + j); if (!b) continue; const a = b.a0 + b.w * t; L2.push({ id: b.id, ad: b.ad, x: b.x + Math.cos(a) * b.R, y: b.y + Math.sin(a) * b.R }); }
  return L2;
}
function balinaCiz(t) {
  const C = NBH * SEK, cx = Math.floor(cam.x / C), cy = Math.floor(cam.y / C), z = cam.z;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const b = balinaSuru(cx + i, cy + j); if (!b) continue;
    for (let n = 0; n < b.n; n++) {
      const a = b.a0 + b.w * t - n * 0.05 * Math.sign(b.w), x = b.x + Math.cos(a) * b.R + n * 480, y = b.y + Math.sin(a) * b.R - n * 300, [X, Y] = W2S(x, y), L = Math.max(10, 520 * z * (1 - n * 0.15));
      if (X < -L * 1.5 || X > W + L * 1.5 || Y < -L || Y > H + L) continue;
      const yon = a + Math.PI / 2 * Math.sign(b.w), kuy = Math.sin(t * 1.6 + n) * 0.25;
      ctx.save(); ctx.translate(X, Y); ctx.rotate(yon); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, L * 0.6); g.addColorStop(0, `rgba(${b.ton < 0.5 ? '120,200,255' : '170,140,255'},.35)`); g.addColorStop(1, 'rgba(80,120,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, L * 0.55, L * 0.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${b.ton < 0.5 ? '150,220,255' : '190,170,255'},.28)`; ctx.beginPath(); ctx.moveTo(L * 0.5, 0); ctx.quadraticCurveTo(L * 0.2, -L * 0.2, -L * 0.35, -L * 0.06); ctx.lineTo(-L * 0.62, -L * 0.18 + kuy * L * 0.2); ctx.lineTo(-L * 0.55, 0); ctx.lineTo(-L * 0.62, L * 0.18 + kuy * L * 0.2); ctx.lineTo(-L * 0.35, L * 0.06); ctx.quadraticCurveTo(L * 0.2, L * 0.2, L * 0.5, 0); ctx.fill();
      for (let k = 0; k < 7; k++) { ctx.fillStyle = `rgba(200,255,255,${(0.4 + 0.4 * Math.sin(t * 2 + k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(L * (0.35 - k * 0.1), (k % 2 ? 1 : -1) * L * 0.05, Math.max(1, L * 0.012), 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over'; ctx.restore();
      if (n === 0 && z > 0.04) { ctx.font = '800 11.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(170,220,255,.85)'; ctx.fillText('🐋 ' + b.ad, X, Y - L * 0.3 - 6); }
    }
  }
}
/* ---- koloniler arası konvoylar ---- */
function konvoyCiz(t) {
  const z = cam.z; if (z < 0.02) return;
  const vw = W / 2 / z + 9000, vh = H / 2 / z + 9000, sx0 = Math.floor((cam.x - vw) / SEK), sx1 = Math.floor((cam.x + vw) / SEK), sy0 = Math.floor((cam.y - vh) / SEK), sy1 = Math.floor((cam.y + vh) / SEK);
  if ((sx1 - sx0 + 1) * (sy1 - sy0 + 1) > 100) return;
  for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) {
    const a = temel(sx, sy); if (!a || !a.tam || !a.tam.dugum.length) continue;
    for (const [i, j] of [[1, 0], [0, 1]]) {
      const bt = temel(sx + i, sy + j); if (!bt) continue; const bs = sistem(sx + i, sy + j); if (!bs.dugum.length) continue;
      const fz = (h32(sx, sy, i * 2 + j) % 1000) / 1000, u = (t * 0.0022 + fz) % 1, ters = (h32(sx, sy, 77 + i) & 1) === 1;
      const ax = a.x, ay = a.y, bx = bt.x, by = bt.y, dx = bx - ax, dy = by - ay, L2 = Math.hypot(dx, dy) || 1, nx = -dy / L2 * 900, ny = dx / L2 * 900;
      for (let k = 0; k < 3; k++) {
        const uu = ters ? 1 - u - k * 0.006 : u - k * 0.006; if (uu < 0.08 || uu > 0.92) continue;
        const x = ax + dx * uu + nx, y = ay + dy * uu + ny, [X, Y] = W2S(x, y); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue;
        const s2 = Math.max(0.5, z * 1.4), aci = Math.atan2(dy, dx) + (ters ? Math.PI : 0);
        ctx.save(); ctx.translate(X, Y); ctx.rotate(aci); ctx.scale(s2, s2);
        ctx.fillStyle = '#8E98AC'; ctx.fillRect(-12, -4, 18, 8); ctx.fillStyle = '#C0A070'; ctx.fillRect(-10, -3, 6, 6); ctx.fillRect(-3, -3, 6, 6); ctx.fillStyle = '#DDE6F4'; ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(12, 0); ctx.lineTo(6, 4); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(127,227,255,.7)'; ctx.fillRect(-16, -2, 4, 4); ctx.globalCompositeOperation = 'source-over'; ctx.restore();
        if (k === 0 && z > 0.12) { ctx.font = '700 10.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,210,230,.6)'; ctx.fillText('🚚 ' + T('Konvoy', 'Convoy'), X, Y - 14); }
      }
    }
  }
}
/* ---- antik kalıntı bulmacası ---- */
const RUN = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ'];
let BLM = null;
function bulmacaAc(p) {
  if (BLM && BLM.bekle > Date.now()) { duyur('🏛 ' + T('Kalıntı mühürlü, biraz bekle', 'The ruins are sealed, wait a moment'), 'uyari'); return; }
  const n = 4 + (HIK.a >= 13 ? 1 : 0), sira = []; for (let i = 0; i < n; i++) sira.push((Math.random() * 9) | 0);
  BLM = { p, sira, gir: [], goster: true, bekle: 0 }; $('blmSonuc').innerHTML = ''; $('blmKapat').textContent = T('Ayrıl', 'Leave');
  $('blmIzgara').innerHTML = RUN.map((r, i) => `<button type="button" data-run="${i}">${r}</button>`).join('');
  $('blmYaz').textContent = T('Sembolleri izle…', 'Watch the symbols…'); $('bulmaca').hidden = false; SES.galaksi();
  sira.forEach((k, i) => setTimeout(() => { const b = $('blmIzgara').children[k]; b.classList.add('yan'); SES.tik(); setTimeout(() => b.classList.remove('yan'), 450); if (i === sira.length - 1) setTimeout(() => { BLM.goster = false; $('blmYaz').textContent = T('Şimdi aynı sırayla dokun', 'Now tap them in the same order'); }, 500); }, 700 + i * 700));
}
$('bulmaca').addEventListener('click', e => {
  if (e.target.id === 'blmKapat') { $('bulmaca').hidden = true; return; }
  const b = e.target.closest('[data-run]'); if (!b || !BLM || BLM.goster) return;
  const k = +b.dataset.run; BLM.gir.push(k); b.classList.add('yan'); setTimeout(() => b.classList.remove('yan'), 200); SES.tik();
  const i = BLM.gir.length - 1;
  if (BLM.sira[i] !== k) {
    BLM.bekle = Date.now() + 30000; BLM.goster = true; const B0 = BLM, IZ2 = $('blmIzgara').children; SES.uyari();
    b.classList.add('yanlis'); IZ2[B0.sira[i]].classList.add('dogru');
    $('blmYaz').textContent = T('Kalıntı 30 saniyeliğine mühürlendi.', 'The ruins are sealed for 30 seconds.');
    $('blmSonuc').innerHTML = `<span style="color:#FF9AA6">❌ ${T('Bilemedin!', 'Not quite!')}</span><small class="alt" style="display:block;font-weight:700;margin-top:4px">${T('Doğru sıra şuydu:', 'The right order was:')}</small><span class="sira">${B0.sira.map((q, j) => j === i ? `<u>${RUN[q]}</u>` : RUN[q]).join(' ')}</span>`;
    $('blmKapat').textContent = T('Tamam', 'OK');
    setTimeout(() => { b.classList.remove('yanlis'); IZ2[B0.sira[i]].classList.remove('dogru'); B0.sira.forEach((q, j) => setTimeout(() => { if (BLM !== B0 || $('bulmaca').hidden) return; IZ2[q].classList.add('dogru'); setTimeout(() => IZ2[q].classList.remove('dogru'), 380); }, j * 500)); }, 900);
    setTimeout(() => { if (BLM === B0) $('bulmaca').hidden = true; }, 900 + B0.sira.length * 500 + 2600);
    return;
  }
  if (BLM.gir.length === BLM.sira.length) {
    const p = BLM.p; KESIF.add('r:' + p.id); ST.kalinti = (ST.kalinti || 0) + 1; const od = Math.round((400 + ((Math.random() * 800) | 0)) * (giyili('tarakask') ? 1.5 : 1)); kazan(od, 'kesif');
    let ek = '';
    if (Math.random() < 0.4) arsivBul('kadim', 'kalinti'); bilimEkle(8);
    if (HIK.a === 13) { HIK.parca = (HIK.parca || 0) + 1; ek = ' · ' + T('Kadim parça', 'Ancient shard') + ` ${HIK.parca}/3`; }
    else if (Math.random() < 0.25) { const k = ['kit', 'yhucre', 'emp'][(Math.random() * 3) | 0]; if (SARF[k] < SARF_MAX) { SARF[k]++; ek = ' · ' + SARFE[k].e + ' ' + L(SARFE[k].ad); } }
    else if (Math.random() < 0.45 && planVer('kalinti')) ek = ' · 📜 ' + T('yeni plan bulundu', 'new blueprint found');
    else if (Math.random() < 0.5) { const a = Math.random() * TAU, d = (3 + Math.random() * 3) * SEK; ac(SH.x + Math.cos(a) * d, SH.y + Math.sin(a) * d, 5); ek = ' · ' + T('harita parçası: mini haritada yeni bölge açıldı', 'map fragment: a new area opened on the mini map'); }
    $('blmYaz').textContent = T('Kalıntı açıldı!', 'The ruins opened!'); SES.koloni(); setTimeout(() => { $('bulmaca').hidden = true; }, 900);
    duyur('🏛 ' + T('Antik kalıntı çözüldü: ', 'Ancient ruins solved: ') + '<b>' + esc(p.ad) + '</b>', 'galaksi', `+${SAYI(od)} 💰${ek}`); basarimKontrol(); kaydet(); gpImza = ''; gpYaz();
  }
});
function kapiPos(G) { return [G.x + Math.cos(G.faz + 1) * G.R * 0.3, G.y + Math.sin(G.faz + 1) * G.R * 0.3]; }
function yakinKapi() { const G = galaksi(...galHucre(SH.x, SH.y)), [x, y] = kapiPos(G); return Math.hypot(x - SH.x, y - SH.y) < 900 ? G : null; }
function kapiCiz(t) {
  const [gx, gy] = galHucre(cam.x, cam.y);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const G = galaksi(gx + i, gy + j), [x, y] = kapiPos(G), [X, Y] = W2S(x, y), R = Math.max(18, 650 * cam.z);
    if (X < -R - 40 || X > W + R + 40 || Y < -R - 40 || Y > H + R + 40) continue;
    const acik = HIK.kapi || (HIK.a === 9 && hikGorev() && hikGorev().gk === G.k), ana = acik ? '180,140,255' : '140,150,180';
    ctx.globalCompositeOperation = 'lighter';
    if (acik) { const g = ctx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, 'rgba(200,170,255,.55)'); g.addColorStop(0.6, 'rgba(120,80,255,.2)'); g.addColorStop(1, 'rgba(80,40,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.fill(); }
    for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(X, Y); ctx.rotate(t * (0.12 + k * 0.07) * (k % 2 ? -1 : 1)); ctx.strokeStyle = `rgba(${ana},${acik ? 0.85 - k * 0.2 : 0.45 - k * 0.1})`; ctx.lineWidth = Math.max(1.5, (10 - k * 3) * cam.z * 2); ctx.setLineDash([R * 0.25, R * 0.12]); ctx.beginPath(); ctx.arc(0, 0, R * (1 - k * 0.12), 0, TAU); ctx.stroke(); ctx.restore(); }
    ctx.setLineDash([]); ctx.globalCompositeOperation = 'source-over';
    ctx.font = '900 12.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = acik ? '#D8C6FF' : 'rgba(180,190,220,.75)';
    ctx.fillText('⛩ ' + T('Kadim Kapı', 'Ancient Gate') + (acik ? '' : T(' (sönük)', ' (dormant)')), X, Y - R - 10);
  }
}
function kapiPencere() {
  const simdiki = galaksi(...galHucre(SH.x, SH.y)).k, L2 = [];
  for (const k of KESIF) if (k[0] === 'g') { const [a, b] = k.slice(2).split(',').map(Number); if (k.slice(2) !== simdiki) L2.push(galaksi(a, b)); }
  $('kapiList').innerHTML = L2.length ? L2.map(G => `<button class="ikincil" type="button" data-kapi="${G.k}">🌌 ${esc(L(G.ad))}</button>`).join('') : `<p class="alt">${T('Henüz başka galaksi keşfetmedin.', 'You have not discovered another galaxy yet.')}</p>`;
  $('kapiSec').hidden = false; SES.tik();
}
$('kapiSec').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'kapiKapat') { $('kapiSec').hidden = true; return; }
  if (b.dataset.kapi) {
    const [a, c] = b.dataset.kapi.split(',').map(Number), G = galaksi(a, c), [x, y] = kapiPos(G);
    $('kapiSec').hidden = true; KORS.length = 0; MERMI.length = 0; oto = null; kazP = null; SH.warp = 0; SH.sarj = 0;
    SH.x = x + 900; SH.y = y; SH.vx = 300; SH.vy = 0; cam.x = SH.x; cam.y = SH.y; cam.z = 0.08; hasarFlas = 0.6;
    patlamaEkle(x, y, 160, '190,150,255'); SES.galaksi(); duyur('⛩ ' + esc(L(G.ad)), 'galaksi', T('Kapıdan geçtin', 'You came through the gate')); kaydet();
  }
});
function korsanCikar() {
  const g = korsanGuc(), n = 1 + (Math.random() < 0.3 + g * 0.4 ? 1 : 0) + (g > 0.6 && Math.random() < 0.4 ? 1 : 0), a0 = Math.random() * TAU;
  for (let i = 0; i < n; i++) { const a = a0 + (i - n / 2) * 0.4, d = 2600 + Math.random() * 600, zr = Math.random() < 0.2 + g * 0.5 ? ['zirh', 'kalkan', 'hizli'][(Math.random() * 3) | 0] : null, mx = Math.round((40 + g * 140) * (zr === 'zirh' ? 1.35 : zr === 'hizli' ? 0.75 : 1)); const k = { x: SH.x + Math.cos(a) * d, y: SH.y + Math.sin(a) * d, vx: 0, vy: 0, a: a + Math.PI, can: mx, max: mx, atT: 1.6 + Math.random(), yon: Math.random() < 0.5 ? 1 : -1, zr }; if (zr === 'kalkan') k.kal = k.kalM = Math.round(mx * 0.7); KORS.push(k); }
  if (KORS.some(k => k.zr) && !ST.zrIp) { ST.zrIp = 1; setTimeout(() => duyur('🔫 ' + T('Farklı korsan türleri!', 'Different pirate types!'), 'kesif', T('⚙ zırhlı: plazma/ray · 🛡 kalkanlı: iyon · ⚡ hızlı: saçma. Silahları limanda Tersane’den alırsın.', '⚙ armoured: plasma/rail · 🛡 shielded: ion · ⚡ fast: scatter. Buy weapons at the Shipyard.')), 2500); }
  duyur('☠ ' + T(`Korsan saldırısı! (${n})`, `Pirate attack! (${n})`), 'uyari', T('Taretin kendiliğinden ateş eder. Kaçmak için hızlan ya da warp yap.', 'Your turret fires on its own. Boost or warp to escape.')); SES.uyari();
}
function golgeCikar(x, y) {
  const a0 = Math.random() * TAU;
  for (let i = 0; i < 4; i++) { const a = a0 + i * TAU / 4, d = 1400; KORS.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: 0, vy: 0, a: a + Math.PI, can: 240, max: 240, atT: 1 + Math.random(), yon: i % 2 ? 1 : -1, golge: true }); }
  duyur('👁 ' + T('Gölge dronları uyandı!', 'Shadow drones have awoken!'), 'uyari', T('Kapıyı koruyorlar: hepsini yen. Kalkan ve taret yükseltmeleri işine yarar.', 'They guard the gate: defeat them all. Shield and turret upgrades help.')); SES.uyari();
}
function korsanOldu(k, j) {
  if (k.kolos) return;
  if (EKIP.some(e => huyOf(e) === 'cesur')) moralEkle(0.6);
  KORS.splice(j, 1); patlamaEkle(k.x, k.y, k.ana ? 600 : k.us ? 350 : k.boss ? 150 : 70, k.ana || k.us ? '200,160,255' : '255,150,90'); SES.patla(); ST.korsan++;
  if (k.us || k.ana) { HIK.olu = true; if (k.ana) for (let i = KORS.length - 1; i >= 0; i--) if (KORS[i].golge) { patlamaEkle(KORS[i].x, KORS[i].y, 60, '200,160,255'); KORS.splice(i, 1); } }
  if (k.boss) { const g = GOREV.find(x => x.id === k.gid); if (g) { GOREV = GOREV.filter(x => x !== g); kazan(g.odul, 'korsan'); defter('☠ Aranan korsan ' + g.ad + ' artık yok.', '☠ The wanted pirate ' + g.ad + ' is no more.'); planVer('boss'); ST.gorev++; ST.kelle = (ST.kelle || 0) + 1; gorevYaz(); setTimeout(() => { duyur('🎯 ' + T('Aranan yakalandı: ', 'Wanted pirate caught: ') + '<b>' + esc(g.ad) + '</b>', 'galaksi', `+${SAYI(g.odul)} 💰`); SES.galaksi(); }, 700); } }
  frEkle('birlik', 1); frEkle('klan', -1.5); ekipXp('topcu', 3); if (EKIP.length) moralEkle(0.5);
  const filo = oyuncuYakin(2500), g = korsanGuc(), od = Math.round((60 + g * 220 + Math.random() * 60) * (filo ? 1.25 : 1)); kazan(od, 'korsan'); if (filo) { ST.filo = (ST.filo || 0) + 1; basarimKontrol(); }
  let yag = ''; if (Math.random() < 0.45) { const ml = Object.keys(MAL).filter(m => !OZEL.includes(m)), m = ml[(Math.random() * ml.length) | 0], n = Math.min(2 + ((Math.random() * 5) | 0), kapasite() - kargoDolu()); if (n > 0) { KARGO[m] = (KARGO[m] || 0) + n; yag = ` · ${MAL[m].e} +${n}`; } }
  duyur('💥 ' + T('Korsan yok edildi', 'Pirate destroyed'), 'kesif', `+${SAYI(od)} 💰${yag}${filo ? ' · 🤝 ' + T('filo bonusu', 'fleet bonus') + ' +25%' : ''}`);
  if (!KORS.length) setTimeout(() => duyur('✅ ' + T('Saldırı püskürtüldü', 'Attack repelled'), 'koloni'), 900);
}
function korsanlar(dt, t) {
  if (HM.acik) return;
  const evUzak = Math.hypot(SH.x - SEK / 2, SH.y - SEK / 2) > SEK * 1.6;
  if (!KORS.length && evUzak && SH.warp < 0.2 && !HM.acik && !kazP && !kapsul && !bankaAcik && !borsaAcik && !istAcik && !inisAcik && !fotoMod) { korsT -= dt; if (korsT <= 0) { korsT = (110 + Math.random() * 150) * (BOLGE === 'birlik' ? 1.4 : BOLGE === 'klan' ? 0.65 : 1) * (takili('gizli') ? 2 + 0.75 * (tlv('gizli') - 1) : 1) * (FR.klan <= -30 ? 0.6 : 1) * (gOl('korsan') ? 0.5 : 1); if (FR.klan >= 30 || gOl('sakin')) { if (!ST.klanD && FR.klan >= 30) { ST.klanD = 1; duyur('☠ ' + T('Korsanlar seni tanıdı', 'The pirates know you'), 'kesif', T('Klan dostusun: sıradan korsanlar saldırmıyor', 'You are a friend of the clans: ordinary pirates leave you alone')); } } else { korsanCikar(); devriyeCagir(); } } }
  const g = korsanGuc();
  for (let i = KORS.length - 1; i >= 0; i--) {
    const k = KORS[i], dx = SH.x - k.x, dy = SH.y - k.y, d = Math.hypot(dx, dy) || 1;
    if (d > ((k.us || k.ana || k.kolos) ? 20000 : 14000)) { KORS.splice(i, 1); if (!KORS.length) duyur('💨 ' + T('Korsanlardan kurtuldun', 'You escaped the pirates'), 'kesif'); continue; }
    if (k.kolos) { kolosGuncelle(k, dt, d, dx, dy); continue; }
    if (k.us || k.ana) { devGuncelle(k, dt, d, dx, dy); continue; }
    if (k.sersem > 0) { k.sersem -= dt; k.atT = Math.max(k.atT, 0.25); const sd = Math.exp(-3 * dt); k.vx *= sd; k.vy *= sd; k.x += k.vx * dt; k.y += k.vy * dt; continue; }
    const yak = d < 520, tx = yak ? -dy / d * k.yon : dx / d, ty = yak ? dx / d * k.yon : dy / d, vm = (yak ? 650 : 1500 + g * 350) * (k.zr === 'hizli' ? 1.35 : 1);
    k.vx += (tx * vm + (yak ? SH.vx * 0.85 : 0) - k.vx) * Math.min(1, dt * 1.8); k.vy += (ty * vm + (yak ? SH.vy * 0.85 : 0) - k.vy) * Math.min(1, dt * 1.8);
    k.x += k.vx * dt; k.y += k.vy * dt; k.a = Math.atan2(dy, dx); k.atT -= dt;
    if (k.atT <= 0 && !k.boss && ESK.length) { const e = eskHedefSec(k); if (e) { k.atT = 1.2 + Math.random() * 0.8; const ex = e.x - k.x, ey = e.y - k.y, el = Math.hypot(ex, ey) || 1; MERMI.push({ x: k.x, y: k.y, vx: ex / el * 1500, vy: ey / el * 1500, o: 0, w: 1.2, d: false, h: 5 + g * 9 }); SES.ates(0.3); continue; } }
    if (k.atT <= 0 && d < 1000 && k.boss) { k.atT = 0.9; for (const sp of [-0.18, 0, 0.18]) { const a = Math.atan2(dy, dx) + sp; MERMI.push({ x: k.x, y: k.y, vx: Math.cos(a) * 1500 + k.vx * 0.3, vy: Math.sin(a) * 1500 + k.vy * 0.3, o: 0, w: 1.4, d: false, h: 12 + g * 6 }); } SES.ates(0.4); }
    else if (k.atT <= 0 && d < 950) { k.atT = 1.2 + Math.random() * 0.8 - g * 0.4; const hz = 1500, td = d / hz, ax = SH.x + SH.vx * td - k.x, ay = SH.y + SH.vy * td - k.y, al = Math.hypot(ax, ay) || 1; MERMI.push({ x: k.x, y: k.y, vx: ax / al * hz + k.vx * 0.3, vy: ay / al * hz + k.vy * 0.3, o: 0, w: 1.4, d: false, h: k.golge ? 13 : 5 + g * 9 }); SES.ates(0.5); }
  }
  SH.atT = (SH.atT || 0) - dt;
  if (SH.atT <= 0 && !kapsul) oyuncuAtes();
  if (false) {
    let en = null, ed = 0;
    if (en) { SH.atT = 0.34 / (0.4 + 0.6 * MODUL.silah / 100); const hz = 2600, td = ed / hz, ax = en.x + en.vx * td - SH.x, ay = en.y + en.vy * td - SH.y, al = Math.hypot(ax, ay) || 1; MERMI.push({ x: SH.x, y: SH.y, vx: ax / al * hz + SH.vx, vy: ay / al * hz + SH.vy, o: 0, w: 0.9, d: true, h: 10 * (giyili('hud') ? 1.2 : 1) * (1 + 0.06 * ekipLv('topcu')) * GEMI[gemiTip].silah * (1 + YUK.silah * 0.3) }); SES.ates(1); }
  }
  for (let i = MERMI.length - 1; i >= 0; i--) {
    const m = MERMI[i]; m.o += dt; m.x += m.vx * dt; m.y += m.vy * dt; if (m.o > m.w) { MERMI.splice(i, 1); continue; }
    if (m.fuze) { const hd = KORS.includes(m.fuze) ? m.fuze : KORS[0]; if (hd) { const ax = hd.x - m.x, ay = hd.y - m.y, al = Math.hypot(ax, ay) || 1, hz = 1300; m.vx += (ax / al * hz - m.vx) * Math.min(1, dt * 3); m.vy += (ay / al * hz - m.vy) * Math.min(1, dt * 3); } if (Math.random() < 0.5) PAR.push({ x: m.x, y: m.y, vx: 0, vy: 0, o: 0, w: 0.4, s: 2, wp: false }); }
    if (m.d) { for (let j = KORS.length - 1; j >= 0; j--) { const k = KORS[j]; if (m.vur && m.vur.includes(k)) continue; if (Math.hypot(k.x - m.x, k.y - m.y) < (k.kolos ? 420 : k.ana ? 260 : k.us ? 160 : 28)) { k._hf = 1; k.can -= k.ana && !HIK.mizrak ? 0 : silahHasar(m, k); patlamaEkle(m.x, m.y, m.alan ? 46 : 10, m.rk || '127,227,255'); if (m.iyon && !k.kolos && !k.ana && !k.us) k.sersem = 1.4; if (m.alan) alanHasar(m, k); if (m.del > 0) { m.del--; (m.vur = m.vur || []).push(k); } else MERMI.splice(i, 1); if (k.can <= 0 && KORS.includes(k)) korsanOldu(k, KORS.indexOf(k)); break; } } }
    else if (ESK.length && eskVur(m)) MERMI.splice(i, 1);
    else if (Math.hypot(SH.x - m.x, SH.y - m.y) < 22) { MERMI.splice(i, 1); hasar(m.h); patlamaEkle(m.x, m.y, 12, '255,120,90'); }
  }
}
function olaylar(dt, t) {
  if (HM.acik || SH.warp > 0.2 || KORS.length) return;
  olayT -= dt; if (olayT > 0) return; olayT = 70 + Math.random() * 90;
  let yt = null; const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tm = temel(ssx + i, ssy + j); if (tm && !YT[tm.yt].kd && Math.hypot(tm.x - SH.x, tm.y - SH.y) < 7000) yt = tm; }
  const r0 = Math.random();
  if (r0 < 0.09 && yt && !OLAY.some(o => o.tip === 'sn' || o.tip === 'snb')) { snBasla(yt); return; }
  if (r0 < 0.2 && !OLAY.some(o => o.tip === 'solucan')) { solucanAc(); return; }
  if (r0 < 0.28 && !GOREV.some(g => g.tip === 'istila') && istilaBasla()) return;
  if (r0 < 0.37 && !OLAY.some(o => o.tip === 'iyon')) { iyonAc(); return; }
  if (r0 < 0.46 && !OLAY.some(o => o.tip === 'meteor')) { meteorAc(); return; }
  if (r0 < 0.52 && !OLAY.some(o => o.tip === 'kasa')) { kasaAc(); return; }
  const r = Math.random();
  if (yt && r < 0.28 && firtina <= 0) { firtina = 22; firtS = yt; duyur('🌞 ' + T('Güneş fırtınası!', 'Solar storm!'), 'uyari', T('Radar bozuldu; yıldıza yakınsan gövde yıpranır.', 'Radar is down; near the star your hull takes damage.')); SES.uyari(); return; }
  if (r < 0.66) { const a = Math.atan2(SH.vy, SH.vx) + (Math.random() - 0.5) * 1.4, d = 1600 + Math.random() * 2200; OLAY.push({ tip: 'enkaz', x: SH.x + Math.cos(a) * d, y: SH.y + Math.sin(a) * d, r0: Math.random() * TAU }); duyur('📡 ' + T('Tarayıcı bir enkaz buldu', 'Scanner found a wreck'), 'kesif', T('Yakında: yaklaşıp topla', 'Nearby: get close to salvage')); SES.kesif(); return; }
  if (GOREV.some(g => g.tip === 'imdat')) return;
  const a = Math.random() * TAU, d = SEK * (1.3 + Math.random() * 1.7), x = SH.x + Math.cos(a) * d, y = SH.y + Math.sin(a) * d, ad = isim(Math.random, 2);
  GOREV.push({ id: 'i' + Date.now(), tip: 'imdat', x, y, ad, odul: odulK(180 + d / SEK * 80), hs: [Math.floor(x / SEK), Math.floor(y / SEK)] });
  gorevYaz(); duyur('🆘 ' + T('İmdat çağrısı: ', 'Distress call: ') + '<b>' + esc(ad) + '</b>', 'uyari', T('Yakıtı biten bir gemi 5 yakıt istiyor · görevlere eklendi', 'A stranded ship needs 5 fuel · added to missions')); SES.uyari();
}
function enkazTopla(o) {
  if (o.ben) { if (kapsul) { duyur('🫁 ' + T('Kapsülde ambar yok: önce yeni gemi al', 'The pod has no hold: get a new ship first'), 'uyari'); return; } const yaz2 = []; for (const m in o.yuk) { const n = Math.min(o.yuk[m], kapasite() - kargoDolu()); if (n > 0) { KARGO[m] = (KARGO[m] || 0) + n; o.yuk[m] -= n; yaz2.push(`${MAL[m].e} +${n}`); } if (!o.yuk[m]) delete o.yuk[m]; } if (!Object.keys(o.yuk).length) OLAY.splice(OLAY.indexOf(o), 1); duyur('📦 ' + T('Eski geminin enkazı', 'Your old wreck'), 'kesif', yaz2.join(' · ') || T('Ambarda yer yok', 'No room in the hold')); SES.koloni(); return; }
  OLAY.splice(OLAY.indexOf(o), 1); let yaz = []; const ml = Object.keys(MAL).filter(m => !OZEL.includes(m));
  for (let i = 0; i < 2; i++) { const m = ml[(Math.random() * ml.length) | 0], n = Math.min(2 + ((Math.random() * 5) | 0), kapasite() - kargoDolu()); if (n > 0) { KARGO[m] = (KARGO[m] || 0) + n; yaz.push(`${MAL[m].e} +${n}`); } }
  if (Math.random() < 0.4) { const k = 50 + ((Math.random() * 200) | 0); kazan(k); yaz.push(`+${SAYI(k)} 💰`); }
  duyur('📦 ' + T('Enkaz toplandı', 'Wreck salvaged'), 'kesif', yaz.join(' · ') || T('Ambarda yer yoktu', 'No room in the hold')); SES.koloni();
}
function imdatVer(g) {
  if (yakit < 5) return; yakit -= 5; kazan(g.odul, 'gorev'); ST.gorev++; GOREV = GOREV.filter(x => x !== g); gorevYaz();
  duyur('🙏 ' + T('Kurtardın: ', 'Rescued: ') + '<b>' + esc(g.ad) + '</b>', 'koloni', `+${SAYI(g.odul)} 💰`); SES.koloni();
}

