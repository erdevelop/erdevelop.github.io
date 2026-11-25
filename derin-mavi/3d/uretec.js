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
  karanfil: [['#d8c9d2', '#ff4f8b'], ['#d6cfc2', '#ff7a3a'], ['#cfd2dc', '#a66bff'], ['#d9d2c8', '#ff3b5c'], ['#d3d8cf', '#ffd23f']]
};

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
  const yMax = tur === 'kirbac' ? 1.2 : 1;
  const renkFn = tur === 'karanfil' ? ((v, col) => { const u = Math.min(1, Math.max(0, v.y) / 1.05); col.copy(ra).lerp(rb, Math.pow(u, 3) * 1.0); }) : renkY(yMax, tur === 'parmak' ? 2.2 : 1.5);
  const g = mergeGeometries(parca.map(p => boya(p.toNonIndexed ? p.toNonIndexed() : p, renkFn, v => Math.max(0, v.y) * (tur === 'kirbac' ? 0.35 : 0.12), r() * 6.28)));
  if (tur === 'karanfil') { /* polipler: üst bölgedeki küçük topları uç rengine boya */
    const c = g.attributes.color, p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0.62) { tmp.copy(rb).offsetHSL(0, 0, (Math.sin(i) * 0.06)); c.setXYZ(i, tmp.r, tmp.g, tmp.b); } }
  }
  g.computeVertexNormals(); g.computeBoundingBox();
  const h = g.boundingBox.max.y || 1; g.scale(1 / h, 1 / h, 1 / h);
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
    case 'istiridye': { A.kapak.rotation.x = -(0.35 + Math.sin(t * 1.5) * 0.25); A.inci.scale.setScalar(1 + Math.sin(t * 3) * 0.05); break; }
  }
}

/* ======================= yüzen canlılar ve ziyaretçiler =======================
   Hepsi +x yönüne bakar, boyları yaklaşık 1 birim (2D'deki s), merkezleri orijinde. */
