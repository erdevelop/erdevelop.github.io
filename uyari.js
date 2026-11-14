/* erdevelop · sorumluluk notu
   Kullanım: <script src="/uyari.js" data-tur="muhendislik" defer></script>
   Türler: muhendislik (cephe, statik, yapı fiziği), mali, genel */
(() => {
  'use strict';
  const me = document.currentScript || document.querySelector('script[src*="uyari.js"]');
  const tur = (me && me.dataset.tur) || 'genel';
  const T = {
    muhendislik: ['Ön hesap · eğitim amaçlı', 'Bu araç sadeleştirilmiş bir yöntemle ön boyutlandırma yapar; statik hesap raporu ya da proje onayı yerine geçmez. Uygulamaya esas hesabı yetkili bir mühendise güncel standartlara göre yaptır.'],
    mali: ['Bilgi amaçlı', 'Sonuçlar genel formüllerle hesaplanır. Vergi, faiz ve kur oranları değişebilir; kesin tutar için bankana ya da mali müşavirine danış.'],
    genel: ['Eğitim ve ön bilgi amaçlı', 'Sonuçlar ön tahmindir; önemli bir kararda ilgili uzmana doğrulat.']
  }[tur] || null;
  if (!T) return;
  const css = `.er-uyari{display:flex;gap:10px;align-items:flex-start;max-width:860px;margin:14px 0 4px;padding:10px 14px;border:1px solid color-mix(in srgb,var(--hot,#c8731f) 45%,transparent);background:color-mix(in srgb,var(--hot,#c8731f) 8%,transparent);border-radius:8px;font-size:13px;line-height:1.55;color:var(--text,inherit)}
.er-uyari b{color:var(--fg,inherit);font-weight:600}.er-uyari a{color:inherit;text-decoration:underline;white-space:nowrap}.er-uyari .i{font-size:15px;line-height:1.3}
@media print{.er-uyari{border-color:#999;background:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const box = document.createElement('aside'); box.className = 'er-uyari'; box.setAttribute('role', 'note');
  box.innerHTML = `<span class="i" aria-hidden="true">⚠</span><span><b>${T[0]}.</b> ${T[1]} <a href="/kullanim.html">Kullanım şartları</a></span>`;
  const place = () => {
    const h = document.querySelector('main header.head, header.head, main .lead, .lead');
    if (h) (h.tagName === 'P' ? h : h).after(box);
    else { const m = document.querySelector('main') || document.body; m.prepend(box); }
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', place) : place();
})();
