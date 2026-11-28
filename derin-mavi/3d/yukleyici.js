/* Derin Mavi — model yükleyici.
   balik/<tür>.glb ve resif.glb meshopt ile sıkıştırılmış ve nicemlenmiş (KHR_mesh_quantization) gelir: dosyalar
   yaklaşık 4 kat küçüktür, çözme çok hızlıdır. Nicemleme her parçaya bir ölçek/öteleme ekler; oyun parçaların
   yerel koordinatlarıyla çalıştığı için (yüzme kıvrımı, yerleşim, kaya yükseklikleri) yüklerken bu dönüşüm
   geometriye işlenir ve özellikler yeniden kayan noktalı sayıya çevrilir. Kaynak modellerde parçaların kendi
   dönüşümü yoktur, yani sonuç sıkıştırılmamış dosyayla birebir aynı yapıdadır. */
import * as THREE from './three.module.min.js';
import { GLTFLoader } from './addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './addons/libs/meshopt_decoder.module.js';

const BIR = new THREE.Matrix4();
function duzle(kok) {
  kok.traverse(m => {
    if (!m.isMesh) return; const G = m.geometry;
    for (const ad of Object.keys(G.attributes)) {
      const a = G.attributes[ad]; if (a.isBufferAttribute && a.array instanceof Float32Array && !a.normalized) continue;
      const n = a.count, k = a.itemSize, f = new Float32Array(n * k), al = [a.getX, a.getY, a.getZ, a.getW];
      for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) f[i * k + j] = al[j].call(a, i);
      G.setAttribute(ad, new THREE.BufferAttribute(f, k));
    }
    m.updateMatrix();
    if (!m.matrix.equals(BIR)) { G.applyMatrix4(m.matrix); m.position.set(0, 0, 0); m.quaternion.identity(); m.scale.set(1, 1, 1); m.updateMatrix(); }
    G.computeBoundingBox(); G.computeBoundingSphere();
  });
}
export function glbYukle(url) {
  const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
  return new Promise((ok, hata) => L.load(url, g => { duzle(g.scene); ok(g); }, undefined, hata));
}

/* BALIK MODELLERİ: her tür ayrı bir dosyada (balik/<tür>.glb). Yalnızca sahnede gerçekten görünen türler iner;
   inene kadar yerine sardalya modeli durur, inince kendiliğinden değişir. */
export const MODEL = {}; const MODEL_P = {};
/* yassı balıklar (melek, flama, tetik…) yandan bakınca kâğıt gibi görünmesin: GÖVDE kalınlığı yüksekliğinin %42'sinden
   azsa gövde enine (z) kalınlaştırılır (en çok 3 kat); gözler ve göğüs yüzgeçleri de gövdenin yeni yüzeyine taşınır.
   Sırt, karın ve kuyruk yüzgeçleri ortada durduğu için olduğu gibi kalır. Geometriye bir kez işlenir, bütün kopyalar paylaşır. */
const KALIN = 0.42, KALIN_MAX = 3;
function kalinlastir(o) {
  let govde = null; o.traverse(m => { if (m.isMesh && /govde/.test(m.name)) govde = m; });
  if (!govde) { o.traverse(m => { if (m.isMesh && (!govde || m.geometry.attributes.position.count > govde.geometry.attributes.position.count)) govde = m; }); }
  if (!govde) return; govde.geometry.computeBoundingBox(); const b = govde.geometry.boundingBox, sy = b.max.y - b.min.y, sz = b.max.z - b.min.z;
  if (!(sy > 0) || !(sz > 0)) return; const k = Math.min(KALIN_MAX, KALIN / (sz / sy)); if (k <= 1.05) return;
  const cz = (b.min.z + b.max.z) / 2, M = new THREE.Matrix4().makeTranslation(0, 0, cz).multiply(new THREE.Matrix4().makeScale(1, 1, k)).multiply(new THREE.Matrix4().makeTranslation(0, 0, -cz));
  const gor = new Set(); o.traverse(m => { if (!m.isMesh || gor.has(m.geometry)) return; gor.add(m.geometry); const g = m.geometry;
    if (m === govde) g.applyMatrix4(M);
    else if (/goz|gogus/.test(m.name)) { g.computeBoundingBox(); const mz = (g.boundingBox.min.z + g.boundingBox.max.z) / 2; g.translate(0, 0, (mz - cz) * (k - 1)); }
    else return;
    g.computeBoundingBox(); g.computeBoundingSphere(); });
}
export function balikGlb(k) { return MODEL_P[k] || (MODEL_P[k] = glbYukle(new URL('./balik/' + k + '.glb', import.meta.url).href).then(g => { const o = g.scene.getObjectByName('balik_' + k) || g.scene.children[0]; if (o) { kalinlastir(o); MODEL[k] = o; } return o || null; }).catch(() => null)); }
