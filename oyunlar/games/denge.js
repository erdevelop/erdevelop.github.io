registerGame({
  id:'denge', title:'Zamanlama', category:'Eğlence', tags:'timing denge çubuk dur',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h16M12 4v16"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
  render(root, api){
    const W=Math.min(340,(root.clientWidth||340)-20); let pos, vel, zoneC, zoneW, score, lives, over, loop, round;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'can',label:'Can',value:3}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,70);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'İşaretçi yeşil bölgedeyken DUR\'a bas.'); root.append(msg);
    const btn=E('button',{class:'g-btn',style:{display:'block',margin:'4px auto'}},'DUR');
    root.append(E('div',{style:{textAlign:'center'}},btn));
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    function reset(){ score=0; lives=3; round=0; over=false; hud.set('skor',0); hud.set('can',3); msg.textContent='Yeşildeyken bas.'; btn.textContent='DUR'; newRound(); if(!loop) loop=makeLoop(step,api); }
    function newRound(){ round++; pos=0; vel=(2.2+round*0.15)*(W/300); zoneW=Math.max(28, 70-round*2); zoneC=zoneW/2 + Math.random()*(W-zoneW); }
    function step(dt){ ctx.clearRect(0,0,W,70); ctx.fillStyle=cssVar('--bg2'); roundRect(0,26,W,18,9); ctx.fill();
      ctx.fillStyle=cssVar('--good'); roundRect(zoneC-zoneW/2,26,zoneW,18,9); ctx.fill();
      if(!over){ pos+=vel; if(pos<0||pos>W){ vel=-vel; pos=Math.max(0,Math.min(W,pos)); } }
      ctx.fillStyle=cssVar('--accent-ink'); ctx.fillRect(pos-2,20,4,30);
    }
    function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function stop(){ if(over){ reset(); return; }
      if(Math.abs(pos-zoneC)<=zoneW/2){ const bonus=Math.abs(pos-zoneC)<zoneW/6?3:1; score+=bonus; hud.set('skor',score); msg.textContent=bonus>1?'Tam ortası! +3':'İsabet +1'; newRound(); }
      else { lives--; hud.set('can',lives); msg.textContent='Iska!'; if(lives<=0){ over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için DUR'; btn.textContent='Tekrar'; api.submitScore(score); } else newRound(); } }
    btn.onclick=stop;
    function onKey(e){ if(e.key===' '){ e.preventDefault(); stop(); } }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
