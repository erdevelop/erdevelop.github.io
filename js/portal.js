/* erdevelop · portal üst menüsü ve alt bilgisi (tek kaynak).
   Sayfada <header id="p-ust"></header> ve <footer id="p-alt"></footer> yer tutucuları olmalı; bu dosya </body> öncesinde yüklenir.
   Etkin bölüm <body data-bolum="araclar|muhendislik|oyunlar|ogren"> ile seçilir. Menü değişecekse yalnızca buradaki MENU'yü düzenle. */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  var MENU = [
    { id: 'araclar', tr: 'Araçlar', en: 'Tools', u: '/araclar/', alt: [
      ['Hesaplama araçları', 'Calculators', '/hesaplama-araclari/'], ['Belge ve PDF', 'Files & PDF', '/belge-araclari/'], ['Geliştirici araçları', 'Developer tools', '/gelistirici-araclari/'],
      ['Telefon araçları', 'Phone tools', '/telefon-araclari/'], ['Günlük araçlar', 'Everyday tools', '/gunluk-araclar/'], ['Tüm araçlar listesi', 'Full list of tools', '/Tools.html', 1]] },
    { id: 'muhendislik', tr: 'Mühendislik', en: 'Engineering', u: '/muhendislik/', alt: [
      ['Cephe hesapları', 'Facade calculations', '/cephe-hesaplari/'], ['Tasarım araçları', 'Design tools', '/tasarim-araclari/'], ['CAD komutları', 'CAD commands', '/cad-komutlari/'],
      ['Mühendislik ana sayfası', 'Engineering home', '/muhendislik/', 1]] },
    { id: 'oyunlar', tr: 'Oyunlar', en: 'Games', u: '/tarayici-oyunlari/' },
    { id: 'ogren', tr: 'Öğren', en: 'Learn', u: '/ogren/', alt: [
      ['Eğitimler', 'Courses', '/egitimler/'], ['Yapay zekâ', 'AI', '/yapay-zeka/'], ['Dil kulüpleri', 'Language clubs', '/rehber/dil-kulupleri/'], ['Rehberler', 'Guides', '/rehber/'], ['Meraklılar Köşesi', 'Curious Corner', '/meraklilar-kosesi/'], ['Mikro Dünya', 'Micro World', '/mikro-dunya/'],
      ['Öğren ana sayfası', 'Learn home', '/ogren/', 1]] },
    { id: 'hakkinda', tr: 'Hakkında', en: 'About', u: '/hakkinda.html' }
  ];
  var e = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
  var ok = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>';
  var bolum = (D.body && D.body.getAttribute('data-bolum')) || '';

  var ust = D.getElementById('p-ust');
  if (ust) {
    ust.innerHTML = '<div class="wrap p-top">'
      + '<a class="p-logo" href="/" aria-label="erdevelop"><i>e</i><b><span>er</span>develop</b></a>'
      + '<nav class="p-nav" aria-label="Ana menü" data-en-aria="Main menu">' + MENU.map(function (m) {
        var on = m.id === bolum ? ' on' : '';
        if (!m.alt) return '<div><a class="ana' + on + '" href="' + m.u + '" data-en="' + e(m.en) + '">' + e(m.tr) + '</a></div>';
        return '<div><a class="ana' + on + '" href="' + m.u + '"><span data-en="' + e(m.en) + '">' + e(m.tr) + '</span>' + ok + '</a><div class="p-alt">'
          + m.alt.map(function (a) { return '<a' + (a[3] ? ' class="tum"' : '') + ' href="' + a[2] + '" data-en="' + e(a[1]) + '">' + e(a[0]) + '</a>'; }).join('') + '</div></div>';
      }).join('') + '</nav>'
      + '<button class="p-btn p-arabtn" type="button" id="p-ara-ac" aria-label="Sitede ara" data-en-aria="Search the site"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span data-en="Search…">Ara…</span><kbd>/</kbd></button>'
      + '<button class="p-btn" type="button" data-dil-btn aria-label="Switch to English">EN</button>'
      + '<button class="p-btn" type="button" id="p-tema" aria-label="Tema" data-en-aria="Theme"></button>'
      + '<button class="p-btn" type="button" id="p-menu" aria-label="Menü" data-en-aria="Menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>'
      + '</div>';
    var temaBtn = D.getElementById('p-tema');
    var gunes = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    var ay = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
    var temaYaz = function () {
      var k = H.getAttribute('data-mode') === 'dark'; temaBtn.innerHTML = k ? gunes : ay;
      var tc = D.querySelector('meta[name=theme-color]'); if (tc) tc.content = k ? '#0a1022' : '#f5f7fd';
    };
    temaYaz();
    temaBtn.addEventListener('click', function () {
      var m = H.getAttribute('data-mode') === 'dark' ? 'light' : 'dark'; H.setAttribute('data-mode', m); temaYaz();
      try { localStorage.setItem('erdevelop-mode', m); localStorage.setItem('erdevelop-mode-gun', new Date().toDateString()); } catch (x) { }
    });
    D.getElementById('p-ara-ac').addEventListener('click', function () { if (window.erArama) window.erArama.ac(''); else location.href = '/Tools.html'; });
    var menuBtn = D.getElementById('p-menu');
    menuBtn.addEventListener('click', function () { var a = ust.classList.toggle('acik'); menuBtn.setAttribute('aria-expanded', a ? 'true' : 'false'); });
    D.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') ust.classList.remove('acik'); });
    var kay = function () { ust.classList.toggle('kaydi', window.scrollY > 6); };
    window.addEventListener('scroll', kay, { passive: true }); kay();
  }

  var alt = D.getElementById('p-alt');
  if (alt) {
    var sut = function (m) {
      return '<div><h3 data-en="' + e(m.en) + '">' + e(m.tr) + '</h3>' + (m.alt || []).filter(function (a) { return !a[3] || a[2] === '/Tools.html'; }).map(function (a) {
        return '<a class="l" href="' + a[2] + '" data-en="' + e(a[1]) + '">' + e(a[0]) + '</a>'; }).join('') + '</div>';
    };
    alt.innerHTML = '<div class="wrap p-foot">'
      + '<div><a class="p-logo" href="/"><i>e</i><b><span>er</span>develop</b></a><p data-en="Free calculators, engineering tools, courses and browser games. No sign-up, nothing to install.">Ücretsiz hesaplama araçları, mühendislik hesapları, eğitimler ve tarayıcı oyunları. Üyelik yok, kurulum yok.</p></div>'
      + sut(MENU[0]) + sut(MENU[1]) + sut(MENU[3])
      + '<div><h3>erdevelop</h3>'
      + '<a class="l" href="/tarayici-oyunlari/" data-en="Games">Oyunlar</a><a class="l" href="/yenilikler.html" data-en="What\'s new">Yenilikler</a><a class="l" href="/hakkinda.html" data-en="About">Hakkında</a><a class="l" href="/hakkinda.html#iletisim" data-en="Contact">İletişim</a>'
      + '<a class="l" href="/gizlilik.html" data-en="Privacy">Gizlilik</a><a class="l" href="/kullanim.html" data-en="Terms of use">Kullanım koşulları</a></div>'
      + '</div><div class="wrap p-telif"><span>© ' + new Date().getFullYear() + ' erdevelop</span><span data-en="Calculations are for educational and preliminary purposes only.">Hesaplar eğitim ve ön bilgi amaçlıdır.</span><a href="/feed.xml" style="margin-left:auto">RSS</a></div>';
  }
  /* ---- "Kaldığın yerden devam et": yarım kalan eğitimler (erdevelop-egitim-ozet) ve son açılan araçlar (erdevelop-son) ----
     Sayfada <section id="p-devam" hidden data-arac="6" data-kurs="2"> varsa doldurur; kayıt yoksa bölüm gizli kalır.
     Her şey bu tarayıcıda saklanır, bir yere gönderilmez. */
  var kutu = D.getElementById('p-devam');
  if (kutu && window.fetch) {
    var oku = function (k, bos) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : bos; } catch (x) { return bos; } };
    var ozet = oku('erdevelop-egitim-ozet', {}), son = oku('erdevelop-son', []);
    var kurs = {}; Object.keys(ozet).forEach(function (k) { var m = /^\/(egitimler\/[^/]+\/)(en\/)?$/.exec(k), v = ozet[k]; if (!m || !v) return; var y = Math.min(100, +v.p || 0); if (!kurs[m[1]] || y > kurs[m[1]].p) kurs[m[1]] = { p: y, t: Math.max(+v.t || 0, kurs[m[1]] ? kurs[m[1]].t : 0) }; });
    var yarim = Object.keys(kurs).filter(function (f) { return kurs[f].p > 0 && kurs[f].p < 100; }).sort(function (a, b) { return kurs[b].t - kurs[a].t; });
    if ((yarim.length || (Array.isArray(son) && son.length)) ) fetch('/js/harita.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (h) {
      if (!h) return;
      var ad = {}; Object.keys(h.o).forEach(function (g) { h.o[g].forEach(function (x) { if (!ad[x[0]]) ad[x[0]] = [x[1], x[2], g]; }); });
      var nK = +kutu.getAttribute('data-kurs') || 0, nA = +kutu.getAttribute('data-arac') || 0;
      var ciz = function () {
        var E = window.erDil && window.erDil.lang === 'en', out = [];
        yarim.filter(function (f) { return ad[f]; }).slice(0, nK).forEach(function (f) {
          out.push('<a href="/' + e(f) + '" style="--ton:var(--amber)"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/></svg></i><span>' + e(ad[f][E ? 1 : 0]) + '<small>%' + Math.round(kurs[f].p) + (E ? ' done' : ' tamamlandı') + '</small><em><b style="width:' + Math.round(kurs[f].p) + '%"></b></em></span></a>'); });
        (Array.isArray(son) ? son : []).filter(function (x) { return x && ad[x[0]]; }).slice(0, nA).forEach(function (x) { var a = ad[x[0]], g = h.g[a[2]], oy = g.k === 'oyunlar';
          out.push('<a href="/' + e(x[0]) + '" style="--ton:var(--' + (oy ? 'violet' : g.k === 'muhendislik' ? 'green' : 'blue') + ')"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (oy ? '<path d="M8 5.500v13l11-6.500z"/>' : '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>') + '</svg></i><span>' + e(a[E ? 1 : 0]) + '<small>' + e(g.t[E ? 1 : 0]) + '</small></span></a>'); });
        if (!out.length) { kutu.hidden = true; return; }
        kutu.querySelector('.hizli').innerHTML = out.join(''); kutu.hidden = false;
      };
      ciz(); if (window.erDil && window.erDil.on) window.erDil.on(ciz);
    }).catch(function () { });
  }
})();
