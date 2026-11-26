/* ================= otopilot ================= */
function otoPos(o, t) {
  if (o.p) { const [x, y] = gezPos(o.p, t); return [x, y, o.p.r * (o.p.halka ? o.p.halka.dis : 1) + 170]; }
  if (o.tm) return [o.tm.x, o.tm.y, YT[o.tm.yt].kd ? o.tm.yr * 14 : o.tm.yr * 3 + 300];
  return [o.x, o.y, o.dur || 0];
}
function otoSec(px, py) {
  const t = simT(), z = cam.z, wx = cam.x + (px - W / 2) / z, wy = cam.y + (py - H / 2) / z;
  let en = null, ed = Infinity;
  const sx = Math.floor(wx / SEK), sy = Math.floor(wy / SEK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const tm = temel(sx + i, sy + j); if (!tm) continue;
    const [X, Y] = W2S(tm.x, tm.y), ds = Math.hypot(X - px, Y - py);
    if (ds < Math.max(tm.yr * z + 14, 24) && ds < ed) { ed = ds; en = { tm, ad: KESIF.has('s:' + tm.k) ? tm.ad : T('Bilinmeyen yıldız', 'Unknown star') }; }
    if (Math.hypot(tm.x - wx, tm.y - wy) > 6000) continue;
    for (const p of sistem(tm.sx, tm.sy).gez) {
      const [gx, gy] = gezPos(p, t), [X2, Y2] = W2S(gx, gy), dp = Math.hypot(X2 - px, Y2 - py);
      if (dp < Math.max(p.r * z + 14, 22) && dp < ed) { ed = dp; en = { p, ad: KESIF.has('p:' + p.id) ? (p.kol && KESIF.has('k:' + p.id) ? kolAd(p) : p.ad) : T('Bilinmeyen gezegen', 'Unknown planet') }; }
    }
  }
  oto = en || { x: wx, y: wy, ad: '' };
  SES.tik(); SES.baslat();
  duyur('🤖 ' + T('Otopilot: ', 'Autopilot: ') + (oto.ad ? '<b>' + esc(oto.ad) + '</b>' : T('seçilen noktaya', 'to the chosen point')), 'kesif', mesafeYaz(Math.hypot(otoPos(oto, t)[0] - SH.x, otoPos(oto, t)[1] - SH.y)));
}
function modYaz() {
  const b = $('modBtn'); b.innerHTML = mod === 'oto' ? '🤖<span class="yaz"> ' + T('Otopilot', 'Autopilot') + '</span>' : '🕹<span class="yaz"> ' + T('Sürüş', 'Manual') + '</span>';
  b.classList.toggle('oto', mod === 'oto'); document.body.classList.toggle('otomod', mod === 'oto');
  $('kFrenY').textContent = mod === 'oto' ? T('Dur', 'Stop') : T('Fren', 'Brake');
  ipucuYaz();
}
function modDegis() {
  mod = mod === 'oto' ? 'surus' : 'oto'; ls.set('kozmos-mod', mod); oto = null; modYaz(); SES.tik();
  duyur(mod === 'oto' ? '🤖 ' + T('Otopilot', 'Autopilot') : '🕹 ' + T('Sürüş modu', 'Manual flight'), 'kesif', mod === 'oto' ? T('Gitmek istediğin yere dokun: gemi kendisi gider', 'Tap where you want to go: the ship flies itself') : T('Gemiyi kendin yönet', 'Fly the ship yourself'));
}
$('modBtn').onclick = modDegis;

