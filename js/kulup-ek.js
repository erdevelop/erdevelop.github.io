/* erdevelop · dil kulüpleri ek bölümleri
   Yükleme sırası (kulüp sayfasında, ana betikten sonra):
     <script src="js/ek-en.js"></script>      ← dile özel içerik (window.KULUP_EK)
     <script src="js/gorevler.js"></script>
     <script src="js/kulup-ek.js"></script>   ← bu dosya
     <script src="js/altmenu.js"></script>
   Ekledikleri:
   📖 Okuma köşesi (kelimeye dokun → anlam, kartlara ekle; anlama soruları)
   ✍️ Yazma (Türkçesine bakıp yaz · dikte)
   📘 Gramer mini dersleri
   📈 İlerleme: özet, son 14 gün, günlük hedef, seviye testi, hatalarım, rozetler, haftalık lig
   ⚔️ Meydan okuma (60 sn kelime yarışı, linkle paylaşılır) — Yarışma bölümünde
   ★ Kartlarda kullanım sıklığı rozeti · ilk girişte tanıtım ve günlük hedef · yeni kelime paketleri
   Sayfanın global değişkenlerini kullanır: S, save, WORDS, TW, FREQ, TOPIC_TRACK, deck, keyOf, norm, DAYS, cur,
   addXP, setTab, nextCard, paintTrk, srcOpts, say, stopSpeak, TM, esc, nf, $, shuffle, pick, Cloud, weekKey. */
