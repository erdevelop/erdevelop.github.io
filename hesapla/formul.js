/* erdevelop · ortak hesap formülleri (tek kaynak)
   Hem Araç Kutusu (arac_kutusu.html) hem de hesapla/ sayfaları bu dosyayı kullanır.
   Burada yalnızca saf hesaplar ve veri tabloları vardır; ekrana yazma işi sayfalardadır.
   Bir formülü düzeltmek için yalnızca bu dosyayı değiştirmek yeter. */
(function (g) {
  'use strict';

  /* sayı okuma: "1.234,56", "1234.56", "%18", "₺ 500" gibi girdileri sayıya çevirir */
  function pnum(s) {
    s = String(s == null ? '' : s).replace(/\s/g, '').replace(/[₺%]/g, ''); if (!s) return NaN;
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(',', '.');
    const v = parseFloat(s); return isFinite(v) ? v : NaN;
  }

  /* ---------- tarih ---------- */
  const dd = (a, b) => Math.round((b - a) / 864e5);
  function ymd(a, b) {
    let y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
    if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); } if (m < 0) { y--; m += 12; } return [y, m, d];
  }
  /* doğum tarihi → yaş bilgileri (b ≤ bugün olmalı) */
  function yas(b, today) {
    if (!b || b > today) return null;
    const [y, m, d] = ymd(b, today); let nb = new Date(today.getFullYear(), b.getMonth(), b.getDate());
    if (nb < today) nb = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
    return { y, m, d, gun: dd(b, today), sonraki: nb, kalan: dd(today, nb) };
  }
  /* iki tarih arası (sıra fark etmez) */
  function gunFark(a, c) {
    let neg = false; if (c < a) { [a, c] = [c, a]; neg = true; }
    const g = dd(a, c), [y, m, d] = ymd(a, c); let is = NaN;
    if (g <= 40000) { is = 0; for (let x = new Date(a); x < c; x.setDate(x.getDate() + 1)) { const w = x.getDay(); if (w && w < 6) is++; } }
    return { gun: g, y, m, d, isGunu: is, ters: neg };
  }
  function tarihEkle(e, n) { const r = new Date(e); r.setDate(r.getDate() + Math.round(n)); return r; }

  /* ---------- para ---------- */
  function kdv(v, o, dahil) {
    if (!(v >= 0) || !(o >= 0)) return null;
    let m, k, t; if (dahil) { t = v; m = v / (1 + o / 100); k = t - m; } else { m = v; k = v * o / 100; t = m + k; }
    return { matrah: m, kdv: k, toplam: t };
  }
  /* eşit taksitli kredi: P anapara, rb aylık faiz (ondalık, 0,0399 gibi), n ay, vg vergi oranı (ondalık, 0,30 = KKDF+BSMV) */
  function kredi(P, rb, n, vg) {
    n = Math.round(n); vg = vg || 0;
    if (!(P > 0 && n > 0 && n <= 600 && rb >= 0)) return null;
    const r = rb * (1 + vg), A = r > 0 ? P * r / (1 - Math.pow(1 + r, -n)) : P / n, plan = [];
    let bal = P; for (let i = 1; i <= n; i++) { const fz = bal * r, ana = A - fz; bal = Math.max(0, bal - ana); plan.push({ ay: i, anapara: ana, faiz: fz, kalan: bal }); }
    return { r, taksit: A, toplam: A * n, faiz: A * n - P, plan };
  }
  /* vadeli mevduat: P tutar, r yıllık brüt %, g gün, st stopaj % */
  function mevduat(P, r, g, st) {
    st = st || 0; if (!(P > 0 && r >= 0 && g > 0)) return null;
    const br = P * r / 100 * g / 365, sv = br * st / 100, net = br - sv;
    return { brut: br, stopaj: sv, net, vadeSonu: P + net, netYillik: net / P * 365 / g * 100 };
  }
  /* bileşik birikim: b0 başlangıç, c aylık ek, rr yıllık %, y yıl (aylık bileşik) */
  function birikim(b0, c, rr, y) {
    b0 = b0 || 0; c = c || 0; if (!((b0 > 0 || c > 0) && isFinite(rr) && y > 0 && y <= 100)) return null;
    const n = Math.round(y * 12), i = rr / 100 / 12, f = Math.pow(1 + i, n), fv = b0 * f + (i ? c * (f - 1) / i : c * n), inv = b0 + c * n;
    return { son: fv, yatirilan: inv, kazanc: fv - inv };
  }
  function reel(nom, enf) { return isFinite(nom) && isFinite(enf) && enf > -100 ? ((1 + nom / 100) / (1 + enf / 100) - 1) * 100 : NaN; }
  /* satış fiyatı: m maliyet, o oran %, mod 'marj' (satıştan) ya da 'markup' (maliyet üstü), kd KDV % */
  function satisFiyati(m, o, mod, kd) {
    kd = kd || 0; if (!(m > 0 && isFinite(o) && (mod !== 'marj' || o < 100))) return null;
    const s = mod === 'marj' ? m / (1 - o / 100) : m * (1 + o / 100), k = s - m;
    return { satis: s, kar: k, marj: k / s * 100, markup: k / m * 100, kdvDahil: s * (1 + kd / 100) };
  }
  function karMarj(a, b) { if (!(a > 0 && b > 0)) return null; const k = b - a; return { kar: k, marj: k / b * 100, markup: k / a * 100 }; }
  function basabas(sg, bm, bf) { if (!(sg > 0 && bf > 0 && bm >= 0 && bf > bm)) return null; const n = Math.ceil(sg / (bf - bm)); return { adet: n, ciro: n * bf, katki: bf - bm }; }

  /* ---------- yüzde & orantı ---------- */
  const yuzdesi = (a, b) => a * b / 100;                 /* a'nın %b'si */
  const yuzdeKac = (a, b) => b !== 0 ? a / b * 100 : NaN; /* a, b'nin yüzde kaçı */
  const degisim = (a, b) => a !== 0 ? (b - a) / Math.abs(a) * 100 : NaN;
  const indirim = (a, b) => ({ indirimli: a * (1 - b / 100), tutar: a * b / 100, zamli: a * (1 + b / 100) });
  function oranti(a, b, c, ters) { if (!(isFinite(a) && isFinite(b) && isFinite(c)) || (ters ? c === 0 : a === 0)) return NaN; return ters ? a * b / c : b * c / a; }

  /* ---------- günlük ---------- */
  function yakit(km, tk, fy, ks, gidisDonus) {
    ks = Math.max(1, Math.round(ks || 1)); if (gidisDonus) km *= 2;
    if (!(km > 0 && tk > 0)) return null; const L = km * tk / 100, T = fy > 0 ? L * fy : NaN;
    return { km, litre: L, tutar: T, kisiBasi: T / ks, kmBasi: T / km };
  }
  function tuketim(l, k, t) { if (!(l > 0 && k > 0)) return null; return { l100: l / k * 100, kmL: k / l, kmBasi: t > 0 ? t / k : NaN, litreFiyat: t > 0 ? t / l : NaN }; }
  function vki(boyCm, kg) {
    const h = boyCm / 100; if (!(h > 0.5 && h < 2.6 && kg > 0)) return null;
    const b = kg / (h * h); return { vki: b, kategori: b < 18.5 ? 'Zayıf' : b < 25 ? 'Normal' : b < 30 ? 'Fazla kilolu' : 'Obez', min: 18.5 * h * h, max: 24.9 * h * h };
  }
  /* metindeki sayıları ayıklar: boşluk, satır, ";" ile ayrılmış; "1,2,3" gibi virgüllü listeler de olur */
  function sayilar(txt) {
    const toks = []; String(txt || '').split(/[\s;]+/).forEach(t => { if (!t) return; if ((t.match(/,/g) || []).length > 1 && t.indexOf('.') < 0) t.split(',').forEach(x => toks.push(x)); else toks.push(t); });
    return toks.map(pnum).filter(isFinite);
  }
  function istatistik(xs) {
    if (!xs.length) return null; const n = xs.length, sum = xs.reduce((a, b) => a + b, 0), m = sum / n, s = [...xs].sort((a, b) => a - b);
    return { n, toplam: sum, ort: m, medyan: n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, min: s[0], max: s[n - 1], ss: n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) : NaN };
  }
  /* her satır "değer ağırlık" */
  function agirlikli(txt) {
    const rows = String(txt || '').split('\n').map(l => l.trim().split(/[\s;\t]+/).map(pnum)).filter(r => r.length >= 2 && isFinite(r[0]) && isFinite(r[1]) && r[1] > 0);
    if (!rows.length) return null; const W = rows.reduce((t, r) => t + r[1], 0); return { ort: rows.reduce((t, r) => t + r[0] * r[1], 0) / W, satir: rows.length, agirlik: W };
  }

  /* ---------- birim çevirme ---------- */
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
  const cevir = (c, x, a, b) => c === 'Sıcaklık' ? fromK(toK(x, a), b) : x * U[c][a] / U[c][b];

  /* ---------- alan & hacim (ölçüler metre cinsinden) ---------- */
  const UF = { mm: .001, cm: .01, m: 1 };
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
  /* şekil + girilen ölçüler (birim un: mm/cm/m) → {S, R, u} ; R null ise şekil oluşmuyor */
  function alan(key, vals, un) {
    const S = SHP[key] || SHP.dikd, u = UF[un] || 1, v = S.f.map((_, i) => (S.r || []).includes(i) ? vals[i] : vals[i] * u);
    if (!v.every(x => x > 0)) return null; return { S, R: S.c(v), u };
  }
  const sekilSecenek = () => '<optgroup label="Alan (2B)">' + Object.keys(SHP).filter(k => !SHP[k].d3).map(k => `<option value="${k}">${SHP[k].n}</option>`).join('') + '</optgroup><optgroup label="Hacim (3B)">' + Object.keys(SHP).filter(k => SHP[k].d3).map(k => `<option value="${k}">${SHP[k].n}</option>`).join('') + '</optgroup>';

  /* ---------- sayıyı yazıya ---------- */
  const YB = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'], YO = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'], YS = ['', 'bin', 'milyon', 'milyar', 'trilyon'];
  function y3(n) { const y = Math.floor(n / 100), o = Math.floor(n % 100 / 10), b = n % 10, w = []; if (y) w.push(y > 1 ? YB[y] + ' yüz' : 'yüz'); if (o) w.push(YO[o]); if (b) w.push(YB[b]); return w.join(' '); }
  function yaziyla(n) { if (n === 0) return 'sıfır'; const p = []; let i = 0; while (n > 0) { const g = n % 1000; if (g) p.unshift(i === 1 && g === 1 ? 'bin' : y3(g) + (i ? ' ' + YS[i] : '')); n = Math.floor(n / 1000); i++; } return p.join(' '); }
  /* v sayı, asTL: lira/kuruş, st: 'lower' | 'title' | 'join' | 'upper' */
  function yazi(v, asTL, st) {
    if (!isFinite(v) || Math.abs(v) >= 1e15) return null; const neg = v < 0, av = Math.abs(v); let s;
    if (asTL) { const c = Math.round(av * 100), li = Math.floor(c / 100), kr = c % 100; s = (li || !kr ? yaziyla(li) + ' Türk lirası' : '') + (kr ? (li ? ' ' : '') + yaziyla(kr) + ' kuruş' : ''); }
    else { const [ip, fp] = String(av).split('.'); s = yaziyla(+ip); if (fp) { const z = fp.match(/^0*/)[0].length, rest = fp.slice(z); s += ' virgül ' + (z ? Array(z).fill('sıfır').join(' ') + (rest ? ' ' : '') : '') + (rest ? yaziyla(+rest) : ''); } }
    if (neg) s = 'eksi ' + s; const tc = x => x.split(' ').map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1)).join(' ');
    if (st === 'title') s = tc(s); else if (st === 'join') s = tc(s).replace(/ /g, ''); else if (st === 'upper') s = s.toLocaleUpperCase('tr');
    return s;
  }

  /* ---------- rastgele ---------- */
  function rint(a, b) { const r = new Uint32Array(1); crypto.getRandomValues(r); return a + Math.floor(r[0] / 4294967296 * (b - a + 1)); }
  function karistir(l) { l = [...l]; for (let i = l.length - 1; i > 0; i--) { const j = rint(0, i); [l[i], l[j]] = [l[j], l[i]]; } return l; }

  g.HF = { pnum, dd, ymd, yas, gunFark, tarihEkle, kdv, kredi, mevduat, birikim, reel, satisFiyati, karMarj, basabas, yuzdesi, yuzdeKac, degisim, indirim, oranti, yakit, tuketim, vki, sayilar, istatistik, agirlikli, U, units, toK, fromK, cevir, UF, SHP, alan, sekilSecenek, yaziyla, yazi, rint, karistir };
})(typeof window !== 'undefined' ? window : globalThis);
