/* erdevelop · ortak dil (TR/EN) yardımcısı
   Kullanım (sayfanın <head> kısmında, diğer betiklerden önce):
     <script src="/dil.js"></script>
   - Dil sırası: adresteki ?lang=en|tr  >  son seçim (localStorage 'erdevelop-lang')  >  tarayıcı dili.
   - Sabit metin: elemana data-en="English" ekle (Türkçesi elemanın kendi içeriğidir; HTML olabilir).
     Öznitelikler: data-en-ph (placeholder), data-en-aria (aria-label), data-en-title (title).
   - Uzun bloklar: iki kopya yaz, data-l="tr" ve data-l="en" ver (İngilizcesine hidden ekle).
   - Dil düğmesi: herhangi bir elemana data-dil-btn ver; yoksa <script ... data-btn="sabit"> köşeye küçük bir düğme ekler.
   - Betik içinde: erDil.t('Türkçe', 'English'), erDil.lang, erDil.on(fn)  (dil değişince fn(lang) çağrılır).
   - Sözlük: erDil.dict({ 'Türkçe metin': 'English text' }) — sayfadaki (sonradan eklenenler dahil) tam eşleşen
     metin düğümleri ile placeholder / title / aria-label / alt değerleri İngilizcede otomatik çevrilir.
     Çevrilmemesi gereken bir bölüme data-no-tr ver. */
