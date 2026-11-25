/* erdevelop · eğitimler ortak ilerleme katmanı
   - kaldığın yerden devam et kartı, genel ilerleme, rozetler
   - tamamlama belgesi (PNG)
   - hesapla giriş yapılmışsa ilerlemeyi hesaba kaydeder (diğer cihazlarda da görünür)
   Kullanım: <script src="../ilerleme.js" data-key="erdevelop-egitim-rhino" defer></script> */
(() => {
  'use strict';
  const me = document.currentScript || document.querySelector('script[data-key][src*="ilerleme.js"]');
  const KEY = me && me.dataset.key; if (!KEY) return;
  const SLUG = KEY.replace('erdevelop-egitim-', '');
  const $ = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const st = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TK = KEY + '-t', SK = KEY + '-son', OK = 'erdevelop-egitim-ozet';
  const title = (document.querySelector('header.head h1') || {}).textContent || document.title;
  const boxes = [...document.querySelectorAll('li.task input[type=checkbox]')];
  const days = [...document.querySelectorAll('section.day')];
  if (!boxes.length || !days.length) return;
  const dayName = s => { const h = s.querySelector('.day-head h2'); return h ? h.textContent : ''; };

  /* ---------- stil ---------- */
  const css = `
  .ilk { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 18px clamp(16px, 4vw, 26px); margin-top: 22px; }
  .ilk-top { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .ilk-top h2 { font: 700 1.15rem/1.2 var(--f-display); margin: 0; }
  .ilk-pct { font: 600 13px var(--f-mono); color: var(--accent); margin-left: auto; }
  .ilk-bar { height: 8px; border-radius: 4px; background: var(--panel-2); border: 1px solid var(--line); overflow: hidden; margin: 12px 0 4px; }
  .ilk-bar i { display: block; height: 100%; width: 0; background: var(--accent); transition: width .5s; }
  .ilk-sub { font: 400 12px var(--f-mono); color: var(--muted); }
  .ilk-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
  .ilk-go { font: 600 13px var(--f-body); color: var(--panel); background: var(--accent); border: 1px solid var(--accent); border-radius: 6px; padding: 8px 14px; text-decoration: none; cursor: pointer; }
  :root[data-mode="dark"] .ilk-go { color: #1a1204; }
  .ilk-btn { font: 500 12px var(--f-mono); color: var(--accent); background: none; border: 1px solid var(--line); border-radius: 6px; padding: 7px 12px; cursor: pointer; text-decoration: none; }
  .ilk-btn:hover { border-color: var(--accent); }
  .ilk-days { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 14px; }
  .ilk-days a { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--line); font: 600 12px var(--f-mono); color: var(--muted); text-decoration: none; background: var(--panel-2); position: relative; }
  .ilk-days a.part { color: var(--accent); border-color: var(--accent); }
  .ilk-days a.full { color: var(--panel); background: var(--ok); border-color: var(--ok); }
  :root[data-mode="dark"] .ilk-days a.full { color: #06140c; }
  .ilk-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .ilk-badges span { font: 500 12px var(--f-mono); border: 1px dashed var(--line); color: var(--muted); border-radius: 20px; padding: 4px 10px; opacity: .55; }
  .ilk-badges span.on { opacity: 1; border-style: solid; border-color: var(--hot); color: var(--fg); background: color-mix(in srgb, var(--hot) 10%, transparent); }
  .ilk-acc { font: 400 12.5px var(--f-body); color: var(--muted); margin-top: 12px; }
  .ilk-acc a { color: var(--accent); }
  .ilk-cert { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); display: none; }
  .ilk-cert.on { display: block; }
  .ilk-cert input { font: 400 14px var(--f-body); padding: 7px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--panel-2); color: var(--fg); min-width: 0; flex: 1 1 200px; }
  .ilk-tabs { display: flex; gap: 6px; margin-bottom: 10px; }
  .ilk-tabs button { font: 500 12px var(--f-mono); color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 6px; padding: 6px 12px; cursor: pointer; }
  .ilk-tabs button.on { color: var(--accent); border-color: var(--accent); background: var(--accent-dim); }
  .ilk-form label { display: block; font: 500 12px var(--f-mono); color: var(--muted); margin-top: 8px; }
  .ilk-form input { display: block; width: 100%; margin-top: 4px; font: 400 15px var(--f-body); padding: 8px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--panel-2); color: var(--fg); }
  .ilk-msg { font-size: 13px; margin-top: 8px; min-height: 1em; } .ilk-msg.bad { color: #c0392b; } .ilk-msg.ok { color: var(--ok); }
  .ilk-small { font-size: 12px; color: var(--muted); margin: 8px 0 0; }
  .ilk-toast { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 20px); opacity: 0; transition: .3s; background: var(--fg); color: var(--bg); font: 500 13px var(--f-body); padding: 9px 16px; border-radius: 8px; z-index: 50; pointer-events: none; }
  .ilk-toast.on { opacity: 1; transform: translate(-50%, 0); }`;
  document.head.appendChild($('style', '', css));

  /* ---------- kart ---------- */
  const card = $('section', 'ilk'); card.setAttribute('aria-label', 'İlerlemen');
  card.innerHTML = `<div class="ilk-top"><h2>İlerlemen</h2><span class="ilk-pct"></span></div>
    <div class="ilk-bar"><i></i></div><div class="ilk-sub"></div>
    <div class="ilk-row"><a class="ilk-go" href="#"></a><button class="ilk-btn" type="button" data-share>Paylaş</button></div>
    <div class="ilk-days"></div><div class="ilk-badges"></div><div class="ilk-acc"></div>
    <div class="ilk-cert"><div class="ilk-sub">Tebrikler, eğitimi tamamladın. Adını yaz, tamamlama belgeni indir.</div>
      <div class="ilk-row"><input type="text" maxlength="60" placeholder="Adın soyadın" aria-label="Belgedeki ad"><button class="ilk-go" type="button" data-cert>Belgeyi indir (PNG)</button></div></div>`;
  const head = document.querySelector('header.head');
  if (head) head.after(card); else days[0].before(card);
  const toast = $('div', 'ilk-toast'); document.body.appendChild(toast); let tt = 0;
  const say = m => { toast.textContent = m; toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 2400); };
  const q = s => card.querySelector(s);
  days.forEach(s => { const a = $('a', '', s.dataset.day); a.href = '#' + s.id; a.title = 'Gün ' + s.dataset.day + ' · ' + dayName(s); q('.ilk-days').appendChild(a); });

  const BADGES = [['ilk', '✦ İlk adım', (c) => c >= 1], ['gun', '◆ İlk gün tamam', (c, t, f) => f >= 1], ['yari', '◐ Yarı yol', (c, t) => c * 2 >= t], ['son', '★ Eğitim tamam', (c, t) => c === t]];
  let lastBadges = null;
  const ago = t => { if (!t) return ''; const d = Math.floor((Date.now() - t) / 864e5); return d <= 0 ? 'bugün' : d === 1 ? 'dün' : d + ' gün önce'; };

  function paint() {
    const tot = boxes.length, c = boxes.filter(b => b.checked).length, pct = Math.round(c * 100 / tot);
    let full = 0, firstOpen = null;
    days.forEach((s, i) => {
      const bs = [...s.querySelectorAll('li.task input')], k = bs.filter(b => b.checked).length, a = q('.ilk-days').children[i];
      a.className = bs.length && k === bs.length ? 'full' : k ? 'part' : ''; if (bs.length && k === bs.length) full++; else if (!firstOpen) firstOpen = s;
    });
    q('.ilk-pct').textContent = '%' + pct; q('.ilk-bar i').style.width = pct + '%';
    const son = +st.get(SK + '-t') || 0;
    q('.ilk-sub').textContent = `${c}/${tot} kontrol · ${full}/${days.length} gün tamam` + (son ? ` · son çalışma ${ago(son)}` : '');
    const go = q('.ilk-go'), lastId = st.get(SK), last = lastId && document.getElementById(lastId);
    const target = c === 0 ? days[0] : (last && last.classList.contains('day') && ![...last.querySelectorAll('li.task input')].every(b => b.checked)) ? last : firstOpen;
    if (c === tot) { go.textContent = 'Baştan göz at →'; go.href = '#' + days[0].id; }
    else { go.textContent = (c === 0 ? 'Başla → ' : 'Kaldığın yerden devam et → ') + 'Gün ' + target.dataset.day + ': ' + dayName(target); go.href = '#' + target.id; }
    const on = BADGES.map(([id, l, f]) => [id, l, f(c, tot, full)]);
    q('.ilk-badges').innerHTML = on.map(([id, l, o]) => `<span class="${o ? 'on' : ''}" title="${o ? 'Kazanıldı' : 'Henüz değil'}">${l}</span>`).join('');
    if (lastBadges) on.forEach(([id, l, o], i) => { if (o && !lastBadges[i]) say('Rozet kazandın: ' + l); });
    lastBadges = on.map(x => x[2]);
    q('.ilk-cert').classList.toggle('on', c === tot);
    /* özet: Araçlar sayfası kartlarda gösterir */
    try { const O = JSON.parse(st.get(OK) || '{}'); O[location.pathname.replace(/index\.html$/, '')] = { p: pct, t: Date.now(), ad: title }; st.set(OK, JSON.stringify(O)); } catch (e) { }
  }

  /* son bakılan gün */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { st.set(SK, e.target.id); st.set(SK + '-t', String(Date.now())); } }), { rootMargin: '-45% 0px -50% 0px' });
    days.forEach(s => io.observe(s));
  }

  /* değişiklikleri izle */
  let applying = false;
  const touched = () => { if (applying) return; st.set(TK, String(Date.now())); st.set(SK + '-t', String(Date.now())); paint(); push(); };
  boxes.forEach(b => b.addEventListener('change', touched));
  const rb = document.getElementById('resetBtn'); if (rb) rb.addEventListener('click', () => setTimeout(touched, 0));

  /* paylaş */
  q('[data-share]').addEventListener('click', async () => {
    const c = boxes.filter(b => b.checked).length, pct = Math.round(c * 100 / boxes.length);
    const text = `${title}: %${pct} tamamladım. Ücretsiz, tarayıcıda.`, url = location.origin + location.pathname;
    try { if (navigator.share) { await navigator.share({ title, text, url }); return; } await navigator.clipboard.writeText(text + ' ' + url); say('Bağlantı kopyalandı'); } catch (e) { }
  });

  /* tamamlama belgesi */
  const nm = q('.ilk-cert input'); nm.value = st.get('erdevelop-egitim-ad') || '';
  q('[data-cert]').addEventListener('click', () => {
    const name = nm.value.trim(); if (!name) { nm.focus(); say('Önce adını yaz'); return; }
    st.set('erdevelop-egitim-ad', name);
    const W = 1600, H = 1130, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#f7f9fb'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#e3e8ed'; g.lineWidth = 1; for (let x = 0; x < W; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = '#2f6fb5'; g.lineWidth = 6; g.strokeRect(50, 50, W - 100, H - 100); g.lineWidth = 1.5; g.strokeRect(70, 70, W - 140, H - 140);
    g.textAlign = 'center'; g.fillStyle = '#2f6fb5'; g.font = '600 26px "IBM Plex Mono", Consolas, monospace'; g.fillText('ERDEVELOP · EĞİTİMLER', W / 2, 190);
    g.fillStyle = '#1c2833'; g.font = '700 74px "Chakra Petch", "Segoe UI", sans-serif'; g.fillText('TAMAMLAMA BELGESİ', W / 2, 300);
    g.fillStyle = '#74838f'; g.font = '400 30px "IBM Plex Sans", "Segoe UI", sans-serif'; g.fillText('Bu belge', W / 2, 420);
    let fs = 84; g.font = `700 ${fs}px "IBM Plex Sans", "Segoe UI", sans-serif`; while (g.measureText(name).width > W - 300 && fs > 40) { fs -= 4; g.font = `700 ${fs}px "IBM Plex Sans", "Segoe UI", sans-serif`; }
    g.fillStyle = '#1c2833'; g.fillText(name, W / 2, 530);
    g.strokeStyle = '#cfd8e1'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 380, 565); g.lineTo(W / 2 + 380, 565); g.stroke();
    g.fillStyle = '#45535f'; g.font = '400 32px "IBM Plex Sans", "Segoe UI", sans-serif'; g.fillText('adına, aşağıdaki programın tüm günlerini ve kontrol listelerini', W / 2, 650); g.fillText('tamamladığı için verilmiştir.', W / 2, 695);
    g.fillStyle = '#2f6fb5'; g.font = '700 54px "Chakra Petch", "Segoe UI", sans-serif'; g.fillText(title, W / 2, 800);
    g.fillStyle = '#74838f'; g.font = '400 26px "IBM Plex Mono", Consolas, monospace';
    g.fillText(`${days.length} gün · ${boxes.length} kontrol · ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, 870);
    g.fillText('erdevelop.com' + location.pathname.replace(/index\.html$/, ''), W / 2, 1000);
    g.font = '400 20px "IBM Plex Sans", "Segoe UI", sans-serif'; g.fillText('Kendi kendine çalışma programıdır; resmi bir sertifika değildir.', W / 2, 1040);
    cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `belge-${SLUG}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); say('Belge indirildi'); }, 'image/png');
  });

  /* ---------- tek hesap: giriş / kayıt / eşitleme (Firebase yalnızca gerekince yüklenir) ---------- */
  const FB = { apiKey: 'AIzaSyBtNow8j7AZQO2sWCiXb1WbOT261wJUGRU', authDomain: 'oyun-bahcesi-62633.firebaseapp.com', projectId: 'oyun-bahcesi-62633' };
  let db = null, auth = null, user = null, pushT = 0, fresh = false, listening = false;
  const acc = q('.ilk-acc');
  const errTr = e => { const c = String(e && (e.code || e.message) || e); return /wrong-password|invalid-credential|invalid-login/.test(c) ? 'E-posta ya da şifre hatalı.' : /user-not-found/.test(c) ? 'Bu e-postayla hesap bulunamadı.' : /email-already-in-use/.test(c) ? 'Bu e-postayla zaten bir hesap var; Giriş yap sekmesini kullan.' : /too-many/.test(c) ? 'Çok fazla deneme; biraz sonra tekrar dene.' : /weak-password/.test(c) ? 'Şifre en az 6 karakter olmalı.' : /network/.test(c) ? 'Bağlantı hatası; internetini kontrol et.' : /invalid-email/.test(c) ? 'E-posta adresi geçersiz.' : 'Bir hata oluştu: ' + c; };
  const accNo = () => {
    acc.innerHTML = `İlerlemen bu tarayıcıda saklanıyor. Hesapla kaydedersen telefonda ve bilgisayarda aynı yerden devam edersin; tek hesap tüm sitede (eğitimler, dil kulüpleri, Oyun Bahçesi) geçerli. Hesap isteğe bağlıdır.
      <div class="ilk-row"><button class="ilk-btn" type="button" data-a="giris">Giriş yap</button><button class="ilk-btn" type="button" data-a="kayit">Hesap aç</button></div>`;
    acc.querySelectorAll('[data-a]').forEach(b => b.onclick = () => form(b.dataset.a));
  };
  function form(tab) {
    const up = tab === 'kayit';
    acc.innerHTML = `<div class="ilk-tabs"><button type="button" class="${up ? '' : 'on'}" data-t="giris">Giriş yap</button><button type="button" class="${up ? 'on' : ''}" data-t="kayit">Hesap aç</button><span style="flex:1"></span><button type="button" data-x title="Kapat">✕</button></div>
      <form class="ilk-form" autocomplete="on">
        ${up ? '<label>Adın<input name="ad" maxlength="24" required autocomplete="nickname"></label>' : ''}
        <label>E-posta<input name="m" type="email" required autocomplete="email"></label>
        <label>Şifre${up ? ' (en az 6 karakter)' : ''}<input name="p" type="password" minlength="6" required autocomplete="${up ? 'new-password' : 'current-password'}"></label>
        <div class="ilk-row"><button class="ilk-go" type="submit">${up ? 'Hesap aç ve kaydet' : 'Giriş yap'}</button>${up ? '' : '<button class="ilk-btn" type="button" data-r>Şifremi unuttum</button>'}</div>
        <div class="ilk-msg" role="status"></div>
        <p class="ilk-small">Aynı hesap Oyun Bahçesi, dil kulüpleri ve tüm eğitimlerde geçerli. Bu cihazda işaretlediklerin hesabına eklenir. <a href="/gizlilik.html">Gizlilik</a></p>
      </form>`;
    acc.querySelectorAll('[data-t]').forEach(b => b.onclick = () => form(b.dataset.t));
    acc.querySelector('[data-x]').onclick = accNo;
    const f = acc.querySelector('form'), M = acc.querySelector('.ilk-msg'), msg = (t, ok) => { M.textContent = t; M.className = 'ilk-msg' + (ok ? ' ok' : ' bad'); };
    f.querySelector('input').focus();
    const r = acc.querySelector('[data-r]');
    if (r) r.onclick = async () => { const m = f.m.value.trim(); if (!m) { f.m.focus(); return msg('Önce e-posta adresini yaz.'); } try { await ensureFb(); await auth.sendPasswordResetEmail(m); msg('Bu adrese kayıtlı bir hesap varsa şifre yenileme linki gönderildi. Gereksiz (spam) klasörünü de kontrol et.', true); } catch (e) { msg(errTr(e)); } };
    f.onsubmit = async e => {
      e.preventDefault(); const bt = f.querySelector('[type=submit]'), lb = bt.textContent; bt.disabled = true; bt.textContent = '…';
      try {
        await ensureFb(); fresh = true;
        if (up) { const ad = f.ad.value.trim(), c = await auth.createUserWithEmailAndPassword(f.m.value.trim(), f.p.value); await c.user.updateProfile({ displayName: ad }); await db.collection('users').doc(c.user.uid).set({ name: ad, email: c.user.email }, { merge: true }); fresh = true; onUser(auth.currentUser); }
        else await auth.signInWithEmailAndPassword(f.m.value.trim(), f.p.value);
      } catch (x) { fresh = false; msg(errTr(x)); bt.disabled = false; bt.textContent = lb; }
    };
  }
  const summary = () => { const done = {}; boxes.forEach(b => { if (b.checked) done[b.dataset.id] = 1; }); return { done, n: boxes.length, ad: title, url: location.pathname.replace(/index\.html$/, ''), t: +st.get(TK) || Date.now() }; };
  function push() {
    if (!db || !user) return; clearTimeout(pushT);
    pushT = setTimeout(() => { db.collection('users').doc(user.uid).set({ egitim: { [SLUG]: summary() } }, { merge: true }).catch(() => { }); }, 1200);
  }
  function apply(remote, union) {
    applying = true;
    boxes.forEach(b => { const want = !!remote.done[b.dataset.id] || (union && b.checked); if (b.checked !== want) { b.checked = want; b.dispatchEvent(new Event('change')); } });
    applying = false; st.set(TK, String(union ? Date.now() : remote.t)); paint();
  }
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  let fbP = null;
  const ensureFb = () => fbP || (fbP = (async () => {
    const V = 'https://www.gstatic.com/firebasejs/10.12.2/';
    if (!window.firebase) await load(V + 'firebase-app-compat.js');
    await Promise.all(['auth', 'firestore'].filter(n => !firebase[n]).map(n => load(V + `firebase-${n}-compat.js`)));
    if (!firebase.apps.length) firebase.initializeApp(FB);
    db = firebase.firestore(); auth = firebase.auth(); auth.languageCode = 'tr';
    if (!listening) { listening = true; auth.onAuthStateChanged(onUser); }
  })().catch(e => { fbP = null; throw e; }));
  async function onUser(u) {
    if (u && user && u.uid === user.uid && !fresh) return;
    if (!u) { const was = user; user = null; if (was || !acc.querySelector('form')) accNo(); return; }
    user = u;
    const nmShow = u.displayName || (u.email || '').split('@')[0];
    acc.innerHTML = `☁ İlerlemen hesabına kaydediliyor (${esc(nmShow)}). Diğer cihazlarında da aynı yerden devam edersin. <a href="/hesap.html">Hesabım</a> · <a href="#" data-out>Çıkış yap</a>`;
    acc.querySelector('[data-out]').onclick = e => { e.preventDefault(); auth.signOut(); };
    try {
      const d = await db.collection('users').doc(u.uid).get(), r = d.exists && d.data().egitim && d.data().egitim[SLUG];
      const lt = +st.get(TK) || 0;
      if (fresh) { if (r && r.done) apply(r, true); push(); say('Giriş yapıldı; ilerlemen hesabına kaydedildi'); }
      else if (r && r.done && (r.t || 0) > lt) { apply(r, false); say('İlerlemen hesabından yüklendi'); }
      else if (boxes.some(b => b.checked)) push();
      if (!nm.value && nmShow) nm.value = u.displayName || '';
    } catch (e) { }
    fresh = false;
  }
  const hadUser = () => new Promise(res => {
    try {
      const r = indexedDB.open('firebaseLocalStorageDb'); r.onerror = () => res(false);
      r.onupgradeneeded = () => { r.transaction.abort(); res(false); };
      r.onsuccess = () => { const d = r.result; try { const tx = d.transaction('firebaseLocalStorage', 'readonly'), g = tx.objectStore('firebaseLocalStorage').getAll(); g.onsuccess = () => { res((g.result || []).some(x => String(x.fbase_key || '').startsWith('firebase:authUser:'))); d.close(); }; g.onerror = () => { res(false); d.close(); }; } catch (e) { res(false); d.close(); } };
    } catch (e) { res(false); }
  });
  accNo();
  async function sync() { if (await hadUser()) try { await ensureFb(); } catch (e) { } }
  paint();
  (window.requestIdleCallback || (f => setTimeout(f, 1500)))(sync);
})();
