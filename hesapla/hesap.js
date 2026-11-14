/* erdevelop · hesaplama sayfaları ortak yardımcıları ve formülleri
   (Araç Kutusu'ndaki hesaplarla aynı formüller) */
'use strict';
const byId = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function pnum(s) { s = String(s == null ? '' : s).replace(/\s/g, '').replace(/[₺%]/g, ''); if (!s) return NaN;
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(',', '.');
  const v = parseFloat(s); return isFinite(v) ? v : NaN; }
const num = id => pnum(byId(id).value);
const fmt = (n, d = 2) => isFinite(n) ? n.toLocaleString('tr-TR', { maximumFractionDigits: d }) : '—';
const tl = n => isFinite(n) ? n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '—';
const p2 = n => String(n).padStart(2, '0');
const GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
function show(id, big, rows, note) { const el = byId(id); if (!el) return;
  if (big === undefined) { el.innerHTML = '<span class="ph">Değerleri girince sonuç burada görünür.</span>'; return; }
  el.innerHTML = (big !== '' ? `<div class="big">${big}</div>` : '') + (note ? `<div class="nt">${note}</div>` : '') + (rows || []).map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join(''); }
function pd(id) { const v = byId(id).value; if (!v) return null; const d = new Date(v + 'T00:00:00'); return isNaN(d) ? null : d; }
const dd = (a, b) => Math.round((b - a) / 864e5);
function ymd(a, b) { let y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
  if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); } if (m < 0) { y--; m += 12; } return [y, m, d]; }
const today0 = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const isoDay = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());

