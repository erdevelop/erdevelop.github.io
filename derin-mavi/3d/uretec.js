/* Derin Mavi 3D — yordamsal (kodla üretilen) mercanlar ve kum canlıları.
   Mercanlar: geyik boynuzu (Acropora), gorgon çalısı, parmak/sütun mercan, deniz kırbacı, karanfil
   yumuşak mercan (Dendronephthya). Her tür birkaç renk ve biçim çeşidiyle üretilir; köşe renkleri
   dipten uca geçer. Canlılar: deniz yıldızı, deniz salyangozu, keşiş yengeç, ahtapot, karides,
   dikenli vatoz, yengeç ve sürpriz istiridye. Hepsi 2D oyundaki "s" birimiyle (1 = 2D çizimdeki s)
   kurulur; sahne bunları s · piksel→dünya oranıyla büyütür. Model +x yönüne bakar, zemin y = 0. */
import * as THREE from './three.module.min.js';
import { mergeGeometries } from './addons/utils/BufferGeometryUtils.js';

const Y = new THREE.Vector3(0, 1, 0);
function rastgele(tohum) { let s = (tohum * 9301 + 49297) % 233280 || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

/* bir parçaya renk ve salınım öznitelikleri ekler (birleştirme için hepsinde aynı öznitelikler olmalı) */
function boya(g, renkFn, boyFn, faz) {
  const p = g.attributes.position, n = p.count;
  const c = new Float32Array(n * 3), b = new Float32Array(n), f = new Float32Array(n), v = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(p, i); renkFn(v, col); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; b[i] = boyFn(v); f[i] = faz; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aBoy', new THREE.BufferAttribute(b, 1)); g.setAttribute('aFaz', new THREE.BufferAttribute(f, 1));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
/* p0'dan p1'e uzanan, r0'dan r1'e incelen silindir */
function dal(p0, p1, r0, r1, seg = 7) {
  const d = new THREE.Vector3().subVectors(p1, p0), L = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, L, seg, 1, true);
  g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, d.normalize())); g.translate(p0.x, p0.y, p0.z);
  return g;
}
function top(p, r, seg = 7) { const g = new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)); g.translate(p.x, p.y, p.z); return g; }

export const MERCAN_RENK = {
  geyik: [['#7b4f8e', '#f3b6ff'], ['#3f6f9e', '#a9e6ff'], ['#8e6a3f', '#ffe08a'], ['#2f7d6b', '#a6ffd8'], ['#9a4f63', '#ffc1d0']],
  gorgon: [['#8a1f2c', '#ff6b5e'], ['#a3561c', '#ffb347'], ['#5b2a86', '#d18cff'], ['#a88a12', '#fff06a'], ['#6e1f4f', '#ff7fc8']],
  parmak: [['#7d6a3c', '#f2e3a0'], ['#4f7a3a', '#c8f08a'], ['#6e4a7a', '#e2b8ff'], ['#7a5236', '#ffcf9a']],
  kirbac: [['#7a1d1d', '#ff5a4a'], ['#8f7a10', '#ffe24d'], ['#4b2577', '#c88cff'], ['#a04a14', '#ff9a3c']],
  karanfil: [['#d8c9d2', '#ff4f8b'], ['#d6cfc2', '#ff7a3a'], ['#cfd2dc', '#a66bff'], ['#d9d2c8', '#ff3b5c'], ['#d3d8cf', '#ffd23f']],
  mantar: [['#6f9a48', '#e6ffa8'], ['#8a62a6', '#f8d8ff'], ['#3f8a9a', '#b8f6ff'], ['#a8743e', '#ffe0b0']],
  kabarcik: [['#a8a184', '#f6f1d8'], ['#8aa594', '#e9fff2'], ['#ab93a4', '#ffe9f6']],
  sutun: [['#7a6a48', '#efe2b0'], ['#68784c', '#d8f0a8'], ['#7a5a58', '#f6c8c0']],
  yaprak: [['#3f5a26', '#b8e07a'], ['#5e4428', '#f0c07a'], ['#24525e', '#7ae0f0'], ['#5a2c4a', '#f08ac8']],
  fici: [['#5e3022', '#c8704a'], ['#4a2e5e', '#b07ad0'], ['#6a5a30', '#d8c070']],
  deri: [['#8c7f55', '#f0e6b8'], ['#748466', '#dff0c8'], ['#94728a', '#ffd8ee']],
  kup: [['#8f3814', '#ffb030'], ['#861440', '#ff6aa0'], ['#7a6a10', '#ffe040']],
  kalem: [['#c8b8a0', '#ff9a5a'], ['#d8d0c0', '#ffe080'], ['#c0a8b8', '#f878c8']],
  tuy: [['#c8b8a8', '#ff4a6a'], ['#c0c8c8', '#ffd040'], ['#b8c0d0', '#7a5aff'], ['#c8c0b0', '#3ad0b8']],
  ipsun: [['#7a2a14', '#e8602a'], ['#4a2a6a', '#a86ae0'], ['#7a5a14', '#e8b030']],
  topsun: [['#5a4a1a', '#c8a83a'], ['#6a2a2a', '#d85a4a'], ['#3a4a5a', '#8ab0c8']],
  agac: [['#e8d8e0', '#ff3a8a'], ['#e8e0d0', '#ff8a2a'], ['#e0e0e8', '#c84aff'], ['#e8e8d8', '#ffd02a']],
  zoant: [['#3a5a3a', '#7aff9a'], ['#4a3a2a', '#ffa84a'], ['#2a3a5a', '#5ae0ff']]
};
/* yassı/geniş yeni türler: boya göre değil, genişliğe göre ölçeklenir */
const MERCAN_DUZ = new Set(['mantar', 'kabarcik', 'yaprak', 'kup', 'deri', 'topsun', 'zoant', 'tuy']);
/* dönen (lathe) bir profilden geometri; dalga: kenarı açıya göre oynatan işlev */
function cevir(profil, seg, dalga) {
  const g = new THREE.LatheGeometry(profil.map(([x, y]) => new THREE.Vector2(Math.max(0.001, x), y)), seg);
  if (dalga) { const p = g.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x), rr = Math.hypot(v.x, v.z); const [dr, dy] = dalga(a, rr, v.y); const k = rr > 1e-4 ? (rr + dr) / rr : 1; p.setXYZ(i, v.x * k, v.y + dy, v.z * k); } }
  return g.toNonIndexed();
}

/* tur: 'geyik' | 'gorgon' | 'parmak' | 'kirbac' | 'karanfil'; hepsi yaklaşık 1 birim boyda */
export function mercanUret(tur, tohum, renk) {
  const r = rastgele(tohum), ara = (a, b) => a + r() * (b - a), parca = [];
  const [ra, rb] = renk.map(h => new THREE.Color(h)), tmp = new THREE.Color();
  const renkY = (yMax, us = 1.6) => (v, col) => col.copy(ra).lerp(rb, Math.min(1, Math.pow(Math.max(0, v.y) / yMax, us)));
  const yon = (d, aci, don) => { const e = new THREE.Vector3(1, 0, 0).applyAxisAngle(Y, don); const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().crossVectors(d, e).normalize(), aci); return d.clone().applyQuaternion(q).normalize(); };
  let salin = false;
  if (tur === 'geyik' || tur === 'gorgon') {
    const kalin = tur === 'geyik', derinlik = kalin ? 4 : 5;
    const buyu = (p, d, L, rr, k) => {
      /* her dal iki parçalı, hafif kıvrık */
      const orta = p.clone().addScaledVector(yon(d, ara(-0.15, 0.15), r() * 6.28), L * 0.5), son = orta.clone().addScaledVector(yon(d, ara(-0.2, 0.2), r() * 6.28), L * 0.5);
      const r1 = rr * (kalin ? 0.72 : 0.62);
      parca.push(dal(p, orta, rr, (rr + r1) / 2), dal(orta, son, (rr + r1) / 2, r1), top(orta, (rr + r1) / 2 * 1.02, 6));
      if (k >= derinlik) { parca.push(top(son, r1 * (kalin ? 1.25 : 1.1), 6)); return; }
      parca.push(top(son, r1 * 1.02, 6));
      const n = kalin ? (r() < 0.6 ? 2 : 3) : (r() < 0.5 ? 2 : 3), yukari = d.clone().lerp(Y, kalin ? 0.35 : 0.15).normalize();
      for (let i = 0; i < n; i++) buyu(son, yon(yukari, ara(kalin ? 0.35 : 0.3, kalin ? 0.75 : 0.85), i * 6.28 / n + ara(-0.5, 0.5)), L * ara(0.68, 0.86), r1, k + 1);
    };
    const govde = kalin ? (r() < 0.5 ? 1 : 3) : 1;
    for (let i = 0; i < govde; i++) buyu(new THREE.Vector3(ara(-0.08, 0.08) * (govde > 1), 0, ara(-0.08, 0.08) * (govde > 1)), yon(Y, govde > 1 ? ara(0.2, 0.5) : ara(0, 0.15), i * 2.1), kalin ? 0.3 : 0.26, kalin ? 0.07 : 0.035, 1);
  } else if (tur === 'parmak') {
    const n = 7 + Math.floor(r() * 9);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, uz = Math.sqrt(r()) * 0.32, p0 = new THREE.Vector3(Math.cos(a) * uz, 0, Math.sin(a) * uz), h = ara(0.45, 1) * (1 - uz * 0.8), rr = ara(0.05, 0.085);
      const d = new THREE.Vector3(Math.cos(a) * uz * 0.8, 1, Math.sin(a) * uz * 0.8).normalize(), p1 = p0.clone().addScaledVector(d, h * 0.55), p2 = p1.clone().addScaledVector(yon(d, ara(0, 0.25), r() * 6.28), h * 0.45);
      parca.push(dal(p0, p1, rr * 1.15, rr, 8), dal(p1, p2, rr, rr * 0.92, 8), top(p1, rr, 7), top(p2, rr * 0.95, 8));
    }
  } else if (tur === 'kirbac') {
    salin = true; const n = 5 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      let p = new THREE.Vector3(ara(-0.06, 0.06), 0, ara(-0.06, 0.06)), d = yon(Y, ara(0.05, 0.4), r() * 6.28); const h = ara(0.7, 1.25), k = 6, rr = ara(0.012, 0.02), bk = ara(-0.25, 0.25);
      for (let j = 0; j < k; j++) { const q = p.clone().addScaledVector(d, h / k); parca.push(dal(p, q, rr * (1 - j / k * 0.6), rr * (1 - (j + 1) / k * 0.6), 5)); p = q; d = yon(d, bk * 0.35, 0.3 + j * 0.2); }
      parca.push(top(p, rr * 0.6, 4));
    }
  } else if (tur === 'karanfil') {
    salin = true;
    const buyu = (p, d, L, rr, k) => {
      const son = p.clone().addScaledVector(d, L); parca.push(dal(p, son, rr, rr * 0.75, 6), top(son, rr * 0.75, 5));
      if (k >= 3) { /* uçta renkli polip kümesi */
        for (let i = 0; i < 9; i++) { const a = r() * 6.28, b = r() * 1.3; parca.push(top(son.clone().add(new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.cos(b) * 0.8, Math.sin(a) * Math.sin(b)).multiplyScalar(0.06)), ara(0.028, 0.045), 5)); }
        return;
      }
      const n = 2 + Math.floor(r() * 2); for (let i = 0; i < n; i++) buyu(son, yon(d.clone().lerp(Y, 0.3).normalize(), ara(0.35, 0.8), i * 6.28 / n + r()), L * ara(0.6, 0.78), rr * 0.7, k + 1);
    };
    buyu(new THREE.Vector3(), Y.clone(), 0.42, 0.13, 1);
  }
  else if (tur === 'mantar') { /* mantar mercanı: kubbemsi disk, merkezden kenara ince ışınsal sırtlar; bazen 2-3 tanesi üst üste */
    const n = r() < 0.5 ? 1 : 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) { const rr = ara(0.28, 0.5), x = i ? ara(-0.35, 0.35) : 0, z = i ? ara(-0.35, 0.35) : 0, ex = ara(0.8, 1.25);
      const g = cevir([[0, 0.2], [rr * 0.25, 0.19], [rr * 0.6, 0.13], [rr * 0.9, 0.05], [rr, 0.015], [rr * 0.97, 0], [0, 0]], 64, (a, q) => [0, Math.max(0, Math.cos(a * 30)) * 0.03 * Math.min(1, q / rr * 1.5)]); g.scale(1, 1, ex); g.translate(x, 0, z); parca.push(g); }
  } else if (tur === 'kabarcik') { /* kabarcık mercanı: tümsek üstünde kümelenmiş, yarı saydam görünüşlü yuvarlak keseler */
    const n = 14 + Math.floor(r() * 12);
    for (let i = 0; i < n; i++) { const a = r() * 6.28, u = Math.sqrt(r()) * 0.42; const h = (1 - u / 0.42) * 0.28; parca.push(top(new THREE.Vector3(Math.cos(a) * u, 0.07 + h + ara(0, 0.06), Math.sin(a) * u), ara(0.07, 0.13), 9)); }
  } else if (tur === 'sutun') { /* sütun mercanı: dipten yükselen kalın, tepesi yuvarlak sütunlar */
    const n = 5 + Math.floor(r() * 7);
    for (let i = 0; i < n; i++) { const a = r() * 6.28, u = Math.sqrt(r()) * 0.3, p0 = new THREE.Vector3(Math.cos(a) * u, 0, Math.sin(a) * u), h = ara(0.45, 1), rr = ara(0.09, 0.15), p1 = p0.clone().add(new THREE.Vector3(ara(-0.05, 0.05), h, ara(-0.05, 0.05)));
      parca.push(dal(p0, p1, rr * 1.1, rr, 9), top(p1, rr, 9)); }
  } else if (tur === 'yaprak') { /* marul/tabak mercanı: dalgalı kenarlı, kat kat açılan ince yapraklar */
    const n = 4 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) { const rr = ara(0.22, 0.42), h0 = ara(0.02, 0.22), don = r() * 6.28, f = ara(4, 7);
      const g = cevir([[rr * 0.15, h0], [rr * 0.5, h0 + 0.05], [rr, h0 + 0.12], [rr * 1.02, h0 + 0.125], [rr * 0.52, h0 + 0.055], [rr * 0.16, h0 + 0.01]], 28, (a, q) => [0, Math.sin(a * f + don) * 0.05 * (q / rr) * (q / rr)]);
      g.rotateY(r() * 6.28); g.translate(ara(-0.18, 0.18), 0, ara(-0.18, 0.18)); parca.push(g); }
  } else if (tur === 'fici') { /* fıçı süngeri: içi oyuk, dikey sırtlı geniş vazo */
    const rr = ara(0.26, 0.36), h = ara(0.7, 1);
    parca.push(cevir([[0, 0], [rr * 0.7, 0.02], [rr, h * 0.35], [rr * 1.12, h * 0.8], [rr * 1.1, h], [rr * 0.88, h], [rr * 0.85, h * 0.8], [rr * 0.65, h * 0.35], [0, h * 0.2]], 36, (a) => [Math.max(0, Math.cos(a * 14)) * 0.025, 0]));
  } else if (tur === 'deri') { salin = true; /* deri (mantar şapkalı) mercan: kalın sap, dalgalı geniş şapka */
    const rr = ara(0.3, 0.45), h = ara(0.22, 0.35);
    parca.push(dal(new THREE.Vector3(), new THREE.Vector3(0, h, 0), 0.12, 0.09, 10));
    parca.push(cevir([[0, h + 0.06], [rr * 0.6, h + 0.05], [rr, h], [rr * 0.95, h - 0.03], [rr * 0.5, h - 0.01], [0.09, h - 0.02]], 36, (a, q) => [0, Math.sin(a * 5) * 0.05 * (q / rr)]));
  } else if (tur === 'kup') { /* fincan/tüp mercanı kümesi: kısa, ağzı açık borular; içlerinde polip */
    const n = 8 + Math.floor(r() * 10);
    for (let i = 0; i < n; i++) { const a = r() * 6.28, u = Math.sqrt(r()) * 0.32, p0 = new THREE.Vector3(Math.cos(a) * u, 0, Math.sin(a) * u), h = ara(0.12, 0.3), d = new THREE.Vector3(Math.cos(a) * u, 1, Math.sin(a) * u).normalize(), p1 = p0.clone().addScaledVector(d, h), rr = ara(0.035, 0.055);
      parca.push(dal(p0, p1, rr * 0.8, rr * 1.15, 9), top(p1.clone().addScaledVector(d, -0.01), rr * 0.95, 8)); }
  }
  else if (tur === 'kalem') { salin = true; /* deniz kalemi: kumdan çıkan sapın üstünde tüy gibi dizili yaprakçıklar */
    const h = ara(0.75, 1), p0 = new THREE.Vector3(), p1 = new THREE.Vector3(ara(-0.05, 0.05), h, ara(-0.05, 0.05)); parca.push(dal(p0, p1, 0.035, 0.02, 7));
    const n = 16; for (let i = 0; i < n; i++) { const u = 0.3 + 0.65 * i / n, p = p0.clone().lerp(p1, u), uz = 0.16 * Math.sin(Math.PI * (i + 1) / (n + 1)) + 0.04;
      for (const yan of [-1, 1]) { const q = p.clone().add(new THREE.Vector3(yan * uz, uz * 0.35, yan * uz * 0.2)); parca.push(dal(p, q, 0.018, 0.008, 4)); } }
  } else if (tur === 'tuy') { salin = true; /* tüy yıldızı solucanı: kumdan çıkan tüplerin ucunda sarmal, renkli dokunaç taçları */
    const n = 3 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) { const a = r() * 6.28, u = Math.sqrt(r()) * 0.3, p0 = new THREE.Vector3(Math.cos(a) * u, 0, Math.sin(a) * u), h = ara(0.06, 0.14), p1 = p0.clone().add(new THREE.Vector3(ara(-0.03, 0.03), h, ara(-0.03, 0.03)));
      parca.push(dal(p0, p1, 0.03, 0.026, 6)); const m = 22; for (let j = 0; j < m; j++) { const b = j / m * 6.28 * 1.6, rr = 0.06 + 0.08 * j / m, q = p1.clone().add(new THREE.Vector3(Math.cos(b) * rr, 0.06 + 0.1 * j / m, Math.sin(b) * rr)); parca.push(dal(p1, q, 0.009, 0.004, 3)); } }
  } else if (tur === 'ipsun') { /* halat süngeri: dipten kıvrılarak uzanan kalın, pürüzlü kollar */
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) { let p = new THREE.Vector3(ara(-0.1, 0.1), 0, ara(-0.1, 0.1)); const d = new THREE.Vector3(ara(-0.4, 0.4), 1, ara(-0.4, 0.4)).normalize(), rr = ara(0.04, 0.06);
      for (let k = 0; k < 6; k++) { const q = p.clone().addScaledVector(d, ara(0.13, 0.18)); d.x += ara(-0.3, 0.3); d.z += ara(-0.3, 0.3); d.normalize(); parca.push(dal(p, q, rr, rr * 0.95, 7), top(q, rr * 1.05, 7)); p = q; } }
  } else if (tur === 'topsun') { /* top süngeri: yumru yumru iri bir küre, üstünde birkaç delik */
    const g = new THREE.IcosahedronGeometry(0.4, 3), p = g.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + 0.12 * Math.sin(v.x * 18) * Math.sin(v.y * 16) * Math.sin(v.z * 17); v.multiplyScalar(k); p.setXYZ(i, v.x, v.y * 0.8 + 0.3, v.z); }
    parca.push(g.toNonIndexed());
  } else if (tur === 'agac') { salin = true; /* yumuşak ağaç mercanı (Dendronephthya): şeffaf dallarda küme küme renkli polip topları */
    const kok = new THREE.Vector3(), govde = new THREE.Vector3(ara(-0.05, 0.05), 0.4, ara(-0.05, 0.05)); parca.push(dal(kok, govde, 0.09, 0.06, 8));
    for (let i = 0; i < 9; i++) { const a = i * 2.4 + r(), q = govde.clone().add(new THREE.Vector3(Math.cos(a) * ara(0.15, 0.3), ara(0.1, 0.5), Math.sin(a) * ara(0.15, 0.3))); parca.push(dal(govde, q, 0.04, 0.025, 6));
      for (let j = 0; j < 6; j++) parca.push(top(q.clone().add(new THREE.Vector3(ara(-0.08, 0.08), ara(-0.04, 0.08), ara(-0.08, 0.08))), ara(0.03, 0.05), 6)); }
  } else if (tur === 'zoant') { /* zoantid halısı: kayayı örten minik disk polipler */
    const n = 30 + Math.floor(r() * 25);
    for (let i = 0; i < n; i++) { const a = r() * 6.28, u = Math.sqrt(r()) * 0.45, p0 = new THREE.Vector3(Math.cos(a) * u, 0, Math.sin(a) * u), h = ara(0.03, 0.07), p1 = p0.clone().add(new THREE.Vector3(0, h, 0));
      parca.push(dal(p0, p1, 0.025, 0.028, 6)); const g = cevir([[0, 0.012], [0.03, 0.01], [0.045, 0]], 10); g.translate(p1.x, p1.y, p1.z); parca.push(g); }
  }
  const yMax = ({ kirbac: 1.2, mantar: 0.2, kabarcik: 0.42, yaprak: 0.32, deri: 0.42, kup: 0.3, tuy: 0.4, topsun: 0.62, zoant: 0.09, agac: 0.9, ipsun: 0.9 })[tur] || 1;
  const renkFn = tur === 'karanfil' ? ((v, col) => { const u = Math.min(1, Math.max(0, v.y) / 1.05); col.copy(ra).lerp(rb, Math.pow(u, 3) * 1.0); }) : renkY(yMax, tur === 'parmak' ? 2.2 : 1.5);
  const g = mergeGeometries(parca.map(p => boya(p.toNonIndexed ? p.toNonIndexed() : p, renkFn, v => Math.max(0, v.y) * (tur === 'kirbac' ? 0.35 : 0.12), r() * 6.28)));
  if (tur === 'karanfil') { /* polipler: üst bölgedeki küçük topları uç rengine boya */
    const c = g.attributes.color, p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0.62) { tmp.copy(rb).offsetHSL(0, 0, (Math.sin(i) * 0.06)); c.setXYZ(i, tmp.r, tmp.g, tmp.b); } }
  }
  g.computeVertexNormals(); g.computeBoundingBox();
  const bb = g.boundingBox, h = MERCAN_DUZ.has(tur) ? Math.max(bb.max.y, (bb.max.x - bb.min.x) * 0.5, (bb.max.z - bb.min.z) * 0.5) : (bb.max.y || 1); g.scale(1 / h, 1 / h, 1 / h);
  return { geo: g, salin };
}