/* ================= gemi yanı düğmeleri ================= */
function otoWarp() { if (!oto || kapsul) return; if (oto.warp) { oto.warp = false; } else if (yakit <= 0) { duyur('⛽ ' + T('Yakıt yok: warp yapılamaz', 'No fuel: cannot warp'), 'uyari'); SES.uyari(); return; } else if (otoV && otoV.kal > 60000) oto.warp = true; else { duyur('🌀 ' + T('Hedef warp için çok yakın', 'Target too close for warp')); return; } SES.tik(); gpImza = ''; gpYaz(); }
function otoBoost() { if (!oto) return; oto.boost = !oto.boost; SES.tik(); gpImza = ''; gpYaz(); }
function gpYaz() {
  let h = '';
  if (oyunda && !limanP && !HM.acik && kapsul) {
    const dk = Math.max(0, Math.ceil(oks)); h += `<button class="gpb ${oks < 60 ? 'y' : ''}" type="button" disabled style="opacity:1">🫁 ${T('Oksijen', 'Oxygen')} ${Math.floor(dk / 60)}:${String(dk % 60).padStart(2, '0')}</button>`;
    if (!yanasP) h += `<button class="gpb w" type="button" data-g="kgit">🏙 ${T('En yakın koloniye git', 'Go to the nearest colony')}</button>`;
  }
  if (oyunda && !limanP && !HM.acik && istnObj && Math.hypot(istnObj.x - SH.x, istnObj.y - SH.y) < 650) h += `<button class="gpb y" type="button" data-g="istn">🏗 ${T('İstasyonuna yanaş', 'Dock at your station')}</button>`;
  if (oyunda && !limanP && !HM.acik) h += sarfGp();
  if (oyunda && !limanP && !HM.acik && !kapsul && !KORS.length) { const mk = Object.keys(MODUL).filter(k => MODUL[k] < 95).sort((a, b) => MODUL[a] - MODUL[b])[0]; if (mk) h += `<button class="gpb ${MODUL[mk] < 40 ? 'y' : ''}" type="button" data-g="tamir" data-k="${mk}">🔧 ${T('Onar', 'Repair')}: ${MODAD[mk].e} ${L(MODAD[mk].ad)} ${Math.round(MODUL[mk])}%</button>`; }
  if (oyunda && !limanP && !HM.acik && gazToplama > 0) h += `<button class="gpb" type="button" disabled style="opacity:1">⛽ ${T('Atmosferden yakıt toplanıyor', 'Scooping fuel from the atmosphere')} · ${Math.floor(yakit)}/${tank()}</button>`;
  if (oyunda && !limanP && !HM.acik && !kapsul && kaynP && kaynP.P && !['gaz', 'buzdevi'].includes(kaynP.tip) && !kazP) { const kal = inisKalan(kaynP); h += `<button class="gpb" type="button" data-g="inis" ${kal > 0 ? 'disabled' : ''}>🛬 ${kal > 0 ? T('Yüzey: ', 'Surface: ') + Math.ceil(kal / 60000) + T(' dk', ' min') : T('Yüzeye in', 'Land on the surface')}</button>`; }
  if (oyunda && !limanP && !HM.acik && benLonca() && lonYakin() === benLonca()) h += `<button class="gpb y" type="button" data-g="lonca">🏰 ${T('Lonca üssü', 'Guild base')}</button>`;
  if (oyunda && !limanP && !HM.acik) { if (istYakin()) h += `<button class="gpb y" type="button" data-g="ist">🛰 ${T('İstasyona yanaş', 'Dock at the station')}</button>`; if (solucanYakin()) h += `<button class="gpb w" type="button" data-g="solucan">🌀 ${T('Solucan deliğine gir', 'Enter the wormhole')}</button>`; const zb = zulaYakin(); if (zb) h += `<button class="gpb y" type="button" data-g="zula">💎 ${T('Zulayı aç', 'Open the cache')}</button>`; const sb = !kapsul && snbYakin(); if (sb) h += `<button class="gpb y" type="button" data-g="snb">✨ ${T('Süpernova özü topla', 'Collect supernova essence')} · ${sb.n}</button>`; }
  if (oyunda && !limanP && !HM.acik && !kapsul && (KARGO.hucre || 0) > 0 && yakit < tank() - 5) h += `<button class="gpb ${yakit < 8 ? 'y' : ''}" type="button" data-g="hucre">🔋 ${T('Yakıt hücresi', 'Fuel cell')} ×${KARGO.hucre} · +10 ⛽</button>`;
  if (oyunda && !limanP && !HM.acik && !kapsul && !YR) { const P = yarisYakin(); if (P) h += `<button class="gpb y" type="button" data-g="yaris">🏁 ${esc(P.ad)}: ${T('Yarışı başlat', 'Start the race')}</button>`; }
  if (oyunda && !limanP && !HM.acik && YR) h += `<button class="gpb" type="button" data-g="yarisBit">✕ ${T('Yarışı bırak', 'Quit the race')}</button>`;
  if (oyunda && !limanP && !HM.acik && !kapsul && kaynP && kaynP.P && KOL && kaynP.id === KOL.id) h += `<button class="gpb y" type="button" data-g="kolonim">🏠 ${esc(KOL.ad)}</button>`;
  else if (oyunda && !limanP && !HM.acik && !kapsul && kaynP && kaynP.P && !KOL && !kaynP.kol && KOL_TIP.includes(kaynP.tip) && KESIF.has('p:' + kaynP.id)) h += `<button class="gpb" type="button" data-g="kolkur">🏠 ${T('Koloni kur', 'Found a colony')}</button>`;
  if (oyunda && !limanP && !HM.acik && !kapsul && astYakin && (acikMi('maden') || madenLazer)) h += `<button class="gpb ${madenLazer ? 'y' : ''}" type="button" data-g="lazer">🔦 ${madenLazer ? T('Lazeri kapat', 'Laser off') : T('Madencilik lazeri', 'Mining laser')}</button>`;
  if (oyunda && !limanP && !HM.acik && !kapsul && kasaYakin()) h += `<button class="gpb y" type="button" data-g="kasa">🔓 ${T('Veri kasasını hackle', 'Hack the data vault')}</button>`;
  if (oyunda && !limanP && !HM.acik && ROTA.length && !rotaAktif && !oto) h += `<button class="gpb" type="button" data-g="rota">🧭 ${T('Rotaya devam', 'Resume route')} · ${ROTA.length}</button>`;
  if (oyunda && !limanP && !HM.acik && izYakin) { const v = izYakin; if (v.t === 'enkaz' && !kapsul) h += `<button class="gpb y" type="button" data-g="izal">📦 ${esc(String(v.n).slice(0, 16))}${T('’in enkazını topla', '’s wreck: salvage')}</button>`; else if (v.t === 'isaret') h += `<button class="gpb" type="button" data-g="izbeg" ${(ST.izBeg || []).includes(v.id) ? 'disabled' : ''}>👍 ${esc(String(v.n).slice(0, 16))} · ${v.b || 0}</button>`; }
  if (oyunda && !limanP && !HM.acik && !kapsul && skYakin) { const es = skEs(skYakin); h += `<button class="gpb w" type="button" data-g="sk">🌀 ${T('Geçit', 'Gate')} → ${esc(L(galaksi(es.gx, es.gy).ad))} · ⛽ 2</button>`; }
  if (oyunda && !limanP && !HM.acik && !kapsul && KORS.length && SILAHLAR.size > 1) h += `<button class="gpb" type="button" data-g="silah">${SILAH[silahS].e} ${L(SILAH[silahS].ad)} ⟳ <small>R</small></button>`;
  if (oyunda && !limanP && !HM.acik && !kapsul && ESK.length) h += `<button class="gpb" type="button" data-g="esk">🛡 ${T('Eskort', 'Escort')} ×${ESK.length}: ${L(ESK_EMIR[eskEmir])} <small>G</small></button>`;
  if (oyunda && !limanP && !HM.acik && !kapsul && korsanLimanYakin()) h += `<button class="gpb" type="button" data-g="borsa" style="border-color:rgba(255,92,110,.7);color:#FFB3BC">☠ ${T('Kara borsaya yanaş', 'Dock at the black market')}</button>`;
  if (oyunda && !limanP && !HM.acik && bankaYakin()) h += `<button class="gpb y" type="button" data-g="banka">🏦 ${T('Merkez Bankası’na yanaş', 'Dock at the Central Bank')}</button>`;
  if (oyunda && !limanP && !HM.acik && !kapsul) {
    if (kaynP) { const m = MAL[KAYN[kaynP.tip]], ik = kaynP.kuyruk ? '☄' : kaynP.nebula ? '🌫' : '⛏'; h += kazP === kaynP ? `<button class="gpb on" type="button" data-g="kaz">${ik} ${T('Topluyor', 'Collecting')} ${m.e} ${KOTA_N - kotaKal(kaynP)}/${KOTA_N} · ${T('Durdur', 'Stop')}</button>` : `<button class="gpb y" type="button" data-g="kaz">${ik} ${T('Topla', 'Collect')}: ${m.e} ${L(m.ad)}</button>`; }
    if (kaynP && kaynP.P) {
      const kk = kkBul(kaynP);
      if (kk) {
        h += `<button class="gpb" type="button" data-g="kal">⚑ ${T('Karakol', 'Outpost')} ${kk.sv}: ${MAL[KAYN[kaynP.tip]].e} ${kkStok(kk)}/${kkKap(kk)} · ${T('al', 'collect')}</button>`;
        if (kk.sv < 5) h += `<button class="gpb" type="button" data-g="kup" ${kredi < 2000 * kk.sv ? 'disabled' : ''}>⬆ ${T('Seviye', 'Level')} ${kk.sv + 1} · ${SAYI(2000 * kk.sv)} 💰</button>`;
        if (kk.sv >= 3 && yakit < tank() - 1) h += `<button class="gpb" type="button" data-g="kyak">⛽ ${T('Yakıt al', 'Refuel')}</button>`;
        if (kk.sv >= 5 && can < maxCan() - 1) h += `<button class="gpb" type="button" data-g="konar">🔧 ${T('Onar', 'Repair')}</button>`;
        if (kk.sv >= 5 && !kk.koloni) h += `<button class="gpb w" type="button" data-g="kkol" ${kredi < KOL_F ? 'disabled' : ''}>🏙 ${T('Koloniye dönüştür', 'Turn into a colony')} · ${SAYI(KOL_F)} 💰</button>`;
        if (kk.koloni) { const vg = kkVergi(kk); h += `<button class="gpb y" type="button" data-g="kvergi" ${vg < 1 ? 'disabled' : ''}>🏙 ${esc(kk.koloni.ad)} · 👥 ${nufYaz(kkNufus(kk))} · ${T('vergi', 'taxes')} ${SAYI(vg)} 💰</button>`; if (Object.keys(KARGO).length) h += `<button class="gpb" type="button" data-g="ksat">📦 ${T('Kargoyu kolonine sat', 'Sell cargo to your colony')}</button>`; }
      } else if (KARAKOL.length < KK_MAX) h += `<button class="gpb" type="button" data-g="kkur" ${kredi < KK_F ? 'disabled' : ''}>🏗 ${T('Karakol kur', 'Build outpost')} · ${SAYI(KK_F)} 💰</button>`;
    }
  }
  if (oyunda && !limanP && !HM.acik) {
    if (enkazP) h += `<button class="gpb y" type="button" data-g="enkaz">📦 ${T('Enkazı topla', 'Salvage wreck')}</button>`;
    if (imdatP) h += `<button class="gpb y" type="button" data-g="imdat" ${yakit < 5 ? 'disabled' : ''}>⛽ ${T('5 yakıt ver', 'Give 5 fuel')} · ${esc(imdatP.ad)}</button>`;
    if (HIK.kapi && yakinKapi()) h += `<button class="gpb w" type="button" data-g="kapi">⛩ ${T('Kapıdan geç', 'Use the gate')}</button>`;
    if (takili('patlama') && KORS.length) h += `<button class="gpb ${patlamaT > 0 ? '' : 'w'}" type="button" data-g="patla" ${patlamaT > 0 ? 'disabled' : ''}>💥 ${patlamaT > 0 ? Math.ceil(patlamaT) + ' sn' : T('Patlama (Q)', 'Burst (Q)')}</button>`;
    if (kalintiP) h += `<button class="gpb y" type="button" data-g="kalinti">🏛 ${T('Kalıntıyı incele', 'Investigate ruins')}</button>`;
    if (balinaP) h += `<button class="gpb y" type="button" data-g="balina">🐋 ${T('Balinaları gözlemle', 'Observe the whales')}</button>`;
    const oy = oyuncuYakin(1600);
    if (oy) { const ad = esc(String(oy.e.v.n || '?').slice(0, 16)); h += `<button class="gpb" type="button" data-g="oy" data-e="👋">👋 ${T('Selam ver', 'Wave')} · ${ad}</button>`; for (const em of OY_EMO) h += `<button class="gpb" type="button" data-g="oy" data-e="${em}">${em}</button>`; h += `<button class="gpb" type="button" data-g="hed" ${kredi < HED_K || hedT > 0 ? 'disabled' : ''}>🎁 ${hedT > 0 ? Math.ceil(hedT) + ' sn' : SAYI(HED_K) + ' 💰'}</button>`; }
    if (yanasP) h += `<button class="gpb y" type="button" data-g="yanas">🛬 ${T('Yanaş', 'Dock')}: ${esc(kolAd(yanasP))}</button>`;
    if (mod === 'oto' && oto && otoV) {
      h += `<button class="gpb ${oto.boost ? 'on' : ''}" type="button" data-g="boost">⚡ ${oto.boost ? T('Normal hız', 'Normal speed') : T('Hızlan', 'Boost')}</button>`;
      if (oto.warp || SH.warp > 0.2) h += `<button class="gpb w on" type="button" data-g="warp">⏹ ${T('Warp’tan çık', 'Exit warp')}</button>`;
      else if (otoV.kal > 60000 && !kapsul) h += `<button class="gpb w" type="button" data-g="warp" ${yakit <= 0 ? 'disabled' : ''}>🌀 Warp · ⛽ ~${Math.max(1, Math.ceil((otoV.kal - 15000) / SEK * (1 - YUK.warp * 0.1)))}</button>`;
    }
  }
  if (h !== gpImza || !gpImza) { gpImza = h; $('gp').innerHTML = h; gpKonum(); }
}
$('gp').addEventListener('click', e => {
  const b = e.target.closest('[data-g]'); if (!b || b.disabled) return; e.stopPropagation(); SES.baslat();
  const g = b.dataset.g;
  if (g === 'kaz' && kaynP) { kazP ? kazDur() : kazBasla(kaynP); return; }
  if (g === 'yanas' && yanasP) limanAc(yanasP); else if (g === 'boost') otoBoost(); else if (g === 'warp') otoWarp();
  else if (g === 'kapi') kapiPencere();
  else if (g === 'kalinti' && kalintiP) bulmacaAc(kalintiP);
  else if (g === 'oy') oySelam(b.dataset.e);
  else if (g === 'kgit') kapsulGit();
  else if (g === 'sarf') sarfKullan(b.dataset.k);
  else if (g === 'tamir') tamirAc(b.dataset.k);
  else if (g === 'istn') istnAc();
  else if (g === 'banka') bankaAc();
  else if (g === 'lonca') tpAc('lon');
  else if (g === 'inis' && kaynP) inisAc(kaynP);
  else if (g === 'ist') { const G = istYakin(); if (G) istAc(G); }
  else if (g === 'solucan') { const o = solucanYakin(); if (o) solucanGir(o); }
  else if (g === 'sk' && skYakin) skGec(skYakin);
  else if (g === 'kolonim') kolAc();
  else if (g === 'yaris') { const P = yarisYakin(); if (P) yarisBasla(P); }
  else if (g === 'yarisBit') { YR = null; duyur('🏁 ' + T('Yarış bırakıldı', 'Race abandoned'), 'kesif'); gpImza = ''; }
  else if (g === 'kolkur') { if (!kilitli('kolkur')) kolKur(kaynP); }
  else if (g === 'lazer') { madenLazer = !madenLazer && !!astYakin; SES.tik(); }
  else if (g === 'kasa') { const o = kasaYakin(); if (o) kasaHack(o); }
  else if (g === 'rota') rotaBaslat();
  else if (g === 'izal' && izYakin) izTopla(izYakin);
  else if (g === 'izbeg' && izYakin) izBegen(izYakin);
  else if (g === 'hucre' && KARGO.hucre > 0) { KARGO.hucre--; if (!KARGO.hucre) delete KARGO.hucre; yakit = Math.min(tank(), yakit + 10); duyur('🔋 ' + T('Yakıt hücresi takıldı', 'Fuel cell plugged in'), 'kesif', '+10 ⛽'); SES.tik(); gpImza = ''; }
  else if (g === 'silah') silahDegis();
  else if (g === 'esk') eskEmirDegis();
  else if (g === 'zula') { const z = zulaYakin(); if (z) zulaAc(z); }
  else if (g === 'snb') { const o = snbYakin(); if (o) snbTopla(o); }
  else if (g === 'borsa') { const G = korsanLimanYakin(); if (G) borsaAc(G); }
  else if (g === 'hed') oyHediye();
  else if (g === 'balina' && balinaP) { KESIF.add('w:' + balinaP.id); kazan(250, 'kesif'); if (Math.random() < 0.25) setTimeout(() => planVer('balina'), 1500); ST.balina = (ST.balina || 0) + 1; duyur('🐋 ' + T('Uzay balinaları: ', 'Space whales: ') + '<b>' + esc(balinaP.ad) + '</b>', 'galaksi', T('Şarkılarını kaydettin · +250 💰', 'You recorded their song · +250 💰')); SES.galaksi(); basarimKontrol(); }
  else if (g === 'enkaz' && enkazP) enkazTopla(enkazP);
  else if (g === 'imdat' && imdatP) imdatVer(imdatP);
  else if (g === 'kkur' && kaynP) kkKur(kaynP);
  else if (g === 'kal' && kaynP) kkAl(kkBul(kaynP), kaynP);
  else if (g === 'kup' && kaynP) kkYukselt(kkBul(kaynP));
  else if (g === 'kyak') { yakit = tank(); SES.tik(); duyur('⛽ ' + T('Karakoldan yakıt alındı', 'Refuelled at your outpost')); }
  else if (g === 'patla') patlamaKullan();
  else if (g === 'kkol' && kaynP) kkKoloni(kkBul(kaynP), kaynP);
  else if (g === 'kvergi' && kaynP) { const kk = kkBul(kaynP), vg = kkVergi(kk); if (vg > 0) { kazan(vg, 'koloni'); kk.koloni.vt = Date.now(); duyur('🏙 ' + T('Vergi toplandı', 'Taxes collected'), 'koloni', `+${SAYI(vg)} 💰`); SES.koloni(); } }
  else if (g === 'ksat') { let top = 0; for (const m in KARGO) { top += MAL[m].f * KARGO[m]; delete KARGO[m]; } top = Math.round(top * 1.1); kazan(top); duyur('🏙 ' + T('Kargo kolonine satıldı', 'Cargo sold to your colony'), 'koloni', `+${SAYI(top)} 💰`); SES.koloni(); }
  else if (g === 'konar') { can = maxCan(); SES.tik(); duyur('🔧 ' + T('Karakolda onarıldı', 'Repaired at your outpost')); }
  gpImza = ''; gpYaz(); kaydet();
});
$('gp').addEventListener('pointerdown', e => e.stopPropagation());

