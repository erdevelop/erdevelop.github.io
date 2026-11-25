/* Derin Mavi — 3D görünüm katmanı.
   Oyunun bütün kuralları, kayıt ve arayüz 2D oyunda (derin-mavi.html) kalır; bu modül yalnızca
   ortamı ve balıkları 3D çizer. 2D tuval şeffaf olarak üstte durur: plankton, yem, kabarcık, canlılar,
   etiketler orada çizilmeye devam eder. Koordinatlar: ekrandaki (x, y) noktası z = 0 düzlemine
   izdüşürülür; kum çizgisi (kumY) dünyada y = 0'a denk gelir, böylece 2D ve 3D üst üste oturur. */
import * as THREE from './three.module.min.js';
import { glbYukle } from './yukleyici.js';
import { EffectComposer } from './addons/postprocessing/EffectComposer.js';
import { RenderPass } from './addons/postprocessing/RenderPass.js';
import { ShaderPass } from './addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './addons/postprocessing/OutputPass.js';
import { mercanUret, MERCAN_RENK, canliUret, canliOyna, yuzenUret, yuzenOyna, insanUret, insanOyna } from './uretec.js';

const KAL = {
  tasarruf: { dpr: 0.85, golge: false, sm: 512, parca: 100, post: false, kostik: 0.7, cok: 0.35 },
  dusuk: { dpr: 1, golge: false, sm: 512, parca: 220, post: false, kostik: 0.9, cok: 0.55 },
  orta: { dpr: 1.5, golge: true, sm: 1024, parca: 420, post: false, kostik: 1.15 },
  yuksek: { dpr: 2, golge: true, sm: 2048, parca: 800, post: true, kostik: 1.4 }
};
const KAT = new URL('./', import.meta.url).href;
const ESLE = { palyaco: 'palyaco', cerrah: 'cerrah', melek: 'melek', orkinos: 'orkinos', yelken: 'yelken', ucan: 'ucan', fener: 'fener', balta: 'balta', kurdele: 'kurdele', buz: 'buz', mandarin: 'mandarin', papagan: 'papagan', lambuka: 'lambuka', uskumru: 'uskumru', engerek: 'engerek', isikli: 'isikli', yavru: 'sardalya' };