/* ======================= kum canlıları ======================= */
function std(renk, ek = {}) { return Object.assign({ color: renk, roughness: 0.6, metalness: 0 }, ek); }
export function canliUret(tur, malz, o = {}) {
  const G = new THREE.Group(), M = (r, ek) => malz(new THREE.MeshStandardMaterial(std(r, ek))), A = {};
  const ekle = (geo, mat, ust = G) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; ust.add(m); return m; };
  const goz = (x, y, z, r, ust = G) => { const g = ekle(new THREE.SphereGeometry(r, 10, 8), M('#f5f5f0', { roughness: 0.2 }), ust); g.position.set(x, y, z); const b = ekle(new THREE.SphereGeometry(r * 0.55, 8, 6), M('#0b0b0b', { roughness: 0.1 }), ust); b.position.set(x + r * 0.5, y + r * 0.1, z + Math.sign(z || 1) * r * 0.2); return g; };
  switch (tur) {
    case 'yildiz': { /* beş kollu, kabarık; üstü kabarcık noktalı */
      const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 0.42 : 1, a = i * Math.PI / 5; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? sh.lineTo(x, y) : sh.moveTo(x, y); } sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.13, bevelSegments: 4, curveSegments: 4 });
      g.rotateX(-Math.PI / 2); g.translate(0, 0.17, 0);
      A.renk = M(o.renk || '#FF8A5B', { roughness: 0.75 }); ekle(g, A.renk);
      const nokta = M('#fff3e6', { roughness: 0.5 }); for (let i = 0; i < 5; i++) for (let j = 1; j <= 3; j++) { const a = i * Math.PI * 2 / 5, u = j * 0.24; const b = ekle(new THREE.SphereGeometry(0.05 - j * 0.008, 6, 4), nokta); b.position.set(Math.cos(a) * u, 0.37 - u * 0.14, -Math.sin(a) * u); }
      break;
    }
    case 'salyangoz': { /* konik sarmal kabuk + yumuşak gövde + göz sapları */
      const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60, a = u * Math.PI * 5.5, rr = 0.55 * (1 - u * 0.85); pts.push(new THREE.Vector3(Math.cos(a) * rr * 0.9, 0.5 + u * 0.75 + Math.sin(a) * rr * 0.25, Math.sin(a) * rr * 0.55)); }
      const yol = new THREE.CatmullRomCurve3(pts), tg = new THREE.TubeGeometry(yol, 120, 1, 10, false), p = tg.attributes.position, cc = new Float32Array(p.count * 3), col = new THREE.Color(), cen = new THREE.Vector3();
      /* kalınlık uca doğru incelsin: her halkayı merkezine göre ölçekle */
      for (let i = 0; i < p.count; i++) { const ring = Math.floor(i / 11), u = ring / 120; yol.getPointAt(Math.min(1, u), cen); const k = 0.36 * (1 - u * 0.88); p.setXYZ(i, cen.x + (p.getX(i) - cen.x) * k, cen.y + (p.getY(i) - cen.y) * k, cen.z + (p.getZ(i) - cen.z) * k); col.set(Math.sin(u * 40) > 0.3 ? '#7A4A2E' : '#C08458'); cc.set([col.r, col.g, col.b], i * 3); }
      tg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); tg.computeVertexNormals();
      A.kabuk = ekle(tg, M('#ffffff', { vertexColors: true, roughness: 0.45 })); A.kabuk.rotation.y = Math.PI; A.kabuk.position.x = -0.1;
      const gv = new THREE.SphereGeometry(0.5, 14, 10); gv.scale(1.6, 0.35, 0.6); A.gov = ekle(gv, M('#C9B79A', { roughness: 0.8 })); A.gov.position.set(0.45, 0.15, 0);
      for (const z of [-0.12, 0.12]) { const sap = ekle(new THREE.CylinderGeometry(0.03, 0.04, 0.6, 6), M('#C9B79A')); sap.position.set(1.15, 0.45, z); sap.rotation.z = -0.5; const u = ekle(new THREE.SphereGeometry(0.05, 6, 5), M('#2a2a2a')); u.position.set(1.3, 0.72, z); }
      break;
    }
    case 'ermit': { /* sarmal kabuk içinde turuncu keşiş yengeci */
      const kab = new THREE.LatheGeometry(Array.from({ length: 14 }, (_, i) => { const u = i / 13; return new THREE.Vector2(Math.sin(u * Math.PI) * (0.75 - u * 0.45) + 0.02, u * 1.7); }), 18);
      const p = kab.attributes.position, cc = new Float32Array(p.count * 3), col = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i)); col.set(Math.sin(y * 9 + a * 1.5) > 0.2 ? '#EAD9C0' : '#B89F7E'); cc.set([col.r, col.g, col.b], i * 3); }
      kab.setAttribute('color', new THREE.BufferAttribute(cc, 3)); kab.computeVertexNormals();
      A.kabuk = ekle(kab, M('#ffffff', { vertexColors: true, roughness: 0.5 })); A.kabuk.rotation.z = 1.25; A.kabuk.position.set(0.15, 0.55, 0);
      A.yengec = new THREE.Group(); G.add(A.yengec); const tur = M('#E0763E', { roughness: 0.55 });
      A.bacak = []; for (let i = 0; i < 3; i++) for (const z of [-1, 1]) { const b = ekle(new THREE.CylinderGeometry(0.05, 0.07, 0.75, 6), tur, A.yengec); b.geometry.translate(0, -0.37, 0); b.position.set(0.7 + i * 0.1, 0.55, z * 0.15); b.rotation.set(z * 0.6, 0, -0.5 - i * 0.15); A.bacak.push([b, i, z]); }
      const ki = ekle(new THREE.SphereGeometry(0.22, 10, 8), tur, A.yengec); ki.scale.set(1.3, 0.8, 0.9); ki.position.set(1.1, 0.45, 0.22);
      for (const z of [-0.08, 0.08]) { const sap = ekle(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), tur, A.yengec); sap.position.set(0.95, 0.95, z); const g2 = goz(0.95, 1.17, z, 0.065, A.yengec); g2.scale.setScalar(1); }
      break;
    }
    case 'ahtapot': { /* kafa (manto) + sekiz kol: her kol iç içe eklemli parçalar */
      A.mat = M('#c46a4a', { roughness: 0.5 });
      const kafa = new THREE.SphereGeometry(0.8, 20, 16); kafa.scale(0.95, 1.15, 0.9); A.kafa = ekle(kafa, A.mat); A.kafa.position.set(-0.1, 0.95, 0);
      goz(0.55, 0.62, -0.3, 0.16); goz(0.55, 0.62, 0.3, 0.16);
      A.kollar = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2, kok = new THREE.Group(); kok.position.set(Math.cos(a) * 0.35 + 0.1, 0.35, Math.sin(a) * 0.35); kok.rotation.y = -a; G.add(kok);
        const zincir = []; let ust = kok; const n = 6;
        for (let j = 0; j < n; j++) { const L = 0.32 * (1 - j * 0.07), rr = 0.15 * (1 - j / n * 0.8); const s = new THREE.Group(); s.position.x = j ? 0.32 * (1 - (j - 1) * 0.07) : 0; ust.add(s); const m = ekle(new THREE.CylinderGeometry(rr * 0.8, rr, L, 7), A.mat, s); m.rotation.z = -Math.PI / 2; m.position.x = L / 2; const e = ekle(new THREE.SphereGeometry(rr * 0.82, 7, 5), A.mat, s); e.position.x = L; zincir.push(s); ust = s; }
        A.kollar.push({ zincir, f: i * 0.9 });
      }
      break;
    }
    case 'karides': { /* kıvrık, yarı saydam gövde, yelpaze kuyruk, uzun antenler */
      A.mat = M('#FF9A8A', { roughness: 0.35, transparent: true, opacity: 0.88 }); A.halka = [];
      let ust = G; for (let j = 0; j < 6; j++) { const s = new THREE.Group(); s.position.x = j ? -0.32 : 0.25; ust.add(s); const m = ekle(new THREE.SphereGeometry(0.28 * (1 - j * 0.1), 10, 8), A.mat, s); m.scale.set(1.25, 0.9, 0.85); A.halka.push(s); ust = s; }
      const kuy = ekle(new THREE.ConeGeometry(0.25, 0.5, 6), A.mat, ust); kuy.rotation.z = Math.PI / 2; kuy.scale.set(1, 1, 0.25); kuy.position.x = -0.35;
      goz(0.55, 0.12, -0.12, 0.07); goz(0.55, 0.12, 0.12, 0.07);
      const an = M('#ffe0d8', { roughness: 0.4 }); for (const z of [-0.06, 0.06]) { const yol = new THREE.CatmullRomCurve3([new THREE.Vector3(0.55, 0.1, z), new THREE.Vector3(1.4, 0.8, z * 4), new THREE.Vector3(2.4, 0.3, z * 8)]); ekle(new THREE.TubeGeometry(yol, 16, 0.012, 4), an); }
      for (let i = 0; i < 4; i++) { const b = ekle(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 4), A.mat); b.position.set(0.25 - i * 0.18, -0.25, 0.1); b.rotation.z = 0.3; }
      break;
    }
    case 'dvatoz': { /* dikenli vatoz: yassı disk, ince uzun kuyruk; gömülüyken yalnız gözleri görünür */
      const gv = new THREE.SphereGeometry(1, 24, 12); gv.scale(0.75, 0.13, 0.62);
      A.mat = M('#8C7B6B', { roughness: 0.85 }); A.gov = ekle(gv, A.mat); A.gov.position.y = 0.12;
      const kuy = new THREE.CylinderGeometry(0.01, 0.05, 1.5, 5); kuy.rotateZ(Math.PI / 2); kuy.translate(-1.4, 0.1, 0); A.kuy = ekle(kuy, A.mat);
      goz(0.35, 0.24, -0.14, 0.05); goz(0.35, 0.24, 0.14, 0.05);
      break;
    }
    case 'yengec': { /* geniş kabuk, sekiz bacak, iki kıskaç, saplı gözler */
      const kir = M('#D4553E', { roughness: 0.5 }), acik = M('#E98A6A', { roughness: 0.5 });
      const kb = new THREE.SphereGeometry(1, 20, 12); kb.scale(0.75, 0.42, 1.0); A.gov = ekle(kb, kir); A.gov.position.y = 0.55;
      A.bacak = [];
      for (let i = 0; i < 4; i++) for (const z of [-1, 1]) { const g = new THREE.Group(); g.position.set(-0.35 + i * 0.22, 0.5, z * 0.75); G.add(g); const b1 = ekle(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6), acik, g); b1.geometry.translate(0, 0.3, 0); b1.rotation.x = z * 1.1; const g2 = new THREE.Group(); g2.position.set(0, Math.cos(1.1) * 0.6, z * Math.sin(1.1) * 0.6); g.add(g2); const b2 = ekle(new THREE.CylinderGeometry(0.03, 0.06, 0.7, 6), acik, g2); b2.geometry.translate(0, -0.35, 0); b2.rotation.x = -z * 0.3; A.bacak.push([g, i, z]); }
      for (const z of [-1, 1]) { const k = ekle(new THREE.SphereGeometry(0.28, 12, 8), kir); k.scale.set(1.4, 0.8, 0.8); k.position.set(0.95, 0.55, z * 0.55); A[z < 0 ? 'k1' : 'k2'] = k; }
      for (const z of [-0.2, 0.2]) { const s = ekle(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 5), kir); s.position.set(0.55, 0.95, z); goz(0.55, 1.15, z, 0.07); }
      G.rotation.y = 0; break;
    }
    case 'kumyilan': { /* kum yılan balığı kolonisi: her biri kumdaki deliğinden uzanan ince gövde */
      const gm = M('#ffffff', { vertexColors: true, roughness: 0.6 }), dm = M('#2a2117', { roughness: 1 });
      const yol = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0.05, 0.9, 0), new THREE.Vector3(-0.08, 1.9, 0), new THREE.Vector3(0.12, 2.75, 0)]);
      const tg = renkle(new THREE.TubeGeometry(yol, 24, 0.1, 7), (v, c) => c.set(Math.sin(v.y * 9) * Math.sin(Math.atan2(v.z, v.x) * 3) > 0.55 ? '#2a2a2a' : '#EDE6D3'));
      const bg = new THREE.SphereGeometry(0.14, 10, 8); bg.scale(1.5, 1, 1); const kg = new THREE.SphereGeometry(0.04, 6, 5);
      A.uy = [];
      for (let i = 0; i < 11; i++) { const ust = new THREE.Group(), z = Math.sin(i * 2.3) * 0.7; ust.position.set((i - 5) * 11 / 14, 0, z); G.add(ust);
        const del = ekle(new THREE.CircleGeometry(0.2, 10).rotateX(-Math.PI / 2), dm, ust); del.position.y = 0.02; del.scale.set(1.4, 1, 0.8);
        const g = new THREE.Group(); ust.add(g); ekle(tg, gm, g);
        const bas = ekle(bg, M('#F2ECDC', { roughness: 0.5 }), g); bas.position.set(0.18, 2.78, 0); bas.rotation.z = -0.5;
        for (const zz of [-1, 1]) ekle(kg, M('#111', { roughness: 0.1 }), g).position.set(0.3, 2.86, zz * 0.08);
        A.uy.push([ust, g]); }
      break;
    }
    case 'nudibrans': { /* parlak renkli kabuksuz salyangoz: kenarı renkli manto, arkada solungaç tüyü, önde iki boynuz */
      const ri = (o.renk | 0) % 3, [gr, kn, sr] = NUDI3[ri];
      const ayak = new THREE.SphereGeometry(1, 18, 10); ayak.scale(1.15, 0.22, 0.5); ekle(ayak, M(kn, { roughness: 0.4 })).position.y = 0.2;
      const gv = new THREE.SphereGeometry(1, 20, 12); gv.scale(1.05, 0.38, 0.42); A.gov = ekle(gv, M(gr, { roughness: 0.35 })); A.gov.position.y = 0.4;
      const sm = M(sr, { roughness: 0.45 });
      if (ri === 1) for (let i = 0; i < 9; i++) for (const zz of [-1, 1]) { const k = ekle(new THREE.ConeGeometry(0.07, 0.5, 6), sm); k.position.set(-0.75 + i * 0.18, 0.75, zz * 0.18); k.rotation.x = zz * 0.4; }
      else { A.tuy = new THREE.Group(); A.tuy.position.set(-0.65, 0.65, 0); G.add(A.tuy); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, k = ekle(new THREE.ConeGeometry(0.05, 0.45, 5), sm, A.tuy); k.position.set(Math.cos(a) * 0.1, 0.18, Math.sin(a) * 0.1); k.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); } }
      for (const zz of [-1, 1]) { const b = ekle(new THREE.CylinderGeometry(0.03, 0.07, 0.45, 6), sm); b.position.set(0.8, 0.85, zz * 0.13); b.rotation.z = -0.35; }
      break;
    }
    case 'kestane': { /* deniz kestanesi: koyu mor gövde, her yöne uzun ince dikenler */
      A.gov = new THREE.Group(); G.add(A.gov); A.gov.position.y = 0.75;
      ekle(new THREE.SphereGeometry(0.85, 16, 12).scale(1, 0.85, 1), M('#3B1F4A', { roughness: 0.7 }), A.gov);
      const kon = new THREE.ConeGeometry(0.045, 1.25, 4); kon.translate(0, 0.62 + 0.7, 0); const L = [], q = new THREE.Quaternion(), mt = new THREE.Matrix4();
      for (let i = 0; i < 70; i++) { const y = 1 - (i + 0.5) / 70 * 1.35, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996; const d = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).normalize(); q.setFromUnitVectors(Y, d); mt.makeRotationFromQuaternion(q); L.push(kon.clone().applyMatrix4(mt)); }
      ekle(birlestir(L), M('#2A1235', { roughness: 0.5 }), A.gov);
      A.alt = ekle(new THREE.SphereGeometry(0.85, 14, 10).scale(1, 0.7, 1), M('#C9A9C9', { roughness: 0.6 })); A.alt.position.y = 0.6; A.alt.visible = false;
      break;
    }
    case 'hiyar': { /* deniz hıyarı: uzun yumuşak gövde, sırtında kabarcıklar, önde kısa dokunaçlar */
      const gv = new THREE.SphereGeometry(1, 22, 12); gv.scale(1.15, 0.32, 0.4); A.gov = ekle(renkle(gv, (v, c) => c.set(v.y < -0.12 ? '#8E6E50' : '#6B4A32')), M('#ffffff', { vertexColors: true, roughness: 0.85 })); A.gov.position.y = 0.3;
      const pm = M('#A98460', { roughness: 0.8 }); for (let i = 0; i < 14; i++) { const x = -0.9 + i * 0.14, z = (i % 2 ? 1 : -1) * 0.14; const p = ekle(new THREE.SphereGeometry(0.045, 6, 4), pm); p.position.set(x, 0.6 - Math.abs(x) * 0.12, z); p.scale.set(1, 0.7, 1); }
      const dm = M('#D9C3A4', { roughness: 0.6 }); A.dok = new THREE.Group(); A.dok.position.set(1.15, 0.32, 0); G.add(A.dok);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, d = ekle(new THREE.CylinderGeometry(0.015, 0.03, 0.26, 4), dm, A.dok); d.position.set(0.1, Math.sin(a) * 0.08, Math.cos(a) * 0.08); d.rotation.z = -Math.PI / 2 + Math.sin(a) * 0.5; d.rotation.x = Math.cos(a) * 0.5; }
      break;
    }
    case 'mantis': { /* mantis karidesi: kumdaki yuvadan çıkan yeşil boğumlu gövde, sopa kıskaç, saplı gözler */
      A.yuva = ekle(new THREE.CircleGeometry(0.55, 14).rotateX(-Math.PI / 2), M('#20180f', { roughness: 1 })); A.yuva.position.y = 0.03; A.yuva.scale.set(1.3, 1, 0.8);
      A.seg = []; for (let i = 0; i < 6; i++) { const s = ekle(new THREE.SphereGeometry(0.27, 12, 8), M(i % 2 ? '#2EA86A' : '#3BC27C', { roughness: 0.4 })); s.scale.set(0.95, 0.9, 1.05); s.position.set(-i * 0.32, 0.32, 0); A.seg.push(s);
        const kn = ekle(new THREE.TorusGeometry(0.25, 0.012, 4, 14), M('#FF7A2E'), s); kn.rotation.y = Math.PI / 2; kn.position.x = -0.12; }
      A.bas = new THREE.Group(); A.bas.position.set(0.3, 0.38, 0); G.add(A.bas);
      for (const zz of [-1, 1]) { const sp = ekle(new THREE.CylinderGeometry(0.03, 0.04, 0.4, 6), M('#3BC27C'), A.bas); sp.position.set(0, 0.25, zz * 0.08); const g2 = ekle(new THREE.SphereGeometry(0.09, 10, 8), M('#2C9AD8', { roughness: 0.15, metalness: 0.2 }), A.bas); g2.position.set(0, 0.48, zz * 0.08); g2.scale.set(0.8, 1.2, 0.8); }
      A.sopa = new THREE.Group(); A.sopa.position.set(0.3, 0.25, 0.12); G.add(A.sopa);
      const kol = ekle(new THREE.CylinderGeometry(0.06, 0.07, 0.45, 6).rotateZ(-Math.PI / 2), M('#E2403A'), A.sopa); kol.position.x = 0.2;
      ekle(new THREE.SphereGeometry(0.12, 10, 8), M('#F25AA0', { roughness: 0.3 }), A.sopa).position.x = 0.45;
      break;
    }
    case 'murekkep': { /* mürekkep balığı: dalgalanan yüzgeç eteği, desenli manto (renk ve bantlar oyunda değişir), W gözler, kısa kollar */
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 8; A.cv = cv; A.tx = new THREE.CanvasTexture(cv); A.tx.wrapS = THREE.RepeatWrapping; A.tx.repeat.set(3, 1); A.tx.colorSpace = THREE.SRGBColorSpace; A.mod = null;
      A.mat = M('#ffffff', { map: A.tx, roughness: 0.45 });
      const man = new THREE.SphereGeometry(1, 28, 16); man.scale(0.46, 0.13, 0.21); A.man = ekle(man, A.mat); A.man.position.x = -0.05;
      A.etekM = M('#B89A74', { roughness: 0.5, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      const et = new THREE.SphereGeometry(1, 32, 6); const p = et.attributes.position; et.scale(0.5, 0.04, 0.29); A.et0 = Float32Array.from(p.array); A.etek = ekle(et, A.etekM); A.etek.position.set(-0.06, -0.02, 0);
      const bas = new THREE.SphereGeometry(1, 16, 12); bas.scale(0.1, 0.1, 0.13); A.basM = M('#9A7B5C', { roughness: 0.5 }); ekle(bas, A.basM).position.set(0.44, 0, 0);
      for (const zz of [-1, 1]) { const g = ekle(new THREE.SphereGeometry(0.045, 10, 8), M('#E8D38A', { roughness: 0.2 })); g.position.set(0.44, 0.04, zz * 0.11); ekle(new THREE.BoxGeometry(0.05, 0.012, 0.012), M('#111'), g).position.set(0, 0, zz * 0.035); }
      A.kol = new THREE.Group(); A.kol.position.set(0.52, -0.01, 0); G.add(A.kol);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, k = ekle(new THREE.ConeGeometry(0.022, 0.2, 5).rotateZ(-Math.PI / 2).translate(0.1, 0, 0), A.basM, A.kol); k.position.set(0, Math.sin(a) * 0.04, Math.cos(a) * 0.05); k.rotation.set(0, -Math.cos(a) * 0.3, Math.sin(a) * 0.3); }
      A.av = []; for (const zz of [-1, 1]) { const k = ekle(new THREE.CylinderGeometry(0.008, 0.012, 0.6, 5).rotateZ(-Math.PI / 2).translate(0.3, 0, 0), M('#E8C7B0'), A.kol); k.position.z = zz * 0.02; k.visible = false; A.av.push(k); }
      break;
    }
    case 'iz': { /* kumda iz: çukur (vatoz, tetik yuvası) ya da deniz hıyarının kum halkaları */
      A.mat = []; const mk = (r, ek) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color: r, roughness: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }, ek)); A.mat.push([m, m.opacity]); return malz(m); };
      if (o.iz === 'hiyar') { for (const dx of [-0.8, 0.6]) for (let k = 0; k < 3; k++) { const t = ekle(new THREE.TorusGeometry(0.35 - k * 0.1, 0.07, 5, 14), mk('#e6dcc0')); t.rotation.x = -Math.PI / 2; t.position.set(dx, 0.05 + k * 0.05, 0); } break; }
      const yv = o.iz === 'yuva', c1 = ekle(new THREE.CircleGeometry(1, 28), mk('#6e5f45', { opacity: 0.55 })); c1.rotation.x = -Math.PI / 2; c1.scale.set(yv ? 1.25 : 1.1, yv ? 0.9 : 0.6, 1); c1.position.y = 0.03;
      const c2 = ekle(new THREE.CircleGeometry(1, 24), mk('#4a3f2e', { opacity: 0.35 })); c2.rotation.x = -Math.PI / 2; c2.scale.set(yv ? 0.7 : 0.6, yv ? 0.5 : 0.33, 1); c2.position.y = 0.035;
      const hl = ekle(new THREE.TorusGeometry(1, 0.08, 4, 32), mk('#efe3c4', { opacity: 0.8 })); hl.rotation.x = -Math.PI / 2; hl.scale.set(yv ? 1.25 : 1.1, yv ? 0.9 : 0.6, 1); hl.position.y = 0.04;
      if (yv) for (let j = 0; j < 9; j++) { const a = j / 9 * Math.PI * 2, t = ekle(new THREE.DodecahedronGeometry(0.08 + (j % 3) * 0.03), mk('#e8ddd0', { transparent: false })); t.position.set(Math.cos(a) * 1.3, 0.04, Math.sin(a) * 0.95); }
      break;
    }
    case 'beyin': { /* beyin mercanı: kıvrım kıvrım oluklu kubbe */
      const g = new THREE.SphereGeometry(1, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2); const p = g.attributes.position, v = new THREE.Vector3(), C = [], ac = new THREE.Color('#D49A78'), ko = new THREE.Color('#7E4A38'), cc = new THREE.Color();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const ol = Math.sin(v.x * 11 + Math.sin(v.z * 7 + v.y * 3) * 2.2 + Math.cos(v.z * 13) * 0.6), d = Math.pow(Math.abs(ol), 0.6);
        const k = 1 - (1 - d) * 0.06 * Math.min(1, v.y * 4 + 0.2); v.multiplyScalar(k); p.setXYZ(i, v.x, v.y * 0.85, v.z * 0.92); cc.copy(ko).lerp(ac, d); C.push(cc.r, cc.g, cc.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); ekle(g, M('#ffffff', { vertexColors: true, roughness: 0.8 })).position.y = -0.06;
      break;
    }
    case 'baca': { /* hidrotermal baca: koyu mineral bacası, kızıl ağız; tüp solucanları ve beyaz yengeçler */
      const pr = [[0, 1.05], [0.12, 0.8], [0.32, 0.42], [0.55, 0.26], [0.9, 0.2], [1.2, 0.16], [1.53, 0.12], [1.54, 0.06]];
      const bg = new THREE.LatheGeometry(pr.map(([y, r]) => new THREE.Vector2(r, y)), 20); const pp = bg.attributes.position;
      for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), n = 1 + 0.12 * Math.sin(y * 13 + Math.atan2(z, x) * 3) * Math.min(1, y * 3); pp.setXYZ(i, x * n, y, z * n); }
      bg.computeVertexNormals(); ekle(renkle(bg, (v, c) => c.set(Math.sin(v.y * 31 + v.x * 9) > 0.6 ? '#5a4a3a' : v.y > 1.3 ? '#2a2420' : '#3B332E')), M('#ffffff', { vertexColors: true, roughness: 0.9 }));
      const agiz = ekle(new THREE.CircleGeometry(0.09, 12).rotateX(-Math.PI / 2), M('#ff7a30', { emissive: '#ff5a10', emissiveIntensity: 2.2 })); agiz.position.y = 1.545;
      const tm = M('#EDEDE6', { roughness: 0.6 }), km = M('#D0242A', { roughness: 0.4, emissive: '#3a0000' });
      A.sol = []; for (let i = 0; i < 9; i++) { const g = new THREE.Group(); g.position.set((i - 4) * 10 / 60, 0, 0.82 + Math.sin(i * 1.7) * 0.08); G.add(g);
        const boy = 0.5 * (0.7 + ((i * 37) % 10) / 20); const tp = ekle(new THREE.CylinderGeometry(0.026, 0.03, boy, 7), tm, g); tp.position.y = boy / 2;
        const kz = ekle(new THREE.SphereGeometry(0.06, 10, 8), km, g); kz.scale.set(0.9, 1.9, 0.9); kz.position.y = boy + 0.08; A.sol.push([g, kz, boy]); }
      A.yen = []; const ym = M('#F2EFE6', { roughness: 0.5 });
      for (let i = 0; i < 2; i++) { const g = new THREE.Group(); g.position.z = 1.0; G.add(g); ekle(new THREE.SphereGeometry(0.1, 10, 6).scale(1, 0.55, 0.8), ym, g).position.y = 0.06;
        for (const zz of [-1, 1]) for (let j = 0; j < 3; j++) { const b = ekle(new THREE.CylinderGeometry(0.008, 0.01, 0.14, 4), ym, g); b.position.set(-0.04 + j * 0.04, 0.04, zz * 0.09); b.rotation.x = zz * 1.0; } A.yen.push(g); }
      break;
    }
    case 'istiridye': { /* sürpriz: kaburgalı iki yelpaze kabuk, içinde inci */
      const kab = (alt) => { const g = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI, 0, Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.06 * Math.cos(a * 14); p.setXYZ(i, x * k, p.getY(i) * 0.35 * k, z * k); } g.computeVertexNormals(); if (alt) g.rotateZ(Math.PI); return g; };
      const pm = malz(new THREE.MeshPhysicalMaterial({ color: '#F4B8D4', roughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color('#ffd0ea'), side: THREE.DoubleSide }));
      const alt = ekle(kab(true), pm); alt.position.y = 0.36;
      A.kapak = new THREE.Group(); A.kapak.position.set(0, 0.36, 0); G.add(A.kapak); ekle(kab(false), pm, A.kapak);
      const inci = ekle(new THREE.SphereGeometry(0.28, 20, 14), malz(new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, clearcoat: 1, iridescence: 0.9, iridescenceIOR: 1.6, sheen: 0.4 })));
      inci.position.set(0, 0.42, 0.45); A.inci = inci;
      break;
    }
  }
  G.userData.A = A;
  return G;
}

