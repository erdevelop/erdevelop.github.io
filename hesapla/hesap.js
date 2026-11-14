/* erdevelop · hesaplama sayfaları ortak yardımcıları ve formülleri
   Formüller hesapla/formul.js içinde (Araç Kutusu da aynı dosyayı kullanır); burada yalnızca ekrana yazma var. */
'use strict';
const byId = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
if (!window.HF) console.error("hesapla/formul.js yüklenmemiş");
const pnum = HF.pnum;
const num = id => pnum(byId(id).value);
const fmt = (n, d = 2) => isFinite(n) ? n.toLocaleString('tr-TR', { maximumFractionDigits: d }) : '—';
const tl = n => isFinite(n) ? n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '—';
const p2 = n => String(n).padStart(2, '0');
const GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
function show(id, big, rows, note) { const el = byId(id); if (!el) return;
  if (big === undefined) { el.innerHTML = '<span class="ph">Değerleri girince sonuç burada görünür.</span>'; return; }
  el.innerHTML = (big !== '' ? `<div class="big">${big}</div>` : '') + (note ? `<div class="nt">${note}</div>` : '') + (rows || []).map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join(''); }
function pd(id) { const v = byId(id).value; if (!v) return null; const d = new Date(v + 'T00:00:00'); return isNaN(d) ? null : d; }
const { dd, units, SHP, rint } = HF;
const today0 = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const isoDay = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());

const H = {
  yas() {
    const today = today0(), b = pd('t-dog'), r = HF.yas(b, today);
    if (r) show('t-o1', r.y + ' yaşında', [['Tam olarak', `${r.y} yıl ${r.m} ay ${r.d} gün`], ['Yaşanan gün', fmt(r.gun, 0)], ['Yaşanan hafta', fmt(Math.floor(r.gun / 7), 0)], ['Doğduğun gün', GUN[b.getDay()]], ['Sonraki doğum günü', r.kalan === 0 ? 'Bugün! 🎉' : r.kalan + ' gün sonra (' + GUN[r.sonraki.getDay()] + ')']]);
    else show('t-o1', b ? '' : undefined, b ? [['Uyarı', 'Doğum tarihi bugünden sonra olamaz']] : null);
  },
  gun() {
    const today = today0(), a = pd('t-a'), c = pd('t-b');
    if (a && c) { const r = HF.gunFark(a, c), g = r.gun;
      show('t-o2', fmt(g, 0) + ' gün', [['Hafta', `${Math.floor(g / 7)} hafta ${g % 7} gün`], ['Yıl / ay / gün', `${r.y} yıl ${r.m} ay ${r.d} gün`], ['İş günü (Pzt–Cum)', fmt(r.isGunu, 0)], ['Saat', fmt(g * 24, 0)]], r.ters ? 'Bitiş tarihi başlangıçtan önce' : ''); }
    else show('t-o2');
    const e = pd('t-e'), n = num('t-n');
    if (e && isFinite(n)) { const r = HF.tarihEkle(e, n); show('t-o3', r.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }), [['Gün', GUN[r.getDay()]], ['Bugünden itibaren', fmt(dd(today, r), 0) + ' gün']]); }
    else show('t-o3');
  },
  kdv() {
    const o = num('k-oran'), inc = byId('k-mod').value === 'dahil', r = HF.kdv(num('k-tut'), o, inc);
    if (!r) { show('k-out'); return; }
    show('k-out', inc ? tl(r.matrah) : tl(r.toplam), [['Matrah (KDV hariç)', tl(r.matrah)], ['KDV (%' + fmt(o) + ')', tl(r.kdv)], ['Toplam (KDV dahil)', tl(r.toplam)]], inc ? 'KDV hariç tutar' : 'KDV dahil tutar');
  },
  yuzde() {
    let a = num('p-a1'), b = num('p-b1');
    isFinite(a) && isFinite(b) ? show('p-o1', fmt(HF.yuzdesi(a, b), 4), [], `${fmt(a, 4)} × %${fmt(b, 4)}`) : show('p-o1');
    a = num('p-a2'); b = num('p-b2');
    isFinite(a) && isFinite(b) && b !== 0 ? show('p-o2', '%' + fmt(HF.yuzdeKac(a, b), 4), [], `${fmt(a, 4)}, ${fmt(b, 4)} sayısının`) : show('p-o2');
    a = num('p-a3'); b = num('p-b3');
    if (isFinite(a) && a !== 0 && isFinite(b)) { const c = HF.degisim(a, b); show('p-o3', (c > 0 ? '+' : c < 0 ? '−' : '') + '%' + fmt(Math.abs(c), 2), [['Fark', fmt(b - a, 4)]], c > 0 ? 'artış' : c < 0 ? 'azalış' : 'değişim yok'); } else show('p-o3');
    a = num('p-a4'); b = num('p-b4');
    if (isFinite(a) && isFinite(b)) { const r = HF.indirim(a, b); show('p-o4', fmt(r.indirimli, 2), [['İndirim tutarı', fmt(r.tutar, 2)], ['Zamlı hali (+%' + fmt(b, 2) + ')', fmt(r.zamli, 2)]], 'indirimli fiyat'); } else show('p-o4');
  },
  kredi() {
    const P = num('c-tut'), vg = byId('c-vg').checked ? (num('c-vgo') || 0) / 100 : 0;
    byId('c-vgo').disabled = !byId('c-vg').checked;
    const r = HF.kredi(P, num('c-faiz') / 100, num('c-vade'), vg);
    if (!r) { show('c-out'); byId('c-tab').innerHTML = ''; return; }
    show('c-out', tl(r.taksit), [['Toplam geri ödeme', tl(r.toplam)], ['Toplam faiz' + (vg ? ' + vergi' : ''), tl(r.faiz)], ['Vergili aylık oran', '%' + fmt(r.r * 100, 3)]], 'aylık taksit');
    byId('c-tab').innerHTML = `<table><thead><tr><th>Ay</th><th>Anapara</th><th>Faiz${vg ? '+vergi' : ''}</th><th>Kalan</th></tr></thead><tbody>${r.plan.map(p => `<tr><td>${p.ay}</td><td>${tl(p.anapara)}</td><td>${tl(p.faiz)}</td><td>${tl(p.kalan)}</td></tr>`).join('')}</tbody></table>`;
  }
};

