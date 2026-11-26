/* ================= ana silahlar ================= */
const SILAH = {
  lazer: { e: '🔫', ad: ['Lazer', 'Laser'], ne: ['Dengeli, hızlı atış. Zırhlılara karşı zayıf.', 'Balanced, fast fire. Weak against armour.'], f: 0, cd: 0.34, hz: 2600, w: 0.9, h: 10, n: 1, yay: 0, men: 1, rk: '127,227,255' },
  sacma: { e: '💥', ad: ['Saçma topu', 'Scatter cannon'], ne: ['Kısa menzilde 5 saçma birden. Hızlı korsanlara çok etkili.', 'Five pellets at short range. Great against fast pirates.'], f: 1800, cd: 0.7, hz: 2200, w: 0.45, h: 5.5, n: 5, yay: 0.34, men: 0.62, rk: '255,210,120' },
  plazma: { e: '🟣', ad: ['Plazma topu', 'Plasma cannon'], ne: ['Yavaş, ağır mermi ve alan hasarı. Zırhı eritir.', 'Slow heavy bolt with splash damage. Melts armour.'], f: 3500, cd: 1.0, hz: 1500, w: 1.25, h: 30, n: 1, alan: 170, men: 1, rk: '205,130,255', kal: 6 },
  iyon: { e: '⚡', ad: ['İyon atıcı', 'Ion blaster'], ne: ['Kalkanları söker, hedefi sersemletir. Gövdeye az hasar.', 'Strips shields and stuns. Low hull damage.'], f: 3000, cd: 0.5, hz: 2800, w: 0.8, h: 6, n: 1, iyon: true, men: 0.9, rk: '120,200,255', kal: 3 },
  ray: { e: '🎯', ad: ['Ray tüfeği', 'Railgun'], ne: ['Çok uzun menzil, iki hedefi delip geçer. Yavaş doldurur.', 'Very long range, pierces two targets. Slow reload.'], f: 6000, cd: 1.6, hz: 6000, w: 0.6, h: 42, n: 1, del: 2, men: 1.9, rk: '255,255,255', kal: 1.6 },
};
const SILAH_K = { lazer: { zirh: 0.6, hizli: 1 }, sacma: { zirh: 0.7, hizli: 1.5 }, plazma: { zirh: 1.6, hizli: 0.7 }, iyon: { zirh: 0.5, hizli: 1 }, ray: { zirh: 1.4, hizli: 0.8 } };
const silahCd = () => SILAH[silahS].cd / (0.4 + 0.6 * MODUL.silah / 100) * (iyonIc ? 2.2 : 1) / (0.9 + 0.05 * GUC[1]);
function silahEtiket(k) { const c = SILAH_K[k], f = v => v > 1 ? `<b style="color:#9BE07A">×${v}</b>` : v < 1 ? `<span style="color:#FF9AA6">×${v}</span>` : '×1'; return `⚙ ${f(c.zirh)} · ⚡ ${f(c.hizli)} · 🛡 ${f(k === 'iyon' ? 3 : 1)} · ${T('menzil', 'range')} ×${SILAH[k].men}`; }
function silahYaz() {
  let h = `<div class="alt" style="margin:12px 0 0;font-weight:900;color:var(--ink)">🔫 ${T('Ana silah', 'Main weapon')}</div><div class="alt" style="font-size:12.5px">${T('Korsanların türü var: ⚙ zırhlı, 🛡 kalkanlı, ⚡ hızlı. Doğru silah hasarı katlar. Savaşta R tuşu ya da gemi yanındaki düğmeyle değiştir.', 'Pirates come in types: ⚙ armoured, 🛡 shielded, ⚡ fast. The right weapon multiplies damage. Switch in combat with R or the button by your ship.')}</div>`;
  for (const k in SILAH) { const S = SILAH[k], var_ = SILAHLAR.has(k), sec = silahS === k; const dg = sec ? `<button class="kb" type="button" disabled>${T('Seçili', 'Selected')}</button>` : var_ ? `<button class="kb al" type="button" data-silsec="${k}">${T('Seç', 'Select')}</button>` : `<button class="kb al" type="button" data-silal="${k}" ${kredi < S.f ? 'disabled' : ''}>${T('Al', 'Buy')} · ${SAYI(S.f)} 💰</button>`; h += `<div class="satir"><div>${S.e} <b>${L(S.ad)}</b>${sec ? ' ✓' : ''}<small>${L(S.ne)}</small><small>${silahEtiket(k)}</small></div><div class="dg">${dg}</div></div>`; }
  return h;
}
function silahDegis() { if (SILAHLAR.size < 2) { if (!ST.silIp) { ST.silIp = 1; duyur('🔫 ' + T('Tek silahın var', 'You only have one weapon'), 'kesif', T('Limanda Tersane’den yeni silah al', 'Buy more at a port Shipyard')); } return; } const L2 = Object.keys(SILAH).filter(k => SILAHLAR.has(k)); silahS = L2[(L2.indexOf(silahS) + 1) % L2.length]; SH.atT = Math.max(SH.atT || 0, 0.25); duyur(SILAH[silahS].e + ' ' + L(SILAH[silahS].ad), 'kesif'); SES.tik(); gpImza = ''; }
function oyuncuAtes() {
  const S = SILAH[silahS]; let en = null, ed = 900 * (1 + YUK.silah * 0.1) * S.men;
  for (const k of KORS) { const d = Math.hypot(k.x - SH.x, k.y - SH.y); if (d < ed) { ed = d; en = k; } }
  if (!en) for (const o of OLAY) if (o.tip === 'meteor') for (const m of o.R) { const d = Math.hypot(m.x - SH.x, m.y - SH.y); if (d < ed) { ed = d; en = m; } }
  if (!en) return;
  SH.atT = silahCd(); const F = (giyili('hud') ? 1.2 : 1) * (1 + 0.06 * ekipLv('topcu')) * GEMI[gemiTip].silah * (1 + YUK.silah * 0.3) * (1 + 0.12 * mSay('taret')) * (HIK.son4 === 'C' ? 1.1 : 1) * (0.85 + 0.075 * GUC[1]), td = ed / S.hz, ax = en.x + (en.vx || 0) * td - SH.x, ay = en.y + (en.vy || 0) * td - SH.y, a0 = Math.atan2(ay, ax);
  for (let i = 0; i < S.n; i++) { const a = a0 + (S.n > 1 ? (i / (S.n - 1) - 0.5) * S.yay + (Math.random() - 0.5) * 0.06 : 0) + (iyonIc ? (Math.random() - 0.5) * 0.3 : 0); MERMI.push({ x: SH.x, y: SH.y, vx: Math.cos(a) * S.hz + SH.vx, vy: Math.sin(a) * S.hz + SH.vy, o: 0, w: S.w, d: true, h: S.h * F, sl: silahS, rk: S.rk, kal: S.kal, alan: S.alan, iyon: S.iyon, del: S.del || 0 }); }
  SES.ates(silahS === 'plazma' || silahS === 'ray' ? 1.4 : 1);
}
function silahHasar(m, k) {
  let n = m.h * ((m.sl && k.zr && SILAH_K[m.sl][k.zr]) || 1);
  if (k.kal > 0) { const c = m.sl === 'iyon' ? 3 : 1, e = n * c; if (e <= k.kal) { k.kal -= e; return 0; } n = (e - k.kal) / c; k.kal = 0; patlamaEkle(k.x, k.y, 40, '120,200,255'); }
  return n;
}
function alanHasar(m, k0) { for (let j = KORS.length - 1; j >= 0; j--) { const k = KORS[j]; if (k === k0 || k.kolos || k.ana || k.us) continue; if (Math.hypot(k.x - m.x, k.y - m.y) < m.alan) { k._hf = 1; k.can -= silahHasar(m, k) * 0.5; if (k.can <= 0) korsanOldu(k, j); } } }
function korsanRozet(k, X, Y, s, t) {
  if (k.kal > 0) { ctx.strokeStyle = `rgba(120,200,255,${(0.35 + 0.4 * k.kal / k.kalM).toFixed(2)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, Math.max(10, 24 * s), 0, TAU); ctx.stroke(); }
  if (k.zr) { ctx.font = '900 11px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = k.zr === 'zirh' ? '#FFD08A' : k.zr === 'kalkan' ? '#9FD8FF' : '#FFF08A'; ctx.fillText(k.zr === 'zirh' ? '⚙' : k.zr === 'kalkan' ? '🛡' : '⚡', X, Y - 32 * s - 2); }
  if (k.sersem > 0) { ctx.strokeStyle = 'rgba(160,220,255,.9)'; ctx.lineWidth = 1.3; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = t * 9 + i * 2.1, r = 16 * Math.max(s, 0.6); ctx.moveTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); ctx.lineTo(X + Math.cos(a + 0.5) * r * 1.3, Y + Math.sin(a + 0.5) * r * 0.7); } ctx.stroke(); }
}
/* ================= eskortlar ================= */
const ESKT = {
  avci: { e: '🗡', ad: ['Avcı eskort', 'Fighter escort'], g: 'avci', can: 120, h: 7, cd: 0.45, men: 850, hiz: 1.25, f: 1500, ne: ['Hızlı, sürekli ateş eder', 'Fast, fires constantly'] },
  muhafiz: { e: '🛡', ad: ['Muhafız', 'Guardian'], g: 'zirh', can: 320, h: 5, cd: 0.6, men: 750, hiz: 1, f: 1800, ag: true, ne: ['Çok dayanıklı, korsanların dikkatini üstüne çeker', 'Very tough, draws pirate fire'] },
  topcu: { e: '🎯', ad: ['Topçu', 'Gunner'], g: 'kraik', can: 150, h: 20, cd: 1.4, men: 1400, hiz: 0.9, f: 2200, ne: ['Uzaktan ağır atış yapar', 'Heavy shots from long range'] },
  bekci: { e: '👁', ad: ['Bekçi dronu', 'Warden drone'], g: 'golge', can: 280, h: 13, cd: 0.5, men: 1100, hiz: 1.35, f: 0, ozel: true, ne: ['Yankı’nın sana bağladığı gölge dronu · maaş almaz', 'A shadow drone Echo bound to you · takes no pay'] },
};
const ESK_EMIR = { koru: ['Koru', 'Guard'], saldir: ['Saldır', 'Attack'], geri: ['Geri çekil', 'Fall back'] }, ESK_MAAS = 80, ESK_MAX = () => FR.birlik >= 30 ? 3 : 2;
function eskEmirDegis() { const L2 = Object.keys(ESK_EMIR); eskEmir = L2[(L2.indexOf(eskEmir) + 1) % L2.length]; duyur('🛡 ' + T('Eskort emri: ', 'Escort order: ') + '<b>' + L(ESK_EMIR[eskEmir]) + '</b>', 'kesif', eskEmir === 'koru' ? T('Yanında kalır, sana yaklaşanları vurur', 'Stays close, shoots whoever comes near you') : eskEmir === 'saldir' ? T('Korsanların üstüne gider', 'Goes after the pirates') : T('Geride durur, savaşmaz, kendini onarır', 'Holds back, does not fight, repairs itself')); SES.tik(); gpImza = ''; }
function eskortYaz(p) {
  let h = `<div class="alt" style="margin:14px 0 0;font-weight:900;color:var(--ink)">🛡 ${T('Eskortlar', 'Escorts')} (${ESK.length}/${ESK_MAX()})</div><div class="alt" style="font-size:12.5px">${T(`Kiralık gemiler seni takip eder ve korsanlarla savaşır. Her limanda kişi başı ${ESK_MAAS} 💰 maaş alır ve onarılır. Emir: G tuşu ya da gemi yanındaki düğme.`, `Hired ships follow you and fight pirates. At every port each takes ${ESK_MAAS} 💰 pay and gets repaired. Orders: G or the button by your ship.`)}</div>`;
  ESK.forEach((e, i) => { const E = ESKT[e.t]; h += `<div class="satir"><div>${E.e} <b>${esc(e.ad)}</b> · ${L(E.ad)}<small>🛡 ${Math.ceil(e.can)}/${E.can}</small></div><div class="dg"><button class="kb" type="button" data-eskcik="${i}">${T('Sözleşmeyi bitir', 'Dismiss')}</button></div></div>`; });
  for (const k in ESKT) { const E = ESKT[k]; if (E.ozel) continue; h += `<div class="satir"><div>${E.e} <b>${L(E.ad)}</b><small>${L(E.ne)}</small><small>🛡 ${E.can} · 🔫 ${E.h} · ${T('menzil', 'range')} ${E.men}</small></div><div class="dg"><button class="kb al" type="button" data-eskal="${k}" ${kredi < E.f || ESK.length >= ESK_MAX() || kapsul ? 'disabled' : ''}>${T('Kirala', 'Hire')} · ${SAYI(E.f)} 💰</button></div></div>`; }
  return h;
}
function eskMaas() {
  if (!ESK.length) return; const ucretli = () => ESK.filter(e => !ESKT[e.t].ozel).length; while (ucretli() && kredi < ESK_MAAS * ucretli()) { const ix = ESK.map(e => !ESKT[e.t].ozel).lastIndexOf(true); const e = ESK.splice(ix, 1)[0]; setTimeout(() => duyur('👋 ' + esc(e.ad) + T(': maaş ödenmedi, ayrıldı', ': unpaid, left your service'), 'uyari'), 600); }
  if (!ESK.length) return; const m = ESK_MAAS * ucretli(); kredi -= m; for (const e of ESK) e.can = ESKT[e.t].can; setTimeout(() => duyur('🛡 ' + T('Eskort maaşı ödendi', 'Escort pay'), 'koloni', `-${SAYI(m)} 💰 · ${T('eskortlar onarıldı', 'escorts repaired')}`), 900);
}
function eskHedefSec(k) { let en = null; for (const e of ESK) { if (e.x == null) continue; const d = Math.hypot(e.x - k.x, e.y - k.y), dp = Math.hypot(SH.x - k.x, SH.y - k.y); if (d < 950 && (ESKT[e.t].ag ? Math.random() < 0.6 : d < dp && Math.random() < 0.3)) { en = e; break; } } return en; }
function eskVur(m) { for (const e of ESK) { if (e.x == null) continue; if (Math.hypot(e.x - m.x, e.y - m.y) < 26) { e.can -= m.h; e._hf = 1; patlamaEkle(m.x, m.y, 12, '255,120,90'); if (e.can <= 0) eskOldu(e); return true; } } return false; }
function eskOldu(e) { const i = ESK.indexOf(e); if (i < 0) return; ESK.splice(i, 1); patlamaEkle(e.x, e.y, 120, '255,170,90'); SES.patla(); duyur('💥 ' + T('Eskortun düştü: ', 'Escort lost: ') + '<b>' + esc(e.ad) + '</b>', 'uyari'); defter(`💥 Eskortum ${e.ad} korsanlarla savaşırken düştü.`, `💥 My escort ${e.ad} fell fighting pirates.`); gpImza = ''; kaydet(); }
function eskAdim(dt) {
  if (!ESK.length) return; if (kapsul) { ESK.length = 0; duyur('🛡 ' + T('Eskortların seni kaybetti', 'Your escorts lost you'), 'uyari'); return; }
  if (!oyunda || limanP) return; const ca = Math.cos(SH.a), sa = Math.sin(SH.a);
  ESK.forEach((e, i) => {
    const E = ESKT[e.t], yan = i % 2 ? 1 : -1, geri = eskEmir === 'geri' ? 420 : 150 + Math.floor(i / 2) * 70, fx = SH.x - ca * geri - sa * yan * (90 + i * 30), fy = SH.y - sa * geri + ca * yan * (90 + i * 30);
    if (e.x == null || Math.hypot(e.x - SH.x, e.y - SH.y) > 3200 || SH.warp > 0.2) { e.x = fx; e.y = fy; e.vx = SH.vx; e.vy = SH.vy; e.a = SH.a; return; }
    let hd = null, hdd = Infinity; if (eskEmir !== 'geri') for (const k of KORS) { const dk = Math.hypot(k.x - e.x, k.y - e.y), dp = Math.hypot(k.x - SH.x, k.y - SH.y); if ((eskEmir === 'saldir' ? dk < 2600 : dp < 1000) && dk < hdd) { hdd = dk; hd = k; } }
    let tx, ty; if (hd && eskEmir === 'saldir') { const a = Math.atan2(e.y - hd.y, e.x - hd.x) + dt * 0.6 * yan, r = E.men * 0.65; tx = hd.x + Math.cos(a) * r; ty = hd.y + Math.sin(a) * r; } else { tx = fx; ty = fy; }
    const vmax = 1500 * E.hiz * motorK(), dvx = (tx - e.x) * 2.2 + (hd && eskEmir === 'saldir' ? 0 : SH.vx), dvy = (ty - e.y) * 2.2 + (hd && eskEmir === 'saldir' ? 0 : SH.vy), dl = Math.hypot(dvx, dvy), kk = dl > vmax ? vmax / dl : 1;
    e.vx += (dvx * kk - e.vx) * Math.min(1, dt * 3); e.vy += (dvy * kk - e.vy) * Math.min(1, dt * 3); e.x += e.vx * dt; e.y += e.vy * dt;
    e.a = hd ? Math.atan2(hd.y - e.y, hd.x - e.x) : Math.hypot(e.vx, e.vy) > 60 ? Math.atan2(e.vy, e.vx) : SH.a;
    e.atT -= dt; if (hd && hdd < E.men && e.atT <= 0) { e.atT = E.cd * (iyonIc ? 2.2 : 1); const hz = 2400, td = hdd / hz, ax = hd.x + hd.vx * td - e.x, ay = hd.y + hd.vy * td - e.y, al = Math.hypot(ax, ay) || 1; MERMI.push({ x: e.x, y: e.y, vx: ax / al * hz + e.vx, vy: ay / al * hz + e.vy, o: 0, w: (E.men + 300) / hz, d: true, h: E.h * (1 + YUK.silah * 0.15), rk: '160,255,170' }); }
    if (!KORS.length || eskEmir === 'geri') e.can = Math.min(E.can, e.can + dt * (eskEmir === 'geri' ? 6 : 2));
    if (e._hf) e._hf = Math.max(0, e._hf - dt * 2.5);
  });
}
function eskCiz(s, t) { for (const e of ESK) { if (e.x == null) continue; const [X, Y] = W2S(e.x, e.y); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue; gemiCizGenel(X, Y, e.a, s * 0.8, ESKT[e.t].g, gemiRenk, 'oyuncu', { itki: Math.min(1, Math.hypot(e.vx, e.vy) / 900), t, hasar: e._hf || 0 }); ctx.font = '800 10.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(160,255,170,.85)'; ctx.fillText(ESKT[e.t].e + ' ' + e.ad, X, Y - 22 * s - 4); const E = ESKT[e.t]; if (e.can < E.can) { const w = 28 * s; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(X - w / 2, Y + 18 * s, w, 3); ctx.fillStyle = '#9BE07A'; ctx.fillRect(X - w / 2, Y + 18 * s, w * Math.max(0, e.can / E.can), 3); } } }
/* ================= uzay tehlikeleri ================= */
function iyonAc() {
  const a = Math.atan2(SH.vy, SH.vx) + (Math.random() - 0.5) * 1.2, d = 3400 + Math.random() * 1800, R = 1800 + Math.random() * 900, va = a + Math.PI + (Math.random() - 0.5), b = [];
  for (let i = 0; i < 10; i++) { const ba = Math.random() * TAU, bd = Math.sqrt(Math.random()) * R * 0.7; b.push([Math.cos(ba) * bd, Math.sin(ba) * bd, R * (0.3 + Math.random() * 0.35)]); }
  OLAY.push({ tip: 'iyon', x: SH.x + Math.cos(a) * d, y: SH.y + Math.sin(a) * d, R, vx: Math.cos(va) * 110, vy: Math.sin(va) * 110, omur: 170, b });
  duyur('⚡ ' + T('İyon fırtınası yaklaşıyor!', 'Ion storm approaching!'), 'uyari', T('İçinde radar kör olur, taret yavaşlar, sistemler arızalanır. Etrafından dolaş.', 'Inside, radar goes blind, the turret slows and systems fail. Go around it.')); SES.uyari();
}
function meteorAc() {
  const a = Math.random() * TAU, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, cx = SH.x + SH.vx * 5, cy = SH.y + SH.vy * 5, hz = 750 + Math.random() * 250, T0 = 7, R = [];
  for (let i = 0; i < 38; i++) { const lat = (Math.random() - 0.5) * 2400, lon = -hz * T0 - Math.random() * 2800, r = 12 + Math.pow(Math.random(), 2) * 34, k = 0.9 + Math.random() * 0.2, v = []; for (let j = 0, n = 7 + ((Math.random() * 4) | 0); j < n; j++) v.push(0.7 + Math.random() * 0.35); R.push({ x: cx + ux * lon + px * lat, y: cy + uy * lon + py * lat, vx: ux * hz * k, vy: uy * hz * k, r, v, a: Math.random() * TAU, w: (Math.random() - 0.5) * 2 }); }
  OLAY.push({ tip: 'meteor', x: cx, y: cy, R, ux, uy, omur: 34, uyar: T0 + 2 });
  duyur('☄ ' + T('Meteor yağmuru geliyor!', 'Meteor shower incoming!'), 'uyari', T('Geliş yönü ekranda okla gösteriliyor: yolundan çekil ya da taretinle parçala', 'The arrow shows where it comes from: get out of the way or shoot the rocks')); SES.uyari();
}
function meteorAdim(o, i, dt) {
  o.omur -= dt; o.uyar -= dt; if (o.omur <= 0 || !o.R.length) { OLAY.splice(i, 1); return; }
  for (let j = o.R.length - 1; j >= 0; j--) {
    const m = o.R[j]; m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.w * dt;
    if (oyunda && !limanP && Math.hypot(m.x - SH.x, m.y - SH.y) < m.r + 14) { hasar(4 + m.r * 0.35, false, true); patlamaEkle(m.x, m.y, m.r * 2, '200,170,140'); SES.patla(); SH.vx += m.vx * 0.12; SH.vy += m.vy * 0.12; o.R.splice(j, 1); continue; }
    for (const e of ESK) if (e.x != null && Math.hypot(m.x - e.x, m.y - e.y) < m.r + 14) { e.can -= 4 + m.r * 0.3; e._hf = 1; if (e.can <= 0) eskOldu(e); m.r = 0; break; }
    for (let q = MERMI.length - 1; q >= 0 && m.r > 0; q--) { const b = MERMI[q]; if (!b.d || Math.abs(b.x - m.x) > m.r + 10 || Math.hypot(b.x - m.x, b.y - m.y) > m.r + 10) continue; MERMI.splice(q, 1); m.r -= Math.max(6, b.h * 0.7); patlamaEkle(b.x, b.y, 10, '220,190,150'); }
    if (m.r < 9) { o.R.splice(j, 1); patlamaEkle(m.x, m.y, 30, '220,190,150'); ST.meteor = (ST.meteor || 0) + 1; if (Math.random() < 0.3 && !kapsul && kargoDolu() < kapasite()) { KARGO.cevher = (KARGO.cevher || 0) + 1; duyur(MAL.cevher.e + ' +1', 'kesif'); } }
  }
}
function radVar(q) { return (q.tip === 'gaz' || q.tip === 'buzdevi') && (q.seed >>> 0) % 3 === 0; }
function radAdim(dt) {
  radIc = 0; if (!oyunda || limanP || SH.warp > 0.2) return; const s2 = sistem(Math.floor(SH.x / SEK), Math.floor(SH.y / SEK)); if (!s2) return;
  for (const q of s2.gez) { if (!radVar(q)) continue; const [qx, qy] = gezPos(q, simT()), o = Math.hypot(qx - SH.x, qy - SH.y) / q.r; if (o <= 1.5 || o >= 3) continue;
    radIc = 1 - Math.abs(o - 2.25) / 0.75; hasar(dt * (0.8 + 1.8 * radIc) * (kapsul ? 0.5 : 1), true, true);
    if (performance.now() - (SH._rad || 0) > 9000) { SH._rad = performance.now(); duyur('☢ ' + T('Radyasyon kuşağı!', 'Radiation belt!'), 'uyari', T('Gövde yıpranıyor: hızla geç', 'Your hull is degrading: cross quickly')); SES.uyari(); }
    if (!KESIF.has('~rad:' + q.id)) { KESIF.add('~rad:' + q.id); ST.rad = (ST.rad || 0) + 1; setTimeout(() => { bilimEkle(4); duyur('☢ ' + T('Radyasyon ölçümü kaydedildi', 'Radiation reading logged'), 'kesif', esc(q.ad) + ' · 🔬 +4'); basarimKontrol(); }, 1200); }
    break; }
}
function radCiz(t) {
  const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { if (Math.abs(i) + Math.abs(j) > 1) continue; const s2 = sistem(sx + i, sy + j); if (!s2) continue;
    for (const q of s2.gez) { if (!radVar(q)) continue; const [qx, qy] = gezPos(q, simT()), [X, Y] = W2S(qx, qy), r1 = q.r * 1.5 * cam.z, r2 = q.r * 3 * cam.z; if (r2 < 6 || X + r2 < 0 || X - r2 > W || Y + r2 < 0 || Y - r2 > H) continue;
      const g = ctx.createRadialGradient(X, Y, r1, X, Y, r2); g.addColorStop(0, 'rgba(170,255,120,0)'); g.addColorStop(0.5, `rgba(170,255,120,${(0.07 + 0.03 * Math.sin(t * 2)).toFixed(3)})`); g.addColorStop(1, 'rgba(170,255,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, r2, 0, TAU); ctx.arc(X, Y, r1, 0, TAU, true); ctx.fill();
      if (r2 > 60) { ctx.strokeStyle = 'rgba(190,255,140,.22)'; ctx.lineWidth = 1; ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.arc(X, Y, r1, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(X, Y, r2, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,255,150,.75)'; ctx.fillText('☢', X, Y - (r1 + r2) / 2); } } }
}
function kdAdim(dt) {
  kdIc = 0; if (!oyunda || limanP) return; const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK); let en = null, eo = 99;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tm = temel(ssx + i, ssy + j); if (tm && YT[tm.yt].kd) { const o = Math.hypot(tm.x - SH.x, tm.y - SH.y) / tm.yr; if (o < eo) { eo = o; en = tm; } } }
  const v = Math.hypot(SH.vx, SH.vy);
  if (!en || eo > 9) { if (kdTm && kdEn > 1.2 && kdEn < 2.8 && kdV > 700 && SH.warp < 0.2) penrose(); kdTm = null; kdEn = 99; kdV = 0; return; }
  if (!kdTm || kdTm.k !== en.k) { kdTm = en; kdEn = eo; kdV = 0; } kdEn = Math.min(kdEn, eo); kdV = Math.max(kdV, v);
  if (eo < 7) { kdIc = eo; kdGoz += dt * (eo < 3.5 ? 2.5 : 1); ST.kdB = ST.kdB || {}; const al = ST.kdB[en.k] || 0; if (kdGoz >= 8 && al < 15) { kdGoz = 0; ST.kdB[en.k] = al + 1; bilimEkle(1); if (!al) duyur('⏳ ' + T('Zaman genişlemesi ölçülüyor', 'Measuring time dilation'), 'kesif', T('Kara deliğe yakın kaldıkça bilim puanı kazanırsın (en fazla 15)', 'Stay near the black hole to earn science (up to 15)')); } }
}
function penrose() { const v = Math.hypot(SH.vx, SH.vy) || 1, k = Math.min(1.8, 9000 / v); SH.vx *= k; SH.vy *= k; sapanBoost = Math.min(2, sapanBoost + 1.1); ST.penrose = (ST.penrose || 0) + 1; flasT = 0.5; duyur('🕳 ' + T('Penrose sapanı!', 'Penrose slingshot!'), 'galaksi', T('Kara deliğin dönüş enerjisinden hız çaldın', 'You stole speed from the black hole’s spin')); SES.galaksi(); defter('🕳 Bir kara deliğin olay ufkunu teğet geçip Penrose sapanıyla fırladım.', '🕳 I skimmed a black hole’s horizon and shot out on a Penrose slingshot.'); basarimKontrol(); }
/* ---- kararlı solucan delikleri (galaksiler arası geçitler) ---- */
const SK_YON = { D: [1, 0, 'B'], B: [-1, 0, 'D'], G: [0, 1, 'K'], K: [0, -1, 'G'] };
function skVar(gx, gy, d) { if (d === 'B') return skVar(gx - 1, gy, 'D'); if (d === 'K') return skVar(gx, gy - 1, 'G'); return (h32(gx, gy, d === 'D' ? 6161 : 6262) >>> 0) % 100 < 75; }
function skKapi(gx, gy, d) { const g = galaksi(gx, gy), r = rng(h32(gx * 4 + 'DBGK'.indexOf(d), gy, 6363)), [ux, uy] = SK_YON[d], a = Math.atan2(uy, ux) + (r() - 0.5) * 0.9, R = g.R * (0.78 + r() * 0.12); return { id: gx + ',' + gy + ',' + d, gx, gy, d, x: g.x + Math.cos(a) * R, y: g.y + Math.sin(a) * R }; }
function skEs(k) { const [ux, uy, d2] = SK_YON[k.d]; return skKapi(k.gx + ux, k.gy + uy, d2); }
const SKL = new Map(); function skListe(gx, gy) { const key = gx + ',' + gy; let L2 = SKL.get(key); if (!L2) { L2 = Object.keys(SK_YON).filter(d => skVar(gx, gy, d)).map(d => skKapi(gx, gy, d)); if (SKL.size > 300) SKL.clear(); SKL.set(key, L2); } return L2; }
function skAdim() {
  skYakin = null; if (!oyunda || limanP || kapsul) return; const [gx, gy] = galHucre(SH.x, SH.y);
  for (const k of skListe(gx, gy)) { const d = Math.hypot(k.x - SH.x, k.y - SH.y);
    if (d < 7000 && !KESIF.has('~sk:' + k.id)) { KESIF.add('~sk:' + k.id); const es = skEs(k), ad = L(galaksi(es.gx, es.gy).ad); duyur('🌀 ' + T('Kararlı solucan deliği!', 'Stable wormhole!'), 'galaksi', '→ ' + esc(ad) + T(' · yaklaş ve geçitten geç', ' · get close and go through')); SES.galaksi(); bilimEkle(5); defter(`🌀 ${ad} yönüne açılan kararlı bir solucan deliği buldum.`, `🌀 I found a stable wormhole leading to ${ad}.`); kaydet(); }
    if (d < 450) skYakin = k; }
}
function skGec(k) {
  if (performance.now() - skSonT < 3000) return; if (yakit < 2) { duyur('⛽ ' + T('Geçidi dengelemek için 2 yakıt gerekir', 'Stabilising the gate needs 2 fuel'), 'uyari'); return; }
  skSonT = performance.now(); const es = skEs(k), g2 = galaksi(es.gx, es.gy), a = Math.atan2(es.y - g2.y, es.x - g2.x), ad = L(g2.ad);
  yakit -= 2; SH.x = es.x - Math.cos(a) * 650; SH.y = es.y - Math.sin(a) * 650; SH.vx = -Math.cos(a) * 250; SH.vy = -Math.sin(a) * 250; SH.warp = 0; SH.sarj = 0; cam.x = SH.x; cam.y = SH.y; oto = null; wp = null; flasT = 1.1; KORS.length = 0; MERMI.length = 0; for (const e of ESK) e.x = null;
  KESIF.add('~sk:' + es.id); ST.gecit = (ST.gecit || 0) + 1; ST.skB = ST.skB || {}; if (!ST.skB[k.id]) { ST.skB[k.id] = 1; bilimEkle(5); }
  duyur('🌀 ' + T('Geçitten geçtin: ', 'Through the gate: ') + '<b>' + esc(ad) + '</b>', 'galaksi', T('Dönüş geçidi hemen arkanda', 'The way back is right behind you')); SES.galaksi(); defter(`🌀 Kararlı solucan deliğinden ${ad} galaksisine geçtim.`, `🌀 I crossed a stable wormhole into ${ad}.`); gpImza = ''; basarimKontrol(); kaydet();
}
function skCiz(t) {
  const [gx, gy] = galHucre(SH.x, SH.y);
  for (const k of skListe(gx, gy)) { const d = Math.hypot(k.x - SH.x, k.y - SH.y); if (d > 25000) continue; const [X, Y] = W2S(k.x, k.y), R = Math.max(9, 240 * cam.z); if (X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) continue;
    ctx.save(); ctx.translate(X, Y); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.8); g.addColorStop(0, 'rgba(120,200,255,.35)'); g.addColorStop(0.5, 'rgba(180,120,255,.18)'); g.addColorStop(1, 'rgba(180,120,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.8, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(t * (0.6 + i * 0.25) * (i % 2 ? -1 : 1) + i); ctx.scale(1, 0.55 + 0.1 * i); ctx.strokeStyle = i % 2 ? 'rgba(180,140,255,.7)' : 'rgba(127,227,255,.75)'; ctx.lineWidth = Math.max(1, R * 0.035); ctx.beginPath(); ctx.arc(0, 0, R * (0.55 + i * 0.14), 0, TAU * 0.8); ctx.stroke(); ctx.restore(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#02030A'; ctx.beginPath(); ctx.arc(0, 0, R * 0.32, 0, TAU); ctx.fill(); ctx.restore();
    const es = skEs(k), bil = KESIF.has('~sk:' + k.id); ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#C9B4FF'; ctx.fillText('🌀 ' + (bil ? '→ ' + L(galaksi(es.gx, es.gy).ad) : '?'), X, Y - R - 12); }
}
function skHarita(c, g, M2S, sp) {
  for (const k of skListe(g.gx, g.gy)) { if (!KESIF.has('~sk:' + k.id)) continue; const es = skEs(k), [X, Y] = M2S(k.x, k.y), [X2, Y2] = M2S(es.x, es.y);
    c.strokeStyle = 'rgba(180,140,255,.55)'; c.lineWidth = 1.5; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(X, Y); c.lineTo(X2, Y2); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#C9B4FF'; c.font = '900 12px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('🌀', X, Y + 4); if (sp < 3) { c.font = '800 10.5px Nunito, system-ui, sans-serif'; c.fillText('→ ' + L(galaksi(es.gx, es.gy).ad), X, Y - 10); } }
}
function tehAdim(dt) {
  iyonIc = false;
  for (let i = OLAY.length - 1; i >= 0; i--) { const o = OLAY[i];
    if (o.tip === 'iyon') { o.x += o.vx * dt; o.y += o.vy * dt; o.omur -= dt; if (o.omur <= 0) { OLAY.splice(i, 1); continue; }
      if (oyunda && !limanP && Math.hypot(o.x - SH.x, o.y - SH.y) < o.R) { iyonIc = true; if (Math.random() < dt * 0.6) { const ks = Object.keys(MODUL), k = ks[(Math.random() * ks.length) | 0]; MODUL[k] = Math.max(5, MODUL[k] - 4 - Math.random() * 6); }
        if (!o.gir) { o.gir = 1; ST.iyon = (ST.iyon || 0) + 1; bilimEkle(3); duyur('⚡ ' + T('İyon fırtınasının içindesin!', 'You are inside the ion storm!'), 'uyari', T('Radar kör, taret yavaş, sistemler arızalanıyor · 🔬 +3', 'Radar blind, turret slow, systems failing · 🔬 +3')); basarimKontrol(); } } }
    else if (o.tip === 'meteor') meteorAdim(o, i, dt); }
  radAdim(dt); kdAdim(dt); skAdim(); eskAdim(dt); astAdim(dt); if (DEV.yakitsiz) yakit = tank(); yarisAdim(dt); bulT -= dt; if (bulT <= 0) { bulT = 300; if (AG.durum() === 'acik' && ls.get('kozmos-bulut-kod', null) && ls.get('kozmos-bulut-oto', true) !== false) bulutKaydet(true); } rehT -= dt; if (rehT <= 0) { rehT = 1; sezCipYaz(); if (!REH.bas) { REH.bas = true; rehKontrol(true); } rehKontrol(false); rehYaz(); } kolT -= dt; if (kolT <= 0) { kolT = 5; kolIsle(); }
  if (EKIP.length) { const md = EKIP.reduce((a, e) => a + (HUY[huyOf(e)].moral || 0), 0); if (md) MORAL = Math.max(0, Math.min(100, MORAL + md * dt / 60)); if (SH.warp > 0.3) ekipXp('pilot', Math.hypot(SH.vx, SH.vy) * dt / SEK * 0.6); if (Object.values(MODUL).some(v => v < 100)) ekipXp('muhendis', dt * 0.05); }
  if (GUC[2] > 2 && oyunda && !limanP && !KORS.length && can < maxCan()) can = Math.min(maxCan(), can + dt * 0.3 * (GUC[2] - 2)); izAdim(dt); kodT -= dt; if (kodT <= 0) { kodT = 2; kodKontrol(); }
  if (mSay('kalkan') && oyunda && !limanP && !KORS.length && can < maxCan()) can = Math.min(maxCan(), can + dt * 0.6 * mSay('kalkan'));
}
function tehCiz(t) {
  for (const o of OLAY) {
    if (o.tip === 'iyon') { const [X, Y] = W2S(o.x, o.y), R = o.R * cam.z; if (X + R < 0 || X - R > W || Y + R < 0 || Y - R > H) continue; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [bx, by, br] of o.b) { const x = X + bx * cam.z, y = Y + by * cam.z, r = br * cam.z, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(110,140,255,.16)'); g.addColorStop(0.6, 'rgba(150,90,255,.08)'); g.addColorStop(1, 'rgba(150,90,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      if (Math.random() < 0.25) { const b = o.b[(Math.random() * o.b.length) | 0], c2 = o.b[(Math.random() * o.b.length) | 0]; ctx.strokeStyle = 'rgba(200,230,255,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); let x = X + b[0] * cam.z, y = Y + b[1] * cam.z; ctx.moveTo(x, y); const x2 = X + c2[0] * cam.z, y2 = Y + c2[1] * cam.z; for (let s2 = 1; s2 <= 6; s2++) { const f = s2 / 6; ctx.lineTo(lerp(x, x2, f) + (Math.random() - 0.5) * 30, lerp(y, y2, f) + (Math.random() - 0.5) * 30); } ctx.stroke(); }
      ctx.restore(); if (R > 80) { ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(190,210,255,.8)'; ctx.fillText('⚡ ' + T('İyon fırtınası', 'Ion storm'), X, Y - R * 0.75); } }
    else if (o.tip === 'meteor') for (const m of o.R) { const [X, Y] = W2S(m.x, m.y), r = Math.max(1.5, m.r * cam.z); if (X < -r * 6 || X > W + r * 6 || Y < -r * 6 || Y > H + r * 6) continue;
      ctx.globalCompositeOperation = 'lighter'; const tl = Math.min(80, r * 5), vl = Math.hypot(m.vx, m.vy) || 1, gx = X - m.vx / vl * tl, gy = Y - m.vy / vl * tl, g = ctx.createLinearGradient(X, Y, gx, gy); g.addColorStop(0, 'rgba(255,170,90,.55)'); g.addColorStop(1, 'rgba(255,120,60,0)'); ctx.strokeStyle = g; ctx.lineWidth = r * 1.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(gx, gy); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#5E5146'; ctx.strokeStyle = '#9A8670'; ctx.lineWidth = 1; ctx.beginPath(); m.v.forEach((k, j) => { const a = m.a + j * TAU / m.v.length, x = X + Math.cos(a) * r * k, y = Y + Math.sin(a) * r * k; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
}
function tehUst(t) {
  yarisUst(t);
  if (iyonIc) { ctx.fillStyle = `rgba(90,110,255,${(0.06 + 0.04 * Math.sin(t * 13) + (Math.random() < 0.06 ? 0.1 : 0)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (radIc > 0) { ctx.fillStyle = `rgba(150,255,100,${(0.04 + 0.06 * radIc).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (kdIc > 0 && kdIc < 7) { const f = 1 / Math.sqrt(Math.max(0.03, 1 - 1.15 / kdIc)), k = kis((7 - kdIc) / 5.5, 0, 1), g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20,5,0,${(0.55 * k).toFixed(2)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#FFC48A'; ctx.fillText('⏳ ' + T('Zaman genişlemesi', 'Time dilation') + ' ×' + SAYI(f, 2) + ' · 🔬', 14, 66); }
  if (iyonIc || radIc > 0) { ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = iyonIc ? '#AFC4FF' : '#C8FF9A'; ctx.fillText(iyonIc ? '⚡ ' + T('İyon fırtınası: radar kör', 'Ion storm: radar blind') : '☢ ' + T('Radyasyon', 'Radiation') + ' ' + Math.round(radIc * 100) + '%', 14, kdIc > 0 && kdIc < 7 ? 86 : 66); }
  for (const o of OLAY) { if (o.tip !== 'meteor' || o.uyar <= 0) continue; const a = Math.atan2(-o.uy, -o.ux), R = Math.min(W, H) * 0.36, X = W / 2 + Math.cos(a) * R, Y = H / 2 + Math.sin(a) * R; { okCiz(X, Y, a + Math.PI, 14, `rgba(255,150,80,${(0.6 + 0.4 * Math.sin(t * 10)).toFixed(2)})`); ctx.font = '900 14px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFB07A'; ctx.fillText('☄ ' + Math.ceil(o.uyar), X - Math.cos(a) * 26, Y - Math.sin(a) * 26 + 5); } }
}
/* ================= Kolos: haftalık ortak boss ================= */
const KOLOS_M = 150000, KOLOS_Y = 30000;
function kolosPos() { const hk = KOLOS.hafta || haftaK(Date.now()), r = rng(h32(hk.charCodeAt(5) * 31 + hk.charCodeAt(6), hk.length, 6666)), s0 = sistem(0, 0), a = r() * TAU, d = (9 + r() * 4) * SEK; return [s0.x + Math.cos(a) * d, s0.y + Math.sin(a) * d]; }
function kolosBagla() { const hk = haftaK(AG.simdi()); KOLOS.hafta = hk; KOLOS.cevrim = AG.bossBaslat(hk, KOLOS_M); }
function bossGuncel(v, M) { KOLOS.can = v; KOLOS.max = M; KOLOS.cevrim = true; if (v <= 0 && !KOLOS.yenildi) kolosYenildi(); }
function kolosAdim(dt) {
  let hk; try { hk = haftaK(AG.simdi()); } catch (e) { hk = haftaK(Date.now()); }
  if (KOLOS.hafta !== hk) { KOLOS.hafta = hk; KOLOS.yenildi = false; KOLOS.cevrim = false; if (AG.durum() === 'acik') kolosBagla(); }
  if (!KOLOS.cevrim) { ST.bossY = ST.bossY && ST.bossY.h === hk ? ST.bossY : { h: hk, can: KOLOS_Y }; KOLOS.max = KOLOS_Y; KOLOS.can = ST.bossY.can; if (KOLOS.can <= 0 && !KOLOS.yenildi) kolosYenildi(); }
  if (!oyunda || KOLOS.yenildi) return; const [x, y] = kolosPos(), d = Math.hypot(x - SH.x, y - SH.y), k = KORS.find(q => q.kolos);
  if (!k && d < 9000 && !kapsul) { KORS.push({ kolos: true, x, y, vx: 0, vy: 0, a: 0, can: 1e12, max: 1e12, atT: 2, dT: 10, sp: 0, ad: T('Kolos', 'Colossus') }); duyur('👹 ' + T('Kolos’un menziline girdin!', 'You are in range of the Colossus!'), 'uyari', KOLOS.cevrim ? T('Bütün pilotlarla ortak can çubuğu', 'One health bar shared by all pilots') : T('Çevrimdışı: kendi Kolos’un', 'Offline: your own Colossus')); SES.uyari(); }
  if (k) { const n = 1e12 - k.can; k.can = 1e12; if (n > 0) { bossBirik += n; ST.bossD = ST.bossD || {}; ST.bossD[hk] = (ST.bossD[hk] || 0) + n; if (!KOLOS.cevrim) { ST.bossY.can = Math.max(0, ST.bossY.can - n); } } }
  bossGonT -= dt; if (bossGonT <= 0) { bossGonT = 2; if (bossBirik > 0 && KOLOS.cevrim) { AG.bossVur(hk, bossBirik, ST.bossD[hk] || 0); KOLOS.can = Math.max(0, KOLOS.can - bossBirik); } bossBirik = 0; basarimKontrol(); }
}
function kolosYenildi() {
  KOLOS.yenildi = true; const k = KORS.findIndex(q => q.kolos); if (k >= 0) { const q = KORS[k]; KORS.splice(k, 1); patlamaEkle(q.x, q.y, 1200, '255,170,90'); flasT = 1.2; SES.patla(); for (let i = KORS.length - 1; i >= 0; i--) if (KORS[i].kolosD) KORS.splice(i, 1); }
  const hk = KOLOS.hafta, d = (ST.bossD || {})[hk] || 0; ST.bossOd = ST.bossOd || {};
  if (d > 0 && !ST.bossOd[hk]) { ST.bossOd[hk] = 1; const od = 2000 + Math.min(20000, Math.round(d)); kazan(od, 'korsan'); bilimEkle(30); ST.bossKaz = (ST.bossKaz || 0) + 1; defter('👹 Kolos düştü! Ben de vurdum: ' + SAYI(Math.round(d)) + ' hasar.', '👹 The Colossus fell! I dealt ' + SAYI(Math.round(d)) + ' damage.'); setTimeout(() => { duyur('🏆 ' + T('Kolos yenildi!', 'The Colossus has fallen!'), 'galaksi', T('Katkın: ', 'Your share: ') + SAYI(Math.round(d)) + ` · +${SAYI(od)} 💰 · 🔬 +30`); SES.galaksi(); basarimKontrol(); }, 600); kaydet(); }
  else if (oyunda) duyur('👹 ' + T('Bu haftanın Kolos’u yenildi', 'This week’s Colossus has fallen'), 'kesif', T('Gelecek hafta yenisi gelecek', 'A new one arrives next week'));
}
function kolosGuncelle(k, dt, d, dx, dy) {
  k.a += dt * 0.08; k.atT -= dt; k.dT -= dt;
  if (k.atT <= 0 && d < 3500) { k.atT = 0.4; k.sp += 0.33; for (let o = 0; o < 3; o++) { const a = k.sp + o * TAU / 3; MERMI.push({ x: k.x + Math.cos(a) * 360, y: k.y + Math.sin(a) * 360, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, o: 0, w: 3, d: false, h: 8 }); } }
  if (k.dT <= 0 && d < 4500) { k.dT = 11; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, mx = 220; KORS.push({ x: k.x + Math.cos(a) * 450, y: k.y + Math.sin(a) * 450, vx: 0, vy: 0, a, can: mx, max: mx, atT: 1.5, yon: i ? 1 : -1, kolosD: true, ist: true }); } }
}
function kolosCiz(k, X, Y, t) {
  const R = Math.max(26, 430 * cam.z); ctx.save(); ctx.translate(X, Y); ctx.rotate(k.a);
  ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, R * 1.5); g.addColorStop(0, 'rgba(255,140,60,.35)'); g.addColorStop(1, 'rgba(255,80,30,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.5, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#2A140C'; ctx.strokeStyle = '#FF8A3D'; ctx.lineWidth = Math.max(1.5, R * 0.025);
  ctx.beginPath(); for (let i = 0; i < 18; i++) { const a = i * TAU / 18, r = i % 3 === 0 ? R : i % 3 === 1 ? R * 0.78 : R * 0.86; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.save(); ctx.rotate(a); ctx.fillStyle = '#3E1E10'; ctx.fillRect(R * 0.35, -R * 0.06, R * 0.45, R * 0.12); ctx.fillStyle = Math.sin(t * 4 + i) > 0 ? '#FFD08A' : '#FF6A2A'; ctx.beginPath(); ctx.arc(R * 0.82, 0, Math.max(2, R * 0.04), 0, TAU); ctx.fill(); ctx.restore(); }
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.3); cg.addColorStop(0, '#FFFFFF'); cg.addColorStop(0.35, '#FFB066'); cg.addColorStop(1, 'rgba(255,80,30,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, R * (0.27 + 0.03 * Math.sin(t * 3)), 0, TAU); ctx.fill();
  ctx.restore(); ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFB066'; ctx.fillText('👹 ' + T('Kolos', 'Colossus'), X, Y - R - 14);
}
function kolosHtml() {
  const [x, y] = kolosPos(), d = Math.hypot(x - SH.x, y - SH.y), hk = KOLOS.hafta || haftaK(Date.now()), ben = (ST.bossD || {})[hk] || 0, o = KOLOS.max ? KOLOS.can / KOLOS.max : 1;
  let h = `<div class="alt">${T('Her hafta ana sisteme yakın bir yerde dev bir uzaylı gemisi belirir. Çevrimiçiyken bütün pilotların hasarı ortak can çubuğundan düşer. Yenildiğinde, hasar verdiysen katkına göre ödül alırsın.', 'Every week a giant alien ship appears near the home system. Online, every pilot’s damage comes off one shared health bar. When it falls, you are rewarded by your contribution if you hit it.')}</div>`;
  h += `<div style="margin:10px 0 4px;display:flex;justify-content:space-between;font-weight:900"><span>👹 ${T('Kolos', 'Colossus')} · ${hk}</span><span>${KOLOS.yenildi ? '🏆 ' + T('Yenildi', 'Defeated') : SAYI(Math.round(KOLOS.can)) + ' / ' + SAYI(KOLOS.max || KOLOS_Y)}</span></div><div style="height:10px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${KOLOS.yenildi ? 0 : (o * 100).toFixed(1)}%;background:linear-gradient(90deg,#FF5C2A,#FFB066)"></i></div>`;
  h += `<div class="satir"><div>📍 <b>${T('Konum', 'Location')}</b><small>${mesafeYaz(d)} · ${KOLOS.cevrim ? T('çevrimiçi: ortak', 'online: shared') : T('çevrimdışı: yalnızca senin', 'offline: yours only')}</small></div><div class="dg"><button class="kb al" type="button" data-kgit ${KOLOS.yenildi ? 'disabled' : ''}>${T('Git', 'Go')}</button></div></div>`;
  h += `<div class="satir"><div>⚔ <b>${T('Senin katkın', 'Your contribution')}</b><small>${SAYI(Math.round(ben))} ${T('hasar', 'damage')} · ${T('ödül', 'reward')} ≈ ${SAYI(2000 + Math.min(20000, Math.round(ben)))} 💰</small></div></div>`;
  h += `<div class="alt" style="margin:10px 0 2px;font-weight:900;color:var(--ink)">🏆 ${T('En çok hasar verenler', 'Top damage dealers')}</div><div id="kolSira"><div class="alt">${KOLOS.cevrim ? T('Yükleniyor…', 'Loading…') : T('Sıralama için çevrimiçi olmalısın.', 'You need to be online for the leaderboard.')}</div></div>`;
  return h;
}
