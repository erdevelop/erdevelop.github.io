/* CODE sayfası · Python çalıştırıcı (Web Worker)
   Pyodide burada çalışır: sayfa donmaz, "Durdur" worker'ı sonlandırır.
   input(): sayfaya soru gönderilir, cevap code/sw.js servis çalışanı üzerinden eşzamanlı (sync XHR) alınır. */
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
importScripts(PYODIDE + 'pyodide.js');

let py = null, ns = null, seq = 0;
const post = (t, o = {}) => postMessage({ t, ...o });
const dec = new TextDecoder(), dec2 = new TextDecoder();

function syncInput(q) {
  const id = Date.now().toString(36) + (++seq);
  post('input', { id, q });
  const x = new XMLHttpRequest();
  try {
    x.open('GET', 'sw-girdi?id=' + id, false); // code/sw.js yanıtlar (kullanıcı cevap verince)
    x.send(null);
  } catch (e) { throw new Error('girdi alınamadı (servis çalışanı yok): ' + e.message); }
  if (x.status !== 200) throw new Error('girdi alınamadı (' + x.status + ')');
  const v = x.responseText;
  if (v === '\u0004') return null; // iptal → EOF
  return v;
}

const PRELUDE = `
import sys, io, base64, builtins, warnings, timeit as _timeit
warnings.filterwarnings('ignore', message=r'(?s).*Pyarrow will become a required dependency')
from js import __er_post
def display(*objs):
    """Jupyter benzeri gösterim: DataFrame tablo, grafik resim, diğerleri repr."""
    for o in objs:
        if type(o).__module__.startswith('plotly') and hasattr(o, 'to_json'):
            __er_post('plotly', o.to_json()); continue
        h = getattr(o, '_repr_html_', None)
        if callable(h):
            try:
                s = h()
                if s:
                    __er_post('html', s); continue
            except Exception:
                pass
        print(repr(o))
builtins.display = display
def __er_last(o):
    items = o if isinstance(o, (list, tuple)) and o else [o]
    if all(type(x).__module__.split('.')[0] == 'matplotlib' for x in items): return
    display(o)
def __er_figs():
    plt = sys.modules.get('matplotlib.pyplot')
    if not plt: return
    for n in plt.get_fignums():
        f = plt.figure(n)
        b = io.BytesIO(); f.savefig(b, format='png', dpi=110, bbox_inches='tight')
        s = io.StringIO(); f.savefig(s, format='svg', bbox_inches='tight')
        __er_post('img', base64.b64encode(b.getvalue()).decode(), s.getvalue())
    plt.close('all')
def __er_patch():
    plt = sys.modules.get('matplotlib.pyplot')
    if plt and getattr(plt.show, '__name__', '') != '__er_show':
        def __er_show(*a, **k): __er_figs()
        plt.show = __er_show
def __er_plotly():
    try:
        import plotly.io as pio
        if 'erdevelop' not in pio.renderers:
            from plotly.io._base_renderers import ExternalRenderer
            class _R(ExternalRenderer):
                def render(self, fig_dict):
                    import json, plotly
                    __er_post('plotly', json.dumps(fig_dict, cls=plotly.utils.PlotlyJSONEncoder))
            pio.renderers['erdevelop'] = _R()
        pio.renderers.default = 'erdevelop'
    except Exception as e:
        print('plotly ayarlanamadı:', e, file=sys.stderr)
def __er_fmt_t(s):
    for u, k in (('sn', 1), ('ms', 1e-3), ('µs', 1e-6), ('ns', 1e-9)):
        if s >= k or u == 'ns': return f"{s / k:.3g} {u}"
def __er_timeit(stmt, g):
    t = _timeit.Timer(stmt, globals=g)
    n, _ = t.autorange()
    r = [x / n for x in t.repeat(repeat=5, number=n)]
    m = sum(r) / len(r); sd = (sum((x - m) ** 2 for x in r) / len(r)) ** .5
    print(f"{__er_fmt_t(m)} ± {__er_fmt_t(sd)} / döngü (5 tekrar × {n} döngü)")
def __er_time(stmt, g):
    import time
    t0 = time.perf_counter(); exec(stmt, g); print(f"süre: {__er_fmt_t(time.perf_counter() - t0)}")
def __er_complete(expr, prefix, g):
    import keyword, rlcompleter
    if expr:
        try: obj = eval(expr, g)
        except Exception: return []
        names = dir(obj)
        return sorted({n for n in names if n.startswith(prefix) and (prefix.startswith('_') or not n.startswith('_'))})[:200]
    names = set(g) | set(dir(builtins)) | set(keyword.kwlist)
    return sorted(n for n in names if n.startswith(prefix) and not n.startswith('__'))[:200]
`;