function lathe(profil, seg = 20) { /* profil: [[x, r], ...] x ekseni boyunca dönel gövde */
  const g = new THREE.LatheGeometry(profil.map(([x, r]) => new THREE.Vector2(Math.max(0.0005, r), x)), seg); g.rotateZ(-Math.PI / 2); return g;
}
function renkle(g, fn) { const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(), v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v, col); c.set([col.r, col.g, col.b], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
function yuzgec(noktalar, kalin = 0.01) { const sh = new THREE.Shape(); noktalar.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: kalin, bevelEnabled: false }); g.translate(0, 0, -kalin / 2); return g; }

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
    case 'manta': { /* manta: geniş baklava kanatlar, ağız yüzgeçleri, ince kuyruk */
      const ust = M('#2C3440', { roughness: 0.6 }), alt = M('#E9EDF0', { roughness: 0.6 });
      ekle(new THREE.SphereGeometry(0.18, 16, 10), ust).scale.set(1.6, 0.45, 1.2);
      A.k = [1, -1].map(z => { const g = new THREE.Group(); G.add(g); const ss = new THREE.Shape(); ss.moveTo(0.24, 0); ss.quadraticCurveTo(0.12, z * 0.5, -0.04, z * 0.66); ss.quadraticCurveTo(-0.12, z * 0.42, -0.26, z * 0.08); ss.lineTo(-0.26, 0); ss.closePath();
        const sh = new THREE.ExtrudeGeometry(ss, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2, curveSegments: 10 }); sh.translate(0, 0, -0.01); sh.rotateX(Math.PI / 2); const m = ekle(sh, ust, g); const m2 = ekle(sh.clone(), alt, g); m2.position.y = -0.03; return [g, z]; });
      for (const z of [-0.12, 0.12]) { const c = ekle(new THREE.CylinderGeometry(0.02, 0.035, 0.16, 6), ust); c.rotation.z = Math.PI / 2; c.position.set(0.32, -0.01, z); }
      const ku = ekle(new THREE.CylinderGeometry(0.004, 0.012, 0.5, 4), ust); ku.rotation.z = Math.PI / 2; ku.position.x = -0.45;
      goz(0.24, 0.02, -0.16, 0.022); goz(0.24, 0.02, 0.16, 0.022);
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
      A.y = [1, -1].map(z => { const k = kanat(G, kb ? 0.18 : 0.22, -0.06, z * 0.1, yuzgec(kb ? [[0, 0], [0.03, -0.03], [-0.08, -0.22], [-0.12, -0.2]] : [[0, 0], [0.03, -0.03], [-0.1, -0.5], [-0.15, -0.48]], 0.02), kb ? fm : M('#e3e6e4')); k.rotation.x = z * 1.25; return [k, z]; });
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
          col.set('#E6EAE8').lerp(c2.set('#6F7C80'), sirt).lerp(c2.set('#DDE2E0'), dil * 0.22);
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
    case 'palyacocift': case 'papagan': case 'kelebek': case 'barakuda': {
      const P = { palyacocift: ['palyaco', null, [[0.15, 0.05, 0], [-0.5, -0.2, 0.25]], 0.55], papagan: ['cerrah', '#7dffd0', [[0, 0, 0]], 1], kelebek: ['melek', '#fff27a', [[0.1, 0, 0], [-0.5, 0.25, -0.3], [-0.6, -0.3, 0.25]], 0.5], barakuda: ['orkinos', '#d8e6ee', [[0, 0, 0], [-0.3, 0.25, -0.4], [-0.6, -0.2, 0.3], [0.2, -0.35, 0.5], [-0.9, 0.05, -0.1]], 0.42] }[tur];
      A.b = P[2].map(([x, y, z], i) => { const f = balik(P[0], P[1]); f.o.position.set(x, y, z); f.o.scale.setScalar(P[3]); if (tur === 'barakuda') f.o.scale.set(P[3] * 1.2, P[3] * 0.5, P[3] * 0.5); G.add(f.o); return { ...f, i }; });
      break;
    }
  }
  G.userData.A = A; return G;
}
export function yuzenOyna(G, tur, o, t) {
  const A = G.userData.A, f = o.f || t;
  switch (tur) {
    case 'balon': { const sis = o.sis || 0; G.scale.multiplyScalar(1 + sis * 0.9); A.gov.scale.set(1.15 - sis * 0.15, 0.8 + sis * 0.35, 0.8 + sis * 0.35); A.diken.visible = sis > 0.2; A.diken.scale.setScalar(0.85 + sis * 0.4); break; }
    case 'kalamar': case 'devkalamar': for (const [g, a, uzun] of A.kol) { g.rotation.z = Math.sin(f * 3 + a) * 0.25 + Math.cos(a) * 0.25; g.rotation.y = Math.sin(f * 2.4 + a * 2) * (uzun ? 0.5 : 0.3) + Math.sin(a) * 0.3; } A.yz.forEach((k, i) => k.rotation.z = Math.sin(f * 4 + i) * 0.4); break;
    case 'dkaplumbaga': { /* ön yüzgeçler birlikte kanat çırpar gibi aşağı-geri süpürür; gövde hafifçe iner kalkar */
      const v = f * 1.15, st = Math.sin(v); G.rotation.x += 0.3;
      A.on.forEach(([g, z]) => { g.rotation.x = -z * (0.1 + st * 0.55); g.rotation.y = z * (0.45 + Math.cos(v) * 0.35); });
      A.ar.forEach(([g, z]) => { g.rotation.y = -z * (0.5 + Math.sin(v * 0.5 + z) * 0.15); g.rotation.x = -z * 0.1; });
      A.gov.position.y = -st * 0.02; A.gov.rotation.z = Math.cos(v) * 0.03; A.bas.rotation.z = Math.sin(v * 0.5) * 0.08; break;
    }
    case 'manta': G.rotation.x += 0.45; A.k.forEach(([g, z]) => g.rotation.x = z * Math.sin(f * 1.4) * 0.35); break; /* hafif yatık: sırtı ve kanatları görünsün */
    case 'mola': A.s.rotation.y = Math.sin(f * 2) * 0.5; A.k.rotation.y = -Math.sin(f * 2) * 0.5; break;
    case 'fok': case 'dugong': A.kuyruk.rotation.z = Math.sin(f * (tur === 'fok' ? 5 : 2)) * 0.35; A.y.forEach(([k, z]) => k.rotation.y = Math.sin(f * 2 + z) * 0.3); A.gov.rotation.z = Math.sin(f * (tur === 'fok' ? 5 : 2) - 1) * 0.05; break;
    case 'balinakb': case 'kambur': A.kuyruk.rotation[tur === 'kambur' ? 'z' : 'y'] = Math.sin(f * 1.2) * 0.3; A.y.forEach(([k, z]) => k.rotation.y = Math.sin(f * 0.8 + z) * 0.15); break;
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
    case 'palyacocift': case 'papagan': case 'kelebek': case 'barakuda': for (const b of A.b) { b.yuz.faz.value = f * 9 + b.i; b.o.position.y += Math.sin(f * 1.3 + b.i * 2) * 0.0015; } break;
  }
}

/* ======================= insanlar ve araçlar =======================
   Tekneler: boy 1, su çizgisi y = 0, gövde aşağıda (su altından görünen kısım).
   Dalgıçlar: baştan palete boy 1, yüzüstü (sırt +y), baş +x. Denizaltı boy 1, ROV genişlik 1. */
