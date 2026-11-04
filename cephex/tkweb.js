/* tkweb.js — webtk.py için DOM tarafı. Her widget bir DOM düğümüdür (data-wid). */
(function () {
'use strict';
const W = new Map();          // id -> {id, cls, el, box, parent, kids:[], mgr, g, opts, ...}
const T = {};                 // TkWeb
window.TkWeb = T;
const rootEl = document.getElementById('tk-root');
let focusedId = 0;
const downloads = new Map();
const styles = {};            // style adı -> {cfg, map}
const styleEl = document.createElement('style'); document.head.appendChild(styleEl);
const dlg = (f) => { try { return f(); } catch (e) { console.error(e); } };

/* ---------------- yardımcılar */
const GRAY = (n) => { const v = Math.round(255 * n / 100); return `rgb(${v},${v},${v})`; };
function color(c) {
  if (!c) return '';
  c = String(c);
  let m = c.match(/^gr[ae]y(\d+)$/i); if (m) return GRAY(+m[1]);
  if (/^system/i.test(c)) return { systemButtonFace: '#f0f0f0', systemWindow: '#fff', systemWindowText: '#000' }[c] || '#f0f0f0';
  return c;
}
function fontCss(f) {
  if (!f) return null;
  let fam = 'Segoe UI', size = 9, wt = 'normal', st = 'normal';
  if (typeof f === 'string') { try { f = JSON.parse(f); } catch (e) { f = f.split(' '); } }
  if (Array.isArray(f)) {
    fam = f[0] || fam; if (f[1] !== undefined) size = +f[1] || 9;
    const rest = f.slice(2).join(' ');
    if (/bold/.test(rest)) wt = 'bold'; if (/italic/.test(rest)) st = 'italic';
  }
  const px = size < 0 ? -size : size * 96 / 72;
  return { css: `${st} ${wt} ${px.toFixed(1)}px "${fam}", "Segoe UI", Arial, sans-serif`, px };
}
const px = (v) => (v == null || v === '' ? '' : (isNaN(+v) ? String(v) : (+v) + 'px'));
function pad2(v) { if (Array.isArray(v)) return [+v[0] || 0, +(v.length > 1 ? v[1] : v[0]) || 0]; return [+v || 0, +v || 0]; }
const ctxM = document.createElement('canvas').getContext('2d');
function measure(font, text) { const f = fontCss(font); ctxM.font = f ? f.css : '12px sans-serif'; return ctxM.measureText(text).width; }
function cssName(n) { return 'st-' + String(n).replace(/[^A-Za-z0-9]/g, '_'); }

/* ---------------- stil (ttk) */
function rebuildStyles() {
  let css = '';
  const prop = { background: 'background-color', foreground: 'color', bordercolor: 'border-color', font: 'font', borderwidth: 'border-width' };
  const addRule = (sel, cfg) => {
    let r = '';
    for (const k in cfg) {
      const v = cfg[k];
      if (k === 'font') { const f = fontCss(v); if (f) r += `font:${f.css};`; }
      else if (k === 'padding') { const p = Array.isArray(v) ? v : [v]; r += `padding:${p.map(px).join(' ')};`; }
      else if (k === 'fieldbackground') r += `--fieldbg:${color(v)};`;
      else if (k === 'selectbackground') r += `--selbg:${color(v)};`;
      else if (k === 'selectforeground') r += `--selfg:${color(v)};`;
      else if (k === 'troughcolor') r += `--trough:${color(v)};`;
      else if (k === 'arrowcolor') r += `--arrow:${color(v)};`;
      else if (prop[k]) r += `${prop[k]}:${/color|ground/.test(k) ? color(v) : v};`;
    }
    if (r) css += `${sel}{${r}}\n`;
  };
  for (const n in styles) {
    const s = styles[n];
    if (n === '.') { addRule('#tk-root, .tkw', s.cfg || {}); continue; }
    const cls = '.' + cssName(n);
    addRule(cls, s.cfg || {});
    if (s.cfg && s.cfg.fieldbackground) css += `${cls}{--fieldbg:${color(s.cfg.fieldbackground)}}\n`;
    const st = { active: ':hover', pressed: ':active', disabled: ':disabled,.disabled', selected: '.sel', readonly: ':read-only' };
    for (const opt in (s.map || {})) {
      for (const [state, val] of s.map[opt]) {
        const sel = st[state]; if (!sel) continue;
        const o = {}; o[opt] = val;
        addRule(cls + sel.split(',').map((x, i) => (i ? cls : '') + x).join(','), o);
      }
    }
  }
  styleEl.textContent = css;
  if (styles['.']) {
    const c = styles['.'].cfg || {};
    const r = document.documentElement.style;
    if (c.background) r.setProperty('--bg', color(c.background));
    if (c.foreground) r.setProperty('--fg', color(c.foreground));
    if (c.fieldbackground) r.setProperty('--fieldbg', color(c.fieldbackground));
    if (c.bordercolor) r.setProperty('--bd', color(c.bordercolor));
    if (c.selectbackground) r.setProperty('--selbg', color(c.selectbackground));
    if (c.selectforeground) r.setProperty('--selfg', color(c.selectforeground));
  }
}
T.style_cfg = (n, j) => { const s = styles[n] || (styles[n] = {}); s.cfg = Object.assign(s.cfg || {}, JSON.parse(j)); rebuildStyles(); applyHide(n); };
T.style_map = (n, j) => { const s = styles[n] || (styles[n] = {}); s.map = Object.assign(s.map || {}, JSON.parse(j)); rebuildStyles(); };
T.style_lookup = (n, o) => { const s = styles[n]; return (s && s.cfg && s.cfg[o]) || (styles['.'] && styles['.'].cfg && styles['.'].cfg[o]) || ''; };
function applyHide(n) { for (const w of W.values()) if (w.opts.style === n.replace(/\.TNotebook\.Tab$/, '.TNotebook') || w.opts.style === n) refresh(w); }

/* ---------------- widget oluşturma */
const TTK_DEFAULT = { Button: 'TButton', Label: 'TLabel', Entry: 'TEntry', Combobox: 'TCombobox', Frame: 'TFrame', LabelFrame: 'TLabelframe',
  Checkbutton: 'TCheckbutton', Radiobutton: 'TRadiobutton', Notebook: 'TNotebook', Treeview: 'Treeview', Scrollbar: 'TScrollbar' };

T.create = (id, cls, parentId, optJson) => {
  const opts = JSON.parse(optJson || '{}');
  const w = { id, cls, opts, kids: [], parent: parentId ? W.get(parentId) : null, mgr: null, g: {}, cols: {}, rows: {}, binds: new Set() };
  W.set(id, w);
  build(w);
  if (w.box) { w.box.dataset.wid = id; w.box.classList.add('tkw', 'w-' + cls); }
  if (w.parent) w.parent.kids.push(w);
  return id;
};

function mk(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

function build(w) {
  const o = w.opts, c = w.cls;
  let el;
  switch (c) {
    case 'Tk': el = rootEl; w.box = el; w.content = el; el.dataset.wid = 0; break;
    case 'Toplevel': {
      el = mk('div', 'tk-top'); const bar = mk('div', 'tk-topbar'); const t = mk('span'); const x = mk('button'); x.textContent = '✕';
      x.onclick = () => { if (w.kapatCb) T.pyCmd.call(null, w.id, 'close'); else destroyW(w); };
      bar.append(t, x); const body = mk('div', 'tk-topbody'); el.append(bar, body); w.title = t; w.content = body; w.box = el;
      document.body.appendChild(el);
      let dx, dy, drag = false;
      bar.onmousedown = (e) => { drag = true; dx = e.clientX - el.offsetLeft; dy = e.clientY - el.offsetTop; e.preventDefault(); };
      window.addEventListener('mousemove', (e) => { if (drag) { el.style.left = (e.clientX - dx) + 'px'; el.style.top = (e.clientY - dy) + 'px'; } });
      window.addEventListener('mouseup', () => { drag = false; });
      el.style.left = '120px'; el.style.top = '60px';
      break;
    }
    case 'Frame': el = mk('div', 'tk-frame'); w.content = el; w.box = el; break;
    case 'LabelFrame': { el = mk('fieldset', 'tk-lf'); const lg = mk('legend'); el.appendChild(lg); w.legend = lg; const b = mk('div', 'tk-lfbody'); el.appendChild(b); w.content = b; w.box = el; break; }
    case 'Label': el = mk('div', 'tk-label'); w.txt = mk('span'); el.appendChild(w.txt); w.box = el; break;
    case 'Button': el = mk('button', 'tk-button'); w.box = el; el.onclick = () => T.pyCmd.call(null, w.id, 'command'); break;
    case 'Checkbutton': case 'Radiobutton': {
      el = mk('label', 'tk-check'); const i = mk('input'); i.type = c === 'Checkbutton' ? 'checkbox' : 'radio'; w.inp = i;
      w.txt = mk('span'); el.append(i, w.txt); w.box = el;
      i.onchange = () => { T.pyCmd.call(null, w.id, c === 'Checkbutton' ? 'toggle' : 'value'); };
      i.onclick = (e) => { if (c === 'Checkbutton') { e.preventDefault(); T.pyCmd.call(null, w.id, 'toggle'); } else { T.pyCmd.call(null, w.id, 'value'); } };
      break;
    }
    case 'Entry': case 'Spinbox': { el = mk('input', 'tk-entry'); el.type = 'text'; w.inp = el; w.box = el; el.oninput = () => T.pyVar.call(null, w.id, el.value);
      el.onkeydown = (e) => { if (e.key === 'Enter') { /* Return bağı olay sisteminde */ } }; break; }
    case 'Combobox': {
      el = mk('div', 'tk-combo'); w.box = el;
      const inp = mk('input'); inp.type = 'text'; const dd = mk('button'); dd.textContent = '▾'; dd.tabIndex = -1;
      const lst = mk('div', 'tk-combolist'); lst.style.display = 'none'; el.append(inp, dd, lst); w.inp = inp; w.lst = lst;
      const fill = () => { lst.innerHTML = ''; (w.opts.values || []).forEach((v) => { const d = mk('div'); d.textContent = v; d.onmousedown = (e) => { e.preventDefault(); inp.value = v; lst.style.display = 'none'; T.pyVar.call(null, w.id, v); fire(w, '<<ComboboxSelected>>', {}); }; lst.appendChild(d); }); };
      w.fill = fill;
      dd.onclick = () => { if (w.opts.state === 'disabled') return; fill(); lst.style.display = lst.style.display === 'none' ? 'block' : 'none'; const r = el.getBoundingClientRect(); lst.style.minWidth = r.width + 'px'; };
      inp.oninput = () => T.pyVar.call(null, w.id, inp.value);
      inp.onclick = () => { if (w.opts.state === 'readonly') dd.click(); };
      document.addEventListener('mousedown', (e) => { if (!el.contains(e.target)) lst.style.display = 'none'; });
      break;
    }
    case 'Separator': el = mk('div', 'tk-sep'); w.box = el; break;
    case 'Scrollbar': el = mk('div', 'tk-scroll'); w.box = el; el.style.display = 'none'; break;
    case 'Scale': el = mk('input', 'tk-scale'); el.type = 'range'; w.inp = el; w.box = el; break;
    case 'Progressbar': el = mk('progress'); w.box = el; break;
    case 'PanedWindow': el = mk('div', 'tk-paned'); w.panes = []; w.content = el; w.box = el; break;
    case 'Notebook': { el = mk('div', 'tk-nb'); w.bar = mk('div', 'tk-nbbar'); w.pages = mk('div', 'tk-nbpages'); el.append(w.bar, w.pages); w.tabs = []; w.tabopt = {}; w.sel = null; w.content = w.pages; w.box = el; break; }
    case 'Treeview': build_tree(w); break;
    case 'Listbox': { el = mk('div', 'tk-listbox'); w.box = el; w.data = []; w.selx = []; break; }
    case 'Text': { el = mk('textarea', 'tk-text'); el.spellcheck = false; w.inp = el; w.box = el; el.oninput = () => T.pyText.call(null, w.id, el.value); break; }
    case 'Menu': el = mk('div', 'tk-menu'); el.style.display = 'none'; document.body.appendChild(el); w.box = el; w.entries = []; break;
    case 'Canvas': build_canvas(w); break;
    default: el = mk('div'); w.box = el;
  }
  if (el && c !== 'Tk' && !el.parentNode) { /* ebeveyne yerleşim sırasında eklenir */ }
  refresh(w);
}

/* ---------------- seçenekleri DOM'a uygula */
function refresh(w) {
  const o = w.opts, b = w.box; if (!b) return;
  const c = w.cls;
  const sn = o.style || TTK_DEFAULT[c];
  if (sn) { b.className = b.className.replace(/\bst-\S+/g, '').trim(); b.classList.add('ttk', cssName(sn)); if (c === 'Treeview') b.classList.add(cssName('Treeview')); }
  const f = fontCss(o.font);
  if (f && c !== 'Combobox') b.style.font = f.css;
  if (o.bg !== undefined || o.background !== undefined) b.style.backgroundColor = color(o.bg ?? o.background);
  if (o.fg !== undefined || o.foreground !== undefined) b.style.color = color(o.fg ?? o.foreground);
  const wd = o.width, ht = o.height;
  if (c === 'Frame' || c === 'LabelFrame' || c === 'Canvas' || c === 'Tk') {
    if (wd) b.style.width = px(wd); if (ht) b.style.height = px(ht);
    if (wd || ht) b.dataset.fixed = '1';
  }
  if (c === 'Canvas') { canvasSize(w); }
  if (c === 'Label') {
    const t = o.text ?? ''; if (!w.tv) w.txt.textContent = t;
    b.style.textAlign = ({ w: 'left', e: 'right', center: 'center' })[o.anchor] || (o.justify === 'center' ? 'center' : 'left');
    b.style.justifyContent = ({ w: 'flex-start', e: 'flex-end', center: 'center' })[o.anchor] || 'flex-start';
    if (o.wraplength) b.style.maxWidth = px(o.wraplength), b.style.whiteSpace = 'normal'; else b.style.whiteSpace = 'pre';
    if (o.justify === 'center') b.style.textAlign = 'center';
    if (wd) b.style.width = `calc(${+wd}ch + 4px)`;
    if (o.relief === 'solid' || o.bd) b.style.border = '1px solid ' + (color(o.highlightbackground) || '#888');
  }
  if (c === 'Button') { if (!w.tv) b.textContent = o.text ?? ''; if (wd) b.style.width = `calc(${+wd}ch + 16px)`; b.disabled = o.state === 'disabled'; }
  if (c === 'Checkbutton' || c === 'Radiobutton') { if (!w.tv) w.txt.textContent = o.text ?? ''; w.inp.disabled = o.state === 'disabled'; }
  if (c === 'LabelFrame') { w.legend.textContent = o.text ?? ''; w.legend.style.display = o.text ? '' : 'none'; if (o.padding != null) w.content.style.padding = (Array.isArray(o.padding) ? o.padding : [o.padding]).map(px).join(' '); }
  if (c === 'Frame' && o.padding != null) b.style.padding = (Array.isArray(o.padding) ? o.padding : [o.padding]).map(px).join(' ');
  if (c === 'Entry' || c === 'Spinbox') {
    if (wd) b.style.width = `calc(${+wd}ch + 10px)`; b.readOnly = o.state === 'readonly'; b.disabled = o.state === 'disabled';
    b.type = o.show ? 'password' : 'text'; if (o.justify) b.style.textAlign = o.justify;
  }
  if (c === 'Combobox') { const i = w.inp; if (wd) b.style.width = `calc(${+wd}ch + 28px)`; i.readOnly = o.state === 'readonly'; i.disabled = o.state === 'disabled'; b.classList.toggle('disabled', o.state === 'disabled'); }
  if (c === 'Text') { if (wd) b.style.width = `calc(${+wd}ch + 12px)`; if (ht) b.style.height = `calc(${+ht} * 1.35em + 8px)`; b.readOnly = o.state === 'disabled'; b.style.whiteSpace = o.wrap === 'none' ? 'pre' : 'pre-wrap'; if (o.padx) b.style.padding = `${o.pady || 0}px ${o.padx}px`; }
  if (c === 'Listbox') { if (ht) b.style.height = `calc(${+ht} * 1.35em + 6px)`; if (wd) b.style.width = `calc(${+wd}ch + 12px)`; }
  if (c === 'Treeview') { treeLayout(w); }
  if (c === 'Notebook') { const gz = (styles[o.style] && styles[o.style].cfg) || {}; w.hide = /Gizli/.test(o.style || ''); w.bar.style.display = w.hide ? 'none' : ''; }
  if (c === 'Tk' || c === 'Toplevel') {
    if (o._title !== undefined) { if (c === 'Tk') document.title = o._title; else w.title.textContent = o._title; }
    if (o._geometry && c === 'Toplevel') { const m = String(o._geometry).match(/(\d+)x(\d+)(?:\+(-?\d+)\+(-?\d+))?/); if (m) { w.box.style.width = m[1] + 'px'; w.box.style.height = m[2] + 'px'; if (m[3]) { w.box.style.left = m[3] + 'px'; w.box.style.top = m[4] + 'px'; } } }
    if (o._gizle !== undefined && c === 'Toplevel') w.box.style.display = o._gizle ? 'none' : '';
    if (o._kapatCb) w.kapatCb = true;
    if (c === 'Tk' && o.menu !== undefined && o.menu) setMenubar(w, W.get(o.menu));
  }
  if (c === 'Scale' && o.from_ !== undefined) { w.inp.min = o.from_; w.inp.max = o.to; }
  if (o._propagate === false && w.content) { /* sabit boyut */ w.box.dataset.fixed = '1'; }
  if (o.cursor) b.style.cursor = ({ hand2: 'pointer', fleur: 'move', crosshair: 'crosshair', arrow: 'default', sb_h_double_arrow: 'ew-resize', sb_v_double_arrow: 'ns-resize' })[o.cursor] || 'default';
  if (o.state === 'disabled') b.classList.add('disabled'); else b.classList.remove('disabled');
  if (o.takefocus === false || o.takefocus === 0) { if (w.inp) w.inp.tabIndex = 0; }
}
T.config = (id, j) => { const w = W.get(id); if (!w) return; const o = JSON.parse(j); Object.assign(w.opts, o); refresh(w); if (w.parent && w.mgr) layoutParent(w.parent); };
T.setvalue = (id, s) => {
  const w = W.get(id); if (!w) return; w.tv = w.opts.textvariable !== undefined;
  const c = w.cls;
  if (c === 'Label') { w.txt.textContent = s; w.tv = true; }
  else if (c === 'Button') { w.box.textContent = s; w.tv = true; }
  else if (c === 'Checkbutton') { w.inp.checked = (s === '1' || s === 'true' || s === String(w.opts.onvalue)); }
  else if (c === 'Radiobutton') { w.inp.checked = (s === String(w.opts.value)); }
  else if (w.inp) w.inp.value = s;
  if (w.parent && w.mgr) layoutParent(w.parent, true);
};
T.getvalue = (id) => { const w = W.get(id); return w && w.inp ? w.inp.value : ''; };
T.selectall = (id) => { const w = W.get(id); if (w && w.inp) w.inp.select(); };

/* ---------------- geometri */
T.geom = (id, mgr, j) => {
  const w = W.get(id); if (!w) return; const g = JSON.parse(j);
  const p = w.parent; if (!p) return;
  if (mgr === 'forget') { w.mgr = null; if (w.box.parentNode) w.box.remove(); layoutParent(p); return; }
  w.mgr = mgr; w.g = g;
  if (g.before || g.after) { /* sıra: pack(before=/after=) */
    const ref = W.get(g.before || g.after);
    const idx = p.kids.indexOf(w); if (idx >= 0) p.kids.splice(idx, 1);
    const ri = p.kids.indexOf(ref); p.kids.splice(ri < 0 ? p.kids.length : (g.before ? ri : ri + 1), 0, w);
  } else {
    const idx = p.kids.indexOf(w); if (idx >= 0) { /* mevcut sıra korunur ama pack yeniden çağrılırsa sona */ if (mgr === 'pack' && !g._keep) { p.kids.splice(idx, 1); p.kids.push(w); } }
  }
  layoutParent(p);
};
let lq = new Set(), lqT = 0;
function layoutParent(p) { lq.add(p); if (!lqT) lqT = setTimeout(flushLayout, 0); }
function flushLayout() { lqT = 0; const s = [...lq]; lq = new Set(); s.forEach(doLayout); }
T.later = (id) => { setTimeout(() => dlg(() => T.pyFlushTree.call(null, id)), 0); };
T.flush = () => { flushLayout(); flushDownloads(); };

function container(p) { return p.content || p.box; }
function doLayout(p) {
  const host = container(p); if (!host) return;
  if (p.cls === 'Notebook' || p.cls === 'PanedWindow') return;   // kendi düzenleri var
  const managed = p.kids.filter((k) => k.mgr);
  // sahipsiz DOM düğümlerini temizle
  [...host.children].forEach((ch) => { if (ch.classList.contains('tk-slot') || ch.classList.contains('tk-cav')) ch.remove(); else if (ch.dataset && ch.dataset.wid) { const k = W.get(+ch.dataset.wid); if (!k || !k.mgr) ch.remove(); } });
  if (!managed.length) return;
  const m = managed[0].mgr;
  host.style.position = (m === 'place' || getComputedStyle(host).position === 'static') ? 'relative' : host.style.position;
  if (m === 'pack') packLayout(p, host, managed.filter((k) => k.mgr === 'pack'));
  else if (m === 'grid') gridLayout(p, host, managed.filter((k) => k.mgr === 'grid'));
  managed.filter((k) => k.mgr === 'place').forEach((k) => placeOne(host, k));
  if (p.cls === 'Notebook') { /* */ }
}
function margins(g) { const [px1, px2] = pad2(g.padx), [py1, py2] = pad2(g.pady); return `${py1}px ${px2}px ${py2}px ${px1}px`; }
function ipad(g) { const ix = +g.ipadx || 0, iy = +g.ipady || 0; return [ix, iy]; }
function packLayout(p, host, kids) {
  // kapsayıcıyı sıfırla
  [...host.children].forEach((ch) => { if (ch.dataset && ch.dataset.wid) { /* korunur, taşınır */ } });
  const frag = document.createDocumentFragment();
  host.style.display = p.cls === 'Tk' || p.cls === 'Toplevel' ? 'flex' : '';
  const hasExp = (i) => kids.slice(i).reduce((a, k) => a + (k.g.expand ? 1 : 0), 0);
  let cav = mk('div', 'tk-cav'); const top = cav; cav.style.cssText = 'display:flex;flex:1 1 auto;min-width:0;min-height:0';
  host.classList.add('tk-packhost');
  kids.forEach((k, i) => {
    const g = k.g, side = g.side || 'top';
    const vert = side === 'top' || side === 'bottom';
    cav.style.flexDirection = vert ? 'column' : 'row';
    const slot = mk('div', 'tk-slot'); slot.style.cssText = `display:flex;flex:${g.expand ? 1 : 0} 0 auto;min-width:0;min-height:0;flex-direction:${vert ? 'row' : 'column'};`;
    const b = k.box; b.style.margin = margins(g); b.style.position = ''; b.style.left = b.style.top = '';
    const fill = g.fill || 'none', an = g.anchor || 'center';
    const [ix, iy] = ipad(g);
    if (ix || iy) b.style.padding = `${iy}px ${ix}px`;
    if (vert) {        // slot: yatay satır; çocuk yatayda (cross axis ters) -> slot row yönünde; yatay hizalama = justify
      slot.style.flexDirection = 'column';
      b.style.alignSelf = (fill === 'x' || fill === 'both') ? 'stretch' : ({ w: 'flex-start', nw: 'flex-start', sw: 'flex-start', e: 'flex-end', ne: 'flex-end', se: 'flex-end' })[an] || 'center';
      b.style.flex = (fill === 'y' || fill === 'both') ? '1 1 auto' : '0 0 auto';
      slot.style.justifyContent = ({ n: 'flex-start', nw: 'flex-start', ne: 'flex-start', s: 'flex-end', sw: 'flex-end', se: 'flex-end' })[an] || 'center';
      if (g.expand) slot.style.justifyContent = (fill === 'y' || fill === 'both') ? 'stretch' : slot.style.justifyContent;
    } else {
      slot.style.flexDirection = 'row';
      b.style.alignSelf = (fill === 'y' || fill === 'both') ? 'stretch' : ({ n: 'flex-start', nw: 'flex-start', ne: 'flex-start', s: 'flex-end', sw: 'flex-end', se: 'flex-end' })[an] || 'center';
      b.style.flex = (fill === 'x' || fill === 'both') ? '1 1 auto' : '0 0 auto';
      slot.style.justifyContent = ({ w: 'flex-start', nw: 'flex-start', sw: 'flex-start', e: 'flex-end', ne: 'flex-end', se: 'flex-end' })[an] || 'center';
    }
    const fx = fill === 'x' || fill === 'both', fy = fill === 'y' || fill === 'both';
    b.style.minWidth = fx ? '0' : ''; b.style.minHeight = fy ? '0' : '';
    if (k.cls === 'Canvas' && !b.dataset.fixed) { b.style.width = (fx || g.expand) ? '' : '378px'; b.style.height = (fy || g.expand) ? '' : '265px'; b.style.flex = '1 1 auto'; if (!fx && !g.expand) b.style.flex = '0 0 auto'; b.style.minWidth = '0'; b.style.minHeight = '0'; }
    slot.appendChild(b);
    const rest = mk('div', 'tk-cav'); rest.style.cssText = `display:flex;flex:${hasExp(i + 1) ? hasExp(i + 1) : 0} 1 auto;min-width:0;min-height:0`;
    if (side === 'top' || side === 'left') { cav.append(slot, rest); } else { cav.append(rest, slot); }
    cav = rest;
  });
  // eski çocukları kaldır, yenisini ekle
  [...host.children].forEach((ch) => { if (ch.classList.contains('tk-cav') || ch.classList.contains('tk-slot')) ch.remove(); });
  host.appendChild(top);
  top.style.flex = '1 1 auto';
  top.style.alignSelf = 'stretch';
  if (p.cls !== 'Tk') { host.style.display = 'flex'; host.style.flexDirection = 'column'; }
  // propagate: sabit boyutlu frame içinde cavity kutuyu doldurmaz (Tk gibi) -> sabit boyutta kalır
}
function gridLayout(p, host, kids) {
  [...host.children].forEach((ch) => { if (ch.dataset && ch.dataset.wid && !kids.some((k) => k.box === ch)) ch.remove(); });
  host.style.display = 'grid'; host.style.alignContent = 'start'; host.style.justifyContent = 'start';
  let maxC = 0, maxR = 0;
  kids.forEach((k) => { const g = k.g; maxC = Math.max(maxC, (+g.column || 0) + (+g.columnspan || 1)); maxR = Math.max(maxR, (+g.row || 0) + (+g.rowspan || 1)); });
  Object.keys(p.cols).forEach((i) => { maxC = Math.max(maxC, +i + 1); }); Object.keys(p.rows).forEach((i) => { maxR = Math.max(maxR, +i + 1); });
  const tr = (n, cfg) => { const a = []; for (let i = 0; i < n; i++) { const c = cfg[i] || {}; const mn = c.minsize ? c.minsize + 'px' : 'auto'; a.push(+c.weight > 0 ? `minmax(${mn === 'auto' ? 'auto' : mn}, ${c.weight}fr)` : (c.minsize ? `minmax(${mn}, auto)` : 'auto')); } return a.join(' '); };
  host.style.gridTemplateColumns = tr(maxC, p.cols); host.style.gridTemplateRows = tr(maxR, p.rows);
  if (Object.values(p.cols).some((c) => +c.weight > 0)) { host.style.justifyContent = 'stretch'; }
  if (Object.values(p.rows).some((c) => +c.weight > 0)) { host.style.alignContent = 'stretch'; }
  if (p.box === host && !host.dataset.fixed && host.parentNode) { /* */ }
  kids.forEach((k) => {
    const g = k.g, b = k.box, sk = String(g.sticky || '');
    b.style.gridColumn = `${(+g.column || 0) + 1} / span ${+g.columnspan || 1}`; b.style.gridRow = `${(+g.row || 0) + 1} / span ${+g.rowspan || 1}`;
    b.style.margin = margins(g); b.style.position = ''; b.style.minWidth = '0'; if (!b.dataset.fixed) b.style.minHeight = '0';
    const ew = sk.includes('e') && sk.includes('w'), ns = sk.includes('n') && sk.includes('s');
    b.style.justifySelf = ew ? 'stretch' : sk.includes('w') ? 'start' : sk.includes('e') ? 'end' : 'center';
    b.style.alignSelf = ns ? 'stretch' : sk.includes('n') ? 'start' : sk.includes('s') ? 'end' : 'center';
    const [ix, iy] = ipad(g); if (ix || iy) b.style.padding = `${iy}px ${ix}px`;
    if (k.cls === 'Canvas' && !b.dataset.fixed) { b.style.width = ew ? '' : '378px'; b.style.height = ns ? '' : '265px'; }
    if (b.parentNode !== host) host.appendChild(b);
  });
}
function placeOne(host, k) {
  const g = k.g, b = k.box; b.style.position = 'absolute'; b.style.margin = '0';
  const rel = (a, r) => (r != null ? `${(+r) * 100}%` : (a != null ? px(a) : '0'));
  b.style.left = rel(g.x, g.relx); b.style.top = rel(g.y, g.rely);
  if (g.width != null) b.style.width = px(g.width); if (g.height != null) b.style.height = px(g.height);
  if (g.relwidth != null) b.style.width = (g.relwidth * 100) + '%'; if (g.relheight != null) b.style.height = (g.relheight * 100) + '%';
  const an = g.anchor || 'nw'; const tx = an.includes('e') ? '-100%' : (an === 'n' || an === 's' || an === 'center') ? '-50%' : '0';
  const ty = an.includes('s') ? '-100%' : (an === 'w' || an === 'e' || an === 'center') ? '-50%' : '0';
  b.style.transform = `translate(${tx},${ty})`;
  if (b.parentNode !== host) host.appendChild(b);
}
T.gridcfg = (id, kind, i, j) => { const w = W.get(id); if (!w) return; const o = JSON.parse(j); (kind === 'col' ? w.cols : w.rows)[i] = Object.assign((kind === 'col' ? w.cols : w.rows)[i] || {}, o); layoutParent(w); };

/* ---------------- boyut sorguları */
T.size = (id, k) => {
  const w = W.get(id); if (!w || !w.box) return 0; flushLayout();
  const b = w.box; const r = b.getBoundingClientRect();
  switch (k) {
    case 'w': return Math.round(r.width); case 'h': return Math.round(r.height);
    case 'rw': { const s = b.style.width; b.style.width = 'max-content'; const v = b.scrollWidth; b.style.width = s; return Math.round(Math.max(v, r.width && b.dataset.fixed ? r.width : 0) || r.width); }
    case 'rh': return Math.round(b.dataset.fixed ? r.height : b.scrollHeight || r.height);
    case 'x': return Math.round(r.left - (w.parent ? container(w.parent).getBoundingClientRect().left : 0));
    case 'y': return Math.round(r.top - (w.parent ? container(w.parent).getBoundingClientRect().top : 0));
    case 'rx': return Math.round(r.left); case 'ry': return Math.round(r.top);
  }
  return 0;
};
T.mapped = (id) => { const w = W.get(id); return !!(w && w.box && w.box.isConnected && w.box.offsetParent !== null); };
T.screen = (k) => (k === 'w' ? window.innerWidth : window.innerHeight);
let pmx = 0, pmy = 0; window.addEventListener('mousemove', (e) => { pmx = e.clientX; pmy = e.clientY; }, true);
T.pointer = (k) => (k === 'x' ? pmx : pmy);
T.containing = (x, y) => { const e = document.elementFromPoint(x, y); const b = e && e.closest('[data-wid]'); return b ? +b.dataset.wid : 0; };
T.rgb = (c) => { const e = mk('div'); e.style.color = color(c); document.body.appendChild(e); const m = getComputedStyle(e).color.match(/\d+/g); e.remove(); return m ? m.slice(0, 3).join(',') : '0,0,0'; };
T.focus = (id) => { const w = W.get(id); if (w) { (w.inp || w.box).focus && (w.inp || w.box).focus(); focusedId = id; } };
T.focused = () => { const a = document.activeElement; const b = a && a.closest && a.closest('[data-wid]'); return b ? +b.dataset.wid : 0; };
T.lift = (id) => { const w = W.get(id); if (w && w.cls === 'Toplevel') document.body.appendChild(w.box); };
T.clip = (s) => { try { navigator.clipboard.writeText(s); } catch (e) {} };
T.alert = (m) => { window.alert(m); };
T.confirm = (m) => window.confirm(m);
T.prompt = (m, d) => window.prompt(m, d);
T.color = (d) => window.prompt('Renk (#rrggbb):', d);
T.measure = (f, t) => measure(f, t);
T.scroll = (id, dy) => { const w = W.get(id); if (w && w.scroller) w.scroller.scrollTop += dy; };
function destroyW(w) {
  [...w.kids].forEach(destroyW);
  if (w.box && w.cls !== 'Tk') w.box.remove();
  if (w.parent) { const i = w.parent.kids.indexOf(w); if (i >= 0) w.parent.kids.splice(i, 1); layoutParent(w.parent); }
  W.delete(w.id);
}
T.destroy = (id) => { const w = W.get(id); if (w) destroyW(w); };
T.after = (aid, ms) => { setTimeout(() => dlg(() => T.pyAfter.call(null, aid)), ms); };

/* ---------------- olay bağlamaları */
function parseSeq(seq) {
  const s = seq.replace(/^<|>$/g, '');
  if (s.startsWith('<')) return { virt: seq };
  const t = s.split('-'); const r = { mods: new Set(), type: null, detail: null, dbl: 0 };
  for (let i = 0; i < t.length; i++) {
    const x = t[i];
    if (['Control', 'Shift', 'Alt', 'Meta', 'Mod1', 'Lock', 'Any'].includes(x)) r.mods.add(x);
    else if (x === 'Double') r.dbl = 2; else if (x === 'Triple') r.dbl = 3;
    else if (/^B[1-5]$/.test(x)) r.mods.add(x);
    else if (['Button', 'ButtonPress', 'ButtonRelease', 'Motion', 'MouseWheel', 'Key', 'KeyPress', 'KeyRelease', 'Enter', 'Leave', 'Configure', 'FocusIn', 'FocusOut', 'Map', 'Unmap', 'Destroy'].includes(x)) r.type = x;
    else r.detail = x;
  }
  if (!r.type) { if (/^\d$/.test(r.detail || '')) { r.type = 'Button'; } else r.type = 'Key'; }
  if (r.type === 'Button') r.type = 'ButtonPress';
  if (r.type === 'Key') r.type = 'KeyPress';
  return r;
}
const KEYMAP = { Enter: 'Return', ' ': 'space', ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Up', ArrowDown: 'Down', Backspace: 'BackSpace', PageUp: 'Prior', PageDown: 'Next', Esc: 'Escape' };
function evMatch(r, e) {
  if (r.virt) return false;
  if (r.type !== e.type) return false;
  const need = (m) => r.mods.has(m) || r.mods.has('Any');
  if (e.type === 'ButtonPress' || e.type === 'ButtonRelease') {
    if (r.detail && +r.detail !== e.button) return false;
    if (r.dbl && e.click < r.dbl) return false; if (!r.dbl && false) return false;
  }
  if (e.type === 'Motion') { for (let i = 1; i <= 3; i++) { const has = (e.buttons & (i === 1 ? 1 : i === 2 ? 4 : 2)) > 0; if (r.mods.has('B' + i) !== has && !r.mods.has('Any')) { if (r.mods.has('B' + i) || (has && false)) return false; } } if (!r.mods.has('B1') && !r.mods.has('B2') && !r.mods.has('B3') && e.buttons && false) return false; }
  if (e.type === 'KeyPress' || e.type === 'KeyRelease') { if (r.detail && r.detail !== e.keysym) return false; }
  if (!r.mods.has('Any')) {
    if (r.mods.has('Control') !== !!e.ctrl) return false;
    if (r.mods.has('Shift') !== !!e.shift && (e.type !== 'KeyPress' || r.mods.has('Shift') || (e.keysym.length > 1))) return false;
    if (r.mods.has('Alt') !== !!e.alt) return false;
  }
  return true;
}
T.bind = (id, seq) => { const w = id === 0 ? ROOTBIND : W.get(id); if (!w) return; w.binds.add(seq); w._p = w._p || {}; w._p[seq] = parseSeq(seq);
  if (seq === '<Configure>' && w.box && !w._ro) { w._ro = new ResizeObserver(() => { fire(w, '<Configure>', { width: Math.round(w.box.clientWidth), height: Math.round(w.box.clientHeight) }); }); w._ro.observe(w.box); }
};
T.unbind = (id, seq) => { const w = W.get(id); if (w) w.binds.delete(seq); };
const ROOTBIND = { id: 'all', binds: new Set(), _p: {} };
T.event_generate = (id, seq) => { const w = W.get(id); if (w) fire(w, seq, {}); };

function evPayload(e, ev, w) {
  const r = w && w.box ? w.box.getBoundingClientRect() : { left: 0, top: 0 };
  return { x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top), x_root: Math.round(e.clientX), y_root: Math.round(e.clientY), num: ev.button || 0, delta: ev.delta || 0, keysym: ev.keysym || '', char: ev.char || '', state: (ev.shift ? 1 : 0) | (ev.ctrl ? 4 : 0) | (ev.alt ? 8 : 0), wid: w ? w.id : 0 };
}
function fire(w, seq, payload) { return T.pyEvent.call(null, w.id, seq, JSON.stringify(payload)); }
function chain(w) { const a = []; let x = w; while (x) { a.push(x); x = x.parent; } return a; }
function dispatchEv(target, ev, raw) {
  let stop = false;
  const tw = target;
  const cands = [];
  if (tw) { cands.push(tw); }
  chain(tw).forEach((x) => { if ((x.cls === 'Toplevel' || x.cls === 'Tk') && !cands.includes(x)) cands.push(x); });
  cands.push(ROOTBIND);
  for (const c of cands) {
    if (stop) break;
    if (!c.binds) continue;
    for (const seq of c.binds) {
      const r = c._p[seq]; if (!r || !evMatch(r, ev)) continue;
      const pl = evPayload(raw, ev, tw);
      const res = T.pyEvent.call(null, c.id, seq, JSON.stringify(pl));
      if (res === 'break') { stop = true; raw.preventDefault && raw.preventDefault(); }
    }
  }
  return stop;
}
function widOf(el) { const b = el && el.closest ? el.closest('[data-wid]') : null; return b ? W.get(+b.dataset.wid) : W.get(0); }
let lastClick = { t: 0, x: 0, y: 0, n: 0 };
document.addEventListener('mousedown', (e) => {
  const now = performance.now(); const near = Math.abs(e.clientX - lastClick.x) < 5 && Math.abs(e.clientY - lastClick.y) < 5;
  lastClick = { t: now, x: e.clientX, y: e.clientY, n: (now - lastClick.t < 400 && near) ? lastClick.n + 1 : 1 };
  const w = widOf(e.target); const map = [1, 2, 3][e.button] || 1; const btn = e.button === 0 ? 1 : e.button === 1 ? 2 : 3;
  const ev = { type: 'ButtonPress', button: btn, click: lastClick.n, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, buttons: e.buttons };
  if (canvasTagEvent(w, ev, e)) return;
  dispatchEv(w, ev, e);
}, true);
document.addEventListener('mouseup', (e) => { const w = widOf(e.target); const btn = e.button === 0 ? 1 : e.button === 1 ? 2 : 3;
  const ev = { type: 'ButtonRelease', button: btn, click: 1, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, buttons: e.buttons };
  if (canvasTagEvent(w, ev, e)) return; dispatchEv(w, ev, e); }, true);
document.addEventListener('mousemove', (e) => { const w = (dragTarget || widOf(e.target)); const ev = { type: 'Motion', button: 0, click: 1, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, buttons: e.buttons };
  if (canvasTagEvent(w, ev, e)) return; dispatchEv(w, ev, e); }, true);
let dragTarget = null;
document.addEventListener('mousedown', (e) => { dragTarget = widOf(e.target); }, true);
document.addEventListener('mouseup', () => { setTimeout(() => { dragTarget = null; }, 0); }, true);
document.addEventListener('wheel', (e) => { const w = widOf(e.target); const ev = { type: 'MouseWheel', button: 0, click: 1, delta: e.deltaY < 0 ? 120 : -120, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, buttons: e.buttons };
  const stop = dispatchEv(w, ev, e); if (stop || (w && (w.cls === 'Canvas' || w.cls === 'Treeview') && !w.scroller)) e.preventDefault(); }, { capture: true, passive: false });
function keysymOf(e) { let k = KEYMAP[e.key] || e.key; if (/^F\d+$/.test(k)) return k; return k; }
function keyEv(type, e) { return { type, keysym: keysymOf(e), char: e.key.length === 1 ? e.key : '', ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, button: 0, click: 1, buttons: 0 }; }
document.addEventListener('keydown', (e) => {
  const a = document.activeElement; const w = widOf(a);
  const ev = keyEv('KeyPress', e);
  const stop = dispatchEv(w, ev, e);
  if (stop) e.preventDefault();
}, true);
document.addEventListener('keyup', (e) => { dispatchEv(widOf(document.activeElement), keyEv('KeyRelease', e), e); }, true);
document.addEventListener('contextmenu', (e) => { if (widOf(e.target) && widOf(e.target).cls !== 'Entry' && widOf(e.target).cls !== 'Text') e.preventDefault(); });
document.addEventListener('mouseover', (e) => { const w = widOf(e.target); if (w) dispatchEv(w, { type: 'Enter', button: 0, click: 1, buttons: e.buttons }, e); });
document.addEventListener('mouseout', (e) => { const w = widOf(e.target); if (w) dispatchEv(w, { type: 'Leave', button: 0, click: 1, buttons: e.buttons }, e); });
document.addEventListener('focusin', (e) => { const w = widOf(e.target); if (w) dispatchEv(w, { type: 'FocusIn', button: 0, click: 1, buttons: 0 }, e); });
document.addEventListener('focusout', (e) => { const w = widOf(e.target); if (w) dispatchEv(w, { type: 'FocusOut', button: 0, click: 1, buttons: 0 }, e); });
document.addEventListener('dblclick', () => {});

/* ---------------- Notebook */
T.nb_set = (id, tabsJ, optJ) => { const w = W.get(id); w.tabs = JSON.parse(tabsJ).map((i) => W.get(i)); w.tabopt = JSON.parse(optJ); nbRender(w); };
T.nb_select = (id, cid) => { const w = W.get(id); w.sel = W.get(cid); nbRender(w); };
function nbRender(w) {
  w.pages.innerHTML = ''; w.bar.innerHTML = '';
  w.tabs.forEach((t) => { if (!t.box.parentNode || t.box.parentNode !== w.pages) w.pages.appendChild(t.box); t.mgr = 'nb'; t.box.hidden = t !== w.sel; t.box.classList.add('tk-nbpage'); t.box.style.flex = '1 1 auto';
    const b = mk('button', 'tk-nbtab' + (t === w.sel ? ' sel' : '')); b.textContent = (w.tabopt[t.id] || {}).text || ''; b.onclick = () => { w.sel = t; nbRender(w); T.pyNb.call(null, w.id, t.id); }; w.bar.appendChild(b); });
  w.pages.style.display = 'flex'; w.pages.style.flexDirection = 'column';
  fire(w, '<<NotebookTabChanged>>', {});
}

/* ---------------- PanedWindow */
T.pane_add = (id, cid, j) => { const w = W.get(id), k = W.get(cid), o = JSON.parse(j); k.mgr = 'pane'; k.popt = o; if (!w.panes.includes(k)) w.panes.push(k); paneRender(w); };
T.pane_forget = (id, cid) => { const w = W.get(id), k = W.get(cid); w.panes = w.panes.filter((x) => x !== k); k.mgr = null; if (k.box.parentNode) k.box.remove(); paneRender(w); };
T.pane_cfg = (id, cid, j) => { const k = W.get(cid); Object.assign(k.popt, JSON.parse(j)); paneRender(W.get(id)); };
function paneRender(w) {
  const h = (w.opts.orient || 'horizontal') === 'horizontal';
  w.box.style.display = 'flex'; w.box.style.flexDirection = h ? 'row' : 'column'; w.box.innerHTML = '';
  w.panes.forEach((k, i) => {
    const b = k.box; b.style.minWidth = h ? (k.popt.minsize || 0) + 'px' : '0'; b.style.minHeight = h ? '0' : (k.popt.minsize || 0) + 'px';
    b.style.margin = '0'; b.style.alignSelf = 'stretch'; b.style.position = '';
    if (k.size != null) b.style.flex = `0 0 ${k.size}px`; else b.style.flex = (k.popt.stretch === 'never') ? '0 0 auto' : '1 1 0';
    if (b.dataset.fixed) b.style.flex = '0 0 auto';
    w.box.appendChild(b);
    if (i < w.panes.length - 1) {
      const s = mk('div', 'tk-sash ' + (h ? 'h' : 'v')); s.style.flex = '0 0 5px'; w.box.appendChild(s);
      s.onmousedown = (e) => { e.preventDefault(); const a = k.box, c = w.panes[i + 1].box; const ra = a.getBoundingClientRect(), rc = c.getBoundingClientRect(); const start = h ? e.clientX : e.clientY; const sa = h ? ra.width : ra.height, sc = h ? rc.width : rc.height;
        const mv = (ev) => { const d = (h ? ev.clientX : ev.clientY) - start; const mina = +(k.popt.minsize || 0), minc = +(w.panes[i + 1].popt.minsize || 0); let na = Math.max(mina, sa + d); let nc = sc - (na - sa); if (nc < minc) { nc = minc; na = sa + sc - minc; }
          k.size = na; w.panes[i + 1].size = nc; a.style.flex = `0 0 ${na}px`; c.style.flex = `0 0 ${nc}px`; };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); }; window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up); };
    }
  });
}
T.sash = (id, i, set, v) => { const w = W.get(id); const h = (w.opts.orient || 'horizontal') === 'horizontal'; const a = w.panes[i]; if (!a) return 0;
  if (set === 1) { const r0 = w.box.getBoundingClientRect(); const ra = a.box.getBoundingClientRect(); a.size = Math.max(+(a.popt.minsize || 0), v - (h ? ra.left - r0.left : ra.top - r0.top)); const nx = w.panes[i + 1]; if (nx) { const rn = nx.box.getBoundingClientRect(); nx.size = null; } paneRender(w); return v; }
  const r0 = w.box.getBoundingClientRect(), ra = a.box.getBoundingClientRect(); return h ? ra.right - r0.left : ra.bottom - r0.top; };