/* her kare: 2D'deki canlı durumundan (o) poz ver */
export function canliOyna(G, tur, o, t) {
  const A = G.userData.A;
  switch (tur) {
    case 'yildiz': G.rotation.set(0.55, -(o.aci || 0) + (o.tepki > 0 ? Math.sin(t * 20) * 0.15 : 0), 0); break; /* kameraya hafif eğik, kumda yatarken de kolları görünsün */
    case 'salyangoz': A.gov.visible = !o.sakli; break;
    case 'ermit': { A.yengec.visible = !o.sakli; for (const [b, i, z] of A.bacak) b.rotation.z = -0.5 - i * 0.15 + Math.sin(t * 10 + i * 1.3 + z) * 0.25; break; }
    case 'ahtapot': {
      const renk = o.tepki > 0 ? '#D9D3C7' : `hsl(${o.hue | 0},55%,55%)`; A.mat.color.set(renk);
      for (const k of A.kollar) k.zincir.forEach((s, j) => { s.rotation.z = (j ? -0.22 : -0.55) + Math.sin(t * 2 + k.f + j * 0.7) * 0.18; s.rotation.y = Math.sin(t * 1.3 + k.f * 1.7 + j) * 0.25; });
      A.kafa.scale.setScalar(1 + Math.sin(t * 1.8) * 0.04); break;
    }
    case 'karides': { A.halka.forEach((s, j) => { s.rotation.z = (j ? 0.32 : 0) + (o.zipla > 0 ? -0.4 : Math.sin(t * 3 + j) * 0.05); }); break; }
    case 'dvatoz': { const gom = o.gomulu && !(o.kalk > 0); G.position.y -= gom ? 0.15 * G.scale.y : 0; A.gov.scale.set(1, 1 + (gom ? 0 : Math.sin(t * 3) * 0.25), 1); A.mat.color.set(gom ? '#cdb994' : '#8C7B6B'); break; }
    case 'yengec': { const yur = !o.dur; for (const [g, i, z] of A.bacak) g.rotation.z = yur ? Math.sin(t * 14 + i * 1.6 + (z > 0 ? 0 : Math.PI)) * 0.35 : 0; A.k1.rotation.z = Math.sin(t * 2) * 0.2; A.k2.rotation.z = Math.sin(t * 2 + 1) * 0.2; break; }
    case 'iz': { const a = o.a == null ? 1 : o.a; for (const [m, op] of A.mat) m.opacity = op * a; break; }
    case 'kumyilan': { const U = o.uy; A.uy.forEach(([ust, g], i) => { const u = U && U[i], h = u ? u[1] : 1, boy = u ? u[2] : 0.9 + (i % 3) * 0.1, f = u ? u[3] : t + i; if (u) ust.position.x = u[0];
      g.visible = h > 0.03; g.scale.set(1, Math.max(0.01, h) * boy, 1); g.position.y = -(1 - h) * 0.3; g.rotation.z = -(Math.sin(f * 0.9 + i * 0.8) * 0.22 + 0.12) * 0.6; }); break; }
    case 'nudibrans': { if (A.tuy) A.tuy.rotation.y = t * 0.6; A.gov.scale.set(1.05 + Math.sin(t * 3) * 0.03, 0.38, 0.42); break; }
    case 'kestane': { A.gov.visible = !o.ters; A.alt.visible = !!o.ters; A.gov.rotation.y = Math.sin(t * 0.3) * 0.05; break; }
    case 'hiyar': { A.gov.scale.set(1 + Math.sin(t * 1.5) * 0.06, 1, 1 - Math.sin(t * 1.5) * 0.03); A.dok.rotation.x = t * 0.8; break; }
    case 'mantis': { const cik = o.cik != null ? o.cik : 0.8, n = Math.max(2, Math.round(6 * cik)); A.yuva.position.x = o.ev != null ? -Math.abs(o.ev) : -1;
      A.seg.forEach((s, i) => s.visible = cik > 0.05 && i < n); A.bas.visible = A.sopa.visible = cik > 0.05; A.sopa.position.x = o.yum ? 0.75 : 0.3; A.sopa.rotation.z = o.yum ? 0 : 0.6 + Math.sin(t * 2) * 0.1; break; }
    case 'murekkep': { const mod = o.mod || 'normal', rf = o.renkF != null ? o.renkF : t;
      if (A.mod !== mod) { A.mod = mod; const c = A.cv.getContext('2d'), z = { normal: ['#8A6A4E', 'rgba(240,225,200,.35)'], kamuflaj: ['#CDBB94', 'rgba(150,130,95,.45)'], kac: ['#E9E1D2', 'rgba(255,255,255,.2)'], av: ['#B08C66', 'rgba(30,18,10,.85)'] }[mod] || ['#8A6A4E', 'rgba(0,0,0,.2)'];
        c.fillStyle = z[0]; c.fillRect(0, 0, 128, 8); c.fillStyle = z[1]; for (let i = 0; i < 4; i++) c.fillRect(i * 32 + 4, 0, mod === 'av' ? 12 : 6, 8); A.tx.needsUpdate = true;
        A.etekM.color.set(mod === 'kamuflaj' ? '#CDBB94' : mod === 'kac' ? '#E9E1D2' : '#B89A74'); A.basM.color.set(mod === 'kamuflaj' ? '#C9B791' : '#9A7B5C'); A.etekM.opacity = A.mat.opacity = mod === 'kamuflaj' ? 0.6 : 0.88; A.mat.transparent = true; }
      if (mod === 'av') A.tx.offset.x = -rf * 0.9;
      const p = A.etek.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = A.et0[i * 3], z = A.et0[i * 3 + 2], a = Math.atan2(z, x); p.setY(i, A.et0[i * 3 + 1] + Math.sin(a * 8 + rf * 9) * 0.012 * Math.min(1, Math.hypot(x, z) * 3)); } p.needsUpdate = true;
      A.kol.rotation.x = Math.sin(t * 2) * 0.15; A.av.forEach(k => k.visible = !!o.vur); break; }
    case 'baca': { const S = o.sol; A.sol.forEach(([g, kz, boy], i) => { const u = S && S[i], h = u ? u[1] : 1, f = u ? u[3] : t + i; kz.scale.set(0.9 * h + 0.01, 1.9 * h + 0.01, 0.9 * h + 0.01); kz.position.y = boy + 0.08 * h; kz.rotation.z = Math.sin(f * 1.4 + i) * 0.15; });
      A.yen.forEach((g, i) => { const y = o.yen && o.yen[i]; g.position.x = y ? y[0] : (i ? 0.85 : -0.75) + Math.sin(t * 0.3 + i) * 0.1; g.rotation.y = y ? (y[1] > 0 ? -0.3 : Math.PI + 0.3) : 0; }); break; }
    case 'istiridye': { A.kapak.rotation.x = -(0.35 + Math.sin(t * 1.5) * 0.25); A.inci.scale.setScalar(1 + Math.sin(t * 3) * 0.05); break; }
  }
}

