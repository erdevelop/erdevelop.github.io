/* Küçük Krallık · oyun sistemleri (2)
   Beklenen kayıp ve cesur sefer, baskın şeridi ve sığınma, üst bilgi şeridi, ilk adımlar vurgusu.
   Ana oyun betiğinden ÖNCE yüklenir; yalnızca tanımlar içerir. Oyun hazır olunca sistemInit() çağrılır. */

/* ================= BEKLENEN KAYIP VE CESUR SEFER ================= */
const CESUR_CARPAN = 1.25; // kolay olmayan savaşı kazanınca ganimet çarpanı
/* tahmin + beklenen kayıp: savaş motorunu bir kez çalıştırıp başlangıç ve bitiş ordusunu yakalar */
function tahminD(A, B, def) {
  const eski = window.kkCap, c = window.kkCap = {}; let r;
  try { r = tahminA(A, B, def); } finally { window.kkCap = eski; }
  const sent = kkTot(A), lost = c.A0 ? Math.max(0, kkTot(c.A0) - kkTot(c.A1)) : 0;
  return { r: r, lost: Math.round(lost), sent: sent };
}
function cesurMu(r) { return r === 'kazanırsın' || r === 'çok zorlu' || r === 'kaybedersin'; }
/* hedef kartındaki "beklenen kayıp" satırı */
function w2EkHtml(A, T) {
  if (!T || kkTot(A) < 1) return '';
  const d = tahminD(A, T[0], T[1]), kazan = d.r === 'kolay kazanırsın' || d.r === 'kazanırsın';
  const yarali = Math.floor(d.lost * Math.min(.6, woundFrac()));
  let h = kazan
    ? kkL('Beklenen kayıp: yaklaşık <b>' + fmt(d.lost) + '</b> / ' + fmt(d.sent) + ' asker', 'Expected losses: about <b>' + fmt(d.lost) + '</b> / ' + fmt(d.sent) + ' soldiers')
    : kkL('Bu orduyla büyük olasılıkla <b>kaybedersin</b>: yaklaşık ' + fmt(d.lost) + ' / ' + fmt(d.sent) + ' asker gider', 'With this army you will most likely <b>lose</b>: about ' + fmt(d.lost) + ' / ' + fmt(d.sent) + ' soldiers fall');
  if (d.lost > 0 && yarali > 0) h += kkL(' (' + fmt(yarali) + ' kadarı yaralı olarak revire döner)', ' (about ' + fmt(yarali) + ' return wounded to the infirmary)');
  h += '.';
  if (d.r === 'kazanırsın') h += '<br>🎲 ' + kkL('<b>Cesur sefer:</b> savaş kolay değil; kazanırsan ganimet +%25.', '<b>Bold march:</b> this fight is not easy; win it for +25% loot.');
  return h;
}

