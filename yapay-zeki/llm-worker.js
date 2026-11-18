/* Yapay Zeki · cihazda çalışan dil modeli işçisi (Transformers.js, WebGPU)
   { id, tip: 'yukle', model }            → ilerleme… → bitti { cihaz }
   { id, tip: 'uret', mesajlar, enCok }   → parca… → bitti (tam metin) */
import { pipeline, TextStreamer, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';

env.allowLocalModels = false;
env.useBrowserCache = true;

let GEN = null, MODEL = null, CIHAZ = null;
const dosyalar = {};

async function yukle(id, model) {
  if (GEN && MODEL === model) return;
  if (GEN) { try { await GEN.dispose(); } catch (e) { } GEN = null; }
  const ilerle = p => {
    if (p.status !== 'progress') return;
    dosyalar[p.file] = [p.loaded || 0, p.total || 0];
    let y = 0, t = 0; for (const k in dosyalar) { y += dosyalar[k][0]; t += dosyalar[k][1]; }
    postMessage({ id, tip: 'ilerleme', yuklenen: y, toplam: t });
  };
  let gpu = false;
  try { gpu = !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (e) { }
  if (!gpu) throw new Error('WEBGPU_YOK');
  GEN = await pipeline('text-generation', model, { dtype: 'q4f16', device: 'webgpu', progress_callback: ilerle });
  MODEL = model; CIHAZ = 'webgpu';
  /* ısınma: ilk üretim yavaş olur */
  await GEN([{ role: 'user', content: 'Merhaba' }], { max_new_tokens: 2, do_sample: false });
}

self.onmessage = async ({ data: m }) => {
  const { id } = m;
  try {
    if (m.tip === 'yukle') { await yukle(id, m.model); postMessage({ id, tip: 'bitti', sonuc: { cihaz: CIHAZ } }); }
    else if (m.tip === 'uret') {
      if (!GEN) throw new Error('Model yüklenmedi');
      const streamer = new TextStreamer(GEN.tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: t => postMessage({ id, tip: 'parca', metin: t }) });
      const r = await GEN(m.mesajlar, { max_new_tokens: m.enCok || 160, do_sample: true, temperature: 0.6, top_p: 0.9, repetition_penalty: 1.1, streamer });
      const son = r[0].generated_text; postMessage({ id, tip: 'bitti', sonuc: Array.isArray(son) ? son.at(-1).content : String(son) });
    }
  } catch (e) { postMessage({ id, tip: 'hata', mesaj: String((e && e.message) || e) }); }
};
