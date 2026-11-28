/* Küçük Krallık · posta kutusu
   Savaş raporları, baskınlar, sefer dönüşleri ve krallık haberleri (başarım, aşama, ödül…) burada birikir.
   Üstteki ✉️ düğmesiyle açılır; okunmamışlar sayılır, mektuplar yıldızlanabilir ve silinebilir.
   Ana oyun betiğinden ÖNCE yüklenir; yalnızca tanımlar içerir. */

const POSTA_MAX = 120;
const POSTA_KLASOR = [
  ['hep', '📬', 'Tümü', 'All'],
  ['savas', '⚔️', 'Savaş', 'Battles'],
  ['savunma', '🛡️', 'Savunma', 'Defense'],
  ['krallik', '👑', 'Krallık', 'Kingdom'],
  ['yildiz', '⭐', 'Yıldızlı', 'Starred']
];
var kkPostaKlasor = 'hep', kkPostaAcikId = null, kkPostaSayfa = 1;

function postaListe() { if (!Array.isArray(S.posta)) S.posta = []; return S.posta; }
function postaOkunmamis() { return postaListe().filter(function (m) { return !m.ok || postaBekliyor(m); }).length; }
/* yeni mektup: tur = savas | savunma | krallik */
function postaEkle(tur, baslik, ozet, ek) {
  const L = postaListe(), m = Object.assign({ id: Date.now() * 10 + Math.floor(Math.random() * 10), t: Date.now(), tur: tur, b: String(baslik || ''), o: String(ozet || ''), ok: 0 }, ek || {});
  L.unshift(m);
  if (L.length > POSTA_MAX) { for (let i = L.length - 1; i >= 0 && L.length > POSTA_MAX; i--) if (!L[i].y && !postaBekliyor(L[i])) L.splice(i, 1); } // yıldızlılar ve alınmamış ödüller silinmez
  postaRozet();
  return m;
}
/* eski "Posta" bildirimlerini (S.mail) bir kez posta kutusuna taşı */
function postaTasi() {
  if (!Array.isArray(S.mail) || !S.mail.length) return;
  const L = postaListe();
  S.mail.slice().reverse().forEach(function (e) { L.unshift({ id: (e.t || Date.now()) * 10, t: e.t || Date.now(), tur: 'krallik', b: String(e.x || ''), o: '', ok: 1 }); });
  L.sort(function (a, b) { return b.t - a.t; });
  S.mail = [];
}
/* krallık haberinin simgesi: metnin başındaki emoji, yoksa türüne göre */
function postaIkon(m) {
  if (m.ik) return m.ik;
  if (m.rid) { const r = (S.raporlar || []).find(function (x) { return x.id === m.rid; }); if (r) return kkRapIkon(r); }
  const e = /^\p{Extended_Pictographic}/u.exec(m.b || ''); if (e) return e[0];
  if (/^Başarım/.test(m.b)) return '🏅';
  if (/^Yeni aşama/.test(m.b)) return '🏰';
  if (/^Ana bina/.test(m.b)) return '🏛️';
  return m.tur === 'savas' ? '⚔️' : m.tur === 'savunma' ? '🛡️' : '📜';
}
/* ================= MEKTUP EKLERİ (ÖDÜL) =================
   od: {g, rel, cr, w, s, f, i}   doğrudan kaynak (ör. başarım altını)
       {etk: i, k: hafta}         haftalık etkinlik ödülü
       {mil: i}                   başarım koleksiyonu ödülü
       {sy: kademe, sez: sezon}   sezon ödül yolu
   m.al = 1 → alındı */