/* ---------------- Menü */
let openMenu = null;
T.menu_set = (id, j) => { const w = W.get(id); w.entries = JSON.parse(j); if (w.bar) renderMenubar(w); };
function menuDom(w) {
  const d = mk('div', 'tk-menu'); d.style.display = 'block'; d.style.position = 'static';
  w.entries.forEach((e) => {
    if (e.tur === 'separator') { d.appendChild(mk('hr')); return; }
    const it = mk('div', 'tk-mi' + (e.state === 'disabled' ? ' disabled' : '')); let label = e.label || '';
    if (e.tur === 'check' || e.tur === 'radio') label = '   ' + label;
    it.textContent = label; if (e.accelerator) { const a = mk('span'); a.textContent = e.accelerator; it.appendChild(a); }
    if (e.tur === 'cascade') { it.textContent += '  ▸'; const sub = W.get(e.menu); it.onmouseenter = () => { document.querySelectorAll('.tk-sub').forEach((x) => x.remove()); if (!sub) return; const s = menuDom(sub); s.classList.add('tk-sub'); s.style.position = 'fixed'; const r = it.getBoundingClientRect(); s.style.left = r.right + 'px'; s.style.top = r.top + 'px'; document.body.appendChild(s); }; }
    else it.onclick = () => { closeMenus(); if (e.state !== 'disabled') T.pyMenu.call(null, w.id, e._i); };
    d.appendChild(it);
  });
  return d;
}
function closeMenus() { document.querySelectorAll('.tk-popup,.tk-sub').forEach((x) => x.remove()); }
document.addEventListener('mousedown', (e) => { if (!e.target.closest('.tk-popup,.tk-sub,.tk-mbtn')) closeMenus(); }, true);
T.menu_popup = (id, x, y) => { closeMenus(); const w = W.get(id); const d = menuDom(w); d.classList.add('tk-popup'); d.style.position = 'fixed'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d);
  const r = d.getBoundingClientRect(); if (r.right > innerWidth) d.style.left = Math.max(0, innerWidth - r.width) + 'px'; if (r.bottom > innerHeight) d.style.top = Math.max(0, innerHeight - r.height) + 'px'; };
