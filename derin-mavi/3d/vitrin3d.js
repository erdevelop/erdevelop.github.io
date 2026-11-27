/* Derin Mavi — canlı rehberi vitrini: albümdeki bir canlının 3D modelini küçük bir tuvalde döndürerek gösterir.
   Balıklar balik/<tür>.glb dosyalarından, diğer canlılar uretec.js'teki yordamsal modellerden gelir. */
import * as THREE from './three.module.min.js';
import { balikGlb } from './yukleyici.js';
import { canliUret, canliOyna, yuzenUret, yuzenOyna } from './uretec.js';

const ZEMIN = ['yildiz', 'salyangoz', 'ermit', 'ahtapot', 'karides', 'dvatoz', 'yengec', 'istiridye', 'kumyilan', 'nudibrans', 'kestane', 'hiyar', 'mantis', 'murekkep', 'baca'];

/* tur: { balik: 'palyaco' } ya da { canli: 'manta' } */
export async function vitrin(tuval, tur) {
  const R = new THREE.WebGLRenderer({ canvas: tuval, antialias: true, alpha: true }); R.setPixelRatio(Math.min(2, devicePixelRatio || 1)); R.setSize(tuval.clientWidth || 300, tuval.clientHeight || 200, false); R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.NeutralToneMapping;
  const S = new THREE.Scene(), K = new THREE.PerspectiveCamera(32, (tuval.clientWidth || 300) / (tuval.clientHeight || 200), 0.01, 50);
  S.add(new THREE.HemisphereLight('#e6fbff', '#24506a', 2.2)); const g = new THREE.DirectionalLight('#fff4e0', 2.6); g.position.set(2, 4, 3); S.add(g); const a = new THREE.DirectionalLight('#8fd8ff', 1.1); a.position.set(-3, -1, -2); S.add(a);
  const kok = new THREE.Group(); S.add(kok);
  let obje, oyna = null;
  const malz = m => m;
  if (tur.balik) {
    const kaynak = (await balikGlb(tur.balik)) || (await balikGlb('sardalya'));
    obje = kaynak.clone(true); obje.position.set(0, 0, 0);
  } else if (ZEMIN.includes(tur.canli)) { obje = canliUret(tur.canli, malz, { renk: '#FF8A5B', hue: 20 }); oyna = t => canliOyna(obje, tur.canli, { f: t, hue: 20, aci: t * 0.1 }, t); }
  else {
    /* önce hangi balık modellerine gerektiğini bul, hepsini indir, sonra asıl modeli kur */
    const gerek = new Set(['sardalya']); try { yuzenUret(tur.canli, malz, k => { gerek.add(k); return { o: new THREE.Group(), yuz: { faz: { value: 0 }, genlik: { value: 1 } } }; }, { renk: '#F3B6E8' }); } catch (e) { }
    const M = {}; await Promise.all([...gerek].map(async k => { M[k] = await balikGlb(k); }));
    const balik = (k, ton) => { const o = (M[k] || M.sardalya || new THREE.Group()).clone(true); o.position.set(0, 0, 0); if (ton) { const c = new THREE.Color(ton); o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiply(c); } }); } return { o, yuz: { faz: { value: 0 }, genlik: { value: 1 } } }; };
    obje = yuzenUret(tur.canli, malz, balik, { renk: '#F3B6E8' }); oyna = t => yuzenOyna(obje, tur.canli, { f: t, sis: 0 }, t);
  }
  kok.add(obje);
  /* çerçeveye sığdır */
  oyna && oyna(0); const kutu = new THREE.Box3().setFromObject(obje), boy = kutu.getSize(new THREE.Vector3()), mer = kutu.getCenter(new THREE.Vector3());
  obje.position.sub(mer); const r = Math.max(boy.x, boy.y * 1.4, boy.z) * 0.62; K.position.set(0, r * 0.35, r * 2.6); K.lookAt(0, 0, 0);
  let calis = true, t0 = performance.now();
  const kare = () => { if (!calis) return; if (!tuval.isConnected) { calis = false; R.dispose(); return; } const t = (performance.now() - t0) / 1000; kok.rotation.y = t * 0.6; oyna && oyna(t); R.render(S, K); requestAnimationFrame(kare); };
  kare();
  return () => { calis = false; R.dispose(); };
}