function postaOdDurum(m) {
  const o = m.od; if (!o) return '';
  if (m.al) return 'al';
  if (o.etk != null) { const e = S.etk; if (!e || e.k !== o.k) return 'bitti'; return e.al[o.etk] ? 'al' : 'hazir'; }
  if (o.mil != null) return (S.achMil || 0) > o.mil ? 'al' : 'hazir';
  if (o.sy != null) { const sy = S.sy; if (!sy || sy.sez !== o.sez) return 'bitti'; return (sy.al || 0) >= o.sy ? 'al' : 'hazir'; }
  return 'hazir';
}
function postaBekliyor(m) { return postaOdDurum(m) === 'hazir'; }
function postaOdMetin(m) {
  const o = m.od; if (!o) return '';
  if (o.etk != null) return typeof etkOdulMetin === 'function' ? etkOdulMetin(o.etk) : '';
  if (o.mil != null) { const r = (ACHMIL[o.mil] || [0, {}])[1]; return [r.g ? '+' + fmt(r.g) + kkL(' altın', ' gold') : '', r.rel ? '+' + r.rel + kkL(' kalıntı', ' relics') : ''].filter(Boolean).join(' · '); }
  if (o.sy != null) { const r = syReward(o.sy); return '+' + fmt(r.g) + kkL(' altın', ' gold') + ' · +' + fmt(r.res) + kkL(' kaynak', ' resources') + (r.rel ? kkL(' · kalıntı', ' · relic') : ''); }
  const ad = { g: [' altın', ' gold'], rel: [' kalıntı', ' relics'], cr: [' taç', ' crowns'], w: [' odun', ' wood'], s: [' taş', ' stone'], f: [' yemek', ' food'], i: [' demir', ' iron'] };
  return Object.keys(ad).filter(function (k) { return o[k] > 0; }).map(function (k) { return '+' + fmt(o[k]) + kkL(ad[k][0], ad[k][1]); }).join(' · ');
}
// tek bir mektubun ödülünü al; ekrana mesaj vermez (toplu alımda tek özet gösterilir)
function postaAlTek(m) {
  if (!postaBekliyor(m)) { if (m.od) m.al = 1; return false; }
  const o = m.od, t0 = window.toast, sf = window.sfx; window.toast = function () { }; window.sfx = function () { };
  try {
    if (o.etk != null) etkAl(o.etk);
    else if (o.mil != null) achMilClaim();
    else if (o.sy != null) syClaim();
    else { const c = cap(S.lv); ['w', 's', 'f', 'i'].forEach(function (r) { if (o[r] > 0) S[r] = Math.min(c, (S[r] || 0) + o[r]); }); if (o.g > 0) { S.g = (S.g || 0) + o.g; S.st.g = (S.st.g || 0) + o.g; } if (o.rel > 0) S.rel = (S.rel || 0) + o.rel; if (o.cr > 0) S.cr = (S.cr || 0) + o.cr; }
  } finally { window.toast = t0; window.sfx = sf; }
  m.al = 1; m.ok = 1; return true;
}
function postaFark(a, b) {
  const ad = [['g', ' altın', ' gold'], ['rel', ' kalıntı', ' relics'], ['cr', ' taç', ' crowns'], ['w', ' odun', ' wood'], ['s', ' taş', ' stone'], ['f', ' yemek', ' food'], ['i', ' demir', ' iron']];
  return ad.map(function (x) { const d = Math.round((b[x[0]] || 0) - (a[x[0]] || 0)); return d > 0 ? '+' + fmt(d) + kkL(x[1], x[2]) : ''; }).filter(Boolean).join(', ');
}
function postaAnlik() { return { g: S.g, rel: S.rel, cr: S.cr, w: S.w, s: S.s, f: S.f, i: S.i }; }
// ödülleri al: liste verilirse hepsini, okundu da say
function postaAl(L) {
  const a = postaAnlik(); let n = 0;
  L.forEach(function (m) { if (postaAlTek(m)) n++; m.ok = 1; });
  const fk = postaFark(a, postaAnlik());
  if (n) { toast('🎁 ' + kkL(n + ' ödül alındı', n + ' rewards claimed') + (fk ? ': ' + fk : '')); sfx('win'); }
  postaRozet(); save(); try { render(); } catch (e) { }
  return n;
}
function postaOdHtml(m) {
  const d = postaOdDurum(m); if (!d) return '';
  return '<div class="pkod' + (d === 'hazir' ? ' hazir' : '') + '"><span>🎁 <b>' + kkL('Ödül', 'Reward') + ':</b> ' + kkEsc(postaOdMetin(m)) + '</span>' +
    (d === 'hazir' ? '<button class="sm" data-pmal="' + m.id + '">' + kkL('Al', 'Claim') + '</button>' : '<small>' + (d === 'al' ? '✓ ' + kkL('Alındı', 'Claimed') : kkL('Süresi doldu', 'Expired')) + '</small>') + '</div>';
}
function postaBaslik(m) { return kkT((m.b || '').replace(/^\p{Extended_Pictographic}️?\s*/u, '')); }