function setMenubar(root, m) { if (!m) return; m.bar = true; root.menubar = m; renderMenubar(m); }
function renderMenubar(m) {
  let bar = document.getElementById('tk-menubar'); if (!bar) { bar = mk('div'); bar.id = 'tk-menubar'; document.body.insertBefore(bar, rootEl); } bar.innerHTML = '';
  m.entries.forEach((e) => { if (e.tur !== 'cascade') return; const b = mk('button', 'tk-mbtn'); b.textContent = e.label; b.onclick = () => { closeMenus(); const r = b.getBoundingClientRect(); T.menu_popup(e.menu, r.left, r.bottom); }; bar.appendChild(b); });
}

/* ---------------- Treeview */
function build_tree(w) {
  const el = mk('div', 'tk-tree'); const tbl = mk('table'); const hd = mk('thead'); const bd = mk('tbody'); tbl.append(hd, bd); el.appendChild(tbl);
  w.box = el; w.scroller = el; w.tbl = tbl; w.hd = hd; w.bd = bd; w.cols = w.cols || {}; w.tc = []; w.heads = {}; w.colcfg = {}; w.tagcfg = {}; w.tdata = { items: {}, order: { '': [] }, sel: [] }; w.show = 'tree headings';
  el.tabIndex = 0;
}
T.tree_cols = (id, cj, dj, show) => { const w = W.get(id); w.tc = JSON.parse(cj); w.dc = JSON.parse(dj); w.show = show; treeRender(w); };
T.tree_head = (id, c, j) => { const w = W.get(id); w.heads[c] = Object.assign(w.heads[c] || {}, JSON.parse(j)); treeRender(w); };
T.tree_col = (id, c, j) => { const w = W.get(id); w.colcfg[c] = Object.assign(w.colcfg[c] || {}, JSON.parse(j)); treeRender(w); };
T.tree_tag = (id, t, j) => { const w = W.get(id); w.tagcfg[t] = JSON.parse(j); treeRender(w); };
T.tree_data = (id, j) => { const w = W.get(id); w.tdata = JSON.parse(j); treeRender(w); };
T.tree_see = (id, iid) => { const w = W.get(id); const r = w.bd.querySelector(`[data-iid="${iid}"]`); if (r) r.scrollIntoView({ block: 'nearest' }); };
T.tree_hit = (id, x, y, what) => { const w = W.get(id); const r = w.box.getBoundingClientRect();
  if (what === 'row') { const tr = [...w.bd.children].find((t) => { const q = t.getBoundingClientRect(); return y + r.top >= q.top && y + r.top < q.bottom; }); return tr ? tr.dataset.iid : ''; }
  const ths = [...w.hd.querySelectorAll('th')]; const th = ths.findIndex((t) => { const q = t.getBoundingClientRect(); return x + r.left >= q.left && x + r.left < q.right; }); return '#' + Math.max(0, th); };