const H = {
  yas() {
    const today = today0(), b = pd('t-dog');
    if (b && b <= today) { const [y, m, d] = ymd(b, today); let nb = new Date(today.getFullYear(), b.getMonth(), b.getDate()); if (nb < today) nb = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate()); const kal = dd(today, nb);
      show('t-o1', y + ' yaşında', [['Tam olarak', `${y} yıl ${m} ay ${d} gün`], ['Yaşanan gün', fmt(dd(b, today), 0)], ['Yaşanan hafta', fmt(Math.floor(dd(b, today) / 7), 0)], ['Doğduğun gün', GUN[b.getDay()]], ['Sonraki doğum günü', kal === 0 ? 'Bugün! 🎉' : kal + ' gün sonra (' + GUN[nb.getDay()] + ')']]); }
    else show('t-o1', b ? '' : undefined, b ? [['Uyarı', 'Doğum tarihi bugünden sonra olamaz']] : null);
  },
  gun() {
    const today = today0();
    let a = pd('t-a'), c = pd('t-b');
    if (a && c) { let neg = false; if (c < a) { [a, c] = [c, a]; neg = true; } const g = dd(a, c), [y, m, d] = ymd(a, c); let is = 0;
      if (g <= 40000) for (let x = new Date(a); x < c; x.setDate(x.getDate() + 1)) { const w = x.getDay(); if (w && w < 6) is++; }
      show('t-o2', fmt(g, 0) + ' gün', [['Hafta', `${Math.floor(g / 7)} hafta ${g % 7} gün`], ['Yıl / ay / gün', `${y} yıl ${m} ay ${d} gün`], ['İş günü (Pzt–Cum)', g <= 40000 ? fmt(is, 0) : '—'], ['Saat', fmt(g * 24, 0)]], neg ? 'Bitiş tarihi başlangıçtan önce' : ''); }
    else show('t-o2');
    const e = pd('t-e'), n = num('t-n');
    if (e && isFinite(n)) { const r = new Date(e); r.setDate(r.getDate() + Math.round(n)); show('t-o3', r.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }), [['Gün', GUN[r.getDay()]], ['Bugünden itibaren', fmt(dd(today, r), 0) + ' gün']]); }
    else show('t-o3');
  },
  kdv() {
    const v = num('k-tut'), o = num('k-oran'), inc = byId('k-mod').value === 'dahil';
    if (!(v >= 0) || !(o >= 0)) { show('k-out'); return; }
    let m, k, t; if (inc) { t = v; m = v / (1 + o / 100); k = t - m; } else { m = v; k = v * o / 100; t = m + k; }
    show('k-out', inc ? tl(m) : tl(t), [['Matrah (KDV hariç)', tl(m)], ['KDV (%' + fmt(o) + ')', tl(k)], ['Toplam (KDV dahil)', tl(t)]], inc ? 'KDV hariç tutar' : 'KDV dahil tutar');
  },
  yuzde() {
    let a = num('p-a1'), b = num('p-b1');
    isFinite(a) && isFinite(b) ? show('p-o1', fmt(a * b / 100, 4), [], `${fmt(a, 4)} × %${fmt(b, 4)}`) : show('p-o1');
    a = num('p-a2'); b = num('p-b2');
    isFinite(a) && isFinite(b) && b !== 0 ? show('p-o2', '%' + fmt(a / b * 100, 4), [], `${fmt(a, 4)}, ${fmt(b, 4)} sayısının`) : show('p-o2');
    a = num('p-a3'); b = num('p-b3');
    if (isFinite(a) && a !== 0 && isFinite(b)) { const c = (b - a) / Math.abs(a) * 100; show('p-o3', (c > 0 ? '+' : c < 0 ? '−' : '') + '%' + fmt(Math.abs(c), 2), [['Fark', fmt(b - a, 4)]], c > 0 ? 'artış' : c < 0 ? 'azalış' : 'değişim yok'); } else show('p-o3');
    a = num('p-a4'); b = num('p-b4');
    if (isFinite(a) && isFinite(b)) show('p-o4', fmt(a * (1 - b / 100), 2), [['İndirim tutarı', fmt(a * b / 100, 2)], ['Zamlı hali (+%' + fmt(b, 2) + ')', fmt(a * (1 + b / 100), 2)]], 'indirimli fiyat'); else show('p-o4');
  },
  kredi() {
    const P = num('c-tut'), rb = num('c-faiz') / 100, n = Math.round(num('c-vade')), vg = byId('c-vg').checked ? (num('c-vgo') || 0) / 100 : 0;
    byId('c-vgo').disabled = !byId('c-vg').checked;
    if (!(P > 0 && n > 0 && n <= 600 && rb >= 0)) { show('c-out'); byId('c-tab').innerHTML = ''; return; }
    const r = rb * (1 + vg), A = r > 0 ? P * r / (1 - Math.pow(1 + r, -n)) : P / n;
    let bal = P, rows = ''; for (let i = 1; i <= n; i++) { const fz = bal * r, ana = A - fz; bal = Math.max(0, bal - ana); rows += `<tr><td>${i}</td><td>${tl(ana)}</td><td>${tl(fz)}</td><td>${tl(bal)}</td></tr>`; }
    show('c-out', tl(A), [['Toplam geri ödeme', tl(A * n)], ['Toplam faiz' + (vg ? ' + vergi' : ''), tl(A * n - P)], ['Vergili aylık oran', '%' + fmt(r * 100, 3)]], 'aylık taksit');
    byId('c-tab').innerHTML = `<table><thead><tr><th>Ay</th><th>Anapara</th><th>Faiz${vg ? '+vergi' : ''}</th><th>Kalan</th></tr></thead><tbody>${rows}</tbody></table>`;
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

/* ====== ek araçlar (Araç Kutusu ile aynı formüller) ====== */
const U = {
  'Uzunluk': { 'm': 1, 'cm': .01, 'mm': .001, 'km': 1000, 'inç': .0254, 'ayak (ft)': .3048, 'yarda': .9144, 'mil': 1609.344, 'deniz mili': 1852 },
  'Alan': { 'm²': 1, 'cm²': 1e-4, 'mm²': 1e-6, 'dönüm': 1000, 'hektar': 1e4, 'km²': 1e6, 'in²': .00064516, 'ft²': .09290304, 'akre': 4046.8564224 },
  'Hacim': { 'litre': 1e-3, 'ml': 1e-6, 'm³': 1, 'cm³': 1e-6, 'galon (ABD)': .003785411784, 'galon (İng.)': .00454609, 'fl oz (ABD)': 2.95735295625e-5, 'ft³': .028316846592 },
  'Ağırlık': { 'kg': 1, 'g': 1e-3, 'mg': 1e-6, 'ton': 1000, 'ons (oz)': .028349523125, 'libre (lb)': .45359237 },
  'Sıcaklık': null,
  'Hız': { 'km/sa': 1 / 3.6, 'm/s': 1, 'mil/sa': .44704, 'knot': 1852 / 3600 },
  'Basınç': { 'bar': 1e5, 'Pa': 1, 'kPa': 1000, 'MPa': 1e6, 'atm': 101325, 'psi': 6894.757293168, 'mmHg': 133.322387415 },
  'Enerji': { 'kWh': 3.6e6, 'Wh': 3600, 'J': 1, 'kJ': 1000, 'cal': 4.184, 'kcal': 4184 },
  'Güç': { 'kW': 1000, 'W': 1, 'BG (metrik)': 735.49875, 'hp (mekanik)': 745.69987158 },
  'Veri': { 'MB': 1024 ** 2, 'KB': 1024, 'bayt': 1, 'GB': 1024 ** 3, 'TB': 1024 ** 4 },
  'Açı': { 'derece': Math.PI / 180, 'radyan': 1, 'grad': Math.PI / 200 }
};
const units = c => c === 'Sıcaklık' ? ['°C', '°F', 'K'] : Object.keys(U[c]);
const toK = (v, u) => u === '°C' ? v + 273.15 : u === '°F' ? (v - 32) * 5 / 9 + 273.15 : v;
const fromK = (k, u) => u === '°C' ? k - 273.15 : u === '°F' ? (k - 273.15) * 9 / 5 + 32 : k;
function fmtU(n) { if (!isFinite(n)) return '—'; if (n === 0) return '0'; const a = Math.abs(n);
  if (a >= 1e-4 && a < 1e13) return n.toLocaleString('tr-TR', { maximumSignificantDigits: 9 }); return n.toExponential(5).replace('.', ','); }
function fillUnits() { const c = byId('b-cat').value, us = units(c); ['b-from', 'b-to'].forEach((id, i) => { const s = byId(id), keep = s.value; s.innerHTML = us.map(u => `<option>${esc(u)}</option>`).join(''); s.value = us.includes(keep) ? keep : us[Math.min(i, us.length - 1)]; }); }

const YB = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'], YO = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'], YS = ['', 'bin', 'milyon', 'milyar', 'trilyon'];
function y3(n) { const y = Math.floor(n / 100), o = Math.floor(n % 100 / 10), b = n % 10, w = []; if (y) w.push(y > 1 ? YB[y] + ' yüz' : 'yüz'); if (o) w.push(YO[o]); if (b) w.push(YB[b]); return w.join(' '); }
function yaziyla(n) { if (n === 0) return 'sıfır'; const p = []; let i = 0; while (n > 0) { const g = n % 1000; if (g) p.unshift(i === 1 && g === 1 ? 'bin' : y3(g) + (i ? ' ' + YS[i] : '')); n = Math.floor(n / 1000); i++; } return p.join(' '); }