/* ======================= yüzen canlılar ve ziyaretçiler =======================
   Hepsi +x yönüne bakar, boyları yaklaşık 1 birim (2D'deki s), merkezleri orijinde. */
function lathe(profil, seg = 20) { /* profil: [[x, r], ...] x ekseni boyunca dönel gövde */
  const g = new THREE.LatheGeometry(profil.map(([x, r]) => new THREE.Vector2(Math.max(0.0005, r), x)), seg); g.rotateZ(-Math.PI / 2); return g;
}
function renkle(g, fn) { const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(), v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v, col); c.set([col.r, col.g, col.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
/* yan yüzgeç (balina, köpekbalığı): kökü geniş, ucu sivri, geriye kıvrık, kenarları yuvarlatılmış ince kanat.
   Kambur balinanın ön kenarında tümsekler (tüberkül) vardır. +Y yönünde uzanır, sonra yana çevrilir. */
function yanYuzgec(boy, kok, uc, gerile, tumsek = 0) {
  const n = 18, sh = new THREE.Shape(), on = [], ar = [];
  for (let i = 0; i <= n; i++) { const t = i / n, y = t * boy, eks = -gerile * boy * t * t, gen = kok * (1 - t) + uc * t;
    on.push([eks + gen * 0.5 + (tumsek ? tumsek * Math.pow(Math.sin(t * Math.PI * 9), 2) * (1 - t * 0.5) : 0), y]); ar.push([eks - gen * 0.5 - kok * 0.12 * Math.sin(t * Math.PI), y]); }
  sh.moveTo(on[0][0], on[0][1]); for (let i = 1; i <= n; i++) sh.lineTo(on[i][0], on[i][1]);
  sh.quadraticCurveTo(on[n][0] - uc * 0.2, boy + uc * 0.6, ar[n][0], ar[n][1]); for (let i = n - 1; i >= 0; i--) sh.lineTo(ar[i][0], ar[i][1]); sh.closePath();
  const t = kok * 0.16, g = new THREE.ExtrudeGeometry(sh, { depth: t * 0.4, bevelEnabled: true, bevelThickness: t * 0.5, bevelSize: Math.min(uc * 0.4, t * 0.6), bevelSegments: 3, curveSegments: 8 }); g.translate(0, 0, -t * 0.2);
  /* kökte kalın, uca doğru incelir */
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * (1 - 0.65 * Math.min(1, Math.max(0, p.getY(i) / boy))));
  g.computeVertexNormals(); return g;
}
function yuzgec(noktalar, kalin = 0.01) { const sh = new THREE.Shape(); noktalar.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: kalin, bevelEnabled: false }); g.translate(0, 0, -kalin / 2); return g; }

/* boyuna kesitli gövde: u 0 (kuyruk sapı) → 1 (burun). Kesit elips; us(u) > 2 olunca süper elips (kutu gibi baş).
   renk(u, dikey, yatay, col) her köşe için rengi verir. */
