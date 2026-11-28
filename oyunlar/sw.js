/* Oyun Bahçesi — Service Worker (offline oynanabilirlik)
   Sürüm değişince eski önbellek silinir. Uygulama kabuğu + oyunlar + three.js önbelleğe alınır. */
const VERSION = 'ob-v45';
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
  './assets/seri.js',
  './assets/progress.js',
  './assets/app.js',
  './assets/favicon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './games/_engine.js',
  './games/sudoku.js','./games/gunluk-kelime.js','./games/blok.js','./games/solitaire.js','./games/mayin.js','./games/g2048.js','./games/nonogram.js','./games/balon.js','./games/renksirala.js','./assets/masa.js','./assets/ikili.js','./assets/tekrar.js','./games/tavla.js','./games/okey.js','./games/okey101.js','./games/batak.js','./games/king.js','./games/tombala.js','./games/mangala.js','./games/dokuztas.js','./games/amiral.js','./games/kelimemasasi.js','./games/neonyol.js','./games/pisti.js','./games/dama.js','./games/satranc.js','./games/kelimeavi.js','./games/kakuro.js','./games/boru.js','./games/hafiza.js','./games/kelimeturet.js','./games/birislem.js'
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
