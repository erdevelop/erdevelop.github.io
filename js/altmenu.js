/* erdevelop · dil kulüpleri için telefonda uygulama gibi alt menü
   Sayfanın #tabs2 sekmelerinden kurulur; ana betikten SONRA yüklenir:
     <script src="js/altmenu.js"></script>
   Telefon genişliğinde (≤ 720 px) üstteki sekme düğmeleri gizlenir, ekranın altında sabit menü çıkar:
   ana 4 sekme + "Daha" (geri kalan sekmeler alttan açılan panelde). Masaüstünde hiçbir şey değişmez.
   Sayfanın global setTab(t) ve S.tab'ını kullanır. */
(function () {
  'use strict';
  const tb = document.getElementById('tabs2');
  if (!tb || typeof setTab !== 'function') return;
  const MAIN = ['kelime', 'konusma', 'yarisma', 'oda'];
  const all = [...tb.querySelectorAll('[data-t]')].map(b => {
    const s = b.textContent.trim(), m = s.match(/^(\S+)\s+(.+)$/);
    return { t: b.dataset.t, ic: m ? m[1] : '•', name: m ? m[2] : s };
  });
  const main = MAIN.map(t => all.find(x => x.t === t)).filter(Boolean), more = all.filter(x => !MAIN.includes(x.t));
  if (main.length < 2) return;

  const css = document.createElement('style');
  css.textContent = `
.bnav, .bsheet { display: none; }
@media (max-width: 720px) {
  #tabs2 [data-t] { display: none; }
  #tabs2 { position: static; padding: 0; margin-bottom: 8px; min-height: 0; }
  #tabs2 .acc { margin-left: auto; }
  body { padding-bottom: calc(68px + env(safe-area-inset-bottom)); }
  .toast { bottom: calc(78px + env(safe-area-inset-bottom)) !important; }
  .bnav { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; background: var(--panel); border-top: 1px solid var(--line);
    padding: 4px 4px env(safe-area-inset-bottom); box-shadow: 0 -4px 18px rgba(0,0,0,.06); }
  .bnav button { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 2px 7px; border: 0; background: none;
    color: var(--muted); font: 600 10.5px var(--f-body, system-ui); cursor: pointer; border-radius: 10px; -webkit-tap-highlight-color: transparent; }
  .bnav button .i { font-size: 21px; line-height: 1.1; filter: grayscale(.6); opacity: .8; transition: transform .15s; }
  .bnav button span:last-child { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bnav button.on { color: var(--accent); }
  .bnav button.on .i { filter: none; opacity: 1; transform: translateY(-1px) scale(1.08); }
  .bnav button.on::before { content: ""; position: absolute; }
  .bsheet { display: block; position: fixed; inset: 0; z-index: 59; background: rgba(0,0,0,.35); opacity: 0; pointer-events: none; transition: opacity .2s; }
  .bsheet.on { opacity: 1; pointer-events: auto; }
  .bsheet .in { position: absolute; left: 0; right: 0; bottom: 0; background: var(--panel); border-radius: 16px 16px 0 0; border-top: 1px solid var(--line);
    padding: 10px 14px calc(78px + env(safe-area-inset-bottom)); transform: translateY(100%); transition: transform .22s ease-out; }
  .bsheet.on .in { transform: none; }
  .bsheet .gr { width: 38px; height: 4px; border-radius: 4px; background: var(--line); margin: 0 auto 12px; }
  .bsheet .gd { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
  .bsheet .gd button { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 6px; border: 1px solid var(--line); border-radius: 12px;
    background: var(--panel-2, var(--bg)); color: var(--fg); font: 600 13px var(--f-body, system-ui); cursor: pointer; }
  .bsheet .gd button .i { font-size: 26px; }
  .bsheet .gd button.on { border-color: var(--accent); color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
}`;
  document.head.appendChild(css);

  const nav = document.createElement('nav'); nav.className = 'bnav'; nav.setAttribute('aria-label', 'Bölümler');
  const sheet = document.createElement('div'); sheet.className = 'bsheet'; sheet.setAttribute('aria-hidden', 'true');
  const btn = x => `<button type="button" data-t="${x.t}"><span class="i" aria-hidden="true">${x.ic}</span><span>${x.name}</span></button>`;
  sheet.innerHTML = `<div class="in" role="dialog" aria-label="Diğer bölümler"><div class="gr"></div><div class="gd">${more.map(btn).join('')}</div></div>`;
  document.body.appendChild(sheet); document.body.appendChild(nav);

  const cur = () => (typeof S !== 'undefined' && S.tab) || 'kelime';
  function paint() {
    const t = cur(), m = more.find(x => x.t === t);
    nav.innerHTML = main.map(btn).join('') + (more.length ? `<button type="button" data-more>${m ? `<span class="i">${m.ic}</span><span>${m.name}</span>` : '<span class="i">⋯</span><span>Daha</span>'}</button>` : '');
    nav.querySelectorAll('[data-t]').forEach(b => { const on = b.dataset.t === t; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    const mb = nav.querySelector('[data-more]'); if (mb) mb.classList.toggle('on', !!m);
    sheet.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  }
  const openSheet = o => { sheet.classList.toggle('on', o); sheet.setAttribute('aria-hidden', String(!o)); };
  /* sekme değişince içeriğin başına dön (aşağıdaysa) */
  function go(t) {
    openSheet(false); if (t !== cur()) setTab(t); else paint();
    const p = document.querySelector('.pane2.on'); if (!p) return;
    const y = p.getBoundingClientRect().top + scrollY - 64; if (scrollY > y) scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }
  nav.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-more')) { openSheet(!sheet.classList.contains('on')); return; } go(b.dataset.t); });
  sheet.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) go(b.dataset.t); else if (!e.target.closest('.in')) openSheet(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') openSheet(false); });
  /* sayfanın kendi setTab'ı çağrıldığında (üst sekmeler, bağlantılar, görevler) menü de güncellensin */
  const orig = setTab;
  setTab = function (t) { const r = orig.apply(this, arguments); paint(); return r; };
  paint();
})();