function treeLayout(w) { const o = w.opts; if (o.height) { const rh = +(w.rowh || 22); w.box.style.height = (+o.height * rh + 24) + 'px'; w.box.dataset.fixed = '1'; } }
function treeRender(w) {
  const dc = (w.dc && w.dc.length && w.dc[0] !== '#all') ? w.dc : w.tc; const showTree = /tree/.test(w.show || 'tree headings'), showHead = /headings/.test(w.show || 'tree headings');
  w.hd.innerHTML = ''; if (showHead) { const tr = mk('tr'); const cols = (showTree ? ['#0'] : []).concat(dc);
    cols.forEach((c, i) => { const th = mk('th'); const h = w.heads[c] || {}; th.textContent = h.text || ''; const cc = w.colcfg[c] || {}; if (cc.width) th.style.width = cc.width + 'px'; if (cc.minwidth) th.style.minWidth = cc.minwidth + 'px'; th.onclick = () => T.pyTreeHead.call(null, w.id, c); tr.appendChild(th); }); w.hd.appendChild(tr); }
  const selSet = new Set(w.tdata.sel || []); w.bd.innerHTML = '';
  const emit = (parent, depth) => { (w.tdata.order[parent] || []).forEach((iid) => { const it = w.tdata.items[iid]; if (!it) return; const tr = mk('tr'); tr.dataset.iid = iid; if (selSet.has(iid)) tr.classList.add('sel');
      (it.tags || []).forEach((t) => { const c = w.tagcfg[t]; if (c) { if (c.foreground) tr.style.color = color(c.foreground); if (c.background) tr.style.backgroundColor = color(c.background); if (c.font) { const f = fontCss(c.font); if (f) tr.style.font = f.css; } } });
      if (showTree) { const td = mk('td'); td.style.paddingLeft = (4 + depth * 14) + 'px'; const kids = (w.tdata.order[iid] || []).length; td.textContent = (kids ? (it.open ? '▾ ' : '▸ ') : '') + (it.text || ''); if (kids) td.onclick = (e) => {}; tr.appendChild(td); }
      dc.forEach((c, ci) => { const k = w.tc.indexOf(c); const td = mk('td'); const v = it.values ? it.values[k] : ''; td.textContent = v == null ? '' : v; const cc = w.colcfg[c] || {}; td.style.textAlign = ({ w: 'left', e: 'right', center: 'center' })[cc.anchor] || 'left'; if (cc.width) { td.style.maxWidth = cc.width + 'px'; } tr.appendChild(td); });
      tr.onmousedown = (e) => { if (e.button !== 0 && selSet.has(iid)) return; let sel = (w.tdata.sel || []).slice(); if ((e.ctrlKey) && (w.opts.selectmode !== 'browse')) { sel = sel.includes(iid) ? sel.filter((x) => x !== iid) : sel.concat(iid); } else if (e.shiftKey && sel.length && w.opts.selectmode !== 'browse') { const rows = [...w.bd.children].map((r) => r.dataset.iid); const a = rows.indexOf(sel[sel.length - 1]), b = rows.indexOf(iid); sel = rows.slice(Math.min(a, b), Math.max(a, b) + 1); } else sel = [iid];
        w.tdata.sel = sel; [...w.bd.children].forEach((r) => r.classList.toggle('sel', sel.includes(r.dataset.iid))); T.pyTreeSel.call(null, w.id, JSON.stringify(sel)); };
      w.bd.appendChild(tr); if (it.open) emit(iid, depth + 1); }); };
  emit('', 0);
}

