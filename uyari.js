/* erdevelop · sorumluluk notu ve kullanım onayı
   Kullanım:
     <script src="/uyari.js" data-tur="muhendislik"></script>   → not + ilk kullanımda onay penceresi
     <script src="/uyari.js" data-tur="mali" data-kapsam="#t-kdv,#t-kredi"></script>
                                                                 → onay, yalnızca bu bölümlerle ilk etkileşimde
     <script src="/uyari.js" data-tur="egitim"></script>         → yalnızca not
     data-metin="..."  → notun metnini değiştirir
   Onay bu tarayıcıda sayfa başına ONAY_GUN gün hatırlanır. */
(() => {
  'use strict';
  const me = document.currentScript || document.querySelector('script[src*="uyari.js"]');
  const D = (me && me.dataset) || {};
  const tur = D.tur || 'genel', kapsam = D.kapsam || '';
  const ONAY_GUN = 90, SURUM = 1;
  const T = {
    muhendislik: {
      bas: 'Ön hesap · eğitim amaçlı',
      not: 'Bu araç sadeleştirilmiş bir yöntemle ön boyutlandırma yapar; statik hesap raporu ya da proje onayı yerine geçmez. Uygulamaya esas hesabı yetkili bir mühendise güncel standartlara göre yaptır.',
      onay: ['Bu araç <b>eğitim ve ön bilgi amaçlıdır</b>. Sadeleştirilmiş yöntemler kullanır; standartların tüm koşullarını, ulusal ekleri ve projeye özgü durumları kapsamaz.',
        'Sonuçlar <b>statik hesap raporu, proje onayı ya da uygunluk belgesi yerine geçmez</b>. Uygulamaya esas hesap yetkili bir mühendis tarafından yapılmalı ve onaylanmalıdır.',
        'Sonuçları kullanmanın <b>sorumluluğu tamamen kullanana aittir</b>; site sahibi bu sonuçlardan doğabilecek zararlardan sorumlu tutulamaz.']
    },
    mali: {
      bas: 'Bilgi amaçlı',
      not: 'Sonuçlar genel formüllerle hesaplanır. Vergi, faiz ve kur oranları değişebilir; kesin tutar için bankana ya da mali müşavirine danış.',
      onay: ['Mali hesaplayıcılar <b>bilgi amaçlıdır</b>; genel formüllerle hesap yapar. Yatırım, kredi ya da vergi danışmanlığı değildir.',
        'Vergi ve fon oranları (KDV, KKDF, BSMV, stopaj), faiz ve kurlar değişebilir; araçlardaki varsayılan değerler örnektir. <b>Kesin tutar için bankana ya da mali müşavirine danış.</b>',
        'Sonuçları kullanmanın <b>sorumluluğu tamamen kullanana aittir</b>; site sahibi bu sonuçlardan doğabilecek zararlardan sorumlu tutulamaz.']
    },
    egitim: {
      bas: 'Eğitim ve bilgi amaçlı',
      not: 'Bu içerik kendi kendine öğrenmek içindir; mesleki danışmanlık, resmi eğitim ya da sertifika yerine geçmez. Uygulamada güncel standartlara, üretici dokümanlarına ve yetkili uzman görüşüne başvur; içeriği kullanma sorumluluğu kullanana aittir.'
    },
    genel: { bas: 'Bilgi amaçlı', not: 'Sonuçlar ön bilgidir; önemli bir kararda ilgili uzmana ya da resmi kaynağa başvur.' }
  }[tur] || null;
  if (!T) return;

  const css = `.er-uyari{display:flex;gap:10px;align-items:flex-start;max-width:860px;margin:14px 0 4px;padding:10px 14px;border:1px solid color-mix(in srgb,var(--hot,#c8731f) 45%,transparent);background:color-mix(in srgb,var(--hot,#c8731f) 8%,transparent);border-radius:8px;font-size:13px;line-height:1.55;color:var(--text,inherit)}
.er-uyari b{color:var(--fg,inherit);font-weight:600}.er-uyari a{color:inherit;text-decoration:underline;white-space:nowrap}.er-uyari .i{font-size:15px;line-height:1.3}
.er-onay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(8,12,20,.62);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.er-onay .k{width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--panel,#fff);color:var(--fg,#1c2833);border:1px solid var(--line,#cfd8e1);border-radius:12px;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35);font:15px/1.55 var(--f-body,system-ui,-apple-system,'Segoe UI',sans-serif)}
.er-onay h2{font:700 1.2rem/1.25 var(--f-display,inherit);margin:0 0 4px}.er-onay .s{font-size:12.5px;color:var(--muted,#74838f);margin:0 0 12px}
.er-onay ul{margin:0 0 14px;padding-left:20px}.er-onay li{margin:6px 0;color:var(--text,inherit)}.er-onay li b{color:var(--fg,inherit)}
.er-onay label{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--line,#cfd8e1);border-radius:8px;cursor:pointer;font-weight:500}
.er-onay label input{width:18px;height:18px;margin:2px 0 0;flex:none;accent-color:var(--accent,#2f6fb5)}
.er-onay .b{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}
.er-onay .b a,.er-onay .b button{font:600 14px var(--f-body,inherit);border-radius:8px;padding:9px 16px;cursor:pointer;text-decoration:none;border:1px solid var(--line,#cfd8e1);background:none;color:var(--fg,inherit)}
.er-onay .b button{background:var(--accent,#2f6fb5);border-color:var(--accent,#2f6fb5);color:#fff}
:root[data-mode="dark"] .er-onay .b button{color:#1a1204}
.er-onay .b button:disabled{opacity:.45;cursor:not-allowed}
.er-onay .f{font-size:12px;color:var(--muted,#74838f);margin:12px 0 0}.er-onay .f a{color:inherit}
@media print{.er-uyari{border-color:#999;background:none}.er-onay{display:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* --- sayfa içi not --- */
  const box = document.createElement('aside'); box.className = 'er-uyari'; box.setAttribute('role', 'note');
  box.innerHTML = `<span class="i" aria-hidden="true">⚠</span><span><b>${T.bas}.</b> ${D.metin || T.not} <a href="/kullanim.html">Kullanım şartları</a></span>`;
  const place = () => {
    if (D.not === 'yok') return;
    const h = document.querySelector('main header.head, header.head, main .lead, .lead');
    if (h) h.after(box); else (document.querySelector('main') || document.body).prepend(box);
  };

  /* --- onay penceresi --- */
  const KEY = 'erdevelop-onay:' + tur + ':' + location.pathname;
  const ok = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.s === SURUM && Date.now() - v.t < ONAY_GUN * 864e5; } catch (e) { return false; } };
  let open = false;
  function ask(after) {
    if (!T.onay || ok() || open) { after && after(); return; }
    open = true;
    const prevFocus = document.activeElement;
    const w = document.createElement('div'); w.className = 'er-onay'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'er-onay-h');
    w.innerHTML = `<div class="k"><h2 id="er-onay-h">Kullanmadan önce</h2><p class="s">${esc(document.title.split('|')[0].trim())} · ${T.bas.toLowerCase()}</p>
      <ul>${T.onay.map(x => `<li>${x}</li>`).join('')}</ul>
      <label><input type="checkbox"> <span>Okudum ve anladım. Bu aracı eğitim ve ön bilgi amacıyla kullanacağımı, sonuçların sorumluluğunun bana ait olduğunu kabul ediyorum.</span></label>
      <div class="b"><a href="/Tools.html">Vazgeç</a><button type="button" disabled>Onayla ve devam et</button></div>
      <p class="f">Onayın bu tarayıcıda ${ONAY_GUN} gün hatırlanır. Ayrıntılar: <a href="/kullanim.html" target="_blank" rel="noopener">Kullanım şartları</a></p></div>`;
    document.body.appendChild(w);
    const cb = w.querySelector('input'), bt = w.querySelector('button');
    const rest = [...document.body.children].filter(e => e !== w && e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE');
    rest.forEach(e => { e.setAttribute('inert', ''); e.setAttribute('aria-hidden', 'true'); });
    const prevOv = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    cb.addEventListener('change', () => { bt.disabled = !cb.checked; });
    bt.addEventListener('click', () => {
      try { localStorage.setItem(KEY, JSON.stringify({ s: SURUM, t: Date.now() })); } catch (e) { }
      rest.forEach(e => { e.removeAttribute('inert'); e.removeAttribute('aria-hidden'); });
      document.documentElement.style.overflow = prevOv; w.remove(); open = false;
      if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { }
      after && after();
    });
    w.addEventListener('keydown', e => { if (e.key === 'Tab') { const f = [cb, bt, ...w.querySelectorAll('a')].filter(x => !x.disabled); const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } } });
    setTimeout(() => cb.focus(), 30);
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const start = () => {
    place();
    if (!T.onay) return;
    if (!kapsam) { ask(); return; }
    /* kapsam: yalnızca belirtilen bölümlerle ilk etkileşimde sor */
    const hit = e => { const el = e.target.closest && e.target.closest(kapsam); if (!el || ok() || open) return; e.preventDefault(); e.stopPropagation(); if (e.target.blur) e.target.blur(); ask(() => { const t = e.target; if (t && t.focus) t.focus(); }); };
    document.addEventListener('pointerdown', hit, true); document.addEventListener('focusin', hit, true); document.addEventListener('keydown', hit, true);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
