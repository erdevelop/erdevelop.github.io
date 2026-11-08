/* CODE sayfası · Defter (Jupyter benzeri hücreler)
   Projedeki .ipynb dosyası açıkken editör yerine hücre görünümü gösterilir.
   Hücreler dilin komut satırı (REPL) ortamında çalışır: değişkenler hücreler ve ana kod arasında ortaktır.
   Dosya biçimi nbformat 4: Jupyter / VS Code / Colab ile açılabilir. */
(() => {
  let K = null, file = null, lang = null, cells = [], saveT = null, counter = 0, running = false, stopAll = false;
  const root = () => document.getElementById('nb');
  const KERNEL = {
    python: ['python3', 'Python 3 (Pyodide)', 'python'], javascript: ['javascript', 'JavaScript', 'javascript'], typescript: ['typescript', 'TypeScript', 'typescript'],
    sql: ['sqlite', 'SQLite', 'sql'], r: ['ir', 'R (webR)', 'R'], lua: ['lua', 'Lua', 'lua'], ruby: ['ruby', 'Ruby', 'ruby'], php: ['php', 'PHP', 'php'],
    prolog: ['prolog', 'Prolog', 'prolog'], scheme: ['scheme', 'Scheme', 'scheme']
  };
  const SAMPLE = {
    python: [['markdown', '# Defter\nHücreleri **Shift+Enter** ile sırayla çalıştır. Değişkenler hücreler arasında korunur.'], ['code', 'import math\nr = 1.2  # m\nalan = math.pi * r ** 2\nalan'], ['code', 'print(f"Daire alanı: {alan:.3f} m²")']],
    javascript: [['markdown', '# Defter\nHücreleri **Shift+Enter** ile çalıştır.'], ['code', 'const paneller = [1200, 1500, 900]'], ['code', 'paneller.reduce((a, b) => a + b, 0)']],
    sql: [['markdown', '# SQL defteri'], ['code', 'CREATE TABLE t(ad TEXT, kg REAL);\nINSERT INTO t VALUES (\'P1\', 72.5), (\'P2\', 135);'], ['code', 'SELECT * FROM t ORDER BY kg DESC;']],
    r: [['markdown', '# R defteri'], ['code', 'x <- c(3, 7, 4, 9)\nmean(x)'], ['code', 'summary(x)']],
    typescript: [['markdown', '# TypeScript defteri'], ['code', 'let boylar: number[] = [3200, 2950, 1180]'], ['code', 'boylar.map(b => b / 1000)']],
    lua: [['markdown', '# Lua defteri\nGlobal değişkenler hücreler arasında korunur (`local` olanlar değil).'], ['code', 'kg = { 72.5, 135, 41 }'], ['code', 'local t = 0\nfor _, v in ipairs(kg) do t = t + v end\nprint("toplam", t)']],
    ruby: [['markdown', '# Ruby defteri'], ['code', 'paneller = { "P1" => 72.5, "P2" => 135 }'], ['code', 'paneller.max_by { |_, kg| kg }']],
    php: [['markdown', '# PHP defteri\nPHP’de her hücre ayrı çalışır; değişkenler taşınmaz.'], ['code', 'array_sum([72.5, 135, 41])'], ['code', 'strtoupper("cephe")']],
    prolog: [['markdown', '# Prolog defteri\nHer hücre yüklü programa bir sorgudur. Kural eklemek için `assertz` kullan.'], ['code', "assertz(panel(p1, 72)), assertz(panel(p2, 135))"], ['code', 'panel(P, Kg), Kg > 100']],
    scheme: [['markdown', '# Scheme defteri'], ['code', '(define (kare x) (* x x))'], ['code', '(map kare (list 1 2 3 4))']]
  };
  const src = c => Array.isArray(c.source) ? c.source.join('') : (c.source || '');
  const lines = s => s.split(/(?<=\n)/);

  function parse(text) {
    try { const j = JSON.parse(text || '{}'); return (j.cells || []).map(c => ({ t: c.cell_type === 'markdown' ? 'md' : c.cell_type === 'raw' ? 'md' : 'code', s: src(c) })); }
    catch (e) { return null; }
  }
  function serialize(withOut) {
    const k = KERNEL[lang] || [lang, lang, lang];
    return JSON.stringify({
      nbformat: 4, nbformat_minor: 5,
      metadata: { kernelspec: { name: k[0], display_name: k[1], language: k[2] }, language_info: { name: k[2] }, erdevelop: { dil: lang } },
      cells: cells.map((c, i) => c.t === 'md'
        ? { cell_type: 'markdown', id: 'h' + i, metadata: {}, source: lines(c.s) }
        : { cell_type: 'code', id: 'h' + i, metadata: {}, execution_count: withOut ? (c.n || null) : null, source: lines(c.s), outputs: withOut ? outputsOf(c) : [] })
    }, null, 1);
  }
  function outputsOf(c) {
    if (!c.out) return [];
    const o = [], txt = c.out.el.innerText.trim();
    if (txt) o.push({ output_type: 'stream', name: 'stdout', text: lines(txt + '\n') });
    c.out.el.querySelectorAll('img').forEach(im => { const m = im.src.match(/^data:image\/png;base64,(.*)$/); if (m) o.push({ output_type: 'display_data', metadata: {}, data: { 'image/png': m[1] } }); });
    return o;
  }
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { if (!file) return; file.c = serialize(false); const w = K.getWs(lang); w.dirty = true; K.saveWs(lang); }, 400);
  }

  /* ---------- görünüm ---------- */
  function render() {
    const r = root(); r.innerHTML = '';
    const bar = document.createElement('div'); bar.className = 'nbbar';
    bar.innerHTML = `<button type="button" class="mini" data-a="all" title="Tüm kod hücrelerini sırayla çalıştır">▶ Tümünü çalıştır</button>
      <button type="button" class="mini" data-a="restart" title="Ortamı sıfırla ve tümünü çalıştır">↻ Sıfırla + çalıştır</button>
      <button type="button" class="mini" data-a="clear">Çıktıları temizle</button>
      <span class="sp"></span>
      <button type="button" class="mini" data-a="code">+ Kod</button><button type="button" class="mini" data-a="md">+ Metin</button>
      <button type="button" class="mini" data-a="dl" title=".ipynb olarak indir (çıktılarla)">⇩ ipynb</button>`;
    bar.onclick = e => { const b = e.target.closest('button[data-a]'); if (b) act(b.dataset.a); };
    r.appendChild(bar);
    const list = document.createElement('div'); list.className = 'nbcells'; r.appendChild(list);
    cells.forEach((c, i) => list.appendChild(cellEl(c, i)));
    const add = document.createElement('div'); add.className = 'nbadd';
    add.innerHTML = '<button type="button" class="mini" data-a="code">+ Kod hücresi</button><button type="button" class="mini" data-a="md">+ Metin hücresi</button>';
    add.onclick = e => { const b = e.target.closest('button[data-a]'); if (b) act(b.dataset.a); };
    r.appendChild(add);
  }
  function cellEl(c, i) {
    const el = document.createElement('div'); el.className = 'cell ' + c.t; c.el = el;
    const side = document.createElement('div'); side.className = 'cside';
    side.innerHTML = c.t === 'code' ? `<button type="button" class="crun" title="Çalıştır (Shift+Enter)">▶</button><span class="cnum">[${c.n || ' '}]</span>` : '<span class="cnum">¶</span>';
    side.querySelector('.crun') && (side.querySelector('.crun').onclick = () => runCell(c));
    const body = document.createElement('div'); body.className = 'cbody';
    const tools = document.createElement('div'); tools.className = 'ctools';
    tools.innerHTML = '<button type="button" data-t="up" title="Yukarı">↑</button><button type="button" data-t="down" title="Aşağı">↓</button><button type="button" data-t="type" title="Kod / metin">' + (c.t === 'code' ? 'M↓' : '{ }') + '</button><button type="button" data-t="below" title="Altına hücre ekle">+</button><button type="button" data-t="del" title="Sil">×</button>';
    tools.onclick = e => { const b = e.target.closest('button[data-t]'); if (b) cellTool(c, b.dataset.t); };
    const ed = document.createElement('div'); ed.className = 'ced';
    body.append(tools, ed);
    if (c.t === 'md') { const v = document.createElement('div'); v.className = 'mdv'; body.appendChild(v); c.view = v; v.ondblclick = () => editMd(c, true); }
    const out = document.createElement('div'); out.className = 'con cout'; body.appendChild(out);
    c.out = new K.Con(out); if (c.saved) { out.innerHTML = c.saved; c.saved = null; }
    el.append(side, body);
    c.cm = CodeMirror(ed, {
      value: c.s, mode: c.t === 'md' ? 'markdown' : K.L[lang].mode, lineNumbers: false, viewportMargin: Infinity, lineWrapping: c.t === 'md',
      indentUnit: K.L[lang].indent, tabSize: 4, autoCloseBrackets: true, matchBrackets: true, keyMap: K.cm.getOption('keyMap'),
      extraKeys: {
        'Shift-Enter': () => { runCell(c, true); }, 'Ctrl-Enter': () => { runCell(c); }, 'Cmd-Enter': () => { runCell(c); },
        'Ctrl-Space': cm => K.hint(cm, true), 'Ctrl-/': 'toggleComment', 'Alt-Up': () => cellTool(c, 'up'), 'Alt-Down': () => cellTool(c, 'down'),
        Esc: cm => cm.getInputField().blur(),
        Tab: cm => cm.somethingSelected() ? cm.indentSelection('add') : cm.replaceSelection(' '.repeat(cm.getOption('indentUnit')), 'end')
      }
    });
    c.cm.on('change', () => { c.s = c.cm.getValue(); persist(); });
    c.cm.on('focus', () => { document.querySelectorAll('.cell.sel').forEach(x => x.classList.remove('sel')); el.classList.add('sel'); });
    c.cm.on('blur', () => { if (c.t === 'md' && c.s.trim()) setTimeout(() => { if (!c.cm.hasFocus()) editMd(c, false); }, 120); });
    if (c.t === 'md') editMd(c, !c.s.trim());
    return el;
  }
  async function editMd(c, on) {
    const ed = c.el.querySelector('.ced');
    if (on) { ed.hidden = false; c.view.hidden = true; c.cm.refresh(); c.cm.focus(); return; }
    ed.hidden = true; c.view.hidden = false;
    if (!window.marked) { try { await K.loadScript('https://cdn.jsdelivr.net/npm/marked@14.1.3/marked.min.js'); } catch (e) {} }
    c.view.innerHTML = window.marked ? window.marked.parse(c.s || '*boş metin — düzenlemek için çift tıkla*') : K.esc(c.s);
    c.view.querySelectorAll('script').forEach(s => s.remove());
  }
  function cellTool(c, t) {
    const i = cells.indexOf(c);
    if (t === 'del') { if (c.s.trim() && !confirm('Hücre silinsin mi?')) return; cells.splice(i, 1); }
    else if (t === 'up' && i > 0) { cells.splice(i, 1); cells.splice(i - 1, 0, c); }
    else if (t === 'down' && i < cells.length - 1) { cells.splice(i, 1); cells.splice(i + 1, 0, c); }
    else if (t === 'type') { c.t = c.t === 'code' ? 'md' : 'code'; c.out = null; }
    else if (t === 'below') { const n = { t: 'code', s: '' }; cells.splice(i + 1, 0, n); keep(); render(); n.cm.focus(); persist(); return; }
    else return;
    keep(); render(); persist();
    const f = cells[Math.min(i, cells.length - 1)]; if (f && f.cm && t !== 'del') f.cm.focus();
  }
  function keep() { cells.forEach(c => { if (c.out && c.out.el) c.saved = c.out.el.innerHTML; }); }

  /* ---------- çalıştırma ---------- */
  async function runCell(c, advance) {
    if (c.t === 'md') { editMd(c, false); return next(c, advance); }
    const R = K.L[lang];
    if (!R.repl) return K.toast(R.name + ' için hücre çalıştırma yok');
    if (K.busy[lang]) return K.toast('önceki hücre bitmeden çalıştırılamaz');
    c.out.clear(); c.el.classList.add('running'); c.el.querySelector('.cnum').textContent = '[*]';
    let ok = true;
    await K.exec(lang, async (con, st) => { st('hücre çalışıyor…'); await R.repl(c.s, con, st); con.end(); }, { c: c.out, rethrow: true }).catch(() => { ok = false; });
    c.n = ++counter; c.el.classList.remove('running'); c.el.classList.toggle('bad', !ok);
    c.el.querySelector('.cnum').textContent = `[${c.n}]`;
    if (!c.out.el.childNodes.length) c.out.el.hidden = true; else c.out.el.hidden = false;
    next(c, advance);
    return ok;
  }
  function next(c, advance) {
    if (!advance) return;
    const i = cells.indexOf(c);
    if (i === cells.length - 1) { const n = { t: 'code', s: '' }; cells.push(n); keep(); render(); n.cm.focus(); persist(); }
    else cells[i + 1].cm.focus();
  }
  async function runAll() {
    if (running) return; running = true; stopAll = false;
    try { for (const c of cells) { if (stopAll) break; if (c.t !== 'code') { if (c.t === 'md') editMd(c, false); continue; } if (!c.s.trim()) continue; const ok = await runCell(c); if (!ok) break; } }
    finally { running = false; }
  }
  async function act(a) {
    if (a === 'all') runAll();
    else if (a === 'restart') {
      const R = K.L[lang];
      if (R.halt) R.halt();
      if (lang === 'sql' && R.db) { R.db.close(); R.db = null; }
      if (lang === 'lua' && R.eng) { R.eng.global.close(); R.eng = null; }
      if (lang === 'prolog') R.s = null;
      counter = 0; cells.forEach(c => { if (c.out) c.out.clear(); c.n = null; }); render();
      K.toast('ortam sıfırlandı'); runAll();
    }
    else if (a === 'clear') { cells.forEach(c => { if (c.out) { c.out.clear(); c.out.el.hidden = true; } c.n = null; }); counter = 0; render(); }
    else if (a === 'code' || a === 'md') { const n = { t: a, s: '' }; cells.push(n); keep(); render(); n.cm.focus(); if (a === 'md') editMd(n, true); persist(); }
    else if (a === 'dl') { K.dlBlob((file.n || 'defter.ipynb'), new Blob([serialize(true)], { type: 'application/x-ipynb+json' })); K.toast('defter indirildi (Jupyter / VS Code / Colab ile açılır)'); }
  }

  window.__nb = {
    init(core) { K = core; },
    blank(l) { lang = l; cells = (SAMPLE[l] || [['markdown', '# Defter'], ['code', '']]).map(([t, s]) => ({ t: t === 'markdown' ? 'md' : 'code', s })); return serialize(false); },
    show(f, l) {
      if (!K) return; // sayfa açılırken: init sonrası yeniden çağrılır
      if (file === f && lang === l && root().childNodes.length) return;
      file = f; lang = l; counter = 0;
      const p = parse(f.c);
      if (!p) { root().innerHTML = '<div class="nbbad">Bu .ipynb dosyası okunamadı (geçerli JSON değil).</div>'; return; }
      cells = p.length ? p : [{ t: 'code', s: '' }];
      render();
    },
    hide() { if (file) { keep(); } },
    runAll() { runAll(); },
    stop() { stopAll = true; }
  };
})();