/* ================= kaynak toplama (kolonisiz gezegenler) ================= */
function kazBasla(p) {
  if (kapsul) { duyur('🫁 ' + T('Kapsülle kaynak toplanamaz', 'Cannot collect from the pod'), 'uyari'); return; }
  if (kotaKal(p) <= 0) { duyur('⛏ ' + T('Bu gezegende şimdilik toplanacak kaynak kalmadı', 'Nothing left to mine here for now'), 'uyari', T('Bir saat sonra yenilenir', 'Refills in an hour')); return; }
  if (kargoDolu() >= kapasite()) { duyur('📦 ' + T('Ambar dolu', 'Cargo hold full'), 'uyari', T('Bir kolonide sat ya da tersanede ambarı büyüt', 'Sell at a colony or enlarge the hold at a shipyard')); return; }
  kazP = p; kazT = 0; oto = null; SES.tik(); gpImza = ''; gpYaz();
}
function kazDur() { if (!kazP) return; kazP = null; gpImza = ''; gpYaz(); kaydet(); }
function kazAdim(dt) {
  if (!kazP) return;
  kazT += dt; if (kazT < (takili('cekici') ? 0.7 / (1 + 0.3 * (tlv('cekici') - 1)) : 1.4)) return; kazT = 0;
  const p = kazP, m = KAYN[p.tip], sa = Math.floor(Date.now() / 3.6e6);
  if (kotaKal(p) <= 0) { duyur('⛏ ' + T('Kaynak tükendi', 'Deposit depleted'), 'kesif', T('Bir saat sonra yenilenir', 'Refills in an hour')); kazDur(); return; }
  if (kargoDolu() >= kapasite()) { duyur('📦 ' + T('Ambar doldu', 'Cargo hold full'), 'kesif', T('Bir kolonide satabilirsin', 'Sell it at a colony')); kazDur(); return; }
  KARGO[m] = (KARGO[m] || 0) + 1; if (p.kuyruk) ST.kuyruk++; if (p.nebula) ST.nebula++; const q = KOTA[p.id]; KOTA[p.id] = { s: sa, n: (q && q.s === sa ? q.n : 0) + 1 };
  for (const k in KOTA) if (KOTA[k].s !== sa) delete KOTA[k];
  SES.tik(); gpImza = ''; gpYaz();
}

