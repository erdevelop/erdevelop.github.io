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
