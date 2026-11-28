/* ================= ambar ve arşiv penceresi ================= */
let amSek = 'ambar', arsSec = null;
function ambarAc(sek) { amSek = sek || amSek; ambarYaz(); $('ambar').hidden = false; SES.tik(); }
function ambarKapat() { $('ambar').hidden = true; SES.tik(); }
function ambarYaz() {
  let h = `<h2 style="margin:0 0 6px;font-size:21px;font-weight:900">${amSek === 'ambar' ? '📦 ' + T('Ambar', 'Cargo hold') : amSek === 'bilim' ? '🔬 ' + T('Araştırma', 'Research') : amSek === 'kod' ? '📖 ' + T('Kodeks', 'Codex') : '🗃 ' + T('Arşiv', 'Archive')}</h2><div class="sekme">${[['ambar', T('📦 Ambar', '📦 Hold')], ['arsiv', T('🗃 Arşiv', '🗃 Archive') + ` (${ARSIV.size}/30)`], ['bilim', T('🔬 Araştırma', '🔬 Research')], ['kod', T('📖 Kodeks', '📖 Codex') + ` (${KOD.size}/${Object.keys(KODX).length})`]].map(([k, a]) => `<button type="button" data-am="${k}" class="${amSek === k ? 'on' : ''}">${a}</button>`).join('')}</div>`;
  if (amSek === 'kod') h += kodeksYaz();
  else if (amSek === 'bilim') { ST.rBilim = 1; h += bilimYaz(); }
  else if (amSek === 'ambar') {
    const dolu = kargoDolu(), kap = kapasite(), deger = Object.entries(KARGO).reduce((a, [m, n]) => a + n * MAL[m].f, 0), gy = GOREV.filter(g => g.yuk);
    h += `<div style="margin:6px 0 2px;display:flex;justify-content:space-between;font-size:13px;font-weight:900"><span>${T('Doluluk', 'Load')}: ${dolu}/${kap}</span><span style="color:var(--altin)">≈ ${SAYI(deger)} 💰</span></div><div style="height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${kap ? Math.min(100, dolu / kap * 100) : 0}%;background:${dolu >= kap ? '#FFC857' : '#7FE3FF'}"></i></div>`;
    if (kapsul) h += `<div class="alt" style="margin:8px 0 0">🫁 ${T('Kapsülde ambar yok.', 'The pod has no hold.')}</div>`;
    const L2 = Object.entries(KARGO).filter(([, n]) => n > 0).sort((a, b) => b[1] * MAL[b[0]].f - a[1] * MAL[a[0]].f);
    h += `<div class="alt" style="margin:10px 0 0;font-weight:900;color:var(--ink)">${T('Kargo', 'Cargo')}</div>`;
    h += L2.length ? L2.map(([m, n]) => `<div class="satir"><div>${MAL[m].e} <b>${n} × ${L(MAL[m].ad)}</b>${KACAK.includes(m) ? ' <span class="lv" style="color:#FF9AA6">' + T('kaçak', 'contraband') + '</span>' : ''}<small>${T('taban fiyat', 'base price')} ${SAYI(MAL[m].f)} 💰 · ${T('toplam', 'total')} ≈ ${SAYI(n * MAL[m].f)} 💰</small></div><div class="dg"><button class="kb" type="button" data-at="${m}" data-n="1">${T('1 at', 'Drop 1')}</button><button class="kb" type="button" data-at="${m}" data-n="${n}">${T('Hepsini at', 'Drop all')}</button></div></div>`).join('') : `<div class="alt">${T('Ambar boş. Gezegenlerden kaynak topla, kolonilerden mal al ya da uzayda süzülen hurdaları yakala.', 'The hold is empty. Mine planets, buy goods at colonies or catch salvage drifting in space.')}</div>`;
    if (gy.length) { h += `<div class="alt" style="margin:10px 0 0;font-weight:900;color:var(--ink)">📋 ${T('Görev yükleri', 'Mission cargo')}</div>`; h += gy.map(g => `<div class="satir"><div>${gEm(g)} <b>${g.yuk} ${T('birim', 'units')}</b><small>→ ${esc(g.ad)}</small></div></div>`).join(''); }
    const sl = Object.keys(SARF).filter(k => SARF[k] > 0);
    h += `<div class="alt" style="margin:10px 0 0;font-weight:900;color:var(--ink)">🎒 ${T('Cep (tek kullanımlık)', 'Pocket (consumables)')}</div>`;
    h += sl.length ? sl.map(k => `<div class="satir"><div>${SARFE[k].e} <b>${SARF[k]} × ${L(SARFE[k].ad)}</b><small>${L(SARFE[k].ne)}</small></div><div class="dg"><button class="kb al" type="button" data-sk="${k}">${T('Kullan', 'Use')} (${SARFE[k].tus})</button></div></div>`).join('') : `<div class="alt">${T('Cebin boş. Üretim sekmesinden yapabilirsin.', 'Your pocket is empty. Craft some in the Crafting tab.')}</div>`;
    const tk = TAK.map(k => TEC[k].e + ' ' + L(TEC[k].ad) + MK[tlv(k)]).join(' · '), ky = Object.values(KIY).filter(Boolean).map(k => KIYE[k].e + ' ' + L(KIYE[k].ad)).join(' · ');
    h += `<div class="alt" style="margin:10px 0 0;font-size:12.5px">🛠 ${tk || T('Takılı teçhizat yok', 'No equipment fitted')}<br>🧑‍🚀 ${ky || T('Kıyafet parçası giyilmemiş', 'No suit parts worn')}</div>`;
    h += `<div class="alt" style="margin:8px 0 0;font-size:12px">🛰 ${T('Uzayda süzülen hurdaların yanından geçince toplanırlar; çekici ışın onları uzaktan da çeker.', 'Drifting salvage is picked up as you fly past; the tractor beam pulls it in from afar.')} ${T('Toplanan', 'Collected')}: ${ST.hurda || 0}</div>`;
  } else {
    h += `<div class="alt" style="margin:4px 0 0">${T('Uzayda bulduğun eserler burada saklanır. Bir koleksiyonu tamamlayınca kalıcı bir bonus kazanırsın.', 'Artefacts you find in space are kept here. Complete a collection for a permanent bonus.')}</div>`;
    for (const k in ARS_KOL) {
      const K0 = ARS_KOL[k], n = ARS_ID[k].filter(i => ARSIV.has(i)).length, tam = n === 6;
      h += `<div class="arsKol"><h3><span>${K0.e} ${L(K0.ad)}</span><small>${n}/6</small></h3><div style="font-size:11.5px;color:${tam ? '#9BE07A' : 'var(--mute)'};margin:2px 0 0">${tam ? '✓ ' : '🎁 '}${L(K0.bonus)}${tam ? '' : ' · 🔎 ' + L(K0.ip)}</div><div class="arsIzg">`;
      for (const i of ARS_ID[k]) { const A = ARS[i], var_ = ARSIV.has(i); h += `<button type="button" class="arsK ${var_ ? '' : 'yok'} ${A[1] === 2 ? 'nadir' : A[1] === 3 ? 'efs' : ''} ${arsSec === i ? 'sec' : ''}" data-ars="${i}"><b>${var_ ? A[0] : '❔'}</b>${var_ ? esc(L(A[2])) : '???'}</button>`; }
      h += `</div>`;
      if (arsSec && ARS_ID[k].includes(arsSec)) { const A = ARS[arsSec], var_ = ARSIV.has(arsSec); h += `<div class="arsBil">${var_ ? `<b>${A[0]} ${esc(L(A[2]))}</b> <span class="lv">${NADIRLIK[A[1]]}</span><br>${esc(L(A[3]))}` : `❔ ${T('Henüz bulunmadı.', 'Not found yet.')} ${NADIRLIK[A[1]]} · 🔎 ${L(K0.ip)}`}</div>`; }
      h += `</div>`;
    }
  }
  $('amIc').innerHTML = h;
}
$('ambarBtn').onclick = () => ambarAc();
$('ambar').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.id === 'amKapat') { ambarKapat(); return; }
  if (b.dataset.am) { if ({ bilim: 1, kod: 1 }[b.dataset.am] && kilitli(b.dataset.am)) return; amSek = b.dataset.am; SES.tik(); }
  else if (b.dataset.ars) { arsSec = arsSec === b.dataset.ars ? null : b.dataset.ars; SES.tik(); }
  else if (b.dataset.tek) { const k = b.dataset.tek, T0 = TEK[k]; if (!tek(k) && tekAcik(k) && (ST.bilim || 0) >= T0.f) { ST.bilim -= T0.f; TEKNO.add(k); SES.galaksi(); duyur('🔬 ' + T('Araştırma tamamlandı: ', 'Research complete: ') + '<b>' + T0.e + ' ' + L(T0.ad) + '</b>', 'galaksi', L(T0.ne)); defter('🔬 ' + T0.ad[0] + ' araştırmasını tamamladım.', '🔬 Finished researching ' + T0.ad[1] + '.'); basarimKontrol(); kaydet(); } }
  else if (b.dataset.at) { const m = b.dataset.at, n = Math.min(+b.dataset.n, KARGO[m] || 0); if (n > 0) { KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; const a = SH.a + Math.PI + (Math.random() - 0.5); if (oyunda && !limanP) { hurdaCikar(SH.x + Math.cos(a) * 160, SH.y + Math.sin(a) * 160, 'konteyner', { [m]: n }); const q = HURDA[HURDA.length - 1]; q.vx = SH.vx + Math.cos(a) * 60; q.vy = SH.vy + Math.sin(a) * 60; q.t0 = performance.now(); q.bek = 4; } SES.tik(); duyur('🗑 ' + T('Uzaya atıldı', 'Jettisoned') + `: ${n} × ${L(MAL[m].ad)}`, 'kesif'); kaydet(); } }
  else if (b.dataset.sk) { const k = b.dataset.sk; ambarKapat(); sarfKullan(k); return; }
  ambarYaz();
});
/* ================= sağ tık: hızlı hedef menüsü ================= */
let uzunBas = 0, SAGL = [];
function sagHedefler(px, py) {
  const L2 = [], t = simT(), sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK), mz = (x, y) => Math.hypot(x - SH.x, y - SH.y);
  const ekle = (bolum, e, ad, x, y, h) => L2.push({ bolum, e, ad, d: mz(x, y), x, y, h });
  // buraya git
  { const wx = cam.x + (px - W / 2) / cam.z, wy = cam.y + (py - H / 2) / cam.z; ekle('nokta', '📍', T('Buraya git', 'Go here'), wx, wy, { x: wx, y: wy, dur: 0, ad: T('İşaretli nokta', 'Marked point') }); }
  if (AG.durum() === 'acik' && !kapsul) L2.push({ bolum: 'nokta', e: '📮', ad: T('Bulunduğun yere iz bırak (B)', 'Leave a beacon where you are (B)'), d: 0, x: SH.x, y: SH.y, izb: true });
  // koloniler
  const kol = koloniBul(sx, sy, 5).map(q => { const [x, y] = gezPos(q, t); return { q, x, y, d: mz(x, y) }; }).sort((a, b) => a.d - b.d).slice(0, 5);
  for (const o of kol) ekle('kol', yabanciMi(o.q) ? IRK[o.q.kol.irk].e : kkBul(o.q) ? '⚑' : '🏙', kolAd(o.q), o.x, o.y, { p: o.q, ad: kolAd(o.q) });
  // görevler
  GOREV.forEach(g => { const h = gorevHedef(g); if (!h) return; const [x, y] = otoPos(h, t); ekle('gorev', gEm(g), g.ad, x, y, Object.assign({}, h, { ad: g.ad })); });
  // önemli yerler
  { const [bx, by] = bankaPos(); ekle('yer', '🏦', T('Merkez Bankası', 'Central Bank'), bx, by, { x: bx, y: by, dur: 300, ad: T('Merkez Bankası', 'Central Bank') }); }
  const G = galaksi(...galHucre(SH.x, SH.y));
  { const [x, y] = istPos(G); ekle('yer', '🛰', istAd(G), x, y, { x, y, dur: 400, ad: istAd(G) }); }
  { const [x, y] = korsanLimanPos(G); ekle('yer', '☠', T('Korsan limanı', 'Pirate haven'), x, y, { x, y, dur: 400, ad: T('Korsan limanı', 'Pirate haven') }); }
  { const [x, y] = mezarPos(G); ekle('yer', '⚓', T('Gemi mezarlığı', 'Ship graveyard'), x, y, { x, y, dur: 600, ad: T('Gemi mezarlığı', 'Ship graveyard') }); }
  if (HIK.kapi) { const [x, y] = kapiPos(G); ekle('yer', '⛩', T('Kapı', 'Gate'), x, y, { x, y, dur: 500, ad: T('Kapı', 'Gate') }); }
  { const B = benLonca(); if (B) ekle('yer', '🏰', B.ad, B.x, B.y, { x: B.x, y: B.y, dur: 400, ad: B.ad }); }
  { const [gx, gy] = galHucre(SH.x, SH.y); let en = null, ed = Infinity; for (const k of skListe(gx, gy)) { const d = Math.hypot(k.x - SH.x, k.y - SH.y); if (d < ed) { ed = d; en = k; } } if (en) { const bil = KESIF.has('~sk:' + en.id), es = skEs(en); ekle('yer', '🌀', bil ? T('Geçit', 'Gate') + ' → ' + L(galaksi(es.gx, es.gy).ad) : T('Kararlı solucan deliği sinyali', 'Stable wormhole signal'), en.x, en.y, { x: en.x, y: en.y, dur: 300, ad: T('Kararlı solucan deliği', 'Stable wormhole') }); } }
  if (KOL) { const q = zGez(KOL.z); if (q) { const [x, y] = gezPos(q, t); ekle('yer', '🏠', KOL.ad, x, y, { p: q, ad: KOL.ad }); } }
  for (const P of prkListe()) ekle('yer', '🏁', P.ad, P.x0, P.y0, { x: P.x0, y: P.y0, dur: 250, ad: P.ad });
  if (!KOLOS.yenildi) { const [x, y] = kolosPos(); ekle('yer', '👹', T('Kolos (haftalık boss)', 'Colossus (weekly boss)'), x, y, { x, y, dur: 2500, ad: T('Kolos', 'Colossus') }); }
  if (istnObj) ekle('yer', '🏗', istnObj.ad, istnObj.x, istnObj.y, { x: istnObj.x, y: istnObj.y, dur: 400, ad: istnObj.ad });
  else if (!kapsul) { const wx = cam.x + (px - W / 2) / cam.z, wy = cam.y + (py - H / 2) / cam.z; L2.push({ bolum: 'yer', e: '🏗', ad: T('İstasyon kur (buraya)', 'Build a station (here)') + ` · ${SAYI(ISTN_F)} 💰`, d: mz(wx, wy), x: wx, y: wy, kur: true }); }
  // karakollar
  KARAKOL.map(k => { const s2 = sistem(k.hs[0], k.hs[1]), q = s2 && s2.gez[k.hs[2]]; if (!q) return null; const [x, y] = gezPos(q, t); return { k, q, x, y, d: mz(x, y) }; }).filter(Boolean).sort((a, b) => a.d - b.d).slice(0, 3).forEach(o => ekle('kara', o.k.koloni ? '🏙' : '⚑', (o.k.koloni ? o.k.koloni.ad : q2Ad(o.q)) + ' · ' + T('Sv ', 'Lv ') + o.k.sv, o.x, o.y, { p: o.q, ad: q2Ad(o.q) }));
  // keşif
  { let en = null, ed = Infinity; for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) { const tm = temel(sx + i, sy + j); if (!tm || KESIF.has('s:' + tm.k)) continue; const d = mz(tm.x, tm.y); if (d < ed) { ed = d; en = tm; } } if (en) ekle('kesif', '✨', T('Keşfedilmemiş sistem', 'Unexplored system'), en.x, en.y, { tm: en, ad: T('Keşfedilmemiş sistem', 'Unexplored system') }); }
  { const q = kalintiBul(); if (q) { const [x, y] = gezPos(q, t); ekle('kesif', '🏛', q.ad + ' · ' + T('kalıntı', 'ruins'), x, y, { p: q, ad: q.ad }); } }
  { const o = OLAY.filter(o => o.tip === 'enkaz').sort((a, b) => mz(a.x, a.y) - mz(b.x, b.y))[0]; if (o) ekle('kesif', '📦', o.ben ? T('Eski geminin enkazı', 'Your old wreck') : T('Enkaz', 'Wreck'), o.x, o.y, { x: o.x, y: o.y, dur: 60, ad: T('Enkaz', 'Wreck') }); }
  { const o = HURDA.slice().sort((a, b) => mz(a.x, a.y) - mz(b.x, b.y))[0]; if (o) ekle('kesif', HURT[o.tip].e, L(HURT[o.tip].ad), o.x, o.y, { x: o.x, y: o.y, dur: 0, ad: L(HURT[o.tip].ad) }); }
  { const o = OLAY.find(o => o.tip === 'solucan'); if (o) ekle('kesif', '🌀', T('Solucan deliği', 'Wormhole'), o.x, o.y, { x: o.x, y: o.y, dur: 0, ad: T('Solucan deliği', 'Wormhole') }); }
  { const o = OLAY.find(o => o.tip === 'snb' && o.n > 0); if (o) ekle('kesif', '✨', T('Süpernova bulutu', 'Supernova cloud'), o.x, o.y, { x: o.x, y: o.y, dur: 1500, ad: T('Süpernova bulutu', 'Supernova cloud') }); }
  return L2;
}
const q2Ad = q => q.ad || '?';
function sagAc(px, py) {
  if (!oyunda) return; SAGL = sagHedefler(px, py);
  const BAS = { nokta: '', kol: T('🏙 En yakın koloniler', '🏙 Nearest colonies'), gorev: T('📋 Görevlerin', '📋 Your missions'), yer: T('📌 Önemli yerler', '📌 Key places'), kara: T('⚑ Karakolların', '⚑ Your outposts'), kesif: T('🔭 Keşif', '🔭 Exploration') };
  let h = '', son = '';
  SAGL.forEach((o, i) => { if (o.bolum !== son) { son = o.bolum; if (BAS[son]) h += `<h4>${BAS[son]}</h4>`; } h += `<button type="button" role="menuitem" data-sag="${i}"><i>${o.e}</i><span>${esc(o.ad)}</span><small>${mesafeYaz(o.d)}</small></button>`; });
  const m = $('sagMenu'); m.innerHTML = h; m.hidden = false;
  const r = m.getBoundingClientRect(), x = Math.min(px, innerWidth - r.width - 8), y = Math.min(py, innerHeight - r.height - 8);
  m.style.left = Math.max(8, x) + 'px'; m.style.top = Math.max(8, y) + 'px'; SES.tik();
  const ilk = m.querySelector('button'); if (ilk && !DOKUN) ilk.focus({ preventScroll: true });
}
function sagKapat() { $('sagMenu').hidden = true; }
function hedefGit(o) {
  const h = o.h; if (mod !== 'oto') { mod = 'oto'; ls.set('kozmos-mod', mod); modYaz(); }
  const tm = h.tm || (h.p && h.p.s.t); oto = h; wp = tm && !h.p ? { x: tm.x, y: tm.y, k: tm.k, ad: o.ad } : h.p ? { x: h.p.s.t.x, y: h.p.s.t.y, k: h.p.s.t.k, ad: o.ad } : { x: o.x, y: o.y, k: '', ad: o.ad };
  duyur('🤖 ' + T('Otopilot: ', 'Autopilot: ') + '<b>' + esc(o.ad) + '</b>', 'kesif', mesafeYaz(o.d) + (o.d > 6 * SEK ? T(' · uzak: gemi yanındaki warp düğmesini kullan', ' · far: use the warp button by the ship') : ''));
  SES.tik(); gpImza = ''; kaydet();
}
$('sagMenu').addEventListener('click', e => { const b = e.target.closest('[data-sag]'); if (!b) return; const o = SAGL[+b.dataset.sag]; sagKapat(); if (o && o.izb) izPen(); else if (o && o.kur) { if (!kilitli('istn')) istnKur(o.x, o.y); } else if (o) hedefGit(o); });
$('sagMenu').addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerdown', e => { if (!$('sagMenu').hidden && !e.target.closest('#sagMenu') && e.target !== cv) sagKapat(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('sagMenu').hidden) { sagKapat(); e.stopPropagation(); } }, true);
cv.addEventListener('wheel', () => { if (!$('sagMenu').hidden) sagKapat(); }, { passive: true });
/* ================= topluluk: sohbet, lonca, pilot pazarı ================= */
const SOH = [], LON = new Map(), PAZ = []; let tpSek = 'soh', sohKanal = 'hep', sohOkun = 0, sohSon = 0;
$('topBtn').hidden = false;
const benLonca = () => ST.lonca && LON.get(ST.lonca) || null;
const lSv = L0 => Math.min(5, 1 + Math.floor(Math.log2((L0.p || 0) / 5000 + 1)));
const lUye = L0 => Object.keys(L0.u || {}).length;
const LON_F = 10000;
function sohGeldi(ben) { if (!ben && ($('topluluk').hidden || tpSek !== 'soh')) { sohOkun++; topRozet(); } if (!$('topluluk').hidden && tpSek === 'soh') sohYaz(); }
function topRozet() { $('topBtn').innerHTML = '💬' + (sohOkun ? `<i>${sohOkun > 9 ? '9+' : sohOkun}</i>` : ''); }
function tpAc(sek) { tpSek = sek || tpSek; if (tpSek === 'soh') { sohOkun = 0; topRozet(); } if (tpSek === 'lon') AG.lOku(tpYaz); if (tpSek === 'paz') AG.pOku(tpYaz); tpYaz(); $('topluluk').hidden = false; SES.tik(); }
function tpKapat() { $('topluluk').hidden = true; SES.tik(); }
const dokluMu = () => !!(limanP || istAcik || bankaAcik || lonYakin());
function lonPos(L0) { return [L0.x, L0.y]; }
function lonYakin() { for (const [, L0] of LON) if (Math.hypot(L0.x - SH.x, L0.y - SH.y) < 650) return L0; return null; }
function sohYaz() {
  const el = $('tpSoh'); if (!el) return; const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK);
  const L2 = SOH.filter(m => sohKanal === 'hep' || Math.hypot((m.x || 0) - sx, (m.y || 0) - sy) <= 6);
  el.innerHTML = L2.length ? L2.map(m => `<div class="${m.ben ? 'ben' : ''}"><b>${esc(String(m.n || '?').slice(0, 20))}</b><small>${m.t ? new Date(m.t).toLocaleTimeString(EN() ? 'en-GB' : 'tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</small><br>${esc(m.m)}</div>`).join('') : `<div style="color:var(--mute)">${sohKanal === 'hep' ? T('Henüz mesaj yok — ilk sen yaz!', 'No messages yet — say hi!') : T('Yakınında (6 sektör) yazan yok.', 'Nobody nearby (6 sectors) has written.')}</div>`;
  el.scrollTop = el.scrollHeight;
}
function tpYaz() {
  const ac = AG.durum() === 'acik';
  let h = `<h2 style="margin:0 0 6px;font-size:21px;font-weight:900">🌐 ${T('Topluluk', 'Community')}</h2><div class="sekme">${[['gaz', T('📰 Gazete', '📰 News')], ['soh', T('💬 Sohbet', '💬 Chat')], ['lon', T('🏰 Lonca', '🏰 Guild')], ['paz', T('🤝 Pilot pazarı', '🤝 Pilot market')], ['kol', T('👹 Kolos', '👹 Colossus')], ['yar', T('🏁 Yarış', '🏁 Racing')], ['gal', T('📸 Galeri', '📸 Gallery')]].map(([k, a]) => `<button type="button" data-tp="${k}" class="${tpSek === k ? 'on' : ''}">${a}</button>`).join('')}</div>`;
  if (tpSek === 'gaz') { h += gazeteHtml(); $('tpIc').innerHTML = h; gazeteYukle(); return; }
  if (tpSek === 'yar') { h += yarisHtml(); $('tpIc').innerHTML = h; yarisSiraYukle(); return; }
  if (tpSek === 'gal') { h += galeriHtml(); $('tpIc').innerHTML = h; galeriYukle(); return; }
  if (tpSek === 'kol') { h += kolosHtml(); $('tpIc').innerHTML = h; if (ac) AG.bossSira(KOLOS.hafta).then(L2 => { const el = $('kolSira'); if (el && L2) el.innerHTML = L2.length ? L2.map((r, i) => `<div style="display:flex;justify-content:space-between;margin:3px 0;font-size:13px${r.id === AG.uid() ? ';color:var(--altin);font-weight:900' : ''}"><span>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1 + '.'} ${esc(String(r.n || '?').slice(0, 20))}</span><b>${SAYI(Math.round(r.d || 0))}</b></div>`).join('') : `<div class="alt">${T('Henüz kimse vurmadı — ilk sen ol!', 'Nobody has hit it yet — be the first!')}</div>`; }); return; }
  if (!ac) { h += `<div class="alt">${AG.durum() === 'baglaniyor' ? T('Bağlanıyor…', 'Connecting…') : T('Çevrimiçi bağlantı kurulamadı.', 'Could not connect online.')}</div>`; $('tpIc').innerHTML = h; return; }
  if (tpSek === 'soh') {
    h += `<div class="sekme" style="margin:4px 0">${[['hep', T('🌌 Herkes', '🌌 Everyone')], ['yak', T('📡 Yakındakiler', '📡 Nearby')]].map(([k, a]) => `<button type="button" data-kanal="${k}" class="${sohKanal === k ? 'on' : ''}">${a}</button>`).join('')}</div><div class="sohList" id="tpSoh"></div><div class="sohGir"><input id="sohIn" maxlength="140" placeholder="${T('Mesaj yaz…', 'Write a message…')}" autocomplete="off"><button class="kb al" type="button" id="sohYolla">${T('Gönder', 'Send')}</button></div><div class="alt" style="font-size:11.5px;margin:6px 0 0">${T('Saygılı ol: kişisel bilgi paylaşma. Mesajlar 24 saat görünür.', 'Be kind and keep personal info private. Messages are visible for 24 hours.')}</div>`;
    $('tpIc').innerHTML = h; sohYaz(); return;
  }
  if (tpSek === 'lon') {
    const B = benLonca();
    if (B) {
      const sv = lSv(B), sonr = 5000 * (Math.pow(2, sv) - 1), d = Math.hypot(B.x - SH.x, B.y - SH.y), yak = d < 650;
      h += `<div class="satir"><div>🏰 <b>${esc(B.ad)}</b> <span class="lv">${T('Seviye', 'Level')} ${sv}</span><small>👥 ${lUye(B)} · ⭐ ${SAYI(B.p || 0)}${sv < 5 ? ' / ' + SAYI(sonr) : ''} · ${mesafeYaz(d)}</small><small>${Object.values(B.u || {}).map(n => esc(String(n).slice(0, 20))).join(', ')}</small></div><div class="dg"><button class="kb" type="button" data-lgit>${T('Üsse git', 'Go to base')}</button><button class="kb" type="button" data-layril>${T('Ayrıl', 'Leave')}</button></div></div>`;
      h += `<div class="alt" style="font-size:12px;margin:4px 0">${T('Üs avantajları: Sv 2 ücretsiz yakıt · Sv 3 ücretsiz onarım · Sv 4 kargoyu tam fiyata sat · Sv 5 tüm üyelerin kazancı +%10.', 'Base perks: Lv 2 free fuel · Lv 3 free repairs · Lv 4 sell cargo at full price · Lv 5 all members earn +10%.')}</div>`;
      h += `<div class="satir"><div>🎁 <b>${T('Bağış yap', 'Donate')}</b><small>${T('Kredi 1:1 puan; ambardaki mallar taban fiyatı kadar puan', 'Credits count 1:1; cargo counts at its base price')}</small></div><div class="dg">${[1000, 5000, 20000].map(n => `<button class="kb al" type="button" data-lbag="${n}" ${kredi < n ? 'disabled' : ''}>${SAYI(n)} 💰</button>`).join('')}${Object.keys(KARGO).length ? `<button class="kb al" type="button" data-lbagk ${yak ? '' : 'disabled'}>📦 ${T('Kargoyu bağışla', 'Donate cargo')}</button>` : ''}</div></div>`;
      if (yak) {
        const eksik = Math.ceil(tank() - yakit), onar = Math.ceil(maxCan() - can);
        h += `<div class="alt" style="margin:8px 0 0;font-weight:900;color:var(--ink)">🛠 ${T('Üs hizmetleri', 'Base services')}</div><div class="dg" style="margin-top:6px">${!kapsul && sv >= 2 && eksik > 0 ? `<button class="kb al" type="button" data-lhiz="yakit">⛽ ${T('Ücretsiz yakıt', 'Free fuel')}</button>` : ''}${sv >= 3 && onar > 0 ? `<button class="kb al" type="button" data-lhiz="onar">🔧 ${T('Ücretsiz onarım', 'Free repair')}</button>` : ''}${sv >= 4 && Object.keys(KARGO).some(m => !KACAK.includes(m)) ? `<button class="kb al" type="button" data-lhiz="sat">📦 ${T('Kargoyu tam fiyata sat', 'Sell cargo at full price')}</button>` : ''}</div>`;
      }
    } else {
      h += `<div class="alt">${T('Bir loncaya katıl ya da kendi loncanı kur. Üyeler bağış yaparak ortak üssü büyütür; üs seviyesi arttıkça herkes kazanır.', 'Join a guild or found your own. Members grow the shared base by donating; everyone benefits as it levels up.')}</div>`;
      h += `<div class="satir"><div>🏗 <b>${T('Lonca kur', 'Found a guild')}</b><small>${T('Üs şu anki konumuna kurulur', 'The base is built where you are now')}</small></div><div class="dg"><input id="lonAd" maxlength="20" placeholder="${T('Lonca adı', 'Guild name')}" style="font:inherit;font-size:14px;padding:6px 9px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--ink);width:150px"><button class="kb al" type="button" data-lkur ${kredi < LON_F || kapsul ? 'disabled' : ''}>${SAYI(LON_F)} 💰</button></div></div>`;
    }
    const L2 = [...LON.values()].sort((a, b) => (b.p || 0) - (a.p || 0)).slice(0, 30);
    h += `<div class="alt" style="margin:12px 0 0;font-weight:900;color:var(--ink)">🏆 ${T('Loncalar', 'Guilds')}</div>`;
    h += L2.length ? L2.map(L0 => `<div class="satir"><div>🏰 <b>${esc(L0.ad)}</b> <span class="lv">${T('Sv', 'Lv')} ${lSv(L0)}</span><small>👥 ${lUye(L0)} · ⭐ ${SAYI(L0.p || 0)} · ${mesafeYaz(Math.hypot(L0.x - SH.x, L0.y - SH.y))}</small></div><div class="dg">${ST.lonca === L0.id ? `<button class="kb" type="button" disabled>✓</button>` : `<button class="kb al" type="button" data-lkat="${L0.id}">${T('Katıl', 'Join')}</button>`}</div></div>`).join('') : `<div class="alt">${T('Henüz lonca yok — ilkini sen kur!', 'No guilds yet — found the first one!')}</div>`;
    $('tpIc').innerHTML = h; return;
  }
  const dk = dokluMu(), ben = AG.uid(), benim = PAZ.filter(o => o.s === ben && !o.b), dig = PAZ.filter(o => o.s !== ben && !o.b).sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 40);
  h += `<div class="alt">${T('Diğer pilotların sattığı mallar. Al-sat için bir limana, istasyona, bankaya ya da lonca üssüne yanaşmış olmalısın.', 'Goods sold by other pilots. You must be docked at a port, station, bank or guild base to trade.')}${dk ? '' : ' <b style="color:#FFB3A6">' + T('Şu an yanaşık değilsin.', 'You are not docked right now.') + '</b>'}</div>`;
  h += `<div class="alt" style="margin:10px 0 0;font-weight:900;color:var(--ink)">🛒 ${T('Satıştakiler', 'For sale')}</div>`;
  h += dig.length ? dig.map(o => { const M = pazMal(o.m), yer = o.m.startsWith('s:') || kargoDolu() + o.a <= kapasite(); return M ? `<div class="satir"><div>${M.e} <b>${o.a} × ${L(M.ad)}</b><small>${esc(String(o.n || '?').slice(0, 20))} · ${SAYI(Math.round(o.f / o.a))} 💰/${T('adet', 'unit')}</small></div><div class="dg"><button class="kb al" type="button" data-pal="${o.id}" ${!dk || kredi < o.f || !yer ? 'disabled' : ''}>${!yer ? T('Yer yok', 'No room') : T('Al', 'Buy') + ' · ' + SAYI(o.f) + ' 💰'}</button></div></div>` : ''; }).join('') : `<div class="alt">${T('Şu an satışta bir şey yok.', 'Nothing for sale right now.')}</div>`;
  h += `<div class="alt" style="margin:12px 0 0;font-weight:900;color:var(--ink)">🏷 ${T('Senin ilanların', 'Your listings')} (${benim.length}/5)</div>`;
  h += benim.map(o => { const M = pazMal(o.m); return M ? `<div class="satir"><div>${M.e} <b>${o.a} × ${L(M.ad)}</b><small>${SAYI(o.f)} 💰</small></div><div class="dg"><button class="kb" type="button" data-psil="${o.id}">${T('Geri çek', 'Withdraw')}</button></div></div>` : ''; }).join('');
  const sat = [...Object.keys(KARGO).filter(m => KARGO[m] > 0).map(m => ['m:' + m, KARGO[m]]), ...Object.keys(SARF).filter(k => SARF[k] > 0).map(k => ['s:' + k, SARF[k]])];
  if (benim.length < 5 && sat.length) {
    const sec = sat.find(x => x[0] === tpSat) || sat[0]; tpSat = sec[0]; const M = pazMal(sec[0]), n = Math.min(sec[1], tpAdet || sec[1]), oner = Math.round(M.f * n);
    h += `<div class="satir"><div>🆕 <button class="kb" type="button" data-psec style="padding:3px 8px">${M.e} ${L(M.ad)} ▾</button><small>${T('Adet', 'Amount')}: <button class="kb" type="button" data-padet="-1" style="padding:2px 8px">−</button> <b>${n}</b> / ${sec[1]} <button class="kb" type="button" data-padet="1" style="padding:2px 8px">+</button></small></div><div class="dg"><input id="pFiyat" type="number" min="1" value="${oner}" style="font:inherit;font-size:14px;padding:6px 9px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--ink);width:100px"><button class="kb al" type="button" data-pkoy ${dk ? '' : 'disabled'}>${T('Satışa koy', 'List')}</button></div></div>`;
    tpAdet = n;
  }
  $('tpIc').innerHTML = h;
}
let tpSat = null, tpAdet = 0;
function pazMal(k) { if (!k) return null; const [t, m] = [k.slice(0, 1), k.slice(2)]; if (t === 'm' && MAL[m]) return { e: MAL[m].e, ad: MAL[m].ad, f: MAL[m].f }; if (t === 's' && SARFE[m]) return { e: SARFE[m].e, ad: SARFE[m].ad, f: SARFE[m].k * 2 }; return null; }
function pazarTahsil() {
  const ben = AG.uid(); for (const o of PAZ) if (o.s === ben && o.b && !(ST.ptah || []).includes(o.id)) { ST.ptah = (ST.ptah || []).concat(o.id).slice(-80); kazan(o.f, 'ticaret'); AG.pSil(o.id); duyur('🤝 ' + T('Satıldı: ', 'Sold: ') + `${o.a} × ${L(pazMal(o.m).ad)}`, 'koloni', `+${SAYI(o.f)} 💰 · ${esc(String(o.bn || '').slice(0, 20))}`); kaydet(); }
}
$('topBtn').onclick = () => tpAc();
$('topluluk').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && e.target.id === 'sohIn') $('sohYolla').click(); });
$('topluluk').addEventListener('keyup', e => e.stopPropagation());
$('topluluk').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.id === 'tpKapat') { tpKapat(); return; }
  if (b.dataset.tp) { if ({ yar: 'yaris', lon: 'lon', paz: 'paz', kol: 'kol' }[b.dataset.tp] && kilitli({ yar: 'yaris', lon: 'lon', paz: 'paz', kol: 'kol' }[b.dataset.tp])) return; tpAc(b.dataset.tp); return; }
  if (b.dataset.ygit) { const P = b.dataset.ygit === 'h' ? haftaParkur() : parkur(b.dataset.ygit === 'ev' ? 'ev' : galHucre(SH.x, SH.y)); hedefGit({ h: { x: P.x0, y: P.y0, dur: 250, ad: P.ad }, ad: P.ad, x: P.x0, y: P.y0, d: Math.hypot(P.x0 - SH.x, P.y0 - SH.y) }); tpKapat(); return; }
  if (b.dataset.gtur) { galTur = b.dataset.gtur; tpYaz(); return; }
  if (b.dataset.gfoto) { fotoGoster(b.dataset.gfoto); return; }
  if (b.hasAttribute('data-kgit')) { const [x, y] = kolosPos(); hedefGit({ h: { x, y, dur: 2500, ad: T('Kolos', 'Colossus') }, ad: T('Kolos', 'Colossus'), x, y, d: Math.hypot(x - SH.x, y - SH.y) }); tpKapat(); return; }
  if (b.dataset.kanal) { sohKanal = b.dataset.kanal; tpYaz(); return; }
  if (b.id === 'sohYolla') { const m = ($('sohIn').value || '').trim(); if (!m || Date.now() - sohSon < 3000) return; sohSon = Date.now(); if (AG.sohGonder(m)) { $('sohIn').value = ''; ST.sohN = (ST.sohN || 0) + 1; basarimKontrol(); } $('sohIn').focus(); return; }
  if (b.hasAttribute('data-lkur')) { const ad = ($('lonAd').value || '').trim().slice(0, 20); if (!ad || kredi < LON_F) { duyur('🏰 ' + T('Bir lonca adı yaz', 'Type a guild name'), 'uyari'); return; } b.disabled = true; const id = await AG.lKur(ad); if (id) { kredi -= LON_F; ST.lonca = id; defter('🏰 ' + ad + ' loncasını kurdum.', '🏰 Founded the guild ' + ad + '.'); duyur('🏰 ' + T('Lonca kuruldu: ', 'Guild founded: ') + '<b>' + esc(ad) + '</b>', 'galaksi'); SES.galaksi(); basarimKontrol(); kaydet(); } AG.lOku(tpYaz); return; }
  if (b.dataset.lkat) { const id = b.dataset.lkat; if (await AG.lKatil(id)) { ST.lonca = id; const L0 = LON.get(id); if (L0) defter('🏰 ' + L0.ad + ' loncasına katıldım.', '🏰 Joined the guild ' + L0.ad + '.'); SES.koloni(); basarimKontrol(); kaydet(); } AG.lOku(tpYaz); return; }
  if (b.hasAttribute('data-layril')) { if (ST.lonca) await AG.lAyril(ST.lonca); ST.lonca = null; kaydet(); AG.lOku(tpYaz); return; }
  if (b.hasAttribute('data-lgit')) { const B = benLonca(); if (B) { wp = { x: B.x, y: B.y, k: '', ad: '🏰 ' + B.ad }; if (mod === 'oto') oto = { x: B.x, y: B.y, dur: 400, ad: B.ad }; tpKapat(); duyur('🏰 ' + T('Rota: lonca üssü', 'Route: guild base'), 'kesif', mesafeYaz(Math.hypot(B.x - SH.x, B.y - SH.y))); } return; }
  if (b.dataset.lbag) { const n = +b.dataset.lbag, B = benLonca(); if (B && kredi >= n && await AG.lBagis(B.id, n)) { kredi -= n; ST.bagis = (ST.bagis || 0) + n; SES.koloni(); duyur('🎁 ' + T('Loncana bağış', 'Donated to your guild'), 'koloni', `−${SAYI(n)} 💰 · ⭐ +${SAYI(n)}`); basarimKontrol(); kaydet(); } AG.lOku(tpYaz); return; }
  if (b.hasAttribute('data-lbagk')) { const B = benLonca(); let p2 = 0; for (const m in KARGO) if (!KACAK.includes(m)) p2 += KARGO[m] * MAL[m].f; if (B && p2 > 0 && await AG.lBagis(B.id, p2)) { for (const m in KARGO) if (!KACAK.includes(m)) delete KARGO[m]; ST.bagis = (ST.bagis || 0) + p2; SES.koloni(); duyur('🎁 ' + T('Kargo bağışlandı', 'Cargo donated'), 'koloni', `⭐ +${SAYI(p2)}`); basarimKontrol(); kaydet(); } AG.lOku(tpYaz); return; }
  if (b.dataset.lhiz) { const B = benLonca(), sv = B ? lSv(B) : 0; if (b.dataset.lhiz === 'yakit' && sv >= 2) yakit = tank(); else if (b.dataset.lhiz === 'onar' && sv >= 3) can = maxCan(); else if (b.dataset.lhiz === 'sat' && sv >= 4) { let top = 0; for (const m in KARGO) if (!KACAK.includes(m)) { top += KARGO[m] * MAL[m].f; delete KARGO[m]; } if (top) { kazan(top, 'ticaret'); duyur('📦 ' + T('Kargo satıldı', 'Cargo sold'), 'koloni', `+${SAYI(top)} 💰`); } } SES.koloni(); tpYaz(); kaydet(); return; }
  if (b.hasAttribute('data-psec')) { const sat = [...Object.keys(KARGO).filter(m => KARGO[m] > 0).map(m => 'm:' + m), ...Object.keys(SARF).filter(k => SARF[k] > 0).map(k => 's:' + k)], i = sat.indexOf(tpSat); tpSat = sat[(i + 1) % sat.length]; tpAdet = 0; tpYaz(); return; }
  if (b.dataset.padet) { const mx = tpSat.startsWith('s:') ? SARF[tpSat.slice(2)] : KARGO[tpSat.slice(2)]; tpAdet = kis(tpAdet + +b.dataset.padet, 1, mx || 1); tpYaz(); return; }
  if (b.hasAttribute('data-pkoy')) { if (!dokluMu() || !tpSat) return; const k = tpSat.slice(2), sarf = tpSat.startsWith('s:'), var_ = sarf ? SARF[k] : KARGO[k], n = Math.min(tpAdet, var_ || 0), f = Math.max(1, Math.min(10000000, Math.round(+$('pFiyat').value || 0))); if (n < 1 || f < 1) return; b.disabled = true; if (await AG.pKoy(tpSat, n, f)) { if (sarf) SARF[k] -= n; else { KARGO[k] -= n; if (!KARGO[k]) delete KARGO[k]; } ST.pkoy = (ST.pkoy || 0) + 1; SES.koloni(); duyur('🏷 ' + T('Satışa kondu', 'Listed for sale'), 'koloni'); basarimKontrol(); kaydet(); } AG.pOku(tpYaz); return; }
  if (b.dataset.psil) { const o = PAZ.find(x => x.id === b.dataset.psil); if (o && await AG.pSil(o.id)) { const k = o.m.slice(2); if (o.m.startsWith('s:')) SARF[k] = Math.min(SARF_MAX * 3, (SARF[k] || 0) + o.a); else KARGO[k] = (KARGO[k] || 0) + o.a; SES.tik(); kaydet(); } AG.pOku(tpYaz); return; }
  if (b.dataset.pal) { const o = PAZ.find(x => x.id === b.dataset.pal); if (!o || !dokluMu() || kredi < o.f) return; const sarf = o.m.startsWith('s:'), k = o.m.slice(2); if (!sarf && kargoDolu() + o.a > kapasite()) return; b.disabled = true; if (await AG.pAl(o.id)) { kredi -= o.f; if (sarf) SARF[k] = (SARF[k] || 0) + o.a; else KARGO[k] = (KARGO[k] || 0) + o.a; ST.pal = (ST.pal || 0) + 1; SES.koloni(); duyur('🤝 ' + T('Satın aldın: ', 'Bought: ') + `${o.a} × ${L(pazMal(o.m).ad)}`, 'koloni', `−${SAYI(o.f)} 💰`); basarimKontrol(); kaydet(); } else duyur('🤝 ' + T('Bu ilan artık yok', 'This listing is gone'), 'uyari'); AG.pOku(tpYaz); return; }
});
function lonCiz(t) {
  for (const [, L0] of LON) {
    const [X, Y] = W2S(L0.x, L0.y), R = Math.max(10, 170 * cam.z); if (X < -R * 2 || X > W + R * 2 || Y < -R * 2 || Y > H + R * 2) continue; const ben = L0.id === ST.lonca, sv = lSv(L0), renk = ben ? '#FFC857' : '#9BE07A';
    ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 0.03); ctx.strokeStyle = renk; ctx.lineWidth = Math.max(1.4, R * 0.05); ctx.fillStyle = '#16202E'; ctx.fillRect(-R * 0.7, -R * 0.7, R * 1.4, R * 1.4); ctx.strokeRect(-R * 0.7, -R * 0.7, R * 1.4, R * 1.4);
    for (let k = 0; k < Math.min(4, sv); k++) { const a = k * Math.PI / 2 + Math.PI / 4; ctx.fillStyle = renk; ctx.beginPath(); ctx.arc(Math.cos(a) * R, Math.sin(a) * R, R * 0.2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = renk; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2); ctx.beginPath(); ctx.arc(0, 0, R * 0.28, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
    ctx.font = '900 12.5px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = renk; ctx.fillText('🏰 ' + L0.ad + ' · ' + T('Sv ', 'Lv ') + sv, X, Y - R - 10);
  }
}
/* ================= seyir defteri ================= */
const gunNo = () => 1 + Math.floor((ST.oyS || 0) / 600);
const L2Ad = (k, i) => (GEMI[k] || GEMI.kasif).ad[i];
function defter(tr, en) { DEFTER.push({ g: gunNo(), z: Date.now(), m: [tr, en] }); if (DEFTER.length > 150) DEFTER.splice(0, DEFTER.length - 150); }
function defterHtml() {
  if (!DEFTER.length) return `<div class="alt">${T('Defter henüz boş: uçtukça kendiliğinden yazılır.', 'The log is empty: it writes itself as you fly.')}</div>`;
  let h = '', son = 0; for (const d of DEFTER.slice().reverse()) { if (d.g !== son) { son = d.g; h += `<div style="margin:8px 0 2px;font-weight:900;color:var(--altin)">📅 ${T('Gün', 'Day')} ${d.g}</div>`; } h += `<div style="margin:2px 0;color:var(--ink)">${esc(L(d.m))}</div>`; } return h;
}
/* ================= fotoğraf modu ================= */
function fotoAc(v) { fotoMod = !!v && oyunda; document.body.classList.toggle('foto', fotoMod); if (fotoMod) { $('menu').hidden = true; if (HM.acik) haritaKapat(); if (kokGor) fpAc(false); } SES.tik(); }
$('fotoBtn').onclick = () => { $('menu').hidden = true; if (!oyunda) basla(); setTimeout(() => fotoAc(true), 50); };
$('fotoCik').onclick = () => fotoAc(false);
$('fotoKaydet').onclick = () => { try { const a = document.createElement('a'); a.download = 'kozmos-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.png'; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); ST.foto = (ST.foto || 0) + 1; SES.koloni(); basarimKontrol(); } catch (e) { } };
/* ================= kokpit görünümü ================= */
function fpAc(v) { kokGor = !!v; ls.set('kozmos-fp', kokGor); document.body.classList.toggle('fp', kokGor && oyunda); $('fpSec').checked = kokGor; if (kokGor) { ST.fp = (ST.fp || 0) + 1; basarimKontrol(); } SES.tik(); }
$('fpSec').addEventListener('change', e => fpAc(e.target.checked));
$('defKopya').onclick = () => { const t = DEFTER.map(d => `${T('Gün', 'Day')} ${d.g}: ${L(d.m)}`).join('\n'); try { navigator.clipboard.writeText(t); duyur('📋 ' + T('Defter kopyalandı', 'Log copied'), 'koloni'); } catch (e) { } };
const FPY = []; for (let i = 0; i < 320; i++) FPY.push([Math.random() * TAU, (Math.random() - 0.5) * 1.3, 0.3 + Math.random() * 0.7]);
const FPT = []; let fpSonT = 0, fpSonA = 0;
function fpProj(x, y, h) { const dx = x - SH.x, dy = y - SH.y, c = Math.cos(SH.a), sn = Math.sin(SH.a), ile = dx * c + dy * sn, yan = -dx * sn + dy * c; return [ile, yan, h]; }
function fpCiz(t) {
  const dt = Math.min(0.05, Math.max(0, t - fpSonT)); fpSonT = t; const FOV = 1.65, f = (W / 2) / Math.tan(FOV / 2), CX = W / 2, CY = H * 0.42, v = Math.hypot(SH.vx, SH.vy);
  const g0 = ctx.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#02030A'); g0.addColorStop(0.5, '#060A1C'); g0.addColorStop(1, '#02030A'); ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
  // uzak yıldızlar
  for (const [az, el, b] of FPY) { let r = az - SH.a; r = Math.atan2(Math.sin(r), Math.cos(r)); if (Math.abs(r) > FOV / 2 + 0.1) continue; const x = CX + Math.tan(r) * f, y = CY + el * f * 0.6; ctx.fillStyle = `rgba(220,230,255,${(b * 0.9).toFixed(2)})`; if (SH.warp > 0.2) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = b * 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(CX + (x - CX) * (1 + SH.warp * 0.25), CY + (y - CY) * (1 + SH.warp * 0.25)); ctx.stroke(); } else ctx.fillRect(x, y, b * 1.6, b * 1.6); }
  // nesneler
  const L2 = [], sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK), tt = simT(), ekle = (x, y, h, r, tur, ad, renk) => { const [ile, yan] = fpProj(x, y); if (ile < 30) return; L2.push({ ile, yan, h, r, tur, ad, renk, d: Math.hypot(x - SH.x, y - SH.y) }); };
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
    const tm = temel(sx + i, sy + j); if (!tm) continue; const Y = YT[tm.yt]; ekle(tm.x, tm.y, 0, tm.yr, Y.kd ? 'kd' : 'yildiz', KESIF.has('s:' + tm.k) ? tm.ad : '', Y.g);
    if (Math.abs(i) <= 1 && Math.abs(j) <= 1) { const s2 = sistem(sx + i, sy + j); if (s2) for (const p of s2.gez) { const [px, py] = gezPos(p, tt), hh = ((h32(p.seed, 1, 2) % 1000) / 1000 - 0.5) * p.r * 3; ekle(px, py, hh, p.r, 'gez', KESIF.has('p:' + p.id) ? (p.kol && KESIF.has('k:' + p.id) ? '🏙 ' + kolAd(p) : p.ad) : '', p.P.c); } }
  }
  for (const k of KORS) ekle(k.x, k.y, 0, k.ana ? 300 : k.us ? 170 : 16, 'kors', k.ad || '', k.ist ? '#7CF0A6' : k.golge ? '#B48CFF' : '#FF5C6E');
  for (const d of DOST) ekle(d.x, d.y, 0, 16, 'dost', '', '#7FE3FF');
  for (const [, e] of AG.UZAK) ekle(e.cx, e.cy, 0, 16, 'dost', '🛰 ' + String(e.v.n || '').slice(0, 16), '#7CF0A6');
  { const [bx, by] = bankaPos(); ekle(bx, by, 60, 150, 'ist', '🏦', '#FFC857'); const G = galaksi(...galHucre(SH.x, SH.y)); const [ix, iy] = istPos(G); ekle(ix, iy, -80, 220, 'ist', '🛰', '#7FE3FF'); const [kx, ky] = korsanLimanPos(G); ekle(kx, ky, 40, 120, 'ist', '☠', '#FF5C6E'); }
  for (const o of OLAY) ekle(o.x, o.y, 0, o.tip === 'snb' ? o.R : o.tip === 'solucan' ? 160 : o.tip === 'sn' ? o.yr * 3 : 30, o.tip === 'enkaz' ? 'enkaz' : 'olay', o.tip === 'enkaz' ? '📦' : o.tip === 'solucan' ? '🌀' : '', o.tip === 'solucan' ? '#B48CFF' : '#FFC8E8');
  if (wp) ekle(wp.x, wp.y, 0, 0, 'wp', '◇ ' + (wp.ad || ''), '#FFC857');
  L2.sort((a, b) => b.ile - a.ile);
  ctx.textAlign = 'center';
  for (const o of L2) {
    const x = CX + o.yan / o.ile * f, y = CY + o.h / o.ile * f, R = o.r / o.ile * f; if (x < -R - 200 || x > W + R + 200) continue;
    if (o.tur === 'yildiz' || o.tur === 'kd') { const rr = Math.max(2, R); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, rr * 5); g.addColorStop(0, `rgba(${o.renk},.9)`); g.addColorStop(0.2, `rgba(${o.renk},.35)`); g.addColorStop(1, `rgba(${o.renk},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr * 5, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = o.tur === 'kd' ? '#000' : '#FFF8E8'; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); }
    else if (o.tur === 'gez') { const rr = Math.max(1.4, R); const g = ctx.createRadialGradient(x - rr * 0.35, y - rr * 0.35, rr * 0.1, x, y, rr); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.15, o.renk); g.addColorStop(1, '#05070F'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); }
    else if (o.tur === 'kors' || o.tur === 'dost') { const rr = Math.max(4, R * 1.4); ctx.fillStyle = o.renk; ctx.beginPath(); ctx.moveTo(x, y - rr); ctx.lineTo(x + rr, y + rr * 0.7); ctx.lineTo(x - rr, y + rr * 0.7); ctx.closePath(); ctx.fill(); if (o.tur === 'kors') { ctx.strokeStyle = o.renk; ctx.lineWidth = 1.2; ctx.strokeRect(x - rr * 1.8, y - rr * 1.8, rr * 3.6, rr * 3.6); } }
    else if (o.tur === 'wp') { ctx.strokeStyle = '#FFC857'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.stroke(); }
    else { const rr = Math.max(3, R); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = o.renk; ctx.globalAlpha = o.tur === 'olay' ? 0.35 : 0.9; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    if (o.ad && (R > 5 || o.d < 4000 || o.tur === 'wp' || o.tur === 'ist')) { ctx.font = '800 12px Nunito, system-ui, sans-serif'; ctx.fillStyle = 'rgba(230,238,255,.9)'; ctx.fillText(o.ad, x, y - Math.max(R, 6) - 8); ctx.font = '700 10.5px Nunito, system-ui, sans-serif'; ctx.fillStyle = 'rgba(160,180,220,.85)'; ctx.fillText(mesafeYaz(o.d), x, y + Math.max(R, 6) + 14); }
  }
  // uzay tozu
  const da = SH.a - fpSonA; fpSonA = SH.a;
  while (FPT.length < 90) { const a = SH.a + (Math.random() - 0.5) * 1.8, d = 300 + Math.random() * 2600; FPT.push({ x: SH.x + Math.cos(a) * d, y: SH.y + Math.sin(a) * d, h: (Math.random() - 0.5) * 900, px: null }); }
  ctx.lineCap = 'round';
  for (let i = FPT.length - 1; i >= 0; i--) { const q = FPT[i], [ile, yan] = fpProj(q.x, q.y); if (ile < 25 || ile > 3200 || Math.abs(yan) > ile * 1.4) { FPT.splice(i, 1); continue; } const x = CX + yan / ile * f, y = CY + q.h / ile * f, k = Math.min(1, 120 / ile); if (q.px != null && v > 60) { ctx.strokeStyle = `rgba(200,215,255,${(k * 0.7).toFixed(2)})`; ctx.lineWidth = Math.max(0.6, k * 2.4); ctx.beginPath(); ctx.moveTo(q.px, q.py); ctx.lineTo(x, y); ctx.stroke(); } else { ctx.fillStyle = `rgba(200,215,255,${(k * 0.6).toFixed(2)})`; ctx.fillRect(x, y, 1.5, 1.5); } q.px = x; q.py = y; }
  if (SH.warp > 0.1) { ctx.fillStyle = `rgba(120,80,255,${(SH.warp * 0.12).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (hasarFlas > 0.02) { ctx.fillStyle = `rgba(255,50,70,${(hasarFlas * 0.25).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  // kokpit çerçevesi
  const D = H * 0.79, kg = ctx.createLinearGradient(0, D, 0, H); kg.addColorStop(0, '#1A2238'); kg.addColorStop(1, '#0A0E1A');
  ctx.fillStyle = '#0B1020'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.05); ctx.quadraticCurveTo(CX, H * 0.12, 0, H * 0.05); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.08, 0); ctx.lineTo(W * 0.02, D); ctx.lineTo(0, D); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W * 0.92, 0); ctx.lineTo(W * 0.98, D); ctx.lineTo(W, D); ctx.closePath(); ctx.fill();
  ctx.fillStyle = kg; ctx.beginPath(); ctx.moveTo(0, D); ctx.quadraticCurveTo(CX, D - H * 0.06, W, D); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(127,227,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, D); ctx.quadraticCurveTo(CX, D - H * 0.06, W, D); ctx.stroke();
  // nişangâh ve pusula
  ctx.strokeStyle = 'rgba(127,227,255,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(CX, CY, 14, 0, TAU); ctx.moveTo(CX - 26, CY); ctx.lineTo(CX - 18, CY); ctx.moveTo(CX + 18, CY); ctx.lineTo(CX + 26, CY); ctx.moveTo(CX, CY - 26); ctx.lineTo(CX, CY - 18); ctx.stroke();
  const deg = ((SH.a * 180 / Math.PI) % 360 + 360) % 360; ctx.font = '800 11px Nunito, system-ui, sans-serif'; ctx.fillStyle = 'rgba(160,200,255,.85)';
  for (let k = -40; k <= 40; k += 10) { const dd = Math.round(deg / 10) * 10 + k, x = CX + (dd - deg) * 5; ctx.fillRect(x, H * 0.09, 1, 6); ctx.fillText(String((dd % 360 + 360) % 360), x, H * 0.09 + 18); }
  // pano
  const pw = Math.min(W * 0.84, 620), px0 = CX - pw / 2, py0 = D + (H - D) * 0.28, ph = (H - D) * 0.5, [ha, hb] = hizYaz(v);
  const kutu = (i, n, bas, deger, oran, renk) => { const w = pw / n, x = px0 + i * w + 6; ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, py0, w - 12, ph); ctx.font = '800 10px Nunito, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#97A5CA'; ctx.fillText(bas, x + 8, py0 + 14); ctx.font = '900 15px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#E8EEFF'; ctx.fillText(deger, x + 8, py0 + 33); if (oran != null) { ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x + 8, py0 + ph - 10, w - 28, 4); ctx.fillStyle = renk; ctx.fillRect(x + 8, py0 + ph - 10, (w - 28) * kis(oran, 0, 1), 4); } ctx.textAlign = 'center'; };
  kutu(0, 4, T('HIZ', 'SPEED'), ha + ' ' + hb, Math.min(1, v / 3200), '#7FE3FF'); kutu(1, 4, kapsul ? T('OKSİJEN', 'OXYGEN') : T('YAKIT', 'FUEL'), kapsul ? Math.ceil(oks) + ' s' : Math.floor(yakit) + '/' + tank(), kapsul ? oks / OKS_MAX() : yakit / tank(), '#FFC857'); kutu(2, 4, T('GÖVDE', 'HULL'), Math.ceil(can) + '/' + maxCan(), can / maxCan(), can / maxCan() < 0.3 ? '#FF5C6E' : '#9BE07A'); kutu(3, 4, 'WARP', SH.warp > 0.2 ? T('AKTİF', 'ACTIVE') : Math.round(Math.max(SH.sarj, 0) * 100) + '%', Math.max(SH.sarj, SH.warp), '#B48CFF');
  if (KORS.length && Math.sin(t * 8) > 0) { ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#FF7B8A'; ctx.fillText('⚠ ' + T('DÜŞMAN TEMASI', 'HOSTILE CONTACT') + ' · ' + KORS.length, CX, D - 10); }
  if (DOKUN) { ctx.font = '700 11px Nunito, system-ui, sans-serif'; ctx.fillStyle = 'rgba(160,180,220,.55)'; ctx.fillText(T('Sola/sağa bas: dön · ortaya bas: ilerle', 'Hold left/right: turn · hold centre: thrust'), CX, H * 0.74); }
}
/* ================= gezegene iniş ================= */
let INS = null;
const INIS_BEK = 3600000;
function inisKalan(p) { const z = (ST.inis || {})[p.id]; return z ? Math.max(0, z + INIS_BEK - Date.now()) : 0; }
function inisAc(p) {
  if (inisKalan(p) > 0) return; inisAcik = true; SH.vx = SH.vy = 0; oto = null; kazP = null; KORS.length = 0; MERMI.length = 0;
  const r = rng(h32(p.seed, Math.floor(Date.now() / INIS_BEK), 8080)), WD = 5000, kr = []; for (let i = 0; i < 9; i++) kr.push({ x: 300 + i * (WD - 500) / 9 + r() * 220, al: false, rare: r() < 0.15 });
  INS = { p, WD, x: 120, vx: 0, y: 0, vy: 0, yer: true, kr, top: 0, rare: 0, sure: 60, kal: 60, t0: performance.now(), son: performance.now(), bitti: false, seed: p.seed, kalinti: !!p.kalinti && !KESIF.has('r:' + p.id), art: false, artX: WD - 160, tus: { sol: false, sag: false, zip: false }, tehlike: p.tip === 'lav' ? 'lav' : p.tip === 'zehir' ? 'asit' : null, cukur: [] };
  if (INS.tehlike) for (let i = 0; i < 8; i++) INS.cukur.push(500 + i * 560 + r() * 200);
  inisPoi(r); kodAc('p:' + p.tip);
  $('inBas').textContent = '🛬 ' + p.ad; $('inYaz').textContent = T('Kristalleri topla (her biri ambarına 1 kaynak). Süre bitmeden ya da istediğin zaman yörüngeye dön.', 'Collect the crystals (each adds 1 resource to your hold). Return to orbit before time runs out, or whenever you like.') + ' ' + T('Maden damarının üstünde dur: araç kazar (+3). Yaşam formlarının yanında bekle: tarar (🔬). Gayzerlerden uzak dur. 🕳 Mağaralarda ve 🏚 terk edilmiş üslerde de dur.', 'Stop on an ore vein to drill it (+3). Wait next to life forms to scan them (🔬). Keep away from geysers. Also stop at 🕳 caves and 🏚 abandoned bases.') + (INS.tehlike ? ' ' + T('Çukurlara dikkat: zıpla!', 'Mind the pits: jump!') : '');
  $('inis').hidden = false; SES.koloni(); gpImza = ''; requestAnimationFrame(inisKare);
}
function inisYer(x) { const S = INS.seed; return 40 + Math.sin(x * 0.004 + S % 7) * 26 + Math.sin(x * 0.011 + S % 13) * 12 + Math.sin(x * 0.029 + S % 5) * 5; }
function inisCukur(x) { return INS.cukur.some(c => Math.abs(x - c) < 42); }
function inisKapat() {
  if (!INS) return; const p = INS.p; inisAcik = false; $('inis').hidden = true; ST.inis = ST.inis || {}; ST.inis[p.id] = Date.now(); const ids = Object.keys(ST.inis); if (ids.length > 60) delete ST.inis[ids[0]];
  const m = KAYN[p.tip] || 'cevher', yer = kapasite() - kargoDolu(), n = Math.min(yer, INS.top), nr = Math.min(yer - n, INS.rare), yaz = [];
  if (n > 0) { KARGO[m] = (KARGO[m] || 0) + n; yaz.push(`${MAL[m].e} +${n}`); } if (nr > 0) { KARGO.kris = (KARGO.kris || 0) + nr; yaz.push(`${MAL.kris.e} +${nr}`); }
  if (INS.art) { KESIF.add('r:' + p.id); const od = 800 + ((Math.random() * 1200) | 0); kazan(od, 'kesif'); yaz.push(`🏺 +${SAYI(od)} 💰`); if (Math.random() < 0.5) planVer('inis'); }
  ST.inisN = (ST.inisN || 0) + 1; bilimEkle(2 + INS.top + INS.rare * 2); if (INS.top + INS.rare > 0 || INS.art) defter('🛬 ' + p.ad + ' yüzeyine indim ve ' + (INS.top + INS.rare) + ' kristal topladım.', '🛬 I landed on ' + p.ad + ' and gathered ' + (INS.top + INS.rare) + ' crystals.');
  duyur('🛬 ' + T('Yörüngeye döndün', 'Back in orbit'), 'kesif', yaz.join(' · ') || T('Bu sefer eli boş', 'Empty-handed this time')); SES.tik(); INS = null; basarimKontrol(); kaydet(); gpImza = '';
}
function inisKare(now) {
  if (!INS || !inisAcik) return; const c = $('inC'), w = c.clientWidth, h = c.clientHeight; if (!w) { requestAnimationFrame(inisKare); return; }
  if (c.width !== Math.round(w * DPR)) { c.width = Math.round(w * DPR); c.height = Math.round(h * DPR); }
  const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); const dt = Math.min(0.05, (now - INS.son) / 1000); INS.son = now;
  const I = INS, sol = I.tus.sol || TUS.a || TUS.arrowleft, sag = I.tus.sag || TUS.d || TUS.arrowright, zip = I.tus.zip || TUS.w || TUS.arrowup || TUS[' '];
  if (!I.bitti && !YBL) {
    I.kal -= dt; if (I.kal <= 0) { I.kal = 0; I.bitti = true; setTimeout(inisKapat, 1200); }
    I.vx += ((sag ? 260 : 0) - (sol ? 260 : 0) - I.vx) * Math.min(1, dt * (I.p.tip === 'buz' ? 1.1 : 4)); I.x = kis(I.x + I.vx * dt, 20, I.WD - 20);
    const zy = inisYer(I.x); if (I.yer && zip) { I.vy = 300; I.yer = false; SES.tik(); }
    if (!I.yer) { I.vy -= 640 * dt; I.y += I.vy * dt; if (I.y <= 0) { I.y = 0; I.vy = 0; I.yer = true; } }
    if (I.yer && I.tehlike && inisCukur(I.x)) { I.x -= Math.sign(I.vx || 1) * 60; I.vx = 0; I.kal = Math.max(0, I.kal - 5); hasar(8); SES.vur(); duyur((I.tehlike === 'lav' ? '🔥 ' : '☣ ') + T('Çukura düştün: −5 sn', 'You fell in a pit: −5 s'), 'uyari'); }
    for (const k of I.kr) if (!k.al && Math.abs(k.x - I.x) < 26 && I.y < 50) { k.al = true; if (k.rare) I.rare++; else I.top++; SES.tik(); }
    if (I.kalinti && !I.art && Math.abs(I.artX - I.x) < 30 && I.y < 40) { I.art = true; SES.galaksi(); }
    inisPoiAdim(I, dt, now);
  }
  const camX = kis(I.x - w * 0.35, 0, I.WD - w), P = I.p, Z = ZEMIN[P.tip] || ['#3E3B3A', '#6A6460'], atm = P.P.atm;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, atm ? `rgba(${atm},.25)` : '#03040C'); g.addColorStop(1, atm ? `rgba(${atm},.55)` : '#0A0E1A'); x.fillStyle = '#03040C'; x.fillRect(0, 0, w, h); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const rr = rng(P.seed ^ 5); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${(0.2 + rr() * 0.5).toFixed(2)})`; x.fillRect(((rr() * 4000 - camX * 0.1) % w + w) % w, rr() * h * 0.6, 1.3, 1.3); }
  const Y = YT[P.s.t.yt]; x.fillStyle = Y.c; x.beginPath(); x.arc(w * 0.78 - camX * 0.05, h * 0.2, 16, 0, TAU); x.fill();
  // arka tepeler
  x.fillStyle = Z[0]; x.globalAlpha = 0.5; x.beginPath(); x.moveTo(0, h); for (let sx = 0; sx <= w; sx += 8) x.lineTo(sx, h - 70 - inisYer((sx + camX * 0.5) * 1.7) * 1.4); x.lineTo(w, h); x.fill(); x.globalAlpha = 1;
  // zemin
  const zg = x.createLinearGradient(0, h - 110, 0, h); zg.addColorStop(0, Z[1]); zg.addColorStop(1, Z[0]); x.fillStyle = zg; x.beginPath(); x.moveTo(0, h); for (let sx = 0; sx <= w; sx += 6) x.lineTo(sx, h - inisYer(sx + camX)); x.lineTo(w, h); x.fill();
  for (const cx of I.cukur) { const X = cx - camX; if (X < -50 || X > w + 50) continue; x.fillStyle = I.tehlike === 'lav' ? '#FF6A2A' : '#9BE04A'; x.globalAlpha = 0.85 + 0.15 * Math.sin(now / 200); x.fillRect(X - 40, h - inisYer(cx) - 2, 80, 10); x.globalAlpha = 1; }
  // iniş gemisi
  { const X = 60 - camX, yy = h - inisYer(60); x.fillStyle = '#C8D2EC'; x.beginPath(); x.moveTo(X, yy - 46); x.lineTo(X + 16, yy - 12); x.lineTo(X - 16, yy - 12); x.closePath(); x.fill(); x.strokeStyle = '#9AA6BC'; x.lineWidth = 2; x.beginPath(); x.moveTo(X - 12, yy - 12); x.lineTo(X - 20, yy); x.moveTo(X + 12, yy - 12); x.lineTo(X + 20, yy); x.stroke(); }
  // kristaller ve eser
  for (const k of I.kr) { if (k.al) continue; const X = k.x - camX; if (X < -20 || X > w + 20) continue; const yy = h - inisYer(k.x) - 14 - 4 * Math.sin(now / 300 + k.x); x.fillStyle = k.rare ? '#B48CFF' : '#7FE3FF'; x.beginPath(); x.moveTo(X, yy - 10); x.lineTo(X + 6, yy); x.lineTo(X, yy + 10); x.lineTo(X - 6, yy); x.closePath(); x.fill(); }
  if (I.kalinti && !I.art) { const X = I.artX - camX, yy = h - inisYer(I.artX); x.fillStyle = '#E8D9A8'; x.fillRect(X - 14, yy - 30, 8, 30); x.fillRect(X + 6, yy - 30, 8, 30); x.fillRect(X - 18, yy - 36, 36, 7); x.font = '16px system-ui'; x.textAlign = 'center'; x.fillText('🏺', X, yy - 42); }
  inisPoiCiz(x, I, camX, w, h, now);
  // gezgin
  roverCiz(x, I, camX, h, now);
  inisHava(x, I, w, h, now);
  // üst bilgi
  x.font = '900 13px Nunito, system-ui, sans-serif'; x.textAlign = 'left'; x.fillStyle = '#E8EEFF'; x.fillText(`💎 ${I.top + I.rare}/${I.kr.length}  ·  🔋 ${Math.ceil(I.kal)} s${inisPoiHud(I)}${I.kalinti ? '  ·  🏺 ' + (I.art ? '✓' : T('kalıntı var', 'ruins ahead')) : ''}`, 10, 20);
  x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(10, 28, w - 20, 4); x.fillStyle = '#7FE3FF'; x.fillRect(10, 28, (w - 20) * I.kal / I.sure, 4);
  if (I.bitti) { x.textAlign = 'center'; x.font = '900 18px Nunito, system-ui, sans-serif'; x.fillText(T('Süre doldu: yörüngeye dönülüyor…', 'Time is up: returning to orbit…'), w / 2, h / 2); }
  requestAnimationFrame(inisKare);
}
$('inKalk').onclick = () => inisKapat();
document.querySelectorAll('#inis [data-in]').forEach(b => { const k = b.dataset.in, ac = e => { e.preventDefault(); if (INS) INS.tus[k] = true; try { b.setPointerCapture(e.pointerId); } catch (er) { } }, kp = () => { if (INS) INS.tus[k] = false; }; b.addEventListener('pointerdown', ac); b.addEventListener('pointerup', kp); b.addEventListener('pointercancel', kp); b.addEventListener('lostpointercapture', kp); });