(function () {
  'use strict';
  var KEY = 'erdevelop-lang', me = document.currentScript, subs = [], DICT = {}, KAL = {}, KALX = [], NUM = /[-+−]?\d+(?:[.,]\d+)*/g, ready = false, trNodes = new Set(), trEls = new Set(), ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var norm = function (x) { return String(x).replace(/\s+/g, ' ').trim(); };
  function read() {
    var q = null, s = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { }
    if (q === 'en' || q === 'tr') return q;
    try { s = localStorage.getItem(KEY); } catch (e) { }
    if (s === 'en' || s === 'tr') return s;
    return /^tr/i.test(navigator.language || 'tr') ? 'tr' : 'en';
  }
  var D = window.erDil = {
    lang: read(),
    t: function (tr, en) { return D.lang === 'en' && en != null ? en : tr; },
    on: function (f) { subs.push(f); },
    set: function (l, sakla) {
      if (l !== 'en' && l !== 'tr') return; D.lang = l;
      if (sakla !== false) try { localStorage.setItem(KEY, l); } catch (e) { }
      apply(); subs.forEach(function (f) { try { f(l); } catch (e) { console.error(e); } });
    },
    toggle: function () { D.set(D.lang === 'tr' ? 'en' : 'tr'); },
    apply: function () { apply(); },
    dict: function (o) { for (var k in o) DICT[norm(k)] = o[k]; if (ready) apply(); },
    /* kalıp: sayı içeren metinler. '{n}' herhangi bir sayı, '{x}' herhangi bir metin parçası.
       İngilizcede {n}/{x} sırayla doldurulur; sıra değişecekse {1}, {2} … kullan. Ör: { 'Hepsi · {n}': 'All · {n}' } */
    kalip: function (o) {
      for (var k in o) {
        var kk = norm(k);
        if (kk.indexOf('{x}') < 0) KAL[kk] = o[k];
        else KALX.push([new RegExp('^' + kk.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{n\}/g, '([-+−]?\\d+(?:[.,]\\d+)*)').replace(/\{x\}/g, '(.+?)') + '$'), o[k], kk.replace(/\{[nx]\}/g, '').length]);
      }
      KALX.sort(function (a, b) { return b[2] - a[2]; });
      if (ready) apply();
    },
    /* sözlükteki karşılığı (İngilizcedeyken), yoksa metnin kendisi */
    tr: function (x) { if (D.lang !== 'en' || x == null) return x; var e = bul(norm(x)); return e != null ? e : x; }
  };
  function doldur(en, vals) { var i = 0; return en.replace(/\{(n|x|\d+)\}/g, function (m, g) { var v = /\d/.test(g) ? vals[+g - 1] : vals[i++]; return v == null ? m : v; }); }
  function bul(t) {
    var e = DICT[t]; if (e != null) return e;
    if (/\d/.test(t)) { var k = t.replace(NUM, '{n}'); if (KAL[k] != null) return doldur(KAL[k], t.match(NUM)); }
    for (var i = 0; i < KALX.length; i++) { var m = KALX[i][0].exec(t); if (m) return doldur(KALX[i][1], m.slice(1).map(function (v) { var z = bul(norm(v)); return z != null ? z : v; })); }
    /* baştaki simge/emoji ayrı: '⛽ Yakıt Hesabı' → '⛽ ' + çeviri */
    var on = /^([^A-Za-z0-9ÇĞİÖŞÜçğıöşü"“'(]+)(.+)$/.exec(t);
    if (on) { var e2 = bul(on[2]); if (e2 != null) return on[1] + e2; }
    /* ' · ' ile ayrılmış parçalar tek tek */
    /* ', ' ile ayrılmış liste: hepsi çevrilebiliyorsa ('Mızrakçı, Okçu') */
    if (t.indexOf(', ') > 0) { var ls = t.split(', '), lt = ls.map(function (x) { return bul(x); }); if (lt.every(function (x) { return x != null; })) return lt.join(', '); }
    if (t.indexOf(' · ') > 0) { var ps = t.split(' · '), ok = 0; ps = ps.map(function (x) { var z = bul(x); if (z != null) { ok++; return z; } return x; }); if (ok) return ps.join(' · '); }
    return null;
  }
  /* sözlükle metin düğümü çevirisi */
  function skip(el) { return !el || el.closest('script,style,textarea,[data-no-tr],[data-en]'); }
  function skipA(el) { return !el || el.closest('script,style,[data-no-tr]'); }
  function trText(n) {
    var raw = n.nodeValue; if (raw === n.__en) return;
    var en = bul(norm(raw)); if (en == null) return;
    /* value özniteliği olmayan <option>'ın değeri metnidir; çevirince değer değişmesin */
    var pe = n.parentElement; if (pe && pe.tagName === 'OPTION' && !pe.hasAttribute('value')) pe.setAttribute('value', pe.value);
    n.__tr = raw; n.nodeValue = (raw.match(/^\s*/)[0]) + en + (raw.match(/\s*$/)[0]); n.__en = n.nodeValue; trNodes.add(n);
  }
  function trAttr(el) {
    ATTRS.forEach(function (a) {
      var v = el.getAttribute(a); if (v == null || (el.__ena && el.__ena[a] === v)) return;
      var en = bul(norm(v)); if (en == null) return;
      (el.__tra = el.__tra || {})[a] = v; (el.__ena = el.__ena || {})[a] = en; el.setAttribute(a, en); trEls.add(el);
    });
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!skip(root.parentElement)) trText(root); return; }
    if (root.nodeType !== 1 || skipA(root)) return;
    trAttr(root); root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(function (el) { if (!skipA(el)) trAttr(el); });
    if (skip(root)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (n.nodeValue.trim() && !skip(n.parentElement)) trText(n);
  }
  function unwalk() {
    trNodes.forEach(function (n) { if (n.nodeValue === n.__en) n.nodeValue = n.__tr; n.__en = null; }); trNodes.clear();
    trEls.forEach(function (el) { for (var a in el.__tra) if (el.getAttribute(a) === el.__ena[a]) el.setAttribute(a, el.__tra[a]); el.__tra = el.__ena = null; }); trEls.clear();
  }
  var obs = window.MutationObserver ? new MutationObserver(function (ms) {
    if (D.lang !== 'en') return;
    ms.forEach(function (m) {
      if (m.type === 'characterData') { if (!skip(m.target.parentElement)) trText(m.target); }
      else if (m.type === 'attributes') { if (!skipA(m.target)) trAttr(m.target); }
      else m.addedNodes.forEach(walk);
    });
  }) : null;
  function swap(el, attr, enAttr, trAttr) {
    var en = el.getAttribute(enAttr); if (en == null) return;
    if (!el.hasAttribute(trAttr)) el.setAttribute(trAttr, attr ? (el.getAttribute(attr) || '') : el.innerHTML);
    var v = D.lang === 'en' ? en : el.getAttribute(trAttr);
    if (attr) el.setAttribute(attr, v); else if (el.innerHTML !== v) el.innerHTML = v;
  }
  function apply() {
    var L = D.lang, d = document;
    d.documentElement.lang = L;
    d.querySelectorAll('[data-en]').forEach(function (el) { swap(el, null, 'data-en', 'data-tr'); });
    d.querySelectorAll('[data-en-ph]').forEach(function (el) { swap(el, 'placeholder', 'data-en-ph', 'data-tr-ph'); });
    d.querySelectorAll('[data-en-aria]').forEach(function (el) { swap(el, 'aria-label', 'data-en-aria', 'data-tr-aria'); });
    d.querySelectorAll('[data-en-title]').forEach(function (el) { swap(el, 'title', 'data-en-title', 'data-tr-title'); });
    d.querySelectorAll('[data-l]').forEach(function (el) { el.hidden = el.getAttribute('data-l') !== L; });
    var t = d.querySelector('title[data-en]'); if (t) d.title = t.textContent;
    if (d.body && (Object.keys(DICT).length || KALX.length || Object.keys(KAL).length)) {
      if (L === 'en') walk(d.body); else unwalk();
      var tt = d.querySelector('title:not([data-en])');
      if (tt) { if (tt.__tr == null) tt.__tr = tt.textContent; var te = bul(norm(tt.__tr)); d.title = L === 'en' && te ? te : tt.__tr; }
      if (obs && !obs.__on) { obs.observe(d.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); obs.__on = 1; }
    }
    d.querySelectorAll('[data-dil-btn]').forEach(function (b) { b.textContent = L === 'tr' ? 'EN' : 'TR'; b.setAttribute('aria-label', L === 'tr' ? 'Switch to English' : 'Türkçeye geç'); });
  }
  function init() {
    if (me && me.getAttribute('data-btn') === 'sabit' && !document.querySelector('[data-dil-btn]')) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-dil-btn', '');
      b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9000;font:600 12px/1 system-ui,sans-serif;letter-spacing:.04em;padding:8px 10px;border-radius:8px;border:1px solid rgba(127,127,127,.45);background:rgba(20,24,32,.72);color:#fff;cursor:pointer;backdrop-filter:blur(6px)';
      document.body.appendChild(b);
    }
    document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-dil-btn]'); if (b) { e.preventDefault(); D.toggle(); } });
    ready = true; apply(); subs.forEach(function (f) { try { f(D.lang); } catch (e) { console.error(e); } });
  }
  document.documentElement.lang = D.lang;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
