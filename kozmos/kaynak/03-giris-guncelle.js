/* ================= giriş ================= */
const TUS = {};
let PTR = new Map(), dokun = null, pinch = null, yonHedef = null, guc = 0, fren = false, boost = false, warpTus = false;
const B = { fren: false, boost: false, warp: false };
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase(); TUS[k] = true; TUS[e.code] = true;
  if (k === 'm') { HM.acik ? haritaKapat() : haritaAc(); }
  else if (k === 'o') modDegis();
  else if (k === 'k') kokpitAc(!kokAcik);
  else if (k === 'i' && oyunda && !e.repeat) { if ($('ambar').hidden) ambarAc(); else ambarKapat(); }
  else if (k === 'q') patlamaKullan();
  else if (k === 'r' && oyunda && !e.repeat) silahDegis();
  else if (k === 'b' && oyunda && !e.repeat && !limanP) izPen();
  else if (k === 'n' && oyunda && !e.repeat) { if ($('bilPen').hidden) bilAc(); else $('bilPen').hidden = true; }
  else if (k === 'g' && oyunda && !e.repeat && ESK.length) eskEmirDegis();
  else if (k === 'p' && oyunda && !e.repeat) fotoAc(!fotoMod);
  else if (k === 'v' && oyunda && !e.repeat) fpAc(!kokGor);
  else if (k === 'escape' && fotoMod) fotoAc(false);
  else if (k >= '1' && k <= '4' && !e.repeat) { const s2 = Object.keys(SARFE).find(x => SARFE[x].tus === k); if (s2) sarfKullan(s2); }
  else if (k === 'e' && yanasP && !limanP && oyunda) limanAc(yanasP);
  else if (k === 'e' && kaynP && oyunda) kazP ? kazDur() : kazBasla(kaynP);
  if (mod === 'oto' && oto && oyunda && !e.repeat) { if (k === ' ') otoWarp(); else if (k === 'shift') otoBoost(); }
  else if (k === 'f') tamEkran();
  else if (e.key === '`' && ls.get('kozmos-dev', false)) devAc();
  else if ((k === 'z' || k === 'x' || k === 'c') && oyunda && !e.repeat) { if (!kilitli('guc')) gucVer('zxc'.indexOf(k)); }
  else if (k === '+' || k === '=') zKul = kis(zKul * 1.25, 0.06, 2.4);
  else if (k === '-' || k === '_') zKul = kis(zKul / 1.25, 0.06, 2.4);
  else if (k === 'escape' && HM.acik) haritaKapat();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  SES.baslat();
});
addEventListener('keyup', e => { TUS[e.key.toLowerCase()] = false; TUS[e.code] = false; });
addEventListener('blur', () => { for (const k in TUS) TUS[k] = false; PTR.clear(); pinch = null; B.fren = B.boost = B.warp = false; document.querySelectorAll('#kont .basili').forEach(b => b.classList.remove('basili')); });
cv.addEventListener('contextmenu', e => { e.preventDefault(); if (oyunda && !fotoMod && !HM.acik && !limanP) sagAc(e.clientX, e.clientY); });
cv.addEventListener('pointerdown', e => {
  if (!$('sagMenu').hidden) sagKapat();
  if (e.button === 2) return;
  if (e.pointerType !== 'mouse' && oyunda && !fotoMod && !kokGor && (mod === 'oto' || (() => { const [gx, gy] = W2S(SH.x, SH.y); return Math.hypot(e.clientX - gx, e.clientY - gy) < 50; })())) { clearTimeout(uzunBas); const px = e.clientX, py = e.clientY; uzunBas = setTimeout(() => { if (dokun && dokun.m < 12 && !dokun.p && PTR.size === 1) { PTR.clear(); dokun = null; sagAc(px, py); } }, 600); }
  try { cv.setPointerCapture(e.pointerId); } catch (er) { }
  PTR.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (PTR.size === 1) dokun = { x: e.clientX, y: e.clientY, m: 0, p: false }; else if (dokun) dokun.p = true;
  if (PTR.size === 2) { const [a, b] = [...PTR.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: zKul }; }
  $('sesKutu').hidden = true; SES.baslat();
});
cv.addEventListener('pointermove', e => {
  if (!PTR.has(e.pointerId)) return; const eski = PTR.get(e.pointerId); PTR.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (fotoMod && PTR.size === 1) { cam.x -= (e.clientX - eski.x) / cam.z; cam.y -= (e.clientY - eski.y) / cam.z; }
  if (dokun) dokun.m = Math.max(dokun.m, Math.hypot(e.clientX - dokun.x, e.clientY - dokun.y));
  if (pinch && PTR.size >= 2) { const [a, b] = [...PTR.values()]; zKul = kis(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, fotoMod ? 0.01 : 0.06, 2.4); }
});
const birak = e => { clearTimeout(uzunBas); if (PTR.has(e.pointerId) && e.type === 'pointerup' && dokun && PTR.size === 1 && !dokun.p && dokun.m < 12 && mod === 'oto' && oyunda && !fotoMod && !kokGor) otoSec(e.clientX, e.clientY); if (PTR.size <= 1) dokun = null; PTR.delete(e.pointerId); if (PTR.size < 2) pinch = null; if (!PTR.size) pinch = null; };
cv.addEventListener('pointerup', birak); cv.addEventListener('pointercancel', birak); cv.addEventListener('lostpointercapture', birak);
cv.addEventListener('wheel', e => { e.preventDefault(); zKul = kis(zKul * Math.exp(-e.deltaY * 0.0014), fotoMod ? 0.01 : 0.06, 2.4); }, { passive: false });
/* sanal joystick, düğme boyutu, solak modu */
const KONT = { tip: ls.get('kozmos-kont', 'dokun'), boy: ls.get('kozmos-kboy', 'o'), solak: !!ls.get('kozmos-solak', false) };
const JOY = { id: null, x: 0, y: 0 };
function joyAyar(e) { const r = $('joy').getBoundingClientRect(), R = r.width / 2; let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } JOY.x = x; JOY.y = y; $('joy').style.setProperty('--jx', (x * R * 0.56).toFixed(1) + 'px'); $('joy').style.setProperty('--jy', (y * R * 0.56).toFixed(1) + 'px'); }
function joyBirak() { JOY.id = null; JOY.x = JOY.y = 0; $('joy').classList.remove('basili'); $('joy').style.setProperty('--jx', '0px'); $('joy').style.setProperty('--jy', '0px'); }
$('joy').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); JOY.id = e.pointerId; try { $('joy').setPointerCapture(e.pointerId); } catch (er) { } $('joy').classList.add('basili'); joyAyar(e); SES.baslat(); });
$('joy').addEventListener('pointermove', e => { if (e.pointerId === JOY.id) joyAyar(e); });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) $('joy').addEventListener(ev, e => { if (e.pointerId === JOY.id) joyBirak(); });
$('joy').addEventListener('contextmenu', e => e.preventDefault());
function kontYerles() {
  const kb = { k: 48, o: 56, b: 68 }[KONT.boy] || 56, js = { k: 104, o: 124, b: 150 }[KONT.boy] || 124;
  document.body.style.setProperty('--kb', kb + 'px'); $('joy').style.setProperty('--js', js + 'px'); document.body.classList.toggle('solak', KONT.solak);
  const g = $('gosterge').getBoundingClientRect(), mi = $('mini').getBoundingClientRect(), k = $('kont').getBoundingClientRect(), J = $('joy').style;
  const gTop = g.height ? g.top : innerHeight - 140;
  if (KONT.solak) { $('kont').style.bottom = Math.round(innerHeight - gTop + 8) + 'px'; } else $('kont').style.bottom = '';
  if (!KONT.solak) { J.left = '16px'; J.right = 'auto'; J.bottom = Math.round(innerHeight - gTop + 10) + 'px'; }
  else { const yat = innerWidth > innerHeight * 1.3, ab = $('ambarBtn').getBoundingClientRect(), ust = !yat && ab.height ? ab.top : mi.height ? mi.top : (k.height ? k.top : innerHeight - 90); J.left = 'auto'; J.right = (yat ? 62 : 14) + 'px'; J.bottom = Math.round(innerHeight - ust + 10) + 'px'; }
}
function joyGor() {
  const ac = DOKUN && KONT.tip === 'joy' && oyunda && mod === 'surus' && !kokGor && !fotoMod && !HM.acik && !limanP && !inisAcik && !document.querySelector('.perde:not([hidden])');
  if ($('joy').hidden === ac) { $('joy').hidden = !ac; if (ac) kontYerles(); else joyBirak(); }
}
setInterval(() => { try { joyGor(); } catch (e) { } }, 300);
addEventListener('resize', () => setTimeout(() => { try { kontYerles(); } catch (e) { } }, 60));
$('kontSec').value = KONT.tip; $('kboySec').value = KONT.boy; $('solakSec').checked = KONT.solak;
$('kontSec').addEventListener('change', e => { KONT.tip = e.target.value; ls.set('kozmos-kont', KONT.tip); SES.tik(); if (KONT.tip === 'joy' && mod !== 'surus') modDegis(); duyur('🕹 ' + (KONT.tip === 'joy' ? T('Sanal joystick açık', 'Virtual joystick on') : T('Ekrana dokunarak yönlendirme', 'Tap-to-steer')), 'kesif', KONT.tip === 'joy' ? T('Sol alttaki çubuğu sürükle; ne kadar uzağa çekersen o kadar hızlanırsın', 'Drag the stick at the bottom left; the further you pull, the faster you go') : ''); });
$('kboySec').addEventListener('change', e => { KONT.boy = e.target.value; ls.set('kozmos-kboy', KONT.boy); kontYerles(); SES.tik(); });
$('solakSec').addEventListener('change', e => { KONT.solak = e.target.checked; ls.set('kozmos-solak', KONT.solak); kontYerles(); SES.tik(); });
setTimeout(() => { try { kontYerles(); } catch (e) { } }, 0);
/* titreşim (Android): hasar, patlama, warp */
const TIT = { acik: ls.get('kozmos-tit', true) !== false, var: typeof navigator.vibrate === 'function', son: 0 };
function titre(ms, oncelik) { if (!TIT.acik || !TIT.var || !oyunda || document.hidden) return; const n = performance.now(); if (!oncelik && n - TIT.son < 180) return; TIT.son = n; try { navigator.vibrate(ms); } catch (e) { } if (PAD.g && PAD.g.vibrationActuator && PAD.g.vibrationActuator.playEffect) { try { const d = Array.isArray(ms) ? ms.reduce((a, b) => a + b, 0) : ms; PAD.g.vibrationActuator.playEffect('dual-rumble', { duration: Math.min(400, d * 2), strongMagnitude: Math.min(1, d / 80), weakMagnitude: 0.5 }); } catch (e) { } } }
/* oyun kolu: sol çubuk yön ve güç, A hız (pencerede onay), B fren (pencerede kapat), X etkileşim, Y harita, RT warp, Start menü */
$('titSec').checked = TIT.acik; $('titSat').hidden = !TIT.var; $('titSec').addEventListener('change', e => { TIT.acik = e.target.checked; ls.set('kozmos-tit', TIT.acik); if (TIT.acik) { try { navigator.vibrate(40); } catch (er) { } } SES.tik(); });
const PAD = { var: false, g: null, x: 0, y: 0, fren: false, boost: false, warp: false, e: [] };
function padTus(k) { const o = { key: k, bubbles: true }; dispatchEvent(new KeyboardEvent('keydown', o)); dispatchEvent(new KeyboardEvent('keyup', o)); }
function padOku() {
  if (!navigator.getGamepads) return; let L2; try { L2 = navigator.getGamepads(); } catch (e) { return; } let g = null;
  for (const p of L2) if (p && p.connected && p.mapping === 'standard') { g = p; break; }
  if (!g) for (const p of L2) if (p && p.connected && p.buttons.length >= 4 && p.axes.length >= 2) { g = p; break; }
  if (!g) { if (PAD.var) { PAD.var = false; PAD.g = null; PAD.x = PAD.y = 0; PAD.fren = PAD.boost = PAD.warp = false; duyur('🎮 ' + T('Oyun kolu ayrıldı', 'Controller disconnected'), 'kesif'); } return; }
  if (!PAD.var) { PAD.var = true; duyur('🎮 ' + T('Oyun kolu bağlandı', 'Controller connected'), 'koloni', T('Sol çubuk: uç · A hız · B fren · RT warp · X etkileşim · Y harita · Start menü', 'Left stick: fly · A boost · B brake · RT warp · X interact · Y map · Start menu')); an('kol'); }
  PAD.g = g; const ol = v => Math.abs(v) < 0.2 ? 0 : v, b = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.45));
  let x = ol(g.axes[0] || 0), y = ol(g.axes[1] || 0); if (b(14)) x = -1; if (b(15)) x = 1; if (b(12)) y = -1; if (b(13)) y = 1; PAD.x = x; PAD.y = y;
  const pen = [...document.querySelectorAll('.perde:not([hidden])')].sort((p, q) => (+getComputedStyle(p).zIndex || 0) - (+getComputedStyle(q).zIndex || 0)).pop();
  const bas = i => { const s2 = b(i), ilk = s2 && !PAD.e[i]; PAD.e[i] = s2; return ilk; };
  const A = bas(0), Bt = bas(1), X = bas(2), Y = bas(3), St = bas(9), Bk = bas(8), LB = bas(4);
  if (pen) {
    PAD.fren = PAD.boost = PAD.warp = false;
    if (A) { const d = [...pen.querySelectorAll('button.ana')].find(q => !q.hidden && q.offsetParent && !q.disabled); if (d) d.click(); }
    if (Bt || St) padTus('Escape');
  } else {
    PAD.boost = b(0) || b(5); PAD.fren = b(1) || b(6); PAD.warp = b(7);
    if (X) padTus('e'); if (Y) padTus('m'); if (Bk) padTus('n'); if (LB) padTus('g');
    if (St) { if (HM.acik) padTus('m'); else $('ayarBtn').click(); }
  }
}
const KMAP = { kFren: 'fren', kHiz: 'boost', kWarp: 'warp' };
for (const id in KMAP) {
  const b = $(id);
  const ac = e => { e.preventDefault(); B[KMAP[id]] = true; b.classList.add('basili'); SES.baslat(); try { b.setPointerCapture(e.pointerId); } catch (er) { } };
  const kp = () => { B[KMAP[id]] = false; b.classList.remove('basili'); };
  b.addEventListener('pointerdown', ac); b.addEventListener('pointerup', kp); b.addEventListener('pointercancel', kp); b.addEventListener('lostpointercapture', kp);
  b.addEventListener('contextmenu', e => e.preventDefault());
}