function govdeLoft({ X0 = -0.5, X1 = 0.5, NX = 90, NA = 28, ry, rz, yc = () => 0, us = () => 2, renk }) {
  const P = [], C = [], I = [], col = new THREE.Color();
  for (let i = 0; i <= NX; i++) { const u = i / NX, x = X0 + (X1 - X0) * u, a1 = ry(u) + 0.002, a2 = rz(u) + 0.002, y0 = yc(u), e = 2 / us(u);
    for (let j = 0; j <= NA; j++) { const a = j / NA * Math.PI * 2, sn = Math.sin(a), cs = Math.cos(a);
      P.push(x, y0 + a1 * Math.sign(sn) * Math.pow(Math.abs(sn), e), a2 * Math.sign(cs) * Math.pow(Math.abs(cs), e)); renk(u, sn, cs, col, x); C.push(col.r, col.g, col.b); } }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals(); return g;
}
const yumusak = (u, a, b) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
/* profil tablosundan yumuşak ara değer: [[u, r], ...] */
const profil = T => u => { for (let k = 1; k < T.length; k++) if (u <= T[k][0]) { const [u0, a0] = T[k - 1], [u1, a1] = T[k], t = (u - u0) / (u1 - u0), e = t * t * (3 - 2 * t); return a0 + (a1 - a0) * e; } return T[T.length - 1][1]; };
/* kalınlığı olan yüzgeç: şekil xy düzleminde; renkFn(v, bb, col) */
function finEx(sh, kal, renkFn) { const g = new THREE.ExtrudeGeometry(sh, { depth: kal, bevelEnabled: true, bevelThickness: kal * 0.8, bevelSize: kal * 0.8, bevelSegments: 2, curveSegments: 12 }); g.translate(0, 0, -kal / 2); g.computeBoundingBox(); const bb = g.boundingBox; return renkle(g, (v, c) => renkFn(v, bb, c)); }
const sekil = (f) => { const s = new THREE.Shape(); f(s); return s; };
/* birçok geometriyi tek ağda birleştir (diken, tüp gibi tekrarlanan parçalar için) */
function birlestir(L) { const P = [], N = []; for (const g0 of L) { const g = g0.index ? g0.toNonIndexed() : g0; P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); return g; }
const NUDI3 = [['#2D5BD8', '#F7E27A', '#F28C28'], ['#9B59D0', '#FFFFFF', '#FF8C2E'], ['#F08BC0', '#FFE24A', '#B0287A']];
export function yuzenUret(tur, malz, balik, o = {}) {
  const G = new THREE.Group(), A = {}, M = (r, ek) => malz(new THREE.MeshStandardMaterial(Object.assign({ color: r, roughness: 0.55 }, ek)));
  const ekle = (geo, mat, ust = G) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; ust.add(m); return m; };
  const goz = (x, y, z, r, ust = G) => { ekle(new THREE.SphereGeometry(r, 10, 8), M('#f4f2ea', { roughness: 0.15 }), ust).position.set(x, y, z); ekle(new THREE.SphereGeometry(r * 0.6, 8, 6), M('#050505', { roughness: 0.05 }), ust).position.set(x + r * 0.35, y, z + Math.sign(z) * r * 0.45); };
  const kanat = (ust, x, y, z, geo, mat) => { const g = new THREE.Group(); g.position.set(x, y, z); ust.add(g); ekle(geo, mat, g); return g; };
  const vc = M('#ffffff', { vertexColors: true });
  switch (tur) {
    case 'balon': { /* balon balığı: şişince diken çıkar */
      A.gov = ekle(renkle(new THREE.SphereGeometry(0.5, 20, 14), (v, c) => c.set(v.y > 0.05 ? (Math.sin(v.x * 30) * Math.sin(v.z * 30) > 0.6 ? '#6b5328' : '#D9B868') : '#F5E6B8')), vc); A.gov.scale.set(1.15, 0.8, 0.8);
      ekle(yuzgec([[-0.55, 0], [-0.85, 0.22], [-0.8, 0], [-0.85, -0.22]], 0.02), M('#E6C77A', { transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
      goz(0.32, 0.12, -0.22, 0.08); goz(0.32, 0.12, 0.22, 0.08);
      A.diken = new THREE.Group(); G.add(A.diken); const dm = M('#8A6A3A');
      for (let i = 0; i < 60; i++) { const u = Math.acos(1 - 2 * (i + 0.5) / 60), a = i * 2.39996, n = new THREE.Vector3(Math.sin(u) * Math.cos(a), Math.cos(u), Math.sin(u) * Math.sin(a)); const d = ekle(new THREE.ConeGeometry(0.03, 0.22, 4), dm, A.diken); d.position.copy(n).multiplyScalar(0.5); d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); }
      break;
    }
    case 'kalamar': case 'devkalamar': {
      const dev = tur === 'devkalamar', renk = dev ? '#B8402F' : '#E9B7C8';
      A.mat = M(renk, { roughness: 0.4, transparent: !dev, opacity: dev ? 1 : 0.9 });
      ekle(lathe([[-0.55, 0], [-0.45, 0.1], [-0.1, 0.14], [0.12, 0.13], [0.15, 0.11]]), A.mat);
      A.yz = [1, -1].map(z => kanat(G, -0.42, 0, 0, yuzgec([[0, 0], [0.12, 0.18 * z], [0.22, 0]], 0.01), A.mat)); A.yz.forEach(k => k.rotation.x = Math.PI / 2);
      goz(0.12, 0.05, -0.1, dev ? 0.06 : 0.04); goz(0.12, 0.05, 0.1, dev ? 0.06 : 0.04);
      A.kol = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, uzun = i >= 8; const L = uzun ? (dev ? 1.2 : 0.7) : 0.35;
        const yol = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(L * 0.5, 0, 0), new THREE.Vector3(L, 0, 0)]); const g = new THREE.Group(); g.position.set(0.15, Math.cos(a) * 0.06, Math.sin(a) * 0.06); G.add(g);
        ekle(new THREE.TubeGeometry(yol, 8, 0.016, 5), A.mat, g); A.kol.push([g, a, uzun]); }
      if (dev) G.scale.setScalar(0.8);
      break;
    }
    case 'dkaplumbaga': { /* yeşil deniz kaplumbağası: kalp biçimli kubbe kabuk ve plakaları, düz karın, gagalı pullu baş, kanat gibi uzun ön yüzgeçler */
      const kab = new THREE.SphereGeometry(0.36, 48, 24), p = kab.attributes.position, cc = new Float32Array(p.count * 3), col = new THREE.Color(), c2 = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const u = x / 0.36; /* -1 kuyruk … +1 baş */
        z *= 1.02 * (u < 0 ? 1 - Math.pow(-u, 1.6) * 0.45 : 1 - Math.pow(u, 2) * 0.12); x *= 1.18; y = y > 0 ? y * 0.4 * (1 - Math.pow(Math.abs(u), 3) * 0.25) : y * 0.14;
        p.setXYZ(i, x, y, z);
        if (y < 0.004) col.set('#E9D9A6'); /* karın kabuğu */
        else {
          /* sırt plakaları: ortada 5 omur plakası, iki yanda 4'er kaburga plakası, kenarda küçük kenar plakaları */
          const az = Math.abs(z) / 0.36, kenar = az > 0.86 || Math.abs(u) > 0.93;
          let cell, ic;
          if (kenar) { const k = (Math.atan2(z, x) / Math.PI * 12 + 24) % 1; cell = 99; ic = Math.min(k, 1 - k) * 2; }
          else if (az < 0.3) { const k = (u * 2.5 + 5) % 1; cell = Math.floor(u * 2.5); ic = Math.min(Math.min(k, 1 - k) * 2, (0.3 - az) / 0.08); }
          else { const k = (u * 2 + 5) % 1; cell = 10 + Math.floor(u * 2); ic = Math.min(Math.min(k, 1 - k) * 2, (az - 0.3) / 0.08, (0.86 - az) / 0.1); }
          ic = Math.max(0, Math.min(1, ic));
          /* plaka içinde merkezden dışa ışınsal açık çizgiler (yeşil kaplumbağanın kehribar desenleri) */
          const isin = Math.pow(0.5 + 0.5 * Math.sin(Math.atan2(z - Math.round(z * 4) / 4, x - Math.round(x * 3) / 3) * 7 + cell * 2.1), 3);
          col.set(kenar ? '#5E4626' : '#6A4A22').lerp(c2.set('#D2A55A'), (0.2 + 0.55 * isin) * Math.min(1, ic * 1.6)).lerp(c2.set('#24180C'), ic < 0.2 ? 0.85 : 0);
        }
        cc.set([col.r, col.g, col.b], i * 3);
      }
      kab.setAttribute('color', new THREE.BufferAttribute(cc, 3)); kab.computeVertexNormals();
      A.gov = new THREE.Group(); G.add(A.gov); ekle(kab, M('#ffffff', { vertexColors: true, roughness: 0.55 }), A.gov).position.y = 0.02;
      /* pullu deri dokusu: zeytin yeşili üstüne sarı kenarlı koyu pullar */
      const deriG = (g, olcek) => renkle(g, (v, c) => { const a = Math.sin(v.x * olcek) * Math.sin(v.z * olcek + v.y * olcek * 0.7); c.set(a > 0.55 ? '#3D3A22' : a > 0.35 ? '#D9C77A' : '#7F8152'); });
      const boyun = ekle(deriG(new THREE.SphereGeometry(0.075, 14, 10), 60), M('#ffffff', { vertexColors: true, roughness: 0.7 }), A.gov); boyun.scale.set(1.3, 0.75, 0.95); boyun.position.set(0.43, 0.0, 0);
      A.bas = new THREE.Group(); A.bas.position.set(0.47, 0.012, 0); A.gov.add(A.bas);
      const bg = new THREE.SphereGeometry(0.085, 20, 14); const bp = bg.attributes.position; for (let i = 0; i < bp.count; i++) { const x = bp.getX(i); bp.setX(i, x * (x > 0 ? 1.55 : 1.1)); bp.setY(i, bp.getY(i) * (x > 0 ? 0.85 - x * 1.2 : 0.95)); } bg.computeVertexNormals();
      ekle(deriG(bg, 90), M('#ffffff', { vertexColors: true, roughness: 0.6 }), A.bas).position.x = 0.07;
      const gaga = ekle(new THREE.ConeGeometry(0.03, 0.06, 8).rotateZ(-Math.PI / 2), M('#5A5440', { roughness: 0.4 }), A.bas); gaga.position.set(0.2, -0.022, 0); gaga.scale.set(1, 0.7, 1.2);
      for (const z of [-1, 1]) { const g = ekle(new THREE.SphereGeometry(0.022, 10, 8), M('#14110c', { roughness: 0.05 }), A.bas); g.position.set(0.135, 0.018, z * 0.055); }
      /* ön yüzgeçler: uzun, kavisli, kanat gibi */
      const sh = new THREE.Shape(); sh.moveTo(0, 0.03); sh.bezierCurveTo(0.08, -0.05, 0.1, -0.32, 0.02, -0.6); sh.bezierCurveTo(-0.02, -0.5, -0.06, -0.25, -0.07, -0.02); sh.closePath();
      const yg = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.012, bevelSegments: 2, curveSegments: 14 }); yg.translate(0, 0, -0.006); yg.scale(0.85, 0.72, 1);
      const ygR = deriG(yg, 70), ym = M('#ffffff', { vertexColors: true, roughness: 0.65 });
      A.on = [1, -1].map(z => { const g = new THREE.Group(); g.position.set(0.2, -0.01, z * 0.27); A.gov.add(g); const m = ekle(ygR, ym, g); m.rotation.x = -Math.PI / 2 * z; return [g, z]; });
      const sh2 = new THREE.Shape(); sh2.moveTo(0, 0.02); sh2.quadraticCurveTo(0.03, -0.12, -0.04, -0.16); sh2.quadraticCurveTo(-0.08, -0.08, -0.04, 0); sh2.closePath();
      const ag = deriG(new THREE.ExtrudeGeometry(sh2, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 }), 70);
      A.ar = [1, -1].map(z => { const g = new THREE.Group(); g.position.set(-0.32, -0.01, z * 0.14); A.gov.add(g); const m = ekle(ag, ym, g); m.rotation.x = -Math.PI / 2 * z; return [g, z]; });
      ekle(new THREE.ConeGeometry(0.025, 0.08, 8).rotateZ(Math.PI / 2), M('#6E7049'), A.gov).position.set(-0.45, -0.005, 0);
      break;
    }
    case 'atik': { /* deniz atığı: poşet, şişe, teneke kutu, ip */
      const c = o.cesit;
      if (c === 'poset') { const g = new THREE.SphereGeometry(0.5, 14, 10); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setXYZ(i, p.getX(i) * (1 + 0.25 * Math.sin(y * 9)), y * 1.1, p.getZ(i) * 0.35); } g.computeVertexNormals();
        A.p = ekle(g, M('#F2F6F8', { transparent: true, opacity: 0.6, roughness: 0.3, side: THREE.DoubleSide })); for (const z of [-1, 1]) ekle(new THREE.TorusGeometry(0.12, 0.03, 4, 10), M('#F2F6F8', { transparent: true, opacity: 0.6 })).position.set(z * 0.22, 0.58, 0); }
      else if (c === 'sise') { const g = new THREE.LatheGeometry([[0, -0.5], [0.16, -0.5], [0.17, 0.1], [0.07, 0.28], [0.06, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y)), 14); g.rotateZ(Math.PI / 2); ekle(g, M('#4C9A62', { transparent: true, opacity: 0.8, roughness: 0.1, metalness: 0.1 })); }
      else if (c === 'kutu') { const g = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16); ekle(g, M('#B9C2C8', { metalness: 0.6, roughness: 0.35 })); ekle(new THREE.CylinderGeometry(0.205, 0.205, 0.3, 16), M('#D94A3A', { roughness: 0.5 })); }
      else { const yol = new THREE.CatmullRomCurve3(Array.from({ length: 8 }, (_, i) => new THREE.Vector3(-0.6 + i * 0.17, Math.sin(i * 1.3) * 0.12, Math.cos(i * 0.9) * 0.1))); ekle(new THREE.TubeGeometry(yol, 30, 0.035, 6), M('#E08A2E', { roughness: 0.8 })); }
      break;
    }
    case 'hayaletAg': { /* hayalet ağ: dalgalı ip ızgarası; kesildikçe ipler kopar */
      const m = M('#4A5A52', { roughness: 0.9 }); A.ip = [];
      for (let i = 0; i <= 6; i++) for (const yon of [0, 1]) { const u = i / 6 - 0.5, P = []; for (let k = 0; k <= 10; k++) { const t = k / 10 - 0.5; P.push(yon ? new THREE.Vector3(u * 0.9 + Math.sin(t * 5 + i) * 0.03, t * 0.7, Math.sin(t * 4 + i) * 0.08) : new THREE.Vector3(t * 0.9, u * 0.7 + Math.sin(t * 6 + i) * 0.03, Math.cos(t * 5 + i) * 0.08)); }
        const tb = ekle(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), 16, 0.008, 4), m); A.ip.push([tb, i]); }
      break;
    }
    case 'denizati': { /* denizatı: boğum boğum dik gövde, at başı gibi burun, kıvrık kuyruk, titreşen sırt yüzgeci */
      const R = '#F5A65B', K = '#D9863E', gm = M(R, { roughness: 0.55 }), km = M(K, { roughness: 0.6 });
      const yol = new THREE.CatmullRomCurve3([[0.12, 0.36], [0.04, 0.24], [0.09, 0.06], [0.11, -0.1], [0.04, -0.27], [-0.05, -0.4], [-0.03, -0.53], [0.06, -0.58], [0.1, -0.51], [0.04, -0.47]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
      const yr = u => u < 0.12 ? 0.075 : u < 0.4 ? 0.075 + 0.035 * Math.sin((u - 0.12) / 0.28 * Math.PI) : Math.max(0.012, 0.085 * (1 - (u - 0.4) / 0.6) ** 1.3);
      A.govde = new THREE.Group(); G.add(A.govde);
      for (let i = 0; i <= 26; i++) { const u = i / 26, p = yol.getPointAt(u), r = yr(u); const seg = ekle(new THREE.SphereGeometry(1, 10, 8), i % 2 ? km : gm, A.govde); seg.position.copy(p); seg.scale.set(r, r * 0.8, r * 0.85); }
      const bas = ekle(new THREE.SphereGeometry(1, 14, 10), gm, A.govde); bas.position.set(0.16, 0.42, 0); bas.scale.set(0.1, 0.085, 0.07); bas.rotation.z = -0.4;
      const burun = ekle(new THREE.CylinderGeometry(0.022, 0.03, 0.17, 8), gm, A.govde); burun.rotation.z = Math.PI / 2 + 0.35; burun.position.set(0.3, 0.38, 0);
      const tac = ekle(new THREE.ConeGeometry(0.035, 0.08, 6), km, A.govde); tac.position.set(0.12, 0.52, 0);
      for (const z of [-1, 1]) { const g = ekle(new THREE.SphereGeometry(0.022, 10, 8), M('#1B1B1B', { roughness: 0.1 }), A.govde); g.position.set(0.19, 0.44, z * 0.055); }
      const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.quadraticCurveTo(-0.1, 0.06, -0.12, -0.12); fs.lineTo(0, -0.14); fs.closePath();
      A.yuz = ekle(new THREE.ShapeGeometry(fs), M('#FFD6A0', { side: THREE.DoubleSide, transparent: true, opacity: 0.75 }), A.govde); A.yuz.position.set(-0.04, 0.02, 0);
      break;
    }
    case 'manta': { /* manta: gövdeden yumuşakça incelen kanatlar (üstü koyu, omuzlarında açık leke; altı beyaz), kıvrık ağız yüzgeçleri, ince kuyruk.
                       Kanatlar katı levha değil: kökten uca dalga gibi bükülerek çırpar (yuzenOyna). */
      const c2 = new THREE.Color(), DS = { side: THREE.DoubleSide };
      const gm = M('#ffffff', Object.assign({ vertexColors: true, roughness: 0.55 }, DS));
      /* gövde: yassı, önü küt */
      const pr = profil([[0, 0.25], [0.15, 0.6], [0.4, 0.95], [0.62, 1], [0.85, 0.85], [0.97, 0.55], [1, 0.35]]);
      ekle(govdeLoft({ X0: -0.3, X1: 0.3, NX: 40, NA: 24, ry: u => 0.075 * pr(u), rz: u => 0.17 * pr(u), us: () => 2.4, renk: (u, sn, cs, col) => col.set('#262D37').lerp(c2.set('#EEF1F3'), yumusak(-sn, -0.05, 0.35)) }), gm);
      /* kanat: kökten uca ve önden arkaya incelen kalınlık, uca doğru hafif yukarı kıvrım */
      const NS = 26, NC = 14, kanatG = z => {
        const P = [], C = [], I = [], S0 = [], col = new THREE.Color(), kk = new THREE.Color('#232A34'), ak = new THREE.Color('#8C99A4'), bb = new THREE.Color('#F0F3F4'), kn = new THREE.Color('#3B4450');
        for (const yz of [1, -1]) for (let i = 0; i <= NS; i++) { const s = i / NS, xl = 0.27 - 0.33 * Math.pow(s, 0.8), xt = -0.27 + 0.25 * Math.pow(s, 1.7);
          for (let jj = 0; jj <= NC; jj++) { const c = jj / NC, x = xl + (xt - xl) * c, kal = 0.07 * Math.pow(1 - s, 1.4) * Math.pow(Math.sin(Math.PI * c), 0.6) + 0.003;
            P.push(x, 0.05 * s * s + yz * kal * (yz > 0 ? 1 : 0.55), z * s * 0.6); S0.push(s);
            if (yz > 0) { col.copy(kk); const om = Math.exp(-(((s - 0.28) / 0.14) ** 2 + ((c - 0.3) / 0.22) ** 2)); col.lerp(ak, om * 0.8); col.lerp(kk, yumusak(s, 0.85, 1) * 0.3); } /* omuz lekesi */
            else { col.copy(bb); col.lerp(kn, Math.max(yumusak(s, 0.72, 0.97), yumusak(c, 0.82, 1) * 0.7)); } /* beyaz karın, koyu kenar */
            C.push(col.r, col.g, col.b); } }
        const R = NC + 1, H = (NS + 1) * R;
        for (let i = 0; i < NS; i++) for (let jj = 0; jj < NC; jj++) { const a = i * R + jj, b = a + R; I.push(a, b, a + 1, b, b + 1, a + 1, H + a, H + a + 1, H + b, H + b, H + a + 1, H + b + 1); }
        for (let i = 0; i < NS; i++) for (const jj of [0, NC]) { const a = i * R + jj, b = a + R; I.push(a, b, H + a, b, H + b, H + a); } /* ön ve arka kenarı kapat */
        for (let jj = 0; jj < NC; jj++) { const a = NS * R + jj; I.push(a, a + 1, H + a, a + 1, H + a + 1, H + a); } /* uç */
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
        g.userData.y0 = Float32Array.from(P.filter((_, k) => k % 3 === 1)); g.userData.s = Float32Array.from(S0); return g; };
      A.k = [1, -1].map(z => { const k = new THREE.Group(); k.position.z = z * 0.12; G.add(k); const m = ekle(kanatG(z), gm, k); return [k, z, m.geometry]; });
      /* ağız yüzgeçleri (sefalik loblar): öne uzanıp içe kıvrılır */
      const lm = M('#2A313B', { roughness: 0.6 });
      for (const z of [-1, 1]) { const yol = new THREE.CatmullRomCurve3([new THREE.Vector3(0.27, 0, z * 0.12), new THREE.Vector3(0.36, -0.005, z * 0.13), new THREE.Vector3(0.42, -0.02, z * 0.105), new THREE.Vector3(0.43, -0.035, z * 0.075)]);
        const t = ekle(new THREE.TubeGeometry(yol, 12, 0.022, 7), lm); t.scale.set(1, 0.7, 1); }
      ekle(new THREE.BoxGeometry(0.02, 0.025, 0.17), M('#15191F', { roughness: 0.9 })).position.set(0.3, -0.03, 0); /* geniş ağız */
      const ku = ekle(new THREE.CylinderGeometry(0.003, 0.012, 0.45, 5), lm); ku.rotation.z = Math.PI / 2; ku.position.x = -0.5; A.ku = ku;
      goz(0.27, 0.01, -0.17, 0.018); goz(0.27, 0.01, 0.17, 0.018);
      break;
    }
    case 'mola': { /* ay balığı: yassı yuvarlak gövde, uzun sırt ve karın yüzgeci, kesik arka */
      const g = renkle(new THREE.SphereGeometry(0.42, 24, 16), (v, c) => c.set(v.y > 0.1 ? '#8B96A0' : '#C8D0D6')); g.scale(1, 1.05, 0.32); A.gov = ekle(g, vc);
      const fm = M('#7C8790'); A.s = kanat(G, -0.15, 0.36, 0, yuzgec([[0.08, 0], [-0.05, 0.45], [-0.15, 0.42], [-0.12, 0]], 0.04), fm); A.k = kanat(G, -0.15, -0.36, 0, yuzgec([[0.08, 0], [-0.05, -0.45], [-0.15, -0.42], [-0.12, 0]], 0.04), fm);
      ekle(yuzgec([[-0.38, 0.3], [-0.52, 0.15], [-0.5, -0.15], [-0.38, -0.3]], 0.06), fm);
      goz(0.3, 0.08, -0.11, 0.035); goz(0.3, 0.08, 0.11, 0.035);
      break;
    }
    case 'fok': case 'dugong': { /* fok ve deniz ineği: iğ biçimli memeli gövdesi */
      const fok = tur === 'fok';
      const g = renkle(lathe(fok ? [[-0.5, 0], [-0.4, 0.06], [-0.1, 0.16], [0.2, 0.15], [0.38, 0.1], [0.48, 0.07], [0.52, 0]] : [[-0.5, 0], [-0.38, 0.07], [-0.05, 0.19], [0.25, 0.16], [0.42, 0.1], [0.5, 0.08], [0.53, 0]], 24), (v, c) => c.set(fok ? (Math.sin(v.x * 40) * Math.sin(v.z * 40 + v.y * 30) > 0.7 ? '#4b4f55' : v.y > -0.03 ? '#7d8389' : '#b9bcbc') : (v.y > 0 ? '#8d8a86' : '#b9b2aa')));
      A.gov = ekle(g, vc); const fm = M(fok ? '#5d6268' : '#7f7b76');
      A.y = [1, -1].map(z => { const k = kanat(G, 0.18, -0.08, z * 0.13, yuzgec([[0, 0], [0.04, -0.03], [-0.05, -0.2], [-0.1, -0.18]], 0.025), fm); k.rotation.x = z * 1.2; return [k, z]; });
      A.kuyruk = new THREE.Group(); A.kuyruk.position.x = -0.48; G.add(A.kuyruk);
      if (fok) [1, -1].forEach(z => { const k = ekle(yuzgec([[0, 0], [-0.16, 0.08], [-0.15, -0.02]], 0.02), fm, A.kuyruk); k.rotation.x = Math.PI / 2; k.position.z = z * 0.04; k.rotation.z = z * 0.2; });
      else { const k = ekle(yuzgec([[0, 0], [-0.12, 0.2], [-0.16, 0.18], [-0.1, 0], [-0.16, -0.18], [-0.12, -0.2]], 0.02), fm, A.kuyruk); k.rotation.x = Math.PI / 2; }
      goz(0.44, 0.05, -0.06, fok ? 0.032 : 0.015); goz(0.44, 0.05, 0.06, fok ? 0.032 : 0.015);
      if (fok) for (const z of [-1, 1]) for (let i = 0; i < 3; i++) { const b = ekle(new THREE.CylinderGeometry(0.002, 0.002, 0.12, 3), M('#e8e8e0')); b.position.set(0.52, 0 - i * 0.01, z * 0.05); b.rotation.set(z * 1.2, 0, 0.3 - i * 0.2); }
      break;
    }
    case 'balinakb': case 'kambur': { /* balina köpekbalığı (benekli) ve kambur balina (uzun beyaz yüzgeçler) */
      const kb = tur === 'balinakb';
      const g = renkle(lathe(kb ? [[-0.5, 0], [-0.42, 0.03], [-0.2, 0.1], [0.1, 0.12], [0.38, 0.1], [0.48, 0.07], [0.5, 0]] : [[-0.5, 0], [-0.4, 0.04], [-0.15, 0.12], [0.15, 0.13], [0.38, 0.1], [0.48, 0.06], [0.5, 0]], 28), (v, c) => {
        if (kb) c.set(v.y < -0.04 ? '#d8dde0' : (Math.sin(v.x * 70) * Math.sin(v.z * 70 + v.y * 60) > 0.75 ? '#eef2f2' : '#3d5568')); else c.set(v.y < -0.05 ? (Math.sin(v.x * 120) > 0 ? '#d9d9d4' : '#9fa3a3') : '#2f3438'); });
      if (kb) g.scale(1, 0.85, 1.25); A.gov = ekle(g, vc); const fm = M(kb ? '#3d5568' : '#2f3438');
      if (kb) { ekle(yuzgec([[0, 0], [-0.08, 0.14], [-0.13, 0.13], [-0.1, 0]], 0.02), fm).position.set(-0.02, 0.09, 0); }
      else { ekle(yuzgec([[0, 0], [-0.04, 0.03], [-0.06, 0]], 0.02), fm).position.set(-0.2, 0.1, 0); }
      /* yan yüzgeçler: gövdenin yanından dışarı ve biraz aşağı uzanır, geriye kıvrılır (kambur balinada uzun, beyaz, tümsekli) */
      const yg = kb ? yanYuzgec(0.2, 0.12, 0.035, 0.45) : yanYuzgec(0.42, 0.1, 0.028, 0.55, 0.012);
      if (!kb) renkle(yg, (v, c) => c.set(Math.sin(v.x * 70 + Math.sin(v.y * 30) * 2) * Math.sin(v.y * 55) > 0.55 ? '#a3aaac' : '#e6e9e7'));
      const ym = kb ? fm : M('#ffffff', { vertexColors: true, roughness: 0.6 });
      A.y = [1, -1].map(z => { const g = new THREE.Group(); g.position.set(kb ? 0.14 : 0.2, -0.07, z * (kb ? 0.1 : 0.085)); G.add(g);
        const m = ekle(yg, ym, g); m.rotation.x = z * Math.PI / 2; m.rotation.y = 0; /* +Y uzanımı → ±Z (yana); yüzgeç düzlemi yataya yakın */
        g.rotation.set(z * (kb ? 0.3 : 0.5), -z * 0.35, -0.15); return [g, z]; });
      A.kuyruk = new THREE.Group(); A.kuyruk.position.x = -0.48; G.add(A.kuyruk);
      const kq = ekle(yuzgec(kb ? [[0, 0], [-0.12, 0.22], [-0.16, 0.2], [-0.08, 0], [-0.12, -0.12], [-0.08, -0.12]] : [[0, 0], [-0.12, 0.2], [-0.15, 0.17], [-0.1, 0], [-0.15, -0.17], [-0.12, -0.2]], 0.02), fm, A.kuyruk); if (!kb) kq.rotation.x = Math.PI / 2;
      goz(0.44, kb ? 0.02 : -0.02, -0.07, 0.012); goz(0.44, kb ? 0.02 : -0.02, 0.07, 0.012);
      break;
    }
    case 'kutu': { /* sarı kutu balığı: köşeli gövde, siyah benekler */
      const g = renkle(new THREE.BoxGeometry(0.5, 0.34, 0.3, 6, 4, 4), (v, c) => c.set(Math.sin(v.x * 45) * Math.sin(v.y * 45 + v.z * 30) > 0.8 ? '#1a1a1a' : (Math.sin(v.x * 45) * Math.sin(v.y * 45 + v.z * 30) > 0.6 ? '#f5f5f5' : '#F2D33B')));
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 - 0.12 * (Math.abs(y) / 0.17) * (Math.abs(z) / 0.15); p.setXYZ(i, x * (1 - Math.max(0, x - 0.1) * 0.6 * (Math.abs(y) + Math.abs(z))), y * k, z * k); } g.computeVertexNormals();
      A.gov = ekle(g, vc); A.kuyruk = kanat(G, -0.25, 0, 0, yuzgec([[0, 0], [-0.15, 0.1], [-0.15, -0.1]], 0.02), M('#E8C42E', { transparent: true, opacity: 0.85 }));
      goz(0.2, 0.08, -0.13, 0.035); goz(0.2, 0.08, 0.13, 0.035);
      break;
    }
    case 'aslan': { /* aslan balığı: çizgili gövde, yelpaze gibi açılan dikenli yüzgeçler */
      const g = renkle(lathe([[-0.4, 0], [-0.3, 0.06], [-0.05, 0.12], [0.18, 0.11], [0.3, 0.07], [0.35, 0]], 18), (v, c) => c.set(Math.sin(v.x * 50 + v.y * 10) > 0.1 ? '#B5332A' : '#F4E6D8')); g.scale(1, 1.15, 0.6);
      ekle(g, vc); const dm = M('#C9483C'), zm = M('#F4E6D8', { transparent: true, opacity: 0.55, side: THREE.DoubleSide });
      for (let i = 0; i < 12; i++) { const x = 0.15 - i * 0.04, h = 0.32 - Math.abs(i - 4) * 0.02; const d = ekle(new THREE.CylinderGeometry(0.004, 0.008, h, 4), i % 2 ? dm : zm); d.position.set(x, 0.1 + h / 2, 0); d.rotation.z = 0.25; }
      A.y = [1, -1].map(z => { const k = new THREE.Group(); k.position.set(0.1, -0.02, z * 0.06); G.add(k); for (let i = 0; i < 9; i++) { const d = ekle(new THREE.CylinderGeometry(0.003, 0.008, 0.38, 4), i % 2 ? dm : zm, k); d.geometry.translate(0, -0.19, 0); d.rotation.set(z * (0.6 + i * 0.12), 0, 0.6 + i * 0.12); } return [k, z]; });
      ekle(yuzgec([[0, 0], [-0.15, 0.1], [-0.15, -0.1]], 0.01), zm).position.x = -0.38;
      goz(0.24, 0.04, -0.05, 0.025); goz(0.24, 0.04, 0.05, 0.025);
      break;
    }
    case 'dumbo': { /* dumbo ahtapot: çan gövde, kulak gibi yüzgeçler, perdeli kollar */
      const pm = M('#F2A7B5', { roughness: 0.45, transparent: true, opacity: 0.92 });
      const bas = ekle(new THREE.SphereGeometry(0.22, 18, 14), pm); bas.scale.set(1, 1.15, 1); bas.position.y = 0.12;
      A.k = [1, -1].map(z => { const k = kanat(G, 0, 0.22, z * 0.2, yuzgec([[0, 0], [0.08, 0.04 * z], [0.02, 0.14 * z], [-0.08, 0.1 * z]].map(([a, b]) => [a, b]), 0.015), pm); k.rotation.x = Math.PI / 2; return [k, z]; });
      const et = new THREE.ConeGeometry(0.3, 0.3, 16, 1, true); et.translate(0, -0.12, 0); A.etek = ekle(et, M('#E58FA3', { side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
      goz(0.17, 0.12, -0.1, 0.035); goz(0.17, 0.12, 0.1, 0.035);
      G.rotation.z = 0; break;
    }
    case 'sifonofor': { /* zincir gibi dizilmiş, ışıldayan saydam çanlar */
      const pm = malz(new THREE.MeshStandardMaterial({ color: '#bff6ff', emissive: '#6fe6ff', emissiveIntensity: 0.9, transparent: true, opacity: 0.55, roughness: 0.2 }));
      A.z = []; for (let i = 0; i < 26; i++) { const b = ekle(new THREE.SphereGeometry(i < 3 ? 0.04 : 0.022, 8, 6), pm); b.position.x = 0.5 - i * 0.04; A.z.push(b); }
      break;
    }
    case 'pelikan': { /* pelikan yılanbalığı: kocaman ağız, kamçı gövde, pembe ışıklı kuyruk ucu */
      const km = M('#1f1a22', { roughness: 0.6 });
      const ag = new THREE.ConeGeometry(0.16, 0.32, 18, 1, true); ag.rotateZ(Math.PI / 2); ag.translate(0.35, 0, 0); A.ag = ekle(ag, M('#2a2230', { side: THREE.DoubleSide }));
      const yol = new THREE.CatmullRomCurve3(Array.from({ length: 10 }, (_, i) => new THREE.Vector3(0.2 - i * 0.08, 0, 0))); A.yol = yol; A.gov = ekle(new THREE.TubeGeometry(yol, 40, 0.03, 6), km);
      A.uc = ekle(new THREE.SphereGeometry(0.025, 8, 6), malz(new THREE.MeshStandardMaterial({ color: '#ff9ad5', emissive: '#ff5fbf', emissiveIntensity: 2 })));
      goz(0.24, 0.05, -0.03, 0.012); goz(0.24, 0.05, 0.03, 0.012);
      break;
    }
    case 'top': { /* pastel deniz topu */
      const g = renkle(new THREE.SphereGeometry(1, 32, 20), (v, c) => { const a = Math.atan2(v.z, v.x); c.set(['#FF9AA2', '#FFDAC1', '#B5EAD7', '#C7CEEA', '#FF9AA2', '#FFDAC1'][Math.floor(((a + Math.PI) / (Math.PI * 2)) * 6) % 6]); if (Math.abs(v.y) > 0.92) c.set('#ffffff'); });
      A.gov = ekle(g, malz(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 1, transparent: true, opacity: 0.9 })));
      break;
    }
    case 'meduz': { /* denizanası: yarı saydam çan, içte dört pembe halka, kıvrımlı ağız kolları, ince dokunaçlar */
      const renk = new THREE.Color(o.renk || '#F3B6E8'), derin = !!o.derin;
      const canM = malz(new THREE.MeshPhysicalMaterial({ color: renk, roughness: 0.15, transparent: true, opacity: 0.42, side: THREE.DoubleSide, emissive: renk, emissiveIntensity: derin ? 0.9 : 0.12, depthWrite: false, sheen: 0.5, sheenColor: new THREE.Color('#ffffff') }));
      const can = new THREE.SphereGeometry(0.5, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52); const p = can.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), k = 1 + 0.035 * Math.cos(a * 16) * (1 - y / 0.5); p.setXYZ(i, x * k, y * 0.85, z * k); }
      can.computeVertexNormals(); A.can = new THREE.Group(); G.add(A.can); const m = new THREE.Mesh(can, canM); A.can.add(m);
      const ic = malz(new THREE.MeshStandardMaterial({ color: derin ? '#7fffe0' : '#ff8fc8', emissive: derin ? '#4fffd0' : '#ff6fb0', emissiveIntensity: derin ? 1.4 : 0.35, transparent: true, opacity: 0.75 }));
      for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 14), ic); const a = i * Math.PI / 2 + 0.78; t.position.set(Math.cos(a) * 0.12, 0.18, Math.sin(a) * 0.12); t.rotation.x = Math.PI / 2; A.can.add(t); }
      A.kol = []; const kolM = malz(new THREE.MeshPhysicalMaterial({ color: renk, roughness: 0.3, transparent: true, opacity: 0.55, side: THREE.DoubleSide, emissive: renk, emissiveIntensity: derin ? 0.7 : 0.08, depthWrite: false }));
      for (let i = 0; i < 4; i++) { const g = new THREE.Group(); const a = i * Math.PI / 2; g.position.set(Math.cos(a) * 0.05, 0.02, Math.sin(a) * 0.05); G.add(g);
        const yol = new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, j) => new THREE.Vector3(Math.sin(j * 1.3 + i) * 0.05, -j * 0.13, Math.cos(j * 1.1 + i) * 0.05)));
        const tg = new THREE.TubeGeometry(yol, 28, 0.035, 5); tg.scale(1, 1, 0.45); const k = new THREE.Mesh(tg, kolM); k.rotation.y = a; g.add(k); A.kol.push([g, i]); }
      /* ince dokunaçlar: her kare yeniden şekillenen çizgiler */
      A.dok = []; const cm = new THREE.LineBasicMaterial({ color: renk, transparent: true, opacity: 0.55, depthWrite: false });
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 3), 3)); const l = new THREE.Line(g, cm); G.add(l); A.dok.push([l, a, 1.1 + (i % 3) * 0.35]); }
      break;
    }
    case 'kopekbaligi': { /* kara uçlu resif köpekbalığı: tek parça pürüzsüz gövde, kalınlığı olan kavisli yüzgeçler, uçları siyah;
                             bütün parçalar aynı yüzme bükülmesini paylaşır, gövde kuyruğa doğru dalgalanır */
      A.yuz = { faz: { value: 0 }, genlik: { value: 1 } };
      const SM = (r, ek) => malz(new THREE.MeshPhysicalMaterial(Object.assign({ color: r, roughness: 0.38, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.5 }, ek)), { yuz: A.yuz });
      /* gövde: boyuna kesitleri elips olan, sivri burunlu, kuyruk sapına incelen tek ağ */
      const NX = 110, NA = 32, X0 = -0.5, X1 = 0.56, P = [], C = [], I = [], col = new THREE.Color(), c2 = new THREE.Color();
      const PRF = [[0, 0.1], [0.12, 0.26], [0.3, 0.62], [0.5, 0.94], [0.6, 1], [0.72, 0.93], [0.84, 0.74], [0.92, 0.55], [0.97, 0.36], [0.995, 0.15], [1, 0]];
      const pr = u => { /* u: 0 kuyruk sapı … 1 burun ucu; yumuşak ara değer */ for (let k = 1; k < PRF.length; k++) if (u <= PRF[k][0]) { const [u0, a0] = PRF[k - 1], [u1, a1] = PRF[k], t = (u - u0) / (u1 - u0), e = t * t * (3 - 2 * t); return a0 + (a1 - a0) * e; } return 0; };
      for (let i = 0; i <= NX; i++) {
        const u = i / NX, x = X0 + (X1 - X0) * u, bas = THREE.MathUtils.smoothstep(u, 0.7, 0.95), ry = (0.1 - bas * 0.03) * pr(u) + 0.004, rz = (0.082 + bas * 0.012) * pr(u) + 0.004, yc = -0.004 - bas * 0.012;
        for (let j = 0; j <= NA; j++) {
          const a = j / NA * Math.PI * 2, sy = Math.sin(a), y = yc + ry * sy * (sy < 0 ? 0.82 : 1), z = rz * Math.cos(a);
          P.push(x, y, z);
          /* renk: sırtı bronz-gri, karnı beyaz, yumuşak geçişli; yanlarda beyaz bir dil (kara uçlu resif köpekbalığı) */
          const sirt = THREE.MathUtils.smoothstep(sy, -0.62, -0.12), dil = THREE.MathUtils.smoothstep(sy, -0.45, -0.1) * (1 - THREE.MathUtils.smoothstep(sy, -0.1, 0.15)) * THREE.MathUtils.smoothstep(u, 0.15, 0.45) * (1 - THREE.MathUtils.smoothstep(u, 0.55, 0.75));
          col.set('#E9ECEA').lerp(c2.set('#55636B'), sirt).lerp(c2.set('#DDE2E0'), dil * 0.22);
          if (u > 0.9 && u < 0.95 && sy < -0.55) col.lerp(c2.set('#2a2f30'), 0.7); /* ağız */
          C.push(col.r, col.g, col.b);
        }
      }
      for (let i = 0; i < NX; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); gg.setIndex(I); gg.computeVertexNormals();
      ekle(gg, SM('#ffffff', { vertexColors: true }));
      /* yüzgeçler: bevelli, kalınlığı olan kavisli plakalar; uçları siyaha döner */
      const yzg = (sh, kal, uc) => { const g = new THREE.ExtrudeGeometry(sh, { depth: kal, bevelEnabled: true, bevelThickness: kal * 0.9, bevelSize: kal * 0.9, bevelSegments: 3, curveSegments: 16 }); g.translate(0, 0, -kal / 2);
        g.computeBoundingBox(); const bb = g.boundingBox; return renkle(g, (v, c) => { const t = uc(v, bb); c.set('#7E8A8C').lerp(c2.set('#121516'), THREE.MathUtils.smoothstep(t, 0.72, 0.86)); }); };
      const sirtS = new THREE.Shape(); sirtS.moveTo(0.11, 0); sirtS.bezierCurveTo(0.07, 0.06, 0.02, 0.15, -0.035, 0.2); sirtS.bezierCurveTo(-0.03, 0.12, -0.05, 0.05, -0.1, 0.012); sirtS.lineTo(-0.1, 0); sirtS.closePath();
      const sg = yzg(sirtS, 0.008, v => v.y / 0.2); const srt = ekle(sg, SM('#ffffff', { vertexColors: true })); srt.position.set(0.08, 0.095, 0);
      const gs = new THREE.Shape(); gs.moveTo(0.06, 0.01); gs.bezierCurveTo(0.02, -0.06, -0.08, -0.17, -0.16, -0.24); gs.bezierCurveTo(-0.1, -0.13, -0.08, -0.06, -0.06, 0); gs.closePath();
      const gsg = yzg(gs, 0.007, v => -v.y / 0.24);
      for (const z of [-1, 1]) { const m = ekle(gsg, SM('#ffffff', { vertexColors: true })); m.position.set(0.2, -0.06, z * 0.07); m.rotation.x = z * -1.1; m.rotation.y = z * 0.25; }
      const ks = new THREE.Shape(); ks.moveTo(0.03, 0.012); ks.bezierCurveTo(-0.05, 0.08, -0.13, 0.2, -0.2, 0.27); ks.bezierCurveTo(-0.17, 0.17, -0.15, 0.08, -0.1, 0.0); ks.bezierCurveTo(-0.13, -0.05, -0.15, -0.1, -0.16, -0.14); ks.bezierCurveTo(-0.08, -0.08, -0.03, -0.04, 0.03, -0.012); ks.closePath();
      const kq = ekle(yzg(ks, 0.006, v => Math.max(v.y / 0.27, -v.y / 0.14)), SM('#ffffff', { vertexColors: true })); kq.position.set(-0.48, 0.0, 0);
      const ki = new THREE.Shape(); ki.moveTo(0.03, 0); ki.quadraticCurveTo(0.0, 0.06, -0.035, 0.07); ki.quadraticCurveTo(-0.03, 0.03, -0.04, 0); ki.closePath();
      ekle(yzg(ki, 0.004, v => v.y / 0.07), SM('#ffffff', { vertexColors: true })).position.set(-0.26, 0.04, 0); /* ikinci sırt yüzgeci */
      const an = new THREE.Shape(); an.moveTo(0.03, 0); an.quadraticCurveTo(0.0, -0.05, -0.035, -0.06); an.quadraticCurveTo(-0.03, -0.025, -0.04, 0); an.closePath();
      ekle(yzg(an, 0.004, v => -v.y / 0.06), SM('#ffffff', { vertexColors: true })).position.set(-0.27, -0.035, 0); /* anal yüzgeç */
      for (const z of [-1, 1]) { const m = ekle(yzg(an, 0.004, v => -v.y / 0.06), SM('#ffffff', { vertexColors: true })); m.position.set(-0.08, -0.07, z * 0.03); m.rotation.x = z * -0.6; } /* karın yüzgeçleri */
      /* solungaç yarıkları: gövdenin yan yüzeyinde beş ince kavisli çizgi */
      const sm = SM('#3b4547', { roughness: 0.6 });
      for (const z of [-1, 1]) for (let k = 0; k < 5; k++) { const u = 0.72 + k * 0.018, x = X0 + (X1 - X0) * u, b2 = THREE.MathUtils.smoothstep(u, 0.7, 0.95), ry = (0.1 - b2 * 0.03) * pr(u) + 0.004, rz = (0.082 + b2 * 0.012) * pr(u) + 0.004;
        const pts = []; for (let q = 0; q <= 6; q++) { const a = (-0.35 + q / 6 * 0.75); pts.push(new THREE.Vector3(x - Math.abs(a) * 0.006, -0.004 - b2 * 0.012 + ry * Math.sin(a) * 0.95, z * (rz * Math.cos(a) + 0.0015))); }
        ekle(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.0016, 3), sm); }
      for (const z of [-1, 1]) { const g = ekle(new THREE.SphereGeometry(0.0115, 12, 10), SM('#080a0b', { roughness: 0.05, metalness: 0.2 })); g.position.set(0.455, 0.012, z * 0.052); g.scale.set(1, 1, 0.6); }
      break;
    }
    case 'sardalya1': { const f = balik('sardalya'); G.add(f.o); A.b = [{ ...f, i: 0 }]; break; }
    case 'ks': { const f = balik(o.model || 'sardalya'); G.add(f.o); A.b = [{ ...f, i: 0 }]; break; } /* küçük sürü balığı ya da orfoz */
    case 'muren': { /* yeşil müren: 2D'deki gövde izini izleyen boğum zinciri; dünyaya hizalı iç grup */
      const ic = new THREE.Group(); G.add(ic); A.ic = ic; A.seg = [];
      const gm = M('#5F8E3F', { roughness: 0.55 }), km = M('#3F6528', { roughness: 0.6 });
      for (let i = 1; i < 14; i++) { const t = i / 13, m = ekle(new THREE.SphereGeometry(0.066 * (1 - t * 0.65), 10, 8), t > 0.8 ? km : gm, ic); m.scale.set(1.7, 1, 1); A.seg.push(m); }
      const bas = new THREE.Group(); ic.add(bas); A.bas = bas;
      const kafa = ekle(new THREE.SphereGeometry(0.06, 14, 10), M('#6A9A48', { roughness: 0.5 }), bas); kafa.scale.set(2, 1, 1.05);
      const cene = ekle(new THREE.SphereGeometry(0.045, 10, 8), M('#557F38'), bas); cene.scale.set(1.9, 0.5, 0.9); cene.position.set(0.03, -0.035, 0); A.cene = cene;
      for (const z of [-1, 1]) { const g = ekle(new THREE.SphereGeometry(0.014, 8, 6), M('#F2D45C', { emissive: '#4a3a00' }), bas); g.position.set(0.055, 0.025, z * 0.045); }
      break;
    }
    case 'kus': { /* sümsük kuşu (su altında, dalışta): iğ biçimli beyaz gövde, sarı baş, uzun sivri gaga; kanatlar gövdeye katlı, uçları siyah */
      const bm = M('#F7F6F2', { roughness: 0.55 }), gv = ekle(new THREE.SphereGeometry(0.5, 20, 12), bm); gv.scale.set(1, 0.2, 0.22);
      const bas = ekle(new THREE.SphereGeometry(0.1, 14, 10), M('#F0CF7E', { roughness: 0.6 })); bas.position.set(0.44, 0.01, 0); bas.scale.set(1.25, 0.95, 0.9);
      const gaga = ekle(new THREE.ConeGeometry(0.035, 0.32, 10).rotateZ(-Math.PI / 2), M('#AEB7BD', { roughness: 0.4 })); gaga.position.set(0.67, -0.005, 0);
      for (const z of [-1, 1]) { const g = ekle(new THREE.SphereGeometry(0.018, 8, 6), M('#101010')); g.position.set(0.5, 0.035, z * 0.06); }
      A.kanat = [];
      for (const z of [-1, 1]) { /* katlı kanat: gövdenin yanında uzun, ince, geriye uzanan; uç tüyleri siyah ve kuyruğun ötesine taşar */
        const sh = new THREE.Shape(); sh.moveTo(0.2, 0); sh.quadraticCurveTo(0, 0.07, -0.55, 0.02); sh.lineTo(-0.62, -0.005); sh.quadraticCurveTo(-0.1, -0.03, 0.2, 0);
        const kg = new THREE.ShapeGeometry(sh, 10); const g = new THREE.Group(); g.position.set(0.02, 0.02, z * 0.1); G.add(g);
        const k = ekle(kg, M('#F2F1EC', { side: THREE.DoubleSide, roughness: 0.6 }), g);
        const u = ekle(new THREE.ShapeGeometry((() => { const t = new THREE.Shape(); t.moveTo(-0.38, 0.03); t.lineTo(-0.62, -0.005); t.lineTo(-0.36, -0.02); t.closePath(); return t; })()), M('#151515', { side: THREE.DoubleSide }), g); u.position.z = z * 0.002;
        g.rotation.x = z * 0.15; A.kanat.push([g, z]); }
      const kuy = ekle(new THREE.ConeGeometry(0.05, 0.22, 8).rotateZ(Math.PI / 2), bm); kuy.position.set(-0.56, 0, 0); kuy.scale.set(1, 0.35, 1);
      A.balik = ekle(new THREE.CapsuleGeometry(0.035, 0.18, 4, 8).rotateZ(Math.PI / 2), M('#C9D9E6', { metalness: 0.5, roughness: 0.3 })); A.balik.position.set(0.85, -0.02, 0); A.balik.visible = false;
      break;
    }
    case 'cekic': { /* çekiç başlı köpekbalığı sürüsü: her birinin yüzme bükülmesi ayrı */
      const c2 = new THREE.Color();
      const pr = profil([[0, 0.1], [0.12, 0.27], [0.3, 0.62], [0.5, 0.95], [0.6, 1], [0.74, 0.9], [0.86, 0.66], [0.94, 0.46], [1, 0.3]]);
      const gg = govdeLoft({ X0: -0.5, X1: 0.44, ry: u => 0.095 * pr(u), rz: u => 0.08 * pr(u), yc: u => -0.004, renk: (u, sn, cs, col) => col.set('#E6EAE8').lerp(c2.set('#6E777A'), yumusak(sn, -0.55, -0.1)) });
      const finR = (v, bb, c) => c.set('#7A8285').lerp(c2.set('#4A5254'), yumusak(v.y / (bb.max.y || 1), 0.6, 1));
      const sirt = finEx(sekil(s => { s.moveTo(0.1, 0); s.bezierCurveTo(0.08, 0.1, 0.04, 0.2, -0.04, 0.3); s.bezierCurveTo(-0.04, 0.17, -0.06, 0.06, -0.1, 0.01); s.lineTo(-0.1, 0); s.closePath(); }), 0.007, finR); sirt.translate(0.06, 0.085, 0);
      const kuy = finEx(sekil(s => { s.moveTo(0.03, 0.012); s.bezierCurveTo(-0.05, 0.08, -0.13, 0.2, -0.2, 0.28); s.bezierCurveTo(-0.17, 0.17, -0.15, 0.08, -0.1, 0.0); s.bezierCurveTo(-0.13, -0.05, -0.15, -0.1, -0.16, -0.13); s.bezierCurveTo(-0.08, -0.08, -0.03, -0.04, 0.03, -0.012); s.closePath(); }), 0.006, finR); kuy.translate(-0.48, 0, 0);
      const gs = finEx(sekil(s => { s.moveTo(0.06, 0.01); s.bezierCurveTo(0.02, -0.06, -0.06, -0.15, -0.13, -0.2); s.bezierCurveTo(-0.08, -0.11, -0.07, -0.05, -0.06, 0); s.closePath(); }), 0.006, finR);
      /* çekiç: yukarıdan bakınca T biçimli yassı kanat, iki ucunda göz */
      const cek = finEx(sekil(s => { s.moveTo(0.045, 0); s.bezierCurveTo(0.055, 0.09, 0.04, 0.17, 0.015, 0.22); s.lineTo(-0.04, 0.21); s.bezierCurveTo(-0.025, 0.11, -0.04, 0.05, -0.07, 0); s.bezierCurveTo(-0.04, -0.05, -0.025, -0.11, -0.04, -0.21); s.lineTo(0.015, -0.22); s.bezierCurveTo(0.04, -0.17, 0.055, -0.09, 0.045, 0); }), 0.022, (v, bb, c) => c.set('#6A7376').lerp(c2.set('#4C5457'), yumusak(Math.abs(v.y) / 0.22, 0.6, 1))); cek.rotateX(Math.PI / 2); cek.translate(0.44, 0.0, 0);
      A.b = [];
      for (const [x, y, z, k, fz] of [[0.12, -0.04, 0, 1, 0], [-0.32, 0.16, -0.18, 0.86, 1.7], [-0.2, -0.22, 0.2, 0.8, 3.1], [-0.62, 0.02, 0.05, 0.74, 4.4]]) {
        const yuz = { faz: { value: 0 }, genlik: { value: 1 } }, SM = ek => malz(new THREE.MeshPhysicalMaterial(Object.assign({ color: '#ffffff', vertexColors: true, roughness: 0.4, clearcoat: 0.3 }, ek)), { yuz });
        const t = new THREE.Group(); t.position.set(x, -y, z); t.scale.setScalar(0.5 * k); G.add(t);
        for (const g of [gg, sirt, kuy, cek]) ekle(g, SM(), t);
        for (const zz of [-1, 1]) { const m = ekle(gs, SM(), t); m.position.set(0.18, -0.055, zz * 0.06); m.rotation.x = zz * -1.1; m.rotation.y = zz * 0.25; }
        for (const zz of [-1, 1]) { const g = ekle(new THREE.SphereGeometry(0.017, 10, 8), M('#050505', { roughness: 0.05 }), t); g.position.set(0.455, 0.006, zz * 0.215); }
        A.b.push({ yuz, fz, t }); }
      break;
    }
    case 'orka': case 'ispermecet': { /* balinalar: kuyruk yukarı-aşağı çırpar; gövde ve yüzgeçler aynı dikey bükülmeyi paylaşır */
      const c2 = new THREE.Color(), isp = tur === 'ispermecet';
      const birBalina = (ust, yuz) => {
        const D = new THREE.Group(); D.rotation.x = -Math.PI / 2; ust.add(D); /* bükülme z'de: geometri dikey ekseni z'ye çevrilir */
        const SM = ek => malz(new THREE.MeshPhysicalMaterial(Object.assign({ color: '#ffffff', vertexColors: true, roughness: isp ? 0.75 : 0.3, clearcoat: isp ? 0.05 : 0.5 }, ek)), { yuz });
        const dik = g => { g.rotateX(Math.PI / 2); return ekle(g, SM(), D); };
        if (!isp) {
          const pr = profil([[0, 0.08], [0.1, 0.22], [0.3, 0.62], [0.5, 0.95], [0.62, 1], [0.78, 0.92], [0.9, 0.72], [0.96, 0.48], [1, 0.05]]);
          dik(govdeLoft({ ry: u => 0.125 * pr(u), rz: u => 0.112 * pr(u), renk: (u, sn, cs, col) => {
            let w = 0; if (sn < -0.4 && u > 0.5 && u < 0.98) w = 1; if (u > 0.24 && u < 0.44 && sn < -0.1 + (u - 0.24) * 1.5 && sn > -0.8 && Math.abs(cs) > 0.35) w = 1; /* karın ve yan kanca */
            if (u > 0.8 && u < 0.9 && sn > 0.1 && sn < 0.45 && Math.abs(cs) > 0.55) w = 1; /* göz lekesi */
            col.set(w ? '#F4F4F0' : '#111315'); if (!w && u > 0.42 && u < 0.56 && sn > 0.82) col.set('#8C9196'); } }));
          const kara = (v, bb, c) => c.set('#111315');
          const sirt = finEx(sekil(s => { s.moveTo(0.06, 0); s.lineTo(-0.01, 0.24); s.quadraticCurveTo(-0.02, 0.1, -0.08, 0.0); s.closePath(); }), 0.01, kara); sirt.translate(0.02, 0.1, 0); dik(sirt);
          for (const zz of [-1, 1]) { const p = new THREE.SphereGeometry(1, 12, 8); p.scale(0.08, 0.012, 0.05); p.rotateX(zz * 0.5); p.rotateY(zz * 0.4); p.translate(0.2, -0.08, zz * 0.11); dik(renkle(p, (v, c) => c.set('#111315'))); }
        } else {
          const pr = u => u < 0.97 ? profil([[0, 0.06], [0.12, 0.24], [0.3, 0.52], [0.5, 0.8], [0.62, 0.94], [0.7, 1], [0.97, 1]])(u) : Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.97) / 0.03, 2)));
          const sav = !!o.savas;
          dik(govdeLoft({ NX: 110, ry: u => 0.1 * pr(u) * (u > 0.62 ? 1.05 : 1), rz: u => 0.082 * pr(u), yc: u => u > 0.62 ? 0.008 : 0, us: u => 2 + 2.4 * yumusak(u, 0.6, 0.74), renk: (u, sn, cs, col, x) => {
            col.set('#4A4541').lerp(c2.set('#5E5750'), yumusak(-sn, 0.3, 0.9));
            if (u < 0.62) col.multiplyScalar(0.85 + 0.15 * Math.sin(u * 140 + sn * 3)); /* kırışık deri */
            if (sav && u > 0.72 && Math.sin(u * 220) * Math.sin(sn * 24 + cs * 11) > 0.82) col.set('#D8D0C2'); /* vantuz izleri */ } }));
          const cn = new THREE.CapsuleGeometry(0.018, 0.25, 4, 8); cn.rotateZ(Math.PI / 2); cn.translate(0.31, -0.085, 0); dik(renkle(cn, (v, c) => c.set('#8C847A')));
          for (let i = 0; i < 4; i++) { const t = new THREE.ConeGeometry(0.006, 0.02, 4); t.translate(0.24 + i * 0.05, -0.07, 0); dik(renkle(t, (v, c) => c.set('#EDE8DC'))); }
          const hump = new THREE.SphereGeometry(1, 10, 6); hump.scale(0.05, 0.03, 0.03); hump.translate(-0.12, 0.1 * pr(0.38) + 0.008, 0); dik(renkle(hump, (v, c) => c.set('#45403C')));
          for (let i = 0; i < 4; i++) { const k = new THREE.SphereGeometry(0.014, 6, 4); k.translate(-0.24 - i * 0.045, 0.1 * pr(0.26 - i * 0.045) + 0.004, 0); dik(renkle(k, (v, c) => c.set('#45403C'))); }
          for (const zz of [-1, 1]) { const p = new THREE.SphereGeometry(1, 10, 6); p.scale(0.05, 0.01, 0.025); p.rotateY(zz * 0.5); p.translate(0.07, -0.07, zz * 0.085); dik(renkle(p, (v, c) => c.set('#3E3A37'))); }
          for (const zz of [-1, 1]) { const g = new THREE.SphereGeometry(0.008, 8, 6); g.translate(0.13, -0.035, zz * 0.083); dik(renkle(g, (v, c) => c.set('#0A0A0A'))); }
        }
        /* yatay kuyruk yüzgeci */
        const kr = isp ? '#3E3A37' : '#111315';
        const fl = finEx(sekil(s => { s.moveTo(0.02, 0); s.bezierCurveTo(-0.03, 0.04, -0.08, 0.1, -0.12, 0.14); s.quadraticCurveTo(-0.11, 0.06, -0.075, 0); s.quadraticCurveTo(-0.11, -0.06, -0.12, -0.14); s.bezierCurveTo(-0.08, -0.1, -0.03, -0.04, 0.02, 0); }), 0.006, (v, bb, c) => c.set(kr));
        fl.rotateX(Math.PI / 2); fl.translate(-0.47, 0, 0); dik(fl);
      };
      A.b = [];
      const grup = isp ? [[0, 0, 0, 1, 0]] : [[0.1, -0.03, 0, 1, 0], [-0.28, 0.1, -0.15, 0.8, 1.3], [-0.08, 0.16, 0.18, 0.55, 2.6]];
      for (const [x, y, z, k, fz] of grup) { const yuz = { faz: { value: 0 }, genlik: { value: 1.3 } }, t = new THREE.Group(); t.position.set(x, -y, z); t.scale.setScalar((isp ? 1 : 0.36) * k); G.add(t); birBalina(t, yuz); A.b.push({ yuz, fz, t }); }
      if (isp && o.savas) { /* dev kalamar başa sarılmış */
        const km = M('#B5523F', { roughness: 0.45 }), S = new THREE.Group(); S.position.set(0.36, -0.19, 0.02); G.add(S); A.kal = S;
        const man = lathe([[0, 0], [0.02, 0.03], [0.08, 0.045], [0.16, 0.035], [0.22, 0.012], [0.24, 0]], 14); man.rotateZ(-Math.PI * 0.42); ekle(renkle(man, (v, c) => c.set('#A8473A')), M('#ffffff', { vertexColors: true, roughness: 0.45 }), S).position.set(0, -0.02, 0);
        for (let i = 0; i < 8; i++) { const zz = (i % 2 ? 1 : -1), uz = 0.15 + (i % 4) * 0.04; const yol = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0.02 + i * 0.012, 0.1, zz * 0.06), new THREE.Vector3(0.04 + i * 0.015, 0.2 + i * 0.008, zz * 0.095), new THREE.Vector3(0.06 + i * 0.02 - uz * 0.3, 0.27, zz * 0.06)]);
          ekle(new THREE.TubeGeometry(yol, 16, 0.009 - i * 0.0005, 5), km, S); }
        for (const zz of [-1, 1]) { const yol = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.1, -0.08, zz * 0.04), new THREE.Vector3(-0.25, -0.05, zz * 0.06), new THREE.Vector3(-0.38, -0.12, zz * 0.03)]); ekle(new THREE.TubeGeometry(yol, 20, 0.005, 4), km, S); }
        goz(0.0, 0.0, 0.05, 0.016, S); }
      break;
    }
    case 'kilic': { const f = balik('kilic'); G.add(f.o); A.b = [{ ...f, i: 0 }]; break; }
    case 'palyacocift': case 'papagan': case 'kelebek': case 'barakuda': {
      const P = { palyacocift: ['palyaco', null, [[0.15, 0.05, 0], [-0.5, -0.2, 0.25]], 0.55], papagan: ['papagan', null, [[0, 0, 0]], 1], kelebek: ['melek', '#fff27a', [[0.1, 0, 0], [-0.5, 0.25, -0.3], [-0.6, -0.3, 0.25]], 0.5], barakuda: ['orkinos', '#d8e6ee', [[0, 0, 0], [-0.3, 0.25, -0.4], [-0.6, -0.2, 0.3], [0.2, -0.35, 0.5], [-0.9, 0.05, -0.1]], 0.42] }[tur];
      A.b = P[2].map(([x, y, z], i) => { const f = balik(P[0], P[1]); f.o.position.set(x, y, z); f.o.scale.setScalar(P[3]); if (tur === 'barakuda') f.o.scale.set(P[3] * 1.2, P[3] * 0.5, P[3] * 0.5); G.add(f.o); return { ...f, i }; });
      break;
    }
  }
  if (tur === 'kambur' && o.yavru) { const Y = yuzenUret('kambur', malz, balik, Object.assign({}, o, { yavru: 0 })); Y.scale.setScalar(0.4); Y.position.set(-0.1, -0.15, 0.14); G.add(Y); A.yavru = Y; } /* anne yanında yavru */
  G.userData.A = A; return G;
}
export function yuzenOyna(G, tur, o, t) {
  const A = G.userData.A, f = o.f || t;
  if (A.yavru) yuzenOyna(A.yavru, tur, Object.assign({}, o, { yavru: 0, f: f + 0.7 }), t);
  switch (tur) {
    case 'balon': { const sis = o.sis || 0; G.scale.multiplyScalar(1 + sis * 0.9); A.gov.scale.set(1.15 - sis * 0.15, 0.8 + sis * 0.35, 0.8 + sis * 0.35); A.diken.visible = sis > 0.2; A.diken.scale.setScalar(0.85 + sis * 0.4); break; }
    case 'kalamar': case 'devkalamar': for (const [g, a, uzun] of A.kol) { g.rotation.z = Math.sin(f * 3 + a) * 0.25 + Math.cos(a) * 0.25; g.rotation.y = Math.sin(f * 2.4 + a * 2) * (uzun ? 0.5 : 0.3) + Math.sin(a) * 0.3; } A.yz.forEach((k, i) => k.rotation.z = Math.sin(f * 4 + i) * 0.4); break;
    case 'dkaplumbaga': { /* ön yüzgeçler birlikte kanat çırpar gibi aşağı-geri süpürür; gövde hafifçe iner kalkar */
      const v = f * 1.15, st = Math.sin(v); G.rotation.x += 0.3;
      A.on.forEach(([g, z]) => { g.rotation.x = -z * (0.1 + st * 0.55); g.rotation.y = z * (0.45 + Math.cos(v) * 0.35); });
      A.ar.forEach(([g, z]) => { g.rotation.y = -z * (0.5 + Math.sin(v * 0.5 + z) * 0.15); g.rotation.x = -z * 0.1; });
      A.gov.position.y = -st * 0.02; A.gov.rotation.z = Math.cos(v) * 0.03; A.bas.rotation.z = Math.sin(v * 0.5) * 0.08; break;
    }
    case 'atik': { G.rotation.z += o.don || 0; if (A.p) A.p.scale.y = 1 + Math.sin(f * 3) * 0.08; break; }
    case 'hayaletAg': { const k = o.kes || 0; A.ip.forEach(([t, i]) => t.visible = i <= 6 - k); G.rotation.x = Math.sin(f * 0.7) * 0.15; G.rotation.y = Math.sin(f * 0.4) * 0.2; break; }
    case 'denizati': { A.govde.position.y = Math.sin(f * 1.6) * 0.03; A.govde.rotation.z = Math.sin(f * 0.9) * 0.08; A.yuz.scale.x = 1 + Math.sin(f * 30) * 0.25; break; }
    case 'manta': { /* hafif yatık (sırtı görünsün) ama asla yan yatmaz; kanatlar kökten uca dalgalanarak çırpar */
      G.rotation.x = 0.3 * Math.cos(G.rotation.y) + THREE.MathUtils.clamp(G.rotation.x, -0.5, 0.5) * 0.3; /* sırt hep kameraya dönük eğilir: sola giderken de (önceden karnını gösterip dikleşiyordu) */
      for (const [k, z, g] of A.k) { const p = g.attributes.position, y0 = g.userData.y0, S0 = g.userData.s, faz = f * 1.3;
        k.rotation.x = z * Math.sin(faz) * 0.1;
        for (let i = 0; i < p.count; i++) { const s = S0[i]; p.setY(i, y0[i] + Math.pow(s, 1.5) * 0.13 * Math.sin(faz - s * 1.6)); }
        p.needsUpdate = true; g.computeVertexNormals(); }
      if (A.ku) A.ku.rotation.y = Math.sin(f * 1.3 - 2) * 0.12;
      break; }
    case 'mola': A.s.rotation.y = Math.sin(f * 2) * 0.5; A.k.rotation.y = -Math.sin(f * 2) * 0.5; break;
    case 'fok': case 'dugong': A.kuyruk.rotation.z = Math.sin(f * (tur === 'fok' ? 5 : 2)) * 0.35; A.y.forEach(([k, z]) => k.rotation.y = Math.sin(f * 2 + z) * 0.3); A.gov.rotation.z = Math.sin(f * (tur === 'fok' ? 5 : 2) - 1) * 0.05; break;
    case 'balinakb': case 'kambur': A.kuyruk.rotation[tur === 'kambur' ? 'z' : 'y'] = Math.sin(f * 1.2) * 0.3; A.y.forEach(([k, z]) => { k.rotation.x = z * ((tur === 'balinakb' ? 0.3 : 0.5) + Math.sin(f * 0.8 + z) * 0.12); }); break;
    case 'kutu': A.kuyruk.rotation.y = Math.sin(f * 6) * 0.4; break;
    case 'aslan': A.y.forEach(([k, z]) => k.rotation.y = z * (0.2 + Math.sin(f * 1.2) * 0.15 + (o.tepki > 0 ? 0.4 : 0))); break;
    case 'dumbo': A.k.forEach(([k, z]) => k.rotation.y = Math.sin(f * 3) * 0.5 * z); A.etek.scale.set(1 + Math.sin(f * 1.5) * 0.12, 1, 1 + Math.sin(f * 1.5) * 0.12); break;
    case 'sifonofor': A.z.forEach((b, i) => { b.position.y = Math.sin(f * 0.8 - i * 0.25) * 0.04; b.position.z = Math.cos(f * 0.6 - i * 0.2) * 0.03; }); break;
    case 'pelikan': { const p = A.yol.points; p.forEach((v, i) => v.y = Math.sin(f * 2.5 - i * 0.6) * 0.04 * (i / 9)); A.gov.geometry.dispose(); A.gov.geometry = new THREE.TubeGeometry(A.yol, 40, 0.03, 6); A.uc.position.copy(p[9]); A.ag.scale.set(1, 1 + Math.sin(f * 1.5) * 0.15, 1 + Math.sin(f * 1.5) * 0.15); break; }
    case 'meduz': {
      const p = 1 + Math.sin(f * 2.2) * 0.12, r = 0.48 * p; A.can.scale.set(p, 1 / p, p);
      A.kol.forEach(([g, i]) => { g.rotation.x = Math.sin(f * 1.1 + i) * 0.18; g.rotation.z = Math.cos(f * 0.9 + i * 2) * 0.18; });
      for (const [l, a, L] of A.dok) { const pa = l.geometry.attributes.position; for (let j = 0; j < 12; j++) { const u = j / 11, sal = Math.sin(f * 2.4 - u * 5 + a * 3) * 0.06 * u; pa.setXYZ(j, Math.cos(a) * r * (1 - u * 0.15) + sal, -u * L + 0.02, Math.sin(a) * r * (1 - u * 0.15) + Math.cos(f * 2 - u * 4 + a) * 0.05 * u); } pa.needsUpdate = true; }
      break;
    }
    case 'kopekbaligi': A.yuz.faz.value = f * 5.5; A.yuz.genlik.value = 1.6; break;
    case 'sardalya1': A.b[0].yuz.faz.value = f * 12; break;
    case 'muren': { if (!A.ic) break; A.ic.rotation.y = -G.rotation.y; const iz = o.iz || []; /* boğumlar 2D gövde izinde */
      A.seg.forEach((m, i) => { const p = iz[i + 1] || iz[iz.length - 1] || [0, 0]; m.position.set(p[0], p[1], Math.sin(i * 0.7 + f * 3) * 0.01); const q = iz[i] || p; m.rotation.z = Math.atan2(q[1] - p[1], q[0] - p[0]); });
      const a = iz[1] ? Math.atan2(-iz[1][1], -iz[1][0]) : 0; A.bas.rotation.z = a; A.cene.position.y = -0.035 - (o.hamle ? 0.03 : 0.01 + 0.01 * Math.sin(f * 2.2)); break; }
    case 'kus': { const ac = o.aci || 0; G.rotation.z = -ac; /* dalış açısı */
      for (const [g, z] of A.kanat) g.rotation.x = z * (0.12 + (o.durum === 'cik' ? Math.sin(f * 6) * 0.08 : 0)); /* su altında kanat katlı; çıkarken hafif kımıldar */
      A.balik.visible = !!o.aldi; break; }
    case 'ks': A.b[0].yuz.faz.value = f * 9; if (A.b[0].yuz.genlik) A.b[0].yuz.genlik.value = o.hamle ? 1.8 : 1; break;
    case 'cekic': { const d = (o.d || 1) > 0 ? 1 : -1; for (const b of A.b) { b.yuz.faz.value = f * 5 + b.fz; b.t.rotation.x = d * (0.55 + Math.sin(f * 0.7 + b.fz) * 0.12); b.t.rotation.z = Math.sin(f * 0.5 + b.fz) * 0.06; } break; } /* yana yatık yüzer: çekiç başın T biçimi yandan da seçilsin */
    case 'orka': case 'ispermecet': for (const b of A.b) { b.yuz.faz.value = f * (tur === 'orka' ? 1.7 : 0.9) + b.fz; b.t.position.y += 0; } if (A.kal) { A.kal.rotation.z = Math.sin(f * 1.3) * 0.12; A.kal.rotation.x = Math.sin(f * 0.9) * 0.08; } break;
    case 'kilic': A.b[0].yuz.faz.value = f * 9; if (A.b[0].yuz.genlik) A.b[0].yuz.genlik.value = o.savur ? 2.2 : 1; G.rotation.z += o.savur ? Math.sin(f * 30) * 0.1 : 0; break;
    case 'palyacocift': case 'papagan': case 'kelebek': case 'barakuda': for (const b of A.b) { b.yuz.faz.value = f * 9 + b.i; b.o.position.y += Math.sin(f * 1.3 + b.i * 2) * 0.0015; } break;
  }
}

