/* Yapay Zeki · kamera ile görme (MediaPipe, cihazda çalışır; görüntü hiçbir yere gönderilmez)
   - yüzün yerine bakar, gelince selam verir, gidince "nereye gittin?" der
   - gülümseyince mutlu olur, şaşırınca şaşırır
   - el sallama, başparmak, zafer işareti gibi hareketlere karşılık verir
   - "yüzümü tara": yüz hatlarını kaydedip nokta bulutu görünümünde kullanır */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const V_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3';
  const M_YUZ = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const M_EL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const sec = a => a[Math.floor(Math.random() * a.length)];
  let V = null, YUZ = null, EL = null, video = null, akis = null, calis = false, kare = 0, sonT = 0;
  const D = { var: false, ilkGoru: 0, sonGoru: 0, yokSoruldu: false, selamT: 0, gulumse: 0, gulumseT: 0, saskinT: 0, hareketT: {}, elX: [], son: null, tarama: null };
  const Z = () => window.Zeki;

  async function yukle(durum) {
    if (YUZ) return;
    durum && durum('Görme modeli indiriliyor (≈ 12 MB, bir kez)…');
    V = await import(V_URL + '/vision_bundle.mjs');
    const fs = await V.FilesetResolver.forVisionTasks(V_URL + '/wasm');
    const ops = d => ({ baseOptions: { modelAssetPath: d, delegate: 'GPU' }, runningMode: 'VIDEO' });
    try { YUZ = await V.FaceLandmarker.createFromOptions(fs, Object.assign(ops(M_YUZ), { outputFaceBlendshapes: true, numFaces: 1 })); }
    catch (e) { YUZ = await V.FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: M_YUZ, delegate: 'CPU' }, runningMode: 'VIDEO', outputFaceBlendshapes: true, numFaces: 1 }); }
    try { EL = await V.GestureRecognizer.createFromOptions(fs, Object.assign(ops(M_EL), { numHands: 1 })); }
    catch (e) { EL = await V.GestureRecognizer.createFromOptions(fs, { baseOptions: { modelAssetPath: M_EL, delegate: 'CPU' }, runningMode: 'VIDEO', numHands: 1 }); }
  }
  async function ac(durum) {
    if (calis) return true;
    try {
      akis = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
    } catch (e) { durum && durum('Kamera izni verilmedi.'); return false; }
    video = $('kamVideo'); video.srcObject = akis; video.muted = true; video.playsInline = true; await video.play().catch(() => { });
    try { await yukle(durum); } catch (e) { durum && durum('Görme modeli yüklenemedi: ' + e.message); kapat(); return false; }
    calis = true; $('kamKutu').hidden = !(Z() && Z().AYAR.kamOnizle); durum && durum('Kamera açık · yüz ve el hareketleri cihazında işleniyor.');
    dongu(); return true;
  }
  function kapat() {
    calis = false; if (akis) akis.getTracks().forEach(t => t.stop()); akis = null; if (video) video.srcObject = null;
    $('kamKutu').hidden = true; D.var = false; window.ZEKI_YUZ_T = 0;
  }
  function dongu() {
    if (!calis) return;
    const now = performance.now();
    if (video.readyState >= 2 && now - sonT > 66) {
      sonT = now; kare++;
      try { const r = YUZ.detectForVideo(video, now); yuzIsle(r, now); } catch (e) { }
      if (kare % 3 === 0 && EL) { try { const g = EL.recognizeForVideo(video, now); elIsle(g, now); } catch (e) { } }
    }
    (video.requestVideoFrameCallback ? video.requestVideoFrameCallback(dongu) : requestAnimationFrame(dongu));
  }
  const bs = (r, ad) => { const c = r.faceBlendshapes && r.faceBlendshapes[0] && r.faceBlendshapes[0].categories.find(x => x.categoryName === ad); return c ? c.score : 0; };
  function yuzIsle(r, now) {
    const z = Z(); if (!z) return; const L = r.faceLandmarks && r.faceLandmarks[0];
    if (L) {
      D.son = L;
      if (D.tarama) D.tarama.push(L.map(p => [p.x, p.y, p.z]));
      if (!D.var) { D.var = true; D.ilkGoru = now; const yok = now - D.sonGoru;
        if (z.uyandi() && D.sonGoru && yok > 25000 && now - D.selamT > 60000) { D.selamT = now; z.sonEtkilesimYenile(); if (z.S.durum === 'uyuyor') z.durum('bekliyor'); const ad = window.Beyin && Beyin.HAFIZA.ad; z.konus(sec([`Hoş geldin${ad ? ' ' + ad : ''}! Seni özledim.`, `Aa, geri geldin${ad ? ' ' + ad : ''}!`, 'Seni görmek güzel!']), 'mutlu'); }
        else if (z.uyandi() && !D.sonGoru && now - D.selamT > 60000) { D.selamT = now; if (z.S.durum === 'uyuyor') z.durum('bekliyor'); z.duygu('mutlu', 2); z.S.zipla = .6; }
        D.yokSoruldu = false; }
      D.sonGoru = now; window.ZEKI_YUZ_T = now; z.sonEtkilesimYenile();
      /* bakış: burun ucunun ekrandaki yeri (ön kamera ayna görüntüsüdür) */
      const n = L[1]; z.S.bakX = Math.max(-1, Math.min(1, -(n.x - .5) * 2.6)); z.S.bakY = Math.max(-1, Math.min(1, (n.y - .45) * 2.4));
      /* gülümseme ve şaşkınlık */
      const g = (bs(r, 'mouthSmileLeft') + bs(r, 'mouthSmileRight')) / 2, s = bs(r, 'jawOpen') * .5 + bs(r, 'browInnerUp') * .5;
      D.gulumse = g > .55 ? D.gulumse + 1 : 0;
      if (D.gulumse === 8) { z.duygu('mutlu', 4); z.S.kalp = 1; if (now - D.gulumseT > 90000 && z.S.durum === 'bekliyor' && Math.random() < .5) { D.gulumseT = now; z.konus(sec(['Gülümsemen çok güzel!', 'Seni gülümserken görmek beni de mutlu ediyor.', 'Hihi, sen gülünce ben de gülüyorum.']), 'utangac'); } }
      if (s > .55 && now - D.saskinT > 4000) { D.saskinT = now; z.duygu('saskin', 2); }
      if (z.S.durum === 'uyuyor' && z.AYAR.kamUyandir && now - D.ilkGoru > 1500 && now - (D.uyandirT || 0) > 30000) { D.uyandirT = now; z.durum('bekliyor'); z.duygu('mutlu', 2); z.S.zipla = .8; }
    } else if (D.var && now - D.sonGoru > 800) {
      D.var = false; window.ZEKI_YUZ_T = 0;
    } else if (!D.var && D.sonGoru && !D.yokSoruldu && now - D.sonGoru > 12000 && z.uyandi() && z.S.durum === 'bekliyor') {
      D.yokSoruldu = true; if (z.AYAR.yorum && Math.random() < .7) z.konus(sec(['Nereye gittin?', 'Hey, neredesin? Burada bekliyorum.', 'Gittin mi? Ben buradayım.']), 'uzgun'); else z.duygu('uzgun', 3);
    }
  }
  const HAREKET = {
    Thumb_Up: ['Anlaştık!', 'mutlu'], Thumb_Down: ['Peki, beğenmedin. Daha iyisini deneyeceğim.', 'uzgun'], Victory: ['Zafer bizim!', 'heyecanli'],
    ILoveYou: ['Ben de seni seviyorum!', 'utangac'], Pointing_Up: ['Bir fikrin mi var? Dinliyorum.', 'dusunceli'], Closed_Fist: ['Yumruk mu? Hadi tokuşalım!', 'heyecanli'],
  };
  function elIsle(g, now) {
    const z = Z(); if (!z || !g.gestures || !g.gestures.length) { D.elX = []; return; }
    const ad = g.gestures[0][0].categoryName, skor = g.gestures[0][0].score, el = g.landmarks && g.landmarks[0];
    if (ad === 'Open_Palm' && el) {
      /* el sallama: avuç açık ve bilek sağa sola gidip geliyor */
      D.elX.push(el[0].x); if (D.elX.length > 14) D.elX.shift();
      let yon = 0, don = 0; for (let i = 2; i < D.elX.length; i++) { const d = Math.sign(D.elX[i] - D.elX[i - 1]); if (Math.abs(D.elX[i] - D.elX[i - 1]) > .006 && d && d !== yon) { if (yon) don++; yon = d; } }
      if (don >= 3 && now - (D.hareketT.salla || 0) > 6000) { D.hareketT.salla = now; D.elX = []; z.sonEtkilesimYenile(); if (z.S.durum === 'uyuyor') z.durum('bekliyor'); z.S.zipla = .7; const ad2 = window.Beyin && Beyin.HAFIZA.ad; z.konus(sec([`Merhaba${ad2 ? ' ' + ad2 : ''}! 👋`, 'Ben de sana el sallıyorum!', 'Selam selam!']), 'mutlu'); }
      return;
    }
    D.elX = [];
    if (HAREKET[ad] && skor > .6 && now - (D.hareketT[ad] || 0) > 8000 && now - (D.hareketT.son || 0) > 3000) {
      D.hareketT[ad] = now; D.hareketT.son = now; z.sonEtkilesimYenile(); if (z.S.durum === 'uyuyor') z.durum('bekliyor');
      if (ad === 'ILoveYou') z.S.kalp = 1; if (z.S.durum !== 'konusuyor') z.konus(HAREKET[ad][0], HAREKET[ad][1]); else z.duygu(HAREKET[ad][1], 2);
    }
  }

  /* ---------- yüz tarama: ~1,5 sn boyunca yüz hatlarını toplayıp ortalar ---------- */
  async function yuzTara(durum) {
    if (!(await ac(durum))) return null;
    durum && durum('Kameraya düz bak, başını sabit tut…'); D.tarama = [];
    await new Promise(r => setTimeout(r, 1800));
    const T = D.tarama; D.tarama = null;
    if (!T || T.length < 5) { durum && durum('Yüz bulunamadı; ışığı artırıp yeniden dene.'); return null; }
    const n = T[0].length, ort = Array.from({ length: n }, (_, i) => [0, 1, 2].map(k => T.reduce((a, f) => a + f[i][k], 0) / T.length));
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    const veri = { w: vw, h: vh, p: ort.map(p => p.map(v => +v.toFixed(4))) };
    LS.set('zeki:yuzum', JSON.stringify(veri)); window.ZEKI_YUZUM = veri;
    durum && durum('Yüzün kaydedildi! "Benim yüzüm" görünümü açıldı.'); return veri;
  }
  async function fotodanTara(dosya, durum) {
    durum && durum('Fotoğraf inceleniyor…');
    const img = await createImageBitmap(dosya);
    const fs = (V = V || await import(V_URL + '/vision_bundle.mjs'), await V.FilesetResolver.forVisionTasks(V_URL + '/wasm'));
    const F = await V.FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: M_YUZ }, runningMode: 'IMAGE', numFaces: 1 });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
    const r = F.detect(c); F.close();
    const L = r.faceLandmarks && r.faceLandmarks[0]; if (!L) { durum && durum('Fotoğrafta yüz bulunamadı.'); return null; }
    const veri = { w: img.width, h: img.height, p: L.map(p => [+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4)]) };
    LS.set('zeki:yuzum', JSON.stringify(veri)); window.ZEKI_YUZUM = veri; durum && durum('Yüz kaydedildi! "Benim yüzüm" görünümü açıldı.'); return veri;
  }
  try { const v = JSON.parse(LS.get('zeki:yuzum') || 'null'); if (v && v.p && v.p.length > 400) window.ZEKI_YUZUM = v; } catch (e) { }
  window.ZekiKamera = { ac, kapat, yuzTara, fotodanTara, acikMi: () => calis, tesselasyon: () => V && V.FaceLandmarker.FACE_LANDMARKS_TESSELATION, V: () => V };
})();