/* ---------------- Listbox */
T.list_data = (id, dj, sj) => { const w = W.get(id); w.data = JSON.parse(dj); w.selx = JSON.parse(sj); w.box.innerHTML = '';
  w.data.forEach((t, i) => { const d = mk('div', 'tk-li' + (w.selx.includes(i) ? ' sel' : '')); d.textContent = t; d.onclick = (e) => { w.selx = [i]; [...w.box.children].forEach((c, k) => c.classList.toggle('sel', k === i)); T.pyListSel.call(null, w.id, JSON.stringify(w.selx)); }; w.box.appendChild(d); }); };
T.text_set = (id, s) => { const w = W.get(id); if (w.inp.value !== s) w.inp.value = s; };
T.text_end = (id) => { const w = W.get(id); w.inp.scrollTop = w.inp.scrollHeight; };

/* ---------------- Canvas */
function build_canvas(w) {
  const el = mk('div', 'tk-canvas'); const cv = mk('canvas'); const layer = mk('div', 'tk-cvwin'); el.append(cv, layer);
  w.box = el; w.cv = cv; w.layer = layer; w.items = new Map(); w.order = []; w.ox = 0; w.oy = 0; w.dirty = false; w.tagb = new Set(); w.sr = null;
  const ro = new ResizeObserver(() => { canvasSize(w); fire(w, '<Configure>', { width: Math.round(el.clientWidth), height: Math.round(el.clientHeight) }); }); ro.observe(el);
}
function canvasSize(w) {
  const el = w.box, cv = w.cv, o = w.opts; if (!el) return;
  if (o.bg !== undefined || o.background !== undefined) el.style.backgroundColor = color(o.bg ?? o.background);
  const r = el.getBoundingClientRect(); const d = window.devicePixelRatio || 1;
  const W_ = Math.max(1, Math.round(r.width)), H_ = Math.max(1, Math.round(r.height));
  if (cv.width !== Math.round(W_ * d) || cv.height !== Math.round(H_ * d)) { cv.width = Math.round(W_ * d); cv.height = Math.round(H_ * d); cv.style.width = W_ + 'px'; cv.style.height = H_ + 'px'; }
  if (o.scrollregion) w.sr = o.scrollregion;
  redraw(w);
}
function redraw(w) { if (w.dirty) return; w.dirty = true; requestAnimationFrame(() => { w.dirty = false; paintCanvas(w); }); }
T.cv_create = (id, iid, type, cj, oj, tj) => { const w = W.get(id); const it = { id: iid, type, c: JSON.parse(cj), o: JSON.parse(oj), tags: JSON.parse(tj) }; w.items.set(iid, it); w.order.push(iid);
  if (type === 'window') winItem(w, it); redraw(w); };