/* ======================= insanlar ve araçlar =======================
   Tekneler: boy 1, su çizgisi y = 0, gövde aşağıda (su altından görünen kısım).
   Dalgıçlar: baştan palete boy 1, yüzüstü (sırt +y), baş +x. Denizaltı boy 1, ROV genişlik 1. */
export function insanUret(tur, malz, ce = {}) {
  const G = new THREE.Group(), A = {}, M = (r, ek) => malz(new THREE.MeshStandardMaterial(Object.assign({ color: r, roughness: 0.55 }, ek)));
  const ekle = (geo, mat, ust = G) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; ust.add(m); return m; };
  const silindir = (r0, r1, L, mat, ust, seg = 10) => { const g = new THREE.CylinderGeometry(r1, r0, L, seg); g.rotateZ(-Math.PI / 2); g.translate(L / 2, 0, 0); return ekle(g, mat, ust); };
  const pervane = (x, y, r, mat) => { const g = new THREE.Group(); g.position.set(x, y, 0); G.add(g); for (let i = 0; i < 3; i++) { const k = ekle(new THREE.BoxGeometry(0.01, r, r * 0.35), mat, g); k.position.y = r / 2; const h = new THREE.Group(); h.rotation.x = i * Math.PI * 2 / 3; h.add(k); g.add(h); } return g; };
  const govde = (L, hd, en, renkFn) => { /* yarım elipsoit tekne gövdesi, pruva sivri */
    const g = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const sivri = x > 0 ? 1 - Math.pow(x, 2) * 0.55 : 1 - Math.pow(-x, 4) * 0.3; p.setXYZ(i, x * L / 2, y * hd, z * en * sivri); }
    g.computeVertexNormals(); return renkle(g, renkFn);
  };
  const vc = M('#ffffff', { vertexColors: true, roughness: 0.45 });
  switch (tur) {
    case 'balikci': {
      const ust = ce.ust || '#2A1C12', gov = ce.gov || '#5A4230', alt = ce.alt || '#7A2E24';
      ekle(govde(1, 0.2, 0.15, (v, c) => c.set(v.y < -0.13 ? alt : v.y > -0.025 ? ust : gov)), vc);
      const kl = ekle(new THREE.BoxGeometry(0.85, 0.035, 0.015), M(ust)); kl.position.y = -0.2;
      const dm = ekle(new THREE.BoxGeometry(0.03, 0.12, 0.012), M(ust)); dm.position.set(-0.49, -0.14, 0);
      A.p = pervane(-0.44, -0.16, 0.07, M('#B08D57', { metalness: 0.7, roughness: 0.3 })); break;
    }
    case 'yelkenli': {
      ekle(govde(1, 0.12, 0.17, (v, c) => c.set(v.y > -0.025 ? (ce.serit || '#1565C0') : (ce.gov || '#F4F6F8'))), vc);
      const om = M(ce.salma || '#37474F'); const sh = new THREE.Shape(); sh.moveTo(0.1, 0); sh.lineTo(0.02, -0.27); sh.lineTo(-0.06, -0.27); sh.lineTo(-0.04, 0); sh.closePath();
      ekle(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), om).position.set(0, -0.1, -0.01);
      const ag = ekle(new THREE.SphereGeometry(0.035, 12, 8), om); ag.scale.set(3, 1, 1); ag.position.set(-0.02, -0.38, 0);
      const ru = ekle(new THREE.BoxGeometry(0.04, 0.14, 0.012), M('#455A64')); ru.position.set(-0.38, -0.15, 0); break;
    }
    case 'surat': {
      ekle(govde(1, 0.15, 0.16, (v, c) => c.set(v.y > -0.03 ? (ce.ust || '#C62828') : v.y < -0.1 ? (ce.alt || '#90A4AE') : (ce.gov || '#FFFFFF'))), vc);
      const mm = M('#212121', { roughness: 0.35 }); const ay = ekle(new THREE.BoxGeometry(0.05, 0.2, 0.03), mm); ay.position.set(-0.53, -0.08, 0);
      A.p = pervane(-0.53, -0.2, 0.06, M('#cfd8dc', { metalness: 0.8, roughness: 0.25 })); break;
    }
    case 'sandal': { /* küçük kürekli sandal: tahta kaplama çizgileri, iki kürek iskeleden suya girer */
      const gov = ce.gov || '#9C6B3F', ust = ce.ust || '#5D3A1E', alt = ce.alt || '#6B4423';
      ekle(govde(1, 0.15, 0.22, (v, c) => c.set(v.y > -0.025 ? ust : v.y < -0.115 ? alt : (Math.abs((v.y * 60) % 2) < 0.18 ? alt : gov))), vc);
      const om = ekle(new THREE.BoxGeometry(0.8, 0.025, 0.02), M(alt)); om.position.y = -0.15;
      const km = M('#A1825C', { roughness: 0.7 }); A.kurek = [];
      for (const z of [-1, 1]) { const g = new THREE.Group(); g.position.set(0.05, 0.02, z * 0.2); G.add(g);
        const sap = ekle(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 6), km, g); sap.position.y = -0.31;
        const pala = ekle(new THREE.BoxGeometry(0.06, 0.16, 0.008), km, g); pala.position.y = -0.62; A.kurek.push([g, z]); }
      break;
    }
    case 'dalgic': case 'serbest': case 'snorkel': {
      const suit = M(ce.suit || (tur === 'snorkel' ? '#2B3A55' : '#1A1E26'), { roughness: 0.75 }), ten = M('#D9A27E'), fin = M((ce.palet && ce.palet[0]) || (tur === 'serbest' ? '#22262E' : '#1E88E5'), { roughness: 0.4 }), vur = M(ce.vurgu || '#26C6DA', { roughness: 0.6 });
      const g = new THREE.CapsuleGeometry(0.07, 0.34, 6, 12); g.rotateZ(Math.PI / 2); const t = ekle(g, suit); t.position.set(0.24, 0, 0); t.scale.set(1, 0.85, 1.15);
      const bas = ekle(new THREE.SphereGeometry(0.058, 16, 12), suit); bas.position.set(0.52, 0.01, 0);
      /* elbise deseni: yan şerit, bantlar ya da kamuflaj lekeleri */
      if (ce.desen === 'kamuflaj') { const r = ((i) => () => (i = (i * 16807) % 2147483647) / 2147483647)(7 + (ce.i || 0)), koyu = M('#2A3326', { roughness: 0.8 });
        for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, x = 0.06 + r() * 0.36, l = ekle(new THREE.SphereGeometry(0.022, 8, 6), i % 2 ? vur : koyu); l.scale.set(1.6, 0.5, 1); l.position.set(x, Math.cos(a) * 0.058, Math.sin(a) * 0.079); l.lookAt(x, 0, 0); l.rotateX(Math.PI / 2); } }
      else if (ce.desen === 'bant') { for (const x of [0.16, 0.32]) { const b = ekle(new THREE.CylinderGeometry(0.072, 0.072, 0.03, 16).rotateZ(Math.PI / 2), vur); b.position.x = x; b.scale.set(1, 0.86, 1.16); } }
      else if (tur !== 'snorkel') for (const z of [-1, 1]) { const b = ekle(new THREE.BoxGeometry(0.4, 0.018, 0.006), vur); b.position.set(0.24, -0.005, z * 0.079); }
      const mask = ekle(new THREE.BoxGeometry(0.03, 0.04, 0.08), malz(new THREE.MeshPhysicalMaterial({ color: '#9fd8ff', roughness: 0.05, metalness: 0.1, transmission: 0, clearcoat: 1 }))); mask.position.set(0.565, -0.01, 0);
      ekle(new THREE.BoxGeometry(0.008, 0.045, 0.085), M('#111')).position.set(0.55, -0.01, 0);
      if (tur === 'snorkel') { const s = ekle(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), vur); s.position.set(0.5, 0.09, 0.05); }
      if (tur === 'dalgic') {
        const tp = ekle(new THREE.CapsuleGeometry(0.035, 0.22, 4, 10).rotateZ(Math.PI / 2), M(ce.tup || '#FFD54F', { metalness: 0.3, roughness: 0.35 })); tp.position.set(0.24, 0.085, 0);
        const kam = ekle(new THREE.BoxGeometry(0.06, 0.05, 0.07), M('#263238')); kam.position.set(0.66, -0.05, 0); const ob = ekle(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 10).rotateZ(Math.PI / 2), M('#90CAF9', { roughness: 0.05 })); ob.position.set(0.705, -0.05, 0);
        for (const z of [-0.06, 0.06]) { const k = ekle(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 4), M('#37474F')); k.position.set(0.68, 0.0, z); k.rotation.x = z * 8; }
      }
      /* kollar: dalgıç kamerayı öne tutar, diğerleri yanında */
      for (const z of [-1, 1]) { const ko = new THREE.Group(); ko.position.set(0.4, -0.01, z * 0.08); G.add(ko); silindir(0.022, 0.018, 0.24, suit, ko, 8); ko.rotation.y = tur === 'dalgic' ? z * 0.25 : Math.PI - z * 0.15; ko.rotation.z = tur === 'dalgic' ? -0.25 : 0; const el = ekle(new THREE.SphereGeometry(0.02, 8, 6), ten, ko); el.position.x = 0.25; }
      /* bacaklar ve paletler: kalçadan sallanır */
      A.bacak = [];
      for (const z of [-1, 1]) {
        const b = new THREE.Group(); b.position.set(0.06, 0, z * 0.04); G.add(b); const ic = new THREE.Group(); b.add(ic); ic.rotation.y = Math.PI;
        silindir(0.032, 0.024, 0.22, suit, ic, 8); const diz = new THREE.Group(); diz.position.x = 0.22; ic.add(diz); silindir(0.024, 0.02, 0.2, suit, diz, 8);
        if (ce.desen === 'bant' && tur !== 'snorkel') { const bb = ekle(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10).rotateZ(Math.PI / 2), vur, ic); bb.position.x = 0.12; }
        const pl = new THREE.Shape(); const fl = tur === 'serbest' ? 0.34 : 0.2; pl.moveTo(0, -0.025); pl.lineTo(fl, -0.045); pl.lineTo(fl, 0.045); pl.lineTo(0, 0.025); pl.closePath();
        const pg = new THREE.ExtrudeGeometry(pl, { depth: 0.006, bevelEnabled: false }); pg.rotateX(Math.PI / 2); const pa = ekle(pg, fin, diz); pa.position.x = 0.2;
        A.bacak.push([b, diz, z]);
      }
      break;
    }
    case 'denizalti': { /* çeşide göre: gövde kalınlığı (h), renkler, lomboz sayısı, ön kubbe, yan iticiler (mini keşif denizaltısı) */
      const h = ce.h || 0.15, g3 = ce.g || ['#FFE082', '#B8860B', '#F5C542'], pen = ce.pen ?? 5, kb = ce.kubbe || 0.1;
      const gm = M(g3[2], { roughness: 0.35, metalness: 0.2 }), km = M(ce.kule || g3[2], { roughness: 0.4, metalness: 0.15 });
      const g = new THREE.CapsuleGeometry(h, Math.max(0.2, 1 - 2 * h), 8, 20); g.rotateZ(Math.PI / 2); ekle(g, gm);
      if (ce.it) { const kf = ekle(new THREE.BoxGeometry(0.34, 0.05, h * 1.1), km); kf.position.set(-0.04, h + 0.015, 0); const di = ekle(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 5), M('#37474F')); di.position.set(-0.12, h + 0.08, 0);
        for (const z of [-1, 1]) for (const y of [h * 0.45, -h * 0.45]) { const t = ekle(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12).rotateZ(Math.PI / 2), km); t.position.set(-0.33, y, z * (h + 0.025)); } }
      else { const ku = ekle(new THREE.BoxGeometry(0.22, 0.12, h * 0.7), km); ku.position.set(-0.06, h + 0.03, 0); }
      if (ce.cizgi) for (const z of [-1, 1]) { const b = ekle(new THREE.BoxGeometry(0.75, h * 0.2, 0.006), M(ce.cizgi)); b.position.set(0, -h * 0.35, z * h * 0.955); }
      const cam = malz(new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#F2C46B', emissiveIntensity: 1.2, roughness: 0.2 }));
      for (let i = 0; i < pen; i++) for (const z of [-1, 1]) { const p = ekle(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 14), cam); p.rotation.x = Math.PI / 2; p.position.set(-0.3 + i * (pen > 1 ? 0.6 / (pen - 1) * 0.92 : 0), 0, z * (h - 0.005)); }
      const kr = ce.it ? h * 0.95 : Math.max(0.12, h * 0.87);
      const kub = ekle(new THREE.SphereGeometry(kr, 18, 14, 0, Math.PI), malz(new THREE.MeshPhysicalMaterial({ color: '#b4e1ff', roughness: 0.05, transparent: true, opacity: 0.5 }))); kub.rotation.y = -Math.PI / 2; kub.position.x = 0.5 - h + (ce.it ? 0.02 : 0.15 - (kb - 0.1));
      if (ce.it) { const pil = ekle(new THREE.SphereGeometry(0.045, 10, 8), M('#455A64')); pil.position.set(kub.position.x + 0.05, 0.01, 0); }
      ekle(new THREE.TorusGeometry(0.08 * h / 0.15, 0.012, 6, 16).rotateY(Math.PI / 2), M('#5f5a4a')).position.x = -0.55;
      A.p = pervane(-0.55, 0, 0.12 * Math.min(1.2, h / 0.15), M('#8D6E00', { metalness: 0.6 })); break;
    }
    case 'rov': {
      const sar = M('#FFC107', { roughness: 0.4 }), kara = M('#1F1F1F', { roughness: 0.6 });
      ekle(new THREE.BoxGeometry(1, 0.3, 0.6), sar).position.y = 0.2;
      for (const [x, z] of [[-0.48, -0.28], [0.48, -0.28], [-0.48, 0.28], [0.48, 0.28]]) { const b = ekle(new THREE.BoxGeometry(0.04, 0.36, 0.04), kara); b.position.set(x, -0.1, z); }
      for (const z of [-0.28, 0.28]) ekle(new THREE.BoxGeometry(1, 0.04, 0.04), kara).position.set(0, -0.27, z);
      A.it = []; for (const [x, z] of [[-0.42, -0.36], [-0.42, 0.36], [0.3, -0.36], [0.3, 0.36]]) { const t = ekle(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 12).rotateZ(Math.PI / 2), M('#2B2B2B')); t.position.set(x, 0, z); A.it.push(t); }
      const isik = malz(new THREE.MeshStandardMaterial({ color: '#ECEFF1', emissive: '#E6F5FF', emissiveIntensity: 2 }));
      for (const z of [-0.18, 0.18]) ekle(new THREE.SphereGeometry(0.05, 10, 8), isik).position.set(0.5, 0.05, z);
      ekle(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI), M('#FF7043')).position.set(0.5, -0.02, 0);
      A.kol = new THREE.Group(); A.kol.position.set(0.3, -0.25, 0); G.add(A.kol); silindir(0.02, 0.02, 0.3, M('#90A4AE', { metalness: 0.6 }), A.kol, 6); break;
    }
  }
  G.userData.A = A; return G;
}
export function insanOyna(G, tur, o, t) {
  const A = G.userData.A, f = o.f || t;
  if (A.p) A.p.rotation.x = f * (tur === 'surat' ? 40 : 10) * (o.donsun === false ? 0 : 1);
  if (A.bacak) { const hz = tur === 'serbest' ? 2.2 : tur === 'snorkel' ? 1.7 : 2.8; for (const [b, diz, z] of A.bacak) { const k = Math.sin(f * hz + (z > 0 ? 0 : Math.PI)); b.rotation.z = k * 0.28; diz.rotation.z = -Math.max(0, k) * 0.35; } }
  if (A.it) A.it.forEach((it, i) => it.rotation.x = f * 20 + i);
  if (A.kol) A.kol.rotation.z = -0.4 - Math.sin(f * 0.8) * 0.3;
  if (A.kurek) { const a = f * 1.7; for (const [g, z] of A.kurek) { g.rotation.z = Math.cos(a) * 0.55; g.rotation.x = -z * (0.55 - Math.max(0, Math.sin(a)) * 0.35); } } /* kürek: geriye süpürür, suda iken dik, havada iken yana kalkık */
}