export function insanUret(tur, malz) {
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
      ekle(govde(1, 0.2, 0.15, (v, c) => c.set(v.y < -0.13 ? '#7A2E24' : v.y > -0.025 ? '#2A1C12' : '#5A4230')), vc);
      const kl = ekle(new THREE.BoxGeometry(0.85, 0.035, 0.015), M('#2A1C12')); kl.position.y = -0.2;
      const dm = ekle(new THREE.BoxGeometry(0.03, 0.12, 0.012), M('#2A1C12')); dm.position.set(-0.49, -0.14, 0);
      A.p = pervane(-0.44, -0.16, 0.07, M('#B08D57', { metalness: 0.7, roughness: 0.3 })); break;
    }
    case 'yelkenli': {
      ekle(govde(1, 0.12, 0.17, (v, c) => c.set(v.y > -0.025 ? '#1565C0' : '#F4F6F8')), vc);
      const om = M('#37474F'); const sh = new THREE.Shape(); sh.moveTo(0.1, 0); sh.lineTo(0.02, -0.27); sh.lineTo(-0.06, -0.27); sh.lineTo(-0.04, 0); sh.closePath();
      ekle(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), om).position.set(0, -0.1, -0.01);
      const ag = ekle(new THREE.SphereGeometry(0.035, 12, 8), om); ag.scale.set(3, 1, 1); ag.position.set(-0.02, -0.38, 0);
      const ru = ekle(new THREE.BoxGeometry(0.04, 0.14, 0.012), M('#455A64')); ru.position.set(-0.38, -0.15, 0); break;
    }
    case 'surat': {
      ekle(govde(1, 0.15, 0.16, (v, c) => c.set(v.y > -0.03 ? '#C62828' : v.y < -0.1 ? '#90A4AE' : '#FFFFFF')), vc);
      const mm = M('#212121', { roughness: 0.35 }); const ay = ekle(new THREE.BoxGeometry(0.05, 0.2, 0.03), mm); ay.position.set(-0.53, -0.08, 0);
      A.p = pervane(-0.53, -0.2, 0.06, M('#cfd8dc', { metalness: 0.8, roughness: 0.25 })); break;
    }
    case 'dalgic': case 'serbest': case 'snorkel': {
      const suit = M(tur === 'snorkel' ? '#2B3A55' : '#1A1E26', { roughness: 0.75 }), ten = M('#D9A27E'), fin = M(tur === 'serbest' ? '#22262E' : '#1E88E5', { roughness: 0.4 });
      const g = new THREE.CapsuleGeometry(0.07, 0.34, 6, 12); g.rotateZ(Math.PI / 2); const t = ekle(g, suit); t.position.set(0.24, 0, 0); t.scale.set(1, 0.85, 1.15);
      const bas = ekle(new THREE.SphereGeometry(0.058, 16, 12), suit); bas.position.set(0.52, 0.01, 0);
      const mask = ekle(new THREE.BoxGeometry(0.03, 0.04, 0.08), malz(new THREE.MeshPhysicalMaterial({ color: '#9fd8ff', roughness: 0.05, metalness: 0.1, transmission: 0, clearcoat: 1 }))); mask.position.set(0.565, -0.01, 0);
      ekle(new THREE.BoxGeometry(0.008, 0.045, 0.085), M('#111')).position.set(0.55, -0.01, 0);
      if (tur === 'snorkel') { const s = ekle(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), M('#FFD54F')); s.position.set(0.5, 0.09, 0.05); }
      if (tur === 'dalgic') {
        const tp = ekle(new THREE.CapsuleGeometry(0.035, 0.22, 4, 10).rotateZ(Math.PI / 2), M('#FFD54F', { metalness: 0.3, roughness: 0.35 })); tp.position.set(0.24, 0.085, 0);
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
        const pl = new THREE.Shape(); const fl = tur === 'serbest' ? 0.34 : 0.2; pl.moveTo(0, -0.025); pl.lineTo(fl, -0.045); pl.lineTo(fl, 0.045); pl.lineTo(0, 0.025); pl.closePath();
        const pg = new THREE.ExtrudeGeometry(pl, { depth: 0.006, bevelEnabled: false }); pg.rotateX(Math.PI / 2); const pa = ekle(pg, fin, diz); pa.position.x = 0.2;
        A.bacak.push([b, diz, z]);
      }
      break;
    }
    case 'denizalti': {
      const sar = M('#F5C542', { roughness: 0.35, metalness: 0.2 });
      const g = new THREE.CapsuleGeometry(0.15, 0.72, 8, 20); g.rotateZ(Math.PI / 2); ekle(g, sar);
      const ku = ekle(new THREE.BoxGeometry(0.22, 0.12, 0.1), sar); ku.position.set(-0.06, 0.18, 0);
      const cam = malz(new THREE.MeshStandardMaterial({ color: '#FFF3C4', emissive: '#F2C46B', emissiveIntensity: 1.2, roughness: 0.2 }));
      for (let i = 0; i < 5; i++) for (const z of [-1, 1]) { const p = ekle(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 14), cam); p.rotation.x = Math.PI / 2; p.position.set(-0.3 + i * 0.15, 0, z * 0.145); }
      const kub = ekle(new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI), malz(new THREE.MeshPhysicalMaterial({ color: '#b4e1ff', roughness: 0.05, transparent: true, opacity: 0.55 }))); kub.rotation.y = -Math.PI / 2; kub.position.x = 0.5;
      ekle(new THREE.TorusGeometry(0.08, 0.012, 6, 16).rotateY(Math.PI / 2), M('#8D6E00')).position.x = -0.55;
      A.p = pervane(-0.55, 0, 0.12, M('#8D6E00', { metalness: 0.6 })); break;
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
}