/* ================= BASKIN: ŞERİT, SIĞINMA, SAVUNMA EMRİ ================= */
function savCarpan() { return (1 + .02 * Math.min(S.cr || 0, 60)) * (1 + .04 * S.sk.war) * (1 + .02 * (S.rel || 0)) * (1 + (S.won ? (S.won.zafer || 0) * .07 : 0)) * (1 + crB('savas')) * komMul(); }
/* savunma tahmini: defend() ile aynı çarpanlar (sur, gözcü kulesi) */
function savTahmin(E) {
  const A = {}; for (const k in U) { const n = S.ar[k] || 0; if (n > 0) A[k] = n; }
  if (kkTot(A) < 1) return { win: false, lost: 0, sent: 0, bos: true };
  const tv = Math.min(.4, (S.lv.tower || 0) * .05), E2 = {}; for (const k in E) E2[k] = E[k] * (1 - tv);
  const oA = mA, oB = mB, oHA = hA, oHB = hB, cm = savCarpan(), w = raidThreat(); let a, b;
  const eski = window.kkCap; window.kkCap = null;
  try { mA = (1 + .08 * S.lv.tatk) * (1 + vb()) * cm; hA = (1 + .08 * S.lv.tdef) * (1 + vb()) * cm * (1 + (S.lv.wall || 0) * .12) * (1 + (S.won ? (S.won.kale || 0) * .1 : 0)); mB = hB = 1 + .04 * (w - 1); const fr = fight(Object.assign({}, A), E2, {}); a = fr[0]; b = fr[1]; }
  finally { mA = oA; mB = oB; hA = oHA; hB = oHB; window.kkCap = eski; }
  return { win: kkTot(b) < .5, lost: Math.round(Math.max(0, kkTot(A) - kkTot(a))), sent: kkTot(A) };
}
/* sığın: askerler savaşmaz (kayıp yok), köy yağmalanır */
function kkSigin(auto, E0) {
  const R = S.draid || { E: E0 || {} }; if (!S.draid && !E0) return;
  const w = raidThreat(), pct = Math.max(5, 25 - (S.lv.wall || 0) * 4) / 100, st = [], pl = {};
  ['w', 's', 'g'].forEach(function (r) { const amt = Math.floor((S[r] || 0) * pct); if (amt > 0) { S[r] -= amt; pl[r] = amt; st.push(fmt(amt) + ' ' + ({ w: 'odun', s: 'taş', g: 'altın' }[r])); } });
  S.st.rl = (S.st.rl || 0) + 1;
  S.misilleme = { nm: raidName(), w: w, pl: pl, plt: (st.join(', ') || 'yok'), force: Object.assign({}, R.E), e: Date.now() + 1800000 };
  S.lr2 = 'Sığındın, asker kaybı yok. Köy yağmalandı: ' + (st.join(', ') || 'yok') + '. Peşlerine düş: Savaş sekmesinde Misilleme yap.';
  S.draidRep = null; S.draid = null; S.raidT = Date.now() + raidInterval();
  if (!auto) { toast(kkL('🏚️ Sığındın: asker kaybı yok, köy yağmalandı', '🏚️ You took shelter: no soldiers lost, the village was plundered')); if (typeof sfx === 'function') sfx('lose'); save(); render(); }
  else kkOlay(kkL('🏚️ Baskında sığındın: asker kaybı yok, köy yağmalandı', '🏚️ You sheltered during a raid: no soldiers lost, village plundered'));
}
/* defend() sarmalayıcısı: emir "akıllı" ise kaybedilecek savaşta sığınır; görünürken savaş sahnesi oynatır */
function kkSavun(E, auto) {
  if (S.savEmir === 'akil') { let t = null; try { t = savTahmin(E); } catch (e) { } if (t && !t.win) { kkSigin(auto, E); return false; } }
  if (auto) return defend0(E, auto);
  const eski = window.kkCap; window.kkCap = {}; let win;
  try { win = defend0(E, auto); } finally { const c = window.kkCap; window.kkCap = eski; if (c && c.A0) { try { kkSavasBitti(null, c, kkL('Baskın savunması', 'Raid defense')); } catch (e) { } } }
  return win;
}
function baskinSerit() {
  const el = $('kkBaskin'); if (!el) return;
  const R = S.draid; if (!R || window.kkDraidGor) { if (!el.classList.contains('hide')) { el.classList.add('hide'); el._k = ''; } return; } // üstteki baskın kartı görünürken şerit gizli
  const rem = Math.max(0, (R.dl - Date.now()) / 1000);
  if (el._k !== String(R.id)) {
    el._k = String(R.id); let t = null; try { t = savTahmin(R.E); } catch (e) { }
    const dus = fmt(Math.round(kkTot(R.E)));
    const th = !t ? '' : t.bos ? kkL('evde asker yok', 'no soldiers at home') : t.win ? kkL('savunursan <b>kazanırsın</b>, kayıp ~' + fmt(t.lost), 'defend and you <b>win</b>, losses ~' + fmt(t.lost)) : kkL('savunursan <b>kaybedersin</b>, kayıp ~' + fmt(t.lost), 'defend and you <b>lose</b>, losses ~' + fmt(t.lost));
    el.innerHTML = '<span class="bt"><b>⚔️ ' + kkL('Baskın geliyor!', 'Raid incoming!') + '</b> <span id="kkBaskinT"></span> · ' + dus + kkL(' düşman', ' enemies') + (th ? ' · ' + th : '') + '</span><span class="btns"><button class="sm" data-bs="savun">' + kkL('Savun', 'Defend') + '</button><button class="sm g" data-bs="sigin" title="' + kkL('Askerler savaşmaz, kayıp olmaz; köy yağmalanır', 'Soldiers do not fight, none are lost; the village is plundered') + '">' + kkL('Sığın', 'Shelter') + '</button></span>';
    el.classList.remove('hide');
  }
  const tt = $('kkBaskinT'); if (tt) tt.textContent = tm(rem);
}
function savEmirHtml() {
  const e = S.savEmir === 'akil' ? 'akil' : 'savas';
  return '<div class="kch" style="justify-content:space-between;flex-wrap:wrap;gap:6px;margin-top:8px"><span>' + kkL('Savunma emri', 'Defense order') + '</span><span class="btns" style="gap:4px"><button class="sm' + (e === 'savas' ? '' : ' g') + '" data-emir="savas">' + kkL('Her zaman savaş', 'Always fight') + '</button><button class="sm' + (e === 'akil' ? '' : ' g') + '" data-emir="akil">' + kkL('Kaybedeceksem sığın', 'Shelter if losing') + '</button></span></div><p class="eff" style="margin:6px 0 0"><small>' + kkL('Sığınınca askerler savaşmaz ve ölmez, ama köy yağmalanır. Süre dolunca ya da sen yokken bu emir uygulanır.', 'When sheltering, soldiers do not fight or die, but the village is plundered. This order applies when the timer runs out or while you are away.') + '</small></p>';
}