/* ================= duyuru ================= */
/* bildirimler: aynısı gelirse ×n diye birleşir, yer azsa önce önemsizler düşer, hepsi geçmişe yazılır */
const BIL = (() => { const L = ls.get('kozmos-bil', []); return Array.isArray(L) ? L.filter(x => x && typeof x.m === 'string').slice(0, 60) : []; })();
let bilOku = BIL.length ? BIL[0].t : 0;
const BIL_ON = { uyari: 3, galaksi: 2, koloni: 2, kesif: 1 };
function duyur(m, tur, alt) {
  tur = tur || ''; const an = m + '|' + (alt || ''), k = $('duyuru');
  const g = BIL[0]; if (g && g.m === m && (g.a || '') === (alt || '') && Date.now() - g.t < 60000) { g.n = (g.n || 1) + 1; g.t = Date.now(); } else { BIL.unshift({ m, a: alt || '', u: tur, t: Date.now() }); if (BIL.length > 60) BIL.length = 60; }
  bilRozet();
  for (const d of k.children) if (d.dataset.a === an && !d.classList.contains('git')) {
    const n = (+d.dataset.n || 1) + 1; d.dataset.n = n; let c = d.querySelector('.dyS'); if (!c) { c = document.createElement('b'); c.className = 'dyS'; d.insertBefore(c, d.firstChild); } c.textContent = '×' + n + ' ';
    d.classList.remove('dyNab'); void d.offsetWidth; d.classList.add('dyNab'); clearTimeout(d._t); d._t = dyZaman(d, tur); return;
  }
  const d = document.createElement('div'); d.className = 'dy ' + tur; d.innerHTML = m + (alt ? `<small>${alt}</small>` : ''); d.dataset.a = an; d.dataset.p = BIL_ON[tur] || 0;
  k.appendChild(d);
  while (k.children.length > 3) { let en = null; for (const x of k.children) if (!en || +x.dataset.p < +en.dataset.p) en = x; en.remove(); }
  d._t = dyZaman(d, tur);
}
function dyZaman(d, tur) { return setTimeout(() => { d.classList.add('git'); setTimeout(() => d.remove(), 650); }, tur === 'galaksi' ? 5200 : tur === 'uyari' ? 4800 : 4000); }
function bilRozet() { const b = document.getElementById('bilBtn'); if (!b) return; const n = BIL.filter(x => x.t > bilOku).length; b.dataset.n = n > 99 ? '99+' : n || ''; }
let bilFil = '';
function bilAc() {
  bilOku = Date.now(); bilRozet(); const sim = Date.now(), ne = t => { const d = (sim - t) / 1000; return d < 60 ? T('şimdi', 'now') : d < 3600 ? Math.floor(d / 60) + T(' dk', ' min') : d < 86400 ? Math.floor(d / 3600) + T(' sa', ' h') : Math.floor(d / 86400) + T(' gün', ' d'); };
  const F = [['', T('Tümü', 'All')], ['uyari', '⚠ ' + T('Uyarı', 'Alerts')], ['kesif', '🔭 ' + T('Keşif', 'Discovery')], ['koloni', '🏙 ' + T('Koloni', 'Colony')], ['galaksi', '🌌 ' + T('Önemli', 'Major')]];
  const L2 = BIL.filter(x => !bilFil || x.u === bilFil);
  $('bilIc').innerHTML = `<h2 style="margin:0 0 6px;font-size:20px;font-weight:900">🔔 ${T('Bildirim geçmişi', 'Notification history')}</h2><div class="sekme" style="margin:6px 0 10px">${F.map(([k, a]) => `<button type="button" data-bf="${k}" class="${bilFil === k ? 'on' : ''}" style="font-size:12px;padding:7px 4px">${a}</button>`).join('')}</div>
  <div style="max-height:min(56vh,460px);overflow:auto;display:flex;flex-direction:column;gap:6px">${L2.length ? L2.map(x => `<div class="dy ${x.u}" style="animation:none;text-align:left;max-width:none;display:flex;gap:8px;align-items:flex-start"><div style="flex:1;min-width:0">${x.n > 1 ? `<b class="dyS">×${x.n} </b>` : ''}${x.m}${x.a ? `<small>${x.a}</small>` : ''}</div><span class="alt" style="font-size:11px;white-space:nowrap">${ne(x.t)}</span></div>`).join('') : `<div class="alt">${T('Henüz bildirim yok.', 'No notifications yet.')}</div>`}</div>`;
  $('bilPen').hidden = false;
}
$('bilIc').onclick = e => { const b = e.target.closest('[data-bf]'); if (b) { bilFil = b.dataset.bf; bilAc(); } };
$('bilKapat').onclick = () => { $('bilPen').hidden = true; SES.tik(); };
$('bilBtn').onclick = () => { $('menu').hidden = true; bilAc(); SES.tik(); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function kolAd(p) { return p.kol.adEv ? T('Yeni Umut', 'New Hope') : p.kol.ad; }
function nufYaz(n) { return n >= 1e6 ? SAYI(n / 1e6, 1) + T(' milyon', ' million') : SAYI(Math.round(n / 100) * 100); }
function mesafeYaz(d) { const km = d * 1000; if (km >= 1e9) return SAYI(km / 1e9, 1) + T(' milyar km', ' billion km'); if (km >= 1e6) return SAYI(km / 1e6, 1) + T(' milyon km', ' million km'); return SAYI(km / 1e3) + T(' bin km', 'k km'); }

/* ================= güncelle ================= */
function guncelle(dt, t) {
  kareNo++; isikGuncelle(); rcsAdim(dt); fxAdim(dt); ortAdim(dt); mevAdim(dt); SARS *= Math.exp(-dt * 4.5);
  for (let i = DUMAN.length - 1; i >= 0; i--) { const d = DUMAN[i]; d.o += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.985; d.vy *= 0.985; if (d.o > d.w) DUMAN.splice(i, 1); }
  // dokular: kare başına bir tane
  for (let n = 0; n < 1 && KUYRUK.length; n++) { const p = KUYRUK.shift(); p._kuy = 0; if (!DOKU.has(p.id)) dokuUret(p); }
  // giriş
  let don = 0; guc = 0; yonHedef = null;
  const ileri = TUS.w || TUS.arrowup, geri = TUS.s || TUS.arrowdown, sol = TUS.a || TUS.arrowleft, sag = TUS.d || TUS.arrowright;
  fren = !!(geri || B.fren || PAD.fren); boost = !!(TUS.shift || B.boost || PAD.boost); warpTus = !kapsul && !!(TUS[' '] || TUS.Space || B.warp || PAD.warp);
  if (oyunda && !HM.acik) {
    if (ileri) guc = 1;
    if (sol) don -= 1; if (sag) don += 1;
    if (PTR.size === 1 && !pinch && mod === 'surus' && kokGor && !fotoMod) { const p = [...PTR.values()][0]; if (p.x < W * 0.36) don -= 1; else if (p.x > W * 0.64) don += 1; guc = p.y < H * 0.85 ? 1 : 0.4; }
    else if (PTR.size === 1 && !pinch && mod === 'surus' && !fotoMod) {
      const p = [...PTR.values()][0], sx = (SH.x - cam.x) * cam.z + W / 2, sy = (SH.y - cam.y) * cam.z + H / 2, dx = p.x - sx, dy = p.y - sy, d = Math.hypot(dx, dy);
      if (d > 14) { yonHedef = Math.atan2(dy, dx); guc = Math.max(guc, kis((d - 14) / 190, 0.12, 1)); }
    }
    if (PAD.var && !fotoMod && (PAD.x || PAD.y)) { const m = Math.min(1, Math.hypot(PAD.x, PAD.y)); yonHedef = Math.atan2(PAD.y, PAD.x); guc = Math.max(guc, kis((m - 0.2) / 0.75, 0.12, 1)); }
    if (JOY.id != null && !fotoMod) { const m = Math.hypot(JOY.x, JOY.y); if (m > 0.14) { yonHedef = Math.atan2(JOY.y, JOY.x); guc = Math.max(guc, kis((m - 0.14) / 0.8, 0.12, 1)); } }
  } else if (!oyunda) { SH.a += dt * 0.05; }
  if (!oyunda || HM.acik || limanP || fotoMod || inisAcik || bankaAcik || borsaAcik || istAcik) { warpTus = false; guc = 0; don = 0; yonHedef = null; if (fotoMod || inisAcik) fren = true; }
  if (limanP) { fren = true; oto = null; }
  if (kazP) { if (ileri || sol || sag || oto || (PTR.size === 1 && !pinch && mod === 'surus')) kazDur(); else { fren = true; kazAdim(dt); } }
  otoV = null;
  if (mod === 'oto' && oyunda && oto) {
    if (ileri || sol || sag || fren) { oto = null; if (rotaAktif) { rotaAktif = false; gpImza = ''; } duyur('🤖 ' + T('Otopilot bırakıldı', 'Autopilot released')); }
    else {
      const [tx, ty, dur] = otoPos(oto, t), dx = tx - SH.x, dy = ty - SH.y, d = Math.hypot(dx, dy) || 1, kal = d - dur, v0 = Math.hypot(SH.vx, SH.vy);
      if (kal < 40 && v0 < 90) { const ad = oto.p ? (oto.p.kol && KESIF.has('k:' + oto.p.id) ? kolAd(oto.p) : oto.p.ad) : oto.tm ? (oto.tm.ev ? 'Helios ⌂' : oto.tm.ad) : ''; duyur('🏁 ' + T('Vardın', 'Arrived') + (ad ? ': <b>' + esc(ad) + '</b>' : ''), 'kesif'); SES.tik(); if (wp && oto.tm && wp.k === oto.tm.k) wp = null; oto = null; SH.vx *= 0.3; SH.vy *= 0.3; if (rotaAktif) rotaVardi(); }
      else {
        let ux = dx / d, uy = dy / d; const ox = Math.floor(SH.x / SEK), oy = Math.floor(SH.y / SEK);
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const tm = temel(ox + i, oy + j); if (!tm || (oto.tm && oto.tm.k === tm.k && !YT[tm.yt].kd)) continue;
          const sx_ = tm.x - SH.x, sy_ = tm.y - SH.y, pr = sx_ * ux + sy_ * uy; if (pr <= 0 || pr > d) continue;
          const qx = sx_ - pr * ux, qy = sy_ - pr * uy, q = Math.hypot(qx, qy), Rav = YT[tm.yt].kd ? tm.yr * 14 : tm.yr * 2.2 + 200;
          if (q < Rav) { const nx = q > 1 ? -qx / q : -uy, ny = q > 1 ? -qy / q : ux, w = (Rav - q) / Rav * 1.6; ux += nx * w; uy += ny * w; const l = Math.hypot(ux, uy); ux /= l; uy /= l; }
        }
        otoV = { dx, dy, d, kal, ux, uy }; yonHedef = Math.atan2(uy, ux); if (oto.warp && (kal < 45000 || yakit <= 0)) oto.warp = false; warpTus = !!oto.warp; boost = !!oto.boost && kal > 2500; fren = false; guc = 0; }
    }
  }
  const donHiz = SH.warp > 0.5 ? 1.1 : 3.4;
  if (yonHedef != null) { let f = yonHedef - SH.a; f = Math.atan2(Math.sin(f), Math.cos(f)); SH.a += kis(f, -donHiz * 1.3 * dt, donHiz * 1.3 * dt); }
  SH.a += don * donHiz * dt;
  // warp şarjı
  if (warpTus && MODUL.warp < 40) { warpTus = false; if (performance.now() - (SH._wm || 0) > 5000) { SH._wm = performance.now(); duyur('🌀 ' + T('Warp çekirdeği hasarlı!', 'Warp core damaged!'), 'uyari', T('Önce onar: gemi yanındaki 🔧 düğmesi ya da bir koloni', 'Repair it first: the 🔧 button by the ship or a colony')); } }
  if (warpTus && yakit <= 0) { warpTus = false; if (!SH._yb) { SH._yb = 1; duyur('⛽ ' + T('Yakıt bitti: warp yapılamaz', 'Out of fuel: no warp'), 'uyari', T('Bir koloniye yanaşıp yakıt al. Normal uçuş yakıt harcamaz.', 'Dock at a colony to refuel. Normal flight uses no fuel.')); SES.uyari(); } }
  if (yakit > 0) SH._yb = 0;
  if (warpTus) { SH.sarj = Math.min(1, SH.sarj + dt / warpSure()); if (SH.sarj >= 1 && !SH._wd) { SH._wd = 1; duyur('🌀 Warp!', 'kesif'); } }
  else { SH.sarj = Math.max(0, SH.sarj - dt * 2.5); SH._wd = 0; }
  const warpHedef = warpTus && SH.sarj >= 1 ? 1 : 0;
  SH.warp += (warpHedef - SH.warp) * Math.min(1, dt * (warpHedef ? 0.9 : 2.2));
  if (SH.warp < 0.002) SH.warp = 0;
  const cx = Math.cos(SH.a), cy = Math.sin(SH.a);
  let v = Math.hypot(SH.vx, SH.vy);
  if (SH.warp > 0.02) {
    const hz = 1300 + SH.warp * warpHiz();
    SH.vx += (cx * hz - SH.vx) * Math.min(1, dt * 1.6); SH.vy += (cy * hz - SH.vy) * Math.min(1, dt * 1.6);
    SH.itki += (1 - SH.itki) * Math.min(1, dt * 6);
  } else if (otoV) {
    const vmax = (boost ? 3200 : 1300) * motorK(), vd = Math.min(vmax, Math.sqrt(2 * 1100 * Math.max(0, otoV.kal))), ux = otoV.ux, uy = otoV.uy;
    // önce gemi hedefe dönsün, sonra hızlansın
    let fa = Math.atan2(uy, ux) - SH.a; fa = Math.abs(Math.atan2(Math.sin(fa), Math.cos(fa)));
    const hiz = fa > 1.2 ? Math.min(vd, 150) : vd;
    const dvx = ux * hiz - SH.vx, dvy = uy * hiz - SH.vy, m = Math.hypot(dvx, dvy), amax = (boost ? 2600 : 1400) * motorK(), k = Math.min(1, amax * dt / (m || 1));
    SH.vx += dvx * k; SH.vy += dvy * k;
    SH.itki += (kis(m / 500, 0, 1) * (boost ? 1 : 0.75) - SH.itki) * Math.min(1, dt * 8);
  } else {
    const ivme = 950 * guc * (boost ? 2.6 : 1) * motorK();
    SH.vx += cx * ivme * dt; SH.vy += cy * ivme * dt;
    SH.itki += (guc * (boost ? 1 : 0.7) - SH.itki) * Math.min(1, dt * 8);
    v = Math.hypot(SH.vx, SH.vy);
    const vmax = (boost ? 3200 : 1300) * motorK();
    if (fren) { const k = Math.exp(-2.8 * dt); SH.vx *= k; SH.vy *= k; if (v < 6) SH.vx = SH.vy = 0; }
    else if (v > vmax) { const k = Math.max(vmax / v, Math.exp(-2 * dt)); SH.vx *= k; SH.vy *= k; }
    else if (guc === 0) { const k = Math.exp(-0.22 * dt); SH.vx *= k; SH.vy *= k; }
  }
  // çekim: kara delik ve yıldızlar
  const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const tm = temel(ssx + i, ssy + j); if (!tm) continue;
    const dx = tm.x - SH.x, dy = tm.y - SH.y, d = Math.hypot(dx, dy);
    if (YT[tm.yt].kd) {
      if (d < 9000 && d > 1) { const a = Math.min(4000, 1.1e8 / (d * d)); SH.vx += dx / d * a * dt; SH.vy += dy / d * a * dt; }
      if (d < tm.yr * 1.15 && oyunda) karaDelik(tm);
    } else if (d < tm.yr * 1.12 && d > 1) {
      SH.x = tm.x - dx / d * tm.yr * 1.12; SH.y = tm.y - dy / d * tm.yr * 1.12;
      const nx = -dx / d, ny = -dy / d, vn = SH.vx * nx + SH.vy * ny; if (vn < 0) { SH.vx -= 1.6 * vn * nx; SH.vy -= 1.6 * vn * ny; }
      if (!SH._sicak || t - SH._sicak > 4) { SH._sicak = t; hasar(10, false, true); duyur('🔥 ' + T('Yıldıza fazla yaklaştın!', 'Too close to the star!'), 'uyari'); SES.uyari(); }
    }
  }
  SH.x += SH.vx * dt; SH.y += SH.vy * dt;
  v = Math.hypot(SH.vx, SH.vy); yol += v * dt;
  if (SH.warp > 0.3) yakit = Math.max(0, yakit - v * dt / SEK * (1 - YUK.warp * 0.1) * (tek('s1') ? 0.9 : 1));
  tehlike(dt, t, v); kapsulAdim(dt);
  if (olumBekle) patla();
  kokpitGuncelle(dt, v);
  // kamera
  const zHedef = fotoMod ? kis(zKul, 0.01, 2.4) : kis(zKul / (dinKam ? 1 + v / 1700 : 1) / (1 + SH.warp * (dinKam ? 6 : 3)), 0.022, 2.4);
  cam.z *= Math.exp((Math.log(zHedef) - Math.log(cam.z)) * Math.min(1, dt * 3));
  if (fotoMod) { bg.x += 0; } else {
  const ox = cam.x, oy = cam.y, lead = dinKam ? 0.32 / (1 + SH.warp * 3) : 0, takip = dinKam ? 4.5 : 14;
  const hx = SH.x + SH.vx * lead, hy = SH.y + SH.vy * lead;
  cam.x += (hx - cam.x) * Math.min(1, dt * takip); cam.y += (hy - cam.y) * Math.min(1, dt * takip);
  if (Math.abs(cam.x - SH.x) * cam.z > W * 0.42) cam.x = SH.x + Math.sign(cam.x - SH.x) * W * 0.42 / cam.z;
  if (Math.abs(cam.y - SH.y) * cam.z > H * 0.42) cam.y = SH.y + Math.sign(cam.y - SH.y) * H * 0.42 / cam.z;
  bg.x += (cam.x - ox) * cam.z; bg.y += (cam.y - oy) * cam.z; }
  if (oyunda) ST.oyS = (ST.oyS || 0) + dt;
  // egzoz parçacıkları
  if (SH.itki > 0.05) {
    const n = SH.warp > 0.1 ? 3 : Math.ceil(SH.itki * 2.5);
    for (let i = 0; i < n; i++) { const yan = (Math.random() - 0.5) * 9, h = 0.7 + Math.random() * 0.6; PAR.push({ x: SH.x - cx * 15 - cy * yan, y: SH.y - cy * 15 + cx * yan, vx: SH.vx * 0.9 - cx * 260 * h + (Math.random() - 0.5) * 60, vy: SH.vy * 0.9 - cy * 260 * h + (Math.random() - 0.5) * 60, o: 0, w: 0.45 + Math.random() * 0.5, s: 2 + Math.random() * 3 * SH.itki, wp: SH.warp > 0.1 }); }
  }
  for (let i = PAR.length - 1; i >= 0; i--) { const p = PAR[i]; p.o += dt; if (p.o > p.w) { PAR.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; }
  if (PAR.length > 400) PAR.splice(0, PAR.length - 400);
  // toz
  const svx = SH.vx * cam.z, svy = SH.vy * cam.z;
  for (const d of TOZ) { d.x -= svx * dt * d.d * 0.55; d.y -= svy * dt * d.d * 0.55; d.x = ((d.x % (W + 60)) + W + 60) % (W + 60); d.y = ((d.y % (H + 60)) + H + 60) % (H + 60); }
  // keşif, radar, hud
  kesifT -= dt; if (kesifT <= 0) { kesifT = 0.25; kesifKontrol(t); }
  radarT -= dt; if (radarT <= 0) { radarT = 0.5; radarKur(); }
  hudT -= dt; if (hudT <= 0) { hudT = 0.16; hudYaz(v, t); }
  kayitT -= dt; if (kayitT <= 0) { kayitT = 4; kaydet(); }
  hedT = Math.max(0, hedT - dt); selT = Math.max(0, selT - dt);
  gorevT -= dt; if (gorevT <= 0) { gorevT = 1; if (KERVAN.length && oyunda) kervanAdim(); if (GOREV.length) gorevYaz(); SES.bolge(bolgeBul()); AG.tur(); }
  AG.gonder();
  miniT -= dt; if (miniT <= 0) { miniT = 0.1; miniCiz(); }
  SES.guncelle(oyunda ? SH.itki : 0, v, SH.warp);
}