/* %timeit ve %time satırlarını Python'a çevir */
const magics = src => src.replace(/^([ \t]*)%(timeit|time)[ \t]+(.+)$/gm, (m, ind, k, stmt) => `${ind}__er_${k}(${JSON.stringify(stmt)}, globals())`);

const H = {
  async init() {
    py = await loadPyodide({ indexURL: PYODIDE });
    py.setStdout({ write: b => { post('out', { s: dec.decode(b, { stream: true }) }); return b.length; } });
    py.setStderr({ write: b => { post('out', { s: dec2.decode(b, { stream: true }), cls: 'err' }); return b.length; } });
    py.setStdin({ stdin: () => { const v = syncInput(''); return v === null ? null : v + '\n'; }, isatty: true });
    self.__er_post = (k, a, b) => post(k, { a, b });
    py.runPython(PRELUDE);
    // input() yerine: soruyu konsola yaz, cevabı ayrıca al (soru ve cevap aynı satırda)
    py.globals.set('__er_input', q => syncInput(String(q)));
    py.runPython(`
def __er_inp(prompt=''):
    v = __er_input(str(prompt))
    if v is None: raise EOFError('girdi iptal edildi')
    return v
builtins.input = __er_inp`);
    return 'Python ' + py.runPython('import sys; sys.version.split()[0]') + ' · Pyodide ' + py.version;
  },
  imports({ src }) {
    const fi = py.pyodide_py.code.find_imports(src), mods = fi.toJs(); fi.destroy();
    return { mods, loaded: Object.keys(py.loadedPackages) };
  },
  async load({ src }) {
    await py.loadPackagesFromImports(src, { messageCallback: m => /Loading|Loaded/.test(m) && post('status', { s: m.slice(0, 60) }), errorCallback: m => post('out', { s: m + '\n', cls: 'warn' }) });
    if (/\bmatplotlib\b/.test(src)) py.runPython("import os; os.environ['MPLBACKEND']='AGG'\nimport matplotlib; matplotlib.use('AGG')\nimport matplotlib.pyplot\n__er_patch()");
    if (/\bplotly\b/.test(src)) {
      if (!py.loadedPackages.plotly) { const mp = py.pyimport('micropip'); await mp.install('plotly==5.24.1'); mp.destroy(); }
      py.runPython('__er_plotly()');
    }
  },
  files({ files }) {
    for (const f of files) py.FS.writeFile(f.n, f.c);
    const mods = files.filter(f => /\.py$/.test(f.n)).map(f => f.n.slice(0, -3));
    if (mods.length) py.runPython(`import sys, importlib\nimportlib.invalidate_caches()\nfor m in ${JSON.stringify(mods)}: sys.modules.pop(m, None)`);
  },
  async run({ src, file, fresh }) {
    if (fresh || !ns) { if (ns) ns.destroy(); ns = py.globals.get('dict')(); ns.set('__name__', '__main__'); }
    try {
      const r = await py.runPythonAsync(magics(src), { globals: ns, filename: file });
      if (r !== undefined) { const f = py.globals.get('__er_last'); f(r); f.destroy(); if (r && typeof r.destroy === 'function') r.destroy(); }
    } catch (e) {
      const lines = String(e.message || e).split('\n'), i = lines.findIndex(l => l.includes(`File "${file}"`));
      throw new Error(i < 0 ? String(e.message || e).trimEnd() : ['Traceback (most recent call last):', ...lines.slice(i)].join('\n').trimEnd());
    } finally { try { py.runPython('__er_figs()'); } catch (e) {} }
    let mem = 0; try { mem = py._module.HEAP8.length; } catch (e) {}
    return { mem };
  },
  complete({ expr, prefix }) {
    if (!ns) { ns = py.globals.get('dict')(); ns.set('__name__', '__main__'); }
    const f = py.globals.get('__er_complete'), r = f(expr, prefix, ns), out = r.toJs(); r.destroy(); f.destroy();
    return out;
  },
  async format({ src }) {
    if (!py.loadedPackages.micropip) await py.loadPackage('micropip');
    const has = py.runPython("import importlib.util; importlib.util.find_spec('black') is not None");
    if (!has) { const mp = py.pyimport('micropip'); await mp.install('black==24.8.0'); mp.destroy(); }
    py.globals.set('__er_src', src);
    return py.runPython("import black\nblack.format_str(__er_src, mode=black.Mode(line_length=100))");
  }
};

onmessage = async e => {
  const d = e.data || {};
  if (!H[d.t]) return;
  try { const r = await H[d.t](d); post('done', { id: d.id, r }); }
  catch (err) { post('done', { id: d.id, err: String(err && err.message || err) }); }
};
