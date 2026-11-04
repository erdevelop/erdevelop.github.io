/* Oyun motoru yardımcıları. Her oyun registerGame(...) ile kendini kaydeder.
   render(root, api) imzası:
     root  : oyunun içine çizileceği DOM düğümü (temizlenmiş gelir)
     api.submitScore(n)      -> Promise<{best,isNew,score}>, yeni rekorda toast
     api.saveState(obj)/loadState()
     api.best                -> mevcut en iyi skor (render anında)
     api.user                -> aktif kullanıcı ya da null
     api.onCleanup(fn)       -> ekran kapanınca çağrılır (timer/listener temizliği)
     api.toast(msg)
   render bir "cleanup" fonksiyonu da döndürebilir. */
window.GAMES = window.GAMES || [];
window.registerGame = function(def){ window.GAMES.push(def); };

/* Küçük DOM yardımcıları */
window.E = function(tag, attrs, ...kids){
  const n = document.createElement(tag);
  if(attrs) for(const k in attrs){
    if(k==='style' && typeof attrs[k]==='object') Object.assign(n.style, attrs[k]);
    else if(k==='class') n.className = attrs[k];
    else if(k.startsWith('on') && typeof attrs[k]==='function') n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
    else if(k==='html') n.innerHTML = attrs[k];
    else n.setAttribute(k, attrs[k]);
  }
  for(const kid of kids){ if(kid==null) continue; n.append(kid.nodeType?kid:document.createTextNode(kid)); }
  return n;
};

/* HUD (skor/süre göstergesi) kurar. keys: [{id,label}] döner: set(id,val) */
window.makeHUD = function(root, items){
  const wrap = E('div',{class:'g-hud'});
  const refs = {};
  items.forEach(it=>{
    const b = E('b',{},String(it.value??0));
    refs[it.id]=b;
    wrap.append(E('div',{class:'stat'}, E('small',{},it.label), b));
  });
  root.append(wrap);
  return { el:wrap, set:(id,v)=>{ if(refs[id]) refs[id].textContent=String(v); } };
};

/* Basit animasyon döngüsü; stop() ile durur, onCleanup'a bağlanır */
window.makeLoop = function(fn, api){
  let raf, last=performance.now(), running=true;
  function tick(t){ if(!running) return; const dt=Math.min(50,t-last); last=t; fn(dt); raf=requestAnimationFrame(tick); }
  raf=requestAnimationFrame(tick);
  const stop=()=>{ running=false; cancelAnimationFrame(raf); };
  if(api&&api.onCleanup) api.onCleanup(stop);
  return { stop, resume:()=>{ if(!running){ running=true; last=performance.now(); raf=requestAnimationFrame(tick);} } };
};

/* Retina'ya uygun canvas kurar */
window.fitCanvas = function(canvas, w, h){
  const dpr = Math.min(2, window.devicePixelRatio||1);
  canvas.width = w*dpr; canvas.height = h*dpr;
  canvas.style.width = w+'px'; canvas.style.height = h+'px';
  const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr); return ctx;
};