const SHP = {
  dikd: { n: 'Dikdörtgen', f: ['Kenar a', 'Kenar b'], c: ([a, b]) => ({ A: a * b, P: 2 * (a + b), x: [['Köşegen', Math.hypot(a, b)]] }) },
  kare: { n: 'Kare', f: ['Kenar a'], c: ([a]) => ({ A: a * a, P: 4 * a, x: [['Köşegen', a * Math.SQRT2]] }) },
  daire: { n: 'Daire', f: ['Çap D'], c: ([d]) => ({ A: Math.PI * d * d / 4, P: Math.PI * d }) },
  ucgen: { n: 'Üçgen (üç kenar)', f: ['Kenar a', 'Kenar b', 'Kenar c'], c: ([a, b, c]) => { const s = (a + b + c) / 2, q = s * (s - a) * (s - b) * (s - c); return q > 0 ? { A: Math.sqrt(q), P: a + b + c } : null; } },
  dik: { n: 'Dik üçgen', f: ['Dik kenar a', 'Dik kenar b'], c: ([a, b]) => ({ A: a * b / 2, P: a + b + Math.hypot(a, b), x: [['Hipotenüs', Math.hypot(a, b)]] }) },
  yamuk: { n: 'Yamuk', f: ['Alt taban a', 'Üst taban c', 'Yükseklik h'], c: ([a, c, h]) => ({ A: (a + c) / 2 * h }) },
  elips: { n: 'Elips', f: ['Genişlik', 'Yükseklik'], c: ([w, h]) => { const a = w / 2, b = h / 2; return { A: Math.PI * a * b, P: Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))) }; } },
  dilim: { n: 'Daire dilimi', f: ['Yarıçap r', 'Açı (°)'], r: [1], c: ([r, t]) => t <= 360 ? { A: Math.PI * r * r * t / 360, P: 2 * r + Math.PI * r * t / 180, x: [['Yay uzunluğu', Math.PI * r * t / 180]] } : null },
  cokgen: { n: 'Düzgün çokgen', f: ['Kenar sayısı n', 'Kenar uzunluğu a'], r: [0], c: ([n, a]) => n >= 3 ? { A: n * a * a / (4 * Math.tan(Math.PI / n)), P: n * a } : null },
  prizma: { n: 'Kutu / dikdörtgen prizma', d3: 1, f: ['En a', 'Boy b', 'Yükseklik h'], c: ([a, b, h]) => ({ V: a * b * h, S: 2 * (a * b + b * h + a * h) }) },
  silindir: { n: 'Silindir', d3: 1, f: ['Çap D', 'Yükseklik h'], c: ([d, h]) => ({ V: Math.PI * d * d / 4 * h, S: Math.PI * d * h + Math.PI * d * d / 2 }) },
  kure: { n: 'Küre', d3: 1, f: ['Çap D'], c: ([d]) => ({ V: Math.PI * d ** 3 / 6, S: Math.PI * d * d }) },
  koni: { n: 'Koni', d3: 1, f: ['Taban çapı D', 'Yükseklik h'], c: ([d, h]) => { const r = d / 2; return { V: Math.PI * r * r * h / 3, S: Math.PI * r * (r + Math.hypot(r, h)) }; } },
  piramit: { n: 'Piramit (dikdörtgen taban)', d3: 1, f: ['Taban a', 'Taban b', 'Yükseklik h'], c: ([a, b, h]) => ({ V: a * b * h / 3, S: a * b + a * Math.hypot(b / 2, h) + b * Math.hypot(a / 2, h) }) }
};
const UF = { m: 1, cm: .01, mm: .001 };
function alShape() { const S = SHP[byId('al-sek').value] || SHP.dikd, u = byId('al-u').value; for (let i = 1; i <= 3; i++) { const l = S.f[i - 1]; byId('al-w' + i).hidden = !l; if (l) byId('al-l' + i).textContent = (S.r || []).includes(i - 1) ? l : l + ' (' + u + ')'; } }

