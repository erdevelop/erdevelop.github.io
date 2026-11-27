/* Küçük Krallık · savaş raporları
   Her savaşın (sefer, kuşatma, baskın savunması, sığınma, misilleme) kaydını tutar; son 25 rapor saklanır.
   Savaş sekmesinde liste olarak görünür; bir rapora dokununca ayrıntısı açılır ve savaş sahnesi yeniden izlenebilir.
   Ana oyun betiğinden ÖNCE yüklenir; yalnızca tanımlar içerir. */

const RAP_MAX = 40, RAP_SN = 14;
var kkRapFiltre = 'hep', kkRapAcik = null, kkRapTum = false, kkRapGor0 = null;

/* savaştan önce: kaynak, kalıntı ve revir durumu */
function kkRap0() { return { r: { w: S.w || 0, s: S.s || 0, f: S.f || 0, g: S.g || 0, i: S.i || 0 }, rel: S.rel || 0, rv: kkTot(S.revir || {}), ar: Object.assign({}, S.ar), dalga: S.wave || 1 }; }
function kkRapFark(r0) {
  const l = {}; let var_ = false;
  for (const k in r0.r) { const d = Math.round((S[k] || 0) - r0.r[k]); if (d) { l[k] = d; var_ = true; } }
  const rel = (S.rel || 0) - r0.rel; if (rel) { l.rel = rel; var_ = true; }
  return var_ ? l : null;
}
function kkRapTam(X) { const o = {}; for (const k in X) { const v = Math.round(X[k] || 0); if (v > 0) o[k] = v; } return o; }
/* tur kayıtlarından en çok RAP_SN anı seç (sahneyi yeniden oynatmak için) */
function kkRapSn(sn) {
  if (!sn || !sn.length) return [];
  const out = [], n = sn.length, adim = Math.max(1, Math.ceil(n / RAP_SN));
  for (let i = adim - 1; i < n; i += adim) out.push([kkRapTam(sn[i][0]), kkRapTam(sn[i][1])]);
  if (out.length && n % adim) out.push([kkRapTam(sn[n - 1][0]), kkRapTam(sn[n - 1][1])]);
  return out;
}
function kkRaporKaydet(r) {
  S.raporlar = Array.isArray(S.raporlar) ? S.raporlar : [];
  r.id = r.id || Date.now() + Math.floor(Math.random() * 1000); r.t = r.t || Date.now();
  S.raporlar.unshift(r); if (S.raporlar.length > RAP_MAX) S.raporlar.length = RAP_MAX;
  try { postaRapor(r); } catch (e) { console.error('posta', e); }
  const el = $('raporv'); if (el) el._h = '';
  return r;
}
/* savaş yakalandıktan sonra çağrılır (kkSavasBitti içinden) */
function kkRaporSavas(m, cap, ad, ek) {
  ek = ek || {};
  const r0 = ek.r0, win = kkTot(cap.B1) < .5 && kkTot(cap.A1) >= .5;
  if (m && m.kind === 'wave' && r0) ad = 'Dalga ' + r0.dalga + (r0.dalga % 5 === 0 ? ' · Boss' : '');
  return kkRaporKaydet({
    yer: ek.yer || 'saldiri', kind: m ? m.kind : '', hedef: m ? m.target : null, ad: ad, win: win,
    A0: kkRapTam(cap.A0), A1: kkRapTam(cap.A1), E0: kkRapTam(cap.B0), E1: kkRapTam(cap.B1),
    sn: kkRapSn(cap.sn), tur: (cap.sn || []).length, mx: cap.mx ? Object.fromEntries(Object.entries(cap.mx).map(function (e) { return [e[0], Math.round(e[1])]; })) : null,
    loot: r0 ? kkRapFark(r0) : null, yarali: r0 ? Math.max(0, kkTot(S.revir || {}) - r0.rv) : 0,
    cesur: !!ek.cesur, col: m && m.kind === 'lord' ? kkLordRenk(m) : null, hava: typeof havaNow === 'function' ? havaNow() : ''
  });
}

