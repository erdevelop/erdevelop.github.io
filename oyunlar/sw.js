/* Oyun Bahçesi — Service Worker (offline oynanabilirlik)
   Sürüm değişince eski önbellek silinir. Uygulama kabuğu + oyunlar + three.js önbelleğe alınır. */
const VERSION = 'ob-v4';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/styles.css',
  './assets/config.js',
  './assets/fx.js',
  './assets/store.js',
  './assets/auth.js',
  './assets/daily.js',
  './assets/progress.js',
  './assets/app.js',
  './assets/favicon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './games/_engine.js',
  './games/3d-kosu.js','./games/3d-tugla.js','./games/3d-kule.js','./games/3d-karsiya.js',
  './games/3d-top.js','./games/3d-labirent.js','./games/yilan.js','./games/mayin.js','./games/matematik.js',
  './games/gunluk-kelime.js','./games/bir-islem.js','./games/sudoku.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  // Gezinme isteği → önce ağ, olmazsa önbellekteki index
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).catch(()=>caches.match('./index.html')));
    return;
  }
  // Aynı origin → önbellekteki kopya hemen verilir, arkada ağdan tazelenir (güncellemeler bir sonraki açılışta gelir).
  // Yalnızca sağlam (200) yanıtlar saklanır.
  if(url.origin===location.origin){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(res=>{ if(res.ok){ const copy=res.clone(); caches.open(VERSION).then(c=>c.put(req,copy)); } return res; });
      if(hit){ e.waitUntil(net.catch(()=>{})); return hit; }
      return net.catch(()=>hit);
    }));
    return;
  }
  // Çapraz origin (three.js, Google Fonts) → sürümlü kütüphaneler; önbellekte sağlam kopya varsa o, yoksa ağ (yalnızca sağlam yanıt saklanır)
  e.respondWith(caches.match(req).then(hit=> (hit && hit.ok) ? hit : fetch(req).then(res=>{
    if(res.ok && res.type==='cors'){ const copy=res.clone(); caches.open(VERSION).then(c=>c.put(req,copy)); }
    return res;
  }).catch(()=>hit || Response.error())));
});
