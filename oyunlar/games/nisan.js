registerGame({
  id:'nisan', title:'Nişan Talimi', category:'Eğlence', tags:'aim trainer hedef vur hız',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  render(root, api){
    const DUR=30; let score, misses, timeLeft, tickT, target, startT, running;
    const hud=makeHUD(root,[{id:'skor',label:'İsabet',value:0},{id:'iska',label:'Iska',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const field=E('div',{style:{position:'relative',height:'min(58vh,360px)',borderRadius:'16px',background:'var(--bg2)',overflow:'hidden',cursor:'crosshair'}});
    root.append(field);
    const msg=E('div',{class:'g-msg'},'Başlamak için alana dokun.'); root.append(msg);
    field.addEventListener('pointerdown',e=>{
      if(!running){ start(); return; }
      // hedefe mi, boşluğa mı?
      if(e.target===target || target.contains(e.target)){ return; }
      misses++; hud.set('iska',misses);
    });
    function place(){ const r=field.getBoundingClientRect(); const size=Math.max(34,Math.min(64, r.width*0.14));
      const x=Math.random()*(r.width-size), y=Math.random()*(r.height-size);
      if(!target){ target=E('div'); Object.assign(target.style,{position:'absolute',borderRadius:'50%',
        background:'radial-gradient(circle at 35% 35%, #ff9d9d, var(--bad))',boxShadow:'0 4px 12px rgba(0,0,0,.2)',transition:'transform .05s'});
        target.addEventListener('pointerdown',e=>{ e.stopPropagation(); if(!running) return; score++; hud.set('skor',score); place(); });
        field.append(target); }
      Object.assign(target.style,{width:size+'px',height:size+'px',left:x+'px',top:y+'px'}); }
    function start(){ score=0; misses=0; timeLeft=DUR; running=true; hud.set('skor',0); hud.set('iska',0); hud.set('sure',DUR); msg.textContent=''; place();
      startT=Date.now(); clearInterval(tickT); tickT=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); }
    function end(){ running=false; clearInterval(tickT); if(target) target.remove(); target=null;
      const acc = score+misses>0 ? Math.round(score/(score+misses)*100):0;
      const sc = score*10 + Math.round(score*acc/20);
      msg.textContent='Süre doldu! '+score+' isabet, %'+acc+' isabet oranı · '+sc+' puan'; api.submitScore(sc); }
    api.onCleanup(()=> clearInterval(tickT));
    return ()=> clearInterval(tickT);
  }
});
