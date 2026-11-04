registerGame({
  id:'dino', title:'Koşu & Zıpla', category:'Arcade', tags:'dino runner engel zıpla koş',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16M7 20v-4l3-1 1-4h3l1 3 2 1v5"/><circle cx="14" cy="6" r="1.5"/></svg>',
  render(root, api){
    const W=Math.min(360,(root.clientWidth||340)-20), H=Math.round(W*0.6);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Dokun ya da boşluk ile zıpla.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    const groundY=H-24; let y, vy, onGround, obs, score, over, loop, spawnAcc, speed, started;
    function reset(){ y=groundY; vy=0; onGround=true; obs=[]; score=0; over=false; spawnAcc=0; speed=4; started=false;
      hud.set('skor',0); msg.textContent='Dokun ile başla & zıpla.'; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      ctx.strokeStyle=cssVar('--ink-soft'); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,groundY+2); ctx.lineTo(W,groundY+2); ctx.stroke();
      // koşucu
      ctx.fillStyle=cssVar('--accent-ink'); const s=20; ctx.fillRect(30-s/2,y-s,s,s);
      ctx.fillStyle='#fff'; ctx.fillRect(30+2,y-s+4,4,4);
      if(started && !over){ vy+=0.8; y+=vy; if(y>=groundY){ y=groundY; vy=0; onGround=true; }
        spawnAcc+=dt; const gap=Math.max(650,1300-score*3); if(spawnAcc>gap+Math.random()*400){ spawnAcc=0; const big=Math.random()<0.3; obs.push({x:W+10,w:big?26:16,h:big?34:24}); }
        if(score%10===0 && speed<9) speed+=0.002*dt; }
      ctx.fillStyle=cssVar('--good');
      for(let i=obs.length-1;i>=0;i--){ const o=obs[i]; if(started&&!over) o.x-=speed*(dt/16);
        ctx.fillRect(o.x,groundY-o.h,o.w,o.h);
        if(30+10>o.x && 30-10<o.x+o.w && y>groundY-o.h){ over=true; msg.textContent='Çarptın! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); }
        if(o.x+o.w<0){ obs.splice(i,1); if(!over){ score++; hud.set('skor',score); } } }
    }
    function jump(){ if(over){ reset(); return; } if(!started){ started=true; msg.textContent=''; }
      if(onGround){ vy=-13; onGround=false; if(api.sound) api.sound('click'); } }
    canvas.addEventListener('pointerdown',e=>{ e.preventDefault(); jump(); });
    function onKey(e){ if(e.key===' '||e.key==='ArrowUp'){ e.preventDefault(); jump(); } }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
