/* Yapay Zeki · ana denetim: ses algısı, davranışlar, dinleme, konuşma, arayüz */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), sec = a => a[Math.floor(Math.random() * a.length)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const AYAR = Object.assign({ tanima: 'otomatik', whisper: 'Xenova/whisper-small', surekli: true, sesTani: false, yorum: true, ses: '', perde: 1.15, hiz: 1.05, beyin: false, sessiz: false, gorunum: 'robot' }, JSON.parse(LS.get('zeki:ayar') || '{}'));
  const ayarKaydet = () => LS.set('zeki:ayar', JSON.stringify(AYAR));

  /* ---------------- durum ---------------- */
  const S = { durum: 'uyuyor', duygu: 'notr', bakX: 0, bakY: 0, konusmaZarf: 0, dans: false, bpm: 110, merak: 0, irkil: 0, uykulu: 0, esne: 0 };
  const SES = { seviye: 0, spektrum: null, dalga: null, vurus: false, db: -100, taban: -60 };
  let uyandi = false, sonEtkilesim = performance.now(), sonIsaretci = 0, duyguBitis = 0, bekle = null, aktifSohbetBitis = 0;
  function duygu(d, sn = 4) { S.duygu = d; duyguBitis = performance.now() + sn * 1000; if (d === 'utangac' || d === 'mutlu' && Math.random() < .3) S.kalp = 1; }
  function durum(d) { S.durum = d; $('durum').dataset.d = d; $('durumT').textContent = { uyuyor: 'Uyuyor', bekliyor: 'Seni bekliyor', dinliyor: 'Dinliyor…', dusunuyor: 'Düşünüyor…', konusuyor: 'Konuşuyor' }[d] || d; $('mik').classList.toggle('acik', d === 'dinliyor'); }

  /* ---------------- çizim döngüsü ---------------- */
  const GORUNUM = { robot: ['Robot', '🤖', c => Yuz.kur(c)], bulut: ['Nokta bulutu', '👤', c => Gorunumler.bulut(c)], kure: ['Enerji küresi', '🔆', c => Gorunumler.kure(c)], hud: ['Halkalı arayüz', '🎯', c => Gorunumler.hud(c)], dalga: ['Ses dalgası yüz', '〰️', c => Gorunumler.dalgaYuz(c)], galaksi: ['Galaksi', '🌌', c => Gorunumler.galaksi(c)] };
  if (!GORUNUM[AYAR.gorunum]) AYAR.gorunum = 'robot';
  let yuz = GORUNUM[AYAR.gorunum][2]($('sahne'));
  function gorunumSec(ad, sessiz) {
    if (!GORUNUM[ad]) return; AYAR.gorunum = ad; ayarKaydet(); yuz = GORUNUM[ad][2]($('sahne'));
    document.querySelectorAll('#gorSec button').forEach(b => b.classList.toggle('on', b.dataset.g === ad)); $('gorAc').textContent = GORUNUM[ad][1];
    if (!sessiz) { const el = $('gorBilgi'); el.textContent = GORUNUM[ad][0]; el.classList.add('gor'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('gor'), 1400); }
  }
  let son = performance.now(), gozT = 2, bakT = 1, yz = null;
  function dongu(now) {
    const dt = Math.min(.05, (now - son) / 1000); son = now;
    sesOku(dt); davranis(now, dt);
    yz = yuz.ciz(S, SES, dt);
    requestAnimationFrame(dongu);
  }
  /* kendiliğinden davranışlar */
  function davranis(now, dt) {
    if (duyguBitis && now > duyguBitis) { S.duygu = 'notr'; duyguBitis = 0; }
    S.irkil = Math.max(0, S.irkil - dt * 1.8); S.merak = Math.max(0, S.merak - dt * .5);
    if (S.durum === 'uyuyor') { S.bakX *= .98; S.bakY = .3; return; }
    gozT -= dt; if (gozT <= 0) { S.kirp = 1; gozT = Math.random() < .2 ? .25 : 2 + Math.random() * 4; }
    if (now - sonIsaretci > 2500) {
      bakT -= dt;
      if (bakT <= 0) {
        if (S.durum === 'dinliyor' || S.durum === 'konusuyor') { S.bakX = (Math.random() - .5) * .3; S.bakY = (Math.random() - .5) * .2; }
        else { S.bakX = (Math.random() - .5) * 1.4; S.bakY = (Math.random() - .5) * .8; if (Math.random() < .3) { S.bakX = 0; S.bakY = 0; } }
        bakT = 1 + Math.random() * 3;
      }
    }
    /* sıkılma, esneme, uyuklama */
    const bos = (now - sonEtkilesim) / 1000;
    if (S.durum === 'bekliyor') {
      S.uykulu = clamp((bos - 90) / 60, 0, .7);
      if (bos > 45 && Math.random() < dt / 25 && !S.esne) { S.esne = 1; S.kirp = 0; setTimeout(() => S.esne = 0, 1600); }
      if (bos > 240 && !S.dans) { durum('uyuyor'); balon('Zzz… Uyandırmak için seslen ya da dokun.', 'sistem'); }
    } else S.uykulu = 0;
    if (S.dans && now - sonVurus > 6000) { S.dans = false; }
  }

  /* ---------------- ses algısı (mikrofon) ---------------- */
  let AC = null, AN = null, mikAkis = null, fBuf = null, tBuf = null, sonVurus = 0, vurusAra = [], akiDb = -100, gurultuBaslangic = 0, konusmaSesiT = 0;
  async function mikAc() {
    if (mikAkis) return true;
    try {
      mikAkis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') await AC.resume();
      AN = AC.createAnalyser(); AN.fftSize = 2048; AN.smoothingTimeConstant = .6; AC.createMediaStreamSource(mikAkis).connect(AN);
      fBuf = new Float32Array(AN.frequencyBinCount); tBuf = new Float32Array(AN.fftSize); SES.spektrum = new Float32Array(128); SES.dalga = new Float32Array(160);
      $('mikIzin').hidden = true; return true;
    } catch (e) { $('mikIzin').hidden = false; return false; }
  }
  let bandOnce = null;
  function sesOku(dt) {
    SES.vurus = false;
    if (!AN) { SES.seviye *= .9; return; }
    AN.getFloatFrequencyData(fBuf); AN.getFloatTimeDomainData(tBuf);
    let rms = 0; for (let i = 0; i < tBuf.length; i++) rms += tBuf[i] * tBuf[i]; rms = Math.sqrt(rms / tBuf.length);
    const db = 20 * Math.log10(rms + 1e-9); SES.db = db;
    /* taban gürültüsü: yavaş takip */
    SES.taban = db < SES.taban ? SES.taban + (db - SES.taban) * .05 : SES.taban + (db - SES.taban) * .002;
    const ust = db - SES.taban; SES.seviye = clamp(ust / 35, 0, 1) * (konusuyorMu() ? .3 : 1);
    const n = SES.spektrum.length, L = fBuf.length;
    for (let i = 0; i < n; i++) { const a = Math.floor(Math.pow(i / n, 2) * L * .5), b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / n, 2) * L * .5)); let m = -140; for (let k = a; k < b; k++) m = Math.max(m, fBuf[k]); SES.spektrum[i] = clamp((m + 95) / 65, 0, 1); }
    for (let i = 0; i < SES.dalga.length; i++) SES.dalga[i] = tBuf[Math.floor(i / SES.dalga.length * 1024)] * 2;
    if (konusuyorMu() || S.durum === 'uyuyor' && !AYAR.surekli) return;
    /* bas bandı enerjisiyle vuruş tespiti (müzik) */
    let bas = 0; for (let k = 1; k < 12; k++) bas += Math.pow(10, fBuf[k] / 10); bas = 10 * Math.log10(bas + 1e-12);
    const simdi = performance.now();
    if (bandOnce != null && bas - bandOnce > 6 && ust > 12 && simdi - sonVurus > 260) {
      SES.vurus = true; if (sonVurus) { vurusAra.push(simdi - sonVurus); if (vurusAra.length > 8) vurusAra.shift(); } sonVurus = simdi;
      const ara = vurusAra.slice().sort((a, b) => a - b)[vurusAra.length >> 1];
      const duzenli = vurusAra.length >= 6 && vurusAra.every(v => Math.abs(v - ara) / ara < .25);
      if (duzenli && S.durum === 'bekliyor') { S.bpm = clamp(60000 / ara, 70, 180); if (!S.dans) { S.dans = true; sonEtkilesim = simdi; if (S.durum === 'uyuyor') durum('bekliyor'); } }
      if (S.dans) S.zipla = .35;
    }
    bandOnce = bas;
    /* ani yüksek ses: ırkilme */
    if (db - akiDb > 22 && ust > 28 && S.durum !== 'konusuyor') {
      S.irkil = 1; S.zipla = 1; S.kirp = 1; sonEtkilesim = simdi;
      if (S.durum === 'uyuyor' && uyandi) { durum('bekliyor'); duygu('saskin', 2); if (AYAR.yorum && !S.dans) yorumYap(sec(['Ay! Uyandım!', 'Oha, ne oldu?']), 'saskin'); }
      else if (Math.random() < .25 && AYAR.yorum && !S.dans) yorumYap(sec(['Vay! Ne oldu?', 'Hop!', 'Ödüm koptu!']), 'saskin');
      else duygu('saskin', 1.5);
    }
    akiDb = akiDb * .85 + db * .15;
    /* konuşmaya benzer ses: merakla dinle */
    if (ust > 10 && S.durum === 'bekliyor') { konusmaSesiT += dt; if (konusmaSesiT > .4) { S.merak = 1; S.bakX *= .5; S.bakY = 0; sonEtkilesim = simdi; } } else konusmaSesiT = Math.max(0, konusmaSesiT - dt);
  }
  const konusuyorMu = () => S.durum === 'konusuyor' || (window.speechSynthesis && speechSynthesis.speaking);

  /* ---------------- ses türü tanıma (YAMNet) ---------------- */
  const MPB = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@1.2.3';
  let SINIF = null, sinifT = 0, halka = null, halkaPos = 0, islem = null, sonYorum = {};
  const TEPKI = {
    'Dog': ['Bir köpek mi havlıyor? Hav hav!', 'mutlu'], 'Bark': ['Bir köpek mi havlıyor? Hav hav!', 'mutlu'], 'Cat': ['Miyav! Bir kedi mi var orada?', 'mutlu'], 'Meow': ['Miyav! Bir kedi mi var orada?', 'mutlu'],
    'Applause': ['Teşekkürler, teşekkürler! Çok naziksiniz.', 'utangac'], 'Clapping': ['Alkış mı o? Teşekkür ederim!', 'utangac'], 'Laughter': ['Hahaha! Gülmen bana da bulaştı.', 'mutlu'],
    'Sneeze': ['Çok yaşa!', 'mutlu'], 'Cough': ['Geçmiş olsun. Bir bardak su iyi gelir.', 'uzgun'], 'Doorbell': ['Kapı çalıyor galiba!', 'saskin'], 'Ding-dong': ['Kapı çalıyor galiba!', 'saskin'], 'Knock': ['Tık tık! Kapıda biri mi var?', 'saskin'],
    'Telephone bell ringing': ['Telefonun çalıyor!', 'saskin'], 'Ringtone': ['Telefonun çalıyor!', 'saskin'], 'Alarm clock': ['Alarm çalıyor!', 'saskin'], 'Baby cry, infant cry': ['Bir bebek mi ağlıyor? Umarım bir şeyi yoktur.', 'uzgun'],
    'Whistling': ['Güzel ıslık çalıyorsun!', 'mutlu'], 'Singing': ['Ne güzel şarkı söylüyorsun!', 'mutlu'], 'Thunder': ['Gök gürledi! Biraz korktum.', 'saskin'], 'Rain': ['Dışarıda yağmur mu yağıyor?', 'dusunceli'],
    'Siren': ['Bir siren sesi duydum.', 'dusunceli'], 'Bird': ['Kuş sesi! Cik cik.', 'mutlu'], 'Snoring': ['Biri horluyor mu? Hihi.', 'mutlu'], 'Typing': ['Çok çalışıyorsun, arada mola vermeyi unutma.', 'notr'], 'Drill': ['Matkap sesi! Bir şeyler mi monte ediyorsun?', 'saskin'], 'Hammer': ['Çekiç sesi! Kolay gelsin.', 'mutlu'],
  };
  async function sinifAc() {
    if (SINIF || !AC || !mikAkis) return;
    try {
      const m = await import(MPB + '/audio_bundle.mjs'); const fs = await m.FilesetResolver.forAudioTasks(MPB + '/wasm');
      SINIF = await m.AudioClassifier.createFromOptions(fs, { baseOptions: { modelAssetPath: new URL('../araclar/lib/yamnet.tflite', location.href).href }, maxResults: 3, scoreThreshold: .3 });
      halka = new Float32Array(Math.round(AC.sampleRate)); islem = AC.createScriptProcessor(4096, 1, 1); const sus = AC.createGain(); sus.gain.value = 0;
      islem.onaudioprocess = e => { const x = e.inputBuffer.getChannelData(0); for (let i = 0; i < x.length; i++) { halka[halkaPos] = x[i]; halkaPos = (halkaPos + 1) % halka.length; } };
      AC.createMediaStreamSource(mikAkis).connect(islem); islem.connect(sus); sus.connect(AC.destination);
      clearInterval(sinifT); sinifT = setInterval(sinifla, 1000);
    } catch (e) { console.warn(e); balon('Ses tanıma modeli yüklenemedi.', 'sistem'); }
  }
  function sinifla() {
    if (!SINIF || !AYAR.sesTani || konusuyorMu() || S.durum === 'dinliyor' || S.durum === 'dusunuyor') return;
    const n = halka.length, out = new Float32Array(n); for (let i = 0; i < n; i++) out[i] = halka[(halkaPos + i) % n];
    let c = []; try { const r = SINIF.classify(out, AC.sampleRate); c = (r[0] && r[0].classifications[0].categories) || []; } catch (e) { return; }
    const bul = c.find(k => TEPKI[k.categoryName] && k.score > .45); const muzik = c.find(k => /Music/.test(k.categoryName) && k.score > .5);
    $('duyulan').textContent = c.length ? '👂 ' + c.slice(0, 2).map(k => k.categoryName).join(', ') : ''; S.duyulan = c.length ? c[0].categoryName : '';
    if (muzik && !S.dans && S.durum !== 'uyuyor') { S.dans = true; sonVurus = performance.now(); }
    if (!bul) return; const k = bul.categoryName, simdi = Date.now();
    if (sonYorum[k] && simdi - sonYorum[k] < 60000) return; sonYorum[k] = simdi;
    if (S.durum === 'uyuyor') durum('bekliyor');
    sonEtkilesim = performance.now(); if (AYAR.yorum) yorumYap(TEPKI[k][0], TEPKI[k][1]); else duygu(TEPKI[k][1], 3);
  }
  let sonKendiYorum = 0, sonCevap = 0;
  function yorumYap(m, d) { if (AYAR.sessiz || isleniyor || Date.now() - sonKendiYorum < 8000 || Date.now() - sonCevap < 6000 || S.durum !== 'bekliyor' && S.durum !== 'uyuyor') { duygu(d, 2); return; } sonKendiYorum = Date.now(); konus(m, d, { yorum: true }); }

  /* ---------------- konuşma (seslendirme) ---------------- */
  const SS = window.speechSynthesis; let sesler = [], konusmaKuyrugu = [], konusmaSoz = null, zarfT = 0;
  function sesListe() {
    if (!SS) return; sesler = SS.getVoices(); const sel = $('aSes'); const L = sesler.slice().sort((a, b) => (/^tr/i.test(b.lang) - /^tr/i.test(a.lang)) || a.name.localeCompare(b.name));
    sel.innerHTML = L.map(v => `<option value="${esc(v.name)}"${v.name === AYAR.ses ? ' selected' : ''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('');
    if (!AYAR.ses) { const tr = L.find(v => /^tr/i.test(v.lang)); if (tr) sel.value = tr.name; }
    $('sesUyari').hidden = !sesler.length || sesler.some(v => /^tr/i.test(v.lang));
  }
  if (SS) { sesListe(); SS.onvoiceschanged = sesListe; }
  function cumlelere(m) { return (m.match(/[^.!?…]+[.!?…]*["”']?\s*/g) || [m]).map(s => s.trim()).filter(Boolean); }
  function konus(metin, d, o = {}) {
    return new Promise(bitti => {
      if (d) duygu(d, Math.max(3, metin.length / 14));
      balon(metin, 'zeki', o.link, o.kaynak);
      if (!SS || AYAR.sessiz) { durum('konusuyor'); const sure = Math.min(8000, 600 + metin.length * 55); zarfAnim(sure); setTimeout(() => { durum('bekliyor'); bitti(); }, sure); return; }
      SS.cancel(); konusmaKuyrugu = cumlelere(metin.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''));
      durum('konusuyor'); dinlemeyiDuraklat();
      const sonraki = () => {
        if (!konusmaKuyrugu.length) { sonCevap = Date.now(); konusmaSoz = null; S.konusmaZarf = 0; durum('bekliyor'); dinlemeyiSurdur(); aktifSohbetBitis = performance.now() + 20000; bitti(); return; }
        const c = konusmaKuyrugu.shift(), u = new SpeechSynthesisUtterance(c), v = sesler.find(x => x.name === ($('aSes').value || AYAR.ses));
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'tr-TR';
        u.pitch = AYAR.perde; u.rate = AYAR.hiz; konusmaSoz = u;
        u.onboundary = () => { S.konusmaZarf = 1; zarfT = performance.now(); };
        u.onend = sonraki; u.onerror = e => { if (e.error === 'interrupted' || e.error === 'canceled') { S.konusmaZarf = 0; return; } sonraki(); };
        SS.speak(u);
      };
      sonraki();
    });
  }
  /* sesin genliğini okuyamadığımız için ağzı hece ritmine benzer bir zarfla oynatıyoruz */
  setInterval(() => { if (S.durum !== 'konusuyor') return; const t = performance.now() / 1000; const r = .55 + .45 * Math.abs(Math.sin(t * 9.5)) * (.7 + .3 * Math.sin(t * 3.1)); S.konusmaZarf = performance.now() - zarfT < 260 ? 1 : r; }, 40);
  function zarfAnim(ms) { const b = performance.now() + ms; const f = () => { if (performance.now() < b && S.durum === 'konusuyor') requestAnimationFrame(f); }; f(); }
  function sustur() { if (SS) SS.cancel(); konusmaKuyrugu = []; S.konusmaZarf = 0; if (S.durum === 'konusuyor') durum('bekliyor'); dinlemeyiSurdur(); }

  /* ---------------- dinleme ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let tanimaYolu = null, TAN = null, tanAcik = false, tanDurdur = false, tekSefer = false;
  function yolSec() {
    if (AYAR.tanima === 'cihaz' || !SR) return 'cihaz';
    if (AYAR.tanima === 'tarayici') return 'tarayici';
    return LS.get('zeki:srBozuk') ? 'cihaz' : 'tarayici';
  }
  /* --- tarayıcının konuşma tanıması --- */
  function tarayiciBaslat() {
    if (tanAcik) return; tanDurdur = false;
    TAN = new SR(); TAN.lang = 'tr-TR'; TAN.continuous = true; TAN.interimResults = true; TAN.maxAlternatives = 1;
    let parca = '';
    TAN.onresult = e => {
      let ara = '', son = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; (r.isFinal ? (son += r[0].transcript) : (ara += r[0].transcript)); }
      if (ara) { altyazi(ara, true); if (hitapMi(ara) || aktifMi()) { if (S.durum === 'bekliyor' || S.durum === 'uyuyor') durum('dinliyor'); } }
      if (son) { parca = ''; isle(son); }
    };
    TAN.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'network' || e.error === 'audio-capture') {
        if (e.error !== 'not-allowed') LS.set('zeki:srBozuk', '1'); tanDurdur = true; tanimaYolu = 'cihaz';
        balon(e.error === 'not-allowed' ? 'Mikrofon izni verilmedi.' : 'Tarayıcının konuşma tanıması bu ortamda çalışmıyor; cihazda çalışan modele geçiyorum.', 'sistem');
        if (e.error !== 'not-allowed') setTimeout(() => dinlemeBaslat(), 300);
      }
    };
    TAN.onend = () => { tanAcik = false; if (!tanDurdur && !tekSefer && AYAR.surekli && tanimaYolu === 'tarayici') setTimeout(() => { try { if (!tanAcik && !konusuyorMu()) { TAN.start(); tanAcik = true; } } catch (e) { } }, 250); else if (S.durum === 'dinliyor') durum('bekliyor'); };
    try { TAN.start(); tanAcik = true; } catch (e) { }
  }
  /* --- cihazda Whisper: ses etkinliği algılayıp parça parça çevir --- */
  let VAD = { acik: false, kayit: false, parcalar: [], sessizT: 0, konusT: 0, isl: null, kaynak: null, cevriliyor: false };
  async function cihazBaslat() {
    if (VAD.acik) return; if (!(await mikAc())) return;
    VAD.acik = true; VAD.isl = AC.createScriptProcessor(4096, 1, 1); const sus = AC.createGain(); sus.gain.value = 0;
    VAD.kaynak = AC.createMediaStreamSource(mikAkis); VAD.kaynak.connect(VAD.isl); VAD.isl.connect(sus); sus.connect(AC.destination);
    const onTampon = []; /* konuşma başlamadan önceki 0,5 sn */
    VAD.isl.onaudioprocess = e => {
      if (!VAD.acik || konusuyorMu() || VAD.cevriliyor) return;
      const x = new Float32Array(e.inputBuffer.getChannelData(0)), dt = x.length / AC.sampleRate;
      let r = 0; for (let i = 0; i < x.length; i++) r += x[i] * x[i]; const db = 10 * Math.log10(r / x.length + 1e-12), ust = db - SES.taban;
      const konusma = ust > 12;
      if (!VAD.kayit) {
        onTampon.push(x); if (onTampon.length > Math.ceil(.5 / dt)) onTampon.shift();
        if (konusma) { VAD.konusT += dt; if (VAD.konusT > .2 && (AYAR.surekli || tekSefer)) { VAD.kayit = true; VAD.parcalar = onTampon.splice(0); VAD.sessizT = 0; if (S.durum !== 'uyuyor' || aktifMi()) durum('dinliyor'); } } else VAD.konusT = 0;
      } else {
        VAD.parcalar.push(x); VAD.sessizT = konusma ? 0 : VAD.sessizT + dt;
        const sure = VAD.parcalar.length * dt;
        if (VAD.sessizT > .9 || sure > 15) { VAD.kayit = false; VAD.konusT = 0; const p = VAD.parcalar; VAD.parcalar = []; if (sure - VAD.sessizT > .45) cevir(p, AC.sampleRate); else if (S.durum === 'dinliyor') durum('bekliyor'); }
      }
    };
  }
  async function cevir(parcalar, hz) {
    VAD.cevriliyor = true; durum('dusunuyor');
    try {
      const n = parcalar.reduce((a, p) => a + p.length, 0), tum = new Float32Array(n); let o = 0; for (const p of parcalar) { tum.set(p, o); o += p.length; }
      const off = new OfflineAudioContext(1, Math.ceil(n / hz * 16000), 16000), b = off.createBuffer(1, n, hz); b.copyToChannel(tum, 0);
      const s = off.createBufferSource(); s.buffer = b; s.connect(off.destination); s.start(); const r16 = (await off.startRendering()).getChannelData(0);
      const sonuc = await YZ.cagir({ tip: 'asr', model: AYAR.whisper, ses: new Float32Array(r16), dil: 'turkish' }, { ilerleme: (y, t) => { $('whisperIl').hidden = false; $('whisperIl').textContent = `Konuşma tanıma modeli indiriliyor: ${Math.round(y)} / ${Math.round(Math.max(t, y))} MB (bir kez)`; } });
      $('whisperIl').hidden = true;
      const m = (sonuc.text || '').trim();
      VAD.cevriliyor = false;
      if (!m || /^\[.*\]$|^\(.*\)$|altyazı|izlediğiniz için teşekkür|abone ol/i.test(m)) { durum('bekliyor'); return; }
      await isle(m);
    } catch (e) { VAD.cevriliyor = false; durum('bekliyor'); balon('Konuşma tanınamadı: ' + e.message, 'sistem'); }
    if (tekSefer) { tekSefer = false; if (!AYAR.surekli) dinlemeDurdur(); }
  }
  function dinlemeBaslat() {
    tanimaYolu = yolSec(); $('aYol').textContent = tanimaYolu === 'tarayici' ? 'Tarayıcının konuşma tanıması (ses, tarayıcı şirketinin sunucusunda çevrilir)' : 'Cihazda çalışan Whisper (ses cihazından çıkmaz)';
    if (tanimaYolu === 'tarayici') tarayiciBaslat(); else cihazBaslat();
  }
  function dinlemeDurdur() { tanDurdur = true; if (TAN) try { TAN.stop(); } catch (e) { } tanAcik = false; VAD.acik = false; VAD.kayit = false; if (VAD.isl) try { VAD.isl.disconnect(); VAD.kaynak.disconnect(); } catch (e) { } if (S.durum === 'dinliyor') durum('bekliyor'); }
  function dinlemeyiDuraklat() { if (tanimaYolu === 'tarayici' && TAN && tanAcik) { tanDurdur = true; try { TAN.abort(); } catch (e) { } tanAcik = false; } }
  function dinlemeyiSurdur() { if (tanimaYolu === 'tarayici' && (AYAR.surekli || tekSefer) && !tanAcik) { setTimeout(() => { if (!konusuyorMu()) tarayiciBaslat(); }, 350); } }
  const hitapMi = m => /\bzeki\b|\bzekiy|\bzekâ\b|\bzeke\b|\bzekii/i.test(m);
  const aktifMi = () => performance.now() < aktifSohbetBitis || tekSefer;

  /* ---------------- işleme ---------------- */
  let isleniyor = false;
  async function isle(m, yazili) {
    m = m.trim(); if (!m || isleniyor) return;
    /* sürekli dinlemede yalnızca "Zeki" diye seslenilince ya da sohbet sürerken cevap ver */
    if (!yazili && !hitapMi(m) && !aktifMi()) { altyazi(m, true, true); if (S.durum === 'dinliyor') durum('bekliyor'); S.merak = 1; return; }
    isleniyor = true; sonEtkilesim = performance.now(); aktifSohbetBitis = performance.now() + 25000;
    if (S.durum === 'uyuyor') { S.uykulu = 0; }
    S.dans = /dans/.test(m) ? S.dans : false;
    balon(m, 'sen'); durum('dusunuyor'); S.bakX = .2; S.bakY = -.4;
    let akis = '', akisCumle = 0;
    const r = await Beyin.yanitla(m, { bekle, parca: p => { akis += p; } }).catch(e => ({ metin: 'Bir şeyler ters gitti: ' + e.message, duygu: 'uzgun' }));
    bekle = r.bekle || null;
    if (r.eylem) eylem(r.eylem);
    isleniyor = false;
    await konus(r.metin, r.duygu, { link: r.link, kaynak: r.kaynak });
    if (r.gul) { S.kalp = 1; }
    if (r.eylem && r.eylem.tip === 'ac') setTimeout(() => window.open(r.eylem.url, '_blank', 'noopener'), 200);
  }
  function eylem(e) {
    if (e.tip === 'dans') { S.dans = true; sonVurus = performance.now(); S.bpm = 112; setTimeout(() => { if (performance.now() - sonVurus > 5000) S.dans = false; }, 8000); }
    else if (e.tip === 'uyku') setTimeout(() => { durum('uyuyor'); dinlemeyiDuraklat(); }, 2500);
    else if (e.tip === 'uyan') { S.uykulu = 0; }
    else if (e.tip === 'gozkirp') S.gozKirp = 1;
    else if (e.tip === 'sus') sustur();
    else if (e.tip === 'zamanlayici') zamanlayici(e.sn, e.ad);
    else if (e.tip === 'gorunum') { const L = Object.keys(GORUNUM); gorunumSec(e.ad === 'sonraki' ? L[(L.indexOf(AYAR.gorunum) + 1) % L.length] : e.ad); }
  }
  const ZAMAN = [];
  function zamanlayici(sn, ad) {
    const z = { bitis: Date.now() + sn * 1000, ad }; ZAMAN.push(z); zamanCiz();
    z.t = setTimeout(() => { ZAMAN.splice(ZAMAN.indexOf(z), 1); zamanCiz(); if (S.durum === 'uyuyor') durum('bekliyor'); S.zipla = 1; konus(ad ? `Hatırlatma: ${ad}` : 'Süre doldu!', 'heyecanli'); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) { } }, sn * 1000);
  }
  function zamanCiz() { $('zamanlar').innerHTML = ZAMAN.map(z => { const k = Math.max(0, Math.round((z.bitis - Date.now()) / 1000)); return `<span>⏱ ${Math.floor(k / 60)}:${String(k % 60).padStart(2, '0')}${z.ad ? ' · ' + esc(z.ad) : ''}</span>`; }).join(''); }
  setInterval(() => { if (ZAMAN.length) zamanCiz(); }, 1000);

  /* ---------------- arayüz ---------------- */
  function altyazi(m, ara, yoksay) { const el = $('sizin'); el.textContent = m; el.classList.toggle('ara', !!ara); el.classList.toggle('yoksay', !!yoksay); clearTimeout(el._t); el._t = setTimeout(() => el.textContent = '', 6000); }
  const GECMIS = [];
  function balon(m, kim, link, kaynak) {
    if (kim === 'zeki') { $('cevap').innerHTML = esc(m) + (link ? ` <a href="${esc(link)}" target="_blank" rel="noopener">${kaynak ? esc(kaynak) : 'ayrıntı'} ↗</a>` : '') ; $('cevap').classList.remove('sistem'); }
    else if (kim === 'sistem') { $('cevap').textContent = m; $('cevap').classList.add('sistem'); }
    else altyazi(m);
    if (kim !== 'sistem') { GECMIS.push({ kim, m, link }); if (GECMIS.length > 60) GECMIS.shift(); $('gecmisL').innerHTML = GECMIS.map(x => `<div class="g-${x.kim}"><b>${x.kim === 'sen' ? 'Sen' : 'Zeki'}</b> ${esc(x.m)}${x.link ? ` <a href="${esc(x.link)}" target="_blank" rel="noopener">↗</a>` : ''}</div>`).join(''); $('gecmisL').scrollTop = 1e9; }
  }
  /* işaretçiyi takip */
  addEventListener('pointermove', e => { if (!yz) return; const r = $('sahne').getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); S.bakX = clamp((e.clientX - r.left - yz.cx / d) / (r.width * .4), -1, 1); S.bakY = clamp((e.clientY - r.top - yz.cy / d) / (r.height * .4), -1, 1); sonIsaretci = performance.now(); });
  $('sahne').addEventListener('click', () => { if (!uyandi) return uyandir(); sonEtkilesim = performance.now(); if (S.durum === 'uyuyor') { durum('bekliyor'); duygu('mutlu', 2); S.zipla = .6; konus(sec(['Ooo, uyandım! Buyur.', 'Günaydın! Ne yapalım?'])); return; } if (S.durum === 'konusuyor') return sustur(); S.zipla = .5; S.kirp = 1; duygu(sec(['mutlu', 'utangac', 'saskin']), 2); if (Math.random() < .35) yorumYap(sec(['Hihi, gıdıklanıyorum!', 'Efendim?', 'Buradayım!', 'Dokununca ekranım ışıldıyor.']), 'utangac'); });
  /* mikrofon düğmesi: bas-konuş */
  $('mik').onclick = async () => {
    if (!uyandi) return uyandir();
    if (S.durum === 'konusuyor') { sustur(); }
    if (S.durum === 'dinliyor') { dinlemeyiDuraklat(); durum('bekliyor'); return; }
    if (!(await mikAc())) return;
    tekSefer = true; aktifSohbetBitis = performance.now() + 20000; durum('dinliyor'); S.merak = 1;
    if (yolSec() === 'tarayici') { tanimaYolu = 'tarayici'; if (!tanAcik) tarayiciBaslat(); } else { tanimaYolu = 'cihaz'; await cihazBaslat(); }
  };
  $('form').onsubmit = e => { e.preventDefault(); const v = $('yaz').value.trim(); if (!v) return; $('yaz').value = ''; if (!uyandi) uyandir(true); if (S.durum === 'konusuyor') sustur(); isle(v, true); };
  $('ipuclari').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (!uyandi) uyandir(true); if (S.durum === 'konusuyor') sustur(); isle(b.textContent, true); });
  addEventListener('keydown', e => { if (e.code === 'Space' && document.activeElement === document.body) { e.preventDefault(); $('mik').click(); } if (e.key === 'Escape') sustur(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && SS) SS.cancel(); });

  /* ---------------- ayarlar ---------------- */
  function ayarlariKur() {
    $('aTanima').value = AYAR.tanima; $('aWhisper').value = AYAR.whisper; $('aSurekli').checked = AYAR.surekli; $('aSesTani').checked = AYAR.sesTani; $('aYorum').checked = AYAR.yorum; $('aSessiz').checked = AYAR.sessiz;
    $('aPerde').value = AYAR.perde; $('aHiz').value = AYAR.hiz;
    $('aTanima').onchange = () => { AYAR.tanima = $('aTanima').value; if (AYAR.tanima === 'tarayici') LS.set('zeki:srBozuk', ''); ayarKaydet(); dinlemeDurdur(); if (AYAR.surekli) dinlemeBaslat(); };
    $('aWhisper').onchange = () => { AYAR.whisper = $('aWhisper').value; ayarKaydet(); };
    $('aSurekli').onchange = () => { AYAR.surekli = $('aSurekli').checked; ayarKaydet(); AYAR.surekli ? dinlemeBaslat() : dinlemeDurdur(); };
    $('aSesTani').onchange = () => { AYAR.sesTani = $('aSesTani').checked; ayarKaydet(); if (AYAR.sesTani) sinifAc(); else $('duyulan').textContent = ''; };
    $('aYorum').onchange = () => { AYAR.yorum = $('aYorum').checked; ayarKaydet(); };
    $('aSessiz').onchange = () => { AYAR.sessiz = $('aSessiz').checked; ayarKaydet(); if (AYAR.sessiz) sustur(); };
    $('aSes').onchange = () => { AYAR.ses = $('aSes').value; ayarKaydet(); konus('Sesim böyle mi?', 'mutlu'); };
    $('aPerde').oninput = () => { AYAR.perde = +$('aPerde').value; ayarKaydet(); };
    $('aHiz').oninput = () => { AYAR.hiz = +$('aHiz').value; ayarKaydet(); };
    $('aPerde').onchange = $('aHiz').onchange = () => konus('Bu ses nasıl?', 'mutlu');
    $('gorSec').innerHTML = Object.entries(GORUNUM).map(([k, v]) => `<button type="button" data-g="${k}">${v[1]}<span>${v[0]}</span></button>`).join('');
    $('gorSec').onclick = e => { const b = e.target.closest('[data-g]'); if (b) gorunumSec(b.dataset.g); };
    $('gorAc').onclick = () => { const L = Object.keys(GORUNUM); gorunumSec(L[(L.indexOf(AYAR.gorunum) + 1) % L.length]); };
    gorunumSec(AYAR.gorunum, true);
    $('ayarAc').onclick = () => { $('ayarlar').hidden = !$('ayarlar').hidden; $('gecmis').hidden = true; };
    $('gecmisAc').onclick = () => { $('gecmis').hidden = !$('gecmis').hidden; $('ayarlar').hidden = true; };
    document.querySelectorAll('.panel .kapat').forEach(b => b.onclick = () => b.closest('.panel').hidden = true);
    $('beyinBtn').onclick = beyinAc; $('beyinZorla').onclick = e => { e.preventDefault(); beyinZorla = true; COKTU = false; LS.set('zeki:beyinCoktu', ''); beyinDurum(); beyinAc(); }; beyinDurum();
    $('unut').onclick = () => { if (!confirm('Zeki adını, şehrini ve notlarını unutsun mu?')) return; Beyin.HAFIZA.ad = ''; Beyin.HAFIZA.sehir = ''; Beyin.HAFIZA.notlar = []; Beyin.kaydet(); konus('Tamam, her şeyi unuttum. Yeniden tanışalım mı?', 'uzgun'); };
  }
  const LLM_MODEL = 'onnx-community/gemma-3-1b-it-ONNX-GQA';
  let beyinZorla = false;
  /* telefonlarda tarayıcı sekmeye ~1 GB'lık model için yeterli bellek vermez; sekme kapanıp yeniden açılır */
  const MOBIL = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const AZ_BELLEK = navigator.deviceMemory && navigator.deviceMemory < 8;
  let COKTU = false;
  try { const d = +LS.get('zeki:beyinDeneme'); if (d && Date.now() - d < 15 * 60000) { COKTU = true; LS.set('zeki:beyinCoktu', '1'); AYAR.beyin = false; ayarKaydet(); } LS.set('zeki:beyinDeneme', ''); } catch (e) { }
  if (LS.get('zeki:beyinCoktu')) COKTU = true;
  function beyinDurum() {
    const d = Beyin.LLM.durum; $('beyinBtn').disabled = d === 'yukleniyor';
    if ((MOBIL || COKTU) && d !== 'hazir') {
      $('beyinBtn').textContent = MOBIL ? 'Gelişmiş beyin bu cihazda çalışmaz' : 'Gelişmiş beyin bu cihazda yüklenemedi';
      $('beyinBtn').disabled = true; $('beyinZorla').hidden = MOBIL;
      $('beyinBilgi').textContent = MOBIL ? 'Telefon ve tabletlerde tarayıcı, bir sekmeye bu boyutta (≈ 800 MB) bir model için yeterli bellek vermiyor; yükleme sonunda sekme kapanıp sayfa yeniden açılıyor. Gelişmiş beyni bilgisayarda Chrome ya da Edge ile kullanabilirsin. Telefonda Zeki temel becerileriyle (hesap, hava, döviz, terimler, Vikipedi, zamanlayıcı) çalışmaya devam eder.' : 'Son denemede model yüklenirken sayfa kapandı; bu cihazın belleği yetmiyor olabilir. Diğer uygulamaları kapatıp yeniden deneyebilirsin.';
      $('beyinPil').hidden = true; return;
    }
    $('beyinZorla').hidden = true;
    $('beyinBtn').textContent = d === 'hazir' ? 'Gelişmiş beyni kapat' : d === 'yukleniyor' ? 'Yükleniyor…' : 'Gelişmiş beyni aç (≈ 800 MB, bir kez)';
    $('beyinPil').hidden = d !== 'hazir';
  }
  async function beyinAc() {
    if (Beyin.LLM.durum === 'hazir') { Beyin.llmKapat(); AYAR.beyin = false; ayarKaydet(); beyinDurum(); konus('Gelişmiş beynimi kapattım; basit becerilerimle devam ediyorum.', 'notr'); return; }
    let gpu = false; try { gpu = !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (e) { }
    if (!gpu) { $('beyinBilgi').textContent = 'Bu tarayıcıda WebGPU yok; gelişmiş beyin için güncel Chrome ya da Edge gerekiyor.'; return; }
    if (MOBIL || COKTU && !beyinZorla) return beyinDurum();
    if (AZ_BELLEK && !confirm('Bu cihazın belleği az görünüyor; model yüklenirken sayfa kapanabilir. Yine de denensin mi?')) return;
    LS.set('zeki:beyinDeneme', String(Date.now()));
    beyinDurum(); $('beyinBilgi').textContent = 'Hazırlanıyor…'; durum('dusunuyor');
    try {
      const promise = Beyin.llmYukle(LLM_MODEL, p => { const y = p.yuklenen / 1048576, t = Math.max(p.toplam, p.yuklenen) / 1048576; $('beyinBilgi').textContent = `İndiriliyor: ${Math.round(y)} / ${Math.round(t)} MB`; $('beyinBar').style.width = (t ? y / t * 100 : 2) + '%'; });
      beyinDurum(); await promise;
      LS.set('zeki:beyinDeneme', ''); LS.set('zeki:beyinCoktu', ''); COKTU = false;
      AYAR.beyin = true; ayarKaydet(); $('beyinBilgi').textContent = 'Gelişmiş beyin hazır: Gemma 3 1B, ekran kartında çalışıyor.'; $('beyinBar').style.width = '100%';
      durum('bekliyor'); konus('Gelişmiş beynim açıldı! Artık aklına gelen her şeyi konuşabiliriz. Ama küçük bir modelim; önemli bilgileri yine de kontrol et.', 'heyecanli');
    } catch (e) { LS.set('zeki:beyinDeneme', ''); $('beyinBilgi').textContent = 'Yüklenemedi: ' + (e.message === 'WEBGPU_YOK' ? 'WebGPU bulunamadı.' : e.message); durum('bekliyor'); }
    beyinDurum();
  }

  /* ---------------- uyandırma ---------------- */
  async function uyandir(yazili) {
    if (uyandi) return; uyandi = true; $('kapak').classList.add('gizli'); setTimeout(() => $('kapak').hidden = true, 600);
    if (SS) { try { SS.speak(new SpeechSynthesisUtterance('')); } catch (e) { } }
    durum('bekliyor'); S.zipla = 1; S.kirp = 1; duygu('heyecanli', 3); sonEtkilesim = performance.now();
    const mik = yazili ? false : await mikAc();
    if (mik && AYAR.surekli) dinlemeBaslat();
    if (mik && AYAR.sesTani) sinifAc();
    const ad = Beyin.HAFIZA.ad, h = new Date().getHours(), z = h < 11 ? 'Günaydın' : h < 18 ? 'Merhaba' : 'İyi akşamlar';
    await konus(ad ? `${z} ${ad}! Seni tekrar görmek ne güzel. Bugün ne yapalım?` : `${z}! Ben Yapay Zeki. Benimle konuşabilir ya da yazabilirsin. ${mik ? (AYAR.surekli ? 'Seslenirken başına "Zeki" demen yeter.' : 'Konuşmak için mikrofona dokun.') : ''} Bu arada, senin adın ne?`, 'mutlu');
    if (!ad) { bekle = 'ad'; aktifSohbetBitis = performance.now() + 30000; }
    if (COKTU && !MOBIL) balon('Gelişmiş beyin son denemede yüklenirken sayfa kapandı; bu cihazın belleği yetmiyor olabilir. Ayarlar\'dan yeniden deneyebilirsin.', 'sistem');
    if (AYAR.beyin && !MOBIL && !COKTU && Beyin.LLM.durum === 'yok') { try { if (navigator.gpu && await navigator.gpu.requestAdapter()) beyinAc(); } catch (e) { } }
  }
  /* "adın ne" sorusuna tek kelimelik cevap */
  const asilYanitla = Beyin.yanitla;
  Beyin.yanitla = async (m, ops) => {
    if (ops && ops.bekle === 'ad') { const t = m.trim().replace(/[.!]+$/, '').replace(/^(?:benim adım|adım|ben)\s+/i, '').replace(/\s*(?:ben|benim)$/i, ''); if (/^[a-zçğıöşüâîA-ZÇĞİÖŞÜ]{2,20}$/.test(t)) { Beyin.HAFIZA.ad = t.charAt(0).toLocaleUpperCase('tr') + t.slice(1).toLocaleLowerCase('tr'); Beyin.kaydet(); return { metin: `Memnun oldum ${Beyin.HAFIZA.ad}! Ne yapabileceğimi merak ediyorsan "neler yapabilirsin" diye sor.`, duygu: 'heyecanli' }; } }
    return asilYanitla(m, ops);
  };
  $('kapak').onclick = () => uyandir();
  $('kapakYaz').onclick = e => { e.stopPropagation(); uyandir(true); $('yaz').focus(); };
  ayarlariKur(); durum('uyuyor');
  requestAnimationFrame(dongu);
  window.Zeki = { S, SES, isle, konus, AYAR };
})();