/* ================= ROZET VE GİRİŞ NOKTALARI ================= */
function postaRozet() {
  const n = postaOkunmamis(), b = $('postaBtn');
  if (b) { const s = b.querySelector('.prz'); if (s) { s.textContent = n > 99 ? '99+' : String(n); s.classList.toggle('hide', !n); } b.title = kkL('Posta kutusu', 'Mailbox') + (n ? ' · ' + n + kkL(' okunmamış', ' unread') : ''); b.setAttribute('aria-label', b.title); }
  const pm = $('postaOzet'); if (pm) { const t = n ? kkL(n + ' okunmamış mektup', n + ' unread letters') : kkL('Okunmamış mektup yok', 'No unread letters'); if (pm.textContent !== t) pm.textContent = t; }
}

/* ================= POSTA KUTUSU PENCERESİ ================= */
function postaAc(klasor, id) {
  let ov = $('postaKutu');
  if (!ov) {
    ov = document.createElement('div'); ov.id = 'postaKutu'; ov.className = 'hide'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="pk-box"><div class="pk-hd"><button class="mini hide" id="pkGeri" aria-label="Geri">‹</button><b id="pkT"></b><button class="mini" id="pkX" aria-label="Kapat">✕</button></div><div class="pk-ic" id="pkIc"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', postaTik);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('postaKutu').classList.contains('hide') && !(window.kkSahneAkt)) { if (kkPostaAcikId) { kkPostaAcikId = null; postaCiz(); } else postaKapat(); } });
  }
  if (klasor) kkPostaKlasor = klasor;
  kkPostaAcikId = id || null; kkPostaSayfa = 1;
  if (id) postaOkundu(id);
  ov.classList.remove('hide'); document.body.style.overflow = 'hidden';
  postaCiz();
  const x = $('pkX'); if (x) x.focus({ preventScroll: true });
}
function postaKapat() { const ov = $('postaKutu'); if (ov) ov.classList.add('hide'); document.body.style.overflow = ''; kkPostaAcikId = null; try { render(); } catch (e) { } }
function postaOkundu(id) { const m = postaListe().find(function (x) { return x.id === id; }); if (m && !m.ok) { m.ok = 1; postaRozet(); save(); } }
function postaFiltre() {
  const L = postaListe(), k = kkPostaKlasor;
  return L.filter(function (m) { return k === 'hep' || (k === 'yildiz' ? m.y : m.tur === k); });
}
function postaSatir(m) {
  const kisa = m.o ? kkT(m.o) : '';
  return '<button class="pkrow' + (m.ok ? '' : ' yeni') + '" data-pm="' + m.id + '"><span class="pkic">' + postaIkon(m) + '</span><span class="pkmid"><b>' + kkEsc(postaBaslik(m)) + '</b>' + (kisa ? '<small>' + kkEsc(kisa) + '</small>' : '') + '</span><span class="pksag"><small>' + kkEsc(kkRapZaman(m.t)) + '</small>' + (postaBekliyor(m) ? '<i class="pkhd" aria-label="' + kkL('ödül var', 'has a reward') + '">🎁</i>' : '') + (m.y ? '<i aria-label="' + kkL('yıldızlı', 'starred') + '">⭐</i>' : '') + '</span></button>';
}
function postaMektup(m) {
  const d = new Date(m.t), ts = d.toLocaleDateString(kkL('tr-TR', 'en-GB'), { day: 'numeric', month: 'long' }) + ' ' + d.toLocaleTimeString(kkL('tr-TR', 'en-GB'), { hour: '2-digit', minute: '2-digit' });
  let h = '<article class="pkmek"><div class="pkmh"><span class="pkic">' + postaIkon(m) + '</span><div><b>' + kkEsc(postaBaslik(m)) + '</b><small>' + kkEsc(ts) + ' · ' + kkEsc(kkL(POSTA_KLASOR.find(function (k) { return k[0] === m.tur; })[2], POSTA_KLASOR.find(function (k) { return k[0] === m.tur; })[3])) + '</small></div></div>';
  const r = m.rid ? (S.raporlar || []).find(function (x) { return x.id === m.rid; }) : null;
  if (r) h += kkRapDetay(r).replace('<div class="rdet">', '<div class="rdet pkrd">');
  else if (m.rid) h += '<p class="eff">' + kkEsc(kkT(m.o || '')) + '</p><p class="eff"><small>' + kkL('Bu savaşın ayrıntıları eskidiği için silindi; en son 40 savaşın ayrıntısı saklanır.', 'The details of this battle were removed because it is old; details of the last 40 battles are kept.') + '</small></p>';
  else h += '<p class="pkgov">' + kkEsc(kkT(m.o || m.b)) + '</p>';
  h += postaOdHtml(m);
  h += '<div class="btns wrapb pkact"><button class="sm g" data-pmy="' + m.id + '">' + (m.y ? '⭐ ' + kkL('Yıldızı kaldır', 'Unstar') : '☆ ' + kkL('Yıldızla', 'Star')) + '</button><button class="sm g" data-pms="' + m.id + '">🗑️ ' + kkL('Sil', 'Delete') + '</button></div></article>';
  return h;
}
function postaCiz() {
  const ic = $('pkIc'); if (!ic) return;
  const geri = $('pkGeri'), T = $('pkT'), L = postaListe();
  const m = kkPostaAcikId ? L.find(function (x) { return x.id === kkPostaAcikId; }) : null;
  if (kkPostaAcikId && !m) kkPostaAcikId = null;
  geri.classList.toggle('hide', !m); geri.setAttribute('aria-label', kkL('Geri', 'Back'));
  T.textContent = '✉️ ' + kkL('Posta kutusu', 'Mailbox');
  if (m) { const hm = postaMektup(m); if (ic._h !== hm) { const yeni = ic._m !== m.id; ic._h = hm; ic._m = m.id; ic.innerHTML = hm; if (yeni) ic.scrollTop = 0; } return; }
  ic._m = null;
  const say = {}; POSTA_KLASOR.forEach(function (k) { say[k[0]] = 0; }); L.forEach(function (x) { say.hep++; say[x.tur] = (say[x.tur] || 0) + (x.ok ? 0 : 0); if (x.y) say.yildiz++; });
  const oku = {}; L.forEach(function (x) { if (!x.ok) { oku.hep = (oku.hep || 0) + 1; oku[x.tur] = (oku[x.tur] || 0) + 1; } });
  let h = '<div class="pkfil" role="tablist">' + POSTA_KLASOR.map(function (k) { const n = k[0] === 'yildiz' ? say.yildiz : oku[k[0]] || 0; return '<button class="sm' + (kkPostaKlasor === k[0] ? '' : ' g') + '" data-pk="' + k[0] + '" role="tab" aria-selected="' + (kkPostaKlasor === k[0]) + '">' + k[1] + ' ' + kkL(k[2], k[3]) + (n ? ' <i class="pkn' + (k[0] === 'yildiz' ? ' g' : '') + '">' + n + '</i>' : '') + '</button>'; }).join('') + '</div>';
  const F = postaFiltre(), goster = F.slice(0, kkPostaSayfa * 30);
  if (F.length) { const od = F.filter(postaBekliyor).length, ok = F.filter(function (x) { return !x.ok; }).length;
    h += '<div class="pkust"><button class="sm' + (od || ok ? '' : ' g') + '" data-pkal="1"' + (od || ok ? '' : ' disabled') + '>✓ ' + kkL('Tümünü oku ve al', 'Read & claim all') + '</button><small>' + (od ? '🎁 ' + kkL(od + ' ödül', od + ' rewards') : '') + (od && ok ? ' · ' : '') + (ok ? kkL(ok + ' okunmamış', ok + ' unread') : '') + (!od && !ok ? kkL('Hepsi okundu', 'All read') : '') + '</small></div>'; }
  if (!F.length) h += '<p class="eff pkbos">' + (kkPostaKlasor === 'yildiz' ? kkL('Yıldızlı mektup yok. Saklamak istediğin bir mektubu açıp ☆ Yıldızla’ya bas.', 'No starred letters. Open a letter and tap ☆ Star to keep it.') : kkL('Bu klasör boş. Savaş raporları, baskınlar, sefer dönüşleri ve krallık haberleri burada birikir.', 'This folder is empty. Battle reports, raids, returning marches and kingdom news collect here.')) + '</p>';
  else h += goster.map(postaSatir).join('');
  if (F.length > goster.length) h += '<button class="sm g pkdaha" data-pkd="1">' + kkL('Daha eski mektuplar (' + (F.length - goster.length) + ')', 'Older letters (' + (F.length - goster.length) + ')') + '</button>';
  if (F.length) h += '<div class="btns wrapb pkalt"><button class="sm g" data-pkt="1"' + (F.some(function (x) { return x.ok && !x.y && !postaBekliyor(x); }) ? '' : ' disabled') + '>🗑️ ' + kkL('Okunanları sil', 'Delete read') + '</button></div><p class="eff pknot"><small>' + kkL('Yıldızlı mektuplar ve alınmamış ödüller silinmez. En fazla ' + POSTA_MAX + ' mektup saklanır; yer dolunca en eski okunmuşlar gider.', 'Starred letters and unclaimed rewards are never deleted. Up to ' + POSTA_MAX + ' letters are kept; when full, the oldest read ones go.') + '</small></p>';
  if (ic._h !== h) { ic._h = h; ic.innerHTML = h; }
}
function ic_yenile() { const ic = $('pkIc'); if (ic) ic._h = ''; postaCiz(); }
function postaTik(e) {
  const ov = $('postaKutu');
  if (e.target === ov) { postaKapat(); return; }
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'pkX') { postaKapat(); return; }
  if (b.id === 'pkGeri') { kkPostaAcikId = null; postaCiz(); return; }
  if (b.dataset.pk) { kkPostaKlasor = b.dataset.pk; kkPostaSayfa = 1; postaCiz(); return; }
  if (b.dataset.pm) { const id = +b.dataset.pm; kkPostaAcikId = id; postaOkundu(id); postaCiz(); return; }
  if (b.dataset.pkd) { kkPostaSayfa++; postaCiz(); return; }
  if (b.dataset.pkal) { postaAl(postaFiltre()); postaCiz(); return; }
  if (b.dataset.pmal) { const m = postaListe().find(function (x) { return x.id === +b.dataset.pmal; }); if (m) { postaAl([m]); ic_yenile(); } return; }
  if (b.dataset.pko) { postaFiltre().forEach(function (m) { m.ok = 1; }); postaRozet(); save(); postaCiz(); return; }
  if (b.dataset.pkt) { const sil = postaFiltre().filter(function (m) { return m.ok && !m.y && !postaBekliyor(m); }), ids = new Set(sil.map(function (m) { return m.id; })); S.posta = postaListe().filter(function (m) { return !ids.has(m.id); }); toast(kkL(sil.length + ' mektup silindi', sil.length + ' letters deleted')); save(); postaCiz(); return; }
  if (b.dataset.pmy) { const m = postaListe().find(function (x) { return x.id === +b.dataset.pmy; }); if (m) { m.y = m.y ? 0 : 1; save(); postaCiz(); } return; }
  if (b.dataset.pms) { const id = +b.dataset.pms, mm = postaListe().find(function (x) { return x.id === id; }); if (mm && postaBekliyor(mm)) postaAl([mm]); S.posta = postaListe().filter(function (m) { return m.id !== id; }); kkPostaAcikId = null; save(); postaCiz(); postaRozet(); return; }
  if (b.dataset.rsah) { const r = (S.raporlar || []).find(function (x) { return x.id === +b.dataset.rsah; }); if (r) kkSahneOyna({ ad: r.ad, kind: r.kind, cap: { A0: r.A0, B0: r.E0, A1: r.A1, B1: r.E1, sn: r.sn }, win: r.yer === 'kusatma' ? true : r.win, rep: false, col: r.col }); return; }
  if (b.dataset.rhed) { const r = (S.raporlar || []).find(function (x) { return x.id === +b.dataset.rhed; }); const t = r && kkRapHedef(r); if (t) { postaKapat(); const tb = document.querySelector('.tab[data-t="s"]'); if (tb && !tb.classList.contains('on')) tb.click(); wSelect(t); const hv = $('hedefv'); if (hv) { hv._h = ''; render(); const c = hv.querySelector('.hsel'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); } } return; }
}

