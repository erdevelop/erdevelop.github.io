/* CODE sayfası · servis çalışanı (kapsam: /code/)
   Tek işi: Python worker'ının input() için yaptığı eşzamanlı isteği, kullanıcı konsolda cevap yazana kadar bekletmek.
   Başka hiçbir isteğe dokunmaz. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const bekleyen = new Map();
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (!u.pathname.endsWith('/sw-girdi')) return; // diğer her şey normal ağdan
  const id = u.searchParams.get('id');
  e.respondWith(new Promise(res => {
    bekleyen.set(id, res);
    setTimeout(() => { if (bekleyen.delete(id)) res('\u0004'); }, 30 * 60 * 1000); // 30 dk sonra iptal
  }).then(txt => new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })));
});
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.t !== 'girdi') return;
  const r = bekleyen.get(d.id);
  if (r) { bekleyen.delete(d.id); r(String(d.text)); }
});
