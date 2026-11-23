/* Organizma – Yaratık – Yuva – Kabile – Şehir: ortak hesap kaydı (bulut yedeği).
   Serideki oyunların yerel kayıtlarını (zincir ilerlemesi dahil) hesabın users/{uid} belgesindeki
   "seri" alanına yedekler. Firebase yalnızca giriş yapılmışsa ya da oyuncu giriş istediğinde yüklenir. */
(function () {
  'use strict';
  var kok = document.getElementById('seriHesap');
  if (!kok) return;
  var FBC = { apiKey: 'AIzaSyBtNow8j7AZQO2sWCiXb1WbOT261wJUGRU', authDomain: 'oyun-bahcesi-62633.firebaseapp.com', projectId: 'oyun-bahcesi-62633', storageBucket: 'oyun-bahcesi-62633.firebasestorage.app', messagingSenderId: '591926138614', appId: '1:591926138614:web:24101e1be195ebc04c3ed7' };
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-';
  var ANAHTAR = { o: 'organizma-kayit', y: 'yaratik-kayit', v: 'yuva-kayit', k: 'kabile-kayit', s: 'sehir-kayit' };
  var AD = { o: ['Organizma', 'Organism'], y: ['Yaratık', 'Creature'], v: ['Yuva', 'Nest'], k: ['Kabile', 'Tribe'], s: ['Şehir', 'City'] };
  /* Seri dışı oyunlar da kullanabilir: <div id="seriHesap" data-anahtar='{"z":"kozmos-kayit"}' data-ad='{"z":["Kozmos","Kozmos"]}'
     data-aciklama="Türkçe|English" data-link="0">. Her oyun kendi anahtarını "seri" alanına ekler, diğerlerine dokunmaz. */
  var OZEL = null; try { if (kok.dataset.anahtar) { ANAHTAR = JSON.parse(kok.dataset.anahtar); AD = JSON.parse(kok.dataset.ad || '{}'); OZEL = (kok.dataset.aciklama || '').split('|'); } } catch (e) { }
  var LINK = kok.dataset.link !== '0';
  var ESIT = 'seri-esit', IPUCU = 'seri-giris', ARALIK = 90000;

  function T(a, b) { return window.erDil && erDil.t ? erDil.t(a, b) : a; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsAl(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsYaz(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function ozet(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return s.length + ':' + h; }
  function esitAl() { try { return JSON.parse(lsAl(ESIT) || '{}') || {}; } catch (e) { return {}; } }
  function esitYaz(m) { lsYaz(ESIT, JSON.stringify(m)); }

  var D = { asama: 'bos', kul: null, ref: null, hazir: false, cakisma: null, form: false, mesaj: '', mesgul: false, son: 0 };

  var st = document.createElement('style');
  st.textContent = '#seriHesap{margin:10px 0 2px;font-size:13px;line-height:1.45;border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:9px 11px;background:rgba(0,0,0,.18);color:inherit;text-align:left}' +
    '#seriHesap b{font-weight:800}#seriHesap small{opacity:.75}' +
    '#seriHesap .sr{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#seriHesap .sr>span{flex:1 1 150px;min-width:0;overflow-wrap:anywhere}' +
    '#seriHesap button{font:inherit;font-weight:800;font-size:13px;min-height:36px;padding:6px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:inherit;cursor:pointer}' +
    '#seriHesap button.a{background:#2E9E6B;border-color:#2E9E6B;color:#fff}#seriHesap button:disabled{opacity:.5;cursor:default}' +
    '#seriHesap input{font:inherit;font-size:15px;width:100%;box-sizing:border-box;min-height:38px;margin:6px 0 0;padding:6px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.25);color:inherit}' +
    '#seriHesap .sm{margin-top:6px;color:#FFD27A;font-weight:700}#seriHesap .sb{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}';
  document.head.appendChild(st);

  function ciz() {
    var h = '';
    if (D.cakisma) {
      var adlar = D.cakisma.map(function (k) { return AD[k] ? T(AD[k][0], AD[k][1]) : k; }).join(', ');
      h = '<div>☁️ <b>' + T('Hesabında başka bir cihazdan daha yeni kayıt var', 'Your account has a newer save from another device') + '</b> (' + esc(adlar) + ')</div>' +
        '<div class="sb"><button type="button" class="a" data-s="yukle">' + T('Hesaptakini yükle', 'Load account save') + '</button><button type="button" data-s="koru">' + T('Bu cihazdakini koru', 'Keep this device') + '</button></div>';
    } else if (D.kul) {
      var dur = !D.hazir ? T('eşitleniyor…', 'syncing…') : D.son ? T('yedeklendi ✓', 'backed up ✓') : T('hazır', 'ready');
      h = '<div class="sr"><span>☁️ <b>' + esc(D.kul.email || T('Hesap', 'Account')) + '</b><br><small>' + (OZEL && OZEL[0] ? T(OZEL[0], OZEL[1] || OZEL[0]) : T('Serideki oyunların ilerlemesi hesabına yedekleniyor', 'Progress of the whole series is backed up')) + ' · ' + dur + '</small></span><button type="button" data-s="cikis">' + T('Çıkış', 'Sign out') + '</button></div>';
    } else if (D.form) {
      h = '<div><b>☁️ ' + T('Hesabına giriş yap', 'Sign in') + '</b><br><small>' + (OZEL && OZEL[0] ? T('İlerlemen her cihazda açılır.', 'Your progress opens on every device.') : T('Organizma, Yaratık, Yuva, Kabile ve Şehir ilerlemen her cihazda açılır.', 'Your Organism, Creature, Nest, Tribe and City progress opens on every device.')) + '</small></div>' +
        '<input id="seriE" type="email" autocomplete="email" placeholder="' + T('E-posta', 'E-mail') + '">' +
        '<input id="seriP" type="password" autocomplete="current-password" placeholder="' + T('Şifre', 'Password') + '">' +
        '<div class="sb"><button type="button" class="a" data-s="gir"' + (D.mesgul ? ' disabled' : '') + '>' + T('Giriş yap', 'Sign in') + '</button><button type="button" data-s="kayit"' + (D.mesgul ? ' disabled' : '') + '>' + T('Kayıt ol', 'Sign up') + '</button><button type="button" data-s="vazgec">' + T('Vazgeç', 'Cancel') + '</button></div>';
    } else if (D.asama === 'yukleniyor') {
      h = '<div>☁️ <small>' + T('Hesap denetleniyor…', 'Checking account…') + '</small></div>';
    } else {
      h = '<div class="sr"><span>☁️ <small>' + T('Kayıt yalnızca bu cihazda. Giriş yaparsan ilerlemen kaybolmaz.', 'Your save lives only on this device. Sign in to keep it safe.') + '</small></span><button type="button" data-s="ac">' + T('Giriş yap', 'Sign in') + '</button></div>';
    }
    if (D.mesaj) h += '<div class="sm">' + esc(D.mesaj) + '</div>';
    if (LINK && !/\/seri\.html$/.test(location.pathname)) h += '<div style="margin-top:7px"><a href="/seri.html" style="font-weight:800;color:inherit">🧬 ' + T('Bütün yolculuğun: tek hücreden krallığa', 'Your whole journey: from a cell to a kingdom') + ' ›</a></div>';
    var e = document.getElementById('seriE'), p = document.getElementById('seriP'), ev = e && e.value, pv = p && p.value;
    kok.innerHTML = h;
    if (D.form && !D.kul) { e = document.getElementById('seriE'); p = document.getElementById('seriP'); if (e && ev) e.value = ev; if (p && pv) p.value = pv; }
  }

  function js(src) {
    var c = window.__erJs = window.__erJs || {};
    return c[src] || (c[src] = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { delete c[src]; no(new Error('ag')); }; document.head.appendChild(s); }));
  }
  var fbSoz = null;
  function fb() {
    return fbSoz || (fbSoz = (async function () {
      await js(SDK + 'app-compat.js'); await js(SDK + 'auth-compat.js'); await js(SDK + 'firestore-compat.js');
      var app = firebase.apps.filter(function (a) { return a.name === '[DEFAULT]'; })[0] || firebase.initializeApp(FBC);
      var auth = firebase.auth(app);
      auth.onAuthStateChanged(function (u) { oturum(u, firebase.firestore(app)); });
      return auth;
    })().catch(function (e) { fbSoz = null; throw e; }));
  }

  function hata(e) {
    var c = (e && e.code) || '';
    if (/wrong-password|invalid-credential|invalid-login/.test(c)) return T('E-posta veya şifre hatalı', 'Wrong e-mail or password');
    if (/user-not-found/.test(c)) return T('Bu e-postayla hesap yok', 'No account with this e-mail');
    if (/email-already/.test(c)) return T('Bu e-posta zaten kayıtlı — Giriş yap', 'This e-mail is already registered — sign in');
    if (/weak-password/.test(c)) return T('Şifre en az 6 karakter olmalı', 'Password must be at least 6 characters');
    if (/invalid-email/.test(c)) return T('Geçersiz e-posta', 'Invalid e-mail');
    if (/too-many/.test(c)) return T('Çok fazla deneme, biraz sonra tekrar dene', 'Too many attempts, try again later');
    return T('Bağlantı kurulamadı, internetini denetle', 'Could not connect, check your internet');
  }

  function oturum(u, db) {
    D.kul = u || null; D.hazir = false; D.cakisma = null; D.asama = 'bos';
    if (!u) { D.ref = null; try { localStorage.removeItem(IPUCU); } catch (e) { } ciz(); return; }
    lsYaz(IPUCU, '1'); D.form = false; D.mesaj = '';
    D.ref = db.collection('users').doc(u.uid);
    ciz(); esitle();
  }

  var bulut = null;
  /* Buluttaki kayıtla yereli karşılaştırır: yerelde olmayan sessizce iner, bulutta yenisi varsa oyuncuya sorulur,
     gerisi yukarı gönderilir. İlk karşılaştırma bitmeden hiçbir şey yukarı yazılmaz. */
  async function esitle() {
    var ref = D.ref, uid = D.kul && D.kul.uid; if (!ref) return;
    try {
      var snap = await ref.get(); if (ref !== D.ref) return;
      var veri = snap.exists ? snap.data() : null;
      bulut = (veri && veri.seri) || {};
      var m = esitAl(); if (m.uid !== uid) m = { uid: uid };
      var indi = false, sor = [];
      Object.keys(ANAHTAR).forEach(function (k) {
        var b = bulut[k], y = lsAl(ANAHTAR[k]);
        if (!b || typeof b.v !== 'string') return;
        if (y == null) { lsYaz(ANAHTAR[k], b.v); m[k] = { t: b.t, h: ozet(b.v) }; indi = true; return; }
        if (y === b.v) { m[k] = { t: b.t, h: ozet(y) }; return; }
        if (!m[k] || b.t > m[k].t) sor.push(k);
      });
      esitYaz(m);
      if (indi && !sor.length) { location.reload(); return; }
      if (sor.length) { D.cakisma = sor; ciz(); return; }
      D.hazir = true; ciz(); gonder();
    } catch (e) { D.mesaj = T('Hesaba ulaşılamadı; kayıt bu cihazda sürüyor.', 'Could not reach your account; saving on this device.'); ciz(); }
  }

  var gidiyor = false;
  async function gonder(zorla) {
    if (!D.ref || !D.hazir || gidiyor) return;
    var m = esitAl(), yuk = {}, yeni = {}, t = Date.now(), var_ = false;
    Object.keys(ANAHTAR).forEach(function (k) {
      var y = lsAl(ANAHTAR[k]); if (y == null || y.length > 300000) return;
      var h = ozet(y);
      if (!zorla && m[k] && m[k].h === h) return;
      yuk[k] = { v: y, t: t }; yeni[k] = { t: t, h: h }; var_ = true;
    });
    if (!var_) return;
    gidiyor = true;
    try {
      await D.ref.set({ seri: yuk }, { merge: true });
      m = esitAl(); m.uid = D.kul && D.kul.uid; Object.keys(yeni).forEach(function (k) { m[k] = yeni[k]; }); esitYaz(m);
      D.son = t; D.mesaj = ''; ciz();
    } catch (e) { }
    gidiyor = false;
  }

  kok.addEventListener('click', async function (ev) {
    var b = ev.target.closest('button[data-s]'); if (!b) return;
    var s = b.dataset.s;
    if (s === 'ac') { D.form = true; D.mesaj = ''; ciz(); fb().catch(function () { }); return; }
    if (s === 'vazgec') { D.form = false; D.mesaj = ''; ciz(); return; }
    if (s === 'gir' || s === 'kayit') {
      var em = (document.getElementById('seriE').value || '').trim(), pw = document.getElementById('seriP').value || '';
      if (!em || !pw) { D.mesaj = T('E-posta ve şifreni yaz', 'Enter your e-mail and password'); ciz(); return; }
      D.mesgul = true; D.mesaj = ''; ciz();
      try {
        var a = await fb();
        if (s === 'gir') await a.signInWithEmailAndPassword(em, pw);
        else { var c = await a.createUserWithEmailAndPassword(em, pw); try { await firebase.firestore().collection('users').doc(c.user.uid).set({ email: c.user.email }, { merge: true }); } catch (x) { } }
      } catch (e) { D.mesaj = hata(e); }
      D.mesgul = false; ciz(); return;
    }
    if (s === 'cikis') { try { await gonder(); (await fb()).signOut(); } catch (e) { } return; }
    if (s === 'yukle' && D.cakisma) {
      var m = esitAl();
      D.cakisma.forEach(function (k) { var x = bulut[k]; lsYaz(ANAHTAR[k], x.v); m[k] = { t: x.t, h: ozet(x.v) }; });
      esitYaz(m); window.__seriYukleniyor = true; location.reload(); return;
    }
    if (s === 'koru' && D.cakisma) {
      var m2 = esitAl(); D.cakisma.forEach(function (k) { m2[k] = { t: bulut[k].t, h: '' }; }); esitYaz(m2);
      D.cakisma = null; D.hazir = true; ciz(); gonder(); return;
    }
  });

  setInterval(function () { if (!document.hidden) gonder(); }, ARALIK);
  document.addEventListener('visibilitychange', function () { if (document.hidden) gonder(); });
  addEventListener('pagehide', function () { gonder(); });
  if (window.erDil && erDil.on) erDil.on(ciz);
  window.seriKayit = { simdi: function () { return gonder(); }, durum: function () { return D; } };

  /* Giriş yapılmış mı? Firebase'i boşuna yüklememek için önce yerel ipuçlarına bakılır. */
  function ipucu() {
    if (lsAl(IPUCU) === '1') return Promise.resolve(true);
    return new Promise(function (ok) {
      try {
        var q = indexedDB.open('firebaseLocalStorageDb'), yeniDb = false;
        q.onupgradeneeded = function () { yeniDb = true; };
        q.onerror = function () { ok(false); };
        q.onsuccess = function () {
          var db = q.result;
          if (yeniDb || !db.objectStoreNames.contains('firebaseLocalStorage')) { db.close(); if (yeniDb) try { indexedDB.deleteDatabase('firebaseLocalStorageDb'); } catch (e) { } ok(false); return; }
          var r = db.transaction('firebaseLocalStorage').objectStore('firebaseLocalStorage').getAllKeys();
          r.onsuccess = function () { db.close(); ok((r.result || []).some(function (k) { return String(k).indexOf('firebase:authUser:' + FBC.apiKey) === 0; })); };
          r.onerror = function () { db.close(); ok(false); };
        };
      } catch (e) { ok(false); }
    });
  }
  ciz();
  ipucu().then(function (var_) {
    if (!var_) return;
    D.asama = 'yukleniyor'; ciz();
    fb().catch(function () { D.asama = 'bos'; ciz(); });
  });
})();
