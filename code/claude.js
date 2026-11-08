/* CODE sayfası · "Claude'a sor" paneli
   Kodu açıklatma, hata düzeltme, iyileştirme, test yazma ve serbest soru.
   İstek doğrudan tarayıcıdan Anthropic API'ye gider; kullanıcının kendi API anahtarı kullanılır
   (sunucu yok). Anahtar varsayılan olarak yalnızca bu sekme açıkken tutulur (sessionStorage). */
(() => {
  const SDK = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.137.0/+esm';
  const MODELS = [['claude-opus-5-5', 'Claude Opus 5.5 (en iyi)'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (hızlı)'], ['claude-haiku-5-5', 'Claude Haiku 5.5 (en ucuz)']];
  const KEYK = 'erdevelop-code-claude-key', MODK = 'erdevelop-code-claude-model';
  let K = null, panel = null, Anthropic = null, history = [], streamCtl = null;

  const ss = { get: k => { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v, keep) => { try { sessionStorage.setItem(k, v); if (keep) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} },
    del: k => { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch (e) {} } };

  const ACTIONS = {
    explain: ['Açıkla', 'Bu kodu satır satır, Türkçe ve sade bir dille açıkla. Ne yaptığını, önemli kavramları ve dikkat edilmesi gereken yerleri anlat.'],
    fix: ['Hatayı düzelt', 'Kod hata veriyor (konsol çıktısı aşağıda). Hatanın nedenini kısaca açıkla ve düzeltilmiş kodun TAMAMINI tek bir kod bloğunda ver.'],
    improve: ['İyileştir', 'Bu kodu daha okunur, doğru ve verimli hale getir. Değişiklikleri madde madde açıkla ve iyileştirilmiş kodun TAMAMINI tek bir kod bloğunda ver.'],
    test: ['Test yaz', 'Bu kod için aynı dilde, sayfada çalıştırılabilecek basit testler/kontroller yaz (dış kütüphane kurmadan). Testleri tek bir kod bloğunda ver.'],
    comment: ['Yorum ekle', 'Koda Türkçe açıklayıcı yorum satırları ekle; kodun davranışını değiştirme. Kodun TAMAMINI tek bir kod bloğunda ver.']
  };

  function build() {
    panel = document.createElement('aside'); panel.className = 'ai'; panel.hidden = true;
    panel.setAttribute('aria-label', "Claude'a sor");
    panel.innerHTML = `
      <div class="aih"><b>✦ Claude’a sor</b><span class="sp"></span>
        <select class="mini sel" id="aiModel" title="Model">${MODELS.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>
        <button type="button" class="mini" id="aiKeyBtn" title="API anahtarı">🔑</button>
        <button type="button" class="mini" id="aiNew" title="Yeni sohbet">Yeni</button>
        <button type="button" class="mini" id="aiClose" title="Kapat">×</button></div>
      <div class="aikey" id="aiKey" hidden>
        <p>Bu özellik senin <b>Anthropic API anahtarınla</b> çalışır; istekler tarayıcından doğrudan Anthropic’e gider, ücret senin hesabına yazılır.
        Anahtar al: <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener">platform.claude.com</a></p>
        <input type="password" id="aiKeyIn" placeholder="sk-ant-…" autocomplete="off" spellcheck="false">
        <label class="chk"><input type="checkbox" id="aiKeep"> bu tarayıcıda hatırla (önerilmez: aynı sitedeki sayfalar okuyabilir)</label>
        <div class="row2"><button type="button" class="tb primary" id="aiKeySave">Kaydet</button><button type="button" class="tb" id="aiKeyDel">Anahtarı sil</button></div>
      </div>
      <div class="aiacts" id="aiActs">${Object.entries(ACTIONS).map(([k, [t]]) => `<button type="button" class="mini" data-a="${k}">${t}</button>`).join('')}</div>
      <div class="ailog" id="aiLog"><div class="aiempty">Kodunu açıklatabilir, hatayı düzelttirebilir ya da soru sorabilirsin.<br>Editörde bir bölüm seçersen yalnızca o bölüm üzerinde durulur.<br><small>Gönderilen: açık dosya, projedeki diğer küçük dosyalar ve son konsol çıktısı.</small></div></div>
      <form class="aiin" id="aiForm"><textarea id="aiQ" rows="2" placeholder="Soru yaz… (Enter gönderir, Shift+Enter yeni satır)"></textarea><button type="submit" class="tb primary" id="aiSend">Gönder</button></form>`;
    document.body.appendChild(panel);
    const $ = id => panel.querySelector('#' + id);
    $('aiModel').value = K.store.get(MODK) || MODELS[0][0];
    $('aiModel').onchange = () => K.store.set(MODK, $('aiModel').value);
    $('aiClose').onclick = () => toggle(false);
    $('aiNew').onclick = () => { stop(); history = []; $('aiLog').innerHTML = ''; };
    $('aiKeyBtn').onclick = () => { $('aiKey').hidden = !$('aiKey').hidden; if (!$('aiKey').hidden) $('aiKeyIn').focus(); };
    $('aiKeySave').onclick = () => { const v = $('aiKeyIn').value.trim(); if (!/^sk-ant-/.test(v)) return K.toast('geçerli bir anahtar değil (sk-ant- ile başlar)'); ss.set(KEYK, v, $('aiKeep').checked); $('aiKeyIn').value = ''; $('aiKey').hidden = true; K.toast('anahtar kaydedildi'); };
    $('aiKeyDel').onclick = () => { ss.del(KEYK); K.toast('anahtar silindi'); };
    $('aiActs').onclick = e => { const b = e.target.closest('button[data-a]'); if (b) ask(ACTIONS[b.dataset.a][1], ACTIONS[b.dataset.a][0], b.dataset.a); };
    $('aiForm').onsubmit = e => { e.preventDefault(); const q = $('aiQ').value.trim(); if (!q) return; $('aiQ').value = ''; ask(q, q); };
    $('aiQ').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('aiForm').requestSubmit(); } };
    $('aiLog').addEventListener('click', e => {
      const b = e.target.closest('button[data-cb]'); if (!b) return;
      const code = b.closest('.aicode').querySelector('code').textContent;
      if (b.dataset.cb === 'copy') navigator.clipboard.writeText(code).then(() => K.toast('kopyalandı'));
      else if (b.dataset.cb === 'apply') applyCode(code);
    });
  }
  function toggle(on) {
    if (!panel) build();
    panel.hidden = on === undefined ? !panel.hidden : !on;
    document.body.classList.toggle('aiopen', !panel.hidden);
    if (!panel.hidden) { if (!ss.get(KEYK)) panel.querySelector('#aiKey').hidden = false; panel.querySelector('#aiQ').focus(); }
  }
  function stop() { if (streamCtl) { try { streamCtl.abort(); } catch (e) {} streamCtl = null; } } // streamCtl = MessageStream

  /* bağlam: dil, açık dosya (veya seçim), diğer dosyalar, son konsol */
  function context(action) {
    const l = K.lang, R = K.L[l], w = K.getWs(l), files = K.wsFiles(l), act = files[w.act] || files[0];
    const sel = K.cm.getSelection();
    let ctx = `Dil: ${R.name}. Sayfa: tarayıcıda çalışan bir kod editörü (${l === 'python' ? 'Pyodide' : l === 'r' ? 'webR' : l === 'php' ? 'php-wasm' : l === 'ruby' ? 'ruby.wasm' : 'tarayıcı içi çalıştırıcı'}).\n`;
    ctx += `Açık dosya: ${act.n}${act.n === files[0].n ? ' (ana dosya, ▶ Çalıştır bunu çalıştırır)' : ''}\n\n<dosya ad="${act.n}">\n${act.c}\n</dosya>\n`;
    if (sel && sel.length > 3) ctx += `\nKullanıcının seçtiği bölüm (buna odaklan):\n<secim>\n${sel}\n</secim>\n`;
    let budget = 40000;
    for (const f of files) {
      if (f === act || f.n.endsWith('.ipynb')) continue;
      const body = f.c.length > 6000 ? f.c.slice(0, 6000) + '\n…(kısaltıldı)' : f.c;
      if (budget - body.length < 0) { ctx += `\n<dosya ad="${f.n}">(çok büyük, gönderilmedi)</dosya>\n`; continue; }
      budget -= body.length; ctx += `\n<dosya ad="${f.n}">\n${body}\n</dosya>\n`;
    }
    const conEl = R.out === 'frame' ? document.getElementById('conHtml') : K.con(l).el;
    let out = (conEl && conEl.innerText || '').trim();
    if (out) { out = out.slice(-5000); ctx += `\nSon konsol çıktısı:\n<konsol>\n${out}\n</konsol>\n`; }
    else if (action === 'fix') ctx += '\n(Konsolda çıktı yok; kodu inceleyerek olası hataları bul.)\n';
    return ctx;
  }

  async function ask(prompt, label, action) {
    if (!panel || panel.hidden) toggle(true);
    const key = ss.get(KEYK);
    if (!key) { panel.querySelector('#aiKey').hidden = false; panel.querySelector('#aiKeyIn').focus(); return K.toast('önce API anahtarını gir'); }
    stop();
    const log = panel.querySelector('#aiLog'); const empty = log.querySelector('.aiempty'); if (empty) empty.remove();
    const u = document.createElement('div'); u.className = 'aimsg u'; u.textContent = label; log.appendChild(u);
    const a = document.createElement('div'); a.className = 'aimsg a'; a.innerHTML = '<span class="aiwait">düşünüyor…</span>'; log.appendChild(a);
    log.scrollTop = log.scrollHeight;
    const first = !history.length || action;
    const content = first ? `${context(action)}\n\nİstek: ${prompt}` : prompt;
    const messages = [...history, { role: 'user', content }];
    let text = '';
    try {
      if (!Anthropic) Anthropic = (await import(SDK)).default;
      if (!window.marked) await K.loadScript('https://cdn.jsdelivr.net/npm/marked@14.1.3/marked.min.js').catch(() => {});
      const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
      const stream = client.beta.messages.stream({
        model: panel.querySelector('#aiModel').value,
        max_tokens: 16000,
        output_config: { effort: 'medium' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: 'Sen erdevelop CODE sayfasında çalışan bir programlama yardımcısısın. Kullanıcıya Türkçe, kısa ve net cevap ver. Kod verirken uygun dil etiketli tek bir ``` kod bloğu kullan; kullanıcı onu editöre tek tıkla uygulayabilir, bu yüzden kod bloğunda dosyanın tamamını ver. Sayfa tarayıcıda çalışır: Python için Pyodide (paketler import ile otomatik yüklenir, input() desteklenir), JavaScript için Web Worker (DOM yok, input() async bir yardımcıdır: await input("soru")), R için webR. Gereksiz uzun açıklama yapma.',
        messages
      });
      streamCtl = stream;
      let t = 0;
      stream.on('text', d => { text += d; if (!t) t = requestAnimationFrame(() => { t = 0; render(a, text, true); log.scrollTop = log.scrollHeight; }); });
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') text += '\n\n_(Model bu isteği yanıtlamadı.)_';
      else if (msg.stop_reason === 'max_tokens') text += '\n\n_(Yanıt uzunluk sınırında kesildi.)_';
      render(a, text, false);
      history = [...messages, { role: 'assistant', content: text || '(boş yanıt)' }];
      const u2 = msg.usage || {}; const note = document.createElement('div'); note.className = 'aiuse';
      note.textContent = `${msg.model} · ${u2.input_tokens || 0} girdi / ${u2.output_tokens || 0} çıktı token`; a.appendChild(note);
    } catch (e) {
      const m = String(e && e.message || e);
      const st = e && e.status;
      a.innerHTML = `<div class="aierr">${K.esc(st === 401 ? 'API anahtarı geçersiz (401). 🔑 ile yeniden gir.' : st === 429 ? 'Hız sınırı aşıldı (429). Biraz bekleyip tekrar dene.' : st === 529 || st === 503 ? 'Servis şu an yoğun. Biraz sonra tekrar dene.' : /abort/i.test(m) ? 'durduruldu' : 'Hata: ' + m.slice(0, 300))}</div>` + (text ? '' : '');
      if (text) render(a, text, false);
    } finally { streamCtl = null; log.scrollTop = log.scrollHeight; }
  }
  function render(el, md, live) {
    const html = window.marked ? window.marked.parse(md + (live ? ' ▍' : '')) : K.esc(md);
    el.innerHTML = html;
    el.querySelectorAll('script').forEach(s => s.remove());
    el.querySelectorAll('pre').forEach(pre => {
      const w = document.createElement('div'); w.className = 'aicode';
      pre.replaceWith(w); w.appendChild(pre);
      if (!live) { const b = document.createElement('div'); b.className = 'aicb'; b.innerHTML = '<button type="button" class="mini" data-cb="apply" title="Açık dosyanın içeriğini bu kodla değiştir (Ctrl+Z ile geri alınır)">Editöre uygula</button><button type="button" class="mini" data-cb="copy">Kopyala</button>'; w.appendChild(b); }
    });
  }
  function applyCode(code) {
    const cm = K.cm, sel = cm.getSelection();
    if (sel && sel.length > 3 && code.split('\n').length < cm.lineCount() * 0.6) cm.replaceSelection(code.replace(/\n$/, ''));
    else cm.replaceRange(code, CodeMirror.Pos(0, 0), CodeMirror.Pos(cm.lastLine()));
    cm.focus(); K.toast('editöre uygulandı (geri almak için Ctrl+Z)');
  }

  window.__ai = { init(core) { K = core; }, toggle, ask: (a) => ask(ACTIONS[a][1], ACTIONS[a][0], a) };
})();