/* ================= BAĞLANTILAR ================= */
/* savaş raporu kaydedildiğinde mektup da gelsin */
function postaRapor(r) {
  const kay = kkRapKayip(r), lt = kkRapLoot(r.loot, true), parca = [kkRapSonuc(r)];
  if (r.yer !== 'siginma') parca.push(kkL('kayıp ', 'losses ') + fmt(kay));
  if (lt) parca.push(lt);
  postaEkle(r.yer === 'savunma' || r.yer === 'siginma' ? 'savunma' : 'savas', r.ad, parca.join(' · '), { rid: r.id });
}
function postaInit() {
  postaTasi();
  const hdr = document.querySelector('.clk .hdr');
  if (hdr && !$('postaBtn')) {
    const b = document.createElement('button'); b.id = 'postaBtn'; b.className = 'mini'; b.type = 'button';
    b.innerHTML = '✉️<span class="prz hide"></span>';
    const ay = $('ayarBtn'); hdr.insertBefore(b, ay || null);
    b.addEventListener('click', function () { postaAc(); });
  }
  // Profil > Posta bölümü artık posta kutusunu açar
  const ml = $('maillist');
  if (ml && !$('postaOzet')) {
    const kart = ml.parentNode; kart.innerHTML = '<div class="foot" style="align-items:center"><span class="eff" id="postaOzet" style="margin:0"></span><button id="postaAcBtn" type="button">✉️ ' + kkL('Posta kutusunu aç', 'Open mailbox') + '</button></div><p class="eff" style="margin:8px 0 0"><small>' + kkL('Savaş raporları, baskınlar, sefer dönüşleri ve krallık haberleri (başarım, aşama, ödül) posta kutusunda birikir. Üstteki ✉️ düğmesiyle her yerden açabilirsin.', 'Battle reports, raids, returning marches and kingdom news (achievements, stages, rewards) collect in your mailbox. Open it anywhere with the ✉️ button at the top.') + '</small></p>';
    $('postaAcBtn').addEventListener('click', function () { postaAc(); });
    const mn = $('mailn'); if (mn) mn.remove();
  }
  postaRozet();
}
function postaRender() {
  postaRozet();
  const ov = $('postaKutu'); if (ov && !ov.classList.contains('hide') && !kkPostaAcikId) { postaCiz(); }
}
