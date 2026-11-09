/* erdevelop · site geneli service worker
   Strateji: sayfalar her zaman önce ağdan alınır (güncel kalır), ağ yoksa son kaydedilen kopya açılır.
   Değişmeyen kütüphaneler (CDN, yazı tipleri) önbellekten verilir. Büyük dosyalar ve kendi service worker'ı olan klasörler önbelleğe alınmaz. */
const V = 'erdevelop-v1', PAGES = V + '-sayfa', LIBS = V + '-kutup';
const CORE = ['/', '/Tools.html', '/404.html', '/favicon.svg', '/kesif/tema.css', '/kesif/tema.js',
  '/kesif/ruzgar.html', '/kesif/cam.html', '/kesif/kar.html', '/kesif/profil.html', '/kesif/genlesme.html', '/kesif/yogusma.html', '/kesif/ucw.html', '/kesif/ral.html', '/kesif/gunes.html',
  '/arac_kutusu.html', '/YakitHesapla.html', '/cam-agirlik.html', '/cephe-bolme.html'];
const SKIP = [/^\/oyunlar\//, /^\/cephex\/pyodide\//, /^\/_/, /\.(zip|mp4|webm|mov|pdf)$/i];
const LIB_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const MAX = 3e6;
self.addEventListener('install', e => { e.waitUntil(caches.open(PAGES).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.startsWith(V)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const small = r => { const n = +r.headers.get('content-length'); return r.ok && (!n || n < MAX); };
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (SKIP.some(x => x.test(u.pathname))) return;
    e.respondWith(fetch(r).then(res => { if (small(res) && res.type === 'basic') { const cp = res.clone(); caches.open(PAGES).then(c => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: r.mode === 'navigate' }).then(m => m || (r.mode === 'navigate' ? caches.match('/Tools.html') : Response.error()))));
    return;
  }
  if (LIB_HOSTS.includes(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(LIBS).then(c => c.put(r, cp)); } return res; })));
  }
});