/* ================= ÜST BİLGİ ŞERİDİ: mevsim, hava, giriş serisi ================= */
var kkSeritAcik = '';
function seritRender() {
  const el = $('kkSerit'); if (!el) return;
  const si = seaIdx(), w = WKS[wkIdx() % 5], hk = havaNow(), H = HAVA[hk], n = (kAyar.strk && kAyar.strk.n) || 0;
  const ik = ['❄️', '🌱', '☀️', '🍂'][kkSeason()] || '🍃';
  const c = function (id, ic, yazi) { return '<button class="schip' + (kkSeritAcik === id ? ' on' : '') + '" data-sc="' + id + '" aria-expanded="' + (kkSeritAcik === id) + '">' + ic + ' ' + yazi + '</button>'; };
  const h = c('sea', ik, kkEsc(kkT(SEA[si].n)) + ' · ' + kkEsc(kkT(w.n))) + c('hava', H.i, kkL(H.n, H.ne)) + (n > 0 ? c('seri', '🔥', n + kkL(' gün', n === 1 ? ' day' : ' days')) : '');
  if (el._h !== h) { el._h = h; el.innerHTML = h; }
  const sea = $('sea'), hv = $('kkHava'), sk = $('strk');
  if (sea) sea.classList.toggle('hide', kkSeritAcik !== 'sea');
  if (hv) hv.classList.toggle('hide', kkSeritAcik !== 'hava');
  if (sk) { sk.classList.toggle('hide', kkSeritAcik !== 'seri'); if (kkSeritAcik === 'seri' && !window.strkAcik) { window.strkAcik = true; renderStreak(); } }
}

/* ================= İLK ADIMLAR: sıradaki adımı parlat ================= */
function ilkAdimHedef() {
  if (!S.rehber || S.rehber.fin || S.rehber.hide) return null;
  const d = S.rehber.d || {}; let i = 0; while (i < REHBER.length && d[i]) i++;
  if (i >= REHBER.length) return null;
  const tab = REHBER[i][2], akt = (document.querySelector('.tab.on') || {}).dataset; const acik = akt && akt.t === tab;
  if (!acik) return { el: document.querySelector('.tab[data-t="' + tab + '"]'), i: i };
  let el = null;
  if (i === 0 || i === 3) { // bir binayı yükselt / ana binayı yükselt
    const k = i === 3 ? 'main' : (ORDER.find(function (x) { const b = $('bt-' + x); return b && !b.disabled && !S.up[x] && $('c-' + x) && !$('c-' + x).classList.contains('kilit') && $('c-' + x).closest('#p-b'); }) || 'main');
    el = $('bt-' + k);
  } else if (i === 1) el = document.querySelector('#p-o #mil button:not([disabled])') || document.querySelector('#p-o button[data-k]:not([disabled])');
  else if (i === 2) el = document.querySelector('#hedefv .hsel .foot button:not(.g):not([disabled])') || document.querySelector('#hedefv .hrow[data-hk="wave"]');
  else if (i === 4) el = document.querySelector('#p-a input, #p-a button:not([disabled])');
  return { el: el, i: i };
}
function ilkAdimRender() {
  const h = ilkAdimHedef(), eski = document.querySelector('.kkparla');
  const yeni = h && h.el && h.el.offsetParent !== null ? h.el : null;
  if (eski && eski !== yeni) eski.classList.remove('kkparla');
  if (yeni && !yeni.classList.contains('kkparla')) yeni.classList.add('kkparla');
}

/* ================= BAĞLANTILAR ================= */
function sistemRender() {
  try { baskinSerit(); } catch (e) { }
  try { seritRender(); } catch (e) { }
  try { ilkAdimRender(); } catch (e) { }
  const de = $('kkEmir'); if (de) { const h = raidActive() ? savEmirHtml() : ''; if (de._h !== h) { de._h = h; de.innerHTML = h; } }
  const pt = document.querySelector('.tab[data-t="p"]'); if (pt) pt.classList.toggle('var', (S.mail || []).length > 0);
}
function sistemInit() {
  const nav = $('tabs');
  if (nav && !$('kkBaskin')) {
    const b = document.createElement('div'); b.id = 'kkBaskin'; b.className = 'hide'; b.setAttribute('role', 'alert'); nav.appendChild(b);
    b.addEventListener('click', function (e) { e.stopPropagation(); const x = e.target.closest('button[data-bs]'); if (!x || !S.draid) return; if (x.dataset.bs === 'savun') defend(S.draid.E, false); else kkSigin(false); });
  }
  const sea = $('sea');
  if (sea && !$('kkSerit')) {
    const s = document.createElement('div'); s.id = 'kkSerit'; sea.parentNode.insertBefore(s, sea);
    s.addEventListener('click', function (e) { const c = e.target.closest('.schip'); if (!c) return; kkSeritAcik = kkSeritAcik === c.dataset.sc ? '' : c.dataset.sc; seritRender(); });
  }
  const dc = $('draidc'); if (dc && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { window.kkDraidGor = en[0].isIntersecting; try { baskinSerit(); } catch (e) { } }).observe(dc);
  const di = $('defi');
  if (di && !$('kkEmir')) { const d = document.createElement('div'); d.id = 'kkEmir'; di.parentNode.appendChild(d); d.addEventListener('click', function (e) { const b = e.target.closest('button[data-emir]'); if (!b) return; S.savEmir = b.dataset.emir; d._h = ''; save(); render(); }); }
}
