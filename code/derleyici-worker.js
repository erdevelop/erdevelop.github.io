/* CODE sayfası · C / C++ / Go çalıştırıcı (modül Web Worker)
   C   : xcc (küçük C derleyicisi, wasm)            · @basthon/xcc-wasm
   C++ : Clang 22 + LLD (WASI hedefi)               · @yowasp/clang
   Go  : yaegi Go yorumlayıcısı (WASI)              · @browserrun/go
   Derlenen/yorumlanan program yalnızca verilen dosyaları ve stdin/stdout'u görür (WASI kum havuzu).
   stdin: program girdi istediğinde sayfaya sorulur (code/sw.js üzerinden eşzamanlı). */
import { WASI, File, OpenFile, ConsoleStdout, PreopenDirectory } from 'https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/dist/index.js';

const XCC = 'https://cdn.jsdelivr.net/npm/@basthon/xcc-wasm@0.1.0/js/index.mjs';
const CLANG = 'https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js';
const YAEGI = 'https://cdn.jsdelivr.net/npm/@browserrun/go@0.1.0/yaegi.wasm';

const post = (t, o = {}) => postMessage({ t, ...o });
const enc = new TextEncoder();
let seq = 0, presetIn = null;

/* stdin satırı: önce girdi.txt içeriği, bitince kullanıcıya sor */
function readLine() {
  if (presetIn && presetIn.length) return presetIn.shift();
  if (presetIn) return null; // girdi.txt verildiyse, bitince EOF
  const id = Date.now().toString(36) + (++seq);
  post('input', { id });
  const x = new XMLHttpRequest();
  try { x.open('GET', 'sw-girdi?id=' + id, false); x.send(null); }
  catch (e) { post('out', { s: '(girdi alınamadı: servis çalışanı yok)\n', cls: 'warn' }); return null; }
  return x.status === 200 && x.responseText !== '\u0004' ? x.responseText : null;
}
class LiveStdin extends OpenFile {
  fd_read(size) {
    if (Number(this.file_pos) >= this.file.data.length) {
      const l = readLine();
      if (l !== null) { const b = enc.encode(l + '\n'), d = new Uint8Array(this.file.data.length + b.length); d.set(this.file.data); d.set(b, this.file.data.length); this.file.data = d; }
    }
    return super.fd_read(size);
  }
  fd_fdstat_get() { const r = super.fd_fdstat_get(); r.fdstat.filetype = 2; return r; } // karakter aygıtı (tty)
}
function streamOut(cls) { const d = new TextDecoder(); return new ConsoleStdout(b => post('out', { s: d.decode(b, { stream: true }), cls })); }
function runWasi(module, args, env, dirFiles) {
  const fds = [new LiveStdin(new File([])), streamOut(''), streamOut('err')];
  if (dirFiles) fds.push(new PreopenDirectory('/w', new Map(Object.entries(dirFiles).map(([n, c]) => [n, new File(enc.encode(c))]))));
  const wasi = new WASI(args, env, fds);
  return WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport }).then(inst => wasi.start(inst));
}

const cache = {};
const H = {
  /* ---- C (xcc) ---- */
  async load_c() {
    const X = cache.xcc || (cache.xcc = await import(XCC));
    cache.ccMod = cache.ccMod || await WebAssembly.compileStreaming(fetch(X.ccWasmURL));
    cache.rtMod = cache.rtMod || await WebAssembly.compileStreaming(fetch(X.runtimeWasmURL));
    return 'xcc (C99/C11 derleyicisi) · wasm';
  },
  async run_c({ src, stdin }) {
    const X = cache.xcc; presetIn = stdin;
    const dec = s => String(s).replace(/cell\[\d+\]/g, 'main.c');
    const repl = await X.CRepl.create({
      ccModule: cache.ccMod, runtimeModule: cache.rtMod, runtimeMap: X.runtimeMap, headers: X.headers,
      stdout: t => post('out', { s: t }), stderr: t => post('out', { s: dec(t), cls: 'err' }),
      stdin: () => { const l = readLine(); return l === null ? null : l + '\n'; }
    });
    const c = await repl.run(src);
    if (c.status !== 'ok') return { code: 1, phase: 'derleme' };
    const r = await repl.run('main()');
    if (r.status !== 'ok') return { code: 1, phase: 'çalışma' };
    const m = String(r.result || '').match(/\(int\)\s*(-?\d+)/);
    return { code: m ? +m[1] : 0 };
  },
  /* ---- C++ (clang) ---- */
  async load_cpp() {
    cache.clang = cache.clang || await import(CLANG);
    // ilk çağrı derleyici dosyalarını indirir; küçük bir derlemeyle ısıt
    let last = 0;
    await cache.clang.runClang(['clang++', '-c', 'x.cpp', '-o', 'x.o'], { 'x.cpp': 'int f(){return 1;}' }, {
      stdout: () => {}, stderr: () => {},
      fetchProgress: ({ doneLength, totalLength }) => { const p = Math.round(doneLength / totalLength * 100); if (p >= last + 5) { last = p; post('status', { s: `C++ derleyicisi indiriliyor… %${p}` }); } }
    });
    return 'Clang 22 (C++20) · WASI';
  },
  async run_cpp({ src, files, stdin, std }) {
    presetIn = stdin;
    const d = new TextDecoder(), all = { 'main.cpp': src, ...files };
    post('status', { s: 'derleniyor…' });
    let out;
    try {
      out = await cache.clang.runClang(['clang++', 'main.cpp', ...Object.keys(files).filter(n => /\.(cpp|cc|cxx)$/.test(n)), '-O1', '-std=' + (std || 'c++20'), '-fno-exceptions', '-D_LIBCPP_REMOVE_TRANSITIVE_INCLUDES', '-o', 'main.wasm'], all, {
        stdout: b => b && post('out', { s: d.decode(b) }), stderr: b => b && post('out', { s: d.decode(b), cls: 'err' })
      });
    } catch (e) { if (typeof e.code === 'number') return { code: e.code, phase: 'derleme' }; throw e; }
    post('status', { s: 'çalışıyor…' });
    const mod = await WebAssembly.compile(out['main.wasm']);
    const data = Object.fromEntries(Object.entries(files).filter(([n]) => !/\.(cpp|cc|cxx|h|hpp)$/.test(n)));
    const code = await runWasi(mod, ['main'], ['PWD=/w'], data);
    return { code };
  },
  /* ---- Go (yaegi) ---- */
  async load_go() {
    let last = 0;
    const r = await fetch(YAEGI);
    const total = +r.headers.get('content-length') || 7.2e6, reader = r.body.getReader(), parts = []; let got = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; const p = Math.min(99, Math.round(got / total * 100)); if (p >= last + 5) { last = p; post('status', { s: `Go yorumlayıcısı indiriliyor… %${p}` }); } }
    cache.yaegi = await WebAssembly.compile(await new Blob(parts).arrayBuffer());
    return 'yaegi (Go yorumlayıcısı) · WASI';
  },
  async run_go({ src, files, stdin }) {
    presetIn = stdin;
    const code = await runWasi(cache.yaegi, ['yaegi', 'run', '/w/main.go'], ['PWD=/w', 'HOME=/w'], { 'main.go': src, ...files });
    return { code };
  }
};

onmessage = async e => {
  const d = e.data || {};
  if (!H[d.t]) return;
  try { const r = await H[d.t](d); post('done', { id: d.id, r }); }
  catch (err) { post('done', { id: d.id, err: String(err && err.message || err) }); }
};
