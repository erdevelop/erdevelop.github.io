/* erdevelop · YIL PARAMETRELERİ — Türkiye'ye özgü yıllık oran ve tutarlar tek dosyada.
   Hesaplar (brüt-net maaş, fazla mesai, kıdem tazminatı, proje/hizmet vergisi, iş günü, enflasyon) değerleri buradan okur.

   OCAK GÜNCELLEMESİ — yeni yıl açıklanınca yapılacaklar:
   1. YIL[<yeni yıl>] kaydını aç; asgariBrut, asgariNet, sgkTavan (= asgariBrut × 9), gvUcret ve gvDiger dilimlerini yaz
      (Gelir Vergisi Kanunu 103. madde tarifesi; ücretlerde 3. dilim farklıdır).
   2. kidemTavan listesine yeni dönemi ekle (Ocak ve Temmuz'da memur katsayısıyla değişir).
   3. TUFE'ye biten yılın yıllık TÜFE değerini (TÜİK, Aralık) ekle.
   4. DINI'ye bir sonraki yılın dini bayramlarını ekle (Diyanet takvimi).
   5. Sayfa başlıklarındaki yıl (ör. "Hesaplama 2026") için:  grep -rn "2026" hesapla/*.html
   Yeni yıl girilmeden önce sayfalar en son yılın değerleriyle çalışır ve bunu sayfada uyarı olarak gösterir. */
(function () {
  'use strict';
  const YIL = {
    2026: {
      asgariBrut: 33030, asgariNet: 28075.50, sgkTavan: 297270,
      sgk: { isci: .14, issizlik: .01, isveren: .2175, isverenIssizlik: .02 }, damga: .00759,
      /* ücret gelirleri (GVK 103; 3. dilim ücretlerde 1.500.000) */
      gvUcret: [[190000, .15], [400000, .20], [1500000, .27], [5300000, .35], [Infinity, .40]],
      /* ücret dışı gelirler (serbest meslek, ticari kazanç) */
      gvDiger: [[190000, .15], [400000, .20], [1000000, .27], [5300000, .35], [Infinity, .40]],
      asgariKurumlar: .10, kurumlar: .25
    }
  };
  /* kıdem tazminatı tavanı: [başlangıç tarihi, tutar] */
  const KIDEM = [['2026-01-01', 64948.77], ['2026-07-01', 73729.87]];
  /* yıllık TÜFE (%), TÜİK Aralık değerleri */
  const TUFE = {2003:18.36,2004:9.32,2005:7.72,2006:9.65,2007:8.39,2008:10.06,2009:6.53,2010:6.4,2011:10.45,2012:6.16,2013:7.4,2014:8.17,2015:8.81,2016:8.53,2017:11.92,2018:20.3,2019:11.84,2020:14.6,2021:36.08,2022:64.27,2023:64.77,2024:44.38,2025:30.89};
  /* dini bayramlar (Diyanet); [tarih, ad, arife ise 1] */
  const DINI = { 2025: [['2025-03-29', 'Ramazan Bayramı arifesi', 1], ['2025-03-30', 'Ramazan Bayramı'], ['2025-03-31', 'Ramazan Bayramı'], ['2025-04-01', 'Ramazan Bayramı'], ['2025-06-05', 'Kurban Bayramı arifesi', 1], ['2025-06-06', 'Kurban Bayramı'], ['2025-06-07', 'Kurban Bayramı'], ['2025-06-08', 'Kurban Bayramı'], ['2025-06-09', 'Kurban Bayramı']],
  2026: [['2026-03-19', 'Ramazan Bayramı arifesi', 1], ['2026-03-20', 'Ramazan Bayramı'], ['2026-03-21', 'Ramazan Bayramı'], ['2026-03-22', 'Ramazan Bayramı'], ['2026-05-26', 'Kurban Bayramı arifesi', 1], ['2026-05-27', 'Kurban Bayramı'], ['2026-05-28', 'Kurban Bayramı'], ['2026-05-29', 'Kurban Bayramı'], ['2026-05-30', 'Kurban Bayramı']],
  2027: [['2027-03-08', 'Ramazan Bayramı arifesi', 1], ['2027-03-09', 'Ramazan Bayramı'], ['2027-03-10', 'Ramazan Bayramı'], ['2027-03-11', 'Ramazan Bayramı'], ['2027-05-15', 'Kurban Bayramı arifesi', 1], ['2027-05-16', 'Kurban Bayramı'], ['2027-05-17', 'Kurban Bayramı'], ['2027-05-18', 'Kurban Bayramı'], ['2027-05-19', 'Kurban Bayramı']]
};

  const yillar = Object.keys(YIL).map(Number).sort((a, b) => a - b);
  function p(y) {
    y = y || new Date().getFullYear();
    const k = yillar.filter(x => x <= y).pop() || yillar[0];
    return Object.assign({ yil: k, istenen: y, eski: k < y }, YIL[k]);
  }
  const kidemTavan = d => { const s = d instanceof Date ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : String(d).slice(0, 10); let v = KIDEM[0]; for (const k of KIDEM) if (k[0] <= s) v = k; return { tutar: v[1], bas: v[0] }; };
  const vergi = (m, dilim) => { if (!(m > 0)) return 0; let v = 0, alt = 0; for (const [ust, o] of dilim) { if (m > alt) v += (Math.min(m, ust) - alt) * o; alt = ust; } return v; };
  const tl = n => n.toLocaleString('tr-TR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  /* metindeki [data-yil] öğelerini doldurur: yil, asgariBrut, asgariNet, sgkTavan, dilimler, kidem */
  function metin(kok) {
    const P = p(), K = KIDEM.filter(k => k[0].startsWith(String(P.yil)));
    (kok || document).querySelectorAll('[data-yil]').forEach(el => {
      const a = el.dataset.yil;
      if (a === 'yil') el.textContent = P.yil;
      else if (a === 'dilimler' || a === 'dilimlerDiger') { const D = a === 'dilimler' ? P.gvUcret : P.gvDiger; el.textContent = D.map(([u, o], i) => isFinite(u) ? tl(u) + ' ₺\'ye kadar %' + Math.round(o * 100) : 'üstü %' + Math.round(o * 100)).join(', '); }
      else if (a === 'kidem') el.innerHTML = K.map((k, i) => { const b = new Date(k[0]), son = K[i + 1] ? new Date(new Date(K[i + 1][0]) - 864e5) : new Date(b.getFullYear(), 11, 31); return '<li>' + b.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ' – ' + son.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) + ': ' + tl(k[1]) + ' ₺</li>'; }).join('');
      else if (P[a] != null) el.textContent = tl(P[a]);
    });
    if (P.eski && !document.getElementById('yil-uyari')) {
      const m = document.querySelector('main'); if (!m) return;
      const d = document.createElement('p'); d.id = 'yil-uyari'; d.className = 'hint';
      d.style.cssText = 'border:1px solid var(--warn,#d98a00);border-radius:10px;padding:8px 12px;margin:0 0 12px';
      d.textContent = P.istenen + ' yılı oranları henüz eklenmedi; hesap ' + P.yil + ' değerleriyle yapılıyor.';
      m.insertBefore(d, m.querySelector('.box') || m.firstChild);
    }
  }
  window.YIL = { p, kidemTavan, vergi, TUFE, DINI, metin, yillar };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => metin()); else metin();
})();