/* ================= görevler ================= */
function koloniBul(sx, sy, R) { const L2 = []; for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const s = sistem(sx + i, sy + j); if (!s) continue; for (const p of s.gez) if (p.kol) L2.push(p); } return L2; }
function gorevHedef(g) {
  if (g.tip === 'imdat') return { x: g.x, y: g.y, dur: 220, ad: g.ad };
  if ((g.tip === 'yan' || g.tip === 'dip') && g.hs) { const s2 = sistem(g.hs[0], g.hs[1]), q = s2 && s2.gez[g.hs[2]]; return q ? { p: q, ad: g.ad } : null; }
  if (g.tip === 'kelle' || g.tip === 'kervan' || g.tip === 'yan') return { x: g.x, y: g.y, dur: 0, ad: g.ad };
  if (g.tip === 'hikaye') return hikHedef(g);
  if (g.tip === 'kesif') { const tm = temel(g.hs[0], g.hs[1]); return tm ? { tm, ad: g.ad } : null; }
  const s = sistem(g.hs[0], g.hs[1]); const p = s && s.gez[g.hs[2]]; return p ? { p, ad: g.ad } : null;
}
const gEm = g => ({ kesif: '🔭', yolcu: '🧑‍🚀', imdat: '🆘', hikaye: '⭐', kelle: '☠', kervan: '🚚', istila: '👾', yan: '📼', dip: '🕊' }[g.tip] || '📦');
const gSay = () => GOREV.filter(g => g.tip !== 'imdat' && g.tip !== 'hikaye' && g.tip !== 'kervan' && g.tip !== 'istila' && g.tip !== 'yan').length;
function gorevMetin(g) {
  const sek = g.hs ? `${T('Sektör', 'Sector')} ${g.hs[0]} : ${g.hs[1]}` : '', yildiz = g.oz ? ' ⭐' : '';
  if (g.tip === 'hikaye' && g.a >= 16) return `📡 <b>${T('Yankı', 'Echo')} · ${T('Adım', 'Step')} ${g.a - 15}/3</b> — ${L(HIKM4[g.a === 16 ? 16 : HIK.yol + g.a])}<small>${esc(g.ad)}</small>`;
  if (g.tip === 'hikaye' && g.a >= 11) return `👁 <b>${T('Gölgeler', 'The Shadows')} · ${T('Adım', 'Step')} ${g.a - 10}/4</b> — ${L(HIKM3[g.a])}${g.a === 13 ? ` (${HIK.parca || 0}/3)` : ''}<small>${esc(g.ad)}</small>`;
  if (g.tip === 'hikaye' && g.a >= 6) return `⛩ <b>${T('Kadim Kapı', 'Ancient Gate')} · ${T('Adım', 'Step')} ${g.a - 5}/4</b> — ${L(HIKM2[g.a])}<small>${esc(g.ad)}</small>`;
  if (g.tip === 'hikaye') return `⭐ <b>Umut-7 · ${T('Adım', 'Step')} ${g.a}/4</b> — ${L(HIKM[g.a])}<small>${esc(g.ad)}${sek ? ' · ' + sek : ''}</small>`;
  if (g.tip === 'yan') { const Z = YANZ[g.z]; return `📼 <b>${L(Z.ad)} · ${T('Adım', 'Step')} ${g.a + 1}/${Z.adim.length}</b> — ${L(Z.adim[g.a].m)}<small>${esc(g.ad)}</small>`; }
  if (g.tip === 'istila') return `👾 <b>${T('Uzaylı istilası', 'Alien raid')}: ${esc(g.ad)}</b> — ${T('koloniyi savun', 'defend the colony')}<small>⏳ ${Math.max(0, Math.ceil((g.son - Date.now()) / 60000))} ${T('dk', 'min')}</small>`;
  if (g.tip === 'kervan') return `🚚 <b>${T('Kervanın saldırı altında', 'Your convoy is under attack')}</b> — ${T('yetiş ve korsanları kov', 'get there and drive off the pirates')}<small>${esc(g.ad)} · ⏳ ${Math.max(0, Math.ceil((g.son - Date.now()) / 60000))} ${T('dk', 'min')}</small>`;
  if (g.tip === 'kelle') return `☠ <b>${T('Aranan', 'Wanted')}: ${esc(g.ad)}</b> — ${T('bul ve yok et', 'find and destroy')}<small>${sek} · 🛡 ${g.kc}</small>`;
  if (g.tip === 'imdat') return `🆘 <b>${T('İmdat', 'Distress')}: ${esc(g.ad)}</b> — ${T('5 yakıt götür', 'bring 5 fuel')}<small>${sek}</small>`;
  if (g.tip === 'teslim') return T(`📦 <b>${g.yuk} birim kargo</b> → ${esc(g.ad)}`, `📦 <b>${g.yuk} units of cargo</b> → ${esc(g.ad)}`) + yildiz + `<small>${esc(g.sis)}${T(' sistemi', ' system')} · ${sek}</small>`;
  if (g.tip === 'yolcu') return T(`🧑‍🚀 <b>${g.kisi} yolcu</b> → ${esc(g.ad)}`, `🧑‍🚀 <b>${g.kisi} passengers</b> → ${esc(g.ad)}`) + yildiz + `<small>${esc(g.sis)}${T(' sistemi', ' system')} · ${sek}</small>`;
  return T(`🔭 <b>Yıldız sistemini keşfet</b>`, `🔭 <b>Discover the star system</b>`) + yildiz + `<small>${sek}</small>`;
}
const odulYaz = g => g.odul ? `+${SAYI(g.odul)} 💰` : '⭐';
function gorevTeklif(p) {
  const saat = Math.floor(Date.now() / 3.6e6), r = rng(h32(p.seed, saat, 31)), sx = p.s.t.sx, sy = p.s.t.sy, L2 = [];
  const kols = koloniBul(sx, sy, 5).filter(q => q !== p);
  for (let j = 0; j < 4; j++) {
    const id = p.id + '@' + saat + '#' + j, tur = r(), yolcu = r() < 0.4;
    if (tur < 0.68 && kols.length) {
      const q = kols[(r() * kols.length) | 0], ds = Math.hypot(q.s.x - p.s.x, q.s.y - p.s.y) / SEK, yuk = yolcu ? 0 : 3 + ((r() * 10) | 0), kisi = 2 + ((r() * 24) | 0);
      if (!ALINAN.has(id)) L2.push({ id, k: p.id, tip: yolcu ? 'yolcu' : 'teslim', h: q.id, hs: [q.s.t.sx, q.s.t.sy, q.i], ad: kolAd(q), sis: q.s.t.ad, yuk, kisi: yolcu ? kisi : 0, odul: Math.round((yolcu ? 60 + kisi * 4 : 80 + yuk * 7) + ds * 65 + r() * 40) });
    } else {
      let hd = null; for (let k = 0; k < 40 && !hd; k++) { const a = r() * TAU, dd = 3 + r() * 6, tm = temel(sx + Math.round(Math.cos(a) * dd), sy + Math.round(Math.sin(a) * dd)); if (tm && !KESIF.has('s:' + tm.k)) hd = tm; }
      if (hd && !ALINAN.has(id)) { const ds = Math.hypot(hd.x - p.s.x, hd.y - p.s.y) / SEK; L2.push({ id, tip: 'kesif', h: 's:' + hd.k, hs: [hd.sx, hd.sy], ad: T('Sektör ', 'Sector ') + hd.sx + ' : ' + hd.sy, odul: Math.round(140 + ds * 45 + r() * 30), yuk: 0 }); }
    }
  }
  if (itSv(p) >= 2 && kols.length) {   // dost kolonilere özel iş
    const id = p.id + '@' + saat + '#oz', q = kols[(r() * kols.length) | 0], ds = Math.hypot(q.s.x - p.s.x, q.s.y - p.s.y) / SEK, yuk = 4 + ((r() * 8) | 0);
    if (!ALINAN.has(id)) L2.unshift({ id, k: p.id, oz: 1, tip: 'teslim', h: q.id, hs: [q.s.t.sx, q.s.t.sy, q.i], ad: kolAd(q), sis: q.s.t.ad, yuk, kisi: 0, odul: Math.round((120 + yuk * 9 + ds * 90) * 1.6) });
  }
  return L2;
}
function gorevKesif(k) {
  for (const g of GOREV.slice()) if (g.tip === 'kesif' && g.h === k) { kazan(g.odul); ST.gorev++; GOREV = GOREV.filter(x => x !== g); setTimeout(() => { duyur('✅ ' + T('Keşif görevi tamamlandı', 'Exploration mission complete'), 'koloni', `+${SAYI(g.odul)} 💰`); SES.koloni(); }, 600); gorevYaz(); }
}
let gorevAcik = !DOKUN;
function gorevYaz() {
  $('gorevCip').hidden = !GOREV.length; $('gorevSay').textContent = GOREV.length;
  if (diyalogAcik) return;
  const P = $('gorevPanel'); P.hidden = !GOREV.length || !gorevAcik || !oyunda;
  if (P.hidden) { P.innerHTML = ''; return; }
  const t = simT(), sira = GOREV.map((g, i) => { const h = gorevHedef(g), [x, y] = h ? otoPos(h, t) : [SH.x, SH.y]; return { g, i, d: Math.hypot(x - SH.x, y - SH.y) }; }).sort((a, b) => a.d - b.d);
  const html = sira.map(({ g, i, d }) => `<div class="gv"><div>${gorevMetin(g)}<small style="color:var(--altin)">${odulYaz(g)} · <span style="color:var(--acc)">📍 ${mesafeYaz(d)}</span></small></div><button class="kb" type="button" data-git="${i}">${T('Git', 'Go')}</button></div>`).join('');
  if (html !== P._h) { P._h = html; P.innerHTML = html; }
}
$('gorevCip').onclick = () => { gorevAcik = !gorevAcik; gorevYaz(); SES.tik(); };
$('gorevPanel').addEventListener('click', e => {
  const b = e.target.closest('[data-git]'); if (!b) return; const g = GOREV[+b.dataset.git], h = g && gorevHedef(g); if (!h) return;
  const [x, y] = otoPos(h, simT()), tm = h.tm || (h.p && h.p.s.t);
  wp = tm ? { x: tm.x, y: tm.y, k: tm.k, ad: g.ad } : { x, y, k: '', ad: g.ad };
  if (mod === 'oto') { oto = h; duyur('🤖 ' + T('Otopilot: ', 'Autopilot: ') + '<b>' + esc(g.ad) + '</b>', 'kesif', mesafeYaz(Math.hypot(x - SH.x, y - SH.y))); }
  else duyur('🏁 ' + T('Rota: ', 'Route: ') + esc(g.ad), 'kesif', mesafeYaz(Math.hypot(x - SH.x, y - SH.y)) + T(' · otopilota geçersen gemi kendisi gider', ' · switch to autopilot to fly there automatically'));
  SES.tik(); kaydet();
});