T.cv_delete = (id, j) => { const w = W.get(id); JSON.parse(j).forEach((i) => { const it = w.items.get(i); if (it && it.el) it.el.remove(); w.items.delete(i); }); w.order = w.order.filter((i) => w.items.has(i)); redraw(w); };
T.cv_coords = (id, i, cj) => { const w = W.get(id); const it = w.items.get(i); if (it) { it.c = JSON.parse(cj); if (it.type === 'window') winItem(w, it); redraw(w); } };
T.cv_cfg = (id, ij, oj) => { const w = W.get(id); const o = JSON.parse(oj); JSON.parse(ij).forEach((i) => { const it = w.items.get(i); if (it) { Object.assign(it.o, o); if (it.type === 'window') winItem(w, it); } }); redraw(w); };
T.cv_move = (id, ij, dx, dy) => { const w = W.get(id); JSON.parse(ij).forEach((i) => { const it = w.items.get(i); if (it) { it.c = it.c.map((v, k) => v + (k % 2 ? dy : dx)); if (it.type === 'window') winItem(w, it); } }); redraw(w); };
T.cv_tags = (id, i, tj) => { const w = W.get(id); const it = w.items.get(i); if (it) it.tags = JSON.parse(tj); };
T.cv_order = (id, ij, up) => { const w = W.get(id); const ids = JSON.parse(ij); w.order = w.order.filter((i) => !ids.includes(i)); w.order = up ? w.order.concat(ids) : ids.concat(w.order); redraw(w); };
T.cv_tagbind = (id, tag, seq) => { const w = W.get(id); w.tagb.add(tag + '\u0001' + seq); w._tp = w._tp || {}; w._tp[seq] = parseSeq(seq); };
T.cv_scroll = (id, k) => { const w = W.get(id); return k === 'x' ? w.ox : w.oy; };
T.cv_view = (id, axis, mode, v) => { const w = W.get(id); const sr = w.sr || [0, 0, 0, 0]; const vw = w.box.clientWidth, vh = w.box.clientHeight;
  if (axis === 'y') { const tot = Math.max(0, (sr[3] - sr[1]) - vh); w.oy = mode === 'moveto' ? sr[1] + v * (sr[3] - sr[1]) : w.oy + v; w.oy = Math.max(sr[1], Math.min(sr[1] + tot, w.oy)); }
  else { const tot = Math.max(0, (sr[2] - sr[0]) - vw); w.ox = mode === 'moveto' ? sr[0] + v * (sr[2] - sr[0]) : w.ox + v; w.ox = Math.max(sr[0], Math.min(sr[0] + tot, w.ox)); }
  for (const it of w.items.values()) if (it.type === 'window') winItem(w, it); redraw(w); };
