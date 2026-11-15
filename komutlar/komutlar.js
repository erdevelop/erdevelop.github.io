/* erdevelop · CAD komutları ve kısayolları — ortak arama ve liste motoru
   Veri: veri-<program>.js dosyaları window.KMT.<program> = { ad, sayfa, not, k: [[komut, kısayol, kategori, açıklama], …] } */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fold = s => String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[’'`]/g, '');
  const progs = (document.body.dataset.prog || '').split(',').filter(Boolean).filter(p => window.KMT && KMT[p]);
  const multi = progs.length > 1;
  const ROWS = [];
  progs.forEach(p => KMT[p].k.forEach(([c, s, g, d]) => ROWS.push({ p, c, s: s || '', g, d, f: fold([c, s, g, d, KMT[p].ad].join(' ')), fc: fold(c), fs: fold(s).replace(/\s+/g, '') })));
  const CATS = []; ROWS.forEach(r => { const k = multi ? KMT[r.p].ad : r.g; if (!CATS.includes(k)) CATS.push(k); });
  let cat = '', onlyKey = false;

  /* kısayolu tuş görünümüne çevir: "CO / CP" → <kbd>CO</kbd> / <kbd>CP</kbd>, "Ctrl+Shift+C" → <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd> */
  const keys = s => s ? s.split(/\s*\/\s*/).map(a => a.split('+').map(k => `<kbd>${esc(k.trim())}</kbd>`).join('<i>+</i>')).join('<i>/</i>') : '<span class="none">—</span>';
  const mark = (txt, words) => { let h = esc(txt); if (!words.length) return h; const f = fold(txt); const hits = [];
    words.forEach(w => { const x = f.includes(w) ? w : stem(w); let i = -1; while ((i = f.indexOf(x, i + 1)) > -1) hits.push([i, i + x.length]); });
    if (!hits.length) return h; hits.sort((a, b) => a[0] - b[0]); const m = []; hits.forEach(x => { const l = m[m.length - 1]; if (l && x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else m.push(x.slice()); });
    let out = '', p = 0; m.forEach(([a, b]) => { out += esc(txt.slice(p, a)) + '<mark>' + esc(txt.slice(a, b)) + '</mark>'; p = b; }); return out + esc(txt.slice(p)); };

  /* basit kök: 5+ harfli kelimede son iki harf atılır (budama → buda, kopyalama → kopyala) */
  const stem = w => w.length >= 5 && /^[a-z]+$/.test(w) ? w.slice(0, w.length - 2) : w;
  function score(r, q, words) {
    if (!words.length) return 1;
    if (!words.every(w => r.f.includes(w) || r.f.includes(stem(w)))) return 0;
    const qq = q.replace(/\s+/g, '');
    let s = 1; if (r.fs && r.fs.split('/').includes(qq)) s += 100; if (r.fc === q) s += 80; else if (r.fc.startsWith(q)) s += 40; if (r.fc.includes(q)) s += 10; return s;
  }
  function render() {
    const raw = $('kq').value.trim(), q = fold(raw), words = q.split(/\s+/).filter(Boolean);
    let list = ROWS.map(r => [score(r, q, words), r]).filter(([s, r]) => s && (!onlyKey || r.s) && (!cat || (multi ? KMT[r.p].ad : r.g) === cat));
    if (words.length) list.sort((a, b) => b[0] - a[0]);
    $('kn').textContent = list.length + ' komut' + (raw || cat || onlyKey ? ' bulundu' : '');
    if (!list.length) { $('kl').innerHTML = `<p class="ph">“${esc(raw)}” için sonuç yok. Komutun İngilizce adını, Türkçe açıklamasından bir kelimeyi ya da kısayolu (ör. <b>CO</b>, <b>Ctrl+J</b>) yazmayı dene.</p>`; return; }
    const row = ([, r]) => `<div class="kr"><button class="kc" type="button" data-c="${esc(r.c)}" title="Kopyala">${mark(r.c, words)}</button><span class="ks">${keys(r.s)}</span>${multi ? `<span class="kp kp-${r.p}">${esc(KMT[r.p].ad)}</span>` : ''}<p class="kd">${mark(r.d, words)}${multi || words.length ? ` <small>· ${esc(r.g)}</small>` : ''}</p></div>`;
    if (words.length || multi) { $('kl').innerHTML = list.slice(0, 400).map(row).join(''); return; }
    const by = {}; list.forEach(x => (by[x[1].g] = by[x[1].g] || []).push(x));
    $('kl').innerHTML = Object.keys(by).map(g => `<h2 class="kg">${esc(g)} <small>${by[g].length}</small></h2>` + by[g].map(row).join('')).join('');
  }
  $('kc').innerHTML = `<button type="button" class="on" data-k="">Hepsi</button>` + CATS.map(c => `<button type="button" data-k="${esc(c)}">${esc(c)}</button>`).join('');
  $('kc').onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; cat = b.dataset.k; $('kc').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); render(); };
  $('kk').onchange = () => { onlyKey = $('kk').checked; render(); };
  let t = 0; $('kq').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { render(); try { history.replaceState(null, '', $('kq').value.trim() ? '#ara=' + encodeURIComponent($('kq').value.trim()) : location.pathname); } catch (e) { } }, 120); });
  $('kl').addEventListener('click', async e => { const b = e.target.closest('[data-c]'); if (!b) return; try { await navigator.clipboard.writeText(b.dataset.c); toast('Kopyalandı: ' + b.dataset.c); } catch (x) { } });
  addEventListener('keydown', e => { if (e.key === '/' && document.activeElement !== $('kq')) { e.preventDefault(); $('kq').focus(); } if (e.key === 'Escape' && document.activeElement === $('kq')) { $('kq').value = ''; render(); } });
  const pr = $('kpr'); if (pr) pr.onclick = () => print();
  const h = decodeURIComponent((location.hash.match(/^#ara=(.*)$/) || [])[1] || ''); if (h) $('kq').value = h;
  if (!multi && progs[0]) $('knot').textContent = KMT[progs[0]].not;
  render();
})();