/* ================= GÖRÜNÜM ================= */
function kkRapZaman(t) {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return kkL('az önce', 'just now');
  if (s < 3600) return Math.floor(s / 60) + kkL(' dk önce', ' min ago');
  if (s < 86400) return Math.floor(s / 3600) + kkL(' sa önce', ' h ago');
  const d = new Date(t); return d.toLocaleDateString(kkL('tr-TR', 'en-GB'), { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString(kkL('tr-TR', 'en-GB'), { hour: '2-digit', minute: '2-digit' });
}
function kkRapIkon(r) { return r.yer === 'siginma' ? '🏚️' : r.yer === 'kusatma' ? '🏯' : r.yer === 'savunma' ? (r.win ? '🛡️' : '🔥') : (r.win ? '🏆' : '💀'); }
function kkRapSonuc(r) {
  if (r.yer === 'siginma') return kkL('sığındın', 'sheltered');
  if (r.yer === 'kusatma') return r.yikildi ? kkL('sur yıkıldı', 'walls fell') : kkL('sura hasar', 'wall damage');
  if (r.yer === 'savunma') return r.win ? kkL('püskürtüldü', 'repelled') : kkL('yağmalandı', 'plundered');
  return r.win ? kkL('zafer', 'victory') : kkL('yenilgi', 'defeat');
}
const RAP_RAD = { w: 'odun', s: 'taş', f: 'yemek', g: 'altın', i: 'demir' };
function kkRapLoot(l, kisa) {
  if (!l) return '';
  const p = [], n = [];
  for (const k in RAP_RAD) if (l[k]) (l[k] > 0 ? p : n).push((l[k] > 0 ? '+' : '−') + fmt(Math.abs(l[k])) + ' ' + kkT(RAP_RAD[k]));
  if (l.rel) p.push('+' + l.rel + kkL(' kalıntı', ' relic'));
  if (kisa) return p.concat(n).slice(0, 3).join(' ');
  return p.concat(n).join(', ');
}
function kkRapKayip(r) { return Math.max(0, kkTot(r.A0) - kkTot(r.A1)); }
function kkRapSatir(r, yeni) {
  const kay = kkRapKayip(r), lt = kkRapLoot(r.loot, true);
  const alt = [kkRapSonuc(r), kkRapZaman(r.t)];
  if (r.yer !== 'siginma') alt.push(kkL('kayıp ', 'losses ') + fmt(kay) + (r.yarali ? kkL(' (' + fmt(r.yarali) + ' yaralı)', ' (' + fmt(r.yarali) + ' wounded)') : ''));
  if (lt) alt.push(lt);
  const sinif = r.yer === 'siginma' || (!r.win && r.yer !== 'kusatma') ? 'kotu' : 'iyi';
  return '<button class="rrow ' + sinif + (kkRapAcik === r.id ? ' acik' : '') + '" data-rap="' + r.id + '" aria-expanded="' + (kkRapAcik === r.id) + '"><span class="ric">' + kkRapIkon(r) + '</span><span class="rmid"><b>' + kkEsc(kkT(r.ad)) + (r.cesur ? ' <small title="' + kkL('Cesur sefer', 'Bold march') + '">🎲</small>' : '') + (yeni ? ' <i class="ryeni">' + kkL('yeni', 'new') + '</i>' : '') + '</b><small>' + alt.map(kkEsc).join(' · ') + '</small></span><span class="hch" aria-hidden="true">' + (kkRapAcik === r.id ? '▴' : '▾') + '</span></button>';
}
/* tur tur iki ordunun asker sayısı: küçük çizgi grafik */
function kkRapGrafik(r) {
  const L = [[kkTot(r.A0), kkTot(r.E0)]].concat((r.sn || []).map(function (s) { return [kkTot(s[0]), kkTot(s[1])]; }));
  if (L.length < 2) return '';
  const W = 280, H = 64, mx = Math.max(1, Math.max.apply(null, L.map(function (x) { return Math.max(x[0], x[1]); })));
  const yol = function (i) { return L.map(function (p, j) { return (j ? 'L' : 'M') + (4 + (W - 8) * j / (L.length - 1)).toFixed(1) + ' ' + (H - 4 - (H - 10) * p[i] / mx).toFixed(1); }).join(' '); };
  return '<svg class="rgraf" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + kkL('Tur tur ordu büyüklüğü', 'Army size per round') + '"><path d="' + yol(1) + '" fill="none" stroke="' + (r.col || '#c0563f') + '" stroke-width="2.2" stroke-linejoin="round"/><path d="' + yol(0) + '" fill="none" stroke="#3f6fb0" stroke-width="2.2" stroke-linejoin="round"/></svg><div class="rlej"><span><i style="background:#3f6fb0"></i>' + kkL('Ordun', 'Your army') + '</span><span><i style="background:' + (r.col || '#c0563f') + '"></i>' + kkL('Düşman', 'Enemy') + '</span><span>' + (r.tur || L.length - 1) + kkL(' tur', ' rounds') + '</span></div>';
}
/* yenilgide ne yapılabilir: düşmanın en kalabalık birliğine üstün gelen birlik */
function kkRapOneri(r) {
  if (r.win || r.yer === 'siginma' || r.yer === 'kusatma') return '';
  const E = r.E0 || {}; let en = null; for (const k in E) if (U[k] && (!en || E[k] > E[en])) en = k;
  if (!en) return '';
  let iyi = null; for (const k in U) if (mul(k, en) > 1 && (!iyi || (S.ar[k] || 0) > (S.ar[iyi] || 0))) iyi = k;
  const ana = kkL('Düşmanın çoğu ', 'Most of the enemy was ') + '<b>' + kkEsc(kkT(U[en].n)) + '</b>';
  return '<p class="eff rone">💡 ' + ana + (iyi ? kkL('. Ona karşı en etkilisi <b>' + kkEsc(kkT(U[iyi].n)) + '</b> (iki kat hasar). Daha fazla eğitip tekrar dene.', '. <b>' + kkEsc(kkT(U[iyi].n)) + '</b> are best against them (double damage). Train more and try again.') : kkL('. Ordunu büyütüp tekrar dene.', '. Grow your army and try again.')) + '</p>';
}
function kkRapDetay(r) {
  let h = '<div class="rdet">';
  if (r.yer === 'siginma') {
    h += '<p class="eff">' + kkL('Baskın geldiğinde askerlerin savaşmadı, kimse ölmedi. Haydutlar köyü yağmaladı: ', 'Your soldiers did not fight when the raid came, nobody died. The raiders plundered the village: ') + '<b>' + kkEsc(kkRapLoot(r.loot) || kkL('hiçbir şey', 'nothing')) + '</b>.</p>';
    if (kkTot(r.E0)) h += '<p class="eff">' + kkL('Düşman: ', 'Enemy: ') + kkEsc(Object.keys(r.E0).map(function (k) { return fmt(r.E0[k]) + ' ' + kkT(U[k] ? U[k].n : k); }).join(', ')) + '</p>';
    return h + '</div>';
  }
  if (r.yer === 'kusatma') {
    h += '<p class="eff">' + kkL('Surlara ', 'Your army dealt ') + '<b>' + fmt(r.hasar || 0) + '</b>' + kkL(' hasar verdin', ' damage to the walls') + (r.yikildi ? kkL('; sur yıkıldı!', '; the walls fell!') : kkL('. Kalan sur: ', '. Walls left: ') + fmt(r.kalan || 0)) + '.</p>';
  }
  const ks = Object.keys(U).filter(function (k) { return (r.A0[k] || 0) || (r.E0[k] || 0); });
  if (ks.length && r.yer !== 'kusatma') {
    h += '<div class="rt"><table class="rtab"><tr><th>' + kkL('Birlik', 'Unit') + '</th><th>' + kkL('Ordun', 'Yours') + '</th><th>' + kkL('Düşman', 'Enemy') + '</th></tr>' + ks.map(function (k) {
      const a0 = r.A0[k] || 0, a1 = r.A1[k] || 0, e0 = r.E0[k] || 0, e1 = r.E1[k] || 0;
      const hc = function (x0, x1) { return x0 ? fmt(x0) + ' → ' + fmt(x1) + (x0 > x1 ? ' <small class="rk">−' + fmt(x0 - x1) + '</small>' : '') : '–'; };
      return '<tr><td>' + kkEsc(kkT(U[k].n)) + '</td><td>' + hc(a0, a1) + '</td><td>' + hc(e0, e1) + '</td></tr>';
    }).join('') + '<tr class="rtop"><td>' + kkL('Toplam', 'Total') + '</td><td>' + fmt(kkTot(r.A0)) + ' → ' + fmt(kkTot(r.A1)) + '</td><td>' + fmt(kkTot(r.E0)) + ' → ' + fmt(kkTot(r.E1)) + '</td></tr></table></div>';
  } else if (r.yer === 'kusatma' && kkTot(r.A0)) {
    h += '<p class="eff">' + kkL('Ordun: ', 'Your army: ') + fmt(kkTot(r.A0)) + ' → ' + fmt(kkTot(r.A1)) + '</p>';
  }
  if (r.yarali) h += '<p class="eff">⚕️ ' + fmt(r.yarali) + kkL(' asker yaralı olarak revire gitti; iyileşince orduya döner.', ' soldiers went to the infirmary wounded; they rejoin the army once healed.') + '</p>';
  const lt = kkRapLoot(r.loot); if (lt) h += '<p class="eff">' + (r.yer === 'savunma' && !r.win ? kkL('Yağmalanan: ', 'Plundered: ') : kkL('Ganimet: ', 'Loot: ')) + '<b>' + kkEsc(lt) + '</b>' + (r.cesur && r.win ? kkL(' (cesur sefer, +%25)', ' (bold march, +25%)') : '') + '</p>';
  h += kkRapGrafik(r);
  if (r.mx) {
    const mv = Object.keys(r.mx).map(function (key) { const ben = key[0] === 'A', p = key.slice(2).split('>'), a = p[0], d = p[1]; return { x: r.mx[key], ben: ben, a: a, d: d, m: U[a] && U[d] ? mul(a, d) : 1 }; }).filter(function (v) { return v.x > 0 && U[v.a] && U[v.d]; }).sort(function (p, q) { return q.x - p.x; }).slice(0, 4);
    if (mv.length) h += '<p class="rbas">' + kkL('En çok hasar verenler', 'Biggest hitters') + '</p><ul class="rl">' + mv.map(function (v) { return '<li>' + (v.ben ? '🔵 ' : '🔴 ') + kkEsc(kkT(U[v.a].n)) + ' → ' + kkEsc(kkT(U[v.d].n)) + ': ' + fmt(v.x) + kkL(' hasar', ' dmg') + (v.m > 1 ? ' <small class="rust">' + kkL('üstün ×2', 'strong ×2') + '</small>' : v.m < 1 ? ' <small class="rk">' + kkL('zayıf ×½', 'weak ×½') + '</small>' : '') + '</li>'; }).join('') + '</ul>';
  }
  h += kkRapOneri(r);
  if (r.hava && r.hava !== 'acik' && typeof HAVA !== 'undefined' && HAVA[r.hava]) h += '<p class="eff"><small>' + HAVA[r.hava].i + ' ' + kkL('Savaş sırasında hava: ' + HAVA[r.hava].n, 'Weather during the battle: ' + HAVA[r.hava].ne) + '</small></p>';
  h += '<div class="btns wrapb" style="gap:6px;margin-top:8px">' + (r.sn && r.sn.length ? '<button class="sm g" data-rsah="' + r.id + '">▶ ' + kkL('Sahneyi izle', 'Watch the battle') + '</button>' : '') + (kkRapHedefVar(r) ? '<button class="sm g" data-rhed="' + r.id + '">🎯 ' + kkL('Hedefi aç', 'Open target') + '</button>' : '') + '</div>';
  return h + '</div>';
}
function kkRapHedefVar(r) {
  try { if (r.yer !== 'saldiri' || !r.kind) return false; return !!kkRapHedef(r); } catch (e) { return false; }
}
function kkRapHedef(r) {
  return wEnts().find(function (e) {
    if (e.k !== r.kind) return false;
    if (r.kind === 'wave') return true;
    if (r.kind === 'ter') return e.id === r.hedef && !e.own && e.open;
    if (r.kind === 'lord') return e.l.id === r.hedef && !e.l.beaten;
    if (r.kind === 'obj') return e.o.id === r.hedef;
    return false;
  });
}
function kkRapPosta(r) { return postaListe().find(function (m) { return m.rid === r.id; }); }
/* Savaş sekmesinde son 3 savaş; tamamı posta kutusunda */
function raporHtml() {
  const L = Array.isArray(S.raporlar) ? S.raporlar : [];
  let h = '<div class="top"><h3>📜 ' + kkL('Son savaşlar', 'Recent battles') + '</h3>';
  if (!L.length) return h + '</div><p class="eff" style="margin:6px 0 0">' + kkL('Henüz savaş yok. Bir hedefe sefer gönderdiğinde ya da bir baskını savunduğunda raporu posta kutuna gelir.', 'No battles yet. Reports arrive in your mailbox once you send a march or defend a raid.') + '</p>';
  const son = L.slice(0, 10), z = son.filter(function (r) { return r.win && r.yer !== 'siginma'; }).length, y = son.length - z;
  h += '<span class="lv">' + kkL('son ' + son.length + ': ', 'last ' + son.length + ': ') + z + ' ✓ · ' + y + ' ✗</span></div>';
  h += L.slice(0, 3).map(function (r) { const m = kkRapPosta(r); return kkRapSatir(r, m && !m.ok) + (kkRapAcik === r.id ? kkRapDetay(r) : ''); }).join('');
  const sv = postaListe().filter(function (m) { return (m.tur === 'savas' || m.tur === 'savunma') && !m.ok; }).length;
  h += '<button class="sm g rmore" data-rposta="1">✉️ ' + kkL('Tüm raporlar posta kutusunda', 'All reports are in your mailbox') + (sv ? ' · ' + kkL(sv + ' okunmamış', sv + ' unread') : '') + '</button>';
  return h;
}
function raporRender() {
  const el = $('raporv'); if (!el) return;
  const h = raporHtml(); if (el._h !== h) { el._h = h; el.innerHTML = h; }
}
function raporInit() {
  const el = $('raporv'); if (!el || el._bag) return; el._bag = 1;
  el.addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.rap) { const id = +b.dataset.rap; kkRapAcik = kkRapAcik === id ? null : id; const r = (S.raporlar || []).find(function (x) { return x.id === id; }), m = r && kkRapPosta(r); if (m && kkRapAcik) postaOkundu(m.id); el._h = ''; raporRender(); return; }
    if (b.dataset.rposta) { postaAc('hep'); return; }
    if (b.dataset.rfil) { kkRapFiltre = b.dataset.rfil; kkRapAcik = null; el._h = ''; raporRender(); return; }
    if (b.dataset.rtum) { kkRapTum = !kkRapTum; el._h = ''; raporRender(); return; }
    if (b.dataset.rsah) { const r = (S.raporlar || []).find(function (x) { return x.id === +b.dataset.rsah; }); if (r) kkSahneOyna({ ad: r.ad, kind: r.kind, cap: { A0: r.A0, B0: r.E0, A1: r.A1, B1: r.E1, sn: r.sn }, win: r.yer === 'kusatma' ? true : r.win, rep: false, col: r.col }); return; }
    if (b.dataset.rhed) { const r = (S.raporlar || []).find(function (x) { return x.id === +b.dataset.rhed; }); const t = r && kkRapHedef(r); if (t) { wSelect(t); const hv = $('hedefv'); if (hv) { hv._h = ''; render(); const c = hv.querySelector('.hsel'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); } } return; }
  });
}
/* savaş sahnesindeki "Raporu gör": posta kutusunda o savaşın mektubunu açar */
function kkRapGoster(id) {
  const r = (S.raporlar || []).find(function (x) { return x.id === id; }) || (S.raporlar || [])[0];
  const m = r && kkRapPosta(r);
  postaAc(m ? m.tur : 'savas', m ? m.id : null);
}