function rint(a, b) { const r = new Uint32Array(1); crypto.getRandomValues(r); return a + Math.floor(r[0] / 4294967296 * (b - a + 1)); }

Object.assign(H, {
  vki() {
    const h = num('v-boy') / 100, k = num('v-kg'); if (!(h > 0.5 && h < 2.6 && k > 0)) { show('v-out'); return; }
    const b = k / (h * h), c = b < 18.5 ? 'Zayıf' : b < 25 ? 'Normal' : b < 30 ? 'Fazla kilolu' : 'Obez';
    show('v-out', fmt(b, 1), [['Kategori (DSÖ)', c], ['Boyuna göre sağlıklı aralık', fmt(18.5 * h * h, 1) + ' – ' + fmt(24.9 * h * h, 1) + ' kg']], 'VKİ');
  },
  birim() {
    const c = byId('b-cat').value; if (!byId('b-from').options.length || byId('b-from').dataset.cat !== c) { fillUnits(); byId('b-from').dataset.cat = c; }
    const v = num('b-val'), f = byId('b-from').value, t = byId('b-to').value;
    if (!isFinite(v)) { show('b-out'); byId('b-all').innerHTML = ''; return; }
    const cv = (x, a, b) => c === 'Sıcaklık' ? fromK(toK(x, a), b) : x * U[c][a] / U[c][b];
    show('b-out', fmtU(cv(v, f, t)) + ' ' + esc(t), [], `${fmtU(v)} ${esc(f)} =`);
    byId('b-all').innerHTML = units(c).map(u => `<div class="kv"><span>${esc(u)}</span><b>${fmtU(cv(v, f, u))}</b></div>`).join('');
  },
  faiz() {
    const P = num('fz-t'), r = num('fz-r'), g = num('fz-g'), st = num('fz-st') || 0;
    if (P > 0 && r >= 0 && g > 0) { const br = P * r / 100 * g / 365, sv = br * st / 100, net = br - sv; show('fz-o1', tl(P + net), [['Brüt getiri', tl(br)], ['Stopaj (%' + fmt(st) + ')', tl(sv)], ['Net getiri', tl(net)], ['Net yıllık oran', '%' + fmt(net / P * 365 / g * 100, 2)]], 'vade sonu (net)'); } else show('fz-o1');
    const b0 = num('fz-b') || 0, c = num('fz-c') || 0, rr = num('fz-y'), y = num('fz-n');
    if ((b0 > 0 || c > 0) && isFinite(rr) && y > 0 && y <= 100) { const n = Math.round(y * 12), i = rr / 100 / 12, f = Math.pow(1 + i, n), fv = b0 * f + (i ? c * (f - 1) / i : c * n), inv = b0 + c * n; show('fz-o2', tl(fv), [['Toplam yatırılan', tl(inv)], ['Kazanç', tl(fv - inv)]], fmt(y, 1) + ' yıl sonunda (aylık bileşik)'); } else show('fz-o2');
    const nn = num('fz-nom'), e = num('fz-enf'); if (isFinite(nn) && isFinite(e) && e > -100) { const re = ((1 + nn / 100) / (1 + e / 100) - 1) * 100; show('fz-o3', '%' + fmt(re, 2), [], re >= 0 ? 'reel getiri (enflasyonun üstünde)' : 'reel kayıp (enflasyonun altında)'); } else show('fz-o3');
  },
  yazi() {
    const v = num('yz-n'), st = byId('yz-st').value, asTL = byId('yz-tl').checked;
    if (!isFinite(v) || Math.abs(v) >= 1e15) { show('yz-out'); return; } const neg = v < 0, av = Math.abs(v); let s;
    if (asTL) { const c = Math.round(av * 100), li = Math.floor(c / 100), kr = c % 100; s = (li || !kr ? yaziyla(li) + ' Türk lirası' : '') + (kr ? (li ? ' ' : '') + yaziyla(kr) + ' kuruş' : ''); }
    else { const [ip, fp] = String(av).split('.'); s = yaziyla(+ip); if (fp) { const z = fp.match(/^0*/)[0].length, rest = fp.slice(z); s += ' virgül ' + (z ? Array(z).fill('sıfır').join(' ') + (rest ? ' ' : '') : '') + (rest ? yaziyla(+rest) : ''); } }
    if (neg) s = 'eksi ' + s; const tc = x => x.split(' ').map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1)).join(' ');
    if (st === 'title') s = tc(s); else if (st === 'join') s = tc(s).replace(/ /g, ''); else if (st === 'upper') s = s.toLocaleUpperCase('tr');
    byId('yz-out').innerHTML = `<div class="nt">${esc(asTL ? tl(v) : fmt(v, 6))}</div><div class="big" style="font-size:1.25rem">${esc(s)}</div><div class="btns"><button class="btn sm ghost" type="button" id="yz-cp">Kopyala</button></div>`;
    byId('yz-cp').onclick = async e => { try { await navigator.clipboard.writeText(s); e.target.textContent = 'Kopyalandı ✓'; } catch (x) { } };
  },
  rastgele() { },
  ortalama() {
    const toks = []; byId('a-txt').value.split(/[\s;]+/).forEach(t => { if (!t) return; if ((t.match(/,/g) || []).length > 1 && t.indexOf('.') < 0) t.split(',').forEach(x => toks.push(x)); else toks.push(t); });
    const xs = toks.map(pnum).filter(isFinite);
    if (!xs.length) show('a-out'); else {
      const n = xs.length, sum = xs.reduce((a, b) => a + b, 0), m = sum / n, s = [...xs].sort((a, b) => a - b), med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
      const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) : NaN;
      show('a-out', fmt(m, 4), [['Adet', n], ['Toplam', fmt(sum, 4)], ['Medyan', fmt(med, 4)], ['En küçük', fmt(s[0], 4)], ['En büyük', fmt(s[n - 1], 4)], ['Standart sapma', fmt(sd, 4)]], 'ortalama'); }
    /* ağırlıklı ortalama: her satır "değer ağırlık" (ör. not ve kredi) */
    const rows = byId('a-w').value.split('\n').map(l => l.trim().split(/[\s;\t]+/).map(pnum)).filter(r => r.length >= 2 && isFinite(r[0]) && isFinite(r[1]) && r[1] > 0);
    if (rows.length) { const W = rows.reduce((t, r) => t + r[1], 0), A = rows.reduce((t, r) => t + r[0] * r[1], 0) / W; show('a-o2', fmt(A, 4), [['Satır', rows.length], ['Toplam ağırlık', fmt(W, 4)]], 'ağırlıklı ortalama'); } else show('a-o2');
  },
  oran() {
    const a = num('o-a'), b = num('o-b'), c = num('o-c'), ters = byId('o-mod').value === 'ters';
    if (!(isFinite(a) && isFinite(b) && isFinite(c)) || (ters ? c === 0 : a === 0)) { show('o-out'); return; }
    const x = ters ? a * b / c : b * c / a;
    show('o-out', 'X = ' + fmt(x, 6), [], ters ? `${fmt(a, 6)} × ${fmt(b, 6)} ÷ ${fmt(c, 6)}` : `${fmt(b, 6)} × ${fmt(c, 6)} ÷ ${fmt(a, 6)}`);
  },
  yakit() {
    let km = num('y-km'); const tk = num('y-tk'), fy = num('y-fy'), ks = Math.max(1, Math.round(num('y-ks') || 1));
    if (byId('y-gd').checked) km *= 2;
    if (km > 0 && tk > 0) { const L = km * tk / 100;
      if (fy > 0) { const T = L * fy; show('y-out', tl(T), [['Yakıt', fmt(L) + ' L'], ['Toplam mesafe', fmt(km, 1) + ' km'], ['Kişi başı', tl(T / ks)], ['Km başı', tl(T / km)]], 'toplam yakıt masrafı'); }
      else show('y-out', fmt(L) + ' L', [], 'Tutarı görmek için yakıt fiyatını gir.'); } else show('y-out');
    const l = num('y-l'), k = num('y-k2'), t = num('y-tt');
    if (l > 0 && k > 0) { const r = [['Km / litre', fmt(k / l)]]; if (t > 0) r.push(['Km başı maliyet', tl(t / k)], ['Litre fiyatı', tl(t / l)]); show('y-out2', fmt(l / k * 100) + ' L/100 km', r); } else show('y-out2');
  },
  kar() {
    const m = num('kr-mal'), o = num('kr-or'), mod = byId('kr-mod').value, kd = num('kr-kdv') || 0;
    if (m > 0 && isFinite(o) && (mod !== 'marj' || o < 100)) { const s = mod === 'marj' ? m / (1 - o / 100) : m * (1 + o / 100), k = s - m; show('kr-o1', tl(s), [['Birim kâr', tl(k)], ['Satıştan marj', '%' + fmt(k / s * 100, 2)], ['Maliyet üstü (markup)', '%' + fmt(k / m * 100, 2)], ['KDV dahil satış (%' + fmt(kd) + ')', tl(s * (1 + kd / 100))]], 'KDV hariç satış fiyatı'); } else show('kr-o1');
    const a = num('kr-a'), b = num('kr-b'); if (a > 0 && b > 0) { const k = b - a; show('kr-o2', tl(k), [['Satıştan marj', '%' + fmt(k / b * 100, 2)], ['Maliyet üstü (markup)', '%' + fmt(k / a * 100, 2)]], k >= 0 ? 'birim kâr' : 'birim zarar'); } else show('kr-o2');
    const sg = num('kr-sg'), bm = num('kr-bm'), bf = num('kr-bf'); if (sg > 0 && bf > 0 && bm >= 0 && bf > bm) { const n = Math.ceil(sg / (bf - bm)); show('kr-o3', fmt(n, 0) + ' adet', [['Gereken ciro', tl(n * bf)], ['Birim katkı payı', tl(bf - bm)]], 'başabaş için satılması gereken'); } else show('kr-o3');
  },
  alan() {
    alShape(); const S = SHP[byId('al-sek').value] || SHP.dikd, un = byId('al-u').value, u = UF[un] || 1, v = S.f.map((_, i) => { const x = num('al-' + (i + 1)); return (S.r || []).includes(i) ? x : x * u; });
    if (!v.every(x => x > 0)) { show('al-out'); return; } const R = S.c(v); if (!R) { show('al-out', '', [], 'Bu ölçülerle şekil oluşmuyor.'); return; } const rows = [];
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
