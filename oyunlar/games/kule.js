registerGame({
  id:'kule', title:'Kule Yap', category:'Arcade', tags:'stack kule üst üste zamanlama',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="16" width="12" height="4"/><rect x="7" y="11" width="10" height="4"/><rect x="8" y="6" width="8" height="4"/></svg>',
  render(root, api){
    const W=Math.min(300,(root.clientWidth||340)-20), H=Math.round(W*1.4);
    const hud=makeHUD(root,[{id:'skor',label:'Kat',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Bloğu tam üstüne denk getir, dokun.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    const BH=26; let stack, cur, dir, score, over, loop, speed, baseW;
    const COLS=['#6c8cff','#3bb27a','#f6c85f','#e45858','#a06cff','#19b5b5'];
    function reset(){ baseW=W*0.5; stack=[{x:(W-baseW)/2,w:baseW}]; score=0; over=false; speed=2.6;
      spawn(); hud.set('skor',0); msg.textContent='Dokun ile bırak.'; if(!loop) loop=makeLoop(step,api); }
    function spawn(){ const top=stack[stack.length-1]; cur={x:0,w:top.w}; dir=1; }
    function camOff(){ return Math.max(0,(stack.length-6))*BH; }
    function yOf(i){ return H-20-(i+1)*BH+camOff(); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      stack.forEach((b,i)=>{ const yy=yOf(i); if(yy>H) return; ctx.fillStyle=COLS[i%COLS.length]; ctx.fillRect(b.x,yy,b.w,BH-3); });
      if(!over && cur){ cur.x+=dir*speed*(dt/16); if(cur.x+cur.w>W){ cur.x=W-cur.w; dir=-1; } if(cur.x<0){ cur.x=0; dir=1; }
        ctx.fillStyle=COLS[stack.length%COLS.length]; ctx.fillRect(cur.x,yOf(stack.length),cur.w,BH-3); }
    }
    function drop(){ if(over){ reset(); return; } const top=stack[stack.length-1];
      const left=Math.max(cur.x,top.x), right=Math.min(cur.x+cur.w,top.x+top.w); const overlap=right-left;
      if(overlap<=0){ over=true; msg.textContent='Kaçırdın! Kat: '+score+' · tekrar için dokun'; api.submitScore(score); if(api.sound)api.sound('lose'); return; }
      const perfect=Math.abs(cur.x-top.x)<4;
      stack.push({x:left,w:overlap}); score++; hud.set('skor',score);
      if(perfect){ if(api.sound)api.sound('good'); } else if(api.sound) api.sound('click');
      if(speed<6) speed+=0.12; spawn();
    }
    canvas.addEventListener('pointerdown',e=>{ e.preventDefault(); drop(); });
    function onKey(e){ if(e.key===' '){ e.preventDefault(); drop(); } }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
