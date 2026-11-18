/* erdevelop · tüm sayfalarda ortak: site geneli arama (Ctrl+K ya da /) ve cihazlar arası senkron
   Sayfaya eklemek için: <script src="/js/site.js" defer></script> */
(function () {
  'use strict';
  if (window.__erSite) return; window.__erSite = 1;
  const yol = location.pathname, D = document;
  const KONSOL = /\/araclar\/konsol\.html$/.test(yol), TOOLS = /\/Tools\.html$/i.test(yol);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TRM = { ı: 'i', i: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u', é: 'e', è: 'e', ê: 'e', à: 'a', ä: 'a', ß: 'ss' };
  const norm = s => String(s || '').toLocaleLowerCase('tr').replace(/[ışğüöçâîûéèêàäß]/g, c => TRM[c]).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const en = (D.documentElement.lang || '').startsWith('en');

  /* ---------------- arama ---------------- */
  let veri = null, yen = null, dlg = null, sec = 0, son = [], tur = '';
  const getir = async u => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status); return r.json(); };
  const yukle = () => veri || (veri = getir('/arama.json').then(d => d.s.map(x => Object.assign(x, { _t: norm(x.t), _a: norm(x.a), _k: norm(x.k), _d: norm(x.d), _c: norm(x.c) }))).catch(e => { veri = null; throw e; }));
  const yeniler = () => yen || (yen = getir('/yenilikler.json').then(d => d.s).catch(() => []));
  function puan1(x, w) {
    if (x._t === w) return 120; if (x._t.startsWith(w)) return 70;
    if (new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(x._t)) return 50; if (x._t.includes(w)) return 35;
    if (x._a.includes(w)) return 25; if (x._k.includes(w)) return 18; if (x._c.includes(w)) return 14; if (x._d.includes(w)) return 8; return 0;
  }
  function puan(x, kel) {
    let p = 0;
    for (const w of kel) {
      /* Türkçe ünsüz yumuşaması ve ekler için: "kulüp" → "kulübü", "kitap" → "kitabı" */
      let b = puan1(x, w); if (!b && w.length >= 4) b = puan1(x, w.slice(0, -1)) * .8;
      if (!b) return 0; p += b;
    }
    if (yol === x.u || yol === x.u + 'index.html') p -= 30;
    return p;
  }
  /* eşleşen parçaları <mark> ile göster (Türkçe karakterler normalize edilerek) */
  function isaretle(t, kel) {
    t = String(t || ''); if (!kel.length) return esc(t);
    let n = '', ix = []; for (let i = 0; i < t.length; i++) { const c = norm(t[i]); n += c; for (let j = 0; j < c.length; j++) ix.push(i); }
    const m = new Array(t.length).fill(false);
    for (let w of kel) { if (n.indexOf(w) < 0 && w.length >= 4) w = w.slice(0, -1); let p = n.indexOf(w); while (p >= 0) { for (let j = p; j < p + w.length; j++) m[ix[j]] = true; p = n.indexOf(w, p + w.length); } }
    let h = '', ac = false; for (let i = 0; i < t.length; i++) { if (m[i] !== ac) { h += m[i] ? '<mark>' : '</mark>'; ac = m[i]; } h += esc(t[i]); } return h + (ac ? '</mark>' : '');
  }
  function stil() {
    if (D.getElementById('er-ara-css')) return;
    const s = D.createElement('style'); s.id = 'er-ara-css';
    s.textContent = `
#er-ara{position:fixed;inset:0;z-index:2147483600;background:rgba(5,8,14,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;justify-content:center;align-items:flex-start;padding:min(12vh,90px) 12px 12px;font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#er-ara[hidden]{display:none}
#er-ara .bx{width:min(680px,100%);max-height:min(76vh,640px);display:flex;flex-direction:column;background:#121826;color:#e8ecf3;border:1px solid rgba(255,255,255,.14);border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.5);overflow:hidden}
html[data-mode=light] #er-ara .bx{background:#fff;color:#1a2233;border-color:rgba(0,0,0,.12)}
#er-ara .hd{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(127,127,127,.22)}
#er-ara .hd svg{flex:0 0 auto;opacity:.6}
#er-ara input{flex:1;min-width:0;background:none;border:0;outline:0;color:inherit;font:inherit;font-size:17px}
#er-ara kbd{font:11px ui-monospace,monospace;border:1px solid rgba(127,127,127,.4);border-radius:4px;padding:1px 5px;opacity:.7}
#er-ara .x{background:none;border:0;color:inherit;font-size:20px;cursor:pointer;opacity:.6;padding:0 4px}
#er-ara .ch{display:flex;gap:6px;padding:8px 14px;overflow-x:auto;border-bottom:1px solid rgba(127,127,127,.15);scrollbar-width:none}
#er-ara .ch button{flex:0 0 auto;font:12px system-ui,sans-serif;padding:4px 10px;border-radius:999px;border:1px solid rgba(127,127,127,.35);background:none;color:inherit;cursor:pointer;opacity:.8}
#er-ara .ch button.on{background:#4f8cff;border-color:#4f8cff;color:#fff;opacity:1}
#er-ara ul{list-style:none;margin:0;padding:6px;overflow-y:auto}
#er-ara li a{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border-radius:9px;color:inherit;text-decoration:none}
#er-ara li a.on,#er-ara li a:hover{background:rgba(79,140,255,.16)}
#er-ara li .c{flex:0 0 auto;font:600 10.5px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.4px;padding:3px 6px;border-radius:5px;background:rgba(127,127,127,.16);margin-top:2px;min-width:62px;text-align:center}
#er-ara li .y{flex:1;min-width:0}
#er-ara li b{display:block;font-weight:600}
#er-ara li small{display:block;opacity:.7;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
#er-ara mark{background:rgba(255,200,60,.35);color:inherit;border-radius:2px}
#er-ara .bs{padding:8px 14px 4px;font:600 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.6px;opacity:.6}
#er-ara .ft{display:flex;gap:14px;flex-wrap:wrap;justify-content:space-between;padding:8px 14px;border-top:1px solid rgba(127,127,127,.18);font-size:12px;opacity:.75}
#er-ara .ft a{color:inherit}
#er-ara .bos{padding:22px 16px;opacity:.75;text-align:center}
.er-ara-btn{cursor:pointer}
@media (max-width:560px){#er-ara{padding:8px}#er-ara .bx{max-height:calc(100vh - 16px)}#er-ara .kb{display:none}}`;
    D.head.appendChild(s);
  }
  const KAT = ['Tümü', 'Cephe', 'Hesaplama', 'Rehber', 'Terim', 'Araç', 'Eğitim', 'Komutlar', 'Oyun', 'Dil kulübü'];
  function kur() {
    if (dlg) return dlg; stil();
    dlg = D.createElement('div'); dlg.id = 'er-ara'; dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Sitede ara');
    dlg.innerHTML = `<div class="bx"><div class="hd"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input type="search" id="er-ara-q" placeholder="${en ? 'Search tools, courses, games…' : 'Araç, eğitim, oyun ara…'}" autocomplete="off" spellcheck="false" enterkeyhint="go" aria-controls="er-ara-l"><kbd class="kb">Esc</kbd><button class="x" type="button" aria-label="Kapat">×</button></div>
      <div class="ch">${KAT.map((k, i) => `<button type="button" data-k="${i ? k : ''}"${i ? '' : ' class="on"'}>${k}</button>`).join('')}</div>
      <ul id="er-ara-l" role="listbox"></ul>
      <div class="ft"><span class="kb">↑↓ seç · Enter aç · Ctrl+K</span><span><a href="/yenilikler.html">Yenilikler</a> · <a href="/Tools.html">Tüm araçlar</a> · <a href="/feed.xml">RSS</a></span></div></div>`;
    D.body.appendChild(dlg);
    const q = dlg.querySelector('input');
    dlg.addEventListener('mousedown', e => { if (e.target === dlg) kapat(); });
    dlg.querySelector('.x').onclick = kapat;
    dlg.querySelectorAll('.ch button').forEach(b => b.onclick = () => { tur = b.dataset.k; dlg.querySelectorAll('.ch button').forEach(x => x.classList.toggle('on', x === b)); ara(); q.focus(); });
    q.addEventListener('input', () => { sec = 0; ara(); });
    q.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = son.length; if (n) { sec = (sec + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; isaret(); } }
      else if (e.key === 'Enter') { e.preventDefault(); const a = dlg.querySelectorAll('li a')[sec]; if (a) git(a.getAttribute('href'), e.ctrlKey || e.metaKey); }
      else if (e.key === 'Escape') { e.preventDefault(); kapat(); }
    });
    return dlg;
  }
  const git = (u, yeni) => { if (yeni) window.open(u, '_blank'); else { kapat(); location.href = u; } };
  function isaret() { const L = dlg.querySelectorAll('li a'); L.forEach((a, i) => a.classList.toggle('on', i === sec)); const a = L[sec]; if (a) a.scrollIntoView({ block: 'nearest' }); }
  const satir = (x, kel) => `<li><a href="${esc(x.u)}" role="option"><span class="c">${esc(x.c)}</span><span class="y"><b>${isaretle(x.t, kel)}</b>${x.d ? `<small>${esc(x.d)}</small>` : ''}</span></a></li>`;
  async function ara() {
    const ul = dlg.querySelector('ul'), ham = dlg.querySelector('input').value, kel = norm(ham).split(/[^a-z0-9+#.]+/).filter(Boolean);
    let L;
    try { L = await yukle(); } catch (e) { ul.innerHTML = `<li class="bos">Arama dizini yüklenemedi. İnternet bağlantını kontrol et.</li>`; son = []; return; }
    if (dlg.querySelector('input').value !== ham) return;
    if (!kel.length) {
      const Y = (await yeniler()).slice(0, 7), k = tur ? L.filter(x => x.c === tur).slice(0, 40) : [];
      son = tur ? k : Y;
      ul.innerHTML = tur ? `<li class="bs">${esc(tur)} · ${L.filter(x => x.c === tur).length}</li>` + k.map(x => satir(x, [])).join('')
        : (Y.length ? `<li class="bs">Son eklenenler</li>` + Y.map(y => `<li><a href="${esc(y.u)}"><span class="c">${y.d.slice(8, 10)}.${y.d.slice(5, 7)}</span><span class="y"><b>${esc(y.t)}</b></span></a></li>`).join('') + `<li><a href="/yenilikler.html"><span class="c">→</span><span class="y"><b>Tüm yenilikler</b></span></a></li>` : '<li class="bos">Aramak için yaz.</li>');
      if (!tur && Y.length) son = Y.concat([{}]);
      sec = 0; isaret(); return;
    }
    son = L.filter(x => !tur || x.c === tur).map(x => [puan(x, kel), x]).filter(a => a[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 40).map(a => a[1]);
    ul.innerHTML = son.length ? son.map(x => satir(x, kel)).join('') : `<li class="bos">“${esc(ham)}” için sonuç yok.${tur ? ' Kategori filtresini kaldırmayı dene.' : ''}</li>`;
    if (sec >= son.length) sec = 0; isaret();
  }
  let onceki = null;
  function ac(q) {
    kur(); onceki = D.activeElement; dlg.hidden = false; D.documentElement.style.overflow = 'hidden';
    const i = dlg.querySelector('input'); if (q != null) i.value = q; i.focus(); i.select(); sec = 0; ara();
  }
  function kapat() { if (!dlg || dlg.hidden) return; dlg.hidden = true; D.documentElement.style.overflow = ''; try { onceki && onceki.focus && onceki.focus(); } catch (e) { } }
  window.erArama = { ac, kapat };

  D.addEventListener('keydown', e => {
    if (dlg && !dlg.hidden) { if (e.key === 'Escape') { e.preventDefault(); kapat(); } return; }
    if (KONSOL) return;   /* Konsol'da klavye öykünücülere ve kabuğa ait */
    const t = e.target, alan = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) { if (TOOLS) return; e.preventDefault(); ac(); return; }
    if (e.key === '/' && !alan && !e.ctrlKey && !e.metaKey && !e.altKey && !TOOLS) { e.preventDefault(); ac(); }
  }, true);

  /* üst çubuğa arama düğmesi */
  function dugme() {
    if (D.querySelector('.er-ara-btn')) return;
    const mb = D.getElementById('modeBtn'), bar = D.querySelector('.topbar');
    if (!bar) return;
    /* dar ekranda üst çubuk taşmasın: yol bilgisi kısalır, düğmeler sığar */
    if (!D.getElementById('er-ust-css')) { const st = D.createElement('style'); st.id = 'er-ust-css'; st.textContent = '.topbar .crumb{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 1 auto}.topbar .brand{flex-shrink:0}.topbar .tb{flex-shrink:0}@media (max-width:420px){.topbar .wrap{gap:6px}.topbar .crumb{display:none}.topbar .tb{padding-left:7px;padding-right:7px}.topbar .brand~.sp~a.tb[href="./"],.topbar .brand~.sp~a.tb[href="/"],.topbar .brand~.sp~a.tb[href="../"]{display:none}}'; D.head.appendChild(st); }
    const b = D.createElement('button'); b.type = 'button';
    b.className = (mb ? mb.className : 'tb') + ' er-ara-btn'; b.title = 'Sitede ara (Ctrl+K)'; b.setAttribute('aria-label', 'Sitede ara');
    b.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="vertical-align:-2px"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
    b.onclick = () => ac();
    if (mb && mb.parentNode && bar.contains(mb)) mb.parentNode.insertBefore(b, mb); else { const w = bar.querySelector('.top-actions') || bar.querySelector('.wrap') || bar; w.appendChild(b); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', dugme); else dugme();

  /* ---------------- durum çubuğu: fare konumu (sadece fareli cihazlarda) ---------------- */
  (function () {
    if (window.top !== window || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    let kapali = false; try { kapali = localStorage.getItem('erdevelop-durum') === '0'; } catch (e) { }
    /* artı imleç (AutoCAD gibi): varsayılan açık; bağlantı, düğme ve yazı kutularında normal imleç kalır */
    let arti = true; try { arti = localStorage.getItem('erdevelop-arti') !== '0'; } catch (e) { }
    const artiUygula = () => { D.documentElement.classList.toggle('er-arti', arti); const b = bar && bar.querySelector('[data-arti]'); if (b) { b.classList.toggle('on', arti); b.title = arti ? t('Artı imleci kapat', 'Turn off crosshair cursor') : t('Artı imleci aç', 'Turn on crosshair cursor'); } };
    const st = D.createElement('style');
    st.textContent = '#er-durum{position:fixed;left:0;right:0;bottom:0;z-index:2147482000;height:22px;display:flex;align-items:center;gap:14px;padding:0 10px;font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.02em;color:#c9d3e0;background:rgba(14,18,26,.82);border-top:1px solid rgba(127,127,127,.28);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);pointer-events:none;user-select:none;font-variant-numeric:tabular-nums}'
      + '#er-durum b{color:#fff;font-weight:600;display:inline-block;min-width:4ch}#er-durum .sp{flex:1}#er-durum .bo{opacity:.6}'
      + '#er-durum button{all:unset;pointer-events:auto;cursor:pointer;padding:0 4px;opacity:.6;font:inherit;color:inherit}#er-durum button:hover{opacity:1}'
      + '#er-durum-ac{all:unset;position:fixed;right:6px;bottom:6px;z-index:2147482000;cursor:pointer;font:600 10px/1 ui-monospace,Consolas,monospace;padding:4px 6px;border-radius:5px;color:#c9d3e0;background:rgba(14,18,26,.6);opacity:.45}#er-durum-ac:hover{opacity:1}'
      + 'html.er-arti,html.er-arti body{cursor:url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'23\' height=\'23\'><g fill=\'none\' stroke-linecap=\'square\'><path d=\'M11.5 1.5v20M1.5 11.5h20M9 9h5v5H9z\' stroke=\'%23fff\' stroke-width=\'3\'/><path d=\'M11.5 1.5v8M11.5 13.5v8M1.5 11.5h8M13.5 11.5h8M9.5 9.5h4v4h-4z\' stroke=\'%23e0115f\' stroke-width=\'1\'/></g></svg>") 11 11, crosshair}'
      + ':where(html.er-arti) :where(a[href],button,select,summary,label[for],[role=button],[role=tab],[onclick],input[type=button],input[type=submit],input[type=checkbox],input[type=radio],input[type=range],input[type=color],input[type=file]){cursor:pointer}'
      + ':where(html.er-arti) :where(input:not([type]),input[type=text],input[type=search],input[type=number],input[type=email],input[type=url],input[type=password],input[type=tel],textarea,[contenteditable=""],[contenteditable=true]){cursor:text}'
      + '#er-durum button.on{opacity:1;color:#ff5c8a}'
      + 'body.er-durumlu [data-dil-btn][style*="position:fixed"]{bottom:30px!important}@media print{#er-durum,#er-durum-ac{display:none!important}}';
    let bar = null, ac = null, x = 0, y = 0, px = 0, py = 0, bekliyor = false;
    const t = (tr, e) => (D.documentElement.lang || '').startsWith('en') ? e : tr;
    function yaz() {
      bekliyor = false; if (!bar) return;
      bar.querySelector('[data-k=x]').textContent = x; bar.querySelector('[data-k=y]').textContent = y;
      bar.querySelector('[data-k=s]').textContent = px + ', ' + py;
      bar.querySelector('[data-k=l]').textContent = t('sayfa', 'page');
      bar.querySelector('[data-k=w]').textContent = innerWidth + '×' + innerHeight;
    }
    function goster() {
      if (ac) { ac.remove(); ac = null; }
      bar = D.createElement('div'); bar.id = 'er-durum'; bar.setAttribute('aria-hidden', 'true');
      bar.innerHTML = '<span>x <b data-k="x">–</b></span><span>y <b data-k="y">–</b></span><span class="bo"><span data-k="l"></span> <span data-k="s">–</span></span><span class="sp"></span><span class="bo" data-k="w"></span><button type="button" data-arti>+</button><button type="button" data-kapat title="' + t('Durum çubuğunu gizle', 'Hide status bar') + '">×</button>';
      bar.querySelector('[data-arti]').onclick = () => { arti = !arti; try { localStorage.setItem('erdevelop-arti', arti ? '1' : '0'); } catch (e) { } artiUygula(); };
      bar.querySelector('[data-kapat]').onclick = () => { try { localStorage.setItem('erdevelop-durum', '0'); } catch (e) { } kapat(); };
      D.body.appendChild(bar); D.body.classList.add('er-durumlu'); yaz(); artiUygula();
    }
    function kapat() {
      if (bar) { bar.remove(); bar = null; } D.body.classList.remove('er-durumlu');
      ac = D.createElement('button'); ac.id = 'er-durum-ac'; ac.type = 'button'; ac.textContent = 'x,y'; ac.title = t('Durum çubuğunu göster', 'Show status bar');
      ac.onclick = () => { try { localStorage.removeItem('erdevelop-durum'); } catch (e) { } goster(); };
      D.body.appendChild(ac);
    }
    addEventListener('mousemove', e => { x = Math.round(e.clientX); y = Math.round(e.clientY); px = Math.round(e.pageX); py = Math.round(e.pageY); if (bar && !bekliyor) { bekliyor = true; requestAnimationFrame(yaz); } }, { passive: true });
    addEventListener('resize', () => { if (bar && !bekliyor) { bekliyor = true; requestAnimationFrame(yaz); } });
    const kur = () => { D.head.appendChild(st); kapali ? kapat() : goster(); artiUygula(); };
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', kur); else kur();
  })();

  /* ---------------- site istatistiği: anonim sayfa kaydı (Firestore, kimlik/IP yok) ----------------
     Her sayfa açılışında bir kayıt (ist_olay): sayfa, nereden gelindiği, cihaz türü, tarayıcı, sistem, dil, saat dilimi,
     ekran genişliği ve tarayıcıda tutulan rastgele ziyaretçi/oturum kodu. Sayfa görünür kaldıkça kalma süresi güncellenir.
     Hesabım > "bu tarayıcıyı sayma" (skipgc) açıksa hiçbir şey gönderilmez. Panel: /ozelaraclar/istatistik.html */
  (function () {
    if (location.hostname !== 'erdevelop.github.io' || navigator.webdriver || /^\/ozelaraclar\/istatistik/.test(location.pathname)) return;
    try { if (localStorage.getItem('skipgc') === 't') return; } catch (e) { return; }
    if (!window.fetch || !window.crypto || !crypto.getRandomValues) return;
    const PRJ = 'oyun-bahcesi-62633', KEY = 'AIzaSyBtNow8j7AZQO2sWCiXb1WbOT261wJUGRU';
    const AD = `projects/${PRJ}/databases/(default)/documents/ist_olay/`;
    const URL_ = `https://firestore.googleapis.com/v1/projects/${PRJ}/databases/(default)/documents:commit?key=${KEY}`;
    const rid = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), x => 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36]).join('');
    let v = '', o = null, k = 1, yeni = false;
    try {
      v = localStorage.getItem('erdevelop-zid') || ''; if (!/^[a-z0-9]{12}$/.test(v)) { v = rid(12); localStorage.setItem('erdevelop-zid', v); yeni = true; }
      k = +localStorage.getItem('erdevelop-zk') || 0;
      o = JSON.parse(localStorage.getItem('erdevelop-zot') || 'null');
      if (!o || !o.id || Date.now() - o.son > 30 * 60 * 1000) { o = { id: rid(10), n: 0 }; k++; localStorage.setItem('erdevelop-zk', k); }
      o.n = (o.n || 0) + 1; o.son = Date.now(); localStorage.setItem('erdevelop-zot', JSON.stringify(o));
    } catch (e) { return; }
    const ua = navigator.userAgent, coarse = matchMedia('(pointer:coarse)').matches, sw = screen.width || innerWidth;
    const b = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /YaBrowser/.test(ua) ? 'Yandex' : /Firefox\/|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Diğer';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPod/.test(ua) ? 'iOS' : /iPad/.test(ua) || (/Mac OS X/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPadOS' : /Mac OS X/.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : 'Diğer';
    const d = coarse && Math.min(sw, screen.height || sw) < 600 ? 'telefon' : coarse ? 'tablet' : 'masaüstü';
    let r = ''; try { const q = new URLSearchParams(location.search); r = q.get('utm_source') || q.get('ref') || ''; if (!r && document.referrer) { const h = new URL(document.referrer).hostname; if (h !== location.hostname) r = h.replace(/^www\./, ''); } } catch (e) { }
    let p = location.pathname.replace(/\/index\.html$/, '/') || '/';
    const S = x => ({ stringValue: String(x == null ? '' : x).slice(0, 160) }), I = x => ({ integerValue: String(Math.max(0, Math.round(+x || 0))) });
    const id = rid(20);
    const yolla = (yazim, canli) => fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ writes: [yazim] }), keepalive: !!canli }).then(x => x.ok);
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
    let olustu = null, sn = 0, gonderilen = 0, gorunur = document.visibilityState === 'visible', bas = gorunur ? Date.now() : 0, zaman = 0;
    const sure = () => sn + (gorunur && bas ? (Date.now() - bas) / 1000 : 0);
    function olustur() {
      olustu = yolla({
        update: { name: AD + id, fields: { v: S(v), s: S(o.id), p: S(p), ti: S((document.title || '').trim()), r: S(r), d: S(d), b: S(b), os: S(os), l: S(navigator.language || ''), tz: S(tz), w: I(sw), k: I(k), n: I(o.n), yeni: { booleanValue: yeni }, sn: I(0) } },
        currentDocument: { exists: false }, updateTransforms: [{ fieldPath: 't', setToServerValue: 'REQUEST_TIME' }, { fieldPath: 'son', setToServerValue: 'REQUEST_TIME' }]
      }).catch(() => false);
      olustu.then(ok => { if (ok) planla(); });
    }
    function guncelle(canli) {
      const x = Math.min(21600, Math.round(sure())); if (!olustu || x - gonderilen < 3) return;
      olustu.then(ok => { if (!ok) return; gonderilen = x;
        yolla({ update: { name: AD + id, fields: { sn: I(x) } }, updateMask: { fieldPaths: ['sn'] }, currentDocument: { exists: true }, updateTransforms: [{ fieldPath: 'son', setToServerValue: 'REQUEST_TIME' }] }, canli).catch(() => { });
      });
    }
    /* görünürken 15 sn, 45 sn, sonra dakikada bir; 30 dk'dan sonra durur (ücretsiz kotayı korur) */
    function planla() { clearTimeout(zaman); if (!gorunur || sure() > 1800) return; const s = sure(); zaman = setTimeout(() => { guncelle(false); planla(); }, (s < 15 ? 15 - s : s < 45 ? 45 - s : 60) * 1000 + 200); }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { if (gorunur && bas) sn += (Date.now() - bas) / 1000; gorunur = false; bas = 0; clearTimeout(zaman); guncelle(true); }
      else { gorunur = true; bas = Date.now(); try { o.son = Date.now(); localStorage.setItem('erdevelop-zot', JSON.stringify(o)); } catch (e) { } planla(); }
    });
    addEventListener('pagehide', () => { if (gorunur && bas) { sn += (Date.now() - bas) / 1000; bas = Date.now(); } guncelle(true); });
    setTimeout(olustur, 600);
  })();

  /* ---------------- cihazlar arası senkron (hesapta açıldıysa) ---------------- */
  let acik = false; try { acik = localStorage.getItem('erdevelop-sync') === '1'; } catch (e) { }
  /* kendi Firebase yüklemesi olan sayfalar: hesap sayfası senkronu kendisi yapar */
  const KENDI = /\/(hesap\.html|oyunlar\/|sohbet\/|(ingilizce|fransizca|almanca)\.html)/;
  if (!acik || KENDI.test(yol) || location.protocol !== 'https:' && !/^(localhost|127\.)/.test(location.hostname)) return;
  const FB = { apiKey: 'AIzaSyBtNow8j7AZQO2sWCiXb1WbOT261wJUGRU', authDomain: 'oyun-bahcesi-62633.firebaseapp.com', projectId: 'oyun-bahcesi-62633', storageBucket: 'oyun-bahcesi-62633.firebasestorage.app', messagingSenderId: '591926138614', appId: '1:591926138614:web:24101e1be195ebc04c3ed7' };
  const V = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const yukleJs = src => new Promise((res, rej) => { const s = D.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; D.head.appendChild(s); });
  const bekle = ms => new Promise(r => setTimeout(r, ms));
  let hazir = null;
  async function fb() {
    if (D.querySelector('script[src*="firebasejs"]') && !(window.firebase && firebase.apps && firebase.apps.length)) { for (let i = 0; i < 40 && !(window.firebase && firebase.apps && firebase.apps.length); i++) await bekle(500); }
    if (!window.firebase) await yukleJs(V + 'firebase-app-compat.js');
    for (const n of ['auth', 'firestore']) if (!firebase[n]) await yukleJs(V + `firebase-${n}-compat.js`);
    if (!firebase.apps.length) firebase.initializeApp(FB);
    if (!window.erSenkron) await yukleJs('/js/senkron.js');
    const auth = firebase.auth(); const u = await new Promise(r => { const off = auth.onAuthStateChanged(x => { off(); r(x); }); });
    return u ? { db: firebase.firestore(), uid: u.uid } : null;
  }
  async function esitle(zorla) {
    let s = 0; try { s = +localStorage.getItem('erdevelop-sync-son') || 0; } catch (e) { }
    if (!zorla && Date.now() - s < 5 * 60 * 1000) return;
    try { hazir = hazir || fb(); const h = await hazir; if (!h) return; const r = await erSenkron.calistir(h.db, h.uid); if (r.alinan) console.info('[senkron] diğer cihazdan alınan kayıt:', r.alinan); }
    catch (e) { hazir = null; console.warn('[senkron]', e && (e.code || e.message) || e); }
  }
  const basla = () => setTimeout(() => esitle(false), 4000);
  if (D.readyState === 'complete') basla(); else addEventListener('load', basla);
  /* sayfadan ayrılırken, Firebase zaten yüklüyse son değişiklikleri gönder */
  D.addEventListener('visibilitychange', () => { if (D.visibilityState === 'hidden' && hazir) esitle(true); });
})();
