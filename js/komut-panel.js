/* Butonlu komut paneli: oyunlar konsolda panel() yazınca açılan sekmeli, butonlu, girişli bir pencere kurar.
   Kullanım: const P = KomutPanel({ baslik, renk, sekmeler: [['id', 'Ad'], ...], ciz: sek => html, tik: (k, v, el, olay) => {}, canli: ['bilgi'] });
   P.ac('sekme'), P.kapat(), P.ciz(), P.not('mesaj', hata) */
(function () {
  'use strict';
  if (window.KomutPanel) return;
  const T = (a, b) => (window.erDil && erDil.t ? erDil.t(a, b) : a);
  const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  let stil = false;
  function stilKur(renk) {
    if (stil) return; stil = true;
    const s = document.createElement('style');
    s.textContent = `
#kpPanel{--kpa:${renk};position:fixed;right:12px;top:calc(12px + env(safe-area-inset-top,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));width:390px;z-index:9000;display:flex;flex-direction:column;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:rgba(22,18,12,.95);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#F3ECDC;font:600 13.5px/1.4 Nunito,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.55)}
#kpPanel[hidden]{display:none}
#kpPanel .kpBas{display:flex;align-items:center;gap:8px;padding:12px 14px 8px;font-weight:900;font-size:15px}
#kpPanel .kpBas small{font-weight:700;font-size:11px;color:#BFB49A}
#kpPanel .kpBas button{margin-left:auto;width:30px;height:30px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:inherit;font-size:14px;cursor:pointer}
#kpPanel .kpSek{display:flex;gap:4px;padding:0 10px 8px;border-bottom:1px solid rgba(255,255,255,.1);overflow-x:auto}
#kpPanel .kpSek button{flex:1;padding:7px 6px;border-radius:9px;border:1px solid transparent;background:none;color:#BFB49A;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap}
#kpPanel .kpSek button.sec{background:color-mix(in srgb,var(--kpa) 18%,transparent);border-color:color-mix(in srgb,var(--kpa) 55%,transparent);color:#F3ECDC}
#kpPanel .kpIc{flex:1;overflow-y:auto;padding:10px 14px 14px;overscroll-behavior:contain}
#kpPanel h4{margin:14px 0 6px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#BFB49A;font-weight:800}
#kpPanel h4:first-child{margin-top:2px}
#kpPanel .kpKv{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)}
#kpPanel .kpKv span{color:#BFB49A}#kpPanel .kpKv b{text-align:right;font-variant-numeric:tabular-nums;font-weight:800}
#kpPanel .kpSat{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0}
#kpPanel .kpSat>label{flex:1;min-width:96px;font-weight:700}
#kpPanel button.kB{padding:6px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap}
#kpPanel button.kB:hover{background:rgba(255,255,255,.12)}
#kpPanel button.kB.kAna{background:var(--kpa);border-color:var(--kpa);color:#201406}
#kpPanel button.kB.eksi{border-color:rgba(255,138,122,.5);color:#FFC9C0}
#kpPanel button.kB.sec{background:color-mix(in srgb,var(--kpa) 28%,transparent);border-color:var(--kpa)}
#kpPanel button.kB.tehlike{border-color:rgba(255,110,90,.6);background:rgba(255,90,70,.12);color:#FFD2CB;width:100%;text-align:left;padding:9px 12px}
#kpPanel button.kB:disabled{opacity:.4;cursor:default}
#kpPanel input[type=number],#kpPanel input[type=text],#kpPanel select{font:inherit;font-size:13px;padding:6px 8px;border-radius:9px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.35);color:inherit;min-width:0}
#kpPanel input[type=number]{width:84px}#kpPanel input[type=text]{flex:1}
#kpPanel input[type=range]{flex:1;accent-color:var(--kpa)}
#kpPanel .kpAc{font-size:11.5px;color:#BFB49A;margin:2px 0 4px;line-height:1.45}
#kpPanel .kpUyari{padding:8px 10px;border-radius:10px;background:rgba(255,190,60,.12);border:1px solid rgba(255,190,60,.4);color:#FFE2A8;font-size:12px;line-height:1.45}
#kpPanel .kpIzgara{display:grid;grid-template-columns:1fr 1fr;gap:5px}
#kpPanel .kpIzgara button.kB{text-align:left;white-space:normal}
#kpPanel .kpNot{min-height:18px;padding:6px 14px;border-top:1px solid rgba(255,255,255,.1);font-size:12px;color:#9FF0C8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#kpPanel .kpNot.hata{color:#FF9A8A}
@media (max-width:640px){#kpPanel{left:8px;right:8px;top:auto;width:auto;height:74vh;bottom:calc(8px + env(safe-area-inset-bottom,0px))}}`;
    document.head.appendChild(s);
  }
  window.KomutPanel = function (cfg) {
    stilKur(cfg.renk || '#F2A64B');
    const el = document.createElement('div'); el.id = 'kpPanel'; el.hidden = true; el.setAttribute('role', 'dialog');
    el.innerHTML = `<div class="kpBas"><span>${cfg.baslik}</span><small>${esc(T('konsol: panel()', 'console: panel()'))}</small><button type="button" data-kp="kapat" aria-label="${esc(T('Kapat', 'Close'))}">✕</button></div><div class="kpSek"></div><div class="kpIc"></div><div class="kpNot"></div>`;
    document.body.appendChild(el);
    const P = { el, sek: cfg.sekmeler[0][0] };
    const ic = el.querySelector('.kpIc');
    P.not = (m, hata) => { const n = el.querySelector('.kpNot'); n.textContent = m || ''; n.classList.toggle('hata', !!hata); };
    P.ciz = () => {
      el.querySelector('.kpSek').innerHTML = cfg.sekmeler.map(([id, ad]) => `<button type="button" data-kps="${id}" class="${id === P.sek ? 'sec' : ''}">${ad}</button>`).join('');
      const y = ic.scrollTop; try { ic.innerHTML = cfg.ciz(P.sek); } catch (e) { ic.innerHTML = '<div class="kpUyari">' + esc(e.message) + '</div>'; } ic.scrollTop = y;
    };
    P.ac = s => { if (s && cfg.sekmeler.some(q => q[0] === s)) P.sek = s; el.hidden = false; P.ciz(); };
    P.kapat = () => { el.hidden = true; };
    const olay = e => {
      if (e.target.closest('[data-kp="kapat"]')) { if (e.type === 'click') P.kapat(); return; }
      const sb = e.target.closest('[data-kps]'); if (sb) { if (e.type === 'click') { P.sek = sb.dataset.kps; P.not(''); P.ciz(); } return; }
      const b = e.target.closest('[data-k]'); if (!b || b.disabled) return;
      const tag = b.tagName, degisir = tag === 'SELECT' || (tag === 'INPUT' && b.type !== 'button');
      if (e.type === 'click' && degisir) return; if ((e.type === 'change' || e.type === 'input') && !degisir) return;
      if (e.type === 'input' && b.type !== 'range') return;
      try { const r = cfg.tik(b.dataset.k, b.dataset.v, b, e.type); if (typeof r === 'string') P.not(r); if (e.type === 'click' && r !== false) P.ciz(); } catch (er) { P.not(er.message, true); }
    };
    el.addEventListener('click', olay); el.addEventListener('change', olay); el.addEventListener('input', olay);
    el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') P.kapat(); });
    el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
    setInterval(() => { if (el.hidden || !(cfg.canli || []).includes(P.sek)) return; const a = document.activeElement; if (a && el.contains(a) && (a.tagName === 'INPUT' || a.tagName === 'SELECT')) return; P.ciz(); }, 1000);
    return P;
  };
  window.KomutPanel.esc = esc;
  window.KomutPanel.kv = o => '<div class="kpKv">' + Object.entries(o).map(([k, v]) => `<span>${esc(k)}</span><b>${esc(v)}</b>`).join('') + '</div>';
  window.KomutPanel.indir = (ad, veri) => { const b = new Blob([JSON.stringify(veri, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = ad; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  window.KomutPanel.dosyaSec = fn => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json'; i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { fn(JSON.parse(r.result)); } catch (e) { fn(null, e); } }; r.readAsText(f); }; i.click(); };
})();
