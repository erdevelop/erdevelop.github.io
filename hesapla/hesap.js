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