export async function kur3D({ tuval, kalite }) {
  const mobil = matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 600 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const R = new THREE.WebGLRenderer({ canvas: tuval, antialias: !mobil, powerPreference: 'high-performance' });
  /* CİHAZ SINIFI: ekran kartının adı, işlemci çekirdeği, bellek ve telefon olup olmadığına bakarak başlangıç kalitesi */
  const cihaz = (() => {
    let gpu = ''; try { const gl = R.getContext(), x = gl.getExtension('WEBGL_debug_renderer_info'); gpu = String(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { }
    const cek = navigator.hardwareConcurrency || 4, bel = navigator.deviceMemory || 4, sira = ['tasarruf', 'dusuk', 'orta', 'yuksek'];
    let s;
    if (/SwiftShader|llvmpipe|Software|Basic Render/i.test(gpu)) s = 0;
    else if (/RTX|GTX|Radeon (RX|Pro)|Apple M\d|Arc A|Quadro/i.test(gpu)) s = 3;
    else if (/Adreno.*?(\d{3})/i.test(gpu)) { const n = +gpu.match(/Adreno.*?(\d{3})/i)[1]; s = n >= 730 ? 2 : n >= 640 ? 1 : 0; }
    else if (/Mali-G(\d+)/i.test(gpu)) { const n = +gpu.match(/Mali-G(\d+)/i)[1]; s = n >= 710 ? 2 : n >= 76 ? 1 : 0; }
    else if (/Apple GPU/i.test(gpu)) s = 2; /* iPhone/iPad: model adı gizli, orta başla, gerekirse otomatik iner */
    else if (/Intel|UHD|Iris|Radeon(TM)? Graphics|Vega/i.test(gpu)) s = 2;
    else s = mobil ? 1 : 2;
    if (cek <= 4 || bel <= 3) s = Math.max(0, s - 1);
    if (mobil) s = Math.min(s, 2);
    return { gpu, cek, bel, mobil, seviye: sira[s] };
  })();
  /* kalite tercihi: 'oto' (önerilen) ya da sabit bir seviye */
  let oto = !KAL[kalite]; kalite = KAL[kalite] ? kalite : cihaz.seviye;
  let dprCarp = 1; /* otomatikte önce çözünürlük kısılır, yetmezse seviye iner */
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.12;
  R.shadowMap.type = THREE.PCFSoftShadowMap;
  const sahne = new THREE.Scene();
  const SIS_G = new THREE.Color('#1a7d99'), SIS_N = new THREE.Color('#071e30'), SIS = SIS_G.clone();
  sahne.fog = new THREE.FogExp2(SIS, 0.04);
  const kam = new THREE.PerspectiveCamera(50, 1, 0.1, 220);
  const U = { zaman: { value: 0 }, kostikGuc: { value: 1 }, agar: { value: 0 } };

  /* ---------- gökyüzü kubbesi ---------- */
  const RENK = { ust: new THREE.Color('#b4f3ff'), orta: new THREE.Color('#1a7d99'), alt: new THREE.Color('#06324a') };
  const kubbeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uUst: { value: RENK.ust.clone() }, uOrta: { value: RENK.orta.clone() }, uAlt: { value: RENK.alt.clone() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; uniform vec3 uUst, uOrta, uAlt;
      void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(uOrta, uUst, smoothstep(0.0, 0.95, y)) : mix(uOrta, uAlt, smoothstep(0.0, 0.5, -y));
        float g = pow(max(0.0, dot(vD, normalize(vec3(0.15, 1.0, 0.25)))), 24.0); c += uUst * g * 0.4; gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  sahne.add(new THREE.Mesh(new THREE.SphereGeometry(150, 48, 24), kubbeMat));
  const pm = new THREE.PMREMGenerator(R), envS = new THREE.Scene(); envS.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), kubbeMat.clone()));
  sahne.environment = pm.fromScene(envS, 0.04).texture; sahne.environmentIntensity = 0.55;

  /* ---------- ışıklar ---------- */
  const hemi = new THREE.HemisphereLight('#8fe8ff', '#c9b68c', 1.15); sahne.add(hemi);
  const gunes = new THREE.DirectionalLight('#fff3dc', 3.3); gunes.position.set(5, 22, 8); gunes.castShadow = true;
  Object.assign(gunes.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 70 }); gunes.shadow.bias = -0.0004; gunes.shadow.normalBias = 0.03;
  sahne.add(gunes);
  const ay = new THREE.DirectionalLight('#9fb8ff', 0); ay.position.set(-6, 20, 4); sahne.add(ay);

  /* ---------- dokular: ışık ağı (kostik) ve kaya pürüzü ---------- */
  function kostikDoku(n = 256) {
    const cv = document.createElement('canvas'); cv.width = cv.height = n; const x = cv.getContext('2d'), id = x.createImageData(n, n);
    const P = Array.from({ length: 26 }, () => [Math.random(), Math.random()]);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const u = i / n, v = j / n; let f1 = 9, f2 = 9;
      for (const [px, py] of P) { let dx = Math.abs(u - px), dy = Math.abs(v - py); dx = Math.min(dx, 1 - dx); dy = Math.min(dy, 1 - dy); const d = Math.sqrt(dx * dx + dy * dy); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
      const k = Math.pow(1 - Math.min(1, (f2 - f1) / 0.07), 3), o = (j * n + i) * 4; id.data[o] = id.data[o + 1] = id.data[o + 2] = k * 255; id.data[o + 3] = 255;
    }
    x.putImageData(id, 0, 0); x.filter = 'blur(1px)'; x.drawImage(cv, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t;
  }
  function detayDoku(n = 256) {
    const h = new Float32Array(n * n);
    const kat = (f, a) => { const g = new Float32Array((f + 1) * (f + 1)); for (let i = 0; i < g.length; i++) g[i] = Math.random(); for (let y = 0; y <= f; y++) g[y * (f + 1) + f] = g[y * (f + 1)]; for (let x = 0; x <= f; x++) g[f * (f + 1) + x] = g[x];
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const u = i / n * f, v = j / n * f, x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), a0 = g[y0 * (f + 1) + x0], b0 = g[y0 * (f + 1) + x0 + 1], a1 = g[(y0 + 1) * (f + 1) + x0], b1 = g[(y0 + 1) * (f + 1) + x0 + 1]; h[j * n + i] += a * ((a0 + (b0 - a0) * sx) * (1 - sy) + (a1 + (b1 - a1) * sx) * sy); } };
    kat(4, 0.5); kat(8, 0.25); kat(16, 0.14); kat(32, 0.08); kat(64, 0.04);
    const a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = a.height = b.width = b.height = n;
    const ax = a.getContext('2d'), bx = b.getContext('2d'), ai = ax.createImageData(n, n), bi = bx.createImageData(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const o = (j * n + i) * 4, dx = h[j * n + (i + 1) % n] - h[j * n + (i - 1 + n) % n], dy = h[((j + 1) % n) * n + i] - h[((j - 1 + n) % n) * n + i], nx = -dx * 6, ny = -dy * 6, l = Math.hypot(nx, ny, 1); ai.data[o] = (nx / l * 0.5 + 0.5) * 255; ai.data[o + 1] = (ny / l * 0.5 + 0.5) * 255; ai.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; ai.data[o + 3] = 255; const v = Math.min(255, Math.max(0, (h[j * n + i] - 0.25) * 255 / 0.75)); bi.data[o] = bi.data[o + 1] = bi.data[o + 2] = v; bi.data[o + 3] = 255; }
    ax.putImageData(ai, 0, 0); bx.putImageData(bi, 0, 0);
    return [a, b].map(c => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; });
  }
  const KOSTIK = kostikDoku(), [DN, DH] = detayDoku();
  U.kostik = { value: KOSTIK }; U.detayN = { value: DN }; U.detayH = { value: DH };

  /* malzemelere: üstten düşen ışık ağı, kaya pürüzü, balık yüzmesi, akıntıda salınım */
  function yama(mat, ek = {}) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uZaman: U.zaman, uKostik: U.kostik, uKostikGuc: U.kostikGuc, uDetayN: U.detayN, uDetayH: U.detayH, uAgar: U.agar });
      if (ek.yuz) { sh.uniforms.uFaz = ek.yuz.faz; sh.uniforms.uGenlik = ek.yuz.genlik; }
      sh.vertexShader = 'varying vec3 vDP; varying vec3 vDN;\nuniform float uZaman;\n' + (ek.yuz ? 'uniform float uFaz; uniform float uGenlik;\n' : '') + (ek.salin ? 'attribute float aBoy; attribute float aFaz;\n' : '') + sh.vertexShader;
      let gv = '#include <begin_vertex>\n';
      if (ek.yuz) gv += 'float gg = smoothstep(0.32, -0.55, position.x); transformed.z += uGenlik * (0.12 + gg * gg) * sin(position.x * 6.5 - uFaz) * 0.11; transformed.z -= uGenlik * 0.015 * sin(uFaz) * smoothstep(0.0, 0.5, position.x);\n';
      if (ek.salin) gv += 'float sk = pow(aBoy, 1.6); transformed.x += sk * (sin(uZaman * 0.9 + aFaz) * 0.35 + sin(uZaman * 2.1 + aFaz * 1.7) * 0.06); transformed.z += sk * sin(uZaman * 0.7 + aFaz * 1.3) * 0.18;\n';
      if (ek.dokunac) gv += 'float dk = max(0.0, position.y - 0.25) * 2.4; transformed.x += dk * sin(uZaman * 1.6 + position.x * 9.0 + position.z * 7.0) * 0.07; transformed.z += dk * cos(uZaman * 1.3 + position.z * 9.0) * 0.06;\n';
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', gv)
        .replace('#include <project_vertex>', '#include <project_vertex>\n vec4 dpw = modelMatrix * vec4(transformed, 1.0); vDP = dpw.xyz; vDN = normalize(mat3(modelMatrix) * objectNormal);');
      let fs = sh.fragmentShader;
      /* mercan beyazlaması: ekosistem kötüleşince renk solar, kemik beyazına döner */
      if (mat.userData.mercan) fs = 'uniform float uAgar;\n' + fs.replace('#include <color_fragment>', `#include <color_fragment>
          { float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.91, 0.86) * (0.72 + 0.35 * lum), uAgar); }`);
      if (ek.detay) {
        const o = ek.detay.toFixed(2);
        fs = fs.replace('#include <color_fragment>', `#include <color_fragment>
          { vec3 tw = pow(abs(vDN), vec3(4.0)); tw /= (tw.x + tw.y + tw.z); vec3 dp = vDP * ${o};
            float dh = texture2D(uDetayH, dp.zy).r * tw.x + texture2D(uDetayH, dp.xz).r * tw.y + texture2D(uDetayH, dp.xy).r * tw.z; diffuseColor.rgb *= mix(0.62, 1.12, dh); }`)
          .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          { vec3 tw = pow(abs(vDN), vec3(4.0)); tw /= (tw.x + tw.y + tw.z); vec3 dp = vDP * ${o};
            vec3 nx = texture2D(uDetayN, dp.zy).xyz * 2.0 - 1.0, ny = texture2D(uDetayN, dp.xz).xyz * 2.0 - 1.0, nz = texture2D(uDetayN, dp.xy).xyz * 2.0 - 1.0;
            vec3 pert = tw.x * vec3(0.0, nx.y, nx.x) + tw.y * vec3(ny.x, 0.0, ny.y) + tw.z * vec3(nz.x, nz.y, 0.0);
            normal = normalize(normal + (viewMatrix * vec4(pert * 0.9, 0.0)).xyz); }`);
      }
      sh.fragmentShader = 'varying vec3 vDP; varying vec3 vDN; uniform float uZaman; uniform sampler2D uKostik; uniform float uKostikGuc; uniform sampler2D uDetayN; uniform sampler2D uDetayH;\n' + fs.replace('#include <opaque_fragment>', `
        { vec2 kp = vDP.xz * 0.2;
          float ka = texture2D(uKostik, kp + vec2(uZaman * 0.021, uZaman * 0.013)).r;
          float kb = texture2D(uKostik, kp * 1.31 + vec2(-uZaman * 0.017, uZaman * 0.023)).r;
          float kk = min(ka, kb); kk = kk * kk * 3.2;
          float yon = clamp(vDN.y * 0.75 + 0.25, 0.0, 1.0);
          float yuk = mix(0.55, 1.15, clamp(vDP.y / 9.0, 0.0, 1.0));
          outgoingLight += diffuseColor.rgb * vec3(0.8, 0.97, 1.0) * kk * yon * yuk * uKostikGuc; }
        #include <opaque_fragment>`);
    };
    mat.customProgramCacheKey = () => 'dm3d' + Object.keys(ek).join('') + (ek.detay || '') + (mat.userData.mercan ? 'M' : '');
    return mat;
  }

  /* ---------- kum: 2D kum çizgisinin hizasında (z ≈ 0) düz, uzakta tümsekli ---------- */
  const zeminY = (x, z) => (0.28 * Math.sin(x * 0.13 + 1) * Math.cos(z * 0.11) + 0.1 * Math.sin(x * 0.37 + z * 0.29)) * THREE.MathUtils.clamp((Math.abs(z + 0.3) - 1.2) / 3, 0, 1) + (z < -12 ? (z + 12) * 0.08 : 0);
  {
    const n = 512, a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = a.height = b.width = b.height = n;
    const ax = a.getContext('2d'), bx = b.getContext('2d'), ai = ax.createImageData(n, n), bi = bx.createImageData(n, n), h = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const u = i / n * Math.PI * 2, v = j / n * Math.PI * 2; h[j * n + i] = Math.sin(u * 6 + Math.sin(v * 2) * 1.4 + Math.sin(v * 5 + u) * 0.4) * 0.6 + Math.sin(u * 13 + v * 3) * 0.15 + (Math.random() - 0.5) * 0.25; }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const o = (j * n + i) * 4, hx = h[j * n + (i + 1) % n] - h[j * n + (i - 1 + n) % n], hy = h[((j + 1) % n) * n + i] - h[((j - 1 + n) % n) * n + i];
      const nx = -hx * 1.4, ny = -hy * 1.4, l = Math.hypot(nx, ny, 1); bi.data[o] = (nx / l * 0.5 + 0.5) * 255; bi.data[o + 1] = (ny / l * 0.5 + 0.5) * 255; bi.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; bi.data[o + 3] = 255;
      const g = 0.86 + Math.random() * 0.14 + h[j * n + i] * 0.04, k = Math.random() < 0.02 ? 0.7 : 1; ai.data[o] = 222 * g * k; ai.data[o + 1] = 205 * g * k; ai.data[o + 2] = 165 * g * k; ai.data[o + 3] = 255;
    }
    ax.putImageData(ai, 0, 0); bx.putImageData(bi, 0, 0);
    const ta = new THREE.CanvasTexture(a), tb = new THREE.CanvasTexture(b); ta.colorSpace = THREE.SRGBColorSpace;
    for (const t of [ta, tb]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(26, 26); t.anisotropy = 4; }
    const g = new THREE.PlaneGeometry(160, 160, 220, 220); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, zeminY(p.getX(i), p.getZ(i))); g.computeVertexNormals();
    const z = new THREE.Mesh(g, yama(new THREE.MeshStandardMaterial({ map: ta, normalMap: tb, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.96, color: '#d2c29e' })));
    z.receiveShadow = true; sahne.add(z);
  }

  /* ---------- su yüzeyi ve ışık huzmeleri ---------- */
  const yuzeyDoku = KOSTIK.clone(); yuzeyDoku.repeat.set(22, 22); yuzeyDoku.needsUpdate = true;
  /* yüzey dalgaları: oyunun deniz durumuna göre (durgun ↔ fırtına) köşelerde yükselip alçalır,
     tepeler sivri; ışığa dönük yüzler parlar */
  const DZ = { uT: { value: 0 }, uA: { value: 0.05 }, uQ: { value: 0.4 }, uD: { value: 0.2 } };
  const yuzeyMat = new THREE.MeshBasicMaterial({ color: '#b8f0ff', map: yuzeyDoku, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  yuzeyMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, DZ);
    const dalga = `uniform float uT, uA, uQ, uD; varying float vE;
      float dlg(vec2 p) { float y = 0.0; vec2 d1 = normalize(vec2(1.0, 0.25)), d2 = normalize(vec2(0.8, -0.6)), d3 = normalize(vec2(-0.3, 1.0)), d4 = normalize(vec2(1.0, 0.9));
        float t1 = dot(p, d1) * 0.73 - uT * 0.95, t2 = dot(p, d2) * 1.3 - uT * 1.25, t3 = dot(p, d3) * 2.3 + uT * 1.6, t4 = dot(p, d4) * 4.1 - uT * 2.2;
        y += cos(t1 - uQ * sin(t1)); y += 0.5 * cos(t2 - uQ * sin(t2)); y += 0.28 * cos(t3 - uQ * sin(t3)); y += 0.14 * cos(t4);
        return y * uA + (1.0 - uD) * 0.012 * sin(p.x * 9.0 + uT * 3.0) * sin(p.y * 7.0 - uT * 2.0); }
`;
    sh.vertexShader = dalga + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec2 wp = vec2(position.x, -position.y); float h0 = dlg(wp);
      vE = (dlg(wp + vec2(0.15, 0.0)) - h0) / 0.15;
      transformed.z -= h0;`);
    sh.fragmentShader = 'uniform float uD; varying float vE;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight *= 0.75 + max(0.0, -vE) * (3.0 + uD * 4.0) - max(0.0, vE) * 0.6;
      #include <opaque_fragment>`);
  };
  const yuzey = new THREE.Mesh(new THREE.PlaneGeometry(260, 260, 220, 220), yuzeyMat);
  yuzey.rotation.x = Math.PI / 2; sahne.add(yuzey);
  const HUZME = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, uniforms: { uGuc: { value: 0.11 } },
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vU; uniform float uGuc; void main(){ float x = (vU.x - 0.5) * 2.0; gl_FragColor = vec4(vec3(0.78, 0.94, 1.0), exp(-x * x * 3.5) * pow(vU.y, 1.8) * smoothstep(0.0, 0.25, vU.y) * uGuc); }'
    });
    const h = new THREE.Mesh(new THREE.PlaneGeometry(1.6 + Math.random() * 2.2, 30), m); h.userData = { a: 0.12 + Math.random() * 0.1, f: Math.random() * 9, v: 0.15 + Math.random() * 0.2, ux: i / 8 }; sahne.add(h); HUZME.push(h);
  }

  /* ---------- deniz karı ---------- */
  const yuvarlak = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const x = cv.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(cv); })();
  let PARCA = null;
  function parcaKur() {
    if (PARCA) { sahne.remove(PARCA); PARCA.geometry.dispose(); }
    const n = KAL[kalite].parca, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * 40; p[i * 3 + 1] = Math.random() * 14; p[i * 3 + 2] = -14 + Math.random() * 24; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    PARCA = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.07, map: yuvarlak, transparent: true, depthWrite: false, opacity: 0.55, color: '#dff6ff', blending: THREE.AdditiveBlending }));
    sahne.add(PARCA);
  }

  /* bitki yaşam döngüsü (2D ile aynı formül): boyu ve rengi ekosistem gününe ve kaplamaya göre */
  const frk = v => v - Math.floor(v), kahve = new THREE.Color('#8A7444'), tc = new THREE.Color();
  function bitkiYasam(gun, tohum, per, kaplama) {
    const r1 = frk(Math.sin(tohum * 12.9898) * 43758.5453), r2 = frk(Math.sin(tohum * 78.233) * 12345.678), r3 = frk(Math.sin(tohum * 39.425) * 24634.633);
    const P = per[0] + r1 * (per[1] - per[0]), a = frk(gun / P + r2); let olc, sol = 0;
    if (a < 0.08) olc = 0; else if (a < 0.35) { const k = (a - 0.08) / 0.27; olc = k * k * (3 - 2 * k); } else if (a < 0.85) olc = 1; else { const k = (a - 0.85) / 0.15; olc = 1 - k * 0.65; sol = k; }
    return [olc * THREE.MathUtils.clamp((kaplama - r3 * 0.97) / 0.06, 0, 1), sol];
  }
  function bitkiGuncelle(me, gun, kaplama, per) {
    const B = me && me.userData.bitki; if (!B) return; const p = me.geometry.attributes.position, c = me.geometry.attributes.color;
    for (const [y0, h, b, n, tohum] of B.yap) { const [o, sl] = bitkiYasam(gun, tohum, per, kaplama), hh = h * Math.max(0.001, o) * (1 - sl * 0.2);
      for (let v = 0; v < n; v++) { const i = b + v, u = (v >> 1) / (n / 2 - 1); p.setY(i, y0 + u * hh); tc.setRGB(B.renk[i * 3], B.renk[i * 3 + 1], B.renk[i * 3 + 2]).lerp(kahve, sl * 0.8); c.setXYZ(i, tc.r, tc.g, tc.b); } }
    p.needsUpdate = true; c.needsUpdate = true; me.geometry.computeBoundingSphere();
  }
  let CAYIR3 = null, YOSUN3 = null, bitkiSon = '', bitkiT = 0;

  /* ---------- çayır ve yosun ---------- */
  function cayir(adet, alan, boy, gen, renk1, renk2, tohum) {
    let s = tohum; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pos = [], boyA = [], fazA = [], col = [], idx = [], yap = []; const c1 = new THREE.Color(renk1), c2 = new THREE.Color(renk2);
    for (let k = 0; k < adet; k++) {
      const x = alan[0] + rnd() * (alan[1] - alan[0]), z = alan[2] + rnd() * (alan[3] - alan[2]), y0 = zeminY(x, z) - 0.05, h = boy * (0.5 + rnd() * 0.8), a = rnd() * Math.PI, ca = Math.cos(a) * gen, sa = Math.sin(a) * gen, f = rnd() * 9, n = 10, b = pos.length / 3;
      for (let i = 0; i <= n; i++) { const u = i / n, w = 1 - u * 0.7; pos.push(x - ca * w, y0 + u * h, z - sa * w, x + ca * w, y0 + u * h, z + sa * w); boyA.push(u, u); fazA.push(f, f); const c = c1.clone().lerp(c2, u); col.push(c.r, c.g, c.b, c.r, c.g, c.b); if (i < n) idx.push(b + i * 2, b + i * 2 + 1, b + i * 2 + 2, b + i * 2 + 1, b + i * 2 + 3, b + i * 2 + 2); }
      yap.push([y0, h, b, (n + 1) * 2, k * 1.913 + tohum]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBoy', new THREE.Float32BufferAttribute(boyA, 1)); g.setAttribute('aFaz', new THREE.Float32BufferAttribute(fazA, 1)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const me = new THREE.Mesh(g, yama(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 }), { salin: 1 })); me.castShadow = true; me.receiveShadow = true;
    me.userData.bitki = { yap, renk: col.slice() }; return me;
  }

  /* ---------- modeller ---------- */
  const yukle = glbYukle; /* meshopt ile sıkıştırılmış modeller */
  const [bg, rg] = await Promise.all([yukle(KAT + 'baliklar.glb'), yukle(KAT + 'resif.glb')]);
  function malzHazirla(o, ek) {
    o.traverse(m => {
      if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true;
      const mats = [].concat(m.material).map(mt => {
        let n = mt.clone();
        if (/^govde|^goz/.test(n.name)) { const parlak = n.name === 'govde_parlak', goz = n.name === 'goz'; n = new THREE.MeshPhysicalMaterial({ name: n.name, vertexColors: true, roughness: goz ? 0.05 : parlak ? 0.3 : 0.42, metalness: parlak ? 0.45 : 0.05, clearcoat: goz ? 1 : 0.55, clearcoatRoughness: goz ? 0.02 : 0.28, iridescence: parlak ? 0.7 : 0.18, iridescenceIOR: 1.6, sheen: parlak ? 0 : 0.3, sheenColor: new THREE.Color('#bfe9ff') }); }
        if (n.name === 'kaya') n.color.setRGB(1.12, 1.06, 0.98);
        if (n.name === 'mercan' || n.name === 'anemon') n.color.setRGB(1.18, 1.12, 1.12);
        n.vertexColors = true;
        if (n.name === 'yuzgec') { n.transparent = true; n.opacity = 0.86; n.side = THREE.DoubleSide; }
        if (n.name === 'isik') { n.emissive = new THREE.Color('#9fffe8'); n.emissiveIntensity = 2.5; }
        return yama(n, ek(n));
      });
      m.material = mats.length === 1 ? mats[0] : mats;
    });
  }
  const P = {}; rg.scene.traverse(o => { if (o.isMesh && o.parent === rg.scene) P[o.name] = o; });
  for (const k in P) { P[k].position.set(0, 0, 0); P[k].rotation.set(0, 0, 0); P[k].scale.set(1, 1, 1); malzHazirla(P[k], m => (/anemon/.test(m.name) ? { dokunac: 1, detay: 2.5 } : /kaya/.test(m.name) ? { detay: 0.9 } : { detay: 2.2 })); }
  /* yordamsal mercanlar: beş tür, her biri birkaç renk ve biçimde; ağaç gibi dallı mercanın renkli kopyaları */
  const YENI = [];
  { const hRef = new THREE.Box3().setFromObject(P.dalli_0).getSize(new THREE.Vector3()).y || 1;
    const BOY = { geyik: 0.95, gorgon: 1.35, parmak: 0.7, kirbac: 1.7, karanfil: 1.05 };
    let tohum = 11;
    for (const tur in MERCAN_RENK) MERCAN_RENK[tur].forEach((renk, i) => {
      const { geo, salin } = mercanUret(tur, tohum += 17, renk); geo.scale(hRef * BOY[tur], hRef * BOY[tur], hRef * BOY[tur]);
      const m = new THREE.Mesh(geo, yama(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: tur === 'karanfil' ? 0.55 : 0.78 }), salin ? { salin: 1, detay: 2.2 } : { detay: 2.2 }));
      m.castShadow = true; m.receiveShadow = true; const k = 'u_' + tur + '_' + i; P[k] = m; YENI.push(k);
    });
    const TON = ['#ff9ec4', '#8fd0ff', '#ffd36b', '#c79bff', '#7dffc8', '#ff8a6b'];
    for (const dk of ['dalli_0', 'dalli_1', 'dalli_2', 'dalli_3']) TON.forEach((ton, j) => {
      if ((j + dk.length) % 2) return; const o = P[dk].clone(true);
      o.traverse(m => { if (m.isMesh) m.material = [].concat(m.material).map(mt => { const n = mt.clone(); n.color.multiply(new THREE.Color(ton)).multiplyScalar(1.35); return yama(n, { detay: 2.2 }); }).reduce((a, b, _, arr) => arr.length === 1 ? b : arr); });
      const k = dk + '_t' + j; P[k] = o; YENI.push(k);
    });
  }
  const B = {}; bg.scene.children.forEach(o => { if (o.name.startsWith('balik_')) B[o.name.slice(6)] = o; });

  /* ---------- yerleşim: ekran genişliğine göre kurulur ---------- */
  const ORTAM = new THREE.Group(); sahne.add(ORTAM);
  let DUVAR = null, TUNEL = null;
  /* kaya engeli: mağaralı duvarın ve sol tepeciğin üst yüzeyi bir yükseklik ızgarasına çıkarılır (köşe noktalarından, ışın atmadan ucuzca).
     Mağaranın tüneli ayrıca bir elipsoitle tanımlanır: içi boştur, balık girebilir. */
  const ENG = { x0: 0, z0: 0, h: 0.2, nx: 0, nz: 0, y: null };
  function engelKur(objs, x0, x1, z0, z1) {
    const h = 0.2, nx = Math.ceil((x1 - x0) / h) + 1, nz = Math.ceil((z1 - z0) / h) + 1, y = new Float32Array(nx * nz).fill(-99), v = new THREE.Vector3();
    for (const ob of objs) ob.traverse(m => { if (!m.isMesh) return; m.updateWorldMatrix(true, false); const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); const ix = Math.round((v.x - x0) / h), iz = Math.round((v.z - z0) / h); if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) continue; const k = iz * nx + ix; if (v.y > y[k]) y[k] = v.y; } });
    for (let gec = 0; gec < 2; gec++) { const y2 = y.slice(); /* köşe noktası düşmeyen hücreleri komşularından doldur */
      for (let iz = 1; iz < nz - 1; iz++) for (let ix = 1; ix < nx - 1; ix++) { const k = iz * nx + ix; if (y[k] > -98) continue; let n = 0, t = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const q = y[k + a * nx + b]; if (q > -98) { n++; t += q; } } if (n >= 3) y2[k] = t / n; }
      y.set(y2); }
    Object.assign(ENG, { x0, z0, h, nx, nz, y });
  }
  const kayaY = (x, z) => { if (!ENG.y) return -99; const fx = (x - ENG.x0) / ENG.h, fz = (z - ENG.z0) / ENG.h, ix = Math.floor(fx), iz = Math.floor(fz); if (ix < 0 || iz < 0 || ix >= ENG.nx - 1 || iz >= ENG.nz - 1) return -99; const k = iz * ENG.nx + ix, Y = ENG.y; return Math.max(Y[k], Y[k + 1], Y[k + ENG.nx], Y[k + ENG.nx + 1]); };
  const tunelIc = (x, y, z, r) => { const T = TUNEL; if (!T) return false; const a = (x - T.x) / Math.max(0.05, T.rx - r), b = (y - T.y) / Math.max(0.05, T.ry - r), c = (z - T.z) / T.rz; return a * a + b * b + c * c < 1; };
  const kayaIc = (x, y, z, ry, rx) => !tunelIc(x, y, z, Math.max(ry, rx * 0.6)) && y - ry < Math.max(kayaY(x, z), kayaY(x - rx, z), kayaY(x + rx, z));
  /* ekrandaki noktadan (z = 0) kamera ışını boyunca istenen derinliğe */
  const isinV = new THREE.Vector3();
  const isinda = (p0, z, out = new THREE.Vector3()) => { const c0 = kam.position, k2 = (c0.z - z) / c0.z; return out.set(c0.x + (p0.x - c0.x) * k2, c0.y + (p0.y - c0.y) * k2, z); };
  /* balık kayanın içinde ya da arkasında kalıyorsa aynı ışın üzerinde kayanın önüne gelir: ekrandaki yeri değişmez, kayaya gömülmez, arkasında kaybolmaz */
  /* uzaklaşırken resifin arkasına saklanmasın: dipteyken uzağa gitmez */
  const derZ = (p0, z, s) => { for (let i = 0; i < 12; i++) { const q = isinda(p0, z, isinV); if (q.y > zeminY(q.x, q.z) + s * 0.8 + (z < -1 ? 2.4 : 0) || z >= 0) return z; z = Math.min(0, z + 1); } return 0; };
  function kayaZ(p0, z, ry, rx) {
    if (!ENG.y) return z;
    for (let zz = 2.6; zz >= z - 1e-4; zz -= 0.15) { isinda(p0, zz, isinV); if (kayaIc(isinV.x, isinV.y, zz, ry, rx)) return Math.max(z, Math.min(3, zz + 0.15 + ry * 0.6)); }
    return z;
  }
  const ISIN = new THREE.Raycaster();
  function ortamKur(VW, magX) {
    ORTAM.clear(); MERCAN3 = []; KOLONI3 = []; ekoSon = "";
    let s = 9137; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, ara = (a, b) => a + r() * (b - a);
    const yarim = VW / 2 + 3;
    /* mağaralı kayalık: mağara ağzı 2D'deki uyku mağarasının üstüne gelir */
    const ds = THREE.MathUtils.clamp(VW / 42, 0.3, 0.48);
    DUVAR = P.duvar.clone(true); DUVAR.scale.setScalar(ds); DUVAR.position.set(magX - 1.8 * ds, -0.05, -4.3 * ds); DUVAR.rotation.y = 0; ORTAM.add(DUVAR); DUVAR.updateMatrixWorld(true);
    const koy = (k, x, z, sc, rot, ustte) => {
      const o = P[k].clone(true); o.scale.setScalar(sc); o.rotation.y = rot;
      let y = zeminY(x, z) - 0.05 * sc;
      if (ustte) { ISIN.set(new THREE.Vector3(x, 40, z), new THREE.Vector3(0, -1, 0)); const h = ISIN.intersectObject(ustte === true ? DUVAR : ustte, true)[0]; if (!h) return; y = h.point.y - 0.05; }
      o.position.set(x, y, z); ORTAM.add(o);
      if (MERCAN_K.has(k)) { o.userData.s0 = o.scale.x; MERCAN3.push(o); }
      return o;
    };
    const kayalar = ['kaya_0', 'kaya_1', 'kaya_2', 'kaya_3'];
    for (let i = 0; i < Math.round(VW / 3) + 3; i++) koy(kayalar[i % 4], ara(-yarim, yarim), ara(-11, -1.5), ara(0.6, 1.4), r() * 6.28);
    const mercanlar = ['beyin_0', 'beyin_1', 'dalli_0', 'dalli_1', 'masa_0', 'masa_1', 'tup_0', 'tup_1', 'yelpaze_0', 'yelpaze_1', ...YENI];
    /* mercan malzemelerini beyazlamaya hazırla (ilk çizimden önce) */
    for (const k of [...mercanlar, 'dalli_2', 'dalli_3']) { MERCAN_K.add(k); P[k] && P[k].traverse(m => { if (m.isMesh) [].concat(m.material).forEach(mt => { mt.userData.mercan = true; }); }); }
    /* yeni koloniler: resif sağlıklıyken zamanla birer birer belirir ve büyür */
    { let s2 = 4241; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < KOL_MAX; i++) { const k = mercanlar[Math.floor(r2() * mercanlar.length)], x = (r2() - 0.5) * VW * 0.95, z = -0.6 - r2() * 5.5;
        const o = P[k].clone(true); const sc = k.startsWith('masa') ? 0.55 : k.startsWith('yelpaze') ? 1 : 0.8; o.userData.s0 = sc; o.rotation.y = r2() * 6.28; o.position.set(x, zeminY(x, z) - 0.04, z); o.visible = false; ORTAM.add(o); KOLONI3.push(o); } }
    for (let i = 0; i < Math.round(VW * 3) + 10; i++) { const k = mercanlar[Math.floor(r() * mercanlar.length)], z = ara(-10, -1.4); koy(k, ara(-yarim, yarim), z, (k.startsWith('yelpaze') ? ara(0.8, 1.4) : k.startsWith('masa') ? ara(0.45, 0.8) : ara(0.5, 1.1)) * (z > -3 ? 0.65 : 1), k.startsWith('yelpaze') ? ara(-0.4, 0.4) : r() * 6.28); }
    for (let i = 0; i < 14; i++) { const k = mercanlar[Math.floor(r() * mercanlar.length)]; koy(k, magX - 1.8 * ds + ara(-7, 7) * ds, ara(-8, -2) * ds, ara(0.45, 0.9) * ds * 1.4, r() * 6.28, true); }
    const cok = KAL[kalite].cok || 1;
    /* sol tepecik: iri kayalardan bir resif tümseği, üstü ve eteği mercan dolu */
    const SOL = new THREE.Group(); ORTAM.add(SOL);
    const solX = -yarim + 3 + VW * 0.12;
    for (let i = 0; i < 9; i++) {
      const ust = i >= 6, o = P[kayalar[i % 4]].clone(true), sc = ust ? ara(1.3, 1.9) : ara(2, 3.2) * (i < 2 ? 1.2 : 1);
      o.scale.set(sc, sc * (ust ? ara(1.1, 1.5) : ara(0.9, 1.3)), sc); o.rotation.y = r() * 6.28;
      o.position.set(solX + ara(-3, 3) * (ust ? 0.6 : 1), zeminY(solX, -5) - 0.2 * sc + (ust ? ara(0.9, 1.4) : 0), ara(-7.5, -3.5)); SOL.add(o);
    }
    SOL.updateMatrixWorld(true);
    engelKur([DUVAR, SOL], -yarim - 1, yarim + 1, -13, 3);
    TUNEL = { x: magX, y: -0.05 + 0.4 * ds, z: -0.1 * ds, rx: 1.5 * ds, ry: 2.2 * ds, rz: 4.2 * ds };
    for (let i = 0; i < Math.round(34 * cok); i++) { const k = mercanlar[Math.floor(r() * mercanlar.length)]; koy(k, solX + ara(-4.5, 4.5), ara(-8.5, -3), (k.startsWith('masa') ? ara(0.5, 0.8) : k.startsWith('yelpaze') ? ara(1, 1.5) : ara(0.7, 1.2)), k.startsWith('yelpaze') ? ara(-0.5, 0.5) : r() * 6.28, SOL); }
    for (let i = 0; i < Math.round(26 * cok); i++) { const k = mercanlar[Math.floor(r() * mercanlar.length)], z = ara(-7, -1.5); koy(k, solX + ara(-6, 6.5), z, ara(0.5, 1.05) * (z > -3 ? 0.7 : 1), k.startsWith('yelpaze') ? ara(-0.4, 0.4) : r() * 6.28); }
    for (let i = 0; i < 3; i++) koy(i % 2 ? 'anemon_0' : 'anemon_1', solX + ara(-5, 5), ara(-3.5, -1.7), ara(0.9, 1.2), r() * 6);
    /* derinlik: arka planda sise gömülen ikinci bir resif sırtı ve sık mercan bahçeleri */
    const ARKA = P.duvar.clone(true); const as = ds * 1.7; ARKA.scale.set(as, as * 0.85, as); ARKA.position.set(-VW * 0.18, -0.3, -19); ARKA.rotation.y = 0.25; ORTAM.add(ARKA); ARKA.updateMatrixWorld(true);
    for (let i = 0; i < Math.round(30 * cok); i++) { const k = mercanlar[Math.floor(r() * mercanlar.length)]; koy(k, -VW * 0.18 + ara(-11, 11) * as, -19 + ara(-5, 4) * as, ara(0.6, 1.2) * as * 1.3, r() * 6.28, ARKA); }
    for (let i = 0; i < Math.round(VW / 2.5); i++) koy(kayalar[i % 4], ara(-yarim - 4, yarim + 4), ara(-20, -11), ara(1.2, 2.6), r() * 6.28);
    for (let i = 0; i < Math.round((VW * 2.2 + 14) * cok); i++) { const k = mercanlar[Math.floor(r() * mercanlar.length)]; koy(k, ara(-yarim - 5, yarim + 5), ara(-21, -10), (k.startsWith('masa') ? ara(0.6, 1.1) : ara(0.9, 1.7)), k.startsWith('yelpaze') ? ara(-0.5, 0.5) : r() * 6.28); }
    for (let i = 0; i < Math.max(2, Math.round(VW / 7)); i++) koy(i % 2 ? 'anemon_1' : 'anemon_0', ara(-yarim + 2, yarim - 2), ara(-4, -1.6), ara(0.9, 1.2), r() * 6);
    CAYIR3 = cayir(Math.round(VW * 9), [-yarim, yarim, 0.6, 4], 0.55, 0.022, '#3f7a2e', '#9bc45a', 7); ORTAM.add(CAYIR3);
    YOSUN3 = cayir(Math.round(VW * 2.4), [-yarim, yarim, -13, -6], 4.2, 0.16, '#2f5a26', '#87a84a', 11); ORTAM.add(YOSUN3); bitkiSon = '';
    for (const h of HUZME) h.position.set(-VW / 2 + h.userData.ux * VW + (Math.random() - 0.5), 6, -9 + Math.random() * 7);
  }

  /* ---------- balıklar: 2D oyundaki her balığın 3D karşılığı ---------- */
  const BAL = new Map();
  function balikYap(tur) {
    const kaynak = B[ESLE[tur] || 'sardalya'] || B.sardalya;
    const o = kaynak.clone(true); o.position.set(0, 0, 0);
    const yuz = { faz: { value: 0 }, genlik: { value: 1 } };
    malzHazirla(o, () => ({ yuz }));
    const g = new THREE.Group(); g.add(o); sahne.add(g);
    /* modelin boyutları: kuma gömülmesin diye en alt noktası ve yarım boyu */
    const kutu = new THREE.Box3().setFromObject(o), bo = kutu.getSize(new THREE.Vector3());
    return { g, yuz, tur, yaw: null, pit: 0, alt: Math.max(0.05, -kutu.min.y, kutu.max.y, bo.y / 2), yarim: Math.max(bo.x, bo.z) / 2 };
  }

  /* ziyaretçiler için hazır balık modelinden renklendirilmiş kopya */
  function balikKlon(k, ton) {
    const o = (B[k] || B.sardalya).clone(true); o.position.set(0, 0, 0); const yuz = { faz: { value: 0 }, genlik: { value: 1 } };
    malzHazirla(o, () => ({ yuz }));
    if (ton) { const c = new THREE.Color(ton); o.traverse(m => { if (m.isMesh) [].concat(m.material).forEach(mt => { if (mt.name !== 'goz') mt.color.multiply(c); }); }); }
    return { o, yuz };
  }
  const YZN = new Map(); let INS3 = null;
  /* parçacıklar: 0 kabarcık (halka, parlak kenar), 1 yem (dolu kahve), 2 plankton (yumuşak parıltı), 3 altın kabarcık, 4 altın plankton */
  const PMAX = 600, pPos = new Float32Array(PMAX * 3), pBoy = new Float32Array(PMAX), pTur = new Float32Array(PMAX);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('aBoy', new THREE.BufferAttribute(pBoy, 1)); pGeo.setAttribute('aTur', new THREE.BufferAttribute(pTur, 1));
  const pMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uPR: { value: 1 }, uGece: { value: 0 } },
    vertexShader: 'attribute float aBoy; attribute float aTur; uniform float uPR; varying float vTur; void main(){ vTur = aTur; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aBoy * uPR * (aTur > 1.5 && aTur != 3.0 ? 5.6 : 2.4); }',
    fragmentShader: `varying float vTur; uniform float uGece; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q); if (r > 1.0) discard; vec4 c;
      if (vTur < 0.5 || abs(vTur - 3.0) < 0.5) { /* kabarcık: ince parlak kenar, içi hafif, üstte ışık lekesi */
        vec3 k = abs(vTur - 3.0) < 0.5 ? vec3(1.0, 0.85, 0.35) : vec3(0.92, 0.98, 1.0); float kenar = smoothstep(0.62, 0.9, r) * (1.0 - smoothstep(0.9, 1.0, r)); float lek = smoothstep(0.35, 0.0, length(q - vec2(-0.35, 0.4)));
        c = vec4(k, kenar * 0.75 + lek * 0.7 + 0.06); }
      else if (vTur < 1.5) { float a = 1.0 - smoothstep(0.75, 1.0, r); vec3 k = mix(vec3(0.9, 0.62, 0.33), vec3(1.0, 0.85, 0.6), smoothstep(0.6, -0.4, q.x + q.y)); c = vec4(k, a); }
      else { float a = exp(-r * r * 4.0); vec3 k = vTur > 3.5 ? vec3(1.0, 0.86, 0.38) : vec3(0.62, 1.0, 0.9); c = vec4(k * (1.0 + uGece * 0.6), a * (0.85 + uGece * 0.3)); }
      gl_FragColor = c; }` });
  const PNOK = new THREE.Points(pGeo, pMat); PNOK.frustumCulled = false; PNOK.renderOrder = 5; sahne.add(PNOK);

  /* ---------- son işlem ---------- */
  const komp = new EffectComposer(R);
  komp.addPass(new RenderPass(sahne, kam));
  const huzmePass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uGunes: { value: new THREE.Vector2(0.55, 1.3) }, uGuc: { value: 0.55 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uGunes; uniform float uGuc; varying vec2 vUv;
      void main(){ vec3 taban = texture2D(tDiffuse, vUv).rgb; vec2 d = (vUv - uGunes) * (0.9 / 48.0); vec2 uv = vUv; float ag = 1.0; vec3 top = vec3(0.0);
        for (int i = 0; i < 48; i++) { uv -= d; vec3 s = texture2D(tDiffuse, clamp(uv, 0.001, 0.999)).rgb; float l = max(0.0, dot(s, vec3(0.3, 0.59, 0.11)) - 0.62); top += l * ag; ag *= 0.955; }
        gl_FragColor = vec4(taban + top * uGuc * 0.06 * vec3(0.85, 0.97, 1.0), 1.0); }`
  });
  komp.addPass(huzmePass);
  komp.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.55, 0.86));
  komp.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); c.rgb = mix(vec3(l), c.rgb, 1.2);
        c.rgb = (c.rgb - 0.18) * 1.06 + 0.18; float v = smoothstep(0.95, 0.25, length((vUv - 0.5) * vec2(1.15, 1.0))); c.rgb *= mix(0.72, 1.0, v);
        c.rgb *= mix(vec3(0.9, 1.0, 1.05), vec3(1.04, 1.02, 0.98), smoothstep(0.0, 1.0, vUv.y)); gl_FragColor = c; }`
  }));
  komp.addPass(new OutputPass());

  /* ---------- ekran ↔ dünya ---------- */
  const M = { W: 1, H: 1, kumY: 1, k: 0.01, Hc: 1, VW: 20, magX: 0 };
  const D = 14;
  function boyut(W, H, kumY, magara) {
    const dpr = Math.max(0.6, Math.min(devicePixelRatio || 1, KAL[kalite].dpr) * dprCarp);
    R.setPixelRatio(dpr); R.setSize(W, H, false); komp.setPixelRatio(dpr); komp.setSize(W, H);
    kam.aspect = W / H; const yatay = (W / H < 0.9 ? 62 : 72) * Math.PI / 180;
    kam.fov = THREE.MathUtils.clamp(2 * Math.atan(Math.tan(yatay / 2) / kam.aspect) * 180 / Math.PI, 36, 92); kam.updateProjectionMatrix();
    const f = (H / 2) / Math.tan(kam.fov * Math.PI / 360), k = D / f, Hc = (kumY - H / 2) * k;
    kam.position.set(0, Hc, D); kam.lookAt(0, Hc, 0);
    const VW = W * k, magX = magara ? (magara.x - W / 2) * k : VW * 0.37;
    const yeniden = Math.abs(VW - M.VW) > 0.5 || Math.abs(magX - M.magX) > 0.3 || !DUVAR;
    Object.assign(M, { W, H, kumY, k, Hc, VW, magX });
    yuzey.position.y = Hc + (H / 2) * k + 0.6;
    if (yeniden) ortamKur(VW, magX);
  }
  let berrakP = 0.8, gunesAci = { x: 18, sic: 0, yuk: 1 };
  const CAN = new Map(), MERCAN_K = new Set(), KOL_MAX = 24; let MERCAN3 = [], KOLONI3 = [], ekoSon = '';
  const dunya = (x, y) => new THREE.Vector3((x - M.W / 2) * M.k, M.Hc + (M.H / 2 - y) * M.k, 0);

  function kaliteUygula() {
    const K = KAL[kalite]; R.shadowMap.enabled = K.golge; gunes.shadow.mapSize.set(K.sm, K.sm); if (gunes.shadow.map) { gunes.shadow.map.dispose(); gunes.shadow.map = null; }
    parcaKur(); sahne.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
    boyut(M.W, M.H, M.kumY, { x: M.magX / M.k + M.W / 2 });
  }

  const FG = { n: 0, t0: 0, son: 60, yavas: 0, hizli: 0, ust: null, degisti: null };
  const gecici = new THREE.Vector3(), eul = new THREE.Euler(0, 0, 0, 'YXZ'), gunesUzak = new THREE.Vector3(), tmp = new THREE.Color();
  let gecePay = 0;
  const api = {
    boyut,
    kalite: () => kalite, degisince: f => { FG.degisti = f; },
    /* sıra: Otomatik → Pil dostu → Düşük → Orta → Yüksek → Otomatik */
    kaliteDegis() {
      if (oto) { oto = false; kalite = 'tasarruf'; } else if (kalite === 'yuksek') { oto = true; kalite = cihaz.seviye; } else kalite = { tasarruf: 'dusuk', dusuk: 'orta', orta: 'yuksek' }[kalite];
      dprCarp = 1; FG.ust = null; kaliteUygula(); return oto ? 'oto' : kalite;
    },
    oto: () => oto, cihaz: () => cihaz, fps: () => FG.son,
    kare(dt, d) {
      U.zaman.value += dt; const t = U.zaman.value;
      /* KARE HIZI YÖNETİCİSİ (otomatikte): 2 saniyelik pencerelerde ölçer; yavaşsa önce çözünürlüğü kısar, sonra seviyeyi indirir;
         uzun süre rahatsa bir basamak çıkar ama yakın zamanda zorlandığı seviyenin üstüne çıkmaz */
      { const simd = performance.now(); FG.n++; if (!FG.t0) FG.t0 = simd;
        if (simd - FG.t0 > 2000) { const f = FG.n * 1000 / (simd - FG.t0); FG.son = f; FG.n = 0; FG.t0 = simd;
          if (oto && !document.hidden) {
            const sira = ['tasarruf', 'dusuk', 'orta', 'yuksek'], i = sira.indexOf(kalite);
            if (f < 40) { FG.yavas++; FG.hizli = 0; } else if (f > 56) { FG.hizli++; FG.yavas = 0; } else { FG.yavas = 0; FG.hizli = 0; }
            if (FG.yavas >= 2) { FG.yavas = 0; if (dprCarp > 0.72) { dprCarp = Math.max(0.7, dprCarp - 0.15); boyut(M.W, M.H, M.kumY, { x: M.magX / M.k + M.W / 2 }); } else if (i > 0) { FG.ust = { s: kalite, t: simd }; kalite = sira[i - 1]; dprCarp = 1; kaliteUygula(); FG.degisti && FG.degisti(); } }
            else if (FG.hizli >= 6) { FG.hizli = 0;
              if (dprCarp < 1) { dprCarp = Math.min(1, dprCarp + 0.15); boyut(M.W, M.H, M.kumY, { x: M.magX / M.k + M.W / 2 }); }
              else if (i < sira.length - 1 && i < sira.indexOf(cihaz.seviye) + 1 && !(FG.ust && sira.indexOf(FG.ust.s) <= i + 1 && simd - FG.ust.t < 90000)) { kalite = sira[i + 1]; kaliteUygula(); FG.degisti && FG.degisti(); } }
          } } }
      /* gece ve hava: ışık, sis ve renkler */
      gecePay += ((d.gece || 0) - gecePay) * Math.min(1, dt * 0.5);
      const g = gecePay, isik = d.isik == null ? 1 : d.isik;
      /* güneşin günlük yolu: sabah soldan alçak ve turuncu, öğlen tepeden beyaz, akşam sağdan alçak ve kızıl */
      { const sa = d.saat == null ? 12 : d.saat, u = THREE.MathUtils.clamp((sa - 6) / 12, 0, 1), yuk = Math.sin(Math.PI * u);
        gunes.position.set(-30 + u * 60, 18 + yuk * 42, 14).normalize().multiplyScalar(32); const sic = 1 - THREE.MathUtils.smoothstep(yuk, 0.15, 0.6);
        gunes.color.set('#ffffff').lerp(tmp.set('#ffae6a'), sic * 0.85); gunesAci = { x: -30 + u * 60, sic, yuk }; }
      gunes.intensity = 3.3 * (1 - 0.85 * g) * Math.min(1.35, isik) * (0.55 + 0.45 * gunesAci.yuk); ay.intensity = 0.9 * g; hemi.intensity = 1.15 * (1 - 0.6 * g) * (0.75 + 0.25 * Math.min(1.2, isik));
      U.kostikGuc.value = KAL[kalite].kostik * (1 - 0.85 * g) * Math.min(1.35, isik);
      SIS.copy(SIS_G).lerp(SIS_N, g * 0.85);
      /* su berraklığı: yaz berrak (sis seyrek), plankton yeşili ya da fırtına kumu bulanıklaştırır */
      { const br = d.eko && d.eko.berrak != null ? d.eko.berrak : 0.8; berrakP += (br - berrakP) * Math.min(1, dt * 0.6);
        sahne.fog.density = 0.04 * (0.42 + (1 - berrakP) * 1.9); /* berrak suda uzak resif de seçilir */
        SIS.lerp(tmp.set(d.eko && d.eko.bulanNeden === 'kum' ? '#8c8a6c' : '#4f8a66'), Math.max(0, 0.8 - berrakP) * 0.9); }
      sahne.fog.color.copy(SIS);
      kubbeMat.uniforms.uUst.value.copy(RENK.ust).lerp(tmp.set('#24486e'), g * 0.85); kubbeMat.uniforms.uOrta.value.copy(SIS); kubbeMat.uniforms.uAlt.value.copy(RENK.alt).lerp(SIS_N, g);
      R.toneMappingExposure = 1.12 * (1 - 0.25 * g);
      for (const h of HUZME) { h.material.uniforms.uGuc.value = 0.11 * (1 - g) * Math.min(1.3, isik); h.scale.x = 0.75 + 0.35 * Math.sin(t * h.userData.v + h.userData.f); h.lookAt(kam.position.x, h.position.y, kam.position.z); h.rotateZ(h.userData.a + Math.sin(t * 0.07 + h.userData.f) * 0.04); }
      yuzeyDoku.offset.set(t * 0.01, t * 0.007);
      { const dz = d.deniz == null ? 0.2 : d.deniz; DZ.uT.value = t; DZ.uD.value = dz; DZ.uQ.value = 0.35 + dz * 0.45; DZ.uA.value = Math.max(0.02, (d.dalgaA || 4) * M.k * 0.7);
        yuzeyMat.opacity = 0.2 + dz * 0.12; if (d.sy != null) yuzey.position.y = M.Hc + (M.H / 2 - d.sy) * M.k; }
      if (PARCA) { const a = PARCA.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * 0.05, x = a.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.03 + dt * 0.04 * (d.akinti || 1); if (y > 14) y = 0; if (x > 20) x = -20; a.setY(i, y); a.setX(i, x); } a.needsUpdate = true; }
      /* balıklar */
      /* ekosistem: beyazlama, büyüme ve yeni koloniler */
      if (d.eko) {
        const e = d.eko; U.agar.value += (e.beyaz * 0.85 - U.agar.value) * Math.min(1, dt * 2);
        if (e.gun != null) { const bk = (e.gun * 40).toFixed(0) + '|' + e.cayir.toFixed(2) + '|' + e.yosun.toFixed(2); /* günün 1/40'ında bir güncelle */
          if (bk !== bitkiSon && performance.now() - (bitkiT || 0) > 250) { bitkiSon = bk; bitkiT = performance.now(); bitkiGuncelle(CAYIR3, e.gun, e.cayir, [5, 13]); bitkiGuncelle(YOSUN3, e.gun, e.yosun, [10, 24]); } }
        const anah = e.buyume.toFixed(2) + '|' + e.koloni + '|' + MERCAN3.length;
        if (anah !== ekoSon) { ekoSon = anah; const bf = 0.85 + 0.3 * e.buyume;
          for (const o of MERCAN3) o.scale.setScalar(o.userData.s0 * bf);
          KOLONI3.forEach((o, i) => { o.visible = i < e.koloni; if (o.visible) o.scale.setScalar(o.userData.s0 * bf * (0.35 + 0.65 * Math.min(1, (e.koloni - i) * 0.25))); }); }
      }
      /* kum canlıları: konum ve davranış 2D oyundan gelir, burada 3D model olarak çizilir */
      if (d.canlilar) {
        const gor = new Set();
        for (const o of d.canlilar) {
          gor.add(o.id); let c = CAN.get(o.id);
          if (!c || c.tur !== o.tur) { if (c) sahne.remove(c.g); c = { tur: o.tur, g: canliUret(o.tur, m => yama(m, {}), o) }; sahne.add(c.g); CAN.set(o.id, c); }
          const p = dunya(o.x, o.y), sc = Math.max(0.02, (o.s || 10) * M.k);
          if (o.zemin) p.y = zeminY(p.x, 0); c.g.position.copy(p); c.g.scale.setScalar(sc);
          c.g.rotation.y = o.tur === 'yengec' ? -Math.PI / 2 + (o.d || 1) * 0.25 : o.tur === 'yildiz' || o.tur === 'istiridye' ? 0 : (o.d || 1) > 0 ? -0.45 : Math.PI + 0.45;
          if (o.tur === 'istiridye') c.g.scale.setScalar(sc * (o.nab || 1));
          canliOyna(c.g, o.tur, o, t); c.g.visible = !o.gizli;
        }
        for (const [id, c] of CAN) if (!gor.has(id)) { sahne.remove(c.g); CAN.delete(id); }
      }
      /* yüzen canlılar, geçen ziyaretçiler ve top */
      if (d.yuzenler) {
        const gor = new Set();
        for (const o of d.yuzenler) {
          gor.add(o.id); let c = YZN.get(o.id);
          if (!c) { c = { g: yuzenUret(o.tur, (m, ek) => yama(m, ek || {}), balikKlon, o), yaw: null }; sahne.add(c.g); YZN.set(o.id, c); }
          let p = dunya(o.x, o.y), sc = Math.max(0.02, o.s * M.k);
          if (o.z != null) { /* derinliği olan küçük sürü balıkları: ekrandaki yeri aynı, kamera ışını boyunca kendi derinliğinde; kayaya ve resife gömülmez */
            const p0 = p.clone(); let z = derZ(p0, o.z, sc); z = kayaZ(p0, z, sc * 0.22, sc * 0.42);
            c.zs = c.zs == null ? z : c.zs + (z - c.zs) * Math.min(1, dt * (z > c.zs ? 6 : 1.5)); if (z > c.zs + 0.6) c.zs = z - 0.6;
            p = isinda(p0, c.zs); const taban = zeminY(p.x, p.z) + sc * 0.25; if (p.y < taban) p.y = taban; }
          if (o.arka || o.uzak) { const z = o.uzak ? -16 : -12, k2 = (kam.position.z - z) / kam.position.z; p = kam.position.clone().add(p.sub(kam.position).multiplyScalar(k2)); sc *= k2 * (o.uzak ? 0.75 : 1); }
          /* derinlikte çapraz geçiş: köpekbalığı uzaktan gelip kameranın yanından geçer; ziyaretçiler de kendi derinlik yolunu izler.
             Ekrandaki yeri 2D ile aynı kalır, kamera ışını boyunca ileri-geri gider; yönü gerçek 3D hareketinden hesaplanır. */
          const yol = o.id === 'yirtici' ? [-10, 2.6] : (o.id.startsWith('gz') && !o.arka) ? (() => { const h = [...o.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7); return [-7 + (h % 70) / 10, -7 + ((h >> 3) % 85) / 10]; })() : null;
          let hedef = o.tur === 'top' ? 0 : o.d > 0 ? -0.35 : Math.PI + 0.35;
          if (yol) {
            const u = THREE.MathUtils.clamp(o.d > 0 ? (o.x + o.s) / (M.W + 2 * o.s) : (M.W + o.s - o.x) / (M.W + 2 * o.s), 0, 1), z = yol[0] + (yol[1] - yol[0]) * (u * u * (3 - 2 * u));
            const k2 = (kam.position.z - z) / kam.position.z; p = kam.position.clone().add(p.sub(kam.position).multiplyScalar(k2));
            const taban = zeminY(p.x, p.z) + sc * 0.3; if (p.y < taban) p.y = taban;
            if (c.onceki) { const vx = p.x - c.onceki.x, vz = p.z - c.onceki.z; if (Math.hypot(vx, vz) > 1e-4) hedef = Math.atan2(-vz, vx); }
            c.onceki = p.clone();
          }
          c.g.position.copy(p); c.g.scale.setScalar(sc);
          if (c.yaw != null) { let dy = hedef - c.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; hedef = c.yaw + dy; }
          c.yaw = c.yaw == null ? hedef : c.yaw + (hedef - c.yaw) * Math.min(1, dt * 3);
          c.g.rotation.set(o.tur === 'top' ? 0.3 : 0, c.yaw, o.tur === 'top' ? -o.don : 0);
          yuzenOyna(c.g, o.tur, o, t);
          if (o.sak != null) { /* orfoz oyuğunda: gövde gölgede kararır */ const k = 1 - Math.min(1, o.sak) * 0.7; if (c.sakK !== k) { c.sakK = k; c.g.traverse(m => { if (!m.isMesh || !m.material || !m.material.color) return; const ms = Array.isArray(m.material) ? m.material : [m.material]; for (const mt of ms) { if (!mt.userData.renk0) mt.userData.renk0 = mt.color.clone(); mt.color.copy(mt.userData.renk0).multiplyScalar(k); } }); } }
        }
        for (const [id, c] of YZN) if (!gor.has(id)) { sahne.remove(c.g); YZN.delete(id); }
      }
      /* kabarcık, yem ve plankton: 2D'deki yerlerinde 3D parçacık olarak */
      if (d.parca) { const L = d.parca, n = Math.min(PMAX, L.length / 4);
        for (let i = 0; i < n; i++) { const p = dunya(L[i * 4], L[i * 4 + 1]); pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.y; pPos[i * 3 + 2] = 0.3; pBoy[i] = L[i * 4 + 2]; pTur[i] = L[i * 4 + 3]; }
        pGeo.setDrawRange(0, n); pGeo.attributes.position.needsUpdate = true; pGeo.attributes.aBoy.needsUpdate = true; pGeo.attributes.aTur.needsUpdate = true; pMat.uniforms.uPR.value = R.getPixelRatio(); pMat.uniforms.uGece.value = gecePay; }
      /* yüzeyden gelenler: tekneler, dalgıçlar, denizaltı, robot */
      { const o = d.insan;
        if (!o) { if (INS3) { sahne.remove(INS3.g); INS3 = null; } }
        else {
          if (!INS3 || INS3.id !== o.id) { if (INS3) sahne.remove(INS3.g); INS3 = { id: o.id, g: insanUret(o.tur, m => yama(m, {}), o.ce || {}) }; sahne.add(INS3.g); }
          const g = INS3.g; g.position.copy(dunya(o.x, o.y)); g.scale.setScalar(Math.max(0.05, o.boy * M.k));
          if (o.tur === 'serbest') g.rotation.set(0, -0.25, -o.a);
          else g.rotation.set(0, o.d > 0 ? -0.3 : Math.PI + 0.3, -o.egim * o.d);
          insanOyna(g, o.tur, o, t);
        } }
      const gorulen = new Set();
      for (const b of d.baliklar) {
        gorulen.add(b.id);
        let f = BAL.get(b.id);
        if (f && f.tur !== b.tur) { sahne.remove(f.g); BAL.delete(b.id); f = null; }
        if (!f) { f = balikYap(b.tur); BAL.set(b.id, f); }
        const dans = b.dans;
        const p0 = dunya(b.x, b.y + (dans ? dans.oy : 0));
        const s = Math.max(0.05, b.L * M.k * (b.tur === 'yavru' ? 0.9 : 1)); f.g.scale.setScalar(s);
        /* derinlik: ekrandaki yeri aynı kalır, kamera ışını boyunca yaklaşır ya da uzaklaşır (uzakta küçük ve sisli görünür) */
        let zt = b.der ? derZ(p0, b.der > 0 ? b.der * 5 : b.der * 11, s) : 0;
        zt = kayaZ(p0, zt, s * f.alt * 1.05, s * f.yarim * 0.75);
        f.zs = f.zs == null ? zt : f.zs + (zt - f.zs) * Math.min(1, dt * (zt > f.zs ? 6 : 1.5));
        if (zt > f.zs + 0.6) f.zs = zt - 0.6; /* kayanın içinden geçerek gelmesin */
        const p = isinda(p0, f.zs);
        /* kuma gömülmesin: gövdenin en alt noktası (eğim ve kıvrılma payıyla) zeminin biraz üstünde kalır */
        const taban = zeminY(p.x, p.z) + s * (f.alt * 1.1 + f.yarim * Math.abs(Math.sin(f.pit)) + 0.04);
        const yakin = THREE.MathUtils.clamp((p.y - taban) / (s * f.alt * 2 + 0.01), 0, 1);
        if (p.y < taban) p.y = taban;
        f.g.position.copy(p);
        const hedefYaw = b.yon > 0 ? -0.32 : Math.PI + 0.32;
        if (f.yaw == null) f.yaw = hedefYaw;
        let dy = hedefYaw - f.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
        f.yaw += dy * Math.min(1, dt * 5);
        const hiz = Math.hypot(b.vx || 0, b.vy || 0);
        let pit = THREE.MathUtils.clamp(-(b.vy || 0) / (hiz + 25), -0.45, 0.45);
        if ((b.vy || 0) > 0) pit *= yakin; /* zemine yaklaşınca burnunu kuma doğru eğmesin */
        f.pit += (pit - f.pit) * Math.min(1, dt * 3);
        /* dön, takla, zıpla */
        let ey = f.yaw, ez = f.pit;
        if (dans) { const yu = Math.sin(dans.p * Math.PI); if (dans.tip === 0) ey += dans.p * Math.PI * 4; else if (dans.tip === 1) ez += dans.p * Math.PI * 2; else ez += 0.45 * yu; }
        eul.set(-dy * 0.4, ey, ez); f.g.quaternion.setFromEuler(eul);
        f.yuz.faz.value = b.faz; f.yuz.genlik.value = b.uyku ? 0.25 : 0.7 + Math.min(1, hiz / 90);
        f.g.visible = true;
      }
      for (const [id, f] of BAL) if (!gorulen.has(id)) { sahne.remove(f.g); BAL.delete(id); }
      if (KAL[kalite].post) { gunesUzak.set(kam.position.x + gunesAci.x * 0.6, 60, kam.position.z - 30).project(kam); huzmePass.uniforms.uGunes.value.set(gunesUzak.x * 0.5 + 0.5, Math.min(1.6, gunesUzak.y * 0.5 + 0.5)); huzmePass.uniforms.uGuc.value = 0.55 * (1 - g); komp.render(); }
      else R.render(sahne, kam);
    },
    /* fotoğraf için: hemen yeniden çiz ve tuvali döndür (çizim tamponu aynı görevde okunabilir) */
    anlik() { if (KAL[kalite].post) komp.render(); else R.render(sahne, kam); return R.domElement; },
    kapat() { R.dispose(); }
  };
  kaliteUygula();
  return api;
}
