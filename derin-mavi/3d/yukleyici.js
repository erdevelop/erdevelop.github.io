/* Derin Mavi — model yükleyici.
   baliklar.glb ve resif.glb meshopt ile sıkıştırılmış ve nicemlenmiş (KHR_mesh_quantization) gelir: dosyalar
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
