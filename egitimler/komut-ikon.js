/* erdevelop · eğitim sayfalarında geçen program komutlarının yanına simge ekler.
   Kullanım: <script src="../komut-ikon.js" data-prog="rhino,grasshopper" data-atla="Curve,Point" defer></script>
   data-atla: o sayfada komut sayılmayacak adlar (isteğe bağlı).
   Kalın (strong) ya da kod (code) olarak yazılmış bir metin ya da "Komut" başlıklı tablo sütunundaki bir hücre, data-prog'daki programların komut listesinde
   (komutlar/veri-<program>.js) birebir varsa önüne simge eklenir; simge o komutun Komutlar sayfasındaki kaydına gider.
   Liste sırası önceliktir: aynı ad iki programda varsa ilk yazılan programınki kullanılır.
   Simgeler komutlar/ikonlar.js'teki özgün sade çizimlerdir; programların resmi simgeleri değildir. */
(function () {
  'use strict';
  const me = document.currentScript;
  if (!me) return;
  const progs = (me.dataset.prog || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!progs.length) return;
  const base = new URL('../komutlar/', me.src);
  const ATLA = /^(autocad|rhino|rhinoceros|grasshopper|revit|dynamo|solidworks)$/i;
  const atla = new Set((me.dataset.atla || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean));

  const yukle = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

  function stil() {
    const st = document.createElement('style');
    st.textContent = `
      a.kmt-i { display: inline-flex; align-items: center; justify-content: center; width: 1.25em; height: 1.25em; margin: 0 .22em 0 0; vertical-align: -.24em;
        border-radius: .3em; background: var(--accent-dim, rgba(47,111,181,.12)); color: var(--accent, #2f6fb5); text-decoration: none; transition: transform .15s; }
      a.kmt-i:hover { transform: scale(1.12); }
      a.kmt-i svg { width: .95em; height: .95em; }
      @media print { a.kmt-i { background: none; } }`;
    document.head.appendChild(st);
  }

  function isle() {
    const K = window.KMT || {};
    const tablo = new Map();
    progs.forEach(p => { const v = K[p]; if (!v) return; v.k.forEach(([c, , g, d]) => { const k = c.toLowerCase(); if (!tablo.has(k)) tablo.set(k, { p, c, g, d, ad: v.ad, sayfa: v.sayfa }); }); });
    if (!tablo.size || !window.erIkon) return;
    let n = 0;
    const ekle = (r, once, ust) => {
      const a = document.createElement('a');
      a.className = 'kmt-i';
      a.href = new URL(r.sayfa, base).href + '#ara=' + encodeURIComponent(r.c);
      a.title = `${r.ad} · ${r.c}: ${r.d}`;
      a.setAttribute('aria-label', `${r.ad} komutu ${r.c}`);
      a.innerHTML = window.erIkon(r.c, r.g, r.p);
      ust.insertBefore(a, once);
      n++;
    };
    /* "Komut" / "Bileşen" / "Node" başlıklı tablo sütunlarındaki düz metin hücreler */
    document.querySelectorAll('table').forEach(tb => {
      const th = [...(tb.querySelector('tr') || { cells: [] }).cells];
      th.forEach((h, i) => {
        if (!/^(komut|bileşen|node|component|araç)/i.test(h.textContent.trim())) return;
        tb.querySelectorAll('tr').forEach(tr => {
          const td = tr.cells[i]; if (!td || td.tagName !== 'TD' || td.querySelector('*')) return;
          const x = td.textContent.trim().toLowerCase(), r = tablo.get(x) || tablo.get(x.split(/\s*[\/(,]\s*/)[0]); if (r && !atla.has(r.c.toLowerCase())) ekle(r, td.firstChild, td);
        });
      });
    });
    document.querySelectorAll('strong, b, code').forEach(el => {
      if (el.closest('pre, a, label, h1, svg, .kmt-yok') || el.querySelector('*')) return;
      const t = el.textContent.trim();
      if (t.length < 2 || t.length > 40 || ATLA.test(t)) return;
      if (atla.has(t.toLowerCase())) return;
      /* kalın yazılmış küçük harfli metin çoğunlukla düz yazıdır ("curtain wall ile kur"); kod içindeki küçük harf ise aranan komut adıdır */
      if (el.tagName !== 'CODE' && t === t.toLowerCase()) return;
      const r = tablo.get(t.toLowerCase());
      if (!r) return;
      ekle(r, el, el.parentNode);
    });
    document.documentElement.dataset.kmtIkon = n;
  }

  const bas = () => Promise.all([yukle(new URL('ikonlar.js', base).href), ...progs.map(p => yukle(new URL('veri-' + p + '.js', base).href))])
    .then(() => { stil(); isle(); }).catch(() => { });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bas); else bas();
})();
