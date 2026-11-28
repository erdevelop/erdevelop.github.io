/* Seri oyunlarının ortak mevsim saati: oyunda bir yıl 60 dakika, her mevsim 15 dakika.
   Saat herkes için aynıdır (UTC'ye bağlı): her saatin :00'ında ilkbahar, :15'inde yaz, :30'unda sonbahar, :45'inde kış başlar.
   Organizma, Yaratık ve Yuva kullanır. erMevsim(t) → { i, ad, ik, tr, en, faz, ic, gn, kalanDk, bol } */
(function () {
  'use strict';
  var DONEM = 3600e3;
  var AD = [['ilkbahar', '🌱', 'İlkbahar', 'Spring'], ['yaz', '☀️', 'Yaz', 'Summer'], ['sonbahar', '🍂', 'Sonbahar', 'Autumn'], ['kis', '❄️', 'Kış', 'Winter']];
  var BOL = [1.3, 1.1, 0.95, 0.65];   // besin bolluğu: ilkbaharda patlama, kışın kıtlık
  function erMevsim(t) {
    if (t == null) t = Date.now();
    var faz = (((t % DONEM) + DONEM) % DONEM) / DONEM, q = faz * 4, i = Math.min(3, Math.floor(q)), a = AD[i];
    return {
      i: i, ad: a[0], ik: a[1], tr: a[2], en: a[3], faz: faz, ic: q - i,
      gn: Math.floor((59 + faz * 365) % 365) + 1,   // takvim karşılığı: döngü 1 Mart'ta başlar
      kalanDk: Math.max(1, Math.ceil((1 - (q - i)) * DONEM / 4 / 60000)), bol: BOL[i]
    };
  }
  erMevsim.DONEM = DONEM; erMevsim.AD = AD; erMevsim.BOL = BOL;
  window.erMevsim = erMevsim;
})();