/* sayfayı bağla: girdileri hatırla, yazdıkça hesapla, hızlı düğmeler */
function bagla(key) {
  const f = H[key], LSK = 'hesapla:' + key + ':';
  document.querySelectorAll('main input, main select').forEach(el => {
    if (!el.id || el.hasAttribute('data-nosave')) return;
    try { const v = localStorage.getItem(LSK + el.id); if (v != null) { if (el.type === 'checkbox') el.checked = v === '1'; else el.value = v; } } catch (e) { }
    const s = () => { try { localStorage.setItem(LSK + el.id, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value); } catch (e) { } };
    el.addEventListener('input', s); el.addEventListener('change', s);
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-set]'); if (!b) return; const el = byId(b.dataset.set); el.value = b.dataset.v; el.dispatchEvent(new Event('input', { bubbles: true })); });
  document.querySelectorAll('[data-bugun]').forEach(el => { if (!el.value) el.value = isoDay(today0()); });
  const m = document.querySelector('main'); m.addEventListener('input', f); m.addEventListener('change', f); f();
}

/* ====== ek araçlar (formüller formul.js içinde) ====== */
function fmtU(n) { if (!isFinite(n)) return '—'; if (n === 0) return '0'; const a = Math.abs(n);
  if (a >= 1e-4 && a < 1e13) return n.toLocaleString('tr-TR', { maximumSignificantDigits: 9 }); return n.toExponential(5).replace('.', ','); }
function fillUnits() { const c = byId('b-cat').value, us = units(c); ['b-from', 'b-to'].forEach((id, i) => { const s = byId(id), keep = s.value; s.innerHTML = us.map(u => `<option>${esc(u)}</option>`).join(''); s.value = us.includes(keep) ? keep : us[Math.min(i, us.length - 1)]; }); }

function alShape() { const S = SHP[byId('al-sek').value] || SHP.dikd, u = byId('al-u').value; for (let i = 1; i <= 3; i++) { const l = S.f[i - 1]; byId('al-w' + i).hidden = !l; if (l) byId('al-l' + i).textContent = (S.r || []).includes(i - 1) ? l : l + ' (' + u + ')'; } }

Object.assign(H, {
  vki() {
    const r = HF.vki(num('v-boy'), num('v-kg')); if (!r) { show('v-out'); return; }
    show('v-out', fmt(r.vki, 1), [['Kategori (DSÖ)', r.kategori], ['Boyuna göre sağlıklı aralık', fmt(r.min, 1) + ' – ' + fmt(r.max, 1) + ' kg']], 'VKİ');
  },
  birim() {
    const c = byId('b-cat').value; if (!byId('b-from').options.length || byId('b-from').dataset.cat !== c) { fillUnits(); byId('b-from').dataset.cat = c; }
    const v = num('b-val'), f = byId('b-from').value, t = byId('b-to').value;
    if (!isFinite(v)) { show('b-out'); byId('b-all').innerHTML = ''; return; }
    show('b-out', fmtU(HF.cevir(c, v, f, t)) + ' ' + esc(t), [], `${fmtU(v)} ${esc(f)} =`);
    byId('b-all').innerHTML = units(c).map(u => `<div class="kv"><span>${esc(u)}</span><b>${fmtU(HF.cevir(c, v, f, u))}</b></div>`).join('');
  },
  faiz() {
    const st = num('fz-st') || 0, m = HF.mevduat(num('fz-t'), num('fz-r'), num('fz-g'), st);
    if (m) show('fz-o1', tl(m.vadeSonu), [['Brüt getiri', tl(m.brut)], ['Stopaj (%' + fmt(st) + ')', tl(m.stopaj)], ['Net getiri', tl(m.net)], ['Net yıllık oran', '%' + fmt(m.netYillik, 2)]], 'vade sonu (net)'); else show('fz-o1');
    const y = num('fz-n'), b = HF.birikim(num('fz-b'), num('fz-c'), num('fz-y'), y);
    if (b) show('fz-o2', tl(b.son), [['Toplam yatırılan', tl(b.yatirilan)], ['Kazanç', tl(b.kazanc)]], fmt(y, 1) + ' yıl sonunda (aylık bileşik)'); else show('fz-o2');
    const re = HF.reel(num('fz-nom'), num('fz-enf')); if (isFinite(re)) show('fz-o3', '%' + fmt(re, 2), [], re >= 0 ? 'reel getiri (enflasyonun üstünde)' : 'reel kayıp (enflasyonun altında)'); else show('fz-o3');
  },
  yazi() {
    const v = num('yz-n'), asTL = byId('yz-tl').checked, s = HF.yazi(v, asTL, byId('yz-st').value);
    if (s == null) { show('yz-out'); return; }
    byId('yz-out').innerHTML = `<div class="nt">${esc(asTL ? tl(v) : fmt(v, 6))}</div><div class="big" style="font-size:1.25rem">${esc(s)}</div><div class="btns"><button class="btn sm ghost" type="button" id="yz-cp">Kopyala</button></div>`;
    byId('yz-cp').onclick = async e => { try { await navigator.clipboard.writeText(s); e.target.textContent = 'Kopyalandı ✓'; } catch (x) { } };
  },
  rastgele() { },
  ortalama() {
    const r = HF.istatistik(HF.sayilar(byId('a-txt').value));
    if (!r) show('a-out'); else show('a-out', fmt(r.ort, 4), [['Adet', r.n], ['Toplam', fmt(r.toplam, 4)], ['Medyan', fmt(r.medyan, 4)], ['En küçük', fmt(r.min, 4)], ['En büyük', fmt(r.max, 4)], ['Standart sapma', fmt(r.ss, 4)]], 'ortalama');
    const w = HF.agirlikli(byId('a-w').value); /* her satır "değer ağırlık" (ör. not ve kredi) */
    if (w) show('a-o2', fmt(w.ort, 4), [['Satır', w.satir], ['Toplam ağırlık', fmt(w.agirlik, 4)]], 'ağırlıklı ortalama'); else show('a-o2');
  },
  oran() {
    const a = num('o-a'), b = num('o-b'), c = num('o-c'), ters = byId('o-mod').value === 'ters', x = HF.oranti(a, b, c, ters);
    if (!isFinite(x)) { show('o-out'); return; }
    show('o-out', 'X = ' + fmt(x, 6), [], ters ? `${fmt(a, 6)} × ${fmt(b, 6)} ÷ ${fmt(c, 6)}` : `${fmt(b, 6)} × ${fmt(c, 6)} ÷ ${fmt(a, 6)}`);
  },
  yakit() {
    const y = HF.yakit(num('y-km'), num('y-tk'), num('y-fy'), num('y-ks'), byId('y-gd').checked);
    if (y) { if (isFinite(y.tutar)) show('y-out', tl(y.tutar), [['Yakıt', fmt(y.litre) + ' L'], ['Toplam mesafe', fmt(y.km, 1) + ' km'], ['Kişi başı', tl(y.kisiBasi)], ['Km başı', tl(y.kmBasi)]], 'toplam yakıt masrafı');
      else show('y-out', fmt(y.litre) + ' L', [], 'Tutarı görmek için yakıt fiyatını gir.'); } else show('y-out');
    const t = HF.tuketim(num('y-l'), num('y-k2'), num('y-tt'));
    if (t) { const r = [['Km / litre', fmt(t.kmL)]]; if (isFinite(t.kmBasi)) r.push(['Km başı maliyet', tl(t.kmBasi)], ['Litre fiyatı', tl(t.litreFiyat)]); show('y-out2', fmt(t.l100) + ' L/100 km', r); } else show('y-out2');
  },
  kar() {
    const kd = num('kr-kdv') || 0, s = HF.satisFiyati(num('kr-mal'), num('kr-or'), byId('kr-mod').value, kd);
    if (s) show('kr-o1', tl(s.satis), [['Birim kâr', tl(s.kar)], ['Satıştan marj', '%' + fmt(s.marj, 2)], ['Maliyet üstü (markup)', '%' + fmt(s.markup, 2)], ['KDV dahil satış (%' + fmt(kd) + ')', tl(s.kdvDahil)]], 'KDV hariç satış fiyatı'); else show('kr-o1');
    const k = HF.karMarj(num('kr-a'), num('kr-b')); if (k) show('kr-o2', tl(k.kar), [['Satıştan marj', '%' + fmt(k.marj, 2)], ['Maliyet üstü (markup)', '%' + fmt(k.markup, 2)]], k.kar >= 0 ? 'birim kâr' : 'birim zarar'); else show('kr-o2');
    const b = HF.basabas(num('kr-sg'), num('kr-bm'), num('kr-bf')); if (b) show('kr-o3', fmt(b.adet, 0) + ' adet', [['Gereken ciro', tl(b.ciro)], ['Birim katkı payı', tl(b.katki)]], 'başabaş için satılması gereken'); else show('kr-o3');
  },
  alan() {
    alShape(); const un = byId('al-u').value, x = HF.alan(byId('al-sek').value, [1, 2, 3].map(i => num('al-' + i)), un);
    if (!x) { show('al-out'); return; } const { S, R, u } = x; if (!R) { show('al-out', '', [], 'Bu ölçülerle şekil oluşmuyor.'); return; } const rows = [];
    if (S.d3) { rows.push(['Hacim', fmt(R.V, 6) + ' m³']); if (un !== 'm') rows.push(['Hacim (' + un + '³)', fmt(R.V / u ** 3, 2)]); rows.push(['Litre', fmt(R.V * 1000, 3) + ' L'], ['Yüzey alanı', fmt(R.S, 4) + ' m²']); show('al-out', fmt(R.V, 4) + ' m³', rows, 'hacim'); }
    else { rows.push(['Alan', fmt(R.A, 6) + ' m²']); if (un !== 'm') rows.push(['Alan (' + un + '²)', fmt(R.A / u / u, 2)]); if (R.P) rows.push(['Çevre', fmt(R.P, 4) + ' m']); (R.x || []).forEach(([a, b]) => rows.push([a, fmt(b, 4) + ' m'])); show('al-out', fmt(R.A, 4) + ' m²', rows, 'alan'); }
  }
});

/* kura / rastgele: düğmeyle çalışır */
function rastgeleKur() {
  const FACES = '⚀⚁⚂⚃⚄⚅', kList = () => byId('r-liste').value.split('\n').map(s => s.trim()).filter(Boolean), out = byId('r-kura');
  const empty = () => { out.innerHTML = '<span class="ph">Önce listeye en az bir isim ya da seçenek yaz (her satıra bir tane).</span>'; };
  byId('r-sec').onclick = () => { const l = kList(); if (!l.length) return empty(); const n = Math.max(1, Math.min(l.length, Math.round(num('r-adet') || 1)));
    for (let i = l.length - 1; i > 0; i--) { const j = rint(0, i); [l[i], l[j]] = [l[j], l[i]]; }
    out.innerHTML = `<div class="nt">${l.length} kişi/seçenek arasından ${n} kazanan</div>` + l.slice(0, n).map((x, i) => `<div class="kv"><span>${n > 1 ? (i + 1) + '.' : '🎉'}</span><b>${esc(x)}</b></div>`).join(''); };
  byId('r-kar').onclick = () => { const l = kList(); if (!l.length) return empty(); for (let i = l.length - 1; i > 0; i--) { const j = rint(0, i); [l[i], l[j]] = [l[j], l[i]]; } out.innerHTML = '<div class="nt">Karışık sıra</div>' + l.map((x, i) => `<div class="kv"><span>${i + 1}.</span><b>${esc(x)}</b></div>`).join(''); };
  byId('r-tak').onclick = () => { const l = kList(); if (!l.length) return empty(); const t = Math.max(2, Math.round(num('r-tn') || 2)); for (let i = l.length - 1; i > 0; i--) { const j = rint(0, i); [l[i], l[j]] = [l[j], l[i]]; } const T = Array.from({ length: t }, () => []); l.forEach((x, i) => T[i % t].push(x));
    out.innerHTML = T.map((g, i) => `<div class="kv"><span>Takım ${i + 1}</span><b>${g.map(esc).join(', ')}</b></div>`).join(''); };
  byId('r-numb').onclick = () => { const a = Math.ceil(num('r-min')), b = Math.floor(num('r-max')), el = byId('r-num'); el.textContent = isFinite(a) && isFinite(b) && b >= a ? fmt(rint(a, b), 0) : 'Aralığı kontrol et'; };
  byId('r-zarb').onclick = () => { const n = Math.min(10, Math.max(1, Math.round(num('r-zn') || 1))), r = Array.from({ length: n }, () => rint(1, 6)); byId('r-zar').textContent = r.map(x => FACES[x - 1]).join(' ') + (n > 1 ? '  = ' + r.reduce((a, b) => a + b, 0) : ''); };
  byId('r-ytb').onclick = () => { byId('r-yt').textContent = rint(0, 1) ? '🪙 Yazı' : '🪙 Tura'; };
}