function karaDelik(tm) {
  const r = rng(h32(Date.now() & 0xffffff, tm.sx, 13)), g = galaksi(...galHucre(SH.x, SH.y));
  const a = r() * TAU, d = r() * g.R * 0.8;
  SH.x = g.x + Math.cos(a) * d; SH.y = g.y + Math.sin(a) * d; SH.vx = Math.cos(a) * 400; SH.vy = Math.sin(a) * 400; SH.warp = 0; SH.sarj = 0;
  cam.x = SH.x; cam.y = SH.y; cam.z = 0.05;
  duyur('🕳 ' + T('Kara delik seni yuttu ve fırlattı!', 'The black hole swallowed you and flung you out!'), 'uyari', T('Bilinmeyen bir bölgedesin. Haritaya (M) bak.', 'You are somewhere unknown. Check the map (M).'));
  SES.uyari();
}

const KODUL = { g: 800, s: 40, p: 15, k: 40 };
const odYaz = o => o > 1 ? ` · <span style="color:var(--altin)">+${SAYI(o)} 💰</span>` : '';
function kesifEkle(k) { if (KESIF.has(k)) return 0; KESIF.add(k); kesifSayYaz(); bilimEkle({ g: 12, s: 2, p: 1, k: 2 }[k[0]] || 0); const o = KODUL[k[0]] || 0; kazan(o); gorevKesif(k); return o || 1; }
function galKesif(g, gk) { if (!KESIF.has('g:' + gk)) defter('🌌 ' + g.ad[0] + '’na ilk kez girdim.', '🌌 Entered ' + g.ad[1] + ' for the first time.'); const o = kesifEkle('g:' + gk); duyur('🌌 ' + esc(L(g.ad)), 'galaksi', (o ? T('Yeni galaksi keşfedildi', 'New galaxy discovered') : T('Galaksiye girdin', 'You entered the galaxy')) + (IRK[g.irk] ? ` · ${IRK[g.irk].e} ${T('Burada ' + IRK[g.irk].ad[0] + ' uygarlığı yaşıyor', 'Home of the ' + IRK[g.irk].ad[1] + ' civilisation')} (${L(IRK[g.irk].ne)})` : '') + odYaz(o)); if (o) SES.galaksi();  }
/* yalnızca gidilen yer keşfedilir: warp sırasında ya da hızla geçip giderken keşif sayılmaz */
const KESIF_V = 900; let kesifIpT = -1e9;
function kesifIpucu() { const n = performance.now(); if (n - kesifIpT < 600000) return; kesifIpT = n; duyur('🔭 ' + T('Hızla geçtiğin yerler keşif sayılmaz', 'Places you rush past are not discovered'), 'kesif', T('Bir sistemi ya da gezegeni keşfetmek için yanında yavaşla', 'Slow down near a system or planet to discover it')); }
function kesifKontrol(t) {
  if (!oyunda) return;
  const yavas = SH.warp < 0.05 && Math.hypot(SH.vx, SH.vy) < KESIF_V;
  const [gx, gy] = galHucre(SH.x, SH.y), g = galaksi(gx, gy), ic = Math.hypot(SH.x - g.x, SH.y - g.y) < g.R;
  const gk = ic ? g.k : null;
  if (gk !== sonGal) {
    if (gk && (sonGal !== undefined || !KESIF.has('g:' + gk))) { if (!KESIF.has('g:' + gk) && !yavas) duyur('🌌 ' + esc(L(g.ad)), 'galaksi', T('İçinden geçiyorsun · keşfetmek için galakside yavaşla', 'Passing through · slow down inside the galaxy to discover it')); else galKesif(g, gk); }
    else if (!gk && sonGal) duyur('✦ ' + T('Galaksiler arası boşluk', 'Intergalactic void'), 'galaksi', T('Burada yıldız çok seyrek', 'Stars are very sparse here'));
    sonGal = gk;
  } else if (gk && yavas && !KESIF.has('g:' + gk)) galKesif(g, gk);
  const nb = nebulaIc(SH.x, SH.y);
  if (nb !== nebSon) { if (nb) duyur('🌫 ' + T('Nebula: ', 'Nebula: ') + '<b>' + esc(nb.ad) + '</b>', 'galaksi', T('Görüş ve radar zayıf. Yavaşlarsan nadir nebula özü toplayabilirsin.', 'Low visibility and radar. Slow down to collect rare nebula essence.')); nebSon = nb; }
  hikKontrol(t);
  const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK), tk = taraK();
  ac(SH.x, SH.y, 1.9 + YUK.tara * 0.5);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const tm = temel(ssx + i, ssy + j); if (!tm) continue;
    const d = Math.hypot(tm.x - SH.x, tm.y - SH.y); if (d > 9500) continue;
    const s = sistem(tm.sx, tm.sy);
    if (d < s.R + 900 * tk && !yavas && !KESIF.has('s:' + tm.k)) kesifIpucu();
    if (d < s.R + 900 * tk && yavas) {
      const o = kesifEkle('s:' + tm.k); if (o && s.Y.kd) ST.kd++;
      if (o) AG.ilkKesif(tm.k).then(f => { if (f) setTimeout(() => { duyur('🏆 ' + T('Bu sistemi evrende ilk sen keşfettin!', 'You are the first in the universe to discover this system!'), 'galaksi', esc(tm.ad) + T(' · adın haritada kalacak', ' · your name stays on it')); SES.galaksi(); }, 1500); });
      if (o) { const kn = s.gez.length; duyur('✨ ' + T('Yeni yıldız sistemi: ', 'New star system: ') + '<b>' + esc(tm.ad) + '</b>', 'kesif', L(s.Y.ad) + (kn ? ' · ' + kn + T(' gezegen', kn > 1 ? ' planets' : ' planet') : '') + (s.kusak ? T(' · asteroit kuşağı', ' · asteroid belt') : '') + odYaz(o)); SES.kesif(); }
    }
    if (wp && wp.k === tm.k && d < s.R) { duyur('🏁 ' + T('Rotaya vardın: ', 'Arrived: ') + esc(tm.ad), 'kesif'); wp = null; }
    for (const p of s.gez) {
      const [px, py] = gezPos(p, t); const dp = Math.hypot(px - SH.x, py - SH.y);
      if (dp < p.r + 650 * tk && yavas) {
        const o = kesifEkle('p:' + p.id); if (!o) continue;
        if (p.kol) { const o2 = kesifEkle('k:' + p.id); duyur('🏙 ' + T('Koloni: ', 'Colony: ') + '<b>' + esc(kolAd(p)) + '</b>', 'koloni', esc(p.ad) + ' · ' + L(p.kol.tip) + ' · ' + nufYaz(p.kol.nuf) + T(' kişi', ' people') + odYaz(o + o2)); SES.koloni(); }
        else { duyur('🪐 ' + T('Gezegen keşfedildi: ', 'Planet discovered: ') + '<b>' + esc(p.ad) + '</b>', 'kesif', L(p.P.ad) + T(' gezegeni', ' planet') + (p.halka ? T(' · halkalı', ' · ringed') : '') + (p.ay.length ? ' · ' + p.ay.length + T(' uydu', p.ay.length > 1 ? ' moons' : ' moon') : '') + odYaz(o)); SES.kesif(); }
      }
    }
  }
}
function radarKur() {
  const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK), L2 = [];
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const tm = temel(ssx + i, ssy + j); if (!tm) continue; const d = Math.hypot(tm.x - SH.x, tm.y - SH.y); L2.push({ tm, d }); }
  L2.sort((a, b) => a.d - b.d); radar = L2.slice(0, 5 + YUK.tara);
}

