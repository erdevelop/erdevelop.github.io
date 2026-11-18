/* erdevelop · yapay zekâ araçları için ortak istemci (yz-worker.js ile konuşur)
   YZ.cagir({ tip, ... }, { ilerleme(mb, toplamMb), adim(yapilan, toplam) }) → Promise(sonuc)
   YZ.kayitli(model) → önbellekte var mı;  YZ.sil(model) → önbellekten siler
   YZ.panel(el, { model, gorev, mb, ad, hazir(), cihaz }) → "modeli indir" kutusunu kurar */
(function () {
  'use strict';
  const CACHE = 'transformers-cache';
  let W = null, sira = 0; const bekleyen = {};
  const yzSrc = document.currentScript && document.currentScript.src;
  function cagir(msg, cb) {
    return new Promise((ok, no) => {
      if (!window.Worker) return no(new Error('Bu tarayıcı Web Worker desteklemiyor'));
      const id = ++sira; bekleyen[id] = { ok, no, cb: cb || {}, dosyalar: {} };
      try { isciAc().postMessage(Object.assign({ id }, msg), msg.ses ? [msg.ses.buffer] : []); } catch (e) { delete bekleyen[id]; no(e); }
    });
  }
  function isciAc() {
    if (W) return W;
    W = new Worker(new URL('yz-worker.js', yzSrc || location.href), { type: 'module' });
    W.onmessage = ({ data: m }) => {
      const b = bekleyen[m.id]; if (!b) return;
      if (m.tip === 'ilerleme') {
        b.dosyalar[m.dosya] = [m.yuklenen || 0, m.toplam || 0];
        let y = 0, t = 0; for (const k in b.dosyalar) { y += b.dosyalar[k][0]; t += b.dosyalar[k][1]; }
        b.cb.ilerleme && b.cb.ilerleme(y / 1048576, t / 1048576);
      } else if (m.tip === 'adim') b.cb.adim && b.cb.adim(m.yapilan, m.toplam, m.son);
      else { delete bekleyen[m.id]; m.tip === 'hata' ? b.no(new Error(m.mesaj)) : b.ok(m.sonuc); }
    };
    W.onerror = e => { e.preventDefault && e.preventDefault(); const err = new Error(e.message || 'Yapay zekâ çalışma motoru açılamadı'); for (const k in bekleyen) { bekleyen[k].no(err); delete bekleyen[k]; } W = null; };
    return W;
  }
  async function anahtarlar(model) {
    try { const c = await caches.open(CACHE); return (await c.keys()).filter(r => r.url.includes('/' + model + '/')); } catch (e) { return []; }
  }
  const kayitli = async model => (await anahtarlar(model)).length > 0;
  async function sil(model) { try { const c = await caches.open(CACHE); for (const r of await anahtarlar(model)) await c.delete(r); } catch (e) { } }
  const T = (a, b) => window.erDil ? erDil.t(a, b) : a;
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString(window.erDil && erDil.lang === 'en' ? 'en-GB' : 'tr-TR');

  /* model kutusu: el içine kurar. o: { model, gorev, mb, ad, hazir(), mesajHazir } ; model değişebilir (o.model() fonksiyon olabilir) */
  function panel(el, o) {
    const md = () => typeof o.model === 'function' ? o.model() : o.model, cz = () => typeof o.cihaz === 'function' ? o.cihaz() : o.cihaz, mb = () => typeof o.mb === 'function' ? o.mb() : o.mb;
    el.innerHTML = `<h3>${T('Yapay zekâ modeli', 'AI model')}</h3><p class="ph yz-msg" style="margin:6px 0 0"></p>
      <div class="yz-uyari" hidden><div class="stat"><div><b class="yz-mb"></b><span>${T('bir kez indirilir', 'downloaded once')}</span></div><div><b>${T('cihazında', 'on device')}</b><span>${T('çalışır', 'runs')}</span></div><div><b>0</b><span>${T('veri gönderilir', 'data uploaded')}</span></div></div>
      <p class="hint">${T('Model tarayıcının önbelleğinde saklanır; sonraki açılışlarda yeniden indirilmez. Mobil veride isen Wi-Fi öneririm.', 'The model is kept in the browser cache and not downloaded again next time. Wi-Fi is recommended on mobile data.')}</p>
      <div class="btns"><button class="btn yz-indir" type="button"></button></div></div>
      <div class="yz-ilerleme" hidden><div class="bar"><i></i></div><p class="hint yz-txt"></p></div>
      <p class="hint yz-sil" hidden><a href="#">${T('Kayıtlı modeli sil', 'Delete the saved model')}</a></p>`;
    const q = s => el.querySelector(s), msg = t => q('.yz-msg').textContent = t;
    let hazir = false;
    async function durum() {
      q('.yz-mb').textContent = '≈ ' + mb() + ' MB';
      q('.yz-indir').textContent = T('Modeli indir ve başlat', 'Download and start the model') + ' (≈ ' + mb() + ' MB)';
      if (hazir) { msg('✓ ' + (o.mesajHazir || T('Model hazır.', 'Model ready.'))); q('.yz-uyari').hidden = true; q('.yz-sil').hidden = false; return; }
      if (await kayitli(md())) { msg(T('Model bu tarayıcıda kayıtlı; açılıyor…', 'The model is saved in this browser; opening…')); q('.yz-uyari').hidden = true; baslat(); }
      else { msg(T('Model henüz indirilmedi.', 'The model has not been downloaded yet.')); q('.yz-uyari').hidden = false; q('.yz-sil').hidden = true; }
    }
    async function baslat() {
      q('.yz-uyari').hidden = true; q('.yz-ilerleme').hidden = false;
      const bar = q('.bar i'), txt = q('.yz-txt'); txt.textContent = T('Çalışma motoru yükleniyor…', 'Loading the runtime…'); bar.style.width = '2%';
      try {
        await cagir({ tip: 'yukle', gorev: o.gorev, model: md(), cihaz: cz() }, { ilerleme: (y, t) => { const tt = Math.max(t, y); bar.style.width = (tt ? Math.min(100, y / tt * 100) : 5) + '%'; txt.textContent = T('Model indiriliyor: ', 'Downloading model: ') + f1(y) + (tt ? ' / ' + f1(tt) : '') + ' MB'; } });
        hazir = true; q('.yz-ilerleme').hidden = true; o.hazir && o.hazir();
      } catch (e) {
        q('.yz-ilerleme').hidden = true; q('.yz-uyari').hidden = false;
        msg(T('Model yüklenemedi: ', 'Could not load the model: ') + (e.message || e) + T('. İnternet bağlantını kontrol edip tekrar dene.', '. Check your internet connection and try again.'));
        return;
      }
      durum();
    }
    q('.yz-indir').onclick = baslat;
    q('.yz-sil a').onclick = async e => { e.preventDefault(); if (!confirm(T('Kayıtlı model silinsin mi? Bir sonraki kullanımda yeniden indirilir.', 'Delete the saved model? It will be downloaded again next time.'))) return; await sil(md()); hazir = false; if (o.silindi) o.silindi(); durum(); };
    durum();
    return { hazirMi: () => hazir, sifirla: () => { hazir = false; durum(); }, baslat };
  }

  window.YZ = { cagir, kayitli, sil, panel };
})();
