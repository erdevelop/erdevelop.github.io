/* Tekrar — biten bir oyunu hamle hamle yeniden izletmek için küçük yardımcı. Oyun her durum değişiminde kaydet(S) çağırır;
   bitişte baslat({ kok, koy(S), bitince() }) ile alt çubukta ⏮ ◀ ▶ ⏯ ✕ düğmeleri çıkar. Durumlar yalnız bellekte tutulur. */
(function () {
'use strict';
const CSS = `.tk-cubuk{position:sticky;bottom:6px;z-index:45;display:flex;gap:6px;align-items:center;padding:7px;border-radius:14px;background:var(--card);box-shadow:0 6px 20px rgba(0,0,0,.25);margin-top:6px}
.tk-cubuk button{flex:1;padding:9px 0;border-radius:10px;background:var(--accent-soft);color:var(--accent-ink);font-weight:900;font-size:15px}.tk-cubuk span{font-weight:800;font-size:12.5px;min-width:70px;text-align:center}
.tk-cubuk input{flex:3;min-width:60px;accent-color:var(--accent)}`;
window.Tekrar = function () {
  let K = [], son = '', aktif = null;
  return {
    get aktif() { return !!aktif; },
    kaydet(S) { if (aktif || !S) return; const j = JSON.stringify(S); if (j === son) return; son = j; K.push(j); if (K.length > 800) K.shift(); },
    sifirla() { if (aktif) return; K = []; son = ''; },
    var() { return K.length > 2; },
    baslat(o) {
      if (aktif || K.length < 2) return; if (!document.getElementById('tk-css')) { const s = document.createElement('style'); s.id = 'tk-css'; s.textContent = CSS; document.head.appendChild(s); }
      const bar = document.createElement('div'); bar.className = 'tk-cubuk';
      bar.innerHTML = '<button data-t="bas">⏮</button><button data-t="geri">◀</button><input type="range" min="0" max="' + (K.length - 1) + '" value="0"><span></span><button data-t="ileri">▶</button><button data-t="oynat">⏯</button><button data-t="kapat">✕</button>';
      o.kok.appendChild(bar); aktif = { k: 0, t: 0, bar, o };
      const git = k => { k = Math.max(0, Math.min(K.length - 1, k)); aktif.k = k; bar.querySelector('input').value = k; bar.querySelector('span').textContent = k + ' / ' + (K.length - 1); o.koy(JSON.parse(K[k])); };
      const dur = () => { clearInterval(aktif.t); aktif.t = 0; };
      bar.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; e.stopPropagation(); const t = b.dataset.t; dur();
        if (t === 'bas') git(0); else if (t === 'geri') git(aktif.k - 1); else if (t === 'ileri') git(aktif.k + 1);
        else if (t === 'oynat') { if (aktif.k >= K.length - 1) git(0); aktif.t = setInterval(() => { if (!aktif || aktif.k >= K.length - 1) return dur(); git(aktif.k + 1); }, 800); }
        else if (t === 'kapat') { const x = aktif; bar.remove(); aktif = null; x.o.koy(JSON.parse(K[K.length - 1])); x.o.bitince && x.o.bitince(); } });
      bar.querySelector('input').addEventListener('input', e => { dur(); git(+e.target.value); });
      git(0);
    },
    kapat() { if (!aktif) return; clearInterval(aktif.t); aktif.bar.remove(); aktif = null; }
  };
};
})();