function winItem(w, it) {
  const k = W.get(it.o.window); if (!k) return; const b = k.box; if (b.parentNode !== w.layer) { w.layer.appendChild(b); k.mgr = 'cvwin'; }
  b.style.position = 'absolute'; b.style.margin = '0'; b.style.alignSelf = ''; b.style.transform = '';
  b.style.left = (it.c[0] - w.ox) + 'px'; b.style.top = (it.c[1] - w.oy) + 'px';
  if (it.o.width != null) b.style.width = px(it.o.width); if (it.o.height != null) b.style.height = px(it.o.height);
  const an = it.o.anchor || 'center'; const tx = an.includes('e') ? '-100%' : (an === 'n' || an === 's' || an === 'center') ? '-50%' : '0'; const ty = an.includes('s') ? '-100%' : (an === 'w' || an === 'e' || an === 'center') ? '-50%' : '0';
  b.style.transform = `translate(${tx},${ty})`; w.hasWin = true;
}
function resolveColor(c) { return color(c); }
function paintCanvas(w) {
  const cv = w.cv, ctx = cv.getContext('2d'); const d = window.devicePixelRatio || 1;
  ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.translate(-w.ox, -w.oy);
  for (const iid of w.order) {
    const it = w.items.get(iid); if (!it || it.o.state === 'hidden') continue;
    const o = it.o, c = it.c; ctx.save();
    const stroke = () => { const wd = o.width != null ? +o.width : 1; ctx.lineWidth = wd || 1; if (o.dash) ctx.setLineDash(String(o.dash).split(/[ ,]+/).map(Number).filter((x) => x > 0).concat([])); else ctx.setLineDash([]); };
    switch (it.type) {
      case 'line': { if (c.length < 4) break; ctx.beginPath(); ctx.moveTo(c[0], c[1]); for (let i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1]); stroke(); ctx.strokeStyle = resolveColor(o.fill) || '#000'; ctx.lineCap = ({ round: 'round', projecting: 'square', butt: 'butt' })[o.capstyle] || 'butt'; ctx.lineJoin = o.joinstyle || 'miter'; ctx.stroke();
        if (o.arrow) { arrowHead(ctx, c, o); } break; }
      case 'rectangle': { const x = Math.min(c[0], c[2]), y = Math.min(c[1], c[3]), ww = Math.abs(c[2] - c[0]), hh = Math.abs(c[3] - c[1]);
        if (o.fill) { ctx.fillStyle = resolveColor(o.fill); if (o.stipple) ctx.globalAlpha = 0.5; ctx.fillRect(x, y, ww, hh); ctx.globalAlpha = 1; }
        if (o.outline !== '' ) { stroke(); ctx.strokeStyle = resolveColor(o.outline) || '#000'; if ((o.width === 0)) break; ctx.strokeRect(x, y, ww, hh); } break; }
      case 'oval': { ctx.beginPath(); ctx.ellipse((c[0] + c[2]) / 2, (c[1] + c[3]) / 2, Math.abs(c[2] - c[0]) / 2, Math.abs(c[3] - c[1]) / 2, 0, 0, 7); if (o.fill) { ctx.fillStyle = resolveColor(o.fill); ctx.fill(); } if (o.outline !== '') { stroke(); ctx.strokeStyle = resolveColor(o.outline) || '#000'; ctx.stroke(); } break; }
      case 'arc': { const cx = (c[0] + c[2]) / 2, cy = (c[1] + c[3]) / 2; const st = (+o.start || 0), ex = (+o.extent || 90); ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(c[2] - c[0]) / 2, Math.abs(c[3] - c[1]) / 2, 0, -st * Math.PI / 180, -(st + ex) * Math.PI / 180, ex > 0); if (o.fill) { ctx.fillStyle = resolveColor(o.fill); ctx.fill(); } stroke(); ctx.strokeStyle = resolveColor(o.outline || o.fill) || '#000'; ctx.stroke(); break; }
      case 'polygon': { if (c.length < 4) break; ctx.beginPath(); ctx.moveTo(c[0], c[1]); for (let i = 2; i < c.length; i += 2) ctx.lineTo(c[i], c[i + 1]); ctx.closePath();
        if (o.fill !== '' && o.fill != null) { ctx.fillStyle = resolveColor(o.fill); if (o.stipple) ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1; }
        if (o.outline) { stroke(); ctx.strokeStyle = resolveColor(o.outline); ctx.stroke(); } break; }
      case 'text': { const f = fontCss(o.font) || fontCss(['Segoe UI', 9]); ctx.font = f.css; ctx.fillStyle = resolveColor(o.fill) || '#000'; let txt = String(o.text ?? ''); const an = o.anchor || 'center';
        const lines = txt.split('\n'); const lh = f.px * 1.25; const wmax = Math.max(...lines.map((l) => ctx.measureText(l).width)); const hh = lh * lines.length;
        ctx.translate(c[0], c[1]); if (o.angle) ctx.rotate(-(+o.angle) * Math.PI / 180);
        let ox = 0, oy = 0; if (an.includes('w')) ox = 0; else if (an.includes('e')) ox = -wmax; else ox = -wmax / 2; if (an.includes('n')) oy = 0; else if (an.includes('s')) oy = -hh; else oy = -hh / 2;
        ctx.textBaseline = 'top'; const just = o.justify || (an.includes('w') ? 'left' : an.includes('e') ? 'right' : 'center');
        lines.forEach((l, i) => { const lw = ctx.measureText(l).width; const lx = just === 'left' ? ox : just === 'right' ? ox + wmax - lw : ox + (wmax - lw) / 2; ctx.fillText(l, lx, oy + i * lh); }); break; }
    }
    ctx.restore();
  }
}
function arrowHead(ctx, c, o) { const a = o.arrow; const n = c.length; const dr = (x0, y0, x1, y1) => { const ang = Math.atan2(y1 - y0, x1 - x0); const L = 10; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - L * Math.cos(ang - 0.4), y1 - L * Math.sin(ang - 0.4)); ctx.lineTo(x1 - L * Math.cos(ang + 0.4), y1 - L * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); };
  if (a === 'last' || a === 'both') dr(c[n - 4], c[n - 3], c[n - 2], c[n - 1]); if (a === 'first' || a === 'both') dr(c[2], c[3], c[0], c[1]); }
