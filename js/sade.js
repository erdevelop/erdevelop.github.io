/* Sade görünüm (göz dostu mod) — Organizma serisi ve diğer oyunlar için ortak.
   Açıkken: tuvaldeki parlamalar (shadowBlur) kapanır, toplamalı "lighter" ışıltıları yumuşatılır,
   CSS animasyonları tek sefere iner, oyunlar SADE.acik ile ağır efektlerini (sis, sarsıntı, parçacık) azaltır.
   Ayar bütün oyunlarda ortaktır (localStorage 'erdevelop-sade'); hiç seçilmemişse cihazın
   "hareketi azalt" ayarına uyar. Sayfadaki her <input type="checkbox" data-sade> bu ayarı açıp kapatır. */
(function () {
  'use strict';
  var ANAHTAR = 'erdevelop-sade', html = document.documentElement;
  function oku() {
    try { var v = localStorage.getItem(ANAHTAR); if (v === '1') return true; if (v === '0') return false; } catch (e) { }
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  var S = window.SADE = { acik: oku() };
  /* tuval: parlama ve toplamalı ışık */
  try {
    var P = CanvasRenderingContext2D.prototype, db = Object.getOwnPropertyDescriptor(P, 'shadowBlur'), dg = Object.getOwnPropertyDescriptor(P, 'globalCompositeOperation');
    if (db && db.set) Object.defineProperty(P, 'shadowBlur', { configurable: true, get: function () { return db.get.call(this); }, set: function (v) { db.set.call(this, S.acik ? 0 : v); } });
    if (dg && dg.set) Object.defineProperty(P, 'globalCompositeOperation', { configurable: true, get: function () { return dg.get.call(this); }, set: function (v) { dg.set.call(this, S.acik && v === 'lighter' ? 'screen' : v); } });
  } catch (e) { }
  var stil = document.createElement('style');
  stil.textContent = 'html.sade *,html.sade *::before,html.sade *::after{animation-iteration-count:1!important;animation-duration:.01ms!important;scroll-behavior:auto!important}'
    + '.sadeL{display:flex;align-items:center;gap:8px;margin:10px 0 0;padding:9px 12px;border-radius:12px;border:1px solid rgba(150,200,200,.22);background:rgba(0,0,0,.18);font-size:13.5px;font-weight:700;cursor:pointer;text-align:left;line-height:1.35}'
    + '.sadeL input{width:18px;height:18px;flex:none;accent-color:#5FD3B8;margin:0}.sadeL small{display:block;font-weight:600;opacity:.7;font-size:12px}';
  (document.head || html).appendChild(stil);
  function uygula() {
    html.classList.toggle('sade', S.acik);
    var L = document.querySelectorAll('input[data-sade]'); for (var i = 0; i < L.length; i++) L[i].checked = S.acik;
  }
  S.ayarla = function (v) {
    S.acik = !!v; try { localStorage.setItem(ANAHTAR, S.acik ? '1' : '0'); } catch (e) { }
    uygula(); try { window.dispatchEvent(new CustomEvent('sade', { detail: S.acik })); } catch (e) { }
  };
  document.addEventListener('change', function (e) { var t = e.target; if (t && t.matches && t.matches('input[data-sade]')) S.ayarla(t.checked); });
  window.addEventListener('storage', function (e) { if (e.key === ANAHTAR) { S.acik = oku(); uygula(); } });
  uygula(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uygula);
})();