/* ================= liman (koloniye yanaşma) ================= */
function limanAc(p) {
  limanP = p; yanasP = null; SH.vx = SH.vy = 0; SH.warp = 0; SH.sarj = 0; oto = null; kazP = null; KORS.length = 0; MERMI.length = 0; gpYaz();
  if (!ZIY.some(z => z[0] === p.s.t.sx && z[1] === p.s.t.sy && z[2] === p.i) && !ITIBAR[p.id]) defter((yabanciMi(p) ? IRK[p.kol.irk].e + ' ' : '🏙 ') + kolAd(p) + ' kolonisine ilk kez yanaştım.', (yabanciMi(p) ? IRK[p.kol.irk].e + ' ' : '🏙 ') + 'Docked at ' + kolAd(p) + ' for the first time.');
  sonLiman = [p.s.t.sx, p.s.t.sy, p.i]; ST.yanas++; { const zk = sonLiman.join(','); const zi = ZIY.findIndex(z => z.join(',') === zk); if (zi >= 0) ZIY.splice(zi, 1); ZIY.unshift(sonLiman.slice()); if (ZIY.length > 16) ZIY.length = 16; } kacakTara(p); if (yabanciMi(p)) ST.temas = (ST.temas || 0) + 1;
  let top = 0, n = 0;
  for (const g of GOREV.slice()) if ((g.tip === 'teslim' || g.tip === 'yolcu') && g.h === p.id) { top += Math.round(g.odul * (g.tip === 'yolcu' ? 1 + 0.25 * mSay('kabin') : 1)); n++; GOREV = GOREV.filter(x => x !== g); if (g.k) itEkle(g.k, 3); }
  if (n) { kazan(top, 'gorev'); frEkle('birlik', n); ST.gorev += n; itEkle(p.id, 5 * n); setTimeout(() => { duyur('✅ ' + T(`${n} görev tamamlandı`, `${n} mission${n > 1 ? 's' : ''} complete`), 'koloni', `+${SAYI(top)} 💰`); SES.koloni(); }, 300); }
  if (wp && wp.k === p.s.t.k) wp = null;
  { let tm = 0; for (const k in MODUL) if (MODUL[k] < 100) { tm += 100 - MODUL[k]; MODUL[k] = 100; } if (tm > 5) setTimeout(() => duyur('🔧 ' + T('Liman ekibi gemi sistemlerini onardı', 'The dock crew repaired your ship systems'), 'koloni'), 500); }
  eskMaas(); ekipIyiles(); limanSek = kapsul ? 'gemi' : 'pazar'; limanYaz(); $('liman').hidden = false; limanSahne(p); gorevYaz(); SES.koloni(); basarimKontrol(); kaydet();
  hikLiman(p); yanLiman(p); $('lmElci').hidden = !yabanciMi(p);
}
function limanKapat() { if (!limanP) return; const p = limanP; limanP = null; $('liman').hidden = true; const [px, py] = gezPos(p, simT()), a = Math.atan2(SH.y - py, SH.x - px); SH.vx = Math.cos(a) * 120; SH.vy = Math.sin(a) * 120; kaydet(); SES.tik(); gorevYaz(); if (HIK.a === 0) setTimeout(hikBasla, 900); else if (HIK.a === 10) setTimeout(() => { if (HIK.a === 10 && !diyalogAcik) diyalog(HIKD3.c0, () => hikAdim(11)); }, 900); else if (HIK.a === 5) setTimeout(() => { if (HIK.a === 5 && !diyalogAcik) diyalog(HIKD2.b0, () => hikAdim(6)); }, 900); }
const IT_SV = [0, 10, 30, 60], IT_AD = [['Yabancı', 'Stranger'], ['Tanıdık', 'Acquaintance'], ['Dost', 'Friend'], ['Müttefik', 'Ally']];
const itibar = p => ITIBAR[p.id] || 0, itSv = p => { const v = itibar(p); return v >= 60 ? 3 : v >= 30 ? 2 : v >= 10 ? 1 : 0; };
function itEkle(id, n) { const once = ITIBAR[id] || 0; ITIBAR[id] = once + n; const sv = v => v >= 60 ? 3 : v >= 30 ? 2 : v >= 10 ? 1 : 0; if (sv(ITIBAR[id]) > sv(once)) setTimeout(() => { duyur('🤝 ' + T('İtibar arttı: ', 'Reputation up: ') + '<b>' + L(IT_AD[sv(ITIBAR[id])]) + '</b>', 'koloni', T('Fiyatlar iyileşti', 'Better prices')); SES.koloni(); }, 400); }
const alF = (p, m) => Math.max(1, Math.round(fiyat(p, m) * (BOLGE === 'tuccar' ? 0.93 : 1) * (1 - 0.05 * itSv(p)) * (yabanciMi(p) && arsivTam('uzayli') ? 0.95 : 1) * (tek('c1') ? 0.97 : 1) * (yabanciMi(p) && DIP[p.kol.irk] >= 30 ? 0.9 : 1) * (yabanciMi(p) && DIP[p.kol.irk] <= -30 ? 1.2 : 1) * (gOl('hasat') && (m === 'gida' || m === 'su') ? 0.7 : 1) * (1 - 0.02 * ekipLv('tuccar')) * (FR.tuccar >= 30 ? 0.95 : 1) * (FR.birlik <= -30 && !yabanciMi(p) ? 1.15 : 1)));
const satF = (p, m) => Math.max(1, Math.min(alF(p, m) - 1, Math.round(satFiyat(p, m) * (BOLGE === 'tuccar' ? 1.08 : 1) * (1 + 0.05 * itSv(p)) * (1 + 0.02 * ekipLv('tuccar')) * (FR.tuccar >= 30 ? 1.05 : 1) * (tek('c1') ? 1.03 : 1) * (gOl('fuar') ? 1.15 : 1) * (1 + 0.04 * besLv(p)))));
const IT_BILGI = [['Ticaret yap, görev götür: tanındıkça fiyatlar iyileşir.', 'Trade and deliver: prices improve as they get to know you.'], ['Fiyatlar %5 daha iyi. Dost olunca ⭐ özel işler.', 'Prices 5% better. ⭐ special jobs once you are friends.'], ['Fiyatlar %10 daha iyi, ⭐ özel işler. Müttefik: ücretsiz onarım.', 'Prices 10% better, ⭐ special jobs. Ally: free repairs.'], ['Fiyatlar %15 daha iyi, ücretsiz onarım, yarı fiyat yakıt.', 'Prices 15% better, free repairs, half-price fuel.']];
function haberYaz() {
  const L2 = piyasaOlay(Math.floor(Math.floor(SH.x / SEK) / 8), Math.floor(Math.floor(SH.y / SEK) / 8)); if (!L2.length) return '';
  return `<div class="alt" style="font-size:12px;margin:6px 0 0;color:#FFE3A6">📰 ${L2.map(o => `${o.kit ? T('Kıtlık', 'Shortage') : T('Bolluk', 'Glut')}: <b>${esc(kolAd(o.p))}</b> ${MAL[o.m].e} ${L(MAL[o.m].ad)} ×${SAYI(o.kat, 1)} <span style="color:var(--mute)">(${mesafeYaz(Math.hypot(o.p.s.x - SH.x, o.p.s.y - SH.y))})</span>`).join(' · ')}</div>`;
}
function limanYaz() {
  const p = limanP; if (!p) return; const sv = itSv(p), yf = sv >= 3 ? Math.max(1, Math.ceil(yakitFiyat(p) / 2)) : yakitFiyat(p), eksik = Math.max(0, Math.ceil(tank() - yakit)), yk = eksik * yf, mx = maxCan(), onar = sv >= 3 ? 0 : Math.ceil((mx - can) * 1.5);
  $('lmUst').innerHTML = `<h2>${yabanciMi(p) ? IRK[p.kol.irk].e : '🏙'} ${esc(kolAd(p))}</h2><div class="alt" style="margin-bottom:0">${L(p.kol.tip)} · ${esc(p.ad)} · 👥 ${nufYaz(p.kol.nuf * (1 + 0.25 * besLv(p)))} ${besRozet(p)}· 🤝 <b style="color:var(--ink)">${L(IT_AD[sv])}</b> <small>${itibar(p)}${sv < 3 ? '/' + IT_SV[sv + 1] : ''}</small></div>
    <div class="lmEk"><span>💰 ${SAYI(kredi)}</span><span>⛽ ${Math.floor(yakit)}/${tank()}</span><span>📦 ${kargoDolu()}/${kapasite()}</span><span>🛡 ${Math.ceil(can)}/${mx}</span><span style="flex:1"></span>
    ${can < mx - 0.5 ? `<button class="kb al" type="button" data-onar ${kredi < onar ? 'disabled' : ''}>🔧 ${T('Onar', 'Repair')} · ${onar ? SAYI(onar) + ' 💰' : T('ücretsiz', 'free')}</button>` : ''}
    <button class="kb al" type="button" data-yakit ${!eksik || kredi < yf ? 'disabled' : ''}>⛽ ${eksik ? T('Yakıt doldur', 'Refuel') + ' · ' + SAYI(Math.min(yk, Math.floor(kredi / yf) * yf)) + ' 💰' : T('Depo dolu', 'Tank full')}</button></div>
    ${haberYaz()}
    <div class="alt" style="font-size:12px;margin:4px 0 0">🤝 ${L(IT_BILGI[sv])}</div>`;
  document.querySelectorAll('#lmSek button').forEach(b => b.classList.toggle('on', b.dataset.s === limanSek));
  let h = '';
  if (limanSek === 'pazar') {
    const bos = kapasite() - kargoDolu(), u = uret(p);
    if (AG.durum() === 'acik') h += `<div class="dg" style="margin:6px 0 0"><button class="kb al" type="button" data-ppaz>🤝 ${T('Pilot pazarı', 'Pilot market')}</button></div>`;
    h += `<div class="alt" style="margin:4px 0 0;font-size:12.5px">${T('Yeşil: burada üretiliyor (ucuz) · Sarı: burada aranıyor (iyi satılır) · 📈 son 24 saatin fiyatı (nokta: şimdi)', 'Green: produced here (cheap) · Gold: wanted here (sells well) · 📈 last 24 hours of prices (dot: now)')}</div>`;
    for (const m in MAL) {
      const M = MAL[m], al = alF(p, m), sat = satF(p, m), var_ = KARGO[m] || 0, et = u[0].includes(m) ? `<span class="ucuz">↓ ${T('üretim', 'produced')}</span>` : u[1].includes(m) ? `<span class="pahali">↑ ${T('talep', 'demand')}</span>` : '';
      const oz = OZEL.includes(m), alinir = !oz || u[0].includes(m); if (oz && !var_ && !u[1].includes(m) && !u[0].includes(m) && !(YABAN.includes(m) && !yabanciMi(p))) continue;
      const pk = piyasaKat(p, m), haber = pk > 1.5 ? ` <span class="pahali">📰 ${T('kıtlık', 'shortage')} ×${SAYI(pk, 1)}</span>` : pk < 0.6 ? ` <span class="ucuz">📰 ${T('bolluk', 'glut')}</span>` : '';
      const enCok = !alinir ? 0 : Math.min(bos, Math.floor(kredi / al));
      h += `<div class="satir"><div>${M.e} <b>${L(M.ad)}</b> ${et}${haber}${pzEt(p, m)}${fiyatGrafik(p, m)}<small>${!alinir ? '' : T('Al', 'Buy') + ' ' + SAYI(al) + ' · '}${T('Sat', 'Sell')} ${SAYI(sat)} 💰${var_ ? ' · ' + T('Ambarda', 'In hold') + ': <b style="color:var(--ink)">' + var_ + '</b>' : ''}</small></div>
        <div class="dg">${!alinir ? '' : `<button class="kb al" type="button" data-al="${m}" data-n="1" ${enCok < 1 ? 'disabled' : ''}>${T('Al', 'Buy')} 1</button><button class="kb al" type="button" data-al="${m}" data-n="${enCok}" ${enCok < 2 ? 'disabled' : ''}>${T('Al', 'Buy')} ${Math.max(enCok, 0)}</button>`}<button class="kb" type="button" data-sat="${m}" data-n="1" ${var_ < 1 ? 'disabled' : ''}>${T('Sat', 'Sell')} 1</button><button class="kb" type="button" data-sat="${m}" data-n="${var_}" ${var_ < 2 ? 'disabled' : ''}>${T('Hepsini sat', 'Sell all')}</button></div></div>`;
    }
  } else if (limanSek === 'gorev') {
    if (GOREV.length) { h += `<div class="alt" style="margin:6px 0 0;font-weight:900;color:var(--ink)">${T('Aldığın görevler', 'Your missions')} (${gSay()}/4)</div>`; GOREV.forEach((g, i) => { h += `<div class="satir"><div>${gorevMetin(g)}<small style="color:var(--altin)">${odulYaz(g)}</small></div><div class="dg">${g.tip === 'hikaye' ? '' : `<button class="kb" type="button" data-iptal="${i}">${T('Bırak', 'Drop')}</button>`}</div></div>`; }); }
    const tek = gorevTeklif(p);
    h += `<div class="alt" style="margin:12px 0 0;font-weight:900;color:var(--ink)">${T('Bu limandaki işler', 'Jobs at this port')}</div>`;
    if (!tek.length) h += `<div class="alt">${T('Şu an iş yok, sonra tekrar uğra.', 'No jobs right now, come back later.')}</div>`;
    const ar = arananlar(p);
    if (ar.length) { h += `<div class="alt" style="margin:12px 0 0;font-weight:900;color:#FFB3A6">☠ ${T('Aranan korsanlar', 'Wanted pirates')}</div>`; ar.forEach((g, i) => { const dol = gSay() >= 4; h += `<div class="satir"><div>${gorevMetin(g)}<small style="color:var(--altin)">+${SAYI(g.odul)} 💰 · ${mesafeYaz(Math.hypot(g.x - SH.x, g.y - SH.y))}</small></div><div class="dg"><button class="kb al" type="button" data-kelle="${i}" ${dol ? 'disabled' : ''}>${dol ? T('En çok 4', 'Max 4') : T('Avı kabul et', 'Take the bounty')}</button></div></div>`; }); limanP._ar = ar; }
    tek.forEach((g, i) => { const yer = kargoDolu() + (g.yuk || 0) <= kapasite(), dol = gSay() >= 4; h += `<div class="satir"><div>${gorevMetin(g)}<small style="color:var(--altin)">+${SAYI(g.odul)} 💰${g.yuk ? ' · 📦 ' + g.yuk + T(' birim yer kaplar', ' units of space') : ''}</small></div><div class="dg"><button class="kb al" type="button" data-kabul="${i}" ${!yer || dol ? 'disabled' : ''}>${dol ? T('En çok 4', 'Max 4') : !yer ? T('Ambar dolu', 'Hold full') : T('Kabul et', 'Accept')}</button></div></div>`; });
    limanP._tek = tek;
  } else if (limanSek === 'ters') {
    h += `<div class="alt" style="margin:4px 0 0;font-weight:900;color:var(--ink)">🧰 ${T('Teçhizat', 'Equipment')} (${TAK.length}/${slotSay()} ${T('yuva', 'slots')})</div>`;
    for (const k in TEC) {
      const E = TEC[k], var_ = TEKS.has(k), tk = takili(k);
      const dg = tk ? `<button class="kb" type="button" data-tcik="${k}">${T('Çıkar', 'Remove')}</button>` : var_ ? `<button class="kb al" type="button" data-ttak="${k}" ${TAK.length >= slotSay() ? 'disabled' : ''}>${TAK.length >= slotSay() ? T('Yuva dolu', 'Slots full') : T('Tak', 'Equip')}</button>` : E.f < 0 ? `<button class="kb" type="button" disabled>⚒ ${T('Planla üretilir', 'Craft from blueprint')}</button>` : `<button class="kb al" type="button" data-tal="${k}" ${kredi < E.f ? 'disabled' : ''}>${T('Satın al', 'Buy')} · ${SAYI(E.f)} 💰</button>`;
      h += `<div class="satir"><div>${E.e} <b>${L(E.ad)}${var_ ? MK[tlv(k)] : ''}</b>${tk ? ' ✓' : ''}<small>${L(E.ne)}</small></div><div class="dg">${dg}</div></div>`;
    }
    h += silahYaz();
    h += `<div class="alt" style="margin:12px 0 0;font-weight:900;color:var(--ink)">🛠 ${T('Yükseltmeler', 'Upgrades')}</div>`;
    h += `<div class="alt" style="margin:4px 0 0;font-size:12.5px">${T('Gemini geliştir: her parçanın 5 seviyesi var. Yükseltmeler gemi değiştirsen de kalır.', 'Upgrade your ship: every part has 5 levels. Upgrades stay when you switch ships.')}</div>`;
    for (const u of TERS) {
      const L0 = YUK[u.k], son = L0 >= 4, f = son ? 0 : tersFiyat(u, L0);
      h += `<div class="satir"><div>${u.e} <b>${L(u.ad)}</b> <span class="lv">${'●'.repeat(L0 + 1)}${'○'.repeat(4 - L0)}</span><small>${u.ne(L0)}${son ? '' : ' → <b style="color:var(--acc)">' + u.ne(L0 + 1) + '</b>'}</small></div><div class="dg"><button class="kb al" type="button" data-ters="${u.k}" ${son || kredi < f ? 'disabled' : ''}>${son ? T('En üst seviye', 'Maxed') : T('Yükselt', 'Upgrade') + ' · ' + SAYI(f) + ' 💰'}</button></div></div>`;
    }
  } else if (limanSek === 'uret') h += fabrikaYaz(p) + uretYaz(p);
  else if (limanSek === 'ekip') h += ekipYaz(p) + eskortYaz(p);
  else if (limanSek === 'elci') h += elciYaz(p);
  else {
    if (kapsul) h += `<div class="alt" style="margin:6px 0 0;padding:8px 10px;border-radius:12px;background:rgba(255,200,87,.12);color:#FFE3A6;font-weight:800">🫁 ${T('Kapsüldesin: aşağıdan bir gemi seç ya da satın al. Kaşif her zaman ücretsiz.', 'You are in the pod: pick or buy a ship below. The Explorer is always free.')}</div>`;
    h += `<div class="alt" style="margin:4px 0 0;font-size:12.5px">${T('Gemi türünü seç ya da yenisini al. Boyayı ve gemi adını buradan değiştirirsin.', 'Pick a ship or buy a new one. Change the paint and ship name here.')}</div>`;
    for (const k in GEMI) {
      const G = GEMI[k], var_ = GEMILER.has(k), simdi = gemiTip === k; if (G.irk && !var_ && !(yabanciMi(p) && p.kol.irk === G.irk && DIP[G.irk] >= 70)) continue;
      const bil = `${T('Hız', 'Speed')} %${Math.round(G.hiz * 100)} · 📦 ${Math.round(KAP[YUK.kargo] * G.kargo)} · 🛡 ${Math.round(G.can * (1 + YUK.kalkan * 0.25))} · 🔫 ×${G.silah}`;
      const dg = simdi && !kapsul ? `<button class="kb" type="button" disabled>${T('Kullanılıyor', 'In use')}</button>` : var_ ? `<button class="kb al" type="button" data-gsec="${k}">${T('Seç', 'Select')}</button>` : G.f < 0 ? `<button class="kb" type="button" disabled>${T('Hikâyeyi bitir', 'Finish the story')}</button>` : `<button class="kb al" type="button" data-gal="${k}" ${kredi < G.f ? 'disabled' : ''}>${T('Satın al', 'Buy')} · ${SAYI(G.f)} 💰</button>`;
      h += `<div class="satir"><div>🚀 <b>${L(G.ad)}</b>${simdi ? ' ✓' : ''}<small>${L(G.ne)}</small><small>${bil}</small></div><div class="dg">${dg}</div></div>`;
    }
    if (!kapsul) h += `<div class="satir"><div>🧩 <b>${T('Gemi tasarımı', 'Ship design')}</b><small>${T('Modülleri geminin ızgarasına yerleştir: kargo, tank, zırh, taret, itici…', 'Fit modules onto your ship’s grid: cargo, tanks, armour, turrets, thrusters…')} · ${tasarimOzet()}</small></div><div class="dg"><button class="kb al" type="button" data-tsac>🧩 ${T('Tasarla', 'Design')}</button></div></div>`;
    h += `<div class="satir"><div>🎨 <b>${T('Boya', 'Paint')}</b><small>${T('Gövde şeritlerinin rengi', 'Colour of the hull stripes')}</small></div><div class="dg">${RENK.map((c, i) => `<button class="kb" type="button" data-renk="${i}" aria-label="${c}" style="background:${c};width:32px;height:32px;padding:0;${i === gemiRenk ? 'outline:3px solid #fff;outline-offset:1px' : ''}"></button>`).join('')}</div></div>`;
    h += `<div class="satir"><div>✏ <b>${T('Gemi adı', 'Ship name')}</b><small>${T('Geminin altında ve diğer oyunculara görünür', 'Shown under your ship and to other players')}</small></div><div class="dg"><input id="gAd" maxlength="16" value="${esc(gemiAd)}" placeholder="${T('ör. Yıldız Tozu', 'e.g. Stardust')}" style="font:inherit;font-size:14px;padding:6px 9px;border-radius:10px;border:1px solid var(--line);background:rgba(0,0,0,.3);color:var(--ink);width:150px"><button class="kb al" type="button" data-gad>${T('Kaydet', 'Save')}</button></div></div>`;
  }
  $('lmIc').innerHTML = h;
  if (window.limanSahneCiz) limanSahneCiz(p);
}
function gemiSec(k) {
  if (kapsul) { kapsul = false; oks = 0; gemiTip = k; can = maxCan(); TAK = TAK.slice(0, slotSay()); ST.kapsulK = (ST.kapsulK || 0) + 1; basarimKontrol(); gpImza = ''; return true; }
  const yeniKap = Math.round(KAP[YUK.kargo] * GEMI[k].kargo);
  if (kargoDolu() > yeniKap) { duyur('📦 ' + T('Bu gemiye yükün sığmaz: önce biraz sat', 'Your cargo will not fit: sell some first'), 'uyari'); return false; }
  const oran = can / maxCan(); gemiTip = k; can = Math.max(1, maxCan() * oran); TAK = TAK.slice(0, slotSay()); return true;
}
$('liman').addEventListener('click', e => {
  const p = limanP; if (!p) return; const b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.s) { if ({ uret: 1, elci: 1 }[b.dataset.s] && kilitli(b.dataset.s)) return; limanSek = b.dataset.s; SES.tik(); limanYaz(); return; }
  if (b.dataset.isle) { isle(p, b.dataset.isle, +b.dataset.n || 1); limanYaz(); return; }
  if (b.hasAttribute('data-tsac')) { if (!kilitli('tasarim')) tasarimAc(); return; }
  if (b.dataset.silal) { const k = b.dataset.silal, S = SILAH[k]; if (!S || kredi < S.f) return; kredi -= S.f; SILAHLAR.add(k); silahS = k; ST.silahA = (ST.silahA || 0) + 1; duyur(S.e + ' ' + T('Yeni silah: ', 'New weapon: ') + '<b>' + L(S.ad) + '</b>', 'koloni', T('Savaşta R ile değiştir', 'Switch with R in combat')); SES.koloni(); basarimKontrol(); kaydet(); limanYaz(); return; }
  if (b.dataset.silsec) { silahS = b.dataset.silsec; SES.tik(); kaydet(); limanYaz(); return; }
  if (b.dataset.eskal) { if (kilitli('eskort')) return; const k = b.dataset.eskal, E = ESKT[k]; if (!E || kredi < E.f || ESK.length >= ESK_MAX()) return; kredi -= E.f; const e = { t: k, can: E.can, ad: isim(Math.random, 2), x: null, y: null, vx: 0, vy: 0, a: 0, atT: 1 }; ESK.push(e); ST.eskort = (ST.eskort || 0) + 1; duyur(E.e + ' ' + T('Eskort kiralandı: ', 'Escort hired: ') + '<b>' + esc(e.ad) + '</b>', 'koloni', L(E.ad)); SES.koloni(); basarimKontrol(); kaydet(); limanYaz(); return; }
  if (b.dataset.eskcik != null) { const e = ESK.splice(+b.dataset.eskcik, 1)[0]; if (e) duyur('👋 ' + esc(e.ad) + T(' sözleşmesini bitirdi', ' has left your service'), 'kesif'); SES.tik(); kaydet(); limanYaz(); return; }
  if (b.hasAttribute('data-ppaz')) { tpAc('paz'); return; }
  if (b.id === 'lmKalk') { limanKapat(); return; }
  const sv = itSv(p);
  if (b.hasAttribute('data-yakit')) { const yf = sv >= 3 ? Math.max(1, Math.ceil(yakitFiyat(p) / 2)) : yakitFiyat(p), n = Math.min(Math.ceil(tank() - yakit), Math.floor(kredi / yf)); if (n > 0) { kredi -= n * yf; yakit = Math.min(tank(), yakit + n); SES.tik(); } }
  else if (b.hasAttribute('data-onar')) { const f = sv >= 3 ? 0 : Math.ceil((maxCan() - can) * 1.5); if (kredi >= f) { kredi -= f; can = maxCan(); SES.koloni(); } }
  else if (b.dataset.al) { const m = b.dataset.al, f = alF(p, m), n = Math.min(+b.dataset.n, kapasite() - kargoDolu(), Math.floor(kredi / f)); if (n > 0) { pzEkle(p, m, -n); const f1 = alF(p, m); kredi -= Math.min(kredi, Math.round(n * (f + f1) / 2)); KARGO[m] = (KARGO[m] || 0) + n; itEkle(p.id, 1); SES.tik(); } }
  else if (b.dataset.sat) { const m = b.dataset.sat, n = Math.min(+b.dataset.n, KARGO[m] || 0); if (n > 0) { const f0 = satF(p, m); pzEkle(p, m, n); const f1 = satF(p, m); kazan(Math.round(n * (f0 + f1) / 2), 'ticaret'); besEkle(p, m, n); frEkle('tuccar', 0.3); if (yabanciMi(p)) dipEkle(p.kol.irk, 0.4); ekipXp('tuccar', 1); KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; itEkle(p.id, 1); SES.tik(); } }
  else if (b.dataset.kabul != null) { const g = (p._tek || [])[+b.dataset.kabul]; if (g && gSay() < 4 && kargoDolu() + (g.yuk || 0) <= kapasite()) { GOREV.push(g); ALINAN.add(g.id); SES.koloni(); gorevYaz(); } }
  else if (b.dataset.kelle != null) { const g = (p._ar || [])[+b.dataset.kelle]; if (g && gSay() < 4) { GOREV.push(g); ALINAN.add(g.id); SES.koloni(); gorevYaz(); } }
  else if (b.dataset.iptal != null) { const g = GOREV[+b.dataset.iptal]; if (g && g.tip !== 'hikaye') GOREV.splice(+b.dataset.iptal, 1); SES.tik(); gorevYaz(); }
  else if (b.dataset.ters) { const u = TERS.find(x => x.k === b.dataset.ters), L0 = YUK[u.k]; if (L0 < 4) { const f = tersFiyat(u, L0); if (kredi >= f) { const oran = can / maxCan(); kredi -= f; YUK[u.k]++; if (u.k === 'tank') yakit = Math.min(tank(), yakit + (TANK[YUK.tank] - TANK[YUK.tank - 1])); if (u.k === 'kalkan') can = maxCan() * oran; SES.koloni(); duyur('🛠 ' + L(u.ad) + ' → ' + T('seviye ', 'level ') + (YUK[u.k] + 1), 'koloni', u.ne(YUK[u.k])); basarimKontrol(); } } }
  else if (b.dataset.tal) { const k = b.dataset.tal, E = TEC[k]; if (kredi >= E.f && !TEKS.has(k)) { kredi -= E.f; TEKS.add(k); if (TAK.length < slotSay()) TAK.push(k); SES.koloni(); duyur(E.e + ' ' + L(E.ad), 'koloni', L(E.ne)); basarimKontrol(); } }
  else if (b.dataset.ttak) { if (TAK.length < slotSay() && !takili(b.dataset.ttak)) TAK.push(b.dataset.ttak); SES.tik(); }
  else if (b.dataset.tcik) { TAK = TAK.filter(k => k !== b.dataset.tcik); SES.tik(); }
  else if (b.dataset.gsec) { if (gemiSec(b.dataset.gsec)) { SES.koloni(); duyur('🚀 ' + L(GEMI[gemiTip].ad), 'koloni'); } }
  else if (b.dataset.gal) { const k = b.dataset.gal, G = GEMI[k]; if (G.f > 0 && kredi >= G.f) { kredi -= G.f; GEMILER.add(k); defter('🛸 Yeni gemimi aldım: ' + G.ad[0] + '.', '🛸 Bought a new ship: ' + G.ad[1] + '.'); gemiSec(k); SES.koloni(); duyur('🛸 ' + T('Yeni gemi: ', 'New ship: ') + '<b>' + L(G.ad) + '</b>', 'koloni'); basarimKontrol(); } }
  else if (b.dataset.renk != null) { gemiRenk = +b.dataset.renk; SES.tik(); }
  else if (b.dataset.sarf) { const k = b.dataset.sarf, E = SARFE[k]; if (SARF[k] < SARF_MAX && kredi >= E.k && Object.entries(E.mal).every(([m, n]) => (KARGO[m] || 0) >= n)) { for (const [m, n] of Object.entries(E.mal)) { KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; } kredi -= E.k; SARF[k]++; ST.uret = (ST.uret || 0) + 1; SES.koloni(); basarimKontrol(); } }
  else if (b.dataset.mk) { const k = b.dataset.mk, M = mkTarif(k); if (TEKS.has(k) && tlv(k) < 3 && kredi >= M.k && Object.entries(M.mal).every(([m, n]) => (KARGO[m] || 0) >= n)) { for (const [m, n] of Object.entries(M.mal)) { KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; } kredi -= M.k; TLV[k] = tlv(k) + 1; ST.mk = (ST.mk || 0) + 1; patlamaEkle(SH.x, SH.y, 40, '127,227,255'); SES.galaksi(); duyur('⬆ ' + TEC[k].e + ' <b>' + L(TEC[k].ad) + MK[TLV[k]] + '</b>', 'koloni', L(MK_NE[k] || ['', ''])); basarimKontrol(); } }
  else if (b.dataset.dip) { elciIslem(p, b.dataset.dip); }
  else if (b.dataset.egit != null) ekipEgit(p, +b.dataset.egit);
  else if (b.dataset.ise != null) { const a = (p._aday || [])[+b.dataset.ise]; if (a && EKIP.length < EKIP_MAX() && kredi >= a.f) { kredi -= a.f; defter(ROL[a.rol].e + ' ' + a.ad + ' mürettebata katıldı (' + ROL[a.rol].ad[0] + ').', ROL[a.rol].e + ' ' + a.ad + ' joined the crew (' + ROL[a.rol].ad[1] + ').'); EKIP.push({ id: a.id, ad: a.ad, rol: a.rol, lv: a.lv, xp: 0, maas: Math.round(a.maas * (HUY[huyOf(a)].maas || 1)), huy: huyOf(a) }); SES.koloni(); duyur(ROL[a.rol].e + ' <b>' + esc(a.ad) + '</b> ' + T('mürettebata katıldı', 'joined the crew'), 'koloni', ROL[a.rol].ne(a.lv)); basarimKontrol(); } }
  else if (b.dataset.kov != null) { EKIP.splice(+b.dataset.kov, 1); SES.tik(); }
  else if (b.hasAttribute('data-kvb')) { p._kvb = (+(p._kvb || 0) + 1); p._kvm = null; SES.tik(); }
  else if (b.hasAttribute('data-kvm')) { const ml = p._kvMl || [], i = ml.indexOf(p._kvM); p._kvm = ml[(i + 1) % ml.length]; SES.tik(); }
  else if (b.dataset.kvkur) { const hb = p._kvHed; if (hb && KERVAN.length < kvMax() && kredi >= KV_F) { kredi -= KV_F; defter('🚚 ' + kolAd(p) + ' ile ' + kolAd(hb) + ' arasında bir kervan kurdum.', '🚚 Set up a convoy between ' + kolAd(p) + ' and ' + kolAd(hb) + '.'); KERVAN.push({ a: [p.s.t.sx, p.s.t.sy, p.i], b: [hb.s.t.sx, hb.s.t.sy, hb.i], m: b.dataset.kvkur, t0: Date.now(), n: 0, durT: 0 }); SES.koloni(); duyur('🚚 ' + T('Kervan yola çıktı', 'Convoy on the road'), 'koloni', esc(kolAd(p)) + ' ⇄ ' + esc(kolAd(hb))); basarimKontrol(); } }
  else if (b.dataset.kvsil != null) { KERVAN.splice(+b.dataset.kvsil, 1); GOREV = GOREV.filter(g => g.tip !== 'kervan'); gorevYaz(); SES.tik(); }
  else if (b.dataset.giy) { const k = b.dataset.giy, y = KIYE[k].yuva; KIY[y] = KIY[y] === k ? null : k; if (kapsul) can = Math.min(can, maxCan()); SES.tik(); }
  else if (b.dataset.plal) { const k = b.dataset.plal, f = PLAN[k].pf; if (kredi >= f && !PLANLAR.has(k)) { kredi -= f; PLANLAR.add(k); SES.koloni(); duyur('📜 ' + T('Plan alındı: ', 'Blueprint bought: ') + '<b>' + L(planBilgi(k).ad) + '</b>', 'koloni'); basarimKontrol(); } }
  else if (b.dataset.uret) { const k = b.dataset.uret, P = PLAN[k], bb = planBilgi(k); if (PLANLAR.has(k) && !planVar(k) && kredi >= uretF(P.k) && Object.entries(P.mal).every(([m, n]) => (KARGO[m] || 0) >= n)) { for (const [m, n] of Object.entries(P.mal)) { KARGO[m] -= n; if (!KARGO[m]) delete KARGO[m]; } kredi -= uretF(P.k); ST.uret = (ST.uret || 0) + 1; if (bb.tur === 'tec') { TEKS.add(k); if (TAK.length < slotSay()) TAK.push(k); } else { KIYS.add(k); if (!KIY[bb.yuva]) KIY[bb.yuva] = k; } patlamaEkle(SH.x, SH.y, 30, '255,220,140'); SES.koloni(); duyur('⚒ ' + T('Üretildi: ', 'Crafted: ') + '<b>' + bb.e + ' ' + L(bb.ad) + '</b>', 'koloni', bb.tur === 'tec' ? T('Tersane’de gemine takılı', 'Fitted at the Shipyard') : T('Kıyafetine giyildi', 'Added to your suit')); basarimKontrol(); } }
  else if (b.hasAttribute('data-gad')) { gemiAd = ($('gAd').value || '').trim().slice(0, 16); SES.tik(); duyur('✏ ' + (gemiAd ? T('Gemi adı: ', 'Ship name: ') + '<b>' + esc(gemiAd) + '</b>' : T('Gemi adı silindi', 'Ship name cleared'))); }
  limanYaz(); kaydet();
});