/* ================= hud ================= */
function hizYaz(v) { if (v < ISIK) return [SAYI(Math.round(v * 1000 / 100) * 100), 'km/s']; return [SAYI(v / ISIK, v / ISIK < 10 ? 1 : 0), 'c']; }
/* yakındaki gök cismi kartı: diğer panellerin üstüne binmeyen ilk yere yerleşir */
let yakinYerT = 0, yakinAcik = !!ls.get('kozmos-yakin', false);
$('yakin').addEventListener('pointerdown', e => { if (!DOKUN) return; e.preventDefault(); e.stopPropagation(); yakinAcik = !yakinAcik; ls.set('kozmos-yakin', yakinAcik); $('yakin').classList.toggle('kisa', !yakinAcik); yakinYerT = 0; SES.tik(); });
function yakinYer(y) {
  const n = performance.now(); if (n - yakinYerT < 400) return; yakinYerT = n;
  const gor = e => e && !e.hidden && e.getClientRects().length && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
  const R = ['kokpit', 'mini', 'gosterge', 'rehber', 'gorevPanel', 'kont', 'ambarBtn', 'topBtn', 'gp', 'joy'].map($).filter(gor).map(e => e.getBoundingClientRect()).filter(r => r.width > 4 && r.height > 4);
  const W = innerWidth, H = innerHeight, w = y.offsetWidth, h = y.offsetHeight, ust = $('ust') ? $('ust').getBoundingClientRect().bottom + 6 : 56;
  const al = id => gor($(id)) ? $(id).getBoundingClientRect() : null, g = al('gosterge'), k = al('kokpit'), m = al('mini');
  const dok = document.body.classList.contains('dokun'), A = [];
  if (dok) { A.push([10, H - 112 - h]); if (g) A.push([10, g.top - 8 - h]); if (g && m) A.push([10, Math.min(g.top, m.top) - 8 - h]); { const j = al('joy'); if (j) A.push([10, Math.min(j.top, g ? g.top : H) - 8 - h]); } A.push([W - 10 - w, (m ? m.top : H - 200) - 8 - h]); }
  else { A.push([W - 10 - w, H - 200 - h]); if (k) A.push([W - 10 - w, k.bottom + 8]); if (m) A.push([W - 10 - w, m.top - 8 - h]); if (g) A.push([10, g.top - 8 - h]); if (k) A.push([k.left - 10 - w, H - 200 - h]); }
  A.push([(W - w) / 2, H - 10 - h]);
  const ort = ([x, t]) => { let s = 0; for (const r of R) { const ox = Math.min(x + w, r.right) - Math.max(x, r.left), oy = Math.min(t + h, r.bottom) - Math.max(t, r.top); if (ox > 0 && oy > 0) s += ox * oy; } if (t < ust) s += (ust - t) * w * 2; if (t + h > H) s += (t + h - H) * w * 2; if (x < 0 || x + w > W) s += 1e6; return s; };
  let en = A[0], enS = Infinity; for (const a of A) { const s = ort(a); if (s < enS - 1) { en = a; enS = s; } if (s === 0) break; }
  Object.assign(y.style, { left: Math.round(en[0]) + 'px', top: Math.round(en[1]) + 'px', right: 'auto', bottom: 'auto' });
}
function hudYaz(v, t) {
  $('ambarBtn').hidden = !oyunda;
  document.body.classList.toggle('fp', kokGor && oyunda && !fotoMod);
  const [a, b] = hizYaz(v), md = SH.warp > 0.3 ? '<span id="mod" class="warp">WARP</span>' : mod === 'oto' && oto ? '<span id="mod" class="oto">' + T('OTOPİLOT', 'AUTOPILOT') + '</span>' : boost && guc > 0 ? '<span id="mod" class="boost">BOOST</span>' : '';
  $('hizV').innerHTML = `${a}<small>${b}</small>${md}`;
  const [gx, gy] = galHucre(SH.x, SH.y), g = galaksi(gx, gy), ic = Math.hypot(SH.x - g.x, SH.y - g.y) < g.R;
  const on = AG.UZAK.size;
  $('konum').textContent = (on ? '🛰 ' + (on + 1) + T(' çevrimiçi · ', ' online · ') : '') + (ic ? L(g.ad) : T('Galaksiler arası boşluk', 'Intergalactic void')) + ' · ' + T('Sektör ', 'Sector ') + Math.floor(SH.x / SEK) + ' : ' + Math.floor(SH.y / SEK) + ' · ' + TAKVIM[gunOlay()].e + ' ' + L(TAKVIM[gunOlay()].ad) + (BOLGE ? ' · ' + FRA[BOLGE].e : '');
  $('warpBar').firstChild.style.width = (Math.max(SH.sarj, SH.warp) * 100).toFixed(0) + '%';
  const yz = Math.floor(yakit), kd = kargoDolu();
  $('ekon').innerHTML = `💰 ${SAYI(kredi)} · <span class="${yz < tank() * 0.15 ? 'az' : ''}">⛽ ${yz}/${tank()}</span> · 📦 ${kd}/${kapasite()} · <span class="can ${can < maxCan() * 0.3 ? 'az' : ''}">🛡 ${Math.ceil(can)}</span>`;
  // yakındaki gezegen / yıldız
  let en = null, ed = Infinity, enS = null;
  const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const tm = temel(ssx + i, ssy + j); if (!tm || !tm.tam) continue; const s = tm.tam;
    const ds = Math.hypot(tm.x - SH.x, tm.y - SH.y); if (ds < tm.yr * 6 + 400 && ds < ed) { ed = ds; en = null; enS = s; }
    for (const p of s.gez) { const [px, py] = gezPos(p, t), d = Math.hypot(px - SH.x, py - SH.y) - p.r; if (d < p.r * 2 + 1100 && d < ed) { ed = d; en = p; enS = s; } }
  }
  const yakinMi = en && ed < (en.halka ? en.r * (en.halka.dis - 1) : 0) + 500 && v < 450 && oyunda && !limanP;
  let kp = yakinMi && !en.kol && KESIF.has('p:' + en.id) ? en : null;
  if (!kp && oyunda && !limanP && v < 500) kp = yakinKuyruk(t);
  if (!kp && oyunda && !limanP && v < 350) kp = nebulaIc(SH.x, SH.y);
  kaynP = kp || null;
  kalintiP = yakinMi && en.kalinti && KESIF.has('p:' + en.id) && !KESIF.has('r:' + en.id) ? en : null;
  balinaP = null; if (oyunda && !limanP && v < 700) for (const b of yakinBalinalar(t)) if (!KESIF.has('w:' + b.id) && Math.hypot(b.x - SH.x, b.y - SH.y) < 1100) { balinaP = b; break; }
  enkazP = oyunda && !limanP && v < 550 ? OLAY.find(o => o.tip === 'enkaz' && Math.hypot(o.x - SH.x, o.y - SH.y) < (takili('cekici') ? 950 * (1 + 0.3 * (tlv('cekici') - 1)) : 340)) || null : null;
  imdatP = oyunda && !limanP ? GOREV.find(g => g.tip === 'imdat' && Math.hypot(g.x - SH.x, g.y - SH.y) < 450) || null : null;
  if (kazP && kazP !== kaynP) kazDur();
  yanasP = oyunda && !limanP && en && en.kol && KESIF.has('k:' + en.id) && ed < (en.halka ? en.r * (en.halka.dis - 1) : 0) + 500 && v < 450 ? en : null;
  gpYaz();
  const y = $('yakin');
  if (!oyunda || (!en && !enS)) { y.hidden = true; return; }
  y.hidden = false; y.classList.toggle('kisa', DOKUN && !yakinAcik); yakinYer(y);
  if (en) {
    const p = en, bilinen = KESIF.has('p:' + p.id), kols = p.kol ? `<div class="kol">🏙 <b style="display:inline;font-size:14px">${esc(kolAd(p))}</b> — ${L(p.kol.tip)}<br>👥 ${nufYaz(p.kol.nuf)}${T(' kişi', ' people')}${p.kol.ist ? T(' · yörünge istasyonu', ' · orbital station') : ''}</div>` : '';
    y.innerHTML = `<b>${esc(p.ad)}</b><div class="tur">${L(p.P.ad)}${T(' gezegeni', ' planet')} · ${esc(p.s.t.ad)}${T(' sistemi', ' system')}</div><div class="sat">${T('Yarıçap', 'Radius')} ${SAYI(Math.round(p.r * p.P.km / 100) * 100)} km${p.ay.length ? ' · ' + p.ay.length + T(' uydu', p.ay.length > 1 ? ' moons' : ' moon') : ''}${p.halka ? T(' · halkalı', ' · ringed') : ''} · ${mesafeYaz(Math.max(0, ed))}</div>${kols}${bilinen && p.kalinti ? `<div class="sat" style="color:#E8D3A6">🏛 ${KESIF.has('r:' + p.id) ? T('Antik kalıntı (çözüldü)', 'Ancient ruins (solved)') : T('Antik kalıntı var! Yaklaşıp incele', 'Ancient ruins! Get close to investigate')}</div>` : ''}${bilinen && !p.kol ? `<div class="sat" style="color:#FFD9A6">⛏ ${T('Koloni yok · kaynak', 'No colony · resource')}: ${MAL[KAYN[p.tip]].e} ${L(MAL[KAYN[p.tip]].ad)}${ed > 500 ? T(' — toplamak için yaklaş', ' — get closer to mine') : ''}</div>` : ''}${bilinen ? '' : `<div class="sat yeni">${T('Yaklaş: keşfedilmedi', 'Get closer: not discovered')}</div>`}`;
  } else {
    const s = enS, kn = s.gez.filter(p => p.kol && KESIF.has('k:' + p.id)).length;
    y.innerHTML = `<b>${esc(s.t.ad)}</b><div class="tur">${L(s.Y.ad)}${s.t.ev ? T(' · ana üs', ' · home') : ''}</div><div class="sat">${s.gez.length} ${T('gezegen', s.gez.length === 1 ? 'planet' : 'planets')}${s.kusak ? T(' · asteroit kuşağı', ' · asteroid belt') : ''}${kn ? ' · 🏙 ' + kn : ''}</div>${s.Y.kd ? `<div class="sat" style="color:var(--kirmizi)">⚠ ${T('Güçlü çekim alanı', 'Strong gravity')}</div>` : ''}${KESIF.has('s:' + s.t.k) && AG.ilkAd(s.t.k) ? `<div class="sat" style="color:var(--altin)">🏆 ${T('İlk keşfeden', 'First discovered by')}: <b>${esc(AG.ilkAd(s.t.k))}</b></div>` : ''}`;
  }
}
function kesifSayYaz() { let s = 0; for (const k of KESIF) if (k[0] === 's') s++; $('kesifSay').textContent = SAYI(s); }

