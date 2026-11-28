/* Küçük Krallık · Krallık Kartları bağlantısı.
   Krallık Kartları'nın seferini (15 durak) bitiren oyuncuya bir kez hazine hediyesi verir.
   Ana oyun betiğinden SONRA yüklenir (S, save, render, toast hazır olmalı). Ters yön: Krallık Kartları,
   buradaki ana bina seviyesine bakıp Kraliçe kahramanını açar. */
(function () {
  try {
    if (typeof S === 'undefined' || !S || S.kkMiras) return;
    const k = JSON.parse(localStorage.getItem('krallik-kartlari') || '{}') || {};
    if ((k.sefer | 0) < 15) return;
    const ALTIN = 500;
    S.kkMiras = 1; S.g = (S.g || 0) + ALTIN;
    save(); try { render(); } catch (e) { }
    const en = window.erDil && erDil.lang === 'en';
    setTimeout(() => toast(en ? '🃏 Kingdom Cards campaign complete: +' + ALTIN + ' gold in your treasury!' : '🃏 Krallık Kartları seferini bitirdin: hazineye ' + ALTIN + ' altın eklendi!'), 1500);
  } catch (e) { }
})();
