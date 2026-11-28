/* Neon Yol — neon şehrin içinden geçen ızgaralı yolda yuvarlanan top. Parmağını sağa sola kaydır (ya da ← → / A D):
   bloklardan kaç, boşluklara düşme, dar köprülerden geç, tünellerde hızlan, rampadan zıpla. Yol hep rastgele üretilir ama
   her zaman geçilebilir bir şerit bırakılır. Three.js sitenin kökündeki three.min.js'den, oyun açılınca yüklenir. */
(function () {
'use strict';
/* ---------- yol üretici (THREE gerektirmez; node ile test edilebilir) ----------
   satır = { l: [5 şerit kodu], t: tünel halkası?, y: yazı } — 0 boşluk, 1 zemin, 2 küp, 3 duvar (atlanamaz), 4 hızlandırıcı, 5 rampa */
const NY = (() => {
  const S = 5;
  function uretici(zorluk, tohum) {
    let t = tohum >>> 0 || 1; const r = () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const R = []; let yol = 2, sonKay = 0, desenSay = 0, h = 0, egim = 0, hedefEgim = 0;
    const satir = (kod, ek) => Object.assign({ l: Array(S).fill(kod) }, ek || {});
    const kay = (i) => { if (i - sonKay < 4 || r() > .45) return; const y = yol + (r() < .5 ? -1 : 1); if (y < 0 || y >= S) return; sonKay = i; return y; };
    function ekle(row) { row.h = +h.toFixed(3); R.push(row); egim += Math.max(-.035, Math.min(.035, hedefEgim - egim)); h += egim; }
    function arazi(d) {   /* her desenden önce yeni eğim hedefi: düz, yokuş, iniş ya da tepe */
      const x = r(); if (R.length < 20) return (hedefEgim = 0);
      hedefEgim = x < .3 ? 0 : x < .55 ? .12 + r() * (.1 + .12 * d) : -(.14 + r() * (.12 + .14 * d));
      if (h > 9) hedefEgim = -Math.abs(hedefEgim || .18); if (h < -9) hedefEgim = Math.abs(hedefEgim || .18);
    }
    function acik(n) { for (let k = 0; k < n; k++) ekle(satir(1)); }
    function bloklar(n, d) {
      for (let k = 0; k < n; k++) { const i = R.length, eski = yol, y = kay(i); if (y != null) yol = y; const row = satir(1);
        if (k % 2 === 0) for (let s = 0; s < S; s++) if (s !== yol && s !== eski && r() < .28 + .32 * d) row.l[s] = 2;
        ekle(row); if (y != null) ekle(satir(1)); } }
    function bosluk(n, d) {
      const gen = d > .6 ? 1 : 2;
      for (let k = 0; k < n; k++) { const i = R.length, eski = yol, y = kay(i); if (y != null) yol = y; const row = satir(0);
        for (let s = 0; s < S; s++) if (Math.abs(s - yol) < gen || s === eski) row.l[s] = 1;
        if (r() < .25) { const s = (r() * S) | 0; row.l[s] = 1; } ekle(row); } }
    function dar(n, d) {
      let a = Math.max(0, yol - 1), b = Math.min(S - 1, yol + 1);
      for (let k = 0; k < n; k++) { const i = R.length, eski = yol, y = kay(i); if (y != null) { yol = y; a = Math.max(0, Math.min(a, yol - (d > .5 ? 0 : 1))); b = Math.min(S - 1, Math.max(b, yol + (d > .5 ? 0 : 1))); }
        const row = satir(0); for (let s = Math.min(a, eski, yol); s <= Math.max(b, eski, yol); s++) row.l[s] = 1;
        if (k % 4 === 3) { a = Math.max(0, yol - 1); b = Math.min(S - 1, yol + 1); } ekle(row); } }
    function duvar(n, d) {
      for (let k = 0; k < n; k++) { if (k % 7 !== 3) { ekle(satir(1)); continue; } const row = satir(3), kapi = Math.max(0, Math.min(S - 1, yol + ((r() * 5) | 0) - 2)), gen = d > .5 ? 1 : 2;
        for (let s = kapi; s < Math.min(S, kapi + gen); s++) row.l[s] = 1; yol = kapi; sonKay = R.length; ekle(row); } }
    function tunel(n) { ekle(satir(4, { y: 'hiz' })); for (let k = 0; k < n; k++) ekle(satir(1, { t: 1 })); }
    function rampa() { hedefEgim = 0; acik(2); ekle(satir(5)); for (let k = 0; k < 4; k++) ekle(satir(0)); acik(3); yol = 2; sonKay = R.length; }
    return {
      R,
      doldur(n, ilerleme) {
        while (R.length < n) {
          const d = Math.min(1, zorluk * .35 + ilerleme / 900), x = r(); desenSay++;
          if (R.length < 14) { acik(14); continue; }
          arazi(d); if (R.length % 3 === 0 && r() < .25) { const e = hedefEgim; hedefEgim = -e * .8; }
          if (desenSay % 9 === 0) { hedefEgim = 0; tunel(10 + ((r() * 8) | 0)); continue; }
          if (x < .26) bloklar(10 + ((r() * 10) | 0), d);
          else if (x < .46) bosluk(8 + ((r() * 8) | 0), d);
          else if (x < .62) dar(10 + ((r() * 8) | 0), d);
          else if (x < .76) duvar(14 + ((r() * 8) | 0), d);
          else if (x < .86) rampa();
          else acik(3 + ((r() * 4) | 0));
          acik(d > .7 ? 1 : 2);
        }
      }
    };
  }
  /* yolun her zaman geçilebilir olduğunu sınayan basit arama (testler için) */
  function gecilir(R) {
    let ok = new Set([2]);
    for (let i = 0; i < R.length; i++) { const l = R[i].l, yeni = new Set();
      if (l.every(x => x === 0)) { if (i > 0 && R[i - 1].l.some(x => x === 5)) { ok.forEach(s => yeni.add(s)); ok = yeni; continue; } if (i > 1 && R.slice(Math.max(0, i - 4), i).some(z => z.l.some(x => x === 5))) { ok.forEach(s => yeni.add(s)); ok = yeni; continue; } return i; }
      for (const s of ok) for (const d of [-1, 0, 1]) { const y = s + d; if (y >= 0 && y < S && (l[y] === 1 || l[y] === 4 || l[y] === 5) && (d === 0 || l[s] === 1 || l[s] === 4 || l[s] === 5)) yeni.add(y); }
      if (!yeni.size) return i; ok = yeni; }
    return -1;
  }
  return { S, uretici, gecilir };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = NY; return; }
if (!window.registerGame) return;
const CSS = `
.ny-mount{padding:0!important;align-items:stretch!important;justify-content:flex-start!important;overflow:hidden!important}
.ny{position:relative;width:100%;background:#2a2550;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;border-radius:14px}
.ny canvas{display:block;width:100%;height:100%}
.ny-hud{position:absolute;top:10px;left:10px;right:10px;display:flex;align-items:flex-start;gap:10px;pointer-events:none;color:#fff;font-weight:900;text-shadow:0 2px 4px rgba(0,0,0,.6)}
.ny-hud .k{flex:1;text-align:center;line-height:1.05}.ny-hud small{display:block;font-size:11px;letter-spacing:.08em;opacity:.95}.ny-hud b{font-size:24px}.ny-hud .h small{color:#ffc2d6}.ny-hud .h b{color:#ffc2d6}
.ny-hud button{pointer-events:auto;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.85);color:#b45a86;font-size:17px;font-weight:900;flex:none}
.ny-yazi{position:absolute;left:0;right:0;bottom:16%;text-align:center;color:#fff;font-weight:900;font-size:clamp(30px,10vw,54px);text-shadow:0 0 16px #99e6dc,0 3px 0 #4a8f8a;pointer-events:none;opacity:0;transition:opacity .25s}.ny-yazi.ac{opacity:1}
.ny-ekran{position:absolute;inset:0;display:grid;place-items:center;background:rgba(36,30,70,.55);backdrop-filter:blur(2px)}
.ny-ekran>div{width:min(330px,86%);display:flex;flex-direction:column;gap:10px;text-align:center;color:#fff}
.ny-ekran h2{margin:0;font-size:34px;font-weight:900;letter-spacing:.02em;background:linear-gradient(90deg,#fbcfe8,#a5f3fc);-webkit-background-clip:text;background-clip:text;color:transparent}
.ny-ekran p{margin:0;font-weight:700;font-size:14px;opacity:.9;line-height:1.45}.ny-ekran .puan{font-size:52px;font-weight:900;line-height:1}
.ny-ekran button{padding:13px;border-radius:14px;font-weight:900;font-size:16px;background:rgba(255,255,255,.12);color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)}
.ny-ekran button.ana{background:linear-gradient(90deg,#d77fb4,#8b7fd6);box-shadow:0 6px 20px rgba(215,127,180,.35)}
.ny-mod{display:flex;gap:6px}.ny-mod button{flex:1;padding:10px 4px;font-size:14px}.ny-mod button.ak{background:#fff;color:#7a6bc8}
`;
const MOD = [{ ad: 'KOLAY', hiz: 8.5 }, { ad: 'NORMAL', hiz: 10.5 }, { ad: 'ZOR', hiz: 12.5 }];
const hafta = () => Math.floor((Date.now() / 864e5 + 3) / 7);
function threeYukle() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threeYukle._p) return threeYukle._p;
  return (threeYukle._p = new Promise((ok, no) => { const s = document.createElement('script'); s.src = '../three.min.js'; s.onload = () => window.THREE ? ok(window.THREE) : no(); s.onerror = () => { threeYukle._p = null; no(); }; document.head.appendChild(s); }));
}
registerGame({
  id: 'neonyol', title: 'Neon Yol', category: 'Refleks', tags: 'neon yol top yuvarlanma koşu 3d sonsuz engel kaçma refleks hız', odak: true, noRestart: true,
  aciklama: 'Neon şehrin içinden geçen yolda topunu yuvarla: parmağını kaydırıp bloklardan kaç, boşluklara düşme, tünellerde hızlan. Üç zorluk, haftalık rekor.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="nyb" cx=".35" cy=".3"><stop offset="0" stop-color="#ff8ad8"/><stop offset=".55" stop-color="#c2188f"/><stop offset="1" stop-color="#5b0a45"/></radialGradient></defs><rect width="90" height="90" fill="#05030f"/><g stroke="#6d73d6" stroke-width=".800" fill="#1b1d4d"><path d="M0 0h20v70L0 90z"/><path d="M90 0H70v70l20 20z"/></g><g stroke="#3b3f9e" stroke-width=".600">' + [10, 20, 30, 40, 50, 60].map(y => `<path d="M0 ${y}h20M70 ${y}h20"/>`).join('') + '</g><path d="M38 28h14l26 62H12z" fill="#2d2f6b"/><g stroke="#a5a9ff" stroke-width="1.100" fill="none"><path d="M38 28L12 90M52 28l26 62M45 28v62"/><path d="M36 36h18M33 45h24M29 56h32M24 69h42M18 84h54"/><path d="M41.500 28L32 90M48.500 28L58 90"/></g><rect x="49" y="38" width="9" height="9" fill="#d946ef" stroke="#f5d0fe" stroke-width=".700"/><circle cx="40" cy="67" r="11" fill="url(#nyb)"/></svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 3L4 21M15 3l5 18M12 3v4M12 10v4"/><circle cx="12" cy="18" r="3"/></svg>',
  shareText() { return this._paylas || 'Neon Yol: topu yuvarla, engellerden kaç.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('ny-css')) { const s = document.createElement('style'); s.id = 'ny-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('ny-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, mod: 0, en: [0, 0, 0], h: { k: 0, s: [0, 0, 0] }, oyn: 0 }, (api.loadState && api.loadState()) || {});
    if (D.h.k !== hafta()) D.h = { k: hafta(), s: [0, 0, 0] };
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'ny' }); root.append(kok);
    const boyut = () => { const ust = kok.getBoundingClientRect().top; kok.style.height = Math.max(380, Math.min(innerHeight - Math.max(0, ust) - 10, 900)) + 'px'; };
    boyut();
    kok.innerHTML = '<div class="ny-ekran"><div><h2>Neon Yol</h2><p>Yükleniyor…</p></div></div>';
    let canli = true, raf = 0;
    api.onCleanup(() => { canli = false; cancelAnimationFrame(raf); temizle && temizle(); root.classList.remove('ny-mount'); });
    let temizle = null;
    threeYukle().then(T => { if (canli) kur(T); }).catch(() => { kok.innerHTML = '<div class="ny-ekran"><div><h2>Neon Yol</h2><p>3B kitaplığı yüklenemedi. İnternetini kontrol edip oyunu yeniden aç.</p></div></div>'; });
    function kur(THREE) {
      kok.innerHTML = `<canvas></canvas><div class="ny-hud"><span style="width:42px"></span><div class="k"><small id="ny-m">KOLAY</small><b id="ny-p">0</b></div><div class="k h"><small>BU HAFTA</small><b id="ny-h">0</b></div><button data-a="dur">❚❚</button></div><div class="ny-yazi" id="ny-y">Hızlan!</div><div class="ny-ekran" id="ny-e"></div>`;
      const cv = kok.querySelector('canvas'), q = s => kok.querySelector(s);
      const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      const sahne = new THREE.Scene(); sahne.fog = new THREE.Fog(0x5d5085, 20, 72);
      const kamera = new THREE.PerspectiveCamera(62, 1, .1, 120);
      sahne.add(new THREE.HemisphereLight(0xd8d0f5, 0x3a2f55, .95)); const gunes = new THREE.DirectionalLight(0xfff1f6, .55); gunes.position.set(-3, 8, 4); sahne.add(gunes);
      /* dokular */
      const doku = (w, h, ciz) => { const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
      sahne.background = doku(4, 256, (g, w, h) => { const y = g.createLinearGradient(0, 0, 0, h); y.addColorStop(0, '#1f1c3d'); y.addColorStop(.45, '#3d3566'); y.addColorStop(.72, '#6f5c8f'); y.addColorStop(1, '#5d5085'); g.fillStyle = y; g.fillRect(0, 0, w, h); });
      const zeminD = doku(128, 128, (g, w, h) => { g.fillStyle = '#474c88'; g.fillRect(0, 0, w, h); g.strokeStyle = '#bcc0f0'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); });
      const hizD = doku(128, 128, (g, w, h) => { g.fillStyle = '#3f8a8c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c3efe8'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); g.fillStyle = '#9de3d7'; for (const y of [30, 72]) { g.beginPath(); g.moveTo(20, y + 26); g.lineTo(64, y); g.lineTo(108, y + 26); g.lineTo(108, y + 40); g.lineTo(64, y + 14); g.lineTo(20, y + 40); g.fill(); } });
      const rampaD = doku(128, 128, (g, w, h) => { g.fillStyle = '#a58a4c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f5e6b8'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); g.fillStyle = '#f2dc8c'; g.beginPath(); g.moveTo(64, 18); g.lineTo(104, 70); g.lineTo(80, 70); g.lineTo(80, 110); g.lineTo(48, 110); g.lineTo(48, 70); g.lineTo(24, 70); g.fill(); });
      const binaD = doku(128, 256, (g, w, h) => { g.fillStyle = '#2c2d58'; g.fillRect(0, 0, w, h); g.strokeStyle = '#575e9e'; g.lineWidth = 2; for (let x = 0; x <= w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
      binaD.wrapS = binaD.wrapT = THREE.RepeatWrapping;
      /* yol ve engeller (örnekli ağlar) */
      const GOR = 75, S = NY.S;
      const tasG = new THREE.BoxGeometry(1, .3, 1), mZ = new THREE.MeshBasicMaterial({ map: zeminD }), mH = new THREE.MeshBasicMaterial({ map: hizD }), mR = new THREE.MeshBasicMaterial({ map: rampaD });
      const zemin = new THREE.InstancedMesh(tasG, mZ, GOR * S), hizT = new THREE.InstancedMesh(tasG, mH, 60), rampaT = new THREE.InstancedMesh(tasG, mR, 60);
      const kupD = doku(128, 128, (g, w, h) => { g.fillStyle = '#cf7fb1'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f8d3e8'; g.lineWidth = 7; g.strokeRect(4, 4, w - 8, h - 8); });
      const kupG = new THREE.BoxGeometry(.94, 1, .94), mK = new THREE.MeshStandardMaterial({ map: kupD, emissive: 0xffffff, emissiveMap: kupD, emissiveIntensity: .12, roughness: .7 });
      const kup = new THREE.InstancedMesh(kupG, mK, 260);
      const halkaG = new THREE.TorusGeometry(3.3, .14, 8, 28, Math.PI), mT = new THREE.MeshBasicMaterial({ color: 0xe8a9d6 }), halka = new THREE.InstancedMesh(halkaG, mT, 40);
      const tunelYanG = new THREE.PlaneGeometry(1, 2.4), mTy = new THREE.MeshBasicMaterial({ color: 0xb193d9, transparent: true, opacity: .35, side: THREE.DoubleSide }), tunelYan = new THREE.InstancedMesh(tunelYanG, mTy, 80);
      [zemin, hizT, rampaT, kup, halka, tunelYan].forEach(m => { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; sahne.add(m); });
      /* binalar */
      const binalar = [];
      for (let i = 0; i < 36; i++) { const g = new THREE.BoxGeometry(1, 1, 1), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: binaD.clone() })); m.material.map.wrapS = m.material.map.wrapT = THREE.RepeatWrapping; sahne.add(m); binalar.push({ m, z: 0 }); }
      const binaKur = (b, z, sol) => { const w = 3 + Math.random() * 4, h = 8 + Math.random() * 26, d = 3 + Math.random() * 5; b.m.scale.set(w, h, d); b.m.position.set((sol ? -1 : 1) * (4.2 + w / 2 + Math.random() * 3), h / 2 - 6, -z); b.m.material.map.repeat.set(w / 2, h / 4); b.z = z; b.sol = sol; };
      /* top */
      const top = new THREE.Mesh(new THREE.SphereGeometry(.4, 36, 20), new THREE.MeshStandardMaterial({ color: 0xe56fa3, roughness: .3, metalness: .15, emissive: 0x4a1533, emissiveIntensity: .3 }));
      sahne.add(top); const golge = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35 })); golge.rotation.x = -Math.PI / 2; sahne.add(golge);
      const dm = new THREE.Object3D(), gizle = new THREE.Matrix4().makeScale(0, 0, 0);
      /* durum */
      let O = null, durum = 'menu', hedefX = 0, tus = 0, surukle = null, yaziT = 0;
      function yeniOyun() {
        const u = NY.uretici(D.mod, (Math.random() * 2 ** 31) | 0);
        O = { u, z: 0, x: 0, y: 0, vy: 0, hiz: MOD[D.mod].hiz, boost: 0, puan: 0, dus: false, rot: 0, sonHiz: 0, tunel: false };
        hedefX = 0; u.doldur(GOR + 40, 0); kamY = 0; bakY = 0;
        binalar.forEach((b, i) => binaKur(b, (i >> 1) * 7 + Math.random() * 4, i % 2 === 0));
        q('#ny-m').textContent = MOD[D.mod].ad; q('#ny-h').textContent = D.h.s[D.mod]; q('#ny-p').textContent = '0';
      }
      const yuk = i => { const R = O.u.R[Math.max(0, i)]; return R ? R.h : 0; };
      const yolY = z => { const i = Math.floor(z), f = z - i; return yuk(i) * (1 - f) + yuk(i + 1) * f; };
      let kamY = 0, bakY = 0;
      const kod = (i, s) => { if (s < 0 || s >= S || i < 0) return 0; const R = O.u.R[i]; return R ? R.l[s] : 1; };
      const zeminMi = c => c === 1 || c === 2 || c === 4 || c === 5;
      function cizDunya() {
        const i0 = Math.max(0, Math.floor(O.z) - 6); O.u.doldur(i0 + GOR + 30, O.z);
        let nz = 0, nh = 0, nr = 0, nk = 0, nt = 0, ny = 0;
        for (let k = 0; k < GOR; k++) { const i = i0 + k, R = O.u.R[i]; if (!R) break;
          const h0 = R.h, h1 = yuk(i + 1), dh = h1 - h0, yo = (h0 + h1) / 2, ac = Math.atan(dh), boy = Math.sqrt(1 + dh * dh);
          for (let s = 0; s < S; s++) { const c = R.l[s]; if (!c) continue; dm.position.set(s - 2, yo - .15, -(i + .5)); dm.scale.set(1, 1, boy); dm.rotation.set(ac, 0, 0); dm.updateMatrix();
            if (c === 4 && nh < 60) hizT.setMatrixAt(nh++, dm.matrix); else if (c === 5 && nr < 60) rampaT.setMatrixAt(nr++, dm.matrix); else zemin.setMatrixAt(nz++, dm.matrix);
            if ((c === 2 || c === 3) && nk < 260) { const h = c === 3 ? 2.6 : 1; dm.position.set(s - 2, yo + h / 2 - .02, -(i + .5)); dm.scale.set(1, h, 1); dm.rotation.set(0, 0, 0); dm.updateMatrix(); kup.setMatrixAt(nk++, dm.matrix); } }
          if (R.t && nt < 40 && k % 2 === 0) { dm.position.set(0, yo, -(i + .5)); dm.scale.set(1, 1, 1); dm.rotation.set(0, 0, 0); dm.updateMatrix(); halka.setMatrixAt(nt++, dm.matrix);
            for (const sx of [-1, 1]) if (ny < 80) { dm.position.set(sx * 2.9, yo + 1.1, -(i + .5)); dm.rotation.set(0, Math.PI / 2, sx * .35); dm.scale.set(2, 1, 1); dm.updateMatrix(); tunelYan.setMatrixAt(ny++, dm.matrix); } } }
        zemin.count = nz; hizT.count = nh; rampaT.count = nr; kup.count = nk; halka.count = nt; tunelYan.count = ny;
        [zemin, hizT, rampaT, kup, halka, tunelYan].forEach(m => m.instanceMatrix.needsUpdate = true);
        binalar.forEach(b => { if (b.z < O.z - 10) binaKur(b, b.z + 18 * 7 + Math.random() * 3, b.sol); });
        const yb = yolY(O.z); top.position.set(O.x, yb + O.y + .4, -O.z); top.rotation.x = -O.rot; golge.position.set(O.x, yb + .02, -O.z); golge.rotation.x = -Math.PI / 2 + Math.atan(yuk(Math.floor(O.z) + 1) - yuk(Math.floor(O.z))); golge.visible = !O.dus && O.y < 3; golge.scale.setScalar(Math.max(.3, 1 - O.y * .25));
        const hk = Math.max(yolY(O.z - 4.6), yb) , hb = yolY(O.z + 7); kamY += (hk - kamY) * .12; bakY += (hb - bakY) * .1;
        const kx = O.x * .55; kamera.position.set(kx, kamY + 2.5 + Math.min(O.y * .3, 1), -O.z + 4.6); kamera.lookAt(kx * .8, bakY * .6 + yb * .4 + .2, -O.z - 7);
        renderer.render(sahne, kamera);
      }
      function adim(dt) {
        if (durum !== 'oyna') return;
        const eg = yuk(Math.floor(O.z) + 1) - yuk(Math.floor(O.z)), hiz = O.hiz * (O.boost > 0 ? 1.45 : 1) * Math.max(.82, Math.min(1.25, 1 - eg * .9)); O.boost = Math.max(0, O.boost - dt);
        O.z += hiz * dt; O.rot += hiz * dt / .4;
        if (tus) hedefX += tus * 7.5 * dt; hedefX = Math.max(-3.2, Math.min(3.2, hedefX));
        O.x += (hedefX - O.x) * Math.min(1, dt * 16);
        const i = Math.floor(O.z), s = Math.round(O.x + 2), c = kod(i, s);
        if (O.y > 0 || O.vy > 0) { O.vy -= 26 * dt; O.y += O.vy * dt; if (O.y <= 0 && !O.dus) { if (zeminMi(c) && Math.abs(O.x) <= 2.55) { O.y = 0; O.vy = 0; ses('tap'); } } }
        if (O.dus) { O.vy -= 30 * dt; O.y += O.vy * dt; if (O.y < -6) return bitti(); return; }
        if (O.y <= 0) {
          if (!zeminMi(c) || Math.abs(O.x) > 2.55) { O.dus = true; O.vy = -1; ses('lose'); return; }
          if (c === 4 && O.boost < 2.6) { O.boost = 3; yazi('Hızlan!'); ses('score'); }
          if (c === 5) { const sure = 6.2 / hiz; O.vy = 26 * sure / 2; O.y = .01; ses('click'); }
        }
        /* küp/duvar çarpışması */
        for (let r = Math.floor(O.z - .45); r <= Math.floor(O.z + .45); r++) for (let k = Math.floor(O.x + 2 - .45 + .5); k <= Math.floor(O.x + 2 + .45 + .5); k++) {
          const cc = kod(r, k); if (cc !== 2 && cc !== 3) continue; const h = cc === 3 ? 2.6 : 1; if (O.y > h - .05) continue;
          const bx = k - 2, bz = r + .5, dx = Math.max(Math.abs(O.x - bx) - .47, 0), dz = Math.max(Math.abs(O.z - bz) - .47, 0);
          if (dx * dx + dz * dz < .37 * .37) return carp(); }
        const p = Math.floor(O.z / 4); if (p !== O.puan) { O.puan = p; q('#ny-p').textContent = p; if (p > 0 && p % 50 === 0) { O.hiz += .9; yazi('Hız arttı!'); ses('score'); } }
      }
      function yazi(t) { const y = q('#ny-y'); y.textContent = t; y.classList.add('ac'); clearTimeout(yaziT); yaziT = setTimeout(() => y.classList.remove('ac'), 1100); }
      function carp() { ses('bad'); try { navigator.vibrate && navigator.vibrate(120); } catch (e) { } O.dus = false; bitti(); }
      function bitti() {
        durum = 'bitti'; const p = O.puan, m = D.mod, yeniEn = p > D.en[m], yeniH = p > D.h.s[m];
        if (yeniEn) D.en[m] = p; if (yeniH) D.h.s[m] = p; D.oyn++; kaydet(); q('#ny-h').textContent = D.h.s[m]; if (p > 0) api.submitScore(p);
        try { window.Progress && Progress.olay('ny_' + (p >= 100 ? '100' : 'oyn')); } catch (e) { }
        oyun._paylas = `Neon Yol (${MOD[m].ad.toLowerCase()}): ${p} puan${yeniEn ? ' — yeni rekor! 🏆' : ''}\nerdevelop.com/oyunlar/#o/neonyol`;
        ekran(`<h2>${yeniEn ? 'Yeni rekor!' : 'Oyun bitti'}</h2><div class="puan">${p}</div><p>${MOD[m].ad.toLowerCase()} · en iyi ${D.en[m]} · bu hafta ${D.h.s[m]}</p>
          <button class="ana" data-a="basla">↻ Yeniden</button><div class="ny-mod">${MOD.map((x, i) => `<button data-mod="${i}" class="${i === m ? 'ak' : ''}">${x.ad}</button>`).join('')}</div><button data-a="paylas">Paylaş</button>`);
        if (yeniEn) { ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } }
      }
      function ekran(h) { const e = q('#ny-e'); if (!h) { e.style.display = 'none'; e.innerHTML = ''; return; } e.style.display = ''; e.innerHTML = `<div>${h}</div>`; }
      function menu() { durum = 'menu'; ekran(`<h2>Neon Yol</h2><p>Parmağını sağa sola kaydırarak topu yönlendir. Pembe bloklardan kaç, boşluklara düşme. Yokuşta yavaşlar, inişte hızlanırsın. <span style="color:#9de3d7">Turkuaz</span> şeritler hızlandırır, <span style="color:#f2dc8c">sarı</span> rampa zıplatır.</p>
        <div class="ny-mod">${MOD.map((x, i) => `<button data-mod="${i}" class="${i === D.mod ? 'ak' : ''}">${x.ad}<br><small>en iyi ${D.en[i]}</small></button>`).join('')}</div><button class="ana" data-a="basla">▶ Başla</button>`); }
      function basla() { yeniOyun(); durum = 'oyna'; ekran(''); son = performance.now(); }
      function duraklat() { if (durum !== 'oyna') return; durum = 'durdu'; ekran('<h2>Durdu</h2><button class="ana" data-a="devam">▶ Devam</button><button data-a="basla">↻ Baştan</button><button data-a="menu">Menü</button>'); }
      kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
        if (b.dataset.mod != null) { D.mod = +b.dataset.mod; kaydet(); if (durum === 'menu') menu(); else basla(); return; }
        if (a === 'basla') basla(); else if (a === 'devam') { durum = 'oyna'; ekran(''); son = performance.now(); } else if (a === 'menu') { yeniOyun(); menu(); } else if (a === 'dur') { if (durum === 'oyna') duraklat(); else if (durum === 'durdu') { durum = 'oyna'; ekran(''); son = performance.now(); } }
        else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
      /* dokunma ve klavye */
      cv.addEventListener('pointerdown', e => { if (durum !== 'oyna') return; surukle = { id: e.pointerId, x: e.clientX, h: hedefX }; try { cv.setPointerCapture(e.pointerId); } catch (x) { } e.preventDefault(); });
      cv.addEventListener('pointermove', e => { if (!surukle || surukle.id !== e.pointerId) return; const w = cv.clientWidth || 360; hedefX = surukle.h + (e.clientX - surukle.x) / w * 7.5; });
      const birak = e => { if (surukle && surukle.id === e.pointerId) surukle = null; }; cv.addEventListener('pointerup', birak); cv.addEventListener('pointercancel', birak);
      const tusBas = e => { if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { tus = -1; e.preventDefault(); } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { tus = 1; e.preventDefault(); } else if (e.key === ' ' || e.key === 'Escape' || e.key === 'p') { if (durum === 'oyna') duraklat(); else if (durum !== 'oyna' && e.key === ' ') basla(); e.preventDefault(); } };
      const tusBirak = e => { if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && tus < 0) tus = 0; if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && tus > 0) tus = 0; };
      addEventListener('keydown', tusBas); addEventListener('keyup', tusBirak);
      const gorunur = () => { if (document.hidden) duraklat(); }; document.addEventListener('visibilitychange', gorunur);
      const yeniBoyut = () => { boyut(); const w = kok.clientWidth, h = kok.clientHeight; renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.fov = w / h < .7 ? 68 : 58; kamera.updateProjectionMatrix(); };
      addEventListener('resize', yeniBoyut); yeniBoyut();
      let son = performance.now();
      const dongu = t => { if (!canli) return; raf = requestAnimationFrame(dongu); const dt = Math.min(.05, (t - son) / 1000); son = t;
        if (durum === 'oyna') { const n = Math.ceil(dt / .012); for (let k = 0; k < n && durum === 'oyna'; k++) adim(dt / n); }
        else if (durum === 'menu' && O) { O.z += 4 * dt; O.rot += 10 * dt; }
        if (O) cizDunya(); };
      temizle = () => { removeEventListener('keydown', tusBas); removeEventListener('keyup', tusBirak); removeEventListener('resize', yeniBoyut); document.removeEventListener('visibilitychange', gorunur); try { renderer.dispose(); } catch (e) { } };
      yeniOyun(); menu(); raf = requestAnimationFrame(dongu);
      if (/[?&]nytest/.test(location.search)) window.__ny = { O: () => O, durum: () => durum, basla, set: v => { hedefX = v; }, NY };
    }
  }
});
})();
