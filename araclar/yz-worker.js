/* erdevelop · tarayıcıda yapay zekâ işçisi (Transformers.js)
   Sayfalar bunu  new Worker('yz-worker.js', { type: 'module' })  ile açar.
   Mesajlar: { id, tip: 'yukle'|'asr'|'gom'|'tok'|'cevir', ... }  →  { id, tip: 'ilerleme'|'bitti'|'hata', ... }
   Modeller tarayıcının önbelleğine bir kez iner; ses, metin ve belgeler cihazdan çıkmaz. */
import { pipeline, AutoTokenizer, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';

env.allowLocalModels = false;
env.useBrowserCache = true;

const HAZIR = {};
const ilerleme = id => p => {
  if (p && p.status === 'progress') postMessage({ id, tip: 'ilerleme', dosya: p.file, yuklenen: p.loaded, toplam: p.total });
};

/* cihaz 'webgpu': konuşma tanıma ekran kartında (Whisper: kodlayıcı fp16, çözücü q4 — işlemcideki q8'den 5-10 kat hızlı) */
async function yukle(id, gorev, model, cihaz) {
  const gpu = cihaz === 'webgpu', k = gorev + '|' + model + (gpu ? '|gpu' : '');
  if (!HAZIR[k]) HAZIR[k] = (gorev === 'tokenizer'
    ? AutoTokenizer.from_pretrained(model, { progress_callback: ilerleme(id) })
    : gpu ? pipeline(gorev, model, { device: 'webgpu', dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' }, progress_callback: ilerleme(id) })
      : pipeline(gorev, model, { dtype: 'q8', device: 'wasm', progress_callback: ilerleme(id) })
  ).catch(e => { delete HAZIR[k]; throw e; });
  return HAZIR[k];
}

self.onmessage = async ({ data: m }) => {
  const { id } = m;
  try {
    if (m.tip === 'yukle') {
      const p = await yukle(id, m.gorev, m.model, m.cihaz);
      /* ısınma: ekran kartında ilk çalıştırma gölgelendiricileri derler; konuşmadan önce yapılsın */
      if (m.isit && m.gorev === 'automatic-speech-recognition') { try { await p(new Float32Array(16000), { language: m.dil || 'turkish' }); } catch (e) { } }
      postMessage({ id, tip: 'bitti' });
    } else if (m.tip === 'asr') {
      const asr = await yukle(id, 'automatic-speech-recognition', m.model, m.cihaz);
      const t0 = performance.now();
      /* kısa komutlarda (<28 sn) parçalama ve zaman damgası gereksiz; hem yavaşlatır hem uydurmayı artırır */
      const kisa = m.kisa && m.ses.length < 16000 * 28; /* yalnızca Zeki komutları; Ses↔Yazı aracı altyazı için zaman damgası ister */
      const ops = kisa ? { task: m.gorev || 'transcribe' } : { task: m.gorev || 'transcribe', chunk_length_s: 30, stride_length_s: 5, return_timestamps: true };
      if (m.dil) ops.language = m.dil;
      const r = await asr(m.ses, ops);
      postMessage({ id, tip: 'bitti', sonuc: { text: r.text, chunks: r.chunks || [], sure: (performance.now() - t0) / 1000 } });
    } else if (m.tip === 'gom') {
      const f = await yukle(id, 'feature-extraction', m.model);
      const out = [], N = m.metinler.length, B = 8;
      for (let i = 0; i < N; i += B) {
        const t = await f(m.metinler.slice(i, i + B), { pooling: 'mean', normalize: true });
        const d = t.dims[1], v = t.data;
        for (let j = 0; j < t.dims[0]; j++) out.push(Array.from(v.subarray(j * d, (j + 1) * d)));
        postMessage({ id, tip: 'adim', yapilan: Math.min(N, i + B), toplam: N });
      }
      postMessage({ id, tip: 'bitti', sonuc: out });
    } else if (m.tip === 'cevir') {
      /* m.metinler: cümle listesi; boş dize paragraf arasıdır, olduğu gibi döner */
      const tr = await yukle(id, 'translation', m.model), out = [], N = m.metinler.length;
      for (let i = 0; i < N; i++) {
        const s = m.metinler[i];
        if (!s || !/\p{L}/u.test(s)) out.push(s);
        else { const r = await tr(s, { src_lang: m.kaynak, tgt_lang: m.hedef, max_new_tokens: Math.min(512, 24 + s.length) }); out.push(r[0].translation_text); }
        postMessage({ id, tip: 'adim', yapilan: i + 1, toplam: N, son: out[i] });
      }
      postMessage({ id, tip: 'bitti', sonuc: out });
    } else if (m.tip === 'tok') {
      const tk = await yukle(id, 'tokenizer', m.model);
      const ids = tk.encode(m.metin, { add_special_tokens: false });
      let parcalar = null;
      if (m.parca) {
        /* tokenleri okunur parçalara çevir: çok baytlı harfler birden çok tokene bölünebilir; tam harf çıkana kadar birleştir */
        parcalar = []; let tampon = [];
        const sinir = Math.min(ids.length, m.parca);
        for (let i = 0; i < sinir; i++) {
          tampon.push(ids[i]);
          const s = tk.decode(tampon, { skip_special_tokens: true, clean_up_tokenization_spaces: false });
          if (!s.includes('�') || tampon.length > 4) { parcalar.push([s, tampon.length]); tampon = []; }
        }
        if (tampon.length) parcalar.push([tk.decode(tampon, { clean_up_tokenization_spaces: false }), tampon.length]);
      }
      postMessage({ id, tip: 'bitti', sonuc: { sayi: ids.length, parcalar } });
    }
  } catch (e) {
    postMessage({ id, tip: 'hata', mesaj: String((e && e.message) || e) });
  }
};
