'use strict';
/* =========================================================
   Proje Hattı — Küre (3B) görünümü
   Merkez = proje. Her aşama merkezden çıkıp saydam kürenin
   yüzeyine değen bir hat. Adımlar hat üzerinde boncuk gibi,
   parsiyeller adımın etrafında uydu. Bağımlılıklar kavisli
   tüpler; yalnızca gerektiğinde görünür.
   Veri app.js'ten gelir (C, P, ui, sec, netler, gorunur…).
   three.js (r147) yalnızca bu görünüm açılınca lib/ klasöründen yüklenir.
   ========================================================= */
(function () {
  const R = 100;              // dış küre yarıçapı
  const LIB = ['lib/three.min.js', 'lib/OrbitControls.js', 'lib/CSS2DRenderer.js'];

  let kap = null, renderer = null, etkR = null, sahne = null, kamera = null, kontrol = null;
  let grup = null, isin = null, rafId = 0;
  let secilebilir = [];       // ışınla seçilebilen düğüm ağları
  let etiketler = [];         // { el, obj, tur, id, poz }
  let nabizlar = [];          // bloke düğümler (nabız animasyonu)
  let halo = null;
  let fare = null, fareOynadi = false, basla = null, uzerinde = null;
  let sonEtkilesim = 0, ucus = null, ilkKurulum = true;

  /* ---------- kütüphaneyi tembel yükle ---------- */
  let yukleniyor = null;
  const yukle = src => new Promise((ok, hata) => {
    const s = document.createElement('script'); s.src = src + '?v=147';
    s.onload = ok; s.onerror = () => hata(new Error(src)); document.head.appendChild(s);
  });
  const hazir = () => window.THREE && THREE.OrbitControls && THREE.CSS2DRenderer;
  function kutuphane() {
    if (hazir()) return Promise.resolve();
    // sıra önemli: önce çekirdek, sonra eklentiler
    return yukleniyor || (yukleniyor = yukle(LIB[0]).then(() => Promise.all([yukle(LIB[1]), yukle(LIB[2])])));
  }

  /* ---------- yardımcılar ---------- */
  const cssRenk = (ad, yedek = '#888') => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(ad).trim();
    return new THREE.Color(v || yedek);
  };
  const durumRengi = s => cssRenk('--s-' + s);
  const koyuMu = () => document.documentElement.dataset.theme === 'dark';
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ışına dik iki birim vektör (parsiyel uyduları ve aynı hattaki bağlar için)
  function dikler(yon) {
    const a = Math.abs(yon.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(yon, a).normalize();
    const w = new THREE.Vector3().crossVectors(yon, u).normalize();
    return [u, w];
  }

  /* ---------- kurulum ---------- */
  function kur(c) {
    kap = c; kap.innerHTML = '';
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    kap.appendChild(renderer.domElement);

    etkR = new THREE.CSS2DRenderer();
    etkR.domElement.className = 'kure-etiketler';
    kap.appendChild(etkR.domElement);

    const ipucu = document.createElement('div');
    ipucu.className = 'kure-ipucu';
    ipucu.textContent = 'Sürükle: döndür · Tekerlek: yakınlaş · Sağ tık sürükle: kaydır · Çift tık: işe uç';
    kap.appendChild(ipucu);

    sahne = new THREE.Scene();
    kamera = new THREE.PerspectiveCamera(45, 1, 1, 4000);
    kamera.position.set(0, 70, 310);

    kontrol = new THREE.OrbitControls(kamera, renderer.domElement);
    kontrol.enableDamping = true; kontrol.dampingFactor = 0.08;
    kontrol.minDistance = 15; kontrol.maxDistance = 900;
    kontrol.rotateSpeed = 0.6; kontrol.zoomSpeed = 0.9;
    kontrol.autoRotateSpeed = 0.35;
    kontrol.addEventListener('start', () => { sonEtkilesim = performance.now(); ucus = null; });

    sahne.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 0.95));
    const isik = new THREE.DirectionalLight(0xffffff, 0.55); isik.position.set(120, 220, 160); sahne.add(isik);

    isin = new THREE.Raycaster();
    olaylar(renderer.domElement);
    boyutla();
    new ResizeObserver(boyutla).observe(kap);
    ilkKurulum = true;
    dongu();
  }

  function boyutla() {
    if (!kap || !renderer) return;
    const w = Math.max(50, kap.clientWidth), h = Math.max(50, kap.clientHeight);
    renderer.setSize(w, h); etkR.setSize(w, h);
    kamera.aspect = w / h; kamera.updateProjectionMatrix();
  }

  function birak() {
    cancelAnimationFrame(rafId); rafId = 0;
    if (grup) temizle();
    if (kontrol) kontrol.dispose();
    if (renderer) { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); }
    renderer = etkR = sahne = kamera = kontrol = kap = null;
  }

  function temizle() {
    grup.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      if (o.isCSS2DObject && o.element && o.element.parentNode) o.element.parentNode.removeChild(o.element);
    });
    sahne.remove(grup); grup = null;
    secilebilir = []; etiketler = []; nabizlar = []; halo = null;
  }

  /* ---------- sahneyi veriden kur ---------- */
  function insa() {
    if (grup) temizle();
    grup = new THREE.Group(); sahne.add(grup);
    const p = P();
    if (typeof netlerHesapla === 'function') netlerHesapla();
    const soluk = n => (netler && !netler.has(n.id)) || !gorunur(n);
    const pozlar = new Map(), yonler = new Map();
    const koyu = koyuMu();
    const vurgu = cssRenk('--accent');

    // dış küre: çok hafif bir zar + enlem/boylam çizgileri
    const zar = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48),
      new THREE.MeshBasicMaterial({ color: koyu ? 0x9fb7c9 : 0x6f8a9a, transparent: true, opacity: koyu ? 0.035 : 0.045, depthWrite: false, side: THREE.DoubleSide }));
    grup.add(zar);
    const tel = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(R, 24, 16)),
      new THREE.LineBasicMaterial({ color: koyu ? 0x8aa0b0 : 0x7a8f9c, transparent: true, opacity: koyu ? 0.07 : 0.09, depthWrite: false }));
    grup.add(tel);

    // merkez: proje
    const merkez = kure(3.6, vurgu, 0.85, 0.35);
    grup.add(merkez);
    etiket(merkez, `<b>${esc(p.name)}</b>`, 'merkez', null, V(0, 0, 0));

    const asamalar = C.kids(null), n = asamalar.length;
    asamalar.forEach((a, i) => {
      // sarmal dizilim: aşama sırası yukarıdan aşağıya, altın açıyla dönerek
      const y = n > 1 ? 0.78 - 1.56 * i / (n - 1) : 0;
      const rr = Math.sqrt(1 - y * y), th = i * 2.399963;
      const yon = V(Math.cos(th) * rr, y, Math.sin(th) * rr).normalize();
      const uc = yon.clone().multiplyScalar(R);
      pozlar.set(a.id, uc); yonler.set(a.id, yon);
      const e = C.eff.get(a.id), renk = durumRengi(e), sol = soluk(a);

      // hat: merkezden yüzeye saydam tüp
      const hat = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(yon.clone().multiplyScalar(4), uc), 1, 0.55, 10, false),
        new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: sol ? 0.05 : (koyu ? 0.25 : 0.32), depthWrite: false }));
      grup.add(hat);
      // yüzeye değdiği yerde halka
      const halka = new THREE.Mesh(new THREE.RingGeometry(4.2, 5.4, 48),
        new THREE.MeshBasicMaterial({ color: renk, transparent: true, opacity: sol ? 0.06 : 0.4, side: THREE.DoubleSide, depthWrite: false }));
      halka.position.copy(uc); halka.lookAt(0, 0, 0); grup.add(halka);

      const as = kure(3.2, renk, sol ? 0.12 : 0.9, 0.3);
      as.position.copy(uc); as.userData.id = a.id; grup.add(as); secilebilir.push(as);
      if (e === 'bloke' && !sol) nabizlar.push(as);
      const { y: yap, say } = dagilim(a.id);
      etiket(as, `<b>${esc(a.title)}</b><small>${say.tamam || 0}/${yap.length} tamam</small>`, 'asama', a.id, uc, sol);

      // adımlar: hat üzerinde merkezden dışa doğru sırayla
      const adimlar = C.kids(a.id), m = adimlar.length;
      const [u, w] = dikler(yon);
      adimlar.forEach((s, j) => {
        const r = R * (0.24 + 0.64 * (j + 0.5) / Math.max(m, 1));
        const poz = yon.clone().multiplyScalar(r);
        pozlar.set(s.id, poz); yonler.set(s.id, yon);
        dugum(s, poz, 1.7, 'adim', soluk(s));

        // parsiyeller (ve daha alt işler): adımın çevresinde uydu halkası
        const altlar = C.kids(s.id), k = altlar.length;
        if (k) {
          const yr = 4.2 + Math.min(k, 8) * 0.35;
          const yorunge = new THREE.Mesh(new THREE.TorusGeometry(yr, 0.05, 6, 64),
            new THREE.MeshBasicMaterial({ color: durumRengi(C.eff.get(s.id)), transparent: true, opacity: soluk(s) ? 0.04 : 0.25, depthWrite: false }));
          yorunge.position.copy(poz); yorunge.lookAt(poz.clone().add(yon)); grup.add(yorunge);
          altlar.forEach((x, q) => {
            const aci = (q / k) * Math.PI * 2;
            const xp = poz.clone().add(u.clone().multiplyScalar(Math.cos(aci) * yr)).add(w.clone().multiplyScalar(Math.sin(aci) * yr));
            pozlar.set(x.id, xp); yonler.set(x.id, yon);
            dugum(x, xp, 0.85, 'alt', soluk(x));
            // daha derin işler varsa üst düğümün konumunu paylaşsınlar (bağlar için)
            const gez = id => C.kids(id).forEach(z => { pozlar.set(z.id, xp); yonler.set(z.id, yon); gez(z.id); });
            gez(x.id);
          });
        }
      });
    });

    // bağımlılıklar
    const kenar = new Map();
    p.nodes.forEach(x => (x.deps || []).forEach(d => {
      if (!pozlar.has(d) || !pozlar.has(x.id)) return;
      const ed = C.eff.get(d), ex = C.eff.get(x.id);
      const sorunlu = (ed === 'bloke' || ed === 'dolayli') && ex !== 'tamam';
      const secili = ui.sel && (x.id === ui.sel || d === ui.sel);
      if (!secili && (ui.bag === 'yok' || (ui.bag === 'sorunlu' && !sorunlu))) return;
      if (!secili && (soluk(C.map.get(x.id)) || soluk(C.map.get(d)))) return;
      const tur = secili ? 'sec' : ed === 'bloke' && sorunlu ? 'bloke' : sorunlu ? 'dolayli' : 'normal';
      kenar.set(d + '>' + x.id, { a: pozlar.get(d), b: pozlar.get(x.id), ya: yonler.get(d), yb: yonler.get(x.id), tur });
    }));
    const kenarRenk = { sec: vurgu, bloke: cssRenk('--s-bloke'), dolayli: cssRenk('--s-dolayli'), normal: cssRenk('--link-normal') };
    kenar.forEach(({ a, b, ya, yb, tur }) => {
      if (a.distanceTo(b) < 0.5) return;
      const orta = a.clone().add(b).multiplyScalar(0.5);
      let kontrolN;
      if (ya.dot(yb) > 0.98) {
        // aynı hat üzerinde: yana doğru kavis
        kontrolN = orta.clone().add(dikler(ya)[0].multiplyScalar(10 + a.distanceTo(b) * 0.25));
      } else {
        // farklı hatlar: merkeze doğru içe çekilen yay (kürenin içinden geçer)
        kontrolN = orta.clone().multiplyScalar(0.55);
      }
      const egri = new THREE.QuadraticBezierCurve3(a, kontrolN, b);
      // turuncu (dolaylı) bağlar çok olabildiği için daha ince ve soluk; kırmızı ve seçili olanlar öne çıksın
      const kalin = tur === 'normal' ? 0.16 : tur === 'dolayli' ? 0.2 : 0.34;
      const op = tur === 'normal' ? 0.35 : tur === 'sec' ? 0.9 : tur === 'dolayli' ? 0.38 : 0.7;
      const tup = new THREE.Mesh(new THREE.TubeGeometry(egri, 40, kalin, 6, false),
        new THREE.MeshBasicMaterial({ color: kenarRenk[tur], transparent: true, opacity: op, depthWrite: false }));
      grup.add(tup);
      // yön oku: hedefe yakın küçük koni
      const t = 0.9, uc = egri.getPoint(t), tan = egri.getTangent(t).normalize();
      const ok = new THREE.Mesh(new THREE.ConeGeometry(kalin * 3.2, kalin * 9, 10),
        new THREE.MeshBasicMaterial({ color: kenarRenk[tur], transparent: true, opacity: Math.min(1, op + 0.15), depthWrite: false }));
      ok.position.copy(uc); ok.quaternion.setFromUnitVectors(V(0, 1, 0), tan); grup.add(ok);
    });

    // seçili iş: çevresinde dönen hale
    if (ui.sel && pozlar.has(ui.sel)) {
      const nn = C.map.get(ui.sel);
      const r = !nn.parentId ? 6.5 : C.map.get(nn.parentId).parentId ? 2.4 : 4;
      halo = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1),
        new THREE.MeshBasicMaterial({ color: vurgu, wireframe: true, transparent: true, opacity: 0.55, depthWrite: false }));
      halo.position.copy(pozlar.get(ui.sel)); grup.add(halo);
    }

    // ilk açılışta kamerayı yerleştir
    if (ilkKurulum) { kontrol.target.set(0, 0, 0); kamera.position.set(0, 70, 310); ilkKurulum = false; }
    K.pozlar = pozlar;
  }

  function kure(r, renk, opaklik, isil) {
    return new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20),
      new THREE.MeshPhongMaterial({
        color: renk, emissive: renk.clone().multiplyScalar(isil), shininess: 70, specular: 0x333333,
        transparent: true, opacity: opaklik, depthWrite: opaklik > 0.6
      }));
  }

  function dugum(n, poz, r, tur, sol) {
    const e = C.eff.get(n.id), renk = durumRengi(e);
    const m = kure(r, renk, sol ? 0.1 : (e === 'baslamadi' ? 0.55 : 0.85), 0.28);
    m.position.copy(poz); m.userData.id = n.id; grup.add(m); secilebilir.push(m);
    if (e === 'bloke' && !sol) nabizlar.push(m);
    const ad = tur === 'alt' && n.parsiyel ? n.parsiyel : n.title;
    etiket(m, `${escK(ad)}${tur === 'adim' ? `<small>${ETKIN[e]}</small>` : ''}`, tur, n.id, poz, sol);
  }

  function etiket(obj, html, tur, id, poz, sol) {
    const el = document.createElement('div');
    el.className = 'k-et k-' + tur + (sol ? ' soluk' : '');
    el.innerHTML = `<span>${html}</span>`;
    const o = new THREE.CSS2DObject(el);
    o.position.set(0, 0, 0); obj.add(o);
    etiketler.push({ el, obj: o, tur, id, poz: poz.clone(), sol });
  }

  /* ---------- etkileşim ---------- */
  function olaylar(cv) {
    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      fare = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
      fareOynadi = true;
      if (basla && Math.hypot(e.clientX - basla.x, e.clientY - basla.y) > 5) basla.oynadi = true;
    });
    cv.addEventListener('pointerleave', () => { fare = null; fareOynadi = true; });
    cv.addEventListener('pointerdown', e => { basla = { x: e.clientX, y: e.clientY, oynadi: false, tus: e.button }; sonEtkilesim = performance.now(); });
    cv.addEventListener('pointerup', e => {
      if (!basla || basla.oynadi || basla.tus !== 0) { basla = null; return; }
      basla = null;
      const id = vur(e, cv);
      if (id) sec(id); else if (ui.sel) sec(null);
    });
    cv.addEventListener('dblclick', e => { const id = vur(e, cv); if (id) ucIse(id); });
    cv.addEventListener('wheel', () => { sonEtkilesim = performance.now(); ucus = null; }, { passive: true });
  }
  function vur(e, cv) {
    const r = cv.getBoundingClientRect();
    isin.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, kamera);
    isin.params.Points = { threshold: 1 };
    const h = isin.intersectObjects(secilebilir, false).filter(x => x.object.material.opacity > 0.2);
    return h.length ? h[0].object.userData.id : null;
  }
  function ucIse(id) {
    const poz = K.pozlar && K.pozlar.get(id); if (!poz) return;
    const yon = poz.clone().normalize();
    const uzak = C.map.get(id).parentId ? 55 : 90;
    ucus = { hedef: poz.clone(), kamera: poz.clone().add(yon.multiplyScalar(uzak)).add(V(0, uzak * 0.25, 0)) };
    sonEtkilesim = performance.now();
  }

  /* ---------- çizim döngüsü ---------- */
  function dongu() {
    rafId = requestAnimationFrame(dongu);
    if (!kap || !kap.isConnected) { birak(); return; }
    const t = performance.now();

    // boşta yavaşça dön
    kontrol.autoRotate = ui.kureDon !== false && !ucus && t - sonEtkilesim > 6000;
    // uçuş: hedefe yumuşak geçiş
    if (ucus) {
      kontrol.target.lerp(ucus.hedef, 0.08); kamera.position.lerp(ucus.kamera, 0.08);
      if (kamera.position.distanceTo(ucus.kamera) < 0.5) ucus = null;
    }
    kontrol.update();

    // bloke düğümler nabız gibi
    const s = 1 + Math.sin(t / 420) * 0.18;
    nabizlar.forEach(m => m.scale.setScalar(s));
    if (halo) { halo.rotation.y = t / 1800; halo.rotation.x = t / 2600; }

    // fare altındaki düğüm
    if (fareOynadi) {
      fareOynadi = false; let yeni = null;
      if (fare) {
        isin.setFromCamera(fare, kamera);
        const h = isin.intersectObjects(secilebilir, false).filter(x => x.object.material.opacity > 0.2);
        yeni = h.length ? h[0].object.userData.id : null;
      }
      if (yeni !== uzerinde) { uzerinde = yeni; renderer.domElement.style.cursor = yeni ? 'pointer' : ''; }
    }

    // etiketler: aşama adları hep, adım/parsiyel adları yaklaşınca, üzerine gelince veya seçiliyken
    const kp = kamera.position;
    etiketler.forEach(et => {
      let gor = true;
      if (et.tur === 'adim') gor = kp.distanceTo(et.poz) < 150;
      else if (et.tur === 'alt') gor = kp.distanceTo(et.poz) < 75;
      if (et.sol && et.tur !== 'asama' && et.tur !== 'merkez') gor = false;
      const ozel = et.id && (et.id === uzerinde || et.id === ui.sel);
      if (ozel) gor = true;
      et.obj.visible = gor; // CSS2DRenderer görünürlüğü nesneden okur
      et.el.classList.toggle('vurgu', !!ozel);
    });

    renderer.render(sahne, kamera);
    etkR.render(sahne, kamera);
  }

  /* ---------- dışa açık ---------- */
  const K = {};
  window.kureGuncelle = function () {
    const c = document.getElementById('kure3d'); if (!c) return;
    if (!hazir()) {
      if (!c.querySelector('.kure-yukle')) c.innerHTML = '<div class="kure-yukle">3B görünüm yükleniyor…</div>';
      kutuphane().then(() => { if (ui.view === 'kure') window.kureGuncelle(); })
        .catch(() => { c.innerHTML = '<div class="kure-yukle">3B kütüphanesi yüklenemedi. Proje klasöründe <code>lib/three.min.js</code>, <code>lib/OrbitControls.js</code> ve <code>lib/CSS2DRenderer.js</code> olmalı.</div>'; });
      return;
    }
    if (c !== kap) { if (kap) birak(); kur(c); }
    insa();
  };
  window.kureOrtala = function () {
    if (!kamera) return;
    ucus = { hedef: V(0, 0, 0), kamera: V(0, 70, 310).applyAxisAngle(V(0, 1, 0), Math.atan2(kamera.position.x, kamera.position.z)) };
  };
  window.kureUc = ucIse;
})();