function bboxOf(w, it) {
  const c = it.c, o = it.o;
  if (it.type === 'text') { const f = fontCss(o.font) || fontCss(['Segoe UI', 9]); ctxM.font = f.css; const lines = String(o.text ?? '').split('\n'); const ww = Math.max(...lines.map((l) => ctxM.measureText(l).width)); const hh = f.px * 1.25 * lines.length; const an = o.anchor || 'center';
    const x0 = an.includes('w') ? c[0] : an.includes('e') ? c[0] - ww : c[0] - ww / 2; const y0 = an.includes('n') ? c[1] : an.includes('s') ? c[1] - hh : c[1] - hh / 2; return [x0, y0, x0 + ww, y0 + hh]; }
  if (it.type === 'window') { const k = W.get(o.window); const r = k && k.box.getBoundingClientRect(); return [c[0], c[1], c[0] + (r ? r.width : 0), c[1] + (r ? r.height : 0)]; }
  const xs = c.filter((_, i) => i % 2 === 0), ys = c.filter((_, i) => i % 2 === 1); const hw = (+o.width || 1) / 2; return [Math.min(...xs) - hw, Math.min(...ys) - hw, Math.max(...xs) + hw, Math.max(...ys) + hw];
}
T.cv_bbox = (id, ij) => { const w = W.get(id); let b = null; JSON.parse(ij).forEach((i) => { const it = w.items.get(i); if (!it) return; const q = bboxOf(w, it); b = b ? [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])] : q; }); return JSON.stringify(b ? b.map(Math.round) : null); };
function hit(w, it, x, y) {
  const c = it.c, o = it.o; const b = bboxOf(w, it);
  switch (it.type) {
    case 'text': case 'window': case 'image': return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];
    case 'rectangle': case 'oval': { if (o.fill) return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]; const t = 3; const inb = x >= b[0] - t && x <= b[2] + t && y >= b[1] - t && y <= b[3] + t; const inn = x > b[0] + t && x < b[2] - t && y > b[1] + t && y < b[3] - t; return inb && !inn; }
    case 'polygon': { let ins = false; for (let i = 0, j = c.length - 2; i < c.length; j = i, i += 2) { if (((c[i + 1] > y) !== (c[j + 1] > y)) && (x < (c[j] - c[i]) * (y - c[i + 1]) / (c[j + 1] - c[i + 1]) + c[i])) ins = !ins; } if (ins && (o.fill !== '')) return true; return distPoly(c, x, y, true) < 3; }
    case 'line': return distPoly(c, x, y, false) < 3 + (+o.width || 1) / 2;
  }
  return false;
}
function distPoly(c, x, y, close) { let m = 1e9; const n = c.length; for (let i = 0; i + 3 < n || (close && i < n); i += 2) { const x0 = c[i], y0 = c[i + 1]; const j = (i + 2) % n; if (!close && i + 3 >= n) break; const x1 = c[j], y1 = c[j + 1]; const dx = x1 - x0, dy = y1 - y0; const l2 = dx * dx + dy * dy; let t = l2 ? ((x - x0) * dx + (y - y0) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); m = Math.min(m, Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy))); } return m; }
function topItem(w, x, y) { for (let k = w.order.length - 1; k >= 0; k--) { const it = w.items.get(w.order[k]); if (it && it.type !== 'window' && hit(w, it, x, y)) return it; } return null; }
T.cv_closest = (id, x, y) => { const w = W.get(id); let best = null, bd = 1e9; for (const it of w.items.values()) { const b = bboxOf(w, it); const d = Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3])); if (d <= bd) { bd = d; best = it; } } return best ? best.id : 0; };
T.cv_overlap = (id, x0, y0, x1, y1) => { const w = W.get(id); const r = []; for (const it of w.items.values()) { const b = bboxOf(w, it); if (b[2] >= x0 && b[0] <= x1 && b[3] >= y0 && b[1] <= y1) r.push(it.id); } return JSON.stringify(r); };
function canvasTagEvent(w, ev, raw) {
  if (!w || w.cls !== 'Canvas' || !w.tagb.size) return false;
  const r = w.box.getBoundingClientRect(); const x = raw.clientX - r.left + w.ox, y = raw.clientY - r.top + w.oy;
  const it = topItem(w, x, y); if (!it) return false;
  let stop = false;
  for (const key of w.tagb) { const [tag, seq] = key.split('\u0001'); if (!it.tags.includes(tag) && String(it.id) !== tag) continue; const pr = w._tp[seq]; if (!pr || !evMatch(pr, ev)) continue;
    const pl = evPayload(raw, ev, w); pl.x = Math.round(raw.clientX - r.left); pl.y = Math.round(raw.clientY - r.top); pl.tag = tag; const res = T.pyEvent.call(null, w.id, seq, JSON.stringify(pl)); if (res === 'break') stop = true; }
  return stop;
}

/* ---------------- dosya / indirme */
T.queue_download = (path, name) => { downloads.set(path, { name, m: 0 }); };
function flushDownloads() {
  const FS = window.pyodide && window.pyodide.FS; if (!FS) return;
  for (const [p, d] of downloads) { try { const st = FS.stat(p); if (st.mtime.getTime() !== d.m && st.size >= 0) { d.m = st.mtime.getTime(); const data = FS.readFile(p); const blob = new Blob([data]); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = d.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); FS.unlink(p); d.m = 0; } } catch (e) { /* dosya yok */ } }
}
T.pick_file = (tur, oj) => { const o = JSON.parse(oj); const inp = document.createElement('input'); inp.type = 'file';
  const exts = []; (o.filetypes || []).forEach((ft) => { (Array.isArray(ft) ? ft.slice(1) : []).forEach((p) => String(p).split(/[ ;]+/).forEach((e) => { if (e && e !== '*.*' && e !== '*') exts.push(e.replace('*', '')); })); });
  if (exts.length) inp.accept = exts.join(',');
  inp.onchange = async () => { const f = inp.files[0]; if (!f) return; const buf = new Uint8Array(await f.arrayBuffer()); const FS = window.pyodide.FS; try { FS.mkdir('/tmp/yukle'); } catch (e) {} const p = '/tmp/yukle/' + f.name; FS.writeFile(p, buf); dlg(() => T.pyFile.call(null, tur, p)); flushDownloads(); };
  inp.click(); };
})();