(function () {
  'use strict';
  const D = window.KULUP_EK;
  if (!D || typeof S === 'undefined' || typeof setTab !== 'function') return;
  const el = id => document.getElementById(id);
  const p2 = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const LVL = ['A1', 'A2', 'B1', 'B2'];
  /* simülasyon sekmesinin sayfadaki adı (İngilizcede Simülasyon, diğer kulüplerde Toplantı) */
  const simAd = () => { const b = document.querySelector('#tabs2 [data-t="sim"]'); return b ? b.textContent.trim().replace(/^\S+\s+/, '') : 'Simülasyon'; };
  const sayx = (t, r) => { try { say(t, r); } catch (e) { } };
  const E = S.ek = Object.assign({ hedef: 10, gun: {}, cnt: {}, okuma: {}, gramer: {}, seviye: null, hata: [], rozet: {}, tanit: 0, maxSt: 0, duello: [] }, S.ek || {});
  const sv = () => { S.ek = E; save(); };
  const HXP = { 5: 20, 10: 40, 20: 80 };
  const goalXp = () => HXP[E.hedef] || 40;

  /* bildirimden gelinmişse (?k=kelime) kartta o kelime kalsın, başka bir karta geçilmesin */
  function kartYenile() { if (/[?&]k=/.test(location.search) && typeof showWord === 'function') showWord(new URLSearchParams(location.search).get('k')); else nextCard(); }
  /* ---------------- yeni kelime paketleri ---------------- */
  if (D.KONU && typeof TOPIC_TRACK === 'object') Object.assign(TOPIC_TRACK, D.KONU);
  if (D.FREQ && typeof FREQ === 'object') Object.assign(FREQ, D.FREQ);
  if (Array.isArray(D.PAKET) && Array.isArray(WORDS)) {
    const have = new Set(WORDS.map(w => w[0].toLowerCase()));
    D.PAKET.forEach(w => { if (!have.has(w[0].toLowerCase())) { WORDS.push(w); have.add(w[0].toLowerCase()); } });
    try { paintTrk(); srcOpts(); kartYenile(); } catch (e) { }
  }
  /* sayfada kapalı bölümler varsa (ileri seviyeye bırakılan içerik) paketlerden gelenleri de ayıkla */
  const ARS = typeof ARSIV === 'object' ? ARSIV : {};
  if (typeof kapaliAyir === 'function') { kapaliAyir(); try { paintTrk(); srcOpts(); kartYenile(); } catch (e) { } }
  if (typeof KAPALI === 'object' && Array.isArray(D.OKUMA)) { ARS.OKUMA = D.OKUMA.filter(r => KAPALI.has(r.trk)); D.OKUMA = D.OKUMA.filter(r => !KAPALI.has(r.trk)); }

  /* ---------------- sözlük (okumada dokunulan kelime için) ---------------- */
  let DICT = null;
  function dict() {
    if (DICT) return DICT; DICT = new Map();
    const add = (en, tr) => { const k = artSil(String(en).toLowerCase()); if (k && tr && !DICT.has(k)) DICT.set(k, tr); const n = norm(k); if (n && tr && !DICT.has('~' + n)) DICT.set('~' + n, tr); };
    WORDS.forEach(w => add(w[0], w[1])); (typeof TW !== 'undefined' ? TW : []).forEach(w => add(w.en, w.tr)); (ARS.WORDS || []).forEach(w => add(w[0], w[1])); (ARS.TW || []).forEach(w => add(w.en, w.tr)); (S.my || []).forEach(w => add(w.en, w.tr)); Object.entries(D.SOZLUK || {}).forEach(([k, v]) => add(k, v));
    return DICT;
  }
  /* artikel / mastar eki ayıklama (dile göre) */
  const ART = new RegExp(D.ART || '^(to|the|a|an)\\s+', 'i'), ELI = D.ELIZYON ? new RegExp(D.ELIZYON, 'i') : null;
  const artSil = x => String(x).trim().replace(ART, '').replace(ART, '').trim();
  const IRR_EN = { went: 'go', gone: 'go', was: 'be', were: 'be', been: 'be', is: 'be', are: 'be', am: 'be', saw: 'see', seen: 'see', bought: 'buy', took: 'take', taken: 'take', made: 'make', did: 'do', done: 'do', does: 'do', had: 'have', has: 'have', got: 'get', came: 'come', gave: 'give', given: 'give', told: 'tell', thought: 'think', left: 'leave', found: 'find', felt: 'feel', kept: 'keep', met: 'meet', sent: 'send', spent: 'spend', built: 'build', brought: 'bring', children: 'child', people: 'person', men: 'man', women: 'woman', said: 'say', knew: 'know', known: 'know', began: 'begin', wrote: 'write', written: 'write', ran: 'run', sat: 'sit', stood: 'stand', heard: 'hear', held: 'hold', lost: 'lose', paid: 'pay', sold: 'sell', taught: 'teach', understood: 'understand', ate: 'eat', drank: 'drink', drove: 'drive', flew: 'fly', chose: 'choose', fell: 'fall', rang: 'ring', lent: 'lend', better: 'good', best: 'good', worse: 'bad', worst: 'bad', lifted: 'lift', put: 'put', cut: 'cut', set: 'set', led: 'lead', meant: 'mean', became: 'become', grew: 'grow', showed: 'show', shown: 'show' };
  const IRR = D.DUZENSIZ || IRR_EN;
  const KOK = D.KOK ? D.KOK.map(([a, b]) => [new RegExp(a, 'i'), b]) : [[/ies$/, 'y'], [/ied$/, 'y'], [/es$/, ''], [/s$/, ''], [/ed$/, ''], [/ed$/, 'e'], [/d$/, ''], [/ing$/, ''], [/ing$/, 'e'], [/(.)\1ing$/, '$1'], [/(.)\1ed$/, '$1'], [/er$/, ''], [/est$/, ''], [/ly$/, ''], [/ily$/, 'y']];
  function lemmas(w) {
    let x = w.toLowerCase().replace(/[’]/g, "'"); if (D.dil === 'en') x = x.replace(/'s$/, ''); if (ELI) x = x.replace(ELI, '');
    const out = [x]; if (IRR[x]) out.push(IRR[x]);
    KOK.forEach(([re, s]) => { if (re.test(x)) { const y = x.replace(re, s); if (y.length > 1) out.push(y); } });
    return [...new Set(out)];
  }
  function lookup(words, i) {
    const M = dict();
    for (const n of [3, 2]) { if (i + n > words.length) continue; for (let s = Math.max(0, i - n + 1); s <= i; s++) { if (s + n > words.length) continue; const ph = words.slice(s, s + n).join(' ').toLowerCase(); if (M.has(ph)) return { en: ph, tr: M.get(ph) }; const lm = lemmas(words[s + n - 1]).slice(1); for (const l2 of lm) { const ph2 = words.slice(s, s + n - 1).concat(l2).join(' ').toLowerCase(); if (M.has(ph2)) return { en: ph2, tr: M.get(ph2) }; } } }
    const L = lemmas(words[i]); for (const l of L) if (M.has(l)) return { en: l, tr: M.get(l) };
    for (const l of L) { const n = '~' + norm(l); if (M.has(n)) return { en: l, tr: M.get(n) }; }
    return { en: L[0], tr: '' };
  }

  /* ---------------- hata defteri ---------------- */
  function hata(tur, soru, dogru, verilen) { E.hata.unshift({ tur, soru, dogru, verilen: verilen || '', at: Date.now() }); if (E.hata.length > 120) E.hata.length = 120; sv(); }

  /* ---------------- stil ---------------- */
  const css = document.createElement('style');
  css.textContent = `
.ek h3{margin:0 0 6px;font:700 1.05rem var(--f-display)} .ek .sub{color:var(--muted);font-size:13px;margin:0 0 12px}
.ek .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.ek .it{display:flex;flex-direction:column;gap:4px;text-align:left;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--text);cursor:pointer;font:inherit}
.ek .it:hover{border-color:var(--accent)} .ek .it b{color:var(--fg);font:600 15px var(--f-body)} .ek .it small{color:var(--muted);font:500 11px var(--f-mono)}
.ek .it.ok{box-shadow:inset 3px 0 0 var(--ok,#2e8b57)}
.ek .lv{display:inline-block;font:600 10px var(--f-mono);padding:1px 6px;border-radius:4px;background:var(--accent-dim);color:var(--accent);margin-right:6px}
.ek .rd{font-size:17px;line-height:1.8;color:var(--fg);margin:10px 0}
.ek .rd span.w{cursor:pointer;border-radius:3px;padding:0 1px} .ek .rd span.w:hover{background:var(--accent-dim)} .ek .rd span.w.sel{background:var(--accent);color:var(--on-accent,#fff)}
.ek .pop{position:sticky;bottom:calc(10px + env(safe-area-inset-bottom));z-index:8;background:var(--panel);border:1px solid var(--accent);border-radius:12px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.15);margin-top:8px}
.ek .pop .w1{font:700 18px var(--f-body);color:var(--fg)} .ek .pop .m{color:var(--text);margin:2px 0 8px}
.ek .q{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:10px;background:var(--panel)}
.ek .q p{margin:0 0 8px;color:var(--fg);font-weight:600}
.ek .opts{display:grid;gap:6px} .ek .opts button{text-align:left;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel-2);color:var(--fg);font:inherit;cursor:pointer}
.ek .opts button:hover:not(:disabled){border-color:var(--accent)} .ek .opts button.dogru{border-color:var(--ok,#2e8b57);background:color-mix(in srgb,var(--ok,#2e8b57) 15%,transparent)} .ek .opts button.yanlis{border-color:var(--warn,#c0392b);background:color-mix(in srgb,var(--warn,#c0392b) 12%,transparent)}
.ek .ex{font-size:13px;color:var(--muted);margin-top:6px}
.ek ul.an{margin:6px 0 10px;padding-left:20px;color:var(--text)} .ek ul.an li{margin:5px 0}
.ek .exl{display:grid;gap:4px;margin:8px 0} .ek .exl button{text-align:left;background:none;border:0;color:var(--fg);font:inherit;cursor:pointer;padding:4px 0} .ek .exl button::before{content:"🔊 ";opacity:.6}
.ek .big{font:700 2rem/1.2 var(--f-display);color:var(--fg);text-align:center;margin:14px 0 6px}
.ek .inp2{width:100%;font:500 20px var(--f-body);padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--fg);text-align:center}
.ek .inp2:focus{outline:none;border-color:var(--accent)} .ek textarea.inp2{font-size:17px;text-align:left;min-height:84px}
.ek .diff span{padding:1px 3px;border-radius:3px;margin:0 1px} .ek .diff .g{background:color-mix(in srgb,var(--ok,#2e8b57) 20%,transparent)} .ek .diff .r{background:color-mix(in srgb,var(--warn,#c0392b) 18%,transparent);text-decoration:line-through} .ek .diff .m{background:color-mix(in srgb,var(--warn,#c0392b) 18%,transparent)}
.ek .stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.ek .stats div{background:var(--panel-2);border-radius:10px;padding:10px 12px} .ek .stats b{display:block;font:700 1.35rem var(--f-display);color:var(--fg)} .ek .stats span{font-size:12px;color:var(--muted)}
.ek .bars{display:flex;align-items:flex-end;gap:4px;height:120px;margin-top:8px;border-bottom:1px solid var(--line)}
.ek .bars i{flex:1;background:var(--accent);border-radius:3px 3px 0 0;min-height:2px;position:relative;opacity:.85} .ek .bars i.hit{background:var(--ok,#2e8b57)} .ek .bars i.today{outline:2px solid var(--fg);outline-offset:1px}
.ek .bl{display:flex;gap:4px;font:400 9px var(--f-mono);color:var(--muted)} .ek .bl span{flex:1;text-align:center}
.ek .rz{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.ek .rz div{text-align:center;padding:10px 6px;border:1px solid var(--line);border-radius:10px;background:var(--panel)} .ek .rz div i{display:block;font-style:normal;font-size:28px} .ek .rz div b{display:block;font-size:12px;color:var(--fg)} .ek .rz div small{font-size:10.5px;color:var(--muted)}
.ek .rz div.off{opacity:.38;filter:grayscale(1)}
.ek .lig div{display:flex;gap:10px;align-items:center;padding:8px 4px;border-bottom:1px solid var(--line)} .ek .lig b{flex:1;color:var(--fg)} .ek .lig .me{background:var(--accent-dim);border-radius:6px}
.ek .hl div{padding:7px 0;border-bottom:1px dashed var(--line);font-size:14px} .ek .hl small{color:var(--muted);font:400 11px var(--f-mono)}
.ek .seg2{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px} .ek .seg2 button{padding:7px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font:600 13px var(--f-body);cursor:pointer} .ek .seg2 button.on{background:var(--accent);border-color:var(--accent);color:var(--on-accent,#fff)}
.ek .ring{display:flex;align-items:center;gap:12px} .ek .ring svg{width:64px;height:64px;flex:none}
.ek .tmr{font:700 2.2rem var(--f-mono);text-align:center;color:var(--fg)}
.ek .ban{border:1px solid var(--accent);background:var(--accent-dim);border-radius:10px;padding:10px 12px;margin-bottom:10px;color:var(--fg)}
.hedefbar{display:flex;align-items:center;gap:8px;font:500 12px var(--f-mono);color:var(--muted);margin:-4px 0 10px}
.hedefbar i{flex:1;max-width:220px;height:6px;border-radius:9px;background:var(--line);overflow:hidden} .hedefbar i b{display:block;height:100%;background:var(--accent);border-radius:9px} .hedefbar.ok i b{background:var(--ok,#2e8b57)}
dialog.tanit{border:1px solid var(--line);border-radius:16px;background:var(--panel);color:var(--fg);max-width:440px;width:calc(100% - 28px);padding:20px}
dialog.tanit::backdrop{background:rgba(0,0,0,.45)}
@media (max-width:720px){.ek .pop{bottom:calc(80px + env(safe-area-inset-bottom))}}
.ek .hl.kisa div:nth-child(n+7){display:none} dialog.tanit h3{margin:0 0 8px;font:700 1.25rem var(--f-display)} dialog.tanit p,dialog.tanit li{color:var(--text);font-size:14.5px}
dialog.tanit .dots{display:flex;gap:6px;justify-content:center;margin-top:12px} dialog.tanit .dots i{width:7px;height:7px;border-radius:50%;background:var(--line)} dialog.tanit .dots i.on{background:var(--accent)}
dialog.tanit .hd{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0} dialog.tanit .hd button{padding:12px 6px;border:1px solid var(--line);border-radius:10px;background:var(--panel-2);color:var(--fg);font:600 14px var(--f-body);cursor:pointer} dialog.tanit .hd button.on{border-color:var(--accent);box-shadow:inset 0 0 0 2px var(--accent)}
dialog.tanit .hd small{display:block;font-weight:400;color:var(--muted);font-size:11px}
@media (max-width:720px){ body.tanidik header.head > p{display:none} .trk{display:flex!important;overflow-x:auto;scrollbar-width:none;gap:6px} .trk::-webkit-scrollbar{display:none} .trk button{flex:none!important;flex-direction:row!important;align-items:center!important;gap:6px!important;padding:7px 11px!important;border-radius:999px!important} .trk .ic{font-size:16px!important} .trk small{display:none} .trk b{font-size:13px!important} .trkinfo{display:none} }`;
  document.head.appendChild(css);

  /* ---------------- yeni sekmeler ve bölmeler ---------------- */
  const TABS = [['okuma', '📖', 'Okuma'], ['yaz', '✍️', 'Yazma'], ['gramer', '📘', 'Gramer'], ['ilerleme', '📈', 'İlerleme']];
  const tb = el('tabs2'), odaBtn = tb.querySelector('[data-t="oda"]'), odaPane = el('p-oda');
  TABS.forEach(([t, ic, n]) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.t = t; b.textContent = ic + ' ' + n; tb.insertBefore(b, odaBtn);
    const s = document.createElement('section'); s.className = 'pane2 ek'; s.id = 'p-' + t; odaPane.parentNode.insertBefore(s, odaPane);
  });

  /* ================= 📖 OKUMA ================= */
  let R = { id: null, sel: null, ans: {} };
  function okList() {
    const tr = typeof inTrk === 'function' ? inTrk : () => true, L = D.OKUMA.slice().sort((a, b) => (tr(b.trk) - tr(a.trk)) || LVL.indexOf(a.lvl) - LVL.indexOf(b.lvl));
    el('p-okuma').innerHTML = `<h3>📖 Okuma köşesi</h3><p class="sub">Seviyene uygun kısa metinler. Bilmediğin kelimeye dokun: anlamını gör, dinle, kartlarına ekle. Sonunda 3 soru var.${E.seviye ? ` Seviyen: <b>${E.seviye.lvl}</b>.` : ''}</p>
      <div class="grid">${L.map(r => { const d = E.okuma[r.id]; return `<button type="button" class="it ${d != null ? 'ok' : ''}" data-r="${r.id}"><small><span class="lv">${r.lvl}</span>${esc(TRK(r.trk))}</small><b>${esc(r.baslik)}</b><span>${esc(r.tr)}</span>${d != null ? `<small>✓ okundu · ${d}/3</small>` : ''}</button>`; }).join('')}</div>`;
    el('p-okuma').querySelectorAll('[data-r]').forEach(b => b.onclick = () => okOpen(b.dataset.r));
  }
  const TRK = k => { const t = (typeof TRACKS !== 'undefined' ? TRACKS : []).find(x => x[0] === k); return t ? t[1] + ' ' + t[2] : ''; };
  function okOpen(id) {
    const r = D.OKUMA.find(x => x.id === id); if (!r) return; R = { id, sel: null, ans: {} };
    const toks = r.metin.split(/(\s+)/), words = []; let html = '';
    toks.forEach(t => { if (/^\s+$/.test(t)) { html += t; return; } const m = t.match(/^([^A-Za-zÀ-ÿœŒ0-9']*)([A-Za-zÀ-ÿœŒ0-9'’\-]+)([^A-Za-zÀ-ÿœŒ0-9]*)$/); if (!m) { html += esc(t); return; } words.push(m[2].replace(/’/g, "'")); html += esc(m[1]) + `<span class="w" data-i="${words.length - 1}">${esc(m[2])}</span>` + esc(m[3]); });
    R.words = words;
    el('p-okuma').innerHTML = `<div class="ctl" style="margin-bottom:8px"><button class="btn" type="button" id="okBack">← Metinler</button><span class="sp"></span><button class="btn" type="button" id="okPlay">🔊 Dinle</button><button class="btn" type="button" id="okSlow">🐢</button><button class="btn" type="button" id="okStop">⏹</button></div>
      <h3><span class="lv">${r.lvl}</span>${esc(r.baslik)}</h3><p class="sub">${esc(r.tr)} · ${words.length} kelime · kelimeye dokun</p>
      <div class="panel"><div class="rd" id="okTxt">${html}</div><div id="okPop"></div></div>
      <div id="okQ">${r.soru.map((q, i) => `<div class="q" data-q="${i}"><p>${i + 1}. ${esc(q[0])}</p><div class="opts">${q[1].map((o, j) => `<button type="button" data-o="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="ctl" style="margin-top:10px"><span id="okRes" class="small muted"></span></div>`;
    el('okBack').onclick = () => { stopSpeak(); okList(); };
    el('okPlay').onclick = () => sayx(r.metin, 0.95); el('okSlow').onclick = () => sayx(r.metin, 0.75); el('okStop').onclick = () => stopSpeak();
    el('okTxt').onclick = e => { const s = e.target.closest('.w'); if (!s) return; el('okTxt').querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); s.classList.add('sel'); okPop(+s.dataset.i, s); };
    el('okQ').onclick = e => { const b = e.target.closest('[data-o]'), q = e.target.closest('[data-q]'); if (!b || !q || R.ans[q.dataset.q] != null) return;
      const qi = +q.dataset.q, oj = +b.dataset.o, Q = r.soru[qi], ok = oj === Q[2]; R.ans[qi] = ok;
      q.querySelectorAll('button').forEach((x, j) => { x.disabled = true; if (j === Q[2]) x.classList.add('dogru'); else if (j === oj) x.classList.add('yanlis'); });
      if (!ok) hata('okuma', Q[0], Q[1][Q[2]], Q[1][oj]);
      if (Object.keys(R.ans).length === r.soru.length) { const n = Object.values(R.ans).filter(Boolean).length, first = E.okuma[id] == null; E.okuma[id] = Math.max(E.okuma[id] || 0, n); sv();
        el('okRes').innerHTML = `<b>${n}/3</b> doğru. ${n === 3 ? 'Harika! 🎉' : 'Yanlışları Hatalarım bölümünde görebilirsin.'}`; addXP(first ? 5 + n * 3 : n, 'okuma'); rozetKontrol(); } };
    scrollTo({ top: el('p-okuma').getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' });
  }
  function okPop(i, span) {
    const w = lookup(R.words, i), sent = (() => { const t = D.OKUMA.find(x => x.id === R.id).metin, m = t.split(/(?<=[.!?])\s+/).find(s => new RegExp('\\b' + R.words[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(s)); return m || ''; })();
    const inMy = (S.my || []).some(x => norm(x.en) === norm(w.en));
    el('okPop').innerHTML = `<div class="pop"><div class="ctl"><span class="w1">${esc(w.en)}</span><span class="sp"></span><button class="btn sm" type="button" id="opSay">🔊</button><button class="btn sm" type="button" id="opX">✕</button></div>
      <div class="m">${w.tr ? esc(w.tr) : `<span class="muted">Sözlükte yok.</span> <a href="https://translate.google.com/?sl=${D.dil}&tl=tr&text=${encodeURIComponent(w.en)}" target="_blank" rel="noopener">Çeviride aç ↗</a>`}</div>
      ${inMy ? '<span class="small muted">✓ Kartlarında var</span>' : `<div class="ctl">${w.tr ? '' : '<input class="inp" id="opTr" placeholder="Türkçe anlamı" style="flex:1;min-width:140px">'}<button class="btn pri sm" type="button" id="opAdd">➕ Kartlarıma ekle</button></div>`}</div>`;
    el('opSay').onclick = () => sayx(w.en, 0.85); el('opX').onclick = () => { el('okPop').innerHTML = ''; span.classList.remove('sel'); };
    if (el('opAdd')) el('opAdd').onclick = () => { const tr = w.tr || (el('opTr') && el('opTr').value.trim()); if (!tr) { TM.toast('Önce Türkçe anlamını yaz'); el('opTr').focus(); return; }
      S.my = S.my || []; S.my.push({ en: w.en, tr, ex: sent }); save(); DICT = null; TM.toast('➕ “' + w.en + '” Benim listeme eklendi'); okPop(i, span); };
    sayx(w.en, 0.85);
  }

  /* ================= ✍️ YAZMA ================= */
  let Y = { mod: 'kelime', w: null, sent: '', kuyruk: [] };
  const lev = (a, b) => { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
  const clean = s => artSil(String(s).toLowerCase().replace(/[’']/g, "'")).replace(/[^a-z0-9'àâäçéèêëîïôöùûüÿœæßñ\- ]/gi, '').replace(/\s+/g, ' ').trim();
  function yzWord() {
    if (Y.kuyruk.length) return Y.kuyruk.shift();
    const L = deck().filter(w => w.en && w.tr); if (!L.length) return null;
    const now = Date.now(), zayif = L.filter(w => { const s = S.leit[keyOf(w)]; return s && s.box <= 1 && s.due <= now; });
    if (zayif.length && Math.random() < .5) return pick(zayif);
    const yeni = L.filter(w => !S.leit[keyOf(w)]).sort((a, b) => (FREQ[b.en.toLowerCase()] || 0) - (FREQ[a.en.toLowerCase()] || 0)).slice(0, 8);
    return pick(yeni.length ? yeni : L);
  }
  function leitUp(w, ok) { const k = keyOf(w), s = S.leit[k] || { box: 0, due: 0 }; s.box = ok ? Math.min(5, s.box + 1) : 1; s.due = Date.now() + (ok ? DAYS[Math.min(4, s.box - 1)] * 864e5 : 0); s.t = Date.now(); s.r = ok ? 2 : 0; S.leit[k] = s; save(); }
  function yzPaint() {
    const P = el('p-yaz');
    P.innerHTML = `<h3>✍️ Yazma</h3><p class="sub">Kelimeyi hatırlamak yetmez; yazınca kalıcı olur. Kelimeler Kelimeler bölümünde seçili listeden gelir.</p>
      <div class="seg2" id="yzMod"><button type="button" data-m="kelime" class="${Y.mod === 'kelime' ? 'on' : ''}">🔤 Türkçesine bakıp yaz</button><button type="button" data-m="dikte" class="${Y.mod === 'dikte' ? 'on' : ''}">🎧 Dikte</button></div><div class="panel" id="yzBox"></div>`;
    el('yzMod').onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; Y.mod = b.dataset.m; yzPaint(); };
    Y.mod === 'kelime' ? yzNext() : dkNext();
  }
  function yzNext() {
    const w = Y.w = yzWord(), B = el('yzBox'); if (!w) { B.innerHTML = '<p class="sub">Bu listede kelime yok.</p>'; return; }
    B.innerHTML = `<div class="sub" style="text-align:center;margin:0">${esc(w.tag || '')}</div><div class="big">${esc(w.tr)}</div><p class="sub" style="text-align:center" id="yzHint">${w.en.length} harf</p>
      <input class="inp2" id="yzIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(D.dilAd)} yaz…">
      <div class="ctl" style="justify-content:center;margin-top:10px"><button class="btn" type="button" id="yzH">💡 İpucu</button><button class="btn pri" type="button" id="yzOk">Kontrol et</button><button class="btn" type="button" id="yzPass">Bilmiyorum</button></div><div id="yzRes" style="text-align:center;margin-top:10px"></div>`;
    let hint = 0; el('yzIn').focus();
    el('yzH').onclick = () => { hint = Math.min(w.en.length, hint + 1); el('yzHint').textContent = w.en.slice(0, hint) + (hint < w.en.length ? '…' : '') + ` (${w.en.length} harf)`; };
    const done = (ok, tip) => { leitUp(w, ok); if (ok) addXP(hint ? 1 : 2, 'yazma'); else hata('yazma', w.tr, w.en, el('yzIn').value.trim());
      el('yzRes').innerHTML = `<div style="font:700 20px var(--f-body);color:${ok ? 'var(--ok,#2e8b57)' : 'var(--warn,#c0392b)'}">${ok ? '✓ ' : '✗ '}${esc(w.en)}</div>${tip ? `<div class="sub">${tip}</div>` : ''}${w.ex ? `<div class="sub">${esc(w.ex)}</div>` : ''}<button class="btn pri" type="button" id="yzNx" style="margin-top:6px">Sonraki →</button>`;
      ['yzOk', 'yzH', 'yzPass'].forEach(i => el(i).disabled = true); el('yzIn').readOnly = true; sayx(w.en, .9); el('yzNx').focus(); el('yzNx').onclick = yzNext; };
    const chk = () => { const a = clean(el('yzIn').value), b = clean(w.en); if (!a) return; const d = lev(a, b); if (d === 0) done(true); else if (norm(a) === norm(b)) done(true, D.dil === 'de' ? 'Umlaut ya da ß farkı var; doğru yazımı aşağıda.' : 'Aksan farkı var; doğru yazımı aşağıda.'); else if (d === 1 && b.length >= 5) done(true, 'Küçük bir yazım farkı var; doğru yazımı aşağıda.'); else done(false, 'Senin yazdığın: ' + esc(el('yzIn').value)); };
    el('yzOk').onclick = chk; el('yzPass').onclick = () => done(false); el('yzIn').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); if (el('yzNx')) el('yzNx').click(); else chk(); } };
  }
  function dkNext() {
    const L = deck().filter(w => w.ex && w.ex.split(' ').length >= 4 && w.ex.length < 110), B = el('yzBox'); if (!L.length) { B.innerHTML = '<p class="sub">Bu listede örnek cümle yok; Kelimeler bölümünde “Hazır liste”yi seç.</p>'; return; }
    const w = pick(L); Y.sent = w.ex;
    B.innerHTML = `<p class="sub" style="text-align:center">Cümleyi dinle ve duyduğunu yaz. İstediğin kadar tekrar dinleyebilirsin.</p>
      <div class="ctl" style="justify-content:center"><button class="btn pri" type="button" id="dkP">🔊 Dinle</button><button class="btn" type="button" id="dkS">🐢 Yavaş</button></div>
      <textarea class="inp2" id="dkIn" style="margin-top:10px" autocapitalize="sentences" spellcheck="false" placeholder="Duyduğunu yaz…"></textarea>
      <div class="ctl" style="justify-content:center;margin-top:10px"><button class="btn pri" type="button" id="dkOk">Kontrol et</button><button class="btn" type="button" id="dkNx">Başka cümle</button></div><div id="dkRes" style="margin-top:10px"></div>`;
    el('dkP').onclick = () => sayx(Y.sent, .9); el('dkS').onclick = () => sayx(Y.sent, .65); el('dkNx').onclick = dkNext; setTimeout(() => sayx(Y.sent, .9), 250);
    el('dkOk').onclick = () => {
      const tg = norm(Y.sent).split(' ').filter(Boolean), us = norm(el('dkIn').value).split(' ').filter(Boolean); if (!us.length) return;
      /* en uzun ortak alt dizi ile kelime kelime karşılaştır */
      const m = tg.length, n = us.length, T = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) T[i][j] = tg[i] === us[j] || lev(tg[i], us[j]) <= (tg[i].length > 5 ? 1 : 0) ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]);
      let i = 0, j = 0, out = '', hit = 0; const orig = Y.sent.split(/\s+/);
      while (i < m && j < n) { if (tg[i] === us[j] || lev(tg[i], us[j]) <= (tg[i].length > 5 ? 1 : 0)) { out += `<span class="g">${esc(orig[i] || tg[i])}</span> `; hit++; i++; j++; } else if (T[i + 1][j] >= T[i][j + 1]) { out += `<span class="m">${esc(orig[i] || tg[i])}</span> `; i++; } else { out += `<span class="r">${esc(us[j])}</span> `; j++; } }
      while (i < m) { out += `<span class="m">${esc(orig[i] || tg[i])}</span> `; i++; } while (j < n) { out += `<span class="r">${esc(us[j])}</span> `; j++; }
      const pct = Math.round(hit / m * 100); if (pct < 100) hata('dikte', 'Dikte', Y.sent, el('dkIn').value.trim());
      addXP(Math.max(1, Math.round(pct / 25)), 'yazma');
      el('dkRes').innerHTML = `<div class="panel"><b>%${pct}</b> doğru${pct === 100 ? ' 🎉' : ''}<div class="diff" style="margin-top:8px;line-height:2">${out}</div><div class="sub" style="margin-top:6px">Yeşil: doğru · kırmızı arka plan: eksik kelime · üstü çizili: fazla ya da yanlış yazılan</div></div>`;
      el('dkOk').disabled = true;
    };
  }

  /* ================= 📘 GRAMER ================= */
  function grList() {
    el('p-gramer').innerHTML = `<h3>📘 Gramer</h3><p class="sub">Kısa anlatım, örnekler ve 5 soru. Her ders 3–5 dakika.${E.seviye ? ` Seviyen <b>${E.seviye.lvl}</b>: o seviyedeki derslerden başla.` : ''}</p>
      <div class="grid">${D.GRAMER.map(g => { const b = E.gramer[g.id]; return `<button type="button" class="it ${b >= 4 ? 'ok' : ''}" data-g="${g.id}"><small><span class="lv">${g.lvl}</span>${b != null ? `en iyi ${b}/5` : 'yeni'}</small><b>${esc(g.baslik)}</b><span>${esc(g.ozet)}</span></button>`; }).join('')}</div>`;
    el('p-gramer').querySelectorAll('[data-g]').forEach(b => b.onclick = () => grOpen(b.dataset.g));
  }
  function grOpen(id) {
    const g = D.GRAMER.find(x => x.id === id), ans = {}; if (!g) return;
    el('p-gramer').innerHTML = `<div class="ctl" style="margin-bottom:8px"><button class="btn" type="button" id="grBack">← Dersler</button></div>
      <h3><span class="lv">${g.lvl}</span>${esc(g.baslik)}</h3><div class="panel"><ul class="an">${g.anlat.map(a => `<li>${a}</li>`).join('')}</ul>
      <div class="lbl muted mono small">Örnekler · dokun, dinle</div><div class="exl">${g.ornek.map(o => `<button type="button" data-s="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>
      <div id="grQ">${g.soru.map((q, i) => `<div class="q" data-q="${i}"><p>${i + 1}. ${esc(q[0])}</p><div class="opts">${q[1].map((o, j) => `<button type="button" data-o="${j}">${esc(o)}</button>`).join('')}</div><div class="ex" hidden></div></div>`).join('')}</div>
      <div class="ctl" style="margin-top:10px"><span id="grRes" class="small muted"></span><span class="sp"></span><button class="btn" type="button" id="grNx" hidden>Sonraki ders →</button></div>`;
    el('grBack').onclick = grList; el('p-gramer').querySelector('.exl').onclick = e => { const b = e.target.closest('[data-s]'); if (b) sayx(b.dataset.s, .9); };
    el('grQ').onclick = e => { const b = e.target.closest('[data-o]'), q = e.target.closest('[data-q]'); if (!b || !q || ans[q.dataset.q] != null) return;
      const qi = +q.dataset.q, oj = +b.dataset.o, Q = g.soru[qi], ok = oj === Q[2]; ans[qi] = ok;
      q.querySelectorAll('button').forEach((x, j) => { x.disabled = true; if (j === Q[2]) x.classList.add('dogru'); else if (j === oj) x.classList.add('yanlis'); });
      const ex = q.querySelector('.ex'); ex.hidden = false; ex.textContent = (ok ? '✓ ' : '✗ ') + Q[3];
      if (!ok) hata('gramer', Q[0].replace('___', '…'), Q[1][Q[2]], Q[1][oj]);
      if (Object.keys(ans).length === g.soru.length) { const n = Object.values(ans).filter(Boolean).length, first = E.gramer[id] == null; E.gramer[id] = Math.max(E.gramer[id] || 0, n); sv();
        el('grRes').innerHTML = `<b>${n}/5</b> doğru${n >= 4 ? ' · ders tamam ✓' : ' · 4 ve üstü ile ders tamamlanır'}`; addXP(first ? 5 + n * 2 : n, 'gramer'); rozetKontrol();
        const i = D.GRAMER.findIndex(x => x.id === id); if (D.GRAMER[i + 1]) { el('grNx').hidden = false; el('grNx').onclick = () => grOpen(D.GRAMER[i + 1].id); } } };
    scrollTo({ top: el('p-gramer').getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' });
  }

  /* ================= 📈 İLERLEME ================= */
  const learned = () => Object.values(S.leit || {}).filter(s => s.box >= 2).length;
  const seen = () => Object.keys(S.leit || {}).length;
  const streak = () => (S.gv && S.gv.st && S.gv.last && (S.gv.last === dayKey() || S.gv.last === dayKey(new Date(Date.now() - 864e5)))) ? S.gv.st : 0;
  const todayXp = () => E.gun[dayKey()] || 0;
  function estLevel() { if (E.seviye) return E.seviye.lvl; const n = learned(); return n < 1 ? '–' : n < 150 ? 'A1' : n < 400 ? 'A2' : n < 900 ? 'B1' : 'B2'; }
  const ROZET = [
    ['ilk', '🌱', 'İlk adım', 'İlk kartını çalış', () => seen() >= 1],
    ['k25', '📚', '25 kelime', '25 kelimeyi öğren', () => learned() >= 25], ['k100', '📗', '100 kelime', '100 kelimeyi öğren', () => learned() >= 100],
    ['k250', '📘', '250 kelime', '250 kelimeyi öğren', () => learned() >= 250], ['k500', '🏛️', '500 kelime', '500 kelimeyi öğren', () => learned() >= 500],
    ['s3', '🔥', '3 gün seri', '3 gün aralıksız çalış', () => E.maxSt >= 3], ['s7', '🔥', '7 gün seri', '7 gün aralıksız çalış', () => E.maxSt >= 7], ['s30', '🌋', '30 gün seri', '30 gün aralıksız çalış', () => E.maxSt >= 30],
    ['o1', '📖', 'İlk okuma', 'Bir metni bitir', () => Object.keys(E.okuma).length >= 1], ['o5', '📚', 'Okur', '5 metni bitir', () => Object.keys(E.okuma).length >= 5], ['oA', '🦉', 'Kitap kurdu', 'Tüm metinleri bitir', () => Object.keys(E.okuma).length >= D.OKUMA.length],
    ['g1', '📐', 'İlk ders', 'Bir gramer dersini 4/5 ile bitir', () => Object.values(E.gramer).some(v => v >= 4)], ['gA', '🎓', 'Gramerci', 'Tüm dersleri 4/5 ile bitir', () => D.GRAMER.every(g => (E.gramer[g.id] || 0) >= 4)],
    ['test', '🧭', 'Yerini bil', 'Seviye testini yap', () => !!E.seviye], ['duel', '⚔️', 'Meydan okuyan', 'Bir meydan okuma oyna', () => E.duello.length >= 1],
    ['top', '🗣️', 'Sahnede', 'Bir simülasyonu bitir', () => (E.cnt['toplantı bitti'] || 0) + (E.cnt['simülasyon bitti'] || 0) >= 1], ['tel', '🎙️', 'Net telaffuz', '20 cümleyi %80 üstü söyle', () => (E.cnt['telaffuz'] || 0) >= 20],
    ['x500', '⭐', '500 XP', '500 XP topla', () => (S.xp || 0) >= 500], ['x2000', '🌟', '2000 XP', '2000 XP topla', () => (S.xp || 0) >= 2000], ['x5000', '💫', '5000 XP', '5000 XP topla', () => (S.xp || 0) >= 5000],
    ['h7', '🎯', 'Hedefçi', '7 gün günlük hedefe ulaş', () => Object.values(E.gun).filter(v => v >= goalXp()).length >= 7]
  ];
  let rzBusy = false;
  function rozetKontrol(sessiz) {
    if (rzBusy) return; rzBusy = true; let yeni = [];
    try { E.maxSt = Math.max(E.maxSt || 0, (S.gv && S.gv.st) || 0); ROZET.forEach(r => { if (!E.rozet[r[0]] && r[4]()) { E.rozet[r[0]] = Date.now(); yeni.push(r); } }); if (yeni.length) sv(); } finally { rzBusy = false; }
    if (!sessiz) yeni.forEach((r, i) => setTimeout(() => TM.toast(`${r[1]} Yeni rozet: ${r[2]}`, 2600), 1200 + i * 2700));
  }
  function ring(v, max) { const f = Math.min(1, v / max), R = 26, C = 2 * Math.PI * R; return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${R}" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="32" cy="32" r="${R}" fill="none" stroke="${f >= 1 ? 'var(--ok,#2e8b57)' : 'var(--accent)'}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C * f} ${C}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">${Math.round(f * 100)}%</text></svg>`; }
  function ilPaint() {
    const P = el('p-ilerleme'), days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return dayKey(d); }), mx = Math.max(goalXp(), ...days.map(d => E.gun[d] || 0)), gx = goalXp();
    const wk = weekKey(), M = (typeof Cloud !== 'undefined' && Cloud.room && Cloud.members) ? Cloud.members.slice() : null, me = typeof Cloud !== 'undefined' && Cloud.user ? Cloud.user.uid : null;
    const lig = M ? M.map(m => ({ n: m.name || '?', x: m.gwk === wk ? (m.gxp || 0) : 0, me: m.uid === me })).sort((a, b) => b.x - a.x) : null;
    const hz = E.hata.slice(0, 40), kel = Object.entries(S.leit || {}).filter(([k, v]) => v.box <= 1 && v.r === 0).length;
    P.innerHTML = `<h3>📈 İlerleme</h3>
      <div class="panel"><div class="ring">${ring(todayXp(), gx)}<div><b>Bugün ${todayXp()} / ${gx} XP</b><div class="sub" style="margin:2px 0 6px">Günlük hedef: ${E.hedef} dakika</div><div class="seg2" id="ilHedef" style="margin:0">${[5, 10, 20].map(h => `<button type="button" data-h="${h}" class="${E.hedef === h ? 'on' : ''}">${h} dk</button>`).join('')}</div></div></div></div>
      <div class="stats" style="margin-top:10px"><div><b>${nf(S.xp || 0)}</b><span>toplam XP</span></div><div><b>🔥 ${streak()}</b><span>gün seri</span></div><div><b>${learned()}</b><span>öğrenilen kelime</span></div><div><b>${seen()}</b><span>görülen kelime</span></div>
        <div><b>${Object.keys(E.okuma).length}/${D.OKUMA.length}</b><span>okunan metin</span></div><div><b>${Object.values(E.gramer).filter(v => v >= 4).length}/${D.GRAMER.length}</b><span>gramer dersi</span></div><div><b>${estLevel()}</b><span>${E.seviye ? 'seviye (testten)' : 'tahmini seviye'}</span></div><div><b>${Object.keys(E.rozet).length}/${ROZET.length}</b><span>rozet</span></div></div>
      <div class="panel" style="margin-top:10px"><div class="lbl muted mono small">Son 14 gün · XP</div><div class="bars">${days.map(d => { const v = E.gun[d] || 0; return `<i class="${v >= gx ? 'hit' : ''} ${d === dayKey() ? 'today' : ''}" style="height:${Math.max(2, v / mx * 100)}%" title="${d}: ${v} XP"></i>`; }).join('')}</div><div class="bl">${days.map((d, i) => `<span>${i % 2 ? '' : +d.slice(8)}</span>`).join('')}</div></div>
      <div class="panel" style="margin-top:10px"><div class="ctl"><div><div class="lbl muted mono small">🧭 Seviye testi</div><div class="sub" style="margin:4px 0 0">${E.seviye ? `Son sonuç: <b>${E.seviye.lvl}</b> (${E.seviye.puan}/24 · ${new Date(E.seviye.at).toLocaleDateString('tr-TR')})` : '24 soru, yaklaşık 4 dakika. Kelime ve gramer; sonunda seviyeni ve nereden başlaman gerektiğini söyler.'}</div></div><span class="sp"></span><button class="btn pri" type="button" id="ilTest">${E.seviye ? 'Yeniden yap' : 'Teste başla'}</button></div></div>
      <div class="panel" style="margin-top:10px"><div class="ctl"><div class="lbl muted mono small" style="flex:1">❗ Hatalarım (${E.hata.length})</div>${hz.some(h => h.tur === 'yazma') || kel ? '<button class="btn sm" type="button" id="ilTekrar">Kelimeleri yazarak tekrar et</button>' : ''}${E.hata.length ? '<button class="btn sm" type="button" id="ilTemiz">Temizle</button>' : ''}</div>
        ${kel ? `<p class="sub" style="margin:6px 0 0">Kartlarda “Bilmedim” dediğin <b>${kel}</b> kelime de tekrar listesinde.</p>` : ''}
        <div class="hl kisa" id="ilHl">${hz.length ? hz.map(h => `<div><small>${{ okuma: '📖 okuma', gramer: '📘 gramer', yazma: '✍️ yazma', dikte: '🎧 dikte', seviye: '🧭 test', duello: '⚔️ meydan okuma' }[h.tur] || h.tur} · ${new Date(h.at).toLocaleDateString('tr-TR')}</small><br>${esc(h.soru)} → <b>${esc(h.dogru)}</b>${h.verilen ? ` <span class="muted">(senin: ${esc(h.verilen)})</span>` : ''}</div>`).join('') + (hz.length > 6 ? '<button class="btn sm" type="button" id="ilHlAll" style="margin-top:8px">Tümünü göster (' + hz.length + ')</button>' : '') : '<p class="sub" style="margin:6px 0 0">Henüz hata yok. Okuma, gramer, yazma ve testlerdeki yanlışların burada toplanır.</p>'}</div></div>
      <div class="panel" style="margin-top:10px"><div class="lbl muted mono small" style="margin-bottom:8px">🏅 Rozetler</div><div class="rz">${ROZET.map(r => `<div class="${E.rozet[r[0]] ? '' : 'off'}" title="${esc(r[3])}"><i>${r[1]}</i><b>${esc(r[2])}</b><small>${esc(r[3])}</small></div>`).join('')}</div></div>
      <div class="panel" style="margin-top:10px"><div class="lbl muted mono small">🏆 Haftalık lig${M ? ' · ' + esc(Cloud.room.name || '') : ''}</div>
        ${lig ? `<div class="lig">${lig.map((m, i) => `<div class="${m.me ? 'me' : ''}"><span>${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'}</span><b>${esc(m.n)}</b><span class="mono small">${nf(m.x)} XP</span></div>`).join('')}</div><p class="sub" style="margin:6px 0 0">Bu haftanın XP'si; pazartesi sıfırlanır.</p>` : '<p class="sub" style="margin:6px 0 0">Arkadaşlarınla yarışmak için <a href="#oda" id="ilOda">Oda</a> bölümünden bir odaya gir.</p>'}</div>`;
    P.querySelector('#ilHedef').onclick = e => { const b = e.target.closest('[data-h]'); if (b) { E.hedef = +b.dataset.h; sv(); ilPaint(); hedefBar(); } };
    el('ilTest').onclick = testStart;
    if (el('ilTemiz')) el('ilTemiz').onclick = () => { if (confirm('Hata listesi temizlensin mi?')) { E.hata = []; sv(); ilPaint(); } };
    if (el('ilTekrar')) el('ilTekrar').onclick = () => { const by = new Map([...WORDS.map(w => ({ en: w[0], tr: w[1], ex: w[2] })), ...(typeof TW !== 'undefined' ? TW : []), ...(S.my || [])].map(w => [keyOf(w), w]));
      const ks = [...new Set([...E.hata.filter(h => h.tur === 'yazma').map(h => keyOf({ en: h.dogru })), ...Object.entries(S.leit || {}).filter(([k, v]) => v.box <= 1 && v.r === 0).map(([k]) => k)])];
      Y.kuyruk = shuffle(ks.map(k => by.get(k)).filter(Boolean)).slice(0, 20); if (!Y.kuyruk.length) return TM.toast('Tekrar edilecek kelime yok'); Y.mod = 'kelime'; setTab('yaz'); };
    if (el('ilHlAll')) el('ilHlAll').onclick = e => { el('ilHl').classList.remove('kisa'); e.target.remove(); };
    if (el('ilOda')) el('ilOda').onclick = e => { e.preventDefault(); setTab('oda'); };
  }

  /* ---------------- seviye testi ---------------- */
  function testStart() {
    const pool = l => { const tw = (typeof TW !== 'undefined' ? TW : []).concat(ARS.TW || []).filter(w => w.lvl === l && w.tr); const ws = WORDS.filter(w => w[3] === l).map(w => ({ en: w[0], tr: w[1] })); return tw.concat(ws); };
    const V = []; [[1, 'A1'], [2, 'A2'], [3, 'B1'], [4, 'B2']].forEach(([l, lab]) => { let P = pool(l); if (P.length < 8) P = pool(l - 1).concat(P); shuffle(P).slice(0, 3).forEach(w => { const c0 = w.tr.split(',')[0].trim(), wr = [...new Set(shuffle(P.map(x => x.tr.split(',')[0].trim()).filter(t => t && t !== c0)))].slice(0, 3); V.push([lab, `“${w.en}” ne demek?`, shuffle([c0, ...wr]), c0]); }); });
    const G = D.SEVIYE.map(q => [q[0], q[1], q[2], q[2][q[3]]]);
    const Qs = []; LVL.forEach(l => { Qs.push(...shuffle(V.filter(q => q[0] === l)), ...shuffle(G.filter(q => q[0] === l))); });
    let i = 0; const res = [], P = el('p-ilerleme');
    const show = () => {
      if (i >= Qs.length) return testEnd(Qs, res);
      const q = Qs[i]; P.innerHTML = `<h3>🧭 Seviye testi</h3><p class="sub">Soru ${i + 1} / ${Qs.length} · bilmiyorsan tahmin etme, “Bilmiyorum” de; sonuç daha doğru çıkar.</p><div class="bars" style="height:6px;border:0;margin-bottom:10px"><i style="height:100%;flex:${i}"></i><i style="height:100%;flex:${Qs.length - i};background:var(--line)"></i></div>
        <div class="q"><p>${esc(q[1])}</p><div class="opts">${q[2].map(o => `<button type="button" data-o="${esc(o)}">${esc(o)}</button>`).join('')}<button type="button" data-o="" style="color:var(--muted)">Bilmiyorum</button></div></div>
        <div class="ctl" style="margin-top:10px"><button class="btn" type="button" id="tsX">Testi bırak</button></div>`;
      P.querySelector('.opts').onclick = e => { const b = e.target.closest('[data-o]'); if (!b) return; const ok = b.dataset.o === q[3]; res.push(ok); i++; show(); /* test bir ölçümdür; yanlışları hata defterine yazılmaz */ };
      el('tsX').onclick = ilPaint;
    }; show(); scrollTo({ top: P.getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' });
  }
  function testEnd(Qs, res) {
    let lvl = 'A1', ok = true; const by = {}; Qs.forEach((q, i) => { (by[q[0]] = by[q[0]] || []).push(res[i]); });
    LVL.forEach(l => { const a = by[l] || [], n = a.filter(Boolean).length; if (ok && n >= Math.ceil(a.length * 0.6)) lvl = l; else ok = false; });
    const puan = res.filter(Boolean).length; if (!by.A1 || by.A1.filter(Boolean).length < 2) lvl = 'A1';
    E.seviye = { lvl, puan, at: Date.now() }; sv(); addXP(10, 'seviye testi'); rozetKontrol();
    const kl = { A1: '1', A2: '2', B1: '3', B2: '4' }[lvl];
    el('p-ilerleme').innerHTML = `<h3>🧭 Sonuç</h3><div class="panel" style="text-align:center"><div class="big">${lvl}</div><p class="sub">${puan} / ${Qs.length} doğru</p>
      <p>${(D.SONUC || { A1: 'Temelden başlıyorsun. Önce en sık kullanılan kelimeler ve geniş zaman.', A2: 'Temelin var. Günlük konuşma kalıpları ve geçmiş zamanla devam.', B1: 'Kendini ifade edebiliyorsun. İş İngilizcesi, okuma ve Present Perfect ile ilerle.', B2: 'İyi seviyedesin. Teknik metinler, toplantı simülasyonu ve ileri gramer sana göre.' })[lvl]}</p>
      <div class="ctl" style="justify-content:center"><button class="btn pri" type="button" id="tsK">Kelimeleri ${lvl} seviyesine ayarla</button><button class="btn" type="button" id="tsG">Gramer derslerine git</button><button class="btn" type="button" id="tsB">İlerlemeye dön</button></div></div>`;
    el('tsK').onclick = () => { S.lvl = kl; save(); try { $('kLvl').value = kl; srcOpts(); nextCard(); } catch (e) { } TM.toast('Kelime kartları ' + lvl + ' seviyesine ayarlandı'); setTab('kelime'); };
    el('tsG').onclick = () => setTab('gramer'); el('tsB').onclick = ilPaint;
  }

  /* ================= ⚔️ MEYDAN OKUMA (Yarışma bölümünde) ================= */
  const rngS = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const DQ = new URLSearchParams(location.search), CH = DQ.get('duello') ? { seed: DQ.get('duello').slice(0, 20), skor: +DQ.get('skor') || 0, ad: (DQ.get('ad') || 'Bir arkadaşın').slice(0, 30) } : null;
  const duBox = document.createElement('div'); duBox.className = 'panel ek'; duBox.id = 'duBox'; duBox.style.marginTop = '14px';
  const yp = el('p-yarisma'); if (yp) yp.appendChild(duBox);
  function duPaint(msg) {
    duBox.innerHTML = `${CH ? `<div class="ban">⚔️ <b>${esc(CH.ad)}</b> sana meydan okudu: <b>${CH.skor} puan</b>. Aynı kelimelerle oyna, geçebilecek misin?</div>` : ''}
      <div class="ctl"><div><div class="lbl muted mono small">⚔️ Meydan okuma · 60 saniye</div><div class="sub" style="margin:4px 0 0">Kelimenin Türkçesini seç; doğru +1, art arda 5 doğru +2 bonus. Bitince skorunu link olarak arkadaşına gönder, aynı kelimelerle yarışsın.</div></div><span class="sp"></span><button class="btn pri" type="button" id="duGo">${CH ? 'Meydan okumayı kabul et' : 'Başla'}</button></div>${msg || ''}`;
    el('duGo').onclick = () => duStart(CH ? CH.seed : Math.random().toString(36).slice(2, 10));
  }
  function duStart(seed) {
    const r = rngS(seed), pool = WORDS.filter(w => w[3] <= 3 && w[1]).map(w => ({ en: w[0], tr: w[1].split(',')[0] })).concat((typeof TW !== 'undefined' ? TW : []).filter(w => w.lvl <= 2 && w.tr).map(w => ({ en: w.en, tr: w.tr.split(',')[0] })));
    const L = shuffle(pool, r).slice(0, 80); let i = 0, pts = 0, row = 0, left = 60, run = true; const wrongs = [];
    const q = () => { const w = L[i % L.length], opts = shuffle([w.tr, ...[...new Set(shuffle(pool, r).map(x => x.tr).filter(t => t !== w.tr))].slice(0, 3)], r); return { w, opts }; };
    let cq = q();
    const paint = () => { duBox.innerHTML = `<div class="ctl"><span class="tmr" id="duT">${left}</span><span class="sp"></span><b style="font:700 1.4rem var(--f-display)">${pts} puan</b></div><div class="big">${esc(cq.w.en)}</div><div class="opts">${cq.opts.map(o => `<button type="button" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
      duBox.querySelector('.opts').onclick = e => { const b = e.target.closest('[data-o]'); if (!b || !run) return; const ok = b.dataset.o === cq.w.tr; if (ok) { pts++; row++; if (row % 5 === 0) pts += 2; } else { row = 0; wrongs.push(cq.w); } b.classList.add(ok ? 'dogru' : 'yanlis'); setTimeout(() => { i++; cq = q(); if (run) paint(); }, ok ? 120 : 450); }; };
    paint(); const t0 = Date.now();
    const tick = setInterval(() => { left = Math.max(0, 60 - Math.floor((Date.now() - t0) / 1000)); const T = el('duT'); if (T) T.textContent = left; if (!left) { clearInterval(tick); run = false; end(); } }, 250);
    const end = () => {
      E.duello.unshift({ seed, pts, at: Date.now() }); E.duello.length = Math.min(E.duello.length, 30); sv(); wrongs.slice(0, 5).forEach(w => hata('duello', w.en, w.tr)); addXP(Math.max(1, Math.round(pts / 2)), 'meydan okuma'); rozetKontrol();
      const ad = typeof Cloud !== 'undefined' && Cloud.user ? Cloud.name() : '', url = location.origin + location.pathname + '?duello=' + seed + '&skor=' + pts + (ad ? '&ad=' + encodeURIComponent(ad) : '') + '#yarisma';
      const vs = CH && CH.seed === seed ? `<p style="font-size:1.1rem">${pts > CH.skor ? '🏆 Kazandın!' : pts === CH.skor ? '🤝 Berabere!' : '😅 Bu sefer ' + esc(CH.ad) + ' kazandı.'} Sen: <b>${pts}</b> · ${esc(CH.ad)}: <b>${CH.skor}</b></p>` : '';
      duPaint(`<div style="margin-top:10px;text-align:center">${vs}<div class="big">${pts} puan</div><div class="ctl" style="justify-content:center"><button class="btn pri" type="button" id="duSh">📤 Meydan oku (link gönder)</button><button class="btn" type="button" id="duCp">Linki kopyala</button></div></div>`);
      el('duSh').onclick = async () => { const text = `${D.dilAd} Kulübü'nde 60 saniyede ${pts} puan yaptım. Aynı kelimelerle geçebilir misin? ⚔️`; try { if (navigator.share) { await navigator.share({ title: 'Meydan okuma', text, url }); return; } } catch (e) { return; } window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank'); };
      el('duCp').onclick = async () => { try { await navigator.clipboard.writeText(url); TM.toast('Link kopyalandı'); } catch (e) { prompt('Linki kopyala:', url); } };
    };
  }
  duPaint();
  if (CH) setTimeout(() => { setTab('yarisma'); duBox.scrollIntoView({ block: 'center' }); }, 300);

  /* ================= ★ kartlarda sıklık rozeti ================= */
  if (typeof nextCard === 'function' && typeof FREQ === 'object') {
    const star = w => { const f = FREQ[String(w.en).toLowerCase()]; if (f == null) return ''; return f >= 50 ? '★★★ çok yaygın' : f >= 40 ? '★★☆ yaygın' : f >= 30 ? '★☆☆ orta' : '◇ az kullanılan / meslek terimi'; };
    const oNext = nextCard;
    nextCard = function () { const r = oNext.apply(this, arguments); try { if (cur) { const s = star(cur); if (s) { const t = $('fTag'), b = $('bTag'); t.textContent = (cur.tag ? cur.tag + ' · ' : '') + s; if (b) b.textContent = t.textContent; } } } catch (e) { } return r; };
    try { kartYenile(); } catch (e) { }
  }

  /* ================= günlük hedef çubuğu + XP sayımı ================= */
  const hb = document.createElement('div'); hb.className = 'hedefbar'; hb.id = 'hedefBar';
  const ti = el('trkInfo'); if (ti) ti.after(hb);
  function hedefBar() { const v = todayXp(), g = goalXp(); hb.classList.toggle('ok', v >= g); hb.innerHTML = `<span>🎯 Bugün ${v}/${g} XP</span><i><b style="width:${Math.min(100, v / g * 100)}%"></b></i><span>${v >= g ? 'hedef tamam ✓' : E.hedef + ' dk hedef'}</span>`; hb.onclick = () => setTab('ilerleme'); hb.style.cursor = 'pointer'; }
  const oXP = addXP;
  addXP = function (n, why) {
    const r = oXP.apply(this, arguments); if (!n) return r;
    const d = dayKey(), before = E.gun[d] || 0; E.gun[d] = before + n; if (why) E.cnt[why] = (E.cnt[why] || 0) + 1;
    const ks = Object.keys(E.gun).sort(); if (ks.length > 120) ks.slice(0, ks.length - 120).forEach(k => delete E.gun[k]);
    sv(); hedefBar(); if (before < goalXp() && E.gun[d] >= goalXp()) setTimeout(() => TM.toast('🎯 Günlük hedefe ulaştın! ' + E.gun[d] + ' XP'), 1800);
    rozetKontrol(); if (S.tab === 'ilerleme') ilPaint(); return r;
  };
  hedefBar();

  /* ================= sekme açılınca çiz ================= */
  const PAINT = { okuma: okList, yaz: yzPaint, gramer: grList, ilerleme: ilPaint };
  const oTab = setTab;
  setTab = function (t) { const r = oTab.apply(this, arguments); document.body.dataset.tab = t; if (PAINT[t]) { const P = el('p-' + t); if (t !== 'yaz' || !P.innerHTML || Y.kuyruk.length) PAINT[t](); } if (t === 'yarisma' && !duBox.querySelector('.tmr')) duPaint(); return r; };
  if (typeof Cloud !== 'undefined' && typeof Cloud.paint === 'function') { const op = Cloud.paint; Cloud.paint = function () { const r = op.apply(this, arguments); if (S.tab === 'ilerleme') try { ilPaint(); } catch (e) { } return r; }; }
  const h0 = location.hash.slice(1); if (PAINT[h0] || PAINT[S.tab]) setTab(PAINT[h0] ? h0 : S.tab);
  rozetKontrol(true);

  /* ================= arayüz seçimi: Klasik · Sade · Renkli (Ayarlar → 🎨 Arayüz) =================
     Seçim tarayıcıda 'erdevelop-arayuz' anahtarında, üç kulüpte ortak. Sayfa açılırken <body> hemen ardındaki küçük betik uygular. */
  (function () {
    const st = document.createElement('style');
    st.textContent = `
/* klasik görünümde yeni parçalar */
body:not(.yu) details.kayar{margin:0 0 10px} body:not(.yu) details.kayar summary{cursor:pointer;font:500 12px var(--f-mono);color:var(--muted);text-transform:uppercase;letter-spacing:.5px} body:not(.yu) details.kayar .oz{margin-left:8px;text-transform:none}
body:not(.yu) .rate .re{margin-right:5px}
/* ayar düğmeleri */
.uisec{display:grid;grid-template-columns:repeat(3,1fr);gap:8px} .uisec button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;border:2px solid var(--line);border-radius:12px;background:var(--panel);color:var(--fg);font:600 13px var(--f-body);cursor:pointer}
.uisec button i{font-style:normal;font-size:22px} .uisec button small{font-weight:400;font-size:11px;color:var(--muted);text-align:center;line-height:1.3} .uisec button.on{border-color:var(--accent);background:var(--accent-dim)}
/* ---------- renkli arayüz: büyük kartlar, büyük düğmeler, her bölümün kendi rengi ---------- */
body.renk{--k-kelime:#fb923c;--k-kalip:#a78bfa;--k-dinleme:#38bdf8;--k-konusma:#34d399;--k-sim:#f472b6;--k-telaffuz:#22d3ee;--k-yarisma:#fbbf24;--k-okuma:#60a5fa;--k-yaz:#fb7185;--k-gramer:#818cf8;--k-ilerleme:#4ade80;--k-oda:#2dd4bf;--on-accent:#14110a;font-size:17px}
:root:not([data-mode="dark"]) body.renk{--k-kelime:#ea580c;--k-kalip:#7c3aed;--k-dinleme:#0284c7;--k-konusma:#059669;--k-sim:#db2777;--k-telaffuz:#0891b2;--k-yarisma:#d97706;--k-okuma:#2563eb;--k-yaz:#e11d48;--k-gramer:#4f46e5;--k-ilerleme:#16a34a;--k-oda:#0d9488;--on-accent:#fff}
body.renk{--accent:var(--k-kelime)} body.renk[data-tab="kalip"]{--accent:var(--k-kalip)} body.renk[data-tab="dinleme"]{--accent:var(--k-dinleme)} body.renk[data-tab="konusma"]{--accent:var(--k-konusma)} body.renk[data-tab="sim"]{--accent:var(--k-sim)} body.renk[data-tab="telaffuz"]{--accent:var(--k-telaffuz)} body.renk[data-tab="yarisma"]{--accent:var(--k-yarisma)} body.renk[data-tab="okuma"]{--accent:var(--k-okuma)} body.renk[data-tab="yaz"]{--accent:var(--k-yaz)} body.renk[data-tab="gramer"]{--accent:var(--k-gramer)} body.renk[data-tab="ilerleme"]{--accent:var(--k-ilerleme)} body.renk[data-tab="oda"]{--accent:var(--k-oda)}
body.renk{--accent-dim:color-mix(in srgb,var(--accent) 16%,transparent)}
body.renk .bg{background:radial-gradient(520px 380px at -10% -5%,color-mix(in srgb,var(--accent) 26%,transparent),transparent 70%),radial-gradient(480px 420px at 110% 25%,color-mix(in srgb,#a78bfa 20%,transparent),transparent 70%),radial-gradient(520px 420px at 30% 110%,color-mix(in srgb,#38bdf8 16%,transparent),transparent 70%)}
body.renk .head h1{font-size:clamp(2rem,8vw,2.7rem);background:linear-gradient(90deg,var(--accent),#a78bfa 60%,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent}
body.renk header.head>p,body.renk .trkinfo,body.renk #kInfo,body.renk #p-kelime .panel .note,body.renk #tabs2 .acc{display:none!important}
body.renk main .panel,body.renk .gv,body.renk details.kayar{border-radius:22px;border-color:color-mix(in srgb,var(--accent) 30%,var(--line));box-shadow:0 6px 22px rgba(0,0,0,.10)}
body.renk main .btn{border-radius:14px;padding:11px 16px;font-size:15px}
body.renk main .btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
body.renk .trk button{padding:9px 14px!important;font-size:15px}
body.renk .trk button.on{background:var(--accent)!important;border-color:var(--accent)!important;color:var(--on-accent)!important} body.renk .trk button.on b{color:inherit!important}
body.renk .fcard{height:300px}
body.renk .fcard .f{background:linear-gradient(145deg,var(--accent) 0%,color-mix(in srgb,var(--accent) 45%,#7c3aed) 100%);border:0;box-shadow:0 14px 34px color-mix(in srgb,var(--accent) 35%,transparent)}
body.renk .fcard .f .w,body.renk .fcard .f .tag,body.renk .fcard .f .hint,body.renk .fcard .f *{color:#fff!important}
body.renk .fcard .f .spk{background:rgba(255,255,255,.2);border-color:transparent}
body.renk .fcard .b{border:3px solid var(--accent)}
body.renk .fcard .w{font-size:clamp(2.6rem,11vw,3.4rem)}
body.renk .rate{gap:10px;margin-top:14px}
body.renk .rate .btn{min-height:78px;border:0!important;border-radius:22px;color:#fff!important;font-size:16px;font-weight:800;box-shadow:0 6px 16px rgba(0,0,0,.18)}
body.renk .rate .re{font-size:32px}
body.renk .rate .no{background:linear-gradient(160deg,#fb7185,#e11d48)!important} body.renk .rate .mid{background:linear-gradient(160deg,#fcd34d,#f59e0b)!important} body.renk .rate .ok{background:linear-gradient(160deg,#4ade80,#16a34a)!important}
body.renk .bnav{border-top:0;box-shadow:0 -6px 24px rgba(0,0,0,.12)}
body.renk .bnav .i{font-size:26px}
body.renk .bnav button.on{color:var(--accent)} body.renk .bnav button.on .i{background:var(--accent-dim);border-radius:14px;padding:2px 12px}
`;
    document.head.appendChild(st);
    const B = document.body, UI = [['klasik', '🖥️', 'Klasik', 'İlk görünüm'], ['sade', '🌿', 'Sade', 'Yuvarlak, sakin'], ['renkli', '🎨', 'Renkli', 'Büyük kartlar, bol renk']];
    const cur = () => { try { return localStorage.getItem('erdevelop-arayuz') || 'sade'; } catch (e) { return 'sade'; } };
    function uygula(u) { try { localStorage.setItem('erdevelop-arayuz', u); } catch (e) { } B.classList.toggle('yu', u !== 'klasik'); B.classList.toggle('renk', u === 'renkli'); B.dataset.ui = u; boya(); }
    function boya() { const g = el('sUi'); if (g) g.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.ui === cur())); }
    B.dataset.tab = S.tab || 'kelime';
    const mb = el('sModeBtn'), sg = mb && mb.closest('.sg');
    if (sg) { const d = document.createElement('div'); d.className = 'sg';
      d.innerHTML = `<div class="lbl muted mono small">🖼️ Arayüz</div><div class="uisec" id="sUi">${UI.map(([k, i, n, a]) => `<button type="button" data-ui="${k}"><i>${i}</i>${n}<small>${a}</small></button>`).join('')}</div>`;
      sg.after(d); d.querySelector('#sUi').onclick = e => { const b = e.target.closest('[data-ui]'); if (b) { uygula(b.dataset.ui); TM.toast(b.textContent.trim().split(/\s+/)[0] + ' arayüz', 1200); } }; boya(); }
  })();

  /* ================= kaydırmalı kısa rehber (başlıktaki "❓ Nasıl kullanılır?") ================= */
  (function () {
    const IMG = 'rehber/dil-kulupleri/img/', dil = D.dilAd;
    const st = document.createElement('style');
    st.textContent = `dialog.kr{border:1px solid var(--line);border-radius:18px;background:var(--panel);color:var(--fg);width:calc(100% - 20px);max-width:430px;padding:0;overflow:hidden}
dialog.kr::backdrop{background:rgba(0,0,0,.55)}
.kr .top{display:flex;align-items:center;gap:8px;padding:10px 12px 0} .kr .top b{flex:1;font:600 12px var(--f-mono);color:var(--muted)} .kr .x{border:0;background:none;color:var(--muted);font-size:20px;cursor:pointer;padding:2px 6px}
.kr .sl{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch} .kr .sl::-webkit-scrollbar{display:none}
.kr .s{flex:0 0 100%;scroll-snap-align:center;padding:8px 18px 4px;box-sizing:border-box;max-height:min(68vh,600px);overflow-y:auto}
.kr .ic{font-size:44px;line-height:1;margin:8px 0 6px} .kr h3{margin:0 0 8px;font:700 1.25rem/1.25 var(--f-display);color:var(--fg)}
.kr p,.kr li{color:var(--text);font-size:14.5px;line-height:1.55;margin:4px 0} .kr ul{padding-left:18px;margin:6px 0} .kr b{color:var(--fg)}
.kr img{display:block;width:100%;max-height:34vh;object-fit:cover;object-position:50% 13%;border-radius:12px;border:1px solid var(--line);margin:4px 0 10px;background:#0b1220}
.kr .xp{display:grid;grid-template-columns:1fr auto;gap:2px 12px;font-size:14px;margin:8px 0} .kr .xp span:nth-child(even){font-family:var(--f-mono);color:var(--fg);text-align:right}
.kr .nav{display:flex;align-items:center;gap:10px;padding:10px 14px 14px} .kr .dots{flex:1;display:flex;gap:6px;justify-content:center} .kr .dots i{width:7px;height:7px;border-radius:50%;background:var(--line);cursor:pointer} .kr .dots i.on{background:var(--accent);width:18px;border-radius:4px}
.kr .nav button{min-width:44px}`;
    document.head.appendChild(st);
    const S_ = [
      ['👋', `${esc(dil)} Kulübü'ne hoş geldin`, `<p>Her gün <b>10 dakika</b> yeter. Yaptığın her çalışma <b>XP</b> kazandırır; ekranın üstündeki çubuk günlük hedefini gösterir.</p><p>Bu kısa tanıtımda nerede ne var, XP nasıl kazanılır, hepsini 1 dakikada görürsün. <b>Sağa kaydır →</b></p>`],
      ['📚', 'Kelime kartları', `<img src="${IMG}03-kart-arka.webp?v=2" alt="" loading="lazy"><p>Kelimeyi gör, anlamını aklından söyle, karta <b>dokun</b>: arkasında anlamı ve örnek cümle çıkar. Sonra dürüstçe işaretle: <b>😕 Bilmedim · 🤔 Zor · 😄 Bildim</b>.</p><p>Bildiğin kelime daha seyrek, bilmediğin hemen tekrar gelir. Hangi liste gelsin? Kartın üstündeki <b>⚙ Kart ayarları</b>.</p>`],
      ['🧩', 'Kalıplar', `<img src="${IMG}05-kalip.webp?v=2" alt="" loading="lazy"><p>Günlük konuşmanın hazır cümle kalıpları. Her kalıp 3 adım: <b>Öğren</b> (dinle), <b>Çevir</b> (🎙 ile söyle ya da yaz), <b>Kendi cümlen</b>.</p><p>Alt menüde <b>Daha → Kalıplar</b>.</p>`],
      ['🎧', 'Dinle, konuş, söyle', `<ul><li>🎧 <b>Dinleme:</b> kısa diyaloğu dinle, soruları cevapla.</li><li>💬 <b>Konuşma:</b> konuyu al, sayaç bitene kadar konuş.</li><li>🗣 <b>${esc(simAd())}:</b> otelde, tanışmada… sıra sende, cevabını söyle.</li><li>🎙 <b>Telaffuz:</b> cümleyi oku, neyin doğru duyulduğunu gör.</li><li>📖 <b>Okuma</b>, ✍️ <b>Yazma</b>, 📘 <b>Gramer</b> da <b>Daha</b> menüsünde.</li></ul>`],
      ['🏆', 'Yarışma', `<img src="${IMG}10-yarisma.webp?v=2" alt="" loading="lazy"><p><b>Haftanın yarışması:</b> 10 soru, 15'er saniye; bu hafta herkese aynı sorular. Hızlı cevap daha çok puan.</p><p><b>⚔️ Meydan okuma:</b> 60 saniyelik yarış, linkini arkadaşına gönder.</p>`],
      ['⭐', 'XP nasıl kazanılır?', `<div class="xp"><span>📚 Kart: 😄 Bildim / 🤔 Zor</span><span>+2 / +1</span><span>🧩 Kalıp adımı</span><span>+2</span><span>💬 Konuşma turu</span><span>+3</span><span>🎙 Telaffuz %80 üstü</span><span>+5</span><span>🎧 Dinleme, her doğru</span><span>+2</span><span>🏆 Yarışma</span><span>puan ÷ 20</span><span>🎯 Günlük görev</span><span>+10</span><span>🎯 Üçü birden</span><span>+20</span><span>🎯 Haftalık görev</span><span>+50</span></div><p>Günlük hedef: 5 dk = 20 XP · 10 dk = 40 XP · 20 dk = 80 XP.</p>`],
      ['🎯', 'Görevler ve seri', `<img src="${IMG}17-gorevler.webp?v=2" alt="" loading="lazy"><p>Her gün <b>3 görev</b> gelir; çalıştıkça kendiliğinden dolar. En az birini bitirdiğin her gün <b>🔥 serin</b> uzar. Bir gün kaçırırsan haftada bir <b>❄️ dondurma</b> serini korur.</p>`],
      ['👥', 'Oda: arkadaşlarınla', `<p>Giriş yap, <b>Oda</b> sekmesinde <b>Oda aç</b> ve davet linkini WhatsApp'tan gönder.</p><ul><li>Ortak kelime listesi</li><li>Haftalık lig: kim kaç XP topladı 🥇🥈🥉</li><li>Aynı yarışma soruları ve aynı görevler</li><li>Birlikte doldurulan haftalık XP hedefi</li></ul>`],
      ['🔔', 'Telefona kelime gelsin', `<img src="${IMG}04-bildirim.webp?v=2" alt="" loading="lazy"><p><b>Kelimeler</b> bölümünde aşağı in → <b>🔔 Telefona kelime bildirimi</b>. Listeleri ve saatleri seç; kelime, geçtiği bir cümleyle gelir.</p><p><b>iPhone:</b> önce Paylaş → <b>Ana Ekrana Ekle</b>, sonra simgeden aç.</p>`],
      ['🚀', 'Hepsi bu kadar!', `<p>Bugün için öneri: <b>görevlerine bak</b>, <b>10 kart</b> çalış, bir <b>kalıp</b> dene.</p><p>Bu tanıtıma başlıktaki <b>❓ Nasıl kullanılır?</b> düğmesinden her zaman dönebilirsin.</p><p style="margin-top:12px"><a class="btn" href="rehber/dil-kulupleri/" target="_blank" rel="noopener">📖 Ayrıntılı rehber (ekran görüntülü)</a></p><p style="margin-top:8px"><button class="btn pri" type="button" data-k="bitir">Başlayalım →</button></p>`]
    ];
    function ac() {
      const d = document.createElement('dialog'); d.className = 'kr'; d.setAttribute('aria-label', 'Nasıl kullanılır');
      d.innerHTML = `<div class="top"><b id="krN">1 / ${S_.length}</b><button class="x" type="button" data-k="bitir" aria-label="Kapat">✕</button></div>
        <div class="sl" id="krSl">${S_.map(([ic, h, b]) => `<section class="s"><div class="ic">${ic}</div><h3>${h}</h3>${b}</section>`).join('')}</div>
        <div class="nav"><button class="btn" type="button" data-k="geri" aria-label="Önceki">‹</button><div class="dots">${S_.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div><button class="btn pri" type="button" data-k="ileri" aria-label="Sonraki" autofocus>›</button></div>`;
      document.body.appendChild(d);
      const sl = d.querySelector('#krSl'), dots = [...d.querySelectorAll('.dots i')], n = S_.length;
      const cur = () => Math.round(sl.scrollLeft / Math.max(1, sl.clientWidth)), git = i => sl.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * sl.clientWidth, behavior: 'smooth' });
      const boya = () => { const i = cur(); dots.forEach((x, j) => x.classList.toggle('on', j === i)); d.querySelector('#krN').textContent = `${i + 1} / ${n}`; d.querySelector('[data-k="geri"]').disabled = i === 0; d.querySelector('[data-k="ileri"]').disabled = i === n - 1; };
      sl.addEventListener('scroll', () => requestAnimationFrame(boya), { passive: true });
      const kapat = () => { try { d.close(); } catch (e) { } d.remove(); };
      d.onclick = e => { if (e.target === d) return kapat(); const t = e.target.closest('[data-k],[data-i]'); if (!t) return; if (t.dataset.i != null) return git(+t.dataset.i);
        const k = t.dataset.k; if (k === 'bitir') kapat(); else if (k === 'ileri') git(cur() + 1); else if (k === 'geri') git(cur() - 1); };
      d.addEventListener('keydown', e => { if (e.key === 'ArrowRight') git(cur() + 1); if (e.key === 'ArrowLeft') git(cur() - 1); });
      d.addEventListener('close', () => d.remove());
      if (d.showModal) d.showModal(); else d.setAttribute('open', ''); boya();
    }
    window.kulupRehber = ac;
    document.querySelectorAll('a.rehberL').forEach(a => a.addEventListener('click', e => { e.preventDefault(); ac(); }));
    if (location.hash === '#rehber') setTimeout(ac, 300);
  })();

  /* ================= ilk giriş: tanıtım + günlük hedef ================= */
  if (E.tanit) document.body.classList.add('tanidik');
  else if (!CH) setTimeout(() => {
    const d = document.createElement('dialog'); d.className = 'tanit'; document.body.appendChild(d); let step = 0, hedef = E.hedef || 10;
    const pg = () => {
      const dots = `<div class="dots">${[0, 1, 2].map(i => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>`;
      if (step === 0) d.innerHTML = `<h3>👋 ${esc(D.dilAd)} Kulübü'ne hoş geldin</h3><p>Arkadaşlarınla birlikte, her gün biraz:</p><ul><li>📚 <b>Kelimeler:</b> en sık kullanılandan başlayan kartlar</li><li>📖 <b>Okuma</b>, 🎧 <b>Dinleme</b>, ✍️ <b>Yazma</b></li><li>💬 <b>Konuşma</b>, 🗣 <b>${esc(simAd())}</b>, 🎙 <b>Telaffuz</b></li><li>📘 <b>Gramer</b> mini dersleri</li><li>🏆 <b>Yarışma</b>, ⚔️ meydan okuma, 👥 <b>Oda</b></li></ul><p class="small" style="margin:4px 0 10px">Ayrıntılı anlatım ve XP kuralları: <a href="rehber/dil-kulupleri/" target="_blank" rel="noopener">❓ Nasıl kullanılır?</a></p><div class="ctl" style="justify-content:flex-end"><button class="btn" type="button" data-a="skip">Geç</button><button class="btn pri" type="button" data-a="next">İleri →</button></div>${dots}`;
      if (step === 1) d.innerHTML = `<h3>🎯 Günde ne kadar?</h3><p>Küçük ama düzenli çalışmak en iyisi. Hedefini seç; istediğin zaman İlerleme'den değiştirebilirsin.</p><div class="hd">${[[5, 'rahat'], [10, 'düzenli'], [20, 'iddialı']].map(([h, t]) => `<button type="button" data-h="${h}" class="${hedef === h ? 'on' : ''}">${h} dk<small>${t} · ${HXP[h]} XP</small></button>`).join('')}</div><div class="ctl" style="justify-content:flex-end"><button class="btn" type="button" data-a="back">← Geri</button><button class="btn pri" type="button" data-a="next">İleri →</button></div>${dots}`;
      if (step === 2) d.innerHTML = `<h3>🧭 Seviyeni bilelim mi?</h3><p>4 dakikalık seviye testi, kelime kartlarını ve dersleri sana göre ayarlar. İstersen sonra İlerleme bölümünden de yapabilirsin.</p><div class="ctl" style="justify-content:flex-end"><button class="btn" type="button" data-a="end">Şimdilik geç</button><button class="btn pri" type="button" data-a="test">Teste başla</button></div>${dots}`;
    };
    d.onclick = e => { const h = e.target.closest('[data-h]'); if (h) { hedef = +h.dataset.h; pg(); return; } const a = e.target.closest('[data-a]'); if (!a) return; const A = a.dataset.a;
      if (A === 'next') { step++; pg(); } else if (A === 'back') { step--; pg(); } else { E.tanit = 1; E.hedef = hedef; sv(); hedefBar(); d.close(); d.remove(); document.body.classList.add('tanidik'); if (A === 'test') { setTab('ilerleme'); testStart(); } } };
    d.addEventListener('cancel', () => { E.tanit = 1; sv(); document.body.classList.add('tanidik'); });
    pg(); if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }, 900);

  /* görev sistemine yeni olaylar */
  window.KulupEk = { okList, grList, ilPaint, testStart, hata };
})();
