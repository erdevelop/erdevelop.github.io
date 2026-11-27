/* Derin Mavi: sıkıştırılmış baliklar.glb dosyasını tür tür ayrı GLB dosyalarına böler (balik/<tür>.glb).
   Gerekenler: npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
   Kullanım: node balik_bol.mjs baliklar-sikis.glb ../../derin-mavi/3d/balik */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const [kaynak, hedef] = process.argv.slice(2);
const doc0 = await io.read(kaynak);
const adlar = doc0.getRoot().listScenes()[0].listChildren().map(n => n.getName()).filter(n => n.startsWith('balik_'));
fs.mkdirSync(hedef, { recursive: true }); let top = 0;
for (const ad of adlar) {
  const doc = await io.read(kaynak); const sc = doc.getRoot().listScenes()[0];
  for (const n of sc.listChildren()) if (n.getName() !== ad) { n.traverse(x => x.dispose()); }
  await doc.transform(prune(), dedup());
  doc.getRoot().listExtensionsUsed().filter(e => e.extensionName === 'EXT_meshopt_compression').forEach(e => e.setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE }));
  const out = `${hedef}/${ad.slice(6)}.glb`; await io.write(out, doc); const b = fs.statSync(out).size; top += b; console.log(ad, b);
}
console.log('toplam', top);
