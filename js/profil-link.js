/* Paylaşılabilir oyuncu profili bağlantısı: Organizma rekorları + bütün serinin (Organizma → Küçük Krallık) ilerlemesi.
   Bütün veriler bağlantının içinde (#p1.<base64url JSON>); sunucuda bir şey tutulmaz. organizma.html ve seri.html kullanır. */
(function () {
  'use strict';
  var ls = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  /* aşama durumu: 2 tamamlandı, 1 başlandı, 0 başlanmadı */
  function seriDurum() {
    var og = ls('organizma-kayit') || {}, ya = ls('yaratik-kayit') || {}, yu = ls('yuva-kayit') || {}, ka = ls('kabile-kayit') || {}, se = ls('sehir-kayit') || {}, kr = ls('kucuk-krallik-v1');
    var kaO = ka.oyun || {}, kaR = ka.rekor || {}, seO = se.oyun || {}, seR = se.rekor || {};
    var L = [
      [!!og.gecis, (og.oyun | 0) > 0],
      [!!(ya.gecis || ((ya.rekor || {}).kazan > 0)), !!(ya.oyun || (ya.rekor || {}).nesil)],
      [yu.kazandi >= 1, !!yu.pop],
      [(kaR.koy >= 1) || kaO.asama >= 2, !!ka.oyun || !!kaR.enKalabalik],
      [(seR.devlet >= 1) || !!seO.kazandi, !!se.oyun],
      [!!(kr && kr.lv && kr.lv.main >= 10), !!(kr && kr.lv)]
    ];
    return L.map(function (q) { return q[0] ? 2 : q[1] ? 1 : 0; }).join('');
  }
  function gun() { var d = new Date(Date.now() + 3 * 3600e3); return +(d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0')); }
  window.erSeriDurum = seriDurum;
  window.erProfilLink = function (dil, ek) {
    var K = ls('organizma-kayit') || {}, ag = K.agac || {};
    var v = { n: String(K.nick || 'Oyuncu').slice(0, 16), t: K.tur | 0, h: Math.round(+K.renk || 172), u: Math.round(K.uzun || 0), b: Math.round(K.buyuk || 0), k: K.enKusak || 1, y: K.topYe | 0, o: K.oyun | 0, dr: Math.round(K.enDerin || 0), z: ag.p | 0,
      bs: Object.keys(K.bas || {}).filter(function (k) { return K.bas[k]; }).join(','),
      sz: (K.sezonRz || []).filter(function (r) { return r.t || r.s; }).map(function (r) { return [r.no - 741, r.t || '', r.s ? 1 : 0]; }),
      a: K.aile ? String(K.aile.ad || '').slice(0, 16) : '', d: gun(), sr: seriDurum() };
    if (ek) for (var q in ek) if (ek[q] !== undefined) v[q] = ek[q];
    var b = new TextEncoder().encode(JSON.stringify(v)), s = ''; b.forEach(function (c) { s += String.fromCharCode(c); });
    return location.origin + '/organizma/profil/?lang=' + (dil === 'en' ? 'en' : 'tr') + '#p1.' + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
})();
