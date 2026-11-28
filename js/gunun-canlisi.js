/* Günün canlısı: Mikro Dünya Ansiklopedisi'nden her gün (İstanbul günü) bir canlı.
   Veri: /mikro-dunya/gunun-canlisi.json (scratchpad/ansik/gunun.py üretir). 50 canlının hepsi 50 günde bir kez gelir.
   <a data-gunun-canlisi> → ana sayfa kartı (portal .genis içinde); <div data-gunun-canlisi> → ansiklopedi sayfalarındaki geniş kart. */
(function () {
  'use strict';
  var EL = document.querySelectorAll('[data-gunun-canlisi]'); if (!EL.length) return;
  var dil = function () { return window.erDil ? window.erDil.lang : (/^en/i.test(document.documentElement.lang) ? 'en' : 'tr'); };
  var gunNo = function () { var p = new URLSearchParams(location.search).get('gunNo'); return p ? +p : Math.floor((Date.now() + 3 * 3600e3) / 864e5); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var stil = document.createElement('style');
  stil.textContent = '.gcK{display:grid;grid-template-columns:120px 1fr;gap:16px;align-items:center;margin:14px 0 18px;padding:14px 16px;border-radius:16px;border:1px solid var(--accent,#5FD3B8);background:color-mix(in srgb,var(--accent,#5FD3B8) 8%,transparent)}'
    + '.gcK img{width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 50% 45%,#10414d,#061a20 72%);object-fit:contain}'
    + '.gcK .gcU{font:700 12px var(--f-mono,monospace);letter-spacing:.04em;text-transform:uppercase;color:var(--accent,#5FD3B8)}'
    + '.gcK h3{margin:4px 0 2px;font:800 20px/1.25 var(--f-display,inherit);color:var(--fg,inherit)}.gcK h3 i{font-weight:500;font-size:14px;color:var(--muted,#888);margin-left:6px}'
    + '.gcK p{margin:6px 0;font-size:14.5px;line-height:1.6;color:var(--text,inherit)}.gcK .gcB{font-size:14px;opacity:.92}.gcK a.gcA{font-weight:700;color:var(--hot,var(--accent,#5FD3B8));text-decoration:none}'
    + '@media (max-width:560px){.gcK{grid-template-columns:72px 1fr;gap:12px}.gcK img{width:72px;height:72px}}'
    + '[data-gunun-canlisi] .gcR{display:flex;gap:10px;align-items:center}[data-gunun-canlisi] .gcR img{width:46px;height:46px;flex:none;border-radius:50%;background:radial-gradient(circle at 50% 45%,#10414d,#061a20 72%);object-fit:contain}';
  (document.head || document.documentElement).appendChild(stil);
  var L = null;
  function ciz() {
    if (!L || !L.length) return;
    var g = gunNo(), c = L[((g * 17) % L.length + L.length) % L.length], en = dil() === 'en', k = en ? 1 : 0, f = c.f.length ? c.f[g % c.f.length][k] : '';
    var url = en ? '/micro-world/' + c.e + '/' : '/mikro-dunya/' + c.s + '/', img = '/mikro-dunya/gorsel/' + c.s + '.png';
    var tarih = new Date(g * 864e5 + 12 * 3600e3).toLocaleDateString(en ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
    for (var i = 0; i < EL.length; i++) {
      var e = EL[i];
      if (e.tagName === 'A') {   // ana sayfa kartı
        e.href = url;
        e.innerHTML = '<b>' + (en ? '🔬 Organism of the day' : '🔬 Günün canlısı') + ' <small>' + esc(tarih) + '</small></b>'
          + '<span class="gcR"><img src="' + img + '" alt="" width="46" height="46" loading="lazy"><span><strong>' + esc(c.a[k]) + '</strong> · <i>' + esc(c.l) + '</i><br>' + esc(c.o[k]) + '</span></span>'
          + '<u>' + (en ? 'Read more →' : 'Tanı →') + '</u>';
      } else {   // ansiklopedi kartı
        e.className = 'gcK';
        e.innerHTML = '<a href="' + url + '"><img src="' + img + '" alt="' + esc(c.a[k]) + '" width="120" height="120"></a><div>'
          + '<div class="gcU">' + (en ? '🔬 Organism of the day · ' : '🔬 Günün canlısı · ') + esc(tarih) + '</div>'
          + '<h3>' + esc(c.a[k]) + '<i>' + esc(c.l) + '</i></h3><p>' + esc(c.o[k]) + '</p>'
          + (f ? '<p class="gcB">💡 ' + f + '</p>' : '')   // bilgi metni kendi verimiz: <i>, <b> etiketleri kalır
          + '<a class="gcA" href="' + url + '">' + (en ? 'Read the full page →' : 'Sayfasını oku →') + '</a> · <a class="gcA" href="' + (en ? '/organizma.html?lang=en' : '/organizma.html') + '">' + (en ? '🦠 Find it in Organizma' : '🦠 Organizma\'da bul') + '</a></div>';
      }
    }
  }
  fetch('/mikro-dunya/gunun-canlisi.json').then(function (r) { return r.json(); }).then(function (d) { L = d; ciz(); }).catch(function () { });
  if (window.erDil && window.erDil.on) window.erDil.on(ciz);
})();
