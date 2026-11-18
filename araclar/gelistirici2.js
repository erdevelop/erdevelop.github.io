/* erdevelop · Geliştirici araçları (2): şifre, URL, JWT, CSV↔JSON, biçimlendirici, cron, Markdown, favicon. ortak.js + gelistirici.js sonrası yüklenir. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const e2 = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const kopya = async (t, b) => { try { await navigator.clipboard.writeText(t); if (b) { const o = b.textContent; b.textContent = 'Kopyalandı ✓'; setTimeout(() => b.textContent = o, 1200); } } catch (e) { } };
  const indir = (ad, veri, tip = 'text/plain') => { const u = URL.createObjectURL(veri instanceof Blob ? veri : new Blob([veri], { type: tip })), a = document.createElement('a'); a.href = u; a.download = ad; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
  const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;

  /* ---------- şifre ---------- */
  function rnd(n) { const lim = Math.floor(2 ** 32 / n) * n, b = new Uint32Array(1); do crypto.getRandomValues(b); while (b[0] >= lim); return b[0] % n; }
  function sifre() {
    const L = +$('pwLen').value; $('pwLenV').textContent = L;
    let g = [];
    if ($('pwU').checked) g.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); if ($('pwL').checked) g.push('abcdefghijklmnopqrstuvwxyz'); if ($('pwD').checked) g.push('0123456789'); if ($('pwS').checked) g.push('!@#$%^&*()-_=+[]{};:,.?/~');
    if ($('pwA').checked) g = g.map(s => s.replace(/[Il1O0o]/g, ''));
    g = g.filter(Boolean); if (!g.length) { $('pwRes').innerHTML = '<span class="ph">En az bir karakter grubu seç.</span>'; return; }
    const all = g.join(''), bit = L * Math.log2(all.length), out = [];
    for (let k = 0; k < +$('pwAdet').value; k++) {
      let p = g.map(s => s[rnd(s.length)]); while (p.length < L) p.push(all[rnd(all.length)]); p = p.slice(0, L);
      for (let i = p.length - 1; i > 0; i--) { const j = rnd(i + 1); [p[i], p[j]] = [p[j], p[i]]; } out.push(p.join(''));
    }
    const sev = bit >= 100 ? 'çok güçlü' : bit >= 80 ? 'güçlü' : bit >= 60 ? 'orta' : 'zayıf';
    $('pwRes').innerHTML = out.map(p => `<div class="kv"><span class="mono" style="word-break:break-all">${e2(p)}</span><b><button class="btn ghost sm" type="button" data-pw="${e2(p)}">Kopyala</button></b></div>`).join('') + `<div class="hint" style="margin-top:6px">Entropi ≈ ${Math.round(bit)} bit · ${sev} · ${all.length} karakterlik havuz</div>`;
  }
  $('pwRes').addEventListener('click', e => { const b = e.target.closest('[data-pw]'); if (b) kopya(b.dataset.pw, b); });
  ['pwLen', 'pwAdet', 'pwU', 'pwL', 'pwD', 'pwS', 'pwA'].forEach(id => $(id).addEventListener('input', sifre)); $('pwGo').onclick = sifre; sifre();

  /* ---------- URL ---------- */
  function urlIncele(s) {
    try { const u = new URL(s.trim()); const q = [...u.searchParams];
      $('urRes').innerHTML = kv('Protokol', e2(u.protocol)) + kv('Alan adı', e2(u.hostname)) + (u.port ? kv('Port', u.port) : '') + kv('Yol', e2(decodeURIComponent(u.pathname))) + (u.hash ? kv('Çapa (#)', e2(decodeURIComponent(u.hash))) : '') + (q.length ? '<div class="hint" style="margin:8px 0 2px">Sorgu parametreleri</div>' + q.map(([k, v]) => kv(e2(k), e2(v))).join('') : '');
    } catch (e) { $('urRes').innerHTML = ''; }
  }
  $('urEnc').onclick = () => { $('urOut').value = encodeURIComponent($('urIn').value); };
  $('urEncF').onclick = () => { $('urOut').value = encodeURI($('urIn').value); };
  $('urDec').onclick = () => { try { $('urOut').value = decodeURIComponent($('urIn').value.replace(/\+/g, ' ')); } catch (e) { $('urOut').value = 'Çözülemedi: geçersiz % dizisi.'; } };
  $('urIn').addEventListener('input', () => urlIncele($('urIn').value));

  /* ---------- JWT ---------- */
  const b64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
  const tarih = v => typeof v === 'number' ? ' <span class="hint">(' + new Date(v * 1000).toLocaleString('tr-TR') + ')</span>' : '';
  async function jwt() {
    const t = $('jwIn').value.trim(), p = t.split('.'); $('jwSig').innerHTML = '';
    if (!t) { $('jwRes').innerHTML = '<span class="ph">Token yapıştır.</span>'; return; }
    try {
      const h = JSON.parse(new TextDecoder().decode(b64u(p[0]))), y = JSON.parse(new TextDecoder().decode(b64u(p[1]))), now = Date.now() / 1000;
      let durum = ''; if (y.exp) durum = y.exp < now ? '<b style="color:var(--warn)">süresi dolmuş</b>' : '<b style="color:var(--ok)">geçerli süre içinde</b>';
      $('jwRes').innerHTML = '<div class="hint">Başlık</div><pre class="mono" style="white-space:pre-wrap;margin:4px 0 10px">' + e2(JSON.stringify(h, null, 2)) + '</pre><div class="hint">Yük (payload)</div><pre class="mono" style="white-space:pre-wrap;margin:4px 0 10px">' + e2(JSON.stringify(y, null, 2)) + '</pre>' +
        ['iat', 'nbf', 'exp'].filter(k => k in y).map(k => kv({ iat: 'Oluşturma (iat)', nbf: 'Geçerlilik başı (nbf)', exp: 'Bitiş (exp)' }[k], y[k] + tarih(y[k]))).join('') + (durum ? kv('Durum', durum) : '');
      const key = $('jwKey').value;
      if (key && p[2] && h.alg === 'HS256') {
        const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const ok = await crypto.subtle.verify('HMAC', k, b64u(p[2]), new TextEncoder().encode(p[0] + '.' + p[1]));
        $('jwSig').innerHTML = ok ? '<b style="color:var(--ok)">✓ İmza doğru</b>' : '<b style="color:var(--warn)">✗ İmza bu anahtarla doğrulanmadı</b>';
      } else if (key && h.alg !== 'HS256') $('jwSig').innerHTML = '<span class="hint">Yalnızca HS256 imzası doğrulanabilir (bu token: ' + e2(h.alg) + ').</span>';
    } catch (e) { $('jwRes').innerHTML = '<b style="color:var(--warn)">Geçersiz JWT: üç parçalı base64url yapısı çözülemedi.</b>'; }
  }
  $('jwIn').addEventListener('input', jwt); $('jwKey').addEventListener('input', jwt);

  /* ---------- CSV ↔ JSON ---------- */
  function csvOku(s, d) {
    if (d === 'oto') { const l = s.split('\n')[0], c = { ',': 0, ';': 0, '\t': 0, '|': 0 }; let q = false; for (const ch of l) { if (ch === '"') q = !q; else if (!q && ch in c) c[ch]++; } d = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; }
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < s.length; i++) { const ch = s[i];
      if (q) { if (ch === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true; else if (ch === d) { row.push(f); f = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += ch; }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return { rows: rows.filter(r => r.some(x => x !== '')), d };
  }
  const sayi = v => $('cvSay').checked && /^-?\d+([.,]\d+)?$/.test(v.trim()) ? +v.replace(',', '.') : v;
  $('cvToJ').onclick = () => {
    const { rows, d } = csvOku($('cvIn').value, $('cvAyr').value); if (!rows.length) return;
    const bas = $('cvBas').checked ? rows.shift().map((h, i) => h.trim() || 'alan' + (i + 1)) : null;
    const out = rows.map(r => bas ? Object.fromEntries(bas.map((h, i) => [h, sayi(r[i] ?? '')])) : r.map(sayi));
    $('cvOut').value = JSON.stringify(out, null, 2); $('cvRes').innerHTML = kv('Satır', rows.length) + kv('Sütun', (bas || rows[0]).length) + kv('Ayırıcı', d === '\t' ? 'sekme' : e2(d));
  };
  $('cvToC').onclick = () => {
    let j; try { j = JSON.parse($('cvIn').value); } catch (e) { $('cvRes').innerHTML = '<b style="color:var(--warn)">Geçersiz JSON: ' + e2(e.message) + '</b>'; return; }
    if (!Array.isArray(j)) j = [j]; const d = $('cvAyr').value === 'oto' ? ';' : $('cvAyr').value;
    const keys = [...new Set(j.flatMap(o => o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []))];
    const c = v => { v = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /["\n\r]/.test(v) || v.includes(d) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const lines = keys.length ? [keys.map(c).join(d), ...j.map(o => keys.map(k => c(o[k])).join(d))] : j.map(r => (Array.isArray(r) ? r : [r]).map(c).join(d));
    $('cvOut').value = lines.join('\n'); $('cvRes').innerHTML = kv('Satır', j.length) + kv('Sütun', keys.length || '—');
  };
  $('cvCp').onclick = e => kopya($('cvOut').value, e.target);
  $('cvDl').onclick = () => { const v = $('cvOut').value; indir(v.trim().startsWith('[') || v.trim().startsWith('{') ? 'veri.json' : 'veri.csv', '﻿' + v); };
  if (window.dropZone) dropZone($('cvDrop'), async f => { $('cvIn').value = await f[0].text(); });

  /* ---------- biçimlendirici ---------- */
  const SQLK = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'JOIN', 'ON', 'UNION ALL', 'UNION', 'CREATE TABLE', 'WITH', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IN', 'NOT', 'NULL', 'IS', 'LIKE', 'BETWEEN', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DESC', 'ASC'];
  const NL = new Set(['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'JOIN', 'UNION ALL', 'UNION', 'WITH']);
  function sqlFmt(s, ind) {
    const str = []; s = s.replace(/'(?:[^']|'')*'/g, m => { str.push(m); return '\u0000' + (str.length - 1) + '\u0000'; }).replace(/\s+/g, ' ').trim();
    const re = new RegExp('\\b(' + SQLK.map(k => k.replace(' ', '\\s+')).join('|') + ')\\b', 'gi');
    s = s.replace(re, m => m.toUpperCase().replace(/\s+/g, ' '));
    for (const k of NL) s = s.replace(new RegExp((k === 'JOIN' ? '(?<!(?:LEFT|RIGHT|INNER|FULL)\\s*)\\s*' : '\\s*') + '\\b' + k + '\\b', 'g'), '\n' + k);
    s = s.replace(/\s*\b(AND|OR)\b/g, '\n' + ind + '$1').replace(/,\s*/g, ',\n' + ind).replace(/\n(SELECT|FROM|WHERE|SET|VALUES|ORDER BY|GROUP BY)\n/g, '\n$1 ');
    let d = 0; s = s.split('\n').map(l => { l = l.trim(); const o = (l.match(/\(/g) || []).length, c = (l.match(/\)/g) || []).length; const r = ind.repeat(Math.max(0, d)) + (/^(AND|OR)\b/.test(l) || /^[^A-Z]/.test(l) && !/^\(/.test(l) ? ind : '') + l; d += o - c; return r; }).join('\n').trim();
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => str[i]);
  }
  function htmlFmt(s, ind) {
    const tok = s.replace(/>\s+</g, '><').trim().split(/(<[^>]+>)/).filter(t => t.trim()); let d = 0; const VOID = /^<(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr|!doctype|\?xml)/i;
    return tok.map(t => { if (/^<\//.test(t)) d = Math.max(0, d - 1); const l = ind.repeat(d) + t.trim(); if (/^<[^/!?][^>]*[^/]>$/.test(t) && !VOID.test(t) || /^<[a-z][a-z0-9-]*>$/i.test(t) && !VOID.test(t)) d++; return l; }).join('\n');
  }
  function cssFmt(s, ind) { return s.replace(/\/\*[\s\S]*?\*\//g, m => m).replace(/\s+/g, ' ').replace(/\s*{\s*/g, ' {\n').replace(/;\s*/g, ';\n').replace(/\s*}\s*/g, '\n}\n\n').split('\n').reduce((a, l) => { l = l.trim(); if (!l) { if (a.length && a[a.length - 1] !== '') a.push(''); return a; } if (l === '}') a.d--; a.push((l === '}' || l.endsWith('{') ? ind.repeat(Math.max(0, a.d)) : ind.repeat(a.d)) + l); if (l.endsWith('{')) a.d++; return a; }, Object.assign([], { d: 0 })).join('\n').trim(); }
  const kucult = (s, dil) => dil === 'css' ? s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};:,>])\s*/g, '$1').replace(/;}/g, '}').trim() : dil === 'html' ? s.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim() : s.replace(/\s+/g, ' ').trim();
  $('fGo').onclick = () => { const ind = ' '.repeat(+$('fInd').value), d = $('fDil').value, s = $('fIn').value; $('fOut').value = d === 'sql' ? sqlFmt(s, ind) : d === 'html' ? htmlFmt(s, ind) : cssFmt(s, ind); };
  $('fMin').onclick = () => { $('fOut').value = kucult($('fIn').value, $('fDil').value); };
  $('fCp').onclick = e => kopya($('fOut').value, e.target);

  /* ---------- cron ---------- */
  const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'], AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const ADL = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12, sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  function alan(f, lo, hi) {
    const set = new Set(); f = f.toLowerCase().replace(/[a-z]{3}/g, m => ADL[m] ?? m);
    for (const p of f.split(',')) { const [r, st] = p.split('/'), s = +(st || 1); let a, b;
      if (r === '*' || r === '?') { a = lo; b = hi; } else if (r.includes('-')) [a, b] = r.split('-').map(Number); else { a = +r; b = st ? hi : a; }
      if (![a, b, s].every(Number.isInteger) || a < lo || b > hi || s < 1) throw new Error(p);
      for (let x = a; x <= b; x += s) set.add(x === 7 && hi === 7 ? 0 : x); }
    return set;
  }
  const liste = (set, lo, hi, ad) => set.size === hi - lo + 1 ? null : [...set].sort((a, b) => a - b).map(ad || String).join(', ');
  function cron() {
    const s = $('crIn').value.trim(), m = { '@hourly': '0 * * * *', '@daily': '0 0 * * *', '@weekly': '0 0 * * 0', '@monthly': '0 0 1 * *', '@yearly': '0 0 1 1 *' }[s] || s, p = m.split(/\s+/);
    if (p.length !== 5) { $('crRes').innerHTML = '<b style="color:var(--warn)">5 alan gerekir: dakika saat gün ay haftagünü</b>'; return; }
    try {
      const [mi, sa, gu, ay, hg] = [alan(p[0], 0, 59), alan(p[1], 0, 23), alan(p[2], 1, 31), alan(p[3], 1, 12), alan(p[4], 0, 7)];
      const gunHer = p[2] === '*' || p[2] === '?', hgHer = p[4] === '*' || p[4] === '?';
      const parca = [];
      const lm = liste(mi, 0, 59), ls = liste(sa, 0, 23);
      if (mi.size === 1 && sa.size === 1) parca.push('saat ' + String([...sa][0]).padStart(2, '0') + ':' + String([...mi][0]).padStart(2, '0'));
      else { parca.push(lm ? (p[0].startsWith('*/') ? 'her ' + p[0].slice(2) + ' dakikada bir' : 'dakika ' + lm) : 'her dakika'); if (ls) parca.push(p[1].startsWith('*/') ? 'her ' + p[1].slice(2) + ' saatte bir' : 'saat ' + ls); }
      if (!gunHer) parca.push('ayın ' + liste(gu, 1, 31) + '. günü');
      if (!hgHer) parca.push(liste(hg, 0, 7, i => GUNLER[i]) || 'her gün');
      const la = liste(ay, 1, 12, i => AYLAR[i - 1]); if (la) parca.push(la);
      const sonra = [], d = new Date(); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
      for (let i = 0; i < 527040 && sonra.length < 6; i++) {
        const gOk = gunHer && hgHer ? true : gunHer ? hg.has(d.getDay()) : hgHer ? gu.has(d.getDate()) : gu.has(d.getDate()) || hg.has(d.getDay());
        if (mi.has(d.getMinutes()) && sa.has(d.getHours()) && ay.has(d.getMonth() + 1) && gOk) sonra.push(new Date(d));
        d.setMinutes(d.getMinutes() + 1);
      }
      $('crRes').innerHTML = `<div class="big" style="font-size:1.1rem">${e2(parca.join(', '))}</div><div class="hint" style="margin:6px 0 2px">Sonraki çalışmalar</div>` + sonra.map(t => kv(t.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))).join('');
    } catch (e) { $('crRes').innerHTML = '<b style="color:var(--warn)">Geçersiz alan: ' + e2(e.message) + '</b>'; }
  }
  $('crIn').addEventListener('input', cron); $('crOrn').addEventListener('click', e => { const b = e.target.closest('[data-cr]'); if (b) { $('crIn').value = b.dataset.cr; cron(); } }); cron();

  /* ---------- Markdown ---------- */
  function satirIci(s) {
    return e2(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) => /^(https?:|\.|\/)/.test(u) ? `<img alt="${a}" src="${u}" style="max-width:100%">` : m)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, a, u) => /^(https?:|mailto:|#|\.|\/)/.test(u) ? `<a href="${u}" target="_blank" rel="noopener">${a}</a>` : a)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }
  function md(src) {
    const L = src.replace(/\r/g, '').split('\n'), out = []; let i = 0;
    while (i < L.length) { const l = L[i];
      if (/^```/.test(l)) { const b = []; i++; while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]); i++; out.push('<pre><code>' + e2(b.join('\n')) + '</code></pre>'); continue; }
      let m;
      if ((m = l.match(/^(#{1,6})\s+(.*)/))) { out.push(`<h${m[1].length}>${satirIci(m[2])}</h${m[1].length}>`); i++; continue; }
      if (/^(\*\s*){3,}$|^(-\s*){3,}$/.test(l.trim())) { out.push('<hr>'); i++; continue; }
      if (/^>\s?/.test(l)) { const b = []; while (i < L.length && /^>\s?/.test(L[i])) b.push(L[i++].replace(/^>\s?/, '')); out.push('<blockquote>' + md(b.join('\n')) + '</blockquote>'); continue; }
      if (/^\|.*\|\s*$/.test(l) && /^\|?\s*:?-+/.test(L[i + 1] || '')) { const cel = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => satirIci(c.trim())); const h = cel(l); i += 2; const rs = []; while (i < L.length && /^\|/.test(L[i])) rs.push(cel(L[i++])); out.push('<table><thead><tr>' + h.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' + rs.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table>'); continue; }
      if (/^\s*([-*+]|\d+\.)\s+/.test(l)) { const ol = /^\s*\d+\./.test(l), b = []; while (i < L.length && /^\s*([-*+]|\d+\.)\s+/.test(L[i])) b.push(L[i++].replace(/^\s*([-*+]|\d+\.)\s+/, '')); out.push(`<${ol ? 'ol' : 'ul'}>` + b.map(x => '<li>' + satirIci(x.replace(/^\[( |x)\]\s*/i, (mm, c) => c.trim() ? '☑ ' : '☐ ')) + '</li>').join('') + `</${ol ? 'ol' : 'ul'}>`); continue; }
      if (!l.trim()) { i++; continue; }
      const b = []; while (i < L.length && L[i].trim() && !/^(#|>|```|\s*([-*+]|\d+\.)\s|\|)/.test(L[i])) b.push(L[i++]); out.push('<p>' + satirIci(b.join(' ')) + '</p>');
    }
    return out.join('\n');
  }
  const mdCiz = () => { $('mdOut').innerHTML = md($('mdIn').value); };
  $('mdIn').addEventListener('input', mdCiz); $('mdCp').onclick = e => kopya(md($('mdIn').value), e.target); $('mdDl').onclick = () => indir('belge.md', $('mdIn').value, 'text/markdown'); mdCiz();

  /* ---------- favicon ---------- */
  let icImg = null; const BOY = [16, 32, 48, 180, 192, 512];
  function icCiz(n) {
    const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), r = n * (+$('icR').value) / 100;
    x.beginPath(); x.moveTo(r, 0); x.arcTo(n, 0, n, n, r); x.arcTo(n, n, 0, n, r); x.arcTo(0, n, 0, 0, r); x.arcTo(0, 0, n, 0, r); x.closePath(); x.clip();
    if (icImg) { const s = Math.min(icImg.width, icImg.height); x.drawImage(icImg, (icImg.width - s) / 2, (icImg.height - s) / 2, s, s, 0, 0, n, n); }
    else { x.fillStyle = $('icBg').value; x.fillRect(0, 0, n, n); const t = $('icTx').value || 'E'; x.fillStyle = $('icFg').value; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `600 ${n * (t.length > 2 ? .42 : t.length > 1 ? .5 : .62)}px system-ui, sans-serif`; x.fillText(t, n / 2, n * .54); }
    return c;
  }
  function icOn() { $('icRv').textContent = $('icR').value; $('icPrev').innerHTML = ''; [16, 32, 48, 180].forEach(n => { const c = icCiz(n); c.style.width = c.style.height = Math.max(n, 24) + 'px'; c.style.imageRendering = n < 48 ? 'pixelated' : 'auto'; c.title = n + ' px'; $('icPrev').append(c); }); }
  const png = n => new Promise(r => icCiz(n).toBlob(b => r(b), 'image/png'));
  $('icIco').onclick = async () => {
    const bs = await Promise.all([16, 32, 48].map(n => png(n).then(b => b.arrayBuffer()))), N = bs.length, head = 6 + 16 * N, tot = head + bs.reduce((s, b) => s + b.byteLength, 0), buf = new ArrayBuffer(tot), dv = new DataView(buf);
    dv.setUint16(2, 1, true); dv.setUint16(4, N, true); let off = head;
    bs.forEach((b, i) => { const n = [16, 32, 48][i], e = 6 + 16 * i; dv.setUint8(e, n); dv.setUint8(e + 1, n); dv.setUint16(e + 4, 1, true); dv.setUint16(e + 6, 32, true); dv.setUint32(e + 8, b.byteLength, true); dv.setUint32(e + 12, off, true); new Uint8Array(buf, off, b.byteLength).set(new Uint8Array(b)); off += b.byteLength; });
    indir('favicon.ico', new Blob([buf], { type: 'image/x-icon' }));
  };
  $('icPng').onclick = async () => { for (const n of BOY) { indir(n === 180 ? 'apple-touch-icon.png' : `icon-${n}.png`, await png(n)); await new Promise(r => setTimeout(r, 250)); } };
  $('icHtml').onclick = e => kopya('<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/manifest.webmanifest">\n<!-- manifest: "icons": [{"src":"/icon-192.png","sizes":"192x192","type":"image/png"},{"src":"/icon-512.png","sizes":"512x512","type":"image/png"}] -->', e.target);
  ['icTx', 'icBg', 'icFg', 'icR'].forEach(id => $(id).addEventListener('input', () => { if (id === 'icTx') icImg = null; icOn(); }));
  const icYukle = f => { const im = new Image(); im.onload = () => { icImg = im; icOn(); }; im.src = URL.createObjectURL(f); };
  if (window.dropZone) dropZone($('icDrop'), f => icYukle(f[0])); else $('icDrop').querySelector('input').onchange = e => icYukle(e.target.files[0]);
  icOn();
})();
