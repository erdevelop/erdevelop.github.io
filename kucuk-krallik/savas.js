/* Küçük Krallık · Savaş sekmesi
   Tek bir hedef listesi: dalga, sıradaki bölge, haydut kampları, kaynak noktaları, lordlar ve kuşatma.
   Bir hedefe dokununca kartı açılır; ordu düşmana göre kendiliğinden ayarlanır ve oradan sefer gönderilir.
   Kart, haritadaki hedef kartıyla aynıdır (w2Card); böylece harita ve sekme aynı şekilde çalışır. */


function hedefYolda(kind, target) { return (S.sefer || []).some(function (m) { return m.ph === 'go' && m.kind === kind && (target == null || m.target === target); }); }
function hedefPil(e) {
  const r = wEst(e); if (!r || /asker/.test(r)) return '';
  const t = /kolay/.test(r) ? 'kolay' : /kazan/.test(r) ? 'kazanırsın' : /zorlu/.test(r) ? 'zorlu' : 'güçlü';
  return '<span class="hpill" style="background:' + wEstCol(r) + '">' + kkEsc(kkT(t)) + '</span>';
}
function hedefSatir(e, ic, title, sub, pill) {
  const id = e.k === 'ter' ? e.id : e.k === 'lord' ? e.l.id : e.k === 'obj' ? e.o.id : '';
  return '<button class="hrow" data-hk="' + e.k + '" data-hid="' + kkEsc(id) + '"><span class="hic">' + ic + '</span><span class="hmid"><b>' + title + '</b><small>' + sub + '</small></span>' + (pill || '') + '<span class="hch" aria-hidden="true">›</span></button>';
}
function hedefHtml() {
  ensureLords(); bossSeason(); ensureMapObj(); // lordlar, kuşatma ve harita nesneleri güncel kalsın
  const E = wEnts(), now = Date.now(), ac = kkAcemi(), secili = E.find(wSelIs);
  const say = function (X) { return fmt(Math.round(kkTot(X))); };
  const yol = function (kind, target) { return hedefYolda(kind, target) ? ' · ⚔️ ' + kkL('yolda', 'on the way') : ''; };
  const kart = function (e) { // seçili hedef: açık kart
    window._w2Tab = 1; let c = ''; try { c = w2Card(); } finally { window._w2Tab = 0; }
    return '<div class="hsel">' + c.replace('</div>', '<button class="mini" data-hx="1" aria-label="' + kkL('Kapat', 'Close') + '" title="' + kkL('Kapat', 'Close') + '">▴</button></div>') + '</div>';
  };
  const koy = function (e, satir) { return secili && secili.k === e.k && (e.k === 'ter' ? secili.id === e.id : e.k === 'lord' ? secili.l.id === e.l.id : e.k === 'obj' ? secili.o.id === e.o.id : true) ? kart(e) : satir; };
  const grup = function (ad, satirlar) { return satirlar.length ? '<p class="hgrp">' + ad + '</p>' + satirlar.join('') : ''; };
  let h = '';

  // 0) haftalık etkinlik: ilerleme kartı ve (ejder haftasında) ejder ini
  if (!ac) {
    const ek = typeof etkHtml === 'function' ? etkHtml() : '';
    const ej = E.find(function (e) { return e.k === 'obj' && e.o.ej; });
    let er = '';
    if (ej) { const o = ej.o, T = wTargetEnemy(ej); er = koy(ej, hedefSatir(ej, '🐉', kkL('Ejder İni · Sv ', 'Dragon’s Lair · Lv ') + o.lv, kkL('Düşman ', 'Enemy ') + say(T[0]) + kkL(' asker · büyük ganimet', ' soldiers · big loot') + yol('obj', o.id), hedefPil(ej))); }
    if (ek) h += '<p class="hgrp">' + kkL('Haftalık etkinlik', 'Weekly event') + '</p>' + ek + er;
  }

  // 1) ilerleme: dalga ve sıradaki bölge
  const g1 = [];
  const wv = E.find(function (e) { return e.k === 'wave'; });
  if (wv) { const w = S.wave || 1, T = wTargetEnemy(wv); g1.push(koy(wv, hedefSatir(wv, w % 5 === 0 ? '👹' : '🔥', kkL('Dalga ', 'Wave ') + w + (w % 5 === 0 ? ' · Boss' : ''), kkL('Düşman ', 'Enemy ') + say(T[0]) + kkL(' asker · kazanınca sonraki dalga açılır', ' soldiers · win to unlock the next wave') + yol('wave'), hedefPil(wv)))); }
  const tr = E.find(function (e) { return e.k === 'ter' && !e.own && e.open; });
  if (tr) { const t = tr.t, T = wTargetEnemy(tr); g1.push(koy(tr, hedefSatir(tr, BIO[t.r] || '🏞️', (tr.id + 1) + '. ' + kkEsc(kkT(t.n)), kkL('Bölge fethi · düşman ', 'Conquest · enemy ') + say(T[0]) + kkL(' asker · kalıcı +', ' soldiers · permanent +') + t.y.toFixed(2) + ' ' + kkT(RNN[t.r]) + kkL('/sn', '/s') + yol('ter', tr.id), hedefPil(tr)))); }
  else if (E.some(function (e) { return e.k === 'ter'; }) && !E.some(function (e) { return e.k === 'ter' && !e.own; })) g1.push('<p class="eff" style="margin:2px 2px 6px">' + kkL('🏆 Bütün bölgeler senin.', '🏆 All regions are yours.') + '</p>');
  h += grup(kkL('İlerleme', 'Progress'), g1);

  // 2) fırsatlar: kamplar ve kaynak noktaları
  const g2 = [];
  E.filter(function (e) { return e.k === 'obj' && e.o.k === 'camp' && !e.o.ej; }).sort(function (a, b) { return a.o.lv - b.o.lv; }).forEach(function (e) {
    const o = e.o, T = wTargetEnemy(e);
    g2.push(koy(e, hedefSatir(e, '⛺', kkL('Haydut kampı · Sv ', 'Bandit camp · Lv ') + o.lv, kkL('Düşman ', 'Enemy ') + say(T[0]) + kkL(' asker · ganimet · ', ' soldiers · loot · ') + tm(Math.max(0, (o.e - now) / 1000)) + kkL(' sonra dağılır', ' until it disperses') + yol('obj', o.id), hedefPil(e))));
  });
  E.filter(function (e) { return e.k === 'obj' && e.o.k === 'res'; }).forEach(function (e) {
    const o = e.o, calisan = (S.sefer || []).some(function (m) { return m.kind === 'obj' && m.target === o.id; });
    g2.push(koy(e, hedefSatir(e, BIO[o.r] || '⛏️', kkEsc(kkT(RESAD[o.r] || 'Kaynak')) + kkL(' · Sv ', ' · Lv ') + o.lv, kkL('Kalan ', 'Remaining ') + fmt(o.amt) + ' ' + kkT(RNN[o.r]) + kkL(' · savaş yok, askerler toplar', ' · no battle, soldiers gather') + (calisan ? ' · ⛏️ ' + kkL('birlik orada', 'troops there') : ''), '<span class="hpill hpn">' + kkL('topla', 'gather') + '</span>')));
  });
  if (!ac) h += grup(kkL('Fırsatlar', 'Opportunities'), g2) + '<div class="btns" style="margin:2px 0 4px"><button class="sm g" data-hara="1">🔍 ' + kkL('Kamp ya da kaynak ara', 'Search camps or resources') + '</button></div>';

  // 3) lordlar ve kuşatma
  if (!ac) {
    const g3 = [];
    E.filter(function (e) { return e.k === 'lord'; }).forEach(function (e) {
      const l = e.l, d = dipAktif(l);
      const pill = l.beaten ? '<span class="hpill hpn">⏳ ' + tm(Math.max(0, (l.e - now) / 1000)) + '</span>' : d ? '<span class="hpill hpn">' + (d.t === 'ittifak' ? '🛡️ ' + kkL('müttefik', 'ally') : '🤝 ' + kkL('ticaret', 'trade')) + '</span>' : hedefPil(e);
      g3.push(koy(e, hedefSatir(e, '<span style="color:' + l.col + '">' + (l.cr || '👑') + '</span>', kkEsc(kkT(l.ad)), kkL('Lord · Kademe ', 'Lord · Tier ') + (l.tier || 1) + (l.beaten ? kkL(' · yenildi, daha güçlü dönecek', ' · defeated, will return stronger') : ' · ' + say(l.ordu) + kkL(' asker', ' soldiers') + (l.kin ? ' · 😠' : '') + yol('lord', l.id)), pill)));
    });
    const bs = E.find(function (e) { return e.k === 'boss'; });
    if (bs && S.boss) {
      const b = S.boss, bitti = b.beaten;
      g3.push(koy(bs, hedefSatir(bs, '🏯', kkL('Dünya Kuşatması', 'World Siege') + (bitti ? '' : kkL(' · Kademe ', ' · Tier ') + (b.tier || 1)), bitti ? kkL('Kuşatma kırıldı · yenisi ', 'Siege broken · next in ') + tm(Math.max(0, (b.e - now) / 1000)) + kkL(' sonra', '') : kkL('Sur ', 'Walls ') + fmt(b.hp) + ' / ' + fmt(b.max) + kkL(' · birkaç seferde yıkılır', ' · falls after several marches') + yol('boss'), '<span class="hpill hpn">' + (bitti ? '⏳' : kkL('kuşat', 'siege')) + '</span>')));
    }
    h += grup(kkL('Lordlar ve kuşatma', 'Lords and siege'), g3);
    if (g3.length && S.sancak) h += '<p class="eff" style="margin:2px 2px 6px"><small>🚩 ' + kkL(S.sancak + ' lord sancağı · bütün ganimet +%' + S.sancak, S.sancak + ' lord banners · all loot +' + S.sancak + '%') + kkL(' · 3. kademe ve üstü lordlar sancak düşürebilir', ' · lords of tier 3 and above can drop banners') + '</small></p>';
  }
  return h;
}
function renderHedef() {
  const el = $('hedefv'); if (!el || !el._bag) return; // oyun hazır olmadan çizme
  if (window.mapOpen) { if (el._h !== '') { el.innerHTML = ''; el._h = ''; } return; } // harita açıkken aynı kart orada gösterilir
  const ae = document.activeElement; if (ae && el.contains(ae) && (ae.type === 'range' || ae.type === 'number')) return;
  let h = ''; try { h = hedefHtml(); } catch (e) { console.error('hedef', e); return; }
  if (el._h !== h) { el.innerHTML = h; el._h = h; }
  const ss = $('sonSavas');
  if (ss) {
    const s = S.lr ? '<div class="foot" style="align-items:center"><span class="eff" style="margin:0"><b>' + kkL('Son savaş:', 'Last battle:') + '</b> ' + kkEsc(kkT(S.lr)) + '</span>' + (S.rep ? '<button class="sm g" data-hrep="1">' + (repOpen ? kkL('Raporu kapat', 'Close report') : kkL('Rapor', 'Report')) + '</button>' : '') + '</div>' : '';
    if (ss._h !== s) { ss._h = s; ss.innerHTML = s; ss.classList.toggle('hide', !s); }
  }
}
function hedefBul(k, id) { return wEnts().find(function (e) { if (e.k !== k) return false; if (k === 'ter') return String(e.id) === String(id); if (k === 'lord') return String(e.l.id) === String(id); if (k === 'obj') return String(e.o.id) === String(id); return true; }); }
function savasInit() {
  const el = $('hedefv'); if (!el || el._bag) return; el._bag = 1;
  window.selKind = 'none';
  if (typeof w2BindEl === 'function') w2BindEl(el); // asker kaydırıcıları, otomatik, sıraya ekle
  el.addEventListener('click', function (ev) {
    const row = ev.target.closest('.hrow');
    if (row) { const e = hedefBul(row.dataset.hk, row.dataset.hid); if (e) { wSelect(e); el._h = ''; renderHedef(); const c = el.querySelector('.hsel'); if (c) requestAnimationFrame(function () { const r = c.getBoundingClientRect(), nav = $('tabs'), top = nav ? nav.getBoundingClientRect().height + 6 : 0; if (r.top < top || r.bottom > window.innerHeight) window.scrollTo({ top: Math.max(0, r.top + window.scrollY - top - 34), behavior: 'smooth' }); }); } return; }
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.etka != null) { etkAl(+b.dataset.etka); el._h = ''; return; }
    if (b.dataset.hx) { window.selKind = 'none'; window.w2AI = null; el._h = ''; render(); return; }
    if (b.dataset.hara) { mapAc(); setTimeout(function () { try { w2SearchOpen(); } catch (e) { } }, 120); return; }
    if (!b.disabled && (b.dataset.kt != null || b.dataset.lord || b.dataset.boss || b.dataset.kw || b.dataset.ko)) {
      const n0 = (S.sefer || []).length; seferBtn(b);
      if ((S.sefer || []).length > n0) { window.selKind = 'none'; window.w2AI = null; el._h = ''; render(); const sv = $('seferv'); if (sv) requestAnimationFrame(function () { const r = sv.getBoundingClientRect(); if (r.top < 0) window.scrollTo({ top: Math.max(0, r.top + window.scrollY - 110), behavior: 'smooth' }); }); }
    }
  });
  const ss = $('sonSavas'); if (ss) ss.addEventListener('click', function (ev) { const b = ev.target.closest('button[data-hrep]'); if (!b) return; repOpen = !repOpen; ss._h = ''; render(); if (repOpen) { const r = $('rep'); if (r) requestAnimationFrame(function () { r.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }); } });
}
